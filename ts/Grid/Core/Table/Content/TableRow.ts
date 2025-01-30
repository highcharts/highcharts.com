/* *
 *
 *  Grid TableRow class
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

import type Cell from '../Cell';
import type Column from '../Column';
import type DataTable from '../../../../Data/DataTable';

import Row from '../Row.js';
import Table from '../Table.js';
import TableCell from './TableCell.js';
import Globals from '../../Globals.js';


/* *
 *
 *  Class
 *
 * */

/**
 * Represents a row in the data grid.
 */
class TableRow extends Row {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The row values from the data table in the original column order.
     */
    public data: DataTable.RowObject = {};

    /**
     * The local index of the row in the presentation data table.
     */
    public index: number;

    /**
     * The index of the row in the original data table (ID).
     */
    public id?: number;

    /**
     * The vertical translation of the row.
     */
    public translateY: number = 0;


    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs a row in the data grid.
     *
     * @param viewport
     * The Grid Table instance which the row belongs to.
     *
     * @param index
     * The index of the row in the data table.
     */
    constructor(viewport: Table, index: number) {
        super(viewport);
        this.index = index;
        this.id = viewport.dataTable.getOriginalRowIndex(index);

        this.loadData();
        this.setRowAttributes();
    }

    /* *
    *
    *  Methods
    *
    * */

    public override createCell(column: Column): Cell {
        return new TableCell(this, column);
    }

    /**
     * Loads the row data from the data table.
     */
    private loadData(): void {
        const data = this.viewport.dataTable.getRowObject(this.index);
        if (!data) {
            return;
        }

        this.data = data;
    }

    /**
     * Adds or removes the hovered CSS class to the row element.
     *
     * @param hovered
     * Whether the row should be hovered.
     */
    public setHoveredState(hovered: boolean): void {
        this.htmlElement.classList[hovered ? 'add' : 'remove'](
            Globals.getClassName('hoveredRow')
        );

        if (hovered) {
            this.viewport.grid.hoveredRowIndex = this.index;
        }
    }

    /**
     * Adds or removes the synced CSS class to the row element.
     *
     * @param synced
     * Whether the row should be synced.
     */
    public setSyncedState(synced: boolean): void {
        this.htmlElement.classList[synced ? 'add' : 'remove'](
            Globals.getClassName('syncedRow')
        );

        if (synced) {
            this.viewport.grid.syncedRowIndex = this.index;
        }
    }

    /**
     * Sets the row HTML element attributes and additional classes.
     */
    public setRowAttributes(): void {
        const idx = this.index;
        const el = this.htmlElement;
        const a11y = this.viewport.grid.accessibility;

        el.classList.add(Globals.getClassName('rowElement'));

        // Index of the row in the presentation data table
        el.setAttribute('data-row-index', idx);

        // Index of the row in the original data table (ID)
        if (this.id !== void 0) {
            el.setAttribute('data-row-id', this.id);
        }

        // Calculate levels of header, 1 to avoid indexing from 0
        a11y?.setRowIndex(el, idx + (this.viewport.header?.levels ?? 1) + 1);

        // Indexing from 0, so rows with even index are odd.
        el.classList.add(Globals.getClassName(idx % 2 ? 'rowEven' : 'rowOdd'));

        if (this.viewport.grid.hoveredRowIndex === idx) {
            el.classList.add(Globals.getClassName('hoveredRow'));
        }

        if (this.viewport.grid.syncedRowIndex === idx) {
            el.classList.add(Globals.getClassName('syncedRow'));
        }
    }

    /**
     * Sets the vertical translation of the row. Used for virtual scrolling.
     *
     * @param value
     * The vertical translation of the row.
     */
    public setTranslateY(value: number): void {
        this.translateY = value;
        this.htmlElement.style.transform = `translateY(${value}px)`;
    }

    /**
     * Returns the default top offset of the row (before adjusting row heights).
     * @internal
     */
    public getDefaultTopOffset(): number {
        return this.index * this.viewport.rowsVirtualizer.defaultRowHeight;
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace TableRow {

}


/* *
 *
 *  Default Export
 *
 * */

export default TableRow;
