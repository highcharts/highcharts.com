/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  Extenstion for 3d axes
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

import type Position3DObject from '../Renderer/Position3DObject';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type Tick from './Tick.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const {
    extend
} = OH;
const { addEvent } = EH;
const {
    wrap
} = U;

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

/**
 * @private
 */
function compose(
    TickClass: typeof Tick
): void {

    if (pushUnique(composedMembers, TickClass)) {
        addEvent(
            TickClass,
            'afterGetLabelPosition',
            onTickAfterGetLabelPosition
        );

        wrap(TickClass.prototype, 'getMarkPath', wrapTickGetMarkPath);
    }

}

/**
 * @private
 */
function onTickAfterGetLabelPosition(
    this: Tick,
    e: {
        pos: Position3DObject;
        tickmarkOffset: number;
        index: number;
    }
): void {
    const axis3D = this.axis.axis3D;

    if (axis3D) {
        extend(e.pos, axis3D.fix3dPosition(e.pos));
    }
}

/**
 * @private
 */
function wrapTickGetMarkPath(
    this: Tick,
    proceed: Function
): SVGPath {
    const axis3D = this.axis.axis3D,
        path: SVGPath = proceed.apply(
            this,
            [].slice.call(arguments, 1)
        );

    if (axis3D) {
        const start = path[0];
        const end = path[1];
        if (start[0] === 'M' && end[0] === 'L') {
            const pArr: Array<Position3DObject> = [
                axis3D.fix3dPosition({ x: start[1], y: start[2], z: 0 }),
                axis3D.fix3dPosition({ x: end[1], y: end[2], z: 0 })
            ];

            return this.axis.chart.renderer.toLineSegments(pArr);
        }
    }

    return path;
}

/* *
 *
 *  Default Export
 *
 * */

const Tick3DAdditions = {
    compose
};

export default Tick3DAdditions;
