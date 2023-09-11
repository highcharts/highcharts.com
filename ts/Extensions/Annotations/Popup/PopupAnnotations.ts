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
import type { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType';
import type Popup from './Popup';

import H from '../../../Core/Globals.js';
const {
    doc,
    isFirefox
} = H;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    stableSort
} = AH;
const { isArray, isObject } = TC;
const { objectEach } = OH;
const {
    createElement,
    pick
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * Create annotation simple form.
 * It contains fields with param names.
 * @private
 * @param {Highcharts.Chart} chart
 * Chart
 * @param {Object} options
 * Options
 * @param {Function} callback
 * On click callback
 * @param {boolean} [isInit]
 * If it is a form declared for init annotation
 */
function addForm(
    this: Popup,
    chart: AnnotationChart,
    options: AnnotationOptions,
    callback: Function,
    isInit?: boolean
): void {

    if (!chart) {
        return;
    }

    const popupDiv = this.container,
        lang = this.lang;

    // create title of annotations
    let lhsCol = createElement('h2', {
        className: 'highcharts-popup-main-title'
    }, void 0, popupDiv);
    lhsCol.appendChild(
        doc.createTextNode(
            lang[options.langKey as any] || options.langKey || ''
        )
    );

    // left column
    lhsCol = createElement(
        'div',
        {
            className: (
                'highcharts-popup-lhs-col highcharts-popup-lhs-full'
            )
        },
        void 0,
        popupDiv
    );

    const bottomRow = createElement(
        'div',
        {
            className: 'highcharts-popup-bottom-row'
        },
        void 0,
        popupDiv
    );

    addFormFields.call(
        this,
        lhsCol,
        chart,
        '',
        options,
        [],
        true
    );

    this.addButton(
        bottomRow,
        isInit ?
            (lang.addButton || 'Add') :
            (lang.saveButton || 'Save'),
        isInit ? 'add' : 'save',
        popupDiv,
        callback
    );
}

/**
 * Create annotation simple form. It contains two buttons
 * (edit / remove) and text label.
 * @private
 * @param {Highcharts.Chart} - chart
 * @param {Highcharts.AnnotationsOptions} - options
 * @param {Function} - on click callback
 */
function addToolbar(
    this: Popup,
    chart: AnnotationChart,
    options: AnnotationOptions,
    callback: Function
): void {
    const lang = this.lang,
        popupDiv = this.container,
        showForm = this.showForm,
        toolbarClass = 'highcharts-annotation-toolbar';

    // set small size
    if (popupDiv.className.indexOf(toolbarClass) === -1) {
        popupDiv.className += ' ' + toolbarClass;
    }

    // set position
    if (chart) {
        popupDiv.style.top = chart.plotTop + 10 + 'px';
    }

    // create label
    createElement('span', void 0, void 0, popupDiv).appendChild(
        doc.createTextNode(pick(
            // Advanced annotations:
            lang[options.langKey as any] || options.langKey,
            // Basic shapes:
            options.shapes && options.shapes[0].type,
            ''
        ))
    );

    // add buttons
    let button = this.addButton(
        popupDiv,
        lang.removeButton || 'Remove',
        'remove',
        popupDiv,
        callback
    );

    button.className += ' highcharts-annotation-remove-button';
    button.style['background-image' as any] = 'url(' +
        this.iconsURL + 'destroy.svg)';

    button = this.addButton(
        popupDiv,
        lang.editButton || 'Edit',
        'edit',
        popupDiv,
        (): void => {
            showForm.call(
                this,
                'annotation-edit',
                chart,
                options,
                callback
            );
        }
    );

    button.className += ' highcharts-annotation-edit-button';
    button.style['background-image' as any] = 'url(' +
        this.iconsURL + 'edit.svg)';

}

/**
 * Create annotation's form fields.
 * @private
 * @param {Highcharts.HTMLDOMElement} parentDiv
 * Div where inputs are placed
 * @param {Highcharts.Chart} chart
 * Chart
 * @param {string} parentNode
 * Name of parent to create chain of names
 * @param {Highcharts.AnnotationsOptions} options
 * Options
 * @param {Array<unknown>} storage
 * Array where all items are stored
 * @param {boolean} [isRoot]
 * Recursive flag for root
 */
function addFormFields(
    this: Popup,
    parentDiv: HTMLDOMElement,
    chart: AnnotationChart,
    parentNode: string,
    options: AnnotationOptions,
    storage: Array<AnyRecord>,
    isRoot?: boolean
): void {

    if (!chart) {
        return;
    }

    const addInput = this.addInput,
        lang = this.lang;

    let parentFullName,
        titleName: string;

    objectEach(options, (value, option): void => {

        // create name like params.styles.fontSize
        parentFullName = parentNode !== '' ? parentNode + '.' + option : option;

        if (isObject(value)) {
            if (
                // value is object of options
                !isArray(value) ||
                // array of objects with params. i.e labels in Fibonacci
                (isArray(value) && isObject(value[0]))
            ) {
                titleName = lang[option] || option;

                if (!titleName.match(/\d/g)) {
                    storage.push([
                        true,
                        titleName,
                        parentDiv
                    ]);
                }

                addFormFields.call(
                    this,
                    parentDiv,
                    chart,
                    parentFullName,
                    value as any,
                    storage,
                    false
                );
            } else {
                storage.push([
                    this,
                    parentFullName,
                    'annotation',
                    parentDiv,
                    value
                ]);
            }
        }
    });

    if (isRoot) {
        stableSort(storage, (a): number => (
            a[1].match(/format/g) ? -1 : 1
        ));

        if (isFirefox) {
            storage.reverse(); // (#14691)
        }

        storage.forEach((genInput: any): void => {
            if (genInput[0] === true) {
                createElement(
                    'span',
                    {
                        className: 'highcharts-annotation-title'
                    },
                    void 0,
                    genInput[2]
                ).appendChild(doc.createTextNode(
                    genInput[1]
                ));

            } else {
                genInput[4] = {
                    value: genInput[4][0],
                    type: genInput[4][1]
                };
                addInput.apply(genInput[0], genInput.splice(1));
            }
        });
    }
}

/* *
 *
 *  Default Export
 *
 * */

const PopupAnnotations = {
    addForm,
    addToolbar
};

export default PopupAnnotations;
