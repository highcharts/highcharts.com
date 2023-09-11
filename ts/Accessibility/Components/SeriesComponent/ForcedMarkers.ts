/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Handle forcing series markers.
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
    PointMarkerOptions,
    PointOptions
} from '../../../Core/Series/PointOptions';
import type Series from '../../../Core/Series/Series.js';
import type SeriesOptions from '../../../Core/Series/SeriesOptions';

import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const {
    merge
} = OH;
const { addEvent } = EH;

/* *
 *
 *  Composition
 *
 * */

namespace ForcedMarkersComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class PointComposition extends Accessibility.PointComposition {
        hasForcedA11yMarker?: boolean;
    }


    export declare class SeriesComposition extends Accessibility.SeriesComposition {
        a11yMarkersForced?: boolean;
        points: Array<PointComposition>;
        resetA11yMarkerOptions?: PointMarkerOptions;
    }


    /* *
     *
     *  Compositions
     *
     * */

    const composedMembers: Array<unknown> = [];


    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */


    /**
     * @private
     */
    export function compose<T extends typeof Series>(
        SeriesClass: T
    ): void {

        if (pushUnique(composedMembers, SeriesClass)) {
            addEvent(
                SeriesClass as typeof SeriesComposition,
                'afterSetOptions',
                seriesOnAfterSetOptions
            );
            addEvent(
                SeriesClass as typeof SeriesComposition,
                'render',
                seriesOnRender
            );

            addEvent(
                SeriesClass as typeof SeriesComposition,
                'afterRender',
                seriesOnAfterRender
            );
        }

    }


    /**
     * @private
     */
    function forceZeroOpacityMarkerOptions(
        options: (PointOptions|SeriesOptions)
    ): void {
        merge(true, options, {
            marker: {
                enabled: true,
                states: {
                    normal: {
                        opacity: 0
                    }
                }
            }
        });
    }


    /**
     * @private
     */
    function getPointMarkerOpacity(
        pointOptions: PointOptions
    ): number|undefined {
        return (pointOptions.marker as any).states &&
            (pointOptions.marker as any).states.normal &&
            (pointOptions.marker as any).states.normal.opacity;
    }


    /**
     * @private
     */
    function handleForcePointMarkers(series: SeriesComposition): void {
        let i = series.points.length;

        while (i--) {
            const point = series.points[i];
            const pointOptions = point.options;
            const hadForcedMarker = point.hasForcedA11yMarker;
            delete point.hasForcedA11yMarker;

            if (pointOptions.marker) {
                const isStillForcedMarker = hadForcedMarker &&
                    getPointMarkerOpacity(pointOptions) === 0;

                if (pointOptions.marker.enabled && !isStillForcedMarker) {
                    unforcePointMarkerOptions(pointOptions);
                    point.hasForcedA11yMarker = false;
                } else if (pointOptions.marker.enabled === false) {
                    forceZeroOpacityMarkerOptions(pointOptions);
                    point.hasForcedA11yMarker = true;
                }
            }
        }
    }


    /**
     * @private
     */
    function hasIndividualPointMarkerOptions(series: Series): boolean {
        return !!(
            series._hasPointMarkers &&
            series.points &&
            series.points.length
        );
    }


    /**
     * @private
     */
    function isWithinDescriptionThreshold(
        series: Accessibility.SeriesComposition
    ): boolean {
        const a11yOptions = series.chart.options.accessibility;

        return series.points.length <
            (a11yOptions.series as any).pointDescriptionEnabledThreshold ||
            (a11yOptions.series as any)
                .pointDescriptionEnabledThreshold === false;
    }


    /**
     * Process marker graphics after render
     * @private
     */
    function seriesOnAfterRender(
        this: SeriesComposition
    ): void {
        const series = this;

        // For styled mode the rendered graphic does not reflect the style
        // options, and we need to add/remove classes to achieve the same.
        if (series.chart.styledMode) {
            if (series.markerGroup) {
                series.markerGroup[
                    series.a11yMarkersForced ? 'addClass' : 'removeClass'
                ]('highcharts-a11y-markers-hidden');
            }

            // Do we need to handle individual points?
            if (hasIndividualPointMarkerOptions(series)) {
                series.points.forEach((point): void => {
                    if (point.graphic) {
                        point.graphic[
                            point.hasForcedA11yMarker ?
                                'addClass' : 'removeClass'
                        ]('highcharts-a11y-marker-hidden');
                        point.graphic[
                            point.hasForcedA11yMarker === false ?
                                'addClass' :
                                'removeClass'
                        ]('highcharts-a11y-marker-visible');
                    }
                });
            }
        }
    }


    /**
     * Keep track of options to reset markers to if no longer forced.
     * @private
     */
    function seriesOnAfterSetOptions(
        this: SeriesComposition,
        e: { options: SeriesOptions }
    ): void {
        this.resetA11yMarkerOptions = merge(
            e.options.marker || {}, this.userOptions.marker || {}
        );
    }


    /**
     * Keep track of forcing markers.
     * @private
     */
    function seriesOnRender(
        this: SeriesComposition
    ): void {
        const series = this,
            options = series.options;

        if (shouldForceMarkers(series)) {
            if (options.marker && options.marker.enabled === false) {
                series.a11yMarkersForced = true;
                forceZeroOpacityMarkerOptions(series.options);
            }

            if (hasIndividualPointMarkerOptions(series)) {
                handleForcePointMarkers(series);
            }

        } else if (series.a11yMarkersForced) {
            delete series.a11yMarkersForced;
            unforceSeriesMarkerOptions(series);
            delete series.resetA11yMarkerOptions;
        }
    }


    /**
     * @private
     */
    function shouldForceMarkers(
        series: Accessibility.SeriesComposition
    ): boolean {
        const chart = series.chart,
            chartA11yEnabled = chart.options.accessibility.enabled,
            seriesA11yEnabled = (series.options.accessibility &&
                series.options.accessibility.enabled) !== false;

        return (
            chartA11yEnabled &&
            seriesA11yEnabled &&
            isWithinDescriptionThreshold(series)
        );
    }


    /**
     * @private
     */
    function unforcePointMarkerOptions(pointOptions: PointOptions): void {
        merge(true, pointOptions.marker, {
            states: {
                normal: {
                    opacity: getPointMarkerOpacity(pointOptions) || 1
                }
            }
        });
    }


    /**
     * Reset markers to normal
     * @private
     */
    function unforceSeriesMarkerOptions(series: SeriesComposition): void {
        const resetMarkerOptions = series.resetA11yMarkerOptions;
        if (resetMarkerOptions) {
            const originalOpactiy = resetMarkerOptions.states &&
                resetMarkerOptions.states.normal &&
                resetMarkerOptions.states.normal.opacity;

            // Temporarily set the old marker options to enabled in order to
            // trigger destruction of the markers in Series.update.
            if (series.userOptions && series.userOptions.marker) {
                series.userOptions.marker.enabled = true;
            }
            series.update({
                marker: {
                    enabled: resetMarkerOptions.enabled,
                    states: {
                        normal: { opacity: originalOpactiy }
                    }
                }
            });
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ForcedMarkersComposition;
