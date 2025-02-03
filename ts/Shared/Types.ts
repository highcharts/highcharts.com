/* *
 *
 *  (c) 2010-2024 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Declarations
 *
 * */

namespace Types {

    /**
     * Any type for objects with mixed property types.
     *
     * **Note:** This is not type safe and should be used only for property
     *           loops.
     */
    export type AnyRecord = Record<string, any>;

    /**
     * Utility type to mark recursively all properties and sub-properties
     * optional.
     */
    export type DeepPartial<T> = {
        [K in keyof T]?: (T[K]|DeepPartial<T[K]>);
    };

    /**
     * Any typed array.
     */
    export type TypedArray = (
        Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|
        Int32Array|Uint32Array|Float32Array|Float64Array
    );

    /**
     * Constructor of a typed array.
     */
    export type TypedArrayConstructor = (
        Int8ArrayConstructor|Uint8ArrayConstructor|Uint8ClampedArrayConstructor|
        Int16ArrayConstructor|Uint16ArrayConstructor|Int32ArrayConstructor|
        Uint32ArrayConstructor|Float32ArrayConstructor|Float64ArrayConstructor
    );

}

/* *
 *
 *  Default Export
 *
 * */

export default Types;
