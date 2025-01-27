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

import type Chart from './Chart/Chart';
import type ColorString from './Color/ColorString';
import type CSSObject from './Renderer/CSSObject';
import type { SeriesTypePlotOptions } from './Series/SeriesType';
import type { SymbolKey } from './Renderer/SVG/SymbolType';

/* *
 *
 *  Declarations
 *
 * */

export interface LabelsItemsOptions {
    html?: string;
    style?: CSSObject;
}

export interface LangOptions extends LangOptionsCore {
    chartTitle: string;
    loading: string;
    numericSymbolMagnitude?: number;
    numericSymbols: Array<string> | undefined;
    pieSliceName: string;
    resetZoom: string;
    resetZoomTitle: string;
    seriesName: string;
    yAxisTitle: string;
    zoomIn?: string;
    zoomOut?: string;
}

export interface LangOptionsCore {
    decimalPoint?: string;
    invalidDate?: string;
    locale?: string|Array<string>;
    months?: Array<string>;
    shortMonths?: Array<string>;
    shortWeekdays?: Array<string>;
    thousandsSep?: string;
    weekdays?: Array<string>;
    weekFrom: string;
}

export interface LoadingOptions {
    hideDuration?: number;
    labelStyle?: CSSObject;
    showDuration?: number;
    style?: CSSObject;
}

export interface NumberFormatterCallbackFunction {
    (
        this: Chart|Object|void,
        number: number,
        decimals: number,
        decimalPoint?: string,
        thousandsSep?: string
    ): string;
}

export interface Options {
    colors?: Array<ColorString>;
    lang: LangOptions;
    loading?: LoadingOptions;
    plotOptions: SeriesTypePlotOptions;
    symbols?: Array<SymbolKey>;
    global: GlobalOptions;
}

export interface DefaultOptions extends Options {
}

export type OptionsOverflowValue = ('allow'|'justify');

export type OptionsPosition3dValue = ('chart'|'flap'|'offset'|'ortho');

/* *
 *
 *  Default Export
 *
 * */

export default Options;
