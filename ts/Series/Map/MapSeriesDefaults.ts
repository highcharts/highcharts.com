/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type MapPoint from './MapPoint';
import type MapSeriesOptions from './MapSeriesOptions';

import { Palette } from '../../Core/Color/Palettes.js';
import U from '../../Core/Utilities.js';
const { isNumber } = U;

/* *
 *
 *  API Options
 *
 * */

/**
 * The map series is used for basic choropleth maps, where each map area has
 * a color based on its value.
 *
 * @sample maps/demo/all-maps/
 *         Choropleth map
 *
 * @extends      plotOptions.scatter
 * @excluding    boostBlending, boostThreshold, dragDrop, cluster, marker
 * @product      highmaps
 * @optionparent plotOptions.map
 *
 * @private
 */
const MapSeriesDefaults: MapSeriesOptions = {

    /**
     * Whether the MapView takes this series into account when computing the
     * default zoom and center of the map.
     *
     * @sample maps/series/affectsmapview/
     *         US map with world map backdrop
     *
     * @since 10.0.0
     *
     * @private
     */
    affectsMapView: true,

    animation: false, // Makes the complex shapes slow

    dataLabels: {
        crop: false,
        formatter: function (): string { // #2945
            const { numberFormatter } = this.series.chart;
            const { value } = this.point as MapPoint;
            return isNumber(value) ?
                numberFormatter(value, -1) :
                (this.point.name || ''); // #20231
        },
        inside: true, // For the color
        overflow: false as any,
        padding: [0, 2],
        verticalAlign: 'middle'
    },

    /**
     * The SVG value used for the `stroke-linecap` and `stroke-linejoin` of
     * the map borders. Round means that borders are rounded in the ends and
     * bends.
     *
     * @sample maps/demo/mappoint-mapmarker/
     *         Backdrop coastline with round linecap
     *
     * @type   {Highcharts.SeriesLinecapValue}
     * @since  10.3.3
     */
    linecap: 'round',

    /**
     * @ignore-option
     *
     * @private
     */
    marker: null as any,

    /**
     * The color to apply to null points.
     *
     * In styled mode, the null point fill is set in the
     * `.highcharts-null-point` class.
     *
     * @sample maps/demo/all-areas-as-null/
     *         Null color
     *
     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     *
     * @private
     */
    nullColor: Palette.neutralColor3,

    /**
     * Whether to allow pointer interaction like tooltips and mouse events
     * on null points.
     *
     * @type      {boolean}
     * @since     4.2.7
     * @apioption plotOptions.map.nullInteraction
     *
     * @private
     */

    stickyTracking: false,

    tooltip: {
        followPointer: true,
        pointFormat: '{point.name}: {point.value}<br/>'
    },

    /**
     * @ignore-option
     *
     * @private
     */
    turboThreshold: 0,

    /**
     * Whether all areas of the map defined in `mapData` should be rendered.
     * If `true`, areas which don't correspond to a data point, are rendered
     * as `null` points. If `false`, those areas are skipped.
     *
     * @sample maps/plotoptions/series-allareas-false/
     *         All areas set to false
     *
     * @type      {boolean}
     * @default   true
     * @product   highmaps
     * @apioption plotOptions.series.allAreas
     *
     * @private
     */
    allAreas: true,

    /**
     * The border color of the map areas.
     *
     * In styled mode, the border stroke is given in the `.highcharts-point`
     * class.
     *
     * @sample {highmaps} maps/plotoptions/series-border/
     *         Borders demo
     *
     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @default   #cccccc
     * @product   highmaps
     * @apioption plotOptions.series.borderColor
     *
     * @private
     */
    borderColor: Palette.neutralColor10,

    /**
     * The border width of each map area.
     *
     * In styled mode, the border stroke width is given in the
     * `.highcharts-point` class.
     *
     * @sample maps/plotoptions/series-border/
     *         Borders demo
     *
     * @type      {number}
     * @default   1
     * @product   highmaps
     * @apioption plotOptions.series.borderWidth
     *
     * @private
     */
    borderWidth: 1,

    /**
     * @type      {string}
     * @default   value
     * @apioption plotOptions.map.colorKey
     */

    /**
     * What property to join the `mapData` to the value data. For example,
     * if joinBy is "code", the mapData items with a specific code is merged
     * into the data with the same code. For maps loaded from GeoJSON, the
     * keys may be held in each point's `properties` object.
     *
     * The joinBy option can also be an array of two values, where the first
     * points to a key in the `mapData`, and the second points to another
     * key in the `data`.
     *
     * When joinBy is `null`, the map items are joined by their position in
     * the array, which performs much better in maps with many data points.
     * This is the recommended option if you are printing more than a
     * thousand data points and have a backend that can preprocess the data
     * into a parallel array of the mapData.
     *
     * @sample maps/plotoptions/series-border/
     *         Joined by "code"
     * @sample maps/demo/geojson/
     *         GeoJSON joined by an array
     * @sample maps/series/joinby-null/
     *         Simple data joined by null
     *
     * @type      {string|Array<string>}
     * @default   hc-key
     * @product   highmaps
     * @apioption plotOptions.series.joinBy
     *
     * @private
     */
    joinBy: 'hc-key',

    /**
     * Define the z index of the series.
     *
     * @type      {number}
     * @product   highmaps
     * @apioption plotOptions.series.zIndex
     */

    /**
     * @apioption plotOptions.series.states
     *
     * @private
     */
    states: {

        /**
         * @apioption plotOptions.series.states.hover
         */
        hover: {

            /** @ignore-option */
            halo: void 0,

            /**
             * The color of the shape in this state.
             *
             * @sample maps/plotoptions/series-states-hover/
             *         Hover options
             *
             * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
             * @product   highmaps
             * @apioption plotOptions.series.states.hover.color
             */

            /**
             * The border color of the point in this state.
             *
             * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
             * @product   highmaps
             * @apioption plotOptions.series.states.hover.borderColor
             */
            borderColor: Palette.neutralColor60,

            /**
             * The border width of the point in this state
             *
             * @type      {number}
             * @product   highmaps
             * @apioption plotOptions.series.states.hover.borderWidth
             */
            borderWidth: 2

            /**
             * The relative brightness of the point when hovered, relative
             * to the normal point color.
             *
             * @type      {number}
             * @product   highmaps
             * @default   0
             * @apioption plotOptions.series.states.hover.brightness
             */
        },

        /**
         * @apioption plotOptions.series.states.normal
         */
        normal: {

            /**
             * @productdesc {highmaps}
             * The animation adds some latency in order to reduce the effect
             * of flickering when hovering in and out of for example an
             * uneven coastline.
             *
             * @sample {highmaps} maps/plotoptions/series-states-animation-false/
             *         No animation of fill color
             *
             * @apioption plotOptions.series.states.normal.animation
             */
            animation: true
        },

        /**
         * @apioption plotOptions.series.states.select
         */
        select: {

            /**
             * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
             * @default   ${palette.neutralColor20}
             * @product   highmaps
             * @apioption plotOptions.series.states.select.color
             */
            color: Palette.neutralColor20
        }
    },

    legendSymbol: 'rectangle'
};

/**
 * An array of objects containing a `geometry` or `path` definition and
 * optionally additional properties to join in the `data` as per the `joinBy`
 * option. GeoJSON and TopoJSON structures can also be passed directly into
 * `mapData`.
 *
 * @sample maps/demo/category-map/
 *         Map data and joinBy
 * @sample maps/series/mapdata-multiple/
 *         Multiple map sources
 *
 * @type      {Array<Highcharts.SeriesMapDataOptions>|Highcharts.GeoJSON|Highcharts.TopoJSON}
 * @product   highmaps
 * @apioption series.mapData
 */

/**
 * A `map` series. If the [type](#series.map.type) option is not specified, it
 * is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.map
 * @excluding dataParser, dataURL, dragDrop, marker
 * @product   highmaps
 * @apioption series.map
 */

/**
 * An array of data points for the series. For the `map` series type, points can
 * be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `value` options. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of arrays with 2 values. In this case, the values correspond to
 *    `[hc-key, value]`. Example:
 *    ```js
 *        data: [
 *            ['us-ny', 0],
 *            ['us-mi', 5],
 *            ['us-tx', 3],
 *            ['us-ak', 5]
 *        ]
 *    ```
 *
 * 3. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.map.turboThreshold),
 *    this option is not available.
 *    ```js
 *        data: [{
 *            value: 6,
 *            name: "Point2",
 *            color: "#00FF00"
 *        }, {
 *            value: 6,
 *            name: "Point1",
 *            color: "#FF00FF"
 *        }]
 *    ```
 *
 * @type      {Array<number|Array<string,(number|null)>|null|*>}
 * @product   highmaps
 * @apioption series.map.data
 */

/**
 * When using automatic point colors pulled from the global
 * [colors](colors) or series-specific
 * [plotOptions.map.colors](series.colors) collections, this option
 * determines whether the chart should receive one color per series or
 * one color per point.
 *
 * In styled mode, the `colors` or `series.colors` arrays are not
 * supported, and instead this option gives the points individual color
 * class names on the form `highcharts-color-{n}`.
 *
 * @see [series colors](#plotOptions.map.colors)
 *
 * @sample {highmaps} maps/plotoptions/mapline-colorbypoint-false/
 *         Mapline colorByPoint set to false by default
 * @sample {highmaps} maps/plotoptions/mapline-colorbypoint-true/
 *         Mapline colorByPoint set to true
 *
 * @type      {boolean}
 * @default   false
 * @since     2.0
 * @product   highmaps
 * @apioption plotOptions.map.colorByPoint
 */

/**
 * A series specific or series type specific color set to apply instead
 * of the global [colors](#colors) when [colorByPoint](
 * #plotOptions.map.colorByPoint) is true.
 *
 * @type      {Array<Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject>}
 * @since     3.0
 * @product   highmaps
 * @apioption plotOptions.map.colors
 */

/**
 * Individual color for the point. By default the color is either used
 * to denote the value, or pulled from the global `colors` array.
 *
 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
 * @product   highmaps
 * @apioption series.map.data.color
 */

/**
 * Individual data label for each point. The options are the same as
 * the ones for [plotOptions.series.dataLabels](
 * #plotOptions.series.dataLabels).
 *
 * @sample maps/series/data-datalabels/
 *         Disable data labels for individual areas
 *
 * @type      {Highcharts.DataLabelsOptions}
 * @product   highmaps
 * @apioption series.map.data.dataLabels
 */

/**
 * The `id` of a series in the [drilldown.series](#drilldown.series)
 * array to use for a drilldown for this point.
 *
 * @sample maps/demo/map-drilldown/
 *         Basic drilldown
 *
 * @type      {string}
 * @product   highmaps
 * @apioption series.map.data.drilldown
 */

/**
 * For map and mapline series types, the geometry of a point.
 *
 * To achieve a better separation between the structure and the data,
 * it is recommended to use `mapData` to define the geometry instead
 * of defining it on the data points themselves.
 *
 * The geometry object is compatible to that of a `feature` in GeoJSON, so
 * features of GeoJSON can be passed directly into the `data`, optionally
 * after first filtering and processing it.
 *
 * For pre-projected maps (like GeoJSON maps from our
 * [map collection](https://code.highcharts.com/mapdata/)), user has to specify
 * coordinates in `projectedUnits` for geometry type other than `Point`,
 * instead of `[longitude, latitude]`.
 *
 * @sample maps/series/mappoint-line-geometry/
 *         Map point and line geometry
 * @sample maps/series/geometry-types/
 *         Geometry types
 *
 * @type      {Object}
 * @since 9.3.0
 * @product   highmaps
 * @apioption series.map.data.geometry
 */

/**
 * The geometry type. Can be one of `LineString`, `Polygon`, `MultiLineString`
 * or `MultiPolygon`.
 *
 * @sample maps/series/geometry-types/
 *         Geometry types
 *
 * @declare   Highcharts.MapGeometryTypeValue
 * @type      {string}
 * @since     9.3.0
 * @product   highmaps
 * @validvalue ["LineString", "Polygon", "MultiLineString", "MultiPolygon"]
 * @apioption series.map.data.geometry.type
 */

/**
 * The geometry coordinates in terms of arrays of `[longitude, latitude]`, or
 * a two dimensional array of the same. The dimensionality must comply with the
 * `type`.
 *
 * @type      {Array<LonLatArray>|Array<Array<LonLatArray>>}
 * @since 9.3.0
 * @product   highmaps
 * @apioption series.map.data.geometry.coordinates
 */

/**
 * An id for the point. This can be used after render time to get a
 * pointer to the point object through `chart.get()`.
 *
 * @sample maps/series/data-id/
 *         Highlight a point by id
 *
 * @type      {string}
 * @product   highmaps
 * @apioption series.map.data.id
 */

/**
 * When data labels are laid out on a map, Highmaps runs a simplified
 * algorithm to detect collision. When two labels collide, the one with
 * the lowest rank is hidden. By default the rank is computed from the
 * area.
 *
 * @type      {number}
 * @product   highmaps
 * @apioption series.map.data.labelrank
 */

/**
 * The relative mid point of an area, used to place the data label.
 * Ranges from 0 to 1\. When `mapData` is used, middleX can be defined
 * there.
 *
 * @type      {number}
 * @default   0.5
 * @product   highmaps
 * @apioption series.map.data.middleX
 */

/**
 * The relative mid point of an area, used to place the data label.
 * Ranges from 0 to 1\. When `mapData` is used, middleY can be defined
 * there.
 *
 * @type      {number}
 * @default   0.5
 * @product   highmaps
 * @apioption series.map.data.middleY
 */

/**
 * The name of the point as shown in the legend, tooltip, dataLabel
 * etc.
 *
 * @sample maps/series/data-datalabels/
 *         Point names
 *
 * @type      {string}
 * @product   highmaps
 * @apioption series.map.data.name
 */

/**
 * For map and mapline series types, the SVG path for the shape. For
 * compatibility with old IE, not all SVG path definitions are supported,
 * but M, L and C operators are safe.
 *
 * To achieve a better separation between the structure and the data,
 * it is recommended to use `mapData` to define that paths instead
 * of defining them on the data points themselves.
 *
 * For providing true geographical shapes based on longitude and latitude, use
 * the `geometry` option instead.
 *
 * @sample maps/series/data-path/
 *         Paths defined in data
 *
 * @type      {string}
 * @product   highmaps
 * @apioption series.map.data.path
 */

/**
 * The numeric value of the data point.
 *
 * @type      {number|null}
 * @product   highmaps
 * @apioption series.map.data.value
 */

/**
 * Individual point events
 *
 * @extends   plotOptions.series.point.events
 * @product   highmaps
 * @apioption series.map.data.events
 */

/* *
 *
 *  Default Export
 *
 * */

export default MapSeriesDefaults;
