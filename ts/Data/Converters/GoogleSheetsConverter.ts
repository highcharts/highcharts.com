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

import DataConverter from './DataConverter.js';
import DataTable from '../DataTable.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    uniqueKey
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Handles parsing and transformation of an Google Sheets to a table.
 *
 * @private
 */
class GoogleSheetsConverter extends DataConverter {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options
     */
    protected static readonly defaultOptions: GoogleSheetsConverter.Options = {
        ...DataConverter.defaultOptions
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the GoogleSheetsConverter.
     *
     * @param {GoogleSheetsConverter.UserOptions} [options]
     * Options for the GoogleSheetsConverter.
     */
    constructor(
        options?: GoogleSheetsConverter.UserOptions
    ) {
        const mergedOptions =
            merge(GoogleSheetsConverter.defaultOptions, options);

        super(mergedOptions);

        this.columns = [];
        this.header = [];
        this.options = mergedOptions;
    }

    /* *
     *
     *  Properties
     *
     * */

    private columns: DataTable.CellType[][];
    private header: string[];

    /**
     * Options for the DataConverter.
     */
    public readonly options: GoogleSheetsConverter.Options;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initiates the parsing of the Google Sheet
     *
     * @param {GoogleSheetsConverter.UserOptions}[options]
     * Options for the parser
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits GoogleSheetsParser#parse
     * @emits GoogleSheetsParser#afterParse
     */
    public parse(
        options: GoogleSheetsConverter.UserOptions,
        eventDetail?: DataEvent.Detail
    ): (boolean|undefined) {
        const converter = this,
            parseOptions = merge(converter.options, options),
            columns = ((
                parseOptions.json &&
                parseOptions.json.values
            ) || []).map(
                (column): DataTable.Column => column.slice()
            );

        if (columns.length === 0) {
            return false;
        }

        converter.header = [];
        converter.columns = [];

        converter.emit<DataConverter.Event>({
            type: 'parse',
            columns: converter.columns,
            detail: eventDetail,
            headers: converter.header
        });

        converter.columns = columns;

        let column;

        for (let i = 0, iEnd = columns.length; i < iEnd; i++) {
            column = columns[i];
            converter.header[i] = (
                parseOptions.firstRowAsNames ?
                    `${column.shift()}` :
                    uniqueKey()
            );

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

        converter.emit<DataConverter.Event>({
            type: 'afterParse',
            columns: converter.columns,
            detail: eventDetail,
            headers: converter.header
        });
    }

    /**
     * Handles converting the parsed data to a table.
     *
     * @return {DataTable}
     * Table from the parsed Google Sheet
     */
    public getTable(): DataTable {
        return DataConverter.getTableFromColumns(this.columns, this.header);
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace GoogleSheetsConverter {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Options of the GoogleSheetsConverter.
     */
    export interface Options extends DataConverter.Options {
        json?: GoogleSpreadsheetJSON;
    }

    /**
     * Google's spreadsheet format.
     */
    export interface GoogleSpreadsheetJSON {
        majorDimension: ('COLUMNS'|'ROWS');
        values: Array<Array<(boolean|null|number|string|undefined)>>;
    }

    /**
     * Available options of the GoogleSheetsConverter.
     */
    export type UserOptions = Partial<Options>;

}

/* *
 *
 *  Default Export
 *
 * */

export default GoogleSheetsConverter;
