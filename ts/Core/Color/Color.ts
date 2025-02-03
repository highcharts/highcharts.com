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

import type ColorString from './ColorString';
import type { ColorLike, ColorType } from './ColorType';
import type GradientColor from './GradientColor';

import H from '../Globals.js';
const {
    win
} = H;
import U from '../Utilities.js';
const {
    isNumber,
    isString,
    merge,
    pInt,
    defined
} = U;

/* *
 *
 *  Helpers
 *
 * */
const colorMix = (color1: string, color2: string, weight: number): string =>
    `color-mix(in srgb,${color1},${color2} ${weight * 100}%)`;

const isStringColor = (color: ColorType): color is ColorString =>
    isString(color) && color !== 'none' && color !== '';

/* *
 *
 *  Class
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Handle color operations. Some object methods are chainable.
 *
 * @class
 * @name Highcharts.Color
 *
 * @param {Highcharts.ColorType} input
 * The input color in either rgba or hex format
 */
class Color implements ColorLike {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Collection of named colors. Can be extended from the outside by adding
     * colors to Highcharts.Color.names.
     * @private
     */
    public static names: Record<string, ColorString> = {
        white: '#ffffff',
        black: '#000000'
    };

    /**
     * Collection of parsers. This can be extended from the outside by pushing
     * parsers to `Color.parsers`.
     * @private
     */
    public static parsers = [{
        // RGBA color
        // eslint-disable-next-line max-len
        regex: /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d?(?:\.\d+)?)\s*\)/,
        parse: function (result: RegExpExecArray): Color.RGBA {
            return [
                pInt(result[1]),
                pInt(result[2]),
                pInt(result[3]),
                (parseFloat as Function)(result[4], 10)
            ];
        }
    }, {
        // RGB color
        regex:
            /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/,
        parse: function (result: RegExpExecArray): Color.RGBA {
            return [pInt(result[1]), pInt(result[2]), pInt(result[3]), 1];
        }
    }, {
        // RGBA 3 & 4 digit hex color, e.g. #F0F, #F0FA
        regex:
            /^#([a-f0-9])([a-f0-9])([a-f0-9])([a-f0-9])?$/i,
        parse: function (result: RegExpExecArray): Color.RGBA {
            // #abcd => #aabbccdd, hence result + result.
            return [
                (pInt(result[1] + result[1], 16)),
                (pInt(result[2] + result[2], 16)),
                (pInt(result[3] + result[3], 16)),
                !defined(result[4]) ?
                    1 :
                    (pInt(result[4] + result[4], 16) / 255)
            ];
        }
    }, {
        // RGBA 6 & 8 digit hex color, e.g. #FFCC00, #FFCC00FF
        regex: /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?$/i,
        parse: function (result: RegExpExecArray): Color.RGBA {
            return [
                pInt(result[1], 16),
                pInt(result[2], 16),
                pInt(result[3], 16),
                !defined(result[4]) ?
                    1 :
                    (pInt(result[4], 16) / 255)
            ];
        }
    }, {
        // The color function with srgb values, as reported by browsers when
        // doing getComputedStyle on variables
        regex: /^color\(srgb ([0-9\.]+) ([0-9\.]+) ([0-9\.]+)\)$/i,
        parse: (result: RegExpExecArray): Color.RGBA => [
            Math.floor(parseFloat(result[1]) * 255),
            Math.floor(parseFloat(result[2]) * 255),
            Math.floor(parseFloat(result[3]) * 255),
            1
        ]
    }];

    /**
     * Whether to use CSS `color-mix` for color handling (brightening,
     * tweening). This can be disabled from the outside.
     * @private
     */
    public static useColorMix = win.CSS?.supports(
        'color',
        'color-mix(in srgb,red,blue 9%)'
    );

    // Must be last static member for init cycle
    public static readonly None = new Color('');

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Creates a color instance out of a color string or object.
     *
     * @function Highcharts.Color.parse
     *
     * @param {Highcharts.ColorType} [input]
     * The input color in either rgba or hex format.
     *
     * @return {Highcharts.Color}
     * Color instance.
     */
    public static parse(input?: ColorType): Color {
        return input ? new Color(input) : Color.None;
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        input: ColorType
    ) {
        this.input = input;

        const GlobalColor = (H as AnyRecord).Color;

        // Backwards compatibility, allow class overwrite
        if (GlobalColor && GlobalColor !== Color) {
            return new GlobalColor(input);
        }

        let result: (RegExpExecArray|null),
            rgba: (Color.RGBA|undefined),
            i: number,
            parser: Color.Parser;

        // Gradients
        if (
            typeof input === 'object' &&
            typeof (input as GradientColor).stops !== 'undefined'
        ) {
            this.stops = (input as GradientColor).stops.map(
                (stop): Color => new Color(stop[1])
            );

        // Solid colors
        } else if (typeof input === 'string') {
            this.input = input = (Color.names[input.toLowerCase()] || input);

            i = Color.parsers.length;
            while (i-- && !rgba) {
                parser = Color.parsers[i];
                result = parser.regex.exec(input);
                if (result) {
                    rgba = parser.parse(result);
                }
            }
        }

        if (rgba) {
            this.rgba = rgba;
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public input: ColorType;
    public output?: string;
    public rgba: Color.RGBA = [NaN, NaN, NaN, NaN];
    public stops?: Array<Color>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Return the color or gradient stops in the specified format
     *
     * @function Highcharts.Color#get
     *
     * @param {string} [format]
     * Possible values are 'a', 'rgb', 'rgba' (default).
     *
     * @return {Highcharts.ColorType}
     * This color as a string or gradient stops.
     */
    public get(format?: ('a'|'rgb'|'rgba')): ColorType {
        const input = this.input,
            rgba = this.rgba;

        if (this.output) {
            return this.output;
        }

        if (
            typeof input === 'object' &&
            typeof this.stops !== 'undefined'
        ) {
            const ret = merge(input as GradientColor);
            ret.stops = [].slice.call(ret.stops);
            this.stops.forEach((stop: Color, i: number): void => {
                ret.stops[i] = [
                    ret.stops[i][0],
                    stop.get(format) as string
                ];
            });
            return ret;
        }

        // It's NaN if gradient colors on a column chart
        if (rgba && isNumber(rgba[0])) {
            if (format === 'rgb' || (!format && rgba[3] === 1)) {
                return 'rgb(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ')';
            }
            if (format === 'a') {
                return `${rgba[3]}`;
            }
            return 'rgba(' + rgba.join(',') + ')';
        }

        return input;
    }

    /**
     * Brighten the color instance.
     *
     * @function Highcharts.Color#brighten
     *
     * @param {number} alpha
     * The alpha value.
     *
     * @return {Highcharts.Color}
     * This color with modifications.
     */
    public brighten(alpha: number): this {
        const rgba = this.rgba;

        if (this.stops) {
            this.stops.forEach(function (stop: Color): void {
                stop.brighten(alpha);
            });

        } else if (isNumber(alpha) && alpha !== 0) {
            if (isNumber(rgba[0])) {
                for (let i = 0; i < 3; i++) {
                    rgba[i] += pInt(alpha * 255);

                    if (rgba[i] < 0) {
                        rgba[i] = 0;
                    }
                    if (rgba[i] > 255) {
                        rgba[i] = 255;
                    }
                }
            } else if (Color.useColorMix && isStringColor(this.input)) {
                this.output = colorMix(
                    this.input,
                    alpha > 0 ? 'white' : 'black',
                    Math.abs(alpha)
                );
            }
        }

        return this;
    }

    /**
     * Set the color's opacity to a given alpha value.
     *
     * @function Highcharts.Color#setOpacity
     *
     * @param {number} alpha
     *        Opacity between 0 and 1.
     *
     * @return {Highcharts.Color}
     *         Color with modifications.
     */
    public setOpacity(alpha: number): this {
        this.rgba[3] = alpha;
        return this;
    }

    /**
     * Return an intermediate color between two colors.
     *
     * @function Highcharts.Color#tweenTo
     *
     * @param {Highcharts.Color} to
     * The color object to tween to.
     *
     * @param {number} pos
     * The intermediate position, where 0 is the from color (current color
     * item), and 1 is the `to` color.
     *
     * @return {Highcharts.ColorType}
     * The intermediate color in rgba notation, or unsupported type.
     */
    public tweenTo(to: Color, pos: number): ColorType {
        const fromRgba = this.rgba,
            toRgba = to.rgba;

        // Unsupported color, return to-color (#3920, #7034)
        if (!isNumber(fromRgba[0]) || !isNumber(toRgba[0])) {
            if (
                Color.useColorMix &&
                isStringColor(this.input) &&
                isStringColor(to.input)
            ) {
                return colorMix(this.input, to.input, pos);
            }
            return to.input || 'none';
        }

        // Check for has alpha, because rgba colors perform worse due to
        // lack of support in WebKit.
        const hasAlpha = (toRgba[3] !== 1 || fromRgba[3] !== 1),
            channel = (to: number, i: number): number =>
                to + (fromRgba[i] - to) * (1 - pos),
            rgba = toRgba.slice(0, 3).map(channel).map(Math.round);

        if (hasAlpha) {
            rgba.push(channel(toRgba[3], 3));
        }

        return (hasAlpha ? 'rgba(' : 'rgb(') + rgba.join(',') + ')';
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace Color {

    export interface Parser {
        regex: RegExp;
        parse: (
            result: RegExpExecArray
        ) => RGBA;
    }

    export type RGBA = [number, number, number, number];

}

/* *
 *
 *  Default Export
 *
 * */

export default Color;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * A valid color to be parsed and handled by Highcharts. Highcharts internally
 * supports hex colors like `#ffffff`, rgb colors like `rgb(255,255,255)` and
 * rgba colors like `rgba(255,255,255,1)`. Other colors may be supported by the
 * browsers and displayed correctly, but Highcharts is not able to process them
 * and apply concepts like opacity and brightening.
 *
 * @typedef {string} Highcharts.ColorString
 */

/**
 * A valid color type than can be parsed and handled by Highcharts. It can be a
 * color string, a gradient object, or a pattern object.
 *
 * @typedef {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject} Highcharts.ColorType
 */

/**
 * Gradient options instead of a solid color.
 *
 * @example
 * // Linear gradient used as a color option
 * color: {
 *     linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
 *     stops: [
 *         [0, '#003399'], // start
 *         [0.5, '#ffffff'], // middle
 *         [1, '#3366AA'] // end
 *     ]
 * }
 *
 * @interface Highcharts.GradientColorObject
 *//**
 * Holds an object that defines the start position and the end position relative
 * to the shape.
 * @name Highcharts.GradientColorObject#linearGradient
 * @type {Highcharts.LinearGradientColorObject|undefined}
 *//**
 * Holds an object that defines the center position and the radius.
 * @name Highcharts.GradientColorObject#radialGradient
 * @type {Highcharts.RadialGradientColorObject|undefined}
 *//**
 * The first item in each tuple is the position in the gradient, where 0 is the
 * start of the gradient and 1 is the end of the gradient. Multiple stops can be
 * applied. The second item is the color for each stop. This color can also be
 * given in the rgba format.
 * @name Highcharts.GradientColorObject#stops
 * @type {Array<Highcharts.GradientColorStopObject>}
 */

/**
 * Color stop tuple.
 *
 * @see Highcharts.GradientColorObject
 *
 * @interface Highcharts.GradientColorStopObject
 *//**
 * @name Highcharts.GradientColorStopObject#0
 * @type {number}
 *//**
 * @name Highcharts.GradientColorStopObject#1
 * @type {Highcharts.ColorString}
 *//**
 * @name Highcharts.GradientColorStopObject#color
 * @type {Highcharts.Color|undefined}
 */

/**
 * Defines the start position and the end position for a gradient relative
 * to the shape. Start position (x1, y1) and end position (x2, y2) are relative
 * to the shape, where 0 means top/left and 1 is bottom/right.
 *
 * @interface Highcharts.LinearGradientColorObject
 *//**
 * Start horizontal position of the gradient. Float ranges 0-1.
 * @name Highcharts.LinearGradientColorObject#x1
 * @type {number}
 *//**
 * End horizontal position of the gradient. Float ranges 0-1.
 * @name Highcharts.LinearGradientColorObject#x2
 * @type {number}
 *//**
 * Start vertical position of the gradient. Float ranges 0-1.
 * @name Highcharts.LinearGradientColorObject#y1
 * @type {number}
 *//**
 * End vertical position of the gradient. Float ranges 0-1.
 * @name Highcharts.LinearGradientColorObject#y2
 * @type {number}
 */

/**
 * Defines the center position and the radius for a gradient.
 *
 * @interface Highcharts.RadialGradientColorObject
 *//**
 * Center horizontal position relative to the shape. Float ranges 0-1.
 * @name Highcharts.RadialGradientColorObject#cx
 * @type {number}
 *//**
 * Center vertical position relative to the shape. Float ranges 0-1.
 * @name Highcharts.RadialGradientColorObject#cy
 * @type {number}
 *//**
 * Radius relative to the shape. Float ranges 0-1.
 * @name Highcharts.RadialGradientColorObject#r
 * @type {number}
 */

/**
 * Creates a color instance out of a color string.
 *
 * @function Highcharts.color
 *
 * @param {Highcharts.ColorType} input
 *        The input color in either rgba or hex format
 *
 * @return {Highcharts.Color}
 *         Color instance
 */

(''); // Detach doclets above
