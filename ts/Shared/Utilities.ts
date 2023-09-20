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
import type Chart from '../Core/Chart/Chart';
import type CSSObject from '../Core/Renderer/CSSObject';
import type {
    DOMElementType,
    HTMLDOMElement
} from '../Core/Renderer/DOMElementType';
import type EventCallback from '../Core/EventCallback';
import type HTMLAttributes from '../Core/Renderer/HTML/HTMLAttributes';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function Utilities(Globals: any) {
    const {
        win
    } = Globals;
    const doc = win.document;
    const supportsPassiveEvents = (function (): boolean {
        // Checks whether the browser supports passive events, (#11353).
        let supportsPassive = false;

        // Object.defineProperty doesn't work on IE as well as passive
        // events - instead of using polyfill, we can exclude IE totally.
        if (!Globals.isMS) {
            const opts = Object.defineProperty({}, 'passive', {
                get: function (): void {
                    supportsPassive = true;
                }
            });

            if (win.addEventListener && win.removeEventListener) {
                win.addEventListener('testPassive', Globals.noop, opts);
                win.removeEventListener('testPassive', Globals.noop, opts);
            }
        }

        return supportsPassive;
    }());

type NonArray<T> = T extends Array<unknown> ? never : T;
type NonFunction<T> = T extends Function ? never : T;
type NullType = (null|undefined);
/* eslint-disable valid-jsdoc */
/**
 * Add an event listener.
 *
 * @function Highcharts.addEvent<T>
 *
 * @param {Highcharts.Class<T>|T} el
 *        The element or object to add a listener to. It can be a
 *        {@link HTMLDOMElement}, an {@link SVGElement} or any other object.
 *
 * @param {string} type
 *        The event type.
 *
 * @param {Highcharts.EventCallbackFunction<T>|Function} fn
 *        The function callback to execute when the event is fired.
 *
 * @param {Highcharts.EventOptionsObject} [options]
 *        Options for adding the event.
 *
 * @return {Function}
 *         A callback function to remove the added event.
 */
/**
 * Returns the value of a property path on a given object.
 *
 * @private
 * @function getNestedProperty
 *
 * @param {string} path
 * Path to the property, for example `custom.myValue`.
 *
 * @param {unknown} obj
 * Instance containing the property on the specific path.
 *
 * @return {unknown}
 * The unknown property value.
 */
function getNestedProperty(path: string, parent: unknown): unknown {

    const pathElements = path.split('.');

    while (pathElements.length && defined(parent)) {
        const pathElement = pathElements.shift();

        // Filter on the key
        if (
            typeof pathElement === 'undefined' ||
            pathElement === '__proto__'
        ) {
            return; // undefined
        }

        if (pathElement === 'this') {
            let thisProp;
            if (isObject(parent)) {
                thisProp = (parent as Record<string, unknown>)['@this'];
            }
            return thisProp ?? parent;
        }

        const child = (parent as Record<string, unknown>)[
            pathElement
        ] as Record<string, unknown>;

        // Filter on the child
        if (
            !defined(child) ||
            typeof child === 'function' ||
            typeof child.nodeType === 'number' ||
            child as unknown === win
        ) {
            return; // undefined
        }

        // Else, proceed
        parent = child;
    }
    return parent;
}
function addEvent<T>(
    el: (Class<T>|T),
    type: string,
    fn: (EventCallback<T>|Function),
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
 * Constrain a value to within a lower and upper threshold.
 *
 * @private
 * @param {number} value The initial value
 * @param {number} min The lower threshold
 * @param {number} max The upper threshold
 * @return {number} Returns a number value within min and max.
 */
function clamp(value: number, min: number, max: number): number {
    return value > min ? value < max ? value : max : min;
}
/**
 * Utility function to create an HTML element with attributes and styles.
 *
 * @function Highcharts.createElement
 *
 * @param {string} tag
 *        The HTML tag.
 *
 * @param {Highcharts.HTMLAttributes} [attribs]
 *        Attributes as an object of key-value pairs.
 *
 * @param {Highcharts.CSSObject} [styles]
 *        Styles as an object of key-value pairs.
 *
 * @param {Highcharts.HTMLDOMElement} [parent]
 *        The parent HTML object.
 *
 * @param {boolean} [nopad=false]
 *        If true, remove all padding, border and margin.
 *
 * @return {Highcharts.HTMLDOMElement}
 *         The created DOM element.
 */
function createElement(
    tag: string,
    attribs?: HTMLAttributes,
    styles?: CSSObject,
    parent?: HTMLDOMElement,
    nopad?: boolean
): HTMLDOMElement {
    const el = doc.createElement(tag);

    if (attribs) {
        extend(el, attribs);
    }
    if (nopad) {
        css(el, { padding: '0', border: 'none', margin: '0' });
    }
    if (styles) {
        css(el, styles);
    }
    if (parent) {
        parent.appendChild(el);
    }
    return el;
}

/**
 * Set CSS on a given element.
 *
 * @function Highcharts.css
 *
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} el
 *        An HTML DOM element.
 *
 * @param {Highcharts.CSSObject} styles
 *        Style object with camel case property names.
 *
 * @return {void}
 */
function css(
    el: DOMElementType,
    styles: CSSObject
): void {
    if (Globals.isMS && !Globals.svg) { // #2686
        if (styles && defined(styles.opacity)) {
            styles.filter = `alpha(opacity=${styles.opacity * 100})`;
        }
    }
    extend(el.style, styles as any);
}

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

const errorMessages: Array<string> = [];
/**
 * Provide error messages for debugging, with links to online explanation. This
 * function can be overridden to provide custom error handling.
 *
 * @sample highcharts/chart/highcharts-error/
 *         Custom error handler
 *
 * @function Highcharts.error
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
 * @param {Highcharts.Chart} [chart]
 *        Reference to the chart that causes the error. Used in 'debugger'
 *        module to display errors directly on the chart.
 *        Important note: This argument is undefined for errors that lack
 *        access to the Chart instance. In such case, the error will be
 *        displayed on the last created chart.
 *
 * @param {Highcharts.Dictionary<string>} [params]
 *        Additional parameters for the generated message.
 *
 * @return {void}
 */
function error(
    code: (number|string),
    stop?: boolean,
    chart?: Chart,
    params?: Record<string, string>
): void {
    const severity = stop ? 'Highcharts error' : 'Highcharts warning';
    if (code === 32) {
        code = `${severity}: Deprecated member`;
    }

    const isCode = isNumber(code);
    let message = isCode ?
        `${severity} #${code}: www.highcharts.com/errors/${code}/` :
        code.toString();
    const defaultHandler = function (): void {
        if (stop) {
            throw new Error(message);
        }
        // else ...
        if (
            win.console &&
            errorMessages.indexOf(message) === -1 // prevent console flooting
        ) {
            console.warn(message); // eslint-disable-line no-console
        }
    };

    if (typeof params !== 'undefined') {
        let additionalMessages = '';
        if (isCode) {
            message += '?';
        }
        objectEach(params, function (value, key): void {
            additionalMessages += `\n - ${key}: ${value}`;
            if (isCode) {
                message += encodeURI(key) + '=' + encodeURI(value);
            }
        });
        message += additionalMessages;
    }

    fireEvent(
        Globals,
        'displayError',
        { chart, code, message, params },
        defaultHandler
    );

    errorMessages.push(message);
}

/* eslint-disable valid-jsdoc */
/**
 * Fire an event that was registered with {@link Highcharts#addEvent}.
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
 * @param {Highcharts.Dictionary<*>|Event} [eventArguments]
 *        Custom event arguments that are passed on as an argument to the event
 *        handler.
 *
 * @param {Highcharts.EventCallbackFunction<T>|Function} [defaultFunction]
 *        The default function to execute if the other listeners haven't
 *        returned false.
 *
 * @return {void}
 */
function fireEvent<T>(
    el: T,
    type: string,
    eventArguments?: (AnyRecord|Event),
    defaultFunction?: (EventCallback<T>|Function)
): void {
    /* eslint-enable valid-jsdoc */
    let e,
        i;

    eventArguments = eventArguments || {};

    if (doc.createEvent &&
        (
            (el as any).dispatchEvent ||
            (
                (el as any).fireEvent &&
                // Enable firing events on Highcharts instance.
                (el as any) !== Globals
            )
        )
    ) {
        e = doc.createEvent('Events');
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
    if (defaultFunction && !(eventArguments as any).defaultPrevented) {
        (defaultFunction as Function).call(el, eventArguments);
    }
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
        callback: Utilities.FindCallback<T>
    ): (T|undefined) {
        return (arr as any).find(callback as any);
    } :
    // Legacy implementation. PhantomJS, IE <= 11 etc. #7223.
    function<T> (
        arr: Array<T>,
        callback: Utilities.FindCallback<T>
    ): (T|undefined) {
        let i;
        const length = arr.length;

        for (i = 0; i < length; i++) {
            if (callback(arr[i], i)) { // eslint-disable-line node/callback-return
                return arr[i];
            }
        }
    };
function getStyle(
    el: HTMLDOMElement,
    prop: string,
    toInt: true
): (number|undefined);
function getStyle(
    el: HTMLDOMElement,
    prop: string,
    toInt?: false
): (number|string|undefined);
/**
 * Get the computed CSS value for given element and property, only for numerical
 * properties. For width and height, the dimension of the inner box (excluding
 * padding) is returned. Used for fitting the chart within the container.
 *
 * @function Highcharts.getStyle
 *
 * @param {Highcharts.HTMLDOMElement} el
 * An HTML element.
 *
 * @param {string} prop
 * The property name.
 *
 * @param {boolean} [toInt=true]
 * Parse to integer.
 *
 * @return {number|string|undefined}
 * The style value.
 */
function getStyle(
    el: HTMLDOMElement,
    prop: string,
    toInt?: boolean
): (number|string|undefined) {
    let style: (number|string|undefined);

    // For width and height, return the actual inner pixel size (#4913)
    if (prop === 'width') {

        let offsetWidth = Math.min(el.offsetWidth, el.scrollWidth);

        // In flex boxes, we need to use getBoundingClientRect and floor it,
        // because scrollWidth doesn't support subpixel precision (#6427) ...
        const boundingClientRectWidth = el.getBoundingClientRect &&
            el.getBoundingClientRect().width;
        // ...unless if the containing div or its parents are transform-scaled
        // down, in which case the boundingClientRect can't be used as it is
        // also scaled down (#9871, #10498).
        if (
            boundingClientRectWidth < offsetWidth &&
            boundingClientRectWidth >= offsetWidth - 1
        ) {
            offsetWidth = Math.floor(boundingClientRectWidth);
        }

        return Math.max(
            0, // #8377
            (
                offsetWidth -
                (getStyle(el, 'padding-left', true) || 0) -
                (getStyle(el, 'padding-right', true) || 0)
            )
        );
    }

    if (prop === 'height') {
        return Math.max(
            0, // #8377
            (
                Math.min(el.offsetHeight, el.scrollHeight) -
                (getStyle(el, 'padding-top', true) || 0) -
                (getStyle(el, 'padding-bottom', true) || 0)
            )
        );
    }

    // Otherwise, get the computed style
    const css = win.getComputedStyle(el, void 0); // eslint-disable-line no-undefined
    if (css) {
        style = css.getPropertyValue(prop);
        if (pick(toInt, prop !== 'opacity')) {
            style = pInt(style);
        }
    }

    return style;
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
    fn: Utilities.ObjectEachCallback<TObject, TContext>,
    ctx?: TContext
): void {
    /* eslint-enable valid-jsdoc */
    for (const key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) {
            fn.call(ctx || obj[key] as unknown as TContext, obj[key], key, obj);
        }
    }
}

function pick<T1, T2, T3, T4, T5>(...args: [T1, T2, T3, T4, T5]):
T1 extends NullType ?
    T2 extends NullType ?
        T3 extends NullType ?
            T4 extends NullType ?
                T5 extends NullType ? undefined : T5 : T4 : T3 : T2 : T1;
function pick<T1, T2, T3, T4>(...args: [T1, T2, T3, T4]):
T1 extends NullType ?
    T2 extends NullType ?
        T3 extends NullType ?
            T4 extends NullType ? undefined : T4 : T3 : T2 : T1;
function pick<T1, T2, T3>(...args: [T1, T2, T3]):
T1 extends NullType ?
    T2 extends NullType ?
        T3 extends NullType ? undefined : T3 : T2 : T1;
function pick<T1, T2>(...args: [T1, T2]):
T1 extends NullType ?
    T2 extends NullType ? undefined : T2 : T1;
function pick<T1>(...args: [T1]):
T1 extends NullType ? undefined : T1;
function pick<T>(...args: Array<T|null|undefined>): T|undefined;
/* eslint-disable valid-jsdoc */
/**
 * Return the first value that is not null or undefined.
 *
 * @function Highcharts.pick<T>
 *
 * @param {...Array<T|null|undefined>} items
 *        Variable number of arguments to inspect.
 *
 * @return {T}
 *         The value of the first argument that is not null or undefined.
 */
function pick<T>(): T|undefined {
    const args = arguments;
    const length = args.length;
    for (let i = 0; i < length; i++) {
        const arg = args[i];
        if (typeof arg !== 'undefined' && arg !== null) {
            return arg;
        }
    }
}

/**
 * Shortcut for parseInt
 *
 * @private
 * @function Highcharts.pInt
 *
 * @param {*} s
 *        any
 *
 * @param {number} [mag]
 *        Magnitude
 *
 * @return {number}
 *         number
 */
function pInt(s: any, mag?: number): number {
    return parseInt(s, mag || 10);
}


/**
 * Return a length based on either the integer value, or a percentage of a base.
 *
 * @function Highcharts.relativeLength
 *
 * @param {Highcharts.RelativeSize} value
 *        A percentage string or a number.
 *
 * @param {number} base
 *        The full length that represents 100%.
 *
 * @param {number} [offset=0]
 *        A pixel offset to apply for percentage values. Used internally in
 *        axis positioning.
 *
 * @return {number}
 *         The computed length.
 */
function relativeLength(
    value: Utilities.RelativeSize,
    base: number,
    offset?: number
): number {
    return (/%$/).test(value as any) ?
        (base * parseFloat(value as any) / 100) + (offset || 0) :
        parseFloat(value as any);
}

/* eslint-disable valid-jsdoc */
/**
 * Remove an event that was added with {@link Highcharts#addEvent}.
 *
 * @function Highcharts.removeEvent<T>
 *
 * @param {Highcharts.Class<T>|T} el
 *        The element to remove events on.
 *
 * @param {string} [type]
 *        The type of events to remove. If undefined, all events are removed
 *        from the element.
 *
 * @param {Highcharts.EventCallbackFunction<T>} [fn]
 *        The specific callback to remove. If undefined, all events that match
 *        the element and optionally the type are removed.
 *
 * @return {void}
 */
function removeEvent<T>(
    el: (Class<T>|T),
    type?: string,
    fn?: (EventCallback<T>|Function)
): void {
    /* eslint-enable valid-jsdoc */

    /**
     * @private
     */
    function removeOneEvent(
        type: string,
        fn: (EventCallback<T>|Function)
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
            return; // break on non-DOM events
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

/**
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
 * Get a unique key for using in internal element id's and pointers. The key is
 * composed of a random hash specific to this Highcharts instance, and a
 * counter.
 *
 * @example
 * let id = uniqueKey(); // => 'highcharts-x45f6hp-0'
 *
 * @function Highcharts.uniqueKey
 *
 * @return {string}
 * A unique key.
 */
let serialMode: (boolean|undefined);
const uniqueKey = (function (): () => string {

    const hash = Math.random().toString(36).substring(2, 9) + '-';

    let id = 0;

    return function (): string {
        return 'highcharts-' + (serialMode ? '' : hash) + id++;
    };

}());
/**
 * Activates a serial mode for element IDs provided by
 * {@link Highcharts.uniqueKey}. This mode can be used in automated tests, where
 * a simple comparison of two rendered SVG graphics is needed.
 *
 * **Note:** This is only for testing purposes and will break functionality in
 * webpages with multiple charts.
 *
 * @example
 * if (
 *   process &&
 *   process.env.NODE_ENV === 'development'
 * ) {
 *   Highcharts.useSerialIds(true);
 * }
 *
 * @function Highcharts.useSerialIds
 *
 * @param {boolean} [mode]
 * Changes the state of serial mode.
 *
 * @return {boolean|undefined}
 * State of the serial mode.
 */
function useSerialIds(mode?: boolean): (boolean|undefined) {
    return (serialMode = pick(mode, serialMode));
}

const Utilities = {
    addEvent,
    createElement,
    css,
    clamp,
    defined,
    diffObjects,
    error,
    extend,
    fireEvent,
    find,
    getStyle,
    getNestedProperty,
    isArray,
    isClass,
    isDOMElement,
    isFunction,
    isNumber,
    isObject,
    isString,
    merge,
    objectEach,
    pick,
    pInt,
    relativeLength,
    removeEvent,
    splat,
    uniqueKey,
    useSerialIds
};

return Utilities;
}
namespace Utilities {
    export type RelativeSize = (number|string);
    export interface ErrorMessageEventObject {
        chart?: Chart;
        code: number;
        message?: string;
        params?: Record<string, string>;
    }
    export interface EventOptions {
        order?: number;
        passive?: boolean;
    }
    export interface EventWrapperObject<T> {
        fn: EventCallback<T>;
        order: number;
    }
    export interface FindCallback<T> {
        (
            value: T,
            index: number
        ): unknown;
    }
    export interface ObjectEachCallback<TObject, TContext> {
        (
            this: TContext,
            value: TObject[keyof TObject],
            key: keyof TObject,
            obj: TObject
        ): void;
    }
    export interface OffsetObject {
        height: number;
        left: number;
        top: number;
        width: number;
    }
    export interface WrapProceedFunction<T extends ArrowFunction> {
        (proceed: (T&ArrowFunction), ...args: Array<any>): ReturnType<T>;
    }
}

export default Utilities;
