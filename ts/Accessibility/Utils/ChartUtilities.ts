/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Utils for dealing with charts.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type Axis from '../../Core/Axis/Axis';
import type Chart from '../../Core/Chart/Chart';
import type { DOMElementType } from '../../Core/Renderer/DOMElementType';
import type Point from '../../Core/Series/Point';
import type Series from '../../Core/Series/Series';
import HTMLUtilities from './HTMLUtilities.js';
const {
    stripHTMLTagsFromString: stripHTMLTags
} = HTMLUtilities;
import U from '../../Core/Utilities.js';
const {
    defined,
    find,
    fireEvent,
    isNumber,
    numberFormat
} = U;


/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface A11yChartUtilities {
            getChartTitle(chart: Chart): string;
            getAxisDescription(axis: Axis): string;
            getAxisRangeDescription(axis: Axis): string;
            getPointFromXY(
                series: Array<Series>,
                x: number,
                y: number
            ): (Point|undefined);
            getSeriesFirstPointElement(
                series: Series
            ): (DOMElementType|undefined);
            getSeriesFromName(chart: Chart, name: string): Array<Series>;
            getSeriesA11yElement(
                series: Series
            ): (DOMElementType|undefined);
            unhideChartElementFromAT(
                chart: Chart,
                element: DOMElementType
            ): void;
            hideSeriesFromAT(series: Series): void;
            scrollToPoint(point: Point): void;
        }
    }
}

/* eslint-disable valid-jsdoc */

/**
 * @return {string}
 */
function getChartTitle(chart: Highcharts.AccessibilityChart): string {
    return stripHTMLTags(
        chart.options.title.text ||
        chart.langFormat(
            'accessibility.defaultChartTitle', { chart: chart }
        )
    );
}


/**
 * Return string with the axis name/title.
 * @param {Highcharts.Axis} axis
 * @return {string}
 */
function getAxisDescription(axis: Highcharts.Axis): string {
    return axis && (
        axis.userOptions && axis.userOptions.accessibility &&
            axis.userOptions.accessibility.description ||
        axis.axisTitle && axis.axisTitle.textStr ||
        axis.options.id ||
        axis.categories && 'categories' ||
        axis.dateTime && 'Time' ||
        'values'
    );
}


/**
 * Return string with text description of the axis range.
 * @param {Highcharts.Axis} axis The axis to get range desc of.
 * @return {string} A string with the range description for the axis.
 */
function getAxisRangeDescription(axis: Highcharts.Axis): string {
    const axisOptions = axis.options || {};

    // Handle overridden range description
    if (
        axisOptions.accessibility &&
        typeof axisOptions.accessibility.rangeDescription !== 'undefined'
    ) {
        return axisOptions.accessibility.rangeDescription;
    }

    // Handle category axes
    if (axis.categories) {
        return getCategoryAxisRangeDesc(axis);
    }

    // Use time range, not from-to?
    if (axis.dateTime && (axis.min === 0 || axis.dataMin === 0)) {
        return getAxisTimeLengthDesc(axis);
    }

    // Just use from and to.
    // We have the range and the unit to use, find the desc format
    return getAxisFromToDescription(axis);
}


/**
 * Describe the range of a category axis.
 * @param {Highcharts.Axis} axis
 * @return {string}
 */
function getCategoryAxisRangeDesc(axis: Highcharts.Axis): string {
    const chart = axis.chart;

    if (axis.dataMax && axis.dataMin) {
        return chart.langFormat(
            'accessibility.axis.rangeCategories',
            {
                chart: chart,
                axis: axis,
                numCategories: axis.dataMax - axis.dataMin + 1
            }
        );
    }

    return '';
}


/**
 * Describe the length of the time window shown on an axis.
 * @param {Highcharts.Axis} axis
 * @return {string}
 */
function getAxisTimeLengthDesc(axis: Highcharts.Axis): string {
    const chart = axis.chart;
    const range: Record<string, number> = {};
    let rangeUnit = 'Seconds';

    range.Seconds = ((axis.max || 0) - (axis.min || 0)) / 1000;
    range.Minutes = range.Seconds / 60;
    range.Hours = range.Minutes / 60;
    range.Days = range.Hours / 24;

    ['Minutes', 'Hours', 'Days'].forEach(function (unit: string): void {
        if (range[unit] > 2) {
            rangeUnit = unit;
        }
    });

    const rangeValue: string = range[rangeUnit].toFixed(
        rangeUnit !== 'Seconds' &&
        rangeUnit !== 'Minutes' ? 1 : 0 // Use decimals for days/hours
    );

    // We have the range and the unit to use, find the desc format
    return chart.langFormat(
        'accessibility.axis.timeRange' + rangeUnit,
        {
            chart: chart,
            axis: axis,
            range: rangeValue.replace('.0', '')
        }
    );
}


/**
 * Describe an axis from-to range.
 * @param {Highcharts.Axis} axis
 * @return {string}
 */
function getAxisFromToDescription(axis: Highcharts.Axis): string {
    const chart = axis.chart as Highcharts.AccessibilityChart;
    const dateRangeFormat = (
        chart.options &&
        chart.options.accessibility &&
        chart.options.accessibility.screenReaderSection.axisRangeDateFormat ||
        ''
    );
    const linearValueFormat = (val: number): string => {
        const a11yOptions = chart.options.accessibility,
            a11yPointOptions = a11yOptions && a11yOptions.point || {},
            tooltipOptions = chart.options.tooltip || {},
            lang = chart.options.lang || {};

        if (isNumber(val)) {
            return numberFormat(
                val,
                a11yPointOptions.valueDecimals ||
                    tooltipOptions.valueDecimals ||
                    -1,
                lang.decimalPoint,
                (lang.accessibility as any).thousandsSep || lang.thousandsSep
            );
        }

        return val;
    };
    const format = function (axisKey: string): string {
        return axis.dateTime ? chart.time.dateFormat(
            dateRangeFormat, (axis as any)[axisKey]
        ) : linearValueFormat((axis as any)[axisKey]);
    };

    return chart.langFormat(
        'accessibility.axis.rangeFromTo',
        {
            chart: chart,
            axis: axis,
            rangeFrom: format('min'),
            rangeTo: format('max')
        }
    );
}


/**
 * Get the DOM element for the first point in the series.
 * @private
 * @param {Highcharts.Series} series
 * The series to get element for.
 * @return {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement|undefined}
 * The DOM element for the point.
 */
function getSeriesFirstPointElement(
    series: Series
): (DOMElementType|undefined) {
    if (series.points && series.points.length) {
        const firstPointWithGraphic = find(series.points, (p: Point): boolean => !!p.graphic);
        return (
            firstPointWithGraphic &&
            firstPointWithGraphic.graphic &&
            firstPointWithGraphic.graphic.element
        );
    }
}


/**
 * Get the DOM element for the series that we put accessibility info on.
 * @private
 * @param {Highcharts.Series} series
 * The series to get element for.
 * @return {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement|undefined}
 * The DOM element for the series
 */
function getSeriesA11yElement(
    series: Series
): (DOMElementType|undefined) {
    var firstPointEl = getSeriesFirstPointElement(series);
    return (
        firstPointEl &&
        (firstPointEl.parentNode as any) || series.graph &&
        series.graph.element || series.group &&
        series.group.element
    ); // Could be tracker series depending on series type
}


/**
 * Remove aria-hidden from element. Also unhides parents of the element, and
 * hides siblings that are not explicitly unhidden.
 * @private
 * @param {Highcharts.Chart} chart
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} element
 */
function unhideChartElementFromAT(chart: Chart, element: DOMElementType): void {
    element.setAttribute('aria-hidden', false);
    if (element === chart.renderTo || !element.parentNode) {
        return;
    }

    // Hide siblings unless their hidden state is already explicitly set
    Array.prototype.forEach.call(
        element.parentNode.childNodes,
        function (node: DOMElementType): void {
            if (!node.hasAttribute('aria-hidden')) {
                node.setAttribute('aria-hidden', true);
            }
        }
    );
    // Repeat for parent
    unhideChartElementFromAT(chart, element.parentNode as any);
}


/**
 * Hide series from screen readers.
 * @private
 * @param {Highcharts.Series} series
 * The series to hide
 * @return {void}
 */
function hideSeriesFromAT(series: Series): void {
    var seriesEl = getSeriesA11yElement(series);

    if (seriesEl) {
        seriesEl.setAttribute('aria-hidden', true);
    }
}


/**
 * Get series objects by series name.
 * @private
 * @param {Highcharts.Chart} chart
 * @param {string} name
 * @return {Array<Highcharts.Series>}
 */
function getSeriesFromName(
    chart: Chart,
    name: string
): Array<Series> {
    if (!name) {
        return chart.series;
    }

    return (chart.series || []).filter(function (s): boolean {
        return s.name === name;
    });
}


/**
 * Get point in a series from x/y values.
 * @private
 * @param {Array<Highcharts.Series>} series
 * @param {number} x
 * @param {number} y
 * @return {Highcharts.Point|undefined}
 */
function getPointFromXY(
    series: Array<Series>,
    x: number,
    y: number
): (Point|undefined) {
    var i = series.length,
        res;

    while (i--) {
        res = find(series[i].points || [], function (p: Point): boolean {
            return p.x === x && p.y === y;
        });
        if (res) {
            return res;
        }
    }
}


/**
 * Get relative position of point on an x/y axis from 0 to 1.
 * @private
 * @param {Highcharts.Axis} axis
 * @param {Highcharts.Point} point
 * @return {number}
 */
function getRelativePointAxisPosition(axis: Axis, point: Point): number {
    if (!defined(axis.dataMin) || !defined(axis.dataMax)) {
        return 0;
    }

    const axisStart = axis.toPixels(axis.dataMin);
    const axisEnd = axis.toPixels(axis.dataMax);
    // We have to use pixel position because of axis breaks, log axis etc.
    const positionProp = axis.coll === 'xAxis' ? 'x' : 'y';
    const pointPos = axis.toPixels(point[positionProp] || 0);

    return (pointPos - axisStart) / (axisEnd - axisStart);
}


/**
 * Get relative position of point on an x/y axis from 0 to 1.
 * @private
 * @param {Highcharts.Point} point
 */
function scrollToPoint(point: Point): void {
    const xAxis = point.series.xAxis;
    const yAxis = point.series.yAxis;
    const axis = (xAxis && xAxis.scrollbar ? xAxis : yAxis);
    const scrollbar = (axis && axis.scrollbar);

    if (scrollbar && defined(scrollbar.to) && defined(scrollbar.from)) {
        const range = scrollbar.to - scrollbar.from;
        const pos = getRelativePointAxisPosition(axis, point);

        scrollbar.updatePosition(
            pos - range / 2,
            pos + range / 2
        );

        fireEvent(scrollbar, 'changed', {
            from: scrollbar.from,
            to: scrollbar.to,
            trigger: 'scrollbar',
            DOMEvent: null
        });
    }
}


const ChartUtilities: Highcharts.A11yChartUtilities = {
    getChartTitle,
    getAxisDescription,
    getAxisRangeDescription,
    getPointFromXY,
    getSeriesFirstPointElement,
    getSeriesFromName,
    getSeriesA11yElement,
    unhideChartElementFromAT,
    hideSeriesFromAT,
    scrollToPoint
};

export default ChartUtilities;
