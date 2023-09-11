/* *
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

import type Point from '../Core/Series/Point';
import type AnimationOptions from '../Core/Animation/AnimationOptions';
import type { PointOptions, PointShortOptions } from '../Core/Series/PointOptions';
import type Series from '../Core/Series/Series';
import type SeriesOptions from '../Core/Series/SeriesOptions';
import type { StatesOptionsKey } from '../Core/Series/StatesOptions';

import SeriesRegistry from '../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: seriesProto,
        prototype: {
            pointClass: {
                prototype: pointProto
            }
        }
    }
} = SeriesRegistry;
import U from '../Shared/Utilities.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    find,
    pushUnique
} = AH;
const { defined, extend, merge } = OH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Series/PointLike' {
    interface PointLike {
        name?: string;
    }
}

declare module '../Core/Series/SeriesLike' {
    interface SeriesLike {
        nodes?: Array<NodesComposition.PointComposition>;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace NodesComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class PointComposition extends Point {
        public from: string;
        public fromNode: PointComposition;
        public isNode: true;
        public level?: unknown;
        public linksFrom: Array<PointComposition>;
        public linksTo: Array<PointComposition>;
        public mass: number;
        public options: PointCompositionOptions;
        public outgoing?: boolean;
        public series: SeriesComposition;
        public to: string;
        public toNode: PointComposition;
        public weight?: number;
        public y?: (number|null);
        public getSum(): number;
        public hasShape(): boolean;
        public init(
            series: SeriesComposition,
            options: PointCompositionOptions
        ): PointComposition;
        public offset(
            point: PointComposition,
            coll: string
        ): (number|undefined);
        public setNodeState(
            state?: StatesOptionsKey
        ): void;
    }

    export interface PointCompositionOptions extends PointOptions {
        id?: string;
        level?: number;
        mass?: number;
        outgoing?: boolean;
        weight?: (number|null);
    }

    export declare class SeriesComposition extends Series {
        public data: Array<PointComposition>;
        public nodeLookup: Record<string, PointComposition>;
        public nodes: Array<PointComposition>;
        public options: SeriesCompositionOptions;
        public pointClass: typeof PointComposition;
        public points: Array<PointComposition>;
        public createNode(
            id: string
        ): PointComposition;
        public generatePoints(): void;
    }

    export interface SeriesCompositionOptions extends SeriesOptions {
        mass?: number;
        nodes?: Array<PointCompositionOptions>;
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
    export function compose<T extends typeof Series>(
        PointClass: typeof Point,
        SeriesClass: T
    ): (T&typeof SeriesComposition) {

        if (pushUnique(composedMembers, PointClass)) {
            const pointProto = PointClass.prototype as PointComposition;

            pointProto.setNodeState = setNodeState;
            pointProto.setState = setNodeState;
            pointProto.update = updateNode;
        }

        if (pushUnique(composedMembers, SeriesClass)) {
            const seriesProto = SeriesClass.prototype as SeriesComposition;

            seriesProto.destroy = destroy;
            seriesProto.setData = setData;
        }

        return SeriesClass as (T&typeof SeriesComposition);
    }

    /**
     * Create a single node that holds information on incoming and outgoing
     * links.
     * @private
     */
    export function createNode(
        this: SeriesComposition,
        id: string
    ): PointComposition {

        const PointClass = this.pointClass,
            findById = <T extends (PointComposition|PointCompositionOptions)>(
                nodes: Array<T>,
                id: string
            ): (T|undefined) => find(
                nodes,
                (node: T): boolean => node.id === id
            );

        let node = findById(this.nodes, id),
            options: (PointCompositionOptions|undefined);

        if (!node) {
            options = this.options.nodes && findById(this.options.nodes, id);
            const newNode = (new PointClass()).init(
                this,
                extend({
                    className: 'highcharts-node',
                    isNode: true,
                    id: id,
                    y: 1 // Pass isNull test
                } as PointCompositionOptions, options as any)
            );
            newNode.linksTo = [];
            newNode.linksFrom = [];

            /**
             * Return the largest sum of either the incoming or outgoing links.
             * @private
             */
            newNode.getSum = function (): number {
                let sumTo = 0,
                    sumFrom = 0;

                newNode.linksTo.forEach((link): void => {
                    sumTo += link.weight || 0;
                });
                newNode.linksFrom.forEach((link): void => {
                    sumFrom += link.weight || 0;
                });
                return Math.max(sumTo, sumFrom);
            };
            /**
             * Get the offset in weight values of a point/link.
             * @private
             */
            newNode.offset = function (
                point: PointComposition,
                coll: string
            ): (number|undefined) {
                let offset = 0;

                for (let i = 0; i < (newNode as any)[coll].length; i++) {
                    if ((newNode as any)[coll][i] === point) {
                        return offset;
                    }
                    offset += (newNode as any)[coll][i].weight;
                }
            };

            // Return true if the node has a shape, otherwise all links are
            // outgoing.
            newNode.hasShape = function (): boolean {
                let outgoing = 0;

                newNode.linksTo.forEach((link): void => {
                    if (link.outgoing) {
                        outgoing++;
                    }
                });
                return (
                    !newNode.linksTo.length ||
                    outgoing !== newNode.linksTo.length
                );
            };

            newNode.index = this.nodes.push(newNode) - 1;
            node = newNode;
        }

        node.formatPrefix = 'node';
        // for use in formats
        node.name = node.name || node.options.id || '';
        // Mass is used in networkgraph:
        node.mass = pick(
            // Node:
            node.options.mass,
            node.options.marker && node.options.marker.radius,
            // Series:
            this.options.marker && this.options.marker.radius,
            // Default:
            4
        );
        return node;
    }

    /**
     * Destroy alll nodes and links.
     * @private
     */
    export function destroy(
        this: SeriesComposition
    ): void {
        // Nodes must also be destroyed (#8682, #9300)
        this.data = ([] as Array<PointComposition>)
            .concat(this.points || [], this.nodes);

        return seriesProto.destroy.apply(this, arguments);
    }

    /**
     * Extend generatePoints by adding the nodes, which are Point objects but
     * pushed to the this.nodes array.
     * @private
     */
    export function generatePoints(
        this: SeriesComposition
    ): void {
        const chart = this.chart,
            nodeLookup = {} as Record<string, PointComposition>;

        seriesProto.generatePoints.call(this);

        if (!this.nodes) {
            this.nodes = []; // List of Point-like node items
        }
        this.colorCounter = 0;

        // Reset links from previous run
        this.nodes.forEach((node): void => {
            node.linksFrom.length = 0;
            node.linksTo.length = 0;
            node.level = node.options.level;
        });

        // Create the node list and set up links
        this.points.forEach((point): void => {
            if (defined(point.from)) {
                if (!nodeLookup[point.from]) {
                    nodeLookup[point.from] = this.createNode(point.from);
                }
                nodeLookup[point.from].linksFrom.push(point);
                point.fromNode = nodeLookup[point.from];

                // Point color defaults to the fromNode's color
                if (chart.styledMode) {
                    point.colorIndex = pick(
                        point.options.colorIndex,
                        nodeLookup[point.from].colorIndex
                    );
                } else {
                    point.color =
                        point.options.color || nodeLookup[point.from].color;
                }

            }
            if (defined(point.to)) {
                if (!nodeLookup[point.to]) {
                    nodeLookup[point.to] = this.createNode(point.to);
                }
                nodeLookup[point.to].linksTo.push(point);
                point.toNode = nodeLookup[point.to];
            }

            point.name = point.name || point.id; // for use in formats
        }, this);

        // Store lookup table for later use
        this.nodeLookup = nodeLookup;
    }

    /**
     * Destroy all nodes on setting new data
     * @private
     */
    function setData(
        this: SeriesComposition
    ): void {
        if (this.nodes) {
            this.nodes.forEach((node): void => {
                node.destroy();
            });
            this.nodes.length = 0;
        }
        seriesProto.setData.apply(this, arguments);
    }

    /**
     * When hovering node, highlight all connected links. When hovering a link,
     * highlight all connected nodes.
     * @private
     */
    export function setNodeState(
        this: PointComposition,
        state?: StatesOptionsKey
    ): void {
        const args = arguments,
            others = this.isNode ? this.linksTo.concat(this.linksFrom) :
                [this.fromNode, this.toNode];
        if (state !== 'select') {
            others.forEach((linkOrNode): void => {
                if (linkOrNode && linkOrNode.series) {
                    pointProto.setState.apply(linkOrNode, args);

                    if (!linkOrNode.isNode) {
                        if (linkOrNode.fromNode.graphic) {
                            pointProto.setState.apply(
                                linkOrNode.fromNode,
                                args
                            );
                        }
                        if (linkOrNode.toNode && linkOrNode.toNode.graphic) {
                            pointProto.setState.apply(
                                linkOrNode.toNode,
                                args
                            );
                        }
                    }
                }
            });
        }

        pointProto.setState.apply(this, args);
    }

    /**
     * When updating a node, don't update `series.options.data`, but
     * `series.options.nodes`
     * @private
     */
    export function updateNode(
        this: PointComposition,
        options: (PointOptions|PointShortOptions),
        redraw?: boolean,
        animation?: (boolean|Partial<AnimationOptions>),
        runEvent?: boolean
    ): void {
        const nodes = this.series.options.nodes,
            data = this.series.options.data,
            dataLength = data && data.length || 0,
            linkConfig = data && data[this.index];

        pointProto.update.call(
            this,
            options,
            this.isNode ? false : redraw, // Hold the redraw for nodes
            animation,
            runEvent
        );

        if (this.isNode) {
            // this.index refers to `series.nodes`, not `options.nodes` array
            const nodeIndex = (nodes || [])
                    .reduce( // Array.findIndex needs a polyfill
                        (prevIndex, n, index): number =>
                            (this.id === n.id ? index : prevIndex),
                        -1
                    ),
                // Merge old config with new config. New config is stored in
                // options.data, because of default logic in point.update()
                nodeConfig = merge(
                    nodes && nodes[nodeIndex] || {},
                    data && data[this.index] || {}
                );

            // Restore link config
            if (data) {
                if (linkConfig) {
                    data[this.index] = linkConfig;
                } else {
                    // Remove node from config if there's more nodes than links
                    data.length = dataLength;
                }
            }

            // Set node config
            if (nodes) {
                if (nodeIndex >= 0) {
                    nodes[nodeIndex] = nodeConfig;
                } else {
                    nodes.push(nodeConfig);
                }
            } else {
                this.series.options.nodes = [nodeConfig];
            }

            if (pick(redraw, true)) {
                this.series.chart.redraw(animation);
            }
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default NodesComposition;
