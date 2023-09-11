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
    RSIOptions,
    RSIParamsOptions
} from './RSIOptions';
import type RSIPoint from './RSIPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { merge } = OH;

/* *
 *
 *  Functions
 *
 * */

// Utils:
function toFixed(a: number, n: number): number {
    return parseFloat(a.toFixed(n));
}

/* *
 *
 *  Class
 *
 * */

/**
 * The RSI series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.rsi
 *
 * @augments Highcharts.Series
 */
class RSIIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Relative strength index (RSI) technical indicator. This series
     * requires the `linkedTo` option to be set and should be loaded after
     * the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/rsi
     *         RSI indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/rsi
     * @optionparent plotOptions.rsi
     */
    public static defaultOptions: RSIOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            decimals: 4,
            index: 3
        }
    } as RSIOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<RSIPoint> = void 0 as any;
    public points: Array<RSIPoint> = void 0 as any;
    public options: RSIOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: RSIParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<number> | Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            decimals: number = (params.decimals as any),
            // RSI starts calculations from the second point
            // Cause we need to calculate change between two points
            RSI: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let gain: number = 0,
            loss: number = 0,
            index = (params.index as number),
            range: number = 1,
            RSIPoint: number,
            change: number,
            avgGain: number,
            avgLoss: number,
            i: number,
            values: Array<number>;

        if ((xVal.length < period)) {
            return;
        }

        if (isNumber(yVal[0])) {
            values = yVal as Array<number>;
        } else {
            // in case of the situation, where the series type has data length
            // longer then 4 (HLC, range), this ensures that we are not trying
            // to reach the index out of bounds
            index = Math.min(index, yVal[0].length - 1);
            values = (yVal as Array<Array<number>>)
                .map((value: Array<number>): number => value[index]);
        }

        // Calculate changes for first N points
        while (range < period) {
            change = toFixed(
                values[range] - values[range - 1],
                decimals
            );

            if (change > 0) {
                gain += change;
            } else {
                loss += Math.abs(change);
            }

            range++;
        }

        // Average for first n-1 points:
        avgGain = toFixed(gain / (period - 1), decimals);
        avgLoss = toFixed(loss / (period - 1), decimals);

        for (i = range; i < yValLen; i++) {
            change = toFixed(values[i] - values[i - 1], decimals);

            if (change > 0) {
                gain = change;
                loss = 0;
            } else {
                gain = 0;
                loss = Math.abs(change);
            }

            // Calculate smoothed averages, RS, RSI values:
            avgGain = toFixed(
                (avgGain * (period - 1) + gain) / period,
                decimals
            );
            avgLoss = toFixed(
                (avgLoss * (period - 1) + loss) / period,
                decimals
            );
            // If average-loss is equal zero, then by definition RSI is set
            // to 100:
            if (avgLoss === 0) {
                RSIPoint = 100;
            // If average-gain is equal zero, then by definition RSI is set
            // to 0:
            } else if (avgGain === 0) {
                RSIPoint = 0;
            } else {
                RSIPoint = toFixed(
                    100 - (100 / (1 + (avgGain / avgLoss))),
                    decimals
                );
            }

            RSI.push([xVal[i], RSIPoint]);
            xData.push(xVal[i]);
            yData.push(RSIPoint);
        }

        return {
            values: RSI,
            xData: xData,
            yData: yData
        } as IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface RSIIndicator {
    pointClass: typeof RSIPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        rsi: typeof RSIIndicator;
    }
}

SeriesRegistry.registerSeriesType('rsi', RSIIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default RSIIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `RSI` series. If the [type](#series.rsi.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.rsi
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/rsi
 * @apioption series.rsi
 */

''; // to include the above in the js output
