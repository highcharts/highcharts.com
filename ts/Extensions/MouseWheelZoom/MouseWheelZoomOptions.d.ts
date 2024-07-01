/* *
 *
 *  (c) 2023 Askel Eirik Johansson
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */


import type ChartZoomingOptions from '../../Core/Chart/ChartOptions';

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartOptions'{
    interface ChartZoomingOptions {
        mouseWheel?: MouseWheelZoomOptions;
    }
}

/* *
 *
 *  API Options
 *
 * */

export interface MouseWheelZoomOptions {
    enabled?: boolean;
    sensitivity?: number;
    type?: ChartZoomingOptions['type'],
    showResetZoomButton?: boolean
}

export default MouseWheelZoomOptions;
