/* *
 *
 *  GUI generator for Stock tools
 *
 *  (c) 2009-2024 Sebastian Bochan
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
    LangNavigationOptions
} from '../../Extensions/Annotations/NavigationBindingsOptions';

/* *
 *
 *  Declarations
 *
 * */

export interface LangOptions {
    navigation?: LangNavigationOptions;
    stockTools: LangStockToolsOptions;
}

export interface LangStockToolsOptions {
    toolChanged: string;
    toolSelected: string;
    toolAriaLabel: string;
    descriptions: Record<string, {
        mainButton?: string;
        submenuToggleButton?: string;
    }>;
    gui: Record<string, string>;
}

export interface StockToolsGuiDefinitionsButtonOptions {
    elementType?: 'span'|'button';
    symbol?: string;
}

export interface StockToolsGuiDefinitionsButtonsOptions {
    [key: string]: (Array<string>|StockToolsGuiDefinitionsButtonOptions);
    items: Array<string>;
}

export interface StockToolsGuiDefinitionsOptions {
    [key: string]: (
        StockToolsGuiDefinitionsButtonOptions|
        StockToolsGuiDefinitionsButtonsOptions
    );
    advanced: StockToolsGuiDefinitionsButtonsOptions;
    crookedLines: StockToolsGuiDefinitionsButtonsOptions;
    currentPriceIndicator: StockToolsGuiDefinitionsButtonOptions;
    flags: StockToolsGuiDefinitionsButtonsOptions;
    fullScreen: StockToolsGuiDefinitionsButtonOptions;
    indicators: StockToolsGuiDefinitionsButtonOptions;
    lines: StockToolsGuiDefinitionsButtonsOptions;
    measure: StockToolsGuiDefinitionsButtonsOptions;
    separator: StockToolsGuiDefinitionsButtonOptions;
    toggleAnnotations: StockToolsGuiDefinitionsButtonOptions;
    saveChart: StockToolsGuiDefinitionsButtonOptions;
    simpleShapes: StockToolsGuiDefinitionsButtonsOptions;
    typeChange: StockToolsGuiDefinitionsButtonsOptions;
    verticalLabels: StockToolsGuiDefinitionsButtonsOptions;
    zoomChange: StockToolsGuiDefinitionsButtonsOptions;
}

export interface StockToolsGuiOptions {
    buttons?: Array<string>;
    className?: string;
    definitions?: StockToolsGuiDefinitionsOptions;
    enabled?: boolean;
    iconsURL?: string;
    placed?: boolean;
    toolbarClassName?: string;
    visible?: boolean;
}

export interface StockToolsOptions {
    gui: StockToolsGuiOptions;
}

/* *
 *
 *  Default Options
 *
 * */

export default StockToolsOptions;
