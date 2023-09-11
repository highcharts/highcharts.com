/* *
 *
 *  (c) 2010-2021 Highsoft AS
 *
 *  Author: Sebastian Domas
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

import type BellcurvePoint from './BellcurvePoint';
import type BellcurveSeriesOptions from './BellcurveSeriesOptions';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';

import DerivedComposition from '../DerivedComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        areaspline: AreaSplineSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { merge } = OH;
const {
    correctFloat
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
    }
}

/**
 * Bell curve class
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.bellcurve
 *
 * @augments Highcharts.Series
 */
class BellcurveSeries extends AreaSplineSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A bell curve is an areaspline series which represents the probability
     * density function of the normal distribution. It calculates mean and
     * standard deviation of the base series data and plots the curve according
     * to the calculated parameters.
     *
     * @sample {highcharts} highcharts/demo/bellcurve/
     *         Bell curve
     *
     * @extends      plotOptions.areaspline
     * @since        6.0.0
     * @product      highcharts
     * @excluding    boostThreshold, connectNulls, dragDrop, stacking,
     *               pointInterval, pointIntervalUnit
     * @requires     modules/bellcurve
     * @optionparent plotOptions.bellcurve
     */
    public static defaultOptions: BellcurveSeriesOptions = merge(AreaSplineSeries.defaultOptions, {
        /**
         * @see [fillColor](#plotOptions.bellcurve.fillColor)
         * @see [fillOpacity](#plotOptions.bellcurve.fillOpacity)
         *
         * @apioption plotOptions.bellcurve.color
         */

        /**
         * @see [color](#plotOptions.bellcurve.color)
         * @see [fillOpacity](#plotOptions.bellcurve.fillOpacity)
         *
         * @apioption plotOptions.bellcurve.fillColor
         */

        /**
         * @see [color](#plotOptions.bellcurve.color)
         * @see [fillColor](#plotOptions.bellcurve.fillColor)
         *
         * @default   {highcharts} 0.75
         * @default   {highstock} 0.75
         * @apioption plotOptions.bellcurve.fillOpacity
         */

        /**
         * This option allows to define the length of the bell curve. A unit of
         * the length of the bell curve is standard deviation.
         *
         * @sample highcharts/plotoptions/bellcurve-intervals-pointsininterval
         *         Intervals and points in interval
         */
        intervals: 3,

        /**
         * Defines how many points should be plotted within 1 interval. See
         * `plotOptions.bellcurve.intervals`.
         *
         * @sample highcharts/plotoptions/bellcurve-intervals-pointsininterval
         *         Intervals and points in interval
         */
        pointsInInterval: 3,

        marker: {
            enabled: false
        }

    } as BellcurveSeriesOptions);

    /* *
     *
     *  Static Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    private static mean(data: Array<number>): (number|false) {
        const length = data.length,
            sum = data.reduce(function (sum: number, value: number): number {
                return (sum += value);
            }, 0);

        return length > 0 && sum / length;
    }

    /**
     * @private
     */
    private static standardDeviation(
        data: Array<number>,
        average?: number
    ): (number|false) {
        let len = data.length,
            sum;

        average = isNumber(average) ?
            average : (BellcurveSeries.mean(data) as any);

        sum = data.reduce(function (sum: number, value: number): number {
            const diff = value - (average as any);

            return (sum += diff * diff);
        }, 0);

        return len > 1 && Math.sqrt(sum / (len - 1));
    }

    /**
     * @private
     */
    private static normalDensity(
        x: number,
        mean: number,
        standardDeviation: number
    ): number {
        const translation = x - mean;

        return Math.exp(
            -(translation * translation) /
            (2 * standardDeviation * standardDeviation)
        ) / (standardDeviation * Math.sqrt(2 * Math.PI));
    }

    /* eslint-enable valid-jsdoc */

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<BellcurvePoint> = void 0 as any;

    public mean?: number;

    public options: BellcurveSeriesOptions = void 0 as any;

    public points: Array<BellcurvePoint> = void 0 as any;

    public standardDeviation?: number;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public derivedData(
        mean: number,
        standardDeviation: number
    ): Array<Array<number>> {
        let intervals = this.options.intervals,
            pointsInInterval = this.options.pointsInInterval,
            x = mean - (intervals as any) * standardDeviation,
            stop = (intervals as any) * (pointsInInterval as any) * 2 + 1,
            increment = standardDeviation / (pointsInInterval as any),
            data: Array<Array<number>> = [],
            i: number;

        for (i = 0; i < stop; i++) {
            data.push(
                [x, BellcurveSeries.normalDensity(x, mean, standardDeviation)]
            );
            x += increment;
        }

        return data;
    }

    public setDerivedData(): Array<(PointOptions|PointShortOptions)> {
        if ((this.baseSeries as any).yData.length > 1) {
            this.setMean();
            this.setStandardDeviation();
            this.setData(
                this.derivedData(
                    this.mean as any,
                    this.standardDeviation as any
                ),
                false
            );
        }
        return (void 0) as any;
    }

    public setMean(): void {
        this.mean = correctFloat(
            BellcurveSeries.mean(
                (this.baseSeries as any).yData
            ) as any
        );
    }

    public setStandardDeviation(): void {
        this.standardDeviation = correctFloat(
            BellcurveSeries.standardDeviation(
                (this.baseSeries as any).yData,
                this.mean as any
            ) as any
        );
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface BellcurveSeries extends DerivedComposition.SeriesComposition {
    pointClass: typeof BellcurvePoint;
}

DerivedComposition.compose(BellcurveSeries);

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        bellcurve: typeof BellcurveSeries;
    }
}
SeriesRegistry.registerSeriesType('bellcurve', BellcurveSeries);

/* *
 *
 *  Default Export
 *
 * */

export default BellcurveSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `bellcurve` series. If the [type](#series.bellcurve.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * For options that apply to multiple series, it is recommended to add
 * them to the [plotOptions.series](#plotOptions.series) options structure.
 * To apply to all series of this specific type, apply it to
 * [plotOptions.bellcurve](#plotOptions.bellcurve).
 *
 * @extends   series,plotOptions.bellcurve
 * @since     6.0.0
 * @product   highcharts
 * @excluding dataParser, dataURL, data, boostThreshold, boostBlending
 * @requires  modules/bellcurve
 * @apioption series.bellcurve
 */

/**
 * An integer identifying the index to use for the base series, or a string
 * representing the id of the series.
 *
 * @type      {number|string}
 * @apioption series.bellcurve.baseSeries
 */

/**
 * @see [fillColor](#series.bellcurve.fillColor)
 * @see [fillOpacity](#series.bellcurve.fillOpacity)
 *
 * @apioption series.bellcurve.color
 */

/**
 * @see [color](#series.bellcurve.color)
 * @see [fillOpacity](#series.bellcurve.fillOpacity)
 *
 * @apioption series.bellcurve.fillColor
 */

/**
 * @see [color](#series.bellcurve.color)
 * @see [fillColor](#series.bellcurve.fillColor)
 *
 * @default   {highcharts} 0.75
 * @default   {highstock} 0.75
 * @apioption series.bellcurve.fillOpacity
 */

''; // adds doclets above to transpiled file
