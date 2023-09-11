/* *
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Functions
 *
 * */

import type { AnnotationPointType } from '../AnnotationSeries';
import type { ControllableShapeOptions } from '../Controllables/ControllableOptions';
import type PositionObject from '../../../Core/Renderer/PositionObject';
import type MockPointOptions from '../MockPointOptions';

import Annotation from '../Annotation.js';
import InfinityLine from './InfinityLine.js';
import MockPoint from '../MockPoint.js';

import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
/* *
 *
 *  Class
 *
 * */

class Pitchfork extends InfinityLine {

    /* *
     *
     *  Static Properties
     *
     * */

    public static topLineEdgePoint = Pitchfork.outerLineEdgePoint(1);
    public static bottomLineEdgePoint = Pitchfork.outerLineEdgePoint(0);

    /* *
     *
     *  Static Functions
     *
     * */

    private static outerLineEdgePoint(firstPointIndex: number): Function {
        return function (target: any): PositionObject {
            const annotation: Pitchfork = target.annotation,
                points = annotation.points;

            return Pitchfork.findEdgePoint(
                points[firstPointIndex],
                points[0],
                new MockPoint(
                    annotation.chart,
                    target,
                    annotation.midPointOptions()
                )
            );
        };
    }

    public static findEdgePoint(
        point: AnnotationPointType,
        firstAnglePoint: AnnotationPointType,
        secondAnglePoint?: AnnotationPointType
    ): PositionObject {
        const angle = Math.atan2(
                (
                    (secondAnglePoint as any).plotY -
                    (firstAnglePoint.plotY as any)
                ),
                (secondAnglePoint as any).plotX - (firstAnglePoint.plotX as any)
            ),
            distance = 1e7;

        return {
            x: (point.plotX as any) + distance * Math.cos(angle),
            y: (point.plotY as any) + distance * Math.sin(angle)
        };
    }

    public static middleLineEdgePoint(target: Annotation): PositionObject {
        const annotation: Pitchfork = target.annotation as any,
            points = annotation.points;

        return InfinityLine.findEdgePoint(
            points[0],
            new MockPoint(
                annotation.chart,
                target as any,
                annotation.midPointOptions()
            )
        );
    }

    /* *
     *
     *  Functions
     *
     * */

    public midPointOptions(): MockPointOptions {
        const points = this.points;

        return {
            x: ((points[1].x as any) + (points[2].x as any)) / 2,
            y: ((points[1].y as any) + (points[2].y as any)) / 2,
            xAxis: points[0].series.xAxis,
            yAxis: points[0].series.yAxis
        };
    }

    public addShapes(): void {
        this.addLines();
        this.addBackgrounds();
    }

    public addLines(): void {
        this.initShape({
            type: 'path',
            points: [
                this.points[0],
                Pitchfork.middleLineEdgePoint as any
            ]
        }, 0);

        this.initShape({
            type: 'path',
            points: [
                this.points[1],
                Pitchfork.topLineEdgePoint as any
            ]
        }, 1);

        this.initShape({
            type: 'path',
            points: [
                this.points[2],
                Pitchfork.bottomLineEdgePoint as any
            ]
        }, 2);
    }

    public addBackgrounds(): void {
        const shapes = this.shapes,
            typeOptions = this.options.typeOptions as Pitchfork.TypeOptions;

        const innerBackground = (this.initShape as any)(
            merge(typeOptions.innerBackground, {
                type: 'path',
                points: [
                    function (target: any): MockPointOptions {
                        const annotation = target.annotation,
                            points = annotation.points,
                            midPointOptions = annotation.midPointOptions();

                        return {
                            x: (points[1].x + midPointOptions.x) / 2,
                            y: (points[1].y + midPointOptions.y) / 2,
                            xAxis: midPointOptions.xAxis,
                            yAxis: midPointOptions.yAxis
                        };
                    },
                    shapes[1].points[1],
                    shapes[2].points[1],
                    function (target: any): MockPointOptions {
                        const annotation = target.annotation,
                            points = annotation.points,
                            midPointOptions = annotation.midPointOptions();

                        return {
                            x: (midPointOptions.x + points[2].x) / 2,
                            y: (midPointOptions.y + points[2].y) / 2,
                            xAxis: midPointOptions.xAxis,
                            yAxis: midPointOptions.yAxis
                        };
                    }
                ]
            }),
            3
        );

        const outerBackground = (this.initShape as any)(
            merge(typeOptions.outerBackground, {
                type: 'path',
                points: [
                    this.points[1],
                    shapes[1].points[1],
                    shapes[2].points[1],
                    this.points[2]
                ]
            }),
            4
        );

        typeOptions.innerBackground = innerBackground.options;
        typeOptions.outerBackground = outerBackground.options;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface Pitchfork {
    defaultOptions: InfinityLine['defaultOptions'];
}

Pitchfork.prototype.defaultOptions = merge(
    InfinityLine.prototype.defaultOptions,
    /**
     * A pitchfork annotation.
     *
     * @sample highcharts/annotations-advanced/pitchfork/
     *         Pitchfork
     *
     * @extends      annotations.infinityLine
     * @product      highstock
     * @optionparent annotations.pitchfork
     */
    {
        typeOptions: {
            /**
             * Inner background options.
             *
             * @extends   annotations.crookedLine.shapeOptions
             * @excluding height, r, type, width
             */
            innerBackground: {
                fill: 'rgba(130, 170, 255, 0.4)',
                strokeWidth: 0
            },
            /**
             * Outer background options.
             *
             * @extends   annotations.crookedLine.shapeOptions
             * @excluding height, r, type, width
             */
            outerBackground: {
                fill: 'rgba(156, 229, 161, 0.4)',
                strokeWidth: 0
            }
        }
    }
);

/* *
 *
 *  Class Namespace
 *
 * */

namespace Pitchfork {
    export interface Options extends InfinityLine.Options {
        typeOptions: TypeOptions;
    }
    export interface TypeOptions extends InfinityLine.TypeOptions {
        innerBackground: ControllableShapeOptions;
        outerBackground: ControllableShapeOptions;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType'{
    interface AnnotationTypeRegistry {
        pitchfork: typeof Pitchfork;
    }
}

Annotation.types.pitchfork = Pitchfork;

/* *
 *
 *  Default Export
 *
 * */

export default Pitchfork;
