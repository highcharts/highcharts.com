/* *
 *
 *  Tilemaps module
 *
 *  (c) 2010-2021 Highsoft AS
 *  Author: Øystein Moseng
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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type Point from '../../Core/Series/Point';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type TilemapPoint from './TilemapPoint';
import type TilemapSeries from './TilemapSeries';
import type { TilemapShapeValue } from './TilemapSeriesOptions';
import H from '../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        heatmap: HeatmapSeries,
        scatter: ScatterSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
const {
    clamp,
    pick
} = U;

/**
 * Utility func to get padding definition from tile size division
 * @private
 */
function tilePaddingFromTileSize(
    series: TilemapSeries,
    xDiv: number,
    yDiv: number
): TilemapShapes.PaddingObject {
    const options = series.options;

    return {
        xPad: (options.colsize || 1) / -xDiv,
        yPad: (options.rowsize || 1) / -yDiv
    };
}

/* *
 *
 *  Namespace
 *
 * */

namespace TilemapShapes {

    export interface DefinitionObject {
        alignDataLabel(
            this: TilemapSeries,
            point: Point,
            dataLabel: SVGElement,
            options: DataLabelOptions,
            alignTo: BBoxObject,
            isNew?: boolean
        ): void;
        getSeriesPadding(series: TilemapSeries): PaddingObject;
        haloPath(
            this: TilemapPoint,
            size: number
        ): SVGPath;
        translate(this: TilemapSeries): void;
    }

    export interface PaddingObject {
        xPad: number;
        yPad: number;
    }

}

/* *
 *
 *  Registry
 *
 * */

/**
 * Map of shape types.
 * @private
 */
const TilemapShapes: Record<TilemapShapeValue, TilemapShapes.DefinitionObject> = {

    // Hexagon shape type.
    hexagon: {
        alignDataLabel: ScatterSeries.prototype.alignDataLabel,
        getSeriesPadding: function (
            series: TilemapSeries
        ): TilemapShapes.PaddingObject {
            return tilePaddingFromTileSize(series, 3, 2);
        },
        haloPath: function (
            this: TilemapPoint,
            size: number
        ): SVGPath {
            if (!size) {
                return [];
            }
            const hexagon = this.tileEdges;

            return [
                ['M', hexagon.x2 - size, hexagon.y1 + size],
                ['L', hexagon.x3 + size, hexagon.y1 + size],
                ['L', hexagon.x4 + size * 1.5, hexagon.y2],
                ['L', hexagon.x3 + size, hexagon.y3 - size],
                ['L', hexagon.x2 - size, hexagon.y3 - size],
                ['L', hexagon.x1 - size * 1.5, hexagon.y2],
                ['Z']
            ];
        },
        translate: function (this: TilemapSeries): void {
            let series = this,
                options = series.options,
                xAxis = series.xAxis,
                yAxis = series.yAxis,
                seriesPointPadding = options.pointPadding || 0,
                xPad = (options.colsize || 1) / 3,
                yPad = (options.rowsize || 1) / 2,
                yShift: (number|undefined);

            series.generatePoints();

            series.points.forEach(function (point): void {
                let x1 = clamp(
                        Math.floor(
                            xAxis.len -
                            xAxis.translate(
                                point.x - xPad * 2,
                                0 as any,
                                1 as any,
                                0 as any,
                                1 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    x2 = clamp(
                        Math.floor(
                            xAxis.len -
                            xAxis.translate(
                                point.x - xPad,
                                0 as any,
                                1 as any,
                                0 as any,
                                1 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    x3 = clamp(
                        Math.floor(
                            xAxis.len -
                            xAxis.translate(
                                point.x + xPad,
                                0 as any,
                                1 as any,
                                0 as any,
                                1 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    x4 = clamp(
                        Math.floor(
                            xAxis.len -
                            xAxis.translate(
                                point.x + xPad * 2,
                                0 as any,
                                1 as any,
                                0 as any,
                                1 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    y1 = clamp(
                        Math.floor(yAxis.translate(
                            point.y - yPad,
                            0 as any,
                            1 as any,
                            0 as any,
                            1 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    y2 = clamp(
                        Math.floor(yAxis.translate(
                            point.y,
                            0 as any,
                            1 as any,
                            0 as any,
                            1 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    y3 = clamp(
                        Math.floor(yAxis.translate(
                            point.y + yPad,
                            0 as any,
                            1 as any,
                            0 as any,
                            1 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    pointPadding = pick(point.pointPadding, seriesPointPadding),
                    // We calculate the point padding of the midpoints to
                    // preserve the angles of the shape.
                    midPointPadding = pointPadding *
                        Math.abs(x2 - x1) / Math.abs(y3 - y2),
                    xMidPadding = xAxis.reversed ?
                        -midPointPadding : midPointPadding,
                    xPointPadding = xAxis.reversed ?
                        -pointPadding : pointPadding,
                    yPointPadding = yAxis.reversed ?
                        -pointPadding : pointPadding;

                // Shift y-values for every second grid column
                if (point.x % 2) {
                    yShift = yShift || Math.round(Math.abs(y3 - y1) / 2) *
                        // We have to reverse the shift for reversed y-axes
                        (yAxis.reversed ? -1 : 1);
                    y1 += yShift;
                    y2 += yShift;
                    y3 += yShift;
                }

                // Set plotX and plotY for use in K-D-Tree and more
                point.plotX = point.clientX = (x2 + x3) / 2;
                point.plotY = y2;

                // Apply point padding to translated coordinates
                x1 += xMidPadding + xPointPadding;
                x2 += xPointPadding;
                x3 -= xPointPadding;
                x4 -= xMidPadding + xPointPadding;
                y1 -= yPointPadding;
                y3 += yPointPadding;

                // Store points for halo creation
                point.tileEdges = {
                    x1: x1, x2: x2, x3: x3, x4: x4, y1: y1, y2: y2, y3: y3
                };

                // Finally set the shape for this point
                point.shapeType = 'path';
                point.shapeArgs = {
                    d: [
                        ['M', x2, y1],
                        ['L', x3, y1],
                        ['L', x4, y2],
                        ['L', x3, y3],
                        ['L', x2, y3],
                        ['L', x1, y2],
                        ['Z']
                    ]
                };
            });

            series.translateColors();
        }
    },

    // Diamond shape type.
    diamond: {
        alignDataLabel: ScatterSeries.prototype.alignDataLabel,
        getSeriesPadding: function (
            series: TilemapSeries
        ): TilemapShapes.PaddingObject {
            return tilePaddingFromTileSize(series, 2, 2);
        },
        haloPath: function (
            this: TilemapPoint,
            size: number
        ): SVGPath {
            if (!size) {
                return [];
            }
            const diamond = this.tileEdges;

            return [
                ['M', diamond.x2, diamond.y1 + size],
                ['L', diamond.x3 + size, diamond.y2],
                ['L', diamond.x2, diamond.y3 - size],
                ['L', diamond.x1 - size, diamond.y2],
                ['Z']
            ];
        },
        translate: function (this: TilemapSeries): void {
            let series = this,
                options = series.options,
                xAxis = series.xAxis,
                yAxis = series.yAxis,
                seriesPointPadding = options.pointPadding || 0,
                xPad = (options.colsize || 1),
                yPad = (options.rowsize || 1) / 2,
                yShift;

            series.generatePoints();

            series.points.forEach(function (point): void {
                let x1 = clamp(
                        Math.round(
                            xAxis.len -
                            xAxis.translate(
                                point.x - xPad,
                                0 as any,
                                1 as any,
                                0 as any,
                                0 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    x2 = clamp(
                        Math.round(
                            xAxis.len -
                            xAxis.translate(
                                point.x,
                                0 as any,
                                1 as any,
                                0 as any,
                                0 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    x3 = clamp(
                        Math.round(
                            xAxis.len -
                            xAxis.translate(
                                point.x + xPad,
                                0 as any,
                                1 as any,
                                0 as any,
                                0 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    y1 = clamp(
                        Math.round(yAxis.translate(
                            point.y - yPad,
                            0 as any,
                            1 as any,
                            0 as any,
                            0 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    y2 = clamp(
                        Math.round(yAxis.translate(
                            point.y,
                            0 as any,
                            1 as any,
                            0 as any,
                            0 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    y3 = clamp(
                        Math.round(yAxis.translate(
                            point.y + yPad,
                            0 as any,
                            1 as any,
                            0 as any,
                            0 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    pointPadding = pick(point.pointPadding, seriesPointPadding),
                    // We calculate the point padding of the midpoints to
                    // preserve the angles of the shape.
                    midPointPadding = pointPadding *
                        Math.abs(x2 - x1) / Math.abs(y3 - y2),
                    xPointPadding = xAxis.reversed ?
                        -midPointPadding : midPointPadding,
                    yPointPadding = yAxis.reversed ?
                        -pointPadding : pointPadding;

                // Shift y-values for every second grid column
                // We have to reverse the shift for reversed y-axes
                if (point.x % 2) {
                    yShift = Math.abs(y3 - y1) / 2 * (yAxis.reversed ? -1 : 1);
                    y1 += yShift;
                    y2 += yShift;
                    y3 += yShift;
                }

                // Set plotX and plotY for use in K-D-Tree and more
                point.plotX = point.clientX = x2;
                point.plotY = y2;

                // Apply point padding to translated coordinates
                x1 += xPointPadding;
                x3 -= xPointPadding;
                y1 -= yPointPadding;
                y3 += yPointPadding;

                // Store points for halo creation
                point.tileEdges = {
                    x1: x1, x2: x2, x3: x3, y1: y1, y2: y2, y3: y3
                };

                // Set this point's shape parameters
                point.shapeType = 'path';
                point.shapeArgs = {
                    d: [
                        ['M', x2, y1],
                        ['L', x3, y2],
                        ['L', x2, y3],
                        ['L', x1, y2],
                        ['Z']
                    ]
                };
            });

            series.translateColors();
        }
    },

    // Circle shape type.
    circle: {
        alignDataLabel: ScatterSeries.prototype.alignDataLabel,
        getSeriesPadding: function (
            series: TilemapSeries
        ): TilemapShapes.PaddingObject {
            return tilePaddingFromTileSize(series, 2, 2);
        },
        haloPath: function (
            this: TilemapPoint,
            size: number
        ): SVGPath { // eslint-disable-line @typescript-eslint/indent
            return ScatterSeries.prototype.pointClass.prototype.haloPath
                .call(
                    this,
                    size + (size && this.radius)
                );
        },
        translate: function (this: TilemapSeries): void {
            let series = this,
                options = series.options,
                xAxis = series.xAxis,
                yAxis = series.yAxis,
                seriesPointPadding = options.pointPadding || 0,
                yRadius = (options.rowsize || 1) / 2,
                colsize = (options.colsize || 1),
                colsizePx: (number|undefined),
                yRadiusPx: (number|undefined),
                xRadiusPx: (number|undefined),
                radius: number,
                forceNextRadiusCompute = false;

            series.generatePoints();

            series.points.forEach(function (point): void {
                let x = clamp(
                        Math.round(
                            xAxis.len -
                            xAxis.translate(
                                point.x,
                                0 as any,
                                1 as any,
                                0 as any,
                                0 as any
                            )
                        ), -xAxis.len, 2 * xAxis.len
                    ),
                    y = clamp(
                        Math.round(yAxis.translate(
                            point.y,
                            0 as any,
                            1 as any,
                            0 as any,
                            0 as any
                        )),
                        -yAxis.len,
                        2 * yAxis.len
                    ),
                    pointPadding = seriesPointPadding,
                    hasPerPointPadding = false;

                // If there is point padding defined on a single point, add it
                if (typeof point.pointPadding !== 'undefined') {
                    pointPadding = point.pointPadding;
                    hasPerPointPadding = true;
                    forceNextRadiusCompute = true;
                }

                // Find radius if not found already.
                // Use the smallest one (x vs y) to avoid overlap.
                // Note that the radius will be recomputed for each series.
                // Ideal (max) x radius is dependent on y radius:
                /*
                                * (circle 2)

                                        * (circle 3)
                                        |    yRadiusPx
                    (circle 1)    *-------|
                                 colsizePx

                    The distance between circle 1 and 3 (and circle 2 and 3) is
                    2r, which is the hypotenuse of the triangle created by
                    colsizePx and yRadiusPx. If the distance between circle 2
                    and circle 1 is less than 2r, we use half of that distance
                    instead (yRadiusPx).
                */
                if (!radius || forceNextRadiusCompute) {
                    colsizePx = Math.abs(
                        clamp(
                            Math.floor(
                                xAxis.len -
                                xAxis.translate(
                                    point.x + colsize,
                                    0 as any,
                                    1 as any,
                                    0 as any,
                                    0 as any
                                )
                            ), -xAxis.len, 2 * xAxis.len
                        ) - x
                    );
                    yRadiusPx = Math.abs(
                        clamp(
                            Math.floor(
                                yAxis.translate(
                                    point.y + yRadius,
                                    0 as any,
                                    1 as any,
                                    0 as any,
                                    0 as any
                                )
                            ), -yAxis.len, 2 * yAxis.len
                        ) - y
                    );
                    xRadiusPx = Math.floor(
                        Math.sqrt(
                            (colsizePx * colsizePx + yRadiusPx * yRadiusPx)
                        ) / 2
                    );
                    radius = Math.min(
                        colsizePx, xRadiusPx, yRadiusPx
                    ) - pointPadding;

                    // If we have per point padding we need to always compute
                    // the radius for this point and the next. If we used to
                    // have per point padding but don't anymore, don't force
                    // compute next radius.
                    if (forceNextRadiusCompute && !hasPerPointPadding) {
                        forceNextRadiusCompute = false;
                    }
                }

                // Shift y-values for every second grid column.
                // Note that we always use the optimal y axis radius for this.
                // Also note: We have to reverse the shift for reversed y-axes.
                if (point.x % 2) {
                    y += (yRadiusPx as any) * (yAxis.reversed ? -1 : 1);
                }

                // Set plotX and plotY for use in K-D-Tree and more
                point.plotX = point.clientX = x;
                point.plotY = y;

                // Save radius for halo
                point.radius = radius;

                // Set this point's shape parameters
                point.shapeType = 'circle';
                point.shapeArgs = {
                    x: x,
                    y: y,
                    r: radius
                };
            });

            series.translateColors();
        }
    },

    // Square shape type.
    square: {
        alignDataLabel: HeatmapSeries.prototype.alignDataLabel,
        translate: HeatmapSeries.prototype.translate,
        getSeriesPadding: noop as any,
        haloPath: HeatmapSeries.prototype.pointClass.prototype.haloPath
    }
};

/* *
 *
 *  Default Export
 *
 * */

export default TilemapShapes;
