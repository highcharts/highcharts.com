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

/* *
 *
 *  Imports
 *
 * */

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
import type { SeriesTypePlotOptions } from '../Series/SeriesType';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGPath from '../Renderer/SVG/SVGPath';

import Axis from '../Axis/Axis.js';
import Chart from '../Chart/Chart.js';
import F from '../Templating.js';
const { format } = F;
import D from '../Defaults.js';
const { getOptions } = D;
import NavigatorDefaults from '../../Stock/Navigator/NavigatorDefaults.js';
import { Palette } from '../../Core/Color/Palettes.js';
import Point from '../Series/Point.js';
import RangeSelectorDefaults from
    '../../Stock/RangeSelector/RangeSelectorDefaults.js';
import ScrollbarDefaults from '../../Stock/Scrollbar/ScrollbarDefaults.js';
import Series from '../Series/Series.js';
import SVGRenderer from '../Renderer/SVG/SVGRenderer.js';
import U from '../../Shared/Utilities.js';
const {
    clamp,
    pick
} = U;

import '../Pointer.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find,
    splat
} = AH;
const { isNumber, isString } = TC;
const {
    defined,
    extend,
    merge
} = OH;

const { addEvent } = EH;

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
     *        Function to run when the chart has loaded and and all external
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
                userOptions.navigator && userOptions.navigator.enabled,
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
                        pinchType: 'x'
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
                    split: pick((defaultOptions.tooltip as any).split, true),
                    crosshairs: true
                },
                legend: {
                    enabled: false
                }

            },

            userOptions, // user's options

            { // forced options
                isStock: true // internal flag
            }
        );

        userOptions.xAxis = xAxisOptions;
        userOptions.yAxis = yAxisOptions;

        // apply X axis options to both single and multi y axes
        options.xAxis = splat(userOptions.xAxis || {}).map(function (
            xAxisOptions: AxisOptions,
            i: number
        ): AxisOptions {
            return merge(
                getDefaultAxisOptions('xAxis', xAxisOptions),
                defaultOptions.xAxis, // #3802
                // #7690
                defaultOptions.xAxis && (defaultOptions.xAxis as any)[i],
                xAxisOptions, // user options
                getForcedAxisOptions('xAxis', userOptions)
            );
        });

        // apply Y axis options to both single and multi y axes
        options.yAxis = splat(userOptions.yAxis || {}).map(function (
            yAxisOptions: YAxisOptions,
            i: number
        ): YAxisOptions {
            return merge(
                getDefaultAxisOptions('yAxis', yAxisOptions),
                defaultOptions.yAxis, // #3802
                // #7690
                defaultOptions.yAxis && (defaultOptions.yAxis as any)[i],
                yAxisOptions // user options
            );
        });

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
            getDefaultAxisOptions(coll, options.axis),
            options.axis,
            getForcedAxisOptions(coll, this.userOptions)
        );
        return super.createAxis(coll, options);
    }
}

/* eslint-disable no-invalid-this, valid-jsdoc */

namespace StockChart {
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
}

/**
 * Get stock-specific default axis options.
 *
 * @private
 * @function getDefaultAxisOptions
 */
function getDefaultAxisOptions(
    type: string,
    options: DeepPartial<AxisOptions>
): DeepPartial<AxisOptions> {
    if (type === 'xAxis') {
        return {
            minPadding: 0,
            maxPadding: 0,
            overscroll: 0,
            ordinal: true,
            title: {
                text: null
            },
            labels: {
                overflow: 'justify'
            },
            showLastLabel: true
        };
    }
    if (type === 'yAxis') {
        return {
            labels: {
                y: -2
            },
            opposite: pick(options.opposite, true),
            showLastLabel: !!(
                // #6104, show last label by default for category axes
                options.categories ||
                options.type === 'category'
            ),
            title: {
                text: null
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
            chartOptions.navigator && chartOptions.navigator.enabled,
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
 *  Compositions
 *
 * */

// Handle som Stock-specific series defaults, override the plotOptions before
// series options are handled.
addEvent(Series, 'setOptions', function (
    e: { plotOptions: SeriesTypePlotOptions }
): void {
    let overrides;

    if (this.chart.options.isStock) {
        if (this.is('column') || this.is('columnrange')) {
            overrides = {
                borderWidth: 0,
                shadow: false
            };

        } else if (!this.is('scatter') && !this.is('sma')) {
            overrides = {
                marker: {
                    enabled: false,
                    radius: 2
                }
            };
        }
        if (overrides) {
            e.plotOptions[this.type] = merge(
                e.plotOptions[this.type],
                overrides
            );
        }
    }
});

// Override the automatic label alignment so that the first Y axis' labels are
// drawn on top of the grid line, and subsequent axes are drawn outside
addEvent(Axis, 'autoLabelAlign', function (e: Event): void {
    const { chart, options } = this,
        panes = chart._labelPanes = chart._labelPanes || {},
        labelOptions = options.labels;

    if (chart.options.isStock && this.coll === 'yAxis') {
        const key = options.top + ',' + options.height;
        // Do it only for the first Y axis of each pane
        if (!panes[key] && labelOptions.enabled) {
            if (
                labelOptions.distance === 15 && // default
                this.side === 1
            ) {
                labelOptions.distance = 0;
            }
            if (typeof labelOptions.align === 'undefined') {
                labelOptions.align = 'right';
            }
            panes[key] = this;
            (e as any).align = 'right';

            e.preventDefault();
        }
    }
});

// Clear axis from label panes (#6071)
addEvent(Axis, 'destroy', function (): void {
    const chart = this.chart,
        key = this.options && (this.options.top + ',' + this.options.height);

    if (key && chart._labelPanes && chart._labelPanes[key] === this) {
        delete chart._labelPanes[key];
    }
});

// Override getPlotLinePath to allow for multipane charts
addEvent(Axis, 'getPlotLinePath', function (
    e: (Event&Axis.PlotLinePathOptions)
): void {
    let axis = this,
        series = (
            this.isLinked && !this.series ?
                (this.linkedParent as any).series :
                this.series
        ),
        chart = axis.chart,
        renderer = chart.renderer,
        axisLeft = axis.left,
        axisTop = axis.top,
        x1,
        y1,
        x2,
        y2,
        result = [] as SVGPath,
        axes = [], // #3416 need a default array
        axes2: Array<Axis>,
        uniqueAxes: Array<Axis>,
        translatedValue = e.translatedValue,
        value = e.value,
        force = e.force,
        transVal: number;

    /**
     * Return the other axis based on either the axis option or on related
     * series.
     * @private
     */
    function getAxis(coll: string): Array<Axis> {
        const otherColl = coll === 'xAxis' ? 'yAxis' : 'xAxis',
            opt = (axis.options as any)[otherColl];

        // Other axis indexed by number
        if (isNumber(opt)) {
            return [(chart as any)[otherColl][opt]];
        }

        // Other axis indexed by id (like navigator)
        if (isString(opt)) {
            return [chart.get(opt) as Axis];
        }

        // Auto detect based on existing series
        return series.map(function (s: Series): Axis {
            return (s as any)[otherColl];
        });
    }

    if (// For stock chart, by default render paths across the panes
        // except the case when `acrossPanes` is disabled by user (#6644)
        (chart.options.isStock && (e as any).acrossPanes !== false) &&
        // Ignore in case of colorAxis or zAxis. #3360, #3524, #6720
        axis.coll === 'xAxis' || axis.coll === 'yAxis'
    ) {

        e.preventDefault();

        // Get the related axes based on series
        axes = getAxis(axis.coll);

        // Get the related axes based options.*Axis setting #2810
        axes2 = (axis.isXAxis ? chart.yAxis : chart.xAxis);
        axes2.forEach(function (A): void {
            if (
                defined(A.options.id) ?
                    A.options.id.indexOf('navigator') === -1 :
                    true
            ) {
                const a = (A.isXAxis ? 'yAxis' : 'xAxis'),
                    rax = (
                        defined((A.options as any)[a]) ?
                            (chart as any)[a][(A.options as any)[a]] :
                            (chart as any)[a][0]
                    );

                if (axis === rax) {
                    axes.push(A);
                }
            }
        });


        // Remove duplicates in the axes array. If there are no axes in the axes
        // array, we are adding an axis without data, so we need to populate
        // this with grid lines (#2796).
        uniqueAxes = axes.length ?
            [] :
            [axis.isXAxis ? chart.yAxis[0] : chart.xAxis[0]]; // #3742
        axes.forEach(function (axis2): void {
            if (
                uniqueAxes.indexOf(axis2) === -1 &&
                // Do not draw on axis which overlap completely. #5424
                !find(uniqueAxes, function (unique: Axis): boolean {
                    return unique.pos === axis2.pos && unique.len === axis2.len;
                })
            ) {
                uniqueAxes.push(axis2);
            }
        });

        transVal = pick(
            translatedValue,
            axis.translate(value as any, void 0, void 0, (e as any).old)
        );
        if (isNumber(transVal)) {
            if (axis.horiz) {
                uniqueAxes.forEach(function (axis2): void {
                    let skip;

                    y1 = axis2.pos;
                    y2 = (y1 as any) + axis2.len;
                    x1 = x2 = Math.round(transVal + axis.transB);

                    // outside plot area
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
                });
            } else {
                uniqueAxes.forEach(function (axis2): void {
                    let skip;

                    x1 = axis2.pos;
                    x2 = (x1 as any) + axis2.len;
                    y1 = y2 = Math.round(axisTop + axis.height - transVal);

                    // outside plot area
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
                });
            }
        }
        (e as any).path = result.length > 0 ?
            renderer.crispPolyLine(result as any, e.lineWidth || 1) :
            // #3557 getPlotLinePath in regular Highcharts also returns null
            null;
    }
});

/**
 * Function to crisp a line with multiple segments
 *
 * @private
 * @function Highcharts.SVGRenderer#crispPolyLine
 */
SVGRenderer.prototype.crispPolyLine = function (
    this: SVGRenderer,
    points: Array<SVGPath.MoveTo|SVGPath.LineTo>,
    width: number
): SVGPath {
    // points format: [['M', 0, 0], ['L', 100, 0]]
    // normalize to a crisp line
    for (let i = 0; i < points.length; i = i + 2) {
        const start = points[i],
            end = points[i + 1];

        if (start[1] === end[1]) {
            // Substract due to #1129. Now bottom and left axis gridlines behave
            // the same.
            start[1] = end[1] =
                Math.round(start[1]) - (width % 2 / 2);
        }
        if (start[2] === end[2]) {
            start[2] = end[2] =
                Math.round(start[2]) + (width % 2 / 2);
        }
    }
    return points;
};

// Wrapper to hide the label
addEvent(Axis, 'afterHideCrosshair', function (): void {
    if (this.crossLabel) {
        this.crossLabel = this.crossLabel.hide();
    }
});

// Extend crosshairs to also draw the label
addEvent(Axis, 'afterDrawCrosshair', function (
    event: { e: PointerEvent; point: Point }
): void {

    // Check if the label has to be drawn
    if (
        !this.crosshair ||
        !this.crosshair.label ||
        !this.crosshair.label.enabled ||
        !this.cross ||
        !isNumber(this.min) ||
        !isNumber(this.max)
    ) {
        return;
    }

    let chart = this.chart,
        log = this.logarithmic,
        options = this.crosshair.label, // the label's options
        horiz = this.horiz, // axis orientation
        opposite = this.opposite, // axis position
        left = this.left, // left position
        top = this.top, // top position
        width = this.width,
        crossLabel = this.crossLabel, // the svgElement
        posx,
        posy,
        crossBox,
        formatOption = options.format,
        formatFormat = '',
        limit,
        align,
        tickInside = this.options.tickPosition === 'inside',
        snap = (this.crosshair as any).snap !== false,
        offset = 0,
        // Use last available event (#5287)
        e = event.e || (this.cross && this.cross.e),
        point = event.point,
        min = this.min,
        max = this.max;

    if (log) {
        min = log.lin2log(min);
        max = log.lin2log(max);
    }

    align = (horiz ? 'center' : opposite ?
        (this.labelAlign === 'right' ? 'right' : 'left') :
        (this.labelAlign === 'left' ? 'left' : 'center'));

    // If the label does not exist yet, create it.
    if (!crossLabel) {
        crossLabel = this.crossLabel = chart.renderer
            .label(
                '',
                0,
                void 0,
                options.shape || 'callout'
            )
            .addClass(
                'highcharts-crosshair-label highcharts-color-' + (
                    point && point.series ?
                        point.series.colorIndex :
                        this.series[0] && this.series[0].colorIndex
                )
            )
            .attr({
                align: options.align || align as any,
                padding: pick(options.padding, 8),
                r: pick(options.borderRadius, 3),
                zIndex: 2
            })
            .add(this.labelGroup);

        // Presentational
        if (!chart.styledMode) {
            crossLabel
                .attr({
                    fill: options.backgroundColor ||
                        point && point.series && point.series.color || // #14888
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
        posy = top + (opposite ? 0 : this.height);
    } else {
        posx = left + this.offset + (opposite ? width : 0);
        posy = snap ? (point.plotY || 0) + top : e.chartY;
    }

    if (!formatOption && !options.formatter) {
        if (this.dateTime) {
            formatFormat = '%b %d, %Y';
        }
        formatOption =
            '{value' + (formatFormat ? ':' + formatFormat : '') + '}';
    }

    // Show the label
    const value = snap ?
        (this.isXAxis ? point.x : point.y) :
        this.toValue(horiz ? e.chartX : e.chartY);

    // Crosshair should be rendered within Axis range (#7219). Also, the point
    // of currentPriceIndicator should be inside the plot area, #14879.
    const isInside = point && point.series ?
        point.series.isPointInside(point) :
        (isNumber(value) && value > min && value < max);

    let text = '';
    if (formatOption) {
        text = format(formatOption, { value }, chart);
    } else if (options.formatter && isNumber(value)) {
        text = options.formatter.call(this, value);
    }

    crossLabel.attr({
        text,
        x: posx,
        y: posy,
        visibility: isInside ? 'inherit' : 'hidden'
    });

    crossBox = crossLabel.getBBox();

    // now it is placed we can correct its position
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

    // check the edges
    if (horiz) {
        limit = {
            left: left - crossBox.x,
            right: left + this.width - crossBox.x
        };
    } else {
        limit = {
            left: this.labelAlign === 'left' ? left : 0,
            right: this.labelAlign === 'right' ?
                left + this.width :
                chart.chartWidth
        };
    }

    // left edge
    if (crossLabel.translateX < limit.left) {
        offset = limit.left - crossLabel.translateX;
    }
    // right edge
    if (crossLabel.translateX + crossBox.width >= limit.right) {
        offset = -(crossLabel.translateX + crossBox.width - limit.right);
    }

    // show the crosslabel
    crossLabel.attr({
        x: posx + offset,
        y: posy,
        // First set x and y, then anchorX and anchorY, when box is actually
        // calculated, #5702
        anchorX: horiz ?
            posx :
            (this.opposite ? 0 : chart.chartWidth),
        anchorY: horiz ?
            (this.opposite ? chart.chartHeight : 0) :
            posy + crossBox.height / 2
    });
});

/**
 * Based on the data grouping options decides whether
 * the data should be cropped while processing.
 *
 * @ignore
 * @function Highcharts.Series#forceCropping
 */
Series.prototype.forceCropping = function (this: Series): (boolean|undefined) {
    const chart = this.chart,
        options = this.options,
        dataGroupingOptions = options.dataGrouping,
        groupingEnabled = this.allowDG !== false && dataGroupingOptions &&
            pick(dataGroupingOptions.enabled, chart.options.isStock);

    return groupingEnabled;
};

addEvent(Chart, 'update', function (
    this: StockChart,
    e: { options: Options }
): void {
    const options = e.options;

    // Use case: enabling scrollbar from a disabled state.
    // Scrollbar needs to be initialized from a controller, Navigator in this
    // case (#6615)
    if ('scrollbar' in options && this.navigator) {
        merge(true, this.options.scrollbar, options.scrollbar);
        this.navigator.update({});
        delete options.scrollbar;
    }
});

/* *
 *
 *  Default Export
 *
 * */

export default StockChart;
