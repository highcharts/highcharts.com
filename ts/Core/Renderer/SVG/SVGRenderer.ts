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

import type AnimationOptions from '../../Animation/AnimationOptions';
import type BBoxObject from '../BBoxObject';
import type ButtonThemeObject from './ButtonThemeObject';
import type ColorString from '../../Color/ColorString';
import type CSSObject from '../CSSObject';
import type {
    DOMElementType,
    HTMLDOMElement,
    SVGDOMElement
} from '../DOMElementType';
import type EventCallback from '../../../Core/EventCallback';
import type FontMetricsObject from '../FontMetricsObject';
import type PositionObject from '../PositionObject';
import type ShadowOptionsObject from '../ShadowOptionsObject';
import type SVGAttributes from './SVGAttributes';
import type SVGPath from './SVGPath';
import type SVGRendererLike from './SVGRendererLike';
import type SymbolOptions from './SymbolOptions';
import type { SymbolKey } from './SymbolType';

import AST from '../HTML/AST.js';
import Color from '../../Color/Color.js';
import H from '../../Globals.js';
const {
    charts,
    deg2rad,
    doc,
    isFirefox,
    isMS,
    isWebKit,
    noop,
    SVG_NS,
    symbolSizes,
    win
} = H;
import { Palette } from '../../Color/Palettes.js';
import RendererRegistry from '../RendererRegistry.js';
import SVGElement from './SVGElement.js';
import SVGLabel from './SVGLabel.js';
import Symbols from './Symbols.js';
import TextBuilder from './TextBuilder.js';
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject, isString } = TC;
const { defined, destroyObjectProperties, extend, merge } = OH;
const { addEvent } = EH;
const {
    attr,
    createElement,
    css,
    pick,
    pInt,
    uniqueKey
} = U;

/* *
 *
 *  Variables
 *
 * */

let hasInternalReferenceBug: (boolean|undefined);

/* *
 *
 *  Class
 *
 * */

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * Allows direct access to the Highcharts rendering layer in order to draw
 * primitive shapes like circles, rectangles, paths or text directly on a chart,
 * or independent from any chart. The SVGRenderer represents a wrapper object
 * for SVG in modern browsers.
 *
 * An existing chart's renderer can be accessed through {@link Chart.renderer}.
 * The renderer can also be used completely decoupled from a chart.
 *
 * @sample highcharts/members/renderer-on-chart
 *         Annotating a chart programmatically.
 * @sample highcharts/members/renderer-basic
 *         Independent SVG drawing.
 *
 * @example
 * // Use directly without a chart object.
 * let renderer = new Highcharts.Renderer(parentNode, 600, 400);
 *
 * @class
 * @name Highcharts.SVGRenderer
 *
 * @param {Highcharts.HTMLDOMElement} container
 *        Where to put the SVG in the web page.
 *
 * @param {number} width
 *        The width of the SVG.
 *
 * @param {number} height
 *        The height of the SVG.
 *
 * @param {Highcharts.CSSObject} [style]
 *        The box style, if not in styleMode
 *
 * @param {boolean} [forExport=false]
 *        Whether the rendered content is intended for export.
 *
 * @param {boolean} [allowHTML=true]
 *        Whether the renderer is allowed to include HTML text, which will be
 *        projected on top of the SVG.
 *
 * @param {boolean} [styledMode=false]
 *        Whether the renderer belongs to a chart that is in styled mode.
 *        If it does, it will avoid setting presentational attributes in
 *        some cases, but not when set explicitly through `.attr` and `.css`
 *        etc.
 */
class SVGRenderer implements SVGRendererLike {

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        container: HTMLDOMElement,
        width: number,
        height: number,
        style?: CSSObject,
        forExport?: boolean,
        allowHTML?: boolean,
        styledMode?: boolean
    ) {
        this.init(
            container,
            width,
            height,
            style,
            forExport,
            allowHTML,
            styledMode
        );
    }

    /* *
     *
     *  Properties
     *
     * */

    public alignedObjects: Array<SVGElement> = void 0 as any;

    public allowHTML?: boolean;

    /**
     * The root `svg` node of the renderer.
     *
     * @name Highcharts.SVGRenderer#box
     * @type {Highcharts.SVGDOMElement}
     */
    public box: globalThis.SVGElement = void 0 as any;

    /**
     * The wrapper for the root `svg` node of the renderer.
     *
     * @name Highcharts.SVGRenderer#boxWrapper
     * @type {Highcharts.SVGElement}
     */
    public boxWrapper: SVGElement = void 0 as any;

    public cache: Record<string, BBoxObject> = void 0 as any;

    public cacheKeys: Array<string> = void 0 as any;

    public chartIndex: number = void 0 as any;

    /**
     * A pointer to the `defs` node of the root SVG.
     *
     * @name Highcharts.SVGRenderer#defs
     * @type {Highcharts.SVGElement}
     */
    public defs: SVGElement = void 0 as any;

    /**
     * Whether the rendered content is intended for export.
     *
     * @name Highcharts.SVGRenderer#forExport
     * @type {boolean | undefined}
     */
    public forExport?: boolean;
    public globalAnimation: (boolean|Partial<AnimationOptions>) = void 0 as any;
    public gradients: Record<string, SVGElement> = void 0 as any;
    public height: number = void 0 as any;
    public imgCount: number = void 0 as any;
    public rootFontSize: string|undefined;
    public style: CSSObject = void 0 as any;
    public styledMode?: boolean;
    public unSubPixelFix?: Function;

    /**
     * Page url used for internal references.
     *
     * @private
     * @name Highcharts.SVGRenderer#url
     * @type {string}
     */
    public url: string = void 0 as any;
    public width: number = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initialize the SVGRenderer. Overridable initializer function that takes
     * the same parameters as the constructor.
     *
     * @function Highcharts.SVGRenderer#init
     *
     * @param {Highcharts.HTMLDOMElement} container
     * Where to put the SVG in the web page.
     *
     * @param {number} width
     * The width of the SVG.
     *
     * @param {number} height
     * The height of the SVG.
     *
     * @param {Highcharts.CSSObject} [style]
     * The box style, if not in styleMode
     *
     * @param {boolean} [forExport=false]
     * Whether the rendered content is intended for export.
     *
     * @param {boolean} [allowHTML=true]
     * Whether the renderer is allowed to include HTML text, which will be
     * projected on top of the SVG.
     *
     * @param {boolean} [styledMode=false]
     * Whether the renderer belongs to a chart that is in styled mode. If it
     * does, it will avoid setting presentational attributes in some cases, but
     * not when set explicitly through `.attr` and `.css` etc.
     */
    public init(
        container: HTMLDOMElement,
        width: number,
        height: number,
        style?: CSSObject,
        forExport?: boolean,
        allowHTML?: boolean,
        styledMode?: boolean
    ): void {
        const renderer = this,
            boxWrapper = renderer
                .createElement('svg')
                .attr({
                    version: '1.1',
                    'class': 'highcharts-root'
                }) as any,
            element = boxWrapper.element;

        if (!styledMode) {
            boxWrapper.css(this.getStyle(style as any));
        }

        container.appendChild(element);

        // Always use ltr on the container, otherwise text-anchor will be
        // flipped and text appear outside labels, buttons, tooltip etc (#3482)
        attr(container, 'dir', 'ltr');

        // For browsers other than IE, add the namespace attribute (#1978)
        if (container.innerHTML.indexOf('xmlns') === -1) {
            attr(element, 'xmlns', this.SVG_NS);
        }

        this.box = element as any;
        this.boxWrapper = boxWrapper;
        renderer.alignedObjects = [];

        this.url = this.getReferenceURL();


        // Add description
        const desc = this.createElement('desc').add();
        desc.element.appendChild(
            doc.createTextNode('Created with @product.name@ @product.version@')
        );

        renderer.defs = this.createElement('defs').add();
        renderer.allowHTML = allowHTML;
        renderer.forExport = forExport;
        renderer.styledMode = styledMode;
        renderer.gradients = {}; // Object where gradient SvgElements are stored
        renderer.cache = {}; // Cache for numerical bounding boxes
        renderer.cacheKeys = [];
        renderer.imgCount = 0;
        renderer.rootFontSize = boxWrapper.getStyle('font-size');

        renderer.setSize(width, height, false);

        // Issue 110 workaround:
        // In Firefox, if a div is positioned by percentage, its pixel position
        // may land between pixels. The container itself doesn't display this,
        // but an SVG element inside this container will be drawn at subpixel
        // precision. In order to draw sharp lines, this must be compensated
        // for. This doesn't seem to work inside iframes though (like in
        // jsFiddle).
        let subPixelFix, rect;

        if (isFirefox && container.getBoundingClientRect) {
            subPixelFix = function (): void {
                css(container, { left: 0, top: 0 });
                rect = container.getBoundingClientRect();
                css(container, {
                    left: (Math.ceil(rect.left) - rect.left) + 'px',
                    top: (Math.ceil(rect.top) - rect.top) + 'px'
                });
            };

            // run the fix now
            subPixelFix();

            // run it on resize
            renderer.unSubPixelFix = addEvent(win, 'resize', subPixelFix);
        }
    }


    /**
     * General method for adding a definition to the SVG `defs` tag. Can be used
     * for gradients, fills, filters etc. Styled mode only. A hook for adding
     * general definitions to the SVG's defs tag. Definitions can be referenced
     * from the CSS by its `id`. Read more in
     * [gradients, shadows and patterns](https://www.highcharts.com/docs/chart-design-and-style/gradients-shadows-and-patterns).
     * Styled mode only.
     *
     * @function Highcharts.SVGRenderer#definition
     *
     * @param {Highcharts.ASTNode} def
     * A serialized form of an SVG definition, including children.
     *
     * @return {Highcharts.SVGElement}
     * The inserted node.
     */
    public definition(def: AST.Node): SVGElement {
        const ast = new AST([def]);
        return ast.addToDOM(this.defs.element) as unknown as SVGElement;
    }

    /**
     * Get the prefix needed for internal URL references to work in certain
     * cases. Some older browser versions had a bug where internal url
     * references in SVG attributes, on the form `url(#some-id)`, would fail if
     * a base tag was present in the page. There were also issues with
     * `history.pushState` related to this prefix.
     *
     * Related issues: #24, #672, #1070, #5244.
     *
     * The affected browsers are:
     * - Chrome <= 53 (May 2018)
     * - Firefox <= 51 (January 2017)
     * - Safari/Mac <= 12.1 (2018 or 2019)
     * - Safari/iOS <= 13
     *
     * @todo Remove this hack when time has passed. All the affected browsers
     * are evergreens, so it is increasingly unlikely that users are affected by
     * the bug.
     *
     * @return {string}
     * The prefix to use. An empty string for modern browsers.
     */
    public getReferenceURL(): string {

        if (
            (isFirefox || isWebKit) &&
            doc.getElementsByTagName('base').length
        ) {

            // Detect if a clip path is taking effect by performing a hit test
            // outside the clipped area. If the hit element is the rectangle
            // that was supposed to be clipped, the bug is present. This only
            // has to be performed once per page load, so we store the result
            // locally in the module.
            if (!defined(hasInternalReferenceBug)) {
                const id = uniqueKey();
                const ast = new AST([{
                    tagName: 'svg',
                    attributes: {
                        width: 8,
                        height: 8
                    },
                    children: [{
                        tagName: 'defs',
                        children: [{
                            tagName: 'clipPath',
                            attributes: {
                                id
                            },
                            children: [{
                                tagName: 'rect',
                                attributes: {
                                    width: 4,
                                    height: 4
                                }
                            }]
                        }]
                    }, {
                        tagName: 'rect',
                        attributes: {
                            id: 'hitme',
                            width: 8,
                            height: 8,
                            'clip-path': `url(#${id})`,
                            fill: 'rgba(0,0,0,0.001)'
                        }
                    }]
                }]);
                const svg = ast.addToDOM(doc.body);
                css(svg, {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 9e5
                });

                const hitElement = doc.elementFromPoint(6, 6);
                hasInternalReferenceBug = (
                    hitElement && hitElement.id
                ) === 'hitme';
                doc.body.removeChild(svg);
            }

            if (hasInternalReferenceBug) {
                return win.location.href
                    .split('#')[0] // remove the hash
                    .replace(/<[^>]*>/g, '') // wing cut HTML
                    // escape parantheses and quotes
                    .replace(/([\('\)])/g, '\\$1')
                    // replace spaces (needed for Safari only)
                    .replace(/ /g, '%20');
            }
        }
        return '';
    }

    /**
     * Get the global style setting for the renderer.
     *
     * @private
     * @function Highcharts.SVGRenderer#getStyle
     *
     * @param {Highcharts.CSSObject} style
     * Style settings.
     *
     * @return {Highcharts.CSSObject}
     * The style settings mixed with defaults.
     */
    public getStyle(style: CSSObject): CSSObject {
        this.style = extend<CSSObject>({

            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '1rem'

        }, style);
        return this.style;
    }

    /**
     * Apply the global style on the renderer, mixed with the default styles.
     *
     * @function Highcharts.SVGRenderer#setStyle
     *
     * @param {Highcharts.CSSObject} style
     * CSS to apply.
     */
    public setStyle(style: CSSObject): void {
        this.boxWrapper.css(this.getStyle(style));
    }

    /**
     * Detect whether the renderer is hidden. This happens when one of the
     * parent elements has `display: none`. Used internally to detect when we
     * needto render preliminarily in another div to get the text bounding boxes
     * right.
     *
     * @function Highcharts.SVGRenderer#isHidden
     *
     * @return {boolean}
     * True if it is hidden.
     */
    public isHidden(): boolean { // #608
        return !this.boxWrapper.getBBox().width;
    }

    /**
     * Destroys the renderer and its allocated members.
     *
     * @function Highcharts.SVGRenderer#destroy
     *
     * @return {null}
     * Pass through value.
     */
    public destroy(): null {
        const renderer = this,
            rendererDefs = renderer.defs;

        renderer.box = null as any;
        renderer.boxWrapper = renderer.boxWrapper.destroy() as any;

        // Call destroy on all gradient elements
        destroyObjectProperties(renderer.gradients || {});
        renderer.gradients = null as any;


        renderer.defs = rendererDefs.destroy() as any;

        // Remove sub pixel fix handler (#982)
        if (renderer.unSubPixelFix) {
            renderer.unSubPixelFix();
        }

        renderer.alignedObjects = null as any;

        return null;
    }

    /**
     * Create a wrapper for an SVG element. Serves as a factory for
     * {@link SVGElement}, but this function is itself mostly called from
     * primitive factories like {@link SVGRenderer#path}, {@link
     * SVGRenderer#rect} or {@link SVGRenderer#text}.
     *
     * @function Highcharts.SVGRenderer#createElement
     *
     * @param {string} nodeName
     * The node name, for example `rect`, `g` etc.
     *
     * @return {Highcharts.SVGElement}
     * The generated SVGElement.
     */
    public createElement(nodeName: string): SVGElement {
        const wrapper = new this.Element();

        wrapper.init(this as any, nodeName);
        return wrapper;
    }

    /**
     * Get converted radial gradient attributes according to the radial
     * reference. Used internally from the {@link SVGElement#colorGradient}
     * function.
     *
     * @private
     * @function Highcharts.SVGRenderer#getRadialAttr
     */
    public getRadialAttr(
        radialReference: Array<number>,
        gradAttr: SVGAttributes
    ): SVGAttributes {
        return {
            cx: (radialReference[0] - radialReference[2] / 2) +
                (gradAttr.cx || 0) * radialReference[2],
            cy: (radialReference[1] - radialReference[2] / 2) +
                (gradAttr.cy || 0) * radialReference[2],
            r: (gradAttr.r || 0) * radialReference[2]
        };
    }

    /**
     * Create a drop shadow definition and return its id
     *
     * @private
     * @function Highcharts.SVGRenderer#shadowDefinition
     *
     * @param {boolean|Highcharts.ShadowOptionsObject} [shadowOptions] The
     *        shadow options. If `true`, the default options are applied
     */
    public shadowDefinition(
        shadowOptions: Partial<ShadowOptionsObject>
    ): string {
        const
            id = [
                `highcharts-drop-shadow-${this.chartIndex}`,
                ...Object.keys(shadowOptions)
                    .map((key: string): string =>
                        `${key}-${(shadowOptions as any)[key]}`
                    )
            ].join('-').toLowerCase().replace(/[^a-z0-9\-]/g, ''),
            options: ShadowOptionsObject = merge({
                color: '#000000',
                offsetX: 1,
                offsetY: 1,
                opacity: 0.15,
                width: 5
            }, shadowOptions);

        if (!this.defs.element.querySelector(`#${id}`)) {
            this.definition({
                tagName: 'filter',
                attributes: {
                    id,
                    filterUnits: options.filterUnits
                },
                children: [{
                    tagName: 'feDropShadow',
                    attributes: {
                        dx: options.offsetX,
                        dy: options.offsetY,
                        'flood-color': options.color,
                        // Tuned and modified to keep a preserve compatibility
                        // with the old settings
                        'flood-opacity': Math.min(options.opacity * 5, 1),
                        stdDeviation: options.width / 2
                    }
                }]
            });
        }

        return id;
    }

    /**
     * Parse a simple HTML string into SVG tspans. Called internally when text
     * is set on an SVGElement. The function supports a subset of HTML tags, CSS
     * text features like `width`, `text-overflow`, `white-space`, and also
     * attributes like `href` and `style`.
     *
     * @private
     * @function Highcharts.SVGRenderer#buildText
     *
     * @param {Highcharts.SVGElement} wrapper
     * The parent SVGElement.
     */
    public buildText(wrapper: SVGElement): void {
        new TextBuilder(wrapper).buildSVG();
    }

    /**
     * Returns white for dark colors and black for bright colors, based on W3C's
     * definition of [Relative luminance](
     * https://www.w3.org/WAI/GL/wiki/Relative_luminance).
     *
     * @function Highcharts.SVGRenderer#getContrast
     *
     * @param {Highcharts.ColorString} color
     * The color to get the contrast for.
     *
     * @return {Highcharts.ColorString}
     * The contrast color, either `#000000` or `#FFFFFF`.
     */
    public getContrast(color: ColorString): ColorString {
        // #6216, #17273
        const rgba = Color.parse(color).rgba
            .map((b8): number => {
                const c = b8 / 255;
                return c <= 0.03928 ?
                    c / 12.92 :
                    Math.pow((c + 0.055) / 1.055, 2.4);
            });

        // Relative luminance
        const l = 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2];

        // Use white or black based on which provides more contrast
        return 1.05 / (l + 0.05) > (l + 0.05) / 0.05 ? '#FFFFFF' : '#000000';
    }

    /**
     * Create a button with preset states.
     *
     * @function Highcharts.SVGRenderer#button
     *
     * @param {string} text
     * The text or HTML to draw.
     *
     * @param {number} x
     * The x position of the button's left side.
     *
     * @param {number} y
     * The y position of the button's top side.
     *
     * @param {Highcharts.EventCallbackFunction<Highcharts.SVGElement>} callback
     * The function to execute on button click or touch.
     *
     * @param {Highcharts.SVGAttributes} [theme]
     * SVG attributes for the normal state.
     *
     * @param {Highcharts.SVGAttributes} [hoverState]
     * SVG attributes for the hover state.
     *
     * @param {Highcharts.SVGAttributes} [selectState]
     * SVG attributes for the pressed state.
     *
     * @param {Highcharts.SVGAttributes} [disabledState]
     * SVG attributes for the disabled state.
     *
     * @param {Highcharts.SymbolKeyValue} [shape=rect]
     * The shape type.
     *
     * @param {boolean} [useHTML=false]
     * Whether to use HTML to render the label.
     *
     * @return {Highcharts.SVGElement}
     * The button element.
     */
    public button(
        text: string,
        x: number,
        y: number,
        callback: EventCallback<SVGElement>,
        theme: ButtonThemeObject = {},
        hoverState?: SVGAttributes,
        selectState?: SVGAttributes,
        disabledState?: SVGAttributes,
        shape?: SymbolKey,
        useHTML?: boolean
    ): SVGElement {
        const label = this.label(
                text,
                x,
                y,
                shape,
                void 0,
                void 0,
                useHTML,
                void 0,
                'button'
            ),
            styledMode = this.styledMode,
            states = theme.states || {};

        let curState = 0;

        theme = merge(theme);
        delete theme.states;

        const normalStyle = merge({
            color: Palette.neutralColor80,
            cursor: 'pointer',
            fontSize: '0.8em',
            fontWeight: 'normal'
        }, theme.style);
        delete theme.style;

        // Remove stylable attributes. Pass in the ButtonThemeObject and get the
        // SVGAttributes subset back.
        let normalState = AST.filterUserAttributes(theme);

        // Default, non-stylable attributes
        label.attr(merge({ padding: 8, r: 2 }, normalState));

        // Presentational. The string type is a mistake, it is just for
        // compliance with SVGAttribute and is not used in button theme.
        let hoverStyle: CSSObject|string|undefined,
            selectStyle: CSSObject|string|undefined,
            disabledStyle: CSSObject|string|undefined;

        if (!styledMode) {

            // Normal state - prepare the attributes
            normalState = merge({
                fill: Palette.neutralColor3,
                stroke: Palette.neutralColor20,
                'stroke-width': 1
            }, normalState);

            // Hover state
            hoverState = merge(normalState, {
                fill: Palette.neutralColor10
            }, AST.filterUserAttributes(hoverState || states.hover || {}));
            hoverStyle = hoverState.style;
            delete hoverState.style;

            // Pressed state
            selectState = merge(normalState, {
                fill: Palette.highlightColor10,
                style: {
                    color: Palette.neutralColor100,
                    fontWeight: 'bold'
                }
            }, AST.filterUserAttributes(selectState || states.select || {}));
            selectStyle = selectState.style;
            delete selectState.style;

            // Disabled state
            disabledState = merge(normalState, {
                style: {
                    color: Palette.neutralColor20
                }
            }, AST.filterUserAttributes(
                disabledState || states.disabled || {}
            ));
            disabledStyle = disabledState.style;
            delete disabledState.style;
        }

        // Add the events. IE9 and IE10 need mouseover and mouseout to function
        // (#667).
        addEvent(
            label.element, isMS ? 'mouseover' : 'mouseenter',
            function (): void {
                if (curState !== 3) {
                    label.setState(1);
                }
            }
        );
        addEvent(
            label.element, isMS ? 'mouseout' : 'mouseleave',
            function (): void {
                if (curState !== 3) {
                    label.setState(curState);
                }
            }
        );

        label.setState = function (state: number): void {
            // Hover state is temporary, don't record it
            if (state !== 1) {
                label.state = curState = state;
            }
            // Update visuals
            label
                .removeClass(
                    /highcharts-button-(normal|hover|pressed|disabled)/
                )
                .addClass(
                    'highcharts-button-' +
                    ['normal', 'hover', 'pressed', 'disabled'][state || 0]
                );

            if (!styledMode) {
                label
                    .attr([
                        normalState,
                        hoverState,
                        selectState,
                        disabledState
                    ][state || 0]);
                const css = [
                    normalStyle,
                    hoverStyle,
                    selectStyle,
                    disabledStyle
                ][state || 0];
                if (isObject(css)) {
                    label.css(css);
                }
            }
        };


        // Presentational attributes
        if (!styledMode) {
            label
                .attr(normalState)
                .css(extend({ cursor: 'default' } as CSSObject, normalStyle));

            // HTML labels don't need to handle pointer events because click and
            // mouseenter/mouseleave is bound to the underlying <g> element.
            // Should this be reconsidered, we need more complex logic to share
            // events between the <g> and its <div> counterpart, and avoid
            // triggering mouseenter/mouseleave when hovering from one to the
            // other (#17440).
            if (useHTML) {
                label.text.css({ pointerEvents: 'none' });
            }
        }

        return label
            .on('touchstart', (e: Event): void => e.stopPropagation())
            .on('click', function (e: Event): void {
                if (curState !== 3) {
                    callback.call(label, e);
                }
            });
    }

    /**
     * Make a straight line crisper by not spilling out to neighbour pixels.
     *
     * @function Highcharts.SVGRenderer#crispLine
     *
     * @param {Highcharts.SVGPathArray} points
     *        The original points on the format `[['M', 0, 0], ['L', 100, 0]]`.
     *
     * @param {number} width
     *        The width of the line.
     *
     * @param {string} [roundingFunction=round]
     *        The rounding function name on the `Math` object, can be one of
     *        `round`, `floor` or `ceil`.
     *
     * @return {Highcharts.SVGPathArray}
     *         The original points array, but modified to render crisply.
     */
    public crispLine(
        points: SVGPath,
        width: number,
        roundingFunction: ('round'|'floor'|'ceil') = 'round'
    ): SVGPath {
        const start = points[0];
        const end = points[1];

        // Normalize to a crisp line
        if (defined(start[1]) && start[1] === end[1]) {
            // Substract due to #1129. Now bottom and left axis gridlines behave
            // the same.
            start[1] = end[1] =
                Math[roundingFunction](start[1]) - (width % 2 / 2);
        }
        if (defined(start[2]) && start[2] === end[2]) {
            start[2] = end[2] =
                Math[roundingFunction](start[2]) + (width % 2 / 2);
        }
        return points;
    }

    /**
     * Draw a path, wraps the SVG `path` element.
     *
     * @sample highcharts/members/renderer-path-on-chart/
     *         Draw a path in a chart
     * @sample highcharts/members/renderer-path/
     *         Draw a path independent from a chart
     *
     * @example
     * let path = renderer.path(['M', 10, 10, 'L', 30, 30, 'z'])
     *     .attr({ stroke: '#ff00ff' })
     *     .add();
     *
     * @function Highcharts.SVGRenderer#path
     *
     * @param {Highcharts.SVGPathArray} [path]
     * An SVG path definition in array form.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     *
     *//**
     * Draw a path, wraps the SVG `path` element.
     *
     * @function Highcharts.SVGRenderer#path
     *
     * @param {Highcharts.SVGAttributes} [attribs]
     * The initial attributes.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     */
    public path(path?: (SVGAttributes|SVGPath)): SVGElement {
        const attribs: SVGAttributes = (this.styledMode ? {} : {
            fill: 'none'
        });

        if (isArray(path)) {
            attribs.d = path;
        } else if (isObject(path)) { // attributes
            extend(attribs, path as any);
        }
        return this.createElement('path').attr(attribs) as any;
    }

    /**
     * Draw a circle, wraps the SVG `circle` element.
     *
     * @sample highcharts/members/renderer-circle/
     *         Drawing a circle
     *
     * @function Highcharts.SVGRenderer#circle
     *
     * @param {number} [x]
     * The center x position.
     *
     * @param {number} [y]
     * The center y position.
     *
     * @param {number} [r]
     * The radius.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     *//**
     * Draw a circle, wraps the SVG `circle` element.
     *
     * @function Highcharts.SVGRenderer#circle
     *
     * @param {Highcharts.SVGAttributes} [attribs]
     * The initial attributes.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     */
    public circle(
        x?: (number|SVGAttributes),
        y?: number,
        r?: number
    ): SVGElement {
        const attribs: SVGAttributes = (
                isObject(x) ?
                    x :
                    typeof x === 'undefined' ? {} : { x: x, y: y, r: r }
            ),
            wrapper = this.createElement('circle');

        // Setting x or y translates to cx and cy
        wrapper.xSetter = wrapper.ySetter = function (
            value: string,
            key: string,
            element: SVGDOMElement
        ): void {
            element.setAttribute('c' + key, value);
        };

        return wrapper.attr(attribs);
    }

    public arc(attribs?: SVGAttributes): SVGElement;
    public arc(
        x?: number,
        y?: number,
        r?: number,
        innerR?: number,
        start?: number,
        end?: number
    ): SVGElement;
    /**
     * Draw and return an arc.
     *
     * @sample highcharts/members/renderer-arc/
     *         Drawing an arc
     *
     * @function Highcharts.SVGRenderer#arc
     *
     * @param {number} [x=0]
     * Center X position.
     *
     * @param {number} [y=0]
     * Center Y position.
     *
     * @param {number} [r=0]
     * The outer radius' of the arc.
     *
     * @param {number} [innerR=0]
     * Inner radius like used in donut charts.
     *
     * @param {number} [start=0]
     * The starting angle of the arc in radians, where 0 is to the right and
     * `-Math.PI/2` is up.
     *
     * @param {number} [end=0]
     * The ending angle of the arc in radians, where 0 is to the right and
     * `-Math.PI/2` is up.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     *//**
     * Draw and return an arc. Overloaded function that takes arguments object.
     *
     * @function Highcharts.SVGRenderer#arc
     *
     * @param {Highcharts.SVGAttributes} attribs
     * Initial SVG attributes.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     */
    public arc(
        x?: (number|SVGAttributes),
        y?: number,
        r?: number,
        innerR?: number,
        start?: number,
        end?: number
    ): SVGElement {
        let options: SymbolOptions;

        if (isObject(x)) {
            options = x as SymbolOptions;
            y = options.y;
            r = options.r;
            innerR = options.innerR;
            start = options.start;
            end = options.end;
            x = options.x;
        } else {
            options = { innerR, start, end };
        }

        // Arcs are defined as symbols for the ability to set
        // attributes in attr and animate
        const arc = this.symbol(
            'arc',
            x as number,
            y,
            r,
            r,
            options
        );
        arc.r = r; // #959
        return arc;
    }

    /**
     * Draw and return a rectangle.
     *
     * @function Highcharts.SVGRenderer#rect
     *
     * @param {number} [x]
     * Left position.
     *
     * @param {number} [y]
     * Top position.
     *
     * @param {number} [width]
     * Width of the rectangle.
     *
     * @param {number} [height]
     * Height of the rectangle.
     *
     * @param {number} [r]
     * Border corner radius.
     *
     * @param {number} [strokeWidth]
     * A stroke width can be supplied to allow crisp drawing.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     *//**
     * Draw and return a rectangle.
     *
     * @sample highcharts/members/renderer-rect-on-chart/
     *         Draw a rectangle in a chart
     * @sample highcharts/members/renderer-rect/
     *         Draw a rectangle independent from a chart
     *
     * @function Highcharts.SVGRenderer#rect
     *
     * @param {Highcharts.SVGAttributes} [attributes]
     * General SVG attributes for the rectangle.
     *
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     */
    public rect(
        x?: (number|SVGAttributes),
        y?: number,
        width?: number,
        height?: number,
        r?: number,
        strokeWidth?: number
    ): SVGElement {

        const attribs = (
                isObject(x) ?
                    x :
                    typeof x === 'undefined' ?
                        {} :
                        {
                            x,
                            y,
                            r,
                            width: Math.max(width || 0, 0),
                            height: Math.max(height || 0, 0)
                        }
            ),
            wrapper = this.createElement('rect');

        if (!this.styledMode) {
            if (typeof strokeWidth !== 'undefined') {
                attribs['stroke-width'] = strokeWidth;
                extend(attribs, wrapper.crisp(attribs as any));
            }
            attribs.fill = 'none';
        }

        wrapper.rSetter = function (
            value: number,
            _key: string,
            element: SVGDOMElement
        ): void {
            wrapper.r = value;
            attr(element, {
                rx: value,
                ry: value
            });
        };
        wrapper.rGetter = function (): number {
            return wrapper.r || 0;
        };

        return wrapper.attr(attribs);
    }

    /**
     * Draw and return a rectangle with advanced corner rounding options.
     *
     * @function Highcharts.SVGRenderer#roundedRect
     *
     * @param {Highcharts.SVGAttributes} attribs
     *      Attributes
     * @return {Highcharts.SVGElement}
     * The generated wrapper element.
     */
    public roundedRect(
        attribs?: SVGAttributes
    ): SVGElement {
        return this.symbol('roundedRect').attr(attribs);
    }

    /**
     * Resize the {@link SVGRenderer#box} and re-align all aligned child
     * elements.
     *
     * @sample highcharts/members/renderer-g/
     *         Show and hide grouped objects
     *
     * @function Highcharts.SVGRenderer#setSize
     *
     * @param {number} width
     * The new pixel width.
     *
     * @param {number} height
     * The new pixel height.
     *
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animate=true]
     * Whether and how to animate.
     */
    public setSize(
        width: number,
        height: number,
        animate?: (boolean|Partial<AnimationOptions>)
    ): void {
        const renderer = this;

        renderer.width = width;
        renderer.height = height;

        renderer.boxWrapper.animate({
            width: width,
            height: height
        }, {
            step: function (this: SVGElement): void {
                this.attr({
                    viewBox: '0 0 ' + this.attr('width') + ' ' +
                        this.attr('height')
                });
            },
            duration: pick(animate, true) ? void 0 : 0
        });

        renderer.alignElements();
    }

    /**
     * Create and return an svg group element. Child
     * {@link Highcharts.SVGElement} objects are added to the group by using the
     * group as the first parameter in {@link Highcharts.SVGElement#add|add()}.
     *
     * @function Highcharts.SVGRenderer#g
     *
     * @param {string} [name]
     *        The group will be given a class name of `highcharts-{name}`. This
     *        can be used for styling and scripting.
     *
     * @return {Highcharts.SVGElement}
     *         The generated wrapper element.
     */
    public g(name?: string): SVGElement {
        const elem = this.createElement('g');

        return name ?
            elem.attr({ 'class': 'highcharts-' + name }) as any :
            elem;
    }

    /**
     * Display an image.
     *
     * @sample highcharts/members/renderer-image-on-chart/
     *         Add an image in a chart
     * @sample highcharts/members/renderer-image/
     *         Add an image independent of a chart
     *
     * @function Highcharts.SVGRenderer#image
     *
     * @param {string} href
     *        The image source.
     *
     * @param {number} [x]
     *        The X position.
     *
     * @param {number} [y]
     *        The Y position.
     *
     * @param {number} [width]
     *        The image width. If omitted, it defaults to the image file width.
     *
     * @param {number} [height]
     *        The image height. If omitted it defaults to the image file
     *        height.
     *
     * @param {Function} [onload]
     *        Event handler for image load.
     *
     * @return {Highcharts.SVGElement}
     *         The generated wrapper element.
     */
    public image(
        href: string,
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        onload?: Function
    ): SVGElement {
        const attribs: SVGAttributes = { preserveAspectRatio: 'none' };

        // Optional properties (#11756)
        if (isNumber(x)) {
            attribs.x = x;
        }
        if (isNumber(y)) {
            attribs.y = y;
        }
        if (isNumber(width)) {
            attribs.width = width;
        }
        if (isNumber(height)) {
            attribs.height = height;
        }


        const elemWrapper = this.createElement('image').attr(attribs) as any,
            onDummyLoad = function (e: Event): void {
                elemWrapper.attr({ href });
                (onload as any).call(elemWrapper, e);
            };

        // Add load event if supplied
        if (onload) {
            // We have to use a dummy HTML image since IE support for SVG image
            // load events is very buggy. First set a transparent src, wait for
            // dummy to load, and then add the real src to the SVG image.
            elemWrapper.attr({
                /* eslint-disable-next-line max-len */
                href: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
            });
            const dummy = new win.Image();
            addEvent(dummy, 'load', onDummyLoad as any);
            dummy.src = href;
            if (dummy.complete) {
                onDummyLoad({} as any);
            }
        } else {
            elemWrapper.attr({ href });
        }

        return elemWrapper;
    }

    /**
     * Draw a symbol out of pre-defined shape paths from
     * {@link SVGRenderer#symbols}.
     * It is used in Highcharts for point makers, which cake a `symbol` option,
     * and label and button backgrounds like in the tooltip and stock flags.
     *
     * @function Highcharts.SVGRenderer#symbol
     *
     * @param {string} symbol
     * The symbol name.
     *
     * @param {number} [x]
     * The X coordinate for the top left position.
     *
     * @param {number} [y]
     * The Y coordinate for the top left position.
     *
     * @param {number} [width]
     * The pixel width.
     *
     * @param {number} [height]
     * The pixel height.
     *
     * @param {Highcharts.SymbolOptionsObject} [options]
     * Additional options, depending on the actual symbol drawn.
     *
     * @return {Highcharts.SVGElement}
     * SVG symbol.
     */
    public symbol(
        symbol: SymbolKey,
        x?: number,
        y?: number,
        width?: number,
        height?: number,
        options?: SymbolOptions
    ): SVGElement {
        const ren = this,
            imageRegex = /^url\((.*?)\)$/,
            isImage = imageRegex.test(symbol),
            sym = (!isImage && (this.symbols[symbol] ? symbol : 'circle')),
            // get the symbol definition function
            symbolFn = (sym && this.symbols[sym]);

        let obj: (SVGElement|undefined),
            path,
            imageSrc: string,
            centerImage: Function;

        if (symbolFn) {
            // Check if there's a path defined for this symbol
            if (typeof x === 'number') {
                path = (symbolFn as any).call(
                    this.symbols,
                    Math.round(x || 0),
                    Math.round(y || 0),
                    width || 0,
                    height || 0,
                    options
                );
            }
            obj = this.path(path);

            if (!ren.styledMode) {
                obj.attr('fill', 'none');
            }

            // expando properties for use in animate and attr
            extend(obj, {
                symbolName: (sym || void 0),
                x: x,
                y: y,
                width: width,
                height: height
            });
            if (options) {
                extend(obj, options);
            }


        // Image symbols
        } else if (isImage) {


            imageSrc = (symbol.match(imageRegex) as any)[1];

            // Create the image synchronously, add attribs async
            const img = obj = this.image(imageSrc);

            // The image width is not always the same as the symbol width. The
            // image may be centered within the symbol, as is the case when
            // image shapes are used as label backgrounds, for example in flags.
            img.imgwidth = pick(
                options && options.width,
                symbolSizes[imageSrc] && symbolSizes[imageSrc].width
            );
            img.imgheight = pick(
                options && options.height,
                symbolSizes[imageSrc] && symbolSizes[imageSrc].height
            );
            /**
             * Set the size and position
             */
            centerImage = (obj: SVGElement): SVGElement => obj.attr({
                width: obj.width,
                height: obj.height
            });

            /**
             * Width and height setters that take both the image's physical size
             * and the label size into consideration, and translates the image
             * to center within the label.
             */
            ['width', 'height'].forEach(function (key: string): void {
                img[key + 'Setter'] = function (value: any, key: string): void {
                    this[key] = value;

                    const {
                        alignByTranslate,
                        element,
                        width,
                        height,
                        imgwidth,
                        imgheight
                    } = this;

                    let imgSize = this['img' + key];
                    if (defined(imgSize)) {
                        let scale = 1;
                        // Scale and center the image within its container.
                        // The name `backgroundSize` is taken from the CSS spec,
                        // but the value `within` is made up. Other possible
                        // values in the spec, `cover` and `contain`, can be
                        // implemented if needed.
                        if (
                            options &&
                            options.backgroundSize === 'within' &&
                            width &&
                            height
                        ) {
                            scale = Math.min(
                                width / imgwidth,
                                height / imgheight
                            );

                            imgSize = Math.round(imgSize * scale);

                            // Update both width and height to keep the ratio
                            // correct (#17315)
                            attr(element, {
                                width: Math.round(imgwidth * scale),
                                height: Math.round(imgheight * scale)
                            });
                        } else if (element) {
                            element.setAttribute(key, imgSize);
                        }

                        if (!alignByTranslate) {
                            this.translate(
                                ((width || 0) - (imgwidth * scale)) / 2,
                                ((height || 0) - (imgheight * scale)) / 2
                            );
                        }
                    }
                };
            });


            if (defined(x)) {
                img.attr({
                    x: x,
                    y: y
                });
            }
            img.isImg = true;

            if (defined(img.imgwidth) && defined(img.imgheight)) {
                centerImage(img);
            } else {
                // Initialize image to be 0 size so export will still function
                // if there's no cached sizes.
                img.attr({ width: 0, height: 0 });

                // Create a dummy JavaScript image to get the width and height.
                createElement('img', {
                    onload: function (this: SVGDOMElement): void {

                        const chart = charts[ren.chartIndex];

                        // Special case for SVGs on IE11, the width is not
                        // accessible until the image is part of the DOM
                        // (#2854).
                        if ((this as any).width === 0) {
                            css(this, {
                                position: 'absolute',
                                top: '-999em'
                            });
                            doc.body.appendChild(this);
                        }

                        // Center the image
                        symbolSizes[imageSrc] = { // Cache for next
                            width: (this as any).width,
                            height: (this as any).height
                        };
                        img.imgwidth = (this as any).width;
                        img.imgheight = (this as any).height;

                        if (img.element) {
                            centerImage(img);
                        }

                        // Clean up after #2854 workaround.
                        if (this.parentNode) {
                            this.parentNode.removeChild(this);
                        }

                        // Fire the load event when all external images are
                        // loaded
                        ren.imgCount--;
                        if (!ren.imgCount && chart && !chart.hasLoaded) {
                            chart.onload();
                        }
                    },
                    src: imageSrc
                });
                this.imgCount++;
            }
        }

        return obj as any;
    }

    public clipRect(attribs: SVGAttributes): SVGRenderer.ClipRectElement;
    public clipRect(
        x?: number,
        y?: number,
        width?: number,
        height?: number
    ): SVGRenderer.ClipRectElement;
    /**
     * Define a clipping rectangle. The clipping rectangle is later applied
     * to {@link SVGElement} objects through the {@link SVGElement#clip}
     * function.
     *
     * @example
     * let circle = renderer.circle(100, 100, 100)
     *     .attr({ fill: 'red' })
     *     .add();
     * let clipRect = renderer.clipRect(100, 100, 100, 100);
     *
     * // Leave only the lower right quarter visible
     * circle.clip(clipRect);
     *
     * @function Highcharts.SVGRenderer#clipRect
     *
     * @param {number} [x]
     *
     * @param {number} [y]
     *
     * @param {number} [width]
     *
     * @param {number} [height]
     *
     * @return {Highcharts.ClipRectElement}
     *         A clipping rectangle.
     */
    public clipRect(
        x?: (number|SVGAttributes),
        y?: number,
        width?: number,
        height?: number
    ): SVGRenderer.ClipRectElement {
        const
            // Add a hyphen at the end to avoid confusion in testing indexes
            // -1 and -10, -11 etc (#6550)
            id = uniqueKey() + '-',
            clipPath = (this.createElement('clipPath').attr({
                id: id
            }) as any).add(this.defs),
            wrapper = this.rect(x, y, width, height, 0).add(clipPath);

        wrapper.id = id;
        wrapper.clipPath = clipPath;
        wrapper.count = 0;

        return wrapper;
    }


    /**
     * Draw text. The text can contain a subset of HTML, like spans and anchors
     * and some basic text styling of these. For more advanced features like
     * border and background, use {@link Highcharts.SVGRenderer#label} instead.
     * To update the text after render, run `text.attr({ text: 'New text' })`.
     *
     * @sample highcharts/members/renderer-text-on-chart/
     *         Annotate the chart freely
     * @sample highcharts/members/renderer-on-chart/
     *         Annotate with a border and in response to the data
     * @sample highcharts/members/renderer-text/
     *         Formatted text
     *
     * @function Highcharts.SVGRenderer#text
     *
     * @param {string} [str]
     * The text of (subset) HTML to draw.
     *
     * @param {number} [x]
     * The x position of the text's lower left corner.
     *
     * @param {number} [y]
     * The y position of the text's lower left corner.
     *
     * @param {boolean} [useHTML=false]
     * Use HTML to render the text.
     *
     * @return {Highcharts.SVGElement}
     * The text object.
     */
    public text(
        str?: string,
        x?: number,
        y?: number,
        useHTML?: boolean
    ): SVGElement {
        const renderer = this,
            attribs: SVGAttributes = {};

        if (useHTML && (renderer.allowHTML || !renderer.forExport)) {
            return (renderer as any).html(str, x, y);
        }

        attribs.x = Math.round(x || 0); // X always needed for line-wrap logic
        if (y) {
            attribs.y = Math.round(y);
        }
        if (defined(str)) {
            attribs.text = str;
        }

        const wrapper = renderer.createElement('text').attr(attribs);

        if (!useHTML || (renderer.forExport && !renderer.allowHTML)) {
            wrapper.xSetter = function (
                value: string,
                key: string,
                element: SVGDOMElement
            ): void {
                const tspans = element.getElementsByTagName('tspan'),
                    parentVal = element.getAttribute(key);

                for (
                    let i = 0, tspan: SVGTSpanElement;
                    i < tspans.length;
                    i++
                ) {
                    tspan = tspans[i];
                    // If the x values are equal, the tspan represents a line
                    // break
                    if (tspan.getAttribute(key) === parentVal) {
                        tspan.setAttribute(key, value);
                    }
                }
                element.setAttribute(key, value);
            };
        }

        return wrapper;
    }

    /**
     * Utility to return the baseline offset and total line height from the font
     * size.
     *
     * @function Highcharts.SVGRenderer#fontMetrics
     *
     * @param {Highcharts.SVGElement|Highcharts.SVGDOMElement|number} [element]
     *        The element to inspect for a current font size. If a number is
     *        given, it's used as a fall back for direct font size in pixels.
     *
     * @return {Highcharts.FontMetricsObject}
     *         The font metrics.
     */
    public fontMetrics(
        element: (DOMElementType|SVGElement)
    ): FontMetricsObject {
        const f = pInt(
            SVGElement.prototype.getStyle.call(element, 'font-size') || 0
        );

        // Empirical values found by comparing font size and bounding box
        // height. Applies to the default font family.
        // https://jsfiddle.net/highcharts/7xvn7/
        const h = f < 24 ? f + 3 : Math.round(f * 1.2),
            b = Math.round(h * 0.8);

        return {
            // Line height
            h,
            // Baseline
            b,
            // Font size
            f
        };
    }

    /**
     * Correct X and Y positioning of a label for rotation (#1764).
     *
     * @private
     * @function Highcharts.SVGRenderer#rotCorr
     */
    public rotCorr(
        baseline: number,
        rotation: number,
        alterY?: boolean
    ): PositionObject {
        let y = baseline;

        if (rotation && alterY) {
            y = Math.max(y * Math.cos(rotation * deg2rad), 4);
        }
        return {
            x: (-baseline / 3) * Math.sin(rotation * deg2rad),
            y: y
        };
    }

    /**
     * Compatibility function to convert the legacy one-dimensional path array
     * into an array of segments.
     *
     * It is used in maps to parse the `path` option, and in SVGRenderer.dSetter
     * to support legacy paths from demos.
     *
     * @private
     * @function Highcharts.SVGRenderer#pathToSegments
     */
    public pathToSegments(path: Array<string|number>): SVGPath {

        const ret: SVGPath = [];
        const segment = [];
        const commandLength: Record<string, number | undefined> = {
            A: 8,
            C: 7,
            H: 2,
            L: 3,
            M: 3,
            Q: 5,
            S: 5,
            T: 3,
            V: 2
        };

        // Short, non-typesafe parsing of the one-dimensional array. It splits
        // the path on any string. This is not type checked against the tuple
        // types, but is shorter, and doesn't require specific checks for any
        // command type in SVG.
        for (let i = 0; i < path.length; i++) {
            // Command skipped, repeat previous or insert L/l for M/m
            if (
                isString(segment[0]) &&
                isNumber(path[i]) &&
                segment.length === commandLength[(segment[0].toUpperCase())]
            ) {
                path.splice(
                    i,
                    0,
                    segment[0].replace('M', 'L').replace('m', 'l')
                );
            }

            // Split on string
            if (typeof path[i] === 'string') {
                if (segment.length) {
                    ret.push(segment.slice(0) as any);
                }
                segment.length = 0;
            }
            segment.push(path[i]);
        }
        ret.push(segment.slice(0) as any);

        return ret;

        /*
        // Fully type-safe version where each tuple type is checked. The
        // downside is filesize and a lack of flexibility for unsupported
        // commands
        const ret: SVGPath = [],
            commands = {
                A: 7,
                C: 6,
                H: 1,
                L: 2,
                M: 2,
                Q: 4,
                S: 4,
                T: 2,
                V: 1,
                Z: 0
            };

        let i = 0,
            lastI = 0,
            lastCommand;

        while (i < path.length) {
            const item = path[i];

            let command;

            if (typeof item === 'string') {
                command = item;
                i += 1;
            } else {
                command = lastCommand || 'M';
            }

            // Upper case
            const commandUC = command.toUpperCase();

            if (commandUC in commands) {

                // No numeric parameters
                if (command === 'Z' || command === 'z') {
                    ret.push([command]);

                // One numeric parameter
                } else {
                    const val0 = path[i];
                    if (typeof val0 === 'number') {

                        // Horizontal line to
                        if (command === 'H' || command === 'h') {
                            ret.push([command, val0]);
                            i += 1;

                        // Vertical line to
                        } else if (command === 'V' || command === 'v') {
                            ret.push([command, val0]);
                            i += 1;

                        // Two numeric parameters
                        } else {
                            const val1 = path[i + 1];
                            if (typeof val1 === 'number') {
                                // lineTo
                                if (command === 'L' || command === 'l') {
                                    ret.push([command, val0, val1]);
                                    i += 2;

                                // moveTo
                                } else if (command === 'M' || command === 'm') {
                                    ret.push([command, val0, val1]);
                                    i += 2;

                                // Smooth quadratic bezier
                                } else if (command === 'T' || command === 't') {
                                    ret.push([command, val0, val1]);
                                    i += 2;

                                // Four numeric parameters
                                } else {
                                    const val2 = path[i + 2],
                                        val3 = path[i + 3];
                                    if (
                                        typeof val2 === 'number' &&
                                        typeof val3 === 'number'
                                    ) {
                                        // Quadratic bezier to
                                        if (
                                            command === 'Q' ||
                                            command === 'q'
                                        ) {
                                            ret.push([
                                                command,
                                                val0,
                                                val1,
                                                val2,
                                                val3
                                            ]);
                                            i += 4;

                                        // Smooth cubic bezier to
                                        } else if (
                                            command === 'S' ||
                                            command === 's'
                                        ) {
                                            ret.push([
                                                command,
                                                val0,
                                                val1,
                                                val2,
                                                val3
                                            ]);
                                            i += 4;

                                        // Six numeric parameters
                                        } else {
                                            const val4 = path[i + 4],
                                                val5 = path[i + 5];

                                            if (
                                                typeof val4 === 'number' &&
                                                typeof val5 === 'number'
                                            ) {
                                                // Curve to
                                                if (
                                                    command === 'C' ||
                                                    command === 'c'
                                                ) {
                                                    ret.push([
                                                        command,
                                                        val0,
                                                        val1,
                                                        val2,
                                                        val3,
                                                        val4,
                                                        val5
                                                    ]);
                                                    i += 6;

                                                // Seven numeric parameters
                                                } else {
                                                    const val6 = path[i + 6];

                                                    // Arc to
                                                    if (
                                                        typeof val6 ===
                                                        'number' &&
                                                        (
                                                            command === 'A' ||
                                                            command === 'a'
                                                        )
                                                    ) {
                                                        ret.push([
                                                            command,
                                                            val0,
                                                            val1,
                                                            val2,
                                                            val3,
                                                            val4,
                                                            val5,
                                                            val6
                                                        ]);
                                                        i += 7;

                                                    }

                                                }
                                            }
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
            }

            // An unmarked command following a moveTo is a lineTo
            lastCommand = command === 'M' ? 'L' : command;

            if (i === lastI) {
                break;
            }
            lastI = i;
        }
        return ret;
        */
    }

    /**
     * Draw a label, which is an extended text element with support for border
     * and background. Highcharts creates a `g` element with a text and a `path`
     * or `rect` inside, to make it behave somewhat like a HTML div. Border and
     * background are set through `stroke`, `stroke-width` and `fill` attributes
     * using the {@link Highcharts.SVGElement#attr|attr} method. To update the
     * text after render, run `label.attr({ text: 'New text' })`.
     *
     * @sample highcharts/members/renderer-label-on-chart/
     *         A label on the chart
     *
     * @function Highcharts.SVGRenderer#label
     *
     * @param {string} str
     *        The initial text string or (subset) HTML to render.
     *
     * @param {number} x
     *        The x position of the label's left side.
     *
     * @param {number} [y]
     *        The y position of the label's top side or baseline, depending on
     *        the `baseline` parameter.
     *
     * @param {string} [shape='rect']
     *        The shape of the label's border/background, if any. Defaults to
     *        `rect`. Other possible values are `callout` or other shapes
     *        defined in {@link Highcharts.SVGRenderer#symbols}.
     *
     * @param {number} [anchorX]
     *        In case the `shape` has a pointer, like a flag, this is the
     *        coordinates it should be pinned to.
     *
     * @param {number} [anchorY]
     *        In case the `shape` has a pointer, like a flag, this is the
     *        coordinates it should be pinned to.
     *
     * @param {boolean} [useHTML=false]
     *        Whether to use HTML to render the label.
     *
     * @param {boolean} [baseline=false]
     *        Whether to position the label relative to the text baseline,
     *        like {@link Highcharts.SVGRenderer#text|renderer.text}, or to the
     *        upper border of the rectangle.
     *
     * @param {string} [className]
     *        Class name for the group.
     *
     * @return {Highcharts.SVGElement}
     *         The generated label.
     */
    public label(
        str: string,
        x: number,
        y?: number,
        shape?: SymbolKey,
        anchorX?: number,
        anchorY?: number,
        useHTML?: boolean,
        baseline?: boolean,
        className?: string
    ): SVGLabel {
        return new SVGLabel(
            this,
            str,
            x,
            y,
            shape,
            anchorX,
            anchorY,
            useHTML,
            baseline,
            className
        );
    }

    /**
     * Re-align all aligned elements.
     *
     * @private
     * @function Highcharts.SVGRenderer#alignElements
     */
    public alignElements(): void {
        this.alignedObjects.forEach((el): SVGElement => el.align());
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface SVGRenderer extends SVGRendererLike {
    Element: typeof SVGElement;
    SVG_NS: string;
    escapes: Record<string, string>;
    symbols: typeof Symbols;
    draw: Function;
}
extend(SVGRenderer.prototype, {

    /**
     * A pointer to the renderer's associated Element class.
     *
     * @name Highcharts.SVGRenderer#Element
     * @type {Highcharts.SVGElement}
     */
    Element: SVGElement,

    SVG_NS,

    /**
     * A collection of characters mapped to HTML entities. When `useHTML` on an
     * element is true, these entities will be rendered correctly by HTML. In
     * the SVG pseudo-HTML, they need to be unescaped back to simple characters,
     * so for example `&lt;` will render as `<`.
     *
     * @example
     * // Add support for unescaping quotes
     * Highcharts.SVGRenderer.prototype.escapes['"'] = '&quot;';
     *
     * @name Highcharts.SVGRenderer#escapes
     * @type {Highcharts.Dictionary<string>}
     */
    escapes: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;', // eslint-disable-line quotes
        '"': '&quot;'
    },

    /**
     * An extendable collection of functions for defining symbol paths.
     *
     * @name Highcharts.SVGRenderer#symbols
     * @type {Highcharts.SymbolDictionary}
     */
    symbols: Symbols,

    /**
     * Dummy function for plugins, called every time the renderer is updated.
     * Prior to Highcharts 5, this was used for the canvg renderer.
     *
     * @deprecated
     * @function Highcharts.SVGRenderer#draw
     */
    draw: noop

});

/* *
 *
 *  Class Namespace
 *
 * */

namespace SVGRenderer {
    export type ClipRectElement = SVGElement;
}

/* *
 *
 *  Registry
 *
 * */

RendererRegistry.registerRendererType('svg', SVGRenderer, true);

/* *
 *
 *  Export Default
 *
 * */

export default SVGRenderer;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * A clipping rectangle that can be applied to one or more {@link SVGElement}
 * instances. It is instanciated with the {@link SVGRenderer#clipRect} function
 * and applied with the {@link SVGElement#clip} function.
 *
 * @example
 * let circle = renderer.circle(100, 100, 100)
 *     .attr({ fill: 'red' })
 *     .add();
 * let clipRect = renderer.clipRect(100, 100, 100, 100);
 *
 * // Leave only the lower right quarter visible
 * circle.clip(clipRect);
 *
 * @typedef {Highcharts.SVGElement} Highcharts.ClipRectElement
 */

/**
 * The font metrics.
 *
 * @interface Highcharts.FontMetricsObject
 *//**
 * The baseline relative to the top of the box.
 *
 * @name Highcharts.FontMetricsObject#b
 * @type {number}
 *//**
 * The font size.
 *
 * @name Highcharts.FontMetricsObject#f
 * @type {number}
 *//**
 * The line height.
 *
 * @name Highcharts.FontMetricsObject#h
 * @type {number}
 */

/**
 * An object containing `x` and `y` properties for the position of an element.
 *
 * @interface Highcharts.PositionObject
 *//**
 * X position of the element.
 * @name Highcharts.PositionObject#x
 * @type {number}
 *//**
 * Y position of the element.
 * @name Highcharts.PositionObject#y
 * @type {number}
 */

/**
 * A rectangle.
 *
 * @interface Highcharts.RectangleObject
 *//**
 * Height of the rectangle.
 * @name Highcharts.RectangleObject#height
 * @type {number}
 *//**
 * Width of the rectangle.
 * @name Highcharts.RectangleObject#width
 * @type {number}
 *//**
 * Horizontal position of the rectangle.
 * @name Highcharts.RectangleObject#x
 * @type {number}
 *//**
 * Vertical position of the rectangle.
 * @name Highcharts.RectangleObject#y
 * @type {number}
 */

/**
 * The shadow options.
 *
 * @interface Highcharts.ShadowOptionsObject
 *//**
 * The shadow color.
 * @name    Highcharts.ShadowOptionsObject#color
 * @type    {Highcharts.ColorString|undefined}
 * @default ${palette.neutralColor100}
 *//**
 * The horizontal offset from the element.
 *
 * @name    Highcharts.ShadowOptionsObject#offsetX
 * @type    {number|undefined}
 * @default 1
 *//**
 * The vertical offset from the element.
 * @name    Highcharts.ShadowOptionsObject#offsetY
 * @type    {number|undefined}
 * @default 1
 *//**
 * The shadow opacity.
 *
 * @name    Highcharts.ShadowOptionsObject#opacity
 * @type    {number|undefined}
 * @default 0.15
 *//**
 * The shadow width or distance from the element.
 * @name    Highcharts.ShadowOptionsObject#width
 * @type    {number|undefined}
 * @default 3
 */

/**
 * @interface Highcharts.SizeObject
 *//**
 * @name Highcharts.SizeObject#height
 * @type {number}
 *//**
 * @name Highcharts.SizeObject#width
 * @type {number}
 */

/**
 * Array of path commands, that will go into the `d` attribute of an SVG
 * element.
 *
 * @typedef {Array<(Array<Highcharts.SVGPathCommand>|Array<Highcharts.SVGPathCommand,number>|Array<Highcharts.SVGPathCommand,number,number>|Array<Highcharts.SVGPathCommand,number,number,number,number>|Array<Highcharts.SVGPathCommand,number,number,number,number,number,number>|Array<Highcharts.SVGPathCommand,number,number,number,number,number,number,number>)>} Highcharts.SVGPathArray
 */

/**
 * Possible path commands in an SVG path array. Valid values are `A`, `C`, `H`,
 * `L`, `M`, `Q`, `S`, `T`, `V`, `Z`.
 *
 * @typedef {string} Highcharts.SVGPathCommand
 * @validvalue ["a","c","h","l","m","q","s","t","v","z","A","C","H","L","M","Q","S","T","V","Z"]
 */

/**
 * An extendable collection of functions for defining symbol paths. Symbols are
 * used internally for point markers, button and label borders and backgrounds,
 * or custom shapes. Extendable by adding to {@link SVGRenderer#symbols}.
 *
 * @interface Highcharts.SymbolDictionary
 *//**
 * @name Highcharts.SymbolDictionary#[key:string]
 * @type {Function|undefined}
 *//**
 * @name Highcharts.SymbolDictionary#arc
 * @type {Function|undefined}
 *//**
 * @name Highcharts.SymbolDictionary#callout
 * @type {Function|undefined}
 *//**
 * @name Highcharts.SymbolDictionary#circle
 * @type {Function|undefined}
 *//**
 * @name Highcharts.SymbolDictionary#diamond
 * @type {Function|undefined}
 *//**
 * @name Highcharts.SymbolDictionary#square
 * @type {Function|undefined}
 *//**
 * @name Highcharts.SymbolDictionary#triangle
 * @type {Function|undefined}
 */

/**
 * Can be one of `arc`, `callout`, `circle`, `diamond`, `square`, `triangle`,
 * and `triangle-down`. Symbols are used internally for point markers, button
 * and label borders and backgrounds, or custom shapes. Extendable by adding to
 * {@link SVGRenderer#symbols}.
 *
 * @typedef {"arc"|"callout"|"circle"|"diamond"|"square"|"triangle"|"triangle-down"} Highcharts.SymbolKeyValue
 */

/**
 * Additional options, depending on the actual symbol drawn.
 *
 * @interface Highcharts.SymbolOptionsObject
 *//**
 * The anchor X position for the `callout` symbol. This is where the chevron
 * points to.
 *
 * @name Highcharts.SymbolOptionsObject#anchorX
 * @type {number|undefined}
 *//**
 * The anchor Y position for the `callout` symbol. This is where the chevron
 * points to.
 *
 * @name Highcharts.SymbolOptionsObject#anchorY
 * @type {number|undefined}
 *//**
 * The end angle of an `arc` symbol.
 *
 * @name Highcharts.SymbolOptionsObject#end
 * @type {number|undefined}
 *//**
 * Whether to draw `arc` symbol open or closed.
 *
 * @name Highcharts.SymbolOptionsObject#open
 * @type {boolean|undefined}
 *//**
 * The radius of an `arc` symbol, or the border radius for the `callout` symbol.
 *
 * @name Highcharts.SymbolOptionsObject#r
 * @type {number|undefined}
 *//**
 * The start angle of an `arc` symbol.
 *
 * @name Highcharts.SymbolOptionsObject#start
 * @type {number|undefined}
 */

(''); // keeps doclets above in transpiled file
