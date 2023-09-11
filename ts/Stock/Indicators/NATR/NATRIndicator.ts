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
    NATROptions,
    NATRParamsOptions
} from './NATROptions';
import type NATRPoint from './NATRPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    atr: ATRIndicator
} = SeriesRegistry.seriesTypes;

/* *
 *
 *  Class
 *
 * */

/**
 * The NATR series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.natr
 *
 * @augments Highcharts.Series
 */
class NATRIndicator extends ATRIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Normalized average true range indicator (NATR). This series requires
     * `linkedTo` option to be set and should be loaded after the
     * `stock/indicators/indicators.js` and `stock/indicators/atr.js`.
     *
     * @sample {highstock} stock/indicators/natr
     *         NATR indicator
     *
     * @extends      plotOptions.atr
     * @since        7.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/natr
     * @optionparent plotOptions.natr
     */
    public static defaultOptions: NATROptions = merge(ATRIndicator.defaultOptions, {
        tooltip: {
            valueSuffix: '%'
        }
    } as NATROptions);

    /**
     * @lends Highcharts.Series#
     */

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<NATRPoint> = void 0 as any;
    public points: Array<NATRPoint> = void 0 as any;
    public options: NATROptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: NATRParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const atrData: (
                IndicatorValuesObject<LineSeries>|
                undefined
            ) = (
                super.getValues.apply(this, arguments)
            ),
            atrLength: number = (atrData as any).values.length,
            yVal: Array<Array<number>> = (series.yData as any);
        let i = 0,
            period: number = (params.period as any) - 1;

        if (!atrData) {
            return;
        }

        for (; i < atrLength; i++) {
            atrData.yData[i] = (
                (atrData.values as any)[i][1] / yVal[period][3] * 100
            );
            atrData.values[i][1] = atrData.yData[i];
            period++;
        }

        return atrData as IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface NATRIndicator {
    pointClass: typeof NATRPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        natr: typeof NATRIndicator;
    }
}

SeriesRegistry.registerSeriesType('natr', NATRIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default NATRIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `NATR` series. If the [type](#series.natr.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.natr
 * @since     7.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/atr
 * @requires  stock/indicators/natr
 * @apioption series.natr
 */

''; // to include the above in the js output'
