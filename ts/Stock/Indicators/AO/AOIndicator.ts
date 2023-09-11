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

import type AOOptions from './AOOptions';
import type AOPoint from './AOPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import H from '../../../Core/Globals.js';
const { noop } = H;
import { Palette } from '../../../Core/Color/Palettes.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    column: {
        prototype: columnProto
    },
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
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
 * The AO series type
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.ao
 *
 * @augments Highcharts.Series
 */
class AOIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Awesome Oscillator. This series requires the `linkedTo` option to
     * be set and should be loaded after the `stock/indicators/indicators.js`
     *
     * @sample {highstock} stock/indicators/ao
     *         Awesome
     *
     * @extends      plotOptions.sma
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               params, pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/ao
     * @optionparent plotOptions.ao
     */
    public static defaultOptions: AOOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            // Index and period are unchangeable, do not inherit (#15362)
            index: void 0,
            period: void 0
        },
        /**
         * Color of the Awesome oscillator series bar that is greater than the
         * previous one. Note that if a `color` is defined, the `color`
         * takes precedence and the `greaterBarColor` is ignored.
         *
         * @sample {highstock} stock/indicators/ao/
         *         greaterBarColor
         *
         * @type  {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since 7.0.0
         */
        greaterBarColor: Palette.positiveColor,
        /**
         * Color of the Awesome oscillator series bar that is lower than the
         * previous one. Note that if a `color` is defined, the `color`
         * takes precedence and the `lowerBarColor` is ignored.
         *
         * @sample {highstock} stock/indicators/ao/
         *         lowerBarColor
         *
         * @type  {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since 7.0.0
         */
        lowerBarColor: Palette.negativeColor,
        threshold: 0,
        groupPadding: 0.2,
        pointPadding: 0.2,
        crisp: false,
        states: {
            hover: {
                halo: {
                    size: 0
                }
            }
        }
    } as AOOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<AOPoint> = void 0 as any;
    public options: AOOptions = void 0 as any;
    public points: Array<AOPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public drawGraph(this: AOIndicator): void {
        const indicator = this,
            options = indicator.options,
            points = indicator.points,
            userColor = indicator.userOptions.color,
            positiveColor = options.greaterBarColor,
            negativeColor = options.lowerBarColor,
            firstPoint = points[0];
        let i;

        if (!userColor && firstPoint) {
            firstPoint.color = positiveColor;

            for (i = 1; i < points.length; i++) {
                if ((points[i] as any).y > (points[i - 1] as any).y) {
                    points[i].color = positiveColor;
                } else if (
                    (points[i] as any).y < (points[i - 1] as any).y
                ) {
                    points[i].color = negativeColor;
                } else {
                    points[i].color = points[i - 1].color;
                }
            }
        }
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const shortPeriod = 5,
            longPeriod = 34,
            xVal: Array<number> = series.xData || [],
            yVal: Array<number|null|undefined> =
                (series.yData as any) || [],
            yValLen: number = yVal.length,
            AO: Array<Array<number>> = [], // 0- date, 1- Awesome Oscillator
            xData: Array<number> = [],
            yData: Array<number> = [],
            high = 1,
            low = 2;
        let shortSMA: number, // Shorter Period SMA
            longSMA: number, // Longer Period SMA
            awesome: number,
            shortLastIndex: number,
            longLastIndex: number,
            price: number,
            i: number,
            j: number,
            longSum = 0,
            shortSum = 0;

        if (
            xVal.length <= longPeriod ||
            !isArray(yVal[0]) ||
            yVal[0].length !== 4
        ) {
            return;
        }

        for (i = 0; i < longPeriod - 1; i++) {
            price = ((yVal[i] as any)[high] + (yVal[i] as any)[low]) / 2;
            if (i >= longPeriod - shortPeriod) {
                shortSum = correctFloat(shortSum + price);
            }
            longSum = correctFloat(longSum + price);
        }

        for (j = longPeriod - 1; j < yValLen; j++) {
            price = ((yVal[j] as any)[high] + (yVal[j] as any)[low]) / 2;
            shortSum = correctFloat(shortSum + price);
            longSum = correctFloat(longSum + price);

            shortSMA = shortSum / shortPeriod;
            longSMA = longSum / longPeriod;

            awesome = correctFloat(shortSMA - longSMA);

            AO.push([xVal[j], awesome]);
            xData.push(xVal[j]);
            yData.push(awesome);

            shortLastIndex = j + 1 - shortPeriod;
            longLastIndex = j + 1 - longPeriod;

            shortSum = correctFloat(
                shortSum -
                (
                    (yVal[shortLastIndex] as any)[high] +
                    (yVal[shortLastIndex] as any)[low]
                ) / 2
            );
            longSum = correctFloat(
                longSum -
                (
                    (yVal[longLastIndex] as any)[high] +
                    (yVal[longLastIndex] as any)[low]
                ) / 2
            );
        }


        return {
            values: AO,
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

interface AOIndicator {
    nameBase: string;
    nameComponents: Array<string>;
    pointClass: typeof AOPoint;
    crispCol: typeof columnProto.crispCol;
    drawPoints: typeof columnProto.drawPoints;
    getColumnMetrics: typeof columnProto.getColumnMetrics;
    translate: typeof columnProto.translate;
}

extend(AOIndicator.prototype, {
    nameBase: 'AO',
    nameComponents: (false as any),

    // Columns support:
    markerAttribs: noop as any,
    getColumnMetrics: columnProto.getColumnMetrics,
    crispCol: columnProto.crispCol,
    translate: columnProto.translate,
    drawPoints: columnProto.drawPoints
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        ao: typeof AOIndicator;
    }
}

SeriesRegistry.registerSeriesType('ao', AOIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default AOIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * An `AO` series. If the [type](#series.ao.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.ao
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, dataParser, dataURL, joinBy, keys,
 *            navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/ao
 * @apioption series.ao
 */

''; // for including the above in the doclets
