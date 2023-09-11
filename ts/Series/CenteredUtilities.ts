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

import type SeriesOptions from '../Core/Series/SeriesOptions';

import H from '../Core/Globals.js';
const { deg2rad } = H;
import Series from '../Core/Series/Series.js';
import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { fireEvent } = EH;
const {
    pick,
    relativeLength
} = U;

/**
 * @private
 */
namespace CenteredUtilities {

    /* *
     *
     *  Declarations
     *
     * */

    export interface CenteredSeries extends Series {
        options: CenteredSeriesOptions;
    }

    export interface CenteredSeriesOptions extends SeriesOptions {
        center?: Array<(number|string|null)>;
        innerSize?: (number|string);
        size?: (number|string);
        slicedOffset?: number;
        thickness?: number;
    }

    export interface RadianAngles {
        end: number;
        start: number;
    }

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Get the center of the pie based on the size and center options relative
     * to the plot area. Borrowed by the polar and gauge series types.
     *
     * @private
     * @function Highcharts.CenteredSeriesMixin.getCenter
     */
    export function getCenter(this: CenteredSeries): Array<number> {

        const options = this.options,
            chart = this.chart,
            slicingRoom = 2 * (options.slicedOffset || 0),
            plotWidth = chart.plotWidth - 2 * slicingRoom,
            plotHeight = chart.plotHeight - 2 * slicingRoom,
            centerOption: Array<(number|string|null)> = options.center as any,
            smallestSize = Math.min(plotWidth, plotHeight),
            thickness = options.thickness;

        let handleSlicingRoom,
            size = options.size,
            innerSize = options.innerSize || 0,
            i: number,
            value: number;

        if (typeof size === 'string') {
            size = parseFloat(size);
        }

        if (typeof innerSize === 'string') {
            innerSize = parseFloat(innerSize);
        }

        const positions: Array<number> = [
            pick(centerOption[0] as any, '50%' as any),
            pick(centerOption[1] as any, '50%' as any),
            // Prevent from negative values
            pick(size && size < 0 ? void 0 : options.size, '100%'),
            pick(
                innerSize && innerSize < 0 ? void 0 : options.innerSize || 0,
                '0%'
            )
        ];

        // No need for inner size in angular (gauges) series but still required
        // for pie series
        if (chart.angular && !(this instanceof Series)) {
            positions[3] = 0;
        }

        for (i = 0; i < 4; ++i) {
            value = positions[i];
            handleSlicingRoom = i < 2 || (i === 2 && /%$/.test(value as any));

            // i == 0: centerX, relative to width
            // i == 1: centerY, relative to height
            // i == 2: size, relative to smallestSize
            // i == 3: innerSize, relative to size
            positions[i] = relativeLength(
                value,
                [plotWidth, plotHeight, smallestSize, positions[2]][i]
            ) + (handleSlicingRoom ? slicingRoom : 0);

        }
        // innerSize cannot be larger than size (#3632)
        if (positions[3] > positions[2]) {
            positions[3] = positions[2];
        }
        // thickness overrides innerSize, need to be less than pie size (#6647)
        if (
            isNumber(thickness) &&
            thickness * 2 < positions[2] && thickness > 0
        ) {
            positions[3] = positions[2] - thickness * 2;
        }

        fireEvent(this, 'afterGetCenter', { positions });

        return positions;
    }

    /**
     * getStartAndEndRadians - Calculates start and end angles in radians.
     * Used in series types such as pie and sunburst.
     *
     * @private
     * @function Highcharts.CenteredSeriesMixin.getStartAndEndRadians
     *
     * @param {number} [start]
     *        Start angle in degrees.
     *
     * @param {number} [end]
     *        Start angle in degrees.
     *
     * @return {Highcharts.RadianAngles}
     *         Returns an object containing start and end angles as radians.
     */
    export function getStartAndEndRadians(
        start?: number,
        end?: number
    ): RadianAngles {
        const startAngle = isNumber(start) ? start : 0, // must be a number
            endAngle = (
                (
                    isNumber(end) && // must be a number
                    end > startAngle && // must be larger than the start angle
                    // difference must be less than 360 degrees
                    (end - startAngle) < 360
                ) ?
                    end :
                    startAngle + 360
            ),
            correction = -90;

        return {
            start: deg2rad * (startAngle + correction),
            end: deg2rad * (endAngle + correction)
        };
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default CenteredUtilities;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * @private
 * @interface Highcharts.RadianAngles
 *//**
 * @name Highcharts.RadianAngles#end
 * @type {number}
 *//**
 * @name Highcharts.RadianAngles#start
 * @type {number}
 */

''; // keeps doclets above in JS file
