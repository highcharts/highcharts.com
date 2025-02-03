/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *
 * */

'use strict';


/* *
 *
 *  Imports
 *
 * */

import type { Axis } from '../../../Plugins/HighchartsTypes';
import type Sync from '../../Sync/Sync';

import Component from '../../Component';
import DataCursor from '../../../../Data/DataCursor';
import DataModifier from '../../../../Data/Modifiers/DataModifier.js';
import NavigatorComponent from '../NavigatorComponent.js';
import NavigatorSyncUtils from './NavigatorSyncUtils.js';
import U from '../../../../Core/Utilities.js';

const { Range: RangeModifier } = DataModifier.types;
const { addEvent, pick, defined } = U;


/* *
 *
 *  Constants
 *
 * */

const defaultOptions: Sync.OptionsEntry = {};

const syncPair: Sync.SyncPair = {
    emitter: function (this: Component): Function | void {
        if (this.type !== 'Navigator') {
            return;
        }
        const component = this as NavigatorComponent;
        const syncOptions = this.sync.syncConfig.extremes;
        const groupKey = syncOptions.group ? ':' + syncOptions.group : '';

        const afterSetExtremes = (
            extremes: Axis.ExtremesObject
        ): void => {
            if (component.connectorHandlers?.[0]?.connector) {
                const table = component.connectorHandlers[0].connector.table,
                    dataCursor = component.board.dataCursor,
                    filterColumn = component.getColumnAssignment()[0],
                    [min, max] = component.getAxisExtremes();

                dataCursor.emitCursor(
                    table,
                    {
                        type: 'position',
                        column: filterColumn,
                        row: table.getRowIndexBy(filterColumn, min),
                        state: 'xAxis.extremes.min' + groupKey
                    },
                    extremes as unknown as Event
                );

                dataCursor.emitCursor(
                    table,
                    {
                        type: 'position',
                        column: filterColumn,
                        row: table.getRowIndexBy(filterColumn, max),
                        state: 'xAxis.extremes.max' + groupKey
                    },
                    extremes as unknown as Event
                );
            }
        };

        let delay: number;

        return addEvent(
            component.chart.xAxis[0],
            'afterSetExtremes',
            function (extremes: Axis.ExtremesObject): void {
                clearTimeout(delay);
                delay = setTimeout(afterSetExtremes, 50, this, extremes);
            }
        );
    },
    handler: function (this: Component): (() => void) | void {
        if (this.type !== 'Navigator') {
            return;
        }
        const component = this as NavigatorComponent;
        const syncOptions = this.sync.syncConfig.extremes;
        const groupKey = syncOptions.group ? ':' + syncOptions.group : '';

        const dataCursor = component.board.dataCursor;

        const extremesListener = (e: DataCursor.Event): void => {
            const cursor = e.cursor;

            if (!component.connectorHandlers?.[0]?.connector) {
                return;
            }

            const table = component.connectorHandlers[0].connector.table;

            // Assume first column with unique keys as fallback
            let extremesColumn = table.getColumnNames()[0],
                maxIndex = table.getRowCount(),
                minIndex = 0;

            if (cursor.type === 'range') {
                maxIndex = cursor.lastRow;
                minIndex = cursor.firstRow;

                if (cursor.columns) {
                    extremesColumn = pick(cursor.columns[0], extremesColumn);
                }
            } else if (cursor.state === 'xAxis.extremes.max' + groupKey) {
                extremesColumn = pick(cursor.column, extremesColumn);
                maxIndex = pick(cursor.row, maxIndex);
            } else {
                extremesColumn = pick(cursor.column, extremesColumn);
                minIndex = pick(cursor.row, minIndex);
            }

            const modifier = table.getModifier();

            if (
                typeof extremesColumn === 'string' &&
                modifier instanceof RangeModifier
            ) {
                const ranges = modifier.options.ranges,
                    min = table.getCell(extremesColumn, minIndex),
                    max = table.getCell(extremesColumn, maxIndex);

                if (
                    defined(max) && !Array.isArray(max) &&
                    defined(min) && !Array.isArray(min)
                ) {
                    NavigatorSyncUtils.unsetRangeOptions(
                        ranges, extremesColumn
                    );

                    ranges.unshift({
                        column: extremesColumn,
                        maxValue: max,
                        minValue: min
                    });
                    table.setModifier(modifier);
                }
            }
        };

        const registerCursorListeners = (): void => {
            const table = component.connectorHandlers?.[0]?.connector?.table;

            if (table) {
                dataCursor.addListener(
                    table.id,
                    'xAxis.extremes' + groupKey,
                    extremesListener
                );
                dataCursor.addListener(
                    table.id,
                    'xAxis.extremes.max' + groupKey,
                    extremesListener
                );
                dataCursor.addListener(
                    table.id,
                    'xAxis.extremes.min' + groupKey,
                    extremesListener
                );
            }
        };

        const unregisterCursorListeners = (): void => {
            const table = component.connectorHandlers?.[0]?.connector?.table;

            if (table) {
                dataCursor.removeListener(
                    table.id,
                    'xAxis.extremes' + groupKey,
                    extremesListener
                );
                dataCursor.removeListener(
                    table.id,
                    'xAxis.extremes.max' + groupKey,
                    extremesListener
                );
                dataCursor.removeListener(
                    table.id,
                    'xAxis.extremes.min' + groupKey,
                    extremesListener
                );
            }
        };

        registerCursorListeners();
        return unregisterCursorListeners;
    }
};


/* *
*
*  Default export
*
* */
export default { defaultOptions, syncPair };
