import DataGridUtils from './DataGridUtils.js';
import Time from '../Core/Time.js';

const {
    pick,
    isArray,
    extend,
    isNumber,
    pInt,
    isObject,
    getNestedProperty
} = DataGridUtils;

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
const lang = {

    /**
     * The loading text that appears when the chart is set into the loading
     * state following a call to `chart.showLoading`.
     */
    loading: 'Loading...',

    /**
     * An array containing the months names. Corresponds to the `%B` format
     * in `Highcharts.dateFormat()`.
     *
     * @type    {Array<string>}
     * @default ["January", "February", "March", "April", "May", "June",
     *          "July", "August", "September", "October", "November",
     *          "December"]
     */
    months: [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'
    ],

    /**
     * An array containing the months names in abbreviated form. Corresponds
     * to the `%b` format in `Highcharts.dateFormat()`.
     *
     * @type    {Array<string>}
     * @default ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     *          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
     */
    shortMonths: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
        'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],

    /**
     * An array containing the weekday names.
     *
     * @type    {Array<string>}
     * @default ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
     *          "Friday", "Saturday"]
     */
    weekdays: [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ],

    /**
     * Short week days, starting Sunday. If not specified, Highcharts uses
     * the first three letters of the `lang.weekdays` option.
     *
     * @sample highcharts/lang/shortweekdays/
     *         Finnish two-letter abbreviations
     *
     * @type      {Array<string>}
     * @since     4.2.4
     * @apioption lang.shortWeekdays
     */

    /**
     * What to show in a date field for invalid dates. Defaults to an empty
     * string.
     *
     * @type      {string}
     * @since     4.1.8
     * @product   highcharts highstock
     * @apioption lang.invalidDate
     */

    /**
     * The title appearing on hovering the zoom in button. The text itself
     * defaults to "+" and can be changed in the button options.
     *
     * @type      {string}
     * @default   Zoom in
     * @product   highmaps
     * @apioption lang.zoomIn
     */

    /**
     * The title appearing on hovering the zoom out button. The text itself
     * defaults to "-" and can be changed in the button options.
     *
     * @type      {string}
     * @default   Zoom out
     * @product   highmaps
     * @apioption lang.zoomOut
     */

    /**
     * The default decimal point used in the `Highcharts.numberFormat`
     * method unless otherwise specified in the function arguments.
     *
     * @since 1.2.2
     */
    decimalPoint: '.',

    /**
     * [Metric prefixes](https://en.wikipedia.org/wiki/Metric_prefix) used
     * to shorten high numbers in axis labels. Replacing any of the
     * positions with `null` causes the full number to be written. Setting
     * `numericSymbols` to `null` disables shortening altogether.
     *
     * @sample {highcharts} highcharts/lang/numericsymbols/
     *         Replacing the symbols with text
     * @sample {highstock} highcharts/lang/numericsymbols/
     *         Replacing the symbols with text
     *
     * @type    {Array<string>}
     * @default ["k", "M", "G", "T", "P", "E"]
     * @since   2.3.0
     */
    numericSymbols: ['k', 'M', 'G', 'T', 'P', 'E'],

    /**
     * The magnitude of [numericSymbols](#lang.numericSymbol) replacements.
     * Use 10000 for Japanese, Korean and various Chinese locales, which
     * use symbols for 10^4, 10^8 and 10^12.
     *
     * @sample highcharts/lang/numericsymbolmagnitude/
     *         10000 magnitude for Japanese
     *
     * @type      {number}
     * @default   1000
     * @since     5.0.3
     * @apioption lang.numericSymbolMagnitude
     */

    /**
     * The text for the label appearing when a chart is zoomed.
     *
     * @since 1.2.4
     */
    resetZoom: 'Reset zoom',

    /**
     * The tooltip title for the label appearing when a chart is zoomed.
     *
     * @since 1.2.4
     */
    resetZoomTitle: 'Reset zoom level 1:1',

    /**
     * The default thousands separator used in the `Highcharts.numberFormat`
     * method unless otherwise specified in the function arguments. Defaults
     * to a single space character, which is recommended in
     * [ISO 31-0](https://en.wikipedia.org/wiki/ISO_31-0#Numbers) and works
     * across Anglo-American and continental European languages.
     *
     * @default \u0020
     * @since   1.2.2
     */
    thousandsSep: ' '
},
    timeOptions = {
        /**
         * A custom `Date` class for advanced date handling. For example,
         * [JDate](https://github.com/tahajahangir/jdate) can be hooked in to
         * handle Jalali dates.
         *
         * @type      {*}
         * @since     4.0.4
         * @product   highcharts highstock gantt
         */
        Date: void 0,
        /**
         * A callback to return the time zone offset for a given datetime. It
         * takes the timestamp in terms of milliseconds since January 1 1970,
         * and returns the timezone offset in minutes. This provides a hook
         * for drawing time based charts in specific time zones using their
         * local DST crossover dates, with the help of external libraries.
         *
         * @see [global.timezoneOffset](#global.timezoneOffset)
         *
         * @sample {highcharts|highstock} highcharts/time/gettimezoneoffset/
         *         Use moment.js to draw Oslo time regardless of browser locale
         *
         * @type      {Highcharts.TimezoneOffsetCallbackFunction}
         * @since     4.1.0
         * @product   highcharts highstock gantt
         */
        getTimezoneOffset: void 0,

        /**
         * Requires [moment.js](https://momentjs.com/). If the timezone option
         * is specified, it creates a default
         * [getTimezoneOffset](#time.getTimezoneOffset) function that looks
         * up the specified timezone in moment.js. If moment.js is not included,
         * this throws a Highcharts error in the console, but does not crash the
         * chart.
         *
         * @see [getTimezoneOffset](#time.getTimezoneOffset)
         *
         * @sample {highcharts|highstock} highcharts/time/timezone/
         *         Europe/Oslo
         *
         * @type      {string}
         * @since     5.0.7
         * @product   highcharts highstock gantt
         */
        timezone: void 0,
        /**
         * The timezone offset in minutes. Positive values are west, negative
         * values are east of UTC, as in the ECMAScript
         * [getTimezoneOffset](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset)
         * method. Use this to display UTC based data in a predefined time zone.
         *
         * @see [time.getTimezoneOffset](#time.getTimezoneOffset)
         *
         * @sample {highcharts|highstock} highcharts/time/timezoneoffset/
         *         Timezone offset
         *
         * @since     3.0.8
         * @product   highcharts highstock gantt
         */
        timezoneOffset: 0,

        /**
         * Whether to use UTC time for axis scaling, tickmark placement and
         * time display in `Highcharts.dateFormat`. Advantages of using UTC
         * is that the time displays equally regardless of the user agent's
         * time zone settings. Local time can be used when the data is loaded
         * in real time or when correct Daylight Saving Time transitions are
         * required.
         *
         * @sample {highcharts} highcharts/time/useutc-true/
         *         True by default
         * @sample {highcharts} highcharts/time/useutc-false/
         *         False
         */
        useUTC: true
    };
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

    const origDec = (number.toString().split('.')[1] || '').split('e')[0].length,
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
};

const time = new Time(timeOptions);
function format(str = '', ctx: any): string {

    const regex = /\{([a-zA-Z0-9\:\.\,;\-\/<>%_@"'= #\(\)]+)\}/g,
        // The sub expression regex is the same as the top expression regex,
        // but except parens and block helpers (#), and surrounded by parens
        // instead of curly brackets.
        subRegex = /\(([a-zA-Z0-9\:\.\,;\-\/<>%_@"'= ]+)\)/g,
        matches = [],
        floatRegex = /f$/,
        decRegex = /\.([0-9])/,
        numberFormatter = numberFormat;

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
    return hasSub ? format(str, ctx) : str;
}

const Templating = {
    format
}

export default Templating;