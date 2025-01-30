/* *
 *
 *  Grid TableHeader class
 *
 *  (c) 2020-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *  - Sebastian Bochan
 *
 * */

'use strict';


/* *
 *
 *  Imports
 *
 * */

import type { GroupedHeaderOptions } from '../../Options';
import Column from '../Column.js';
import Table from '../Table.js';
import HeaderRow from './HeaderRow.js';


/* *
 *
 *  Class
 *
 * */

/**
 * Represents a table header row containing the cells (headers) with
 * column names.
 */
class TableHeader {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The visible columns of the table.
     */
    public columns: Column[] = [];

    /**
     * The container of the table head.
     */
    public rows: HeaderRow[] = [];

    /**
     * The viewport (table) the table head belongs to.
     */
    public viewport: Table;

    /**
     * Amount of levels in the header, that is used in creating correct rows.
     */
    public levels: number = 1;


    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs a new table head.
     *
     * @param viewport
     * The viewport (table) the table head belongs to.
     */
    constructor(viewport: Table) {
        this.viewport = viewport;
        this.columns = viewport.columns;

        if (viewport.grid.options?.header) {
            this.levels = this.getRowLevels(
                viewport.grid.options?.header
            );
        }
    }

    /* *
    *
    *  Methods
    *
    * */

    /**
     * Renders the table head content.
     */
    public render(): void {
        const vp = this.viewport;

        if (!vp.grid.enabledColumns) {
            return;
        }

        for (let i = 0, iEnd = this.levels; i < iEnd; i++) {
            const row = new HeaderRow(vp, i + 1); // Avoid indexing from 0
            row.renderMultipleLevel(i);
            this.rows.push(row);
        }
    }

    /**
     * Reflows the table head's content dimensions.
     */
    public reflow(): void {
        const vp = this.viewport;

        if (!vp.theadElement) {
            return;
        }

        const { clientWidth, offsetWidth } = vp.tbodyElement;
        const header = vp.header;
        const rows = this.rows;
        const bordersWidth = offsetWidth - clientWidth;

        for (const row of rows) {
            row.reflow();
        }

        if (vp.rowsWidth) {
            vp.theadElement.style.width =
                Math.max(vp.rowsWidth, clientWidth) + bordersWidth + 'px';
        }

        if (
            header &&
            bordersWidth > 0 &&
            this.viewport.columnDistribution === 'full'
        ) {
            const row = this.columns[this.columns.length - 1].header?.row;
            const lastCellEl = row?.cells[row.cells.length - 1]?.htmlElement;

            if (lastCellEl) {
                lastCellEl.style.width = lastCellEl.style.maxWidth =
                lastCellEl.offsetWidth + bordersWidth + 'px';
            }
        }
    }

    /**
     * Returns amount of rows for the current cell in header tree.
     *
     * @param scope
     * Structure of header
     *
     * @returns
     */
    private getRowLevels(
        scope: Array<GroupedHeaderOptions | string>
    ): number {
        let maxDepth = 0;

        for (const item of scope) {
            if (typeof item !== 'string' && item.columns) {
                const depth = this.getRowLevels(item.columns);
                if (depth > maxDepth) {
                    maxDepth = depth;
                }
            }
        }

        return maxDepth + 1;
    }

    /**
     * Scrolls the table head horizontally, only when the virtualization
     * is enabled.
     *
     * @param scrollLeft
     * The left scroll position.
     */
    public scrollHorizontally(scrollLeft: number): void {
        const el = this.viewport.theadElement;
        if (!el) {
            return;
        }

        el.style.transform = `translateX(${-scrollLeft}px)`;
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace TableHeader {

}


/* *
 *
 *  Default Export
 *
 * */

export default TableHeader;
