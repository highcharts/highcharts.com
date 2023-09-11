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

import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;
const {
    normalizeTickInterval,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisComposition' {
    interface AxisComposition {
        logarithmic?: LogarithmicAxis.Additions;
    }
}

declare module './AxisType' {
    interface AxisTypeRegistry {
        LogarithmicAxis: LogarithmicAxis.Composition;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 */
namespace LogarithmicAxis {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class Composition extends Axis {
        logarithmic: Additions;
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

    /* eslint-disable valid-jsdoc */

    /**
     * Provides logarithmic support for axes.
     * @private
     */
    export function compose<T extends typeof Axis>(
        AxisClass: T
    ): (T&typeof Composition) {

        if (pushUnique(composedMembers, AxisClass)) {
            AxisClass.keepProps.push('logarithmic');

            addEvent(AxisClass, 'init', onInit);
            addEvent(AxisClass, 'afterInit', onAfterInit);
        }

        return AxisClass as (T&typeof Composition);
    }

    /**
     * @private
     */
    function onInit(
        this: Axis,
        e: { userOptions: Axis['options'] }
    ): void {
        const axis = this;
        const options = e.userOptions;

        let logarithmic = axis.logarithmic;

        if (options.type !== 'logarithmic') {
            axis.logarithmic = void 0;
        } else {
            if (!logarithmic) {
                logarithmic = axis.logarithmic = new Additions(
                    axis as Composition
                );
            }
        }
    }

    /**
     * @private
     */
    function onAfterInit(
        this: Axis
    ): void {
        const axis = this as Composition;
        const log = axis.logarithmic;

        // extend logarithmic axis
        if (log) {
            axis.lin2val = function (num: number): number {
                return log.lin2log(num);
            };
            axis.val2lin = function (num: number): number {
                return log.log2lin(num);
            };
        }
    }

    /* *
     *
     *  Class
     *
     * */


    /**
     * Provides logarithmic support for axes.
     * @private
     * @class
     */
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

        public axis: Composition;
        public minorAutoInterval?: number;

        /* *
        *
        *  Functions
        *
        * */

        /**
         * Set the tick positions of a logarithmic axis.
         */
        public getLogTickPositions(
            interval: number,
            min: number,
            max: number,
            minor?: boolean
        ): Array<number> {
            const log = this;
            const axis = log.axis;
            const axisLength = axis.len;
            const options = axis.options;

            // Since we use this method for both major and minor ticks,
            // use a local variable and return the result
            let positions = [];

            // Reset
            if (!minor) {
                log.minorAutoInterval = void 0;
            }

            // First case: All ticks fall on whole logarithms: 1, 10, 100 etc.
            if (interval >= 0.5) {
                interval = Math.round(interval);
                positions = axis.getLinearTickPositions(interval, min, max);

            // Second case: We need intermediary ticks. For example
            // 1, 2, 4, 6, 8, 10, 20, 40 etc.
            } else if (interval >= 0.08) {
                const roundedMin = Math.floor(min);

                let intermediate,
                    i,
                    j,
                    len,
                    pos,
                    lastPos,
                    break2;

                if (interval > 0.3) {
                    intermediate = [1, 2, 4];

                // 0.2 equals five minor ticks per 1, 10, 100 etc
                } else if (interval > 0.15) {
                    intermediate = [1, 2, 4, 6, 8];
                } else { // 0.1 equals ten minor ticks per 1, 10, 100 etc
                    intermediate = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                }

                for (i = roundedMin; i < max + 1 && !break2; i++) {
                    len = intermediate.length;
                    for (j = 0; j < len && !break2; j++) {
                        pos = log.log2lin(log.lin2log(i) * intermediate[j]);
                        // #1670, lastPos is #3113
                        if (
                            pos > min &&
                            (!minor || (lastPos as any) <= max) &&
                            typeof lastPos !== 'undefined'
                        ) {
                            positions.push(lastPos);
                        }

                        if ((lastPos as any) > max) {
                            break2 = true;
                        }
                        lastPos = pos;
                    }
                }

            // Third case: We are so deep in between whole logarithmic values,
            // that we might as well handle the tick positions like a linear
            // axis. For example 1.01, 1.02, 1.03, 1.04.
            } else {
                const realMin = log.lin2log(min),
                    realMax = log.lin2log(max),
                    tickIntervalOption = minor ?
                        axis.getMinorTickInterval() :
                        options.tickInterval,
                    filteredTickIntervalOption = tickIntervalOption === 'auto' ?
                        null :
                        tickIntervalOption,
                    tickPixelIntervalOption =
                        (options.tickPixelInterval as any) / (minor ? 5 : 1),
                    totalPixelLength = minor ?
                        axisLength / axis.tickPositions.length :
                        axisLength;

                interval = pick(
                    filteredTickIntervalOption,
                    log.minorAutoInterval,
                    (realMax - realMin) *
                        tickPixelIntervalOption / (totalPixelLength || 1)
                );

                interval = normalizeTickInterval(interval);

                positions = axis.getLinearTickPositions(
                    interval,
                    realMin,
                    realMax
                ).map(log.log2lin);

                if (!minor) {
                    log.minorAutoInterval = interval / 5;
                }
            }

            // Set the axis-level tickInterval variable
            if (!minor) {
                axis.tickInterval = interval;
            }
            return positions;
        }

        public lin2log(num: number): number {
            return Math.pow(10, num);
        }

        public log2lin(num: number): number {
            return Math.log(num) / Math.LN10;
        }

    }
}

/* *
 *
 *  Default Export
 *
 * */

export default LogarithmicAxis;
