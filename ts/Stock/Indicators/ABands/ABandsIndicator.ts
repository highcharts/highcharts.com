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
    ABandsOptions,
    ABandsParamsOptions
} from './ABandsOptions';
import type ABandsPoint from './ABandsPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import MultipleLinesComposition from '../MultipleLinesComposition.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function getBaseForBand(low: number, high: number, factor: number): number {
    return ((
        (correctFloat(high - low)) /
        ((correctFloat(high + low)) / 2)
    ) * 1000) * factor;
}

/**
 * @private
 */
function getPointUB(high: number, base: number): number {
    return high * (correctFloat(1 + 2 * base));
}

/**
 * @private
 */
function getPointLB(low: number, base: number): number {
    return low * (correctFloat(1 - 2 * base));
}

/* *
 *
 *  Class
 *
 * */

/**
 * The ABands series type
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.abands
 *
 * @augments Highcharts.Series
 */
class ABandsIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Acceleration bands (ABANDS). This series requires the `linkedTo` option
     * to be set and should be loaded after the
     * `stock/indicators/indicators.js`.
     *
     * @sample {highstock} stock/indicators/acceleration-bands
     *         Acceleration Bands
     *
     * @extends      plotOptions.sma
     * @mixes        Highcharts.MultipleLinesMixin
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, compare, compareBase, joinBy, keys,
     *               navigatorOptions, pointInterval, pointIntervalUnit,
     *               pointPlacement, pointRange, pointStart, showInNavigator,
     *               stacking,
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/acceleration-bands
     * @optionparent plotOptions.abands
     */
    public static defaultOptions: ABandsOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * Option for fill color between lines in Accelleration bands Indicator.
         *
         * @sample {highstock} stock/indicators/indicator-area-fill
         *      Background fill between lines.
         *
         * @type {Highcharts.Color}
         * @since 9.3.2
         * @apioption plotOptions.abands.fillColor
         *
         */
        params: {
            period: 20,
            /**
             * The algorithms factor value used to calculate bands.
             *
             * @product highstock
             */
            factor: 0.001,
            index: 3
        },
        lineWidth: 1,
        topLine: {
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1
            }
        },
        bottomLine: {
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as ABandsOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<ABandsPoint> = void 0 as any;

    public options: ABandsOptions = void 0 as any;

    public points: Array<ABandsPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        this: ABandsIndicator,
        series: TLinkedSeries,
        params: ABandsParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            factor: number = (params.factor as any),
            index: number = (params.index as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<number|null|undefined> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            // Upperbands
            UB: Array<number> = [],
            // Lowerbands
            LB: Array<number> = [],
            // ABANDS array structure:
            // 0-date, 1-top line, 2-middle line, 3-bottom line
            ABANDS: Array<Array<(number|null|undefined)>> = [],
            low = 2,
            high = 1,
            xData: Array<number> = [],
            yData: Array<Array<number>> = [];
            // middle line, top line and bottom line
        let ML: number,
            TL: number,
            BL: number,
            date: number,
            bandBase: (number|undefined),
            pointSMA: IndicatorValuesObject<TLinkedSeries>,
            ubSMA: IndicatorValuesObject<TLinkedSeries>,
            lbSMA: IndicatorValuesObject<TLinkedSeries>,
            slicedX: (Array<number>|undefined),
            slicedY: (Array<number|null|undefined>|undefined),
            i: (number|undefined);

        if (yValLen < period) {
            return;
        }

        for (i = 0; i <= yValLen; i++) {
            // Get UB and LB values of every point. This condition
            // is necessary, because there is a need to calculate current
            // UB nad LB values simultaneously with given period SMA
            // in one for loop.
            if (i < yValLen) {
                bandBase = getBaseForBand(
                    (yVal[i] as any)[low],
                    (yVal[i] as any)[high],
                    factor
                );
                UB.push(getPointUB((yVal[i] as any)[high], bandBase));
                LB.push(getPointLB((yVal[i] as any)[low], bandBase));
            }
            if (i >= period) {
                slicedX = xVal.slice(i - period, i);
                slicedY = yVal.slice(i - period, i);
                ubSMA = super.getValues.call(this, ({
                    xData: slicedX,
                    yData: UB.slice(i - period, i)
                } as any), {
                    period: period
                }) as IndicatorValuesObject<TLinkedSeries>;
                lbSMA = super.getValues.call(this, ({
                    xData: slicedX,
                    yData: LB.slice(i - period, i)
                } as any), {
                    period: period
                }) as IndicatorValuesObject<TLinkedSeries>;
                pointSMA = (super.getValues.call(this, ({
                    xData: slicedX,
                    yData: slicedY
                } as any), {
                    period: period,
                    index: index
                }) as IndicatorValuesObject<TLinkedSeries>);
                date = pointSMA.xData[0];
                TL = (ubSMA.yData[0] as any);
                BL = (lbSMA.yData[0] as any);
                ML = (pointSMA.yData[0] as any);
                ABANDS.push([date, TL, ML, BL]);
                xData.push(date);
                yData.push([TL, ML, BL]);
            }
        }

        return {
            values: ABANDS,
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

interface ABandsIndicator extends MultipleLinesComposition.IndicatorComposition {
    nameBase: string;
    nameComponents: Array<string>;
    pointArrayMap: Array<keyof ABandsPoint>;
    pointValKey: string;
    pointClass: typeof ABandsPoint;
}
extend(ABandsIndicator.prototype, {
    areaLinesNames: ['top', 'bottom'],
    linesApiNames: ['topLine', 'bottomLine'],
    nameBase: 'Acceleration Bands',
    nameComponents: ['period', 'factor'],
    pointArrayMap: ['top', 'middle', 'bottom'],
    pointValKey: 'middle'
});
MultipleLinesComposition.compose(ABandsIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        abands: typeof ABandsIndicator;
    }
}
SeriesRegistry.registerSeriesType('abands', ABandsIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default ABandsIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * An Acceleration bands indicator. If the [type](#series.abands.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.abands
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, compare, compareBase, dataParser, dataURL,
 *            joinBy, keys, navigatorOptions, pointInterval,
 *            pointIntervalUnit, pointPlacement, pointRange, pointStart,
 *            stacking, showInNavigator,
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/acceleration-bands
 * @apioption series.abands
 */

''; // to include the above in jsdoc
