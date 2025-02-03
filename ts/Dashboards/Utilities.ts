/* *
 *
 *  (c) 2009-2024 Highsoft AS
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

import D from './Globals.js';
const {
    doc,
    supportsPassiveEvents
} = D;
import U from '../Core/Utilities.js';
const {
    error: coreError,
    isClass,
    isDOMElement,
    isObject,
    objectEach,
    uniqueKey: coreUniqueKey
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * Add an event listener.
 *
 * @function Highcharts.addEvent<T>
 *
 * @param  {D.Class<T>|T} el
 *         The element or object to add a listener to. It can be a
 *         {@link HTMLDOMElement}, an {@link SVGElement} or any other object.
 *
 * @param  {string} type
 *         The event type.
 *
 * @param  {Dashboards.EventCallbackFunction<T>|Function} fn
 *         The function callback to execute when the event is fired.
 *
 * @param  {Dashboards.EventOptionsObject} [options]
 *         Options for adding the event.
 *
 * @return {Function}
 *         A callback function to remove the added event.
 */
function addEvent<T>(
    el: (D.Class<T>|T),
    type: string,
    fn: (Utilities.EventCallback<T>|Function),
    options: Utilities.EventOptions = {}
): Function {
    /* eslint-enable valid-jsdoc */

    // Add hcEvents to either the prototype (in case we're running addEvent on a
    // class) or the instance. If hasOwnProperty('hcEvents') is false, it is
    // inherited down the prototype chain, in which case we need to set the
    // property on this instance (which may itself be a prototype).
    const owner = typeof el === 'function' && el.prototype || el;
    if (!Object.hasOwnProperty.call(owner, 'hcEvents')) {
        owner.hcEvents = {};
    }
    const events: Record<string, Array<any>> = owner.hcEvents;

    // Handle DOM events
    // If the browser supports passive events, add it to improve performance
    // on touch events (#11353).
    const addEventListener = (el as any).addEventListener;
    if (addEventListener) {
        addEventListener.call(
            el,
            type,
            fn,
            supportsPassiveEvents ? {
                passive: options.passive === void 0 ?
                    type.indexOf('touch') !== -1 : options.passive,
                capture: false
            } : false
        );
    }

    if (!events[type]) {
        events[type] = [];
    }

    const eventObject = {
        fn,
        order: typeof options.order === 'number' ? options.order : Infinity
    };
    events[type].push(eventObject);

    // Order the calls
    events[type].sort((
        a: Utilities.EventWrapperObject<T>,
        b: Utilities.EventWrapperObject<T>
    ): number => a.order - b.order);

    // Return a function that can be called to remove this event.
    return function (): void {
        removeEvent(el, type, fn);
    };
}
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
function merge<T extends Object>(
    a: (true|T|undefined),
    ...n: Array<unknown>
) : T {
    let copyDepth = 0,
        obj = {} as T;

    // Descriptive error stack:
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
                if (
                    isObject(value, true) &&
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
    if (a === true) {
        obj = n.shift() as T;
    } else {
        n.unshift(a);
    }

    // For each argument, extend the return
    for (let i = 0, iEnd = n.length; i < iEnd; ++i) {
        obj = doCopy(obj, n[i]);
    }

    return obj;
}

/**
 * Returns a deep copy of an argument. It differs from `merge` in that it copies
 * also arrays.
 *
 * @param value
 * The value to clone.
 *
 * @param excludedKeys
 * An array of keys to exclude from the clone.
 */
function deepClone(value: any, excludedKeys?: string[]): any {
    if (Array.isArray(value)) {
        return value.map((v): any => deepClone(v, excludedKeys));
    }

    if (value && typeof value === 'object') {
        const clone: Record<string, any> = {};
        const keys = Object.keys(value);

        for (const key of keys) {
            if (excludedKeys && excludedKeys.includes(key)) {
                clone[key] = value[key];
            } else {
                clone[key] = deepClone(value[key], excludedKeys);
            }
        }

        return clone;
    }

    return value;
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

/**
 * Provide error messages for debugging, with links to online explanation. This
 * function can be overridden to provide custom error handling.
 *
 * @sample highcharts/chart/highcharts-error/
 *         Custom error handler
 *
 * @function Dashboards.error
 *
 * @param {number|string} code
 *        The error code. See
 *        [errors.xml](https://github.com/highcharts/highcharts/blob/master/errors/errors.xml)
 *        for available codes. If it is a string, the error message is printed
 *        directly in the console.
 *
 * @param {boolean} [stop=false]
 *        Whether to throw an error or just log a warning in the console.
 *
 * @return {void}
 */
function error(code: number|string, stop?: boolean): void {
    // TODO- replace with proper error handling
    if (code === 16) {
        console.warn( // eslint-disable-line no-console
            'Dashboard error: Dashboards library loaded more than once.' +
            'This may cause undefined behavior.'
        );
        return;
    }
    coreError(code, stop);
}

/**
 * Utility function to extend an object with the members of another.
 *
 * @function Dashboards.extend<T>
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

/**
 * Fire an event that was registered with addEvent.
 *
 * @function Highcharts.fireEvent<T>
 *
 * @param {T} el
 *        The object to fire the event on. It can be a {@link HTMLDOMElement},
 *        an {@link SVGElement} or any other object.
 *
 * @param {string} type
 *        The type of event.
 *
 * @param {Dashboards.Dictionary<*>|Event} [eventArguments]
 *        Custom event arguments that are passed on as an argument to the event
 *        handler.
 *
 * @param {Dashboards.EventCallbackFunction<T>|Function} [defaultFunction]
 *        The default function to execute if the other listeners haven't
 *        returned false.
 *
 * @return {void}
 */
function fireEvent<T>(
    el: T,
    type: string,
    eventArguments?: (D.AnyRecord|Event),
    defaultFunction?: (Utilities.EventCallback<T>|Function)
): void {
    /* eslint-enable valid-jsdoc */
    eventArguments = eventArguments || {};

    if (
        doc?.createEvent &&
        (
            (el as any).dispatchEvent ||
            (
                (el as any).fireEvent &&
                // Enable firing events on Highcharts instance.
                (el as any) !== D
            )
        )
    ) {
        const e = doc.createEvent('Events');
        e.initEvent(type, true, true);

        eventArguments = extend(e, eventArguments);

        if ((el as any).dispatchEvent) {
            (el as any).dispatchEvent(eventArguments);
        } else {
            (el as any).fireEvent(type, eventArguments);
        }

    } else if ((el as any).hcEvents) {

        if (!(eventArguments as any).target) {
            // We're running a custom event

            extend(eventArguments as any, {
                // Attach a simple preventDefault function to skip
                // default handler if called. The built-in
                // defaultPrevented property is not overwritable (#5112)
                preventDefault: function (): void {
                    (eventArguments as any).defaultPrevented = true;
                },
                // Setting target to native events fails with clicking
                // the zoom-out button in Chrome.
                target: el,
                // If the type is not set, we're running a custom event
                // (#2297). If it is set, we're running a browser event.
                type: type
            });
        }

        const events: Array<Utilities.EventWrapperObject<any>> = [];
        let object: any = el;
        let multilevel = false;

        // Recurse up the inheritance chain and collect hcEvents set as own
        // objects on the prototypes.
        while (object.hcEvents) {
            if (
                Object.hasOwnProperty.call(object, 'hcEvents') &&
                object.hcEvents[type]
            ) {
                if (events.length) {
                    multilevel = true;
                }
                events.unshift.apply(events, object.hcEvents[type]);
            }
            object = Object.getPrototypeOf(object);
        }

        // For performance reasons, only sort the event handlers in case we are
        // dealing with multiple levels in the prototype chain. Otherwise, the
        // events are already sorted in the addEvent function.
        if (multilevel) {
            // Order the calls
            events.sort((
                a: Utilities.EventWrapperObject<T>,
                b: Utilities.EventWrapperObject<T>
            ): number => a.order - b.order);
        }

        // Call the collected event handlers
        events.forEach((obj): void => {
            // If the event handler returns false, prevent the default handler
            // from executing
            if (obj.fn.call(el, eventArguments as any) === false) {
                (eventArguments as any).preventDefault();
            }
        });

    }

    // Run the default if not prevented
    if (defaultFunction && !eventArguments.defaultPrevented) {
        (defaultFunction as Function).call(el, eventArguments);
    }
}

/**
 * Remove an event that was added with {@link Highcharts#addEvent}.
 *
 * @function Dashboards.removeEvent<T>
 *
 * @param {Dashboards.Class<T>|T} el
 *        The element to remove events on.
 *
 * @param {string} [type]
 *        The type of events to remove. If undefined, all events are removed
 *        from the element.
 *
 * @param {Dashboards.EventCallbackFunction<T>} [fn]
 *        The specific callback to remove. If undefined, all events that match
 *        the element and optionally the type are removed.
 *
 * @return {void}
 */
function removeEvent<T>(
    el: (D.Class<T>|T),
    type?: string,
    fn?: (Utilities.EventCallback<T>|Function)
): void {
    /* eslint-enable valid-jsdoc */

    /**
     * @private
     */
    function removeOneEvent(
        type: string,
        fn: (Utilities.EventCallback<T>|Function)
    ): void {
        const removeEventListener = (el as any).removeEventListener;

        if (removeEventListener) {
            removeEventListener.call(el, type, fn, false);
        }
    }

    /**
     * @private
     */
    function removeAllEvents(eventCollection: any): void {
        let types: Record<string, boolean>,
            len;

        if (!(el as any).nodeName) {
            return; // Break on non-DOM events
        }

        if (type) {
            types = {};
            types[type] = true;
        } else {
            types = eventCollection;
        }

        objectEach(types, function (_val, n): void {
            if (eventCollection[n]) {
                len = eventCollection[n].length;
                while (len--) {
                    removeOneEvent(n as any, eventCollection[n][len].fn);
                }
            }
        });
    }

    const owner = typeof el === 'function' && el.prototype || el;
    if (Object.hasOwnProperty.call(owner, 'hcEvents')) {
        const events = owner.hcEvents;
        if (type) {
            const typeEvents = (
                events[type] || []
            ) as Utilities.EventWrapperObject<T>[];

            if (fn) {
                events[type] = typeEvents.filter(
                    function (obj): boolean {
                        return fn !== obj.fn;
                    }
                );
                removeOneEvent(type, fn);

            } else {
                removeAllEvents(events);
                events[type] = [];
            }
        } else {
            removeAllEvents(events);
            delete owner.hcEvents;
        }
    }
}

namespace Utilities {
    export interface EventCallback<T> {
        (this: T, eventArguments: (D.AnyRecord|Event)): (boolean|void);
    }
    export interface EventWrapperObject<T> {
        fn: EventCallback<T>;
        order: number;
    }
    export interface EventOptions {
        order?: number;
        passive?: boolean;
    }
}

/* *
 *
 *  Default Export
 *
 * */

const Utilities = {
    addEvent,
    deepClone,
    error,
    fireEvent,
    merge,
    removeEvent,
    uniqueKey
};

export default Utilities;
