/* *
 *
 *  Grid Cell Editing class.
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

import type Table from '../../Core/Table/Table';
import type TableCell from '../../Core/Table/Content/TableCell';
import type { GridEvent } from '../../Core/GridUtils';

import Defaults from '../../Core/Defaults.js';
import Globals from '../../Core/Globals.js';
import CellEditing from './CellEditing.js';

import GU from '../../Core/GridUtils.js';
import U from '../../../Core/Utilities.js';

const {
    makeHTMLElement
} = GU;

const {
    addEvent,
    merge,
    pushUnique
} = U;


/* *
 *
 *  Composition
 *
 * */

/**
 * @internal
 */
namespace CellEditingComposition {

    /**
     * Default options for the cell editing.
     */
    const defaultOptions = {
        accessibility: {
            announcements: {
                cellEditing: true
            }
        },
        lang: {
            accessibility: {
                cellEditing: {
                    editable: 'Editable.',
                    announcements: {
                        started: 'Entered cell editing mode.',
                        edited: 'Edited cell value.',
                        cancelled: 'Editing canceled.'
                    }
                }
            }
        }
    };


    /**
     * Extends the grid classes with cell editing functionality.
     *
     * @param TableClass
     * The class to extend.
     *
     * @param TableCellClass
     * The class to extend.
     */
    export function compose(
        TableClass: typeof Table,
        TableCellClass: typeof TableCell
    ): void {
        if (!pushUnique(Globals.composed, 'CellEditing')) {
            return;
        }

        merge(true, Defaults.defaultOptions, defaultOptions);

        addEvent(TableClass, 'beforeInit', initTable);
        addEvent(TableCellClass, 'keyDown', onCellKeyDown);
        addEvent(TableCellClass, 'dblClick', onCellDblClick);
        addEvent(TableCellClass, 'afterSetValue', addEditableCellA11yHint);

        addEvent(TableCellClass, 'startedEditing', function (): void {
            announceA11yUserEditedCell(this, 'started');
        });

        addEvent(
            TableCellClass,
            'stoppedEditing',
            function (e: AnyRecord): void {

                this.column.viewport.grid.options
                    ?.events?.cell?.afterEdit?.call(this);

                announceA11yUserEditedCell(
                    this,
                    e.submit ? 'edited' : 'cancelled'
                );
            }
        );
    }

    /**
     * Callback function called before table initialization.
     */
    function initTable(this: Table): void {
        this.cellEditing = new CellEditing(this);
    }

    /**
     * Callback function called when a key is pressed on a cell.
     *
     * @param e
     * The event object.
     */
    function onCellKeyDown(
        this: TableCell,
        e: GridEvent<TableCell, KeyboardEvent>
    ): void {
        if (
            e.originalEvent?.key !== 'Enter' ||
            !this.column.options.cells?.editable
        ) {
            return;
        }

        this.row.viewport.cellEditing?.startEditing(this);
    }

    /**
     * Callback function called when a cell is double clicked.
     */
    function onCellDblClick(this: TableCell): void {
        if (this.column.options.cells?.editable) {
            this.row.viewport.cellEditing?.startEditing(this);
        }
    }

    /**
     * Add the 'editable' hint span element for the editable cell.
     */
    function addEditableCellA11yHint(this: TableCell): void {
        const editableLang = this.row.viewport.grid.options
            ?.lang?.accessibility?.cellEditing?.editable;

        if (!editableLang) {
            return;
        }

        makeHTMLElement('span', {
            className: Globals.getClassName('visuallyHidden'),
            innerText: ', ' + editableLang
        }, this.htmlElement);
    }

    /**
     * Announce that the cell editing started.
     *
     * @param cell
     * The cell that is being edited.
     *
     * @param msgType
     * The type of the message.
     */
    function announceA11yUserEditedCell(
        cell: TableCell,
        msgType: 'started'|'edited'|'cancelled'
    ): void {
        const a11y = cell.row.viewport.grid.accessibility;
        if (!a11y) {
            return;
        }

        const { options } = a11y.grid;
        if (!options?.accessibility?.announcements?.cellEditing) {
            return;
        }

        const lang = options?.lang?.accessibility?.cellEditing?.announcements;
        const msg = lang?.[msgType];
        if (!msg) {
            return;
        }

        a11y.announce(msg);
    }
}

/* *
 *
 *  Declarations
 *
 * */

/**
 * Accessibility options for the Grid cell editing functionality.
 */
export interface CellEditingLangA11yOptions {
    /**
     * An additional hint (a visually hidden span) read by the voice over
     * after the cell value.
     *
     * @default 'Editable.'
     */
    editable?: string;

    /**
     * Accessibility lang options for the cell editing announcements.
     */
    announcements?: {

        /**
         * The message when the cell editing started.
         *
         * @default 'Entered cell editing mode.'
         */
        started?: string;

        /**
         * The message when the cell editing ended.
         *
         * @default 'Edited cell value.'
         */
        edited?: string;

        /**
         * The message when the cell editing was cancelled.
         *
         * @default 'Editing canceled.'
         */
        cancelled?: string;
    }
}

declare module '../../Core/Table/Table' {
    export default interface Table {
        cellEditing?: CellEditing;
    }
}

declare module '../GridEvents' {
    interface CellEvents {
        /**
         * Callback function to be called after editing of cell value.
         */
        afterEdit?: CellEventCallback;
    }
}

declare module '../../Core/Accessibility/A11yOptions' {
    interface A11yAnnouncementsOptions {
        /**
         * Enable accessibility announcements for the cell editing.
         *
         * @default true
         */
        cellEditing?: boolean;
    }

    interface LangAccessibilityOptions {
        /**
         * Language options for the accessibility descriptions in cell editing.
         */
        cellEditing?: CellEditingLangA11yOptions;
    }
}

/**
 * The possible types of the edit message.
 */
export type EditMsgType = 'started' | 'edited' | 'cancelled';


/* *
 *
 *  Default Export
 *
 * */

export default CellEditingComposition;
