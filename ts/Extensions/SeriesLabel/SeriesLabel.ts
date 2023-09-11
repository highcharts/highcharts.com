/* *
 *
 *  (c) 2009-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/*
 * Highcharts module to place labels next to a series in a natural position.
 *
 * TODO:
 * - add column support (box collision detection, boxesToAvoid logic)
 * - add more options (connector, format, formatter)
 *
 * https://jsfiddle.net/highcharts/L2u9rpwr/
 * https://jsfiddle.net/highcharts/y5A37/
 * https://jsfiddle.net/highcharts/264Nm/
 * https://jsfiddle.net/highcharts/y5A37/
 */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type AnimationOptions from '../../Core/Animation/AnimationOptions';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type Point from '../../Core/Series/Point';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type {
    LabelIntersectBoxObject,
    SeriesLabelOptions
} from './SeriesLabelOptions';
import type SplineSeries from '../../Series/Spline/SplineSeries';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer';
import type SymbolOptions from '../../Core/Renderer/SVG/SymbolOptions';

import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject } = A;
import Chart from '../../Core/Chart/Chart.js';
import T from '../../Core/Templating.js';
const { format } = T;
import D from '../../Core/Defaults.js';
const { setOptions } = D;
import Series from '../../Core/Series/Series.js';
import SeriesLabelDefaults from './SeriesLabelDefaults.js';
import SLU from './SeriesLabelUtilities.js';
const {
    boxIntersectLine,
    intersectRect
} = SLU;
import U from '../../Shared/Utilities.js';
import { Palette } from '../../Core/Color/Palettes';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { isNumber } = TC;
const { extend } = OH;
const { addEvent, fireEvent } = EH;
const {
    pick,
    syncTimeout
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        boxesToAvoid?: Array<LabelIntersectBoxObject>;
        labelSeries?: Array<Series>;
        labelSeriesMaxSum?: number;
        seriesLabelTimer?: number;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        interpolatedPoints?: Array<ControlPoint>;
        labelBySeries?: SVGElement;
        sum?: number;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        label?: SeriesLabelOptions;
    }
}

declare module '../../Core/Renderer/SVG/SymbolType' {
    interface SymbolTypeRegistry {
        /** @requires Extensions/SeriesLabel */
        connector: SymbolFunction;
    }
}

interface ControlPoint {
    chartCenterY?: number;
    chartX: number;
    chartY: number;
    plotX?: number;
    plotY?: number;
}

interface LabelClearPointObject extends PositionObject {
    connectorPoint?: ControlPoint;
    weight: number;
}


/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

const labelDistance = 3;

/* *
 *
 *  Functions
 *
 * */

/**
 * Check whether a proposed label position is clear of other elements.
 * @private
 */
function checkClearPoint(
    series: Series,
    x: number,
    y: number,
    bBox: BBoxObject,
    checkDistance?: boolean
): (false|LabelClearPointObject) {
    const chart = series.chart,
        seriesLabelOptions = series.options.label || {},
        onArea = pick(seriesLabelOptions.onArea, !!series.area),
        findDistanceToOthers = (onArea || seriesLabelOptions.connectorAllowed),
        leastDistance = 16,
        boxesToAvoid = chart.boxesToAvoid;

    let distToOthersSquared = Number.MAX_VALUE, // distance to other graphs
        distToPointSquared = Number.MAX_VALUE,
        dist,
        connectorPoint,
        withinRange: (boolean|undefined),
        xDist: (number|undefined),
        yDist: (number|undefined),
        i: (number|undefined),
        j: (number|undefined);

    /**
     * Get the weight in order to determine the ideal position. Larger distance
     * to other series gives more weight. Smaller distance to the actual point
     * (connector points only) gives more weight.
     * @private
     */
    function getWeight(
        distToOthersSquared: number,
        distToPointSquared: number
    ): number {
        return distToOthersSquared - distToPointSquared;
    }

    // First check for collision with existing labels
    for (i = 0; boxesToAvoid && i < boxesToAvoid.length; i += 1) {
        if (intersectRect(boxesToAvoid[i], {
            left: x,
            right: x + bBox.width,
            top: y,
            bottom: y + bBox.height
        })) {
            return false;
        }
    }

    // For each position, check if the lines around the label intersect with any
    // of the graphs.
    for (i = 0; i < chart.series.length; i += 1) {
        const serie = chart.series[i],
            points = serie.interpolatedPoints && [...serie.interpolatedPoints];

        if (serie.visible && points) {

            // Avoid the sides of the plot area
            const stepY = chart.plotHeight / 10;
            for (
                let chartY = chart.plotTop;
                chartY <= chart.plotTop + chart.plotHeight;
                chartY += stepY
            ) {
                points.unshift({
                    chartX: chart.plotLeft,
                    chartY
                });

                points.push({
                    chartX: chart.plotLeft + chart.plotWidth,
                    chartY
                });
            }


            for (j = 1; j < points.length; j += 1) {

                if (
                    // To avoid processing, only check intersection if the X
                    // values are close to the box.
                    points[j].chartX >= x - leastDistance &&
                    points[j - 1].chartX <= x + bBox.width +
                    leastDistance
                    /* @todo condition above is not the same as below
                    (
                        points[j].chartX >=
                        (x - leastDistance)
                    ) && (
                        points[j - 1].chartX <=
                        (x + bBox.width + leastDistance)
                    ) */
                ) {
                    // If any of the box sides intersect with the line, return.
                    if (boxIntersectLine(
                        x,
                        y,
                        bBox.width,
                        bBox.height,
                        points[j - 1].chartX,
                        points[j - 1].chartY,
                        points[j].chartX,
                        points[j].chartY
                    )) {
                        return false;
                    }

                    // But if it is too far away (a padded box doesn't
                    // intersect), also return.
                    if (series === serie && !withinRange && checkDistance) {
                        withinRange = boxIntersectLine(
                            x - leastDistance,
                            y - leastDistance,
                            bBox.width + 2 * leastDistance,
                            bBox.height + 2 * leastDistance,
                            points[j - 1].chartX,
                            points[j - 1].chartY,
                            points[j].chartX,
                            points[j].chartY
                        );
                    }
                }

                // Find the squared distance from the center of the label. On
                // area series, avoid its own graph.
                if (
                    (findDistanceToOthers || withinRange) &&
                    (series !== serie || onArea)
                ) {
                    xDist = x + bBox.width / 2 - points[j].chartX;
                    yDist = y + bBox.height / 2 - points[j].chartY;
                    distToOthersSquared = Math.min(
                        distToOthersSquared,
                        xDist * xDist + yDist * yDist
                    );
                }
            }

            // Do we need a connector?
            if (
                !onArea &&
                findDistanceToOthers &&
                series === serie &&
                (
                    (checkDistance && !withinRange) ||
                    distToOthersSquared < Math.pow(
                        seriesLabelOptions.connectorNeighbourDistance || 1,
                        2
                    )
                )
            ) {
                for (j = 1; j < points.length; j += 1) {
                    dist = Math.min(
                        (
                            Math.pow(
                                x + bBox.width / 2 - points[j].chartX,
                                2
                            ) +
                            Math.pow(
                                y + bBox.height / 2 - points[j].chartY,
                                2
                            )
                        ),
                        (
                            Math.pow(x - points[j].chartX, 2) +
                            Math.pow(y - points[j].chartY, 2)
                        ),
                        (
                            Math.pow(
                                x + bBox.width - points[j].chartX,
                                2
                            ) +
                            Math.pow(y - points[j].chartY, 2)
                        ),
                        (
                            Math.pow(
                                x + bBox.width - points[j].chartX,
                                2
                            ) +
                            Math.pow(
                                y + bBox.height - points[j].chartY,
                                2
                            )
                        ),
                        (
                            Math.pow(x - points[j].chartX, 2) +
                            Math.pow(
                                y + bBox.height - points[j].chartY,
                                2
                            )
                        )
                    );
                    if (dist < distToPointSquared) {
                        distToPointSquared = dist;
                        connectorPoint = points[j];
                    }
                }
                withinRange = true;
            }
        }
    }

    return !checkDistance || withinRange ? {
        x,
        y,
        weight: getWeight(
            distToOthersSquared,
            connectorPoint ? distToPointSquared : 0
        ),
        connectorPoint
    } : false;

}

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart,
    SVGRendererClass: typeof SVGRenderer
): void {

    if (pushUnique(composedMembers, ChartClass)) {
        // Leave both events, we handle animation differently (#9815)
        addEvent(Chart, 'load', onChartRedraw);
        addEvent(Chart, 'redraw', onChartRedraw);
    }

    if (pushUnique(composedMembers, SVGRendererClass)) {
        SVGRendererClass.prototype.symbols.connector = symbolConnector;
    }

    if (pushUnique(composedMembers, setOptions)) {
        setOptions({ plotOptions: { series: { label: SeriesLabelDefaults } } });
    }

}

/**
 * The main initialize method that runs on chart level after initialization and
 * redraw. It runs in  a timeout to prevent locking, and loops over all series,
 * taking all series and labels into account when placing the labels.
 *
 * @private
 * @function Highcharts.Chart#drawSeriesLabels
 */
function drawSeriesLabels(chart: Chart): void {

    // console.time('drawSeriesLabels');
    chart.boxesToAvoid = [];

    const labelSeries = chart.labelSeries || [],
        boxesToAvoid = chart.boxesToAvoid;

    // Avoid data labels
    chart.series.forEach((s): void =>
        (s.points || []).forEach((p): void =>
            (p.dataLabels || []).forEach((label): void => {
                const { width, height } = label.getBBox(),
                    left = label.translateX + (
                        s.xAxis ? s.xAxis.pos : s.chart.plotLeft
                    ),
                    top = label.translateY + (
                        s.yAxis ? s.yAxis.pos : s.chart.plotTop
                    );

                boxesToAvoid.push({
                    left,
                    top,
                    right: left + width,
                    bottom: top + height
                });
            })
        )
    );

    // Build the interpolated points
    labelSeries.forEach(function (series): void {

        const seriesLabelOptions = series.options.label || {};

        series.interpolatedPoints = getPointsOnGraph(series);

        boxesToAvoid.push(...(seriesLabelOptions.boxesToAvoid || []));
    });

    chart.series.forEach(function (series): void {

        const labelOptions = series.options.label;

        if (!labelOptions || (!series.xAxis && !series.yAxis)) {
            return;
        }

        const colorClass = (
                'highcharts-color-' + pick(series.colorIndex, 'none')
            ),
            isNew = !series.labelBySeries,
            minFontSize = labelOptions.minFontSize,
            maxFontSize = labelOptions.maxFontSize,
            inverted = chart.inverted,
            paneLeft: number = (
                inverted ? series.yAxis.pos : series.xAxis.pos
            ),
            paneTop: number = (
                inverted ? series.xAxis.pos : series.yAxis.pos
            ),
            paneWidth = chart.inverted ? series.yAxis.len : series.xAxis.len,
            paneHeight = chart.inverted ? series.xAxis.len : series.yAxis.len,
            points = series.interpolatedPoints,
            onArea = pick(labelOptions.onArea, !!series.area),
            results: Array<LabelClearPointObject> = [],
            xData = series.xData || [];

        let bBox: (BBoxObject|undefined),
            x: (number|undefined),
            y: (number|undefined),
            clearPoint,
            i: (number|undefined),
            best,
            label = series.labelBySeries,
            dataExtremes,
            areaMin: (number|undefined),
            areaMax: (number|undefined);

        // Stay within the area data bounds (#10038)
        if (onArea && !inverted) {
            dataExtremes = [
                series.xAxis.toPixels(xData[0]),
                series.xAxis.toPixels(xData[xData.length - 1])
            ];
            areaMin = Math.min.apply(Math, dataExtremes);
            areaMax = Math.max.apply(Math, dataExtremes);
        }

        /**
         * @private
         */
        function insidePane(
            x: number,
            y: number,
            bBox: BBoxObject
        ): boolean {
            const leftBound = Math.max(
                    paneLeft,
                    pick(areaMin, -Infinity)
                ),
                rightBound = Math.min(
                    paneLeft + paneWidth,
                    pick(areaMax, Infinity)
                );
            return (
                x > leftBound &&
                x <= rightBound - bBox.width &&
                y >= paneTop &&
                y <= paneTop + paneHeight - bBox.height
            );
        }

        /**
         * @private
         */
        function destroyLabel(): void {
            if (label) {
                series.labelBySeries = label.destroy();
            }
        }

        if (series.visible && !series.boosted && points) {
            if (!label) {

                let labelText = series.name;
                if (typeof labelOptions.format === 'string') {
                    labelText = format(labelOptions.format, series, chart);
                } else if (labelOptions.formatter) {
                    labelText = labelOptions.formatter.call(series);
                }

                series.labelBySeries = label = chart.renderer
                    .label(
                        labelText,
                        0,
                        0,
                        'connector',
                        0,
                        0,
                        labelOptions.useHTML
                    )
                    .addClass(
                        'highcharts-series-label ' +
                        'highcharts-series-label-' + series.index + ' ' +
                        (series.options.className || '') + ' ' +
                        colorClass
                    );

                if (!chart.renderer.styledMode) {
                    const color = typeof series.color === 'string' ?
                        series.color : Palette.neutralColor60;
                    label.css(extend<CSSObject>({
                        color: onArea ?
                            chart.renderer.getContrast(color) :
                            color
                    }, labelOptions.style || {}));

                    label.attr({
                        opacity: chart.renderer.forExport ? 1 : 0,
                        stroke: series.color,
                        'stroke-width': 1
                    });
                }

                // Adapt label sizes to the sum of the data
                if (minFontSize && maxFontSize) {
                    label.css({
                        fontSize: labelFontSize(
                            series,
                            minFontSize,
                            maxFontSize
                        )
                    });
                }

                label
                    .attr({
                        padding: 0,
                        zIndex: 3
                    })
                    .add();
            }

            bBox = label.getBBox();
            bBox.width = Math.round(bBox.width);

            // Ideal positions are centered above or below a point on right side
            // of chart
            for (i = points.length - 1; i > 0; i -= 1) {

                if (onArea) {

                    // Centered
                    x = points[i].chartX - bBox.width / 2;
                    y = (points[i].chartCenterY || 0) - bBox.height / 2;
                    if (insidePane(x, y, bBox)) {
                        best = checkClearPoint(series, x, y, bBox);
                    }
                    if (best) {
                        results.push(best);
                    }


                } else {

                    // Right - up
                    x = points[i].chartX + labelDistance;
                    y = points[i].chartY - bBox.height - labelDistance;
                    if (insidePane(x, y, bBox)) {
                        best = checkClearPoint(
                            series,
                            x,
                            y,
                            bBox,
                            true
                        );
                    }
                    if (best) {
                        results.push(best);
                    }

                    // Right - down
                    x = points[i].chartX + labelDistance;
                    y = points[i].chartY + labelDistance;
                    if (insidePane(x, y, bBox)) {
                        best = checkClearPoint(
                            series,
                            x,
                            y,
                            bBox,
                            true
                        );
                    }
                    if (best) {
                        results.push(best);
                    }

                    // Left - down
                    x = points[i].chartX - bBox.width - labelDistance;
                    y = points[i].chartY + labelDistance;
                    if (insidePane(x, y, bBox)) {
                        best = checkClearPoint(
                            series,
                            x,
                            y,
                            bBox,
                            true
                        );
                    }
                    if (best) {
                        results.push(best);
                    }

                    // Left - up
                    x = points[i].chartX - bBox.width - labelDistance;
                    y = points[i].chartY - bBox.height - labelDistance;
                    if (insidePane(x, y, bBox)) {
                        best = checkClearPoint(
                            series,
                            x,
                            y,
                            bBox,
                            true
                        );
                    }
                    if (best) {
                        results.push(best);
                    }
                }
            }

            // Brute force, try all positions on the chart in a 16x16 grid
            if (labelOptions.connectorAllowed && !results.length && !onArea) {
                for (
                    x = paneLeft + paneWidth - bBox.width;
                    x >= paneLeft;
                    x -= 16
                ) {
                    for (
                        y = paneTop;
                        y < paneTop + paneHeight - bBox.height;
                        y += 16
                    ) {
                        clearPoint = checkClearPoint(series, x, y, bBox, true);
                        if (clearPoint) {
                            results.push(clearPoint);
                        }
                    }
                }
            }

            if (results.length) {

                results.sort((a, b): number => b.weight - a.weight);

                best = results[0];

                (chart.boxesToAvoid || []).push({
                    left: best.x,
                    right: best.x + bBox.width,
                    top: best.y,
                    bottom: best.y + bBox.height
                });

                // Move it if needed
                const dist = Math.sqrt(
                    Math.pow(Math.abs(best.x - (label.x || 0)), 2) +
                    Math.pow(Math.abs(best.y - (label.y || 0)), 2)
                );

                if (dist && series.labelBySeries) {

                    // Move fast and fade in - pure animation movement is
                    // distractive...
                    let attr: SVGAttributes = {
                            opacity: chart.renderer.forExport ? 1 : 0,
                            x: best.x,
                            y: best.y
                        },
                        anim: SVGAttributes = {
                            opacity: 1
                        };

                    // ... unless we're just moving a short distance
                    if (dist <= 10) {
                        anim = {
                            x: attr.x,
                            y: attr.y
                        };
                        attr = {};
                    }

                    // Default initial animation to a fraction of the series
                    // animation (#9396)
                    let animationOptions: AnimationOptions|undefined;
                    if (isNew) {
                        animationOptions = animObject(series.options.animation);
                        animationOptions.duration *= 0.2;
                    }

                    series.labelBySeries
                        .attr(extend(attr, {
                            anchorX: best.connectorPoint &&
                                (best.connectorPoint.plotX || 0) + paneLeft,
                            anchorY: best.connectorPoint &&
                                (best.connectorPoint.plotY || 0) + paneTop
                        } as SVGAttributes))
                        .animate(anim, animationOptions);

                    // Record closest point to stick to for sync redraw
                    series.options.kdNow = true;
                    series.buildKDTree();
                    const closest = series.searchPoint({
                        chartX: best.x,
                        chartY: best.y
                    } as any, true);

                    if (closest) {
                        label.closest = [
                            closest,
                            best.x - (closest.plotX || 0),
                            best.y - (closest.plotY || 0)
                        ];
                    }

                }

            } else {
                destroyLabel();
            }
        } else {
            destroyLabel();
        }
    });

    fireEvent(chart, 'afterDrawSeriesLabels');
    // console.timeEnd('drawSeriesLabels');
}

/**
 * Points to avoid. In addition to actual data points, the label should avoid
 * interpolated positions.
 *
 * @private
 * @function Highcharts.Series#getPointsOnGraph
 */
function getPointsOnGraph(series: Series): (Array<ControlPoint>|undefined) {

    if (!series.xAxis && !series.yAxis) {
        return;
    }

    const distance = 16,
        points = series.points,
        interpolated: Array<ControlPoint> = [],
        graph = series.graph || series.area,
        node = graph && (graph.element as SVGPathElement),
        inverted = series.chart.inverted,
        xAxis = series.xAxis,
        yAxis = series.yAxis,
        paneLeft: number = inverted ? yAxis.pos : xAxis.pos,
        paneTop: number = inverted ? xAxis.pos : yAxis.pos,
        seriesLabelOptions = series.options.label || {},
        onArea = pick(seriesLabelOptions.onArea, !!series.area),
        translatedThreshold =
            yAxis.getThreshold(series.options.threshold as any),
        grid: Record<string, number> = {};

    let i: (number|undefined),
        deltaX: (number|undefined),
        deltaY: (number|undefined),
        delta: (number|undefined),
        len: (number|undefined),
        n: (number|undefined),
        j: (number|undefined);

    /**
     * Push the point to the interpolated points, but only if that position in
     * the grid has not been occupied. As a performance optimization, we divide
     * the plot area into a grid and only add one point per series (#9815).
     * @private
     */
    function pushDiscrete(point: ControlPoint): void {
        const cellSize = 8,
            key = Math.round((point.plotX || 0) / cellSize) + ',' +
            Math.round((point.plotY || 0) / cellSize);

        if (!grid[key]) {
            grid[key] = 1;
            interpolated.push(point);
        }
    }

    // For splines, get the point at length (possible caveat: peaks are not
    // correctly detected)
    if (
        (series as SplineSeries).getPointSpline &&
        node &&
        node.getPointAtLength &&
        !onArea &&
        // Not performing well on complex series, node.getPointAtLength is too
        // heavy (#9815)
        points.length < (series.chart.plotSizeX || 0) / distance
    ) {
        // If it is animating towards a path definition, use that briefly, and
        // reset
        const d = graph.toD && graph.attr('d');
        if (graph.toD) {
            graph.attr({ d: graph.toD });
        }
        len = node.getTotalLength();
        for (i = 0; i < len; i += distance) {
            const domPoint = node.getPointAtLength(i);
            pushDiscrete({
                chartX: paneLeft + domPoint.x,
                chartY: paneTop + domPoint.y,
                plotX: domPoint.x,
                plotY: domPoint.y
            });
        }
        if (d) {
            graph.attr({ d });
        }
        // Last point
        const point = points[points.length - 1];
        pushDiscrete({
            chartX: paneLeft + (point.plotX || 0),
            chartY: paneTop + (point.plotY || 0)
        });

    // Interpolate
    } else {
        len = points.length;
        let last: ControlPoint|undefined;
        for (i = 0; i < len; i += 1) {

            const point = points[i],
                { plotX, plotY, plotHigh } = point;

            if (isNumber(plotX) && isNumber(plotY)) {

                const ctlPoint: ControlPoint = {
                    plotX,
                    plotY,
                    // Absolute coordinates so we can compare different panes
                    chartX: paneLeft + plotX,
                    chartY: paneTop + plotY
                };

                if (onArea) {
                    // Vertically centered inside area

                    if (plotHigh) {
                        ctlPoint.plotY = plotHigh;
                        ctlPoint.chartY = paneTop + plotHigh;
                    }

                    ctlPoint.chartCenterY = paneTop + (
                        (plotHigh ? plotHigh : plotY) +
                        pick(point.yBottom, translatedThreshold)
                    ) / 2;
                }

                // Add interpolated points
                if (last) {
                    deltaX = Math.abs(ctlPoint.chartX - last.chartX);
                    deltaY = Math.abs(ctlPoint.chartY - last.chartY);
                    delta = Math.max(deltaX, deltaY);
                    if (delta > distance) {

                        n = Math.ceil(delta / distance);

                        for (j = 1; j < n; j += 1) {
                            pushDiscrete({
                                chartX: last.chartX +
                                    (ctlPoint.chartX - last.chartX) * (j / n),
                                chartY: last.chartY +
                                    (ctlPoint.chartY - last.chartY) * (j / n),
                                chartCenterY: (last.chartCenterY || 0) +
                                    ((ctlPoint.chartCenterY || 0) -
                                    (last.chartCenterY || 0)) * (j / n),
                                plotX: (last.plotX || 0) +
                                    (plotX - (last.plotX || 0)) * (j / n),
                                plotY: (last.plotY || 0) +
                                    (plotY - (last.plotY || 0)) * (j / n)
                            });
                        }
                    }
                }

                // Add the real point in order to find positive and negative
                // peaks
                pushDiscrete(ctlPoint);


                last = ctlPoint;
            }

        }
    }

    // Get the bounding box so we can do a quick check first if the bounding
    // boxes overlap.
    /*
    interpolated.bBox = node.getBBox();
    interpolated.bBox.x += paneLeft;
    interpolated.bBox.y += paneTop;
    */
    return interpolated;
}

/**
 * Overridable function to return series-specific font sizes for the labels. By
 * default it returns bigger font sizes for series with the greater sum of y
 * values.
 * @private
 */
function labelFontSize(
    series: Series,
    minFontSize: number,
    maxFontSize: number
): string {
    return minFontSize + (
        ((series.sum || 0) / (series.chart.labelSeriesMaxSum || 0)) *
        (maxFontSize - minFontSize)
    ) + 'px';
}

/**
 * Prepare drawing series labels.
 * @private
 */
function onChartRedraw(this: Chart, e: Event): void {

    if (this.renderer) {
        const chart = this;

        let delay = animObject(chart.renderer.globalAnimation).duration;

        chart.labelSeries = [];
        chart.labelSeriesMaxSum = 0;

        if (chart.seriesLabelTimer) {
            U.clearTimeout(chart.seriesLabelTimer);
        }

        // Which series should have labels
        chart.series.forEach(function (series): void {
            const seriesLabelOptions = series.options.label || {},
                label = series.labelBySeries,
                closest = label && label.closest;

            if (
                seriesLabelOptions.enabled &&
                series.visible &&
                (series.graph || series.area) &&
                !series.boosted &&
                chart.labelSeries
            ) {
                chart.labelSeries.push(series);

                if (
                    seriesLabelOptions.minFontSize &&
                    seriesLabelOptions.maxFontSize &&
                    series.yData
                ) {
                    series.sum = (series.yData as any).reduce((
                        pv: number,
                        cv: number
                    ): number => (pv || 0) + (cv || 0), 0);

                    chart.labelSeriesMaxSum = Math.max(
                        chart.labelSeriesMaxSum || 0,
                        series.sum || 0
                    );
                }

                // The labels are processing heavy, wait until the animation is
                // done
                if (e.type === 'load') {
                    delay = Math.max(
                        delay,
                        animObject(series.options.animation).duration
                    );
                }

                // Keep the position updated to the axis while redrawing
                if (closest) {
                    if (typeof closest[0].plotX !== 'undefined') {
                        label.animate({
                            x: closest[0].plotX + closest[1],
                            y: closest[0].plotY + closest[2]
                        });
                    } else {
                        label.attr({ opacity: 0 });
                    }
                }
            }
        });

        chart.seriesLabelTimer = syncTimeout(function (): void {
            if (chart.series && chart.labelSeries) { // #7931, chart destroyed
                drawSeriesLabels(chart);
            }
        }, chart.renderer.forExport || !delay ? 0 : delay);
    }

}

/**
 * General symbol definition for labels with connector.
 * @private
 */
function symbolConnector(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath {
    const anchorX = options && options.anchorX,
        anchorY = options && options.anchorY;

    let path: (SVGPath|undefined),
        yOffset: number,
        lateral = w / 2;

    if (isNumber(anchorX) && isNumber(anchorY)) {

        path = [['M', anchorX, anchorY]];

        // Prefer 45 deg connectors
        yOffset = y - anchorY;
        if (yOffset < 0) {
            yOffset = -h - yOffset;
        }
        if (yOffset < w) {
            lateral = anchorX < x + (w / 2) ? yOffset : w - yOffset;
        }

        // Anchor below label
        if (anchorY > y + h) {
            path.push(['L', x + lateral, y + h]);

        // Anchor above label
        } else if (anchorY < y) {
            path.push(['L', x + lateral, y]);

        // Anchor left of label
        } else if (anchorX < x) {
            path.push(['L', x, y + h / 2]);

        // Anchor right of label
        } else if (anchorX > x + w) {
            path.push(['L', x + w, y + h / 2]);
        }
    }
    return path || [];
}

/* *
 *
 *  Default Export
 *
 * */

const SeriesLabel = {
    compose
};

export default SeriesLabel;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Containing the position of a box that should be avoided by labels.
 *
 * @interface Highcharts.LabelIntersectBoxObject
 *//**
 * @name Highcharts.LabelIntersectBoxObject#bottom
 * @type {number}
 *//**
 * @name Highcharts.LabelIntersectBoxObject#left
 * @type {number}
 *//**
 * @name Highcharts.LabelIntersectBoxObject#right
 * @type {number}
 *//**
 * @name Highcharts.LabelIntersectBoxObject#top
 * @type {number}
 */

(''); // keeps doclets above in JS file
