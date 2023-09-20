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

import type DataCursor from '../../Data/DataCursor';
import type Sync from '../Components/Sync/Sync';
import type KPIComponent from '../Components/KPIComponent';

import U from '../Utilities.js';
const { defined } = U;


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
    },
    handlers: {
        extremesHandler:
            function (this: KPIComponent): Function | void {
                const { board } = this;

                const handleChangeExtremes = (e: DataCursor.Event): void => {
                    const cursor = e.cursor;
                    if (
                        cursor.type === 'position' &&
                        typeof cursor?.row === 'number' &&
                        defined(cursor.column) &&
                        this.connector &&
                        !defined(this.options.value)
                    ) {
                        const value =
                            this.connector.table.modified.getCellAsString(
                                cursor.column,
                                cursor.row
                            );
                        this.setValue(value);
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

                    cursor.addListener(
                        table.id,
                        'xAxis.extremes.max',
                        handleChangeExtremes
                    );
                };

                const unregisterCursorListeners = (): void => {
                    const table = this.connector && this.connector.table;
                    const { dataCursor: cursor } = board;

                    if (!table) {
                        return;
                    }

                    cursor.removeListener(
                        table.id,
                        'xAxis.extremes.max',
                        handleChangeExtremes
                    );
                };


                if (board) {
                    registerCursorListeners();

                    this.on('setConnector', (): void =>
                        unregisterCursorListeners()
                    );
                    this.on('afterSetConnector', (): void =>
                        registerCursorListeners()
                    );
                }
            }
    }
};

const defaults: Sync.OptionsRecord = {
    extremes: { handler: configs.handlers.extremesHandler }
};

export default defaults;
