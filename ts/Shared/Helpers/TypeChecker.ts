import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';

type NonArray<T> = T extends Array<unknown> ? never : T;
type NonFunction<T> = T extends Function ? never : T;

function isObject<T>(obj: T, strict: true): obj is object & NonArray<NonFunction<NonNullable<T>>>;
function isObject<T>(obj: T, strict?: false): obj is object & NonFunction<NonNullable<T>>;
/**
 * Utility function to check if an item is of type object.
 *
 * @function Highcharts.isObject
 *
 * @param {*} obj
 *        The item to check.
 *
 * @param {boolean} [strict=false]
 *        Also checks that the object is not an array.
 *
 * @return {boolean}
 *         True if the argument is an object.
 */
function isObject<T>(
    obj: T,
    strict?: boolean
): obj is object & NonFunction<NonNullable<T>> {
    return (
        !!obj &&
        typeof obj === 'object' &&
        (!strict || !isArray(obj))
    ) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}


/**
 * Utility function to check for string type.
 *
 * @function Highcharts.isString
 *
 * @param {*} s
 *        The item to check.
 *
 * @return {boolean}
 *         True if the argument is a string.
 */
function isString(s: unknown): s is string {
    return typeof s === 'string';
}

/**
 * Utility function to check if an item is an array.
 *
 * @function Highcharts.isArray
 *
 * @param {*} obj
 *        The item to check.
 *
 * @return {boolean}
 *         True if the argument is an array.
 */
function isArray(obj: unknown): obj is Array<unknown> {
    const str = Object.prototype.toString.call(obj);

    return str === '[object Array]' || str === '[object Array Iterator]';
}


/**
 * Utility function to check if an Object is a HTML Element.
 *
 * @function Highcharts.isDOMElement
 *
 * @param {*} obj
 *        The item to check.
 *
 * @return {boolean}
 *         True if the argument is a HTML Element.
 */
function isDOMElement(obj: unknown): obj is HTMLDOMElement {
    return isObject(obj) && typeof (obj as any).nodeType === 'number';
}

/**
 * Utility function to check if an Object is a class.
 *
 * @function Highcharts.isClass
 *
 * @param {object|undefined} obj
 *        The item to check.
 *
 * @return {boolean}
 *         True if the argument is a class.
 */
function isClass<T>(obj: (object|undefined)): obj is Class<T> {
    const c: (Function|undefined) = obj && obj.constructor;

    return !!(
        isObject(obj, true) &&
        !isDOMElement(obj) &&
        (c && (c as any).name && (c as any).name !== 'Object')
    );
}

/**
 * Utility function to check if an item is a number and it is finite (not NaN,
 * Infinity or -Infinity).
 *
 * @function Highcharts.isNumber
 *
 * @param {*} n
 *        The item to check.
 *
 * @return {boolean}
 *         True if the item is a finite number
 */
function isNumber(n: unknown): n is number {
    return typeof n === 'number' && !isNaN(n) && n < Infinity && n > -Infinity;
}

function isFunction(obj: unknown): obj is Function { // eslint-disable-line
    return typeof obj === 'function';
}
const TC = {
    isArray,
    isClass,
    isObject,
    isDOMElement,
    isFunction,
    isNumber,
    isString
};

export default TC;
