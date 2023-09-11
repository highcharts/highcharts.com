/* *
 *
 *  Highcharts variwide module
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

import type Axis from '../../Core/Axis/Axis';
import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type Tick from '../../Core/Axis/Tick';

import VariwidePoint from './VariwidePoint.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;
const {
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Axis/AxisLike' {
    interface AxisLike {
        variwide?: boolean;
        zData?: Array<number>;
    }
}

declare module '../../Core/Axis/TickLike' {
    interface TickLike {
        postTranslate(
            xy: PositionObject,
            xOrY: keyof PositionObject,
            index: number
        ): void;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<Function> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose(
    AxisClass: typeof Axis,
    TickClass: typeof Tick
): void {

    if (pushUnique(composedMembers, AxisClass)) {
        addEvent(AxisClass, 'afterDrawCrosshair', onAxisAfterDrawCrosshair);
        addEvent(AxisClass, 'afterRender', onAxisAfterRender);
    }

    if (pushUnique(composedMembers, TickClass)) {
        addEvent(TickClass, 'afterGetPosition', onTickAfterGetPosition);

        const tickProto = TickClass.prototype;

        tickProto.postTranslate = tickPostTranslate;

        wrap(tickProto, 'getLabelPosition', wrapTickGetLabelPosition);
    }

}

/**
 * Same width as the category (#8083)
 * @private
 */
function onAxisAfterDrawCrosshair(
    this: Axis,
    e: {
        point: VariwidePoint;
    }
): void {
    if (this.variwide && this.cross) {
        this.cross.attr(
            'stroke-width',
            (e.point && e.point.crosshairWidth) as any
        );
    }
}

/**
 * On a vertical axis, apply anti-collision logic to the labels.
 * @private
 */
function onAxisAfterRender(
    this: Axis
): void {
    const axis = this;

    if (!this.horiz && this.variwide) {
        this.chart.labelCollectors.push(
            function (): Array<SVGElement> {
                return axis.tickPositions
                    .filter(function (pos: number): boolean {
                        return axis.ticks[pos].label as any;
                    })
                    .map(function (
                        pos: number,
                        i: number
                    ): SVGElement {
                        const label: SVGElement =
                            axis.ticks[pos].label as any;

                        label.labelrank = (axis.zData as any)[i];
                        return label;
                    });
            }
        );
    }
}

/**
 * @private
 */
function onTickAfterGetPosition(
    this: Tick,
    e: {
        pos: PositionObject;
        xOrY: keyof PositionObject;
    }
): void {
    const axis = this.axis,
        xOrY: keyof PositionObject = axis.horiz ? 'x' : 'y';

    if (axis.variwide) {
        (this as any)[xOrY + 'Orig'] = e.pos[xOrY];
        this.postTranslate(e.pos, xOrY, this.pos);
    }
}

/**
 * @private
 */
function tickPostTranslate(
    this: Tick,
    xy: PositionObject,
    xOrY: keyof PositionObject,
    index: number
): void {
    const axis = this.axis;

    let pos = xy[xOrY] - axis.pos;

    if (!axis.horiz) {
        pos = axis.len - pos;
    }
    pos = (axis.series[0] as any).postTranslate(index, pos);

    if (!axis.horiz) {
        pos = axis.len - pos;
    }
    xy[xOrY] = axis.pos + pos;
}

/**
 * @private
 */
function wrapTickGetLabelPosition(
    this: Tick,
    proceed: Function,
    x: number,
    y: number,
    label: SVGElement,
    horiz: boolean,
    labelOptions: DataLabelOptions,
    tickmarkOffset: number,
    index: number
): PositionObject {
    const args = Array.prototype.slice.call(arguments, 1),
        xOrY: keyof PositionObject = horiz ? 'x' : 'y';

    // Replace the x with the original x
    if (
        this.axis.variwide &&
        typeof (this as any)[xOrY + 'Orig'] === 'number'
    ) {
        args[horiz ? 0 : 1] = (this as any)[xOrY + 'Orig'];
    }

    const xy = proceed.apply(this, args);

    // Post-translate
    if (this.axis.variwide && this.axis.categories) {
        this.postTranslate(xy, xOrY, this.pos);
    }
    return xy;
}

/* *
 *
 *  Default Export
 *
 * */

const VariwideComposition = {
    compose
};

export default VariwideComposition;
