/* *
 *
 *  Popup generator for Stock tools
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

import type AnnotationChart from '../AnnotationChart';
import type { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType';
import type Popup from './Popup';

import H from '../../../Core/Globals.js';
const { doc } = H;
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
const { addEvent } = EH;
const {
    createElement
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * Create tab content
 * @private
 * @return {HTMLDOMElement} - created HTML tab-content element
 */
function addContentItem(this: Popup): HTMLDOMElement {
    const popupDiv = this.container;

    return createElement(
        'div',
        {
            // #12100
            className: 'highcharts-tab-item-content highcharts-no-mousewheel'
        },
        void 0,
        popupDiv
    );
}

/**
 * Create tab menu item
 * @private
 * @param {string} tabName
 * `add` or `edit`
 * @param {number} [disableTab]
 * Disable tab when 0
 * @return {Highcharts.HTMLDOMElement}
 * Created HTML tab-menu element
 */
function addMenuItem(
    this: Popup,
    tabName: string,
    disableTab?: number
): HTMLDOMElement {
    const popupDiv = this.container,
        lang = this.lang;

    let className = 'highcharts-tab-item';

    if (disableTab === 0) {
        className += ' highcharts-tab-disabled';
    }

    // tab 1
    const menuItem = createElement(
        'span',
        {
            className
        },
        void 0,
        popupDiv
    );
    menuItem.appendChild(
        doc.createTextNode(lang[tabName + 'Button'] || tabName)
    );

    menuItem.setAttribute('highcharts-data-tab-type', tabName);

    return menuItem;
}

/**
 * Set all tabs as invisible.
 * @private
 */
function deselectAll(this: Popup): void {
    const popupDiv = this.container,
        tabs = popupDiv
            .querySelectorAll('.highcharts-tab-item'),
        tabsContent = popupDiv
            .querySelectorAll('.highcharts-tab-item-content');

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('highcharts-tab-item-active');
        tabsContent[i].classList.remove('highcharts-tab-item-show');
    }
}

/**
 * Init tabs. Create tab menu items, tabs containers
 * @private
 * @param {Highcharts.Chart} chart
 * Reference to current chart
 */
function init(
    this: Popup,
    chart: AnnotationChart
): void {

    if (!chart) {
        return;
    }

    const indicatorsCount = this.indicators.getAmount.call(chart);

    // create menu items
    const firstTab = addMenuItem.call(this, 'add'); // run by default
    addMenuItem.call(this, 'edit', indicatorsCount);

    // create tabs containers
    addContentItem.call(this);
    addContentItem.call(this);

    switchTabs.call(this, indicatorsCount);

    // activate first tab
    selectTab.call(this, firstTab, 0);
}

/**
 * Set tab as visible
 * @private
 * @param {globals.Element} - current tab
 * @param {number} - Index of tab in menu
 */
function selectTab(
    this: Popup,
    tab: Element,
    index: number
): void {
    const allTabs = this.container
        .querySelectorAll('.highcharts-tab-item-content');

    tab.className += ' highcharts-tab-item-active';
    allTabs[index].className += ' highcharts-tab-item-show';
}

/**
 * Add click event to each tab
 * @private
 * @param {number} disableTab
 * Disable tab when 0
 */
function switchTabs(
    this: Popup,
    disableTab: number
): void {
    const popup = this,
        popupDiv = this.container,
        tabs = popupDiv.querySelectorAll('.highcharts-tab-item');

    tabs.forEach((tab: Element, i: number): void => {

        if (
            disableTab === 0 &&
            tab.getAttribute('highcharts-data-tab-type') === 'edit'
        ) {
            return;
        }

        ['click', 'touchstart'].forEach((
            eventName: string
        ): void => {
            addEvent(tab, eventName, function (): void {

                // reset class on other elements
                deselectAll.call(popup);
                selectTab.call(popup, this, i);
            });
        });
    });
}

/* *
 *
 *  Default Export
 *
 * */

const PopupTabs = {
    init
};

export default PopupTabs;
