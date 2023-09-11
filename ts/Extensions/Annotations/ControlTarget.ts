/* *
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
import type { AnnotationPointType } from './AnnotationSeries';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type Controllable from './Controllables/Controllable';
import type ControlTargetOptions from './ControlTargetOptions';
import type MockPointOptions from './MockPointOptions';

import ControlPoint from './ControlPoint.js';
import MockPoint from './MockPoint.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique,
    splat
} = AH;
const { isObject, isString } = TC;
const { merge } = OH;

/* *
 *
 *  Composition Interface
 *
 * */

interface ControlTarget {
    annotation?: Annotation;
    chart: AnnotationChart;
    controlPoints: Array<ControlPoint>;
    options: ControlTargetOptions;
    points: Array<AnnotationPointType>;
    addControlPoints(): void;
    anchor(point: AnnotationPointType): ControlTarget.Anchor;
    destroyControlTarget(): void;
    getPointsOptions(): Array<MockPointOptions>;
    linkPoints(): (Array<AnnotationPointType>|undefined);
    point(
        pointOptions: (string|Function|MockPoint|MockPointOptions),
        point: (AnnotationPointType|null)
    ): (AnnotationPointType|null);
    redrawControlPoints(animation?: boolean): void;
    renderControlPoints(): void;
    transform(
        transformation: string,
        cx: (number|null),
        cy: (number|null),
        p1: number,
        p2?: number
    ): void;
    transformPoint(
        transformation: string,
        cx: (number|null),
        cy: (number|null),
        p1: number,
        p2: (number|undefined),
        i: number
    ): void;
    translate(dx: number, dy: number): void;
    translatePoint(dx: number, dy: number, i: number): void;
}

/* *
 *
 *  Composition Namespace
 *
 * */

namespace ControlTarget {

    /* *
     *
     *  Declarations
     *
     * */

    export interface Anchor {
        absolutePosition: BBoxObject;
        relativePosition: BBoxObject;
    }

    export type Class = (typeof Annotation|typeof Controllable);

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
     * Add control points.
     * @private
     */
    function addControlPoints(
        this: ControlTarget
    ): void {
        const controlPoints = this.controlPoints,
            controlPointsOptions = this.options.controlPoints || [];

        controlPointsOptions.forEach((controlPointOptions, i): void => {
            const options = merge(
                this.options.controlPointOptions,
                controlPointOptions
            );

            if (!options.index) {
                options.index = i;
            }

            controlPointsOptions[i] = options;

            controlPoints.push(new ControlPoint(
                this.chart,
                this,
                options
            ));
        });
    }

    /**
     * Returns object which denotes anchor position - relative and absolute.
     * @private
     * @param {Highcharts.AnnotationPointType} point
     * An annotation point.
     *
     * @return {Highcharts.AnnotationAnchorObject}
     * An annotation anchor.
     */
    function anchor(
        this: ControlTarget,
        point: AnnotationPointType
    ): Anchor {
        const plotBox = point.series.getPlotBox(),
            chart = point.series.chart,
            box = point.mock ?
                point.toAnchor() :
                chart.tooltip &&
                chart.tooltip.getAnchor.call({
                    chart: point.series.chart
                }, point) ||
                [0, 0, 0, 0],
            anchor = {
                x: box[0] + (this.options.x || 0),
                y: box[1] + (this.options.y || 0),
                height: box[2] || 0,
                width: box[3] || 0
            };

        return {
            relativePosition: anchor,
            absolutePosition: merge(anchor, {
                x: anchor.x + (
                    point.mock ? plotBox.translateX : chart.plotLeft
                ),
                y: anchor.y + (point.mock ? plotBox.translateY : chart.plotTop)
            })
        };
    }

    /**
     * Adds shared functions to be used with targets of ControlPoint.
     * @private
     */
    export function compose(
        ControlTargetClass: Class
    ): void {

        if (pushUnique(composedMembers, ControlTargetClass)) {
            merge(true, ControlTargetClass.prototype, {
                addControlPoints,
                anchor,
                destroyControlTarget,
                getPointsOptions,
                linkPoints,
                point,
                redrawControlPoints,
                renderControlPoints,
                transform,
                transformPoint,
                translate,
                translatePoint
            });
        }

    }

    /**
     * Destroy control points.
     * @private
     */
    function destroyControlTarget(
        this: ControlTarget
    ): void {

        this.controlPoints.forEach(
            (controlPoint): void => controlPoint.destroy()
        );

        this.chart = null as any;
        this.controlPoints = null as any;
        this.points = null as any;
        this.options = null as any;

        if (this.annotation) {
            this.annotation = null as any;
        }
    }

    /**
     * Get the points options.
     * @private
     * @return {Array<Highcharts.PointOptionsObject>}
     * An array of points' options.
     */
    function getPointsOptions(
        this: ControlTarget
    ): Array<MockPointOptions> {
        const options = this.options;

        return (
            options.points ||
            (options.point && splat(options.point))
        ) as any;
    }

    /**
     * Find point-like objects based on points options.
     * @private
     * @return {Array<Annotation.PointLike>}
     *         An array of point-like objects.
     */
    function linkPoints(
        this: ControlTarget
    ): (Array<AnnotationPointType>|undefined) {
        const pointsOptions = this.getPointsOptions(),
            points = this.points,
            len = (pointsOptions && pointsOptions.length) || 0;

        let i: number,
            point: (AnnotationPointType|null);

        for (i = 0; i < len; i++) {
            point = this.point(pointsOptions[i], points[i]);

            if (!point) {
                points.length = 0;

                return;
            }

            if (point.mock) {
                point.refresh();
            }

            points[i] = point;
        }

        return points;
    }

    /**
     * Map point's options to a point-like object.
     * @private
     * @param {string|Function|Highcharts.AnnotationMockPointOptionsObject|Highcharts.AnnotationPointType} pointOptions
     *        Point's options.
     * @param {Highcharts.AnnotationPointType} point
     *        A point-like instance.
     * @return {Highcharts.AnnotationPointType|null}
     *         If the point is found/set returns this point, otherwise null
     */
    function point(
        this: ControlTarget,
        pointOptions: (string|Function|MockPoint|MockPointOptions),
        point: (AnnotationPointType|null)
    ): (AnnotationPointType|null) {
        if (pointOptions && (pointOptions as MockPointOptions).series) {
            return pointOptions as any;
        }

        if (!point || point.series === null) {
            if (isObject(pointOptions)) {
                point = new MockPoint(
                    this.chart,
                    this,
                    pointOptions as MockPointOptions
                );
            } else if (isString(pointOptions)) {
                point = (this.chart.get(pointOptions) as any) || null;
            } else if (typeof pointOptions === 'function') {
                const pointConfig: (MockPoint|MockPointOptions) =
                    pointOptions.call(point, this);

                point = pointConfig.series ?
                    pointConfig :
                    new MockPoint(
                        this.chart,
                        this,
                        pointOptions
                    );
            }
        }

        return point;
    }

    /**
     * Redraw control points.
     * @private
     */
    function redrawControlPoints(
        this: ControlTarget,
        animation?: boolean
    ): void {
        this.controlPoints.forEach(
            (controlPoint): void => controlPoint.redraw(animation)
        );
    }

    /**
     * Render controll points.
     * @private
     */
    function renderControlPoints(
        this: ControlTarget
    ): void {
        this.controlPoints.forEach(
            (controlPoint): void => controlPoint.render()
        );
    }

    /**
     * Transform control points with a specific transformation.
     * @private
     * @param {string} transformation
     *        A transformation name
     * @param {number|null} cx
     *        Origin x transformation
     * @param {number|null} cy
     *        Origin y transformation
     * @param {number} p1
     *        Param for the transformation
     * @param {number} [p2]
     *        Param for the transformation
     */
    function transform(
        this: ControlTarget,
        transformation: string,
        cx: (number|null),
        cy: (number|null),
        p1: number,
        p2?: number
    ): void {
        if (this.chart.inverted) {
            const temp = cx;

            cx = cy;
            cy = temp;
        }

        this.points.forEach((_point, i): void => (
            this.transformPoint(transformation, cx, cy, p1, p2, i)
        ), this);
    }

    /**
     * Transform a point with a specific transformation
     * If a transformed point is a real point it is replaced with
     * the mock point.
     * @private
     * @param {string} transformation
     *        A transformation name
     * @param {number|null} cx
     *        Origin x transformation
     * @param {number|null} cy
     *        Origin y transformation
     * @param {number} p1
     *        Param for the transformation
     * @param {number|undefined} p2
     *        Param for the transformation
     * @param {number} i
     *        Index of the point
     */
    function transformPoint(
        this: ControlTarget,
        transformation: string,
        cx: (number|null),
        cy: (number|null),
        p1: number,
        p2: (number|undefined),
        i: number
    ): void {
        let point = this.points[i];

        if (!point.mock) {
            point = this.points[i] = MockPoint.fromPoint(point);
        }

        (point as any)[transformation](cx, cy, p1, p2);
    }

    /**
     * Translate control points.
     * @private
     * @param {number} dx
     *        Translation for x coordinate
     * @param {number} dy
     *        Translation for y coordinate
     **/
    function translate(
        this: ControlTarget,
        dx: number,
        dy: number
    ): void {
        this.transform('translate', null, null, dx, dy);
    }

    /**
     * Translate a specific control point.
     * @private
     * @param {number} dx
     *        Translation for x coordinate
     * @param {number} dy
     *        Translation for y coordinate
     * @param {number} i
     *        Index of the point
     **/
    function translatePoint(
        this: ControlTarget,
        dx: number,
        dy: number,
        i: number
    ): void {
        this.transformPoint('translate', null, null, dx, dy, i);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ControlTarget;
