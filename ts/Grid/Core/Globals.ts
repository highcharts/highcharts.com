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
 *  Class
 *
 * */

/**
 * Globals Grid namespace.
 */
namespace Globals {

    /* *
     *
     *  Declarations
     *
     * */

    export type DeepPartial<T> = {
        [K in keyof T]?: (T[K]|DeepPartial<T[K]>);
    };

    export type DeepRequired<T> = {
        [K in keyof T]-?: DeepRequired<T[K]>;
    };

    export type ClassNameKey = keyof typeof rawClassNames;


    /* *
     *
     *  Constants
     *
     * */

    export const classNamePrefix: string = 'hcg-';

    export const rawClassNames = {
        container: 'container',
        tableElement: 'table',
        captionElement: 'caption',
        descriptionElement: 'description',
        theadElement: 'thead',
        tbodyElement: 'tbody',
        rowElement: 'row',
        rowEven: 'row-even',
        rowOdd: 'row-odd',
        hoveredRow: 'hovered-row',
        columnElement: 'column',
        hoveredCell: 'hovered-cell',
        hoveredColumn: 'hovered-column',
        syncedRow: 'synced-row',
        syncedCell: 'synced-cell',
        syncedColumn: 'synced-column',
        editedCell: 'edited-cell',
        mockedCell: 'mocked-cell',
        rowsContentNowrap: 'rows-content-nowrap',
        virtualization: 'virtualization',
        scrollableContent: 'scrollable-content',
        headerCell: 'header-cell',
        headerCellContent: 'header-cell-content',
        headerRow: 'head-row-content',
        noData: 'no-data',
        columnFirst: 'column-first',
        columnSortable: 'column-sortable',
        columnSortableIcon: 'column-sortable-icon',
        columnSortedAsc: 'column-sorted-asc',
        columnSortedDesc: 'column-sorted-desc',
        resizerWrapper: 'resizer-content',
        resizerHandles: 'column-resizer',
        resizedColumn: 'column-resized',
        creditsContainer: 'credits-container',
        creditsText: 'credits',
        visuallyHidden: 'visually-hidden',
        lastHeaderCellInRow: 'last-header-cell-in-row',
        loadingWrapper: 'loading-wrapper',
        loadingSpinner: 'spinner',
        loadingMessage: 'loading-message'
    } as const;

    export const win = window;
    export const composed: Array<string> = [];
    export const userAgent = (win.navigator && win.navigator.userAgent) || '';
    export const isChrome = userAgent.indexOf('Chrome') !== -1;
    export const isSafari = !isChrome && userAgent.indexOf('Safari') !== -1;
    export const getClassName = (classNameKey: ClassNameKey): string =>
        classNamePrefix + rawClassNames[classNameKey];

}

/* *
 *
 *  Default Export
 *
 * */

export default Globals;
