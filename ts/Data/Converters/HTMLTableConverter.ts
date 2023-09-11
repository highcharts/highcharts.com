/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Torstein Hønsi
 *  - Gøran Slettemark
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
import type DataConnector from '../Connectors/DataConnector';

import DataConverter from './DataConverter.js';
import DataTable from '../DataTable.js';

import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
/* *
 *
 *  Functions
 *
 * */

/**
 * Row equal
 */
function isRowEqual(
    row1: Array<(number|string|undefined)>,
    row2: Array<(number|string|undefined)>
): boolean {
    let i = row1.length;

    if (row2.length === i) {
        while (--i) {
            if (row1[i] !== row2[i]) {
                return false;
            }
        }
    } else {
        return false;
    }

    return true;
}

/* *
 *
 *  Class
 *
 * */

/**
 * Handles parsing and transformation of an HTML table to a table.
 *
 * @private
 */
class HTMLTableConverter extends DataConverter {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options
     */
    protected static readonly defaultOptions: HTMLTableConverter.Options = {
        ...DataConverter.defaultOptions,
        useRowspanHeaders: true,
        useMultiLevelHeaders: true
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the HTMLTableConverter.
     *
     * @param {HTMLTableConverter.UserOptions} [options]
     * Options for the HTMLTableConverter.
     */
    constructor(
        options?: HTMLTableConverter.UserOptions
    ) {
        const mergedOptions = merge(HTMLTableConverter.defaultOptions, options);

        super(mergedOptions);

        this.columns = [];
        this.headers = [];
        this.options = mergedOptions;

        if (mergedOptions.tableElement) {
            this.tableElement = mergedOptions.tableElement;
            this.tableElementID = mergedOptions.tableElement.id;
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    private columns: DataTable.CellType[][];
    private headers: string[];

    /**
     * Options for the DataConverter.
     */
    public readonly options: HTMLTableConverter.Options;

    public tableElement?: HTMLElement;
    public tableElementID?: string;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Exports the dataconnector as an HTML string, using the options
     * provided on import unless other options are provided.
     *
     * @param {DataConnector} connector
     * Connector instance to export from.
     *
     * @param {HTMLTableConnector.ExportOptions} [options]
     * Options that override default or existing export options.
     *
     * @return {string}
     * HTML from the current dataTable.
     */
    public export(
        connector: DataConnector,
        options: HTMLTableConverter.Options = this.options
    ): string {
        const exportNames = (options.firstRowAsNames !== false),
            useMultiLevelHeaders = options.useMultiLevelHeaders;

        const columns =
                connector.getSortedColumns(options.usePresentationOrder),
            columnNames = Object.keys(columns),
            htmlRows: Array<string> = [],
            columnsCount = columnNames.length;

        const rowArray: Array<DataTable.Row> = [];

        let tableHead = '';

        // Add the names as the first row if they should be exported
        if (exportNames) {
            const subcategories: (string|undefined)[] = [];

            // If using multilevel headers, the first value
            // of each column is a subcategory
            if (useMultiLevelHeaders) {
                for (const name of columnNames) {
                    const subhead = (columns[name].shift() || '').toString();
                    subcategories.push(subhead);
                }

                tableHead = this.getTableHeaderHTML(
                    columnNames,
                    subcategories,
                    options
                );
            } else {
                tableHead = this.getTableHeaderHTML(
                    void 0,
                    columnNames,
                    options
                );
            }
        }

        for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
            const columnName = columnNames[columnIndex],
                column = columns[columnName],
                columnLength = column.length;

            for (let rowIndex = 0; rowIndex < columnLength; rowIndex++) {
                let cellValue = column[rowIndex];

                if (!rowArray[rowIndex]) {
                    rowArray[rowIndex] = [];
                }

                // Alternative: Datatype from HTML attribute with
                // connector.whatIs(columnName)
                if (
                    !(
                        typeof cellValue === 'string' ||
                        typeof cellValue === 'number' ||
                        typeof cellValue === 'undefined'
                    )
                ) {
                    cellValue = (cellValue || '').toString();
                }

                rowArray[rowIndex][columnIndex] = this.getCellHTMLFromValue(
                    columnIndex ? 'td' : 'th',
                    null,
                    columnIndex ? '' : 'scope="row"',
                    cellValue
                );

                // On the final column, push the row to the array
                if (columnIndex === columnsCount - 1) {
                    htmlRows.push('<tr>' +
                        rowArray[rowIndex].join('') +
                        '</tr>');
                }
            }
        }

        let caption = '';

        // Add table caption
        // Current exportdata falls back to chart title
        // but that should probably be handled elsewhere?
        if (options.tableCaption) {
            caption = '<caption class="highcharts-table-caption">' +
                options.tableCaption +
                '</caption>';
        }

        return (
            '<table>' +
            caption +
            tableHead +
            '<tbody>' +
            htmlRows.join('') +
            '</tbody>' +
            '</table>'
        );
    }

    /**
     * Get table cell markup from row data.
     */
    private getCellHTMLFromValue(
        tag: string,
        classes: (string|null),
        attrs: string,
        value: (number|string|undefined),
        decimalPoint?: string
    ): string {
        let val = value,
            className = 'text' + (classes ? ' ' + classes : '');

        // Convert to string if number
        if (typeof val === 'number') {
            val = val.toString();
            if (decimalPoint === ',') {
                val = val.replace('.', decimalPoint);
            }
            className = 'number';
        } else if (!value) {
            val = '';
            className = 'empty';
        }
        return '<' + tag + (attrs ? ' ' + attrs : '') +
            ' class="' + className + '">' +
            val + '</' + tag + '>';
    }

    /**
     * Get table header markup from row data.
     */
    private getTableHeaderHTML(
        topheaders: Array<(number|string)> = [],
        subheaders: Array<(number|string|undefined)> = [],
        options: HTMLTableConverter.Options = this.options
    ): string {
        const {
                useMultiLevelHeaders,
                useRowspanHeaders
            } = options,
            decimalPoint = (
                options.useLocalDecimalPoint ?
                    (1.1).toLocaleString()[1] :
                    '.'
            );

        let html = '<thead>',
            i = 0,
            len = subheaders && subheaders.length,
            next,
            cur,
            curColspan = 0,
            rowspan;

        // Clean up multiple table headers. Chart.getDataRows() returns two
        // levels of headers when using multilevel, not merged. We need to
        // merge identical headers, remove redundant headers, and keep it
        // all marked up nicely.
        if (
            useMultiLevelHeaders &&
            topheaders &&
            subheaders &&
            !isRowEqual(topheaders, subheaders)
        ) {
            html += '<tr>';
            for (; i < len; ++i) {
                cur = topheaders[i];
                next = topheaders[i + 1];
                if (cur === next) {
                    ++curColspan;
                } else if (curColspan) {
                    // Ended colspan
                    // Add cur to HTML with colspan.
                    html += this.getCellHTMLFromValue(
                        'th',
                        'highcharts-table-topheading',
                        'scope="col" ' +
                        'colspan="' + (curColspan + 1) + '"',
                        cur
                    );
                    curColspan = 0;
                } else {
                    // Cur is standalone. If it is same as sublevel,
                    // remove sublevel and add just toplevel.
                    if (cur === subheaders[i]) {
                        if (useRowspanHeaders) {
                            rowspan = 2;
                            delete subheaders[i];
                        } else {
                            rowspan = 1;
                            subheaders[i] = '';
                        }
                    } else {
                        rowspan = 1;
                    }
                    html += this.getCellHTMLFromValue(
                        'th',
                        'highcharts-table-topheading',
                        'scope="col"' +
                        (rowspan > 1 ?
                            ' valign="top" rowspan="' + rowspan + '"' :
                            ''),
                        cur
                    );
                }
            }
            html += '</tr>';
        }

        // Add the subheaders (the only headers if not using multilevels)
        if (subheaders) {
            html += '<tr>';
            for (i = 0, len = subheaders.length; i < len; ++i) {
                if (typeof subheaders[i] !== 'undefined') {
                    html += this.getCellHTMLFromValue(
                        'th', null, 'scope="col"', subheaders[i]
                    );
                }
            }
            html += '</tr>';
        }
        html += '</thead>';
        return html;
    }

    /**
     * Initiates the parsing of the HTML table
     *
     * @param {HTMLTableConverter.UserOptions}[options]
     * Options for the parser
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits CSVDataParser#parse
     * @emits CSVDataParser#afterParse
     * @emits HTMLTableParser#parseError
     */
    public parse(
        options: HTMLTableConverter.UserOptions,
        eventDetail?: DataEvent.Detail
    ): void {
        const converter = this,
            columns: Array<DataTable.Column> = [],
            headers: string[] = [],
            parseOptions = merge(converter.options, options),
            {
                endRow,
                startColumn,
                endColumn,
                firstRowAsNames
            } = parseOptions,
            tableHTML = parseOptions.tableElement || this.tableElement;


        if (!(tableHTML instanceof HTMLElement)) {
            converter.emit<DataConverter.Event>({
                type: 'parseError',
                columns,
                detail: eventDetail,
                headers,
                error: 'Not a valid HTML Table'
            });
            return;
        }
        converter.tableElement = tableHTML;
        converter.tableElementID = tableHTML.id;

        this.emit<DataConverter.Event>({
            type: 'parse',
            columns: converter.columns,
            detail: eventDetail,
            headers: converter.headers
        });
        const rows = tableHTML.getElementsByTagName('tr'),
            rowsCount = rows.length;

        let rowIndex: number = 0,
            item: Element,
            { startRow } = parseOptions;

        // Insert headers from the first row
        if (firstRowAsNames && rowsCount) {
            const items = rows[0].children,
                itemsLength = items.length;

            for (let i = startColumn; i < itemsLength; i++) {
                if (i > endColumn) {
                    break;
                }

                item = items[i];
                if (
                    item.tagName === 'TD' ||
                    item.tagName === 'TH'
                ) {
                    headers.push(item.innerHTML);
                }
            }

            startRow++;
        }

        while (rowIndex < rowsCount) {
            if (rowIndex >= startRow && rowIndex <= endRow) {
                const columnsInRow = rows[rowIndex].children,
                    columnsInRowLength = columnsInRow.length;

                let columnIndex = 0;

                while (columnIndex < columnsInRowLength) {
                    const relativeColumnIndex = columnIndex - startColumn,
                        row = columns[relativeColumnIndex];

                    item = columnsInRow[columnIndex];

                    if (
                        (
                            item.tagName === 'TD' ||
                            item.tagName === 'TH'
                        ) &&
                        (
                            columnIndex >= startColumn &&
                            columnIndex <= endColumn
                        )
                    ) {
                        if (!columns[relativeColumnIndex]) {
                            columns[relativeColumnIndex] = [];
                        }

                        let cellValue = converter.asGuessedType(item.innerHTML);
                        if (cellValue instanceof Date) {
                            cellValue = cellValue.getTime();
                        }
                        columns[relativeColumnIndex][
                            rowIndex - startRow
                        ] = cellValue;

                        // Loop over all previous indices and make sure
                        // they are nulls, not undefined.
                        let i = 1;
                        while (
                            rowIndex - startRow >= i &&
                            row[rowIndex - startRow - i] === void 0
                        ) {
                            row[rowIndex - startRow - i] = null;
                            i++;
                        }
                    }

                    columnIndex++;
                }
            }

            rowIndex++;
        }
        this.columns = columns;
        this.headers = headers;

        this.emit<DataConverter.Event>({
            type: 'afterParse',
            columns,
            detail: eventDetail,
            headers
        });
    }

    /**
     * Handles converting the parsed data to a table.
     *
     * @return {DataTable}
     * Table from the parsed HTML table
     */
    public getTable(): DataTable {
        return DataConverter.getTableFromColumns(this.columns, this.headers);
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace HTMLTableConverter {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Options for the parser compatible with ClassJSON
     */
    export interface Options extends DataConverter.Options {
        decimalPoint?: string;
        exportIDColumn?: boolean;
        tableCaption?: string;
        tableElement?: (HTMLElement|null);
        useLocalDecimalPoint?: boolean;
        useMultiLevelHeaders?: boolean;
        useRowspanHeaders?: boolean;
        usePresentationOrder?: boolean;
    }

    /**
     * Available options of the HTMLTableConverter.
     */
    export type UserOptions = Partial<Options>;

}

/* *
 *
 *  Default Export
 *
 * */

export default HTMLTableConverter;
