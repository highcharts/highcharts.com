/* *
 *
 *  GUI generator for Stock tools
 *
 *  (c) 2009-2021 Sebastian Bochan
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

import type Chart from '../../Core/Chart/Chart';
import type ChartOptions from '../../Core/Chart/ChartOptions';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';
import type NavigationBindings from '../../Extensions/Annotations/NavigationBindings';
import type Options from '../../Core/Options';
import type {
    LangStockToolsOptions,
    StockToolsOptions
} from './StockToolsOptions';

import D from '../../Core/Defaults.js';
const { setOptions } = D;
import StockToolsDefaults from './StockToolsDefaults.js';
import Toolbar from './StockToolbar.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { merge } = OH;
const { addEvent } = EH;
const {
    getStyle,
    pick
} = U;

/* *
 *
 * Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        stockTools?: Toolbar;
        /** @requires modules/stock-tools */
        setStockTools(options?: StockToolsOptions): void;
    }
}

declare module '../../Core/Options'{
    interface LangOptions {
        stockTools?: LangStockToolsOptions;
    }
    interface Options {
        stockTools?: StockToolsOptions;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * Verify if Toolbar should be added.
 * @private
 */
function chartSetStockTools(
    this: Chart,
    options?: StockToolsOptions
): void {
    const chartOptions: Options = this.options,
        lang = chartOptions.lang,
        guiOptions = merge(
            chartOptions.stockTools && chartOptions.stockTools.gui,
            options && options.gui
        ),
        langOptions = lang && lang.stockTools && lang.stockTools.gui;

    this.stockTools = new Toolbar(guiOptions, langOptions, this);

    if (this.stockTools.guiEnabled) {
        this.isDirtyBox = true;
    }
}

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart,
    NavigationBindingsClass: typeof NavigationBindings
): void {

    if (pushUnique(composedMembers, ChartClass)) {
        addEvent(ChartClass, 'afterGetContainer', onChartAfterGetContainer);
        addEvent(ChartClass, 'beforeRedraw', onChartBeforeRedraw);
        addEvent(ChartClass, 'beforeRender', onChartBeforeRedraw);
        addEvent(ChartClass, 'destroy', onChartDestroy);
        addEvent(ChartClass, 'getMargins', onChartGetMargins, { order: 0 });
        addEvent(ChartClass, 'redraw', onChartRedraw);
        addEvent(ChartClass, 'render', onChartRender);

        ChartClass.prototype.setStockTools = chartSetStockTools;
    }

    if (pushUnique(composedMembers, NavigationBindingsClass)) {
        addEvent(
            NavigationBindingsClass,
            'deselectButton',
            onNavigationBindingsDeselectButton
        );
        addEvent(
            NavigationBindingsClass,
            'selectButton',
            onNavigationBindingsSelectButton
        );
    }

    if (pushUnique(composedMembers, setOptions)) {
        setOptions(StockToolsDefaults);
    }
}

/**
 * Run HTML generator
 * @private
 */
function onChartAfterGetContainer(
    this: Chart
): void {
    this.setStockTools();
}

/**
 * Handle beforeRedraw and beforeRender
 * @private
 */
function onChartBeforeRedraw(
    this: Chart
): void {
    if (this.stockTools) {
        const optionsChart = this.options.chart as ChartOptions;
        const listWrapper = this.stockTools.listWrapper,
            offsetWidth = listWrapper && (
                (
                    (listWrapper as any).startWidth +
                    getStyle(listWrapper, 'padding-left') +
                    getStyle(listWrapper, 'padding-right')
                ) || listWrapper.offsetWidth
            );

        let dirty = false;

        if (offsetWidth && offsetWidth < this.plotWidth) {
            const nextX = pick(
                optionsChart.spacingLeft,
                optionsChart.spacing && optionsChart.spacing[3],
                0
            ) + offsetWidth;
            const diff = nextX - this.spacingBox.x;
            this.spacingBox.x = nextX;
            this.spacingBox.width -= diff;
            dirty = true;
        } else if (offsetWidth === 0) {
            dirty = true;
        }

        if (offsetWidth !== this.stockTools.prevOffsetWidth) {
            this.stockTools.prevOffsetWidth = offsetWidth;
            if (dirty) {
                this.isDirtyLegend = true;
            }
        }
    }
}

/**
 * @private
 */
function onChartDestroy(
    this: Chart
): void {
    if (this.stockTools) {
        this.stockTools.destroy();
    }
}

/**
 * @private
 */
function onChartGetMargins(
    this: Chart
): void {
    const listWrapper = this.stockTools && this.stockTools.listWrapper,
        offsetWidth = listWrapper && (
            (
                (listWrapper as any).startWidth +
                getStyle(listWrapper, 'padding-left') +
                getStyle(listWrapper, 'padding-right')
            ) || listWrapper.offsetWidth
        );

    if (offsetWidth && offsetWidth < this.plotWidth) {
        this.plotLeft += offsetWidth;
        this.spacing[3] += offsetWidth;
    }
}

/**
 * @private
 */
function onChartRedraw(
    this: Chart
): void {
    if (this.stockTools && this.stockTools.guiEnabled) {
        this.stockTools.redraw();
    }
}

/**
 * Check if the correct price indicator button is displayed, #15029.
 * @private
 */
function onChartRender(
    this: Chart
): void {
    const stockTools = this.stockTools,
        button = stockTools &&
            stockTools.toolbar &&
            stockTools.toolbar.querySelector(
                '.highcharts-current-price-indicator'
            ) as any;

    // Change the initial button background.
    if (
        stockTools &&
        this.navigationBindings &&
        this.options.series &&
        button
    ) {
        if (
            this.navigationBindings.constructor.prototype.utils
                .isPriceIndicatorEnabled(this.series)
        ) {
            button.firstChild.style['background-image'] =
            'url("' + stockTools.getIconsURL() + 'current-price-hide.svg")';
        } else {
            button.firstChild.style['background-image'] =
            'url("' + stockTools.getIconsURL() + 'current-price-show.svg")';
        }
    }
}

/**
 * @private
 */
function onNavigationBindingsDeselectButton(
    this: NavigationBindings,
    event: Record<string, HTMLDOMElement>
): void {
    const className = 'highcharts-submenu-wrapper',
        gui = this.chart.stockTools;

    if (gui && gui.guiEnabled) {
        let button = event.button;

        // If deselecting a button from a submenu, select state for it's parent
        if (button.parentNode.className.indexOf(className) >= 0) {
            button = button.parentNode.parentNode;
        }
        // Set active class on the current button
        gui.toggleButtonActiveClass(button);
    }
}

/**
 * Communication with bindings
 * @private
 */
function onNavigationBindingsSelectButton(
    this: NavigationBindings,
    event: Record<string, HTMLDOMElement>
): void {
    const className = 'highcharts-submenu-wrapper',
        gui = this.chart.stockTools;

    if (gui && gui.guiEnabled) {
        let button = event.button;

        // Unslect other active buttons
        gui.unselectAllButtons(event.button);

        // If clicked on a submenu, select state for it's parent
        if (button.parentNode.className.indexOf(className) >= 0) {
            button = button.parentNode.parentNode;
        }
        // Set active class on the current button
        gui.toggleButtonActiveClass(button);
    }
}

/* *
 *
 *  Default Export
 *
 * */

const StockToolsGui = {
    compose
};

export default StockToolsGui;
