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
import U from '../../Utilities.js';
const {
    attr,
    createElement,
    extend,
    isNumber,
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
 *  Composition
 *
 * */

/* eslint-disable valid-jsdoc */

// Extend SvgRenderer for useHTML option.
class HTMLRenderer extends SVGRenderer {

    /* *
     *
     *  Functions
     *
     * */

    /** @private */
    public static compose(SVGRendererClass: typeof SVGRenderer): void {
        const svgRendererProto = SVGRendererClass.prototype,
            htmlRendererProto = HTMLRenderer.prototype;

        svgRendererProto.html = htmlRendererProto.html;
    }

    /**
     * Create HTML text node. This is used by the VML renderer as well as the
     * SVG renderer through the useHTML option.
     *
     * @private
     * @function Highcharts.SVGRenderer#html
     *
     * @param {string} str
     *        The text of (subset) HTML to draw.
     *
     * @param {number} x
     *        The x position of the text's lower left corner.
     *
     * @param {number} y
     *        The y position of the text's lower left corner.
     *
     * @return {Highcharts.HTMLDOMElement}
     */
    public html(
        this: HTMLRenderer,
        str: string,
        x: number,
        y: number
    ): HTMLElement {
        const wrapper = this.createElement('span') as HTMLElement,
            element = wrapper.element,
            renderer = wrapper.renderer,
            isSVG = renderer.isSVG,
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

        // Add setters for the element itself (#4938)
        if (isSVG) { // #4938, only for HTML within SVG
            addSetters(wrapper, wrapper.element.style);
        }

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
                // Do not overwrite the SVGElement.align method. Same as VML.
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

        // This is specific for HTML within SVG
        if (isSVG) {
            wrapper.add = function (svgGroupWrapper?: HTMLElement): HTMLElement {

                let htmlGroup: (HTMLElement|HTMLDOMElement|null|undefined),
                    container = renderer.box.parentNode,
                    parentGroup,
                    parents = [] as Array<HTMLElement>;

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
                            let htmlGroupStyle: CSSObject,
                                cls = attr(parentGroup.element, 'class');

                            /**
                             * Common translate setter for X and Y on the HTML
                             * group. Reverted the fix for #6957 du to
                             * positioning problems and offline export (#7254,
                             * #7280, #7529)
                             * @private
                             * @param {*} value
                             * @param {string} key
                             * @return {void}
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
                                    cursor: parentGroupStyles.cursor, // #6794
                                    pointerEvents:
                                        parentGroupStyles.pointerEvents, // #5595
                                    zIndex: // #11701
                                        isNumber(parentGroup.zIndex) ?
                                            (Number(
                                                renderer.box.parentNode.style.zIndex
                                            ) || 0) + parentGroup.zIndex :
                                            void 0

                                // the top group is appended to container
                                },
                                (htmlGroup as any) || container
                            );

                            // Shortcut
                            htmlGroupStyle = (htmlGroup as any).style;

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
                        });

                    }
                } else {
                    htmlGroup = container as any;
                }

                (htmlGroup as any).appendChild(element);

                // Shared with VML:
                wrapper.added = true;
                if (wrapper.alignOnAdd) {
                    wrapper.htmlUpdateTransform();
                }

                return wrapper;
            };
        }
        return wrapper;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default HTMLRenderer;
