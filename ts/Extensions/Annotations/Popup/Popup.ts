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
import type AnnotationOptions from '../AnnotationOptions';
import type Chart from '../../../Core/Chart/Chart';
import type { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType';

import BaseForm from '../../../Shared/BaseForm.js';
import H from '../../../Core/Globals.js';
const { doc } = H;
import D from '../../../Core/Defaults.js';
const { getOptions } = D;
import PopupAnnotations from './PopupAnnotations.js';
import PopupIndicators from './PopupIndicators.js';
import PopupTabs from './PopupTabs.js';
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;
const { addEvent, fireEvent } = EH;
const {
    createElement,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface InputAttributes {
    value?: string;
    type?: string;
    htmlFor?: string;
    labelClassName?: string;
}

export interface PopupFieldsObject {
    actionType: string;
    fields: PopupFieldsTree;
    linkedTo?: string;
    seriesId?: string;
    type?: string;
}

export interface PopupFieldsTree {
    [key: string]: (string | PopupFieldsTree);
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Get values from all inputs and selections then create JSON.
 *
 * @private
 *
 * @param {Highcharts.HTMLDOMElement} parentDiv
 * The container where inputs and selections are created.
 *
 * @param {string} type
 * Type of the popup bookmark (add|edit|remove).
 */
function getFields(
    parentDiv: HTMLDOMElement,
    type: string
): PopupFieldsObject {
    const inputList = Array.prototype.slice.call(
            parentDiv.querySelectorAll('input')
        ),
        selectList = Array.prototype.slice.call(
            parentDiv.querySelectorAll('select')
        ),
        optionSeries = '#highcharts-select-series > option:checked',
        optionVolume = '#highcharts-select-volume > option:checked',
        linkedTo = parentDiv.querySelectorAll(optionSeries)[0],
        volumeTo = parentDiv.querySelectorAll(optionVolume)[0];

    const fieldsOutput: PopupFieldsObject = {
        actionType: type,
        linkedTo: linkedTo && linkedTo.getAttribute('value') || '',
        fields: { }
    };

    inputList.forEach((input: HTMLInputElement): void => {
        const param = input.getAttribute('highcharts-data-name'),
            seriesId = input.getAttribute('highcharts-data-series-id');

        // params
        if (seriesId) {
            fieldsOutput.seriesId = input.value;
        } else if (param) {
            fieldsOutput.fields[param] = input.value;
        } else {
            // type like sma / ema
            fieldsOutput.type = input.value;
        }
    });

    selectList.forEach((select: HTMLInputElement): void => {
        const id = select.id;

        // Get inputs only for the parameters, not for series and volume.
        if (
            id !== 'highcharts-select-series' &&
            id !== 'highcharts-select-volume'
        ) {
            const parameter = id.split('highcharts-select-')[1];

            fieldsOutput.fields[parameter] = select.value;
        }
    });

    if (volumeTo) {
        fieldsOutput.fields['params.volumeSeriesID'] = volumeTo
            .getAttribute('value') || '';
    }

    return fieldsOutput;
}

/* *
 *
 *  Class
 *
 * */

class Popup extends BaseForm {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        parentDiv: HTMLDOMElement,
        iconsURL: string,
        chart?: Chart
    ) {
        super(parentDiv, iconsURL);

        this.chart = chart;
        this.lang = (getOptions().lang.navigation || {}).popup as any || {};

        addEvent(this.container, 'mousedown', (): void => {
            const activeAnnotation = chart &&
                chart.navigationBindings &&
                chart.navigationBindings.activeAnnotation;

            if (activeAnnotation) {
                activeAnnotation.cancelClick = true;

                const unbind = addEvent(doc, 'click', (): void => {
                    setTimeout((): void => {
                        activeAnnotation.cancelClick = false;
                    }, 0);
                    unbind();
                });
            }
        });
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart?: Chart;
    public type?: string;
    public lang: Record<string, string>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Create input with label.
     *
     * @private
     *
     * @param {string} option
     *        Chain of fields i.e params.styles.fontSize separeted by the dot.
     *
     * @param {string} indicatorType
     *        Type of the indicator i.e. sma, ema...
     *
     * @param {HTMLDOMElement} parentDiv
     *        HTML parent element.
     *
     * @param {Highcharts.InputAttributes} inputAttributes
     *        Attributes of the input.
     *
     * @return {HTMLInputElement}
     *         Return created input element.
     */
    public addInput(
        option: string,
        indicatorType: string,
        parentDiv: HTMLDOMElement,
        inputAttributes: InputAttributes
    ): HTMLDOMElement {
        const optionParamList = option.split('.'),
            optionName = optionParamList[optionParamList.length - 1],
            lang = this.lang,
            inputName = 'highcharts-' + indicatorType + '-' + pick(
                inputAttributes.htmlFor,
                optionName
            );

        if (!optionName.match(/^\d+$/)) {
            // add label
            createElement(
                'label',
                {
                    htmlFor: inputName,
                    className: inputAttributes.labelClassName
                },
                void 0,
                parentDiv
            ).appendChild(
                doc.createTextNode(lang[optionName] || optionName)
            );
        }

        // add input
        const input = createElement(
            'input',
            {
                name: inputName,
                value: inputAttributes.value,
                type: inputAttributes.type,
                className: 'highcharts-popup-field'
            },
            void 0,
            parentDiv
        );

        input.setAttribute('highcharts-data-name', option);

        return input;
    }

    public closeButtonEvents(): void {
        if (this.chart) {
            const navigationBindings = this.chart.navigationBindings;

            fireEvent(navigationBindings, 'closePopup');

            if (
                navigationBindings &&
                navigationBindings.selectedButtonElement
            ) {
                fireEvent(
                    navigationBindings,
                    'deselectButton',
                    { button: navigationBindings.selectedButtonElement }
                );
            }
        } else {
            super.closeButtonEvents();
        }
    }

    /**
     * Create button.
     * @private
     * @param {Highcharts.HTMLDOMElement} parentDiv
     * Container where elements should be added
     * @param {string} label
     * Text placed as button label
     * @param {string} type
     * add | edit | remove
     * @param {Function} callback
     * On click callback
     * @param {Highcharts.HTMLDOMElement} fieldsDiv
     * Container where inputs are generated
     * @return {Highcharts.HTMLDOMElement}
     * HTML button
     */
    public addButton(
        parentDiv: HTMLDOMElement,
        label: string,
        type: string,
        fieldsDiv: HTMLDOMElement,
        callback?: Function
    ): HTMLDOMElement {

        const button = createElement('button', void 0, void 0, parentDiv);

        button.appendChild(doc.createTextNode(label));

        if (callback) {
            ['click', 'touchstart'].forEach((eventName: string): void => {
                addEvent(button, eventName, (): void => {
                    this.closePopup();

                    return callback(getFields(fieldsDiv, type));
                });
            });
        }

        return button;
    }

    /**
     * Create content and show popup.
     * @private
     * @param {string} - type of popup i.e indicators
     * @param {Highcharts.Chart} - chart
     * @param {Highcharts.AnnotationsOptions} - options
     * @param {Function} - on click callback
     */
    public showForm(
        type: string,
        chart: AnnotationChart,
        options: AnnotationOptions,
        callback: Function
    ): void {

        if (!chart) {
            return;
        }

        // show blank popup
        this.showPopup();

        // indicator form
        if (type === 'indicators') {
            this.indicators.addForm.call(this, chart, options, callback);
        }

        // annotation small toolbar
        if (type === 'annotation-toolbar') {
            this.annotations.addToolbar.call(this, chart, options, callback);
        }

        // annotation edit form
        if (type === 'annotation-edit') {
            this.annotations.addForm.call(this, chart, options, callback);
        }

        // flags form - add / edit
        if (type === 'flag') {
            this.annotations.addForm.call(this, chart, options, callback, true);
        }

        this.type = type;

        // Explicit height is needed to make inner elements scrollable
        this.container.style.height = this.container.offsetHeight + 'px';
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface Popup {
    readonly annotations: typeof PopupAnnotations;
    readonly indicators: typeof PopupIndicators;
    readonly tabs: typeof PopupTabs;
}

extend(Popup.prototype, {
    annotations: PopupAnnotations,
    indicators: PopupIndicators,
    tabs: PopupTabs
});

/* *
 *
 *  Default Export
 *
 * */

export default Popup;
