/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import U from '../Shared/Utilities.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
const { objectEach } = OH;
import TC from '../Shared/Helpers/TypeChecker.js';
const { isClass, isDOMElement, isObject } = TC;
const {
    uniqueKey: coreUniqueKey
} = U;

/* *
 *
 *  Functions
 *
 * */

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
        copyDepth = 0,
        ret = {} as T;

    // describtive error stack:
    const copyDepthError = new Error('Recursive copy depth > 100'),
        doCopy = (copy: any, original: any): any => {
            // An object is replacing a primitive
            if (typeof copy !== 'object') {
                copy = {};
            }

            if (++copyDepth > 100) {
                throw copyDepthError;
            }

            objectEach(original, (value, key): void => {

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

            --copyDepth;

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

/**
 * Creates a session-dependent unique key string for reference purposes.
 *
 * @function Dashboards.uniqueKey
 *
 * @return {string}
 * Unique key string
 */
function uniqueKey(): string {
    return `dashboard-${coreUniqueKey().replace('highcharts-', '')}`;
}

/* *
 *
 *  Default Export
 *
 * */

const Utilities = {
    merge,
    uniqueKey
};

export default Utilities;
