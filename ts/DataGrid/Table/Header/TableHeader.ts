/* *
 *
 *  DataGrid class
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
import Utils from '../../../Core/Utilities.js';
const { getStyle } = Utils;

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

        if (viewport.dataGrid.options?.header) {
            this.levels = this.getRowLevels(
                viewport.dataGrid.options?.header
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
        const dataGrid = vp.dataGrid;

        if (!dataGrid.enabledColumns) {
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
        const tableEl = header?.viewport.dataGrid.tableElement;
        const theadEL = header?.viewport.theadElement;
        const theadBorder =
            theadEL && getStyle(theadEL, 'border-right-width', true) || 0;
        const tableBorder = (
            tableEl && getStyle(tableEl, 'border-right-width', true)) || 0;
        const bordersWidth =
            offsetWidth - clientWidth - theadBorder - tableBorder;

        for (const row of rows) {
            row.reflow();
        }

        if (vp.rowsWidth) {
            vp.theadElement.style.width =
                Math.max(vp.rowsWidth, clientWidth) + bordersWidth + 'px';
        }

        // Adjust cell's width when scrollbar is enabled.
        if (
            header &&
            bordersWidth > 0 &&
            this.viewport.columnDistribution === 'full'
        ) {
            const cells = header.rows[header.rows.length - 1].cells;
            const cellHtmlElement = cells[cells.length - 1].htmlElement;

            cellHtmlElement.style.width = cellHtmlElement.style.maxWidth =
                cellHtmlElement.offsetWidth + bordersWidth + 'px';
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
