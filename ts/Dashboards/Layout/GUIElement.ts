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

import type {
    HTMLDOMElement
} from '../../Core/Renderer/DOMElementType';
import type {
    CSSObject
} from '../../Core/Renderer/CSSObject';
import type HTMLAttributes from '../../Core/Renderer/HTML/HTMLAttributes';
import U from '../Utilities.js';
import Globals from '../Globals.js';
import Row from './Row';
import Cell from './Cell';

const {
    addEvent,
    createElement,
    uniqueKey,
    objectEach,
    error
} = U;

abstract class GUIElement {

    /* *
    *
    *  Static Properties
    *
    * */

    // Get offsets of the guiElement relative to
    // the referenceElement or the Viewport.
    public static getOffsets(
        guiElement: GUIElement,
        referenceElement?: HTMLDOMElement
    ): Record<string, number> {
        const offset = { left: 0, top: 0, right: 0, bottom: 0 };

        if (guiElement.container) {
            const guiElementClientRect =
                guiElement.container.getBoundingClientRect();
            const referenceClientRect = referenceElement ?
                referenceElement.getBoundingClientRect() : { left: 0, top: 0 };

            offset.left = guiElementClientRect.left - referenceClientRect.left;
            offset.top = guiElementClientRect.top - referenceClientRect.top;
            offset.right =
                guiElementClientRect.right - referenceClientRect.left;
            offset.bottom =
                guiElementClientRect.bottom - referenceClientRect.top;
        }

        return offset;
    }

    // Get dimensions of the guiElement container from offsets.
    public static getDimFromOffsets(
        offsets: Record<string, number>
    ): Record<string, number> {
        return {
            width: offsets.right - offsets.left,
            height: offsets.bottom - offsets.top
        };
    }

    // Method for element id generation.
    public static createElementId(
        elementType: string // col, row, layout
    ): string {
        return (
            Globals.classNamePrefix + elementType + '-' +
            uniqueKey().slice(11)
        );
    }

    // Get width in percentages (0% - 100%).
    public static getPercentageWidth(
        width: string // supported formats '50%' or '1/2'
    ): string | undefined {
        const fractionRegEx = /^([0-9]{1})[\-\/\.]([0-9]{1,2})$/;

        let result;

        if (fractionRegEx.test(width)) {
            const match = width.match(fractionRegEx) || [],
                multiplier = +match[1],
                divider = +match[2];

            result = 100 * multiplier / divider;
            result = (result <= 100 ? result : 100) + '%';
        } else if (width.indexOf('%') !== -1) {
            const value = parseFloat(width);
            result = (value <= 100 ?
                (value >= 0 ? value : 0) : 100
            ) + '%';
        }

        return result;
    }

    /* *
    *
    *  Properties
    *
    * */

    /**
     * HTML container of a GUIElement.
     */
    public container?: HTMLDOMElement;

    /**
     * The type of a GUIElement instance.
     */
    protected type?: GUIElement.GUIElementType;

    /**
     * The function to remove bindedGUIElement
     * event on GUIElement container.
     */
    public removeBindedEventFn?: Function;

    /**
     * The visibility flag.
     */
    public isVisible?: boolean;

    /* *
    *
    *  Functions
    *
    * */

    /**
     * Create or get existing HTML element as a GUIElement container.
     *
     * @param {GUIElement.ContainerOptions} options
     * Options.
     */
    protected getElementContainer(
        options: GUIElement.GetElementContainerOptions
    ): HTMLElement {
        const guiElement = this;
        let elem = createElement(
            'div',
            options.attribs || {},
            options.style || {},
            options.parentContainer
        );

        if (options.render) {
            if (options.attribs && !options.attribs.id) {
                delete options.attribs.id;
            }
        } else if (options.element instanceof HTMLElement) {
            elem = options.element;
        } else if (typeof options.elementId === 'string') {
            const div = document.getElementById(options.elementId);

            if (div) {
                guiElement.container = div;
            } else {
                error('Element ' + options.elementId + ' does not exist');
            }
        }

        // Set bindedGUIElement event on GUIElement container.
        guiElement.removeBindedEventFn = addEvent(
            elem,
            'bindedGUIElement',
            function (e: GUIElement.BindedGUIElementEvent): void {
                e.guiElement = guiElement;
                e.stopImmediatePropagation();
            }
        );

        return elem;
    }

    /**
     * Destroy the element, its container, event hooks
     * and all properties.
     */
    protected destroy(): void {
        const guiElement = this;

        // Remove bindedGUIElement event.
        if (guiElement.removeBindedEventFn) {
            guiElement.removeBindedEventFn();
        }

        // Remove HTML container.
        if (guiElement.container && guiElement.container.parentNode) {
            guiElement.container.parentNode.removeChild(guiElement.container);
        }

        // Delete all properties.
        objectEach(guiElement, function (val: unknown, key: string): void {
            delete (guiElement as Record<string, any>)[key];
        });
    }

    /**
     * Return the GUIElement instance type.
     * @return {GUIElement.GUIElementType|undefined}
     * The GUIElement instance type
     */
    public getType(): GUIElement.GUIElementType|undefined {
        return this.type;
    }

    protected changeVisibility(
        setVisible: boolean = true,
        displayStyle?: string
    ): void {
        const visibilityChanged = (
            this.isVisible && !setVisible ||
            !this.isVisible && setVisible
        );

        if (this.container && visibilityChanged) {
            this.container.style.display = (
                setVisible ?
                    (displayStyle || 'block') :
                    'none'
            );
            this.isVisible = setVisible;
        }
    }

    public hide(): void {
        this.changeVisibility(false);
    }

    public show(): void {
        this.changeVisibility();
    }
}

namespace GUIElement {
    export interface GetElementContainerOptions {
        render?: boolean;
        parentContainer?: HTMLDOMElement;
        attribs?: HTMLAttributes;
        style?: CSSObject;
        element?: HTMLElement;
        elementId?: string;
    }

    export interface BindedGUIElementEvent extends Event {
        guiElement: GUIElement;
    }

    export type GUIElementType = 'row'|'cell'|'layout';
}

export default GUIElement;
