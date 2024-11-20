/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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
    SVGDOMElement
} from '../DOMElementType';
import type SVGAttributes from './SVGAttributes';
import type SVGElement from './SVGElement';
import type SVGRenderer from './SVGRenderer';

import AST from '../HTML/AST.js';
import H from '../../Globals.js';
const {
    doc,
    SVG_NS,
    win
} = H;
import U from '../../Utilities.js';
const {
    attr,
    css,
    extend,
    fireEvent,
    isString,
    objectEach,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * SVG Text Builder
 * @private
 * @class
 * @name Highcharts.TextBuilder
 */
class TextBuilder {

    public constructor(svgElement: SVGElement) {
        const textStyles = svgElement.styles;

        this.renderer = svgElement.renderer;
        this.svgElement = svgElement;
        this.width = svgElement.textWidth;

        this.textLineHeight = textStyles && textStyles.lineHeight;
        this.textOutline = textStyles && textStyles.textOutline;
        this.ellipsis = Boolean(
            textStyles && textStyles.textOverflow === 'ellipsis'
        );
        this.noWrap = Boolean(textStyles && textStyles.whiteSpace === 'nowrap');
    }

    public ellipsis: boolean;
    public noWrap: boolean;
    public renderer: SVGRenderer;
    public svgElement: SVGElement;
    public textLineHeight: any;
    public textOutline: any;
    public width?: number;

    /**
     * Build an SVG representation of the pseudo HTML given in the object's
     * svgElement.
     *
     * @private
     *
     * @return {void}.
     */
    public buildSVG(): void {
        const wrapper = this.svgElement,
            textNode = wrapper.element,
            renderer = wrapper.renderer,
            textStr = pick(wrapper.textStr, '').toString() as string,
            hasMarkup = textStr.indexOf('<') !== -1,
            childNodes = textNode.childNodes,
            tempParent = !wrapper.added && renderer.box,
            regexMatchBreaks = /<br.*?>/g,
            // The buildText code is quite heavy, so if we're not changing
            // something that affects the text, skip it (#6113).
            textCache = [
                textStr,
                this.ellipsis,
                this.noWrap,
                this.textLineHeight,
                this.textOutline,
                wrapper.getStyle('font-size'),
                this.width
            ].join(',');

        if (textCache === wrapper.textCache) {
            return;
        }
        wrapper.textCache = textCache;
        delete wrapper.actualWidth;

        // Remove old text
        for (let i = childNodes.length; i--;) {
            textNode.removeChild(childNodes[i]);
        }

        // Simple strings, add text directly and return
        if (
            !hasMarkup &&
            !this.ellipsis &&
            !this.width &&
            !wrapper.textPath &&
            (
                textStr.indexOf(' ') === -1 ||
                (this.noWrap && !regexMatchBreaks.test(textStr))
            )
        ) {
            textNode.appendChild(
                doc.createTextNode(this.unescapeEntities(textStr))
            );

        // Complex strings, add more logic
        } else if (textStr !== '') {

            if (tempParent) {
                // Attach it to the DOM to read offset width and font size
                tempParent.appendChild(textNode);
            }

            // Step 1. Parse the markup safely and directly into a tree
            // structure.
            const ast = new AST(textStr);

            // Step 2. Do as many as we can of the modifications to the tree
            // structure before it is added to the DOM
            this.modifyTree(ast.nodes);

            ast.addToDOM(textNode);

            // Step 3. Some modifications can't be done until the structure is
            // in the DOM, because we need to read computed metrics.
            this.modifyDOM();

            // Add title if an ellipsis was added
            if (
                this.ellipsis &&
                (textNode.textContent || '').indexOf('\u2026') !== -1
            ) {
                wrapper.attr(
                    'title',
                    this.unescapeEntities(
                        wrapper.textStr || '',
                        ['&lt;', '&gt;']
                    ) // #7179
                );
            }
            if (tempParent) {
                tempParent.removeChild(textNode);
            }
        }

        // Apply the text outline
        if (isString(this.textOutline) && wrapper.applyTextOutline) {
            wrapper.applyTextOutline(this.textOutline);
        }
    }

    /**
     * Modify the DOM of the generated SVG structure. This function only does
     * operations that cannot be done until the elements are attached to the
     * DOM, like doing layout based on rendered metrics of the added elements.
     *
     * @private
     *
     */
    private modifyDOM(): void {

        const wrapper = this.svgElement;
        const x = attr(wrapper.element, 'x');
        wrapper.firstLineMetrics = void 0;

        // Remove empty tspans (including breaks) from the beginning because
        // SVG's getBBox doesn't count empty lines. The use case is tooltip
        // where the header is empty. By doing this in the DOM rather than in
        // the AST, we can inspect the textContent directly and don't have to
        // recurse down to look for valid content.
        let firstChild: ChildNode|null;
        while ((firstChild = wrapper.element.firstChild)) {
            if (
                /^[\s\u200B]*$/.test(firstChild.textContent || ' ')
            ) {
                wrapper.element.removeChild(firstChild);
            } else {
                break;
            }
        }

        // Modify hard line breaks by applying the rendered line height
        [].forEach.call(
            wrapper.element.querySelectorAll('tspan.highcharts-br'),
            (br: SVGDOMElement, i): void => {
                if (br.nextSibling && br.previousSibling) { // #5261

                    if (i === 0 && br.previousSibling.nodeType === 1) {
                        wrapper.firstLineMetrics = wrapper.renderer
                            .fontMetrics(br.previousSibling as DOMElementType);
                    }

                    attr(br, {
                        // Since the break is inserted in front of the next
                        // line, we need to use the next sibling for the line
                        // height
                        dy: this.getLineHeight(br.nextSibling as any) as any,
                        x
                    } as unknown as SVGAttributes);
                }
            }
        );

        // Constrain the line width, either by ellipsis or wrapping
        const width = this.width || 0;
        if (!width) {
            return;
        }

        // Insert soft line breaks into each text node
        const modifyTextNode = (
            textNode: Text,
            parentElement: DOMElementType
        ): void => {
            const text = textNode.textContent || '';
            const words = text
                .replace(/([^\^])-/g, '$1- ') // Split on hyphens
                // .trim()
                .split(' '); // #1273
            const hasWhiteSpace = !this.noWrap && (
                words.length > 1 || wrapper.element.childNodes.length > 1
            );

            const dy = this.getLineHeight(parentElement);

            let lineNo = 0;
            let startAt = wrapper.actualWidth;

            if (this.ellipsis) {
                if (text) {
                    this.truncate(
                        textNode,
                        text,
                        void 0,
                        0,
                        // Target width
                        width,
                        // Substract the font face to make room for the ellipsis
                        // itself
                        dy,
                        // Build the text to test for
                        (text: string, currentIndex: number): string =>
                            text.substring(0, currentIndex) + '\u2026'
                    );
                }
            } else if (hasWhiteSpace) {
                const lines: string[] = [];

                // Remove preceding siblings in order to make the text length
                // calculation correct in the truncate function
                const precedingSiblings: ChildNode[] = [];
                while (
                    parentElement.firstChild &&
                    parentElement.firstChild !== textNode
                ) {
                    precedingSiblings.push(parentElement.firstChild);
                    parentElement.removeChild(parentElement.firstChild);
                }

                while (words.length) {

                    // Apply the previous line
                    if (words.length && !this.noWrap && lineNo > 0) {

                        lines.push(textNode.textContent || '');
                        textNode.textContent = words.join(' ')
                            .replace(/- /g, '-');
                    }

                    // For each line, truncate the remaining
                    // words into the line length.
                    this.truncate(
                        textNode,
                        void 0,
                        words,
                        lineNo === 0 ? (startAt || 0) : 0,
                        width,
                        0,
                        // Build the text to test for
                        (t: string, currentIndex: number): string =>
                            words
                                .slice(0, currentIndex)
                                .join(' ')
                                .replace(/- /g, '-')
                    );

                    startAt = wrapper.actualWidth;
                    lineNo++;
                }

                // Reinsert the preceding child nodes
                precedingSiblings.forEach((childNode): void => {
                    parentElement.insertBefore(childNode, textNode);
                });

                // Insert the previous lines before the original text node
                lines.forEach((line): void => {

                    // Insert the line
                    parentElement.insertBefore(
                        doc.createTextNode(line),
                        textNode
                    );

                    // Insert a break
                    const br = doc.createElementNS(
                        SVG_NS,
                        'tspan'
                    ) as SVGDOMElement;
                    br.textContent = '\u200B'; // Zero-width space
                    attr(br, { dy, x } as unknown as SVGAttributes);
                    parentElement.insertBefore(br, textNode);
                });

            }
        };

        // Recurse down the DOM tree and handle line breaks for each text node
        const modifyChildren = ((node: DOMElementType): void => {
            const childNodes = [].slice.call(node.childNodes);
            childNodes.forEach((childNode: ChildNode): void => {
                if (childNode.nodeType === win.Node.TEXT_NODE) {
                    modifyTextNode(childNode as Text, node);
                } else {
                    // Reset word-wrap width readings after hard breaks
                    if (
                        (childNode as DOMElementType).className.baseVal
                            .indexOf('highcharts-br') !== -1
                    ) {
                        wrapper.actualWidth = 0;
                    }
                    // Recurse down to child node
                    modifyChildren(childNode as DOMElementType);
                }
            });
        });
        modifyChildren(wrapper.element);
    }

    /**
     * Get the rendered line height of a <text>, <tspan> or pure text node.
     *
     * @param {DOMElementType|Text} node The node to check for
     *
     * @return {number} The rendered line height
     */
    private getLineHeight(node: DOMElementType|Text): number {
        // If the node is a text node, use its parent
        const element: DOMElementType|null = (
            node.nodeType === win.Node.TEXT_NODE
        ) ?
            node.parentElement :
            node as DOMElementType;

        return this.textLineHeight ?
            parseInt(this.textLineHeight.toString(), 10) :
            this.renderer.fontMetrics(element || this.svgElement.element).h;
    }

    /**
     * Transform a pseudo HTML AST node tree into an SVG structure. We do as
     * much heavy lifting as we can here, before doing the final processing in
     * the modifyDOM function. The original data is mutated.
     *
     * @private
     *
     * @param {ASTNode[]} nodes The AST nodes
     *
     */
    private modifyTree(
        nodes: AST.Node[]
    ): void {

        const modifyChild = (node: AST.Node, i: number): void => {
            const { attributes = {}, children, style = {}, tagName } = node,
                styledMode = this.renderer.styledMode;

            // Apply styling to text tags
            if (tagName === 'b' || tagName === 'strong') {
                if (styledMode) {
                    // eslint-disable-next-line dot-notation
                    attributes['class'] = 'highcharts-strong';
                } else {
                    style.fontWeight = 'bold';
                }
            } else if (tagName === 'i' || tagName === 'em') {
                if (styledMode) {
                    // eslint-disable-next-line dot-notation
                    attributes['class'] = 'highcharts-emphasized';
                } else {
                    style.fontStyle = 'italic';
                }
            }

            // Modify styling
            if (style && style.color) {
                style.fill = style.color;
            }

            // Handle breaks
            if (tagName === 'br') {
                attributes['class'] = 'highcharts-br'; // eslint-disable-line dot-notation
                node.textContent = '\u200B'; // Zero-width space

                // Trim whitespace off the beginning of new lines
                const nextNode = nodes[i + 1];
                if (nextNode && nextNode.textContent) {
                    nextNode.textContent =
                        nextNode.textContent.replace(/^ +/gm, '');
                }

            // If an anchor has direct text node children, the text is unable to
            // wrap because there is no `getSubStringLength` function on the
            // element. Therefore we need to wrap the child text node or nodes
            // in a tspan. #16173.
            } else if (
                tagName === 'a' &&
                children &&
                children.some((child): boolean => child.tagName === '#text')
            ) {
                node.children = [{ children, tagName: 'tspan' }];
            }

            if (tagName !== '#text' && tagName !== 'a') {
                node.tagName = 'tspan';
            }
            extend(node, { attributes, style });

            // Recurse
            if (children) {
                children
                    .filter((c): boolean => c.tagName !== '#text')
                    .forEach(modifyChild);
            }
        };

        nodes.forEach(modifyChild);

        fireEvent(this.svgElement, 'afterModifyTree', { nodes });
    }

    /*
     * Truncate the text node contents to a given length. Used when the css
     * width is set. If the `textOverflow` is `ellipsis`, the text is truncated
     * character by character to the given length. If not, the text is
     * word-wrapped line by line.
     */
    private truncate(
        textNode: Text,
        text: (string|undefined),
        words: (Array<string>|undefined),
        startAt: number,
        width: number,
        lineHeight: number,
        getString: Function
    ): void {
        const svgElement = this.svgElement,
            { rotation } = svgElement,
            // Cache the lengths to avoid checking the same twice
            lengths: Array<number> = [],
            innerWidth = Math.max(0, width - lineHeight * 0.8),
            parentElement = textNode
                .parentElement as unknown as SVGTextElement|null;

        // Word wrap cannot be truncated to shorter than one word, ellipsis
        // text can be completely blank.
        let minIndex = words ? 1 : 0,
            maxIndex = (text || words || '').length,
            currentIndex = maxIndex,
            str,
            actualWidth: number,
            clipWidth: number|undefined;

        const getSubStringLength = (
            charEnd: number,
            concatenatedEnd?: number
        ): number => {
            // The `charEnd` is used when finding the character-by-character
            // break for ellipsis, concatenatedEnd is used for word-by-word
            // break for word wrapping.
            const end = concatenatedEnd || charEnd;

            if (parentElement && typeof lengths[end] === 'undefined') {
                // Modern browsers
                if (parentElement.getSubStringLength) {
                    // Fails with DOM exception on unit-tests/legend/members
                    // of unknown reason. Desired width is 0, text content
                    // is "5" and end is 1.
                    try {
                        lengths[end] = startAt +
                            parentElement.getSubStringLength(
                                0,
                                words ? end + 1 : end
                            );

                    } catch (e) {
                        '';
                    }
                }
            }
            return lengths[end];
        };

        svgElement.rotation = 0; // Discard rotation when computing box
        actualWidth = getSubStringLength((textNode.textContent as any).length);

        if (startAt + actualWidth > innerWidth) {

            // Do a binary search for the index where to truncate the text
            while (minIndex <= maxIndex) {
                currentIndex = Math.ceil((minIndex + maxIndex) / 2);

                // When checking words for word-wrap, we need to build the
                // string and measure the subStringLength at the concatenated
                // word length.
                if (words) {
                    str = getString(words, currentIndex);
                }
                actualWidth = getSubStringLength(
                    currentIndex,
                    str && str.length - 1
                );

                if (minIndex === maxIndex) {
                    // Complete
                    minIndex = maxIndex + 1;
                } else if (actualWidth > innerWidth) {
                    // Too large. Set max index to current.
                    maxIndex = currentIndex - 1;
                } else {
                    // Within width. Set min index to current.
                    minIndex = currentIndex;
                }
            }

            // Shorter than a single character - remove it
            if (width < lineHeight / 2) {
                textNode.textContent = '';

            // If the new text length is one less than the original, we don't
            // need the ellipsis
            } else if (!(text && maxIndex === text.length - 1)) {
                textNode.textContent = str || getString(
                    text || words,
                    Math.max(1, currentIndex)
                );
                // If the maxIndex is 0 or 1, we're only left with the first
                // letter or nothing at all. In this case, mimic HTML/CSS and
                // clip to the first letter + an ellipsis. #20192.
                if (currentIndex < 2) {
                    clipWidth = width;
                }
            }
        }

        if (text && parentElement) {
            css(parentElement, {
                clipPath: clipWidth ?
                    `polygon(0 0,${width}px 0,${width}px 100%,0 100%)` :
                    'none'
            });
        }

        // When doing line wrapping, prepare for the next line by removing the
        // items from this line.
        if (words) {
            words.splice(0, currentIndex);
        }

        extend(svgElement, {
            actualWidth,
            clipWidth,
            rotation // Apply rotation again
        });
    }

    /*
     * Un-escape HTML entities based on the public `renderer.escapes` list
     *
     * @private
     *
     * @param {string} inputStr The string to unescape
     * @param {Array<string>} [except] Exceptions
     *
     * @return {string} The processed string
     */
    private unescapeEntities(
        inputStr: string,
        except?: Array<string>
    ): string {
        objectEach(this.renderer.escapes, function (
            value: string,
            key: string
        ): void {
            if (!except || except.indexOf(value) === -1) {
                inputStr = inputStr.toString().replace(
                    new RegExp(value, 'g'),
                    key
                );
            }
        });
        return inputStr;
    }
}

export default TextBuilder;
