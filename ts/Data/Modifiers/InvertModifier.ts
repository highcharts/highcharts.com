/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Wojciech Chmiel
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type DataEvent from '../DataEvent';
import type InvertModifierOptions from './InvertModifierOptions';

import DataModifier from './DataModifier.js';
import DataTable from '../DataTable.js';

import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
/* *
 *
 *  Class
 *
 * */

/**
 * Inverts columns and rows in a table.
 *
 * @private
 */
class InvertModifier extends DataModifier {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options for the invert modifier.
     */
    public static readonly defaultOptions: InvertModifierOptions = {
        type: 'Invert'
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the invert modifier.
     *
     * @param {Partial<InvertModifier.Options>} [options]
     * Options to configure the invert modifier.
     */
    public constructor(
        options?: Partial<InvertModifierOptions>
    ) {
        super();

        this.options = merge(InvertModifier.defaultOptions, options);
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Options of the invert modifier.
     */
    public options: InvertModifierOptions;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Applies partial modifications of a cell change to the property `modified`
     * of the given modified table.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {string} columnName
     * Column name of changed cell.
     *
     * @param {number|undefined} rowIndex
     * Row index of changed cell.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Changed cell value.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Table with `modified` property as a reference.
     */
    public modifyCell<T extends DataTable>(
        table: T,
        columnName: string,
        rowIndex: number,
        cellValue: DataTable.CellType,
        eventDetail?: DataEvent.Detail
    ): T {
        const modified = table.modified,
            modifiedRowIndex = modified.getRowIndexBy(
                'columnNames',
                columnName
            );

        if (typeof modifiedRowIndex === 'undefined') {
            modified.setColumns(
                this.modifyTable(table.clone()).getColumns(),
                void 0,
                eventDetail
            );
        } else {
            modified.setCell(
                `${rowIndex}`,
                modifiedRowIndex,
                cellValue,
                eventDetail
            );
        }

        return table;
    }

    /**
     * Applies partial modifications of column changes to the property
     * `modified` of the given table.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {Highcharts.DataTableColumnCollection} columns
     * Changed columns as a collection, where the keys are the column names.
     *
     * @param {number} [rowIndex=0]
     * Index of the first changed row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Table with `modified` property as a reference.
     */
    public modifyColumns<T extends DataTable>(
        table: T,
        columns: DataTable.ColumnCollection,
        rowIndex: number,
        eventDetail?: DataEvent.Detail
    ): T {
        const modified = table.modified,
            modifiedColumnNames = (modified.getColumn('columnNames') || []);

        let columnNames = table.getColumnNames(),
            reset = (table.getRowCount() !== modifiedColumnNames.length);

        if (!reset) {
            for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
                if (columnNames[i] !== modifiedColumnNames[i]) {
                    reset = true;
                    break;
                }
            }
        }

        if (reset) {
            return this.modifyTable(table, eventDetail);
        }

        columnNames = Object.keys(columns);

        for (
            let i = 0,
                iEnd = columnNames.length,
                column: DataTable.Column,
                columnName: string,
                modifiedRowIndex: (number|undefined);
            i < iEnd;
            ++i
        ) {
            columnName = columnNames[i];
            column = columns[columnName];
            modifiedRowIndex = (
                modified.getRowIndexBy('columnNames', columnName) ||
                modified.getRowCount()
            );

            for (
                let j = 0,
                    j2 = rowIndex,
                    jEnd = column.length;
                j < jEnd;
                ++j, ++j2
            ) {
                modified.setCell(
                    `${j2}`,
                    modifiedRowIndex,
                    column[j],
                    eventDetail
                );
            }
        }

        return table;
    }

    /**
     * Applies partial modifications of row changes to the property `modified`
     * of the given table.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {Array<(Highcharts.DataTableRow|Highcharts.DataTableRowObject)>} rows
     * Changed rows.
     *
     * @param {number} [rowIndex]
     * Index of the first changed row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Table with `modified` property as a reference.
     */
    public modifyRows<T extends DataTable>(
        table: T,
        rows: Array<(DataTable.Row|DataTable.RowObject)>,
        rowIndex: number,
        eventDetail?: DataEvent.Detail
    ): T {
        const columnNames = table.getColumnNames(),
            modified = table.modified,
            modifiedColumnNames = (modified.getColumn('columnNames') || []);

        let reset = (table.getRowCount() !== modifiedColumnNames.length);

        if (!reset) {
            for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
                if (columnNames[i] !== modifiedColumnNames[i]) {
                    reset = true;
                    break;
                }
            }
        }

        if (reset) {
            return this.modifyTable(table, eventDetail);
        }

        for (
            let i = 0,
                i2 = rowIndex,
                iEnd = rows.length,
                row: (DataTable.Row|DataTable.RowObject);
            i < iEnd;
            ++i, ++i2
        ) {
            row = rows[i];

            if (row instanceof Array) {
                modified.setColumn(`${i2}`, row);
            } else {
                for (let j = 0, jEnd = columnNames.length; j < jEnd; ++j) {
                    modified.setCell(
                        `${i2}`,
                        j,
                        row[columnNames[j]],
                        eventDetail
                    );
                }
            }
        }

        return table;
    }

    /**
     * Inverts rows and columns in the table.
     *
     * @param {DataTable} table
     * Table to invert.
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {DataTable}
     * Table with inverted `modified` property as a reference.
     */
    public modifyTable<T extends DataTable>(
        table: T,
        eventDetail?: DataEvent.Detail
    ): T {
        const modifier = this;

        modifier.emit({ type: 'modify', detail: eventDetail, table });

        const modified = table.modified;

        if (table.hasColumns(['columnNames'])) { // inverted table
            const columnNames: Array<string> = (
                    (table.deleteColumns(['columnNames']) || {})
                        .columnNames || []
                ).map(
                    (column): string => `${column}`
                ),
                columns: DataTable.ColumnCollection = {};

            for (
                let i = 0,
                    iEnd = table.getRowCount(),
                    row: (DataTable.Row|undefined);
                i < iEnd;
                ++i
            ) {
                row = table.getRow(i);
                if (row) {
                    columns[columnNames[i]] = row;
                }
            }

            modified.deleteColumns();
            modified.setColumns(columns);

        } else { // regular table
            const columns: DataTable.ColumnCollection = {};

            for (
                let i = 0,
                    iEnd = table.getRowCount(),
                    row: (DataTable.Row|undefined);
                i < iEnd;
                ++i
            ) {
                row = table.getRow(i);
                if (row) {
                    columns[`${i}`] = row;
                }
            }
            columns.columnNames = table.getColumnNames();

            modified.deleteColumns();
            modified.setColumns(columns);
        }

        modifier.emit({ type: 'afterModify', detail: eventDetail, table });

        return table;
    }

}


/* *
 *
 *  Registry
 *
 * */


declare module './DataModifierType' {
    interface DataModifierTypes {
        Invert: typeof InvertModifier;
    }
}

DataModifier.registerType('Invert', InvertModifier);


/* *
 *
 *  Default Export
 *
 * */


export default InvertModifier;
