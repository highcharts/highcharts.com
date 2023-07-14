/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Place desriptions on a series and its points.
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

import type Accessibility from '../../Accessibility';
import type { AnnotationPoint } from '../../../Extensions/Annotations/AnnotationSeries';
import type Axis from '../../../Core/Axis/Axis';
import type { DOMElementType } from '../../../Core/Renderer/DOMElementType';
import type Point from '../../../Core/Series/Point';
import type PositionObject from '../../../Core/Renderer/PositionObject';
import type Series from '../../../Core/Series/Series';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';

import AnnotationsA11y from '../AnnotationsA11y.js';
const { getPointAnnotationTexts } = AnnotationsA11y;
import ChartUtilities from '../../Utils/ChartUtilities.js';
const {
    getAxisDescription,
    getSeriesFirstPointElement,
    getSeriesA11yElement,
    unhideChartElementFromAT
} = ChartUtilities;
import F from '../../../Core/Templating.js';
const {
    format,
    numberFormat
} = F;
import HTMLUtilities from '../../Utils/HTMLUtilities.js';
const {
    reverseChildNodes,
    stripHTMLTagsFromString: stripHTMLTags
} = HTMLUtilities;
import U from '../../../Core/Utilities.js';
const {
    find,
    isNumber,
    isString,
    pick,
    defined
} = U;


/* *
 *
 *  Declarations
 *
 * */

declare module '../../../Core/Series/PointLike' {
    interface PointLike {
        /** @requires modules/accessibility */
        hasMockGraphic?: boolean;
    }
}


/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */


/**
 * @private
 */
function findFirstPointWithGraphic(
    point: Point
): (Point|null) {
    const sourcePointIndex = point.index;

    if (!point.series || !point.series.data || !defined(sourcePointIndex)) {
        return null;
    }

    return find(point.series.data, function (p: Point): boolean {
        return !!(
            p &&
            typeof p.index !== 'undefined' &&
            p.index > sourcePointIndex &&
            p.graphic &&
            p.graphic.element
        );
    }) || null;
}


/**
 * Whether or not we should add a mock point element in
 * order to describe a point that has no graphic.
 * @private
 */
function shouldAddMockPoint(point: Point): boolean {
    // Note: Sunburst series use isNull for hidden points on drilldown.
    // Ignore these.
    const series = point.series,
        chart = series && series.chart,
        isSunburst = series && series.is('sunburst'),
        isNull = point.isNull,
        shouldDescribeNull = chart &&
            (chart as Accessibility.ChartComposition)
                .options.accessibility.point.describeNull;

    return isNull && !isSunburst && shouldDescribeNull;
}


/**
 * @private
 */
function makeMockElement(
    point: Point,
    pos: PositionObject
): SVGElement {
    const renderer = point.series.chart.renderer,
        mock = renderer.rect(pos.x, pos.y, 1, 1);

    mock.attr({
        'class': 'highcharts-a11y-mock-point',
        fill: 'none',
        opacity: 0,
        'fill-opacity': 0,
        'stroke-opacity': 0
    });

    return mock;
}


/**
 * @private
 */
function addMockPointElement(
    point: Accessibility.PointComposition
): (DOMElementType|undefined) {
    const series = point.series,
        firstPointWithGraphic = findFirstPointWithGraphic(point),
        firstGraphic = firstPointWithGraphic && firstPointWithGraphic.graphic,
        parentGroup = firstGraphic ?
            firstGraphic.parentGroup :
            series.graph || series.group,
        mockPos = firstPointWithGraphic ? {
            x: pick(point.plotX, firstPointWithGraphic.plotX, 0),
            y: pick(point.plotY, firstPointWithGraphic.plotY, 0)
        } : {
            x: pick(point.plotX, 0),
            y: pick(point.plotY, 0)
        },
        mockElement = makeMockElement(point, mockPos);

    if (parentGroup && parentGroup.element) {
        point.graphic = mockElement;
        point.hasMockGraphic = true;

        mockElement.add(parentGroup);

        // Move to correct pos in DOM
        parentGroup.element.insertBefore(
            mockElement.element,
            firstGraphic ? firstGraphic.element : null
        );

        return mockElement.element;
    }
}


/**
 * @private
 */
function hasMorePointsThanDescriptionThreshold(
    series: Accessibility.SeriesComposition
): boolean {
    const chartA11yOptions = series.chart.options.accessibility,
        threshold: (boolean|number) = (
            (chartA11yOptions.series as any).pointDescriptionEnabledThreshold
        );

    return !!(
        threshold !== false &&
        series.points &&
        series.points.length >= +threshold
    );
}


/**
 * @private
 */
function shouldSetScreenReaderPropsOnPoints(
    series: Accessibility.SeriesComposition
): boolean {
    const seriesA11yOptions = series.options.accessibility || {};

    return !hasMorePointsThanDescriptionThreshold(series) &&
        !seriesA11yOptions.exposeAsGroupOnly;
}


/**
 * @private
 */
function shouldSetKeyboardNavPropsOnPoints(
    series: Accessibility.SeriesComposition
): boolean {
    const chartA11yOptions = series.chart.options.accessibility,
        seriesNavOptions = chartA11yOptions.keyboardNavigation.seriesNavigation;

    return !!(
        series.points && (
            series.points.length <
                +seriesNavOptions.pointNavigationEnabledThreshold ||
            seriesNavOptions.pointNavigationEnabledThreshold === false
        )
    );
}


/**
 * @private
 */
function shouldDescribeSeriesElement(
    series: Accessibility.SeriesComposition
): boolean {
    const chart = series.chart,
        chartOptions = chart.options.chart,
        chartHas3d = chartOptions.options3d && chartOptions.options3d.enabled,
        hasMultipleSeries = chart.series.length > 1,
        describeSingleSeriesOption =
            (chart.options.accessibility.series as any).describeSingleSeries,
        exposeAsGroupOnlyOption =
            (series.options.accessibility || {}).exposeAsGroupOnly,
        noDescribe3D = chartHas3d && hasMultipleSeries;

    return !noDescribe3D && (
        hasMultipleSeries || describeSingleSeriesOption ||
        exposeAsGroupOnlyOption || hasMorePointsThanDescriptionThreshold(series)
    );
}


/**
 * @private
 */
function pointNumberToString(
    point: Accessibility.PointComposition,
    value: number|undefined
): string|undefined {
    const series = point.series,
        chart = series.chart,
        a11yPointOptions = chart.options.accessibility.point || {},
        seriesA11yPointOptions = series.options.accessibility &&
            series.options.accessibility.point || {},
        tooltipOptions = series.tooltipOptions || {},
        lang = chart.options.lang;

    if (isNumber(value)) {
        return numberFormat(
            value,
            seriesA11yPointOptions.valueDecimals ||
                a11yPointOptions.valueDecimals ||
                tooltipOptions.valueDecimals ||
                -1,
            lang.decimalPoint,
            (lang.accessibility as any).thousandsSep || lang.thousandsSep
        );
    }

    return value;
}


/**
 * @private
 */
function getSeriesDescriptionText(
    series: Accessibility.SeriesComposition
): string {
    const seriesA11yOptions = series.options.accessibility || {},
        descOpt = seriesA11yOptions.description;

    return descOpt && series.chart.langFormat(
        'accessibility.series.description', {
            description: descOpt,
            series: series
        }
    ) || '';
}


/**
 * @private
 */
function getSeriesAxisDescriptionText(
    series: Series,
    axisCollection: string
): string {
    const axis: Axis = (series as any)[axisCollection];

    return series.chart.langFormat(
        'accessibility.series.' + axisCollection + 'Description',
        {
            name: getAxisDescription(axis),
            series: series
        }
    );
}


/**
 * Get accessible time description for a point on a datetime axis.
 *
 * @private
 */
function getPointA11yTimeDescription(
    point: Accessibility.PointComposition
): (string|undefined) {
    const series = point.series,
        chart = series.chart,
        seriesA11yOptions = series.options.accessibility &&
            series.options.accessibility.point || {},
        a11yOptions = chart.options.accessibility.point || {},
        dateXAxis = series.xAxis && series.xAxis.dateTime;

    if (dateXAxis) {
        const tooltipDateFormat = dateXAxis.getXDateFormat(
                point.x || 0,
                chart.options.tooltip.dateTimeLabelFormats
            ),
            dateFormat = (
                seriesA11yOptions.dateFormatter &&
                seriesA11yOptions.dateFormatter(point) ||
                a11yOptions.dateFormatter && a11yOptions.dateFormatter(point) ||
                seriesA11yOptions.dateFormat ||
                a11yOptions.dateFormat ||
                tooltipDateFormat
            );

        return chart.time.dateFormat(dateFormat, point.x || 0, void 0);
    }
}


/**
 * @private
 */
function getPointXDescription(
    point: Accessibility.PointComposition
): string {
    const timeDesc = getPointA11yTimeDescription(point),
        xAxis = point.series.xAxis || {},
        pointCategory = xAxis.categories && defined(point.category) &&
            ('' + point.category).replace('<br/>', ' '),
        canUseId = defined(point.id) &&
            ('' + point.id).indexOf('highcharts-') < 0,
        fallback = 'x, ' + point.x;

    return point.name || timeDesc || pointCategory ||
        (canUseId ? point.id : fallback);
}


/**
 * @private
 */
function getPointArrayMapValueDescription(
    point: Accessibility.PointComposition,
    prefix: string,
    suffix: string
): string {
    const pre = prefix || '',
        suf = suffix || '',
        keyToValStr = function (key: string): string|undefined {
            const num = pointNumberToString(
                point,
                pick((point as any)[key], (point.options as any)[key])
            );
            return num !== void 0 ?
                key + ': ' + pre + num + suf :
                num;
        },
        pointArrayMap: Array<string> = point.series.pointArrayMap as any;

    return pointArrayMap.reduce(function (desc: string, key: string): string {
        const propDesc = keyToValStr(key);
        return propDesc ?
            (desc + (desc.length ? ', ' : '') + propDesc) :
            desc;
    }, '');
}


/**
 * @private
 */
function getPointValue(
    point: Accessibility.PointComposition
): string {
    const series = point.series,
        a11yPointOpts = series.chart.options.accessibility.point || {},
        seriesA11yPointOpts = series.chart.options.accessibility &&
            series.chart.options.accessibility.point || {},
        tooltipOptions = series.tooltipOptions || {},
        valuePrefix = seriesA11yPointOpts.valuePrefix ||
            a11yPointOpts.valuePrefix ||
            tooltipOptions.valuePrefix ||
            '',
        valueSuffix = seriesA11yPointOpts.valueSuffix ||
            a11yPointOpts.valueSuffix ||
            tooltipOptions.valueSuffix ||
            '',
        fallbackKey: ('value'|'y') = (
            typeof point.value !==
            'undefined' ?
                'value' : 'y'
        ),
        fallbackDesc = pointNumberToString(point, (point as any)[fallbackKey]);

    if (point.isNull) {
        return series.chart.langFormat('accessibility.series.nullPointValue', {
            point: point
        });
    }

    if (series.pointArrayMap) {
        return getPointArrayMapValueDescription(
            point, valuePrefix, valueSuffix
        );
    }

    return valuePrefix + fallbackDesc + valueSuffix;
}


/**
 * Return the description for the annotation(s) connected to a point, or
 * empty string if none.
 *
 * @private
 * @param {Highcharts.Point} point
 * The data point to get the annotation info from.
 * @return {string}
 * Annotation description
 */
function getPointAnnotationDescription(point: Point): string {
    const chart = point.series.chart;
    const langKey = 'accessibility.series.pointAnnotationsDescription';
    const annotations = getPointAnnotationTexts(
        point as AnnotationPoint
    );
    const context = { point, annotations };

    return annotations.length ? chart.langFormat(langKey, context) : '';
}


/**
 * Return string with information about point.
 * @private
 */
function getPointValueDescription(
    point: Accessibility.PointComposition
): string {
    const series = point.series,
        chart = series.chart,
        seriesA11yOptions = series.options.accessibility,
        seriesValueDescFormat = seriesA11yOptions && seriesA11yOptions.point &&
            seriesA11yOptions.point.valueDescriptionFormat,
        pointValueDescriptionFormat = seriesValueDescFormat ||
            chart.options.accessibility.point.valueDescriptionFormat,
        showXDescription = pick(
            series.xAxis &&
            series.xAxis.options.accessibility &&
            series.xAxis.options.accessibility.enabled,
            !chart.angular && series.type !== 'flowmap'
        ),
        xDesc = showXDescription ? getPointXDescription(point) : '',
        context = {
            point: point,
            index: defined(point.index) ? (point.index + 1) : '',
            xDescription: xDesc,
            value: getPointValue(point),
            separator: showXDescription ? ', ' : ''
        };

    return format(pointValueDescriptionFormat, context, chart);
}


/**
 * Return string with information about point.
 * @private
 */
function defaultPointDescriptionFormatter(
    point: Accessibility.PointComposition
): string {
    const series = point.series,
        shouldExposeSeriesName = series.chart.series.length > 1 ||
            series.options.name,
        valText = getPointValueDescription(point),
        description = point.options && point.options.accessibility &&
            point.options.accessibility.description,
        userDescText = description ? ' ' + description : '',
        seriesNameText = shouldExposeSeriesName ? ' ' + series.name + '.' : '',
        annotationsDesc = getPointAnnotationDescription(point),
        pointAnnotationsText = annotationsDesc ? ' ' + annotationsDesc : '';

    point.accessibility = point.accessibility || {};
    point.accessibility.valueDescription = valText;

    return valText + userDescText + seriesNameText + pointAnnotationsText;
}


/**
 * Set a11y props on a point element
 * @private
 * @param {Highcharts.Point} point
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} pointElement
 */
function setPointScreenReaderAttribs(
    point: Accessibility.PointComposition,
    pointElement: DOMElementType
): void {
    const series = point.series,
        seriesPointA11yOptions = series.options.accessibility?.point || {},
        a11yPointOptions = series.chart.options.accessibility.point || {},
        label = stripHTMLTags(
            (
                isString(seriesPointA11yOptions.descriptionFormat) &&
                format(
                    seriesPointA11yOptions.descriptionFormat,
                    point,
                    series.chart
                )
            ) ||
            seriesPointA11yOptions.descriptionFormatter?.(point) ||
            (
                isString(a11yPointOptions.descriptionFormat) &&
                format(
                    a11yPointOptions.descriptionFormat,
                    point,
                    series.chart
                )
            ) ||
            a11yPointOptions.descriptionFormatter?.(point) ||
            defaultPointDescriptionFormatter(point),
            series.chart.renderer.forExport
        );

    pointElement.setAttribute('role', 'img');
    pointElement.setAttribute('aria-label', label);
}


/**
 * Add accessible info to individual point elements of a series
 * @private
 * @param {Highcharts.Series} series
 */
function describePointsInSeries(
    series: Accessibility.SeriesComposition
): void {
    const setScreenReaderProps = shouldSetScreenReaderPropsOnPoints(series),
        setKeyboardProps = shouldSetKeyboardNavPropsOnPoints(series),
        shouldDescribeNullPoints = series.chart.options.accessibility
            .point.describeNull;

    if (setScreenReaderProps || setKeyboardProps) {
        series.points.forEach((point): void => {
            const pointEl = point.graphic && point.graphic.element ||
                    shouldAddMockPoint(point) && addMockPointElement(point),
                pointA11yDisabled = (
                    point.options &&
                    point.options.accessibility &&
                    point.options.accessibility.enabled === false
                );

            if (pointEl) {
                if (point.isNull && !shouldDescribeNullPoints) {
                    pointEl.setAttribute('aria-hidden', true);
                    return;
                }

                // We always set tabindex, as long as we are setting props.
                // When setting tabindex, also remove default outline to
                // avoid ugly border on click.
                pointEl.setAttribute('tabindex', '-1');
                if (!series.chart.styledMode) {
                    pointEl.style.outline = 'none';
                }

                if (setScreenReaderProps && !pointA11yDisabled) {
                    setPointScreenReaderAttribs(point, pointEl);
                } else {
                    pointEl.setAttribute('aria-hidden', true);
                }
            }
        });
    }
}


/**
 * Return string with information about series.
 * @private
 */
function defaultSeriesDescriptionFormatter(
    series: Accessibility.SeriesComposition
): string {
    const chart = series.chart,
        chartTypes = chart.types || [],
        description = getSeriesDescriptionText(series),
        shouldDescribeAxis = function (
            coll: ('xAxis'|'yAxis')
        ): (boolean|Axis) {
            return chart[coll] && chart[coll].length > 1 && series[coll];
        },
        seriesNumber = series.index + 1,
        xAxisInfo = getSeriesAxisDescriptionText(series, 'xAxis'),
        yAxisInfo = getSeriesAxisDescriptionText(series, 'yAxis'),
        summaryContext = {
            seriesNumber,
            series,
            chart
        },
        combinationSuffix = chartTypes.length > 1 ? 'Combination' : '',
        summary = chart.langFormat(
            'accessibility.series.summary.' + series.type + combinationSuffix,
            summaryContext
        ) || chart.langFormat(
            'accessibility.series.summary.default' + combinationSuffix,
            summaryContext
        ),
        axisDescription = (
            shouldDescribeAxis('yAxis') ? ' ' + yAxisInfo + '.' : ''
        ) + (
            shouldDescribeAxis('xAxis') ? ' ' + xAxisInfo + '.' : ''
        ),
        formatStr = pick(
            series.options.accessibility &&
                series.options.accessibility.descriptionFormat,
            chart.options.accessibility.series.descriptionFormat,
            ''
        );

    return format(formatStr, {
        seriesDescription: summary,
        authorDescription: (description ? ' ' + description : ''),
        axisDescription,
        series,
        chart,
        seriesNumber
    }, void 0);
}


/**
 * Set a11y props on a series element
 * @private
 * @param {Highcharts.Series} series
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} seriesElement
 */
function describeSeriesElement(
    series: Accessibility.SeriesComposition,
    seriesElement: DOMElementType
): void {
    const seriesA11yOptions = series.options.accessibility || {},
        a11yOptions = series.chart.options.accessibility,
        landmarkVerbosity = a11yOptions.landmarkVerbosity;

    // Handle role attribute
    if (seriesA11yOptions.exposeAsGroupOnly) {
        seriesElement.setAttribute('role', 'img');
    } else if (landmarkVerbosity === 'all') {
        seriesElement.setAttribute('role', 'region');
    } else {
        seriesElement.setAttribute('role', 'group');
    }

    seriesElement.setAttribute('tabindex', '-1');
    if (!series.chart.styledMode) {
        // Don't show browser outline on click, despite tabindex
        seriesElement.style.outline = 'none';
    }
    seriesElement.setAttribute(
        'aria-label',
        stripHTMLTags(
            (a11yOptions.series as any).descriptionFormatter &&
            (a11yOptions.series as any).descriptionFormatter(series) ||
            defaultSeriesDescriptionFormatter(series),
            series.chart.renderer.forExport
        )
    );
}


/**
 * Put accessible info on series and points of a series.
 * @param {Highcharts.Series} series The series to add info on.
 */
function describeSeries(
    series: Accessibility.SeriesComposition
): void {
    const chart = series.chart,
        firstPointEl = getSeriesFirstPointElement(series),
        seriesEl = getSeriesA11yElement(series),
        is3d = chart.is3d && chart.is3d();

    if (seriesEl) {
        // For some series types the order of elements do not match the
        // order of points in series. In that case we have to reverse them
        // in order for AT to read them out in an understandable order.
        // Due to z-index issues we cannot do this for 3D charts.
        if (seriesEl.lastChild === firstPointEl && !is3d) {
            reverseChildNodes(seriesEl);
        }

        describePointsInSeries(series);

        unhideChartElementFromAT(chart, seriesEl);

        if (shouldDescribeSeriesElement(series)) {
            describeSeriesElement(series, seriesEl);
        } else {
            seriesEl.removeAttribute('aria-label');
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

const SeriesDescriber = {
    defaultPointDescriptionFormatter,
    defaultSeriesDescriptionFormatter,
    describeSeries
};

export default SeriesDescriber;
