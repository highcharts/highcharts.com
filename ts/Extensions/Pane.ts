/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type ColorType from '../Core/Color/ColorType';
import type RadialAxis from '../Core/Axis/RadialAxis';
import type Series from '../Core/Series/Series';
import type SVGAttributes from '../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import Chart from '../Core/Chart/Chart.js';
import CU from '../Series/CenteredUtilities.js';
import H from '../Core/Globals.js';
import { Palette } from '../Core/Color/Palettes.js';
import Pointer from '../Core/Pointer.js';
import U from '../Core/Utilities.js';
const {
    addEvent,
    correctFloat,
    defined,
    extend,
    merge,
    pick,
    splat
} = U;

declare module '../Core/Axis/AxisLike' {
    interface AxisLike {
        pane?: Pane;
    }
}

declare module '../Core/Chart/ChartLike'{
    interface ChartLike {
        pane?: Array<Highcharts.Pane>;
        hoverPane?: Highcharts.Pane;
        getHoverPane?(eventArgs: any): Highcharts.Pane|undefined;
    }
}

declare module '../Core/Options'{
    interface Options {
        pane?: Highcharts.PaneOptions|Array<Highcharts.PaneOptions>;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        type PaneBackgroundShapeValue = ('arc'|'circle'|'solid');
        interface PaneBackgroundOptions {
            backgroundColor?: ColorType;
            borderColor?: ColorType;
            borderWidth?: number;
            className?: string;
            from?: number;
            innerRadius?: (number|string);
            outerRadius?: (number|string);
            shape?: PaneBackgroundShapeValue;
            to?: number;
        }
        interface PaneChart extends Chart {
            pane: Array<Pane>;
            getHoverPane(eventArgs: any): Pane|undefined;
        }
        interface PaneOptions {
            background?: Array<PaneBackgroundOptions>;
            center?: Array<(string|number)>;
            endAngle?: number;
            innerSize?: (number|string);
            size?: (number|string);
            startAngle?: number;
            zIndex?: number;
        }
        class Pane {
            public constructor(options: PaneOptions, chart: Chart);
            public axis?: RadialAxis.AxisComposition;
            public background: Array<SVGElement>;
            public center: Array<number>;
            public chart: PaneChart;
            public coll: 'pane';
            public defaultBackgroundOptions: PaneBackgroundOptions;
            public defaultOptions: PaneOptions;
            public group?: SVGElement;
            public options: PaneOptions;
            public init(options: PaneOptions, chart: Chart): void;
            public render(): void;
            public renderBackground(
                backgroundOptions: PaneBackgroundOptions,
                i: number
            ): void;
            public setOptions(options: PaneOptions): void;
            public update(options: PaneOptions, redraw?: boolean): void;
            public updateCenter(axis?: RadialAxis.AxisComposition): void;
        }
    }
}

/**
 * @typedef {"arc"|"circle"|"solid"} Highcharts.PaneBackgroundShapeValue
 */

/* eslint-disable no-invalid-this, valid-jsdoc */

Chart.prototype.collectionsWithUpdate.push('pane');

/**
 * The Pane object allows options that are common to a set of X and Y axes.
 *
 * In the future, this can be extended to basic Highcharts and Highcharts Stock.
 *
 * @private
 * @class
 * @name Highcharts.Pane
 * @param {Highcharts.PaneOptions} options
 * @param {Highcharts.Chart} chart
 */
class Pane {
    public constructor(
        options: Highcharts.PaneOptions,
        chart: Highcharts.PaneChart
    ) {
        this.init(options, chart);
    }

    public axis?: RadialAxis.AxisComposition;
    public background: Array<SVGElement> = void 0 as any;
    public center: Array<number> = void 0 as any;
    public chart: Highcharts.PaneChart = void 0 as any;
    public group?: SVGElement;
    public options: Highcharts.PaneOptions = void 0 as any;

    public coll = 'pane'; // Member of chart.pane

    /**
     * Initialize the Pane object
     *
     * @private
     * @function Highcharts.Pane#init
     *
     * @param {Highcharts.PaneOptions} options
     *
     * @param {Highcharts.Chart} chart
     */
    public init(
        options: Highcharts.PaneOptions,
        chart: Highcharts.PaneChart
    ): void {
        this.chart = chart;
        this.background = [];

        chart.pane.push(this as any);

        this.setOptions(options);
    }

    /**
     * @private
     * @function Highcharts.Pane#setOptions
     *
     * @param {Highcharts.PaneOptions} options
     */
    public setOptions(options: Highcharts.PaneOptions): void {

        // Set options. Angular charts have a default background (#3318)
        this.options = options = merge(
            this.defaultOptions,
            this.chart.angular ? { background: {} } : void 0,
            options
        );
    }

    /**
     * Render the pane with its backgrounds.
     *
     * @private
     * @function Highcharts.Pane#render
     */
    public render(): void {
        let options = this.options,
            backgroundOption = this.options.background,
            renderer = this.chart.renderer,
            len,
            i;

        if (!this.group) {
            this.group = renderer.g('pane-group')
                .attr({ zIndex: options.zIndex || 0 })
                .add();
        }

        this.updateCenter();

        // Render the backgrounds
        if (backgroundOption) {
            backgroundOption = splat(backgroundOption);

            len = Math.max(
                backgroundOption.length,
                this.background.length || 0
            );

            for (i = 0; i < len; i++) {
                // #6641 - if axis exists, chart is circular and apply
                // background
                if (backgroundOption[i] && this.axis) {
                    this.renderBackground(
                        merge(
                            this.defaultBackgroundOptions as any,
                            backgroundOption[i]
                        ),
                        i
                    );
                } else if (this.background[i]) {
                    this.background[i] = this.background[i].destroy() as any;
                    this.background.splice(i, 1);
                }
            }
        }
    }

    /**
     * Render an individual pane background.
     *
     * @private
     * @function Highcharts.Pane#renderBackground
     *
     * @param {Highcharts.PaneBackgroundOptions} backgroundOptions
     *        Background options
     *
     * @param {number} i
     *        The index of the background in this.backgrounds
     */
    public renderBackground(
        backgroundOptions: Highcharts.PaneBackgroundOptions,
        i: number
    ): void {
        let method = 'animate',
            attribs: SVGAttributes = {
                'class':
                    'highcharts-pane ' + (backgroundOptions.className || '')
            };

        if (!this.chart.styledMode) {
            extend(attribs, {
                'fill': backgroundOptions.backgroundColor,
                'stroke': backgroundOptions.borderColor,
                'stroke-width': backgroundOptions.borderWidth
            });
        }

        if (!this.background[i]) {
            this.background[i] = this.chart.renderer
                .path()
                .add(this.group);
            method = 'attr';
        }

        this.background[i][method]({
            'd': (this.axis as any).getPlotBandPath(
                backgroundOptions.from,
                backgroundOptions.to,
                backgroundOptions
            )
        }).attr(attribs);

    }

    /**
     * The pane serves as a container for axes and backgrounds for circular
     * gauges and polar charts.
     *
     * @since        2.3.0
     * @product      highcharts
     * @requires     highcharts-more
     * @optionparent pane
     */
    public defaultOptions: Highcharts.PaneOptions = {

        /**
         * The end angle of the polar X axis or gauge value axis, given in
         * degrees where 0 is north. Defaults to [startAngle](#pane.startAngle)
         * + 360.
         *
         * @sample {highcharts} highcharts/demo/gauge-vu-meter/
         *         VU-meter with custom start and end angle
         *
         * @type      {number}
         * @since     2.3.0
         * @product   highcharts
         * @apioption pane.endAngle
         */

        /**
         * The center of a polar chart or angular gauge, given as an array
         * of [x, y] positions. Positions can be given as integers that
         * transform to pixels, or as percentages of the plot area size.
         *
         * @sample {highcharts} highcharts/demo/gauge-vu-meter/
         *         Two gauges with different center
         *
         * @type    {Array<string|number>}
         * @default ["50%", "50%"]
         * @since   2.3.0
         * @product highcharts
         */
        center: ['50%', '50%'],

        /**
         * The size of the pane, either as a number defining pixels, or a
         * percentage defining a percentage of the available plot area (the
         * smallest of the plot height or plot width).
         *
         * @sample {highcharts} highcharts/demo/gauge-vu-meter/
         *         Smaller size
         *
         * @type    {number|string}
         * @product highcharts
         */
        size: '85%',

        /**
         * The inner size of the pane, either as a number defining pixels, or a
         * percentage defining a percentage of the pane's size.
         *
         * @sample {highcharts} highcharts/series-polar/column-inverted-inner
         *         The inner size set to 20%
         *
         * @type    {number|string}
         * @product highcharts
         */
        innerSize: '0%',

        /**
         * The start angle of the polar X axis or gauge axis, given in degrees
         * where 0 is north. Defaults to 0.
         *
         * @sample {highcharts} highcharts/demo/gauge-vu-meter/
         *         VU-meter with custom start and end angle
         *
         * @since   2.3.0
         * @product highcharts
         */
        startAngle: 0
    };

    /**
     * An array of background items for the pane.
     *
     * @sample {highcharts} highcharts/demo/gauge-speedometer/
     *         Speedometer gauge with multiple backgrounds
     *
     * @type         {Array<*>}
     * @optionparent pane.background
     */
    public defaultBackgroundOptions: Highcharts.PaneBackgroundOptions = {

        /**
         * The class name for this background.
         *
         * @sample {highcharts} highcharts/css/pane/
         *         Panes styled by CSS
         * @sample {highstock} highcharts/css/pane/
         *         Panes styled by CSS
         * @sample {highmaps} highcharts/css/pane/
         *         Panes styled by CSS
         *
         * @type      {string}
         * @default   highcharts-pane
         * @since     5.0.0
         * @apioption pane.background.className
         */

        /**
         * The shape of the pane background. When `solid`, the background
         * is circular. When `arc`, the background extends only from the min
         * to the max of the value axis.
         *
         * @type    {Highcharts.PaneBackgroundShapeValue}
         * @since   2.3.0
         * @product highcharts
         */
        shape: 'circle',

        /**
         * The pixel border width of the pane background.
         *
         * @since 2.3.0
         * @product highcharts
         */
        borderWidth: 1,

        /**
         * The pane background border color.
         *
         * @type    {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since   2.3.0
         * @product highcharts
         */
        borderColor: Palette.neutralColor20,

        /**
         * The background color or gradient for the pane.
         *
         * @type    {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @default { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, #ffffff], [1, #e6e6e6]] }
         * @since   2.3.0
         * @product highcharts
         */
        backgroundColor: {

            /** @ignore-option */
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },

            /** @ignore-option */
            stops: [
                [0, Palette.backgroundColor],
                [1, Palette.neutralColor10]
            ]

        },

        /** @ignore-option */
        from: -Number.MAX_VALUE, // corrected to axis min

        /**
         * The inner radius of the pane background. Can be either numeric
         * (pixels) or a percentage string.
         *
         * @type    {number|string}
         * @since   2.3.0
         * @product highcharts
         */
        innerRadius: 0,

        /** @ignore-option */
        to: Number.MAX_VALUE, // corrected to axis max

        /**
         * The outer radius of the circular pane background. Can be either
         * numeric (pixels) or a percentage string.
         *
         * @type     {number|string}
         * @since    2.3.0
         * @product  highcharts
         */
        outerRadius: '105%'

    };

    /**
     * Gets the center for the pane and its axis.
     *
     * @private
     * @function Highcharts.Pane#updateCenter
     * @param {Highcharts.Axis} [axis]
     */
    public updateCenter(axis?: RadialAxis.AxisComposition): void {
        this.center = (
            axis ||
            this.axis ||
            ({} as Record<string, Array<number>>)
        ).center = CU.getCenter.call(this as any);
    }

    /**
     * Destroy the pane item
     *
     * @ignore
     * @private
     * @function Highcharts.Pane#destroy
     * /
    destroy: function () {
        erase(this.chart.pane, this);
        this.background.forEach(function (background) {
            background.destroy();
        });
        this.background.length = 0;
        this.group = this.group.destroy();
    },
    */

    /**
     * Update the pane item with new options
     *
     * @private
     * @function Highcharts.Pane#update
     * @param {Highcharts.PaneOptions} options
     *        New pane options
     * @param {boolean} [redraw]
     */
    public update(
        options: Highcharts.PaneOptions,
        redraw?: boolean
    ): void {
        merge(true, this.options, options);

        this.setOptions(this.options);
        this.render();
        this.chart.axes.forEach(function (axis): void {
            if (axis.pane === this) {
                axis.pane = null as any;
                axis.update({}, redraw);
            }
        }, this);
    }
}

/**
 * Check whether element is inside or outside pane.
 * @private
 * @param  {number} x
 * Element's x coordinate
 * @param  {number} y
 * Element's y coordinate
 * @param  {Array<number>} inverted
 * `Chart.inverted` param
 * @param  {Array<number>} center
 * Pane's center (x, y) and diameter
 * @param  {number} startAngle
 * Pane's normalized start angle in radians (<-PI, PI>)
 * @param  {number} endAngle
 * Pane's normalized end angle in radians (<-PI, PI>)
 */
function isInsidePane(
    x: number,
    y: number,
    center: Array<number>,
    startAngle?: number,
    endAngle?: number
): boolean {
    let insideSlice = true;

    const cx = center[0],
        cy = center[1];

    const distance = Math.sqrt(
        Math.pow(x - cx, 2) + Math.pow(y - cy, 2)
    );

    if (defined(startAngle) && defined(endAngle)) {
        // Round angle to N-decimals to avoid numeric errors
        const angle = Math.atan2(
            correctFloat(y - cy, 8),
            correctFloat(x - cx, 8)
        );

        // Ignore full circle panes:
        if (endAngle !== startAngle) {
            // If normalized start angle is bigger than normalized end,
            // it means angles have different signs. In such situation we
            // check the <-PI, startAngle> and <endAngle, PI> ranges.
            if (startAngle > endAngle) {
                insideSlice = (
                    angle >= startAngle &&
                    angle <= Math.PI
                ) || (
                    angle <= endAngle &&
                    angle >= -Math.PI
                );
            } else {
                // In this case, we simple check if angle is within the
                // <startAngle, endAngle> range
                insideSlice = angle >= startAngle &&
                    angle <= correctFloat(endAngle, 8);
            }
        }
    }
    // Round up radius because x and y values are rounded
    return distance <= Math.ceil(center[2] / 2) && insideSlice;
}

Chart.prototype.getHoverPane = function (
    this: Highcharts.PaneChart,
    eventArgs: {
        chartX: number;
        chartY: number;
        shared: boolean|undefined;
        filter?: Function;
    }
): Highcharts.Pane|undefined {
    const chart = this;
    let hoverPane;
    if (eventArgs) {
        chart.pane.forEach((pane): void => {
            const x = eventArgs.chartX - chart.plotLeft,
                y = eventArgs.chartY - chart.plotTop;

            if (isInsidePane(x, y, pane.center)) {
                hoverPane = pane;
            }
        });
    }
    return hoverPane;
};

// Check if (x, y) position is within pane for polar
addEvent(Chart, 'afterIsInsidePlot', function (
    e: {
        x: number;
        y: number;
        isInsidePlot: boolean;
        options: Chart.IsInsideOptionsObject;
    }
): void {
    const chart = this;

    if (chart.polar) {
        if (e.options.inverted) {
            [e.x, e.y] = [e.y, e.x];
        }

        e.isInsidePlot = (chart as Highcharts.PaneChart).pane.some(
            (pane): boolean => isInsidePane(
                e.x,
                e.y,
                pane.center,
                pane.axis && pane.axis.normalizedStartAngleRad,
                pane.axis && pane.axis.normalizedEndAngleRad
            )
        );
    }
});

addEvent(Pointer, 'beforeGetHoverData', function (
    eventArgs: {
        chartX: number;
        chartY: number;
        shared: boolean|undefined;
        filter?: Function;
    }
): void {
    const chart = (this.chart as Highcharts.PaneChart);
    if (chart.polar) {
        // Find pane we are currently hovering over.
        chart.hoverPane = chart.getHoverPane(eventArgs);

        // Edit filter method to handle polar
        eventArgs.filter = function (s: Series): boolean {
            return (
                s.visible &&
                !(!eventArgs.shared && s.directTouch) && // #3821
                pick(s.options.enableMouseTracking, true) &&
                (!chart.hoverPane || s.xAxis.pane === chart.hoverPane)
            );
        };
    } else {
        chart.hoverPane = void 0;
    }
});

addEvent(Pointer, 'afterGetHoverData', function (
    eventArgs: Pointer.EventArgsObject
): void {
    const chart = this.chart;
    if (
        eventArgs.hoverPoint &&
        eventArgs.hoverPoint.plotX &&
        eventArgs.hoverPoint.plotY &&
        chart.hoverPane &&
        !isInsidePane(
            eventArgs.hoverPoint.plotX,
            eventArgs.hoverPoint.plotY,
            chart.hoverPane.center
        )
    ) {
        eventArgs.hoverPoint = void 0;
    }
});

H.Pane = Pane as any;
export default H.Pane;
