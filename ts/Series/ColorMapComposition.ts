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

import type ColorType from '../Core/Color/ColorType';
import type DashStyleValue from '../Core/Renderer/DashStyleValue';
import type Point from '../Core/Series/Point';
import type ScatterPoint from './Scatter/ScatterPoint';
import type ScatterSeries from './Scatter/ScatterSeries';

import SeriesRegistry from '../Core/Series/SeriesRegistry.js';
const {
    column: { prototype: columnProto }
} = SeriesRegistry.seriesTypes;
import U from '../Shared/Utilities.js';
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

declare module '../Core/Series/PointLike' {
    interface PointLike {
        dataLabelOnNull?: boolean;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace ColorMapComposition {

    // These properties can be set as both attributes and CSS properties
    interface ColorAttribsType {
        dashstyle?: DashStyleValue;
        fill?: ColorType;
        stroke?: ColorType;
        'stroke-linecap'?: 'butt'|'round'|'square';
        'stroke-linejoin'?: 'butt'|'round'|'square';
        'stroke-width'?: number;
    }

    /* *
     *
     *  Declarations
     *
     * */

    export declare class PointComposition extends ScatterPoint {
        dataLabelOnNull?: boolean;
        moveToTopOnHover?: boolean;
        series: SeriesComposition;
        value: (number|null);
        isValid(): boolean;
    }

    export declare class SeriesComposition extends ScatterSeries {
        colorProp?: 'fill'|'stroke';
        data: Array<PointComposition>;
        parallelArrays: Array<string>;
        pointArrayMap: Array<string>;
        points: Array<PointComposition>;
        trackerGroups: Array<string>;
        colorAttribs(point: PointComposition): ColorAttribsType;
    }

    /* *
     *
     *  Constants
     *
     * */

    const composedMembers: Array<unknown> = [];

    export const pointMembers = {
        dataLabelOnNull: true,
        moveToTopOnHover: true,
        isValid: pointIsValid
    };

    export const seriesMembers = {
        colorKey: 'value',
        axisTypes: ['xAxis', 'yAxis', 'colorAxis'],
        parallelArrays: ['x', 'y', 'value'],
        pointArrayMap: ['value'],
        trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
        colorAttribs: seriesColorAttribs,
        pointAttribs: columnProto.pointAttribs
    };

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    export function compose<T extends typeof ScatterSeries>(
        SeriesClass: T
    ): (T&typeof SeriesComposition) {
        const PointClass = SeriesClass.prototype.pointClass;

        if (pushUnique(composedMembers, PointClass)) {
            addEvent(PointClass, 'afterSetState', onPointAfterSetState);
        }

        return SeriesClass as (T&typeof SeriesComposition);
    }

    /**
     * Move points to the top of the z-index order when hovered.
     * @private
     */
    function onPointAfterSetState(
        this: Point,
        e?: Record<string, any>
    ): void {
        const point = this as PointComposition;

        if (point.moveToTopOnHover && point.graphic) {
            point.graphic.attr({
                zIndex: e && e.state === 'hover' ? 1 : 0
            });
        }
    }

    /**
     * Color points have a value option that determines whether or not it is
     * a null point
     * @private
     */
    function pointIsValid(
        this: PointComposition
    ): boolean {
        return (
            this.value !== null &&
            this.value !== Infinity &&
            this.value !== -Infinity &&
            // undefined is allowed, but NaN is not (#17279)
            (this.value === void 0 || !isNaN(this.value))
        );
    }

    /**
     * Get the color attibutes to apply on the graphic
     * @private
     * @function Highcharts.colorMapSeriesMixin.colorAttribs
     * @param {Highcharts.Point} point
     * @return {Highcharts.SVGAttributes}
     *         The SVG attributes
     */
    function seriesColorAttribs(
        this: SeriesComposition,
        point: PointComposition
    ): ColorAttribsType {
        const ret: ColorAttribsType = {};

        if (
            defined(point.color) &&
            (!point.state || point.state === 'normal') // #15746
        ) {
            ret[this.colorProp || 'fill'] = point.color;
        }
        return ret;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ColorMapComposition;
