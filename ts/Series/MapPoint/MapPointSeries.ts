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

import type MapChart from '../../Core/Chart/MapChart';
import type MapPointPointOptions from './MapPointPointOptions';
import type MapPointSeriesOptions from './MapPointSeriesOptions';
import type { MapBounds } from '../../Maps/MapViewOptions';
import type { ProjectedXY } from '../../Maps/MapViewOptions';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type SymbolOptions from '../../Core/Renderer/SVG/SymbolOptions';

import H from '../../Core/Globals.js';
const { noop } = H;
import MapPointPoint from './MapPointPoint.js';
import { Palette } from '../../Core/Color/Palettes.js';
import Point from '../../Core/Series/Point.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        map: MapSeries,
        scatter: ScatterSeries
    }
} = SeriesRegistry;
import SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer.js';
import U from '../../Shared/Utilities.js';

import '../../Core/Defaults.js';
import '../Scatter/ScatterSeries.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { extend, merge } = OH;
const { fireEvent } = EH;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.mappoint
 *
 * @augments Highcharts.Series
 */
class MapPointSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A mappoint series is a special form of scatter series where the points
     * can be laid out in map coordinates on top of a map.
     *
     * @sample maps/demo/mapline-mappoint/
     *         Map-line and map-point series.
     * @sample maps/demo/mappoint-mapmarker
     *         Using the mapmarker symbol for points
     * @sample maps/demo/mappoint-datalabels-mapmarker
     *         Using the mapmarker shape for data labels
     *
     * @extends      plotOptions.scatter
     * @product      highmaps
     * @optionparent plotOptions.mappoint
     */
    public static defaultOptions: MapPointSeriesOptions = merge(ScatterSeries.defaultOptions, {
        dataLabels: {
            crop: false,
            defer: false,
            enabled: true,
            formatter: function (
                this: Point.PointLabelObject
            ): (string|undefined) { // #2945
                return this.point.name;
            },
            overflow: false as any,
            style: {
                /** @internal */
                color: Palette.neutralColor100
            }
        },
        legendSymbol: 'lineMarker'
    } as MapPointSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */
    public chart: MapChart = void 0 as any;

    public data: Array<MapPointPoint> = void 0 as any;

    public options: MapPointSeriesOptions = void 0 as any;

    public points: Array<MapPointPoint> = void 0 as any;

    public clearBounds = MapSeries.prototype.clearBounds;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public drawDataLabels(): void {
        super.drawDataLabels();
        if (this.dataLabelsGroup) {
            this.dataLabelsGroup.clip(this.chart.clipRect);
        }
    }

    /**
     * Resolve `lon`, `lat` or `geometry` options and project the resulted
     * coordinates.
     *
     * @private
     */
    public projectPoint(
        pointOptions: MapPointPointOptions
    ): ProjectedXY|undefined {
        const mapView = this.chart.mapView;
        if (mapView) {
            const { geometry, lon, lat } = pointOptions;
            let coordinates = (
                geometry &&
                geometry.type === 'Point' &&
                geometry.coordinates
            );

            if (isNumber(lon) && isNumber(lat)) {
                coordinates = [lon, lat];
            }

            if (coordinates) {
                return mapView.lonLatToProjectedUnits({
                    lon: coordinates[0],
                    lat: coordinates[1]
                });
            }
        }
    }

    public translate(): void {
        const mapView = this.chart.mapView;

        if (!this.processedXData) {
            this.processData();
        }
        this.generatePoints();

        if (this.getProjectedBounds && this.isDirtyData) {
            delete this.bounds;
            this.getProjectedBounds(); // Added point needs bounds(#16598)
        }

        // Create map based translation
        if (mapView) {
            const mainSvgTransform = mapView.getSVGTransform(),
                { hasCoordinates } = mapView.projection;
            this.points.forEach((p): void => {

                let { x = void 0, y = void 0 } = p;
                const svgTransform = (
                    isNumber(p.insetIndex) &&
                    mapView.insets[p.insetIndex].getSVGTransform()
                ) || mainSvgTransform;

                const xy = (
                    this.projectPoint(p.options) ||
                    (
                        p.properties &&
                        this.projectPoint(p.properties)
                    )
                );

                let didBounds;
                if (xy) {
                    x = xy.x;
                    y = xy.y;

                // Map bubbles getting geometry from shape
                } else if (p.bounds) {
                    x = p.bounds.midX;
                    y = p.bounds.midY;
                    if (svgTransform && isNumber(x) && isNumber(y)) {
                        p.plotX = x * svgTransform.scaleX +
                            svgTransform.translateX;
                        p.plotY = y * svgTransform.scaleY +
                            svgTransform.translateY;
                        didBounds = true;
                    }
                }

                if (isNumber(x) && isNumber(y)) {

                    // Establish plotX and plotY
                    if (!didBounds) {
                        const plotCoords = mapView.projectedUnitsToPixels(
                            { x, y }
                        );

                        p.plotX = plotCoords.x;
                        p.plotY = hasCoordinates ?
                            plotCoords.y :
                            this.chart.plotHeight - plotCoords.y;
                    }

                } else {
                    p.y = p.plotX = p.plotY = void 0;
                }

                p.isInside = this.isPointInside(p);

                // Find point zone
                p.zone = this.zones.length ? p.getZone() : void 0;
            });
        }

        fireEvent(this, 'afterTranslate');
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 * Extra
 *
 * */

/* *
 * The mapmarker symbol
 */
const mapmarker = (
    x: number,
    y: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath => {
    const isLegendSymbol = options && options.context === 'legend';
    let anchorX: number,
        anchorY: number;

    if (isLegendSymbol) {
        anchorX = x + w / 2;
        anchorY = y + h;

    // Put the pin in the anchor position (dataLabel.shape)
    } else if (
        options &&
        typeof options.anchorX === 'number' &&
        typeof options.anchorY === 'number'
    ) {
        anchorX = options.anchorX;
        anchorY = options.anchorY;

    // Put the pin in the center and shift upwards (point.marker.symbol)
    } else {
        anchorX = x + w / 2;
        anchorY = y + h / 2;
        y -= h;
    }

    const r = isLegendSymbol ? h / 3 : h / 2;
    return [
        ['M', anchorX, anchorY],
        ['C', anchorX, anchorY, anchorX - r, y + r * 1.5, anchorX - r, y + r],
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        ['A', r, r, 1, 1, 1, anchorX + r, y + r],
        ['C', anchorX + r, y + r * 1.5, anchorX, anchorY, anchorX, anchorY],
        ['Z']
    ];
};
declare module '../../Core/Renderer/SVG/SymbolType' {
    interface SymbolTypeRegistry {
        /** @requires Highcharts Maps */
        mapmarker: typeof mapmarker;
    }
}
SVGRenderer.prototype.symbols.mapmarker = mapmarker;

/* *
 *
 *  Class Prototype
 *
 * */

interface MapPointSeries {
    bounds: MapBounds | undefined;
    pointClass: typeof MapPointPoint;
}
extend(MapPointSeries.prototype, {
    type: 'mappoint',
    axisTypes: ['colorAxis'],
    forceDL: true,
    isCartesian: false,
    pointClass: MapPointPoint,
    searchPoint: noop as any,
    useMapGeometry: true // #16534
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        mappoint: typeof MapPointSeries;
    }
}
SeriesRegistry.registerSeriesType('mappoint', MapPointSeries);

/* *
 *
 *  Default Export
 *
 * */

export default MapPointSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `mappoint` series. If the [type](#series.mappoint.type) option
 * is not specified, it is inherited from [chart.type](#chart.type).
 *
 *
 * @extends   series,plotOptions.mappoint
 * @excluding dataParser, dataURL
 * @product   highmaps
 * @apioption series.mappoint
 */

/**
 * An array of data points for the series. For the `mappoint` series
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
 * 2. An array of arrays with 2 values. In this case, the values correspond
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
 * 3. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.mappoint.turboThreshold),
 *    this option is not available.
 *    ```js
 *        data: [{
 *            x: 1,
 *            y: 7,
 *            name: "Point2",
 *            color: "#00FF00"
 *        }, {
 *            x: 1,
 *            y: 4,
 *            name: "Point1",
 *            color: "#FF00FF"
 *        }]
 *    ```
 *
 * @type      {Array<number|Array<number,(number|null)>|null|*>}
 * @extends   series.map.data
 * @excluding labelrank, middleX, middleY, path, value
 * @product   highmaps
 * @apioption series.mappoint.data
 */

/**
 * The geometry of a point.
 *
 * To achieve a better separation between the structure and the data,
 * it is recommended to use `mapData` to define the geometry instead
 * of defining it on the data points themselves.
 *
 * The geometry object is compatible to that of a `feature` in geoJSON, so
 * features of geoJSON can be passed directly into the `data`, optionally
 * after first filtering and processing it.
 *
 * @sample maps/series/mappoint-line-geometry/
 *         Map point and line geometry
 *
 * @type      {Object}
 * @since 9.3.0
 * @product   highmaps
 * @apioption series.mappoint.data.geometry
 */

/**
 * The geometry type, which in case of the `mappoint` series is always `Point`.
 *
 * @type      {string}
 * @since 9.3.0
 * @product   highmaps
 * @validvalue ["Point"]
 * @apioption series.mappoint.data.geometry.type
 */

/**
 * The geometry coordinates in terms of `[longitude, latitude]`.
 *
 * @type      {Highcharts.LonLatArray}
 * @since 9.3.0
 * @product   highmaps
 * @apioption series.mappoint.data.geometry.coordinates
 */

/**
 * The latitude of the point. Must be combined with the `lon` option
 * to work. Overrides `x` and `y` values.
 *
 * @sample {highmaps} maps/demo/mappoint-latlon/
 *         Point position by lat/lon
 *
 * @type      {number}
 * @since     1.1.0
 * @product   highmaps
 * @apioption series.mappoint.data.lat
 */

/**
 * The longitude of the point. Must be combined with the `lon` option
 * to work. Overrides `x` and `y` values.
 *
 * @sample {highmaps} maps/demo/mappoint-latlon/
 *         Point position by lat/lon
 *
 * @type      {number}
 * @since     1.1.0
 * @product   highmaps
 * @apioption series.mappoint.data.lon
 */

/**
 * The x coordinate of the point in terms of projected units.
 *
 * @sample {highmaps} maps/series/mapline-mappoint-path-xy/
 *         Map point demo
 *
 * @type      {number}
 * @product   highmaps
 * @apioption series.mappoint.data.x
 */

/**
 * The x coordinate of the point in terms of projected units.
 *
 * @sample {highmaps} maps/series/mapline-mappoint-path-xy/
 *         Map point demo
 *
 * @type      {number|null}
 * @product   highmaps
 * @apioption series.mappoint.data.y
 */

/**
* @type      {number}
* @product   highmaps
* @excluding borderColor, borderWidth
* @apioption plotOptions.mappoint
*/

''; // adds doclets above to transpiled file
