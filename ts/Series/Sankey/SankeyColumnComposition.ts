import type SankeySeries from './SankeySeries';
import type SankeyPoint from './SankeyPoint';

import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { defined } = OH;
const {
    relativeLength
} = U;

namespace SankeyColumnComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class ArrayComposition<T extends SankeyPoint = SankeyPoint> extends Array<T> {
        sankeyColumn: SankeyColumnAdditions;
    }

    /**
     * SankeyColumn Composition
     * @private
     * @function Highcharts.SankeyColumn#compose
     *
     * @param {Array<SankeyPoint>} points
     * The array of nodes
     * @param {SankeySeries} series
     * Series connected to column
     * @return {ArrayComposition} SankeyColumnArray
     */
    export function compose<T extends SankeySeries>(
        points: Array<T['pointClass']['prototype']>,
        series: T
    ): ArrayComposition<typeof points[0]> {
        const sankeyColumnArray = points as ArrayComposition<typeof points[0]>;
        sankeyColumnArray.sankeyColumn =
            new SankeyColumnAdditions(sankeyColumnArray, series);
        return sankeyColumnArray;
    }

    /* *
     *
     *  Classes
     *
     * */
    export class SankeyColumnAdditions {

        constructor(
            points: ArrayComposition,
            series: SankeySeries
        ) {
            this.points = points;
            this.series = series;
        }

        public points: ArrayComposition;

        public maxLength?: number;

        public maxRadius?: number;

        public scale?: number;

        public additionalSpace?: number;

        public series: SankeySeries;

        /**
         * Calculate translation factor used in column and nodes distribution
         * @private
         * @function Highcharts.SankeyColumn#getTranslationFactor
         *
         * @param {SankeySeries} series
         * The Series
         * @return {number} TranslationFactor
         * Translation Factor
         */
        public getTranslationFactor(
            series: SankeySeries
        ): number {

            const column = this.points,
                nodes = column.slice(),
                chart = series.chart,
                minLinkWidth = series.options.minLinkWidth || 0;

            let skipPoint: boolean,
                factor = 0,
                i: number,
                remainingHeight = (
                    (chart.plotSizeY || 0) -
                    (series.options.borderWidth || 0) -
                    (column.length - 1) * series.nodePadding
                );
            // Because the minLinkWidth option doesn't obey the direct
            // translation, we need to run translation iteratively, check
            // node heights, remove those nodes affected by minLinkWidth,
            // check again, etc.
            while (column.length) {
                factor = remainingHeight / column.sankeyColumn.sum();
                skipPoint = false;
                i = column.length;
                while (i--) {
                    if (column[i].getSum() * factor < minLinkWidth) {
                        column.splice(i, 1);
                        remainingHeight =
                            Math.max(0, remainingHeight - minLinkWidth);
                        skipPoint = true;
                    }
                }
                if (!skipPoint) {
                    break;
                }
            }

            // Re-insert original nodes
            column.length = 0;
            nodes.forEach((node): void => {
                column.push(node);
            });
            return factor;
        }


        /**
         * Get the top position of the column in pixels
         * @private
         * @function Highcharts.SankeyColumn#top
         *
         * @param {number} factor
         * The Translation Factor
         * @return {number} top
         * The top position of the column
         */
        public top(factor: number): number {
            const series = this.series;
            const nodePadding = series.nodePadding;
            const height = this.points.reduce(function (
                height: number,
                node: SankeyPoint
            ): number {
                if (height > 0) {
                    height += nodePadding;
                }
                const nodeHeight = Math.max(
                    node.getSum() * factor,
                    series.options.minLinkWidth || 0
                );
                height += nodeHeight;
                return height;
            }, 0);

            // Node alignment option handling #19096
            return {
                top: 0,
                center: 0.5,
                bottom: 1
            }[series.options.nodeAlignment || 'center'] * (
                (series.chart.plotSizeY || 0) - height
            );
        }


        /**
         * Get the left position of the column in pixels
         * @private
         * @function Highcharts.SankeyColumn#top
         *
         * @param {number} factor
         * The Translation Factor
         * @return {number} left
         * The left position of the column
         */
        public left(factor: number): number {
            const series = this.series,
                chart = series.chart,
                equalNodes = (series.options as any).equalNodes;
            const maxNodesLength = chart.inverted ?
                    chart.plotHeight : chart.plotWidth,
                nodePadding = series.nodePadding;
            const width = this.points.reduce(function (
                width: number,
                node: SankeyPoint
            ): number {
                if (width > 0) {
                    width += nodePadding;
                }
                const nodeWidth = equalNodes ?
                    maxNodesLength / node.series.nodes.length - nodePadding :
                    Math.max(
                        node.getSum() * factor,
                        series.options.minLinkWidth || 0
                    );
                width += nodeWidth;
                return width;
            }, 0);
            return ((chart.plotSizeX || 0) - Math.round(width)) / 2;
        }


        /**
         * Calculate sum of all nodes inside specific column
         * @private
         * @function Highcharts.SankeyColumn#sum
         *
         * @param {ArrayComposition} this
         * Sankey Column Array
         *
         * @return {number} sum
         * Sum of all nodes inside column
         */
        public sum(this: SankeyColumnAdditions): number {
            return this.points.reduce(function (
                sum: number,
                node: SankeyPoint
            ): number {
                return sum + node.getSum();
            }, 0);
        }

        /**
         * Get the offset in pixels of a node inside the column
         * @private
         * @function Highcharts.SankeyColumn#offset
         *
         * @param {SankeyPoint} node
         * Sankey node
         * @param {number} factor
         * Translation Factor
         * @return {number} offset
         * Offset of a node inside column
         */
        public offset(
            node: SankeyPoint,
            factor: number
        ): (Record<string, number>|undefined) {
            const column = this.points,
                series = this.series,
                nodePadding = series.nodePadding;

            let offset = 0,
                totalNodeOffset;

            if (series.is('organization') && node.hangsFrom) {
                return {
                    absoluteTop: node.hangsFrom.nodeY
                };
            }

            for (let i = 0; i < column.length; i++) {
                const sum = column[i].getSum();
                const height = Math.max(
                    sum * factor,
                    series.options.minLinkWidth || 0
                );
                const directionOffset = node.options[
                        series.chart.inverted ?
                            'offsetHorizontal' :
                            'offsetVertical'
                    ],
                    optionOffset = node.options.offset || 0;

                if (sum) {
                    totalNodeOffset = height + nodePadding;
                } else {
                    // If node sum equals 0 nodePadding is missed #12453
                    totalNodeOffset = 0;
                }
                if (column[i] === node) {
                    return {
                        relativeTop: offset + (
                            defined(directionOffset) ?
                                // directionOffset is a percent
                                // of the node height
                                relativeLength(directionOffset, height) :
                                relativeLength(
                                    optionOffset,
                                    totalNodeOffset
                                )
                        )
                    };
                }
                offset += totalNodeOffset;
            }
        }
    }
}

export default SankeyColumnComposition;
