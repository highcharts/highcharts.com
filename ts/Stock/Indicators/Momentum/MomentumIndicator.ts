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
import type MomentumOptions from './MomentumOptions';
import type MomentumPoint from './MomentumPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { extend, merge } = OH;

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function populateAverage(
    xVal: Array<number>,
    yVal: Array<Array<number>>,
    i: number,
    period: number,
    index: number
): [number, number] {
    const mmY: number = yVal[i - 1][index] - yVal[i - period - 1][index],
        mmX: number = xVal[i - 1];

    return [mmX, mmY];
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Momentum series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.momentum
 *
 * @augments Highcharts.Series
 */
class MomentumIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Momentum. This series requires `linkedTo` option to be set.
     *
     * @sample stock/indicators/momentum
     *         Momentum indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/momentum
     * @optionparent plotOptions.momentum
     */
    public static defaultOptions: MomentumOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            index: 3
        }
    } as MomentumOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<MomentumPoint> = void 0 as any;
    public options: MomentumOptions = void 0 as any;
    public points: Array<MomentumPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: MomentumOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = params.period,
            index: number = params.index as any,
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            MM: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [];

        let i: number,
            MMPoint: [number, number];

        if (xVal.length <= period) {
            return;
        }

        // Switch index for OHLC / Candlestick / Arearange
        if (!isArray(yVal[0])) {
            return;
        }

        // Calculate value one-by-one for each period in visible data
        for (i = (period + 1); i < yValLen; i++) {
            MMPoint = populateAverage(xVal, yVal, i, period, index);
            MM.push(MMPoint);
            xData.push(MMPoint[0]);
            yData.push(MMPoint[1]);
        }

        MMPoint = populateAverage(xVal, yVal, i, period, index);
        MM.push(MMPoint);
        xData.push(MMPoint[0]);
        yData.push(MMPoint[1]);

        return {
            values: MM,
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

interface MomentumIndicator {
    pointClass: typeof MomentumPoint;
    nameBase: string;
}
extend(MomentumIndicator.prototype, {
    nameBase: 'Momentum'
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        momentum: typeof MomentumIndicator;
    }
}

SeriesRegistry.registerSeriesType('momentum', MomentumIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default MomentumIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `Momentum` series. If the [type](#series.momentum.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.momentum
 * @since     6.0.0
 * @excluding dataParser, dataURL
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/momentum
 * @apioption series.momentum
 */

''; // to include the above in the js output
