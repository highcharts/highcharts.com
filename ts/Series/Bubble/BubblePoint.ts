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

import type BubblePointOptions from './BubblePointOptions';
import type BubbleSeries from './BubbleSeries';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import Point from '../../Core/Series/Point.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;
const {
    seriesTypes: {
        scatter: {
            prototype: {
                pointClass: ScatterPoint
            }
        }
    }
} = SeriesRegistry;

/* *
 *
 *  Class
 *
 * */

class BubblePoint extends ScatterPoint {

    /* *
     *
     *  Properties
     *
     * */

    public options: BubblePointOptions = void 0 as any;

    public series: BubbleSeries = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    public haloPath(size: number): SVGPath {
        return Point.prototype.haloPath.call(
            this,
            // #6067
            size === 0 ? 0 : (this.marker ? this.marker.radius || 0 : 0) + size
        );
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

extend(BubblePoint.prototype, {
    ttBelow: false
});

/* *
 *
 *  Default Export
 *
 * */

export default BubblePoint;
