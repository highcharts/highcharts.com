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

import type {
    AnimationOptions,
    AnimationStepCallbackFunction
} from '../../Core/Animation/AnimationOptions';
import type ColorType from '../../Core/Color/ColorType';
import type { GeoJSON, TopoJSON } from '../../Maps/GeoJSON';
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
import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject, stop } = A;
import ColorMapComposition from '../ColorMapComposition.js';
import CU from '../CenteredUtilities.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import MapChart from '../../Core/Chart/MapChart.js';
const {
    splitPath
} = MapChart;
import MapPoint from './MapPoint.js';
import MapView from '../../Maps/MapView.js';
import { Palette } from '../../Core/Color/Palettes.js';
import Series from '../../Core/Series/Series.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    // indirect dependency to keep product size low
    seriesTypes: {
        column: ColumnSeries,
        scatter: ScatterSeries
    }
} = SeriesRegistry;
import SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer.js';
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
        mapData?: (Array<MapPointOptions>|GeoJSON|TopoJSON);
    }
    interface SeriesStateHoverOptions {
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
    public static defaultOptions: MapSeriesOptions = merge(ScatterSeries.defaultOptions, {

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

        animation: false, // makes the complex shapes slow

        dataLabels: {
            crop: false,
            formatter: function (): string { // #2945
                const { numberFormatter } = this.series.chart;
                const { value } = this.point as MapPoint;

                return isNumber(value) ? numberFormatter(value, -1) : '';
            },
            inside: true, // for the color
            overflow: false as any,
            padding: 0,
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
    } as MapSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    // public baseView?: { center: Highcharts.LonLatArray; zoom: number };

    public bounds?: MapBounds;

    public chart: MapChart = void 0 as any;

    public data: Array<MapPoint> = void 0 as any;

    public group: SVGElement = void 0 as any;

    public joinBy: Array<string> = void 0 as any;

    public mapData?: unknown;

    public mapMap?: AnyRecord;

    public mapTitle?: string;

    public options: MapSeriesOptions = void 0 as any;

    public pointAttrToOptions: unknown;

    public points: Array<MapPoint> = void 0 as any;

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

    /* eslint-disable valid-jsdoc */

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

        Series.prototype.drawDataLabels.call(this);
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
        mapView.insets.forEach((inset, i): void => {
            if (!transformGroups[i + 1]) {
                transformGroups.push(renderer.g().add(group));
            }
        });

        // Draw the shapes again
        if (this.doFullTranslate()) {

            // Individual point actions.
            this.points.forEach((point): void => {

                const { graphic, shapeArgs } = point;

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

                // Restore state color on update/redraw (#3529)
                if (shapeArgs && chart.hasRendered && !chart.styledMode) {
                    shapeArgs.fill = this.pointAttribs(
                        point,
                        point.state
                    ).fill;
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
                    if (point.properties && point.properties['hc-key']) {
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
                            ) as any
                        );
                    }

                    graphic.animate = function (params,
                        options, complete): SVGElement {

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
                                        chart.mapView &&
                                        chart.mapView.getScale() ||
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
                        graphic &&
                        graphic['stroke-width'] &&
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

                const step: AnimationStepCallbackFunction = (
                    now,
                    fx
                ): void => {
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

                animOptions.step =
                    function (obj?: { applyDrilldown?: boolean }): void {
                        if (userStep) {
                            userStep.apply(this, arguments);
                        }
                        step.apply(this, arguments);
                    };

                transformGroup
                    .attr({ animator: 0 })
                    .animate({ animator: 1 }, animOptions, function (): void {
                        if (
                            typeof renderer.globalAnimation !== 'boolean' &&
                            renderer.globalAnimation.complete
                        ) {
                            // fire complete only from this place
                            renderer.globalAnimation.complete({
                                applyDrilldown: true
                            });
                        }
                    });

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
            (this.points || []).forEach(function (point): void {

                if (point.path || point.geometry) {

                    // @todo Try to puth these two conversions in
                    // MapPoint.applyOptions
                    if (typeof point.path === 'string') {
                        point.path = splitPath(point.path);

                    // Legacy one-dimensional array
                    } else if (
                        isArray(point.path) &&
                        point.path[0] as any === 'M'
                    ) {
                        point.path = SVGRenderer.prototype.pathToSegments(
                            point.path as any
                        );
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
        options: MapSeries['options']|MapPoint['options']
    ): number|undefined {
        const pointAttrToOptions = this.pointAttrToOptions;

        return (options as any)[
            pointAttrToOptions &&
            (pointAttrToOptions as any)['stroke-width'] || 'borderWidth'
        ];
    }

    /**
     * Define hasData function for non-cartesian series. Returns true if the
     * series has points at all.
     * @private
     */
    public hasData(): boolean {
        return !!this.processedXData.length; // != 0
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
                this, point as any, state
            );

        // Individual stroke width
        let pointStrokeWidth = this.getStrokeWidth(point.options);

        // Handle state specific border or line width
        if (state) {
            const stateOptions = merge(
                    (this.options as any).states[state],
                    point.options.states &&
                    (point.options.states as any)[state] ||
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

    /**
     * @private
     */
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
        super.setData.call(this, data, false, void 0, updatePoints);

        this.processData();
        this.generatePoints();

        if (redraw) {
            this.chart.redraw(animation);
        }
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
            data = options.data,
            chartOptions = this.chart.options.chart,
            joinBy = this.joinBy,
            pointArrayMap = options.keys || this.pointArrayMap,
            dataUsed: Array<MapPointOptions> = [],
            mapMap: AnyRecord = {};

        let mapView = this.chart.mapView,
            mapDataObject = mapView && (
                // Get map either from series or global
                isObject(options.mapData, true) ?
                    mapView.getGeoMap(options.mapData) : mapView.geoMap
            ),
            mapTransforms = this.chart.mapTransforms,
            mapPoint,
            props,
            i;

        // Pick up transform definitions for chart
        this.chart.mapTransforms = mapTransforms =
            chartOptions.mapTransforms ||
            mapDataObject && mapDataObject['hc-transform'] ||
            mapTransforms;

        // Cache cos/sin of transform rotation angle
        if (mapTransforms) {
            objectEach(mapTransforms, function (transform: any): void {
                if (transform.rotation) {
                    transform.cosAngle = Math.cos(transform.rotation);
                    transform.sinAngle = Math.sin(transform.rotation);
                }
            });
        }

        let mapData: MapPointOptions[]|undefined;
        if (isArray(options.mapData)) {
            mapData = options.mapData;
        } else if (
            mapDataObject && mapDataObject.type === 'FeatureCollection'
        ) {
            this.mapTitle = mapDataObject.title;
            mapData = H.geojson(mapDataObject, this.type, this);
        }

        // Reset processedData
        this.processedData = [];
        const processedData = this.processedData;

        // Pick up numeric values, add index. Convert Array point definitions to
        // objects using pointArrayMap.
        if (data) {
            data.forEach(function (val, i): void {
                let ix = 0;

                if (isNumber(val)) {
                    processedData[i] = {
                        value: val
                    };
                } else if (isArray(val)) {
                    processedData[i] = {};
                    // Automatically copy first item to hc-key if there is
                    // an extra leading string
                    if (
                        !options.keys &&
                        val.length > pointArrayMap.length &&
                        typeof val[0] === 'string'
                    ) {
                        (processedData[i] as any)['hc-key'] = val[0];
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
                                    processedData[i], val[ix], pointArrayMap[j]
                                );
                            } else {
                                (processedData[i] as any)[pointArrayMap[j]] =
                                    val[ix];
                            }
                        }
                    }
                } else {
                    processedData[i] = data[i];
                }
                if (joinBy && joinBy[0] === '_i') {
                    (processedData[i] as any)._i = i;
                }
            });
        }

        if (mapData) {
            this.mapData = mapData;
            this.mapMap = {};

            for (i = 0; i < mapData.length; i++) {
                mapPoint = mapData[i];
                props = mapPoint.properties;

                (mapPoint as any)._i = i;
                // Copy the property over to root for faster access
                if (joinBy[0] && props && props[joinBy[0]]) {
                    (mapPoint as any)[joinBy[0]] = props[joinBy[0]];
                }
                mapMap[(mapPoint as any)[joinBy[0]]] = mapPoint;
            }
            this.mapMap = mapMap;

            // Registered the point codes that actually hold data
            if (joinBy[1]) {
                const joinKey = joinBy[1];
                processedData.forEach(function (
                    pointOptions: MapPointOptions
                ): void {
                    const mapKey = getNestedProperty(
                        joinKey,
                        pointOptions
                    ) as string;
                    if (mapMap[mapKey]) {
                        dataUsed.push(mapMap[mapKey]);
                    }
                } as any);
            }

            if (options.allAreas) {
                // Register the point codes that actually hold data
                if (joinBy[1]) {
                    const joinKey = joinBy[1];
                    processedData.forEach(function (
                        pointOptions: MapPointOptions
                    ): void {
                        dataUsed.push(getNestedProperty(
                            joinKey,
                            pointOptions
                        ) as MapPointOptions);
                    } as any);
                }

                // Add those map points that don't correspond to data, which
                // will be drawn as null points. Searching a string is faster
                // than Array.indexOf
                const dataUsedString = (
                    '|' +
                    dataUsed
                        .map(function (point): void {
                            return point && (point as any)[joinBy[0]];
                        })
                        .join('|') +
                    '|'
                );

                mapData.forEach(function (mapPoint: any): void {
                    if (
                        !joinBy[0] ||
                        dataUsedString.indexOf(
                            '|' + mapPoint[joinBy[0]] + '|'
                        ) === -1
                    ) {
                        processedData.push(merge(mapPoint, { value: null }));
                    }
                });
            }
        }
        // The processedXData array is used by general chart logic for checking
        // data length in various scanarios
        this.processedXData = new Array(processedData.length);

        return void 0;
    }

    /**
     * Extend setOptions by picking up the joinBy option and applying it to a
     * series property.
     * @private
     */
    public setOptions(itemOptions: MapSeriesOptions): MapSeriesOptions {
        let options = Series.prototype.setOptions.call(this, itemOptions),
            joinBy = options.joinBy,
            joinByNull = joinBy === null;

        if (joinByNull) {
            joinBy = '_i';
        }
        joinBy = this.joinBy = splat(joinBy);
        if (!joinBy[1]) {
            joinBy[1] = joinBy[0];
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
            projection = mapView && mapView.projection;

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

            series.points.forEach(function (
                point: (MapPoint&MapPoint.CacheObject)
            ): void {

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

                if (point.projectedPath && !point.projectedPath.length) {
                    point.setVisible(false);
                } else if (!point.visible) {
                    point.setVisible(true);
                }
            });
        }

        fireEvent(series, 'afterTranslate');
    }
    /* eslint-enable valid-jsdoc */
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


/* *
 *
 *  API Options
 *
 * */

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
 * compatibily with old IE, not all SVG path definitions are supported,
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

''; // adds doclets above to the transpiled file
