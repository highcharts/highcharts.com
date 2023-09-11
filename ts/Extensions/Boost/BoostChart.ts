/* *
 *
 *  Copyright (c) 2019-2021 Highsoft AS
 *
 *  Boost module: stripped-down renderer for higher performance
 *
 *  License: highcharts.com/license
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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type { BoostSeriesComposition } from './BoostSeries';
import type {
    BoostTargetAdditions,
    BoostTargetObject
} from './BoostTargetObject';
import type Chart from '../../Core/Chart/Chart';
import type Series from '../../Core/Series/Series';
import type SeriesOptions from '../../Core/Series/SeriesOptions';

import BoostableMap from './BoostableMap.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface BoostChartAdditions extends BoostTargetAdditions {
    forceChartBoost?: boolean;
    markerGroup?: Series['markerGroup'];
}

export declare class BoostChartComposition extends Chart {
    boosted?: boolean;
    boost: BoostChartAdditions;
    series: Array<BoostSeriesComposition>;
}

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike extends BoostTargetObject {
        boosted?: boolean;
        boost?: BoostChartAdditions;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedClasses: Array<Function> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose<T extends typeof Chart>(
    ChartClass: T,
    wglMode?: boolean
): T {

    if (wglMode && pushUnique(composedClasses, ChartClass)) {
        ChartClass.prototype.callbacks.push(onChartCallback);
    }

    return ChartClass;
}

/**
 * Get the clip rectangle for a target, either a series or the chart.
 * For the chart, we need to consider the maximum extent of its Y axes,
 * in case of Highcharts Stock panes and navigator.
 *
 * @private
 * @function Highcharts.Chart#getBoostClipRect
 */
function getBoostClipRect(
    chart: Chart,
    target: BoostTargetObject
): BBoxObject {
    let clipBox = {
        x: chart.plotLeft,
        y: chart.plotTop,
        width: chart.plotWidth,
        height: chart.plotHeight
    };

    // Clipping of individal series (#11906, #19039).
    if ((target as Series).getClipBox) {
        const { xAxis, yAxis } = target as Series;
        clipBox = (target as Series).getClipBox();
        if (chart.inverted) {
            const lateral = clipBox.width;
            clipBox.width = clipBox.height;
            clipBox.height = lateral;
            clipBox.x = yAxis.pos;
            clipBox.y = xAxis.pos;
        } else {
            clipBox.x = xAxis.pos;
            clipBox.y = yAxis.pos;
        }
    }

    if (target === chart) {
        const verticalAxes =
            chart.inverted ? chart.xAxis : chart.yAxis; // #14444

        if (verticalAxes.length <= 1) {
            clipBox.y = Math.min(verticalAxes[0].pos, clipBox.y);
            clipBox.height = (
                verticalAxes[0].pos -
                chart.plotTop +
                verticalAxes[0].len
            );
        } else {
            clipBox.height = chart.plotHeight;
        }
    }

    return clipBox;
}

/**
 * Returns true if the chart is in series boost mode.
 * @private
 * @param {Highcharts.Chart} chart
 * Chart to check.
 * @return {boolean}
 * `true` if the chart is in series boost mode.
 */
function isChartSeriesBoosting(
    chart: Chart
): chart is BoostChartComposition {
    const allSeries = chart.series,
        boost = chart.boost = chart.boost || {},
        boostOptions = chart.options.boost || {},
        threshold = pick(boostOptions.seriesThreshold, 50);

    if (allSeries.length >= threshold) {
        return true;
    }

    if (allSeries.length === 1) {
        return false;
    }

    let allowBoostForce = boostOptions.allowForce;

    if (typeof allowBoostForce === 'undefined') {
        allowBoostForce = true;
        for (const axis of chart.xAxis) {
            if (
                pick(axis.min, -Infinity) > pick(axis.dataMin, -Infinity) ||
                pick(axis.max, Infinity) < pick(axis.dataMax, Infinity)
            ) {
                allowBoostForce = false;
                break;
            }
        }
    }

    if (typeof boost.forceChartBoost !== 'undefined') {
        if (allowBoostForce) {
            return boost.forceChartBoost;
        }
        boost.forceChartBoost = void 0;
    }

    // If there are more than five series currently boosting,
    // we should boost the whole chart to avoid running out of webgl contexts.
    let canBoostCount = 0,
        needBoostCount = 0,
        seriesOptions: SeriesOptions;

    for (const series of allSeries) {
        seriesOptions = series.options;

        // Don't count series with boostThreshold set to 0
        // See #8950
        // Also don't count if the series is hidden.
        // See #9046
        if (
            seriesOptions.boostThreshold === 0 ||
            series.visible === false
        ) {
            continue;
        }

        // Don't count heatmap series as they are handled differently.
        // In the future we should make the heatmap/treemap path compatible
        // with forcing. See #9636.
        if (series.type === 'heatmap') {
            continue;
        }

        if (BoostableMap[series.type]) {
            ++canBoostCount;
        }

        if (patientMax(
            series.processedXData,
            seriesOptions.data as any,
            // series.xData,
            series.points
        ) >= (seriesOptions.boostThreshold || Number.MAX_VALUE)) {
            ++needBoostCount;
        }
    }

    boost.forceChartBoost = allowBoostForce && (
        (
            // Even when the series that need a boost are less than or equal
            // to 5, force a chart boost when all series are to be boosted.
            // See #18815
            canBoostCount === allSeries.length &&
            needBoostCount === canBoostCount
        ) ||
        needBoostCount > 5
    );

    return boost.forceChartBoost;
}

/**
 * Take care of the canvas blitting
 * @private
 */
function onChartCallback(
    chart: Chart
): void {

    /**
     * Convert chart-level canvas to image.
     * @private
     */
    function canvasToSVG(): void {
        if (
            chart.boost &&
            chart.boost.wgl &&
            isChartSeriesBoosting(chart)
        ) {
            chart.boost.wgl.render(chart);
        }
    }

    /**
     * Clear chart-level canvas.
     * @private
     */
    function preRender(): void {

        // Reset force state
        chart.boost = chart.boost || {};
        chart.boost.forceChartBoost = void 0;
        chart.boosted = false;

        // Clear the canvas
        if (chart.boost.clear) {
            chart.boost.clear();
        }

        if (
            chart.boost.canvas &&
            chart.boost.wgl &&
            isChartSeriesBoosting(chart)
        ) {
            // Allocate
            chart.boost.wgl.allocateBuffer(chart);
        }

        // see #6518 + #6739
        if (
            chart.boost.markerGroup &&
            chart.xAxis &&
            chart.xAxis.length > 0 &&
            chart.yAxis &&
            chart.yAxis.length > 0
        ) {
            chart.boost.markerGroup.translate(
                chart.xAxis[0].pos,
                chart.yAxis[0].pos
            );
        }
    }

    addEvent(chart, 'predraw', preRender);
    addEvent(chart, 'render', canvasToSVG);

    // addEvent(chart, 'zoom', function () {
    //     chart.boostForceChartBoost =
    //         shouldForceChartSeriesBoosting(chart);
    // });

    let prevX = -1;
    let prevY = -1;

    addEvent(chart.pointer, 'afterGetHoverData', (): void => {
        const series = chart.hoverSeries;

        chart.boost = chart.boost || {};

        if (chart.boost.markerGroup && series) {
            const xAxis = chart.inverted ? series.yAxis : series.xAxis;
            const yAxis = chart.inverted ? series.xAxis : series.yAxis;

            if (
                (xAxis && xAxis.pos !== prevX) ||
                (yAxis && yAxis.pos !== prevY)
            ) {
                // #10464: Keep the marker group position in sync with the
                // position of the hovered series axes since there is only
                // one shared marker group when boosting.
                chart.boost.markerGroup.translate(xAxis.pos, yAxis.pos);

                prevX = xAxis.pos;
                prevY = yAxis.pos;
            }
        }
    });
}

/**
 * Tolerant max() function.
 *
 * @private
 * @param {...Array<Array<unknown>>} args
 * Max arguments
 * @return {number}
 * Max value
 */
function patientMax(...args: Array<Array<unknown>>): number {
    let r = -Number.MAX_VALUE;

    args.forEach(function (t: Array<unknown>): (boolean|undefined) {
        if (
            typeof t !== 'undefined' &&
            t !== null &&
            typeof t.length !== 'undefined'
        ) {
            // r = r < t.length ? t.length : r;
            if (t.length > 0) {
                r = t.length;
                return true;
            }
        }
    });

    return r;
}

/* *
 *
 *  Default Export
 *
 * */

const BoostChart = {
    compose,
    getBoostClipRect,
    isChartSeriesBoosting
};

export default BoostChart;
