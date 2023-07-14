/* *
 *
 *  Experimental data export module for Highcharts
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

// @todo
// - Set up systematic tests for all series types, paired with tests of the data
//   module importing the same data.

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Axis from '../../Core/Axis/Axis';
import type Chart from '../../Core/Chart/Chart';
import type {
    ExportDataLangOptions,
    ExportingCsvOptions
} from './ExportDataOptions';
import type Exporting from '../Exporting/Exporting';
import type HTMLAttributes from '../../Core/Renderer/HTML/HTMLAttributes';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType.js';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type Series from '../../Core/Series/Series.js';
import type SeriesOptions from '../../Core/Series/SeriesOptions';

import AST from '../../Core/Renderer/HTML/AST.js';
import ExportDataDefaults from './ExportDataDefaults.js';
import H from '../../Core/Globals.js';
const {
    doc,
    win
} = H;
import D from '../../Core/Defaults.js';
const {
    getOptions,
    setOptions
} = D;
import DownloadURL from '../DownloadURL.js';
const { downloadURL } = DownloadURL;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: SeriesClass,
    seriesTypes: {
        arearange: AreaRangeSeries,
        gantt: GanttSeries,
        map: MapSeries,
        mapbubble: MapBubbleSeries,
        treemap: TreemapSeries
    }
} = SeriesRegistry;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    defined,
    extend,
    find,
    fireEvent,
    isNumber,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        ascendingOrderInTable?: boolean
        dataTableDiv?: HTMLDivElement;
        isDataTableVisible?: boolean;
        /** @requires modules/export-data */
        downloadCSV(): void;
        /** @requires modules/export-data */
        downloadXLS(): void;
        /** @requires modules/export-data */
        getCSV(useLocalDecimalPoint?: boolean): string;
        /** @requires modules/export-data */
        getDataRows(
            multiLevelHeaders?: boolean
        ): Array<Array<(number|string)>>;
        /** @requires modules/export-data */
        getTable(useLocalDecimalPoint?: boolean): string;
        /** @requires modules/export-data */
        getTableAST(useLocalDecimalPoint?: boolean): AST.Node;
        /** @requires modules/export-data */
        hideData(): void;
        /** @requires modules/export-data */
        toggleDataTable(show?: boolean): void;
        /** @requires modules/export-data */
        viewData(): void;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        exportKey?: string;
        keyToAxis?: Record<string, string>;
    }
}

type ExportingCategoryMap = Record<string, Array<(number|string|null)>>;

type ExportingDateTimeMap = Record<string, Array<string>>;

interface ExportingCategoryDateTimeMap {
    categoryMap: ExportingCategoryMap;
    dateTimeValueAxisMap: ExportingDateTimeMap;
}

interface ExportDataPoint {
    series: ExportDataSeries;
    x?: number;
}

interface ExportDataSeries {
    autoIncrement: Series['autoIncrement'];
    chart: Chart;
    options: SeriesOptions;
    pointArrayMap?: Array<string>;
    index: Number;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * Generates a data URL of CSV for local download in the browser. This is the
 * default action for a click on the 'Download CSV' button.
 *
 * See {@link Highcharts.Chart#getCSV} to get the CSV data itself.
 *
 * @function Highcharts.Chart#downloadCSV
 *
 * @requires modules/exporting
 */
function chartDownloadCSV(
    this: Exporting.ChartComposition
): void {
    const csv = this.getCSV(true);

    downloadURL(
        getBlobFromContent(csv, 'text/csv') ||
            'data:text/csv,\uFEFF' + encodeURIComponent(csv),
        this.getFilename() + '.csv'
    );
}

/**
 * Generates a data URL of an XLS document for local download in the browser.
 * This is the default action for a click on the 'Download XLS' button.
 *
 * See {@link Highcharts.Chart#getTable} to get the table data itself.
 *
 * @function Highcharts.Chart#downloadXLS
 *
 * @requires modules/exporting
 */
function chartDownloadXLS(
    this: Exporting.ChartComposition
): void {
    const uri = 'data:application/vnd.ms-excel;base64,',
        template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
            'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
            'xmlns="http://www.w3.org/TR/REC-html40">' +
            '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook>' +
            '<x:ExcelWorksheets><x:ExcelWorksheet>' +
            '<x:Name>Ark1</x:Name>' +
            '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>' +
            '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>' +
            '</xml><![endif]-->' +
            '<style>td{border:none;font-family: Calibri, sans-serif;} ' +
            '.number{mso-number-format:"0.00";} ' +
            '.text{ mso-number-format:"\@";}</style>' +
            '<meta name=ProgId content=Excel.Sheet>' +
            '<meta charset=UTF-8>' +
            '</head><body>' +
            this.getTable(true) +
            '</body></html>',
        base64 = function (s: string): string {
            return win.btoa(unescape(encodeURIComponent(s))); // #50
        };

    downloadURL(
        getBlobFromContent(template, 'application/vnd.ms-excel') ||
            uri + base64(template),
        this.getFilename() + '.xls'
    );
}

/**
 * Export-data module required. Returns the current chart data as a CSV string.
 *
 * @function Highcharts.Chart#getCSV
 *
 * @param {boolean} [useLocalDecimalPoint]
 *        Whether to use the local decimal point as detected from the browser.
 *        This makes it easier to export data to Excel in the same locale as the
 *        user is.
 *
 * @return {string}
 *         CSV representation of the data
 */
function chartGetCSV(
    this: Chart,
    useLocalDecimalPoint?: boolean
): string {
    let csv = '';
    const rows = this.getDataRows(),
        csvOptions: ExportingCsvOptions = (this.options.exporting as any).csv,
        decimalPoint = pick(
            csvOptions.decimalPoint,
            csvOptions.itemDelimiter !== ',' && useLocalDecimalPoint ?
                (1.1).toLocaleString()[1] :
                '.'
        ),
        // use ';' for direct to Excel
        itemDelimiter = pick(
            csvOptions.itemDelimiter,
            decimalPoint === ',' ? ';' : ','
        ),
        // '\n' isn't working with the js csv data extraction
        lineDelimiter = csvOptions.lineDelimiter;

    // Transform the rows to CSV
    rows.forEach((row: Array<(number|string|undefined)>, i: number): void => {
        let val: (number|string|undefined) = '',
            j = row.length;

        while (j--) {
            val = row[j];
            if (typeof val === 'string') {
                val = '"' + val + '"';
            }
            if (typeof val === 'number') {
                if (decimalPoint !== '.') {
                    val = val.toString().replace('.', decimalPoint);
                }
            }
            row[j] = val;
        }

        // The first row is the header - it defines the number of columns.
        // Empty columns between not-empty cells are covered in the getDataRows
        // method.
        // Now add empty values only to the end of the row so all rows have
        // the same number of columns, #17186
        row.length = rows.length ? rows[0].length : 0;

        // Add the values
        csv += row.join(itemDelimiter);

        // Add the line delimiter
        if (i < rows.length - 1) {
            csv += lineDelimiter;
        }
    });
    return csv;
}

/**
 * Export-data module required. Returns a two-dimensional array containing the
 * current chart data.
 *
 * @function Highcharts.Chart#getDataRows
 *
 * @param {boolean} [multiLevelHeaders]
 *        Use multilevel headers for the rows by default. Adds an extra row with
 *        top level headers. If a custom columnHeaderFormatter is defined, this
 *        can override the behavior.
 *
 * @return {Array<Array<(number|string)>>}
 *         The current chart data
 *
 * @emits Highcharts.Chart#event:exportData
 */
function chartGetDataRows(
    this: Chart,
    multiLevelHeaders?: boolean
): Array<Array<(number|string)>> {
    const hasParallelCoords = this.hasParallelCoordinates,
        time = this.time,
        csvOptions = (
            (this.options.exporting && this.options.exporting.csv) || {}
        ),
        xAxes = this.xAxis,
        rows: Record<string, (Array<any>&AnyRecord)> =
            {},
        rowArr = [],
        topLevelColumnTitles: Array<string> = [],
        columnTitles: Array<string> = [],
        langOptions = this.options.lang,
        exportDataOptions: ExportDataLangOptions = (
            langOptions.exportData as any
        ),
        categoryHeader = exportDataOptions.categoryHeader as any,
        categoryDatetimeHeader = exportDataOptions.categoryDatetimeHeader,
        // Options
        columnHeaderFormatter = function (
            item: (Axis|Series),
            key?: string,
            keyLength?: number
        ): (string|Record<string, string>) {
            if (csvOptions.columnHeaderFormatter) {
                const s = csvOptions.columnHeaderFormatter(
                    item,
                    key,
                    keyLength
                );

                if (s !== false) {
                    return s;
                }
            }

            if (!item) {
                return categoryHeader;
            }

            if (!(item instanceof SeriesClass)) {
                return (item.options.title && item.options.title.text) ||
                    (item.dateTime ? categoryDatetimeHeader : categoryHeader);
            }

            if (multiLevelHeaders) {
                return {
                    columnTitle: (keyLength as any) > 1 ?
                        (key as any) :
                        item.name,
                    topLevelColumnTitle: item.name
                };
            }

            return item.name + ((keyLength as any) > 1 ? ' (' + key + ')' : '');
        },
        // Map the categories for value axes
        getCategoryAndDateTimeMap = function (
            series: Series,
            pointArrayMap: Array<string>,
            pIdx?: number
        ): ExportingCategoryDateTimeMap {
            const categoryMap: ExportingCategoryMap = {},
                dateTimeValueAxisMap: ExportingDateTimeMap = {};

            pointArrayMap.forEach(function (prop: string): void {
                const axisName = (
                        (series.keyToAxis && series.keyToAxis[prop]) ||
                        prop
                    ) + 'Axis',
                    // Points in parallel coordinates refers to all yAxis
                    // not only `series.yAxis`
                    axis = isNumber(pIdx) ?
                        (series as any).chart[axisName][pIdx] :
                        (series as any)[axisName];

                categoryMap[prop] = (
                    axis && axis.categories
                ) || [];
                dateTimeValueAxisMap[prop] = (
                    axis && axis.dateTime
                );
            });

            return {
                categoryMap: categoryMap,
                dateTimeValueAxisMap: dateTimeValueAxisMap
            };
        },
        // Create point array depends if xAxis is category
        // or point.name is defined #13293
        getPointArray = function (
            series: Series,
            xAxis: Axis
        ): string[] {
            const namedPoints = series.data.filter((d): string | false =>
                (typeof d.y !== 'undefined') && d.name);

            if (
                namedPoints.length &&
                xAxis &&
                !xAxis.categories &&
                !series.keyToAxis
            ) {
                if (series.pointArrayMap) {
                    const pointArrayMapCheck = series.pointArrayMap
                        .filter((p): boolean => p === 'x');
                    if (pointArrayMapCheck.length) {
                        series.pointArrayMap.unshift('x');
                        return series.pointArrayMap;
                    }
                }
                return ['x', 'y'];
            }
            return series.pointArrayMap || ['y'];
        },
        xAxisIndices: Array<Array<number>> = [];

    let xAxis: Axis,
        dataRows,
        columnTitleObj: (string|Record<string, string>),
        i = 0, // Loop the series and index values
        x,
        xTitle: string;

    this.series.forEach(function (series: Series): void {
        const keys = series.options.keys,
            xAxis = series.xAxis,
            pointArrayMap = keys || getPointArray(series, xAxis),
            valueCount = pointArrayMap.length,
            xTaken: (false|Record<string, unknown>) =
                !series.requireSorting && {},
            xAxisIndex = xAxes.indexOf(xAxis);

        let categoryAndDatetimeMap = getCategoryAndDateTimeMap(
                series,
                pointArrayMap
            ),
            mockSeries: ExportDataSeries,
            j: number;

        if (
            series.options.includeInDataExport !== false &&
            !series.options.isInternal &&
            series.visible !== false // #55
        ) {

            // Build a lookup for X axis index and the position of the first
            // series that belongs to that X axis. Includes -1 for non-axis
            // series types like pies.
            if (
                !find(
                    xAxisIndices,
                    function (index: Array<number>): boolean {
                        return index[0] === xAxisIndex;
                    }
                )
            ) {
                xAxisIndices.push([xAxisIndex, i]);
            }

            // Compute the column headers and top level headers, usually the
            // same as series names
            j = 0;
            while (j < valueCount) {
                columnTitleObj = columnHeaderFormatter(
                    series,
                    pointArrayMap[j],
                    pointArrayMap.length
                );
                columnTitles.push(
                    (columnTitleObj as any).columnTitle || columnTitleObj
                );
                if (multiLevelHeaders) {
                    topLevelColumnTitles.push(
                        (columnTitleObj as any).topLevelColumnTitle ||
                        columnTitleObj
                    );
                }
                j++;
            }

            mockSeries = {
                chart: series.chart,
                autoIncrement: series.autoIncrement,
                options: series.options,
                pointArrayMap: series.pointArrayMap,
                index: series.index
            };

            // Export directly from options.data because we need the uncropped
            // data (#7913), and we need to support Boost (#7026).
            (series.options.data as any).forEach(function eachData(
                options: (PointOptions|PointShortOptions),
                pIdx: number
            ): void {
                const mockPoint: ExportDataPoint = { series: mockSeries };

                let key: (number|string),
                    prop: string,
                    val: number;

                // In parallel coordinates chart, each data point is connected
                // to a separate yAxis, conform this
                if (hasParallelCoords) {
                    categoryAndDatetimeMap = getCategoryAndDateTimeMap(
                        series,
                        pointArrayMap,
                        pIdx
                    );
                }

                series.pointClass.prototype.applyOptions.apply(
                    mockPoint,
                    [options]
                );
                key = mockPoint.x as any;

                if (defined(rows[key]) &&
                    rows[key].seriesIndices.includes(mockSeries.index)
                ) {
                    // find keys, which belong to actual series
                    const keysFromActualSeries =
                        Object.keys(rows).filter((i: string): void =>
                            rows[i].seriesIndices.includes(mockSeries.index) &&
                                key
                        ),
                        // find all properties, which start with actual key
                        existingKeys = keysFromActualSeries
                            .filter((propertyName: string): boolean =>
                                propertyName.indexOf(String(key)) === 0
                            );

                    key = key.toString() + ',' + existingKeys.length;
                }

                const name = series.data[pIdx] && series.data[pIdx].name;

                j = 0;

                // Pies, funnels, geo maps etc. use point name in X row
                if (
                    !xAxis ||
                    series.exportKey === 'name' ||
                    (!hasParallelCoords && xAxis && xAxis.hasNames) && name
                ) {
                    key = name as any;
                }

                if (xTaken) {
                    if (xTaken[key]) {
                        key += '|' + pIdx;
                    }
                    xTaken[key] = true;
                }

                if (!rows[key]) {
                    // Generate the row
                    rows[key] = [];
                    // Contain the X values from one or more X axes
                    rows[key].xValues = [];
                }
                rows[key].x = mockPoint.x;
                rows[key].name = name;
                rows[key].xValues[xAxisIndex] = mockPoint.x;

                if (!defined(rows[key].seriesIndices)) {
                    rows[key].seriesIndices = [];
                }
                rows[key].seriesIndices = [
                    ...rows[key].seriesIndices, mockSeries.index
                ];

                while (j < valueCount) {
                    prop = pointArrayMap[j]; // y, z etc
                    val = (mockPoint as any)[prop];
                    rows[key as any][i + j] = pick(
                        // Y axis category if present
                        categoryAndDatetimeMap.categoryMap[prop][val],
                        // datetime yAxis
                        categoryAndDatetimeMap.dateTimeValueAxisMap[prop] ?
                            time.dateFormat(csvOptions.dateFormat as any, val) :
                            null,
                        // linear/log yAxis
                        val
                    );
                    j++;
                }

            });
            i = i + j;
        }
    });

    // Make a sortable array
    for (x in rows) {
        if (Object.hasOwnProperty.call(rows, x)) {
            rowArr.push(rows[x]);
        }
    }

    let xAxisIndex: number, column: number;

    // Add computed column headers and top level headers to final row set
    dataRows = multiLevelHeaders ? [topLevelColumnTitles, columnTitles] :
        [columnTitles];

    i = xAxisIndices.length;
    while (i--) { // Start from end to splice in
        xAxisIndex = xAxisIndices[i][0];
        column = xAxisIndices[i][1];
        xAxis = xAxes[xAxisIndex];

        // Sort it by X values
        rowArr.sort(function ( // eslint-disable-line no-loop-func
            a: AnyRecord,
            b: AnyRecord
        ): number {
            return a.xValues[xAxisIndex] - b.xValues[xAxisIndex];
        });

        // Add header row
        xTitle = columnHeaderFormatter(xAxis) as any;
        dataRows[0].splice(column, 0, xTitle);
        if (multiLevelHeaders && dataRows[1]) {
            // If using multi level headers, we just added top level header.
            // Also add for sub level
            dataRows[1].splice(column, 0, xTitle);
        }

        // Add the category column
        rowArr.forEach(function ( // eslint-disable-line no-loop-func
            row: AnyRecord
        ): void {
            let category = row.name;

            if (xAxis && !defined(category)) {
                if (xAxis.dateTime) {
                    if (row.x instanceof Date) {
                        row.x = row.x.getTime();
                    }
                    category = time.dateFormat(
                        csvOptions.dateFormat as any,
                        row.x
                    );
                } else if (xAxis.categories) {
                    category = pick(
                        xAxis.names[row.x],
                        (xAxis.categories as any)[row.x],
                        row.x
                    );
                } else {
                    category = row.x;
                }
            }

            // Add the X/date/category
            row.splice(column, 0, category);
        });
    }
    dataRows = dataRows.concat(rowArr);

    fireEvent(this, 'exportData', { dataRows: dataRows });

    return dataRows;
}

/**
 * Export-data module required. Build a HTML table with the chart's current
 * data.
 *
 * @sample highcharts/export-data/viewdata/
 *         View the data from the export menu
 *
 * @function Highcharts.Chart#getTable
 *
 * @param {boolean} [useLocalDecimalPoint]
 *        Whether to use the local decimal point as detected from the browser.
 *        This makes it easier to export data to Excel in the same locale as the
 *        user is.
 *
 * @return {string}
 *         HTML representation of the data.
 *
 * @emits Highcharts.Chart#event:afterGetTable
 */
function chartGetTable(
    this: Chart,
    useLocalDecimalPoint?: boolean
): string {
    const serialize = (node: AST.Node): string => {
        if (!node.tagName || node.tagName === '#text') {
            // Text node
            return node.textContent || '';
        }

        const attributes = node.attributes;
        let html = `<${node.tagName}`;

        if (attributes) {
            (Object.keys(attributes) as Array<keyof typeof attributes>)
                .forEach((key): void => {
                    const value = attributes[key];
                    html += ` ${key}="${value}"`;
                });
        }
        html += '>';

        html += node.textContent || '';

        (node.children || []).forEach((child): void => {
            html += serialize(child);
        });

        html += `</${node.tagName}>`;
        return html;
    };

    const tree = this.getTableAST(useLocalDecimalPoint);
    return serialize(tree);
}

/**
 * Get the AST of a HTML table representing the chart data.
 *
 * @private
 *
 * @function Highcharts.Chart#getTableAST
 *
 * @param {boolean} [useLocalDecimalPoint]
 *        Whether to use the local decimal point as detected from the browser.
 *        This makes it easier to export data to Excel in the same locale as the
 *        user is.
 *
 * @return {Highcharts.ASTNode}
 *         The abstract syntax tree
 */
function chartGetTableAST(
    this: Chart,
    useLocalDecimalPoint?: boolean
): AST.Node {
    let rowLength = 0;
    const treeChildren: AST.Node[] = [];
    const options = this.options,
        decimalPoint = useLocalDecimalPoint ? (1.1).toLocaleString()[1] : '.',
        useMultiLevelHeaders = pick(
            (options.exporting as any).useMultiLevelHeaders, true
        ),
        rows = this.getDataRows(useMultiLevelHeaders),
        topHeaders = useMultiLevelHeaders ? rows.shift() : null,
        subHeaders = rows.shift(),
        // Compare two rows for equality
        isRowEqual = function (
            row1: Array<(number|string)>,
            row2: Array<(number|string)>
        ): boolean {
            let i = row1.length;

            if (row2.length === i) {
                while (i--) {
                    if (row1[i] !== row2[i]) {
                        return false;
                    }
                }
            } else {
                return false;
            }
            return true;
        },
        // Get table cell HTML from value
        getCellHTMLFromValue = function (
            tagName: string,
            classes: (string|null),
            attributes: HTMLAttributes,
            value: (number|string)
        ): AST.Node {
            let textContent = pick(value, ''),
                className = 'highcharts-text' + (classes ? ' ' + classes : '');

            // Convert to string if number
            if (typeof textContent === 'number') {
                textContent = textContent.toString();
                if (decimalPoint === ',') {
                    textContent = textContent.replace('.', decimalPoint);
                }
                className = 'highcharts-number';
            } else if (!value) {
                className = 'highcharts-empty';
            }

            attributes = extend(
                { 'class': className },
                attributes
            );

            return {
                tagName,
                attributes,
                textContent
            };

        },
        // Get table header markup from row data
        getTableHeaderHTML = function (
            topheaders: (Array<(number|string)>|null|undefined),
            subheaders: Array<(number|string)>,
            rowLength?: number
        ): AST.Node {
            const theadChildren: AST.Node[] = [];

            let i = 0,
                len = rowLength || subheaders && subheaders.length,
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
                const trChildren = [];
                for (; i < len; ++i) {
                    cur = topheaders[i];
                    next = topheaders[i + 1];
                    if (cur === next) {
                        ++curColspan;
                    } else if (curColspan) {
                        // Ended colspan
                        // Add cur to HTML with colspan.
                        trChildren.push(getCellHTMLFromValue(
                            'th',
                            'highcharts-table-topheading',
                            {
                                scope: 'col',
                                colspan: curColspan + 1
                            },
                            cur
                        ));
                        curColspan = 0;
                    } else {
                        // Cur is standalone. If it is same as sublevel,
                        // remove sublevel and add just toplevel.
                        if (cur === subheaders[i]) {
                            if ((options.exporting as any).useRowspanHeaders) {
                                rowspan = 2;
                                delete subheaders[i];
                            } else {
                                rowspan = 1;
                                subheaders[i] = '';
                            }
                        } else {
                            rowspan = 1;
                        }

                        const cell = getCellHTMLFromValue(
                            'th',
                            'highcharts-table-topheading',
                            { scope: 'col' },
                            cur
                        );
                        if (rowspan > 1 && cell.attributes) {
                            cell.attributes.valign = 'top';
                            cell.attributes.rowspan = rowspan;
                        }

                        trChildren.push(cell);
                    }
                }

                theadChildren.push({
                    tagName: 'tr',
                    children: trChildren
                });
            }

            // Add the subheaders (the only headers if not using multilevels)
            if (subheaders) {
                const trChildren = [];

                for (i = 0, len = subheaders.length; i < len; ++i) {
                    if (typeof subheaders[i] !== 'undefined') {
                        trChildren.push(
                            getCellHTMLFromValue(
                                'th', null, { scope: 'col' }, subheaders[i]
                            )
                        );
                    }
                }

                theadChildren.push({
                    tagName: 'tr',
                    children: trChildren
                });
            }
            return {
                tagName: 'thead',
                children: theadChildren
            };
        };

    // Add table caption
    if ((options.exporting as any).tableCaption !== false) {
        treeChildren.push({
            tagName: 'caption',
            attributes: {
                'class': 'highcharts-table-caption'
            },
            textContent: pick(
                (options.exporting as any).tableCaption,
                (
                    (options.title as any).text ?
                        (options.title as any).text :
                        'Chart'
                )
            )
        });
    }

    // Find longest row
    for (let i = 0, len = rows.length; i < len; ++i) {
        if (rows[i].length > rowLength) {
            rowLength = rows[i].length;
        }
    }

    // Add header
    treeChildren.push(getTableHeaderHTML(
        topHeaders,
        subHeaders as any,
        Math.max(rowLength, (subHeaders as any).length)
    ));

    // Transform the rows to HTML
    const trs: AST.Node[] = [];
    rows.forEach(function (row: Array<(number|string)>): void {
        const trChildren = [];
        for (let j = 0; j < rowLength; j++) {
            // Make first column a header too. Especially important for
            // category axes, but also might make sense for datetime? Should
            // await user feedback on this.
            trChildren.push(getCellHTMLFromValue(
                j ? 'td' : 'th',
                null,
                j ? {} : { scope: 'row' },
                row[j]
            ));
        }
        trs.push({
            tagName: 'tr',
            children: trChildren
        });
    });
    treeChildren.push({
        tagName: 'tbody',
        children: trs
    });

    const e = {
        tree: {
            tagName: 'table',
            id: `highcharts-data-table-${this.index}`,
            children: treeChildren
        } as AST.Node
    };
    fireEvent(this, 'aftergetTableAST', e);

    return e.tree;
}

/**
 * Export-data module required. Hide the data table when visible.
 *
 * @function Highcharts.Chart#hideData
 */
function chartHideData(
    this: Chart
): void {
    this.toggleDataTable(false);
}

/**
 * @private
 */
function chartToggleDataTable(
    this: Chart,
    show?: boolean
): void {

    show = pick(show, !this.isDataTableVisible);

    // Create the div
    const createContainer = show && !this.dataTableDiv;
    if (createContainer) {
        this.dataTableDiv = doc.createElement('div');
        this.dataTableDiv.className = 'highcharts-data-table';
        // Insert after the chart container
        (this.renderTo.parentNode as any).insertBefore(
            this.dataTableDiv,
            this.renderTo.nextSibling
        );
    }

    // Toggle the visibility
    if (this.dataTableDiv) {
        const style = this.dataTableDiv.style,
            oldDisplay = style.display;

        style.display = show ? 'block' : 'none';

        // Generate the data table
        if (show) {
            this.dataTableDiv.innerHTML = AST.emptyHTML;
            const ast = new AST([this.getTableAST()]);
            ast.addToDOM(this.dataTableDiv);
            fireEvent(this, 'afterViewData', {
                element: this.dataTableDiv,
                wasHidden: createContainer || oldDisplay !== style.display
            });
        } else {
            fireEvent(this, 'afterHideData');
        }
    }

    // Set the flag
    this.isDataTableVisible = show;


    // Change the menu item text
    const exportDivElements = this.exportDivElements,
        options = this.options.exporting,
        menuItems = options &&
            options.buttons &&
            options.buttons.contextButton.menuItems,
        lang = this.options.lang;

    if (
        options &&
        options.menuItemDefinitions &&
        lang &&
        lang.viewData &&
        lang.hideData &&
        menuItems &&
        exportDivElements
    ) {
        const exportDivElement = exportDivElements[
            menuItems.indexOf('viewData')
        ];
        if (exportDivElement) {
            AST.setElementHTML(
                exportDivElement,
                this.isDataTableVisible ? lang.hideData : lang.viewData
            );
        }
    }
}

/**
 * Export-data module required. View the data in a table below the chart.
 *
 * @function Highcharts.Chart#viewData
 *
 * @emits Highcharts.Chart#event:afterViewData
 */
function chartViewData(
    this: Chart
): void {
    this.toggleDataTable(true);
}

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart
): void {

    if (U.pushUnique(composedMembers, ChartClass)) {
        // Add an event listener to handle the showTable option
        addEvent(ChartClass, 'afterViewData', onChartAfterViewData);
        addEvent(ChartClass, 'render', onChartRenderer);

        const chartProto = ChartClass.prototype;

        chartProto.downloadCSV = chartDownloadCSV;
        chartProto.downloadXLS = chartDownloadXLS;
        chartProto.getCSV = chartGetCSV;
        chartProto.getDataRows = chartGetDataRows;
        chartProto.getTable = chartGetTable;
        chartProto.getTableAST = chartGetTableAST;
        chartProto.hideData = chartHideData;
        chartProto.toggleDataTable = chartToggleDataTable;
        chartProto.viewData = chartViewData;
    }

    if (U.pushUnique(composedMembers, setOptions)) {
        const exportingOptions = getOptions().exporting;

        // Add "Download CSV" to the exporting menu.
        // @todo consider move to defaults
        if (exportingOptions) {

            extend(exportingOptions.menuItemDefinitions, {
                downloadCSV: {
                    textKey: 'downloadCSV',
                    onclick: function (): void {
                        this.downloadCSV();
                    }
                },
                downloadXLS: {
                    textKey: 'downloadXLS',
                    onclick: function (): void {
                        this.downloadXLS();
                    }
                },
                viewData: {
                    textKey: 'viewData',
                    onclick: function (): void {
                        this.toggleDataTable();
                    }
                }
            } as Record<string, Exporting.MenuObject>);

            if (
                exportingOptions.buttons &&
                exportingOptions.buttons.contextButton.menuItems
            ) {
                exportingOptions.buttons.contextButton.menuItems.push(
                    'separator',
                    'downloadCSV',
                    'downloadXLS',
                    'viewData'
                );
            }
        }

        setOptions(ExportDataDefaults);
    }

    if (AreaRangeSeries && U.pushUnique(composedMembers, AreaRangeSeries)) {
        AreaRangeSeries.prototype.keyToAxis = {
            low: 'y',
            high: 'y'
        };
    }

    if (GanttSeries && U.pushUnique(composedMembers, GanttSeries)) {
        GanttSeries.prototype.keyToAxis = {
            start: 'x',
            end: 'x'
        };
    }

    if (MapSeries && U.pushUnique(composedMembers, MapSeries)) {
        MapSeries.prototype.exportKey = 'name';
    }

    if (MapBubbleSeries && U.pushUnique(composedMembers, MapBubbleSeries)) {
        MapBubbleSeries.prototype.exportKey = 'name';
    }

    if (TreemapSeries && U.pushUnique(composedMembers, TreemapSeries)) {
        TreemapSeries.prototype.exportKey = 'name';
    }

}

/**
 * Get a blob object from content, if blob is supported
 *
 * @private
 * @param {string} content
 *        The content to create the blob from.
 * @param {string} type
 *        The type of the content.
 * @return {string|undefined}
 *         The blob object, or undefined if not supported.
 */
function getBlobFromContent(
    content: string,
    type: string
): (string|undefined) {
    const nav = win.navigator,
        webKit = (
            nav.userAgent.indexOf('WebKit') > -1 &&
            nav.userAgent.indexOf('Chrome') < 0
        ),
        domurl = win.URL || win.webkitURL || win;

    try {
        // MS specific
        if ((nav.msSaveOrOpenBlob) && win.MSBlobBuilder) {
            const blob = new win.MSBlobBuilder();
            blob.append(content);
            return blob.getBlob('image/svg+xml') as any;
        }

        // Safari requires data URI since it doesn't allow navigation to blob
        // URLs.
        if (!webKit) {
            return domurl.createObjectURL(new win.Blob(
                ['\uFEFF' + content], // #7084
                { type: type }
            ));
        }
    } catch (e) {
        // Ignore
    }
}

/**
 * @private
 */
function onChartAfterViewData(
    this: Chart
): void {
    const chart = this,
        dataTableDiv = chart.dataTableDiv,
        getCellValue = (tr: HTMLDOMElement, index: number): string|null =>
            tr.children[index].textContent,
        comparer = (index: number, ascending: boolean) =>
            (a: HTMLDOMElement, b: HTMLDOMElement): number => {
                const sort = (v1: any, v2: any): number => (
                    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ?
                        v1 - v2 :
                        v1.toString().localeCompare(v2)
                );

                return sort(
                    getCellValue(ascending ? a : b, index),
                    getCellValue(ascending ? b : a, index)
                );
            };


    if (
        dataTableDiv &&
        chart.options.exporting &&
        chart.options.exporting.allowTableSorting
    ) {
        const row = dataTableDiv.querySelector('thead tr');
        if (row) {
            row.childNodes.forEach((th: any): void => {
                const table = th.closest('table');

                th.addEventListener('click', function (): void {
                    const rows = [...dataTableDiv.querySelectorAll(
                            'tr:not(thead tr)'
                        ) as unknown as Array<HTMLElement>],
                        headers = [...th.parentNode.children];

                    rows.sort(
                        comparer(
                            headers.indexOf(th),
                            chart.ascendingOrderInTable =
                                !chart.ascendingOrderInTable
                        )
                    ).forEach((tr: HTMLDOMElement): void => {
                        table.appendChild(tr);
                    });

                    headers.forEach((th): void => {
                        [
                            'highcharts-sort-ascending',
                            'highcharts-sort-descending'
                        ].forEach((className): void => {
                            if (th.classList.contains(className)) {
                                th.classList.remove(className);
                            }
                        });
                    });

                    th.classList.add(
                        chart.ascendingOrderInTable ?
                            'highcharts-sort-ascending' :
                            'highcharts-sort-descending'
                    );
                });
            });
        }
    }
}

/**
 * Handle the showTable option
 * @private
 */
function onChartRenderer(
    this: Chart
): void {
    if (
        this.options &&
        this.options.exporting &&
        this.options.exporting.showTable &&
        !this.options.chart.forExport
    ) {
        this.viewData();
    }
}

/* *
 *
 *  Default Export
 *
 * */

const ExportData = {
    compose
};

export default ExportData;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Function callback to execute while data rows are processed for exporting.
 * This allows the modification of data rows before processed into the final
 * format.
 *
 * @callback Highcharts.ExportDataCallbackFunction
 * @extends Highcharts.EventCallbackFunction<Highcharts.Chart>
 *
 * @param {Highcharts.Chart} this
 * Chart context where the event occured.
 *
 * @param {Highcharts.ExportDataEventObject} event
 * Event object with data rows that can be modified.
 */

/**
 * Contains information about the export data event.
 *
 * @interface Highcharts.ExportDataEventObject
 *//**
 * Contains the data rows for the current export task and can be modified.
 * @name Highcharts.ExportDataEventObject#dataRows
 * @type {Array<Array<string>>}
 */

(''); // keeps doclets above in JS file
