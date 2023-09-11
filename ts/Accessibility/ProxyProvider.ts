/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Proxy elements are used to shadow SVG elements in HTML for assistive
 *  technology, such as screen readers or voice input software.
 *
 *  The ProxyProvider keeps track of all proxy elements of the a11y module,
 *  and updating their order and positioning.
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

import type Accessibility from './Accessibility';
import type { HTMLDOMElement } from '../Core/Renderer/DOMElementType';
import type HTMLAttributes from '../Core/Renderer/HTML/HTMLAttributes';
import type { NullableHTMLAttributes } from './ProxyElement';

import H from '../Core/Globals.js';
const { doc } = H;
import U from '../Shared/Utilities.js';
const {
    attr,
    css
} = U;

import CU from './Utils/ChartUtilities.js';
const { unhideChartElementFromAT } = CU;
import DOMElementProvider from './Utils/DOMElementProvider.js';
import HU from './Utils/HTMLUtilities.js';
const {
    removeElement,
    removeChildNodes
} = HU;
import ProxyElement from './ProxyElement.js';


/**
 *
 *  Declarations
 *
 * */

interface ProxyGroup {
    proxyContainerElement: HTMLDOMElement;
    groupElement: HTMLDOMElement;
    type: ProxyElement.GroupType;
    proxyElements: ProxyElement[];
}


/* *
 *
 *  Class
 *
 * */

/**
 * Keeps track of all proxy elements and proxy groups.
 *
 * @private
 * @class
 */
class ProxyProvider {

    /* *
     *
     *  Properties
     *
     * */

    private afterChartProxyPosContainer: HTMLDOMElement;
    private beforeChartProxyPosContainer: HTMLDOMElement;
    private domElementProvider: DOMElementProvider;
    private groupOrder: string[];
    private groups: Record<string, ProxyGroup|undefined>;

    /* *
     *
     *  Constructor
     *
     * */

    constructor(private chart: Accessibility.ChartComposition) {
        this.domElementProvider = new DOMElementProvider();
        this.groups = {};
        this.groupOrder = [];

        this.beforeChartProxyPosContainer = this.createProxyPosContainer(
            'before'
        );
        this.afterChartProxyPosContainer = this.createProxyPosContainer(
            'after'
        );

        this.update();
    }

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable */

    /**
     * Add a new proxy element to a group, proxying a target control.
     */
    public addProxyElement(
        groupKey: string,
        target: ProxyElement.Target,
        attributes?: NullableHTMLAttributes
    ): ProxyElement {
        const group = this.groups[groupKey];
        if (!group) {
            throw new Error('ProxyProvider.addProxyElement: Invalid group key ' + groupKey);
        }

        const proxy = new ProxyElement(this.chart, target, group.type, attributes);

        group.proxyContainerElement.appendChild(proxy.element);
        group.proxyElements.push(proxy);

        return proxy;
    }


    /**
     * Create a group that will contain proxy elements. The group order is
     * automatically updated according to the last group order keys.
     * 
     * Returns the added group.
     */
    public addGroup(
        groupKey: string,
        groupType: ProxyElement.GroupType,
        attributes?: HTMLAttributes
    ): HTMLElement {
        const existingGroup = this.groups[groupKey];
        if (existingGroup) {
            return existingGroup.groupElement;
        }

        const proxyContainer = this.domElementProvider.createElement(groupType);

        // If we want to add a role to the group, and still use e.g.
        // a list group, we need a wrapper div.
        let groupElement;
        if (attributes && attributes.role && groupType !== 'div') {
            groupElement = this.domElementProvider.createElement('div');
            groupElement.appendChild(proxyContainer);
        } else {
            groupElement = proxyContainer;
        }

        groupElement.className = 'highcharts-a11y-proxy-group highcharts-a11y-proxy-group-' +
            groupKey.replace(/\W/g, '-');

        this.groups[groupKey] = {
            proxyContainerElement: proxyContainer,
            groupElement,
            type: groupType,
            proxyElements: []
        };

        attr(groupElement, attributes || {});

        if (groupType === 'ul') {
            proxyContainer.setAttribute('role', 'list'); // Needed for webkit
        }

        // Add the group to the end by default, and perhaps then we
        // won't have to reorder the whole set of groups.
        this.afterChartProxyPosContainer.appendChild(groupElement);

        this.updateGroupOrder(this.groupOrder);

        return groupElement;
    }


    /**
     * Update HTML attributes of a group.
     */
    public updateGroupAttrs(
        groupKey: string,
        attributes: HTMLAttributes
    ): void {
        const group = this.groups[groupKey];
        if (!group) {
            throw new Error('ProxyProvider.updateGroupAttrs: Invalid group key ' + groupKey);
        }
        attr(group.groupElement, attributes);
    }


    /**
     * Reorder the proxy groups.
     *
     * The group key "series" refers to the chart's data points / <svg> element.
     * This is so that the keyboardNavigation.order option can be used to
     * determine the proxy group order.
     */
    public updateGroupOrder(groupKeys: string[]): void {
        // Store so that we can update order when a new group is created
        this.groupOrder = groupKeys.slice();

        // Don't unnecessarily reorder, because keyboard focus is lost
        if (this.isDOMOrderGroupOrder()) {
            return;
        }

        const seriesIx = groupKeys.indexOf('series');
        const beforeKeys = seriesIx > -1 ? groupKeys.slice(0, seriesIx) : groupKeys;
        const afterKeys = seriesIx > -1 ? groupKeys.slice(seriesIx + 1) : [];

        // Store focused element since it will be lost when reordering
        const activeElement = doc.activeElement;

        // Add groups to correct container
        ['before', 'after'].forEach((pos): void => {
            const posContainer = this[
                pos === 'before' ?
                    'beforeChartProxyPosContainer' :
                    'afterChartProxyPosContainer'
            ];
            const keys = pos === 'before' ? beforeKeys : afterKeys;

            removeChildNodes(posContainer);

            keys.forEach((groupKey): void => {
                const group = this.groups[groupKey];
                if (group) {
                    posContainer.appendChild(group.groupElement);
                }
            });
        });

        // Attempt to restore focus after reordering, but note that this may
        // cause screen readers re-announcing the button.
        if (
            (this.beforeChartProxyPosContainer.contains(activeElement) ||
            this.afterChartProxyPosContainer.contains(activeElement)) &&
            activeElement && (activeElement as HTMLElement).focus
        ) {
            (activeElement as HTMLElement).focus();
        }
    }


    /**
     * Remove all proxy elements in a group
     */
    public clearGroup(groupKey: string): void {
        const group = this.groups[groupKey];
        if (!group) {
            throw new Error('ProxyProvider.clearGroup: Invalid group key ' + groupKey);
        }
        removeChildNodes(group.proxyContainerElement);
    }


    /**
     * Remove a group from the DOM and from the proxy provider's group list.
     * All child elements are removed.
     * If the group does not exist, nothing happens.
     */
    public removeGroup(groupKey: string): void {
        const group = this.groups[groupKey];
        if (group) {
            removeElement(group.groupElement);
            delete this.groups[groupKey];
        }
    }


    /**
     * Update the position and order of all proxy groups and elements
     */
    public update(): void {
        this.updatePosContainerPositions();
        this.updateGroupOrder(this.groupOrder);
        this.updateProxyElementPositions();
    }


    /**
     * Update all proxy element positions
     */
    public updateProxyElementPositions(): void {
        Object.keys(this.groups).forEach(this.updateGroupProxyElementPositions.bind(this));
    }


    /**
     * Update a group's proxy elements' positions.
     * If the group does not exist, nothing happens.
     */
    public updateGroupProxyElementPositions(groupKey: string): void {
        const group = this.groups[groupKey];
        if (group) {
            group.proxyElements.forEach((el): void => el.refreshPosition());
        }
    }


    /**
     * Remove all added elements
     */
    public destroy(): void {
        this.domElementProvider.destroyCreatedElements();
    }


    // -------------------------- private ------------------------------------


    /**
     * Create and return a pos container element (the overall containers for
     * the proxy groups).
     */
    private createProxyPosContainer(classNamePostfix?: string): HTMLDivElement {
        const el = this.domElementProvider.createElement('div');
        el.setAttribute('aria-hidden', 'false');
        el.className = 'highcharts-a11y-proxy-container' + (classNamePostfix ? '-' + classNamePostfix : '');
        css(el, {
            top: '0',
            left: '0'
        });

        if (!this.chart.styledMode) {
            el.style.whiteSpace = 'nowrap';
            el.style.position = 'absolute';
        }

        return el;
    }


    /**
     * Get an array of group keys that corresponds to the current group order
     * in the DOM.
     */
    private getCurrentGroupOrderInDOM(): string[] {
        const getGroupKeyFromElement = (el: Element): string|undefined => {
            const allGroups = Object.keys(this.groups);
            let i = allGroups.length;
            while (i--) {
                const groupKey = allGroups[i];
                const group = this.groups[groupKey];
                if (group && el === group.groupElement) {
                    return groupKey;
                }
            }
        };
        const getChildrenGroupOrder = (el: HTMLDOMElement): string[] => {
            const childrenOrder: string[] = [];
            const children = el.children;
            for (let i = 0; i < children.length; ++i) {
                const groupKey = getGroupKeyFromElement(children[i]);
                if (groupKey) {
                    childrenOrder.push(groupKey);
                }
            }
            return childrenOrder;
        };
        const before = getChildrenGroupOrder(this.beforeChartProxyPosContainer);
        const after = getChildrenGroupOrder(this.afterChartProxyPosContainer);
        before.push('series');
        return before.concat(after);
    }


    /**
     * Check if the current DOM order matches the current group order, so that
     * a reordering/update is unnecessary.
     */
    private isDOMOrderGroupOrder(): boolean {
        const domOrder = this.getCurrentGroupOrderInDOM();
        const groupOrderWithGroups = this.groupOrder.filter((x): boolean => x === 'series' || !!this.groups[x]);

        let i = domOrder.length;
        if (i !== groupOrderWithGroups.length) {
            return false;
        }
        while (i--) {
            if (domOrder[i] !== groupOrderWithGroups[i]) {
                return false;
            }
        }
        return true;
    }


    /**
     * Update the DOM positions of the before/after proxy
     * positioning containers for the groups.
     */
    private updatePosContainerPositions(): void {
        const chart = this.chart;

        // If exporting, don't add these containers to the DOM.
        if (chart.renderer.forExport) {
            return; 
        }

        const rendererSVGEl = chart.renderer.box;
        chart.container.insertBefore(
            this.afterChartProxyPosContainer,
            rendererSVGEl.nextSibling
        );
        chart.container.insertBefore(
            this.beforeChartProxyPosContainer,
            rendererSVGEl
        );
        unhideChartElementFromAT(this.chart, this.afterChartProxyPosContainer);
        unhideChartElementFromAT(this.chart, this.beforeChartProxyPosContainer);
    }
}

/* *
 *
 *  Export Default
 *
 * */

export default ProxyProvider;
