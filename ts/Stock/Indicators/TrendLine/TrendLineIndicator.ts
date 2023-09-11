/* *
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
import type LineSeries from '../../../Series/Line/LineSeries';
import type {
    TrendLineOptions,
    TrendLineParamsOptions
} from './TrendLineOptions';
import type TrendLinePoint from './TrendLinePoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
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
 * The Trend line series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.trendline
 *
 * @augments Highcharts.Series
 */
class TrendLineIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Trendline (linear regression) fits a straight line to the selected data
     * using a method called the Sum Of Least Squares. This series requires the
     * `linkedTo` option to be set.
     *
     * @sample stock/indicators/trendline
     *         Trendline indicator
     *
     * @extends      plotOptions.sma
     * @since        7.1.3
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/trendline
     * @optionparent plotOptions.trendline
     */
    public static defaultOptions: TrendLineOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding period
         */
        params: {
            period: void 0, // unchangeable period, do not inherit (#15362)
            /**
             * The point index which indicator calculations will base. For
             * example using OHLC data, index=2 means the indicator will be
             * calculated using Low values.
             *
             * @default 3
             */
            index: 3
        }
    } as TrendLineOptions);

    /* *
     *
     *   Properties
     *
     * */

    public data: Array<TrendLinePoint> = void 0 as any;
    public options: TrendLineOptions = void 0 as any;
    public points: Array<TrendLinePoint> = void 0 as any;
    public updateAllPoints?: boolean = true;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: TrendLineParamsOptions
    ): IndicatorValuesObject<TLinkedSeries> {
        const xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            LR: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [],
            xValLength: number = xVal.length,
            index: number = (params.index as any);

        let sumX = (xValLength - 1) * xValLength / 2,
            sumY = 0,
            sumXY = 0,
            sumX2 =
                ((xValLength - 1) * (xValLength) * (2 * xValLength - 1)) / 6,
            alpha: number,
            i: number,
            y: number;

        // Get sums:
        for (i = 0; i < xValLength; i++) {
            y = isArray(yVal[i]) ? yVal[i][index] : (yVal[i] as any);
            sumY += y;
            sumXY += i * y;
        }

        // Get slope and offset:
        alpha = (xValLength * sumXY - sumX * sumY) /
            (xValLength * sumX2 - sumX * sumX);

        if (isNaN(alpha)) {
            alpha = 0;
        }

        const beta = (sumY - alpha * sumX) / xValLength;

        // Calculate linear regression:
        for (i = 0; i < xValLength; i++) {
            y = alpha * i + beta;

            // Prepare arrays required for getValues() method
            LR[i] = [xVal[i], y];
            xData[i] = xVal[i];
            yData[i] = y;
        }

        return {
            xData: xData,
            yData: yData,
            values: LR
        } as IndicatorValuesObject<TLinkedSeries>;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface TrendLineIndicator {
    nameBase: string;
    nameComponents: Array<string>;
    pointClass: typeof TrendLinePoint;
}

extend(TrendLineIndicator.prototype, {
    nameBase: 'Trendline',
    nameComponents: (false as any)
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        trendline: typeof TrendLineIndicator;
    }
}

SeriesRegistry.registerSeriesType('trendline', TrendLineIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default TrendLineIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `TrendLine` series. If the [type](#series.trendline.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.trendline
 * @since     7.1.3
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/trendline
 * @apioption series.trendline
 */

''; // to include the above in the js output
