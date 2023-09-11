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
    ChaikinOptions,
    ChaikinParamsOptions
} from './ChaikinOptions';
import type ChaikinPoint from './ChaikinPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import AD from '../AD/ADIndicator.js'; // For historic reasons, AD is built into Chaikin
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    ema: EMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import error from '../../../Shared/Helpers/Error.js';
const { extend, merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The Chaikin series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.chaikin
 *
 * @augments Highcharts.Series
 */
class ChaikinIndicator extends EMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Chaikin Oscillator. This series requires the `linkedTo` option to
     * be set and should be loaded after the `stock/indicators/indicators.js`.
     *
     * @sample {highstock} stock/indicators/chaikin
     *         Chaikin Oscillator
     *
     * @extends      plotOptions.ema
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/chaikin
     * @optionparent plotOptions.chaikin
     */
    public static defaultOptions: ChaikinOptions = merge(EMAIndicator.defaultOptions, {
        /**
         * Paramters used in calculation of Chaikin Oscillator
         * series points.
         *
         * @excluding index
         */
        params: {
            index: void 0, // unused index, do not inherit (#15362)
            /**
             * The id of volume series which is mandatory.
             * For example using OHLC data, volumeSeriesID='volume' means
             * the indicator will be calculated using OHLC and volume values.
             */
            volumeSeriesID: 'volume',
            /**
             * Parameter used indirectly for calculating the `AD` indicator.
             * Decides about the number of data points that are taken
             * into account for the indicator calculations.
             */
            period: 9,
            /**
             * Periods for Chaikin Oscillator calculations.
             *
             * @type    {Array<number>}
             * @default [3, 10]
             */
            periods: [3, 10]
        }
    } as ChaikinOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<ChaikinPoint> = void 0 as any;
    public options: ChaikinOptions = void 0 as any;
    public points: Array<ChaikinPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: ChaikinParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const periods: Array<number> = (params.periods as any),
            period: number = (params.period as any),
            // 0- date, 1- Chaikin Oscillator
            CHA: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let oscillator: number,
            i: number;

        // Check if periods are correct
        if (periods.length !== 2 || periods[1] <= periods[0]) {
            error(
                'Error: "Chaikin requires two periods. Notice, first ' +
                'period should be lower than the second one."'
            );
            return;
        }

        // Accumulation Distribution Line data
        const ADL: (IndicatorValuesObject<TLinkedSeries>|undefined) =
            AD.prototype.getValues.call(this, series, {
                volumeSeriesID: params.volumeSeriesID,
                period: period
            }) as IndicatorValuesObject<TLinkedSeries>;

        // Check if adl is calculated properly, if not skip
        if (!ADL) {
            return;
        }

        // Shorter Period EMA
        const SPE: (IndicatorValuesObject<TLinkedSeries>|undefined) =
            super.getValues.call(this, (ADL as any), {
                period: periods[0]
            }) as IndicatorValuesObject<TLinkedSeries>;
        // Longer Period EMA
        const LPE: (IndicatorValuesObject<TLinkedSeries>|undefined) =
            super.getValues.call(this, (ADL as any), {
                period: periods[1]
            }) as IndicatorValuesObject<TLinkedSeries>;

        // Check if ema is calculated properly, if not skip
        if (!SPE || !LPE) {
            return;
        }

        const periodsOffset: number = periods[1] - periods[0];

        for (i = 0; i < LPE.yData.length; i++) {
            oscillator = correctFloat(
                (SPE as any).yData[i + periodsOffset] -
                (LPE as any).yData[i]
            );

            CHA.push([(LPE as any).xData[i], oscillator]);
            xData.push((LPE as any).xData[i]);
            yData.push(oscillator);
        }

        return {
            values: CHA,
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

interface ChaikinIndicator {
    nameBase: string;
    nameComponents: Array<string>;
    pointClass: typeof ChaikinPoint;
}
extend(ChaikinIndicator.prototype, {
    nameBase: 'Chaikin Osc',
    nameComponents: ['periods']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        chaikin: typeof ChaikinIndicator;
    }
}
SeriesRegistry.registerSeriesType('chaikin', ChaikinIndicator);

/* *
 *
 *  Default Export
 *
 * */
export default ChaikinIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `Chaikin Oscillator` series. If the [type](#series.chaikin.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.chaikin
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, dataParser, dataURL, joinBy, keys,
 *            navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, stacking, showInNavigator
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/chaikin
 * @apioption series.chaikin
 */

''; // to include the above in the js output
