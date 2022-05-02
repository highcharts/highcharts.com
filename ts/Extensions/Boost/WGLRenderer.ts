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

import type Axis from '../../Core/Axis/Axis';
import type Chart from '../../Core/Chart/Chart';
import type ColorMapMixin from '../../Series/ColorMapMixin';
import type ColorString from '../../Core/Color/ColorString';
import type Point from '../../Core/Series/Point';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type Series from '../../Core/Series/Series';
import type { SeriesZonesOptions } from '../../Core/Series/SeriesOptions';

import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import GLShader from './WGLShader.js';
import GLVertexBuffer from './WGLVBuffer.js';
import H from '../../Core/Globals.js';
const { doc, win } = H;
import U from '../../Core/Utilities.js';
const {
    isNumber,
    isObject,
    merge,
    objectEach,
    pick
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface BoostGLDebugOptions extends BoostDebugOptions {
            timeBufferCopy: boolean;
            timeKDTree: boolean;
            timeRendering: boolean;
            timeSeriesProcessing: boolean;
            timeSetup: boolean;
            showSkipSummary: boolean;
        }
        interface BoostGLNode {
            levelDynamic?: number;
        }
        interface BoostGLOptions extends BoostOptions {
            debug: BoostGLDebugOptions;
            fillColor: ColorString;
            lineWidth: number;
            pointSize?: number;
            useAlpha: boolean;
            useGPUTranslations: boolean;
            usePreallocated: boolean;
        }
        interface BoostGLPoint extends Point {
            node?: BoostGLNode;
        }
        interface BoostGLRenderer {
            data: Array<Array<number>>;
            settings: BoostGLOptions;
            allocateBuffer(chart: Chart): void;
            allocateBufferForSingleSeries(series: Series): void;
            clear(): void;
            destroy(): void;
            flush(): void;
            gl(): WebGLRenderingContext;
            init(canvas?: HTMLCanvasElement, noFlush?: boolean): boolean;
            inited(): boolean;
            orthoMatrix(width: number, height: number): Array<number>;
            pushSeries(s: Series): void;
            render(chart: Chart): (false|undefined);
            setOptions(options: BoostOptions): void;
            setSize(w: number, h: number): void;
            setThreshold(has: boolean, translation: number): void;
            setXAxis(axis: Axis): void;
            setYAxis(axis: Axis): void;
            valid(): boolean;
        }
        interface BoostGLSeriesObject {
            colorData: Array<number>;
            drawMode: BoostGLDrawModeValue;
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
        interface BoostGLTextureCallbackFunction {
            (ctx: CanvasRenderingContext2D): void;
        }
        interface BoostGLTextureObject {
            isReady: boolean;
            texture: HTMLCanvasElement;
            handle: (WebGLTexture|null);
        }
        type BoostGLDrawModeValue = ('line_strip'|'lines'|'points'|'triangles');
    }
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
 * @function GLRenderer
 */
function GLRenderer(
    postRenderCallback: Function
): (false|Highcharts.BoostGLRenderer) {
    //  // Shader
    let shader: Highcharts.BoostGLShader = false as any,
        // Vertex buffers - keyed on shader attribute name
        vbuffer: Highcharts.BoostGLVertexBuffer = false as any,
        vlen = 0,
        // Opengl context
        gl: WebGLRenderingContext = false as any,
        // Width of our viewport in pixels
        width = 0,
        // Height of our viewport in pixels
        height = 0,
        // The data to render - array of coordinates
        data: Array<number> = false as any,
        // The marker data
        markerData: Array<number> = false as any,
        // Exports
        exports: (object|Highcharts.BoostGLRenderer) = {},
        // Is it inited?
        isInited = false,
        // The series stack
        series: Array<Highcharts.BoostGLSeriesObject> = [],
        // Texture handles
        textureHandles: Record<string, (
            Highcharts.BoostGLTextureObject
        )> = {},
        // Things to draw as "rectangles" (i.e lines)
        asBar: Record<string, boolean> = {
            'column': true,
            'columnrange': true,
            'bar': true,
            'area': true,
            'areaspline': true,
            'arearange': true
        },
        asCircle: Record<string, boolean> = {
            'scatter': true,
            'bubble': true
        },
        // Render settings
        settings: Highcharts.BoostGLOptions = {
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

    // /////////////////////////////////////////////////////////////////////////

    /**
     * @private
     */
    function getPixelRatio(): number {
        return settings.pixelRatio || win.devicePixelRatio || 1;
    }

    /**
     * @private
     */
    function setOptions(options: Highcharts.BoostOptions): void {

        // The pixelRatio defaults to 1. This is an antipattern, we should
        // refactor the Boost options to include an object of default options as
        // base for the merge, like other components.
        if (!('pixelRatio' in options)) {
            options.pixelRatio = 1;
        }
        merge(true, settings, options);
    }

    /**
     * @private
     */
    function seriesPointCount(series: Series): number {
        let isStacked: boolean,
            xData: Array<number>,
            s: number;

        if (series.isSeriesBoosting) {
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

    /**
     * Allocate a float buffer to fit all series
     * @private
     */
    function allocateBuffer(chart: Chart): void {
        let s = 0;

        if (!settings.usePreallocated) {
            return;
        }

        chart.series.forEach(function (series: Series): void {
            if (series.isSeriesBoosting) {
                s += seriesPointCount(series);
            }
        });

        vbuffer.allocate(s);
    }

    /**
     * @private
     */
    function allocateBufferForSingleSeries(series: Series): void {
        let s = 0;

        if (!settings.usePreallocated) {
            return;
        }

        if (series.isSeriesBoosting) {
            s = seriesPointCount(series);
        }

        vbuffer.allocate(s);
    }

    /**
     * Returns an orthographic perspective matrix
     * @private
     * @param {number} width
     * the width of the viewport in pixels
     * @param {number} height
     * the height of the viewport in pixels
     */
    function orthoMatrix(width: number, height: number): Array<number> {
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
     * Clear the depth and color buffer
     * @private
     */
    function clear(): void {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    /**
     * Get the WebGL context
     * @private
     * @return {WebGLContext}
     * the context
     */
    function getGL(): WebGLRenderingContext {
        return gl;
    }

    /**
     * Push data for a single series
     * This calculates additional vertices and transforms the data to be
     * aligned correctly in memory
     * @private
     */
    function pushSeriesData(
        series: Series,
        inst: Highcharts.BoostGLSeriesObject
    ): void {
        let isRange = (
                series.pointArrayMap &&
                series.pointArrayMap.join(',') === 'low,high'
            ),
            chart = series.chart,
            options = series.options,
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
            yAxis = series.yAxis,
            xAxis = series.xAxis,
            // plotHeight = series.chart.plotHeight,
            plotWidth = series.chart.plotWidth,
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
            points: Array<Highcharts.BoostGLPoint> =
                series.points || (false as any),
            lastX: number = false as any,
            lastY: number = false as any,
            minVal: (number|undefined),
            scolor: Color.RGBA,
            sdata = isStacked ? series.data : (xData || rawData),
            closestLeft = { x: Number.MAX_VALUE, y: 0 },
            closestRight = { x: -Number.MAX_VALUE, y: 0 },
            //
            skipped = 0,
            hadPoints = false,
            //
            cullXThreshold = 1,
            cullYThreshold = 1,
            // The following are used in the builder while loop
            x: number,
            y: number,
            d: (number|Array<number>|Record<string, number>),
            z: (number|undefined),
            i = -1,
            px: number = false as any,
            nx: number = false as any,
            low: (number|undefined),
            chartDestroyed = typeof chart.index === 'undefined',
            nextInside = false,
            prevInside = false,
            pcolor: Color.RGBA = false as any,
            drawAsBar = asBar[series.type],
            isXInside = false,
            isYInside = true,
            firstPoint = true,
            zoneAxis = options.zoneAxis || 'y',
            zones = options.zones || false,
            zoneColors: Array<Color.RGBA>,
            zoneDefColor: (Color.RGBA|undefined) = false as any,
            threshold: number = options.threshold as any,
            gapSize: number = false as any,
            pixelRatio = getPixelRatio();

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

            zones.forEach(function (zone, i): void {
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
        function pushColor(color?: Color.RGBA): void {
            if (color) {
                inst.colorData.push(color[0]);
                inst.colorData.push(color[1]);
                inst.colorData.push(color[2]);
                inst.colorData.push(color[3]);
            }
        }

        /**
         * Push a vertice to the data buffer.
         * @private
         */
        function vertice(
            x: number,
            y: number,
            checkTreshold?: boolean,
            pointSize: number = 1,
            color?: Color.RGBA
        ): void {
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

            if (settings.usePreallocated) {
                vbuffer.push(x, y, checkTreshold ? 1 : 0, pointSize);
                vlen += 4;
            } else {
                data.push(x);
                data.push(y);
                data.push(checkTreshold ? pixelRatio : 0);
                data.push(pointSize);
            }
        }

        /**
         * @private
         */
        function closeSegment(): void {
            if (inst.segments.length) {
                inst.segments[
                    inst.segments.length - 1
                ].to = data.length || vlen;
            }
        }

        /**
         * Create a new segment for the current set.
         * @private
         */
        function beginSegment(): void {
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

        }

        /**
         * Push a rectangle to the data buffer.
         * @private
         */
        function pushRect(
            x: number,
            y: number,
            w: number,
            h: number,
            color?: Color.RGBA
        ): void {
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
        }

        // Create the first segment
        beginSegment();

        // Special case for point shapes
        if (points && points.length > 0) {

            // If we're doing points, we assume that the points are already
            // translated, so we skip the shader translation.
            inst.skipTranslation = true;
            // Force triangle draw mode
            inst.drawMode = 'triangles';

            // We don't have a z component in the shader, so we need to sort.
            if (points[0].node && points[0].node.levelDynamic) {
                points.sort(function (
                    a: Highcharts.BoostGLPoint,
                    b: Highcharts.BoostGLPoint
                ): number {
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

            points.forEach(function (point: Point): void {
                let plotY = point.plotY,
                    swidth,
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
                        (point.series as ColorMapMixin.ColorMapSeries)
                            .colorAttribs(
                                point as ColorMapMixin.ColorMapPoint
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
        // (chart.axes || []).forEach(function (a) {
        //     if (H.ColorAxis && a instanceof H.ColorAxis) {
        //         caxis = a;
        //     }
        // });

        if (series.is('networkgraph')) {
            let colorIndex = 0;
            while (i < sdata.length - 1) {

                d = (series.data[++i] as any).getLinkPath();

                if (typeof d === 'undefined') {
                    continue;
                }

                if (chartDestroyed) {
                    break;
                }

                if (d) {
                    nextInside = true;
                }

                beginSegment();

                x = (d as any)[0][1] - chart.plotLeft;
                y = (d as any)[0][2] - chart.plotTop;

                if (y === null && connectNulls || !nextInside) {
                    continue;
                }

                // Uncomment this to enable color by point.
                // This currently left disabled as the charts look really ugly
                // when enabled and there's a lot of points.
                // Leaving in for the future (tm).
                if (series.options.colorByPoint) {
                    colorIndex = ++colorIndex %
                        (series as any).chart.options.colors.length;
                    pcolor = color((series as any).chart.options.colors[colorIndex]).rgba as any;
                    pcolor[0] /= 255.0;
                    pcolor[1] /= 255.0;
                    pcolor[2] /= 255.0;
                }

                // useGPUTranslations is always false in Networkgraph
                inst.skipTranslation = true;

                vertice(
                    x,
                    y,
                    0 as any,
                    2,
                    pcolor
                );

                hadPoints = true;
                firstPoint = false;


                x = (d as any)[1][1] - chart.plotLeft;
                y = (d as any)[1][2] - chart.plotTop;

                if (y === null && connectNulls || !nextInside) {
                    continue;
                }

                vertice(
                    x,
                    y,
                    0 as any,
                    2,
                    pcolor
                );

                lastX = x;
                lastY = y;
            }
        }

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
            // rendered (#9962)
            if (
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
                zones.some(function ( // eslint-disable-line no-loop-func
                    zone: SeriesZonesOptions,
                    i: number
                ): boolean {
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
                    if (inst.drawMode === 'points') {
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

        /**
         * @private
         */
        function pushSupplementPoint(
            point: PositionObject,
            atStart?: boolean
        ): void {
            if (!settings.useGPUTranslations) {
                inst.skipTranslation = true;
                point.x = xAxis.toPixels(point.x, true);
                point.y = yAxis.toPixels(point.y, true);
            }

            // We should only do this for lines, and we should ignore markers
            // since there's no point here that would have a marker.

            if (atStart) {
                data = [point.x, point.y, 0, 2].concat(data);
                return;
            }

            vertice(
                point.x,
                point.y,
                0 as any,
                2
            );
        }

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
     * @param s {Highchart.Series} - the series to push
     */
    function pushSeries(s: Series): void {
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
            drawMode: (
                {
                    'area': 'lines',
                    'arearange': 'lines',
                    'areaspline': 'lines',
                    'column': 'lines',
                    'columnrange': 'lines',
                    'bar': 'lines',
                    'line': 'line_strip',
                    'scatter': 'points',
                    'networkgraph': 'line_strip',
                    'heatmap': 'triangles',
                    'treemap': 'triangles',
                    'bubble': 'points'
                } as Record<string, Highcharts.BoostGLDrawModeValue>
            )[s.type] || 'line_strip'
        };

        if (s.index >= series.length) {
            series.push(obj);
        } else {
            series[s.index] = obj;
        }

        // Add the series data to our buffer(s)
        pushSeriesData(s, obj);

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
    function flush(): void {
        series = [];
        (exports as any).data = data = [];
        markerData = [];

        if (vbuffer) {
            vbuffer.destroy();
        }
    }

    /**
     * Pass x-axis to shader
     * @private
     * @param axis {Highcharts.Axis} - the x-axis
     */
    function setXAxis(axis: Axis): void {
        if (!shader) {
            return;
        }

        const pixelRatio = getPixelRatio();

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
     * @param axis {Highcharts.Axis} - the y-axis
     */
    function setYAxis(axis: Axis): void {
        if (!shader) {
            return;
        }

        const pixelRatio = getPixelRatio();

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
     * @param has {boolean} - has threshold flag
     * @param translation {Float} - the threshold
     */
    function setThreshold(has: boolean, translation: number): void {
        shader.setUniform('hasThreshold', has as any);
        shader.setUniform('translatedThreshold', translation);
    }

    /**
     * Render the data
     * This renders all pushed series.
     * @private
     */
    function render(chart: Chart): (false|undefined) {

        const pixelRatio = getPixelRatio();
        if (chart) {
            width = chart.chartWidth * pixelRatio;
            height = chart.chartHeight * pixelRatio;
        } else {
            return false;
        }

        if (!gl || !width || !height || !shader) {
            return false;
        }

        if (settings.debug.timeRendering) {
            console.time('gl rendering'); // eslint-disable-line no-console
        }

        gl.canvas.width = width;
        gl.canvas.height = height;

        shader.bind();

        gl.viewport(0, 0, width, height);
        shader.setPMatrix(orthoMatrix(width, height));

        if (settings.lineWidth > 1 && !H.isMS) {
            gl.lineWidth(settings.lineWidth);
        }

        vbuffer.build((exports as any).data, 'aVertexPosition', 4);
        vbuffer.bind();

        shader.setInverted(chart.inverted as any);

        // Render the series
        series.forEach(function (
            s: Highcharts.BoostGLSeriesObject,
            si: number
        ): void {
            let options = s.series.options,
                shapeOptions = options.marker,
                sindex,
                lineWidth = (
                    typeof options.lineWidth !== 'undefined' ?
                        options.lineWidth :
                        1
                ),
                threshold: number = options.threshold as any,
                hasThreshold = isNumber(threshold),
                yBottom = s.series.yAxis.getThreshold(threshold),
                translatedThreshold = yBottom,
                cbuffer,
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
                fillColor,
                shapeTexture = textureHandles[
                    (shapeOptions && shapeOptions.symbol) ||
                    (s.series.symbol as any)
                ] || textureHandles.circle,
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
                        s.drawMode === 'points' && // #14260
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
                s.drawMode === 'lines' &&
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
                shader.setUniform('hasColor', 1.0);
                cbuffer = GLVertexBuffer(gl, shader); // eslint-disable-line new-cap
                cbuffer.build(s.colorData, 'aColor', 4);
                cbuffer.bind();
            } else {
                // #15869, a buffer with fewer points might already be bound by
                // a different series/chart causing out of range errors
                gl.disableVertexAttribArray(
                    gl.getAttribLocation(shader.program() as any, 'aColor')
                );
            }

            // Set series specific uniforms
            shader.setColor(scolor);
            setXAxis(s.series.xAxis);
            setYAxis(s.series.yAxis);
            setThreshold(hasThreshold, translatedThreshold as any);

            if (s.drawMode === 'points') {
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

            // Do the actual rendering
            // If the line width is < 0, skip rendering of the lines. See #7833.
            if (lineWidth > 0 || s.drawMode !== 'line_strip') {
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

        if (postRenderCallback) {
            postRenderCallback();
        }

        flush();
    }

    /**
     * Render the data when ready
     * @private
     */
    function renderWhenReady(chart: Chart): (false|undefined) {
        clear();

        if (chart.renderer.forExport) {
            return render(chart);
        }

        if (isInited) {
            render(chart);
        } else {
            setTimeout(function (): void {
                renderWhenReady(chart);
            }, 1);
        }
    }

    /**
     * Set the viewport size in pixels
     * Creates an orthographic perspective matrix and applies it.
     * @private
     * @param w {Integer} - the width of the viewport
     * @param h {Integer} - the height of the viewport
     */
    function setSize(w: number, h: number): void {
        // Skip if there's no change, or if we have no valid shader
        if ((width === w && height === h) || !shader) {
            return;
        }

        width = w;
        height = h;

        shader.bind();
        shader.setPMatrix(orthoMatrix(width, height));
    }

    /**
     * Init OpenGL
     * @private
     * @param canvas {HTMLCanvas} - the canvas to render to
     */
    function init(canvas?: HTMLCanvasElement, noFlush?: boolean): boolean {
        let i = 0,
            contexts = [
                'webgl',
                'experimental-webgl',
                'moz-webgl',
                'webkit-3d'
            ];

        isInited = false;

        if (!canvas) {
            return false;
        }

        if (settings.debug.timeSetup) {
            console.time('gl setup'); // eslint-disable-line no-console
        }

        for (; i < contexts.length; i++) {
            gl = canvas.getContext(contexts[i], {
            //    premultipliedAlpha: false
            }) as any;
            if (gl) {
                break;
            }
        }

        if (gl) {
            if (!noFlush) {
                flush();
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

        shader = GLShader(gl) as any; // eslint-disable-line new-cap

        if (!shader) {
            // We need to abort, there's no shader context
            return false;
        }

        vbuffer = GLVertexBuffer(gl, shader); // eslint-disable-line new-cap

        /**
         * @private
         */
        function createTexture(
            name: string,
            fn: Highcharts.BoostGLTextureCallbackFunction
        ): void {
            const props: Highcharts.BoostGLTextureObject = {
                    isReady: false,
                    texture: doc.createElement('canvas'),
                    handle: gl.createTexture()
                },
                ctx: CanvasRenderingContext2D =
                    props.texture.getContext('2d') as any;

            textureHandles[name] = props;

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
        }

        // Circle shape
        createTexture('circle', function (ctx: CanvasRenderingContext2D): void {
            ctx.beginPath();
            ctx.arc(256, 256, 256, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        });

        // Square shape
        createTexture('square', function (ctx: CanvasRenderingContext2D): void {
            ctx.fillRect(0, 0, 512, 512);
        });

        // Diamond shape
        createTexture('diamond', function (
            ctx: CanvasRenderingContext2D
        ): void {
            ctx.beginPath();
            ctx.moveTo(256, 0);
            ctx.lineTo(512, 256);
            ctx.lineTo(256, 512);
            ctx.lineTo(0, 256);
            ctx.lineTo(256, 0);
            ctx.fill();
        });

        // Triangle shape
        createTexture('triangle', function (
            ctx: CanvasRenderingContext2D
        ): void {
            ctx.beginPath();
            ctx.moveTo(0, 512);
            ctx.lineTo(256, 0);
            ctx.lineTo(512, 512);
            ctx.lineTo(0, 512);
            ctx.fill();
        });

        // Triangle shape (rotated)
        createTexture('triangle-down', function (
            ctx: CanvasRenderingContext2D
        ): void {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(256, 512);
            ctx.lineTo(512, 0);
            ctx.lineTo(0, 0);
            ctx.fill();
        });

        isInited = true;

        if (settings.debug.timeSetup) {
            console.timeEnd('gl setup'); // eslint-disable-line no-console
        }

        return true;
    }

    /**
     * Check if we have a valid OGL context
     * @private
     * @return {boolean}
     * true if the context is valid
     */
    function valid(): boolean {
        return (gl as any) !== false;
    }

    /**
     * Check if the renderer has been initialized
     * @private
     * @return {boolean}
     * true if it has, false if not
     */
    function inited(): boolean {
        return isInited;
    }

    /**
     * @private
     */
    function destroy(): void {
        flush();
        vbuffer.destroy();
        shader.destroy();
        if (gl) {

            objectEach(textureHandles, function (texture): void {
                if (texture.handle) {
                    gl.deleteTexture(texture.handle);
                }
            });

            gl.canvas.width = 1;
            gl.canvas.height = 1;
        }
    }

    // /////////////////////////////////////////////////////////////////////////
    exports = {
        allocateBufferForSingleSeries: allocateBufferForSingleSeries,
        pushSeries: pushSeries,
        setSize: setSize,
        inited: inited,
        setThreshold: setThreshold,
        init: init,
        render: renderWhenReady,
        settings: settings,
        valid: valid,
        clear: clear,
        flush: flush,
        setXAxis: setXAxis,
        setYAxis: setYAxis,
        data: data,
        gl: getGL,
        allocateBuffer: allocateBuffer,
        destroy: destroy,
        setOptions: setOptions
    };

    return exports as any;
}

export default GLRenderer;
