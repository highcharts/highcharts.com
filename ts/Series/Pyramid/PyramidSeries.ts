/* *
 *
 *  Highcharts funnel module
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type PyramidPoint from './PyramidPoint';
import type PyramidSeriesOptions from './PyramidSeriesOptions';
import FunnelSeries from '../Funnel/FunnelSeries.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * Pyramid series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.pyramid
 *
 * @augments Highcharts.Series
 */
class PyramidSeries extends FunnelSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A pyramid series is a special type of funnel, without neck and reversed
     * by default.
     *
     * @sample highcharts/demo/pyramid/
     *         Pyramid chart
     *
     * @extends      plotOptions.funnel
     * @product      highcharts
     * @requires     modules/funnel
     * @optionparent plotOptions.pyramid
     */
    public static defaultOptions: PyramidSeriesOptions = merge(FunnelSeries.defaultOptions, {
        /**
         * The pyramid neck width is zero by default, as opposed to the funnel,
         * which shares the same layout logic.
         *
         * @since 3.0.10
         */
        neckWidth: '0%',

        /**
         * The pyramid neck width is zero by default, as opposed to the funnel,
         * which shares the same layout logic.
         *
         * @since 3.0.10
         */
        neckHeight: '0%',

        /**
         * The pyramid is reversed by default, as opposed to the funnel, which
         * shares the layout engine, and is not reversed.
         *
         * @since 3.0.10
         */
        reversed: true
    } as PyramidSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<PyramidPoint> = void 0 as any;

    public options: PyramidSeriesOptions = void 0 as any;

    public points: Array<PyramidPoint> = void 0 as any;

}

/* *
 *
 *  Class Prototype
 *
 * */

interface PyramidSeries {
    pointClass: typeof PyramidPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        pyramid: typeof PyramidSeries;
    }
}
SeriesRegistry.registerSeriesType('pyramid', PyramidSeries);

/* *
 *
 *  Default Export
 *
 * */

export default PyramidSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `pyramid` series. If the [type](#series.pyramid.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.pyramid
 * @excluding dataParser, dataURL, stack, xAxis, yAxis, dataSorting,
 *            boostThreshold, boostBlending
 * @product   highcharts
 * @requires  modules/funnel
 * @apioption series.pyramid
 */

/**
 * An array of data points for the series. For the `pyramid` series
 * type, points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.pyramid.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        y: 9,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        y: 6,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<number|null|*>}
 * @extends   series.pie.data
 * @excluding sliced
 * @product   highcharts
 * @apioption series.pyramid.data
 */

''; // adds doclets above into transpiled file
