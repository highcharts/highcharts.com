/* *
 *
 *  (c) 2010-2024 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    ApproximationArray,
    ApproximationKeyValue
} from './ApproximationType';
import type Axis from '../../Core/Axis/Axis';
import type DataGroupingOptions from './DataGroupingOptions';
import type IndicatorLike from '../../Stock/Indicators/IndicatorLike';
import type Point from '../../Core/Series/Point';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type Series from '../../Core/Series/Series';
import type TimeTicksInfoObject from '../../Core/Axis/TimeTicksInfoObject';
import type { SeriesTypeOptions } from '../../Core/Series/SeriesType';
import type { TypedArray } from '../../Core/Series/SeriesOptions';

import ApproximationRegistry from './ApproximationRegistry.js';
import DataGroupingDefaults from './DataGroupingDefaults.js';
import DataTableCore from '../../Data/DataTableCore.js';
import DateTimeAxis from '../../Core/Axis/DateTimeAxis.js';
import D from '../../Core/Defaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: seriesProto
    }
} = SeriesRegistry;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    defined,
    error,
    extend,
    isNumber,
    merge,
    pick,
    splat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Axis/TimeTicksInfoObject' {
    interface TimeTicksInfoObject {
        gapSize?: number;
    }
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        dataGroup?: DataGroupingInfoObject;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        allGroupedTable?: DataTableCore;
        cropStart?: number;
        currentDataGrouping?: TimeTicksInfoObject;
        dataGroupInfo?: DataGroupingInfoObject;
        forceCrop?: boolean;
        groupedData?: (Array<Point>|null);
        groupMap?: Array<DataGroupingInfoObject>;
        groupPixelWidth?: number;
        hasGroupedData?: boolean;
        hasProcessed?: boolean;
        preventGraphAnimation?: boolean;
        applyGrouping(hasExtremesChanged: boolean): void;
        destroyGroupedData(): void;
        generatePoints(): void;
        getDGApproximation(): ApproximationKeyValue;
        groupData(
            table: DataTableCore,
            groupPosition: Array<number>,
            approximation: (string|Function)
        ): DataGroupingResultObject;
    }
}

export type AnchorChoiceType = Record<string, number>;

export interface DataGroupingInfoObject {
    length?: number;
    options?: (PointOptions|PointShortOptions|SeriesTypeOptions);
    start?: number;
    groupStart?: number
}

export interface DataGroupingResultObject {
    modified: DataTableCore;
    groupMap: Array<DataGroupingInfoObject>;
}

/* *
 *
 *  Constants
 *
 * */

const baseGeneratePoints = seriesProto.generatePoints;

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function adjustExtremes(
    xAxis: Axis,
    groupedXData: Array<number>|TypedArray
): void {
    // Make sure the X axis extends to show the first group (#2533)
    // But only for visible series (#5493, #6393)
    if (
        defined(groupedXData[0]) &&
        isNumber(xAxis.min) &&
        isNumber(xAxis.dataMin) &&
        groupedXData[0] < xAxis.min
    ) {
        if (
            (
                !defined(xAxis.options.min) &&
                xAxis.min <= xAxis.dataMin
            ) ||
            xAxis.min === xAxis.dataMin
        ) {
            xAxis.min = Math.min(groupedXData[0], xAxis.min);
        }

        xAxis.dataMin = Math.min(
            groupedXData[0],
            xAxis.dataMin
        );
    }

    // When the last anchor set, change the extremes that
    // the last point is visible (#12455).
    if (
        defined(groupedXData[groupedXData.length - 1]) &&
        isNumber(xAxis.max) &&
        isNumber(xAxis.dataMax) &&
        groupedXData[groupedXData.length - 1] > xAxis.max
    ) {

        if (
            (
                !defined(xAxis.options.max) &&
                isNumber(xAxis.dataMax) &&
                xAxis.max >= xAxis.dataMax
            ) || xAxis.max === xAxis.dataMax
        ) {
            xAxis.max = Math.max(
                groupedXData[groupedXData.length - 1],
                xAxis.max
            );
        }
        xAxis.dataMax = Math.max(
            groupedXData[groupedXData.length - 1],
            xAxis.dataMax
        );
    }
}

/**
 * @private
 */
function anchorPoints(
    series: Series,
    groupedXData: Array<number>|TypedArray,
    xMax: number
): void {
    const options = series.options,
        dataGroupingOptions = options.dataGrouping,
        totalRange = (
            series.currentDataGrouping && series.currentDataGrouping.gapSize
        ),
        xData = series.getColumn('x');

    if (!(
        dataGroupingOptions &&
        xData.length &&
        totalRange &&
        series.groupMap
    )) {
        return;
    }

    const groupedDataLastIndex = groupedXData.length - 1,
        anchor = dataGroupingOptions.anchor,
        firstAnchor = dataGroupingOptions.firstAnchor,
        lastAnchor = dataGroupingOptions.lastAnchor;
    let anchorIndexIterator = groupedXData.length - 1,
        anchorFirstIndex = 0;

    // Change the first point position, but only when it is
    // the first point in the data set not in the current zoom.
    if (firstAnchor && xData[0] >= groupedXData[0]) {
        anchorFirstIndex++;
        const groupStart = series.groupMap[0].start,
            groupLength = series.groupMap[0].length;
        let firstGroupEnd;

        if (isNumber(groupStart) && isNumber(groupLength)) {
            firstGroupEnd = groupStart + (groupLength - 1);
        }

        groupedXData[0] = ({
            start: groupedXData[0],
            middle: groupedXData[0] + 0.5 * totalRange,
            end: groupedXData[0] + totalRange,
            firstPoint: xData[0],
            lastPoint: firstGroupEnd && xData[firstGroupEnd]
        } as AnchorChoiceType)[firstAnchor];
    }

    // Change the last point position but only when it is
    // the last point in the data set not in the current zoom,
    // or if it is not the 1st point simultaneously.
    if (
        groupedDataLastIndex > 0 &&
            lastAnchor &&
            totalRange &&
            groupedXData[groupedDataLastIndex] >= xMax - totalRange
    ) {
        anchorIndexIterator--;
        const lastGroupStart = series.groupMap[
            series.groupMap.length - 1
        ].start;

        groupedXData[groupedDataLastIndex] = ({
            start: groupedXData[groupedDataLastIndex],
            middle: groupedXData[groupedDataLastIndex] + 0.5 * totalRange,
            end: groupedXData[groupedDataLastIndex] + totalRange,
            firstPoint: lastGroupStart && xData[lastGroupStart],
            lastPoint: xData[xData.length - 1]
        } as AnchorChoiceType)[lastAnchor];
    }

    if (anchor && anchor !== 'start') {
        const shiftInterval: number = (
            totalRange *
                ({ middle: 0.5, end: 1 } as AnchorChoiceType)[anchor]
        );

        // Anchor the rest of the points apart from the ones, that were
        // previously moved.
        while (anchorIndexIterator >= anchorFirstIndex) {
            groupedXData[anchorIndexIterator] += shiftInterval;
            anchorIndexIterator--;
        }
    }
}


/**
 * For the processed data, calculate the grouped data if needed.
 *
 * @private
 * @function Highcharts.Series#applyGrouping
 */
function applyGrouping(
    this: Series,
    hasExtremesChanged: boolean
): void {
    const series = this,
        chart = series.chart,
        options = series.options,
        dataGroupingOptions = options.dataGrouping,
        groupingEnabled = series.allowDG !== false && dataGroupingOptions &&
            pick(dataGroupingOptions.enabled, chart.options.isStock),
        reserveSpace = series.reserveSpace(),
        lastDataGrouping = this.currentDataGrouping;

    let currentDataGrouping,
        croppedData,
        revertRequireSorting = false;

    // Data needs to be sorted for dataGrouping
    if (groupingEnabled && !series.requireSorting) {
        series.requireSorting = revertRequireSorting = true;
    }

    // Skip if skipDataGrouping method returns false or if grouping is disabled
    // (in that order).
    const skip = skipDataGrouping(
        series,
        hasExtremesChanged
    ) === false || !groupingEnabled;

    // Revert original requireSorting value if changed
    if (revertRequireSorting) {
        series.requireSorting = false;
    }

    if (skip) {
        return;
    }
    series.destroyGroupedData();

    const table = dataGroupingOptions.groupAll ?
            series.dataTable :
            series.dataTable.modified || series.dataTable,
        processedXData = series.getColumn('x', !dataGroupingOptions.groupAll),
        xData = processedXData,
        plotSizeX = chart.plotSizeX,
        xAxis = series.xAxis,
        extremes = xAxis.getExtremes(),
        ordinal = xAxis.options.ordinal,
        groupPixelWidth = series.groupPixelWidth;

    let i, hasGroupedData;

    // Execute grouping if the amount of points is greater than the limit
    // defined in groupPixelWidth
    if (
        groupPixelWidth &&
        xData &&
        table.rowCount &&
        plotSizeX &&
        isNumber(extremes.min)
    ) {
        hasGroupedData = true;

        // Force recreation of point instances in series.translate, #5699
        series.isDirty = true;
        series.points = null as any; // #6709

        const xMin = extremes.min,
            xMax = extremes.max,
            groupIntervalFactor = (
                ordinal &&
                xAxis.ordinal &&
                xAxis.ordinal.getGroupIntervalFactor(xMin, xMax, series)
            ) || 1,
            interval =
            (groupPixelWidth * (xMax - xMin) / plotSizeX) *
                groupIntervalFactor,
            groupPositions = xAxis.getTimeTicks(
                DateTimeAxis.Additions.prototype.normalizeTimeTickInterval(
                    interval,
                    (dataGroupingOptions as any).units ||
                        DataGroupingDefaults.units
                ),
                // Processed data may extend beyond axis (#4907)
                Math.min(xMin, xData[0]),
                Math.max(
                    xMax,
                    xData[xData.length - 1]
                ),
                xAxis.options.startOfWeek,
                processedXData,
                series.closestPointRange
            ),
            groupedData = seriesProto.groupData.apply(
                series,
                [
                    table,
                    groupPositions,
                    (dataGroupingOptions as any).approximation
                ]
            );

        let modified = groupedData.modified,
            groupedXData = modified.getColumn('x', true) as
                Array<number>|TypedArray,
            gapSize = 0;

        // The smoothed option is deprecated, instead, there is a fallback
        // to the new anchoring mechanism. #12455.
        if (
            dataGroupingOptions?.smoothed &&
            modified.rowCount
        ) {
            dataGroupingOptions.firstAnchor = 'firstPoint';
            dataGroupingOptions.anchor = 'middle';
            dataGroupingOptions.lastAnchor = 'lastPoint';

            error(32, false, chart, {
                'dataGrouping.smoothed': 'use dataGrouping.anchor'
            });
        }

        // Record what data grouping values were used
        for (i = 1; i < groupPositions.length; i++) {
            // The grouped gapSize needs to be the largest distance between
            // the group to capture varying group sizes like months or DST
            // crossing (#10000). Also check that the gap is not at the
            // start of a segment.
            if (
                !(groupPositions.info as any).segmentStarts ||
                (groupPositions.info as any).segmentStarts.indexOf(i) === -1
            ) {
                gapSize = Math.max(
                    groupPositions[i] - groupPositions[i - 1],
                    gapSize
                );
            }
        }
        currentDataGrouping = groupPositions.info;
        (currentDataGrouping as any).gapSize = gapSize;
        series.closestPointRange = (groupPositions.info as any).totalRange;
        series.groupMap = groupedData.groupMap;
        series.currentDataGrouping = currentDataGrouping;

        anchorPoints(series, groupedXData || [], xMax);

        if (reserveSpace && groupedXData) {
            adjustExtremes(xAxis, groupedXData);
        }

        // We calculated all group positions but we should render only the ones
        // within the visible range
        if (dataGroupingOptions.groupAll) {
            // Keep the reference to all grouped points for further calculation,
            // used in Heikin-Ashi and hollow candlestick series.
            series.allGroupedTable = modified;

            croppedData = series.cropData(
                modified,
                xAxis.min || 0,
                xAxis.max || 0
            );
            modified = croppedData.modified;
            groupedXData = modified.getColumn('x') as Array<number>;

            series.cropStart = croppedData.start; // #15005
        }
        // Set the modified table
        series.dataTable.modified = modified;
    } else {
        series.groupMap = void 0;
        series.currentDataGrouping = void 0;
    }
    series.hasGroupedData = hasGroupedData;

    series.preventGraphAnimation =
        (lastDataGrouping && lastDataGrouping.totalRange) !==
            (currentDataGrouping && currentDataGrouping.totalRange);

}

/**
 * @private
 */
function compose(
    SeriesClass: typeof Series
): void {
    const seriesProto = SeriesClass.prototype;


    if (!seriesProto.applyGrouping) {
        const PointClass = SeriesClass.prototype.pointClass;

        // Override point prototype to throw a warning when trying to update
        // grouped points.
        addEvent(PointClass, 'update', function (): (boolean|undefined) {
            if (this.dataGroup) {
                error(24, false, this.series.chart);
                return false;
            }
        });

        addEvent(SeriesClass, 'afterSetOptions', onAfterSetOptions);
        addEvent(SeriesClass, 'destroy', destroyGroupedData);

        extend(seriesProto, {
            applyGrouping,
            destroyGroupedData,
            generatePoints,
            getDGApproximation,
            groupData
        });
    }

}

/**
 * Destroy the grouped data points. #622, #740
 * @private
 */
function destroyGroupedData(
    this: Series
): void {
    // Clear previous groups
    if (this.groupedData) {
        this.groupedData.forEach(function (
            point: Point,
            i: number
        ): void {
            if (point) {
                (this.groupedData as any)[i] = point.destroy ?
                    point.destroy() : null;
            }
        }, this);

        // Clears all:
        // - `this.groupedData`
        // - `this.points`
        // - `preserve` object in series.update()
        this.groupedData.length = 0;
        delete this.allGroupedTable;
    }
}

/**
 * Override the generatePoints method by adding a reference to grouped data
 * @private
 */
function generatePoints(
    this: Series
): void {

    baseGeneratePoints.apply(this);

    // Record grouped data in order to let it be destroyed the next time
    // processData runs
    this.destroyGroupedData(); // #622
    this.groupedData = this.hasGroupedData ? this.points : null;
}

/**
 * Set default approximations to the prototypes if present. Properties are
 * inherited down. Can be overridden for individual series types.
 * @private
 */
function getDGApproximation(
    this: Series
): ApproximationKeyValue {
    if (this.is('arearange')) {
        return 'range';
    }
    if (this.is('ohlc')) {
        return 'ohlc';
    }
    if (this.is('hlc')) {
        return 'hlc';
    }
    if (
        // #18974, default approximation for cumulative
        // should be `sum` when `dataGrouping` is enabled
        this.is('column') ||
        this.options.cumulative
    ) {
        return 'sum';
    }
    return 'average';
}

/**
 * Highcharts Stock only. Takes parallel arrays of x and y data and groups the
 * data into intervals defined by groupPositions, a collection of starting x
 * values for each group.
 *
 * @product highstock
 *
 * @function Highcharts.Series#groupData
 * @param {Highcharts.DataTable} table
 *        The series data table.
 * @param {Array<number>} groupPositions
 *        Group positions.
 * @param {string|Function} [approximation]
 *        Approximation to use.
 * @return {Highcharts.DataGroupingResultObject}
 *         Mapped groups.
 */
function groupData(
    this: Series,
    table: DataTableCore,
    groupPositions: Array<number>,
    approximation: (ApproximationKeyValue|Function)
): DataGroupingResultObject {
    const xData = table.getColumn('x', true) as Array<number> || [],
        yData = table.getColumn('y', true) as Array<number>,
        series = this,
        topTable = series.dataTable,
        cropStart = series.cropStart || 0,
        data = series.data,
        dataOptions = series.options?.data,
        groupedXData = [],
        modified = new DataTableCore(),
        groupMap = [],
        dataLength = table.rowCount,
        // When grouping the fake extended axis for panning, we don't need to
        // consider y
        handleYData = !!yData,
        values = [] as Array<ApproximationArray>,
        pointArrayMap = series.pointArrayMap,
        pointArrayMapLength = pointArrayMap && pointArrayMap.length,
        extendedPointArrayMap = ['x'].concat(pointArrayMap || ['y']),
        // Data columns to be applied to the modified data table at the end
        valueColumns = (pointArrayMap || ['y']).map((): Array<number> => []),
        groupAll = this.options.dataGrouping?.groupAll;

    let pointX,
        pointY,
        groupedY,
        pos = 0,
        start = 0;

    const approximationFn = (
        typeof approximation === 'function' ?
            approximation :
            approximation && ApproximationRegistry[approximation] ?
                ApproximationRegistry[approximation] :
                ApproximationRegistry[(
                    series.getDGApproximation && series.getDGApproximation() ||
                    'average'
                )]
    );

    // Calculate values array size from pointArrayMap length
    if (pointArrayMapLength) {
        let len = pointArrayMap.length;
        while (len--) {
            values.push([]);
        }
    } else {
        values.push([]);
    }

    const valuesLen = pointArrayMapLength || 1;

    for (let i = 0; i <= dataLength; i++) {

        // Start with the first point within the X axis range (#2696)
        if (xData[i] < groupPositions[0]) {
            continue; // With next point
        }

        // When a new group is entered, summarize and initialize
        // the previous group
        while (
            (
                typeof groupPositions[pos + 1] !== 'undefined' &&
                xData[i] >= groupPositions[pos + 1]
            ) ||
            i === dataLength
        ) { // Get the last group

            // get group x and y
            pointX = groupPositions[pos];
            series.dataGroupInfo = {
                start: groupAll ? start : ((series.cropStart as any) + start),
                length: values[0].length,
                groupStart: pointX
            };
            groupedY = approximationFn.apply(series, values);

            // By default, let options of the first grouped point be passed over
            // to the grouped point. This allows preserving properties like
            // `name` and `color` or custom properties. Implementers can
            // override this from the approximation function, where they can
            // write custom options to `this.dataGroupInfo.options`.
            if (
                series.pointClass &&
                !defined(series.dataGroupInfo.options) &&
                (this.useDataTable || dataOptions)
            ) {
                // Convert numbers and arrays into objects
                series.dataGroupInfo.options = merge(
                    series.pointClass.prototype
                        .optionsToObject.call(
                            { series },
                            this.useDataTable ?
                                topTable.getRow(
                                    cropStart + start
                                ) as unknown as PointOptions :
                                (dataOptions?.[cropStart + start] || {})
                        )
                );

                // Make sure the raw data (x, y, open, high etc) is not copied
                // over and overwriting approximated data.
                extendedPointArrayMap.forEach(function (key: string): void {
                    delete ((series.dataGroupInfo as any).options as any)[key];
                });
            }

            // Push the grouped data
            if (typeof groupedY !== 'undefined') {
                groupedXData.push(pointX);

                // Push the grouped values to the parallel columns
                const groupedValuesArr = splat(groupedY);
                for (let j = 0; j < groupedValuesArr.length; j++) {
                    valueColumns[j].push(groupedValuesArr[j]);
                }
                groupMap.push(series.dataGroupInfo);
            }

            // Reset the aggregate arrays
            start = i;
            for (let j = 0; j < valuesLen; j++) {
                values[j].length = 0; // Faster than values[j] = []
                values[j].hasNulls = false;
            }

            // Advance on the group positions
            pos += 1;

            // Don't loop beyond the last group
            if (i === dataLength) {
                break;
            }
        }

        // Break out
        if (i === dataLength) {
            break;
        }

        // For each raw data point, push it to an array that contains all values
        // for this specific
        if (pointArrayMap) {
            const index = groupAll ? i : (series.cropStart as any) + i,
                point = (data && data[index]) ||
                    series.pointClass.prototype.applyOptions.apply({
                        series: series
                    }, [topTable.getRow(index) as unknown as PointOptions]);

            let val;

            for (let j = 0; j < (pointArrayMapLength as any); j++) {
                val = (point as any)[pointArrayMap[j]];
                if (isNumber(val)) {
                    values[j].push(val);
                } else if (val === null) {
                    values[j].hasNulls = true;
                }
            }

        } else {
            pointY = handleYData ? yData[i] : null;

            if (isNumber(pointY)) {
                values[0].push(pointY as any);
            } else if (pointY === null) {
                values[0].hasNulls = true;
            }
        }
    }

    const columns: DataTableCore.ColumnCollection = {
        x: groupedXData
    };
    (pointArrayMap || ['y']).forEach((key, i): void => {
        columns[key] = valueColumns[i];
    });
    modified.setColumns(columns);

    return {
        groupMap,
        modified
    };
}

/**
 * Handle default options for data grouping. This must be set at runtime because
 * some series types are defined after this.
 * @private
 */
function onAfterSetOptions(
    this: Series,
    e: { options: SeriesTypeOptions }
): void {
    const options = e.options,
        type = this.type,
        plotOptions = this.chart.options.plotOptions,
        // External series, for example technical indicators should also inherit
        // commonOptions which are not available outside this module
        baseOptions = (
            (this as IndicatorLike).useCommonDataGrouping &&
            DataGroupingDefaults.common
        ),
        seriesSpecific = DataGroupingDefaults.seriesSpecific;

    let defaultOptions: DataGroupingOptions =
            (D.defaultOptions.plotOptions as any)[type].dataGrouping;

    if (plotOptions && (seriesSpecific[type] || baseOptions)) { // #1284
        const rangeSelector = this.chart.rangeSelector;

        if (!defaultOptions) {
            defaultOptions = merge(
                DataGroupingDefaults.common,
                seriesSpecific[type]
            );
        }

        options.dataGrouping = merge(
            baseOptions as any,
            defaultOptions,
            plotOptions.series && plotOptions.series.dataGrouping, // #1228
            // Set by the StockChart constructor:
            (plotOptions[type] as any).dataGrouping,
            this.userOptions.dataGrouping,
            !options.isInternal &&
                rangeSelector &&
                isNumber(rangeSelector.selected) &&
                rangeSelector.buttonOptions[rangeSelector.selected].dataGrouping
        );
    }
}

/**
 * @private
 */
function skipDataGrouping(series: Series, force: boolean): boolean {
    return !(series.isCartesian &&
        !series.isDirty &&
        !series.xAxis.isDirty &&
        !series.yAxis.isDirty &&
        !force);
}

/* *
 *
 *  Default Export
 *
 * */

const DataGroupingSeriesComposition = {
    compose,
    groupData
};

export default DataGroupingSeriesComposition;
