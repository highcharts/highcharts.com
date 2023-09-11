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
    StochasticOptions,
    StochasticParamsOptions
} from './StochasticOptions';
import type StochasticPoint from './StochasticPoint';

import AU from '../ArrayUtilities.js';
import MultipleLinesComposition from '../MultipleLinesComposition.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * The Stochastic series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.stochastic
 *
 * @augments Highcharts.Series
 */
class StochasticIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Stochastic oscillator. This series requires the `linkedTo` option to be
     * set and should be loaded after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/stochastic
     *         Stochastic oscillator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/stochastic
     * @optionparent plotOptions.stochastic
     */
    public static defaultOptions: StochasticOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index, period
         */
        params: {
            // Index and period are unchangeable, do not inherit (#15362)
            index: void 0,
            period: void 0,
            /**
             * Periods for Stochastic oscillator: [%K, %D].
             *
             * @type    {Array<number,number>}
             * @default [14, 3]
             */
            periods: [14, 3]
        },
        marker: {
            enabled: false
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b><br/>%K: {point.y}<br/>%D: {point.smoothed}<br/>'
        },
        /**
         * Smoothed line options.
         */
        smoothedLine: {
            /**
             * Styles for a smoothed line.
             */
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line. If not set, it's inherited from
                 * [plotOptions.stochastic.color
                 * ](#plotOptions.stochastic.color).
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as StochasticOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<StochasticPoint> = void 0 as any;
    public options: StochasticOptions = void 0 as any;
    public points: Array<StochasticPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        super.init.apply(this, arguments);

        // Set default color for lines:
        this.options = merge({
            smoothedLine: {
                styles: {
                    lineColor: this.color
                }
            }
        }, this.options);
    }

    public getValues <TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: StochasticParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const periodK: number = (params.periods as any)[0],
            periodD: number = (params.periods as any)[1],
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            // 0- date, 1-%K, 2-%D
            SO: Array<Array<(number|null)>> = [],
            xData: Array<number> = [],
            yData: Array<Array<(number|null)>> = [],
            close = 3,
            low = 2,
            high = 1;

        let slicedY: Array<Array<number>>,
            CL: number,
            HL: number,
            LL: number,
            K: number,
            D: number|null = null,
            points: (IndicatorValuesObject<LineSeries>|undefined),
            extremes: [number, number],
            i: number;


        // Stochastic requires close value
        if (
            yValLen < periodK ||
            !isArray(yVal[0]) ||
            yVal[0].length !== 4
        ) {
            return;
        }

        // If the value of initial points is constant, wait until it changes
        // to calculate correct Stochastic values
        let constantValues = true,
            j = 0;
        // For a N-period, we start from N-1 point, to calculate Nth point
        // That is why we later need to comprehend slice() elements list
        // with (+1)
        for (i = periodK - 1; i < yValLen; i++) {
            slicedY = yVal.slice(i - periodK + 1, i + 1);

            // Calculate %K
            extremes = AU.getArrayExtremes(slicedY, low as any, high as any);
            LL = extremes[0]; // Lowest low in %K periods
            CL = yVal[i][close] - LL;
            HL = extremes[1] - LL;
            K = CL / HL * 100;

            if (isNaN(K) && constantValues) {
                j++;
                continue;
            } else if (constantValues && !isNaN(K)) {
                constantValues = false;
            }

            const length = xData.push(xVal[i]);

            // If N-period previous values are constant which results in NaN %K,
            // we need to use previous %K value if it is a number,
            // otherwise we should use null
            if (isNaN(K)) {
                yData.push([
                    yData[length - 2] &&
                        typeof yData[length - 2][0] === 'number' ?
                        yData[length - 2][0] : null,
                    null
                ]);
            } else {
                yData.push([K, null]);
            }

            // Calculate smoothed %D, which is SMA of %K
            if (i >= j + (periodK - 1) + (periodD - 1)) {
                points = super.getValues(
                    ({
                        xData: xData.slice(-periodD),
                        yData: yData.slice(-periodD)
                    } as any),
                    {
                        period: periodD
                    }
                );
                D = (points as any).yData[0];
            }

            SO.push([xVal[i], K, D]);
            yData[length - 1][1] = D;
        }

        return {
            values: SO,
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

interface StochasticIndicator extends MultipleLinesComposition.IndicatorComposition {
    linesApiNames: Array<string>;
    nameBase: string;
    nameComponents: Array<string>;
    parallelArrays: Array<string>;
    pointArrayMap: Array<keyof StochasticPoint>;
    pointClass: typeof StochasticPoint;
    pointValKey: string;
}

extend(StochasticIndicator.prototype, {
    areaLinesNames: [],
    nameComponents: ['periods'],
    nameBase: 'Stochastic',
    pointArrayMap: ['y', 'smoothed'],
    parallelArrays: ['x', 'y', 'smoothed'],
    pointValKey: 'y',
    linesApiNames: ['smoothedLine']
});

MultipleLinesComposition.compose(StochasticIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        stochastic: typeof StochasticIndicator;
    }
}
SeriesRegistry.registerSeriesType('stochastic', StochasticIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default StochasticIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A Stochastic indicator. If the [type](#series.stochastic.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.stochastic
 * @since     6.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis,  dataParser, dataURL, joinBy, keys,
 *            navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/stochastic
 * @apioption series.stochastic
 */

''; // to include the above in the js output
