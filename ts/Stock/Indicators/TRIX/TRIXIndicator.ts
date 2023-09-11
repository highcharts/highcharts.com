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

import type TEMAIndicatorType from '../TEMA/TEMAIndicator';
import type { TRIXOptions } from './TRIXOptions';
import type TRIXPoint from './TRIXPoint';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { tema: TEMAIndicator } = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The TRIX series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.trix
 *
 * @augments Highcharts.Series
 */
class TRIXIndicator extends TEMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Triple exponential average (TRIX) oscillator. This series requires
     * `linkedTo` option to be set.
     *
     * @sample {highstock} stock/indicators/trix
     * TRIX indicator
     *
     * @extends      plotOptions.tema
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, colorAxis, compare, compareBase, joinBy, keys,
     *               navigatorOptions, pointInterval, pointIntervalUnit,
     *               pointPlacement, pointRange, pointStart, showInNavigator,
     *               stacking
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/tema
     * @requires     stock/indicators/trix
     * @optionparent plotOptions.trix
     */
    public static defaultOptions: TRIXOptions = merge(TEMAIndicator.defaultOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<TRIXPoint> = void 0 as any;
    public options: TRIXOptions = void 0 as any;
    public points: Array<TRIXPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    // TRIX is calculated using TEMA so we just extend getTemaPoint method.
    public getTemaPoint(
        xVal: Array<number>,
        tripledPeriod: number,
        EMAlevels: TEMAIndicatorType.EMALevelsObject,
        i: number
    ): ([number, (number|null)]|undefined) {
        if (i > tripledPeriod) {
            return [
                xVal[i - 3],
                EMAlevels.prevLevel3 !== 0 ?
                    correctFloat(EMAlevels.level3 - EMAlevels.prevLevel3) /
                    EMAlevels.prevLevel3 * 100 : null
            ];
        }
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface TRIXIndicator {
    pointClass: typeof TRIXPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        trix: typeof TRIXIndicator;
    }
}

SeriesRegistry.registerSeriesType('trix', TRIXIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default TRIXIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `TRIX` series. If the [type](#series.trix.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.trix
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, compare, compareBase, dataParser, dataURL,
 *            joinBy, keys, navigatorOptions, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointRange, pointStart, showInNavigator, stacking
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/tema
 * @apioption series.trix
 */

''; // to include the above in the js output
