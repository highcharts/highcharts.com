/* *
 *
 *  Accessibility module - internationalization support
 *
 *  (c) 2010-2021 Highsoft AS
 *  Author: Øystein Moseng
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

import type Time from '../Core/Time';

import Chart from '../Core/Chart/Chart.js';
import F from '../Core/Templating.js';
const { format } = F;

import U from '../Core/Utilities.js';
const {
    getNestedProperty,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Chart/ChartLike' {
    interface ChartLike extends A11yI18nComposition.ChartComposition {
        // nothing to add
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace A11yI18nComposition {

    /* *
     *
     *  Declarations
     *
     * */

    interface A11yBracketStatementObject {
        begin: number;
        end: number;
        statement: string;
    }

    interface A11yFormatTokenObject {
        type: string;
        value: string;
    }

    export declare class ChartComposition {
        /** @requires modules/accessibility */
        langFormat(
            langKey: string,
            context: AnyRecord,
            time?: Time
        ): string;
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

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    export function compose<T extends typeof Chart>(
        ChartClass: T
    ): (T&ChartComposition) {

        if (U.pushUnique(composedMembers, ChartClass)) {
            const chartProto = ChartClass.prototype as ChartComposition;

            chartProto.langFormat = langFormat;
        }

        return ChartClass as (T&ChartComposition);
    }

    /**
     * i18n utility function.  Format a single array or plural statement in a
     * format string.  If the statement is not an array or plural statement,
     * returns the statement within brackets.  Invalid array statements return
     * an empty string.
     *
     * @private
     * @function formatExtendedStatement
     * @param {string} statement
     * @param {Highcharts.Dictionary<*>} ctx
     * Context to apply to the format string.
     */
    function formatExtendedStatement(
        statement: string,
        ctx: AnyRecord
    ): string {
        const eachStart = statement.indexOf('#each('),
            pluralStart = statement.indexOf('#plural('),
            indexStart = statement.indexOf('['),
            indexEnd = statement.indexOf(']');

        let arr: Array<unknown>,
            result;

        // Dealing with an each-function?
        if (eachStart > -1) {
            const eachEnd = statement.slice(eachStart).indexOf(')') + eachStart,
                preEach = statement.substring(0, eachStart),
                postEach = statement.substring(eachEnd + 1),
                eachStatement = statement.substring(eachStart + 6, eachEnd),
                eachArguments = eachStatement.split(',');

            let lenArg = Number(eachArguments[1]),
                len;

            result = '';
            arr = getNestedProperty(eachArguments[0], ctx) as unknown[];
            if (arr) {
                lenArg = isNaN(lenArg) ? arr.length : lenArg;
                len = lenArg < 0 ?
                    arr.length + lenArg :
                    Math.min(lenArg, arr.length); // Overshoot
                // Run through the array for the specified length
                for (let i = 0; i < len; ++i) {
                    result += preEach + (arr[i] as string) + postEach;
                }
            }
            return result.length ? result : '';
        }

        // Dealing with a plural-function?
        if (pluralStart > -1) {
            const pluralEnd = (
                    statement.slice(pluralStart).indexOf(')') + pluralStart
                ),
                pluralStatement = statement.substring(
                    pluralStart + 8,
                    pluralEnd
                ),
                pluralArguments = pluralStatement.split(','),
                num = Number(
                    getNestedProperty(pluralArguments[0], ctx)
                );

            switch (num) {
                case 0:
                    result = pick(pluralArguments[4], pluralArguments[1]);
                    break;
                case 1:
                    result = pick(pluralArguments[2], pluralArguments[1]);
                    break;
                case 2:
                    result = pick(pluralArguments[3], pluralArguments[1]);
                    break;
                default:
                    result = pluralArguments[1];
            }
            return result ? stringTrim(result) : '';
        }

        // Array index
        if (indexStart > -1) {
            const arrayName = statement.substring(0, indexStart),
                ix = Number(statement.substring(indexStart + 1, indexEnd));

            let val;

            arr = getNestedProperty(arrayName, ctx) as unknown[];
            if (!isNaN(ix) && arr) {
                if (ix < 0) {
                    val = arr[arr.length + ix];
                    // Handle negative overshoot
                    if (typeof val === 'undefined') {
                        val = arr[0];
                    }
                } else {
                    val = arr[ix];
                    // Handle positive overshoot
                    if (typeof val === 'undefined') {
                        val = arr[arr.length - 1];
                    }
                }
            }
            return typeof val !== 'undefined' ? (val as string) : '';
        }

        // Standard substitution, delegate to format or similar
        return '{' + statement + '}';
    }

    /* eslint-disable max-len */
    /**
     * i18n formatting function.  Extends Highcharts.format() functionality by
     * also handling arrays and plural conditionals.  Arrays can be indexed as
     * follows:
     *
     * - Format: 'This is the first index: {myArray[0]}. The last: {myArray[-1]}.'
     *
     * - Context: { myArray: [0, 1, 2, 3, 4, 5] }
     *
     * - Result: 'This is the first index: 0. The last: 5.'
     *
     *
     * They can also be iterated using the #each() function.  This will repeat
     * the contents of the bracket expression for each element.  Example:
     *
     * - Format: 'List contains: {#each(myArray)cm }'
     *
     * - Context: { myArray: [0, 1, 2] }
     *
     * - Result: 'List contains: 0cm 1cm 2cm '
     *
     *
     * The #each() function optionally takes a length parameter.  If positive,
     * this parameter specifies the max number of elements to iterate through.
     * If negative, the function will subtract the number from the length of the
     * array.  Use this to stop iterating before the array ends.  Example:
     *
     * - Format: 'List contains: {#each(myArray, -1), }and {myArray[-1]}.'
     *
     * - Context: { myArray: [0, 1, 2, 3] }
     *
     * - Result: 'List contains: 0, 1, 2, and 3.'
     *
     *
     * Use the #plural() function to pick a string depending on whether or not a
     * context object is 1.  Arguments are #plural(obj, plural, singular).
     * Example:
     *
     * - Format: 'Has {numPoints} {#plural(numPoints, points, point}.'
     *
     * - Context: { numPoints: 5 }
     *
     * - Result: 'Has 5 points.'
     *
     *
     * Optionally there are additional parameters for dual and none:
     * #plural(obj, plural, singular, dual, none).  Example:
     *
     * - Format: 'Has {#plural(numPoints, many points, one point, two points,
     *   none}.'
     *
     * - Context: { numPoints: 2 }
     *
     * - Result: 'Has two points.'
     *
     *
     * The dual or none parameters will take precedence if they are supplied.
     *
     * @requires modules/accessibility
     *
     * @function Highcharts.i18nFormat
     *
     * @param {string} formatString
     * The string to format.
     *
     * @param {Highcharts.Dictionary<*>} context
     * Context to apply to the format string.
     *
     * @param {Highcharts.Chart} chart
     * A `Chart` instance with a time object and numberFormatter, passed on to
     * format().
     *
     * @deprecated
     *
     * @return {string}
     * The formatted string.
     */
    export function i18nFormat(
        formatString: string,
        context: AnyRecord,
        chart: Chart
    ): string {
        const getFirstBracketStatement = (
                sourceStr: string,
                offset: number
            ): (A11yBracketStatementObject|undefined
                ) => {
                const str = sourceStr.slice(offset || 0),
                    startBracket = str.indexOf('{'),
                    endBracket = str.indexOf('}');

                if (startBracket > -1 && endBracket > startBracket) {
                    return {
                        statement: str.substring(startBracket + 1, endBracket),
                        begin: offset + startBracket + 1,
                        end: offset + endBracket
                    };
                }
            },
            tokens: Array<A11yFormatTokenObject> = [];

        let bracketRes,
            constRes,
            cursor = 0;

        // Tokenize format string into bracket statements and constants
        do {
            bracketRes = getFirstBracketStatement(formatString, cursor);
            constRes = formatString.substring(
                cursor,
                bracketRes && bracketRes.begin - 1
            );

            // If we have constant content before this bracket statement, add it
            if (constRes.length) {
                tokens.push({
                    value: constRes,
                    type: 'constant'
                });
            }

            // Add the bracket statement
            if (bracketRes) {
                tokens.push({
                    value: bracketRes.statement,
                    type: 'statement'
                });
            }

            cursor = bracketRes ? bracketRes.end + 1 : cursor + 1;
        } while (bracketRes);

        // Perform the formatting.  The formatArrayStatement function returns
        // the statement in brackets if it is not an array statement, which
        // means it gets picked up by format below.
        tokens.forEach((token): void => {
            if (token.type === 'statement') {
                token.value = formatExtendedStatement(token.value, context);
            }
        });

        // Join string back together and pass to format to pick up non-array
        // statements.
        return format(
            tokens.reduce(
                (
                    acc: string,
                    cur: A11yFormatTokenObject
                ): string => acc + cur.value,
                ''
            ),
            context,
            chart
        );
    }
    /* eslint-enable max-len */

    /**
     * Apply context to a format string from lang options of the chart.
     *
     * @requires modules/accessibility
     *
     * @function Highcharts.Chart#langFormat
     *
     * @param {string} langKey
     * Key (using dot notation) into lang option structure.
     *
     * @param {Highcharts.Dictionary<*>} context
     * Context to apply to the format string.
     *
     * @return {string}
     * The formatted string.
     */
    function langFormat(
        this: Chart,
        langKey: string,
        context: AnyRecord
    ): string {
        const keys = langKey.split('.');

        let formatString: string = this.options.lang as any,
            i = 0;

        for (; i < keys.length; ++i) {
            formatString = formatString && (formatString as any)[keys[i]];
        }
        return typeof formatString === 'string' ?
            i18nFormat(formatString, context, this) : '';
    }

    /**
     * @private
     * @function stringTrim
     *
     * @param {string} str
     * The input string
     *
     * @return {string}
     * The trimmed string
     */
    function stringTrim(str: string): string {
        return str.trim && str.trim() || str.replace(/^\s+|\s+$/g, '');
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default A11yI18nComposition;
