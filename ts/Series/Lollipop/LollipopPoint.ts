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

import type LollipopPointOptions from './LollipopPointOptions';
import type LollipopSeries from './LollipopSeries';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: {
            pointClass: {
                prototype: pointProto
            }
        }
    },
    seriesTypes: {
        scatter: {
            prototype: {
                pointClass: ScatterPoint
            }
        },
        dumbbell: {
            prototype: {
                pointClass: DumbbellPoint
            }
        }
    }
} = SeriesRegistry;

import U from '../../Core/Utilities.js';
const {
    extend
} = U;

/* *
 *
 *  Class
 *
 * */

class LollipopPoint extends ScatterPoint {

    /* *
     *
     *  Properties
     *
     * */

    public options: LollipopPointOptions = void 0 as any;

    public series: LollipopSeries = void 0 as any;
}

/* *
 *
 *  Class Prototype
 *
 * */

interface LollipopPoint {
    destroy: typeof DumbbellPoint.prototype['destroy'],
    isValid: typeof pointProto['isValid'],
    pointSetState: typeof ScatterPoint.prototype['setState'],
    setState: typeof DumbbellPoint.prototype['setState']
}

extend(LollipopPoint.prototype, {
    destroy: DumbbellPoint.prototype.destroy,
    // Does not work with the inherited `isvalid`
    isValid: pointProto.isValid,
    pointSetState: ScatterPoint.prototype.setState,
    setState: DumbbellPoint.prototype.setState
});

/* *
 *
 *  Default Export
 *
 * */

export default LollipopPoint;
