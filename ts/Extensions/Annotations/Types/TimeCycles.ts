/* *
 *
 *  Authors: Rafal Sebestjanski and Pawel Lysy
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

import type { AnnotationEventObject } from '../EventEmitter';
import type { ControlPointOptionsObject } from '../ControlPointOptions';
import type MockPointOptions from '../MockPointOptions';
import type PositionObject from '../../../Core/Renderer/PositionObject';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';

import Annotation from '../Annotation.js';
import CrookedLine from './CrookedLine.js';
import ControlPoint from '../ControlPoint.js';
import U from '../../../Core/Utilities.js';
const {
    merge,
    isNumber,
    defined
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface TimeCyclesOptions extends CrookedLine.Options {
    xAxis: number;
    yAxis: number;
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Function to create start of the path.
 * @param {number} x x position of the TimeCycles
 * @param {number} y y position of the TimeCycles
 * @return {string} path
 */
function getStartingPath(x: number, y: number): SVGPath.MoveTo {
    return ['M', x, y];
}

/**
 * Function which generates the path of the halfcircle.
 *
 * @param {number} pixelInterval diameter of the circle in pixels
 * @param {number} numberOfCircles number of cricles
 * @param {number} startX x position of the first circle
 * @param {number} y y position of the bottom of the timeCycles
 * @return {string} path
 *
 */
function getCirclePath(
    pixelInterval: number,
    numberOfCircles: number,
    startX: number,
    y: number
): Array<SVGPath.Arc> {
    const path: Array<SVGPath.Arc> = [];

    for (let i = 1; i <= numberOfCircles; i++) {
        path.push([
            'A',
            pixelInterval / 2,
            pixelInterval / 2,
            0,
            1,
            1,
            startX + i * pixelInterval,
            y
        ]);
    }

    return path;
}

/* *
 *
 *  Class
 *
 * */

class TimeCycles extends CrookedLine {

    /* *
     *
     *  Functions
     *
     * */

    public init(
        annotation: Annotation,
        userOptions: TimeCyclesOptions,
        index?: number
    ): void {
        if (defined(userOptions.yAxis)) {
            (userOptions.points as MockPointOptions[]).forEach(
                (point): void => {
                    point.yAxis = userOptions.yAxis;
                }
            );
        }

        if (defined(userOptions.xAxis)) {
            (userOptions.points as MockPointOptions[]).forEach(
                (point): void => {
                    point.xAxis = userOptions.xAxis;
                }
            );
        }
        super.init(annotation, userOptions, index);
    }

    public setPath(): void {
        this.shapes[0].options.d = this.getPath();
    }

    public getPath(): SVGPath {

        return (
            [getStartingPath(this.startX, this.y)] as SVGPath
        ).concat(getCirclePath(
            this.pixelInterval,
            this.numberOfCircles,
            this.startX,
            this.y
        ));
    }

    public addShapes(): void {
        const typeOptions = this.options.typeOptions;
        this.setPathProperties();
        const shape = this.initShape(
            merge(typeOptions.line, {
                type: 'path',
                d: this.getPath(),
                points: this.options.points
            }),
            0
        );

        typeOptions.line = shape.options;
    }

    public addControlPoints(): void {
        const options = this.options,
            typeOptions = options.typeOptions as TimeCycles.TypeOptions;
        options.controlPointOptions.style.cursor = this.chart.inverted ?
            'ns-resize' :
            'ew-resize';

        typeOptions.controlPointOptions.forEach(
            (option: ControlPointOptionsObject): void => {
                const controlPointsOptions = merge(
                    options.controlPointOptions,
                    option
                );
                const controlPoint = new ControlPoint(
                    this.chart,
                    this as any,
                    controlPointsOptions,
                    0
                );
                this.controlPoints.push(controlPoint);
            }
        );
    }

    public setPathProperties(): void {
        const options = this.options.typeOptions,
            points = options.points;

        if (!points) {
            return;
        }

        const point1 = points[0],
            point2 = points[1],
            xAxisNumber = options.xAxis || 0,
            yAxisNumber = options.yAxis || 0,
            xAxis = this.chart.xAxis[xAxisNumber],
            yAxis = this.chart.yAxis[yAxisNumber],
            xValue1 = point1.x,
            yValue = point1.y,
            xValue2 = point2.x;

        if (!xValue1 || !xValue2) {
            return;
        }

        const y = isNumber(yValue) ?
                yAxis.toPixels(yValue) :
                yAxis.top + yAxis.height,
            x = isNumber(xValue1) ? xAxis.toPixels(xValue1) : xAxis.left,
            x2 = isNumber(xValue2) ? xAxis.toPixels(xValue2) : xAxis.left + 30,
            xAxisLength = xAxis.len,
            pixelInterval = Math.round(Math.max(Math.abs(x2 - x), 2)),
            // There can be 2 not full circles on the chart, so add 2.
            numberOfCircles = Math.floor(xAxisLength / pixelInterval) + 2,
            // Calculate where the annotation should start drawing relative to
            // first point.
            pixelShift = (
                Math.floor((x - xAxis.left) / pixelInterval) + 1
            ) * pixelInterval;

        this.startX = x - pixelShift;
        this.y = y;
        this.pixelInterval = pixelInterval;
        this.numberOfCircles = numberOfCircles;
    }

    public redraw(animation?: boolean): void {
        this.setPathProperties();
        this.setPath();
        super.redraw(animation);
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface TimeCycles {
    defaultOptions: CrookedLine['defaultOptions'];
    startX: number;
    pixelInterval: number;
    numberOfCircles: number;
    y: number;
}

TimeCycles.prototype.defaultOptions = merge(
    CrookedLine.prototype.defaultOptions,
    /**
     * The TimeCycles Annotation
     *
     * @sample highcharts/annotations-advanced/time-cycles/
     *         Time Cycles annotation
     *
     * @extends      annotations.crookedLine
     * @product      highstock
     * @exclude      labelOptions
     * @optionparent annotations.timeCycles
     */
    {
        typeOptions: {
            /**
             * @exclude   y
             * @product   highstock
             * @apioption annotations.timeCycles.typeOptions.points
             */

            controlPointOptions: [{
                positioner: function (
                    this: ControlPoint,
                    target: TimeCycles
                ): PositionObject {
                    const point = target.points[0],
                        position = target.anchor(point).absolutePosition;

                    return {
                        x: position.x - this.graphic.width / 2,
                        y: target.y - this.graphic.height
                    };
                },
                events: {
                    drag: function (
                        this: ControlPoint,
                        e: AnnotationEventObject,
                        target: TimeCycles
                    ): void {
                        const position = target.anchor(
                            target.points[0]
                        ).absolutePosition;
                        target.translatePoint(e.chartX - position.x, 0, 0);
                        target.redraw(false);
                    }
                }
            }, {
                positioner: function (
                    this: ControlPoint,
                    target: TimeCycles
                ): PositionObject {
                    const point = target.points[1],
                        position = target.anchor(point).absolutePosition;

                    return {
                        x: position.x - this.graphic.width / 2,
                        y: target.y - this.graphic.height
                    };
                },
                events: {
                    drag: function (
                        this: ControlPoint,
                        e: AnnotationEventObject,
                        target: TimeCycles
                    ): void {
                        const position = target.anchor(
                            target.points[1]
                        ).absolutePosition;
                        target.translatePoint(e.chartX - position.x, 0, 1);
                        target.redraw(false);
                    }
                }
            }]
        }
    }
);

/* *
 *
 *  Class Namespace
 *
 * */

namespace TimeCycles {
    export interface Options extends CrookedLine.Options {
        typeOptions: TypeOptions;
    }
    export interface TypeOptions extends CrookedLine.TypeOptions {
        type: string;
        controlPointOptions: ControlPointOptionsObject[];
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType' {
    interface AnnotationTypeRegistry {
        timeCycles: typeof TimeCycles;
    }
}

Annotation.types.timeCycles = TimeCycles;

/* *
 *
 *  Default Export
 *
 * */

export default TimeCycles;
