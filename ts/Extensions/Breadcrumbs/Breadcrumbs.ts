/* *
 *
 *  Highcharts Breadcrumbs module
 *
 *  Authors: Grzegorz Blachlinski, Karol Kolodziej
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
    BreadcrumbOptions,
    BreadcrumbsOptions
} from './BreadcrumbsOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import BreadcrumbsDefaults from './BreadcrumbsDefaults.js';
import Chart from '../../Core/Chart/Chart.js';
import D from '../../Core/Defaults.js';
import F from '../../Core/Templating.js';
const { format } = F;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    defined,
    extend,
    fireEvent,
    isString,
    merge,
    objectEach,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike' {
    interface ChartLike {
        breadcrumbsBottomMargin?: boolean;
        breadcrumbsTopMargin?: boolean;
        breadcrumbs?: Breadcrumbs;
    }
}
declare module '../../Core/Options' {
    interface LangOptions {
        breadcrumbsToLabel?: string;
        mainBreadcrumb?: string;
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
 *  Functions
 *
 * */

/**
 * Shift the drillUpButton to make the space for resetZoomButton, #8095.
 * @private
 */
function onChartAfterShowResetZoom(
    this: Chart
): void {
    const chart = this;
    if (chart.breadcrumbs) {
        const bbox = chart.resetZoomButton &&
            chart.resetZoomButton.getBBox(),
            breadcrumbsOptions = chart.breadcrumbs.options;

        if (
            bbox &&
            breadcrumbsOptions.position.align === 'right' &&
            breadcrumbsOptions.relativeTo === 'plotBox'
        ) {
            chart.breadcrumbs.alignBreadcrumbsGroup(
                -bbox.width - breadcrumbsOptions.buttonSpacing
            );
        }
    }
}

/**
 * Remove resize/afterSetExtremes at chart destroy.
 * @private
 */
function onChartDestroy(
    this: Chart
): void {
    if (this.breadcrumbs) {
        this.breadcrumbs.destroy();
        this.breadcrumbs = void 0 as Breadcrumbs|undefined;
    }
}

/**
 * Logic for making space for the buttons above the plot area
 * @private
 */
function onChartGetMargins(
    this: Chart
): void {
    const breadcrumbs = this.breadcrumbs;

    if (
        breadcrumbs &&
        !breadcrumbs.options.floating &&
        breadcrumbs.level
    ) {
        const breadcrumbsOptions = breadcrumbs.options,
            buttonTheme = breadcrumbsOptions.buttonTheme,
            breadcrumbsHeight = (
                (buttonTheme.height || 0) +
                2 * (buttonTheme.padding || 0) +
                breadcrumbsOptions.buttonSpacing
            ),
            verticalAlign = breadcrumbsOptions.position.verticalAlign;

        if (verticalAlign === 'bottom') {
            this.marginBottom = (
                this.marginBottom || 0
            ) + breadcrumbsHeight;
            breadcrumbs.yOffset = breadcrumbsHeight;
        } else if (verticalAlign !== 'middle') {
            this.plotTop += breadcrumbsHeight;
            breadcrumbs.yOffset = -breadcrumbsHeight;
        } else {
            breadcrumbs.yOffset = void 0;
        }
    }
}

/**
 * @private
 */
function onChartRedraw(
    this: Chart
): void {
    this.breadcrumbs && this.breadcrumbs.redraw();
}

/**
 * After zooming out, shift the drillUpButton to the previous position, #8095.
 * @private
 */
function onChartSelection(
    this: Chart,
    event: any
): void {
    if (
        event.resetSelection === true &&
        this.breadcrumbs
    ) {
        this.breadcrumbs.alignBreadcrumbsGroup();
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Breadcrumbs class
 *
 * @private
 * @class
 * @name Highcharts.Breadcrumbs
 *
 * @param {Highcharts.Chart} chart
 *        Chart object
 * @param {Highcharts.Options} userOptions
 *        User options
 */
class Breadcrumbs {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions = BreadcrumbsDefaults.options;

    /* *
     *
     *  Functions
     *
     * */

    public static compose(
        ChartClass: typeof Chart,
        highchartsDefaultOptions: typeof D.defaultOptions
    ): void {

        if (U.pushUnique(composedMembers, ChartClass)) {
            addEvent(Chart, 'destroy', onChartDestroy);
            addEvent(Chart, 'afterShowResetZoom', onChartAfterShowResetZoom);
            addEvent(Chart, 'getMargins', onChartGetMargins);
            addEvent(Chart, 'redraw', onChartRedraw);
            addEvent(Chart, 'selection', onChartSelection);
        }

        if (U.pushUnique(composedMembers, highchartsDefaultOptions)) {
            // Add language support.
            extend(
                highchartsDefaultOptions.lang,
                BreadcrumbsDefaults.lang
            );
        }
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: Chart,
        userOptions?: Partial<BreadcrumbsOptions>
    ) {
        const chartOptions = merge(
            chart.options.drilldown &&
                chart.options.drilldown.drillUpButton,
            Breadcrumbs.defaultOptions,
            chart.options.navigation && chart.options.navigation.breadcrumbs,
            userOptions
        );

        this.chart = chart;
        this.options = chartOptions || {};
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: Chart;
    public elementList: { [x: string]: Breadcrumbs.BreadcrumbElement } = {};
    public group?: SVGElement;
    public isDirty: boolean = true;
    public level: number = 0;
    public list: Array<BreadcrumbOptions> = [];
    public options: BreadcrumbsOptions;
    public yOffset?: number;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Update Breadcrumbs properties, like level and list.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#updateProperties
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public updateProperties(
        list: Array<BreadcrumbOptions>
    ): void {
        this.setList(list);
        this.setLevel();
        this.isDirty = true;
    }

    /**
     * Set breadcrumbs list.
     * @function Highcharts.Breadcrumbs#setList
     *
     * @requires  modules/breadcrumbs
     *
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     * @param {Highcharts.BreadcrumbsOptions} list
     *        Breadcrumbs list.
     */
    public setList(
        list: Array<BreadcrumbOptions>
    ): void {
        this.list = list;
    }

    /**
     * Calcule level on which chart currently is.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#setLevel
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public setLevel(): void {
        this.level = this.list.length && this.list.length - 1;
    }

    /**
     * Get Breadcrumbs level
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#getLevel
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public getLevel(): number {
        return this.level;
    }

    /**
     * Default button text formatter.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#getButtonText
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     * @param {Highcharts.Breadcrumbs} breadcrumb
     *        Breadcrumb.
     * @return {string}
     *         Formatted text.
     */
    public getButtonText(
        breadcrumb: BreadcrumbOptions
    ): string {
        const breadcrumbs = this,
            chart = breadcrumbs.chart,
            breadcrumbsOptions = breadcrumbs.options,
            lang = chart.options.lang,
            textFormat = pick(breadcrumbsOptions.format,
                breadcrumbsOptions.showFullPath ?
                    '{level.name}' : '← {level.name}'),
            defaultText = lang && pick(
                lang.drillUpText,
                lang.mainBreadcrumb
            );
        let returnText = breadcrumbsOptions.formatter &&
            breadcrumbsOptions.formatter(breadcrumb) ||
                format(
                    textFormat,
                    { level: breadcrumb.levelOptions },
                    chart
                ) || '';

        if (
            (
                (
                    isString(returnText) &&
                    !returnText.length
                ) ||
                returnText === '← '
            ) &&
            defined(defaultText)
        ) {
            returnText = !breadcrumbsOptions.showFullPath ?
                '← ' + defaultText :
                defaultText;
        }
        return returnText;
    }

    /**
     * Redraw.
     *
     * @requires  modules/breadcrums
     *
     * @function Highcharts.Breadcrumbs#redraw
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public redraw(): void {
        if (this.isDirty) {
            this.render();
        }

        if (this.group) {
            this.group.align();
        }

        this.isDirty = false;
    }

    /**
     * Create a group, then draw breadcrumbs together with the separators.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#render
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public render(): void {

        const breadcrumbs = this,
            chart = breadcrumbs.chart,
            breadcrumbsOptions = breadcrumbs.options;

        // A main group for the breadcrumbs.
        if (!breadcrumbs.group && breadcrumbsOptions) {
            breadcrumbs.group = chart.renderer
                .g('breadcrumbs-group')
                .addClass('highcharts-no-tooltip highcharts-breadcrumbs')
                .attr({
                    zIndex: breadcrumbsOptions.zIndex
                })
                .add();
        }

        // Draw breadcrumbs.
        if (breadcrumbsOptions.showFullPath) {
            this.renderFullPathButtons();
        } else {
            this.renderSingleButton();
        }

        this.alignBreadcrumbsGroup();
    }

    /**
     * Draw breadcrumbs together with the separators.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#renderFullPathButtons
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public renderFullPathButtons(): void {
        // Make sure that only one type of button is visible.
        this.destroySingleButton();

        this.resetElementListState();

        this.updateListElements();

        this.destroyListElements();
    }

    /**
     * Render Single button - when showFullPath is not used. The button is
     * similar to the old drillUpButton
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#renderSingleButton
     * @param {Highcharts.Breadcrumbs} this Breadcrumbs class.
     */
    public renderSingleButton(): void {
        const breadcrumbs = this,
            chart = breadcrumbs.chart,
            list = breadcrumbs.list,
            breadcrumbsOptions = breadcrumbs.options,
            buttonSpacing = breadcrumbsOptions.buttonSpacing;

        // Make sure that only one type of button is visible.
        this.destroyListElements();

        // Draw breadcrumbs. Inital position for calculating the breadcrumbs
        // group.
        const posX: number = breadcrumbs.group ?
                breadcrumbs.group.getBBox().width :
                buttonSpacing,
            posY: number = buttonSpacing;

        const previousBreadcrumb = list[list.length - 2];

        if (!chart.drillUpButton && (this.level > 0)) {
            chart.drillUpButton = breadcrumbs.renderButton(
                previousBreadcrumb,
                posX,
                posY
            );
        } else if (chart.drillUpButton) {
            if (this.level > 0) {
                // Update button.
                this.updateSingleButton();
            } else {
                this.destroySingleButton();
            }
        }
    }

    /**
     * Update group position based on align and it's width.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#renderSingleButton
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public alignBreadcrumbsGroup(xOffset?: number): void {
        const breadcrumbs = this;
        if (breadcrumbs.group) {
            const breadcrumbsOptions = breadcrumbs.options,
                buttonTheme = breadcrumbsOptions.buttonTheme,
                positionOptions = breadcrumbsOptions.position,
                alignTo = (
                    breadcrumbsOptions.relativeTo === 'chart' ||
                    breadcrumbsOptions.relativeTo === 'spacingBox' ?
                        void 0 :
                        'scrollablePlotBox'
                ),
                bBox = breadcrumbs.group.getBBox(),
                additionalSpace = 2 * (buttonTheme.padding || 0) +
                breadcrumbsOptions.buttonSpacing;

            // Store positionOptions
            positionOptions.width = bBox.width + additionalSpace;
            positionOptions.height = bBox.height + additionalSpace;

            const newPositions = merge(positionOptions);

            // Add x offset if specified.
            if (xOffset) {
                newPositions.x += xOffset;
            }

            if (breadcrumbs.options.rtl) {
                newPositions.x += positionOptions.width;
            }

            newPositions.y = pick(newPositions.y, this.yOffset, 0);

            breadcrumbs.group.align(
                newPositions,
                true,
                alignTo
            );
        }
    }

    /**
     * Render a button.
     *
     * @requires  modules/breadcrums
     *
     * @function Highcharts.Breadcrumbs#renderButton
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     * @param {Highcharts.Breadcrumbs} breadcrumb
     *        Current breadcrumb
     * @param {Highcharts.Breadcrumbs} posX
     *        Initial horizontal position
     * @param {Highcharts.Breadcrumbs} posY
     *        Initial vertical position
     * @return {SVGElement|void}
     *        Returns the SVG button
     */
    public renderButton(
        breadcrumb: BreadcrumbOptions,
        posX: number,
        posY: number
    ): SVGElement {
        const breadcrumbs = this,
            chart = this.chart,
            breadcrumbsOptions = breadcrumbs.options,
            buttonTheme = merge(breadcrumbsOptions.buttonTheme);

        const button: SVGElement = chart.renderer
            .button(
                breadcrumbs.getButtonText(breadcrumb),
                posX,
                posY,
                function (e: (Event|any)): void {
                    // Extract events from button object and call
                    const buttonEvents = breadcrumbsOptions.events &&
                        breadcrumbsOptions.events.click;
                    let callDefaultEvent;

                    if (buttonEvents) {
                        callDefaultEvent = buttonEvents.call(
                            breadcrumbs,
                            e as any,
                            breadcrumb
                        );
                    }

                    // (difference in behaviour of showFullPath and drillUp)
                    if (callDefaultEvent !== false) {
                        // For single button we are not going to the button
                        // level, but the one level up
                        if (!breadcrumbsOptions.showFullPath) {
                            e.newLevel = breadcrumbs.level - 1;
                        } else {
                            e.newLevel = breadcrumb.level;
                        }
                        fireEvent(breadcrumbs, 'up', e);
                    }
                },
                buttonTheme
            )
            .addClass('highcharts-breadcrumbs-button')
            .add(breadcrumbs.group);

        if (!chart.styledMode) {
            button.attr(breadcrumbsOptions.style as SVGAttributes);
        }
        return button;
    }

    /**
     * Render a separator.
     *
     * @requires  modules/breadcrums
     *
     * @function Highcharts.Breadcrumbs#renderSeparator
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     * @param {Highcharts.Breadcrumbs} posX
     *        Initial horizontal position
     * @param {Highcharts.Breadcrumbs} posY
     *        Initial vertical position
     * @return {Highcharts.SVGElement}
     *        Returns the SVG button
     */
    public renderSeparator(
        posX: number,
        posY: number
    ): SVGElement {
        const breadcrumbs = this,
            chart = this.chart,
            breadcrumbsOptions = breadcrumbs.options,
            separatorOptions = breadcrumbsOptions.separator;

        const separator = chart.renderer
            .label(
                separatorOptions.text,
                posX,
                posY,
                void 0,
                void 0,
                void 0,
                false
            )
            .addClass('highcharts-breadcrumbs-separator')
            .add(breadcrumbs.group);

        if (!chart.styledMode) {
            separator.css(separatorOptions.style);
        }

        return separator;
    }

    /**
     * Update.
     * @function Highcharts.Breadcrumbs#update
     *
     * @requires  modules/breadcrumbs
     *
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     * @param {Highcharts.BreadcrumbsOptions} options
     *        Breadcrumbs class.
     * @param {boolean} redraw
     *        Redraw flag
     */
    public update(
        options: DeepPartial<BreadcrumbsOptions>
    ): void {
        merge(true, this.options, options);
        this.destroy();
        this.isDirty = true;
    }

    /**
     * Update button text when the showFullPath set to false.
     * @function Highcharts.Breadcrumbs#updateSingleButton
     *
     * @requires  modules/breadcrumbs
     *
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public updateSingleButton(): void {
        const chart = this.chart,
            currentBreadcrumb = this.list[this.level - 1];

        if (chart.drillUpButton) {
            chart.drillUpButton.attr({
                text: this.getButtonText(currentBreadcrumb)
            });
        }
    }

    /**
     * Destroy the chosen breadcrumbs group
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#destroy
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public destroy(): void {

        this.destroySingleButton();

        // Destroy elements one by one. It's necessary beacause
        // g().destroy() does not remove added HTML
        this.destroyListElements(true);

        // Then, destroy the group itself.
        if (this.group) {
            this.group.destroy();
        }
        this.group = void 0;

    }
    /**
     * Destroy the elements' buttons and separators.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#destroyListElements
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public destroyListElements(
        force?: boolean
    ): void {
        const elementList = this.elementList;

        objectEach(elementList, (element, level): void => {
            if (
                force ||
                !elementList[level].updated
            ) {
                element = elementList[level];
                element.button && element.button.destroy();
                element.separator && element.separator.destroy();
                delete element.button;
                delete element.separator;
                delete elementList[level];
            }
        });

        if (force) {
            this.elementList = {};
        }
    }

    /**
     * Destroy the single button if exists.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#destroySingleButton
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public destroySingleButton(): void {
        if (this.chart.drillUpButton) {
            this.chart.drillUpButton.destroy();
            this.chart.drillUpButton = void 0;
        }
    }
    /**
     * Reset state for all buttons in elementList.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#resetElementListState
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public resetElementListState(): void {
        objectEach(
            this.elementList,
            (element): void => {
                element.updated = false;
            }
        );
    }

    /**
     * Update rendered elements inside the elementList.
     *
     * @requires  modules/breadcrumbs
     *
     * @function Highcharts.Breadcrumbs#updateListElements
     *
     * @param {Highcharts.Breadcrumbs} this
     *        Breadcrumbs class.
     */
    public updateListElements(): void {
        const breadcrumbs = this,
            elementList = breadcrumbs.elementList,
            buttonSpacing = breadcrumbs.options.buttonSpacing,
            posY = buttonSpacing,
            list = breadcrumbs.list,
            rtl = breadcrumbs.options.rtl,
            rtlFactor = rtl ? -1 : 1,
            updateXPosition = function (
                element: SVGElement,
                spacing: number
            ): number {
                return rtlFactor * element.getBBox().width +
                    rtlFactor * spacing;
            },
            adjustToRTL = function (
                element: SVGElement,
                posX: number,
                posY: number
            ): void {
                element.translate(posX - element.getBBox().width, posY);
            };

        // Inital position for calculating the breadcrumbs group.
        let posX = breadcrumbs.group ?
                updateXPosition(breadcrumbs.group, buttonSpacing) :
                buttonSpacing,
            currentBreadcrumb,
            breadcrumb: BreadcrumbOptions;

        for (let i = 0, iEnd = list.length; i < iEnd; ++i) {
            const isLast: boolean = i === iEnd - 1;

            let button: SVGElement|undefined,
                separator: SVGElement | undefined;

            breadcrumb = list[i];

            if (elementList[breadcrumb.level]) {
                currentBreadcrumb = elementList[breadcrumb.level];
                button = currentBreadcrumb.button;

                // Render a separator if it was not created before.
                if (
                    !currentBreadcrumb.separator &&
                    !isLast
                ) {
                    // Add spacing for the next separator
                    posX += rtlFactor * buttonSpacing;
                    currentBreadcrumb.separator =
                        breadcrumbs.renderSeparator(posX, posY);
                    if (rtl) {
                        adjustToRTL(currentBreadcrumb.separator, posX, posY);
                    }
                    posX += updateXPosition(
                        currentBreadcrumb.separator,
                        buttonSpacing
                    );
                } else if (
                    currentBreadcrumb.separator &&
                    isLast
                ) {
                    currentBreadcrumb.separator.destroy();
                    delete currentBreadcrumb.separator;
                }
                elementList[breadcrumb.level].updated = true;
            } else {
                // Render a button.
                button = breadcrumbs.renderButton(breadcrumb, posX, posY);
                if (rtl) {
                    adjustToRTL(button, posX, posY);
                }
                posX += updateXPosition(button, buttonSpacing);

                // Render a separator.
                if (!isLast) {
                    separator = breadcrumbs.renderSeparator(posX, posY);
                    if (rtl) {
                        adjustToRTL(separator, posX, posY);
                    }
                    posX += updateXPosition(separator, buttonSpacing);
                }
                elementList[breadcrumb.level] = {
                    button,
                    separator,
                    updated: true
                };
            }

            if (button) {
                button.setState(isLast ? 2 : 0);
            }
        }
    }
}

/* *
 *
 *  Prototype Properties
 *
 * */

namespace Breadcrumbs {
    export type BreadcrumbElement = {
        button?: SVGElement,
        separator?: SVGElement,
        updated?: boolean
    };
}


/* *
 *
 *  Default Export
 *
 * */

export default Breadcrumbs;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Callback function to react on button clicks.
 *
 * @callback Highcharts.BreadcrumbsClickCallbackFunction
 *
 * @param {Highcharts.Event} event
 * Event.
 *
 * @param {Highcharts.BreadcrumbOptions} options
 * Breadcrumb options.
 *
 * @param {global.Event} e
 * Event arguments.
 */

/**
 * Callback function to format the breadcrumb text from scratch.
 *
 * @callback Highcharts.BreadcrumbsFormatterCallbackFunction
 *
 * @param {Highcharts.Event} event
 * Event.
 *
 * @param {Highcharts.BreadcrumbOptions} options
 * Breadcrumb options.
 *
 * @return {string}
 * Formatted text or false
 */

/**
 * Options for the one breadcrumb.
 *
 * @interface Highcharts.BreadcrumbOptions
 */

/**
 * Level connected to a specific breadcrumb.
 * @name Highcharts.BreadcrumbOptions#level
 * @type {number}
 */

/**
 * Options for series or point connected to a specific breadcrumb.
 * @name Highcharts.BreadcrumbOptions#levelOptions
 * @type {SeriesOptions|PointOptionsObject}
 */

/**
 * Options for aligning breadcrumbs group.
 *
 * @interface Highcharts.BreadcrumbsAlignOptions
 */

/**
 * Align of a Breadcrumb group.
 * @default right
 * @name Highcharts.BreadcrumbsAlignOptions#align
 * @type {AlignValue}
 */

/**
 * Vertical align of a Breadcrumb group.
 * @default top
 * @name Highcharts.BreadcrumbsAlignOptions#verticalAlign
 * @type {VerticalAlignValue}
 */

/**
 * X offset of a Breadcrumbs group.
 * @name Highcharts.BreadcrumbsAlignOptions#x
 * @type {number}
 */

/**
 * Y offset of a Breadcrumbs group.
 * @name Highcharts.BreadcrumbsAlignOptions#y
 * @type {number}
 */

/**
 * Options for all breadcrumbs.
 *
 * @interface Highcharts.BreadcrumbsOptions
 */

/**
 * Button theme.
 * @name Highcharts.BreadcrumbsOptions#buttonTheme
 * @type { SVGAttributes | undefined }
 */

(''); // Keeps doclets above in JS file
