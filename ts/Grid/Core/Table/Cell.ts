/* *
 *
 *  Grid Cell abstract class
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

import type DataTable from '../../../Data/DataTable';
import type TableRow from './Content/TableRow';

import Column from './Column';
import Row from './Row';
import Templating from '../../../Core/Templating.js';


/* *
 *
 *  Abstract Class of Cell
 *
 * */
abstract class Cell {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The HTML element of the cell.
     */
    public htmlElement: HTMLTableCellElement;

    /**
     * The column of the cell.
     */
    public column?: Column;

    /**
     * The row of the cell.
     */
    public row: Row;

    /**
     * The raw value of the cell.
     */
    public value: DataTable.CellType;

    /**
     * An additional, custom class name that can be changed dynamically.
     */
    private customClassName?: string;

    /**
     * Array of cell events to be removed when the cell is destroyed.
     */
    protected cellEvents: Array<[
        keyof HTMLElementEventMap,
        (e: Event) => void
    ]> = [];


    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs a cell in the data grid.
     *
     * @param row
     * The row of the cell.
     *
     * @param column
     * The column of the cell.
     */
    constructor(row: Row, column?: Column) {
        this.column = column;
        this.row = row;
        this.row.registerCell(this);

        this.htmlElement = this.init();
        this.htmlElement.setAttribute('tabindex', '-1');

        this.initEvents();
    }


    /* *
    *
    *  Methods
    *
    * */

    /**
     * Init element.
     * @internal
     */
    public init(): HTMLTableCellElement {
        return document.createElement('td', {});
    }

    /**
     * Initialize event listeners. Events added to the `cellEvents` array will
     * be registered now and unregistered when the cell is destroyed.
     */
    protected initEvents(): void {
        this.cellEvents.push(['blur', (): void => this.onBlur()]);
        this.cellEvents.push(['focus', (): void => this.onFocus()]);
        this.cellEvents.push(['click', (e): void => {
            this.onClick(e as MouseEvent);
        }]);
        this.cellEvents.push(['keydown', (e): void => {
            this.onKeyDown(e as KeyboardEvent);
        }]);

        this.cellEvents.forEach((pair): void => {
            this.htmlElement.addEventListener(pair[0], pair[1]);
        });
    }

    /**
     * Handles user click on the cell.
     *
     * @param e
     * Mouse event object.
     *
     * @internal
     */
    protected abstract onClick(e: MouseEvent): void;

    /**
     * Handles the focus event on the cell.
     */
    protected onFocus(): void {
        const vp = this.row.viewport;
        const focusAnchor = vp.rowsVirtualizer.focusAnchorCell?.htmlElement;

        focusAnchor?.setAttribute('tabindex', '-1');
    }

    /**
     * Handles the blur event on the cell.
     */
    protected onBlur(): void {
        const vp = this.row.viewport;
        const focusAnchor = vp.rowsVirtualizer.focusAnchorCell?.htmlElement;

        focusAnchor?.setAttribute('tabindex', '0');

        delete vp.focusCursor;
    }

    /**
     * Handles user keydown on the cell.
     *
     * @param e
     * Keyboard event object.
     */
    protected onKeyDown(e: KeyboardEvent): void {
        const { row, column } = this;
        if (!column) {
            return;
        }

        const vp = row.viewport;

        const changeFocusKeys: Record<typeof e.key, [number, number]> = {
            ArrowDown: [1, 0],
            ArrowUp: [-1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1]
        };

        const dir = changeFocusKeys[e.key];

        if (dir) {
            e.preventDefault();
            e.stopPropagation();

            const localRowIndex = (row as TableRow).index === void 0 ? -1 : (
                (row as TableRow).index - vp.rows[0].index
            );

            const nextVerticalDir = localRowIndex + dir[0];

            if (nextVerticalDir < 0 && vp.header) {
                vp.columns[column.index + dir[1]]?.header?.htmlElement.focus();
                return;
            }

            const nextRow = vp.rows[nextVerticalDir];


            if (nextRow) {
                nextRow.cells[column.index + dir[1]]?.htmlElement.focus();
            }
        }
    }

    /**
     * Renders the cell by appending the HTML element to the row.
     */
    public render(): void {
        this.row.htmlElement.appendChild(this.htmlElement);
    }

    /**
     * Reflows the cell dimensions.
     */
    public reflow(): void {
        const column = this.column;
        if (!column) {
            return;
        }

        const elementStyle = this.htmlElement.style;

        elementStyle.width = elementStyle.maxWidth = column.getWidth() + 'px';
    }

    /**
     * Returns the formatted string where the templating context is the cell.
     *
     * @param template
     * The template string.
     *
     * @return
     * The formatted string.
     */
    public format(template: string): string {
        return Templating.format(template, this, this.row.viewport.grid);
    }

    /**
     * Sets the custom class name of the cell based on the template.
     *
     * @param template
     * The template string.
     */
    protected setCustomClassName(template?: string): void {
        const element = this.htmlElement;

        if (this.customClassName) {
            element.classList.remove(...this.customClassName.split(/\s+/g));
        }

        if (!template) {
            delete this.customClassName;
            return;
        }

        const newClassName = this.format(template);
        if (!newClassName) {
            delete this.customClassName;
            return;
        }

        element.classList.add(...newClassName.split(/\s+/g));
        this.customClassName = newClassName;
    }

    /**
     * Destroys the cell.
     */
    public destroy(): void {
        this.cellEvents.forEach((pair): void => {
            this.htmlElement.removeEventListener(pair[0], pair[1]);
        });

        this.column?.unregisterCell(this);
        this.row.unregisterCell(this);
        this.htmlElement.remove();
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace Cell {

}


/* *
 *
 *  Default Export
 *
 * */

export default Cell;
