/* *
 *
 *  Highcharts pyramid3d series module
 *
 *  (c) 2010-2021 Highsoft AS
 *  Author: Kacper Madej
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

import type Pyramid3DPoint from './Pyramid3DPoint';
import type Pyramid3DSeriesOptions from './Pyramid3DSeriesOptions';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    seriesTypes: {
        funnel3d: Funnel3DSeries
    }
} = SeriesRegistry;

/* *
 *
 *  Class
 *
 * */

/**
 * The pyramid3d series type.
 *
 * @class
 * @name Highcharts.seriesTypes.pyramid3d
 * @augments seriesTypes.funnel3d
 * @requires highcharts-3d
 * @requires modules/cylinder
 * @requires modules/funnel3d
 * @requires modules/pyramid3d
 */
class Pyramid3DSeries extends Funnel3DSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A pyramid3d is a 3d version of pyramid series type. Pyramid charts are
     * a type of chart often used to visualize stages in a sales project,
     * where the top are the initial stages with the most clients.
     *
     * @sample highcharts/demo/pyramid3d/
     *         Pyramid3d
     *
     * @extends      plotOptions.funnel3d
     * @excluding    neckHeight, neckWidth, dataSorting
     * @product      highcharts
     * @since        7.1.0
     * @requires     highcharts-3d
     * @requires     modules/cylinder
     * @requires     modules/funnel3d
     * @requires     modules/pyramid3d
     * @optionparent plotOptions.pyramid3d
     */
    public static defaultOptions: Pyramid3DSeriesOptions = merge(Funnel3DSeries.defaultOptions, {
        /**
         * A reversed pyramid3d is funnel3d, but the latter supports neck
         * related options: neckHeight and neckWidth
         *
         * @product highcharts
         */
        reversed: true,

        neckHeight: 0,
        neckWidth: 0,
        dataLabels: {
            /**
             * @default top
             */
            verticalAlign: 'top'
        }
    } as Pyramid3DSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<Pyramid3DPoint> = void 0 as any;

    public options: Pyramid3DSeriesOptions = void 0 as any;

    public points: Array<Pyramid3DPoint> = void 0 as any;
}

/* *
 *
 *  Class Prototype
 *
 * */

interface Pyramid3DSeries {
    pointClass: typeof Pyramid3DPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        pyramid3d: typeof Pyramid3DSeries;
    }
}
SeriesRegistry.registerSeriesType('pyramid3d', Pyramid3DSeries);

/* *
 *
 *  Default Export
 *
 * */

export default Pyramid3DSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `pyramid3d` series. If the [type](#series.pyramid3d.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @since     7.1.0
 * @extends   series,plotOptions.pyramid3d
 * @excluding allAreas,boostThreshold,colorAxis,compare,compareBase,dataSorting
 * @product   highcharts
 * @sample    {highcharts} highcharts/demo/pyramid3d/ Pyramid3d
 * @requires  modules/pyramid3d
 * @apioption series.pyramid3d
 */

/**
 * An array of data points for the series. For the `pyramid3d` series
 * type, points can be given in the following ways:
 *
 * 1.  An array of numerical values. In this case, the numerical values
 * will be interpreted as `y` options. The `x` values will be automatically
 * calculated, either starting at 0 and incremented by 1, or from `pointStart`
 * and `pointInterval` given in the series options. If the axis has
 * categories, these will be used. Example:
 *
 *  ```js
 *  data: [0, 5, 3, 5]
 *  ```
 *
 * 2.  An array of objects with named values. The following snippet shows only a
 * few settings, see the complete options set below. If the total number of data
 * points exceeds the series'
 * [turboThreshold](#series.pyramid3d.turboThreshold),
 * this option is not available.
 *
 *  ```js
 *     data: [{
 *         y: 2,
 *         name: "Point2",
 *         color: "#00FF00"
 *     }, {
 *         y: 4,
 *         name: "Point1",
 *         color: "#FF00FF"
 *     }]
 *  ```
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<number|Array<number>|*>}
 * @extends   series.funnel3d.data
 * @product   highcharts
 * @apioption series.pyramid3d.data
 */

''; // adds doclets above to the transpiled file
