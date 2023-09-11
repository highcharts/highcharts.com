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
import type { CMOOptions, CMOParamsOptions } from './CMOOptions';
import type CMOPoint from './CMOPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;

/* *
 *
 *  Class
 *
 * */

/**
 * The CMO series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.cmo
 *
 * @augments Highcharts.Series
 */
class CMOIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Chande Momentum Oscilator (CMO) technical indicator. This series
     * requires the `linkedTo` option to be set and should be loaded after
     * the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/cmo
     *         CMO indicator
     *
     * @extends      plotOptions.sma
     * @since 9.1.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/cmo
     * @optionparent plotOptions.cmo
     */
    public static defaultOptions: CMOOptions = merge(
        SMAIndicator.defaultOptions,
        {
            params: {
                period: 20,
                index: 3
            }
        } as CMOOptions
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<CMOPoint> = void 0 as any;
    public options: CMOOptions = void 0 as any;
    public points: Array<CMOPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: CMOParamsOptions
    ): IndicatorValuesObject<TLinkedSeries> | undefined {
        const period = params.period as any,
            xVal: Array<number> = series.xData as any,
            yVal: Array<number> | Array<Array<number>> = series.yData as any,
            yValLen: number = yVal ? yVal.length : 0,
            CMO: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];
        let i: number,
            index = params.index as number,
            values: Array<number>;

        if (xVal.length < period) {
            return;
        }

        if (isNumber(yVal[0])) {
            values = yVal as Array<number>;
        } else {
            // In case of the situation, where the series type has data length
            // shorter then 4 (HLC, range), this ensures that we are not trying
            // to reach the index out of bounds
            index = Math.min(index, yVal[0].length - 1);
            values = (yVal as Array<Array<number>>).map(
                (value: Array<number>): number => value[index]
            );
        }

        let firstAddedSum = 0,
            sumOfHigherValues = 0,
            sumOfLowerValues = 0,
            y;
        // Calculate first point, check if the first value
        // was added to sum of higher/lower values, and what was the value.

        for (let j = period; j > 0; j--) {
            if (values[j] > values[j - 1]) {
                sumOfHigherValues += values[j] - values[j - 1];
            } else if (values[j] < values[j - 1]) {
                sumOfLowerValues += values[j - 1] - values[j];
            }
        }
        // You might devide by 0 if all values are equal,
        // so return 0 in this case.
        y =
            sumOfHigherValues + sumOfLowerValues > 0 ?
                (100 * (sumOfHigherValues - sumOfLowerValues)) /
                (sumOfHigherValues + sumOfLowerValues) :
                0;

        xData.push(xVal[period]);
        yData.push(y);
        CMO.push([xVal[period], y]);

        for (i = period + 1; i < yValLen; i++) {
            firstAddedSum = Math.abs(
                values[i - period - 1] - values[i - period]
            );
            if (values[i] > values[i - 1]) {
                sumOfHigherValues += values[i] - values[i - 1];
            } else if (values[i] < values[i - 1]) {
                sumOfLowerValues += values[i - 1] - values[i];
            }

            // Check, to which sum was the first value added to,
            // and substract this value from given sum.
            if (values[i - period] > values[i - period - 1]) {
                sumOfHigherValues -= firstAddedSum;
            } else {
                sumOfLowerValues -= firstAddedSum;
            }
            // Same as above.
            y =
                sumOfHigherValues + sumOfLowerValues > 0 ?
                    (100 * (sumOfHigherValues - sumOfLowerValues)) /
                    (sumOfHigherValues + sumOfLowerValues) :
                    0;

            xData.push(xVal[i]);
            yData.push(y);
            CMO.push([xVal[i], y]);
        }

        return {
            values: CMO,
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

interface CMOIndicator {
    pointClass: typeof CMOPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        cmo: typeof CMOIndicator;
    }
}

SeriesRegistry.registerSeriesType('cmo', CMOIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default CMOIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `CMO` series. If the [type](#series.cmo.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.cmo
 * @since 9.1.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/cmo
 * @apioption series.cmo
 */

(''); // to include the above in the js output
