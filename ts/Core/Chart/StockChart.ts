/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type Axis from '../Axis/Axis';
import type {
    AxisCollectionKey,
    AxisOptions,
    YAxisOptions
} from '../Axis/AxisOptions';
import type BBoxObject from '../Renderer/BBoxObject';
import type CSSObject from '../Renderer/CSSObject';
import type { HTMLDOMElement } from '../Renderer/DOMElementType';
import type Options from '../Options';
import type PointerEvent from '../PointerEvent';
import type Series from '../Series/Series';
import type {
    SeriesTypeOptions,
    SeriesTypePlotOptions
} from '../Series/SeriesType';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type SVGRenderer from '../Renderer/SVG/SVGRenderer';

import Chart from '../Chart/Chart.js';
import F from '../Templating.js';
const { format } = F;
import D from '../Defaults.js';
const { getOptions } = D;
import NavigatorDefaults from '../../Stock/Navigator/NavigatorDefaults.js';
import { Palette } from '../../Core/Color/Palettes.js';
import Point from '../Series/Point.js';
import RangeSelectorDefaults from '../../Stock/RangeSelector/RangeSelectorDefaults.js';
import ScrollbarDefaults from '../../Stock/Scrollbar/ScrollbarDefaults.js';
import StockUtilities from '../../Stock/Utilities/StockUtilities.js';
const { setFixedRange } = StockUtilities;
import U from '../Utilities.js';
const {
    addEvent,
    clamp,
    crisp,
    defined,
    extend,
    find,
    isNumber,
    isString,
    merge,
    pick,
    splat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Axis/AxisLike' {
    interface AxisLike {
        crossLabel?: SVGElement;
    }
}

declare module './ChartLike' {
    interface ChartLike {
        _labelPanes?: Record<string, Axis>;
        fixedRange?: number;
        setFixedRange(range: number|undefined): void;
    }
}

declare module '../Options'{
    interface Options {
        isStock?: boolean;
    }
}

declare module '../Series/SeriesLike' {
    interface SeriesLike {
        clipBox?: BBoxObject;
        forceCropping(): boolean|undefined;
    }
}

declare module '../Renderer/SVG/SVGRendererLike' {
    interface SVGRendererLike {
        crispPolyLine(points: SVGPath, width: number): SVGPath;
    }
}

/* *
 *
 *  Functions
 *
 * */


/**
 * Get stock-specific default axis options.
 *
 * @private
 * @function getDefaultAxisOptions
 */
function getDefaultAxisOptions(
    coll: string,
    options: DeepPartial<AxisOptions>,
    defaultOptions: DeepPartial<AxisOptions>
): DeepPartial<AxisOptions> {
    if (coll === 'xAxis') {
        return {
            minPadding: 0,
            maxPadding: 0,
            overscroll: 0,
            ordinal: true
        };
    }
    if (coll === 'yAxis') {
        return {
            labels: {
                y: -2
            },
            opposite: defaultOptions.opposite ?? options.opposite ?? true,
            showLastLabel: !!(
                // #6104, show last label by default for category axes
                options.categories ||
                options.type === 'category'
            ),
            title: {
                text: void 0
            }
        };
    }
    return {};
}

/**
 * Get stock-specific forced axis options.
 *
 * @private
 * @function getForcedAxisOptions
 */
function getForcedAxisOptions(
    type: string,
    chartOptions: Partial<Options>
): DeepPartial<AxisOptions> {
    if (type === 'xAxis') {
        // Always disable startOnTick:true on the main axis when the navigator
        // is enabled (#1090)
        const navigatorEnabled = pick(
            chartOptions.navigator?.enabled,
            NavigatorDefaults.enabled,
            true
        );

        const axisOptions: DeepPartial<AxisOptions> = {
            type: 'datetime',
            categories: void 0
        };
        if (navigatorEnabled) {
            axisOptions.startOnTick = false;
            axisOptions.endOnTick = false;
        }

        return axisOptions;
    }
    return {};
}

/* *
 *
 *  Class
 *
 * */

/**
 * Stock-optimized chart. Use {@link Highcharts.Chart|Chart} for common charts.
 *
 * @requires modules/stock
 *
 * @class
 * @name Highcharts.StockChart
 * @extends Highcharts.Chart
 */
class StockChart extends Chart {

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initializes the chart. The constructor's arguments are passed on
     * directly.
     *
     * @function Highcharts.StockChart#init
     *
     * @param {Highcharts.Options} userOptions
     *        Custom options.
     *
     * @param {Function} [callback]
     *        Function to run when the chart has loaded and all external
     *        images are loaded.
     *
     *
     * @emits Highcharts.StockChart#event:init
     * @emits Highcharts.StockChart#event:afterInit
     */
    public init(
        userOptions: Partial<Options>,
        callback?: Chart.CallbackFunction
    ): void {
        const defaultOptions = getOptions(),
            xAxisOptions = userOptions.xAxis,
            yAxisOptions = userOptions.yAxis,
            // Always disable startOnTick:true on the main axis when the
            // navigator is enabled (#1090)
            navigatorEnabled = pick(
                userOptions.navigator?.enabled,
                NavigatorDefaults.enabled,
                true
            );

        // Avoid doing these twice
        userOptions.xAxis = userOptions.yAxis = void 0;

        const options = merge(
            {
                chart: {
                    panning: {
                        enabled: true,
                        type: 'x'
                    },
                    zooming: {
                        pinchType: 'x',
                        mouseWheel: {
                            type: 'x'
                        }
                    }
                },
                navigator: {
                    enabled: navigatorEnabled
                },
                scrollbar: {
                    // #4988 - check if setOptions was called
                    enabled: pick(
                        ScrollbarDefaults.enabled,
                        true
                    )
                },
                rangeSelector: {
                    // #4988 - check if setOptions was called
                    enabled: pick(
                        RangeSelectorDefaults.rangeSelector.enabled,
                        true
                    )
                },
                title: {
                    text: null
                },
                tooltip: {
                    split: pick(
                        defaultOptions.tooltip?.split,
                        true
                    ),
                    crosshairs: true
                },
                legend: {
                    enabled: false
                }

            },

            userOptions, // User's options

            { // Forced options
                isStock: true // Internal flag
            }
        );

        userOptions.xAxis = xAxisOptions;
        userOptions.yAxis = yAxisOptions;

        // Apply X axis options to both single and multi y axes
        options.xAxis = splat(userOptions.xAxis || {}).map((
            xAxisOptions
        ): DeepPartial<AxisOptions> => merge(
            getDefaultAxisOptions(
                'xAxis',
                xAxisOptions,
                defaultOptions.xAxis as AxisOptions
            ),
            // #7690
            xAxisOptions, // User options
            getForcedAxisOptions('xAxis', userOptions)
        ));

        // Apply Y axis options to both single and multi y axes
        options.yAxis = splat(userOptions.yAxis || {}).map((
            yAxisOptions
        ): DeepPartial<YAxisOptions> => merge(
            getDefaultAxisOptions(
                'yAxis',
                yAxisOptions,
                defaultOptions.yAxis as AxisOptions
            ),
            // #7690
            yAxisOptions // User options
        ));

        super.init(options, callback);
    }

    /**
     * Factory for creating different axis types.
     * Extended to add stock defaults.
     *
     * @private
     * @function Highcharts.StockChart#createAxis
     * @param {string} coll
     * An axis type.
     * @param {Chart.CreateAxisOptionsObject} options
     * The axis creation options.
     */
    public createAxis(
        coll: AxisCollectionKey,
        options: Chart.CreateAxisOptionsObject
    ): Axis {
        options.axis = merge(
            getDefaultAxisOptions(
                coll,
                options.axis,
                getOptions()[coll] as AxisOptions
            ),
            options.axis,
            getForcedAxisOptions(coll, this.userOptions)
        );
        return super.createAxis(coll, options);
    }

}

addEvent(Chart, 'update', function (
    this: StockChart,
    e: { options: Options }
): void {
    const chart = this,
        options = e.options;

    // Use case: enabling scrollbar from a disabled state.
    // Scrollbar needs to be initialized from a controller, Navigator in this
    // case (#6615)
    if ('scrollbar' in options && chart.navigator) {
        merge(true, chart.options.scrollbar, options.scrollbar);
        chart.navigator.update({ enabled: !!chart.navigator.navigatorEnabled });
        delete options.scrollbar;
    }
});

/* *
 *
 *  Composition
 *
 * */

namespace StockChart {

    /* *
     *
     *  Functions
     *
     * */

    /** @private */
    export function compose(
        ChartClass: typeof Chart,
        AxisClass: typeof Axis,
        SeriesClass: typeof Series,
        SVGRendererClass: typeof SVGRenderer
    ): void {
        const seriesProto = SeriesClass.prototype;

        if (!seriesProto.forceCropping) {
            addEvent(AxisClass, 'afterDrawCrosshair', onAxisAfterDrawCrosshair);
            addEvent(AxisClass, 'afterHideCrosshair', onAxisAfterHideCrosshair);
            addEvent(AxisClass, 'autoLabelAlign', onAxisAutoLabelAlign);
            addEvent(AxisClass, 'destroy', onAxisDestroy);
            addEvent(AxisClass, 'getPlotLinePath', onAxisGetPlotLinePath);

            ChartClass.prototype.setFixedRange = setFixedRange;

            seriesProto.forceCropping = seriesForceCropping;

            addEvent(SeriesClass, 'setOptions', onSeriesSetOptions);

            SVGRendererClass.prototype.crispPolyLine = svgRendererCrispPolyLine;
        }

    }

    /**
     * Extend crosshairs to also draw the label.
     * @private
     */
    function onAxisAfterDrawCrosshair(
        this: Axis,
        event: { e: PointerEvent; point: Point }
    ): void {
        const axis = this;

        // Check if the label has to be drawn
        if (
            !(
                axis.crosshair?.label?.enabled &&
                axis.cross &&
                isNumber(axis.min) &&
                isNumber(axis.max)
            )
        ) {
            return;
        }

        const chart = axis.chart,
            log = axis.logarithmic,
            options = axis.crosshair.label, // The label's options
            horiz = axis.horiz, // Axis orientation
            opposite = axis.opposite, // Axis position
            left = axis.left, // Left position
            top = axis.top, // Top position
            width = axis.width,
            tickInside = axis.options.tickPosition === 'inside',
            snap = axis.crosshair.snap !== false,
            e = event.e || (axis.cross?.e),
            point = event.point;

        let crossLabel = axis.crossLabel, // The svgElement
            posx,
            posy,
            formatOption = options.format,
            formatFormat = '',
            limit,
            offset = 0,
            // Use last available event (#5287)
            min = axis.min,
            max = axis.max;

        if (log) {
            min = log.lin2log(axis.min);
            max = log.lin2log(axis.max);
        }

        const align = (horiz ? 'center' : opposite ?
            (axis.labelAlign === 'right' ? 'right' : 'left') :
            (axis.labelAlign === 'left' ? 'left' : 'center'));

        // If the label does not exist yet, create it.
        if (!crossLabel) {
            crossLabel = axis.crossLabel = chart.renderer
                .label(
                    '',
                    0,
                    void 0,
                    options.shape || 'callout'
                )
                .addClass(
                    'highcharts-crosshair-label highcharts-color-' + (
                        point?.series ?
                            point.series.colorIndex :
                            axis.series[0] && this.series[0].colorIndex
                    )
                )
                .attr({
                    align: options.align || align,
                    padding: pick(options.padding, 8),
                    r: pick(options.borderRadius, 3),
                    zIndex: 2
                })
                .add(axis.labelGroup);

            // Presentational
            if (!chart.styledMode) {
                crossLabel
                    .attr({
                        fill: options.backgroundColor ||
                            point?.series?.color || // #14888
                            Palette.neutralColor60,
                        stroke: options.borderColor || '',
                        'stroke-width': options.borderWidth || 0
                    })
                    .css(extend<CSSObject>({
                        color: Palette.backgroundColor,
                        fontWeight: 'normal',
                        fontSize: '0.7em',
                        textAlign: 'center'
                    }, options.style || {}));
            }
        }

        if (horiz) {
            posx = snap ? (point.plotX || 0) + left : e.chartX;
            posy = top + (opposite ? 0 : axis.height);
        } else {
            posx = left + axis.offset + (opposite ? width : 0);
            posy = snap ? (point.plotY || 0) + top : e.chartY;
        }

        if (!formatOption && !options.formatter) {
            if (axis.dateTime) {
                formatFormat = '%b %d, %Y';
            }
            formatOption =
                '{value' + (formatFormat ? ':' + formatFormat : '') + '}';
        }

        // Show the label
        const value = snap ?
            (axis.isXAxis ? point.x : point.y) :
            axis.toValue(horiz ? e.chartX : e.chartY);

        // Crosshair should be rendered within Axis range (#7219) and the point
        // of currentPriceIndicator should be inside the plot area (#14879).
        const isInside = point?.series ?
            point.series.isPointInside(point) :
            (isNumber(value) && value > min && value < max);

        let text = '';
        if (formatOption) {
            text = format(formatOption, { value }, chart);
        } else if (options.formatter && isNumber(value)) {
            text = options.formatter.call(axis, value);
        }

        crossLabel.attr({
            text,
            x: posx,
            y: posy,
            visibility: isInside ? 'inherit' : 'hidden'
        });

        const crossBox = crossLabel.getBBox();

        // Now it is placed we can correct its position
        if (isNumber(crossLabel.x) && !horiz && !opposite) {
            posx = crossLabel.x - (crossBox.width / 2);
        }

        if (isNumber(crossLabel.y)) {
            if (horiz) {
                if ((tickInside && !opposite) || (!tickInside && opposite)) {
                    posy = crossLabel.y - crossBox.height;
                }
            } else {
                posy = crossLabel.y - (crossBox.height / 2);
            }
        }

        // Check the edges
        if (horiz) {
            limit = {
                left,
                right: left + axis.width
            };
        } else {
            limit = {
                left: axis.labelAlign === 'left' ? left : 0,
                right: axis.labelAlign === 'right' ?
                    left + axis.width :
                    chart.chartWidth
            };
        }


        const translateX = crossLabel.translateX || 0;
        // Left edge
        if (translateX < limit.left) {
            offset = limit.left - translateX;
        }
        // Right edge
        if (translateX + crossBox.width >= limit.right) {
            offset = -(translateX + crossBox.width - limit.right);
        }

        // Show the crosslabel
        crossLabel.attr({
            x: Math.max(0, posx + offset),
            y: Math.max(0, posy),
            // First set x and y, then anchorX and anchorY, when box is actually
            // calculated, #5702
            anchorX: horiz ?
                posx :
                (axis.opposite ? 0 : chart.chartWidth),
            anchorY: horiz ?
                (axis.opposite ? chart.chartHeight : 0) :
                posy + crossBox.height / 2
        });
    }

    /**
     * Wrapper to hide the label.
     * @private
     */
    function onAxisAfterHideCrosshair(
        this: Axis
    ): void {
        const axis = this;

        if (axis.crossLabel) {
            axis.crossLabel = axis.crossLabel.hide();
        }
    }

    /**
     * Override the automatic label alignment so that the first Y axis' labels
     * are drawn on top of the grid line, and subsequent axes are drawn outside.
     * @private
     */
    function onAxisAutoLabelAlign(
        this: Axis,
        e: (Event&{align:string})
    ): void {
        const axis = this,
            chart = axis.chart,
            options = axis.options,
            panes = chart._labelPanes = chart._labelPanes || {},
            labelOptions = options.labels;

        if (chart.options.isStock && axis.coll === 'yAxis') {
            const key = options.top + ',' + options.height;
            // Do it only for the first Y axis of each pane
            if (!panes[key] && labelOptions.enabled) {
                if (
                    labelOptions.distance === 15 && // Default
                    axis.side === 1
                ) {
                    labelOptions.distance = 0;
                }
                if (typeof labelOptions.align === 'undefined') {
                    labelOptions.align = 'right';
                }
                panes[key] = axis;
                e.align = 'right';

                e.preventDefault();
            }
        }
    }

    /**
     * Clear axis from label panes. (#6071)
     * @private
     */
    function onAxisDestroy(
        this: Axis
    ): void {
        const axis = this,
            chart = axis.chart,
            key = (
                axis.options &&
                (axis.options.top + ',' + axis.options.height)
            );

        if (key && chart._labelPanes && chart._labelPanes[key] === axis) {
            delete chart._labelPanes[key];
        }
    }

    /**
     * Override getPlotLinePath to allow for multipane charts.
     * @private
     */
    function onAxisGetPlotLinePath(
        this: Axis,
        e: (Event&Axis.PlotLinePathOptions)
    ): void {
        const axis = this,
            series = (
                axis.isLinked && !axis.series && axis.linkedParent ?
                    axis.linkedParent.series :
                    axis.series
            ),
            chart = axis.chart,
            renderer = chart.renderer,
            axisLeft = axis.left,
            axisTop = axis.top,
            result = [] as SVGPath,
            translatedValue = e.translatedValue,
            value = e.value,
            force = e.force,
            /**
             * Return the other axis based on either the axis option or on
             * related series.
             * @private
             */
            getAxis = (coll: string): Array<Axis> => {
                const otherColl = coll === 'xAxis' ? 'yAxis' : 'xAxis',
                    opt = (axis.options as AnyRecord)[otherColl];

                // Other axis indexed by number
                if (isNumber(opt)) {
                    return [chart[otherColl][opt]];
                }

                // Other axis indexed by id (like navigator)
                if (isString(opt)) {
                    return [chart.get(opt) as Axis];
                }

                // Auto detect based on existing series
                return series.map((s): Axis => s[otherColl]);
            };

        let x1,
            y1,
            x2,
            y2,
            axes = [], // #3416 need a default array
            axes2: Array<Axis>,
            uniqueAxes: Array<Axis>,
            transVal: number;

        if (// For stock chart, by default render paths across the panes
            // except the case when `acrossPanes` is disabled by user (#6644)
            (chart.options.isStock && e.acrossPanes !== false) &&
            // Ignore in case of colorAxis or zAxis. #3360, #3524, #6720
            axis.coll === 'xAxis' || axis.coll === 'yAxis'
        ) {

            e.preventDefault();

            // Get the related axes based on series
            axes = getAxis(axis.coll);

            // Get the related axes based options.*Axis setting #2810
            axes2 = (axis.isXAxis ? chart.yAxis : chart.xAxis);
            for (const A of axes2) {
                if (!A.options.isInternal) {
                    const a = (A.isXAxis ? 'yAxis' : 'xAxis'),
                        relatedAxis: Axis = (
                            defined((A.options as any)[a]) ?
                                (chart as any)[a][(A.options as any)[a]] :
                                (chart as any)[a][0]
                        );

                    if (axis === relatedAxis) {
                        axes.push(A);
                    }
                }
            }


            // Remove duplicates in the axes array. If there are no axes in the
            // axes array, we are adding an axis without data, so we need to
            // populate this with grid lines (#2796).
            uniqueAxes = axes.length ?
                [] :
                [axis.isXAxis ? chart.yAxis[0] : chart.xAxis[0]]; // #3742
            for (const axis2 of axes) {
                if (
                    uniqueAxes.indexOf(axis2) === -1 &&
                    // Do not draw on axis which overlap completely. #5424
                    !find(uniqueAxes, (unique: Axis): boolean => (
                        unique.pos === axis2.pos &&
                        unique.len === axis2.len
                    ))
                ) {
                    uniqueAxes.push(axis2);
                }
            }

            transVal = pick(
                translatedValue,
                axis.translate(value || 0, void 0, void 0, e.old)
            );
            if (isNumber(transVal)) {
                if (axis.horiz) {
                    for (const axis2 of uniqueAxes) {
                        let skip;

                        y1 = axis2.pos;
                        y2 = y1 + axis2.len;
                        x1 = x2 = Math.round(transVal + axis.transB);

                        // Outside plot area
                        if (
                            force !== 'pass' &&
                            (x1 < axisLeft || x1 > axisLeft + axis.width)
                        ) {
                            if (force) {
                                x1 = x2 = clamp(
                                    x1,
                                    axisLeft,
                                    axisLeft + axis.width
                                );
                            } else {
                                skip = true;
                            }
                        }
                        if (!skip) {
                            result.push(['M', x1, y1], ['L', x2, y2]);
                        }
                    }
                } else {
                    for (const axis2 of uniqueAxes) {
                        let skip;

                        x1 = axis2.pos;
                        x2 = x1 + axis2.len;
                        y1 = y2 = Math.round(axisTop + axis.height - transVal);

                        // Outside plot area
                        if (
                            force !== 'pass' &&
                            (y1 < axisTop || y1 > axisTop + axis.height)
                        ) {
                            if (force) {
                                y1 = y2 = clamp(
                                    y1,
                                    axisTop,
                                    axisTop + axis.height
                                );
                            } else {
                                skip = true;
                            }
                        }
                        if (!skip) {
                            result.push(['M', x1, y1], ['L', x2, y2]);
                        }
                    }
                }
            }
            e.path = result.length > 0 ?
                renderer.crispPolyLine(result, e.lineWidth || 1) :
                // #3557 getPlotLinePath in regular Highcharts also returns null
                void 0;
        }
    }

    /**
     * Handle som Stock-specific series defaults, override the plotOptions
     * before series options are handled.
     * @private
     */
    function onSeriesSetOptions(
        this: Series,
        e: { plotOptions: SeriesTypePlotOptions }
    ): void {
        const series = this;

        if (series.chart.options.isStock) {
            let overrides: (SeriesTypeOptions|undefined);

            if (series.is('column') || series.is('columnrange')) {
                overrides = {
                    borderWidth: 0,
                    shadow: false
                };

            } else if (!series.is('scatter') && !series.is('sma')) {
                overrides = {
                    marker: {
                        enabled: false,
                        radius: 2
                    }
                };
            }

            if (overrides) {
                e.plotOptions[series.type] = merge(
                    e.plotOptions[series.type],
                    overrides
                );
            }
        }
    }

    /**
     * Based on the data grouping options decides whether
     * the data should be cropped while processing.
     *
     * @ignore
     * @function Highcharts.Series#forceCropping
     */
    function seriesForceCropping(
        this: Series
    ): (boolean|undefined) {
        const series = this,
            chart = series.chart,
            options = series.options,
            dataGroupingOptions = options.dataGrouping,
            groupingEnabled = (
                series.allowDG !== false &&
                dataGroupingOptions &&
                pick(dataGroupingOptions.enabled, chart.options.isStock)
            );

        return groupingEnabled;
    }

    /* eslint-disable jsdoc/check-param-names */

    /**
     * Factory function for creating new stock charts. Creates a new
     * {@link Highcharts.StockChart|StockChart} object with different default
     * options than the basic Chart.
     *
     * @example
     * let chart = Highcharts.stockChart('container', {
     *     series: [{
     *         data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
     *         pointInterval: 24 * 60 * 60 * 1000
     *     }]
     * });
     *
     * @function Highcharts.stockChart
     *
     * @param {string|Highcharts.HTMLDOMElement} [renderTo]
     *        The DOM element to render to, or its id.
     *
     * @param {Highcharts.Options} options
     *        The chart options structure as described in the
     *        [options reference](https://api.highcharts.com/highstock).
     *
     * @param {Highcharts.ChartCallbackFunction} [callback]
     *        A function to execute when the chart object is finished
     *        rendering and all external image files (`chart.backgroundImage`,
     *        `chart.plotBackgroundImage` etc) are loaded. Defining a
     *        [chart.events.load](https://api.highcharts.com/highstock/chart.events.load)
     *        handler is equivalent.
     *
     * @return {Highcharts.StockChart}
     *         The chart object.
     */
    export function stockChart(
        a: (string|HTMLDOMElement|Options),
        b?: (Chart.CallbackFunction|Options),
        c?: Chart.CallbackFunction
    ): StockChart {
        return new StockChart(a as any, b as any, c);
    }

    /* eslint-enable jsdoc/check-param-names */

    /**
     * Function to crisp a line with multiple segments
     *
     * @private
     * @function Highcharts.SVGRenderer#crispPolyLine
     */
    function svgRendererCrispPolyLine(
        this: SVGRenderer,
        points: Array<SVGPath.MoveTo|SVGPath.LineTo>,
        width: number
    ): SVGPath {

        // Points format: [['M', 0, 0], ['L', 100, 0]]
        // normalize to a crisp line
        for (let i = 0; i < points.length; i = i + 2) {
            const start = points[i],
                end = points[i + 1];

            if (defined(start[1]) && start[1] === end[1]) {
                start[1] = end[1] = crisp(start[1], width);
            }
            if (defined(start[2]) && start[2] === end[2]) {
                start[2] = end[2] = crisp(start[2], width);
            }
        }

        return points;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default StockChart;
