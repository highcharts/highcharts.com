/* *
 *
 *  DataGrid Columns Resizer class.
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

import Table from '../Table.js';
import Column from '../Column.js';
import Globals from '../../Globals.js';
import DGUtils from '../../Utils.js';
import Cell from '../Cell.js';
const { makeHTMLElement } = DGUtils;


/* *
 *
 *  Class
 *
 * */

/**
 * The class that handles the resizing of columns in the data grid.
 */
class ColumnsResizer {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The viewport of the data grid.
     */
    private viewport: Table;

    /**
     * The column being dragged.
     */
    private draggedColumn?: Column;

    /**
     * The start X position of the drag.
     */
    private dragStartX?: number;

    /**
     * The element when dragging.
     */
    private draggedResizeHandle?: HTMLElement;

    /**
     * The width of the dragged column when dragging started.
     */
    private columnStartWidth?: number;

    /**
     * The width of the next column when dragging started.
     */
    private nextColumnStartWidth?: number;

    /**
     * The handles and their mouse down event listeners.
     */
    private handles: Array<[HTMLElement, (e: MouseEvent) => void]> = [];

    /**
     * Determinates that columns are resized.
     */
    public resizedColumns?: boolean;

    /* *
     *
     *  Constructor
     *
     * */

    constructor(viewport: Table) {
        this.viewport = viewport;

        document.addEventListener('mousemove', this.onDocumentMouseMove);
        document.addEventListener('mouseup', this.onDocumentMouseUp);
    }


    /* *
     *
     *  Functions
     *
     * */

    /**
     * Resizes the columns in the full distribution mode.
     *
     * @param diff
     * The X position difference in pixels.
     */
    private fullDistributionResize(diff: number): void {
        const vp = this.viewport;

        const column = this.draggedColumn;
        if (!column) {
            return;
        }

        const nextColumn = vp.columns[column.index + 1];
        if (!nextColumn) {
            return;
        }

        const leftColW = this.columnStartWidth ?? 0;
        const rightColW = this.nextColumnStartWidth ?? 0;
        const MIN_WIDTH = Column.MIN_COLUMN_WIDTH;

        let newLeftW = leftColW + diff;
        let newRightW = rightColW - diff;

        if (newLeftW < MIN_WIDTH) {
            newLeftW = MIN_WIDTH;
            newRightW = leftColW + rightColW - MIN_WIDTH;
        }

        if (newRightW < MIN_WIDTH) {
            newRightW = MIN_WIDTH;
            newLeftW = leftColW + rightColW - MIN_WIDTH;
        }

        column.width = vp.getRatioFromWidth(newLeftW);
        nextColumn.width = vp.getRatioFromWidth(newRightW);
    }

    /**
     * Render the drag handle for resizing columns.
     *
     * @param column
     * The reference to rendered column
     *
     * @param cell
     * The reference to rendered cell, where hadles should be added
     */
    public renderColumnDragHandles(column: Column, cell: Cell): void {
        const vp = column.viewport;

        if (
            vp.columnsResizer && (
                vp.columnDistribution !== 'full' ||
                (
                    vp.dataGrid.enabledColumns &&
                    column.index < vp.dataGrid.enabledColumns.length - 1
                )
            )
        ) {
            const handle = makeHTMLElement('div', {
                className: Globals.classNames.resizerHandles
            }, cell.htmlElement);

            handle.setAttribute('aria-hidden', true);

            vp.columnsResizer?.addHandleListeners(
                handle, column
            );
        }
    }

    /**
     * Resizes the columns in the fixed distribution mode.
     *
     * @param diff
     * The X position difference in pixels.
     */
    private fixedDistributionResize(diff: number): void {
        const column = this.draggedColumn;
        if (!column) {
            return;
        }

        const colW = this.columnStartWidth ?? 0;
        const MIN_WIDTH = Column.MIN_COLUMN_WIDTH;

        let newW = colW + diff;
        if (newW < MIN_WIDTH) {
            newW = MIN_WIDTH;
        }

        column.width = newW;
    }

    /**
     * Handles the mouse move event on the document.
     *
     * @param e
     * The mouse event.
     */
    private onDocumentMouseMove = (e: MouseEvent): void => {
        if (!this.draggedResizeHandle || !this.draggedColumn) {
            return;
        }

        const diff = e.pageX - (this.dragStartX || 0);
        const vp = this.viewport;

        if (vp.columnDistribution === 'full') {
            this.fullDistributionResize(diff);
        } else {
            this.fixedDistributionResize(diff);
        }

        vp.reflow();

        if (vp.dataGrid.options?.rendering?.rows?.virtualization) {
            vp.rowsVirtualizer.adjustRowHeights();
        }

        vp.dataGrid.options?.events?.column?.afterResize?.call(
            this.draggedColumn
        );
    };

    /**
     * Handles the mouse up event on the document.
     */
    private onDocumentMouseUp = (): void => {
        this.draggedColumn?.header?.htmlElement?.classList.remove(
            Globals.classNames.resizedColumn
        );

        this.dragStartX = void 0;
        this.draggedColumn = void 0;
        this.draggedResizeHandle = void 0;
        this.columnStartWidth = void 0;
        this.nextColumnStartWidth = void 0;
    };

    /**
     * Adds event listeners to the handle.
     *
     * @param handle
     * The handle element.
     *
     * @param column
     * The column the handle belongs to.
     */
    public addHandleListeners(
        handle: HTMLElement,
        column: Column
    ): void {
        const onHandleMouseDown = (e: MouseEvent): void => {
            const vp = column.viewport;

            this.resizedColumns = true;

            if (!vp.dataGrid.options?.rendering?.rows?.virtualization) {
                vp.dataGrid.contentWrapper?.classList.add(
                    Globals.classNames.resizerWrapper
                );
                // Apply widths before resizing
                this.viewport.reflow();
            }

            this.dragStartX = e.pageX;
            this.draggedColumn = column;
            this.draggedResizeHandle = handle;
            this.columnStartWidth = column.getWidth();
            this.nextColumnStartWidth =
                this.viewport.columns[column.index + 1]?.getWidth();

            column.header?.htmlElement.classList.add(
                Globals.classNames.resizedColumn
            );
        };

        this.handles.push([handle, onHandleMouseDown]);
        handle.addEventListener('mousedown', onHandleMouseDown);
    }

    /**
     * Removes all added event listeners from the document and handles. This
     * should be called on the destroy of the data grid.
     */
    public removeEventListeners(): void {
        document.removeEventListener('mousemove', this.onDocumentMouseMove);
        document.removeEventListener('mouseup', this.onDocumentMouseUp);

        for (let i = 0, iEnd = this.handles.length; i < iEnd; i++) {
            const [handle, listener] = this.handles[i];
            handle.removeEventListener('mousedown', listener);
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ColumnsResizer;
