/* *
 *
 *  (c) 2010-2024 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Highcharts feature to make the Y axis stay fixed when scrolling the chart
 *  horizontally on mobile devices. Supports left and right side axes.
 */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Axis from '../Core/Axis/Axis';
import type BBoxObject from '../Core/Renderer/BBoxObject';
import type Chart from '../Core/Chart/Chart';
import type CSSObject from '../Core/Renderer/CSSObject';
import type {
    DOMElementType,
    HTMLDOMElement
} from '../Core/Renderer/DOMElementType';
import type Series from '../Core/Series/Series';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../Core/Renderer/SVG/SVGRenderer';

import { stop } from '../Core/Animation/AnimationUtilities.js';
import H from '../Core/Globals.js';
const { composed } = H;
import RendererRegistry from '../Core/Renderer/RendererRegistry.js';
import U from '../Core/Utilities.js';
const {
    addEvent,
    createElement,
    css,
    defined,
    merge,
    pushUnique
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface ScrollablePlotAreaOptions {
    minHeight?: number;
    minWidth?: number;
    opacity?: number;
    scrollPositionX?: number;
    scrollPositionY?: number;
}

declare module '../Core/Chart/ChartOptions' {
    interface ChartOptions {
        scrollablePlotArea?: ScrollablePlotAreaOptions
    }
}

declare module '../Core/Chart/ChartLike'{
    interface ChartLike {
        scrollablePixelsX?: number;
        scrollablePixelsY?: number;
        scrollablePlotBox?: BBoxObject;
        scrollablePlotArea?: ScrollablePlotArea;
    }
}


/* *
 *
 *  Functions
 *
 * */
/** @private */
function onChartRender(
    this: Chart
): void {
    let scrollablePlotArea = this.scrollablePlotArea;
    if (
        (this.scrollablePixelsX || this.scrollablePixelsY) &&
        !scrollablePlotArea
    ) {
        this.scrollablePlotArea = scrollablePlotArea = new ScrollablePlotArea(
            this
        );
    }
    scrollablePlotArea?.applyFixed();
}

/** @private */
function markDirty(
    this: Axis|Series
): void {
    if (this.chart.scrollablePlotArea) {
        this.chart.scrollablePlotArea.isDirty = true;
    }
}


class ScrollablePlotArea {

    public static compose(
        AxisClass: typeof Axis,
        ChartClass: typeof Chart,
        SeriesClass: typeof Series
    ): void {

        if (pushUnique(composed, this.compose)) {
            addEvent(AxisClass, 'afterInit', markDirty);

            addEvent(
                ChartClass,
                'afterSetChartSize',
                (e: { skipAxes: boolean, target: Chart }): void =>
                    this.afterSetSize(e.target, e)
            );
            addEvent(ChartClass, 'render', onChartRender);

            addEvent(SeriesClass, 'show', markDirty);
        }

    }

    public static afterSetSize(chart: Chart, e: { skipAxes: boolean }): void {
        const { minWidth, minHeight } =
                chart.options.chart.scrollablePlotArea || {},
            { clipBox, plotBox, inverted, renderer } = chart;

        let scrollablePixelsX: number,
            scrollablePixelsY: number,
            recalculateHoriz: boolean|undefined;

        if (!renderer.forExport) {

            // The amount of pixels to scroll, the difference between chart
            // width and scrollable width
            if (minWidth) {
                chart.scrollablePixelsX = scrollablePixelsX = Math.max(
                    0,
                    minWidth - chart.chartWidth
                );

                if (scrollablePixelsX) {
                    chart.scrollablePlotBox = merge(chart.plotBox);
                    plotBox.width = chart.plotWidth += scrollablePixelsX;
                    clipBox[inverted ? 'height' : 'width'] += scrollablePixelsX;

                    recalculateHoriz = true;
                }

            // Currently we can only do either X or Y
            } else if (minHeight) {
                chart.scrollablePixelsY = scrollablePixelsY = Math.max(
                    0,
                    minHeight - chart.chartHeight
                );
                if (defined(scrollablePixelsY)) {
                    chart.scrollablePlotBox = merge(chart.plotBox);
                    plotBox.height = chart.plotHeight += scrollablePixelsY;
                    clipBox[inverted ? 'width' : 'height'] += scrollablePixelsY;

                    recalculateHoriz = false;
                }
            }

            if (defined(recalculateHoriz) && !e.skipAxes) {
                for (const axis of chart.axes) {
                    // Apply the corrected plot size to the axes of the other
                    // orientation than the scrolling direction
                    if (axis.horiz === recalculateHoriz) {
                        axis.setAxisSize();
                        axis.setAxisTranslation();
                    }
                }
            }
        }
    }

    static fixedSelectors: string[] = [
        '.highcharts-breadcrumbs-group',
        '.highcharts-contextbutton',
        '.highcharts-caption',
        '.highcharts-credits',
        '.highcharts-drillup-button',
        '.highcharts-legend',
        '.highcharts-legend-checkbox',
        '.highcharts-navigator-series',
        '.highcharts-navigator-xaxis',
        '.highcharts-navigator-yaxis',
        '.highcharts-navigator',
        '.highcharts-range-selector-group',
        '.highcharts-reset-zoom',
        '.highcharts-scrollbar',
        '.highcharts-subtitle',
        '.highcharts-title'
    ];

    public chart: Chart;
    public fixedDiv: HTMLDOMElement;
    public fixedRenderer: SVGRenderer;
    public innerContainer: HTMLDOMElement;
    public isDirty?: boolean;
    public scrollingContainer: HTMLDOMElement;
    public parentDiv: HTMLDOMElement;
    public mask: SVGElement;

    public constructor(chart: Chart) {
        const chartOptions = chart.options.chart,
            Renderer = RendererRegistry.getRendererType(),
            scrollableOptions = chartOptions.scrollablePlotArea || {},
            moveFixedElements = this.moveFixedElements.bind(this),
            styles: CSSObject = {
                WebkitOverflowScrolling: 'touch',
                overflowX: 'hidden',
                overflowY: 'hidden'
            };

        if (chart.scrollablePixelsX) {
            styles.overflowX = 'auto';
        }
        if (chart.scrollablePixelsY) {
            styles.overflowY = 'auto';
        }

        this.chart = chart;

        // Insert a container with relative position that scrolling and fixed
        // container renders to (#10555)
        const parentDiv = this.parentDiv = createElement(
                'div',
                {
                    className: 'highcharts-scrolling-parent'
                },
                {
                    position: 'relative'
                },
                chart.renderTo
            ),

            // Add the necessary divs to provide scrolling
            scrollingContainer = this.scrollingContainer = createElement(
                'div', {
                    'className': 'highcharts-scrolling'
                }, styles, parentDiv
            ),

            innerContainer = this.innerContainer = createElement('div', {
                'className': 'highcharts-inner-container'
            }, void 0, scrollingContainer),

            fixedDiv = this.fixedDiv = createElement(
                'div',
                {
                    className: 'highcharts-fixed'
                },
                {
                    position: 'absolute',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: (chartOptions.style?.zIndex || 0) + 2,
                    top: 0
                },
                void 0,
                true
            ),
            fixedRenderer = this.fixedRenderer = new Renderer(
                fixedDiv,
                chart.chartWidth,
                chart.chartHeight,
                chartOptions.style
            );

        // Mask
        this.mask = fixedRenderer
            .path()
            .attr({
                fill: chartOptions.backgroundColor || '#fff',
                'fill-opacity': scrollableOptions.opacity ?? 0.85,
                zIndex: -1
            })
            .addClass('highcharts-scrollable-mask')
            .add();

        scrollingContainer.parentNode.insertBefore(
            fixedDiv,
            scrollingContainer
        );
        css(chart.renderTo, { overflow: 'visible' });

        addEvent(chart, 'afterShowResetZoom', moveFixedElements);
        addEvent(chart, 'afterApplyDrilldown', moveFixedElements);
        addEvent(chart, 'afterLayOutTitles', moveFixedElements);


        // On scroll, reset the chart position because it applies to the
        // scrolled container
        let lastHoverPoint: typeof chart.hoverPoint;
        addEvent(scrollingContainer, 'scroll', (): void => {
            const { pointer, hoverPoint } = chart;
            if (pointer) {
                delete pointer.chartPosition;
                if (hoverPoint) {
                    lastHoverPoint = hoverPoint;
                }
                pointer.runPointActions(void 0, lastHoverPoint, true);
            }
        });

        // Now move the container inside
        innerContainer.appendChild(chart.container);

    }

    public applyFixed(): void {
        const {
                chart,
                fixedRenderer,
                isDirty,
                scrollingContainer
            } = this,
            {
                axisOffset,
                chartWidth,
                chartHeight,
                container,
                plotHeight,
                plotLeft,
                plotTop,
                plotWidth,
                scrollablePixelsX = 0,
                scrollablePixelsY = 0
            } = chart,
            chartOptions = chart.options.chart,
            scrollableOptions = chartOptions.scrollablePlotArea || {},
            { scrollPositionX = 0, scrollPositionY = 0 } = scrollableOptions,
            scrollableWidth = chartWidth + scrollablePixelsX,
            scrollableHeight = chartHeight + scrollablePixelsY;

        // Set the size of the fixed renderer to the visible width
        fixedRenderer.setSize(chartWidth, chartHeight);

        if (isDirty ?? true) {
            this.isDirty = false;
            this.moveFixedElements();
        }

        // Increase the size of the scrollable renderer and background
        stop(chart.container);
        css(container, {
            width: `${scrollableWidth}px`,
            height: `${scrollableHeight}px`
        });
        chart.renderer.boxWrapper.attr({
            width: scrollableWidth,
            height: scrollableHeight,
            viewBox: [0, 0, scrollableWidth, scrollableHeight].join(' ')
        });
        chart.chartBackground?.attr({
            width: scrollableWidth,
            height: scrollableHeight
        });

        css(scrollingContainer, {
            width: `${chartWidth}px`,
            height: `${chartHeight}px`
        });

        // Set scroll position the first time (this.isDirty was undefined at
        // the top of this function)
        if (!defined(isDirty)) {
            scrollingContainer.scrollLeft = scrollablePixelsX * scrollPositionX;
            scrollingContainer.scrollTop = scrollablePixelsY * scrollPositionY;
        }

        // Mask behind the left and right side
        const maskTop = plotTop - axisOffset[0] - 1,
            maskLeft = plotLeft - axisOffset[3] - 1,
            maskBottom = plotTop + plotHeight + axisOffset[2] + 1,
            maskRight = plotLeft + plotWidth + axisOffset[1] + 1,
            maskPlotRight = plotLeft + plotWidth - scrollablePixelsX,
            maskPlotBottom = plotTop + plotHeight - scrollablePixelsY;

        let d: SVGPath = [['M', 0, 0]];

        if (scrollablePixelsX) {
            d = [
                // Left side
                ['M', 0, maskTop],
                ['L', plotLeft - 1, maskTop],
                ['L', plotLeft - 1, maskBottom],
                ['L', 0, maskBottom],
                ['Z'],

                // Right side
                ['M', maskPlotRight, maskTop],
                ['L', chartWidth, maskTop],
                ['L', chartWidth, maskBottom],
                ['L', maskPlotRight, maskBottom],
                ['Z']
            ];
        } else if (scrollablePixelsY) {
            d = [
                // Top side
                ['M', maskLeft, 0],
                ['L', maskLeft, plotTop - 1],
                ['L', maskRight, plotTop - 1],
                ['L', maskRight, 0],
                ['Z'],

                // Bottom side
                ['M', maskLeft, maskPlotBottom],
                ['L', maskLeft, chartHeight],
                ['L', maskRight, chartHeight],
                ['L', maskRight, maskPlotBottom],
                ['Z']
            ];
        }

        if (chart.redrawTrigger !== 'adjustHeight') {
            this.mask.attr({ d });
        }
    }

    /**
     * These elements are moved over to the fixed renderer and stay fixed when
     * the user scrolls the chart
     * @private
     */
    public moveFixedElements(): void {
        const {
                container,
                inverted,
                scrollablePixelsX,
                scrollablePixelsY
            } = this.chart,
            fixedRenderer = this.fixedRenderer,
            fixedSelectors = ScrollablePlotArea.fixedSelectors;

        let axisClass: (string|undefined);

        if (scrollablePixelsX && !inverted) {
            axisClass = '.highcharts-yaxis';
        } else if (scrollablePixelsX && inverted) {
            axisClass = '.highcharts-xaxis';
        } else if (scrollablePixelsY && !inverted) {
            axisClass = '.highcharts-xaxis';
        } else if (scrollablePixelsY && inverted) {
            axisClass = '.highcharts-yaxis';
        }

        if (axisClass) {
            fixedSelectors.push(
                `${axisClass}:not(.highcharts-radial-axis)`,
                `${axisClass}-labels:not(.highcharts-radial-axis-labels)`
            );
        }

        for (const className of fixedSelectors) {
            [].forEach.call(
                container.querySelectorAll(className),
                (elem: DOMElementType): void => {
                    (
                        elem.namespaceURI === fixedRenderer.SVG_NS ?
                            fixedRenderer.box :
                            fixedRenderer.box.parentNode
                    ).appendChild(elem);
                    elem.style.pointerEvents = 'auto';
                }
            );
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ScrollablePlotArea;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Options for a scrollable plot area. This feature provides a minimum size for
 * the plot area of the chart. If the size gets smaller than this, typically
 * on mobile devices, a native browser scrollbar is presented. This scrollbar
 * provides smooth scrolling for the contents of the plot area, whereas the
 * title, legend and unaffected axes are fixed.
 *
 * Since v7.1.2, a scrollable plot area can be defined for either horizontal or
 * vertical scrolling, depending on whether the `minWidth` or `minHeight`
 * option is set.
 *
 * @sample highcharts/chart/scrollable-plotarea
 *         Scrollable plot area
 * @sample highcharts/chart/scrollable-plotarea-vertical
 *         Vertically scrollable plot area
 * @sample {gantt} gantt/chart/scrollable-plotarea-vertical
 *         Gantt chart with vertically scrollable plot area
 *
 * @since     6.1.0
 * @product   highcharts gantt
 * @apioption chart.scrollablePlotArea
 */

/**
 * The minimum height for the plot area. If it gets smaller than this, the plot
 * area will become scrollable.
 *
 * @type      {number}
 * @since     7.1.2
 * @apioption chart.scrollablePlotArea.minHeight
 */

/**
 * The minimum width for the plot area. If it gets smaller than this, the plot
 * area will become scrollable.
 *
 * @type      {number}
 * @since     6.1.0
 * @apioption chart.scrollablePlotArea.minWidth
 */

/**
 * The initial scrolling position of the scrollable plot area. Ranges from 0 to
 * 1, where 0 aligns the plot area to the left and 1 aligns it to the right.
 * Typically we would use 1 if the chart has right aligned Y axes.
 *
 * @type      {number}
 * @since     6.1.0
 * @apioption chart.scrollablePlotArea.scrollPositionX
 */

/**
 * The initial scrolling position of the scrollable plot area. Ranges from 0 to
 * 1, where 0 aligns the plot area to the top and 1 aligns it to the bottom.
 *
 * @type      {number}
 * @since     7.1.2
 * @apioption chart.scrollablePlotArea.scrollPositionY
 */

/**
 * The opacity of mask applied on one of the sides of the plot
 * area.
 *
 * @sample {highcharts} highcharts/chart/scrollable-plotarea-opacity
 *         Disabled opacity for the mask
 *
 * @type        {number}
 * @default     0.85
 * @since       7.1.1
 * @apioption   chart.scrollablePlotArea.opacity
 */

(''); // Keep doclets above in transpiled file
