/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type { YAxisOptions } from './AxisOptions';
import type Chart from '../Chart/Chart';
import type Pane from '../../Extensions/Pane';
import type Point from '../Series/Point';
import type PositionObject from '../Renderer/PositionObject';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type SVGRenderer from '../Renderer/SVG/SVGRenderer';

import Axis from './Axis.js';
import AxisDefaults from './AxisDefaults.js';
import Tick from './Tick.js';
import HiddenAxis from './HiddenAxis.js';
import U from '../Utilities.js';
const {
    addEvent,
    correctFloat,
    defined,
    extend,
    fireEvent,
    merge,
    pick,
    relativeLength,
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisOptions' {
    interface AxisOptions {
        angle?: number;
        gridLineInterpolation?: Highcharts.AxisGridLineInterpolationValue;
    }
}

declare module '../Chart/ChartLike'{
    interface ChartLike {
        inverted?: boolean;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        type AxisGridLineInterpolationValue = ('circle'|'polygon');
        interface AxisPlotBandsOptions {
            innerRadius?: (number|string);
            outerRadius?: (number|string);
            shape?: PaneBackgroundShapeValue;
            thickness?: (number|string);
        }
        interface AxisPlotLinesOptions {
            chartX?: number;
            chartY?: number;
            isCrosshair?: boolean;
            point?: Point;
            reverse?: boolean;
        }
    }
}

/**
 * @private
 */
declare module './AxisType' {
    interface AxisTypeRegistry {
        RadialAxis: RadialAxis;
    }
}

/**
 * @private
 * @class
 */
class RadialAxis {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Circular axis around the perimeter of a polar chart.
     * @private
     */
    public static defaultCircularOptions: DeepPartial<RadialAxisOptions> = {
        gridLineWidth: 1, // spokes
        labels: {
            align: void 0, // auto
            distance: 15,
            x: 0,
            y: void 0, // auto
            style: {
                textOverflow: 'none' // wrap lines by default (#7248)
            }
        },
        maxPadding: 0,
        minPadding: 0,
        showLastLabel: false,
        tickLength: 0
    };

    /**
     * The default options extend defaultYAxisOptions.
     * @private
     */
    public static defaultRadialGaugeOptions: DeepPartial<RadialAxisOptions> = {
        labels: {
            align: 'center',
            x: 0,
            y: void 0 // auto
        },
        minorGridLineWidth: 0,
        minorTickInterval: 'auto',
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickWidth: 1,
        tickLength: 10,
        tickPosition: 'inside',
        tickWidth: 2,
        title: {
            rotation: 0
        },
        zIndex: 2 // behind dials, points in the series group
    };

    /**
     * Radial axis, like a spoke in a polar chart.
     * @private
     */
    public static defaultRadialOptions: DeepPartial<RadialAxisOptions> = {

        /**
         * In a polar chart, this is the angle of the Y axis in degrees, where
         * 0 is up and 90 is right. The angle determines the position of the
         * axis line and the labels, though the coordinate system is unaffected.
         * Since v8.0.0 this option is also applicable for X axis (inverted
         * polar).
         *
         * @sample {highcharts} highcharts/xaxis/angle/
         *         Custom X axis' angle on inverted polar chart
         * @sample {highcharts} highcharts/yaxis/angle/
         *         Dual axis polar chart
         *
         * @type      {number}
         * @default   0
         * @since     4.2.7
         * @product   highcharts
         * @apioption xAxis.angle
         */

        /**
         * Polar charts only. Whether the grid lines should draw as a polygon
         * with straight lines between categories, or as circles. Can be either
         * `circle` or `polygon`. Since v8.0.0 this option is also applicable
         * for X axis (inverted polar).
         *
         * @sample {highcharts} highcharts/demo/polar-spider/
         *         Polygon grid lines
         * @sample {highcharts} highcharts/xaxis/gridlineinterpolation/
         *         Circle and polygon on inverted polar
         * @sample {highcharts} highcharts/yaxis/gridlineinterpolation/
         *         Circle and polygon
         *
         * @type       {string}
         * @product    highcharts
         * @validvalue ["circle", "polygon"]
         * @apioption  xAxis.gridLineInterpolation
         */
        gridLineInterpolation: 'circle',
        gridLineWidth: 1,
        labels: {
            align: 'right',
            x: -3,
            y: -2
        },
        showLastLabel: false,
        title: {
            x: 4,
            text: null,
            rotation: 90
        }
    };

    /* *
     *
     *  Static Functions
     *
     * */

    public static init(axis: RadialAxis): void {

        const axisProto = Axis.prototype;

        // Merge and set options.
        axis.setOptions = function (userOptions: DeepPartial<RadialAxisOptions>): void {

            const options = this.options = merge<RadialAxisOptions>(
                (axis.constructor as typeof Axis).defaultOptions,
                this.defaultPolarOptions,
                userOptions
            );

            // Make sure the plotBands array is instanciated for each Axis
            // (#2649)
            if (!options.plotBands) {
                options.plotBands = [];
            }

            fireEvent(this, 'afterSetOptions');

        };

        // Wrap the getOffset method to return zero offset for title or labels
        // in a radial axis.
        axis.getOffset = function (): void {
            // Call the Axis prototype method (the method we're in now is on the
            // instance)
            axisProto.getOffset.call(this);

            // Title or label offsets are not counted
            this.chart.axisOffset[this.side] = 0;

        };


        /**
         * Get the path for the axis line. This method is also referenced in the
         * getPlotLinePath method.
         *
         * @private
         *
         * @param {number} _lineWidth
         * Line width is not used.
         *
         * @param {number} [radius]
         * Radius of radial path.
         *
         * @param {number} [innerRadius]
         * Inner radius of radial path.
         *
         * @return {RadialAxisPath}
         */
        axis.getLinePath = function (
            _lineWidth: number,
            radius?: number,
            innerRadius?: number
        ): RadialAxisPath {
            let center = this.pane.center,
                end,
                chart = this.chart,
                r = pick(radius, center[2] / 2 - this.offset),
                left = this.left || 0,
                top = this.top || 0,
                path: RadialAxisPath;

            if (typeof innerRadius === 'undefined') {
                innerRadius = this.horiz ? 0 : this.center && -this.center[3] / 2;
            }

            // In case when innerSize of pane is set, it must be included
            if (innerRadius) {
                r += innerRadius;
            }

            if (this.isCircular || typeof radius !== 'undefined') {
                path = this.chart.renderer.symbols.arc(
                    left + center[0],
                    top + center[1],
                    r,
                    r,
                    {
                        start: this.startAngleRad,
                        end: this.endAngleRad,
                        open: true,
                        innerR: 0
                    }
                );

                // Bounds used to position the plotLine label next to the line
                // (#7117)
                path.xBounds = [left + center[0]];
                path.yBounds = [top + center[1] - r];

            } else {
                end = this.postTranslate(this.angleRad, r);
                path = [
                    ['M', this.center[0] + chart.plotLeft, this.center[1] + chart.plotTop],
                    ['L', end.x, end.y]
                ];
            }
            return path;
        };

        /**
         * Override setAxisTranslation by setting the translation to the
         * difference in rotation. This allows the translate method to return
         * angle for any given value.
         *
         * @private
         */
        axis.setAxisTranslation = function (): void {

            // Call uber method
            axisProto.setAxisTranslation.call(this);

            // Set transA and minPixelPadding
            if (this.center) { // it's not defined the first time
                if (this.isCircular) {

                    this.transA = (this.endAngleRad - this.startAngleRad) /
                        ((this.max - this.min) || 1);


                } else {
                    // The transA here is the length of the axis, so in case
                    // of inner radius, the length must be decreased by it
                    this.transA = ((this.center[2] - this.center[3]) / 2) /
                    ((this.max - this.min) || 1);
                }

                if (this.isXAxis) {
                    this.minPixelPadding = this.transA * this.minPointOffset;
                } else {
                    // This is a workaround for regression #2593, but categories
                    // still don't position correctly.
                    this.minPixelPadding = 0;
                }
            }
        };

        /**
         * In case of auto connect, add one closestPointRange to the max value
         * right before tickPositions are computed, so that ticks will extend
         * passed the real max.
         * @private
         */
        axis.beforeSetTickPositions = function (): void {
            // If autoConnect is true, polygonal grid lines are connected, and
            // one closestPointRange is added to the X axis to prevent the last
            // point from overlapping the first.
            this.autoConnect = (
                this.isCircular &&
                typeof pick(this.userMax, this.options.max) === 'undefined' &&
                correctFloat(this.endAngleRad - this.startAngleRad) ===
                correctFloat(2 * Math.PI)
            );

            // This will lead to add an extra tick to xAxis in order to display
            // a correct range on inverted polar
            if (!this.isCircular && this.chart.inverted) {
                this.max++;
            }

            if (this.autoConnect) {
                this.max += (
                    (this.categories && 1) ||
                    this.pointRange ||
                    this.closestPointRange ||
                    0
                ); // #1197, #2260
            }
        };

        /**
         * Override the setAxisSize method to use the arc's circumference as
         * length. This allows tickPixelInterval to apply to pixel lengths along
         * the perimeter.
         * @private
         */
        axis.setAxisSize = function (): void {
            let center: number[],
                start;

            axisProto.setAxisSize.call(this);

            if (this.isRadial) {

                // Set the center array
                this.pane.updateCenter(this);

                // In case when the innerSize is set in a polar chart, the axis'
                // center cannot be a reference to pane's center
                center = this.center = this.pane.center.slice();

                // The sector is used in Axis.translate to compute the
                // translation of reversed axis points (#2570)
                if (this.isCircular) {
                    this.sector = this.endAngleRad - this.startAngleRad;
                } else {
                    // When the pane's startAngle or the axis' angle is set then
                    // new x and y values for vertical axis' center must be
                    // calulated
                    start = this.postTranslate(this.angleRad, center[3] / 2);
                    center[0] = start.x - this.chart.plotLeft;
                    center[1] = start.y - this.chart.plotTop;
                }

                // Axis len is used to lay out the ticks
                this.len = this.width = this.height =
                    (center[2] - center[3]) * pick(this.sector, 1) / 2;
            }
        };

        /**
         * Returns the x, y coordinate of a point given by a value and a pixel
         * distance from center.
         *
         * @private
         *
         * @param {number} value
         * Point value.
         *
         * @param {number} [length]
         * Distance from center.
         *
         * @return {Highcharts.PositionObject}
         */
        axis.getPosition = function (
            value: number,
            length?: number
        ): PositionObject {
            const translatedVal = this.translate(value) as any;

            return this.postTranslate(
                this.isCircular ? translatedVal : this.angleRad, // #2848
                // In case when translatedVal is negative, the 0 value must be
                // used instead, in order to deal with lines and labels that
                // fall out of the visible range near the center of a pane
                pick(this.isCircular ?
                    length :
                    (translatedVal < 0 ? 0 : translatedVal), this.center[2] / 2
                ) - this.offset
            );
        };

        /**
         * Translate from intermediate plotX (angle), plotY (axis.len - radius)
         * to final chart coordinates.
         *
         * @private
         *
         * @param {number} angle
         * Translation angle.
         *
         * @param {number} radius
         * Translation radius.
         *
         * @return {Highcharts.PositionObject}
         */
        axis.postTranslate = function (
            angle: number,
            radius: number
        ): PositionObject {

            const chart = this.chart,
                center = this.center;

            angle = this.startAngleRad + angle;

            return {
                x: chart.plotLeft + center[0] + Math.cos(angle) * radius,
                y: chart.plotTop + center[1] + Math.sin(angle) * radius
            };

        };

        /**
         * Find the path for plot bands along the radial axis.
         *
         * @private
         *
         * @param {number} from
         * From value.
         *
         * @param {number} to
         * To value.
         *
         * @param {Highcharts.AxisPlotBandsOptions} options
         * Band options.
         *
         * @return {RadialAxisPath}
         */
        axis.getPlotBandPath = function (
            from: number,
            to: number,
            options: Highcharts.AxisPlotBandsOptions
        ): RadialAxisPath {

            const radiusToPixels = (radius: number|string|undefined): (number|undefined) => {
                if (typeof radius === 'string') {
                    let r = parseInt(radius, 10);
                    if (percentRegex.test(radius)) {
                        r = (r * fullRadius) / 100;
                    }
                    return r;
                }
                return radius;
            };

            let center = this.center,
                startAngleRad = this.startAngleRad,
                fullRadius = center[2] / 2,
                offset = Math.min(this.offset, 0),
                left = this.left || 0,
                top = this.top || 0,
                percentRegex = /%$/,
                start,
                end,
                angle,
                xOnPerimeter,
                open,
                isCircular = this.isCircular, // X axis in a polar chart
                path: RadialAxisPath,
                outerRadius = pick(
                    radiusToPixels(options.outerRadius),
                    fullRadius
                ),
                innerRadius = radiusToPixels(options.innerRadius),
                thickness = pick(radiusToPixels(options.thickness), 10);

            // Polygonal plot bands
            if (this.options.gridLineInterpolation === 'polygon') {
                path = this.getPlotLinePath({ value: from }).concat(
                    this.getPlotLinePath({ value: to, reverse: true })
                );

            // Circular grid bands
            } else {

                // Keep within bounds
                from = Math.max(from, this.min);
                to = Math.min(to, this.max);

                const transFrom = this.translate(from);
                const transTo = this.translate(to);

                // Plot bands on Y axis (radial axis) - inner and outer
                // radius depend on to and from
                if (!isCircular) {
                    outerRadius = transFrom || 0;
                    innerRadius = transTo || 0;
                }

                // Handle full circle
                if (options.shape === 'circle' || !isCircular) {
                    start = -Math.PI / 2;
                    end = Math.PI * 1.5;
                    open = true;
                } else {
                    start = startAngleRad + (transFrom || 0);
                    end = startAngleRad + (transTo || 0);
                }

                outerRadius -= offset; // #5283
                thickness -= offset; // #5283

                path = this.chart.renderer.symbols.arc(
                    left + center[0],
                    top + center[1],
                    outerRadius,
                    outerRadius,
                    {
                        // Math is for reversed yAxis (#3606)
                        start: Math.min(start, end),
                        end: Math.max(start, end),
                        innerR: pick(
                            innerRadius,
                            outerRadius - thickness
                        ),
                        open
                    }
                );

                // Provide positioning boxes for the label (#6406)
                if (isCircular) {
                    angle = (end + start) / 2;
                    xOnPerimeter = (
                        left +
                        center[0] +
                        (center[2] / 2) * Math.cos(angle)
                    );

                    path.xBounds = angle > -Math.PI / 2 && angle < Math.PI / 2 ?
                        // Right hemisphere
                        [xOnPerimeter, this.chart.plotWidth] :
                        // Left hemisphere
                        [0, xOnPerimeter];


                    path.yBounds = [
                        top + center[1] + (center[2] / 2) * Math.sin(angle)
                    ];
                    // Shift up or down to get the label clear of the perimeter
                    path.yBounds[0] += (
                        (angle > -Math.PI && angle < 0) ||
                        (angle > Math.PI)
                    ) ? -10 : 10;
                }
            }

            return path;
        };

        // Find the correct end values of crosshair in polar.
        axis.getCrosshairPosition = function (
            options: Highcharts.AxisPlotLinesOptions,
            x1: number,
            y1: number
        ): [(number | undefined), number, number] {
            let axis = this,
                value = options.value,
                center = axis.pane.center,
                shapeArgs,
                end,
                x2,
                y2;

            if (axis.isCircular) {
                if (!defined(value)) {
                    // When the snap is set to false
                    x2 = options.chartX || 0;
                    y2 = options.chartY || 0;

                    value = axis.translate(
                        Math.atan2(y2 - y1, x2 - x1) - axis.startAngleRad,
                        true
                    );
                } else if (options.point) {
                    // When the snap is set to true
                    shapeArgs = options.point.shapeArgs || {};
                    if (shapeArgs.start) {
                        // Find a true value of the point based on the
                        // angle
                        value = axis.chart.inverted ?
                            axis.translate(options.point.rectPlotY as any, true) :
                            options.point.x as any;
                    }
                }
                end = axis.getPosition(value as any);
                x2 = end.x;
                y2 = end.y;
            } else {
                if (!defined(value)) {
                    x2 = options.chartX;
                    y2 = options.chartY;
                }

                if (defined(x2) && defined(y2)) {
                    // Calculate radius of non-circular axis' crosshair
                    y1 = center[1] + axis.chart.plotTop;
                    value = axis.translate(Math.min(
                        Math.sqrt(
                            Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
                        ), center[2] / 2) - center[3] / 2, true);
                }
            }

            return [value, x2 || 0, y2 || 0];
        };

        // Find the path for plot lines perpendicular to the radial axis.
        axis.getPlotLinePath = function (
            options: Highcharts.AxisPlotLinesOptions
        ): SVGPath {
            let axis = this,
                center = axis.pane.center,
                chart = axis.chart,
                inverted = chart.inverted,
                value = options.value,
                reverse = options.reverse,
                end = axis.getPosition(value as any),
                background = axis.pane.options.background ?
                    (axis.pane.options.background[0] ||
                        axis.pane.options.background) :
                    {},
                innerRadius = background.innerRadius || '0%',
                outerRadius = background.outerRadius || '100%',
                x1 = center[0] + chart.plotLeft,
                y1 = center[1] + chart.plotTop,
                x2 = end.x,
                y2 = end.y,
                height = axis.height,
                isCrosshair = options.isCrosshair,
                paneInnerR = center[3] / 2,
                innerRatio,
                distance,
                a,
                b,
                otherAxis: (RadialAxis|undefined),
                xy: PositionObject,
                tickPositions: number[],
                crossPos,
                path: SVGPath;

            // Crosshair logic
            if (isCrosshair) {
                // Find crosshair's position and perform destructuring
                // assignment
                crossPos = this.getCrosshairPosition(options, x1, y1);
                value = crossPos[0];
                x2 = crossPos[1];
                y2 = crossPos[2];
            }

            // Spokes
            if (axis.isCircular) {
                distance =
                    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

                a = (typeof innerRadius === 'string') ?
                    relativeLength(innerRadius, 1) : (innerRadius / distance);
                b = (typeof outerRadius === 'string') ?
                    relativeLength(outerRadius, 1) : (outerRadius / distance);

                // To ensure that gridlines won't be displayed in area
                // defined by innerSize in case of custom radiuses of pane's
                // background
                if (center && paneInnerR) {
                    innerRatio = paneInnerR / distance;
                    if (a < innerRatio) {
                        a = innerRatio;
                    }
                    if (b < innerRatio) {
                        b = innerRatio;
                    }
                }

                path = [
                    ['M', x1 + a * (x2 - x1), y1 - a * (y1 - y2)],
                    ['L', x2 - (1 - b) * (x2 - x1), y2 + (1 - b) * (y1 - y2)]
                ];
                // Concentric circles
            } else {
                // Pick the right values depending if it is grid line or
                // crosshair
                value = axis.translate(value as any);

                // This is required in case when xAxis is non-circular to
                // prevent grid lines (or crosshairs, if enabled) from
                // rendering above the center after they supposed to be
                // displayed below the center point
                if (value) {
                    if (value < 0 || value > height) {
                        value = 0;
                    }
                }

                if (axis.options.gridLineInterpolation === 'circle') {
                    // A value of 0 is in the center, so it won't be
                    // visible, but draw it anyway for update and animation
                    // (#2366)
                    path = axis.getLinePath(0, value, paneInnerR);
                    // Concentric polygons
                } else {
                    path = [];

                    // Find the other axis (a circular one) in the same pane
                    chart[inverted ? 'yAxis' : 'xAxis'].forEach(
                        function (a): void {
                            if (a.pane === axis.pane) {
                                otherAxis = a as RadialAxis;
                            }
                        });

                    if (otherAxis) {
                        tickPositions = otherAxis.tickPositions;

                        if (otherAxis.autoConnect) {
                            tickPositions =
                                tickPositions.concat([tickPositions[0]]);
                        }

                        // Reverse the positions for concatenation of polygonal
                        // plot bands
                        if (reverse) {
                            tickPositions = tickPositions.slice().reverse();
                        }

                        if (value) {
                            value += paneInnerR;
                        }

                        for (let i = 0; i < tickPositions.length; i++) {
                            xy = otherAxis.getPosition(tickPositions[i], value);
                            path.push(
                                i ? ['L', xy.x, xy.y] : ['M', xy.x, xy.y]
                            );
                        }
                    }
                }
            }

            return path;
        };

        // Find the position for the axis title, by default inside the gauge.
        axis.getTitlePosition = function (): PositionObject {
            const center = this.center,
                chart = this.chart,
                titleOptions = this.options.title;

            return {
                x: chart.plotLeft + center[0] + ((titleOptions as any).x || 0),
                y: (
                    chart.plotTop +
                    center[1] -
                    (
                        ({
                            high: 0.5,
                            middle: 0.25,
                            low: 0
                        } as Record<string, number>)[
                            (titleOptions as any).align
                        ] *
                        center[2]
                    ) +
                    ((titleOptions as any).y || 0)
                )
            };
        };

        /**
         * Attach and return collecting function for labels in radial axis for
         * anti-collision.
         *
         * @private
         *
         * @return {Highcharts.ChartLabelCollectorFunction}
         */
        axis.createLabelCollector = function (): Chart.LabelCollectorFunction {
            const axis = this;

            return function (
                this: null
            ): (Array<(SVGElement|undefined)>|undefined) {

                if (
                    axis.isRadial &&
                    axis.tickPositions &&
                    // undocumented option for now, but working
                    axis.options.labels &&
                    axis.options.labels.allowOverlap !== true
                ) {
                    return axis.tickPositions
                        .map(function (
                            pos: number
                        ): (SVGElement|undefined) {
                            return axis.ticks[pos] && axis.ticks[pos].label;
                        })
                        .filter(function (
                            label: (SVGElement|undefined)
                        ): boolean {
                            return Boolean(label);
                        });
                }
            };
        };
    }

    /**
     * Augments methods for the value axis.
     *
     * @private
     *
     * @param {Highcharts.Axis} AxisClass
     * Axis class to extend.
     *
     * @param {Highcharts.Tick} TickClass
     * Tick class to use.
     */
    public static compose(AxisClass: typeof Axis, TickClass: typeof Tick): void {

        /* eslint-disable no-invalid-this */

        // Actions before axis init.
        addEvent(AxisClass, 'init', function (e: { userOptions: RadialAxisOptions }): void {
            const axis = this as RadialAxis,
                chart = axis.chart;

            let inverted = chart.inverted,
                angular = chart.angular,
                polar = chart.polar,
                isX = axis.isXAxis,
                coll = axis.coll,
                isHidden = angular && isX,
                isCircular: (boolean|undefined),
                chartOptions = chart.options,
                paneIndex = e.userOptions.pane || 0,
                pane = axis.pane = chart.pane && chart.pane[paneIndex] as any;

            // Prevent changes for colorAxis
            if (coll === 'colorAxis') {
                this.isRadial = false;
                return;
            }

            // Before prototype.init
            if (angular) {

                if (isHidden) {
                    HiddenAxis.init(axis as HiddenAxis);
                } else {
                    RadialAxis.init(axis);
                }
                isCircular = !isX;
                if (isCircular) {
                    axis.defaultPolarOptions = RadialAxis.defaultRadialGaugeOptions;
                }

            } else if (polar) {
                RadialAxis.init(axis);

                // Check which axis is circular
                isCircular = axis.horiz;

                axis.defaultPolarOptions = isCircular ?
                    RadialAxis.defaultCircularOptions :
                    merge(
                        coll === 'xAxis' ?
                            AxisDefaults.defaultXAxisOptions :
                            AxisDefaults.defaultYAxisOptions,
                        RadialAxis.defaultRadialOptions
                    );

                // Apply the stack labels for yAxis in case of inverted chart
                if (inverted && coll === 'yAxis') {
                    axis.defaultPolarOptions.stackLabels = AxisDefaults.defaultYAxisOptions.stackLabels;
                    axis.defaultPolarOptions.reversedStacks = true;
                }
            }

            // Disable certain features on angular and polar axes
            if (angular || polar) {
                axis.isRadial = true;
                //// (chartOptions.chart as any).zoomType = null as any;

                if (!axis.labelCollector) {
                    axis.labelCollector = axis.createLabelCollector();
                }
                if (axis.labelCollector) {
                    // Prevent overlapping axis labels (#9761)
                    chart.labelCollectors.push(
                        axis.labelCollector as Chart.LabelCollectorFunction
                    );
                }
            } else {
                this.isRadial = false;
            }

            // A pointer back to this axis to borrow geometry
            if (pane && isCircular) {
                pane.axis = axis;
            }

            axis.isCircular = isCircular;

        });

        addEvent(AxisClass, 'afterInit', function (): void {
            const axis = this as RadialAxis;

            const chart = axis.chart,
                options = axis.options,
                isHidden = chart.angular && axis.isXAxis,
                pane = axis.pane,
                paneOptions = pane && pane.options;

            if (!isHidden && pane && (chart.angular || chart.polar)) {

                // Start and end angle options are given in degrees relative to
                // top, while internal computations are in radians relative to
                // right (like SVG).

                // Y axis in polar charts
                axis.angleRad = (options.angle || 0) * Math.PI / 180;
                // Gauges
                axis.startAngleRad =
                    ((paneOptions.startAngle as any) - 90) * Math.PI / 180;
                axis.endAngleRad = (pick(
                    paneOptions.endAngle, (paneOptions.startAngle as any) + 360
                ) - 90) * Math.PI / 180; // Gauges
                axis.offset = options.offset || 0;

            }

        });

        // Wrap auto label align to avoid setting axis-wide rotation on radial
        // axes. (#4920)
        addEvent(AxisClass, 'autoLabelAlign', function (e: RadialAutoAlignEvent): void {
            if (this.isRadial) {
                e.align = void 0;
                e.preventDefault();
            }
        });

        // Remove label collector function on axis remove/update
        addEvent(AxisClass, 'destroy', function (): void {
            const axis = this as RadialAxis;

            if (
                axis.chart &&
                axis.chart.labelCollectors
            ) {
                const index = (
                    axis.labelCollector ?
                        axis.chart.labelCollectors.indexOf(
                            axis.labelCollector
                        ) :
                        -1
                );

                if (index >= 0) {
                    axis.chart.labelCollectors.splice(index, 1);
                }
            }
        });

        addEvent(AxisClass, 'initialAxisTranslation', function (): void {
            const axis = this as RadialAxis;

            if (axis.isRadial) {
                axis.beforeSetTickPositions();
            }
        });

        // Add special cases within the Tick class' methods for radial axes.
        addEvent(TickClass, 'afterGetPosition', function (e: RadialAfterGetPositionEvent): void {
            const tick = this as RadialTick;

            if (tick.axis.getPosition) {
                extend(e.pos, tick.axis.getPosition(this.pos));
            }
        });

        // Find the center position of the label based on the distance option.
        addEvent(TickClass, 'afterGetLabelPosition', function (e: RadialAfterGetPositionEvent): void {
            const tick = this,
                axis = tick.axis as RadialAxis,
                label = tick.label;

            if (!label) {
                return;
            }

            let labelBBox = label.getBBox(),
                labelOptions = axis.options.labels as any,
                optionsY = labelOptions.y,
                ret,
                centerSlot = 20, // 20 degrees to each side at the top and bottom
                align = labelOptions.align,
                angle = (
                    (
                        (axis.translate(this.pos) as any) + axis.startAngleRad +
                        Math.PI / 2
                    ) / Math.PI * 180
                ) % 360,
                correctAngle = Math.round(angle),
                labelDir = 'end', // Direction of the label 'start' or 'end'
                reducedAngle1 = correctAngle < 0 ?
                    correctAngle + 360 : correctAngle,
                reducedAngle2 = reducedAngle1,
                translateY = 0,
                translateX = 0,
                labelYPosCorrection =
                    !defined(optionsY) ? -labelBBox.height * 0.3 : 0;

            if (axis.isRadial) { // Both X and Y axes in a polar chart
                ret = axis.getPosition(
                    this.pos,
                    (axis.center[2] / 2) +
                        relativeLength(
                            pick(labelOptions.distance, -25),
                            axis.center[2] / 2,
                            -axis.center[2] / 2
                        )
                );

                // Automatically rotated
                if (labelOptions.rotation === 'auto') {
                    label.attr({
                        rotation: angle
                    });

                // Vertically centered
                } else if (!defined(optionsY)) {
                    optionsY = (
                        axis.chart.renderer
                            .fontMetrics(label.styles && label.styles.fontSize).b -
                            labelBBox.height / 2
                    );
                }

                // Automatic alignment
                if (!defined(align)) {
                    if (axis.isCircular) { // Y axis
                        if (
                            labelBBox.width >
                            axis.len * axis.tickInterval / (axis.max - axis.min)
                        ) { // #3506
                            centerSlot = 0;
                        }
                        if (angle > centerSlot && angle < 180 - centerSlot) {
                            align = 'left'; // right hemisphere
                        } else if (
                            angle > 180 + centerSlot &&
                            angle < 360 - centerSlot
                        ) {
                            align = 'right'; // left hemisphere
                        } else {
                            align = 'center'; // top or bottom
                        }
                    } else {
                        align = 'center';
                    }
                    label.attr({
                        align: align
                    });
                }

                // Auto alignment for solid-gauges with two labels (#10635)
                if (
                    align as any === 'auto' &&
                    axis.tickPositions.length === 2 &&
                    axis.isCircular
                ) {
                    // Angles reduced to 0 - 90 or 180 - 270
                    if (reducedAngle1 > 90 && reducedAngle1 < 180) {
                        reducedAngle1 = 180 - reducedAngle1;
                    } else if (reducedAngle1 > 270 && reducedAngle1 <= 360) {
                        reducedAngle1 = 540 - reducedAngle1;
                    }

                    // Angles reduced to 0 - 180
                    if (reducedAngle2 > 180 && reducedAngle2 <= 360) {
                        reducedAngle2 = 360 - reducedAngle2;
                    }

                    if (
                        (axis.pane.options.startAngle === correctAngle) ||
                        (axis.pane.options.startAngle === correctAngle + 360) ||
                        (axis.pane.options.startAngle === correctAngle - 360)
                    ) {
                        labelDir = 'start';
                    }

                    if (
                        (correctAngle >= -90 && correctAngle <= 90) ||
                        (correctAngle >= -360 && correctAngle <= -270) ||
                        (correctAngle >= 270 && correctAngle <= 360)
                    ) {
                        align = (labelDir === 'start') ? 'right' : 'left';
                    } else {
                        align = (labelDir === 'start') ? 'left' : 'right';
                    }

                    // For angles beetwen (90 + n * 180) +- 20
                    if (reducedAngle2 > 70 && reducedAngle2 < 110) {
                        align = 'center';
                    }

                    // auto Y translation
                    if (
                        reducedAngle1 < 15 ||
                        (reducedAngle1 >= 180 && reducedAngle1 < 195)
                    ) {
                        translateY = labelBBox.height * 0.3;
                    } else if (reducedAngle1 >= 15 && reducedAngle1 <= 35) {
                        translateY = labelDir === 'start' ?
                            0 : labelBBox.height * 0.75;
                    } else if (reducedAngle1 >= 195 && reducedAngle1 <= 215) {
                        translateY = labelDir === 'start' ?
                            labelBBox.height * 0.75 : 0;
                    } else if (reducedAngle1 > 35 && reducedAngle1 <= 90) {
                        translateY = labelDir === 'start' ?
                            -labelBBox.height * 0.25 : labelBBox.height;
                    } else if (reducedAngle1 > 215 && reducedAngle1 <= 270) {
                        translateY = labelDir === 'start' ?
                            labelBBox.height : -labelBBox.height * 0.25;
                    }

                    // auto X translation
                    if (reducedAngle2 < 15) {
                        translateX = labelDir === 'start' ?
                            -labelBBox.height * 0.15 : labelBBox.height * 0.15;
                    } else if (reducedAngle2 > 165 && reducedAngle2 <= 180) {
                        translateX = labelDir === 'start' ?
                            labelBBox.height * 0.15 : -labelBBox.height * 0.15;
                    }

                    label.attr({ align: align });
                    label.translate(translateX, translateY + labelYPosCorrection);
                }

                e.pos.x = ret.x + (labelOptions.x || 0);
                e.pos.y = ret.y + (optionsY || 0);

            }
        });

        // Wrap the getMarkPath function to return the path of the radial marker
        wrap(TickClass.prototype, 'getMarkPath', function (
            this: Tick,
            proceed: Function,
            x: number,
            y: number,
            tickLength: number,
            tickWidth: number,
            horiz: boolean,
            renderer: SVGRenderer
        ): SVGPath {
            const tick = this;
            const axis = tick.axis as RadialAxis;

            let endPoint,
                ret;

            if (axis.isRadial) {
                endPoint = axis.getPosition(
                    this.pos,
                    axis.center[2] / 2 + tickLength
                );
                ret = [
                    'M',
                    x,
                    y,
                    'L',
                    endPoint.x,
                    endPoint.y
                ];
            } else {
                ret = proceed.call(
                    this,
                    x,
                    y,
                    tickLength,
                    tickWidth,
                    horiz,
                    renderer
                );
            }
            return ret;
        });
    }
}

interface RadialAfterGetPositionEvent extends Event {
    pos: PositionObject;
}

interface RadialAutoAlignEvent extends Event {
    align?: string;
}

interface RadialAxis extends Axis {
    angleRad: number;
    autoConnect?: boolean;
    center: Array<number>;
    defaultPolarOptions: DeepPartial<RadialAxisOptions>;
    endAngleRad: number;
    isCircular?: boolean;
    labelCollector?: Chart.LabelCollectorFunction;
    max: number;
    min: number;
    minPointOffset: number;
    offset: number;
    options: RadialAxisOptions;
    pane: Pane;
    isRadial: true;
    sector?: number;
    startAngleRad: number;
    createLabelCollector(): Chart.LabelCollectorFunction;
    beforeSetTickPositions(): void;
    getCrosshairPosition(
        options: Highcharts.AxisPlotLinesOptions,
        x1: number,
        y1: number
    ): [(number | undefined), number, number];
    getLinePath(
        lineWidth: number,
        radius?: number,
        innerRadius?: number
    ): SVGPath;
    getOffset(): void;
    getPlotBandPath(
        from: number,
        to: number,
        options: Highcharts.AxisPlotBandsOptions
    ): RadialAxisPath;
    getPlotLinePath(options: Highcharts.AxisPlotLinesOptions): SVGPath;
    getPosition(
        value: number,
        length?: number
    ): PositionObject;
    getTitlePosition(): PositionObject;
    postTranslate(
        angle: number,
        radius: number
    ): PositionObject;
    setAxisSize(): void;
    setAxisTranslation(): void;
    setOptions(userOptions: DeepPartial<RadialAxisOptions>): void;
}

interface RadialAxisOptions extends YAxisOptions {
}

interface RadialAxisPath extends SVGPath {
    xBounds?: Array<number>;
    yBounds?: Array<number>;
}

interface RadialTick extends Tick {
    axis: RadialAxis;
}

RadialAxis.compose(Axis, Tick); // @todo move outside

export default RadialAxis;
