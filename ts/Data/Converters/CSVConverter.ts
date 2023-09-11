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
 *  - Christer Vasseng
 *  - Gøran Slettemark
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
 *  Class
 *
 * */

/**
 * Handles parsing and transforming CSV to a table.
 *
 * @private
 */
class CSVConverter extends DataConverter {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options
     */
    protected static readonly defaultOptions: CSVConverter.Options = {
        ...DataConverter.defaultOptions,
        lineDelimiter: '\n'
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the CSV parser.
     *
     * @param {CSVConverter.UserOptions} [options]
     * Options for the CSV parser.
     */
    public constructor(
        options?: CSVConverter.UserOptions
    ) {
        const mergedOptions = merge(CSVConverter.defaultOptions, options);

        super(mergedOptions);

        this.options = mergedOptions;
    }

    /* *
     *
     *  Properties
     *
     * */

    private columns: Array<DataTable.Column> = [];
    private headers: Array<string> = [];
    private dataTypes: Array<Array<string>> = [];
    private guessedItemDelimiter?: string;
    private guessedDecimalPoint?: string;

    /**
     * Options for the DataConverter.
     */
    public readonly options: CSVConverter.Options;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Creates a CSV string from the datatable on the connector instance.
     *
     * @param {DataConnector} connector
     * Connector instance to export from.
     *
     * @param {CSVConverter.Options} [options]
     * Options used for the export.
     *
     * @return {string}
     * CSV string from the connector table.
     */
    public export(
        connector: DataConnector,
        options: CSVConverter.Options = this.options
    ): string {
        const { useLocalDecimalPoint, lineDelimiter } = options,
            exportNames = (this.options.firstRowAsNames !== false);

        let { decimalPoint, itemDelimiter } = options;

        if (!decimalPoint) {
            decimalPoint = (
                itemDelimiter !== ',' && useLocalDecimalPoint ?
                    (1.1).toLocaleString()[1] :
                    '.'
            );
        }

        if (!itemDelimiter) {
            itemDelimiter = (decimalPoint === ',' ? ';' : ',');
        }

        const columns =
                connector.getSortedColumns(options.usePresentationOrder),
            columnNames = Object.keys(columns),
            csvRows: Array<string> = [],
            columnsCount = columnNames.length;

        const rowArray: Array<DataTable.Row> = [];

        // Add the names as the first row if they should be exported
        if (exportNames) {
            csvRows.push(columnNames.map(
                (columnName): string => `"${columnName}"`
            ).join(itemDelimiter));
        }

        for (let columnIndex = 0; columnIndex < columnsCount; columnIndex++) {
            const columnName = columnNames[columnIndex],
                column = columns[columnName],
                columnLength = column.length;

            const columnMeta = connector.whatIs(columnName);
            let columnDataType;

            if (columnMeta) {
                columnDataType = columnMeta.dataType;
            }

            for (let rowIndex = 0; rowIndex < columnLength; rowIndex++) {
                let cellValue = column[rowIndex];

                if (!rowArray[rowIndex]) {
                    rowArray[rowIndex] = [];
                }

                // Prefer datatype from metadata
                if (columnDataType === 'string') {
                    cellValue = '"' + cellValue + '"';
                } else if (typeof cellValue === 'number') {
                    cellValue = String(cellValue).replace('.', decimalPoint);
                } else if (typeof cellValue === 'string') {
                    cellValue = `"${cellValue}"`;
                }

                rowArray[rowIndex][columnIndex] = cellValue;

                // On the final column, push the row to the CSV
                if (columnIndex === columnsCount - 1) {
                    // Trim repeated undefined values starting at the end
                    // Currently, we export the first "comma" even if the
                    // second value is undefined
                    let i = columnIndex;
                    while (rowArray[rowIndex].length > 2) {
                        const cellVal = rowArray[rowIndex][i];
                        if (cellVal !== void 0) {
                            break;
                        }
                        rowArray[rowIndex].pop();
                        i--;
                    }

                    csvRows.push(rowArray[rowIndex].join(itemDelimiter));
                }
            }
        }

        return csvRows.join(lineDelimiter);
    }

    /**
     * Initiates parsing of CSV
     *
     * @param {CSVConverter.UserOptions}[options]
     * Options for the parser
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits CSVDataParser#parse
     * @emits CSVDataParser#afterParse
     */
    public parse(
        options: CSVConverter.UserOptions,
        eventDetail?: DataEvent.Detail
    ): void {
        const converter = this,
            dataTypes = converter.dataTypes,
            parserOptions = merge(this.options, options),
            {
                beforeParse,
                lineDelimiter,
                firstRowAsNames,
                itemDelimiter
            } = parserOptions;

        let lines,
            rowIt = 0,
            {
                csv,
                startRow,
                endRow
            } = parserOptions,
            column;

        converter.columns = [];

        converter.emit<DataConverter.Event>({
            type: 'parse',
            columns: converter.columns,
            detail: eventDetail,
            headers: converter.headers
        });

        if (csv && beforeParse) {
            csv = beforeParse(csv);
        }

        if (csv) {
            lines = csv
                .replace(/\r\n|\r/g, '\n') // Windows | Mac
                .split(lineDelimiter || '\n');

            if (!startRow || startRow < 0) {
                startRow = 0;
            }

            if (!endRow || endRow >= lines.length) {
                endRow = lines.length - 1;
            }

            if (!itemDelimiter) {
                converter.guessedItemDelimiter =
                    converter.guessDelimiter(lines);
            }

            // If the first row contain names, add them to the
            // headers array and skip the row.
            if (firstRowAsNames) {
                const headers = lines[0].split(
                    itemDelimiter || converter.guessedItemDelimiter || ','
                );

                // Remove ""s from the headers
                for (let i = 0; i < headers.length; i++) {
                    headers[i] = headers[i].trim().replace(/^["']|["']$/g, '');
                }

                converter.headers = headers;

                startRow++;
            }

            let offset = 0;

            for (rowIt = startRow; rowIt <= endRow; rowIt++) {
                if (lines[rowIt][0] === '#') {
                    offset++;
                } else {
                    converter
                        .parseCSVRow(lines[rowIt], rowIt - startRow - offset);
                }
            }

            if (dataTypes.length &&
                dataTypes[0].length &&
                dataTypes[0][1] === 'date' && // format is a string date
                !converter.options.dateFormat
            ) {
                converter.deduceDateFormat(
                    converter.columns[0] as Array<string>, null, true
                );
            }

            // Guess types.
            for (let i = 0, iEnd = converter.columns.length; i < iEnd; ++i) {
                column = converter.columns[i];

                for (let j = 0, jEnd = column.length; j < jEnd; ++j) {
                    if (column[j] && typeof column[j] === 'string') {
                        let cellValue = converter.asGuessedType(
                            column[j] as string
                        );
                        if (cellValue instanceof Date) {
                            cellValue = cellValue.getTime();
                        }
                        converter.columns[i][j] = cellValue;
                    }
                }
            }
        }

        converter.emit<DataConverter.Event>({
            type: 'afterParse',
            columns: converter.columns,
            detail: eventDetail,
            headers: converter.headers
        });
    }

    /**
     * Internal method that parses a single CSV row
     */
    private parseCSVRow(
        columnStr: string,
        rowNumber: number
    ): void {
        const converter = this,
            columns = converter.columns || [],
            dataTypes = converter.dataTypes,
            { startColumn, endColumn } = converter.options,
            itemDelimiter = (
                converter.options.itemDelimiter ||
                converter.guessedItemDelimiter
            );


        let { decimalPoint } = converter.options;

        if (!decimalPoint || decimalPoint === itemDelimiter) {
            decimalPoint = converter.guessedDecimalPoint || '.';
        }

        let i = 0,
            c = '',
            cl = '',
            cn = '',
            token: (number|string) = '',
            actualColumn = 0,
            column = 0;

        const read = (j: number): void => {
            c = columnStr[j];
            cl = columnStr[j - 1];
            cn = columnStr[j + 1];
        };

        const pushType = (type: string): void => {
            if (dataTypes.length < column + 1) {
                dataTypes.push([type]);
            }
            if (dataTypes[column][dataTypes[column].length - 1] !== type) {
                dataTypes[column].push(type);
            }
        };

        const push = (): void => {
            if (startColumn > actualColumn || actualColumn > endColumn) {
                // Skip this column, but increment the column count (#7272)
                ++actualColumn;
                token = '';
                return;
            }

            // Save the type of the token.
            if (typeof token === 'string') {
                if (!isNaN(parseFloat(token)) && isFinite(token as any)) {
                    token = parseFloat(token) as any;
                    pushType('number');
                } else if (!isNaN(Date.parse(token))) {
                    token = token.replace(/\//g, '-');
                    pushType('date');
                } else {
                    pushType('string');
                }
            } else {
                pushType('number');
            }

            if (columns.length < column + 1) {
                columns.push([]);
            }

            // Try to apply the decimal point, and check if the token then is a
            // number. If not, reapply the initial value
            if (
                typeof token !== 'number' &&
                converter.guessType(token) !== 'number' &&
                decimalPoint
            ) {
                const initialValue = token;
                token = token.replace(decimalPoint, '.');
                if (converter.guessType(token) !== 'number') {
                    token = initialValue;
                }
            }

            columns[column][rowNumber] = token;

            token = '';
            ++column;
            ++actualColumn;
        };

        if (!columnStr.trim().length) {
            return;
        }

        if (columnStr.trim()[0] === '#') {
            return;
        }

        for (; i < columnStr.length; i++) {
            read(i);

            if (c === '#') {
                // If there are hexvalues remaining (#13283)
                if (!/^#[0-F]{3,3}|[0-F]{6,6}/i.test(columnStr.substring(i))) {
                    // The rest of the row is a comment
                    push();
                    return;
                }
            }

            // Quoted string
            if (c === '"') {
                read(++i);

                while (i < columnStr.length) {
                    if (c === '"') {
                        break;
                    }

                    token += c;

                    read(++i);
                }

            } else if (c === itemDelimiter) {
                push();

                // Actual column data
            } else {
                token += c;
            }
        }

        push();

    }

    /**
     * Internal method that guesses the delimiter from the first
     * 13 lines of the CSV
     * @param {Array<string>} lines
     * The CSV, split into lines
     */
    private guessDelimiter(lines: Array<string>): string {

        let points = 0,
            commas = 0,
            guessed: string;
        const potDelimiters: Record<string, number> = {
                ',': 0,
                ';': 0,
                '\t': 0
            },
            linesCount = lines.length;

        for (let i = 0; i < linesCount; i++) {
            let inStr = false,
                c,
                cn,
                cl,
                token = '';

            // We should be able to detect dateformats within 13 rows
            if (i > 13) {
                break;
            }

            const columnStr = lines[i];
            for (let j = 0; j < columnStr.length; j++) {
                c = columnStr[j];
                cn = columnStr[j + 1];
                cl = columnStr[j - 1];

                if (c === '#') {
                    // Skip the rest of the line - it's a comment
                    break;
                }

                if (c === '"') {
                    if (inStr) {
                        if (cl !== '"' && cn !== '"') {
                            while (cn === ' ' && j < columnStr.length) {
                                cn = columnStr[++j];
                            }

                            // After parsing a string, the next non-blank
                            // should be a delimiter if the CSV is properly
                            // formed.

                            if (typeof potDelimiters[cn] !== 'undefined') {
                                potDelimiters[cn]++;
                            }

                            inStr = false;
                        }
                    } else {
                        inStr = true;
                    }
                } else if (typeof potDelimiters[c] !== 'undefined') {

                    token = token.trim();

                    if (!isNaN(Date.parse(token))) {
                        potDelimiters[c]++;
                    } else if (
                        isNaN(Number(token)) ||
                        !isFinite(Number(token))
                    ) {
                        potDelimiters[c]++;
                    }

                    token = '';

                } else {
                    token += c;
                }

                if (c === ',') {
                    commas++;
                }

                if (c === '.') {
                    points++;
                }
            }
        }

        // Count the potential delimiters.
        // This could be improved by checking if the number of delimiters
        // equals the number of columns - 1

        if (potDelimiters[';'] > potDelimiters[',']) {
            guessed = ';';
        } else if (potDelimiters[','] > potDelimiters[';']) {
            guessed = ',';
        } else {
            // No good guess could be made..
            guessed = ',';
        }

        // Try to deduce the decimal point if it's not explicitly set.
        // If both commas or points is > 0 there is likely an issue
        if (points > commas) {
            this.guessedDecimalPoint = '.';
        } else {
            this.guessedDecimalPoint = ',';
        }

        return guessed;
    }
    /**
     * Handles converting the parsed data to a table.
     *
     * @return {DataTable}
     * Table from the parsed CSV.
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

namespace CSVConverter {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Interface for the BeforeParse callback function
     */
    export interface DataBeforeParseCallbackFunction {
        (csv: string): string;
    }

    /**
     * Options for the CSV parser that are compatible with ClassJSON
     */
    export interface Options extends DataConverter.Options {
        csv?: string;
        decimalPoint?: string;
        itemDelimiter?: string;
        lineDelimiter: string;
        useLocalDecimalPoint?: boolean;
        usePresentationOrder?: boolean;
    }

    /**
     * Options that are not compatible with ClassJSON
     */
    export interface SpecialOptions {
        beforeParse?: DataBeforeParseCallbackFunction;
        decimalRegex?: RegExp;
    }

    /**
     * Avaliable options of the CSVConverter.
     */
    export type UserOptions = Partial<(Options&SpecialOptions)>;

}

/* *
 *
 *  Default Export
 *
 * */

export default CSVConverter;
