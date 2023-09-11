/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import ApproximationRegistry from './ApproximationRegistry.js';
import DataGroupingDefaults from './DataGroupingDefaults.js';
import DateTimeAxis from '../../Core/Axis/DateTimeAxis.js';
import D from '../../Core/Defaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: seriesProto
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
import error from '../../Shared/Helpers/Error.js';
const {
    pushUnique
} = AH;
const { isNumber } = TC;
const { extend, defined, merge } = OH;
const { addEvent } = EH;
const {
    pick
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
        allGroupedData?: Array<(number|null|undefined)>|Array<Array<(number|null|undefined)>>;
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
            xData: Array<number>,
            yData: (Array<number>|Array<Array<number>>),
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
}

export interface DataGroupingResultObject {
    groupedXData: Array<number>;
    groupedYData: (
        Array<(number|null|undefined)>|
        Array<Array<(number|null|undefined)>>
    );
    groupMap: Array<DataGroupingInfoObject>;
}

/* *
 *
 *  Constants
 *
 * */

const baseGeneratePoints = seriesProto.generatePoints;

const composedMembers: Array<Function> = [];

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
    groupedXData: Array<number>
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
    groupedXData: Array<number>,
    xMax: number
): any {
    const options = series.options,
        dataGroupingOptions = options.dataGrouping,
        totalRange = (
            series.currentDataGrouping && series.currentDataGrouping.gapSize
        );
    let i;

    // DataGrouping x-coordinates.
    if (dataGroupingOptions && series.xData && totalRange && series.groupMap) {
        const groupedDataLength = groupedXData.length - 1,
            anchor = dataGroupingOptions.anchor,
            firstAnchor = pick(dataGroupingOptions.firstAnchor, anchor),
            lastAnchor = pick(dataGroupingOptions.lastAnchor, anchor);

        // Anchor points that are not extremes.
        if (anchor && anchor !== 'start') {
            const shiftInterval: number = (
                totalRange *
                ({ middle: 0.5, end: 1 } as AnchorChoiceType)[anchor]
            );

            i = groupedXData.length - 1;
            while (i-- && i > 0) {
                groupedXData[i] += shiftInterval;
            }
        }

        // Change the first point position, but only when it is
        // the first point in the data set not in the current zoom.
        if (
            firstAnchor &&
            firstAnchor !== 'start' &&
            series.xData[0] >= groupedXData[0]
        ) {
            const groupStart = series.groupMap[0].start,
                groupLength = series.groupMap[0].length;
            let firstGroupstEnd;

            if (isNumber(groupStart) && isNumber(groupLength)) {
                firstGroupstEnd = groupStart + (groupLength - 1);
            }

            groupedXData[0] = ({
                middle: groupedXData[0] + 0.5 * totalRange,
                end: groupedXData[0] + totalRange,
                firstPoint: series.xData[0],
                lastPoint: firstGroupstEnd && series.xData[firstGroupstEnd]
            } as AnchorChoiceType)[firstAnchor];
        }

        // Change the last point position but only when it is
        // the last point in the data set not in the current zoom.
        if (
            lastAnchor &&
            lastAnchor !== 'start' &&
            totalRange &&
            groupedXData[groupedDataLength] >= xMax - totalRange
        ) {
            const lastGroupStart = series.groupMap[
                series.groupMap.length - 1
            ].start;

            groupedXData[groupedDataLength] = ({
                middle: groupedXData[groupedDataLength] + 0.5 * totalRange,
                end: groupedXData[groupedDataLength] + totalRange,
                firstPoint: lastGroupStart && series.xData[lastGroupStart],
                lastPoint: series.xData[series.xData.length - 1]
            } as AnchorChoiceType)[lastAnchor];
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
        visible = (
            series.visible || !chart.options.chart.ignoreHiddenSeries
        ),
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

    if (!skip) {
        series.destroyGroupedData();

        const processedXData = (dataGroupingOptions as any).groupAll ?
                series.xData :
                series.processedXData,
            processedYData = (dataGroupingOptions as any).groupAll ?
                series.yData :
                series.processedYData,
            plotSizeX = chart.plotSizeX,
            xAxis = series.xAxis,
            ordinal = xAxis.options.ordinal,
            groupPixelWidth = series.groupPixelWidth;

        let i,
            hasGroupedData;

        // Execute grouping if the amount of points is greater than the limit
        // defined in groupPixelWidth
        if (
            groupPixelWidth &&
            processedXData &&
            processedXData.length &&
            plotSizeX
        ) {
            hasGroupedData = true;

            // Force recreation of point instances in series.translate, #5699
            series.isDirty = true;
            series.points = null as any; // #6709

            const extremes = xAxis.getExtremes(),
                xMin = extremes.min,
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
                    Math.min(xMin, processedXData[0]),
                    Math.max(
                        xMax,
                        processedXData[processedXData.length - 1]
                    ),
                    xAxis.options.startOfWeek,
                    processedXData,
                    series.closestPointRange
                ),
                groupedData = seriesProto.groupData.apply(
                    series,
                    [
                        processedXData,
                        processedYData as any,
                        groupPositions,
                        (dataGroupingOptions as any).approximation
                    ]
                );

            let groupedXData = groupedData.groupedXData,
                groupedYData = groupedData.groupedYData,
                gapSize = 0;

            // The smoothed option is deprecated, instead, there is a fallback
            // to the new anchoring mechanism. #12455.
            if (
                dataGroupingOptions &&
                dataGroupingOptions.smoothed &&
                groupedXData.length
            ) {
                dataGroupingOptions.firstAnchor = 'firstPoint';
                dataGroupingOptions.anchor = 'middle';
                dataGroupingOptions.lastAnchor = 'lastPoint';

                error(32, false, chart, {
                    'dataGrouping.smoothed': 'use dataGrouping.anchor'
                });
            }

            anchorPoints(series, groupedXData, xMax);

            // Record what data grouping values were used
            for (i = 1; i < groupPositions.length; i++) {
                // The grouped gapSize needs to be the largest distance between
                // the group to capture varying group sizes like months or DST
                // crossing (#10000). Also check that the gap is not at the
                // start of a segment.
                if (!(groupPositions.info as any).segmentStarts ||
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

            if (visible) {
                adjustExtremes(xAxis, groupedXData);
            }

            // We calculated all group positions but we should render
            // only the ones within the visible range
            if ((dataGroupingOptions as any).groupAll) {
                // Keep the reference to all grouped points
                // for further calculation (eg. heikinashi).
                series.allGroupedData = groupedYData;

                croppedData = series.cropData(
                    groupedXData,
                    groupedYData as any,
                    xAxis.min as any,
                    xAxis.max as any,
                    1 // Ordinal xAxis will remove left-most points otherwise
                );
                groupedXData = croppedData.xData;
                groupedYData = croppedData.yData;
                series.cropStart = croppedData.start; // #15005
            }
            // Set series props
            series.processedXData = groupedXData;
            series.processedYData = groupedYData as any;
        } else {
            series.groupMap = null as any;
        }
        series.hasGroupedData = hasGroupedData;
        series.currentDataGrouping = currentDataGrouping;

        series.preventGraphAnimation =
            (lastDataGrouping && lastDataGrouping.totalRange) !==
            (currentDataGrouping && currentDataGrouping.totalRange);
    }
}

/**
 * @private
 */
function compose(
    SeriesClass: typeof Series
): void {
    const PointClass = SeriesClass.prototype.pointClass;

    if (pushUnique(composedMembers, PointClass)) {
        // Override point prototype to throw a warning when trying to update
        // grouped points.
        addEvent(PointClass, 'update', function (): (boolean|undefined) {
            if (this.dataGroup) {
                error(24, false, this.series.chart);
                return false;
            }
        });
    }

    if (pushUnique(composedMembers, SeriesClass)) {
        addEvent(SeriesClass, 'afterSetOptions', onAfterSetOptions);
        addEvent(SeriesClass, 'destroy', destroyGroupedData);

        extend(SeriesClass.prototype, {
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
 * @param {Array<number>} xData
 *        Parallel array of x data.
 * @param {Array<(number|null|undefined)>|Array<Array<(number|null|undefined)>>} yData
 *        Parallel array of y data.
 * @param {Array<number>} groupPositions
 *        Group positions.
 * @param {string|Function} [approximation]
 *        Approximation to use.
 * @return {Highcharts.DataGroupingResultObject}
 *         Mapped groups.
 */
function groupData(
    this: Series,
    xData: Array<number>,
    yData: (
        Array<(number|null|undefined)>|
        Array<Array<(number|null|undefined)>>
    ),
    groupPositions: Array<number>,
    approximation?: (ApproximationKeyValue|Function)
): DataGroupingResultObject {
    const series = this,
        data = series.data,
        dataOptions = series.options && series.options.data,
        groupedXData = [],
        groupedYData = [],
        groupMap = [],
        dataLength = xData.length,
        // when grouping the fake extended axis for panning,
        // we don't need to consider y
        handleYData = !!yData,
        values = [] as Array<ApproximationArray>,
        pointArrayMap = series.pointArrayMap,
        pointArrayMapLength = pointArrayMap && pointArrayMap.length,
        extendedPointArrayMap = ['x'].concat(pointArrayMap || ['y']),
        groupAll = (
            this.options.dataGrouping &&
            this.options.dataGrouping.groupAll
        );

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
            continue; // with next point
        }

        // when a new group is entered, summarize and initialize
        // the previous group
        while (
            (
                typeof groupPositions[pos + 1] !== 'undefined' &&
                xData[i] >= groupPositions[pos + 1]
            ) ||
            i === dataLength
        ) { // get the last group

            // get group x and y
            pointX = groupPositions[pos];
            series.dataGroupInfo = {
                start: groupAll ? start : ((series.cropStart as any) + start),
                length: values[0].length
            };
            groupedY = approximationFn.apply(series, values);

            // By default, let options of the first grouped point be passed over
            // to the grouped point. This allows preserving properties like
            // `name` and `color` or custom properties. Implementers can
            // override this from the approximation function, where they can
            // write custom options to `this.dataGroupInfo.options`.
            if (series.pointClass && !defined(series.dataGroupInfo.options)) {
                // Convert numbers and arrays into objects
                series.dataGroupInfo.options = merge(
                    series.pointClass.prototype
                        .optionsToObject.call(
                            { series: series },
                            (series.options.data as any)[
                                (series.cropStart as any) + start
                            ]
                        )
                );

                // Make sure the raw data (x, y, open, high etc) is not copied
                // over and overwriting approximated data.
                extendedPointArrayMap.forEach(function (key: string): void {
                    delete ((series.dataGroupInfo as any).options as any)[key];
                });
            }

            // push the grouped data
            if (typeof groupedY !== 'undefined') {
                groupedXData.push(pointX);
                groupedYData.push(groupedY);
                groupMap.push(series.dataGroupInfo);
            }

            // reset the aggregate arrays
            start = i;
            for (let j = 0; j < valuesLen; j++) {
                values[j].length = 0; // faster than values[j] = []
                values[j].hasNulls = false;
            }

            // Advance on the group positions
            pos += 1;

            // don't loop beyond the last group
            if (i === dataLength) {
                break;
            }
        }

        // break out
        if (i === dataLength) {
            break;
        }

        // for each raw data point, push it to an array that contains all values
        // for this specific group
        if (pointArrayMap) {
            const index = (
                    series.options.dataGrouping &&
                    series.options.dataGrouping.groupAll ?
                        i : (series.cropStart as any) + i
                ),
                point = (data && data[index]) ||
                    series.pointClass.prototype.applyOptions.apply({
                        series: series
                    }, [(dataOptions as any)[index]]);

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

    return {
        groupedXData,
        groupedYData,
        groupMap
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
