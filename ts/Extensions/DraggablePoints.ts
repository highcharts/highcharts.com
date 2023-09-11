/* *
 *
 *  (c) 2009-2021 Highsoft AS
 *
 *  Authors: Øystein Moseng, Torstein Hønsi, Jon A. Nygård
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type AnimationOptions from '../Core/Animation/AnimationOptions';
import type AreaRangePoint from '../Series/AreaRange/AreaRangePoint';
import type Axis from '../Core/Axis/Axis';
import type BBoxObject from '../Core/Renderer/BBoxObject';
import type BoxPlotPoint from '../Series/BoxPlot/BoxPlotPoint';
import type BulletPoint from '../Series/Bullet/BulletPoint';
import type ColorString from '../Core/Color/ColorString';
import type ColorType from '../Core/Color/ColorType';
import type ColumnPoint from '../Series/Column/ColumnPoint';
import type ColumnRangePoint from '../Series/ColumnRange/ColumnRangePoint';
import type EventCallback from '../Core/EventCallback';
import type GanttPoint from '../Series/Gantt//GanttPoint';
import type OHLCPoint from '../Series/OHLC/OHLCPoint';
import type PointerEvent from '../Core/PointerEvent';
import type { PointOptions, PointShortOptions } from '../Core/Series/PointOptions';
import type PositionObject from '../Core/Renderer/PositionObject';
import type SVGAttributes from '../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../Core/Renderer/SVG/SVGPath';
import type WaterfallPoint from '../Series/Waterfall/WaterfallPoint';
import type XRangePoint from '../Series/XRange/XRangePoint';

import A from '../Core/Animation/AnimationUtilities.js';
const {
    animObject
} = A;
import Chart from '../Core/Chart/Chart.js';
import H from '../Core/Globals.js';
import Point from '../Core/Series/Point.js';
import Series from '../Core/Series/Series.js';
import SeriesRegistry from '../Core/Series/SeriesRegistry.js';
const {
    seriesTypes
} = SeriesRegistry;
import U from '../Shared/Utilities.js';
import { CursorValue } from '../Core/Renderer/CSSObject';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { merge, objectEach } = OH;
const { addEvent } = EH;
const {
    clamp,
    pick
} = U;

declare module '../Core/Chart/ChartLike'{
    interface ChartLike {
        /** @requires modules/draggable-points */
        dragDropData?: Highcharts.DragDropDataObject;
        /** @requires modules/draggable-points */
        dragHandles?: Highcharts.DragHandlesObject;
        /** @requires modules/draggable-points */
        dragGuideBox?: SVGElement;
        /** @requires modules/draggable-points */
        hasAddedDragDropEvents?: boolean;
        /** @requires modules/annotations */
        hasDraggedAnnotation?: boolean;
        /** @requires modules/draggable-points */
        isDragDropAnimating?: boolean;
        /** @requires modules/draggable-points */
        unbindDragDropMouseUp?: Function;
        /** @requires modules/draggable-points */
        setGuideBoxState(
            state: string,
            options?: Record<string, Highcharts.DragDropGuideBoxOptionsObject>
        ): SVGElement;
        /** @requires modules/draggable-points */
        hideDragHandles(): void;
        /** @requires modules/draggable-points */
        zoomOrPanKeyPressed(e: Event): boolean;
    }
}

declare module '../Core/Chart/ChartOptions'{
    interface ChartOptions {
        zoomKey?: string;
    }
}

declare module '../Core/Series/PointLike' {
    interface PointLike {
        /** @requires modules/draggable-points */
        getDropValues(
            origin: Highcharts.DragDropPositionObject,
            newPos: PointerEvent,
            updateProps: Record<string, Highcharts.SeriesDragDropPropsObject>
        ): Record<string, number>;
        /** @requires modules/draggable-points */
        showDragHandles(): void;
    }
}

declare module '../Core/Series/PointOptions' {
    interface PointOptions {
        dragDrop?: Highcharts.DragDropOptionsObject;
    }
}

declare module '../Core/Series/SeriesLike' {
    interface SeriesLike {
        /** @requires modules/draggable-points */
        dragDropProps?: (Record<string, Partial<Highcharts.SeriesDragDropPropsObject>>|null);
        /** @requires modules/draggable-points */
        getGuideBox(points: Array<Point>): SVGElement;
    }
}

declare module '../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        dragDrop?: Highcharts.DragDropOptionsObject;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface DragDropDataObject {
            draggedPastSensitivity?: boolean;
            groupedPoints: Array<Point>;
            isDragging: boolean;
            isHoveringHandle?: string;
            newPoints?: Record<string, DragDropPointObject>;
            origin: DragDropPositionObject;
            point: Point;
            updateProp?: string;
        }
        interface DragDropGuideBoxOptionsObject {
            className?: string;
            color?: ColorType;
            cursor?: string;
            lineColor?: ColorString;
            lineWidth?: number;
            zIndex?: number;
        }
        interface DragDropHandleOptionsObject {
            className?: string;
            color?: ColorType;
            cursor?: CursorValue;
            lineColor?: ColorString;
            lineWidth?: number;
            pathFormatter?: Function;
            zIndex?: number;
        }
        interface DragDropOptionsObject {
            draggableX?: boolean;
            draggableY?: boolean;
            dragHandle?: DragDropHandleOptionsObject;
            dragMaxX?: number;
            dragMaxY?: number;
            dragMinX?: number;
            dragMinY?: number;
            dragPrecisionX?: number;
            dragPrecisionY?: number;
            dragSensitivity?: number;
            groupBy?: string;
            guideBox?: Record<string, DragDropGuideBoxOptionsObject>;
            liveRedraw?: boolean;
        }
        interface DragDropPointObject {
            point: Point;
            newValues: Record<string, number>;
        }
        interface DragDropPositionObject {
            chartX: number;
            chartY: number;
            guideBox?: BBoxObject;
            points: Record<string, Record<string, number>>;
            prevdX?: number;
            prevdY?: number;
        }
        interface DragHandlesObject {
            group: SVGElement;
            point: string;
        }
        interface PointDragCallbackFunction {
            (this: Point, event: PointDragEventObject): void;
        }
        interface PointDragDropObject {
            newValues: Record<string, number>;
            point: Point;
        }
        interface PointDragEventObject {
            newPoint?: PointDragDropObject;
            newPointId?: string;
            newPoints: Record<string, PointDragDropObject>;
            origin: DragDropPositionObject;
            preventDefault: Function;
            target: Point;
            type: 'drag';
        }
        interface PointDragStartCallbackFunction {
            (this: Point, event: PointDragStartEventObject): void;
        }
        interface PointDragStartEventObject extends MouseEvent {
            updateProp?: string;
        }
        interface PointDropCallbackFunction {
            (this: Point, event: PointDropEventObject): void;
        }
        interface PointDropEventObject {
            newPoint?: PointDragDropObject;
            newPointId?: string;
            newPoints: Record<string, PointDragDropObject>;
            numNewPoints: number;
            origin: DragDropPositionObject;
            preventDefault: Function;
            target: Point;
            type: 'drop';
        }
        interface PointEventsOptionsObject {
            drag?: PointDragCallbackFunction;
            dragStart?: PointDragStartCallbackFunction;
            drop?: PointDropCallbackFunction;
        }
        interface SeriesDragDropPropsObject {
            axis: string;
            beforeResize?: Function;
            handleOptions?: DragDropHandleOptionsObject;
            move: boolean;
            optionName: string;
            resize: boolean;
            resizeSide: (string|SeriesDragDropPropsResizeSideFunction);
            validateIndividualDrag?: Function;
            handleFormatter(point: Point): (SVGPath|null);
            handlePositioner(point: Point): PositionObject;
            propValidate(val: number, point: Point): boolean;
        }
        interface SeriesDragDropPropsResizeSideFunction {
            (...args: Array<any>): string;
        }
    }
}

/**
 * Flip a side property, used with resizeRect. If input side is "left", return
 * "right" etc.
 *
 * @private
 * @function flipResizeSide
 *
 * @param {string} side
 *        Side prop to flip. Can be `left`, `right`, `top` or `bottom`.
 *
 * @return {"bottom"|"left"|"right"|"top"|undefined}
 *         The flipped side.
 */
function flipResizeSide(side: string): string {
    return ({
        left: 'right',
        right: 'left',
        top: 'bottom',
        bottom: 'top'
    } as Record<string, string>)[side];
}

/* @todo
Add drag/drop support to specific data props for different series types.

The dragDrop.draggableX/Y user options on series enable/disable all of these per
irection unless they are specifically set in options using
dragDrop.{optionName}. If the prop does not specify an optionName here, it can
only be enabled/disabled by the user with draggableX/Y.

Supported options for each prop:
    optionName: User option in series.dragDrop that enables/disables
        dragging this prop.
    axis: Can be 'x' or 'y'. Whether this prop is linked to x or y axis.
    move: Whether or not this prop should be updated when moving points.
    resize: Whether or not to draw a drag handle and allow user to drag and
        update this prop by itself.
    beforeResize: Hook to perform tasks before a resize is made. Gets
        the guide box, the new points values, and the point as args.
    resizeSide: Which side of the guide box to resize when dragging the
        handle. Can be "left", "right", "top", "bottom". Chart.inverted is
        handled automatically. Can also be a function, taking the new point
        values as parameter, as well as the point, and returning a string
        with the side.
    propValidate: Function that takes the prop value and the point as
        arguments, and returns true if the prop value is valid, false if
        not. It is used to prevent e.g. resizing "low" above "high".
    handlePositioner: For resizeable props, return 0,0 in SVG plot coords of
        where to place the dragHandle. Gets point as argument. Should return
        object with x and y properties.
    handleFormatter: For resizeable props, return the path of the drag
        handle as an SVG path array. Gets the point as argument. The handle
        is translated according to handlePositioner.
    handleOptions: Options to merge with the default handle options.

    TODO:
    - It makes sense to have support for resizing the size of bubbles and
        e.g variwide columns. This requires us to support dragging along a
        z-axis, somehow computing a relative value from old to new pixel
        size.
    - Moving maps could be useful, although we would have to compute new
        point.path values in order to do it properly (using SVG translate
        is easier, but won't update the data).
*/

// 90deg rotated column handle path, used in multiple series types
const horizHandleFormatter = function (
    point: Point
): SVGPath {
    const shapeArgs = point.shapeArgs || (point.graphic as any).getBBox(),
        top = shapeArgs.r || 0, // Rounding of bar corners
        bottom = shapeArgs.height - top,
        centerY = shapeArgs.height / 2;

    return [
        // Top wick
        ['M', 0, top],
        ['L', 0, centerY - 5],
        // Circle
        ['A', 1, 1, 0, 0, 0, 0, centerY + 5],
        ['A', 1, 1, 0, 0, 0, 0, centerY - 5],
        // Bottom wick
        ['M', 0, centerY + 5],
        ['L', 0, bottom]
    ];
};

// Line series - only draggableX/Y, no drag handles
const lineDragDropProps = Series.prototype.dragDropProps = {
    x: {
        axis: 'x',
        move: true
    },
    y: {
        axis: 'y',
        move: true
    }
};

// Flag series - same as line/scatter
if (seriesTypes.flags) {
    seriesTypes.flags.prototype.dragDropProps = lineDragDropProps;
}

// Column series - x can be moved, y can only be resized. Note extra
// functionality for handling upside down columns (below threshold).
const columnDragDropProps = seriesTypes.column.prototype.dragDropProps = {
    x: {
        axis: 'x',
        move: true
    },
    y: {
        axis: 'y',
        move: false,
        resize: true,
        // Force guideBox start coordinates
        beforeResize: function (
            guideBox: SVGElement,
            pointVals: Record<string, number>,
            point: ColumnPoint
        ): void {
            // We need to ensure that guideBox always starts at threshold.
            // We flip whether or not we update the top or bottom of the guide
            // box at threshold, but if we drag the mouse fast, the top has not
            // reached threshold before we cross over and update the bottom.
            const plotThreshold = pick(
                    point.yBottom, // Added support for stacked series. (#18741)
                    point.series.translatedThreshold
                ),
                plotY = guideBox.attr('y') as number,
                threshold = isNumber(point.stackY) ? (
                    point.stackY - (point.y || 0)
                ) : point.series.options.threshold || 0,
                y = threshold + pointVals.y;

            let height,
                diff;

            if (point.series.yAxis.reversed ? y < threshold : y >= threshold) {
                // Above threshold - always set height to hit the threshold
                height = guideBox.attr('height') as number;
                diff = plotThreshold ? plotThreshold - plotY - height : 0;
                guideBox.attr({
                    height: Math.max(0, Math.round(height + diff))
                });
            } else {
                // Below - always set y to start at threshold
                guideBox.attr({
                    y: Math.round(plotY + (
                        plotThreshold ? plotThreshold - plotY : 0
                    ))
                });
            }
        },
        // Flip the side of the resize handle if column is below threshold.
        // Make sure we remove the handle on the other side.
        resizeSide: function (
            pointVals: Record<string, number>,
            point: ColumnPoint
        ): string {
            const chart = point.series.chart,
                dragHandles = chart.dragHandles,
                side = pointVals.y >= (point.series.options.threshold || 0) ?
                    'top' : 'bottom',
                flipSide = flipResizeSide(side);

            // Force remove handle on other side
            if (dragHandles && (dragHandles as any)[flipSide]) {
                (dragHandles as any)[flipSide].destroy();
                delete (dragHandles as any)[flipSide];
            }
            return side;
        },
        // Position handle at bottom if column is below threshold
        handlePositioner: function (point: ColumnPoint): PositionObject {
            const bBox = (
                    point.shapeArgs ||
                    (point.graphic && point.graphic.getBBox()) ||
                    {}
                ),
                reversed = point.series.yAxis.reversed,
                threshold = point.series.options.threshold || 0,
                y = point.y || 0,
                bottom =
                    (!reversed && y >= threshold) ||
                    (reversed && y < threshold);

            return {
                x: bBox.x || 0,
                y: bottom ? (bBox.y || 0) : (bBox.y || 0) + (bBox.height || 0)
            };
        },
        // Horizontal handle
        handleFormatter: function (point: ColumnPoint): SVGPath {
            const shapeArgs = point.shapeArgs || {},
                radius: number = shapeArgs.r || 0, // Rounding of bar corners
                width: number = shapeArgs.width || 0,
                centerX = width / 2;

            return [
                // Left wick
                ['M', radius, 0],
                ['L', centerX - 5, 0],
                // Circle
                ['A', 1, 1, 0, 0, 0, centerX + 5, 0],
                ['A', 1, 1, 0, 0, 0, centerX - 5, 0],
                // Right wick
                ['M', centerX + 5, 0],
                ['L', width - radius, 0]
            ];
        }
    }
};

// Bullet graph, x/y same as column, but also allow target to be dragged.
if (seriesTypes.bullet) {
    seriesTypes.bullet.prototype.dragDropProps = {
        x: columnDragDropProps.x,
        y: columnDragDropProps.y,
        /**
         * Allow target value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.bullet.dragDrop.draggableTarget
         */
        target: {
            optionName: 'draggableTarget',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'top',
            handlePositioner: function (
                point: BulletPoint
            ): PositionObject {
                const bBox: BBoxObject =
                    (point.targetGraphic as any).getBBox();

                return {
                    x: point.barX,
                    y: bBox.y + bBox.height / 2
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter
        }
    };
}

// Columnrange series - move x, resize or move low/high
if (seriesTypes.columnrange) {
    seriesTypes.columnrange.prototype.dragDropProps = {
        x: {
            axis: 'x',
            move: true
        },
        /**
         * Allow low value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.columnrange.dragDrop.draggableLow
         */
        low: {
            optionName: 'draggableLow',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'bottom',
            handlePositioner: function (
                point: ColumnRangePoint
            ): PositionObject {
                const bBox = (
                    point.shapeArgs || (point.graphic as any).getBBox()
                );

                return {
                    x: bBox.x || 0,
                    y: (bBox.y || 0) + (bBox.height || 0)
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: ColumnRangePoint
            ): boolean {
                return val <= point.high;
            }
        },
        /**
         * Allow high value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.columnrange.dragDrop.draggableHigh
         */
        high: {
            optionName: 'draggableHigh',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'top',
            handlePositioner: function (
                point: ColumnRangePoint
            ): PositionObject {
                const bBox = (
                    point.shapeArgs || (point.graphic as any).getBBox()
                );

                return {
                    x: bBox.x || 0,
                    y: bBox.y || 0
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: ColumnRangePoint
            ): boolean {
                return val >= point.low;
            }
        }
    };
}

// Boxplot series - move x, resize or move low/q1/q3/high
if (seriesTypes.boxplot) {
    seriesTypes.boxplot.prototype.dragDropProps = {
        x: columnDragDropProps.x,
        /**
         * Allow low value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.boxplot.dragDrop.draggableLow
         */
        low: {
            optionName: 'draggableLow',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'bottom',
            handlePositioner: function (
                point: BoxPlotPoint
            ): PositionObject {
                return {
                    x: point.shapeArgs.x || 0,
                    y: point.lowPlot
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: BoxPlotPoint
            ): boolean {
                return val <= point.q1;
            }
        },
        /**
         * Allow Q1 value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.boxplot.dragDrop.draggableQ1
         */
        q1: {
            optionName: 'draggableQ1',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'bottom',
            handlePositioner: function (
                point: BoxPlotPoint
            ): PositionObject {
                return {
                    x: point.shapeArgs.x || 0,
                    y: point.q1Plot
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: BoxPlotPoint
            ): boolean {
                return val <= point.median && val >= point.low;
            }
        },
        median: {
            // Median cannot be dragged individually, just move the whole
            // point for this.
            axis: 'y',
            move: true
        },
        /**
         * Allow Q3 value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.boxplot.dragDrop.draggableQ3
         */
        q3: {
            optionName: 'draggableQ3',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'top',
            handlePositioner: function (
                point: BoxPlotPoint
            ): PositionObject {
                return {
                    x: point.shapeArgs.x || 0,
                    y: point.q3Plot
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: BoxPlotPoint
            ): boolean {
                return val <= point.high && val >= point.median;
            }
        },
        /**
         * Allow high value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.boxplot.dragDrop.draggableHigh
         */
        high: {
            optionName: 'draggableHigh',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'top',
            handlePositioner: function (
                point: BoxPlotPoint
            ): PositionObject {
                return {
                    x: point.shapeArgs.x || 0,
                    y: point.highPlot
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: BoxPlotPoint
            ): boolean {
                return val >= point.q3;
            }
        }
    };
}


// OHLC series - move x, resize or move open/high/low/close
if (seriesTypes.ohlc) {
    seriesTypes.ohlc.prototype.dragDropProps = {
        x: columnDragDropProps.x,
        /**
         * Allow low value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.ohlc.dragDrop.draggableLow
         */
        low: {
            optionName: 'draggableLow',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'bottom',
            handlePositioner: function (
                point: OHLCPoint
            ): PositionObject {
                return {
                    x: (point.shapeArgs as any).x,
                    y: point.plotLow as any
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: OHLCPoint
            ): boolean {
                return val <= point.open && val <= point.close;
            }
        },
        /**
         * Allow high value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.ohlc.dragDrop.draggableHigh
         */
        high: {
            optionName: 'draggableHigh',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'top',
            handlePositioner: function (
                point: OHLCPoint
            ): PositionObject {
                return {
                    x: (point.shapeArgs as any).x,
                    y: point.plotHigh as any
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: OHLCPoint
            ): boolean {
                return val >= point.open && val >= point.close;
            }
        },
        /**
         * Allow open value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.ohlc.dragDrop.draggableOpen
         */
        open: {
            optionName: 'draggableOpen',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: function (point: OHLCPoint): string {
                return point.open >= point.close ? 'top' : 'bottom';
            },
            handlePositioner: function (
                point: OHLCPoint
            ): PositionObject {
                return {
                    x: (point.shapeArgs as any).x,
                    y: point.plotOpen
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: OHLCPoint
            ): boolean {
                return val <= point.high && val >= point.low;
            }
        },
        /**
         * Allow close value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.ohlc.dragDrop.draggableClose
         */
        close: {
            optionName: 'draggableClose',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: function (point: OHLCPoint): string {
                return point.open >= point.close ? 'bottom' : 'top';
            },
            handlePositioner: function (
                point: OHLCPoint
            ): PositionObject {
                return {
                    x: (point.shapeArgs as any).x,
                    y: point.plotClose
                };
            },
            handleFormatter: columnDragDropProps.y.handleFormatter,
            propValidate: function (
                val: number,
                point: OHLCPoint
            ): boolean {
                return val <= point.high && val >= point.low;
            }
        }
    };
}

// Arearange series - move x, resize or move low/high
if (seriesTypes.arearange) {
    const columnrangeDragDropProps =
            seriesTypes.columnrange.prototype.dragDropProps,
        // Use a circle covering the marker as drag handle
        arearangeHandleFormatter = function (
            point: AreaRangePoint
        ): SVGPath {
            const radius = point.graphic ?
                point.graphic.getBBox().width / 2 + 1 :
                4;

            return [
                ['M', 0 - radius, 0],
                ['a', radius, radius, 0, 1, 0, radius * 2, 0],
                ['a', radius, radius, 0, 1, 0, radius * -2, 0]
            ];
        };

    seriesTypes.arearange.prototype.dragDropProps = {
        x: (columnrangeDragDropProps as any).x,
        /**
         * Allow low value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.arearange.dragDrop.draggableLow
         */
        low: {
            optionName: 'draggableLow',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'bottom',
            handlePositioner: function (
                point: AreaRangePoint
            ): PositionObject {
                const bBox = (
                    point.graphics &&
                    point.graphics[0] &&
                    point.graphics[0].getBBox()
                );

                return bBox ? {
                    x: bBox.x + bBox.width / 2,
                    y: bBox.y + bBox.height / 2
                } : { x: -999, y: -999 };
            },
            handleFormatter: arearangeHandleFormatter,
            propValidate: (columnrangeDragDropProps as any).low.propValidate
        },
        /**
         * Allow high value to be dragged individually.
         *
         * @type      {boolean}
         * @default   true
         * @requires  modules/draggable-points
         * @apioption plotOptions.arearange.dragDrop.draggableHigh
         */
        high: {
            optionName: 'draggableHigh',
            axis: 'y',
            move: true,
            resize: true,
            resizeSide: 'top',
            handlePositioner: function (
                point: AreaRangePoint
            ): PositionObject {
                const bBox = (
                    point.graphics &&
                    point.graphics[1] &&
                    point.graphics[1].getBBox()
                );

                return bBox ? {
                    x: bBox.x + bBox.width / 2,
                    y: bBox.y + bBox.height / 2
                } : { x: -999, y: -999 };
            },
            handleFormatter: arearangeHandleFormatter,
            propValidate: (columnrangeDragDropProps as any).high.propValidate
        }
    };
}

// Waterfall - mostly as column, but don't show drag handles for sum points
if (seriesTypes.waterfall) {
    seriesTypes.waterfall.prototype.dragDropProps = {
        x: columnDragDropProps.x,
        y: merge(columnDragDropProps.y, {
            handleFormatter: function (
                point: WaterfallPoint
            ): (SVGPath|null) {
                return point.isSum || point.isIntermediateSum ? null :
                    columnDragDropProps.y.handleFormatter(point);
            }
        })
    };
}

// Xrange - resize/move x/x2, and move y
if (seriesTypes.xrange) {
    // Handle positioner logic is the same for x and x2 apart from the
    // x value. shapeArgs does not take yAxis reversed etc into account, so we
    // use axis.toPixels to handle positioning.
    const xrangeHandlePositioner = function (
            point: XRangePoint,
            xProp: string
        ): PositionObject {
            const series = point.series,
                xAxis = series.xAxis,
                yAxis = series.yAxis,
                inverted = series.chart.inverted,
                offsetY = series.columnMetrics ? series.columnMetrics.offset :
                    -(point.shapeArgs as any).height / 2;
            // Using toPixels handles axis.reversed, but doesn't take
            // chart.inverted into account.
            let newX = xAxis.toPixels((point as any)[xProp], true),
                newY = yAxis.toPixels(point.y as any, true);

            // Handle chart inverted
            if (inverted) {
                newX = xAxis.len - newX;
                newY = yAxis.len - newY;
            }

            newY += offsetY; // (#12872)

            return {
                x: Math.round(newX),
                y: Math.round(newY)
            };
        },
        xrangeDragDropProps = seriesTypes.xrange.prototype.dragDropProps = {
            y: {
                axis: 'y',
                move: true
            },
            /**
             * Allow x value to be dragged individually.
             *
             * @type      {boolean}
             * @default   true
             * @requires  modules/draggable-points
             * @apioption plotOptions.xrange.dragDrop.draggableX1
             */
            x: {
                optionName: 'draggableX1',
                axis: 'x',
                move: true,
                resize: true,
                resizeSide: 'left',
                handlePositioner: function (
                    point: XRangePoint
                ): PositionObject {
                    return xrangeHandlePositioner(point, 'x');
                },
                handleFormatter: horizHandleFormatter,
                propValidate: function (
                    val: number,
                    point: XRangePoint
                ): boolean {
                    return val <= (point.x2 as any);
                }
            },
            /**
             * Allow x2 value to be dragged individually.
             *
             * @type      {boolean}
             * @default   true
             * @requires  modules/draggable-points
             * @apioption plotOptions.xrange.dragDrop.draggableX2
             */
            x2: {
                optionName: 'draggableX2',
                axis: 'x',
                move: true,
                resize: true,
                resizeSide: 'right',
                handlePositioner: function (
                    point: XRangePoint
                ): PositionObject {
                    return xrangeHandlePositioner(point, 'x2');
                },
                handleFormatter: horizHandleFormatter,
                propValidate: function (
                    val: number,
                    point: XRangePoint
                ): boolean {
                    return val >= (point.x as any);
                }
            }
        };

    // Gantt - same as xrange, but with aliases
    if (seriesTypes.gantt) {
        seriesTypes.gantt.prototype.dragDropProps = {
            y: xrangeDragDropProps.y,
            /**
             * Allow start value to be dragged individually.
             *
             * @type      {boolean}
             * @default   true
             * @requires  modules/draggable-points
             * @apioption plotOptions.gantt.dragDrop.draggableStart
             */
            start: merge(xrangeDragDropProps.x, {
                optionName: 'draggableStart',
                // Do not allow individual drag handles for milestones
                validateIndividualDrag: function (
                    point: GanttPoint
                ): boolean {
                    return !point.milestone;
                }
            }),
            /**
             * Allow end value to be dragged individually.
             *
             * @type      {boolean}
             * @default   true
             * @requires  modules/draggable-points
             * @apioption plotOptions.gantt.dragDrop.draggableEnd
             */
            end: merge(xrangeDragDropProps.x2, {
                optionName: 'draggableEnd',
                // Do not allow individual drag handles for milestones
                validateIndividualDrag: function (
                    point: GanttPoint
                ): boolean {
                    return !point.milestone;
                }
            })
        };
    }
}

// Don't support certain series types
[
    'gauge',
    'pie',
    'sunburst',
    'wordcloud',
    'sankey',
    'histogram',
    'pareto',
    'vector',
    'windbarb',
    'treemap',
    'bellcurve',
    'sma',
    'map',
    'mapline'
].forEach(
    /**
     * @private
     * @param {string} type
     *        Unsupported series type
     */
    function (type: string): void {
        if (seriesTypes[type]) {
            seriesTypes[type].prototype.dragDropProps = null;
        }
    }
);

/**
 * The draggable-points module allows points to be moved around or modified in
 * the chart. In addition to the options mentioned under the `dragDrop` API
 * structure, the module fires three events,
 * [point.dragStart](plotOptions.series.point.events.dragStart),
 * [point.drag](plotOptions.series.point.events.drag) and
 * [point.drop](plotOptions.series.point.events.drop).
 *
 * @sample {highcharts|highstock}
 *         highcharts/dragdrop/resize-column
 *         Draggable column and line series
 * @sample {highcharts|highstock}
 *         highcharts/dragdrop/bar-series
 *         Draggable bar
 * @sample {highcharts|highstock}
 *         highcharts/dragdrop/drag-bubble
 *         Draggable bubbles
 * @sample {highcharts|highstock}
 *         highcharts/dragdrop/drag-xrange
 *         Draggable X range series
 * @sample {highcharts|highstock}
 *         highcharts/dragdrop/undraggable-points
 *         Dragging disabled for specific points
 * @sample {highmaps}
 *         maps/series/draggable-mappoint
 *         Draggable Map Point series
 *
 * @declare   Highcharts.SeriesDragDropOptionsObject
 * @since     6.2.0
 * @requires  modules/draggable-points
 * @apioption plotOptions.series.dragDrop
 */

/**
 * The amount of pixels to drag the pointer before it counts as a drag
 * operation. This prevents drag/drop to fire when just clicking or selecting
 * points.
 *
 * @type      {number}
 * @default   2
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragSensitivity
 *
 * @private
 */
const defaultDragSensitivity = 2;

/**
 * Style options for the guide box. The guide box has one state by default, the
 * `default` state.
 *
 * @type         {Highcharts.Dictionary<Highcharts.DragDropGuideBoxOptionsObject>}
 * @since        6.2.0
 * @optionparent plotOptions.series.dragDrop.guideBox
 *
 * @private
 */
const defaultGuideBoxOptions: (
    Record<string, Highcharts.DragDropGuideBoxOptionsObject>
) = {
    /**
     * Style options for the guide box default state.
     *
     * @declare Highcharts.DragDropGuideBoxOptionsObject
     * @since   6.2.0
     */
    'default': {
        /**
         * CSS class name of the guide box in this state. Defaults to
         * `highcharts-drag-box-default`.
         *
         * @since 6.2.0
         */
        className: 'highcharts-drag-box-default',

        /**
         * Width of the line around the guide box.
         *
         * @since 6.2.0
         */
        lineWidth: 1,

        /**
         * Color of the border around the guide box.
         *
         * @type  {Highcharts.ColorString}
         * @since 6.2.0
         */
        lineColor: '#888',

        /**
         * Guide box fill color.
         *
         * @type  {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since 6.2.0
         */
        color: 'rgba(0, 0, 0, 0.1)',

        /**
         * Guide box cursor.
         *
         * @since 6.2.0
         */
        cursor: 'move',

        /**
         * Guide box zIndex.
         *
         * @since 6.2.0
         */
        zIndex: 900
    }
};


/**
 * Options for the drag handles available in column series.
 *
 * @declare      Highcharts.DragDropHandleOptionsObject
 * @since        6.2.0
 * @optionparent plotOptions.column.dragDrop.dragHandle
 *
 * @private
 */
const defaultDragHandleOptions: Highcharts.DragDropHandleOptionsObject = {

    /**
     * Function to define the SVG path to use for the drag handles. Takes the
     * point as argument. Should return an SVG path in array format. The SVG
     * path is automatically positioned on the point.
     *
     * @type      {Function}
     * @since     6.2.0
     * @apioption plotOptions.column.dragDrop.dragHandle.pathFormatter
     */
    // pathFormatter: null,

    /**
     * The mouse cursor to use for the drag handles. By default this is
     * intelligently switching between `ew-resize` and `ns-resize` depending on
     * the direction the point is being dragged.
     *
     * @type      {string}
     * @since     6.2.0
     * @apioption plotOptions.column.dragDrop.dragHandle.cursor
     */
    // cursor: null,

    /**
     * The class name of the drag handles. Defaults to `highcharts-drag-handle`.
     *
     * @since 6.2.0
     */
    className: 'highcharts-drag-handle',

    /**
     * The fill color of the drag handles.
     *
     * @type  {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @since 6.2.0
     */
    color: '#fff',

    /**
     * The line color of the drag handles.
     *
     * @type  {Highcharts.ColorString}
     * @since 6.2.0
     */
    lineColor: 'rgba(0, 0, 0, 0.6)',

    /**
     * The line width for the drag handles.
     *
     * @since 6.2.0
     */
    lineWidth: 1,

    /**
     * The z index for the drag handles.
     *
     * @since 6.2.0
     */
    zIndex: 901
};

/**
 * Set the minimum X value the points can be moved to.
 *
 * @sample {gantt} gantt/dragdrop/drag-gantt
 *         Limit dragging
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Limit dragging
 *
 * @type      {number}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragMinX
 */

/**
 * Set the maximum X value the points can be moved to.
 *
 * @sample {gantt} gantt/dragdrop/drag-gantt
 *         Limit dragging
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Limit dragging
 *
 * @type      {number}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragMaxX
 */

/**
 * Set the minimum Y value the points can be moved to.
 *
 * @sample {gantt} gantt/dragdrop/drag-gantt
 *         Limit dragging
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Limit dragging
 *
 * @type      {number}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragMinY
 */

/**
 * Set the maximum Y value the points can be moved to.
 *
 * @sample {gantt} gantt/dragdrop/drag-gantt
 *         Limit dragging
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Limit dragging
 *
 * @type      {number}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragMaxY
 */

/**
 * The X precision value to drag to for this series. Set to 0 to disable. By
 * default this is disabled, except for category axes, where the default is 1.
 *
 * @type      {number}
 * @default   0
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragPrecisionX
 */

/**
 * The Y precision value to drag to for this series. Set to 0 to disable. By
 * default this is disabled, except for category axes, where the default is 1.
 *
 * @type      {number}
 * @default   0
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.dragPrecisionY
 */

/**
 * Enable dragging in the X dimension.
 *
 * @type      {boolean}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.draggableX
 */

/**
 * Enable dragging in the Y dimension. Note that this is not supported for
 * TreeGrid axes (the default axis type in Gantt charts).
 *
 * @type      {boolean}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.draggableY
 */

/**
 * Group the points by a property. Points with the same property value will be
 * grouped together when moving.
 *
 * @sample {gantt} gantt/dragdrop/drag-gantt
 *         Drag grouped points
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Drag grouped points
 *
 * @type      {string}
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.groupBy
 */

/**
 * Update points as they are dragged. If false, a guide box is drawn to
 * illustrate the new point size.
 *
 * @sample {gantt} gantt/dragdrop/drag-gantt
 *         liveRedraw disabled
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         liveRedraw disabled
 *
 * @type      {boolean}
 * @default   true
 * @since     6.2.0
 * @apioption plotOptions.series.dragDrop.liveRedraw
 */

/**
 * Set a key to hold when dragging to zoom the chart. This is useful to avoid
 * zooming while moving points. Should be set different than
 * [chart.panKey](#chart.panKey).
 *
 * @type       {string}
 * @since      6.2.0
 * @validvalue ["alt", "ctrl", "meta", "shift"]
 * @deprecated
 * @requires  modules/draggable-points
 * @apioption  chart.zoomKey
 */

/**
 * Callback that fires when starting to drag a point. The mouse event object is
 * passed in as an argument. If a drag handle is used, `e.updateProp` is set to
 * the data property being dragged. The `this` context is the point. See
 * [drag and drop options](plotOptions.series.dragDrop).
 *
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Drag events
 *
 * @type      {Highcharts.PointDragStartCallbackFunction}
 * @since     6.2.0
 * @requires  modules/draggable-points
 * @apioption plotOptions.series.point.events.dragStart
 */

/**
 * Callback that fires while dragging a point. The mouse event is passed in as
 * parameter. The original data can be accessed from `e.origin`, and the new
 * point values can be accessed from `e.newPoints`. If there is only a single
 * point being updated, it can be accessed from `e.newPoint` for simplicity, and
 * its ID can be accessed from `e.newPointId`. The `this` context is the point
 * being dragged. To stop the default drag action, return false. See
 * [drag and drop options](plotOptions.series.dragDrop).
 *
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Drag events
 * @sample {highcharts|highstock} highcharts/dragdrop/undraggable-points
 *         Dragging disabled for specific points
 *
 * @type      {Highcharts.PointDragCallbackFunction}
 * @since     6.2.0
 * @requires  modules/draggable-points
 * @apioption plotOptions.series.point.events.drag
 */

/**
 * Callback that fires when the point is dropped. The parameters passed are the
 * same as for [drag](#plotOptions.series.point.events.drag). To stop the
 * default drop action, return false. See
 * [drag and drop options](plotOptions.series.dragDrop).
 *
 * @sample {highcharts} highcharts/dragdrop/drag-xrange
 *         Drag events
 * @sample {highcharts|highstock} highcharts/dragdrop/undraggable-points
 *         Dragging disabled for specific points
 *
 * @type      {Highcharts.PointDropCallbackFunction}
 * @since     6.2.0
 * @requires  modules/draggable-points
 * @apioption plotOptions.series.point.events.drop
 */

/**
 * Point specific options for the draggable-points module. Overrides options on
 * `series.dragDrop`.
 *
 * @declare   Highcharts.SeriesLineDataDragDropOptions
 * @extends   plotOptions.series.dragDrop
 * @since     6.2.0
 * @requires  modules/draggable-points
 * @apioption series.line.data.dragDrop
 */


/**
 * Utility function to test if a series is using drag/drop, looking at its
 * options.
 *
 * @private
 * @function isSeriesDraggable
 * @param {Highcharts.Series} series
 *        The series to test.
 * @return {boolean}
 *         True if the series is using drag/drop.
 */
function isSeriesDraggable(series: Series): (boolean|undefined) {
    const props = ['draggableX', 'draggableY'];

    // Add optionNames from dragDropProps to the array of props to check for
    objectEach(series.dragDropProps, function (
        val: Partial<Highcharts.SeriesDragDropPropsObject>
    ): void {
        if (val.optionName) {
            props.push(val.optionName);
        }
    });

    // Loop over all options we have that could enable dragDrop for this
    // series. If any of them are truthy, this series is draggable.
    let i = props.length;
    while (i--) {
        if ((series.options.dragDrop as any)[props[i]]) {
            return true;
        }
    }
}


/**
 * Utility function to test if a chart should have drag/drop enabled, looking at
 * its options.
 *
 * @private
 * @function isChartDraggable
 * @param {Highcharts.Chart} chart
 *        The chart to test.
 * @return {boolean}
 *         True if the chart is drag/droppable.
 */
function isChartDraggable(chart: Chart): (boolean|undefined) {
    let i = chart.series ? chart.series.length : 0;

    if (
        (chart.hasCartesianSeries && !chart.polar) ||
        chart.mapView
    ) {
        while (i--) {
            if (
                chart.series[i].options.dragDrop &&
                isSeriesDraggable(chart.series[i])
            ) {
                return true;
            }
        }
    }
}


/**
 * Utility function to test if a point is movable (any of its props can be
 * dragged by a move, not just individually).
 *
 * @private
 * @function isPointMovable
 * @param {Highcharts.Point} point
 *        The point to test.
 * @return {boolean}
 *         True if the point is movable.
 */
function isPointMovable(point: Point): (boolean|undefined) {
    const series = point.series,
        chart = series.chart,
        seriesDragDropOptions = series.options.dragDrop || {},
        pointDragDropOptions = point.options && point.options.dragDrop,
        updateProps = series.dragDropProps;
    let hasMovableX,
        hasMovableY;

    objectEach(updateProps, function (
        p: Highcharts.SeriesDragDropPropsObject
    ): void {
        if (p.axis === 'x' && p.move) {
            hasMovableX = true;
        } else if (p.axis === 'y' && p.move) {
            hasMovableY = true;
        }
    });

    // We can only move the point if draggableX/Y is set, even if all the
    // individual prop options are set.
    return (
        (
            seriesDragDropOptions.draggableX && hasMovableX ||
                seriesDragDropOptions.draggableY && hasMovableY
        ) &&
        !(
            pointDragDropOptions &&
            pointDragDropOptions.draggableX === false &&
            pointDragDropOptions.draggableY === false
        ) &&
        (
            (series.yAxis && series.xAxis) ||
            chart.mapView
        )
    );
}


/**
 * Take a mouse/touch event and return the event object with chartX/chartY.
 *
 * @private
 * @function getNormalizedEvent
 * @param {global.PointerEvent} e
 *        The event to normalize.
 * @param {Highcharts.Chart} chart
 *        The related chart.
 * @return {Highcharts.PointerEventLObject}
 *         The normalized event.
 */
function getNormalizedEvent<T extends PointerEvent>(
    e: (T|PointerEvent),
    chart: Chart
): PointerEvent {
    return (
        typeof e.chartX === 'undefined' ||
        typeof e.chartY === 'undefined' ?
            chart.pointer.normalize(e) :
            e
    );
}


/**
 * Add multiple event listeners with the same handler to the same element.
 *
 * @private
 * @function addEvents
 * @param {T} el
 *        The element or object to add listeners to.
 * @param {Array<string>} types
 *        Array with the event types this handler should apply to.
 * @param {Function|Highcharts.EventCallbackFunction<T>} fn
 *        The function callback to execute when the events are fired.
 * @param {Highcharts.EventOptionsObject} [options]
 *        Event options:
 *        - `order`: The order the event handler should be called. This opens
 *          for having one handler be called before another, independent of in
 *          which order they were added.
 * @return {Function}
 *         A callback function to remove the added events.
 * @template T
 */
function addEvents<T>(
    el: T,
    types: Array<string>,
    fn: (Function|EventCallback<T>),
    options?: U.EventOptions
): Function {
    const removeFuncs: Array<Function> = types.map(
        function (type: string): Function {
            return addEvent(el, type, fn, options);
        }
    );

    return function (): void {
        removeFuncs.forEach(function (fn: Function): void {
            fn();
        });
    };
}


/**
 * In mousemove events, check that we have dragged mouse further than the
 * dragSensitivity before we call mouseMove handler.
 *
 * @private
 * @function hasDraggedPastSensitivity
 *
 * @param {Highcharts.PointerEventObject} e
 *        Mouse move event to test.
 *
 * @param {Highcharts.Chart} chart
 *        Chart that has started dragging.
 *
 * @param {number} sensitivity
 *        Pixel sensitivity to test against.
 *
 * @return {boolean}
 *         True if the event is moved past sensitivity relative to the chart's
 *         drag origin.
 */
function hasDraggedPastSensitivity(
    e: PointerEvent,
    chart: Chart,
    sensitivity: number
): boolean {
    const orig = (chart.dragDropData as any).origin,
        oldX = orig.chartX,
        oldY = orig.chartY,
        newX = e.chartX,
        newY = e.chartY,
        distance = Math.sqrt(
            (newX - oldX) * (newX - oldX) +
            (newY - oldY) * (newY - oldY)
        );

    return distance > sensitivity;
}


/**
 * Get a snapshot of points, mouse position, and guide box dimensions
 *
 * @private
 * @function getPositionSnapshot
 *
 * @param {Highcharts.PointerEventObject} e
 *        Mouse event with mouse position to snapshot.
 *
 * @param {Array<Highcharts.Point>} points
 *        Points to take snapshot of. We store the value of the data properties
 *        defined in each series' dragDropProps.
 *
 * @param {Highcharts.SVGElement} [guideBox]
 *        The guide box to take snapshot of.
 *
 * @return {Object}
 *         Snapshot object. Point properties are placed in a hashmap with IDs as
 *         keys.
 */
function getPositionSnapshot(
    e: PointerEvent,
    points: Array<Point>,
    guideBox?: SVGElement
): Highcharts.DragDropPositionObject {
    const res: Highcharts.DragDropPositionObject = {
        chartX: e.chartX,
        chartY: e.chartY,
        guideBox: guideBox && {
            x: guideBox.attr('x'),
            y: guideBox.attr('y'),
            width: guideBox.attr('width'),
            height: guideBox.attr('height')
        } as BBoxObject,
        points: {}
    };

    // Loop over the points and add their props
    points.forEach(function (point: Point): void {
        const pointProps: Record<string, number> = {};

        // Add all of the props defined in the series' dragDropProps to the
        // snapshot
        objectEach(point.series.dragDropProps, function (
            val: (Highcharts.SeriesDragDropPropsObject|null),
            key: string
        ): void {
            const axis = (point.series as any)[(val as any).axis + 'Axis'];

            pointProps[key] = (point as any)[key];
            // Record how far cursor was from the point when drag started.
            // This later will be used to calculate new value according to the
            // current position of the cursor.
            // e.g. `high` value is translated to `highOffset`
            if (point.series.chart.mapView && point.plotX && point.plotY) {
                pointProps[key + 'Offset'] = key === 'x' ?
                    point.plotX : point.plotY;
            } else {
                pointProps[key + 'Offset'] =
                    // e.g. yAxis.toPixels(point.high), xAxis.toPixels
                    // (point.end)
                    axis.toPixels(point[key as keyof typeof point]) -
                    (axis.horiz ? e.chartX : e.chartY);
            }
        });
        (pointProps as any).point = point; // Store reference to point
        res.points[point.id] = pointProps;
    });

    return res;
}


/**
 * Get a list of points that are grouped with this point. If only one point is
 * in the group, that point is returned by itself in an array.
 *
 * @private
 * @function getGroupedPoints
 * @param {Highcharts.Point} point
 *        Point to find group from.
 * @return {Array<Highcharts.Point>}
 *         Array of points in this group.
 */
function getGroupedPoints(point: Point): Array<Point> {
    const series = point.series,
        groupKey = (series.options.dragDrop as any).groupBy;
    let points: Array<Point> = [];

    if (series.boosted) { // #11156
        (series.options.data as any).forEach(function (
            pointOptions: (PointOptions|PointShortOptions),
            i: number
        ): void {
            points.push(
                (new series.pointClass()).init( // eslint-disable-line new-cap
                    series,
                    pointOptions
                )
            );
            points[points.length - 1].index = i;
        });

    } else {
        points = series.points;
    }

    return (point.options as any)[groupKey] ?
        // If we have a grouping option, filter the points by that
        points.filter(function (comparePoint: Point): boolean {
            return (comparePoint.options as any)[groupKey] ===
                (point.options as any)[groupKey];
        }) :
        // Otherwise return the point by itself only
        [point];
}


/**
 * Resize a rect element on one side. The element is modified.
 *
 * @private
 * @function resizeRect
 * @param {Highcharts.SVGElement} rect
 *        Rect element to resize.
 * @param {string} updateSide
 *        Which side of the rect to update. Can be `left`, `right`, `top` or
 *        `bottom`.
 * @param {Highcharts.PositionObject} update
 *        Object with x and y properties, detailing how much to resize each
 *        dimension.
 * @return {void}
 */
function resizeRect(
    rect: SVGElement,
    updateSide: string,
    update: PositionObject
): void {
    let resizeAttrs;

    switch (updateSide) {
        case 'left':
            resizeAttrs = {
                x: (rect.attr('x') as any) + update.x,
                width: Math.max(1, (rect.attr('width') as any) - update.x)
            };
            break;
        case 'right':
            resizeAttrs = {
                width: Math.max(1, (rect.attr('width') as any) + update.x)
            };
            break;
        case 'top':
            resizeAttrs = {
                y: (rect.attr('y') as any) + update.y,
                height: Math.max(1, (rect.attr('height') as any) - update.y)
            };
            break;
        case 'bottom':
            resizeAttrs = {
                height: Math.max(1, (rect.attr('height') as any) + update.y)
            };
            break;
        default:
    }
    rect.attr(resizeAttrs);
}


/**
 * Prepare chart.dragDropData with origin info, and show the guide box.
 *
 * @private
 * @function initDragDrop
 * @param {Highcharts.PointerEventObject} e
 *        Mouse event with original mouse position.
 * @param {Highcharts.Point} point
 *        The point the dragging started on.
 * @return {void}
 */
function initDragDrop(
    e: PointerEvent,
    point: Point
): void {
    const groupedPoints = getGroupedPoints(point),
        series = point.series,
        chart = series.chart;
    let guideBox;

    // If liveRedraw is disabled, show the guide box with the default state
    if (!pick(
        series.options.dragDrop && series.options.dragDrop.liveRedraw,
        true
    )) {
        chart.dragGuideBox = guideBox = series.getGuideBox(groupedPoints);
        chart
            .setGuideBoxState(
                'default',
                (series.options.dragDrop as any).guideBox
            )
            .add(series.group);
    }

    // Store some data on the chart to pick up later
    chart.dragDropData = {
        origin: getPositionSnapshot(e, groupedPoints, guideBox),
        point: point,
        groupedPoints: groupedPoints,
        isDragging: true
    };
}


/**
 * Calculate new point options from points being dragged.
 *
 * @private
 * @function getNewPoints
 *
 * @param {Object} dragDropData
 *        A chart's dragDropData with drag/drop origin information, and info on
 *        which points are being dragged.
 *
 * @param {Highcharts.PointerEventObject} newPos
 *        Event with the new position of the mouse (chartX/Y properties).
 *
 * @return {Highchats.Dictionary<object>}
 *         Hashmap with point.id mapped to an object with the original point
 *         reference, as well as the new data values.
 */
function getNewPoints(
    dragDropData: Highcharts.DragDropDataObject,
    newPos: PointerEvent
): Record<string, Highcharts.DragDropPointObject> {
    const point = dragDropData.point,
        series = point.series,
        chart = series.chart,
        options = merge(series.options.dragDrop, point.options.dragDrop),
        updateProps: (
            Record<string, Partial<Highcharts.SeriesDragDropPropsObject>>
        ) = {},
        resizeProp = dragDropData.updateProp,
        hashmap: Record<string, Highcharts.DragDropPointObject> = {};

    // Go through the data props that can be updated on this series and find out
    // which ones we want to update.
    objectEach(point.series.dragDropProps, function (
        val: Partial<Highcharts.SeriesDragDropPropsObject>,
        key: string
    ): void {
        // If we are resizing, skip if this key is not the correct one or it
        // is not resizable.
        if (
            resizeProp && (
                resizeProp !== key ||
                !val.resize ||
                val.optionName && (options as any)[val.optionName] === false
            )
        ) {
            return;
        }

        // If we are resizing, we now know it is good. If we are moving, check
        // that moving along this axis is enabled, and the prop is movable.
        // If this prop is enabled, add it to be updated.
        if (
            resizeProp || (
                val.move &&
                (
                    val.axis === 'x' && options.draggableX ||
                    val.axis === 'y' && options.draggableY
                )
            )
        ) {
            if (chart.mapView) {
                updateProps[key === 'x' ? 'lon' : 'lat'] = val;
            } else {
                updateProps[key] = val;
            }
        }
    });

    // Go through the points to be updated and get new options for each of them
    (
        // If resizing).forEach(only update the point we are resizing
        resizeProp ?
            [point] :
            dragDropData.groupedPoints
    ).forEach(
        function (p: Point): void {
            hashmap[p.id] = {
                point: p,
                newValues: p.getDropValues(
                    dragDropData.origin, newPos, updateProps as any
                )
            };
        }
    );
    return hashmap;
}


/**
 * Update the points in a chart from dragDropData.newPoints.
 *
 * @private
 * @function updatePoints
 * @param {Highcharts.Chart} chart
 *        A chart with dragDropData.newPoints.
 * @param {boolean} [animation=true]
 *        Animate updating points?
 */
function updatePoints(
    chart: Chart,
    animation?: (boolean|Partial<AnimationOptions>)
): void {
    const newPoints: Record<string, Highcharts.DragDropPointObject> =
            (chart.dragDropData as any).newPoints,
        animOptions = animObject(animation);

    chart.isDragDropAnimating = true;

    // Update the points
    objectEach(newPoints, function (
        newPoint: Highcharts.DragDropPointObject
    ): void {
        newPoint.point.update(newPoint.newValues, false);
    });

    chart.redraw(animOptions);

    // Clear the isAnimating flag after animation duration is complete.
    // The complete handler for animation seems to have bugs at this time, so
    // we have to use a timeout instead.
    setTimeout(function (): void {
        delete chart.isDragDropAnimating;
        if (chart.hoverPoint && !chart.dragHandles) {
            chart.hoverPoint.showDragHandles();
        }
    }, animOptions.duration);
}


/**
 * Resize the guide box according to point options and a difference in mouse
 * positions. Handles reversed axes.
 *
 * @private
 * @function resizeGuideBox
 * @param {Highcharts.Point} point
 *        The point that is being resized.
 * @param {number} dX
 *        Difference in X position.
 * @param {number} dY
 *        Difference in Y position.
 */
function resizeGuideBox(point: Point, dX: number, dY: number): void {
    const series = point.series,
        chart = series.chart,
        dragDropData: Highcharts.DragDropDataObject = chart.dragDropData as any,
        resizeProp =
            (series.dragDropProps as any)[dragDropData.updateProp as any],
        // dragDropProp.resizeSide holds info on which side to resize.
        newPoint = (dragDropData as any).newPoints[point.id as any].newValues,
        resizeSide = typeof resizeProp.resizeSide === 'function' ?
            resizeProp.resizeSide(newPoint, point) : resizeProp.resizeSide;

    // Call resize hook if it is defined
    if (resizeProp.beforeResize) {
        resizeProp.beforeResize(chart.dragGuideBox, newPoint, point);
    }

    // Do the resize
    resizeRect(
        chart.dragGuideBox as any,
        resizeProp.axis === 'x' && series.xAxis.reversed ||
        resizeProp.axis === 'y' && series.yAxis.reversed ?
            flipResizeSide(resizeSide) : resizeSide,
        {
            x: resizeProp.axis === 'x' ?
                dX - (dragDropData.origin.prevdX || 0) : 0,
            y: resizeProp.axis === 'y' ?
                dY - (dragDropData.origin.prevdY || 0) : 0
        }
    );
}


/**
 * Default mouse move handler while dragging. Handles updating points or guide
 * box.
 *
 * @private
 * @function dragMove
 * @param {Highcharts.PointerEventObject} e
 *        The mouse move event.
 * @param {Highcharts.Point} point
 *        The point that is dragged.
 */
function dragMove(
    e: PointerEvent,
    point: Point
): void {
    const series = point.series,
        chart = series.chart,
        data = chart.dragDropData,
        options = merge(series.options.dragDrop, point.options.dragDrop),
        draggableX = options.draggableX,
        draggableY = options.draggableY,
        origin: Highcharts.DragDropPositionObject = (data as any).origin,
        updateProp: string = (data as any).updateProp;
    let dX = e.chartX - origin.chartX,
        dY = e.chartY - origin.chartY;

    const oldDx = dX;

    // Handle inverted
    if (chart.inverted) {
        dX = -dY;
        dY = -oldDx;
    }

    // If we have liveRedraw enabled, update the points immediately. Otherwise
    // update the guideBox.
    if (pick(options.liveRedraw, true)) {
        updatePoints(chart, false);

        // Update drag handles
        point.showDragHandles();

    } else {
        // No live redraw, update guide box
        if (updateProp) {
            // We are resizing, so resize the guide box
            resizeGuideBox(point, dX, dY);
        } else {
            // We are moving, so move the guide box
            (chart.dragGuideBox as any).translate(
                draggableX ? dX : 0, draggableY ? dY : 0
            );
        }
    }

    // Update stored previous dX/Y
    origin.prevdX = dX;
    origin.prevdY = dY;
}


/**
 * Set the state of the guide box.
 *
 * @private
 * @function Highcharts.Chart#setGuideBoxState
 * @param {string} state
 *        The state to set the guide box to.
 * @param {Highcharts.Dictionary<Highcharts.DragDropGuideBoxOptionsObject>} [options]
 *        Additional overall guideBox options to consider.
 * @return {Highcharts.SVGElement}
 *         The modified guide box.
 */
Chart.prototype.setGuideBoxState = function (
    state: string,
    options?: Record<string, Highcharts.DragDropGuideBoxOptionsObject>
): SVGElement {
    const guideBox = this.dragGuideBox,
        guideBoxOptions = merge(defaultGuideBoxOptions, options),
        stateOptions = merge(
            guideBoxOptions['default'], // eslint-disable-line dot-notation
            guideBoxOptions[state]
        );

    return (guideBox as any)
        .attr({
            'class': stateOptions.className,
            stroke: stateOptions.lineColor,
            strokeWidth: stateOptions.lineWidth,
            fill: stateOptions.color,
            cursor: stateOptions.cursor,
            zIndex: stateOptions.zIndex
        })
        // Use pointerEvents 'none' to avoid capturing the click event
        .css({ pointerEvents: 'none' });
};


/**
 * Get updated point values when dragging a point.
 *
 * @private
 * @function Highcharts.Point#getDropValues
 *
 * @param {Object} origin
 *        Mouse position (chartX/Y) and point props at current data values.
 *        Point props should be organized per point.id in a hashmap.
 *
 * @param {Highcharts.PointerEventObject} newPos
 *        New mouse position (chartX/Y).
 *
 * @param {Highcharts.Dictionary<Highcharts.Dictionary<Highcharts.Dictionary<string>>>} updateProps
 *        Point props to modify. Map of prop objects where each key refers to
 *        the prop, and the value is an object with an axis property. Example:
 *        {
 *            x: {
 *                axis: 'x'
 *            },
 *            x2: {
 *                axis: 'x'
 *            }
 *        }
 *
 * @return {Highcharts.Dictionary<number>}
 *         An object with updated data values.
 */
Point.prototype.getDropValues = function (
    origin: Highcharts.DragDropPositionObject,
    newPos: PointerEvent,
    updateProps: Record<string, Highcharts.SeriesDragDropPropsObject>
): Record<string, number> {
    const point = this,
        series = point.series,
        chart = series.chart,
        mapView = chart.mapView,
        options = merge(series.options.dragDrop, point.options.dragDrop),
        result: Record<string, number> = {},
        pointOrigin = origin.points[point.id];
    let updateSingleProp: (boolean|undefined);

    // Find out if we only have one prop to update
    for (const key in updateProps) {
        if (Object.hasOwnProperty.call(updateProps, key)) {
            if (typeof updateSingleProp !== 'undefined') {
                updateSingleProp = false;
                break;
            }
            updateSingleProp = true;
        }
    }

    /**
     * Utility function to apply precision and limit a value within the
     * draggable range.
     * @private
     * @param {number} val
     *        Value to limit
     * @param {string} direction
     *        Axis direction
     * @return {number}
     *         Limited value
     */
    const limitToRange = function (val: number, direction: string): number {
        const defaultPrecision =
            (series as any)[direction.toLowerCase() + 'Axis']
                .categories ? 1 : 0,
            precision = pick<number|undefined, number>(
                (options as any)['dragPrecision' + direction], defaultPrecision
            ),
            min = pick<number|undefined, number>(
                (options as any)['dragMin' + direction] as any,
                -Infinity
            ),
            max = pick<number|undefined, number>(
                (options as any)['dragMax' + direction] as number,
                Infinity
            );
        let res = val;

        if (precision) {
            res = Math.round(res / precision) * precision;
        }
        return clamp(res, min, max);
    };

    /**
     * Utility function to apply precision and limit a value within the
     * draggable range used only for Highcharts Maps.
     * @private
     * @param {PointerEvent} newPos
     *        PointerEvent, which is used to get the value
     * @param {string} direction
     *        Axis direction
     * @param {string} key
     *        Key for choosing between longitude and latitude
     * @return {number | undefined}
     *         Limited value
     */
    const limitToMapRange = function (
        newPos: PointerEvent,
        direction: string,
        key: string
    ): number | undefined {
        if (mapView) {
            const precision = pick<number|undefined, number>(
                    (options as any)['dragPrecision' + direction],
                    0
                ),
                lonLatMin = mapView.pixelsToLonLat({
                    x: 0,
                    y: 0
                }),
                lonLatMax = mapView.pixelsToLonLat({
                    x: chart.plotBox.width,
                    y: chart.plotBox.height
                });
            let min = pick(
                    (options as any)['dragMin' + direction] as any,
                    lonLatMin &&
                        lonLatMin[key as keyof Highcharts.MapLonLatObject],
                    -Infinity
                ),
                max = pick(
                    (options as any)['dragMax' + direction] as number,
                    lonLatMax &&
                        lonLatMax[key as keyof Highcharts.MapLonLatObject],
                    Infinity
                ),
                res = newPos[key as keyof typeof newPos] as number;

            if (mapView.projection.options.name === 'Orthographic') {
                return res;
            }

            if (key === 'lat') {
                // if map is bigger than possible projection range
                if (isNaN(min) || min > mapView.projection.maxLatitude) {
                    min = mapView.projection.maxLatitude;
                }

                if (isNaN(max) || max < -1 * mapView.projection.maxLatitude) {
                    max = -1 * mapView.projection.maxLatitude;
                }

                // swap for latitude
                const temp = max;
                max = min;
                min = temp;
            }

            if (!mapView.projection.hasCoordinates) {
                // establish y value
                const lonLatRes = mapView.pixelsToLonLat({
                    x: newPos.chartX - chart.plotLeft,
                    y: chart.plotHeight - newPos.chartY + chart.plotTop
                });
                if (lonLatRes) {
                    res = (lonLatRes as any)[key];
                }
            }

            if (precision) {
                res = Math.round(res / precision) * precision;
            }

            return clamp(res, min, max);
        }
    };

    // Assign new value to property. Adds dX/YValue to the old value, limiting
    // it within min/max ranges.
    objectEach(updateProps, function (
        val: Highcharts.SeriesDragDropPropsObject,
        key: string
    ): void {
        const oldVal = (pointOrigin.point as any)[key],
            axis: Axis = (series as any)[val.axis + 'Axis'],
            newVal = mapView ?
                limitToMapRange(newPos, val.axis.toUpperCase(), key) :
                limitToRange(
                    axis.toValue(
                        (axis.horiz ? newPos.chartX : newPos.chartY) +
                        (pointOrigin as any)[key + 'Offset']
                    ),
                    val.axis.toUpperCase()
                );

        // If we are updating a single prop, and it has a validation function
        // for the prop, run it. If it fails, don't update the value.
        if (
            isNumber(newVal) &&
            !(
                updateSingleProp &&
                val.propValidate &&
                !val.propValidate(newVal, point)
            ) &&
            typeof oldVal !== 'undefined'
        ) {
            result[key] = newVal;
        }
    });

    return result;
};


/**
 * Returns an SVGElement to use as the guide box for a set of points.
 *
 * @private
 * @function Highcharts.Series#getGuideBox
 *
 * @param {Array<Highcharts.Point>} points
 *        The state to set the guide box to.
 *
 * @return {Highcharts.SVGElement}
 *         An SVG element for the guide box, not added to DOM.
 */
Series.prototype.getGuideBox = function (
    points: Array<Point>
): SVGElement {
    const chart = this.chart;
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity,
        changed: (boolean|undefined);

    // Find bounding box of all points
    points.forEach(function (point: Point): void {
        const bBox = (
            point.graphic && point.graphic.getBBox() || point.shapeArgs
        );

        if (bBox) {
            let plotX2;
            const x2 = (point as XRangePoint).x2;
            if (isNumber(x2)) {
                plotX2 = point.series.xAxis.translate(
                    x2,
                    false,
                    false,
                    false,
                    true
                );
            }

            // Avoid a 0 min when some of the points being dragged are
            // completely outside the plot
            const skipBBox = !(bBox.width || bBox.height || bBox.x || bBox.y);

            changed = true;
            minX = Math.min(
                point.plotX || 0,
                plotX2 || 0,
                skipBBox ? Infinity : bBox.x || 0,
                minX
            );
            maxX = Math.max(
                point.plotX || 0,
                plotX2 || 0,
                (bBox.x || 0) + (bBox.width || 0),
                maxX
            );
            minY = Math.min(
                point.plotY || 0,
                skipBBox ? Infinity : bBox.y || 0,
                minY
            );
            maxY = Math.max(
                (bBox.y || 0) + (bBox.height || 0),
                maxY
            );
        }
    });

    return changed ? chart.renderer.rect(
        minX,
        minY,
        maxX - minX,
        maxY - minY
    ) : chart.renderer.g();
};


/**
 * On point mouse out. Hide drag handles, depending on state.
 *
 * @private
 * @function mouseOut
 * @param {Highcharts.Point} point
 *        The point mousing out of.
 */
function mouseOut(point: Point): void {
    const chart = point.series && point.series.chart,
        dragDropData = chart && chart.dragDropData;

    if (
        chart &&
        chart.dragHandles &&
        !(
            dragDropData &&
            (
                dragDropData.isDragging &&
                dragDropData.draggedPastSensitivity ||
                dragDropData.isHoveringHandle === point.id
            )
        )
    ) {
        chart.hideDragHandles();
    }
}


/**
 * Mouseout on resize handle. Handle states, and possibly run mouseOut on point.
 *
 * @private
 * @function onResizeHandleMouseOut
 * @param {Highcharts.Point} point
 *        The point mousing out of.
 */
function onResizeHandleMouseOut(point: Point): void {
    const chart = point.series.chart;

    if (
        chart.dragDropData &&
        point.id === chart.dragDropData.isHoveringHandle
    ) {
        delete chart.dragDropData.isHoveringHandle;
    }
    if (!chart.hoverPoint) {
        mouseOut(point);
    }
}


/**
 * Mousedown on resize handle. Init a drag if the conditions are right.
 *
 * @private
 * @function onResizeHandleMouseDown
 * @param {Highcharts.PointerEventObject} e
 *        The mousedown event.
 * @param {Highcharts.Point} point
 *        The point mousing down on.
 * @param {string} updateProp
 *        The data property this resize handle is attached to for this point.
 */
function onResizeHandleMouseDown(
    e: PointerEvent,
    point: Point,
    updateProp: string
): void {
    const chart = point.series.chart;

    // Ignore if zoom/pan key is pressed
    if (chart.zoomOrPanKeyPressed(e)) {
        return;
    }

    // Prevent zooming
    chart.mouseIsDown = false;

    // We started a drag
    initDragDrop(e, point);
    (chart.dragDropData as any).updateProp =
        (e as Highcharts.PointDragStartEventObject).updateProp = updateProp;
    point.firePointEvent('dragStart', e);

    // Prevent default to avoid point click for dragging too
    e.stopPropagation();
    e.preventDefault();
}


/**
 * Render drag handles on a point - depending on which handles are enabled - and
 * attach events to them.
 *
 * @private
 * @function Highcharts.Point#showDragHandles
 * @return {void}
 */
Point.prototype.showDragHandles = function (): void {
    const point = this,
        series = point.series,
        chart = series.chart,
        { inverted, renderer } = chart,
        options = merge(series.options.dragDrop, point.options.dragDrop);

    // Go through each updateProp and see if we are supposed to create a handle
    // for it.
    objectEach(series.dragDropProps, function (
        val: Highcharts.SeriesDragDropPropsObject,
        key: string
    ): void {
        const handleOptions: Highcharts.DragDropHandleOptionsObject = merge(
                defaultDragHandleOptions,
                val.handleOptions,
                options.dragHandle
            ),
            handleAttrs: SVGAttributes = {
                'class': handleOptions.className,
                'stroke-width': handleOptions.lineWidth,
                fill: handleOptions.color,
                stroke: handleOptions.lineColor
            },
            pathFormatter = handleOptions.pathFormatter || val.handleFormatter,
            handlePositioner = val.handlePositioner,
            // Run validation function on whether or not we allow individual
            // updating of this prop.
            validate = val.validateIndividualDrag ?
                val.validateIndividualDrag(point) : true;
        let pos,
            handle,
            path;

        if (
            val.resize &&
            validate &&
            val.resizeSide &&
            pathFormatter &&
            (
                (options as any)['draggable' + val.axis.toUpperCase()] ||
                (options as any)[val.optionName]
            ) &&
            (options as any)[val.optionName] !== false
        ) {

            // Create group if it doesn't exist
            if (!chart.dragHandles) {
                chart.dragHandles = {
                    group: renderer
                        .g('drag-drop-handles')
                        .add(series.markerGroup || series.group)
                } as any;
            }

            // Store which point this is
            (chart.dragHandles as any).point = point.id;

            // Find position and path of handle
            pos = handlePositioner(point);
            handleAttrs.d = path = pathFormatter(point);
            // Correct left edge value depending on the xAxis' type, #16596
            const minEdge = point.series.xAxis.categories ? -0.5 : 0;
            if (!path || pos.x < minEdge || pos.y < 0) {
                return;
            }

            // If cursor is not set explicitly, use axis direction
            handleAttrs.cursor = handleOptions.cursor ||
                ((val.axis === 'x') !== !!inverted ?
                    'ew-resize' : 'ns-resize');

            // Create and add the handle element if it doesn't exist
            handle = (chart.dragHandles as any)[val.optionName];
            if (!handle) {
                handle = (chart.dragHandles as any)[val.optionName] = renderer
                    .path()
                    .add((chart.dragHandles as any).group);
            }

            // Move and update handle
            handleAttrs.translateX = inverted ?
                series.yAxis.len - pos.y :
                pos.x;
            handleAttrs.translateY = inverted ?
                series.xAxis.len - pos.x :
                pos.y;
            if (inverted) {
                handleAttrs.rotation = -90;
            }
            handle.attr(handleAttrs);

            // Add events
            addEvents(
                handle.element,
                ['touchstart', 'mousedown'],
                function (e: PointerEvent): void {
                    onResizeHandleMouseDown(
                        getNormalizedEvent(e, chart),
                        point,
                        key
                    );
                },
                { passive: false }
            );
            addEvent(
                (chart.dragHandles as any).group.element,
                'mouseover',
                function (): void {
                    chart.dragDropData = chart.dragDropData || ({} as any);
                    (chart.dragDropData as any).isHoveringHandle = point.id;
                }
            );
            addEvents(
                (chart.dragHandles as any).group.element,
                ['touchend', 'mouseout'],
                function (): void {
                    onResizeHandleMouseOut(point);
                }
            );
        }
    });
};


/**
 * Remove the chart's drag handles if they exist.
 *
 * @private
 * @function Highcharts.Chart#hideDragHandles
 * @return {void}
 */
Chart.prototype.hideDragHandles = function (): void {
    const chart = this;

    if (chart.dragHandles) {
        objectEach(chart.dragHandles, function (val, key): void {
            if (key !== 'group' && (val as SVGElement).destroy) {
                (val as SVGElement).destroy();
            }
        });
        if (chart.dragHandles.group && chart.dragHandles.group.destroy) {
            chart.dragHandles.group.destroy();
        }
        delete chart.dragHandles;
    }
};


/**
 * Utility function to count the number of props in an object.
 *
 * @private
 * @function countProps
 *
 * @param {Object} obj
 *        The object to count.
 *
 * @return {number}
 *         Number of own properties on the object.
 */
function countProps(obj: object): number {
    let count = 0;

    for (const p in obj) {
        if (Object.hasOwnProperty.call(obj, p)) {
            count++;
        }
    }
    return count;
}


/**
 * Utility function to get the value of the first prop of an object. (Note that
 * the order of keys in an object is usually not guaranteed.)
 *
 * @private
 * @function getFirstProp
 * @param {Highcharts.Dictionary<T>} obj
 *        The object to count.
 * @return {T}
 *         Value of the first prop in the object.
 * @template T
 */
function getFirstProp<T>(obj: Record<string, T>): (T|undefined) {
    for (const p in obj) {
        if (Object.hasOwnProperty.call(obj, p)) {
            return obj[p];
        }
    }
}


/**
 * Mouseover on a point. Show drag handles if the conditions are right.
 *
 * @private
 * @function mouseOver
 * @param {Highcharts.Point} point
 *        The point mousing over.
 */
function mouseOver(point: Point): void {
    const series = point.series,
        chart = series && series.chart,
        dragDropData = chart && chart.dragDropData,
        is3d = chart && chart.is3d && chart.is3d();

    if (
        chart &&
        !(
            dragDropData &&
            dragDropData.isDragging && // Ignore if dragging a point
            dragDropData.draggedPastSensitivity
        ) &&
        !chart.isDragDropAnimating && // Ignore if animating
        series.options.dragDrop && // No need to compute handles without this
        !is3d // No 3D support
    ) {
        // Hide the handles if they exist on another point already
        if (chart.dragHandles) {
            chart.hideDragHandles();
        }
        point.showDragHandles();
    }
}


/**
 * On container mouse move. Handle drag sensitivity and fire drag event.
 *
 * @private
 * @function mouseMove
 * @param {Highcharts.PointerEventObject} e
 *        The mouse move event.
 * @param {Highcharts.Chart} chart
 *        The chart we are moving across.
 */
function mouseMove(
    e: PointerEvent,
    chart: Chart
): void {
    // Ignore if zoom/pan key is pressed
    if (chart.zoomOrPanKeyPressed(e)) {
        return;
    }

    const dragDropData = chart.dragDropData;
    let point: Point,
        seriesDragDropOpts: Highcharts.DragDropOptionsObject,
        newPoints: Record<string, Highcharts.DragDropPointObject>,
        numNewPoints = 0,
        newPoint: (Highcharts.DragDropPointObject|null|undefined);

    if (dragDropData && dragDropData.isDragging && dragDropData.point.series) {
        point = dragDropData.point;
        seriesDragDropOpts = point.series.options.dragDrop as any;

        // No tooltip for dragging
        e.preventDefault();

        // Update sensitivity test if not passed yet
        if (!dragDropData.draggedPastSensitivity) {
            dragDropData.draggedPastSensitivity = hasDraggedPastSensitivity(
                e, chart, pick(
                    point.options.dragDrop &&
                        point.options.dragDrop.dragSensitivity,
                    seriesDragDropOpts &&
                        seriesDragDropOpts.dragSensitivity,
                    defaultDragSensitivity
                )
            );
        }

        // If we have dragged past dragSensitivity, run the mousemove handler
        // for dragging
        if (dragDropData.draggedPastSensitivity) {
            // Find the new point values from the moving
            dragDropData.newPoints = getNewPoints(dragDropData, e);

            // If we are only dragging one point, add it to the event
            newPoints = dragDropData.newPoints;
            numNewPoints = countProps(newPoints);
            newPoint = numNewPoints === 1 ?
                getFirstProp(newPoints) :
                null;

            // Run the handler
            point.firePointEvent('drag', {
                origin: dragDropData.origin,
                newPoints: dragDropData.newPoints,
                newPoint: newPoint && newPoint.newValues,
                newPointId: newPoint && newPoint.point.id,
                numNewPoints: numNewPoints,
                chartX: e.chartX,
                chartY: e.chartY
            }, function (): void {
                dragMove(e, point);
            });
        }
    }
}


/**
 * On container mouse up. Fire drop event and reset state.
 *
 * @private
 * @function mouseUp
 * @param {Highcharts.PointerEventObject} e
 *        The mouse up event.
 * @param {Highcharts.Chart} chart
 *        The chart we were dragging in.
 */
function mouseUp(
    e: PointerEvent,
    chart: Chart
): void {
    const dragDropData = chart.dragDropData;

    if (
        dragDropData &&
        dragDropData.isDragging &&
        dragDropData.draggedPastSensitivity &&
        dragDropData.point.series
    ) {
        const point = dragDropData.point,
            newPoints: Record<string, Highcharts.DragDropPointObject> =
                dragDropData.newPoints as any,
            numNewPoints = countProps(newPoints),
            newPoint = numNewPoints === 1 ?
                getFirstProp(newPoints) :
                null;

        // Hide the drag handles
        if (chart.dragHandles) {
            chart.hideDragHandles();
        }

        // Prevent default action
        e.preventDefault();
        chart.cancelClick = true;

        // Fire the event, with a default handler that updates the points

        point.firePointEvent('drop', {
            origin: dragDropData.origin,
            chartX: e.chartX,
            chartY: e.chartY,
            newPoints: newPoints,
            numNewPoints: numNewPoints,
            newPoint: newPoint && newPoint.newValues,
            newPointId: newPoint && newPoint.point.id
        } as Partial<Highcharts.PointDropEventObject>, function (): void {
            updatePoints(chart);
        });
    }

    // Reset
    delete chart.dragDropData;

    // Clean up the drag guide box if it exists. This is always added on
    // drag start, even if user is overriding events.
    if (chart.dragGuideBox) {
        chart.dragGuideBox.destroy();
        delete chart.dragGuideBox;
    }
}


/**
 * On container mouse down. Init dragdrop if conditions are right.
 *
 * @private
 * @function mouseDown
 * @param {Highcharts.PointerEventObject} e
 *        The mouse down event.
 * @param {Highcharts.Chart} chart
 *        The chart we are clicking.
 */
function mouseDown(
    e: PointerEvent,
    chart: Chart
): void {
    const dragPoint = chart.hoverPoint,
        dragDropOptions = merge(
            dragPoint && dragPoint.series.options.dragDrop,
            dragPoint && dragPoint.options.dragDrop
        ),
        draggableX = dragDropOptions.draggableX || false,
        draggableY = dragDropOptions.draggableY || false;

    // Reset cancel click
    chart.cancelClick = false;

    // Ignore if:
    if (
        // Option is disabled for the point
        !(draggableX || draggableY) ||
        // Zoom/pan key is pressed
        chart.zoomOrPanKeyPressed(e) ||
        // Dragging an annotation
        chart.hasDraggedAnnotation
    ) {
        return;
    }

    // If we somehow get a mousedown event while we are dragging, cancel
    if (chart.dragDropData && chart.dragDropData.isDragging) {
        mouseUp(e, chart);
        return;
    }

    // If this point is movable, start dragging it
    if (dragPoint && isPointMovable(dragPoint)) {
        chart.mouseIsDown = false; // Prevent zooming
        initDragDrop(e, dragPoint);
        dragPoint.firePointEvent('dragStart', e);
    }
}

/* eslint-disable no-invalid-this */

// Point hover event. We use a short timeout due to issues with coordinating
// point mouseover/out events on dragHandles and points. Particularly arearange
// series are finicky since the markers are not individual points. This logic
// should preferably be improved in the future. Notice that the mouseOut event
// below must have a shorter timeout to ensure event order.
addEvent(Point, 'mouseOver', function (): void {
    const point = this;

    setTimeout(function (): void {
        mouseOver(point);
    }, 12);
});


// Point mouseleave event. See above function for explanation of the timeout.
addEvent(Point, 'mouseOut', function (): void {
    const point = this;

    setTimeout(function (): void {
        if (point.series) {
            mouseOut(point);
        }
    }, 10);
});


// Hide drag handles on a point if it is removed
addEvent(Point, 'remove', function (): void {
    const chart = this.series.chart,
        dragHandles = chart.dragHandles;

    if (dragHandles && dragHandles.point === this.id) {
        chart.hideDragHandles();
    }
});


/**
 * Check whether the zoomKey or panKey is pressed.
 *
 * @private
 * @function Highcharts.Chart#zoomOrPanKeyPressed
 * @param {global.Event} e
 *        A mouse event.
 * @return {boolean}
 *         True if the zoom or pan keys are pressed. False otherwise.
 */
Chart.prototype.zoomOrPanKeyPressed = function (e: Event): boolean {
    // Check whether the panKey and zoomKey are set in chart.userOptions
    const chartOptions = this.options.chart || {},
        panKey = chartOptions.panKey && chartOptions.panKey + 'Key',
        zoomKey = this.zooming.key && this.zooming.key + 'Key';

    return ((e as any)[zoomKey as any] || (e as any)[panKey as any]);
};


/**
 * Add events to document and chart if the chart is draggable.
 *
 * @private
 * @function addDragDropEvents
 * @param {Highcharts.Chart} chart
 *        The chart to add events to.
 */
function addDragDropEvents(chart: Chart): void {
    const container = chart.container,
        doc = H.doc;

    // Only enable if we have a draggable chart
    if (isChartDraggable(chart)) {
        addEvents(
            container,
            ['mousedown', 'touchstart'],
            function (e: PointerEvent): void {
                mouseDown(getNormalizedEvent(e, chart), chart);
            }
        );
        addEvents(
            container,
            ['mousemove', 'touchmove'],
            function (e: PointerEvent): void {
                mouseMove(getNormalizedEvent(e, chart), chart);
            },
            { passive: false }
        );
        addEvent(
            container,
            'mouseleave',
            function (e: PointerEvent): void {
                mouseUp(getNormalizedEvent(e, chart), chart);
            }
        );
        chart.unbindDragDropMouseUp = addEvents(
            doc,
            ['mouseup', 'touchend'],
            function (e: PointerEvent): void {
                mouseUp(getNormalizedEvent(e, chart), chart);
            },
            { passive: false }
        );

        // Add flag to avoid doing this again
        chart.hasAddedDragDropEvents = true;

        // Add cleanup to make sure we don't pollute document
        addEvent(chart, 'destroy', function (): void {
            if (chart.unbindDragDropMouseUp) {
                chart.unbindDragDropMouseUp();
            }
        });
    }
}


// Add event listener to Chart.render that checks whether or not we should add
// dragdrop.
addEvent(Chart, 'render', function (): void {
    // If we don't have dragDrop events, see if we should add them
    if (!this.hasAddedDragDropEvents) {
        addDragDropEvents(this);
    }
});

/* *
 *
 *  API Options
 *
 * */

/**
 * Current drag and drop position.
 *
 * @interface Highcharts.DragDropPositionObject
 *//**
 * Chart x position
 * @name Highcharts.DragDropPositionObject#chartX
 * @type {number}
 *//**
 * Chart y position
 * @name Highcharts.DragDropPositionObject#chartY
 * @type {number}
 *//**
 * Drag and drop guide box.
 * @name Highcharts.DragDropPositionObject#guideBox
 * @type {Highcharts.BBoxObject|undefined}
 *//**
 * Updated point data.
 * @name Highcharts.DragDropPositionObject#points
 * @type {Highcharts.Dictionary<Highcharts.Dictionary<number>>}
 *//**
 * Delta of previous x position.
 * @name Highcharts.DragDropPositionObject#prevdX
 * @type {number|undefined}
 *//**
 * Delta of previous y position.
 * @name Highcharts.DragDropPositionObject#prevdY
 * @type {number|undefined}
 */

/**
 * Function callback to execute while series points are dragged. Return false to
 * stop the default drag action.
 *
 * @callback Highcharts.PointDragCallbackFunction
 *
 * @param {Highcharts.Point} this
 *        Point where the event occured.
 *
 * @param {Highcharts.PointDragEventObject} event
 *        Event arguments.
 */

/**
 * Contains information about a points new values.
 *
 * @interface Highcharts.PointDragDropObject
 *//**
 * New values.
 * @name Highcharts.PointDragDropObject#newValues
 * @type {Highcharts.Dictionary<number>}
 *//**
 * Updated point.
 * @name Highcharts.PointDragDropObject#point
 * @type {Highcharts.Point}
 */

/**
 * Contains common information for a drag event on series points.
 *
 * @interface Highcharts.PointDragEventObject
 *//**
 * New point after drag if only a single one.
 * @name Highcharts.PointDropEventObject#newPoint
 * @type {Highcharts.PointDragDropObject|undefined}
 *//**
 * New point id after drag if only a single one.
 * @name Highcharts.PointDropEventObject#newPointId
 * @type {string|undefined}
 *//**
 * New points during drag.
 * @name Highcharts.PointDragEventObject#newPoints
 * @type {Highcharts.Dictionary<Highcharts.PointDragDropObject>}
 *//**
 * Original data.
 * @name Highcharts.PointDragEventObject#origin
 * @type {Highcharts.DragDropPositionObject}
 *//**
 * Prevent default drag action.
 * @name Highcharts.PointDragEventObject#preventDefault
 * @type {Function}
 *//**
 * Target point that caused the event.
 * @name Highcharts.PointDragEventObject#target
 * @type {Highcharts.Point}
 *//**
 * Event type.
 * @name Highcharts.PointDragEventObject#type
 * @type {"drag"}
 */

/**
 * Function callback to execute when a series point is dragged.
 *
 * @callback Highcharts.PointDragStartCallbackFunction
 *
 * @param {Highcharts.Point} this
 *        Point where the event occured.
 *
 * @param {Highcharts.PointDragStartEventObject} event
 *        Event arguments.
 */

/**
 * Contains common information for a drag event on series point.
 *
 * @interface Highcharts.PointDragStartEventObject
 * @extends global.MouseEvent
 *//**
 * Data property being dragged.
 * @name Highcharts.PointDragStartEventObject#updateProp
 * @type {string|undefined}
 */

/**
 * Function callback to execute when series points are dropped.
 *
 * @callback Highcharts.PointDropCallbackFunction
 *
 * @param {Highcharts.Point} this
 *        Point where the event occured.
 *
 * @param {Highcharts.PointDropEventObject} event
 *        Event arguments.
 */

/**
 * Contains common information for a drop event on series points.
 *
 * @interface Highcharts.PointDropEventObject
 *//**
 * New point after drop if only a single one.
 * @name Highcharts.PointDropEventObject#newPoint
 * @type {Highcharts.PointDragDropObject|undefined}
 *//**
 * New point id after drop if only a single one.
 * @name Highcharts.PointDropEventObject#newPointId
 * @type {string|undefined}
 *//**
 * New points after drop.
 * @name Highcharts.PointDropEventObject#newPoints
 * @type {Highcharts.Dictionary<Highcharts.PointDragDropObject>}
 *//**
 * Number of new points.
 * @name Highcharts.PointDropEventObject#numNewPoints
 * @type {number}
 *//**
 * Original data.
 * @name Highcharts.PointDropEventObject#origin
 * @type {Highcharts.DragDropPositionObject}
 *//**
 * Prevent default drop action.
 * @name Highcharts.PointDropEventObject#preventDefault
 * @type {Function}
 *//**
 * Target point that caused the event.
 * @name Highcharts.PointDropEventObject#target
 * @type {Highcharts.Point}
 *//**
 * Event type.
 * @name Highcharts.PointDropEventObject#type
 * @type {"drop"}
 */

''; // detaches doclets above
