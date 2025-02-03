/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *  - Gøran Slettemark
 *  - Jomar Hønsi
 *  - Dawid Dragula
 *
 * */

'use strict';


/* *
 *
 *  Imports
 *
 * */


import type DataEvent from './DataEvent';
import type DataModifier from './Modifiers/DataModifier';
import type DataTableOptions from './DataTableOptions';

import DataTableCore from './DataTableCore.js';
import U from '../Core/Utilities.js';
const {
    addEvent,
    defined,
    fireEvent,
    extend,
    uniqueKey
} = U;


/* *
 *
 *  Class
 *
 * */


/**
 * Class to manage columns and rows in a table structure. It provides methods
 * to add, remove, and manipulate columns and rows, as well as to retrieve data
 * from specific cells.
 *
 * @class
 * @name Highcharts.DataTable
 *
 * @param {Highcharts.DataTableOptions} [options]
 * Options to initialize the new DataTable instance.
 */
class DataTable extends DataTableCore implements DataEvent.Emitter {


    /* *
     *
     *  Static Properties
     *
     * */


    /**
     * Null state for a row record. In some cases, a row in a table may not
     * contain any data or may be invalid. In these cases, a null state can be
     * used to indicate that the row record is empty or invalid.
     *
     * @name Highcharts.DataTable.NULL
     * @type {Highcharts.DataTableRowObject}
     *
     * @see {@link Highcharts.DataTable.isNull} for a null test.
     *
     * @example
     * table.setRows([DataTable.NULL, DataTable.NULL], 10);
     */
    public static readonly NULL: DataTable.RowObject = {};


    /**
     * Semantic version string of the DataTable class.
     * @internal
     */
    public static readonly version: string = '1.0.0';


    /* *
     *
     *  Static Functions
     *
     * */


    /**
     * Tests whether a row contains only `null` values or is equal to
     * DataTable.NULL. If all columns have `null` values, the function returns
     * `true`. Otherwise, it returns `false` to indicate that the row contains
     * at least one non-null value.
     *
     * @function Highcharts.DataTable.isNull
     *
     * @param {Highcharts.DataTableRow|Highcharts.DataTableRowObject} row
     * Row to test.
     *
     * @return {boolean}
     * Returns `true`, if the row contains only null, otherwise `false`.
     *
     * @example
     * if (DataTable.isNull(row)) {
     *   // handle null row
     * }
     */
    public static isNull(
        row: (DataTable.Row | DataTable.RowObject)
    ): boolean {
        if (row === DataTable.NULL) {
            return true;
        }
        if (row instanceof Array) {
            if (!row.length) {
                return false;
            }
            for (let i = 0, iEnd = row.length; i < iEnd; ++i) {
                if (row[i] !== null) {
                    return false;
                }
            }
        } else {
            const columnNames = Object.keys(row);
            if (!columnNames.length) {
                return false;
            }
            for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
                if (row[columnNames[i]] !== null) {
                    return false;
                }
            }
        }
        return true;
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        options: DataTableOptions = {}
    ) {
        super(options);
        this.modified = this;

    }

    /* *
     *
     *  Properties
     *
     * */

    private modifier?: DataModifier;

    private localRowIndexes?: Array<number>;

    public modified: DataTable;

    private originalRowIndexes?: Array<number|undefined>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Returns a clone of this table. The cloned table is completely independent
     * of the original, and any changes made to the clone will not affect
     * the original table.
     *
     * @function Highcharts.DataTable#clone
     *
     * @param {boolean} [skipColumns]
     * Whether to clone columns or not.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Clone of this data table.
     *
     * @emits #cloneTable
     * @emits #afterCloneTable
     */
    public clone(
        skipColumns?: boolean,
        eventDetail?: DataEvent.Detail
    ): DataTable {
        const table = this,
            tableOptions: DataTableOptions = {};

        table.emit({ type: 'cloneTable', detail: eventDetail });

        if (!skipColumns) {
            tableOptions.columns = table.columns;
        }

        if (!table.autoId) {
            tableOptions.id = table.id;
        }

        const tableClone: DataTable = new DataTable(tableOptions);

        if (!skipColumns) {
            tableClone.versionTag = table.versionTag;
            tableClone.originalRowIndexes = table.originalRowIndexes;
            tableClone.localRowIndexes = table.localRowIndexes;
        }

        table.emit({
            type: 'afterCloneTable',
            detail: eventDetail,
            tableClone
        });

        return tableClone;
    }


    /**
     * Deletes columns from the table.
     *
     * @function Highcharts.DataTable#deleteColumns
     *
     * @param {Array<string>} [columnNames]
     * Names of columns to delete. If no array is provided, all
     * columns will be deleted.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTableColumnCollection|undefined}
     * Returns the deleted columns, if found.
     *
     * @emits #deleteColumns
     * @emits #afterDeleteColumns
     */
    public deleteColumns(
        columnNames?: Array<string>,
        eventDetail?: DataEvent.Detail
    ): (DataTable.ColumnCollection | undefined) {
        const table = this,
            columns = table.columns,
            deletedColumns: DataTable.ColumnCollection = {},
            modifiedColumns: DataTable.ColumnCollection = {},
            modifier = table.modifier,
            rowCount = table.rowCount;

        columnNames = (columnNames || Object.keys(columns));

        if (columnNames.length) {
            table.emit({
                type: 'deleteColumns',
                columnNames,
                detail: eventDetail
            });

            for (
                let i = 0,
                    iEnd = columnNames.length,
                    column: DataTable.Column,
                    columnName: string;
                i < iEnd;
                ++i
            ) {
                columnName = columnNames[i];
                column = columns[columnName];
                if (column) {
                    deletedColumns[columnName] = column;
                    modifiedColumns[columnName] = new Array(rowCount);
                }
                delete columns[columnName];
            }

            if (!Object.keys(columns).length) {
                table.rowCount = 0;
                this.deleteRowIndexReferences();
            }

            if (modifier) {
                modifier.modifyColumns(table, modifiedColumns, 0, eventDetail);
            }

            table.emit({
                type: 'afterDeleteColumns',
                columns: deletedColumns,
                columnNames,
                detail: eventDetail
            });

            return deletedColumns;
        }
    }

    /**
     * Deletes the row index references. This is useful when the original table
     * is deleted, and the references are no longer needed. This table is
     * then considered an original table or a table that has the same row's
     * order as the original table.
     */
    public deleteRowIndexReferences(): void {
        delete this.originalRowIndexes;
        delete this.localRowIndexes;

        // Here, in case of future need, can be implemented updating of the
        // modified tables' row indexes references.
    }

    /**
     * Deletes rows in this table.
     *
     * @function Highcharts.DataTable#deleteRows
     *
     * @param {number} [rowIndex]
     * Index to start delete of rows. If not specified, all rows will be
     * deleted.
     *
     * @param {number} [rowCount=1]
     * Number of rows to delete.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Array<Highcharts.DataTableRow>}
     * Returns the deleted rows, if found.
     *
     * @emits #deleteRows
     * @emits #afterDeleteRows
     */
    public deleteRows(
        rowIndex?: number,
        rowCount: number = 1,
        eventDetail?: DataEvent.Detail
    ): Array<DataTable.Row> {
        const table = this,
            deletedRows: Array<DataTable.Row> = [],
            modifiedRows: Array<DataTable.Row> = [],
            modifier = table.modifier;

        table.emit({
            type: 'deleteRows',
            detail: eventDetail,
            rowCount,
            rowIndex: (rowIndex || 0)
        });

        if (typeof rowIndex === 'undefined') {
            rowIndex = 0;
            rowCount = table.rowCount;
        }

        if (rowCount > 0 && rowIndex < table.rowCount) {
            const columns = table.columns,
                columnNames = Object.keys(columns);

            for (
                let i = 0,
                    iEnd = columnNames.length,
                    column: DataTable.Column,
                    deletedCells: Array<DataTable.CellType>;
                i < iEnd;
                ++i
            ) {
                column = columns[columnNames[i]];
                deletedCells = column.splice(rowIndex, rowCount);

                if (!i) {
                    table.rowCount = column.length;
                }

                for (let j = 0, jEnd = deletedCells.length; j < jEnd; ++j) {
                    deletedRows[j] = (deletedRows[j] || []);
                    deletedRows[j][i] = deletedCells[j];
                }

                modifiedRows.push(new Array(iEnd));
            }
        }

        if (modifier) {
            modifier.modifyRows(
                table,
                modifiedRows,
                (rowIndex || 0),
                eventDetail
            );
        }

        table.emit({
            type: 'afterDeleteRows',
            detail: eventDetail,
            rowCount,
            rowIndex: (rowIndex || 0),
            rows: deletedRows
        });

        return deletedRows;
    }

    /**
     * Emits an event on this table to all registered callbacks of the given
     * event.
     * @private
     *
     * @param {DataTable.Event} e
     * Event object with event information.
     */
    public emit<E extends DataEvent>(e: E): void {
        if ([
            'afterDeleteColumns',
            'afterDeleteRows',
            'afterSetCell',
            'afterSetColumns',
            'afterSetRows'
        ].includes(e.type)) {
            this.versionTag = uniqueKey();
        }
        fireEvent(this, e.type, e);
    }

    /**
     * Fetches a single cell value.
     *
     * @function Highcharts.DataTable#getCell
     *
     * @param {string} columnName
     * Column name of the cell to retrieve.
     *
     * @param {number} rowIndex
     * Row index of the cell to retrieve.
     *
     * @return {Highcharts.DataTableCellType|undefined}
     * Returns the cell value or `undefined`.
     */
    public getCell(
        columnName: string,
        rowIndex: number
    ): (DataTable.CellType | undefined) {
        const table = this;
        const column = table.columns[columnName];

        if (column) {
            return column[rowIndex];
        }
    }

    /**
     * Fetches a cell value for the given row as a boolean.
     *
     * @function Highcharts.DataTable#getCellAsBoolean
     *
     * @param {string} columnName
     * Column name to fetch.
     *
     * @param {number} rowIndex
     * Row index to fetch.
     *
     * @return {boolean}
     * Returns the cell value of the row as a boolean.
     *
     * @deprecated
     *
     */
    public getCellAsBoolean(
        columnName: string,
        rowIndex: number
    ): boolean {
        const table = this;
        const column = table.columns[columnName];

        return !!(column && column[rowIndex]);
    }

    public getCellAsNumber(
        columnName: string,
        rowIndex: number,
        useNaN: true
    ): number;
    public getCellAsNumber(
        columnName: string,
        rowIndex: number,
        useNaN?: false
    ): (number | null);
    /**
     * Fetches a cell value for the given row as a number.
     *
     * @function Highcharts.DataTable#getCellAsNumber
     *
     * @param {string} columnName
     * Column name or to fetch.
     *
     * @param {number} rowIndex
     * Row index to fetch.
     *
     * @param {boolean} [useNaN]
     * Whether to return NaN instead of `null` and `undefined`.
     *
     * @return {number|null}
     * Returns the cell value of the row as a number.
     *
     * @deprecated
     *
     */
    public getCellAsNumber(
        columnName: string,
        rowIndex: number,
        useNaN?: boolean
    ): (number | null) {
        const table = this;
        const column = table.columns[columnName];

        let cellValue = (column && column[rowIndex]);

        switch (typeof cellValue) {
            case 'boolean':
                return (cellValue ? 1 : 0);
            case 'number':
                return (isNaN(cellValue) && !useNaN ? null : cellValue);
        }

        cellValue = parseFloat(`${cellValue ?? ''}`);

        return (isNaN(cellValue) && !useNaN ? null : cellValue);
    }

    /**
     * Fetches a cell value for the given row as a string.
     *
     * @function Highcharts.DataTable#getCellAsString
     *
     * @param {string} columnName
     * Column name to fetch.
     *
     * @param {number} rowIndex
     * Row index to fetch.
     *
     * @return {string}
     * Returns the cell value of the row as a string.
     *
     * @deprecated
     *
     */
    public getCellAsString(
        columnName: string,
        rowIndex: number
    ): string {
        const table = this;
        const column = table.columns[columnName];

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `${(column && column[rowIndex])}`;
    }

    public getColumn(
        columnName: string,
        asReference?: boolean
    ): (DataTable.Column | undefined);
    public getColumn(
        columnName: string,
        asReference: true
    ): (DataTable.Column | undefined);
    /**
     * Fetches the given column by the canonical column name.
     * This function is a simplified wrap of {@link getColumns}.
     *
     * @function Highcharts.DataTable#getColumn
     *
     * @param {string} columnName
     * Name of the column to get.
     *
     * @param {boolean} [asReference]
     * Whether to return the column as a readonly reference.
     *
     * @return {Highcharts.DataTableColumn|undefined}
     * A copy of the column, or `undefined` if not found.
     */
    public getColumn(
        columnName: string,
        asReference?: boolean
    ): (DataTable.Column | undefined) {
        return this.getColumns(
            [columnName],
            asReference
        )[columnName];
    }

    public getColumnAsNumbers(
        columnName: string,
        useNaN: true
    ): Array<number>;
    public getColumnAsNumbers(
        columnName: string,
        useNaN?: false
    ): Array<(number | null)>;
    /**
     * Fetches the given column by the canonical column name, and
     * validates the type of the first few cells. If the first defined cell is
     * of type number, it assumes for performance reasons, that all cells are of
     * type number or `null`. Otherwise it will convert all cells to number
     * type, except `null`.
     *
     * @function Highcharts.DataTable#getColumnAsNumbers
     *
     * @param {string} columnName
     * Name of the column to get.
     *
     * @param {boolean} [useNaN]
     * Whether to use NaN instead of `null` and `undefined`.
     *
     * @return {Array<(number|null)>}
     * A copy of the column, or an empty array if not found.
     *
     * @deprecated
     *
     */
    public getColumnAsNumbers(
        columnName: string,
        useNaN?: boolean
    ): Array<(number | null)> {
        const table = this,
            columns = table.columns;
        const column = columns[columnName],
            columnAsNumber: Array<(number | null)> = [];

        if (column) {
            const columnLength = column.length;

            if (useNaN) {
                for (let i = 0; i < columnLength; ++i) {
                    columnAsNumber.push(
                        table.getCellAsNumber(columnName, i, true)
                    );
                }
            } else {
                for (
                    let i = 0,
                        cellValue: DataTable.CellType;
                    i < columnLength;
                    ++i
                ) {
                    cellValue = column[i];
                    if (typeof cellValue === 'number') {
                        // Assume unmixed data for performance reasons
                        return column.slice() as Array<(number | null)>;
                    }
                    if (
                        cellValue !== null &&
                        typeof cellValue !== 'undefined'
                    ) {
                        break;
                    }
                }
                for (let i = 0; i < columnLength; ++i) {
                    columnAsNumber.push(
                        table.getCellAsNumber(
                            columnName,
                            i
                        )
                    );
                }
            }
        }

        return columnAsNumber;
    }

    /**
     * Fetches all column names.
     *
     * @function Highcharts.DataTable#getColumnNames
     *
     * @return {Array<string>}
     * Returns all column names.
     */
    public getColumnNames(): Array<string> {
        const table = this,
            columnNames = Object.keys(table.columns);

        return columnNames;
    }

    public getColumns(
        columnNames?: Array<string>,
        asReference?: boolean
    ): DataTable.ColumnCollection;
    public getColumns(
        columnNames: (Array<string> | undefined),
        asReference: true
    ): Record<string, DataTable.Column>;
    /**
     * Retrieves all or the given columns.
     *
     * @function Highcharts.DataTable#getColumns
     *
     * @param {Array<string>} [columnNames]
     * Column names to retrieve.
     *
     * @param {boolean} [asReference]
     * Whether to return columns as a readonly reference.
     *
     * @return {Highcharts.DataTableColumnCollection}
     * Collection of columns. If a requested column was not found, it is
     * `undefined`.
     */
    public getColumns(
        columnNames?: Array<string>,
        asReference?: boolean
    ): DataTable.ColumnCollection {
        const table = this,
            tableColumns = table.columns,
            columns: DataTable.ColumnCollection = {};

        columnNames = (
            columnNames || Object.keys(tableColumns)
        );

        for (
            let i = 0,
                iEnd = columnNames.length,
                column: DataTable.Column,
                columnName: string;
            i < iEnd;
            ++i
        ) {
            columnName = columnNames[i];
            column = tableColumns[columnName];

            if (column) {
                columns[columnName] = (asReference ? column : column.slice());
            }
        }

        return columns;
    }

    /**
     * Takes the original row index and returns the local row index in the
     * modified table for which this function is called.
     *
     * @param {number} originalRowIndex
     * Original row index to get the local row index for.
     *
     * @return {number|undefined}
     * Returns the local row index or `undefined` if not found.
     */
    public getLocalRowIndex(
        originalRowIndex: number
    ): (number | undefined) {
        const { localRowIndexes } = this;

        if (localRowIndexes) {
            return localRowIndexes[originalRowIndex];
        }

        return originalRowIndex;
    }

    /**
     * Retrieves the modifier for the table.
     * @private
     *
     * @return {Highcharts.DataModifier|undefined}
     * Returns the modifier or `undefined`.
     */
    public getModifier(): (DataModifier | undefined) {
        return this.modifier;
    }

    /**
     * Takes the local row index and returns the index of the corresponding row
     * in the original table.
     *
     * @param {number} rowIndex
     * Local row index to get the original row index for.
     *
     * @return {number|undefined}
     * Returns the original row index or `undefined` if not found.
     */
    public getOriginalRowIndex(
        rowIndex: number
    ): (number | undefined) {
        const { originalRowIndexes } = this;

        if (originalRowIndexes) {
            return originalRowIndexes[rowIndex];
        }

        return rowIndex;
    }

    /**
     * Retrieves the row at a given index. This function is a simplified wrap of
     * {@link getRows}.
     *
     * @function Highcharts.DataTable#getRow
     *
     * @param {number} rowIndex
     * Row index to retrieve. First row has index 0.
     *
     * @param {Array<string>} [columnNames]
     * Column names in order to retrieve.
     *
     * @return {Highcharts.DataTableRow}
     * Returns the row values, or `undefined` if not found.
     */
    public getRow(
        rowIndex: number,
        columnNames?: Array<string>
    ): (DataTable.Row | undefined) {
        return this.getRows(rowIndex, 1, columnNames)[0];
    }

    /**
     * Returns the number of rows in this table.
     *
     * @function Highcharts.DataTable#getRowCount
     *
     * @return {number}
     * Number of rows in this table.
     */
    public getRowCount(): number {
        // @todo Implement via property getter `.length` browsers supported
        return this.rowCount;
    }

    /**
     * Retrieves the index of the first row matching a specific cell value.
     *
     * @function Highcharts.DataTable#getRowIndexBy
     *
     * @param {string} columnName
     * Column to search in.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Cell value to search for. `NaN` and `undefined` are not supported.
     *
     * @param {number} [rowIndexOffset]
     * Index offset to start searching.
     *
     * @return {number|undefined}
     * Index of the first row matching the cell value.
     */
    public getRowIndexBy(
        columnName: string,
        cellValue: DataTable.CellType,
        rowIndexOffset?: number
    ): (number | undefined) {
        const table = this;
        const column = table.columns[columnName];

        if (column) {
            const rowIndex = column.indexOf(cellValue, rowIndexOffset);

            if (rowIndex !== -1) {
                return rowIndex;
            }
        }
    }

    /**
     * Retrieves the row at a given index. This function is a simplified wrap of
     * {@link getRowObjects}.
     *
     * @function Highcharts.DataTable#getRowObject
     *
     * @param {number} rowIndex
     * Row index.
     *
     * @param {Array<string>} [columnNames]
     * Column names and their order to retrieve.
     *
     * @return {Highcharts.DataTableRowObject}
     * Returns the row values, or `undefined` if not found.
     */
    public getRowObject(
        rowIndex: number,
        columnNames?: Array<string>
    ): (DataTable.RowObject | undefined) {
        return this.getRowObjects(rowIndex, 1, columnNames)[0];
    }

    /**
     * Fetches all or a number of rows.
     *
     * @function Highcharts.DataTable#getRowObjects
     *
     * @param {number} [rowIndex]
     * Index of the first row to fetch. Defaults to first row at index `0`.
     *
     * @param {number} [rowCount]
     * Number of rows to fetch. Defaults to maximal number of rows.
     *
     * @param {Array<string>} [columnNames]
     * Column names and their order to retrieve.
     *
     * @return {Highcharts.DataTableRowObject}
     * Returns retrieved rows.
     */
    public getRowObjects(
        rowIndex: number = 0,
        rowCount: number = (this.rowCount - rowIndex),
        columnNames?: Array<string>
    ): (Array<DataTable.RowObject>) {
        const table = this,
            columns = table.columns,
            rows: Array<DataTable.RowObject> = new Array(rowCount);

        columnNames = (columnNames || Object.keys(columns));

        for (
            let i = rowIndex,
                i2 = 0,
                iEnd = Math.min(
                    table.rowCount,
                    (rowIndex + rowCount
                    )
                ),
                column: DataTable.Column,
                row: DataTable.RowObject;
            i < iEnd;
            ++i, ++i2
        ) {
            row = rows[i2] = {};

            for (const columnName of columnNames) {
                column = columns[columnName];
                row[columnName] = (column ? column[i] : void 0);
            }
        }

        return rows;
    }

    /**
     * Fetches all or a number of rows.
     *
     * @function Highcharts.DataTable#getRows
     *
     * @param {number} [rowIndex]
     * Index of the first row to fetch. Defaults to first row at index `0`.
     *
     * @param {number} [rowCount]
     * Number of rows to fetch. Defaults to maximal number of rows.
     *
     * @param {Array<string>} [columnNames]
     * Column names and their order to retrieve.
     *
     * @return {Highcharts.DataTableRow}
     * Returns retrieved rows.
     */
    public getRows(
        rowIndex: number = 0,
        rowCount: number = (this.rowCount - rowIndex),
        columnNames?: Array<string>
    ): (Array<DataTable.Row>) {
        const table = this,
            columns = table.columns,
            rows: Array<DataTable.Row> = new Array(rowCount);

        columnNames = (columnNames || Object.keys(columns));

        for (
            let i = rowIndex,
                i2 = 0,
                iEnd = Math.min(
                    table.rowCount,
                    (rowIndex + rowCount
                    )
                ),
                column: DataTable.Column,
                row: DataTable.Row;
            i < iEnd;
            ++i, ++i2
        ) {
            row = rows[i2] = [];

            for (const columnName of columnNames) {
                column = columns[columnName];
                row.push(column ? column[i] : void 0);
            }
        }

        return rows;
    }

    /**
     * Returns the unique version tag of the current state of the table.
     *
     * @function Highcharts.DataTable#getVersionTag
     *
     * @return {string}
     * Unique version tag.
     */
    public getVersionTag(): string {
        return this.versionTag;
    }

    /**
     * Checks for given column names.
     *
     * @function Highcharts.DataTable#hasColumns
     *
     * @param {Array<string>} columnNames
     * Column names to check.
     *
     * @return {boolean}
     * Returns `true` if all columns have been found, otherwise `false`.
     */
    public hasColumns(columnNames: Array<string>): boolean {
        const table = this,
            columns = table.columns;

        for (
            let i = 0,
                iEnd = columnNames.length,
                columnName: string;
            i < iEnd;
            ++i
        ) {
            columnName = columnNames[i];
            if (!columns[columnName]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Searches for a specific cell value.
     *
     * @function Highcharts.DataTable#hasRowWith
     *
     * @param {string} columnName
     * Column to search in.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Cell value to search for. `NaN` and `undefined` are not supported.
     *
     * @return {boolean}
     * True, if a row has been found, otherwise false.
     */
    public hasRowWith(
        columnName: string,
        cellValue: DataTable.CellType
    ): boolean {
        const table = this;
        const column = table.columns[columnName];

        if (column) {
            return (column.indexOf(cellValue) !== -1);
        }

        return false;
    }

    /**
     * Registers a callback for a specific event.
     *
     * @function Highcharts.DataTable#on
     *
     * @param {string} type
     * Event type as a string.
     *
     * @param {Highcharts.EventCallbackFunction<Highcharts.DataTable>} callback
     * Function to register for an event callback.
     *
     * @return {Function}
     * Function to unregister callback from the event.
     */
    public on<E extends DataEvent>(
        type: E['type'],
        callback: DataEvent.Callback<this, E>
    ): Function {
        return addEvent(this, type, callback);
    }

    /**
     * Renames a column of cell values.
     *
     * @function Highcharts.DataTable#renameColumn
     *
     * @param {string} columnName
     * Name of the column to be renamed.
     *
     * @param {string} newColumnName
     * New name of the column. An existing column with the same name will be
     * replaced.
     *
     * @return {boolean}
     * Returns `true` if successful, `false` if the column was not found.
     */
    public renameColumn(
        columnName: string,
        newColumnName: string
    ): boolean {
        const table = this,
            columns = table.columns;

        if (columns[columnName]) {
            if (columnName !== newColumnName) {
                columns[newColumnName] = columns[columnName];
                delete columns[columnName];
            }

            return true;
        }

        return false;
    }

    /**
     * Sets a cell value based on the row index and column.  Will
     * insert a new column, if not found.
     *
     * @function Highcharts.DataTable#setCell
     *
     * @param {string} columnName
     * Column name to set.
     *
     * @param {number|undefined} rowIndex
     * Row index to set.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Cell value to set.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setCell
     * @emits #afterSetCell
     */
    public setCell(
        columnName: string,
        rowIndex: number,
        cellValue: DataTable.CellType,
        eventDetail?: DataEvent.Detail
    ): void {
        const table = this,
            columns = table.columns,
            modifier = table.modifier;

        let column = columns[columnName];

        if (column && column[rowIndex] === cellValue) {
            return;
        }

        table.emit({
            type: 'setCell',
            cellValue,
            columnName: columnName,
            detail: eventDetail,
            rowIndex
        });

        if (!column) {
            column = columns[columnName] = new Array(table.rowCount);
        }

        if (rowIndex >= table.rowCount) {
            table.rowCount = (rowIndex + 1);
        }

        column[rowIndex] = cellValue;

        if (modifier) {
            modifier.modifyCell(table, columnName, rowIndex, cellValue);
        }

        table.emit({
            type: 'afterSetCell',
            cellValue,
            columnName: columnName,
            detail: eventDetail,
            rowIndex
        });
    }

    /**
     * Sets cell values for multiple columns. Will insert new columns, if not
     * found.
     *
     * @function Highcharts.DataTable#setColumns
     *
     * @param {Highcharts.DataTableColumnCollection} columns
     * Columns as a collection, where the keys are the column names.
     *
     * @param {number} [rowIndex]
     * Index of the first row to change. Keep undefined to reset.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setColumns
     * @emits #afterSetColumns
     */
    public setColumns(
        columns: DataTable.ColumnCollection,
        rowIndex?: number,
        eventDetail?: DataEvent.Detail
    ): void {
        const table = this,
            tableColumns = table.columns,
            tableModifier = table.modifier,
            columnNames = Object.keys(columns);

        let rowCount = table.rowCount;

        table.emit({
            type: 'setColumns',
            columns,
            columnNames,
            detail: eventDetail,
            rowIndex
        });

        if (typeof rowIndex === 'undefined') {
            super.setColumns(
                columns,
                rowIndex,
                extend(eventDetail, { silent: true })
            );
        } else {

            for (
                let i = 0,
                    iEnd = columnNames.length,
                    column: DataTable.Column,
                    columnName: string;
                i < iEnd;
                ++i
            ) {
                columnName = columnNames[i];
                column = columns[columnName];

                const tableColumn: DataTable.Column = (
                    tableColumns[columnName] ?
                        tableColumns[columnName] :
                        tableColumns[columnName] = new Array(table.rowCount)
                );

                for (
                    let i = (rowIndex || 0),
                        iEnd = column.length;
                    i < iEnd;
                    ++i
                ) {
                    tableColumn[i] = column[i];
                }

                rowCount = Math.max(rowCount, tableColumn.length);
            }

            this.applyRowCount(rowCount);
        }

        if (tableModifier) {
            tableModifier.modifyColumns(table, columns, rowIndex || 0);
        }

        table.emit({
            type: 'afterSetColumns',
            columns,
            columnNames,
            detail: eventDetail,
            rowIndex
        });
    }

    /**
     * Sets or unsets the modifier for the table.
     *
     * @param {Highcharts.DataModifier} [modifier]
     * Modifier to set, or `undefined` to unset.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Promise<Highcharts.DataTable>}
     * Resolves to this table if successful, or rejects on failure.
     *
     * @emits #setModifier
     * @emits #afterSetModifier
     */
    public setModifier(
        modifier?: DataModifier,
        eventDetail?: DataEvent.Detail
    ): Promise<this> {
        const table = this;

        let promise: Promise<this>;

        table.emit({
            type: 'setModifier',
            detail: eventDetail,
            modifier,
            modified: table.modified
        });

        table.modified = table;
        table.modifier = modifier;

        if (modifier) {
            promise = modifier.modify(table);
        } else {
            promise = Promise.resolve(table);
        }

        return promise
            .then((table): this => {
                table.emit({
                    type: 'afterSetModifier',
                    detail: eventDetail,
                    modifier,
                    modified: table.modified
                });
                return table;
            })['catch']((error): this => {
                table.emit({
                    type: 'setModifierError',
                    error,
                    modifier,
                    modified: table.modified
                });
                throw error;
            });
    }

    /**
     * Sets the original row indexes for the table. It is used to keep the
     * reference to the original rows when modifying the table.
     *
     * @param {Array<number|undefined>} originalRowIndexes
     * Original row indexes array.
     *
     * @param {boolean} omitLocalRowIndexes
     * Whether to omit the local row indexes calculation. Defaults to `false`.
     */
    public setOriginalRowIndexes(
        originalRowIndexes: Array<number|undefined>,
        omitLocalRowIndexes: boolean = false
    ): void {
        this.originalRowIndexes = originalRowIndexes;
        if (omitLocalRowIndexes) {
            return;
        }

        const modifiedIndexes: number[] = this.localRowIndexes = [];
        for (
            let i = 0,
                iEnd = originalRowIndexes.length,
                originalIndex: number | undefined;
            i < iEnd;
            ++i
        ) {
            originalIndex = originalRowIndexes[i];
            if (defined(originalIndex)) {
                modifiedIndexes[originalIndex] = i;
            }
        }
    }

    /**
     * Sets cell values of a row. Will insert a new row, if no index was
     * provided, or if the index is higher than the total number of table rows.
     *
     * Note: This function is just a simplified wrap of
     * {@link Highcharts.DataTable#setRows}.
     *
     * @function Highcharts.DataTable#setRow
     *
     * @param {Highcharts.DataTableRow|Highcharts.DataTableRowObject} row
     * Cell values to set.
     *
     * @param {number} [rowIndex]
     * Index of the row to set. Leave `undefind` to add as a new row.
     *
     * @param {boolean} [insert]
     * Whether to insert the row at the given index, or to overwrite the row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setRows
     * @emits #afterSetRows
     */
    public setRow(
        row: (DataTable.Row | DataTable.RowObject),
        rowIndex?: number,
        insert?: boolean,
        eventDetail?: DataEvent.Detail
    ): void {
        this.setRows([row], rowIndex, insert, eventDetail);
    }

    /**
     * Sets cell values for multiple rows. Will insert new rows, if no index was
     * was provided, or if the index is higher than the total number of table
     * rows.
     *
     * @function Highcharts.DataTable#setRows
     *
     * @param {Array<(Highcharts.DataTableRow|Highcharts.DataTableRowObject)>} rows
     * Row values to set.
     *
     * @param {number} [rowIndex]
     * Index of the first row to set. Leave `undefined` to add as new rows.
     *
     * @param {boolean} [insert]
     * Whether to insert the row at the given index, or to overwrite the row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setRows
     * @emits #afterSetRows
     */
    public setRows(
        rows: Array<(DataTable.Row | DataTable.RowObject)>,
        rowIndex: number = this.rowCount,
        insert?: boolean,
        eventDetail?: DataEvent.Detail
    ): void {
        const table = this,
            columns = table.columns,
            columnNames = Object.keys(columns),
            modifier = table.modifier,
            rowCount = rows.length;

        table.emit({
            type: 'setRows',
            detail: eventDetail,
            rowCount,
            rowIndex,
            rows
        });

        for (
            let i = 0,
                i2 = rowIndex,
                row: (DataTable.Row | DataTable.RowObject);
            i < rowCount;
            ++i, ++i2
        ) {
            row = rows[i];
            if (row === DataTable.NULL) {
                for (let j = 0, jEnd = columnNames.length; j < jEnd; ++j) {
                    if (insert) {
                        columns[columnNames[j]].splice(i2, 0, null);
                    } else {
                        columns[columnNames[j]][i2] = null;
                    }
                }
            } else if (row instanceof Array) {
                for (let j = 0, jEnd = columnNames.length; j < jEnd; ++j) {
                    columns[columnNames[j]][i2] = row[j];
                }
            } else {
                super.setRow(row, i2, void 0, { silent: true });
            }
        }

        const indexRowCount = insert ?
            rowCount + rows.length :
            rowIndex + rowCount;
        if (indexRowCount > table.rowCount) {
            table.rowCount = indexRowCount;
            for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
                columns[columnNames[i]].length = indexRowCount;
            }
        }

        if (modifier) {
            modifier.modifyRows(table, rows, rowIndex);
        }

        table.emit({
            type: 'afterSetRows',
            detail: eventDetail,
            rowCount,
            rowIndex,
            rows
        });
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

/**
 * Additionally it provides necessary types for events.
 */
namespace DataTable {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Event object for cell-related events.
     */
    export interface CellEvent extends DataEvent {
        readonly type: (
            'setCell' | 'afterSetCell'
        );
        readonly cellValue: CellType;
        readonly columnName: string;
        readonly rowIndex: number;
    }

    /**
     * Possible value types for a table cell.
     */
    export type CellType = (boolean | number | null | string | undefined);

    /**
     * Event object for clone-related events.
     */
    export interface CloneEvent extends DataEvent {
        readonly type: (
            'cloneTable' | 'afterCloneTable'
        );
        readonly tableClone?: DataTable;
    }

    /**
     * Array of table cells in vertical expansion.
     */
    export interface Column extends Array<DataTable.CellType> {
        [index: number]: CellType;
    }

    /**
     * Collection of columns, where the key is the column name and
     * the value is an array of column values.
     */
    export interface ColumnCollection {
        [columnName: string]: Column;
    }

    /**
     * Event object for column-related events.
     */
    export interface ColumnEvent extends DataEvent {
        readonly type: (
            'deleteColumns' | 'afterDeleteColumns' |
            'setColumns' | 'afterSetColumns'
        );
        readonly columns?: ColumnCollection;
        readonly columnNames: Array<string>;
        readonly rowIndex?: number;
    }

    /**
     * All information objects of DataTable events.
     */
    export type Event = (
        CellEvent |
        CloneEvent |
        ColumnEvent |
        SetModifierEvent |
        RowEvent
    );

    /**
     * Event object for modifier-related events.
     */
    export interface ModifierEvent extends DataEvent {
        readonly type: (
            'setModifier' | 'afterSetModifier'
        );
        readonly modifier: (DataModifier | undefined);
    }

    /**
     * Array of table cells in horizontal expansion. Index of the array is the
     * index of the column names.
     */
    export interface Row extends Array<CellType> {
        [index: number]: CellType;
    }

    /**
     * Event object for row-related events.
     */
    export interface RowEvent extends DataEvent {
        readonly type: (
            'deleteRows' | 'afterDeleteRows' |
            'setRows' | 'afterSetRows'
        );
        readonly rowCount: number;
        readonly rowIndex: number;
        readonly rows?: Array<(Row | RowObject)>;
    }

    /**
     * Object of row values, where the keys are the column names.
     */
    export interface RowObject extends Record<string, CellType> {
        [column: string]: CellType;
    }


    /**
    * Event object for the setModifier events.
    */
    export interface SetModifierEvent extends DataEvent {
        readonly type: (
            'setModifier' | 'afterSetModifier' |
            'setModifierError'
        );
        readonly error?: unknown;
        readonly modifier?: DataModifier;
        readonly modified?: DataTable;
    }


}


/* *
 *
 *  Default Export
 *
 * */


export default DataTable;
