/* *
 *
 *  Grid Sorting Controller class
 *
 *  (c) 2020-2024 Highsoft AS
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

import type { ColumnSortingOrder } from '../Options.js';

import Grid from '../Grid.js';
import SortModifier from '../../../Data/Modifiers/SortModifier.js';

/* *
 *
 *  Class
 *
 * */

/**
 * Class that manages one of the data grid querying types - sorting.
 */
class SortingController {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The data grid instance.
     */
    private grid: Grid;

    /**
     * The current sorting options: column ID and sorting order.
     */
    public currentSorting?: SortingController.SortingState;

    /**
     * The initial sorting options: column ID and sorting order.
     * This is the sorting that is applied when the data grid is created or
     * after the whole viewport is reloaded with changed sorting options.
     */
    private initialSorting?: SortingController.SortingState;

    /**
     * The modifier that is applied to the data table.
     */
    public modifier?: SortModifier;

    /**
     * The flag that indicates if the data should be updated because of the
     * change in the sorting options.
     */
    public shouldBeUpdated: boolean = false;


    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs the SortingController instance.
     *
     * @param grid
     * The data grid instance.
     */
    constructor(grid: Grid) {
        this.grid = grid;
    }


    /* *
    *
    *  Functions
    *
    * */

    /**
     * Sets the sorting state. If the new sorting state is different than the
     * current one, the `shouldBeUpdated` flag is set to `true`. If the
     * same, the flag is set to `false`.
     *
     * @param order
     * The sorting order.
     *
     * @param columnId
     * The column ID to sort by.
     */
    public setSorting(order: ColumnSortingOrder, columnId?: string): void {
        if (
            this.currentSorting?.columnId !== columnId ||
            this.currentSorting?.order !== order
        ) {
            this.shouldBeUpdated = true;
            this.currentSorting = {
                columnId,
                order
            };
        }

        this.modifier = this.createModifier();
    }

    /**
     * Returns the sorting options from the data grid options.
     */
    private getSortingOptions(): SortingController.SortingState {
        const grid = this.grid,
            { columnOptionsMap } = grid;

        if (!columnOptionsMap) {
            return { order: null };
        }

        const columnIDs = Object.keys(columnOptionsMap);

        let foundOrder: ColumnSortingOrder = null;
        let foundColumnId: string | undefined;
        for (let i = columnIDs.length - 1; i > -1; --i) {
            const columnId = columnIDs[i];
            const columnOptions = columnOptionsMap[columnId];
            const order = columnOptions.sorting?.order;

            if (order) {
                if (foundColumnId) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        'Grid: Only one column can be sorted at a time. ' +
                        'Data will be sorted only by the last found column ' +
                        `with the sorting order defined in the options: "${
                            foundColumnId
                        }".`
                    );
                    break;
                }

                foundOrder = order;
                foundColumnId = columnId;
            }
        }

        return {
            columnId: foundColumnId,
            order: foundOrder
        };
    }

    /**
     * Loads sorting options from the data grid options.
     */
    public loadOptions(): void {
        const stateFromOptions = this.getSortingOptions();

        if (
            stateFromOptions.columnId !== this.initialSorting?.columnId ||
            stateFromOptions.order !== this.initialSorting?.order
        ) {
            this.initialSorting = stateFromOptions;
            this.setSorting(stateFromOptions.order, stateFromOptions.columnId);
        }
    }

    /**
     * Returns the sorting modifier based on the loaded sorting options.
     */
    private createModifier(): SortModifier | undefined {
        if (!this.currentSorting) {
            return;
        }

        const { columnId, order } = this.currentSorting;
        if (!order) {
            return;
        }

        return new SortModifier({
            orderByColumn: columnId,
            direction: order
        });
    }

}


/* *
 *
 *  Class Namespace
 *
 * */

namespace SortingController {

    /**
     * The sorting state interface.
     */
    export interface SortingState {
        columnId?: string;
        order: ColumnSortingOrder;
    }

}


/* *
 *
 *  Default Export
 *
 * */

export default SortingController;
