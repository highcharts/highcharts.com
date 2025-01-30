/* *
 *
 *  Grid Accessibility class
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

import type Grid from '../Grid';
import type { ColumnSortingOrder } from '../Options';
import whcm from '../../../Accessibility/HighContrastMode.js';

import Globals from '../Globals.js';
import GridUtils from '../GridUtils.js';

const { makeHTMLElement } = GridUtils;


/**
 *  Representing the accessibility functionalities for the Data Grid.
 */
class Accessibility {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The Data Grid Table instance which the accessibility belong to.
     */
    public grid: Grid;

    /**
     * The HTML element of the accessibility.
     */
    private element: HTMLElement;

    /**
     * The HTML element of the announcer.
     */
    private announcerElement: HTMLElement;

    /**
     * The timeout for the announcer element removal.
     */
    private announcerTimeout?: number;


    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Construct the accessibility object.
     *
     * @param grid
     * The Grid Table instance which the accessibility controller belong to.
     */
    constructor(grid: Grid) {
        this.grid = grid;

        this.element = document.createElement('div');
        this.element.classList.add(Globals.getClassName('visuallyHidden'));
        this.grid.container?.prepend(this.element);

        this.announcerElement = document.createElement('p');
        this.announcerElement.setAttribute('aria-atomic', 'true');
        this.announcerElement.setAttribute('aria-hidden', 'false');
    }


    /* *
    *
    *  Methods
    *
    * */

    /**
     * Add the 'sortable' hint span element for the sortable column.
     *
     * @param element
     * The element to add the description to.
     */
    public addSortableColumnHint(element: HTMLElement): void {
        const sortableLang =
            this.grid.options?.lang?.accessibility?.sorting?.sortable;

        if (!sortableLang) {
            return;
        }

        makeHTMLElement('span', {
            className: Globals.getClassName('visuallyHidden'),
            innerText: ', ' + sortableLang
        }, element);
    }

    /**
     * Add the description to the header cell.
     *
     * @param thElement
     * The header cell element to add the description to.
     *
     * @param description
     * The description to be added.
     */
    public addHeaderCellDescription(
        thElement: HTMLElement,
        description: string | undefined
    ): void {
        if (description) {
            thElement.setAttribute('aria-description', description);
        }
    }

    /**
     * Announce the message to the screen reader.
     *
     * @param msg
     * The message to be announced.
     *
     * @param assertive
     * Whether the message should be assertive. Default is false.
     */
    public announce(msg: string, assertive = false): void {
        if (this.announcerTimeout) {
            clearTimeout(this.announcerTimeout);
        }

        this.announcerElement.remove();
        this.announcerElement.setAttribute(
            'aria-live', assertive ? 'assertive' : 'polite'
        );

        this.element.appendChild(this.announcerElement);
        this.announcerElement.textContent = msg;

        this.announcerTimeout = setTimeout((): void => {
            this.announcerElement.remove();
        }, 3000);
    }

    /**
     * Announce the message to the screen reader that the user sorted the
     * column.
     *
     * @param order
     * The order of the sorting.
     */
    public userSortedColumn(order: ColumnSortingOrder): void {
        const { options } = this.grid;
        const announcementsLang = options?.lang
            ?.accessibility?.sorting?.announcements;

        if (!options?.accessibility?.announcements?.sorting) {
            return;
        }

        let msg: string | undefined;

        switch (order) {
            case 'asc':
                msg = announcementsLang?.ascending;
                break;
            case 'desc':
                msg = announcementsLang?.descending;
                break;
            default:
                msg = announcementsLang?.none;
        }

        if (!msg) {
            return;
        }

        this.announce(msg, true);
    }

    /**
     * Set the aria sort state of the column header cell element.
     *
     * @param thElement
     * The header cell element to set the `aria-sort` state to.
     *
     * @param state
     * The sort state to be set for the column header cell.
     */
    public setColumnSortState(
        thElement: HTMLElement,
        state: Accessibility.AriaSortState
    ): void {
        thElement?.setAttribute('aria-sort', state);
    }

    /**
     * Adds high contrast CSS class, if the browser is in High Contrast mode.
     */
    public addHighContrast(): void {
        const highContrastMode =
            this.grid.options?.accessibility?.highContrastMode;

        if (
            highContrastMode !== false && (
                whcm.isHighContrastModeActive() ||
                highContrastMode === true
            )
        ) {
            this.grid.contentWrapper?.classList.add(
                'hcdg-highcontrast-theme'
            );
        }
    }

    /**
     * Set the row index attribute for the row element.
     *
     * @param el
     * The row element to set the index to.
     *
     * @param idx
     * The index of the row in the data table.
     */
    public setRowIndex(el: HTMLElement, idx: number): void {
        el.setAttribute('aria-rowindex', idx);
    }

    /**
     * Set a11y options for the Grid.
     */
    public setA11yOptions(): void {
        const grid = this.grid;
        const tableEl = grid.tableElement;

        if (!tableEl) {
            return;
        }

        tableEl.setAttribute(
            'aria-rowcount',
            grid.dataTable?.getRowCount() || 0
        );

        if (grid.captionElement) {
            tableEl.setAttribute(
                'aria-labelledby',
                grid.captionElement.id
            );
        }

        if (grid.descriptionElement) {
            tableEl.setAttribute(
                'aria-describedby',
                grid.descriptionElement.id
            );
        }

        this.addHighContrast();
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace Accessibility {
    /**
     * The possible states of the aria-sort attribute.
     */
    export type AriaSortState = 'ascending' | 'descending' | 'none';
}


/* *
 *
 *  Default Export
 *
 * */

export default Accessibility;
