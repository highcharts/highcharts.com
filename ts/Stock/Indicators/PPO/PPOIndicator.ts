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
    PPOOptions,
    PPOParamsOptions
} from './PPOOptions';
import type PPOPoint from './PPOPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    ema: EMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import error from '../../../Shared/Helpers/Error.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
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
 * The PPO series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.ppo
 *
 * @augments Highcharts.Series
 */
class PPOIndicator extends EMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Percentage Price Oscillator. This series requires the
     * `linkedTo` option to be set and should be loaded after the
     * `stock/indicators/indicators.js`.
     *
     * @sample {highstock} stock/indicators/ppo
     *         Percentage Price Oscillator
     *
     * @extends      plotOptions.ema
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/ppo
     * @optionparent plotOptions.ppo
     */
    public static defaultOptions: PPOOptions = merge(EMAIndicator.defaultOptions, {
        /**
         * Paramters used in calculation of Percentage Price Oscillator series
         * points.
         *
         * @excluding period
         */
        params: {
            period: void 0, // unchangeable period, do not inherit (#15362)
            /**
             * Periods for Percentage Price Oscillator calculations.
             *
             * @type    {Array<number>}
             * @default [12, 26]
             */
            periods: [12, 26]
        }
    } as PPOOptions);

    /* *
     *
     *   Properties
     *
     * */

    public data: Array<PPOPoint> = void 0 as any;
    public options: PPOOptions = void 0 as any;
    public points: Array<PPOPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: PPOParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries> | undefined) {
        const periods: Array<number> = (params.periods as any),
            index: number = (params.index as any),
            // 0- date, 1- Percentage Price Oscillator
            PPO: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let oscillator: number,
            i: number;

        // Check if periods are correct
        if (periods.length !== 2 || periods[1] <= periods[0]) {
            error(
                'Error: "PPO requires two periods. Notice, first period ' +
                'should be lower than the second one."'
            );
            return;
        }

        // Shorter Period EMA
        const SPE: (
            IndicatorValuesObject<TLinkedSeries> |
            undefined
        ) = super.getValues.call(this, series, {
            index: index,
            period: periods[0]
        }) as IndicatorValuesObject<TLinkedSeries>;

        // Longer Period EMA
        const LPE: (
            IndicatorValuesObject<TLinkedSeries> |
            undefined
        ) = super.getValues.call(this, series, {
            index: index,
            period: periods[1]
        }) as IndicatorValuesObject<TLinkedSeries>;

        // Check if ema is calculated properly, if not skip
        if (!SPE || !LPE) {
            return;
        }

        const periodsOffset: number = periods[1] - periods[0];

        for (i = 0; i < LPE.yData.length; i++) {
            oscillator = correctFloat(
                ((SPE as any).yData[i + periodsOffset] -
                    (LPE as any).yData[i]) /
                (LPE as any).yData[i] *
                100
            );

            PPO.push([(LPE as any).xData[i], oscillator]);
            xData.push((LPE as any).xData[i]);
            yData.push(oscillator);
        }

        return {
            values: PPO,
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

interface PPOIndicator {
    nameBase: string;
    nameComponents: Array<string>;
    pointClass: typeof PPOPoint;
}

extend(PPOIndicator.prototype, {
    nameBase: 'PPO',
    nameComponents: ['periods']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        ppo: typeof PPOIndicator;
    }
}

SeriesRegistry.registerSeriesType('ppo', PPOIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default PPOIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `Percentage Price Oscillator` series. If the [type](#series.ppo.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.ppo
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, dataParser, dataURL, joinBy, keys,
 *            navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/ppo
 * @apioption series.ppo
 */

''; // to include the above in the js output
