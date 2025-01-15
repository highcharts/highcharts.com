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
 *  - Sebastian Bochan
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

/* *
 *
 *  Namespace
 *
 * */

/**
 * Global DataGrid namespace.
 *
 * @namespace DataGrid
 */
namespace Globals {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Utility type to mark recursively all properties and sub-properties
     * optional.
     */
    export type DeepPartial<T> = {
        [K in keyof T]?: (T[K]|DeepPartial<T[K]>);
    };

    /**
     * Utility type to mark recursively all properties and sub-properties
     * required.
     */
    export type DeepRequired<T> = {
        [K in keyof T]-?: DeepRequired<T[K]>;
    };

    /* *
     *
     *  Constants
     *
     * */

    export const classNamePrefix = 'highcharts-datagrid-';

    export const classNames = {
        container: classNamePrefix + 'container',
        errorsContainer: classNamePrefix + 'errors-container',
        tableElement: classNamePrefix + 'table',
        captionElement: classNamePrefix + 'caption',
        descriptionElement: classNamePrefix + 'description',
        theadElement: classNamePrefix + 'thead',
        tbodyElement: classNamePrefix + 'tbody',
        rowElement: classNamePrefix + 'row',
        rowEven: classNamePrefix + 'row-even',
        rowOdd: classNamePrefix + 'row-odd',
        hoveredRow: classNamePrefix + 'hovered-row',
        columnElement: classNamePrefix + 'column',
        hoveredCell: classNamePrefix + 'hovered-cell',
        hoveredColumn: classNamePrefix + 'hovered-column',
        syncedRow: classNamePrefix + 'synced-row',
        syncedCell: classNamePrefix + 'synced-cell',
        syncedColumn: classNamePrefix + 'synced-column',
        editedCell: classNamePrefix + 'edited-cell',
        editedCellError: classNamePrefix + 'edited-cell-error',
        mockedCell: classNamePrefix + 'mocked-cell',
        rowsContentNowrap: classNamePrefix + 'rows-content-nowrap',
        virtualization: classNamePrefix + 'virtualization',
        scrollableContent: classNamePrefix + 'scrollable-content',
        headerCell: classNamePrefix + 'header-cell',
        headerCellContent: classNamePrefix + 'header-cell-content',
        headerRow: classNamePrefix + 'head-row-content',
        noData: classNamePrefix + 'no-data',
        columnFirst: classNamePrefix + 'column-first',
        columnSortable: classNamePrefix + 'column-sortable',
        columnSortableIcon: classNamePrefix + 'column-sortable-icon',
        columnSortedAsc: classNamePrefix + 'column-sorted-asc',
        columnSortedDesc: classNamePrefix + 'column-sorted-desc',
        resizerWrapper: classNamePrefix + 'resizer-content',
        resizerHandles: classNamePrefix + 'column-resizer',
        resizedColumn: classNamePrefix + 'column-resized',
        creditsContainer: classNamePrefix + 'credits-container',
        creditsText: classNamePrefix + 'credits',
        visuallyHidden: classNamePrefix + 'visually-hidden',
        lastHeaderCellInRow: classNamePrefix + 'last-header-cell-in-row'
    };

    export const win = window;
    export const userAgent = (win.navigator && win.navigator.userAgent) || '';
    export const isChrome = userAgent.indexOf('Chrome') !== -1;
    export const isSafari = !isChrome && userAgent.indexOf('Safari') !== -1;
}

/* *
 *
 *  Default Export
 *
 * */

export default Globals;
