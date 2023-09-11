/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Torstein Hønsi
 *  - Gøran Slettemark
 *  - Wojciech Chmiel
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type DataEvent from '../DataEvent';
import type HTMLTableConnectorOptions from './HTMLTableConnectorOptions';
import type Types from '../../Shared/Types';

import DataConnector from './DataConnector.js';
import H from '../../Core/Globals.js';
const { win } = H;
import HTMLTableConverter from '../Converters/HTMLTableConverter.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * Class that handles creating a data connector from an HTML table.
 *
 * @private
 */
class HTMLTableConnector extends DataConnector {

    /* *
     *
     *  Static Properties
     *
     * */

    protected static readonly defaultOptions: HTMLTableConnectorOptions = {
        table: ''
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of HTMLTableConnector.
     *
     * @param {HTMLTableConnector.UserOptions} [options]
     * Options for the connector and converter.
     */
    public constructor(
        options?: HTMLTableConnector.UserOptions
    ) {
        const mergedOptions = merge(HTMLTableConnector.defaultOptions, options);

        super(mergedOptions);

        this.converter = new HTMLTableConverter(mergedOptions);
        this.options = mergedOptions;
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Options for the HTMLTable dataconnector
     * @todo this should not include parsing options
     */
    public readonly options: HTMLTableConnectorOptions;

    /**
     * The attached parser, which can be replaced in the constructor
     */
    public readonly converter: HTMLTableConverter;

    /**
     * The table element to create the connector from. Is either supplied
     * directly or is fetched by an ID.
     */
    public tableElement?: HTMLElement;

    public tableID?: string;

    /**
     * Initiates creating the dataconnector from the HTML table
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @emits HTMLTableConnector#load
     * @emits HTMLTableConnector#afterLoad
     * @emits HTMLTableConnector#loadError
     */
    public load(
        eventDetail?: DataEvent.Detail
    ): Promise<this> {
        const connector = this,
            converter = connector.converter,
            table = connector.table,
            {
                dataModifier,
                table: tableHTML
            } = connector.options;

        connector.emit<HTMLTableConnector.Event>({
            type: 'load',
            detail: eventDetail,
            table,
            tableElement: connector.tableElement
        });

        // If already loaded, clear the current rows
        table.deleteColumns();

        let tableElement: (HTMLElement|null);

        if (typeof tableHTML === 'string') {
            connector.tableID = tableHTML;
            tableElement = win.document.getElementById(tableHTML);
        } else {
            tableElement = tableHTML;
            connector.tableID = tableElement.id;
        }

        connector.tableElement = tableElement || void 0;

        if (!connector.tableElement) {
            const error =
                'HTML table not provided, or element with ID not found';

            connector.emit<HTMLTableConnector.Event>({
                type: 'loadError',
                detail: eventDetail,
                error,
                table
            });

            return Promise.reject(new Error(error));
        }

        converter.parse(
            merge({ tableElement: connector.tableElement }, connector.options),
            eventDetail
        );

        table.setColumns(converter.getTable().getColumns());

        return connector
            .setModifierOptions(dataModifier)
            .then((): this => {
                connector.emit<HTMLTableConnector.Event>({
                    type: 'afterLoad',
                    detail: eventDetail,
                    table,
                    tableElement: connector.tableElement
                });
                return connector;
            });
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

/**
 * Types for class-specific options and events
 */
namespace HTMLTableConnector {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Type for event object fired from HTMLTableConnector
     */
    export type Event = (ErrorEvent|LoadEvent);

    /**
     * Provided event object on errors within HTMLTableConnector
     */
    export type ErrorEvent = DataConnector.ErrorEvent;

    /**
     * Options for exporting the connector as an HTML table
     */
    export interface ExportOptions {
        decimalPoint?: string|null;
        exportIDColumn?: boolean;
        tableCaption?: string;
        useLocalDecimalPoint?: boolean;
        useMultiLevelHeaders?: boolean;
        useRowspanHeaders?: boolean;
        usePresentationOrder?: boolean;
    }

    /**
     * Provided event object on load events within HTMLTableConnector
     */
    export interface LoadEvent extends DataConnector.LoadEvent {
        tableElement?: (HTMLElement|null);
    }

    /**
     * Available options for constructor and converter of the
     * HTMLTableConnector.
     */
    export type UserOptions = (
        Types.DeepPartial<HTMLTableConnectorOptions>&
        HTMLTableConverter.UserOptions
    );

}

/* *
 *
 *  Registry
 *
 * */

declare module './DataConnectorType' {
    interface DataConnectorTypes {
        HTMLTable: typeof HTMLTableConnector;
    }
}

DataConnector.registerType('HTMLTable', HTMLTableConnector);

/* *
 *
 *  Default Export
 *
 * */

export default HTMLTableConnector;
