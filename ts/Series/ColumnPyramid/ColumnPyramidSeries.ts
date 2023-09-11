/* *
 *
 *  (c) 2010-2021 Sebastian Bochan
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

import type ColumnPyramidPoint from './ColumnPyramidPoint';
import type ColumnPyramidSeriesOptions from './ColumnPyramidSeriesOptions';
import ColumnSeries from '../Column/ColumnSeries.js';
const { prototype: colProto } = ColumnSeries;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
import U from '../../Shared/Utilities.js';
const {
    clamp,
    pick
} = U;

/**
 * The ColumnPyramidSeries class
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.columnpyramid
 *
 * @augments Highcharts.Series
 */

class ColumnPyramidSeries extends ColumnSeries {

    /* *
     *
     * Static properties
     *
     * */

    /**
     * Column pyramid series display one pyramid per value along an X axis.
     * To display horizontal pyramids, set [chart.inverted](#chart.inverted) to
     * `true`.
     *
     * @sample {highcharts|highstock} highcharts/demo/column-pyramid/
     *         Column pyramid
     * @sample {highcharts|highstock} highcharts/plotoptions/columnpyramid-stacked/
     *         Column pyramid stacked
     * @sample {highcharts|highstock} highcharts/plotoptions/columnpyramid-inverted/
     *         Column pyramid inverted
     *
     * @extends      plotOptions.column
     * @since        7.0.0
     * @product      highcharts highstock
     * @excluding    boostThreshold, borderRadius, crisp, depth, edgeColor,
     *               edgeWidth, groupZPadding, negativeColor, softThreshold,
     *               threshold, zoneAxis, zones, boostBlending
     * @requires     highcharts-more
     * @optionparent plotOptions.columnpyramid
     */

    public static defaultOptions: ColumnPyramidSeriesOptions = merge(ColumnSeries.defaultOptions, {
        // Nothing here
    });

    /* *
     *
     * Properties
     *
     * */
    public data: Array<ColumnPyramidPoint> = void 0 as any;

    public options: ColumnPyramidSeriesOptions = void 0 as any;

    public points: Array<ColumnPyramidPoint> = void 0 as any;

    /* *
     *
     * Functions
     *
     * */

    /* eslint-disable-next-line valid-jsdoc */

    /**
     * Overrides the column translate method
     * @private
     */
    public translate(): void {
        let series = this,
            chart = series.chart,
            options = series.options,
            dense = series.dense =
                (series.closestPointRange as any) * series.xAxis.transA < 2,
            borderWidth = series.borderWidth = pick(
                options.borderWidth,
                dense ? 0 : 1 // #3635
            ),
            yAxis = series.yAxis,
            threshold = options.threshold,
            translatedThreshold = series.translatedThreshold =
                yAxis.getThreshold(threshold as any),
            minPointLength = pick(options.minPointLength, 5),
            metrics = series.getColumnMetrics(),
            pointWidth = metrics.width,
            // postprocessed for border width
            seriesBarW = series.barW =
                Math.max(pointWidth, 1 + 2 * borderWidth),
            pointXOffset = series.pointXOffset = metrics.offset;

        if (chart.inverted) {
            (translatedThreshold as any) -= 0.5; // #3355
        }

        // When the pointPadding is 0,
        // we want the pyramids to be packed tightly,
        // so we allow individual pyramids to have individual sizes.
        // When pointPadding is greater,
        // we strive for equal-width columns (#2694).
        if (options.pointPadding) {
            seriesBarW = Math.ceil(seriesBarW);
        }

        colProto.translate.apply(series);

        // Record the new values
        series.points.forEach(function (
            point: ColumnPyramidPoint
        ): void {
            let yBottom = pick<number|undefined, number>(
                    point.yBottom, translatedThreshold as any
                ),
                safeDistance = 999 + Math.abs(yBottom),
                plotY = clamp(
                    point.plotY as any,
                    -safeDistance,
                    yAxis.len + safeDistance
                ),
                // Don't draw too far outside plot area
                // (#1303, #2241, #4264)
                barX = (point.plotX as any) + pointXOffset,
                barW = seriesBarW / 2,
                barY = Math.min(plotY, yBottom),
                barH = Math.max(plotY, yBottom) - barY,
                stackTotal: number,
                stackHeight: number,
                topPointY: number,
                topXwidth: number,
                bottomXwidth: number,
                invBarPos: number,
                x1, x2, x3, x4, y1, y2;

            // Adjust for null or missing points
            if (options.centerInCategory) {
                barX = series.adjustForMissingColumns(
                    barX,
                    pointWidth,
                    point,
                    metrics
                );
            }

            point.barX = barX;
            point.pointWidth = pointWidth;

            // Fix the tooltip on center of grouped pyramids
            // (#1216, #424, #3648)
            point.tooltipPos = chart.inverted ?
                [
                    yAxis.len + (yAxis.pos as any) - chart.plotLeft - plotY,
                    series.xAxis.len - barX - barW,
                    barH
                ] :
                [
                    barX + barW,
                    plotY + (yAxis.pos as any) - chart.plotTop,
                    barH
                ];

            stackTotal =
                (threshold as any) + ((point.total || point.y) as any);

            // overwrite stacktotal (always 100 / -100)
            if (options.stacking === 'percent') {
                stackTotal =
                    (threshold as any) + ((point.y as any) < 0) ?
                        -100 :
                        100;
            }

            // get the highest point (if stack, extract from total)
            topPointY = yAxis.toPixels((stackTotal), true);

            // calculate height of stack (in pixels)
            stackHeight =
                chart.plotHeight - topPointY -
                (chart.plotHeight - (translatedThreshold as any));

            // topXwidth and bottomXwidth = width of lines from the center
            // calculated from tanges proportion.
            // Cannot be a NaN #12514
            topXwidth = stackHeight ?
                (barW * (barY - topPointY)) / stackHeight : 0;
            // like topXwidth, but with height of point
            bottomXwidth = stackHeight ?
                (barW * (barY + barH - topPointY)) / stackHeight :
                0;

            /*
                    /\
                   /  \
            x1,y1,------ x2,y1
                /      \
               ----------
            x4,y2        x3,y2
            */

            x1 = barX - topXwidth + barW;
            x2 = barX + topXwidth + barW;
            x3 = barX + bottomXwidth + barW;
            x4 = barX - bottomXwidth + barW;

            y1 = barY - minPointLength;
            y2 = barY + barH;

            if ((point.y as any) < 0) {
                y1 = barY;
                y2 = barY + barH + minPointLength;
            }

            // inverted chart
            if (chart.inverted) {
                invBarPos = yAxis.width - barY;
                stackHeight =
                    topPointY - (yAxis.width - (translatedThreshold as any));

                // proportion tanges
                topXwidth = (barW *
                (topPointY - invBarPos)) / stackHeight;
                bottomXwidth = (barW *
                (topPointY - (invBarPos - barH))) / stackHeight;

                x1 = barX + barW + topXwidth; // top bottom
                x2 = x1 - 2 * topXwidth; // top top
                x3 = barX - bottomXwidth + barW; // bottom top
                x4 = barX + bottomXwidth + barW; // bottom bottom

                y1 = barY;
                y2 = barY + barH - minPointLength;

                if ((point.y as any) < 0) {
                    y2 = barY + barH + minPointLength;
                }
            }

            // Register shape type and arguments to be used in drawPoints
            point.shapeType = 'path';
            point.shapeArgs = {
            // args for datalabels positioning
                x: x1,
                y: y1,
                width: x2 - x1,
                height: barH,
                // path of pyramid
                d: [
                    ['M', x1, y1],
                    ['L', x2, y1],
                    ['L', x3, y2],
                    ['L', x4, y2],
                    ['Z']
                ]
            };
        });
    }
}

/* *
 *
 * Prototype properties
 *
 * */
interface ColumnPyramidSeries extends ColumnSeries {
    pointClass: typeof ColumnPyramidPoint;
}

/* *
 *
 * Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        columnpyramid: typeof ColumnPyramidSeries;
    }
}

SeriesRegistry.registerSeriesType('columnpyramid', ColumnPyramidSeries);

/* *
 *
 * Default export
 *
 * */
export default ColumnPyramidSeries;

/* *
 *
 * API Options
 *
 * */

/**
 * A `columnpyramid` series. If the [type](#series.columnpyramid.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.columnpyramid
 * @excluding connectEnds, connectNulls, dashStyle, dataParser, dataURL,
 *            gapSize, gapUnit, linecap, lineWidth, marker, step,
 *            boostThreshold, boostBlending
 * @product   highcharts highstock
 * @requires  highcharts-more
 * @apioption series.columnpyramid
 */

/**
 * @excluding halo, lineWidth, lineWidthPlus, marker
 * @product   highcharts highstock
 * @apioption series.columnpyramid.states.hover
 */

/**
 * @excluding halo, lineWidth, lineWidthPlus, marker
 * @product   highcharts highstock
 * @apioption series.columnpyramid.states.select
 */

/**
 * An array of data points for the series. For the `columnpyramid` series type,
 * points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. The `x` values will be automatically
 *    calculated, either starting at 0 and incremented by 1, or from
 *    `pointStart` and `pointInterval` given in the series options. If the axis
 *    has categories, these will be used. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of arrays with 2 values. In this case, the values correspond to
 *    `x,y`. If the first value is a string, it is applied as the name of the
 *    point, and the `x` value is inferred.
 *    ```js
 *    data: [
 *        [0, 6],
 *        [1, 2],
 *        [2, 6]
 *    ]
 *    ```
 *
 * 3. An array of objects with named values. The objects are point configuration
 *    objects as seen below. If the total number of data points exceeds the
 *    series' [turboThreshold](#series.columnpyramid.turboThreshold), this
 *    option is not available.
 *    ```js
 *    data: [{
 *        x: 1,
 *        y: 9,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        x: 1,
 *        y: 6,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<number|Array<(number|string),(number|null)>|null|*>}
 * @extends   series.line.data
 * @excluding marker
 * @product   highcharts highstock
 * @apioption series.columnpyramid.data
 */

''; // adds doclets above to transpiled file;
