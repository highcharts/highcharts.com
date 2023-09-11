/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type { AlignValue } from '../AlignObject';
import type BBoxObject from '../BBoxObject';
import type ColorType from '../../Color/ColorType';
import type CSSObject from '../CSSObject';
import type SVGAttributes from './SVGAttributes';
import type SVGPath from './SVGPath';
import type SVGRenderer from './SVGRenderer';
import type { SymbolKey } from './SymbolType';

import SVGElement from './SVGElement.js';
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined, extend, merge } = OH;
const { removeEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * SVG label to render text.
 * @private
 * @class
 * @name Highcharts.SVGLabel
 * @augments Highcharts.SVGElement
 */
class SVGLabel extends SVGElement {

    /* *
     *
     *  Static Properties
     *
     * */

    public static readonly emptyBBox: BBoxObject = {
        width: 0,
        height: 0,
        x: 0,
        y: 0
    };

    /**
     * For labels, these CSS properties are applied to the `text` node directly.
     *
     * @private
     * @name Highcharts.SVGLabel#textProps
     * @type {Array<string>}
     */
    public static textProps: Array<keyof CSSObject> = [
        'color', 'direction', 'fontFamily', 'fontSize', 'fontStyle',
        'fontWeight', 'lineHeight', 'textAlign', 'textDecoration',
        'textOutline', 'textOverflow', 'whiteSpace', 'width'
    ];

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        renderer: SVGRenderer,
        str: string,
        x: number,
        y?: number,
        shape?: (SymbolKey|string),
        anchorX?: number,
        anchorY?: number,
        useHTML?: boolean,
        baseline?: boolean,
        className?: string
    ) {
        super();
        this.init(renderer, 'g');

        this.textStr = str;
        this.x = x;
        this.y = y;
        this.anchorX = anchorX;
        this.anchorY = anchorY;
        this.baseline = baseline;
        this.className = className;

        this.addClass(
            className === 'button' ?
                'highcharts-no-tooltip' :
                'highcharts-label'
        );

        if (className) {
            this.addClass('highcharts-' + className);
        }

        // Create the text element. An undefined text content prevents redundant
        // box calculation (#16121)
        this.text = renderer.text(void 0, 0, 0, useHTML).attr({ zIndex: 1 });

        // Validate the shape argument
        let hasBGImage;
        if (typeof shape === 'string') {
            hasBGImage = /^url\((.*?)\)$/.test(shape);
            if (hasBGImage || this.renderer.symbols[shape as SymbolKey]) {
                this.symbolKey = shape;
            }
        }

        this.bBox = SVGLabel.emptyBBox;
        this.padding = 3;
        this.baselineOffset = 0;
        this.needsBox = renderer.styledMode || hasBGImage;
        this.deferredAttr = {};
        this.alignFactor = 0;

    }

    /* *
     *
     *  Properties
     *
     * */

    public alignFactor: number;
    public baselineOffset: number;
    public bBox: BBoxObject;
    public box?: SVGElement;
    public deferredAttr: (SVGAttributes&AnyRecord);
    public heightSetting?: number;
    public needsBox?: boolean;
    public padding: number;
    public paddingLeftSetter = this.paddingSetter;
    public paddingRightSetter = this.paddingSetter;
    public text: SVGElement;
    public textStr: string;
    public x: number;

    /* *
     *
     *  Functions
     *
     * */

    public alignSetter(value: AlignValue): void {
        const alignFactor = ({
            left: 0,
            center: 0.5,
            right: 1
        })[value];
        if (alignFactor !== this.alignFactor) {
            this.alignFactor = alignFactor;
            // Bounding box exists, means we're dynamically changing
            if (this.bBox && isNumber(this.xSetting)) {
                this.attr({ x: this.xSetting }); // #5134
            }
        }
    }

    public anchorXSetter(value: number, key: string): void {
        this.anchorX = value;
        this.boxAttr(
            key,
            Math.round(value) - this.getCrispAdjust() - this.xSetting
        );
    }

    public anchorYSetter(value: number, key: string): void {
        this.anchorY = value;
        this.boxAttr(key, value - this.ySetting);
    }

    /*
     * Set a box attribute, or defer it if the box is not yet created
     */
    private boxAttr(
        key: string,
        value: (number|string|ColorType|SVGPath)
    ): void {
        if (this.box) {
            this.box.attr(key, value);
        } else {
            this.deferredAttr[key] = value;
        }
    }

    /*
     * Pick up some properties and apply them to the text instead of the
     * wrapper.
     */
    public css(styles: CSSObject): this {
        if (styles) {
            const textStyles: AnyRecord = {};

            // Create a copy to avoid altering the original object
            // (#537)
            styles = merge(styles);
            SVGLabel.textProps.forEach((prop): void => {
                if (typeof styles[prop] !== 'undefined') {
                    textStyles[prop] = styles[prop];
                    delete styles[prop];
                }
            });
            this.text.css(textStyles);

            // Update existing text, box (#9400, #12163, #18212)
            if ('fontSize' in textStyles || 'fontWeight' in textStyles) {
                this.updateTextPadding();
            } else if ('width' in textStyles || 'textOverflow' in textStyles) {
                this.updateBoxSize();
            }

        }
        return SVGElement.prototype.css.call(this, styles) as this;
    }

    /*
     * Destroy and release memory.
     */
    public destroy(): undefined {

        // Added by button implementation
        removeEvent(this.element, 'mouseenter');
        removeEvent(this.element, 'mouseleave');

        if (this.text) {
            this.text.destroy();
        }
        if (this.box) {
            this.box = this.box.destroy();
        }
        // Call base implementation to destroy the rest
        SVGElement.prototype.destroy.call(this);

        return void 0;
    }

    public fillSetter(value: ColorType, key: string): void {
        if (value) {
            this.needsBox = true;
        }
        // for animation getter (#6776)
        this.fill = value;
        this.boxAttr(key, value);
    }

    /*
     * Return the bounding box of the box, not the group.
     */
    public getBBox(): BBoxObject {
        // If we have a text string and the DOM bBox was 0, it typically means
        // that the label was first rendered hidden, so we need to update the
        // bBox (#15246)
        if (this.textStr && this.bBox.width === 0 && this.bBox.height === 0) {
            this.updateBoxSize();
        }
        const padding = this.padding;
        const paddingLeft = pick(this.paddingLeft, padding);
        return {
            width: this.width,
            height: this.height,
            x: this.bBox.x - paddingLeft,
            y: this.bBox.y - padding
        };
    }

    private getCrispAdjust(): number {
        return this.renderer.styledMode && this.box ?
            this.box.strokeWidth() % 2 / 2 :
            (
                this['stroke-width'] ? parseInt(this['stroke-width'], 10) : 0
            ) % 2 / 2;
    }

    public heightSetter(value: number): void {
        this.heightSetting = value;
    }

    /*
     * After the text element is added, get the desired size of the border
     * box and add it before the text in the DOM.
     */
    public onAdd(): void {
        this.text.add(this);
        this.attr({
            // Alignment is available now  (#3295, 0 not rendered if given
            // as a value)
            text: pick(this.textStr, ''),
            x: this.x || 0,
            y: this.y || 0
        });

        if (this.box && defined(this.anchorX)) {
            this.attr({
                anchorX: this.anchorX,
                anchorY: this.anchorY
            });
        }
    }

    public paddingSetter(
        value: (number|string),
        key: string
    ): void {
        if (!isNumber(value)) {
            this[key] = void 0;
        } else if (value !== this[key]) {
            this[key] = value;
            this.updateTextPadding();
        }
    }

    public rSetter(
        value: (number|string|ColorType|SVGPath),
        key: string
    ): void {
        this.boxAttr(key, value);
    }

    public strokeSetter(
        value: ColorType,
        key: string
    ): void {
        // for animation getter (#6776)
        this.stroke = value;
        this.boxAttr(key, value);
    }

    public 'stroke-widthSetter'(
        value: string,
        key: string
    ): void {
        if (value) {
            this.needsBox = true;
        }
        this['stroke-width'] = value;
        this.boxAttr(key, value);
    }

    public 'text-alignSetter'(value: string): void {
        this.textAlign = value;
    }

    public textSetter(text?: string): void {
        if (typeof text !== 'undefined') {
            // Must use .attr to ensure transforms are done (#10009)
            this.text.attr({ text });
        }
        this.updateTextPadding();
    }

    /*
     * This function runs after the label is added to the DOM (when the bounding
     * box is available), and after the text of the label is updated to detect
     * the new bounding box and reflect it in the border box.
     */
    private updateBoxSize(): void {
        const text = this.text,
            attribs: SVGAttributes = {},
            padding = this.padding,
            // #12165 error when width is null (auto)
            // #12163 when fontweight: bold, recalculate bBox withot cache
            // #3295 && 3514 box failure when string equals 0
            bBox = this.bBox = (
                ((
                    !isNumber(this.widthSetting) ||
                    !isNumber(this.heightSetting) ||
                    this.textAlign
                ) && defined(text.textStr)) ?
                    text.getBBox() :
                    SVGLabel.emptyBBox
            );

        let crispAdjust;

        this.width = this.getPaddedWidth();
        this.height = (this.heightSetting || bBox.height || 0) + 2 * padding;

        const metrics = this.renderer.fontMetrics(text);

        // Update the label-scoped y offset. Math.min because of inline
        // style (#9400)
        this.baselineOffset = padding + Math.min(
            // When applicable, use the font size of the first line (#15707)
            (this.text.firstLineMetrics || metrics).b,
            // When the height is 0, there is no bBox, so go with the font
            // metrics. Highmaps CSS demos.
            bBox.height || Infinity
        );

        // #15491: Vertical centering
        if (this.heightSetting) {
            this.baselineOffset += (this.heightSetting - metrics.h) / 2;
        }

        if (this.needsBox && !text.textPath) {

            // Create the border box if it is not already present
            if (!this.box) {
                // Symbol definition exists (#5324)
                const box = this.box = this.symbolKey ?
                    this.renderer.symbol(this.symbolKey) :
                    this.renderer.rect();

                box.addClass( // Don't use label className for buttons
                    (
                        this.className === 'button' ?
                            '' : 'highcharts-label-box'
                    ) +
                    (
                        this.className ?
                            ' highcharts-' + this.className + '-box' : ''
                    )
                );

                box.add(this);
            }

            crispAdjust = this.getCrispAdjust();
            attribs.x = crispAdjust;
            attribs.y = (
                (this.baseline ? -this.baselineOffset : 0) + crispAdjust
            );

            // Apply the box attributes
            attribs.width = Math.round(this.width);
            attribs.height = Math.round(this.height);

            this.box.attr(extend(attribs, this.deferredAttr));
            this.deferredAttr = {};
        }
    }

    /*
     * This function runs after setting text or padding, but only if padding
     * is changed.
     */
    public updateTextPadding(): void {
        const text = this.text;
        if (!text.textPath) {

            this.updateBoxSize();

            // Determine y based on the baseline
            const textY = this.baseline ? 0 : this.baselineOffset;

            let textX = pick(this.paddingLeft, this.padding);

            // compensate for alignment
            if (
                defined(this.widthSetting) &&
                this.bBox &&
                (this.textAlign === 'center' || this.textAlign === 'right')
            ) {
                textX += { center: 0.5, right: 1 }[
                    this.textAlign as ('center'|'right')
                ] * (this.widthSetting - this.bBox.width);
            }

            // update if anything changed
            if (textX !== text.x || textY !== text.y) {
                text.attr('x', textX);
                // #8159 - prevent misplaced data labels in treemap
                // (useHTML: true)
                if (text.hasBoxWidthChanged) {
                    this.bBox = text.getBBox(true);
                }
                if (typeof textY !== 'undefined') {
                    text.attr('y', textY);
                }
            }

            // record current values
            text.x = textX;
            text.y = textY;
        }
    }

    public widthSetter(value: (number|string)): void {
        // width:auto => null
        this.widthSetting = isNumber(value) ? value : void 0;
    }

    public getPaddedWidth(): number {
        const padding = this.padding;
        const paddingLeft = pick(this.paddingLeft, padding);
        const paddingRight = pick(this.paddingRight, padding);
        return (
            (this.widthSetting || this.bBox.width || 0) +
            paddingLeft +
            paddingRight
        );
    }

    public xSetter(value: number): void {
        this.x = value; // for animation getter
        if (this.alignFactor) {
            value -= this.alignFactor * this.getPaddedWidth();

            // Force animation even when setting to the same value (#7898)
            this['forceAnimate:x'] = true;
        }
        this.xSetting = Math.round(value);
        this.attr('translateX', this.xSetting);
    }

    public ySetter(value: number): void {
        this.ySetting = this.y = Math.round(value);
        this.attr('translateY', this.ySetting);
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default SVGLabel;
