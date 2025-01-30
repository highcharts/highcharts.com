/* *
 *
 *  (c) 2020-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import Column from '../Core/Table/Column';
import TableCell from '../Core/Table/Content/TableCell';
import type HeaderCell from '../Core/Table/Header/HeaderCell';
import type { GridEvent } from '../Core/GridUtils';

import U from '../../Core/Utilities.js';
import Globals from '../../Core/Globals.js';

const {
    addEvent,
    pushUnique
} = U;


/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Options' {
    interface Options {
        /**
         * Events options triggered by the grid elements.
         */
        events?: GridEvents;
    }
}


/* *
 *
 *  Functions
 *
 * */

/**
 * Composition to add events to the TableCellClass methods.
 *
 * @param ColumnClass
 * The class to extend.
 *
 * @param HeaderCellClass
 * The class to extend.
 *
 * @param TableCellClass
 * The class to extend.
 *
 * @private
 */
function compose(
    ColumnClass: typeof Column,
    HeaderCellClass: typeof HeaderCell,
    TableCellClass: typeof TableCell
): void {

    if (!pushUnique(Globals.composed, 'GridEvents')) {
        return;
    }

    ([ // TableCell Events
        'mouseOver',
        'mouseOut',
        'dblClick',
        'click',
        'afterSetValue'
    ] as const).forEach((name): void => {
        addEvent(TableCellClass, name, (e: GridEvent<TableCell>): void => {
            const cell = e.target;
            cell.row.viewport.grid.options?.events?.cell?.[name]?.call(cell);
        });
    });

    ([ // Column Events
        'afterResize',
        'afterSorting'
    ] as const).forEach((name): void => {
        addEvent(ColumnClass, name, (e: GridEvent<Column>): void => {
            const column = e.target;
            column.viewport.grid.options?.events?.column?.[name]?.call(column);
        });
    });

    // HeaderCell Events
    addEvent(HeaderCellClass, 'click', (e: GridEvent<Column>): void => {
        const col = e.target;
        col.viewport.grid.options?.events?.header?.click?.call(col);
    });
}


/* *
 *
 *  Declarations
 *
 * */

/**
 * Callback function to be called when a cell event is triggered.
 */
export type CellEventCallback = (this: TableCell) => void;

/**
 * Callback function to be called when a column event is triggered.
 */
export type ColumnEventCallback = (this: Column) => void;

/**
 * Events related to the cells.
 */
export interface CellEvents {
    /**
     * Callback function to be called when the cell is clicked.
     */
    click?: CellEventCallback;

    /**
     * Callback function to be called when the cell is double clicked.
     */
    dblClick?: CellEventCallback;

    /**
     * Callback function to be called when the cell is hovered.
     */
    mouseOver?: CellEventCallback;

    /**
     * Callback function to be called when the cell is no longer hovered.
     */
    mouseOut?: CellEventCallback;

    /**
     * Callback function to be called after the cell value is set (on init or
     * after editing).
     */
    afterSetValue?: CellEventCallback;
}

/**
 * Event callbacks option group related to the column.
 */
export interface ColumnEvents {
    /**
     * Callback function to be called when the column is sorted for instance,
     * after clicking on header.
     */
    afterSorting?: ColumnEventCallback;

    /**
     * Callback function to be called when the column is resized.
     */
    afterResize?: ColumnEventCallback;
}

export interface HeaderEvents {
    /**
     * Callback function to be called when the header is clicked.
     */
    click?: ColumnEventCallback;
}

/**
 * Events options.
 */
export interface GridEvents {
    /**
     * Events related to the cells.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-events/ | Datagrid events}
     */
    cell?: CellEvents;

    /**
     * Events related to the column.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-events/ | Datagrid events}
     */
    column?: ColumnEvents

    /**
     * Events related to the header.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-events/ | Datagrid events}
     */
    header?: HeaderEvents
}


/* *
 *
 *  Default Export
 *
 * */

export default { compose };
