/* *
 *
 *  Data Grid class
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

import type { IndividualColumnOptions } from './Options';
import type Cell from './Cell';
import type HeaderCell from './Header/HeaderCell';

import Table from './Table.js';
import DataTable from '../Data/DataTable.js';
import Globals from './Globals.js';
import Utils from '../Core/Utilities.js';
import DGUtils from './Utils.js';
import ColumnSorting from './Actions/ColumnSorting';

const { merge } = Utils;
const { makeHTMLElement } = DGUtils;


/* *
 *
 *  Class
 *
 * */

/**
 * Represents a column in the data grid.
 */
class Column {

    /* *
    *
    *  Static Properties
    *
    * */

    /**
     * The minimum width of a column.
     * @internal
     */
    public static readonly MIN_COLUMN_WIDTH = 20;

    /**
     * The default options of the column.
     * @internal
     */
    public static readonly defaultOptions: IndividualColumnOptions = {};


    /* *
    *
    *  Properties
    *
    * */

    /**
     * The viewport (table) the column belongs to.
     */
    public readonly viewport: Table;

    /**
     * The width of the column in the viewport. The interpretation of the
     * value depends on the `columns.distribution` option:
     * - `full`: The width is a ratio of the viewport width.
     * - `fixed`: The width is a fixed number of pixels.
     */
    public width: number;

    /**
     * The cells of the column.
     */
    public cells: Cell[] = [];

    /**
     * The id of the column (`name` in the Data Table).
     */
    public id: string;

    /**
     * The data of the column.
     */
    public data?: DataTable.Column;

    /**
     * The type of the column data.
     */
    public type?: Column.Type;

    /**
     * The options that were declared by the user when creating the column.
     */
    public readonly userOptions: IndividualColumnOptions;

    /**
     * The options of the column. Contains the options that were declared by
     * the user and some of the default options.
     */
    public readonly options: IndividualColumnOptions;

    /**
     * The index of the column in the viewport.
     */
    public readonly index: number;

    /**
     * The wrapper for content of head.
     */
    public header?: HeaderCell;

    /**
     * Sorting column module.
     */
    public sorting?: ColumnSorting;

    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs a column in the data grid.
     *
     * @param viewport
     * The viewport (table) the column belongs to.
     *
     * @param id
     * The id of the column (`name` in the Data Table).
     *
     * @param index
     * The index of the column.
     */
    constructor(
        viewport: Table,
        id: string,
        index: number
    ) {
        this.userOptions = merge(
            viewport.dataGrid.options?.defaults?.columns ?? {},
            viewport.dataGrid.options?.columns?.[id] ?? {}
        );
        this.options = merge(Column.defaultOptions, this.userOptions);

        this.id = id;
        this.index = index;
        this.viewport = viewport;
        this.width = this.getInitialWidth();

        this.loadData();
    }


    /* *
    *
    *  Methods
    *
    * */

    /**
     * Loads the data of the column from the viewport's data table.
     */
    public loadData(): void {
        this.data = this.viewport.dataTable.getColumn(this.id, true);
    }

    /**
     * Updates the column with new options.
     *
     * @param options
     * The column options to update.
     */
    public async update(options: IndividualColumnOptions): Promise<void> {
        await this.viewport.dataGrid.update({
            columns: {
                [this.id]: options
            }
        });
    }

    /**
     * Registers a cell in the column.
     *
     * @param cell
     * The cell to register.
     */
    public registerCell(cell: Cell): void {
        cell.htmlElement.setAttribute('data-column-id', this.id);
        if (this.options.className) {
            cell.htmlElement.classList.add(this.options.className);
        }
        if (this.viewport.dataGrid.hoveredColumnId === this.id) {
            cell.htmlElement.classList.add(Globals.classNames.hoveredColumn);
        }
        this.cells.push(cell);
    }

    /**
     * Unregister a cell from the column.
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

    /**
     * Returns the width of the column in pixels.
     */
    public getWidth(): number {
        const vp = this.viewport;

        return vp.columnDistribution === 'full' ?
            vp.getWidthFromRatio(this.width) :
            this.width;
    }


    /**
     * Adds or removes the hovered CSS class to the column element
     * and its cells.
     *
     * @param hovered
     * Whether the column should be hovered.
     */
    public setHoveredState(hovered: boolean): void {
        this.header?.htmlElement?.classList[hovered ? 'add' : 'remove'](
            Globals.classNames.hoveredColumn
        );

        for (let i = 0, iEnd = this.cells.length; i < iEnd; ++i) {
            this.cells[i].htmlElement.classList[hovered ? 'add' : 'remove'](
                Globals.classNames.hoveredColumn
            );
        }
    }

    /**
     * Creates a mock element to measure the width of the column from the CSS.
     * The element is appended to the viewport container and then removed.
     * It should be called only once for each column.
     *
     * @returns The initial width of the column.
     */
    private getInitialWidth(): number {
        let result: number;
        const { viewport } = this;
        // Set the initial width of the column.
        const mock = makeHTMLElement('div', {
            className: Globals.classNames.columnElement
        }, viewport.dataGrid.container);

        mock.setAttribute('data-column-id', this.id);
        if (this.options.className) {
            mock.classList.add(this.options.className);
        }

        if (viewport.columnDistribution === 'full') {
            result = this.getInitialFullDistWidth(mock);
        } else {
            result = mock.offsetWidth || 100;
        }
        mock.remove();

        return result;
    }

    /**
     * The initial width of the column in the full distribution mode. The last
     * column in the viewport will have to fill the remaining space.
     *
     * @param mock
     * The mock element to measure the width.
     */
    private getInitialFullDistWidth(mock: HTMLElement): number {
        const vp = this.viewport;
        const columnsCount = vp.dataGrid.enabledColumns?.length ?? 0;

        if (this.index < columnsCount - 1) {
            return vp.getRatioFromWidth(mock.offsetWidth) || 1 / columnsCount;
        }

        let allPreviousWidths = 0;
        for (let i = 0, iEnd = columnsCount - 1; i < iEnd; i++) {
            allPreviousWidths += vp.columns[i].width;
        }

        const result = 1 - allPreviousWidths;

        if (result < 0) {
            // eslint-disable-next-line no-console
            console.warn(
                'The sum of the columns\' widths exceeds the ' +
                'viewport width. It may cause unexpected behavior in the ' +
                'full distribution mode. Check the CSS styles of the ' +
                'columns. Corrections may be needed.'
            );
        }

        return result;
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace Column {
    export type Type = 'number'|'date'|'string'|'boolean';
}


/* *
 *
 *  Default Export
 *
 * */

export default Column;
