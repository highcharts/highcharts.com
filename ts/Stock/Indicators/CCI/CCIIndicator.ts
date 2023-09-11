/* *
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 * */

'use strict';

/* *
 *
 * Imports
 *
 * */

import type {
    CCIOptions,
    CCIParamsOptions
} from './CCIOptions';
import type CCIPoint from './CCIPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { merge } = OH;

/* *
 *
 *  Functions
 *
 * */

// Utils:
/**
 * @private
 */
function sumArray(array: Array<number>): number {
    return array.reduce(function (prev, cur): number {
        return prev + cur;
    }, 0);
}

/**
 * @private
 */
function meanDeviation(arr: Array<number>, sma: number): number {
    const len = arr.length;
    let sum = 0,
        i: number;

    for (i = 0; i < len; i++) {
        sum += Math.abs(sma - (arr[i]));
    }

    return sum;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The CCI series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.cci
 *
 * @augments Highcharts.Series
 */
class CCIIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Commodity Channel Index (CCI). This series requires `linkedTo` option to
     * be set.
     *
     * @sample stock/indicators/cci
     *         CCI indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/cci
     * @optionparent plotOptions.cci
     */
    public static defaultOptions: CCIOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index
         */
        params: {
            index: void 0 // unused index, do not inherit (#15362)
        }
    } as CCIOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<CCIPoint> = void 0 as any;
    public points: Array<CCIPoint> = void 0 as any;
    public options: CCIOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: CCIParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            TP: Array<number> = [],
            CCI: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let CCIPoint: number,
            p: Array<number>,
            periodTP: Array<number> = [],
            len: number,
            range = 1,
            smaTP: number,
            TPtemp: number,
            meanDev: number,
            i: number;

        // CCI requires close value
        if (
            xVal.length <= period ||
            !isArray(yVal[0]) ||
            yVal[0].length !== 4
        ) {
            return;
        }

        // accumulate first N-points
        while (range < period) {
            p = yVal[range - 1];
            TP.push((p[1] + p[2] + p[3]) / 3);
            range++;
        }

        for (i = period; i <= yValLen; i++) {

            p = yVal[i - 1];
            TPtemp = (p[1] + p[2] + p[3]) / 3;
            len = TP.push(TPtemp);
            periodTP = TP.slice(len - period);

            smaTP = sumArray(periodTP) / period;
            meanDev = meanDeviation(periodTP, smaTP) / period;

            CCIPoint = ((TPtemp - smaTP) / (0.015 * meanDev));

            CCI.push([xVal[i - 1], CCIPoint]);
            xData.push(xVal[i - 1]);
            yData.push(CCIPoint);
        }

        return {
            values: CCI,
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

interface CCIIndicator {
    pointClass: typeof CCIPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        cci: typeof CCIIndicator;
    }
}

SeriesRegistry.registerSeriesType('cci', CCIIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default CCIIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `CCI` series. If the [type](#series.cci.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.cci
 * @since     6.0.0
 * @excluding dataParser, dataURL
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/cci
 * @apioption series.cci
 */

''; // to include the above in the js output
