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

import type Axis from '../../Core/Axis/Axis';
import type BoostOptions from './BoostOptions';
import type Chart from '../../Core/Chart/Chart';
import type ColorMapComposition from '../../Series/ColorMapComposition';
import type Point from '../../Core/Series/Point';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type Series from '../../Core/Series/Series';
import type { SeriesZonesOptions } from '../../Core/Series/SeriesOptions';
import type { WGLDrawModeValue } from './WGLDrawMode';
import type WGLOptions from './WGLOptions';

import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import H from '../../Core/Globals.js';
const { doc, win } = H;
import U from '../../Shared/Utilities.js';
const {
    pick
} = U;
import WGLDrawMode from './WGLDrawMode.js';
import WGLShader from './WGLShader.js';
import WGLVertexBuffer from './WGLVertexBuffer.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber, isObject } = TC;
const { merge, objectEach } = OH;

/* *
 *
 *  Declarations
 *
 * */

interface WGLNode {
    levelDynamic?: number;
}

interface WGLPoint extends Point {
    node?: WGLNode;
}

interface WGLRendererCallbackFunction {
    (renderer: WGLRenderer): void;
}

interface WGLSeriesObject {
    colorData: Array<number>;
    drawMode: WGLDrawModeValue;
    hasMarkers: boolean;
    markerFrom: number;
    markerTo?: number;
    segments: Array<Record<string, number>>;
    series: Series;
    showMarkers: boolean;
    skipTranslation?: boolean;
    zMax: number;
    zMin: number;
}

interface WGLTextureCallbackFunction {
    (ctx: CanvasRenderingContext2D): void;
}

interface WGLTextureObject {
    isReady: boolean;
    texture: HTMLCanvasElement;
    handle: (WebGLTexture|null);
}

/**
 * Internal types
 * @private
 */
declare global {
    interface CanvasRenderingContext2D {
        FUNC_MIN: number;
        /** @deprecated */
        mozImageSmoothingEnabled?: (
            CanvasImageSmoothing['imageSmoothingEnabled']
        );
        /** @deprecated */
        msImageSmoothingEnabled?: CanvasImageSmoothing['imageSmoothingEnabled'];
        /** @deprecated */
        webkitImageSmoothingEnabled?: (
            CanvasImageSmoothing['imageSmoothingEnabled']
        );
    }
    interface WebGLRenderingContext {
        /** @deprecated */
        readonly FUNC_MIN: number;
    }
}

/* *
 *
 *  Constants
 *
 * */

// Things to draw as "rectangles" (i.e lines)
const asBar: Record<string, boolean> = {
    'column': true,
    'columnrange': true,
    'bar': true,
    'area': true,
    'areaspline': true,
    'arearange': true
};

const asCircle: Record<string, boolean> = {
    'scatter': true,
    'bubble': true
};

const contexts = [
    'webgl',
    'experimental-webgl',
    'moz-webgl',
    'webkit-3d'
];

/* *
 *
 *  Class
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Main renderer. Used to render series.
 *
 * Notes to self:
 * - May be able to build a point map by rendering to a separate canvas and
 *   encoding values in the color data.
 * - Need to figure out a way to transform the data quicker
 *
 * @private
 *
 * @param {Function} postRenderCallback
 */
class WGLRenderer {

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Returns an orthographic perspective matrix
     * @private
     * @param {number} width
     * the width of the viewport in pixels
     * @param {number} height
     * the height of the viewport in pixels
     */
    private static orthoMatrix(width: number, height: number): Array<number> {
        const near = 0,
            far = 1;

        return [
            2 / width, 0, 0, 0,
            0, -(2 / height), 0, 0,
            0, 0, -2 / (far - near), 0,
            -1, 1, -(far + near) / (far - near), 1
        ];
    }

    /**
     * @private
     */
    private static seriesPointCount(series: Series): number {
        let isStacked: boolean,
            xData: Array<number>,
            s: number;

        if (series.boosted) {
            isStacked = !!series.options.stacking;
            xData = (
                series.xData ||
                (series.options as any).xData ||
                series.processedXData
            );
            s = (isStacked ? series.data : (xData || series.options.data))
                .length;

            if (series.type === 'treemap') {
                s *= 12;
            } else if (series.type === 'heatmap') {
                s *= 6;
            } else if (asBar[series.type]) {
                s *= 2;
            }

            return s;
        }

        return 0;
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(postRenderCallback: WGLRendererCallbackFunction) {
        this.postRenderCallback = postRenderCallback;
        this.settings = {
            pointSize: 1,
            lineWidth: 1,
            fillColor: '#AA00AA',
            useAlpha: true,
            usePreallocated: false,
            useGPUTranslations: false,
            debug: {
                timeRendering: false,
                timeSeriesProcessing: false,
                timeSetup: false,
                timeBufferCopy: false,
                timeKDTree: false,
                showSkipSummary: false
            }
        };
    }

    /* *
     *
     *  Properties
     *
     * */

    // Opengl context
    private gl?: WebGLRenderingContext;

    // The data to render - array of coordinates
    private data: Array<number> = [];

    // Height of our viewport in pixels
    private height = 0;

    // Is it inited?
    private isInited = false;

    // Shader
    private shader?: WGLShader;

    // The marker data
    private markerData: Array<number> = [];

    private postRenderCallback?: WGLRendererCallbackFunction;

    // Render settings
    public settings: WGLOptions;

    // The series stack
    private series: Array<WGLSeriesObject> = [];

    // Texture handles
    private textureHandles: Record<string, WGLTextureObject> = {};

    // Vertex buffers - keyed on shader attribute name
    private vbuffer?: WGLVertexBuffer;

    // Width of our viewport in pixels
    private width = 0;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    private getPixelRatio(): number {
        return this.settings.pixelRatio || win.devicePixelRatio || 1;
    }

    /**
     * @private
     */
    public setOptions(options: BoostOptions): void {

        // The pixelRatio defaults to 1. This is an antipattern, we should
        // refactor the Boost options to include an object of default options as
        // base for the merge, like other components.
        if (!('pixelRatio' in options)) {
            options.pixelRatio = 1;
        }
        merge(true, this.settings, options);
    }

    /**
     * Allocate a float buffer to fit all series
     * @private
     */
    public allocateBuffer(chart: Chart): void {
        const vbuffer = this.vbuffer;

        let s = 0;

        if (!this.settings.usePreallocated) {
            return;
        }

        chart.series.forEach((series: Series): void => {
            if (series.boosted) {
                s += WGLRenderer.seriesPointCount(series);
            }
        });

        vbuffer && vbuffer.allocate(s);
    }

    /**
     * @private
     */
    public allocateBufferForSingleSeries(series: Series): void {
        const vbuffer = this.vbuffer;

        let s = 0;

        if (!this.settings.usePreallocated) {
            return;
        }

        if (series.boosted) {
            s = WGLRenderer.seriesPointCount(series);
        }

        vbuffer && vbuffer.allocate(s);
    }

    /**
     * Clear the depth and color buffer
     * @private
     */
    public clear(): void {
        const gl = this.gl;

        gl && gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Push data for a single series
     * This calculates additional vertices and transforms the data to be
     * aligned correctly in memory
     * @private
     */
    private pushSeriesData(
        series: Series,
        inst: WGLSeriesObject
    ): void {
        const data = this.data,
            settings = this.settings,
            vbuffer = this.vbuffer,
            isRange = (
                series.pointArrayMap &&
                series.pointArrayMap.join(',') === 'low,high'
            ),
            { chart, options, sorted, xAxis, yAxis } = series,
            isStacked = !!options.stacking,
            rawData = options.data,
            xExtremes = series.xAxis.getExtremes(),
            xMin = xExtremes.min,
            xMax = xExtremes.max,
            yExtremes = series.yAxis.getExtremes(),
            yMin = yExtremes.min,
            yMax = yExtremes.max,
            xData =
                series.xData || (options as any).xData || series.processedXData,
            yData =
                series.yData || (options as any).yData || series.processedYData,
            zData = (
                series.zData || (options as any).zData ||
                (series as any).processedZData
            ),
            useRaw = !xData || xData.length === 0,
            // threshold = options.threshold,
            // yBottom = chart.yAxis[0].getThreshold(threshold),
            // hasThreshold = isNumber(threshold),
            // colorByPoint = series.options.colorByPoint,
            // This is required for color by point, so make sure this is
            // uncommented if enabling that
            // colorIndex = 0,
            // Required for color axis support
            // caxis,
            connectNulls = options.connectNulls,
            // For some reason eslint/TypeScript don't pick up that this is
            // actually used: --- bre1470: it is never read, just set
            // maxVal: (number|undefined), // eslint-disable-line no-unused-vars
            points: Array<WGLPoint> =
                series.points || (false as any),
            sdata = isStacked ? series.data : (xData || rawData),
            closestLeft = { x: Number.MAX_VALUE, y: 0 },
            closestRight = { x: -Number.MAX_VALUE, y: 0 },
            cullXThreshold = 1,
            cullYThreshold = 1,
            chartDestroyed = typeof chart.index === 'undefined',
            drawAsBar = asBar[series.type],
            zoneAxis = options.zoneAxis || 'y',
            zones = options.zones || false,
            threshold: number = options.threshold as any,
            pixelRatio = this.getPixelRatio();

        let // plotHeight = series.chart.plotHeight,
            plotWidth = series.chart.plotWidth,
            lastX: number = false as any,
            lastY: number = false as any,
            minVal: (number|undefined),
            scolor: Color.RGBA,
            //
            skipped = 0,
            hadPoints = false,
            // The following are used in the builder while loop
            x: number,
            y: number,
            d: (number|Array<number>|Record<string, number>),
            z: (number|undefined),
            i = -1,
            px: number = false as any,
            nx: number = false as any,
            low: (number|undefined),
            nextInside = false,
            prevInside = false,
            pcolor: Color.RGBA = false as any,
            isXInside = false,
            isYInside = true,
            firstPoint = true,
            zoneColors: Array<Color.RGBA>,
            zoneDefColor: (Color.RGBA|undefined) = false as any,
            gapSize: number = false as any,
            vlen = 0;

        if (options.boostData && options.boostData.length > 0) {
            return;
        }

        if (options.gapSize) {
            gapSize = options.gapUnit !== 'value' ?
                options.gapSize * (series.closestPointRange as any) :
                options.gapSize;
        }

        if (zones) {
            zoneColors = [];

            zones.forEach((zone, i): void => {
                if (zone.color) {
                    const zoneColor = color(zone.color).rgba as Color.RGBA;
                    zoneColor[0] /= 255.0;
                    zoneColor[1] /= 255.0;
                    zoneColor[2] /= 255.0;
                    zoneColors[i] = zoneColor;

                    if (!zoneDefColor && typeof zone.value === 'undefined') {
                        zoneDefColor = zoneColor;
                    }
                }
            });

            if (!zoneDefColor) {
                const seriesColor = (
                    (series.pointAttribs && series.pointAttribs().fill) ||
                    series.color
                );
                zoneDefColor = color(seriesColor).rgba as Color.RGBA;
                zoneDefColor[0] /= 255.0;
                zoneDefColor[1] /= 255.0;
                zoneDefColor[2] /= 255.0;
            }
        }

        if (chart.inverted) {
            // plotHeight = series.chart.plotWidth;
            plotWidth = series.chart.plotHeight;
        }

        series.closestPointRangePx = Number.MAX_VALUE;

        /**
         * Push color to color buffer - need to do this per vertex.
         * @private
         */
        const pushColor = (color?: Color.RGBA): void => {
            if (color) {
                inst.colorData.push(color[0]);
                inst.colorData.push(color[1]);
                inst.colorData.push(color[2]);
                inst.colorData.push(color[3]);
            }
        };

        /**
         * Push a vertice to the data buffer.
         * @private
         */
        const vertice = (
            x: number,
            y: number,
            checkTreshold?: boolean,
            pointSize: number = 1,
            color?: Color.RGBA
        ): void => {
            pushColor(color);

            // Correct for pixel ratio
            if (
                pixelRatio !== 1 && (
                    !settings.useGPUTranslations ||
                    inst.skipTranslation
                )
            ) {
                x *= pixelRatio;
                y *= pixelRatio;
                pointSize *= pixelRatio;
            }

            if (settings.usePreallocated && vbuffer) {
                vbuffer.push(x, y, checkTreshold ? 1 : 0, pointSize);
                vlen += 4;
            } else {
                data.push(x);
                data.push(y);
                data.push(checkTreshold ? pixelRatio : 0);
                data.push(pointSize);
            }
        };

        /**
         * @private
         */
        const closeSegment = (): void => {
            if (inst.segments.length) {
                inst.segments[
                    inst.segments.length - 1
                ].to = data.length || vlen;
            }
        };

        /**
         * Create a new segment for the current set.
         * @private
         */
        const beginSegment = (): void => {
            // Insert a segment on the series.
            // A segment is just a start indice.
            // When adding a segment, if one exists from before, it should
            // set the previous segment's end

            if (
                inst.segments.length &&
                inst.segments[inst.segments.length - 1].from === (
                    data.length || vlen
                )
            ) {
                return;
            }

            closeSegment();

            inst.segments.push({
                from: data.length || vlen
            });

        };

        /**
         * Push a rectangle to the data buffer.
         * @private
         */
        const pushRect = (
            x: number,
            y: number,
            w: number,
            h: number,
            color?: Color.RGBA
        ): void => {
            pushColor(color);
            vertice(x + w, y);
            pushColor(color);
            vertice(x, y);
            pushColor(color);
            vertice(x, y + h);

            pushColor(color);
            vertice(x, y + h);
            pushColor(color);
            vertice(x + w, y + h);
            pushColor(color);
            vertice(x + w, y);
        };

        // Create the first segment
        beginSegment();

        // Special case for point shapes
        if (points && points.length > 0) {

            // If we're doing points, we assume that the points are already
            // translated, so we skip the shader translation.
            inst.skipTranslation = true;
            // Force triangle draw mode
            inst.drawMode = 'TRIANGLES';

            // We don't have a z component in the shader, so we need to sort.
            if (points[0].node && points[0].node.levelDynamic) {
                points.sort((a, b): number => {
                    if (a.node) {
                        if (
                            (a.node.levelDynamic as any) >
                            (b.node as any).levelDynamic
                        ) {
                            return 1;
                        }
                        if (
                            (a.node.levelDynamic as any) <
                            (b.node as any).levelDynamic
                        ) {
                            return -1;
                        }
                    }
                    return 0;
                });
            }

            points.forEach((point: Point): void => {
                const plotY = point.plotY;

                let swidth,
                    pointAttr;

                if (
                    typeof plotY !== 'undefined' &&
                    !isNaN(plotY) &&
                    point.y !== null &&
                    point.shapeArgs
                ) {
                    let { x = 0, y = 0, width = 0, height = 0 } =
                        point.shapeArgs;

                    pointAttr = chart.styledMode ?
                        (point.series as ColorMapComposition.SeriesComposition)
                            .colorAttribs(
                                point as ColorMapComposition.PointComposition
                            ) :
                        pointAttr = point.series.pointAttribs(point);

                    swidth = pointAttr['stroke-width'] || 0;

                    // Handle point colors
                    pcolor = color(pointAttr.fill).rgba as any;
                    pcolor[0] /= 255.0;
                    pcolor[1] /= 255.0;
                    pcolor[2] /= 255.0;

                    // So there are two ways of doing this. Either we can
                    // create a rectangle of two triangles, or we can do a
                    // point and use point size. Latter is faster, but
                    // only supports squares. So we're doing triangles.
                    // We could also use one color per. vertice to get
                    // better color interpolation.

                    // If there's stroking, we do an additional rect
                    if (series.is('treemap')) {
                        swidth = swidth || 1;
                        scolor = color(pointAttr.stroke).rgba as any;

                        scolor[0] /= 255.0;
                        scolor[1] /= 255.0;
                        scolor[2] /= 255.0;

                        pushRect(x, y, width, height, scolor);

                        swidth /= 2;
                    }
                    // } else {
                    //     swidth = 0;
                    // }

                    // Fixes issues with inverted heatmaps (see #6981). The root
                    // cause is that the coordinate system is flipped. In other
                    // words, instead of [0,0] being top-left, it's
                    // bottom-right. This causes a vertical and horizontal flip
                    // in the resulting image, making it rotated 180 degrees.
                    if (series.is('heatmap') && chart.inverted) {
                        x = xAxis.len - x;
                        y = yAxis.len - y;
                        width = -width;
                        height = -height;
                    }

                    pushRect(
                        x + swidth,
                        y + swidth,
                        width - (swidth * 2),
                        height - (swidth * 2),
                        pcolor
                    );
                }
            });

            closeSegment();

            return;
        }

        // Extract color axis
        // (chart.axes || []).forEach((a): void => {
        //     if (H.ColorAxis && a instanceof H.ColorAxis) {
        //         caxis = a;
        //     }
        // });

        while (i < sdata.length - 1) {
            d = sdata[++i];

            if (typeof d === 'undefined') {
                continue;
            }

            // px = x = y = z = nx = low = false;
            // chartDestroyed = typeof chart.index === 'undefined';
            // nextInside = prevInside = pcolor = isXInside = isYInside = false;
            // drawAsBar = asBar[series.type];

            if (chartDestroyed) {
                break;
            }

            // Uncomment this to enable color by point.
            // This currently left disabled as the charts look really ugly
            // when enabled and there's a lot of points.
            // Leaving in for the future (tm).
            // if (colorByPoint) {
            //     colorIndex = ++colorIndex %
            //         series.chart.options.colors.length;
            //     pcolor = toRGBAFast(series.chart.options.colors[colorIndex]);
            //     pcolor[0] /= 255.0;
            //     pcolor[1] /= 255.0;
            //     pcolor[2] /= 255.0;
            // }

            // Handle the point.color option (#5999)
            const pointOptions = rawData && rawData[i];
            if (!useRaw && isObject(pointOptions, true)) {
                if (pointOptions.color) {
                    pcolor = color(pointOptions.color).rgba as any;
                    pcolor[0] /= 255.0;
                    pcolor[1] /= 255.0;
                    pcolor[2] /= 255.0;
                }
            }

            if (useRaw) {
                x = (d as any)[0];
                y = (d as any)[1];

                if (sdata[i + 1]) {
                    nx = sdata[i + 1][0];
                }

                if (sdata[i - 1]) {
                    px = sdata[i - 1][0];
                }

                if ((d as any).length >= 3) {
                    z = (d as any)[2];

                    if ((d as any)[2] > inst.zMax) {
                        inst.zMax = (d as any)[2];
                    }

                    if ((d as any)[2] < inst.zMin) {
                        inst.zMin = (d as any)[2];
                    }
                }

            } else {
                x = d as any;
                y = yData[i];

                if (sdata[i + 1]) {
                    nx = sdata[i + 1];
                }

                if (sdata[i - 1]) {
                    px = sdata[i - 1];
                }

                if (zData && zData.length) {
                    z = zData[i];

                    if (zData[i] > inst.zMax) {
                        inst.zMax = zData[i];
                    }

                    if (zData[i] < inst.zMin) {
                        inst.zMin = zData[i];
                    }
                }
            }

            if (!connectNulls && (x === null || y === null)) {
                beginSegment();
                continue;
            }

            if (nx && nx >= xMin && nx <= xMax) {
                nextInside = true;
            }

            if (px && px >= xMin && px <= xMax) {
                prevInside = true;
            }

            if (isRange) {
                if (useRaw) {
                    y = (d as any).slice(1, 3);
                }

                low = (y as any)[0];
                y = (y as any)[1];

            } else if (isStacked) {
                x = (d as any).x;
                y = (d as any).stackY;
                low = (y as any) - (d as any).y;
            }

            if (yMin !== null &&
                typeof yMin !== 'undefined' &&
                yMax !== null &&
                typeof yMax !== 'undefined'
            ) {
                isYInside = y >= yMin && y <= yMax;
            }

            if (x > xMax && closestRight.x < xMax) {
                closestRight.x = x;
                closestRight.y = y;
            }

            if (x < xMin && closestLeft.x > xMin) {
                closestLeft.x = x;
                closestLeft.y = y;
            }

            if (y === null && connectNulls) {
                continue;
            }

            // Cull points outside the extremes
            if (y === null || (!isYInside && !nextInside && !prevInside)) {
                beginSegment();
                continue;
            }

            // The first point before and first after extremes should be
            // rendered (#9962, 19701)
            if (
                sorted &&
                (nx >= xMin || x >= xMin) &&
                (px <= xMax || x <= xMax)
            ) {
                isXInside = true;
            }

            if (!isXInside && !nextInside && !prevInside) {
                continue;
            }

            if (gapSize && x - px > gapSize) {
                beginSegment();
            }

            // Note: Boost requires that zones are sorted!
            if (zones) {
                let zoneColor: Color.RGBA|undefined;
                zones.some(( // eslint-disable-line no-loop-func
                    zone: SeriesZonesOptions,
                    i: number
                ): boolean => {
                    const last: SeriesZonesOptions = (zones as any)[i - 1];

                    if (zoneAxis === 'x') {
                        if (
                            typeof zone.value !== 'undefined' &&
                            x <= zone.value
                        ) {
                            if (
                                zoneColors[i] &&
                                (!last || x >= (last.value as any))
                            ) {
                                zoneColor = zoneColors[i];
                            }
                            return true;
                        }
                        return false;
                    }

                    if (typeof zone.value !== 'undefined' && y <= zone.value) {
                        if (
                            zoneColors[i] &&
                            (!last || y >= (last.value as any))
                        ) {
                            zoneColor = zoneColors[i];
                        }
                        return true;
                    }
                    return false;
                });

                pcolor = zoneColor || zoneDefColor || pcolor;
            }

            // Skip translations - temporary floating point fix
            if (!settings.useGPUTranslations) {
                inst.skipTranslation = true;
                x = xAxis.toPixels(x, true);
                y = yAxis.toPixels(y, true);

                // Make sure we're not drawing outside of the chart area.
                // See #6594. Update: this is no longer required as far as I
                // can tell. Leaving in for git blame in case there are edge
                // cases I've not found. Having this in breaks #10246.

                // if (y > plotHeight) {
                // y = plotHeight;
                // }

                if (x > plotWidth) {
                    // If this is  rendered as a point, just skip drawing it
                    // entirely, as we're not dependandt on lineTo'ing to it.
                    // See #8197
                    if (inst.drawMode === 'POINTS') {
                        continue;
                    }

                    // Having this here will clamp markers and make the angle
                    // of the last line wrong. See 9166.
                    // x = plotWidth;

                }

            }

            // No markers on out of bounds things.
            // Out of bound things are shown if and only if the next
            // or previous point is inside the rect.
            if (inst.hasMarkers && isXInside) {
                // x = Highcharts.correctFloat(
                //     Math.min(Math.max(-1e5, xAxis.translate(
                //         x,
                //         0,
                //         0,
                //         0,
                //         1,
                //         0.5,
                //         false
                //     )), 1e5)
                // );

                if ((lastX as any) !== false) {
                    series.closestPointRangePx = Math.min(
                        series.closestPointRangePx,
                        Math.abs(x - lastX)
                    );
                }
            }

            // If the last _drawn_ point is closer to this point than the
            // threshold, skip it. Shaves off 20-100ms in processing.
            if (!settings.useGPUTranslations &&
                !settings.usePreallocated &&
                (lastX && Math.abs(x - lastX) < cullXThreshold) &&
                (lastY && Math.abs(y - lastY) < cullYThreshold)
            ) {
                if (settings.debug.showSkipSummary) {
                    ++skipped;
                }

                continue;
            }

            if (drawAsBar) {
                // maxVal = y;
                minVal = low;

                if ((low as any) === false || typeof low === 'undefined') {
                    if (y < 0) {
                        minVal = y;
                    } else {
                        minVal = 0;
                    }
                }

                if (!isRange && !isStacked) {
                    minVal = Math.max(
                        threshold === null ? yMin : threshold, // #5268
                        yMin
                    ); // #8731
                }
                if (!settings.useGPUTranslations) {
                    minVal = yAxis.toPixels(minVal as any, true);
                }

                // Need to add an extra point here
                vertice(x, minVal as any, 0 as any, 0, pcolor);
            }

            // Do step line if enabled.
            // Draws an additional point at the old Y at the new X.
            // See #6976.

            if (options.step && !firstPoint) {
                vertice(
                    x,
                    lastY,
                    0 as any,
                    2,
                    pcolor
                );
            }

            vertice(
                x,
                y,
                0 as any,
                series.type === 'bubble' ? (z || 1) : 2,
                pcolor
            );

            // Uncomment this to support color axis.
            // if (caxis) {
            //     pcolor = color(caxis.toColor(y)).rgba;

            //     inst.colorData.push(color[0] / 255.0);
            //     inst.colorData.push(color[1] / 255.0);
            //     inst.colorData.push(color[2] / 255.0);
            //     inst.colorData.push(color[3]);
            // }

            lastX = x;
            lastY = y;

            hadPoints = true;
            firstPoint = false;
        }

        if (settings.debug.showSkipSummary) {
            console.log('skipped points:', skipped); // eslint-disable-line no-console
        }

        const pushSupplementPoint = (
            point: PositionObject,
            atStart?: boolean
        ): void => {
            if (!settings.useGPUTranslations) {
                inst.skipTranslation = true;
                point.x = xAxis.toPixels(point.x, true);
                point.y = yAxis.toPixels(point.y, true);
            }

            // We should only do this for lines, and we should ignore markers
            // since there's no point here that would have a marker.

            if (atStart) {
                this.data = [point.x, point.y, 0, 2].concat(this.data);
                return;
            }

            vertice(
                point.x,
                point.y,
                0 as any,
                2
            );
        };

        if (
            !hadPoints &&
            connectNulls !== false &&
            (series as any).drawMode === 'line_strip'
        ) {
            if (closestLeft.x < Number.MAX_VALUE) {
                // We actually need to push this *before* the complete buffer.
                pushSupplementPoint(closestLeft, true);
            }

            if (closestRight.x > -Number.MAX_VALUE) {
                pushSupplementPoint(closestRight);
            }
        }

        closeSegment();
    }

    /**
     * Push a series to the renderer
     * If we render the series immediatly, we don't have to loop later
     * @private
     * @param {Highchart.Series} s
     * The series to push.
     */
    public pushSeries(s: Series): void {
        const markerData = this.markerData,
            series = this.series,
            settings = this.settings;

        if (series.length > 0) {
            // series[series.length - 1].to = data.length;
            if (series[series.length - 1].hasMarkers) {
                series[series.length - 1].markerTo = markerData.length;
            }
        }

        if (settings.debug.timeSeriesProcessing) {
            console.time('building ' + s.type + ' series'); // eslint-disable-line no-console
        }

        const obj = {
            segments: [],
            // from: data.length,
            markerFrom: markerData.length,
            // Push RGBA values to this array to use per. point coloring.
            // It should be 0-padded, so each component should be pushed in
            // succession.
            colorData: [],
            series: s,
            zMin: Number.MAX_VALUE,
            zMax: -Number.MAX_VALUE,
            hasMarkers: s.options.marker ?
                s.options.marker.enabled !== false :
                false,
            showMarkers: true,
            drawMode: WGLDrawMode[s.type] || 'LINE_STRIP'
        };

        if (s.index >= series.length) {
            series.push(obj);
        } else {
            series[s.index] = obj;
        }

        // Add the series data to our buffer(s)
        this.pushSeriesData(s, obj);

        if (settings.debug.timeSeriesProcessing) {
            console.timeEnd('building ' + s.type + ' series'); // eslint-disable-line no-console
        }
    }

    /**
     * Flush the renderer.
     * This removes pushed series and vertices.
     * Should be called after clearing and before rendering
     * @private
     */
    private flush(): void {
        const vbuffer = this.vbuffer;

        this.data = [];
        this.markerData = [];
        this.series = [];

        if (vbuffer) {
            vbuffer.destroy();
        }
    }

    /**
     * Pass x-axis to shader
     * @private
     * @param {Highcharts.Axis} axis
     * The x-axis.
     */
    private setXAxis(axis: Axis): void {
        const shader = this.shader;

        if (!shader) {
            return;
        }

        const pixelRatio = this.getPixelRatio();

        shader.setUniform('xAxisTrans', axis.transA * pixelRatio);
        shader.setUniform('xAxisMin', axis.min as any);
        shader.setUniform('xAxisMinPad', axis.minPixelPadding * pixelRatio);
        shader.setUniform('xAxisPointRange', axis.pointRange);
        shader.setUniform('xAxisLen', axis.len * pixelRatio);
        shader.setUniform('xAxisPos', axis.pos * pixelRatio);
        shader.setUniform('xAxisCVSCoord', (!axis.horiz) as any);
        shader.setUniform('xAxisIsLog', (!!axis.logarithmic) as any);
        shader.setUniform('xAxisReversed', (!!axis.reversed) as any);
    }

    /**
     * Pass y-axis to shader
     * @private
     * @param {Highcharts.Axis} axis
     * The y-axis.
     */
    private setYAxis(axis: Axis): void {
        const shader = this.shader;

        if (!shader) {
            return;
        }

        const pixelRatio = this.getPixelRatio();

        shader.setUniform('yAxisTrans', axis.transA * pixelRatio);
        shader.setUniform('yAxisMin', axis.min as any);
        shader.setUniform('yAxisMinPad', axis.minPixelPadding * pixelRatio);
        shader.setUniform('yAxisPointRange', axis.pointRange);
        shader.setUniform('yAxisLen', axis.len * pixelRatio);
        shader.setUniform('yAxisPos', axis.pos * pixelRatio);
        shader.setUniform('yAxisCVSCoord', (!axis.horiz) as any);
        shader.setUniform('yAxisIsLog', (!!axis.logarithmic) as any);
        shader.setUniform('yAxisReversed', (!!axis.reversed) as any);
    }

    /**
     * Set the translation threshold
     * @private
     * @param {boolean} has
     * Has threshold flag.
     * @param {numbe} translation
     * The threshold.
     */
    private setThreshold(has: boolean, translation: number): void {
        const shader = this.shader;

        if (!shader) {
            return;
        }

        shader.setUniform('hasThreshold', has as any);
        shader.setUniform('translatedThreshold', translation);
    }

    /**
     * Render the data
     * This renders all pushed series.
     * @private
     */
    private renderChart(chart: Chart): (false|undefined) {
        const gl = this.gl,
            settings = this.settings,
            shader = this.shader,
            vbuffer = this.vbuffer;

        const pixelRatio = this.getPixelRatio();
        if (chart) {
            this.width = chart.chartWidth * pixelRatio;
            this.height = chart.chartHeight * pixelRatio;
        } else {
            return false;
        }

        const height = this.height,
            width = this.width;

        if (!gl || !shader || !width || !height) {
            return false;
        }

        if (settings.debug.timeRendering) {
            console.time('gl rendering'); // eslint-disable-line no-console
        }

        gl.canvas.width = width;
        gl.canvas.height = height;

        shader.bind();

        gl.viewport(0, 0, width, height);
        shader.setPMatrix(WGLRenderer.orthoMatrix(width, height));

        if (settings.lineWidth > 1 && !H.isMS) {
            gl.lineWidth(settings.lineWidth);
        }

        if (vbuffer) {
            vbuffer.build(this.data, 'aVertexPosition', 4);
            vbuffer.bind();
        }

        shader.setInverted(chart.inverted as any);

        // Render the series
        this.series.forEach((
            s: WGLSeriesObject,
            si: number
        ): void => {
            const options = s.series.options,
                shapeOptions = options.marker,
                lineWidth = (
                    typeof options.lineWidth !== 'undefined' ?
                        options.lineWidth :
                        1
                ),
                threshold: number = options.threshold as any,
                hasThreshold = isNumber(threshold),
                yBottom = s.series.yAxis.getThreshold(threshold),
                translatedThreshold = yBottom,
                showMarkers = pick(
                    options.marker ? options.marker.enabled : null,
                    s.series.xAxis.isRadial ? true : null,
                    (s.series.closestPointRangePx as any) >
                        2 * ((
                            options.marker ?
                                options.marker.radius :
                                10
                        ) || 10)
                ),
                shapeTexture = this.textureHandles[
                    (shapeOptions && shapeOptions.symbol) ||
                    (s.series.symbol as any)
                ] || this.textureHandles.circle;

            let sindex,
                cbuffer,
                fillColor,
                scolor = [];

            if (
                s.segments.length === 0 ||
                s.segments[0].from === s.segments[0].to
            ) {
                return;
            }

            if (shapeTexture.isReady) {
                gl.bindTexture(gl.TEXTURE_2D, shapeTexture.handle);
                shader.setTexture(shapeTexture.handle as any);
            }

            if (chart.styledMode) {
                fillColor = (
                    s.series.markerGroup &&
                    s.series.markerGroup.getStyle('fill')
                );

            } else {
                fillColor =
                    (
                        s.drawMode === 'POINTS' && // #14260
                        s.series.pointAttribs &&
                        s.series.pointAttribs().fill
                    ) ||
                    s.series.color;

                if (options.colorByPoint) {
                    fillColor = (s.series.chart.options.colors as any)[si];
                }
            }

            if (s.series.fillOpacity && (options as any).fillOpacity) {
                fillColor = new Color(fillColor).setOpacity(
                    pick((options as any).fillOpacity, 1.0)
                ).get();
            }

            scolor = color(fillColor).rgba;

            if (!settings.useAlpha) {
                scolor[3] = 1.0;
            }

            // This is very much temporary
            if (
                s.drawMode === 'LINES' &&
                settings.useAlpha &&
                (scolor[3] as any) < 1
            ) {
                (scolor[3] as any) /= 10;
            }

            // Blending
            if (options.boostBlending === 'add') {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                gl.blendEquation(gl.FUNC_ADD);

            } else if ((options.boostBlending as any) === 'mult' ||
                options.boostBlending === 'multiply'
            ) {
                gl.blendFunc(gl.DST_COLOR, gl.ZERO);

            } else if (options.boostBlending === 'darken') {
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.blendEquation(gl.FUNC_MIN);

            } else {
                // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                // gl.blendEquation(gl.FUNC_ADD);
                gl.blendFuncSeparate(
                    gl.SRC_ALPHA,
                    gl.ONE_MINUS_SRC_ALPHA,
                    gl.ONE,
                    gl.ONE_MINUS_SRC_ALPHA
                );
            }

            shader.reset();

            // If there are entries in the colorData buffer, build and bind it.
            if (s.colorData.length > 0) {
                shader.setUniform('hasColor', 1);
                cbuffer = new WGLVertexBuffer(gl, shader);
                cbuffer.build(
                    // The color array attribute for vertex is assigned from 0,
                    // so it needs to be shifted to be applied to further
                    // segments. #18858
                    Array(s.segments[0].from).concat(s.colorData),
                    'aColor', 4
                );
                cbuffer.bind();
            } else {
                // Set the hasColor uniform to false (0) when the series
                // contains no colorData buffer points. #18858
                shader.setUniform('hasColor', 0);

                // #15869, a buffer with fewer points might already be bound by
                // a different series/chart causing out of range errors
                gl.disableVertexAttribArray(
                    gl.getAttribLocation(shader.getProgram() as any, 'aColor')
                );
            }

            // Set series specific uniforms
            shader.setColor(scolor);
            this.setXAxis(s.series.xAxis);
            this.setYAxis(s.series.yAxis);
            this.setThreshold(hasThreshold, translatedThreshold as any);

            if (s.drawMode === 'POINTS') {
                shader.setPointSize(pick(
                    options.marker && options.marker.radius,
                    0.5
                ) * 2 * pixelRatio);
            }

            // If set to true, the toPixels translations in the shader
            // is skipped, i.e it's assumed that the value is a pixel coord.
            shader.setSkipTranslation(s.skipTranslation);

            if (s.series.type === 'bubble') {
                shader.setBubbleUniforms(
                    s.series as any,
                    s.zMin,
                    s.zMax,
                    pixelRatio
                );
            }

            shader.setDrawAsCircle(
                asCircle[s.series.type] || false
            );

            if (!vbuffer) {
                return;
            }

            // Do the actual rendering
            // If the line width is < 0, skip rendering of the lines. See #7833.
            if (lineWidth > 0 || s.drawMode !== 'LINE_STRIP') {
                for (sindex = 0; sindex < s.segments.length; sindex++) {
                    vbuffer.render(
                        s.segments[sindex].from,
                        s.segments[sindex].to,
                        s.drawMode
                    );
                }
            }

            if (s.hasMarkers && showMarkers) {
                shader.setPointSize(pick(
                    options.marker && options.marker.radius,
                    5
                ) * 2 * pixelRatio);

                shader.setDrawAsCircle(true);
                for (sindex = 0; sindex < s.segments.length; sindex++) {
                    vbuffer.render(
                        s.segments[sindex].from,
                        s.segments[sindex].to,
                        'POINTS'
                    );
                }
            }
        });

        if (settings.debug.timeRendering) {
            console.timeEnd('gl rendering'); // eslint-disable-line no-console
        }

        if (this.postRenderCallback) {
            this.postRenderCallback(this);
        }

        this.flush();
    }

    /**
     * Render the data when ready
     * @private
     */
    public render(chart: Chart): (false|undefined) {
        this.clear();

        if (chart.renderer.forExport) {
            return this.renderChart(chart);
        }

        if (this.isInited) {
            this.renderChart(chart);
        } else {
            setTimeout((): void => {
                this.render(chart);
            }, 1);
        }
    }

    /**
     * Set the viewport size in pixels
     * Creates an orthographic perspective matrix and applies it.
     * @private
     */
    public setSize(width: number, height: number): void {
        const shader = this.shader;

        // Skip if there's no change, or if we have no valid shader
        if (!shader || (this.width === width && this.height === height)) {
            return;
        }

        this.width = width;
        this.height = height;

        shader.bind();
        shader.setPMatrix(WGLRenderer.orthoMatrix(width, height));
    }

    /**
     * Init OpenGL
     * @private
     */
    public init(canvas?: HTMLCanvasElement, noFlush?: boolean): boolean {
        const settings = this.settings;

        this.isInited = false;

        if (!canvas) {
            return false;
        }

        if (settings.debug.timeSetup) {
            console.time('gl setup'); // eslint-disable-line no-console
        }

        for (let i = 0; i < contexts.length; ++i) {
            this.gl = canvas.getContext(contexts[i], {
            //    premultipliedAlpha: false
            }) as any;
            if (this.gl) {
                break;
            }
        }

        const gl = this.gl;

        if (gl) {
            if (!noFlush) {
                this.flush();
            }
        } else {
            return false;
        }

        gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        // gl.depthMask(gl.FALSE);
        gl.depthFunc(gl.LESS);

        const shader = this.shader = new WGLShader(gl);

        if (!shader) {
            // We need to abort, there's no shader context
            return false;
        }

        this.vbuffer = new WGLVertexBuffer(gl, shader);

        const createTexture = (
            name: string,
            fn: WGLTextureCallbackFunction
        ): void => {
            const props: WGLTextureObject = {
                    isReady: false,
                    texture: doc.createElement('canvas'),
                    handle: gl.createTexture()
                },
                ctx: CanvasRenderingContext2D =
                    props.texture.getContext('2d') as any;

            this.textureHandles[name] = props;

            props.texture.width = 512;
            props.texture.height = 512;

            ctx.mozImageSmoothingEnabled = false;
            ctx.webkitImageSmoothingEnabled = false;
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0)';
            ctx.fillStyle = '#FFF';

            fn(ctx);

            try {

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, props.handle);
                // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    props.texture
                );

                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                );

                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                );

                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR
                );

                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                );

                // gl.generateMipmap(gl.TEXTURE_2D);

                gl.bindTexture(gl.TEXTURE_2D, null);

                props.isReady = true;
            } catch (e) {
                // silent error
            }
        };

        // Circle shape
        createTexture('circle', (ctx: CanvasRenderingContext2D): void => {
            ctx.beginPath();
            ctx.arc(256, 256, 256, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        });

        // Square shape
        createTexture('square', (ctx: CanvasRenderingContext2D): void => {
            ctx.fillRect(0, 0, 512, 512);
        });

        // Diamond shape
        createTexture('diamond', (ctx: CanvasRenderingContext2D): void => {
            ctx.beginPath();
            ctx.moveTo(256, 0);
            ctx.lineTo(512, 256);
            ctx.lineTo(256, 512);
            ctx.lineTo(0, 256);
            ctx.lineTo(256, 0);
            ctx.fill();
        });

        // Triangle shape
        createTexture('triangle', (ctx: CanvasRenderingContext2D): void => {
            ctx.beginPath();
            ctx.moveTo(0, 512);
            ctx.lineTo(256, 0);
            ctx.lineTo(512, 512);
            ctx.lineTo(0, 512);
            ctx.fill();
        });

        // Triangle shape (rotated)
        createTexture('triangle-down', (
            ctx: CanvasRenderingContext2D
        ): void => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(256, 512);
            ctx.lineTo(512, 0);
            ctx.lineTo(0, 0);
            ctx.fill();
        });

        this.isInited = true;

        if (settings.debug.timeSetup) {
            console.timeEnd('gl setup'); // eslint-disable-line no-console
        }

        return true;
    }

    /**
     * @private
     * @todo use it
     */
    public destroy(): void {
        const gl = this.gl,
            shader = this.shader,
            vbuffer = this.vbuffer;

        this.flush();

        if (vbuffer) {
            vbuffer.destroy();
        }

        if (shader) {
            shader.destroy();
        }

        if (gl) {

            objectEach(this.textureHandles, (texture): void => {
                if (texture.handle) {
                    gl.deleteTexture(texture.handle);
                }
            });

            gl.canvas.width = 1;
            gl.canvas.height = 1;
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default WGLRenderer;
