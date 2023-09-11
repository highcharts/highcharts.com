/* *
 *
 *  (c) 2017 Highsoft AS
 *  Authors: Lars A. V. Cabrera
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

import type SVGPath from '../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../Core/Renderer/SVG/SVGRenderer';

import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Renderer/SVG/SymbolType' {
    interface SymbolTypeRegistry {
        /** @requires Extensions/ArrowSymbols */
        arrow: typeof arrow;
        /** @requires Extensions/ArrowSymbols */
        'arrow-filled': typeof triangleLeft;
        /** @requires Extensions/ArrowSymbols */
        'arrow-filled-half': typeof triangleLeftHalf;
        /** @requires Extensions/ArrowSymbols */
        'arrow-half': typeof arrowHalf;
        /** @requires Extensions/ArrowSymbols */
        'triangle-left': typeof triangleLeft;
        /** @requires Extensions/ArrowSymbols */
        'triangle-left-half': typeof triangleLeftHalf;
    }
}

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
 * Creates an arrow symbol. Like a triangle, except not filled.
 * ```
 *                   o
 *             o
 *       o
 * o
 *       o
 *             o
 *                   o
 * ```
 *
 * @private
 * @function
 *
 * @param {number} x
 *        x position of the arrow
 *
 * @param {number} y
 *        y position of the arrow
 *
 * @param {number} w
 *        width of the arrow
 *
 * @param {number} h
 *        height of the arrow
 *
 * @return {Highcharts.SVGPathArray}
 *         Path array
 */
function arrow(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return [
        ['M', x, y + h / 2],
        ['L', x + w, y],
        ['L', x, y + h / 2],
        ['L', x + w, y + h]
    ];
}

/**
 * Creates a half-width arrow symbol. Like a triangle, except not filled.
 * ```
 *       o
 *    o
 * o
 *    o
 *       o
 * ```
 *
 * @private
 * @function
 *
 * @param {number} x
 *        x position of the arrow
 *
 * @param {number} y
 *        y position of the arrow
 *
 * @param {number} w
 *        width of the arrow
 *
 * @param {number} h
 *        height of the arrow
 *
 * @return {Highcharts.SVGPathArray}
 *         Path array
 */
function arrowHalf(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return arrow(x, y, w / 2, h);
}

/**
 * @private
 */
function compose(SVGRendererClass: typeof SVGRenderer): void {

    if (pushUnique(composedMembers, SVGRendererClass)) {
        const symbols = SVGRendererClass.prototype.symbols;

        symbols.arrow = arrow;
        symbols['arrow-filled'] = triangleLeft;
        symbols['arrow-filled-half'] = triangleLeftHalf;
        symbols['arrow-half'] = arrowHalf;
        symbols['triangle-left'] = triangleLeft;
        symbols['triangle-left-half'] = triangleLeftHalf;
    }

}

/**
 * Creates a left-oriented triangle.
 * ```
 *             o
 *       ooooooo
 * ooooooooooooo
 *       ooooooo
 *             o
 * ```
 *
 * @private
 * @function
 *
 * @param {number} x
 *        x position of the triangle
 *
 * @param {number} y
 *        y position of the triangle
 *
 * @param {number} w
 *        width of the triangle
 *
 * @param {number} h
 *        height of the triangle
 *
 * @return {Highcharts.SVGPathArray}
 *         Path array
 */
function triangleLeft(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return [
        ['M', x + w, y],
        ['L', x, y + h / 2],
        ['L', x + w, y + h],
        ['Z']
    ];
}

/**
 * Creates a half-width, left-oriented triangle.
 * ```
 *       o
 *    oooo
 * ooooooo
 *    oooo
 *       o
 * ```
 *
 * @private
 * @function
 *
 * @param {number} x
 *        x position of the triangle
 *
 * @param {number} y
 *        y position of the triangle
 *
 * @param {number} w
 *        width of the triangle
 *
 * @param {number} h
 *        height of the triangle
 *
 * @return {Highcharts.SVGPathArray}
 *         Path array
 */
function triangleLeftHalf(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return triangleLeft(x, y, w / 2, h);
}

/* *
 *
 *  Default Export
 *
 * */

const ArrowSymbols = {
    compose
};

export default ArrowSymbols;
