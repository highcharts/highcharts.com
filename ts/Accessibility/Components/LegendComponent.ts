/* *
 *
 *  (c) 2009-2024 Øystein Moseng
 *
 *  Accessibility component for chart legend.
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


import type Accessibility from '../Accessibility';
import type Chart from '../../Core/Chart/Chart.js';
import type { LegendAccessibilityOptions } from '../Options/A11yOptions';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type ProxyElement from '../ProxyElement';

import { animObject } from '../../Core/Animation/AnimationUtilities.js';
import H from '../../Core/Globals.js';
const { doc } = H;
import Legend from '../../Core/Legend/Legend.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    fireEvent,
    isNumber,
    pick,
    syncTimeout
} = U;

import AccessibilityComponent from '../AccessibilityComponent.js';
import KeyboardNavigationHandler from '../KeyboardNavigationHandler.js';

import CU from '../Utils/ChartUtilities.js';
const { getChartTitle } = CU;
import HU from '../Utils/HTMLUtilities.js';
const {
    stripHTMLTagsFromString: stripHTMLTags,
    addClass,
    removeClass
} = HU;


/* *
 *
 *  Declarations
 *
 * */


declare module '../../Core/Legend/LegendItem' {
    interface LegendItem {
        a11yProxyElement?: ProxyElement;
    }
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        a11yProxyElement?: ProxyElement;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        a11yProxyElement?: ProxyElement;
    }
}


/* *
 *
 *  Functions
 *
 * */


/**
 * @private
 */
function scrollLegendToItem(legend: Legend, itemIx: number): void {
    const itemPage = (legend.allItems[itemIx].legendItem || {}).pageIx,
        curPage: number = legend.currentPage as any;

    if (typeof itemPage !== 'undefined' && itemPage + 1 !== curPage) {
        legend.scroll(1 + itemPage - curPage);
    }
}


/**
 * @private
 */
function shouldDoLegendA11y(chart: Chart): boolean {
    const items = chart.legend && chart.legend.allItems,
        legendA11yOptions: LegendAccessibilityOptions = (
            (chart.options.legend as any).accessibility || {}
        ),
        unsupportedColorAxis = chart.colorAxis && chart.colorAxis.some(
            (c): boolean => !c.dataClasses || !c.dataClasses.length
        );

    return !!(
        items && items.length &&
        !unsupportedColorAxis &&
        legendA11yOptions.enabled !== false
    );
}


/**
 * @private
 */
function setLegendItemHoverState(
    hoverActive: boolean,
    item: Legend.Item
): void {
    const legendItem = item.legendItem || {};

    item.setState(hoverActive ? 'hover' : '', true);

    for (const key of ['group', 'label', 'symbol'] as const) {
        const svgElement = legendItem[key];
        const element = svgElement && svgElement.element || svgElement;
        if (element) {
            fireEvent(element, hoverActive ? 'mouseover' : 'mouseout');
        }
    }
}


/* *
 *
 *  Class
 *
 * */


/**
 * The LegendComponent class
 *
 * @private
 * @class
 * @name Highcharts.LegendComponent
 */
class LegendComponent extends AccessibilityComponent {


    /* *
     *
     *  Properties
     *
     * */

    public highlightedLegendItemIx: number = NaN;
    private proxyGroup: HTMLElement|null = null;


    /* *
     *
     *  Functions
     *
     * */


    /**
     * Init the component
     * @private
     */
    public init(): void {
        const component = this;
        this.recreateProxies();

        // Note: Chart could create legend dynamically, so events cannot be
        // tied to the component's chart's current legend.
        // @todo 1. attach component to created legends
        // @todo 2. move listeners to composition and access `this.component`
        this.addEvent(
            Legend as typeof LegendComponent.LegendComposition,
            'afterScroll',
            function (): void {
                if (this.chart === component.chart) {
                    component.proxyProvider.updateGroupProxyElementPositions(
                        'legend'
                    );
                    component.updateLegendItemProxyVisibility();
                    if (component.highlightedLegendItemIx > -1) {
                        this.chart.highlightLegendItem(
                            component.highlightedLegendItemIx
                        );
                    }
                }
            }
        );
        this.addEvent(Legend, 'afterPositionItem', function (
            e: AnyRecord
        ): void {
            if (this.chart === component.chart && this.chart.renderer) {
                component.updateProxyPositionForItem(e.item);
            }
        });
        this.addEvent(Legend, 'afterRender', function (): void { // #15902
            if (
                this.chart === component.chart &&
                this.chart.renderer &&
                component.recreateProxies()
            ) {
                syncTimeout(
                    (): void => component.proxyProvider
                        .updateGroupProxyElementPositions('legend'),
                    animObject(
                        pick(this.chart.renderer.globalAnimation, true)
                    ).duration
                );
            }
        });
    }


    /**
     * Update visibility of legend items when using paged legend
     * @private
     */
    public updateLegendItemProxyVisibility(): void {
        const chart = this.chart;
        const legend = chart.legend;
        const items = legend.allItems || [];
        const curPage = legend.currentPage || 1;
        const clipHeight = legend.clipHeight || 0;

        let legendItem;

        items.forEach((item): void => {
            if (item.a11yProxyElement) {
                const hasPages = legend.pages && legend.pages.length;
                const proxyEl = item.a11yProxyElement.element;

                let hide = false;

                legendItem = item.legendItem || {};

                if (hasPages) {
                    const itemPage = legendItem.pageIx || 0;
                    const y = legendItem.y || 0;
                    const h = legendItem.label ?
                        Math.round(legendItem.label.getBBox().height) :
                        0;
                    hide = y + h - legend.pages[itemPage] > clipHeight ||
                        itemPage !== curPage - 1;
                }

                if (hide) {
                    if (chart.styledMode) {
                        addClass(proxyEl, 'highcharts-a11y-invisible');
                    } else {
                        proxyEl.style.visibility = 'hidden';
                    }
                } else {
                    removeClass(proxyEl, 'highcharts-a11y-invisible');
                    proxyEl.style.visibility = '';
                }
            }
        });
    }


    /**
     * @private
     */
    public onChartRender(): void {
        if (!shouldDoLegendA11y(this.chart)) {
            this.removeProxies();
        }
    }


    /**
     * @private
     */
    public highlightAdjacentLegendPage(direction: number): void {
        const chart = this.chart;
        const legend = chart.legend;
        const curPageIx = legend.currentPage || 1;
        const newPageIx = curPageIx + direction;
        const pages = legend.pages || [];

        if (newPageIx > 0 && newPageIx <= pages.length) {
            let i = 0,
                res;
            for (const item of legend.allItems) {
                if (((item.legendItem || {}).pageIx || 0) + 1 === newPageIx) {
                    res = chart.highlightLegendItem(i);
                    if (res) {
                        this.highlightedLegendItemIx = i;
                    }
                }
                ++i;
            }
        }
    }


    /**
     * @private
     */
    public updateProxyPositionForItem(
        item: Legend.Item
    ): void {
        if (item.a11yProxyElement) {
            item.a11yProxyElement.refreshPosition();
        }
    }


    /**
     * Returns false if legend a11y is disabled and proxies were not created,
     * true otherwise.
     * @private
     */
    public recreateProxies(): boolean {
        const focusedElement = doc.activeElement;
        const proxyGroup = this.proxyGroup;
        const shouldRestoreFocus = focusedElement && proxyGroup &&
            proxyGroup.contains(focusedElement);

        this.removeProxies();

        if (shouldDoLegendA11y(this.chart)) {
            this.addLegendProxyGroup();
            this.proxyLegendItems();
            this.updateLegendItemProxyVisibility();
            this.updateLegendTitle();

            if (shouldRestoreFocus) {
                this.chart.highlightLegendItem(this.highlightedLegendItemIx);
            }
            return true;
        }
        return false;
    }


    /**
     * @private
     */
    public removeProxies(): void {
        this.proxyProvider.removeGroup('legend');
    }


    /**
     * @private
     */
    public updateLegendTitle(): void {
        const chart = this.chart;
        const legendTitle = stripHTMLTags(
            (
                chart.legend &&
                chart.legend.options.title &&
                chart.legend.options.title.text ||
                ''
            ).replace(/<br ?\/?>/g, ' '),
            chart.renderer.forExport
        );
        const legendLabel = chart.langFormat(
            'accessibility.legend.legendLabel' + (legendTitle ? '' : 'NoTitle'),
            {
                chart,
                legendTitle,
                chartTitle: getChartTitle(chart)
            }
        );

        this.proxyProvider.updateGroupAttrs('legend', {
            'aria-label': legendLabel
        });
    }


    /**
     * @private
     */
    public addLegendProxyGroup(): void {
        const a11yOptions = this.chart.options.accessibility;
        const groupRole = a11yOptions.landmarkVerbosity === 'all' ?
            'region' : null;

        this.proxyGroup = this.proxyProvider.addGroup('legend', 'ul', {
            // Filled by updateLegendTitle, to keep up to date without
            // recreating group
            'aria-label': '_placeholder_',
            role: groupRole as string
        });
    }


    /**
     * @private
     */
    public proxyLegendItems(): void {
        const component = this,
            items = (this.chart.legend || {}).allItems || [];

        let legendItem;

        items.forEach((item): void => {
            legendItem = item.legendItem || {};
            if (legendItem.label && legendItem.label.element) {
                component.proxyLegendItem(item);
            }
        });
    }


    /**
     * @private
     * @param {Highcharts.BubbleLegendItem|Point|Highcharts.Series} item
     */
    public proxyLegendItem(
        item: Legend.Item
    ): void {
        const legendItem = item.legendItem || {};

        if (!legendItem.label || !legendItem.group) {
            return;
        }

        const itemLabel = this.chart.langFormat(
            'accessibility.legend.legendItem',
            {
                chart: this.chart,
                itemName: stripHTMLTags(
                    (item as any).name,
                    this.chart.renderer.forExport
                ),
                item
            }
        );
        const attribs = {
            tabindex: -1,
            'aria-pressed': item.visible,
            'aria-label': itemLabel
        };
        // Considers useHTML
        const proxyPositioningElement = legendItem.group.div ?
            legendItem.label :
            legendItem.group;

        item.a11yProxyElement = this.proxyProvider.addProxyElement('legend', {
            click: legendItem.label as SVGElement,
            visual: proxyPositioningElement.element
        }, 'button', attribs);
    }


    /**
     * Get keyboard navigation handler for this component.
     * @private
     */
    public getKeyboardNavigation(): KeyboardNavigationHandler {
        const keys = this.keyCodes,
            component = this,
            chart = this.chart;

        return new KeyboardNavigationHandler(chart, {
            keyCodeMap: [
                [
                    [keys.left, keys.right, keys.up, keys.down],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number
                    ): number {
                        return component.onKbdArrowKey(this, keyCode);
                    }
                ],
                [
                    [keys.enter, keys.space],
                    function (
                        this: KeyboardNavigationHandler
                    ): number {
                        return component.onKbdClick(this);
                    }
                ],
                [
                    [keys.pageDown, keys.pageUp],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number
                    ): number {
                        const direction = keyCode === keys.pageDown ? 1 : -1;
                        component.highlightAdjacentLegendPage(direction);
                        return this.response.success;
                    }
                ]
            ],

            validate: function (): (boolean) {
                return component.shouldHaveLegendNavigation();
            },

            init: function (): void {
                chart.highlightLegendItem(0);
                component.highlightedLegendItemIx = 0;
            },

            terminate: function (): void {
                component.highlightedLegendItemIx = -1;
                chart.legend.allItems.forEach(
                    (item): void => setLegendItemHoverState(false, item)
                );
            }
        });
    }


    /**
     * Arrow key navigation
     * @private
     */
    public onKbdArrowKey(
        keyboardNavigationHandler: KeyboardNavigationHandler,
        key: number
    ): number {
        const
            { keyCodes: { left, up }, highlightedLegendItemIx, chart } = this,
            numItems = chart.legend.allItems.length,
            wrapAround = chart.options.accessibility
                .keyboardNavigation.wrapAround,
            direction = (key === left || key === up) ? -1 : 1,
            res = chart.highlightLegendItem(
                highlightedLegendItemIx + direction
            );

        if (res) {
            this.highlightedLegendItemIx += direction;
        } else if (wrapAround && numItems > 1) {
            this.highlightedLegendItemIx = direction > 0 ?
                0 : numItems - 1;
            chart.highlightLegendItem(this.highlightedLegendItemIx);
        }

        return keyboardNavigationHandler.response.success;
    }

    /**
     * @private
     * @param {Highcharts.KeyboardNavigationHandler} keyboardNavigationHandler
     * @return {number} Response code
     */
    public onKbdClick(
        keyboardNavigationHandler: KeyboardNavigationHandler
    ): number {
        const legendItem: Legend.Item = this.chart.legend.allItems[
            this.highlightedLegendItemIx
        ];

        if (legendItem && legendItem.a11yProxyElement) {
            legendItem.a11yProxyElement.click();
        }

        return keyboardNavigationHandler.response.success;
    }


    /**
     * @private
     */
    public shouldHaveLegendNavigation(): (boolean) {
        if (!shouldDoLegendA11y(this.chart)) {
            return false;
        }

        const chart = this.chart,
            legendOptions = chart.options.legend || {},
            legendA11yOptions: DeepPartial<(
                LegendAccessibilityOptions
            )> = (
                legendOptions.accessibility || {}
            );

        return !!(
            chart.legend.display &&
            legendA11yOptions.keyboardNavigation &&
            legendA11yOptions.keyboardNavigation.enabled
        );
    }


    /**
     * Clean up
     * @private
     */
    public destroy(): void {
        this.removeProxies();
    }
}


/* *
 *
 *  Class Prototype
 *
 * */


interface LegendComponent {
    chart: LegendComponent.ChartComposition;
}


/* *
 *
 *  Class Namespace
 *
 * */


namespace LegendComponent {


    /* *
     *
     *  Declarations
     *
     * */


    export declare class ChartComposition extends Accessibility.ChartComposition {
        highlightedLegendItemIx?: number;
        /** @requires modules/accessibility */
        highlightLegendItem(ix: number): boolean;
    }

    export declare class LegendComposition extends Legend {
        chart: ChartComposition;
    }


    /* *
     *
     *  Functions
     *
     * */


    /**
     * Highlight legend item by index.
     * @private
     */
    function chartHighlightLegendItem(
        this: ChartComposition,
        ix: number
    ): boolean {
        const items = this.legend.allItems;
        const oldIx = this.accessibility &&
                this.accessibility.components.legend.highlightedLegendItemIx;

        const itemToHighlight = items[ix],
            legendItem = itemToHighlight?.legendItem || {};

        if (itemToHighlight) {
            if (isNumber(oldIx) && items[oldIx]) {
                setLegendItemHoverState(false, items[oldIx]);
            }

            scrollLegendToItem(this.legend, ix);

            const legendItemProp = legendItem.label;
            const proxyBtn = itemToHighlight.a11yProxyElement &&
                itemToHighlight.a11yProxyElement.innerElement;
            if (legendItemProp && legendItemProp.element && proxyBtn) {
                this.setFocusToElement(legendItemProp as SVGElement, proxyBtn);
            }

            setLegendItemHoverState(true, itemToHighlight);

            return true;
        }
        return false;
    }


    /**
     * @private
     */
    export function compose(
        ChartClass: typeof Chart,
        LegendClass: typeof Legend
    ): void {
        const chartProto = ChartClass.prototype as ChartComposition;

        if (!chartProto.highlightLegendItem) {
            chartProto.highlightLegendItem = chartHighlightLegendItem;

            addEvent(
                LegendClass as typeof LegendComposition,
                'afterColorizeItem',
                legendOnAfterColorizeItem
            );
        }

    }


    /**
     * Keep track of pressed state for legend items.
     * @private
     */
    function legendOnAfterColorizeItem(
        this: LegendComposition,
        e: {
            item: Legend.Item;
            visible: (boolean|undefined);
        }
    ): void {
        const chart: Accessibility.ChartComposition = this.chart as any,
            a11yOptions = chart.options.accessibility,
            legendItem = e.item;

        if (a11yOptions.enabled && legendItem && legendItem.a11yProxyElement) {
            legendItem.a11yProxyElement.innerElement.setAttribute(
                'aria-pressed', e.visible ? 'true' : 'false'
            );
        }
    }

}


/* *
 *
 *  Default Export
 *
 * */


export default LegendComponent;
