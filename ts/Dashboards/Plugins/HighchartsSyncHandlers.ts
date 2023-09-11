/* *
 *
 *  (c) 2009-2023 Highsoft AS
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

/* eslint-disable require-jsdoc, max-len */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    Axis,
    Series
} from './HighchartsTypes';
import type DataCursor from '../../Data/DataCursor';
import type Sync from '../Components/Sync/Sync';
import type { RangeModifierOptions, RangeModifierRangeOptions } from '../../Data/Modifiers/RangeModifierOptions';
import type DataTable from '../../Data/DataTable';

import ComponentType from '../Components/ComponentType';
import HighchartsComponent from './HighchartsComponent';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
const { addEvent } = EH;


/**
 * Utility function that returns the first row index
 * if the table has been modified by a range modifier
 *
 * @param {DataTable} table
 * The table to get the offset from.
     *
 * @param {RangeModifierOptions} modifierOptions
 * The modifier options to use
 *
 * @return {number}
 * The row offset of the modified table.
 */
function getModifiedTableOffset(
    table: DataTable,
    modifierOptions: RangeModifierOptions
): number {
    const { ranges } = modifierOptions;

    if (ranges) {
        const minRange = ranges.reduce(
            (minRange, currentRange): RangeModifierRangeOptions => {
                if (currentRange.minValue > minRange.minValue) {
                    minRange = currentRange;
                }
                return minRange;

            }, ranges[0]
        );

        const tableRowIndex = table.getRowIndexBy(
            minRange.column,
            minRange.minValue
        );

        if (tableRowIndex) {
            return tableRowIndex;
        }
    }

    return 0;
}

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
                if (this.type === 'Highcharts') {
                    const { chart, board } = this as HighchartsComponent;

                    if (board) {
                        const { dataCursor: cursor } = board;

                        this.on('afterRender', (): void => {
                            const table = this.connector && this.connector.table;
                            if (chart && chart.series && table) {
                                chart.series.forEach((series): void => {
                                    series.update({
                                        point: {
                                            events: {
                                                // Emit table cursor
                                                mouseOver: function (): void {
                                                    let offset = 0;
                                                    const modifier = table.getModifier();
                                                    if (modifier && modifier.options.type === 'Range') {
                                                        offset = getModifiedTableOffset(
                                                            table,
                                                            modifier.options as RangeModifierOptions
                                                        );
                                                    }
                                                    cursor.emitCursor(table, {
                                                        type: 'position',
                                                        row: offset + this.index,
                                                        column: series.name,
                                                        state: 'point.mouseOver'
                                                    });
                                                },
                                                mouseOut: function (): void {
                                                    let offset = 0;
                                                    const modifier = table.getModifier();
                                                    if (modifier && modifier.options.type === 'Range') {
                                                        offset = getModifiedTableOffset(
                                                            table,
                                                            modifier.options as RangeModifierOptions
                                                        );
                                                    }
                                                    cursor.emitCursor(table, {
                                                        type: 'position',
                                                        row: offset + this.index,
                                                        column: series.name,
                                                        state: 'point.mouseOut'
                                                    });
                                                }
                                            }
                                        }
                                    });
                                });
                            }
                        });


                        // Return function that handles cleanup
                        return function (): void {
                            if (chart && chart.series) {
                                chart.series.forEach((series): void => {
                                    series.update({
                                        point: {
                                            events: {
                                                mouseOver: void 0,
                                                mouseOut: void 0
                                            }
                                        }
                                    });
                                });

                            }
                        };
                    }
                }
            }
        ],
        seriesVisibilityEmitter:
            function (this: ComponentType): Function | void {
                if (this.type === 'Highcharts') {
                    const component = this as HighchartsComponent;
                    return this.on('afterRender', (): void => {
                        const { chart, connector, board } = component;
                        const table = connector && connector.table;
                        if (
                            table && // Has a connector
                            board &&
                            chart
                        ) {
                            const { dataCursor: cursor } = board;
                            const { series } = chart;

                            series.forEach((series): void => {
                                series.update({
                                    events: {
                                        show: function (): void {
                                            cursor.emitCursor(
                                                table,
                                                {
                                                    type: 'position',
                                                    state: 'series.show',
                                                    column: this.name
                                                }
                                            );
                                        },
                                        hide: function (): void {
                                            cursor.emitCursor(
                                                table,
                                                {
                                                    type: 'position',
                                                    state: 'series.hide',
                                                    column: this.name
                                                }
                                            );
                                        }
                                    }
                                });
                            });
                        }
                    });
                }
            },
        extremesEmitter:
            function (this: ComponentType): Function | void {
                if (this.type === 'Highcharts') {
                    const component = this as HighchartsComponent;
                    const callbacks: Function[] = [];

                    this.on('afterRender', (): void => {
                        const { chart, connector, board } = component;
                        const table = connector && connector.table;

                        const { dataCursor: cursor } = board;

                        if (table && chart) {
                            const extremesEventHandler = (e: any): void => {
                                const reset = !!(e as any).resetSelection;
                                if ((!e.trigger || (e.trigger && e.trigger !== 'dashboards-sync')) && !reset) {
                                    // TODO: investigate this type?
                                    const axis = e.target as unknown as Axis;

                                    // Prefer a series that's in a related table,
                                    // but allow for other data
                                    const seriesInTable = axis.series
                                        .filter((series): boolean =>
                                            table.hasColumns([series.name]));

                                    const [series] = seriesInTable.length ?
                                        seriesInTable :
                                        axis.series;

                                    if (series) {
                                        // Get the indexes of the first and last drawn points
                                        const visiblePoints = series.points
                                            .filter((point): boolean => point.isInside || false);

                                        const minCursorData: DataCursor.Type = {
                                            type: 'position',
                                            state: `${axis.coll}.extremes.min`
                                        };

                                        const maxCursorData: DataCursor.Type = {
                                            type: 'position',
                                            state: `${axis.coll}.extremes.max`
                                        };

                                        if (seriesInTable.length && axis.coll === 'xAxis' && visiblePoints.length) {
                                            const columnName = axis.dateTime && table.hasColumns(['x']) ?
                                                'x' :
                                                series.name;

                                            minCursorData.row = visiblePoints[0].index;
                                            minCursorData.column = columnName;

                                            maxCursorData.row = visiblePoints[visiblePoints.length - 1].index;
                                            maxCursorData.column = columnName;
                                        }

                                        // Emit as lasting cursors
                                        cursor.emitCursor(table,
                                            minCursorData,
                                            e as any,
                                            true
                                        ).emitCursor(table,
                                            maxCursorData,
                                            e as any,
                                            true
                                        );
                                    }

                                }

                            };


                            const addExtremesEvent = (): Function[] =>
                                chart.axes.map((axis): Function =>
                                    addEvent(
                                        axis,
                                        'afterSetExtremes',
                                        extremesEventHandler
                                    ));

                            let addExtremesEventCallbacks: Function[] =
                                addExtremesEvent();

                            const resetExtremesEvent = (): void => {
                                addExtremesEventCallbacks.forEach((callback): void => {
                                    callback();
                                });
                                addExtremesEventCallbacks = [];
                            };


                            const handleChartResetSelection = (e: any): void => {
                                if ((e as any).resetSelection) {
                                    resetExtremesEvent();

                                    cursor.emitCursor(
                                        table,
                                        {
                                            type: 'position',
                                            state: 'chart.zoomOut'
                                        },
                                        e
                                    );

                                    addExtremesEventCallbacks.push(...addExtremesEvent());
                                }


                            };

                            callbacks.push(addEvent(chart, 'selection', handleChartResetSelection));


                            callbacks.push((): void => {
                                cursor.remitCursor(table.id, {
                                    type: 'position',
                                    state: 'xAxis.extremes.min'
                                });
                                cursor.remitCursor(table.id, {
                                    type: 'position',
                                    state: 'xAxis.extremes.max'
                                });

                                resetExtremesEvent();
                            });
                        }
                    });

                    // Return cleanup
                    return function (): void {
                        // Call back the cleanup callbacks
                        callbacks.forEach((callback): void => callback());

                    };
                }
            }
    },
    handlers: {
        seriesVisibilityHandler:
            function (this: HighchartsComponent): void {
                const component = this;
                const { board } = this;

                const findSeries = (seriesArray: Series[], name: string): Series | undefined => {
                    for (const series of seriesArray) {
                        if (series.name === name) {
                            return series;
                        }
                    }
                };

                const handleShow = (e: DataCursor.Event): void => {
                    const chart = component.chart;
                    if (!chart) {
                        return;
                    }
                    if (e.cursor.type === 'position' && e.cursor.column !== void 0) {
                        const series = findSeries(chart.series, e.cursor.column);
                        if (series) {
                            series.setVisible(true, true);
                        }
                    }
                };

                const handleHide = (e: DataCursor.Event): void => {
                    const chart = component.chart;
                    if (!chart) {
                        return;
                    }
                    if (e.cursor.type === 'position' && e.cursor.column !== void 0) {
                        const series = findSeries(chart.series, e.cursor.column);
                        if (series) {
                            series.setVisible(false, true);
                        }
                    }
                };

                const registerCursorListeners = (): void => {
                    const { dataCursor } = board;

                    if (!dataCursor) {
                        return;
                    }
                    const table = this.connector && this.connector.table;

                    if (!table) {
                        return;
                    }
                    dataCursor.addListener(table.id, 'series.show', handleShow);
                    dataCursor.addListener(table.id, 'series.hide', handleHide);
                };

                const unregisterCursorListeners = (): void => {
                    const table = this.connector && this.connector.table;
                    if (table) {
                        board.dataCursor.removeListener(table.id, 'series.show', handleShow);
                        board.dataCursor.removeListener(table.id, 'series.hide', handleHide);
                    }
                };

                if (board) {
                    registerCursorListeners();

                    this.on('setConnector', (): void => unregisterCursorListeners());
                    this.on('afterSetConnector', (): void => registerCursorListeners());
                }
            },
        highlightHandler:
            function (this: HighchartsComponent): void {
                const { chart, board } = this;

                const handleCursor = (e: DataCursor.Event): void => {
                    const table = this.connector && this.connector.table;

                    if (!table) {
                        return;
                    }

                    let offset = 0;

                    const modifier = table.getModifier();

                    if (modifier && modifier.options.type === 'Range') {
                        offset = getModifiedTableOffset(table, modifier.options as RangeModifierOptions);
                    }

                    if (chart && chart.series.length) {
                        const cursor = e.cursor;
                        if (cursor.type === 'position') {
                            const [series] = chart.series.length > 1 && cursor.column ?
                                chart.series.filter((series): boolean => series.name === cursor.column) :
                                chart.series;


                            if (series && series.visible && cursor.row !== void 0) {
                                const point = series.points[cursor.row - offset];

                                if (point) {
                                    chart.tooltip && chart.tooltip.refresh(point);
                                }
                            }
                        }
                    }
                };

                const handleCursorOut = (): void => {
                    if (chart && chart.series.length) {
                        chart.tooltip && chart.tooltip.hide();
                    }
                };

                const registerCursorListeners = (): void => {
                    const { dataCursor: cursor } = board;

                    // @todo wrap in a listener on component.update with
                    // connector change
                    if (cursor) {
                        const table = this.connector && this.connector.table;

                        if (table) {
                            cursor.addListener(table.id, 'point.mouseOver', handleCursor);
                            cursor.addListener(table.id, 'dataGrid.hoverRow', handleCursor);
                            cursor.addListener(table.id, 'point.mouseOut', handleCursorOut);
                            cursor.addListener(table.id, 'dataGrid.hoverOut', handleCursorOut);
                        }
                    }
                };

                const unregisterCursorListeners = (): void => {
                    const table = this.connector && this.connector.table;

                    if (table) {
                        board.dataCursor.removeListener(table.id, 'point.mouseOver', handleCursor);
                        board.dataCursor.removeListener(table.id, 'dataGrid.hoverRow', handleCursor);
                        board.dataCursor.removeListener(table.id, 'point.mouseOut', handleCursorOut);
                        board.dataCursor.removeListener(table.id, 'dataGrid.hoverOut', handleCursorOut);
                    }
                };

                if (board) {
                    registerCursorListeners();

                    this.on('setConnector', (): void => unregisterCursorListeners());
                    this.on('afterSetConnector', (): void => registerCursorListeners());
                }
            },
        extremesHandler:
            function (this: HighchartsComponent): Function | void {

                const { chart, board } = this;

                if (chart && board) {
                    ['xAxis', 'yAxis'].forEach((dimension): void => {
                        const callbacks: Function[] = [];
                        const handleUpdateExtremes = (e: DataCursor.Event): void => {
                            const { cursor, event } = e;

                            if (cursor.type === 'position') {
                                const eventTarget = event && event.target as unknown as Axis;
                                if (eventTarget && chart) {
                                    const axes = (chart as any)[dimension] as unknown as Axis[];
                                    let didZoom = false;

                                    axes.forEach((axis): void => {
                                        if (
                                            eventTarget.coll === axis.coll &&
                                            eventTarget !== axis
                                        ) {
                                            if (eventTarget.min !== null && eventTarget.max !== null) {
                                                if (
                                                    axis.max !== eventTarget.max &&
                                                    axis.min !== eventTarget.min
                                                ) {
                                                    axis
                                                        .setExtremes(
                                                            eventTarget.min,
                                                            eventTarget.max,
                                                            false,
                                                            void 0,
                                                            {
                                                                trigger: 'dashboards-sync'
                                                            }
                                                        );

                                                    didZoom = true;

                                                }
                                            }
                                        }

                                    });

                                    if (didZoom && !chart.resetZoomButton) {
                                        chart.showResetZoom();
                                    }

                                    chart.redraw();
                                }
                            }
                        };

                        const addCursorListeners = (): void => {
                            const { dataCursor: cursor } = board;
                            const { connector } = this;

                            if (connector) {
                                const { table } = connector;
                                cursor.addListener(table.id, `${dimension}.extremes.min`, handleUpdateExtremes);
                                cursor.addListener(table.id, `${dimension}.extremes.max`, handleUpdateExtremes);

                                const handleChartZoomOut = (): void => {
                                    chart.zoomOut();

                                    setTimeout((): void => {
                                        // Workaround for zoom button not being removed
                                        const resetZoomButtons = this.element
                                            .querySelectorAll<SVGElement>('.highcharts-reset-zoom');

                                        resetZoomButtons.forEach((button): void => {
                                            button.remove();
                                        });

                                    });


                                };

                                cursor.addListener(table.id, 'chart.zoomOut', handleChartZoomOut);

                                callbacks.push(
                                    (): void => {
                                        cursor.removeListener(table.id, `${dimension}.extremes.min`, handleUpdateExtremes);
                                        cursor.removeListener(table.id, `${dimension}.extremes.max`, handleUpdateExtremes);
                                        cursor.removeListener(table.id, 'chart.zoomOut', handleChartZoomOut);
                                    }
                                );
                            }
                        };

                        const unregisterCursorListeners = (): void => {
                            callbacks.forEach((callback): void => callback());
                        };

                        if (board) {
                            addCursorListeners();

                            this.on('setConnector', (): void => unregisterCursorListeners());
                            this.on('afterSetConnector', (): void => addCursorListeners());
                        }
                    });

                }


            }
    }
};

const defaults: Sync.OptionsRecord = {
    extremes: { emitter: configs.emitters.extremesEmitter, handler: configs.handlers.extremesHandler },
    highlight: { emitter: configs.emitters.highlightEmitter, handler: configs.handlers.highlightHandler },
    visibility: { emitter: configs.emitters.seriesVisibilityEmitter, handler: configs.handlers.seriesVisibilityHandler }
};

export default defaults;
