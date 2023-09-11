/* *
 *
 *  (c) 2020-2022 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
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

import type DataEvent from '../../Data/DataEvent';
import type LineSeries from '../../Series/Line/LineSeries';
import type PointOptions from './PointOptions';
import type SeriesOptions from './SeriesOptions';

import DataTable from '../../Data/DataTable.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { defined } = OH;
const {
    uniqueKey
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Class to convert Highcharts series data to table and get series data from the
 * table.
 *
 * @private
 */
class DataSeriesConverter {

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the DataSeriesConverter class.
     *
     * @param {DataTable} [table]
     * DataSeriesConverter table to store series data.
     *
     * @param {DataSeriesConverter.Options} [options]
     * DataSeriesConverter options.
     */
    public constructor(
        table: DataTable = new DataTable(),
        options: DataSeriesConverter.Options = {}
    ) {
        this.table = table;
        this.options = options;
        this.seriesIdMap = {};
        this.seriesMeta = [];
    }

    /* *
     *
     *  Properties
     *
     * */

    public table: DataTable;
    public options: DataSeriesConverter.Options;

    /**
     * Registry as record object with series IDs and their
     * meta information instance.
     */
    public seriesIdMap: Record<string, DataSeriesConverter.SeriesMeta>;

    /**
     * Array of all series meta information stored in the table.
     */
    public seriesMeta: Array<DataSeriesConverter.SeriesMeta>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Get the specific series data stored in the converter.
     *
     * @param {string} seriesId
     * The id of the series.
     *
     * @return {Array<PointOptions>}
     * Returns an array of series points opitons.
     */
    public getSeriesData(seriesId: string): Array<PointOptions> {
        const converter = this,
            table = converter.table,
            seriesData = [];

        let pointOptions: Record<string, (number|null)>,
            cellName,
            cell,
            isCellFound,
            pointArrayMap;

        if (seriesId) {
            pointArrayMap = converter.seriesIdMap[
                seriesId
            ].pointArrayMap || ['y'];

            for (let i = 0, iEnd = table.getRowCount(); i < iEnd; i++) {
                isCellFound = false;
                pointOptions = {
                    x: table.getCellAsNumber('x', i, true)
                };

                for (let j = 0, jEnd = pointArrayMap.length; j < jEnd; j++) {
                    cellName = pointArrayMap[j] + '_' + seriesId;
                    cell = table.getCell(cellName, i);

                    if (typeof cell !== 'undefined') {
                        isCellFound = true;
                        pointOptions[pointArrayMap[j]] = table.getCellAsNumber(
                            cellName,
                            i
                        );
                    }
                }

                if (isCellFound) {
                    seriesData.push(pointOptions);
                }
            }
        }

        return seriesData;
    }

    /**
     * Get all series data stored in the converter.
     *
     * @return {Array<SeriesOptions>}
     * Returns an array of series opitons.
     */
    public getAllSeriesData(): Array<SeriesOptions> {
        const converter = this,
            seriesOptions: Array<SeriesOptions> = [];

        let id;

        for (let i = 0, iEnd = converter.seriesMeta.length; i < iEnd; i++) {
            id = converter.seriesMeta[i].id;

            seriesOptions.push({
                id: id,
                data: converter.getSeriesData(id)
            });
        }

        return seriesOptions;
    }

    /**
     * Update the converter with passed series options.
     *
     * @param {Array<LineSeries>} allSeries
     * Array of series options to store in the converter.
     *
     * @param {DataEvent.Detail} eventDetail
     * Custom information for pending events.
     */
    public updateTable(
        allSeries: Array<LineSeries>,
        eventDetail?: DataEvent.Detail
    ): void {
        const table = this.table;

        let columns: DataTable.RowObject,
            series,
            seriesMeta,
            pointArrayMap,
            pointArrayMapLength,
            options,
            keys,
            data,
            elem,
            rowIndex,
            y,
            needsArrayMap,
            xIndex,
            yIndex,
            yValueName,
            yValueIndex,
            yValueId,
            id;

        if (allSeries && allSeries.length) {
            this.options.seriesOptions = [];
            this.seriesMeta = [];
            this.seriesIdMap = {};

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

                seriesMeta = {
                    id: series.id,
                    pointArrayMap: pointArrayMap,
                    options: series.options
                };

                this.options.seriesOptions.push(series.options);
                this.seriesMeta.push(seriesMeta);
                this.seriesIdMap[series.id] = seriesMeta;

                for (let j = 0, jEnd = data.length; j < jEnd; j++) {
                    elem = data[j];
                    y = 'y' + yValueId;
                    columns = {};
                    needsArrayMap = pointArrayMapLength > 1;

                    if (typeof elem === 'number') {
                        columns[y] = elem;
                        columns.x = j;
                    } else if (elem instanceof Array) {
                        xIndex = keys && keys.indexOf('x') > -1 ?
                            keys.indexOf('x') : 0;
                        yIndex = keys && keys.indexOf('y') > -1 ?
                            keys.indexOf('y') : 1;

                        if (needsArrayMap) {
                            for (let k = 0; k < pointArrayMapLength; k++) {
                                yValueIndex = keys && keys.indexOf(
                                    pointArrayMap[k]
                                ) > -1 ?
                                    keys.indexOf(pointArrayMap[k]) :
                                    k + elem.length - pointArrayMapLength;

                                yValueName = pointArrayMap[k];
                                columns[yValueName + yValueId] = elem[
                                    yValueIndex
                                ];
                            }
                        } else {
                            columns[y] = elem[yIndex];
                        }

                        columns.x = elem.length - pointArrayMapLength > 0 ?
                            elem[xIndex] :
                            j;

                    } else if (elem instanceof Object) {
                        if (needsArrayMap) {
                            const elemSet = elem as Record<string, DataTable.CellType>;

                            for (let k = 0; k < pointArrayMapLength; k++) {
                                yValueName = pointArrayMap[k];
                                columns[yValueName + yValueId] = elemSet[
                                    yValueName
                                ];
                            }
                        } else {
                            columns[y] = elem.y;
                        }

                        columns.x = elem.x || j;
                    }

                    id = '' + columns.x;
                    rowIndex = table.getRowIndexBy('id', id);

                    if (!rowIndex) {
                        columns.id = id;
                        table.setRows([columns], void 0, eventDetail);
                    } else if (columns[y]) {
                        table.setCell(y, rowIndex, columns[y], eventDetail);
                    }
                }
            }
        }
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace DataSeriesConverter {

    /* *
     *
     *  Declarations
     *
     * */

    export interface Options {
        seriesOptions?: Array<SeriesOptions>;
    }

    export interface SeriesMeta {
        id: string;
        pointArrayMap: Array<string>;
        options: SeriesOptions;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataSeriesConverter;
