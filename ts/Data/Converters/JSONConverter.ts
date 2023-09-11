/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Pawel Lysy
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
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * Handles parsing and transforming JSON to a table.
 *
 * @private
 */
class JSONConverter extends DataConverter {
    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options
     */
    protected static readonly defaultOptions: JSONConverter.Options = {
        ...DataConverter.defaultOptions,
        data: [],
        orientation: 'columns'
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the JSON parser.
     *
     * @param {JSONConverter.UserOptions} [options]
     * Options for the JSON parser.
     */
    public constructor(
        options?: JSONConverter.UserOptions
    ) {
        const mergedOptions = merge(JSONConverter.defaultOptions, options);

        super(mergedOptions);

        this.options = mergedOptions;
        this.table = new DataTable();
    }

    /* *
     *
     *  Properties
     *
     * */

    private columns: Array<DataTable.Column> = [];
    private headers: Array<string> = [];
    private dataTypes: Array<Array<string>> = [];

    /**
     * Options for the DataConverter.
     */
    public readonly options: JSONConverter.Options;

    private table: DataTable;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initiates parsing of JSON structure.
     *
     * @param {JSONConverter.UserOptions}[options]
     * Options for the parser
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits JSONConverter#parse
     * @emits JSONConverter#afterParse
     */
    public parse(
        options: JSONConverter.UserOptions,
        eventDetail?: DataEvent.Detail
    ): void {

        const converter = this;
        options = merge(converter.options, options);
        const {
            beforeParse,
            orientation,
            firstRowAsNames,
            columnNames
        } = options;
        let data = options.data;

        if (!data) {
            return;
        }

        if (beforeParse) {
            data = beforeParse(data);
        }


        data = data.slice();

        if (orientation === 'columns') {
            for (let i = 0, iEnd = data.length; i < iEnd; i++) {
                const item = data[i];
                if (!(item instanceof Array)) {
                    return;
                }
                if (firstRowAsNames) {
                    converter.headers.push(`${item.shift()}`);
                } else if (columnNames) {
                    converter.headers.push(columnNames[i]);
                }

                converter.table.setColumn(
                    converter.headers[i] || i.toString(),
                    item
                );
            }
        } else if (orientation === 'rows') {
            if (firstRowAsNames) {
                converter.headers = data.shift() as Array<string>;
            } else if (columnNames) {
                converter.headers = columnNames;
            }

            for (
                let rowIndex = 0, iEnd = data.length;
                rowIndex < iEnd;
                rowIndex++
            ) {
                const row = data[rowIndex];
                if (isArray(row)) {
                    for (
                        let columnIndex = 0, jEnd = row.length;
                        columnIndex < jEnd;
                        columnIndex++
                    ) {
                        if (converter.columns.length < columnIndex + 1) {
                            converter.columns.push([]);
                        }
                        converter.columns[columnIndex].push(
                            row[columnIndex]
                        );
                        this.table.setCell(
                            converter.headers[columnIndex] ||
                                rowIndex.toString(),
                            rowIndex,
                            row[columnIndex]
                        );
                    }
                } else {
                    this.table.setRows([row], rowIndex);
                }
            }
        }
    }

    /**
     * Handles converting the parsed data to a table.
     *
     * @return {DataTable}
     * Table from the parsed CSV.
     */
    public getTable(): DataTable {
        return this.table;
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace JSONConverter {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Interface for the BeforeParse callback function
     */
    export interface DataBeforeParseCallbackFunction {
        (data: Data): Data;
    }

    /**
     * Options for the JSON parser that are compatible with ClassJSON
     */
    export interface Options extends DataConverter.Options {
        columnNames?: Array<string>;
        data: Data;
        orientation: 'columns'|'rows';
    }

    export type Data = Array<Array<number|string>|Record<string, number|string>>;
    /**
     * Options that are not compatible with ClassJSON
     */
    export interface SpecialOptions {
        beforeParse?: DataBeforeParseCallbackFunction;
    }

    /**
     * Available options of the JSONConverter.
     */
    export type UserOptions = Partial<(Options&SpecialOptions)>;

}

/* *
 *
 *  Default Export
 *
 * */

export default JSONConverter;
