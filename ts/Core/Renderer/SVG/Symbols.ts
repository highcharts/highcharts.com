/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type SVGPath from './SVGPath';
import type SymbolOptions from './SymbolOptions';
import type { SymbolTypeRegistry } from './SymbolType';

import U from '../../Utilities.js';
const {
    correctFloat,
    defined,
    isNumber,
    pick
} = U;

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable require-jsdoc, valid-jsdoc */

/**
 * Returns the closest 32-bit float.
 * @private
 */
const fround: (num: number) => number = Math.fround ?
    Math.fround :
    (num: number): number => correctFloat(num, 7);

/**
 *
 */
function arc(
    cx: number,
    cy: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath {
    const arc: SVGPath = [];

    if (options) {
        const start = options.start || 0,
            rx = pick(options.r, w),
            ry = pick(options.r, h || w),
            // Subtract a small number to prevent cos and sin of start and end
            // from becoming equal on 360 arcs (#1561). The size of the circle
            // affects the constant, therefore the division by `rx`. If the
            // proximity is too small, the arc disappears. If it is too great, a
            // gap appears. This can be seen in the animation of the official
            // bubble demo (#20585).
            proximity = 0.0002 / (options.borderRadius ? 1 : Math.max(rx, 1)),
            fullCircle = (
                Math.abs((options.end || 0) - start - 2 * Math.PI) <
                proximity
            ),
            end = (options.end || 0) - (fullCircle ? proximity : 0),
            innerRadius = options.innerR,
            useInnerRadius = defined(innerRadius),
            open = pick(options.open, fullCircle),
            cosStart = Math.cos(start),
            sinStart = Math.sin(start),
            cosEnd = Math.cos(end),
            sinEnd = Math.sin(end),
            startX = cx + rx * cosStart,
            startY = cy + ry * sinStart,
            endX = cx + rx * cosEnd,
            // Use relative coordinates when drawing a circle where the floating
            // point number is inaccurate, e.g with large numbers. (#21701)
            useRelativeCoordinates = fullCircle && !useInnerRadius &&
                fround(startX) === fround(endX),
            // Proximity takes care of rounding errors around PI (#6971)
            longArc = pick(
                options.longArc,
                end - start - Math.PI < proximity ? 0 : 1
            ),
            arcCommand = useRelativeCoordinates ? 'a' : 'A',
            arcEndX = useRelativeCoordinates ?
                1 - proximity :
                endX,
            arcEndY = useRelativeCoordinates ?
                proximity :
                cy + ry * sinEnd;

        let arcSegment: SVGPath.Arc = [
            arcCommand, // ArcTo
            rx, // X radius
            ry, // Y radius
            0, // Slanting
            longArc, // Long or short arc
            pick(options.clockwise, 1), // Clockwise
            arcEndX,
            arcEndY
        ];
        arcSegment.params = { start, end, cx, cy }; // Memo for border radius
        arc.push(
            [
                'M',
                startX,
                startY
            ],
            arcSegment
        );

        if (useInnerRadius) {
            arcSegment = [
                'A', // ArcTo
                innerRadius, // X radius
                innerRadius, // Y radius
                0, // Slanting
                longArc, // Long or short arc
                // Clockwise - opposite to the outer arc clockwise
                defined(options.clockwise) ? 1 - options.clockwise : 0,
                cx + innerRadius * cosStart,
                cy + innerRadius * sinStart
            ];
            // Memo for border radius
            arcSegment.params = {
                start: end,
                end: start,
                cx,
                cy
            };
            arc.push(
                open ?
                    [
                        'M',
                        cx + innerRadius * cosEnd,
                        cy + innerRadius * sinEnd
                    ] : [
                        'L',
                        cx + innerRadius * cosEnd,
                        cy + innerRadius * sinEnd
                    ],
                arcSegment
            );
        }
        if (!open) {
            arc.push(['Z']);
        }
    }

    return arc;
}

/**
 * Callout shape used for default tooltips.
 */
function callout(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath {
    const arrowLength = 6,
        halfDistance = 6,
        r = Math.min((options?.r) || 0, w, h),
        safeDistance = r + halfDistance,
        anchorX = options?.anchorX,
        anchorY = options?.anchorY || 0;

    const path = roundedRect(x, y, w, h, { r });

    if (!isNumber(anchorX)) {
        return path;
    }

    // Do not render a connector, if anchor starts inside the label
    if (anchorX < w && anchorX > 0 && anchorY < h && anchorY > 0) {
        return path;
    }

    // Anchor on right side
    if (x + anchorX > w - safeDistance) {

        // Chevron
        if (
            anchorY > y + safeDistance &&
            anchorY < y + h - safeDistance
        ) {
            path.splice(
                3,
                1,
                ['L', x + w, anchorY - halfDistance],
                ['L', x + w + arrowLength, anchorY],
                ['L', x + w, anchorY + halfDistance],
                ['L', x + w, y + h - r]
            );

        // Simple connector
        } else {
            if (anchorX < w) { // Corner connector
                const isTopCorner = anchorY < y + safeDistance,
                    cornerY = isTopCorner ? y : y + h,
                    sliceStart = isTopCorner ? 2 : 5;

                path.splice(
                    sliceStart,
                    0,
                    ['L', anchorX, anchorY],
                    ['L', x + w - r, cornerY]
                );
            } else { // Side connector
                path.splice(
                    3,
                    1,
                    ['L', x + w, h / 2],
                    ['L', anchorX, anchorY],
                    ['L', x + w, h / 2],
                    ['L', x + w, y + h - r]
                );
            }
        }

    // Anchor on left side
    } else if (x + anchorX < safeDistance) {

        // Chevron
        if (
            anchorY > y + safeDistance &&
            anchorY < y + h - safeDistance
        ) {
            path.splice(
                7,
                1,
                ['L', x, anchorY + halfDistance],
                ['L', x - arrowLength, anchorY],
                ['L', x, anchorY - halfDistance],
                ['L', x, y + r]
            );

        // Simple connector
        } else {
            if (anchorX > 0) { // Corner connector
                const isTopCorner = anchorY < y + safeDistance,
                    cornerY = isTopCorner ? y : y + h,
                    sliceStart = isTopCorner ? 1 : 6;

                path.splice(
                    sliceStart,
                    0,
                    ['L', anchorX, anchorY],
                    ['L', x + r, cornerY]
                );
            } else { // Side connector
                path.splice(
                    7,
                    1,
                    ['L', x, h / 2],
                    ['L', anchorX, anchorY],
                    ['L', x, h / 2],
                    ['L', x, y + r]
                );
            }
        }

    } else if ( // Replace bottom
        anchorY > h &&
        anchorX < w - safeDistance
    ) {
        path.splice(
            5,
            1,
            ['L', anchorX + halfDistance, y + h],
            ['L', anchorX, y + h + arrowLength],
            ['L', anchorX - halfDistance, y + h],
            ['L', x + r, y + h]
        );

    } else if ( // Replace top
        anchorY < 0 &&
        anchorX > safeDistance
    ) {
        path.splice(
            1,
            1,
            ['L', anchorX - halfDistance, y],
            ['L', anchorX, y - arrowLength],
            ['L', anchorX + halfDistance, y],
            ['L', w - r, y]
        );
    }

    return path;
}

/**
 *
 */
function circle(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    // Return a full arc
    return arc(x + w / 2, y + h / 2, w / 2, h / 2, {
        start: Math.PI * 0.5,
        end: Math.PI * 2.5,
        open: false
    });
}

/**
 *
 */
function diamond(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return [
        ['M', x + w / 2, y],
        ['L', x + w, y + h / 2],
        ['L', x + w / 2, y + h],
        ['L', x, y + h / 2],
        ['Z']
    ];
}

// #15291
/**
 *
 */
function rect(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath {
    if (options?.r) {
        return roundedRect(x, y, w, h, options);
    }
    return [
        ['M', x, y],
        ['L', x + w, y],
        ['L', x + w, y + h],
        ['L', x, y + h],
        ['Z']
    ];
}

/**
 *
 */
function roundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath {
    const r = options?.r || 0;
    return [
        ['M', x + r, y],
        ['L', x + w - r, y], // Top side
        ['A', r, r, 0, 0, 1, x + w, y + r], // Top-right corner
        ['L', x + w, y + h - r], // Right side
        ['A', r, r, 0, 0, 1, x + w - r, y + h], // Bottom-right corner
        ['L', x + r, y + h], // Bottom side
        ['A', r, r, 0, 0, 1, x, y + h - r], // Bottom-left corner
        ['L', x, y + r], // Left side
        ['A', r, r, 0, 0, 1, x + r, y],
        ['Z'] // Top-left corner
    ];
}

/**
 *
 */
function triangle(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return [
        ['M', x + w / 2, y],
        ['L', x + w, y + h],
        ['L', x, y + h],
        ['Z']
    ];
}

/**
 *
 */
function triangleDown(
    x: number,
    y: number,
    w: number,
    h: number
): SVGPath {
    return [
        ['M', x, y],
        ['L', x + w, y],
        ['L', x + w / 2, y + h],
        ['Z']
    ];
}

/* *
 *
 *  Registry
 *
 * */

declare module './SymbolType' {
    interface SymbolTypeRegistry {
        arc: typeof arc;
        callout: typeof callout;
        circle: typeof circle;
        diamond: typeof diamond;
        rect: typeof rect;
        roundedRect: typeof roundedRect;
        square: typeof rect;
        triangle: typeof triangle;
        'triangle-down': typeof triangleDown;
    }
}

const Symbols: SymbolTypeRegistry = {
    arc,
    callout,
    circle,
    diamond,
    rect,
    roundedRect,
    square: rect,
    triangle,
    'triangle-down': triangleDown
} as SymbolTypeRegistry;

/* *
 *
 *  Default Export
 *
 * */

export default Symbols;
