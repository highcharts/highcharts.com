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

import type {
    AnimationOptions,
    AnimationStepCallbackFunction
} from '../../Core/Animation/AnimationOptions';
import type ColorType from '../../Core/Color/ColorType';
import type ColumnPoint from '../Column/ColumnPoint';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type { MapDataType } from '../../Maps/GeoJSON';
import type { MapBounds } from '../../Maps/MapViewOptions';
import type MapPointOptions from './MapPointOptions';
import type MapSeriesOptions from './MapSeriesOptions';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type {
    SeriesTypeOptions
} from '../../Core/Series/SeriesType';

import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject, stop } = A;
import ColorMapComposition from '../ColorMapComposition.js';
import CU from '../CenteredUtilities.js';
import DataTableCore from '../../Data/DataTableCore.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import MapChart from '../../Core/Chart/MapChart.js';
const { splitPath } = MapChart;
import MapPoint from './MapPoint.js';
import MapSeriesDefaults from './MapSeriesDefaults.js';
import MapView from '../../Maps/MapView.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    // Indirect dependency to keep product size low
    column: ColumnSeries,
    scatter: ScatterSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    extend,
    find,
    fireEvent,
    getNestedProperty,
    isArray,
    defined,
    isNumber,
    isObject,
    merge,
    objectEach,
    pick,
    splat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        clearBounds?(): void;
        getProjectedBounds?(): MapBounds|undefined;
        mapTitle?: string;
        transformGroups?: Array<SVGElement>|undefined;
        useMapGeometry?: boolean;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        /** @requires modules/map */
        mapData?: MapDataType;
    }
    interface SeriesStateHoverOptions
    {
        brightness?: number;
        color?: ColorType;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.map
 *
 * @augments Highcharts.Series
 */
class MapSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions = merge(
        ScatterSeries.defaultOptions,
        MapSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    // public baseView?: { center: Highcharts.LonLatArray; zoom: number };

    public bounds?: MapBounds;

    public chart!: MapChart;

    public data!: Array<MapPoint>;

    public group!: SVGElement;

    public joinBy!: Array<string>;

    public mapData?: unknown;

    public mapMap?: AnyRecord;

    public mapTitle?: string;

    public options!: MapSeriesOptions;

    public pointAttrToOptions?: Record<string, string>;

    public points!: Array<MapPoint>;

    public processedData: Array<(
        MapPointOptions|PointOptions|PointShortOptions
    )> = [];

    public transformGroups: Array<SVGElement>|undefined;

    public valueData?: Array<number>;

    public valueMax?: number;

    public valueMin?: number;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * The initial animation for the map series. By default, animation is
     * disabled.
     * @private
     */
    public animate(init?: boolean): void {
        const { chart, group } = this,
            animation = animObject(this.options.animation);

        // Initialize the animation
        if (init) {

            // Scale down the group and place it in the center
            group.attr({
                translateX: chart.plotLeft + chart.plotWidth / 2,
                translateY: chart.plotTop + chart.plotHeight / 2,
                scaleX: 0.001, // #1499
                scaleY: 0.001
            });

        // Run the animation
        } else {
            group.animate({
                translateX: chart.plotLeft,
                translateY: chart.plotTop,
                scaleX: 1,
                scaleY: 1
            }, animation);
        }
    }

    public clearBounds(): void {
        this.points.forEach((point): void => {
            delete point.bounds;
            delete point.insetIndex;
            delete point.projectedPath;
        });
        delete this.bounds;
    }

    /**
     * Allow a quick redraw by just translating the area group. Used for zooming
     * and panning in capable browsers.
     * @private
     */
    public doFullTranslate(): boolean {
        return Boolean(
            this.isDirtyData ||
            this.chart.isResizing ||
            !this.hasRendered
        );
    }

    /**
     * Draw the data labels. Special for maps is the time that the data labels
     * are drawn (after points), and the clipping of the dataLabelsGroup.
     * @private
     */
    public drawMapDataLabels(): void {
        super.drawDataLabels();
        if (this.dataLabelsGroup) {
            this.dataLabelsGroup.clip(this.chart.clipRect);
        }
    }

    /**
     * Use the drawPoints method of column, that is able to handle simple
     * shapeArgs. Extend it by assigning the tooltip position.
     * @private
     */
    public drawPoints(): void {
        const series = this,
            { chart, group, transformGroups = [] } = this,
            { mapView, renderer } = chart;

        if (!mapView) {
            return;
        }

        // Set groups that handle transform during zooming and panning in order
        // to preserve clipping on series.group
        this.transformGroups = transformGroups;
        if (!transformGroups[0]) {
            transformGroups[0] = renderer.g().add(group);
        }
        for (let i = 0, iEnd = mapView.insets.length; i < iEnd; ++i) {
            if (!transformGroups[i + 1]) {
                transformGroups.push(renderer.g().add(group));
            }
        }

        // Draw the shapes again
        if (this.doFullTranslate()) {

            // Individual point actions.
            this.points.forEach((point): void => {

                const { graphic } = point;

                // Points should be added in the corresponding transform group
                point.group = transformGroups[
                    typeof point.insetIndex === 'number' ?
                        point.insetIndex + 1 :
                        0
                ];

                // When the point has been moved between insets after
                // MapView.update
                if (graphic && graphic.parentGroup !== point.group) {
                    graphic.add(point.group);
                }
            });

            // Draw the points
            ColumnSeries.prototype.drawPoints.apply(this);

            // Add class names
            this.points.forEach((point): void => {
                const graphic = point.graphic;

                if (graphic) {
                    const animate = graphic.animate;
                    let className = '';
                    if (point.name) {
                        className +=
                            'highcharts-name-' +
                            point.name.replace(/ /g, '-').toLowerCase();
                    }
                    if (point.properties?.['hc-key']) {
                        className +=
                            ' highcharts-key-' +
                            point.properties['hc-key'].toString().toLowerCase();
                    }
                    if (className) {
                        graphic.addClass(className);
                    }

                    // In styled mode, apply point colors by CSS
                    if (chart.styledMode) {
                        graphic.css(
                            this.pointAttribs(
                                point,
                                point.selected && 'select' || void 0
                            ) as CSSObject
                        );
                    }

                    // If the map point is not visible and is not null (e.g.
                    // hidden by data classes), then the point should be
                    // visible, but without value
                    graphic.attr({
                        visibility: (
                            point.visible ||
                            (!point.visible && !point.isNull)
                        ) ? 'inherit' : 'hidden'
                    });

                    graphic.animate = function (
                        params,
                        options, complete
                    ): SVGElement {

                        const animateIn = (
                                isNumber(params['stroke-width']) &&
                                !isNumber(graphic['stroke-width'])
                            ),
                            animateOut = (
                                isNumber(graphic['stroke-width']) &&
                                !isNumber(params['stroke-width'])
                            );
                        // When strokeWidth is animating
                        if (animateIn || animateOut) {

                            const strokeWidth = pick(
                                    series.getStrokeWidth(series.options),
                                    1 // Styled mode
                                ),
                                inheritedStrokeWidth = (
                                    strokeWidth /
                                    (
                                        chart.mapView?.getScale() ||
                                        1
                                    )
                                );
                            // For animating from undefined, .attr() reads the
                            // property as the starting point
                            if (animateIn) {
                                graphic['stroke-width'] = inheritedStrokeWidth;
                            }
                            // For animating to undefined
                            if (animateOut) {
                                params['stroke-width'] = inheritedStrokeWidth;
                            }
                        }
                        const ret = animate.call(
                            graphic, params, options,
                            animateOut ? function (this: SVGElement): void {
                                // Remove the attribute after finished animation
                                graphic.element.removeAttribute('stroke-width');
                                delete graphic['stroke-width'];

                                // Proceed
                                if (complete) {
                                    complete.apply(this, arguments);
                                }
                            } : complete);
                        return ret;
                    };
                }
            });
        }

        // Apply the SVG transform
        transformGroups.forEach((transformGroup, i): void => {
            const view = i === 0 ? mapView : mapView.insets[i - 1],
                svgTransform = view.getSVGTransform(),
                strokeWidth = pick(
                    this.getStrokeWidth(this.options),
                    1 // Styled mode
                );

            /*
            Animate or move to the new zoom level. In order to prevent
            flickering as the different transform components are set out of sync
            (#5991), we run a fake animator attribute and set scale and
            translation synchronously in the same step.

            A possible improvement to the API would be to handle this in the
            renderer or animation engine itself, to ensure that when we are
            animating multiple properties, we make sure that each step for each
            property is performed in the same step. Also, for symbols and for
            transform properties, it should induce a single updateTransform and
            symbolAttr call.
            */
            const scale = svgTransform.scaleX,
                flipFactor = svgTransform.scaleY > 0 ? 1 : -1;
            const animatePoints = (scale: number): void => { // #18166
                (series.points || []).forEach((point): void => {
                    const graphic = point.graphic;
                    let strokeWidth;

                    if (
                        graphic?.['stroke-width'] &&
                        (strokeWidth = this.getStrokeWidth(point.options))
                    ) {
                        graphic.attr({
                            'stroke-width': strokeWidth / scale
                        });
                    }
                });
            };
            if (
                renderer.globalAnimation &&
                chart.hasRendered &&
                mapView.allowTransformAnimation
            ) {
                const startTranslateX = Number(
                    transformGroup.attr('translateX')
                );
                const startTranslateY = Number(
                    transformGroup.attr('translateY')
                );
                const startScale = Number(transformGroup.attr('scaleX'));

                const step: AnimationStepCallbackFunction = (now, fx): void => {
                    const scaleStep = startScale +
                        (scale - startScale) * fx.pos;
                    transformGroup.attr({
                        translateX: (
                            startTranslateX + (
                                svgTransform.translateX - startTranslateX
                            ) * fx.pos
                        ),
                        translateY: (
                            startTranslateY + (
                                svgTransform.translateY - startTranslateY
                            ) * fx.pos
                        ),
                        scaleX: scaleStep,
                        scaleY: scaleStep * flipFactor,
                        'stroke-width': strokeWidth / scaleStep
                    });

                    animatePoints(scaleStep); // #18166

                };

                const animOptions = merge(animObject(renderer.globalAnimation)),
                    userStep = animOptions.step;

                animOptions.step = function (): void {
                    if (userStep) {
                        userStep.apply(this, arguments);
                    }
                    step.apply(this, arguments);
                };

                transformGroup
                    .attr({ animator: 0 })
                    .animate(
                        { animator: 1 },
                        animOptions,
                        function (this: MapSeries): void {
                            if (
                                typeof renderer.globalAnimation !== 'boolean' &&
                                renderer.globalAnimation.complete
                            ) {
                                // Fire complete only from this place
                                renderer.globalAnimation.complete({
                                    applyDrilldown: true
                                });
                            }

                            fireEvent(this, 'mapZoomComplete');
                        }.bind(this)
                    );

            // When dragging or first rendering, animation is off
            } else {
                stop(transformGroup);
                transformGroup.attr(merge(
                    svgTransform,
                    { 'stroke-width': strokeWidth / scale }
                ));

                animatePoints(scale); // #18166
            }
        });

        if (!this.isDrilling) {
            this.drawMapDataLabels();
        }
    }

    /**
     * Get the bounding box of all paths in the map combined.
     *
     */
    public getProjectedBounds(): MapBounds|undefined {
        if (!this.bounds && this.chart.mapView) {

            const { insets, projection } = this.chart.mapView,
                allBounds: MapBounds[] = [];

            // Find the bounding box of each point
            (this.points || []).forEach((point): void => {

                if (point.path || point.geometry) {

                    // @todo Try to put these two conversions in
                    // MapPoint.applyOptions
                    if (typeof point.path === 'string') {
                        point.path = splitPath(point.path);

                    // Legacy one-dimensional array
                    } else if (
                        isArray(point.path) &&
                        (point.path as unknown as SVGPath.MoveTo)[0] === 'M'
                    ) {
                        point.path = this.chart.renderer
                            .pathToSegments(point.path);
                    }

                    // The first time a map point is used, analyze its box
                    if (!point.bounds) {
                        let bounds = point.getProjectedBounds(projection);
                        if (bounds) {
                            point.labelrank = pick(
                                point.labelrank,
                                // Bigger shape, higher rank
                                (
                                    (bounds.x2 - bounds.x1) *
                                    (bounds.y2 - bounds.y1)
                                )
                            );

                            const { midX, midY } = bounds;
                            if (insets && isNumber(midX) && isNumber(midY)) {
                                const inset = find(insets, (
                                    inset
                                ): boolean|undefined => inset.isInside({
                                    x: midX, y: midY
                                }));
                                if (inset) {
                                    // Project again, but with the inset
                                    // projection
                                    delete point.projectedPath;
                                    bounds = point.getProjectedBounds(
                                        inset.projection
                                    );
                                    if (bounds) {
                                        inset.allBounds.push(bounds);
                                    }
                                    point.insetIndex = insets.indexOf(inset);
                                }
                            }
                            point.bounds = bounds;
                        }

                    }
                    if (point.bounds && point.insetIndex === void 0) {
                        allBounds.push(point.bounds);
                    }

                }
            });

            this.bounds = MapView.compositeBounds(allBounds);
        }

        return this.bounds;
    }

    /**
     * Return the stroke-width either from a series options or point options
     * object. This function is used by both the map series where the
     * `borderWidth` sets the stroke-width, and the mapline series where the
     * `lineWidth` sets the stroke-width.
     * @private
     */
    private getStrokeWidth(
        options: (MapSeriesOptions|MapPointOptions)
    ): (number|undefined) {
        const pointAttrToOptions = this.pointAttrToOptions;

        return (options as AnyRecord)[
            pointAttrToOptions?.['stroke-width'] || 'borderWidth'
        ];
    }

    /**
     * Define hasData function for non-cartesian series. Returns true if the
     * series has points at all.
     * @private
     */
    public hasData(): boolean {
        return !!this.dataTable.rowCount;
    }

    /**
     * Get presentational attributes. In the maps series this runs in both
     * styled and non-styled mode, because colors hold data when a colorAxis is
     * used.
     * @private
     */
    public pointAttribs(
        point: MapPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const { mapView, styledMode } = point.series.chart;
        const attr = styledMode ?
            this.colorAttribs(point) :
            ColumnSeries.prototype.pointAttribs.call(
                this, point as unknown as ColumnPoint, state
            );

        // Individual stroke width
        let pointStrokeWidth = this.getStrokeWidth(point.options);

        // Handle state specific border or line width
        if (state) {
            const stateOptions = merge(
                    this.options.states &&
                    this.options.states[state] as MapSeriesOptions,
                    point.options.states &&
                    point.options.states[state] as MapPointOptions ||
                    {}
                ),
                stateStrokeWidth = this.getStrokeWidth(stateOptions);

            if (defined(stateStrokeWidth)) {
                pointStrokeWidth = stateStrokeWidth;
            }
            attr.stroke = stateOptions.borderColor ?? point.color;
        }

        if (pointStrokeWidth && mapView) {
            pointStrokeWidth /= mapView.getScale();
        }

        // In order for dash style to avoid being scaled, set the transformed
        // stroke width on the item
        const seriesStrokeWidth = this.getStrokeWidth(this.options);

        if (
            attr.dashstyle &&
            mapView &&
            isNumber(seriesStrokeWidth)
        ) {
            pointStrokeWidth = seriesStrokeWidth / mapView.getScale();
        }

        // Invisible map points means that the data value is removed from the
        // map, but not the map area shape itself. Instead it is rendered like a
        // null point. To fully remove a map area, it should be removed from the
        // mapData.
        if (!point.visible) {
            attr.fill = this.options.nullColor;
        }

        if (defined(pointStrokeWidth)) {
            attr['stroke-width'] = pointStrokeWidth;
        } else {
            delete attr['stroke-width'];
        }
        attr['stroke-linecap'] = attr['stroke-linejoin'] = this.options.linecap;

        return attr;
    }

    public updateData(): boolean {
        // #16782
        if (this.processedData) {
            return false;
        }

        return super.updateData.apply(this, arguments);
    }

    /**
     * Extend setData to call processData and generatePoints immediately.
     * @private
     */
    public setData(
        data: Array<(PointOptions|PointShortOptions)>,
        redraw: boolean = true,
        animation?: (boolean|Partial<AnimationOptions>),
        updatePoints?: boolean
    ): void {

        delete this.bounds;
        super.setData(data, false, void 0, updatePoints);

        this.processData();
        this.generatePoints();

        if (redraw) {
            this.chart.redraw(animation);
        }
    }

    public getDataColumnKeys(): Array<string> {
        // No x data for maps
        return this.pointArrayMap;
    }

    /**
     * Extend processData to join in mapData. If the allAreas option is true,
     * all areas from the mapData are used, and those that don't correspond to a
     * data value are given null values. The results are stored in
     * `processedData` in order to avoid mutating `data`.
     * @private
     */
    public processData(): (boolean|undefined) {
        const options = this.options,
            optionsData = this.useDataTable ? void 0 : options.data,
            dataTable = this.dataTable,
            chart = this.chart,
            chartOptions = chart.options.chart,
            joinBy = this.joinBy,
            pointArrayMap = options.keys || this.pointArrayMap,
            dataUsed: Array<MapPointOptions> = [],
            mapMap: AnyRecord = {},
            mapView = this.chart.mapView,
            mapDataObject = mapView && (
                // Get map either from series or global
                isObject(options.mapData, true) ?
                    mapView.getGeoMap(options.mapData) : mapView.geoMap
            ),
            // Pick up transform definitions for chart
            mapTransforms = chart.mapTransforms =
                chartOptions.mapTransforms ||
                mapDataObject?.['hc-transform'] ||
                chart.mapTransforms;

        let mapPoint,
            props;

        // Cache cos/sin of transform rotation angle
        if (mapTransforms) {
            objectEach(mapTransforms, (transform): void => {
                if (transform.rotation) {
                    transform.cosAngle = Math.cos(transform.rotation);
                    transform.sinAngle = Math.sin(transform.rotation);
                }
            });
        }

        let mapData: MapPointOptions[]|undefined;
        if (isArray(options.mapData)) {
            mapData = options.mapData;
        } else if (mapDataObject?.type === 'FeatureCollection') {
            this.mapTitle = mapDataObject.title;
            mapData = (H as AnyRecord).geojson(mapDataObject, this.type, this);
        }

        const modified = new DataTableCore();

        Object.entries(dataTable.columns).forEach(([key, column]): void => {
            modified.setColumn(key, column);
        });

        // Reset processedData
        this.processedData = [];
        const processedData = this.useDataTable ? void 0 : this.processedData;
        if (!this.useDataTable && processedData) {
            // Pick up numeric values, add index. Convert Array point
            // definitions to objects using pointArrayMap.
            if (optionsData) {
                let val: (MapPointOptions|PointOptions|PointShortOptions);

                for (let i = 0, iEnd = optionsData.length; i < iEnd; ++i) {
                    val = optionsData[i];

                    if (isNumber(val)) {
                        processedData[i] = {
                            value: val
                        };
                    } else if (isArray(val)) {
                        let ix = 0;
                        processedData[i] = {};
                        // Automatically copy first item to hc-key if there is
                        // an extra leading string
                        if (
                            !options.keys &&
                            val.length > pointArrayMap.length &&
                            typeof val[0] === 'string'
                        ) {
                            (processedData[i] as AnyRecord)['hc-key'] = val[0];
                            ++ix;
                        }
                        // Run through pointArrayMap and what's left of the
                        // point data array in parallel, copying over the values
                        for (let j = 0; j < pointArrayMap.length; ++j, ++ix) {
                            if (
                                pointArrayMap[j] &&
                                typeof val[ix] !== 'undefined'
                            ) {
                                if (pointArrayMap[j].indexOf('.') > 0) {
                                    MapPoint.prototype.setNestedProperty(
                                        processedData[i],
                                        val[ix],
                                        pointArrayMap[j]
                                    );
                                } else {
                                    (processedData[i] as AnyRecord)[
                                        pointArrayMap[j]
                                    ] = val[ix];
                                }
                            }
                        }
                    } else {
                        processedData[i] = optionsData[i];
                    }
                    if (
                        joinBy &&
                        joinBy[0] === '_i'
                    ) {
                        (processedData[i] as AnyRecord)._i = i;
                    }
                }
            }
        }

        // Automatically copy first item to hc-key
        if (!options.keys && modified.columns.name) {
            modified.setColumn('hc-key', modified.columns.name);
        }

        if (mapData) {
            this.mapData = mapData;
            this.mapMap = {};

            for (let i = 0; i < mapData.length; i++) {
                mapPoint = mapData[i];
                props = mapPoint.properties;

                (mapPoint as AnyRecord)._i = i;
                // Copy the property over to root for faster access
                if (joinBy[0] && props && props[joinBy[0]]) {
                    (mapPoint as AnyRecord)[joinBy[0]] = props[joinBy[0]];
                }
                mapMap[(mapPoint as AnyRecord)[joinBy[0]]] = mapPoint;
            }
            this.mapMap = mapMap;

            // Registered the point codes that actually hold data
            if (joinBy[1]) {
                const joinKey = joinBy[1];
                if (this.useDataTable) {
                    for (let i = 0; i < modified.rowCount; i++) {
                        const mapKey = getNestedProperty(
                            joinKey,
                            modified.getRowObject(i)
                        ) as string;
                        if (mapMap[mapKey]) {
                            dataUsed.push(mapMap[mapKey]);
                        }
                    }
                } else if (processedData) {
                    processedData.forEach((pointOptions): void => {
                        const mapKey = getNestedProperty(
                            joinKey,
                            pointOptions
                        ) as string;
                        if (mapMap[mapKey]) {
                            dataUsed.push(mapMap[mapKey]);
                        }
                    });
                }
            }

            if (options.allAreas) {
                // Register the point codes that actually hold data
                if (!this.useDataTable && processedData) {
                    if (joinBy[1]) {
                        const joinKey = joinBy[1];

                        processedData.forEach((pointOptions): void => {
                            dataUsed.push(getNestedProperty(
                                joinKey,
                                pointOptions
                            ) as MapPointOptions);
                        });
                    }
                }

                // Add those map points that don't correspond to data, which
                // will be drawn as null points. Searching a string is faster
                // than Array.indexOf
                const dataUsedString = (
                    '|' +
                    dataUsed
                        .map(function (point): void {
                            return point && (point as AnyRecord)[joinBy[0]];
                        })
                        .join('|') +
                    '|'
                );

                mapData.forEach((mapPoint): void => {
                    if (
                        !joinBy[0] ||
                        dataUsedString.indexOf(
                            '|' +
                            mapPoint[joinBy[0] as keyof typeof mapPoint] +
                            '|'
                        ) === -1
                    ) {
                        modified.setRow(
                            merge(
                                mapPoint,
                                { value: null }
                            ) as unknown as DataTableCore.RowObject
                        );
                        if (!this.useDataTable) {
                            processedData?.push(
                                merge(mapPoint, { value: null })
                            );
                        }
                    }
                });
            }
        }
        // The processedXData array is used by general chart logic for checking
        // data length in various scanarios.
        if (this.useDataTable) {
            this.dataTable.modified = modified;
        } else if (processedData) {
            this.dataTable.rowCount = processedData.length;
        }

        return void 0;
    }

    /**
     * Extend setOptions by picking up the joinBy option and applying it to a
     * series property.
     * @private
     */
    public setOptions(itemOptions: MapSeriesOptions): MapSeriesOptions {
        const options = super.setOptions(itemOptions);

        let joinBy = options.joinBy;

        if (options.joinBy === null) {
            joinBy = '_i';
        }
        if (joinBy) {
            this.joinBy = splat(joinBy);
            if (!this.joinBy[1]) {
                this.joinBy[1] = this.joinBy[0];
            }
        }

        return options;
    }

    /**
     * Add the path option for data points. Find the max value for color
     * calculation.
     * @private
     */
    public translate(): void {
        const series = this,
            doFullTranslate = series.doFullTranslate(),
            mapView = this.chart.mapView,
            projection = mapView?.projection;

        // Recalculate box on updated data
        if (this.chart.hasRendered && (this.isDirtyData || !this.hasRendered)) {
            this.processData();
            this.generatePoints();

            delete this.bounds;
            if (
                mapView &&
                !mapView.userOptions.center &&
                !isNumber(mapView.userOptions.zoom) &&
                mapView.zoom === mapView.minZoom // #18542 don't zoom out if
                // map is zoomed
            ) {
                // Not only recalculate bounds but also fit view
                mapView.fitToBounds(void 0, void 0, false); // #17012
            } else {
                // If center and zoom is defined in user options, get bounds but
                // don't change view
                this.getProjectedBounds();
            }
        }

        if (mapView) {
            const mainSvgTransform = mapView.getSVGTransform();

            series.points.forEach((point: MapPoint): void => {

                const svgTransform = (
                    isNumber(point.insetIndex) &&
                    mapView.insets[point.insetIndex].getSVGTransform()
                ) || mainSvgTransform;

                // Record the middle point (loosely based on centroid),
                // determined by the middleX and middleY options.
                if (
                    svgTransform &&
                    point.bounds &&
                    isNumber(point.bounds.midX) &&
                    isNumber(point.bounds.midY)
                ) {
                    point.plotX = point.bounds.midX * svgTransform.scaleX +
                        svgTransform.translateX;
                    point.plotY = point.bounds.midY * svgTransform.scaleY +
                        svgTransform.translateY;
                }

                if (doFullTranslate) {

                    point.shapeType = 'path';
                    point.shapeArgs = {
                        d: MapPoint.getProjectedPath(point, projection)
                    };
                }

                if (!point.hiddenInDataClass) { // #20441
                    if (point.projectedPath && !point.projectedPath.length) {
                        point.setVisible(false);
                    } else if (!point.visible) {
                        point.setVisible(true);
                    }
                }
            });
        }

        fireEvent(series, 'afterTranslate');
    }

    public update(
        options: SeriesTypeOptions
    ): void {
        // Calculate and set the recommended map view after every series update
        // if new mapData is set
        if (options.mapData) {
            this.chart.mapView?.recommendMapView(
                this.chart,
                [
                    this.chart.options.chart.map,
                    ...(this.chart.options.series || []).map(
                        (s, i): (MapDataType|undefined) => {
                            if (i === this._i) {
                                return options.mapData;
                            }
                            return s.mapData;
                        }
                    )
                ],
                true
            );
        }

        super.update.apply(this, arguments);
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface MapSeries extends ColorMapComposition.SeriesComposition {
    getCenter: typeof CU['getCenter'];
    pointArrayMap: ColorMapComposition.SeriesComposition['pointArrayMap'];
    pointClass: typeof MapPoint;
    preserveAspectRatio: boolean;
    trackerGroups: ColorMapComposition.SeriesComposition['trackerGroups'];
    animate(init?: boolean): void;
    doFullTranslate(): boolean;
    drawMapDataLabels(): void;
    drawPoints(): void;
    hasData(): boolean;
    pointAttribs(
        point?: MapPoint,
        state?: StatesOptionsKey
    ): SVGAttributes;
    render(): void;
}
extend(MapSeries.prototype, {
    type: 'map',

    axisTypes: ColorMapComposition.seriesMembers.axisTypes,

    colorAttribs: ColorMapComposition.seriesMembers.colorAttribs,

    colorKey: ColorMapComposition.seriesMembers.colorKey,

    // When tooltip is not shared, this series (and derivatives) requires
    // direct touch/hover. KD-tree does not apply.
    directTouch: true,

    // We need the points' bounding boxes in order to draw the data labels,
    // so we skip it now and call it from drawPoints instead.
    drawDataLabels: noop,

    // No graph for the map series
    drawGraph: noop,

    forceDL: true,

    getCenter: CU.getCenter,

    getExtremesFromAll: true,

    getSymbol: noop,

    isCartesian: false,

    parallelArrays: ColorMapComposition.seriesMembers.parallelArrays,

    pointArrayMap: ColorMapComposition.seriesMembers.pointArrayMap,

    pointClass: MapPoint,

    // X axis and Y axis must have same translation slope
    preserveAspectRatio: true,

    searchPoint: noop,

    trackerGroups: ColorMapComposition.seriesMembers.trackerGroups,

    // Get axis extremes from paths, not values
    useMapGeometry: true

});
ColorMapComposition.compose(MapSeries);

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        map: typeof MapSeries;
    }
}
SeriesRegistry.registerSeriesType('map', MapSeries);

/* *
 *
 *  Default Export
 *
 * */

export default MapSeries;
