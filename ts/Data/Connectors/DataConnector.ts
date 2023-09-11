/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type { DataConnectorTypes } from './DataConnectorType';
import type { DataConnectorOptions, MetaColumn, Metadata } from './DataConnectorOptions';
import type DataEvent from '../DataEvent';
import type { DataModifierTypeOptions } from '../Modifiers/DataModifierType';

import DataConverter from '../Converters/DataConverter.js';
import DataModifier from '../Modifiers/DataModifier.js';
import DataTable from '../DataTable.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const { addEvent, fireEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Abstract class providing an interface for managing a DataConnector.
 *
 * @private
 */
abstract class DataConnector implements DataEvent.Emitter {

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructor for the connector class.
     *
     * @param {DataConnector.UserOptions} [options]
     * Options to use in the connector.
     */
    public constructor(
        options: DataConnector.UserOptions = {}
    ) {
        this.table = new DataTable(options.dataTable);
        this.metadata = options.metadata || { columns: {} };
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * The DataConverter responsible for handling conversion of provided data to
     * a DataConnector.
     */
    public abstract readonly converter: DataConverter;

    /**
     * Metadata to describe the connector and the content of columns.
     */
    public readonly metadata: Metadata;

    private _polling?: number;

    /**
     * Poll timer ID, if active.
     */
    public get polling(): boolean {
        return !!this.polling;
    }

    /**
     * Table managed by this DataConnector instance.
     */
    public readonly table: DataTable;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Method for adding metadata for a single column.
     *
     * @param {string} name
     * The name of the column to be described.
     *
     * @param {DataConnector.MetaColumn} columnMeta
     * The metadata to apply to the column.
     */
    public describeColumn(
        name: string,
        columnMeta: MetaColumn
    ): void {
        const connector = this,
            columns = connector.metadata.columns;

        columns[name] = merge(columns[name] || {}, columnMeta);
    }

    /**
     * Method for applying columns meta information to the whole DataConnector.
     *
     * @param {Highcharts.Dictionary<DataConnector.MetaColumn>} columns
     * Pairs of column names and MetaColumn objects.
     */
    public describeColumns(
        columns: Record<string, MetaColumn>
    ): void {
        const connector = this,
            columnNames = Object.keys(columns);

        let columnName: (string|undefined);

        while (typeof (columnName = columnNames.pop()) === 'string') {
            connector.describeColumn(columnName, columns[columnName]);
        }
    }

    /**
     * Emits an event on the connector to all registered callbacks of this
     * event.
     *
     * @param {DataConnector.Event} [e]
     * Event object containing additional event information.
     */
    public emit<E extends DataEvent>(e: E): void {
        fireEvent(this, e.type, e);
    }

    /**
     * Returns the order of columns.
     *
     * @param {boolean} [usePresentationState]
     * Whether to use the column order of the presentation state of the table.
     *
     * @return {Array<string>|undefined}
     * Order of columns.
     */
    public getColumnOrder(
        usePresentationState?: boolean
    ): (Array<string>|undefined) {
        const connector = this,
            columns = connector.metadata.columns,
            names = Object.keys(columns || {});

        if (names.length) {
            return names.sort((a, b): number => (
                pick(columns[a].index, 0) - pick(columns[b].index, 0)
            ));
        }
    }

    /**
     * Retrieves the columns of the the dataTable,
     * applies column order from meta.
     *
     * @param {boolean} [usePresentationOrder]
     * Whether to use the column order of the presentation state of the table.
     *
     * @return {Highcharts.DataTableColumnCollection}
     * An object with the properties `columnNames` and `columnValues`
     */
    public getSortedColumns(
        usePresentationOrder?: boolean
    ): DataTable.ColumnCollection {
        return this.table.getColumns(
            this.getColumnOrder(usePresentationOrder)
        );
    }

    /**
     * The default load method, which fires the `afterLoad` event
     *
     * @return {Promise<DataConnector>}
     * The loaded connector.
     *
     * @emits DataConnector#afterLoad
     */
    public load(): Promise<this> {
        fireEvent(this, 'afterLoad', { table: this.table });
        return Promise.resolve(this);
    }

    /**
     * Registers a callback for a specific connector event.
     *
     * @param {string} type
     * Event type as a string.
     *
     * @param {DataEventEmitter.Callback} callback
     * Function to register for the connector callback.
     *
     * @return {Function}
     * Function to unregister callback from the connector event.
     */
    public on<E extends DataEvent>(
        type: E['type'],
        callback: DataEvent.Callback<this, E>
    ): Function {
        return addEvent(this, type, callback);
    }

    /**
     * The default save method, which fires the `afterSave` event.
     *
     * @return {Promise<DataConnector>}
     * The saved connector.
     *
     * @emits DataConnector#afterSave
     * @emits DataConnector#saveError
     */
    public save(): Promise<this> {
        fireEvent(this, 'saveError', { table: this.table });
        return Promise.reject(new Error('Not implemented'));
    }

    /**
     * Sets the index and order of columns.
     *
     * @param {Array<string>} columnNames
     * Order of columns.
     */
    public setColumnOrder(columnNames: Array<string>): void {
        const connector = this;

        for (let i = 0, iEnd = columnNames.length; i < iEnd; ++i) {
            connector.describeColumn(columnNames[i], { index: i });
        }
    }

    public setModifierOptions(
        modifierOptions?: DataModifierTypeOptions
    ): Promise<this> {
        const ModifierClass = (
            modifierOptions &&
            DataModifier.types[modifierOptions.type]
        );

        return this.table
            .setModifier(
                ModifierClass ?
                    new ModifierClass(modifierOptions as AnyRecord) :
                    void 0
            )
            .then((): this => this);
    }

    /**
     * Starts polling new data after the specific time span in milliseconds.
     *
     * @param {number} refreshTime
     * Refresh time in milliseconds between polls.
     */
    public startPolling(
        refreshTime: number = 1000
    ): void {
        const connector = this;

        window.clearTimeout(connector._polling);

        connector._polling = window.setTimeout((): Promise<void> => connector
            .load()['catch'](
                (error): void => connector.emit<DataConnector.ErrorEvent>({
                    type: 'loadError',
                    error,
                    table: connector.table
                })
            )
            .then((): void => {
                if (connector._polling) {
                    connector.startPolling(refreshTime);
                }
            })
        , refreshTime);
    }

    /**
     * Stops polling data.
     */
    public stopPolling(): void {
        const connector = this;

        window.clearTimeout(connector._polling);

        delete connector._polling;
    }

    /**
     * Retrieves metadata from a single column.
     *
     * @param {string} name
     * The identifier for the column that should be described
     *
     * @return {DataConnector.MetaColumn|undefined}
     * Returns a MetaColumn object if found.
     */
    public whatIs(name: string): (MetaColumn | undefined) {
        return this.metadata.columns[name];
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace DataConnector {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * The event object that is provided on errors within DataConnector.
     */
    export interface ErrorEvent extends Event {
        type: ('loadError');
        error: (string|Error);
    }

    /**
     * The default event object for a DataConnector.
     */
    export interface Event extends DataEvent {
        readonly table: DataTable;
    }

    /**
     * The event object that is provided on load events within DataConnector.
     */
    export interface LoadEvent extends Event {
        type: ('load'|'afterLoad');
    }

    /**
     * Option of the DataConnector.
     */
    export type UserOptions = Partial<DataConnectorOptions>;

    /* *
     *
     *  Constants
     *
     * */

    /**
     * Registry as a record object with connector names and their class.
     */
    export const types = {} as DataConnectorTypes;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Adds a connector class to the registry. The connector has to provide the
     * `DataConnector.options` property and the `DataConnector.load` method to
     * modify the table.
     *
     * @private
     *
     * @param {string} key
     * Registry key of the connector class.
     *
     * @param {DataConnectorType} DataConnectorClass
     * Connector class (aka class constructor) to register.
     *
     * @return {boolean}
     * Returns true, if the registration was successful. False is returned, if
     * their is already a connector registered with this key.
     */
    export function registerType<T extends keyof DataConnectorTypes>(
        key: T,
        DataConnectorClass: DataConnectorTypes[T]
    ): boolean {
        return (
            !!key &&
            !types[key] &&
            !!(types[key] = DataConnectorClass)
        );
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataConnector;
