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
    AroonOptions,
    AroonParamsOptions
} from '../Aroon/AroonOptions';
import type AroonPoint from '../Aroon/AroonPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import MultipleLinesComposition from '../MultipleLinesComposition.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Core/Utilities.js';
const {
    extend,
    merge,
    pick
} = U;

/* *
 *
 *  Functions
 *
 * */

// Utils

// Index of element with extreme value from array (min or max)
/**
 * @private
 */
function getExtremeIndexInArray(arr: Array<number>, extreme: string): number {
    let extremeValue = arr[0],
        valueIndex = 0,
        i: (number|undefined);

    for (i = 1; i < arr.length; i++) {
        if (
            extreme === 'max' && arr[i] >= extremeValue ||
            extreme === 'min' && arr[i] <= extremeValue
        ) {
            extremeValue = arr[i];
            valueIndex = i;
        }
    }

    return valueIndex;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Aroon series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.aroon
 *
 * @augments Highcharts.Series
 */
class AroonIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Aroon. This series requires the `linkedTo` option to be
     * set and should be loaded after the `stock/indicators/indicators.js`.
     *
     * @sample {highstock} stock/indicators/aroon
     *         Aroon
     *
     * @extends      plotOptions.sma
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, compare, compareBase, joinBy, keys,
     *               navigatorOptions, pointInterval, pointIntervalUnit,
     *               pointPlacement, pointRange, pointStart, showInNavigator,
     *               stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/aroon
     * @optionparent plotOptions.aroon
     */
    public static defaultOptions: AroonOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * Paramters used in calculation of aroon series points.
         *
         * @excluding index
         */
        params: {
            index: void 0, // unchangeable index, do not inherit (#15362)
            period: 25
        },
        marker: {
            enabled: false
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b><br/>Aroon Up: {point.y}<br/>Aroon Down: {point.aroonDown}<br/>'
        },
        /**
         * aroonDown line options.
         */
        aroonDown: {
            /**
             * Styles for an aroonDown line.
             */
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line. If not set, it's inherited from
                 * [plotOptions.aroon.color](#plotOptions.aroon.color).
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as AroonOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<AroonPoint> = void 0 as any;

    public options: AroonOptions = void 0 as any;

    public points: Array<AroonPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: AroonParamsOptions
    ): IndicatorValuesObject<TLinkedSeries> {
        const period = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen = yVal ? yVal.length : 0,
            // 0- date, 1- Aroon Up, 2- Aroon Down
            AR: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<Array<number>> = [],
            low = 2,
            high = 1;
        let aroonUp: number,
            aroonDown: number,
            xLow: number,
            xHigh: number,
            i: number,
            slicedY: Array<Array<number>>;

        // For a N-period, we start from N-1 point, to calculate Nth point
        // That is why we later need to comprehend slice() elements list
        // with (+1)
        for (i = period - 1; i < yValLen; i++) {
            slicedY = yVal.slice(i - period + 1, i + 2);

            xLow = getExtremeIndexInArray(slicedY.map(
                function (elem): number {
                    return pick(elem[low], (elem as any));
                }
            ), 'min');

            xHigh = getExtremeIndexInArray(slicedY.map(
                function (elem): number {
                    return pick(elem[high], (elem as any));
                }
            ), 'max');

            aroonUp = (xHigh / period) * 100;
            aroonDown = (xLow / period) * 100;

            if (xVal[i + 1]) {
                AR.push([xVal[i + 1], aroonUp, aroonDown]);
                xData.push(xVal[i + 1]);
                yData.push([aroonUp, aroonDown]);
            }
        }

        return {
            values: AR,
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

interface AroonIndicator extends MultipleLinesComposition.IndicatorComposition {
    linesApiNames: Array<string>;
    nameComponents: Array<string>;
    pointArrayMap: Array<keyof AroonPoint>;
    pointValKey: string;
    pointClass: typeof AroonPoint;
}
extend(AroonIndicator.prototype, {
    areaLinesNames: [],
    linesApiNames: ['aroonDown'],
    nameBase: 'Aroon',
    pointArrayMap: ['y', 'aroonDown'],
    pointValKey: 'y'
});
MultipleLinesComposition.compose(AroonIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        aroon: typeof AroonIndicator;
    }
}

SeriesRegistry.registerSeriesType('aroon', AroonIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default AroonIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A Aroon indicator. If the [type](#series.aroon.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.aroon
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, compare, compareBase, dataParser, dataURL,
 *            joinBy, keys, navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/aroon
 * @apioption series.aroon
 */

''; // to avoid removal of the above jsdoc
