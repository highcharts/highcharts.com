/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Handle keyboard navigation for series.
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
import type {
    AccessibilityKeyboardNavigationSeriesNavigationOptions
} from '../../Options/A11yOptions';

import Chart from '../../../Core/Chart/Chart.js';
import Point from '../../../Core/Series/Point.js';
import Series from '../../../Core/Series/Series.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { seriesTypes } = SeriesRegistry;
import H from '../../../Core/Globals.js';
const { doc } = H;
import U from '../../../Shared/Utilities.js';

import KeyboardNavigationHandler from '../../KeyboardNavigationHandler.js';
import EventProvider from '../../Utils/EventProvider.js';
import ChartUtilities from '../../Utils/ChartUtilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const {
    defined
} = OH;
const { fireEvent } = EH;
const {
    getPointFromXY,
    getSeriesFromName,
    scrollAxisToPoint
} = ChartUtilities;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../../Core/Chart/ChartLike'{
    interface ChartLike {
        highlightedPoint?: Point;
    }
}

declare module '../../../Core/Series/SeriesLike' {
    interface SeriesLike {
        /** @requires modules/accessibility */
        keyboardMoveVertical?: boolean;
    }
}

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Get the index of a point in a series. This is needed when using e.g. data
 * grouping.
 *
 * @private
 * @function getPointIndex
 * @param {Highcharts.AccessibilityPoint} point
 * The point to find index of.
 * @return {number|undefined}
 * The index in the series.points array of the point.
 */
function getPointIndex(point: Point): (number|undefined) {
    const index = point.index,
        points = point.series.points;
    let i = points.length;

    if (points[index as any] !== point) {
        while (i--) {
            if (points[i] === point) {
                return i;
            }
        }
    } else {
        return index;
    }
}


/**
 * Determine if series navigation should be skipped
 * @private
 */
function isSkipSeries(
    series: Accessibility.SeriesComposition
): (boolean|number|undefined) {
    const a11yOptions = series.chart.options.accessibility,
        seriesNavOptions = a11yOptions.keyboardNavigation.seriesNavigation,
        seriesA11yOptions = series.options.accessibility || {},
        seriesKbdNavOptions = seriesA11yOptions.keyboardNavigation;

    return seriesKbdNavOptions && seriesKbdNavOptions.enabled === false ||
        seriesA11yOptions.enabled === false ||
        series.options.enableMouseTracking === false || // #8440
        !series.visible ||
        // Skip all points in a series where pointNavigationEnabledThreshold is
        // reached
        (
            seriesNavOptions.pointNavigationEnabledThreshold &&
            +seriesNavOptions.pointNavigationEnabledThreshold <=
            series.points.length
        );
}


/**
 * Determine if navigation for a point should be skipped
 * @private
 */
function isSkipPoint(
    point: Accessibility.PointComposition
): (boolean|number|undefined) {
    const a11yOptions = point.series.chart.options.accessibility;
    const pointA11yDisabled = (
        point.options.accessibility &&
        point.options.accessibility.enabled === false
    );

    return point.isNull &&
        a11yOptions.keyboardNavigation.seriesNavigation.skipNullPoints ||
        point.visible === false ||
        point.isInside === false ||
        pointA11yDisabled ||
        isSkipSeries(point.series);
}


/**
 * Get the first point that is not a skip point in this series.
 * @private
 */
function getFirstValidPointInSeries(
    series: SeriesKeyboardNavigation.SeriesComposition
): SeriesKeyboardNavigation.PointComposition|null {
    const points = series.points || [],
        len = points.length;
    for (let i = 0; i < len; ++i) {
        if (!isSkipPoint(points[i])) {
            return points[i];
        }
    }
    return null;
}


/**
 * Get the first point that is not a skip point in this chart.
 * @private
 */
function getFirstValidPointInChart(
    chart: SeriesKeyboardNavigation.ChartComposition
): SeriesKeyboardNavigation.PointComposition|null {
    const series = chart.series || [],
        len = series.length;
    for (let i = 0; i < len; ++i) {
        if (!isSkipSeries(series[i])) {
            const point = getFirstValidPointInSeries(series[i]);
            if (point) {
                return point;
            }
        }
    }
    return null;
}


/**
 * @private
 */
function highlightLastValidPointInChart(
    chart: SeriesKeyboardNavigation.ChartComposition
): (boolean|SeriesKeyboardNavigation.PointComposition) {
    const numSeries = chart.series.length;
    let i = numSeries,
        res: (boolean|SeriesKeyboardNavigation.PointComposition) = false;

    while (i--) {
        chart.highlightedPoint = chart.series[i].points[
            chart.series[i].points.length - 1
        ];
        // Highlight first valid point in the series will also
        // look backwards. It always starts from currently
        // highlighted point.
        res = chart.series[i].highlightNextValidPoint();
        if (res) {
            break;
        }
    }

    return res;
}


/**
 * After drilling down/up, we need to set focus to the first point for
 * screen readers and keyboard nav.
 * @private
 */
function updateChartFocusAfterDrilling(
    chart: SeriesKeyboardNavigation.ChartComposition
): void {
    const point = getFirstValidPointInChart(chart);
    if (point) {
        point.highlight(false); // Do not visually highlight
    }
}


/**
 * Highlight the first point in chart that is not a skip point
 * @private
 */
function highlightFirstValidPointInChart(
    chart: SeriesKeyboardNavigation.ChartComposition
): (boolean|SeriesKeyboardNavigation.PointComposition) {
    delete chart.highlightedPoint;
    const point = getFirstValidPointInChart(chart);
    return point ? point.highlight() : false;
}


/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.SeriesKeyboardNavigation
 */
class SeriesKeyboardNavigation {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: SeriesKeyboardNavigation.ChartComposition,
        keyCodes: Record<string, number>
    ) {
        this.keyCodes = keyCodes;
        this.chart = chart;
    }


    /* *
     *
     *  Properties
     *
     * */

    public chart: SeriesKeyboardNavigation.ChartComposition;
    public eventProvider?: EventProvider;
    public keyCodes: Record<string, number>;
    public lastDrilledDownPoint?: SeriesKeyboardNavigation.DrilldownObject;


    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Init the keyboard navigation
     */
    public init(): void {
        const keyboardNavigation = this,
            chart = this.chart,
            e = this.eventProvider = new EventProvider();

        e.addEvent(Series, 'destroy', function (): void {
            return keyboardNavigation.onSeriesDestroy(this);
        });

        e.addEvent(chart, 'afterApplyDrilldown', function (): void {
            updateChartFocusAfterDrilling(this);
        });

        e.addEvent(chart, 'drilldown', function (
            e: { point: Point }
        ): void {
            const point = e.point,
                series = point.series;

            keyboardNavigation.lastDrilledDownPoint = {
                x: point.x,
                y: point.y,
                seriesName: series ? series.name : ''
            };
        });

        e.addEvent(chart, 'drillupall', function (): void {
            setTimeout(function (): void {
                keyboardNavigation.onDrillupAll();
            }, 10);
        });

        // Heatmaps et al. alter z-index in setState, causing elements
        // to lose focus
        e.addEvent(Point, 'afterSetState', function (): void {
            const point = this;
            const pointEl = point.graphic && point.graphic.element;
            const focusedElement = doc.activeElement;
            // VO brings focus with it to container, causing series nav to run.
            // If then navigating with virtual cursor, it is possible to leave
            // keyboard nav module state on the data points and still activate
            // proxy buttons.
            const focusedElClassName = (
                focusedElement && focusedElement.getAttribute('class')
            );
            const isProxyFocused = focusedElClassName &&
                focusedElClassName.indexOf('highcharts-a11y-proxy-button') > -1;

            if (
                chart.highlightedPoint === point &&
                focusedElement !== pointEl &&
                !isProxyFocused &&
                pointEl &&
                pointEl.focus
            ) {
                pointEl.focus();
            }
        });
    }


    /**
     * After drillup we want to find the point that was drilled down to and
     * highlight it.
     * @private
     */
    public onDrillupAll(): void {
        const last = this.lastDrilledDownPoint,
            chart = this.chart,
            series = last && getSeriesFromName(chart, last.seriesName);
        let point;

        if (last && series && defined(last.x) && defined(last.y)) {
            point = getPointFromXY(series, last.x, last.y);
        }
        point = point || getFirstValidPointInChart(chart);

        // Container focus can be lost on drillup due to deleted elements.
        if (chart.container) {
            chart.container.focus();
        }

        if (point && point.highlight) {
            point.highlight(false); // Do not visually highlight
        }
    }


    /**
     * @private
     */
    public getKeyboardNavigationHandler(): KeyboardNavigationHandler {
        const keyboardNavigation = this,
            keys = this.keyCodes,
            chart = this.chart,
            inverted = chart.inverted;

        return new KeyboardNavigationHandler(chart, {
            keyCodeMap: [
                [inverted ? [keys.up, keys.down] : [keys.left, keys.right],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number
                    ): number {
                        return keyboardNavigation.onKbdSideways(this, keyCode);
                    }],

                [inverted ? [keys.left, keys.right] : [keys.up, keys.down],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number
                    ): number {
                        return keyboardNavigation.onKbdVertical(this, keyCode);
                    }],

                [[keys.enter, keys.space],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number,
                        event: KeyboardEvent
                    ): number {
                        const point = chart.highlightedPoint;
                        if (point) {
                            (event as any).point = point;
                            fireEvent(point.series, 'click', event);
                            point.firePointEvent('click');
                        }
                        return this.response.success;
                    }],

                [[keys.home],
                    function (this: KeyboardNavigationHandler): number {
                        highlightFirstValidPointInChart(chart);
                        return this.response.success;
                    }],

                [[keys.end],
                    function (this: KeyboardNavigationHandler): number {
                        highlightLastValidPointInChart(chart);
                        return this.response.success;
                    }],

                [[keys.pageDown, keys.pageUp],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number
                    ): number {
                        chart.highlightAdjacentSeries(
                            keyCode === keys.pageDown
                        );
                        return this.response.success;
                    }]
            ],

            init: function (this: KeyboardNavigationHandler): number {
                return keyboardNavigation.onHandlerInit(this);
            },

            validate: function (): boolean {
                return !!getFirstValidPointInChart(chart);
            },

            terminate: function (): void {
                return keyboardNavigation.onHandlerTerminate();
            }
        });
    }


    /**
     * @private
     * @param {Highcharts.KeyboardNavigationHandler} handler
     * @param {number} keyCode
     * @return {number}
     * response
     */
    public onKbdSideways(
        handler: KeyboardNavigationHandler,
        keyCode: number
    ): number {
        const keys = this.keyCodes,
            isNext = keyCode === keys.right || keyCode === keys.down;

        return this.attemptHighlightAdjacentPoint(handler, isNext);
    }


    /**
     * When keyboard navigation inits.
     * @private
     * @param {Highcharts.KeyboardNavigationHandler} handler The handler object
     * @return {number}
     * response
     */
    public onHandlerInit(
        handler: KeyboardNavigationHandler
    ): number {
        const chart = this.chart,
            kbdNavOptions = chart.options.accessibility.keyboardNavigation;

        if (
            kbdNavOptions.seriesNavigation.rememberPointFocus &&
            chart.highlightedPoint
        ) {
            chart.highlightedPoint.highlight();
        } else {
            highlightFirstValidPointInChart(chart);
        }

        return handler.response.success;
    }


    /**
     * @private
     * @param {Highcharts.KeyboardNavigationHandler} handler
     * @param {number} keyCode
     * @return {number}
     * response
     */
    public onKbdVertical(
        handler: KeyboardNavigationHandler,
        keyCode: number
    ): number {
        const chart = this.chart,
            keys = this.keyCodes,
            isNext = keyCode === keys.down || keyCode === keys.right,
            navOptions: (
                AccessibilityKeyboardNavigationSeriesNavigationOptions
            ) = (chart.options.accessibility as any).keyboardNavigation
                .seriesNavigation;

        // Handle serialized mode, act like left/right
        if (navOptions.mode && navOptions.mode === 'serialize') {
            return this.attemptHighlightAdjacentPoint(handler, isNext);
        }

        // Normal mode, move between series
        const highlightMethod: (
            'highlightAdjacentPointVertical'|'highlightAdjacentSeries'
        ) = (
            chart.highlightedPoint &&
            chart.highlightedPoint.series.keyboardMoveVertical
        ) ?
            'highlightAdjacentPointVertical' :
            'highlightAdjacentSeries';

        chart[highlightMethod](isNext);

        return handler.response.success;
    }


    /**
     * @private
     */
    public onHandlerTerminate(): void {
        const chart = this.chart,
            kbdNavOptions = chart.options.accessibility.keyboardNavigation;

        if (chart.tooltip) {
            chart.tooltip.hide(0);
        }

        const hoverSeries = (
            chart.highlightedPoint && chart.highlightedPoint.series
        );
        if (hoverSeries && hoverSeries.onMouseOut) {
            hoverSeries.onMouseOut();
        }

        if (chart.highlightedPoint && chart.highlightedPoint.onMouseOut) {
            chart.highlightedPoint.onMouseOut();
        }

        if (!kbdNavOptions.seriesNavigation.rememberPointFocus) {
            delete chart.highlightedPoint;
        }
    }


    /**
     * Function that attempts to highlight next/prev point. Handles wrap around.
     * @private
     */
    public attemptHighlightAdjacentPoint(
        handler: KeyboardNavigationHandler,
        directionIsNext: boolean
    ): number {
        const chart = this.chart,
            wrapAround = (chart.options.accessibility as any).keyboardNavigation
                .wrapAround,
            highlightSuccessful = chart.highlightAdjacentPoint(directionIsNext);

        if (!highlightSuccessful) {
            if (wrapAround && (
                directionIsNext ?
                    highlightFirstValidPointInChart(chart) :
                    highlightLastValidPointInChart(chart)
            )) {
                return handler.response.success;
            }
            return handler.response[directionIsNext ? 'next' : 'prev'];
        }

        return handler.response.success;
    }


    /**
     * @private
     */
    public onSeriesDestroy(
        series: Series
    ): void {
        const chart = this.chart,
            currentHighlightedPointDestroyed = chart.highlightedPoint &&
                chart.highlightedPoint.series === series;

        if (currentHighlightedPointDestroyed) {
            delete chart.highlightedPoint;
            if (chart.focusElement) {
                chart.focusElement.removeFocusBorder();
            }
        }
    }


    /**
     * @private
     */
    public destroy(): void {
        (this.eventProvider as any).removeAddedEvents();
    }

}


/* *
 *
 *  Class Namespace
 *
 * */

namespace SeriesKeyboardNavigation {


    /* *
     *
     *  Declarations
     *
     * */

    export declare class ChartComposition extends Accessibility.ChartComposition {
        highlightedPoint?: PointComposition;
        series: Array<SeriesComposition>;
        highlightAdjacentPoint(next: boolean): (boolean|PointComposition);
        highlightAdjacentPointVertical(
            down: boolean
        ): (boolean|PointComposition);
        highlightAdjacentSeries(down: boolean): (boolean|PointComposition);
    }

    export interface DrilldownObject {
        x: (number|null);
        y: (number|null|undefined);
        seriesName: string;
    }

    export declare class PointComposition extends Accessibility.PointComposition {
        series: SeriesComposition;
        highlight(highlightVisually?: boolean): PointComposition;
    }

    export declare class SeriesComposition extends Accessibility.SeriesComposition {
        chart: ChartComposition;
        data: Array<PointComposition>;
        pointClass: typeof PointComposition;
        points: Array<PointComposition>;
        highlightNextValidPoint(): (boolean|PointComposition);
    }


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
     * Function to highlight next/previous point in chart.
     *
     * @private
     * @function Highcharts.Chart#highlightAdjacentPoint
     *
     * @param {boolean} next
     * Flag for the direction.
     *
     * @return {Highcharts.Point|boolean}
     * Returns highlighted point on success, false on failure (no adjacent point
     * to highlight in chosen direction).
     */
    function chartHighlightAdjacentPoint(
        this: ChartComposition,
        next: boolean
    ): (boolean|PointComposition) {
        const chart = this,
            series = chart.series,
            curPoint = chart.highlightedPoint,
            curPointIndex = curPoint && getPointIndex(curPoint) || 0,
            curPoints = curPoint && curPoint.series.points || [],
            lastSeries = chart.series && chart.series[chart.series.length - 1],
            lastPoint = lastSeries &&
                lastSeries.points &&
                lastSeries.points[lastSeries.points.length - 1];

        let newSeries: SeriesComposition,
            newPoint: PointComposition;

        // If no points, return false
        if (!series[0] || !series[0].points) {
            return false;
        }

        if (!curPoint) {
            // No point is highlighted yet. Try first/last point depending on
            // move direction
            newPoint = next ? series[0].points[0] : lastPoint;
        } else {
            // We have a highlighted point. Grab next/prev point & series.
            newSeries = series[
                (curPoint.series.index as any) + (next ? 1 : -1)
            ];
            newPoint = curPoints[curPointIndex + (next ? 1 : -1)];
            if (!newPoint && newSeries) {
                // Done with this series, try next one
                newPoint = newSeries.points[
                    next ? 0 : newSeries.points.length - 1
                ];
            }

            // If there is no adjacent point, we return false
            if (!newPoint) {
                return false;
            }
        }

        // Recursively skip points
        if (isSkipPoint(newPoint)) {
            // If we skip this whole series, move to the end of the series
            // before we recurse, just to optimize
            newSeries = newPoint.series;
            if (isSkipSeries(newSeries)) {
                chart.highlightedPoint = next ?
                    newSeries.points[newSeries.points.length - 1] :
                    newSeries.points[0];
            } else {
                // Otherwise, just move one point
                chart.highlightedPoint = newPoint;
            }
            // Retry
            return chart.highlightAdjacentPoint(next);
        }

        // There is an adjacent point, highlight it
        return newPoint.highlight();
    }


    /**
     * Highlight the closest point vertically.
     * @private
     */
    function chartHighlightAdjacentPointVertical(
        this: ChartComposition,
        down: boolean
    ): (boolean|PointComposition) {
        const curPoint: PointComposition = this.highlightedPoint as any;
        let minDistance = Infinity,
            bestPoint: (PointComposition|undefined);

        if (!defined(curPoint.plotX) || !defined(curPoint.plotY)) {
            return false;
        }

        this.series.forEach((series): void => {
            if (isSkipSeries(series)) {
                return;
            }

            series.points.forEach((point): void => {
                if (!defined(point.plotY) || !defined(point.plotX) ||
                    point === curPoint) {
                    return;
                }

                let yDistance = point.plotY - (curPoint.plotY as any);
                const width = Math.abs(point.plotX - (curPoint.plotX as any)),
                    distance = Math.abs(yDistance) * Math.abs(yDistance) +
                        width * width * 4; // Weigh horizontal distance highly

                // Reverse distance number if axis is reversed
                if (series.yAxis && series.yAxis.reversed) {
                    yDistance *= -1;
                }

                if (
                    yDistance <= 0 && down || yDistance >= 0 && !down ||
                    distance < 5 || // Points in same spot => infinite loop
                    isSkipPoint(point)
                ) {
                    return;
                }

                if (distance < minDistance) {
                    minDistance = distance;
                    bestPoint = point;
                }
            });
        });

        return bestPoint ? bestPoint.highlight() : false;
    }


    /**
     * Highlight next/previous series in chart. Returns false if no adjacent
     * series in the direction, otherwise returns new highlighted point.
     * @private
     */
    function chartHighlightAdjacentSeries(
        this: ChartComposition,
        down: boolean
    ): (boolean|PointComposition) {
        const chart = this,
            curPoint: PointComposition = chart.highlightedPoint as any,
            lastSeries = chart.series && chart.series[chart.series.length - 1],
            lastPoint = lastSeries && lastSeries.points &&
                        lastSeries.points[lastSeries.points.length - 1];
        let newSeries: SeriesComposition,
            newPoint: (undefined|PointComposition),
            adjacentNewPoint: (boolean|PointComposition);

        // If no point is highlighted, highlight the first/last point
        if (!chart.highlightedPoint) {
            newSeries = down ? (chart.series && chart.series[0]) : lastSeries;
            newPoint = down ?
                (newSeries && newSeries.points && newSeries.points[0]) :
                lastPoint;
            return newPoint ? newPoint.highlight() : false;
        }

        newSeries = (
            chart.series[(curPoint.series.index as any) + (down ? -1 : 1)]
        );

        if (!newSeries) {
            return false;
        }

        // We have a new series in this direction, find the right point
        // Weigh xDistance as counting much higher than Y distance
        newPoint = getClosestPoint(curPoint, newSeries, 4);

        if (!newPoint) {
            return false;
        }

        // New series and point exists, but we might want to skip it
        if (isSkipSeries(newSeries)) {
            // Skip the series
            newPoint.highlight();
            // Try recurse
            adjacentNewPoint = chart.highlightAdjacentSeries(down);
            if (!adjacentNewPoint) {
                // Recurse failed
                curPoint.highlight();
                return false;
            }
            // Recurse succeeded
            return adjacentNewPoint;
        }

        // Highlight the new point or any first valid point back or forwards
        // from it
        newPoint.highlight();
        return newPoint.series.highlightNextValidPoint();
    }


    /**
     * @private
     */
    export function compose(
        ChartClass: typeof Chart,
        PointClass: typeof Point,
        SeriesClass: typeof Series
    ): void {

        if (pushUnique(composedMembers, ChartClass)) {
            const chartProto = ChartClass.prototype as ChartComposition;

            chartProto.highlightAdjacentPoint = chartHighlightAdjacentPoint;
            chartProto.highlightAdjacentPointVertical = (
                chartHighlightAdjacentPointVertical
            );
            chartProto.highlightAdjacentSeries = chartHighlightAdjacentSeries;
        }

        if (pushUnique(composedMembers, PointClass)) {
            const pointProto = PointClass.prototype as PointComposition;

            pointProto.highlight = pointHighlight;
        }

        if (pushUnique(composedMembers, SeriesClass)) {
            const seriesProto = SeriesClass.prototype as SeriesComposition;

            /**
             * Set for which series types it makes sense to move to the closest
             * point with up/down arrows, and which series types should just
             * move to next series.
             * @private
             */
            seriesProto.keyboardMoveVertical = true;
            ([
                'column',
                'gantt',
                'pie'
            ] as Array<(
                'column'|
                'gantt'|
                'pie'
            )>).forEach((type): void => {
                if (seriesTypes[type]) {
                    seriesTypes[type].prototype.keyboardMoveVertical = false;
                }
            });

            seriesProto.highlightNextValidPoint = (
                seriesHighlightNextValidPoint
            );
        }

    }


    /**
     * Get the point in a series that is closest (in pixel distance) to a
     * reference point. Optionally supply weight factors for x and y directions.
     * @private
     */
    function getClosestPoint(
        point: PointComposition,
        series: SeriesComposition,
        xWeight?: number,
        yWeight?: number
    ): (PointComposition|undefined) {
        let minDistance = Infinity,
            dPoint: PointComposition,
            minIx: (number|undefined),
            distance: number,
            i = series.points.length;
        const hasUndefinedPosition = (point: PointComposition): boolean => (
            !(defined(point.plotX) && defined(point.plotY))
        );

        if (hasUndefinedPosition(point)) {
            return;
        }

        while (i--) {
            dPoint = series.points[i];

            if (hasUndefinedPosition(dPoint)) {
                continue;
            }

            distance = ((point.plotX as any) - (dPoint.plotX as any)) *
                    ((point.plotX as any) - (dPoint.plotX as any)) *
                    (xWeight || 1) +
                    ((point.plotY as any) - (dPoint.plotY as any)) *
                    ((point.plotY as any) - (dPoint.plotY as any)) *
                    (yWeight || 1);

            if (distance < minDistance) {
                minDistance = distance;
                minIx = i;
            }
        }

        return defined(minIx) ? series.points[minIx] : void 0;
    }


    /**
     * Highlights a point (show tooltip, display hover state, focus element).
     *
     * @private
     * @function Highcharts.Point#highlight
     *
     * @return {Highcharts.Point}
     *         This highlighted point.
     */
    function pointHighlight(
        this: PointComposition,
        highlightVisually: boolean = true
    ): PointComposition {
        const chart = this.series.chart,
            tooltipElement = chart.tooltip?.label?.element;

        if (!this.isNull && highlightVisually) {
            this.onMouseOver(); // Show the hover marker and tooltip
        } else {
            if (chart.tooltip) {
                chart.tooltip.hide(0);
            }
            // Do not call blur on the element, as it messes up the focus of the
            // div element of the chart
        }

        scrollAxisToPoint(this);

        // We focus only after calling onMouseOver because the state change can
        // change z-index and mess up the element.
        if (this.graphic) {
            chart.setFocusToElement(this.graphic);
            if (!highlightVisually && chart.focusElement) {
                chart.focusElement.removeFocusBorder();
            }
        }

        chart.highlightedPoint = this;

        // Get position of the tooltip.
        const tooltipTop = tooltipElement?.getBoundingClientRect().top;

        if (tooltipElement && tooltipTop && tooltipTop < 0) {
            // Calculate scroll position.
            const scrollTop = window.scrollY,
                newScrollTop = scrollTop + tooltipTop;

            // Scroll window to new position.
            window.scrollTo({
                behavior: 'smooth',
                top: newScrollTop
            });
        }

        return this;
    }


    /**
     * Highlight first valid point in a series. Returns the point if
     * successfully highlighted, otherwise false. If there is a highlighted
     * point in the series, use that as starting point.
     *
     * @private
     * @function Highcharts.Series#highlightNextValidPoint
     */
    function seriesHighlightNextValidPoint(
        this: SeriesComposition
    ): (boolean|PointComposition) {
        const curPoint = this.chart.highlightedPoint,
            start: number = (curPoint && curPoint.series) === this ?
                getPointIndex(curPoint as any) as any :
                0,
            points = this.points,
            len = points.length;

        if (points && len) {
            for (let i = start; i < len; ++i) {
                if (!isSkipPoint(points[i])) {
                    return points[i].highlight();
                }
            }
            for (let j = start; j >= 0; --j) {
                if (!isSkipPoint(points[j])) {
                    return points[j].highlight();
                }
            }
        }
        return false;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default SeriesKeyboardNavigation;
