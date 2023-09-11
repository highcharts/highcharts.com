/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Keyboard navigation handler base class definition
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

import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    find
} = AH;

/* *
 *
 *  Class
 *
 * */

/**
 * Define a keyboard navigation handler for use with a
 * Highcharts.AccessibilityComponent instance. This functions as an abstraction
 * layer for keyboard navigation, and defines a map of keyCodes to handler
 * functions.
 *
 * @requires module:modules/accessibility
 *
 * @sample highcharts/accessibility/custom-component
 *         Custom accessibility component
 *
 * @class
 * @name Highcharts.KeyboardNavigationHandler
 *
 * @param {Highcharts.Chart} chart
 * The chart this module should act on.
 *
 * @param {Highcharts.KeyboardNavigationHandlerOptionsObject} options
 * Options for the keyboard navigation handler.
 */
class KeyboardNavigationHandler {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: Chart,
        options: KeyboardNavigationHandler.Options
    ) {
        this.chart = chart;
        this.keyCodeMap = options.keyCodeMap || [];
        this.validate = options.validate;
        this.init = options.init;
        this.terminate = options.terminate;

        // Response enum
        this.response = {
            success: 1, // Keycode was handled
            prev: 2, // Move to prev module
            next: 3, // Move to next module
            noHandler: 4, // There is no handler for this keycode
            fail: 5 // Handler failed
        };
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: Chart;
    public init: Function;
    public keyCodeMap: Array<[Array<number>, Function]>;
    public response: Record<string, number>;
    public terminate?: Function;
    public validate?: Function;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Find handler function(s) for key code in the keyCodeMap and run it.
     *
     * @function KeyboardNavigationHandler#run
     * @param {global.KeyboardEvent} e
     * @return {number} Returns a response code indicating whether the run was
     *      a success/fail/unhandled, or if we should move to next/prev module.
     */
    public run(
        e: KeyboardEvent
    ): number {
        const keyCode = e.which || e.keyCode;
        let response = this.response.noHandler;
        const handlerCodeSet = find(this.keyCodeMap, function (
            codeSet: [Array<number>, Function]
        ): boolean {
            return codeSet[0].indexOf(keyCode) > -1;
        });

        if (handlerCodeSet) {
            response = handlerCodeSet[1].call(this, keyCode, e);
        } else if (keyCode === 9) {
            // Default tab handler, move to next/prev module
            response = this.response[e.shiftKey ? 'prev' : 'next'];
        }

        return response;
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace KeyboardNavigationHandler {

    /* *
     *
     *  Declarations
     *
     * */

    export interface Options {
        keyCodeMap: Array<[Array<number>, Function]>;
        init: Function;
        terminate?: Function;
        validate?: Function;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default KeyboardNavigationHandler;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Options for the keyboard navigation handler.
 *
 * @interface Highcharts.KeyboardNavigationHandlerOptionsObject
 *//**
 * An array containing pairs of an array of keycodes, mapped to a handler
 * function. When the keycode is received, the handler is called with the
 * keycode as parameter.
 * @name Highcharts.KeyboardNavigationHandlerOptionsObject#keyCodeMap
 * @type {Array<Array<Array<number>, Function>>}
 *//**
 * Function to run on initialization of module.
 * @name Highcharts.KeyboardNavigationHandlerOptionsObject#init
 * @type {Function}
 *//**
 * Function to run before moving to next/prev module. Receives moving direction
 * as parameter: +1 for next, -1 for previous.
 * @name Highcharts.KeyboardNavigationHandlerOptionsObject#terminate
 * @type {Function|undefined}
 *//**
 * Function to run to validate module. Should return false if module should not
 * run, true otherwise. Receives chart as parameter.
 * @name Highcharts.KeyboardNavigationHandlerOptionsObject#validate
 * @type {Function|undefined}
 */

(''); // keeps doclets above in JS file
