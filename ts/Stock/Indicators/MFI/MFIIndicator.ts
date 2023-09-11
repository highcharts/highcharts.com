/* *
 *
 *  Money Flow Index indicator for Highcharts Stock
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
    MFIOptions,
    MFIParamsOptions
} from '../MFI/MFIOptions';
import type MFIPoint from './MFIPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
import error from '../../../Shared/Helpers/Error.js';
const { isArray } = TC;
const { extend, merge } = OH;

/* *
 *
 *  Functions
 *
 * */

// Utils:
function sumArray(array: Array<number>): number {

    return array.reduce(function (prev: number, cur: number): number {
        return prev + cur;
    });
}

function toFixed(a: number, n: number): number {
    return parseFloat(a.toFixed(n));
}

function calculateTypicalPrice(point: Array<number>): number {
    return (point[1] + point[2] + point[3]) / 3;
}

function calculateRawMoneyFlow(typicalPrice: number, volume: number): number {
    return typicalPrice * volume;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The MFI series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.mfi
 *
 * @augments Highcharts.Series
 */
class MFIIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Money Flow Index. This series requires `linkedTo` option to be set and
     * should be loaded after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/mfi
     *         Money Flow Index Indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/mfi
     * @optionparent plotOptions.mfi
     */
    public static defaultOptions: MFIOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index
         */
        params: {
            index: void 0, // unchangeable index, do not inherit (#15362)
            /**
             * The id of volume series which is mandatory.
             * For example using OHLC data, volumeSeriesID='volume' means
             * the indicator will be calculated using OHLC and volume values.
             */
            volumeSeriesID: 'volume',
            /**
             * Number of maximum decimals that are used in MFI calculations.
             */
            decimals: 4

        }
    } as MFIOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<MFIPoint> = void 0 as any;
    public options: MFIOptions = void 0 as any;
    public points: Array<MFIPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: MFIParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries> | undefined) {
        const period: number = (params.period as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            decimals: number = (params.decimals as any),
            volumeSeries: (LineSeries | undefined) = (
                series.chart.get((params.volumeSeriesID as any)) as any
            ),
            yValVolume: Array<number> = (
                volumeSeries && (volumeSeries.yData as any)
            ),
            MFI: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [],
            positiveMoneyFlow: Array<number> = [],
            negativeMoneyFlow: Array<number> = [];

        let newTypicalPrice: number,
            oldTypicalPrice: number,
            rawMoneyFlow: number,
            negativeMoneyFlowSum: number,
            positiveMoneyFlowSum: number,
            moneyFlowRatio: number,
            MFIPoint: number,
            i: number,
            isUp = false,
            // MFI starts calculations from the second point
            // Cause we need to calculate change between two points
            range = 1;

        if (!volumeSeries) {
            error(
                'Series ' +
                params.volumeSeriesID +
                ' not found! Check `volumeSeriesID`.',
                true,
                series.chart
            );
            return;
        }

        // MFI requires high low and close values
        if (
            (xVal.length <= period) || !isArray(yVal[0]) ||
            yVal[0].length !== 4 ||
            !yValVolume
        ) {
            return;
        }

        // Calculate first typical price
        newTypicalPrice = calculateTypicalPrice(yVal[range]);

        // Accumulate first N-points
        while (range < period + 1) {
            // Calculate if up or down
            oldTypicalPrice = newTypicalPrice;
            newTypicalPrice = calculateTypicalPrice(yVal[range]);
            isUp = newTypicalPrice >= oldTypicalPrice;
            // Calculate raw money flow
            rawMoneyFlow = calculateRawMoneyFlow(
                newTypicalPrice,
                yValVolume[range]
            );
            // Add to array
            positiveMoneyFlow.push(isUp ? rawMoneyFlow : 0);
            negativeMoneyFlow.push(isUp ? 0 : rawMoneyFlow);
            range++;
        }
        for (i = range - 1; i < yValLen; i++) {
            if (i > range - 1) {
                // Remove first point from array
                positiveMoneyFlow.shift();
                negativeMoneyFlow.shift();
                // Calculate if up or down
                oldTypicalPrice = newTypicalPrice;
                newTypicalPrice = calculateTypicalPrice(yVal[i]);
                isUp = newTypicalPrice > oldTypicalPrice;
                // Calculate raw money flow
                rawMoneyFlow = calculateRawMoneyFlow(
                    newTypicalPrice,
                    yValVolume[i]
                );
                // Add to array
                positiveMoneyFlow.push(isUp ? rawMoneyFlow : 0);
                negativeMoneyFlow.push(isUp ? 0 : rawMoneyFlow);
            }

            // Calculate sum of negative and positive money flow:
            negativeMoneyFlowSum = sumArray(negativeMoneyFlow);
            positiveMoneyFlowSum = sumArray(positiveMoneyFlow);

            moneyFlowRatio = positiveMoneyFlowSum / negativeMoneyFlowSum;
            MFIPoint = toFixed(
                100 - (100 / (1 + moneyFlowRatio)),
                decimals
            );
            MFI.push([xVal[i], MFIPoint]);
            xData.push(xVal[i]);
            yData.push(MFIPoint);
        }

        return {
            values: MFI,
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

interface MFIIndicator {
    nameBase: string;
    pointClass: typeof MFIPoint;
}

extend(MFIIndicator.prototype, {
    nameBase: 'Money Flow Index'
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        mfi: typeof MFIIndicator;
    }
}

SeriesRegistry.registerSeriesType('mfi', MFIIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default MFIIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `MFI` series. If the [type](#series.mfi.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.mfi
 * @since     6.0.0
 * @excluding dataParser, dataURL
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/mfi
 * @apioption series.mfi
 */

''; // to include the above in the js output
