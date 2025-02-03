/* *
 *
 *  (c) 2024 Hubert Kozik
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

import type Chart from '../../Core/Chart/Chart';
import type Series from '../../Core/Series/Series';
import type Point from '../../Core/Series/Point';
import type Tooltip from '../../Core/Tooltip';
import type Pointer from '../../Core/Pointer';
import type { GetSelectionMarkerAttrsEvent } from '../../Core/PointerEvent';
import H from '../../Core/Globals.js';
const { composed } = H;

import U from '../../Core/Utilities.js';
const {
    addEvent,
    isNumber,
    pushUnique
} = U;

/* *
 *
 *  Declarations
 *
 * */
interface ZoomBox {
    height: number;
    width: number;
    x: number;
    y: number;
    scale: number,
    panX: number;
    panY: number;
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        zoomBox?: ZoomBox
    }
}

/* /* *
 *
 *  Functions
 *
 * */

/**
 * Logic for non-cartesian series zooming and panning
 * @private
 */
function onTransform(
    this: Chart,
    params: Chart.ChartTransformParams
): void {
    const chart = this,
        {
            trigger,
            selection,
            from = {},
            to = {}
        } = params,
        type = chart.zooming.type;

    if (type !== 'xy') {
        return;
    }

    if (
        trigger === 'mousewheel' ||
        trigger === 'zoom' ||
        trigger === 'pan' ||
        selection
    ) {
        chart.series.forEach((series): void => {
            if (!series.isCartesian && series.options.zoomEnabled !== false) {
                series.isDirty = true;
                chart.isDirtyBox = true;
                params.hasZoomed = true;

                const {
                    plotSizeX = 0,
                    plotSizeY = 0
                } = chart;

                if (trigger === 'pan' && series.zoomBox) {
                    series.zoomBox.panX -= (to.x || 0) / plotSizeX;
                    series.zoomBox.panY -= (to.y || 0) / plotSizeY;
                } else {
                    if (Object.keys(from).length) {
                        const {
                            width: toWidth = 1,
                            height: toHeight = 1
                        } = to;

                        let {
                                x = 0,
                                y = 0,
                                width: fromWidth = 1,
                                height: fromHeight = 1
                            } = from,
                            scale = series.zoomBox?.scale ||
                                series.group?.scaleX ||
                                1,
                            width = (
                                series.zoomBox?.width || 1
                            ) * plotSizeX,
                            height = (
                                series.zoomBox?.height || 1
                            ) * plotSizeY;

                        if (Object.keys(to).length) {
                            width = width * (fromWidth / toWidth);
                            height = height * (fromWidth / toHeight);
                            y -= chart.plotTop;

                            scale =
                                Math.min(
                                    (chart.plotSizeX || 0) / width,
                                    (chart.plotSizeY || 0) / height
                                );
                        } else {
                            fromWidth /= Math.abs(series.group?.scaleX || 1);
                            fromHeight /= Math.abs(series.group?.scaleY || 1);
                            scale = Math.min(
                                (chart.plotSizeX || 0) / fromWidth,
                                (chart.plotSizeY || 0) / fromHeight
                            );
                            width = fromWidth;
                            height = fromHeight;

                            const factorX = ((x - chart.plotLeft) /
                                    (chart.plotSizeX || 1)),
                                factorY = ((y - chart.plotTop) /
                                    (chart.plotSizeY || 1));

                            x += (fromWidth * 2) * factorX;
                            y += (fromHeight / 2) * factorY;
                        }

                        series.zoomBox = {
                            x: x / plotSizeX,
                            y: y / plotSizeY,
                            width: width / plotSizeX,
                            height: height / plotSizeY,
                            scale,
                            panX: 0,
                            panY: 0
                        };

                        if (scale < 1) {
                            delete series.zoomBox;
                        }
                    } else {
                        delete series.zoomBox;
                    }
                }
            }
        });
    }
}

/**
 * Apply zoom into series plot box
 * @private
 */
function onGetPlotBox(
    this: Series,
    e: {
        scale: number,
        translateX: number,
        translateY: number,
        name?: string
    }
): void {
    const { chart, group, zoomBox } = this;

    let {
            plotSizeX = 0,
            plotSizeY = 0
        } = chart,
        { scale, translateX, translateY, name } = e,
        left = 0,
        top = 0;

    const initLeft = translateX,
        initTop = translateY;

    if (chart.inverted) {
        [plotSizeX, plotSizeY] = [plotSizeY, plotSizeX];
    }

    if (group && zoomBox) {
        scale = zoomBox.scale;

        left = zoomBox.x * plotSizeX * (scale - (Math.abs(group.scaleX || 1)));
        top = zoomBox.y * plotSizeY * (scale - (Math.abs(group.scaleY || 1)));

        if (name === 'series') {
            zoomBox.x += zoomBox.panX;
            left += zoomBox.panX * plotSizeX;
            zoomBox.panX = 0;
            zoomBox.y += zoomBox.panY;
            top += zoomBox.panY * plotSizeY;
            zoomBox.panY = 0;
        }

        translateX = (group.translateX || initLeft) - left;
        translateY = (group.translateY || initTop) - top;

        // Do not allow to move outside the chart
        // Vertical lock
        if (translateY > initTop) {
            translateY = initTop;
        } else if (
            (group.translateY || initTop) - top <
                (plotSizeY * (1 - scale) + initTop)
        ) {
            translateY = (plotSizeY * (1 - scale)) + initTop;
        }
        // Horizontal lock
        if (translateX > initLeft) {
            translateX = initLeft;
        } else if (
            translateX < (plotSizeX * (1 - scale) + initLeft)
        ) {
            translateX = (plotSizeX * (1 - scale)) + initLeft;
        }

        e.scale = scale;
        e.translateX = translateX;
        e.translateY = translateY;
    }
}

/**
 * Clip series and data labels group with zoom rect
 * @private
 */
function onAfterDrawChartBox(this: Chart): void {
    const chart = this;

    if (chart.series.find((series): boolean => !!series.zoomBox)) {
        if (!chart.zoomClipRect) {
            chart.zoomClipRect = chart.renderer.clipRect({
                x: chart.plotLeft,
                y: chart.plotTop,
                width: chart.inverted ? chart.clipBox.height :
                    chart.clipBox.width,
                height: chart.inverted ? chart.clipBox.width :
                    chart.clipBox.height
            });
        }

        chart.seriesGroup?.clip(chart.zoomClipRect);
        chart.dataLabelsGroup?.clip(chart.zoomClipRect);
    }
}

/**
 * Adjust tooltip position to scaled series group
 * @private
 */
function onGetAnchor(params: {
    point: Point,
    ret: number[]
}): void {
    if (
        params.point.series &&
        !params.point.series.isCartesian &&
        params.point.series.group &&
        params.point.series.zoomBox
    ) {
        const chart = params.point.series.chart,
            scale = params.point.series.zoomBox.scale,
            left = (params.point.series.group.translateX || 0),
            top = (params.point.series.group.translateY || 0);
        params.ret[0] = (params.ret[0] * scale) + left - chart.plotLeft;
        params.ret[1] = (params.ret[1] * scale) + top - chart.plotTop;
    }
}

function onGetSelectionMarkerAttrs(
    this: Pointer,
    e: GetSelectionMarkerAttrsEvent
): boolean {
    const {
            chart,
            zoomHor,
            zoomVert
        } = this,
        {
            mouseDownX = 0,
            mouseDownY = 0
        } = chart,
        attrs = e.attrs,
        {
            chartX,
            chartY
        } = e.args,
        plotSizeRatio = this.chart.plotWidth / this.chart.plotHeight;

    if (chart.hasCartesianSeries) {
        return true;
    }

    let sizeX: number | undefined, sizeY: number | undefined;

    attrs.x = chart.plotLeft;
    attrs.y = chart.plotTop;
    attrs.width = zoomHor ? 1 : chart.plotWidth;
    attrs.height = zoomVert ? 1 : chart.plotHeight;

    // Adjust the width of the selection marker. Firefox needs at
    // least one pixel width or height in order to return a bounding
    // box.
    if (zoomHor) {
        sizeX = chartX - mouseDownX;
        attrs.width = Math.max(1, Math.abs(sizeX));
        attrs.x = (sizeX > 0 ? 0 : sizeX) + mouseDownX;
    }

    // Adjust the height of the selection marker
    if (zoomVert) {
        sizeY = chartY - mouseDownY;
        attrs.height = Math.max(1, Math.abs(sizeY));
        attrs.y = (sizeY > 0 ? 0 : sizeY) + mouseDownY;
    }

    if (
        isNumber(sizeX) &&
        sizeX < 0 &&
        Math.abs(sizeX) < attrs.height &&
        sizeX > 0
    ) {
        // Bottom left quartile
        attrs.width = Math.abs(sizeX);
        attrs.height = attrs.width / plotSizeRatio;
    } else if (isNumber(sizeY) && sizeY < 0 && attrs.y) {
        // Top left and right quartiles
        const height = attrs.width / plotSizeRatio,
            diff = attrs.height - height;

        attrs.y += diff;
        attrs.height = height;
    } else {
        // Bottom right quartile
        attrs.height = attrs.width / plotSizeRatio;
    }

    return false;
}

function onAfterSetChartSize(
    this: Chart,
    params: ({ skipAxes: boolean })
): void {
    if (params.skipAxes) {
        this.series.forEach((series): void => {
            if (series.group && series.zoomBox) {
                series.group.attr({
                    translateX: 0,
                    translateY: 0,
                    scaleX: 1,
                    scaleY: 1
                });
            }
        });
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The series type
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.tiledwebmap
 *
 * @augments Highcharts.Series
 */
class NonCartesianSeriesZoom {

    /* *
     *
     *  Static Functions
     *
     * */
    public static compose(
        ChartClass: typeof Chart,
        SeriesClass: typeof Series,
        TooltipClass: typeof Tooltip,
        PointerClass: typeof Pointer
    ): void {
        if (pushUnique(composed, 'NonCartesianSeriesZoom')) {
            addEvent(ChartClass, 'afterDrawChartBox', onAfterDrawChartBox);
            addEvent(ChartClass, 'transform', onTransform);
            addEvent(ChartClass, 'afterSetChartSize', onAfterSetChartSize);
            addEvent(SeriesClass, 'getPlotBox', onGetPlotBox);
            addEvent(TooltipClass, 'getAnchor', onGetAnchor);
            addEvent(
                PointerClass,
                'getSelectionMarkerAttrs',
                onGetSelectionMarkerAttrs
            );
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default NonCartesianSeriesZoom;

/* *
 *
 *  API Options
 *
 * */

/**
 * Whether to zoom non-cartesian series. If `chart.zooming` is set, the option
 * allows to disable zooming on an individual non-cartesian series. By default
 * zooming is enabled for all series.
 *
 * Note: This option works only for non-cartesian series.
 *
 * @type      {boolean}
 * @since     next
 * @apioption plotOptions.series.zoomEnabled
 */

/**
 * Whether to zoom non-cartesian series. If `chart.zooming` is set, the option
 * allows to disable zooming on an individual non-cartesian series. By default
 * zooming is enabled for all series.
 *
 * Note: This option works only for non-cartesian series.
 *
 * @type      {boolean}
 * @since     next
 * @apioption series.zoomEnabled
 */

(''); // Keeps doclets above in JS file
