/**
 *
 *  (c) 2010-2021 Kamil Kulig
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

import type IndicatorValuesObject from '../IndicatorValuesObject';
import type {
    LinearRegressionOptions,
    LinearRegressionParamsOptions,
    RegressionLineParametersObject
} from './LinearRegressionOptions';
import type LinearRegressionPoint from './LinearRegressionPoint';
import type LineSeries from '../../../Series/Line/LineSeries';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * Linear regression series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.linearregression
 *
 * @augments Highcharts.Series
 */
class LinearRegressionIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Linear regression indicator. This series requires `linkedTo` option to be
     * set.
     *
     * @sample {highstock} stock/indicators/linear-regression
     *         Linear regression indicator
     *
     * @extends      plotOptions.sma
     * @since        7.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/regressions
     * @optionparent plotOptions.linearregression
     */
    public static defaultOptions: LinearRegressionOptions = merge(
        SMAIndicator.defaultOptions,
        {
            params: {
                /**
                 * Unit (in milliseconds) for the x axis distances used to
                 * compute the regression line paramters (slope & intercept) for
                 * every range. In Highcharts Stock the x axis values are always
                 * represented in milliseconds which may cause that distances
                 * between points are "big" integer numbers.
                 *
                 * Highcharts Stock's linear regression algorithm (least squares
                 * method) will utilize these "big" integers for finding the
                 * slope and the intercept of the regression line for each
                 * period. In consequence, this value may be a very "small"
                 * decimal number that's hard to interpret by a human.
                 *
                 * For instance: `xAxisUnit` equealed to `86400000` ms (1 day)
                 * forces the algorithm to treat `86400000` as `1` while
                 * computing the slope and the intercept. This may enchance the
                 * legiblitity of the indicator's values.
                 *
                 * Default value is the closest distance between two data
                 * points.
                 *
                 * In `v9.0.2`, the default value has been changed
                 * from `undefined` to `null`.
                 *
                 * @sample {highstock} stock/plotoptions/linear-regression-xaxisunit
                 *         xAxisUnit set to 1 minute
                 *
                 * @example
                 * // In Liniear Regression Slope Indicator series `xAxisUnit`is
                 * // `86400000` (1 day) and period is `3`. There're 3 points in
                 * // the base series:
                 *
                 * data: [
                 *   [Date.UTC(2020, 0, 1), 1],
                 *   [Date.UTC(2020, 0, 2), 3],
                 *   [Date.UTC(2020, 0, 3), 5]
                 * ]
                 *
                 * // This will produce one point in the indicator series that
                 * // has a `y` value of `2` (slope of the regression line). If
                 * // we change the `xAxisUnit` to `1` (ms) the value of the
                 * // indicator's point will be `2.3148148148148148e-8` which is
                 * // harder to interpert for a human.
                 *
                 * @type    {null|number}
                 * @product highstock
                 */
                xAxisUnit: null
            },
            tooltip: {
                valueDecimals: 4
            }
        } as LinearRegressionOptions
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<LinearRegressionPoint> = void 0 as any;
    public options: LinearRegressionOptions = void 0 as any;
    public points: Array<LinearRegressionPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Return the slope and intercept of a straight line function.
     *
     * @private
     *
     * @param {Array<number>} xData
     * List of all x coordinates in a period.
     *
     * @param {Array<number>} yData
     * List of all y coordinates in a period.
     *
     * @return {Highcharts.RegressionLineParametersObject}
     * Object that contains the slope and the intercept of a straight line
     * function.
     */
    public getRegressionLineParameters(
        xData: Array<number>,
        yData: Array<number>
    ): RegressionLineParametersObject {
        // least squares method
        const yIndex: number = (this.options.params as any).index,
            getSingleYValue = function (
                yValue: (number|Array<number>),
                yIndex: number
            ): number {
                return isArray(yValue) ? yValue[yIndex] : yValue;
            },
            xSum = xData.reduce(
                function (
                    accX: number,
                    val: number
                ): number {
                    return val + accX;
                }, 0),
            ySum = yData.reduce(
                function (accY: number, val: number): number {
                    return getSingleYValue(val, yIndex) + accY;
                }, 0),
            xMean: number = xSum / xData.length,
            yMean: number = ySum / yData.length;

        let xError: number,
            yError: number,
            i: number,
            formulaNumerator = 0,
            formulaDenominator = 0;

        for (i = 0; i < xData.length; i++) {
            xError = xData[i] - xMean;
            yError = getSingleYValue(yData[i], yIndex) - yMean;
            formulaNumerator += xError * yError;
            formulaDenominator += Math.pow(xError, 2);
        }

        const slope: number = formulaDenominator ?
            formulaNumerator / formulaDenominator : 0; // don't divide by 0

        return {
            slope: slope,
            intercept: yMean - slope * xMean
        };
    }


    /**
     * Return the y value on a straight line.
     *
     * @private
     *
     * @param {Highcharts.RegressionLineParametersObject} lineParameters
     * Object that contains the slope and the intercept of a straight line
     * function.
     *
     * @param {number} endPointX
     * X coordinate of the point.
     *
     * @return {number}
     * Y value of the point that lies on the line.
     */
    public getEndPointY(
        lineParameters: RegressionLineParametersObject,
        endPointX: number
    ): number {
        return lineParameters.slope * endPointX + lineParameters.intercept;
    }

    /**
     * Transform the coordinate system so that x values start at 0 and
     * apply xAxisUnit.
     *
     * @private
     *
     * @param {Array<number>} xData
     * List of all x coordinates in a period
     *
     * @param {number} xAxisUnit
     * Option (see the API)
     *
     * @return {Array<number>}
     * Array of transformed x data
     */
    public transformXData(
        xData: Array<number>,
        xAxisUnit: number
    ): Array<number> {
        const xOffset: number = xData[0];

        return xData.map(function (xValue: number): number {
            return (xValue - xOffset) / xAxisUnit;
        });
    }

    /**
     * Find the closest distance between points in the base series.
     * @private
     * @param {Array<number>} xData list of all x coordinates in the base series
     * @return {number} - closest distance between points in the base series
     */
    public findClosestDistance(
        xData: Array<number>
    ): (number|undefined) {
        let distance: number,
            closestDistance: (number|undefined),
            i: number;

        for (i = 1; i < xData.length - 1; i++) {
            distance = xData[i] - xData[i - 1];
            if (
                distance > 0 &&
                (
                    typeof closestDistance === 'undefined' ||
                    distance < closestDistance
                )
            ) {
                closestDistance = distance;
            }
        }

        return closestDistance;
    }

    // Required to be implemented - starting point for indicator's logic
    public getValues<TLinkedSeries extends LineSeries>(
        this: LinearRegressionIndicator,
        baseSeries: TLinkedSeries,
        regressionSeriesParams:
        LinearRegressionParamsOptions
    ): IndicatorValuesObject<TLinkedSeries> {
        const xData: Array<number> = (baseSeries.xData as any),
            yData: Array<number> = (baseSeries.yData as any),
            period: number = (regressionSeriesParams.period as any),
            // format required to be returned
            indicatorData: IndicatorValuesObject<
            TLinkedSeries
            > = {
                xData: [], // by getValues() method
                yData: [],
                values: []
            } as any,
            xAxisUnit: number = (this.options.params as any).xAxisUnit ||
            this.findClosestDistance(xData);

        let lineParameters: RegressionLineParametersObject,
            i: number,
            periodStart: number,
            periodEnd: number,
            endPointX: number,
            endPointY: number,
            periodXData: Array<number>,
            periodYData: Array<number>,
            periodTransformedXData: Array<number>;

        // Iteration logic: x value of the last point within the period
        // (end point) is used to represent the y value (regression)
        // of the entire period.

        for (i = period - 1; i <= xData.length - 1; i++) {
            periodStart = i - period + 1; // adjusted for slice() function
            periodEnd = i + 1; // (as above)
            endPointX = xData[i];
            periodXData = xData.slice(periodStart, periodEnd);
            periodYData = yData.slice(periodStart, periodEnd);
            periodTransformedXData = this.transformXData(periodXData,
                xAxisUnit);

            lineParameters = this.getRegressionLineParameters(
                periodTransformedXData, periodYData
            );

            endPointY = this.getEndPointY(lineParameters,
                periodTransformedXData[periodTransformedXData.length - 1]);

            // @todo this is probably not used anywhere
            indicatorData.values.push({
                regressionLineParameters: lineParameters,
                x: endPointX,
                y: endPointY
            } as any);

            indicatorData.xData.push(endPointX);
            indicatorData.yData.push(endPointY as any);
        }

        return indicatorData;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface LinearRegressionIndicator {
    pointClass: typeof LinearRegressionPoint;
    nameBase: string;
}

extend(LinearRegressionIndicator.prototype, {
    nameBase: 'Linear Regression Indicator'
});


/* *
 *
 * Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        linearRegression: typeof LinearRegressionIndicator;
    }
}

SeriesRegistry.registerSeriesType(
    'linearRegression',
    LinearRegressionIndicator
);

/* *
 *
 *  Default Export
 *
 * */

export default LinearRegressionIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A linear regression series. If the
 * [type](#series.linearregression.type) option is not specified, it is
 * inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.linearregression
 * @since     7.0.0
 * @product   highstock
 * @excluding dataParser,dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/regressions
 * @apioption series.linearregression
 */

''; // to include the above in the js output
