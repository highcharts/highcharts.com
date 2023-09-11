/* *
 *
 *  Data module
 *
 *  (c) 2012-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import Ajax from '../Extensions/Ajax.js';
const {
    ajax
} = Ajax;
import BaseSeries from '../Core/Series/Series.js';
import Chart from '../Core/Chart/Chart.js';
import H from '../Core/Globals.js';
const {
    doc
} = H;
import Point from '../Core/Series/Point.js';
import U from '../Shared/Utilities.js';

import DataTable from '../../Data/DataTable.js';
import GoogleSheetsConnector from '../../Data/Connectors/GoogleSheetsConnector.js'


const {
    addEvent,
    defined,
    extend,
    fireEvent,
    isNumber,
    merge,
    objectEach,
    pick,
    splat
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        type DataValueType = (number|string|null);
        interface ChartLike {
            data?: Data;
            hasDataDef?: boolean;
            liveDataURL?: string;
        }
        interface DataAfterCompleteCallbackFunction {
            (dataOptions?: Options): void;
        }
        interface DataBeforeParseCallbackFunction {
            (csv: string): string;
        }
        interface DataCompleteCallbackFunction {
            (chartOptions: Options): void;
        }
        interface DataDateFormatCallbackFunction {
            (match: ReturnType<string['match']>): number;
        }
        interface DataDateFormatObject {
            alternative?: string;
            parser: DataDateFormatCallbackFunction;
            regex: RegExp;
        }
        interface DataOptions {
            afterComplete?: DataAfterCompleteCallbackFunction;
            beforeParse?: DataBeforeParseCallbackFunction;
            columns?: Array<Array<DataValueType>>;
            columnsURL?: string;
            columnTypes?: Array<string>;
            complete?: DataCompleteCallbackFunction;
            csv?: string;
            csvURL?: string;
            dataRefreshRate?: number;
            dateFormat?: string;
            dateFormats?: undefined;
            decimalPoint?: string;
            enablePolling?: boolean;
            endColumn?: number;
            endRow?: number;
            error?: Function;
            firstRowAsNames?: boolean;
            googleSpreadsheetKey?: string;
            googleSpreadsheetWorksheet?: string;
            itemDelimiter?: string;
            lineDelimiter?: string;
            parsed?: DataParsedCallbackFunction;
            parseDate?: DataParseDateCallbackFunction;
            rows?: Array<Array<DataValueType>>;
            rowsURL?: string;
            seriesMapping?: Array<Dictionary<number>>;
            sort?: boolean;
            startColumn?: number;
            startRow?: number;
            switchRowsAndColumns?: boolean;
            table?: (string|GlobalHTMLElement);
        }
        interface DataParseDateCallbackFunction {
            (dateValue: string): number;
        }
        interface DataParsedCallbackFunction {
            (columns: Array<Array<DataValueType>>): (boolean|undefined);
        }
        interface DataValueCountObject {
            global: number;
            globalPointArrayMap: Array<string>;
            individual: Array<number>;
            seriesBuilders: Array<SeriesBuilder>;
            xColumns: Array<number>;
        }
        interface Options {
            data?: DataOptions;
        }
        interface SeriesBuilderReaderObject {
            columnIndex: (number|undefined);
            configName: string;
        }
        class Data {
            public constructor(
                dataOptions: DataOptions,
                chartOptions?: Options,
                chart?: Chart
            );
            public alternativeFormat?: string;
            public chart: Chart;
            public chartOptions: Options;
            public columns?: Array<Array<DataValueType>>;
            public dateFormat?: string;
            public dateFormats: Dictionary<Highcharts.DataDateFormatObject>;
            public decimalRegex?: RegExp;
            public firstRowAsNames: boolean;
            public liveDataTimeout?: number;
            public rawColumns: Array<Array<string>>;
            public options: DataOptions;
            public valueCount?: DataValueCountObject;
            public complete(): void;
            public dataFound(): void;
            public fetchLiveData(): (boolean|string);
            public getColumnDistribution(): void;
            public getData(): (Array<Array<DataValueType>>|undefined);
            public getFreeIndexes(
                numberOfColumns: number,
                seriesBuilders: Array<SeriesBuilder>
            ): Array<number>;
            public hasURLOption(options: DataOptions): boolean;
            public init(
                options: DataOptions,
                chartOptions?: Options,
                chart?: Chart
            ): void;
            public parseColumn(column: Array<DataValueType>, col: number): void;
            public parseCSV(
                inOptions?: Highcharts.DataOptions
            ): Array<Array<(number|string)>>;
            public parsed(): (boolean|undefined);
            public parseDate(val: string): number;
            public parseGoogleSpreadsheet(): boolean;
            public parseTable(): Array<Array<(number|string)>>;
            public parseTypes(): void;
            public rowsToColumns(
                rows: (Array<Array<DataValueType>>|undefined)
            ): (Array<Array<DataValueType>>|undefined);
            public trim(str: string, inside?: boolean): string;
        }
        class SeriesBuilder {
            public name?: string;
            public readers: Array<SeriesBuilderReaderObject>;
            public pointIsArray: boolean;
            public addColumnReader(
                columnIndex: (number|undefined),
                configName: string
            ): void;
            public getReferencedColumnIndexes(): Array<number>;
            public hasReader(configName: string): (boolean|undefined);
            public populateColumns(freeIndexes: Array<number>): boolean;
            public read<DataItemType>(
                columns: Array<Array<DataItemType>>,
                rowIndex: number
            ): (Array<DataItemType>|Dictionary<DataItemType>);
        }
        function data(
            dataOptions: DataOptions,
            chartOptions?: Options,
            chart?: Chart
        ): Data;
    }
}

const seriesTypes = BaseSeries.seriesTypes as Record<string, any>;

/**
 * Callback function to modify the CSV before parsing it by the data module.
 *
 * @callback Highcharts.DataBeforeParseCallbackFunction
 *
 * @param {string} csv
 *        The CSV to modify.
 *
 * @return {string}
 *         The CSV to parse.
 */

/**
 * Callback function that gets called after parsing data.
 *
 * @callback Highcharts.DataCompleteCallbackFunction
 *
 * @param {Highcharts.Options} chartOptions
 *        The chart options that were used.
 */

/**
 * Callback function that returns the correspondig Date object to a match.
 *
 * @callback Highcharts.DataDateFormatCallbackFunction
 *
 * @param {Array<number>} match
 *
 * @return {number}
 */

/**
 * Structure for alternative date formats to parse.
 *
 * @interface Highcharts.DataDateFormatObject
 *//**
 * @name Highcharts.DataDateFormatObject#alternative
 * @type {string|undefined}
 *//**
 * @name Highcharts.DataDateFormatObject#parser
 * @type {Highcharts.DataDateFormatCallbackFunction}
 *//**
 * @name Highcharts.DataDateFormatObject#regex
 * @type {global.RegExp}
 */

/**
 * Possible types for a data item in a column or row.
 *
 * @typedef {number|string|null} Highcharts.DataValueType
 */

/**
 * Callback function to parse string representations of dates into
 * JavaScript timestamps (milliseconds since 1.1.1970).
 *
 * @callback Highcharts.DataParseDateCallbackFunction
 *
 * @param {string} dateValue
 *
 * @return {number}
 *         Timestamp (milliseconds since 1.1.1970) as integer for Date class.
 */

/**
 * Callback function to access the parsed columns, the two-dimentional
 * input data array directly, before they are interpreted into series
 * data and categories.
 *
 * @callback Highcharts.DataParsedCallbackFunction
 *
 * @param {Array<Array<*>>} columns
 *        The parsed columns by the data module.
 *
 * @return {boolean|undefined}
 *         Return `false` to stop completion, or call `this.complete()` to
 *         continue async.
 */

/**
 * The Data module provides a simplified interface for adding data to
 * a chart from sources like CVS, HTML tables or grid views. See also
 * the [tutorial article on the Data module](
 * https://www.highcharts.com/docs/working-with-data/data-module).
 *
 * It requires the `modules/data.js` file to be loaded.
 *
 * Please note that the default way of adding data in Highcharts, without
 * the need of a module, is through the [series._type_.data](#series.line.data)
 * option.
 *
 * @sample {highcharts} highcharts/demo/column-parsed/
 *         HTML table
 * @sample {highcharts} highcharts/data/csv/
 *         CSV
 *
 * @since     4.0
 * @requires  modules/data
 * @apioption data
 */

/**
 * A callback function to modify the CSV before parsing it. Return the modified
 * string.
 *
 * @sample {highcharts} highcharts/demo/line-ajax/
 *         Modify CSV before parse
 *
 * @type      {Highcharts.DataBeforeParseCallbackFunction}
 * @since     6.1
 * @apioption data.beforeParse
 */

/**
 * A two-dimensional array representing the input data on tabular form.
 * This input can be used when the data is already parsed, for example
 * from a grid view component. Each cell can be a string or number.
 * If not switchRowsAndColumns is set, the columns are interpreted as
 * series.
 *
 * @see [data.rows](#data.rows)
 *
 * @sample {highcharts} highcharts/data/columns/
 *         Columns
 *
 * @type      {Array<Array<Highcharts.DataValueType>>}
 * @since     4.0
 * @apioption data.columns
 */

/**
 * The callback that is evaluated when the data is finished loading,
 * optionally from an external source, and parsed. The first argument
 * passed is a finished chart options object, containing the series.
 * These options can be extended with additional options and passed
 * directly to the chart constructor.
 *
 * @see [data.parsed](#data.parsed)
 *
 * @sample {highcharts} highcharts/data/complete/
 *         Modify data on complete
 *
 * @type      {Highcharts.DataCompleteCallbackFunction}
 * @since     4.0
 * @apioption data.complete
 */

/**
 * A comma delimited string to be parsed. Related options are [startRow](
 * #data.startRow), [endRow](#data.endRow), [startColumn](#data.startColumn)
 * and [endColumn](#data.endColumn) to delimit what part of the table
 * is used. The [lineDelimiter](#data.lineDelimiter) and [itemDelimiter](
 * #data.itemDelimiter) options define the CSV delimiter formats.
 *
 * The built-in CSV parser doesn't support all flavours of CSV, so in
 * some cases it may be necessary to use an external CSV parser. See
 * [this example](https://jsfiddle.net/highcharts/u59176h4/) of parsing
 * CSV through the MIT licensed [Papa Parse](http://papaparse.com/)
 * library.
 *
 * @sample {highcharts} highcharts/data/csv/
 *         Data from CSV
 *
 * @type      {string}
 * @since     4.0
 * @apioption data.csv
 */

/**
 * Which of the predefined date formats in Date.prototype.dateFormats
 * to use to parse date values. Defaults to a best guess based on what
 * format gives valid and ordered dates. Valid options include: `YYYY/mm/dd`,
 * `dd/mm/YYYY`, `mm/dd/YYYY`, `dd/mm/YY`, `mm/dd/YY`.
 *
 * @see [data.parseDate](#data.parseDate)
 *
 * @sample {highcharts} highcharts/data/dateformat-auto/
 *         Best guess date format
 *
 * @type       {string}
 * @since      4.0
 * @validvalue ["YYYY/mm/dd", "dd/mm/YYYY", "mm/dd/YYYY", "dd/mm/YYYY",
 *             "dd/mm/YY", "mm/dd/YY"]
 * @apioption  data.dateFormat
 */

/**
 * The decimal point used for parsing numbers in the CSV.
 *
 * If both this and data.delimiter is set to `undefined`, the parser will
 * attempt to deduce the decimal point automatically.
 *
 * @sample {highcharts} highcharts/data/delimiters/
 *         Comma as decimal point
 *
 * @type      {string}
 * @default   .
 * @since     4.1.0
 * @apioption data.decimalPoint
 */

/**
 * In tabular input data, the last column (indexed by 0) to use. Defaults
 * to the last column containing data.
 *
 * @sample {highcharts} highcharts/data/start-end/
 *         Limited data
 *
 * @type      {number}
 * @since     4.0
 * @apioption data.endColumn
 */

/**
 * In tabular input data, the last row (indexed by 0) to use. Defaults
 * to the last row containing data.
 *
 * @sample {highcharts} highcharts/data/start-end/
 *         Limited data
 *
 * @type      {number}
 * @since     4.0.4
 * @apioption data.endRow
 */

/**
 * Whether to use the first row in the data set as series names.
 *
 * @sample {highcharts} highcharts/data/start-end/
 *         Don't get series names from the CSV
 * @sample {highstock} highcharts/data/start-end/
 *         Don't get series names from the CSV
 *
 * @type      {boolean}
 * @default   true
 * @since     4.1.0
 * @product   highcharts highstock gantt
 * @apioption data.firstRowAsNames
 */

/**
 * The key for a Google Spreadsheet to load. See [general information
 * on GS](https://developers.google.com/gdata/samples/spreadsheet_sample).
 *
 * @sample {highcharts} highcharts/data/google-spreadsheet/
 *         Load a Google Spreadsheet
 *
 * @type      {string}
 * @since     4.0
 * @apioption data.googleSpreadsheetKey
 */

/**
 * The Google Spreadsheet worksheet to use in combination with
 * [googleSpreadsheetKey](#data.googleSpreadsheetKey). The available id's from
 * your sheet can be read from `https://spreadsheets.google.com/feeds/worksheets/{key}/public/basic`.
 *
 * @sample {highcharts} highcharts/data/google-spreadsheet/
 *         Load a Google Spreadsheet
 *
 * @type      {string}
 * @since     4.0
 * @apioption data.googleSpreadsheetWorksheet
 */

/**
 * Item or cell delimiter for parsing CSV. Defaults to the tab character
 * `\t` if a tab character is found in the CSV string, if not it defaults
 * to `,`.
 *
 * If this is set to false or undefined, the parser will attempt to deduce
 * the delimiter automatically.
 *
 * @sample {highcharts} highcharts/data/delimiters/
 *         Delimiters
 *
 * @type      {string}
 * @since     4.0
 * @apioption data.itemDelimiter
 */

/**
 * Line delimiter for parsing CSV.
 *
 * @sample {highcharts} highcharts/data/delimiters/
 *         Delimiters
 *
 * @type      {string}
 * @default   \n
 * @since     4.0
 * @apioption data.lineDelimiter
 */

/**
 * A callback function to access the parsed columns, the two-dimentional
 * input data array directly, before they are interpreted into series
 * data and categories. Return `false` to stop completion, or call
 * `this.complete()` to continue async.
 *
 * @see [data.complete](#data.complete)
 *
 * @sample {highcharts} highcharts/data/parsed/
 *         Modify data after parse
 *
 * @type      {Highcharts.DataParsedCallbackFunction}
 * @since     4.0
 * @apioption data.parsed
 */

/**
 * A callback function to parse string representations of dates into
 * JavaScript timestamps. Should return an integer timestamp on success.
 *
 * @see [dateFormat](#data.dateFormat)
 *
 * @type      {Highcharts.DataParseDateCallbackFunction}
 * @since     4.0
 * @apioption data.parseDate
 */

/**
 * The same as the columns input option, but defining rows intead of
 * columns.
 *
 * @see [data.columns](#data.columns)
 *
 * @sample {highcharts} highcharts/data/rows/
 *         Data in rows
 *
 * @type      {Array<Array<Highcharts.DataValueType>>}
 * @since     4.0
 * @apioption data.rows
 */

/**
 * An array containing dictionaries for each series. A dictionary exists of
 * Point property names as the key and the CSV column index as the value.
 *
 * @sample {highcharts} highcharts/data/seriesmapping-label/
 *         Label from data set
 *
 * @type      {Array<Highcharts.Dictionary<number>>}
 * @since     4.0.4
 * @apioption data.seriesMapping
 */

/**
 * In tabular input data, the first column (indexed by 0) to use.
 *
 * @sample {highcharts} highcharts/data/start-end/
 *         Limited data
 *
 * @type      {number}
 * @default   0
 * @since     4.0
 * @apioption data.startColumn
 */

/**
 * In tabular input data, the first row (indexed by 0) to use.
 *
 * @sample {highcharts} highcharts/data/start-end/
 *         Limited data
 *
 * @type      {number}
 * @default   0
 * @since     4.0
 * @apioption data.startRow
 */

/**
 * Switch rows and columns of the input data, so that `this.columns`
 * effectively becomes the rows of the data set, and the rows are interpreted
 * as series.
 *
 * @sample {highcharts} highcharts/data/switchrowsandcolumns/
 *         Switch rows and columns
 *
 * @type      {boolean}
 * @default   false
 * @since     4.0
 * @apioption data.switchRowsAndColumns
 */

/**
 * An HTML table or the id of such to be parsed as input data. Related
 * options are `startRow`, `endRow`, `startColumn` and `endColumn` to
 * delimit what part of the table is used.
 *
 * @sample {highcharts} highcharts/demo/column-parsed/
 *         Parsed table
 *
 * @type      {string|global.HTMLElement}
 * @since     4.0
 * @apioption data.table
 */

/**
 * An URL to a remote CSV dataset. Will be fetched when the chart is created
 * using Ajax.
 *
 * @sample highcharts/data/livedata-columns
 *         Categorized bar chart with CSV and live polling
 * @sample highcharts/data/livedata-csv
 *         Time based line chart with CSV and live polling
 *
 * @type      {string}
 * @apioption data.csvURL
 */

/**
 * A URL to a remote JSON dataset, structured as a row array.
 * Will be fetched when the chart is created using Ajax.
 *
 * @sample highcharts/data/livedata-rows
 *         Rows with live polling
 *
 * @type      {string}
 * @apioption data.rowsURL
 */

/**
 * A URL to a remote JSON dataset, structured as a column array.
 * Will be fetched when the chart is created using Ajax.
 *
 * @sample highcharts/data/livedata-columns
 *         Columns with live polling
 *
 * @type      {string}
 * @apioption data.columnsURL
 */

/**
 * Sets the refresh rate for data polling when importing remote dataset by
 * setting [data.csvURL](data.csvURL), [data.rowsURL](data.rowsURL),
 * [data.columnsURL](data.columnsURL), or
 * [data.googleSpreadsheetKey](data.googleSpreadsheetKey).
 *
 * Note that polling must be enabled by setting
 * [data.enablePolling](data.enablePolling) to true.
 *
 * The value is the number of seconds between pollings.
 * It cannot be set to less than 1 second.
 *
 * @sample highcharts/demo/live-data
 *         Live data with user set refresh rate
 *
 * @default   1
 * @type      {number}
 * @apioption data.dataRefreshRate
 */

/**
 * Enables automatic refetching of remote datasets every _n_ seconds (defined by
 * setting [data.dataRefreshRate](data.dataRefreshRate)).
 *
 * Only works when either [data.csvURL](data.csvURL),
 * [data.rowsURL](data.rowsURL), [data.columnsURL](data.columnsURL), or
 * [data.googleSpreadsheetKey](data.googleSpreadsheetKey).
 *
 * @sample highcharts/demo/live-data
 *         Live data
 * @sample highcharts/data/livedata-columns
 *         Categorized bar chart with CSV and live polling
 *
 * @type      {boolean}
 * @default   false
 * @apioption data.enablePolling
 */

/* eslint-disable valid-jsdoc */

/**
 * The Data class
 *
 * @requires module:modules/data
 *
 * @class
 * @name Highcharts.Data
 *
 * @param {Highcharts.DataOptions} dataOptions
 *
 * @param {Highcharts.Options} [chartOptions]
 *
 * @param {Highcharts.Chart} [chart]
 */
class Data {
    public constructor(
        dataOptions: Highcharts.DataOptions,
        chartOptions?: Highcharts.Options,
        chart?: Chart
    ) {
        this.init(dataOptions, chartOptions, chart);
    }

    public alternativeFormat?: string;
    public chart: Chart = void 0 as any;
    public chartOptions: Highcharts.Options = void 0 as any;
    public columns?: Array<Array<Highcharts.DataValueType>>;
    public dateFormat?: string;
    public decimalRegex?: RegExp;
    public firstRowAsNames: boolean = void 0 as any;
    public liveDataTimeout?: number;
    public rawColumns: Array<Array<string>> = void 0 as any;
    public options: Highcharts.DataOptions= void 0 as any;
    public valueCount?: Highcharts.DataValueCountObject;

    /**
     * Initialize the Data object with the given options
     *
     * @private
     * @function Highcharts.Data#init
     * @param {Highcharts.DataOptions} options
     * @param {Highcharts.Options} [chartOptions]
     * @param {Highcharts.Chart} [chart]
     */
    public init(
        options: Highcharts.DataOptions,
        chartOptions?: Highcharts.Options,
        chart?: Chart
    ): void {
console.log('asdasdas');
        var decimalPoint = options.decimalPoint,
            hasData;

        if (chartOptions) {
            this.chartOptions = chartOptions;
        }
        if (chart) {
            this.chart = chart;
        }

        if (decimalPoint !== '.' && decimalPoint !== ',') {
            decimalPoint = void 0;
        }

        this.options = options;
        this.columns = (
            options.columns ||
            this.rowsToColumns(options.rows) ||
            []
        );

        this.firstRowAsNames = pick(
            options.firstRowAsNames,
            this.firstRowAsNames,
            true
        );

        this.decimalRegex = (
            decimalPoint &&
            new RegExp('^(-?[0-9]+)' + decimalPoint + '([0-9]+)$')
        );

        // This is a two-dimensional array holding the raw, trimmed string
        // values with the same organisation as the columns array. It makes it
        // possible for example to revert from interpreted timestamps to
        // string-based categories.
        this.rawColumns = [];

        // No need to parse or interpret anything
        if (this.columns.length) {
            this.dataFound();
            hasData = true;
        }

        if (this.hasURLOption(options)) {
            clearTimeout(this.liveDataTimeout);
            hasData = false;
        }

        if (!hasData) {
            // Fetch live data
            hasData = this.fetchLiveData();
        }

        if (!hasData) {
            // Parse a CSV string if options.csv is given. The parseCSV function
            // returns a columns array, if it has no length, we have no data
            hasData = Boolean(this.parseCSV().length);
        }

        if (!hasData) {
            // Parse a HTML table if options.table is given
            hasData = Boolean(this.parseTable().length);
        }

        if (!hasData) {
            // Parse a Google Spreadsheet
            hasData = this.parseGoogleSpreadsheet();
        }

        if (!hasData && options.afterComplete) {
            options.afterComplete();
        }
    }

    public hasURLOption(options: Highcharts.DataOptions): boolean {
        return Boolean(
            options &&
            (options.rowsURL || options.csvURL || options.columnsURL)
        );
    }

    /**
     * Get the column distribution. For example, a line series takes a single
     * column for Y values. A range series takes two columns for low and high
     * values respectively, and an OHLC series takes four columns.
     *
     * @function Highcharts.Data#getColumnDistribution
     */
    public getColumnDistribution(): void {
        var chartOptions = this.chartOptions,
            options = this.options,
            xColumns: Array<number> = [],
            getValueCount = function (type: string): number {
                return (
                    seriesTypes[type || 'line'].prototype.pointArrayMap || [0]
                ).length;
            },
            getPointArrayMap = function (
                type: string
            ): (Array<string>|undefined) {
                return seriesTypes[type || 'line'].prototype.pointArrayMap;
            },
            globalType: string = (
                chartOptions &&
                chartOptions.chart &&
                chartOptions.chart.type
            ) as any,
            individualCounts: Array<number> = [],
            seriesBuilders: Array<Highcharts.SeriesBuilder> = [],
            seriesIndex = 0,

            // If no series mapping is defined, check if the series array is
            // defined with types.
            seriesMapping = (
                (options && options.seriesMapping) ||
                (
                    chartOptions &&
                    chartOptions.series &&
                    chartOptions.series.map(function (
                    ): Highcharts.Dictionary<number> {
                        return { x: 0 };
                    })
                ) ||
                []
            ),
            i;

        ((chartOptions && chartOptions.series) || []).forEach(
            function (series: Highcharts.SeriesOptions): void {
                individualCounts.push(getValueCount(series.type || globalType));
            }
        );

        // Collect the x-column indexes from seriesMapping
        seriesMapping.forEach(function (
            mapping: Highcharts.Dictionary<number>
        ): void {
            xColumns.push(mapping.x || 0);
        });

        // If there are no defined series with x-columns, use the first column
        // as x column
        if (xColumns.length === 0) {
            xColumns.push(0);
        }

        // Loop all seriesMappings and constructs SeriesBuilders from
        // the mapping options.
        seriesMapping.forEach(function (
            mapping: Highcharts.Dictionary<number>
        ): void {
            var builder = new SeriesBuilder(),
                numberOfValueColumnsNeeded = individualCounts[seriesIndex] ||
                    getValueCount(globalType),
                seriesArr = (chartOptions && chartOptions.series) || [],
                series = seriesArr[seriesIndex] || {},
                defaultPointArrayMap = getPointArrayMap(
                    series.type || globalType
                ),
                pointArrayMap = defaultPointArrayMap || ['y'];

            if (
                // User-defined x.mapping
                defined(mapping.x) ||
                // All non cartesian don't need 'x'
                (series as any).isCartesian ||
                // Except pie series:
                !defaultPointArrayMap
            ) {
                // Add an x reader from the x property or from an undefined
                // column if the property is not set. It will then be auto
                // populated later.
                builder.addColumnReader(mapping.x, 'x');
            }

            // Add all column mappings
            objectEach(mapping, function (val: number, name: string): void {
                if (name !== 'x') {
                    builder.addColumnReader(val, name);
                }
            });

            // Add missing columns
            for (i = 0; i < numberOfValueColumnsNeeded; i++) {
                if (!builder.hasReader(pointArrayMap[i])) {
                    // Create and add a column reader for the next free column
                    // index
                    builder.addColumnReader(void 0, pointArrayMap[i]);
                }
            }

            seriesBuilders.push(builder);
            seriesIndex++;
        });

        var globalPointArrayMap = getPointArrayMap(globalType);

        if (typeof globalPointArrayMap === 'undefined') {
            globalPointArrayMap = ['y'];
        }

        this.valueCount = {
            global: getValueCount(globalType as any),
            xColumns: xColumns,
            individual: individualCounts,
            seriesBuilders: seriesBuilders,
            globalPointArrayMap: globalPointArrayMap
        };
    }

    /**
     * When the data is parsed into columns, either by CSV, table, GS or direct
     * input, continue with other operations.
     *
     * @private
     * @function Highcharts.Data#dataFound
     */
    public dataFound(): void {
        if (this.options.switchRowsAndColumns) {
            this.columns = this.rowsToColumns(this.columns);
        }

        // Interpret the info about series and columns
        this.getColumnDistribution();

        // Interpret the values into right types
        this.parseTypes();

        // Handle columns if a handleColumns callback is given
        if (this.parsed() !== false) {

            // Complete if a complete callback is given
            this.complete();
        }

    }

    /**
     * Parse a CSV input string
     *
     * @function Highcharts.Data#parseCSV
     *
     * @param {Highcharts.DataOptions} [inOptions]
     *
     * @return {Array<Array<Highcharts.DataValueType>>}
     */
    public parseCSV(inOptions?: Highcharts.DataOptions): Array<Array<Highcharts.DataValueType>> {
        var self = this,
            options = inOptions || this.options,
            csv = options.csv,
            columns: Array<Array<Highcharts.DataValueType>>,
            startRow = (
                typeof options.startRow !== 'undefined' && options.startRow ?
                    options.startRow :
                    0
            ),
            endRow = options.endRow || Number.MAX_VALUE,
            startColumn = (
                typeof options.startColumn !== 'undefined' &&
                options.startColumn
            ) ? options.startColumn : 0,
            endColumn = options.endColumn || Number.MAX_VALUE,
            itemDelimiter: string,
            lines,
            rowIt = 0,
            // activeRowNo = 0,
            dataTypes: Array<Array<string>> = [],
            // We count potential delimiters in the prepass, and use the
            // result as the basis of half-intelligent guesses.
            potDelimiters: Highcharts.Dictionary<number> = {
                ',': 0,
                ';': 0,
                '\t': 0
            };

        columns = this.columns = [];

        /*
            This implementation is quite verbose. It will be shortened once
            it's stable and passes all the test.

            It's also not written with speed in mind, instead everything is
            very seggregated, and there a several redundant loops.
            This is to make it easier to stabilize the code initially.

            We do a pre-pass on the first 4 rows to make some intelligent
            guesses on the set. Guessed delimiters are in this pass counted.

            Auto detecting delimiters
                - If we meet a quoted string, the next symbol afterwards
                  (that's not \s, \t) is the delimiter
                - If we meet a date, the next symbol afterwards is the delimiter

            Date formats
                - If we meet a column with date formats, check all of them to
                  see if one of the potential months crossing 12. If it does,
                  we now know the format

            It would make things easier to guess the delimiter before
            doing the actual parsing.

            General rules:
                - Quoting is allowed, e.g: "Col 1",123,321
                - Quoting is optional, e.g.: Col1,123,321
                - Doubble quoting is escaping, e.g. "Col ""Hello world""",123
                - Spaces are considered part of the data: Col1 ,123
                - New line is always the row delimiter
                - Potential column delimiters are , ; \t
                - First row may optionally contain headers
                - The last row may or may not have a row delimiter
                - Comments are optionally supported, in which case the comment
                  must start at the first column, and the rest of the line will
                  be ignored
        */

        /**
         * Parse a single row.
         * @private
         */
        function parseRow(
            columnStr: string,
            rowNumber: number,
            noAdd?: boolean,
            callbacks?: Highcharts.Dictionary<Function>
        ): void {
            var i = 0,
                c = '',
                cl = '',
                cn = '',
                token = '',
                actualColumn = 0,
                column = 0;

            /**
             * @private
             */
            function read(j: number): void {
                c = columnStr[j];
                cl = columnStr[j - 1];
                cn = columnStr[j + 1];
            }

            /**
             * @private
             */
            function pushType(type: string): void {
                if (dataTypes.length < column + 1) {
                    dataTypes.push([type]);
                }
                if (dataTypes[column][dataTypes[column].length - 1] !== type) {
                    dataTypes[column].push(type);
                }
            }

            /**
             * @private
             */
            function push(): void {
                if (startColumn > actualColumn || actualColumn > endColumn) {
                    // Skip this column, but increment the column count (#7272)
                    ++actualColumn;
                    token = '';
                    return;
                }

                if (!isNaN(parseFloat(token)) && isFinite(token as any)) {
                    token = parseFloat(token) as any;
                    pushType('number');
                } else if (!isNaN(Date.parse(token))) {
                    token = token.replace(/\//g, '-');
                    pushType('date');
                } else {
                    pushType('string');
                }

                if (columns.length < column + 1) {
                    columns.push([]);
                }

                if (!noAdd) {
                    // Don't push - if there's a varrying amount of columns
                    // for each row, pushing will skew everything down n slots
                    columns[column][rowNumber] = token;
                }

                token = '';
                ++column;
                ++actualColumn;
            }

            if (!columnStr.trim().length) {
                return;
            }

            if (columnStr.trim()[0] === '#') {
                return;
            }

            for (; i < columnStr.length; i++) {
                read(i);

                // Quoted string
                if (c === '#') {
                    // The rest of the row is a comment
                    push();
                    return;
                }

                if (c === '"') {
                    read(++i);

                    while (i < columnStr.length) {
                        if (c === '"' && cl !== '"' && cn !== '"') {
                            break;
                        }

                        if (c !== '"' || (c === '"' && cl !== '"')) {
                            token += c;
                        }

                        read(++i);
                    }

                // Perform "plugin" handling
                } else if (callbacks && callbacks[c]) {
                    if (callbacks[c](c, token)) {
                        push();
                    }

                // Delimiter - push current token
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
         * Attempt to guess the delimiter. We do a separate parse pass here
         * because we need to count potential delimiters softly without making
         * any assumptions.
         * @private
         */
        function guessDelimiter(lines: Array<string>): string {
            var points = 0,
                commas = 0,
                guessed: string = false as any;

            lines.some(function (
                columnStr: string,
                i: number
            ): (boolean|undefined) {
                var inStr = false,
                    c,
                    cn,
                    cl,
                    token = '';


                // We should be able to detect dateformats within 13 rows
                if (i > 13) {
                    return true;
                }

                for (var j = 0; j < columnStr.length; j++) {
                    c = columnStr[j];
                    cn = columnStr[j + 1];
                    cl = columnStr[j - 1];

                    if (c === '#') {
                        // Skip the rest of the line - it's a comment
                        return;
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
                            isNaN(token as any) ||
                            !isFinite(token as any)
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
            } as any);

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
            if (!options.decimalPoint) {
                if (points > commas) {
                    options.decimalPoint = '.';
                } else {
                    options.decimalPoint = ',';
                }

                // Apply a new decimal regex based on the presumed decimal sep.
                self.decimalRegex = new RegExp(
                    '^(-?[0-9]+)' +
                    options.decimalPoint +
                    '([0-9]+)$'
                );
            }

            return guessed;
        }

        /**
         * Tries to guess the date format
         *  - Check if either month candidate exceeds 12
         *  - Check if year is missing (use current year)
         *  - Check if a shortened year format is used (e.g. 1/1/99)
         *  - If no guess can be made, the user must be prompted
         * data is the data to deduce a format based on
         * @private
         */
        function deduceDateFormat(data: Array<string>, limit?: number): string {
            var format = 'YYYY/mm/dd',
                thing: Array<Highcharts.DataValueType>,
                guessedFormat: Array<string> = [],
                calculatedFormat: string,
                i = 0,
                madeDeduction = false,
                // candidates = {},
                stable = [],
                max: Array<number> = [],
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
                        .replace(/\//g, ' ')
                        .replace(/\-/g, ' ')
                        .replace(/\./g, ' ')
                        .split(' ');

                    guessedFormat = [
                        '',
                        '',
                        ''
                    ];


                    for (j = 0; j < thing.length; j++) {
                        if (j < guessedFormat.length) {
                            thing[j] = parseInt(thing[j] as any, 10);

                            if (thing[j]) {

                                max[j] = (
                                    !max[j] || max[j] < (thing[j] as any)
                                ) ?
                                    (thing[j] as any) :
                                    max[j];

                                if (typeof stable[j] !== 'undefined') {
                                    if (stable[j] !== thing[j]) {
                                        stable[j] = false;
                                    }
                                } else {
                                    stable[j] = thing[j];
                                }

                                if ((thing[j] as any) > 31) {
                                    if ((thing[j] as any) < 100) {
                                        guessedFormat[j] = 'YY';
                                    } else {
                                        guessedFormat[j] = 'YYYY';
                                    }
                                    // madeDeduction = true;
                                } else if (
                                    (thing[j] as any) > 12 &&
                                    (thing[j] as any) <= 31
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

                calculatedFormat = guessedFormat.join('/');

                // If the caculated format is not valid, we need to present an
                // error.

                if (
                    !(options.dateFormats || self.dateFormats)[calculatedFormat]
                ) {
                    // This should emit an event instead
                    (fireEvent as any)('deduceDateFailed');
                    return format;
                }

                return calculatedFormat;
            }

            return format;
        }

        /**
         * @todo
         * Figure out the best axis types for the data
         * - If the first column is a number, we're good
         * - If the first column is a date, set to date/time
         * - If the first column is a string, set to categories
         * @private
         */
        function deduceAxisTypes(): void {

        }

        if (csv && options.beforeParse) {
            csv = options.beforeParse.call(this, csv);
        }

        if (csv) {

            lines = csv
                .replace(/\r\n/g, '\n') // Unix
                .replace(/\r/g, '\n') // Mac
                .split(options.lineDelimiter || '\n');

            if (!startRow || startRow < 0) {
                startRow = 0;
            }

            if (!endRow || endRow >= lines.length) {
                endRow = lines.length - 1;
            }

            if (options.itemDelimiter) {
                itemDelimiter = options.itemDelimiter;
            } else {
                itemDelimiter = null as any;
                itemDelimiter = guessDelimiter(lines);
            }

            var offset = 0;

            for (rowIt = startRow; rowIt <= endRow; rowIt++) {
                if (lines[rowIt][0] === '#') {
                    offset++;
                } else {
                    parseRow(lines[rowIt], rowIt - startRow - offset);
                }
            }

            // //Make sure that there's header columns for everything
            // columns.forEach(function (col) {

            // });

            deduceAxisTypes();

            if ((!options.columnTypes || options.columnTypes.length === 0) &&
                dataTypes.length &&
                dataTypes[0].length &&
                dataTypes[0][1] === 'date' &&
                !options.dateFormat) {
                options.dateFormat = deduceDateFormat(columns[0] as any);
            }


            // lines.forEach(function (line, rowNo) {
            //    var trimmed = self.trim(line),
            //        isComment = trimmed.indexOf('#') === 0,
            //        isBlank = trimmed === '',
            //        items;

            //    if (
            //        rowNo >= startRow &&
            //        rowNo <= endRow &&
            //        !isComment && !isBlank
            //    ) {
            //        items = line.split(itemDelimiter);
            //        items.forEach(function (item, colNo) {
            //            if (colNo >= startColumn && colNo <= endColumn) {
            //                if (!columns[colNo - startColumn]) {
            //                    columns[colNo - startColumn] = [];
            //                }

            //                columns[colNo - startColumn][activeRowNo] = item;
            //            }
            //        });
            //        activeRowNo += 1;
            //    }
            // });
            //

            this.dataFound();
        }

        return columns;
    }

    /**
     * Parse a HTML table
     *
     * @function Highcharts.Data#parseTable
     *
     * @return {Array<Array<Highcharts.DataValueType>>}
     */
    public parseTable(): Array<Array<Highcharts.DataValueType>> {
        var options = this.options,
            table: HTMLElement = options.table as any,
            columns = this.columns || [],
            startRow = options.startRow || 0,
            endRow = options.endRow || Number.MAX_VALUE,
            startColumn = options.startColumn || 0,
            endColumn = options.endColumn || Number.MAX_VALUE;

        if (table) {

            if (typeof table === 'string') {
                table = doc.getElementById(table) as any;
            }

            [].forEach.call(table.getElementsByTagName('tr'), function (
                tr: HTMLTableRowElement,
                rowNo: number
            ): void {
                if (rowNo >= startRow && rowNo <= endRow) {
                    [].forEach.call(tr.children, function (
                        item: Element,
                        colNo: number
                    ): void {
                        const row = (columns as any)[colNo - startColumn];
                        let i = 1;

                        if (
                            (
                                item.tagName === 'TD' ||
                                item.tagName === 'TH'
                            ) &&
                            colNo >= startColumn &&
                            colNo <= endColumn
                        ) {
                            if (!(columns as any)[colNo - startColumn]) {
                                (columns as any)[colNo - startColumn] = [];
                            }

                            (columns as any)[colNo - startColumn][
                                rowNo - startRow
                            ] = item.innerHTML;

                            // Loop over all previous indices and make sure
                            // they are nulls, not undefined.
                            while (
                                rowNo - startRow >= i &&
                                row[rowNo - startRow - i] === void 0
                            ) {
                                row[rowNo - startRow - i] = null;
                                i++;
                            }
                        }
                    });
                }
            });

            this.dataFound(); // continue
        }
        return columns;
    }


    /**
     * Fetch or refetch live data
     *
     * @function Highcharts.Data#fetchLiveData
     *
     * @return {boolean}
     *         The URLs that were tried can be found in the options
     */
    public fetchLiveData(): boolean {
        var data = this,
            chart = this.chart,
            options = this.options,
            maxRetries = 3,
            currentRetries = 0,
            pollingEnabled = options.enablePolling,
            updateIntervalMs = (options.dataRefreshRate || 2) * 1000,
            originalOptions = merge(options);

        if (!this.hasURLOption(options)) {
            return false;
        }

        // Do not allow polling more than once a second
        if (updateIntervalMs < 1000) {
            updateIntervalMs = 1000;
        }

        delete options.csvURL;
        delete options.rowsURL;
        delete options.columnsURL;

        /**
         * @private
         */
        function performFetch(initialFetch?: boolean): void {

            /**
             * Helper function for doing the data fetch + polling.
             * @private
             */
            function request(
                url: (string|undefined),
                done: Function,
                tp?: string
            ): boolean {
                if (!url || url.indexOf('http') !== 0) {
                    if (url && options.error) {
                        options.error('Invalid URL');
                    }
                    return false;
                }

                if (initialFetch) {
                    clearTimeout(data.liveDataTimeout);
                    chart.liveDataURL = url;
                }

                /**
                 * @private
                 */
                function poll(): void {
                    // Poll
                    if (pollingEnabled && chart.liveDataURL === url) {
                        // We need to stop doing this if the URL has changed
                        data.liveDataTimeout =
                            setTimeout(performFetch, updateIntervalMs);
                    }
                }

                ajax({
                    url: url,
                    dataType: tp || 'json',
                    success: function (
                        res: (string|Highcharts.JSONType)
                    ): void {
                        if (chart && chart.series) {
                            done(res);
                        }

                        poll();

                    },
                    error: function (
                        xhr: XMLHttpRequest,
                        text: (string|Error)
                    ): void {
                        if (++currentRetries < maxRetries) {
                            poll();
                        }

                        return options.error && options.error(text, xhr);
                    }
                });

                return true;
            }

            if (!request(
                originalOptions.csvURL,
                function (
                    res: (string|Highcharts.JSONType)
                ): void {
                    chart.update({
                        data: {
                            csv: res
                        }
                    });
                },
                'text'
            )) {
                if (!request(originalOptions.rowsURL, function (
                    res: (string|Highcharts.JSONType)
                ): void {
                    chart.update({
                        data: {
                            rows: res
                        }
                    });
                })) {
                    request(originalOptions.columnsURL, function (
                        res: (string|Highcharts.JSONType)
                    ): void {
                        chart.update({
                            data: {
                                columns: res
                            }
                        });
                    });
                }
            }
        }

        performFetch(true);

        return this.hasURLOption(options);
    }


    /**
     * Parse a Google spreadsheet.
     *
     * @function Highcharts.Data#parseGoogleSpreadsheet
     *
     * @return {boolean}
     *         Always returns false, because it is an intermediate fetch.
     */
    public parseGoogleSpreadsheet(): boolean {
console.log('aaaa');
        //const result = new DataTable();
        //const connector = new GoogleSheetsConnector(result, this.options);

        /*var data = this,
            options = this.options,
            googleSpreadsheetKey = options.googleSpreadsheetKey,
            chart = this.chart,
            // use sheet 1 as the default rather than od6
            // as the latter sometimes cause issues (it looks like it can
            // be renamed in some cases, ref. a fogbugz case).
            worksheet = options.googleSpreadsheetWorksheet || 1,
            startRow = options.startRow || 0,
            endRow = options.endRow || Number.MAX_VALUE,
            startColumn = options.startColumn || 0,
            endColumn = options.endColumn || Number.MAX_VALUE,
            refreshRate = (options.dataRefreshRate || 2) * 1000;

        if (refreshRate < 4000) {
            refreshRate = 4000;
        }
        function fetchSheet(fn: Function): void {
            var url = [
                'https://spreadsheets.google.com/feeds/cells',
                googleSpreadsheetKey,
                worksheet,
                'public/values?alt=json'
            ].join('/');

            ajax({
                url: url,
                dataType: 'json',
                success: function (json: Highcharts.JSONType): void {
                    fn(json);

                    if (options.enablePolling) {
                        setTimeout(
                            function (): void {
                                fetchSheet(fn);
                            },
                            (options.dataRefreshRate || 2) * 1000
                        );
                    }
                },
                error: function (
                    xhr: XMLHttpRequest,
                    text: (string|Error)
                ): void {
                    return options.error && options.error(text, xhr);
                }
            });
        }

        if (googleSpreadsheetKey) {

            delete options.googleSpreadsheetKey;

            fetchSheet(function (
                json: Highcharts.JSONType
            ): (boolean|undefined) {
                // Prepare the data from the spreadsheat
                var columns: Array<Array<Highcharts.DataValueType>> = [],
                    cells = json.feed.entry,
                    cell,
                    cellCount = (cells || []).length,
                    colCount = 0,
                    rowCount = 0,
                    val,
                    gr,
                    gc,
                    cellInner,
                    i: number;

                if (!cells || cells.length === 0) {
                    return false;
                }

                // First, find the total number of columns and rows that
                // are actually filled with data
                for (i = 0; i < cellCount; i++) {
                    cell = cells[i];
                    colCount = Math.max(colCount, cell.gs$cell.col);
                    rowCount = Math.max(rowCount, cell.gs$cell.row);
                }

                // Set up arrays containing the column data
                for (i = 0; i < colCount; i++) {
                    if (i >= startColumn && i <= endColumn) {
                        // Create new columns with the length of either
                        // end-start or rowCount
                        columns[i - startColumn] = [];
                    }
                }

                // Loop over the cells and assign the value to the right
                // place in the column arrays
                for (i = 0; i < cellCount; i++) {
                    cell = cells[i];
                    gr = cell.gs$cell.row - 1; // rows start at 1
                    gc = cell.gs$cell.col - 1; // columns start at 1

                    // If both row and col falls inside start and end set the
                    // transposed cell value in the newly created columns
                    if (gc >= startColumn && gc <= endColumn &&
                        gr >= startRow && gr <= endRow) {

                        cellInner = cell.gs$cell || cell.content;

                        val = null;

                        if (cellInner.numericValue) {
                            if (cellInner.$t.indexOf('/') >= 0 ||
                                cellInner.$t.indexOf('-') >= 0) {
                                // This is a date - for future reference.
                                val = cellInner.$t;
                            } else if (cellInner.$t.indexOf('%') > 0) {
                                // Percentage
                                val = parseFloat(cellInner.numericValue) * 100;
                            } else {
                                val = parseFloat(cellInner.numericValue);
                            }
                        } else if (cellInner.$t && cellInner.$t.length) {
                            val = cellInner.$t;
                        }

                        columns[gc - startColumn][gr - startRow] = val;
                    }
                }

                // Insert null for empty spreadsheet cells (#5298)
                columns.forEach(function (
                    column: Array<Highcharts.DataValueType>
                ): void {
                    for (i = 0; i < column.length; i++) {
                        if (typeof column[i] === 'undefined') {
                            column[i] = null as any;
                        }
                    }
                });

                if (chart && chart.series) {
                    chart.update({
                        data: {
                            columns: columns
                        }
                    });
                } else { // #8245
                    data.columns = columns;
                    data.dataFound();
                }
            });*/
        //}

        // This is an intermediate fetch, so always return false.
        return false;
    }

    /**
     * Trim a string from whitespaces.
     *
     * @function Highcharts.Data#trim
     *
     * @param {string} str
     *        String to trim
     *
     * @param {boolean} [inside=false]
     *        Remove all spaces between numbers.
     *
     * @return {string}
     *         Trimed string
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

            if (this.decimalRegex) {
                str = str.replace(this.decimalRegex, '$1.$2');
            }
        }
        return str;
    }

    /**
     * Parse numeric cells in to number types and date types in to true dates.
     *
     * @function Highcharts.Data#parseTypes
     */
    public parseTypes(): void {
        var columns = this.columns,
            col = (columns as any).length;

        while (col--) {
            this.parseColumn((columns as any)[col], col);
        }

    }

    /**
     * Parse a single column. Set properties like .isDatetime and .isNumeric.
     *
     * @function Highcharts.Data#parseColumn
     *
     * @param {Array<Highcharts.DataValueType>} column
     *        Column to parse
     *
     * @param {number} col
     *        Column index
     */
    public parseColumn(
        column: Array<Highcharts.DataValueType>,
        col: number
    ): void {
        var rawColumns = this.rawColumns,
            columns = this.columns,
            row = column.length,
            val: Highcharts.DataValueType,
            floatVal,
            trimVal,
            trimInsideVal,
            firstRowAsNames = this.firstRowAsNames,
            isXColumn = (this.valueCount as any).xColumns.indexOf(col) !== -1,
            dateVal,
            backup: Array<Highcharts.DataValueType> = [],
            diff,
            chartOptions = this.chartOptions,
            descending,
            columnTypes = this.options.columnTypes || [],
            columnType = columnTypes[col],
            forceCategory = isXColumn && ((
                chartOptions &&
                chartOptions.xAxis &&
                splat(chartOptions.xAxis)[0].type === 'category'
            ) || columnType === 'string');

        if (!rawColumns[col]) {
            rawColumns[col] = [];
        }
        while (row--) {
            val = backup[row] || column[row];

            trimVal = this.trim(val as any);
            trimInsideVal = this.trim(val as any, true);
            floatVal = parseFloat(trimInsideVal);

            // Set it the first time
            if (typeof rawColumns[col][row] === 'undefined') {
                rawColumns[col][row] = trimVal;
            }

            // Disable number or date parsing by setting the X axis type to
            // category
            if (forceCategory || (row === 0 && firstRowAsNames)) {
                column[row] = '' + trimVal;

            } else if (+trimInsideVal === floatVal) { // is numeric

                column[row] = floatVal;

                // If the number is greater than milliseconds in a year, assume
                // datetime
                if (
                    floatVal > 365 * 24 * 3600 * 1000 &&
                    columnType !== 'float'
                ) {
                    (column as any).isDatetime = true;
                } else {
                    (column as any).isNumeric = true;
                }

                if (typeof column[row + 1] !== 'undefined') {
                    descending = floatVal > (column[row + 1] as any);
                }

            // String, continue to determine if it is a date string or really a
            // string
            } else {
                if (trimVal && trimVal.length) {
                    dateVal = this.parseDate(val as any);
                }

                // Only allow parsing of dates if this column is an x-column
                if (isXColumn && isNumber(dateVal) && columnType !== 'float') {
                    backup[row] = val;
                    column[row] = dateVal;
                    (column as any).isDatetime = true;

                    // Check if the dates are uniformly descending or ascending.
                    // If they are not, chances are that they are a different
                    // time format, so check for alternative.
                    if (typeof column[row + 1] !== 'undefined') {
                        diff = dateVal > (column[row + 1] as any);
                        if (
                            diff !== descending &&
                            typeof descending !== 'undefined'
                        ) {
                            if (this.alternativeFormat) {
                                this.dateFormat = this.alternativeFormat;
                                row = column.length;
                                this.alternativeFormat =
                                    this.dateFormats[this.dateFormat]
                                        .alternative;
                            } else {
                                (column as any).unsorted = true;
                            }
                        }
                        descending = diff;
                    }

                } else { // string
                    column[row] = trimVal === '' ? null : trimVal;
                    if (
                        row !== 0 &&
                        (
                            (column as any).isDatetime ||
                            (column as any).isNumeric
                        )
                    ) {
                        (column as any).mixed = true;
                    }
                }
            }
        }

        // If strings are intermixed with numbers or dates in a parsed column,
        // it is an indication that parsing went wrong or the data was not
        // intended to display as numbers or dates and parsing is too
        // aggressive. Fall back to categories. Demonstrated in the
        // highcharts/demo/column-drilldown sample.
        if (isXColumn && (column as any).mixed) {
            (columns as any)[col] = rawColumns[col];
        }

        // If the 0 column is date or number and descending, reverse all
        // columns.
        if (isXColumn && descending && this.options.sort) {
            for (col = 0; col < (columns as any).length; col++) {
                (columns as any)[col].reverse();
                if (firstRowAsNames) {
                    (columns as any)[col].unshift((columns as any)[col].pop());
                }
            }
        }
    }

    /**
     * A collection of available date formats, extendable from the outside to
     * support custom date formats.
     *
     * @name Highcharts.Data#dateFormats
     * @type {Highcharts.Dictionary<Highcharts.DataDateFormatObject>}
     */
    public dateFormats: Highcharts.Dictionary<Highcharts.DataDateFormatObject> = {
        'YYYY/mm/dd': {
            regex: /^([0-9]{4})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{1,2})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[1], (match[2] as any) - 1, +match[3]) :
                        NaN
                );
            }
        },
        'dd/mm/YYYY': {
            regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[3], (match[2] as any) - 1, +match[1]) :
                        NaN
                );
            },
            alternative: 'mm/dd/YYYY' // different format with the same regex
        },
        'mm/dd/YYYY': {
            regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{4})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[3], (match[1] as any) - 1, +match[2]) :
                        NaN
                );
            }
        },
        'dd/mm/YY': {
            regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                if (!match) {
                    return NaN;
                }
                var year = +match[3],
                    d = new Date();

                if (year > (d.getFullYear() - 2000)) {
                    year += 1900;
                } else {
                    year += 2000;
                }

                return Date.UTC(year, (match[2] as any) - 1, +match[1]);
            },
            alternative: 'mm/dd/YY' // different format with the same regex
        },
        'mm/dd/YY': {
            regex: /^([0-9]{1,2})[\-\/\.]([0-9]{1,2})[\-\/\.]([0-9]{2})$/,
            parser: function (match: (RegExpMatchArray|null)): number {
                return (
                    match ?
                        Date.UTC(+match[3] + 2000, (match[1] as any) - 1, +match[2]) :
                        NaN
                );
            }
        }
    };

    /**
     * Parse a date and return it as a number. Overridable through
     * `options.parseDate`.
     *
     * @function Highcharts.Data#parseDate
     *
     * @param {string} val
     *
     * @return {number}
     */
    public parseDate(val: string): number {
        var parseDate = this.options.parseDate,
            ret,
            key,
            format,
            dateFormat = this.options.dateFormat || this.dateFormat,
            match;

        if (parseDate) {
            ret = parseDate(val);

        } else if (typeof val === 'string') {
            // Auto-detect the date format the first time
            if (!dateFormat) {
                for (key in this.dateFormats) { // eslint-disable-line guard-for-in
                    format = this.dateFormats[key];
                    match = val.match(format.regex);
                    if (match) {
                        this.dateFormat = dateFormat = key;
                        this.alternativeFormat = format.alternative;
                        ret = format.parser(match);
                        break;
                    }
                }
            // Next time, use the one previously found
            } else {
                format = this.dateFormats[dateFormat];


                if (!format) {
                    // The selected format is invalid
                    format = this.dateFormats['YYYY/mm/dd'];
                }

                match = val.match(format.regex);
                if (match) {
                    ret = format.parser(match);
                }

            }
            // Fall back to Date.parse
            if (!match) {
                match = Date.parse(val);
                // External tools like Date.js and MooTools extend Date object
                // and returns a date.
                if (
                    typeof match === 'object' &&
                    match !== null &&
                    (match as any).getTime
                ) {
                    ret = (
                        (match as any).getTime() -
                        (match as any).getTimezoneOffset() *
                        60000
                    );

                // Timestamp
                } else if (isNumber(match)) {
                    ret = match - (new Date(match)).getTimezoneOffset() * 60000;
                }
            }
        }
        return ret as any;
    }

    /**
     * Reorganize rows into columns.
     *
     * @function Highcharts.Data#rowsToColumns
     *
     * @param {Array<Array<Highcharts.DataValueType>>} rows
     *
     * @return {Array<Array<Highcharts.DataValueType>>|undefined}
     */
    public rowsToColumns(rows: (Array<Array<Highcharts.DataValueType>>|undefined)
    ): (Array<Array<Highcharts.DataValueType>>|undefined) {
        var row,
            rowsLength,
            col,
            colsLength,
            columns: (Array<Array<Highcharts.DataValueType>>|undefined);

        if (rows) {
            columns = [];
            rowsLength = rows.length;
            for (row = 0; row < rowsLength; row++) {
                colsLength = rows[row].length;
                for (col = 0; col < colsLength; col++) {
                    if (!columns[col]) {
                        columns[col] = [];
                    }
                    columns[col][row] = rows[row][col];
                }
            }
        }
        return columns;
    }

    /**
     * Get the parsed data in a form that we can apply directly to the
     * `series.data` config. Array positions can be mapped using the
     * `series.keys` option.
     *
     * @example
     * const data = Highcharts.data({
     *   csv: document.getElementById('data').innerHTML
     * }).getData();
     *
     * @function Highcharts.Data#getData
     *
     * @return {Array<Array<(number|string)>>|undefined} Data rows
     */
    public getData(): (Array<Array<(number|string)>>|undefined) {
        if (this.columns) {
            return (this.rowsToColumns(this.columns) as any).slice(1);
        }
    }

    /**
     * A hook for working directly on the parsed columns
     *
     * @function Highcharts.Data#parsed
     *
     * @return {boolean|undefined}
     */
    public parsed(): (boolean|undefined) {
        if (this.options.parsed) {
            return this.options.parsed.call(this, this.columns as any);
        }
    }

    /**
     * @private
     * @function Highcharts.Data#getFreeIndexes
     */
    public getFreeIndexes(
        numberOfColumns: number,
        seriesBuilders: Array<Highcharts.SeriesBuilder>
    ): Array<number> {
        var s,
            i,
            freeIndexes: Array<boolean> = [],
            freeIndexValues: Array<number> = [],
            referencedIndexes;

        // Add all columns as free
        for (i = 0; i < numberOfColumns; i = i + 1) {
            freeIndexes.push(true);
        }

        // Loop all defined builders and remove their referenced columns
        for (s = 0; s < seriesBuilders.length; s = s + 1) {
            referencedIndexes = seriesBuilders[s].getReferencedColumnIndexes();

            for (i = 0; i < referencedIndexes.length; i = i + 1) {
                freeIndexes[referencedIndexes[i]] = false;
            }
        }

        // Collect the values for the free indexes
        for (i = 0; i < freeIndexes.length; i = i + 1) {
            if (freeIndexes[i]) {
                freeIndexValues.push(i);
            }
        }

        return freeIndexValues;
    }

    /**
     * If a complete callback function is provided in the options, interpret the
     * columns into a Highcharts options object.
     *
     * @function Highcharts.Data#complete
     */
    public complete(): void {

        var columns = this.columns,
            xColumns = [],
            type,
            options = this.options,
            series: Array<Highcharts.SeriesOptions>,
            data,
            i: number,
            j: number,
            r: number,
            seriesIndex,
            chartOptions: Highcharts.Options,
            allSeriesBuilders = [],
            builder,
            freeIndexes,
            typeCol,
            index: number;

        xColumns.length = (columns as any).length;
        if (options.complete || options.afterComplete) {

            // Get the names and shift the top row
            if (this.firstRowAsNames) {
                for (i = 0; i < (columns as any).length; i++) {
                    (columns as any)[i].name = (columns as any)[i].shift();
                }
            }

            // Use the next columns for series
            series = [];
            freeIndexes = this.getFreeIndexes(
                (columns as any).length,
                (this.valueCount as any).seriesBuilders
            );

            // Populate defined series
            for (
                seriesIndex = 0;
                seriesIndex < (this.valueCount as any).seriesBuilders.length;
                seriesIndex++
            ) {
                builder = (this.valueCount as any).seriesBuilders[seriesIndex];

                // If the builder can be populated with remaining columns, then
                // add it to allBuilders
                if (builder.populateColumns(freeIndexes)) {
                    allSeriesBuilders.push(builder);
                }
            }

            // Populate dynamic series
            while (freeIndexes.length > 0) {
                builder = new SeriesBuilder();
                builder.addColumnReader(0, 'x');

                // Mark index as used (not free)
                index = freeIndexes.indexOf(0);
                if (index !== -1) {
                    freeIndexes.splice(index, 1);
                }

                for (i = 0; i < (this.valueCount as any).global; i++) {
                    // Create and add a column reader for the next free column
                    // index
                    builder.addColumnReader(
                        void 0,
                        (this.valueCount as any).globalPointArrayMap[i]
                    );
                }

                // If the builder can be populated with remaining columns, then
                // add it to allBuilders
                if (builder.populateColumns(freeIndexes)) {
                    allSeriesBuilders.push(builder);
                }
            }

            // Get the data-type from the first series x column
            if (
                allSeriesBuilders.length > 0 &&
                allSeriesBuilders[0].readers.length > 0
            ) {
                typeCol = (columns as any)[
                    allSeriesBuilders[0].readers[0].columnIndex
                ];
                if (typeof typeCol !== 'undefined') {
                    if (typeCol.isDatetime) {
                        type = 'datetime';
                    } else if (!typeCol.isNumeric) {
                        type = 'category';
                    }
                }
            }
            // Axis type is category, then the "x" column should be called
            // "name"
            if (type === 'category') {
                for (
                    seriesIndex = 0;
                    seriesIndex < allSeriesBuilders.length;
                    seriesIndex++
                ) {
                    builder = allSeriesBuilders[seriesIndex];
                    for (r = 0; r < builder.readers.length; r++) {
                        if (builder.readers[r].configName === 'x') {
                            builder.readers[r].configName = 'name';
                        }
                    }
                }
            }

            // Read data for all builders
            for (
                seriesIndex = 0;
                seriesIndex < allSeriesBuilders.length;
                seriesIndex++
            ) {
                builder = allSeriesBuilders[seriesIndex];

                // Iterate down the cells of each column and add data to the
                // series
                data = [];
                for (j = 0; j < (columns as any)[0].length; j++) {
                    data[j] = builder.read(columns as any, j);
                }

                // Add the series
                series[seriesIndex] = {
                    data: data
                };
                if (builder.name) {
                    series[seriesIndex].name = builder.name;
                }
                if (type === 'category') {
                    series[seriesIndex].turboThreshold = 0;
                }
            }


            // Do the callback
            chartOptions = {
                series: series
            };
            if (type) {
                chartOptions.xAxis = {
                    type: type
                } as any;
                if (type === 'category') {
                    (chartOptions.xAxis as any).uniqueNames = false;
                }
            }

            if (options.complete) {
                options.complete(chartOptions);
            }

            // The afterComplete hook is used internally to avoid conflict with
            // the externally available complete option.
            if (options.afterComplete) {
                options.afterComplete(chartOptions as any);
            }
        }

    }

    /**
     * Updates the chart with new data options.
     *
     * @function Highcharts.Data#update
     *
     * @param {Highcharts.DataOptions} options
     *
     * @param {boolean} [redraw=true]
     */
    public update(
        options: Highcharts.DataOptions,
        redraw?: boolean
    ): void {
        var chart = this.chart;

        if (options) {
            // Set the complete handler
            options.afterComplete = function (
                dataOptions?: Highcharts.Options
            ): void {
                // Avoid setting axis options unless the type changes. Running
                // Axis.update will cause the whole structure to be destroyed
                // and rebuilt, and animation is lost.
                if (dataOptions) {
                    if (
                        dataOptions.xAxis &&
                        chart.xAxis[0] &&
                        (dataOptions.xAxis as any).type ===
                        chart.xAxis[0].options.type
                    ) {
                        delete dataOptions.xAxis;
                    }

                    // @todo looks not right:
                    chart.update(dataOptions as any, redraw, true);
                }
            };
            // Apply it
            merge(true, chart.options.data, options);
            this.init(chart.options.data as any);
        }
    }
}

// Register the Data prototype and data function on Highcharts
// Highcharts.Data = Data as any;

/**
 * Creates a data object to parse data for a chart.
 *
 * @function Highcharts.data
 *
 * @param {Highcharts.DataOptions} dataOptions
 *
 * @param {Highcharts.Options} [chartOptions]
 *
 * @param {Highcharts.Chart} [chart]
 *
 * @return {Highcharts.Data}
 */
H.data = function (
    dataOptions: Highcharts.DataOptions,
    chartOptions?: Highcharts.Options,
    chart?: Chart
): Highcharts.Data {
    return new H.Data(dataOptions, chartOptions, chart);
};

// Extend Chart.init so that the Chart constructor accepts a new configuration
// option group, data.
addEvent(
    Chart,
    'init',
    function (
        e: Event & {
            args: [
                (Highcharts.Options|undefined),
                (Chart.CallbackFunction|undefined)
            ];
        }
    ): void {
        var chart = this, // eslint-disable-line no-invalid-this
            userOptions = (e.args[0] || {}),
            callback = e.args[1];

        if (userOptions && userOptions.data && !chart.hasDataDef) {
            chart.hasDataDef = true;
            /**
             * The data parser for this chart.
             *
             * @name Highcharts.Chart#data
             * @type {Highcharts.Data|undefined}
             */
            chart.data = new H.Data(extend(userOptions.data, {

                afterComplete: function (
                    dataOptions: Highcharts.Options
                ): void {
                    var i, series;

                    // Merge series configs
                    if (
                        Object.hasOwnProperty.call(
                            userOptions,
                            'series'
                        )
                    ) {
                        if (typeof userOptions.series === 'object') {
                            i = Math.max(
                                userOptions.series.length,
                                dataOptions && dataOptions.series ?
                                    dataOptions.series.length :
                                    0
                            );
                            while (i--) {
                                series = userOptions.series[i] || {};
                                userOptions.series[i] = merge(
                                    series,
                                    dataOptions && dataOptions.series ?
                                        dataOptions.series[i] :
                                        {}
                                );
                            }
                        } else { // Allow merging in dataOptions.series (#2856)
                            delete userOptions.series;
                        }
                    }

                    // Do the merge
                    userOptions = merge(dataOptions, userOptions);

                    // Run chart.init again
                    chart.init(userOptions, callback);
                }
            }), userOptions, chart);

            e.preventDefault();
        }
    }
);

/**
 * Creates a new SeriesBuilder. A SeriesBuilder consists of a number
 * of ColumnReaders that reads columns and give them a name.
 * Ex: A series builder can be constructed to read column 3 as 'x' and
 * column 7 and 8 as 'y1' and 'y2'.
 * The output would then be points/rows of the form {x: 11, y1: 22, y2: 33}
 *
 * The name of the builder is taken from the second column. In the above
 * example it would be the column with index 7.
 *
 * @private
 * @class
 * @name SeriesBuilder
 */
class SeriesBuilder {
    /* eslint-disable no-invalid-this */
    public readers: Array<Highcharts.SeriesBuilderReaderObject> = [];
    public pointIsArray: boolean = true;
    /* eslint-enable no-invalid-this */

    public name?: string = void 0 as any;

    /**
     * Populates readers with column indexes. A reader can be added without
     * a specific index and for those readers the index is taken sequentially
     * from the free columns (this is handled by the ColumnCursor instance).
     *
     * @function SeriesBuilder#populateColumns
     *
     * @param {Array<number>} freeIndexes
     *
     * @returns {boolean}
     */
    public populateColumns(freeIndexes: Array<number>): boolean {
        var builder = this,
            enoughColumns = true;

        // Loop each reader and give it an index if its missing.
        // The freeIndexes.shift() will return undefined if there
        // are no more columns.
        builder.readers.forEach(function (
            reader: Highcharts.SeriesBuilderReaderObject
        ): void {
            if (typeof reader.columnIndex === 'undefined') {
                reader.columnIndex = freeIndexes.shift();
            }
        });

        // Now, all readers should have columns mapped. If not
        // then return false to signal that this series should
        // not be added.
        builder.readers.forEach(function (
            reader: Highcharts.SeriesBuilderReaderObject
        ): void {
            if (typeof reader.columnIndex === 'undefined') {
                enoughColumns = false;
            }
        });

        return enoughColumns;
    }

    /**
     * Reads a row from the dataset and returns a point or array depending
     * on the names of the readers.
     *
     * @function SeriesBuilder#read<T>
     *
     * @param {Array<Array<T>>} columns
     *
     * @param {number} rowIndex
     *
     * @returns {Array<T>|Highcharts.Dictionary<T>}
     */
    public read <T>(
        columns: Array<Array<T>>,
        rowIndex: number
    ): (Array<T>|Highcharts.Dictionary<T>) {
        var builder = this,
            pointIsArray = builder.pointIsArray,
            point =
                pointIsArray ? [] as Array<T> : {} as Highcharts.Dictionary<T>,
            columnIndexes;

        // Loop each reader and ask it to read its value.
        // Then, build an array or point based on the readers names.
        builder.readers.forEach(function (
            reader: Highcharts.SeriesBuilderReaderObject
        ): void {
            var value = columns[reader.columnIndex as any][rowIndex];

            if (pointIsArray) {
                (point as any).push(value);
            } else {
                if (reader.configName.indexOf('.') > 0) {
                    // Handle nested property names
                    Point.prototype.setNestedProperty(
                        point, value, reader.configName
                    );
                } else {
                    (point as any)[reader.configName] = value;
                }
            }
        });

        // The name comes from the first column (excluding the x column)
        if (typeof this.name === 'undefined' && builder.readers.length >= 2) {
            columnIndexes = builder.getReferencedColumnIndexes();
            if (columnIndexes.length >= 2) {
                // remove the first one (x col)
                columnIndexes.shift();

                // Sort the remaining
                columnIndexes.sort(function (a: number, b: number): number {
                    return a - b;
                });

                // Now use the lowest index as name column
                this.name = (columns[columnIndexes.shift() as any] as any).name;
            }
        }

        return point;
    }

    /**
     * Creates and adds ColumnReader from the given columnIndex and configName.
     * ColumnIndex can be undefined and in that case the reader will be given
     * an index when columns are populated.
     *
     * @function SeriesBuilder#addColumnReader
     *
     * @param {number} columnIndex
     *
     * @param {string} configName
     */
    public addColumnReader(
        columnIndex: (number|undefined),
        configName: string
    ): void {
        this.readers.push({
            columnIndex: columnIndex,
            configName: configName
        });

        if (!(
            configName === 'x' ||
            configName === 'y' ||
            typeof configName === 'undefined'
        )) {
            this.pointIsArray = false;
        }
    }

    /**
     * Returns an array of column indexes that the builder will use when
     * reading data.
     *
     * @function SeriesBuilder#getReferencedColumnIndexes
     *
     * @returns {Array<number>}
     */
    public getReferencedColumnIndexes(): Array<number> {
        var i,
            referencedColumnIndexes = [],
            columnReader;

        for (i = 0; i < this.readers.length; i = i + 1) {
            columnReader = this.readers[i];
            if (typeof columnReader.columnIndex !== 'undefined') {
                referencedColumnIndexes.push(columnReader.columnIndex);
            }
        }

        return referencedColumnIndexes;
    }

    /**
     * Returns true if the builder has a reader for the given configName.
     *
     * @function SeriesBuider#hasReader
     *
     * @param {string} configName
     *
     * @returns {boolean|undefined}
     */
    public hasReader(configName: string): (boolean|undefined) {
        var i, columnReader;

        for (i = 0; i < this.readers.length; i = i + 1) {
            columnReader = this.readers[i];
            if (columnReader.configName === configName) {
                return true;
            }
        }
        // Else return undefined
    }
}

H.Data = Data as any;
export default H.Data;
