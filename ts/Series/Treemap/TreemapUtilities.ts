/* *
 *
 *  (c) 2014-2021 Highsoft AS
 *
 *  Authors: Jon Arild Nygard / Oystein Moseng
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import OH from '../../Shared/Helpers/ObjectHelper.js';
const { objectEach } = OH;

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

namespace TreemapUtilities {

    interface TreemapRecursiveCallbackFunction<TContext = any, TItem = any> {
        (this: TContext, item: TItem): (boolean|TItem);
    }

    export const AXIS_MAX = 100;

    /* eslint-disable no-invalid-this, valid-jsdoc */

    /**
     * @todo Similar to eachObject, this function is likely redundant
     */
    export function isBoolean(x: unknown): x is boolean {
        return typeof x === 'boolean';
    }

    /**
     * @todo Similar to recursive, this function is likely redundant
     */
    export function eachObject(
        this: any,
        list: any,
        func: OH.ObjectEachCallback<any, unknown>,
        context?: unknown
    ): void {
        context = context || this;
        objectEach(list, function (val: unknown, key: string): void {
            func.call(context, val, key, list);
        });
    }

    /**
     * @todo find correct name for this function.
     * @todo Similar to reduce, this function is likely redundant
     */
    export function recursive<TContext = any, TItem = any>(
        this: any,
        item: TItem,
        func: TreemapRecursiveCallbackFunction<TContext, TItem>,
        context: TContext = this
    ): void {
        let next: any;

        next = func.call(context as any, item);
        if (next !== false) {
            recursive(next, func, context);
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default TreemapUtilities;
