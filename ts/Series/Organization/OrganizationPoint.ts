/* *
 *
 *  Organization chart module
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

import type OrganizationPointOptions from './OrganizationPointOptions';
import type OrganizationSeries from './OrganizationSeries';
import type { OrganizationSeriesNodeOptions } from './OrganizationSeriesOptions';
import type SankeyPoint from './../Sankey/SankeyPoint';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        sankey: {
            prototype: {
                pointClass: SankeyPointClass
            }
        }
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find
} = AH;
const { defined } = OH;
const {
    pick
} = U;

/**
 * Get columns offset including all sibiling and cousins etc.
 *
 * @private
 * @param node Point
 */
function getOffset(node: SankeyPoint): number {
    let offset = node.linksFrom.length;

    node.linksFrom.forEach((link): void => {
        if (link.id === link.toNode.linksTo[0].id) {
            // Node has children, that hangs directly from it:
            offset += getOffset(link.toNode);
        } else {
            // If the node hangs from multiple parents, and this is not
            // the last one, ignore it:
            offset--;
        }
    });

    return offset;
}

/* *
 *
 *  Class
 *
 * */

class OrganizationPoint extends SankeyPointClass {

    /* *
     *
     *  Properties
     *
     * */

    public description?: string;

    public fromNode: OrganizationPoint = void 0 as any;

    public image?: OrganizationSeriesNodeOptions['image'];

    public linksFrom: Array<OrganizationPoint> = void 0 as any;

    public linksTo: Array<OrganizationPoint> = void 0 as any;

    public nodeHeight?: number;

    public options: OrganizationPointOptions = void 0 as any;

    public series: OrganizationSeries = void 0 as any;

    public title?: string;

    public toNode: OrganizationPoint = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    init(): OrganizationPoint {
        SankeyPointClass.prototype.init.apply(this, arguments);

        if (!this.isNode) {
            this.dataLabelOnNull = true;
            this.formatPrefix = 'link';
        }

        return this;
    }

    /**
     * All nodes in an org chart are equal width.
     * @private
     */
    public getSum(): number {
        return 1;
    }

    /**
     * Set node.column for hanging layout
     * @private
     */
    public setNodeColumn(): void {
        super.setNodeColumn();
        const node = this,
            fromNode = node.getFromNode().fromNode;

        // Hanging layout
        if (
            // Not defined by user
            !defined(node.options.column) &&
            // Has links to
            node.linksTo.length !== 0 &&
            // And parent uses hanging layout
            fromNode &&
            (fromNode.options as any).layout === 'hanging'
        ) {
            // Default all children of the hanging node
            // to have hanging layout
            (node.options as any).layout = pick(
                (node.options as any).layout,
                'hanging'
            );
            node.hangsFrom = fromNode;
            let i = -1;
            find(
                fromNode.linksFrom,
                function (link, index): boolean {
                    const found = link.toNode === node;
                    if (found) {
                        i = index;
                    }
                    return found;
                }
            );

            // For all siblings' children (recursively)
            // increase the column offset to prevent overlapping
            for (let j = 0; j < fromNode.linksFrom.length; j++) {
                let link = fromNode.linksFrom[j];

                if (link.toNode.id === node.id) {
                    // Break
                    j = fromNode.linksFrom.length;
                } else {
                    i += getOffset(link.toNode);
                }

            }
            node.column = (node.column || 0) + i;
        }

    }

}

/* *
 *
 *  Default Export
 *
 * */

export default OrganizationPoint;
