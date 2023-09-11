/* *
 *
 *  Copyright (c) 2019-2021 Highsoft AS
 *
 *  Boost module: stripped-down renderer for higher performance
 *
 *  License: highcharts.com/license
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

import type { BoostChartComposition } from './BoostChart';
import type {
    BoostTargetAdditions,
    BoostTargetObject
} from './BoostTargetObject';
import type Chart from '../../Core/Chart/Chart';
import type DataExtremesObject from '../../Core/Series/DataExtremesObject';
import type LineSeries from '../../Series/Line/LineSeries';
import type Point from '../../Core/Series/Point';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type Series from '../../Core/Series/Series';
import type SeriesRegistry from '../../Core/Series/SeriesRegistry';
import type { SeriesTypePlotOptions } from '../../Core/Series/SeriesType';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import BoostableMap from './BoostableMap.js';
import Boostables from './Boostables.js';
import BoostChart from './BoostChart.js';
const {
    getBoostClipRect,
    isChartSeriesBoosting
} = BoostChart;
import D from '../../Core/Defaults.js';
const { getOptions } = D;
import H from '../../Core/Globals.js';
const {
    doc,
    noop,
    win
} = H;
import U from '../../Shared/Utilities.js';
const {
    pick,
    wrap
} = U;
import WGLRenderer from './WGLRenderer.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend
} = OH;
import EH from '../../Shared/Helpers/EventHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
import error from '../../Shared/Helpers/Error.js';
const {
    pushUnique
} = AH;
const { isArray, isNumber } = TC;
const { addEvent, fireEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike extends BoostTargetObject {
        boosted?: boolean;
        boost?: BoostSeriesAdditions;
        fill?: boolean;
        fillOpacity?: boolean;
        sampling?: boolean;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        boostData?: Array<unknown>;
        xData?: Array<number>;
        yData?: Array<(number|null)>;
    }
}

interface BoostAlteredObject {
    own: boolean;
    prop: ('allowDG'|'directTouch'|'stickyTracking');
    val: unknown;
    value?: unknown;
}

interface BoostPointMockup {
    destroy(): void;
    x: (false|number);
    clientX: number;
    dist?: number;
    distX?: number;
    plotX: number;
    plotY: number;
    i: number;
    percentage: number;
}

interface BoostSeriesAdditions extends BoostTargetAdditions {
    altered?: Array<BoostAlteredObject>;
    getPoint(boostPoint: (BoostPointMockup|Point)): BoostPointComposition;
}

export declare class BoostPointComposition extends Point {
    series: BoostSeriesComposition;
    init(
        series: BoostSeriesComposition,
        options: (PointOptions|PointShortOptions),
        x?: number
    ): BoostPointComposition;
}

export declare class BoostSeriesComposition extends Series {
    boosted?: boolean;
    boost: BoostSeriesAdditions;
    chart: BoostChartComposition;
    pointClass: typeof BoostPointComposition;
}

/* *
 *
 *  Constants
 *
 * */

const CHUNK_SIZE = 3000;

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Variables
 *
 * */

let index: (number|string),
    mainCanvas: (HTMLCanvasElement|undefined);

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function allocateIfNotSeriesBoosting(
    renderer: WGLRenderer,
    series: Series
): void {
    const boost = series.boost;

    if (renderer &&
        boost &&
        boost.target &&
        boost.canvas &&
        !isChartSeriesBoosting(series.chart)
    ) {
        renderer.allocateBufferForSingleSeries(series);
    }
}

/**
 * Return true if ths boost.enabled option is true
 *
 * @private
 * @param {Highcharts.Chart} chart
 * The chart
 * @return {boolean}
 * True, if boost is enabled.
 */
function boostEnabled(chart: Chart): boolean {
    return pick(
        (
            chart &&
            chart.options &&
            chart.options.boost &&
            chart.options.boost.enabled
        ),
        true
    );
}

/**
 * @private
 */
function compose<T extends typeof Series>(
    SeriesClass: T,
    seriesTypes: typeof SeriesRegistry.seriesTypes,
    wglMode?: boolean
): (T&typeof BoostSeriesComposition) {

    if (pushUnique(composedMembers, SeriesClass)) {
        addEvent(SeriesClass, 'destroy', onSeriesDestroy);
        addEvent(SeriesClass, 'hide', onSeriesHide);

        const seriesProto = SeriesClass.prototype as BoostSeriesComposition;

        if (wglMode) {
            seriesProto.renderCanvas = seriesRenderCanvas;
        }

        wrap(seriesProto, 'getExtremes', wrapSeriesGetExtremes);
        wrap(seriesProto, 'processData', wrapSeriesProcessData);
        wrap(seriesProto, 'searchPoint', wrapSeriesSearchPoint);

        (
            [
                'translate',
                'generatePoints',
                'drawTracker',
                'drawPoints',
                'render'
            ] as Array<(
                'translate'|
                'generatePoints'|
                'drawTracker'|
                'drawPoints'|
                'render'
            )>
        ).forEach((method): void =>
            wrapSeriesFunctions(seriesProto, seriesTypes, method)
        );
    }

    if (pushUnique(composedMembers, getOptions)) {
        const plotOptions =
            getOptions().plotOptions as SeriesTypePlotOptions;

        // Set default options
        Boostables.forEach((type: string): void => {
            const typePlotOptions = plotOptions[type];
            if (typePlotOptions) {
                typePlotOptions.boostThreshold = 5000;
                typePlotOptions.boostData = [];
                seriesTypes[type].prototype.fillOpacity = true;
            }
        });
    }

    if (wglMode) {
        const {
            area: AreaSeries,
            areaspline: AreaSplineSeries,
            bubble: BubbleSeries,
            column: ColumnSeries,
            heatmap: HeatmapSeries,
            scatter: ScatterSeries,
            treemap: TreemapSeries
        } = seriesTypes;

        if (
            AreaSeries &&
            pushUnique(composedMembers, AreaSeries)
        ) {
            extend(AreaSeries.prototype, {
                fill: true,
                fillOpacity: true,
                sampling: true
            });
        }

        if (
            AreaSplineSeries &&
            pushUnique(composedMembers, AreaSplineSeries)
        ) {
            extend(AreaSplineSeries.prototype, {
                fill: true,
                fillOpacity: true,
                sampling: true
            });
        }

        if (
            BubbleSeries &&
            pushUnique(composedMembers, BubbleSeries)
        ) {
            const bubbleProto = BubbleSeries.prototype;

            // By default, the bubble series does not use the KD-tree, so force
            // it to.
            delete (bubbleProto as Partial<Series>).buildKDTree;
            // seriesTypes.bubble.prototype.directTouch = false;

            // Needed for markers to work correctly
            wrap(
                bubbleProto,
                'markerAttribs',
                function (
                    this: typeof bubbleProto,
                    proceed: Function
                ): boolean {
                    if (this.boosted) {
                        return false;
                    }
                    return proceed.apply(this, [].slice.call(arguments, 1));
                }
            );
        }

        if (
            ColumnSeries &&
            pushUnique(composedMembers, ColumnSeries)
        ) {
            extend(ColumnSeries.prototype, {
                fill: true,
                sampling: true
            });
        }

        if (
            ScatterSeries &&
            pushUnique(composedMembers, ScatterSeries)
        ) {
            ScatterSeries.prototype.fill = true;
        }

        // We need to handle heatmaps separatly, since we can't perform the
        // size/color calculations in the shader easily.
        // @todo This likely needs future optimization.
        [HeatmapSeries, TreemapSeries].forEach((SC): void => {
            if (SC && pushUnique(composedMembers, SC)) {
                wrap(SC.prototype, 'drawPoints', wrapSeriesDrawPoints);
            }
        });
    }

    return SeriesClass as (T&typeof BoostSeriesComposition);
}

/**
 * Create a canvas + context and attach it to the target
 *
 * @private
 * @function createAndAttachRenderer
 *
 * @param {Highcharts.Chart} chart
 * the chart
 *
 * @param {Highcharts.Series} series
 * the series
 *
 * @return {Highcharts.BoostGLRenderer}
 * the canvas renderer
 */
function createAndAttachRenderer(
    chart: Chart,
    series: Series
): WGLRenderer {
    const ChartClass = chart.constructor as typeof Chart,
        targetGroup = chart.seriesGroup || series.group,
        alpha = 1;

    let width = chart.chartWidth,
        height = chart.chartHeight,
        target: BoostTargetObject = chart,
        foSupported: boolean = typeof SVGForeignObjectElement !== 'undefined';

    if (isChartSeriesBoosting(chart)) {
        target = chart;
    } else {
        target = series;
    }

    const boost: Required<BoostTargetAdditions> = target.boost =
        target.boost as Required<BoostTargetAdditions> ||
        {} as Required<BoostTargetAdditions>;

    // Support for foreignObject is flimsy as best.
    // IE does not support it, and Chrome has a bug which messes up
    // the canvas draw order.
    // As such, we force the Image fallback for now, but leaving the
    // actual Canvas path in-place in case this changes in the future.
    foSupported = false;

    if (!mainCanvas) {
        mainCanvas = doc.createElement('canvas');
    }

    if (!boost.target) {
        boost.canvas = mainCanvas;

        // Fall back to image tag if foreignObject isn't supported,
        // or if we're exporting.
        if (chart.renderer.forExport || !foSupported) {
            target.renderTarget = boost.target = chart.renderer.image(
                '',
                0,
                0,
                width,
                height
            )
                .addClass('highcharts-boost-canvas')
                .add(targetGroup);

            boost.clear = function (): void {
                boost.target.attr({
                    // Insert a blank pixel (#17182)
                    /* eslint-disable-next-line max-len*/
                    href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                });
            };

            boost.copy = function (): void {
                boost.resize();
                boost.target.attr({
                    href: boost.canvas.toDataURL('image/png')
                });
            };

        } else {
            boost.targetFo = chart.renderer
                .createElement('foreignObject')
                .add(targetGroup);

            target.renderTarget = boost.target =
                doc.createElement('canvas') as any;
            boost.targetCtx = boost.target.getContext('2d');

            boost.targetFo.element.appendChild(boost.target as any);

            boost.clear = function (): void {
                boost.target.width = boost.canvas.width;
                boost.target.height = boost.canvas.height;
            };

            boost.copy = function (): void {
                boost.target.width = boost.canvas.width;
                boost.target.height = boost.canvas.height;
                boost.targetCtx.drawImage(boost.canvas, 0, 0);
            };
        }

        boost.resize = function (): void {
            width = chart.chartWidth;
            height = chart.chartHeight;

            (boost.targetFo || boost.target)
                .attr({
                    x: 0,
                    y: 0,
                    width,
                    height
                })
                .css({
                    pointerEvents: 'none',
                    mixedBlendMode: 'normal',
                    opacity: alpha
                } as any);

            if (target instanceof ChartClass) {
                (target.boost as any).markerGroup.translate(
                    chart.plotLeft,
                    chart.plotTop
                );
            }
        };

        boost.clipRect = chart.renderer.clipRect();

        (boost.targetFo || boost.target)
            .attr({
                // Set the z index of the boost target to that of the last
                // series using it. This logic is not perfect, as it will not
                // handle interleaved series with boost enabled or disabled. But
                // it will cover the most common use case of one or more
                // successive boosted or non-boosted series (#9819).
                zIndex: series.options.zIndex
            })
            .clip(boost.clipRect);

        if (target instanceof ChartClass) {
            (target.boost as any).markerGroup = target.renderer
                .g()
                .add(targetGroup)
                .translate(series.xAxis.pos, series.yAxis.pos);
        }
    }

    boost.canvas.width = width;
    boost.canvas.height = height;

    if (boost.clipRect) {
        boost.clipRect.attr(getBoostClipRect(chart, target));
    }

    boost.resize();
    boost.clear();

    if (!boost.wgl) {
        boost.wgl = new WGLRenderer((wgl): void => {
            if (wgl.settings.debug.timeBufferCopy) {
                console.time('buffer copy'); // eslint-disable-line no-console
            }

            boost.copy();

            if (wgl.settings.debug.timeBufferCopy) {
                console.timeEnd('buffer copy'); // eslint-disable-line no-console
            }
        });

        if (!boost.wgl.init(boost.canvas)) {
            // The OGL renderer couldn't be inited.
            // This likely means a shader error as we wouldn't get to this point
            // if there was no WebGL support.
            error('[highcharts boost] - unable to init WebGL renderer');
        }

        // target.ogl.clear();
        boost.wgl.setOptions(chart.options.boost || {});

        if (target instanceof ChartClass) {
            boost.wgl.allocateBuffer(chart);
        }
    }

    boost.wgl.setSize(width, height);

    return boost.wgl;
}

/**
 * If implemented in the core, parts of this can probably be
 * shared with other similar methods in Highcharts.
 * @private
 * @function Highcharts.Series#destroyGraphics
 */
function destroyGraphics(
    series: Series
): void {
    const points = series.points;

    if (points) {
        let point: Point,
            i: number;

        for (i = 0; i < points.length; i = i + 1) {
            point = points[i];
            if (point && point.destroyElements) {
                point.destroyElements(); // #7557
            }
        }
    }

    (
        ['graph', 'area', 'tracker'] as
        Array<('graph'|'area'|'tracker')>
    ).forEach((prop): void => {
        const seriesProp = series[prop];
        if (seriesProp) {
            series[prop] = seriesProp.destroy();
        }
    });

    const zonesSeries = series as (BoostSeriesComposition&LineSeries);

    if (zonesSeries.getZonesGraphs) {
        const props = zonesSeries.getZonesGraphs(
            [['graph', 'highcharts-graph']]
        ) as Array<[keyof LineSeries]>;
        props.forEach((prop): void => {
            const zoneGraph = zonesSeries[prop[0]] as (SVGElement|undefined);
            if (zoneGraph) {
                (zonesSeries as any)[prop[0]] = zoneGraph.destroy();
            }
        });
    }
}

/**
 * An "async" foreach loop. Uses a setTimeout to keep the loop from blocking the
 * UI thread.
 *
 * @private
 * @param {Array<unknown>} arr
 * The array to loop through.
 * @param {Function} fn
 * The callback to call for each item.
 * @param {Function} finalFunc
 * The callback to call when done.
 * @param {number} [chunkSize]
 * The number of iterations per timeout.
 * @param {number} [i]
 * The current index.
 * @param {boolean} [noTimeout]
 * Set to true to skip timeouts.
 */
function eachAsync(
    arr: Array<unknown>,
    fn: Function,
    finalFunc: Function,
    chunkSize?: number,
    i?: number,
    noTimeout?: boolean
): void {
    i = i || 0;
    chunkSize = chunkSize || CHUNK_SIZE;

    const threshold = i + chunkSize;

    let proceed = true;

    while (proceed && i < threshold && i < arr.length) {
        proceed = fn(arr[i], i);
        ++i;
    }

    if (proceed) {
        if (i < arr.length) {

            if (noTimeout) {
                eachAsync(arr, fn, finalFunc, chunkSize, i, noTimeout);
            } else if (win.requestAnimationFrame) {
                // If available, do requestAnimationFrame - shaves off a few ms
                win.requestAnimationFrame(function (): void {
                    eachAsync(arr, fn, finalFunc, chunkSize, i);
                });
            } else {
                setTimeout(eachAsync, 0, arr, fn, finalFunc, chunkSize, i);

            }

        } else if (finalFunc) {
            finalFunc();
        }
    }
}

/**
 * Enter boost mode and apply boost-specific properties.
 * @private
 * @function Highcharts.Series#enterBoost
 */
function enterBoost(
    series: Series
): void {
    series.boost = series.boost || {
        // faster than a series bind:
        getPoint: ((bp): BoostPointComposition => getPoint(series, bp))
    };

    const alteredByBoost: Array<BoostAlteredObject> = series.boost.altered = [];

    // Save the original values, including whether it was an own
    // property or inherited from the prototype.
    (
        ['allowDG', 'directTouch', 'stickyTracking'] as
        Array<('allowDG'|'directTouch'|'stickyTracking')>
    ).forEach((prop): void => {
        alteredByBoost.push({
            prop: prop,
            val: series[prop],
            own: Object.hasOwnProperty.call(series, prop)
        });
    });

    series.allowDG = false;
    series.directTouch = false;
    series.stickyTracking = true;

    // Prevent animation when zooming in on boosted series(#13421).
    series.finishedAnimating = true;

    // Hide series label if any
    if (series.labelBySeries) {
        series.labelBySeries = series.labelBySeries.destroy();
    }
}

/**
 * Exit from boost mode and restore non-boost properties.
 * @private
 * @function Highcharts.Series#exitBoost
 */
function exitBoost(
    series: Series
): void {
    const boost = series.boost;

    // Reset instance properties and/or delete instance properties and go back
    // to prototype
    if (boost) {
        (boost.altered || []).forEach((setting): void => {
            if (setting.own) {
                series[setting.prop] = setting.val as any;
            } else {
                // Revert to prototype
                delete series[setting.prop];
            }
        });

        // Clear previous run
        if (boost.clear) {
            boost.clear();
        }
    }
}

/**
 * @private
 * @function Highcharts.Series#hasExtremes
 */
function hasExtremes(
    series: Series,
    checkX?: boolean
): boolean {
    const options = series.options,
        data: Array<(PointOptions|PointShortOptions)> = options.data as any,
        xAxis = series.xAxis && series.xAxis.options,
        yAxis = series.yAxis && series.yAxis.options,
        colorAxis = series.colorAxis && series.colorAxis.options;

    return data.length > (options.boostThreshold || Number.MAX_VALUE) &&
            // Defined yAxis extremes
            isNumber(yAxis.min) &&
            isNumber(yAxis.max) &&
            // Defined (and required) xAxis extremes
            (!checkX ||
                (isNumber(xAxis.min) && isNumber(xAxis.max))
            ) &&
            // Defined (e.g. heatmap) colorAxis extremes
            (!colorAxis ||
                (isNumber(colorAxis.min) && isNumber(colorAxis.max))
            );
}

/**
 * Extend series.destroy to also remove the fake k-d-tree points (#5137).
 * Normally this is handled by Series.destroy that calls Point.destroy,
 * but the fake search points are not registered like that.
 * @private
 */
function onSeriesDestroy(
    this: Series
): void {
    const series = this,
        chart = series.chart;

    if (
        chart.boost &&
        chart.boost.markerGroup === series.markerGroup
    ) {
        series.markerGroup = null as any;
    }

    if (chart.hoverPoints) {
        chart.hoverPoints = chart.hoverPoints.filter(function (
            point: Point
        ): boolean {
            return point.series === series;
        });
    }

    if (chart.hoverPoint && chart.hoverPoint.series === series) {
        chart.hoverPoint = null as any;
    }
}

/**
 * @private
 */
function onSeriesHide(
    this: Series
): void {
    const boost = this.boost;

    if (boost && boost.canvas && boost.target) {
        if (boost.wgl) {
            boost.wgl.clear();
        }
        if (boost.clear) {
            boost.clear();
        }
    }
}

/**
 * Performs the actual render if the renderer is
 * attached to the series.
 * @private
 */
function renderIfNotSeriesBoosting(series: Series): void {
    const boost = series.boost;

    if (
        boost &&
        boost.canvas &&
        boost.target &&
        boost.wgl &&
        !isChartSeriesBoosting(series.chart)
    ) {
        boost.wgl.render(series.chart);
    }
}

/**
 * Return a full Point object based on the index.
 * The boost module uses stripped point objects for performance reasons.

 * @private
 * @param {object|Highcharts.Point} boostPoint
 *        A stripped-down point object
 * @return {Highcharts.Point}
 *         A Point object as per https://api.highcharts.com/highcharts#Point
 */
function getPoint(
    series: Series,
    boostPoint: (BoostPointMockup|Point)
): BoostPointComposition {
    const seriesOptions = series.options,
        xAxis = series.xAxis,
        PointClass = series.pointClass;

    if (boostPoint instanceof PointClass) {
        return boostPoint as BoostPointComposition;
    }

    const xData = (
            series.xData ||
            seriesOptions.xData ||
            series.processedXData ||
            false
        ),
        point = (new PointClass()).init(
            series as BoostSeriesComposition,
            (series.options.data as any)[boostPoint.i],
            xData ? xData[boostPoint.i] : void 0
        ) as BoostPointComposition;

    point.category = pick(
        xAxis.categories ?
            xAxis.categories[point.x] :
            point.x, // @todo simplify
        point.x
    );

    point.dist = boostPoint.dist;
    point.distX = boostPoint.distX;
    point.plotX = boostPoint.plotX;
    point.plotY = boostPoint.plotY;
    point.index = boostPoint.i;
    point.percentage = boostPoint.percentage;
    point.isInside = series.isPointInside(point);
    return point;
}

/**
 * @private
 * @function Highcharts.Series#renderCanvas
 */
function seriesRenderCanvas(this: Series): void {
    const options = this.options || {},
        chart = this.chart,
        xAxis = this.xAxis,
        yAxis = this.yAxis,
        xData = options.xData || this.processedXData,
        yData = options.yData || this.processedYData,
        rawData = options.data,
        xExtremes = xAxis.getExtremes(),
        xMin = xExtremes.min,
        xMax = xExtremes.max,
        yExtremes = yAxis.getExtremes(),
        yMin = yExtremes.min,
        yMax = yExtremes.max,
        pointTaken: Record<string, boolean> = {},
        sampling = !!this.sampling,
        enableMouseTracking = options.enableMouseTracking,
        threshold: number = options.threshold as any,
        isRange = this.pointArrayMap &&
            this.pointArrayMap.join(',') === 'low,high',
        isStacked = !!options.stacking,
        cropStart = this.cropStart || 0,
        requireSorting = this.requireSorting,
        useRaw = !xData,
        compareX = options.findNearestPointBy === 'x',
        xDataFull = (
            this.xData ||
            this.options.xData ||
            this.processedXData ||
            false
        );

    let renderer: WGLRenderer = false as any,
        lastClientX: (number|undefined),
        yBottom = yAxis.getThreshold(threshold),
        minVal: (number|undefined),
        maxVal: (number|undefined),
        minI: (number|undefined),
        maxI: (number|undefined);

    // Get or create the renderer
    renderer = createAndAttachRenderer(chart, this);

    chart.boosted = true;

    if (!this.visible) {
        return;
    }

    // If we are zooming out from SVG mode, destroy the graphics
    if (this.points || this.graph) {
        destroyGraphics(this);
    }

    // If we're rendering per. series we should create the marker groups
    // as usual.
    if (!isChartSeriesBoosting(chart)) {
        // If all series were boosting, but are not anymore
        // restore private markerGroup
        if (
            chart.boost &&
            this.markerGroup === chart.boost.markerGroup
        ) {
            this.markerGroup = void 0;
        }

        this.markerGroup = this.plotGroup(
            'markerGroup',
            'markers',
            true as any,
            1,
            chart.seriesGroup
        );
    } else {
        // If series has a private markeGroup, remove that
        // and use common markerGroup
        if (
            this.markerGroup &&
            this.markerGroup !== chart.boost.markerGroup
        ) {
            this.markerGroup.destroy();
        }
        // Use a single group for the markers
        this.markerGroup = chart.boost.markerGroup;

        // When switching from chart boosting mode, destroy redundant
        // series boosting targets
        if (this.boost && this.boost.target) {
            this.renderTarget = this.boost.target = this.boost.target.destroy();
        }
    }

    const points: Array<BoostPointMockup> = this.points = [],
        addKDPoint = (
            clientX: number,
            plotY: number,
            i: number,
            percentage: number
        ): void => {
            const x = xDataFull ? xDataFull[cropStart + i] : false,
                pushPoint = (plotX: number): void => {
                    if (chart.inverted) {
                        plotX = xAxis.len - plotX;
                        plotY = yAxis.len - plotY;
                    }

                    points.push({
                        destroy: noop,
                        x: x,
                        clientX: plotX,
                        plotX: plotX,
                        plotY: plotY,
                        i: cropStart + i,
                        percentage: percentage
                    });
                };

            // We need to do ceil on the clientX to make things
            // snap to pixel values. The renderer will frequently
            // draw stuff on "sub-pixels".
            clientX = Math.ceil(clientX);

            // Shaves off about 60ms compared to repeated concatenation
            index = compareX ? clientX : clientX + ',' + plotY;

            // The k-d tree requires series points.
            // Reduce the amount of points, since the time to build the
            // tree increases exponentially.
            if (enableMouseTracking) {
                if (!pointTaken[index]) {
                    pointTaken[index] = true;
                    pushPoint(clientX);
                } else if (x === xDataFull[xDataFull.length - 1]) {
                    // If the last point is on the same pixel as the last
                    // tracked point, swap them. (#18856)
                    points.length--;
                    pushPoint(clientX);
                }
            }
        };

    // Do not start building while drawing
    this.buildKDTree = noop;

    if (renderer) {
        allocateIfNotSeriesBoosting(renderer, this);
        renderer.pushSeries(this);
        // Perform the actual renderer if we're on series level
        renderIfNotSeriesBoosting(this);
    }

    /**
     * This builds the KD-tree
     * @private
     */
    function processPoint(
        d: (number|Array<number>|Record<string, number>),
        i: number
    ): boolean {
        const chartDestroyed = typeof chart.index === 'undefined';

        let x: number,
            y: number,
            clientX,
            plotY,
            percentage,
            low: number = false as any,
            isYInside = true;

        if (typeof d === 'undefined') {
            return true;
        }

        if (!chartDestroyed) {
            if (useRaw) {
                x = (d as any)[0];
                y = (d as any)[1];
            } else {
                x = d as any;
                y = yData[i] as any;
            }

            // Resolve low and high for range series
            if (isRange) {
                if (useRaw) {
                    y = (d as any).slice(1, 3);
                }
                low = (y as any)[0];
                y = (y as any)[1];
            } else if (isStacked) {
                x = (d as any).x;
                y = (d as any).stackY;
                low = y - (d as any).y;
                percentage = (d as any).percentage;
            }

            // Optimize for scatter zooming
            if (!requireSorting) {
                isYInside = (y || 0) >= yMin && y <= yMax;
            }

            if (y !== null && x >= xMin && x <= xMax && isYInside) {

                clientX = xAxis.toPixels(x, true);

                if (sampling) {
                    if (
                        typeof minI === 'undefined' ||
                        clientX === lastClientX
                    ) {
                        if (!isRange) {
                            low = y;
                        }
                        if (
                            typeof maxI === 'undefined' ||
                            y > (maxVal as any)
                        ) {
                            maxVal = y;
                            maxI = i;
                        }
                        if (
                            typeof minI === 'undefined' ||
                            low < (minVal as any)
                        ) {
                            minVal = low;
                            minI = i;
                        }

                    }
                    // Add points and reset
                    if (!compareX || clientX !== lastClientX) {
                        // maxI is number too:
                        if (typeof minI !== 'undefined') {
                            plotY =
                                yAxis.toPixels(maxVal as any, true);
                            yBottom =
                                yAxis.toPixels(minVal as any, true);

                            addKDPoint(clientX, plotY, maxI as any, percentage);
                            if (yBottom !== plotY) {
                                addKDPoint(clientX, yBottom, minI, percentage);
                            }
                        }

                        minI = maxI = void 0;
                        lastClientX = clientX;
                    }
                } else {
                    plotY = Math.ceil(yAxis.toPixels(y, true));
                    addKDPoint(clientX, plotY, i, percentage);
                }
            }
        }

        return !chartDestroyed;
    }

    /**
     * @private
     */
    const boostOptions = renderer.settings,
        doneProcessing = (): void => {
            fireEvent(this, 'renderedCanvas');

            // Go back to prototype, ready to build
            delete (this as Partial<typeof this>).buildKDTree;
            this.buildKDTree();

            if (boostOptions.debug.timeKDTree) {
                console.timeEnd('kd tree building'); // eslint-disable-line no-console
            }
        };

    // Loop over the points to build the k-d tree - skip this if
    // exporting
    if (!chart.renderer.forExport) {
        if (boostOptions.debug.timeKDTree) {
            console.time('kd tree building'); // eslint-disable-line no-console
        }

        eachAsync(
            isStacked ? this.data : (xData || rawData),
            processPoint,
            doneProcessing
        );
    }
}

/**
 * Used for treemap|heatmap.drawPoints
 * @private
 */
function wrapSeriesDrawPoints(
    this: Series,
    proceed: Function
): void {
    let enabled = true;

    if (this.chart.options && this.chart.options.boost) {
        enabled = typeof this.chart.options.boost.enabled === 'undefined' ?
            true :
            this.chart.options.boost.enabled;
    }

    if (!enabled || !this.boosted) {
        return proceed.call(this);
    }

    this.chart.boosted = true;

    // Make sure we have a valid OGL context
    const renderer = createAndAttachRenderer(this.chart, this);

    if (renderer) {
        allocateIfNotSeriesBoosting(renderer, this);
        renderer.pushSeries(this);
    }

    renderIfNotSeriesBoosting(this);
}

/**
 * Override a bunch of methods the same way. If the number of points is
 * below the threshold, run the original method. If not, check for a
 * canvas version or do nothing.
 *
 * Note that we're not overriding any of these for heatmaps.
 */
function wrapSeriesFunctions(
    seriesProto: Series,
    seriesTypes: typeof SeriesRegistry.seriesTypes,
    method: (
        'translate'|
        'generatePoints'|
        'drawTracker'|
        'drawPoints'|
        'render'
    )
): void {
    /**
     * @private
     */
    function branch(
        this: Series,
        proceed: Function
    ): void {
        const letItPass = this.options.stacking &&
            (method === 'translate' || method === 'generatePoints');

        if (
            !this.boosted ||
            letItPass ||
            !boostEnabled(this.chart) ||
            this.type === 'heatmap' ||
            this.type === 'treemap' ||
            !BoostableMap[this.type] ||
            this.options.boostThreshold === 0
        ) {

            proceed.call(this);

        // Run canvas version of method, like renderCanvas(), if it exists
        } else if (method === 'render' && this.renderCanvas) {
            this.renderCanvas();
        }
    }

    wrap(seriesProto, method, branch);

    // Special case for some types, when translate method is already wrapped
    if (method === 'translate') {
        [
            'column',
            'arearange',
            'columnrange',
            'heatmap',
            'treemap'
        ].forEach(function (type: string): void {
            if (seriesTypes[type]) {
                wrap(seriesTypes[type].prototype, method, branch);
            }
        });
    }
}

/**
 * Do not compute extremes when min and max are set. If we use this in the
 * core, we can add the hook to hasExtremes to the methods directly.
 * @private
 */
function wrapSeriesGetExtremes(
    this: Series,
    proceed: Function
): DataExtremesObject {
    if (
        this.boosted &&
        hasExtremes(this)
    ) {
        return {};
    }
    return proceed.apply(this, [].slice.call(arguments, 1));
}

/**
 * If the series is a heatmap or treemap, or if the series is not boosting
 * do the default behaviour. Otherwise, process if the series has no
 * extremes.
 * @private
 */
function wrapSeriesProcessData(
    this: Series,
    proceed: Function
): void {
    let dataToMeasure = this.options.data;

    /**
     * Used twice in this function, first on this.options.data, the second
     * time it runs the check again after processedXData is built.
     * If the data is going to be grouped, the series shouldn't be boosted.
     * @private
     */
    const getSeriesBoosting = (
        data?: Array<(PointOptions|PointShortOptions)>
    ): boolean => {
        const series = this as BoostSeriesComposition;

        // Check if will be grouped.
        if (series.forceCrop) {
            return false;
        }
        return (
            isChartSeriesBoosting(series.chart) ||
            (
                (data ? data.length : 0) >=
                (series.options.boostThreshold || Number.MAX_VALUE)
            )
        );
    };

    if (boostEnabled(this.chart) && BoostableMap[this.type]) {
        const series = this as BoostSeriesComposition;

        // If there are no extremes given in the options, we also need to
        // process the data to read the data extremes. If this is a heatmap,
        // do default behaviour.
        if (
            // First pass with options.data:
            !getSeriesBoosting(dataToMeasure) ||
            series.type === 'heatmap' ||
            series.type === 'treemap' ||
            // processedYData for the stack (#7481):
            series.options.stacking ||
            !hasExtremes(series, true)
        ) {
            proceed.apply(series, [].slice.call(arguments, 1));
            dataToMeasure = series.processedXData;
        }

        // Set the isBoosting flag, second pass with processedXData to
        // see if we have zoomed.
        series.boosted = getSeriesBoosting(dataToMeasure);

        // Enter or exit boost mode
        if (series.boosted) {
            // Force turbo-mode:
            let firstPoint;
            if (
                series.options.data &&
                series.options.data.length
            ) {
                firstPoint = series.getFirstValidPoint(
                    series.options.data
                );
                if (!isNumber(firstPoint) && !isArray(firstPoint)) {
                    error(12, false, series.chart);
                }
            }
            enterBoost(series);
        } else {
            exitBoost(series);
        }
    // The series type is not boostable
    } else {
        proceed.apply(this, [].slice.call(arguments, 1));
    }
}

/**
 * Return a point instance from the k-d-tree
 * @private
 */
function wrapSeriesSearchPoint(
    this: Series,
    proceed: Function
): (Point|undefined) {
    const result = proceed.apply(this, [].slice.call(arguments, 1));

    if (this.boost && result) {
        return this.boost.getPoint(result);
    }

    return result;
}

/* *
 *
 *  Default Export
 *
 * */

const BoostSeries = {
    compose,
    destroyGraphics,
    eachAsync,
    getPoint
};

export default BoostSeries;
