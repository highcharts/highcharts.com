/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Main keyboard navigation handling.
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
import type {
    DOMElementType,
    HTMLDOMElement
} from '../Core/Renderer/DOMElementType';
import type KeyboardNavigationHandler from './KeyboardNavigationHandler';

import Chart from '../Core/Chart/Chart.js';
import H from '../Core/Globals.js';
const {
    doc,
    win
} = H;
import MenuComponent from './Components/MenuComponent.js';
import U from '../Shared/Utilities.js';

import EventProvider from './Utils/EventProvider.js';
import HTMLUtilities from './Utils/HTMLUtilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent, fireEvent } = EH;
const { getElement, simulatedEventTarget } = HTMLUtilities;

/* *
 *
 *  Class
 *
 * */

/**
 * The KeyboardNavigation class, containing the overall keyboard navigation
 * logic for the chart.
 *
 * @requires module:modules/accessibility
 *
 * @private
 * @class
 * @param {Highcharts.Chart} chart
 *        Chart object
 * @param {Object} components
 *        Map of component names to AccessibilityComponent objects.
 * @name Highcharts.KeyboardNavigation
 */
class KeyboardNavigation {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: Chart,
        components: Accessibility.ComponentsObject
    ) {
        this.init(chart, components);
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: Chart = void 0 as any;
    public components: Accessibility.ComponentsObject = void 0 as any;
    public currentModuleIx: number = NaN;
    public eventProvider: EventProvider = void 0 as any;
    public exitAnchor?: DOMElementType = void 0 as any;
    public exiting?: boolean;
    public isClickingChart?: boolean;
    public keyboardReset?: boolean;
    public modules: Array<KeyboardNavigationHandler> = [];
    public tabindexContainer: HTMLDOMElement = void 0 as any;
    public tabbingInBackwards?: boolean;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */


    /**
     * Initialize the class
     * @private
     * @param {Highcharts.Chart} chart
     *        Chart object
     * @param {Object} components
     *        Map of component names to AccessibilityComponent objects.
     */
    public init(
        chart: Chart,
        components: Accessibility.ComponentsObject
    ): void {
        const ep = this.eventProvider = new EventProvider();

        this.chart = chart;
        this.components = components;
        this.modules = [];
        this.currentModuleIx = 0;

        this.update();

        ep.addEvent(this.tabindexContainer, 'keydown',
            (e: KeyboardEvent): void => this.onKeydown(e));

        ep.addEvent(this.tabindexContainer, 'focus',
            (e: FocusEvent): void => this.onFocus(e));

        ['mouseup', 'touchend'].forEach((eventName): Function =>
            ep.addEvent(doc, eventName,
                (e): void => this.onMouseUp(e as MouseEvent))
        );

        ['mousedown', 'touchstart'].forEach((eventName): Function =>
            ep.addEvent(chart.renderTo, eventName, (): void => {
                this.isClickingChart = true;
            })
        );
    }


    /**
     * Update the modules for the keyboard navigation.
     * @param {Array<string>} [order]
     *        Array specifying the tab order of the components.
     */
    public update(
        order?: Array<(keyof Accessibility.ComponentsObject)>
    ): void {
        const a11yOptions = this.chart.options.accessibility,
            keyboardOptions = a11yOptions && a11yOptions.keyboardNavigation,
            components = this.components;

        this.updateContainerTabindex();

        if (
            keyboardOptions &&
            keyboardOptions.enabled &&
            order &&
            order.length
        ) {
            // We (still) have keyboard navigation. Update module list
            this.modules = order.reduce(function (
                modules: Array<KeyboardNavigationHandler>,
                componentName: keyof Accessibility.ComponentsObject
            ): Array<KeyboardNavigationHandler> {
                const navModules = components[componentName]
                    .getKeyboardNavigation();
                return modules.concat(navModules);
            }, []);

            this.updateExitAnchor();

        } else {
            this.modules = [];
            this.currentModuleIx = 0;
            this.removeExitAnchor();
        }
    }


    /**
     * We use an exit anchor to move focus out of chart whenever we want, by
     * setting focus to this div and not preventing the default tab action. We
     * also use this when users come back into the chart by tabbing back, in
     * order to navigate from the end of the chart.
     * @private
     */
    public updateExitAnchor(): void {
        const endMarkerId = `highcharts-end-of-chart-marker-${this.chart.index}`,
            endMarker = getElement(endMarkerId);

        this.removeExitAnchor();

        if (endMarker) {
            this.makeElementAnExitAnchor(endMarker);
            this.exitAnchor = endMarker;
        } else {
            this.createExitAnchor();
        }
    }


    /**
     * Move to prev/next module.
     * @private
     * @param {number} direction
     * Direction to move. +1 for next, -1 for prev.
     * @return {boolean}
     * True if there was a valid module in direction.
     */
    public move(
        direction: number
    ): boolean {
        const curModule = this.modules && this.modules[this.currentModuleIx];
        if (curModule && curModule.terminate) {
            curModule.terminate(direction);
        }

        // Remove existing focus border if any
        if (this.chart.focusElement) {
            this.chart.focusElement.removeFocusBorder();
        }

        this.currentModuleIx += direction;
        const newModule = this.modules && this.modules[this.currentModuleIx];
        if (newModule) {
            if (newModule.validate && !newModule.validate()) {
                return this.move(direction); // Invalid module, recurse
            }
            if (newModule.init) {
                newModule.init(direction); // Valid module, init it
                return true;
            }
        }

        // No module
        this.currentModuleIx = 0; // Reset counter

        // Set focus to chart or exit anchor depending on direction
        this.exiting = true;
        if (direction > 0) {
            this.exitAnchor && this.exitAnchor.focus();
        } else {
            this.tabindexContainer.focus();
        }

        return false;
    }


    /**
     * Function to run on container focus
     * @private
     * @param {global.FocusEvent} e Browser focus event.
     */
    private onFocus(e: FocusEvent): void {
        const chart = this.chart,
            focusComesFromChart = (
                e.relatedTarget &&
                chart.container.contains(e.relatedTarget as any)
            ),
            a11yOptions = chart.options.accessibility,
            keyboardOptions = a11yOptions && a11yOptions.keyboardNavigation,
            enabled = keyboardOptions && keyboardOptions.enabled;

        // Init keyboard nav if tabbing into chart
        if (
            enabled &&
            !this.exiting &&
            !this.tabbingInBackwards &&
            !this.isClickingChart &&
            !focusComesFromChart
        ) {
            const ix = this.getFirstValidModuleIx();
            if (ix !== null) {
                this.currentModuleIx = ix;
                this.modules[ix].init(1);
            }
        }

        this.exiting = false;
    }


    /**
     * Reset chart navigation state if we mouse click and it's not already
     * reset. Reset fully if outside the chart, otherwise just hide focus
     * indicator.
     * @private
     */
    private onMouseUp(e: MouseEvent): void {
        delete this.isClickingChart;

        if (
            !this.keyboardReset &&
            e.relatedTarget !== simulatedEventTarget
        ) {
            const chart = this.chart;

            if (
                !e.target ||
                !chart.container.contains(e.target as HTMLElement)
            ) {
                const curMod = this.modules &&
                        this.modules[this.currentModuleIx || 0];
                if (curMod && curMod.terminate) {
                    curMod.terminate();
                }
                this.currentModuleIx = 0;
            }

            if (chart.focusElement) {
                chart.focusElement.removeFocusBorder();
                delete chart.focusElement;
            }

            this.keyboardReset = true;
        }
    }


    /**
     * Function to run on keydown
     * @private
     * @param {global.KeyboardEvent} ev Browser keydown event.
     */
    private onKeydown(
        ev: KeyboardEvent
    ): void {
        const e = ev || win.event,
            curNavModule = (
                this.modules &&
                this.modules.length &&
                this.modules[this.currentModuleIx]
            );

        let preventDefault;

        // Used for resetting nav state when clicking outside chart
        this.keyboardReset = false;

        // Used for sending focus out of the chart by the modules.
        this.exiting = false;

        // If there is a nav module for the current index, run it.
        // Otherwise, we are outside of the chart in some direction.
        if (curNavModule) {
            const response = curNavModule.run(e);
            if (response === curNavModule.response.success) {
                preventDefault = true;
            } else if (response === curNavModule.response.prev) {
                preventDefault = this.move(-1);
            } else if (response === curNavModule.response.next) {
                preventDefault = this.move(1);
            }
            if (preventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }


    /**
     * Chart container should have tabindex if navigation is enabled.
     * @private
     */
    private updateContainerTabindex(): void {
        const a11yOptions = this.chart.options.accessibility,
            keyboardOptions = a11yOptions && a11yOptions.keyboardNavigation,
            shouldHaveTabindex = !(
                keyboardOptions && keyboardOptions.enabled === false
            ),
            chart = this.chart,
            container = chart.container;

        let tabindexContainer;
        if (chart.renderTo.hasAttribute('tabindex')) {
            container.removeAttribute('tabindex');
            tabindexContainer = chart.renderTo;
        } else {
            tabindexContainer = container;
        }

        this.tabindexContainer = tabindexContainer;

        const curTabindex = tabindexContainer.getAttribute('tabindex');
        if (shouldHaveTabindex && !curTabindex) {
            tabindexContainer.setAttribute('tabindex', '0');
        } else if (!shouldHaveTabindex) {
            chart.container.removeAttribute('tabindex');
        }
    }


    /**
     * Add new exit anchor to the chart.
     * @private
     */
    private createExitAnchor(): void {
        const chart = this.chart,
            exitAnchor = this.exitAnchor = doc.createElement('div');

        chart.renderTo.appendChild(exitAnchor);
        this.makeElementAnExitAnchor(exitAnchor);
    }


    /**
     * Add attributes and events to an element to make it function as an
     * exit anchor.
     * @private
     */
    private makeElementAnExitAnchor(
        el: DOMElementType
    ): void {
        const chartTabindex = this.tabindexContainer.getAttribute(
            'tabindex'
        ) || 0;
        el.setAttribute('class', 'highcharts-exit-anchor');
        el.setAttribute('tabindex', chartTabindex);
        el.setAttribute('aria-hidden', false);

        // Handle focus
        this.addExitAnchorEventsToEl(el);
    }


    /**
     * Destroy the exit anchor and remove from DOM.
     * @private
     */
    private removeExitAnchor(): void {
        if (this.exitAnchor && this.exitAnchor.parentNode) {
            this.exitAnchor.parentNode.removeChild(this.exitAnchor);
            delete this.exitAnchor;
        }
    }


    /**
     * Add focus handler to exit anchor element.
     * @private
     */
    private addExitAnchorEventsToEl(
        element: DOMElementType
    ): void {
        const chart = this.chart,
            keyboardNavigation = this;

        this.eventProvider.addEvent(
            element,
            'focus',
            function (ev: MouseEvent): void {
                const e = ev || win.event,
                    focusComesFromChart = (
                        e.relatedTarget &&
                        chart.container.contains(e.relatedTarget as any)
                    ),
                    comingInBackwards = !(
                        focusComesFromChart || keyboardNavigation.exiting
                    );

                if (chart.focusElement) {
                    delete chart.focusElement;
                }

                if (comingInBackwards) {
                    // Focus the container instead
                    keyboardNavigation.tabbingInBackwards = true;
                    keyboardNavigation.tabindexContainer.focus();
                    delete keyboardNavigation.tabbingInBackwards;
                    e.preventDefault();

                    // Move to last valid keyboard nav module
                    // Note the we don't run it, just set the index
                    if (
                        keyboardNavigation.modules &&
                        keyboardNavigation.modules.length
                    ) {
                        keyboardNavigation.currentModuleIx =
                            keyboardNavigation.modules.length - 1;
                        const curModule = keyboardNavigation.modules[
                            keyboardNavigation.currentModuleIx
                        ];

                        // Validate the module
                        if (
                            curModule &&
                            curModule.validate && !curModule.validate()
                        ) {
                            // Invalid. Try moving backwards to find next valid.
                            keyboardNavigation.move(-1);
                        } else if (curModule) {
                            // We have a valid module, init it
                            curModule.init(-1);
                        }
                    }
                } else {
                    // Don't skip the next focus, we only skip once.
                    keyboardNavigation.exiting = false;
                }
            }
        );
    }


    /**
     * Get the ix of the first module that either does not require validation or
     * validates positively.
     * @private
     */
    private getFirstValidModuleIx(): number|null {
        const len = this.modules.length;
        for (let i = 0; i < len; ++i) {
            const mod = this.modules[i];
            if (!mod.validate || mod.validate()) {
                return i;
            }
        }
        return null;
    }


    /**
     * Remove all traces of keyboard navigation.
     * @private
     */
    public destroy(): void {
        this.removeExitAnchor();
        this.eventProvider.removeAddedEvents();
        this.chart.container.removeAttribute('tabindex');
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace KeyboardNavigation {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class ChartComposition extends MenuComponent.ChartComposition {
        dismissPopupContent(): void;
    }

    /* *
     *
     *  Construction
     *
     * */

    const composedMembers: Array<unknown> = [];

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Composition function.
     * @private
     */
    export function compose<T extends typeof Chart>(
        ChartClass: T
    ): (T&typeof ChartComposition) {
        MenuComponent.compose(ChartClass);

        if (pushUnique(composedMembers, ChartClass)) {
            const chartProto = ChartClass.prototype as ChartComposition;

            chartProto.dismissPopupContent = chartDismissPopupContent;
        }

        if (pushUnique(composedMembers, doc)) {
            addEvent(doc, 'keydown', documentOnKeydown);
        }

        return ChartClass as (T&typeof ChartComposition);
    }

    /**
     * Dismiss popup content in chart, including export menu and tooltip.
     * @private
     */
    function chartDismissPopupContent(
        this: ChartComposition
    ): void {
        const chart = this;

        fireEvent(this, 'dismissPopupContent', {}, function (): void {
            if (chart.tooltip) {
                chart.tooltip.hide(0);
            }
            chart.hideExportMenu();
        });
    }

    /**
     * Add event listener to document to detect ESC key press and dismiss
     * hover/popup content.
     * @private
     */
    function documentOnKeydown(e: KeyboardEvent): void {
        const keycode = e.which || e.keyCode;
        const esc = 27;
        if (keycode === esc && H.charts) {
            H.charts.forEach((chart): void => {
                if (chart && (chart as ChartComposition).dismissPopupContent) {
                    (chart as ChartComposition).dismissPopupContent();
                }
            });
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default KeyboardNavigation;
