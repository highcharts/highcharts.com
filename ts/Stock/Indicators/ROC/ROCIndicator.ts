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
    ROCOptions,
    ROCParamsOptions
} from './ROCOptions';
import type ROCPoint from './ROCPoint';

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
 *  Functions
 *
 * */

// Utils:
function populateAverage(
    xVal: Array<number>,
    yVal: (Array<number>|Array<Array<number>>),
    i: number,
    period: number,
    index: number
): [number, (number|null)] {
    /* Calculated as:

       (Closing Price [today] - Closing Price [n days ago]) /
        Closing Price [n days ago] * 100

       Return y as null when avoiding division by zero */
    let nDaysAgoY: number,
        rocY: (number|null);

    if (index < 0) {
        // y data given as an array of values
        nDaysAgoY = (yVal[i - period] as any);
        rocY = nDaysAgoY ?
            ((yVal as any)[i] - nDaysAgoY) / nDaysAgoY * 100 :
            null;
    } else {
        // y data given as an array of arrays and the index should be used
        nDaysAgoY = (yVal as any)[i - period][index];
        rocY = nDaysAgoY ?
            ((yVal as any)[i][index] - nDaysAgoY) / nDaysAgoY * 100 :
            null;
    }

    return [xVal[i], rocY];
}

/* *
 *
 *  Class
 *
 * */

/**
 * The ROC series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.roc
 *
 * @augments Highcharts.Series
 */
class ROCIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Rate of change indicator (ROC). The indicator value for each point
     * is defined as:
     *
     * `(C - Cn) / Cn * 100`
     *
     * where: `C` is the close value of the point of the same x in the
     * linked series and `Cn` is the close value of the point `n` periods
     * ago. `n` is set through [period](#plotOptions.roc.params.period).
     *
     * This series requires `linkedTo` option to be set.
     *
     * @sample stock/indicators/roc
     *         Rate of change indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/roc
     * @optionparent plotOptions.roc
     */
    public static defaultOptions: ROCOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            index: 3,
            period: 9
        }
    } as ROCOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<ROCPoint> = void 0 as any;

    public options: ROCOptions = void 0 as any;

    public points: Array<ROCPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: ROCParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            ROC: Array<Array<(number|null)>> = [],
            xData: Array<number> = [],
            yData: Array<(number|null)> = [];
        let i: number,
            index = -1,
            ROCPoint: [number, (number|null)];

        // Period is used as a number of time periods ago, so we need more
        // (at least 1 more) data than the period value
        if (xVal.length <= period) {
            return;
        }

        // Switch index for OHLC / Candlestick / Arearange
        if (isArray(yVal[0])) {
            index = (params.index as any);
        }

        // i = period <-- skip first N-points
        // Calculate value one-by-one for each period in visible data
        for (i = period; i < yValLen; i++) {
            ROCPoint = populateAverage(xVal, yVal, i, period, index);
            ROC.push(ROCPoint);
            xData.push(ROCPoint[0]);
            yData.push(ROCPoint[1]);
        }

        return {
            values: ROC,
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

interface ROCIndicator {
    nameBase: string;
    pointClass: typeof ROCPoint;
}

extend(ROCIndicator.prototype, {
    nameBase: 'Rate of Change'
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        roc: typeof ROCIndicator;
    }
}

SeriesRegistry.registerSeriesType('roc', ROCIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default ROCIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `ROC` series. If the [type](#series.wma.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * Rate of change indicator (ROC). The indicator value for each point
 * is defined as:
 *
 * `(C - Cn) / Cn * 100`
 *
 * where: `C` is the close value of the point of the same x in the
 * linked series and `Cn` is the close value of the point `n` periods
 * ago. `n` is set through [period](#series.roc.params.period).
 *
 * This series requires `linkedTo` option to be set.
 *
 * @extends   series,plotOptions.roc
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/roc
 * @apioption series.roc
 */

''; // to include the above in the js output
