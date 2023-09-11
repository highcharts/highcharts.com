import error from './Error.js';
import TC from './TypeChecker.js';
const { isArray } = TC;
/**
 *
 * Check if an element is an array, and if not, make it into an array.
 *
 * @function Highcharts.splat
 *
 * @param {*} obj
 *        The object to splat.
 *
 * @return {Array}
 *         The produced or original array.
 */
function splat(obj: any): Array<any> {
    return isArray(obj) ? obj : [obj];
}

/**
 * Adds an item to an array, if it is not present in the array.
 *
 * @function Highcharts.pushUnique
 *
 * @param {Array<unknown>} array
 * The array to add the item to.
 *
 * @param {unknown} item
 * The item to add.
 *
 * @return {boolean}
 * Returns true, if the item was not present and has been added.
 */
function pushUnique(
    array: Array<unknown>,
    item: unknown
): boolean {
    return array.indexOf(item) < 0 && !!array.push(item);
}

/**
 * Remove the last occurence of an item from an array.
 *
 * @function Highcharts.erase
 *
 * @param {Array<*>} arr
 *        The array.
 *
 * @param {*} item
 *        The item to remove.
 *
 * @return {void}
 */
function erase(arr: Array<unknown>, item: unknown): void {
    let i = arr.length;

    while (i--) {
        if (arr[i] === item) {
            arr.splice(i, 1);
            break;
        }
    }
}

/**
 * Sort an object array and keep the order of equal items. The ECMAScript
 * standard does not specify the behaviour when items are equal.
 *
 * @function Highcharts.stableSort
 *
 * @param {Array<*>} arr
 *        The array to sort.
 *
 * @param {Function} sortFunction
 *        The function to sort it with, like with regular Array.prototype.sort.
 */
function stableSort<T>(
    arr: Array<T>,
    sortFunction: (a: T, b: T) => number
): void {

    // @todo It seems like Chrome since v70 sorts in a stable way internally,
    // plus all other browsers do it, so over time we may be able to remove this
    // function
    const length = arr.length;
    let sortValue,
        i;

    // Add index to each item
    for (i = 0; i < length; i++) {
        (arr[i] as any).safeI = i; // stable sort index
    }

    arr.sort(function (a: any, b: any): number {
        sortValue = sortFunction(a, b);
        return sortValue === 0 ? a.safeI - b.safeI : sortValue;
    });

    // Remove index from items
    for (i = 0; i < length; i++) {
        delete (arr[i] as any).safeI; // stable sort index
    }
}
/**
 * Non-recursive method to find the lowest member of an array. `Math.min` raises
 * a maximum call stack size exceeded error in Chrome when trying to apply more
 * than 150.000 points. This method is slightly slower, but safe.
 *
 * @function Highcharts.arrayMin
 *
 * @param {Array<*>} data
 *        An array of numbers.
 *
 * @return {number}
 *         The lowest number.
 */
function arrayMin(data: Array<any>): number {
    let i = data.length,
        min = data[0];

    while (i--) {
        if (data[i] < min) {
            min = data[i];
        }
    }
    return min;
}

/**
 * Non-recursive method to find the lowest member of an array. `Math.max` raises
 * a maximum call stack size exceeded error in Chrome when trying to apply more
 * than 150.000 points. This method is slightly slower, but safe.
 *
 * @function Highcharts.arrayMax
 *
 * @param {Array<*>} data
 *        An array of numbers.
 *
 * @return {number}
 *         The highest number.
 */
function arrayMax(data: Array<any>): number {
    let i = data.length,
        max = data[0];

    while (i--) {
        if (data[i] > max) {
            max = data[i];
        }
    }
    return max;
}

/**
 * Find the closest distance between two values of a two-dimensional array
 * @private
 * @function Highcharts.getClosestDistance
 *
 * @param {Array<Array<number>>} arrays
 *          An array of arrays of numbers
 *
 * @return {number | undefined}
 *          The closest distance between values
 */
function getClosestDistance(
    arrays: number[][],
    onError?: Function
): (number|undefined) {
    const allowNegative = !onError;
    let closest: number | undefined,
        loopLength: number,
        distance: number,
        i: number;

    arrays.forEach((xData): void => {
        if (xData.length > 1) {
            loopLength = xData.length - 1;
            for (i = loopLength; i > 0; i--) {
                distance = xData[i] - xData[i - 1];
                if (distance < 0 && !allowNegative) {
                    onError?.();
                    // Only one call
                    onError = void 0;
                } else if (distance && (
                    typeof closest === 'undefined' || distance < closest
                )) {
                    closest = distance;
                }
            }
        }
    });

    return closest;
}

/**
 * Search for an item in an array.
 *
 * @function Highcharts.inArray
 *
 * @deprecated
 *
 * @param {*} item
 *        The item to search for.
 *
 * @param {Array<*>} arr
 *        The array or node collection to search in.
 *
 * @param {number} [fromIndex=0]
 *        The index to start searching from.
 *
 * @return {number}
 *         The index within the array, or -1 if not found.
 */
function inArray(item: any, arr: Array<any>, fromIndex?: number): number {
    error(32, false, void 0, { 'Highcharts.inArray': 'use Array.indexOf' });
    return arr.indexOf(item, fromIndex);
}

/**
 * Return the value of the first element in the array that satisfies the
 * provided testing function.
 *
 * @function Highcharts.find<T>
 *
 * @param {Array<T>} arr
 *        The array to test.
 *
 * @param {Function} callback
 *        The callback function. The function receives the item as the first
 *        argument. Return `true` if this item satisfies the condition.
 *
 * @return {T|undefined}
 *         The value of the element.
 */
const find = (Array.prototype as any).find ?
    function<T> (
        arr: Array<T>,
        callback: ArrayHelper.FindCallback<T>
    ): (T|undefined) {
        return (arr as any).find(callback as any);
    } :
    // Legacy implementation. PhantomJS, IE <= 11 etc. #7223.
    function<T> (
        arr: Array<T>,
        callback: ArrayHelper.FindCallback<T>
    ): (T|undefined) {
        let i;
        const length = arr.length;

        for (i = 0; i < length; i++) {
            if (callback(arr[i], i)) { // eslint-disable-line node/callback-return
                return arr[i];
            }
        }
    };
const ArrayHelper = {
    arrayMax,
    arrayMin,
    erase,
    find,
    getClosestDistance,
    splat,
    inArray,
    pushUnique,
    stableSort

};
namespace ArrayHelper {
    export interface FindCallback<T> {
        (
            value: T,
            index: number
        ): unknown;
    }
}

export default ArrayHelper;
