/* *
 *
 *  (c) 2010-2024 Grzegorz Blachlinski, Sebastian Bochan
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

import type Chart from '../../Core/Chart/Chart';
import type PackedBubblePoint from './PackedBubblePoint';
import type PackedBubbleSeries from './PackedBubbleSeries';
import type Point from '../../Core/Series/Point';
import type { PointMarkerOptions } from '../../Core/Series/PointOptions';
import type Series from '../../Core/Series/Series';

import GraphLayout from '../GraphLayoutComposition.js';
import PackedBubbleIntegration from './PackedBubbleIntegration.js';
import ReingoldFruchtermanLayout from '../Networkgraph/ReingoldFruchtermanLayout.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    defined,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike' {
    interface ChartLike {
        allDataPoints?: Array<PackedBubbleSeries.Data>;
        allParentNodes: Array<PackedBubblePoint>;
        getSelectedParentNodes(): Array<PackedBubblePoint>;
    }
}

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function chartGetSelectedParentNodes(
    this: Chart
): Array<PackedBubblePoint> {
    const allSeries = this.series as Array<PackedBubbleSeries>,
        selectedParentsNodes: Array<PackedBubblePoint> = [];

    allSeries.forEach((series): void => {
        if (series.parentNode && series.parentNode.selected) {
            selectedParentsNodes.push(series.parentNode);
        }
    });

    return selectedParentsNodes;
}

/**
 * Remove accumulated data points to redistribute all of them again
 * (i.e after hiding series by legend)
 * @private
 */
function onChartBeforeRedraw(
    this: Chart
): void {
    if (this.allDataPoints) {
        delete (this as Partial<typeof this>).allDataPoints;
    }
}

/* *
 *
 *  Class
 *
 * */

class PackedBubbleLayout extends ReingoldFruchtermanLayout {

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        ChartClass: typeof Chart
    ): void {
        ReingoldFruchtermanLayout.compose(ChartClass);
        GraphLayout.integrations.packedbubble = PackedBubbleIntegration;
        GraphLayout.layouts.packedbubble = PackedBubbleLayout;

        const chartProto = ChartClass.prototype;

        if (!chartProto.getSelectedParentNodes) {
            addEvent(ChartClass, 'beforeRedraw', onChartBeforeRedraw);

            chartProto.getSelectedParentNodes = chartGetSelectedParentNodes;
        }

        if (!chartProto.allParentNodes) {
            chartProto.allParentNodes = [];
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public enableSimulation?: boolean;
    public index: number = NaN;
    public nodes: Array<Point> = [];
    public options!: PackedBubbleLayout.Options;
    public series: Array<Series> = [];

    /* *
     *
     *  Functions
     *
     * */

    public beforeStep(): void {
        if (this.options.marker) {
            this.series.forEach((series): void => {
                if (series) {
                    (series as any).calculateParentRadius();
                }
            });
        }
    }

    // #14439, new stable check.
    public isStable(): boolean {
        const tempDiff = Math.abs(
            (this.prevSystemTemperature as any) -
            (this.systemTemperature as any)
        );

        const upScaledTemperature = 10 * (this.systemTemperature as any) /
            Math.sqrt(this.nodes.length);

        return Math.abs(upScaledTemperature) < 1 &&
            tempDiff < 0.00001 ||
            (this.temperature as any) <= 0;
    }

    public setCircularPositions(): void {
        const layout = this,
            box = layout.box,
            nodes = layout.nodes as Array<PackedBubblePoint>,
            nodesLength = nodes.length + 1,
            angle = 2 * Math.PI / nodesLength,
            radius = layout.options.initialPositionRadius;

        let centerX: number,
            centerY: number,
            index = 0;

        for (const node of nodes) {
            if (
                this.resolveSplitSeries(node) &&
                !node.isParentNode
            ) {
                centerX = (node.series.parentNode as any).plotX;
                centerY = (node.series.parentNode as any).plotY;
            } else {
                centerX = box.width / 2;
                centerY = box.height / 2;
            }

            node.plotX = node.prevX = pick(
                node.plotX,
                (centerX as any) +
                (radius as any) * Math.cos(node.index || index * angle)
            );

            node.plotY = node.prevY = pick(
                node.plotY,
                (centerY as any) +
                (radius as any) * Math.sin(node.index || index * angle)
            );

            node.dispX = 0;
            node.dispY = 0;
            index++;
        }
    }

    public repulsiveForces(): void {
        const layout = this,
            layoutOptions = layout.options,
            bubblePadding = layoutOptions.bubblePadding || 0,
            seriesInteraction = layoutOptions.seriesInteraction,
            nodes = [
                ...layout.nodes as Array<PackedBubblePoint>,
                ...layout?.chart?.allParentNodes || []
            ],
            k = layout.k;

        for (const node of nodes) {
            const nodeSeries = node.series,
                fixedPosition = node.fixedPosition,
                paddedNodeRadius = (
                    (node.marker?.radius || 0) +
                    bubblePadding
                );

            node.degree = node.mass;
            node.neighbours = 0;

            for (const repNode of nodes) {
                if (
                    // Node cannot repulse itself:
                    node !== repNode &&
                    // Only close nodes affect each other:

                    // Not dragged:
                    !fixedPosition &&
                    (
                        seriesInteraction || nodeSeries === repNode.series
                    ) &&

                    // Avoiding collision of parentNodes and parented points
                    !(
                        nodeSeries === repNode.series &&
                        // HasSplitSeries &&
                        repNode.isParentNode
                    )
                ) {
                    const distanceXY = layout.getDistXY(node, repNode),
                        distanceR = (
                            layout.vectorLength(distanceXY) -
                            (
                                paddedNodeRadius + (repNode.marker?.radius || 0)
                            )
                        );

                    let forceTimesMass: number | undefined;

                    // TODO padding configurable
                    if (distanceR < 0) {
                        (node.degree as any) += 0.01;
                        forceTimesMass = (
                            layout.repulsiveForce(
                                -distanceR / Math.sqrt(++(node.neighbours)),
                                k,
                                node,
                                repNode
                            ) *
                            repNode.mass
                        );
                    }

                    layout.force(
                        'repulsive',
                        node,
                        forceTimesMass || 0,
                        distanceXY,
                        repNode,
                        distanceR
                    );
                }
            }
        }
    }

    public resolveSplitSeries(
        node: PackedBubblePoint
    ): boolean {
        const specificSeriesOpt = node
            .series
            ?.options
            ?.layoutAlgorithm
            ?.splitSeries;

        return (
            !defined(specificSeriesOpt) &&
            node.series.chart
                ?.options
                ?.plotOptions
                ?.packedbubble
                ?.layoutAlgorithm
                ?.splitSeries
        ) ||
        specificSeriesOpt ||
        false;
    }

    public applyLimitBox(
        node: PackedBubblePoint,
        box: Record<string, number>
    ): void {
        const layout = this,
            factor = 0.01;

        let distanceXY: Record<string, number>,
            distanceR: number;

        // `parentNodeLimit` should be used together with seriesInteraction:
        // false
        if (
            this.resolveSplitSeries(node) &&
            !node.isParentNode &&
            layout.options.parentNodeLimit
        ) {
            distanceXY = layout.getDistXY(
                node,
                node.series.parentNode as any
            );
            distanceR = (
                (node.series.parentNodeRadius as any) -
                (node.marker as any).radius -
                layout.vectorLength(distanceXY)
            );
            if (
                distanceR < 0 &&
                distanceR > -2 * (node.marker as any).radius
            ) {
                (node.plotX as any) -= distanceXY.x * factor;
                (node.plotY as any) -= distanceXY.y * factor;
            }
        }

        super.applyLimitBox(node, box);
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace PackedBubbleLayout {

    /**
     * @optionparent series.packedbubble.layoutAlgorithm
     */
    export interface Options extends ReingoldFruchtermanLayout.Options {

        /**
         * Type of the algorithm used when positioning bubbles.
         *
         * @apioption series.packedbubble.layoutAlgorithm.type
         */

        /**
         * The distance between two bubbles, when the algorithm starts to
         * treat two bubbles as overlapping. The `bubblePadding` is also the
         * expected distance between all the bubbles on simulation end.
         */
        bubblePadding?: number;

        /**
         * In case of split series, this option allows user to drag and
         * drop points between series, for changing point related series.
         *
         * @sample highcharts/series-packedbubble/packed-dashboard/
         *         Example of drag'n drop bubbles for bubble kanban
         */
        dragBetweenSeries?: boolean;

        enableSimulation?: boolean;

        friction?: number;

        gravitationalConstant?: number;

        /**
         * Initial layout algorithm for positioning nodes. Can be one of
         * the built-in options ("circle", "random") or a function where
         * positions should be set on each node (`this.nodes`) as
         * `node.plotX` and `node.plotY`.
         *
         * @sample highcharts/series-networkgraph/initial-positions/
         *         Initial positions with callback
         *
         * @type {"circle"|"random"|Function}
         *
         * @apioption series.packedbubble.layoutAlgorithm.initialPositions
         */

        /**
         *
         * @sample highcharts/series-packedbubble/initial-radius/
         *         Initial radius set to 200
         *
         * @extends plotOptions.networkgraph.layoutAlgorithm.initialPositionRadius
         *
         * @excluding states
         */
        initialPositionRadius?: number;

        /**
         * Integration type. Integration determines how forces are applied
         * on particles. The `packedbubble` integration is based on
         * the networkgraph `verlet` integration, where the new position
         * is based on a previous position without velocity:
         * `newPosition += previousPosition - newPosition`.
         *
         * @sample highcharts/series-networkgraph/forces/
         *
         * @apioption series.packedbubble.layoutAlgorithm.integration
         */

        marker?: PointMarkerOptions;

        maxIterations?: number;

        /**
         * Max speed that node can get in one iteration. In terms of
         * simulation, it's a maximum translation (in pixels) that a node
         * can move (in both, x and y, dimensions). While `friction` is
         * applied on all nodes, max speed is applied only for nodes that
         * move very fast, for example small or disconnected ones.
         *
         * @see [layoutAlgorithm.integration](#series.networkgraph.layoutAlgorithm.integration)
         *
         * @see [layoutAlgorithm.friction](#series.networkgraph.layoutAlgorithm.friction)
         */
        maxSpeed?: number;

        /**
         * Whether bubbles should interact with their parentNode to keep
         * them inside.
         */
        parentNodeLimit?: boolean;

        /**
         * Layout algorithm options for parent nodes.
         *
         * @extends plotOptions.networkgraph.layoutAlgorithm
         *
         * @excluding approximation, attractiveForce, enableSimulation,
         *            repulsiveForce, theta
         */
        parentNodeOptions?: Options;


        /**
         * Whether series should interact with each other or not. When
         * `parentNodeLimit` is set to true, thi option should be set to
         * false to avoid sticking points in wrong series parentNode.
         */
        seriesInteraction?: boolean;

        /**
         * Whether to split series into individual groups or to mix all
         * series together.
         *
         * @since 7.1.0
         *
         * @default false
         */
        splitSeries?: boolean;

    }

}

/* *
 *
 *  Registry
 *
 * */

GraphLayout.layouts.packedbubble = PackedBubbleLayout;

/* *
 *
 *  Default Export
 *
 * */

export default PackedBubbleLayout;
