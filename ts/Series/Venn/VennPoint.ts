/* *
 *
 *  Experimental Highcharts module which enables visualization of a Venn
 *  diagram.
 *
 *  (c) 2016-2021 Highsoft AS
 *  Authors: Jon Arild Nygard
 *
 *  Layout algorithm by Ben Frederickson:
 *  https://www.benfrederickson.com/better-venn-diagrams/
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

import type VennPointOptions from './VennPointOptions';
import type VennSeries from './VennSeries';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        scatter: {
            prototype: {
                pointClass: ScatterPoint
            }
        }
    }
} = SeriesRegistry;
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;

/* *
 *
 *  Class
 *
 * */

class VennPoint extends ScatterPoint {

    /* *
     *
     *  Properties
     *
     * */

    public options: VennPointOptions = void 0 as any;

    public series: VennSeries = void 0 as any;

    public sets?: Array<string>;

    public value?: number;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public isValid(): boolean {
        return isNumber(this.value);
    }

    public shouldDraw(): boolean {
        // Only draw points with single sets.
        return !!this.shapeArgs;
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface VennPoint {
    // nothing to add
}

/* *
 *
 *  Default Export
 *
 * */

export default VennPoint;
