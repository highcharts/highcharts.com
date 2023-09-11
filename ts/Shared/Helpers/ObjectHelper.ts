import TC from './TypeChecker.js';
const { isObject, isArray, isClass, isDOMElement } = TC;
/* eslint-disable valid-jsdoc */

/**
 * Check if an object is null or undefined.
 *
 * @function Highcharts.defined
 *
 * @param {*} obj
 *        The object to check.
 *
 * @return {boolean}
 *         False if the object is null or undefined, otherwise true.
 */
function defined<T>(obj: T): obj is NonNullable<T> {
    return typeof obj !== 'undefined' && obj !== null;
}

/* eslint-disable valid-jsdoc */
/**
 * Iterate over object key pairs in an object.
 *
 * @function Highcharts.objectEach<T>
 *
 * @param {*} obj
 *        The object to iterate over.
 *
 * @param {Highcharts.ObjectEachCallbackFunction<T>} fn
 *        The iterator callback. It passes three arguments:
 *        * value - The property value.
 *        * key - The property key.
 *        * obj - The object that objectEach is being applied to.
 *
 * @param {T} [ctx]
 *        The context.
 */
function objectEach<TObject, TContext>(
    obj: TObject,
    fn: OH.ObjectEachCallback<TObject, TContext>,
    ctx?: TContext
): void {
    /* eslint-enable valid-jsdoc */
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            fn.call(ctx || obj[key] as unknown as TContext, obj[key], key, obj);
        }
    }
}
/**
 * Utility method that destroys any SVGElement instances that are properties on
 * the given object. It loops all properties and invokes destroy if there is a
 * destroy method. The property is then delete.
 *
 * @function Highcharts.destroyObjectProperties
 *
 * @param {*} obj
 *        The object to destroy properties on.
 *
 * @param {*} [except]
 *        Exception, do not destroy this property, only delete it.
 */
function destroyObjectProperties(obj: any, except?: any): void {
    objectEach(obj, function (val, n): void {
        // If the object is non-null and destroy is defined
        if (val && val !== except && val.destroy) {
            // Invoke the destroy
            val.destroy();
        }

        // Delete the property from the object.
        delete obj[n];
    });
}
// Implemented again to avoid circular dependency
function splat(obj: any): Array<any> {
    return isArray(obj) ? obj : [obj];
}

// eslint-disable-next-line valid-jsdoc
/**
 * Return the deep difference between two objects. It can either return the new
 * properties, or optionally return the old values of new properties.
 * @private
 */
function diffObjects(
    newer: AnyRecord,
    older: AnyRecord,
    keepOlder?: boolean,
    collectionsWithUpdate?: string[]
): AnyRecord {
    const ret = {};

    /**
     * Recurse over a set of options and its current values, and store the
     * current values in the ret object.
     */
    function diff(
        newer: AnyRecord,
        older: AnyRecord,
        ret: AnyRecord,
        depth: number
    ): void {
        const keeper = keepOlder ? older : newer;

        objectEach(newer, function (newerVal, key): void {
            if (
                !depth &&
                collectionsWithUpdate &&
                collectionsWithUpdate.indexOf(key) > -1 &&
                older[key]
            ) {
                newerVal = splat(newerVal);

                ret[key] = [];

                // Iterate over collections like series, xAxis or yAxis and map
                // the items by index.
                for (
                    let i = 0;
                    i < Math.max(newerVal.length, older[key].length);
                    i++
                ) {

                    // Item exists in current data (#6347)
                    if (older[key][i]) {
                        // If the item is missing from the new data, we need to
                        // save the whole config structure. Like when
                        // responsively updating from a dual axis layout to a
                        // single axis and back (#13544).
                        if (newerVal[i] === void 0) {
                            ret[key][i] = older[key][i];

                        // Otherwise, proceed
                        } else {
                            ret[key][i] = {};
                            diff(
                                newerVal[i],
                                older[key][i],
                                ret[key][i],
                                depth + 1
                            );
                        }
                    }
                }
            } else if (
                isObject(newerVal, true) &&
                !newerVal.nodeType // #10044
            ) {
                ret[key] = isArray(newerVal) ? [] : {};
                diff(newerVal, older[key] || {}, ret[key], depth + 1);
                // Delete empty nested objects
                if (
                    Object.keys(ret[key]).length === 0 &&
                    // Except colorAxis which is a special case where the empty
                    // object means it is enabled. Which is unfortunate and we
                    // should try to find a better way.
                    !(key === 'colorAxis' && depth === 0)
                ) {
                    delete ret[key];
                }

            } else if (
                newer[key] !== older[key] ||
                // If the newer key is explicitly undefined, keep it (#10525)
                (key in newer && !(key in older))
            ) {
                ret[key] = keeper[key];
            }
        });
    }

    diff(newer, older, ret, 0);

    return ret;
}

/* eslint-disable valid-jsdoc */
/**
 * Utility function to extend an object with the members of another.
 *
 * @function Highcharts.extend<T>
 *
 * @param {T|undefined} a
 *        The object to be extended.
 *
 * @param {Partial<T>} b
 *        The object to add to the first one.
 *
 * @return {T}
 *         Object a, the original object.
 */
function extend<T extends object>(a: (T|undefined), b: Partial<T>): T {
    /* eslint-enable valid-jsdoc */
    let n;

    if (!a) {
        a = {} as T;
    }
    for (n in b) { // eslint-disable-line guard-for-in
        (a as any)[n] = (b as any)[n];
    }
    return a;
}

function merge<T = object>(
    extend: true,
    a?: T,
    ...n: Array<DeepPartial<T>|undefined>
): (T);
function merge<
    T1 extends object = object,
    T2 = unknown,
    T3 = unknown,
    T4 = unknown,
    T5 = unknown,
    T6 = unknown,
    T7 = unknown,
    T8 = unknown,
    T9 = unknown
>(
    a?: T1,
    b?: T2,
    c?: T3,
    d?: T4,
    e?: T5,
    f?: T6,
    g?: T7,
    h?: T8,
    i?: T9,
): (T1&T2&T3&T4&T5&T6&T7&T8&T9);

/* eslint-disable valid-jsdoc */
/**
 * Utility function to deep merge two or more objects and return a third object.
 * If the first argument is true, the contents of the second object is copied
 * into the first object. The merge function can also be used with a single
 * object argument to create a deep copy of an object.
 *
 * @function Highcharts.merge<T>
 *
 * @param {boolean} extend
 *        Whether to extend the left-side object (a) or return a whole new
 *        object.
 *
 * @param {T|undefined} a
 *        The first object to extend. When only this is given, the function
 *        returns a deep copy.
 *
 * @param {...Array<object|undefined>} [n]
 *        An object to merge into the previous one.
 *
 * @return {T}
 *         The merged object. If the first argument is true, the return is the
 *         same as the second argument.
 *//**
 * Utility function to deep merge two or more objects and return a third object.
 * The merge function can also be used with a single object argument to create a
 * deep copy of an object.
 *
 * @function Highcharts.merge<T>
 *
 * @param {T|undefined} a
 *        The first object to extend. When only this is given, the function
 *        returns a deep copy.
 *
 * @param {...Array<object|undefined>} [n]
 *        An object to merge into the previous one.
 *
 * @return {T}
 *         The merged object. If the first argument is true, the return is the
 *         same as the second argument.
 */
function merge<T>(): T {
    /* eslint-enable valid-jsdoc */
    let i,
        args = arguments,
        ret = {} as T;
    const doCopy = function (copy: any, original: any): any {
        // An object is replacing a primitive
        if (typeof copy !== 'object') {
            copy = {};
        }

        objectEach(original, function (value, key): void {

            // Prototype pollution (#14883)
            if (key === '__proto__' || key === 'constructor') {
                return;
            }

            // Copy the contents of objects, but not arrays or DOM nodes
            if (isObject(value, true) &&
                !isClass(value) &&
                !isDOMElement(value)
            ) {
                copy[key] = doCopy(copy[key] || {}, value);

            // Primitives and arrays are copied over directly
            } else {
                copy[key] = original[key];
            }
        });
        return copy;
    };

    // If first argument is true, copy into the existing object. Used in
    // setOptions.
    if (args[0] === true) {
        ret = args[1];
        args = Array.prototype.slice.call(args, 2) as any;
    }

    // For each argument, extend the return
    const len = args.length;
    for (i = 0; i < len; i++) {
        ret = doCopy(ret, args[i]);
    }

    return ret;
}
namespace OH {
    export interface ObjectEachCallback<TObject, TContext> {
        (
            this: TContext,
            value: TObject[keyof TObject],
            key: keyof TObject,
            obj: TObject
        ): void;
    }
}
const OH = {
    defined,
    destroyObjectProperties,
    diffObjects,
    extend,
    merge,
    objectEach
};

export default OH;
