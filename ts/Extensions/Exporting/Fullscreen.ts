/* *
 *
 *  (c) 2009-2021 Rafal Sebestjanski
 *
 *  Full screen for Highcharts
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/**
 * The module allows user to enable display chart in full screen mode.
 * Used in StockTools too.
 * Based on default solutions in browsers.
 */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import AST from '../../Core/Renderer/HTML/AST.js';
import Chart from '../../Core/Chart/Chart.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent, fireEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike' {
    interface ChartLike {
        /** @requires Extensions/Fullscreen */
        fullscreen?: Fullscreen;
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
 * @private
 */
function onChartBeforeRender(
    this: Chart
): void {
    /**
     * @name Highcharts.Chart#fullscreen
     * @type {Highcharts.Fullscreen}
     * @requires modules/full-screen
     */
    this.fullscreen = new Fullscreen(this);
}

/* *
 *
 *  Class
 *
 * */

/**
 * Handles displaying chart's container in the fullscreen mode.
 *
 * **Note**: Fullscreen is not supported on iPhone due to iOS limitations.
 *
 * @class
 * @name Highcharts.Fullscreen
 *
 * @requires modules/exporting
 */
class Fullscreen {

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Prepares the chart class to support fullscreen.
     *
     * @param {typeof_Highcharts.Chart} ChartClass
     * The chart class to decorate with fullscreen support.
     */
    public static compose(
        ChartClass: typeof Chart
    ): void {

        if (pushUnique(composedMembers, ChartClass)) {
            // Initialize fullscreen
            addEvent(ChartClass, 'beforeRender', onChartBeforeRender);
        }

    }

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(chart: Chart) {

        /**
         * Chart managed by the fullscreen controller.
         * @name Highcharts.Fullscreen#chart
         * @type {Highcharts.Chart}
         */
        this.chart = chart;

        /**
         * The flag is set to `true` when the chart is displayed in
         * the fullscreen mode.
         *
         * @name Highcharts.Fullscreen#isOpen
         * @type {boolean|undefined}
         * @since 8.0.1
         */
        this.isOpen = false;

        const container = chart.renderTo;

        // Hold event and methods available only for a current browser.
        if (!this.browserProps) {
            if (typeof container.requestFullscreen === 'function') {
                this.browserProps = {
                    fullscreenChange: 'fullscreenchange',
                    requestFullscreen: 'requestFullscreen',
                    exitFullscreen: 'exitFullscreen'
                };
            } else if (container.mozRequestFullScreen) {
                this.browserProps = {
                    fullscreenChange: 'mozfullscreenchange',
                    requestFullscreen: 'mozRequestFullScreen',
                    exitFullscreen: 'mozCancelFullScreen'
                };
            } else if (container.webkitRequestFullScreen) {
                this.browserProps = {
                    fullscreenChange: 'webkitfullscreenchange',
                    requestFullscreen: 'webkitRequestFullScreen',
                    exitFullscreen: 'webkitExitFullscreen'
                };
            } else if (container.msRequestFullscreen) {
                this.browserProps = {
                    fullscreenChange: 'MSFullscreenChange',
                    requestFullscreen: 'msRequestFullscreen',
                    exitFullscreen: 'msExitFullscreen'
                };
            }
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    /** @private */
    public browserProps?: Fullscreen.BrowserProperties;

    public chart: Chart;

    public isOpen: boolean;

    /** @private */
    public origHeight?: number;

    /** @private */
    public origHeightOption?: (number|string|null);

    /** @private */
    public origWidth?: number;

    /** @private */
    public origWidthOption?: (number|null);

    /** @private */
    public unbindFullscreenEvent?: Function;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Stops displaying the chart in fullscreen mode.
     * Exporting module required.
     *
     * @since       8.0.1
     *
     * @function    Highcharts.Fullscreen#close
     * @return      {void}
     * @requires    modules/full-screen
     */
    public close(): void {
        const fullscreen = this,
            chart = fullscreen.chart,
            optionsChart = chart.options.chart;

        fireEvent(chart, 'fullscreenClose', null as any, function (): void {

            // Don't fire exitFullscreen() when user exited
            // using 'Escape' button.
            if (
                fullscreen.isOpen &&
                fullscreen.browserProps &&
                chart.container.ownerDocument instanceof Document
            ) {
                chart.container.ownerDocument[
                    fullscreen.browserProps.exitFullscreen
                ]();
            }

            // Unbind event as it's necessary only before exiting
            // from fullscreen.
            if (fullscreen.unbindFullscreenEvent) {
                fullscreen.unbindFullscreenEvent = fullscreen
                    .unbindFullscreenEvent();
            }

            chart.setSize(fullscreen.origWidth, fullscreen.origHeight, false);
            fullscreen.origWidth = void 0;
            fullscreen.origHeight = void 0;

            optionsChart.width = fullscreen.origWidthOption;
            optionsChart.height = fullscreen.origHeightOption;

            fullscreen.origWidthOption = void 0;
            fullscreen.origHeightOption = void 0;

            fullscreen.isOpen = false;

            fullscreen.setButtonText();

        });
    }

    /**
     * Displays the chart in fullscreen mode.
     * When fired customly by user before exporting context button is created,
     * button's text will not be replaced - it's on the user side.
     * Exporting module required.
     *
     * @since       8.0.1
     *
     * @function Highcharts.Fullscreen#open
     * @return      {void}
     * @requires    modules/full-screen
     */
    public open(): void {
        const fullscreen = this,
            chart = fullscreen.chart,
            optionsChart = chart.options.chart;

        fireEvent(chart, 'fullscreenOpen', null as any, function (): void {

            if (optionsChart) {
                fullscreen.origWidthOption = optionsChart.width;
                fullscreen.origHeightOption = optionsChart.height;
            }
            fullscreen.origWidth = chart.chartWidth;
            fullscreen.origHeight = chart.chartHeight;

            // Handle exitFullscreen() method when user clicks 'Escape' button.
            if (fullscreen.browserProps) {
                const unbindChange = addEvent(
                    chart.container.ownerDocument, // chart's document
                    fullscreen.browserProps.fullscreenChange,
                    function (): void {
                        // Handle lack of async of browser's
                        // fullScreenChange event.
                        if (fullscreen.isOpen) {
                            fullscreen.isOpen = false;
                            fullscreen.close();
                        } else {
                            chart.setSize(null, null, false);
                            fullscreen.isOpen = true;
                            fullscreen.setButtonText();
                        }
                    }
                );

                const unbindDestroy = addEvent(chart, 'destroy', unbindChange);

                fullscreen.unbindFullscreenEvent = (): void => {
                    unbindChange();
                    unbindDestroy();
                };

                const promise = chart.renderTo[
                    fullscreen.browserProps.requestFullscreen
                ]();

                if (promise) {
                    promise['catch'](function (): void { // eslint-disable-line dot-notation
                        alert( // eslint-disable-line no-alert
                            'Full screen is not supported inside a frame.'
                        );
                    });
                }
            }

        });
    }

    /**
     * Replaces the exporting context button's text when toogling the
     * fullscreen mode.
     *
     * @private
     *
     * @since 8.0.1
     *
     * @requires modules/full-screen
     */
    private setButtonText(): void {
        const chart = this.chart,
            exportDivElements = chart.exportDivElements,
            exportingOptions = chart.options.exporting,
            menuItems = (
                exportingOptions &&
                exportingOptions.buttons &&
                exportingOptions.buttons.contextButton.menuItems
            ),
            lang = chart.options.lang;

        if (
            exportingOptions &&
            exportingOptions.menuItemDefinitions &&
            lang &&
            lang.exitFullscreen &&
            lang.viewFullscreen &&
            menuItems &&
            exportDivElements
        ) {
            const exportDivElement = exportDivElements[
                menuItems.indexOf('viewFullscreen')
            ];
            if (exportDivElement) {
                AST.setElementHTML(
                    exportDivElement,
                    !this.isOpen ?
                        (
                            exportingOptions.menuItemDefinitions.viewFullscreen
                                .text ||
                            lang.viewFullscreen
                        ) : lang.exitFullscreen
                );
            }
        }
    }

    /**
     * Toggles displaying the chart in fullscreen mode.
     * By default, when the exporting module is enabled, a context button with
     * a drop down menu in the upper right corner accesses this function.
     * Exporting module required.
     *
     * @since 8.0.1
     *
     * @sample      highcharts/members/chart-togglefullscreen/
     *              Toggle fullscreen mode from a HTML button
     *
     * @function Highcharts.Fullscreen#toggle
     * @requires    modules/full-screen
     */
    public toggle(): void {
        const fullscreen = this;

        if (!fullscreen.isOpen) {
            fullscreen.open();
        } else {
            fullscreen.close();
        }
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace Fullscreen {

    /* *
     *
     *  Declarations
     *
     * */

    export interface BrowserProperties {
        fullscreenChange: (
            'fullscreenchange'|
            'mozfullscreenchange'|
            'webkitfullscreenchange'|
            'MSFullscreenChange'
        );
        requestFullscreen: (
            'msRequestFullscreen'|
            'mozRequestFullScreen'|
            'requestFullscreen'|
            'webkitRequestFullScreen'
        );
        exitFullscreen: (
            'exitFullscreen'|
            'mozCancelFullScreen'|
            'webkitExitFullscreen'|
            'msExitFullscreen'
        );
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default Fullscreen;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Gets fired when closing the fullscreen
 *
 * @callback Highcharts.FullScreenfullscreenCloseCallbackFunction
 *
 * @param {Highcharts.Chart} chart
 *        The chart on which the event occured.
 *
 * @param {global.Event} event
 *        The event that occured.
 */

/**
 * Gets fired when opening the fullscreen
 *
 * @callback Highcharts.FullScreenfullscreenOpenCallbackFunction
 *
 * @param {Highcharts.Chart} chart
 *        The chart on which the event occured.
 *
 * @param {global.Event} event
 *        The event that occured.
 */

(''); // keeps doclets above separated from following code

/* *
 *
 *  API Options
 *
 * */

/**
 * Fires when a fullscreen is closed through the context menu item,
 * or a fullscreen is closed on the `Escape` button click,
 * or the `Chart.fullscreen.close` method.
 *
 * @sample highcharts/chart/events-fullscreen
 *         Title size change on fullscreen open
 *
 * @type      {Highcharts.FullScreenfullscreenCloseCallbackFunction}
 * @since     10.1.0
 * @context   Highcharts.Chart
 * @requires  modules/full-screen
 * @apioption chart.events.fullscreenClose
 */

/**
 * Fires when a fullscreen is opened through the context menu item,
 * or the `Chart.fullscreen.open` method.
 *
 * @sample highcharts/chart/events-fullscreen
 *         Title size change on fullscreen open
 *
 * @type      {Highcharts.FullScreenfullscreenOpenCallbackFunction}
 * @since     10.1.0
 * @context   Highcharts.Chart
 * @requires  modules/full-screen
 * @apioption chart.events.fullscreenOpen
 */

(''); // keeps doclets above in transpiled file
