/* *
 *
 *  DataGrid class
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

import type { Options, GroupedHeaderOptions, IndividualColumnOptions } from './Options';
import type DataTableOptions from '../Data/DataTableOptions';
import type Column from './Table/Column';

import Accessibility from './Accessibility/Accessibility.js';
import AST from '../Core/Renderer/HTML/AST.js';
import Credits from './Credits.js';
import Defaults from './Defaults.js';
import DataGridUtils from './Utils.js';
import DataTable from '../Data/DataTable.js';
import Globals from './Globals.js';
import Table from './Table/Table.js';
import U from '../Core/Utilities.js';
import QueryingController from './Querying/QueryingController.js';

const { makeHTMLElement } = DataGridUtils;
const { win } = Globals;
const { merge, getStyle } = U;


/* *
 *
 *  Class
 *
 * */

/**
 * Creates a grid structure (table).
 */
class DataGrid {

    /* *
    *
    *  Static Methods
    *
    * */

    /**
     * Creates a new data grid.
     *
     * @param renderTo
     * The render target (html element or id) of the data grid.
     *
     * @param options
     * The options of the data grid.
     *
     * @param async
     * Whether to initialize the dashboard asynchronously. When true, the
     * function returns a promise that resolves with the dashboard instance.
     *
     * @return
     * The new data grid.
     */
    public static dataGrid(
        renderTo: string|HTMLElement,
        options: Options,
        async?: boolean
    ): DataGrid;

    /**
     * Creates a new data grid.
     *
     * @param renderTo
     * The render target (html element or id) of the data grid.
     *
     * @param options
     * The options of the data grid.
     *
     * @param async
     * Whether to initialize the dashboard asynchronously. When true, the
     * function returns a promise that resolves with the dashboard instance.
     *
     * @return
     * Promise that resolves with the new data grid.
     */
    public static dataGrid(
        renderTo: string|HTMLElement,
        options: Options,
        async: true
    ): Promise<DataGrid>;

    // Implementation
    public static dataGrid(
        renderTo: string|HTMLElement,
        options: Options,
        async?: boolean
    ): (DataGrid | Promise<DataGrid>) {

        if (async) {
            return new Promise<DataGrid>((resolve): void => {
                void new DataGrid(renderTo, options, (dataGrid): void => {
                    resolve(dataGrid);
                });
            });
        }

        return new DataGrid(renderTo, options);
    }

    /* *
    *
    *  Properties
    *
    * */

    /**
     * An array containing the current DataGrid objects in the page.
     */
    public static readonly dataGrids: Array<(DataGrid|undefined)> = [];

    /**
     * The accessibility controller.
     */
    public accessibility?: Accessibility;

    /**
     * The user options declared for the columns as an object of column ID to
     * column options.
     */
    public columnOptionsMap: Record<string, Column.Options> = {};

    /**
     * The container of the data grid.
     */
    public container?: HTMLElement;

    /**
     * The init container height
     */
    public initContainerHeight: number;

    /**
     * The content container of the data grid.
     */
    public contentWrapper?: HTMLElement;

    /**
     * The credits of the data grid.
     */
    public credits?: Credits;

    /**
     * The data source of the data grid. It contains the original data table
     * that was passed to the data grid.
     */
    public dataTable?: DataTable;

    /**
     * The presentation table of the data grid. It contains a modified version
     * of the data table that is used for rendering the data grid content. If
     * not modified, just a reference to the original data table.
     */
    public presentationTable?: DataTable;

    /**
     * The HTML element of the table.
     */
    public tableElement?: HTMLTableElement;

    /**
     * The options of the data grid. Contains the options that were declared
     * by the user and some of the default options.
     */
    public options?: Options;

    /**
     * The options that were declared by the user when creating the data grid
     * or when updating it.
     */
    public userOptions: Partial<Options> = {};

    /**
     * The table (viewport) element of the data grid.
     */
    public viewport?: Table;

    /**
     * The list of columns that are displayed in the data grid.
     * @internal
     */
    public enabledColumns?: string[];

    /**
     * The hovered row index.
     * @internal
     */
    public hoveredRowIndex?: number;

    /**
     * The hovered column ID.
     * @internal
     */
    public hoveredColumnId?: string;

    /**
     * The querying controller.
     */
    public querying: QueryingController;

    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs a new data grid.
     *
     * @param renderTo
     * The render target (container) of the data grid.
     *
     * @param options
     * The options of the data grid.
     *
     * @param afterLoadCallback
     * The callback that is called after the data grid is loaded.
     */
    constructor(
        renderTo: string | HTMLElement,
        options: Options,
        afterLoadCallback?: DataGrid.AfterLoadCallback
    ) {
        this.loadUserOptions(options);

        this.querying = new QueryingController(this);
        this.initContainerHeight = 0;
        this.initContainers(renderTo);
        this.initAccessibility();
        this.loadDataTable(this.options?.dataTable);

        this.querying.loadOptions();
        void this.querying.proceed().then((): void => {
            this.renderViewport();
            afterLoadCallback?.(this);
        });

        DataGrid.dataGrids.push(this);
    }


    /* *
     *
     *  Methods
     *
     * */

    /**
     * Initializes the accessibility controller.
     */
    private initAccessibility(): void {
        if (!this.options?.accessibility?.enabled) {
            return;
        }

        // Can be moved to a separate module in the future (if needed).
        this.accessibility = new Accessibility(this);
    }

    /**
     * Initializes the container of the data grid.
     *
     * @param renderTo
     * The render target (html element or id) of the data grid.
     *
     */
    private initContainers(renderTo: string|HTMLElement): void {
        const container = (typeof renderTo === 'string') ?
            win.document.getElementById(renderTo) : renderTo;

        // Display an error if the renderTo is wrong
        if (!container) {
            // eslint-disable-next-line no-console
            console.error(`
                Rendering div not found. It is unable to find the HTML element
                to render the DataGrid in.
            `);
            return;
        }
        this.initContainerHeight = getStyle(
            container,
            'height',
            true
        ) || 0;

        this.container = container;
        this.container.innerHTML = AST.emptyHTML;
        this.contentWrapper = makeHTMLElement('div', {
            className: Globals.classNames.container
        }, this.container);
    }

    /**
     * Loads the new user options to all the important fields (`userOptions`,
     * `options` and `columnOptionsMap`).
     *
     * @param newOptions
     * The options that were declared by the user.
     *
     * @param oneToOne
     * When `false` (default), the existing column options will be merged with
     * the ones that are currently defined in the user options. When `true`,
     * the columns not defined in the new options will be removed.
     */
    private loadUserOptions(
        newOptions: Partial<Options>,
        oneToOne = false
    ): void {
        // Operate on a copy of the options argument
        newOptions = merge(newOptions);

        if (newOptions.columns) {
            if (oneToOne) {
                this.loadColumnOptionsOneToOne(newOptions.columns);
            } else {
                this.loadColumnOptions(newOptions.columns);
            }
            delete newOptions.columns;
        }

        this.userOptions = merge(this.userOptions, newOptions);
        this.options = merge(
            this.options ?? Defaults.defaultOptions,
            this.userOptions
        );

        const columnOptionsArray = this.options?.columns;
        if (!columnOptionsArray) {
            return;
        }
        const columnOptionsObj: Record<string, Column.Options> = {};
        for (let i = 0, iEnd = columnOptionsArray?.length ?? 0; i < iEnd; ++i) {
            columnOptionsObj[columnOptionsArray[i].id] = columnOptionsArray[i];
        }

        this.columnOptionsMap = columnOptionsObj;
    }

    /**
     * Loads the new column options to the userOptions field.
     *
     * @param newColumnOptions
     * The new column options that should be loaded.
     *
     * @param overwrite
     * Whether to overwrite the existing column options with the new ones.
     * Default is `false`.
     */
    private loadColumnOptions(
        newColumnOptions: IndividualColumnOptions[],
        overwrite = false
    ): void {
        if (!this.userOptions.columns) {
            this.userOptions.columns = [];
        }
        const columnOptions = this.userOptions.columns;

        for (let i = 0, iEnd = newColumnOptions.length; i < iEnd; ++i) {
            const newOptions = newColumnOptions[i];
            const indexInPrevOptions = columnOptions.findIndex(
                (prev): boolean => prev.id === newOptions.id
            );

            // If the new column options contain only the id.
            if (Object.keys(newOptions).length < 2) {
                if (overwrite && indexInPrevOptions !== -1) {
                    columnOptions.splice(indexInPrevOptions, 1);
                }
                continue;
            }

            if (indexInPrevOptions === -1) {
                columnOptions.push(newOptions);
            } else if (overwrite) {
                columnOptions[indexInPrevOptions] = newOptions;
            } else {
                columnOptions[indexInPrevOptions] = merge(
                    columnOptions[indexInPrevOptions],
                    newOptions
                );
            }
        }

        if (columnOptions.length < 1) {
            delete this.userOptions.columns;
        }
    }

    /**
     * Loads the new column options to the userOptions field in a one-to-one
     * manner. It means that all the columns that are not defined in the new
     * options will be removed.
     *
     * @param newColumnOptions
     * The new column options that should be loaded.
     */
    private loadColumnOptionsOneToOne(
        newColumnOptions: IndividualColumnOptions[]
    ): void {
        const prevColumnOptions = this.userOptions.columns;
        const columnOptions = [];

        let prevOptions: IndividualColumnOptions | undefined;
        for (let i = 0, iEnd = newColumnOptions.length; i < iEnd; ++i) {
            const newOptions = newColumnOptions[i];
            const indexInPrevOptions = prevColumnOptions?.findIndex(
                (prev): boolean => prev.id === newOptions.id
            );

            if (indexInPrevOptions !== void 0 && indexInPrevOptions !== -1) {
                prevOptions = prevColumnOptions?.[indexInPrevOptions];
            }

            const resultOptions = merge(prevOptions ?? {}, newOptions);
            if (Object.keys(resultOptions).length > 1) {
                columnOptions.push(resultOptions);
            }
        }

        this.userOptions.columns = columnOptions;
    }

    public update(
        options?: Options,
        render?: boolean,
        oneToOne?: boolean
    ): Promise<void>;

    public update(
        options: Options,
        render: false,
        oneToOne?: boolean
    ): void;

    /**
     * Updates the data grid with new options.
     *
     * @param options
     * The options of the data grid that should be updated. If not provided,
     * the update will be proceeded based on the `this.userOptions` property.
     * The `column` options are merged using the `id` property as a key.
     *
     * @param render
     * Whether to re-render the data grid after updating the options.
     *
     * @param oneToOne
     * When `false` (default), the existing column options will be merged with
     * the ones that are currently defined in the user options. When `true`,
     * the columns not defined in the new options will be removed.
     */
    public async update(
        options: Options = {},
        render = true,
        oneToOne = false
    ): Promise<void> {
        this.loadUserOptions(options, oneToOne);

        let newDataTable = false;
        if (!this.dataTable || options.dataTable) {
            this.userOptions.dataTable = options.dataTable;
            (this.options ?? {}).dataTable = options.dataTable;

            this.loadDataTable(this.options?.dataTable);
            newDataTable = true;
        }

        this.querying.loadOptions();

        if (render) {
            await this.querying.proceed(newDataTable);
            this.renderViewport();
        }
    }

    public updateColumn(
        columnId: string,
        options: Omit<IndividualColumnOptions, 'id'>,
        render?: boolean,
        overwrite?: boolean
    ): void;

    public updateColumn(
        columnId: string,
        options: Omit<IndividualColumnOptions, 'id'>,
        render: true,
        overwrite?: boolean
    ): Promise<void>;

    /**
     * Updates the column of the data grid with new options.
     *
     * @param columnId
     * The ID of the column that should be updated.
     *
     * @param options
     * The options of the columns that should be updated. If null,
     * column options for this column ID will be removed.
     *
     * @param render
     * Whether to re-render the data grid after updating the columns.
     *
     * @param overwrite
     * If true, the column options will be updated by replacing the existing
     * options with the new ones instead of merging them.
     */
    public async updateColumn(
        columnId: string,
        options: Omit<IndividualColumnOptions, 'id'>,
        render: boolean = true,
        overwrite = false
    ): Promise<void> {
        this.loadColumnOptions([{
            id: columnId,
            ...options
        }], overwrite);

        await this.update(void 0, render);
    }

    /**
     * Hovers the row with the provided index. It removes the hover effect from
     * the previously hovered row.
     *
     * @param rowIndex
     * The index of the row.
     */
    public hoverRow(rowIndex?: number): void {
        const rows = this.viewport?.rows;
        if (!rows) {
            return;
        }

        const firstRowIndex = this.viewport?.rows[0]?.index ?? 0;

        if (this.hoveredRowIndex !== void 0) {
            rows[this.hoveredRowIndex - firstRowIndex]?.setHoveredState(false);
        }

        if (rowIndex !== void 0) {
            rows[rowIndex - firstRowIndex]?.setHoveredState(true);
        }

        this.hoveredRowIndex = rowIndex;
    }

    /**
     * Hovers the column with the provided ID. It removes the hover effect from
     * the previously hovered column.
     *
     * @param columnId
     * The ID of the column.
     */
    public hoverColumn(columnId?: string): void {
        const vp = this.viewport;

        if (!vp) {
            return;
        }

        if (this.hoveredColumnId) {
            vp.getColumn(this.hoveredColumnId)?.setHoveredState(false);
        }

        if (columnId) {
            vp.getColumn(columnId)?.setHoveredState(true);
        }

        this.hoveredColumnId = columnId;
    }

    /**
     * Renders the viewport of the data grid. If the data grid is already
     * rendered, it will be destroyed and re-rendered with the new data.
     * @internal
     */
    public renderViewport(): void {
        let vp = this.viewport;
        const viewportMeta = vp?.getStateMeta();

        this.enabledColumns = this.getEnabledColumnIDs();

        this.credits?.destroy();
        vp?.destroy();

        if (this.contentWrapper) {
            this.contentWrapper.innerHTML = AST.emptyHTML;
        }

        if (this.enabledColumns.length > 0) {
            this.renderTable();
            vp = this.viewport;
            if (viewportMeta && vp) {
                vp.applyStateMeta(viewportMeta);
            }
        } else {
            this.renderNoData();
        }

        if (this.options?.credits?.enabled) {
            this.credits = new Credits(this);
        }

        if (vp?.dataGrid.options?.rendering?.rows?.virtualization) {
            vp?.reflow();
        }
    }

    /**
     * Renders the table (viewport) of the data grid.
     */
    private renderTable(): void {
        this.tableElement = makeHTMLElement('table', {
            className: Globals.classNames.tableElement
        }, this.contentWrapper);

        this.viewport = new Table(this, this.tableElement);

        // Accessibility
        this.tableElement.setAttribute(
            'aria-rowcount',
            this.dataTable?.getRowCount() ?? 0
        );
    }

    /**
     * Renders a message that there is no data to display.
     */
    private renderNoData(): void {
        makeHTMLElement('div', {
            className: Globals.classNames.noData,
            innerText: this.options?.lang?.noData
        }, this.contentWrapper);
    }

    /**
     * Returns the array of IDs of columns that should be displayed in the data
     * grid, in the correct order.
     */
    private getEnabledColumnIDs(): string[] {
        const { columnOptionsMap } = this;
        const header = this.options?.header;
        const headerColumns = this.getColumnIds(header || [], false);
        const columnsIncluded = this.options?.rendering?.columns?.included || (
            headerColumns && headerColumns.length > 0 ?
                headerColumns : this.dataTable?.getColumnNames()
        );

        if (!columnsIncluded?.length) {
            return [];
        }

        if (!columnOptionsMap) {
            return columnsIncluded;
        }

        let columnName: string;
        const result: string[] = [];
        for (let i = 0, iEnd = columnsIncluded.length; i < iEnd; ++i) {
            columnName = columnsIncluded[i];
            if (columnOptionsMap?.[columnName]?.enabled !== false) {
                result.push(columnName);
            }
        }

        return result;
    }

    private loadDataTable(tableOptions?: DataTable | DataTableOptions): void {
        // If the table is passed as a reference, it should be used instead of
        // creating a new one.
        if (tableOptions?.id) {
            this.dataTable = tableOptions as DataTable;
            this.presentationTable = this.dataTable.modified;
            return;
        }

        this.dataTable = this.presentationTable =
            new DataTable(tableOptions as DataTableOptions);
    }

    /**
     * Extracts all references to columnIds on all levels below defined level
     * in the settings.header structure.
     *
     * @param columns
     * Structure that we start calculation
     *
     * @param [onlyEnabledColumns=true]
     * Extract all columns from header or columns filtered by enabled param
     * @returns
     */
    public getColumnIds(
        columns: Array<GroupedHeaderOptions|string>,
        onlyEnabledColumns: boolean = true
    ): string[] {
        let columnIds: string[] = [];
        const { enabledColumns } = this;

        for (const column of columns) {
            const columnId: string | undefined =
                typeof column === 'string' ? column : column.columnId;

            if (
                columnId &&
                (!onlyEnabledColumns || (enabledColumns?.includes(columnId)))
            ) {
                columnIds.push(columnId);
            }

            if (typeof column !== 'string' && column.columns) {
                columnIds = columnIds.concat(
                    this.getColumnIds(column.columns, onlyEnabledColumns)
                );
            }
        }

        return columnIds;
    }

    /**
     * Destroys the data grid.
     */
    public destroy(): void {
        const dgIndex = DataGrid.dataGrids.findIndex(
            (dg): boolean => dg === this
        );

        this.viewport?.destroy();

        if (this.container) {
            this.container.innerHTML = AST.emptyHTML;
            this.container.classList.remove(Globals.classNames.container);
        }

        // Clear all properties
        Object.keys(this).forEach((key): void => {
            delete this[key as keyof this];
        });

        DataGrid.dataGrids.splice(dgIndex, 1);
    }

    /**
     * Returns the current dataGrid data as a JSON string.
     *
     * @return
     * JSON representation of the data
     */
    public getJSON(): string {
        const json = this.viewport?.dataTable.modified.columns;

        if (!this.enabledColumns || !json) {
            return '{}';
        }

        for (const key of Object.keys(json)) {
            if (this.enabledColumns.indexOf(key) === -1) {
                delete json[key];
            }
        }

        return JSON.stringify(json);
    }

    /**
     * Returns the current DataGrid options as a JSON string.
     *
     * @param onlyUserOptions
     * Whether to return only the user options or all options (user options
     * merged with the default ones). Default is `true`.
     *
     * @returns
     * Options as a JSON string.
     */
    public getOptionsJSON(onlyUserOptions = true): string {
        const optionsCopy =
            onlyUserOptions ? merge(this.userOptions) : merge(this.options);

        if (optionsCopy.dataTable?.id) {
            optionsCopy.dataTable = {
                columns: optionsCopy.dataTable.columns
            };
        }

        return JSON.stringify(optionsCopy);
    }
}


/* *
 *
 *  Class Namespace
 *
 * */
namespace DataGrid {
    export type AfterLoadCallback = (dataGrid: DataGrid) => void;
}


/* *
 *
 *  Default Export
 *
 * */

export default DataGrid;
