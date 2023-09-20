/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Gøran Slettemark
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

import Serializable from '../Serializable.js';
import U from '../Utilities.js';
const {
    addEvent,
    fireEvent,
    merge
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Contains presentation information like column order, usually in relation to a
 * table instance.
 */
class SharedComponentState
implements Serializable<SharedComponentState, SharedComponentState.JSON> {

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Sorted array of column names.
     */
    private columnOrder?: Array<string>;

    private columnVisibilityMap: Record<string, boolean> = {};

    private hiddenRowIndexes: number[] = [];

    private hoverPoint?: SharedComponentState.PresentationHoverPointType;

    private hoverRow?: HTMLElement;

    private selection: Record<string, { min?: number; max?: number }> = {};

    /**
     * Whether the state has been changed since initialization.
     */
    protected isModified?: boolean;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Emits an event on this table to all registered callbacks of the given
     * event.
     *
     * @param {DataPresentationState.Event} e
     * Event object with event information.
     */
    public emit(e: SharedComponentState.Event): void {
        fireEvent(this, e.type, e);
    }

    /**
     * Returns an ordered array of column names.
     *
     * @return {Array<string>}
     * Array of column names in order.
     */
    public getColumnOrder(): Array<string> {
        return (this.columnOrder || []).slice();
    }

    public getColumnVisibility(columnName: string): boolean | undefined {
        return this.columnVisibilityMap[columnName];
    }

    /**
     * Returns a function for `Array.sort` to change the order of an array of
     * column names. Unknown column names come last.
     *
     * @return {DataPresentationState.ColumnOrderCallback}
     * Sort function to change the order.
     */
    public getColumnSorter(): SharedComponentState.ColumnOrderCallback {
        const columnOrder = (this.columnOrder || []).slice();

        if (!columnOrder.length) {
            return (): number => 0;
        }

        return (a: string, b: string): number => {
            const aIndex = columnOrder.indexOf(a),
                bIndex = columnOrder.indexOf(b);

            if (aIndex > -1 && bIndex > -1) {
                return aIndex - bIndex;
            }

            if (bIndex > -1) {
                return 1;
            }

            if (aIndex > -1) {
                return -1;
            }

            return 0;
        };
    }

    /**
     * @return {boolean}
     * Returns true, if the state was changed since initialization.
     */
    public isSet(): boolean {
        return this.isModified === true;
    }

    /**
     * Registers a callback for a specific event.
     *
     * @param {string} type
     * Event type as a string.
     *
     * @param {DataEventEmitter.Callback} callback
     * Function to register for an event callback.
     *
     * @return {Function}
     * Function to unregister callback from the event.
     */
    public on(
        type: SharedComponentState.Event['type'],
        callback: (this: this, e: SharedComponentState.Event) => void
    ): Function {
        return addEvent(this, type, callback);
    }

    /**
     * Sets the order of the columns in place.
     *
     * @param {Array<string>} columnOrder
     * Array of column names in order.
     *
     * @param {DataEventEmitter.Detail} [eventDetail]
     * Custom information for pending events.
     */
    public setColumnOrder(
        columnOrder: Array<string>,
        eventDetail?: Globals.AnyRecord
    ): void {
        const presentationState = this,
            oldColumnOrder = (presentationState.columnOrder || []).slice(),
            newColumnOrder = columnOrder.slice();

        presentationState.emit({
            type: 'columnOrderChange',
            detail: eventDetail,
            newColumnOrder,
            oldColumnOrder
        });

        presentationState.columnOrder = newColumnOrder;
        presentationState.isModified = true;

        presentationState.emit({
            type: 'afterColumnOrderChange',
            detail: eventDetail,
            newColumnOrder,
            oldColumnOrder
        });
    }

    public setColumnVisibility(columnVisibility: Record<string, boolean>, eventDetail?: {}): void {
        this.columnVisibilityMap = merge(
            this.columnVisibilityMap,
            columnVisibility
        );
        this.emit({
            type: 'afterColumnVisibilityChange',
            visibilityMap: this.columnVisibilityMap,
            detail: eventDetail
        });
    }

    public setHiddenRows(rowIndexes: number[], hidden = true): void {
        rowIndexes.forEach((rowIndex): void => {
            if (this.hiddenRowIndexes.indexOf(rowIndex) === -1 && hidden) {
                this.hiddenRowIndexes.push(rowIndex);
            }
            if (this.hiddenRowIndexes.indexOf(rowIndex) > -1 && !hidden) {
                this.hiddenRowIndexes
                    .splice(this.hiddenRowIndexes.indexOf(rowIndex), 1);
            }
        });

        this.emit({
            type: 'afterSetHiddenRows',
            hiddenRows: this.hiddenRowIndexes
        });
    }

    public getHiddenRows(): number[] {
        return this.hiddenRowIndexes;
    }

    public setHoverPoint(
        point?: SharedComponentState.PresentationHoverPointType | HTMLElement,
        eventDetail?: SharedComponentState.HoverPointEventDetails
    ): void {
        const isDataGrid = eventDetail && eventDetail.isDataGrid;
        this.hoverPoint = isDataGrid ? void 0 : point;

        if (point instanceof HTMLElement) {
            this.hoverRow = isDataGrid ? point : void 0;
        }

        this.emit({
            type: 'afterHoverPointChange',
            hoverPoint: isDataGrid ? void 0 : this.hoverPoint,
            hoverRow: isDataGrid ? this.hoverRow : void 0,
            detail: eventDetail
        });
    }

    public getHoverPoint():
    (SharedComponentState.PresentationHoverPointType|undefined) {
        return this.hoverPoint;
    }

    public getSelection(): SharedComponentState.SelectionObjectType {
        return this.selection;
    }

    public setSelection(
        selection: SharedComponentState.SelectionObjectType,
        reset = false,
        eventDetail?: {}
    ): void {
        const axes = Object.keys(selection);

        axes.forEach((axisID): void => {
            this.selection[axisID] = selection[axisID];
        });

        this.emit({
            type: 'afterSelectionChange',
            selection: this.selection,
            reset,
            detail: eventDetail
        });
    }

    /**
     * Converts JSON to a presentation state.
     * @internal
     *
     * @param {DataPresentationState.ClassJSON} json
     * JSON (usually with a $class property) to convert.
     *
     * @return {DataPresentationState}
     * Class instance from the JSON.
     */
    public fromJSON(
        json: SharedComponentState.JSON
    ): SharedComponentState {
        const presentationState = new SharedComponentState();

        const { columnOrder, visibilityMap, selection, hoverpoint } = json;
        if (columnOrder) {
            presentationState.setColumnOrder(columnOrder);
        }
        if (visibilityMap) {
            presentationState.setColumnVisibility(visibilityMap);
        }
        if (selection) {
            presentationState.setSelection(selection);
        }
        if (hoverpoint) {
            presentationState.setHoverPoint(hoverpoint);
        }

        return presentationState;
    }

    /**
     * Converts the presentation state to JSON.
     * @internal
     *
     * @return {SharedComponentState.JSON}
     * JSON of this class instance.
     */
    public toJSON(): SharedComponentState.JSON {
        const json: SharedComponentState.JSON = {
            $class: 'Dashboards.SharedComponentState'
        };

        if (this.columnOrder) {
            json.columnOrder = this.columnOrder.slice();
        }
        if (this.hoverPoint) {
            const { x, y, id } = this.hoverPoint;
            json.hoverPoint = { x, y, id };
        }
        if (this.selection) {
            json.selection = this.selection;
        }
        if (this.columnVisibilityMap) {
            json.columnVisibility = this.columnVisibilityMap;
        }

        return json;
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

/**
 * Additionally provided types for events and JSON conversion.
 */
namespace SharedComponentState {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Event types related to the column order.
     */
    export type ColumnOrderEventType = (
        'columnOrderChange'|'afterColumnOrderChange'
    );

    export type ColumnVisibilityEventType = (
        'columnVisibilityChange' | 'afterColumnVisibilityChange'
    );

    export type HoverPointEventType = (
        'hoverPointChange' | 'afterHoverPointChange'
    );

    export type selectionEventType = (
        'selectionChange' | 'afterSelectionChange'
    );

    export type eventTypes = (
        selectionEventType | HoverPointEventType | ColumnVisibilityEventType
    );

    /**
     * Function to sort an array of column names.
     */
    export interface ColumnOrderCallback {
        (a: string, b: string): number;
    }

    export interface HoverPointEventDetails {
        detail?: Globals.AnyRecord;
        isDataGrid?: boolean;
        sender?: string
    }

    /**
     * All information objects of DataPrsentationState events.
     */
    export type Event = (
        ColumnOrderEvent | ColumnVisibilityEvent |
        PointHoverEvent | SelectionEvent | HiddenRowEvent
    );

    /**
     * Describes the information object for order-related events.
     */
    export interface ColumnOrderEvent {
        type: ColumnOrderEventType;
        detail?: Globals.AnyRecord,
        newColumnOrder: Array<string>;
        oldColumnOrder: Array<string>;
    }
    export interface ColumnVisibilityEvent {
        type: ColumnVisibilityEventType;
        detail?: Globals.AnyRecord,
        visibilityMap: Record<string, boolean>;
    }
    export interface HiddenRowEvent {
        type: ('afterSetHiddenRows');
        detail?: Globals.AnyRecord,
        hiddenRows: number[];
    }

    export interface PointHoverEvent {
        type: HoverPointEventType;
        detail?: Globals.AnyRecord,
        hoverPoint?: PresentationHoverPointType;
        hoverRow?: HTMLElement;
    }

    export type ColumnVisibilityType = Record<string, boolean>;

    export type SelectionObjectType = Record<string, { columnName?: string; min?: number; max?: number }>;

    export type PresentationHoverPointType = Partial<Globals.AnyRecord>;

    export interface SelectionEvent {
        type: selectionEventType;
        detail?: Globals.AnyRecord,
        reset: boolean;
        selection: Record<string, {min?: number | undefined; max?: number | undefined}>;
    }

    /**
     * Describes the class JSON of a presentation state.
     */
    export interface JSON extends Serializable.JSON<'Dashboards.SharedComponentState'> {
        columnOrder?: Array<string>;
        visibilityMap?: ColumnVisibilityType;
        hoverpoint?: { x: number; y: number; id: string };
        selection?: SelectionObjectType;
    }

}

/* *
 *
 *  Registry
 *
 * */

Serializable.registerClassPrototype(
    'Dashboards.SharedComponentState',
    SharedComponentState.prototype
);

/* *
 *
 *  Default Export
 *
 * */

export default SharedComponentState;
