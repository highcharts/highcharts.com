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

/* *
 *
 *  Imports
 *
 * */

import type Accessibility from '../Accessibility';
import type Axis from '../../Core/Axis/Axis';
import type Chart from '../../Core/Chart/Chart';
import type { DOMElementType } from '../../Core/Renderer/DOMElementType';
import type Point from '../../Core/Series/Point';
import type Series from '../../Core/Series/Series';
import type HTMLElement from '../../Core/Renderer/HTML/HTMLElement';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import H from '../../Core/Globals.js';
const { doc } = H;
import HU from './HTMLUtilities.js';
const { stripHTMLTagsFromString: stripHTMLTags } = HU;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find
} = AH;

const {
    defined
} = OH;
const { fireEvent } = EH;

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Fire an event on an element that is either wrapped by Highcharts,
 * or a DOM element.
 * @private
 */
function fireEventOnWrappedOrUnwrappedElement(
    el: (HTMLElement|SVGElement|DOMElementType),
    eventObject: Event
): void {
    const type = eventObject.type;
    const hcEvents = (el as SVGElement).hcEvents;

    if (
        !!doc.createEvent &&
        ((el as Element).dispatchEvent || (el as SVGElement).fireEvent)
    ) {
        if (el.dispatchEvent) {
            el.dispatchEvent(eventObject);
        } else {
            (el as SVGElement).fireEvent(type, eventObject);
        }
    } else if (hcEvents && hcEvents[type]) {
        fireEvent(el, type, eventObject);
    } else if ((el as SVGElement).element) {
        fireEventOnWrappedOrUnwrappedElement(
            (el as SVGElement).element,
            eventObject
        );
    }
}


/**
 * @private
 */
function getChartTitle(chart: Accessibility.ChartComposition): string {
    return stripHTMLTags(
        chart.options.title.text ||
        chart.langFormat(
            'accessibility.defaultChartTitle', { chart: chart }
        ),
        chart.renderer.forExport
    );
}


/**
 * Return string with the axis name/title.
 * @private
 */
function getAxisDescription(axis: Axis): string {
    return axis && (
        axis.options.accessibility?.description ||
        axis.axisTitle?.textStr ||
        axis.options.id ||
        axis.categories && 'categories' ||
        axis.dateTime && 'Time' ||
        'values'
    );
}


/**
 * Return string with text description of the axis range.
 * @private
 * @param {Highcharts.Axis} axis
 * The axis to get range desc of.
 * @return {string}
 * A string with the range description for the axis.
 */
function getAxisRangeDescription(axis: Axis): string {
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
 * @private
 */
function getCategoryAxisRangeDesc(axis: Axis): string {
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
 * @private
 */
function getAxisTimeLengthDesc(axis: Axis): string {
    const chart = axis.chart,
        range: Record<string, number> = {},
        min = axis.dataMin || axis.min || 0,
        max = axis.dataMax || axis.max || 0;
    let rangeUnit = 'Seconds';

    range.Seconds = (max - min) / 1000;
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
 * @private
 */
function getAxisFromToDescription(axis: Axis): string {
    const chart = axis.chart,
        options = chart.options,
        dateRangeFormat = (
            options &&
            options.accessibility &&
            options.accessibility.screenReaderSection.axisRangeDateFormat ||
            ''
        ),
        extremes: Record<string, number> = {
            min: axis.dataMin || axis.min || 0,
            max: axis.dataMax || axis.max || 0
        },
        format = function (key: ('max'|'min')): string {
            return axis.dateTime ?
                chart.time.dateFormat(dateRangeFormat, extremes[key]) :
                extremes[key].toString();
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
        const firstPointWithGraphic = find(
            series.points,
            (p: Point): boolean => !!p.graphic
        );
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
    const firstPointEl = getSeriesFirstPointElement(series);
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
 */
function unhideChartElementFromAT(chart: Chart, element: DOMElementType): void {
    element.setAttribute('aria-hidden', false);
    if (
        element === chart.renderTo ||
        !element.parentNode ||
        element.parentNode === doc.body // #16126: Full screen printing
    ) {
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
    unhideChartElementFromAT(chart, element.parentNode);
}


/**
 * Hide series from screen readers.
 * @private
 */
function hideSeriesFromAT(series: Series): void {
    const seriesEl = getSeriesA11yElement(series);

    if (seriesEl) {
        seriesEl.setAttribute('aria-hidden', true);
    }
}


/**
 * Get series objects by series name.
 * @private
 */
function getSeriesFromName<T extends Chart>(
    chart: T,
    name: string
): T['series'] {
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
 */
function getPointFromXY<T extends Series>(
    series: Array<T>,
    x: number,
    y: number
): (T['points'][0]|undefined) {
    let i = series.length,
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
 */
function getRelativePointAxisPosition(axis: Axis, point: Point): number {
    if (!defined(axis.dataMin) || !defined(axis.dataMax)) {
        return 0;
    }

    const axisStart = axis.toPixels(axis.dataMin),
        axisEnd = axis.toPixels(axis.dataMax),
        // We have to use pixel position because of axis breaks, log axis etc.
        positionProp = axis.coll === 'xAxis' ? 'x' : 'y',
        pointPos = axis.toPixels(point[positionProp] || 0);

    return (pointPos - axisStart) / (axisEnd - axisStart);
}


/**
 * Get relative position of point on an x/y axis from 0 to 1.
 * @private
 */
function scrollAxisToPoint(point: Point): void {
    const xAxis = point.series.xAxis,
        yAxis = point.series.yAxis,
        axis = (xAxis && xAxis.scrollbar ? xAxis : yAxis),
        scrollbar = (axis && axis.scrollbar);

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

/* *
 *
 *  Default Export
 *
 * */

const ChartUtilities = {
    fireEventOnWrappedOrUnwrappedElement,
    getChartTitle,
    getAxisDescription,
    getAxisRangeDescription,
    getPointFromXY,
    getSeriesFirstPointElement,
    getSeriesFromName,
    getSeriesA11yElement,
    unhideChartElementFromAT,
    hideSeriesFromAT,
    scrollAxisToPoint
};

export default ChartUtilities;
