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

import type { ApproximationArray } from './ApproximationType';

import ApproximationRegistry from './ApproximationRegistry.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    arrayMax,
    arrayMin
} = AH;
const { isNumber } = TC;
const { extend } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function average(
    arr: ApproximationArray
): (null|number|undefined) {
    const len = arr.length;

    let ret = sum(arr);

    // If we have a number, return it divided by the length. If not,
    // return null or undefined based on what the sum method finds.
    if (isNumber(ret) && len) {
        ret = correctFloat(ret / len);
    }

    return ret;
}

/**
 * The same as average, but for series with multiple values, like area ranges.
 * @private
 */
function averages(): (Array<(null|number|undefined)>|undefined) { // #5479
    const ret = [] as Array<(null|number|undefined)>;

    [].forEach.call(arguments, function (
        arr: ApproximationArray
    ): void {
        ret.push(average(arr));
    });

    // Return undefined when first elem. is undefined and let
    // sum method handle null (#7377)
    return typeof ret[0] === 'undefined' ? void 0 : ret;
}

/**
 * @private
 */
function close(
    arr: ApproximationArray
): (null|number|undefined) {
    return arr.length ?
        arr[arr.length - 1] :
        (arr.hasNulls ? null : void 0);
}

/**
 * @private
 */
function high(
    arr: ApproximationArray
): (null|number|undefined) {
    return arr.length ?
        arrayMax(arr) :
        (arr.hasNulls ? null : void 0);
}

/**
 * HLC, OHLC and range are special cases where a multidimensional array is input
 * and an array is output.
 * @private
 */
function hlc(
    high: ApproximationArray,
    low: ApproximationArray,
    close: ApproximationArray
): ([number, number, number]|undefined) {
    high = ApproximationRegistry.high(high) as any;
    low = ApproximationRegistry.low(low) as any;
    close = ApproximationRegistry.close(close) as any;

    if (
        isNumber(high) ||
        isNumber(low) ||
        isNumber(close)
    ) {
        return [high, low, close] as any;
    }
}

/**
 * @private
 */
function low(
    arr: ApproximationArray
): (null|number|undefined) {
    return arr.length ?
        arrayMin(arr) :
        (arr.hasNulls ? null : void 0);
}

/**
 * @private
 */
function ohlc(
    open: ApproximationArray,
    high: ApproximationArray,
    low: ApproximationArray,
    close: ApproximationArray
): ([number, number, number, number]|undefined) {
    open = ApproximationRegistry.open(open) as any;
    high = ApproximationRegistry.high(high) as any;
    low = ApproximationRegistry.low(low) as any;
    close = ApproximationRegistry.close(close) as any;

    if (
        isNumber(open) ||
        isNumber(high) ||
        isNumber(low) ||
        isNumber(close)
    ) {
        return [open, high, low, close] as any;
    }
}

/**
 * @private
 */
function open(
    arr: ApproximationArray
): (null|number|undefined) {
    return arr.length ? arr[0] : ((arr as any).hasNulls ? null : void 0);
}

/**
 * @private
 */
function range(
    low: ApproximationArray,
    high: ApproximationArray
): ([number, number]|null|undefined) {
    low = ApproximationRegistry.low(low) as any;
    high = ApproximationRegistry.high(high) as any;
    if (isNumber(low) || isNumber(high)) {
        return [low, high] as any;
    }
    if (low === null && high === null) {
        return null;
    }
    // else, return is undefined
}

/**
 * @private
 */
function sum(
    arr: ApproximationArray
): (null|number|undefined) {
    let len = arr.length,
        ret;

    // 1. it consists of nulls exclusive
    if (!len && arr.hasNulls) {
        ret = null;
    // 2. it has a length and real values
    } else if (len) {
        ret = 0;
        while (len--) {
            ret += arr[len];
        }
    }
    // 3. it has zero length, so just return undefined
    // => doNothing()

    return ret;
}

/* *
 *
 *  Registry
 *
 * */

declare module './ApproximationType' {
    interface ApproximationTypeRegistry {
        average: typeof average,
        averages: typeof averages,
        close: typeof close,
        high: typeof high,
        hlc: typeof hlc,
        low: typeof low,
        ohlc: typeof ohlc,
        open: typeof open,
        range: typeof range,
        sum: typeof sum
    }
}

/* *
 *
 *  Default Export
 *
 * */

const ApproximationDefaults = {
    average,
    averages,
    close,
    high,
    hlc,
    low,
    ohlc,
    open,
    range,
    sum
};
extend(ApproximationRegistry, ApproximationDefaults);

export default ApproximationDefaults;
