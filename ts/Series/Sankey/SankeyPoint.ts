/* *
 *
 *  Sankey diagram module
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type SankeyPointOptions from './SankeyPointOptions';
import type SankeySeries from './SankeySeries';

import NodesComposition from '../NodesComposition.js';
import Point from '../../Core/Series/Point.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;

import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    defined
} = OH;
/* *
 *
 *  Class
 *
 * */

class SankeyPoint extends ColumnSeries.prototype.pointClass {
    /* *
     *
     *  Properties
     *
     * */

    public className: string = void 0 as any;

    public column?: number;

    public fromNode: SankeyPoint = void 0 as any;

    public hangsFrom?: SankeyPoint;

    public level: number = void 0 as any;

    public linkBase: Array<number> = void 0 as any;

    public linkColorMode: ('from'|'gradient'|'to') = void 0 as any;

    public linksFrom: Array<SankeyPoint> = void 0 as any;

    public linksTo: Array<SankeyPoint> = void 0 as any;

    public mass: number = void 0 as any;

    public nodeX: number = void 0 as any;

    public nodeY: number = void 0 as any;

    public options: SankeyPointOptions = void 0 as any;

    public outgoing?: boolean;

    public series: SankeySeries = void 0 as any;

    public sum?: number;

    public toNode: SankeyPoint = void 0 as any;

    public weight?: number;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    public applyOptions(
        options: SankeyPointOptions,
        x?: number
    ): SankeyPoint {
        Point.prototype.applyOptions.call(this, options, x);

        // Treat point.level as a synonym of point.column
        if (defined(this.options.level)) {
            this.options.column = this.column = this.options.level;
        }
        return this;
    }

    /**
     * @private
     */
    public getClassName(): string {
        return (this.isNode ? 'highcharts-node ' : 'highcharts-link ') +
        Point.prototype.getClassName.call(this);
    }

    /**
     * If there are incoming links, place it to the right of the
     * highest order column that links to this one.
     *
     * @private
     */
    public getFromNode(): { fromNode?: SankeyPoint, fromColumn: number } {
        const node = this;

        let fromColumn = -1,
            fromNode;

        for (let i = 0; i < node.linksTo.length; i++) {
            const point = node.linksTo[i];
            if (
                (point.fromNode.column as any) > fromColumn &&
                point.fromNode !== node // #16080
            ) {
                fromNode = point.fromNode;
                fromColumn = (fromNode.column as any);
            }
        }

        return { fromNode, fromColumn };
    }

    /**
     * Calculate node.column if it's not set by user
     * @private
     */
    public setNodeColumn(): void {
        const node = this;

        if (!defined(node.options.column)) {
            // No links to this node, place it left
            if (node.linksTo.length === 0) {
                node.column = 0;
            } else {
                node.column = node.getFromNode().fromColumn + 1;
            }
        }
    }


    /**
     * @private
     */
    public isValid(): boolean {
        return this.isNode || typeof this.weight === 'number';
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface SankeyPoint extends NodesComposition.PointComposition {
    init(series: SankeySeries, options: SankeyPointOptions): SankeyPoint;
}

/* *
 *
 *  Default Export
 *
 * */

export default SankeyPoint;
