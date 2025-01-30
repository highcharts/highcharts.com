/* *
 *
 *  Grid Row abstract class
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

import type Cell from './Cell';
import type Column from './Column';

import Table from './Table.js';
import GridUtils from '../GridUtils.js';

const { makeHTMLElement } = GridUtils;

/* *
 *
 *  Abstract Class of Row
 *
 * */

/**
 * Represents a row in the data grid.
 */
abstract class Row {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The cells of the row.
     */
    public cells: Cell[] = [];

    /**
     * The HTML element of the row.
     */
    public htmlElement: HTMLTableRowElement;

    /**
     * The viewport the row belongs to.
     */
    public viewport: Table;

    /**
     * Flag to determine if the row is added to the DOM.
     */
    public rendered?: boolean;


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
     */
    constructor(viewport: Table) {
        this.viewport = viewport;
        this.htmlElement = makeHTMLElement('tr', {});
    }


    /* *
    *
    *  Methods
    *
    * */

    /**
     * Creates a cell in the row.
     *
     * @param column
     * The column the cell belongs to.
     */
    public abstract createCell(column?: Column): Cell;

    /**
     * Renders the row's content. It does not attach the row element to the
     * viewport nor pushes the rows to the viewport.rows array.
     */
    public render(): void {
        const columns = this.viewport.columns;

        for (let i = 0, iEnd = columns.length; i < iEnd; i++) {
            const cell = this.createCell(columns[i]);
            cell.render();
        }

        this.rendered = true;

        if (this.viewport.grid.options?.rendering?.rows?.virtualization) {
            this.reflow();
        }
    }

    /**
     * Reflows the row's content dimensions.
     */
    public reflow(): void {
        for (let j = 0, jEnd = this.cells.length; j < jEnd; ++j) {
            this.cells[j].reflow();
        }

        const vp = this.viewport;
        if (vp.rowsWidth) {
            this.htmlElement.style.width = vp.rowsWidth + 'px';
        }
    }

    /**
     * Destroys the row.
     */
    public destroy(): void {
        if (!this.htmlElement) {
            return;
        }

        for (let i = this.cells.length - 1; i >= 0; --i) {
            this.cells[i].destroy();
        }

        this.htmlElement.remove();
    }

    /**
     * Returns the cell with the given column ID.
     *
     * @param columnId
     * The column ID that the cell belongs to.
     *
     * @returns
     * The cell with the given column ID or undefined if not found.
     */
    public getCell(columnId: string): Cell | undefined {
        return this.cells.find((cell): boolean => cell.column?.id === columnId);
    }

    /**
     * Registers a cell in the row.
     *
     * @param cell
     * The cell to register.
     */
    public registerCell(cell: Cell): void {
        this.cells.push(cell);
    }

    /**
     * Unregister a cell from the row.
     *
     * @param cell
     * The cell to unregister.
     */
    public unregisterCell(cell: Cell): void {
        const index = this.cells.indexOf(cell);
        if (index > -1) {
            this.cells.splice(index, 1);
        }
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace Row {

}


/* *
 *
 *  Default Export
 *
 * */

export default Row;
