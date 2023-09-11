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

import type Axis from '../../Core/Axis/Axis';
import type AreaRangeDataLabelOptions from './AreaRangeDataLabelOptions';
import type AreaRangeSeriesOptions from './AreaRangeSeriesOptions';
import type AreaPoint from '../Area/AreaPoint';
import type RadialAxis from '../../Core/Axis/RadialAxis';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import AreaRangePoint from './AreaRangePoint.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    area: AreaSeries,
    area: {
        prototype: areaProto
    },
    column: {
        prototype: columnProto
    }
} = SeriesRegistry.seriesTypes;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber } = TC;
const { defined, extend, merge } = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Constants
 *
 * */

/**
 * The area range series is a carteseian series with higher and lower values for
 * each point along an X axis, where the area between the values is shaded.
 *
 * @sample {highcharts} highcharts/demo/arearange/
 *         Area range chart
 * @sample {highstock} stock/demo/arearange/
 *         Area range chart
 *
 * @extends      plotOptions.area
 * @product      highcharts highstock
 * @excluding    stack, stacking
 * @requires     highcharts-more
 * @optionparent plotOptions.arearange
 *
 * @private
 */
const areaRangeSeriesOptions: AreaRangeSeriesOptions = {

    /**
     * @see [fillColor](#plotOptions.arearange.fillColor)
     * @see [fillOpacity](#plotOptions.arearange.fillOpacity)
     *
     * @apioption plotOptions.arearange.color
     */

    /**
     * @default   low
     * @apioption plotOptions.arearange.colorKey
     */

    /**
     * @see [color](#plotOptions.arearange.color)
     * @see [fillOpacity](#plotOptions.arearange.fillOpacity)
     *
     * @apioption plotOptions.arearange.fillColor
     */

    /**
     * @see [color](#plotOptions.arearange.color)
     * @see [fillColor](#plotOptions.arearange.fillColor)
     *
     * @default   {highcharts} 0.75
     * @default   {highstock} 0.75
     * @apioption plotOptions.arearange.fillOpacity
     */


    /**
     * Whether to apply a drop shadow to the graph line. Since 2.3 the
     * shadow can be an object configuration containing `color`, `offsetX`,
     * `offsetY`, `opacity` and `width`.
     *
     * @type      {boolean|Highcharts.ShadowOptionsObject}
     * @product   highcharts
     * @apioption plotOptions.arearange.shadow
     */


    /**
     * Pixel width of the arearange graph line.
     *
     * @since 2.3.0
     *
     * @private
     */
    lineWidth: 1,

    /**
     * @type {number|null}
     */
    threshold: null,

    tooltip: {
        pointFormat: '<span style="color:{series.color}">\u25CF</span> ' +
            '{series.name}: <b>{point.low}</b> - <b>{point.high}</b><br/>'
    },

    /**
     * Whether the whole area or just the line should respond to mouseover
     * tooltips and other mouse or touch events.
     *
     * @since 2.3.0
     *
     * @private
     */
    trackByArea: true,

    /**
     * Extended data labels for range series types. Range series data
     * labels use no `x` and `y` options. Instead, they have `xLow`,
     * `xHigh`, `yLow` and `yHigh` options to allow the higher and lower
     * data label sets individually.
     *
     * @declare Highcharts.SeriesAreaRangeDataLabelsOptionsObject
     * @exclude x, y
     * @since   2.3.0
     * @product highcharts highstock
     *
     * @private
     */
    dataLabels: {

        align: void 0,

        verticalAlign: void 0,

        /**
         * X offset of the lower data labels relative to the point value.
         *
         * @sample highcharts/plotoptions/arearange-datalabels/
         *         Data labels on range series
         * @sample highcharts/plotoptions/arearange-datalabels/
         *         Data labels on range series
         */
        xLow: 0,

        /**
         * X offset of the higher data labels relative to the point value.
         *
         * @sample highcharts/plotoptions/arearange-datalabels/
         *         Data labels on range series
         */
        xHigh: 0,

        /**
         * Y offset of the lower data labels relative to the point value.
         *
         * @sample highcharts/plotoptions/arearange-datalabels/
         *         Data labels on range series
         */
        yLow: 0,

        /**
         * Y offset of the higher data labels relative to the point value.
         *
         * @sample highcharts/plotoptions/arearange-datalabels/
         *         Data labels on range series
         */
        yHigh: 0

    }

};

/* *
 *
 *  Class
 *
 * */

/**
 * The AreaRange series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.arearange
 *
 * @augments Highcharts.Series
 */
class AreaRangeSeries extends AreaSeries {

    /**
     *
     *  Static Properties
     *
     */

    public static defaultOptions: AreaRangeSeriesOptions = merge(
        AreaSeries.defaultOptions,
        areaRangeSeriesOptions
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<AreaRangePoint> = void 0 as any;
    public options: AreaRangeSeriesOptions = void 0 as any;
    public points: Array<AreaRangePoint> = void 0 as any;
    public lowerStateMarkerGraphic?: SVGElement = void 0;
    public upperStateMarkerGraphic?: SVGElement;
    public xAxis: Axis|RadialAxis.AxisComposition = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public toYData(point: AreaRangePoint): Array<number> {
        return [point.low, point.high];
    }

    /**
     * Translate a point's plotHigh from the internal angle and radius measures
     * to true plotHigh coordinates. This is an addition of the toXY method
     * found in Polar.js, because it runs too early for arearanges to be
     * considered (#3419).
     * @private
     */
    public highToXY(point: AreaRangePoint): void {
        // Find the polar plotX and plotY
        const chart = this.chart,
            xy = (this.xAxis as RadialAxis.AxisComposition).postTranslate(
                point.rectPlotX || 0,
                this.yAxis.len - (point.plotHigh || 0)
            );

        point.plotHighX = xy.x - chart.plotLeft;
        point.plotHigh = xy.y - chart.plotTop;
        point.plotLowX = point.plotX;
    }

    /**
     * Extend the line series' getSegmentPath method by applying the segment
     * path to both lower and higher values of the range.
     * @private
     */
    public getGraphPath(points: Array<AreaRangePoint>): SVGPath {

        const highPoints = [],
            highAreaPoints: Array<AreaPoint> = [],
            getGraphPath = areaProto.getGraphPath,
            options = this.options,
            polar = this.chart.polar,
            connectEnds = polar && options.connectEnds !== false,
            connectNulls = options.connectNulls;

        let i,
            point: AreaRangePoint,
            pointShim: any,
            step = options.step;

        points = points || this.points;

        // Create the top line and the top part of the area fill. The area fill
        // compensates for null points by drawing down to the lower graph,
        // moving across the null gap and starting again at the lower graph.
        i = points.length;
        while (i--) {
            point = points[i];

            // Support for polar
            const highAreaPoint = polar ? {
                plotX: point.rectPlotX,
                plotY: point.yBottom,
                doCurve: false // #5186, gaps in areasplinerange fill
            } : {
                plotX: point.plotX,
                plotY: point.plotY,
                doCurve: false // #5186, gaps in areasplinerange fill
            } as any;

            if (
                !point.isNull &&
                !connectEnds &&
                !connectNulls &&
                (!points[i + 1] || points[i + 1].isNull)
            ) {
                highAreaPoints.push(highAreaPoint);
            }

            pointShim = {
                polarPlotY: (point as any).polarPlotY,
                rectPlotX: point.rectPlotX,
                yBottom: point.yBottom,
                // plotHighX is for polar charts
                plotX: pick(point.plotHighX, point.plotX),
                plotY: point.plotHigh,
                isNull: point.isNull
            };

            highAreaPoints.push(pointShim);

            highPoints.push(pointShim);

            if (
                !point.isNull &&
                !connectEnds &&
                !connectNulls &&
                (!points[i - 1] || points[i - 1].isNull)
            ) {
                highAreaPoints.push(highAreaPoint);
            }
        }

        // Get the paths
        const lowerPath = getGraphPath.call(this, points);
        if (step) {
            if ((step as any) === true) {
                step = 'left';
            }
            options.step = {
                left: 'right',
                center: 'center',
                right: 'left'
            }[step] as any; // swap for reading in getGraphPath
        }
        const higherPath = getGraphPath.call(this, highPoints);
        const higherAreaPath = getGraphPath.call(this, highAreaPoints);
        options.step = step;

        // Create a line on both top and bottom of the range
        const linePath = ([] as SVGPath).concat(lowerPath, higherPath);

        // For the area path, we need to change the 'move' statement into
        // 'lineTo'
        if (
            !this.chart.polar &&
            higherAreaPath[0] &&
            higherAreaPath[0][0] === 'M'
        ) {
            // This probably doesn't work for spline
            higherAreaPath[0] = [
                'L',
                higherAreaPath[0][1],
                higherAreaPath[0][2]
            ];
        }

        this.graphPath = linePath;
        this.areaPath = lowerPath.concat(higherAreaPath);

        // Prepare for sideways animation
        (linePath as any).isArea = true;
        (linePath as any).xMap = lowerPath.xMap;
        this.areaPath.xMap = lowerPath.xMap;

        return linePath;
    }

    /**
     * Extend the basic drawDataLabels method by running it for both lower and
     * higher values.
     * @private
     */
    public drawDataLabels(): void {

        const data = this.points,
            length = data.length,
            originalDataLabels = [],
            dataLabelOptions = this.options.dataLabels,
            inverted = this.chart.inverted;

        let i: number,
            point: AreaRangePoint,
            up: boolean,
            upperDataLabelOptions: AreaRangeDataLabelOptions,
            lowerDataLabelOptions: AreaRangeDataLabelOptions;

        if (dataLabelOptions) {
            // Split into upper and lower options. If data labels is an array,
            // the first element is the upper label, the second is the lower.
            //
            // TODO: We want to change this and allow multiple labels for both
            // upper and lower values in the future - introducing some options
            // for which point value to use as Y for the dataLabel, so that this
            // could be handled in Series.drawDataLabels. This would also
            // improve performance since we now have to loop over all the points
            // multiple times to work around the data label logic.
            if (isArray(dataLabelOptions)) {
                upperDataLabelOptions = dataLabelOptions[0] || {
                    enabled: false
                };
                lowerDataLabelOptions = dataLabelOptions[1] || {
                    enabled: false
                };
            } else {
                // Make copies
                upperDataLabelOptions = extend({}, dataLabelOptions);
                upperDataLabelOptions.x = dataLabelOptions.xHigh;
                upperDataLabelOptions.y = dataLabelOptions.yHigh;
                lowerDataLabelOptions = extend({}, dataLabelOptions);
                lowerDataLabelOptions.x = dataLabelOptions.xLow;
                lowerDataLabelOptions.y = dataLabelOptions.yLow;
            }

            // Draw upper labels
            if (upperDataLabelOptions.enabled || this.hasDataLabels?.()) {
                // Set preliminary values for plotY and dataLabel
                // and draw the upper labels
                i = length;
                while (i--) {
                    point = data[i];
                    if (point) {
                        const { plotHigh = 0, plotLow = 0 } = point;
                        up = upperDataLabelOptions.inside ?
                            plotHigh < plotLow :
                            plotHigh > plotLow;

                        point.y = point.high;
                        point._plotY = point.plotY;
                        point.plotY = plotHigh;

                        // Store original data labels and set preliminary label
                        // objects to be picked up in the uber method
                        originalDataLabels[i] = point.dataLabel;
                        point.dataLabel = point.dataLabelUpper;

                        // Set the default offset
                        point.below = up;
                        if (inverted) {
                            if (!upperDataLabelOptions.align) {
                                upperDataLabelOptions.align = up ?
                                    'right' : 'left';
                            }
                        } else {
                            if (!upperDataLabelOptions.verticalAlign) {
                                upperDataLabelOptions.verticalAlign = up ?
                                    'top' :
                                    'bottom';
                            }
                        }
                    }
                }

                this.options.dataLabels = upperDataLabelOptions;

                if (areaProto.drawDataLabels) {
                    // #1209:
                    areaProto.drawDataLabels.apply(this, arguments);
                }

                // Reset state after the upper labels were created. Move
                // it to point.dataLabelUpper and reassign the originals.
                // We do this here to support not drawing a lower label.
                i = length;
                while (i--) {
                    point = data[i];
                    if (point) {
                        point.dataLabelUpper = point.dataLabel;
                        point.dataLabel = originalDataLabels[i];
                        delete point.dataLabels;
                        point.y = point.low;
                        point.plotY = point._plotY;
                    }
                }
            }

            // Draw lower labels
            if (lowerDataLabelOptions.enabled || this.hasDataLabels?.()) {
                i = length;
                while (i--) {
                    point = data[i];
                    if (point) {
                        const { plotHigh = 0, plotLow = 0 } = point;
                        up = lowerDataLabelOptions.inside ?
                            plotHigh < plotLow :
                            plotHigh > plotLow;

                        // Set the default offset
                        point.below = !up;
                        if (inverted) {
                            if (!lowerDataLabelOptions.align) {
                                lowerDataLabelOptions.align = up ?
                                    'left' : 'right';
                            }
                        } else {
                            if (!lowerDataLabelOptions.verticalAlign) {
                                lowerDataLabelOptions.verticalAlign = up ?
                                    'bottom' :
                                    'top';
                            }
                        }
                    }
                }

                this.options.dataLabels = lowerDataLabelOptions;

                if (areaProto.drawDataLabels) {
                    areaProto.drawDataLabels.apply(this, arguments);
                }
            }

            // Merge upper and lower into point.dataLabels for later destroying
            if (upperDataLabelOptions.enabled) {
                i = length;
                while (i--) {
                    point = data[i];
                    if (point) {
                        point.dataLabels = [
                            point.dataLabelUpper as any,
                            point.dataLabel
                        ].filter(function (
                            label: (SVGElement|undefined)
                        ): boolean {
                            return !!label;
                        });
                    }
                }
            }

            // Reset options
            this.options.dataLabels = dataLabelOptions;
        }
    }

    public alignDataLabel(): void {
        columnProto.alignDataLabel.apply(this, arguments);
    }

    public drawPoints(): void {
        const series = this,
            pointLength = series.points.length;

        let i: number,
            point: AreaRangePoint;

        // Draw bottom points
        areaProto.drawPoints.apply(series, arguments);

        // Prepare drawing top points
        i = 0;
        while (i < pointLength) {
            point = series.points[i];

            /**
             * Array for multiple SVG graphics representing the point in the
             * chart. Only used in cases where the point can not be represented
             * by a single graphic.
             *
             * @see Highcharts.Point#graphic
             *
             * @name Highcharts.Point#graphics
             * @type {Array<Highcharts.SVGElement>|undefined}
             */
            point.graphics = point.graphics || [];

            // Save original props to be overridden by temporary props for top
            // points
            point.origProps = {
                plotY: point.plotY,
                plotX: point.plotX,
                isInside: point.isInside,
                negative: point.negative,
                zone: point.zone,
                y: point.y
            };

            if (point.graphic || point.graphics[0]) {
                point.graphics[0] = point.graphic;
            }

            point.graphic = point.graphics[1];
            point.plotY = point.plotHigh;
            if (defined(point.plotHighX)) {
                point.plotX = point.plotHighX;
            }
            point.y = pick(point.high, point.origProps.y); // #15523
            point.negative = point.y < (series.options.threshold || 0);
            if (series.zones.length) {
                point.zone = point.getZone();
            }

            if (!series.chart.polar) {
                point.isInside = point.isTopInside = (
                    typeof point.plotY !== 'undefined' &&
                    point.plotY >= 0 &&
                    point.plotY <= series.yAxis.len && // #3519
                    point.plotX >= 0 &&
                    point.plotX <= series.xAxis.len
                );
            }
            i++;
        }

        // Draw top points
        areaProto.drawPoints.apply(series, arguments);

        // Reset top points preliminary modifications
        i = 0;
        while (i < pointLength) {
            point = series.points[i];
            point.graphics = point.graphics || [];

            if (point.graphic || point.graphics[1]) {
                point.graphics[1] = point.graphic;
            }
            point.graphic = point.graphics[0];
            if (point.origProps) {
                extend(point, point.origProps);
                delete point.origProps;
            }
            i++;
        }
    }

}

addEvent(AreaRangeSeries, 'afterTranslate', function (): void {

    // Set plotLow and plotHigh

    // Rules out lollipop, but lollipop should not inherit range series in the
    // first place
    if (this.pointArrayMap.join(',') === 'low,high') {
        this.points.forEach((point): void => {
            const high = point.high,
                plotY = point.plotY;

            if (point.isNull) {
                point.plotY = void 0;
            } else {
                point.plotLow = plotY;

                // Calculate plotHigh value based on each yAxis scale (#15752)
                point.plotHigh = isNumber(high) ? this.yAxis.translate(
                    this.dataModify ?
                        this.dataModify.modifyValue(high) : high,
                    false,
                    true,
                    void 0,
                    true
                ) : void 0;

                if (this.dataModify) {
                    point.yBottom = point.plotHigh;
                }
            }
        });
    }
}, { order: 0 });

addEvent(AreaRangeSeries, 'afterTranslate', function (): void {
    const inverted = this.chart.inverted;
    this.points.forEach((point): void => {
        // Postprocessing after the PolarComposition's afterTranslate
        if (this.chart.polar) {
            this.highToXY(point);
            point.plotLow = point.plotY;
            point.tooltipPos = [
                ((point.plotHighX || 0) + (point.plotLowX || 0)) / 2,
                ((point.plotHigh || 0) + (point.plotLow || 0)) / 2
            ];

        // Put the tooltip in the middle of the range
        } else {
            const tooltipPos = point.pos(false, point.plotLow),
                posHigh = point.pos(false, point.plotHigh);

            if (tooltipPos && posHigh) {
                tooltipPos[0] = (tooltipPos[0] + posHigh[0]) / 2;
                tooltipPos[1] = (tooltipPos[1] + posHigh[1]) / 2;
            }
            point.tooltipPos = tooltipPos;
        }


    });
}, { order: 3 });

/* *
 *
 *  Class Prototype
 *
 * */

interface AreaRangeSeries {
    deferTranslatePolar: boolean;
    pointArrayMap: Array<string>;
    pointClass: typeof AreaRangePoint;
    pointValKey: string;
}

extend(AreaRangeSeries.prototype, {
    deferTranslatePolar: true,
    pointArrayMap: ['low', 'high'],
    pointClass: AreaRangePoint,
    pointValKey: 'low',
    setStackedPoints: noop
});


/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        arearange: typeof AreaRangeSeries;
    }
}

SeriesRegistry.registerSeriesType('arearange', AreaRangeSeries);


/* *
 *
 *  Default Export
 *
 * */

export default AreaRangeSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `arearange` series. If the [type](#series.arearange.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 *
 * @extends   series,plotOptions.arearange
 * @excluding dataParser, dataURL, stack, stacking
 * @product   highcharts highstock
 * @requires  highcharts-more
 * @apioption series.arearange
 */

/**
 * @see [fillColor](#series.arearange.fillColor)
 * @see [fillOpacity](#series.arearange.fillOpacity)
 *
 * @apioption series.arearange.color
 */

/**
 * An array of data points for the series. For the `arearange` series type,
 * points can be given in the following ways:
 *
 * 1.  An array of arrays with 3 or 2 values. In this case, the values
 *     correspond to `x,low,high`. If the first value is a string, it is
 *     applied as the name of the point, and the `x` value is inferred.
 *     The `x` value can also be omitted, in which case the inner arrays
 *     should be of length 2\. Then the `x` value is automatically calculated,
 *     either starting at 0 and incremented by 1, or from `pointStart`
 *     and `pointInterval` given in the series options.
 *     ```js
 *     data: [
 *         [0, 8, 3],
 *         [1, 1, 1],
 *         [2, 6, 8]
 *     ]
 *     ```
 *
 * 2.  An array of objects with named values. The following snippet shows only a
 *     few settings, see the complete options set below. If the total number of
 *     data points exceeds the series'
 *     [turboThreshold](#series.arearange.turboThreshold),
 *     this option is not available.
 *     ```js
 *     data: [{
 *         x: 1,
 *         low: 9,
 *         high: 0,
 *         name: "Point2",
 *         color: "#00FF00"
 *     }, {
 *         x: 1,
 *         low: 3,
 *         high: 4,
 *         name: "Point1",
 *         color: "#FF00FF"
 *     }]
 *     ```
 *
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<Array<(number|string),number>|Array<(number|string),number,number>|*>}
 * @extends   series.line.data
 * @excluding marker, y
 * @product   highcharts highstock
 * @apioption series.arearange.data
 */

/**
 * @extends   series.arearange.dataLabels
 * @product   highcharts highstock
 * @apioption series.arearange.data.dataLabels
 */

/**
 * @see [color](#series.arearange.color)
 * @see [fillOpacity](#series.arearange.fillOpacity)
 *
 * @apioption series.arearange.fillColor
 */

/**
 * @see [color](#series.arearange.color)
 * @see [fillColor](#series.arearange.fillColor)
 *
 * @default   {highcharts} 0.75
 * @default   {highstock} 0.75
 * @apioption series.arearange.fillOpacity
 */

/**
 * The high or maximum value for each data point.
 *
 * @type      {number}
 * @product   highcharts highstock
 * @apioption series.arearange.data.high
 */

/**
 * The low or minimum value for each data point.
 *
 * @type      {number}
 * @product   highcharts highstock
 * @apioption series.arearange.data.low
 */

''; // adds doclets above to tranpiled file
