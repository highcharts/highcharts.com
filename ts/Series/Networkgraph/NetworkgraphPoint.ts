/* *
 *
 *  Networkgraph series
 *
 *  (c) 2010-2021 Paweł Fus
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

import type { DragNodesPoint } from '../DragNodesComposition';
import type NetworkgraphPointOptions from './NetworkgraphPointOptions';
import type NetworkgraphSeries from './NetworkgraphSeries';
import type { PointShortOptions } from '../../Core/Series/PointOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import NodesComposition from '../NodesComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: seriesProto,
        prototype: {
            pointClass: Point
        }
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { defined, extend } = OH;
const { addEvent } = EH;
const {
    css,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class NetworkgraphPoint extends Point implements DragNodesPoint {

    /* *
     *
     *  Properties
     *
     * */

    public dispX?: number;

    public dispY?: number;

    public fixedPosition: DragNodesPoint['fixedPosition'];

    public prevX?: number;

    public prevY?: number;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Destroy point. If it's a node, remove all links coming out of this
     * node. Then remove point from the layout.
     * @private
     */
    public destroy(): void {
        if (this.isNode) {
            this.linksFrom.concat(this.linksTo).forEach(
                function (link: NetworkgraphPoint): void {
                    // Removing multiple nodes at the same time
                    // will try to remove link between nodes twice
                    if (link.destroyElements) {
                        link.destroyElements();
                    }
                }
            );
        }

        this.series.layout.removeElementFromCollection(
            this,
            (this.series.layout as any)[this.isNode ? 'nodes' : 'links']
        );

        return Point.prototype.destroy.apply(this, arguments as any);
    }

    /**
     * Return degree of a node. If node has no connections, it still has
     * deg=1.
     * @private
     */
    public getDegree(): number {
        const deg = this.isNode ?
            this.linksFrom.length + this.linksTo.length :
            0;

        return deg === 0 ? 1 : deg;
    }

    /**
     * Get presentational attributes of link connecting two nodes.
     * @private
     */
    public getLinkAttributes(): SVGAttributes {
        const linkOptions = this.series.options.link,
            pointOptions = this.options;

        return {
            'stroke-width': pick(
                pointOptions.width,
                (linkOptions as any).width
            ),
            stroke: (
                pointOptions.color || (linkOptions as any).color
            ),
            dashstyle: (
                pointOptions.dashStyle || (linkOptions as any).dashStyle
            ),
            opacity: pick(
                pointOptions.opacity,
                (linkOptions as any).opacity,
                1
            )
        };
    }

    /**
     * Get link path connecting two nodes.
     * @private
     * @return {Array<Highcharts.SVGPathArray>}
     *         Path: `['M', x, y, 'L', x, y]`
     */
    public getLinkPath(): SVGPath {
        let left = this.fromNode,
            right = this.toNode;

        // Start always from left to the right node, to prevent rendering
        // labels upside down
        if ((left.plotX as any) > (right.plotX as any)) {
            left = this.toNode;
            right = this.fromNode;
        }

        return [
            ['M', left.plotX || 0, left.plotY || 0],
            ['L', right.plotX || 0, right.plotY || 0]
        ];
        /*
        IDEA: different link shapes?
        return [
            'M',
            from.plotX,
            from.plotY,
            'Q',
            (to.plotX + from.plotX) / 2,
            (to.plotY + from.plotY) / 2 + 15,
            to.plotX,
            to.plotY
        ];*/
    }

    /**
     * Get mass fraction applied on two nodes connected to each other. By
     * default, when mass is equal to `1`, mass fraction for both nodes
     * equal to 0.5.
     * @private
     * @return {Highcharts.Dictionary<number>}
     *         For example `{ fromNode: 0.5, toNode: 0.5 }`
     */
    public getMass(): Record<string, number> {
        const m1 = this.fromNode.mass,
            m2 = this.toNode.mass,
            sum = m1 + m2;

        return {
            fromNode: 1 - m1 / sum,
            toNode: 1 - m2 / sum
        };
    }

    /**
     * Basic `point.init()` and additional styles applied when
     * `series.draggable` is enabled.
     * @private
     */
    public init(
        series: NetworkgraphSeries,
        options: (NetworkgraphPointOptions|PointShortOptions),
        x?: number
    ): NetworkgraphPoint {
        super.init(series, options, x);

        if (
            this.series.options.draggable &&
            !this.series.chart.styledMode
        ) {
            addEvent(this, 'mouseOver', function (): void {
                css(this.series.chart.container, { cursor: 'move' });
            });
            addEvent(this, 'mouseOut', function (): void {
                css(
                    this.series.chart.container, { cursor: 'default' }
                );
            });
        }

        return this;
    }

    /**
     * @private
     */
    public isValid(): boolean {
        return !this.isNode || defined(this.id);
    }

    /**
     * Redraw link's path.
     * @private
     */
    public redrawLink(): void {
        let path = this.getLinkPath(),
            attribs: SVGAttributes;

        if (this.graphic) {
            this.shapeArgs = {
                d: path
            };

            if (!this.series.chart.styledMode) {
                attribs = this.series.pointAttribs(this);
                this.graphic.attr(attribs);

                (this.dataLabels || []).forEach(function (
                    label
                ): void {
                    if (label) {
                        label.attr({
                            opacity: attribs.opacity
                        });
                    }
                });
            }
            this.graphic.animate(this.shapeArgs);

            // Required for dataLabels
            const start = path[0];
            const end = path[1];
            if (start[0] === 'M' && end[0] === 'L') {
                this.plotX = (start[1] + end[1]) / 2;
                this.plotY = (start[2] + end[2]) / 2;
            }
        }
    }

    /**
     * Common method for removing points and nodes in networkgraph. To
     * remove `link`, use `series.data[index].remove()`. To remove `node`
     * with all connections, use `series.nodes[index].remove()`.
     * @private
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart or wait for an explicit call. When
     *        doing more operations on the chart, for example running
     *        `point.remove()` in a loop, it is best practice to set
     *        `redraw` to false and call `chart.redraw()` after.
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation=false]
     *        Whether to apply animation, and optionally animation
     *        configuration.
     */
    public remove(
        redraw?: boolean,
        animation?: boolean
    ): void {
        let point = this,
            series = point.series,
            nodesOptions = series.options.nodes || [],
            index: number,
            i = nodesOptions.length;

        // For nodes, remove all connected links:
        if (point.isNode) {
            // Temporary disable series.points array, because
            // Series.removePoint() modifies it
            series.points = [];

            // Remove link from all nodes collections:
            ([] as Array<NetworkgraphPoint>)
                .concat(point.linksFrom)
                .concat(point.linksTo)
                .forEach(
                    function (
                        linkFromTo: NetworkgraphPoint
                    ): void {
                        // Incoming links
                        index = linkFromTo.fromNode.linksFrom.indexOf(
                            linkFromTo
                        );
                        if (index > -1) {
                            linkFromTo.fromNode.linksFrom.splice(
                                index,
                                1
                            );
                        }

                        // Outcoming links
                        index = linkFromTo.toNode.linksTo.indexOf(
                            linkFromTo
                        );
                        if (index > -1) {
                            linkFromTo.toNode.linksTo.splice(
                                index,
                                1
                            );
                        }

                        // Remove link from data/points collections
                        seriesProto.removePoint.call(
                            series,
                            series.data.indexOf(linkFromTo),
                            false,
                            false
                        );
                    }
                );

            // Restore points array, after links are removed
            series.points = series.data.slice();

            // Proceed with removing node. It's similar to
            // Series.removePoint() method, but doesn't modify other arrays
            series.nodes.splice(series.nodes.indexOf(point), 1);

            // Remove node options from config
            while (i--) {
                if (nodesOptions[i].id === point.options.id) {
                    (series.options.nodes as any).splice(i, 1);
                    break;
                }
            }

            if (point) {
                point.destroy();
            }

            // Run redraw if requested
            series.isDirty = true;
            series.isDirtyData = true;
            if (redraw) {
                series.chart.redraw(redraw);
            }
        } else {
            series.removePoint(
                series.data.indexOf(point),
                redraw,
                animation
            );
        }
    }

    /**
     * Render link and add it to the DOM.
     * @private
     */
    public renderLink(): void {
        let attribs: SVGAttributes;

        if (!this.graphic) {
            this.graphic = this.series.chart.renderer
                .path(
                    this.getLinkPath()
                )
                .addClass(this.getClassName(), true)
                .add(this.series.group);

            if (!this.series.chart.styledMode) {
                attribs = this.series.pointAttribs(this);
                this.graphic.attr(attribs);

                (this.dataLabels || []).forEach(function (
                    label
                ): void {
                    if (label) {
                        label.attr({
                            opacity: attribs.opacity
                        });
                    }
                });
            }
        }
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface NetworkgraphPoint extends NodesComposition.PointComposition {
    className: NodesComposition.PointComposition['className'];
    degree: number;
    formatPrefix: NodesComposition.PointComposition['formatPrefix'];
    from: NodesComposition.PointComposition['from'];
    fromNode: NetworkgraphPoint;
    isNode: NodesComposition.PointComposition['isNode'];
    linksFrom: Array<NetworkgraphPoint>;
    linksTo: Array<NetworkgraphPoint>;
    mass: NodesComposition.PointComposition['mass'];
    options: NetworkgraphPointOptions;
    radius: number;
    series: NetworkgraphSeries;
    to: NodesComposition.PointComposition['to'];
    toNode: NetworkgraphPoint;
    getPointsCollection(): Array<NetworkgraphPoint>;
    getSum: NodesComposition.PointComposition['getSum'];
    hasShape: NodesComposition.PointComposition['hasShape'];
    offset: NodesComposition.PointComposition['offset'];
    setNodeState: NodesComposition.PointComposition['setState'];
}
extend(NetworkgraphPoint.prototype, {
    setState: NodesComposition.setNodeState
});

/* *
 *
 *  Default Export
 *
 * */

export default NetworkgraphPoint;
