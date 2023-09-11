/* *
 *  (c) 2010-2021 Rafal Sebestjanski
 *
 *  Directional Movement Index (DMI) indicator for Highcharts Stock
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
    DMIOptions,
    DMIParamsOptions
} from './DMIOptions';
import type DMIPoint from './DMIPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import MultipleLinesComposition from '../MultipleLinesComposition.js';
import { Palette } from '../../../Core/Color/Palettes.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
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
 * The Directional Movement Index (DMI) series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.dmi
 *
 * @augments Highcharts.Series
 */
class DMIIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Directional Movement Index (DMI).
     * This series requires the `linkedTo` option to be set and should
     * be loaded after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/dmi
     *         DMI indicator
     *
     * @extends      plotOptions.sma
     * @since 9.1.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/dmi
     * @optionparent plotOptions.dmi
     */
    public static defaultOptions: DMIOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index
         */
        params: {
            index: void 0 // unused index, do not inherit (#15362)
        },
        marker: {
            enabled: false
        },
        tooltip: {
            pointFormat: '<span style="color: {point.color}">' +
                '\u25CF</span><b> {series.name}</b><br/>' +
                '<span style="color: {point.color}">DX</span>: {point.y}<br/>' +
                '<span style="color: ' +
                '{point.series.options.plusDILine.styles.lineColor}">' +
                    '+DI</span>: {point.plusDI}<br/>' +
                '<span style="color: ' +
                '{point.series.options.minusDILine.styles.lineColor}">' +
                    '-DI</span>: {point.minusDI}<br/>'
        },
        /**
         * +DI line options.
         */
        plusDILine: {
            /**
             * Styles for the +DI line.
             */
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line.
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: Palette.positiveColor // green-ish
            }
        },
        /**
         * -DI line options.
         */
        minusDILine: {
            /**
             * Styles for the -DI line.
             */
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line.
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: Palette.negativeColor // red-ish
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
    } as DMIOptions);

    /* *
     *
     *  Properties
     *
     * */

    public options: DMIOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public calculateDM(
        yVal: Array<Array<number>>,
        i: number,
        isPositiveDM?: boolean
    ): number {
        const currentHigh = yVal[i][1],
            currentLow = yVal[i][2],
            previousHigh = yVal[i - 1][1],
            previousLow = yVal[i - 1][2];

        let DM: number;

        if (currentHigh - previousHigh > previousLow - currentLow) {
            // for +DM
            DM = isPositiveDM ? Math.max(currentHigh - previousHigh, 0) : 0;
        } else {
            // for -DM
            DM = !isPositiveDM ? Math.max(previousLow - currentLow, 0) : 0;
        }

        return correctFloat(DM);
    }

    public calculateDI(
        smoothedDM: number,
        tr: number
    ): number {
        return smoothedDM / tr * 100;
    }

    public calculateDX(
        plusDI: number,
        minusDI: number
    ): number {
        return correctFloat(
            Math.abs(plusDI - minusDI) / Math.abs(plusDI + minusDI) * 100
        );
    }

    public smoothValues(
        accumulatedValues: number,
        currentValue: number,
        period: number
    ): number {
        return correctFloat(
            accumulatedValues - accumulatedValues / period + currentValue
        );
    }

    public getTR(
        currentPoint: Array<number>,
        prevPoint?: Array<number>
    ): number {
        return correctFloat(
            Math.max(
                // currentHigh - currentLow
                currentPoint[1] - currentPoint[2],
                // currentHigh - previousClose
                !prevPoint ? 0 : Math.abs(currentPoint[1] - prevPoint[3]),
                // currentLow - previousClose
                !prevPoint ? 0 : Math.abs(currentPoint[2] - prevPoint[3])
            )
        );
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: DMIParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            DMI: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<Array<number>> = [];

        if (
            // Check period, if bigger than points length, skip
            (xVal.length <= period) ||
            // Only ohlc data is valid
            !isArray(yVal[0]) ||
            yVal[0].length !== 4
        ) {
            return;
        }

        let prevSmoothedPlusDM: number = 0,
            prevSmoothedMinusDM: number = 0,
            prevSmoothedTR: number = 0,
            i: number;

        for (i = 1; i < yValLen; i++) {
            let smoothedPlusDM: number,
                smoothedMinusDM: number,
                smoothedTR: number,
                plusDM: number, // +DM
                minusDM: number, // -DM
                TR: number,
                plusDI: number, // +DI
                minusDI: number, // -DI
                DX: number;

            if (i <= period) {
                plusDM = this.calculateDM(yVal, i, true);
                minusDM = this.calculateDM(yVal, i);
                TR = this.getTR(yVal[i], yVal[i - 1]);
                // Accumulate first period values to smooth them later
                prevSmoothedPlusDM += plusDM;
                prevSmoothedMinusDM += minusDM;
                prevSmoothedTR += TR;

                // Get all values for the first point
                if (i === period) {
                    plusDI = this.calculateDI(
                        prevSmoothedPlusDM,
                        prevSmoothedTR
                    );
                    minusDI = this.calculateDI(
                        prevSmoothedMinusDM,
                        prevSmoothedTR
                    );
                    DX = this.calculateDX(
                        prevSmoothedPlusDM,
                        prevSmoothedMinusDM
                    );

                    DMI.push([xVal[i], DX, plusDI, minusDI]);
                    xData.push(xVal[i]);
                    yData.push([DX, plusDI, minusDI]);
                }
            } else {
                // Calculate current values
                plusDM = this.calculateDM(yVal, i, true);
                minusDM = this.calculateDM(yVal, i);
                TR = this.getTR(yVal[i], yVal[i - 1]);
                // Smooth +DM, -DM and TR
                smoothedPlusDM = this.smoothValues(
                    prevSmoothedPlusDM,
                    plusDM,
                    period
                );
                smoothedMinusDM = this.smoothValues(
                    prevSmoothedMinusDM,
                    minusDM,
                    period
                );
                smoothedTR = this.smoothValues(
                    prevSmoothedTR,
                    TR,
                    period
                );
                // Save current smoothed values for the next step
                prevSmoothedPlusDM = smoothedPlusDM;
                prevSmoothedMinusDM = smoothedMinusDM;
                prevSmoothedTR = smoothedTR;

                // Get all next points (except the first one calculated above)
                plusDI = this.calculateDI(
                    prevSmoothedPlusDM,
                    prevSmoothedTR
                );
                minusDI = this.calculateDI(
                    prevSmoothedMinusDM,
                    prevSmoothedTR
                );
                DX = this.calculateDX(
                    prevSmoothedPlusDM,
                    prevSmoothedMinusDM
                );

                DMI.push([xVal[i], DX, plusDI, minusDI]);
                xData.push(xVal[i]);
                yData.push([DX, plusDI, minusDI]);
            }
        }

        return {
            values: DMI,
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

interface DMIIndicator extends MultipleLinesComposition.IndicatorComposition {
    nameBase: string;
    pointArrayMap: Array<keyof DMIPoint>;
    parallelArrays: Array<string>;
    pointValKey: string;
    linesApiNames: Array<string>;
    pointClass: typeof DMIPoint;
}
extend(DMIIndicator.prototype, {
    areaLinesNames: [],
    nameBase: 'DMI',
    linesApiNames: ['plusDILine', 'minusDILine'],
    pointArrayMap: ['y', 'plusDI', 'minusDI'],
    parallelArrays: ['x', 'y', 'plusDI', 'minusDI'],
    pointValKey: 'y'
});
MultipleLinesComposition.compose(DMIIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        dmi: typeof DMIIndicator;
    }
}
SeriesRegistry.registerSeriesType('dmi', DMIIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default DMIIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * The Directional Movement Index (DMI) indicator series.
 * If the [type](#series.dmi.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.dmi
 * @since 9.1.0
 * @product   highstock
 * @excluding allAreas, colorAxis,  dataParser, dataURL, joinBy, keys,
 *            navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/dmi
 * @apioption series.dmi
 */

''; // to include the above in the js output
