/* *
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Karol Kolodziej
 *
 * */

/* eslint-disable require-jsdoc, max-len */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Sync from '../Components/Sync/Sync';

import ComponentType from '../Components/ComponentType';
import DataGridComponent from './DataGridComponent.js';
import U from '../Utilities.js';
import DataCursor from '../../Data/DataCursor';
const {
    addEvent
} = U;

/* *
 *
 *  Constants
 *
 * */

const configs: {
    handlers: Record<string, Sync.HandlerConfig>;
    emitters: Record<string, Sync.EmitterConfig>;
} = {
    emitters: {
        highlightEmitter: [
            'highlightEmitter',
            function (this: ComponentType): Function | void {
                if (this.type === 'DataGrid') {
                    const { dataGrid, board } = this as DataGridComponent;

                    if (board) {

                        const { dataCursor: cursor } = board;
                        const callbacks: Function[] = [];

                        if (!dataGrid) {
                            return;
                        }

                        callbacks.push(
                            addEvent(dataGrid.container, 'dataGridHover', (e: any): void => {
                                const table = this.connector && this.connector.table;
                                if (table) {
                                    const row = e.row;
                                    const cell = row.querySelector(`.highcharts-datagrid-cell[data-original-data="${row.dataset.rowXIndex}"]`);

                                    cursor.emitCursor(table, {
                                        type: 'position',
                                        row: parseInt(row.dataset.rowIndex, 10),
                                        column: cell ? cell.dataset.columnName : void 0,
                                        state: 'dataGrid.hoverRow'
                                    });
                                }
                            })
                        );

                        callbacks.push(
                            addEvent(dataGrid.container, 'mouseout', (): void => {
                                const table = this.connector && this.connector.table;
                                if (table) {
                                    cursor.emitCursor(table, {
                                        type: 'position',
                                        state: 'dataGrid.hoverOut'
                                    });
                                }
                            })
                        );

                        // Return a function that calls the callbacks
                        return function (): void {
                            callbacks.forEach((callback): void => callback());
                        };
                    }
                }
            }
        ]
    },
    handlers: {
        highlightHandler: [
            'highlightHandler',
            void 0, // 'afterHoverPointChange',
            function (this: DataGridComponent): void {
                const { board } = this;

                const handlCursor = (e: DataCursor.Event): void => {
                    const cursor = e.cursor;
                    if (cursor.type === 'position') {
                        const { row } = cursor;
                        const { dataGrid } = this;

                        if (row !== void 0 && dataGrid) {
                            const highlightedDataRow = dataGrid.container
                                .querySelector<HTMLElement>(`.highcharts-datagrid-row[data-row-index="${row}"]`);

                            if (highlightedDataRow) {
                                dataGrid.toggleRowHighlight(highlightedDataRow);
                                dataGrid.hoveredRow = highlightedDataRow;
                            }
                        }
                    }

                };

                const handleCursorOut = (): void => {
                    const { dataGrid } = this;
                    if (dataGrid) {
                        dataGrid.toggleRowHighlight(void 0);
                    }

                };

                const registerCursorListeners = (): void => {
                    const { dataCursor: cursor } = board;
                    if (!cursor) {
                        return;
                    }
                    const table = this.connector && this.connector.table;
                    if (!table) {
                        return;
                    }

                    cursor.addListener(table.id, 'point.mouseOver', handlCursor);
                    cursor.addListener(table.id, 'point.mouseOut', handleCursorOut);
                };

                const unregisterCursorListeners = (): void => {
                    const cursor = board.dataCursor;
                    const table = this.connector && this.connector.table;
                    if (!table) {
                        return;
                    }
                    cursor.addListener(table.id, 'point.mouseOver', handlCursor);
                    cursor.addListener(table.id, 'point.mouseOut', handleCursorOut);

                };

                if (board) {
                    registerCursorListeners();

                    this.on('setConnector', (): void => unregisterCursorListeners());
                    this.on('afterSetConnector', (): void => registerCursorListeners());
                }
            }
        ],
        extremesHandler: function (this: DataGridComponent): void {
            const { board } = this;

            const handleChangeExtremes = (e: DataCursor.Event): void => {
                const cursor = e.cursor;
                if (
                    cursor.type === 'position' &&
                    this.dataGrid &&
                    typeof cursor?.row === 'number'
                ) {
                    const { row } = cursor;
                    this.dataGrid.scrollToRow(row);
                }

            };

            const registerCursorListeners = (): void => {
                const { dataCursor: cursor } = board;

                if (!cursor) {
                    return;
                }
                const table = this.connector && this.connector.table;

                if (!table) {
                    return;
                }

                cursor.addListener(table.id, 'xAxis.extremes.min', handleChangeExtremes);
            };

            const unregisterCursorListeners = (): void => {
                const table = this.connector && this.connector.table;
                const { dataCursor: cursor } = board;

                if (!table) {
                    return;
                }

                cursor.removeListener(table.id, 'xAxis.extremes.min', handleChangeExtremes);
            };


            if (board) {
                registerCursorListeners();

                this.on('setConnector', (): void => unregisterCursorListeners());
                this.on('afterSetConnector', (): void => registerCursorListeners());
            }
        },
        visibilityHandler: function (this: DataGridComponent): void {
            const component = this,
                { board } = component;

            const handleVisibilityChange = (e: DataCursor.Event): void => {
                const cursor = e.cursor,
                    dataGrid = component.dataGrid;
                if (!(dataGrid && cursor.type === 'position' && cursor.column)) {
                    return;
                }

                const columnName = cursor.column;
                dataGrid.update({
                    columns: {
                        [columnName]: {
                            show: cursor.state !== 'series.hide'
                        }
                    }
                });
            };

            const registerCursorListeners = (): void => {
                const { dataCursor: cursor } = board;

                if (!cursor) {
                    return;
                }
                const table = this.connector && this.connector.table;

                if (!table) {
                    return;
                }

                cursor.addListener(table.id, 'series.show', handleVisibilityChange);
                cursor.addListener(table.id, 'series.hide', handleVisibilityChange);
            };

            const unregisterCursorListeners = (): void => {
                const table = this.connector && this.connector.table;
                const { dataCursor: cursor } = board;

                if (!table) {
                    return;
                }

                cursor.removeListener(table.id, 'series.show', handleVisibilityChange);
                cursor.removeListener(table.id, 'series.hide', handleVisibilityChange);
            };


            if (board) {
                registerCursorListeners();

                this.on('setConnector', (): void => unregisterCursorListeners());
                this.on('afterSetConnector', (): void => registerCursorListeners());
            }

        }
    }
};

const defaults: Sync.OptionsRecord = {
    highlight: { emitter: configs.emitters.highlightEmitter, handler: configs.handlers.highlightHandler },
    extremes: { handler: configs.handlers.extremesHandler },
    visibility: { handler: configs.handlers.visibilityHandler }
};


export default defaults;
