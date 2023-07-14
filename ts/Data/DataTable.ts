/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *  - Gøran Slettemark
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

import U from '../Core/Utilities.js';
const {
    addEvent,
    fireEvent,
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
 * @private
 * @class
 * @name Highcharts.DataTable
 *
 * @param {Highcharts.DataTableOptions} [options]
 * Options to initialize the new DataTable instance.
 */
class DataTable implements DataEvent.Emitter {

    /* *
     *
     *  Static Functions
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
        row: (DataTable.Row|DataTable.RowObject)
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

    /**
     * Constructs an instance of the DataTable class.
     *
     * @param {Highcharts.DataTableOptions} [options]
     * Options to initialize the new DataTable instance.
     */
    public constructor(
        options: DataTable.Options = {}
    ) {

        this.aliases = {};

        /**
         * Whether the ID was automatic generated or given in the constructor.
         *
         * @name Highcharts.DataTable#autoId
         * @type {boolean}
         */
        this.autoId = !options.id;
        this.columns = {};

        /**
         * ID of the table for indentification purposes.
         *
         * @name Highcharts.DataTable#id
         * @type {string}
         */
        this.id = (options.id || uniqueKey());
        this.modified = this;
        this.rowCount = 0;
        this.versionTag = uniqueKey();

        const columns = options.columns || {},
            columnNames = Object.keys(columns),
            thisColumns = this.columns;

        let rowCount = 0;

        for (
            let i = 0,
                iEnd = columnNames.length,
                column: DataTable.Column,
                columnName: string;
            i < iEnd;
            ++i
        ) {
            columnName = columnNames[i];
            column = columns[columnName].slice();
            thisColumns[columnName] = column;
            rowCount = Math.max(rowCount, column.length);
        }

        for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
            thisColumns[columnNames[i]].length = rowCount;
        }

        this.rowCount = rowCount;

        const aliases = options.aliases || {},
            aliasKeys = Object.keys(aliases),
            thisAliases = this.aliases;

        for (
            let i = 0,
                iEnd = aliasKeys.length,
                alias: string;
            i < iEnd;
            ++i
        ) {
            alias = aliasKeys[i];
            thisAliases[alias] = aliases[alias];
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Mapping aliases to column names.
     * @private
     */
    private readonly aliases: DataTable.ColumnAliases;

    public readonly autoId: boolean;

    private columns: Record<string, DataTable.Column>;

    public readonly id: string;

    public modified: DataTable;

    private modifier?: DataModifier;

    private rowCount: number;

    private versionTag: string;

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
            tableOptions: DataTable.Options = {};

        table.emit({ type: 'cloneTable', detail: eventDetail });

        if (!skipColumns) {
            tableOptions.aliases = table.aliases;
            tableOptions.columns = table.columns;
        }

        if (!table.autoId) {
            tableOptions.id = table.id;
        }

        const tableClone: DataTable = new DataTable(tableOptions);

        if (!skipColumns) {
            tableClone.versionTag = table.versionTag;
        }

        table.emit({
            type: 'afterCloneTable',
            detail: eventDetail,
            tableClone
        });

        return tableClone;
    }

    /**
     * Deletes a column alias and returns the original column name. If the alias
     * is not found, the method returns `undefined`. Deleting an alias does not
     * affect the data in the table, only the way columns are accessed.
     *
     * @function Highcharts.DataTable#deleteColumnAlias
     *
     * @param {string} alias
     * The alias to delete.
     *
     * @return {string|undefined}
     * Returns the original column name, if found.
     */
    public deleteColumnAlias(alias: string): (string|undefined) {
        const table = this,
            aliases = table.aliases,
            deletedAlias = aliases[alias],
            modifier = table.modifier;

        if (deletedAlias) {
            delete table.aliases[alias];
            if (modifier) {
                modifier.modifyColumns(
                    table,
                    { [deletedAlias]: new Array(table.rowCount) },
                    0
                );
            }
        }

        return deletedAlias;
    }

    /**
     * Deletes columns from the table.
     *
     * @function Highcharts.DataTable#deleteColumns
     *
     * @param {Array<string>} [columnNames]
     * Names (no alias) of columns to delete. If no array is provided, all
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
    ): (DataTable.ColumnCollection|undefined) {
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
        const table = this;

        switch (e.type) {
            case 'afterDeleteColumns':
            case 'afterDeleteRows':
            case 'afterSetCell':
            case 'afterSetColumns':
            case 'afterSetRows':
                table.versionTag = uniqueKey();
                break;
            default:
        }

        fireEvent(table, e.type, e);
    }

    /**
     * Fetches a single cell value.
     *
     * @function Highcharts.DataTable#getCell
     *
     * @param {string} columnNameOrAlias
     * Column name or alias of the cell to retrieve.
     *
     * @param {number} rowIndex
     * Row index of the cell to retrieve.
     *
     * @return {Highcharts.DataTableCellType|undefined}
     * Returns the cell value or `undefined`.
     */
    public getCell(
        columnNameOrAlias: string,
        rowIndex: number
    ): (DataTable.CellType|undefined) {
        const table = this;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = table.columns[columnNameOrAlias];

        if (column) {
            return column[rowIndex];
        }
    }

    /**
     * Fetches a cell value for the given row as a boolean.
     *
     * @function Highcharts.DataTable#getCellAsBoolean
     *
     * @param {string} columnNameOrAlias
     * Column name or alias to fetch.
     *
     * @param {number} rowIndex
     * Row index to fetch.
     *
     * @return {boolean}
     * Returns the cell value of the row as a boolean.
     */
    public getCellAsBoolean(
        columnNameOrAlias: string,
        rowIndex: number
    ): boolean {
        const table = this;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = table.columns[columnNameOrAlias];

        return !!(column && column[rowIndex]);
    }

    public getCellAsNumber(
        columnNameOrAlias: string,
        rowIndex: number,
        useNaN: true
    ): number;
    public getCellAsNumber(
        columnNameOrAlias: string,
        rowIndex: number,
        useNaN?: false
    ): (number|null);
    /**
     * Fetches a cell value for the given row as a number.
     *
     * @function Highcharts.DataTable#getCellAsNumber
     *
     * @param {string} columnNameOrAlias
     * Column name or alias to fetch.
     *
     * @param {number} rowIndex
     * Row index to fetch.
     *
     * @param {boolean} [useNaN]
     * Whether to return NaN instead of `null` and `undefined`.
     *
     * @return {number|null}
     * Returns the cell value of the row as a number.
     */
    public getCellAsNumber(
        columnNameOrAlias: string,
        rowIndex: number,
        useNaN?: boolean
    ): (number|null) {
        const table = this;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = table.columns[columnNameOrAlias];

        let cellValue = (column && column[rowIndex]);

        switch (typeof cellValue) {
            case 'boolean':
                return (cellValue ? 1 : 0);
            case 'number':
                return (isNaN(cellValue) && !useNaN ? null : cellValue);
        }

        cellValue = parseFloat(`${cellValue}`);

        return (isNaN(cellValue) && !useNaN ? null : cellValue);
    }

    /**
     * Fetches a cell value for the given row as a string.
     *
     * @function Highcharts.DataTable#getCellAsString
     *
     * @param {string} columnNameOrAlias
     * Column name or alias to fetch.
     *
     * @param {number} rowIndex
     * Row index to fetch.
     *
     * @return {string}
     * Returns the cell value of the row as a string.
     */
    public getCellAsString(
        columnNameOrAlias: string,
        rowIndex: number
    ): string {
        const table = this;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = table.columns[columnNameOrAlias];

        return `${(column && column[rowIndex])}`;
    }

    public getColumn(
        columnNameOrAlias: string,
        asReference?: boolean
    ): (DataTable.Column|undefined);
    public getColumn(
        columnNameOrAlias: string,
        asReference: true
    ): (DataTable.Column|undefined);
    /**
     * Fetches the given column by the canonical column name or by an alias.
     * This function is a simplified wrap of {@link getColumns}.
     *
     * @function Highcharts.DataTable#getColumn
     *
     * @param {string} columnNameOrAlias
     * Name or alias of the column to get, alias takes precedence.
     *
     * @param {boolean} [asReference]
     * Whether to return the column as a readonly reference.
     *
     * @return {Highcharts.DataTableColumn|undefined}
     * A copy of the column, or `undefined` if not found.
     */
    public getColumn(
        columnNameOrAlias: string,
        asReference?: boolean
    ): (DataTable.Column|undefined) {
        return this.getColumns(
            [columnNameOrAlias],
            asReference
        )[columnNameOrAlias];
    }

    /**
     * Fetches all column aliases and their mapped columns.
     *
     * @function Highcharts.DataTable#getColumnAliases
     *
     * @return {Highcharts.Dictionary<string>}
     * Returns all column aliases.
     */
    public getColumnAliases(): DataTable.ColumnAliases {
        const aliases = this.aliases,
            aliasKeys = Object.keys(aliases),
            columnAliases: DataTable.ColumnAliases = {};

        for (
            let i = 0,
                iEnd = aliasKeys.length,
                alias: string;
            i < iEnd;
            ++i
        ) {
            alias = aliasKeys[i];
            columnAliases[alias] = aliases[alias];
        }

        return columnAliases;
    }

    public getColumnAsNumbers(
        columnNameOrAlias: string,
        useNaN: true
    ): Array<number>;
    public getColumnAsNumbers(
        columnNameOrAlias: string,
        useNaN?: false
    ): Array<(number|null)>;
    /**
     * Fetches the given column by the canonical column name or by an alias, and
     * validates the type of the first few cells. If the first defined cell is
     * of type number, it assumes for performance reasons, that all cells are of
     * type number or `null`. Otherwise it will convert all cells to number
     * type, except `null`.
     *
     * @function Highcharts.DataTable#getColumnAsNumbers
     *
     * @param {string} columnNameOrAlias
     * Name or alias of the column to get, alias takes precedence.
     *
     * @param {boolean} [useNaN]
     * Whether to use NaN instead of `null` and `undefined`.
     *
     * @return {Array<(number|null)>}
     * A copy of the column, or an empty array if not found.
     */
    public getColumnAsNumbers(
        columnNameOrAlias: string,
        useNaN?: boolean
    ): Array<(number|null)> {
        const table = this,
            columns = table.columns;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = columns[columnNameOrAlias],
            columnAsNumber: Array<(number|null)> = [];

        if (column) {
            const columnLength = column.length;

            if (useNaN) {
                for (let i = 0; i < columnLength; ++i) {
                    columnAsNumber.push(
                        table.getCellAsNumber(columnNameOrAlias, i, true)
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
                        // assume unmixed data for performance reasons
                        return column.slice() as Array<(number|null)>;
                    }
                    if (
                        cellValue !== null &&
                        typeof cellValue !== 'undefined'
                    ) {
                        break;
                    }
                }
                for (let i = 0; i < columnLength; ++i) {
                    columnAsNumber.push(table.getCellAsNumber(
                        columnNameOrAlias,
                        i
                    ));
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
        columnNamesOrAliases?: Array<string>,
        asReference?: boolean
    ): DataTable.ColumnCollection;
    public getColumns(
        columnNamesOrAliases: (Array<string>|undefined),
        asReference: true
    ): Record<string, DataTable.Column>;
    /**
     * Retrieves all or the given columns.
     *
     * @function Highcharts.DataTable#getColumns
     *
     * @param {Array<string>} [columnNamesOrAliases]
     * Column names or aliases to retrieve. Aliases taking precedence.
     *
     * @param {boolean} [asReference]
     * Whether to return columns as a readonly reference.
     *
     * @return {Highcharts.DataTableColumnCollection}
     * Collection of columns. If a requested column was not found, it is
     * `undefined`.
     */
    public getColumns(
        columnNamesOrAliases?: Array<string>,
        asReference?: boolean
    ): DataTable.ColumnCollection {
        const table = this,
            tableAliasMap = table.aliases,
            tableColumns = table.columns,
            columns: DataTable.ColumnCollection = {};

        columnNamesOrAliases = (
            columnNamesOrAliases || Object.keys(tableColumns)
        );

        for (
            let i = 0,
                iEnd = columnNamesOrAliases.length,
                column: DataTable.Column,
                columnName: string;
            i < iEnd;
            ++i
        ) {
            columnName = columnNamesOrAliases[i];
            column = tableColumns[(tableAliasMap[columnName] || columnName)];

            if (column) {
                columns[columnName] = (asReference ? column : column.slice());
            }
        }

        return columns;
    }

    /**
     * Retrieves the modifier for the table.
     * @private
     *
     * @return {Highcharts.DataModifier|undefined}
     * Returns the modifier or `undefined`.
     */
    public getModifier(): (DataModifier|undefined) {
        return this.modifier;
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
     * @param {Array<string>} [columnNamesOrAliases]
     * Column names or aliases in order to retrieve.
     *
     * @return {Highcharts.DataTableRow}
     * Returns the row values, or `undefined` if not found.
     */
    public getRow(
        rowIndex: number,
        columnNamesOrAliases?: Array<string>
    ): (DataTable.Row|undefined) {
        return this.getRows(rowIndex, 1, columnNamesOrAliases)[0];
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
     * @param {string} columnNameOrAlias
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
        columnNameOrAlias: string,
        cellValue: DataTable.CellType,
        rowIndexOffset?: number
    ): (number|undefined) {
        const table = this;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = table.columns[columnNameOrAlias];

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
     * @param {Array<string>} [columnNamesOrAliases]
     * Column names or aliases and their order to retrieve.
     *
     * @return {Highcharts.DataTableRowObject}
     * Returns the row values, or `undefined` if not found.
     */
    public getRowObject(
        rowIndex: number,
        columnNamesOrAliases?: Array<string>
    ): (DataTable.RowObject|undefined) {
        return this.getRowObjects(rowIndex, 1, columnNamesOrAliases)[0];
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
     * @param {Array<string>} [columnNamesOrAliases]
     * Column names or aliases and their order to retrieve.
     *
     * @return {Highcharts.DataTableRowObject}
     * Returns retrieved rows.
     */
    public getRowObjects(
        rowIndex: number = 0,
        rowCount: number = (this.rowCount - rowIndex),
        columnNamesOrAliases?: Array<string>
    ): (Array<DataTable.RowObject>) {
        const table = this,
            aliases = table.aliases,
            columns = table.columns,
            rows: Array<DataTable.RowObject> = new Array(rowCount);

        columnNamesOrAliases = (columnNamesOrAliases || Object.keys(columns));

        for (
            let i = rowIndex,
                i2 = 0,
                iEnd = Math.min(
                    table.rowCount,
                    (rowIndex + rowCount)
                ),
                column: DataTable.Column,
                row: DataTable.RowObject;
            i < iEnd;
            ++i, ++i2
        ) {
            row = rows[i2] = {};

            for (const columnName of columnNamesOrAliases) {
                column = columns[(aliases[columnName] || columnName)];
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
     * @param {Array<string>} [columnNamesOrAliases]
     * Column names or aliases and their order to retrieve.
     *
     * @return {Highcharts.DataTableRow}
     * Returns retrieved rows.
     */
    public getRows(
        rowIndex: number = 0,
        rowCount: number = (this.rowCount - rowIndex),
        columnNamesOrAliases?: Array<string>
    ): (Array<DataTable.Row>) {
        const table = this,
            aliases = table.aliases,
            columns = table.columns,
            rows: Array<DataTable.Row> = new Array(rowCount);

        columnNamesOrAliases = (columnNamesOrAliases || Object.keys(columns));

        for (
            let i = rowIndex,
                i2 = 0,
                iEnd = Math.min(
                    table.rowCount,
                    (rowIndex + rowCount)
                ),
                column: DataTable.Column,
                row: DataTable.Row;
            i < iEnd;
            ++i, ++i2
        ) {
            row = rows[i2] = [];

            for (const columnName of columnNamesOrAliases) {
                column = columns[(aliases[columnName] || columnName)];
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
     * Checks for given column names or aliases.
     *
     * @function Highcharts.DataTable#hasColumns
     *
     * @param {Array<string>} columnNamesOrAliases
     * Column names of aliases to check.
     *
     * @return {boolean}
     * Returns `true` if all columns have been found, otherwise `false`.
     */
    public hasColumns(columnNamesOrAliases: Array<string>): boolean {
        const table = this,
            aliases = table.aliases,
            columns = table.columns;

        for (
            let i = 0,
                iEnd = columnNamesOrAliases.length,
                columnName: string;
            i < iEnd;
            ++i
        ) {
            columnName = columnNamesOrAliases[i];
            if (!columns[columnName] && !aliases[columnName]) {
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
     * @param {string} columnNameOrAlias
     * Column to search in.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Cell value to search for. `NaN` and `undefined` are not supported.
     *
     * @return {boolean}
     * True, if a row has been found, otherwise false.
     */
    public hasRowWith(
        columnNameOrAlias: string,
        cellValue: DataTable.CellType
    ): boolean {
        const table = this;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        const column = table.columns[columnNameOrAlias];

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
                const aliases = table.aliases;

                if (aliases[newColumnName]) {
                    delete aliases[newColumnName];
                }

                columns[newColumnName] = columns[columnName];
                delete columns[columnName];
            }

            return true;
        }

        return false;
    }

    /**
     * Sets a cell value based on the row index and column name or alias.  Will
     * insert a new column, if not found.
     *
     * @function Highcharts.DataTable#setCell
     *
     * @param {string} columnNameOrAlias
     * Column name or alias to set.
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
        columnNameOrAlias: string,
        rowIndex: number,
        cellValue: DataTable.CellType,
        eventDetail?: DataEvent.Detail
    ): void {
        const table = this,
            columns = table.columns,
            modifier = table.modifier;

        columnNameOrAlias = (
            table.aliases[columnNameOrAlias] ||
            columnNameOrAlias
        );

        let column = columns[columnNameOrAlias];

        if (column && column[rowIndex] === cellValue) {
            return;
        }

        table.emit({
            type: 'setCell',
            cellValue,
            columnName: columnNameOrAlias,
            detail: eventDetail,
            rowIndex
        });

        if (!column) {
            column = columns[columnNameOrAlias] = new Array(table.rowCount);
        }

        if (rowIndex >= table.rowCount) {
            table.rowCount = (rowIndex + 1);
        }

        column[rowIndex] = cellValue;

        if (modifier) {
            modifier.modifyCell(table, columnNameOrAlias, rowIndex, cellValue);
        }

        table.emit({
            type: 'afterSetCell',
            cellValue,
            columnName: columnNameOrAlias,
            detail: eventDetail,
            rowIndex
        });
    }

    /**
     * Sets cell values for a column. Will insert a new column, if not found.
     *
     * @function Highcharts.DataTable#setColumn
     *
     * @param {string} columnNameOrAlias
     * Column name or alias to set.
     *
     * @param {Highcharts.DataTableColumn} [column]
     * Values to set in the column.
     *
     * @param {number} [rowIndex=0]
     * Index of the first row to change. (Default: 0)
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setColumns
     * @emits #afterSetColumns
     */
    public setColumn(
        columnNameOrAlias: string,
        column: DataTable.Column = [],
        rowIndex: number = 0,
        eventDetail?: DataEvent.Detail
    ): void {
        this.setColumns({ [columnNameOrAlias]: column }, rowIndex, eventDetail);
    }

    /**
     * Defines an alias for a column. If a column name for one of the
     * get-functions matches an column alias, the column name will be replaced
     * with the original column name.
     *
     * @function Highcharts.DataTable#setColumnAlias
     *
     * @param {string} columnAlias
     * Column alias to create.
     *
     * @param {string} columnName
     * Original column name to create an alias for.
     *
     * @return {boolean}
     * `true` if successfully changed, `false` if reserved.
     */
    public setColumnAlias(
        columnAlias: string,
        columnName: string
    ): boolean {
        const aliases = this.aliases;

        if (!aliases[columnAlias]) {
            aliases[columnAlias] = columnName;
            return true;
        }

        return false;
    }

    /**
     * Sets cell values for multiple columns. Will insert new columns, if not
     * found.
     *
     * @function Highcharts.DataTable#setColumns
     *
     * @param {Highcharts.DataTableColumnCollection} columns
     * Columns as a collection, where the keys are the column names or aliases.
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
            tableRowCount = table.rowCount,
            reset = (typeof rowIndex === 'undefined'),
            columnNames = Object.keys(columns);

        table.emit({
            type: 'setColumns',
            columns,
            columnNames,
            detail: eventDetail,
            rowIndex
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
            columnName = (
                table.aliases[columnName] ||
                columnName
            );

            if (reset) {
                tableColumns[columnName] = column.slice();
                table.rowCount = column.length;
            } else {
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

                table.rowCount = Math.max(table.rowCount, tableColumn.length);
            }
        }

        const tableColumnNames = Object.keys(tableColumns);

        for (let i = 0, iEnd = tableColumnNames.length; i < iEnd; ++i) {
            tableColumns[tableColumnNames[i]].length = table.rowCount;
        }

        if (tableModifier) {
            tableModifier.modifyColumns(table, columns, (rowIndex || 0));
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
     * @private
     *
     * @param {Highcharts.DataModifier} [modifier]
     * Modifier to set, or `undefined` to unset.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Promise<Highcharts.DataTable>}
     * Resolves to this table if successfull, or rejects on failure.
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
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setRows
     * @emits #afterSetRows
     */
    public setRow(
        row: (DataTable.Row|DataTable.RowObject),
        rowIndex?: number,
        eventDetail?: DataEvent.Detail
    ): void {
        this.setRows([row], rowIndex, eventDetail);
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
     * Index of the first row to set. Leave `undefind` to add as new rows.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits #setRows
     * @emits #afterSetRows
     */
    public setRows(
        rows: Array<(DataTable.Row|DataTable.RowObject)>,
        rowIndex: number = this.rowCount,
        eventDetail?: DataEvent.Detail
    ): void {
        const table = this,
            aliases = table.aliases,
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
                row: (DataTable.Row|DataTable.RowObject);
            i < rowCount;
            ++i, ++i2
        ) {
            row = rows[i];
            if (row === DataTable.NULL) {
                for (let j = 0, jEnd = columnNames.length; j < jEnd; ++j) {
                    columns[columnNames[j]][i2] = null;
                }
            } else if (row instanceof Array) {
                for (let j = 0, jEnd = columnNames.length; j < jEnd; ++j) {
                    columns[columnNames[j]][i2] = row[j];
                }
            } else {
                const rowColumnNames = Object.keys(row);
                for (
                    let j = 0,
                        jEnd = rowColumnNames.length,
                        rowColumnName: string;
                    j < jEnd;
                    ++j
                ) {
                    rowColumnName = rowColumnNames[j];
                    rowColumnName = (aliases[rowColumnName] || rowColumnName);
                    if (!columns[rowColumnName]) {
                        columns[rowColumnName] = new Array(i2 + 1);
                    }
                    columns[rowColumnName][i2] = row[rowColumnName];
                }
            }
        }

        const indexRowCount = (rowIndex + rowCount);
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
            'setCell'|'afterSetCell'
        );
        readonly cellValue: CellType;
        readonly columnName: string;
        readonly rowIndex: number;
    }

    /**
     * Possible value types for a table cell.
     */
    export type CellType = (boolean|number|null|string|undefined);

    /**
     * Event object for clone-related events.
     */
    export interface CloneEvent extends DataEvent {
        readonly type: (
            'cloneTable'|'afterCloneTable'
        );
        readonly tableClone?: DataTable;
    }

    /**
     * Array of table cells in vertical expansion.
     */
    export interface Column extends Array<CellType> {
        [index: number]: CellType;
    }

    /**
     * Map of column alias to column name.
     */
    export type ColumnAliases = Record<string, string>;

    /**
     * Collection of columns, where the key is the column name (or alias) and
     * the value is an array of column values.
     */
    export interface ColumnCollection {
        [columnNameOrAlias: string]: Column;
    }

    /**
     * Event object for column-related events.
     */
    export interface ColumnEvent extends DataEvent {
        readonly type: (
            'deleteColumns'|'afterDeleteColumns'|
            'setColumns'|'afterSetColumns'
        );
        readonly columns?: ColumnCollection;
        readonly columnNames: Array<string>;
        readonly rowIndex?: number;
    }

    /**
     * All information objects of DataTable events.
     */
    export type Event = (
        CellEvent|
        CloneEvent|
        ColumnEvent|
        SetModifierEvent|
        RowEvent
    );

    /**
     * Event object for modifier-related events.
     */
    export interface ModifierEvent extends DataEvent {
        readonly type: (
            'setModifier'|'afterSetModifier'
        );
        readonly modifier: (DataModifier|undefined);
    }

    /**
     * Options to initialize a new DataTable instance.
     */
    export interface Options {

        /**
         * Initial map of column aliases to original column names.
         */
        aliases?: ColumnAliases;

        /**
         * Initial columns with their values.
         */
        columns?: ColumnCollection;

        /**
         * Custom ID to identify the new DataTable instance.
         */
        id?: string;
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
            'deleteRows'|'afterDeleteRows'|
            'setRows'|'afterSetRows'
        );
        readonly rowCount: number;
        readonly rowIndex: number;
        readonly rows?: Array<(Row|RowObject)>;
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
            'setModifier'|'afterSetModifier'|
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

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Possible value types for a table cell.
 * @private
 * @typedef {boolean|null|number|string|Highcharts.DataTable|undefined} Highcharts.DataTableCellType
 */

/**
 * Array of table cells in vertical expansion.
 * @private
 * @typedef {Array<Highcharts.DataTableCellType>} Highcharts.DataTableColumn
 */

/**
 * Collection of columns, where the key is the column name (or alias) and
 * the value is an array of column values.
 * @private
 * @interface Highcharts.DataTableColumnCollection
 * @readonly
 *//**
 * @name Highcharts.DataTableColumnCollection#[key:string]
 * @type {Highcharts.DataTableColumn}
 */

/**
 * Options to initialize a new DataTable instance.
 * @private
 * @interface Highcharts.DataTableOptions
 * @readonly
 *//**
 * Initial map of column aliases to original column names.
 * @name Highcharts.DataTableOptions#aliases
 * @type {Highcharts.Dictionary<string>|undefined}
 *//**
 * Initial columns with their values.
 * @name Highcharts.DataTableOptions#columns
 * @type {Highcharts.DataTableColumnCollection|undefined}
 *//**
 * Custom ID to identify the new DataTable instance.
 * @name Highcharts.DataTableOptions#id
 * @type {string|undefined}
 */

/**
 * Custom information for an event.
 * @private
 * @typedef Highcharts.DataTableEventDetail
 * @type {Record<string,(boolean|number|string|null|undefined)>}
 */

/**
 * Array of table cells in horizontal expansion. Index of the array is the index
 * of the column names.
 * @private
 * @typedef {Array<Highcharts.DataTableCellType>} Highcharts.DataTableRow
 */

/**
 * Record of table cells in horizontal expansion. Keys of the record are the
 * column names (or aliases).
 * @private
 * @typedef {Record<string,Highcharts.DataTableCellType>} Highcharts.DataTableRowObject
 */

(''); // keeps doclets above in transpiled file
