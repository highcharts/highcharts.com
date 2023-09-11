/* *
 *
 *  (c) 2010-2023 Askel Eirik Johansson, Piotr Madej
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

import type FlowMapPointOptions from './FlowMapPointOptions';
import type FlowMapSeries from './FlowMapSeries';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type ColorMapComposition from '../ColorMapComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import { LonLatArray } from '../../Maps/MapViewOptions';
const {
    seriesTypes: {
        mapline: {
            prototype: {
                pointClass: MapLinePoint
            }
        }
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber, isString } = TC;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class FlowMapPoint extends MapLinePoint {

    /* *
     *
     *  Properties
     *
     * */

    public fromPos?: PositionObject;

    public toPos?: PositionObject;

    public options: FlowMapPointOptions = void 0 as any;

    public series: FlowMapSeries = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    isValid(): boolean {
        let valid = !!(this.options.to && this.options.from);
        [this.options.to, this.options.from]
            .forEach(function (toOrFrom): void {
                valid = !!(valid && (toOrFrom && (
                    isString(toOrFrom) || ( // point id or has lat/lon coords
                        isNumber(pick(
                            (toOrFrom as LonLatArray)[0],
                            (toOrFrom as Highcharts.MapLonLatObject).lat)) &&
                        isNumber(pick(
                            (toOrFrom as LonLatArray)[1],
                            (toOrFrom as Highcharts.MapLonLatObject).lon))
                    )
                )));
            });
        return valid;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface FlowMapPoint {
    isValid: ColorMapComposition.PointComposition['isValid'];
}

/* *
 *
 *  Default Export
 *
 * */

export default FlowMapPoint;
