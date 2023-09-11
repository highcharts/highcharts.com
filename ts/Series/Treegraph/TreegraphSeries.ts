/* *
 *
 *  (c) 2010-2022 Pawel Lysy Grzegorz Blachlinski
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

import type TreegraphSeriesOptions from './TreegraphSeriesOptions.js';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';

import PU from '../PathUtilities.js';
const { getLinkPath } = PU;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';

const {
    series: {
        prototype: seriesProto
    },
    seriesTypes: {
        treemap: TreemapSeries,
        column: ColumnSeries
    }
} = SeriesRegistry;
import SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer.js';
const { prototype: { symbols } } = SVGRenderer;
import TreegraphNode from './TreegraphNode.js';
import TreegraphPoint from './TreegraphPoint.js';
import TU from '../TreeUtilities.js';
const { getLevelOptions } = TU;
import U from '../../Shared/Utilities.js';
const {
    pick,
    relativeLength
} = U;

import TreegraphLink from './TreegraphLink.js';
import TreegraphLayout from './TreegraphLayout.js';
import { TreegraphSeriesLevelOptions } from './TreegraphSeriesOptions.js';
import TreegraphSeriesDefaults from './TreegraphSeriesDefaults.js';
import SVGLabel from '../../Core/Renderer/SVG/SVGLabel.js';
import TreemapPoint from '../Treemap/TreemapPoint.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    splat
} = AH;
const { extend, merge } = OH;

/* *
 *
 *  Declatarions
 *
 * */

interface LayoutModifiers {
    ax: number;
    bx: number;
    ay: number;
    by: number;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Treegraph series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.treegraph
 *
 * @augments Highcharts.Series
 */
class TreegraphSeries extends TreemapSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: TreegraphSeriesOptions = merge(
        TreemapSeries.defaultOptions,
        TreegraphSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<TreegraphPoint> = void 0 as any;

    public options: TreegraphSeriesOptions = void 0 as any;

    public points: Array<TreegraphPoint> = void 0 as any;

    public layoutModifier: LayoutModifiers = void 0 as any;

    public nodeMap: Record<string, TreegraphNode> = void 0 as any;

    public tree: TreegraphNode = void 0 as any;

    public nodeList: Array<TreegraphNode> = [];

    public layoutAlgorythm: TreegraphLayout = void 0 as any;

    public links: Array<TreegraphLink> = [];

    public mapOptionsToLevel: Record<string, TreegraphSeriesLevelOptions> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        super.init.apply(this, arguments);
        this.layoutAlgorythm = new TreegraphLayout();
    }

    /**
     * Calculate `a` and `b` parameters of linear transformation, where
     * `finalPosition = a * calculatedPosition + b`.
     *
     * @return {LayoutModifiers} `a` and `b` parameter for x and y direction.
     */
    private getLayoutModifiers(): LayoutModifiers {
        const chart = this.chart,
            series = this,
            plotSizeX = chart.plotSizeX as number,
            plotSizeY = chart.plotSizeY as number;
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity,
            maxXSize = 0,
            minXSize = 0,
            maxYSize = 0,
            minYSize = 0;
        this.points.forEach((point: TreegraphPoint): void => {
            // When fillSpace is on, stop the layout calculation when the hidden
            // points are reached. (#19038)
            if (this.options.fillSpace && !point.visible) {
                return;
            }

            const node = point.node,
                level = series.mapOptionsToLevel[point.node.level] || {},
                markerOptions = merge(
                    this.options.marker,
                    level.marker,
                    point.options.marker
                ),
                radius = relativeLength(
                    markerOptions.radius || 0,
                    Math.min(plotSizeX, plotSizeY)
                ),
                symbol = markerOptions.symbol,
                nodeSizeY = (symbol === 'circle' || !markerOptions.height) ?
                    radius * 2 :
                    relativeLength(markerOptions.height, plotSizeY),
                nodeSizeX = symbol === 'circle' || !markerOptions.width ?
                    radius * 2 :
                    relativeLength(markerOptions.width, plotSizeX);
            node.nodeSizeX = nodeSizeX;
            node.nodeSizeY = nodeSizeY;

            let lineWidth;
            if (node.xPosition <= minX) {
                minX = node.xPosition;
                lineWidth = markerOptions.lineWidth || 0;
                minXSize = Math.max(nodeSizeX + lineWidth, minXSize);
            }
            if (node.xPosition >= maxX) {
                maxX = node.xPosition;
                lineWidth = markerOptions.lineWidth || 0;
                maxXSize = Math.max(nodeSizeX + lineWidth, maxXSize);
            }
            if (node.yPosition <= minY) {
                minY = node.yPosition;
                lineWidth = markerOptions.lineWidth || 0;
                minYSize = Math.max(nodeSizeY + lineWidth, minYSize);
            }
            if (node.yPosition >= maxY) {
                maxY = node.yPosition;
                lineWidth = markerOptions.lineWidth || 0;
                maxYSize = Math.max(nodeSizeY + lineWidth, maxYSize);
            }
        });

        // Calculate the values of linear transformation, which will later be
        // applied as `nodePosition = a * x + b` for each direction.
        const ay = maxY === minY ?
                1 :
                (plotSizeY - (minYSize + maxYSize) / 2) / (maxY - minY),
            by = maxY === minY ? plotSizeY / 2 : -ay * minY + minYSize / 2,
            ax = maxX === minX ?
                1 :
                (plotSizeX - (maxXSize + maxXSize) / 2) / (maxX - minX),
            bx = maxX === minX ? plotSizeX / 2 : -ax * minX + minXSize / 2;

        return { ax, bx, ay, by };
    }

    private getLinks(): TreegraphLink[] {
        const series = this;
        const links = [] as TreegraphLink[];
        this.data.forEach((point, index): void => {
            const levelOptions =
                (series.mapOptionsToLevel as any)[point.node.level || 0] || {};
            if (point.node.parent) {
                const pointOptions = merge(levelOptions, point.options);
                if (!point.linkToParent || point.linkToParent.destroyed) {
                    const link = new series.LinkClass().init(
                        series,
                        pointOptions,
                        void 0,
                        point
                    );
                    point.linkToParent = link;
                } else {
                    point.linkToParent.update(
                        { collapsed: pointOptions.collapsed },
                        false
                    );
                }
                point.linkToParent.index = links.push(point.linkToParent) - 1;
            } else {
                if (point.linkToParent) {
                    series.links.splice(point.linkToParent.index);
                    point.linkToParent.destroy();
                    delete point.linkToParent;
                }
            }
        });
        return links;
    }

    public buildTree(
        id: string,
        index: number,
        level: number,
        list: Record<string, number[]>,
        parent?: string
    ): this['tree'] {
        const point = this.points[index];
        level = (point && point.level) || level;
        return super.buildTree.call(this, id, index, level, list, parent);
    }

    public markerAttribs(): SVGAttributes {
        // The super Series.markerAttribs returns { width: NaN, height: NaN },
        // so just disable this for now.
        return {};
    }

    public setCollapsedStatus(
        node: TreegraphNode,
        visibility: boolean
    ): void {
        const point = node.point;
        if (point) {
            // Take the level options into account.
            point.collapsed = pick(
                point.collapsed,
                (this.mapOptionsToLevel[node.level] || {}).collapsed
            );
            point.visible = visibility;
            visibility = visibility === false ? false : !point.collapsed;
        }
        node.children.forEach((childNode): void => {
            this.setCollapsedStatus(childNode, visibility);
        });
    }

    public drawTracker(): void {
        ColumnSeries.prototype.drawTracker.apply(this, arguments);
        ColumnSeries.prototype.drawTracker.call(this, this.links);
    }

    /**
     * Run pre-translation by generating the nodeColumns.
     * @private
     */
    public translate(): void {
        const series = this,
            options = series.options;

        // NOTE: updateRootId modifies series.
        let rootId = TU.updateRootId(series),
            rootNode;

        // Call prototype function
        seriesProto.translate.call(series);

        const tree = series.tree = series.getTree();
        rootNode = series.nodeMap[rootId];

        if (rootId !== '' && (!rootNode || !rootNode.children.length)) {
            series.setRootNode('', false);
            rootId = series.rootNode;
            rootNode = series.nodeMap[rootId];
        }

        series.mapOptionsToLevel = getLevelOptions<this>({
            from: rootNode.level + 1,
            levels: options.levels,
            to: tree.height,
            defaults: {
                levelIsConstant: series.options.levelIsConstant,
                colorByPoint: options.colorByPoint
            }
        });

        this.setCollapsedStatus(tree, true);

        series.links = series.getLinks();
        series.setTreeValues(tree);

        this.layoutAlgorythm.calculatePositions(series);
        series.layoutModifier = this.getLayoutModifiers();

        this.points.forEach((point): void => {
            this.translateNode(point);
        });

        this.points.forEach((point): void => {
            if (point.linkToParent) {
                this.translateLink(point.linkToParent);
            }
        });

        if (!options.colorByPoint) {
            series.setColorRecursive(series.tree);
        }
    }

    public translateLink(link: TreegraphLink): void {
        const fromNode = link.fromNode,
            toNode = link.toNode,
            linkWidth = this.options.link.lineWidth,
            crisp = (Math.round(linkWidth) % 2) / 2,
            factor = pick(this.options.link.curveFactor, 0.5),
            type = pick(
                link.options.link && link.options.link.type,
                this.options.link.type
            );

        if (fromNode.shapeArgs && toNode.shapeArgs) {

            const fromNodeWidth = (fromNode.shapeArgs.width || 0),
                inverted = this.chart.inverted,

                y1 = Math.floor(
                    (fromNode.shapeArgs.y || 0) +
                    (fromNode.shapeArgs.height || 0) / 2) + crisp,

                y2 = Math.floor(
                    (toNode.shapeArgs.y || 0) +
                    (toNode.shapeArgs.height || 0) / 2
                ) + crisp;

            let x1 = Math.floor((fromNode.shapeArgs.x || 0) + fromNodeWidth) +
                crisp,
                x2 = Math.floor(toNode.shapeArgs.x || 0) + crisp;

            if (inverted) {
                x1 -= fromNodeWidth;
                x2 += (toNode.shapeArgs.width || 0);
            }
            const diff = toNode.node.xPosition - fromNode.node.xPosition;
            link.shapeType = 'path';
            const fullWidth = Math.abs(x2 - x1) + fromNodeWidth,
                width = (fullWidth / diff) - fromNodeWidth,
                offset = width * factor * (inverted ? -1 : 1);
            const xMiddle = Math.floor((x2 + x1) / 2) + crisp;
            link.plotX = xMiddle;
            link.plotY = y2;

            link.shapeArgs = {
                d: getLinkPath[type]({
                    x1,
                    y1,
                    x2,
                    y2,
                    width,
                    offset,
                    inverted,
                    parentVisible: toNode.visible,
                    radius: this.options.link.radius
                })
            };

            link.dlBox = {
                x: (x1 + x2) / 2,
                y: (y1 + y2) / 2,
                height: linkWidth,
                width: 0
            };
            link.tooltipPos = inverted ? [
                (this.chart.plotSizeY || 0) - link.dlBox.y,
                (this.chart.plotSizeX || 0) - link.dlBox.x
            ] : [
                link.dlBox.x,
                link.dlBox.y
            ];

        }
    }

    /**
     * Private method responsible for adjusting the dataLabel options for each
     * node-point individually.
     */
    public drawNodeLabels(points: Array<TreegraphPoint>): void {
        const series = this,
            mapOptionsToLevel = series.mapOptionsToLevel;

        let options,
            level;

        for (const point of points) {
            level = mapOptionsToLevel[point.node.level];
            // Set options to new object to avoid problems with scope
            options = { style: {} };

            // If options for level exists, include them as well
            if (level && level.dataLabels) {
                options = merge(options, level.dataLabels);
                series.hasDataLabels = (): boolean => true;
            }

            // Set dataLabel width to the width of the point shape.
            if (
                point.shapeArgs &&
                !splat(series.options.dataLabels)[0].style.width
            ) {
                (options.style as any).width = point.shapeArgs.width;
                if (point.dataLabel) {
                    point.dataLabel.css({
                        width: point.shapeArgs.width + 'px'
                    });
                }
            }

            // Merge custom options with point options
            (point as any).dlOptions = merge(options, point.options.dataLabels);

        }

        seriesProto.drawDataLabels.call(this, points);
    }

    /**
     * Override alignDataLabel so that position is always calculated and the
     * label is faded in and out instead of hidden/shown when collapsing and
     * expanding nodes.
     */
    public alignDataLabel(
        point: TreemapPoint,
        dataLabel: SVGLabel
    ): void {
        const visible = point.visible;

        // Force position calculation and visibility
        point.visible = true;

        super.alignDataLabel.apply(this, arguments);

        // Fade in or out
        dataLabel.animate({
            opacity: visible === false ? 0 : 1
        }, void 0, function (): void {
            // Hide data labels that belong to hidden points (#18891)
            visible || dataLabel.hide();
        });

        // Reset
        point.visible = visible;
    }

    /**
     * Treegraph has two separate collecions of nodes and lines,
     * render dataLabels for both sets.
     */
    public drawDataLabels(): void {
        if (this.options.dataLabels) {

            this.options.dataLabels = splat(this.options.dataLabels);

            // Render node labels.
            this.drawNodeLabels(this.points);

            // Render link labels.
            seriesProto.drawDataLabels.call(this, this.links);
        }
    }

    public destroy(): void {
        // Links must also be destroyed.
        if (this.links) {
            for (const link of this.links) {
                link.destroy();
            }
            this.links.length = 0;
        }

        return seriesProto.destroy.apply(this, arguments);
    }

    /**
     * Return the presentational attributes.
     * @private
     */
    public pointAttribs(
        point: TreegraphPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const series = this,
            levelOptions =
                (series.mapOptionsToLevel as any)[point.node.level || 0] || {},
            options = point.options,
            stateOptions =
                (levelOptions.states &&
                    (levelOptions.states as any)[state as any]) ||
                {};
        point.options.marker = merge(
            series.options.marker,
            levelOptions.marker,
            point.options.marker
        );
        const linkColor = pick(
                stateOptions.link && stateOptions.link.color,
                options.link && options.link.color,
                levelOptions.link && levelOptions.link.color,
                series.options.link && series.options.link.color
            ),
            linkLineWidth = pick(
                stateOptions.link && stateOptions.link.lineWidth,
                options.link && options.link.lineWidth,
                levelOptions.link && levelOptions.link.lineWidth,
                series.options.link && series.options.link.lineWidth
            ),
            attribs = seriesProto.pointAttribs.call(series, point, state);

        if (point.isLink) {
            attribs.stroke = linkColor;
            attribs['stroke-width'] = linkLineWidth;
            delete attribs.fill;
        }
        if (!point.visible) {
            attribs.opacity = 0;
        }
        return attribs;
    }

    public drawPoints(): void {
        TreemapSeries.prototype.drawPoints.apply(this, arguments);
        ColumnSeries.prototype.drawPoints.call(this, this.links);

    }
    /**
     * Run translation operations for one node.
     * @private
     */
    public translateNode(point: TreegraphPoint): void {
        const chart = this.chart,
            node = point.node,
            plotSizeY = chart.plotSizeY as number,
            plotSizeX = chart.plotSizeX as number,
            // Get the layout modifiers which are common for all nodes.
            { ax, bx, ay, by } = this.layoutModifier,
            x = ax * node.xPosition + bx,
            y = ay * node.yPosition + by,
            level = this.mapOptionsToLevel[node.level] || {},
            markerOptions = merge(
                this.options.marker,
                level.marker,
                point.options.marker
            ),
            symbol = markerOptions.symbol,
            height = node.nodeSizeY,
            width = node.nodeSizeX,
            reversed = this.options.reversed,
            nodeX = node.x = (chart.inverted ?
                plotSizeX - width / 2 - x :
                x - width / 2),
            nodeY = node.y = (!reversed ?
                plotSizeY - y - height / 2 :
                y - height / 2),
            borderRadius = pick(
                point.options.borderRadius,
                level.borderRadius,
                this.options.borderRadius
            ),
            symbolFn = symbols[symbol || 'circle'];

        if (symbolFn === void 0) {
            point.hasImage = true;
            point.shapeType = 'image';
            point.imageUrl = (
                (symbol as string).match(/^url\((.*?)\)$/) as any
            )[1];
        } else {
            point.shapeType = 'path';
        }

        if (!point.visible && point.linkToParent) {
            const parentNode = point.linkToParent.fromNode;
            if (parentNode) {
                const parentShapeArgs = parentNode.shapeArgs || {},
                    { x = 0, y = 0, width = 0, height = 0 } = parentShapeArgs;
                if (!point.shapeArgs) {
                    point.shapeArgs = {};
                }
                if (!point.hasImage) {
                    extend(point.shapeArgs, {
                        d: symbolFn(
                            x,
                            y,
                            width,
                            height,
                            borderRadius ? { r: borderRadius } : void 0
                        )
                    });
                }
                extend(point.shapeArgs, { x, y });
                point.plotX = parentNode.plotX;
                point.plotY = parentNode.plotY;
            }
        } else {
            point.plotX = nodeX;
            point.plotY = nodeY;
            point.shapeArgs = {
                x: nodeX,
                y: nodeY,
                width,
                height,
                cursor: !point.node.isLeaf ? 'pointer' : 'default'
            };
            if (!point.hasImage) {
                point.shapeArgs.d = symbolFn(
                    nodeX,
                    nodeY,
                    width,
                    height,
                    borderRadius ? { r: borderRadius } : void 0
                );
            }
        }

        // Set the anchor position for tooltip.
        point.tooltipPos = chart.inverted ?
            [plotSizeY - nodeY - height / 2, plotSizeX - nodeX - width / 2] :
            [nodeX + width / 2, nodeY];
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface TreegraphSeries {
    inverted?: boolean;
    pointClass: typeof TreegraphPoint;
    NodeClass: typeof TreegraphNode;
    LinkClass: typeof TreegraphLink;
}

extend(TreegraphSeries.prototype, {
    pointClass: TreegraphPoint,
    NodeClass: TreegraphNode,
    LinkClass: TreegraphLink
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        treegraph: typeof TreegraphSeries;
    }
}
SeriesRegistry.registerSeriesType('treegraph', TreegraphSeries);

/* *
 *
 *  Default Export
 *
 * */

export default TreegraphSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `treegraph` series. If the [type](#series.treegraph.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.treegraph
 * @exclude   allowDrillToNode, boostBlending, boostThreshold, curveFactor,
 * centerInCategory, connectEnds, connectNulls, colorAxis, colorKey,
 * dataSorting, dragDrop, findNearestPointBy, getExtremesFromAll, layout,
 * nodePadding,  pointInterval, pointIntervalUnit, pointPlacement, pointStart,
 * relativeXValue, softThreshold, stack, stacking, step,
 * traverseUpButton, xAxis, yAxis, zoneAxis, zones
 * @product   highcharts
 * @requires  modules/treemap.js
 * @requires  modules/treegraph.js
 * @apioption series.treegraph
 */

/**
 * @extends   plotOptions.series.marker
 * @excluding enabled, enabledThreshold
 * @apioption series.treegraph.marker
 */

/**
 * @type      {Highcharts.SeriesTreegraphDataLabelsOptionsObject|Array<Highcharts.SeriesTreegraphDataLabelsOptionsObject>}
 * @product   highcharts
 * @apioption series.treegraph.data.dataLabels
 */

/**
 * @sample highcharts/series-treegraph/level-options
 *          Treegraph chart with level options applied
 *
 * @type      {Array<*>}
 * @excluding layoutStartingDirection, layoutAlgorithm
 * @apioption series.treegraph.levels
 */

/**
 * Set collapsed status for nodes level-wise.
 * @type {boolean}
 * @apioption series.treegraph.levels.collapsed
 */

/**
 * Set marker options for nodes at the level.
 * @extends   series.treegraph.marker
 * @apioption series.treegraph.levels.marker
 */

/**
 * An array of data points for the series. For the `treegraph` series type,
 * points can be given in the following ways:
 *
 * 1. The array of arrays, with `keys` property, which defines how the fields in
 *     array should be interpretated
 *    ```js
 *       keys: ['id', 'parent'],
 *       data: [
 *           ['Category1'],
 *           ['Category1', 'Category2']
 *       ]
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the
 *    series' [turboThreshold](#series.area.turboThreshold),
 *    this option is not available.
 *    The data of the treegraph series needs to be formatted in such a way, that
 *    there are no circular dependencies on the nodes
 *
 *  ```js
 *     data: [{
 *         id: 'Category1'
 *     }, {
 *         id: 'Category1',
 *         parent: 'Category2',
 *     }]
 *  ```
 *
 * @type      {Array<*>}
 * @extends   series.treemap.data
 * @product   highcharts
 * @excluding outgoing, weight, value
 * @apioption series.treegraph.data
 */

/**
 * Options used for button, which toggles the collapse status of the node.
 *
 *
 * @apioption series.treegraph.data.collapseButton
 */

/**
 * If point's children should be initially hidden
 *
 * @sample highcharts/series-treegraph/level-options
 *          Treegraph chart with initially hidden children
 *
 * @type {boolean}
 * @apioption series.treegraph.data.collapsed
 */

''; // gets doclets above into transpiled version
