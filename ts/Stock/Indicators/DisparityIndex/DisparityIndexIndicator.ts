/* *
 *  (c) 2010-2021 Rafal Sebestjanski
 *
 *  Disparity Index technical indicator for Highcharts Stock
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
    DisparityIndexOptions,
    DisparityIndexParamsOptions
} from './DisparityIndexOptions';
import type DisparityIndexPoint from './DisparityIndexPoint';
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
const { defined, extend, merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The Disparity Index series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.disparityindex
 *
 * @augments Highcharts.Series
 */
class DisparityIndexIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Disparity Index.
     * This series requires the `linkedTo` option to be set and should
     * be loaded after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/disparity-index
     *         Disparity Index indicator
     *
     * @extends      plotOptions.sma
     * @since 9.1.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/disparity-index
     * @optionparent plotOptions.disparityindex
     */
    public static defaultOptions: DisparityIndexOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            /**
             * The average used to calculate the Disparity Index indicator.
             * By default it uses SMA, with EMA as an option. To use other
             * averages, e.g. TEMA, the `stock/indicators/tema.js` file needs to
             * be loaded.
             *
             * If value is different than `ema`, `dema`, `tema` or `wma`,
             * then sma is used.
             */
            average: 'sma',
            index: 3
        },
        marker: {
            enabled: false
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as DisparityIndexOptions);

    /* *
     *
     *  Properties
     *
     * */

    public averageIndicator: typeof SMAIndicator = void 0 as any;
    public data: Array<DisparityIndexPoint> = void 0 as any;
    public options: DisparityIndexOptions = void 0 as any;
    public points: Array<DisparityIndexPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        const args = arguments,
            ctx = this, // Disparity Index indicator
            params = args[1].params, // options.params
            averageType = params && params.average ? params.average : void 0;

        ctx.averageIndicator = SeriesRegistry
            .seriesTypes[averageType] as typeof SMAIndicator || SMAIndicator;
        ctx.averageIndicator.prototype.init.apply(ctx, args);
    }

    public calculateDisparityIndex(
        curPrice: number,
        periodAverage: number
    ): number {
        return correctFloat(curPrice - periodAverage) / periodAverage * 100;
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: DisparityIndexParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const index = params.index,
            xVal: Array<number> = (series.xData as any),
            yVal: Array<number>|Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            disparityIndexPoint: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [],
            // "as any" because getValues doesn't exist on typeof Series
            averageIndicator = this.averageIndicator as any,
            isOHLC = isArray(yVal[0]),
            // Get the average indicator's values
            values = averageIndicator.prototype.getValues(series, params),
            yValues = values.yData,
            start = xVal.indexOf(values.xData[0]);

        // Check period, if bigger than points length, skip
        if (
            !yValues || yValues.length === 0 ||
            !defined(index) ||
            yVal.length <= start
        ) {
            return;
        }

        // Get the Disparity Index indicator's values
        for (let i = start; i < yValLen; i++) {
            const disparityIndexValue: number = this.calculateDisparityIndex(
                isOHLC ? (yVal[i] as any)[index] : yVal[i],
                yValues[i - start]
            );

            disparityIndexPoint.push([
                xVal[i],
                disparityIndexValue
            ]);
            xData.push(xVal[i]);
            yData.push(disparityIndexValue);
        }

        return {
            values: disparityIndexPoint,
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

interface DisparityIndexIndicator {
    nameBase: string;
    nameComponents: Array<string>;

    pointClass: typeof DisparityIndexPoint;
}
extend(DisparityIndexIndicator.prototype, {
    nameBase: 'Disparity Index',
    nameComponents: ['period', 'average']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        disparityindex: typeof DisparityIndexIndicator;
    }
}
SeriesRegistry.registerSeriesType('disparityindex', DisparityIndexIndicator);


/* *
 *
 *  Default Export
 *
 * */

export default DisparityIndexIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * The Disparity Index indicator series.
 * If the [type](#series.disparityindex.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.disparityindex
 * @since 9.1.0
 * @product   highstock
 * @excluding allAreas, colorAxis,  dataParser, dataURL, joinBy, keys,
 *            navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/disparity-index
 * @apioption series.disparityindex
 */

''; // to include the above in the js output
