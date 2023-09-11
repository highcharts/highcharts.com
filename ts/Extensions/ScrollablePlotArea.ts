/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Highcharts feature to make the Y axis stay fixed when scrolling the chart
 *  horizontally on mobile devices. Supports left and right side axes.
 */

/*
WIP on vertical scrollable plot area (#9378). To do:
- Bottom axis positioning
- Test with Gantt
- Look for size optimizing the code
- API and demos
 */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type BBoxObject from '../Core/Renderer/BBoxObject';
import type CSSObject from '../Core/Renderer/CSSObject';
import type {
    DOMElementType,
    HTMLDOMElement
} from '../Core/Renderer/DOMElementType';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../Core/Renderer/SVG/SVGRenderer';

import A from '../Core/Animation/AnimationUtilities.js';
const { stop } = A;
import Axis from '../Core/Axis/Axis.js';
import Chart from '../Core/Chart/Chart.js';
import Series from '../Core/Series/Series.js';
import RendererRegistry from '../Core/Renderer/RendererRegistry.js';
import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
const { defined, merge } = OH;
const { addEvent } = EH;
const {
    createElement,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Chart/ChartLike'{
    interface ChartLike {
        fixedDiv?: HTMLDOMElement;
        fixedRenderer?: SVGRenderer;
        innerContainer?: HTMLDOMElement;
        scrollingContainer?: HTMLDOMElement;
        scrollingParent?: HTMLDOMElement;
        scrollableDirty?: boolean;
        scrollableMask?: SVGElement;
        scrollablePixelsX?: number;
        scrollablePixelsY?: number;
        scrollablePlotBox?: BBoxObject;
        applyFixed(): void;
        moveFixedElements(): void;
        setUpScrolling(): void;
    }
}

declare module '../Core/Renderer/SVG/SVGRendererLike' {
    interface SVGRendererLike {
        scrollablePlotBox?: BBoxObject;
    }
}

/* eslint-disable no-invalid-this, valid-jsdoc */

addEvent(Chart, 'afterSetChartSize', function (e: { skipAxes: boolean }): void {

    let scrollablePlotArea = (this.options.chart as any).scrollablePlotArea,
        scrollableMinWidth =
            scrollablePlotArea && scrollablePlotArea.minWidth,
        scrollableMinHeight =
            scrollablePlotArea && scrollablePlotArea.minHeight,
        scrollablePixelsX,
        scrollablePixelsY,
        corrections: (
            Record<string, Record<string, (number|string)>>|
            undefined
        );

    if (!this.renderer.forExport) {

        // The amount of pixels to scroll, the difference between chart
        // width and scrollable width
        if (scrollableMinWidth) {
            this.scrollablePixelsX = scrollablePixelsX = Math.max(
                0,
                scrollableMinWidth - this.chartWidth
            );
            if (scrollablePixelsX) {
                this.scrollablePlotBox = (
                    this.renderer.scrollablePlotBox = merge(this.plotBox)
                );
                this.plotBox.width = this.plotWidth += scrollablePixelsX;
                if (this.inverted) {
                    this.clipBox.height += scrollablePixelsX;
                } else {
                    this.clipBox.width += scrollablePixelsX;
                }

                corrections = {
                    // Corrections for right side
                    1: { name: 'right', value: scrollablePixelsX }
                };
            }

        // Currently we can only do either X or Y
        } else if (scrollableMinHeight) {
            this.scrollablePixelsY = scrollablePixelsY = Math.max(
                0,
                scrollableMinHeight - this.chartHeight
            );
            if (defined(scrollablePixelsY)) {
                this.scrollablePlotBox = (
                    this.renderer.scrollablePlotBox = merge(this.plotBox)
                );
                this.plotBox.height = this.plotHeight += scrollablePixelsY;
                if (this.inverted) {
                    this.clipBox.width += scrollablePixelsY;
                } else {
                    this.clipBox.height += scrollablePixelsY;
                }
                corrections = {
                    2: { name: 'bottom', value: scrollablePixelsY }
                };
            }
        }

        if (corrections && !e.skipAxes) {
            this.axes.forEach(function (axis): void {
                // For right and bottom axes, only fix the plot line length
                if ((corrections as any)[axis.side]) {
                    // Get the plot lines right in getPlotLinePath,
                    // temporarily set it to the adjusted plot width.
                    axis.getPlotLinePath = function (this): SVGPath {
                        let marginName = (corrections as any)[axis.side].name,
                            correctionValue =
                                (corrections as any)[axis.side].value,
                            // axis.right or axis.bottom
                            margin = (this as any)[marginName],
                            path: SVGPath;

                        // Temporarily adjust
                        (this as any)[marginName] = margin - correctionValue;
                        path = Axis.prototype.getPlotLinePath.apply(
                            this,
                            arguments as any
                        ) as any;
                        // Reset
                        (this as any)[marginName] = margin;
                        return path;
                    };

                } else {
                    // Apply the corrected plotWidth
                    axis.setAxisSize();
                    axis.setAxisTranslation();
                }
            });
        }
    }
});

addEvent(Chart, 'render', function (): void {
    if (this.scrollablePixelsX || this.scrollablePixelsY) {
        if (this.setUpScrolling) {
            this.setUpScrolling();
        }
        this.applyFixed();

    } else if (this.fixedDiv) { // Has been in scrollable mode
        this.applyFixed();
    }
});

/**
 * @private
 * @function Highcharts.Chart#setUpScrolling
 * @return {void}
 */
Chart.prototype.setUpScrolling = function (): void {

    const css: CSSObject = {
        WebkitOverflowScrolling: 'touch',
        overflowX: 'hidden',
        overflowY: 'hidden'
    };

    if (this.scrollablePixelsX) {
        css.overflowX = 'auto';
    }
    if (this.scrollablePixelsY) {
        css.overflowY = 'auto';
    }

    // Insert a container with position relative
    // that scrolling and fixed container renders to (#10555)
    this.scrollingParent = createElement(
        'div',
        {
            className: 'highcharts-scrolling-parent'
        },
        {
            position: 'relative'
        },
        this.renderTo
    );

    // Add the necessary divs to provide scrolling
    this.scrollingContainer = createElement('div', {
        'className': 'highcharts-scrolling'
    }, css, this.scrollingParent);

    // On scroll, reset the chart position because it applies to the scrolled
    // container
    let lastHoverPoint: typeof this.hoverPoint;
    addEvent(this.scrollingContainer, 'scroll', (): void => {
        if (this.pointer) {
            delete this.pointer.chartPosition;
            if (this.hoverPoint) {
                lastHoverPoint = this.hoverPoint;
            }
            this.pointer.runPointActions(void 0, lastHoverPoint, true);
        }
    });

    this.innerContainer = createElement('div', {
        'className': 'highcharts-inner-container'
    }, null as any, this.scrollingContainer);

    // Now move the container inside
    this.innerContainer.appendChild(this.container);

    // Don't run again
    this.setUpScrolling = null as any;
};

/**
 * These elements are moved over to the fixed renderer and stay fixed when the
 * user scrolls the chart
 * @private
 */
Chart.prototype.moveFixedElements = function (): void {
    let container = this.container,
        fixedRenderer = this.fixedRenderer,
        fixedSelectors = [
            '.highcharts-breadcrumbs-group',
            '.highcharts-contextbutton',
            '.highcharts-credits',
            '.highcharts-legend',
            '.highcharts-legend-checkbox',
            '.highcharts-navigator-series',
            '.highcharts-navigator-xaxis',
            '.highcharts-navigator-yaxis',
            '.highcharts-navigator',
            '.highcharts-reset-zoom',
            '.highcharts-drillup-button',
            '.highcharts-scrollbar',
            '.highcharts-subtitle',
            '.highcharts-title'
        ],
        axisClass;

    if (this.scrollablePixelsX && !this.inverted) {
        axisClass = '.highcharts-yaxis';
    } else if (this.scrollablePixelsX && this.inverted) {
        axisClass = '.highcharts-xaxis';
    } else if (this.scrollablePixelsY && !this.inverted) {
        axisClass = '.highcharts-xaxis';
    } else if (this.scrollablePixelsY && this.inverted) {
        axisClass = '.highcharts-yaxis';
    }

    if (axisClass) {
        fixedSelectors.push(
            `${axisClass}:not(.highcharts-radial-axis)`,
            `${axisClass}-labels:not(.highcharts-radial-axis-labels)`
        );
    }

    fixedSelectors.forEach(function (className: string): void {
        [].forEach.call(
            container.querySelectorAll(className),
            function (elem: DOMElementType): void {
                (
                    elem.namespaceURI === (fixedRenderer as any).SVG_NS ?
                        (fixedRenderer as any).box :
                        (fixedRenderer as any).box.parentNode
                ).appendChild(elem);
                elem.style.pointerEvents = 'auto';
            }
        );
    });
};

/**
 * @private
 * @function Highcharts.Chart#applyFixed
 * @return {void}
 */
Chart.prototype.applyFixed = function (): void {
    const firstTime = !this.fixedDiv,
        chartOptions = this.options.chart as any,
        scrollableOptions = chartOptions.scrollablePlotArea,
        Renderer = RendererRegistry.getRendererType();

    let fixedRenderer,
        scrollableWidth,
        scrollableHeight;

    // First render
    if (firstTime) {
        this.fixedDiv = createElement(
            'div',
            {
                className: 'highcharts-fixed'
            },
            {
                position: 'absolute',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: (
                    chartOptions.style && chartOptions.style.zIndex || 0
                ) + 2,
                top: 0
            },
            null as any,
            true
        );
        if (this.scrollingContainer) {
            this.scrollingContainer.parentNode.insertBefore(
                this.fixedDiv,
                this.scrollingContainer
            );
        }
        this.renderTo.style.overflow = 'visible';

        this.fixedRenderer = fixedRenderer = new Renderer(
            this.fixedDiv,
            this.chartWidth,
            this.chartHeight,
            this.options.chart.style
        );
        // Mask
        this.scrollableMask = fixedRenderer
            .path()
            .attr({
                fill: this.options.chart.backgroundColor || '#fff',
                'fill-opacity': pick(scrollableOptions.opacity, 0.85),
                zIndex: -1
            })
            .addClass('highcharts-scrollable-mask')
            .add();

        addEvent(this, 'afterShowResetZoom', this.moveFixedElements);
        addEvent(this, 'afterApplyDrilldown', this.moveFixedElements);
        addEvent(this, 'afterLayOutTitles', this.moveFixedElements);

    } else {

        // Set the size of the fixed renderer to the visible width
        (this.fixedRenderer as any).setSize(
            this.chartWidth,
            this.chartHeight
        );
    }

    if (this.scrollableDirty || firstTime) {
        this.scrollableDirty = false;
        this.moveFixedElements();
    }

    // Increase the size of the scrollable renderer and background
    scrollableWidth = this.chartWidth + (this.scrollablePixelsX || 0);
    scrollableHeight = this.chartHeight + (this.scrollablePixelsY || 0);
    stop(this.container as any);
    this.container.style.width = scrollableWidth + 'px';
    this.container.style.height = scrollableHeight + 'px';
    this.renderer.boxWrapper.attr({
        width: scrollableWidth,
        height: scrollableHeight,
        viewBox: [0, 0, scrollableWidth, scrollableHeight].join(' ')
    });
    (this.chartBackground as any).attr({
        width: scrollableWidth,
        height: scrollableHeight
    });

    (this.scrollingContainer as any).style.height = this.chartHeight + 'px';

    // Set scroll position
    if (firstTime) {

        if (scrollableOptions.scrollPositionX) {
            (this.scrollingContainer as any).scrollLeft =
                (this.scrollablePixelsX as any) *
                scrollableOptions.scrollPositionX;
        }
        if (scrollableOptions.scrollPositionY) {
            (this.scrollingContainer as any).scrollTop =
                (this.scrollablePixelsY as any) *
                scrollableOptions.scrollPositionY;
        }
    }

    // Mask behind the left and right side
    let axisOffset = this.axisOffset,
        maskTop = this.plotTop - axisOffset[0] - 1,
        maskLeft = this.plotLeft - axisOffset[3] - 1,
        maskBottom = this.plotTop + this.plotHeight + axisOffset[2] + 1,
        maskRight = this.plotLeft + this.plotWidth + axisOffset[1] + 1,
        maskPlotRight = this.plotLeft + this.plotWidth -
            (this.scrollablePixelsX || 0),
        maskPlotBottom = this.plotTop + this.plotHeight -
            (this.scrollablePixelsY || 0),
        d: SVGPath;


    if (this.scrollablePixelsX) {
        d = [
            // Left side
            ['M', 0, maskTop],
            ['L', this.plotLeft - 1, maskTop],
            ['L', this.plotLeft - 1, maskBottom],
            ['L', 0, maskBottom],
            ['Z'],

            // Right side
            ['M', maskPlotRight, maskTop],
            ['L', this.chartWidth, maskTop],
            ['L', this.chartWidth, maskBottom],
            ['L', maskPlotRight, maskBottom],
            ['Z']
        ];
    } else if (this.scrollablePixelsY) {
        d = [
            // Top side
            ['M', maskLeft, 0],
            ['L', maskLeft, this.plotTop - 1],
            ['L', maskRight, this.plotTop - 1],
            ['L', maskRight, 0],
            ['Z'],

            // Bottom side
            ['M', maskLeft, maskPlotBottom],
            ['L', maskLeft, this.chartHeight],
            ['L', maskRight, this.chartHeight],
            ['L', maskRight, maskPlotBottom],
            ['Z']
        ];
    } else {
        d = [['M', 0, 0]];
    }

    if (this.redrawTrigger !== 'adjustHeight') {
        (this.scrollableMask as any).attr({ d });
    }
};

addEvent(Axis, 'afterInit', function (): void {
    this.chart.scrollableDirty = true;
});

addEvent(Series, 'show', function (): void {
    this.chart.scrollableDirty = true;
});

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

(''); // keep doclets above in transpiled file
