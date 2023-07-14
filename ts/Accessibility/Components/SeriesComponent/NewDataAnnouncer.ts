/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Handle announcing new data for a chart.
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
    AccessibilityAnnounceNewDataOptions
} from '../../Options/A11yOptions';
import type Chart from '../../../Core/Chart/Chart';
import type Series from '../../../Core/Series/Series';

import H from '../../../Core/Globals.js';
import U from '../../../Core/Utilities.js';
const {
    addEvent,
    defined
} = U;

import Announcer from '../../Utils/Announcer.js';
import ChartUtilities from '../../Utils/ChartUtilities.js';
const { getChartTitle } = ChartUtilities;
import EventProvider from '../../Utils/EventProvider.js';
import SeriesDescriber from './SeriesDescriber.js';
const {
    defaultPointDescriptionFormatter,
    defaultSeriesDescriptionFormatter
} = SeriesDescriber;


/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * @private
 */
function chartHasAnnounceEnabled(chart: Chart): boolean {
    return !!(chart.options.accessibility as any).announceNewData.enabled;
}


/**
 * @private
 */
function findPointInDataArray<T extends Accessibility.PointComposition>(
    point: T
): T {
    const candidates = (point.series.data as Array<T>).filter(
        (candidate): boolean => (
            point.x === candidate.x && point.y === candidate.y
        )
    );

    return candidates.length === 1 ? candidates[0] : point;
}


/**
 * Get array of unique series from two arrays
 * @private
 */
function getUniqueSeries(
    arrayA?: Array<Accessibility.SeriesComposition>,
    arrayB?: Array<Accessibility.SeriesComposition>
): Array<Accessibility.SeriesComposition> {
    const uniqueSeries = (arrayA || []).concat(arrayB || []).reduce(
        (acc, cur): Record<string, Accessibility.SeriesComposition> => {
            acc[cur.name + cur.index] = cur;
            return acc;
        },
        {} as Record<string, Accessibility.SeriesComposition>
    );

    return Object
        .keys(uniqueSeries)
        .map((ix): Accessibility.SeriesComposition => uniqueSeries[ix]);
}


/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 */
class NewDataAnnouncer {


    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: Accessibility.ChartComposition
    ) {
        this.chart = chart;
    }


    /* *
     *
     *  Public
     *
     * */

    public announcer: Announcer = void 0 as any;
    public chart: Accessibility.ChartComposition;
    public dirty: NewDataAnnouncer.DirtyObject = {
        allSeries: {}
    };
    public eventProvider: EventProvider = void 0 as any;
    public lastAnnouncementTime: number = 0;
    public queuedAnnouncement?: NewDataAnnouncer.QueuedAnnouncementObject;
    public queuedAnnouncementTimer?: number;


    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */


    /**
     * Initialize the new data announcer.
     * @private
     */
    public init(): void {
        const chart = this.chart;
        const announceOptions = (
            (chart.options.accessibility as any).announceNewData
        );
        const announceType = announceOptions.interruptUser ?
            'assertive' : 'polite';

        this.lastAnnouncementTime = 0;
        this.dirty = {
            allSeries: {}
        };

        this.eventProvider = new EventProvider();
        this.announcer = new Announcer(chart, announceType);
        this.addEventListeners();
    }


    /**
     * Remove traces of announcer.
     * @private
     */
    public destroy(): void {
        this.eventProvider.removeAddedEvents();
        this.announcer.destroy();
    }


    /**
     * Add event listeners for the announcer
     * @private
     */
    public addEventListeners(): void {
        const announcer = this,
            chart = this.chart,
            e = this.eventProvider;

        e.addEvent(chart, 'afterApplyDrilldown', function (): void {
            announcer.lastAnnouncementTime = 0;
        });

        e.addEvent(chart, 'afterAddSeries', function (
            e: { series: Accessibility.SeriesComposition }
        ): void {
            announcer.onSeriesAdded(e.series);
        });

        e.addEvent(chart, 'redraw', function (): void {
            announcer.announceDirtyData();
        });
    }


    /**
     * On new data series added, update dirty list.
     * @private
     * @param {Highcharts.Series} series
     */
    public onSeriesAdded(
        series: Accessibility.SeriesComposition
    ): void {
        if (chartHasAnnounceEnabled(this.chart)) {
            this.dirty.hasDirty = true;
            this.dirty.allSeries[series.name + series.index] = series;
            // Add it to newSeries storage unless we already have one
            this.dirty.newSeries = defined(this.dirty.newSeries) ?
                void 0 : series;
        }
    }


    /**
     * Gather what we know and announce the data to user.
     * @private
     */
    public announceDirtyData(): void {
        const chart = this.chart,
            announcer = this;

        if (
            (chart.options.accessibility as any).announceNewData &&
            this.dirty.hasDirty
        ) {
            let newPoint = this.dirty.newPoint;

            // If we have a single new point, see if we can find it in the
            // data array. Otherwise we can only pass through options to
            // the description builder, and it is a bit sparse in info.
            if (newPoint) {
                newPoint = findPointInDataArray(newPoint);
            }

            this.queueAnnouncement(
                Object
                    .keys(this.dirty.allSeries)
                    .map((ix): Accessibility.SeriesComposition =>
                        announcer.dirty.allSeries[ix]),
                this.dirty.newSeries,
                newPoint
            );

            // Reset
            this.dirty = {
                allSeries: {}
            };
        }
    }


    /**
     * Announce to user that there is new data.
     * @private
     * @param {Array<Highcharts.Series>} dirtySeries
     *          Array of series with new data.
     * @param {Highcharts.Series} [newSeries]
     *          If a single new series was added, a reference to this series.
     * @param {Highcharts.Point} [newPoint]
     *          If a single point was added, a reference to this point.
     */
    public queueAnnouncement(
        dirtySeries: Array<Accessibility.SeriesComposition>,
        newSeries?: Accessibility.SeriesComposition,
        newPoint?: Accessibility.PointComposition
    ): void {
        const chart = this.chart;
        const annOptions: AccessibilityAnnounceNewDataOptions =
            (chart.options.accessibility as any).announceNewData;

        if (annOptions.enabled) {
            const now = +new Date();
            const dTime = now - this.lastAnnouncementTime;
            const time = Math.max(
                0,
                (annOptions.minAnnounceInterval as any) - dTime
            );

            // Add series from previously queued announcement.
            const allSeries = getUniqueSeries(
                this.queuedAnnouncement && this.queuedAnnouncement.series,
                dirtySeries
            );

            // Build message and announce
            const message = this.buildAnnouncementMessage(
                allSeries, newSeries, newPoint
            );
            if (message) {
                // Is there already one queued?
                if (this.queuedAnnouncement) {
                    clearTimeout(this.queuedAnnouncementTimer);
                }

                // Build the announcement
                this.queuedAnnouncement = {
                    time: now,
                    message: message,
                    series: allSeries
                };

                // Queue the announcement
                this.queuedAnnouncementTimer = setTimeout((): void => {
                    if (this && this.announcer) {
                        this.lastAnnouncementTime = +new Date();
                        this.announcer.announce(
                            (this.queuedAnnouncement as any).message
                        );
                        delete this.queuedAnnouncement;
                        delete this.queuedAnnouncementTimer;
                    }
                }, time);
            }
        }
    }


    /**
     * Get announcement message for new data.
     * @private
     * @param {Array<Highcharts.Series>} dirtySeries
     *          Array of series with new data.
     * @param {Highcharts.Series} [newSeries]
     *          If a single new series was added, a reference to this series.
     * @param {Highcharts.Point} [newPoint]
     *          If a single point was added, a reference to this point.
     *
     * @return {string|null}
     * The announcement message to give to user.
     */
    public buildAnnouncementMessage(
        dirtySeries: Array<Accessibility.SeriesComposition>,
        newSeries?: Accessibility.SeriesComposition,
        newPoint?: Accessibility.PointComposition
    ): (string|null) {
        const chart = this.chart,
            annOptions = chart.options.accessibility.announceNewData;

        // User supplied formatter?
        if (annOptions.announcementFormatter) {
            const formatterRes = annOptions.announcementFormatter(
                dirtySeries, newSeries, newPoint
            );
            if (formatterRes !== false) {
                return formatterRes.length ? formatterRes : null;
            }
        }

        // Default formatter - use lang options
        const multiple = H.charts && H.charts.length > 1 ?
                'Multiple' : 'Single',
            langKey = newSeries ? 'newSeriesAnnounce' + multiple :
                newPoint ? 'newPointAnnounce' + multiple : 'newDataAnnounce',
            chartTitle = getChartTitle(chart);

        return chart.langFormat(
            'accessibility.announceNewData.' + langKey, {
                chartTitle: chartTitle,
                seriesDesc: newSeries ?
                    defaultSeriesDescriptionFormatter(newSeries) :
                    null,
                pointDesc: newPoint ?
                    defaultPointDescriptionFormatter(newPoint) :
                    null,
                point: newPoint,
                series: newSeries
            }
        );
    }

}


/* *
 *
 *  Class Namespace
 *
 * */

namespace NewDataAnnouncer {

    /* *
     *
     *  Declarations
     *
     * */

    export interface DirtyObject {
        allSeries: Record<string, Accessibility.SeriesComposition>;
        hasDirty?: boolean;
        newPoint?: Accessibility.PointComposition;
        newSeries?: Accessibility.SeriesComposition;
    }

    export interface QueuedAnnouncementObject {
        message: string;
        series: Array<Accessibility.SeriesComposition>;
        time: number;
    }


    /* *
     *
     *  Static Properties
     *
     * */

    export const composedMembers: Array<unknown> = [];


    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * @private
     */
    export function compose(
        SeriesClass: typeof Series
    ): void {

        if (U.pushUnique(composedMembers, SeriesClass)) {
            addEvent(
                SeriesClass as typeof Accessibility.SeriesComposition,
                'addPoint',
                seriesOnAddPoint
            );
            addEvent(
                SeriesClass as typeof Accessibility.SeriesComposition,
                'updatedData',
                seriesOnUpdatedData
            );
        }

    }


    /**
     * On new point added, update dirty list.
     * @private
     * @param {Highcharts.Point} point
     */
    function seriesOnAddPoint(
        this: Accessibility.SeriesComposition,
        e: { point: Accessibility.PointComposition }
    ): void {
        const chart = this.chart,
            newDataAnnouncer = this.newDataAnnouncer;

        if (
            newDataAnnouncer &&
            newDataAnnouncer.chart === chart &&
            chartHasAnnounceEnabled(chart)
        ) {
            // Add it to newPoint storage unless we already have one
            newDataAnnouncer.dirty.newPoint = (
                defined(newDataAnnouncer.dirty.newPoint) ?
                    void 0 :
                    e.point
            );
        }
    }


    /**
     * On new data in the series, make sure we add it to the dirty list.
     * @private
     * @param {Highcharts.Series} series
     */
    function seriesOnUpdatedData(
        this: Accessibility.SeriesComposition
    ): void {
        const chart = this.chart,
            newDataAnnouncer = this.newDataAnnouncer;

        if (
            newDataAnnouncer &&
            newDataAnnouncer.chart === chart &&
            chartHasAnnounceEnabled(chart)
        ) {
            newDataAnnouncer.dirty.hasDirty = true;
            newDataAnnouncer.dirty.allSeries[this.name + this.index] = this;
        }
    }


}


/* *
 *
 *  Default Export
 *
 * */

export default NewDataAnnouncer;
