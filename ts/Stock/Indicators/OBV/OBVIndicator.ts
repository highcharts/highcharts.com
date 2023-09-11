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
    OBVOptions,
    OBVParamsOptions
} from './OBVOptions';
import type OBVPoint from './OBVPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';

import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
import Series from '../../../Core/Series/Series';
const {
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import error from '../../../Shared/Helpers/Error.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { extend, merge } = OH;
/* *
 *
 *  Class
 *
 * */

/**
 * The OBV series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.obv
 *
 * @augments Highcharts.Series
 */
class OBVIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * On-Balance Volume (OBV) technical indicator. This series
     * requires the `linkedTo` option to be set and should be loaded after
     * the `stock/indicators/indicators.js` file. Through the `volumeSeriesID`
     * there also should be linked the volume series.
     *
     * @sample stock/indicators/obv
     *         OBV indicator
     *
     * @extends      plotOptions.sma
     * @since 9.1.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/obv
     * @excluding    allAreas, colorAxis, joinBy, keys, navigatorOptions,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointRange, pointStart, showInNavigator, stacking
     * @optionparent plotOptions.obv
     */
    public static defaultOptions: OBVOptions = merge(SMAIndicator.defaultOptions, {
        marker: {
            enabled: false
        },
        /**
         * @excluding index, period
         */
        params: {
            // Index and period are unchangeable, do not inherit (#15362)
            index: void 0,
            period: void 0,
            /**
             * The id of another series to use its data as volume data for the
             * indiator calculation.
             */
            volumeSeriesID: 'volume'
        },
        tooltip: {
            valueDecimals: 0
        }
    } as OBVOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<OBVPoint> = void 0 as any;
    public points: Array<OBVPoint> = void 0 as any;
    public options: OBVOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: OBVParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const volumeSeries = series.chart.get(params.volumeSeriesID as string),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<number> | Array<Array<number>> = (series.yData as any),
            OBV: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [],
            hasOHLC = !isNumber(yVal[0]);

        let OBVPoint: Array<number> = [],
            i: number = 1,
            previousOBV: number = 0,
            curentOBV: number = 0,
            previousClose: number = 0,
            curentClose: number = 0,
            volume: Array<number>;

        // Checks if volume series exists.
        if (volumeSeries) {
            volume = ((volumeSeries as Series).yData as any);

            // Add first point and get close value.
            OBVPoint = [xVal[0], previousOBV];
            previousClose = hasOHLC ?
                (yVal as Array<Array<number>>)[0][3] : (yVal as Array<number>)[0];

            OBV.push(OBVPoint);
            xData.push(xVal[0]);
            yData.push(OBVPoint[1]);

            for (i; i < yVal.length; i++) {
                curentClose = hasOHLC ?
                    (yVal as Array<Array<number>>)[i][3] : (yVal as Array<number>)[i];

                if (curentClose > previousClose) { // up
                    curentOBV = previousOBV + volume[i];
                } else if (curentClose === previousClose) { // constant
                    curentOBV = previousOBV;
                } else { // down
                    curentOBV = previousOBV - volume[i];
                }

                // Add point.
                OBVPoint = [xVal[i], curentOBV];

                // Assign current as previous for next iteration.
                previousOBV = curentOBV;
                previousClose = curentClose;

                OBV.push(OBVPoint);
                xData.push(xVal[i]);
                yData.push(OBVPoint[1]);
            }
        } else {
            error(
                'Series ' +
                params.volumeSeriesID +
                ' not found! Check `volumeSeriesID`.',
                true,
                series.chart
            );
            return;
        }

        return {
            values: OBV,
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

interface OBVIndicator {
    nameComponents: Array<string>;
    pointClass: typeof OBVPoint;
}

extend(OBVIndicator.prototype, {
    nameComponents: void 0 as any
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        obv: typeof OBVIndicator;
    }
}

SeriesRegistry.registerSeriesType('obv', OBVIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default OBVIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `OBV` series. If the [type](#series.obv.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.obv
 * @since 9.1.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/obv
 * @apioption series.obv
 */

''; // to include the above in the js output
