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

import type Axis from '../../Core/Axis/Axis';
import type Chart from '../../Core/Chart/Chart';
import type PointerEvent from '../../Core/PointerEvent';
import type ScrollbarOptions from './ScrollbarOptions';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer';

import D from '../../Core/Defaults.js';
const { defaultOptions } = D;
import H from '../../Core/Globals.js';
import ScrollbarAxis from '../../Core/Axis/ScrollbarAxis.js';
import ScrollbarDefaults from './ScrollbarDefaults.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { defined, destroyObjectProperties, merge } = OH;
const { addEvent, fireEvent, removeEvent } = EH;
const {
    correctFloat,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        scrollbarsOffsets?: [number, number];
    }
}

/* *
 *
 *  Constants
 *
 * */

/* eslint-disable no-invalid-this, valid-jsdoc */

/**
 * A reusable scrollbar, internally used in Highcharts Stock's
 * navigator and optionally on individual axes.
 *
 * @private
 * @class
 * @name Highcharts.Scrollbar
 * @param {Highcharts.SVGRenderer} renderer
 * @param {Highcharts.ScrollbarOptions} options
 * @param {Highcharts.Chart} chart
 */
class Scrollbar {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions = ScrollbarDefaults;

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(AxisClass: typeof Axis): void {
        ScrollbarAxis.compose(AxisClass, Scrollbar);
    }

    /**
     * When we have vertical scrollbar, rifles and arrow in buttons should be
     * rotated. The same method is used in Navigator's handles, to rotate them.
     *
     * @function Highcharts.swapXY
     *
     * @param {Highcharts.SVGPathArray} path
     * Path to be rotated.
     *
     * @param {boolean} [vertical]
     * If vertical scrollbar, swap x-y values.
     *
     * @return {Highcharts.SVGPathArray}
     * Rotated path.
     *
     * @requires modules/stock
     */
    public static swapXY(
        path: SVGPath,
        vertical?: boolean
    ): SVGPath {
        if (vertical) {
            path.forEach((seg): void => {
                const len = seg.length;
                let temp;
                for (let i = 0; i < len; i += 2) {
                    temp = seg[i + 1];
                    if (typeof temp === 'number') {
                        seg[i + 1] = seg[i + 2];
                        seg[i + 2] = temp;
                    }
                }
            });
        }

        return path;
    }

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        renderer: SVGRenderer,
        options: DeepPartial<ScrollbarOptions>,
        chart: Chart
    ) {
        this.init(renderer, options, chart);
    }

    /* *
     *
     *  Properties
     *
     * */

    public _events: Array<[
        any,
        string,
        Scrollbar.EventCallback
    ]> = [];

    public barWidth?: number;

    public calculatedWidth?: number;

    public chart: Chart = void 0 as any;

    private chartX: number = 0;

    private chartY: number = 0;

    public from: number = 0;

    private grabbedCenter?: boolean;

    public group: SVGElement = void 0 as any;

    public hasDragged?: boolean;

    public height?: number;

    private initPositions?: Array<number>;

    public options: ScrollbarOptions = void 0 as any;

    public rendered?: boolean;

    public renderer: SVGRenderer = void 0 as any;

    public scrollbar: SVGElement = void 0 as any;

    public scrollbarButtons: Array<SVGElement> = [];

    public scrollbarGroup: SVGElement = void 0 as any;

    public scrollbarLeft: number = 0;

    public scrollbarRifles: SVGElement = void 0 as any;

    public scrollbarStrokeWidth: number = 1;

    public scrollbarTop: number = 0;

    public size: number = 0;

    public to: number = 0;

    public track: SVGElement = void 0 as any;

    public trackBorderWidth: number = 1;

    public userOptions: DeepPartial<ScrollbarOptions> = void 0 as any;

    public width?: number;

    public x: number = 0;

    public xOffset?: number;

    public y: number = 0;

    public yOffset?: number;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Set up the mouse and touch events for the Scrollbar
     *
     * @private
     * @function Highcharts.Scrollbar#addEvents
     */
    public addEvents(): void {
        const buttonsOrder = this.options.inverted ? [1, 0] : [0, 1],
            buttons = this.scrollbarButtons,
            bar = this.scrollbarGroup.element,
            track = this.track.element,
            mouseDownHandler = this.mouseDownHandler.bind(this),
            mouseMoveHandler = this.mouseMoveHandler.bind(this),
            mouseUpHandler = this.mouseUpHandler.bind(this);

        // Mouse events
        const _events: Array<[
            any,
            string,
            (e: PointerEvent) => void
        ]> = [
            [
                buttons[buttonsOrder[0]].element,
                'click',
                this.buttonToMinClick.bind(this)
            ],
            [
                buttons[buttonsOrder[1]].element,
                'click',
                this.buttonToMaxClick.bind(this)
            ],
            [track, 'click', this.trackClick.bind(this)],
            [bar, 'mousedown', mouseDownHandler],
            [bar.ownerDocument, 'mousemove', mouseMoveHandler],
            [bar.ownerDocument, 'mouseup', mouseUpHandler]
        ];

        // Touch events
        if (H.hasTouch) {
            _events.push(
                [bar, 'touchstart', mouseDownHandler],
                [bar.ownerDocument, 'touchmove', mouseMoveHandler],
                [bar.ownerDocument, 'touchend', mouseUpHandler]
            );
        }

        // Add them all
        _events.forEach(function (args): void {
            addEvent.apply(null, args);
        });
        this._events = _events;
    }

    private buttonToMaxClick(e: PointerEvent): void {
        const scroller = this;
        const range = (
            (scroller.to - scroller.from) *
            pick(scroller.options.step, 0.2)
        );

        scroller.updatePosition(scroller.from + range, scroller.to + range);
        fireEvent(scroller, 'changed', {
            from: scroller.from,
            to: scroller.to,
            trigger: 'scrollbar',
            DOMEvent: e
        } as Scrollbar.ChangedEvent);
    }

    private buttonToMinClick(e: PointerEvent): void {
        const scroller = this;
        const range = correctFloat(scroller.to - scroller.from) *
            pick(scroller.options.step, 0.2);

        scroller.updatePosition(
            correctFloat(scroller.from - range),
            correctFloat(scroller.to - range)
        );
        fireEvent(scroller, 'changed', {
            from: scroller.from,
            to: scroller.to,
            trigger: 'scrollbar',
            DOMEvent: e
        });
    }

    /**
     * Get normalized (0-1) cursor position over the scrollbar
     *
     * @private
     * @function Highcharts.Scrollbar#cursorToScrollbarPosition
     *
     * @param  {*} normalizedEvent
     *         normalized event, with chartX and chartY values
     *
     * @return {Highcharts.Dictionary<number>}
     *         Local position {chartX, chartY}
     */
    public cursorToScrollbarPosition(normalizedEvent: PointerEvent): Record<string, number> {
        const scroller = this,
            options = scroller.options,
            minWidthDifference =
                (options.minWidth as any) > (scroller.calculatedWidth as any) ?
                    options.minWidth :
                    0; // minWidth distorts translation

        return {
            chartX:
                (normalizedEvent.chartX - (scroller.x as any) -
                (scroller.xOffset as any)) /
                ((scroller.barWidth as any) - (minWidthDifference as any)),
            chartY:
                (normalizedEvent.chartY - (scroller.y as any) -
                (scroller.yOffset as any)) /
                ((scroller.barWidth as any) - (minWidthDifference as any))
        };
    }

    /**
     * Destroys allocated elements.
     *
     * @private
     * @function Highcharts.Scrollbar#destroy
     */
    public destroy(): void {

        const scroller: AnyRecord = this,
            navigator = scroller.chart.scroller;

        // Disconnect events added in addEvents
        scroller.removeEvents();

        // Destroy properties
        [
            'track',
            'scrollbarRifles',
            'scrollbar',
            'scrollbarGroup',
            'group'
        ].forEach(
            function (prop): void {
                if (scroller[prop] && scroller[prop].destroy) {
                    scroller[prop] = scroller[prop].destroy();
                }
            }
        );

        // #6421, chart may have more scrollbars
        if (navigator && scroller === navigator.scrollbar) {
            navigator.scrollbar = null;

            // Destroy elements in collection
            destroyObjectProperties(navigator.scrollbarButtons);
        }
    }

    /**
     * Draw the scrollbar buttons with arrows
     *
     * @private
     * @function Highcharts.Scrollbar#drawScrollbarButton
     * @param {number} index
     *        0 is left, 1 is right
     */
    public drawScrollbarButton(index: number): void {
        const scroller = this,
            renderer = scroller.renderer,
            scrollbarButtons = scroller.scrollbarButtons,
            options = scroller.options,
            size = scroller.size,
            group = renderer.g().add(scroller.group);

        scrollbarButtons.push(group);

        if (options.buttonsEnabled) {

            // Create a rectangle for the scrollbar button
            const rect = renderer.rect()
                .addClass('highcharts-scrollbar-button')
                .add(group);

            // Presentational attributes
            if (!scroller.chart.styledMode) {
                rect.attr({
                    stroke: options.buttonBorderColor,
                    'stroke-width': options.buttonBorderWidth,
                    fill: options.buttonBackgroundColor
                });
            }

            // Place the rectangle based on the rendered stroke width
            rect.attr(rect.crisp({
                x: -0.5,
                y: -0.5,
                // +1 to compensate for crispifying in rect method
                width: size + 1,
                height: size + 1,
                r: options.buttonBorderRadius
            } as any, rect.strokeWidth()));

            // Button arrow
            const arrow = renderer
                .path(Scrollbar.swapXY([[
                    'M',
                    size / 2 + (index ? -1 : 1),
                    size / 2 - 3
                ], [
                    'L',
                    size / 2 + (index ? -1 : 1),
                    size / 2 + 3
                ], [
                    'L',
                    size / 2 + (index ? 2 : -2),
                    size / 2
                ]], options.vertical))
                .addClass('highcharts-scrollbar-arrow')
                .add(scrollbarButtons[index]);

            if (!scroller.chart.styledMode) {
                arrow.attr({
                    fill: options.buttonArrowColor
                });
            }
        }
    }

    /**
     * @private
     * @function Highcharts.Scrollbar#init
     * @param {Highcharts.SVGRenderer} renderer
     * @param {Highcharts.ScrollbarOptions} options
     * @param {Highcharts.Chart} chart
     */
    public init(
        renderer: SVGRenderer,
        options: DeepPartial<ScrollbarOptions>,
        chart: Chart
    ): void {
        const scroller = this;

        scroller.scrollbarButtons = [];

        scroller.renderer = renderer;

        scroller.userOptions = options;
        scroller.options = merge(
            ScrollbarDefaults,
            defaultOptions.scrollbar,
            options
        );
        scroller.options.margin = pick(scroller.options.margin, 10);

        scroller.chart = chart;

        // backward compatibility
        scroller.size = pick(
            scroller.options.size,
            scroller.options.height as any
        );

        // Init
        if (options.enabled) {
            scroller.render();
            scroller.addEvents();
        }
    }

    private mouseDownHandler(e: PointerEvent): void {
        const scroller = this,
            normalizedEvent = scroller.chart.pointer.normalize(e),
            mousePosition = scroller.cursorToScrollbarPosition(
                normalizedEvent
            );

        scroller.chartX = mousePosition.chartX;
        scroller.chartY = mousePosition.chartY;
        scroller.initPositions = [scroller.from, scroller.to];

        scroller.grabbedCenter = true;
    }

    /**
     * Event handler for the mouse move event.
     * @private
     */
    private mouseMoveHandler(e: PointerEvent): void {
        const scroller = this,
            normalizedEvent = scroller.chart.pointer.normalize(e),
            options = scroller.options,
            direction: ('chartY'|'chartX') = options.vertical ?
                'chartY' : 'chartX',
            initPositions = scroller.initPositions || [];

        let scrollPosition,
            chartPosition,
            change;

        // In iOS, a mousemove event with e.pageX === 0 is fired when
        // holding the finger down in the center of the scrollbar. This
        // should be ignored.
        if (
            scroller.grabbedCenter &&
            // #4696, scrollbar failed on Android
            (!(e as any).touches || (e as any).touches[0][direction] !== 0)
        ) {
            chartPosition = scroller.cursorToScrollbarPosition(
                normalizedEvent
            )[direction];
            scrollPosition = scroller[direction];

            change = chartPosition - scrollPosition;

            scroller.hasDragged = true;
            scroller.updatePosition(
                initPositions[0] + change,
                initPositions[1] + change
            );

            if (scroller.hasDragged) {
                fireEvent(scroller, 'changed', {
                    from: scroller.from,
                    to: scroller.to,
                    trigger: 'scrollbar',
                    DOMType: e.type,
                    DOMEvent: e
                });
            }
        }
    }

    /**
     * Event handler for the mouse up event.
     * @private
     */
    private mouseUpHandler(e: PointerEvent): void {
        const scroller = this;
        if (scroller.hasDragged) {
            fireEvent(scroller, 'changed', {
                from: scroller.from,
                to: scroller.to,
                trigger: 'scrollbar',
                DOMType: e.type,
                DOMEvent: e
            });
        }
        scroller.grabbedCenter =
            scroller.hasDragged =
            scroller.chartX =
            scroller.chartY = null as any;
    }

    /**
     * Position the scrollbar, method called from a parent with defined
     * dimensions.
     *
     * @private
     * @function Highcharts.Scrollbar#position
     * @param {number} x
     *        x-position on the chart
     * @param {number} y
     *        y-position on the chart
     * @param {number} width
     *        width of the scrollbar
     * @param {number} height
     *        height of the scorllbar
     */
    public position(x: number, y: number, width: number, height: number): void {
        const scroller = this,
            options = scroller.options,
            { buttonsEnabled, margin = 0, vertical } = options,
            method = scroller.rendered ? 'animate' : 'attr';

        let xOffset = height,
            yOffset = 0;

        // Make the scrollbar visible when it is repositioned, #15763.
        scroller.group.show();
        scroller.x = x;
        scroller.y = y + this.trackBorderWidth;
        scroller.width = width; // width with buttons
        scroller.height = height;
        scroller.xOffset = xOffset;
        scroller.yOffset = yOffset;

        // If Scrollbar is a vertical type, swap options:
        if (vertical) {
            scroller.width = scroller.yOffset = width = yOffset = scroller.size;
            scroller.xOffset = xOffset = 0;
            scroller.yOffset = yOffset = buttonsEnabled ? scroller.size : 0;
            // width without buttons
            scroller.barWidth = height - (buttonsEnabled ? width * 2 : 0);
            scroller.x = x = x + margin;
        } else {
            scroller.height = height = scroller.size;
            scroller.xOffset = xOffset = buttonsEnabled ? scroller.size : 0;
            // width without buttons
            scroller.barWidth = width - (buttonsEnabled ? height * 2 : 0);
            scroller.y = scroller.y + margin;
        }

        // Set general position for a group:
        scroller.group[method]({
            translateX: x,
            translateY: scroller.y
        });

        // Resize background/track:
        scroller.track[method]({
            width: width,
            height: height
        });

        // Move right/bottom button to its place:
        scroller.scrollbarButtons[1][method]({
            translateX: vertical ? 0 : width - xOffset,
            translateY: vertical ? height - yOffset : 0
        });
    }

    /**
     * Removes the event handlers attached previously with addEvents.
     *
     * @private
     * @function Highcharts.Scrollbar#removeEvents
     */
    public removeEvents(): void {
        this._events.forEach(function (args): void {
            removeEvent.apply(null, args);
        });
        this._events.length = 0;
    }

    /**
     * Render scrollbar with all required items.
     *
     * @private
     * @function Highcharts.Scrollbar#render
     */
    public render(): void {
        const scroller = this,
            renderer = scroller.renderer,
            options = scroller.options,
            size = scroller.size,
            styledMode = scroller.chart.styledMode,
            group = renderer.g('scrollbar')
                .attr({
                    zIndex: options.zIndex
                })
                .hide() // initially hide the scrollbar #15863
                .add();

        // Draw the scrollbar group
        scroller.group = group;

        // Draw the scrollbar track:
        scroller.track = renderer.rect()
            .addClass('highcharts-scrollbar-track')
            .attr({
                r: options.trackBorderRadius || 0,
                height: size,
                width: size
            }).add(group);

        if (!styledMode) {
            scroller.track.attr({
                fill: options.trackBackgroundColor,
                stroke: options.trackBorderColor,
                'stroke-width': options.trackBorderWidth
            });
        }

        const trackBorderWidth = scroller.trackBorderWidth =
            scroller.track.strokeWidth();
        scroller.track.attr({
            x: -trackBorderWidth % 2 / 2,
            y: -trackBorderWidth % 2 / 2
        });


        // Draw the scrollbar itself
        scroller.scrollbarGroup = renderer.g().add(group);

        scroller.scrollbar = renderer.rect()
            .addClass('highcharts-scrollbar-thumb')
            .attr({
                height: size - trackBorderWidth,
                width: size - trackBorderWidth,
                r: options.barBorderRadius || 0
            }).add(scroller.scrollbarGroup);

        scroller.scrollbarRifles = renderer
            .path(Scrollbar.swapXY([
                ['M', -3, size / 4],
                ['L', -3, 2 * size / 3],
                ['M', 0, size / 4],
                ['L', 0, 2 * size / 3],
                ['M', 3, size / 4],
                ['L', 3, 2 * size / 3]
            ], options.vertical))
            .addClass('highcharts-scrollbar-rifles')
            .add(scroller.scrollbarGroup);

        if (!styledMode) {
            scroller.scrollbar.attr({
                fill: options.barBackgroundColor,
                stroke: options.barBorderColor,
                'stroke-width': options.barBorderWidth
            });
            scroller.scrollbarRifles.attr({
                stroke: options.rifleColor,
                'stroke-width': 1
            });
        }

        scroller.scrollbarStrokeWidth = scroller.scrollbar.strokeWidth();
        scroller.scrollbarGroup.translate(
            -scroller.scrollbarStrokeWidth % 2 / 2,
            -scroller.scrollbarStrokeWidth % 2 / 2
        );

        // Draw the buttons:
        scroller.drawScrollbarButton(0);
        scroller.drawScrollbarButton(1);
    }

    /**
     * Set scrollbar size, with a given scale.
     *
     * @private
     * @function Highcharts.Scrollbar#setRange
     * @param {number} from
     *        scale (0-1) where bar should start
     * @param {number} to
     *        scale (0-1) where bar should end
     */
    public setRange(from: number, to: number): void {
        const scroller = this,
            options = scroller.options,
            vertical = options.vertical,
            minWidth = options.minWidth,
            fullWidth = scroller.barWidth,
            method = (
                this.rendered &&
                !this.hasDragged &&
                !(this.chart.navigator && this.chart.navigator.hasDragged)
            ) ? 'animate' : 'attr';

        if (!defined(fullWidth)) {
            return;
        }

        const toPX = (fullWidth as any) * Math.min(to, 1);

        let fromPX,
            newSize: number;

        from = Math.max(from, 0);
        fromPX = Math.ceil((fullWidth as any) * from);
        scroller.calculatedWidth = newSize = correctFloat(toPX - fromPX);

        // We need to recalculate position, if minWidth is used
        if (newSize < (minWidth as any)) {
            fromPX = ((fullWidth as any) - (minWidth as any) + newSize) * from;
            newSize = minWidth as any;
        }
        const newPos = Math.floor(
            fromPX + (scroller.xOffset as any) + (scroller.yOffset as any)
        );
        const newRiflesPos = newSize / 2 - 0.5; // -0.5 -> rifle line width / 2

        // Store current position:
        scroller.from = from;
        scroller.to = to;

        if (!vertical) {
            scroller.scrollbarGroup[method]({
                translateX: newPos
            });
            scroller.scrollbar[method]({
                width: newSize
            });
            scroller.scrollbarRifles[method]({
                translateX: newRiflesPos
            });
            scroller.scrollbarLeft = newPos;
            scroller.scrollbarTop = 0;
        } else {
            scroller.scrollbarGroup[method]({
                translateY: newPos
            });
            scroller.scrollbar[method]({
                height: newSize
            });
            scroller.scrollbarRifles[method]({
                translateY: newRiflesPos
            });
            scroller.scrollbarTop = newPos;
            scroller.scrollbarLeft = 0;
        }

        if (newSize <= 12) {
            scroller.scrollbarRifles.hide();
        } else {
            scroller.scrollbarRifles.show();
        }

        // Show or hide the scrollbar based on the showFull setting
        if (options.showFull === false) {
            if (from <= 0 && to >= 1) {
                scroller.group.hide();
            } else {
                scroller.group.show();
            }
        }

        scroller.rendered = true;
    }

    /**
     * Checks if the extremes should be updated in response to a scrollbar
     * change event.
     *
     * @private
     * @function Highcharts.Scrollbar#shouldUpdateExtremes
     */
    public shouldUpdateExtremes(eventType?: string): boolean {
        return (
            pick(
                this.options.liveRedraw,
                H.svg &&
                !H.isTouchDevice &&
                !this.chart.boosted
            ) ||
            // Mouseup always should change extremes
            eventType === 'mouseup' ||
            eventType === 'touchend' ||
            // Internal events
            !defined(eventType)
        );
    }

    public trackClick(e: PointerEvent): void {
        const scroller = this;
        const normalizedEvent = scroller.chart.pointer.normalize(e),
            range = scroller.to - scroller.from,
            top = scroller.y + scroller.scrollbarTop,
            left = scroller.x + scroller.scrollbarLeft;

        if (
            (scroller.options.vertical && normalizedEvent.chartY > top) ||
            (!scroller.options.vertical && normalizedEvent.chartX > left)
        ) {
            // On the top or on the left side of the track:
            scroller.updatePosition(
                scroller.from + range,
                scroller.to + range
            );
        } else {
            // On the bottom or the right side of the track:
            scroller.updatePosition(
                scroller.from - range,
                scroller.to - range
            );
        }

        fireEvent(scroller, 'changed', {
            from: scroller.from,
            to: scroller.to,
            trigger: 'scrollbar',
            DOMEvent: e
        });
    }

    /**
     * Update the scrollbar with new options
     *
     * @private
     * @function Highcharts.Scrollbar#update
     * @param  {Highcharts.ScrollbarOptions} options
     */
    public update(options: DeepPartial<ScrollbarOptions>): void {
        this.destroy();
        this.init(
            this.chart.renderer,
            merge(true, this.options, options),
            this.chart
        );
    }

    /**
     * Update position option in the Scrollbar, with normalized 0-1 scale
     *
     * @private
     * @function Highcharts.Scrollbar#updatePosition
     * @param  {number} from
     * @param  {number} to
     */
    public updatePosition(from: number, to: number): void {
        if (to > 1) {
            from = correctFloat(1 - correctFloat(to - from));
            to = 1;
        }

        if (from < 0) {
            to = correctFloat(to - from);
            from = 0;
        }

        this.from = from;
        this.to = to;
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace Scrollbar {
    export interface ChangedEvent {
        from: number;
        to: number;
        trigger: 'scrollbar';
        DOMType?: string;
        DOMEvent: Event;
    }
    export interface EventCallback {
        (e: PointerEvent): void;
    }
}

/* *
 *
 *  Registry
 *
 * */

defaultOptions.scrollbar = merge(
    true,
    Scrollbar.defaultOptions,
    defaultOptions.scrollbar
);

/* *
 *
 *  Default Export
 *
 * */

export default Scrollbar;
