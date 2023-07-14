/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  Extension for 3D charts
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

import type ColorType from '../Color/ColorType';
import type Options from '../Options';
import type Position3DObject from '../Renderer/Position3DObject';
import type SeriesOptions from '../Series/SeriesOptions';
import type SVGElement3DLike from '../Renderer/SVG/SVGElement3DLike';

import Axis from '../Axis/Axis.js';
import Chart from './Chart.js';
import Color from '../Color/Color.js';
const { parse: color } = Color;
import D from '../Defaults.js';
const { defaultOptions: genericDefaultOptions } = D;
import Fx from '../Animation/Fx.js';
import Math3D from '../Math3D.js';
const {
    perspective,
    shapeArea3D
} = Math3D;
import Series from '../Series/Series.js';
import U from '../Utilities.js';
const {
    addEvent,
    isArray,
    merge,
    pick,
    wrap
} = U;

/* *
 *
 * Declarations
 *
 * */

declare module '../Animation/FxLike' {
    interface FxLike {
        matrixSetter?(): void;
    }
}

declare module '../Chart/ChartLike'{
    interface ChartLike {
        chart3d?: Chart3D['chart3d'];
        frameShapes?: Record<string, SVGElement3DLike>;
        is3d(): boolean;
    }
}

declare module '../Chart/ChartOptions'{
    interface ChartOptions {
        options3d?: Options;
    }
}

declare module '../Options'{
    export interface Options {
        alpha?: number;
        axisLabelPosition?: ('auto'|null);
        beta?: number;
        depth?: number;
        enabled?: boolean;
        fitToPlot?: boolean;
        frame?: Chart3D.FrameOptions;
        viewDistance?: number;
    }
}

interface Chart3D extends Chart {
    chart3d: Chart3D.Composition;
}

namespace Chart3D {

    /* *
     *
     *  Interfaces
     *
     * */

    export interface Edge3DObject extends Position3DObject {
        xDir: Position3DObject;
    }

    export interface FrameObject extends FrameOptions {
        axes: Record<string, Record<string, (Edge3DObject|null)>>;
        back: FrameSideObject;
        bottom: FrameSideObject;
        front: FrameSideObject;
        left: FrameSideObject;
        right: FrameSideObject;
        top: FrameSideObject;
    }

    export interface FrameOptions {
        back?: FrameSideOptions;
        bottom?: FrameSideOptions;
        front?: FrameSideOptions;
        left?: FrameSideOptions;
        right?: FrameSideOptions;
        size?: number;
        top?: FrameSideOptions;
        visible?: string;
    }

    export interface FrameSideObject extends FrameSideOptions {
        frontFacing: boolean;
        size: number;
    }

    export interface FrameSideOptions {
        color?: ColorType;
        size?: number;
        visible?: ('auto'|'default'|boolean);
    }

    export interface Stack3DDictionary {
        [index: number]: Stack3DDictionaryObject;
        totalStacks: number;
    }
    export interface Stack3DDictionaryObject {
        position: number;
        series: Array<Series>;
    }

    /* *
     *
     *  Classes
     *
     * */

    export class Composition {

        /* *
         *
         *  Constructors
         *
         * */

        public constructor(chart: Chart3D) {
            this.chart = chart;
        }

        /* *
         *
         *  Properties
         *
         * */

        public chart: Chart3D;
        public frame3d: FrameObject = void 0 as any;

        /* *
         *
         *  Functions
         *
         * */

        public get3dFrame(): FrameObject {
            const chart = this.chart,
                options3d = chart.options.chart.options3d as any,
                frameOptions = options3d.frame,
                xm = chart.plotLeft,
                xp = chart.plotLeft + chart.plotWidth,
                ym = chart.plotTop,
                yp = chart.plotTop + chart.plotHeight,
                zm = 0,
                zp = options3d.depth,
                faceOrientation = function (
                    vertexes: Array<Position3DObject>
                ): number {
                    const area = shapeArea3D(vertexes, chart);

                    // Give it 0.5 squared-pixel as a margin for rounding errors
                    if (area > 0.5) {
                        return 1;
                    }
                    if (area < -0.5) {
                        return -1;
                    }
                    return 0;
                },
                bottomOrientation = faceOrientation([
                    { x: xm, y: yp, z: zp },
                    { x: xp, y: yp, z: zp },
                    { x: xp, y: yp, z: zm },
                    { x: xm, y: yp, z: zm }
                ]),
                topOrientation = faceOrientation([
                    { x: xm, y: ym, z: zm },
                    { x: xp, y: ym, z: zm },
                    { x: xp, y: ym, z: zp },
                    { x: xm, y: ym, z: zp }
                ]),
                leftOrientation = faceOrientation([
                    { x: xm, y: ym, z: zm },
                    { x: xm, y: ym, z: zp },
                    { x: xm, y: yp, z: zp },
                    { x: xm, y: yp, z: zm }
                ]),
                rightOrientation = faceOrientation([
                    { x: xp, y: ym, z: zp },
                    { x: xp, y: ym, z: zm },
                    { x: xp, y: yp, z: zm },
                    { x: xp, y: yp, z: zp }
                ]),
                frontOrientation = faceOrientation([
                    { x: xm, y: yp, z: zm },
                    { x: xp, y: yp, z: zm },
                    { x: xp, y: ym, z: zm },
                    { x: xm, y: ym, z: zm }
                ]),
                backOrientation = faceOrientation([
                    { x: xm, y: ym, z: zp },
                    { x: xp, y: ym, z: zp },
                    { x: xp, y: yp, z: zp },
                    { x: xm, y: yp, z: zp }
                ]),
                defaultShowFront = false,
                defaultShowBack = true;

            let defaultShowBottom = false,
                defaultShowTop = false,
                defaultShowLeft = false,
                defaultShowRight = false;

            // The 'default' criteria to visible faces of the frame is looking
            // up every axis to decide whenever the left/right//top/bottom sides
            // of the frame will be shown
            ([] as Array<Axis>)
                .concat(chart.xAxis, chart.yAxis, chart.zAxis as any)
                .forEach(function (axis: Axis): void {
                    if (axis) {
                        if (axis.horiz) {
                            if (axis.opposite) {
                                defaultShowTop = true;
                            } else {
                                defaultShowBottom = true;
                            }
                        } else {
                            if (axis.opposite) {
                                defaultShowRight = true;
                            } else {
                                defaultShowLeft = true;
                            }
                        }
                    }
                });

            const getFaceOptions = function (
                sources: Array<unknown>,
                faceOrientation: number,
                defaultVisible?: ('auto'|'default'|boolean)
            ): FrameSideObject {
                const faceAttrs = ['size', 'color', 'visible'],
                    options: FrameSideOptions = {};

                for (let i = 0; i < faceAttrs.length; i++) {
                    const attr = faceAttrs[i];

                    for (let j = 0; j < sources.length; j++) {
                        if (typeof sources[j] === 'object') {
                            const val = (sources[j] as any)[attr];

                            if (typeof val !== 'undefined' && val !== null) {
                                (options as any)[attr] = val;
                                break;
                            }
                        }
                    }
                }
                let isVisible = defaultVisible;

                if (options.visible === true || options.visible === false) {
                    isVisible = options.visible;
                } else if (options.visible === 'auto') {
                    isVisible = faceOrientation > 0;
                }

                return {
                    size: pick(options.size, 1),
                    color: pick(options.color, 'none'),
                    frontFacing: faceOrientation > 0,
                    visible: isVisible
                };
            };

            // docs @TODO: Add all frame options (left, right, top, bottom,
            // front, back) to apioptions JSDoc once the new system is up.
            const ret: FrameObject = {
                axes: {},
                // FIXME: Previously, left/right, top/bottom and front/back
                // pairs shared size and color.
                // For compatibility and consistency sake, when one face have
                // size/color/visibility set, the opposite face will default to
                // the same values. Also, left/right used to be called 'side',
                // so that's also added as a fallback.
                bottom: getFaceOptions(
                    [frameOptions.bottom, frameOptions.top, frameOptions],
                    bottomOrientation,
                    defaultShowBottom
                ),
                top: getFaceOptions(
                    [frameOptions.top, frameOptions.bottom, frameOptions],
                    topOrientation,
                    defaultShowTop
                ),
                left: getFaceOptions(
                    [
                        frameOptions.left,
                        frameOptions.right,
                        frameOptions.side,
                        frameOptions
                    ],
                    leftOrientation,
                    defaultShowLeft
                ),
                right: getFaceOptions(
                    [
                        frameOptions.right,
                        frameOptions.left,
                        frameOptions.side,
                        frameOptions
                    ],
                    rightOrientation,
                    defaultShowRight
                ),
                back: getFaceOptions(
                    [frameOptions.back, frameOptions.front, frameOptions],
                    backOrientation,
                    defaultShowBack
                ),
                front: getFaceOptions(
                    [frameOptions.front, frameOptions.back, frameOptions],
                    frontOrientation,
                    defaultShowFront
                )
            };


            // Decide the bast place to put axis title/labels based on the
            // visible faces. Ideally, The labels can only be on the edge
            // between a visible face and an invisble one. Also, the Y label
            // should be one the left-most edge (right-most if opposite).
            if (options3d.axisLabelPosition === 'auto') {
                const isValidEdge = function (
                    face1: FrameSideObject,
                    face2: FrameSideObject
                ): (boolean|undefined) {
                    return (
                        (face1.visible !== face2.visible) ||
                        (
                            face1.visible &&
                            face2.visible &&
                            (face1.frontFacing !== face2.frontFacing)
                        )
                    );
                };

                const yEdges = [] as Array<Edge3DObject>;

                if (isValidEdge(ret.left, ret.front)) {
                    yEdges.push({
                        y: (ym + yp) / 2,
                        x: xm,
                        z: zm,
                        xDir: { x: 1, y: 0, z: 0 }
                    });
                }
                if (isValidEdge(ret.left, ret.back)) {
                    yEdges.push({
                        y: (ym + yp) / 2,
                        x: xm,
                        z: zp,
                        xDir: { x: 0, y: 0, z: -1 }
                    });
                }
                if (isValidEdge(ret.right, ret.front)) {
                    yEdges.push({
                        y: (ym + yp) / 2,
                        x: xp,
                        z: zm,
                        xDir: { x: 0, y: 0, z: 1 }
                    });
                }
                if (isValidEdge(ret.right, ret.back)) {
                    yEdges.push({
                        y: (ym + yp) / 2,
                        x: xp,
                        z: zp,
                        xDir: { x: -1, y: 0, z: 0 }
                    });
                }

                const xBottomEdges = [] as Array<Edge3DObject>;

                if (isValidEdge(ret.bottom, ret.front)) {
                    xBottomEdges.push({
                        x: (xm + xp) / 2,
                        y: yp,
                        z: zm,
                        xDir: { x: 1, y: 0, z: 0 }
                    });
                }
                if (isValidEdge(ret.bottom, ret.back)) {
                    xBottomEdges.push({
                        x: (xm + xp) / 2,
                        y: yp,
                        z: zp,
                        xDir: { x: -1, y: 0, z: 0 }
                    });
                }

                const xTopEdges = [] as Array<Edge3DObject>;

                if (isValidEdge(ret.top, ret.front)) {
                    xTopEdges.push({
                        x: (xm + xp) / 2,
                        y: ym,
                        z: zm,
                        xDir: { x: 1, y: 0, z: 0 }
                    });
                }
                if (isValidEdge(ret.top, ret.back)) {
                    xTopEdges.push({
                        x: (xm + xp) / 2,
                        y: ym,
                        z: zp,
                        xDir: { x: -1, y: 0, z: 0 }
                    });
                }

                const zBottomEdges = [] as Array<Edge3DObject>;

                if (isValidEdge(ret.bottom, ret.left)) {
                    zBottomEdges.push({
                        z: (zm + zp) / 2,
                        y: yp,
                        x: xm,
                        xDir: { x: 0, y: 0, z: -1 }
                    });
                }
                if (isValidEdge(ret.bottom, ret.right)) {
                    zBottomEdges.push({
                        z: (zm + zp) / 2,
                        y: yp,
                        x: xp,
                        xDir: { x: 0, y: 0, z: 1 }
                    });
                }

                const zTopEdges = [] as Array<Edge3DObject>;

                if (isValidEdge(ret.top, ret.left)) {
                    zTopEdges.push({
                        z: (zm + zp) / 2,
                        y: ym,
                        x: xm,
                        xDir: { x: 0, y: 0, z: -1 }
                    });
                }
                if (isValidEdge(ret.top, ret.right)) {
                    zTopEdges.push({
                        z: (zm + zp) / 2,
                        y: ym,
                        x: xp,
                        xDir: { x: 0, y: 0, z: 1 }
                    });
                }

                const pickEdge = function (
                    edges: Array<Edge3DObject>,
                    axis: string,
                    mult: number
                ): (Edge3DObject|null) {
                    if (edges.length === 0) {
                        return null;
                    }
                    if (edges.length === 1) {
                        return edges[0];
                    }
                    const projections = perspective(edges, chart, false);

                    let best = 0;

                    for (let i = 1; i < projections.length; i++) {
                        if (
                            mult * (projections[i] as any)[axis] >
                            mult * (projections[best] as any)[axis]
                        ) {
                            best = i;
                        } else if (
                            (
                                mult * (projections[i] as any)[axis] ===
                                mult * (projections[best] as any)[axis]
                            ) &&
                            (projections[i].z < projections[best].z)
                        ) {
                            best = i;
                        }
                    }
                    return edges[best];
                };

                ret.axes = {
                    y: {
                        'left': pickEdge(yEdges, 'x', -1),
                        'right': pickEdge(yEdges, 'x', +1)
                    },
                    x: {
                        'top': pickEdge(xTopEdges, 'y', -1),
                        'bottom': pickEdge(xBottomEdges, 'y', +1)
                    },
                    z: {
                        'top': pickEdge(zTopEdges, 'y', -1),
                        'bottom': pickEdge(zBottomEdges, 'y', +1)
                    }
                };
            } else {
                ret.axes = {
                    y: {
                        'left': {
                            x: xm, z: zm, xDir: { x: 1, y: 0, z: 0 }
                        } as any,
                        'right': {
                            x: xp, z: zm, xDir: { x: 0, y: 0, z: 1 }
                        } as any
                    },
                    x: {
                        'top': {
                            y: ym, z: zm, xDir: { x: 1, y: 0, z: 0 }
                        } as any,
                        'bottom': {
                            y: yp,
                            z: zm,
                            xDir: { x: 1, y: 0, z: 0 }
                        } as any
                    },
                    z: {
                        'top': {
                            x: defaultShowLeft ? xp : xm,
                            y: ym,
                            xDir: defaultShowLeft ?
                                { x: 0, y: 0, z: 1 } :
                                { x: 0, y: 0, z: -1 }
                        } as any,
                        'bottom': {
                            x: defaultShowLeft ? xp : xm,
                            y: yp,
                            xDir: defaultShowLeft ?
                                { x: 0, y: 0, z: 1 } :
                                { x: 0, y: 0, z: -1 }
                        } as any
                    }
                };
            }

            return ret;
        }

        /**
         * Calculate scale of the 3D view. That is required to fit chart's 3D
         * projection into the actual plotting area. Reported as #4933.
         *
         * **Note:**
         * This function should ideally take the plot values instead of a chart
         * object, but since the chart object is needed for perspective it is
         * not practical. Possible to make both getScale and perspective more
         * logical and also immutable.
         *
         * @private
         * @function getScale
         *
         * @param {number} depth
         * The depth of the chart
         *
         * @return {number}
         * The scale to fit the 3D chart into the plotting area.
         *
         * @requires highcharts-3d
         */
        public getScale(depth: number): number {
            const chart = this.chart,
                plotLeft = chart.plotLeft,
                plotRight = chart.plotWidth + plotLeft,
                plotTop = chart.plotTop,
                plotBottom = chart.plotHeight + plotTop,
                originX = plotLeft + chart.plotWidth / 2,
                originY = plotTop + chart.plotHeight / 2,
                bbox3d = {
                    minX: Number.MAX_VALUE,
                    maxX: -Number.MAX_VALUE,
                    minY: Number.MAX_VALUE,
                    maxY: -Number.MAX_VALUE
                };

            let corners: Array<Position3DObject>,
                scale = 1;

            // Top left corners:
            corners = [{
                x: plotLeft,
                y: plotTop,
                z: 0
            }, {
                x: plotLeft,
                y: plotTop,
                z: depth
            }];

            // Top right corners:
            [0, 1].forEach(function (i: number): void {
                corners.push({
                    x: plotRight,
                    y: corners[i].y,
                    z: corners[i].z
                });
            });

            // All bottom corners:
            [0, 1, 2, 3].forEach(function (i: number): void {
                corners.push({
                    x: corners[i].x,
                    y: plotBottom,
                    z: corners[i].z
                });
            });

            // Calculate 3D corners:
            corners = perspective(corners, chart, false);

            // Get bounding box of 3D element:
            corners.forEach(function (corner): void {
                bbox3d.minX = Math.min(bbox3d.minX, corner.x);
                bbox3d.maxX = Math.max(bbox3d.maxX, corner.x);
                bbox3d.minY = Math.min(bbox3d.minY, corner.y);
                bbox3d.maxY = Math.max(bbox3d.maxY, corner.y);
            });

            // Left edge:
            if (plotLeft > bbox3d.minX) {
                scale = Math.min(
                    scale,
                    1 - Math.abs(
                        (plotLeft + originX) / (bbox3d.minX + originX)
                    ) % 1
                );
            }

            // Right edge:
            if (plotRight < bbox3d.maxX) {
                scale = Math.min(
                    scale,
                    (plotRight - originX) / (bbox3d.maxX - originX)
                );
            }

            // Top edge:
            if (plotTop > bbox3d.minY) {
                if (bbox3d.minY < 0) {
                    scale = Math.min(
                        scale,
                        (plotTop + originY) / (-bbox3d.minY + plotTop + originY)
                    );
                } else {
                    scale = Math.min(
                        scale,
                        1 - (plotTop + originY) / (bbox3d.minY + originY) % 1
                    );
                }
            }

            // Bottom edge:
            if (plotBottom < bbox3d.maxY) {
                scale = Math.min(
                    scale,
                    Math.abs((plotBottom - originY) / (bbox3d.maxY - originY))
                );
            }

            return scale;
        }

    }

    /* *
     *
     *  Constants
     *
     * */

    /**
     * @optionparent
     * @private
     */
    export const defaultOptions = {

        chart: {

            /**
             * Options to render charts in 3 dimensions. This feature requires
             * `highcharts-3d.js`, found in the download package or online at
             * [code.highcharts.com/highcharts-3d.js](https://code.highcharts.com/highcharts-3d.js).
             *
             * @since    4.0
             * @product  highcharts
             * @requires highcharts-3d
             */
            options3d: {

                /**
                 * Whether to render the chart using the 3D functionality.
                 *
                 * @since   4.0
                 * @product highcharts
                 */
                enabled: false,

                /**
                 * One of the two rotation angles for the chart.
                 *
                 * @since   4.0
                 * @product highcharts
                 */
                alpha: 0,

                /**
                 * One of the two rotation angles for the chart.
                 *
                 * @since   4.0
                 * @product highcharts
                 */
                beta: 0,

                /**
                 * The total depth of the chart.
                 *
                 * @since   4.0
                 * @product highcharts
                 */
                depth: 100,

                /**
                 * Whether the 3d box should automatically adjust to the chart
                 * plot area.
                 *
                 * @since   4.2.4
                 * @product highcharts
                 */
                fitToPlot: true,

                /**
                 * Defines the distance the viewer is standing in front of the
                 * chart, this setting is important to calculate the perspective
                 * effect in column and scatter charts. It is not used for 3D
                 * pie charts.
                 *
                 * @since   4.0
                 * @product highcharts
                 */
                viewDistance: 25,

                /**
                 * Set it to `"auto"` to automatically move the labels to the
                 * best edge.
                 *
                 * @type    {"auto"|null}
                 * @since   5.0.12
                 * @product highcharts
                 */
                axisLabelPosition: null,

                /**
                 * Provides the option to draw a frame around the charts by
                 * defining a bottom, front and back panel.
                 *
                 * @since    4.0
                 * @product  highcharts
                 * @requires highcharts-3d
                 */
                frame: {

                    /**
                     * Whether the frames are visible.
                     */
                    visible: 'default',

                    /**
                     * General pixel thickness for the frame faces.
                     */
                    size: 1,

                    /**
                     * The bottom of the frame around a 3D chart.
                     *
                     * @since    4.0
                     * @product  highcharts
                     * @requires highcharts-3d
                     */

                    /**
                     * The color of the panel.
                     *
                     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                     * @default   transparent
                     * @since     4.0
                     * @product   highcharts
                     * @apioption chart.options3d.frame.bottom.color
                     */

                    /**
                     * The thickness of the panel.
                     *
                     * @type      {number}
                     * @default   1
                     * @since     4.0
                     * @product   highcharts
                     * @apioption chart.options3d.frame.bottom.size
                     */

                    /**
                     * Whether to display the frame. Possible values are `true`,
                     * `false`, `"auto"` to display only the frames behind the
                     * data, and `"default"` to display faces behind the data
                     * based on the axis layout, ignoring the point of view.
                     *
                     * @sample {highcharts} highcharts/3d/scatter-frame/
                     *         Auto frames
                     *
                     * @type      {boolean|"default"|"auto"}
                     * @default   default
                     * @since     5.0.12
                     * @product   highcharts
                     * @apioption chart.options3d.frame.bottom.visible
                     */

                    /**
                     * The bottom of the frame around a 3D chart.
                     */
                    bottom: {},

                    /**
                     * The top of the frame around a 3D chart.
                     *
                     * @extends chart.options3d.frame.bottom
                     */
                    top: {},

                    /**
                     * The left side of the frame around a 3D chart.
                     *
                     * @extends chart.options3d.frame.bottom
                     */
                    left: {},

                    /**
                     * The right of the frame around a 3D chart.
                     *
                     * @extends chart.options3d.frame.bottom
                     */
                    right: {},

                    /**
                     * The back side of the frame around a 3D chart.
                     *
                     * @extends chart.options3d.frame.bottom
                     */
                    back: {},

                    /**
                     * The front of the frame around a 3D chart.
                     *
                     * @extends chart.options3d.frame.bottom
                     */
                    front: {}
                }
            }
        }

    };

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable no-invalid-this, valid-jsdoc */

    /**
     * @private
     */
    export function compose(
        ChartClass: typeof Chart,
        FxClass: typeof Fx
    ): void {

        const chartProto = ChartClass.prototype;
        const fxProto = FxClass.prototype;

        /**
         * Shorthand to check the is3d flag.
         * @private
         * @return {boolean}
         * Whether it is a 3D chart.
         */
        chartProto.is3d = function (): boolean {
            return Boolean(
                this.options.chart.options3d &&
                this.options.chart.options3d.enabled
            ); // #4280
        };

        chartProto.propsRequireDirtyBox.push('chart.options3d');
        chartProto.propsRequireUpdateSeries.push('chart.options3d');

        /**
         * Animation setter for matrix property.
         * @private
         */

        fxProto.matrixSetter = function (): void {
            let interpolated;

            if (
                this.pos < 1 &&
                (isArray(this.start) || isArray(this.end))
            ) {
                const start: Array<number> = (
                        (this.start as any) ||
                        [1, 0, 0, 1, 0, 0]
                    ),
                    end: Array<number> = (this.end as any) || [1, 0, 0, 1, 0, 0];

                interpolated = [];
                for (let i = 0; i < 6; i++) {
                    interpolated.push(
                        this.pos * end[i] + (1 - this.pos) * start[i]
                    );
                }
            } else {
                interpolated = this.end;
            }

            (this.elem as any).attr(
                this.prop,
                interpolated,
                null,
                true
            );
        };

        merge(true, genericDefaultOptions, defaultOptions);

        addEvent(ChartClass, 'init', onInit);
        addEvent(ChartClass, 'addSeries', onAddSeries);
        addEvent(ChartClass, 'afterDrawChartBox', onAfterDrawChartBox);
        addEvent(ChartClass, 'afterGetContainer', onAfterGetContainer);
        addEvent(ChartClass, 'afterInit', onAfterInit);
        addEvent(ChartClass, 'afterSetChartSize', onAfterSetChartSize);
        addEvent(ChartClass, 'beforeRedraw', onBeforeRedraw);
        addEvent(ChartClass, 'beforeRender', onBeforeRender);

        wrap(chartProto, 'isInsidePlot', wrapIsInsidePlot);
        wrap(chartProto, 'renderSeries', wrapRenderSeries);
        wrap(chartProto, 'setClassName', wrapSetClassName);
    }

    /**
     * Legacy support for HC < 6 to make 'scatter' series in a 3D chart route to
     * the real 'scatter3d' series type. (#8407)
     * @private
     */
    function onAddSeries(
        this: Chart,
        e: {
            options: SeriesOptions;
        }
    ): void {
        if (this.is3d()) {
            if (e.options.type === 'scatter') {
                e.options.type = 'scatter3d';
            }
        }
    }

    /**
     * @private
     */
    function onAfterDrawChartBox(this: Chart): void {

        if (
            this.chart3d &&
            this.is3d()
        ) {
            const chart = this as Chart3D,
                renderer = chart.renderer,
                options3d = chart.options.chart.options3d as any,
                frame = chart.chart3d.get3dFrame(),
                xm = chart.plotLeft,
                xp = chart.plotLeft + chart.plotWidth,
                ym = chart.plotTop,
                yp = chart.plotTop + chart.plotHeight,
                zm = 0,
                zp = options3d.depth,
                xmm = xm - (frame.left.visible ? frame.left.size : 0),
                xpp = xp + (frame.right.visible ? frame.right.size : 0),
                ymm = ym - (frame.top.visible ? frame.top.size : 0),
                ypp = yp + (frame.bottom.visible ? frame.bottom.size : 0),
                zmm = zm - (frame.front.visible ? frame.front.size : 0),
                zpp = zp + (frame.back.visible ? frame.back.size : 0),
                verb = chart.hasRendered ? 'animate' : 'attr';

            chart.chart3d.frame3d = frame;

            if (!chart.frameShapes) {
                chart.frameShapes = {
                    bottom: renderer.polyhedron().add(),
                    top: renderer.polyhedron().add(),
                    left: renderer.polyhedron().add(),
                    right: renderer.polyhedron().add(),
                    back: renderer.polyhedron().add(),
                    front: renderer.polyhedron().add()
                };
            }
            chart.frameShapes.bottom[verb]({
                'class': 'highcharts-3d-frame highcharts-3d-frame-bottom',
                zIndex: frame.bottom.frontFacing ? -1000 : 1000,
                faces: [{ // bottom
                    fill: color(frame.bottom.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }],
                    enabled: frame.bottom.visible
                },
                { // top
                    fill: color(frame.bottom.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xm,
                        y: yp,
                        z: zp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.bottom.visible
                },
                { // left
                    fill: color(frame.bottom.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.bottom.visible && !frame.left.visible
                },
                { // right
                    fill: color(frame.bottom.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }],
                    enabled: frame.bottom.visible && !frame.right.visible
                },
                { // front
                    fill: color(frame.bottom.color).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.bottom.visible && !frame.front.visible
                },
                { // back
                    fill: color(frame.bottom.color).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }],
                    enabled: frame.bottom.visible && !frame.back.visible
                }]
            });
            chart.frameShapes.top[verb]({
                'class': 'highcharts-3d-frame highcharts-3d-frame-top',
                zIndex: frame.top.frontFacing ? -1000 : 1000,
                faces: [{ // bottom
                    fill: color(frame.top.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }],
                    enabled: frame.top.visible
                },
                { // top
                    fill: color(frame.top.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xm,
                        y: ym,
                        z: zm
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.top.visible
                },
                { // left
                    fill: color(frame.top.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.top.visible && !frame.left.visible
                },
                { // right
                    fill: color(frame.top.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }],
                    enabled: frame.top.visible && !frame.right.visible
                },
                { // front
                    fill: color(frame.top.color).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }],
                    enabled: frame.top.visible && !frame.front.visible
                },
                { // back
                    fill: color(frame.top.color).get(),
                    vertexes: [{
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.top.visible && !frame.back.visible
                }]
            });
            chart.frameShapes.left[verb]({
                'class': 'highcharts-3d-frame highcharts-3d-frame-left',
                zIndex: frame.left.frontFacing ? -1000 : 1000,
                faces: [{ // bottom
                    fill: color(frame.left.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }],
                    enabled: frame.left.visible && !frame.bottom.visible
                },
                { // top
                    fill: color(frame.left.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }],
                    enabled: frame.left.visible && !frame.top.visible
                },
                { // left
                    fill: color(frame.left.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }],
                    enabled: frame.left.visible
                },
                { // right
                    fill: color(frame.left.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xm,
                        y: ym,
                        z: zp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }],
                    enabled: frame.left.visible
                },
                { // front
                    fill: color(frame.left.color).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.left.visible && !frame.front.visible
                },
                { // back
                    fill: color(frame.left.color).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.left.visible && !frame.back.visible
                }]
            });
            chart.frameShapes.right[verb]({
                'class': 'highcharts-3d-frame highcharts-3d-frame-right',
                zIndex: frame.right.frontFacing ? -1000 : 1000,
                faces: [{ // bottom
                    fill: color(frame.right.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }],
                    enabled: frame.right.visible && !frame.bottom.visible
                },
                { // top
                    fill: color(frame.right.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }],
                    enabled: frame.right.visible && !frame.top.visible
                },
                { // left
                    fill: color(frame.right.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xp,
                        y: ym,
                        z: zm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.right.visible
                },
                { // right
                    fill: color(frame.right.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }],
                    enabled: frame.right.visible
                },
                { // front
                    fill: color(frame.right.color).get(),
                    vertexes: [{
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }],
                    enabled: frame.right.visible && !frame.front.visible
                },
                { // back
                    fill: color(frame.right.color).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }],
                    enabled: frame.right.visible && !frame.back.visible
                }]
            });
            chart.frameShapes.back[verb]({
                'class': 'highcharts-3d-frame highcharts-3d-frame-back',
                zIndex: frame.back.frontFacing ? -1000 : 1000,
                faces: [{ // bottom
                    fill: color(frame.back.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }],
                    enabled: frame.back.visible && !frame.bottom.visible
                },
                { // top
                    fill: color(frame.back.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.back.visible && !frame.top.visible
                },
                { // left
                    fill: color(frame.back.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xm,
                        y: ym,
                        z: zp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }],
                    enabled: frame.back.visible && !frame.left.visible
                },
                { // right
                    fill: color(frame.back.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }],
                    enabled: frame.back.visible && !frame.right.visible
                },
                { // front
                    fill: color(frame.back.color).get(),
                    vertexes: [{
                        x: xm,
                        y: ym,
                        z: zp
                    }, {
                        x: xp,
                        y: ym,
                        z: zp
                    }, {
                        x: xp,
                        y: yp,
                        z: zp
                    }, {
                        x: xm,
                        y: yp,
                        z: zp
                    }],
                    enabled: frame.back.visible
                },
                { // back
                    fill: color(frame.back.color).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zpp
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zpp
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zpp
                    }],
                    enabled: frame.back.visible
                }]
            });
            chart.frameShapes.front[verb]({
                'class': 'highcharts-3d-frame highcharts-3d-frame-front',
                zIndex: frame.front.frontFacing ? -1000 : 1000,
                faces: [{ // bottom
                    fill: color(frame.front.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.front.visible && !frame.bottom.visible
                },
                { // top
                    fill: color(frame.front.color).brighten(0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }],
                    enabled: frame.front.visible && !frame.top.visible
                },
                { // left
                    fill: color(frame.front.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }],
                    enabled: frame.front.visible && !frame.left.visible
                },
                { // right
                    fill: color(frame.front.color).brighten(-0.1).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xp,
                        y: ym,
                        z: zm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.front.visible && !frame.right.visible
                },
                { // front
                    fill: color(frame.front.color).get(),
                    vertexes: [{
                        x: xp,
                        y: ym,
                        z: zm
                    }, {
                        x: xm,
                        y: ym,
                        z: zm
                    }, {
                        x: xm,
                        y: yp,
                        z: zm
                    }, {
                        x: xp,
                        y: yp,
                        z: zm
                    }],
                    enabled: frame.front.visible
                },
                { // back
                    fill: color(frame.front.color).get(),
                    vertexes: [{
                        x: xpp,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ypp,
                        z: zmm
                    }, {
                        x: xmm,
                        y: ymm,
                        z: zmm
                    }, {
                        x: xpp,
                        y: ymm,
                        z: zmm
                    }],
                    enabled: frame.front.visible
                }]
            });
        }
    }

    /**
     * Add the required CSS classes for column sides (#6018)
     * @private
     */
    function onAfterGetContainer(this: Chart): void {
        if (this.styledMode) {
            // Add definitions used by brighter and darker faces of the cuboids.
            [{
                name: 'darker',
                slope: 0.6
            }, {
                name: 'brighter',
                slope: 1.4
            }].forEach(function (cfg): void {
                this.renderer.definition({
                    tagName: 'filter',
                    attributes: {
                        id: 'highcharts-' + cfg.name
                    },
                    children: [{
                        tagName: 'feComponentTransfer',
                        children: [{
                            tagName: 'feFuncR',
                            attributes: {
                                type: 'linear',
                                slope: cfg.slope
                            }
                        }, {
                            tagName: 'feFuncG',
                            attributes: {
                                type: 'linear',
                                slope: cfg.slope
                            }
                        }, {
                            tagName: 'feFuncB',
                            attributes: {
                                type: 'linear',
                                slope: cfg.slope
                            }
                        }]
                    }]
                });
            }, this);
        }
    }

    /**
     * Legacy support for HC < 6 to make 'scatter' series in a 3D chart route to
     * the real 'scatter3d' series type. (#8407)
     * @private
     */
    function onAfterInit(this: Chart): void {
        const options = this.options;

        if (this.is3d()) {
            (options.series || []).forEach(function (s): void {
                const type = (
                    s.type ||
                    options.chart.type ||
                    options.chart.defaultSeriesType
                );

                if (type === 'scatter') {
                    s.type = 'scatter3d';
                }
            });
        }
    }

    /**
     * @private
     */
    function onAfterSetChartSize(this: Chart): void {
        const chart = this,
            options3d = chart.options.chart.options3d as any;

        if (
            chart.chart3d &&
            chart.is3d()
        ) {

            // Add a 0-360 normalisation for alfa and beta angles in 3d graph
            if (options3d) {
                options3d.alpha = options3d.alpha % 360 +
                    (options3d.alpha >= 0 ? 0 : 360);
                options3d.beta = options3d.beta % 360 +
                    (options3d.beta >= 0 ? 0 : 360);
            }

            const inverted = chart.inverted,
                clipBox = chart.clipBox,
                margin = chart.margin,
                x = inverted ? 'y' : 'x',
                y = inverted ? 'x' : 'y',
                w = inverted ? 'height' : 'width',
                h = inverted ? 'width' : 'height';

            clipBox[x] = -(margin[3] || 0);
            clipBox[y] = -(margin[0] || 0);
            clipBox[w] = (
                chart.chartWidth + (margin[3] || 0) + (margin[1] || 0)
            );
            clipBox[h] = (
                chart.chartHeight + (margin[0] || 0) + (margin[2] || 0)
            );

            // Set scale, used later in perspective method():
            // getScale uses perspective, so scale3d has to be reset.
            chart.scale3d = 1;
            if (options3d.fitToPlot === true) {
                chart.scale3d = chart.chart3d.getScale(options3d.depth);
            }
            // Recalculate the 3d frame with every call of setChartSize,
            // instead of doing it after every redraw(). It avoids ticks
            // and axis title outside of chart.
            chart.chart3d.frame3d = chart.chart3d.get3dFrame(); // #7942
        }
    }

    /**
     * @private
     */
    function onBeforeRedraw(this: Chart): void {
        if (this.is3d()) {
            // Set to force a redraw of all elements
            this.isDirtyBox = true;
        }
    }

    /**
     * @private
     */
    function onBeforeRender(this: Chart): void {
        if (this.chart3d && this.is3d()) {
            this.chart3d.frame3d = this.chart3d.get3dFrame();
        }
    }

    /**
     * @private
     */
    function onInit(this: Chart): void {

        if (!this.chart3d) {
            this.chart3d = new Composition(this as Chart3D);
        }
    }

    /**
     * @private
     */
    function wrapIsInsidePlot(
        this: Chart,
        proceed: Function
    ): boolean {
        return this.is3d() || proceed.apply(this, [].slice.call(arguments, 1));
    }

    /**
     * Draw the series in the reverse order (#3803, #3917)
     * @private
     */
    function wrapRenderSeries(
        this: Chart,
        proceed: Function
    ): void {
        let series,
            i = this.series.length;

        if (this.is3d()) {
            while (i--) {
                series = this.series[i];
                series.translate();
                series.render();
            }
        } else {
            proceed.call(this);
        }
    }

    /**
     * @private
     */
    function wrapSetClassName(
        this: Chart,
        proceed: Function
    ): void {
        proceed.apply(this, [].slice.call(arguments, 1));

        if (this.is3d()) {
            this.container.className += ' highcharts-3d-chart';
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default Chart3D;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Note: As of v5.0.12, `frame.left` or `frame.right` should be used instead.
 *
 * The side for the frame around a 3D chart.
 *
 * @deprecated
 * @since     4.0
 * @product   highcharts
 * @requires  highcharts-3d
 * @apioption chart.options3d.frame.side
 */

/**
 * The color of the panel.
 *
 * @deprecated
 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
 * @default   transparent
 * @since     4.0
 * @product   highcharts
 * @apioption chart.options3d.frame.side.color
 */

/**
 * The thickness of the panel.
 *
 * @deprecated
 * @type      {number}
 * @default   1
 * @since     4.0
 * @product   highcharts
 * @apioption chart.options3d.frame.side.size
 */

''; // keeps doclets above in JS file
