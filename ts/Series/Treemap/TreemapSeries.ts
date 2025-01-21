/* *
 *
 *  (c) 2014-2024 Highsoft AS
 *
 *  Authors: Jon Arild Nygard / Oystein Moseng
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

import type { BreadcrumbOptions } from '../../Extensions/Breadcrumbs/BreadcrumbsOptions';
import type Chart from '../../Core/Chart/Chart';
import type ColorAxisComposition from '../../Core/Axis/Color/ColorAxisComposition';
import type ColorType from '../../Core/Color/ColorType';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type DataExtremesObject from '../../Core/Series/DataExtremesObject';
import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type Series from '../../Core/Series/Series';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';
import type {
    TreemapSeriesLevelOptions,
    TreemapSeriesOptions
} from './TreemapSeriesOptions';

import Breadcrumbs from '../../Extensions/Breadcrumbs/Breadcrumbs.js';
import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import ColorMapComposition from '../ColorMapComposition.js';
import H from '../../Core/Globals.js';
const {
    composed,
    noop
} = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    scatter: ScatterSeries
} = SeriesRegistry.seriesTypes;
import TreemapAlgorithmGroup from './TreemapAlgorithmGroup.js';
import TreemapNode from './TreemapNode.js';
import TreemapPoint from './TreemapPoint.js';
import TreemapPointOptions from './TreemapPointOptions';
import TreemapSeriesDefaults from './TreemapSeriesDefaults.js';
import TreemapUtilities from './TreemapUtilities.js';
import TU from '../TreeUtilities.js';
const {
    getColor,
    getLevelOptions,
    updateRootId
} = TU;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    correctFloat,
    crisp,
    defined,
    error,
    extend,
    fireEvent,
    isArray,
    isObject,
    isString,
    merge,
    pick,
    pushUnique,
    splat,
    stableSort
} = U;

/* *
 *
 *  Constants
 *
 * */

const axisMax = 100;

/* *
 *
 *  Variables
 *
 * */

let treemapAxisDefaultValues = false;

/* *
 *
 *  Functions
 *
 * */

/** @private */
function onSeriesAfterBindAxes(
    this: Series
): void {
    const series = this,
        xAxis = series.xAxis,
        yAxis = series.yAxis;

    let treeAxis;

    if (xAxis && yAxis) {
        if (series.is('treemap')) {
            treeAxis = {
                endOnTick: false,
                gridLineWidth: 0,
                lineWidth: 0,
                min: 0,
                minPadding: 0,
                max: axisMax,
                maxPadding: 0,
                startOnTick: false,
                title: void 0,
                tickPositions: []
            };

            extend(yAxis.options, treeAxis);
            extend(xAxis.options, treeAxis);
            treemapAxisDefaultValues = true;

        } else if (treemapAxisDefaultValues) {
            yAxis.setOptions(yAxis.userOptions);
            xAxis.setOptions(xAxis.userOptions);
            treemapAxisDefaultValues = false;
        }
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
 * @name Highcharts.seriesTypes.treemap
 *
 * @augments Highcharts.Series
 */
class TreemapSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    static defaultOptions: TreemapSeriesOptions = merge(
        ScatterSeries.defaultOptions,
        TreemapSeriesDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        SeriesClass: typeof Series
    ): void {

        if (pushUnique(composed, 'TreemapSeries')) {
            addEvent(SeriesClass, 'afterBindAxes', onSeriesAfterBindAxes);
        }

    }

    /* *
     *
     *  Properties
     *
     * */

    public axisRatio!: number;

    public colorValueData?: Array<number>;

    public colorAxis?: ColorAxisComposition.SeriesComposition['colorAxis'];

    public data!: Array<TreemapPoint>;

    public drillUpButton?: SVGElement;

    public idPreviousRoot?: string;

    public mapOptionsToLevel!: Record<string, TreemapSeriesLevelOptions>;

    public nodeMap!: Record<string, TreemapNode>;

    public nodeList!: TreemapNode[];

    public options!: TreemapSeriesOptions;

    public parentList?: TreemapSeries.ListOfParentsObject;

    public points!: Array<TreemapPoint>;

    public rootNode!: string;

    public tree!: TreemapNode;

    public level?: number;

    /* *
     *
     *  Function
     *
     * */

    /* eslint-disable valid-jsdoc */

    public algorithmCalcPoints(
        directionChange: boolean,
        last: boolean,
        group: TreemapAlgorithmGroup,
        childrenArea: Array<unknown>
    ): void {
        const plot = group.plot,
            end = group.elArr.length - 1;

        let pX,
            pY,
            pW,
            pH,
            gW = group.lW,
            gH = group.lH,
            keep: (number|undefined),
            i = 0;

        if (last) {
            gW = group.nW;
            gH = group.nH;
        } else {
            keep = group.elArr[end];
        }
        for (const p of group.elArr) {
            if (last || (i < end)) {
                if (group.direction === 0) {
                    pX = plot.x;
                    pY = plot.y;
                    pW = gW;
                    pH = p / pW;
                } else {
                    pX = plot.x;
                    pY = plot.y;
                    pH = gH;
                    pW = p / pH;
                }
                childrenArea.push({
                    x: pX,
                    y: pY,
                    width: pW,
                    height: correctFloat(pH)
                });
                if (group.direction === 0) {
                    plot.y = plot.y + pH;
                } else {
                    plot.x = plot.x + pW;
                }
            }
            i = i + 1;
        }
        // Reset variables
        group.reset();
        if (group.direction === 0) {
            group.width = group.width - gW;
        } else {
            group.height = group.height - gH;
        }
        plot.y = plot.parent.y + (plot.parent.height - group.height);
        plot.x = plot.parent.x + (plot.parent.width - group.width);
        if (directionChange) {
            group.direction = 1 - group.direction;
        }
        // If not last, then add uncalculated element
        if (!last) {
            group.addElement(keep as any);
        }
    }

    public algorithmFill(
        directionChange: boolean,
        parent: TreemapNode.NodeValuesObject,
        children: Array<TreemapNode>
    ): Array<TreemapNode.NodeValuesObject> {
        const childrenArea: Array<TreemapNode.NodeValuesObject> = [];

        let pTot,
            direction = parent.direction,
            x = parent.x,
            y = parent.y,
            width = parent.width,
            height = parent.height,
            pX,
            pY,
            pW,
            pH;

        for (const child of children) {
            pTot =
                (parent.width * parent.height) * (child.val / parent.val);
            pX = x;
            pY = y;
            if (direction === 0) {
                pH = height;
                pW = pTot / pH;
                width = width - pW;
                x = x + pW;
            } else {
                pW = width;
                pH = pTot / pW;
                height = height - pH;
                y = y + pH;
            }
            childrenArea.push({
                x: pX,
                y: pY,
                width: pW,
                height: pH,
                direction: 0,
                val: 0
            });
            if (directionChange) {
                direction = 1 - direction;
            }
        }

        return childrenArea;
    }

    public algorithmLowAspectRatio(
        directionChange: boolean,
        parent: TreemapNode.NodeValuesObject,
        children: Array<TreemapNode>
    ): Array<TreemapNode.NodeValuesObject> {
        const series = this,
            childrenArea: Array<TreemapNode.NodeValuesObject> = [],
            plot: TreemapAlgorithmGroup.PlotObject = {
                x: parent.x,
                y: parent.y,
                parent: parent
            },
            direction = parent.direction,
            end = children.length - 1,
            group = new TreemapAlgorithmGroup(
                parent.height,
                parent.width,
                direction,
                plot
            );

        let pTot,
            i = 0;

        // Loop through and calculate all areas
        for (const child of children) {
            pTot =
                (parent.width * parent.height) * (child.val / parent.val);
            group.addElement(pTot);
            if (group.lP.nR > group.lP.lR) {
                (series.algorithmCalcPoints as any)(
                    directionChange,
                    false,
                    group,
                    childrenArea,
                    plot // @todo no supported
                );
            }
            // If last child, then calculate all remaining areas
            if (i === end) {
                (series.algorithmCalcPoints as any)(
                    directionChange,
                    true,
                    group,
                    childrenArea,
                    plot // @todo not supported
                );
            }
            ++i;
        }

        return childrenArea;
    }

    /**
     * Over the alignment method by setting z index.
     * @private
     */
    public alignDataLabel(
        point: TreemapPoint,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        dataLabel: SVGLabel,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        labelOptions: DataLabelOptions
    ): void {
        ColumnSeries.prototype.alignDataLabel.apply(this, arguments);
        if (point.dataLabel) {
            // `point.node.zIndex` could be undefined (#6956)
            point.dataLabel.attr({ zIndex: (point.node.zIndex || 0) + 1 });
        }
    }

    public applyTreeGrouping(): void {
        const series = this,
            parentList = series.parentList || {},
            { cluster } = series.options,
            minimumClusterSize = cluster?.minimumClusterSize || 5;

        if (cluster?.enabled) {
            const parentGroups: {[key: string]: TreemapNode[]} = {};

            const checkIfHide = (node: TreemapNode): void => {
                if (node?.point?.shapeArgs) {
                    const { width = 0, height = 0 } = node.point.shapeArgs,
                        area = width * height;

                    const {
                            pixelWidth = 0,
                            pixelHeight = 0
                        } = cluster,
                        compareHeight = defined(pixelHeight),
                        thresholdArea = pixelHeight ?
                            pixelWidth * pixelHeight :
                            pixelWidth * pixelWidth;

                    if (
                        width < pixelWidth ||
                            height < (
                                compareHeight ? pixelHeight : pixelWidth
                            ) ||
                            area < thresholdArea
                    ) {
                        if (!node.isGroup && defined(node.parent)) {
                            if (!parentGroups[node.parent]) {
                                parentGroups[node.parent] = [];
                            }
                            parentGroups[node.parent].push(node);
                        }
                    }
                }
                node?.children.forEach((child): void => {
                    checkIfHide(child);
                });
            };

            checkIfHide(series.tree);

            for (const parent in parentGroups) {
                if (parentGroups[parent]) {
                    if (parentGroups[parent].length > minimumClusterSize) {
                        parentGroups[parent].forEach((node): void => {
                            const index = parentList[parent].indexOf(node.i);
                            if (index !== -1) {
                                parentList[parent].splice(index, 1);

                                const id = `highcharts-grouped-treemap-points-${node.parent || 'root'}`;

                                let groupPoint = series.points
                                    .find((p): boolean => p.id === id);

                                if (!groupPoint) {
                                    const PointClass = series.pointClass,
                                        pointIndex = series.points.length;

                                    groupPoint = new PointClass(series, {
                                        className: cluster.className,
                                        color: cluster.color,
                                        id,
                                        index: pointIndex,
                                        isGroup: true,
                                        value: 0
                                    } as TreemapPointOptions);
                                    extend(groupPoint, {
                                        formatPrefix: 'cluster'
                                    });
                                    series.points.push(groupPoint);
                                    parentList[parent].push(pointIndex);
                                    parentList[id] = [];
                                }

                                const amount =
                                    groupPoint.groupedPointsAmount + 1,
                                    val = series.points[groupPoint.index]
                                        .options.value || 0,
                                    name = cluster.name ||
                                        `+ ${amount}`;

                                // Update the point directly in points array to
                                // prevent wrong instance update
                                series.points[groupPoint.index]
                                    .groupedPointsAmount = amount;
                                series.points[groupPoint.index].options.value =
                                    val + (node.point.value || 0);
                                series.points[groupPoint.index].name = name;

                                parentList[id].push(node.point.index);
                            }
                        });
                    }
                }
            }

            series.nodeMap = {};
            series.nodeList = [];
            series.parentList = parentList;
            const tree = series.buildTree('', -1, 0, series.parentList);

            series.translate(tree);
        }
    }

    /**
     * Recursive function which calculates the area for all children of a
     * node.
     *
     * @private
     * @function Highcharts.Series#calculateChildrenAreas
     *
     * @param {Object} parent
     * The node which is parent to the children.
     *
     * @param {Object} area
     * The rectangular area of the parent.
     */
    public calculateChildrenAreas(
        parent: TreemapNode,
        area: TreemapNode.NodeValuesObject
    ): void {
        const series = this,
            options = series.options,
            mapOptionsToLevel = series.mapOptionsToLevel,
            level = mapOptionsToLevel[parent.level + 1],
            algorithm = pick(
                (
                    level?.layoutAlgorithm &&
                    series[level?.layoutAlgorithm] &&
                    level.layoutAlgorithm
                ),
                series.options.layoutAlgorithm
            ),
            alternate = options.alternateStartingDirection,
            // Collect all children which should be included
            children = parent.children.filter((n): boolean =>
                parent.isGroup || !n.ignore
            );

        if (!algorithm) {
            return;
        }

        let childrenValues: Array<TreemapNode.NodeValuesObject> = [];

        if (level?.layoutStartingDirection) {
            area.direction = level.layoutStartingDirection === 'vertical' ?
                0 :
                1;
        }
        childrenValues = series[algorithm](area, children);
        let i = -1;
        for (const child of children) {
            const values: TreemapNode.NodeValuesObject = childrenValues[++i];

            child.values = merge(values, {
                val: child.childrenTotal,
                direction: (alternate ? 1 - area.direction : area.direction)
            });
            child.pointValues = merge(values, {
                x: (values.x / series.axisRatio),
                // Flip y-values to avoid visual regression with csvCoord in
                // Axis.translate at setPointValues. #12488
                y: axisMax - values.y - values.height,
                width: (values.width / series.axisRatio)
            } as TreemapNode.NodeValuesObject);
            // If node has children, then call method recursively
            if (child.children.length) {
                series.calculateChildrenAreas(child, child.values);
            }
        }
    }

    /**
     * Create level list.
     * @private
     */
    public createList(e: any): any {
        const chart = this.chart,
            breadcrumbs = chart.breadcrumbs,
            list: Array<BreadcrumbOptions> = [];

        if (breadcrumbs) {

            let currentLevelNumber = 0;

            list.push({
                level: currentLevelNumber,
                levelOptions: chart.series[0]
            });

            let node = e.target.nodeMap[e.newRootId];
            const extraNodes = [];

            // When the root node is set and has parent,
            // recreate the path from the node tree.
            while (node.parent || node.parent === '') {
                extraNodes.push(node);
                node = e.target.nodeMap[node.parent];
            }
            for (const node of extraNodes.reverse()) {
                list.push({
                    level: ++currentLevelNumber,
                    levelOptions: node
                });
            }
            // If the list has only first element, we should clear it
            if (list.length <= 1) {
                list.length = 0;
            }
        }

        return list;
    }

    /**
     * Extend drawDataLabels with logic to handle custom options related to
     * the treemap series:
     *
     * - Points which is not a leaf node, has dataLabels disabled by
     *   default.
     *
     * - Options set on series.levels is merged in.
     *
     * - Width of the dataLabel is set to match the width of the point
     *   shape.
     *
     * @private
     */
    public drawDataLabels(): void {
        const series = this,
            mapOptionsToLevel = series.mapOptionsToLevel,
            points = series.points.filter(function (
                n: TreemapPoint
            ): boolean {
                return n.node.visible || defined(n.dataLabel);
            }),
            padding = splat(series.options.dataLabels || {})[0]?.padding;

        let options: DataLabelOptions,
            level: TreemapSeriesLevelOptions;

        for (const point of points) {
            level = mapOptionsToLevel[point.node.level];
            // Set options to new object to avoid problems with scope
            options = { style: {} };

            // If not a leaf, then label should be disabled as default
            if (
                !point.node.isLeaf &&
                !point.node.isGroup ||
                (
                    point.node.isGroup &&
                    point.node.level <= series.nodeMap[series.rootNode].level
                )
            ) {
                options.enabled = false;
            }

            // If options for level exists, include them as well
            if (level?.dataLabels) {
                options = merge(options, level.dataLabels);
                series.hasDataLabels = (): boolean => true;
            }

            // Set dataLabel width to the width of the point shape minus the
            // padding
            if (point.shapeArgs) {
                const css = {
                    width: (
                        (point.shapeArgs.width || 0) -
                        2 * (
                            splat(options.padding)[0] || splat(padding)[0] || 0
                        )
                    ) + 'px',
                    lineClamp: Math.floor((point.shapeArgs.height || 0) / 16)
                };
                extend((options.style as any), css);
                point.dataLabel?.css(css);
            }

            // Merge custom options with point options
            point.dlOptions = merge(options, point.options.dataLabels);
        }
        super.drawDataLabels(points);
    }

    /**
     * Override drawPoints
     * @private
     */
    public drawPoints(points: Array<TreemapPoint> = this.points): void {
        const series = this,
            chart = series.chart,
            renderer = chart.renderer,
            styledMode = chart.styledMode,
            options = series.options,
            shadow = styledMode ? {} : options.shadow,
            borderRadius = options.borderRadius,
            withinAnimationLimit =
                chart.pointCount < (options.animationLimit as any),
            allowTraversingTree = options.allowTraversingTree;

        for (const point of points) {
            const levelDynamic = point.node.levelDynamic,
                animatableAttribs: SVGAttributes = {},
                attribs: SVGAttributes = {},
                css: CSSObject = {},
                groupKey = 'level-group-' + point.node.level,
                hasGraphic = !!point.graphic,
                shouldAnimate = withinAnimationLimit && hasGraphic,
                shapeArgs = point.shapeArgs;

            // Don't bother with calculate styling if the point is not drawn
            if (point.shouldDraw()) {
                point.isInside = true;

                if (borderRadius) {
                    attribs.r = borderRadius;
                }

                merge(
                    true, // Extend object
                    // Which object to extend
                    shouldAnimate ? animatableAttribs : attribs,
                    // Add shapeArgs to animate/attr if graphic exists
                    hasGraphic ? shapeArgs : {},
                    // Add style attribs if !styleMode
                    styledMode ?
                        {} :
                        series.pointAttribs(
                            point, point.selected ? 'select' : void 0
                        )
                );

                // In styled mode apply point.color. Use CSS, otherwise the
                // fill used in the style sheet will take precedence over
                // the fill attribute.
                if (series.colorAttribs && styledMode) {
                    // Heatmap is loaded
                    extend<CSSObject|SVGAttributes>(
                        css,
                        series.colorAttribs(point as any)
                    );
                }

                if (!(series as any)[groupKey]) {
                    (series as any)[groupKey] = renderer.g(groupKey)
                        .attr({
                            // @todo Set the zIndex based upon the number of
                            // levels, instead of using 1000
                            zIndex: 1000 - (levelDynamic || 0)
                        })
                        .add(series.group);
                    (series as any)[groupKey].survive = true;
                }
            }

            // Draw the point
            point.draw({
                animatableAttribs,
                attribs,
                css,
                group: (series as any)[groupKey],
                imageUrl: point.imageUrl,
                renderer,
                shadow,
                shapeArgs,
                shapeType: point.shapeType
            });

            // If setRootNode is allowed, set a point cursor on clickables &
            // add drillId to point
            if (allowTraversingTree && point.graphic) {
                point.drillId = options.interactByLeaf ?
                    series.drillToByLeaf(point) :
                    series.drillToByGroup(point);
            }
        }
    }

    /**
     * Finds the drill id for a parent node. Returns false if point should
     * not have a click event.
     * @private
     */
    public drillToByGroup(point: TreemapPoint): (boolean|string) {
        let drillId: (boolean|string) = false;

        if (
            (
                !point.node.isLeaf ||
                point.node.isGroup
            ) &&
            (point.node.level - this.nodeMap[this.rootNode].level) === 1
        ) {
            drillId = point.id;
        }

        return drillId;
    }

    /**
     * Finds the drill id for a leaf node. Returns false if point should not
     * have a click event
     * @private
     */
    public drillToByLeaf(point: TreemapPoint): (boolean|string) {
        const { traverseToLeaf } = point.series.options;

        let drillId: (boolean|string) = false,
            nodeParent: TreemapNode;

        if (
            (point.node.parent !== this.rootNode) &&
            point.node.isLeaf
        ) {
            if (traverseToLeaf) {
                drillId = point.id;
            } else {
                nodeParent = point.node;
                while (!drillId) {
                    if (typeof nodeParent.parent !== 'undefined') {
                        nodeParent = this.nodeMap[nodeParent.parent];
                    }
                    if (nodeParent.parent === this.rootNode) {
                        drillId = nodeParent.id;
                    }
                }
            }
        }
        return drillId;
    }

    /**
     * @todo remove this function at a suitable version.
     * @private
     */
    public drillToNode(
        id: string,
        redraw?: boolean
    ): void {
        error(
            32,
            false,
            void 0,
            { 'treemap.drillToNode': 'use treemap.setRootNode' }
        );
        this.setRootNode(id, redraw);
    }

    public drillUp(): void {
        const series = this,
            node = series.nodeMap[series.rootNode];

        if (node && isString(node.parent)) {
            series.setRootNode(
                node.parent,
                true,
                { trigger: 'traverseUpButton' }
            );
        }
    }

    public getExtremes(): DataExtremesObject {
        // Get the extremes from the value data
        const { dataMin, dataMax } = super.getExtremes(this.colorValueData);

        this.valueMin = dataMin;
        this.valueMax = dataMax;

        // Get the extremes from the y data
        return super.getExtremes();
    }

    /**
     * Creates an object map from parent id to childrens index.
     *
     * @private
     * @function Highcharts.Series#getListOfParents
     *
     * @param {Highcharts.SeriesTreemapDataOptions} [data]
     *        List of points set in options.
     *
     * @param {Array<string>} [existingIds]
     *        List of all point ids.
     *
     * @return {Object}
     *         Map from parent id to children index in data.
     */
    public getListOfParents(
        data: Array<TreemapPoint>,
        existingIds: Array<string>
    ): TreemapSeries.ListOfParentsObject {
        const arr = isArray(data) ? data : [],
            ids = isArray(existingIds) ? existingIds : [],
            listOfParents = arr.reduce(function (
                prev: TreemapSeries.ListOfParentsObject,
                curr: TreemapPoint,
                i: number
            ): TreemapSeries.ListOfParentsObject {
                const parent = pick(curr.parent, '');

                if (typeof prev[parent] === 'undefined') {
                    prev[parent] = [];
                }
                prev[parent].push(i);
                return prev;
            }, {
                '': [] // Root of tree
            });

        // If parent does not exist, hoist parent to root of tree.
        for (const parent of Object.keys(listOfParents)) {
            const children = listOfParents[parent];
            if ((parent !== '') && (ids.indexOf(parent) === -1)) {
                for (const child of children) {
                    listOfParents[''].push(child);
                }
                delete listOfParents[parent];
            }
        }

        return listOfParents;
    }

    /**
     * Creates a tree structured object from the series points.
     * @private
     */
    public getTree(): this['tree'] {
        const series = this,
            allIds = this.data.map(function (
                d: TreemapPoint
            ): string {
                return d.id;
            });

        series.parentList = series.getListOfParents(this.data, allIds);

        series.nodeMap = {};
        series.nodeList = [];
        return series.buildTree('', -1, 0, series.parentList || {});
    }

    public buildTree(
        id: string,
        index: number,
        level: number,
        list: Record<string, number[]>,
        parent?: string
    ): this['tree'] {
        const series = this,
            children: Array<TreemapNode> = [],
            point = series.points[index];

        let height = 0,
            child: TreemapNode;

        // Actions
        for (const i of (list[id] || [])) {
            child = series.buildTree(
                series.points[i].id,
                i,
                level + 1,
                list,
                id
            );
            height = Math.max(child.height + 1, height);
            children.push(child);
        }

        const node = new series.NodeClass().init(
            id,
            index,
            children,
            height,
            level,
            series,
            parent
        );

        for (const child of children) {
            child.parentNode = node;
        }

        series.nodeMap[node.id] = node;
        series.nodeList.push(node);

        if (point) {
            point.node = node;
            node.point = point;
        }

        return node;
    }
    /**
     * Define hasData function for non-cartesian series. Returns true if the
     * series has points at all.
     * @private
     */
    public hasData(): boolean {
        return !!this.dataTable.rowCount;
    }

    public init(
        chart: Chart,
        options: DeepPartial<TreemapSeriesOptions>
    ): void {

        const series = this,
            breadcrumbsOptions = merge(
                options.drillUpButton,
                options.breadcrumbs
            ),
            setOptionsEvent = addEvent(series, 'setOptions', (
                event: { userOptions: TreemapSeriesOptions }
            ): void => {
                const options = event.userOptions;

                if (
                    defined(options.allowDrillToNode) &&
                    !defined(options.allowTraversingTree)
                ) {
                    options.allowTraversingTree = options.allowDrillToNode;
                    delete options.allowDrillToNode;
                }

                if (
                    defined(options.drillUpButton) &&
                    !defined(options.traverseUpButton)
                ) {
                    options.traverseUpButton = options.drillUpButton;
                    delete options.drillUpButton;
                }
            });

        super.init(chart, options);

        // Treemap's opacity is a different option from other series
        delete series.opacity;

        // Handle deprecated options.
        series.eventsToUnbind.push(setOptionsEvent);

        if (series.options.allowTraversingTree) {
            series.eventsToUnbind.push(
                addEvent(series, 'click', series.onClickDrillToNode as any)
            );

            series.eventsToUnbind.push(
                addEvent(series, 'setRootNode', function (e: any): void {
                    const chart = series.chart;
                    if (chart.breadcrumbs) {
                        // Create a list using the event after drilldown.
                        chart.breadcrumbs.updateProperties(
                            series.createList(e)
                        );
                    }
                })
            );

            series.eventsToUnbind.push(
                addEvent(
                    series,
                    'update',
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    function (e: any, redraw?: boolean): void {
                        const breadcrumbs = this.chart.breadcrumbs;

                        if (breadcrumbs && e.options.breadcrumbs) {
                            breadcrumbs.update(e.options.breadcrumbs);
                        }
                    })
            );

            series.eventsToUnbind.push(
                addEvent(
                    series, 'destroy',
                    function destroyEvents(e: any): void {
                        const chart = this.chart;
                        if (chart.breadcrumbs && !e.keepEventsForUpdate) {
                            chart.breadcrumbs.destroy();
                            chart.breadcrumbs = void 0;
                        }
                    }
                )
            );
        }

        if (
            !chart.breadcrumbs
        ) {
            chart.breadcrumbs = new Breadcrumbs(
                chart as Chart,
                breadcrumbsOptions as any
            );
        }

        series.eventsToUnbind.push(
            addEvent(chart.breadcrumbs, 'up', function (
                e: any
            ): void {
                const drillUpsNumber = this.level - e.newLevel;

                for (let i = 0; i < drillUpsNumber; i++) {
                    series.drillUp();
                }
            })
        );
    }

    /**
     * Add drilling on the suitable points.
     * @private
     */
    public onClickDrillToNode(event: { point: TreemapPoint }): void {
        const series = this,
            point = event.point,
            drillId = point?.drillId;

        // If a drill id is returned, add click event and cursor.
        if (isString(drillId)) {
            point.setState(''); // Remove hover
            series.setRootNode(drillId, true, { trigger: 'click' });
        }
    }

    /**
     * Get presentational attributes
     * @private
     */
    public pointAttribs(
        point?: TreemapPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const series = this,
            mapOptionsToLevel = (
                isObject(series.mapOptionsToLevel) ?
                    series.mapOptionsToLevel :
                    {}
            ),
            level = point && mapOptionsToLevel[point.node.level] || {},
            options = this.options,
            stateOptions =
                state && options.states && options.states[state] || {},
            className = point?.getClassName() || '',
            // Set attributes by precedence. Point trumps level trumps series.
            // Stroke width uses pick because it can be 0.
            attr: SVGAttributes = {
                'stroke':
                    (point && (point as any).borderColor) ||
                    level.borderColor ||
                    stateOptions.borderColor ||
                    options.borderColor,
                'stroke-width': pick(
                    point && (point as any).borderWidth,
                    level.borderWidth,
                    stateOptions.borderWidth,
                    options.borderWidth
                ),
                'dashstyle':
                    (point as any)?.borderDashStyle ||
                    level.borderDashStyle ||
                    stateOptions.borderDashStyle ||
                    options.borderDashStyle,
                'fill': point?.color || this.color
            };

        let opacity: number;

        // Hide levels above the current view
        if (className.indexOf('highcharts-above-level') !== -1) {
            attr.fill = 'none';
            attr['stroke-width'] = 0;

            // Nodes with children that accept interaction
        } else if (
            className.indexOf('highcharts-internal-node-interactive') !== -1
        ) {
            opacity = pick(stateOptions.opacity, options.opacity as any);
            attr.fill = color(attr.fill).setOpacity(opacity).get();
            attr.cursor = 'pointer';
            // Hide nodes that have children
        } else if (className.indexOf('highcharts-internal-node') !== -1) {
            attr.fill = 'none';

        } else if (state) {
        // Brighten and hoist the hover nodes
            attr.fill = color(attr.fill)
                .brighten(stateOptions.brightness as any)
                .get();
        }

        return attr;
    }

    /**
     * Set the node's color recursively, from the parent down.
     * @private
     */
    public setColorRecursive(
        node: TreemapNode,
        parentColor?: ColorType,
        colorIndex?: number,
        index?: number,
        siblings?: number
    ): void {
        const series = this,
            chart = series?.chart,
            colors = chart?.options?.colors;

        if (node) {
            const colorInfo = getColor(node, {
                    colors: colors,
                    index: index,
                    mapOptionsToLevel: series.mapOptionsToLevel,
                    parentColor: parentColor,
                    parentColorIndex: colorIndex,
                    series: series,
                    siblings: siblings
                }),
                point = series.points[node.i];

            if (point) {
                point.color = colorInfo.color;
                point.colorIndex = colorInfo.colorIndex;
            }

            let i = -1;

            // Do it all again with the children
            for (const child of (node.children || [])) {
                series.setColorRecursive(
                    child,
                    colorInfo.color,
                    colorInfo.colorIndex,
                    ++i,
                    node.children.length
                );
            }
        }
    }

    public setPointValues(): void {
        const series = this;
        const { points, xAxis, yAxis } = series;
        const styledMode = series.chart.styledMode;

        // Get the crisp correction in classic mode. For this to work in
        // styled mode, we would need to first add the shape (without x,
        // y, width and height), then read the rendered stroke width
        // using point.graphic.strokeWidth(), then modify and apply the
        // shapeArgs. This applies also to column series, but the
        // downside is performance and code complexity.
        const getStrokeWidth = (point: TreemapPoint): number => (
            styledMode ?
                0 :
                (series.pointAttribs(point)['stroke-width'] || 0)
        );

        for (const point of points) {
            const { pointValues: values, visible } = point.node;

            // Points which is ignored, have no values.
            if (values && visible) {
                const { height, width, x, y } = values;
                const strokeWidth = getStrokeWidth(point);
                const x1 = crisp(xAxis.toPixels(x, true), strokeWidth, true);
                const x2 = crisp(
                    xAxis.toPixels(x + width, true),
                    strokeWidth,
                    true
                );
                const y1 = crisp(yAxis.toPixels(y, true), strokeWidth, true);
                const y2 = crisp(
                    yAxis.toPixels(y + height, true),
                    strokeWidth,
                    true
                );

                // Set point values
                const shapeArgs = {
                    x: Math.min(x1, x2),
                    y: Math.min(y1, y2),
                    width: Math.abs(x2 - x1),
                    height: Math.abs(y2 - y1)
                };
                point.plotX = shapeArgs.x + (shapeArgs.width / 2);
                point.plotY = shapeArgs.y + (shapeArgs.height / 2);

                point.shapeArgs = shapeArgs;
            } else {
            // Reset visibility
                delete point.plotX;
                delete point.plotY;
            }
        }
    }

    /**
     * Sets a new root node for the series.
     *
     * @private
     * @function Highcharts.Series#setRootNode
     *
     * @param {string} id
     * The id of the new root node.
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart or not.
     *
     * @param {Object} [eventArguments]
     * Arguments to be accessed in event handler.
     *
     * @param {string} [eventArguments.newRootId]
     * Id of the new root.
     *
     * @param {string} [eventArguments.previousRootId]
     * Id of the previous root.
     *
     * @param {boolean} [eventArguments.redraw]
     * Whether to redraw the chart after.
     *
     * @param {Object} [eventArguments.series]
     * The series to update the root of.
     *
     * @param {string} [eventArguments.trigger]
     * The action which triggered the event. Undefined if the setRootNode is
     * called directly.
     *
     * @emits Highcharts.Series#event:setRootNode
     */
    public setRootNode(
        id: string,
        redraw?: boolean,
        eventArguments?: TreemapSeries.SetRootNodeObject
    ): void {
        const series = this,
            eventArgs: TreemapSeries.SetRootNodeObject =
                extend<TreemapSeries.SetRootNodeObject>({
                    newRootId: id,
                    previousRootId: series.rootNode,
                    redraw: pick(redraw, true),
                    series: series
                }, eventArguments as any);

        /**
         * The default functionality of the setRootNode event.
         *
         * @private
         * @param {Object} args The event arguments.
         * @param {string} args.newRootId Id of the new root.
         * @param {string} args.previousRootId Id of the previous root.
         * @param {boolean} args.redraw Whether to redraw the chart after.
         * @param {Object} args.series The series to update the root of.
         * @param {string} [args.trigger=undefined] The action which
         * triggered the event. Undefined if the setRootNode is called
         * directly.
             */
        const defaultFn = function (
            args: {
                newRootId: string;
                previousRootId: string;
                redraw: boolean;
                series: TreemapSeries;
                trigger?: string;
            }
        ): void {
            const series = args.series;

            // Store previous and new root ids on the series.
            series.idPreviousRoot = args.previousRootId;
            series.rootNode = args.newRootId;

            // Redraw the chart
            series.isDirty = true; // Force redraw
            if (args.redraw) {
                series.chart.redraw();
            }
        };

        // Fire setRootNode event.
        fireEvent(series, 'setRootNode', eventArgs, defaultFn);
    }

    /**
     * Workaround for `inactive` state. Since `series.opacity` option is
     * already reserved, don't use that state at all by disabling
     * `inactiveOtherPoints` and not inheriting states by points.
     * @private
     */
    public setState(state: StatesOptionsKey): void {
        this.options.inactiveOtherPoints = true;
        super.setState(state, false);
        this.options.inactiveOtherPoints = false;
    }

    public setTreeValues(tree: TreemapNode): TreemapNode {
        const series = this,
            options = series.options,
            idRoot = series.rootNode,
            mapIdToNode = series.nodeMap,
            nodeRoot = mapIdToNode[idRoot],
            levelIsConstant = (
                typeof options.levelIsConstant === 'boolean' ?
                    options.levelIsConstant :
                    true
            ),
            children: Array<TreemapNode> = [],
            point = series.points[tree.i];

        // First give the children some values
        let childrenTotal = 0;
        for (let child of tree.children) {
            child = series.setTreeValues(child);
            children.push(child);
            if (!child.ignore) {
                childrenTotal += child.val as any;
            }
        }

        // Sort the children
        stableSort(children, (a, b): number => (
            (a.sortIndex || 0) - (b.sortIndex || 0)
        ));

        // Set the values
        let val = pick(point?.options.value, childrenTotal);

        if (point) {
            point.value = val;
        }

        if (point?.isGroup && options.cluster?.reductionFactor) {
            val /= options.cluster.reductionFactor;
        }

        if (
            tree.parentNode?.point?.isGroup && series.rootNode !== tree.parent
        ) {
            tree.visible = false;
        }

        extend(tree, {
            children: children,
            childrenTotal: childrenTotal,
            // Ignore this node if point is not visible
            ignore: !(pick(point?.visible, true) && (val > 0)),
            isLeaf: tree.visible && !childrenTotal,
            isGroup: point?.isGroup,
            levelDynamic: (
                tree.level - (levelIsConstant ? 0 : nodeRoot.level)
            ),
            name: pick(point?.name, ''),
            sortIndex: pick(point?.sortIndex, -val),
            val: val
        });
        return tree;
    }

    public sliceAndDice(
        parent: TreemapNode.NodeValuesObject,
        children: Array<TreemapNode>
    ): Array<TreemapNode.NodeValuesObject> {
        return this.algorithmFill(true, parent, children);
    }

    public squarified(
        parent: TreemapNode.NodeValuesObject,
        children: Array<TreemapNode>
    ): Array<TreemapNode.NodeValuesObject> {
        return this.algorithmLowAspectRatio(true, parent, children);
    }

    public strip(
        parent: TreemapNode.NodeValuesObject,
        children: Array<TreemapNode>
    ): Array<TreemapNode.NodeValuesObject> {
        return this.algorithmLowAspectRatio(false, parent, children);
    }

    public stripes(
        parent: TreemapNode.NodeValuesObject,
        children: Array<TreemapNode>
    ): Array<TreemapNode.NodeValuesObject> {
        return this.algorithmFill(false, parent, children);
    }

    public translate(tree?: this['tree']): void {
        const series = this,
            options = series.options,
            applyGrouping = !tree;

        let // NOTE: updateRootId modifies series.
            rootId = updateRootId(series),
            rootNode,
            pointValues,
            seriesArea,
            val: TreemapNode.NodeValuesObject;

        if (!tree && !rootId.startsWith('highcharts-grouped-treemap-points-')) {
            // Group points are removed, but not destroyed during generatePoints
            (this.points || []).forEach((point): void => {
                if (point.isGroup) {
                    point.destroy();
                }
            });

            // Call prototype function
            super.translate();
            // @todo Only if series.isDirtyData is true
            tree = series.getTree();
        }

        // Ensure `tree` and `series.tree` are synchronized
        series.tree = tree = tree || series.tree;

        rootNode = series.nodeMap[rootId];

        if (rootId !== '' && !rootNode) {
            series.setRootNode('', false);
            rootId = series.rootNode;
            rootNode = series.nodeMap[rootId];
        }

        if (!rootNode.point?.isGroup) {
            series.mapOptionsToLevel = getLevelOptions<this>({
                from: rootNode.level + 1,
                levels: options.levels,
                to: tree.height,
                defaults: {
                    levelIsConstant: series.options.levelIsConstant,
                    colorByPoint: options.colorByPoint
                }
            });
        }

        // Parents of the root node is by default visible
        TreemapUtilities.recursive(series.nodeMap[series.rootNode], (
            node: TreemapNode
        ): (boolean|TreemapNode) => {
            const p = node.parent;

            let next: (boolean|TreemapNode) = false;

            node.visible = true;
            if (p || p === '') {
                next = series.nodeMap[p];
            }

            return next;
        });
        // Children of the root node is by default visible
        TreemapUtilities.recursive(series.nodeMap[series.rootNode].children, (
            children: Array<TreemapNode>
        ): (boolean|Array<TreemapNode>) => {
            let next: (boolean|Array<TreemapNode>) =
                    false;

            for (const child of children) {
                child.visible = true;
                if (child.children.length) {
                    next = ((next as any) || []).concat(child.children);
                }
            }
            return next;
        });
        series.setTreeValues(tree);

        // Calculate plotting values.
        series.axisRatio = (series.xAxis.len / series.yAxis.len);
        series.nodeMap[''].pointValues = pointValues = {
            x: 0,
            y: 0,
            width: axisMax,
            height: axisMax
        } as any;
        series.nodeMap[''].values = seriesArea = merge(pointValues, {
            width: (pointValues.width * series.axisRatio),
            direction: (
                options.layoutStartingDirection === 'vertical' ? 0 : 1
            ),
            val: tree.val
        });
        series.calculateChildrenAreas(tree, seriesArea);

        // Logic for point colors
        if (
            !series.colorAxis &&
            !options.colorByPoint
        ) {
            series.setColorRecursive(series.tree);
        }

        // Update axis extremes according to the root node.
        if (options.allowTraversingTree) {
            if (rootNode.pointValues) {
                val = rootNode.pointValues;
                series.xAxis.setExtremes(val.x, val.x + val.width, false);
                series.yAxis.setExtremes(val.y, val.y + val.height, false);
                series.xAxis.setScale();
                series.yAxis.setScale();
            }
        }

        // Assign values to points.
        series.setPointValues();

        if (applyGrouping) {
            series.applyTreeGrouping();
        }
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface TreemapSeries extends ColorMapComposition.SeriesComposition, TU.Series {
    colorAttribs: ColorMapComposition.SeriesComposition['colorAttribs'];
    colorKey: string;
    directTouch: boolean;
    getExtremesFromAll: boolean;
    optionalAxis: string;
    parallelArrays: Array<string>;
    pointArrayMap: Array<string>;
    pointClass: typeof TreemapPoint;
    NodeClass: typeof TreemapNode;
    trackerGroups: Array<string>;
    utils: {
        recursive: typeof TreemapUtilities.recursive;
    };
}
extend(TreemapSeries.prototype, {
    buildKDTree: noop,
    colorAttribs: ColorMapComposition.seriesMembers.colorAttribs,
    colorKey: 'colorValue', // Point color option key
    directTouch: true,
    getExtremesFromAll: true,
    getSymbol: noop,
    optionalAxis: 'colorAxis',
    parallelArrays: ['x', 'y', 'value', 'colorValue'],
    pointArrayMap: ['value', 'colorValue'],
    pointClass: TreemapPoint,
    NodeClass: TreemapNode,
    trackerGroups: ['group', 'dataLabelsGroup'],
    utils: TreemapUtilities
});
ColorMapComposition.compose(TreemapSeries);

/* *
 *
 *  Class Namespace
 *
 * */

namespace TreemapSeries {
    export interface AreaObject {
        direction: number;
    }
    export type ListOfParentsObject = Record<string, Array<number>>;
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
        treemap: typeof TreemapSeries;
    }
}
SeriesRegistry.registerSeriesType('treemap', TreemapSeries);

/* *
 *
 *  Default Export
 *
 * */

export default TreemapSeries;
