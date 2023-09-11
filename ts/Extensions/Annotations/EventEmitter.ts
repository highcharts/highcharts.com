/* *
 *
 *  (c) 2009-2021 Highsoft, Black Label
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

import type Annotation from './Annotation';
import type AnnotationChart from './AnnotationChart';
import type AnnotationOptions from './AnnotationOptions';
import type { AnnotationPointType } from './AnnotationSeries';
import type {
    ControllableLabelType,
    ControllableShapeType
} from './Controllables/ControllableType';
import type { ControlPointOptionsObject } from './ControlPointOptions';
import type ControlTarget from './ControlTarget';
import type { CursorValue } from '../../Core/Renderer/CSSObject';
import type DOMElementType from '../../Core/Renderer/DOMElementType';
import type EventCallback from '../../Core/EventCallback';
import type PointerEvent from '../../Core/PointerEvent';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import H from '../../Core/Globals.js';
const {
    doc,
    isTouchDevice
} = H;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { objectEach } = OH;
const { addEvent, fireEvent, removeEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

export interface AnnotationEventObject extends PointerEvent {
    prevChartX: number;
    prevChartY: number;
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 */
abstract class EventEmitter {

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Add emitter events.
     * @private
     */
    public addEvents(): void {
        const emitter = this,
            addMouseDownEvent = function (element: DOMElementType): void {
                addEvent(
                    element,
                    isTouchDevice ? 'touchstart' : 'mousedown',
                    (e: AnnotationEventObject): void => {
                        emitter.onMouseDown(e);
                    },
                    { passive: false }
                );
            };

        addMouseDownEvent(this.graphic.element);

        (emitter.labels || []).forEach((label): void => {
            if (label.options.useHTML && label.graphic.text) {
                // Mousedown event bound to HTML element (#13070).
                addMouseDownEvent(label.graphic.text.element);
            }
        });

        objectEach(emitter.options.events, (
            event: EventCallback<Annotation>,
            type: string
        ): void => {
            const eventHandler = function (e: PointerEvent): void {
                if (type !== 'click' || !emitter.cancelClick) {
                    (event as any).call(
                        emitter,
                        emitter.chart.pointer.normalize(e),
                        emitter.target
                    );
                }
            };

            if ((emitter.nonDOMEvents || []).indexOf(type) === -1) {
                emitter.graphic.on(type, eventHandler);
            } else {
                addEvent(emitter, type, eventHandler, { passive: false });
            }
        });

        if (emitter.options.draggable) {

            addEvent(emitter, 'drag', emitter.onDrag);

            if (!emitter.graphic.renderer.styledMode) {
                const cssPointer = {
                    cursor: ({
                        x: 'ew-resize',
                        y: 'ns-resize',
                        xy: 'move'
                    } as Record<string, CursorValue>)[
                        emitter.options.draggable
                    ]
                };

                emitter.graphic.css(cssPointer);

                (emitter.labels || []).forEach((label): void => {
                    if (label.options.useHTML && label.graphic.text) {
                        label.graphic.text.css(cssPointer);
                    }
                });
            }
        }

        if (!emitter.isUpdating) {
            fireEvent(emitter, 'add');
        }
    }

    /**
     * Destroy the event emitter.
     */
    public destroy(): void {
        this.removeDocEvents();

        removeEvent(this);

        this.hcEvents = null;
    }

    /**
     * Map mouse move event to the radians.
     * @private
     */
    public mouseMoveToRadians(
        e: AnnotationEventObject,
        cx: number,
        cy: number
    ): number {
        let prevDy = e.prevChartY - cy,
            prevDx = e.prevChartX - cx,
            dy = e.chartY - cy,
            dx = e.chartX - cx,
            temp;

        if (this.chart.inverted) {
            temp = prevDx;
            prevDx = prevDy;
            prevDy = temp;

            temp = dx;
            dx = dy;
            dy = temp;
        }

        return Math.atan2(dy, dx) - Math.atan2(prevDy, prevDx);
    }

    /**
     * Map mouse move to the scale factors.
     * @private
     */
    public mouseMoveToScale(
        e: AnnotationEventObject,
        cx: number,
        cy: number
    ): PositionObject {
        const prevDx = e.prevChartX - cx,
            prevDy = e.prevChartY - cy,
            dx = e.chartX - cx,
            dy = e.chartY - cy;

        let sx = (dx || 1) / (prevDx || 1),
            sy = (dy || 1) / (prevDy || 1);

        if (this.chart.inverted) {
            const temp = sy;
            sy = sx;
            sx = temp;
        }

        return {
            x: sx,
            y: sy
        };
    }

    /**
     * Map mouse move event to the distance between two following events.
     * @private
     */
    public mouseMoveToTranslation(
        e: AnnotationEventObject
    ): PositionObject {
        let dx = e.chartX - e.prevChartX,
            dy = e.chartY - e.prevChartY,
            temp;

        if (this.chart.inverted) {
            temp = dy;
            dy = dx;
            dx = temp;
        }

        return {
            x: dx,
            y: dy
        };
    }

    /**
     * Drag and drop event. All basic annotations should share this
     * capability as well as the extended ones.
     * @private
     */
    public onDrag(
        e: AnnotationEventObject
    ): void {
        if (
            this.chart.isInsidePlot(
                e.chartX - this.chart.plotLeft,
                e.chartY - this.chart.plotTop,
                {
                    visiblePlotOnly: true
                }
            )
        ) {
            const translation = this.mouseMoveToTranslation(e);

            if (this.options.draggable === 'x') {
                translation.y = 0;
            }

            if (this.options.draggable === 'y') {
                translation.x = 0;
            }

            const emitter = this as (ControlTarget&Required<EventEmitter>);

            if (emitter.points.length) {
                emitter.translate(translation.x, translation.y);
            } else {
                emitter.shapes.forEach((shape): void =>
                    shape.translate(translation.x, translation.y)
                );
                emitter.labels.forEach((label): void =>
                    label.translate(translation.x, translation.y)
                );
            }

            this.redraw(false);
        }
    }

    /**
     * Mouse down handler.
     * @private
     */
    public onMouseDown(
        e: AnnotationEventObject
    ): void {

        if (e.preventDefault) {
            e.preventDefault();
        }

        // On right click, do nothing:
        if (e.button === 2) {
            return;
        }

        const emitter = this,
            pointer = emitter.chart.pointer;

        e = pointer.normalize(e);

        let prevChartX = e.chartX,
            prevChartY = e.chartY;

        emitter.cancelClick = false;
        emitter.chart.hasDraggedAnnotation = true;
        emitter.removeDrag = addEvent(
            doc,
            isTouchDevice ? 'touchmove' : 'mousemove',
            function (e: AnnotationEventObject): void {
                emitter.hasDragged = true;

                e = pointer.normalize(e);
                e.prevChartX = prevChartX;
                e.prevChartY = prevChartY;

                fireEvent(emitter, 'drag', e);

                prevChartX = e.chartX;
                prevChartY = e.chartY;
            },
            isTouchDevice ? { passive: false } : void 0
        );
        emitter.removeMouseUp = addEvent(
            doc,
            isTouchDevice ? 'touchend' : 'mouseup',
            function (e: AnnotationEventObject): void {
                // Sometimes the target is the annotation and sometimes its the
                // controllable
                const annotation = pick(
                    emitter.target && emitter.target.annotation,
                    emitter.target
                ) as Annotation;
                if (annotation) {
                    // Keep annotation selected after dragging control point
                    annotation.cancelClick = emitter.hasDragged;
                }

                emitter.cancelClick = emitter.hasDragged;
                emitter.hasDragged = false;
                emitter.chart.hasDraggedAnnotation = false;
                // ControlPoints vs Annotation:
                fireEvent(pick(
                    annotation, // #15952
                    emitter
                ), 'afterUpdate');
                emitter.onMouseUp(e);
            },
            isTouchDevice ? { passive: false } : void 0
        );
    }

    /**
     * Mouse up handler.
     */
    public onMouseUp(
        _e: AnnotationEventObject
    ): void {
        const chart = this.chart,
            annotation = this.target as Annotation || this,
            annotationsOptions = chart.options.annotations,
            index = chart.annotations.indexOf(annotation);

        this.removeDocEvents();

        annotationsOptions[index] = annotation.options;
    }

    abstract redraw(animation?: boolean): void;

    /**
     * Remove emitter document events.
     * @private
     */
    public removeDocEvents(): void {
        if (this.removeDrag) {
            this.removeDrag = this.removeDrag();
        }

        if (this.removeMouseUp) {
            this.removeMouseUp = this.removeMouseUp();
        }
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface EventEmitter {
    cancelClick?: boolean;
    chart: AnnotationChart;
    graphic: SVGElement;
    hasDragged?: boolean;
    hcEvents?: unknown;
    isUpdating?: boolean;
    labels?: Array<ControllableLabelType>;
    nonDOMEvents?: Array<string>;
    options: Partial<(ControlPointOptionsObject|AnnotationOptions)>;
    removeDrag?: Function;
    removeMouseUp?: Function;
    shapes?: Array<ControllableShapeType>;
    target?: ControlTarget;
}

/* *
 *
 *  Default Export
 *
 * */

export default EventEmitter;
