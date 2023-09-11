/* *
 *
 *  (c) 2020-2022 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type AnimationOptions from '../Animation/AnimationOptions';
import type {
    PointOptions,
    PointShortOptions
} from './PointOptions';
import type Series from './Series';

import DataTable from '../../Data/DataTable.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { isNumber } = TC;
const { merge } = OH;
const { addEvent, fireEvent } = EH;
const {
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './SeriesLike' {
    interface SeriesLike {
        datas?: DataSeriesAdditions;
    }
}

declare module './SeriesOptions' {
    interface SeriesOptions {
        dataAsColumns?: boolean;
    }
}

export declare class DataSeriesComposition extends Series {
    datas: DataSeriesAdditions;
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
 * @private
 */
function wrapSeriesGeneratePoints(
    this: DataSeriesComposition,
    proceed: DataSeriesComposition['generatePoints']
): void {
    if (this.hasGroupedData) {
        return proceed.call(this);
    }

    const PointClass = this.pointClass,
        cropStart = this.cropStart || 0,
        data = this.data || [],
        points = [],
        processedXData = this.processedXData,
        processedYData = this.processedYData;

    let cursor: number,
        point: typeof PointClass.prototype;

    for (let i = 0, iEnd = processedXData.length; i < iEnd; ++i) {
        cursor = cropStart + i;
        point = data[cursor];
        if (!point) {
            point = data[cursor] = (new PointClass()).init(
                this,
                processedYData[cursor],
                processedXData[i]
            );
        }
        point.index = cursor;
        points[i] = point;
    }

    this.data = data;
    this.points = points;

    fireEvent(this, 'afterGeneratePoints');
}

/**
 * @private
 */
function wrapSeriesSetData(
    this: DataSeriesComposition,
    proceed: DataSeriesComposition['setData'],
    data: Array<(PointOptions|PointShortOptions)> = [],
    redraw: boolean = true,
    animation?: (boolean|Partial<AnimationOptions>)
): void {
    const datas = this.datas;

    if (this.hasGroupedData || !this.options.dataAsColumns) {
        return proceed.call(this, data, redraw, animation);
    }

    data = this.options.data = this.userOptions.data = (
        this.chart.options.chart.allowMutatingData ?
            (data || []) :
            merge(true, data)
    );

    const columns: DataTable.ColumnCollection = {},
        keys = (this.options.keys || this.parallelArrays).slice();

    if (isNumber(data[0]) || keys.length === 1) {
        // first column is implicit index
        const xData: Array<number> = columns.x = [];
        for (let i = 0, iEnd = data.length; i < iEnd; ++i) {
            xData.push(this.autoIncrement());
        }
        columns[keys[1] || 'y'] = data as Array<number>;
    } else {
        if (keys.indexOf('x') === -1 && keys.length > data.length) {
            // first column is implicit index
            const xData: Array<number> = columns.x = [];
            for (let i = 0, iEnd = data.length; i < iEnd; ++i) {
                xData.push(this.autoIncrement());
            }
        }
        for (
            let i = 0,
                iEnd = Math.min(data.length, keys.length);
            i < iEnd;
            ++i
        ) {
            if (data[i] instanceof Array) {
                columns[keys[i]] = data[i] as Array<DataTable.CellType>;
            }
        }
    }

    datas.setTable(new DataTable({ columns, id: this.name }));
}

/* *
 *
 *  Class
 *
 * */

class DataSeriesAdditions {

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * @private
     */
    public static compose(
        SeriesClass: typeof Series
    ): void {

        if (pushUnique(composedMembers, SeriesClass)) {
            addEvent(SeriesClass, 'init', function (): void {
                this.datas = new DataSeriesAdditions(
                    this as DataSeriesComposition
                );
            });

            const seriesProto = SeriesClass.prototype as DataSeriesComposition;

            wrap(seriesProto, 'generatePoints', wrapSeriesGeneratePoints);
            wrap(seriesProto, 'setData', wrapSeriesSetData);
        }

    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        series: DataSeriesComposition
    ) {
        const columns: DataTable.ColumnCollection = {},
            keys = series.parallelArrays;

        for (let i = 0, iEnd = keys.length; i < iEnd; ++i) {
            columns[keys[i]] = [];
        }

        this.series = series;
        this.table = new DataTable();
    }

    /* *
     *
     *  Properties
     *
     * */

    private indexAsX?: boolean;

    public series: DataSeriesComposition;

    public table: DataTable;

    private unlisteners: Array<Function> = [];

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Triggers processing and redrawing
     * @private
     */
    public processTable(
        redraw?: boolean,
        animation?: (boolean|Partial<AnimationOptions>)
    ): void {
        const series = this.series;

        if (series.options.legendType === 'point') {
            series.processData();
            series.generatePoints();
        }

        if (redraw) {
            const chart = series.chart;

            series.isDirty = chart.isDirtyBox = true;
            series.isDirtyData = true;

            chart.redraw(animation);
        }
    }

    /**
     * Experimental integration of the data layer
     * @private
     */
    public setTable(
        table: DataTable,
        redraw: boolean = true,
        animation?: (boolean|Partial<AnimationOptions>)
    ): void {
        const series = this.series,
            anySeries: AnyRecord = series,
            oldData = series.points,
            keys = series.parallelArrays,
            rowCount = table.getRowCount();

        let key: string;

        if (oldData) {
            const xAxis = series.xAxis;

            series.colorCounter = 0;
            series.data = [];

            delete anySeries.points;
            delete anySeries.processedXData;
            delete anySeries.processedYData;
            delete anySeries.xIncrement;

            for (let i = 0, iEnd = keys.length; i < iEnd; ++i) {
                key = keys[i];
                anySeries[`${key}Data`] = [];
            }

            for (let i = 0, iEnd = oldData.length; i < iEnd; ++i) {
                if (oldData[i] && !!oldData[i].destroy) {
                    oldData[i].destroy();
                }
            }

            if (xAxis) {
                xAxis.minRange = xAxis.userMinRange;
            }
        }

        let column: (Readonly<DataTable.Column>|undefined),
            failure = false,
            indexAsX = false;

        for (let i = 0, iEnd = keys.length; i < iEnd; ++i) {
            key = keys[i];
            column = table.getColumn(key, true);

            if (!column) {
                if (key === 'x') {
                    indexAsX = true;
                    continue;
                } else {
                    failure = true;
                    break;
                }
            }

            anySeries[`${key}Data`] = column;
        }

        if (failure) {
            // fallback to index
            const columnNames = table.getColumnNames(),
                emptyColumn: DataTable.Column = [];

            emptyColumn.length = rowCount;

            let columnOffset = 0;

            if (columnNames.length === keys.length - 1) {
                // table index becomes x
                columnOffset = 1;
                indexAsX = true;
            }

            for (
                let i = columnOffset,
                    iEnd = keys.length;
                i < iEnd;
                ++i
            ) {
                column = table.getColumn(columnNames[i], true);
                key = keys[i];

                anySeries[`${key}Data`] = column || emptyColumn.slice();
            }
        }

        this.indexAsX = indexAsX;

        if (indexAsX && keys.indexOf('x') !== -1) {
            column = [];

            for (let x = 0; x < rowCount; ++x) {
                column.push(series.autoIncrement());
            }

            anySeries.xData = column;
        }

        this.syncOff();

        this.table = table;

        if (redraw) {
            this.syncOn();
        }

        this.processTable(redraw, oldData && animation);
    }

    /**
     * Stops synchronisation of table changes with series.
     * @private
     */
    public syncOff(): void {
        const unlisteners = this.unlisteners;

        for (let i = 0, iEnd = unlisteners.length; i < iEnd; ++i) {
            unlisteners[i]();
        }

        unlisteners.length = 0;
    }

    /**
     * Activates synchronization of table changes with series.
     * @private
     */
    public syncOn(): void {
        if (this.unlisteners.length) {
            return;
        }

        const series = this.series,
            table = this.table,
            anySeries: AnyRecord = series,
            onChange = (e: DataTable.Event): void => {
                if (e.type === 'afterDeleteColumns') {
                    // deletion affects all points
                    this.setTable(table, true);
                    return;
                }
                if (e.type === 'afterDeleteRows') {
                    if (
                        e.rowIndex > 0 &&
                        e.rowIndex + e.rowCount < series.points.length
                    ) {
                        // deletion affects trailing points
                        this.setTable(table, true);
                        return;
                    }
                    for (
                        let i = e.rowIndex,
                            iEnd = i + e.rowCount;
                        i < iEnd;
                        ++i
                    ) {
                        series.removePoint(i, false);
                    }
                }
                if (this.indexAsX) {
                    if (e.type === 'afterSetCell') {
                        anySeries.xData[e.rowIndex] = e.rowIndex;
                    } else if (e.type === 'afterSetRows') {
                        for (
                            let i = e.rowIndex,
                                iEnd = i + e.rowCount;
                            i < iEnd;
                            ++i
                        ) {
                            anySeries.xData[i] = series.autoIncrement();
                        }
                    }
                }

                this.processTable(true);
            };

        this.unlisteners.push(
            table.on('afterDeleteColumns', onChange),
            table.on('afterDeleteRows', onChange),
            table.on('afterSetCell', onChange),
            table.on('afterSetRows', onChange)
        );
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataSeriesAdditions;

/* *
 *
 *  API Options
 *
 * */

/* *
 * Indicates data is structured as columns instead of rows.
 *
 * @requires  es-modules/Data/DataSeriesComposition.js
 *
 * @type      {boolean}
 * @since     Future
 * @apioption plotOptions.series.dataAsColumns
 */

(''); // keeps doclets above in JS file
