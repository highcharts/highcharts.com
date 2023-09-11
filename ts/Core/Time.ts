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

import type TickPositionsArray from './Axis/TickPositionsArray';
import type TimeTicksInfoObject from './Axis/TimeTicksInfoObject';

import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
import error from '../Shared/Helpers/Error.js';
const {
    splat
} = AH;
const { isObject } = TC;
const { merge, defined, objectEach, extend } = OH;
import H from './Globals.js';
const {
    win
} = H;
import U from '../Shared/Utilities.js';
const {
    pad,
    pick,
    timeUnits
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './Options' {
    interface Options {
        time?: Time.TimeOptions;
    }
}

declare module './Axis/TickPositionsArray'{
    interface TickPositionsArray {
        info?: TimeTicksInfoObject;
    }
}

/* *
 *
 *  Constants
 *
 * */

const hasNewSafariBug =
    H.isSafari &&
    win.Intl &&
    win.Intl.DateTimeFormat.prototype.formatRange;

// To do: Remove this when we no longer need support for Safari < v14.1
const hasOldSafariBug =
    H.isSafari &&
    win.Intl &&
    !win.Intl.DateTimeFormat.prototype.formatRange;

/* *
 *
 *  Class
 *
 * */

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * The Time class. Time settings are applied in general for each page using
 * `Highcharts.setOptions`, or individually for each Chart item through the
 * [time](https://api.highcharts.com/highcharts/time) options set.
 *
 * The Time object is available from {@link Highcharts.Chart#time},
 * which refers to  `Highcharts.time` if no individual time settings are
 * applied.
 *
 * @example
 * // Apply time settings globally
 * Highcharts.setOptions({
 *     time: {
 *         timezone: 'Europe/London'
 *     }
 * });
 *
 * // Apply time settings by instance
 * let chart = Highcharts.chart('container', {
 *     time: {
 *         timezone: 'America/New_York'
 *     },
 *     series: [{
 *         data: [1, 4, 3, 5]
 *     }]
 * });
 *
 * // Use the Time object
 * console.log(
 *        'Current time in New York',
 *        chart.time.dateFormat('%Y-%m-%d %H:%M:%S', Date.now())
 * );
 *
 * @since 6.0.5
 *
 * @class
 * @name Highcharts.Time
 *
 * @param {Highcharts.TimeOptions} [options]
 * Time options as defined in [chart.options.time](/highcharts/time).
 */
class Time {

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        options?: Time.TimeOptions
    ) {
        /**
         * Get the time zone offset based on the current timezone information as
         * set in the global options.
         *
         * @function Highcharts.Time#getTimezoneOffset
         *
         * @param {number} timestamp
         *        The JavaScript timestamp to inspect.
         *
         * @return {number}
         *         The timezone offset in minutes compared to UTC.
         */
        this.getTimezoneOffset = this.timezoneOffsetFunction();

        this.update(options);
    }

    /* *
     *
     *  Properties
     *
     * */

    public options: Time.TimeOptions = {};

    public timezoneOffset?: number;

    public useUTC: boolean = false;

    public variableTimezone: boolean = false;

    public Date: typeof Date = win.Date;

    public getTimezoneOffset: ReturnType<Time['timezoneOffsetFunction']>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Time units used in `Time.get` and `Time.set`
     *
     * @typedef {"Date"|"Day"|"FullYear"|"Hours"|"Milliseconds"|"Minutes"|"Month"|"Seconds"} Highcharts.TimeUnitValue
     */

    /**
     * Get the value of a date object in given units, and subject to the Time
     * object's current timezone settings. This function corresponds directly to
     * JavaScripts `Date.getXXX / Date.getUTCXXX`, so instead of calling
     * `date.getHours()` or `date.getUTCHours()` we will call
     * `time.get('Hours')`.
     *
     * @function Highcharts.Time#get
     *
     * @param {Highcharts.TimeUnitValue} unit
     * @param {Date} date
     *
     * @return {number}
     *        The given time unit
     */
    public get(unit: Time.TimeUnitValue, date: Date): number {
        if (this.variableTimezone || this.timezoneOffset) {
            const realMs = date.getTime();
            const ms = realMs - this.getTimezoneOffset(date);

            date.setTime(ms); // Temporary adjust to timezone
            const ret = (date as any)['getUTC' + unit]();
            date.setTime(realMs); // Reset
            return ret;
        }

        // UTC time with no timezone handling
        if (this.useUTC) {
            return (date as any)['getUTC' + unit]();
        }

        // Else, local time
        return (date as any)['get' + unit]();
    }

    /**
     * Set the value of a date object in given units, and subject to the Time
     * object's current timezone settings. This function corresponds directly to
     * JavaScripts `Date.setXXX / Date.setUTCXXX`, so instead of calling
     * `date.setHours(0)` or `date.setUTCHours(0)` we will call
     * `time.set('Hours', 0)`.
     *
     * @function Highcharts.Time#set
     *
     * @param {Highcharts.TimeUnitValue} unit
     * @param {Date} date
     * @param {number} value
     *
     * @return {number}
     *        The epoch milliseconds of the updated date
     */
    public set(unit: Time.TimeUnitValue, date: Date, value: number): number {
        // UTC time with timezone handling
        if (this.variableTimezone || this.timezoneOffset) {
            // For lower order time units, just set it directly using UTC
            // time
            if (
                unit === 'Milliseconds' ||
                unit === 'Seconds' ||
                (
                    unit === 'Minutes' &&
                    this.getTimezoneOffset(date) % 3600000 === 0
                ) // #13961
            ) {
                return (date as any)['setUTC' + unit](value);
            }

            // Higher order time units need to take the time zone into
            // account

            // Adjust by timezone
            const offset = this.getTimezoneOffset(date);
            let ms = date.getTime() - offset;
            date.setTime(ms);

            (date as any)['setUTC' + unit](value);
            const newOffset = this.getTimezoneOffset(date);

            ms = date.getTime() + newOffset;
            return date.setTime(ms);
        }

        // UTC time with no timezone handling
        if (
            this.useUTC ||
            // leap calculation in UTC only
            (hasNewSafariBug && unit === 'FullYear')
        ) {
            return (date as any)['setUTC' + unit](value);
        }

        // Else, local time
        return (date as any)['set' + unit](value);
    }

    /**
     * Update the Time object with current options. It is called internally on
     * initializing Highcharts, after running `Highcharts.setOptions` and on
     * `Chart.update`.
     *
     * @private
     * @function Highcharts.Time#update
     *
     * @param {Highcharts.TimeOptions} [options]
     *
     */
    public update(
        options: Time.TimeOptions = {}
    ): void {
        const useUTC = pick(options.useUTC, true);

        this.options = options = merge(true, this.options, options);

        // Allow using a different Date class
        this.Date = options.Date || win.Date || Date;

        this.useUTC = useUTC;
        this.timezoneOffset = (useUTC && options.timezoneOffset) || void 0;

        this.getTimezoneOffset = this.timezoneOffsetFunction();

        /*
         * The time object has options allowing for variable time zones, meaning
         * the axis ticks or series data needs to consider this.
         */
        this.variableTimezone = useUTC && !!(
            options.getTimezoneOffset ||
            options.timezone
        );
    }

    /**
     * Make a time and returns milliseconds. Interprets the inputs as UTC time,
     * local time or a specific timezone time depending on the current time
     * settings.
     *
     * @function Highcharts.Time#makeTime
     *
     * @param {number} year
     *        The year
     *
     * @param {number} month
     *        The month. Zero-based, so January is 0.
     *
     * @param {number} [date=1]
     *        The day of the month
     *
     * @param {number} [hours=0]
     *        The hour of the day, 0-23.
     *
     * @param {number} [minutes=0]
     *        The minutes
     *
     * @param {number} [seconds=0]
     *        The seconds
     *
     * @return {number}
     *         The time in milliseconds since January 1st 1970.
     */
    public makeTime(
        year: number,
        month: number,
        date?: number,
        hours?: number,
        minutes?: number,
        seconds?: number
    ): number {
        let d, offset, newOffset;

        if (this.useUTC) {
            d = this.Date.UTC.apply(0, arguments);
            offset = this.getTimezoneOffset(d);
            d += offset;
            newOffset = this.getTimezoneOffset(d);

            if (offset !== newOffset) {
                d += newOffset - offset;

            // A special case for transitioning from summer time to winter time.
            // When the clock is set back, the same time is repeated twice, i.e.
            // 02:30 am is repeated since the clock is set back from 3 am to
            // 2 am. We need to make the same time as local Date does.
            } else if (
                offset - 36e5 === this.getTimezoneOffset(d - 36e5) &&
                !hasOldSafariBug
            ) {
                d -= 36e5;
            }

        } else {
            d = new this.Date(
                year,
                month,
                pick(date, 1),
                pick(hours, 0),
                pick(minutes, 0),
                pick(seconds, 0)
            ).getTime();
        }
        return d;
    }

    /**
     * Sets the getTimezoneOffset function. If the `timezone` option is set, a
     * default getTimezoneOffset function with that timezone is returned. If
     * a `getTimezoneOffset` option is defined, it is returned. If neither are
     * specified, the function using the `timezoneOffset` option or 0 offset is
     * returned.
     *
     * @private
     * @function Highcharts.Time#timezoneOffsetFunction
     *
     * @return {Function}
     *         A getTimezoneOffset function
     */
    public timezoneOffsetFunction(): (timestamp: (number|Date)) => number {
        const time = this,
            options = this.options,
            getTimezoneOffset = options.getTimezoneOffset,
            moment = options.moment || (win as any).moment;

        if (!this.useUTC) {
            return function (timestamp: (number|Date)): number {
                return new Date(
                    timestamp.toString()
                ).getTimezoneOffset() * 60000;
            };
        }

        if (options.timezone) {
            if (!moment) {
                // getTimezoneOffset-function stays undefined because it depends
                // on Moment.js
                error(25);

            } else {
                return function (timestamp: (number|Date)): number {
                    return -moment.tz(
                        timestamp,
                        options.timezone
                    ).utcOffset() * 60000;
                };
            }
        }

        // If not timezone is set, look for the getTimezoneOffset callback
        if (this.useUTC && getTimezoneOffset) {
            return function (timestamp: (number|Date)): number {
                return getTimezoneOffset(timestamp.valueOf()) * 60000;
            };
        }

        // Last, use the `timezoneOffset` option if set
        return function (): number {
            return (time.timezoneOffset || 0) * 60000;
        };
    }

    /**
     * Formats a JavaScript date timestamp (milliseconds since Jan 1st 1970)
     * into a human readable date string. The available format keys are listed
     * below. Additional formats can be given in the
     * {@link Highcharts.dateFormats} hook.
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
     * @example
     * const time = new Highcharts.Time();
     * const s = time.dateFormat('%Y-%m-%d %H:%M:%S', Date.UTC(2020, 0, 1));
     * console.log(s); // => 2020-01-01 00:00:00
     *
     * @function Highcharts.Time#dateFormat
     *
     * @param {string} format
     *        The desired format where various time representations are
     *        prefixed with %.
     *
     * @param {number} [timestamp]
     *        The JavaScript timestamp.
     *
     * @param {boolean} [capitalize=false]
     *        Upper case first letter in the return.
     *
     * @return {string}
     *         The formatted date.
     */
    public dateFormat(
        format: string,
        timestamp?: number,
        capitalize?: boolean
    ): string {
        if (!defined(timestamp) || isNaN(timestamp)) {
            return (
                H.defaultOptions.lang &&
                H.defaultOptions.lang.invalidDate ||
                ''
            );
        }
        format = pick(format, '%Y-%m-%d %H:%M:%S');

        const time = this,
            date = new this.Date(timestamp as any),
            // get the basic time values
            hours = this.get('Hours', date),
            day = this.get('Day', date),
            dayOfMonth = this.get('Date', date),
            month = this.get('Month', date),
            fullYear = this.get('FullYear', date),
            lang = H.defaultOptions.lang,
            langWeekdays = (lang && lang.weekdays as any),
            shortWeekdays = (lang && lang.shortWeekdays),

            // List all format keys. Custom formats can be added from the
            // outside.
            replacements = extend(
                {

                    // Day
                    // Short weekday, like 'Mon'
                    a: shortWeekdays ?
                        shortWeekdays[day] :
                        langWeekdays[day].substr(0, 3),
                    // Long weekday, like 'Monday'
                    A: langWeekdays[day],
                    // Two digit day of the month, 01 to 31
                    d: pad(dayOfMonth),
                    // Day of the month, 1 through 31
                    e: pad(dayOfMonth, 2, ' '),
                    // Day of the week, 0 through 6
                    w: day,

                    // Week (none implemented)
                    // 'W': weekNumber(),

                    // Month
                    // Short month, like 'Jan'
                    b: lang.shortMonths[month],
                    // Long month, like 'January'
                    B: lang.months[month],
                    // Two digit month number, 01 through 12
                    m: pad(month + 1),
                    // Month number, 1 through 12 (#8150)
                    o: month + 1,

                    // Year
                    // Two digits year, like 09 for 2009
                    y: fullYear.toString().substr(2, 2),
                    // Four digits year, like 2009
                    Y: fullYear,

                    // Time
                    // Two digits hours in 24h format, 00 through 23
                    H: pad(hours),
                    // Hours in 24h format, 0 through 23
                    k: hours,
                    // Two digits hours in 12h format, 00 through 11
                    I: pad((hours % 12) || 12),
                    // Hours in 12h format, 1 through 12
                    l: (hours % 12) || 12,
                    // Two digits minutes, 00 through 59
                    M: pad(this.get('Minutes', date)),
                    // Upper case AM or PM
                    p: hours < 12 ? 'AM' : 'PM',
                    // Lower case AM or PM
                    P: hours < 12 ? 'am' : 'pm',
                    // Two digits seconds, 00 through  59
                    S: pad(date.getSeconds()),
                    // Milliseconds (naming from Ruby)
                    L: pad(Math.floor((timestamp as any) % 1000), 3)
                },

                H.dateFormats
            );

        // Do the replaces
        objectEach(replacements, function (
            val: (string|Function),
            key: string
        ): void {
            // Regex would do it in one line, but this is faster
            while (format.indexOf('%' + key) !== -1) {
                format = format.replace(
                    '%' + key,
                    typeof val === 'function' ? val.call(time, timestamp) : val
                );
            }

        });

        // Optionally capitalize the string and return
        return capitalize ?
            (
                format.substr(0, 1).toUpperCase() +
                format.substr(1)
            ) :
            format;
    }

    /**
     * Resolve legacy formats of dateTimeLabelFormats (strings and arrays) into
     * an object.
     * @private
     * @param {string|Array<T>|Highcharts.Dictionary<T>} f
     * General format description
     * @return {Highcharts.Dictionary<T>}
     * The object definition
     */
    public resolveDTLFormat(
        f: Time.DateTimeLabelFormatOption
    ): Time.DateTimeLabelFormatObject {
        if (!isObject(f, true)) { // check for string or array
            f = splat(f);
            return {
                main: f[0],
                from: f[1],
                to: f[2]
            };
        }
        return f;
    }

    /**
     * Return an array with time positions distributed on round time values
     * right and right after min and max. Used in datetime axes as well as for
     * grouping data on a datetime axis.
     *
     * @function Highcharts.Time#getTimeTicks
     *
     * @param {Highcharts.TimeNormalizedObject} normalizedInterval
     *        The interval in axis values (ms) and the count
     *
     * @param {number} [min]
     *        The minimum in axis values
     *
     * @param {number} [max]
     *        The maximum in axis values
     *
     * @param {number} [startOfWeek=1]
     *
     * @return {Highcharts.AxisTickPositionsArray}
     * Time positions
     */
    public getTimeTicks(
        normalizedInterval: Time.TimeNormalizedObject,
        min?: number,
        max?: number,
        startOfWeek?: number
    ): TickPositionsArray {
        const time = this,
            Date = time.Date,
            tickPositions = [] as TickPositionsArray,
            higherRanks = {} as Record<string, string>,
            // When crossing DST, use the max. Resolves #6278.
            minDate = new Date(min as any),
            interval = normalizedInterval.unitRange,
            count = normalizedInterval.count || 1;

        let i,
            minYear: any, // used in months and years as a basis for Date.UTC()
            variableDayLength,
            minDay;

        startOfWeek = pick(startOfWeek, 1);

        if (defined(min)) { // #1300
            time.set(
                'Milliseconds',
                minDate,
                interval >= timeUnits.second ?
                    0 : // #3935
                    count * Math.floor(
                        time.get('Milliseconds', minDate) / count
                    )
            ); // #3652, #3654

            if (interval >= timeUnits.second) { // second
                time.set(
                    'Seconds',
                    minDate,
                    interval >= timeUnits.minute ?
                        0 : // #3935
                        count * Math.floor(time.get('Seconds', minDate) / count)
                );
            }

            if (interval >= timeUnits.minute) { // minute
                time.set(
                    'Minutes',
                    minDate,
                    interval >= timeUnits.hour ?
                        0 :
                        count * Math.floor(time.get('Minutes', minDate) / count)
                );
            }

            if (interval >= timeUnits.hour) { // hour
                time.set(
                    'Hours',
                    minDate,
                    interval >= timeUnits.day ?
                        0 :
                        count * Math.floor(
                            time.get('Hours', minDate) / count
                        )
                );
            }

            if (interval >= timeUnits.day) { // day
                time.set(
                    'Date',
                    minDate,
                    interval >= timeUnits.month ?
                        1 :
                        Math.max(
                            1,
                            count * Math.floor(
                                time.get('Date', minDate) / count
                            )
                        )
                );
            }

            if (interval >= timeUnits.month) { // month
                time.set(
                    'Month',
                    minDate,
                    interval >= timeUnits.year ? 0 :
                        count * Math.floor(time.get('Month', minDate) / count)
                );
                minYear = time.get('FullYear', minDate);
            }

            if (interval >= timeUnits.year) { // year
                minYear -= minYear % count;
                time.set('FullYear', minDate, minYear);
            }

            // week is a special case that runs outside the hierarchy
            if (interval === timeUnits.week) {
                // get start of current week, independent of count
                minDay = time.get('Day', minDate);
                time.set(
                    'Date',
                    minDate,
                    (
                        time.get('Date', minDate) -
                        minDay + startOfWeek +
                        // We don't want to skip days that are before
                        // startOfWeek (#7051)
                        (minDay < startOfWeek ? -7 : 0)
                    )
                );
            }


            // Get basics for variable time spans
            minYear = time.get('FullYear', minDate);
            const minMonth = time.get('Month', minDate),
                minDateDate = time.get('Date', minDate),
                minHours = time.get('Hours', minDate);

            // Redefine min to the floored/rounded minimum time (#7432)
            min = minDate.getTime();

            // Handle local timezone offset
            if ((time.variableTimezone || !time.useUTC) && defined(max)) {
                // Detect whether we need to take the DST crossover into
                // consideration. If we're crossing over DST, the day length may
                // be 23h or 25h and we need to compute the exact clock time for
                // each tick instead of just adding hours. This comes at a cost,
                // so first we find out if it is needed (#4951).
                variableDayLength = (
                    // Long range, assume we're crossing over.
                    max - min > 4 * timeUnits.month ||
                    // Short range, check if min and max are in different time
                    // zones.
                    time.getTimezoneOffset(min) !==
                    time.getTimezoneOffset(max)
                );
            }

            // Iterate and add tick positions at appropriate values
            let t = minDate.getTime();

            i = 1;
            while (t < (max as any)) {
                tickPositions.push(t);

                // if the interval is years, use Date.UTC to increase years
                if (interval === timeUnits.year) {
                    t = time.makeTime(minYear + i * count, 0);

                // if the interval is months, use Date.UTC to increase months
                } else if (interval === timeUnits.month) {
                    t = time.makeTime(minYear, minMonth + i * count);

                // if we're using global time, the interval is not fixed as it
                // jumps one hour at the DST crossover
                } else if (
                    variableDayLength &&
                    (interval === timeUnits.day || interval === timeUnits.week)
                ) {
                    t = time.makeTime(
                        minYear,
                        minMonth,
                        minDateDate +
                            i * count * (interval === timeUnits.day ? 1 : 7)
                    );

                } else if (
                    variableDayLength &&
                    interval === timeUnits.hour &&
                    count > 1
                ) {
                    // make sure higher ranks are preserved across DST (#6797,
                    // #7621)
                    t = time.makeTime(
                        minYear,
                        minMonth,
                        minDateDate,
                        minHours + i * count
                    );

                // else, the interval is fixed and we use simple addition
                } else {
                    t += interval * count;
                }

                i++;
            }

            // push the last time
            tickPositions.push(t);


            // Handle higher ranks. Mark new days if the time is on midnight
            // (#950, #1649, #1760, #3349). Use a reasonable dropout threshold
            // to prevent looping over dense data grouping (#6156).
            if (interval <= timeUnits.hour && tickPositions.length < 10000) {
                tickPositions.forEach(function (t: number): void {
                    if (
                        // Speed optimization, no need to run dateFormat unless
                        // we're on a full or half hour
                        t % 1800000 === 0 &&
                        // Check for local or global midnight
                        time.dateFormat('%H%M%S%L', t) === '000000000'
                    ) {
                        higherRanks[t] = 'day';
                    }
                });
            }
        }


        // record information on the chosen unit - for dynamic label formatter
        tickPositions.info = extend<Time.TimeNormalizedObject|TimeTicksInfoObject>(
            normalizedInterval,
            {
                higherRanks,
                totalRange: interval * count
            }
        ) as TimeTicksInfoObject;

        return tickPositions;
    }

    /**
     * Get the optimal date format for a point, based on a range.
     *
     * @private
     * @function Highcharts.Time#getDateFormat
     *
     * @param {number} range
     *        The time range
     *
     * @param {number} timestamp
     *        The timestamp of the date
     *
     * @param {number} startOfWeek
     *        An integer representing the first day of the week, where 0 is
     *        Sunday.
     *
     * @param {Highcharts.Dictionary<string>} dateTimeLabelFormats
     *        A map of time units to formats.
     *
     * @return {string}
     *         The optimal date format for a point.
     */
    public getDateFormat(
        range: number,
        timestamp: number,
        startOfWeek: number,
        dateTimeLabelFormats: Time.DateTimeLabelFormatsOption
    ): string|undefined {
        const dateStr = this.dateFormat('%m-%d %H:%M:%S.%L', timestamp),
            blank = '01-01 00:00:00.000',
            strpos = {
                millisecond: 15,
                second: 12,
                minute: 9,
                hour: 6,
                day: 3
            } as Record<Time.TimeUnit, number>;

        let n: Time.TimeUnit = 'millisecond',
            // for sub-millisecond data, #4223
            lastN: Time.TimeUnit = n;

        for (n in timeUnits) { // eslint-disable-line guard-for-in
            // If the range is exactly one week and we're looking at a
            // Sunday/Monday, go for the week format
            if (
                range === timeUnits.week &&
                +this.dateFormat('%w', timestamp) === startOfWeek &&
                dateStr.substr(6) === blank.substr(6)
            ) {
                n = 'week';
                break;
            }

            // The first format that is too great for the range
            if (timeUnits[n] > range) {
                n = lastN;
                break;
            }

            // If the point is placed every day at 23:59, we need to show
            // the minutes as well. #2637.
            if (
                strpos[n] &&
                dateStr.substr(strpos[n]) !== blank.substr(strpos[n])
            ) {
                break;
            }

            // Weeks are outside the hierarchy, only apply them on
            // Mondays/Sundays like in the first condition
            if (n !== 'week') {
                lastN = n;
            }
        }

        return this.resolveDTLFormat(dateTimeLabelFormats[n]).main;
    }
}

/* *
 *
 * Class namespace
 *
 * */

namespace Time {
    export interface DateTimeLabelFormatObject {
        from?: string;
        list?: string[];
        main: string;
        range?: boolean;
        to?: string;
    }
    export type DateTimeLabelFormatOption = (
        string|
        Array<string>|
        Time.DateTimeLabelFormatObject
    );
    export type DateTimeLabelFormatsOption = (
        Record<TimeUnit, DateTimeLabelFormatOption>
    );
    export interface TimeOptions {
        Date?: any;
        getTimezoneOffset?: Function;
        timezone?: string;
        timezoneOffset?: number;
        useUTC?: boolean;
        moment?: any;
    }
    export interface TimeFormatCallbackFunction {
        (timestamp: number): string;
    }
    export interface TimeNormalizedObject {
        count: number;
        unitName: TimeUnit;
        unitRange: number;
    }
    export type TimeUnit = (
        'millisecond'|
        'second'|
        'minute'|
        'hour'|
        'day'|
        'week'|
        'month'|
        'year'
    );
    export type TimeUnitValue = (
        'Date'|
        'Day'|
        'FullYear'|
        'Hours'|
        'Milliseconds'|
        'Minutes'|
        'Month'|
        'Seconds'
    );
}

/* *
 *
 * Default export
 *
 * */

export default Time;

/* *
 *
 * API Declarations
 *
 * */

/**
 * Normalized interval.
 *
 * @interface Highcharts.TimeNormalizedObject
 *//**
 * The count.
 *
 * @name Highcharts.TimeNormalizedObject#count
 * @type {number|undefined}
 *//**
 * The interval in axis values (ms).
 *
 * @name Highcharts.TimeNormalizedObject#unitRange
 * @type {number}
 */

/**
 * Function of an additional date format specifier.
 *
 * @callback Highcharts.TimeFormatCallbackFunction
 *
 * @param {number} timestamp
 *        The time to format.
 *
 * @return {string}
 *         The formatted portion of the date.
 */

/**
 * Time ticks.
 *
 * @interface Highcharts.AxisTickPositionsArray
 * @extends global.Array<number>
 *//**
 * @name Highcharts.AxisTickPositionsArray#info
 * @type {Highcharts.TimeTicksInfoObject|undefined}
 */

/**
 * A callback to return the time zone offset for a given datetime. It
 * takes the timestamp in terms of milliseconds since January 1 1970,
 * and returns the timezone offset in minutes. This provides a hook
 * for drawing time based charts in specific time zones using their
 * local DST crossover dates, with the help of external libraries.
 *
 * @callback Highcharts.TimezoneOffsetCallbackFunction
 *
 * @param {number} timestamp
 * Timestamp in terms of milliseconds since January 1 1970.
 *
 * @return {number}
 * Timezone offset in minutes.
 */

/**
 * Allows to manually load the `moment.js` library from Highcharts options
 * instead of the `window`.
 * In case of loading the library from a `script` tag,
 * this option is not needed, it will be loaded from there by default.
 *
 * @type      {Function}
 * @since     8.2.0
 * @apioption time.moment
 */

''; // keeps doclets above in JS file
