/* *
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


/* *
*
*  Imports
*
* */

import type DataTable from './DataTable';
import type Types from '../Shared/Types';


/**
 * Utility functions for columns that can be either arrays or typed arrays.
 * @private
 */
namespace ColumnUtils {

    /* *
    *
    *  Declarations
    *
    * */

    /**
     * Result of the `shift` function.
     */
    export interface ShiftResult {
        value: DataTable.CellType
        array: DataTable.Column
    }

    /**
     * Result of the `splice` function.
     */
    export interface SpliceResult<T extends DataTable.Column> {
        removed: T
        array: T
    }


    /* *
    *
    * Functions
    *
    * */

    /**
     * Sets the length of the column array.
     *
     * @param {DataTable.Column} column
     * Column to be modified.
     *
     * @param {number} length
     * New length of the column.
     *
     * @param {boolean} asSubarray
     * If column is a typed array, return a subarray instead of a new array. It
     * is faster `O(1)`, but the entire buffer will be kept in memory until all
     * views to it are destroyed. Default is `false`.
     *
     * @return {DataTable.Column}
     * Modified column.
     *
     * @private
     */
    export function setLength(
        column: DataTable.Column,
        length: number,
        asSubarray?: boolean
    ): DataTable.Column {
        if (Array.isArray(column)) {
            column.length = length;
            return column;
        }

        return column[asSubarray ? 'subarray' : 'slice'](0, length);
    }

    /**
     * Splices a column array.
     *
     * @param {DataTable.Column} column
     * Column to be modified.
     *
     * @param {number} start
     * Index at which to start changing the array.
     *
     * @param {number} deleteCount
     * An integer indicating the number of old array elements to remove.
     *
     * @param {boolean} removedAsSubarray
     * If column is a typed array, return a subarray instead of a new array. It
     * is faster `O(1)`, but the entire buffer will be kept in memory until all
     * views to it are destroyed. Default is `true`.
     *
     * @param {Array<number>|TypedArray} items
     * The elements to add to the array, beginning at the start index. If you
     * don't specify any elements, `splice()` will only remove elements from the
     * array.
     *
     * @return {SpliceResult}
     * Object containing removed elements and the modified column.
     *
     * @private
     */
    export function splice(
        column: DataTable.Column,
        start: number,
        deleteCount: number,
        removedAsSubarray?: boolean,
        items: DataTable.CellType[]|Types.TypedArray = []
    ): SpliceResult<DataTable.Column> {
        if (Array.isArray(column)) {
            if (!Array.isArray(items)) {
                items = Array.from(items);
            }

            return {
                removed: column.splice(start, deleteCount, ...items),
                array: column
            };
        }

        const Constructor = Object.getPrototypeOf(column)
            .constructor as Types.TypedArrayConstructor;

        const removed = column[
            removedAsSubarray ? 'subarray' : 'slice'
        ](start, start + deleteCount);

        const newLength = column.length - deleteCount + items.length;
        const result = new Constructor(newLength);

        result.set(column.subarray(0, start), 0);
        result.set(items as (number[]|Types.TypedArray), start);
        result.set(column.subarray(start + deleteCount), start + items.length);

        return {
            removed: removed,
            array: result
        };
    }
}


/* *
 *
 *  Default Export
 *
 * */

export default ColumnUtils;
