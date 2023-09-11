/* *
 *
 *  Networkgraph series
 *
 *  (c) 2010-2021 Paweł Fus
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

import type Chart from '../Core/Chart/Chart';
import type Point from '../Core/Series/Point';
import type PointerEvent from '../Core/PointerEvent';
import type ReingoldFruchtermanLayout from './Networkgraph/ReingoldFruchtermanLayout';
import type Series from '../Core/Series/Series';
import type SeriesOptions from '../Core/Series/SeriesOptions';

import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { addEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

export interface DragNodesChart extends Chart {
    graphLayoutsLookup: Array<ReingoldFruchtermanLayout>;
    hoverPoint: DragNodesPoint;
}

export interface DragNodesPoint extends Point {
    fixedPosition?: Record<string, number>;
    hasDragged?: boolean;
    inDragMode?: boolean;
    series: DragNodesSeries;
}

export interface DragNodesSeries extends Series {
    chart: DragNodesChart;
    data: Array<DragNodesPoint>;
    hasDraggableNodes?: boolean;
    layout: ReingoldFruchtermanLayout;
    options: DragNodesSeriesOptions;
    points: Array<DragNodesPoint>;
    onMouseDown(
        this: DragNodesSeries,
        point: Point,
        event: Event
    ): void;
    onMouseMove(
        this: DragNodesSeries,
        point: DragNodesPoint,
        event: PointerEvent
    ): void;
    onMouseUp(
        this: DragNodesSeries,
        point: DragNodesPoint,
        event?: PointerEvent
    ): void;
    redrawHalo(
        point: DragNodesPoint
    ): void;
}

export interface DragNodesSeriesOptions extends SeriesOptions {
    draggable?: boolean;
    fixedDraggable?: boolean;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart
): void {

    if (pushUnique(composedMembers, ChartClass)) {
        addEvent(ChartClass, 'load', onChartLoad);
    }

}

/**
 * Draggable mode:
 * @private
 */
function onChartLoad(
    this: Chart
): void {
    const chart = this as DragNodesChart;

    let mousedownUnbinder: Function,
        mousemoveUnbinder: Function,
        mouseupUnbinder: Function;

    if (chart.container) {
        mousedownUnbinder = addEvent(
            chart.container,
            'mousedown',
            (event: PointerEvent): void => {
                const point = chart.hoverPoint;
                if (
                    point &&
                    point.series &&
                    point.series.hasDraggableNodes &&
                    point.series.options.draggable
                ) {
                    point.series.onMouseDown(point, event);
                    mousemoveUnbinder = addEvent(
                        chart.container,
                        'mousemove',
                        (e: PointerEvent): void => (
                            point &&
                            point.series &&
                            point.series.onMouseMove(point, e)
                        )
                    );
                    mouseupUnbinder = addEvent(
                        chart.container.ownerDocument,
                        'mouseup',
                        (e: PointerEvent): void => {
                            mousemoveUnbinder();
                            mouseupUnbinder();
                            return point &&
                                point.series &&
                                point.series.onMouseUp(point, e);
                        }
                    );
                }
            }
        );
    }

    addEvent(chart, 'destroy', function (): void {
        mousedownUnbinder();
    });
}

/**
 * Mouse down action, initializing drag&drop mode.
 *
 * @private
 * @param {Highcharts.Point} point
 *        The point that event occured.
 * @param {Highcharts.PointerEventObject} event
 *        Browser event, before normalization.
 */
function onMouseDown(
    this: DragNodesSeries,
    point: DragNodesPoint,
    event: PointerEvent
): void {
    const normalizedEvent = this.chart.pointer.normalize(event);

    point.fixedPosition = {
        chartX: normalizedEvent.chartX,
        chartY: normalizedEvent.chartY,
        plotX: point.plotX,
        plotY: point.plotY
    } as Record<string, number>;

    point.inDragMode = true;
}

/**
 * Mouse move action during drag&drop.
 *
 * @private
 *
 * @param {global.Event} event
 *        Browser event, before normalization.
 * @param {Highcharts.Point} point
 *        The point that event occured.
 *
 */
function onMouseMove(
    this: DragNodesSeries,
    point: DragNodesPoint,
    event: PointerEvent
): void {
    if (point.fixedPosition && point.inDragMode) {
        const series = this,
            chart = series.chart,
            normalizedEvent = chart.pointer.normalize(event),
            diffX = point.fixedPosition.chartX - normalizedEvent.chartX,
            diffY = point.fixedPosition.chartY - normalizedEvent.chartY,
            graphLayoutsLookup = chart.graphLayoutsLookup;

        let newPlotX,
            newPlotY;

        // At least 5px to apply change (avoids simple click):
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
            newPlotX = point.fixedPosition.plotX - diffX;
            newPlotY = point.fixedPosition.plotY - diffY;

            if (chart.isInsidePlot(newPlotX, newPlotY)) {
                point.plotX = newPlotX;
                point.plotY = newPlotY;
                point.hasDragged = true;

                this.redrawHalo(point);

                graphLayoutsLookup.forEach((layout): void => {
                    layout.restartSimulation();
                });
            }
        }
    }
}

/**
 * Mouse up action, finalizing drag&drop.
 *
 * @private
 * @param {Highcharts.Point} point
 *        The point that event occured.
 */
function onMouseUp(
    this: DragNodesSeries,
    point: DragNodesPoint,
    _event?: PointerEvent
): void {
    if (point.fixedPosition) {
        if (point.hasDragged) {
            if (this.layout.enableSimulation) {
                this.layout.start();
            } else {
                this.chart.redraw();
            }
        }
        point.inDragMode = point.hasDragged = false;
        if (!this.options.fixedDraggable) {
            delete point.fixedPosition;
        }
    }
}

/**
 * Redraw halo on mousemove during the drag&drop action.
 *
 * @private
 * @param {Highcharts.Point} point
 *        The point that should show halo.
 */
function redrawHalo(
    this: DragNodesSeries,
    point: DragNodesPoint
): void {
    if (point && this.halo) {
        this.halo.attr({
            d: point.haloPath(
                (this.options.states as any).hover.halo.size
            ) as any
        });
    }
}


/* *
 *
 *  Default Export
 *
 * */

const DragNodesComposition = {
    compose,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    redrawHalo
};

export default DragNodesComposition;
