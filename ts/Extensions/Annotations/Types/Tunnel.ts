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

import type { AnnotationEventObject } from '../EventEmitter';
import type Controllable from '../Controllables/Controllable';
import type { ControlPointOptionsObject } from '../ControlPointOptions';
import type MockPointOptions from '../MockPointOptions';
import type PositionObject from '../../../Core/Renderer/PositionObject';

import Annotation from '../Annotation.js';
import ControlPoint from '../ControlPoint.js';
import CrookedLine from './CrookedLine.js';
import MockPoint from '../MockPoint.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function getSecondCoordinate(
    p1: PositionObject,
    p2: PositionObject,
    x: number
): number {
    return (p2.y - p1.y) / (p2.x - p1.x) * (x - p1.x) + p1.y;
}

/* *
 *
 *  Class
 *
 * */

class Tunnel extends CrookedLine {

    /* *
     *
     * Functions
     *
     * */

    public getPointsOptions(): Array<MockPointOptions> {
        const pointsOptions = CrookedLine.prototype.getPointsOptions.call(this);

        pointsOptions[2] = this.heightPointOptions(pointsOptions[1]);
        pointsOptions[3] = this.heightPointOptions(pointsOptions[0]);

        return pointsOptions;
    }

    public getControlPointsOptions(): Array<MockPointOptions> {
        return this.getPointsOptions().slice(0, 2);
    }

    public heightPointOptions(
        pointOptions: MockPointOptions
    ): MockPointOptions {
        const heightPointOptions = merge(pointOptions),
            typeOptions = this.options.typeOptions as Tunnel.TypeOptions;

        heightPointOptions.y += typeOptions.height;

        return heightPointOptions;
    }

    public addControlPoints(): void {
        CrookedLine.prototype.addControlPoints.call(this);

        const options = this.options,
            typeOptions = options.typeOptions as Tunnel.TypeOptions,
            controlPoint = new ControlPoint(
                this.chart,
                this as any,
                merge(
                    options.controlPointOptions,
                    typeOptions.heightControlPoint
                ),
                2
            );

        this.controlPoints.push(controlPoint);

        typeOptions.heightControlPoint = controlPoint.options;
    }

    public addShapes(): void {
        this.addLine();
        this.addBackground();
    }

    public addLine(): void {
        const line = this.initShape(
            merge(
                this.options.typeOptions.line,
                {
                    type: 'path',
                    points: [
                        this.points[0],
                        this.points[1],
                        function (target: any): MockPointOptions {
                            const pointOptions = MockPoint.pointToOptions(
                                target.annotation.points[2]
                            );

                            pointOptions.command = 'M';

                            return pointOptions;
                        },
                        this.points[3]
                    ]
                }
            ),
            0
        );

        this.options.typeOptions.line = line.options;
    }

    public addBackground(): void {
        const background = this.initShape(
            merge(
                this.options.typeOptions.background,
                {
                    type: 'path',
                    points: this.points.slice()
                }
            ),
            1
        );

        this.options.typeOptions.background = background.options;
    }

    /**
     * Translate start or end ("left" or "right") side of the tunnel.
     * @private
     * @param {number} dx
     * the amount of x translation
     * @param {number} dy
     * the amount of y translation
     * @param {boolean} [end]
     * whether to translate start or end side
     */
    public translateSide(dx: number, dy: number, end?: boolean): void {
        const topIndex = Number(end),
            bottomIndex = topIndex === 0 ? 3 : 2;

        this.translatePoint(dx, dy, topIndex);
        this.translatePoint(dx, dy, bottomIndex);
    }

    /**
     * Translate height of the tunnel.
     * @private
     * @param {number} dh
     * the amount of height translation
     */
    public translateHeight(dh: number): void {
        this.translatePoint(0, dh, 2);
        this.translatePoint(0, dh, 3);

        this.options.typeOptions.height = (this.points[3].y as any) -
            (this.points[0].y as any);
        this.userOptions.typeOptions.height = this.options.typeOptions.height;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Tunnel {
    defaultOptions: CrookedLine['defaultOptions'];
}

Tunnel.prototype.defaultOptions = merge(
    CrookedLine.prototype.defaultOptions,
    /**
     * A tunnel annotation.
     *
     * @extends annotations.crookedLine
     * @sample highcharts/annotations-advanced/tunnel/
     *         Tunnel
     * @product highstock
     * @optionparent annotations.tunnel
     */
    {
        typeOptions: {
            /**
             * Background options.
             *
             * @type {Object}
             * @excluding height, point, points, r, type, width, markerEnd,
             *            markerStart
             */
            background: {
                fill: 'rgba(130, 170, 255, 0.4)',
                strokeWidth: 0
            },
            line: {
                strokeWidth: 1
            },
            /**
             * The height of the annotation in terms of yAxis.
             */
            height: -2,


            /**
             * Options for the control point which controls
             * the annotation's height.
             *
             * @extends annotations.crookedLine.controlPointOptions
             * @excluding positioner, events
             */
            heightControlPoint: {
                positioner: function (
                    this: ControlPoint,
                    target: Controllable
                ): PositionObject {
                    const startXY = MockPoint.pointToPixels(target.points[2]),
                        endXY = MockPoint.pointToPixels(target.points[3]),
                        x = (startXY.x + endXY.x) / 2;

                    return {
                        x: x - this.graphic.width / 2,
                        y: getSecondCoordinate(startXY, endXY, x) -
                        this.graphic.height / 2
                    };
                },
                events: {
                    drag: function (
                        this: Tunnel,
                        e: AnnotationEventObject,
                        target: Tunnel
                    ): void {
                        if (
                            target.chart.isInsidePlot(
                                e.chartX - target.chart.plotLeft,
                                e.chartY - target.chart.plotTop,
                                {
                                    visiblePlotOnly: true
                                }
                            )
                        ) {
                            target.translateHeight(
                                this.mouseMoveToTranslation(e).y
                            );

                            target.redraw(false);
                        }
                    }
                }
            }
        },

        /**
         * @extends annotations.crookedLine.controlPointOptions
         * @excluding positioner, events
         */
        controlPointOptions: {
            events: {
                drag: function (
                    this: Tunnel,
                    e: AnnotationEventObject,
                    target: Tunnel
                ): void {
                    if (
                        target.chart.isInsidePlot(
                            e.chartX - target.chart.plotLeft,
                            e.chartY - target.chart.plotTop,
                            {
                                visiblePlotOnly: true
                            }
                        )
                    ) {
                        const translation = this.mouseMoveToTranslation(e);

                        target.translateSide(
                            translation.x,
                            translation.y,
                            !!this.index
                        );

                        target.redraw(false);
                    }
                }
            }
        }
    }
);

/* *
 *
 *  Class Namespace
 *
 * */

namespace Tunnel {
    export interface Options extends CrookedLine.Options {
        typeOptions: TypeOptions;
    }
    export interface TypeOptions extends CrookedLine.TypeOptions {
        height: number;
        heightControlPoint: ControlPointOptionsObject;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType'{
    interface AnnotationTypeRegistry {
        tunnel: typeof Tunnel;
    }
}

Annotation.types.tunnel = Tunnel;

/* *
 *
 *  Default Export
 *
 * */

export default Tunnel;
