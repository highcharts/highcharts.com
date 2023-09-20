/* *
 *
 *  Data Grid class
 *
 *  (c) 2020-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Øystein Moseng
 *  - Ken-Håvard Lieng
 *  - Sebastian Bochan
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type DataEvent from '../Data/DataEvent';
import type DataGridOptions from './DataGridOptions';
import type JSON from '../Core/JSON';

import DataTable from '../Data/DataTable.js';
import DataGridUtils from './DataGridUtils.js';
const {
    dataTableCellToString,
    emptyHTMLElement,
    makeDiv,
    addEvent,
    clamp,
    defined,
    fireEvent,
    isNumber,
    merge,
    pick
} = DataGridUtils;
import Globals from './Globals.js';
import Templating from './Templating.js';
const { format } = Templating;
import DataGridDefaults from './DataGridDefaults.js';
import H from '../Core/Globals.js';
const {
    doc
} = H;

/* *
 *
 *  Class
 *
 * */

/**
 * Creates a scrollable grid structure with editable data cells.
 */
class DataGrid {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options for all DataGrid instances.
     */
    public static readonly defaultOptions = DataGridDefaults;

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Container to create the grid structure into.
     */
    public container: HTMLElement;

    /**
     * Options used to create the grid structure.
     */
    public options: Required<DataGridOptions>;

    /**
     * Table used to create the grid structure.
     */
    public dataTable: DataTable;

    /**
     * The last hovered row.
     * @internal
     */
    public hoveredRow?: HTMLElement;

    /**
     * The rendered grid rows.
     * @internal
     */
    public rowElements: Array<HTMLElement>;

    /**
     * The observer object that calls the callback when the container is
     * resized.
     * @internal
     */
    public containerResizeObserver: ResizeObserver;

    /**
     * The rendered grid.
     * @internal
     */
    private gridContainer: HTMLElement;

    /**
     * The outer container inside the grid, which defines the visible view.
     * @internal
     */
    private outerContainer: HTMLElement;

    /**
     * The oversized scroll container to provide a scrollbar.
     * @internal
     */
    private scrollContainer: HTMLElement;

    /**
     * The inner container with columns, rows, and cells.
     * @internal
     */
    private innerContainer: HTMLElement;

    /**
     * The container with the optional header above the grid.
     * @internal
     */
    private headerContainer?: HTMLElement;

    /**
     * The input element of a cell after mouse focus.
     * @internal
     */
    public cellInputEl?: HTMLInputElement;

    /**
     * The container for the column headers.
     * @internal
     */
    private columnHeadersContainer?: HTMLElement;

    /**
     * The column names in a sorted array as rendered (or changed).
     * @internal
     */
    private columnNames: Array<string> = [];

    /**
     * The dragging placeholder.
     * @internal
     */
    private columnDragHandlesContainer?: HTMLElement;

    /**
     * The dragging indicator.
     * @internal
     */
    private columnResizeCrosshair?: HTMLElement;

    /**
     * The element when dragging.
     * @internal
     */
    private draggedResizeHandle: null | HTMLElement;

    /**
     * The index of the dragged column.
     * @internal
     */
    private draggedColumnRightIx: null | number;

    /**
     * The X position in pixels when starting to drag a column.
     * @internal
     */
    private dragResizeStart?: number;

    /**
     * The amount of rows before align end of scrolling.
     * @internal
     */
    private prevTop = -1;

    /**
     * The amount of rows to align for end of scrolling.
     * @internal
     */
    private scrollEndRowCount = 0;

    /**
     * Contains the top align offset, when reaching the end of scrolling.
     * @internal
     */
    private scrollEndTop = 0;

    /**
     * Flag to indicate the end of scrolling. Used to align the last cell with
     * the container bottom.
     * @internal
     */
    private bottom = false;

    /**
     * An array of the min column widths for which the text in headers is not
     * overflown.
     * @internal
     */
    private overflowHeaderWidths: Array<number | null> = [];


    /* *
     *
     *  Functions
     *
     * */

    /**
     * Creates an instance of DataGrid.
     *
     * @param container
     * Element or element ID to create the grid structure into.
     *
     * @param options
     * Options to create the grid structure.
     */
    constructor(
        container: (string | HTMLElement),
        options: Globals.DeepPartial<DataGridOptions>
    ) {
        // Initialize containers
        if (typeof container === 'string') {
            const existingContainer = doc.getElementById(container);
            if (existingContainer) {
                this.container = existingContainer;
            } else {
                this.container =
                    makeDiv(Globals.classNames.gridContainer, container);
            }
        } else {
            this.container = container;
        }
        this.gridContainer = makeDiv(Globals.classNames.gridContainer);
        this.outerContainer = makeDiv(Globals.classNames.outerContainer);
        this.scrollContainer = makeDiv(Globals.classNames.scrollContainer);
        this.innerContainer = makeDiv(Globals.classNames.innerContainer);
        this.outerContainer.appendChild(this.scrollContainer);
        this.gridContainer.appendChild(this.outerContainer);
        this.container.appendChild(this.gridContainer);

        // Init options
        this.options = merge(DataGrid.defaultOptions, options);

        this.gridContainer.style.height = this.getDataGridSize() + 'px';

        // Init data table
        this.dataTable = this.initDataTable();

        this.rowElements = [];
        this.draggedResizeHandle = null;
        this.draggedColumnRightIx = null;
        this.render();

        (this.containerResizeObserver = new ResizeObserver((): void => {
            this.updateGridElements();
        })).observe(this.container);
    }

    /**
     * Update the data grid with new options.
     *
     * @param options
     * An object with new options.
     */
    public update(options: Globals.DeepPartial<DataGridOptions>): void {
        this.options = merge(this.options, options);
        if (this.options.dataTable !== this.dataTable) {
            this.dataTable = this.initDataTable();
        }

        this.scrollContainer.removeChild(this.innerContainer);
        this.render();
    }


    /**
     * Resize a column.
     *
     * @internal
     *
     * @param width
     *        New column width.
     *
     * @param columnNameOrIndex
     *        Name or index of the column to resize, omit to resize all
     *        columns.
     *
     * @emits #afterResizeColumn
     */
    public resizeColumn(
        width: number,
        columnNameOrIndex?: (string | number)
    ): void {
        const headers = this.columnHeadersContainer;
        const index = typeof columnNameOrIndex === 'string' ?
            this.columnNames.indexOf(columnNameOrIndex) :
            columnNameOrIndex;
        const flex = `${width}`;

        if (isNumber(index)) {
            if (index !== -1) {
                if (headers) {
                    const header = headers.children[index] as HTMLElement;
                    if (header) {
                        header.style.flex = flex;
                    }
                }
                for (let i = 0; i < this.rowElements.length; i++) {
                    const cellElement =
                        this.rowElements[i].children[index] as HTMLElement;
                    if (cellElement) {
                        cellElement.style.flex = flex;
                    }
                }
            }
        } else {
            if (headers) {
                for (let i = 0; i < headers.children.length; i++) {
                    (headers.children[i] as HTMLElement).style.flex = flex;
                }
            }
            for (let i = 0; i < this.rowElements.length; i++) {
                const row = this.rowElements[i];
                for (let i = 0; i < row.children.length; i++) {
                    (row.children[i] as HTMLElement).style.flex = flex;
                }
            }
        }

        this.renderColumnDragHandles();

        this.emit<DataGrid.Event>({
            type: 'afterResizeColumn',
            width,
            index,
            name: isNumber(index) ? this.columnNames[index] : void 0
        });
    }


    /**
     * Emits an event on this data grid to all registered callbacks of the
     * given event.
     *
     * @internal
     *
     * @param e
     * Event object with event information.
     */
    public emit<E extends DataEvent>(e: E): void {
        fireEvent(this, e.type, e);
    }

    /**
     * Add class to given element to toggle highlight.
     *
     * @internal
     *
     * @param row
     * Row to highlight.
     */
    public toggleRowHighlight(row?: HTMLElement): void {
        if (this.hoveredRow && this.hoveredRow.classList.contains('hovered')) {
            this.hoveredRow.classList.remove('hovered');
        }
        row && (row.classList.contains('hovered') ?
            row.classList.remove('hovered') : row.classList.add('hovered'));
    }

    /**
     * Registers a callback for a specific event.
     *
     * @internal
     *
     * @param type
     * Event type as a string.
     *
     * @param callback
     * Function to register for an event callback.
     *
     * @return
     * Function to unregister callback from the event.
     */
    public on<E extends DataEvent>(
        type: E['type'],
        callback: DataEvent.Callback<this, E>
    ): Function {
        return addEvent(this, type, callback);
    }

    /**
     * Scroll to a given row.
     *
     * @internal
     *
     * @param row
     * Row number
     */
    public scrollToRow(row: number): void {
        this.outerContainer.scrollTop = row * this.options.cellHeight;
    }

    // ---------------- Private methods

    /**
     * Check which columns should be displayed based on the individual
     * column `show` option.
     * @internal
     */
    private getColumnsToDisplay(): Array<string> {
        const columnsOptions = this.options.columns,
            tableColumns = this.dataTable.modified.getColumnNames(),
            filteredColumns = [];

        for (let i = 0; i < tableColumns.length; i++) {
            const columnName = tableColumns[i];
            const column = columnsOptions[columnName];
            if (column && defined(column.show)) {
                if (columnsOptions[columnName].show) {
                    filteredColumns.push(columnName);
                }
            } else {
                filteredColumns.push(columnName);
            }
        }
        return filteredColumns;
    }

    /**
     * Determine whether a column is editable or not.
     *
     * @internal
     *
     * @param columnName
     * Name of the column to test.
     *
     * @return
     * Returns true when the column is editable, or false.
     */
    private isColumnEditable(columnName: string): boolean {
        const columnOptions = this.options.columns[columnName] || {};
        return pick(
            columnOptions.editable,
            this.options.editable
        );
    }


    /**
     * Get a reference to the underlying DataTable from options, or create one
     * if needed.
     *
     * @internal
     *
     * @return
     * DataTable for the DataGrid instance.
     */
    private initDataTable(): DataTable {
        if (this.options.dataTable) {
            return this.options.dataTable;
        }
        return new DataTable();
    }


    /**
     * Render the data grid. To be called on first render, as well as when
     * options change, or the underlying data changes.
     * @internal
     */
    private render(): void {
        const { options } = this;
        this.prevTop = -1;
        this.bottom = false;

        emptyHTMLElement(this.innerContainer);

        if (options.columnHeaders.enabled) {
            this.columnNames = this.getColumnsToDisplay();
            this.renderColumnHeaders();
        } else {
            this.outerContainer.style.top = '0';
        }

        this.renderInitialRows();
        this.addEvents();
        this.updateScrollingLength();
        this.updateVisibleCells();

        if (options.columnHeaders.enabled && options.resizableColumns) {
            this.renderColumnDragHandles();
        }

        this.updateGridElements();
    }


    /**
     * Add internal event listeners to the grid.
     * @internal
     */
    private addEvents(): void {
        this.outerContainer.addEventListener('scroll', (e): void => {
            this.onScroll(e);
        });
        document.addEventListener('click', (e): void => {
            this.onDocumentClick(e);
        });
        this.container.addEventListener('mouseover', (e): void => {
            this.handleMouseOver(e);
        });
    }


    /**
     * Changes the content of the rendered cells. This is used to simulate
     * scrolling.
     *
     * @internal
     *
     * @param force
     * Whether to force the update regardless of whether the position of the
     * first row has not been changed.
     */
    private updateVisibleCells(force: boolean = false): void {
        let scrollTop = this.outerContainer.scrollTop;
        if (H.isSafari) {
            scrollTop = clamp(
                scrollTop,
                0,
                (
                    this.outerContainer.scrollHeight -
                    this.outerContainer.clientHeight
                )
            );
        }

        let i = Math.floor(scrollTop / this.options.cellHeight);
        if (i === this.prevTop && !force) {
            return;
        }
        this.prevTop = i;

        const columnsInPresentationOrder = this.columnNames;
        const rowCount = this.dataTable.modified.getRowCount();

        for (let j = 0; j < this.rowElements.length && i < rowCount; j++, i++) {
            const rowElement = this.rowElements[j];
            rowElement.dataset.rowIndex = String(i);

            const cellElements = rowElement.childNodes;


            for (
                let k = 0, kEnd = columnsInPresentationOrder.length;
                k < kEnd;
                k++
            ) {
                const cell = cellElements[k] as HTMLElement,
                    column = columnsInPresentationOrder[k],
                    value = this.dataTable.modified
                        .getCell(columnsInPresentationOrder[k], i);

                cell.textContent = this.formatCell(value, column);

                // TODO: consider adding these dynamically to the input element
                cell.dataset.originalData = '' + value;
                cell.dataset.columnName = columnsInPresentationOrder[k];
                // TODO: get this from the store if set?
                cell.dataset.dataType = typeof value;

                if (k === 0) { // First column, that is x
                    rowElement.dataset.rowXIndex =
                        String(isNumber(value) ? value : i);
                }
            }
        }

        // Scroll innerContainer to align the bottom of the last row with the
        // bottom of the grid when scrolled to the end
        if (this.prevTop + this.scrollEndRowCount === rowCount) {
            if (!this.bottom && this.scrollEndTop) {
                this.bottom = true;
                this.innerContainer.scrollTop = this.scrollEndTop;
            }
        } else if (this.bottom) {
            this.bottom = false;
            this.innerContainer.scrollTop = 0;
        }
    }


    /**
     * Handle user scrolling the grid
     *
     * @internal
     *
     * @param e
     * Related scroll event.
     */
    private onScroll(e: Event): void {
        e.preventDefault();
        window.requestAnimationFrame(this.updateVisibleCells.bind(this, false));
    }


    /**
     * Handle the user starting interaction with a cell.
     *
     * @internal
     *
     * @param cellEl
     * The clicked cell.
     *
     * @param columnName
     * The column the clicked cell belongs to.
     */
    private onCellClick(cellEl: HTMLElement, columnName: string): void {
        if (this.isColumnEditable(columnName)) {
            let input = cellEl.querySelector('input');
            const cellValue = cellEl.getAttribute('data-original-data');

            if (!input) {
                this.removeCellInputElement();

                // Replace cell contents with an input element
                const inputHeight = cellEl.clientHeight;
                cellEl.textContent = '';
                input = this.cellInputEl = document.createElement('input');
                input.style.height = inputHeight + 'px';
                input.className = Globals.classNames.cellInput;
                cellEl.appendChild(input);
                input.focus();
                input.value = cellValue || '';
            }

            // Emit for use in extensions
            this.emit({ type: 'cellClick', input });
        }
    }

    /**
     * Handle the user clicking somewhere outside the grid.
     *
     * @internal
     *
     * @param e
     * Related mouse event.
     */
    private onDocumentClick(e: MouseEvent): void {
        if (this.cellInputEl && e.target) {
            const cellEl = this.cellInputEl.parentNode;
            const isClickInInput = cellEl && cellEl.contains(e.target as Node);
            if (!isClickInInput) {
                this.removeCellInputElement();
            }
        }
    }


    /**
     * Handle hovering over rows- highlight proper row if needed.
     *
     * @internal
     *
     * @param e
     * Related mouse event.
     */
    private handleMouseOver(e: MouseEvent): void {
        const target = e.target as HTMLElement;

        if (target && target.classList.contains(Globals.classNames.cell)) {
            const row = target.parentElement as HTMLElement;
            this.toggleRowHighlight(row);
            this.hoveredRow = row;
            fireEvent(this.container, 'dataGridHover', { row });
        } else if (this.hoveredRow) {
            this.toggleRowHighlight();
            this.hoveredRow = void 0;
        }
    }


    /**
     * Remove the <input> overlay and update the cell value
     * @internal
     */
    private removeCellInputElement(): void {
        const cellInputEl = this.cellInputEl;
        if (cellInputEl) {
            const parentNode = cellInputEl.parentNode;

            // TODO: This needs to modify DataTable. The change in DataTable
            // should cause a re-render?
            if (parentNode) {
                const cellValueType = parentNode.getAttribute('data-data-type'),
                    columnName = parentNode.getAttribute('data-column-name');
                let cellValue: string | number = cellInputEl.value;

                if (cellValueType === 'number') {
                    cellValue = parseFloat(cellValue);
                }

                parentNode.textContent =
                    this.formatCell(cellValue, columnName || '');
            }
            cellInputEl.remove();
            delete this.cellInputEl;
        }
    }

    /**
     * Updates the scroll container to reflect the data size.
     * @internal
     */
    private updateScrollingLength(): void {
        const columnsInPresentationOrder = this.columnNames;
        let i = this.dataTable.modified.getRowCount() - 1;
        let height = 0;
        const top = i - this.getNumRowsToDraw();
        const outerHeight = this.outerContainer.clientHeight;

        // Explicit height is needed for overflow: hidden to work, to make sure
        // innerContainer is not scrollable by user input
        this.innerContainer.style.height = outerHeight + 'px';

        // Calculate how many of the bottom rows is needed to potentially
        // overflow innerContainer and use it to add extra rows to scrollHeight
        // to ensure it is possible to scroll to the last row when rows have
        // variable heights
        for (let j = 0; j < this.rowElements.length; j++) {
            const cellElements = this.rowElements[j].childNodes;
            for (let k = 0; k < columnsInPresentationOrder.length; k++) {
                cellElements[k].textContent = dataTableCellToString(
                    this.dataTable.modified
                        .getCell(columnsInPresentationOrder[k], i - j)
                );
            }
        }

        this.scrollContainer.appendChild(this.innerContainer);

        for (let j = 0; i > top; i--, j++) {
            height += this.rowElements[j].offsetHeight;
            if (height > outerHeight) {
                i--;
                break;
            }
        }

        const extraRows = i - top;
        this.scrollEndRowCount = this.rowElements.length - extraRows;
        // How much innerContainer needs to be scrolled to fully show the last
        // row when scrolled to the end
        this.scrollEndTop = height - outerHeight;

        const scrollHeight =
            (this.dataTable.modified.getRowCount() + extraRows) *
            this.options.cellHeight;
        this.scrollContainer.style.height = scrollHeight + 'px';
    }


    /**
     * Calculates the number of rows to render pending of cell sizes.
     *
     * @internal
     *
     * @return
     * The number rows to render.
     */
    private getNumRowsToDraw(): number {
        return Math.min(
            this.dataTable.modified.getRowCount(),
            Math.ceil(
                this.outerContainer.offsetHeight / this.options.cellHeight
            )
        );
    }

    /**
     * Internal method that calculates the data grid height. If the container
     * has a height declared in CSS it uses that, otherwise it uses a default.
     * @internal
     */
    public getDataGridSize(): number {
        const grid = this,
            options = grid.options,
            { height } = grid.container.getBoundingClientRect();

        // If the container has a height declared in CSS, use that.
        if (height > 2) {
            return height;
        }
        // Use the default height if the container has no height declared in CSS
        return options.defaultHeight;
    }


    /**
     * Renders a data cell.
     *
     * @internal
     *
     * @param parentRow
     * The parent row to add the cell to.
     *
     * @param columnName
     * The column the cell belongs to.
     */
    private renderCell(
        parentRow: HTMLElement,
        columnName: string
    ): void {
        let className = Globals.classNames.cell;

        if (!this.isColumnEditable(columnName)) {
            className += ` ${className}-readonly`;
        }

        const cellEl = makeDiv(className);
        cellEl.style.minHeight = this.options.cellHeight + 'px';

        cellEl.addEventListener('click', (): void =>
            this.onCellClick(cellEl, columnName)
        );
        parentRow.appendChild(cellEl);
    }


    /**
     * Renders a row of data.
     * @internal
     */
    private renderRow(): void {
        const rowEl = makeDiv(Globals.classNames.row);

        for (let i = 0; i < this.columnNames.length; i++) {
            this.renderCell(rowEl, this.columnNames[i]);
        }

        this.innerContainer.appendChild(rowEl);
        this.rowElements.push(rowEl);
    }

    /**
     * Allows formatting of the header cell text based on provided format
     * option. If that is not provided, the column name is returned.
     * @internal
     *
     * @param columnName
     * Column name to format.
     */
    private formatHeaderCell(columnName: string): string {
        const options = this.options,
            columnOptions = options.columns[columnName],
            headerFormat = columnOptions && columnOptions.headerFormat;

        if (headerFormat) {
            return format(headerFormat, { text: columnName });
        }

        return columnName;
    }

    /**
     * Allows formatting of the cell text based on provided format option.
     * If that is not provided, the cell value is returned.
     * @internal
     *
     * @param  cellValue
     * The value of the cell to format.
     *
     * @param  column
     * The column name the cell belongs to.
     */
    private formatCell(cellValue: JSON.Primitive, column: string): string {
        const options = this.options,
            columnOptions = options.columns[column],
            cellFormat = columnOptions && columnOptions.cellFormat,
            cellFormatter = columnOptions && columnOptions.cellFormatter;

        let formattedCell = defined(cellValue) ? cellValue : '';

        if (cellFormat) {
            if (
                typeof cellValue === 'number' &&
                cellFormat.indexOf('value') > -1
            ) {
                formattedCell =
                    format(cellFormat, { value: cellValue });
            } else if (
                typeof cellValue === 'string' &&
                cellFormat.indexOf('text') > -1
            ) {
                formattedCell =
                    format(cellFormat, { text: cellValue });
            }
        }

        if (cellFormatter) {
            return cellFormatter.call({ value: cellValue });
        }

        return formattedCell.toString();
    }

    /**
     * Render a column header for a column.
     *
     * @internal
     *
     * @param parentEl
     * The parent element of the column header.
     *
     * @param columnName
     * The name of the column.
     */
    private renderColumnHeader(
        parentEl: HTMLElement,
        columnName: string
    ): void {
        let className = Globals.classNames.columnHeader;

        if (!this.isColumnEditable(columnName)) {
            className += ` ${className}-readonly`;
        }

        const headerEl = makeDiv(className);
        headerEl.style.minHeight = this.options.cellHeight + 'px';
        headerEl.style.maxHeight = this.options.cellHeight * 2 + 'px';

        headerEl.textContent = this.formatHeaderCell(columnName);
        parentEl.appendChild(headerEl);
    }


    /**
     * Render the column headers of the table.
     * @internal
     */
    private renderColumnHeaders(): void {
        const columnNames = this.columnNames,
            columnHeadersContainer = this.columnHeadersContainer =
                this.columnHeadersContainer ||
                makeDiv(`${Globals.classNamePrefix}column-headers`);

        emptyHTMLElement(columnHeadersContainer);

        columnNames.forEach(
            this.renderColumnHeader.bind(this, columnHeadersContainer)
        );

        if (!this.headerContainer) {
            this.headerContainer =
                makeDiv(`${Globals.classNamePrefix}header-container`);
            this.headerContainer.appendChild(columnHeadersContainer);
        }

        this.gridContainer.insertBefore(
            this.headerContainer,
            this.outerContainer
        );

        this.updateColumnHeaders();
    }


    /**
     * Refresh container elements to adapt them to new container dimensions.
     * @internal
     */
    private updateGridElements(): void {
        this.updateColumnHeaders();
        this.redrawRowElements();
        this.updateDragHandlesPosition();
    }

    /**
     * Update the column headers of the table.
     * @internal
     */
    private updateColumnHeaders(): void {
        const headersContainer = this.columnHeadersContainer;
        if (!headersContainer) {
            return;
        }

        // Handle overflowing text in headers.
        for (let i = 0; i < this.columnNames.length; i++) {
            const columnName = this.columnNames[i],
                header = headersContainer.children[i] as HTMLElement,
                overflowWidth = this.overflowHeaderWidths[i];

            if (header.scrollWidth > header.clientWidth) {
                // Headers overlap
                this.overflowHeaderWidths[i] = header.scrollWidth;
                header.textContent = this.formatHeaderCell(columnName)
                    .split(' ').map((word): string => (
                        word.length < 4 ? word : word.slice(0, 2) + '...'
                    )).join(' ');
            } else if (
                isNumber(overflowWidth) &&
                overflowWidth <= header.clientWidth
            ) {
                // Headers not overlap
                this.overflowHeaderWidths[i] = null;
                header.textContent = this.formatHeaderCell(columnName);
            }

        }

        // Offset the outer container by the header row height.
        this.outerContainer.style.top = headersContainer.clientHeight + 'px';

        // Header columns alignment when scrollbar is shown.
        if (headersContainer.lastChild) {
            (headersContainer.lastChild as HTMLElement)
                .style.marginRight = (
                    this.outerContainer.offsetWidth -
                    this.outerContainer.clientWidth
                ) + 'px';
        }
    }

    /**
     * Redraw existing row elements.
     * @internal
     */
    private redrawRowElements(): void {
        if (!this.rowElements.length) {
            return;
        }

        const prevColumnFlexes: string[] = [],
            firstRowChildren = this.rowElements[0].children;

        for (let i = 0; i < firstRowChildren.length; i++) {
            prevColumnFlexes.push(
                (firstRowChildren[i] as HTMLElement).style.flex
            );
        }

        emptyHTMLElement(this.innerContainer);
        this.renderInitialRows();
        this.updateScrollingLength();
        this.updateVisibleCells(true);

        for (let i = 0; i < this.rowElements.length; i++) {
            const row = this.rowElements[i];
            for (let j = 0; j < row.childElementCount; j++) {
                (row.children[j] as HTMLElement).style.flex =
                    prevColumnFlexes[j];
            }
        }
    }

    /**
     * Update the column drag handles position.
     * @internal
     */
    private updateDragHandlesPosition() : void {
        const headersContainer = this.columnHeadersContainer,
            handlesContainer = this.columnDragHandlesContainer;
        if (!handlesContainer || !headersContainer) {
            return;
        }

        for (let i = 0; i < handlesContainer.childElementCount - 1; i++) {
            const handle = handlesContainer.children[i] as HTMLElement,
                header = headersContainer.children[i + 1] as HTMLElement;

            handle.style.height = headersContainer.clientHeight + 'px';
            handle.style.left = header.offsetLeft - 2 + 'px';
        }
    }


    /**
     * Render initial rows before the user starts scrolling.
     * @internal
     */
    private renderInitialRows(): void {
        this.rowElements = [];
        const rowsToDraw = this.getNumRowsToDraw();
        for (let i = 0; i < rowsToDraw; i++) {
            this.renderRow();
        }
    }


    /**
     * Render the drag handles for resizing columns.
     * @internal
     */
    private renderColumnDragHandles(): void {
        if (!this.columnHeadersContainer) {
            return;
        }
        const container = this.columnDragHandlesContainer = (
            this.columnDragHandlesContainer ||
            makeDiv(`${Globals.classNamePrefix}col-resize-container`)
        );
        const columnEls = this.columnHeadersContainer.children;
        const handleHeight = this.options.cellHeight;

        emptyHTMLElement(container);

        for (let i = 1; i < columnEls.length; ++i) {
            const col = columnEls[i] as HTMLElement;
            const handle = makeDiv(`${Globals.classNamePrefix}col-resize-handle`);
            handle.style.height = handleHeight + 'px';
            handle.style.left = col.offsetLeft - 2 + 'px';
            handle.addEventListener('mouseover', (): void => {
                if (!this.draggedResizeHandle) {
                    handle.style.opacity = '1';
                }
            });
            handle.addEventListener('mouseleave', (): void => {
                if (!this.draggedResizeHandle) {
                    handle.style.opacity = '0';
                }
            });
            handle.addEventListener(
                'mousedown',
                this.onHandleMouseDown.bind(this, handle, i)
            );
            container.appendChild(handle);
        }

        this.renderColumnResizeCrosshair(container);

        document.addEventListener('mouseup', (e: MouseEvent): void => {
            if (this.draggedResizeHandle) {
                this.stopColumnResize(this.draggedResizeHandle, e);
            }
        });
        document.addEventListener('mousemove', (e: MouseEvent): void => {
            if (this.draggedResizeHandle) {
                this.updateColumnResizeDrag(e);
            }
        });
        if (this.headerContainer) {
            this.headerContainer.appendChild(container);
        }
    }


    /**
     * Renders the crosshair shown when resizing columns.
     *
     * @internal
     *
     * @param container
     * The container to place the crosshair in.
     */
    private renderColumnResizeCrosshair(container: HTMLElement): void {
        const el = this.columnResizeCrosshair = (
            this.columnResizeCrosshair ||
            makeDiv(`${Globals.classNamePrefix}col-resize-crosshair`)
        );
        const handleHeight = this.options.cellHeight;

        el.style.top = handleHeight + 'px';
        el.style.height = this.innerContainer.offsetHeight + 'px';

        container.appendChild(el);
    }


    /**
     * On column resize handle click.
     *
     * @internal
     *
     * @param handle
     * The drag handle being clicked.
     *
     * @param colRightIx
     * The column ix to the right of the resize handle.
     *
     * @param e
     * The mousedown event.
     */
    private onHandleMouseDown(
        handle: HTMLElement,
        colRightIx: number,
        e: MouseEvent
    ): void {
        if (this.draggedResizeHandle) {
            return;
        }
        e.preventDefault();
        this.draggedResizeHandle = handle;
        this.draggedColumnRightIx = colRightIx;
        this.dragResizeStart = e.pageX;

        const crosshair = this.columnResizeCrosshair;
        if (crosshair) {
            crosshair.style.left = (
                handle.offsetLeft + handle.offsetWidth / 2 -
                crosshair.offsetWidth / 2 + 'px'
            );
            crosshair.style.opacity = '1';
        }
    }


    /**
     * Update as we drag column resizer
     * @internal
     */
    private updateColumnResizeDrag(e: MouseEvent): void {
        const handle = this.draggedResizeHandle;
        const crosshair = this.columnResizeCrosshair;
        const colRightIx = this.draggedColumnRightIx;
        const colHeaders = this.columnHeadersContainer;
        if (
            !handle ||
            !crosshair ||
            colRightIx === null ||
            !colHeaders ||
            !this.dragResizeStart
        ) {
            return;
        }

        const col = colHeaders.children[colRightIx] as HTMLElement;
        const diff = e.pageX - this.dragResizeStart;
        const newPos = col.offsetLeft + diff;
        handle.style.left = newPos - handle.offsetWidth / 2 + 'px';
        crosshair.style.left = newPos - crosshair.offsetWidth / 2 + 'px';
    }


    /**
     * Stop resizing a column.
     *
     * @internal
     *
     * @param handle
     * The related resize handle.
     *
     * @param e
     * The related mouse event.
     */
    private stopColumnResize(handle: HTMLElement, e: MouseEvent): void {
        const crosshair = this.columnResizeCrosshair;
        const colRightIx = this.draggedColumnRightIx;
        const colContainer = this.columnHeadersContainer;
        if (
            !crosshair ||
            !colContainer ||
            !this.dragResizeStart ||
            colRightIx === null
        ) {
            return;
        }
        handle.style.opacity = '0';
        crosshair.style.opacity = '0';

        const colLeft = colContainer.children[colRightIx - 1] as HTMLElement;
        const colRight = colContainer.children[colRightIx] as HTMLElement;
        const diff = e.pageX - this.dragResizeStart;
        const newWidthLeft = colLeft.offsetWidth + diff;
        const newWidthRight = colRight.offsetWidth - diff;
        const diffRatioLeft = newWidthLeft / colLeft.offsetWidth;
        const diffRatioRight = newWidthRight / colRight.offsetWidth;
        const leftFlexRatio = (
            (colLeft.style.flex ? parseFloat(colLeft.style.flex) : 1) *
            diffRatioLeft
        );
        const rightFlexRatio = (
            (colRight.style.flex ? parseFloat(colRight.style.flex) : 1) *
            diffRatioRight
        );

        this.resizeColumn(leftFlexRatio, colRightIx - 1);
        this.resizeColumn(rightFlexRatio, colRightIx);

        this.draggedResizeHandle = null;
        this.draggedColumnRightIx = null;

        this.updateGridElements();
    }

    /**
     * Update the size of grid container.
     *
     * @internal
     *
     * @param width
     * The new width in pixel, or `null` for no change.
     *
     * @param height
     * The new height in pixel, or `null` for no change.
     */
    public setSize(
        width?: number|null,
        height?: number|null
    ): void {
        if (width) {
            this.innerContainer.style.width = width + 'px';
        }

        if (height) {
            this.gridContainer.style.height = this.getDataGridSize() + 'px';

            this.outerContainer.style.height =
                height -
                (this.options.cellHeight + // Header height
                this.getMarginHeight(height)) + 'px';
        }

        this.render();
    }

    /**
     * If the grid is in the parent container that has margins, calculate the
     * height of the margins.
     * @internal
     *
     * @param  height
     * The height of the parent container.
     */
    private getMarginHeight(height: number): number {
        return height - this.gridContainer.getBoundingClientRect().height;
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

/** @internal */
namespace DataGrid {

    /**
     * Possible events fired by DataGrid.
     * @internal
     */
    export type Event = (
        ColumnResizeEvent |
        CellClickEvent
    );

    /**
     * Event when a column has been resized.
     * @internal
     */
    export interface ColumnResizeEvent extends DataEvent {

        /**
         * Type of the event.
         * @internal
         */
        readonly type: 'afterResizeColumn';

        /**
         * New (or old) width of the column.
         * @internal
         */
        readonly width: number;

        /**
         * New (or old) index of the column.
         * @internal */
        readonly index?: number;

        /**
         * Name of the column.
         * @internal
         */
        readonly name?: string;
    }

    /**
     * Event when a cell has mouse focus.
     * @internal
     */
    export interface CellClickEvent {

        /**
         * Type of the event.
         * @internal
         */
        readonly type: 'cellClick';

        /**
         * HTML element with focus.
         * @internal
         */
        readonly input: HTMLElement;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataGrid;
