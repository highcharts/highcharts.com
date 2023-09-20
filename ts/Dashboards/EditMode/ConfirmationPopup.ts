/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *  - Sophie Bremer
 *
 * */

import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType.js';

import U from '../Utilities.js';
import BaseForm from '../../Shared/BaseForm.js';
import EditGlobals from './EditGlobals.js';
import EditRenderer from './EditRenderer.js';
import CellEditToolbar from './Toolbar/CellEditToolbar.js';
import RowEditToolbar from './Toolbar/RowEditToolbar.js';
import EditMode from './EditMode.js';

const {
    createElement
} = U;

/**
 * Class to create confirmation popup.
 */
class ConfirmationPopup extends BaseForm {
    /* *
    *
    *  Static Properties
    *
    * */

    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs an instance of the ConfirmationPopup.
     *
     * @param parentDiv
     * Parent div where the popup will be added.
     *
     * @param iconsURL
     * URL to the icons.
     *
     * @param editMode
     * The EditMode instance.
     *
     * @param options
     * Options for confirmation popup.
     */
    constructor(
        parentDiv: HTMLElement,
        iconsURL: string,
        editMode: EditMode,
        options?: ConfirmationPopup.Options
    ) {
        iconsURL =
            options && options.close && options.close.icon ?
                options.close.icon :
                iconsURL;

        super(parentDiv, iconsURL);

        this.editMode = editMode;
        this.options = options;
    }

    /* *
    *
    *  Properties
    *
    * */

    /**
     * Container for buttons.
     */
    public buttonContainer: HTMLDOMElement|undefined;
    /**
     * Container for popup content.
     */
    public contentContainer: HTMLDOMElement|undefined;
    /**
     * The EditMode instance.
     */
    public editMode: EditMode;
    /**
     * Options for confirmation popup.
     */
    public options?: ConfirmationPopup.Options;

    /* *
    *
    *  Functions
    *
    * */

    /**
     * Returns popup container.
     *
     * @param parentDiv
     * Parent div where the popup will be added.
     *
     * @param className
     * Class name added to the popup container.
     */
    protected createPopupContainer(
        parentDiv: HTMLElement,
        className: string = EditGlobals.classNames.confirmationPopup
    ): HTMLElement {
        return super.createPopupContainer(parentDiv, className);
    }

    /**
     * Adds close button to the popup.
     *
     * @param className
     * Class name added to the close button.
     */
    protected addCloseButton(
        className: string = EditGlobals.classNames.popupCloseButton
    ): HTMLElement {
        return super.addCloseButton(className);
    }

    /**
     * Adds content inside the popup.
     *
     * @param options
     * Options for confirmation popup.
     */
    public renderContent(
        options: ConfirmationPopup.ContentOptions
    ): void {
        // Render content wrapper
        this.contentContainer = createElement(
            'div', {
                className: EditGlobals.classNames.popupContentContainer
            }, {},
            this.container
        );

        const popupContainer = this.contentContainer.parentNode;
        popupContainer.style.marginTop = '0px';
        const offsetTop = popupContainer.getBoundingClientRect().top;

        popupContainer.style.marginTop = (
            offsetTop < 0 ? Math.abs(offsetTop - 200) : 200
        ) + 'px';

        // Render text
        EditRenderer.renderText(this.contentContainer, {
            title: options.text || ''
        });

        // Render button wrapper
        this.buttonContainer = createElement(
            'div', {
                className: EditGlobals.classNames.popupButtonContainer
            }, {},
            this.container
        );

        // Render cancel buttons
        EditRenderer.renderButton(
            this.buttonContainer,
            {
                text: options.cancelButton.value,
                className: EditGlobals.classNames.popupCancelBtn,
                callback: options.cancelButton.callback
            }
        );

        // Confirm
        EditRenderer.renderButton(
            this.buttonContainer,
            {
                text: options.confirmButton.value,
                className: EditGlobals.classNames.popupConfirmBtn,
                callback: (): void => {
                    // Run callback
                    // confirmCallback.call(context);
                    options.confirmButton.callback.call(
                        options.confirmButton.context
                    );
                    // Hide popup
                    this.closePopup();
                }
            }
        );
    }

    /**
     * Shows confirmation popup.
     *
     * @param options
     * Options for confirmation popup.
     */
    public show(
        options: ConfirmationPopup.ContentOptions
    ): void {
        this.showPopup();
        this.renderContent(options);
        this.editMode.setEditOverlay();
    }

    /**
     * Hides confirmation popup.
     */
    public closePopup(): void {
        super.closePopup();
        this.editMode.setEditOverlay(true);
    }
}

namespace ConfirmationPopup {
    /**
     * Options for confirmation popup.
     */
    export interface Options {
        /**
         * Close icon
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/edit-mode/change-close-icon/ | Change close icon}
         */
        close: CloseIcon;
    }

    /**
     * Close icon options.
     */
    export interface CloseIcon {
        /**
         * Icon's URL.
         */
        icon: string;
    }

    export interface ContentOptions {
        confirmButton: ConfirmButton;
        cancelButton: ConfirmButton;
        text: string;
    }

    export interface ConfirmButton {
        value: string;
        callback: Function;
        context: RowEditToolbar|CellEditToolbar;
    }

    export interface CancelButton{
        value: string;
        callback: Function;
    }
}

export default ConfirmationPopup;
