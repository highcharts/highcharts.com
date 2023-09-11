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
import type CSVConnectorOptions from '../../Data/Connectors/CSVConnectorOptions';

import CSVConnector from '../../Data/Connectors/CSVConnector.js';
import DataTableHelper from './DataTableHelper.js';
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
 * @param {CSVConnectorHelper.JSON} json
 * JSON to deserialize as a class instance or object.
 *
 * @return {CSVConnector}
 * Returns the class instance or object, or throws an exception.
 */
function fromJSON(
    json: CSVConnectorHelper.JSON
): CSVConnector {
    return new CSVConnector(json.options);
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
): obj is CSVConnector {
    return obj instanceof CSVConnector;
}

/**
 * Converts the given class instance to JSON.
 *
 * @param {CSVConnector} obj
 * Class instance or object to serialize as JSON.
 *
 * @return {CSVConnectorHelper.JSON}
 * Returns the JSON of the class instance or object.
 */
function toJSON(
    obj: CSVConnector
): CSVConnectorHelper.JSON {
    const options = merge(obj.options) as CSVConnectorHelper.OptionsJSON;

    options.dataTable = DataTableHelper.toJSON(obj.table);

    return {
        $class: 'Data.CSVConnector',
        options
    };
}

/* *
 *
 *  Namespace
 *
 * */

namespace CSVConnectorHelper {

    /* *
     *
     *  Declarations
     *
     * */

    export interface JSON extends Serializable.JSON<'Data.CSVConnector'> {
        options: OptionsJSON;
    }

    export type OptionsJSON = (JSON.Object&CSVConnectorOptions);

}

/* *
 *
 *  Registry
 *
 * */

const CSVConnectorHelper: Serializable.Helper<CSVConnector, CSVConnectorHelper.JSON> = {
    $class: 'Data.CSVConnector',
    fromJSON,
    jsonSupportFor,
    toJSON
};

Serializable.registerHelper(CSVConnectorHelper);

/* *
 *
 *  Default Export
 *
 * */

export default CSVConnectorHelper;
