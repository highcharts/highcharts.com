/* *
 *
 *  This module implements sunburst charts in Highcharts.
 *
 *  (c) 2016-2024 Highsoft AS
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
import type SunburstPointOptions from './SunburstPointOptions';
import type {
    SunburstDataLabelOptions,
    SunburstSeriesLevelOptions,
    SunburstSeriesOptions
} from './SunburstSeriesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
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
    column: ColumnSeries,
    treemap: TreemapSeries
} = SeriesRegistry.seriesTypes;
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
import SunburstSeriesDefaults from './SunburstSeriesDefaults.js';
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
import SVGElement from '../../Core/Renderer/SVG/SVGElement.js';
import TextPath from '../../Extensions/TextPath.js';
TextPath.compose(SVGElement);

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

/** @private */
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

/** @private */
function getDlOptions(
    params: SunburstSeries.DlOptionsParams
): SunburstDataLabelOptions {
    // Set options to new object to avoid problems with scope
    const point = params.point,
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
        padding: Array<number> = splat(options.padding || 0),
        paddingLeft = padding[3 % padding.length],
        paddingRight = padding[1 % padding.length],
        { innerArcLength = 0, outerArcLength = 0 } = point;

    let rotationRad: (number|undefined),
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
                innerArcLength < 1 &&
                outerArcLength > (shape.radius as any)
            ) {
                rotationRad = 0;
                // Trigger setTextPath function to get textOutline etc.
                if (point.dataLabelPath && rotationMode === 'circular') {
                    options.textPath = {
                        enabled: true
                    };
                }
            } else if (
                innerArcLength > 1 &&
                outerArcLength > 1.5 * (shape.radius as any)
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
                    point.dataLabel?.textPath &&
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
                (outerArcLength + innerArcLength) / 2
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

        if (rotationMode === 'perpendicular') {
            // 16 is the inferred line height. We don't know the real line
            // yet because the label is not rendered. A better approach for this
            // would be to hide the label from the `alignDataLabel` function
            // when the actual line height is known.
            if (outerArcLength < 16) {
                (options.style as any).width = 1;
            } else {
                (options.style as any).lineClamp = Math.floor(
                    innerArcLength / 16
                ) || 1;
            }
        }

        // Apply padding (#8515)
        (options.style as any).width = Math.max(
            (options.style as any).width - paddingLeft - paddingRight,
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
                (point.shapeExisting.r * 2) - paddingLeft - paddingRight,
                1
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
                    paddingLeft - paddingRight,
                1
            );
            (options.style as any).whiteSpace = 'nowrap';
        }
    }
    return options;
}

/** @private */
function getAnimation(
    shape: SunburstNode.NodeValuesObject,
    params: SunburstSeries.AnimationParams
): Record<string, Record<string, number>> {
    const point = params.point,
        radians = params.radians,
        innerR = params.innerR,
        idRoot = params.idRoot,
        idPreviousRoot = params.idPreviousRoot,
        shapeExisting = params.shapeExisting,
        shapeRoot = params.shapeRoot,
        shapePreviousRoot = params.shapePreviousRoot,
        visible = params.visible;

    let from: Record<string, number> = {},
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

/** @private */
function getDrillId(
    point: SunburstPoint,
    idRoot: string,
    mapIdToNode: Record<string, SunburstNode>
): (string|undefined) {
    const node = point.node;

    let drillId,
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

/** @private */
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

    public static defaultOptions: SunburstSeriesOptions = merge(
        TreemapSeries.defaultOptions,
        SunburstSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public center!: Array<number>;

    public data!: Array<SunburstPoint>;

    public mapOptionsToLevel!: Record<string, SunburstSeriesLevelOptions>;

    public nodeMap!: Record<string, SunburstNode>;

    public options!: SunburstSeriesOptions;

    public points!: Array<SunburstPoint>;

    public shapeRoot?: SunburstNode.NodeValuesObject;

    public startAndEndRadians!: CU.RadianAngles;

    public tree!: SunburstNode;

    /* *
     *
     *  Functions
     *
     * */

    public alignDataLabel(
        point: SunburstPoint,
        dataLabel: SVGLabel,
        labelOptions: DataLabelOptions
    ): void {

        if (labelOptions.textPath && labelOptions.textPath.enabled) {
            return;
        }

        // In sunburst dataLabel may be placed, but this should be reset to
        // make sure the dataLabel can be aligned to a new position (#21913)
        dataLabel.placed = false;

        return super.alignDataLabel.apply(this, arguments);
    }

    /**
     * Animate the slices in. Similar to the animation of polar charts.
     * @private
     */
    public animate(init?: boolean): void {
        const chart = this.chart,
            center = [
                chart.plotWidth / 2,
                chart.plotHeight / 2
            ],
            plotLeft = chart.plotLeft,
            plotTop = chart.plotTop,
            group: SVGElement = this.group as any;

        let attribs: SVGAttributes;

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
        const series = this,
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
            hackDataLabelAnimation = !!(
                animation &&
                hasRendered &&
                idRoot !== idPreviousRoot &&
                series.dataLabelsGroup
            );

        let animateLabels: (Function|undefined),
            animateLabelsCalled = false,
            addedHack = false;

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
        for (const point of points) {
            const node = point.node,
                level = mapOptionsToLevel[node.level],
                shapeExisting: SunburstNode.NodeValuesObject = (
                    point.shapeExisting || ({} as any)
                ),
                shape: SunburstNode.NodeValuesObject =
                    node.shapeArgs || ({} as any),
                visible = !!(node.visible && node.shapeArgs);

            let animationInfo,
                onComplete;

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
                plotX: (shape as any).plotX, // Used for data label position
                plotY: (shape as any).plotY, // Used for data label position
                value: node.val,
                isInside: visible,
                isNull: !visible // Used for dataLabels & point.draw
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
        }

        // Draw data labels after points
        // TODO draw labels one by one to avoid additional looping
        if (hackDataLabelAnimation && addedHack) {
            series.hasRendered = false;
            (series.options.dataLabels as any).defer = true;
            ColumnSeries.prototype.drawDataLabels.call(series);
            series.hasRendered = true;
            // If animateLabels is called before labels were hidden, then call
            // it again.
            if (animateLabelsCalled) {
                (animateLabels as any)();
            }
        } else {
            ColumnSeries.prototype.drawDataLabels.call(series);
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
        options: (SunburstSeriesOptions|SunburstSeriesLevelOptions)
    ): Array<SunburstNode.NodeValuesObject> {
        let startAngle = parent.start;

        const range = parent.end - startAngle,
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

        return (children || []).reduce((
            arr,
            child
        ): Array<SunburstNode.NodeValuesObject> => {
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
        }, [] as Array<SunburstNode.NodeValuesObject>);
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
        mapOptionsToLevel: Record<string, SunburstSeriesLevelOptions>
    ): void {
        const level = parent.level + 1,
            options = mapOptionsToLevel[level],
            // Collect all children which should be included
            children = parent.children.filter(function (n): boolean {
                return n.visible;
            }),
            twoPi = 6.28; // Two times Pi.

        let childrenValues: Array<SunburstNode.NodeValuesObject> = [];

        childrenValues = this.layoutAlgorithm(parentValues, children, options);

        let i = -1;

        for (const child of children) {
            const values = childrenValues[++i],
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
                plotY: center.y
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
        }
    }

    public translate(this: SunburstSeries): void {
        const series = this,
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
            rootId = updateRootId(series);

        let mapIdToNode = series.nodeMap,
            mapOptionsToLevel: Record<string, SunburstSeriesLevelOptions>,
            nodeRoot = mapIdToNode && mapIdToNode[rootId],
            nodeIds: Record<string, boolean> = {};

        series.shapeRoot = nodeRoot && nodeRoot.shapeArgs;

        series.generatePoints();

        fireEvent(series, 'afterTranslate');

        // @todo Only if series.isDirtyData is true
        const tree = series.tree = series.getTree();

        // Render traverseUpButton, after series.nodeMap i calculated.
        mapIdToNode = series.nodeMap;
        nodeRoot = mapIdToNode[rootId];
        const idTop = isString(nodeRoot.parent) ? nodeRoot.parent : '',
            nodeTop = mapIdToNode[idTop],
            { from, to } = SunburstUtilities.getLevelFromAndTo(nodeRoot);
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
        const values = mapIdToNode[''].shapeArgs = {
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
        for (const point of series.points) {
            if (nodeIds[point.id]) {
                error(31, false, series.chart);
            }
            // Map
            nodeIds[point.id] = true;
        }

        // Reset object
        nodeIds = {};
    }

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
    drawDataLabels: noop, // `drawDataLabels` is called in `drawPoints`
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
        level: SunburstSeriesLevelOptions;
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
