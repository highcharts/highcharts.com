/* *
 *
 *  Highcharts Border Radius module
 *
 *  Author: Torstein Honsi
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

import type ColumnSeries from '../Series/Column/ColumnSeries';
import type SymbolOptions from '../Core/Renderer/SVG/SymbolOptions';
import type SVGPath from '../Core/Renderer/SVG/SVGPath';

import D from '../Core/Defaults.js';
const { defaultOptions } = D;
import Series from '../Core/Series/Series.js';
import SeriesRegistry from '../Core/Series/SeriesRegistry.js';
const { seriesTypes } = SeriesRegistry;
import SVGElement from '../Core/Renderer/SVG/SVGElement.js';
import SVGRenderer from '../Core/Renderer/SVG/SVGRenderer.js';
import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
const { isObject } = TC;
const { extend, merge } = OH;
const { addEvent } = EH;
const {
    relativeLength
} = U;

/* *
 *
 *  Declarations
 *
 * */

export interface BorderRadiusOptionsObject {
    radius: number|string;
    scope: 'point'|'stack';
    where?: 'end'|'all';
}

declare module '../Core/Renderer/SVG/SVGAttributes' {
    interface SVGAttributes {
        borderRadius?: number|string;
        /** The height of the border-radius box  */
        brBoxHeight?: number;
        /** The y position of the border-radius box  */
        brBoxY?: number;
    }
}

declare module '../Core/Renderer/SVG/SymbolOptions' {
    interface SymbolOptions {
        borderRadius?: number|string;
        brBoxHeight?: number;
        brBoxY?: number;
    }
}

/* *
 *
 *  Constants
 *
 * */

const defaultBorderRadiusOptions: BorderRadiusOptionsObject = {
    radius: 0,
    scope: 'stack',
    where: void 0
};

const optionsToObject = (
    options?: number|string|Partial<BorderRadiusOptionsObject>,
    seriesBROptions?: Partial<BorderRadiusOptionsObject>
): BorderRadiusOptionsObject => {
    if (!isObject(options)) {
        options = { radius: options || 0 };
    }
    return merge(defaultBorderRadiusOptions, seriesBROptions, options);
};

const applyBorderRadius = (
    path: SVGPath,
    i: number,
    r: number
): void => {
    const a = path[i];

    let b = path[i + 1];
    if (b[0] === 'Z') {
        b = path[0];
    }

    let line: SVGPath.LineTo|SVGPath.MoveTo|undefined,
        arc: SVGPath.Arc|undefined,
        fromLineToArc: boolean|undefined;

    // From straight line to arc
    if ((a[0] === 'M' || a[0] === 'L') && b[0] === 'A') {
        line = a;
        arc = b;
        fromLineToArc = true;

    // From arc to straight line
    } else if (a[0] === 'A' && (b[0] === 'M' || b[0] === 'L')) {
        line = b;
        arc = a;
    }

    if (line && arc && arc.params) {
        const bigR = arc[1],
            // In our use cases, outer pie slice arcs are clockwise and inner
            // arcs (donut/sunburst etc) are anti-clockwise
            clockwise = arc[5],
            params = arc.params,
            { start, end, cx, cy } = params;

        // Some geometric constants
        const relativeR = clockwise ? (bigR - r) : (bigR + r),
            // The angle, on the big arc, that the border radius arc takes up
            angleOfBorderRadius = relativeR ? Math.asin(r / relativeR) : 0,
            angleOffset = clockwise ?
                angleOfBorderRadius :
                -angleOfBorderRadius,
            // The distance along the radius of the big arc to the starting
            // point of the small border radius arc
            distanceBigCenterToStartArc = (
                Math.cos(angleOfBorderRadius) *
                relativeR
            );

        // From line to arc
        if (fromLineToArc) {

            // Update the cache
            params.start = start + angleOffset;

            // First move to the start position at the radial line. We want to
            // start one borderRadius closer to the center.
            line[1] = cx + distanceBigCenterToStartArc * Math.cos(start);
            line[2] = cy + distanceBigCenterToStartArc * Math.sin(start);

            // Now draw an arc towards the point where the small circle touches
            // the great circle.
            path.splice(i + 1, 0, [
                'A',
                r,
                r,
                0, // slanting,
                0, // long arc
                1, // clockwise
                cx + bigR * Math.cos(params.start),
                cy + bigR * Math.sin(params.start)
            ]);

        // From arc to line
        } else {

            // Update the cache
            params.end = end - angleOffset;

            // End the big arc a bit earlier
            arc[6] = cx + bigR * Math.cos(params.end);
            arc[7] = cy + bigR * Math.sin(params.end);

            // Draw a small arc towards a point on the end angle, but one
            // borderRadius closer to the center relative to the perimeter.
            path.splice(i + 1, 0, [
                'A',
                r,
                r,
                0,
                0,
                1,
                cx + distanceBigCenterToStartArc * Math.cos(end),
                cy + distanceBigCenterToStartArc * Math.sin(end)
            ]);
        }

        // Long or short arc must be reconsidered because we have modified the
        // start and end points
        arc[4] = Math.abs(params.end - params.start) < Math.PI ? 0 : 1;

    }
};

/* *
 *
 *  Modifications
 *
 * */

// Check if the module has already been imported
// @todo implement as composition
if (SVGElement.symbolCustomAttribs.indexOf('borderRadius') === -1) {

    SVGElement.symbolCustomAttribs.push(
        'borderRadius',
        'brBoxHeight',
        'brBoxY'
    );

    // Extend arc with borderRadius
    const arc = SVGRenderer.prototype.symbols.arc;
    SVGRenderer.prototype.symbols.arc = function (
        x: number,
        y: number,
        w: number,
        h: number,
        options: SymbolOptions = {}
    ): SVGPath {
        const path = arc(x, y, w, h, options),
            { innerR = 0, r = w, start = 0, end = 0 } = options;

        if (options.open || !options.borderRadius) {
            return path;
        }

        const alpha = end - start,
            sinHalfAlpha = Math.sin(alpha / 2),
            borderRadius = Math.max(Math.min(
                relativeLength(options.borderRadius || 0, r - innerR),
                // Cap to half the sector radius
                (r - innerR) / 2,
                // For smaller pie slices, cap to the largest small circle that
                // can be fitted within the sector
                (r * sinHalfAlpha) / (1 + sinHalfAlpha)
            ), 0),
            // For the inner radius, we need an extra cap because the inner arc
            // is shorter than the outer arc
            innerBorderRadius = Math.min(
                borderRadius,
                2 * (alpha / Math.PI) * innerR
            );

        // Apply turn-by-turn border radius. Start at the end since we're
        // splicing in arc segments.
        let i = path.length - 1;
        while (i--) {
            applyBorderRadius(
                path,
                i,
                i > 1 ? innerBorderRadius : borderRadius
            );
        }

        return path;
    };

    // Extend roundedRect with individual cutting through rOffset
    const roundedRect = SVGRenderer.prototype.symbols.roundedRect;
    SVGRenderer.prototype.symbols.roundedRect = function (
        x: number,
        y: number,
        width: number,
        height: number,
        options: SymbolOptions = {}
    ): SVGPath {
        const path = roundedRect(x, y, width, height, options),
            { r = 0, brBoxHeight = height, brBoxY = y } = options,
            brOffsetTop = y - brBoxY,
            brOffsetBtm = (brBoxY + brBoxHeight) - (y + height),

            // When the distance to the border-radius box is greater than the r
            // itself, it means no border radius. The -0.1 accounts for float
            // rounding errors.
            rTop = (brOffsetTop - r) > -0.1 ? 0 : r,
            rBtm = (brOffsetBtm - r) > -0.1 ? 0 : r,
            cutTop = Math.max(rTop && brOffsetTop, 0),
            cutBtm = Math.max(rBtm && brOffsetBtm, 0);

        /*

        The naming of control points:

          / a -------- b \
         /                \
        h                  c
        |                  |
        |                  |
        |                  |
        g                  d
         \                /
          \ f -------- e /

        */

        const a: [number, number] = [x + rTop, y],
            b: [number, number] = [x + width - rTop, y],
            c: [number, number] = [x + width, y + rTop],
            d: [number, number] = [
                x + width, y + height - rBtm
            ],
            e: [number, number] = [
                x + width - rBtm,
                y + height
            ],
            f: [number, number] = [x + rBtm, y + height],
            g: [number, number] = [x, y + height - rBtm],
            h: [number, number] = [x, y + rTop];

        const applyPythagoras = (
            r: number,
            altitude: number
        ): number => Math.sqrt(
            Math.pow(r, 2) - Math.pow(altitude, 2)
        );

        // Inside stacks, cut off part of the top
        if (cutTop) {
            const base = applyPythagoras(rTop, rTop - cutTop);
            a[0] -= base;
            b[0] += base;
            c[1] = h[1] = y + rTop - cutTop;
        }

        // Column is lower than the radius. Cut off bottom inside the top
        // radius.
        if (height < rTop - cutTop) {
            const base = applyPythagoras(rTop, rTop - cutTop - height);
            c[0] = d[0] = x + width - rTop + base;
            e[0] = Math.min(c[0], e[0]);
            f[0] = Math.max(d[0], f[0]);
            g[0] = h[0] = x + rTop - base;
            c[1] = h[1] = y + height;
        }

        // Inside stacks, cut off part of the bottom
        if (cutBtm) {
            const base = applyPythagoras(rBtm, rBtm - cutBtm);
            e[0] += base;
            f[0] -= base;
            d[1] = g[1] = y + height - rBtm + cutBtm;
        }

        // Cut off top inside the bottom radius
        if (height < rBtm - cutBtm) {
            const base = applyPythagoras(rBtm, rBtm - cutBtm - height);
            c[0] = d[0] = x + width - rBtm + base;
            b[0] = Math.min(c[0], b[0]);
            a[0] = Math.max(d[0], a[0]);
            g[0] = h[0] = x + rBtm - base;
            d[1] = g[1] = y;
        }

        // Preserve the box for data labels
        path.length = 0;
        path.push(
            ['M', ...a],
            // top side
            ['L', ...b],
            // top right corner
            ['A', rTop, rTop, 0, 0, 1, ...c],
            // right side
            ['L', ...d],
            // bottom right corner
            ['A', rBtm, rBtm, 0, 0, 1, ...e],
            // bottom side
            ['L', ...f],
            // bottom left corner
            ['A', rBtm, rBtm, 0, 0, 1, ...g],
            // left side
            ['L', ...h],
            // top left corner
            ['A', rTop, rTop, 0, 0, 1, ...a],
            ['Z']
        );

        return path;
    };

    addEvent(seriesTypes.pie, 'afterTranslate', function (): void {
        const borderRadius = optionsToObject(this.options.borderRadius);

        for (const point of this.points) {
            const shapeArgs = point.shapeArgs;
            if (shapeArgs) {
                shapeArgs.borderRadius = relativeLength(
                    borderRadius.radius,
                    (shapeArgs.r || 0) - ((shapeArgs.innerR) || 0)
                );
            }
        }
    });

    addEvent(
        Series as unknown as ColumnSeries,
        'afterColumnTranslate',
        function (): void {
            if (
                this.options.borderRadius &&
                !(this.chart.is3d && this.chart.is3d())
            ) {
                const { options, yAxis } = this,
                    percent = options.stacking === 'percent',
                    seriesDefault = defaultOptions.plotOptions
                        ?.[this.type]
                        ?.borderRadius,
                    borderRadius = optionsToObject(
                        options.borderRadius,
                        isObject(seriesDefault) ? seriesDefault : {}
                    ),
                    reversed = yAxis.options.reversed;

                for (const point of this.points) {
                    const { shapeArgs } = point;
                    if (point.shapeType === 'roundedRect' && shapeArgs) {
                        const {
                            width = 0,
                            height = 0,
                            y = 0
                        } = shapeArgs;

                        let brBoxY = y,
                            brBoxHeight = height;

                        // It would be nice to refactor StackItem.getStackBox/
                        // setOffset so that we could get a reliable box out of
                        // it. Currently it is close if we remove the label
                        // offset, but we still need to run crispCol and also
                        // flip it if inverted, so atm it is simpler to do it
                        // like the below.
                        if (
                            borderRadius.scope === 'stack' &&
                            point.stackTotal
                        ) {
                            const stackEnd = yAxis.translate(
                                    percent ? 100 : point.stackTotal,
                                    false,
                                    true,
                                    false,
                                    true
                                ),
                                stackThreshold = yAxis.translate(
                                    options.threshold || 0,
                                    false,
                                    true,
                                    false,
                                    true
                                ),
                                box = this.crispCol(
                                    0,
                                    Math.min(stackEnd, stackThreshold),
                                    0,
                                    Math.abs(stackEnd - stackThreshold)
                                );
                            brBoxY = box.y;
                            brBoxHeight = box.height;
                        }

                        const flip = (point.negative ? -1 : 1) *
                            (reversed ? -1 : 1) === -1;

                        // Handle the where option
                        let where = borderRadius.where;

                        // Waterfall, hanging columns should have rounding on
                        // all sides
                        if (
                            !where &&
                            this.is('waterfall') &&
                            Math.abs(
                                (point.yBottom || 0) -
                                (this.translatedThreshold || 0)
                            ) > this.borderWidth
                        ) {
                            where = 'all';
                        }

                        if (!where) {
                            where = 'end';
                        }

                        // Get the radius
                        const r = Math.min(
                            relativeLength(borderRadius.radius, width),
                            width / 2,
                            // Cap to the height, but not if where is `end`
                            where === 'all' ? height / 2 : Infinity
                        ) || 0;

                        // If the `where` option is 'end', cut off the
                        // rectangles by making the border-radius box one r
                        // greater, so that the imaginary radius falls outside
                        // the rectangle.
                        if (where === 'end') {
                            if (flip) {
                                brBoxY -= r;
                                brBoxHeight += r;
                            } else {
                                brBoxHeight += r;
                            }
                        }

                        extend(shapeArgs, { brBoxHeight, brBoxY, r });

                    }
                }
            }
        },
        {
            // After columnrange and polar column modifications
            order: 9
        }
    );
}

/* *
 *
 *  Default Export
 *
 * */

const BorderRadius = {
    optionsToObject
};

export default BorderRadius;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Detailed options for border radius.
 *
 * @sample  {highcharts} highcharts/plotoptions/column-borderradius/
 *          Rounded columns
 * @sample  highcharts/plotoptions/series-border-radius
 *          Column and pie with rounded border
 *
 * @interface Highcharts.BorderRadiusOptionsObject
 *//**
 * The border radius. A number signifies pixels. A percentage string, like for
 * example `50%`, signifies a relative size. For columns this is relative to the
 * column width, for pies it is relative to the radius and the inner radius.
 *
 * @name Highcharts.BorderRadiusOptionsObject#radius
 * @type {string|number}
 *//**
 * The scope of the rounding for column charts. In a stacked column chart, the
 * value `point` means each single point will get rounded corners. The value
 * `stack` means the rounding will apply to the full stack, so that only points
 * close to the top or bottom will receive rounding.
 *
 * @name Highcharts.BorderRadiusOptionsObject#scope
 * @validvalue ["point", "stack"]
 * @type {string}
 *//**
 * For column charts, where in the point or stack to apply rounding. The `end`
 * value means only those corners at the point value will be rounded, leaving
 * the corners at the base or threshold unrounded. This is the most intuitive
 * behaviour. The `all` value means also the base will be rounded.
 *
 * @name Highcharts.BorderRadiusOptionsObject#where
 * @validvalue ["all", "end"]
 * @type {string}
 * @default end
 */

(''); // keeps doclets above in JS file
