/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */


import type { ComponentTypeRegistry } from './ComponentType';


/* *
 *
 *  Namespace
 *
 * */

namespace ComponentRegistry {

    /* *
     *
     *  Constants
     *
     * */

    /**
     *
     * Record of component classes
     * @todo
     *
     */
    export const types = {} as ComponentTypeRegistry;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Method used to register new component classes.
     *
     * @param {string} key
     * Registry key of the component class.
     *
     * @param {ComponentType} DataConnectorClass
     * Component class (aka class constructor) to register.
     */
    export function registerComponent<T extends keyof ComponentTypeRegistry>(
        key: T,
        ComponentClass: ComponentTypeRegistry[T]
    ): boolean {
        return (
            !!key &&
            !types[key] &&
            !!(types[key] = ComponentClass)
        );
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ComponentRegistry;
