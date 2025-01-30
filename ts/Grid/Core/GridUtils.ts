/* *
 *
 *  Grid utilities
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *
 * */

import AST from '../../Core/Renderer/HTML/AST.js';

/* *
 *
 *  Declarations
 *
 * */

/**
 * The event object for the grid.
 */
export interface GridEvent<T, E extends Event = Event> {
    /**
     * The original browser event.
     */
    originalEvent?: E;
    /**
     * The target of the event.
     */
    target: T;
}

/* *
 *
 *  Namespace
 *
 * */

namespace GridUtils {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Parameters for the makeHTMLElement utils function.
     */
    export interface MakeHTMLElementParameters {
        className?: string;
        id?: string;
        innerText?: string;
        style?: Partial<CSSStyleDeclaration>;
    }


    /* *
     *
     *  Functions
     *
     * */

    /**
     * Creates a HTML element with the provided options.
     *
     * @param tagName
     * The tag name of the element.
     *
     * @param params
     * The parameters of the element.
     *
     * @param parent
     * The parent element.
     */
    export function makeHTMLElement<T extends HTMLElement>(
        tagName: string,
        params?: MakeHTMLElementParameters,
        parent?: HTMLElement
    ): T {
        const element = document.createElement(tagName);

        if (params) {
            const paramsKeys = Object.keys(
                params
            ) as (keyof MakeHTMLElementParameters)[];

            for (let i = 0; i < paramsKeys.length; i++) {
                const key = paramsKeys[i];
                const value = params[key];

                if (value !== void 0) {
                    if (key === 'style') {
                        Object.assign(element.style, value);
                    } else {
                        element[key] = value as string;
                    }
                }
            }
        }

        if (parent) {
            parent.appendChild(element);
        }

        return element as T;
    }

    /**
     * Creates a div element with the provided class name and id.
     *
     * @param className
     * The class name of the div.
     *
     * @param id
     * The id of the element.
     */
    export function makeDiv(className: string, id?: string): HTMLElement {
        return makeHTMLElement('div', { className, id });
    }

    /**
     * Check if there's a possibility that the given string is an HTML
     * (contains '<').
     *
     * @param str
     * Text to verify.
     */
    export function isHTML(str: string): boolean {
        return str.indexOf('<') !== -1;
    }

    /**
     * Returns a string containing plain text format by removing HTML tags
     *
     * @param text
     * String to be sanitized
     *
     * @returns
     * Sanitized plain text string
     */
    export function sanitizeText(text: string): string {
        try {
            return new DOMParser().parseFromString(text, 'text/html')
                .body.textContent || '';
        } catch (error) {
            return '';
        }
    }

    /**
     * Sets an element's content, checking whether it is HTML or plain text.
     * Should be used instead of element.innerText when the content can be HTML.
     *
     * @param element
     * Parent element where the content should be.
     *
     * @param content
     * Content to render.
     */
    export function setHTMLContent(
        element: HTMLElement,
        content: string
    ): void {
        if (isHTML(content)) {
            const formattedNodes = new AST(content);
            formattedNodes.addToDOM(element);
        } else {
            element.innerText = content;
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default GridUtils;
