/* *
 *
 *  GUI generator for Stock tools
 *
 *  (c) 2009-2021 Sebastian Bochan
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

import type Chart from '../../Core/Chart/Chart';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';
import type {
    StockToolsGuiDefinitionsButtonsOptions,
    StockToolsGuiDefinitionsOptions,
    StockToolsGuiOptions,
    StockToolsOptions
} from './StockToolsOptions';

import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { addEvent, fireEvent } = EH;
const {
    createElement,
    css,
    getStyle,
    pick
} = U;

/* *
 *
 *  Classes
 *
 * */

/**
 * Toolbar Class
 *
 * @private
 * @class
 *
 * @param {object} options
 *        Options of toolbar
 *
 * @param {Highcharts.Dictionary<string>|undefined} langOptions
 *        Language options
 *
 * @param {Highcharts.Chart} chart
 *        Reference to chart
 */
class Toolbar {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        options: StockToolsGuiOptions,
        langOptions: (Record<string, string>|undefined),
        chart: Chart
    ) {
        this.chart = chart;
        this.options = options;
        this.lang = langOptions;
        // set url for icons.
        this.iconsURL = this.getIconsURL();
        this.guiEnabled = options.enabled;
        this.visible = pick(options.visible, true);
        this.placed = pick(options.placed, false);

        // General events collection which should be removed upon
        // destroy/update:
        this.eventsToUnbind = [];

        if (this.guiEnabled) {
            this.createHTML();

            this.init();

            this.showHideNavigatorion();
        }

        fireEvent(this, 'afterInit');
    }

    /* *
     *
     *  Properties
     *
     * */

    public arrowDown: HTMLDOMElement = void 0 as any;
    public arrowUp: HTMLDOMElement = void 0 as any;
    public arrowWrapper: HTMLDOMElement = void 0 as any;
    public chart: Chart;
    public eventsToUnbind: Array<Function>;
    public guiEnabled: (boolean|undefined);
    public iconsURL: string;
    public lang: (Record<string, string>|undefined);
    public listWrapper: HTMLDOMElement = void 0 as any;
    public options: StockToolsGuiOptions;
    public placed: boolean;
    public prevOffsetWidth: (number|undefined);
    public showhideBtn: HTMLDOMElement = void 0 as any;
    public submenu: HTMLDOMElement = void 0 as any;
    public toolbar: HTMLDOMElement = void 0 as any;
    public visible: boolean;
    public wrapper: HTMLDOMElement = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initialize the toolbar. Create buttons and submenu for each option
     * defined in `stockTools.gui`.
     * @private
     */
    public init(): void {
        const lang = this.lang,
            guiOptions = this.options,
            toolbar = this.toolbar,
            buttons: Array<string> = guiOptions.buttons as any,
            defs: StockToolsGuiDefinitionsOptions =
                guiOptions.definitions as any,
            allButtons = toolbar.childNodes;

        // create buttons
        buttons.forEach((btnName: string): void => {

            const button = this.addButton(toolbar, defs, btnName, lang);

            this.eventsToUnbind.push(
                addEvent(
                    (button as any).buttonWrapper,
                    'click',
                    (): void => this.eraseActiveButtons(
                        allButtons as any,
                        button.buttonWrapper
                    )
                )
            );

            if (isArray((defs as any)[btnName].items)) {
                // create submenu buttons
                this.addSubmenu(button, (defs as any)[btnName]);
            }
        });
    }

    /**
     * Create submenu (list of buttons) for the option. In example main button
     * is Line, in submenu will be buttons with types of lines.
     *
     * @private
     *
     * @param {Highcharts.Dictionary<Highcharts.HTMLDOMElement>} parentBtn
     *        Button which has submenu
     *
     * @param {Highcharts.StockToolsGuiDefinitionsButtonsOptions} button
     *        List of all buttons
     */
    public addSubmenu(
        parentBtn: Record<string, HTMLDOMElement>,
        button: StockToolsGuiDefinitionsButtonsOptions
    ): void {
        const submenuArrow = parentBtn.submenuArrow,
            buttonWrapper = parentBtn.buttonWrapper,
            buttonWidth: number = getStyle(buttonWrapper, 'width') as any,
            wrapper = this.wrapper,
            menuWrapper = this.listWrapper,
            allButtons = this.toolbar.childNodes,
            // create submenu container
            submenuWrapper = this.submenu = createElement('ul', {
                className: 'highcharts-submenu-wrapper'
            }, void 0, buttonWrapper);

        // create submenu buttons and select the first one
        this.addSubmenuItems(buttonWrapper, button);

        // show / hide submenu
        this.eventsToUnbind.push(
            addEvent(submenuArrow, 'click', (e: Event): void => {

                e.stopPropagation();
                // Erase active class on all other buttons
                this.eraseActiveButtons(allButtons, buttonWrapper);

                // hide menu
                if (
                    buttonWrapper.className
                        .indexOf('highcharts-current') >= 0
                ) {
                    menuWrapper.style.width =
                        (menuWrapper as any).startWidth + 'px';
                    buttonWrapper.classList.remove('highcharts-current');
                    (submenuWrapper as any).style.display = 'none';
                } else {
                    // show menu
                    // to calculate height of element
                    (submenuWrapper as any).style.display = 'block';

                    let topMargin = (submenuWrapper as any).offsetHeight -
                            buttonWrapper.offsetHeight - 3;

                    // calculate position of submenu in the box
                    // if submenu is inside, reset top margin
                    if (
                        // cut on the bottom
                        !((submenuWrapper as any).offsetHeight +
                            buttonWrapper.offsetTop >
                        wrapper.offsetHeight &&
                        // cut on the top
                        buttonWrapper.offsetTop > topMargin)
                    ) {
                        topMargin = 0;
                    }

                    // apply calculated styles
                    css((submenuWrapper as any), {
                        top: -topMargin + 'px',
                        left: buttonWidth + 3 + 'px'
                    });

                    buttonWrapper.className += ' highcharts-current';
                    (menuWrapper as any).startWidth = wrapper.offsetWidth;
                    menuWrapper.style.width = (menuWrapper as any).startWidth +
                        getStyle(menuWrapper, 'padding-left') +
                        (submenuWrapper as any).offsetWidth + 3 + 'px';
                }
            })
        );
    }

    /**
     * Create buttons in submenu
     *
     * @private
     *
     * @param {Highcharts.HTMLDOMElement} buttonWrapper
     *        Button where submenu is placed
     *
     * @param {Highcharts.StockToolsGuiDefinitionsButtonsOptions} button
     *        List of all buttons options
     */
    public addSubmenuItems(
        buttonWrapper: HTMLDOMElement,
        button: StockToolsGuiDefinitionsButtonsOptions
    ): void {
        const _self = this,
            submenuWrapper = this.submenu,
            lang = this.lang,
            menuWrapper = this.listWrapper,
            items = button.items;

        let submenuBtn: (Record<string, HTMLDOMElement>|undefined);

        // add items to submenu
        items.forEach((btnName): void => {
            // add buttons to submenu
            submenuBtn = this.addButton(
                submenuWrapper,
                button,
                btnName,
                lang
            );

            this.eventsToUnbind.push(addEvent(
                submenuBtn.mainButton,
                'click',
                function (): void {
                    (_self.switchSymbol as any)(this, buttonWrapper, true);
                    menuWrapper.style.width =
                        (menuWrapper as any).startWidth + 'px';
                    submenuWrapper.style.display = 'none';
                }
            ));
        });

        // select first submenu item
        const firstSubmenuItem =
            submenuWrapper.querySelectorAll<HTMLDOMElement>(
                'li > .highcharts-menu-item-btn'
            )[0];

        // replace current symbol, in main button, with submenu's button style
        this.switchSymbol(firstSubmenuItem, false);
    }

    /**
     * Erase active class on all other buttons.
     * @private
     */
    public eraseActiveButtons(
        buttons: NodeListOf<ChildNode>,
        currentButton: HTMLDOMElement,
        submenuItems?: NodeListOf<HTMLDOMElement>
    ): void {
        ([] as Array<Element>).forEach.call(buttons, (btn): void => {
            if (btn !== currentButton) {
                btn.classList.remove('highcharts-current');
                btn.classList.remove('highcharts-active');
                submenuItems =
                    btn.querySelectorAll('.highcharts-submenu-wrapper');

                // hide submenu
                if (submenuItems.length > 0) {
                    submenuItems[0].style.display = 'none';
                }
            }
        });
    }

    /**
     * Create single button. Consist of HTML elements `li`, `span`, and (if
     * exists) submenu container.
     *
     * @private
     *
     * @param {Highcharts.HTMLDOMElement} target
     *        HTML reference, where button should be added
     *
     * @param {object} options
     *        All options, by btnName refer to particular button
     *
     * @param {string} btnName
     *        Button name of functionality mapped for specific class
     *
     * @param {Highcharts.Dictionary<string>} lang
     *        All titles, by btnName refer to particular button
     *
     * @return {object}
     *         References to all created HTML elements
     */
    public addButton(
        target: HTMLDOMElement,
        options: (
            StockToolsGuiDefinitionsButtonsOptions|
            StockToolsGuiDefinitionsOptions
        ),
        btnName: string,
        lang: Record<string, string> = {}
    ): Record<string, HTMLDOMElement> {
        const btnOptions: StockToolsGuiDefinitionsButtonsOptions =
                options[btnName] as any,
            items = btnOptions.items,
            classMapping = Toolbar.prototype.classMapping,
            userClassName = btnOptions.className || '';

        // main button wrapper
        const buttonWrapper = createElement('li', {
            className: pick(classMapping[btnName], '') + ' ' + userClassName,
            title: lang[btnName] || btnName
        }, void 0, target);

        // single button
        const mainButton = createElement('span', {
            className: 'highcharts-menu-item-btn'
        }, void 0, buttonWrapper);

        // submenu
        if (items && items.length) {

            // arrow is a hook to show / hide submenu
            const submenuArrow = createElement('span', {
                className: 'highcharts-submenu-item-arrow ' +
                    'highcharts-arrow-right'
            }, void 0, buttonWrapper);

            submenuArrow.style.backgroundImage = 'url(' +
                this.iconsURL + 'arrow-bottom.svg)';

            return {
                buttonWrapper,
                mainButton,
                submenuArrow
            };
        }

        mainButton.style.backgroundImage = 'url(' +
            this.iconsURL + btnOptions.symbol + ')';

        return {
            buttonWrapper,
            mainButton
        };
    }

    /**
     * Create navigation's HTML elements: container and arrows.
     * @private
     */
    public addNavigation(): void {
        const wrapper = this.wrapper;

        // arrow wrapper
        this.arrowWrapper = createElement('div', {
            className: 'highcharts-arrow-wrapper'
        });

        this.arrowUp = createElement('div', {
            className: 'highcharts-arrow-up'
        }, void 0, this.arrowWrapper);

        this.arrowUp.style.backgroundImage =
            'url(' + this.iconsURL + 'arrow-right.svg)';

        this.arrowDown = createElement('div', {
            className: 'highcharts-arrow-down'
        }, void 0, this.arrowWrapper);

        this.arrowDown.style.backgroundImage =
            'url(' + this.iconsURL + 'arrow-right.svg)';

        wrapper.insertBefore(this.arrowWrapper, wrapper.childNodes[0]);

        // attach scroll events
        this.scrollButtons();
    }

    /**
     * Add events to navigation (two arrows) which allows user to scroll
     * top/down GUI buttons, if container's height is not enough.
     * @private
     */
    public scrollButtons(): void {
        const wrapper = this.wrapper,
            toolbar = this.toolbar,
            step = 0.1 * wrapper.offsetHeight; // 0.1 = 10%

        let targetY = 0;

        this.eventsToUnbind.push(
            addEvent(this.arrowUp, 'click', (): void => {
                if (targetY > 0) {
                    targetY -= step;
                    toolbar.style.marginTop = -targetY + 'px';
                }
            })
        );

        this.eventsToUnbind.push(
            addEvent(this.arrowDown, 'click', (): void => {
                if (
                    wrapper.offsetHeight + targetY <=
                    toolbar.offsetHeight + step
                ) {
                    targetY += step;
                    toolbar.style.marginTop = -targetY + 'px';
                }
            })
        );
    }
    /*
     * Create stockTools HTML main elements.
     *
     */
    public createHTML(): void {
        const chart = this.chart,
            guiOptions = this.options,
            container = chart.container,
            navigation = chart.options.navigation,
            bindingsClassName = navigation && navigation.bindingsClassName;
        let listWrapper,
            toolbar;

        // create main container
        const wrapper = this.wrapper = createElement('div', {
            className: 'highcharts-stocktools-wrapper ' +
                guiOptions.className + ' ' + bindingsClassName
        });
        container.appendChild(wrapper);

        // Mimic event behaviour of being outside chart.container
        [
            'mousedown',
            'mousemove',
            'click',
            'touchstart'
        ].forEach((eventType): void => {
            addEvent(wrapper, eventType, (e): void =>
                e.stopPropagation()
            );
        });
        addEvent(wrapper, 'mouseover', (e: MouseEvent): void =>
            chart.pointer.onContainerMouseLeave(e)
        );

        // toolbar
        this.toolbar = toolbar = createElement('ul', {
            className: 'highcharts-stocktools-toolbar ' +
                    guiOptions.toolbarClassName
        });

        // add container for list of buttons
        this.listWrapper = listWrapper = createElement('div', {
            className: 'highcharts-menu-wrapper'
        });

        wrapper.insertBefore(listWrapper, wrapper.childNodes[0]);
        listWrapper.insertBefore(toolbar, listWrapper.childNodes[0]);

        this.showHideToolbar();

        // add navigation which allows user to scroll down / top GUI buttons
        this.addNavigation();
    }
    /**
     * Function called in redraw verifies if the navigation should be visible.
     * @private
     */
    public showHideNavigatorion(): void {
        // arrows
        // 50px space for arrows
        if (
            this.visible &&
            this.toolbar.offsetHeight > (this.wrapper.offsetHeight - 50)
        ) {
            this.arrowWrapper.style.display = 'block';
        } else {
            // reset margin if whole toolbar is visible
            this.toolbar.style.marginTop = '0px';

            // hide arrows
            this.arrowWrapper.style.display = 'none';
        }
    }
    /**
     * Create button which shows or hides GUI toolbar.
     * @private
     */
    public showHideToolbar(): void {
        const chart = this.chart,
            wrapper = this.wrapper,
            toolbar = this.listWrapper,
            submenu = this.submenu,
            // Show hide toolbar
            showhideBtn = this.showhideBtn = createElement('div', {
                className: 'highcharts-toggle-toolbar highcharts-arrow-left'
            }, void 0, wrapper);

        let visible = this.visible;

        showhideBtn.style.backgroundImage =
            'url(' + this.iconsURL + 'arrow-right.svg)';

        if (!visible) {
            // hide
            if (submenu) {
                submenu.style.display = 'none';
            }
            showhideBtn.style.left = '0px';
            visible = this.visible = false;
            toolbar.classList.add('highcharts-hide');
            showhideBtn.classList.toggle('highcharts-arrow-right');
            wrapper.style.height = showhideBtn.offsetHeight + 'px';
        } else {
            wrapper.style.height = '100%';
            showhideBtn.style.top = getStyle(toolbar, 'padding-top') + 'px';
            showhideBtn.style.left = (
                wrapper.offsetWidth +
                (getStyle(toolbar, 'padding-left') as any)
            ) + 'px';
        }

        // Toggle menu
        this.eventsToUnbind.push(
            addEvent(showhideBtn, 'click', (): void => {
                chart.update({
                    stockTools: {
                        gui: {
                            visible: !visible,
                            placed: true
                        }
                    }
                });
            })
        );
    }
    /*
     * In main GUI button, replace icon and class with submenu button's
     * class / symbol.
     *
     * @param {HTMLDOMElement} - submenu button
     * @param {Boolean} - true or false
     *
     */
    public switchSymbol(
        button: HTMLDOMElement,
        redraw?: boolean
    ): void {
        const buttonWrapper = button.parentNode,
            buttonWrapperClass = buttonWrapper.className,
            // main button in first level og GUI
            mainNavButton = buttonWrapper.parentNode.parentNode;

        // if the button is disabled, don't do anything
        if (buttonWrapperClass.indexOf('highcharts-disabled-btn') > -1) {
            return;
        }
        // set class
        mainNavButton.className = '';
        if (buttonWrapperClass) {
            mainNavButton.classList.add(buttonWrapperClass.trim());
        }

        // set icon
        mainNavButton
            .querySelectorAll<HTMLElement>('.highcharts-menu-item-btn')[0]
            .style.backgroundImage =
            button.style.backgroundImage;

        // set active class
        if (redraw) {
            this.toggleButtonActiveClass(mainNavButton);
        }
    }

    /**
     * Set select state (active class) on button.
     * @private
     */
    public toggleButtonActiveClass(
        button: HTMLDOMElement
    ): void {
        const classList = button.classList;

        if (classList.contains('highcharts-active')) {
            classList.remove('highcharts-active');
        } else {
            classList.add('highcharts-active');
        }
    }

    /**
     * Remove active class from all buttons except defined.
     * @private
     */
    public unselectAllButtons(
        button: HTMLDOMElement
    ): void {
        const activeBtns = button.parentNode
            .querySelectorAll('.highcharts-active');

        ([] as Array<Element>).forEach.call(activeBtns, (activeBtn): void => {
            if (activeBtn !== button) {
                activeBtn.classList.remove('highcharts-active');
            }
        });
    }

    /**
     * Update GUI with given options.
     * @private
     */
    public update(
        options: StockToolsOptions,
        redraw?: boolean
    ): void {
        merge(true, this.chart.options.stockTools, options);
        this.destroy();
        this.chart.setStockTools(options);

        // If Stock Tools are updated, then bindings should be updated too:
        if (this.chart.navigationBindings) {
            this.chart.navigationBindings.update();
        }

        this.chart.isDirtyBox = true;

        if (pick(redraw, true)) {
            this.chart.redraw();
        }
    }

    /**
     * Destroy all HTML GUI elements.
     * @private
     */
    public destroy(): void {
        const stockToolsDiv = this.wrapper,
            parent = stockToolsDiv && stockToolsDiv.parentNode;

        this.eventsToUnbind.forEach((unbinder): void => unbinder());

        // Remove the empty element
        if (parent) {
            parent.removeChild(stockToolsDiv);
        }
    }

    /**
     * Redraw, GUI requires to verify if the navigation should be visible.
     * @private
     */
    public redraw(): void {
        this.showHideNavigatorion();
    }

    /**
     * @private
     */
    public getIconsURL(): string {
        return (this.chart.options.navigation as any).iconsURL ||
            this.options.iconsURL ||
            'https://code.highcharts.com/@product.version@/gfx/stock-icons/';
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Toolbar {
    /**
     * Mapping JSON fields to CSS classes.
     * @private
     */
    classMapping: Record<string, string>;
}

Toolbar.prototype.classMapping = {
    circle: 'highcharts-circle-annotation',
    ellipse: 'highcharts-ellipse-annotation',
    rectangle: 'highcharts-rectangle-annotation',
    label: 'highcharts-label-annotation',
    segment: 'highcharts-segment',
    arrowSegment: 'highcharts-arrow-segment',
    ray: 'highcharts-ray',
    arrowRay: 'highcharts-arrow-ray',
    line: 'highcharts-infinity-line',
    arrowInfinityLine: 'highcharts-arrow-infinity-line',
    verticalLine: 'highcharts-vertical-line',
    horizontalLine: 'highcharts-horizontal-line',
    crooked3: 'highcharts-crooked3',
    crooked5: 'highcharts-crooked5',
    elliott3: 'highcharts-elliott3',
    elliott5: 'highcharts-elliott5',
    pitchfork: 'highcharts-pitchfork',
    fibonacci: 'highcharts-fibonacci',
    fibonacciTimeZones: 'highcharts-fibonacci-time-zones',
    parallelChannel: 'highcharts-parallel-channel',
    measureX: 'highcharts-measure-x',
    measureY: 'highcharts-measure-y',
    measureXY: 'highcharts-measure-xy',
    timeCycles: 'highcharts-time-cycles',
    verticalCounter: 'highcharts-vertical-counter',
    verticalLabel: 'highcharts-vertical-label',
    verticalArrow: 'highcharts-vertical-arrow',
    currentPriceIndicator: 'highcharts-current-price-indicator',
    indicators: 'highcharts-indicators',
    flagCirclepin: 'highcharts-flag-circlepin',
    flagDiamondpin: 'highcharts-flag-diamondpin',
    flagSquarepin: 'highcharts-flag-squarepin',
    flagSimplepin: 'highcharts-flag-simplepin',
    zoomX: 'highcharts-zoom-x',
    zoomY: 'highcharts-zoom-y',
    zoomXY: 'highcharts-zoom-xy',
    typeLine: 'highcharts-series-type-line',
    typeOHLC: 'highcharts-series-type-ohlc',
    typeHLC: 'highcharts-series-type-hlc',
    typeCandlestick: 'highcharts-series-type-candlestick',
    typeHollowCandlestick: 'highcharts-series-type-hollowcandlestick',
    typeHeikinAshi: 'highcharts-series-type-heikinashi',
    fullScreen: 'highcharts-full-screen',
    toggleAnnotations: 'highcharts-toggle-annotations',
    saveChart: 'highcharts-save-chart',
    separator: 'highcharts-separator'
};

/* *
 *
 *  Default Export
 *
 * */

export default Toolbar;
