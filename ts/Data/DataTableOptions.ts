/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *  - Dawid Dragula
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Types from '../Shared/Types';


/* *
 *
 *  Declarations
 *
 * */


/**
 * Options to initialize a new DataTable instance.
 */
export interface DataTableOptions {


    /**
     * Initial columns with their values.
     */
    columns?: Record<string, Array<DataTableValue>|Types.TypedArray>;


    /**
     * Custom ID to identify the new DataTable instance.
     */
    id?: string;
}


export type DataTablePrimitiveValue = (boolean|null|number|string|undefined);

export type DataTableValue = DataTablePrimitiveValue|DataTablePrimitiveValue[];


/* *
 *
 *  Default Export
 *
 * */


export default DataTableOptions;
