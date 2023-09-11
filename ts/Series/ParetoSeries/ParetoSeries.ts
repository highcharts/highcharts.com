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

import type ParetoPoint from './ParetoPoint';
import type ParetoSeriesOptions from './ParetoSeriesOptions';

import DerivedComposition from '../DerivedComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        line: LineSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The pareto series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.pareto
 *
 * @augments Highcharts.Series
 */

class ParetoSeries extends LineSeries {

    /* *
     *
     *  Static properties
     *
     * */

    /**
     * A pareto diagram is a type of chart that contains both bars and a line
     * graph, where individual values are represented in descending order by
     * bars, and the cumulative total is represented by the line.
     *
     * @sample {highcharts} highcharts/demo/pareto/
     *         Pareto diagram
     *
     * @extends      plotOptions.line
     * @since        6.0.0
     * @product      highcharts
     * @excluding    allAreas, boostThreshold, borderColor, borderRadius,
     *               borderWidth, crisp, colorAxis, depth, data, dragDrop,
     *               edgeColor, edgeWidth, findNearestPointBy, gapSize, gapUnit,
     *               grouping, groupPadding, groupZPadding, maxPointWidth, keys,
     *               negativeColor, pointInterval, pointIntervalUnit,
     *               pointPadding, pointPlacement, pointRange, pointStart,
     *               pointWidth, shadow, step, softThreshold, stacking,
     *               threshold, zoneAxis, zones, boostBlending
     * @requires     modules/pareto
     * @optionparent plotOptions.pareto
     */
    public static defaultOptions: ParetoSeriesOptions = merge(
        LineSeries.defaultOptions,
        {
            /**
             * Higher zIndex than column series to draw line above shapes.
             */
            zIndex: 3
        } as ParetoSeriesOptions
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<ParetoPoint> = void 0 as any;
    public points: Array<ParetoPoint> = void 0 as any;
    public options: ParetoSeriesOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Calculate y sum and each percent point.
     *
     * @private
     * @function Highcharts.Series#sumPointsPercents
     *
     * @param {Array<number>} yValues
     * Y values
     *
     * @param {Array<number>} xValues
     * X values
     *
     * @param {number} sum
     * Sum of all y values
     *
     * @param {boolean} [isSum]
     * Declares if calculate sum of all points
     *
     * @return {number|Array<number,number>}
     * Returns sum of points or array of points [x,sum]
     *
     * @requires modules/pareto
     */
    public sumPointsPercents<T extends(boolean | undefined)>(
        yValues: Array<number>,
        xValues: Array<number>,
        sum: number,
        isSum?: T
    ): (T extends true ? number : Array<Array<number>>) {
        let sumY = 0,
            sumPercent = 0,
            percentPoints: Array<Array<number>> = [],
            percentPoint: (number | undefined);

        yValues.forEach(function (point: number, i: number): void {
            if (point !== null) {
                if (isSum) {
                    sumY += point;
                } else {
                    percentPoint = (point / sum) * 100;
                    percentPoints.push([
                        xValues[i],
                        correctFloat(sumPercent + percentPoint)
                    ]);
                    sumPercent += percentPoint;
                }
            }
        });

        return (isSum ? sumY : percentPoints) as (
            T extends true ? number : Array<Array<number>>
        );
    }

    /**
     * Calculate sum and return percent points.
     *
     * @private
     * @function Highcharts.Series#setDerivedData
     * @requires modules/pareto
     */
    public setDerivedData(): void {
        const xValues = (this.baseSeries as any).xData,
            yValues = (this.baseSeries as any).yData,
            sum = this.sumPointsPercents(
                yValues,
                xValues,
                null as any,
                true
            );

        this.setData(
            this.sumPointsPercents(yValues, xValues, sum, false),
            false
        );
    }
}

/* *
 *
 *  Prototype properties
 *
 * */

interface ParetoSeries extends DerivedComposition.SeriesComposition {
    pointClass: typeof ParetoPoint;
}

extend(ParetoSeries.prototype, {
    hasDerivedData: DerivedComposition.hasDerivedData
});

DerivedComposition.compose(ParetoSeries);


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
        pareto: typeof ParetoSeries;
    }
}
SeriesRegistry.registerSeriesType('pareto', ParetoSeries);

/* *
 *
 *  Default export
 *
 * */

export default ParetoSeries;


/* *
 *
 *  API options
 *
 * */

/**
 * A `pareto` series. If the [type](#series.pareto.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.pareto
 * @since     6.0.0
 * @product   highcharts
 * @excluding data, dataParser, dataURL, boostThreshold, boostBlending
 * @requires  modules/pareto
 * @apioption series.pareto
 */

/**
 * An integer identifying the index to use for the base series, or a string
 * representing the id of the series.
 *
 * @type      {number|string}
 * @default   undefined
 * @apioption series.pareto.baseSeries
 */

/**
 * An array of data points for the series. For the `pareto` series type,
 * points are calculated dynamically.
 *
 * @type      {Array<Array<number|string>|*>}
 * @extends   series.column.data
 * @since     6.0.0
 * @product   highcharts
 * @apioption series.pareto.data
 */

''; // adds the doclets above to the transpiled file
