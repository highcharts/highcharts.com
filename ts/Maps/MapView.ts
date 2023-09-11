/* *
 *
 *  (c) 2010-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type AnimationOptions from '../Core/Animation/AnimationOptions';
import type BBoxObject from '../Core/Renderer/BBoxObject';
import type { GeoJSON, Polygon, TopoJSON } from './GeoJSON';
import type MapSeries from '../Series/Map/MapSeries';
import type MapPointOptions from '../Series/Map/MapPointOptions';
import type PositionObject from '../Core/Renderer/PositionObject';
import type ProjectionOptions from './ProjectionOptions';
import type {
    LonLatArray,
    MapBounds,
    MapViewInsetsOptions,
    MapViewOptions,
    MapViewPaddingType,
    ProjectedXY,
    ProjectedXYArray
} from './MapViewOptions';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../Core/Renderer/SVG/SVGPath';

import Chart from '../Core/Chart/Chart.js';
import defaultOptions from './MapViewOptionsDefault.js';
import defaultInsetsOptions from './MapViewInsetsOptionsDefault.js';
import GeoJSONModule from '../Extensions/GeoJSON.js';
const {
    topo2geo
} = GeoJSONModule;
import MapChart from '../Core/Chart/MapChart.js';
const {
    maps
} = MapChart;
import MU from './MapUtilities.js';
const {
    boundsFromPath,
    pointInPolygon
} = MU;

import Projection from './Projection.js';
import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject, isString } = TC;
const { merge } = OH;
const { addEvent, fireEvent } = EH;
const {
    clamp,
    pick,
    relativeLength
} = U;

type MapDataType = string|GeoJSON|TopoJSON|MapPointOptions[];

type SVGTransformType = {
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
};

/**
 * The world size in terms of 10k meters in the Web Mercator projection, to
 * match a 256 square tile to zoom level 0.
 * @private
 */
const worldSize = 400.979322;
const tileSize = 256;

// Compute the zoom from given bounds and the size of the playing field. Used in
// two places, hence the local function.
const zoomFromBounds = (b: MapBounds, playingField: BBoxObject): number => {
    const { width, height } = playingField,
        scaleToField = Math.max(
            (b.x2 - b.x1) / (width / tileSize),
            (b.y2 - b.y1) / (height / tileSize)
        );
    return Math.log(worldSize / scaleToField) / Math.log(2);
};

/*
const mergeCollections = <
    T extends Array<AnyRecord|undefined>
>(a: T, b: T): T => {
    b.forEach((newer, i): void => {
        // Only merge by id supported for now. We may consider later to support
        // more complex rules like those of `Chart.update` with `oneToOne`, but
        // it is probably not needed. Existing insets can be disabled by
        // overwriting the `geoBounds` with empty data.
        if (newer && isString(newer.id)) {
            const older = U.find(
                a,
                (aItem): boolean => (aItem && aItem.id) === newer.id
            );
            if (older) {
                const aIndex = a.indexOf(older);
                a[aIndex] = merge(older, newer);
            }
        }
    });
    return a;
};
*/

/**
 * The map view handles zooming and centering on the map, and various
 * client-side projection capabilities.
 *
 * On a chart instance of `MapChart`, the map view is available as `chart.mapView`.
 *
 * @class
 * @name Highcharts.MapView
 *
 * @param {Highcharts.MapChart} chart
 *        The MapChart instance
 * @param {Highcharts.MapViewOptions} options
 *        MapView options
 */
class MapView {
    public allowTransformAnimation: boolean = true;
    public center: LonLatArray;
    public fitToGeometryCache?: MapBounds;
    public geoMap?: GeoJSON;
    public group?: SVGElement;
    public insets: MapViewInset[] = [];
    public minZoom?: number;
    public options: MapViewOptions;
    public padding: [number, number, number, number] = [0, 0, 0, 0];
    public playingField: BBoxObject;
    public projection: Projection;
    public userOptions: DeepPartial<MapViewOptions>;
    public zoom: number;
    recommendedProjection: DeepPartial<ProjectionOptions>|undefined;
    recommendedMapView: DeepPartial<MapViewOptions>|undefined;

    public chart: Chart;

    protected eventsToUnbind: Array<Function> = [];


    /* *
     * Return the composite bounding box of a collection of bounding boxes
     */
    public static compositeBounds = (
        arrayOfBounds: MapBounds[]
    ): MapBounds|undefined => {
        if (arrayOfBounds.length) {
            return arrayOfBounds
                .slice(1)
                .reduce((acc, cur): MapBounds => {
                    acc.x1 = Math.min(acc.x1, cur.x1);
                    acc.y1 = Math.min(acc.y1, cur.y1);
                    acc.x2 = Math.max(acc.x2, cur.x2);
                    acc.y2 = Math.max(acc.y2, cur.y2);
                    return acc;
                }, merge(arrayOfBounds[0]));
        }
        return;
    };

    // Merge two collections of insets by the id
    private static mergeInsets(
        a: DeepPartial<MapViewInsetsOptions|undefined>[],
        b: DeepPartial<MapViewInsetsOptions|undefined>[]
    ): DeepPartial<MapViewInsetsOptions|undefined>[] {
        type DeepInsetOptions = DeepPartial<MapViewInsetsOptions|undefined>;
        const toObject = (
            insets: DeepInsetOptions[]
        ): Record<string, DeepInsetOptions> => {
            const ob = {} as Record<string, DeepInsetOptions>;
            insets.forEach((inset, i): void => {
                ob[inset && inset.id || `i${i}`] = inset;
            });
            return ob;
        };

        const insetsObj = merge(
                toObject(a),
                toObject(b)
            ),
            insets = Object
                .keys(insetsObj)
                .map((key): DeepInsetOptions => insetsObj[key]);

        return insets;
    }

    // Create MapViewInset instances from insets options
    private createInsets(): void {
        const options = this.options,
            insets = options.insets;
        if (insets) {
            insets.forEach((item): void => {
                const inset = new MapViewInset(
                    this,
                    merge(options.insetOptions, item)
                );
                this.insets.push(inset);
            });
        }
    }

    public constructor(
        chart: Chart,
        options?: DeepPartial<MapViewOptions>
    ) {
        let recommendedMapView: DeepPartial<MapViewOptions>|undefined;
        let recommendedProjection: DeepPartial<ProjectionOptions>|undefined;
        if (!(this instanceof MapViewInset)) {

            // Handle the global map and series-level mapData
            const geoMaps = [
                chart.options.chart.map,
                ...(chart.options.series || []).map(
                    (s): (MapDataType|undefined) => s.mapData
                )
            ]
                .map((mapData): GeoJSON|undefined => this.getGeoMap(mapData));


            const allGeoBounds: MapBounds[] = [];
            geoMaps.forEach((geoMap): void => {
                if (geoMap) {
                    // Use the first geo map as main
                    if (!recommendedMapView) {
                        recommendedMapView =
                            geoMap['hc-recommended-mapview'];
                    }

                    // Combine the bounding boxes of all loaded maps
                    if (geoMap.bbox) {
                        const [x1, y1, x2, y2] = geoMap.bbox;
                        allGeoBounds.push({ x1, y1, x2, y2 });
                    }
                }
            });

            // Get the composite bounds
            const geoBounds = (
                allGeoBounds.length &&
                MapView.compositeBounds(allGeoBounds)
            );

            // Provide a best-guess recommended projection if not set in
            // the map or in user options

            fireEvent(
                chart,
                'beforeMapViewInit',
                {
                    geoBounds
                },
                function (): void {
                    if (geoBounds) {
                        const { x1, y1, x2, y2 } = geoBounds;
                        recommendedProjection =
                            (x2 - x1 > 180 && y2 - y1 > 90) ?
                                // Wide angle, go for the world view
                                {
                                    name: 'EqualEarth'
                                } :
                                // Narrower angle, use a projection better
                                // suited for local view
                                {
                                    name: 'LambertConformalConic',
                                    parallels: [y1, y2],
                                    rotation: [-(x1 + x2) / 2]
                                };
                    }
                }
            );
            // Register the main geo map (from options.chart.map) if set
            this.geoMap = geoMaps[0];
        }

        this.userOptions = options || {};

        if (
            chart.options.mapView &&
            chart.options.mapView.recommendedMapView
        ) {
            recommendedMapView = chart.options.mapView.recommendedMapView;
        }

        const o = merge(
            defaultOptions,
            { projection: recommendedProjection },
            recommendedMapView,
            options
        );

        // Merge the inset collections by id, or index if id missing
        const recInsets = recommendedMapView && recommendedMapView.insets,
            optInsets = options && options.insets;
        if (recInsets && optInsets) {
            (o as any).insets = MapView.mergeInsets(recInsets, optInsets);
        }

        this.chart = chart;

        /**
         * The current center of the view in terms of `[longitude, latitude]`.
         * @name Highcharts.MapView#center
         * @readonly
         * @type {LonLatArray}
         */
        this.center = o.center;
        this.options = o;
        this.projection = new Projection(o.projection);

        // Initialize with full plot box so we don't have to check for undefined
        // every time we use it
        this.playingField = chart.plotBox;

        /**
         * The current zoom level of the view.
         * @name Highcharts.MapView#zoom
         * @readonly
         * @type {number}
         */
        this.zoom = o.zoom || 0;
        this.minZoom = o.minZoom;

        // Create the insets
        this.createInsets();

        // Initialize and respond to chart size changes
        this.eventsToUnbind.push(
            addEvent(chart, 'afterSetChartSize', (): void => {
                this.playingField = this.getField();
                if (
                    this.minZoom === void 0 || // When initializing the chart
                    this.minZoom === this.zoom // When resizing the chart
                ) {

                    this.fitToBounds(void 0, void 0, false);

                    if (
                        // Set zoom only when initializing the chart
                        // (do not overwrite when zooming in/out, #17082)
                        !this.chart.hasRendered &&
                        isNumber(this.userOptions.zoom)
                    ) {
                        this.zoom = this.userOptions.zoom;
                    }
                    if (this.userOptions.center) {
                        merge(true, this.center, this.userOptions.center);
                    }
                }
            })
        );

        this.setUpEvents();

    }

    /**
     * Fit the view to given bounds
     *
     * @function Highcharts.MapView#fitToBounds
     * @param {Object} bounds
     *        Bounds in terms of projected units given as  `{ x1, y1, x2, y2 }`.
     *        If not set, fit to the bounds of the current data set
     * @param {number|string} [padding=0]
     *        Padding inside the bounds. A number signifies pixels, while a
     *        percentage string (like `5%`) can be used as a fraction of the
     *        plot area size.
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart immediately
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        What animation to use for redraw
     */
    public fitToBounds(
        bounds?: MapBounds,
        padding?: MapViewPaddingType,
        redraw = true,
        animation?: boolean|Partial<AnimationOptions>
    ): void {

        const b = bounds || this.getProjectedBounds();

        if (b) {

            const pad = pick(padding, bounds ? 0 : this.options.padding),
                fullField = this.getField(false),
                padArr = isArray(pad) ? pad : [pad, pad, pad, pad];

            this.padding = [
                relativeLength(padArr[0], fullField.height),
                relativeLength(padArr[1], fullField.width),
                relativeLength(padArr[2], fullField.height),
                relativeLength(padArr[3], fullField.width)
            ];

            // Apply the playing field, corrected with padding
            this.playingField = this.getField();

            const zoom = zoomFromBounds(b, this.playingField);

            // Reset minZoom when fitting to natural bounds
            if (!bounds) {
                this.minZoom = zoom;
            }

            const center = this.projection.inverse([
                (b.x2 + b.x1) / 2,
                (b.y2 + b.y1) / 2
            ]);

            this.setView(center, zoom, redraw, animation);
        }
    }

    public getField(padded: boolean = true): BBoxObject {
        const padding = padded ? this.padding : [0, 0, 0, 0];
        return {
            x: padding[3],
            y: padding[0],
            width: this.chart.plotWidth - padding[1] - padding[3],
            height: this.chart.plotHeight - padding[0] - padding[2]
        };
    }

    public getGeoMap(map?: MapDataType): GeoJSON|undefined {
        if (isString(map)) {
            if (maps[map] && maps[map].type === 'Topology') {
                return topo2geo(maps[map]);
            }

            return maps[map];
        }
        if (isObject(map, true)) {
            if (map.type === 'FeatureCollection') {
                return map;
            }
            if (map.type === 'Topology') {
                return topo2geo(map);
            }
        }
    }

    public getMapBBox(): BBoxObject|undefined {
        const bounds = this.getProjectedBounds(),
            scale = this.getScale();

        if (bounds) {
            const padding = this.padding,
                p1 = this.projectedUnitsToPixels({
                    x: bounds.x1,
                    y: bounds.y2
                }),
                width = (
                    (bounds.x2 - bounds.x1) * scale +
                    padding[1] + padding[3]
                ),
                height = (
                    (bounds.y2 - bounds.y1) * scale +
                    padding[0] + padding[2]
                );

            return {
                width,
                height,
                x: p1.x - padding[3],
                y: p1.y - padding[0]
            };
        }

    }

    public getProjectedBounds(): MapBounds|undefined {
        const projection = this.projection;

        const allBounds = this.chart.series.reduce(
            (acc, s): MapBounds[] => {
                const bounds = s.getProjectedBounds && s.getProjectedBounds();
                if (
                    bounds &&
                    (s as MapSeries).options.affectsMapView !== false
                ) {
                    acc.push(bounds);
                }
                return acc;
            },
            [] as MapBounds[]
        );

        // The bounds option
        const fitToGeometry = this.options.fitToGeometry;
        if (fitToGeometry) {
            if (!this.fitToGeometryCache) {
                if (fitToGeometry.type === 'MultiPoint') {
                    const positions = fitToGeometry.coordinates
                            .map((lonLat): ProjectedXYArray =>
                                projection.forward(lonLat)
                            ),
                        xs = positions.map((pos): number => pos[0]),
                        ys = positions.map((pos): number => pos[1]);

                    this.fitToGeometryCache = {
                        x1: Math.min.apply(0, xs),
                        x2: Math.max.apply(0, xs),
                        y1: Math.min.apply(0, ys),
                        y2: Math.max.apply(0, ys)
                    };

                } else {
                    this.fitToGeometryCache = boundsFromPath(
                        projection.path(fitToGeometry)
                    );
                }
            }
            return this.fitToGeometryCache;
        }

        return this.projection.bounds || MapView.compositeBounds(allBounds);
    }

    public getScale(): number {
        // A zoom of 0 means the world (360x360 degrees) fits in a 256x256 px
        // tile
        return (tileSize / worldSize) * Math.pow(2, this.zoom);
    }

    // Calculate the SVG transform to be applied to series groups
    public getSVGTransform(): SVGTransformType {
        const { x, y, width, height } = this.playingField,
            projectedCenter = this.projection.forward(this.center),
            flipFactor = this.projection.hasCoordinates ? -1 : 1,
            scaleX = this.getScale(),
            scaleY = scaleX * flipFactor,
            translateX = x + width / 2 - projectedCenter[0] * scaleX,
            translateY = y + height / 2 - projectedCenter[1] * scaleY;

        return { scaleX, scaleY, translateX, translateY };
    }

    /**
     * Convert map coordinates in longitude/latitude to pixels
     *
     * @function Highcharts.MapView#lonLatToPixels
     * @since 10.0.0
     * @param  {Highcharts.MapLonLatObject} lonLat
     *         The map coordinates
     * @return {Highcharts.PositionObject|undefined}
     *         The pixel position
     */
    public lonLatToPixels(
        lonLat: Highcharts.MapLonLatObject
    ): PositionObject|undefined {
        const pos = this.lonLatToProjectedUnits(lonLat);
        if (pos) {
            return this.projectedUnitsToPixels(pos);
        }
    }

    /**
     * Get projected units from longitude/latitude. Insets are accounted for.
     * Returns an object with x and y values corresponding to positions on the
     * projected plane.
     *
     * @requires modules/map
     *
     * @function Highcharts.MapView#lonLatToProjectedUnits
     *
     * @since 10.0.0
     * @sample maps/series/latlon-to-point/ Find a point from lon/lat
     *
     * @param {Highcharts.MapLonLatObject} lonLat Coordinates.
     *
     * @return {Highcharts.ProjectedXY} X and Y coordinates in terms of
     *      projected values
     */
    public lonLatToProjectedUnits(
        lonLat: Highcharts.MapLonLatObject
    ): ProjectedXY|undefined {
        const chart = this.chart,
            mapTransforms = chart.mapTransforms;

        // Legacy, built-in transforms
        if (mapTransforms) {
            for (const transform in mapTransforms) {
                if (
                    Object.hasOwnProperty.call(mapTransforms, transform) &&
                    mapTransforms[transform].hitZone
                ) {
                    const coords = chart.transformFromLatLon(
                        lonLat,
                        mapTransforms[transform]
                    );
                    if (coords && pointInPolygon(
                        coords,
                        mapTransforms[transform].hitZone.coordinates[0]
                    )) {
                        return coords;
                    }
                }
            }

            return chart.transformFromLatLon(
                lonLat,
                mapTransforms['default'] // eslint-disable-line dot-notation
            );
        }

        // Handle insets
        for (const inset of this.insets) {
            if (
                inset.options.geoBounds &&
                pointInPolygon(
                    { x: lonLat.lon, y: lonLat.lat },
                    inset.options.geoBounds.coordinates[0]
                )
            ) {
                const insetProjectedPoint = inset.projection.forward(
                        [lonLat.lon, lonLat.lat]
                    ),
                    pxPoint = inset.projectedUnitsToPixels(
                        { x: insetProjectedPoint[0], y: insetProjectedPoint[1] }
                    );

                return this.pixelsToProjectedUnits(pxPoint);
            }
        }

        const point = this.projection.forward([lonLat.lon, lonLat.lat]);
        if (!point.outside) {
            return { x: point[0], y: point[1] };
        }
    }

    /**
     * Calculate longitude/latitude values for a point or position. Returns an
     * object with the numeric properties `lon` and `lat`.
     *
     * @requires modules/map
     *
     * @function Highcharts.MapView#projectedUnitsToLonLat
     *
     * @since 10.0.0
     *
     * @sample maps/demo/latlon-advanced/ Advanced lat/lon demo
     *
     * @param {Highcharts.Point|Highcharts.ProjectedXY} point
     *        A `Point` instance or anything containing `x` and `y` properties
     *        with numeric values.
     *
     * @return {Highcharts.MapLonLatObject|undefined} An object with `lat` and
     *         `lon` properties.
     */
    public projectedUnitsToLonLat(
        point: ProjectedXY
    ): Highcharts.MapLonLatObject|undefined {
        const chart = this.chart,
            mapTransforms = chart.mapTransforms;

        // Legacy, built-in transforms
        if (mapTransforms) {
            for (const transform in mapTransforms) {
                if (
                    Object.hasOwnProperty.call(mapTransforms, transform) &&
                    mapTransforms[transform].hitZone &&
                    pointInPolygon(
                        point,
                        mapTransforms[transform].hitZone.coordinates[0]
                    )
                ) {
                    return chart.transformToLatLon(
                        point,
                        mapTransforms[transform]
                    );
                }
            }

            return chart.transformToLatLon(
                point,
                mapTransforms['default'] // eslint-disable-line dot-notation
            );
        }

        const pxPoint = this.projectedUnitsToPixels(point);
        for (const inset of this.insets) {
            if (
                inset.hitZone &&
                pointInPolygon(pxPoint, inset.hitZone.coordinates[0])
            ) {
                const insetProjectedPoint = inset
                        .pixelsToProjectedUnits(pxPoint),
                    coordinates = inset.projection.inverse(
                        [insetProjectedPoint.x, insetProjectedPoint.y]
                    );
                return { lon: coordinates[0], lat: coordinates[1] };
            }
        }

        const coordinates = this.projection.inverse([point.x, point.y]);
        return { lon: coordinates[0], lat: coordinates[1] };
    }

    public redraw(animation?: boolean|Partial<AnimationOptions>): void {
        this.chart.series.forEach((s): void => {
            if (s.useMapGeometry) {
                s.isDirty = true;
            }
        });

        this.chart.redraw(animation);
    }

    /**
     * Set the view to given center and zoom values.
     * @function Highcharts.MapView#setView
     * @param {Highcharts.LonLatArray|undefined} center
     *        The center point
     * @param {number} zoom
     *        The zoom level
     * @param {boolean} [redraw=true]
     *        Whether to redraw immediately
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        Animation options for the redraw
     *
     * @sample maps/mapview/setview
     *        Set the view programmatically
     */
    public setView(
        center?: LonLatArray,
        zoom?: number,
        redraw = true,
        animation?: boolean|Partial<AnimationOptions>
    ): void {
        if (center) {
            this.center = center;
        }
        if (typeof zoom === 'number') {
            if (typeof this.minZoom === 'number') {
                zoom = Math.max(zoom, this.minZoom);
            }
            if (typeof this.options.maxZoom === 'number') {
                zoom = Math.min(zoom, this.options.maxZoom);
            }

            // Use isNumber to prevent Infinity (#17205)
            if (isNumber(zoom)) {
                this.zoom = zoom;
            }
        }

        const bounds = this.getProjectedBounds();
        if (bounds) {
            const projectedCenter = this.projection.forward(this.center),
                { x, y, width, height } = this.playingField,
                scale = this.getScale(),
                bottomLeft = this.projectedUnitsToPixels({
                    x: bounds.x1,
                    y: bounds.y1
                }),
                topRight = this.projectedUnitsToPixels({
                    x: bounds.x2,
                    y: bounds.y2
                }),
                boundsCenterProjected = [
                    (bounds.x1 + bounds.x2) / 2,
                    (bounds.y1 + bounds.y2) / 2
                ],
                isDrilling = this.chart.series.some(
                    (series): boolean | undefined =>
                        series.isDrilling);

            if (!isDrilling) {
                // Constrain to data bounds

                // Pixel coordinate system is reversed vs projected
                const x1 = bottomLeft.x,
                    y1 = topRight.y,
                    x2 = topRight.x,
                    y2 = bottomLeft.y;

                // Map smaller than plot area, center it
                if (x2 - x1 < width) {
                    projectedCenter[0] = boundsCenterProjected[0];

                // Off west
                } else if (x1 < x && x2 < x + width) {
                    // Adjust eastwards
                    projectedCenter[0] +=
                        Math.max(x1 - x, x2 - width - x) / scale;

                // Off east
                } else if (x2 > x + width && x1 > x) {
                    // Adjust westwards
                    projectedCenter[0] +=
                        Math.min(x2 - width - x, x1 - x) / scale;
                }

                // Map smaller than plot area, center it
                if (y2 - y1 < height) {
                    projectedCenter[1] = boundsCenterProjected[1];

                // Off north
                } else if (y1 < y && y2 < y + height) {
                    // Adjust southwards
                    projectedCenter[1] -=
                        Math.max(y1 - y, y2 - height - y) / scale;

                // Off south
                } else if (y2 > y + height && y1 > y) {
                    // Adjust northwards
                    projectedCenter[1] -=
                        Math.min(y2 - height - y, y1 - y) / scale;
                }

                this.center = this.projection.inverse(projectedCenter);
            }


            this.insets.forEach((inset): void => {
                if (inset.options.field) {
                    inset.hitZone = inset.getHitZone();
                    inset.playingField = inset.getField();
                }
            });

            this.render();
        }

        fireEvent(this, 'afterSetView');

        if (redraw) {
            this.redraw(animation);
        }
    }

    /**
     * Convert projected units to pixel position
     *
     * @function Highcharts.MapView#projectedUnitsToPixels
     * @param {Highcharts.PositionObject} pos
     *        The position in projected units
     * @return {Highcharts.PositionObject} The position in pixels
     */
    public projectedUnitsToPixels(pos: ProjectedXY): PositionObject {
        const scale = this.getScale(),
            projectedCenter = this.projection.forward(this.center),
            field = this.playingField,
            centerPxX = field.x + field.width / 2,
            centerPxY = field.y + field.height / 2;

        const x = centerPxX - scale * (projectedCenter[0] - pos.x);
        const y = centerPxY + scale * (projectedCenter[1] - pos.y);

        return { x, y };
    }

    /**
     * Convert pixel position to longitude and latitude.
     *
     * @function Highcharts.MapView#pixelsToLonLat
     * @since 10.0.0
     * @param  {Highcharts.PositionObject} pos
     *         The position in pixels
     * @return {Highcharts.MapLonLatObject|undefined}
     *         The map coordinates
     */
    public pixelsToLonLat(
        pos: PositionObject
    ): Highcharts.MapLonLatObject|undefined {
        return this.projectedUnitsToLonLat(this.pixelsToProjectedUnits(pos));
    }

    /**
     * Convert pixel position to projected units
     *
     * @function Highcharts.MapView#pixelsToProjectedUnits
     * @param {Highcharts.PositionObject} pos
     *        The position in pixels
     * @return {Highcharts.PositionObject} The position in projected units
     */
    public pixelsToProjectedUnits(pos: PositionObject): ProjectedXY {
        const { x, y } = pos,
            scale = this.getScale(),
            projectedCenter = this.projection.forward(this.center),
            field = this.playingField,
            centerPxX = field.x + field.width / 2,
            centerPxY = field.y + field.height / 2;

        const projectedX = projectedCenter[0] + (x - centerPxX) / scale;
        const projectedY = projectedCenter[1] - (y - centerPxY) / scale;

        return { x: projectedX, y: projectedY };
    }

    public setUpEvents(): void {

        const { chart } = this;

        // Set up panning for maps. In orthographic projections the globe will
        // rotate, otherwise adjust the map center.
        let mouseDownCenterProjected: [number, number];
        let mouseDownKey: string;
        let mouseDownRotation: number[]|undefined;
        const onPan = (e: PointerEvent): void => {

            const pinchDown = chart.pointer.pinchDown,
                projection = this.projection;

            let {
                mouseDownX,
                mouseDownY
            } = chart;

            if (pinchDown.length === 1) {
                mouseDownX = pinchDown[0].chartX;
                mouseDownY = pinchDown[0].chartY;
            }

            if (
                typeof mouseDownX === 'number' &&
                typeof mouseDownY === 'number'
            ) {
                const key = `${mouseDownX},${mouseDownY}`,
                    { chartX, chartY } = (e as any).originalEvent;

                // Reset starting position
                if (key !== mouseDownKey) {
                    mouseDownKey = key;

                    mouseDownCenterProjected = this.projection
                        .forward(this.center);

                    mouseDownRotation = (
                        this.projection.options.rotation || [0, 0]
                    ).slice();
                }

                // Get the natural zoom level of the projection itself when
                // zoomed to view the full world
                const worldBounds = projection.def && projection.def.bounds,
                    worldZoom = (
                        worldBounds &&
                        zoomFromBounds(worldBounds, this.playingField)
                    ) || -Infinity;

                // Panning rotates the globe
                if (
                    projection.options.name === 'Orthographic' &&

                    // ... but don't rotate if we're loading only a part of the
                    // world
                    (this.minZoom || Infinity) < worldZoom * 1.3
                ) {

                    // Empirical ratio where the globe rotates roughly the same
                    // speed as moving the pointer across the center of the
                    // projection
                    const ratio = 440 / (this.getScale() * Math.min(
                        chart.plotWidth,
                        chart.plotHeight
                    ));

                    if (mouseDownRotation) {
                        const lon = (mouseDownX - chartX) * ratio -
                                mouseDownRotation[0],
                            lat = clamp(
                                -mouseDownRotation[1] -
                                    (mouseDownY - chartY) * ratio,
                                -80,
                                80
                            ),
                            zoom = this.zoom;
                        this.update({
                            projection: {
                                rotation: [-lon, -lat]
                            }
                        }, false);
                        this.fitToBounds(void 0, void 0, false);
                        this.zoom = zoom;
                        chart.redraw(false);

                    }

                // #17925 Skip NaN values
                } else if (isNumber(chartX) && isNumber(chartY)) {
                    // #17238
                    const scale = this.getScale(),
                        flipFactor = this.projection.hasCoordinates ? 1 : -1;

                    const newCenter = this.projection.inverse([
                        mouseDownCenterProjected[0] +
                            (mouseDownX - chartX) / scale,
                        mouseDownCenterProjected[1] -
                            (mouseDownY - chartY) / scale * flipFactor
                    ]);

                    // #19190 Skip NaN coords
                    if (!isNaN(newCenter[0] + newCenter[1])) {
                        this.setView(newCenter, void 0, true, false);
                    }
                }

                e.preventDefault();
            }
        };
        addEvent(chart, 'pan', onPan);
        addEvent(chart, 'touchpan', onPan);


        // Perform the map zoom by selection
        addEvent(chart, 'selection', (evt: PointerEvent): void => {
            // Zoom in
            if (!(evt as any).resetSelection) {
                const x = evt.x - chart.plotLeft;
                const y = evt.y - chart.plotTop;
                const { y: y1, x: x1 } = this.pixelsToProjectedUnits({ x, y });
                const { y: y2, x: x2 } = this.pixelsToProjectedUnits(
                    { x: x + evt.width, y: y + evt.height }
                );
                this.fitToBounds(
                    { x1, y1, x2, y2 },
                    void 0,
                    true,
                    (evt as any).originalEvent.touches ?
                        // On touch zoom, don't animate, since we're already in
                        // transformed zoom preview
                        false :
                        // On mouse zoom, obey the chart-level animation
                        void 0
                );

                // Only for mouse. Touch users can pinch out.
                if (!/^touch/.test(((evt as any).originalEvent.type))) {
                    chart.showResetZoom();
                }

                evt.preventDefault();

            // Reset zoom
            } else {
                this.zoomBy();
            }
        });

    }

    public render(): void {

        // We need a group for the insets
        if (!this.group) {
            this.group = this.chart.renderer.g('map-view')
                .attr({ zIndex: 4 })
                .add();
        }
    }

    /**
     * Update the view with given options
     *
     * @function Highcharts.MapView#update
     *
     * @param {Partial<Highcharts.MapViewOptions>} options
     *        The new map view options to apply
     * @param {boolean} [redraw=true]
     *        Whether to redraw immediately
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        The animation to apply to a the redraw
     */
    public update(
        options: DeepPartial<MapViewOptions>,
        redraw: boolean = true,
        animation?: (boolean|Partial<AnimationOptions>)
    ): void {
        const newProjection = options.projection;
        let isDirtyProjection = newProjection && (
                (
                    Projection.toString(newProjection) !==
                    Projection.toString(this.options.projection)
                )
            ),
            isDirtyInsets = false;

        merge(true, this.userOptions, options);
        merge(true, this.options, options);

        // If anything changed with the insets, destroy them all and create
        // again below
        if ('insets' in options) {
            this.insets.forEach((inset): void => inset.destroy());
            this.insets.length = 0;
            isDirtyInsets = true;
        }

        if (isDirtyProjection || 'fitToGeometry' in options) {
            delete this.fitToGeometryCache;
        }

        if (isDirtyProjection || isDirtyInsets) {
            this.chart.series.forEach((series): void => {
                const groups = series.transformGroups;
                if (series.clearBounds) {
                    series.clearBounds();
                }
                series.isDirty = true;
                series.isDirtyData = true;

                // Destroy inset transform groups
                if (isDirtyInsets && groups) {
                    while (groups.length > 1) {
                        const group = groups.pop();
                        if (group) {
                            group.destroy();
                        }
                    }
                }
            });

            if (isDirtyProjection) {
                this.projection = new Projection(this.options.projection);
            }

            // Create new insets
            if (isDirtyInsets) {
                this.createInsets();
            }

            // Fit to natural bounds if center/zoom are not explicitly given
            if (
                !options.center &&
                // do not fire fitToBounds if user don't want to set zoom
                Object.hasOwnProperty.call(
                    options,
                    'zoom'
                ) &&
                !isNumber(options.zoom)
            ) {
                this.fitToBounds(void 0, void 0, false);
            }
        }

        if (options.center || isNumber(options.zoom)) {
            this.setView(this.options.center, options.zoom, false);
        } else if ('fitToGeometry' in options) {
            this.fitToBounds(void 0, void 0, false);
        }

        if (redraw) {
            this.chart.redraw(animation);
        }

    }

    /**
     * Zoom the map view by a given number
     *
     * @function Highcharts.MapView#zoomBy
     *
     * @param {number|undefined} [howMuch]
     *        The amount of zoom to apply. 1 zooms in on half the current view,
     *        -1 zooms out. Pass `undefined` to zoom to the full bounds of the
     *        map.
     * @param {Highcharts.LonLatArray} [coords]
     *        Optional map coordinates to keep fixed
     * @param {Array<number>} [chartCoords]
     *        Optional chart coordinates to keep fixed, in pixels
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        The animation to apply to a the redraw
     */
    public zoomBy(
        howMuch?: number,
        coords?: LonLatArray,
        chartCoords?: [number, number],
        animation?: boolean|Partial<AnimationOptions>
    ): void {
        const chart = this.chart;
        const projectedCenter = this.projection.forward(this.center);

        // let { x, y } = coords || {};
        let [x, y] = coords ? this.projection.forward(coords) : [];


        if (typeof howMuch === 'number') {
            const zoom = this.zoom + howMuch;

            let center: LonLatArray|undefined;

            // Keep chartX and chartY stationary - convert to lat and lng
            if (chartCoords) {
                const [chartX, chartY] = chartCoords;
                const scale = this.getScale();

                const offsetX = chartX - chart.plotLeft - chart.plotWidth / 2;
                const offsetY = chartY - chart.plotTop - chart.plotHeight / 2;
                x = projectedCenter[0] + offsetX / scale;
                y = projectedCenter[1] + offsetY / scale;
            }

            // Keep lon and lat stationary by adjusting the center
            if (typeof x === 'number' && typeof y === 'number') {
                const scale = 1 - Math.pow(2, this.zoom) / Math.pow(2, zoom);

                // const projectedCenter = this.projection.forward(this.center);

                const offsetX = projectedCenter[0] - x;
                const offsetY = projectedCenter[1] - y;

                projectedCenter[0] -= offsetX * scale;
                projectedCenter[1] += offsetY * scale;

                center = this.projection.inverse(projectedCenter);
            }

            this.setView(center, zoom, void 0, animation);

        // Undefined howMuch => reset zoom
        } else {
            this.fitToBounds(void 0, void 0, void 0, animation);
        }

    }
}

// Putting this in the same file due to circular dependency with MapView
class MapViewInset extends MapView {

    public allBounds: MapBounds[];
    public border?: SVGElement;
    public geoBoundsProjectedBox?: MapBounds;
    public geoBoundsProjectedPolygon?: Array<Array<number>>;
    public hitZone?: Polygon;
    public id?: string;
    public options: MapViewInsetsOptions;
    public mapView: MapView;

    public constructor(
        mapView: MapView,
        options: DeepPartial<MapViewInsetsOptions>
    ) {
        super(mapView.chart, options);

        this.id = options.id;
        this.mapView = mapView;
        this.options = merge(defaultInsetsOptions, options);

        this.allBounds = [];

        if (this.options.geoBounds) {
            // The path in projected units in the map view's main projection.
            // This is used for hit testing where the points should render.
            const path = mapView.projection.path(this.options.geoBounds);
            this.geoBoundsProjectedBox = boundsFromPath(path);
            this.geoBoundsProjectedPolygon = path.map(
                (segment): [number, number] => [
                    segment[1] || 0,
                    segment[2] || 0
                ]
            );
        }
    }

    // Get the playing field in pixels
    getField(padded: boolean = true): BBoxObject {
        const hitZone = this.hitZone;
        if (hitZone) {
            const padding = padded ? this.padding : [0, 0, 0, 0],
                polygon = hitZone.coordinates[0],
                xs = polygon.map((xy): number => xy[0]),
                ys = polygon.map((xy): number => xy[1]),
                x = Math.min.apply(0, xs) + padding[3],
                x2 = Math.max.apply(0, xs) - padding[1],
                y = Math.min.apply(0, ys) + padding[0],
                y2 = Math.max.apply(0, ys) - padding[2];

            if (isNumber(x) && isNumber(y)) {
                return {
                    x,
                    y,
                    width: x2 - x,
                    height: y2 - y
                };
            }
        }

        // Fall back to plot area
        return super.getField.call(this, padded);

    }

    // Get the hit zone in pixels
    getHitZone(): Polygon|undefined {
        const { chart, mapView, options } = this,
            { coordinates } = options.field || {};
        if (coordinates) {
            let polygon = coordinates[0];
            if (options.units === 'percent') {
                const relativeTo = options.relativeTo === 'mapBoundingBox' &&
                    mapView.getMapBBox() ||
                    merge(chart.plotBox, { x: 0, y: 0 });

                polygon = polygon.map((xy): [number, number] => [
                    relativeLength(`${xy[0]}%`, relativeTo.width, relativeTo.x),
                    relativeLength(`${xy[1]}%`, relativeTo.height, relativeTo.y)
                ]);
            }
            return {
                type: 'Polygon',
                coordinates: [polygon]
            };
        }
    }

    getProjectedBounds(): MapBounds|undefined {
        return MapView.compositeBounds(this.allBounds);
    }

    // Determine whether a point on the main projected plane is inside the
    // geoBounds of the inset.
    isInside(point: ProjectedXY): boolean {
        const { geoBoundsProjectedBox, geoBoundsProjectedPolygon } = this;

        return Boolean(
            // First we do a pre-pass to check whether the test point is inside
            // the rectangular bounding box of the polygon. This is less
            // expensive and will rule out most cases.
            geoBoundsProjectedBox &&
            point.x >= geoBoundsProjectedBox.x1 &&
            point.x <= geoBoundsProjectedBox.x2 &&
            point.y >= geoBoundsProjectedBox.y1 &&
            point.y <= geoBoundsProjectedBox.y2 &&
            // Next, do the more expensive check whether the point is inside the
            // polygon itself.
            geoBoundsProjectedPolygon &&
            pointInPolygon(point, geoBoundsProjectedPolygon)
        );
    }

    // Render the map view inset with the border path
    render(): void {
        const { chart, mapView, options } = this,
            borderPath = options.borderPath || options.field;

        if (borderPath && mapView.group) {
            let animate = true;
            if (!this.border) {
                this.border = chart.renderer
                    .path()
                    .addClass('highcharts-mapview-inset-border')
                    .add(mapView.group);
                animate = false;
            }

            if (!chart.styledMode) {
                this.border.attr({
                    stroke: options.borderColor,
                    'stroke-width': options.borderWidth
                });
            }

            const crisp = Math.round(this.border.strokeWidth()) % 2 / 2,
                field = (
                    options.relativeTo === 'mapBoundingBox' &&
                    mapView.getMapBBox()
                ) || mapView.playingField;

            const d = (borderPath.coordinates || []).reduce(
                (d, lineString): SVGPath =>
                    lineString.reduce((d, point, i): SVGPath => {
                        let [x, y] = point;
                        if (options.units === 'percent') {
                            x = chart.plotLeft + relativeLength(
                                `${x}%`,
                                field.width,
                                field.x
                            );
                            y = chart.plotTop + relativeLength(
                                `${y}%`,
                                field.height,
                                field.y
                            );
                        }
                        x = Math.floor(x) + crisp;
                        y = Math.floor(y) + crisp;
                        d.push(i === 0 ? ['M', x, y] : ['L', x, y]);
                        return d;
                    }, d)
                ,
                [] as SVGPath
            );

            // Apply the border path
            this.border[animate ? 'animate' : 'attr']({ d });
        }
    }

    public destroy(): void {
        if (this.border) {
            this.border = this.border.destroy();
        }
        this.eventsToUnbind.forEach((f): void => f());
    }

    // No chart-level events for insets
    setUpEvents(): void {}

}

// Initialize the MapView after initialization, but before firstRender
addEvent(MapChart, 'afterInit', function (): void {
    /**
     * The map view handles zooming and centering on the map, and various
     * client-side projection capabilities.
     *
     * @name Highcharts.MapChart#mapView
     * @type {Highcharts.MapView|undefined}
     */
    this.mapView = new MapView(this, this.options.mapView);
}, { order: 0 });


export default MapView;
