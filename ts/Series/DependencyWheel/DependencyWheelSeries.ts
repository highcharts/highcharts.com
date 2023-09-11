/* *
 *
 *  Dependency wheel module
 *
 *  (c) 2018-2021 Torstein Honsi
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

import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject } = A;
import DependencyWheelPoint from './DependencyWheelPoint.js';
import DependencyWheelSeriesDefaults from './DependencyWheelSeriesDefaults.js';
import H from '../../Core/Globals.js';
const { deg2rad } = H;
import SankeyColumnComposition from '../Sankey/SankeyColumnComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend,
    merge
} = OH;
const {
    seriesTypes: {
        pie: PieSeries,
        sankey: SankeySeries
    }
} = SeriesRegistry;

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

    public data: Array<DependencyWheelPoint> = void 0 as any;

    public options: DependencyWheelSeriesOptions = void 0 as any;

    public nodeColumns: Array<SankeyColumnComposition.ArrayComposition<DependencyWheelPoint>> = void 0 as any;

    public nodes: Array<DependencyWheelPoint> = void 0 as any;

    public points: Array<DependencyWheelPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public animate(init?: boolean): void {
        if (!init) {
            const duration = animObject(this.options.animation).duration,
                step = (duration / 2) / this.nodes.length;
            this.nodes.forEach(function (point, i): void {
                const graphic = point.graphic;
                if (graphic) {
                    graphic.attr({ opacity: 0 });
                    setTimeout(function (): void {
                        if (point.graphic) {
                            point.graphic.animate(
                                { opacity: 1 },
                                { duration: step }
                            );
                        }
                    }, step * i);
                }
            }, this);
            this.points.forEach(function (point): void {
                const graphic = point.graphic;
                if (!point.isNode && graphic) {
                    graphic.attr({ opacity: 0 })
                        .animate({
                            opacity: 1
                        }, this.options.animation);
                }
            }, this);

        }
    }

    public createNode(id: string): DependencyWheelPoint {
        const node = SankeySeries.prototype.createNode.call(
            this,
            id
        ) as DependencyWheelPoint;

        /**
         * Return the sum of incoming and outgoing links.
         * @private
         */
        node.getSum = function (
            this: DependencyWheelPoint
        ): number {
            return node.linksFrom
                .concat(node.linksTo)
                .reduce(function (
                    acc: number,
                    link: DependencyWheelPoint
                ): number {
                    return acc + (link.weight as any);
                }, 0);
        };

        /**
         * Get the offset in weight values of a point/link.
         * @private
         */
        node.offset = function (
            point: DependencyWheelPoint
        ): (number|undefined) {

            let offset = 0,
                i: number,
                links = node.linksFrom.concat(node.linksTo),
                sliced: (boolean|undefined);

            /**
             * @private
             */
            function otherNode(
                link: DependencyWheelPoint
            ): DependencyWheelPoint {
                if (link.fromNode === node) {
                    return link.toNode;
                }
                return link.fromNode;
            }

            // Sort and slice the links to avoid links going out of each
            // node crossing each other.
            links.sort(function (a, b): number {
                return otherNode(a).index - otherNode(b).index;
            });
            for (i = 0; i < links.length; i++) {
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

            for (i = 0; i < links.length; i++) {
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
        const columns = [SankeyColumnComposition.compose([], this)];
        this.nodes.forEach(function (
            node: DependencyWheelPoint
        ): void {
            node.column = 0;
            columns[0].push(node);
        });
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
     * @private
     * @todo Override the refactored sankey translateLink and translateNode
     * functions instead of the whole translate function.
     */
    public translate(): void {

        const options = this.options,
            factor = 2 * Math.PI /
                (this.chart.plotHeight + this.getNodePadding()),
            center = this.getCenter(),
            startAngle = ((options.startAngle as any) - 90) * deg2rad,
            brOption = options.borderRadius,
            borderRadius = typeof brOption === 'object' ?
                brOption.radius : brOption;

        SankeySeries.prototype.translate.call(this);

        this.nodeColumns[0].forEach(function (node): void {
            // Don't render the nodes if sum is 0 #12453
            if (node.sum) {
                const shapeArgs = node.shapeArgs,
                    centerX = center[0],
                    centerY = center[1],
                    r = center[2] / 2,
                    innerR = r - (options.nodeWidth as any),
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
                node.linksFrom.forEach(function (point): void {
                    if (point.linkBase) {
                        let distance;
                        const corners = point.linkBase.map(function (
                            top: number,
                            i: number
                        ): Record<string, number> {
                            let angle = factor * top,
                                x = Math.cos(startAngle + angle) * (innerR + 1),
                                y = Math.sin(startAngle + angle) * (innerR + 1),
                                curveFactor: number = options.curveFactor || 0;

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
                                0, // long arc
                                1, // clockwise
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

                });
            }
        });
    }

    /* eslint-enable valid-jsdoc */

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
