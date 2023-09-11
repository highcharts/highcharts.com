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

import type {
    EMAOptions,
    EMAParamsOptions
} from './EMAOptions';
import type EMAPoint from './EMAPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The EMA series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.ema
 *
 * @augments Highcharts.Series
 */
class EMAIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Exponential moving average indicator (EMA). This series requires the
     * `linkedTo` option to be set.
     *
     * @sample stock/indicators/ema
     * Exponential moving average indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @optionparent plotOptions.ema
     */
    public static defaultOptions: EMAOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            /**
             * The point index which indicator calculations will base. For
             * example using OHLC data, index=2 means the indicator will be
             * calculated using Low values.
             *
             * By default index value used to be set to 0. Since
             * Highcharts Stock 7 by default index is set to 3
             * which means that the ema indicator will be
             * calculated using Close values.
             */
            index: 3,
            period: 9 // @merge 14 in v6.2
        }
    } as EMAOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<EMAPoint> = void 0 as any;

    public options: EMAOptions = void 0 as any;

    public points: Array<EMAPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public accumulatePeriodPoints(
        period: number,
        index: number,
        yVal: Array<Array<number>>
    ): number {
        let sum = 0,
            i = 0,
            y: (number|Array<number>) = 0;

        while (i < period) {
            y = index < 0 ? yVal[i] : yVal[i][index];
            sum = sum + (y as any);
            i++;
        }

        return sum;
    }

    public calculateEma(
        xVal: Array<number>,
        yVal: (Array<number>|Array<Array<number>>),
        i: number,
        EMApercent: number,
        calEMA: (number|undefined),
        index: number,
        SMA: number
    ): [number, number] {
        const x: number = xVal[i - 1],
            yValue: number = index < 0 ?
                yVal[i - 1] :
                (yVal as any)[i - 1][index],
            y: number = typeof calEMA === 'undefined' ?
                SMA : correctFloat((yValue * EMApercent) +
                (calEMA * (1 - EMApercent)));
        return [x, y];
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: EMAParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen = yVal ? yVal.length : 0,
            EMApercent = 2 / (period + 1),
            EMA: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];

        let calEMA: (number|undefined),
            EMAPoint: [number, number],
            i: number,
            index = -1,
            sum = 0,
            SMA = 0;

        // Check period, if bigger than points length, skip
        if (yValLen < period) {
            return;
        }

        // Switch index for OHLC / Candlestick / Arearange
        if (isArray(yVal[0])) {
            index = params.index ? params.index : 0;
        }

        // Accumulate first N-points
        sum = this.accumulatePeriodPoints(
            period,
            index,
            yVal
        );

        // first point
        SMA = sum / period;

        // Calculate value one-by-one for each period in visible data
        for (i = period; i < yValLen + 1; i++) {
            EMAPoint = this.calculateEma(
                xVal,
                yVal,
                i,
                EMApercent,
                calEMA,
                index,
                SMA
            );
            EMA.push(EMAPoint);
            xData.push(EMAPoint[0]);
            yData.push(EMAPoint[1]);
            calEMA = EMAPoint[1];
        }

        return {
            values: EMA,
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

interface EMAIndicator {
    pointClass: typeof EMAPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        ema: typeof EMAIndicator;
    }
}
SeriesRegistry.registerSeriesType('ema', EMAIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default EMAIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `EMA` series. If the [type](#series.ema.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.ema
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @apioption series.ema
 */

''; // adds doclet above to the transpiled file
