/* *
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

import type AreaSplineSeriesOptions from './AreaSplineSeriesOptions';
import type AreaSplinePoint from './AreaSplinePoint';

import SplineSeries from '../Spline/SplineSeries.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    area: AreaSeries,
    area: { prototype: areaProto }
} = SeriesRegistry.seriesTypes;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * AreaSpline series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.areaspline
 *
 * @augments Highcharts.Series
 */
class AreaSplineSeries extends SplineSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: AreaSplineSeriesOptions = merge(
        SplineSeries.defaultOptions,
        AreaSeries.defaultOptions
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<AreaSplinePoint> = void 0 as any;
    public points: Array<AreaSplinePoint> = void 0 as any;
    public options: AreaSplineSeriesOptions = void 0 as any;
}

/* *
 *
 *  Class Prototype
 *
 * */
interface AreaSplineSeries extends SplineSeries {
    pointClass: typeof AreaSplinePoint;
    getGraphPath: typeof areaProto.getGraphPath,
    getStackPoints: typeof areaProto.getStackPoints;
    drawGraph: typeof areaProto.drawGraph;
}

extend(AreaSplineSeries.prototype, {
    getGraphPath: areaProto.getGraphPath,
    getStackPoints: areaProto.getStackPoints,
    drawGraph: areaProto.drawGraph
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        areaspline: typeof AreaSplineSeries;
    }
}

SeriesRegistry.registerSeriesType('areaspline', AreaSplineSeries);

/* *
 *
 *  Default Export
 *
 * */

export default AreaSplineSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * The area spline series is an area series where the graph between the
 * points is smoothed into a spline.
 *
 * @sample {highcharts} highcharts/demo/areaspline/
 *         Area spline chart
 * @sample {highstock} stock/demo/areaspline/
 *         Area spline chart
 *
 * @extends   plotOptions.area
 * @excluding step, boostThreshold, boostBlending
 * @product   highcharts highstock
 * @apioption plotOptions.areaspline
 */

/**
 * @see [fillColor](#plotOptions.areaspline.fillColor)
 * @see [fillOpacity](#plotOptions.areaspline.fillOpacity)
 *
 * @apioption plotOptions.areaspline.color
 */

/**
 * @see [color](#plotOptions.areaspline.color)
 * @see [fillOpacity](#plotOptions.areaspline.fillOpacity)
 *
 * @apioption plotOptions.areaspline.fillColor
 */

/**
 * @see [color](#plotOptions.areaspline.color)
 * @see [fillColor](#plotOptions.areaspline.fillColor)
 *
 * @default   0.75
 * @apioption plotOptions.areaspline.fillOpacity
 */

/**
 * A `areaspline` series. If the [type](#series.areaspline.type) option
 * is not specified, it is inherited from [chart.type](#chart.type).
 *
 *
 * @extends   series,plotOptions.areaspline
 * @excluding dataParser, dataURL, step, boostThreshold, boostBlending
 * @product   highcharts highstock
 * @apioption series.areaspline
 */

/**
 * @see [fillColor](#series.areaspline.fillColor)
 * @see [fillOpacity](#series.areaspline.fillOpacity)
 *
 * @apioption series.areaspline.color
 */

/**
 * An array of data points for the series. For the `areaspline` series
 * type, points can be given in the following ways:
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
 *        [0, 10],
 *        [1, 9],
 *        [2, 3]
 *    ]
 *    ```
 *
 * 3. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.areaspline.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        x: 1,
 *        y: 4,
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
 * @extends   series.line.data
 * @product   highcharts highstock
 * @apioption series.areaspline.data
 */

/**
 * @see [color](#series.areaspline.color)
 * @see [fillOpacity](#series.areaspline.fillOpacity)
 *
 * @apioption series.areaspline.fillColor
 */

/**
 * @see [color](#series.areaspline.color)
 * @see [fillColor](#series.areaspline.fillColor)
 *
 * @default   0.75
 * @apioption series.areaspline.fillOpacity
 */

''; // adds doclets above into transpilat
