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
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type ChainModifierOptions from './ChainModifierOptions';
import type DataEvent from '../DataEvent';
import type DataModifierEvent from './DataModifierEvent';
import type {
    DataModifierType,
    DataModifierTypeOptions
} from './DataModifierType';
import type Types from '../../Shared/Types';

import DataModifier from './DataModifier.js';
import DataTable from '../DataTable.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * Modifies a table with the help of modifiers in an ordered chain.
 *
 * @private
 */
class ChainModifier extends DataModifier {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Default option for the ordered modifier chain.
     */
    public static readonly defaultOptions: ChainModifierOptions = {
        type: 'Chain'
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the modifier chain.
     *
     * @param {Partial<ChainModifier.Options>} [options]
     * Options to configure the modifier chain.
     *
     * @param {...DataModifier} [chain]
     * Ordered chain of modifiers.
     */
    public constructor(
        options?: Partial<ChainModifierOptions>,
        ...chain: Array<DataModifier>
    ) {
        super();

        this.chain = chain;
        this.options = merge(ChainModifier.defaultOptions, options);

        const optionsChain = this.options.chain || [];

        for (
            let i = 0,
                iEnd = optionsChain.length,
                modifierOptions: Partial<DataModifierTypeOptions>,
                ModifierClass: (DataModifierType|undefined);
            i < iEnd;
            ++i
        ) {
            modifierOptions = optionsChain[i];

            if (!modifierOptions.type) {
                continue;
            }

            ModifierClass = DataModifier.types[modifierOptions.type];

            if (ModifierClass) {
                chain.push(new ModifierClass(
                    modifierOptions as Types.AnyRecord
                ));
            }
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Ordered chain of modifiers.
     */
    public readonly chain: Array<DataModifier>;

    /**
     * Options of the modifier chain.
     */
    public readonly options: ChainModifierOptions;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Adds a configured modifier to the end of the modifier chain. Please note,
     * that the modifier can be added multiple times.
     *
     * @param {DataModifier} modifier
     * Configured modifier to add.
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     */
    public add(
        modifier: DataModifier,
        eventDetail?: DataEvent.Detail
    ): void {
        this.emit<ChainModifier.Event>({
            type: 'addModifier',
            detail: eventDetail,
            modifier
        });

        this.chain.push(modifier);

        this.emit<ChainModifier.Event>({
            type: 'addModifier',
            detail: eventDetail,
            modifier
        });
    }

    /**
     * Clears all modifiers from the chain.
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     */
    public clear(eventDetail?: DataEvent.Detail): void {
        this.emit<ChainModifier.Event>({
            type: 'clearChain',
            detail: eventDetail
        });

        this.chain.length = 0;

        this.emit<ChainModifier.Event>({
            type: 'afterClearChain',
            detail: eventDetail
        });
    }

    /**
     * Applies several modifications to the table and returns a modified copy of
     * the given table.
     *
     * @param {Highcharts.DataTable} table
     * Table to modify.
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Promise<Highcharts.DataTable>}
     * Table with `modified` property as a reference.
     */
    public modify<T extends DataTable>(
        table: T,
        eventDetail?: DataEvent.Detail
    ): Promise<T> {
        const modifiers = (
            this.options.reverse ?
                this.chain.slice().reverse() :
                this.chain.slice()
        );

        if (table.modified === table) {
            table.modified = table.clone(false, eventDetail);
        }

        let promiseChain: Promise<T> = Promise.resolve(table);

        for (let i = 0, iEnd = modifiers.length; i < iEnd; ++i) {
            const modifier = modifiers[i];
            promiseChain = promiseChain.then((chainTable): Promise<T> =>
                modifier.modify(chainTable.modified as T, eventDetail)
            );
        }

        promiseChain = promiseChain.then((chainTable): T => {
            table.modified.deleteColumns();
            table.modified.setColumns(chainTable.modified.getColumns());
            return table;
        });

        promiseChain = promiseChain['catch']((error): Promise<T> => {
            this.emit<DataModifierEvent>({
                type: 'error',
                detail: eventDetail,
                table
            });
            throw error;
        });

        return promiseChain;
    }

    /**
     * Applies partial modifications of a cell change to the property `modified`
     * of the given modified table.
     *
     * *Note:* The `modified` property of the table gets replaced.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {string} columnName
     * Column name of changed cell.
     *
     * @param {number|undefined} rowIndex
     * Row index of changed cell.
     *
     * @param {Highcharts.DataTableCellType} cellValue
     * Changed cell value.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Table with `modified` property as a reference.
     */
    public modifyCell<T extends DataTable>(
        table: T,
        columnName: string,
        rowIndex: number,
        cellValue: DataTable.CellType,
        eventDetail?: DataEvent.Detail
    ): T {
        const modifiers = (
            this.options.reverse ?
                this.chain.reverse() :
                this.chain
        );

        if (modifiers.length) {
            let clone = table.clone();

            for (let i = 0, iEnd = modifiers.length; i < iEnd; ++i) {
                modifiers[i].modifyCell(
                    clone,
                    columnName,
                    rowIndex,
                    cellValue,
                    eventDetail
                );
                clone = clone.modified;
            }

            table.modified = clone;
        }

        return table;
    }

    /**
     * Applies partial modifications of column changes to the property
     * `modified` of the given table.
     *
     * *Note:* The `modified` property of the table gets replaced.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {Highcharts.DataTableColumnCollection} columns
     * Changed columns as a collection, where the keys are the column names.
     *
     * @param {number} [rowIndex=0]
     * Index of the first changed row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Table with `modified` property as a reference.
     */
    public modifyColumns<T extends DataTable>(
        table: T,
        columns: DataTable.ColumnCollection,
        rowIndex: number,
        eventDetail?: DataEvent.Detail
    ): T {
        const modifiers = (
            this.options.reverse ?
                this.chain.reverse() :
                this.chain.slice()
        );

        if (modifiers.length) {
            let clone = table.clone();

            for (let i = 0, iEnd = modifiers.length; i < iEnd; ++i) {
                modifiers[i].modifyColumns(
                    clone,
                    columns,
                    rowIndex,
                    eventDetail
                );
                clone = clone.modified;
            }

            table.modified = clone;
        }

        return table;
    }

    /**
     * Applies partial modifications of row changes to the property `modified`
     * of the given table.
     *
     * *Note:* The `modified` property of the table gets replaced.
     *
     * @param {Highcharts.DataTable} table
     * Modified table.
     *
     * @param {Array<(Highcharts.DataTableRow|Highcharts.DataTableRowObject)>} rows
     * Changed rows.
     *
     * @param {number} [rowIndex]
     * Index of the first changed row.
     *
     * @param {Highcharts.DataTableEventDetail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {Highcharts.DataTable}
     * Table with `modified` property as a reference.
     */
    public modifyRows<T extends DataTable>(
        table: T,
        rows: Array<(DataTable.Row|DataTable.RowObject)>,
        rowIndex: number,
        eventDetail?: DataEvent.Detail
    ): T {
        const modifiers = (
            this.options.reverse ?
                this.chain.reverse() :
                this.chain.slice()
        );

        if (modifiers.length) {
            let clone = table.clone();

            for (let i = 0, iEnd = modifiers.length; i < iEnd; ++i) {
                modifiers[i].modifyRows(
                    clone,
                    rows,
                    rowIndex,
                    eventDetail
                );
                clone = clone.modified;
            }

            table.modified = clone;
        }

        return table;
    }

    /**
     * Applies several modifications to the table.
     *
     * *Note:* The `modified` property of the table gets replaced.
     *
     * @param {DataTable} table
     * Table to modify.
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     *
     * @return {DataTable}
     * Table as a reference.
     *
     * @emits ChainDataModifier#execute
     * @emits ChainDataModifier#afterExecute
     */
    public modifyTable<T extends DataTable>(
        table: T,
        eventDetail?: DataEvent.Detail
    ): T {
        const chain = this;

        chain.emit<ChainModifier.Event>({
            type: 'modify',
            detail: eventDetail,
            table
        });

        const modifiers = (
            chain.options.reverse ?
                chain.chain.reverse() :
                chain.chain.slice()
        );

        let modified = table.modified;

        for (
            let i = 0,
                iEnd = modifiers.length,
                modifier: DataModifier;
            i < iEnd;
            ++i
        ) {
            modifier = modifiers[i];
            modified = modifier.modifyTable(modified, eventDetail).modified;
        }

        table.modified = modified;

        chain.emit<ChainModifier.Event>({
            type: 'afterModify',
            detail: eventDetail,
            table
        });

        return table;
    }

    /**
     * Removes a configured modifier from all positions in the modifier chain.
     *
     * @param {DataModifier} modifier
     * Configured modifier to remove.
     *
     * @param {DataEvent.Detail} [eventDetail]
     * Custom information for pending events.
     */
    public remove(
        modifier: DataModifier,
        eventDetail?: DataEvent.Detail
    ): void {
        const modifiers = this.chain;

        this.emit<ChainModifier.Event>({
            type: 'removeModifier',
            detail: eventDetail,
            modifier
        });

        modifiers.splice(modifiers.indexOf(modifier), 1);

        this.emit<ChainModifier.Event>({
            type: 'afterRemoveModifier',
            detail: eventDetail,
            modifier
        });
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

/**
 * Additionally provided types for modifier events and options.
 * @private
 */
namespace ChainModifier {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Event object
     */
    export interface ChainEvent extends DataEvent {
        readonly type: (
            'clearChain'|'afterClearChain'|
            DataModifierEvent['type']
        );
        readonly table?: DataTable;
    }

    /**
     * Event information.
     */
    export type Event = (ChainEvent|ModifierEvent);

    /**
     * Event information for modifier operations.
     */
    export interface ModifierEvent extends DataEvent {
        readonly type: (
            'addModifier'|'afterAddModifier'|
            'removeModifier'|'afterRemoveModifier'
        );
        readonly modifier: DataModifier;
    }

}

/* *
 *
 *  Registry
 *
 * */

declare module './DataModifierType' {
    interface DataModifierTypes {
        Chain: typeof ChainModifier;
    }
}

DataModifier.registerType('Chain', ChainModifier);

/* *
 *
 *  Default Export
 *
 * */

export default ChainModifier;
