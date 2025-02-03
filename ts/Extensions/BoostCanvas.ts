/* *
 *
 *  License: www.highcharts.com/license
 *  Author: Torstein Honsi, Christer Vasseng
 *
 *  This module serves as a fallback for the Boost module in IE9 and IE10. Newer
 *  browsers support WebGL which is faster.
 *
 *  It is recommended to include this module in conditional comments targeting
 *  IE9 and IE10.
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

import type AreaSeries from '../Series/Area/AreaSeries';
import type {
    BoostTargetAdditions,
    BoostTargetObject
} from './Boost/BoostTargetObject';
import type BubbleSeries from '../Series/Bubble/BubbleSeries';
import type Chart from '../Core/Chart/Chart';
import type ColumnSeries from '../Series/Column/ColumnSeries';
import type HeatmapSeries from '../Series/Heatmap/HeatmapSeries';
import type HTMLElement from '../Core/Renderer/HTML/HTMLElement';
import type { TypedArray } from '../Core/Series/SeriesOptions';
import type ScatterSeries from '../Series/Scatter/ScatterSeries';
import type Series from '../Core/Series/Series';
import type SeriesRegistry from '../Core/Series/SeriesRegistry';
import type SVGAttributes from '../Core/Renderer/SVG/SVGAttributes';

import BoostChart from './Boost/BoostChart.js';
const {
    getBoostClipRect,
    isChartSeriesBoosting
} = BoostChart;
import BoostSeries from './Boost/BoostSeries.js';
const { destroyGraphics } = BoostSeries;
import Color from '../Core/Color/Color.js';
const { parse: color } = Color;
import H from '../Core/Globals.js';
const {
    doc,
    noop
} = H;
import { Palette } from '../Core/Color/Palettes.js';
import U from '../Core/Utilities.js';
const {
    addEvent,
    fireEvent,
    isNumber,
    merge,
    pick,
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './Boost/BoostOptions' {
    interface BoostOptions {
        timeRendering?: boolean;
        timeSeriesProcessing?: boolean;
        timeSetup?: boolean;
    }
}

declare module '../Core/Series/SeriesLike' {
    interface SeriesLike extends BoostTargetObject {
        cvsStrokeBatch?: number;
        /** @requires modules/boost-canvas */
        canvasToSVG(): void;
        /** @requires modules/boost-canvas */
        cvsDrawPoint(
            ctx: CanvasRenderingContext2D,
            clientX: number,
            plotY: number,
            yBottom: number,
            lastPoint?: Record<string, number>
        ): void;
        /** @requires modules/boost-canvas */
        cvsLineTo(
            ctx: CanvasRenderingContext2D,
            clientX: number,
            plotY: number
        ): void;
        /** @requires modules/boost-canvas */
        cvsMarkerCircle(
            ctx: CanvasRenderingContext2D,
            clientX: number,
            plotY: number,
            r: number,
            i?: number
        ): void;
        /** @requires modules/boost-canvas */
        cvsMarkerSquare(
            ctx: CanvasRenderingContext2D,
            clientX: number,
            plotY: number,
            r: number
        ): void;
        /** @requires modules/boost-canvas */
        getContext(): (CanvasRenderingContext2D|null|undefined);
        /** @requires modules/boost-canvas */
        renderCanvas(): void;
    }
}

/* *
 *
 *  Namespace
 *
 * */

namespace BoostCanvas {

    /* *
     *
     *  Constants
     *
     * */

    // Use a blank pixel for clearing canvas (#17182)
    const b64BlankPixel = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAw' +
        'CAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    );

    const CHUNK_SIZE = 50000;

    /* *
     *
     *  Variables
     *
     * */

    let ChartConstructor: typeof Chart;

    let destroyLoadingDiv: number;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    function areaCvsDrawPoint(
        this: AreaSeries,
        ctx: CanvasRenderingContext2D,
        clientX: number,
        plotY: number,
        yBottom: number,
        lastPoint: Record<string, number>
    ): void {
        if (lastPoint && clientX !== lastPoint.clientX) {
            ctx.moveTo(lastPoint.clientX as any, lastPoint.yBottom as any);
            ctx.lineTo(lastPoint.clientX as any, lastPoint.plotY as any);
            ctx.lineTo(clientX, plotY);
            ctx.lineTo(clientX, yBottom);
        }
    }

    /**
     * @private
     */
    function bubbleCvsMarkerCircle(
        this: BubbleSeries,
        ctx: CanvasRenderingContext2D,
        clientX: number,
        plotY: number,
        r: number,
        i?: number
    ): void {
        ctx.moveTo(clientX, plotY);
        ctx.arc(
            clientX,
            plotY,
            this.radii && (this.radii[i as any] as any),
            0,
            2 * Math.PI,
            false
        );
    }

    /**
     * @private
     */
    function columnCvsDrawPoint(
        this: ColumnSeries,
        ctx: CanvasRenderingContext2D,
        clientX: number,
        plotY: number,
        yBottom: number
    ): void {
        ctx.rect(clientX - 1, plotY, 1, yBottom - plotY);
    }

    /**
     * @private
     */
    export function compose(
        ChartClass: typeof Chart,
        SeriesClass: typeof Series,
        seriesTypes: typeof SeriesRegistry.seriesTypes
    ): void {
        const seriesProto = SeriesClass.prototype;

        if (!seriesProto.renderCanvas) {
            const {
                area: AreaSeries,
                bubble: BubbleSeries,
                column: ColumnSeries,
                heatmap: HeatmapSeries,
                scatter: ScatterSeries
            } = seriesTypes;

            ChartConstructor = ChartClass;
            ChartClass.prototype.callbacks.push((chart): void => {
                addEvent(chart, 'predraw', onChartClear);
                addEvent(chart, 'render', onChartCanvasToSVG);
            });

            seriesProto.canvasToSVG = seriesCanvasToSVG;
            seriesProto.cvsLineTo = seriesCvsLineTo;
            seriesProto.getContext = seriesGetContext;
            seriesProto.renderCanvas = seriesRenderCanvas;

            if (AreaSeries) {
                const areaProto = AreaSeries.prototype;

                areaProto.cvsDrawPoint = areaCvsDrawPoint;
                areaProto.fill = true;
                areaProto.fillOpacity = true;
                areaProto.sampling = true;
            }

            if (BubbleSeries) {
                const bubbleProto = BubbleSeries.prototype;

                bubbleProto.cvsMarkerCircle = bubbleCvsMarkerCircle;
                bubbleProto.cvsStrokeBatch = 1;
            }

            if (ColumnSeries) {
                const columnProto = ColumnSeries.prototype;

                columnProto.cvsDrawPoint = columnCvsDrawPoint;
                columnProto.fill = true;
                columnProto.sampling = true;
            }

            if (HeatmapSeries) {
                const heatmapProto = HeatmapSeries.prototype;

                wrap(heatmapProto, 'drawPoints', wrapHeatmapDrawPoints);
            }

            if (ScatterSeries) {
                const scatterProto = ScatterSeries.prototype;

                scatterProto.cvsMarkerCircle = scatterCvsMarkerCircle;
                scatterProto.cvsMarkerSquare = scatterCvsMarkerSquare;
                scatterProto.fill = true;
            }
        }

    }

    /**
     * @private
     */
    function onChartCanvasToSVG(
        this: Chart
    ): void {
        if (this.boost && this.boost.copy) {
            this.boost.copy();
        }
    }

    /**
     * @private
     */
    function onChartClear(this: Chart): void {
        const boost = this.boost || {};

        if (boost.target) {
            boost.target.attr({ href: b64BlankPixel });
        }

        if (boost.canvas) {
            (boost.canvas.getContext('2d') as any).clearRect(
                0,
                0,
                boost.canvas.width,
                boost.canvas.height
            );
        }
    }

    /**
     * Draw the canvas image inside an SVG image
     *
     * @private
     * @function Highcharts.Series#canvasToSVG
     */
    function seriesCanvasToSVG(
        this: Series
    ): void {
        if (!isChartSeriesBoosting(this.chart)) {
            if (this.boost && this.boost.copy) {
                this.boost.copy();
            } else if (this.chart.boost && this.chart.boost.copy) {
                this.chart.boost.copy();
            }
        } else if (this.boost && this.boost.clear) {
            this.boost.clear();
        }
    }

    /**
     * @private
     */
    function seriesCvsLineTo(
        this: Series,
        ctx: CanvasRenderingContext2D,
        clientX: number,
        plotY: number
    ): void {
        ctx.lineTo(clientX, plotY);
    }

    /**
     * Create a hidden canvas to draw the graph on. The contents is later
     * copied over to an SVG image element.
     *
     * @private
     * @function Highcharts.Series#getContext
     */
    function seriesGetContext(
        this: Series
    ): (CanvasRenderingContext2D|null|undefined) {
        const chart = this.chart,
            target: BoostTargetObject =
                isChartSeriesBoosting(chart) ? chart : this,
            targetGroup = (
                target === chart ?
                    chart.seriesGroup :
                    chart.seriesGroup || this.group
            ),
            width = chart.chartWidth,
            height = chart.chartHeight,
            swapXY = function (
                this: CanvasRenderingContext2D,
                proceed: Function,
                x: number,
                y: number,
                a?: number,
                b?: number,
                c?: number,
                d?: boolean
            ): void {
                proceed.call(this, y, x, a, b, c, d);
            };

        let ctx: CanvasRenderingContext2D;

        const boost: Required<BoostTargetAdditions> = target.boost =
            target.boost as Required<BoostTargetAdditions> ||
            {} as Required<BoostTargetAdditions>;

        ctx = boost.targetCtx;

        if (!boost.canvas) {
            boost.canvas = doc.createElement('canvas');

            boost.target = chart.renderer
                .image('', 0, 0, width, height)
                .addClass('highcharts-boost-canvas')
                .add(targetGroup);

            ctx = boost.targetCtx =
                boost.canvas.getContext('2d') as CanvasRenderingContext2D;

            if (chart.inverted) {
                (['moveTo', 'lineTo', 'rect', 'arc'] as const).forEach((
                    fn
                ): void => {
                    wrap(ctx, fn, swapXY);
                });
            }

            boost.copy = function (): void {
                boost.target.attr({
                    href: boost.canvas.toDataURL('image/png')
                });
            };

            boost.clear = function (): void {
                ctx.clearRect(
                    0,
                    0,
                    boost.canvas.width,
                    boost.canvas.height
                );

                if (target === boost.target) {
                    boost.target.attr({
                        href: b64BlankPixel
                    });
                }
            };

            boost.clipRect = chart.renderer.clipRect();
            boost.target.clip(boost.clipRect);

        } else if (!(target instanceof ChartConstructor)) {
            ///  ctx.clearRect(0, 0, width, height);
        }

        if (boost.canvas.width !== width) {
            boost.canvas.width = width;
        }

        if (boost.canvas.height !== height) {
            boost.canvas.height = height;
        }

        boost.target.attr({
            x: 0,
            y: 0,
            width: width,
            height: height,
            style: 'pointer-events: none',
            href: b64BlankPixel
        });

        if (boost.clipRect) {
            boost.clipRect.attr(getBoostClipRect(chart, target));
        }

        return ctx;
    }

    /**
     * @private
     */
    function seriesRenderCanvas(
        this: Series
    ): void {
        const series = this,
            options = series.options,
            chart = series.chart,
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            activeBoostSettings = chart.options.boost || {},
            boostSettings = {
                timeRendering: activeBoostSettings.timeRendering || false,
                timeSeriesProcessing:
                    activeBoostSettings.timeSeriesProcessing || false,
                timeSetup: activeBoostSettings.timeSetup || false
            },
            xData = series.getColumn('x', true),
            yData = series.getColumn('y', true),
            rawData = options.data || [],
            xExtremes = xAxis.getExtremes(),
            xMin = xExtremes.min,
            xMax = xExtremes.max,
            yExtremes = yAxis.getExtremes(),
            yMin = yExtremes.min,
            yMax = yExtremes.max,
            pointTaken: Record<string, boolean> = {},
            sampling = !!series.sampling,
            r = options.marker && options.marker.radius,
            strokeBatch = series.cvsStrokeBatch || 1000,
            enableMouseTracking = options.enableMouseTracking,
            threshold: number = options.threshold as any,
            hasThreshold = isNumber(threshold),
            translatedThreshold: number = yAxis.getThreshold(threshold),
            doFill = series.fill,
            isRange = (
                series.pointArrayMap &&
                series.pointArrayMap.join(',') === 'low,high'
            ),
            isStacked = !!options.stacking,
            cropStart = series.cropStart || 0,
            loadingOptions = chart.options.loading,
            requireSorting = series.requireSorting,
            connectNulls = options.connectNulls,
            useRaw = !xData,
            sdata: Array<any>|TypedArray = (
                isStacked ?
                    series.data :
                    (xData || rawData)
            ),
            fillColor = (
                series.fillOpacity ?
                    Color.parse(series.color).setOpacity(
                        pick((options as any).fillOpacity, 0.75)
                    ).get() :
                    series.color
            ),
            compareX = options.findNearestPointBy === 'x',
            boost: BoostTargetAdditions = this.boost || {},
            cvsDrawPoint = series.cvsDrawPoint,
            cvsLineTo = options.lineWidth ? series.cvsLineTo : void 0,
            cvsMarker: (typeof series['cvsMarkerCircle']) = (
                r && r <= 1 ?
                    series.cvsMarkerSquare :
                    series.cvsMarkerCircle
            );

        if (boost.target) {
            boost.target.attr({ href: b64BlankPixel });
        }

        // If we are zooming out from SVG mode, destroy the graphics
        if (series.points || series.graph) {
            destroyGraphics(series);
        }

        // The group
        series.plotGroup(
            'group',
            'series',
            series.visible ? 'visible' : 'hidden',
            options.zIndex,
            chart.seriesGroup
        );

        series.markerGroup = series.group;
        addEvent(series, 'destroy', function (): void {
            // Prevent destroy twice
            series.markerGroup = null as any;
        });

        const points: Array<Record<string, number>> = this.points = [],
            ctx = this.getContext();
        series.buildKDTree = noop; // Do not start building while drawing

        if (boost.clear) {
            boost.clear();
        }

        // If (series.canvas) {
        //     ctx.clearRect(
        //         0,
        //         0,
        //         series.canvas.width,
        //         series.canvas.height
        //     );
        // }

        if (!series.visible) {
            return;
        }

        // Display a loading indicator
        if (rawData.length > 99999) {
            chart.options.loading = merge(loadingOptions, {
                labelStyle: {
                    backgroundColor: color(
                        Palette.backgroundColor
                    ).setOpacity(0.75).get(),
                    padding: '1em',
                    borderRadius: '0.5em'
                },
                style: {
                    backgroundColor: 'none',
                    opacity: 1
                }
            });
            U.clearTimeout(destroyLoadingDiv);
            chart.showLoading('Drawing...');
            chart.options.loading = loadingOptions; // Reset
        }

        if (boostSettings.timeRendering) {
            console.time('canvas rendering'); // eslint-disable-line no-console
        }

        // Loop variables
        let c = 0,
            lastClientX: number,
            lastPoint: Record<string, number>,
            yBottom = translatedThreshold,
            wasNull: boolean,
            minVal: number,
            maxVal: number,
            minI: (number|undefined),
            maxI: (number|undefined),
            index: (number|string);

        // Loop helpers
        const stroke = function (): void {
                if (doFill) {
                    (ctx as any).fillStyle = fillColor as any;
                    (ctx as any).fill();
                } else {
                    (ctx as any).strokeStyle = series.color as any;
                    (ctx as any).lineWidth = options.lineWidth as any;
                    (ctx as any).stroke();
                }
            },
            //
            drawPoint = function (
                clientX: number,
                plotY: number,
                yBottom: number,
                i: number
            ): void {
                if (c === 0) {
                    (ctx as any).beginPath();

                    if (cvsLineTo) {
                        (ctx as any).lineJoin = 'round';
                    }
                }

                if (
                    chart.scroller &&
                    series.options.className ===
                        'highcharts-navigator-series'
                ) {
                    plotY += chart.scroller.top;
                    if (yBottom) {
                        yBottom += chart.scroller.top;
                    }
                } else {
                    plotY += chart.plotTop;
                }

                clientX += chart.plotLeft;

                if (wasNull) {
                    (ctx as any).moveTo(clientX, plotY);
                } else {
                    if (cvsDrawPoint) {
                        cvsDrawPoint(
                            ctx as any,
                            clientX,
                            plotY,
                            yBottom,
                            lastPoint
                        );
                    } else if (cvsLineTo) {
                        cvsLineTo(ctx as any, clientX, plotY);
                    } else if (cvsMarker) {
                        cvsMarker.call(
                            series,
                            ctx as any,
                            clientX,
                            plotY,
                            r as any,
                            i
                        );
                    }
                }

                // We need to stroke the line for every 1000 pixels. It will
                // crash the browser memory use if we stroke too
                // infrequently.
                c = c + 1;
                if (c === strokeBatch) {
                    stroke();
                    c = 0;
                }

                // Area charts need to keep track of the last point
                lastPoint = {
                    clientX: clientX,
                    plotY: plotY,
                    yBottom: yBottom
                };
            },
            xDataFull: Array<number> = (
                (this.getColumn('x').length ? this.getColumn('x') : void 0) ||
                (this.options as any).xData ||
                (
                    this.getColumn('x', true).length ?
                        this.getColumn('x', true) :
                        false
                )
            ),
            //
            addKDPoint = function (
                clientX: number,
                plotY: number,
                i: number
            ): void {
                // Shaves off about 60ms compared to repeated concatenation
                index = compareX ? clientX : clientX + ',' + plotY;

                // The k-d tree requires series points.
                // Reduce the amount of points, since the time to build the
                // tree increases exponentially.
                if (enableMouseTracking && !pointTaken[index]) {
                    pointTaken[index] = true;

                    if (chart.inverted) {
                        clientX = xAxis.len - clientX;
                        plotY = yAxis.len - plotY;
                    }

                    points.push({
                        x: xDataFull ?
                            xDataFull[cropStart + i] :
                            (false as any),
                        clientX: clientX,
                        plotX: clientX,
                        plotY: plotY,
                        i: cropStart + i
                    });
                }
            };

        // Loop over the points
        BoostSeries.eachAsync(sdata, (d: any, i: number): boolean => {
            const chartDestroyed = typeof chart.index === 'undefined';

            let x: number,
                y: number,
                clientX: number,
                plotY: number,
                isNull: boolean,
                low: (number|undefined),
                isNextInside = false,
                isPrevInside = false,
                nx: number = NaN,
                px: number = NaN,
                isYInside = true;

            if (!chartDestroyed) {
                if (useRaw) {
                    x = d[0];
                    y = d[1];

                    if (sdata[i + 1]) {
                        nx = sdata[i + 1][0];
                    }

                    if (sdata[i - 1]) {
                        px = sdata[i - 1][0];
                    }
                } else {
                    x = d;
                    y = yData[i];

                    if (sdata[i + 1]) {
                        nx = sdata[i + 1];
                    }

                    if (sdata[i - 1]) {
                        px = sdata[i - 1];
                    }
                }

                if (nx && nx >= xMin && nx <= xMax) {
                    isNextInside = true;
                }

                if (px && px >= xMin && px <= xMax) {
                    isPrevInside = true;
                }

                // Resolve low and high for range series
                if (isRange) {
                    if (useRaw) {
                        y = d.slice(1, 3);
                    }
                    low = (y as any)[0];
                    y = (y as any)[1];
                } else if (isStacked) {
                    x = d.x;
                    y = d.stackY;
                    low = y - d.y;
                }

                isNull = y === null;

                // Optimize for scatter zooming
                if (!requireSorting) {
                    isYInside = y >= yMin && y <= yMax;
                }

                if (
                    !isNull &&
                    (
                        (x >= xMin && x <= xMax && isYInside) ||
                        (isNextInside || isPrevInside)
                    )) {


                    clientX = Math.round(xAxis.toPixels(x, true));

                    if (sampling) {
                        if (
                            typeof minI === 'undefined' ||
                            clientX === lastClientX
                        ) {
                            if (!isRange) {
                                low = y;
                            }
                            if (typeof maxI === 'undefined' || y > maxVal) {
                                maxVal = y;
                                maxI = i;
                            }
                            if (
                                typeof minI === 'undefined' ||
                                (low as any) < minVal
                            ) {
                                minVal = low as any;
                                minI = i;
                            }

                        }
                        // Add points and reset
                        if (clientX !== lastClientX) {
                            // `maxI` also a number:
                            if (typeof minI !== 'undefined') {
                                plotY = yAxis.toPixels(maxVal, true);
                                yBottom = yAxis.toPixels(minVal, true);
                                drawPoint(
                                    clientX,
                                    hasThreshold ?
                                        Math.min(
                                            plotY,
                                            translatedThreshold
                                        ) : plotY,
                                    hasThreshold ?
                                        Math.max(
                                            yBottom,
                                            translatedThreshold
                                        ) : yBottom,
                                    i
                                );
                                addKDPoint(clientX, plotY, maxI as any);
                                if (yBottom !== plotY) {
                                    addKDPoint(clientX, yBottom, minI);
                                }
                            }

                            minI = maxI = void 0;
                            lastClientX = clientX;
                        }
                    } else {
                        plotY = Math.round(yAxis.toPixels(y, true));
                        drawPoint(clientX, plotY, yBottom, i);
                        addKDPoint(clientX, plotY, i);
                    }
                }
                wasNull = isNull && !connectNulls;

                if (i % CHUNK_SIZE === 0) {
                    if (
                        series.boost &&
                        series.boost.copy
                    ) {
                        series.boost.copy();
                    } else if (
                        series.chart.boost &&
                        series.chart.boost.copy
                    ) {
                        series.chart.boost.copy();
                    }
                }
            }

            return !chartDestroyed;
        }, function (): void {
            const loadingDiv: HTMLElement =
                    chart.loadingDiv as any,
                loadingShown = chart.loadingShown;

            stroke();

            // If (series.boostCopy || series.chart.boostCopy) {
            //     (series.boostCopy || series.chart.boostCopy)();
            // }

            series.canvasToSVG();

            if (boostSettings.timeRendering) {
                console.timeEnd('canvas rendering'); // eslint-disable-line no-console
            }

            fireEvent(series, 'renderedCanvas');

            // Do not use chart.hideLoading, as it runs JS animation and
            // will be blocked by buildKDTree. CSS animation looks good, but
            // then it must be deleted in timeout. If we add the module to
            // core, change hideLoading so we can skip this block.
            if (loadingShown) {
                loadingDiv.style.transition = 'opacity 250ms';
                loadingDiv.opacity = 0 as any;
                chart.loadingShown = false;
                destroyLoadingDiv = setTimeout(function (): void {
                    if (loadingDiv.parentNode) { // In exporting it is falsy
                        loadingDiv.parentNode.removeChild(loadingDiv);
                    }
                    chart.loadingDiv = chart.loadingSpan = null as any;
                }, 250);
            }

            // Go back to prototype, ready to build
            delete (series as any).buildKDTree;

            series.buildKDTree();

        // Don't do async on export, the exportChart, getSVGForExport and
        // getSVG methods are not chained for it.
        }, chart.renderer.forExport ? Number.MAX_VALUE : void 0);
    }

    /**
     * @private
     */
    function scatterCvsMarkerCircle(
        this: ScatterSeries,
        ctx: CanvasRenderingContext2D,
        clientX: number,
        plotY: number,
        r: number
    ): void {
        ctx.moveTo(clientX, plotY);
        ctx.arc(clientX, plotY, r, 0, 2 * Math.PI, false);
    }

    /**
     * Rect is twice as fast as arc, should be used for small markers.
     * @private
     */
    function scatterCvsMarkerSquare(
        this: ScatterSeries,
        ctx: CanvasRenderingContext2D,
        clientX: number,
        plotY: number,
        r: number
    ): void {
        ctx.rect(clientX - r, plotY - r, r * 2, r * 2);
    }

    /**
     * @private
     */
    function wrapHeatmapDrawPoints(
        this: HeatmapSeries
    ): void {
        const chart = this.chart,
            ctx = this.getContext(),
            inverted = this.chart.inverted,
            xAxis = this.xAxis,
            yAxis = this.yAxis;

        if (ctx) {

            // Draw the columns
            this.points.forEach((point): void => {
                const plotY = point.plotY;
                let pointAttr: SVGAttributes;

                if (
                    typeof plotY !== 'undefined' &&
                    !isNaN(plotY) &&
                    point.y !== null &&
                    ctx
                ) {
                    const { x = 0, y = 0, width = 0, height = 0 } =
                        point.shapeArgs || {};

                    if (!chart.styledMode) {
                        pointAttr = point.series.pointAttribs(point);
                    } else {
                        pointAttr = point.series.colorAttribs(point);
                    }

                    ctx.fillStyle = pointAttr.fill as any;

                    if (inverted) {
                        ctx.fillRect(
                            yAxis.len - y + xAxis.left,
                            xAxis.len - x + yAxis.top,
                            -height,
                            -width
                        );
                    } else {
                        ctx.fillRect(
                            x + xAxis.left,
                            y + yAxis.top,
                            width,
                            height
                        );
                    }
                }
            });

            this.canvasToSVG();

        } else {
            this.chart.showLoading(
                'Your browser doesn\'t support HTML5 canvas, <br>' +
                'please use a modern browser'
            );
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default BoostCanvas;
