/* *
 *
 *  Data Grid utilities
 *
 *  (c) 2009-2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Øystein Moseng
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type DataTable from '../Data/DataTable';
import fromGlobals from '../Shared/Utilities.js';
import Globals from './Globals.js';

const {
    addEvent,
    createElement,
    css,
    clamp,
    defined,
    diffObjects,
    error,
    extend,
    fireEvent,
    find,
    getStyle,
    getNestedProperty,
    isArray,
    isClass,
    isDOMElement,
    isFunction,
    isNumber,
    isObject,
    isString,
    merge,
    objectEach,
    pick,
    pInt,
    relativeLength,
    removeEvent,
    splat,
    uniqueKey,
    useSerialIds

} = fromGlobals(Globals);

/* *
 *
 *  Functions
 *
 * */

const DataGridUtils = {
    dataTableCellToString(cell: DataTable.CellType): string {
        return typeof cell === 'string' ||
            typeof cell === 'number' ||
            typeof cell === 'boolean' ?
            '' + cell :
            '';
    },
    emptyHTMLElement(element: HTMLElement): void {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
    makeDiv: (className: string, id?: string): HTMLElement => {
        const div = document.createElement('div');
        div.className = className;
        if (id) {
            div.id = id;
        }
        return div;
    },
    addEvent,
    createElement,
    css,
    clamp,
    defined,
    diffObjects,
    error,
    extend,
    fireEvent,
    find,
    getStyle,
    getNestedProperty,
    isArray,
    isClass,
    isDOMElement,
    isFunction,
    isNumber,
    isObject,
    isString,
    merge,
    objectEach,
    pick,
    pInt,
    relativeLength,
    removeEvent,
    splat,
    uniqueKey,
    useSerialIds
};

/* *
 *
 *  Default Export
 *
 * */

export default DataGridUtils;
