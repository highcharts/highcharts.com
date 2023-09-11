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

import type ColorType from '../../Core/Color/ColorType';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type FlagsPointOptions from './FlagsPointOptions';
import type FlagsSeries from './FlagsSeries';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const {
    column: {
        prototype: {
            pointClass: ColumnPoint
        }
    }
} = SeriesRegistry.seriesTypes;

/* *
 *
 *  Class
 *
 * */

class FlagsPoint extends ColumnPoint {

    /* *
     *
     *  Properties
     *
     * */

    public _y?: number;

    public anchorX?: number;

    public options: FlagsPointOptions = void 0 as any;

    public series: FlagsSeries = void 0 as any;

    public fillColor?: ColorType;

    public lineWidth?: number;

    public raised?: boolean;

    public stackIndex?: number;

    public style?: CSSObject;

    public ttBelow?: boolean = false;

    public unbindMouseOver?: Function;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public isValid(): boolean {
        // #9233 - Prevent from treating flags as null points (even if
        // they have no y values defined).
        return isNumber(this.y) || typeof this.y === 'undefined';
    }

    /**
     * @private
     */
    public hasNewShapeType(): (boolean|undefined) {
        const shape = this.options.shape || this.series.options.shape;

        return this.graphic && shape && shape !== this.graphic.symbolKey;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default FlagsPoint;
