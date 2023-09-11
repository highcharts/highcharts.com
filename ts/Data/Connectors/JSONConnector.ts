/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Pawel Lysy
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type DataEvent from '../DataEvent';
import type Types from '../../Shared/Types';
import type JSONConnectorOptions from './JSONConnectorOptions';

import DataConnector from './DataConnector.js';
import JSONConverter from '../Converters/JSONConverter.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * Class that handles creating a DataConnector from JSON structure
 *
 * @private
 */
class JSONConnector extends DataConnector {
    /* *
     *
     *  Static Properties
     *
     * */

    protected static readonly defaultOptions: JSONConnectorOptions = {
        data: [],
        enablePolling: false,
        dataRefreshRate: 0,
        firstRowAsNames: true,
        orientation: 'rows'
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of JSONConnector.
     *
     * @param {JSONConnector.UserOptions} [options]
     * Options for the connector and converter.
     */
    public constructor(
        options?: JSONConnector.UserOptions
    ) {
        const mergedOptions = merge(JSONConnector.defaultOptions, options);

        super(mergedOptions);

        this.converter = new JSONConverter(mergedOptions);
        this.options = mergedOptions;

        if (mergedOptions.enablePolling) {
            this.startPolling(
                Math.max(mergedOptions.dataRefreshRate || 0, 1) * 1000
            );
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Options related to the handling of the JSON DataConnector,
     * i.e. source, fetching, polling
     */
    public readonly options: JSONConnectorOptions;

    /**
     * The attached parser that converts the data format to the table.
     */
    public readonly converter: JSONConverter;
    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initiates the loading of the JSON source to the connector
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits JSONConnector#load
     * @emits JSONConnector#afterLoad
     */
    public load(eventDetail?: DataEvent.Detail): Promise<this> {
        const connector = this,
            converter = connector.converter,
            table = connector.table,
            { data, dataUrl, dataModifier } = connector.options;

        connector.emit<JSONConnector.Event>({
            type: 'load',
            data,
            detail: eventDetail,
            table
        });

        // If already loaded, clear the current rows
        table.deleteRows();

        return Promise.resolve(
            dataUrl ?
                fetch(dataUrl).then(
                    (json): Promise<any> => json.json()
                ) :
                data ?
                    data :
                    []
        )
            .then((data): Promise<Array<Array<number|string>>> => {
                if (data) {
                    converter.parse({ data });
                    table.setColumns(converter.getTable().getColumns());
                }
                return connector
                    .setModifierOptions(dataModifier)
                    .then((): Array<Array<number|string>> => data);
            })
            .then((data): this => {
                connector.emit<JSONConnector.Event>({
                    type: 'afterLoad',
                    data,
                    detail: eventDetail,
                    table
                });
                return connector;
            })['catch']((error): never => {
                connector.emit<JSONConnector.Event>({
                    type: 'loadError',
                    detail: eventDetail,
                    error,
                    table
                });
                throw error;
            });
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

/**
 * Types for class-specific options and events.
 */
namespace JSONConnector {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Event objects fired from JSONConnector events.
     */
    export type Event = (ErrorEvent|LoadEvent);

    /**
     * Parse the data before passing it to the JSON parser.
     */
    export interface DataBeforeParseCallbackFunction {
        (data: JSONConverter.Data): JSONConverter.Data;
    }

    /**
     * The event object that is provided on errors within JSONConnector.
     */
    export interface ErrorEvent extends DataConnector.ErrorEvent {
        data?: JSONConverter.Data;
    }

    /**
     * The event object that is provided on load events within JSONConnector.
     */
    export interface LoadEvent extends DataConnector.LoadEvent {
        data?: JSONConverter.Data
    }

    /**
     * Available options for constructor and converter of the JSONConnector.
     */
    export type UserOptions = (
        Types.DeepPartial<JSONConnectorOptions>&
        JSONConverter.UserOptions
    );

}

/* *
 *
 *  Registry
 *
 * */

declare module './DataConnectorType' {
    interface DataConnectorTypes {
        JSON: typeof JSONConnector;
    }
}

DataConnector.registerType('JSON', JSONConnector);

/* *
 *
 *  Default Export
 *
 * */

export default JSONConnector;
