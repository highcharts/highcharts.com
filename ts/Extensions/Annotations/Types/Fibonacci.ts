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

import type ColorString from '../../../Core/Color/ColorString';
import type Controllable from '../Controllables/Controllable';
import type MockPointOptions from '../MockPointOptions';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';

import Annotation from '../Annotation.js';
import CrookedLine from './CrookedLine';
import MockPoint from '../MockPoint.js';
import { Palette } from '../../../Core/Color/Palettes.js';
import Tunnel from './Tunnel.js';
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
function createPathDGenerator(
    retracementIndex: number,
    isBackground?: boolean
): Function {
    return function (this: Controllable): SVGPath {
        const annotation = this.annotation as Fibonacci;

        if (!annotation.startRetracements || !annotation.endRetracements) {
            return [];
        }
        const leftTop = this.anchor(
                annotation.startRetracements[retracementIndex]
            ).absolutePosition,
            rightTop = this.anchor(
                annotation.endRetracements[retracementIndex]
            ).absolutePosition,
            d: SVGPath = [
                ['M', Math.round(leftTop.x), Math.round(leftTop.y)],
                ['L', Math.round(rightTop.x), Math.round(rightTop.y)]
            ];

        if (isBackground) {
            const rightBottom = this.anchor(
                annotation.endRetracements[retracementIndex - 1]
            ).absolutePosition;

            const leftBottom = this.anchor(
                annotation.startRetracements[retracementIndex - 1]
            ).absolutePosition;

            d.push(
                ['L', Math.round(rightBottom.x), Math.round(rightBottom.y)],
                ['L', Math.round(leftBottom.x), Math.round(leftBottom.y)]
            );
        }

        return d;
    };
}

/* *
 *
 *  Class
 *
 * */

class Fibonacci extends Tunnel {

    /* *
     *
     *  Static Properties
     *
     * */

    public static levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

    /* *
     *
     *  Properties
     *
     * */

    public endRetracements?: Array<MockPoint>;
    public startRetracements?: Array<MockPoint>;

    /* *
     *
     *  Functions
     *
     * */

    public linkPoints(): undefined {
        super.linkPoints();

        this.linkRetracementsPoints();

        return;
    }

    public linkRetracementsPoints(): void {
        const points = this.points,
            startDiff = (points[0].y as any) - (points[3].y as any),
            endDiff = (points[1].y as any) - (points[2].y as any),
            startX: number = points[0].x as any,
            endX: number = points[1].x as any;

        Fibonacci.levels.forEach((level, i): void => {
            const startRetracement = (points[0].y as any) - startDiff * level,
                endRetracement = (points[1].y as any) - endDiff * level,
                index = this.options.typeOptions.reversed ?
                    (Fibonacci.levels.length - i - 1) : i;

            this.startRetracements = this.startRetracements || [];
            this.endRetracements = this.endRetracements || [];

            this.linkRetracementPoint(
                index,
                startX,
                startRetracement,
                this.startRetracements
            );

            this.linkRetracementPoint(
                index,
                endX,
                endRetracement,
                this.endRetracements
            );
        });
    }

    public linkRetracementPoint(
        pointIndex: number,
        x: number,
        y: number,
        retracements: Array<MockPoint>
    ): void {
        const point = retracements[pointIndex],
            typeOptions = this.options.typeOptions;

        if (!point) {
            retracements[pointIndex] = new MockPoint(
                this.chart,
                this as any,
                {
                    x: x,
                    y: y,
                    xAxis: typeOptions.xAxis,
                    yAxis: typeOptions.yAxis
                }
            );
        } else {
            (point.options as any).x = x;
            (point.options as any).y = y;

            point.refresh();
        }
    }

    public addShapes(): void {
        Fibonacci.levels.forEach(
            function (this: Fibonacci, _level: number, i: number): void {
                const {
                    backgroundColors,
                    lineColor,
                    lineColors
                } = this.options.typeOptions;

                this.initShape({
                    type: 'path',
                    d: createPathDGenerator(i),
                    stroke: lineColors[i] || lineColor
                }, i);

                if (i > 0) {
                    (this.initShape as any)({
                        type: 'path',
                        fill: backgroundColors[i - 1],
                        strokeWidth: 0,
                        d: createPathDGenerator(i, true)
                    });
                }
            },
            this
        );
    }

    public addLabels(): void {
        Fibonacci.levels.forEach(
            function (this: Fibonacci, level: number, i: number): void {
                const options = this.options.typeOptions,
                    label = (this.initLabel as any)(
                        merge(options.labels[i], {
                            point: function (target: any): MockPointOptions {
                                const point = MockPoint.pointToOptions(
                                    target.annotation.startRetracements[i]
                                );

                                return point;
                            },
                            text: level.toString()
                        })
                    );

                options.labels[i] = label.options;
            },
            this
        );
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface Fibonacci {
    defaultOptions: Tunnel['defaultOptions'];
    options: Fibonacci.Options;
}

Fibonacci.prototype.defaultOptions = merge(
    Tunnel.prototype.defaultOptions,
    /**
     * A fibonacci annotation.
     *
     * @sample highcharts/annotations-advanced/fibonacci/
     *         Fibonacci
     *
     * @extends      annotations.crookedLine
     * @product      highstock
     * @optionparent annotations.fibonacci
     */
    {
        typeOptions: {
            /**
             * Whether the annotation levels should be reversed. By default they
             * start from 0 and go to 1.
             *
             * @sample highcharts/annotations-advanced/fibonacci-reversed/
             *         Fibonacci annotation reversed
             *
             * @type {boolean}
             * @apioption annotations.fibonacci.typeOptions.reversed
             */
            reversed: false,

            /**
             * The height of the fibonacci in terms of yAxis.
             */
            height: 2,

            /**
             * An array of background colors:
             * Default to:
             * ```
             * [
             * 'rgba(130, 170, 255, 0.4)',
             * 'rgba(139, 191, 216, 0.4)',
             * 'rgba(150, 216, 192, 0.4)',
             * 'rgba(156, 229, 161, 0.4)',
             * 'rgba(162, 241, 130, 0.4)',
             * 'rgba(169, 255, 101, 0.4)'
             * ]
             * ```
             */
            backgroundColors: [
                'rgba(130, 170, 255, 0.4)',
                'rgba(139, 191, 216, 0.4)',
                'rgba(150, 216, 192, 0.4)',
                'rgba(156, 229, 161, 0.4)',
                'rgba(162, 241, 130, 0.4)',
                'rgba(169, 255, 101, 0.4)'
            ],

            /**
             * The color of line.
             */
            lineColor: Palette.neutralColor40,

            /**
             * An array of colors for the lines.
             */
            lineColors: [],

            /**
             * An array with options for the labels.
             *
             * @type      {Array<*>}
             * @extends   annotations.crookedLine.labelOptions
             * @apioption annotations.fibonacci.typeOptions.labels
             */
            labels: []
        },

        labelOptions: {
            allowOverlap: true,
            align: 'right',
            backgroundColor: 'none',
            borderWidth: 0,
            crop: false,
            overflow: 'none' as any,
            shape: 'rect',
            style: {
                color: 'grey'
            },
            verticalAlign: 'middle',
            y: 0
        }
    }
);

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType' {
    interface AnnotationTypeRegistry {
        fibonacci: typeof Fibonacci;
    }
}

Annotation.types.fibonacci = Fibonacci;

/* *
 *
 *  Class Namespace
 *
 * */

namespace Fibonacci {
    export interface Options extends Tunnel.Options {
        typeOptions: TypeOptions;
    }
    export interface TypeOptions extends Tunnel.TypeOptions {
        reversed: boolean;
        backgroundColors: Array<ColorString>;
        labels: Array<CrookedLine.Options['labelOptions']>;
        lineColor: ColorString;
        lineColors: Array<ColorString>;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default Fibonacci;
