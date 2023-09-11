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
import type GoogleSheetsConnectorOptions from '../../Data/Connectors/GoogleSheetsConnectorOptions';

import DataTableHelper from './DataTableHelper.js';
import GoogleSheetsConnector from '../../Data/Connectors/GoogleSheetsConnector.js';
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
 * @param {GoogleSheetsConnectorHelper.JSON} json
 * JSON to deserialize as a class instance or object.
 *
 * @return {GoogleSheetsConnector}
 * Returns the class instance or object, or throws an exception.
 */
function fromJSON(
    json: GoogleSheetsConnectorHelper.JSON
): GoogleSheetsConnector {
    return new GoogleSheetsConnector(
        json.options || { googleAPIKey: '', googleSpreadsheetKey: '' }
    );
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
): obj is GoogleSheetsConnector {
    return obj instanceof GoogleSheetsConnector;
}

/**
 * Converts the given class instance to JSON.
 *
 * @param {GoogleSheetsConnector} obj
 * Class instance or object to serialize as JSON.
 *
 * @return {GoogleSheetsConnectorHelper.JSON}
 * Returns the JSON of the class instance or object.
 */
function toJSON(
    obj: GoogleSheetsConnector
): GoogleSheetsConnectorHelper.JSON {
    const options =
        merge(obj.options) as GoogleSheetsConnectorHelper.OptionsJSON;

    options.dataTable = DataTableHelper.toJSON(obj.table);

    return {
        $class: 'Data.GoogleSheetsConnector',
        options
    };
}

/* *
 *
 *  Namespace
 *
 * */

namespace GoogleSheetsConnectorHelper {

    /* *
     *
     *  Declarations
     *
     * */

    export interface JSON extends Serializable.JSON<'Data.GoogleSheetsConnector'> {
        options: OptionsJSON;
    }

    export type OptionsJSON = (JSON.Object&GoogleSheetsConnectorOptions);

}

/* *
 *
 *  Registry
 *
 * */

const GoogleSheetsConnectorHelper: Serializable.Helper<GoogleSheetsConnector, GoogleSheetsConnectorHelper.JSON> = {
    $class: 'Data.GoogleSheetsConnector',
    fromJSON,
    jsonSupportFor,
    toJSON
};

Serializable.registerHelper(GoogleSheetsConnectorHelper);

/* *
 *
 *  Default Export
 *
 * */

export default GoogleSheetsConnectorHelper;
