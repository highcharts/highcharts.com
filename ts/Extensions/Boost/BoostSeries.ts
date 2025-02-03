/* *
 *
 *  (c) 2019-2024 Highsoft AS
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
import type Point from '../../Core/Series/Point';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type Series from '../../Core/Series/Series';
import type { TypedArray } from '../../Core/Series/SeriesOptions';
import type SeriesRegistry from '../../Core/Series/SeriesRegistry';
import type { SeriesTypePlotOptions } from '../../Core/Series/SeriesType';
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
    composed,
    doc,
    noop,
    win
} = H;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    destroyObjectProperties,
    error,
    extend,
    fireEvent,
    isArray,
    isNumber,
    pick,
    pushUnique,
    wrap,
    defined
} = U;
import WGLRenderer from './WGLRenderer.js';

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
        processedData?: Array<(PointOptions|PointShortOptions)>;
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

    if (
        renderer &&
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
    PointClass: typeof Point,
    wglMode?: boolean
): (T&typeof BoostSeriesComposition) {
    if (pushUnique(composed, 'Boost.Series')) {
        const plotOptions = getOptions().plotOptions as SeriesTypePlotOptions,
            seriesProto = SeriesClass.prototype as BoostSeriesComposition;

        addEvent(SeriesClass, 'destroy', onSeriesDestroy);
        addEvent(SeriesClass, 'hide', onSeriesHide);

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
        wrap(
            PointClass.prototype,
            'firePointEvent',
            function (
                this: typeof PointClass.prototype,
                proceed,
                type,
                e
            ): boolean | undefined {
                if (type === 'click' && this.series.boosted) {
                    const point = e.point;

                    if (
                        (point.dist || point.distX) >= (
                            point.series.options.marker?.radius ?? 10
                        )
                    ) {
                        return;
                    }
                }
                return proceed.apply(this, [].slice.call(arguments, 1));
            });

        // Set default options
        Boostables.forEach((type: string): void => {
            const typePlotOptions = plotOptions[type];
            if (typePlotOptions) {
                typePlotOptions.boostThreshold = 5000;
                typePlotOptions.boostData = [];
                seriesTypes[type].prototype.fillOpacity = true;
            }
        });

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

            if (AreaSeries) {
                extend(AreaSeries.prototype, {
                    fill: true,
                    fillOpacity: true,
                    sampling: true
                });
            }

            if (AreaSplineSeries) {
                extend(AreaSplineSeries.prototype, {
                    fill: true,
                    fillOpacity: true,
                    sampling: true
                });
            }

            if (BubbleSeries) {
                const bubbleProto = BubbleSeries.prototype;

                // By default, the bubble series does not use the KD-tree, so
                // force it to.
                delete (bubbleProto as Partial<Series>).buildKDTree;
                // SeriesTypes.bubble.prototype.directTouch = false;

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

            if (ColumnSeries) {
                extend(ColumnSeries.prototype, {
                    fill: true,
                    sampling: true
                });
            }

            if (ScatterSeries) {
                ScatterSeries.prototype.fill = true;
            }

            // We need to handle heatmaps separately, since we can't perform the
            // size/color calculations in the shader easily.
            // @todo This likely needs future optimization.
            [HeatmapSeries, TreemapSeries].forEach((SC): void => {
                if (SC) {
                    wrap(SC.prototype, 'drawPoints', wrapSeriesDrawPoints);
                }
            });
        }
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
        foSupported: boolean = typeof SVGForeignObjectElement !== 'undefined',
        hasClickHandler = false;

    if (isChartSeriesBoosting(chart)) {
        target = chart;
    } else {
        target = series;
        hasClickHandler = Boolean(
            series.options.events?.click ||
            series.options.point?.events?.click
        );
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
                    pointerEvents: hasClickHandler ? void 0 : 'none',
                    mixedBlendMode: 'normal',
                    opacity: alpha
                })
                .addClass(hasClickHandler ? 'highcharts-tracker' : '');

            if (target instanceof ChartClass) {
                target.boost?.markerGroup?.translate(
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
            });

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
        const box = getBoostClipRect(chart, target),

            // When using panes, the image itself must be clipped. When not
            // using panes, it is better to clip the target group, because then
            // we preserve clipping on touch- and mousewheel zoom preview.
            clippedElement = (
                box.width === chart.clipBox.width &&
                box.height === chart.clipBox.height
            ) ? targetGroup :
                (boost.targetFo || boost.target);

        boost.clipRect.attr(box);
        clippedElement?.clip(boost.clipRect);
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
            // The OGL renderer couldn't be inited. This likely means a shader
            // error as we wouldn't get to this point if there was no WebGL
            // support.
            error('[highcharts boost] - unable to init WebGL renderer');
        }

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

    for (const zone of series.zones) {
        destroyObjectProperties(zone, void 0, true);
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
    arr: Array<unknown>|TypedArray,
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
        // Faster than a series bind:
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

    // Destroy existing points after zoom out
    if (
        series.is('scatter') &&
        !series.is('treemap') &&
        series.data.length
    ) {
        for (const point of series.data) {
            point?.destroy?.();
        }
        series.data.length = 0;
        series.points.length = 0;
        delete series.processedData;
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
    const boost = series.boost,
        chart = series.chart,
        chartBoost = chart.boost;

    if (chartBoost?.markerGroup) {
        chartBoost.markerGroup.destroy();
        chartBoost.markerGroup = void 0;

        for (const s of chart.series) {
            s.markerGroup = void 0;
            s.markerGroup = s.plotGroup(
                'markerGroup',
                'markers',
                'visible',
                1,
                chart.seriesGroup
            ).addClass('highcharts-tracker');
        }
    }

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

    // #21106, clean up boost clipping on the series groups.
    (chart.seriesGroup || series.group)?.clip();
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
        dataLength = series.dataTable.modified.rowCount,
        xAxis = series.xAxis && series.xAxis.options,
        yAxis = series.yAxis && series.yAxis.options,
        colorAxis = series.colorAxis && series.colorAxis.options;

    return dataLength > (options.boostThreshold || Number.MAX_VALUE) &&
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
 * Used multiple times. In processData first on this.options.data, the second
 * time it runs the check again after processedXData is built.
 * If the data is going to be grouped, the series shouldn't be boosted.
 * @private
 */
const getSeriesBoosting = (
    series: BoostSeriesComposition,
    data?: Array<(PointOptions|PointShortOptions)>|TypedArray
): boolean => {
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

    const isScatter = series.is('scatter'),
        xData = (
            (isScatter && series.getColumn('x', true).length ?
                series.getColumn('x', true) :
                void 0) ||
            (series.getColumn('x').length ? series.getColumn('x') : void 0) ||
            seriesOptions.xData ||
            series.getColumn('x', true) ||
            false
        ),
        yData = (
            series.getColumn('y', true) ||
            seriesOptions.yData ||
            false
        ),
        point = new PointClass(
            series as BoostSeriesComposition,
            (isScatter && xData && yData) ?
                [xData[boostPoint.i], yData[boostPoint.i]] :
                (
                    isArray(series.options.data) ? series.options.data : []
                )[boostPoint.i],
            xData ? xData[boostPoint.i] : void 0
        ) as BoostPointComposition;

    point.category = pick(
        xAxis.categories ?
            xAxis.categories[point.x] :
            point.x, // @todo simplify
        point.x
    );
    point.key = point.name ?? point.category;

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
 */
function scatterProcessData(
    this: BoostSeriesComposition,
    force?: boolean
): (boolean|undefined) {
    const series = this,
        {
            options,
            xAxis,
            yAxis
        } = series;

    // Process only on changes
    if (
        !series.isDirty &&
        !xAxis.isDirty &&
        !yAxis.isDirty &&
        !force
    ) {
        return false;
    }

    // Required to get tick-based zoom ranges that take options into account
    // like `minPadding`, `maxPadding`, `startOnTick`, `endOnTick`.
    series.yAxis.setTickInterval();

    const boostThreshold = options.boostThreshold || 0,
        cropThreshold = options.cropThreshold,
        xData = series.getColumn('x'),
        xExtremes = xAxis.getExtremes(),
        xMax = xExtremes.max ?? Number.MAX_VALUE,
        xMin = xExtremes.min ?? -Number.MAX_VALUE,
        yData = series.getColumn('y'),
        yExtremes = yAxis.getExtremes(),
        yMax = yExtremes.max ?? Number.MAX_VALUE,
        yMin = yExtremes.min ?? -Number.MAX_VALUE;

    // Skip processing in non-boost zoom
    if (
        !series.boosted &&
        xAxis.old &&
        yAxis.old &&
        xMin >= (xAxis.old.min ?? -Number.MAX_VALUE) &&
        xMax <= (xAxis.old.max ?? Number.MAX_VALUE) &&
        yMin >= (yAxis.old.min ?? -Number.MAX_VALUE) &&
        yMax <= (yAxis.old.max ?? Number.MAX_VALUE)
    ) {
        series.dataTable.modified.setColumns({
            x: xData,
            y: yData
        });
        return true;
    }

    // Without thresholds just assign data
    const dataLength = series.dataTable.rowCount;
    if (
        !boostThreshold ||
        dataLength < boostThreshold ||
        (
            cropThreshold &&
            !series.forceCrop &&
            !series.getExtremesFromAll &&
            !options.getExtremesFromAll &&
            dataLength < cropThreshold
        )
    ) {
        series.dataTable.modified.setColumns({
            x: xData,
            y: yData
        });
        return true;
    }

    // Filter unsorted scatter data for ranges
    const processedData: Array<PointOptions> = [],
        processedXData: Array<number> = [],
        processedYData: Array<number> = [],
        xRangeNeeded = !(isNumber(xExtremes.max) || isNumber(xExtremes.min)),
        yRangeNeeded = !(isNumber(yExtremes.max) || isNumber(yExtremes.min));

    let cropped = false,
        x: number,
        xDataMax = xData[0],
        xDataMin = xData[0],
        y: number,
        yDataMax = yData?.[0],
        yDataMin = yData?.[0];

    for (let i = 0, iEnd = xData.length; i < iEnd; ++i) {
        x = xData[i];
        y = yData?.[i];

        if (
            x >= xMin && x <= xMax &&
            y >= yMin && y <= yMax
        ) {
            processedData.push({ x, y });
            processedXData.push(x);
            processedYData.push(y);
            if (xRangeNeeded) {
                xDataMax = Math.max(xDataMax, x);
                xDataMin = Math.min(xDataMin, x);
            }
            if (yRangeNeeded) {
                yDataMax = Math.max(yDataMax, y);
                yDataMin = Math.min(yDataMin, y);
            }
        } else {
            cropped = true;
        }
    }

    if (xRangeNeeded) {
        xAxis.dataMax = Math.max(xDataMax, xAxis.dataMax || 0);
        xAxis.dataMin = Math.min(xDataMin, xAxis.dataMin || 0);
    }
    if (yRangeNeeded) {
        yAxis.dataMax = Math.max(yDataMax, yAxis.dataMax || 0);
        yAxis.dataMin = Math.min(yDataMin, yAxis.dataMin || 0);
    }

    // Set properties as base processData
    series.cropped = cropped;
    series.cropStart = 0;
    // For boosted points rendering
    series.dataTable.modified.setColumns({
        x: processedXData,
        y: processedYData
    });

    if (!getSeriesBoosting(series, processedXData)) {
        series.processedData = processedData; // For un-boosted points rendering
    }

    return true;
}

/**
 * @private
 * @function Highcharts.Series#renderCanvas
 */
function seriesRenderCanvas(this: Series): void {
    const options = this.options || {},
        chart = this.chart,
        chartBoost = chart.boost,
        seriesBoost = this.boost,
        xAxis = this.xAxis,
        yAxis = this.yAxis,
        xData = options.xData || this.getColumn('x', true),
        yData = options.yData || this.getColumn('y', true),
        lowData = this.getColumn('low', true),
        highData = this.getColumn('high', true),
        rawData = this.processedData || options.data,
        xExtremes = xAxis.getExtremes(),
        // Taking into account the offset of the min point #19497
        xMin = xExtremes.min - (xAxis.minPointOffset || 0),
        xMax = xExtremes.max + (xAxis.minPointOffset || 0),
        yExtremes = yAxis.getExtremes(),
        yMin = yExtremes.min - (yAxis.minPointOffset || 0),
        yMax = yExtremes.max + (yAxis.minPointOffset || 0),
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
            (
                this.getColumn('x').length ?
                    this.getColumn('x') :
                    void 0
            ) ||
            this.options.xData ||
            this.getColumn('x', true)
        ),
        lineWidth = pick(options.lineWidth, 1),
        nullYSubstitute = options.nullInteraction && yMin;

    let renderer: WGLRenderer = false as any,
        lastClientX: (number|undefined),
        yBottom = yAxis.getThreshold(threshold),
        minVal: (number|undefined),
        maxVal: (number|undefined),
        minI: (number|undefined),
        maxI: (number|undefined);


    // When touch-zooming or mouse-panning, re-rendering the canvas would not
    // perform fast enough. Instead, let the axes redraw, but not the series.
    // The series is scale-translated in an event handler for an approximate
    // preview.
    if (xAxis.isPanning || yAxis.isPanning) {
        return;
    }

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
        if (this.markerGroup === chartBoost?.markerGroup) {
            this.markerGroup = void 0;
        }

        this.markerGroup = this.plotGroup(
            'markerGroup',
            'markers',
            'visible',
            1,
            chart.seriesGroup
        ).addClass('highcharts-tracker');
    } else {
        // If series has a private markerGroup, remove that
        // and use common markerGroup
        if (
            this.markerGroup &&
            this.markerGroup !== chartBoost?.markerGroup
        ) {
            this.markerGroup.destroy();
        }
        // Use a single group for the markers
        this.markerGroup = chartBoost?.markerGroup;

        // When switching from chart boosting mode, destroy redundant
        // series boosting targets
        if (seriesBoost && seriesBoost.target) {
            this.renderTarget =
            seriesBoost.target =
            seriesBoost.target.destroy();
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

    fireEvent(this, 'renderCanvas');

    if (
        this.is('line') &&
        lineWidth > 1 &&
        seriesBoost?.target &&
        chartBoost &&
        !chartBoost.lineWidthFilter
    ) {
        chartBoost.lineWidthFilter = chart.renderer.definition({
            tagName: 'filter',
            children: [
                {
                    tagName: 'feMorphology',
                    attributes: {
                        operator: 'dilate',
                        radius: 0.25 * lineWidth
                    }
                }
            ],
            attributes: { id: 'linewidth' }
        });

        seriesBoost.target.attr({
            filter: 'url(#linewidth)'
        });
    }

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
            y,
            clientX,
            plotY,
            percentage,
            low: number = false as any,
            isYInside = true;

        if (!defined(d)) {
            return true;
        }

        if (!chartDestroyed) {
            if (useRaw) {
                x = (d as any)[0];
                y = (d as any)[1];
            } else {
                x = d as any;
                y = yData[i] ?? nullYSubstitute ?? null;
            }

            // Resolve low and high for range series
            if (isRange) {
                if (useRaw) {
                    y = (d as any).slice(1, 3);
                }

                low = lowData[i];
                y = highData[i];
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
                        // `maxI` is number too:
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

            // Check that options exist, as async processing
            // could mean the series is removed at this point (#19895)
            if (this.options) {
                this.buildKDTree();
            }

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
            isStacked ?
                this.data.slice(cropStart) :
                (xData || rawData),
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
        for (const type of [
            'column',
            'arearange',
            'columnrange',
            'heatmap',
            'treemap'
        ]) {
            if (seriesTypes[type]) {
                wrap(seriesTypes[type].prototype, method, branch);
            }
        }
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

    if (this.boosted) {
        if (hasExtremes(this)) {
            return {};
        }
        if (this.xAxis.isPanning || this.yAxis.isPanning) {
            // Do not re-compute the extremes during panning, because looping
            // the data is expensive. The `this` contains the `dataMin` and
            // `dataMax` to use.
            return this;
        }
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
    let dataToMeasure: (PointOptions|PointShortOptions)[]|TypedArray|undefined =
        this.options.data;

    if (boostEnabled(this.chart) && BoostableMap[this.type]) {
        const series = this as BoostSeriesComposition,
            // Flag for code that should run for ScatterSeries and its
            // subclasses, apart from the enlisted exceptions.
            isScatter = series.is('scatter') &&
                !series.is('bubble') &&
                !series.is('treemap') &&
                !series.is('heatmap');
        // If there are no extremes given in the options, we also need to
        // process the data to read the data extremes. If this is a heatmap,
        // do default behaviour.
        if (
            // First pass with options.data:
            !getSeriesBoosting(series, dataToMeasure) ||
            isScatter ||
            series.is('treemap') ||
            // Use processedYData for the stack (#7481):
            series.options.stacking ||
            !hasExtremes(series, true)
        ) {
            // Do nothing until the panning stops
            if (
                series.boosted && (
                    series.xAxis?.isPanning || series.yAxis?.isPanning
                )
            ) {
                return;
            }

            // Extra check for zoomed scatter data
            if (isScatter && !series.yAxis.treeGrid) {
                scatterProcessData.call(series, arguments[1]);
            } else {
                proceed.apply(series, [].slice.call(arguments, 1));
            }
            dataToMeasure = series.getColumn('x', true);
        }

        // Set the isBoosting flag, second pass with processedXData to
        // see if we have zoomed.
        series.boosted = getSeriesBoosting(series, dataToMeasure);

        // Enter or exit boost mode
        if (series.boosted) {
            // Force turbo-mode:
            let firstPoint;
            if (series.options.data?.length) {
                firstPoint = series.getFirstValidPoint(
                    series.options.data
                );
                if (
                    !isNumber(firstPoint) &&
                    !isArray(firstPoint) &&
                    !series.is('treemap')
                ) {
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
