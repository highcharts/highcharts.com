/* *
 *
 *  Highcharts variwide module
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

import type StackingAxis from '../../Core/Axis/Stacking/StackingAxis';
import type VariwideSeriesOptions from './VariwideSeriesOptions';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;
import VariwideComposition from './VariwideComposition.js';
import VariwidePoint from './VariwidePoint.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;
const { addEvent } = EH;
const {
    pick
} = U;


/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.variwide
 *
 * @augments Highcharts.Series
 */

class VariwideSeries extends ColumnSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static compose = VariwideComposition.compose;

    /**
     * A variwide chart (related to marimekko chart) is a column chart with a
     * variable width expressing a third dimension.
     *
     * @sample {highcharts} highcharts/demo/variwide/
     *         Variwide chart
     * @sample {highcharts} highcharts/series-variwide/inverted/
     *         Inverted variwide chart
     * @sample {highcharts} highcharts/series-variwide/datetime/
     *         Variwide columns on a datetime axis
     *
     * @extends      plotOptions.column
     * @since        6.0.0
     * @product      highcharts
     * @excluding    boostThreshold, crisp, depth, edgeColor, edgeWidth,
     *               groupZPadding, boostBlending
     * @requires     modules/variwide
     * @optionparent plotOptions.variwide
     */
    public static defaultOptions: VariwideSeriesOptions = merge(ColumnSeries.defaultOptions, {
        /**
         * In a variwide chart, the point padding is 0 in order to express the
         * horizontal stacking of items.
         */
        pointPadding: 0,
        /**
         * In a variwide chart, the group padding is 0 in order to express the
         * horizontal stacking of items.
         */
        groupPadding: 0
    });

    /* *
     *
     *  Properties
     *
     * */

    public crispOption?: boolean;
    public data: Array<VariwidePoint> = void 0 as any;
    public options: VariwideSeriesOptions = void 0 as any;
    public points: Array<VariwidePoint> = void 0 as any;
    public relZ: Array<number> = void 0 as any;
    public totalZ: number = void 0 as any;
    public zData?: Array<number> = void 0 as any;

    /* *
     *
     * Functions
     *
     * */

    public processData(force?: boolean): undefined {
        this.totalZ = 0;
        this.relZ = [];
        SeriesRegistry.seriesTypes.column.prototype.processData.call(
            this,
            force
        );

        (this.xAxis.reversed ?
            (this.zData as any).slice().reverse() :
            (this.zData as any)
        ).forEach(
            function (
                this: VariwideSeries,
                z: number,
                i: number
            ): void {
                this.relZ[i] = this.totalZ;
                this.totalZ += z;
            },
            this
        );

        if (this.xAxis.categories) {
            this.xAxis.variwide = true;
            this.xAxis.zData = this.zData; // Used for label rank
        }
        return;
    }

    /**
     * Translate an x value inside a given category index into the distorted
     * axis translation.
     *
     * @private
     * @function Highcharts.Series#postTranslate
     *
     * @param {number} index
     *        The category index
     *
     * @param {number} x
     *        The X pixel position in undistorted axis pixels
     *
     * @param {Highcharts.Point} point
     *        For crosshairWidth for every point
     *
     * @return {number}
     *         Distorted X position
     */
    public postTranslate(
        index: number,
        x: number,
        point?: VariwidePoint
    ): number {

        const axis = this.xAxis,
            relZ = this.relZ,
            i = axis.reversed ? relZ.length - index : index,
            goRight = axis.reversed ? -1 : 1,
            minPx = axis.toPixels(axis.reversed ?
                (axis.dataMax || 0) + axis.pointRange :
                (axis.dataMin || 0)),
            maxPx = axis.toPixels(axis.reversed ?
                (axis.dataMin || 0) :
                (axis.dataMax || 0) + axis.pointRange),
            len = Math.abs(maxPx - minPx),
            totalZ = this.totalZ,
            left = this.chart.inverted ?
                maxPx - (this.chart.plotTop - goRight * axis.minPixelPadding) :
                minPx - this.chart.plotLeft - goRight * axis.minPixelPadding,
            linearSlotLeft = i / relZ.length * len,
            linearSlotRight = (i + goRight) / relZ.length * len,
            slotLeft = (pick(relZ[i], totalZ) / totalZ) * len,
            slotRight = (pick(relZ[i + goRight], totalZ) / totalZ) * len,
            xInsideLinearSlot = (x - (left + linearSlotLeft));

        // Set crosshairWidth for every point (#8173)
        if (point) {
            point.crosshairWidth = slotRight - slotLeft;
        }

        return left + slotLeft +
            xInsideLinearSlot * (slotRight - slotLeft) /
            (linearSlotRight - linearSlotLeft);
    }

    /* eslint-enable valid-jsdoc */

    public translate(): void {
        // Temporarily disable crisping when computing original shapeArgs
        this.crispOption = this.options.crisp;
        this.options.crisp = false;

        super.translate();

        // Reset option
        this.options.crisp = this.crispOption;
    }

    /**
     * Function that corrects stack labels positions
     * @private
     */
    public correctStackLabels(): void {
        const series = this,
            options = series.options,
            yAxis = series.yAxis as StackingAxis;

        let pointStack,
            pointWidth,
            stack,
            xValue;

        for (const point of series.points) {
            xValue = point.x;
            pointWidth = (point.shapeArgs as any).width;
            stack = yAxis.stacking.stacks[(
                series.negStacks &&
                (point.y as any) < (
                    options.startFromThreshold ?
                        0 :
                        (options.threshold as any)
                ) ?
                    '-' :
                    ''
            ) + series.stackKey];

            if (stack) {
                pointStack = stack[xValue as any];
                if (pointStack && !point.isNull) {
                    pointStack.setOffset(
                        -(pointWidth / 2) || 0,
                        pointWidth || 0,
                        void 0,
                        void 0,
                        point.plotX,
                        series.xAxis
                    );
                }
            }
        }
    }
}

// Extend translation by distoring X position based on Z.
addEvent(VariwideSeries, 'afterColumnTranslate', function (): void {

    // Temporarily disable crisping when computing original shapeArgs
    const xAxis = this.xAxis,
        inverted = this.chart.inverted,
        crisp = this.borderWidth % 2 / 2;

    // Distort the points to reflect z dimension
    this.points.forEach((
        point: VariwidePoint,
        i: number
    ): void => {
        const shapeArgs = point.shapeArgs || {},
            { x = 0, width = 0 } = shapeArgs,
            { plotX = 0, tooltipPos, z = 0 } = point;
        let left: number, right: number;

        if (xAxis.variwide) {
            left = this.postTranslate(i, x, point);
            right = this.postTranslate(i, x + width);

        // For linear or datetime axes, the variwide column should start with X
        // and extend Z units, without modifying the axis.
        } else {
            left = plotX;
            right = xAxis.translate(point.x + z, false, false, false, true);
        }

        if (this.crispOption) {
            left = Math.round(left) - crisp;
            right = Math.round(right) - crisp;
        }

        shapeArgs.x = left;
        shapeArgs.width = Math.max(right - left, 1);

        // Crosshair position (#8083)
        point.plotX = (left + right) / 2;

        // Adjust the tooltip position
        if (tooltipPos) {
            if (!inverted) {
                tooltipPos[0] = shapeArgs.x + shapeArgs.width / 2;
            } else {
                tooltipPos[1] = xAxis.len - shapeArgs.x - shapeArgs.width / 2;
            }
        }
    });

    if (this.options.stacking) {
        this.correctStackLabels();
    }
}, { order: 2 });

/* *
 *
 *  Class Prototype
 *
 * */

interface VariwideSeries {
    irregularWidths: boolean;
    parallelArrays: Array<string>;
    pointArrayMap: Array<string>;
    pointClass: typeof VariwidePoint;
}
extend(VariwideSeries.prototype, {
    irregularWidths: true,
    pointArrayMap: ['y', 'z'],
    parallelArrays: ['x', 'y', 'z'],
    pointClass: VariwidePoint
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        variwide: typeof VariwideSeries;
    }
}

SeriesRegistry.registerSeriesType('variwide', VariwideSeries);

/* *
 *
 *  Default Export
 *
 * */

export default VariwideSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `variwide` series. If the [type](#series.variwide.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.variwide
 * @excluding boostThreshold, boostBlending
 * @product   highcharts
 * @requires  modules/variwide
 * @apioption series.variwide
 */

/**
 * An array of data points for the series. For the `variwide` series type,
 * points can be given in the following ways:
 *
 * 1. An array of arrays with 3 or 2 values. In this case, the values correspond
 *    to `x,y,z`. If the first value is a string, it is applied as the name of
 *    the point, and the `x` value is inferred. The `x` value can also be
 *    omitted, in which case the inner arrays should be of length 2. Then the
 *    `x` value is automatically calculated, either starting at 0 and
 *    incremented by 1, or from `pointStart` and `pointInterval` given in the
 *    series options.
 *    ```js
 *       data: [
 *           [0, 1, 2],
 *           [1, 5, 5],
 *           [2, 0, 2]
 *       ]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.variwide.turboThreshold), this option is not
 *    available.
 *    ```js
 *       data: [{
 *           x: 1,
 *           y: 1,
 *           z: 1,
 *           name: "Point2",
 *           color: "#00FF00"
 *       }, {
 *           x: 1,
 *           y: 5,
 *           z: 4,
 *           name: "Point1",
 *           color: "#FF00FF"
 *       }]
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
 * @extends   series.line.data
 * @excluding marker
 * @product   highcharts
 * @apioption series.variwide.data
 */

/**
 * The relative width for each column. On a category axis, the widths are
 * distributed so they sum up to the X axis length. On linear and datetime axes,
 * the columns will be laid out from the X value and Z units along the axis.
 *
 * @type      {number}
 * @product   highcharts
 * @apioption series.variwide.data.z
 */

''; // adds doclets above to transpiled file
