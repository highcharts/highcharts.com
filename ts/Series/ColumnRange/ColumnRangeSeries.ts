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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type ColumnMetricsObject from '../Column/ColumnMetricsObject';
import type ColumnRangeSeriesOptions from './ColumnRangeSeriesOptions';
import type RadialAxis from '../../Core/Axis/RadialAxis';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';

import ColumnRangePoint from './ColumnRangePoint.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        arearange: AreaRangeSeries,
        column: ColumnSeries,
        column: {
            prototype: columnProto
        }
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;
const { addEvent } = EH;
const {
    clamp,
    pick
} = U;

/* *
 *
 *  Constants
 *
 * */

/**
 * The column range is a cartesian series type with higher and lower
 * Y values along an X axis. To display horizontal bars, set
 * [chart.inverted](#chart.inverted) to `true`.
 *
 * @sample {highcharts|highstock} highcharts/demo/columnrange/
 *         Inverted column range
 *
 * @extends      plotOptions.column
 * @since        2.3.0
 * @excluding    negativeColor, stacking, softThreshold, threshold
 * @product      highcharts highstock
 * @requires     highcharts-more
 * @optionparent plotOptions.columnrange
 */
const columnRangeOptions: DeepPartial<ColumnRangeSeriesOptions> = {

    borderRadius: {
        where: 'all'
    },

    /**
     * Extended data labels for range series types. Range series data labels
     * have no `x` and `y` options. Instead, they have `xLow`, `xHigh`,
     * `yLow` and `yHigh` options to allow the higher and lower data label
     * sets individually.
     *
     * @declare   Highcharts.SeriesAreaRangeDataLabelsOptionsObject
     * @extends   plotOptions.arearange.dataLabels
     * @since     2.3.0
     * @product   highcharts highstock
     * @apioption plotOptions.columnrange.dataLabels
     */

    pointRange: null,

    /** @ignore-option */
    marker: null as any,

    states: {
        hover: {
            /** @ignore-option */
            halo: false
        }
    }
};

/* *
 *
 *  Class
 *
 * */

/**
 * The ColumnRangeSeries class
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.columnrange
 *
 * @augments Highcharts.Series
 */

class ColumnRangeSeries extends AreaRangeSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: ColumnRangeSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        AreaRangeSeries.defaultOptions,
        columnRangeOptions as ColumnRangeSeriesOptions
    );

    /* *
     *
     *  Functions
     *
     * */

    public setOptions(): ColumnRangeSeriesOptions {
        // #14359 Prevent side-effect from stacking.
        merge(true, arguments[0], { stacking: void 0 });
        return AreaRangeSeries.prototype.setOptions.apply(this, arguments);
    }


    // Overrides from modules that may be loaded after this module
    // @todo move to compositions

    public translate(): void {
        return columnProto.translate.apply(this);
    }

    // public crispCol(): BBoxObject {
    //     return columnProto.crispCol.apply(this, arguments as any);
    // }
    // public drawPoints(): void {
    //     return columnProto.drawPoints.apply(this, arguments as any);
    // }
    // public drawTracker(): void {
    //     return columnProto.drawTracker.apply(this, arguments as any);
    // }
    // public getColumnMetrics(): ColumnMetricsObject {
    //     return columnProto.getColumnMetrics.apply(this, arguments as any);
    // }
    public pointAttribs(): SVGAttributes {
        return columnProto.pointAttribs.apply(this, arguments as any);
    }
    // public adjustForMissingColumns(): number {
    //     return columnProto.adjustForMissingColumns.apply(this, arguments);
    // }
    // public animate(): void {
    //     return columnProto.animate.apply(this, arguments as any);
    // }
    public translate3dPoints(): void {
        return columnProto.translate3dPoints.apply(this, arguments as any);
    }
    public translate3dShapes(): void {
        return columnProto.translate3dShapes.apply(this, arguments as any);
    }

    public afterColumnTranslate(): void {
        /**
         * Translate data points from raw values x and y to plotX and plotY
         * @private
         */
        const yAxis = this.yAxis,
            xAxis = this.xAxis,
            startAngleRad = (xAxis as RadialAxis.AxisComposition).startAngleRad,
            chart = this.chart,
            isRadial = this.xAxis.isRadial,
            safeDistance = Math.max(chart.chartWidth, chart.chartHeight) + 999;

        let height: number,
            heightDifference: number,
            start: number,
            plotHigh: number,
            y: number;

        // eslint-disable-next-line valid-jsdoc
        /**
         * Don't draw too far outside plot area (#6835)
         * @private
         */
        function safeBounds(pixelPos: number): number {
            return clamp(pixelPos, -safeDistance, safeDistance);
        }

        // Set plotLow and plotHigh
        this.points.forEach((point): void => {
            const shapeArgs = point.shapeArgs || {},
                minPointLength = this.options.minPointLength,
                plotY = point.plotY,
                plotHigh = yAxis.translate(
                    point.high, 0 as any, 1 as any, 0 as any, 1 as any
                );

            if (isNumber(plotHigh) && isNumber(plotY)) {
                point.plotHigh = safeBounds(plotHigh);
                point.plotLow = safeBounds(plotY);

                // adjust shape
                y = point.plotHigh;
                height = pick(
                    (point as any).rectPlotY,
                    point.plotY
                ) - point.plotHigh;

                // Adjust for minPointLength
                if (Math.abs(height) < (minPointLength as any)) {
                    heightDifference = ((minPointLength as any) - height);
                    height += heightDifference;
                    y -= heightDifference / 2;

                // Adjust for negative ranges or reversed Y axis (#1457)
                } else if (height < 0) {
                    height *= -1;
                    y -= height;
                }

                if (isRadial && this.polar) {

                    start = point.barX + startAngleRad;
                    point.shapeType = 'arc';
                    point.shapeArgs = this.polar.arc(
                        y + height,
                        y,
                        start,
                        start + point.pointWidth
                    );
                } else {

                    shapeArgs.height = height;
                    shapeArgs.y = y;
                    const { x = 0, width = 0 } = shapeArgs;
                    // #17912, aligning column range points
                    // merge if shapeArgs contains more properties e.g. for 3d
                    point.shapeArgs = merge(point.shapeArgs,
                        this.crispCol(x, y, width, height));

                    point.tooltipPos = chart.inverted ?
                        [
                            yAxis.len + yAxis.pos - chart.plotLeft - y -
                                height / 2,
                            xAxis.len + xAxis.pos - chart.plotTop - x -
                                width / 2,
                            height
                        ] : [
                            xAxis.left - chart.plotLeft + x + width / 2,
                            yAxis.pos - chart.plotTop + y + height / 2,
                            height
                        ]; // don't inherit from column tooltip position - #3372
                }
            }
        });
    }
}

addEvent(ColumnRangeSeries, 'afterColumnTranslate', function (): void {
    ColumnRangeSeries.prototype.afterColumnTranslate.apply(this);
}, { order: 5 });

/* *
 *
 *  Class Prototype
 *
 * */

interface ColumnRangeSeries {
    options: ColumnRangeSeriesOptions;
    pointClass: typeof ColumnRangePoint;
    points: Array<ColumnRangePoint>;
    adjustForMissingColumns: typeof columnProto.adjustForMissingColumns;
    animate: typeof columnProto.animate,
    crispCol: typeof columnProto.crispCol;
    drawPoints: typeof columnProto.drawPoints,
    getColumnMetrics: typeof columnProto.getColumnMetrics;
    // pointAttribs: typeof columnProto.pointAttribs,
    // polarArc: typeof columnProto.polarArc
    // translate3dPoints: typeof columnProto.translate3dPoints,
    // translate3dShapes: typeof columnProto.translate3dShapes
}
extend(ColumnRangeSeries.prototype, {
    directTouch: true,
    pointClass: ColumnRangePoint,
    trackerGroups: ['group', 'dataLabelsGroup'],
    adjustForMissingColumns: columnProto.adjustForMissingColumns,
    animate: columnProto.animate,
    crispCol: columnProto.crispCol,
    drawGraph: noop,
    drawPoints: columnProto.drawPoints,
    getSymbol: noop,
    drawTracker: columnProto.drawTracker,
    getColumnMetrics: columnProto.getColumnMetrics
    // pointAttribs: columnProto.pointAttribs,
    // polarArc: columnProto.polarArc
    // translate3dPoints: columnProto.translate3dPoints,
    // translate3dShapes: columnProto.translate3dShapes
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
        columnrange: typeof ColumnRangeSeries;
    }
}

SeriesRegistry.registerSeriesType('columnrange', ColumnRangeSeries);

/* *
 *
 *  Default Export
 *
 * */

export default ColumnRangeSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `columnrange` series. If the [type](#series.columnrange.type)
 * option is not specified, it is inherited from
 * [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.columnrange
 * @excluding dataParser, dataURL, stack, stacking
 * @product   highcharts highstock
 * @requires  highcharts-more
 * @apioption series.columnrange
 */

/**
 * An array of data points for the series. For the `columnrange` series
 * type, points can be given in the following ways:
 *
 * 1. An array of arrays with 3 or 2 values. In this case, the values correspond
 *    to `x,low,high`. If the first value is a string, it is applied as the name
 *    of the point, and the `x` value is inferred. The `x` value can also be
 *    omitted, in which case the inner arrays should be of length 2\. Then the
 *    `x` value is automatically calculated, either starting at 0 and
 *    incremented by 1, or from `pointStart` and `pointInterval` given in the
 *    series options.
 *    ```js
 *    data: [
 *        [0, 4, 2],
 *        [1, 2, 1],
 *        [2, 9, 10]
 *    ]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.columnrange.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        x: 1,
 *        low: 0,
 *        high: 4,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        x: 1,
 *        low: 5,
 *        high: 3,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
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
 * @extends   series.arearange.data
 * @excluding marker
 * @product   highcharts highstock
 * @apioption series.columnrange.data
 */

/**
 * @extends   series.columnrange.dataLabels
 * @product   highcharts highstock
 * @apioption series.columnrange.data.dataLabels
 */

/**
 * @excluding halo, lineWidth, lineWidthPlus, marker
 * @product   highcharts highstock
 * @apioption series.columnrange.states.hover
 */

/**
 * @excluding halo, lineWidth, lineWidthPlus, marker
 * @product   highcharts highstock
 * @apioption series.columnrange.states.select
 */

''; // adds doclets above into transpiled
