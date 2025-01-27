/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type {
    AlignValue,
    VerticalAlignValue
} from '../../Core/Renderer/AlignObject';
import type ButtonThemeObject from '../../Core/Renderer/SVG/ButtonThemeObject';
import type ColorString from '../../Core/Color/ColorString';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type DataGroupingOptions from
    '../../Extensions/DataGrouping/DataGroupingOptions';
import type Time from '../../Core/Time';

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Options'{
    interface LangOptions {
        rangeSelectorFrom?: string;
        rangeSelectorTo?: string;
        rangeSelectorZoom?: string;
        rangeSelector?: Partial<Record<RangeSelectorButtonLangKey, string>>;
    }
    interface Options {
        rangeSelector?: DeepPartial<RangeSelectorOptions>;
    }
}

export interface RangeSelectorButtonsEventsOptions {
    click?: RangeSelectorClickCallbackFunction;
}

export interface RangeSelectorButtonOptions {
    count?: number;
    dataGrouping?: DataGroupingOptions;
    title?: string;
    events?: RangeSelectorButtonsEventsOptions;
    offsetMax?: number;
    offsetMin?: number;
    preserveDataGrouping?: boolean;
    text?: string;
    type?: RangeSelectorButtonTypeValue;
}

export type RangeSelectorButtonTypeValue = (
    'all'|'day'|'hour'|'millisecond'|'minute'|'month'|'second'|'week'|
    'year'|'ytd'
);

export type RangeSelectorButtonLangKey = (
    `${RangeSelectorButtonTypeValue}Text` |
        `${RangeSelectorButtonTypeValue}Title`
);

export interface RangeSelectorClickCallbackFunction {
    (e: Event): (boolean|undefined);
}

export interface RangeSelectorOptions {
    allButtonsEnabled: boolean;
    buttonPosition: RangeSelectorPositionOptions;
    buttons: Array<RangeSelectorButtonOptions>;
    buttonSpacing: number;
    buttonTheme: ButtonThemeObject;
    dropdown: 'always'|'never'|'responsive';
    enabled?: boolean;
    floating: boolean;
    height?: number;
    inputBoxBorderColor: ColorString;
    inputBoxHeight: number;
    inputBoxWidth?: number;
    inputDateFormat: Time.DateTimeFormat;
    inputDateParser?: RangeSelectorParseCallbackFunction;
    inputEditDateFormat: string;
    inputEnabled: boolean;
    inputPosition: RangeSelectorPositionOptions;
    inputSpacing: number;
    inputStyle: CSSObject;
    labelStyle: CSSObject;
    selected?: number;
    verticalAlign: VerticalAlignValue;
    x: number;
    y: number;
}

export interface RangeSelectorParseCallbackFunction {
    (value: string, useUTC: boolean, time?: Time): number;
}

export interface RangeSelectorPositionOptions {
    align: AlignValue;
    x: number;
    y: number;
}

/* *
 *
 *  Default Export
 *
 * */

export default RangeSelectorOptions;
