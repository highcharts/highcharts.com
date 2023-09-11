/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type CSSObject from '../CSSObject';
import type HTMLElement from './HTMLElement';
import type { HTMLDOMElement } from '../DOMElementType';

import AST from './AST.js';
import SVGElement from '../SVG/SVGElement.js';
import SVGRenderer from '../SVG/SVGRenderer.js';
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { extend } = OH;
const {
    attr,
    createElement,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../SVG/SVGRendererLike' {
    interface SVGRendererLike {
        /** @requires Core/Renderer/HTML/HTMLRenderer */
        html(str: string, x: number, y: number): HTMLElement;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Class
 *
 * */

/* eslint-disable valid-jsdoc */

// Extend SvgRenderer for useHTML option.
class HTMLRenderer extends SVGRenderer {

    /* *
     *
     *  Static Functions
     *
     * */

    /** @private */
    public static compose<T extends typeof SVGRenderer>(
        SVGRendererClass: T
    ): (T&typeof HTMLRenderer) {

        if (pushUnique(composedMembers, SVGRendererClass)) {
            const htmlRendererProto = HTMLRenderer.prototype,
                svgRendererProto = SVGRendererClass.prototype;

            svgRendererProto.html = htmlRendererProto.html;
        }

        return SVGRendererClass as (T&typeof HTMLRenderer);
    }

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Create HTML text node. This is used by the SVG renderer through the
     * useHTML option.
     *
     * @private
     * @function Highcharts.SVGRenderer#html
     *
     * @param {string} str
     * The text of (subset) HTML to draw.
     *
     * @param {number} x
     * The x position of the text's lower left corner.
     *
     * @param {number} y
     * The y position of the text's lower left corner.
     *
     * @return {Highcharts.HTMLDOMElement}
     * HTML element.
     */
    public html(
        str: string,
        x: number,
        y: number
    ): HTMLElement {
        const wrapper = this.createElement('span') as HTMLElement,
            element = wrapper.element,
            renderer = wrapper.renderer,
            addSetters = function (
                gWrapper: HTMLElement,
                style?: CSSStyleDeclaration
            ): void {
                // These properties are set as attributes on the SVG group, and
                // as identical CSS properties on the div. (#3542)
                ['opacity', 'visibility'].forEach(function (
                    prop: string
                ): void {
                    gWrapper[prop + 'Setter'] = function (
                        value: string,
                        key: string,
                        elem: HTMLElement
                    ): void {
                        const styleObject = gWrapper.div ?
                            gWrapper.div.style :
                            style;
                        SVGElement.prototype[prop + 'Setter']
                            .call(this, value, key, elem);
                        if (styleObject) {
                            styleObject[key as any] = value;
                        }
                    };
                });
                gWrapper.addedSetters = true;
            };

        // Text setter
        wrapper.textSetter = function (value: string): void {
            if (value !== this.textStr) {
                delete this.bBox;
                delete this.oldTextWidth;

                AST.setElementHTML(this.element, pick(value, ''));

                this.textStr = value;
                wrapper.doTransform = true;
            }
        };

        addSetters(wrapper, wrapper.element.style);

        // Various setters which rely on update transform
        wrapper.xSetter =
        wrapper.ySetter =
        wrapper.alignSetter =
        wrapper.rotationSetter =
        function (
            value: string,
            key?: string
        ): void {
            if (key === 'align') {
                // Do not overwrite the SVGElement.align method.
                wrapper.alignValue = wrapper.textAlign = value as any;
            } else {
                wrapper[key as any] = value;
            }
            wrapper.doTransform = true;
        };

        // Runs at the end of .attr()
        wrapper.afterSetters = function (): void {
            // Update transform. Do this outside the loop to prevent redundant
            // updating for batch setting of attributes.
            if (this.doTransform) {
                this.htmlUpdateTransform();
                this.doTransform = false;
            }
        };

        // Set the default attributes
        wrapper
            .attr({
                text: str,
                x: Math.round(x),
                y: Math.round(y)
            })
            .css({
                position: 'absolute'
            });

        if (!renderer.styledMode) {
            wrapper.css({
                fontFamily: this.style.fontFamily,
                fontSize: this.style.fontSize
            });
        }

        // Keep the whiteSpace style outside the wrapper.styles collection
        element.style.whiteSpace = 'nowrap';

        // Use the HTML specific .css method
        wrapper.css = wrapper.htmlCss;
        wrapper.add = function (
            svgGroupWrapper?: HTMLElement
        ): HTMLElement {
            const container = renderer.box.parentNode,
                parents = [] as Array<HTMLElement>;

            let htmlGroup: (HTMLElement|HTMLDOMElement|null|undefined),
                parentGroup;

            this.parentGroup = svgGroupWrapper as any;

            // Create a mock group to hold the HTML elements
            if (svgGroupWrapper) {
                htmlGroup = svgGroupWrapper.div;
                if (!htmlGroup) {

                    // Read the parent chain into an array and read from top
                    // down
                    parentGroup = svgGroupWrapper;
                    while (parentGroup) {

                        parents.push(parentGroup);

                        // Move up to the next parent group
                        parentGroup = parentGroup.parentGroup;
                    }

                    // Ensure dynamically updating position when any parent
                    // is translated
                    parents.reverse().forEach(function (parentGroup): void {
                        const cls = attr(parentGroup.element, 'class'),
                            parentProtoCss = parentGroup.css;

                        /**
                         * Common translate setter for X and Y on the HTML
                         * group. Reverted the fix for #6957 du to
                         * positioning problems and offline export (#7254,
                         * #7280, #7529)
                         * @private
                         * @param {*} value
                         * @param {string} key
                                                 */
                        function translateSetter(
                            value: any,
                            key: string
                        ): void {
                            parentGroup[key] = value;

                            if (key === 'translateX') {
                                htmlGroupStyle.left = value + 'px';
                            } else {
                                htmlGroupStyle.top = value + 'px';
                            }

                            parentGroup.doTransform = true;
                        }

                        // Create a HTML div and append it to the parent div
                        // to emulate the SVG group structure
                        const parentGroupStyles = parentGroup.styles || {};
                        htmlGroup =
                        parentGroup.div =
                        parentGroup.div || createElement(
                            'div',
                            cls ? { className: cls } : void 0,
                            {
                                position: 'absolute',
                                left: (parentGroup.translateX || 0) + 'px',
                                top: (parentGroup.translateY || 0) + 'px',
                                display: parentGroup.display,
                                opacity: parentGroup.opacity, // #5075
                                visibility: parentGroup.visibility

                            // the top group is appended to container
                            },
                            (htmlGroup as any) || container
                        );

                        // Shortcut
                        const htmlGroupStyle = (htmlGroup as any).style;

                        // Set listeners to update the HTML div's position
                        // whenever the SVG group position is changed.
                        extend(parentGroup, {
                            // (#7287) Pass htmlGroup to use
                            // the related group
                            classSetter: (function (
                                htmlGroup: HTMLElement
                            ): Function {
                                return function (
                                    this: HTMLElement,
                                    value: string
                                ): void {
                                    this.element.setAttribute(
                                        'class',
                                        value
                                    );
                                    htmlGroup.className = value;
                                };
                            }(htmlGroup as any)),

                            // Extend the parent group's css function by
                            // updating the shadow div counterpart with the same
                            // style.
                            css: function (styles: CSSObject): HTMLElement {

                                // Call the base css method. The `parentGroup`
                                // can be either an SVGElement or an SVGLabel,
                                // in which the css method is extended (#19200).
                                parentProtoCss.call(parentGroup, styles);

                                (
                                    [
                                        // #6794
                                        'cursor',
                                        // #5595, #18821
                                        'pointerEvents'
                                    ] as (keyof CSSObject)[]
                                ).forEach((prop): void => {
                                    if (styles[prop]) {
                                        htmlGroupStyle[prop] = styles[prop];
                                    }
                                });
                                return parentGroup;
                            },

                            on: function (): HTMLElement {
                                if (parents[0].div) { // #6418
                                    wrapper.on.apply({
                                        element: parents[0].div,
                                        onEvents: parentGroup.onEvents
                                    }, arguments);
                                }
                                return parentGroup;
                            },
                            translateXSetter: translateSetter,
                            translateYSetter: translateSetter
                        });
                        if (!parentGroup.addedSetters) {
                            addSetters(parentGroup);
                        }

                        // Apply pre-existing style
                        parentGroup.css(parentGroupStyles);

                    });

                }
            } else {
                htmlGroup = container as any;
            }

            (htmlGroup as any).appendChild(element);

            wrapper.added = true;
            if (wrapper.alignOnAdd) {
                wrapper.htmlUpdateTransform();
            }

            return wrapper;
        };
        return wrapper;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default HTMLRenderer;
