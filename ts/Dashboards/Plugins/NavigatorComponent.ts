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


import type {
    Axis,
    Chart,
    Highcharts as H,
    Options as HighchartsOptions
} from './HighchartsTypes';
import type Cell from '../Layout/Cell';
import type DataCursor from '../../Data/DataCursor';
import type { NavigatorComponentOptions } from './NavigatorComponentOptions';
import type { RangeModifierRangeOptions } from '../../Data/Modifiers/RangeModifierOptions';
import type Sync from '../Components/Sync/Sync';

import Component from '../Components/Component.js';
import DataModifier from '../../Data/Modifiers/DataModifier.js';
const { Range: RangeModifier } = DataModifier.types;
import Globals from '../Globals.js';
import NavigatorComponentDefaults from './NavigatorComponentDefaults.js';
import U from '../../Shared/Utilities.js';
import EventHelper from '../../Shared/Helpers/EventHelper.js';
import ObjectHelper from '../../Shared/Helpers/ObjectHelper.js';
import TypeChecker from '../../Shared/Helpers/TypeChecker.js';
const {
    diffObjects,
    merge
} = ObjectHelper;
const {
    isNumber
} = TypeChecker;
const {
    addEvent
} = EventHelper;
const {
    pick
} = U;


/* *
 *
 *  Constants
 *
 * */


const navigatorComponentSync = {
    crossfilter: {
        emitter: crossfilterEmitter
    },
    extremes: {
        emitter: extremesEmitter,
        handler: extremesReceiver
    }
};


/* *
 *
 *  Functions
 *
 * */


/** @internal */
function crossfilterEmitter(
    this: Component
): (Function|undefined) {
    const component = this as NavigatorComponent;

    const afterSetExtremes = async (
        axis: Axis,
        extremes: Axis.ExtremesObject
    ): Promise<void> => {
        if (component.connector) {
            const table = component.connector.table,
                dataCursor = component.board.dataCursor,
                filterColumn = component.getColumnAssignment()[0],
                [min, max] = getAxisExtremes(axis, extremes);

            let modifier = table.getModifier();

            if (modifier instanceof RangeModifier) {
                setRangeOptions(
                    modifier.options.ranges,
                    filterColumn,
                    min,
                    max
                );
            } else {
                modifier = new RangeModifier({
                    ranges: [{
                        column: filterColumn,
                        maxValue: max,
                        minValue: min
                    }]
                });
            }

            await table.setModifier(modifier);

            dataCursor.emitCursor(
                table,
                {
                    type: 'range',
                    columns: [filterColumn],
                    firstRow: 0,
                    lastRow: table.getRowCount() - 1,
                    state: 'crossfilter'
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
}


/** @internal */
function extremesEmitter(
    this: Component
): (Function|undefined) {
    const component = this as NavigatorComponent;

    const afterSetExtremes = (
        axis: Axis,
        extremes: Axis.ExtremesObject
    ): void => {
        if (component.connector) {
            const table = component.connector.table,
                dataCursor = component.board.dataCursor,
                filterColumn = component.getColumnAssignment()[0],
                [min, max] = getAxisExtremes(axis, extremes);

            dataCursor.emitCursor(
                table,
                {
                    type: 'position',
                    column: filterColumn,
                    row: table.getRowIndexBy(filterColumn, min),
                    state: 'xAxis.extremes.min'
                },
                extremes as unknown as Event
            );

            dataCursor.emitCursor(
                table,
                {
                    type: 'position',
                    column: filterColumn,
                    row: table.getRowIndexBy(filterColumn, max),
                    state: 'xAxis.extremes.max'
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
}


/** @internal */
function extremesReceiver(
    this: Component
): void {
    const component = this as NavigatorComponent,
        dataCursor = component.board.dataCursor;

    const extremesListener = (e: DataCursor.Event): void => {
        const cursor = e.cursor;

        if (!component.connector) {
            return;
        }

        const table = component.connector.table;

        // assume first column with unique keys as fallback
        let extremesColumn = table.getColumnNames()[0],
            maxIndex = table.getRowCount(),
            minIndex = 0;

        if (cursor.type === 'range') {
            maxIndex = cursor.lastRow;
            minIndex = cursor.firstRow;

            if (cursor.columns) {
                extremesColumn = pick(cursor.columns[0], extremesColumn);
            }
        } else if (cursor.state === 'xAxis.extremes.max') {
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
                max !== null && typeof max !== 'undefined' &&
                min !== null && typeof min !== 'undefined'
            ) {
                unsetRangeOptions(ranges, extremesColumn);
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
        const table = component.connector && component.connector.table;

        if (table) {
            dataCursor.addListener(
                table.id,
                'xAxis.extremes',
                extremesListener
            );
            dataCursor.addListener(
                table.id,
                'xAxis.extremes.max',
                extremesListener
            );
            dataCursor.addListener(
                table.id,
                'xAxis.extremes.min',
                extremesListener
            );
        }
    };

    const unregisterCursorListeners = (): void => {
        const table = component.connector && component.connector.table;

        if (table) {
            dataCursor.removeListener(
                table.id,
                'xAxis.extremes',
                extremesListener
            );
            dataCursor.removeListener(
                table.id,
                'xAxis.extremes.max',
                extremesListener
            );
            dataCursor.removeListener(
                table.id,
                'xAxis.extremes.min',
                extremesListener
            );
        }
    };

    registerCursorListeners();

    component.on('setConnector', (): void => unregisterCursorListeners());
    component.on('afterSetConnector', (): void => registerCursorListeners());
}


/** @internal */
function getAxisExtremes(
    axis: Axis,
    extremes: Axis.ExtremesObject
): ([number, number]|[string, string]) {
    let max: (number|string) = (
            typeof extremes.max === 'number' ?
                extremes.max :
                extremes.dataMax
        ),
        min: (number|string) = (
            typeof extremes.min === 'number' ?
                extremes.min :
                extremes.dataMin
        );

    if (axis.hasNames) {
        return [
            axis.names[Math.round(min)],
            axis.names[Math.round(max)]
        ];
    }

    return [min, max];
}


/** @internal */
function setRangeOptions(
    ranges: Array<RangeModifierRangeOptions>,
    column: string,
    minValue: (boolean|number|string),
    maxValue: (boolean|number|string)
): void {
    let changed = false;

    for (let i = 0, iEnd = ranges.length; i < iEnd; ++i) {
        if (ranges[i].column === column) {
            ranges[i].maxValue = maxValue;
            ranges[i].minValue = minValue;
            changed = true;
            break;
        }
    }

    if (!changed) {
        ranges.push({ column, maxValue, minValue });
    }
}


/** @internal */
function unsetRangeOptions(
    ranges: Array<RangeModifierRangeOptions>,
    column: string
): (RangeModifierRangeOptions|undefined) {
    for (let i = 0, iEnd = ranges.length; i < iEnd; ++i) {
        if (ranges[i].column === column) {
            return ranges.splice(i, 1)[0];
        }
    }
}


/* *
 *
 *  Class
 *
 * */


/**
 * Setup a component with data navigation.
 */
class NavigatorComponent extends Component {


    /* *
     *
     *  Static Properties
     *
     * */


    /** @private */
    public static charter: H;


    /**
     * Default options of the Navigator component.
     */
    public static defaultOptions: Partial<NavigatorComponentOptions> = merge(
        Component.defaultOptions,
        NavigatorComponentDefaults as Partial<NavigatorComponentOptions>
    );


    /* *
     *
     *  Static Functions
     *
     * */


    /**
     * Creates component from JSON.
     *
     * @param json
     * Set of component options, used for creating the Highcharts component.
     *
     * @returns
     * Highcharts component based on config from JSON.
     *
     * @private
     */
    public static fromJSON(
        json: Component.JSON,
        cell: Cell
    ): NavigatorComponent {
        const options = json.options,
            component = new NavigatorComponent(
                cell,
                options as unknown as NavigatorComponentOptions
            );

        component.emit({
            type: 'fromJSON',
            json
        });

        return component;
    }


    /* *
     *
     *  Constructor
     *
     * */


    public constructor(
        cell: Cell,
        options: NavigatorComponentOptions
    ) {
        super(cell, options);

        this.options = merge(NavigatorComponent.defaultOptions, options);

        const charter = (
            NavigatorComponent.charter ||
            Globals.win.Highcharts as H
        );

        this.chartContainer = Globals.win.document.createElement('div');
        this.chart = charter
            .chart(this.chartContainer, (this.options.chartOptions || {}));
        this.chartContainer.classList
            .add(Globals.classNamePrefix + 'navigator');

        this.filterAndAssignSyncOptions(navigatorComponentSync);
        this.sync = new NavigatorComponent.Sync(this, this.syncHandlers);

        if (this.options.sync.crossfilter) {
            this.chart.update(
                { navigator: { xAxis: { labels: { format: '{value}' } } } },
                false
            );
        }
    }


    /* *
     *
     *  Properties
     *
     * */


    /**
     * Reference to the navigator chart.
     */
    public chart: Chart;


    /**
     * HTML element where the navigator is created.
     */
    public chartContainer: HTMLElement;


    /**
     * Options for the navigator component
     */
    public options: NavigatorComponentOptions;


    /**
     * Reference to the sync system that allow to sync i.e tooltips.
     * @private
     */
    public sync: Sync;


    /* *
     *
     *  Functions
     *
     * */


    /** @private */
    private adjustNavigator(): void {
        const chart = this.chart,
            height = pick(
                chart.chartHeight,
                this.contentElement.clientHeight
            ),
            width = this.contentElement.clientWidth,
            chartUpdates: Globals.DeepPartial<HighchartsOptions> = {};

        if (
            chart.chartHeight !== height ||
            chart.chartWidth !== width
        ) {
            chartUpdates.chart = {
                height,
                width
            };
        }

        if (chart.navigator) {
            const navigator = chart.navigator,
                navigatorHeight =
                    (navigator.top - chart.plotTop + navigator.height);

            if (navigator.height !== navigatorHeight) {
                chartUpdates.navigator = {
                    handles: {
                        height: Math.round(height / 4)
                    },
                    height: navigatorHeight
                };
            }

            if (Object.keys(chartUpdates).length) {
                chart.update(chartUpdates as Partial<HighchartsOptions>, false);
            }

            if (navigator.series && navigator.series[0]) {
                navigator.series[0].update({
                    type: chart.series[0].type
                }, false);
            }
        } else if (Object.keys(chartUpdates).length) {
            chart.update(chartUpdates as Partial<HighchartsOptions>, false);
        }
    }


    /**
     * Returns the first column of columnAssignments to use for navigator data.
     * @private
     *
     * @return
     * Navigator column assignment.
     */
    public getColumnAssignment(): [string, string] {
        const columnAssignments = (this.options.columnAssignments || {});

        let columnsAssignment: (string|null);

        for (const column of Object.keys(columnAssignments)) {
            columnsAssignment = columnAssignments[column];

            if (columnsAssignment !== null) {
                return [column, columnsAssignment];
            }
        }

        if (this.connector) {
            const columns = this.connector.table.getColumnNames();

            if (columns.length) {
                return [columns[0], 'y'];
            }
        }

        return ['', 'y'];
    }


    /**
     * Gets the component's options.
     * @internal
     */
    public getOptions(): Partial<NavigatorComponentOptions> {
        return {
            ...diffObjects(this.options, NavigatorComponentDefaults),
            type: 'Navigator'
        };
    }


    /** @private */
    public async load(): Promise<this> {
        await super.load();

        this.contentElement.appendChild(this.chartContainer);
        this.parentElement.appendChild(this.element);

        this.adjustNavigator();

        this.emit({ type: 'afterLoad' });

        return this;
    }


    public onTableChanged(): void {
        this.renderNavigator();
    }


    /** @private */
    private redrawNavigator(): void {
        const timeouts = this.resizeTimeouts;

        for (let i = 0, iEnd = timeouts.length; i < iEnd; ++i) {
            clearTimeout(timeouts[i]);
        }

        timeouts.length = 0;

        timeouts.push(setTimeout((): void => {
            this.adjustNavigator();
            this.chart.redraw();
        }, 33));
    }


    /** @private */
    public render(): this {
        const component = this;

        super.render();
        component.renderNavigator();
        component.sync.start();

        component.emit({ type: 'afterRender' });

        return component;
    }


    /** @private */
    private renderNavigator(): void {
        const chart = this.chart;

        if (this.connector) {
            const table = this.connector.table,
                options = this.options,
                column = this.getColumnAssignment(),
                values = (table.getColumn(column[0], true) || []);

            let data: (
                Array<(number|string|null)>|
                Array<[(number|string), number]>
            );

            if (options.sync.crossfilter) {
                const seriesData: Array<[(number|string), number]> = [],
                    xData: Array<(number|string)> = [];

                let index: number;

                for (let value of values) {

                    if (value === null) {
                        continue;
                    } else if (!isNumber(value)) {
                        value = `${value}`;
                    }

                    index = xData.indexOf(value);

                    if (index === -1) {
                        index = xData.length;
                        xData[index] = value;
                        seriesData[index] = [value, 1];
                    } else {
                        seriesData[index][1] = seriesData[index][1] + 1;
                    }
                }

                seriesData.sort((pointA, pointB): number => (
                    pick(pointA[0], NaN) < pick(pointB[0], NaN) ? -1 :
                        pointA[0] === pointB[0] ? 0 : 1
                ));

                data = seriesData;
            } else if (typeof values[0] === 'string') {
                data = values.slice() as Array<string>;
            } else {
                data = values.slice() as Array<(number|null)>;
            }

            if (!chart.series[0]) {
                chart.addSeries({ id: table.id, data }, false);
            } else {
                chart.series[0].setData(data, false);
            }
        }

        this.redrawNavigator();
    }


    /** @private */
    public resize(
        width?: (number|string|null),
        height?: (number|string|null)
    ): this {
        super.resize(width, height);
        this.redrawNavigator();
        return this;
    }


    /**
     * Handles updating via options.
     *
     * @param options
     * The options to apply.
     */
    public async update(
        options: Partial<NavigatorComponentOptions>,
        shouldRerender: boolean = true
    ): Promise<void> {
        const chart = this.chart;

        await super.update(options, false);

        if (options.sync) {
            this.filterAndAssignSyncOptions(navigatorComponentSync);
        }

        if (options.chartOptions) {
            chart.update(
                merge(
                    (
                        this.options.sync.crossfilter ?
                            {
                                navigator: {
                                    xAxis: {
                                        labels: {
                                            format: '{value}'
                                        }
                                    }
                                }
                            } :
                            {}
                    ),
                    options.chartOptions
                ),
                false
            );
        }

        this.emit({ type: 'afterUpdate' });

        if (shouldRerender) {
            this.render();
        }
    }


}


/* *
 *
 *  Default Export
 *
 * */


export default NavigatorComponent;
