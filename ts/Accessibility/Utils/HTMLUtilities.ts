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

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    DOMElementType,
    HTMLDOMElement
} from '../../Core/Renderer/DOMElementType';

import H from '../../Core/Globals.js';
const {
    doc,
    win
} = H;
import U from '../../Shared/Utilities.js';
const { css } = U;


/* *
 *
 *  Constants
 *
 * */

const simulatedEventTarget = win.EventTarget && new win.EventTarget() || 'none';


/* *
 *
 *  Functions
 *
 * */

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
        el.className += ' ' + className;
    }
}


/**
 * @private
 * @param {Highcharts.HTMLDOMElement} el
 * @param {string} className
 * @return {void}
 */
function removeClass(el: HTMLDOMElement, className: string): void {
    if (el.classList) {
        el.classList.remove(className);
    } else {
        // Note: Dumb logic that will break if the element has a class name that
        // consists of className plus something else.
        el.className = el.className.replace(new RegExp(className, 'g'), '');
    }
}


/**
 * Utility function to clone a mouse event for re-dispatching.
 * @private
 */
function cloneMouseEvent(e: MouseEvent): MouseEvent {
    if (typeof win.MouseEvent === 'function') {
        return new win.MouseEvent(e.type, e);
    }

    // No MouseEvent support, try using initMouseEvent
    if (doc.createEvent) {
        const evt = doc.createEvent('MouseEvent');
        if (evt.initMouseEvent) {
            evt.initMouseEvent(
                e.type,
                e.bubbles, // #10561, #12161
                e.cancelable,
                e.view || win,
                e.detail,
                e.screenX,
                e.screenY,
                e.clientX,
                e.clientY,
                e.ctrlKey,
                e.altKey,
                e.shiftKey,
                e.metaKey,
                e.button,
                e.relatedTarget
            );
            return evt;
        }
    }

    return getFakeMouseEvent(e.type);
}


/**
 * Utility function to clone a touch event for re-dispatching.
 * @private
 */
function cloneTouchEvent(e: TouchEvent): TouchEvent {
    const touchListToTouchArray = (l: TouchList): Touch[] => {
        const touchArray = [];
        for (let i = 0; i < l.length; ++i) {
            const item = l.item(i);
            if (item) {
                touchArray.push(item);
            }
        }
        return touchArray;
    };

    if (typeof win.TouchEvent === 'function') {
        const newEvent = new win.TouchEvent(e.type, {
            touches: touchListToTouchArray(e.touches),
            targetTouches: touchListToTouchArray(e.targetTouches),
            changedTouches: touchListToTouchArray(e.changedTouches),
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            composed: e.composed,
            detail: e.detail,
            view: e.view
        });
        if (e.defaultPrevented) {
            newEvent.preventDefault();
        }
        return newEvent;
    }

    // Fallback to mouse event
    type Writeable<T> = { -readonly [P in keyof T]: T[P] };
    const fakeEvt = cloneMouseEvent(e as unknown as MouseEvent) as unknown as Writeable<TouchEvent>;
    fakeEvt.touches = e.touches;
    fakeEvt.changedTouches = e.changedTouches;
    fakeEvt.targetTouches = e.targetTouches;
    return fakeEvt;
}


/**
 * @private
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
 * @private
 */
function getElement(
    id: string
): (DOMElementType|null) {
    return doc.getElementById(id);
}


/**
 * Get a fake mouse event of a given type. If relatedTarget is not given,
 * it will point to simulatedEventTarget, as an indicator that the event
 * is fake.
 * @private
 */
function getFakeMouseEvent(
    type: string,
    position?: { x: number, y: number },
    relatedTarget?: EventTarget
): MouseEvent {
    const pos = position || {
        x: 0,
        y: 0
    };

    if (typeof win.MouseEvent === 'function') {
        return new win.MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            button: 0,
            buttons: 1,
            relatedTarget: relatedTarget || simulatedEventTarget,
            view: win,
            detail: type === 'click' ? 1 : 0,
            screenX: pos.x,
            screenY: pos.y,
            clientX: pos.x,
            clientY: pos.y
        });
    }

    // No MouseEvent support, try using initMouseEvent
    if (doc.createEvent) {
        const evt = doc.createEvent('MouseEvent');
        if (evt.initMouseEvent) {
            evt.initMouseEvent(
                type,
                true, // Bubble
                true, // Cancel
                win, // View
                type === 'click' ? 1 : 0, // Detail
                // Coords
                pos.x,
                pos.y,
                pos.x,
                pos.y,
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

    return { type: type } as MouseEvent;
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
        const headingLevel = parseInt(tagName.slice(1), 10),
            newLevel = Math.min(6, headingLevel + 1);
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
 * Remove all child nodes from an element.
 * @private
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement} [element]
 * @return {void}
 */
function removeChildNodes(element: DOMElementType): void {
    while (element.lastChild) {
        element.removeChild(element.lastChild);
    }
}


/**
 * Utility function. Reverses child nodes of a DOM element.
 * @private
 */
function reverseChildNodes(node: DOMElementType): void {
    let i = node.childNodes.length;
    while (i--) {
        node.appendChild(node.childNodes[i]);
    }
}


/**
 * Used for aria-label attributes, painting on a canvas will fail if the
 * text contains tags.
 * @private
 */
function stripHTMLTagsFromString(
    str: string,
    isForExport: boolean = false
): string {
    return (typeof str === 'string') ?
        (isForExport ?
            str.replace(/<\/?[^>]+(>|$)/g, '') :
            str.replace(/<\/?(?!\s)[^>]+(>|$)/g, '')) : str;
}


/**
 * Utility function for hiding an element visually, but still keeping it
 * available to screen reader users.
 * @private
 */
function visuallyHideElement(element: HTMLDOMElement): void {
    css(element, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        clip: 'rect(1px, 1px, 1px, 1px)',
        marginTop: '-3px',
        '-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=1)',
        filter: 'alpha(opacity=1)',
        opacity: 0.01
    });
}


/* *
 *
 *  Default Export
 *
 * */

const HTMLUtilities = {
    addClass,
    cloneMouseEvent,
    cloneTouchEvent,
    escapeStringForHTML,
    getElement,
    getFakeMouseEvent,
    getHeadingTagNameForElement,
    removeChildNodes,
    removeClass,
    removeElement,
    reverseChildNodes,
    simulatedEventTarget,
    stripHTMLTagsFromString,
    visuallyHideElement
};

export default HTMLUtilities;
