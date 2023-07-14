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

import type Axis from './Axis';
import type AxisOptions from './AxisOptions';
import type TickPositionsArray from './TickPositionsArray';
import type Time from '../Time';

import U from '../Utilities.js';
const {
    addEvent,
    getMagnitude,
    normalizeTickInterval,
    timeUnits
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisComposition' {
    interface AxisComposition {
        dateTime?: DateTimeAxis.Composition['dateTime'];
    }
}

declare module './AxisOptions' {
    interface AxisOptions {
        dateTimeLabelFormats?: Time.DateTimeLabelFormatsOption;
        units?: Array<[Time.TimeUnit, (Array<number>|null)]>;
    }
}

declare module './AxisType' {
    interface AxisTypeRegistry {
        DateTimeAxis: DateTimeAxis.Composition;
    }
}

declare module '../Series/SeriesOptions' {
    interface SeriesOptions {
        pointInterval?: number;
        pointIntervalUnit?: DateTimeAxis.PointIntervalUnitValue;
    }
}

declare module './TimeTicksInfoObject' {
    interface TimeTicksInfoObject extends Time.TimeNormalizedObject {
        // nothing to add
    }
}

/* *
 *
 *  Composition
 *
 * */

/* eslint-disable valid-jsdoc */

namespace DateTimeAxis{

    /* *
     *
     *  Declarations
     *
     * */

    export declare class Composition extends Axis {
        dateTime: Additions;
    }

    export type PointIntervalUnitValue = ('day'|'month'|'year');

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
     * Extends axis class with date and time support.
     * @private
     */
    export function compose<T extends typeof Axis>(
        AxisClass: T
    ): (typeof Composition&T) {

        if (U.pushUnique(composedMembers, AxisClass)) {
            AxisClass.keepProps.push('dateTime');

            const axisProto = AxisClass.prototype as Composition;

            axisProto.getTimeTicks = getTimeTicks;

            addEvent(AxisClass, 'init', onInit);
        }

        return AxisClass as (typeof Composition&T);
    }

    /**
     * Set the tick positions to a time unit that makes sense, for example
     * on the first of each month or on every Monday. Return an array with
     * the time positions. Used in datetime axes as well as for grouping
     * data on a datetime axis.
     *
     * @private
     * @function Highcharts.Axis#getTimeTicks
     * @param {Highcharts.TimeNormalizeObject} normalizedInterval
     * The interval in axis values (ms) and thecount.
     * @param {number} min
     * The minimum in axis values.
     * @param {number} max
     * The maximum in axis values.
     */
    function getTimeTicks(
        this: Axis
    ): TickPositionsArray {
        return this.chart.time.getTimeTicks.apply(
            this.chart.time, arguments
        );
    }

    /**
     * @private
     */
    function onInit(
        this: Axis,
        e: { userOptions: Axis['userOptions'] }
    ): void {
        const axis = this;
        const options = e.userOptions;

        if (options.type !== 'datetime') {
            axis.dateTime = void 0;
            return;
        }

        if (!axis.dateTime) {
            axis.dateTime = new Additions(axis as Composition);
        }
    }

    /* *
     *
     *  Classes
     *
     * */

    export class Additions {

        /* *
         *
         *  Constructors
         *
         * */

        public constructor(axis: Composition) {
            this.axis = axis;
        }

        /* *
         *
         *  Properties
         *
         * */

        public axis: Axis;

        /* *
         *
         *  Functions
         *
         * */

        /**
         * Get a normalized tick interval for dates. Returns a configuration
         * object with unit range (interval), count and name. Used to prepare
         * data for `getTimeTicks`. Previously this logic was part of
         * getTimeTicks, but as `getTimeTicks` now runs of segments in stock
         * charts, the normalizing logic was extracted in order to prevent it
         * for running over again for each segment having the same interval.
         * #662, #697.
         * @private
         */
        public normalizeTimeTickInterval(
            tickInterval: number,
            unitsOption?: AxisOptions['units']
        ): Time.TimeNormalizedObject {
            const units = (
                unitsOption || [[
                    // unit name
                    'millisecond',
                    // allowed multiples
                    [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]
                ], [
                    'second',
                    [1, 2, 5, 10, 15, 30]
                ], [
                    'minute',
                    [1, 2, 5, 10, 15, 30]
                ], [
                    'hour',
                    [1, 2, 3, 4, 6, 8, 12]
                ], [
                    'day',
                    [1, 2]
                ], [
                    'week',
                    [1, 2]
                ], [
                    'month',
                    [1, 2, 3, 4, 6]
                ], [
                    'year',
                    null
                ]] as Required<AxisOptions>['units']
            );

            let unit = units[units.length - 1], // default unit is years
                interval = timeUnits[unit[0]],
                multiples = unit[1],
                i;

            // loop through the units to find the one that best fits the
            // tickInterval
            for (i = 0; i < units.length; i++) {
                unit = units[i];
                interval = timeUnits[unit[0]];
                multiples = unit[1];


                if (units[i + 1]) {
                    // lessThan is in the middle between the highest multiple
                    // and the next unit.
                    const lessThan = (
                        interval *
                        (multiples as any)[(multiples as any).length - 1] +
                        timeUnits[units[i + 1][0]]
                    ) / 2;

                    // break and keep the current unit
                    if (tickInterval <= lessThan) {
                        break;
                    }
                }
            }

            // prevent 2.5 years intervals, though 25, 250 etc. are allowed
            if (interval === timeUnits.year && tickInterval < 5 * interval) {
                multiples = [1, 2, 5];
            }

            // get the count
            const count = normalizeTickInterval(
                tickInterval / interval,
                multiples as any,
                unit[0] === 'year' ? // #1913, #2360
                    Math.max(getMagnitude(tickInterval / interval), 1) :
                    1
            );

            return {
                unitRange: interval,
                count: count,
                unitName: unit[0]
            };
        }

        /**
         * Get the best date format for a specific X value based on the closest
         * point range on the axis.
         *
         * @private
         */
        public getXDateFormat(
            x: number,
            dateTimeLabelFormats: Time.DateTimeLabelFormatsOption
        ): string {
            const { axis } = this,
                time = axis.chart.time;

            return axis.closestPointRange ?
                time.getDateFormat(
                    axis.closestPointRange,
                    x,
                    axis.options.startOfWeek,
                    dateTimeLabelFormats
                ) ||
                // #2546, 2581
                time.resolveDTLFormat(dateTimeLabelFormats.year).main :
                time.resolveDTLFormat(dateTimeLabelFormats.day).main;
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DateTimeAxis;
