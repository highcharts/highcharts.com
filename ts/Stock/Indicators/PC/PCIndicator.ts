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
    PCOptions,
    PCParamsOptions
} from '../PC/PCOptions';
import type PCPoint from './PCPoint';

import AU from '../ArrayUtilities.js';
import MultipleLinesComposition from '../MultipleLinesComposition.js';
import Palettes from '../../../Core/Color/Palettes.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

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
class PCIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

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
    public static defaultOptions: PCOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * Option for fill color between lines in Price channel Indicator.
         *
         * @sample {highstock} stock/indicators/indicator-area-fill
         *      background fill between lines
         *
         * @type {Highcharts.Color}
         * @apioption plotOptions.pc.fillColor
         *
         */
        /**
         * @excluding index
         */
        params: {
            index: void 0, // unchangeable index, do not inherit (#15362)
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
                lineColor: Palettes.colors[2],
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
                lineColor: Palettes.colors[8],
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as PCOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<PCPoint> = void 0 as any;
    public options: PCOptions = void 0 as any;
    public points: Array<PCPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: PCParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries> | undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            // 0- date, 1-top line, 2-middle line, 3-bottom line
            PC: Array<Array<number>> = [],
            // middle line, top line and bottom line
            low = 2,
            high = 1,
            xData: Array<number> = [],
            yData: Array<Array<number>> = [];

        let ML: number,
            TL: number,
            BL: number,
            date: number,
            slicedY: Array<Array<number>>,
            extremes: [number, number],
            i: number;

        if (yValLen < period) {
            return;
        }

        for (i = period; i <= yValLen; i++) {
            date = xVal[i - 1];
            slicedY = yVal.slice(i - period, i);
            extremes = AU.getArrayExtremes(slicedY, low as any, high as any);
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
 *  Class Prototype
 *
 * */

interface PCIndicator extends MultipleLinesComposition.IndicatorComposition {
    nameBase: string;
    nameComponents: Array<string>;
    pointArrayMap: Array<keyof PCPoint>;
    pointClass: typeof PCPoint;
    pointValKey: string;
}
extend(PCIndicator.prototype, {
    areaLinesNames: ['top', 'bottom'],
    nameBase: 'Price Channel',
    nameComponents: ['period'],
    linesApiNames: ['topLine', 'bottomLine'],
    pointArrayMap: ['top', 'middle', 'bottom'],
    pointValKey: 'middle'
});
MultipleLinesComposition.compose(PCIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        pc: typeof PCIndicator;
    }
}

SeriesRegistry.registerSeriesType('pc', PCIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default PCIndicator;

/* *
 *
 *  API Options
 *
 * */

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
