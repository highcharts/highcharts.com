/* *
 *
 *  Highcharts cylinder - a 3D series
 *
 *  (c) 2010-2021 Highsoft AS
 *
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

import type CylinderSeriesOptions from './CylinderSeriesOptions';
import CylinderPoint from './CylinderPoint.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend,
    merge
} = OH;

import './CylinderComposition.js';

/* *
 *
 *  Class
 *
 * */

/**
 * The cylinder series type.
 *
 * @requires module:highcharts-3d
 * @requires module:modules/cylinder
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.cylinder
 *
 * @augments Highcharts.Series
 */
class CylinderSeries extends ColumnSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A cylinder graph is a variation of a 3d column graph. The cylinder graph
     * features cylindrical points.
     *
     * @sample {highcharts} highcharts/demo/cylinder/
     *         Cylinder graph
     *
     * @extends      plotOptions.column
     * @since        7.0.0
     * @product      highcharts
     * @excluding    allAreas, boostThreshold, colorAxis, compare, compareBase,
     *               dragDrop, boostBlending
     * @requires     modules/cylinder
     * @optionparent plotOptions.cylinder
     */
    public static defaultOptions: CylinderSeriesOptions = merge(ColumnSeries.defaultOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<CylinderPoint> = void 0 as any;

    public options: CylinderSeriesOptions = void 0 as any;

    public points: Array<CylinderPoint> = void 0 as any;

}

/* *
 *
 *  Class Prototype
 *
 * */

interface CylinderSeries {
    pointClass: typeof CylinderPoint;
}
extend(CylinderSeries.prototype, {
    pointClass: CylinderPoint
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        cylinder: typeof CylinderSeries;
    }
}
SeriesRegistry.registerSeriesType('cylinder', CylinderSeries);

/* *
 *
 *  Default Export
 *
 * */

export default CylinderSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `cylinder` series. If the [type](#series.cylinder.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.cylinder
 * @since     7.0.0
 * @product   highcharts
 * @excluding allAreas, boostThreshold, colorAxis, compare, compareBase,
 *            boostBlending
 * @requires  modules/cylinder
 * @apioption series.cylinder
 */

/**
 * An array of data points for the series. For the `cylinder` series type,
 * points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. The `x` values will be automatically
 *    calculated, either starting at 0 and incremented by 1, or from
 *    `pointStart` and `pointInterval` given in the series options. If the axis
 *    has categories, these will be used. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of arrays with 2 values. In this case, the values correspond to
 *    `x,y`. If the first value is a string, it is applied as the name of the
 *    point, and the `x` value is inferred.
 *    ```js
 *    data: [
 *        [0, 0],
 *        [1, 8],
 *        [2, 9]
 *    ]
 *    ```
 *
 * 3. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.cylinder.turboThreshold), this option is not
 *    available.
 *
 *    ```js
 *    data: [{
 *        x: 1,
 *        y: 2,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        x: 1,
 *        y: 4,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
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
 * @type      {Array<number|Array<(number|string),(number|null)>|null|*>}
 * @extends   series.column.data
 * @product   highcharts highstock
 * @apioption series.cylinder.data
 */

''; // keeps doclets above in the transpiled file
