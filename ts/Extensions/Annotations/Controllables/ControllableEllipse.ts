/* *
 *
 * Author: Pawel Lysy
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

import type Annotation from '../Annotation';
import type { AnnotationPointType } from '../AnnotationSeries';
import type { ControllableShapeOptions } from './ControllableOptions';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';

import AxisType from '../../../Core/Axis/AxisType';
import BBoxObject from '../../../Core/Renderer/BBoxObject';
import Controllable from './Controllable.js';
import ControllablePath from './ControllablePath.js';
import MockPointOptions from '../MockPointOptions';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { defined, merge } = OH;

/* *
 *
 *  Declarations
 *
 * */

interface EllipseShapeOptions extends ControllableShapeOptions {
    yAxis: number;
    xAxis: number;
    ry: number;
}

interface EllipseShapeSVGOptions {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    angle: number;
}

interface ReferencePointsOptions {
    x: number;
    y: number;
}

/* *
 *
 *  Class
 *
 * */

/**
 * A controllable ellipse class.
 *
 * @requires modules/annotations
 *
 * @private
 * @class
 * @name Highcharts.AnnotationControllableEllipse
 *
 * @param {Highcharts.Annotation} annotation an annotation instance
 * @param {Highcharts.AnnotationsShapeOptions} options a shape's options
 * @param {number} index of the Ellipse
 */
class ControllableEllipse extends Controllable {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A map object which allows to map options attributes to element
     * attributes.
     *
     * @name Highcharts.AnnotationControllableEllipse.attrsMap
     * @type {Highcharts.Dictionary<string>}
     */
    public static attrsMap = merge(ControllablePath.attrsMap, {
        ry: 'ry'
    });

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        annotation: Annotation,
        options: EllipseShapeOptions,
        index: number
    ) {
        super(annotation, options, index, 'shape');
    }

    /* *
     *
     *  Properties
     *
     * */

    public type = 'ellipse';

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public init(
        annotation: Annotation,
        options: EllipseShapeOptions,
        index: number
    ): void {
        if (defined(options.yAxis)) {
            (options.points as Array<MockPointOptions>).forEach(
                (point): void => {
                    point.yAxis = options.yAxis;
                }
            );
        }

        if (defined(options.xAxis)) {
            (options.points as Array<MockPointOptions>).forEach(
                (point): void => {
                    point.xAxis = options.xAxis;
                }
            );
        }

        super.init(annotation, options, index);
    }

    /**
     * Render the element
     * @private
     * @param parent
     *        Parent SVG element.
     */
    public render(parent: SVGElement): void {
        this.graphic = this.annotation.chart.renderer.createElement('ellipse')
            .attr(this.attrsFromOptions(this.options))
            .add(parent);

        super.render();
    }

    /**
     * Translate the points. Mostly used to handle dragging of the ellipse.
     * @private
     */
    public translate(dx: number, dy: number): void {
        super.translateShape(dx, dy, true);
    }

    /**
     * Get the distance from the line to the point.
     * @private
     * @param point1
     *        First point which is on the line
     * @param point2
     *        Second point
     * @param x0
     *        Point's x value from which you want to calculate the distance from
     * @param y0
     *        Point's y value from which you want to calculate the distance from
     */
    public getDistanceFromLine(
        point1: ReferencePointsOptions,
        point2: ReferencePointsOptions,
        x0: number,
        y0: number
    ): number {
        return Math.abs(
            (point2.y - point1.y) * x0 - (point2.x - point1.x) * y0 +
            point2.x * point1.y - point2.y * point1.x
        ) / Math.sqrt(
            (point2.y - point1.y) * (point2.y - point1.y) +
            (point2.x - point1.x) * (point2.x - point1.x)
        );
    }

    /**
     * The fuction calculates the svg attributes of the ellipse, and returns all
     * parameters neccessary to draw the ellipse.
     * @private
     * @param position
     *        Absolute position of the first point in points array
     * @param position2
     *        Absolute position of the second point in points array
     */
    public getAttrs(
        position: BBoxObject,
        position2: BBoxObject
    ): EllipseShapeSVGOptions {
        const x1 = position.x,
            y1 = position.y,
            x2 = position2.x,
            y2 = position2.y,
            cx = (x1 + x2) / 2,
            cy = (y1 + y2) / 2,
            rx = Math.sqrt(
                (x1 - x2) * (x1 - x2) / 4 + (y1 - y2) * (y1 - y2) / 4
            ),
            tan = (y2 - y1) / (x2 - x1);

        let angle = Math.atan(tan) * 180 / Math.PI;

        if (cx < x1) {
            angle += 180;
        }

        const ry = this.getRY();

        return { cx, cy, rx, ry, angle };
    }

    /**
     * Get the value of minor radius of the ellipse.
     * @private
     */
    public getRY(): number {
        const yAxis = this.getYAxis();
        return defined(yAxis) ?
            Math.abs(yAxis.toPixels(this.options.ry) - yAxis.toPixels(0)) :
            this.options.ry;
    }

    /**
     * Get the yAxis object to which the ellipse is pinned.
     * @private
     */
    public getYAxis(): AxisType {
        const yAxisIndex = (this.options as EllipseShapeOptions).yAxis;
        return this.chart.yAxis[yAxisIndex];
    }

    /**
     * Get the absolute coordinates of the MockPoint
     * @private
     * @param point
     *        MockPoint that is added through options
     */
    public getAbsolutePosition(
        point: AnnotationPointType
    ): BBoxObject {
        return this.anchor(point).absolutePosition;
    }

    /**
     * Redraw the element
     * @private
     * @param animation
     *        Display an annimation
     */
    public redraw(animation?: boolean): void {

        if (this.graphic) {
            const position = this.getAbsolutePosition(this.points[0]),
                position2 = this.getAbsolutePosition(this.points[1]),
                attrs = this.getAttrs(position, position2);

            if (position) {
                this.graphic[animation ? 'animate' : 'attr']({
                    cx: attrs.cx,
                    cy: attrs.cy,
                    rx: attrs.rx,
                    ry: attrs.ry,
                    rotation: attrs.angle,
                    rotationOriginX: attrs.cx,
                    rotationOriginY: attrs.cy
                });
            } else {
                this.graphic.attr({
                    x: 0,
                    y: -9e9
                });
            }

            this.graphic.placed = Boolean(position);
        }

        super.redraw(animation);
    }

    /**
     * Set the radius Y.
     * @private
     * @param {number} ry
     *        A radius in y direction to be set
     */
    public setYRadius(ry: number): void {
        const shapes = this.annotation.userOptions.shapes;

        this.options.ry = ry;

        if (shapes && shapes[0]) {
            shapes[0].ry = ry;
            shapes[0].ry = ry;
        }
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface ControllableEllipse {
    collection: 'shapes';
    itemType: 'shape'
    options: EllipseShapeOptions;
}

/* *
 *
 *  Registry
 *
 * */

declare module './ControllableType' {
    interface ControllableShapeTypeRegistry {
        ellipse: typeof ControllableEllipse;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ControllableEllipse;
