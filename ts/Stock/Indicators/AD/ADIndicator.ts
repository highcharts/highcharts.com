/* *
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    ADOptions,
    ADParamsOptions
} from './ADOptions';
import type ADPoint from './ADPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import error from '../../../Shared/Helpers/Error.js';
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * The AD series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.ad
 *
 * @augments Highcharts.Series
 */
class ADIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Accumulation Distribution (AD). This series requires `linkedTo` option to
     * be set.
     *
     * @sample stock/indicators/accumulation-distribution
     *         Accumulation/Distribution indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/accumulation-distribution
     * @optionparent plotOptions.ad
     */
    public static defaultOptions: ADOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index
         */
        params: {
            index: void 0, // unused index, do not inherit (#15362)
            /**
             * The id of volume series which is mandatory.
             * For example using OHLC data, volumeSeriesID='volume' means
             * the indicator will be calculated using OHLC and volume values.
             *
             * @since 6.0.0
             */
            volumeSeriesID: 'volume'
        }
    } as ADOptions);

    /* *
     *
     *  Static Functions
     *
     * */

    protected static populateAverage(
        xVal: Array<number>,
        yVal: Array<Array<number>>,
        yValVolume: Array<number>,
        i: number,
        _period: number
    ): Array<number> {
        const high = yVal[i][1],
            low = yVal[i][2],
            close = yVal[i][3],
            volume = yValVolume[i],
            adY = close === high && close === low || high === low ?
                0 :
                ((2 * close - low - high) / (high - low)) * volume,
            adX = xVal[i];

        return [adX, adY];
    }

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<ADPoint> = void 0 as any;
    public options: ADOptions = void 0 as any;
    public points: Array<ADPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: ADParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<(number|null|undefined)> = (series.yData as any),
            volumeSeriesID: string = (params.volumeSeriesID as any),
            volumeSeries: LineSeries = series.chart.get(volumeSeriesID) as any,
            yValVolume = volumeSeries && volumeSeries.yData,
            yValLen = yVal ? yVal.length : 0,
            AD: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let len: (number|undefined),
            i: (number|undefined),
            ADPoint: Array<number>;

        if (
            xVal.length <= period &&
            yValLen &&
            (yVal[0] as any).length !== 4
        ) {
            return;
        }

        if (!volumeSeries) {
            error(
                'Series ' +
                volumeSeriesID +
                ' not found! Check `volumeSeriesID`.',
                true,
                series.chart
            );
            return;
        }

        // i = period <-- skip first N-points
        // Calculate value one-by-one for each period in visible data
        for (i = period; i < yValLen; i++) {

            len = AD.length;
            ADPoint = ADIndicator.populateAverage(
                xVal, yVal as any, yValVolume as any, i, period
            );

            if (len > 0) {
                ADPoint[1] += AD[len - 1][1];
            }

            AD.push(ADPoint);

            xData.push(ADPoint[0]);
            yData.push(ADPoint[1]);
        }

        return {
            values: AD,
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

interface ADIndicator {
    pointClass: typeof ADPoint;
    nameComponents: Array<string>;
    nameBase: string;
}
extend(ADIndicator.prototype, {
    nameComponents: (false as any),
    nameBase: 'Accumulation/Distribution'
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        ad: typeof ADIndicator;
    }
}
SeriesRegistry.registerSeriesType('ad', ADIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default ADIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `AD` series. If the [type](#series.ad.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.ad
 * @since     6.0.0
 * @excluding dataParser, dataURL
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/accumulation-distribution
 * @apioption series.ad
 */

''; // add doclet above to transpiled file
