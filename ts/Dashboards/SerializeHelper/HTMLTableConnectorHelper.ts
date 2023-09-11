/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Globals from '../Globals';
import type JSON from '../JSON';
import type HTMLTableConnectorOptions from '../../Data/Connectors/HTMLTableConnectorOptions';

import DataTableHelper from './DataTableHelper.js';
import HTMLTableConnector from '../../Data/Connectors/HTMLTableConnector.js';
import Serializable from '../Serializable.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Functions
 *
 * */

/**
 * Converts the given JSON to a class instance.
 *
 * @param {HTMLTableConnectorHelper.JSON} json
 * JSON to deserialize as a class instance or object.
 *
 * @return {HTMLTableConnector}
 * Returns the class instance or object, or throws an exception.
 */
function fromJSON(
    json: HTMLTableConnectorHelper.JSON
): HTMLTableConnector {
    return new HTMLTableConnector(json.options);
}

/**
 * Validates the given class instance for JSON support.
 *
 * @param {Globals.AnyRecord} obj
 * Class instance or object to validate.
 *
 * @return {boolean}
 * Returns true, if the function set can convert the given object, otherwise
 * false.
 */
function jsonSupportFor(
    obj: Globals.AnyRecord
): obj is HTMLTableConnector {
    return obj instanceof HTMLTableConnector;
}

/**
 * Converts the given class instance to JSON.
 *
 * @param {HTMLTableConnector} obj
 * Class instance or object to serialize as JSON.
 *
 * @return {HTMLTableConnectorHelper.JSON}
 * Returns the JSON of the class instance or object.
 */
function toJSON(
    obj: HTMLTableConnector
): HTMLTableConnectorHelper.JSON {
    const options = merge(obj.options) as HTMLTableConnectorHelper.OptionsJSON;

    options.dataTable = DataTableHelper.toJSON(obj.table);

    return {
        $class: 'Data.HTMLTableConnector',
        options
    };
}

/* *
 *
 *  Namespace
 *
 * */

namespace HTMLTableConnectorHelper {

    /* *
     *
     *  Declarations
     *
     * */

    export interface JSON extends Serializable.JSON<'Data.HTMLTableConnector'> {
        options: OptionsJSON;
    }

    export type OptionsJSON = (JSON.Object&HTMLTableConnectorOptions);

}

/* *
 *
 *  Default Export
 *
 * */

const HTMLTableConnectorHelper: Serializable.Helper<HTMLTableConnector, HTMLTableConnectorHelper.JSON> = {
    $class: 'Data.HTMLTableConnector',
    fromJSON,
    jsonSupportFor,
    toJSON
};

Serializable.registerHelper(HTMLTableConnectorHelper);

/* *
 *
 *  Default Export
 *
 * */

export default HTMLTableConnectorHelper;
