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
    GaugeSeriesDialOptions,
    GaugeSeriesOptions
} from './GaugeSeriesOptions';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type RadialAxis from '../../Core/Axis/RadialAxis';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import GaugePoint from './GaugePoint.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import { Palette } from '../../Core/Color/Palettes.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: Series,
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;
import U from '../../Core/Utilities.js';
const {
    clamp,
    isNumber,
    extend,
    merge,
    pick,
    pInt,
    defined
} = U;


/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        angular?: boolean;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        fixedBox?: boolean;
        forceDL?: boolean;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 *
 * The `gauge` series type
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.map
 *
 * @augments Highcharts.Series
 */
class GaugeSeries extends Series {

    /* *
     *
     *  Static properties
     *
     * */

    /**
     * Gauges are circular plots displaying one or more values with a dial
     * pointing to values along the perimeter.
     *
     * @sample highcharts/demo/gauge-speedometer/
     *         Gauge chart
     *
     * @extends      plotOptions.line
     * @excluding    animationLimit, boostThreshold, colorAxis, colorKey,
     *               connectEnds, connectNulls, cropThreshold, dashStyle,
     *               dragDrop, findNearestPointBy, getExtremesFromAll, marker,
     *               negativeColor, pointPlacement, shadow, softThreshold,
     *               stacking, states, step, threshold, turboThreshold, xAxis,
     *               zoneAxis, zones, dataSorting, boostBlending
     * @product      highcharts
     * @requires     highcharts-more
     * @optionparent plotOptions.gauge
     */
    public static defaultOptions: GaugeSeriesOptions = merge(
        Series.defaultOptions,
        {
            /**
             * When this option is `true`, the dial will wrap around the axes.
             * For instance, in a full-range gauge going from 0 to 360, a value
             * of 400 will point to 40\. When `wrap` is `false`, the dial stops
             * at 360.
             *
             * @see [overshoot](#plotOptions.gauge.overshoot)
             *
             * @type      {boolean}
             * @default   true
             * @since     3.0
             * @product   highcharts
             * @apioption plotOptions.gauge.wrap
             */

            /**
             * Data labels for the gauge. For gauges, the data labels are
             * enabled by default and shown in a bordered box below the point.
             *
             * @since   2.3.0
             * @product highcharts
             */
            dataLabels: {
                borderColor: Palette.neutralColor20,
                borderRadius: 3,
                borderWidth: 1,
                crop: false,
                defer: false,
                enabled: true,
                verticalAlign: 'top',
                y: 15,
                zIndex: 2
            },

            /**
             * Options for the dial or arrow pointer of the gauge.
             *
             * In styled mode, the dial is styled with the
             * `.highcharts-gauge-series .highcharts-dial` rule.
             *
             * @sample {highcharts} highcharts/css/gauge/
             *         Styled mode
             *
             * @type    {*}
             * @since   2.3.0
             * @product highcharts
             */
            dial: {
                /**
                 * The background or fill color of the gauge's dial.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                 * @default   #000000
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.backgroundColor
                 */
                backgroundColor: Palette.neutralColor100,

                /**
                 * The length of the dial's base part, relative to the total
                 * radius or length of the dial.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {string}
                 * @default   70%
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.baseLength
                 */
                baseLength: '70%',

                /**
                 * The pixel width of the base of the gauge dial. The base is
                 * the part closest to the pivot, defined by baseLength.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {number}
                 * @default   3
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.baseWidth
                 */
                baseWidth: 3,

                /**
                 * The border color or stroke of the gauge's dial. By default,
                 * the borderWidth is 0, so this must be set in addition to a
                 * custom border color.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                 * @default   #cccccc
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.borderColor
                 */
                borderColor: Palette.neutralColor20,

                /**
                 * The width of the gauge dial border in pixels.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {number}
                 * @default   0
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.borderWidth
                 */
                borderWidth: 0,

                /**
                 * An array with an SVG path for the custom dial.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-path/
                 *         Dial options demonstrated
                 *
                 * @type      {Highcharts.SVGPathArray}
                 * @since 10.2.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.path
                 */

                /**
                 * The radius or length of the dial, in percentages relative to
                 * the radius of the gauge itself.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {string}
                 * @default   80%
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.radius
                 */
                radius: '80%',

                /**
                 * The length of the dial's rear end, the part that extends out
                 * on the other side of the pivot. Relative to the dial's
                 * length.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {string}
                 * @default   10%
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.rearLength
                 */
                rearLength: '10%',

                /**
                 * The width of the top of the dial, closest to the perimeter.
                 * The pivot narrows in from the base to the top.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-dial/
                 *         Dial options demonstrated
                 *
                 * @type      {number}
                 * @default   1
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.dial.topWidth
                 */
                topWidth: 1
            },

            /**
             * Allow the dial to overshoot the end of the perimeter axis by
             * this many degrees. Say if the gauge axis goes from 0 to 60, a
             * value of 100, or 1000, will show 5 degrees beyond the end of the
             * axis when this option is set to 5.
             *
             * @see [wrap](#plotOptions.gauge.wrap)
             *
             * @sample {highcharts} highcharts/plotoptions/gauge-overshoot/
             *         Allow 5 degrees overshoot
             *
             * @type      {number}
             * @since     3.0.10
             * @product   highcharts
             * @apioption plotOptions.gauge.overshoot
             */

            /**
             * Options for the pivot or the center point of the gauge.
             *
             * In styled mode, the pivot is styled with the
             * `.highcharts-gauge-series .highcharts-pivot` rule.
             *
             * @sample {highcharts} highcharts/css/gauge/
             *         Styled mode
             *
             * @type    {*}
             * @since   2.3.0
             * @product highcharts
             */

            pivot: {
                /**
                 * The pixel radius of the pivot.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-pivot/
                 *         Pivot options demonstrated
                 *
                 * @type      {number}
                 * @default   5
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.pivot.radius
                 */
                radius: 5,

                /**
                 * The border or stroke width of the pivot.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-pivot/
                 *         Pivot options demonstrated
                 *
                 * @type      {number}
                 * @default   0
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.pivot.borderWidth
                 */
                borderWidth: 0,

                /**
                 * The border or stroke color of the pivot. In able to change
                 * this, the borderWidth must also be set to something other
                 * than the default 0.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-pivot/
                 *         Pivot options demonstrated
                 *
                 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                 * @default   #cccccc
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.pivot.borderColor
                 */
                borderColor: Palette.neutralColor20,

                /**
                 * The background color or fill of the pivot.
                 *
                 * @sample {highcharts} highcharts/plotoptions/gauge-pivot/
                 *         Pivot options demonstrated
                 *
                 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                 * @default   #000000
                 * @since     2.3.0
                 * @product   highcharts
                 * @apioption plotOptions.gauge.pivot.backgroundColor
                 */
                backgroundColor: Palette.neutralColor100
            },

            tooltip: {
                headerFormat: ''
            },

            /**
             * Whether to display this particular series or series type in the
             * legend. Defaults to false for gauge series.
             *
             * @since   2.3.0
             * @product highcharts
             */
            showInLegend: false

            // Prototype members
        } as GaugeSeriesOptions
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<GaugePoint> = void 0 as any;
    public points: Array<GaugePoint> = void 0 as any;
    public options: GaugeSeriesOptions = void 0 as any;

    public yAxis: RadialAxis.AxisComposition = void 0 as any;
    public pivot?: SVGElement;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Calculate paths etc
     * @private
     */
    public translate(): void {

        const series = this,
            yAxis = series.yAxis,
            options = series.options,
            center = yAxis.center;

        series.generatePoints();

        series.points.forEach((point): void => {

            const dialOptions: GaugeSeriesDialOptions =
                    merge(options.dial, point.dial) as any,
                radius =
                    (pInt(dialOptions.radius) * center[2]) / 200,
                baseLength =
                    (pInt(dialOptions.baseLength) * radius) / 100,
                rearLength =
                    (pInt(dialOptions.rearLength) * radius) / 100,
                baseWidth = dialOptions.baseWidth,
                topWidth = dialOptions.topWidth;

            let overshoot = options.overshoot,
                rotation = yAxis.startAngleRad + yAxis.translate(
                    point.y as any, void 0, void 0, void 0, true
                );

            // Handle the wrap and overshoot options
            if (isNumber(overshoot) || options.wrap === false) {
                overshoot = isNumber(overshoot) ?
                    (overshoot / 180 * Math.PI) : 0;
                rotation = clamp(
                    rotation,
                    yAxis.startAngleRad - overshoot,
                    yAxis.endAngleRad + overshoot
                );
            }

            rotation = rotation * 180 / Math.PI;

            point.shapeType = 'path';
            const d: SVGPath = dialOptions.path || [
                ['M', -rearLength, -baseWidth / 2],
                ['L', baseLength, -baseWidth / 2],
                ['L', radius, -topWidth / 2],
                ['L', radius, topWidth / 2],
                ['L', baseLength, baseWidth / 2],
                ['L', -rearLength, baseWidth / 2],
                ['Z']
            ];
            point.shapeArgs = {
                d,
                translateX: center[0],
                translateY: center[1],
                rotation: rotation
            };

            // Positions for data label
            point.plotX = center[0];
            point.plotY = center[1];

            if (defined(point.y) && yAxis.max - yAxis.min) {
                point.percentage =
                    (point.y - yAxis.min) / (yAxis.max - yAxis.min) * 100;
            }
        });
    }

    /**
     * Draw the points where each point is one needle
     * @private
     */
    public drawPoints(): void {

        const series = this,
            chart = series.chart,
            center = series.yAxis.center,
            pivot = series.pivot,
            options = series.options,
            pivotOptions = options.pivot,
            renderer = chart.renderer;

        series.points.forEach((point): void => {

            const graphic = point.graphic,
                shapeArgs = point.shapeArgs,
                d = shapeArgs.d,
                dialOptions = merge(options.dial, point.dial); // #1233

            if (graphic) {
                graphic.animate(shapeArgs);
                shapeArgs.d = d; // animate alters it
            } else {
                point.graphic =
                    (renderer as any)[point.shapeType as any](shapeArgs)
                        .addClass('highcharts-dial')
                        .add(series.group);
            }

            // Presentational attributes
            if (!chart.styledMode) {
                (point.graphic as any)[graphic ? 'animate' : 'attr']({
                    stroke: dialOptions.borderColor,
                    'stroke-width': dialOptions.borderWidth,
                    fill: dialOptions.backgroundColor
                });
            }
        });

        // Add or move the pivot
        if (pivot) {
            pivot.animate({ // #1235
                translateX: center[0],
                translateY: center[1]
            });
        } else if (pivotOptions) {
            series.pivot =
                renderer.circle(0, 0, pivotOptions.radius)
                    .attr({
                        zIndex: 2
                    })
                    .addClass('highcharts-pivot')
                    .translate(center[0], center[1])
                    .add(series.group);

            // Presentational attributes
            if (!chart.styledMode) {
                series.pivot.attr({
                    fill: pivotOptions.backgroundColor,
                    stroke: pivotOptions.borderColor,
                    'stroke-width': pivotOptions.borderWidth
                });
            }
        }
    }

    /**
     * Animate the arrow up from startAngle
     * @private
     */
    public animate(init?: boolean): void {
        const series = this;

        if (!init) {
            series.points.forEach((point): void => {
                const graphic = point.graphic;

                if (graphic) {
                    // start value
                    graphic.attr({
                        rotation: series.yAxis.startAngleRad * 180 / Math.PI
                    });

                    // animate
                    graphic.animate({
                        rotation: point.shapeArgs.rotation
                    }, series.options.animation);
                }
            });
        }
    }

    /**
     * @private
     */
    public render(): void {
        this.group = this.plotGroup(
            'group',
            'series',
            this.visible ? 'inherit' : 'hidden',
            this.options.zIndex,
            this.chart.seriesGroup
        );
        Series.prototype.render.call(this);
        this.group.clip(this.chart.clipRect);
    }
    /**
     * Extend the basic setData method by running processData and generatePoints
     * immediately, in order to access the points from the legend.
     * @private
     */
    public setData(
        data: Array<(PointOptions|PointShortOptions)>,
        redraw?: boolean
    ): void {
        Series.prototype.setData.call(this, data, false);
        this.processData();
        this.generatePoints();
        if (pick(redraw, true)) {
            this.chart.redraw();
        }
    }

    /**
     * Define hasData function for non-cartesian series.
     * Returns true if the series has points at all.
     * @private
     */
    public hasData(): boolean {
        return !!this.points.length; // != 0
    }

    /* eslint-enable valid-jsdoc */
}

/* *
 *
 *  Prototype properties
 *
 * */

interface GaugeSeries {
    angular: boolean;
    directTouch: boolean;
    drawGraph(): void;
    fixedBox: boolean;
    forceDL: boolean;
    noSharedTooltip: boolean;
    pointClass: typeof GaugePoint;
}

extend(GaugeSeries.prototype, {
    // chart.angular will be set to true when a gauge series is present,
    // and this will be used on the axes
    angular: true,
    directTouch: true, // #5063
    drawGraph: noop,
    drawTracker: ColumnSeries.prototype.drawTracker,
    fixedBox: true,
    forceDL: true,
    noSharedTooltip: true,
    pointClass: GaugePoint,
    trackerGroups: ['group', 'dataLabelsGroup']
});
/* *
 *
 *  Registry
 *
 * */

/**
 * @private
 */
declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        gauge: typeof GaugeSeries;
    }
}

SeriesRegistry.registerSeriesType('gauge', GaugeSeries);

/* *
 *
 *  Default Export
 *
 * */

export default GaugeSeries;

/* *
 *
 *  API options
 *
 * */

/**
 * A `gauge` series. If the [type](#series.gauge.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.gauge
 * @excluding animationLimit, boostThreshold, connectEnds, connectNulls,
 *            cropThreshold, dashStyle, dataParser, dataURL, findNearestPointBy,
 *            getExtremesFromAll, marker, negativeColor, pointPlacement, shadow,
 *            softThreshold, stack, stacking, states, step, threshold,
 *            turboThreshold, zoneAxis, zones, dataSorting, boostBlending
 * @product   highcharts
 * @requires  highcharts-more
 * @apioption series.gauge
 */

/**
 * An array of data points for the series. For the `gauge` series type,
 * points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.gauge.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        y: 6,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        y: 8,
 *        name: "Point1",
 *       color: "#FF00FF"
 *    }]
 *    ```
 *
 * The typical gauge only contains a single data value.
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<number|null|*>}
 * @extends   series.line.data
 * @excluding drilldown, marker, x
 * @product   highcharts
 * @apioption series.gauge.data
 */

''; // adds the doclets above in the transpiled file
