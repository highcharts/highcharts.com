/* *
 *
 *  (c) 2010-2021 Kacper Madej
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
    WMAOptions,
    WMAParamsOptions
} from './WMAOptions';
import type WMAPoint from './WMAPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
import U from '../../../Core/Utilities.js';
const {
    isArray,
    merge
} = U;

/* *
 *
 *  Functions
 *
 * */

// Utils:
/**
 * @private
 */
function accumulateAverage(
    points: Array<[number, (number|Array<number>)]>,
    xVal: Array<number>,
    yVal: Array<Array<number>>,
    i: number,
    index: number
): void {
    const xValue: number = xVal[i],
        yValue: (number|Array<number>) = index < 0 ? yVal[i] : yVal[i][index];

    points.push([xValue, yValue]);
}

/**
 * @private
 */
function weightedSumArray(
    array: Array<[(number|null), (number|Array<number>)]>,
    pLen: number
): number {
    // The denominator is the sum of the number of days as a triangular number.
    // If there are 5 days, the triangular numbers are 5, 4, 3, 2, and 1.
    // The sum is 5 + 4 + 3 + 2 + 1 = 15.
    const denominator = (pLen + 1) / 2 * pLen;

    // reduce VS loop => reduce
    return (array.reduce(
        function (
            prev: [(number|null), (number|Array<number>)],
            cur: [(number|null), (number|Array<number>)],
            i: number
        ): [(number|null), (number|Array<number>)] {
            return [null, (prev[1] as any) + (cur[1] as any) * (i + 1)];
        }
    )[1] as any) / denominator;
}

/**
 * @private
 */
function populateAverage(
    points: Array<[number, (number|Array<number>)]>,
    xVal: Array<number>,
    yVal: Array<Array<number>>,
    i: number
): Array<number> {
    const pLen = points.length,
        wmaY = weightedSumArray(points, pLen),
        wmaX = xVal[i - 1];

    points.shift(); // remove point until range < period

    return [wmaX, wmaY];
}

/* *
 *
 *  Class
 *
 * */

/**
 * The SMA series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.wma
 *
 * @augments Highcharts.Series
 */
class WMAIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Weighted moving average indicator (WMA). This series requires `linkedTo`
     * option to be set.
     *
     * @sample stock/indicators/wma
     *         Weighted moving average indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/wma
     * @optionparent plotOptions.wma
     */
    public static defaultOptions: WMAOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            index: 3,
            period: 9
        }
    } as WMAOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<WMAPoint> = void 0 as any;
    public options: WMAOptions = void 0 as any;
    public points: Array<WMAPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues <TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: WMAParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = params.period as any,
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen = yVal ? yVal.length : 0,
            xValue: number = xVal[0],
            wma: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];

        let range = 1,
            index = -1,
            i: (number|undefined),
            wmaPoint: (Array<number>|undefined),
            yValue: (number|Array<number>) = yVal[0];

        if (xVal.length < period) {
            return;
        }

        // Switch index for OHLC / Candlestick
        if (isArray(yVal[0])) {
            index = (params.index as any);
            yValue = yVal[0][index];
        }

        // Starting point
        const points: Array<[number, (number|Array<number>)]> =
            [[xValue, yValue]];

        // Accumulate first N-points
        while (range !== period) {
            accumulateAverage(points, xVal, yVal, range, index);
            range++;
        }

        // Calculate value one-by-one for each period in visible data
        for (i = range; i < yValLen; i++) {
            wmaPoint = populateAverage(points, xVal, yVal, i);
            wma.push(wmaPoint);
            xData.push(wmaPoint[0]);
            yData.push(wmaPoint[1]);

            accumulateAverage(points, xVal, yVal, i, index);
        }

        wmaPoint = populateAverage(points, xVal, yVal, i);
        wma.push(wmaPoint);
        xData.push(wmaPoint[0]);
        yData.push(wmaPoint[1]);

        return {
            values: wma,
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

interface WMAIndicator {
    pointClass: typeof WMAPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        wma: typeof WMAIndicator;
    }
}

SeriesRegistry.registerSeriesType('wma', WMAIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default WMAIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `WMA` series. If the [type](#series.wma.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.wma
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/wma
 * @apioption series.wma
 */

''; // adds doclet above to the transpiled file
