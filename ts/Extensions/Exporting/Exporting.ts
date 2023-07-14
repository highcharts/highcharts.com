/* *
 *
 *  Exporting module
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

import type AnimationOptions from '../../Core/Animation/AnimationOptions';
import type Axis from '../../Core/Axis/Axis';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type EventCallback from '../../Core/EventCallback';
import type {
    ExportingOptions,
    ExportingButtonOptions
} from './ExportingOptions';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';
import type NavigationOptions from './NavigationOptions';
import type Options from '../../Core/Options';
import type { SeriesTypeOptions } from '../../Core/Series/SeriesType';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer';

import AST from '../../Core/Renderer/HTML/AST.js';
import Chart from '../../Core/Chart/Chart.js';
import ChartNavigationComposition from '../../Core/Chart/ChartNavigationComposition.js';
import D from '../../Core/Defaults.js';
const { defaultOptions, setOptions } = D;
import ExportingDefaults from './ExportingDefaults.js';
import ExportingSymbols from './ExportingSymbols.js';
import Fullscreen from './Fullscreen.js';
import G from '../../Core/Globals.js';
const {
    doc,
    SVG_NS,
    win
} = G;
import HU from '../../Core/HttpUtilities.js';
import { Palette } from '../../Core/Color/Palettes.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    css,
    createElement,
    discardElement,
    extend,
    find,
    fireEvent,
    isObject,
    merge,
    objectEach,
    pick,
    removeEvent,
    uniqueKey
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Axis/AxisOptions' {
    interface AxisOptions {
        internalKey?: string;
    }
}

declare module '../../Core/Chart/ChartLike' {
    interface ChartLike {
        exportContextMenu?: Exporting.ChartComposition['exportContextMenu'];
        exportDivElements?: Exporting.ChartComposition['exportDivElements'];
        exporting?: Exporting.ChartAdditions;
        exportingGroup?: Exporting.ChartComposition['exportingGroup'];
        exportSVGElements?: Exporting.ChartComposition['exportSVGElements'];
        isPrinting?: Exporting.ChartComposition['isPrinting'];
        openMenu?: Exporting.ChartComposition['openMenu'];
        /** @requires modules/exporting */
        exportChart(
            exportingOptions?: ExportingOptions,
            chartOptions?: Options
        ): void;
        /** @requires modules/exporting */
        print(): void;
    }
}

declare module '../../Core/Chart/ChartOptions' {
    interface ChartEventsOptions {
        afterPrint?: Exporting.AfterPrintCallbackFunction;
        beforePrint?: Exporting.BeforePrintCallbackFunction;
    }
}

declare module '../../Core/Options' {
    interface LangOptions {
        contextButtonTitle?: string;
        exitFullscreen?: string;
        downloadJPEG?: string;
        downloadPDF?: string;
        downloadPNG?: string;
        downloadSVG?: string;
        printChart?: string;
        viewFullscreen?: string;
    }
    interface Options {
        exporting?: ExportingOptions;
        navigation?: NavigationOptions;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace Exporting {

    /* *
     *
     *  Declarations
     *
     * */

    export interface AfterPrintCallbackFunction {
        (chart: Chart, event: Event): void;
    }

    export interface BeforePrintCallbackFunction {
        (chart: Chart, event: Event): void;
    }

    export declare interface ChartAdditions {
        update(options: ExportingOptions, redraw?: boolean): void;
    }

    export declare interface ChartComposition extends Chart {
        new(
            options: Partial<Options>,
            callback?: Chart.CallbackFunction
        ): this;
        new(
            renderTo: (string|globalThis.HTMLElement),
            options: Partial<Options>,
            callback?: Chart.CallbackFunction
        ): this;
    }

    export declare class ChartComposition extends Chart {
        btnCount?: number;
        buttonOffset?: number;
        exportContextMenu?: DivElement;
        exportDivElements?: Array<(DivElement|null)>;
        exportEvents?: Array<Function>;
        exporting: ChartAdditions;
        exportingGroup?: SVGElement;
        exportMenuHeight?: number;
        exportMenuWidth?: number;
        exportSVGElements?: Array<(SVGElement|undefined)>;
        forExport?: boolean;
        isDirtyExporting?: boolean;
        isPrinting?: boolean;
        openMenu?: boolean;
        printReverseInfo?: PrintReverseInfoObject;
        /** @requires modules/exporting */
        addButton(options: ExportingButtonOptions): void;
        /** @requires modules/exporting */
        afterPrint(): void;
        /** @requires modules/exporting */
        beforePrint(): void;
        /** @requires modules/exporting */
        contextMenu(
            className: string,
            items: Array<(string|MenuObject)>,
            x: number,
            y: number,
            width: number,
            height: number,
            button: SVGElement
        ): void;
        /** @requires modules/exporting */
        destroyExport(e?: Event): void;
        /** @requires modules/exporting */
        exportChart(
            exportingOptions?: ExportingOptions,
            chartOptions?: Options
        ): void;
        /** @requires modules/exporting */
        getChartHTML(): string;
        /** @requires modules/exporting */
        getFilename(): string;
        /** @requires modules/exporting */
        getSVG(chartOptions?: Options): string;
        /** @requires modules/exporting */
        getSVGForExport(
            options: ExportingOptions,
            chartOptions: Partial<Options>
        ): string;
        /** @requires modules/exporting */
        inlineStyles(): void;
        /** @requires modules/exporting */
        moveContainers(moveTo: HTMLDOMElement): void;
        /** @requires modules/exporting */
        renderExporting(): void;
        /** @requires modules/exporting */
        /** @requires modules/exporting */
        print(): void;
        /** @requires modules/exporting */
        sanitizeSVG(svg: string, options: Options): string;
    }

    export interface DivElement extends HTMLDOMElement {
        hideTimer?: number;
        hideMenu(): void;
    }

    export interface ErrorCallbackFunction {
        (options: ExportingOptions, err: Error): void;
    }

    export interface MenuObject {
        onclick?: EventCallback<Chart>;
        separator?: boolean;
        text?: string;
        textKey?: string;
    }

    export interface PrintReverseInfoObject {
        childNodes: NodeListOf<ChildNode>;
        origDisplay: Array<(string|null)> ;
        resetParams?: [
            (number|null)?,
            (number|null)?,
            (boolean|Partial<AnimationOptions>)?
        ];
    }

    /* *
     *
     *  Constants
     *
     * */

    const composedMembers: Array<unknown> = [];

    // These CSS properties are not inlined. Remember camelCase.
    const inlineDenylist: Array<RegExp> = [
        /-/, // In Firefox, both hyphened and camelCased names are listed
        /^(clipPath|cssText|d|height|width)$/, // Full words
        /^font$/, // more specific props are set
        /[lL]ogical(Width|Height)$/,
        /^parentRule$/,
        /perspective/,
        /TapHighlightColor/,
        /^transition/,
        /^length$/, // #7700
        /^[0-9]+$/ // #17538
    ];

    // These ones are translated to attributes rather than styles
    const inlineToAttributes: Array<string> = [
        'fill',
        'stroke',
        'strokeLinecap',
        'strokeLinejoin',
        'strokeWidth',
        'textAnchor',
        'x',
        'y'
    ];

    export const inlineAllowlist: Array<RegExp> = [];

    const unstyledElements: Array<string> = [
        'clipPath',
        'defs',
        'desc'
    ];

    /* *
     *
     *  Variables
     *
     * */

    let printingChart: (ChartComposition|undefined);

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Add the export button to the chart, with options.
     *
     * @private
     * @function Highcharts.Chart#addButton
     * @param {Highcharts.NavigationButtonOptions} options
     * @requires modules/exporting
     */
    function addButton(
        this: ChartComposition,
        options: ExportingButtonOptions
    ): void {
        const chart = this,
            renderer = chart.renderer,
            btnOptions = merge<ExportingButtonOptions>(
                (chart.options.navigation as any).buttonOptions,
                options
            ),
            onclick = btnOptions.onclick,
            menuItems = btnOptions.menuItems,
            symbolSize = btnOptions.symbolSize || 12;
        let symbol;

        if (!chart.btnCount) {
            chart.btnCount = 0;
        }

        // Keeps references to the button elements
        if (!chart.exportDivElements) {
            chart.exportDivElements = [];
            chart.exportSVGElements = [];
        }

        if (btnOptions.enabled === false || !btnOptions.theme) {
            return;
        }


        const attr = btnOptions.theme;
        let callback: (
            EventCallback<SVGElement>|
            undefined
        );

        if (!chart.styledMode) {
            attr.fill = pick(attr.fill, Palette.backgroundColor);
            attr.stroke = pick(attr.stroke, 'none');
        }

        if (onclick) {
            callback = function (
                this: SVGElement,
                e: (Event|AnyRecord)
            ): void {
                if (e) {
                    e.stopPropagation();
                }
                (onclick as any).call(chart, e);
            };

        } else if (menuItems) {
            callback = function (
                this: SVGElement,
                e: (Event|AnyRecord)
            ): void {
                // consistent with onclick call (#3495)
                if (e) {
                    e.stopPropagation();
                }
                chart.contextMenu(
                    button.menuClassName,
                    menuItems as any,
                    button.translateX,
                    button.translateY,
                    button.width,
                    button.height,
                    button
                );
                button.setState(2);
            };
        }


        if (btnOptions.text && btnOptions.symbol) {
            attr.paddingLeft = pick(attr.paddingLeft, 30);

        } else if (!btnOptions.text) {
            extend(attr, {
                width: btnOptions.width,
                height: btnOptions.height,
                padding: 0
            });
        }


        if (!chart.styledMode) {
            attr['stroke-linecap'] = 'round';
            attr.fill = pick(attr.fill, Palette.backgroundColor);
            attr.stroke = pick(attr.stroke, 'none');
        }

        const button: SVGElement = renderer
            .button(
                btnOptions.text as any,
                0,
                0,
                callback as any,
                attr,
                void 0,
                void 0,
                void 0,
                void 0,
                btnOptions.useHTML
            )
            .addClass(options.className as any)
            .attr({
                title: pick((chart.options.lang as any)[
                    btnOptions._titleKey || (btnOptions.titleKey as any)
                ], '')
            });

        button.menuClassName = (
            options.menuClassName ||
            'highcharts-menu-' + chart.btnCount++
        );

        if (btnOptions.symbol) {
            symbol = renderer
                .symbol(
                    btnOptions.symbol,
                    (btnOptions.symbolX as any) - (symbolSize / 2),
                    (btnOptions.symbolY as any) - (symbolSize / 2),
                    symbolSize,
                    symbolSize
                    // If symbol is an image, scale it (#7957)
                    , {
                        width: symbolSize,
                        height: symbolSize
                    }
                )
                .addClass('highcharts-button-symbol')
                .attr({
                    zIndex: 1
                })
                .add(button);

            if (!chart.styledMode) {
                symbol.attr({
                    stroke: btnOptions.symbolStroke,
                    fill: btnOptions.symbolFill,
                    'stroke-width': btnOptions.symbolStrokeWidth || 1
                });
            }
        }

        button
            .add(chart.exportingGroup)
            .align(extend(btnOptions, {
                width: button.width,
                x: pick(btnOptions.x, chart.buttonOffset) // #1654
            }), true, 'spacingBox');

        (chart.buttonOffset as any) += (
            (button.width + btnOptions.buttonSpacing) *
            (btnOptions.align === 'right' ? -1 : 1)
        );

        (chart.exportSVGElements as any).push(button, symbol as any);

    }

    /**
     * Clena up after printing a chart.
     *
     * @function Highcharts#afterPrint
     *
     * @private
     *
     * @param {Highcharts.Chart} chart
     *        Chart that was (or suppose to be) printed
     *
     * @emits Highcharts.Chart#event:afterPrint
     */
    function afterPrint(
        this: ChartComposition
    ): void {
        const chart = this;

        if (!chart.printReverseInfo) {
            return void 0;
        }

        const {
            childNodes,
            origDisplay,
            resetParams
        } = chart.printReverseInfo;

        // put the chart back in
        chart.moveContainers(chart.renderTo);

        // restore all body content
        [].forEach.call(childNodes, function (
            node: HTMLDOMElement,
            i: number
        ): void {
            if (node.nodeType === 1) {
                node.style.display = (origDisplay[i] || '');
            }
        });

        chart.isPrinting = false;

        // Reset printMaxWidth
        if (resetParams) {
            chart.setSize.apply(chart, resetParams);
        }

        delete chart.printReverseInfo;
        printingChart = void 0;

        fireEvent(chart, 'afterPrint');
    }

    /**
     * Prepare chart and document before printing a chart.
     *
     * @function Highcharts#beforePrint
     *
     * @private
     *
     *
     * @emits Highcharts.Chart#event:beforePrint
     */
    function beforePrint(
        this: ChartComposition
    ): void {
        const chart = this,
            body = doc.body,
            printMaxWidth: number =
                (chart.options.exporting as any).printMaxWidth,
            printReverseInfo: PrintReverseInfoObject = {
                childNodes: body.childNodes,
                origDisplay: [],
                resetParams: void 0
            };

        chart.isPrinting = true;
        chart.pointer.reset(null as any, 0);

        fireEvent(chart, 'beforePrint');

        // Handle printMaxWidth
        const handleMaxWidth: (boolean|number) = printMaxWidth &&
            chart.chartWidth > printMaxWidth;
        if (handleMaxWidth) {
            printReverseInfo.resetParams = [
                chart.options.chart.width,
                void 0,
                false
            ];
            chart.setSize(printMaxWidth, void 0, false);
        }

        // hide all body content
        [].forEach.call(printReverseInfo.childNodes, function (
            node: HTMLDOMElement,
            i: number
        ): void {
            if (node.nodeType === 1) {
                printReverseInfo.origDisplay[i] = node.style.display;
                node.style.display = 'none';
            }
        });

        // pull out the chart
        chart.moveContainers(body);
        // Storage details for undo action after printing
        chart.printReverseInfo = printReverseInfo;
    }

    /**
     * @private
     */
    function chartCallback(chart: Chart): void {
        const composition = chart as ChartComposition;

        composition.renderExporting();

        addEvent(chart, 'redraw', composition.renderExporting);
        // Destroy the export elements at chart destroy
        addEvent(chart, 'destroy', composition.destroyExport);

        // Uncomment this to see a button directly below the chart, for quick
        // testing of export
        /*
        let button, viewImage, viewSource;
        if (!chart.renderer.forExport) {
            viewImage = function () {
                let div = doc.createElement('div');
                div.innerHTML = chart.getSVGForExport();
                chart.renderTo.parentNode.appendChild(div);
            };

            viewSource = function () {
                let pre = doc.createElement('pre');
                pre.innerHTML = chart.getSVGForExport()
                    .replace(/</g, '\n&lt;')
                    .replace(/>/g, '&gt;');
                chart.renderTo.parentNode.appendChild(pre);
            };

            viewImage();

            // View SVG Image
            button = doc.createElement('button');
            button.innerHTML = 'View SVG Image';
            chart.renderTo.parentNode.appendChild(button);
            button.onclick = viewImage;

            // View SVG Source
            button = doc.createElement('button');
            button.innerHTML = 'View SVG Source';
            chart.renderTo.parentNode.appendChild(button);
            button.onclick = viewSource;
        }
        //*/
    }

    /**
     * @private
     */
    export function compose(
        ChartClass: typeof Chart,
        SVGRendererClass: typeof SVGRenderer
    ): void {
        ExportingSymbols.compose(SVGRendererClass);
        Fullscreen.compose(ChartClass);

        if (U.pushUnique(composedMembers, ChartClass)) {
            const chartProto = ChartClass.prototype as ChartComposition;

            chartProto.afterPrint = afterPrint;
            chartProto.exportChart = exportChart;
            chartProto.inlineStyles = inlineStyles;
            chartProto.print = print;
            chartProto.sanitizeSVG = sanitizeSVG;
            chartProto.getChartHTML = getChartHTML;
            chartProto.getSVG = getSVG;
            chartProto.getSVGForExport = getSVGForExport;
            chartProto.getFilename = getFilename;
            chartProto.moveContainers = moveContainers;
            chartProto.beforePrint = beforePrint;
            chartProto.contextMenu = contextMenu;
            chartProto.addButton = addButton;
            chartProto.destroyExport = destroyExport;
            chartProto.renderExporting = renderExporting;

            chartProto.callbacks.push(chartCallback);
            addEvent(
                ChartClass as typeof ChartComposition,
                'init',
                onChartInit
            );

            if (G.isSafari) {
                G.win.matchMedia('print').addListener(
                    function (
                        this: MediaQueryList,
                        mqlEvent: MediaQueryListEvent
                    ): void {
                        if (!printingChart) {
                            return void 0;
                        }
                        if (mqlEvent.matches) {
                            printingChart.beforePrint();
                        } else {
                            printingChart.afterPrint();
                        }
                    }
                );
            }
        }

        if (U.pushUnique(composedMembers, setOptions)) {
            defaultOptions.exporting = merge(
                ExportingDefaults.exporting,
                defaultOptions.exporting
            );

            defaultOptions.lang = merge(
                ExportingDefaults.lang,
                defaultOptions.lang
            );

            // Buttons and menus are collected in a separate config option set
            // called 'navigation'. This can be extended later to add control
            // buttons like zoom and pan right click menus.
            defaultOptions.navigation = merge(
                ExportingDefaults.navigation,
                defaultOptions.navigation
            );
        }

    }

    /**
     * Display a popup menu for choosing the export type.
     *
     * @private
     * @function Highcharts.Chart#contextMenu
     * @param {string} className
     *        An identifier for the menu.
     * @param {Array<string|Highcharts.ExportingMenuObject>} items
     *        A collection with text and onclicks for the items.
     * @param {number} x
     *        The x position of the opener button
     * @param {number} y
     *        The y position of the opener button
     * @param {number} width
     *        The width of the opener button
     * @param {number} height
     *        The height of the opener button
     * @requires modules/exporting
     */
    function contextMenu(
        this: ChartComposition,
        className: string,
        items: Array<(string|MenuObject)>,
        x: number,
        y: number,
        width: number,
        height: number,
        button: SVGElement
    ): void {
        const chart = this,
            navOptions: NavigationOptions =
                chart.options.navigation as any,
            chartWidth = chart.chartWidth,
            chartHeight = chart.chartHeight,
            cacheName = 'cache-' + className,
            menuPadding = Math.max(width, height); // for mouse leave detection
        let innerMenu: HTMLDOMElement,
            menu: DivElement = (chart as any)[cacheName];

        // create the menu only the first time
        if (!menu) {

            // create a HTML element above the SVG
            chart.exportContextMenu = (chart as any)[cacheName] = menu =
                createElement(
                    'div', {
                        className: className
                    },
                    {
                        position: 'absolute',
                        zIndex: 1000,
                        padding: menuPadding + 'px',
                        pointerEvents: 'auto'
                    },
                    chart.fixedDiv || chart.container
                ) as DivElement;

            innerMenu = createElement(
                'ul',
                { className: 'highcharts-menu' },
                chart.styledMode ? {} : {
                    listStyle: 'none',
                    margin: 0,
                    padding: 0
                },
                menu
            );

            // Presentational CSS
            if (!chart.styledMode) {
                css(innerMenu, extend<CSSObject>({
                    MozBoxShadow: '3px 3px 10px #888',
                    WebkitBoxShadow: '3px 3px 10px #888',
                    boxShadow: '3px 3px 10px #888'
                }, navOptions.menuStyle as any));
            }

            // hide on mouse out
            menu.hideMenu = function (): void {
                css(menu, { display: 'none' });
                if (button) {
                    button.setState(0);
                }
                chart.openMenu = false;
                // #10361, #9998
                css(chart.renderTo, { overflow: 'hidden' });
                css(chart.container, { overflow: 'hidden' });
                U.clearTimeout(menu.hideTimer as any);
                fireEvent(chart, 'exportMenuHidden');
            };

            // Hide the menu some time after mouse leave (#1357)
            (chart.exportEvents as any).push(
                addEvent(menu, 'mouseleave', function (): void {
                    menu.hideTimer = win.setTimeout(menu.hideMenu, 500);
                }),
                addEvent(menu, 'mouseenter', function (): void {
                    U.clearTimeout(menu.hideTimer as any);
                }),

                // Hide it on clicking or touching outside the menu (#2258,
                // #2335, #2407)
                addEvent(doc, 'mouseup', function (e: PointerEvent): void {
                    if (!chart.pointer.inClass(e.target as any, className)) {
                        menu.hideMenu();
                    }
                }),

                addEvent(menu, 'click', function (): void {
                    if (chart.openMenu) {
                        menu.hideMenu();
                    }
                })
            );

            // create the items
            items.forEach(function (
                item: (string|MenuObject)
            ): void {

                if (typeof item === 'string') {
                    item = (chart.options.exporting as any)
                        .menuItemDefinitions[item];
                }

                if (isObject(item, true)) {
                    let element;

                    if (item.separator) {
                        element = createElement(
                            'hr',
                            void 0,
                            void 0,
                            innerMenu
                        );

                    } else {
                        // When chart initialized with the table, wrong button
                        // text displayed, #14352.
                        if (
                            item.textKey === 'viewData' &&
                            chart.isDataTableVisible
                        ) {
                            item.textKey = 'hideData';
                        }

                        element = createElement('li', {
                            className: 'highcharts-menu-item',
                            onclick: function (e: PointerEvent): void {
                                if (e) { // IE7
                                    e.stopPropagation();
                                }
                                menu.hideMenu();
                                if ((item as any).onclick) {
                                    (item as any).onclick
                                        .apply(chart, arguments);
                                }
                            }
                        }, void 0, innerMenu);

                        AST.setElementHTML(element, item.text ||
                            (chart.options.lang as any)[item.textKey as any]);

                        if (!chart.styledMode) {
                            element.onmouseover = function (
                                this: HTMLDOMElement
                            ): void {
                                css(this, navOptions.menuItemHoverStyle as any);
                            } as any;
                            element.onmouseout = function (
                                this: HTMLDOMElement
                            ): void {
                                css(this, navOptions.menuItemStyle as any);
                            } as any;
                            css(element, extend({
                                cursor: 'pointer'
                            } as CSSObject, navOptions.menuItemStyle || {}));
                        }
                    }

                    // Keep references to menu divs to be able to destroy them
                    (chart.exportDivElements as any).push(element);
                }
            });

            // Keep references to menu and innerMenu div to be able to destroy
            // them
            (chart.exportDivElements as any).push(innerMenu, menu);

            chart.exportMenuWidth = menu.offsetWidth;
            chart.exportMenuHeight = menu.offsetHeight;
        }

        const menuStyle: CSSObject = { display: 'block' };

        // if outside right, right align it
        if (x + (chart.exportMenuWidth as any) > chartWidth) {
            menuStyle.right = (chartWidth - x - width - menuPadding) + 'px';
        } else {
            menuStyle.left = (x - menuPadding) + 'px';
        }
        // if outside bottom, bottom align it
        if (
            y + height + (chart.exportMenuHeight as any) > chartHeight &&
            button.alignOptions.verticalAlign !== 'top'
        ) {
            menuStyle.bottom = (chartHeight - y - menuPadding) + 'px';
        } else {
            menuStyle.top = (y + height - menuPadding) + 'px';
        }

        css(menu, menuStyle);
        // #10361, #9998
        css(chart.renderTo, { overflow: '' });
        css(chart.container, { overflow: '' });
        chart.openMenu = true;
        fireEvent(chart, 'exportMenuShown');
    }

    /**
     * Destroy the export buttons.
     * @private
     * @function Highcharts.Chart#destroyExport
     * @param {global.Event} [e]
     * @requires modules/exporting
     */
    function destroyExport(
        this: ChartComposition,
        e?: Event
    ): void {
        const chart = e ? (e.target as unknown as ChartComposition) : this,
            exportSVGElements = chart.exportSVGElements,
            exportDivElements = chart.exportDivElements,
            exportEvents = chart.exportEvents;
        let cacheName;

        // Destroy the extra buttons added
        if (exportSVGElements) {
            exportSVGElements.forEach((elem, i): void => {

                // Destroy and null the svg elements
                if (elem) { // #1822
                    elem.onclick = elem.ontouchstart = null;
                    cacheName = 'cache-' + elem.menuClassName;

                    if ((chart as any)[cacheName]) {
                        delete (chart as any)[cacheName];
                    }

                    exportSVGElements[i] = elem.destroy();
                }
            });
            exportSVGElements.length = 0;
        }

        // Destroy the exporting group
        if (chart.exportingGroup) {
            chart.exportingGroup.destroy();
            delete chart.exportingGroup;
        }

        // Destroy the divs for the menu
        if (exportDivElements) {
            exportDivElements.forEach(function (
                elem: (DivElement|null),
                i: number
            ): void {
                if (elem) {
                    // Remove the event handler
                    U.clearTimeout(elem.hideTimer as any); // #5427
                    removeEvent(elem, 'mouseleave');

                    // Remove inline events
                    // (chart.exportDivElements as any)[i] =
                    exportDivElements[i] =
                        elem.onmouseout =
                        elem.onmouseover =
                        elem.ontouchstart =
                        elem.onclick = null;

                    // Destroy the div by moving to garbage bin
                    discardElement(elem);
                }
            });
            exportDivElements.length = 0;
        }

        if (exportEvents) {
            exportEvents.forEach(function (unbind: Function): void {
                unbind();
            });
            exportEvents.length = 0;
        }
    }

    /**
     * Exporting module required. Submit an SVG version of the chart to a server
     * along with some parameters for conversion.
     *
     * @sample highcharts/members/chart-exportchart/
     *         Export with no options
     * @sample highcharts/members/chart-exportchart-filename/
     *         PDF type and custom filename
     * @sample highcharts/members/chart-exportchart-custom-background/
     *         Different chart background in export
     * @sample stock/members/chart-exportchart/
     *         Export with Highcharts Stock
     *
     * @function Highcharts.Chart#exportChart
     *
     * @param {Highcharts.ExportingOptions} exportingOptions
     *        Exporting options in addition to those defined in
     *        [exporting](https://api.highcharts.com/highcharts/exporting).
     *
     * @param {Highcharts.Options} chartOptions
     *        Additional chart options for the exported chart. For example a
     *        different background color can be added here, or `dataLabels` for
     *        export only.
     *
     * @requires modules/exporting
     */
    function exportChart(
        this: ChartComposition,
        exportingOptions: ExportingOptions,
        chartOptions: Options
    ): void {
        const svg = this.getSVGForExport(exportingOptions, chartOptions);

        // merge the options
        exportingOptions = merge(this.options.exporting, exportingOptions);

        // do the post
        HU.post(exportingOptions.url as any, {
            filename: exportingOptions.filename ?
                exportingOptions.filename.replace(/\//g, '-') :
                this.getFilename(),
            type: exportingOptions.type,
            width: exportingOptions.width,
            scale: exportingOptions.scale,
            svg: svg
        }, exportingOptions.formAttributes as any);
    }

    /**
     * Return the unfiltered innerHTML of the chart container. Used as hook for
     * plugins. In styled mode, it also takes care of inlining CSS style rules.
     *
     * @see Chart#getSVG
     *
     * @function Highcharts.Chart#getChartHTML
     *
     * @return {string}
     * The unfiltered SVG of the chart.
     *
     * @requires modules/exporting
     */
    function getChartHTML(
        this: ChartComposition
    ): string {
        if (this.styledMode) {
            this.inlineStyles();
        }

        return this.container.innerHTML;
    }

    /**
     * Get the default file name used for exported charts. By default it creates
     * a file name based on the chart title.
     *
     * @function Highcharts.Chart#getFilename
     *
     * @return {string} A file name without extension.
     *
     * @requires modules/exporting
     */
    function getFilename(
        this: ChartComposition
    ): string {
        const s = this.userOptions.title && this.userOptions.title.text;
        let filename: string = (this.options.exporting as any).filename;

        if (filename) {
            return filename.replace(/\//g, '-');
        }

        if (typeof s === 'string') {
            filename = s
                .toLowerCase()
                .replace(/<\/?[^>]+(>|$)/g, '') // strip HTML tags
                .replace(/[\s_]+/g, '-')
                .replace(/[^a-z0-9\-]/g, '') // preserve only latin
                .replace(/^[\-]+/g, '') // dashes in the start
                .replace(/[\-]+/g, '-') // dashes in a row
                .substr(0, 24)
                .replace(/[\-]+$/g, ''); // dashes in the end;
        }

        if (!filename || filename.length < 5) {
            filename = 'chart';
        }

        return filename;
    }

    /**
     * Return an SVG representation of the chart.
     *
     * @sample highcharts/members/chart-getsvg/
     *         View the SVG from a button
     *
     * @function Highcharts.Chart#getSVG
     *
     * @param {Highcharts.Options} [chartOptions]
     *        Additional chart options for the generated SVG representation. For
     *        collections like `xAxis`, `yAxis` or `series`, the additional
     *        options is either merged in to the original item of the same
     *        `id`, or to the first item if a common id is not found.
     *
     * @return {string}
     *         The SVG representation of the rendered chart.
     *
     * @emits Highcharts.Chart#event:getSVG
     *
     * @requires modules/exporting
     */
    function getSVG(
        this: ChartComposition,
        chartOptions?: DeepPartial<Options>
    ): string {
        const chart = this;
        let svg,
            seriesOptions: DeepPartial<SeriesTypeOptions>,
            // Copy the options and add extra options
            options = merge(chart.options, chartOptions);

        // Use userOptions to make the options chain in series right (#3881)
        options.plotOptions = merge(
            chart.userOptions.plotOptions,
            chartOptions && chartOptions.plotOptions
        );
        // ... and likewise with time, avoid that undefined time properties are
        // merged over legacy global time options
        options.time = merge(
            chart.userOptions.time,
            chartOptions && chartOptions.time
        );

        // create a sandbox where a new chart will be generated
        const sandbox = createElement('div', null as any, {
            position: 'absolute',
            top: '-9999em',
            width: chart.chartWidth + 'px',
            height: chart.chartHeight + 'px'
        }, doc.body);

        // get the source size
        const cssWidth: string = chart.renderTo.style.width as any,
            cssHeight: string = chart.renderTo.style.height as any,
            sourceWidth: number = (options.exporting as any).sourceWidth ||
                options.chart.width ||
                (/px$/.test(cssWidth) && parseInt(cssWidth, 10)) ||
                (options.isGantt ? 800 : 600),
            sourceHeight: number = (options.exporting as any).sourceHeight ||
                options.chart.height ||
                (/px$/.test(cssHeight) && parseInt(cssHeight, 10)) ||
                400;

        // override some options
        extend(options.chart, {
            animation: false,
            renderTo: sandbox,
            forExport: true,
            renderer: 'SVGRenderer',
            width: sourceWidth,
            height: sourceHeight
        });
        (options.exporting as any).enabled = false; // hide buttons in print
        delete options.data; // #3004

        // prepare for replicating the chart
        options.series = [];
        chart.series.forEach(function (serie): void {
            seriesOptions = merge(serie.userOptions, { // #4912
                animation: false, // turn off animation
                enableMouseTracking: false,
                showCheckbox: false,
                visible: serie.visible
            });

            // Used for the navigator series that has its own option set
            if (!seriesOptions.isInternal) {
                (options.series as any).push(seriesOptions);
            }
        });

        const colls: Record<string, boolean> = {};
        chart.axes.forEach(function (axis): void {
            // Assign an internal key to ensure a one-to-one mapping (#5924)
            if (!axis.userOptions.internalKey) { // #6444
                axis.userOptions.internalKey = uniqueKey();
            }

            if (!axis.options.isInternal) {
                if (!colls[axis.coll]) {
                    colls[axis.coll] = true;
                    (options as any)[axis.coll] = [];
                }

                (options as any)[axis.coll].push(merge(axis.userOptions, {
                    visible: axis.visible
                }));
            }
        });

        // Generate the chart copy
        const chartCopy = new (chart.constructor as typeof Chart)(
            options,
            chart.callback
        ) as ChartComposition;

        // Axis options and series options  (#2022, #3900, #5982)
        if (chartOptions) {
            ['xAxis', 'yAxis', 'series'].forEach(function (coll: string): void {
                const collOptions: Partial<Options> = {};

                if ((chartOptions as any)[coll]) {
                    (collOptions as any)[coll] = (chartOptions as any)[coll];
                    chartCopy.update(collOptions);
                }
            });
        }

        // Reflect axis extremes in the export (#5924)
        chart.axes.forEach(function (axis): void {
            const axisCopy = find(chartCopy.axes, function (
                    copy: Axis
                ): boolean {
                    return copy.options.internalKey ===
                        axis.userOptions.internalKey;
                }),
                extremes = axis.getExtremes(),
                userMin = extremes.userMin,
                userMax = extremes.userMax;

            if (
                axisCopy &&
                ((
                    typeof userMin !== 'undefined' &&
                    userMin !== axisCopy.min) || (
                    typeof userMax !== 'undefined' &&
                    userMax !== axisCopy.max
                ))
            ) {
                axisCopy.setExtremes(userMin, userMax, true, false);
            }
        });

        // Get the SVG from the container's innerHTML
        svg = chartCopy.getChartHTML();
        fireEvent(this, 'getSVG', { chartCopy: chartCopy });

        svg = chart.sanitizeSVG(svg, options);

        // free up memory
        options = null as any;
        chartCopy.destroy();
        discardElement(sandbox);

        return svg;
    }

    /**
     * @private
     * @function Highcharts.Chart#getSVGForExport
     */
    function getSVGForExport(
        this: ChartComposition,
        options: ExportingOptions,
        chartOptions: Partial<Options>
    ): string {
        const chartExportingOptions: ExportingOptions =
            this.options.exporting as any;

        return this.getSVG(merge(
            { chart: { borderRadius: 0 } },
            chartExportingOptions.chartOptions,
            chartOptions,
            {
                exporting: {
                    sourceWidth: (
                        (options && options.sourceWidth) ||
                        chartExportingOptions.sourceWidth
                    ),
                    sourceHeight: (
                        (options && options.sourceHeight) ||
                        chartExportingOptions.sourceHeight
                    )
                }
            }
        ));
    }

    /**
     * Make hyphenated property names out of camelCase
     * @private
     * @param {string} prop
     * Property name in camelCase
     * @return {string}
     * Hyphenated property name
     */
    function hyphenate(prop: string): string {
        return prop.replace(
            /([A-Z])/g,
            function (a: string, b: string): string {
                return '-' + b.toLowerCase();
            }
        );
    }

    /**
     * Analyze inherited styles from stylesheets and add them inline
     *
     * @private
     * @function Highcharts.Chart#inlineStyles
     *
     * @todo What are the border styles for text about? In general, text has a
     *       lot of properties.
     *
     * @todo Make it work with IE9 and IE10.
     *
     * @requires modules/exporting
     */
    function inlineStyles(
        this: ChartComposition
    ): void {
        const denylist = inlineDenylist,
            allowlist = inlineAllowlist, // For IE
            defaultStyles: Record<string, CSSObject> = {};
        let dummySVG: SVGElement;

        // Create an iframe where we read default styles without pollution from
        // this body
        const iframe: HTMLIFrameElement = doc.createElement('iframe');
        css(iframe, {
            width: '1px',
            height: '1px',
            visibility: 'hidden'
        });
        doc.body.appendChild(iframe);
        const iframeDoc = (
            iframe.contentWindow && iframe.contentWindow.document
        );
        if (iframeDoc) {
            iframeDoc.body.appendChild(
                iframeDoc.createElementNS(SVG_NS, 'svg')
            );
        }

        /**
         * Call this on all elements and recurse to children
         * @private
         * @param {Highcharts.HTMLDOMElement} node
         *        Element child
             */
        function recurse(node: HTMLDOMElement): void {
            const filteredStyles: CSSObject = {};

            let styles: CSSObject,
                parentStyles: (CSSObject|SVGAttributes),
                dummy: Element,
                denylisted: (boolean|undefined),
                allowlisted: (boolean|undefined),
                i: number;

            /**
             * Check computed styles and whether they are in the allow/denylist
             * for styles or atttributes.
             * @private
             * @param {string} val
             *        Style value
             * @param {string} prop
             *        Style property name
                     */
            function filterStyles(
                val: (string|number|boolean|undefined),
                prop: string
            ): void {

                // Check against allowlist & denylist
                denylisted = allowlisted = false;
                if (allowlist.length) {
                    // Styled mode in IE has a allowlist instead. Exclude all
                    // props not in this list.
                    i = allowlist.length;
                    while (i-- && !allowlisted) {
                        allowlisted = allowlist[i].test(prop);
                    }
                    denylisted = !allowlisted;
                }

                // Explicitly remove empty transforms
                if (prop === 'transform' && val === 'none') {
                    denylisted = true;
                }

                i = denylist.length;
                while (i-- && !denylisted) {
                    denylisted = (
                        denylist[i].test(prop) ||
                        typeof val === 'function'
                    );
                }

                if (!denylisted) {
                    // If parent node has the same style, it gets inherited, no
                    // need to inline it. Top-level props should be diffed
                    // against parent (#7687).
                    if (
                        (
                            (parentStyles as any)[prop] !== val ||
                            node.nodeName === 'svg'
                        ) &&
                        (defaultStyles[node.nodeName] as any)[prop] !== val
                    ) {
                        // Attributes
                        if (
                            !inlineToAttributes ||
                            inlineToAttributes.indexOf(prop) !== -1
                        ) {
                            if (val) {
                                node.setAttribute(hyphenate(prop), val);
                            }
                        // Styles
                        } else {
                            (filteredStyles as any)[prop] = val;
                        }
                    }
                }
            }

            if (
                iframeDoc &&
                node.nodeType === 1 &&
                unstyledElements.indexOf(node.nodeName) === -1
            ) {
                styles = win.getComputedStyle(node, null) as any;
                parentStyles = node.nodeName === 'svg' ?
                    {} :
                    win.getComputedStyle(node.parentNode, null) as any;

                // Get default styles from the browser so that we don't have to
                // add these
                if (!defaultStyles[node.nodeName]) {
                    /*
                    if (!dummySVG) {
                        dummySVG = doc.createElementNS(H.SVG_NS, 'svg');
                        dummySVG.setAttribute('version', '1.1');
                        doc.body.appendChild(dummySVG);
                    }
                    */
                    dummySVG = iframeDoc.getElementsByTagName('svg')[0] as any;
                    dummy = iframeDoc.createElementNS(
                        node.namespaceURI,
                        node.nodeName
                    );
                    dummySVG.appendChild(dummy);

                    // Get the defaults into a standard object (simple merge
                    // won't do)
                    const s = win.getComputedStyle(dummy, null),
                        defaults: Record<string, string> = {};
                    for (const key in s) {
                        if (
                            typeof s[key] === 'string' &&
                            !/^[0-9]+$/.test(key)
                        ) {
                            defaults[key] = s[key];
                        }
                    }
                    defaultStyles[node.nodeName] = defaults;

                    // Remove default fill, otherwise text disappears when
                    // exported
                    if (node.nodeName === 'text') {
                        delete defaultStyles.text.fill;
                    }
                    dummySVG.removeChild(dummy);
                }

                // Loop through all styles and add them inline if they are ok
                for (const p in styles) {
                    if (
                        // Some browsers put lots of styles on the prototype...
                        G.isFirefox ||
                        G.isMS ||
                        G.isSafari || // #16902
                        // ... Chrome puts them on the instance
                        Object.hasOwnProperty.call(styles, p)
                    ) {
                        filterStyles((styles as any)[p], p);
                    }
                }

                // Apply styles
                css(node, filteredStyles);

                // Set default stroke width (needed at least for IE)
                if (node.nodeName === 'svg') {
                    node.setAttribute('stroke-width', '1px');
                }

                if (node.nodeName === 'text') {
                    return;
                }

                // Recurse
                [].forEach.call(node.children || node.childNodes, recurse);
            }
        }

        /**
         * Remove the dummy objects used to get defaults
         * @private
         */
        function tearDown(): void {
            dummySVG.parentNode.removeChild(dummySVG);
            // Remove trash from DOM that stayed after each exporting
            iframe.parentNode.removeChild(iframe);
        }

        recurse(this.container.querySelector('svg') as any);
        tearDown();

    }

    /**
     * Move the chart container(s) to another div.
     *
     * @function Highcharts#moveContainers
     *
     * @private
     *
     * @param {Highcharts.HTMLDOMElement} moveTo
     *        Move target
     */
    function moveContainers(this: Chart, moveTo: HTMLDOMElement): void {
        const chart = this;
        (
            chart.fixedDiv ? // When scrollablePlotArea is active (#9533)
                [chart.fixedDiv, chart.scrollingContainer as any] :
                [chart.container]

        ).forEach(function (div: HTMLDOMElement): void {
            moveTo.appendChild(div);
        });
    }

    /**
     * Add update methods to handle chart.update and chart.exporting.update and
     * chart.navigation.update. These must be added to the chart instance rather
     * than the Chart prototype in order to use the chart instance inside the
     * update function.
     * @private
     */
    function onChartInit(
        this: ChartComposition
    ): void {
        const chart = this,
            /**
             * @private
             * @param {"exporting"|"navigation"} prop
             *        Property name in option root
             * @param {Highcharts.ExportingOptions|Highcharts.NavigationOptions} options
             *        Options to update
             * @param {boolean} [redraw=true]
             *        Whether to redraw
                     */
            update = (
                prop: ('exporting'|'navigation'),
                options: (ExportingOptions|NavigationOptions),
                redraw?: boolean
            ): void => {
                chart.isDirtyExporting = true;
                merge(true, chart.options[prop], options);
                if (pick(redraw, true)) {
                    chart.redraw();
                }
            };

        chart.exporting = {
            update: function (
                options: ExportingOptions,
                redraw?: boolean
            ): void {
                update('exporting', options, redraw);
            }
        };

        // Register update() method for navigation. Cannot be set the same way
        // as for exporting, because navigation options are shared with bindings
        // which has separate update() logic.
        ChartNavigationComposition
            .compose(chart).navigation
            .addUpdate((
                options: NavigationOptions,
                redraw?: boolean
            ): void => {
                update('navigation', options, redraw);
            });
    }

    /**
     * Exporting module required. Clears away other elements in the page and
     * prints the chart as it is displayed. By default, when the exporting
     * module is enabled, a context button with a drop down menu in the upper
     * right corner accesses this function.
     *
     * @sample highcharts/members/chart-print/
     *         Print from a HTML button
     *
     * @function Highcharts.Chart#print
     *
     *
     * @emits Highcharts.Chart#event:beforePrint
     * @emits Highcharts.Chart#event:afterPrint
     *
     * @requires modules/exporting
     */
    function print(
        this: ChartComposition
    ): void {
        const chart = this;

        if (chart.isPrinting) { // block the button while in printing mode
            return;
        }

        printingChart = chart;

        if (!G.isSafari) {
            chart.beforePrint();
        }

        // Give the browser time to draw WebGL content, an issue that randomly
        // appears (at least) in Chrome ~67 on the Mac (#8708).
        setTimeout((): void => {

            win.focus(); // #1510
            win.print();

            // allow the browser to prepare before reverting
            if (!G.isSafari) {
                setTimeout((): void => {
                    chart.afterPrint();
                }, 1000);
            }
        }, 1);

    }

    /**
     * Add the buttons on chart load
     * @private
     * @function Highcharts.Chart#renderExporting
     * @requires modules/exporting
     */
    function renderExporting(this: ChartComposition): void {
        const chart = this as ChartComposition,
            exportingOptions: ExportingOptions =
                chart.options.exporting as any,
            buttons = exportingOptions.buttons,
            isDirty = chart.isDirtyExporting || !chart.exportSVGElements;

        chart.buttonOffset = 0;
        if (chart.isDirtyExporting) {
            chart.destroyExport();
        }

        if (isDirty && (exportingOptions as any).enabled !== false) {
            chart.exportEvents = [];

            chart.exportingGroup = chart.exportingGroup ||
                chart.renderer.g('exporting-group').attr({
                    zIndex: 3 // #4955, // #8392
                }).add();

            objectEach(buttons, function (
                button: ExportingButtonOptions
            ): void {
                chart.addButton(button);
            });

            chart.isDirtyExporting = false;
        }
    }

    /**
     * Exporting module only. A collection of fixes on the produced SVG to
     * account for expando properties, browser bugs.
     * Returns a cleaned SVG.
     *
     * @private
     * @function Highcharts.Chart#sanitizeSVG
     * @param {string} svg
     *        SVG code to sanitize
     * @param {Highcharts.Options} options
     *        Chart options to apply
     * @return {string}
     *         Sanitized SVG code
     * @requires modules/exporting
     */
    function sanitizeSVG(
        this: Chart,
        svg: string,
        options: Options
    ): string {

        const split = svg.indexOf('</svg>') + 6;
        let html = svg.substr(split);

        // Remove any HTML added to the container after the SVG (#894, #9087)
        svg = svg.substr(0, split);

        // Move HTML into a foreignObject
        if (options && options.exporting && options.exporting.allowHTML) {
            if (html) {
                html = '<foreignObject x="0" y="0" ' +
                            'width="' + options.chart.width + '" ' +
                            'height="' + options.chart.height + '">' +
                    '<body xmlns="http://www.w3.org/1999/xhtml">' +
                    // Some tags needs to be closed in xhtml (#13726)
                    html.replace(/(<(?:img|br).*?(?=\>))>/g, '$1 />') +
                    '</body>' +
                    '</foreignObject>';
                svg = svg.replace('</svg>', html + '</svg>');
            }

        }

        svg = svg
            .replace(/zIndex="[^"]+"/g, '')
            .replace(/symbolName="[^"]+"/g, '')
            .replace(/jQuery[0-9]+="[^"]+"/g, '')
            .replace(/url\(("|&quot;)(.*?)("|&quot;)\;?\)/g, 'url($2)')
            .replace(/url\([^#]+#/g, 'url(#')
            .replace(
                /<svg /,
                '<svg xmlns:xlink="http://www.w3.org/1999/xlink" '
            )
            .replace(/ (|NS[0-9]+\:)href=/g, ' xlink:href=') // #3567
            .replace(/\n/, ' ')
            // Batik doesn't support rgba fills and strokes (#3095)
            .replace(
                /(fill|stroke)="rgba\(([ 0-9]+,[ 0-9]+,[ 0-9]+),([ 0-9\.]+)\)"/g, // eslint-disable-line max-len
                '$1="rgb($2)" $1-opacity="$3"'
            )

            // Replace HTML entities, issue #347
            .replace(/&nbsp;/g, '\u00A0') // no-break space
            .replace(/&shy;/g, '\u00AD'); // soft hyphen

        return svg;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default Exporting;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Gets fired after a chart is printed through the context menu item or the
 * Chart.print method.
 *
 * @callback Highcharts.ExportingAfterPrintCallbackFunction
 *
 * @param {Highcharts.Chart} this
 *        The chart on which the event occured.
 *
 * @param {global.Event} event
 *        The event that occured.
 */

/**
 * Gets fired before a chart is printed through the context menu item or the
 * Chart.print method.
 *
 * @callback Highcharts.ExportingBeforePrintCallbackFunction
 *
 * @param {Highcharts.Chart} this
 *        The chart on which the event occured.
 *
 * @param {global.Event} event
 *        The event that occured.
 */

/**
 * Function to call if the offline-exporting module fails to export a chart on
 * the client side.
 *
 * @callback Highcharts.ExportingErrorCallbackFunction
 *
 * @param {Highcharts.ExportingOptions} options
 *        The exporting options.
 *
 * @param {global.Error} err
 *        The error from the module.
 */

/**
 * Definition for a menu item in the context menu.
 *
 * @interface Highcharts.ExportingMenuObject
 *//**
 * The text for the menu item.
 *
 * @name Highcharts.ExportingMenuObject#text
 * @type {string|undefined}
 *//**
 * If internationalization is required, the key to a language string.
 *
 * @name Highcharts.ExportingMenuObject#textKey
 * @type {string|undefined}
 *//**
 * The click handler for the menu item.
 *
 * @name Highcharts.ExportingMenuObject#onclick
 * @type {Highcharts.EventCallbackFunction<Highcharts.Chart>|undefined}
 *//**
 * Indicates a separator line instead of an item.
 *
 * @name Highcharts.ExportingMenuObject#separator
 * @type {boolean|undefined}
 */

/**
 * Possible MIME types for exporting.
 *
 * @typedef {"image/png"|"image/jpeg"|"application/pdf"|"image/svg+xml"} Highcharts.ExportingMimeTypeValue
 */

(''); // keeps doclets above in transpiled file

/* *
 *
 *  API Options
 *
 * */

/**
 * Fires after a chart is printed through the context menu item or the
 * `Chart.print` method.
 *
 * @sample highcharts/chart/events-beforeprint-afterprint/
 *         Rescale the chart to print
 *
 * @type      {Highcharts.ExportingAfterPrintCallbackFunction}
 * @since     4.1.0
 * @context   Highcharts.Chart
 * @requires  modules/exporting
 * @apioption chart.events.afterPrint
 */

/**
 * Fires before a chart is printed through the context menu item or
 * the `Chart.print` method.
 *
 * @sample highcharts/chart/events-beforeprint-afterprint/
 *         Rescale the chart to print
 *
 * @type      {Highcharts.ExportingBeforePrintCallbackFunction}
 * @since     4.1.0
 * @context   Highcharts.Chart
 * @requires  modules/exporting
 * @apioption chart.events.beforePrint
 */

(''); // keeps doclets above in transpiled file
