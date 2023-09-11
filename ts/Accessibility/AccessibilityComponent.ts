/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Accessibility component class definition
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
import type EventCallback from '../Core/EventCallback';
import type { DOMElementType } from '../Core/Renderer/DOMElementType';
import type HTMLElement from '../Core/Renderer/HTML/HTMLElement';
import type KeyboardNavigationHandler from './KeyboardNavigationHandler';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import type ProxyProvider from './ProxyProvider';

import CU from './Utils/ChartUtilities.js';
const { fireEventOnWrappedOrUnwrappedElement } = CU;
import DOMElementProvider from './Utils/DOMElementProvider.js';
import EventProvider from './Utils/EventProvider.js';
import HU from './Utils/HTMLUtilities.js';
const { getFakeMouseEvent } = HU;
import U from '../Shared/Utilities.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * The AccessibilityComponent base class, representing a part of the chart that
 * has accessibility logic connected to it. This class can be inherited from to
 * create a custom accessibility component for a chart.
 *
 * Components should take care to destroy added elements and unregister event
 * handlers on destroy. This is handled automatically if using this.addEvent and
 * this.createElement.
 *
 * @sample highcharts/accessibility/custom-component
 *         Custom accessibility component
 *
 * @requires module:modules/accessibility
 * @class
 * @name Highcharts.AccessibilityComponent
 */
class AccessibilityComponent {

    /* *
     *
     *  Properties
     *
     * */

    public chart: Accessibility.ChartComposition = void 0 as any;
    public domElementProvider: DOMElementProvider = void 0 as any;
    public eventProvider: EventProvider = void 0 as any;
    public keyCodes: Record<string, number> = void 0 as any;
    public proxyProvider: ProxyProvider = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Initialize the class
     * @private
     * @param {Highcharts.Chart} chart The chart object
     * @param {Highcharts.ProxyProvider} proxyProvider The proxy provider of the accessibility module
     */
    public initBase(
        chart: Accessibility.ChartComposition,
        proxyProvider: ProxyProvider
    ): void {
        this.chart = chart;

        this.eventProvider = new EventProvider();
        this.domElementProvider = new DOMElementProvider();
        this.proxyProvider = proxyProvider;

        // Key code enum for common keys
        this.keyCodes = {
            left: 37,
            right: 39,
            up: 38,
            down: 40,
            enter: 13,
            space: 32,
            esc: 27,
            tab: 9,
            pageUp: 33,
            pageDown: 34,
            end: 35,
            home: 36
        };
    }


    /**
     * Add an event to an element and keep track of it for later removal.
     * See EventProvider for details.
     * @private
     */
    public addEvent<T>(
        el: (T|Class<T>),
        type: string,
        fn: (Function|EventCallback<T>),
        options?: U.EventOptions
    ): Function {
        return this.eventProvider.addEvent<T>(el, type, fn, options);
    }


    /**
     * Create an element and keep track of it for later removal.
     * See DOMElementProvider for details.
     * @private
     */
    public createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K,
        options?: ElementCreationOptions
    ): HTMLElementTagNameMap[K] {
        return this.domElementProvider.createElement(tagName, options);
    }


    /**
     * Fire a fake click event on an element. It is useful to have this on
     * AccessibilityComponent for users of custom components.
     */
    public fakeClickEvent(
        el: (HTMLElement|SVGElement|DOMElementType)
    ): void {
        const fakeEvent = getFakeMouseEvent('click');
        fireEventOnWrappedOrUnwrappedElement(el, fakeEvent);
    }


    /**
     * Remove traces of the component.
     * @private
     */
    public destroyBase(): void {
        this.domElementProvider.destroyCreatedElements();
        this.eventProvider.removeAddedEvents();
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface AccessibilityComponent {
    destroy(): void;
    getKeyboardNavigation(): (KeyboardNavigationHandler|Array<KeyboardNavigationHandler>);
    init(): void;
    onChartRender(): void;
    onChartUpdate(): void;
}

extend(
    AccessibilityComponent.prototype,
    /** @lends Highcharts.AccessibilityComponent */
    {
        /**
         * Called on component initialization.
         */
        init(): void {},

        /**
         * Get keyboard navigation handler for this component.
         * @private
         */
        getKeyboardNavigation: function (): void {} as any,

        /**
         * Called on updates to the chart, including options changes.
         * Note that this is also called on first render of chart.
         */
        onChartUpdate(): void {},

        /**
         * Called on every chart render.
         */
        onChartRender(): void {},

        /**
         * Called when accessibility is disabled or chart is destroyed.
         */
        destroy(): void {}
    }
);

/* *
 *
 *  Default Export
 *
 * */

export default AccessibilityComponent;
