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
import type Chart from '../../Core/Chart/Chart';
import type RangeSelector from './RangeSelector';
import type Time from '../../Core/Time';
import type { VerticalAlignValue } from '../../Core/Renderer/AlignObject';

import D from '../../Core/Defaults.js';
const {
    defaultOptions,
    setOptions
} = D;
import RangeSelectorDefaults from './RangeSelectorDefaults.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find,
    pushUnique
} = AH;
const { isNumber } = TC;
const { defined, extend, merge } = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Constants
 *
 * */

const chartDestroyEvents: Array<[Chart, Array<Function>]> = [];

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Variables
 *
 * */

let RangeSelectorConstructor: typeof RangeSelector;

/* *
 *
 *  Functions
 *
 * */

/**
 * Get the axis min value based on the range option and the current max. For
 * stock charts this is extended via the {@link RangeSelector} so that if the
 * selected range is a multiple of months or years, it is compensated for
 * various month lengths.
 *
 * @private
 * @function Highcharts.Axis#minFromRange
 * @return {number|undefined}
 *         The new minimum value.
 */
function axisMinFromRange(
    this: Axis
): (number|undefined) {
    const rangeOptions = this.range,
        type = (rangeOptions as any).type,
        max = this.max as any,
        time = this.chart.time,
        // Get the true range from a start date
        getTrueRange = function (base: number, count: number): number {
            const timeName: Time.TimeUnitValue = type === 'year' ?
                'FullYear' : 'Month';
            const date = new time.Date(base);
            const basePeriod = time.get(timeName, date);

            time.set(timeName, date, basePeriod + count);

            if (basePeriod === time.get(timeName, date)) {
                time.set('Date', date, 0); // #6537
            }

            return date.getTime() - base;
        };

    let min,
        range;

    if (isNumber(rangeOptions)) {
        min = max - rangeOptions;
        range = rangeOptions;
    } else if (rangeOptions) {
        min = max + getTrueRange(max, -(rangeOptions.count || 1));

        // Let the fixedRange reflect initial settings (#5930)
        if (this.chart) {
            this.chart.fixedRange = max - min;
        }
    }

    const dataMin = pick(this.dataMin, Number.MIN_VALUE);

    if (!isNumber(min)) {
        min = dataMin;
    }

    if (min <= dataMin) {
        min = dataMin;
        if (typeof range === 'undefined') { // #4501
            range = getTrueRange(min, (rangeOptions as any).count);
        }
        this.newMax = Math.min(
            min + range,
            pick(this.dataMax, Number.MAX_VALUE)
        );
    }

    if (!isNumber(max)) {
        min = void 0;
    } else if (
        !isNumber(rangeOptions) &&
        rangeOptions &&
        rangeOptions._offsetMin
    ) {
        min += rangeOptions._offsetMin;
    }

    return min;
}

/**
 * @private
 */
function compose(
    AxisClass: typeof Axis,
    ChartClass: typeof Chart,
    RangeSelectorClass: typeof RangeSelector
): void {

    RangeSelectorConstructor = RangeSelectorClass;

    if (pushUnique(composedMembers, AxisClass)) {
        AxisClass.prototype.minFromRange = axisMinFromRange;
    }

    if (pushUnique(composedMembers, ChartClass)) {
        addEvent(ChartClass, 'afterGetContainer', onChartAfterGetContainer);
        addEvent(ChartClass, 'beforeRender', onChartBeforeRender);
        addEvent(ChartClass, 'destroy', onChartDestroy);
        addEvent(ChartClass, 'getMargins', onChartGetMargins);
        addEvent(ChartClass, 'render', onChartRender);
        addEvent(ChartClass, 'update', onChartUpdate);

        const chartProto = ChartClass.prototype;

        chartProto.callbacks.push(onChartCallback);
    }

    if (pushUnique(composedMembers, setOptions)) {
        extend(
            defaultOptions,
            { rangeSelector: RangeSelectorDefaults.rangeSelector }
        );
        extend(
            defaultOptions.lang,
            RangeSelectorDefaults.lang
        );
    }

}

/**
 * Initialize rangeselector for stock charts
 * @private
 */
function onChartAfterGetContainer(
    this: Chart
): void {
    if (
        this.options.rangeSelector &&
        this.options.rangeSelector.enabled
    ) {
        this.rangeSelector = new RangeSelectorConstructor(this);
    }
}

/**
 * @private
 */
function onChartBeforeRender(
    this: Chart
): void {
    const chart = this,
        axes = chart.axes,
        rangeSelector = chart.rangeSelector;

    if (rangeSelector) {

        if (isNumber(rangeSelector.deferredYTDClick)) {
            rangeSelector.clickButton(rangeSelector.deferredYTDClick);
            delete rangeSelector.deferredYTDClick;
        }

        axes.forEach((axis): void => {
            axis.updateNames();
            axis.setScale();
        });

        chart.getAxisMargins();

        rangeSelector.render();

        const verticalAlign = rangeSelector.options.verticalAlign;

        if (!rangeSelector.options.floating) {
            if (verticalAlign === 'bottom') {
                this.extraBottomMargin = true;
            } else if (verticalAlign !== 'middle') {
                this.extraTopMargin = true;
            }
        }
    }

}

/**
 * @private
 */
function onChartCallback(
    chart: Chart
): void {
    let extremes,
        legend,
        alignTo,
        verticalAlign: VerticalAlignValue|undefined;

    const rangeSelector = chart.rangeSelector,
        redraw = (): void => {
            if (rangeSelector) {
                extremes = chart.xAxis[0].getExtremes();
                legend = chart.legend;
                verticalAlign = (
                    rangeSelector &&
                    rangeSelector.options.verticalAlign
                );

                if (isNumber(extremes.min)) {
                    rangeSelector.render(extremes.min, extremes.max);
                }

                // Re-align the legend so that it's below the rangeselector
                if (
                    legend.display &&
                    verticalAlign === 'top' &&
                    verticalAlign === legend.options.verticalAlign
                ) {
                    // Create a new alignment box for the legend.
                    alignTo = merge(chart.spacingBox);
                    if (legend.options.layout === 'vertical') {
                        alignTo.y = chart.plotTop;
                    } else {
                        alignTo.y += rangeSelector.getHeight();
                    }
                    legend.group.placed = false; // Don't animate the alignment.
                    legend.align(alignTo);
                }
            }
        };

    if (rangeSelector) {
        const events = find(
            chartDestroyEvents,
            (e: [Chart, Function[]]): boolean => e[0] === chart
        );

        if (!events) {
            chartDestroyEvents.push([chart, [
                // redraw the scroller on setExtremes
                addEvent(
                    chart.xAxis[0],
                    'afterSetExtremes',
                    function (e: RangeSelector.RangeObject): void {
                        if (rangeSelector) {
                            rangeSelector.render(e.min, e.max);
                        }
                    }
                ),
                // redraw the scroller chart resize
                addEvent(chart, 'redraw', redraw)
            ]]);
        }

        // do it now
        redraw();
    }
}

/**
 * Remove resize/afterSetExtremes at chart destroy.
 * @private
 */
function onChartDestroy(
    this: Chart
): void {
    for (let i = 0, iEnd = chartDestroyEvents.length; i < iEnd; ++i) {
        const events = chartDestroyEvents[i];
        if (events[0] === this) {
            events[1].forEach((unbind: Function): void => unbind());
            chartDestroyEvents.splice(i, 1);
            return;
        }
    }
}

function onChartGetMargins(
    this: Chart
): void {
    const rangeSelector = this.rangeSelector;

    if (rangeSelector) {
        const rangeSelectorHeight = rangeSelector.getHeight();

        if (this.extraTopMargin) {
            this.plotTop += rangeSelectorHeight;
        }

        if (this.extraBottomMargin) {
            (this.marginBottom as any) += rangeSelectorHeight;
        }
    }
}

/**
 * @private
 */
function onChartRender(
    this: Chart
): void {
    const chart = this,
        rangeSelector = chart.rangeSelector;

    if (rangeSelector && !rangeSelector.options.floating) {
        rangeSelector.render();

        const verticalAlign = rangeSelector.options.verticalAlign;

        if (verticalAlign === 'bottom') {
            this.extraBottomMargin = true;
        } else if (verticalAlign !== 'middle') {
            this.extraTopMargin = true;
        }
    }
}

/**
 * @private
 */
function onChartUpdate(
    this: Chart,
    e: Chart
): void {
    const chart = this,
        options = e.options,
        optionsRangeSelector = options.rangeSelector,
        extraBottomMarginWas = this.extraBottomMargin,
        extraTopMarginWas = this.extraTopMargin;

    let rangeSelector = chart.rangeSelector;

    if (
        optionsRangeSelector &&
        optionsRangeSelector.enabled &&
        !defined(rangeSelector) &&
        this.options.rangeSelector
    ) {
        this.options.rangeSelector.enabled = true;
        this.rangeSelector = rangeSelector = new RangeSelectorConstructor(this);
    }

    this.extraBottomMargin = false;
    this.extraTopMargin = false;

    if (rangeSelector) {
        onChartCallback(this);

        const verticalAlign = (
            optionsRangeSelector &&
            optionsRangeSelector.verticalAlign
        ) || (
            rangeSelector.options && rangeSelector.options.verticalAlign
        );

        if (!rangeSelector.options.floating) {
            if (verticalAlign === 'bottom') {
                this.extraBottomMargin = true;
            } else if (verticalAlign !== 'middle') {
                this.extraTopMargin = true;
            }
        }

        if (
            this.extraBottomMargin !== extraBottomMarginWas ||
            this.extraTopMargin !== extraTopMarginWas
        ) {
            this.isDirtyBox = true;
        }

    }

}

/* *
 *
 *  Default Export
 *
 * */

const RangeSelectorComposition = {
    compose
};

export default RangeSelectorComposition;
