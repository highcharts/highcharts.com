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

import type { NavigatorAxisComposition } from './NavigatorAxisComposition';
import type ScatterSeries from '../../Series/Scatter/ScatterSeries';
import type TickPositionsArray from './TickPositionsArray';
import type Time from '../Time';

import Axis from './Axis.js';
import Chart from '../Chart/Chart.js';
import H from '../Globals.js';
import Point from '../Series/Point.js';
import Series from '../Series/Series.js';
import U from '../Utilities.js';
const {
    addEvent,
    correctFloat,
    css,
    defined,
    error,
    pick,
    timeUnits
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisComposition' {
    interface AxisComposition {
        ordinal?: OrdinalAxis.Additions;
        /** @deprecated */
        getTimeTicks(
            normalizedInterval: Time.TimeNormalizedObject,
            min: number,
            max: number,
            startOfWeek?: number,
            positions?: Array<number>,
            closestDistance?: number,
            findHigherRanks?: boolean
        ): TickPositionsArray;
        /** @deprecated */
        lin2val(val: number): number;
        /** @deprecated */
        val2lin(val: number, toIndex?: boolean): number;
    }
}

declare module './AxisOptions' {
    interface AxisOptions {
        keepOrdinalPadding?: boolean;
    }
}

declare module './TimeTicksInfoObject' {
    interface TimeTicksInfoObject {
        segmentStarts?: Array<number>;
    }
}

declare module './AxisType' {
    interface AxisTypeRegistry {
        OrdinalAxis: OrdinalAxis.Composition;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* eslint-disable valid-jsdoc */

/* *
 *
 *  Composition
 *
 * */

/**
 * Extends the axis with ordinal support.
 * @private
 */
namespace OrdinalAxis {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class Composition extends Axis {
        forceOrdinal?: boolean;
        isInternal?: boolean;
        ordinal: Additions;
        getTimeTicks(
            normalizedInterval: Time.TimeNormalizedObject,
            min: number,
            max: number,
            startOfWeek: number,
            positions?: Array<number>,
            closestDistance?: number,
            findHigherRanks?: boolean
        ): TickPositionsArray;
        index2val(val: number): number;
        lin2val(val: number): number;
        ordinal2lin: Composition['val2lin'];
        val2lin(val: number, toIndex?: boolean): number;
    }

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Extends the axis with ordinal support.
     *
     * @private
     *
     * @param AxisClass
     * Axis class to extend.
     *
     * @param ChartClass
     * Chart class to use.
     *
     * @param SeriesClass
     * Series class to use.
     */
    export function compose<T extends typeof Axis>(
        AxisClass: T,
        SeriesClass: typeof Series,
        ChartClass: typeof Chart
    ): (typeof Composition&T) {

        if (U.pushUnique(composedMembers, AxisClass)) {
            const axisProto = AxisClass.prototype as Composition;

            axisProto.getTimeTicks = getTimeTicks;
            axisProto.index2val = index2val;
            axisProto.lin2val = lin2val;
            axisProto.val2lin = val2lin;
            // Record this to prevent overwriting by broken-axis module (#5979)
            axisProto.ordinal2lin = axisProto.val2lin;

            addEvent(AxisClass, 'afterInit', onAxisAfterInit);
            addEvent(
                AxisClass as (T&typeof Composition),
                'foundExtremes',
                onAxisFoundExtremes
            );
            addEvent(AxisClass, 'afterSetScale', onAxisAfterSetScale);
            addEvent(
                AxisClass,
                'initialAxisTranslation',
                onAxisInitialAxisTranslation
            );
        }

        if (U.pushUnique(composedMembers, ChartClass)) {
            addEvent(ChartClass, 'pan', onChartPan);
        }
        if (U.pushUnique(composedMembers, SeriesClass)) {
            addEvent(SeriesClass, 'updatedData', onSeriesUpdatedData);
        }

        return AxisClass as (typeof Composition&T);
    }
    /**
     * In an ordinal axis, there might be areas with dense consentrations of
     * points, then large gaps between some. Creating equally distributed
     * ticks over this entire range may lead to a huge number of ticks that
     * will later be removed. So instead, break the positions up in
     * segments, find the tick positions for each segment then concatenize
     * them. This method is used from both data grouping logic and X axis
     * tick position logic.
     * @private
     */
    function getTimeTicks(
        this: Axis,
        normalizedInterval: Time.TimeNormalizedObject,
        min: number,
        max: number,
        startOfWeek?: number,
        positions: Array<number> = [],
        closestDistance: number = 0,
        findHigherRanks?: boolean
    ): TickPositionsArray {

        const higherRanks = {} as Record<string, string>,
            tickPixelIntervalOption = this.options.tickPixelInterval,
            time = this.chart.time,
            // Record all the start positions of a segment, to use when
            // deciding what's a gap in the data.
            segmentStarts = [];
        let end,
            segmentPositions,
            hasCrossedHigherRank,
            info,
            outsideMax,
            start = 0,
            groupPositions = [] as TickPositionsArray,
            lastGroupPosition = -Number.MAX_VALUE;

        // The positions are not always defined, for example for ordinal
        // positions when data has regular interval (#1557, #2090)
        if (
            (!this.options.ordinal && !this.options.breaks) ||
            !positions ||
            positions.length < 3 ||
            typeof min === 'undefined'
        ) {
            return time.getTimeTicks.apply(time, arguments as any);
        }

        // Analyze the positions array to split it into segments on gaps
        // larger than 5 times the closest distance. The closest distance is
        // already found at this point, so we reuse that instead of
        // computing it again.
        const posLength = positions.length;

        for (end = 0; end < posLength; end++) {

            outsideMax = end && positions[end - 1] > max;

            if (positions[end] < min) { // Set the last position before min
                start = end;
            }

            if (
                end === posLength - 1 ||
                positions[end + 1] - positions[end] > closestDistance * 5 ||
                outsideMax
            ) {

                // For each segment, calculate the tick positions from the
                // getTimeTicks utility function. The interval will be the
                // same regardless of how long the segment is.
                if (positions[end] > lastGroupPosition) { // #1475

                    segmentPositions = time.getTimeTicks(
                        normalizedInterval,
                        positions[start],
                        positions[end],
                        startOfWeek
                    );

                    // Prevent duplicate groups, for example for multiple
                    // segments within one larger time frame (#1475)
                    while (
                        segmentPositions.length &&
                        segmentPositions[0] <= lastGroupPosition
                    ) {
                        segmentPositions.shift();
                    }
                    if (segmentPositions.length) {
                        lastGroupPosition =
                            segmentPositions[segmentPositions.length - 1];
                    }

                    segmentStarts.push(groupPositions.length);
                    groupPositions = groupPositions.concat(
                        segmentPositions
                    ) as any;
                }
                // Set start of next segment
                start = end + 1;
            }

            if (outsideMax) {
                break;
            }
        }

        // Get the grouping info from the last of the segments. The info is
        // the same for all segments.
        if (segmentPositions) {
            info = (segmentPositions as any).info;

            // Optionally identify ticks with higher rank, for example
            // when the ticks have crossed midnight.
            if (findHigherRanks && info.unitRange <= timeUnits.hour) {
                end = groupPositions.length - 1;

                // Compare points two by two
                for (start = 1; start < end; start++) {
                    if (
                        time.dateFormat('%d', groupPositions[start]) !==
                        time.dateFormat('%d', groupPositions[start - 1])
                    ) {
                        higherRanks[groupPositions[start]] = 'day';
                        hasCrossedHigherRank = true;
                    }
                }

                // If the complete array has crossed midnight, we want
                // to mark the first positions also as higher rank
                if (hasCrossedHigherRank) {
                    higherRanks[groupPositions[0]] = 'day';
                }
                info.higherRanks = higherRanks;
            }

            // Save the info
            info.segmentStarts = segmentStarts;
            groupPositions.info = info;

        } else {
            error(12, false, this.chart);
        }
        // Don't show ticks within a gap in the ordinal axis, where the
        // space between two points is greater than a portion of the tick
        // pixel interval
        if (findHigherRanks && defined(tickPixelIntervalOption)) {

            const length = groupPositions.length,
                translatedArr = [],
                distances = [];
            let itemToRemove,
                translated,
                lastTranslated,
                medianDistance,
                distance,
                i = length;
            // Find median pixel distance in order to keep a reasonably even
            // distance between ticks (#748)
            while (i--) {
                translated = this.translate(groupPositions[i]);
                if (lastTranslated) {
                    distances[i] = lastTranslated - (translated as any);
                }
                translatedArr[i] = lastTranslated = translated;
            }
            distances.sort();
            medianDistance = distances[Math.floor(distances.length / 2)];
            if (medianDistance < (tickPixelIntervalOption as any) * 0.6) {
                medianDistance = null;
            }

            // Now loop over again and remove ticks where needed
            i = groupPositions[length - 1] > max ? length - 1 : length; // #817
            lastTranslated = void 0;
            while (i--) {
                translated = translatedArr[i];
                distance = Math.abs(
                    (lastTranslated as any) - (translated as any)
                );
                // #4175 - when axis is reversed, the distance, is negative but
                // tickPixelIntervalOption positive, so we need to compare the
                // same values

                // Remove ticks that are closer than 0.6 times the pixel
                // interval from the one to the right, but not if it is close to
                // the median distance (#748).
                if (
                    lastTranslated &&
                    distance < (tickPixelIntervalOption as any) * 0.8 &&
                    (medianDistance === null || distance < medianDistance * 0.8)
                ) {

                    // Is this a higher ranked position with a normal
                    // position to the right?
                    if (
                        higherRanks[groupPositions[i]] &&
                        !higherRanks[groupPositions[i + 1]]
                    ) {

                        // Yes: remove the lower ranked neighbour to the
                        // right
                        itemToRemove = i + 1;
                        lastTranslated = translated; // #709

                    } else {

                        // No: remove this one
                        itemToRemove = i;
                    }

                    groupPositions.splice(itemToRemove, 1);

                } else {
                    lastTranslated = translated;
                }
            }
        }
        return groupPositions;
    }

    /**
     * Get axis position of given index of the extended ordinal positions.
     * Used only when panning an ordinal axis.
     *
     * @private
     * @function Highcharts.Axis#index2val
     * @param {number} index
     * The index value of searched point
     */
    function index2val(this: Composition, index: number): number {
        const axis = this,
            ordinal = axis.ordinal,
            // Context could be changed to extendedOrdinalPositions.
            ordinalPositions = ordinal.positions;

        // The visible range contains only equally spaced values.
        if (!ordinalPositions) {
            return index;
        }

        let i = ordinalPositions.length - 1,
            distance;

        if (index < 0) { // out of range, in effect panning to the left
            index = ordinalPositions[0];
        } else if (index > i) { // out of range, panning to the right
            index = ordinalPositions[i];
        } else { // split it up
            i = Math.floor(index);
            distance = index - i; // the decimal
        }

        if (typeof distance !== 'undefined' &&
            typeof ordinalPositions[i] !== 'undefined') {
            return ordinalPositions[i] + (distance ?
                distance *
                    (ordinalPositions[i + 1] - ordinalPositions[i]) :
                0);
        }
        return index;
    }

    /**
     * Translate from linear (internal) to axis value.
     *
     * @private
     * @function Highcharts.Axis#lin2val
     * @param {number} val
     * The linear abstracted value.
     */
    function lin2val(this: Composition, val: number): number {
        const axis = this,
            ordinal = axis.ordinal,
            localMin = axis.old ? axis.old.min : axis.min,
            localA = axis.old ? axis.old.transA : axis.transA;
        let positions = ordinal.positions; // for the current visible range

        // The visible range contains only equally spaced values.
        if (!positions) {
            return val;
        }

        // Convert back from modivied value to pixels. // #15970
        const pixelVal = correctFloat((val - (localMin as any)) * localA +
                axis.minPixelPadding),
            isInside = val >= positions[0] &&
                val <= positions[positions.length - 1];

        // If the value is not inside the plot area, use the extended positions.
        // (array contains also points that are outside of the plotArea).
        if (!isInside) {
            // When iterating for the first time,
            // get the extended ordinal positional and assign them.
            if (!ordinal.extendedOrdinalPositions) {
                ordinal.extendedOrdinalPositions = (
                    ordinal.getExtendedPositions()
                );
            }
            positions = ordinal.extendedOrdinalPositions;
        }

        // In some cases (especially in early stages of the chart creation) the
        // getExtendedPositions might return undefined.
        if (positions && positions.length) {
            const indexOf = positions.indexOf(val);

            const index = indexOf !== -1 ? indexOf : correctFloat(
                    ordinal.getIndexOfPoint(pixelVal, positions)
                ),
                mantissa = correctFloat(index % 1);

            // Check if the index is inside position array. If true,
            // read/approximate value for that exact index.
            if (index >= 0 && index <= positions.length - 1) {
                const leftNeighbour = positions[Math.floor(index)],
                    rightNeighbour = positions[Math.ceil(index)],
                    distance = rightNeighbour - leftNeighbour;

                return positions[Math.floor(index)] + mantissa * distance;
            }

            // For cases when the index is not in the extended ordinal position
            // array, like when the value we are looking for exceed the
            // available data, approximate that value based on the calculated
            // slope.
            const positionsLength = positions.length,
                firstPositionsValue = positions[0],
                lastPositionsValue = positions[positionsLength - 1],
                slope = (
                    lastPositionsValue - firstPositionsValue
                ) / (positionsLength - 1);

            if (index < 0) {
                return firstPositionsValue + slope * index;
            }

            return lastPositionsValue + slope * (index - positionsLength);
        }
        return val;
    }

    /**
     * Internal function to calculate the precise index in ordinalPositions
     * array.
     * @private
     */
    function getIndexInArray(ordinalPositions: Array<number>, val: number): number {
        const index =
        Additions.findIndexOf(ordinalPositions, val, true);
        if (ordinalPositions[index] === val) {
            return index;
        }
        const percent =
            (val - ordinalPositions[index]) /
            (ordinalPositions[index + 1] - ordinalPositions[index]);
        return index + percent;
    }

    /**
    * @private
    */
    function onAxisAfterInit(this: Axis): void {
        const axis = this;

        if (!axis.ordinal) {
            axis.ordinal = new Additions(axis as Composition);
        }
    }

    /**
     * @private
     */
    function onAxisFoundExtremes(this: Composition): void {
        const axis = this as Composition;

        if (
            axis.isXAxis &&
            defined(axis.options.overscroll) &&
            axis.max === axis.dataMax &&
            (
                // Panning is an execption. We don't want to apply
                // overscroll when panning over the dataMax
                !axis.chart.mouseIsDown ||
                axis.isInternal
            ) && (
                // Scrollbar buttons are the other execption:
                !axis.eventArgs ||
                axis.eventArgs && axis.eventArgs.trigger !== 'navigator'
            )
        ) {
            (axis.max as any) += (axis.options.overscroll as any);

            // Live data and buttons require translation for the min:
            if (!axis.isInternal && defined(axis.userMin)) {
                (axis.min as any) += (axis.options.overscroll as any);
            }
        }
    }

    /**
     * For ordinal axis, that loads data async, redraw axis after data is
     * loaded. If we don't do that, axis will have the same extremes as
     * previously, but ordinal positions won't be calculated. See #10290
     * @private
     */
    function onAxisAfterSetScale(this: Axis): void {
        const axis = this;

        if (axis.horiz && !axis.isDirty) {
            axis.isDirty = axis.isOrdinal &&
                axis.chart.navigator &&
                !(axis.chart.navigator as any).adaptToUpdatedData;
        }
    }

    /**
     * @private
     */
    function onAxisInitialAxisTranslation(this: Axis): void {
        const axis = this;

        if (axis.ordinal) {
            axis.ordinal.beforeSetTickPositions();
            axis.tickInterval = axis.ordinal.postProcessTickInterval(
                axis.tickInterval
            );
        }
    }

    /**
     * Extending the Chart.pan method for ordinal axes
     * @private
     */
    function onChartPan(this: Chart, e: Event): void {
        const chart = this,
            xAxis = chart.xAxis[0] as Composition,
            overscroll = xAxis.options.overscroll,
            chartX = (e as any).originalEvent.chartX,
            panning = chart.options.chart.panning;
        let runBase = false;

        if (
            panning &&
            panning.type !== 'y' &&
            xAxis.options.ordinal &&
            xAxis.series.length
        ) {

            const mouseDownX = chart.mouseDownX,
                extremes = xAxis.getExtremes(),
                dataMax = extremes.dataMax,
                min = extremes.min,
                max = extremes.max,
                hoverPoints = chart.hoverPoints,
                closestPointRange = (
                    xAxis.closestPointRange ||
                    (xAxis.ordinal && xAxis.ordinal.overscrollPointsRange)
                ),
                pointPixelWidth = (
                    xAxis.translationSlope *
                    (xAxis.ordinal.slope || (closestPointRange as any))
                ),
                // how many ordinal units did we move?
                movedUnits = Math.round(
                    ((mouseDownX as any) - chartX) / pointPixelWidth),
                // get index of all the chart's points
                extendedOrdinalPositions = xAxis.ordinal.getExtendedPositions(),
                extendedAxis = {
                    ordinal: {
                        positions: extendedOrdinalPositions,
                        extendedOrdinalPositions: extendedOrdinalPositions
                    }
                },
                index2val = xAxis.index2val,
                val2lin = xAxis.val2lin;
            let trimmedRange,
                ordinalPositions,
                searchAxisLeft,
                searchAxisRight;

            // we have an ordinal axis, but the data is equally spaced
            if (!extendedAxis.ordinal.positions) {
                runBase = true;

            } else if (Math.abs(movedUnits) > 1) {

                // Remove active points for shared tooltip
                if (hoverPoints) {
                    hoverPoints.forEach(function (point: Point): void {
                        point.setState();
                    });
                }

                if (movedUnits < 0) {
                    searchAxisLeft = extendedAxis;
                    searchAxisRight = xAxis.ordinal.positions ?
                        xAxis : extendedAxis;
                } else {
                    searchAxisLeft = xAxis.ordinal.positions ?
                        xAxis : extendedAxis;
                    searchAxisRight = extendedAxis;
                }

                // In grouped data series, the last ordinal position represents
                // the grouped data, which is to the left of the real data max.
                // If we don't compensate for this, we will be allowed to pan
                // grouped data series passed the right of the plot area.
                ordinalPositions = searchAxisRight.ordinal.positions;
                if (dataMax >
                    (ordinalPositions as any)[
                        (ordinalPositions as any).length - 1
                    ]
                ) {
                    (ordinalPositions as any).push(dataMax);
                }

                // Get the new min and max values by getting the ordinal index
                // for the current extreme, then add the moved units and
                // translate back to values. This happens on the extended
                // ordinal positions if the new position is out of range, else
                // it happens on the current x axis which is smaller and faster.
                chart.fixedRange = max - min;

                trimmedRange = (xAxis as NavigatorAxisComposition).navigatorAxis
                    .toFixedRange(
                        void 0,
                        void 0,
                        index2val.apply(searchAxisLeft, [
                            val2lin.apply(searchAxisLeft, [min, true]) +
                            movedUnits
                        ]),
                        index2val.apply(searchAxisRight, [
                            val2lin.apply(searchAxisRight, [max, true]) +
                            movedUnits
                        ])
                    );

                // Apply it if it is within the available data range
                if (
                    trimmedRange.min >= Math.min(extremes.dataMin, min) &&
                    trimmedRange.max <= Math.max(dataMax, max) +
                        (overscroll as any)
                ) {
                    xAxis.setExtremes(
                        trimmedRange.min,
                        trimmedRange.max,
                        true,
                        false,
                        { trigger: 'pan' }
                    );
                }

                chart.mouseDownX = chartX; // set new reference for next run
                css(chart.container, { cursor: 'move' });
            }

        } else {
            runBase = true;
        }

        // revert to the linear chart.pan version
        if (runBase || (panning && /y/.test(panning.type))) {
            if (overscroll) {
                xAxis.max = (xAxis.dataMax as any) + overscroll;
            }
        } else {
            e.preventDefault();
        }
    }
    /**
     * @private
     */
    function onSeriesUpdatedData(this: Series): void {
        const xAxis = this.xAxis as Composition;
        // Destroy the extended ordinal index on updated data
        // and destroy extendedOrdinalPositions, #16055.
        if (xAxis && xAxis.options.ordinal) {
            delete xAxis.ordinal.index;
            delete xAxis.ordinal.extendedOrdinalPositions;
        }
    }

    /**
     * Translate from a linear axis value to the corresponding ordinal axis
     * position. If there are no gaps in the ordinal axis this will be the
     * same. The translated value is the value that the point would have if
     * the axis was linear, using the same min and max.
     *
     * @private
     * @function Highcharts.Axis#val2lin
     * @param {number} val
     * The axis value.
     * @param {boolean} [toIndex]
     * Whether to return the index in the ordinalPositions or the new value.
     */
    function val2lin(
        this: Composition,
        val: number,
        toIndex?: boolean
    ): number {
        const axis = this,
            ordinal = axis.ordinal,
            ordinalPositions = ordinal.positions;
        let slope = ordinal.slope,
            extendedOrdinalPositions = ordinal.extendedOrdinalPositions;

        if (!ordinalPositions) {
            return val;
        }

        const ordinalLength = ordinalPositions.length;
        let ordinalIndex;
        // If the searched value is inside visible plotArea, ivastigate the
        // value basing on ordinalPositions.
        if (
            ordinalPositions[0] <= val &&
            ordinalPositions[ordinalLength - 1] >= val
        ) {
            ordinalIndex = getIndexInArray(ordinalPositions, val);
            // final return value is based on ordinalIndex
        } else {

            if (!extendedOrdinalPositions) {
                extendedOrdinalPositions =
                    ordinal.getExtendedPositions &&
                    ordinal.getExtendedPositions();
                ordinal.extendedOrdinalPositions = extendedOrdinalPositions;
            }
            if (!(
                extendedOrdinalPositions && extendedOrdinalPositions.length
            )) {

                return val;
            }

            const length = extendedOrdinalPositions.length;

            if (!slope) {
                slope =
                    (extendedOrdinalPositions[length - 1] -
                        extendedOrdinalPositions[0]) /
                    length;
            }
            // OriginalPointReference is equal to the index of
            // first point of ordinalPositions in extendedOrdinalPositions.

            const originalPositionsReference = getIndexInArray(
                extendedOrdinalPositions,
                ordinalPositions[0]
            );

            // If the searched value is outside the visiblePlotArea,
            // check if it is inside extendedOrdinalPositions.
            if (
                val >= extendedOrdinalPositions[0] &&
                val <=
                    extendedOrdinalPositions[
                        length - 1
                    ]
            ) {
                // Return Value
                ordinalIndex = getIndexInArray(extendedOrdinalPositions, val) -
                    originalPositionsReference;
            } else {
                // Since ordinal.slope is the average distance between 2
                // points on visible plotArea, this can be used to calculete
                // the approximate position of the point, which is outside
                // the extededOrdinalPositions.
                if (val < extendedOrdinalPositions[0]) {
                    const diff = extendedOrdinalPositions[0] - val,
                        approximateIndexOffset = diff / slope;
                    ordinalIndex =
                        -originalPositionsReference -
                        approximateIndexOffset;
                } else {
                    const diff =
                            val -
                            extendedOrdinalPositions[
                                length - 1
                            ],
                        approximateIndexOffset = diff / slope;
                    ordinalIndex =
                        approximateIndexOffset +
                        length -
                        originalPositionsReference;
                }
            }
        }

        return toIndex ? ordinalIndex : (slope as any) * (ordinalIndex || 0) +
                    (ordinal.offset as any);
    }

    /* *
     *
     *  Classes
     *
     * */

    /**
     * @private
     */
    export class Additions {

        /* *
         *
         *  Constructors
         *
         * */

        /**
         * @private
         */
        public constructor(axis: Composition) {
            this.axis = axis;
        }

        /* *
         *
         *  Properties
         *
         * */

        public axis: Composition;
        public extendedOrdinalPositions?: Array<number>;
        public groupIntervalFactor?: number;
        public index?: Record<string, Array<number>> = {};
        public offset?: number;
        public overscrollPointsRange?: number;
        public positions?: Array<number>;
        public slope?: number;

        /* *
        *
        *  Functions
        *
        * */

        /**
         * Calculate the ordinal positions before tick positions are calculated.
         * @private
         */
        public beforeSetTickPositions(): void {
            const axis = this.axis,
                ordinal = axis.ordinal,
                extremes = axis.getExtremes(),
                min = extremes.min,
                max = extremes.max,
                hasBreaks = axis.isXAxis && !!axis.options.breaks,
                isOrdinal = axis.options.ordinal,
                ignoreHiddenSeries =
                    axis.chart.options.chart.ignoreHiddenSeries;
            let len,
                uniqueOrdinalPositions,
                dist,
                minIndex,
                maxIndex,
                slope,
                i,
                ordinalPositions = [] as Array<number>,
                overscrollPointsRange = Number.MAX_VALUE,
                useOrdinal = false,
                adjustOrdinalExtremesPoints = false,
                isBoosted = false;

            // Apply the ordinal logic
            if (isOrdinal || hasBreaks) { // #4167 YAxis is never ordinal ?
                let distanceBetweenPoint = 0;

                axis.series.forEach(function (series, i): void {
                    uniqueOrdinalPositions = [];

                    // For an axis with multiple series, check if the distance
                    // between points is identical throughout all series.
                    if (
                        i > 0 &&
                        series.options.id !== 'highcharts-navigator-series' &&
                        series.processedXData.length > 1
                    ) {
                        adjustOrdinalExtremesPoints =
                            distanceBetweenPoint !== series.processedXData[1] -
                                series.processedXData[0];
                    }
                    distanceBetweenPoint =
                        series.processedXData[1] - series.processedXData[0];

                    if (series.boosted) {
                        isBoosted = series.boosted;
                    }

                    if (
                        (!ignoreHiddenSeries || series.visible !== false) &&
                        (
                            (series as ScatterSeries)
                                .takeOrdinalPosition !== false ||
                            hasBreaks
                        )
                    ) {

                        // concatenate the processed X data into the existing
                        // positions, or the empty array
                        ordinalPositions = ordinalPositions.concat(
                            series.processedXData as any
                        );

                        len = ordinalPositions.length;

                        // remove duplicates (#1588)
                        ordinalPositions.sort(function (
                            a: number,
                            b: number
                        ): number {
                            // without a custom function it is sorted as strings
                            return a - b;
                        });

                        overscrollPointsRange = Math.min(
                            overscrollPointsRange,
                            pick(
                                // Check for a single-point series:
                                series.closestPointRange,
                                overscrollPointsRange
                            )
                        );

                        if (len) {

                            i = 0;
                            while (i < len - 1) {
                                if (
                                    ordinalPositions[i] !==
                                    ordinalPositions[i + 1]
                                ) {
                                    uniqueOrdinalPositions.push(
                                        ordinalPositions[i + 1]
                                    );
                                }
                                i++;
                            }

                            // Check first item:
                            if (
                                uniqueOrdinalPositions[0] !==
                                ordinalPositions[0]
                            ) {
                                uniqueOrdinalPositions.unshift(
                                    ordinalPositions[0]
                                );
                            }

                            ordinalPositions = uniqueOrdinalPositions;
                        }
                    }
                });

                // If the distance between points is not identical throughout
                // all series, remove the first and last ordinal position to
                // avoid enabling ordinal logic when it is not needed, #17405.
                // Only for boosted series because changes are negligible.
                if (adjustOrdinalExtremesPoints && isBoosted) {
                    ordinalPositions.pop();
                    ordinalPositions.shift();
                }

                // cache the length
                len = ordinalPositions.length;

                // Check if we really need the overhead of mapping axis data
                // against the ordinal positions. If the series consist of
                // evenly spaced data any way, we don't need any ordinal logic.
                if (len > 2) { // two points have equal distance by default
                    dist = ordinalPositions[1] - ordinalPositions[0];
                    i = len - 1;
                    while (i-- && !useOrdinal) {
                        if (
                            ordinalPositions[i + 1] - ordinalPositions[i] !==
                            dist
                        ) {
                            useOrdinal = true;
                        }
                    }

                    // When zooming in on a week, prevent axis padding for
                    // weekends even though the data within the week is evenly
                    // spaced.
                    if (
                        !axis.options.keepOrdinalPadding &&
                        (
                            ordinalPositions[0] - min > dist ||
                            (
                                max -
                                ordinalPositions[ordinalPositions.length - 1]
                            ) > dist
                        )
                    ) {
                        useOrdinal = true;
                    }
                } else if (axis.options.overscroll) {
                    if (len === 2) {
                        // Exactly two points, distance for overscroll is fixed:
                        overscrollPointsRange =
                            ordinalPositions[1] - ordinalPositions[0];
                    } else if (len === 1) {
                        // We have just one point, closest distance is unknown.
                        // Assume then it is last point and overscrolled range:
                        overscrollPointsRange = axis.options.overscroll;
                        ordinalPositions = [
                            ordinalPositions[0],
                            ordinalPositions[0] + overscrollPointsRange
                        ];
                    } else {
                        // In case of zooming in on overscrolled range, stick to
                        // the old range:
                        overscrollPointsRange = (
                            ordinal.overscrollPointsRange as any
                        );
                    }
                }

                // Record the slope and offset to compute the linear values from
                // the array index. Since the ordinal positions may exceed the
                // current range, get the start and end positions within it
                // (#719, #665b)
                if (useOrdinal || axis.forceOrdinal) {

                    if (axis.options.overscroll) {
                        ordinal.overscrollPointsRange = overscrollPointsRange;
                        ordinalPositions = ordinalPositions.concat(
                            ordinal.getOverscrollPositions()
                        );
                    }

                    // Register
                    ordinal.positions = ordinalPositions;

                    // This relies on the ordinalPositions being set. Use
                    // Math.max and Math.min to prevent padding on either sides
                    // of the data.
                    minIndex = axis.ordinal2lin( // #5979
                        Math.max(
                            min,
                            ordinalPositions[0]
                        ),
                        true
                    );
                    maxIndex = Math.max(axis.ordinal2lin(
                        Math.min(
                            max,
                            ordinalPositions[ordinalPositions.length - 1]
                        ),
                        true
                    ), 1); // #3339

                    // Set the slope and offset of the values compared to the
                    // indices in the ordinal positions
                    ordinal.slope = slope = (max - min) / (maxIndex - minIndex);
                    ordinal.offset = min - (minIndex * slope);

                } else {
                    ordinal.overscrollPointsRange = pick(
                        axis.closestPointRange,
                        ordinal.overscrollPointsRange
                    );
                    ordinal.positions = axis.ordinal.slope = ordinal.offset =
                        void 0;
                }
            }

            axis.isOrdinal = isOrdinal && useOrdinal; // #3818, #4196, #4926
            ordinal.groupIntervalFactor = null as any; // reset for next run
        }

        /**
         * Faster way of using the Array.indexOf method.
         * Works for sorted arrays only with unique values.
         *
         * @param {Array} sortedArray
         *        The sorted array inside which we are looking for.
         * @param {number} key
         *        The key to being found.
         * @param {boolean} indirectSearch
         *        In case of lack of the point in the array, should return
         *        value be equal to -1 or the closest smaller index.
         *  @private
         */
        public static findIndexOf(
            sortedArray: Array<number>,
            key: number,
            indirectSearch?: boolean
        ): number {
            let start = 0,
                end = sortedArray.length - 1,
                middle;

            while (start < end) {
                middle = Math.ceil((start + end) / 2);

                // Key found as the middle element.
                if (sortedArray[middle] <= key) {
                    // Continue searching to the right.
                    start = middle;
                } else {
                    // Continue searching to the left.
                    end = middle - 1;
                }
            }
            if (sortedArray[start] === key) {
                return start;
            }
            // Key could not be found.
            return !indirectSearch ? -1 : start;
        }

        /**
         * Get the ordinal positions for the entire data set. This is necessary
         * in chart panning because we need to find out what points or data
         * groups are available outside the visible range. When a panning
         * operation starts, if an index for the given grouping does not exists,
         * it is created and cached. This index is deleted on updated data, so
         * it will be regenerated the next time a panning operation starts.
         * @private
         */
        public getExtendedPositions(): Array<number> {
            const ordinal = this,
                axis = ordinal.axis,
                axisProto = axis.constructor.prototype,
                chart = axis.chart,
                grouping = axis.series[0].currentDataGrouping,
                key = grouping ?
                    grouping.count + (grouping.unitName as any) :
                    'raw',
                overscroll = axis.options.overscroll,
                extremes = axis.getExtremes();
            let fakeAxis: Composition,
                fakeSeries: Series = void 0 as any,
                ordinalIndex = ordinal.index;

            // If this is the first time, or the ordinal index is deleted by
            // updatedData,
            // create it.
            if (!ordinalIndex) {
                ordinalIndex = ordinal.index = {};
            }


            if (!ordinalIndex[key]) {

                // Create a fake axis object where the extended ordinal
                // positions are emulated
                fakeAxis = {
                    series: [],
                    chart: chart,
                    forceOrdinal: false,
                    getExtremes: function (): Axis.ExtremesObject {
                        return {
                            min: extremes.dataMin,
                            max: extremes.dataMax + (overscroll as any)
                        } as any;
                    },
                    getGroupPixelWidth: axisProto.getGroupPixelWidth,
                    getTimeTicks: axisProto.getTimeTicks,
                    options: {
                        ordinal: true
                    },
                    ordinal: {
                        getGroupIntervalFactor: this.getGroupIntervalFactor
                    },
                    ordinal2lin: axisProto.ordinal2lin, // #6276
                    getIndexOfPoint: axisProto.getIndexOfPoint,
                    val2lin: axisProto.val2lin // #2590
                } as any;
                fakeAxis.ordinal.axis = fakeAxis;

                // Add the fake series to hold the full data, then apply
                // processData to it
                axis.series.forEach(function (series): void {
                    fakeSeries = {
                        xAxis: fakeAxis,
                        xData: (series.xData as any).slice(),
                        chart: chart,
                        destroyGroupedData: H.noop,
                        getProcessedData: Series.prototype.getProcessedData,
                        applyGrouping: Series.prototype.applyGrouping
                    } as any;

                    fakeSeries.xData = (fakeSeries.xData as any).concat(
                        ordinal.getOverscrollPositions()
                    );

                    fakeSeries.options = {
                        dataGrouping: grouping ? {
                            firstAnchor: 'firstPoint',
                            anchor: 'middle',
                            lastAnchor: 'lastPoint',
                            enabled: true,
                            forced: true,
                            // doesn't matter which, use the fastest
                            approximation: 'open',
                            units: [[
                                (grouping as any).unitName,
                                [grouping.count]
                            ]]
                        } : {
                            enabled: false
                        }
                    };
                    fakeAxis.series.push(fakeSeries);

                    series.processData.apply(fakeSeries);
                });

                // Force to use the ordinal when points are evenly spaced (e.g.
                // weeks), #3825.
                if (
                    (
                        fakeSeries.closestPointRange !==
                        fakeSeries.basePointRange
                    ) &&
                    fakeSeries.currentDataGrouping
                ) {
                    fakeAxis.forceOrdinal = true;
                }

                // Run beforeSetTickPositions to compute the ordinalPositions
                axis.ordinal.beforeSetTickPositions.apply({ axis: fakeAxis });

                // Cache it
                ordinalIndex[key] = fakeAxis.ordinal.positions as any;
            }
            return ordinalIndex[key];
        }

        /**
         * Find the factor to estimate how wide the plot area would have been if
         * ordinal gaps were included. This value is used to compute an imagined
         * plot width in order to establish the data grouping interval.
         *
         * A real world case is the intraday-candlestick example. Without this
         * logic, it would show the correct data grouping when viewing a range
         * within each day, but once moving the range to include the gap between
         * two days, the interval would include the cut-away night hours and the
         * data grouping would be wrong. So the below method tries to compensate
         * by identifying the most common point interval, in this case days.
         *
         * An opposite case is presented in issue #718. We have a long array of
         * daily data, then one point is appended one hour after the last point.
         * We expect the data grouping not to change.
         *
         * In the future, if we find cases where this estimation doesn't work
         * optimally, we might need to add a second pass to the data grouping
         * logic, where we do another run with a greater interval if the number
         * of data groups is more than a certain fraction of the desired group
         * count.
         * @private
         */
        public getGroupIntervalFactor(
            xMin: number,
            xMax: number,
            series: Series
        ): number {
            const ordinal = this,
                axis = ordinal.axis,
                processedXData = series.processedXData,
                len = (processedXData as any).length,
                distances = [];
            let median,
                i,
                groupIntervalFactor = ordinal.groupIntervalFactor;


            // Only do this computation for the first series, let the other
            // inherit it (#2416)
            if (!groupIntervalFactor) {

                // Register all the distances in an array
                for (i = 0; i < len - 1; i++) {
                    distances[i] = (
                        (processedXData as any)[i + 1] -
                        (processedXData as any)[i]
                    );
                }

                // Sort them and find the median
                distances.sort(function (a: number, b: number): number {
                    return a - b;
                });
                median = distances[Math.floor(len / 2)];

                // Compensate for series that don't extend through the entire
                // axis extent. #1675.
                xMin = Math.max(xMin, (processedXData as any)[0]);
                xMax = Math.min(xMax, (processedXData as any)[len - 1]);

                ordinal.groupIntervalFactor = groupIntervalFactor =
                    (len * median) / (xMax - xMin);
            }

            // Return the factor needed for data grouping
            return groupIntervalFactor;
        }

        /**
         * Get index of point inside the ordinal positions array.
         *
         * @private
         * @param {number} val
         * The pixel value of a point.
         *
         * @param {Array<number>} [ordinallArray]
         * An array of all points available on the axis for the given data set.
         * Either ordinalPositions if the value is inside the plotArea or
         * extendedOrdinalPositions if not.
         */
        public getIndexOfPoint(
            val: number,
            ordinalArray: Array<number>
        ): number {
            const ordinal = this,
                axis = ordinal.axis,
                firstPointVal = ordinal.positions ? ordinal.positions[0] : 0;

            // Check whether the series has at least one point inside the chart
            const hasPointsInside = function (series: Series): boolean {
                return series.points.some((point): boolean => !!point.isInside);
            };

            let firstPointX: number;

            // When more series assign to axis, find the smallest one, #15987.
            axis.series.forEach((series): void => {
                const firstPoint = series.points?.[0];

                if (
                    defined(firstPoint?.plotX) &&
                    (
                        firstPoint.plotX < firstPointX ||
                        !defined(firstPointX)
                    ) &&
                    hasPointsInside(series)
                ) {
                    firstPointX = firstPoint.plotX;
                }
            });

            // If undefined, give a default value
            firstPointX ??= axis.minPixelPadding;

            // Distance in pixels between two points on the ordinal axis in the
            // current zoom.
            const ordinalPointPixelInterval = axis.translationSlope * (
                    ordinal.slope ||
                    axis.closestPointRange ||
                    ordinal.overscrollPointsRange as number
                ),
                // toValue for the first point.
                shiftIndex = correctFloat(
                    (val - firstPointX) / ordinalPointPixelInterval);

            return Additions.findIndexOf(
                ordinalArray,
                firstPointVal,
                true
            ) + shiftIndex;
        }

        /**
         * Get ticks for an ordinal axis within a range where points don't
         * exist. It is required when overscroll is enabled. We can't base on
         * points, because we may not have any, so we use approximated
         * pointRange and generate these ticks between Axis.dataMax,
         * Axis.dataMax + Axis.overscroll evenly spaced. Used in panning and
         * navigator scrolling.
         * @private
         */
        public getOverscrollPositions(): Array<number> {
            const ordinal = this,
                axis = ordinal.axis,
                extraRange = axis.options.overscroll,
                distance = ordinal.overscrollPointsRange,
                positions = [];

            let max = axis.dataMax;

            if (defined(distance)) {
                // Max + pointRange because we need to scroll to the last

                while (
                    (max as any) <= (axis.dataMax as any) + (extraRange as any)
                ) {
                    (max as any) += (distance as any);
                    positions.push(max);
                }

            }

            return positions as any;
        }
        /**
         * Make the tick intervals closer because the ordinal gaps make the
         * ticks spread out or cluster.
         * @private
         */
        public postProcessTickInterval(tickInterval: number): number {
            // Problem: https://jsfiddle.net/highcharts/FQm4E/1/. This is a case
            // where this algorithm doesn't work optimally. In this case, the
            // tick labels are spread out per week, but all the gaps reside
            // within weeks. So we have a situation where the labels are courser
            // than the ordinal gaps, and thus the tick interval should not be
            // altered.
            const ordinal = this,
                axis = ordinal.axis,
                ordinalSlope = ordinal.slope;
            let ret;


            if (ordinalSlope) {
                if (!axis.options.breaks) {
                    ret = (
                        tickInterval /
                        (ordinalSlope / axis.closestPointRange)
                    );
                } else {
                    ret = axis.closestPointRange || tickInterval; // #7275
                }
            } else {
                ret = tickInterval;
            }
            return ret;
        }

    }

}

/* *
 *
 *  Default Export
 *
 * */

export default OrdinalAxis;
