/* *
 *
 *  Dependency wheel module
 *
 *  (c) 2018-2024 Torstein Honsi
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

import type DependencyWheelSeriesOptions from './DependencyWheelSeriesOptions';

import { animObject } from '../../Core/Animation/AnimationUtilities.js';
import DependencyWheelPoint from './DependencyWheelPoint.js';
import DependencyWheelSeriesDefaults from './DependencyWheelSeriesDefaults.js';
import H from '../../Core/Globals.js';
const { deg2rad } = H;
import SankeyColumnComposition from '../Sankey/SankeyColumnComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    pie: PieSeries,
    sankey: SankeySeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    extend,
    merge,
    relativeLength
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.dependencywheel
 *
 * @augments Highcharts.seriesTypes.sankey
 */
class DependencyWheelSeries extends SankeySeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: DependencyWheelSeriesOptions = merge(
        SankeySeries.defaultOptions,
        DependencyWheelSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data!: Array<DependencyWheelPoint>;

    public options!: DependencyWheelSeriesOptions;

    public nodeColumns!: Array<SankeyColumnComposition.ArrayComposition<DependencyWheelPoint>>;

    public nodes!: Array<DependencyWheelPoint>;

    public points!: Array<DependencyWheelPoint>;

    /* *
     *
     *  Functions
     *
     * */

    public animate(init?: boolean): void {
        const series = this;

        if (!init) {
            const duration = animObject(series.options.animation).duration,
                step = (duration / 2) / series.nodes.length;

            let i = 0;

            for (const point of series.nodes) {
                const graphic = point.graphic;
                if (graphic) {
                    graphic.attr({ opacity: 0 });
                    setTimeout((): void => {
                        if (point.graphic) {
                            point.graphic.animate(
                                { opacity: 1 },
                                { duration: step }
                            );
                        }
                    }, step * i++);
                }
            }

            for (const point of series.points) {
                const graphic = point.graphic;
                if (!point.isNode && graphic) {
                    graphic.attr({ opacity: 0 })
                        .animate({
                            opacity: 1
                        }, series.options.animation);
                }
            }

        }
    }

    public createNode(id: string): DependencyWheelPoint {
        const node = super.createNode(id) as DependencyWheelPoint;

        /**
         * Return the sum of incoming and outgoing links.
         * @private
         */
        node.getSum = (): number => (
            node.linksFrom
                .concat(node.linksTo)
                .reduce((
                    acc: number,
                    link: DependencyWheelPoint
                ): number => (
                    acc + (link.weight as any)
                ), 0)
        );

        /**
         * Get the offset in weight values of a point/link.
         * @private
         */
        node.offset = (
            point: DependencyWheelPoint
        ): (number|undefined) => {
            const otherNode = (
                link: DependencyWheelPoint
            ): DependencyWheelPoint => (
                link.fromNode === node ?
                    link.toNode :
                    link.fromNode
            );

            let offset = 0,
                links = node.linksFrom.concat(node.linksTo),
                sliced: (boolean|undefined);

            // Sort and slice the links to avoid links going out of each
            // node crossing each other.
            links.sort((a, b): number => (
                otherNode(a).index - otherNode(b).index
            ));

            for (let i = 0; i < links.length; i++) {
                if (otherNode(links[i]).index > node.index) {
                    links = links.slice(0, i).reverse().concat(
                        links.slice(i).reverse()
                    );
                    sliced = true;
                    break;
                }
            }

            if (!sliced) {
                links.reverse();
            }

            for (let i = 0; i < links.length; i++) {
                if (links[i] === point) {
                    return offset;
                }
                offset += links[i].weight as any;
            }
        };

        return node;
    }

    /**
     * Dependency wheel has only one column, it runs along the perimeter.
     * @private
     */
    public createNodeColumns(): Array<SankeyColumnComposition.ArrayComposition> {
        const series = this,
            columns = [SankeyColumnComposition.compose([], series)];

        for (const node of series.nodes) {
            node.column = 0;
            columns[0].push(node);
        }

        return columns;
    }

    /**
     * Translate from vertical pixels to perimeter.
     * @private
     */
    public getNodePadding(): number {
        return (this.options.nodePadding as any) / Math.PI;
    }

    /**
     * @ignore
     * @todo Override the refactored sankey translateLink and translateNode
     * functions instead of the whole translate function.
     */
    public translate(): void {
        const series = this,
            options = series.options,
            factor = 2 * Math.PI /
                (series.chart.plotHeight + series.getNodePadding()),
            center = series.getCenter(),
            startAngle = ((options.startAngle as any) - 90) * deg2rad,
            brOption = options.borderRadius,
            borderRadius = typeof brOption === 'object' ?
                brOption.radius : brOption;

        super.translate();

        for (const node of this.nodeColumns[0]) {
            // Don't render the nodes if sum is 0 #12453
            if (node.sum) {
                const shapeArgs = node.shapeArgs,
                    centerX = center[0],
                    centerY = center[1],
                    r = center[2] / 2,
                    nodeWidth = options.nodeWidth === 'auto' ?
                        20 : options.nodeWidth,
                    innerR = r - relativeLength(nodeWidth || 0, r),
                    start = startAngle + factor * (shapeArgs.y || 0),
                    end = startAngle +
                        factor * ((shapeArgs.y || 0) + (shapeArgs.height || 0));

                // Middle angle
                node.angle = start + (end - start) / 2;

                node.shapeType = 'arc';
                node.shapeArgs = {
                    x: centerX,
                    y: centerY,
                    r: r,
                    innerR: innerR,
                    start: start,
                    end: end,
                    borderRadius
                };

                node.dlBox = {
                    x: centerX + Math.cos((start + end) / 2) * (r + innerR) / 2,
                    y: centerY + Math.sin((start + end) / 2) * (r + innerR) / 2,
                    width: 1,
                    height: 1
                };

                // Draw the links from this node
                for (const point of node.linksFrom) {
                    if (point.linkBase) {
                        let curveFactor: number,
                            distance: number;

                        const corners = point.linkBase.map((
                            top: number,
                            i: number
                        ): Record<string, number> => {
                            const angle = factor * top,
                                x = Math.cos(startAngle + angle) * (innerR + 1),
                                y = Math.sin(startAngle + angle) * (innerR + 1);

                            curveFactor = options.curveFactor || 0;

                            // The distance between the from and to node
                            // along the perimeter. This affect how curved
                            // the link is, so that links between neighbours
                            // don't extend too far towards the center.
                            distance = Math.abs(
                                point.linkBase[3 - i] * factor - angle
                            );
                            if (distance > Math.PI) {
                                distance = 2 * Math.PI - distance;
                            }
                            distance = distance * innerR;
                            if (distance < innerR) {
                                curveFactor *= (distance / innerR);
                            }

                            return {
                                x: centerX + x,
                                y: centerY + y,
                                cpX: centerX + (1 - curveFactor) * x,
                                cpY: centerY + (1 - curveFactor) * y
                            };
                        });

                        point.shapeArgs = {
                            d: [[
                                'M',
                                corners[0].x, corners[0].y
                            ], [
                                'A',
                                innerR, innerR,
                                0,
                                0, // Long arc
                                1, // Clockwise
                                corners[1].x, corners[1].y
                            ], [
                                'C',
                                corners[1].cpX, corners[1].cpY,
                                corners[2].cpX, corners[2].cpY,
                                corners[2].x, corners[2].y
                            ], [
                                'A',
                                innerR, innerR,
                                0,
                                0,
                                1,
                                corners[3].x, corners[3].y
                            ], [
                                'C',
                                corners[3].cpX, corners[3].cpY,
                                corners[0].cpX, corners[0].cpY,
                                corners[0].x, corners[0].y
                            ]]
                        };
                    }
                }
            }
        }
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface DependencyWheelSeries {
    getCenter: typeof PieSeries.prototype.getCenter;
    orderNodes: boolean;
    pointClass: typeof DependencyWheelPoint;
}
extend(DependencyWheelSeries.prototype, {
    orderNodes: false,
    getCenter: PieSeries.prototype.getCenter
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        dependencywheel: typeof DependencyWheelSeries;
    }
}
DependencyWheelSeries.prototype.pointClass = DependencyWheelPoint;
SeriesRegistry.registerSeriesType('dependencywheel', DependencyWheelSeries);

/* *
 *
 *  Default Export
 *
 * */

export default DependencyWheelSeries;
