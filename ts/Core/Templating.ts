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

import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject } = TC;
const {
    extend
} = OH;
/* *
 *
 *  Imports
 *
 * */

import type Chart from './Chart/Chart';

import D from './Defaults.js';
import U from '../Shared/Utilities.js';
const {
    defaultOptions,
    defaultTime
} = D;
const {
    getNestedProperty,
    pick,
    pInt
} = U;

interface MatchObject {
    body?: string;
    ctx: any;
    elseBody?: string;
    expression: string;
    find: string;
    fn?: string;
    length: number;
    isBlock: boolean;
    start: number;
    startInner: number;
}

const helpers: Record<string, Function> = {
    // Built-in helpers
    add: (a: number, b: number): number => a + b,
    divide: (a: number, b: number): number|string => (b !== 0 ? a / b : ''),
    // eslint-disable-next-line eqeqeq
    eq: (a: unknown, b: unknown): boolean => a == b,
    each: function (arr: string[]|object[]|undefined): string|false {
        const match = arguments[arguments.length - 1];
        return isArray(arr) ?
            arr.map((item, i): string => format(match.body, extend(
                isObject(item) ? item : { '@this': item }, {
                    '@index': i,
                    '@first': i === 0,
                    '@last': i === arr.length - 1
                }
            ))).join('') :
            false;
    },
    ge: (a: number, b: number): boolean => a >= b,
    gt: (a: number, b: number): boolean => a > b,
    'if': (condition: string[]|undefined): boolean => !!condition,
    le: (a: number, b: number): boolean => a <= b,
    lt: (a: number, b: number): boolean => a < b,
    multiply: (a: number, b: number): number => a * b,
    // eslint-disable-next-line eqeqeq
    ne: (a: unknown, b: unknown): boolean => a != b,
    subtract: (a: number, b: number): number => a - b,
    unless: (condition: string[]|undefined): boolean => !condition
};

/* *
 *
 *  Functions
 *
 * */

/**
 * Formats a JavaScript date timestamp (milliseconds since Jan 1st 1970) into a
 * human readable date string. The format is a subset of the formats for PHP's
 * [strftime](https://www.php.net/manual/en/function.strftime.php) function.
 * Additional formats can be given in the {@link Highcharts.dateFormats} hook.
 *
 * Since v6.0.5, all internal dates are formatted through the
 * {@link Highcharts.Chart#time} instance to respect chart-level time settings.
 * The `Highcharts.dateFormat` function only reflects global time settings set
 * with `setOptions`.
 *
 * Supported format keys:
 * - `%a`: Short weekday, like 'Mon'
 * - `%A`: Long weekday, like 'Monday'
 * - `%d`: Two digit day of the month, 01 to 31
 * - `%e`: Day of the month, 1 through 31
 * - `%w`: Day of the week, 0 through 6
 * - `%b`: Short month, like 'Jan'
 * - `%B`: Long month, like 'January'
 * - `%m`: Two digit month number, 01 through 12
 * - `%y`: Two digits year, like 09 for 2009
 * - `%Y`: Four digits year, like 2009
 * - `%H`: Two digits hours in 24h format, 00 through 23
 * - `%k`: Hours in 24h format, 0 through 23
 * - `%I`: Two digits hours in 12h format, 00 through 11
 * - `%l`: Hours in 12h format, 1 through 12
 * - `%M`: Two digits minutes, 00 through 59
 * - `%p`: Upper case AM or PM
 * - `%P`: Lower case AM or PM
 * - `%S`: Two digits seconds, 00 through 59
 * - `%L`: Milliseconds (naming from Ruby)
 *
 * @function Highcharts.dateFormat
 *
 * @param {string} format
 *        The desired format where various time representations are prefixed
 *        with `%`.
 *
 * @param {number} timestamp
 *        The JavaScript timestamp.
 *
 * @param {boolean} [capitalize=false]
 *        Upper case first letter in the return.
 *
 * @return {string}
 *         The formatted date.
 */
function dateFormat(
    format: string,
    timestamp: number,
    capitalize?: boolean
): string {
    return defaultTime.dateFormat(format, timestamp, capitalize);
}

/**
 * Format a string according to a subset of the rules of Python's String.format
 * method.
 *
 * @example
 * let s = Highcharts.format(
 *     'The {color} fox was {len:.2f} feet long',
 *     { color: 'red', len: Math.PI }
 * );
 * // => The red fox was 3.14 feet long
 *
 * @function Highcharts.format
 *
 * @param {string} str
 *        The string to format.
 *
 * @param {Record<string, *>} ctx
 *        The context, a collection of key-value pairs where each key is
 *        replaced by its value.
 *
 * @param {Highcharts.Chart} [chart]
 *        A `Chart` instance used to get numberFormatter and time.
 *
 * @return {string}
 *         The formatted string.
 */
function format(str = '', ctx: any, chart?: Chart): string {

    const regex = /\{([a-zA-Z0-9\:\.\,;\-\/<>%_@"'= #\(\)]+)\}/g,
        // The sub expression regex is the same as the top expression regex,
        // but except parens and block helpers (#), and surrounded by parens
        // instead of curly brackets.
        subRegex = /\(([a-zA-Z0-9\:\.\,;\-\/<>%_@"'= ]+)\)/g,
        matches = [],
        floatRegex = /f$/,
        decRegex = /\.([0-9])/,
        lang = defaultOptions.lang,
        time = chart && chart.time || defaultTime,
        numberFormatter = chart && chart.numberFormatter || numberFormat;

    /*
     * Get a literal or variable value inside a template expression. May be
     * extended with other types like string or null if needed, but keep it
     * small for now.
     */
    const resolveProperty = (key = ''): unknown => {
        let n: number;

        // Literals
        if (key === 'true') {
            return true;
        }
        if (key === 'false') {
            return false;
        }
        if ((n = Number(key)).toString() === key) {
            return n;
        }

        // Variables and constants
        return getNestedProperty(key, ctx);
    };

    let match: RegExpExecArray|null,
        currentMatch: MatchObject|undefined,
        depth = 0,
        hasSub: boolean|undefined;

    // Parse and create tree
    while ((match = regex.exec(str)) !== null) {
        // When a sub expression is found, it is evaluated first, and the
        // results recursively evaluated until no subexpression exists.
        const subMatch = subRegex.exec(match[1]);
        if (subMatch) {
            match = subMatch;
            hasSub = true;
        }
        if (!currentMatch || !currentMatch.isBlock) {
            currentMatch = {
                ctx,
                expression: match[1],
                find: match[0],
                isBlock: match[1].charAt(0) === '#',
                start: match.index,
                startInner: match.index + match[0].length,
                length: match[0].length
            };
        }

        // Identify helpers
        const fn = match[1].split(' ')[0].replace('#', '');
        if (helpers[fn]) {

            // Block helper, only 0 level is handled
            if (currentMatch.isBlock && fn === currentMatch.fn) {
                depth++;
            }
            if (!currentMatch.fn) {
                currentMatch.fn = fn;
            }
        }

        // Closing a block helper
        const startingElseSection = match[1] === 'else';
        if (
            currentMatch.isBlock &&
            currentMatch.fn && (
                match[1] === `/${currentMatch.fn}` ||
                startingElseSection
            )
        ) {
            if (!depth) { // === 0

                const start = currentMatch.startInner,
                    body = str.substr(
                        start,
                        match.index - start
                    );

                // Either closing without an else section, or when encountering
                // an else section
                if (currentMatch.body === void 0) {
                    currentMatch.body = body;
                    currentMatch.startInner = match.index + match[0].length;

                // The body exists already, so this is the else section
                } else {
                    currentMatch.elseBody = body;
                }
                currentMatch.find += body + match[0];

                if (!startingElseSection) {
                    matches.push(currentMatch);
                    currentMatch = void 0;
                }
            } else if (!startingElseSection) {
                depth--;
            }

        // Common expression
        } else if (!currentMatch.isBlock) {
            matches.push(currentMatch);
        }

        // Evaluate sub-matches one by one to prevent orphaned block closers
        if (subMatch && !currentMatch?.isBlock) {
            break;
        }
    }

    // Execute
    matches.forEach((match): void => {
        const { body, elseBody, expression, fn } = match;
        let replacement: any,
            i: number;

        // Helper function
        if (fn) {
            // Pass the helpers the amount of arguments defined by the function,
            // then the match as the last argument.
            const args: unknown[] = [match],
                parts = expression.split(' ');

            i = helpers[fn].length;
            while (i--) {
                args.unshift(resolveProperty(parts[i + 1]));
            }

            replacement = helpers[fn].apply(ctx, args);

            // Block helpers may return true or false. They may also return a
            // string, like the `each` helper.
            if (match.isBlock && typeof replacement === 'boolean') {
                replacement = format(replacement ? body : elseBody, ctx);
            }


        // Simple variable replacement
        } else {
            const valueAndFormat = expression.split(':');

            replacement = resolveProperty(valueAndFormat.shift() || '');

            // Format the replacement
            if (valueAndFormat.length && typeof replacement === 'number') {

                const segment = valueAndFormat.join(':');

                if (floatRegex.test(segment)) { // float
                    const decimals = parseInt(
                        (segment.match(decRegex) || ['', '-1'])[1],
                        10
                    );
                    if (replacement !== null) {
                        replacement = numberFormatter(
                            replacement,
                            decimals,
                            lang.decimalPoint,
                            segment.indexOf(',') > -1 ? lang.thousandsSep : ''
                        );
                    }
                } else {
                    replacement = time.dateFormat(segment, replacement);
                }
            }
        }
        str = str.replace(match.find, pick(replacement, ''));
    });
    return hasSub ? format(str, ctx, chart) : str;
}

/**
 * Format a number and return a string based on input settings.
 *
 * @sample highcharts/members/highcharts-numberformat/
 *         Custom number format
 *
 * @function Highcharts.numberFormat
 *
 * @param {number} number
 *        The input number to format.
 *
 * @param {number} decimals
 *        The amount of decimals. A value of -1 preserves the amount in the
 *        input number.
 *
 * @param {string} [decimalPoint]
 *        The decimal point, defaults to the one given in the lang options, or
 *        a dot.
 *
 * @param {string} [thousandsSep]
 *        The thousands separator, defaults to the one given in the lang
 *        options, or a space character.
 *
 * @return {string}
 *         The formatted number.
 */
function numberFormat(
    number: number,
    decimals: number,
    decimalPoint?: string,
    thousandsSep?: string
): string {
    number = +number || 0;
    decimals = +decimals;

    let ret,
        fractionDigits;

    const lang = defaultOptions.lang,
        origDec = (number.toString().split('.')[1] || '').split('e')[0].length,
        exponent = number.toString().split('e'),
        firstDecimals = decimals;

    if (decimals === -1) {
        // Preserve decimals. Not huge numbers (#3793).
        decimals = Math.min(origDec, 20);
    } else if (!isNumber(decimals)) {
        decimals = 2;
    } else if (decimals && exponent[1] && exponent[1] as any < 0) {
        // Expose decimals from exponential notation (#7042)
        fractionDigits = decimals + +exponent[1];
        if (fractionDigits >= 0) {
            // remove too small part of the number while keeping the notation
            exponent[0] = (+exponent[0]).toExponential(fractionDigits)
                .split('e')[0];
            decimals = fractionDigits;
        } else {
            // fractionDigits < 0
            exponent[0] = exponent[0].split('.')[0] || 0 as any;

            if (decimals < 20) {
                // use number instead of exponential notation (#7405)
                number = (exponent[0] as any * Math.pow(10, exponent[1] as any))
                    .toFixed(decimals) as any;
            } else {
                // or zero
                number = 0;
            }
            exponent[1] = 0 as any;
        }
    }

    // Add another decimal to avoid rounding errors of float numbers. (#4573)
    // Then use toFixed to handle rounding.
    const roundedNumber = (
        Math.abs(exponent[1] ? exponent[0] as any : number) +
        Math.pow(10, -Math.max(decimals, origDec) - 1)
    ).toFixed(decimals);

    // A string containing the positive integer component of the number
    const strinteger = String(pInt(roundedNumber));

    // Leftover after grouping into thousands. Can be 0, 1 or 2.
    const thousands = strinteger.length > 3 ? strinteger.length % 3 : 0;

    // Language
    decimalPoint = pick(decimalPoint, lang.decimalPoint);
    thousandsSep = pick(thousandsSep, lang.thousandsSep);

    // Start building the return
    ret = number < 0 ? '-' : '';

    // Add the leftover after grouping into thousands. For example, in the
    // number 42 000 000, this line adds 42.
    ret += thousands ? strinteger.substr(0, thousands) + thousandsSep : '';

    if (+exponent[1] < 0 && !firstDecimals) {
        ret = '0';
    } else {
        // Add the remaining thousands groups, joined by the thousands separator
        ret += strinteger
            .substr(thousands)
            .replace(/(\d{3})(?=\d)/g, '$1' + thousandsSep);
    }

    // Add the decimal point and the decimal component
    if (decimals) {
        // Get the decimal component
        ret += decimalPoint + roundedNumber.slice(-decimals);
    }

    if (exponent[1] && +ret !== 0) {
        ret += 'e' + exponent[1];
    }

    return ret;
}

/* *
 *
 *  Default Export
 *
 * */

const Templating = {
    dateFormat,
    format,
    helpers,
    numberFormat
};

namespace Templating {
    export interface FormatterCallback<T> {
        (this: T): string;
    }
}

export default Templating;
