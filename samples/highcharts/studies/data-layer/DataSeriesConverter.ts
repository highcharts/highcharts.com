/* *
 *
 *  Data Layer
 *
 *  (c) 2012-2020 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type DataEventEmitter from './DataEventEmitter';
import DataTable from './DataTable.js';
import DataTableRow from './DataTableRow.js';
import U from './../Shared/Utilities.js';
const {
    defined,
    uniqueKey
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Class to convert DataTable to Highcharts series data.
 */
class DataSeriesConverter {

    /* *
     *
     *  Constructor
     *
     * */
    public constructor(table: DataTable = new DataTable(), options: DataSeriesConverter.Options) {
        this.table = table;
        this.options = options;
    }

    /* *
     *
     *  Properties
     *
     * */
    public table: DataTable;
    public options: DataSeriesConverter.Options;

    /* *
     *
     *  Functions
     *
     * */

    getSeriesData(columnIndex: number): Array<Highcharts.PointOptionsObject> {
        const table = this.table,
            options = this.options || {},
            dataOptions = [],
            seriesTypeData = this.getSeriesTypeData(options.type || 'line');

        let row,
            column;

        for (let i = 0, iEnd = table.getRowCount(); i < iEnd; i++) {

            row = table.getRow(i);

            if (row) {
                column = row.getCell(row.getCellNames()[columnIndex]);

                if (typeof column === 'number') {
                    dataOptions.push(
                        seriesTypeData(column)
                    );
                }
            }
        }

        return dataOptions;
    }

    getSeriesTypeData(type: string): Function {
        let fcName: Function;

        switch (type) {
        case 'line':
            fcName = this.getLinePoint;
            break;
        case 'pie':
            fcName = this.getPiePoint;
            break;
        case 'range':
            fcName = this.getRangePoint;
            break;
        default:
            fcName = this.getLinePoint;
            break;
        }

        return fcName;
    }

    getLinePoint(column: number): Highcharts.PointOptionsObject {
        return {
            y: column
        };
    }

    getPiePoint(column: number): Highcharts.PointOptionsObject {
        return {
            y: column
        };
    }

    getRangePoint(column: number): Highcharts.PointOptionsObject {
        return {
            y: column
        };
    }

    getAllSeriesData(): Array<Highcharts.SeriesOptions> {
        const table = this.table,
            seriesOptions = [],
            row = table.getRow(0);

        let seriesData;

        if (row) {
            for (let i = 0, iEnd = row.getCellCount(); i < iEnd; i++) {

                seriesData = this.getSeriesData(i);

                if (seriesData.length > 0) {
                    seriesOptions.push({
                        data: seriesData
                    });
                }
            }
        }

        return seriesOptions;
    }

    setDataTable(
        allSeries: Array<Highcharts.Series>,
        eventDetail?: DataEventEmitter.EventDetail
    ): DataTable {
        const table = this.table,
            columnMap = (this.options || {}).columnMap || {};

        let columns: Record<string, DataTableRow.CellType>,
            series,
            pointArrayMap,
            pointArrayMapLength,
            options,
            keys,
            data,
            elem,
            row,
            y,
            needsArrayMap,
            xIndex,
            yIndex,
            yValueName,
            yValueIndex,
            yValueId,
            id;

        for (let i = 0, iEnd = allSeries.length; i < iEnd; i++) {
            series = allSeries[i];
            // Add a unique ID to the series if none is assigned.
            series.id = defined(series.id) ? series.id : uniqueKey();
            yValueId = '_' + series.id;
            pointArrayMap = series.pointArrayMap || ['y'];
            pointArrayMapLength = pointArrayMap.length;
            options = series.options;
            keys = options.keys;
            data = series.options.data || [];

            for (let j = 0, jEnd = data.length; j < jEnd; j++) {
                elem = data[j];
                y = columnMap.y ? columnMap.y + yValueId : 'y' + yValueId;
                columns = {};
                needsArrayMap = pointArrayMapLength > 1;

                if (typeof elem === 'number') {
                    columns[y] = elem;
                    columns.x = j;
                } else if (elem instanceof Array) {
                    xIndex = keys && keys.indexOf('x') > -1 ? keys.indexOf('x') : 0;
                    yIndex = keys && keys.indexOf('y') > -1 ? keys.indexOf('y') : 1;

                    if (needsArrayMap) {
                        for (let k = 0; k < pointArrayMapLength; k++) {
                            yValueIndex = keys && keys.indexOf(pointArrayMap[k]) > -1 ?
                                keys.indexOf(pointArrayMap[k]) : k + elem.length - pointArrayMapLength;

                            yValueName = columnMap[pointArrayMap[k]] ?
                                columnMap[pointArrayMap[k]] : pointArrayMap[k];
                            columns[yValueName + yValueId] = elem[yValueIndex];
                        }
                    } else {
                        columns[y] = elem[yIndex];
                    }

                    columns.x = elem.length - pointArrayMapLength > 0 ? elem[xIndex] : j;

                } else if (elem instanceof Object) {
                    if (needsArrayMap) {
                        const elemSet = elem as Record<string, DataTableRow.CellType>;

                        for (let k = 0; k < pointArrayMapLength; k++) {
                            yValueName = columnMap[pointArrayMap[k]] ?
                                columnMap[pointArrayMap[k]] : pointArrayMap[k];
                            columns[yValueName + yValueId] = elemSet[yValueName];
                        }
                    } else {
                        columns[y] = elem.y;
                    }

                    columns.x = elem.x || j;
                }

                id = '' + columns.x;
                row = table.getRow(id);

                if (!row) {
                    columns.id = id;
                    row = new DataTableRow(columns);
                    table.insertRow(row, eventDetail);
                } else if (columns[y]) {
                    row.insertCell(y, columns[y], eventDetail);
                }
            }
        }

        return table;
    }
}
/* *
 *
 *  Namespace
 *
 * */
namespace DataSeriesConverter {
    export interface Options {
        type?: string;
        columnMap?: Record<string, string>;
    }
}
/* *
 *
 *  Export
 *
 * */
export default DataSeriesConverter;
