/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  Accessibility component for the navigator.
 *
 *  Author: Øystein Moseng
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
import AccessibilityComponent from '../AccessibilityComponent.js';
import Announcer from '../Utils/Announcer.js';
import KeyboardNavigationHandler from '../KeyboardNavigationHandler.js';
import Navigator from '../../Stock/Navigator/Navigator.js';
import A from '../../Core/Animation/AnimationUtilities.js';
const {
    animObject
} = A;
import T from '../../Core/Templating.js';
const {
    format
} = T;
import U from '../../Core/Utilities.js';
const {
    clamp,
    pick,
    syncTimeout
} = U;
import HU from '../Utils/HTMLUtilities.js';
const {
    getFakeMouseEvent
} = HU;
import CU from '../Utils/ChartUtilities.js';
const {
    getAxisRangeDescription,
    fireEventOnWrappedOrUnwrappedElement
} = CU;

import type SVGElement from '../../Core/Renderer/SVG/SVGElement';


/**
 * The NavigatorComponent class
 *
 * @private
 * @class
 * @name Highcharts.NavigatorComponent
 */
class NavigatorComponent extends AccessibilityComponent {
    private announcer!: Announcer;
    private minHandleProxy?: HTMLInputElement;
    private maxHandleProxy?: HTMLInputElement;
    private updateNavigatorThrottleTimer?: number;


    /**
     * Init the component
     * @private
     */
    public init(): void {
        const chart = this.chart,
            component = this;
        this.announcer = new Announcer(chart, 'polite');

        // Update positions after render
        this.addEvent(Navigator, 'afterRender', function (): void {
            if (
                this.chart === component.chart &&
                this.chart.renderer
            ) {
                syncTimeout((): void => {
                    component.proxyProvider
                        .updateGroupProxyElementPositions('navigator');
                    component.updateHandleValues();
                }, animObject(
                    pick(this.chart.renderer.globalAnimation, true)
                ).duration);
            }
        });
    }


    /**
     * Called on updates
     * @private
     */
    public onChartUpdate(): void {
        const chart = this.chart,
            options = chart.options,
            navigator = options.navigator;

        if (navigator.enabled && navigator.accessibility?.enabled) {
            const verbosity = options.accessibility.landmarkVerbosity,
                groupFormatStr = options.lang
                    .accessibility?.navigator.groupLabel;

            // We just recreate the group for simplicity. Could consider
            // updating the existing group if the verbosity has not changed.
            this.proxyProvider.removeGroup('navigator');
            this.proxyProvider.addGroup('navigator', 'div', {
                role: verbosity === 'all' ? 'region' : 'group',
                'aria-label': format(groupFormatStr, { chart }, chart)
            });

            const handleFormatStr = options.lang
                .accessibility?.navigator.handleLabel;
            [0, 1].forEach((n): void => {
                const handle = this.getHandleByIx(n);
                if (handle) {
                    const proxyEl = this.proxyProvider.addProxyElement(
                        'navigator', {
                            click: handle
                        }, 'input', {
                            type: 'range',
                            'aria-label': format(
                                handleFormatStr,
                                { handleIx: n, chart }, chart
                            )
                        }
                    );

                    this[n ? 'maxHandleProxy' : 'minHandleProxy'] =
                        proxyEl.innerElement as HTMLInputElement;
                    proxyEl.innerElement.style.pointerEvents = 'none';
                    proxyEl.innerElement.oninput =
                        (): void => this.updateNavigator();
                }
            });
            this.updateHandleValues();
        } else {
            this.proxyProvider.removeGroup('navigator');
        }
    }


    /**
     * Get navigation for a navigator handle.
     * @private
     * @return {Highcharts.KeyboardNavigationHandler} The module object.
     */
    public getNavigatorHandleNavigation(
        handleIx: number
    ): KeyboardNavigationHandler {
        const component = this,
            chart = this.chart,
            proxyEl = handleIx ? this.maxHandleProxy : this.minHandleProxy,
            keys = this.keyCodes;

        return new KeyboardNavigationHandler(chart, {
            keyCodeMap: [[
                [keys.left, keys.right, keys.up, keys.down],
                function (
                    this: KeyboardNavigationHandler,
                    keyCode: number
                ): number {
                    if (proxyEl) {
                        const delta = keyCode === keys.left ||
                                keyCode === keys.up ? -1 : 1;
                        proxyEl.value = '' + clamp(
                            parseFloat(proxyEl.value) + delta, 0, 100
                        );
                        component.updateNavigator((): void => {
                            const handle = component.getHandleByIx(handleIx);
                            if (handle) {
                                chart.setFocusToElement(handle, proxyEl);
                            }
                        });
                    }
                    return this.response.success;
                }
            ]],

            init: (): void => {
                chart.setFocusToElement(
                    this.getHandleByIx(handleIx) as SVGElement, proxyEl
                );
            },

            validate: (): boolean => !!(
                this.getHandleByIx(handleIx) && proxyEl &&
                chart.options.navigator.accessibility?.enabled)
        });
    }


    /**
     * Get keyboard navigation handlers for this component.
     * @return {Array<Highcharts.KeyboardNavigationHandler>}
     *         List of module objects.
     */
    public getKeyboardNavigation(): Array<KeyboardNavigationHandler> {
        return [
            this.getNavigatorHandleNavigation(0),
            this.getNavigatorHandleNavigation(1)
        ];
    }


    /**
     * Remove component traces
     */
    public destroy(): void {
        if (this.updateNavigatorThrottleTimer) {
            clearTimeout(this.updateNavigatorThrottleTimer);
        }
        this.proxyProvider.removeGroup('navigator');
        if (this.announcer) {
            this.announcer.destroy();
        }
    }


    /**
     * Update the value of the handles to match current navigator pos.
     * @private
     */
    private updateHandleValues(): void {
        const navigator = this.chart.navigator;
        if (navigator && this.minHandleProxy && this.maxHandleProxy) {
            const length = navigator.size;
            this.minHandleProxy.value =
                '' + Math.round(navigator.zoomedMin / length * 100);
            this.maxHandleProxy.value =
                '' + Math.round(navigator.zoomedMax / length * 100);
        }
    }


    /**
     * Get a navigator handle by its index
     * @private
     */
    private getHandleByIx(ix: number): SVGElement|undefined {
        const navigator = this.chart.navigator;
        return navigator && navigator.handles &&
            navigator.handles[ix];
    }


    /**
     * Update navigator to match changed proxy values.
     * @private
     */
    private updateNavigator(beforeAnnounce?: () => void): void {
        const performUpdate = (beforeAnnounce?: () => void): void => {
            const chart = this.chart,
                { navigator, pointer } = chart,
                keyboardNavigation =
                    this.chart.accessibility?.keyboardNavigation;
            if (
                navigator &&
                pointer &&
                this.minHandleProxy &&
                this.maxHandleProxy
            ) {
                const chartPos = pointer.getChartPosition(),
                    minNewX = parseFloat(this.minHandleProxy.value) /
                        100 * navigator.size,
                    maxNewX = parseFloat(this.maxHandleProxy.value) /
                        100 * navigator.size;

                // Fire fake events in order for each handle.
                ([
                    [0, 'mousedown', navigator.zoomedMin],
                    [0, 'mousemove', minNewX],
                    [0, 'mouseup', minNewX],
                    [1, 'mousedown', navigator.zoomedMax],
                    [1, 'mousemove', maxNewX],
                    [1, 'mouseup', maxNewX]
                ] as [number, string, number][]).forEach(
                    ([handleIx, type, x]): void => {
                        const handle = this.getHandleByIx(handleIx)?.element;
                        if (handle) {
                            fireEventOnWrappedOrUnwrappedElement(
                                handle,
                                getFakeMouseEvent(type, {
                                    x: chartPos.left + navigator.left + x,
                                    y: chartPos.top + navigator.top
                                }, handle)
                            );
                        }
                    });

                // If navigating by keyboard, do not reset #22122
                if (keyboardNavigation) {
                    keyboardNavigation.keyboardReset = false;
                }

                if (beforeAnnounce) {
                    beforeAnnounce();
                }

                // Announce the update
                const announceFormatStr = chart.options.lang
                        .accessibility?.navigator.changeAnnouncement,
                    axisRangeDescription = getAxisRangeDescription(
                        chart.xAxis[0]
                    );
                this.announcer.announce(format(
                    announceFormatStr,
                    { axisRangeDescription, chart },
                    chart
                ));
            }
        };

        // Throttle updates so as not to reduce performance with
        // continuous keypress.
        if (this.updateNavigatorThrottleTimer) {
            clearTimeout(this.updateNavigatorThrottleTimer);
        }
        this.updateNavigatorThrottleTimer = setTimeout(
            performUpdate.bind(this, beforeAnnounce), 20
        );
    }
}


/* *
 *
 *  Export Default
 *
 * */

export default NavigatorComponent;
