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

import type MapLinePoint from './MapLinePoint.js';
import type MapLineSeriesOptions from './MapLineSeriesOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import MapSeries from '../Map/MapSeries.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const { series: Series } = SeriesRegistry;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.mapline
 *
 * @augments Highcharts.Series
 */
class MapLineSeries extends MapSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A mapline series is a special case of the map series where the value
     * colors are applied to the strokes rather than the fills. It can also be
     * used for freeform drawing, like dividers, in the map.
     *
     * @sample maps/demo/mapline-mappoint/
     *         Mapline and map-point chart
     * @sample maps/demo/animated-mapline/
     *         Mapline with CSS keyframe animation
     * @sample maps/demo/flight-routes
     *         Flight routes
     *
     * @extends      plotOptions.map
     * @excluding    dragDrop
     * @product      highmaps
     * @optionparent plotOptions.mapline
     */
    public static defaultOptions: MapLineSeriesOptions = merge(MapSeries.defaultOptions, {
        /**
         * Pixel width of the mapline line.
         *
         * @type      {number}
         * @since 10.3.3
         * @product   highmaps
         * @default   1
         * @apioption plotOptions.mapline.lineWidth
         */
        lineWidth: 1,

        /**
         * Fill color for the map line shapes
         *
         * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         */
        fillColor: 'none',

        legendSymbol: 'lineMarker'
    } as MapLineSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<MapLinePoint> = void 0 as any;

    public options: MapLineSeriesOptions = void 0 as any;

    public points: Array<MapLinePoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Get presentational attributes
     * @private
     * @function Highcharts.seriesTypes.mapline#pointAttribs
     */
    public pointAttribs(
        point: MapLinePoint,
        state: StatesOptionsKey
    ): SVGAttributes {
        const attr = MapSeries.prototype.pointAttribs.call(
            this,
            point,
            state
        );

        // The difference from a map series is that the stroke takes the
        // point color
        attr.fill = this.options.fillColor;

        return attr;
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface MapLineSeries {
    colorProp: 'stroke';
    pointAttrToOptions: Record<string, string>;
    pointClass: typeof MapLinePoint;
}
extend(MapLineSeries.prototype, {

    type: 'mapline',

    colorProp: 'stroke',

    pointAttrToOptions: {
        'stroke': 'color',
        'stroke-width': 'lineWidth'
    }

});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        mapline: typeof MapLineSeries;
    }
}
SeriesRegistry.registerSeriesType('mapline', MapLineSeries);

/* *
 *
 *  Default Export
 *
 * */

export default MapLineSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `mapline` series. If the [type](#series.mapline.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.mapline
 * @excluding dataParser, dataURL, dragDrop, marker
 * @product   highmaps
 * @apioption series.mapline
 */

/**
 * An array of data points for the series. For the `mapline` series type,
 * points can be given in the following ways:
 *
 * 1.  An array of numerical values. In this case, the numerical values
 * will be interpreted as `value` options. Example:
 *
 *  ```js
 *  data: [0, 5, 3, 5]
 *  ```
 *
 * 2.  An array of arrays with 2 values. In this case, the values correspond
 * to `[hc-key, value]`. Example:
 *
 *  ```js
 *     data: [
 *         ['us-ny', 0],
 *         ['us-mi', 5],
 *         ['us-tx', 3],
 *         ['us-ak', 5]
 *     ]
 *  ```
 *
 * 3.  An array of objects with named values. The following snippet shows only a
 * few settings, see the complete options set below. If the total number of data
 * points exceeds the series' [turboThreshold](#series.map.turboThreshold),
 * this option is not available.
 *
 *  ```js
 *     data: [{
 *         value: 6,
 *         name: "Point2",
 *         color: "#00FF00"
 *     }, {
 *         value: 6,
 *         name: "Point1",
 *         color: "#FF00FF"
 *     }]
 *  ```
 *
 * @type      {Array<number|Array<string,(number|null)>|null|*>}
 * @extends   series.map.data
 * @excluding drilldown
 * @product   highmaps
 * @apioption series.mapline.data
 */

/**
 * Pixel width of the mapline line.
 *
 * @type      {number}
 * @since 10.2.0
 * @product   highmaps
 * @apioption plotOptions.mapline.states.hover.lineWidth
 */

/**
 * Pixel width of the mapline line.
 *
 * @type      {number|undefined}
 * @since 10.3.3
 * @product   highmaps
 * @apioption series.mapline.data.lineWidth
 */

/**
 *
 * @type      {number}
 * @product   highmaps
 * @excluding borderWidth
 * @apioption plotOptions.mapline.states.hover
 */

''; // adds doclets above to transpiled file
