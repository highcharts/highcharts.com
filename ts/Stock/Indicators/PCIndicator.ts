/* *
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type CSSObject from '../../Core/Renderer/CSSObject';
import type IndicatorValuesObject from './IndicatorValuesObject';
import type LineSeries from '../../Series/Line/LineSeries';
const {
    seriesTypes: {
        sma: SMAIndicator
    }
} = BaseSeries;
import type {
    SMAOptions,
    SMAParamsOptions
} from './SMA/SMAOptions';
import type SMAPoint from './SMA/SMAPoint';
import BaseSeries from '../../Core/Series/Series.js';
import palette from '../../Core/Color/Palette.js';
import MultipleLinesMixin from '../../Mixins/MultipleLines.js';
import ReduceArrayMixin from '../../Mixins/ReduceArray.js';
import U from '../../Core/Utilities.js';
const {
    merge,
    extend
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface PCIndicatorParamsOptions extends SMAParamsOptions {
            // for inheritance
        }

        class PCIndicatorPoint extends SMAPoint {
            public series: PCIndicator;
        }

        interface PCIndicatorOptions extends SMAOptions,
            MultipleLinesIndicatorOptions {
            params?: PCIndicatorParamsOptions;
            bottomLine: Record<string, CSSObject>;
            topLine: Record<string, CSSObject>;
        }
    }
}

const getArrayExtremes = ReduceArrayMixin.getArrayExtremes;

/* *
 *
 *  Class
 *
 * */

/**
 * The Price Channel series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.pc
 *
 * @augments Highcharts.Series
 */
class PCIndicator extends SMAIndicator implements Highcharts.MultipleLinesIndicator {
    /**
     * Price channel (PC). This series requires the `linkedTo` option to be
     * set and should be loaded after the `stock/indicators/indicators.js`.
     *
     * @sample {highstock} stock/indicators/price-channel
     *         Price Channel
     *
     * @extends      plotOptions.sma
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, compare, compareBase, joinBy, keys,
     *               navigatorOptions, pointInterval, pointIntervalUnit,
     *               pointPlacement, pointRange, pointStart, showInNavigator,
     *               stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/price-channel
     * @optionparent plotOptions.pc
     */
    public static defaultOptions: Highcharts.PCIndicatorOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index
         */
        params: {
            period: 20
        },
        lineWidth: 1,
        topLine: {
            styles: {
                /**
                 * Color of the top line. If not set, it's inherited from
                 * [plotOptions.pc.color](#plotOptions.pc.color).
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: palette.colors[2],
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1
            }
        },
        bottomLine: {
            styles: {
                /**
                 * Color of the bottom line. If not set, it's inherited from
                 * [plotOptions.pc.color](#plotOptions.pc.color).
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: palette.colors[8],
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as Highcharts.PCIndicatorOptions);

    /* *
    *
    *  Properties
    *
    * */

    public data: Array<Highcharts.PCIndicatorPoint> = void 0 as any;
    public options: Highcharts.PCIndicatorOptions = void 0 as any;
    public points: Array<Highcharts.PCIndicatorPoint> = void 0 as any;

    /* *
    *
    *  Functions
    *
    * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: Highcharts.PCIndicatorParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries> | undefined) {
        var period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            // 0- date, 1-top line, 2-middle line, 3-bottom line
            PC: Array<Array<number>> = [],
            // middle line, top line and bottom line
            ML: number,
            TL: number,
            BL: number,
            date: number,
            low = 2,
            high = 1,
            xData: Array<number> = [],
            yData: Array<Array<number>> = [],
            slicedY: Array<Array<number>>,
            extremes: [number, number],
            i: number;

        if (yValLen < period) {
            return;
        }

        for (i = period; i <= yValLen; i++) {
            date = xVal[i - 1];
            slicedY = yVal.slice(i - period, i);
            extremes = getArrayExtremes(slicedY, low as any, high as any);
            TL = extremes[1];
            BL = extremes[0];
            ML = (TL + BL) / 2;
            PC.push([date, TL, ML, BL]);
            xData.push(date);
            yData.push([TL, ML, BL]);
        }

        return {
            values: PC,
            xData: xData,
            yData: yData
        } as IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
*
*   Prototype Properties
*
* */

interface PCIndicator {
    getTranslatedLinesNames: Highcharts.MultipleLinesMixin[
        'getTranslatedLinesNames'
    ];
    linesApiNames: Highcharts.MultipleLinesMixin['linesApiNames'];
    nameBase: string;
    nameComponents: Array<string>;
    pointArrayMap: Array<string>;
    pointClass: typeof Highcharts.PCIndicatorPoint;
    pointValKey: string;
}

extend(PCIndicator.prototype, merge(MultipleLinesMixin, {
    pointArrayMap: ['top', 'middle', 'bottom'],
    pointValKey: 'middle',
    nameBase: 'Price Channel',
    nameComponents: ['period'],
    linesApiNames: ['topLine', 'bottomLine']
}));

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        pc: typeof PCIndicator;
    }
}

BaseSeries.registerSeriesType('pc', PCIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default PCIndicator;

/**
 * A Price channel indicator. If the [type](#series.pc.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends      series,plotOptions.pc
 * @since        7.0.0
 * @product      highstock
 * @excluding    allAreas, colorAxis, compare, compareBase, dataParser, dataURL,
 *               joinBy, keys, navigatorOptions, pointInterval,
 *               pointIntervalUnit, pointPlacement, pointRange, pointStart,
 *               showInNavigator, stacking
 * @requires     stock/indicators/indicators
 * @requires     stock/indicators/price-channel
 * @apioption    series.pc
 */

''; // to include the above in the js output
