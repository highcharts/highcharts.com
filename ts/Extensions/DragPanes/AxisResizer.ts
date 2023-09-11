/* *
 *
 *  Plugin for resizing axes / panes in a chart.
 *
 *  (c) 2010-2023 Highsoft AS
 *
 *  Author: Kacper Madej
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
import type { YAxisOptions } from '../../Core/Axis/AxisOptions';
import type { AxisResizeOptions } from './AxisResizerOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import AxisResizerDefaults from './AxisResizerDefaults.js';
import H from '../../Core/Globals.js';
const {
    hasTouch
} = H;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { objectEach } = OH;
const { addEvent } = EH;
const {
    clamp,
    relativeLength,
    wrap
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The AxisResizer class.
 *
 * @private
 * @class
 * @name Highcharts.AxisResizer
 *
 * @param {Highcharts.Axis} axis
 *        Main axis for the AxisResizer.
 */
class AxisResizer {

    /* *
     *
     *  Static Properties
     *
     * */

    // Default options for AxisResizer.
    public static resizerOptions = AxisResizerDefaults;

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(axis: Axis) {
        this.init(axis);
    }

    /* *
     *
     *  Properties
     *
     * */

    public axis: Axis = void 0 as any;
    public controlLine: SVGElement = void 0 as any;
    public eventsToUnbind?: Array<Function>;
    public grabbed?: boolean;
    public hasDragged?: boolean;
    public lastPos: number = void 0 as any;
    public mouseDownHandler?: Function;
    public mouseMoveHandler?: Function;
    public mouseUpHandler?: Function;
    public options: AxisResizeOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initialize the AxisResizer object.
     *
     * @function Highcharts.AxisResizer#init
     *
     * @param {Highcharts.Axis} axis
     *        Main axis for the AxisResizer.
     */
    public init(
        axis: Axis,
        update?: boolean
    ): void {
        this.axis = axis;
        this.options = axis.options.resize as any;
        this.render();

        if (!update) {
            // Add mouse events.
            this.addMouseEvents();
        }
    }

    /**
     * Render the AxisResizer
     *
     * @function Highcharts.AxisResizer#render
     */
    public render(): void {
        const resizer = this,
            axis = resizer.axis,
            chart = axis.chart,
            options = resizer.options,
            x = options.x || 0,
            y = options.y,
            // Normalize control line position according to the plot area
            pos = clamp(
                axis.top + axis.height + (y as any),
                chart.plotTop,
                chart.plotTop + chart.plotHeight
            );

        let attr: SVGAttributes = {};

        if (!chart.styledMode) {
            attr = {
                cursor: options.cursor,
                stroke: options.lineColor,
                'stroke-width': options.lineWidth,
                dashstyle: options.lineDashStyle
            };
        }

        // Register current position for future reference.
        resizer.lastPos = pos - (y as any);

        if (!resizer.controlLine) {
            resizer.controlLine = chart.renderer.path()
                .addClass('highcharts-axis-resizer');
        }

        // Add to axisGroup after axis update, because the group is recreated
        // Do .add() before path is calculated because strokeWidth() needs it.
        resizer.controlLine.add(axis.axisGroup);

        const lineWidth = chart.styledMode ?
            resizer.controlLine.strokeWidth() :
            (options.lineWidth as any);

        attr.d = chart.renderer.crispLine(
            [
                ['M', axis.left + x, pos],
                ['L', axis.left + axis.width + x, pos]
            ],
            lineWidth
        );

        resizer.controlLine.attr(attr);
    }

    /**
     * Set up the mouse and touch events for the control line.
     *
     * @function Highcharts.AxisResizer#addMouseEvents
     */
    public addMouseEvents(): void {
        const resizer = this,
            ctrlLineElem = resizer.controlLine.element,
            container = resizer.axis.chart.container,
            eventsToUnbind: Array<Function> = [];

        let mouseMoveHandler: Function,
            mouseUpHandler: Function,
            mouseDownHandler: Function;

        // Create mouse events' handlers.
        // Make them as separate functions to enable wrapping them:

        resizer.mouseMoveHandler = mouseMoveHandler = function (
            e: PointerEvent
        ): void {
            resizer.onMouseMove(e);
        };
        resizer.mouseUpHandler = mouseUpHandler = function (
            e: PointerEvent
        ): void {
            resizer.onMouseUp(e);
        };
        resizer.mouseDownHandler = mouseDownHandler = function (
            e: PointerEvent
        ): void {
            resizer.onMouseDown(e);
        };

        // Add mouse move and mouseup events. These are bind to doc/container,
        // because resizer.grabbed flag is stored in mousedown events.
        eventsToUnbind.push(
            addEvent(container, 'mousemove', mouseMoveHandler),
            addEvent(container.ownerDocument, 'mouseup', mouseUpHandler),
            addEvent(ctrlLineElem, 'mousedown', mouseDownHandler)
        );

        // Touch events.
        if (hasTouch) {
            eventsToUnbind.push(
                addEvent(container, 'touchmove', mouseMoveHandler),
                addEvent(container.ownerDocument, 'touchend', mouseUpHandler),
                addEvent(ctrlLineElem, 'touchstart', mouseDownHandler)
            );
        }

        resizer.eventsToUnbind = eventsToUnbind;
    }

    /**
     * Mouse move event based on x/y mouse position.
     *
     * @function Highcharts.AxisResizer#onMouseMove
     *
     * @param {Highcharts.PointerEventObject} e
     *        Mouse event.
     */
    public onMouseMove(e: PointerEvent): void {
        /*
         * In iOS, a mousemove event with e.pageX === 0 is fired when holding
         * the finger down in the center of the scrollbar. This should
         * be ignored. Borrowed from Navigator.
         */
        if (!(e as any).touches || (e as any).touches[0].pageX !== 0) {
            // Drag the control line
            if (this.grabbed) {
                this.hasDragged = true;
                this.updateAxes(
                    this.axis.chart.pointer.normalize(e).chartY -
                    (this.options.y as any)
                );
            }
        }
    }

    /**
     * Mouse up event based on x/y mouse position.
     *
     * @function Highcharts.AxisResizer#onMouseUp
     *
     * @param {Highcharts.PointerEventObject} e
     *        Mouse event.
     */
    public onMouseUp(e: PointerEvent): void {

        if (this.hasDragged) {
            this.updateAxes(
                this.axis.chart.pointer.normalize(e).chartY -
                (this.options.y as any)
            );
        }

        // Restore runPointActions.
        this.grabbed = this.hasDragged = this.axis.chart.activeResizer =
            null as any;
    }

    /**
     * Mousedown on a control line.
     * Will store necessary information for drag&drop.
     *
     * @function Highcharts.AxisResizer#onMouseDown
     */
    public onMouseDown(e: PointerEvent): void {
        // Clear all hover effects.
        this.axis.chart.pointer.reset(false, 0);

        // Disable runPointActions.
        this.grabbed = this.axis.chart.activeResizer = true;
    }

    /**
     * Update all connected axes after a change of control line position
     *
     * @function Highcharts.AxisResizer#updateAxes
     *
     * @param {number} chartY
     */
    public updateAxes(chartY: number): void {
        const resizer = this,
            chart = resizer.axis.chart,
            axes = resizer.options.controlledAxis,
            nextAxes: Array<(number|string)> = (axes as any).next.length === 0 ?
                [chart.yAxis.indexOf(resizer.axis) + 1] : (axes as any).next,
            // Main axis is included in the prev array by default
            prevAxes: Array<(number|string)> =
                [resizer.axis as any].concat((axes as any).prev),
            // prev and next configs
            axesConfigs: Array<AnyRecord> = [],
            plotTop = chart.plotTop,
            plotHeight = chart.plotHeight,
            plotBottom = plotTop + plotHeight,
            calculatePercent = function (value: number): string {
                return value * 100 / plotHeight + '%';
            },
            normalize = function (
                val: number,
                min: number,
                max: number
            ): number {
                return Math.round(clamp(val, min, max));
            };

        // Normalize chartY to plot area limits
        chartY = clamp(chartY, plotTop, plotBottom);

        let stopDrag = false,
            yDelta = chartY - resizer.lastPos;

        // Update on changes of at least 1 pixel in the desired direction
        if (yDelta * yDelta < 1) {
            return;
        }

        // First gather info how axes should behave
        [prevAxes, nextAxes].forEach((
            axesGroup: Array<(number|string)>,
            isNext: number
        ): void => {
            axesGroup.forEach((
                axisInfo: (number|string),
                i: number
            ): void => {
                // Axes given as array index, axis object or axis id
                const axis: Axis = isNumber(axisInfo) ?
                        // If it's a number - it's an index
                        chart.yAxis[axisInfo] :
                        (
                            // If it's first elem. in first group
                            (!isNext && !i) ?
                                // then it's an Axis object
                                axisInfo as any :
                                // else it should be an id
                                chart.get(axisInfo)
                        ),
                    axisOptions = axis && axis.options,
                    optionsToUpdate: DeepPartial<YAxisOptions> = {};

                let height, top;

                // Skip if axis is not found
                // or it is navigator's yAxis (#7732)
                if (
                    !axisOptions ||
                    axisOptions.id === 'navigator-y-axis'
                ) {
                    return;
                }

                top = axis.top;

                const minLength = Math.round(relativeLength(
                        axisOptions.minLength as any,
                        plotHeight
                    )),
                    maxLength = Math.round(relativeLength(
                        axisOptions.maxLength as any,
                        plotHeight
                    ));

                if (isNext) {
                    // Try to change height first. yDelta could had changed
                    yDelta = chartY - resizer.lastPos;

                    // Normalize height to option limits
                    height = normalize(axis.len - yDelta, minLength, maxLength);

                    // Adjust top, so the axis looks like shrinked from top
                    top = axis.top + yDelta;

                    // Check for plot area limits
                    if (top + height > plotBottom) {
                        const hDelta = plotBottom - height - top;
                        chartY += hDelta;
                        top += hDelta;
                    }

                    // Fit to plot - when overflowing on top
                    if (top < plotTop) {
                        top = plotTop;
                        if (top + height > plotBottom) {
                            height = plotHeight;
                        }
                    }

                    // If next axis meets min length, stop dragging:
                    if (height === minLength) {
                        stopDrag = true;
                    }

                    axesConfigs.push({
                        axis: axis,
                        options: {
                            top: calculatePercent(top - plotTop),
                            height: calculatePercent(height)
                        }
                    });
                } else {
                    // Normalize height to option limits
                    height = normalize(chartY - top, minLength, maxLength);

                    // If prev axis meets max length, stop dragging:
                    if (height === maxLength) {
                        stopDrag = true;
                    }

                    // Check axis size limits
                    chartY = top + height;
                    axesConfigs.push({
                        axis: axis,
                        options: {
                            height: calculatePercent(height)
                        }
                    });
                }

                optionsToUpdate.height = height;
            });
        });

        // If we hit the min/maxLength with dragging, don't do anything:
        if (!stopDrag) {
            // Now update axes:
            axesConfigs.forEach(function (
                config: AnyRecord
            ): void {
                config.axis.update(config.options, false);
            });

            chart.redraw(false);
        }
    }

    /**
     * Destroy AxisResizer. Clear outside references, clear events,
     * destroy elements, nullify properties.
     *
     * @function Highcharts.AxisResizer#destroy
     */
    public destroy(): void {
        const resizer = this,
            axis = resizer.axis;

        // Clear resizer in axis
        delete axis.resizer;

        // Clear control line events
        if (this.eventsToUnbind) {
            this.eventsToUnbind.forEach(function (unbind: Function): void {
                unbind();
            });
        }

        // Destroy AxisResizer elements
        resizer.controlLine.destroy();

        // Nullify properties
        objectEach(resizer, function (val: unknown, key: string): void {
            (resizer as any)[key] = null;
        });
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default AxisResizer;
