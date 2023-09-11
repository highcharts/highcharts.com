/* *
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

import type Chart from '../Core/Chart/Chart';
import type CoreSeriesOptions from '../Core/Series/SeriesOptions';

import H from '../Core/Globals.js';
const { noop } = H;
import Series from '../Core/Series/Series.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { defined } = OH;
const { addEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Series/SeriesLike' {
    interface SeriesLike {
        hasDerivedData?: DerivedComposition.SeriesComposition['hasDerivedData'];
    }
}

/* *
 *
 *  Composition
 *
 * */

/**
 * Provides methods for auto setting/updating series data based on the based
 * series data.
 * @private
 */
namespace DerivedComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class SeriesComposition extends Series {
        baseSeries?: Series;
        eventRemovers: Array<Function>;
        hasDerivedData?: boolean;
        initialised?: boolean;
        options: SeriesOptions;
        addBaseSeriesEvents(): void;
        addEvents(): void;
        destroy(keepEventsForUpdate?: boolean): void;
        init(chart: Chart, userOptions: DeepPartial<CoreSeriesOptions>): void;
        setBaseSeries(): void;
        setDerivedData(): void;
    }

    export interface SeriesOptions extends CoreSeriesOptions {
        baseSeries?: (number|string);
    }

    /* *
     *
     *  Constants
     *
     * */

    const composedMembers: Array<unknown> = [];

    export const hasDerivedData = true;

    /**
     * Method to be implemented - inside the method the series has already
     * access to the base series via m `this.baseSeries` and the bases data is
     * initialised. It should return data in the format accepted by
     * `Series.setData()` method
     * @private
     */
    export const setDerivedData = noop;

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
    ): (T&typeof SeriesComposition) {

        if (pushUnique(composedMembers, SeriesClass)) {
            const seriesProto = SeriesClass.prototype as SeriesComposition;

            seriesProto.addBaseSeriesEvents = addBaseSeriesEvents;
            seriesProto.addEvents = addEvents;
            seriesProto.destroy = destroy;
            seriesProto.init = init;
            seriesProto.setBaseSeries = setBaseSeries;
        }

        return SeriesClass as (T&typeof SeriesComposition);
    }

    /**
     * Initialise series
     * @private
     */
    export function init(this: SeriesComposition): void {
        Series.prototype.init.apply(this, arguments as any);

        this.initialised = false;
        this.baseSeries = null as any;
        this.eventRemovers = [];

        this.addEvents();
    }

    /**
     * Sets base series for the series
     * @private
     */
    export function setBaseSeries(this: SeriesComposition): void {
        const chart = this.chart,
            baseSeriesOptions = this.options.baseSeries,
            baseSeries = (
                defined(baseSeriesOptions) &&
                (
                    chart.series[baseSeriesOptions as any] ||
                    chart.get(baseSeriesOptions as any)
                )
            );

        this.baseSeries = baseSeries || null as any;
    }

    /**
     * Adds events for the series
     * @private
     */
    export function addEvents(this: SeriesComposition): void {
        this.eventRemovers.push(
            addEvent(
                this.chart,
                'afterLinkSeries',
                (): void => {
                    this.setBaseSeries();

                    if (this.baseSeries && !this.initialised) {
                        this.setDerivedData();
                        this.addBaseSeriesEvents();
                        this.initialised = true;
                    }
                }
            )
        );
    }

    /**
     * Adds events to the base series - it required for recalculating the data
     * in the series if the base series is updated / removed / etc.
     * @private
     */
    export function addBaseSeriesEvents(this: SeriesComposition): void {
        this.eventRemovers.push(
            addEvent(
                this.baseSeries,
                'updatedData',
                (): void => {
                    this.setDerivedData();
                }
            ),
            addEvent(
                this.baseSeries,
                'destroy',
                (): void => {
                    this.baseSeries = null as any;
                    this.initialised = false;
                }
            )
        );
    }

    /**
     * Destroys the series
     * @private
     */
    export function destroy(this: SeriesComposition): void {
        this.eventRemovers.forEach((remover: Function): void => {
            remover();
        });
        Series.prototype.destroy.apply(this, arguments);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DerivedComposition;
