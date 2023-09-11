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

import type Axis from '../../Core/Axis/Axis';
import type AxisType from '../../Core/Axis/AxisType';
import type DataGroupingOptions from './DataGroupingOptions';

import DataGroupingDefaults from './DataGroupingDefaults.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { extend, merge } = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Axis/AxisLike' {
    interface AxisLike {
        applyGrouping(e: PostProcessDataEvent): void;
        getGroupPixelWidth(): number;
        setDataGrouping(
            dataGrouping?: (boolean|DataGroupingOptions),
            redraw?: boolean
        ): void;
    }
}

export interface PostProcessDataEvent {
    hasExtremesChanged?: boolean;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<Function> = [];

/* *
 *
 *  Variables
 *
 * */

let AxisConstructor: typeof Axis;

/* *
 *
 *  Functions
 *
 * */

/**
 * Check the groupPixelWidth and apply the grouping if needed.
 * Fired only after processing the data.
 *
 * @product highstock
 *
 * @function Highcharts.Axis#applyGrouping
 */
function applyGrouping(
    this: Axis,
    e: PostProcessDataEvent
): void {
    const axis = this,
        series = axis.series;

    // Reset the groupPixelWidth for all series, #17141.
    series.forEach(function (series): void {
        series.groupPixelWidth = void 0; // #2110
    });

    series.forEach(function (series): void {
        series.groupPixelWidth = (
            axis.getGroupPixelWidth &&
            axis.getGroupPixelWidth()
        );

        if (series.groupPixelWidth) {
            series.hasProcessed = true; // #2692
        }
        // Fire independing on series.groupPixelWidth to always set a proper
        // dataGrouping state, (#16238)
        series.applyGrouping(!!e.hasExtremesChanged);
    });
}

/**
 * @private
 */
function compose(
    AxisClass: typeof Axis
): void {
    AxisConstructor = AxisClass;

    if (pushUnique(composedMembers, AxisClass)) {
        addEvent(AxisClass, 'afterSetScale', onAfterSetScale);
        // When all series are processed, calculate the group pixel width and
        // then if this value is different than zero apply groupings.
        addEvent(AxisClass, 'postProcessData', applyGrouping);

        extend(AxisClass.prototype, {
            applyGrouping,
            getGroupPixelWidth,
            setDataGrouping
        });
    }

}

/**
 * Get the data grouping pixel width based on the greatest defined individual
 * width of the axis' series, and if whether one of the axes need grouping.
 * @private
 */
function getGroupPixelWidth(
    this: Axis
): number {
    const series = this.series;

    let i = series.length,
        groupPixelWidth = 0,
        doGrouping = false,
        dataLength,
        dgOptions;

    // If one of the series needs grouping, apply it to all (#1634)
    while (i--) {
        dgOptions = series[i].options.dataGrouping;

        if (dgOptions) { // #2692

            // If multiple series are compared on the same x axis, give them the
            // same group pixel width (#334)
            groupPixelWidth = Math.max(
                groupPixelWidth,
                // Fallback to commonOptions (#9693)
                pick(
                    dgOptions.groupPixelWidth,
                    DataGroupingDefaults.common.groupPixelWidth
                )
            );

            dataLength = (series[i].processedXData || series[i].data).length;

            // Execute grouping if the amount of points is greater than the
            // limit defined in groupPixelWidth
            if (
                series[i].groupPixelWidth ||
                (
                    dataLength >
                    ((this.chart.plotSizeX as any) / groupPixelWidth)
                ) ||
                (dataLength && dgOptions.forced)
            ) {
                doGrouping = true;
            }
        }
    }

    return doGrouping ? groupPixelWidth : 0;
}


/**
 * When resetting the scale reset the hasProccessed flag to avoid taking
 * previous data grouping of neighbour series into accound when determining
 * group pixel width (#2692).
 * @private
 */
function onAfterSetScale(
    this: Axis
): void {
    this.series.forEach(function (series): void {
        series.hasProcessed = false;
    });
}

/**
 * Highcharts Stock only. Force data grouping on all the axis' series.
 *
 * @product highstock
 *
 * @function Highcharts.Axis#setDataGrouping
 *
 * @param {boolean|Highcharts.DataGroupingOptionsObject} [dataGrouping]
 *        A `dataGrouping` configuration. Use `false` to disable data grouping
 *        dynamically.
 *
 * @param {boolean} [redraw=true]
 *        Whether to redraw the chart or wait for a later call to
 *        {@link Chart#redraw}.
 */
function setDataGrouping(
    this: Axis,
    dataGrouping?: (boolean|DataGroupingOptions),
    redraw?: boolean
): void {
    const axis = this as AxisType;

    let i;

    redraw = pick(redraw, true);

    if (!dataGrouping) {
        dataGrouping = {
            forced: false,
            units: null as any
        } as DataGroupingOptions;
    }

    // Axis is instantiated, update all series
    if (this instanceof AxisConstructor) {
        i = this.series.length;
        while (i--) {
            this.series[i].update({
                dataGrouping: dataGrouping as any
            }, false);
        }

    // Axis not yet instanciated, alter series options
    } else {
        (this as any).chart.options.series.forEach(function (
            seriesOptions: any
        ): void {
            // Merging dataGrouping options with already defined options #16759
            seriesOptions.dataGrouping = typeof dataGrouping === 'boolean' ?
                dataGrouping :
                merge(dataGrouping, seriesOptions.dataGrouping);
        });
    }

    // Clear ordinal slope, so we won't accidentaly use the old one (#7827)
    if (axis.ordinal) {
        axis.ordinal.slope = void 0;
    }

    if (redraw) {
        this.chart.redraw();
    }
}

/* *
 *
 *  Default Export
 *
 * */

const DataGroupingAxisComposition = {
    compose
};

export default DataGroupingAxisComposition;
