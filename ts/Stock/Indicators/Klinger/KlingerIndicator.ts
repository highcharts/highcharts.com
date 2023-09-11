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
    KlingerOptions,
    KlingerParamsOptions
} from './KlingerOptions';
import type KlingerPoint from './KlingerPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import MultipleLinesComposition from '../MultipleLinesComposition.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    ema: EMAIndicator,
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import error from '../../../Shared/Helpers/Error.js';
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
 * The Klinger oscillator series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.klinger
 *
 * @augments Highcharts.Series
 */
class KlingerIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Klinger oscillator. This series requires the `linkedTo` option to be set
     * and should be loaded after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/klinger
     *         Klinger oscillator
     *
     * @extends      plotOptions.sma
     * @since 9.1.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/klinger
     * @optionparent plotOptions.klinger
     */
    public static defaultOptions: KlingerOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * Paramters used in calculation of Klinger Oscillator.
         *
         * @excluding index, period
         */
        params: {
            /**
             * The fast period for indicator calculations.
             */
            fastAvgPeriod: 34,
            /**
             * The slow period for indicator calculations.
             */
            slowAvgPeriod: 55,
            /**
             * The base period for signal calculations.
             */
            signalPeriod: 13,
            /**
             * The id of another series to use its data as volume data for the
             * indiator calculation.
             */
            volumeSeriesID: 'volume'
        },
        signalLine: {
            /**
             * Styles for a signal line.
             */
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line. If not set, it's inherited from
                 * [plotOptions.klinger.color
                 * ](#plotOptions.klinger.color).
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: '#ff0000'
            }
        },
        dataGrouping: {
            approximation: 'averages'
        },
        tooltip: {
            pointFormat: '<span style="color: {point.color}">\u25CF</span>' +
                '<b> {series.name}</b><br/>' +
                '<span style="color: {point.color}">Klinger</span>: ' +
                '{point.y}<br/>' +
                '<span style="color: ' +
                '{point.series.options.signalLine.styles.lineColor}">' +
                    'Signal</span>' +
                    ': {point.signal}<br/>'
        }
    } as KlingerOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<KlingerPoint> = void 0 as any;
    public points: Array<KlingerPoint> = void 0 as any;
    public options: KlingerOptions = void 0 as any;
    public volumeSeries: LineSeries = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public calculateTrend(
        this: KlingerIndicator,
        yVal: (Array<Array<number>>),
        i: number
    ): number {
        const isUpward = yVal[i][1] + yVal[i][2] + yVal[i][3] >
            yVal[i - 1][1] + yVal[i - 1][2] + yVal[i - 1][3];

        return isUpward ? 1 : -1;
    }

    // Checks if the series and volumeSeries are accessible, number of
    // points.x is longer than period, is series has OHLC data
    public isValidData(
        this: KlingerIndicator,
        firstYVal: Array<number>
    ): boolean {
        const chart = this.chart,
            options: KlingerOptions = this.options,
            series = this.linkedParent,
            isSeriesOHLC: boolean = isArray(firstYVal) &&
                firstYVal.length === 4,
            volumeSeries =
                this.volumeSeries ||
                (
                    this.volumeSeries =
                    chart.get((options.params as any).volumeSeriesID) as any
                );

        if (!volumeSeries) {
            error(
                'Series ' +
                (options.params as any).volumeSeriesID +
                ' not found! Check `volumeSeriesID`.',
                true,
                series.chart
            );
        }

        const isLengthValid = [series, volumeSeries].every(
            function (series): boolean|undefined {
                return series && series.xData && series.xData.length >=
                (options.params as any).slowAvgPeriod;
            });

        return !!(isLengthValid && isSeriesOHLC);
    }

    public getCM(
        previousCM: number,
        DM: number,
        trend: number,
        previousTrend: number,
        prevoiusDM: number
    ): number {
        return correctFloat(
            DM + (trend === previousTrend ? previousCM : prevoiusDM)
        );
    }

    public getDM(
        high: number,
        low: number
    ): number {
        return correctFloat(high - low);
    }

    public getVolumeForce(yVal: Array<Array<number>>): Array<Array<number>> {
        const volumeForce: Array<Array<number>> = [];

        let CM: number = 0, // cumulative measurement
            DM: number, // daily measurement
            force: number,
            i: number = 1, // start from second point
            previousCM: number = 0,
            previousDM: number = yVal[0][1] - yVal[0][2], // initial DM
            previousTrend: number = 0,
            trend: number;

        for (i; i < yVal.length; i++) {
            trend = this.calculateTrend(yVal, i);
            DM = this.getDM(yVal[i][1], yVal[i][2]);
            // For the first iteration when the previousTrend doesn't exist,
            // previousCM doesn't exist either, but it doesn't matter becouse
            // it's filltered out in the getCM method in else statement,
            // (in this iteration, previousCM can be raplaced with the DM).
            CM = this.getCM(previousCM, DM, trend, previousTrend, previousDM);

            force = (this.volumeSeries.yData as any)[i] *
                trend * Math.abs(2 * ((DM / CM) - 1)) * 100;
            volumeForce.push([force]);

            // Before next iteration, assign the current as the previous.
            previousTrend = trend;
            previousCM = CM;
            previousDM = DM;
        }
        return volumeForce;
    }

    public getEMA(
        yVal: (Array<number>|Array<Array<number>>),
        prevEMA: (number|undefined),
        SMA: number,
        EMApercent: number,
        index?: number,
        i?: number,
        xVal?: Array<number>
    ): [number, number] {

        return EMAIndicator.prototype.calculateEma(
            xVal || [],
            yVal,
            typeof i === 'undefined' ? 1 : i,
            EMApercent,
            prevEMA,
            typeof index === 'undefined' ? -1 : index,
            SMA
        );
    }

    public getSMA(
        period: number,
        index: number,
        values: Array<Array<number>>
    ): number {

        return EMAIndicator.prototype
            .accumulatePeriodPoints(period, index, values) / period;
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: KlingerParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const Klinger: Array<Array<number>> = [],
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            xData: Array<number> = [],
            yData: Array<Array<number>> = [],
            calcSingal: Array<number> = [];

        let KO: number,
            i: number = 0,
            fastEMA: number = 0,
            slowEMA: number,
            // signalEMA: number|undefined = void 0,
            previousFastEMA: number | undefined = void 0,
            previousSlowEMA: number | undefined = void 0,
            signal: any = null;

        // If the necessary conditions are not fulfilled, don't proceed.
        if (!this.isValidData(yVal[0])) {
            return;
        }

        // Calculate the Volume Force array.
        const volumeForce: Array<Array<number>> = this.getVolumeForce(yVal);

        // Calculate SMA for the first points.
        const SMAFast = this.getSMA(params.fastAvgPeriod, 0, volumeForce),
            SMASlow = this.getSMA(params.slowAvgPeriod, 0, volumeForce);

        // Calculate EMApercent for the first points.
        const fastEMApercent = 2 / (params.fastAvgPeriod + 1),
            slowEMApercent = 2 / (params.slowAvgPeriod + 1);

        // Calculate KO
        for (i; i < yVal.length; i++) {

            // Get EMA for fast period.
            if (i >= params.fastAvgPeriod) {
                fastEMA = this.getEMA(
                    volumeForce,
                    previousFastEMA,
                    SMAFast,
                    fastEMApercent,
                    0,
                    i,
                    xVal
                )[1];
                previousFastEMA = fastEMA;
            }

            // Get EMA for slow period.
            if (i >= params.slowAvgPeriod) {
                slowEMA = this.getEMA(
                    volumeForce,
                    previousSlowEMA,
                    SMASlow,
                    slowEMApercent,
                    0,
                    i,
                    xVal
                )[1];
                previousSlowEMA = slowEMA;
                KO = correctFloat(fastEMA - slowEMA);
                calcSingal.push(KO);

                // Calculate signal SMA
                if (calcSingal.length >= params.signalPeriod) {
                    signal = calcSingal.slice(-params.signalPeriod)
                        .reduce((prev, curr): number =>
                            prev + curr) / params.signalPeriod;
                }

                Klinger.push([xVal[i], KO, signal]);
                xData.push(xVal[i]);
                yData.push([KO, signal]);
            }
        }

        return {
            values: Klinger,
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

interface KlingerIndicator extends MultipleLinesComposition.IndicatorComposition {
    linesApiNames: Array<string>;
    nameBase: string;
    nameComponents: Array<string>;
    parallelArrays: Array<string>;
    pointArrayMap: Array<keyof KlingerPoint>;
    pointClass: typeof KlingerPoint;
    pointValKey: string;
}
extend(KlingerIndicator.prototype, {
    areaLinesNames: [],
    linesApiNames: ['signalLine'],
    nameBase: 'Klinger',
    nameComponents: ['fastAvgPeriod', 'slowAvgPeriod'],
    pointArrayMap: ['y', 'signal'],
    parallelArrays: ['x', 'y', 'signal'],
    pointValKey: 'y'
});
MultipleLinesComposition.compose(KlingerIndicator);

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        klinger: typeof KlingerIndicator;
    }
}
SeriesRegistry.registerSeriesType('klinger', KlingerIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default KlingerIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A Klinger oscillator. If the [type](#series.klinger.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.klinger
 * @since 9.1.0
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/klinger
 * @apioption series.klinger
 */

''; // to include the above in the js output
