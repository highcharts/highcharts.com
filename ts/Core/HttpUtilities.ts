/* *
 *
 *  (c) 2010-2021 Christer Vasseng, Torstein Honsi
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

import type HTMLAttributes from './Renderer/HTML/HTMLAttributes';
import type JSON from './JSON';

import G from '../Core/Globals.js';
const { doc } = G;
import U from '../Shared/Utilities.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
const {
    objectEach,
    merge
} = OH;
const {
    createElement,
    discardElement
} = U;

/* *
 *
 *  Declarations
 *
 * */

export interface AjaxErrorCallbackFunction {
    (request: XMLHttpRequest, error: (string|Error)): void;
}

export interface AjaxSettingsObject {
    data?: (string|JSON.Type|JSON.Builder|JSON);
    dataType?: ('json'|'text'|'xml'|'octet'|string);
    error?: AjaxErrorCallbackFunction;
    headers?: Record<string, string>;
    responseType?: 'arraybuffer'|'blob'|'document'|'json'|'text';
    success?: AjaxSuccessCallbackFunction;
    type?: ('get'|'post'|'update'|'delete');
    url: string;
}

export interface AjaxSuccessCallbackFunction {
    (response: (string|JSON.Type), xhr: XMLHttpRequest): void;
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Perform an Ajax call.
 *
 * @function Highcharts.ajax
 *
 * @param {Highcharts.AjaxSettingsObject} settings
 *        The Ajax settings to use.
 *
 * @return {false|undefined}
 *         Returns false, if error occured.
 */
function ajax(
    settings: AjaxSettingsObject
): (false|undefined) {
    const headers: Record<string, string> = {
            json: 'application/json',
            xml: 'application/xml',
            text: 'text/plain',
            octet: 'application/octet-stream'
        },
        r = new XMLHttpRequest();

    /**
     * Private error handler.
     * @private
     * @param {XMLHttpRequest} xhr
     * Internal request object.
     * @param {string|Error} err
     * Occured error.
     */
    function handleError(xhr: XMLHttpRequest, err: (string|Error)): void {
        if (settings.error) {
            settings.error(xhr, err);
        } else {
            // @todo Maybe emit a highcharts error event here
        }
    }

    if (!settings.url) {
        return false;
    }

    r.open((settings.type || 'get').toUpperCase(), settings.url, true);
    if (!settings.headers || !settings.headers['Content-Type']) {
        r.setRequestHeader(
            'Content-Type',
            headers[settings.dataType || 'json'] || headers.text
        );
    }

    objectEach(settings.headers, function (val: string, key: string): void {
        r.setRequestHeader(key, val);
    });

    if (settings.responseType) {
        r.responseType = settings.responseType;
    }

    // @todo lacking timeout handling
    r.onreadystatechange = function (): void {
        let res;

        if (r.readyState === 4) {
            if (r.status === 200) {
                if (settings.responseType !== 'blob') {
                    res = r.responseText;
                    if (settings.dataType === 'json') {
                        try {
                            res = JSON.parse(res);
                        } catch (e) {
                            if (e instanceof Error) {
                                return handleError(r, e);
                            }
                        }
                    }
                }
                return settings.success && settings.success(res, r);
            }

            handleError(r, r.responseText);
        }
    };

    if (settings.data && typeof settings.data !== 'string') {
        settings.data = JSON.stringify(settings.data);
    }

    r.send(settings.data);
}

/**
 * Get a JSON resource over XHR, also supporting CORS without preflight.
 *
 * @function Highcharts.getJSON
 * @param {string} url
 *        The URL to load.
 * @param {Function} success
 *        The success callback. For error handling, use the `Highcharts.ajax`
 *        function instead.
 */
function getJSON(
    url: string,
    success: AjaxSuccessCallbackFunction
): void {
    HttpUtilities.ajax({
        url: url,
        success: success,
        dataType: 'json',
        headers: {
            // Override the Content-Type to avoid preflight problems with CORS
            // in the Highcharts demos
            'Content-Type': 'text/plain'
        }
    });
}

/**
 * The post utility
 *
 * @private
 * @function Highcharts.post
 *
 * @param {string} url
 * Post URL
 *
 * @param {Object} data
 * Post data
 *
 * @param {Highcharts.Dictionary<string>} [formAttributes]
 * Additional attributes for the post request
 */
function post(
    url: string,
    data: object,
    formAttributes?: HTMLAttributes
): void {
    // create the form
    const form: HTMLFormElement = createElement('form', merge({
        method: 'post',
        action: url,
        enctype: 'multipart/form-data'
    }, formAttributes), {
        display: 'none'
    }, doc.body) as unknown as HTMLFormElement;

    // add the data
    objectEach(data, function (val: string, name: string): void {
        createElement('input', {
            type: 'hidden',
            name: name,
            value: val
        }, void 0, form);
    });

    // submit
    form.submit();

    // clean up
    discardElement(form);
}

/* *
 *
 *  Default Export
 *
 * */

const HttpUtilities = {
    ajax,
    getJSON,
    post
};

export default HttpUtilities;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * @interface Highcharts.AjaxSettingsObject
 *//**
 * The payload to send.
 *
 * @name Highcharts.AjaxSettingsObject#data
 * @type {string|Highcharts.Dictionary<any>|undefined}
 *//**
 * The data type expected.
 * @name Highcharts.AjaxSettingsObject#dataType
 * @type {"json"|"xml"|"text"|"octet"|undefined}
 *//**
 * Function to call on error.
 * @name Highcharts.AjaxSettingsObject#error
 * @type {Function|undefined}
 *//**
 * The headers; keyed on header name.
 * @name Highcharts.AjaxSettingsObject#headers
 * @type {Highcharts.Dictionary<string>|undefined}
 *//**
 * Function to call on success.
 * @name Highcharts.AjaxSettingsObject#success
 * @type {Function|undefined}
 *//**
 * The HTTP method to use. For example GET or POST.
 * @name Highcharts.AjaxSettingsObject#type
 * @type {string|undefined}
 *//**
 * The URL to call.
 * @name Highcharts.AjaxSettingsObject#url
 * @type {string}
 */

(''); // keeps doclets above in JS file
