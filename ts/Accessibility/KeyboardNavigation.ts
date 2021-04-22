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

import type Chart from '../Core/Chart/Chart';
import type {
    DOMElementType,
    HTMLDOMElement
} from '../Core/Renderer/DOMElementType';
import H from '../Core/Globals.js';
const {
    doc,
    win
} = H;
import U from '../Core/Utilities.js';
const {
    addEvent,
    fireEvent
} = U;

import HTMLUtilities from './Utils/HTMLUtilities.js';
const getElement = HTMLUtilities.getElement;

import EventProvider from './Utils/EventProvider.js';

declare module '../Core/Chart/ChartLike'{
    interface ChartLike {
        /** @requires modules/accessibility */
        dismissPopupContent(): void;
    }
}

/**
 * Internal types.
 * @private
 */
declare global {
    namespace Highcharts {
        class KeyboardNavigation {
            public constructor(
                chart: Chart,
                components: AccessibilityComponentsObject
            );
            public chart: Chart;
            public components: AccessibilityComponentsObject;
            public currentModuleIx: number;
            public eventProvider: EventProvider;
            public exitAnchor: DOMElementType;
            public exiting?: boolean;
            public isClickingChart?: boolean;
            public keyboardReset?: boolean;
            public modules: Array<KeyboardNavigationHandler>;
            public pointerIsOverChart?: boolean;
            public tabindexContainer: HTMLDOMElement;
            public addExitAnchorEventsToEl(element: DOMElementType): void;
            public createExitAnchor(): void;
            public destroy(): void;
            public init(
                chart: Chart,
                components: AccessibilityComponentsObject
            ): void;
            public makeElementAnExitAnchor(el: DOMElementType): void;
            public move(direction: number): boolean;
            public next(): boolean;
            public onFocus(e: FocusEvent): void;
            public onKeydown(ev: KeyboardEvent): void;
            public onMouseUp(): void;
            public prev(): boolean;
            public removeExitAnchor(): void;
            public update(order?: Array<string>): void;
            public updateExitAnchor(): void;
            public updateContainerTabindex(): void;
        }
    }
}

/* eslint-disable valid-jsdoc */

// Add event listener to document to detect ESC key press and dismiss
// hover/popup content.
addEvent(doc, 'keydown', (e: KeyboardEvent): void => {
    const keycode = e.which || e.keyCode;
    const esc = 27;
    if (keycode === esc && H.charts) {
        H.charts.forEach((chart): void => {
            if (chart && chart.dismissPopupContent) {
                chart.dismissPopupContent();
            }
        });
    }
});


/**
 * Dismiss popup content in chart, including export menu and tooltip.
 */
H.Chart.prototype.dismissPopupContent = function (): void {
    const chart = this;

    fireEvent(this, 'dismissPopupContent', {}, function (): void {
        if (chart.tooltip) {
            chart.tooltip.hide(0);
        }
        chart.hideExportMenu();
    });
};


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
 * @param {object} components
 *        Map of component names to AccessibilityComponent objects.
 * @name Highcharts.KeyboardNavigation
 */
function KeyboardNavigation(
    this: Highcharts.KeyboardNavigation,
    chart: Chart,
    components: Highcharts.AccessibilityComponentsObject
): void {
    this.init(chart, components);
}
KeyboardNavigation.prototype = {

    /**
     * Initialize the class
     * @private
     * @param {Highcharts.Chart} chart
     *        Chart object
     * @param {object} components
     *        Map of component names to AccessibilityComponent objects.
     */
    init: function (
        this: Highcharts.KeyboardNavigation,
        chart: Chart,
        components: Highcharts.AccessibilityComponentsObject
    ): void {
        const ep = this.eventProvider = new EventProvider();

        this.chart = chart;
        this.components = components;
        this.modules = [];
        this.currentModuleIx = 0;

        // Run an update to get all modules
        this.update();

        ep.addEvent(this.tabindexContainer, 'keydown',
            (e: KeyboardEvent): void => this.onKeydown(e));

        ep.addEvent(this.tabindexContainer, 'focus',
            (e: FocusEvent): void => this.onFocus(e));

        ['mouseup', 'touchend'].forEach((eventName): Function =>
            ep.addEvent(doc, eventName, (): void => this.onMouseUp())
        );

        ['mousedown', 'touchstart'].forEach((eventName): Function =>
            ep.addEvent(chart.renderTo, eventName, (): void => {
                this.isClickingChart = true;
            })
        );

        ep.addEvent(chart.renderTo, 'mouseover', (): void => {
            this.pointerIsOverChart = true;
        });

        ep.addEvent(chart.renderTo, 'mouseout', (): void => {
            this.pointerIsOverChart = false;
        });

        ep.addEvent(chart.accessibility, 'afterScreenReaderSectionsUpdated', (): void => {
            const a11yOptions = this.chart.options.accessibility;
            const keyboardOptions = a11yOptions && a11yOptions.keyboardNavigation;
            if (keyboardOptions && keyboardOptions.enabled) {
                this.updateExitAnchor();
            }
        });

        // Init first module
        if (this.modules.length) {
            this.modules[0].init(1);
        }
    },


    /**
     * Update the modules for the keyboard navigation.
     * @param {Array<string>} [order]
     *        Array specifying the tab order of the components.
     */
    update: function (
        this: Highcharts.KeyboardNavigation,
        order?: Array<(keyof Highcharts.AccessibilityComponentsObject)>
    ): void {
        var a11yOptions = this.chart.options.accessibility,
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
                modules: Array<Highcharts.KeyboardNavigationHandler>,
                componentName: keyof Highcharts.AccessibilityComponentsObject
            ): Array<Highcharts.KeyboardNavigationHandler> {
                var navModules = components[componentName].getKeyboardNavigation();
                return modules.concat(navModules);
            }, []);

            this.updateExitAnchor();

        } else {
            this.modules = [];
            this.currentModuleIx = 0;
            this.removeExitAnchor();
        }
    },


    /**
     * Function to run on container focus
     * @private
     * @param {global.FocusEvent} e Browser focus event.
     */
    onFocus: function (e: FocusEvent): void {
        const chart = this.chart;
        const focusComesFromChart = (
            e.relatedTarget &&
            chart.container.contains(e.relatedTarget as any)
        );

        // Init keyboard nav if tabbing into chart
        if (!this.exiting && !this.isClickingChart && !focusComesFromChart && this.modules[0]) {
            this.modules[0].init(1);
        }

        this.exiting = false;
    },


    /**
     * Reset chart navigation state if we click outside the chart and it's
     * not already reset.
     * @private
     */
    onMouseUp: function (this: Highcharts.KeyboardNavigation): void {
        delete this.isClickingChart;

        if (!this.keyboardReset && !this.pointerIsOverChart) {
            var chart = this.chart,
                curMod = this.modules &&
                    this.modules[this.currentModuleIx || 0];

            if (curMod && curMod.terminate) {
                curMod.terminate();
            }
            if (chart.focusElement) {
                chart.focusElement.removeFocusBorder();
            }
            this.currentModuleIx = 0;
            this.keyboardReset = true;
        }
    },


    /**
     * Function to run on keydown
     * @private
     * @param {global.KeyboardEvent} ev Browser keydown event.
     */
    onKeydown: function (
        this: Highcharts.KeyboardNavigation,
        ev: KeyboardEvent
    ): void {
        var e = ev || win.event,
            preventDefault,
            curNavModule = this.modules && this.modules.length &&
                this.modules[this.currentModuleIx];

        // Used for resetting nav state when clicking outside chart
        this.keyboardReset = false;

        // Used for sending focus out of the chart by the modules.
        this.exiting = false;

        // If there is a nav module for the current index, run it.
        // Otherwise, we are outside of the chart in some direction.
        if (curNavModule) {
            var response = curNavModule.run(e);
            if (response === curNavModule.response.success) {
                preventDefault = true;
            } else if (response === curNavModule.response.prev) {
                preventDefault = this.prev();
            } else if (response === curNavModule.response.next) {
                preventDefault = this.next();
            }
            if (preventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    },


    /**
     * Go to previous module.
     * @private
     */
    prev: function (this: Highcharts.KeyboardNavigation): boolean {
        return this.move(-1);
    },


    /**
     * Go to next module.
     * @private
     */
    next: function (this: Highcharts.KeyboardNavigation): boolean {
        return this.move(1);
    },


    /**
     * Move to prev/next module.
     * @private
     * @param {number} direction
     * Direction to move. +1 for next, -1 for prev.
     * @return {boolean}
     * True if there was a valid module in direction.
     */
    move: function (
        this: Highcharts.KeyboardNavigation,
        direction: number
    ): boolean {
        var curModule = this.modules && this.modules[this.currentModuleIx];
        if (curModule && curModule.terminate) {
            curModule.terminate(direction);
        }

        // Remove existing focus border if any
        if (this.chart.focusElement) {
            this.chart.focusElement.removeFocusBorder();
        }

        this.currentModuleIx += direction;
        var newModule = this.modules && this.modules[this.currentModuleIx];
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
            this.exitAnchor.focus();
        } else {
            this.tabindexContainer.focus();
        }

        return false;
    },


    /**
     * We use an exit anchor to move focus out of chart whenever we want, by
     * setting focus to this div and not preventing the default tab action. We
     * also use this when users come back into the chart by tabbing back, in
     * order to navigate from the end of the chart.
     * @private
     */
    updateExitAnchor: function (this: Highcharts.KeyboardNavigation): void {
        var endMarkerId = 'highcharts-end-of-chart-marker-' + this.chart.index,
            endMarker = getElement(endMarkerId);

        if (endMarker === this.exitAnchor) {
            return; // Nothing to update
        }

        this.removeExitAnchor();

        if (endMarker) {
            this.makeElementAnExitAnchor(endMarker);
            this.exitAnchor = endMarker;
        } else {
            this.createExitAnchor();
        }
    },


    /**
     * Chart container should have tabindex if navigation is enabled.
     * @private
     */
    updateContainerTabindex: function (this: Highcharts.KeyboardNavigation): void {
        const a11yOptions = this.chart.options.accessibility,
            keyboardOptions = a11yOptions && a11yOptions.keyboardNavigation,
            shouldHaveTabindex = !(keyboardOptions && keyboardOptions.enabled === false),
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
    },


    /**
     * @private
     */
    makeElementAnExitAnchor: function (
        this: Highcharts.KeyboardNavigation,
        el: DOMElementType
    ): void {
        const chartTabindex = this.tabindexContainer.getAttribute('tabindex') || 0;
        el.setAttribute('class', 'highcharts-exit-anchor');
        el.setAttribute('tabindex', chartTabindex);
        el.setAttribute('aria-hidden', false);

        // Handle focus
        this.addExitAnchorEventsToEl(el);
    },


    /**
     * Add new exit anchor to the chart.
     *
     * @private
     */
    createExitAnchor: function (this: Highcharts.KeyboardNavigation): void {
        var chart = this.chart,
            exitAnchor = this.exitAnchor = doc.createElement('div');

        chart.renderTo.appendChild(exitAnchor);
        this.makeElementAnExitAnchor(exitAnchor);
    },


    /**
     * @private
     */
    removeExitAnchor: function (this: Highcharts.KeyboardNavigation): void {
        if (this.exitAnchor && this.exitAnchor.parentNode) {
            this.exitAnchor.parentNode
                .removeChild(this.exitAnchor);
            delete this.exitAnchor;
        }
    },


    /**
     * @private
     */
    addExitAnchorEventsToEl: function (
        this: Highcharts.KeyboardNavigation,
        element: HTMLDOMElement
    ): void {
        var chart = this.chart,
            keyboardNavigation = this;

        this.eventProvider.addEvent(
            element,
            'focus',
            function (ev: MouseEvent): void {
                var e = ev || win.event,
                    curModule,
                    focusComesFromChart = (
                        e.relatedTarget &&
                        chart.container.contains(e.relatedTarget as any)
                    ),
                    comingInBackwards = !(
                        focusComesFromChart || keyboardNavigation.exiting
                    );

                if (comingInBackwards) {
                    keyboardNavigation.tabindexContainer.focus();
                    e.preventDefault();

                    // Move to last valid keyboard nav module
                    // Note the we don't run it, just set the index
                    if (
                        keyboardNavigation.modules &&
                        keyboardNavigation.modules.length
                    ) {
                        keyboardNavigation.currentModuleIx =
                            keyboardNavigation.modules.length - 1;
                        curModule = keyboardNavigation.modules[
                            keyboardNavigation.currentModuleIx
                        ];

                        // Validate the module
                        if (
                            curModule &&
                            curModule.validate && !curModule.validate()
                        ) {
                            // Invalid. Try moving backwards to find next valid.
                            keyboardNavigation.prev();
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
    },


    /**
     * Remove all traces of keyboard navigation.
     * @private
     */
    destroy: function (this: Highcharts.KeyboardNavigation): void {
        this.removeExitAnchor();
        this.eventProvider.removeAddedEvents();
        this.chart.container.removeAttribute('tabindex');
    }
};

export default KeyboardNavigation;
