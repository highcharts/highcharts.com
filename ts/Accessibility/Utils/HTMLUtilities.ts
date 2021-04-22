/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Utility functions for accessibility module.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

import type {
    DOMElementType,
    HTMLDOMElement
} from '../../Core/Renderer/DOMElementType';
import type HTMLAttributes from '../../Core/Renderer/HTML/HTMLAttributes';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import H from '../../Core/Globals.js';
const {
    doc,
    win
} = H;
import U from '../../Core/Utilities.js';
const {
    merge
} = U;

/* eslint-disable valid-jsdoc */

/**
 * @private
 * @param {Highcharts.HTMLDOMElement} el
 * @param {string} className
 * @return {void}
 */
function addClass(el: HTMLDOMElement, className: string): void {
    if (el.classList) {
        el.classList.add(className);
    } else if (el.className.indexOf(className) < 0) {
        // Note: Dumb check for class name exists, should be fine for practical
        // use cases, but will return false positives if the element has a class
        // that contains the className.
        el.className += className;
    }
}


/**
 * @private
 * @param {string} str
 * @return {string}
 */
function escapeStringForHTML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}


/**
 * Get an element by ID
 * @param {string} id
 * @private
 * @return {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement|null}
 */
function getElement(
    id: string
): (DOMElementType|null) {
    return doc.getElementById(id);
}


/**
 * Get a fake mouse event of a given type
 * @param {string} type
 * @private
 * @return {global.MouseEvent}
 */
function getFakeMouseEvent(type: string): MouseEvent {
    if (typeof win.MouseEvent === 'function') {
        return new win.MouseEvent(type);
    }

    // No MouseEvent support, try using initMouseEvent
    if (doc.createEvent) {
        var evt = doc.createEvent('MouseEvent');
        if (evt.initMouseEvent) {
            evt.initMouseEvent(
                type,
                true, // Bubble
                true, // Cancel
                win, // View
                type === 'click' ? 1 : 0, // Detail
                // Coords
                0,
                0,
                0,
                0,
                // Pressed keys
                false,
                false,
                false,
                false,
                0, // button
                null // related target
            );
            return evt;
        }
    }

    return { type: type } as any;
}


/**
 * Get an appropriate heading level for an element. Corresponds to the
 * heading level below the previous heading in the DOM.
 *
 * Note: Only detects previous headings in the DOM that are siblings,
 * ancestors, or previous siblings of ancestors. Headings that are nested below
 * siblings of ancestors (cousins et.al) are not picked up. This is because it
 * is ambiguous whether or not the nesting is for layout purposes or indicates a
 * separate section.
 *
 * @private
 * @param {Highcharts.HTMLDOMElement} [element]
 * @return {string} The heading tag name (h1, h2 etc).
 * If no nearest heading is found, "p" is returned.
 */
function getHeadingTagNameForElement(element: HTMLDOMElement): string {
    const getIncreasedHeadingLevel = (tagName: string): string => {
        const headingLevel = parseInt(tagName.slice(1), 10);
        const newLevel = Math.min(6, headingLevel + 1);
        return 'h' + newLevel;
    };

    const isHeading = (tagName: string): boolean => /H[1-6]/.test(tagName);

    const getPreviousSiblingsHeading = (el: HTMLDOMElement): string => {
        let sibling: ChildNode|null = el;
        while (sibling = sibling.previousSibling) { // eslint-disable-line
            const tagName = (sibling as HTMLDOMElement).tagName || '';
            if (isHeading(tagName)) {
                return tagName;
            }
        }
        return '';
    };

    const getHeadingRecursive = (el: HTMLDOMElement): string => {
        const prevSiblingsHeading = getPreviousSiblingsHeading(el);
        if (prevSiblingsHeading) {
            return getIncreasedHeadingLevel(prevSiblingsHeading);
        }
        // No previous siblings are headings, try parent node
        const parent = el.parentElement;
        if (!parent) {
            return 'p';
        }
        const parentTagName = parent.tagName;
        if (isHeading(parentTagName)) {
            return getIncreasedHeadingLevel(parentTagName);
        }
        return getHeadingRecursive(parent);
    };

    return getHeadingRecursive(element);
}


/**
 * Remove an element from the DOM.
 * @private
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} [element]
 * @return {void}
 */
function removeElement(element?: DOMElementType): void {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}


/**
 * Utility function. Reverses child nodes of a DOM element.
 * @private
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} node
 * @return {void}
 */
function reverseChildNodes(node: DOMElementType): void {
    var i = node.childNodes.length;
    while (i--) {
        node.appendChild(node.childNodes[i]);
    }
}


/**
 * Set attributes on element. Set to null to remove attribute.
 * @private
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} el
 * @param {Highcharts.HTMLAttributes|Highcharts.SVGAttributes} attrs
 * @return {void}
 */
function setElAttrs(
    el: DOMElementType,
    attrs: AnyRecord
): void {
    Object.keys(attrs).forEach(function (attr: string): void {
        var val = (attrs as any)[attr];
        if (val === null) {
            el.removeAttribute(attr);
        } else {
            el.setAttribute(attr, val);
        }
    });
}


/**
 * Used for aria-label attributes, painting on a canvas will fail if the
 * text contains tags.
 * @private
 * @param {string} str
 * @return {string}
 */
function stripHTMLTagsFromString(str: string): string {
    return typeof str === 'string' ?
        str.replace(/<\/?[^>]+(>|$)/g, '') : str;
}


/**
 * Utility function for hiding an element visually, but still keeping it
 * available to screen reader users.
 * @private
 * @param {Highcharts.HTMLDOMElement} element
 * @return {void}
 */
function visuallyHideElement(element: HTMLDOMElement): void {
    var hiddenStyle = {
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        clip: 'rect(1px, 1px, 1px, 1px)',
        marginTop: '-3px',
        '-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=1)',
        filter: 'alpha(opacity=1)',
        opacity: '0.01'
    };
    merge(true, element.style, hiddenStyle);
}


var HTMLUtilities = {
    addClass,
    escapeStringForHTML,
    getElement,
    getFakeMouseEvent,
    getHeadingTagNameForElement,
    removeElement,
    reverseChildNodes,
    setElAttrs,
    stripHTMLTagsFromString,
    visuallyHideElement
};

export default HTMLUtilities;
