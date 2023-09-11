/* *
 *
 *  (c) 2016-2021 Highsoft AS
 *
 *  Author: Lars A. V. Cabrera
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

import type GanttPointOptions from './GanttPointOptions';
import type GanttSeries from './GanttSeries';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        xrange: {
            prototype: {
                pointClass: XRangePoint
            }
        }
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
const { pick } = U;

/* *
 *
 *  Class
 *
 * */

class GanttPoint extends XRangePoint {

    /* *
     *
     *  Static Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    public static setGanttPointAliases(
        options: (GanttPoint|GanttPointOptions)
    ): void {
        /**
         * Add a value to options if the value exists.
         * @private
         */
        function addIfExists(prop: string, val: unknown): void {
            if (typeof val !== 'undefined') {
                (options as any)[prop] = val;
            }
        }

        addIfExists('x', pick(options.start, options.x));
        addIfExists('x2', pick(options.end, options.x2));
        addIfExists(
            'partialFill', pick(options.completed, options.partialFill)
        );
    }

    /* eslint-enable valid-jsdoc */

    /* *
     *
     *  Properties
     *
     * */

    public collapsed?: boolean;

    public completed?: boolean;

    public end?: number;

    public milestone?: boolean;

    public options: GanttPointOptions = void 0 as any;

    public series: GanttSeries = void 0 as any;

    public start?: number;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Applies the options containing the x and y data and possible some
     * extra properties. This is called on point init or from point.update.
     *
     * @private
     * @function Highcharts.Point#applyOptions
     *
     * @param {Object} options
     *        The point options
     *
     * @param {number} x
     *        The x value
     *
     * @return {Highcharts.Point}
     *         The Point instance
     */
    public applyOptions(
        options: GanttPointOptions,
        x: number
    ): GanttPoint {
        let point = this,
            ganttPoint: GanttPoint;

        ganttPoint = super.applyOptions.call(point, options, x) as any;
        GanttPoint.setGanttPointAliases(ganttPoint);

        return ganttPoint;
    }

    public isValid(): boolean {
        return (
            (
                typeof this.start === 'number' ||
                typeof this.x === 'number'
            ) &&
            (
                typeof this.end === 'number' ||
                typeof this.x2 === 'number' ||
                (this.milestone as any)
            )
        );
    }

    /* eslint-enable valid-jsdoc */

}


/* *
 *
 *  Default Export
 *
 * */

export default GanttPoint;
