/* *
 *
 *  (c) 2010-2021 Grzegorz Blachlinski, Sebastian Bochan
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
import type PackedBubbleSeriesOptions from './PackedBubbleSeriesOptions';

import GraphLayout from '../GraphLayoutComposition.js';
import PackedBubbleIntegration from './PackedBubbleIntegration.js';
import ReingoldFruchtermanLayout from '../Networkgraph/ReingoldFruchtermanLayout.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;
const {
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
        getSelectedParentNodes(): Array<PackedBubblePoint>;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

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

        if (pushUnique(composedMembers, ChartClass)) {
            addEvent(ChartClass, 'beforeRedraw', onChartBeforeRedraw);

            const chartProto = ChartClass.prototype;

            chartProto.getSelectedParentNodes = chartGetSelectedParentNodes;
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public enableSimulation?: boolean;
    public index: number = NaN;
    public nodes: Array<PackedBubblePoint> = [];
    public options: PackedBubbleLayout.Options = void 0 as any;
    public series: Array<PackedBubbleSeries> = [];

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
            nodes = layout.nodes,
            nodesLength = nodes.length + 1,
            angle = 2 * Math.PI / nodesLength,
            radius = layout.options.initialPositionRadius;

        let centerX: number,
            centerY: number,
            index = 0;

        for (const node of nodes) {
            if (
                layout.options.splitSeries &&
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
            bubblePadding = layout.options.bubblePadding;

        let force: number,
            distanceR: number,
            distanceXY: Record<string, number>;

        layout.nodes.forEach((node): void => {
            node.degree = node.mass;
            node.neighbours = 0;
            layout.nodes.forEach((repNode): void => {
                force = 0;
                if (
                    // Node cannot repulse itself:
                    node !== repNode &&
                    // Only close nodes affect each other:

                    // Not dragged:
                    !node.fixedPosition &&
                    (
                        layout.options.seriesInteraction ||
                        node.series === repNode.series
                    )
                ) {
                    distanceXY = layout.getDistXY(node, repNode);
                    distanceR = (
                        layout.vectorLength(distanceXY) -
                        (
                            (node.marker as any).radius +
                            (repNode.marker as any).radius +
                            bubblePadding
                        )
                    );
                    // TODO padding configurable
                    if (distanceR < 0) {
                        (node.degree as any) += 0.01;
                        (node.neighbours as any)++;
                        force = layout.repulsiveForce(
                            -distanceR / Math.sqrt(node.neighbours as any),
                            layout.k,
                            node,
                            repNode
                        );
                    }

                    layout.force(
                        'repulsive',
                        node,
                        force * repNode.mass,
                        distanceXY,
                        repNode,
                        distanceR
                    );
                }
            });
        });
    }

    public applyLimitBox(
        node: PackedBubblePoint,
        box: Record<string, number>
    ): void {
        const layout = this,
            factor = 0.01;

        let distanceXY: Record<string, number>,
            distanceR: number;

        // parentNodeLimit should be used together
        // with seriesInteraction: false
        if (
            layout.options.splitSeries &&
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

    export interface Options extends ReingoldFruchtermanLayout.Options {
        bubblePadding?: number;
        dragBetweenSeries?: boolean;
        enableSimulation?: boolean;
        friction?: number;
        gravitationalConstant?: number;
        initialPositionRadius?: number;
        marker?: PackedBubbleSeriesOptions['marker'];
        maxIterations?: number;
        maxSpeed?: number;
        parentNodeLimit?: boolean;
        parentNodeOptions?: Options;
        seriesInteraction?: boolean;
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
