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
 *  - Sebastian Bochan
 *  - Gøran Slettemark
 *  - Torstein Hønsi
 *  - Wojciech Chmiel
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

import DataTable from '../DataTable.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { addEvent, fireEvent } = EH;

/* *
 *
 *  Class
 *
 * */

/**
 * Base class providing an interface and basic methods for a DataConverter
 *
 * @private
 */
class DataConverter implements DataEvent.Emitter {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default options
     */
    protected static readonly defaultOptions: DataConverter.Options = {
        dateFormat: '',
        alternativeFormat: '',
        startColumn: 0,
        endColumn: Number.MAX_VALUE,
        startRow: 0,
        endRow: Number.MAX_VALUE,
        firstRowAsNames: true,
        switchRowsAndColumns: false
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the DataConverter.
     *
     * @param {DataConverter.UserOptions} [options]
     * Options for the DataConverter.
     */
    public constructor(
        options?: DataConverter.UserOptions
    ) {
        const mergedOptions = merge(DataConverter.defaultOptions, options);

        let regExpPoint = mergedOptions.decimalPoint;

        if (regExpPoint === '.' || regExpPoint === ',') {
            regExpPoint = regExpPoint === '.' ? '\\.' : ',';

            this.decimalRegExp =
                new RegExp('^(-?[0-9]+)' + regExpPoint + '([0-9]+)$');
        }

        this.options = mergedOptions;
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * A collection of available date formats.
     */
    public dateFormats: Record<string, DataConverter.DateFormatObject> = {
        'YYYY/mm/dd': {
            regex: /^([0-9]{4})([\-\.\/])([0-9]{1,2})\2([0-9]{1,2})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[1], (match[3] as any) - 1, +match[4]) :
                        NaN
                );
            }
        },
        'dd/mm/YYYY': {
            regex: /^([0-9]{1,2})([\-\.\/])([0-9]{1,2})\2([0-9]{4})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[4], (match[3] as any) - 1, +match[1]) :
                        NaN
                );
            },
            alternative: 'mm/dd/YYYY' // different format with the same regex
        },
        'mm/dd/YYYY': {
            regex: /^([0-9]{1,2})([\-\.\/])([0-9]{1,2})\2([0-9]{4})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[4], (match[1] as any) - 1, +match[3]) :
                        NaN
                );
            }
        },
        'dd/mm/YY': {
            regex: /^([0-9]{1,2})([\-\.\/])([0-9]{1,2})\2([0-9]{2})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                const d = new Date();

                if (!match) {
                    return NaN;
                }

                let year = +match[4];

                if (year > (d.getFullYear() - 2000)) {
                    year += 1900;
                } else {
                    year += 2000;
                }

                return Date.UTC(year, (match[3] as any) - 1, +match[1]);
            },
            alternative: 'mm/dd/YY' // different format with the same regex
        },
        'mm/dd/YY': {
            regex: /^([0-9]{1,2})([\-\.\/])([0-9]{1,2})\2([0-9]{2})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(
                            +match[4] + 2000,
                            (match[1] as any) - 1,
                            +match[3]
                        ) :
                        NaN
                );
            }
        }
    };

    /**
     * Regular expression used in the trim method to change a decimal point.
     */
    protected decimalRegExp?: RegExp;

    /**
     * Options for the DataConverter.
     */
    public readonly options: DataConverter.Options;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Converts a value to a boolean.
     *
     * @param {DataConverter.Type} value
     * Value to convert.
     *
     * @return {boolean}
     * Converted value as a boolean.
     */
    public asBoolean(value: DataConverter.Type): boolean {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            return value !== '' && value !== '0' && value !== 'false';
        }
        return !!this.asNumber(value);
    }

    /**
     * Converts a value to a Date.
     *
     * @param {DataConverter.Type} value
     * Value to convert.
     *
     * @return {globalThis.Date}
     * Converted value as a Date.
     */
    public asDate(value: DataConverter.Type): Date {
        let timestamp;

        if (typeof value === 'string') {
            timestamp = this.parseDate(value);
        } else if (typeof value === 'number') {
            timestamp = value;
        } else if (value instanceof Date) {
            return value;
        } else {
            timestamp = this.parseDate(this.asString(value));
        }

        return new Date(timestamp);
    }

    /**
     * Casts a string value to it's guessed type
     *
     * @param {*} value
     * The value to examine.
     *
     * @return {number|string|Date}
     * The converted value.
     */
    public asGuessedType(value: unknown): (number|string|Date) {
        const converter = this,
            typeMap: Record<ReturnType<DataConverter['guessType']>, Function> = {
                'number': converter.asNumber,
                'Date': converter.asDate,
                'string': converter.asString
            };

        return typeMap[converter.guessType(value)].call(converter, value);
    }

    /**
     * Converts a value to a number.
     *
     * @param {DataConverter.Type} value
     * Value to convert.
     *
     * @return {number}
     * Converted value as a number.
     */
    public asNumber(value: DataConverter.Type): number {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'boolean') {
            return value ? 1 : 0;
        }

        if (typeof value === 'string') {
            const decimalRegex = this.decimalRegExp;

            if (value.indexOf(' ') > -1) {
                value = value.replace(/\s+/g, '');
            }

            if (decimalRegex) {
                if (!decimalRegex.test(value)) {
                    return NaN;
                }
                value = value.replace(decimalRegex, '$1.$2');
            }

            return parseFloat(value);
        }

        if (value instanceof Date) {
            return value.getDate();
        }
        if (value) {
            return value.getRowCount();
        }

        return NaN;
    }

    /**
     * Converts a value to a string.
     *
     * @param {DataConverter.Type} value
     * Value to convert.
     *
     * @return {string}
     * Converted value as a string.
     */
    public asString(value: DataConverter.Type): string {
        return '' + value;
    }

    /**
     * Tries to guess the date format
     *  - Check if either month candidate exceeds 12
     *  - Check if year is missing (use current year)
     *  - Check if a shortened year format is used (e.g. 1/1/99)
     *  - If no guess can be made, the user must be prompted
     * data is the data to deduce a format based on
     * @private
     *
     * @param {Array<string>} data
     * Data to check the format.
     *
     * @param {number} limit
     * Max data to check the format.
     *
     * @param {boolean} save
     * Whether to save the date format in the converter options.
     */
    public deduceDateFormat(
        data: Array<string>,
        limit?: (number|null),
        save?: boolean
    ): string {
        const parser = this,
            stable = [],
            max: Array<number> = [];

        let format = 'YYYY/mm/dd',
            thing: Array<string>,
            guessedFormat: Array<string> = [],
            i = 0,
            madeDeduction = false,
            // candidates = {},
            elem,
            j;

        if (!limit || limit > data.length) {
            limit = data.length;
        }

        for (; i < limit; i++) {
            if (
                typeof data[i] !== 'undefined' &&
                data[i] && data[i].length
            ) {
                thing = data[i]
                    .trim()
                    .replace(/[-\.\/]/g, ' ')
                    .split(' ');

                guessedFormat = [
                    '',
                    '',
                    ''
                ];

                for (j = 0; j < thing.length; j++) {
                    if (j < guessedFormat.length) {
                        elem = parseInt(thing[j], 10);

                        if (elem) {

                            max[j] = (!max[j] || max[j] < elem) ? elem : max[j];

                            if (typeof stable[j] !== 'undefined') {
                                if (stable[j] !== elem) {
                                    stable[j] = false;
                                }
                            } else {
                                stable[j] = elem;
                            }

                            if (elem > 31) {
                                if (elem < 100) {
                                    guessedFormat[j] = 'YY';
                                } else {
                                    guessedFormat[j] = 'YYYY';
                                }
                                // madeDeduction = true;
                            } else if (
                                elem > 12 &&
                                elem <= 31
                            ) {
                                guessedFormat[j] = 'dd';
                                madeDeduction = true;
                            } else if (!guessedFormat[j].length) {
                                guessedFormat[j] = 'mm';
                            }
                        }
                    }
                }
            }
        }

        if (madeDeduction) {

            // This handles a few edge cases with hard to guess dates
            for (j = 0; j < stable.length; j++) {
                if (stable[j] !== false) {
                    if (
                        max[j] > 12 &&
                        guessedFormat[j] !== 'YY' &&
                        guessedFormat[j] !== 'YYYY'
                    ) {
                        guessedFormat[j] = 'YY';
                    }
                } else if (max[j] > 12 && guessedFormat[j] === 'mm') {
                    guessedFormat[j] = 'dd';
                }
            }

            // If the middle one is dd, and the last one is dd,
            // the last should likely be year.
            if (guessedFormat.length === 3 &&
                guessedFormat[1] === 'dd' &&
                guessedFormat[2] === 'dd') {
                guessedFormat[2] = 'YY';
            }

            format = guessedFormat.join('/');

            // If the caculated format is not valid, we need to present an
            // error.
        }

        // Save the deduced format in the converter options.
        if (save) {
            parser.options.dateFormat = format;
        }

        return format;
    }

    /**
     * Emits an event on the DataConverter instance.
     *
     * @param {DataConverter.Event} [e]
     * Event object containing additional event data
     */
    public emit<E extends DataEvent>(e: E): void {
        fireEvent(this, e.type, e);
    }

    /**
     * Initiates the data exporting. Should emit `exportError` on failure.
     *
     * @param {DataConnector} connector
     * Connector to export from.
     *
     * @param {DataConverter.Options} [options]
     * Options for the export.
     */
    public export(
        connector: DataConnector,
        options?: DataConverter.Options
    ): string {
        this.emit<DataConverter.Event>({
            type: 'exportError',
            columns: [],
            headers: []
        });
        throw new Error('Not implemented');
    }

    /**
     * Getter for the data table.
     *
     * @return {DataTable}
     * Table of parsed data.
     */
    public getTable(): DataTable {
        throw new Error('Not implemented');
    }

    /**
     * Guesses the potential type of a string value for parsing CSV etc.
     *
     * @param {*} value
     * The value to examine.
     *
     * @return {'number'|'string'|'Date'}
     * Type string, either `string`, `Date`, or `number`.
     */
    public guessType(
        value: unknown
    ): ('number'|'string'|'Date') {
        const converter = this;

        let result: ('string' | 'Date' | 'number') = 'string';

        if (typeof value === 'string') {
            const trimedValue = converter.trim(`${value}`),
                decimalRegExp = converter.decimalRegExp;

            let innerTrimedValue = converter.trim(trimedValue, true);

            if (decimalRegExp) {
                innerTrimedValue = (
                    decimalRegExp.test(innerTrimedValue) ?
                        innerTrimedValue.replace(decimalRegExp, '$1.$2') :
                        ''
                );
            }

            const floatValue = parseFloat(innerTrimedValue);

            if (+innerTrimedValue === floatValue) {
                // string is numeric
                value = floatValue;
            } else {
                // determine if a date string
                const dateValue = converter.parseDate(value);

                result = isNumber(dateValue) ? 'Date' : 'string';
            }
        }

        if (typeof value === 'number') {
            // greater than milliseconds in a year assumed timestamp
            result = value > 365 * 24 * 3600 * 1000 ? 'Date' : 'number';
        }

        return result;
    }

    /**
     * Registers a callback for a specific event.
     *
     * @param {string} type
     * Event type as a string.
     *
     * @param {DataEventEmitter.Callback} callback
     * Function to register for an modifier callback.
     *
     * @return {Function}
     * Function to unregister callback from the modifier event.
     */
    public on<E extends DataEvent>(
        type: E['type'],
        callback: DataEvent.Callback<this, E>
    ): Function {
        return addEvent(this, type, callback);
    }

    /**
     * Initiates the data parsing. Should emit `parseError` on failure.
     *
     * @param {DataConverter.UserOptions} options
     * Options of the DataConverter.
     */
    public parse(options: DataConverter.UserOptions): void {
        this.emit<DataConverter.Event>({
            type: 'parseError',
            columns: [],
            headers: []
        });
        throw new Error('Not implemented');
    }

    /**
     * Parse a date and return it as a number.
     *
     * @function Highcharts.Data#parseDate
     *
     * @param {string} value
     * Value to parse.
     *
     * @param {string} dateFormatProp
     * Which of the predefined date formats
     * to use to parse date values.
     */
    private parseDate(value: string, dateFormatProp?: string): number {
        const converter = this,
            options = converter.options;

        let dateFormat = dateFormatProp || options.dateFormat,
            result = NaN,
            key,
            format,
            match;

        if (options.parseDate) {
            result = options.parseDate(value);
        } else {
            // Auto-detect the date format the first time
            if (!dateFormat) {
                for (key in converter.dateFormats) { // eslint-disable-line guard-for-in
                    format = converter.dateFormats[key];
                    match = value.match(format.regex);
                    if (match) {
                        // converter.options.dateFormat = dateFormat = key;
                        dateFormat = key;
                        // converter.options.alternativeFormat =
                        // format.alternative || '';
                        result = format.parser(match);
                        break;
                    }
                }

            // Next time, use the one previously found
            } else {
                format = converter.dateFormats[dateFormat];

                if (!format) {
                    // The selected format is invalid
                    format = converter.dateFormats['YYYY/mm/dd'];
                }

                match = value.match(format.regex);
                if (match) {
                    result = format.parser(match);
                }
            }
            // Fall back to Date.parse
            if (!match) {
                match = Date.parse(value);
                // External tools like Date.js and MooTools extend Date object
                // and returns a date.
                if (
                    typeof match === 'object' &&
                        match !== null &&
                        (match as any).getTime
                ) {
                    result = (
                        (match as any).getTime() -
                            (match as any).getTimezoneOffset() *
                            60000
                    );

                    // Timestamp
                } else if (isNumber(match)) {
                    result = match - (
                        new Date(match)
                    ).getTimezoneOffset() * 60000;
                    if (// reset dates without year in Chrome
                        value.indexOf('2001') === -1 &&
                        (new Date(result)).getFullYear() === 2001
                    ) {
                        result = NaN;
                    }
                }
            }
        }

        return result;
    }

    /**
     * Trim a string from whitespaces.
     *
     * @param {string} str
     * String to trim.
     *
     * @param {boolean} [inside=false]
     * Remove all spaces between numbers.
     *
     * @return {string}
     * Trimed string
     */
    public trim(
        str: string,
        inside?: boolean
    ): string {
        if (typeof str === 'string') {
            str = str.replace(/^\s+|\s+$/g, '');

            // Clear white space insdie the string, like thousands separators
            if (inside && /^[0-9\s]+$/.test(str)) {
                str = str.replace(/\s/g, '');
            }
        }

        return str;
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

/**
 * Additionally provided types for events and conversion.
 */
namespace DataConverter {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * The basic event object for a DataConverter instance.
     * Valid types are `parse`, `afterParse`, and `parseError`
     */
    export interface Event extends DataEvent {
        readonly type: (
            'export'|'afterExport'|'exportError'|
            'parse'|'afterParse'|'parseError'
        );
        readonly columns: Array<DataTable.Column>;
        readonly error?: (string | Error);
        readonly headers: string[];
    }

    export interface DateFormatCallbackFunction {
        (match: ReturnType<string['match']>): number;
    }

    export interface DateFormatObject {
        alternative?: string;
        parser: DateFormatCallbackFunction;
        regex: RegExp;
    }

    /**
     * The shared options for all DataConverter instances
     */
    export interface Options {
        dateFormat?: string;
        alternativeFormat?: string;
        decimalPoint?: string;
        startRow: number;
        endRow: number;
        startColumn: number;
        endColumn: number;
        firstRowAsNames: boolean;

        /**
         * A function to parse string representations of dates into JavaScript
         * timestamps. If not set, the default implementation will be used.
         */
        parseDate?: DataConverter.ParseDateFunction;

        switchRowsAndColumns: boolean;
    }

    /**
     * A function to parse string representations of dates
     * into JavaScript timestamps.
     */
    export interface ParseDateFunction {
        (dateValue: string): number;
    }

    /**
     * Contains supported types to convert values from and to.
     */
    export type Type = (boolean|null|number|string|DataTable|Date|undefined);

    /**
     * Options of the DataConverter.
     */
    export type UserOptions = Partial<Options>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Converts an array of columns to a table instance. Second dimension of the
     * array are the row cells.
     *
     * @param {Array<DataTable.Column>} [columns]
     * Array to convert.
     *
     * @param {Array<string>} [headers]
     * Column names to use.
     *
     * @return {DataTable}
     * Table instance from the arrays.
     */
    export function getTableFromColumns(
        columns: Array<DataTable.Column> = [],
        headers: Array<string> = []
    ): DataTable {
        const table = new DataTable();

        for (
            let i = 0,
                iEnd = Math.max(headers.length, columns.length);
            i < iEnd;
            ++i
        ) {
            table.setColumn(
                headers[i] || `${i}`,
                columns[i]
            );
        }

        return table;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataConverter;
