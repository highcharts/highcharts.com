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
    SlowStochasticOptions,
    SlowStochasticParamsOptions
} from './SlowStochasticOptions';
import type SlowStochasticPoint from './SlowStochasticPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator,
    stochastic: StochasticIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * The Slow Stochastic series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.slowstochastic
 *
 * @augments Highcharts.Series
 */
class SlowStochasticIndicator extends StochasticIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Slow Stochastic oscillator. This series requires the `linkedTo` option
     * to be set and should be loaded after `stock/indicators/indicators.js`
     * and `stock/indicators/stochastic.js` files.
     *
     * @sample stock/indicators/slow-stochastic
     *         Slow Stochastic oscillator
     *
     * @extends      plotOptions.stochastic
     * @since        8.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/stochastic
     * @requires     stock/indicators/slowstochastic
     * @optionparent plotOptions.slowstochastic
     */
    public static defaultOptions: SlowStochasticOptions = merge(StochasticIndicator.defaultOptions, {
        params: {
            /**
             * Periods for Slow Stochastic oscillator: [%K, %D, SMA(%D)].
             *
             * @type    {Array<number,number,number>}
             * @default [14, 3, 3]
             */
            periods: [14, 3, 3]
        }
    } as SlowStochasticOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<SlowStochasticPoint> = void 0 as any;
    public options: SlowStochasticOptions = void 0 as any;
    public points: Array<SlowStochasticPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues <TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: SlowStochasticParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const periods: Array<number> = (params.periods as any),
            fastValues = super.getValues.call(
                this,
                series,
                params
            ) as any,
            slowValues = {
                values: [] as Array<Array<number>>,
                xData: [] as Array<number>,
                yData: [] as Array<Array<number>>
            };

        if (!fastValues) {
            return;
        }

        slowValues.xData = fastValues.xData.slice(periods[1] - 1);
        const fastYData = fastValues.yData.slice(periods[1] - 1);

        // Get SMA(%D)
        const smoothedValues: (
            undefined|IndicatorValuesObject<LineSeries>
        ) = SMAIndicator.prototype.getValues.call(
            this,
            ({
                xData: slowValues.xData,
                yData: fastYData
            } as any),
            {
                index: 1,
                period: periods[2]
            }
        );

        if (!smoothedValues) {
            return;
        }

        // Format data
        for (let i = 0, xDataLen = slowValues.xData.length; i < xDataLen; i++) {

            slowValues.yData[i] = [
                fastYData[i][1],
                smoothedValues.yData[i - periods[2] + 1] || null
            ];

            slowValues.values[i] = [
                slowValues.xData[i],
                fastYData[i][1],
                smoothedValues.yData[i - periods[2] + 1] || null
            ];
        }

        return slowValues as
            IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface SlowStochasticIndicator {
    pointClass: typeof SlowStochasticPoint;
    nameBase: string;
}
extend(SlowStochasticIndicator.prototype, {
    nameBase: 'Slow Stochastic'
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        slowstochastic: typeof SlowStochasticIndicator;
    }
}

SeriesRegistry.registerSeriesType('slowstochastic', SlowStochasticIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default SlowStochasticIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A Slow Stochastic indicator. If the [type](#series.slowstochastic.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.slowstochastic
 * @since     8.0.0
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/stochastic
 * @requires  stock/indicators/slowstochastic
 * @apioption series.slowstochastic
 */

''; // to include the above in the js output
