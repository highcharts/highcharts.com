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

import TableCell from '../../Core/Table/Content/TableCell.js';
import GridUtils from '../../Core/Table/../GridUtils.js';
import Table from '../../Core/Table/Table.js';
import Globals from '../../Core/Globals.js';
import U from '../../../Core/Utilities.js';

const { makeHTMLElement } = GridUtils;
const { fireEvent } = U;


/* *
 *
 *  Class
 *
 * */

/**
 * The class that handles the manual editing of cells in the data grid.
 */
class CellEditing {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The viewport the edited cells are part of.
     */
    public readonly viewport: Table;

    /**
     * The cell being currently edited.
     */
    public editedCell?: TableCell;

    /**
     * Input element for the cell.
     */
    private inputElement?: HTMLInputElement;


    /* *
     *
     *  Constructor
     *
     * */

    constructor(viewport: Table) {
        this.viewport = viewport;
    }


    /* *
     *
     *  Methods
     *
     * */

    /**
     * Turns the cell into an editable input field.
     *
     * @param cell
     * The cell that is to be edited.
     */
    public startEditing(cell: TableCell): void {
        if (this.editedCell === cell) {
            return;
        }

        if (this.editedCell) {
            this.stopEditing();
        }

        this.editedCell = cell;
        const cellElement = cell.htmlElement;

        cellElement.innerHTML = '';
        cellElement.classList.add(Globals.getClassName('editedCell'));

        this.renderInput();
        fireEvent(cell, 'startedEditing');
    }

    /**
     * Stops the editing of the cell.
     *
     * @param submit
     * Whether to save the value of the input to the cell. Defaults to true.
     */
    public stopEditing(submit = true): void {
        const cell = this.editedCell;
        const input = this.inputElement;

        if (!cell || !input) {
            return;
        }

        let newValue: string | number = input.value;

        this.destroyInput();
        cell.htmlElement.classList.remove(
            Globals.getClassName('editedCell')
        );

        cell.htmlElement.focus();

        // Convert to number if possible
        if (!isNaN(+newValue)) {
            newValue = +newValue;
        }

        void cell.setValue(
            submit ? newValue : cell.value,
            submit && cell.value !== newValue
        );

        fireEvent(cell, 'stoppedEditing', { submit });

        delete this.editedCell;
    }

    /**
     * Handles the blur event on the input field.
     */
    private onInputBlur = (): void => {
        this.stopEditing();
    };

    /**
     * Handles the keydown event on the input field. Cancels editing on escape
     * and saves the value on enter.
     *
     * @param e
     * The keyboard event.
     */
    private onInputKeyDown = (e: KeyboardEvent): void => {
        const { keyCode } = e;

        // Enter / Escape
        if (keyCode === 13 || keyCode === 27) {
            // Cancel editing on escape
            this.stopEditing(keyCode === 13);
        }
    };

    /**
     * Renders the input field for the cell, focuses it and sets up event
     * listeners.
     */
    private renderInput(): void {
        const cell = this.editedCell;
        if (!cell) {
            return;
        }

        const cellEl = cell.htmlElement;
        const input = this.inputElement = makeHTMLElement('input', {}, cellEl);

        input.value = '' + cell.value;
        input.focus();

        input.addEventListener('blur', this.onInputBlur);
        input.addEventListener('keydown', this.onInputKeyDown);
    }

    /**
     * Removes event listeners and the input element.
     */
    private destroyInput(): void {
        const input = this.inputElement;
        if (!input) {
            return;
        }

        input.removeEventListener('keydown', this.onInputKeyDown);
        input.removeEventListener('blur', this.onInputBlur);

        input.remove();
        delete this.inputElement;
    }
}


/* *
 *
 *  Default Export
 *
 * */

export default CellEditing;
