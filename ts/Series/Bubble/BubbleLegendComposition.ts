/* *
 *
 *  (c) 2010-2021 Highsoft AS
 *
 *  Author: Paweł Potaczek
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

import type Chart from '../../Core/Chart/Chart';
import type Legend from '../../Core/Legend/Legend';
import type Options from '../../Core/Options';
import type Point from '../../Core/Series/Point';
import type Series from '../../Core/Series/Series';

import BubbleLegendDefaults from './BubbleLegendDefaults.js';
import BubbleLegendItem from './BubbleLegendItem.js';
import D from '../../Core/Defaults.js';
const { setOptions } = D;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { objectEach } = OH;
const { addEvent } = EH;
const {
    wrap
} = U;

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
 * If ranges are not specified, determine ranges from rendered bubble series
 * and render legend again.
 */
function chartDrawChartBox(
    this: Chart,
    proceed: Function,
    options: Options,
    callback: Chart.CallbackFunction
): void {
    const chart = this,
        legend = chart.legend,
        bubbleSeries = getVisibleBubbleSeriesIndex(chart) >= 0;
    let bubbleLegendOptions: BubbleLegendItem.Options,
        bubbleSizes,
        legendItem;

    if (
        legend && legend.options.enabled && legend.bubbleLegend &&
        (legend.options.bubbleLegend as any).autoRanges && bubbleSeries
    ) {
        bubbleLegendOptions = legend.bubbleLegend.options;
        bubbleSizes = legend.bubbleLegend.predictBubbleSizes();

        legend.bubbleLegend.updateRanges(bubbleSizes[0], bubbleSizes[1]);
        // Disable animation on init
        if (!bubbleLegendOptions.placed) {
            legend.group.placed = false;

            legend.allItems.forEach((item): void => {
                legendItem = item.legendItem || {};
                if (legendItem.group) {
                    legendItem.group.translateY = null;
                }
            });
        }

        // Create legend with bubbleLegend
        legend.render();

        chart.getMargins();

        chart.axes.forEach(function (axis): void {
            if (axis.visible) { // #11448
                axis.render();
            }

            if (!bubbleLegendOptions.placed) {
                axis.setScale();
                axis.updateNames();
                // Disable axis animation on init
                objectEach(axis.ticks, function (tick): void {
                    tick.isNew = true;
                    tick.isNewLabel = true;
                });
            }
        });
        bubbleLegendOptions.placed = true;

        // After recalculate axes, calculate margins again.
        chart.getMargins();

        // Call default 'drawChartBox' method.
        proceed.call(chart, options, callback);

        // Check bubble legend sizes and correct them if necessary.
        legend.bubbleLegend.correctSizes();

        // Correct items positions with different dimensions in legend.
        retranslateItems(legend, getLinesHeights(legend));

    } else {
        proceed.call(chart, options, callback);
        // Allow color change on static bubble legend after click on legend
        if (legend && legend.options.enabled && legend.bubbleLegend) {
            legend.render();
            retranslateItems(legend, getLinesHeights(legend));
        }
    }
}

/**
 * Compose classes for use with Bubble series.
 * @private
 *
 * @param {Highcharts.Chart} ChartClass
 * Core chart class to use with Bubble series.
 *
 * @param {Highcharts.Legend} LegendClass
 * Core legend class to use with Bubble series.
 *
 * @param {Highcharts.Series} SeriesClass
 * Core series class to use with Bubble series.
 */
function compose(
    ChartClass: typeof Chart,
    LegendClass: typeof Legend,
    SeriesClass: typeof Series
): void {

    if (pushUnique(composedMembers, ChartClass)) {
        setOptions({
            // Set default bubble legend options
            legend: {
                bubbleLegend: BubbleLegendDefaults
            }
        });

        wrap(ChartClass.prototype, 'drawChartBox', chartDrawChartBox);
    }

    if (pushUnique(composedMembers, LegendClass)) {
        addEvent(LegendClass, 'afterGetAllItems', onLegendAfterGetAllItems);
    }

    if (pushUnique(composedMembers, SeriesClass)) {
        addEvent(SeriesClass, 'legendItemClick', onSeriesLegendItemClick);
    }

}

/**
 * Check if there is at least one visible bubble series.
 *
 * @private
 * @function getVisibleBubbleSeriesIndex
 * @param {Highcharts.Chart} chart
 * Chart to check.
 * @return {number}
 * First visible bubble series index
 */
function getVisibleBubbleSeriesIndex(chart: Chart): number {
    const series = chart.series;
    let i = 0;

    while (i < series.length) {
        if (
            series[i] &&
            series[i].isBubble &&
            series[i].visible &&
            (series[i] as any).zData.length
        ) {
            return i;
        }
        i++;
    }
    return -1;
}

/**
 * Calculate height for each row in legend.
 *
 * @private
 * @function getLinesHeights
 *
 * @param {Highcharts.Legend} legend
 * Legend to calculate from.
 *
 * @return {Array<Highcharts.Dictionary<number>>}
 * Informations about line height and items amount
 */
function getLinesHeights(
    legend: Legend
): Array<Record<string, number>> {
    const items = legend.allItems,
        lines = [] as Array<Record<string, number>>,
        length = items.length;

    let lastLine,
        legendItem,
        legendItem2,
        i = 0,
        j = 0;

    for (i = 0; i < length; i++) {
        legendItem = items[i].legendItem || {};
        legendItem2 = (items[i + 1] || {}).legendItem || {};
        if (legendItem.labelHeight) {
            // for bubbleLegend
            (items[i] as any).itemHeight = legendItem.labelHeight;
        }
        if ( // Line break
            items[i] === items[length - 1] ||
            legendItem.y !== legendItem2.y
        ) {
            lines.push({ height: 0 });
            lastLine = lines[lines.length - 1];
            // Find the highest item in line
            for (j; j <= i; j++) {
                if ((items[j] as any).itemHeight > lastLine.height) {
                    lastLine.height = (items[j] as any).itemHeight;
                }
            }
            lastLine.step = i;
        }
    }
    return lines;
}

/**
 * Start the bubble legend creation process.
 */
function onLegendAfterGetAllItems(
    this: Legend,
    e: { allItems: Array<(Series|Point)> }
): void {
    const legend = this,
        bubbleLegend = legend.bubbleLegend,
        legendOptions = legend.options,
        options = legendOptions.bubbleLegend,
        bubbleSeriesIndex = getVisibleBubbleSeriesIndex(legend.chart);

    // Remove unnecessary element
    if (bubbleLegend && bubbleLegend.ranges && bubbleLegend.ranges.length) {
        // Allow change the way of calculating ranges in update
        if ((options as any).ranges.length) {
            (options as any).autoRanges =
                !!(options as any).ranges[0].autoRanges;
        }
        // Update bubbleLegend dimensions in each redraw
        legend.destroyItem(bubbleLegend);
    }
    // Create bubble legend
    if (bubbleSeriesIndex >= 0 &&
            legendOptions.enabled &&
            (options as any).enabled
    ) {
        (options as any).seriesIndex = bubbleSeriesIndex;
        legend.bubbleLegend = new BubbleLegendItem(options as any, legend);
        legend.bubbleLegend.addToLegend(e.allItems);
    }
}

/**
 * Toggle bubble legend depending on the visible status of bubble series.
 */
function onSeriesLegendItemClick(this: Series, e: any): void | boolean {
    // #14080 don't fire this code if click function is prevented
    if (e.defaultPrevented) {
        return false;
    }

    const series = this,
        chart = series.chart,
        visible = series.visible,
        legend = series.chart.legend;
    let status;

    if (legend && legend.bubbleLegend) {
        // Temporary correct 'visible' property
        series.visible = !visible;
        // Save future status for getRanges method
        series.ignoreSeries = visible;
        // Check if at lest one bubble series is visible
        status = getVisibleBubbleSeriesIndex(chart) >= 0;

        // Hide bubble legend if all bubble series are disabled
        if (legend.bubbleLegend.visible !== status) {
            // Show or hide bubble legend
            legend.update({
                bubbleLegend: { enabled: status }
            });

            legend.bubbleLegend.visible = status; // Restore default status
        }
        series.visible = visible;
    }
}

/**
 * Correct legend items translation in case of different elements heights.
 *
 * @private
 * @function Highcharts.Legend#retranslateItems
 *
 * @param {Highcharts.Legend} legend
 * Legend to translate in.
 *
 * @param {Array<Highcharts.Dictionary<number>>} lines
 * Informations about line height and items amount
 */
function retranslateItems(
    legend: Legend,
    lines: Array<Record<string, number>>
): void {
    const items = legend.allItems,
        rtl = legend.options.rtl;

    let orgTranslateX,
        orgTranslateY,
        movementX,
        legendItem,
        actualLine = 0;

    items.forEach((
        item: (BubbleLegendItem|Series|Point),
        index: number
    ): void => {
        legendItem = item.legendItem || {};

        if (!legendItem.group) {
            return;
        }

        orgTranslateX = legendItem.group.translateX || 0;
        orgTranslateY = legendItem.y || 0;

        movementX = (item as any).movementX;

        if (movementX || (rtl && (item as any).ranges)) {
            movementX = rtl ?
                orgTranslateX - (item as any).options.maxSize / 2 :
                orgTranslateX + movementX;

            legendItem.group.attr({ translateX: movementX });
        }
        if (index > lines[actualLine].step) {
            actualLine++;
        }

        legendItem.group.attr({
            translateY: Math.round(
                orgTranslateY + lines[actualLine].height / 2
            )
        });
        legendItem.y = orgTranslateY + lines[actualLine].height / 2;
    });
}

/* *
 *
 *  Default Export
 *
 * */

const BubbleLegendComposition = {
    compose
};

export default BubbleLegendComposition;
