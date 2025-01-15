/* *
 *
 *  DataGrid cell content validator
 *
 *  (c) 2009-2024 Highsoft AS
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

import type Table from '../Table';
import type TableCell from '../Content/TableCell';
import type { ColumnDataType } from '../../Options';

import Globals from '../../Globals.js';
import DGUtils from '../../Utils.js';
import Cell from '../Cell.js';

const { makeDiv } = DGUtils;

/* *
 *
 *  Class
 *
 * */

/**
 * Class for validating cell content.
 */
class Validator {


    /* *
     *
     *  Properties
     *
     * */

    public viewport: Table;

    /**
     * The cell that has an error.
     */
    public errorCell?: Cell;

    /**
     * HTML Element for the errors.
     */
    public errorsContainer: HTMLElement;


    /* *
     *
     *  Constructor
     *
     * */

    constructor(viewport: Table) {
        this.viewport = viewport;
        this.errorsContainer = makeDiv(Globals.classNames.errorsContainer);
        this.viewport.dataGrid.contentWrapper?.appendChild(
            this.errorsContainer
        );
    }


    /* *
     *
     *  Methods
     *
     * */

    /**
     * Validates the cell content.
     *
     * @param cell
     * Edited cell.
     *
     * @param value
     * Value to validate.
     *
     * @param errors
     * An output array for error messages.
     *
     * @returns
     * Returns true if the value is valid, false otherwise.
     */
    public validate(
        cell: TableCell,
        value: string,
        errors: string[] = []
    ): boolean {
        const { validationRules, dataType } = cell.column.options;
        const rules = Array.from(validationRules || []);

        if (dataType) {
            // TODO: Remove duplicates in rules array
            rules.push(...Validator.predefinedRules[dataType]);
        }

        for (const rule of rules) {
            let ruleDef: Validator.RuleDefinition;

            if (typeof rule === 'string') {
                ruleDef = Validator.rulesRegistry[rule];
            } else {
                ruleDef = rule;
            }

            if (!ruleDef.validate.call(cell, value)) {
                errors.push(ruleDef.errorMessage);
            }
        }

        return !errors.length;
    }

    /**
     * Set content and adjust the position.
     *
     * @param cell
     * Cell that is currently edited and is not valid.
     *
     * @param errors
     * An array of error messages.
     *
     */
    public initErrorBox(cell: TableCell, errors: string[]): void {
        this.errorCell = cell;

        // Set error container position
        this.setPosition();
        // Set width and content
        this.errorsContainer.innerHTML = errors.join('<br />');

        this.show();
    }

    /**
     * Highlight the non-valid cell and display error in the box.
     */
    public show(): void {
        this.errorCell?.htmlElement.classList.add(
            Globals.classNames.editedCellError
        );
        this.errorsContainer.style.display = 'block';
    }

    /**
     * Hide the error and unset highlight on cell.
     */
    public hide(): void {
        this.errorsContainer.style.display = 'none';
        this.errorCell?.htmlElement.classList.remove(
            Globals.classNames.editedCellError
        );
    }

    /**
     * Set the position of the error box.
     */
    public setPosition(): void {
        const cellPosition =
            this.errorCell?.htmlElement.getBoundingClientRect();

        if (!cellPosition) {
            return;
        }

        this.errorsContainer.style.top =
            (cellPosition.top + cellPosition.height) + 'px';
        this.errorsContainer.style.left = cellPosition.left + 'px';
        this.errorsContainer.style.width = cellPosition.width + 'px';
    }

    /**
     * Destroy validator.
     */
    public destroy(): void {
        this.errorCell = void 0;
        this.errorsContainer.remove();
    }
}

/* *
 *
 *  Namespace
 *
 * */

/**
 * Namespace for Validation functionality.
 */
namespace Validator {


    /* *
     *
     *  Declarations
     *
     * */

    export type ValidateFunction = (this: TableCell, value: string) => boolean;

    export interface RuleDefinition {
        validate: ValidateFunction;
        errorMessage: string;
    }

    export interface RulesRegistryType {
        notEmpty: RuleDefinition;
        number: RuleDefinition;
        bool: RuleDefinition;
    }

    export type RuleKey = keyof RulesRegistryType;


    /* *
     *
     *  Variables
     *
     * */

    export const rulesRegistry: RulesRegistryType = {
        notEmpty: {
            validate: (value: string): boolean => !!value,
            errorMessage: 'Value cannot be empty.'
        },
        number: {
            validate: (value: string): boolean => !isNaN(Number(value)),
            errorMessage: 'Value has to be a number.'
        },
        bool: {
            validate: (value: string): boolean => (
                value === 'true' || value === 'false' ||
                Number(value) === 1 || Number(value) === 0
            ),
            errorMessage: 'Value has to be a boolean.'
        }
    };

    export const predefinedRules: Record<ColumnDataType, RuleKey[]> = {
        number: ['number'],
        bool: ['bool'],
        string: [],
        date: ['number']
    };
}


/* *
 *
 *  Default Export
 *
 * */

export default Validator;
