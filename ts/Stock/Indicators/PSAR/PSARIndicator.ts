/* *
 *
 *  Parabolic SAR indicator for Highcharts Stock
 *
 *  (c) 2010-2021 Grzegorz Blachliński
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
    PSAROptions,
    PSARParamsOptions
} from './PSAROptions';
import type PSARPoint from './PSARPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
/* *
 *
 *  Functions
 *
 * */

// Utils:

function toFixed(a: number, n: number): number {
    return parseFloat(a.toFixed(n));
}

function calculateDirection(
    previousDirection: number, low: number, high: number, PSAR: number
): number {
    if (
        (previousDirection === 1 && low > PSAR) ||
        (previousDirection === -1 && high > PSAR)
    ) {
        return 1;
    }
    return -1;
}

/* *
 * Method for calculating acceleration factor
 * dir - direction
 * pDir - previous Direction
 * eP - extreme point
 * pEP - previous extreme point
 * inc - increment for acceleration factor
 * maxAcc - maximum acceleration factor
 * initAcc - initial acceleration factor
 */
function getAccelerationFactor(
    dir: number,
    pDir: number,
    eP: number,
    pEP: number,
    pAcc: number,
    inc: number,
    maxAcc: number,
    initAcc: number
): number {
    if (dir === pDir) {
        if (dir === 1 && (eP > pEP)) {
            return (pAcc === maxAcc) ? maxAcc : toFixed(pAcc + inc, 2);
        }
        if (dir === -1 && (eP < pEP)) {
            return (pAcc === maxAcc) ? maxAcc : toFixed(pAcc + inc, 2);
        }
        return pAcc;
    }
    return initAcc;
}

function getExtremePoint(
    high: number,
    low: number,
    previousDirection: number,
    previousExtremePoint: number
): number {
    if (previousDirection === 1) {
        return (high > previousExtremePoint) ? high : previousExtremePoint;
    }
    return (low < previousExtremePoint) ? low : previousExtremePoint;
}

function getEPMinusPSAR(EP: number, PSAR: number): number {
    return EP - PSAR;
}

function getAccelerationFactorMultiply(
    accelerationFactor: number,
    EPMinusSAR: number
): number {
    return accelerationFactor * EPMinusSAR;
}

/* *
 * Method for calculating PSAR
 * pdir - previous direction
 * sDir - second previous Direction
 * PSAR - previous PSAR
 * pACCMultiply - previous acceleration factor multiply
 * sLow - second previous low
 * pLow - previous low
 * sHigh - second previous high
 * pHigh - previous high
 * pEP - previous extreme point
 */
function getPSAR(
    pdir: number,
    sDir: number,
    PSAR: number,
    pACCMulti: number,
    sLow: number,
    pLow: number,
    pHigh: number,
    sHigh: number,
    pEP: number
): number {
    if (pdir === sDir) {
        if (pdir === 1) {
            return (PSAR + pACCMulti < Math.min(sLow, pLow)) ?
                PSAR + pACCMulti :
                Math.min(sLow, pLow);
        }
        return (PSAR + pACCMulti > Math.max(sHigh, pHigh)) ?
            PSAR + pACCMulti :
            Math.max(sHigh, pHigh);
    }
    return pEP;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Parabolic SAR series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.psar
 *
 * @augments Highcharts.Series
 */
class PSARIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Parabolic SAR. This series requires `linkedTo`
     * option to be set and should be loaded
     * after `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/psar
     *         Parabolic SAR Indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/psar
     * @optionparent plotOptions.psar
     */
    public static defaultOptions: PSAROptions = merge(SMAIndicator.defaultOptions, {
        lineWidth: 0,
        marker: {
            enabled: true
        },
        states: {
            hover: {
                lineWidthPlus: 0
            }
        },
        /**
         * @excluding period
         */
        params: {
            period: void 0, // unchangeable period, do not inherit (#15362)
            /**
             * The initial value for acceleration factor.
             * Acceleration factor is starting with this value
             * and increases by specified increment each time
             * the extreme point makes a new high.
             * AF can reach a maximum of maxAccelerationFactor,
             * no matter how long the uptrend extends.
             */
            initialAccelerationFactor: 0.02,
            /**
             * The Maximum value for acceleration factor.
             * AF can reach a maximum of maxAccelerationFactor,
             * no matter how long the uptrend extends.
             */
            maxAccelerationFactor: 0.2,
            /**
             * Acceleration factor increases by increment each time
             * the extreme point makes a new high.
             *
             * @since 6.0.0
             */
            increment: 0.02,
            /**
             * Index from which PSAR is starting calculation
             *
             * @since 6.0.0
             */
            index: 2,
            /**
             * Number of maximum decimals that are used in PSAR calculations.
             *
             * @since 6.0.0
             */
            decimals: 4
        }
    } as PSAROptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<PSARPoint> = void 0 as any;
    public nameComponents: Array<string> = void 0 as any;
    public points: Array<PSARPoint> = void 0 as any;
    public options: PSAROptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: PSARParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            maxAccelerationFactor: number = (
                params.maxAccelerationFactor as any
            ),
            increment: number = (params.increment as any),
            // Set initial acc factor (for every new trend!)
            initialAccelerationFactor: number = (
                params.initialAccelerationFactor as any
            ),
            decimals: number = (params.decimals as any),
            index: number = (params.index as any),
            PSARArr: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let accelerationFactor: number = (
                params.initialAccelerationFactor as any
            ),
            direction: number,
            // Extreme point is the lowest low for falling and highest high
            // for rising psar - and we are starting with falling
            extremePoint: number = yVal[0][1],
            EPMinusPSAR: number,
            accelerationFactorMultiply: number,
            newDirection: number,
            previousDirection = 1,
            prevLow: number,
            prevPrevLow: number,
            prevHigh: number,
            prevPrevHigh: number,
            PSAR: number = yVal[0][2],
            newExtremePoint: number,
            high: number,
            low: number,
            ind: number;

        if (index >= yVal.length) {
            return;
        }

        for (ind = 0; ind < index; ind++) {
            extremePoint = Math.max(yVal[ind][1], extremePoint);
            PSAR = Math.min(yVal[ind][2], toFixed(PSAR, decimals));
        }

        direction = (yVal[ind][1] > PSAR) ? 1 : -1;
        EPMinusPSAR = getEPMinusPSAR(extremePoint, PSAR);
        accelerationFactor = (params.initialAccelerationFactor as any);
        accelerationFactorMultiply = getAccelerationFactorMultiply(
            accelerationFactor,
            EPMinusPSAR
        );

        PSARArr.push([xVal[index], PSAR]);
        xData.push(xVal[index]);
        yData.push(toFixed(PSAR, decimals));

        for (ind = index + 1; ind < yVal.length; ind++) {

            prevLow = yVal[ind - 1][2];
            prevPrevLow = yVal[ind - 2][2];
            prevHigh = yVal[ind - 1][1];
            prevPrevHigh = yVal[ind - 2][1];
            high = yVal[ind][1];
            low = yVal[ind][2];

            // Null points break PSAR
            if (
                prevPrevLow !== null &&
                prevPrevHigh !== null &&
                prevLow !== null &&
                prevHigh !== null &&
                high !== null &&
                low !== null
            ) {
                PSAR = getPSAR(
                    direction,
                    previousDirection,
                    PSAR,
                    accelerationFactorMultiply,
                    prevPrevLow,
                    prevLow,
                    prevHigh,
                    prevPrevHigh,
                    extremePoint
                );


                newExtremePoint = getExtremePoint(
                    high,
                    low,
                    direction,
                    extremePoint
                );
                newDirection = calculateDirection(
                    previousDirection,
                    low,
                    high,
                    PSAR
                );
                accelerationFactor = getAccelerationFactor(
                    newDirection,
                    direction,
                    newExtremePoint,
                    extremePoint,
                    accelerationFactor,
                    increment,
                    maxAccelerationFactor,
                    initialAccelerationFactor
                );

                EPMinusPSAR = getEPMinusPSAR(newExtremePoint, PSAR);
                accelerationFactorMultiply = getAccelerationFactorMultiply(
                    accelerationFactor,
                    EPMinusPSAR
                );
                PSARArr.push([xVal[ind], toFixed(PSAR, decimals)]);
                xData.push(xVal[ind]);
                yData.push(toFixed(PSAR, decimals));

                previousDirection = direction;
                direction = newDirection;
                extremePoint = newExtremePoint;
            }
        }
        return {
            values: PSARArr,
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

interface PSARIndicator {
    pointClass: typeof PSARPoint;
    nameComponents: Array<string>;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        psar: typeof PSARIndicator;
    }
}

SeriesRegistry.registerSeriesType('psar', PSARIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default PSARIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `PSAR` series. If the [type](#series.psar.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.psar
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/psar
 * @apioption series.psar
 */

''; // to include the above in the js output
