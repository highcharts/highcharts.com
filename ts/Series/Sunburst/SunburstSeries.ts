/* *
 *
 *  This module implements sunburst charts in Highcharts.
 *
 *  (c) 2016-2021 Highsoft AS
 *
 *  Authors: Jon Arild Nygard
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

import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type SunburstDataLabelOptions from './SunburstDataLabelOptions';
import type SunburstPointOptions from './SunburstPointOptions';
import type SunburstSeriesOptions from './SunburstSeriesOptions';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';

import CU from '../CenteredUtilities.js';
const {
    getCenter,
    getStartAndEndRadians
} = CU;
import H from '../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: Series,
    seriesTypes: {
        column: ColumnSeries,
        treemap: TreemapSeries
    }
} = SeriesRegistry;
import SunburstPoint from './SunburstPoint.js';
import SunburstUtilities from './SunburstUtilities.js';
import TU from '../TreeUtilities.js';
const {
    getColor,
    getLevelOptions,
    setTreeValues,
    updateRootId
} = TU;
import U from '../../Core/Utilities.js';
import SunburstNode from './SunburstNode.js';
const {
    defined,
    error,
    extend,
    fireEvent,
    isNumber,
    isObject,
    isString,
    merge,
    splat
} = U;

/* *
 *
 *  Constants
 *
 * */

const rad2deg = 180 / Math.PI;

/* *
 *
 *  Functions
 *
 * */

// eslint-disable-next-line require-jsdoc
function isBoolean(x: unknown): x is boolean {
    return typeof x === 'boolean';
}

/**
 * Find a set of coordinates given a start coordinates, an angle, and a
 * distance.
 *
 * @private
 * @function getEndPoint
 *
 * @param {number} x
 *        Start coordinate x
 *
 * @param {number} y
 *        Start coordinate y
 *
 * @param {number} angle
 *        Angle in radians
 *
 * @param {number} distance
 *        Distance from start to end coordinates
 *
 * @return {Highcharts.SVGAttributes}
 *         Returns the end coordinates, x and y.
 */
const getEndPoint = function getEndPoint(
    x: number,
    y: number,
    angle: number,
    distance: number
): PositionObject {
    return {
        x: x + (Math.cos(angle) * distance),
        y: y + (Math.sin(angle) * distance)
    };
};

// eslint-disable-next-line require-jsdoc
function getDlOptions(
    params: SunburstSeries.DlOptionsParams
): SunburstDataLabelOptions {
    // Set options to new object to avoid problems with scope
    let point = params.point,
        shape: Partial<SunburstNode.NodeValuesObject> =
            isObject(params.shapeArgs) ? params.shapeArgs : {},
        optionsPoint = (
            isObject(params.optionsPoint) ?
                params.optionsPoint.dataLabels :
                {}
        ),
        // The splat was used because levels dataLabels
        // options doesn't work as an array
        optionsLevel = splat(
            isObject(params.level) ?
                params.level.dataLabels :
                {}
        )[0],
        options = merge<SunburstDataLabelOptions>({
            style: {}
        }, optionsLevel, optionsPoint),
        rotationRad: (number|undefined),
        rotation: (number|undefined),
        rotationMode = options.rotationMode;

    if (!isNumber(options.rotation)) {
        if (rotationMode === 'auto' || rotationMode === 'circular') {

            if (
                options.useHTML &&
                rotationMode === 'circular'
            ) {
                // Change rotationMode to 'auto' to avoid using text paths
                // for HTML labels, see #18953
                rotationMode = 'auto';
            }

            if (
                (point.innerArcLength as any) < 1 &&
                (point.outerArcLength as any) > (shape.radius as any)
            ) {
                rotationRad = 0;
                // Trigger setTextPath function to get textOutline etc.
                if (point.dataLabelPath && rotationMode === 'circular') {
                    options.textPath = {
                        enabled: true
                    };
                }
            } else if (
                (point.innerArcLength as any) > 1 &&
                (point.outerArcLength as any) > 1.5 * (shape.radius as any)
            ) {
                if (rotationMode === 'circular') {
                    options.textPath = {
                        enabled: true,
                        attributes: {
                            dy: 5
                        }
                    };
                } else {
                    rotationMode = 'parallel';
                }
            } else {
                // Trigger the destroyTextPath function
                if (
                    point.dataLabel &&
                    point.dataLabel.textPath &&
                    rotationMode === 'circular'
                ) {
                    options.textPath = {
                        enabled: false
                    };
                }
                rotationMode = 'perpendicular';
            }
        }

        if (rotationMode !== 'auto' && rotationMode !== 'circular') {

            if (point.dataLabel && point.dataLabel.textPath) {
                options.textPath = {
                    enabled: false
                };
            }
            rotationRad = (
                (shape.end as any) -
                ((shape.end as any) - (shape.start as any)) / 2
            );
        }

        if (rotationMode === 'parallel') {
            (options.style as any).width = Math.min(
                (shape.radius as any) * 2.5,
                ((point.outerArcLength as any) + point.innerArcLength) / 2
            );
        } else {
            if (
                !defined((options.style as any).width) &&
                shape.radius
            ) {
                (options.style as any).width = point.node.level === 1 ?
                    2 * shape.radius :
                    shape.radius;
            }
        }

        if (
            rotationMode === 'perpendicular' &&
            // 16 is the inferred line height. We don't know the real line
            // yet because the label is not rendered. A better approach for this
            // would be to hide the label from the `alignDataLabel` function
            // when the actual line height is known.
            point.outerArcLength as any < 16
        ) {
            (options.style as any).width = 1;
        }

        // Apply padding (#8515)
        (options.style as any).width = Math.max(
            (options.style as any).width - 2 * (options.padding || 0),
            1
        );

        rotation = ((rotationRad as any) * rad2deg) % 180;
        if (rotationMode === 'parallel') {
            rotation -= 90;
        }

        // Prevent text from rotating upside down
        if (rotation > 90) {
            rotation -= 180;
        } else if (rotation < -90) {
            rotation += 180;
        }

        options.rotation = rotation;
    }

    if (options.textPath) {
        if (
            point.shapeExisting.innerR === 0 &&
            options.textPath.enabled
        ) {
            // Enable rotation to render text
            options.rotation = 0;
            // Center dataLabel - disable textPath
            options.textPath.enabled = false;
            // Setting width and padding
            (options.style as any).width = Math.max(
                (point.shapeExisting.r * 2) -
                2 * (options.padding || 0), 1
            );
        } else if (
            point.dlOptions &&
            point.dlOptions.textPath &&
            !point.dlOptions.textPath.enabled &&
            (rotationMode === 'circular')
        ) {
            // Bring dataLabel back if was a center dataLabel
            options.textPath.enabled = true;
        }
        if (options.textPath.enabled) {
            // Enable rotation to render text
            options.rotation = 0;
            // Setting width and padding
            (options.style as any).width = Math.max(
                ((point.outerArcLength as any) +
                (point.innerArcLength as any)) / 2 -
                2 * (options.padding || 0), 1
            );
        }
    }
    // NOTE: alignDataLabel positions the data label differntly when rotation is
    // 0. Avoiding this by setting rotation to a small number.
    if (options.rotation === 0) {
        options.rotation = 0.001;
    }
    return options;
}

// eslint-disable-next-line require-jsdoc
function getAnimation(
    shape: SunburstNode.NodeValuesObject,
    params: SunburstSeries.AnimationParams
): Record<string, Record<string, number>> {
    let point = params.point,
        radians = params.radians,
        innerR = params.innerR,
        idRoot = params.idRoot,
        idPreviousRoot = params.idPreviousRoot,
        shapeExisting = params.shapeExisting,
        shapeRoot = params.shapeRoot,
        shapePreviousRoot = params.shapePreviousRoot,
        visible = params.visible,
        from: Record<string, number> = {},
        to: Record<string, number> = {
            end: shape.end,
            start: shape.start,
            innerR: shape.innerR,
            r: shape.r,
            x: shape.x,
            y: shape.y
        } as any;

    if (visible) {
        // Animate points in
        if (!point.graphic && shapePreviousRoot) {
            if (idRoot === point.id) {
                from = {
                    start: radians.start,
                    end: radians.end
                };
            } else {
                from = (shapePreviousRoot.end <= shape.start) ? {
                    start: radians.end,
                    end: radians.end
                } : {
                    start: radians.start,
                    end: radians.start
                };
            }
            // Animate from center and outwards.
            from.innerR = from.r = innerR;
        }
    } else {
        // Animate points out
        if (point.graphic) {
            if (idPreviousRoot === point.id) {
                to = {
                    innerR: innerR,
                    r: innerR
                };
            } else if (shapeRoot) {
                to = (shapeRoot.end <= shapeExisting.start) ?
                    {
                        innerR: innerR,
                        r: innerR,
                        start: radians.end,
                        end: radians.end
                    } : {
                        innerR: innerR,
                        r: innerR,
                        start: radians.start,
                        end: radians.start
                    };
            }
        }
    }
    return {
        from: from,
        to: to
    };
}

// eslint-disable-next-line require-jsdoc
function getDrillId(
    point: SunburstPoint,
    idRoot: string,
    mapIdToNode: Record<string, SunburstNode>
): (string|undefined) {
    let drillId,
        node = point.node,
        nodeRoot;

    if (!node.isLeaf) {
        // When it is the root node, the drillId should be set to parent.
        if (idRoot === point.id) {
            nodeRoot = mapIdToNode[idRoot];
            drillId = nodeRoot.parent;
        } else {
            drillId = point.id;
        }
    }
    return drillId;
}

// eslint-disable-next-line require-jsdoc
function cbSetTreeValuesBefore(
    node: SunburstNode,
    options: SunburstNode.NodeValuesObject
): SunburstNode {
    const mapIdToNode: Record<string, SunburstNode> =
            options.mapIdToNode as any,
        parent = node.parent,
        nodeParent = parent ? mapIdToNode[parent] : void 0,
        series = options.series,
        chart = series.chart,
        points = series.points,
        point = points[node.i],
        colors = series.options.colors || chart && chart.options.colors,
        colorInfo = getColor(node, {
            colors: colors,
            colorIndex: series.colorIndex,
            index: options.index,
            mapOptionsToLevel: options.mapOptionsToLevel,
            parentColor: nodeParent && nodeParent.color,
            parentColorIndex: nodeParent && nodeParent.colorIndex,
            series: options.series,
            siblings: options.siblings
        });

    node.color = colorInfo.color;
    node.colorIndex = colorInfo.colorIndex;
    if (point) {
        point.color = node.color;
        point.colorIndex = node.colorIndex;
        // Set slicing on node, but avoid slicing the top node.
        node.sliced = (node.id !== options.idRoot) ? point.sliced : false;
    }
    return node;
}

/* *
 *
 *  Class
 *
 * */

class SunburstSeries extends TreemapSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A Sunburst displays hierarchical data, where a level in the hierarchy is
     * represented by a circle. The center represents the root node of the tree.
     * The visualization bears a resemblance to both treemap and pie charts.
     *
     * @sample highcharts/demo/sunburst
     *         Sunburst chart
     *
     * @extends      plotOptions.pie
     * @excluding    allAreas, clip, colorAxis, colorKey, compare, compareBase,
     *               dataGrouping, depth, dragDrop, endAngle, gapSize, gapUnit,
     *               ignoreHiddenPoint, innerSize, joinBy, legendType, linecap,
     *               minSize, navigatorOptions, pointRange
     * @product      highcharts
     * @requires     modules/sunburst.js
     * @optionparent plotOptions.sunburst
     *
     * @private
     */
    public static defaultOptions: SunburstSeriesOptions = merge(TreemapSeries.defaultOptions, {

        /**
         * Options for the breadcrumbs, the navigation at the top leading the
         * way up through the traversed levels.
         *
         * @since 10.0.0
         * @product   highcharts
         * @extends   navigation.breadcrumbs
         * @optionparent plotOptions.sunburst.breadcrumbs
         */

        /**
         * Set options on specific levels. Takes precedence over series options,
         * but not point options.
         *
         * @sample highcharts/demo/sunburst
         *         Sunburst chart
         *
         * @type      {Array<*>}
         * @apioption plotOptions.sunburst.levels
         */

        /**
         * Can set a `borderColor` on all points which lies on the same level.
         *
         * @type      {Highcharts.ColorString}
         * @apioption plotOptions.sunburst.levels.borderColor
         */

        /**
         * Can set a `borderWidth` on all points which lies on the same level.
         *
         * @type      {number}
         * @apioption plotOptions.sunburst.levels.borderWidth
         */

        /**
         * Can set a `borderDashStyle` on all points which lies on the same
         * level.
         *
         * @type      {Highcharts.DashStyleValue}
         * @apioption plotOptions.sunburst.levels.borderDashStyle
         */

        /**
         * Can set a `color` on all points which lies on the same level.
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @apioption plotOptions.sunburst.levels.color
         */

        /**
         * Determines whether the chart should receive one color per point based
         * on this level.
         *
         * @type      {boolean}
         * @apioption plotOptions.sunburst.levels.colorByPoint
         */

        /**
         * Can set a `colorVariation` on all points which lies on the same
         * level.
         *
         * @apioption plotOptions.sunburst.levels.colorVariation
         */

        /**
         * The key of a color variation. Currently supports `brightness` only.
         *
         * @type      {string}
         * @apioption plotOptions.sunburst.levels.colorVariation.key
         */

        /**
         * The ending value of a color variation. The last sibling will receive
         * this value.
         *
         * @type      {number}
         * @apioption plotOptions.sunburst.levels.colorVariation.to
         */

        /**
         * Can set `dataLabels` on all points which lies on the same level.
         *
         * @extends   plotOptions.sunburst.dataLabels
         * @apioption plotOptions.sunburst.levels.dataLabels
         */

        /**
         * Decides which level takes effect from the options set in the levels
         * object.
         *
         * @sample highcharts/demo/sunburst
         *         Sunburst chart
         *
         * @type      {number}
         * @apioption plotOptions.sunburst.levels.level
         */

        /**
         * Can set a `levelSize` on all points which lies on the same level.
         *
         * @type      {Object}
         * @apioption plotOptions.sunburst.levels.levelSize
         */

        /**
         * When enabled the user can click on a point which is a parent and
         * zoom in on its children. Deprecated and replaced by
         * [allowTraversingTree](#plotOptions.sunburst.allowTraversingTree).
         *
         * @deprecated
         * @type      {boolean}
         * @default   false
         * @since     6.0.0
         * @product   highcharts
         * @apioption plotOptions.sunburst.allowDrillToNode
         */

        /**
         * When enabled the user can click on a point which is a parent and
         * zoom in on its children.
         *
         * @type      {boolean}
         * @default   false
         * @since     7.0.3
         * @product   highcharts
         * @apioption plotOptions.sunburst.allowTraversingTree
         */

        /**
         * The center of the sunburst chart relative to the plot area. Can be
         * percentages or pixel values.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-center/
         *         Centered at 100, 100
         *
         * @type    {Array<number|string>}
         * @default ["50%", "50%"]
         * @product highcharts
         *
         * @private
         */
        center: ['50%', '50%'],

        /**
         * @product highcharts
         *
         * @private
         */
        clip: false,

        colorByPoint: false,
        /**
         * Disable inherited opacity from Treemap series.
         *
         * @ignore-option
         *
         * @private
         */
        opacity: 1,
        /**
         * @declare Highcharts.SeriesSunburstDataLabelsOptionsObject
         *
         * @private
         */
        dataLabels: {

            allowOverlap: true,

            defer: true,

            /**
             * Decides how the data label will be rotated relative to the
             * perimeter of the sunburst. Valid values are `circular`, `auto`,
             * `parallel` and `perpendicular`. When `circular`, the best fit
             * will be computed for the point, so that the label is curved
             * around the center when there is room for it, otherwise
             * perpendicular. The legacy `auto` option works similiar to
             * `circular`, but instead of curving the labels they are tangent to
             * the perimiter.
             *
             * The `rotation` option takes precedence over `rotationMode`.
             *
             * @type       {string}
             * @sample {highcharts}
             *         highcharts/plotoptions/sunburst-datalabels-rotationmode-circular/
             *         Circular rotation mode
             * @validvalue ["auto", "perpendicular", "parallel", "circular"]
             * @since      6.0.0
             */
            rotationMode: 'circular',

            style: {
                /** @internal */
                textOverflow: 'ellipsis'
            }

        },
        /**
         * Which point to use as a root in the visualization.
         *
         * @type {string}
         *
         * @private
         */
        rootId: void 0,

        /**
         * Used together with the levels and `allowDrillToNode` options. When
         * set to false the first level visible when drilling is considered
         * to be level one. Otherwise the level will be the same as the tree
         * structure.
         *
         * @private
         */
        levelIsConstant: true,

        /**
         * Determines the width of the ring per level.
         *
         * @sample {highcharts} highcharts/plotoptions/sunburst-levelsize/
         *         Sunburst with various sizes per level
         *
         * @since 6.0.5
         *
         * @private
         */
        levelSize: {
            /**
             * The value used for calculating the width of the ring. Its' affect
             * is determined by `levelSize.unit`.
             *
             * @sample {highcharts} highcharts/plotoptions/sunburst-levelsize/
             *         Sunburst with various sizes per level
             */
            value: 1,
            /**
             * How to interpret `levelSize.value`.
             *
             * - `percentage` gives a width relative to result of outer radius
             *   minus inner radius.
             *
             * - `pixels` gives the ring a fixed width in pixels.
             *
             * - `weight` takes the remaining width after percentage and pixels,
             *   and distributes it accross all "weighted" levels. The value
             *   relative to the sum of all weights determines the width.
             *
             * @sample {highcharts} highcharts/plotoptions/sunburst-levelsize/
             *         Sunburst with various sizes per level
             *
             * @validvalue ["percentage", "pixels", "weight"]
             */
            unit: 'weight'
        },

        /**
         * Options for the button appearing when traversing down in a sunburst.
         * Since v9.3.3 the `traverseUpButton` is replaced by `breadcrumbs`.
         *
         * @extends   plotOptions.treemap.traverseUpButton
         * @since     6.0.0
         * @deprecated
         * @apioption plotOptions.sunburst.traverseUpButton
         *
         */

        /**
         * If a point is sliced, moved out from the center, how many pixels
         * should it be moved?.
         *
         * @sample highcharts/plotoptions/sunburst-sliced
         *         Sliced sunburst
         *
         * @since 6.0.4
         *
         * @private
         */
        slicedOffset: 10
    } as SunburstSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public center: Array<number> = void 0 as any;

    public data: Array<SunburstPoint> = void 0 as any;

    public mapOptionsToLevel: Record<string, SunburstSeriesOptions> = void 0 as any;

    public nodeMap: Record<string, SunburstNode> = void 0 as any;

    public options: SunburstSeriesOptions = void 0 as any;

    public points: Array<SunburstPoint> = void 0 as any;

    public shapeRoot?: SunburstNode.NodeValuesObject = void 0 as any;

    public startAndEndRadians: CU.RadianAngles = void 0 as any;

    public tree: SunburstNode = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public alignDataLabel(
        _point: SunburstPoint,
        _dataLabel: SVGLabel,
        labelOptions: DataLabelOptions
    ): void {

        if (labelOptions.textPath && labelOptions.textPath.enabled) {
            return;
        }
        return super.alignDataLabel.apply(this, arguments);
    }

    /**
     * Animate the slices in. Similar to the animation of polar charts.
     * @private
     */
    public animate(init?: boolean): void {
        let chart = this.chart,
            center = [
                chart.plotWidth / 2,
                chart.plotHeight / 2
            ],
            plotLeft = chart.plotLeft,
            plotTop = chart.plotTop,
            attribs,
            group: SVGElement = this.group as any;

        // Initialize the animation
        if (init) {

            // Scale down the group and place it in the center
            attribs = {
                translateX: center[0] + plotLeft,
                translateY: center[1] + plotTop,
                scaleX: 0.001, // #1499
                scaleY: 0.001,
                rotation: 10,
                opacity: 0.01
            };

            group.attr(attribs);

        // Run the animation
        } else {
            attribs = {
                translateX: plotLeft,
                translateY: plotTop,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                opacity: 1
            };
            group.animate(attribs, this.options.animation);
        }
    }

    public drawPoints(): void {
        let series = this,
            mapOptionsToLevel = series.mapOptionsToLevel,
            shapeRoot = series.shapeRoot,
            group: SVGElement = series.group as any,
            hasRendered = series.hasRendered,
            idRoot = series.rootNode,
            idPreviousRoot = series.idPreviousRoot,
            nodeMap = series.nodeMap,
            nodePreviousRoot = nodeMap[idPreviousRoot as any],
            shapePreviousRoot = nodePreviousRoot && nodePreviousRoot.shapeArgs,
            points = series.points,
            radians = series.startAndEndRadians,
            chart = series.chart,
            optionsChart = chart && chart.options && chart.options.chart || {},
            animation = (
                isBoolean(optionsChart.animation) ?
                    optionsChart.animation :
                    true
            ),
            positions = series.center,
            center = {
                x: positions[0],
                y: positions[1]
            },
            innerR = positions[3] / 2,
            renderer = series.chart.renderer,
            animateLabels: (Function|undefined),
            animateLabelsCalled = false,
            addedHack = false,
            hackDataLabelAnimation = !!(
                animation &&
                hasRendered &&
                idRoot !== idPreviousRoot &&
                series.dataLabelsGroup
            );

        if (hackDataLabelAnimation) {
            (series.dataLabelsGroup as any).attr({ opacity: 0 });
            animateLabels = function (): void {
                const s = series;

                animateLabelsCalled = true;
                if (s.dataLabelsGroup) {
                    s.dataLabelsGroup.animate({
                        opacity: 1,
                        visibility: 'inherit'
                    });
                }
            };
        }
        points.forEach(function (point): void {
            let node = point.node,
                level = mapOptionsToLevel[node.level],
                shapeExisting: SunburstNode.NodeValuesObject = (
                    point.shapeExisting || ({} as any)
                ),
                shape: SunburstNode.NodeValuesObject =
                    node.shapeArgs || ({} as any),
                animationInfo,
                onComplete,
                visible = !!(node.visible && node.shapeArgs);

            // Border radius requires the border-radius.js module. Adding it
            // here because the SunburstSeries is a mess and I can't find the
            // regular shapeArgs. Usually shapeArgs are created in the series'
            // `translate` function and then passed directly on to the renderer
            // in the `drawPoints` function.
            shape.borderRadius = series.options.borderRadius;

            if (hasRendered && animation) {
                animationInfo = getAnimation(shape, {
                    center: center,
                    point: point,
                    radians: radians,
                    innerR: innerR,
                    idRoot: idRoot,
                    idPreviousRoot: idPreviousRoot,
                    shapeExisting: shapeExisting,
                    shapeRoot: shapeRoot,
                    shapePreviousRoot: shapePreviousRoot,
                    visible: visible
                });
            } else {
                // When animation is disabled, attr is called from animation.
                animationInfo = {
                    to: shape,
                    from: {}
                };
            }
            extend(point, {
                shapeExisting: shape, // Store for use in animation
                tooltipPos: [(shape as any).plotX, (shape as any).plotY],
                drillId: getDrillId(point, idRoot, nodeMap),
                name: '' + (point.name || point.id || point.index),
                plotX: (shape as any).plotX, // used for data label position
                plotY: (shape as any).plotY, // used for data label position
                value: node.val,
                isInside: visible,
                isNull: !visible // used for dataLabels & point.draw
            });
            point.dlOptions = getDlOptions({
                point: point,
                level: level,
                optionsPoint: point.options,
                shapeArgs: shape
            });
            if (!addedHack && visible) {
                addedHack = true;
                onComplete = animateLabels;
            }
            point.draw({
                animatableAttribs: animationInfo.to,
                attribs: extend(
                    animationInfo.from,
                    (!chart.styledMode && series.pointAttribs(
                        point,
                        (point.selected && 'select') as any
                    ) as any)
                ),
                onComplete: onComplete,
                group: group,
                renderer: renderer,
                shapeType: 'arc',
                shapeArgs: shape
            });
        });
        // Draw data labels after points
        // TODO draw labels one by one to avoid addtional looping
        if (hackDataLabelAnimation && addedHack) {
            series.hasRendered = false;
            (series.options.dataLabels as any).defer = true;
            Series.prototype.drawDataLabels.call(series);
            series.hasRendered = true;
            // If animateLabels is called before labels were hidden, then call
            // it again.
            if (animateLabelsCalled) {
                (animateLabels as any)();
            }
        } else {
            Series.prototype.drawDataLabels.call(series);
        }

        series.idPreviousRoot = idRoot;
    }

    /**
     * The layout algorithm for the levels.
     * @private
     */
    public layoutAlgorithm(
        parent: SunburstNode.NodeValuesObject,
        children: Array<SunburstNode>,
        options: SunburstSeriesOptions
    ): Array<SunburstNode.NodeValuesObject> {
        let startAngle = parent.start,
            range = parent.end - startAngle,
            total = parent.val,
            x = parent.x,
            y = parent.y,
            radius = (
                (
                    options &&
                    isObject(options.levelSize) &&
                    isNumber((options.levelSize as any).value)
                ) ?
                    (options.levelSize as any).value :
                    0
            ),
            innerRadius = parent.r,
            outerRadius = innerRadius + radius,
            slicedOffset = options && isNumber(options.slicedOffset) ?
                options.slicedOffset :
                0;

        return (children || []).reduce(
            function (arr, child): Array<SunburstNode.NodeValuesObject> {
                const percentage = (1 / total) * child.val,
                    radians = percentage * range,
                    radiansCenter = startAngle + (radians / 2),
                    offsetPosition = getEndPoint(
                        x,
                        y,
                        radiansCenter,
                        slicedOffset
                    ),
                    values: SunburstNode.NodeValuesObject = {
                        x: child.sliced ? offsetPosition.x : x,
                        y: child.sliced ? offsetPosition.y : y,
                        innerR: innerRadius,
                        r: outerRadius,
                        radius: radius,
                        start: startAngle,
                        end: startAngle + radians
                    } as any;

                arr.push(values);
                startAngle = values.end;
                return arr;
            }, [] as Array<SunburstNode.NodeValuesObject>
        );
    }

    public setRootNode(
        id: string,
        redraw?: boolean,
        eventArguments?: SunburstSeries.SetRootNodeObject
    ): void {
        const series = this;

        if ( // If the target node is the only one at level 1, skip it. (#18658)
            series.nodeMap[id].level === 1 &&
            series.nodeList
                .filter((node): boolean => node.level === 1)
                .length === 1
        ) {
            if (series.idPreviousRoot === '') {
                return;
            }

            id = '';
        }

        super.setRootNode(id, redraw, eventArguments);
    }

    /**
     * Set the shape arguments on the nodes. Recursive from root down.
     * @private
     */
    public setShapeArgs(
        parent: SunburstNode,
        parentValues: SunburstNode.NodeValuesObject,
        mapOptionsToLevel: (
            Record<string, SunburstSeriesOptions>
        )
    ): void {
        let childrenValues: Array<SunburstNode.NodeValuesObject> = [],
            level = parent.level + 1,
            options = mapOptionsToLevel[level],
            // Collect all children which should be included
            children = parent.children.filter(function (n): boolean {
                return n.visible;
            }),
            twoPi = 6.28; // Two times Pi.

        childrenValues = this.layoutAlgorithm(parentValues, children, options);
        children.forEach(function (child, index): void {
            const values = childrenValues[index],
                angle = values.start + ((values.end - values.start) / 2),
                radius = values.innerR + ((values.r - values.innerR) / 2),
                radians = (values.end - values.start),
                isCircle = (values.innerR === 0 && radians > twoPi),
                center = (
                    isCircle ?
                        { x: values.x, y: values.y } :
                        getEndPoint(values.x, values.y, angle, radius)
                ),
                val = (
                    child.val ?
                        (
                            child.childrenTotal > child.val ?
                                child.childrenTotal :
                                child.val
                        ) :
                        child.childrenTotal
                );

            // The inner arc length is a convenience for data label filters.
            if (this.points[child.i]) {
                this.points[child.i].innerArcLength = radians * values.innerR;
                this.points[child.i].outerArcLength = radians * values.r;
            }

            child.shapeArgs = merge(values, {
                plotX: center.x,
                plotY: center.y + 4 * Math.abs(Math.cos(angle))
            });
            child.values = merge(values, {
                val: val
            });
            // If node has children, then call method recursively
            if (child.children.length) {
                this.setShapeArgs(
                    child,
                    child.values as any,
                    mapOptionsToLevel
                );
            }
        }, this);
    }

    public translate(this: SunburstSeries): void {
        let series = this,
            options = series.options,
            positions = series.center = series.getCenter(),
            radians = series.startAndEndRadians = getStartAndEndRadians(
                options.startAngle,
                options.endAngle
            ),
            innerRadius = positions[3] / 2,
            outerRadius = positions[2] / 2,
            diffRadius = outerRadius - innerRadius,
            // NOTE: updateRootId modifies series.
            rootId = updateRootId(series),
            mapIdToNode = series.nodeMap,
            mapOptionsToLevel: Record<string, SunburstSeriesOptions>,
            idTop,
            nodeRoot = mapIdToNode && mapIdToNode[rootId],
            nodeTop,
            tree: SunburstNode,
            values: SunburstNode.NodeValuesObject,
            nodeIds: Record<string, boolean> = {};

        series.shapeRoot = nodeRoot && nodeRoot.shapeArgs;

        if (!this.processedXData) { // hidden series
            this.processData();
        }
        this.generatePoints();

        fireEvent(this, 'afterTranslate');

        // @todo Only if series.isDirtyData is true
        tree = series.tree = series.getTree();

        // Render traverseUpButton, after series.nodeMap i calculated.
        mapIdToNode = series.nodeMap;
        nodeRoot = mapIdToNode[rootId];
        idTop = isString(nodeRoot.parent) ? nodeRoot.parent : '';
        nodeTop = mapIdToNode[idTop];
        const { from, to } = SunburstUtilities.getLevelFromAndTo(nodeRoot);
        mapOptionsToLevel = getLevelOptions<SunburstSeries>({
            from,
            levels: series.options.levels,
            to,
            defaults: {
                colorByPoint: options.colorByPoint,
                dataLabels: options.dataLabels,
                levelIsConstant: options.levelIsConstant,
                levelSize: options.levelSize,
                slicedOffset: options.slicedOffset
            }
        }) as any;
        // NOTE consider doing calculateLevelSizes in a callback to
        // getLevelOptions
        mapOptionsToLevel = SunburstUtilities.calculateLevelSizes(
            mapOptionsToLevel as any,
            {
                diffRadius,
                from,
                to
            }
        ) as any;
        // TODO Try to combine setTreeValues & setColorRecursive to avoid
        //  unnecessary looping.
        setTreeValues(tree, {
            before: cbSetTreeValuesBefore,
            idRoot: rootId,
            levelIsConstant: options.levelIsConstant,
            mapOptionsToLevel: mapOptionsToLevel,
            mapIdToNode: mapIdToNode,
            points: series.points,
            series: series
        } as any);
        values = mapIdToNode[''].shapeArgs = {
            end: radians.end,
            r: innerRadius,
            start: radians.start,
            val: nodeRoot.val,
            x: positions[0],
            y: positions[1]
        } as any;
        this.setShapeArgs(nodeTop, values, mapOptionsToLevel);
        // Set mapOptionsToLevel on series for use in drawPoints.
        series.mapOptionsToLevel = mapOptionsToLevel;

        // #10669 - verify if all nodes have unique ids
        series.data.forEach(function (child): void {
            if (nodeIds[child.id]) {
                error(31, false, series.chart);
            }
            // map
            nodeIds[child.id] = true;
        });

        // reset object
        nodeIds = {};
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface SunburstSeries {
    getCenter: typeof CU['getCenter'];
    pointClass: typeof SunburstPoint;
    utils: typeof SunburstUtilities;
    NodeClass: typeof SunburstNode;
}
extend(SunburstSeries.prototype, {
    axisTypes: [],
    drawDataLabels: noop, // drawDataLabels is called in drawPoints
    getCenter: getCenter,
    isCartesian: false,
    // Mark that the sunburst is supported by the series on point feature.
    onPointSupported: true,
    pointAttribs: ColumnSeries.prototype.pointAttribs as any,
    pointClass: SunburstPoint,
    NodeClass: SunburstNode,
    utils: SunburstUtilities
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace SunburstSeries {

    /* *
     *
     *  Declarations
     *
     * */

    export interface AnimationParams {
        center: PositionObject;
        idPreviousRoot?: string;
        idRoot: string;
        innerR: number;
        point: SunburstPoint;
        radians: CU.RadianAngles;
        shapeExisting: SunburstNode.NodeValuesObject;
        shapePreviousRoot?: SunburstNode.NodeValuesObject;
        shapeRoot?: SunburstNode.NodeValuesObject;
        visible: boolean;
    }

    export interface DlOptionsParams {
        level: SunburstSeriesOptions;
        optionsPoint: SunburstPointOptions;
        point: SunburstPoint;
        shapeArgs: SunburstNode.NodeValuesObject;
    }

    export interface SetRootNodeObject {
        newRootId?: string;
        previousRootId?: string;
        redraw?: boolean;
        series?: object;
        trigger?: string;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        sunburst: typeof SunburstSeries;
    }
}
SeriesRegistry.registerSeriesType('sunburst', SunburstSeries);

/* *
 *
 *  Default Export
 *
 * */

export default SunburstSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `sunburst` series. If the [type](#series.sunburst.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.sunburst
 * @excluding dataParser, dataURL, stack, dataSorting, boostThreshold,
 *            boostBlending
 * @product   highcharts
 * @requires  modules/sunburst.js
 * @apioption series.sunburst
 */

/**
 * @type      {Array<number|null|*>}
 * @extends   series.treemap.data
 * @excluding x, y
 * @product   highcharts
 * @apioption series.sunburst.data
 */

/**
 * @type      {Highcharts.SeriesSunburstDataLabelsOptionsObject|Array<Highcharts.SeriesSunburstDataLabelsOptionsObject>}
 * @product   highcharts
 * @apioption series.sunburst.data.dataLabels
 */

/**
 * The value of the point, resulting in a relative area of the point
 * in the sunburst.
 *
 * @type      {number|null}
 * @since     6.0.0
 * @product   highcharts
 * @apioption series.sunburst.data.value
 */

/**
 * Use this option to build a tree structure. The value should be the id of the
 * point which is the parent. If no points has a matching id, or this option is
 * undefined, then the parent will be set to the root.
 *
 * @type      {string}
 * @since     6.0.0
 * @product   highcharts
 * @apioption series.sunburst.data.parent
 */

/**
  * Whether to display a slice offset from the center. When a sunburst point is
  * sliced, its children are also offset.
  *
  * @sample highcharts/plotoptions/sunburst-sliced
  *         Sliced sunburst
  *
  * @type      {boolean}
  * @default   false
  * @since     6.0.4
  * @product   highcharts
  * @apioption series.sunburst.data.sliced
  */

''; // detach doclets above
