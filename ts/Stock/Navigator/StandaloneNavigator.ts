/* *
 *
 *  (c) 2010-2024 Mateusz Bernacik
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type { StandaloneNavigatorOptions } from './NavigatorOptions';
import type { SeriesOptions } from '../../Core/Series/SeriesOptions';
import type { Options } from '../../Core/Options';
import Chart from '../../Core/Chart/Chart.js';
import Navigator, { SetRangeEvent } from './Navigator.js';
import G from '../../Core/Globals.js';
import U from '../../Core/Utilities.js';
import Axis from '../../Core/Axis/Axis.js';
import standaloneNavigatorDefaults from './StandaloneNavigatorDefaults.js';
const {
    merge,
    addEvent,
    fireEvent,
    pick
} = U;

declare module '../../Core/GlobalsLike.d.ts' {
    interface GlobalsLike {
        navigators: Array<StandaloneNavigator>;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The StandaloneNavigator class. The StandaloneNavigator class allows for
 * creating a standalone navigator component that synchronizes the extremes
 * across multiple bound charts.
 *
 * @class
 * @name Highcharts.StandaloneNavigator
 *
 * @param {string|Highcharts.HTMLDOMElement} [renderTo]
 * The DOM element to render to, or its id.
 *
 * @param {StandaloneNavigatorOptions} userOptions
 * The standalone navigator options.
 */
class StandaloneNavigator {

    public navigator: Navigator;
    public boundAxes: Array<{ axis: Axis, callbacks: Array<Function> }> = [];
    public chartOptions: Partial<Options>;
    public userOptions: StandaloneNavigatorOptions;

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Factory function for standalone navigator.
     *
     * @function Highcharts.navigator
     *
     * @param {string|Highcharts.HTMLDOMElement} [renderTo]
     * The DOM element to render to, or its id.
     *
     * @param {StandaloneNavigatorOptions} options
     * The standalone navigator options with chart-like structure.
     *
     * Returns the navigator object.
     */
    public static navigator(
        renderTo: (string|globalThis.HTMLElement),
        options: StandaloneNavigatorOptions
    ): StandaloneNavigator {
        const nav = new StandaloneNavigator(renderTo, options);

        if (!G.navigators) {
            G.navigators = [nav];
        } else {
            G.navigators.push(nav);
        }

        return nav;
    }


    /* *
     *
     *  Constructor
     *
     * */

    constructor(
        element: (string | globalThis.HTMLElement),
        userOptions: StandaloneNavigatorOptions
    ) {
        this.userOptions = userOptions;
        this.chartOptions = merge(
            (G as any).getOptions(),
            standaloneNavigatorDefaults,
            userOptions.chart,
            { navigator: userOptions }
        );

        if (this.chartOptions.chart && userOptions.height) {
            this.chartOptions.chart.height = userOptions.height;
        }

        const chart = new Chart(element, this.chartOptions);

        chart.options = merge(
            chart.options,
            { navigator: { enabled: true }, scrollbar: { enabled: true } }
        );

        if (this.chartOptions.navigator && this.chartOptions.scrollbar) {
            this.chartOptions.navigator.enabled = true;
            this.chartOptions.scrollbar.enabled = true;
        }

        this.navigator = new Navigator(chart);
        chart.navigator = this.navigator;
        this.initNavigator();
    }

    /**
     * Binds an axis to the standalone navigator,
     * allowing the navigator to control the axis' range.
     *
     * @sample stock/standalone-navigator/bind/
     *         Bind chart with a button
     *
     * @function Highcharts.StandaloneNavigator#bind
     *
     * @param {Axis | Chart} axisOrChart
     *        The Axis or Chart to bind to the navigator.
     *
     * @param {boolean} [twoWay=true]
     *        Enables two-way binding between the navigator and the axis/chart.
     *        When true, changes in the navigator's range will update the axis
     *        and vice versa. When false, changes in the navigator's range will
     *        be reflected in the axis, but changes in the axis ranges won't be
     *        reflected on the navigator.
     */
    public bind(axisOrChart: Axis | Chart, twoWay: boolean = true): void {
        const nav = this;
        // If the chart is passed, bind the first xAxis
        const axis = (axisOrChart instanceof Chart) ?
            axisOrChart.xAxis[0] :
            axisOrChart;

        if (!(axis instanceof Axis)) {
            return;
        }

        const { min, max } = this.navigator.xAxis,
            removeEventCallbacks = [];

        if (twoWay) {
            const removeSetExtremesEvent = addEvent(
                axis,
                'setExtremes',
                (e: AnyRecord): void => {
                    if (
                        e.trigger === 'pan' ||
                        e.trigger === 'zoom' ||
                        e.trigger === 'mouseWheelZoom'
                    ) {
                        nav.setRange(
                            e.min,
                            e.max,
                            true,
                            e.trigger !== 'pan',
                            { trigger: axis }
                        );
                    }
                });

            removeEventCallbacks.push(removeSetExtremesEvent);
        }

        const removeSetRangeEvent = addEvent(
            this.navigator,
            'setRange',
            (e: SetRangeEvent): void => {
                axis.setExtremes(e.min, e.max, e.redraw, e.animation);
            }
        );
        removeEventCallbacks.push(removeSetRangeEvent);

        let boundAxis = this.boundAxes.filter(function (boundAxis): boolean {
            return boundAxis.axis === axis;
        })[0];

        if (!boundAxis) {
            boundAxis = { axis, callbacks: [] };
            this.boundAxes.push(boundAxis);
        }
        boundAxis.callbacks = removeEventCallbacks;

        // Show axis' series in navigator based on showInNavigator property
        axis.series.forEach((series): void => {
            if (series.options.showInNavigator) {
                nav.addSeries(series.options);
            }
        });

        // Set extremes to match the navigator's extremes
        axis.setExtremes(min, max);

        // Unbind the axis before it's destroyed
        addEvent(axis, 'destroy', (e: AnyRecord): void => {
            if (!e.keepEvents) {
                this.unbind(axis);
            }
        });
    }

    /**
     * Unbinds a single axis or all bound axes from the standalone navigator.
     *
     * @sample stock/standalone-navigator/unbind/
     *         Unbind chart with a button
     *
     * @function Highcharts.StandaloneNavigator#unbind
     *
     * @param {Chart | Axis | undefined} axisOrChart
     *        Passing a Chart object unbinds the first X axis of the chart,
     *        an Axis object unbinds that specific axis,
     *        and undefined unbinds all axes bound to the navigator.
     */
    public unbind(axisOrChart?: Chart | Axis): void {
        // If no axis or chart is provided, unbind all bound axes
        if (!axisOrChart) {
            this.boundAxes.forEach(({ callbacks }): void => {
                callbacks.forEach(
                    (removeCallback): void => removeCallback()
                );
            });

            this.boundAxes.length = 0;

            return;
        }

        const axis = (axisOrChart instanceof Axis) ?
            axisOrChart :
            axisOrChart.xAxis[0];

        for (let i = this.boundAxes.length - 1; i >= 0; i--) {
            if (this.boundAxes[i].axis === axis) {
                this.boundAxes[i].callbacks.forEach(
                    (callback): void => callback()
                );
                this.boundAxes.splice(i, 1);
            }
        }
    }

    /**
     * Destroys allocated standalone navigator elements.
     *
     * @function Highcharts.StandaloneNavigator#destroy
     */
    public destroy(): void {
        // Disconnect events
        this.boundAxes.forEach(({ callbacks }): void => {
            callbacks.forEach(
                (removeCallback): void => removeCallback()
            );
        });
        this.boundAxes.length = 0;
        this.navigator.destroy();
        this.navigator.chart.destroy();
    }

    /**
     * Updates the standalone navigator's options with a new set of user
     * options.
     *
     * @sample stock/standalone-navigator/update/
     *         Bind chart with a button
     *
     * @function Highcharts.StandaloneNavigator#update
     *
     * @param  {StandaloneNavigatorOptions} newOptions
     *         Updates the standalone navigator's options with new user options.
     *
     * @param  {boolean | undefined} redraw
     *         Whether to redraw the standalone navigator. By default, if not
     *         specified, the standalone navigator will be redrawn.
     */
    public update(
        newOptions: StandaloneNavigatorOptions,
        redraw?: boolean
    ): void {
        this.chartOptions = merge(
            this.chartOptions,
            newOptions.height && { chart: { height: newOptions.height } },
            newOptions.chart,
            { navigator: newOptions }
        );

        this.navigator.chart.update(this.chartOptions, redraw);
    }

    /**
     * Redraws the standalone navigator.
     *
     * @function Highcharts.StandaloneNavigator#redraw
     */
    public redraw(): void {
        this.navigator.chart.redraw();
    }

    /**
     * Adds a series to the standalone navigator.
     *
     * @private
     *
     * @param {SeriesOptions} seriesOptions
     *        Options for the series to be added to the navigator.
     */
    public addSeries(seriesOptions: SeriesOptions): void {
        this.navigator.chart.addSeries(merge(
            seriesOptions,
            { showInNavigator: pick(seriesOptions.showInNavigator, true) }
        ));

        this.navigator.setBaseSeries();
    }

    /**
     * Initialize the standalone navigator.
     *
     * @private
     */
    public initNavigator(): void {
        const nav = this.navigator;
        nav.top = 1;
        nav.xAxis.setScale();
        nav.yAxis.setScale();
        nav.xAxis.render();
        nav.yAxis.render();
        nav.series?.forEach((s): void => {
            s.translate();
            s.render();
            s.redraw();
        });

        const { min, max } = this.getInitialExtremes();

        nav.chart.xAxis[0].userMin = min;
        nav.chart.xAxis[0].userMax = max;

        nav.render(min, max);
    }

    /**
     * Get the current range of the standalone navigator.
     *
     * @sample stock/standalone-navigator/getrange/
     *         Report the standalone navigator's range by clicking on a button
     *
     * @function Highcharts.StandaloneNavigator#getRange
     *
     * @return {Highcharts.ExtremesObject}
     *         The current range of the standalone navigator.
     */
    public getRange(): Axis.ExtremesObject {
        const { min, max } = this.navigator.chart.xAxis[0].getExtremes(),
            { userMin, userMax, min: dataMin, max: dataMax } =
                this.navigator.xAxis.getExtremes();

        return {
            min: pick(min, dataMin),
            max: pick(max, dataMax),
            dataMin,
            dataMax,
            userMin,
            userMax
        };
    }

    /**
     * Set the range of the standalone navigator.
     *
     * @sample stock/standalone-navigator/setrange/
     *         Set range from a button
     *
     * @function Highcharts.StandaloneNavigator#setRange
     *
     * @param {number | undefined} min
     *        The new minimum value.
     *
     * @param {number | undefined} max
     *        The new maximum value.
     *
     * @emits Highcharts.StandaloneNavigator#event:setRange
     */
    public setRange(
        min?: number,
        max?: number,
        redraw?: boolean,
        animation?: boolean,
        eventArguments?: AnyRecord
    ): void {
        fireEvent(
            this.navigator,
            'setRange',
            {
                min,
                max,
                redraw,
                animation,
                eventArguments: merge(eventArguments, { trigger: 'navigator' })
            }
        );
    }

    /**
     * Get the initial, options based extremes for the standalone navigator.
     *
     * @private
     *
     * @return {{ min: number, max: number }}
     *         The initial minimum and maximum extremes values.
     */
    public getInitialExtremes(): { min: number, max: number } {
        const { min, max } = this.navigator.xAxis.getExtremes();

        return {
            min: min,
            max: max
        };
    }
}

export default StandaloneNavigator;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Standalone Navigator options.
 *
 * @interface Highcharts.StandaloneNavigatorOptions
 *//**
 */

''; // Detach doclets above
