/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Accessibility component for the range selector.
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
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import RangeSelector from '../../Stock/RangeSelector/RangeSelector.js';
import AccessibilityComponent from '../AccessibilityComponent.js';
import ChartUtilities from '../Utils/ChartUtilities.js';
const {
    unhideChartElementFromAT,
    getAxisRangeDescription
} = ChartUtilities;
import Announcer from '../Utils/Announcer.js';
import Chart from '../../Core/Chart/Chart.js';
import KeyboardNavigationHandler from '../KeyboardNavigationHandler.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;
const {
    attr
} = U;


/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */


/**
 * Do we want date input navigation
 * @private
 */
function shouldRunInputNavigation(
    chart: Chart
): boolean {
    return Boolean(
        chart.rangeSelector &&
        chart.rangeSelector.inputGroup &&
        chart.rangeSelector.inputGroup.element.style.visibility !== 'hidden' &&
        (chart.options.rangeSelector as any).inputEnabled !== false &&
        chart.rangeSelector.minInput &&
        chart.rangeSelector.maxInput
    );
}


/* *
 *
 *  Class
 *
 * */


/**
 * The RangeSelectorComponent class
 *
 * @private
 * @class
 * @name Highcharts.RangeSelectorComponent
 */
class RangeSelectorComponent extends AccessibilityComponent {


    /* *
     *
     *  Properties
     *
     * */


    public announcer: Announcer = void 0 as any;

    public removeDropdownKeydownHandler?: Function;

    public removeInputKeydownHandler?: Function;


    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */


    /**
     * Init the component
     * @private
     */
    public init(): void {
        const chart = this.chart;
        this.announcer = new Announcer(chart, 'polite');
    }


    /**
     * Called on first render/updates to the chart, including options changes.
     */
    public onChartUpdate(): void {
        const chart = this.chart,
            component = this,
            rangeSelector = chart.rangeSelector;

        if (!rangeSelector) {
            return;
        }

        this.updateSelectorVisibility();
        this.setDropdownAttrs();

        if (
            rangeSelector.buttons &&
            rangeSelector.buttons.length
        ) {
            rangeSelector.buttons.forEach((button): void => {
                component.setRangeButtonAttrs(button);
            });
        }

        // Make sure input boxes are accessible and focusable
        if (rangeSelector.maxInput && rangeSelector.minInput) {
            ['minInput', 'maxInput'].forEach(function (
                key: string,
                i: number
            ): void {
                const input = (rangeSelector as any)[key];
                if (input) {
                    unhideChartElementFromAT(chart, input);
                    component.setRangeInputAttrs(
                        input,
                        'accessibility.rangeSelector.' + (i ? 'max' : 'min') +
                            'InputLabel'
                    );
                }
            });
        }
    }


    /**
     * Hide buttons from AT when showing dropdown, and vice versa.
     * @private
     */
    public updateSelectorVisibility(): void {
        const chart = this.chart;
        const rangeSelector = chart.rangeSelector;
        const dropdown = (
            rangeSelector &&
            rangeSelector.dropdown
        );
        const buttons = (
            rangeSelector &&
            rangeSelector.buttons ||
            []
        );
        const hideFromAT = (el: Element): void => el.setAttribute(
            'aria-hidden',
            true
        );

        if (
            rangeSelector &&
            rangeSelector.hasVisibleDropdown &&
            dropdown
        ) {
            unhideChartElementFromAT(chart, dropdown);
            buttons.forEach((btn): void => hideFromAT(btn.element));
        } else {
            if (dropdown) {
                hideFromAT(dropdown);
            }
            buttons.forEach((btn): void => unhideChartElementFromAT(
                chart,
                btn.element
            ));
        }
    }


    /**
     * Set accessibility related attributes on dropdown element.
     * @private
     */
    public setDropdownAttrs(): void {
        const chart = this.chart;
        const dropdown = (
            chart.rangeSelector &&
            chart.rangeSelector.dropdown
        );
        if (dropdown) {
            const label = chart.langFormat(
                'accessibility.rangeSelector.dropdownLabel',
                { rangeTitle: chart.options.lang.rangeSelectorZoom }
            );
            dropdown.setAttribute('aria-label', label);
            dropdown.setAttribute('tabindex', -1);
        }
    }


    /**
     * Set attrs for a range button
     * @private
     */
    public setRangeButtonAttrs(
        button: SVGElement
    ): void {
        attr(button.element, {
            tabindex: -1,
            role: 'button'
        });
    }


    /**
     * Set attrs for a date input
     * @private
     */
    public setRangeInputAttrs(
        input: HTMLDOMElement,
        langKey: string
    ): void {
        const chart = this.chart;

        attr(input, {
            tabindex: -1,
            'aria-label': chart.langFormat(langKey, { chart: chart })
        });
    }


    /**
     * Handle arrow key nav
     * @private
     */
    public onButtonNavKbdArrowKey(
        keyboardNavigationHandler: KeyboardNavigationHandler,
        keyCode: number
    ): number {
        const response = keyboardNavigationHandler.response,
            keys = this.keyCodes,
            chart = this.chart,
            wrapAround = chart.options.accessibility
                .keyboardNavigation.wrapAround,
            direction = (
                keyCode === keys.left || keyCode === keys.up
            ) ? -1 : 1,
            didHighlight = chart.highlightRangeSelectorButton(
                (chart.highlightedRangeSelectorItemIx as any) + direction
            );

        if (!didHighlight) {
            if (wrapAround) {
                keyboardNavigationHandler.init(direction);
                return response.success;
            }
            return response[direction > 0 ? 'next' : 'prev'];
        }

        return response.success;
    }


    /**
     * Handle keyboard click
     * @private
     */
    public onButtonNavKbdClick(
        keyboardNavigationHandler: KeyboardNavigationHandler
    ): number {
        const response = keyboardNavigationHandler.response,
            chart = this.chart,
            wasDisabled = chart.oldRangeSelectorItemState === 3;

        if (!wasDisabled) {
            this.fakeClickEvent(
                (chart.rangeSelector as any).buttons[
                    chart.highlightedRangeSelectorItemIx as any
                ].element
            );
        }

        return response.success;
    }


    /**
     * Called whenever a range selector button has been clicked, either by
     * mouse, touch, or kbd/voice/other.
     * @private
     */
    public onAfterBtnClick(): void {
        const chart = this.chart;
        const axisRangeDescription = getAxisRangeDescription(chart.xAxis[0]);
        const announcement = chart.langFormat(
            'accessibility.rangeSelector.clickButtonAnnouncement',
            { chart, axisRangeDescription }
        );

        if (announcement) {
            this.announcer.announce(announcement);
        }
    }


    /**
     * Handle move between input elements with Tab key
     * @private
     */
    public onInputKbdMove(
        direction: number
    ): boolean {
        const chart = this.chart;
        const rangeSel = chart.rangeSelector;
        const newIx = chart.highlightedInputRangeIx = (
            chart.highlightedInputRangeIx || 0
        ) + direction;
        const newIxOutOfRange = newIx > 1 || newIx < 0;

        if (newIxOutOfRange) {
            if (chart.accessibility) {
                // Ignore focus
                chart.accessibility.keyboardNavigation.exiting = true;
                chart.accessibility.keyboardNavigation.tabindexContainer
                    .focus();

                return chart.accessibility.keyboardNavigation.move(direction);
            }
        } else if (rangeSel) {
            const svgEl = rangeSel[newIx ? 'maxDateBox' : 'minDateBox'];
            const inputEl = rangeSel[newIx ? 'maxInput' : 'minInput'];
            if (svgEl && inputEl) {
                chart.setFocusToElement(svgEl, inputEl);
            }
        }
        return true;
    }


    /**
     * Init date input navigation
     * @private
     */
    public onInputNavInit(
        direction: number
    ): void {
        const component = this;
        const chart = this.chart;
        const buttonIxToHighlight = direction > 0 ? 0 : 1;
        const rangeSel = chart.rangeSelector;
        const svgEl = (
            rangeSel &&
            rangeSel[buttonIxToHighlight ? 'maxDateBox' : 'minDateBox']
        );
        const minInput = (rangeSel && rangeSel.minInput);
        const maxInput = (rangeSel && rangeSel.maxInput);
        const inputEl = buttonIxToHighlight ? maxInput : minInput;

        chart.highlightedInputRangeIx = buttonIxToHighlight;
        if (svgEl && minInput && maxInput) {
            chart.setFocusToElement(svgEl, inputEl);

            // Tab-press with the input focused does not propagate to chart
            // automatically, so we manually catch and handle it when relevant.
            if (this.removeInputKeydownHandler) {
                this.removeInputKeydownHandler();
            }
            const keydownHandler = (e: KeyboardEvent): void => {
                const isTab = (e.which || e.keyCode) === this.keyCodes.tab;
                if (
                    isTab &&
                    component.onInputKbdMove(e.shiftKey ? -1 : 1)
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            const minRemover = addEvent(minInput, 'keydown', keydownHandler);
            const maxRemover = addEvent(maxInput, 'keydown', keydownHandler);

            this.removeInputKeydownHandler = (): void => {
                minRemover();
                maxRemover();
            };
        }
    }


    /**
     * Terminate date input nav
     * @private
     */
    public onInputNavTerminate(): void {
        const rangeSel: RangeSelector = (
            (this.chart as any).rangeSelector || {}
        );

        if (rangeSel.maxInput) {
            rangeSel.hideInput('max');
        }
        if (rangeSel.minInput) {
            rangeSel.hideInput('min');
        }

        if (this.removeInputKeydownHandler) {
            this.removeInputKeydownHandler();
            delete this.removeInputKeydownHandler;
        }
    }


    /**
     * Init range selector dropdown nav
     * @private
     */
    public initDropdownNav(): void {
        const chart = this.chart;
        const rangeSelector = chart.rangeSelector;
        const dropdown = (rangeSelector && rangeSelector.dropdown);

        if (rangeSelector && dropdown) {
            chart.setFocusToElement(rangeSelector.buttonGroup as any, dropdown);
            if (this.removeDropdownKeydownHandler) {
                this.removeDropdownKeydownHandler();
            }
            // Tab-press with dropdown focused does not propagate to chart
            // automatically, so we manually catch and handle it when relevant.
            this.removeDropdownKeydownHandler = addEvent(dropdown, 'keydown',
                (e: KeyboardEvent): void => {
                    const isTab = (e.which || e.keyCode) === this.keyCodes.tab,
                        a11y = chart.accessibility;
                    if (isTab) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (a11y) {
                            a11y.keyboardNavigation.tabindexContainer.focus();
                            a11y.keyboardNavigation.move(
                                e.shiftKey ? -1 : 1
                            );
                        }
                    }
                });
        }
    }


    /**
     * Get navigation for the range selector buttons.
     * @private
     * @return {Highcharts.KeyboardNavigationHandler} The module object.
     */
    public getRangeSelectorButtonNavigation(): KeyboardNavigationHandler {
        const chart = this.chart;
        const keys = this.keyCodes;
        const component = this;

        return new KeyboardNavigationHandler(chart, {
            keyCodeMap: [
                [
                    [keys.left, keys.right, keys.up, keys.down],
                    function (
                        this: KeyboardNavigationHandler,
                        keyCode: number
                    ): number {
                        return component.onButtonNavKbdArrowKey(this, keyCode);
                    }
                ],
                [
                    [keys.enter, keys.space],
                    function (
                        this: KeyboardNavigationHandler
                    ): number {
                        return component.onButtonNavKbdClick(this);
                    }
                ]
            ],

            validate: function (): boolean {
                return !!(
                    chart.rangeSelector &&
                    chart.rangeSelector.buttons &&
                    chart.rangeSelector.buttons.length
                );
            },

            init: function (direction: number): void {
                const rangeSelector = chart.rangeSelector;
                if (rangeSelector && rangeSelector.hasVisibleDropdown) {
                    component.initDropdownNav();
                } else if (rangeSelector) {
                    const lastButtonIx = rangeSelector.buttons.length - 1;
                    chart.highlightRangeSelectorButton(
                        direction > 0 ? 0 : lastButtonIx
                    );
                }
            },

            terminate: function (): void {
                if (component.removeDropdownKeydownHandler) {
                    component.removeDropdownKeydownHandler();
                    delete component.removeDropdownKeydownHandler;
                }
            }
        });
    }


    /**
     * Get navigation for the range selector input boxes.
     * @private
     * @return {Highcharts.KeyboardNavigationHandler}
     *         The module object.
     */
    public getRangeSelectorInputNavigation(): KeyboardNavigationHandler {
        const chart = this.chart;
        const component = this;

        return new KeyboardNavigationHandler(chart, {
            keyCodeMap: [],

            validate: function (): boolean {
                return shouldRunInputNavigation(chart);
            },

            init: function (direction: number): void {
                component.onInputNavInit(direction);
            },

            terminate: function (): void {
                component.onInputNavTerminate();
            }
        });
    }


    /**
     * Get keyboard navigation handlers for this component.
     * @return {Array<Highcharts.KeyboardNavigationHandler>}
     *         List of module objects.
     */
    public getKeyboardNavigation(): Array<KeyboardNavigationHandler> {
        return [
            this.getRangeSelectorButtonNavigation(),
            this.getRangeSelectorInputNavigation()
        ];
    }


    /**
     * Remove component traces
     */
    public destroy(): void {
        if (this.removeDropdownKeydownHandler) {
            this.removeDropdownKeydownHandler();
        }
        if (this.removeInputKeydownHandler) {
            this.removeInputKeydownHandler();
        }
        if (this.announcer) {
            this.announcer.destroy();
        }
    }


}


/* *
 *
 *  Class Prototype
 *
 * */


interface RangeSelectorComponent {
    chart: RangeSelectorComponent.ChartComposition;
}


/* *
 *
 *  Class Namespace
 *
 * */


namespace RangeSelectorComponent {


    /* *
     *
     *  Declarations
     *
     * */


    export declare class ChartComposition extends Accessibility.ChartComposition {
        highlightedInputRangeIx?: number;
        highlightedRangeSelectorItemIx?: number;
        oldRangeSelectorItemState?: number;
        /** @requires modules/accessibility */
        highlightRangeSelectorButton(ix: number): boolean;
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

    /* eslint-disable valid-jsdoc */


    /**
     * Highlight range selector button by index.
     *
     * @private
     * @function Highcharts.Chart#highlightRangeSelectorButton
     */
    function chartHighlightRangeSelectorButton(
        this: ChartComposition,
        ix: number
    ): boolean {
        const buttons: Array<SVGElement> = (
            this.rangeSelector &&
            this.rangeSelector.buttons ||
            []
        );
        const curHighlightedIx = this.highlightedRangeSelectorItemIx;
        const curSelectedIx = (
            this.rangeSelector &&
            this.rangeSelector.selected
        );

        // Deselect old
        if (
            typeof curHighlightedIx !== 'undefined' &&
            buttons[curHighlightedIx] &&
            curHighlightedIx !== curSelectedIx
        ) {
            buttons[curHighlightedIx].setState(
                this.oldRangeSelectorItemState || 0
            );
        }

        // Select new
        this.highlightedRangeSelectorItemIx = ix;
        if (buttons[ix]) {
            this.setFocusToElement(buttons[ix].box, buttons[ix].element);

            if (ix !== curSelectedIx) {
                this.oldRangeSelectorItemState = buttons[ix].state;
                buttons[ix].setState(1);
            }

            return true;
        }
        return false;
    }


    /**
     * Build compositions
     * @private
     */
    export function compose(
        ChartClass: typeof Chart,
        RangeSelectorClass: typeof RangeSelector
    ): void {

        if (pushUnique(composedMembers, ChartClass)) {
            const chartProto = ChartClass.prototype as ChartComposition;

            chartProto.highlightRangeSelectorButton = (
                chartHighlightRangeSelectorButton
            );
        }

        if (pushUnique(composedMembers, RangeSelectorClass)) {
            addEvent(
                RangeSelector,
                'afterBtnClick',
                rangeSelectorAfterBtnClick
            );
        }

    }


    /**
     * Range selector does not have destroy-setup for class instance events - so
     * we set it on the class and call the component from here.
     * @private
     */
    function rangeSelectorAfterBtnClick(
        this: RangeSelector
    ): void {
        const a11y = this.chart.accessibility;
        if (a11y && a11y.components.rangeSelector) {
            return a11y.components.rangeSelector.onAfterBtnClick();
        }
    }

}


/* *
 *
 *  Export Default
 *
 * */


export default RangeSelectorComponent;
