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

import type Annotation from '../Annotation';
import type AnnotationOptions from '../AnnotationOptions';
import type {
    HTMLDOMElement,
    SVGDOMElement
} from '../../../Core/Renderer/DOMElementType';
import type NavigationBindings from '../NavigationBindings';
import type Pointer from '../../../Core/Pointer';

import Popup from './Popup.js';
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;
const {
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface PopupConfigObject {
    annotation: Annotation;
    formType: string;
    onSubmit: Function;
    options: AnnotationOptions;
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
 * @private
 */
function compose(
    NagivationBindingsClass: typeof NavigationBindings,
    PointerClass: typeof Pointer
): void {

    if (pushUnique(composedMembers, NagivationBindingsClass)) {
        addEvent(
            NagivationBindingsClass,
            'closePopup',
            onNavigationBindingsClosePopup
        );
        addEvent(
            NagivationBindingsClass,
            'showPopup',
            onNavigationBindingsShowPopup
        );
    }

    if (pushUnique(composedMembers, PointerClass)) {
        wrap(
            PointerClass.prototype,
            'onContainerMouseDown',
            wrapPointerOnContainerMouserDown
        );
    }

}

/**
 * @private
 */
function onNavigationBindingsClosePopup(this: NavigationBindings): void {
    if (this.popup) {
        this.popup.closePopup();
    }
}

/**
 * @private
 */
function onNavigationBindingsShowPopup(
    this: NavigationBindings,
    config: PopupConfigObject
): void {
    if (!this.popup) {
        // Add popup to main container
        this.popup = new Popup(
            this.chart.container, (
                this.chart.options.navigation.iconsURL ||
                (
                    this.chart.options.stockTools &&
                    this.chart.options.stockTools.gui.iconsURL
                ) ||
                'https://code.highcharts.com/@product.version@/gfx/stock-icons/'
            ), this.chart
        );
    }

    this.popup.showForm(
        config.formType,
        this.chart,
        config.options,
        config.onSubmit
    );
}

/**
 * onContainerMouseDown blocks internal popup events, due to e.preventDefault.
 * Related issue #4606
 * @private
 */
function wrapPointerOnContainerMouserDown(
    this: Pointer,
    proceed: Function,
    e: MouseEvent
): void {
    // elements is not in popup
    if (!this.inClass(
        e.target as (HTMLDOMElement|SVGDOMElement),
        'highcharts-popup'
    )) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    }
}

/* *
 *
 *  Default Export
 *
 * */

const PopupComposition = {
    compose
};

export default PopupComposition;
