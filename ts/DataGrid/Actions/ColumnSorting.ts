/* *
 *
 *  Data Grid class
 *
 *  (c) 2020-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *  - Sebastian Bochan
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import DataGridColumn from '../DataGridColumn.js';
import DataModifier from '../../Data/Modifiers/DataModifier.js';
import DataTable from '../../Data/DataTable.js';
import Globals from '../Globals.js';

/* *
 *
 *  Class
 *
 * */

/**
 * Represents a table header row containing the column names.
 */
class ColumnSorting {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The sorted column of the table.
     */
    public column: DataGridColumn;

    /**
     * The head element of the column.
     */
    public headElement: HTMLElement;

    /**
     * Current sorting type on column.
     */
    public sortingState: ColumnSorting.SortingState = 'none';

    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs sorting for a dedicated column.
     *
     * @param column
     * The column that be sorted.
     * 
     * @param headElement
     * The head element of the column.
     */
    constructor(column: DataGridColumn, headElement: HTMLElement) {
        this.column = column;
        this.headElement = headElement;
        this.addSortingEvents();
    }


    /* *
    *
    *  Methods
    *
    * */

    /**
     * Adds CSS classes and click event to the header of column.
     */
    private addSortingEvents(): void {
        const vp = this.column.viewport;
        const columnSortingState = vp.dataGrid.columnSortingState &&
            vp.dataGrid.columnSortingState[this.column.id];

        if (!vp.dataGrid.dataTable) {
            return;
        }

        this.column.headerContent?.addEventListener(
            'click',
            this.setSortingState
        );

        this.headElement.classList.add(Globals.classNames.columnSorting);

        if (columnSortingState === 'asc') {
            this.headElement.classList.add(
                Globals.classNames.columnSortingAsc
            );
        }

        if (columnSortingState === 'desc') {
            this.headElement.classList.add(
                Globals.classNames.columnSortingDesc
            );
        }
    }
    /**
     * Apply the dedicated sorting for a column
     * (ascending, descending or default).
     */
    private setSortingState = (): void => {
        const dataGrid = this.column.viewport.dataGrid;
        let state = this.sortingState,
            modifier: DataModifier;

        if (
            dataGrid.columnSortingState &&
            dataGrid.columnSortingState[this.column.id]
        ) {
            state = dataGrid.columnSortingState[this.column.id];
        } else {
            dataGrid.columnSortingState = {};
        }

        if (state === 'desc') {
            this.sortingState =
                dataGrid.columnSortingState[this.column.id] = 'none';
            dataGrid.update({
                table: dataGrid.originDataTable
            });
        } else {
            if (state === 'none') {
                modifier = new DataModifier.types.Sort({
                    direction: 'asc',
                    orderByColumn: this.column.id
                });
                this.sortingState =
                    dataGrid.columnSortingState[this.column.id] = 'asc';
            } else {
                modifier = new DataModifier.types.Sort({
                    direction: 'desc',
                    orderByColumn: this.column.id
                });
    
                this.sortingState =
                    dataGrid.columnSortingState[this.column.id] = 'desc';
            }

            if (modifier) {
                dataGrid.update({
                    table: modifier.modifyTable(
                        (dataGrid.dataTable as DataTable).clone()
                    )
                });
            }
        }

        // if (state === 'none') {
        //     this.sortingState =
        //         dataGrid.columnSortingState[this.column.id] = 'asc';

        //     modifier = new DataModifier.types.Sort({
        //         direction: 'asc',
        //         orderByColumn: this.column.id
        //     });

        //     dataGrid.update({
        //         table: modifier.modifyTable(
        //             (dataGrid.dataTable as DataTable).clone()
        //         )
        //     });
        // } else if (state === 'asc') {
        //     modifier = new DataModifier.types.Sort({
        //         direction: 'desc',
        //         orderByColumn: this.column.id
        //     });

        //     this.sortingState =
        //         dataGrid.columnSortingState[this.column.id] = 'desc';
        //     dataGrid.update({
        //         table: modifier.modifyTable(
        //             (dataGrid.dataTable as DataTable).clone()
        //         )
        //     });
        // } else if (state === 'desc') {
        //     this.sortingState =
        //         dataGrid.columnSortingState[this.column.id] = 'none';
        //     dataGrid.update({
        //         table: dataGrid.originDataTable
        //     });
        // }
    }

    /**
     * Unbind click event
     */
    public removeEventListeners(): void {
        this.headElement.removeEventListener('click', this.setSortingState);
    }
}
/* *
 *
 *  Class Namespace
 *
 * */

namespace ColumnSorting {
    export type SortingState = 'asc' | 'desc' | 'none';
}

/* *
 *
 *  Default Export
 *
 * */

export default ColumnSorting;
