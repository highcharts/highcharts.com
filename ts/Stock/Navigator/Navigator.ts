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

import type AxisOptions from '../../Core/Axis/AxisOptions';
import type Chart from '../../Core/Chart/Chart.js';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type { NavigatorAxisComposition } from '../../Core/Axis/NavigatorAxisComposition';
import type {
    NavigatorHandlesOptions,
    NavigatorOptions
} from './NavigatorOptions';
import type PointerEvent from '../../Core/PointerEvent';
import type ScrollbarOptions from '../Scrollbar/ScrollbarOptions';
import type Series from '../../Core/Series/Series.js';
import type { SeriesTypeOptions } from '../../Core/Series/SeriesType';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import Axis from '../../Core/Axis/Axis.js';
import D from '../../Core/Defaults.js';
const { defaultOptions } = D;
import H from '../../Core/Globals.js';
const {
    hasTouch,
    isTouchDevice
} = H;
import NavigatorAxisAdditions from '../../Core/Axis/NavigatorAxisComposition.js';
import NavigatorComposition from './NavigatorComposition.js';
import Scrollbar from '../Scrollbar/Scrollbar.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find,
    splat,
    erase
} = AH;
const { isArray, isNumber } = TC;
const { defined, destroyObjectProperties, extend, merge } = OH;
const { addEvent, removeEvent } = EH;
const {
    clamp,
    correctFloat,
    pick
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * Finding the min or max of a set of variables where we don't know if they are
 * defined, is a pattern that is repeated several places in Highcharts. Consider
 * making this a global utility method.
 * @private
 */
function numExt(
    extreme: ('max'|'min'),
    ...args: Array<number>
): (number|undefined) {
    const numbers = [].filter.call(args, isNumber);

    if (numbers.length) {
        return Math[extreme].apply(0, numbers);
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Navigator class
 *
 * @private
 * @class
 * @name Highcharts.Navigator
 *
 * @param {Highcharts.Chart} chart
 *        Chart object
 */
class Navigator {

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        AxisClass: typeof Axis,
        ChartClass: typeof Chart,
        SeriesClass: typeof Series
    ): void {
        NavigatorComposition.compose(
            AxisClass,
            ChartClass,
            Navigator,
            SeriesClass
        );
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(chart: Chart) {
        this.init(chart);
    }

    /* *
     *
     *  Properties
     *
     * */

    public baseSeries: Array<Series> = void 0 as any;
    public chart: Chart = void 0 as any;
    public dragOffset?: number;
    public eventsToUnbind?: Array<Function>;
    public fixedExtreme?: (null|number);
    public fixedWidth?: number;
    public grabbedCenter?: number;
    public grabbedLeft?: boolean;
    public grabbedRight?: boolean;
    public handles: Array<SVGElement> = void 0 as any;
    public hasDragged?: boolean;
    public hasNavigatorData?: boolean;
    public height: number = void 0 as any;
    public left: number = void 0 as any;
    public mouseMoveHandler?: Function;
    public mouseUpHandler?: Function;
    public navigatorEnabled: boolean = void 0 as any;
    public navigatorGroup: SVGElement = void 0 as any;
    public navigatorOptions: NavigatorOptions = void 0 as any;
    public navigatorSeries: Series = void 0 as any;
    public navigatorSize: number = void 0 as any;
    public opposite: boolean = void 0 as any;
    public otherHandlePos?: number;
    public outline: SVGElement = void 0 as any;
    public range: number = void 0 as any;
    public rendered: boolean = void 0 as any;
    public reversedExtremes?: boolean;
    public scrollbar?: Scrollbar;
    public scrollbarEnabled?: boolean;
    public scrollbarHeight = 0;
    public scrollButtonSize: number = void 0 as any;
    public scrollbarOptions?: ScrollbarOptions;
    public series?: Array<Series>;
    public shades: Array<SVGElement> = void 0 as any;
    public size: number = void 0 as any;
    public stickToMax?: boolean;
    public stickToMin?: boolean;
    public top: number = void 0 as any;
    public unbindRedraw?: Function;
    public xAxis: NavigatorAxisComposition = void 0 as any;
    public yAxis: NavigatorAxisComposition = void 0 as any;
    public zoomedMax: number = void 0 as any;
    public zoomedMin: number = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Draw one of the handles on the side of the zoomed range in the navigator.
     *
     * @private
     * @function Highcharts.Navigator#drawHandle
     *
     * @param {number} x
     *        The x center for the handle
     *
     * @param {number} index
     *        0 for left and 1 for right
     *
     * @param {boolean|undefined} inverted
     *        Flag for chart.inverted
     *
     * @param {string} verb
     *        Use 'animate' or 'attr'
     */
    public drawHandle(
        x: number,
        index: number,
        inverted: boolean | undefined,
        verb: string
    ): void {
        const navigator = this,
            height = (navigator.navigatorOptions.handles as any).height;

        // Place it
        navigator.handles[index][verb](inverted ? {
            translateX: Math.round(navigator.left + navigator.height / 2),
            translateY: Math.round(
                navigator.top + parseInt(x as any, 10) + 0.5 - height
            )
        } : {
            translateX: Math.round(navigator.left + parseInt(x as any, 10)),
            translateY: Math.round(
                navigator.top + navigator.height / 2 - height / 2 - 1
            )
        });
    }

    /**
     * Render outline around the zoomed range
     *
     * @private
     * @function Highcharts.Navigator#drawOutline
     *
     * @param {number} zoomedMin
     *        in pixels position where zoomed range starts
     *
     * @param {number} zoomedMax
     *        in pixels position where zoomed range ends
     *
     * @param {boolean|undefined} inverted
     *        flag if chart is inverted
     *
     * @param {string} verb
     *        use 'animate' or 'attr'
     */
    public drawOutline(
        zoomedMin: number,
        zoomedMax: number,
        inverted: (boolean|undefined),
        verb: string
    ): void {
        const navigator = this,
            maskInside = navigator.navigatorOptions.maskInside,
            outlineWidth = navigator.outline.strokeWidth(),
            halfOutline = outlineWidth / 2,
            outlineCorrection = (outlineWidth % 2) / 2, // #5800
            scrollButtonSize = navigator.scrollButtonSize,
            navigatorSize = navigator.size,
            navigatorTop = navigator.top,
            height = navigator.height,
            lineTop = navigatorTop - halfOutline,
            lineBtm = navigatorTop + height;

        let left = navigator.left,
            verticalMin,
            path: SVGPath;

        if (inverted) {
            verticalMin = navigatorTop + zoomedMax + outlineCorrection;
            zoomedMax = navigatorTop + zoomedMin + outlineCorrection;

            path = [
                [
                    'M',
                    left + height,
                    navigatorTop - scrollButtonSize - outlineCorrection
                ],
                // top right of zoomed range
                ['L', left + height, verticalMin],
                ['L', left, verticalMin], // top left of z.r.
                ['M', left, zoomedMax], // bottom left of z.r.
                ['L', left + height, zoomedMax], // bottom right of z.r.
                [
                    'L',
                    left + height,
                    navigatorTop + navigatorSize + scrollButtonSize
                ]
            ];
            if (maskInside) {
                path.push(
                    // upper left of zoomed range
                    ['M', left + height, verticalMin - halfOutline],
                    // upper right of z.r.
                    [
                        'L',
                        left + height,
                        zoomedMax + halfOutline
                    ]
                );
            }
        } else {
            left -= scrollButtonSize;
            zoomedMin += left + scrollButtonSize - outlineCorrection;
            zoomedMax += left + scrollButtonSize - outlineCorrection;

            path = [
                // left
                ['M', left, lineTop],
                // upper left of zoomed range
                ['L', zoomedMin, lineTop],
                // lower left of z.r.
                ['L', zoomedMin, lineBtm],
                // lower right of z.r.
                ['M', zoomedMax, lineBtm],
                // upper right of z.r.
                ['L', zoomedMax, lineTop],
                // right
                [
                    'L',
                    left + navigatorSize + scrollButtonSize * 2,
                    navigatorTop + halfOutline
                ]
            ];

            if (maskInside) {
                path.push(
                    // upper left of zoomed range
                    ['M', zoomedMin - halfOutline, lineTop],
                    // upper right of z.r.
                    ['L', zoomedMax + halfOutline, lineTop]
                );
            }
        }
        navigator.outline[verb]({
            d: path
        });
    }

    /**
     * Render outline around the zoomed range
     *
     * @private
     * @function Highcharts.Navigator#drawMasks
     *
     * @param {number} zoomedMin
     *        in pixels position where zoomed range starts
     *
     * @param {number} zoomedMax
     *        in pixels position where zoomed range ends
     *
     * @param {boolean|undefined} inverted
     *        flag if chart is inverted
     *
     * @param {string} verb
     *        use 'animate' or 'attr'
     */
    public drawMasks(
        zoomedMin: number,
        zoomedMax: number,
        inverted: (boolean|undefined),
        verb: string
    ): void {
        const navigator = this,
            left = navigator.left,
            top = navigator.top,
            navigatorHeight = navigator.height;

        let height: [number, number, number],
            width: [number, number, number],
            x: [number, number, number],
            y: [number, number, number];

        // Determine rectangle position & size
        // According to (non)inverted position:
        if (inverted) {
            x = [left, left, left];
            y = [top, top + zoomedMin, top + zoomedMax];
            width = [navigatorHeight, navigatorHeight, navigatorHeight];
            height = [
                zoomedMin,
                zoomedMax - zoomedMin,
                navigator.size - zoomedMax
            ];
        } else {
            x = [left, left + zoomedMin, left + zoomedMax];
            y = [top, top, top];
            width = [
                zoomedMin,
                zoomedMax - zoomedMin,
                navigator.size - zoomedMax
            ];
            height = [navigatorHeight, navigatorHeight, navigatorHeight];
        }
        navigator.shades.forEach((
            shade: SVGElement,
            i: number
        ): void => {
            shade[verb]({
                x: x[i],
                y: y[i],
                width: width[i],
                height: height[i]
            });
        });
    }

    /**
     * Generate DOM elements for a navigator:
     *
     * - main navigator group
     *
     * - all shades
     *
     * - outline
     *
     * - handles
     *
     * @private
     * @function Highcharts.Navigator#renderElements
     */
    public renderElements(): void {
        const navigator = this,
            navigatorOptions = navigator.navigatorOptions,
            maskInside = navigatorOptions.maskInside,
            chart = navigator.chart,
            inverted = chart.inverted,
            renderer = chart.renderer,
            mouseCursor: CSSObject = {
                cursor: inverted ? 'ns-resize' : 'ew-resize'
            },
            // Create the main navigator group
            navigatorGroup: SVGElement = navigator.navigatorGroup = renderer
                .g('navigator')
                .attr({
                    zIndex: 8,
                    visibility: 'hidden'
                })
                .add();

        // Create masks, each mask will get events and fill:
        [
            !maskInside,
            maskInside,
            !maskInside
        ].forEach((hasMask: (boolean|undefined), index: number): void => {
            const shade = renderer.rect()
                .addClass('highcharts-navigator-mask' +
                    (index === 1 ? '-inside' : '-outside'))
                .add(navigatorGroup);

            if (!chart.styledMode) {
                shade.attr({
                    fill: hasMask ?
                        (navigatorOptions.maskFill as any) :
                        'rgba(0,0,0,0)'
                });

                if (index === 1) {
                    shade.css(mouseCursor);
                }
            }
            navigator.shades[index] = shade;
        });

        // Create the outline:
        navigator.outline = renderer.path()
            .addClass('highcharts-navigator-outline')
            .add(navigatorGroup);

        if (!chart.styledMode) {
            navigator.outline.attr({
                'stroke-width': navigatorOptions.outlineWidth,
                stroke: navigatorOptions.outlineColor
            });
        }

        // Create the handlers:
        if (navigatorOptions.handles && navigatorOptions.handles.enabled) {
            const handlesOptions =
                navigatorOptions.handles as Required<NavigatorHandlesOptions>,
                { height, width } = handlesOptions;

            [0, 1].forEach((index: number): void => {
                navigator.handles[index] = renderer.symbol(
                    handlesOptions.symbols[index],
                    -width / 2 - 1,
                    0,
                    width,
                    height,
                    handlesOptions
                );

                if (chart.inverted) {
                    navigator.handles[index].attr({
                        rotation: 90,
                        rotationOriginX: Math.floor(-width / 2),
                        rotationOriginY: (height + width) / 2
                    });
                }

                // zIndex = 6 for right handle, 7 for left.
                // Can't be 10, because of the tooltip in inverted chart #2908
                navigator.handles[index].attr({ zIndex: 7 - index })
                    .addClass(
                        'highcharts-navigator-handle ' +
                        'highcharts-navigator-handle-' +
                        ['left', 'right'][index]
                    ).add(navigatorGroup);

                if (!chart.styledMode) {
                    navigator.handles[index]
                        .attr({
                            fill: handlesOptions.backgroundColor,
                            stroke: handlesOptions.borderColor,
                            'stroke-width': handlesOptions.lineWidth
                        })
                        .css(mouseCursor);
                }
            });
        }
    }

    /**
     * Update navigator
     *
     * @private
     * @function Highcharts.Navigator#update
     *
     * @param {Highcharts.NavigatorOptions} options
     *        Options to merge in when updating navigator
     */
    public update(options: NavigatorOptions): void {
        // Remove references to old navigator series in base series
        (this.series || []).forEach((series): void => {
            if (series.baseSeries) {
                delete series.baseSeries.navigatorSeries;
            }
        });
        // Destroy and rebuild navigator
        this.destroy();
        const chartOptions = this.chart.options;

        merge(true, chartOptions.navigator, options);
        this.init(this.chart);
    }

    /**
     * Render the navigator
     *
     * @private
     * @function Highcharts.Navigator#render
     * @param {number} min
     *        X axis value minimum
     * @param {number} max
     *        X axis value maximum
     * @param {number} [pxMin]
     *        Pixel value minimum
     * @param {number} [pxMax]
     *        Pixel value maximum
     */
    public render(
        min: number,
        max: number,
        pxMin?: number,
        pxMax?: number
    ): void {
        const navigator = this,
            chart = navigator.chart,
            xAxis = navigator.xAxis,
            pointRange = xAxis.pointRange || 0,
            scrollbarXAxis = xAxis.navigatorAxis.fake ? chart.xAxis[0] : xAxis,
            navigatorEnabled = navigator.navigatorEnabled,
            rendered = navigator.rendered,
            inverted = chart.inverted,
            minRange = chart.xAxis[0].minRange,
            maxRange = chart.xAxis[0].options.maxRange,
            scrollButtonSize = navigator.scrollButtonSize;

        let navigatorWidth,
            scrollbarLeft,
            scrollbarTop,
            scrollbarHeight = navigator.scrollbarHeight,
            navigatorSize,
            verb;

        // Don't redraw while moving the handles (#4703).
        if (this.hasDragged && !defined(pxMin)) {
            return;
        }

        min = correctFloat(min - pointRange / 2);
        max = correctFloat(max + pointRange / 2);

        // Don't render the navigator until we have data (#486, #4202, #5172).
        if (!isNumber(min) || !isNumber(max)) {
            // However, if navigator was already rendered, we may need to resize
            // it. For example hidden series, but visible navigator (#6022).
            if (rendered) {
                pxMin = 0;
                pxMax = pick(xAxis.width, scrollbarXAxis.width);
            } else {
                return;
            }
        }

        navigator.left = pick(
            xAxis.left,
            // in case of scrollbar only, without navigator
            chart.plotLeft + scrollButtonSize +
            (inverted ? chart.plotWidth : 0)
        );

        let zoomedMax = navigator.size = navigatorSize = pick(
            xAxis.len,
            (inverted ? chart.plotHeight : chart.plotWidth) -
            2 * scrollButtonSize
        );

        if (inverted) {
            navigatorWidth = scrollbarHeight;
        } else {
            navigatorWidth = navigatorSize + 2 * scrollButtonSize;
        }

        // Get the pixel position of the handles
        pxMin = pick(pxMin, xAxis.toPixels(min, true));
        pxMax = pick(pxMax, xAxis.toPixels(max, true));

        // Verify (#1851, #2238)
        if (!isNumber(pxMin) || Math.abs(pxMin as any) === Infinity) {
            pxMin = 0;
            pxMax = navigatorWidth;
        }

        // Are we below the minRange? (#2618, #6191)
        const newMin = xAxis.toValue(pxMin as any, true),
            newMax = xAxis.toValue(pxMax as any, true),
            currentRange = Math.abs(correctFloat(newMax - newMin));

        if (currentRange < (minRange as any)) {
            if (this.grabbedLeft) {
                pxMin = xAxis.toPixels(
                    newMax - (minRange as any) - pointRange,
                    true
                );
            } else if (this.grabbedRight) {
                pxMax = xAxis.toPixels(
                    newMin + (minRange as any) + pointRange,
                    true
                );
            }
        } else if (
            defined(maxRange) &&
            correctFloat(currentRange - pointRange) > (maxRange as any)
        ) {
            if (this.grabbedLeft) {
                pxMin = xAxis.toPixels(
                    newMax - (maxRange as any) - pointRange,
                    true
                );
            } else if (this.grabbedRight) {
                pxMax = xAxis.toPixels(
                    newMin + (maxRange as any) + pointRange,
                    true
                );
            }
        }

        // Handles are allowed to cross, but never exceed the plot area
        navigator.zoomedMax = clamp(
            Math.max(pxMin, pxMax as any),
            0,
            zoomedMax
        );
        navigator.zoomedMin = clamp(
            navigator.fixedWidth ?
                navigator.zoomedMax - navigator.fixedWidth :
                Math.min(pxMin, pxMax as any),
            0,
            zoomedMax
        );

        navigator.range = navigator.zoomedMax - navigator.zoomedMin;

        zoomedMax = Math.round(navigator.zoomedMax);
        const zoomedMin = Math.round(navigator.zoomedMin);

        if (navigatorEnabled) {
            navigator.navigatorGroup.attr({
                visibility: 'inherit'
            });
            // Place elements
            verb = rendered && !navigator.hasDragged ? 'animate' : 'attr';

            navigator.drawMasks(zoomedMin, zoomedMax, inverted, verb);
            navigator.drawOutline(zoomedMin, zoomedMax, inverted, verb);

            if ((navigator.navigatorOptions.handles as any).enabled) {
                navigator.drawHandle(zoomedMin, 0, inverted, verb);
                navigator.drawHandle(zoomedMax, 1, inverted, verb);
            }
        }

        if (navigator.scrollbar) {
            if (inverted) {
                scrollbarTop = navigator.top - scrollButtonSize;
                scrollbarLeft = navigator.left - scrollbarHeight +
                    (navigatorEnabled || !scrollbarXAxis.opposite ? 0 :
                        // Multiple axes has offsets:
                        (scrollbarXAxis.titleOffset || 0) +
                        // Self margin from the axis.title
                        (scrollbarXAxis.axisTitleMargin as any)
                    );
                scrollbarHeight = navigatorSize + 2 * scrollButtonSize;
            } else {
                scrollbarTop = navigator.top + (navigatorEnabled ?
                    navigator.height :
                    -scrollbarHeight);
                scrollbarLeft = navigator.left - scrollButtonSize;
            }
            // Reposition scrollbar
            navigator.scrollbar.position(
                scrollbarLeft,
                scrollbarTop,
                navigatorWidth as any,
                scrollbarHeight
            );
            // Keep scale 0-1
            navigator.scrollbar.setRange(
                // Use real value, not rounded because range can be very small
                // (#1716)
                navigator.zoomedMin / (navigatorSize || 1),
                navigator.zoomedMax / (navigatorSize || 1)
            );
        }
        navigator.rendered = true;
    }

    /**
     * Set up the mouse and touch events for the navigator
     *
     * @private
     * @function Highcharts.Navigator#addMouseEvents
     */
    public addMouseEvents(): void {
        const navigator = this,
            chart = navigator.chart,
            container = chart.container;

        let eventsToUnbind = [],
            mouseMoveHandler,
            mouseUpHandler;

        /**
         * Create mouse events' handlers.
         * Make them as separate functions to enable wrapping them:
         */
        navigator.mouseMoveHandler = mouseMoveHandler = function (
            e: PointerEvent
        ): void {
            navigator.onMouseMove(e);
        };
        navigator.mouseUpHandler = mouseUpHandler = function (
            e: PointerEvent
        ): void {
            navigator.onMouseUp(e);
        };

        // Add shades and handles mousedown events
        eventsToUnbind = navigator.getPartsEvents('mousedown');
        // Add mouse move and mouseup events. These are bind to doc/container,
        // because Navigator.grabbedSomething flags are stored in mousedown
        // events
        eventsToUnbind.push(
            addEvent(chart.renderTo, 'mousemove', mouseMoveHandler),
            addEvent(container.ownerDocument, 'mouseup', mouseUpHandler)
        );

        // Touch events
        if (hasTouch) {
            eventsToUnbind.push(
                addEvent(chart.renderTo, 'touchmove', mouseMoveHandler),
                addEvent(container.ownerDocument, 'touchend', mouseUpHandler)
            );
            eventsToUnbind.concat(navigator.getPartsEvents('touchstart'));
        }

        navigator.eventsToUnbind = eventsToUnbind;

        // Data events
        if (navigator.series && navigator.series[0]) {
            eventsToUnbind.push(
                addEvent(
                    navigator.series[0].xAxis,
                    'foundExtremes',
                    function (): void {
                        (chart.navigator as any).modifyNavigatorAxisExtremes();
                    }
                )
            );
        }
    }

    /**
     * Generate events for handles and masks
     *
     * @private
     * @function Highcharts.Navigator#getPartsEvents
     *
     * @param {string} eventName
     *        Event name handler, 'mousedown' or 'touchstart'
     *
     * @return {Array<Function>}
     *         An array of functions to remove navigator functions from the
     *         events again.
     */
    public getPartsEvents(
        eventName: string
    ): Array<Function> {
        const navigator = this,
            events = [] as Array<Function>;

        ['shades', 'handles'].forEach(function (name: string): void {
            (navigator as any)[name].forEach(function (
                navigatorItem: SVGElement,
                index: number
            ): void {
                events.push(
                    addEvent(
                        navigatorItem.element,
                        eventName,
                        function (e: PointerEvent): void {
                            (navigator as any)[name + 'Mousedown'](e, index);
                        }
                    )
                );
            });
        });
        return events;
    }

    /**
     * Mousedown on a shaded mask, either:
     *
     * - will be stored for future drag&drop
     *
     * - will directly shift to a new range
     *
     * @private
     * @function Highcharts.Navigator#shadesMousedown
     *
     * @param {Highcharts.PointerEventObject} e
     *        Mouse event
     *
     * @param {number} index
     *        Index of a mask in Navigator.shades array
     */
    public shadesMousedown(
        e: PointerEvent,
        index: number
    ): void {
        e = this.chart.pointer.normalize(e);

        const navigator = this,
            chart = navigator.chart,
            xAxis = navigator.xAxis,
            zoomedMin = navigator.zoomedMin,
            navigatorSize = navigator.size,
            range = navigator.range;

        let navigatorPosition = navigator.left,
            chartX = e.chartX,
            fixedMax,
            fixedMin,
            ext,
            left;

        // For inverted chart, swap some options:
        if (chart.inverted) {
            chartX = e.chartY;
            navigatorPosition = navigator.top;
        }

        if (index === 1) {
            // Store information for drag&drop
            navigator.grabbedCenter = chartX;
            navigator.fixedWidth = range;
            navigator.dragOffset = chartX - zoomedMin;
        } else {
            // Shift the range by clicking on shaded areas
            left = chartX - navigatorPosition - range / 2;
            if (index === 0) {
                left = Math.max(0, left);
            } else if (index === 2 && left + range >= navigatorSize) {
                left = navigatorSize - range;
                if (navigator.reversedExtremes) {
                    // #7713
                    left -= range;
                    fixedMin = (navigator.getUnionExtremes() as any).dataMin;
                } else {
                    // #2293, #3543
                    fixedMax = (navigator.getUnionExtremes() as any).dataMax;
                }
            }
            if (left !== zoomedMin) { // it has actually moved
                navigator.fixedWidth = range; // #1370

                ext = xAxis.navigatorAxis.toFixedRange(
                    left,
                    left + range,
                    fixedMin,
                    fixedMax
                );
                if (defined(ext.min)) { // #7411
                    chart.xAxis[0].setExtremes(
                        Math.min(ext.min, ext.max),
                        Math.max(ext.min, ext.max),
                        true,
                        null as any, // auto animation
                        { trigger: 'navigator' }
                    );
                }
            }
        }
    }

    /**
     * Mousedown on a handle mask.
     * Will store necessary information for drag&drop.
     *
     * @private
     * @function Highcharts.Navigator#handlesMousedown
     * @param {Highcharts.PointerEventObject} e
     *        Mouse event
     * @param {number} index
     *        Index of a handle in Navigator.handles array
     */
    public handlesMousedown(
        e: PointerEvent,
        index: number
    ): void {
        e = this.chart.pointer.normalize(e);

        const navigator = this,
            chart = navigator.chart,
            baseXAxis = chart.xAxis[0],
            // For reversed axes, min and max are changed,
            // so the other extreme should be stored
            reverse = navigator.reversedExtremes;

        if (index === 0) {
            // Grab the left handle
            navigator.grabbedLeft = true;
            navigator.otherHandlePos = navigator.zoomedMax;
            navigator.fixedExtreme = reverse ? baseXAxis.min : baseXAxis.max;
        } else {
            // Grab the right handle
            navigator.grabbedRight = true;
            navigator.otherHandlePos = navigator.zoomedMin;
            navigator.fixedExtreme = reverse ? baseXAxis.max : baseXAxis.min;
        }

        chart.fixedRange = null as any;
    }
    /**
     * Mouse move event based on x/y mouse position.
     *
     * @private
     * @function Highcharts.Navigator#onMouseMove
     *
     * @param {Highcharts.PointerEventObject} e
     *        Mouse event
     */
    public onMouseMove(e: PointerEvent): void {
        const navigator = this,
            chart = navigator.chart,
            navigatorSize = navigator.navigatorSize,
            range = navigator.range,
            dragOffset = navigator.dragOffset,
            inverted = chart.inverted;

        let left = navigator.left,
            chartX;


        // In iOS, a mousemove event with e.pageX === 0 is fired when holding
        // the finger down in the center of the scrollbar. This should be
        // ignored.
        if (!(e as any).touches || (e as any).touches[0].pageX !== 0) { // #4696

            e = chart.pointer.normalize(e);
            chartX = e.chartX;

            // Swap some options for inverted chart
            if (inverted) {
                left = navigator.top;
                chartX = e.chartY;
            }

            // Drag left handle or top handle
            if (navigator.grabbedLeft) {
                navigator.hasDragged = true;
                navigator.render(
                    0,
                    0,
                    chartX - left,
                    navigator.otherHandlePos
                );
            // Drag right handle or bottom handle
            } else if (navigator.grabbedRight) {
                navigator.hasDragged = true;
                navigator.render(
                    0,
                    0,
                    navigator.otherHandlePos,
                    chartX - left
                );
            // Drag scrollbar or open area in navigator
            } else if (navigator.grabbedCenter) {
                navigator.hasDragged = true;
                if (chartX < (dragOffset as any)) { // outside left
                    chartX = dragOffset;
                // outside right
                } else if (chartX >
                    navigatorSize + (dragOffset as any) - range
                ) {
                    chartX = navigatorSize + (dragOffset as any) - range;
                }

                navigator.render(
                    0,
                    0,
                    (chartX as any) - (dragOffset as any),
                    (chartX as any) - (dragOffset as any) + range
                );
            }
            if (
                navigator.hasDragged &&
                navigator.scrollbar &&
                pick(
                    navigator.scrollbar.options.liveRedraw,

                    // By default, don't run live redraw on touch
                    // devices or if the chart is in boost.
                    !isTouchDevice &&
                    !this.chart.boosted
                )
            ) {
                (e as any).DOMType = e.type;
                setTimeout(function (): void {
                    navigator.onMouseUp(e);
                }, 0);
            }
        }
    }

    /**
     * Mouse up event based on x/y mouse position.
     *
     * @private
     * @function Highcharts.Navigator#onMouseUp
     * @param {Highcharts.PointerEventObject} e
     *        Mouse event
     */
    public onMouseUp(e: PointerEvent): void {
        const navigator = this,
            chart = navigator.chart,
            xAxis = navigator.xAxis,
            scrollbar = navigator.scrollbar,
            DOMEvent = (e as any).DOMEvent || e,
            inverted = chart.inverted,
            verb = navigator.rendered && !navigator.hasDragged ?
                'animate' : 'attr';
        let zoomedMax,
            zoomedMin,
            unionExtremes,
            fixedMin,
            fixedMax,
            ext;

        if (
            // MouseUp is called for both, navigator and scrollbar (that order),
            // which causes calling afterSetExtremes twice. Prevent first call
            // by checking if scrollbar is going to set new extremes (#6334)
            (navigator.hasDragged && (!scrollbar || !scrollbar.hasDragged)) ||
            (e as any).trigger === 'scrollbar'
        ) {
            unionExtremes = navigator.getUnionExtremes();

            // When dragging one handle, make sure the other one doesn't change
            if (navigator.zoomedMin === navigator.otherHandlePos) {
                fixedMin = navigator.fixedExtreme;
            } else if (navigator.zoomedMax === navigator.otherHandlePos) {
                fixedMax = navigator.fixedExtreme;
            }
            // Snap to right edge (#4076)
            if (navigator.zoomedMax === navigator.size) {
                fixedMax = navigator.reversedExtremes ?
                    (unionExtremes as any).dataMin :
                    (unionExtremes as any).dataMax;
            }

            // Snap to left edge (#7576)
            if (navigator.zoomedMin === 0) {
                fixedMin = navigator.reversedExtremes ?
                    (unionExtremes as any).dataMax :
                    (unionExtremes as any).dataMin;
            }

            ext = xAxis.navigatorAxis.toFixedRange(
                navigator.zoomedMin,
                navigator.zoomedMax,
                fixedMin,
                fixedMax
            );

            if (defined(ext.min)) {
                chart.xAxis[0].setExtremes(
                    Math.min(ext.min, ext.max),
                    Math.max(ext.min, ext.max),
                    true,
                    // Run animation when clicking buttons, scrollbar track etc,
                    // but not when dragging handles or scrollbar
                    navigator.hasDragged ? false : (null as any),
                    {
                        trigger: 'navigator',
                        triggerOp: 'navigator-drag',
                        DOMEvent: DOMEvent // #1838
                    }
                );
            }
        }

        if (
            (e as any).DOMType !== 'mousemove' &&
            (e as any).DOMType !== 'touchmove'
        ) {
            navigator.grabbedLeft = navigator.grabbedRight =
                navigator.grabbedCenter = navigator.fixedWidth =
                navigator.fixedExtreme = navigator.otherHandlePos =
                navigator.hasDragged = navigator.dragOffset = null as any;
        }

        // Update position of navigator shades, outline and handles (#12573)
        if (
            navigator.navigatorEnabled &&
            isNumber(navigator.zoomedMin) &&
            isNumber(navigator.zoomedMax)
        ) {
            zoomedMin = Math.round(navigator.zoomedMin);
            zoomedMax = Math.round(navigator.zoomedMax);
            if (navigator.shades) {
                navigator.drawMasks(zoomedMin, zoomedMax, inverted, verb);
            }

            if (navigator.outline) {
                navigator.drawOutline(zoomedMin, zoomedMax, inverted, verb);
            }

            if (
                (navigator.navigatorOptions.handles as any).enabled &&
                    Object.keys(navigator.handles).length ===
                    navigator.handles.length
            ) {
                navigator.drawHandle(zoomedMin, 0, inverted, verb);
                navigator.drawHandle(zoomedMax, 1, inverted, verb);
            }
        }
    }

    /**
     * Removes the event handlers attached previously with addEvents.
     *
     * @private
     * @function Highcharts.Navigator#removeEvents
     */
    public removeEvents(): void {
        if (this.eventsToUnbind) {
            this.eventsToUnbind.forEach(function (unbind: Function): void {
                unbind();
            });
            this.eventsToUnbind = void 0;
        }
        this.removeBaseSeriesEvents();
    }

    /**
     * Remove data events.
     *
     * @private
     * @function Highcharts.Navigator#removeBaseSeriesEvents
     */
    public removeBaseSeriesEvents(): void {
        const baseSeries = this.baseSeries || [];

        if (this.navigatorEnabled && baseSeries[0]) {
            if (this.navigatorOptions.adaptToUpdatedData !== false) {
                baseSeries.forEach(function (series): void {
                    removeEvent(series, 'updatedData', this.updatedDataHandler);
                }, this);
            }

            // We only listen for extremes-events on the first baseSeries
            if (baseSeries[0].xAxis) {
                removeEvent(
                    baseSeries[0].xAxis,
                    'foundExtremes',
                    this.modifyBaseAxisExtremes
                );
            }
        }
    }

    /**
     * Initialize the Navigator object
     *
     * @private
     * @function Highcharts.Navigator#init
     */
    public init(
        chart: Chart
    ): void {
        const chartOptions = chart.options,
            navigatorOptions = chartOptions.navigator || {},
            navigatorEnabled = navigatorOptions.enabled,
            scrollbarOptions = chartOptions.scrollbar || {},
            scrollbarEnabled = scrollbarOptions.enabled,
            height = navigatorEnabled && navigatorOptions.height || 0,
            scrollbarHeight = scrollbarEnabled && scrollbarOptions.height || 0,
            scrollButtonSize =
                scrollbarOptions.buttonsEnabled && scrollbarHeight || 0;

        this.handles = [];
        this.shades = [];

        this.chart = chart;
        this.setBaseSeries();

        this.height = height;
        this.scrollbarHeight = scrollbarHeight;
        this.scrollButtonSize = scrollButtonSize;
        this.scrollbarEnabled = scrollbarEnabled;
        this.navigatorEnabled = navigatorEnabled as any;
        this.navigatorOptions = navigatorOptions;
        this.scrollbarOptions = scrollbarOptions;

        this.opposite = pick(
            navigatorOptions.opposite,
            Boolean(!navigatorEnabled && chart.inverted)
        ); // #6262

        const navigator = this,
            baseSeries = navigator.baseSeries,
            xAxisIndex = chart.xAxis.length,
            yAxisIndex = chart.yAxis.length,
            baseXaxis = baseSeries && baseSeries[0] && baseSeries[0].xAxis ||
                chart.xAxis[0] || { options: {} };

        chart.isDirtyBox = true;

        if (navigator.navigatorEnabled) {
            // an x axis is required for scrollbar also
            navigator.xAxis = new Axis(chart, merge<DeepPartial<AxisOptions>>({
                // inherit base xAxis' break and ordinal options
                breaks: baseXaxis.options.breaks,
                ordinal: baseXaxis.options.ordinal
            }, navigatorOptions.xAxis, {
                id: 'navigator-x-axis',
                yAxis: 'navigator-y-axis',
                type: 'datetime',
                index: xAxisIndex,
                isInternal: true,
                offset: 0,
                keepOrdinalPadding: true, // #2436
                startOnTick: false,
                endOnTick: false,
                minPadding: 0,
                maxPadding: 0,
                zoomEnabled: false
            }, chart.inverted ? {
                offsets: [scrollButtonSize, 0, -scrollButtonSize, 0],
                width: height
            } : {
                offsets: [0, -scrollButtonSize, 0, scrollButtonSize],
                height: height
            }), 'xAxis') as NavigatorAxisComposition;

            navigator.yAxis = new Axis(chart, merge(
                navigatorOptions.yAxis,
                {
                    id: 'navigator-y-axis',
                    alignTicks: false,
                    offset: 0,
                    index: yAxisIndex,
                    isInternal: true,
                    reversed: pick(
                        (
                            navigatorOptions.yAxis &&
                            navigatorOptions.yAxis.reversed
                        ),
                        (chart.yAxis[0] && chart.yAxis[0].reversed),
                        false
                    ), // #14060
                    zoomEnabled: false
                }, chart.inverted ? {
                    width: height
                } : {
                    height: height
                }
            ), 'yAxis') as NavigatorAxisComposition;

            // If we have a base series, initialize the navigator series
            if (baseSeries || (navigatorOptions.series as any).data) {
                navigator.updateNavigatorSeries(false);

            // If not, set up an event to listen for added series
            } else if (chart.series.length === 0) {

                navigator.unbindRedraw = addEvent(
                    chart,
                    'beforeRedraw',
                    function (): void {
                        // We've got one, now add it as base
                        if (chart.series.length > 0 && !navigator.series) {
                            navigator.setBaseSeries();
                            (navigator.unbindRedraw as any)(); // reset
                        }
                    }
                );
            }

            navigator.reversedExtremes = (
                chart.inverted && !navigator.xAxis.reversed
            ) || (
                !chart.inverted && navigator.xAxis.reversed
            );

            // Render items, so we can bind events to them:
            navigator.renderElements();
            // Add mouse events
            navigator.addMouseEvents();

        // in case of scrollbar only, fake an x axis to get translation
        } else {
            navigator.xAxis = {
                chart,
                navigatorAxis: {
                    fake: true
                },
                translate: function (value: number, reverse?: boolean): void {
                    const axis = chart.xAxis[0],
                        ext = axis.getExtremes(),
                        scrollTrackWidth = axis.len - 2 * scrollButtonSize,
                        min = numExt(
                            'min',
                            axis.options.min as any,
                            ext.dataMin
                        ),
                        valueRange = (numExt(
                            'max',
                            axis.options.max as any,
                            ext.dataMax
                        ) as any) - (min as any);

                    return reverse ?
                        // from pixel to value
                        (value * valueRange / scrollTrackWidth) + (min as any) :
                        // from value to pixel
                        scrollTrackWidth * (value - (min as any)) / valueRange;
                },
                toPixels: function (
                    this: NavigatorAxisComposition,
                    value: number
                ): number {
                    return this.translate(value);
                },
                toValue: function (
                    this: NavigatorAxisComposition,
                    value: number
                ): number {
                    return this.translate(value, true);
                }
            } as NavigatorAxisComposition;

            navigator.xAxis.navigatorAxis.axis = navigator.xAxis;
            navigator.xAxis.navigatorAxis.toFixedRange = (
                NavigatorAxisAdditions.prototype.toFixedRange.bind(
                    navigator.xAxis.navigatorAxis
                )
            );
        }


        // Initialize the scrollbar
        if ((chart.options.scrollbar as any).enabled) {

            const options = merge<DeepPartial<ScrollbarOptions>>(
                chart.options.scrollbar,
                { vertical: chart.inverted }
            );
            if (!isNumber(options.margin) && navigator.navigatorEnabled) {
                options.margin = chart.inverted ? -3 : 3;
            }
            chart.scrollbar = navigator.scrollbar = new Scrollbar(
                chart.renderer,
                options,
                chart
            );
            addEvent(navigator.scrollbar, 'changed', function (
                e: PointerEvent
            ): void {
                const range = navigator.size,
                    to = range * (this.to as any),
                    from = range * (this.from as any);

                navigator.hasDragged = (navigator.scrollbar as any).hasDragged;
                navigator.render(0, 0, from, to);

                if (this.shouldUpdateExtremes((e as any).DOMType)) {
                    setTimeout(function (): void {
                        navigator.onMouseUp(e);
                    });
                }
            });
        }

        // Add data events
        navigator.addBaseSeriesEvents();
        // Add redraw events
        navigator.addChartEvents();
    }

    /**
     * Get the union data extremes of the chart - the outer data extremes of the
     * base X axis and the navigator axis.
     *
     * @private
     * @function Highcharts.Navigator#getUnionExtremes
     */
    public getUnionExtremes(
        returnFalseOnNoBaseSeries?: boolean
    ): (Record<string, (number|undefined)>|undefined) {
        const baseAxis = this.chart.xAxis[0],
            navAxis = this.xAxis,
            navAxisOptions = navAxis.options,
            baseAxisOptions = baseAxis.options;

        let ret: (Record<string, (number|undefined)>|undefined);

        if (!returnFalseOnNoBaseSeries || baseAxis.dataMin !== null) {
            ret = {
                dataMin: pick( // #4053
                    navAxisOptions && navAxisOptions.min,
                    numExt(
                        'min',
                        baseAxisOptions.min as any,
                        baseAxis.dataMin as any,
                        navAxis.dataMin as any,
                        navAxis.min as any
                    )
                ),
                dataMax: pick(
                    navAxisOptions && navAxisOptions.max,
                    numExt(
                        'max',
                        baseAxisOptions.max as any,
                        baseAxis.dataMax as any,
                        navAxis.dataMax as any,
                        navAxis.max as any
                    )
                )
            };
        }

        return ret;
    }

    /**
     * Set the base series and update the navigator series from this. With a bit
     * of modification we should be able to make this an API method to be called
     * from the outside
     *
     * @private
     * @function Highcharts.Navigator#setBaseSeries
     * @param {Highcharts.SeriesOptionsType} [baseSeriesOptions]
     *        Additional series options for a navigator
     * @param {boolean} [redraw]
     *        Whether to redraw after update.
     */
    public setBaseSeries(
        baseSeriesOptions?: SeriesTypeOptions,
        redraw?: boolean
    ): void {
        const chart = this.chart,
            baseSeries = this.baseSeries = [] as Array<Series>;

        baseSeriesOptions = (
            baseSeriesOptions ||
            chart.options && (chart.options.navigator as any).baseSeries ||
            (chart.series.length ?
                // Find the first non-navigator series (#8430)
                (find(chart.series, (s: Series): boolean => (
                    !s.options.isInternal
                )) as any).index :
                0
            )
        );

        // Iterate through series and add the ones that should be shown in
        // navigator.
        (chart.series || []).forEach((series, i): void => {
            if (
                // Don't include existing nav series
                !series.options.isInternal &&
                (
                    series.options.showInNavigator ||
                    (
                        i === (baseSeriesOptions as any) ||
                        series.options.id === (baseSeriesOptions as any)
                    ) &&
                    series.options.showInNavigator !== false
                )
            ) {
                baseSeries.push(series);
            }
        });

        // When run after render, this.xAxis already exists
        if (this.xAxis && !this.xAxis.navigatorAxis.fake) {
            this.updateNavigatorSeries(true, redraw);
        }
    }

    /**
     * Update series in the navigator from baseSeries, adding new if does not
     * exist.
     *
     * @private
     * @function Highcharts.Navigator.updateNavigatorSeries
     */
    public updateNavigatorSeries(
        addEvents: boolean,
        redraw?: boolean
    ): void {
        const navigator = this,
            chart = navigator.chart,
            baseSeries = navigator.baseSeries,
            navSeriesMixin = {
                enableMouseTracking: false,
                index: null, // #6162
                linkedTo: null, // #6734
                group: 'nav', // for columns
                padXAxis: false,
                xAxis: 'navigator-x-axis',
                yAxis: 'navigator-y-axis',
                showInLegend: false,
                stacking: void 0, // #4823
                isInternal: true,
                states: {
                    inactive: {
                        opacity: 1
                    }
                }
            } as AnyRecord,
            // Remove navigator series that are no longer in the baseSeries
            navigatorSeries = navigator.series =
                (navigator.series || []).filter((navSeries): boolean => {
                    const base = navSeries.baseSeries;

                    if (baseSeries.indexOf(base as any) < 0) { // Not in array
                        // If there is still a base series connected to this
                        // series, remove event handler and reference.
                        if (base) {
                            removeEvent(
                                base,
                                'updatedData',
                                navigator.updatedDataHandler
                            );
                            delete base.navigatorSeries;
                        }
                        // Kill the nav series. It may already have been
                        // destroyed (#8715).
                        if (navSeries.chart) {
                            navSeries.destroy();
                        }
                        return false;
                    }
                    return true;
                });

        let baseOptions,
            mergedNavSeriesOptions: SeriesTypeOptions,
            chartNavigatorSeriesOptions = navigator.navigatorOptions.series,
            baseNavigatorOptions;

        // Go through each base series and merge the options to create new
        // series
        if (baseSeries && baseSeries.length) {
            baseSeries.forEach((base): void => {
                const linkedNavSeries = base.navigatorSeries,
                    userNavOptions = extend(
                        // Grab color and visibility from base as default
                        {
                            color: base.color,
                            visible: base.visible
                        } as AnyRecord,
                        !isArray(chartNavigatorSeriesOptions) ?
                            chartNavigatorSeriesOptions :
                            (defaultOptions.navigator as any).series
                    );

                // Don't update if the series exists in nav and we have disabled
                // adaptToUpdatedData.
                if (
                    linkedNavSeries &&
                    navigator.navigatorOptions.adaptToUpdatedData === false
                ) {
                    return;
                }

                navSeriesMixin.name = 'Navigator ' + baseSeries.length;

                baseOptions = base.options || {};
                baseNavigatorOptions = baseOptions.navigatorOptions || {};

                // The dataLabels options are not merged correctly
                // if the settings are an array, #13847.
                userNavOptions.dataLabels = splat(userNavOptions.dataLabels);
                mergedNavSeriesOptions = merge(
                    baseOptions,
                    navSeriesMixin,
                    userNavOptions,
                    baseNavigatorOptions
                );

                // Once nav series type is resolved, pick correct pointRange
                mergedNavSeriesOptions.pointRange = pick(
                    // Stricte set pointRange in options
                    userNavOptions.pointRange,
                    baseNavigatorOptions.pointRange,
                    // Fallback to default values, e.g. `null` for column
                    (defaultOptions.plotOptions as any)[
                        mergedNavSeriesOptions.type || 'line'
                    ].pointRange
                );

                // Merge data separately. Do a slice to avoid mutating the
                // navigator options from base series (#4923).
                const navigatorSeriesData =
                    baseNavigatorOptions.data || userNavOptions.data;

                navigator.hasNavigatorData =
                    navigator.hasNavigatorData || !!navigatorSeriesData;
                mergedNavSeriesOptions.data =
                    navigatorSeriesData ||
                    baseOptions.data && baseOptions.data.slice(0);

                // Update or add the series
                if (linkedNavSeries && linkedNavSeries.options) {
                    linkedNavSeries.update(mergedNavSeriesOptions, redraw);
                } else {
                    base.navigatorSeries = chart.initSeries(
                        mergedNavSeriesOptions
                    );
                    base.navigatorSeries.baseSeries = base; // Store ref
                    navigatorSeries.push(base.navigatorSeries);
                }
            });
        }

        // If user has defined data (and no base series) or explicitly defined
        // navigator.series as an array, we create these series on top of any
        // base series.
        if ((chartNavigatorSeriesOptions as any).data &&
            !(baseSeries && baseSeries.length) ||
            isArray(chartNavigatorSeriesOptions)
        ) {
            navigator.hasNavigatorData = false;
            // Allow navigator.series to be an array
            chartNavigatorSeriesOptions =
                (splat(chartNavigatorSeriesOptions) as any);
            (chartNavigatorSeriesOptions as any).forEach((
                userSeriesOptions: SeriesTypeOptions,
                i: number
            ): void => {
                navSeriesMixin.name =
                    'Navigator ' + (navigatorSeries.length + 1);
                mergedNavSeriesOptions = merge(
                    (defaultOptions.navigator as any).series,
                    {
                        // Since we don't have a base series to pull color from,
                        // try to fake it by using color from series with same
                        // index. Otherwise pull from the colors array. We need
                        // an explicit color as otherwise updates will increment
                        // color counter and we'll get a new color for each
                        // update of the nav series.
                        color: chart.series[i] &&
                        !chart.series[i].options.isInternal &&
                        chart.series[i].color ||
                        (chart.options.colors as any)[i] ||
                        (chart.options.colors as any)[0]
                    },
                    navSeriesMixin,
                    userSeriesOptions
                );
                mergedNavSeriesOptions.data = userSeriesOptions.data;
                if (mergedNavSeriesOptions.data) {
                    navigator.hasNavigatorData = true;
                    navigatorSeries.push(
                        chart.initSeries(mergedNavSeriesOptions)
                    );
                }
            });
        }

        if (addEvents) {
            this.addBaseSeriesEvents();
        }
    }

    /**
     * Add data events.
     * For example when main series is updated we need to recalculate extremes
     *
     * @private
     * @function Highcharts.Navigator#addBaseSeriesEvent
     */
    public addBaseSeriesEvents(): void {
        const navigator = this,
            baseSeries = navigator.baseSeries || [];

        // Bind modified extremes event to first base's xAxis only.
        // In event of > 1 base-xAxes, the navigator will ignore those.
        // Adding this multiple times to the same axis is no problem, as
        // duplicates should be discarded by the browser.
        if (baseSeries[0] && baseSeries[0].xAxis) {
            baseSeries[0].eventsToUnbind.push(addEvent(
                baseSeries[0].xAxis,
                'foundExtremes',
                this.modifyBaseAxisExtremes
            ));
        }

        baseSeries.forEach((base): void => {
            // Link base series show/hide to navigator series visibility
            base.eventsToUnbind.push(addEvent(base, 'show', function (): void {
                if (this.navigatorSeries) {
                    this.navigatorSeries.setVisible(true, false);
                }
            }));
            base.eventsToUnbind.push(addEvent(base, 'hide', function (): void {
                if (this.navigatorSeries) {
                    this.navigatorSeries.setVisible(false, false);
                }
            }));

            // Respond to updated data in the base series, unless explicitily
            // not adapting to data changes.
            if (this.navigatorOptions.adaptToUpdatedData !== false) {
                if (base.xAxis) {
                    base.eventsToUnbind.push(
                        addEvent(base, 'updatedData', this.updatedDataHandler)
                    );
                }
            }

            // Handle series removal
            base.eventsToUnbind.push(addEvent(
                base,
                'remove',
                function (): void {
                    if (this.navigatorSeries) {
                        erase(navigator.series as any, this.navigatorSeries);
                        if (defined(this.navigatorSeries.options)) {
                            this.navigatorSeries.remove(false);
                        }
                        delete this.navigatorSeries;
                    }
                }
            ));
        });
    }

    /**
     * Get minimum from all base series connected to the navigator
     * @private
     * @param {number} currentSeriesMin
     *        Minium from the current series
     * @return {number}
     *         Minimum from all series
     */
    public getBaseSeriesMin(
        currentSeriesMin: number
    ): number {
        return this.baseSeries.reduce(
            function (min: number, series: Series): number {
                // (#10193)
                return Math.min(
                    min,
                    series.xData && series.xData.length ?
                        series.xData[0] : min
                );
            },
            currentSeriesMin
        );
    }

    /**
     * Set the navigator x axis extremes to reflect the total. The navigator
     * extremes should always be the extremes of the union of all series in the
     * chart as well as the navigator series.
     *
     * @private
     * @function Highcharts.Navigator#modifyNavigatorAxisExtremes
     */
    public modifyNavigatorAxisExtremes(): void {
        const xAxis = this.xAxis;

        if (typeof xAxis.getExtremes !== 'undefined') {
            const unionExtremes = this.getUnionExtremes(true);
            if (
                unionExtremes &&
                (
                    unionExtremes.dataMin !== xAxis.min ||
                    unionExtremes.dataMax !== xAxis.max
                )
            ) {
                xAxis.min = unionExtremes.dataMin as any;
                xAxis.max = unionExtremes.dataMax as any;
            }
        }
    }

    /**
     * Hook to modify the base axis extremes with information from the Navigator
     *
     * @private
     * @function Highcharts.Navigator#modifyBaseAxisExtremes
     */
    public modifyBaseAxisExtremes(this: Axis): void {
        const baseXAxis = this,
            navigator = baseXAxis.chart.navigator,
            baseExtremes = baseXAxis.getExtremes(),
            baseMin = baseExtremes.min,
            baseMax = baseExtremes.max,
            baseDataMin = baseExtremes.dataMin,
            baseDataMax = baseExtremes.dataMax,
            range = baseMax - baseMin,
            stickToMin = (navigator as any).stickToMin,
            stickToMax = (navigator as any).stickToMax,
            overscroll = pick(baseXAxis.options.overscroll, 0),
            navigatorSeries =
                (navigator as any).series && (navigator as any).series[0],
            hasSetExtremes = !!baseXAxis.setExtremes,

            // When the extremes have been set by range selector button, don't
            // stick to min or max. The range selector buttons will handle the
            // extremes. (#5489)
            unmutable = baseXAxis.eventArgs &&
                baseXAxis.eventArgs.trigger === 'rangeSelectorButton';

        let newMax,
            newMin;

        if (!unmutable) {

            // If the zoomed range is already at the min, move it to the right
            // as new data comes in
            if (stickToMin) {
                newMin = baseDataMin;
                newMax = newMin + range;
            }

            // If the zoomed range is already at the max, move it to the right
            // as new data comes in
            if (stickToMax) {
                newMax = baseDataMax + overscroll;

                // If stickToMin is true, the new min value is set above
                if (!stickToMin) {
                    newMin = Math.max(
                        baseDataMin, // don't go below data extremes (#13184)
                        newMax - range,
                        (navigator as any).getBaseSeriesMin(
                            navigatorSeries && navigatorSeries.xData ?
                                navigatorSeries.xData[0] :
                                -Number.MAX_VALUE
                        )
                    );
                }
            }

            // Update the extremes
            if (hasSetExtremes && (stickToMin || stickToMax)) {
                if (isNumber(newMin)) {
                    baseXAxis.min = baseXAxis.userMin = newMin as any;
                    baseXAxis.max = baseXAxis.userMax = newMax as any;
                }
            }
        }

        // Reset
        (navigator as any).stickToMin =
            (navigator as any).stickToMax = null as any;
    }

    /**
     * Handler for updated data on the base series. When data is modified, the
     * navigator series must reflect it. This is called from the Chart.redraw
     * function before axis and series extremes are computed.
     *
     * @private
     * @function Highcharts.Navigator#updateDataHandler
     */
    public updatedDataHandler(this: Series): void {
        const navigator = this.chart.navigator as Navigator,
            baseSeries = this,
            navigatorSeries = this.navigatorSeries,
            shouldStickToMax = navigator.reversedExtremes ?
                Math.round(navigator.zoomedMin) === 0 :
                Math.round(navigator.zoomedMax) >= Math.round(navigator.size);

        // If the scrollbar is scrolled all the way to the right, keep right as
        // new data comes in, unless user set navigator.stickToMax to false.
        navigator.stickToMax = pick(this.chart.options.navigator &&
            this.chart.options.navigator.stickToMax, shouldStickToMax);

        navigator.stickToMin = navigator.shouldStickToMin(
            baseSeries,
            navigator
        );

        // Set the navigator series data to the new data of the base series
        if (navigatorSeries && !navigator.hasNavigatorData) {
            navigatorSeries.options.pointStart = (baseSeries.xData as any)[0];
            navigatorSeries.setData(
                baseSeries.options.data as any,
                false,
                null as any,
                false
            ); // #5414
        }
    }

    /**
     * Detect if the zoomed area should stick to the minimum, #14742.
     *
     * @private
     * @function Highcharts.Navigator#shouldStickToMin
     */
    public shouldStickToMin(
        baseSeries: Series,
        navigator: Navigator
    ): boolean|undefined {
        const xDataMin = navigator.getBaseSeriesMin(
                (baseSeries.xData as any)[0]
            ),
            xAxis = baseSeries.xAxis,
            max = xAxis.max,
            min = xAxis.min,
            range = xAxis.options.range;

        let stickToMin: boolean = true;

        if (isNumber(max) && isNumber(min)) {
            // If range declared, stick to the minimum only if the range
            // is smaller than the data set range.
            if (range && max - xDataMin > 0) {
                stickToMin = max - xDataMin < range;
            } else {
                // If the current axis minimum falls outside the new
                // updated dataset, we must adjust.
                stickToMin = min <= xDataMin;
            }
        } else {
            stickToMin = false; // #15864
        }

        return stickToMin;
    }

    /**
     * Add chart events, like redrawing navigator, when chart requires that.
     *
     * @private
     * @function Highcharts.Navigator#addChartEvents
     */
    public addChartEvents(): void {
        if (!this.eventsToUnbind) {
            this.eventsToUnbind = [];
        }

        this.eventsToUnbind.push(
            // Move the scrollbar after redraw, like after data updata even if
            // axes don't redraw
            addEvent(
                this.chart,
                'redraw',
                function (): void {
                    const navigator = this.navigator as Navigator,
                        xAxis = navigator && (
                            navigator.baseSeries &&
                            navigator.baseSeries[0] &&
                            navigator.baseSeries[0].xAxis ||
                            this.xAxis[0]
                        ); // #5709, #13114

                    if (xAxis) {
                        navigator.render(xAxis.min as any, xAxis.max as any);
                    }
                }
            ),
            // Make room for the navigator, can be placed around the chart:
            addEvent(
                this.chart,
                'getMargins',
                function (): void {
                    let chart = this,
                        navigator = chart.navigator as Navigator,
                        marginName = navigator.opposite ?
                            'plotTop' : 'marginBottom';

                    if (chart.inverted) {
                        marginName = navigator.opposite ?
                            'marginRight' : 'plotLeft';
                    }

                    (chart as any)[marginName] =
                        ((chart as any)[marginName] || 0) + (
                            navigator.navigatorEnabled || !chart.inverted ?
                                navigator.height + navigator.scrollbarHeight :
                                0
                        ) + navigator.navigatorOptions.margin;
                }
            )
        );
    }

    /**
     * Destroys allocated elements.
     *
     * @private
     * @function Highcharts.Navigator#destroy
     */
    public destroy(): void {

        // Disconnect events added in addEvents
        this.removeEvents();

        if (this.xAxis) {
            erase(this.chart.xAxis, this.xAxis);
            erase(this.chart.axes, this.xAxis);
        }
        if (this.yAxis) {
            erase(this.chart.yAxis, this.yAxis);
            erase(this.chart.axes, this.yAxis);
        }
        // Destroy series
        (this.series || []).forEach((s): void => {
            if (s.destroy) {
                s.destroy();
            }
        });

        // Destroy properties
        [
            'series', 'xAxis', 'yAxis', 'shades', 'outline', 'scrollbarTrack',
            'scrollbarRifles', 'scrollbarGroup', 'scrollbar', 'navigatorGroup',
            'rendered'
        ].forEach((prop: string): void => {
            if ((this as any)[prop] && (this as any)[prop].destroy) {
                (this as any)[prop].destroy();
            }
            (this as any)[prop] = null;
        });

        // Destroy elements in collection
        [this.handles].forEach((
            coll: Array<SVGElement>
        ): void => {
            destroyObjectProperties(coll);
        });
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default Navigator;
