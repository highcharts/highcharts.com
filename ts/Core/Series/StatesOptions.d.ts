/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type ColorType from '../Color/ColorType';
import type DashStyleValue from '../Renderer/DashStyleValue';

/* *
 *
 *  Declarations
 *
 * */

export interface StateClassWithOptions {}

export type StateGenericOptions<T extends { options: AnyRecord }> = (
    DeepPartial<Omit<T['options'], ('states'|'data')>>
);

export interface StateHoverOptions {
    color?: ColorType;
    dashStyle?: DashStyleValue;
}

export interface StateInactiveOptions {
    color?: ColorType;
    dashStyle?: DashStyleValue;
}

export interface StateNormalOptions {
    color?: ColorType;
    dashStyle?: DashStyleValue;
}

export interface StateSelectOptions extends StateHoverOptions {
    color?: ColorType;
    dashStyle?: DashStyleValue;
}

export interface StatesOptions {
    hover?: StateHoverOptions;
    inactive?: StateInactiveOptions;
    normal?: StateNormalOptions;
    select?: StateSelectOptions;
}

export type StatesOptionsKey = keyof StatesOptions;

/* *
 *
 *  Default Export
 *
 * */

export default StatesOptions;
