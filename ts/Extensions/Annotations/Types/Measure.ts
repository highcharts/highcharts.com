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

import type AnnotationChart from '../AnnotationChart';
import type {
    AnnotationDraggableValue,
    AnnotationOptions,
    AnnotationTypeOptions
} from '../AnnotationOptions';
import type { AnnotationEventObject } from '../EventEmitter';
import type Axis from '../../../Core/Axis/Axis';
import type Controllable from '../Controllables/Controllable';
import type {
    ControllableLabelOptions,
    ControllableShapeOptions
} from '../Controllables/ControllableOptions';
import type CSSObject from '../../../Core/Renderer/CSSObject';
import type DashStyleValue from '../../../Core/Renderer/DashStyleValue';
import type Templating from '../../../Core/Templating';
import type MockPointOptions from '../MockPointOptions';
import type Point from '../../../Core/Series/Point';
import type PositionObject from '../../../Core/Renderer/PositionObject';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';

import Annotation from '../Annotation.js';
import ControlPoint from '../ControlPoint.js';
import U from '../../../Shared/Utilities.js';
const {
    pick
} = U;
import { Palette } from '../../../Core/Color/Palettes.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined, extend, merge } = OH;

/* *
 *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function average(
    this: Measure
): (''|number) {
    let average: (''|number) = '';

    if (this.max !== '' && this.min !== '') {
        average = (this.max + this.min) / 2;
    }

    return average;
}

/**
 * @private
 */
function bins(
    this: Measure
): (''|number) {
    const series = this.chart.series,
        ext = getExtremes(
            this.xAxisMin,
            this.xAxisMax,
            this.yAxisMin,
            this.yAxisMax
        );

    let bins: (''|number) = 0,
        isCalculated = false; // to avoid Infinity in formatter

    series.forEach((serie): void => {
        if (
            serie.visible &&
            serie.options.id !== 'highcharts-navigator-series'
        ) {
            serie.points.forEach((point): void => {
                if (
                    !point.isNull &&
                    (point.x as any) > ext.xAxisMin &&
                    (point.x as any) <= ext.xAxisMax &&
                    (point.y as any) > ext.yAxisMin &&
                    (point.y as any) <= ext.yAxisMax
                ) {
                    (bins as any)++;
                    isCalculated = true;
                }
            });
        }
    });

    if (!isCalculated) {
        bins = '';
    }

    return bins;
}

/**
 * Default formatter of label's content
 * @private
 */
function defaultFormatter(
    this: Measure
): string {
    return 'Min: ' + this.min +
        '<br>Max: ' + this.max +
        '<br>Average: ' + this.average +
        '<br>Bins: ' + this.bins;
}

/**
 * Set values for xAxisMin, xAxisMax, yAxisMin, yAxisMax, also
 * when chart is inverted
 * @private
 */
function getExtremes(
    xAxisMin: number,
    xAxisMax: number,
    yAxisMin: number,
    yAxisMax: number
): Record<string, number> {
    return {
        xAxisMin: Math.min(xAxisMax, xAxisMin),
        xAxisMax: Math.max(xAxisMax, xAxisMin),
        yAxisMin: Math.min(yAxisMax, yAxisMin),
        yAxisMax: Math.max(yAxisMax, yAxisMin)
    };
}

/**
 * Set current xAxisMin, xAxisMax, yAxisMin, yAxisMax.
 * Calculations of measure values (min, max, average, bins).
 * @private
 * @param {Highcharts.Axis} axis
 *        X or y axis reference
 * @param {number} value
 *        Point's value (x or y)
 * @param {number} offset
 *        Amount of pixels
 */
function getPointPos(
    axis: Axis,
    value: number,
    offset: number
): number {
    return axis.toValue(axis.toPixels(value) + offset);
}

/**
 * Set starting points
 * @private
 */
function init(
    this: Measure
): void {
    const options = this.options.typeOptions,
        chart = this.chart,
        inverted = chart.inverted,
        xAxis = chart.xAxis[options.xAxis],
        yAxis = chart.yAxis[options.yAxis],
        bck = options.background,
        width: number = inverted ? bck.height : bck.width as any,
        height: number = inverted ? bck.width : bck.height as any,
        selectType = options.selectType,
        top = inverted ? xAxis.left : yAxis.top, // #13664
        left = inverted ? yAxis.top : xAxis.left; // #13664

    this.startXMin = options.point.x;
    this.startYMin = options.point.y;

    if (isNumber(width)) {
        this.startXMax = this.startXMin + width;
    } else {
        this.startXMax = getPointPos(
            xAxis,
            this.startXMin,
            parseFloat(width)
        );
    }

    if (isNumber(height)) {
        this.startYMax = this.startYMin - height;
    } else {
        this.startYMax = getPointPos(
            yAxis,
            this.startYMin,
            parseFloat(height)
        );
    }

    // x / y selection type
    if (selectType === 'x') {
        this.startYMin = yAxis.toValue(top);
        this.startYMax = yAxis.toValue(top + yAxis.len);
    } else if (selectType === 'y') {
        this.startXMin = xAxis.toValue(left);
        this.startXMax = xAxis.toValue(left + xAxis.len);
    }

}

/**
 * @private
 */
function max(
    this: Measure
): (''|number) {
    const series = this.chart.series,
        ext = getExtremes(
            this.xAxisMin,
            this.xAxisMax,
            this.yAxisMin,
            this.yAxisMax
        );

    let max: (''|number) = -Infinity,
        isCalculated = false; // to avoid Infinity in formatter

    series.forEach((serie): void => {
        if (
            serie.visible &&
            serie.options.id !== 'highcharts-navigator-series'
        ) {
            serie.points.forEach((point): void => {
                if (
                    !point.isNull &&
                    (point.y as any) > max &&
                    (point.x as any) > ext.xAxisMin &&
                    (point.x as any) <= ext.xAxisMax &&
                    (point.y as any) > ext.yAxisMin &&
                    (point.y as any) <= ext.yAxisMax
                ) {
                    max = point.y as any;
                    isCalculated = true;
                }
            });
        }
    });

    if (!isCalculated) {
        max = '';
    }

    return max;
}

/**
 * Definitions of calculations (min, max, average, bins)
 * @private
 */
function min(
    this: Measure
): (''|number) {
    const series = this.chart.series,
        ext = getExtremes(
            this.xAxisMin,
            this.xAxisMax,
            this.yAxisMin,
            this.yAxisMax
        );

    let min: (''|number) = Infinity,
        isCalculated = false; // to avoid Infinity in formatter

    series.forEach((serie): void => {
        if (
            serie.visible &&
            serie.options.id !== 'highcharts-navigator-series'
        ) {
            serie.points.forEach((point: Point): void => {
                if (
                    !point.isNull &&
                    (point.y as any) < min &&
                    (point.x as any) > ext.xAxisMin &&
                    (point.x as any) <= ext.xAxisMax &&
                    (point.y as any) > ext.yAxisMin &&
                    (point.y as any) <= ext.yAxisMax
                ) {
                    min = point.y as any;
                    isCalculated = true;
                }
            });
        }
    });

    if (!isCalculated) {
        min = '';
    }

    return min;
}

/**
 * Set current xAxisMin, xAxisMax, yAxisMin, yAxisMax.
 * Calculations of measure values (min, max, average, bins).
 * @private
 * @param {boolean} [resize]
 *        Flag if shape is resized.
 */
function recalculate(
    this: Measure,
    resize?: boolean
): void {
    const options = this.options.typeOptions,
        xAxis = this.chart.xAxis[options.xAxis as any],
        yAxis = this.chart.yAxis[options.yAxis as any],
        offsetX = this.offsetX,
        offsetY = this.offsetY;

    this.xAxisMin = getPointPos(xAxis, this.startXMin, offsetX);
    this.xAxisMax = getPointPos(xAxis, this.startXMax, offsetX);
    this.yAxisMin = getPointPos(yAxis, this.startYMin, offsetY);
    this.yAxisMax = getPointPos(yAxis, this.startYMax, offsetY);

    this.min = min.call(this);
    this.max = max.call(this);
    this.average = average.call(this);
    this.bins = bins.call(this);

    if (resize) {
        this.resize(0, 0);
    }

}

/**
 * Update position of start points
 * (startXMin, startXMax, startYMin, startYMax)
 * @private
 * @param {boolean} redraw
 *        Flag if shape is redraw
 * @param {boolean} resize
 *        Flag if shape is resized
 * @param {number} cpIndex
 *        Index of controlPoint
 */
function updateStartPoints(
    this: Measure,
    redraw: boolean,
    resize: boolean,
    cpIndex: number,
    dx: number,
    dy: number
): void {
    const options = this.options.typeOptions,
        selectType = options.selectType,
        xAxis = this.chart.xAxis[options.xAxis as any],
        yAxis = this.chart.yAxis[options.yAxis as any],
        startXMin = this.startXMin,
        startXMax = this.startXMax,
        startYMin = this.startYMin,
        startYMax = this.startYMax,
        offsetX = this.offsetX,
        offsetY = this.offsetY;

    if (resize) {
        if (selectType === 'x') {
            if (cpIndex === 0) {
                this.startXMin = getPointPos(xAxis, startXMin, dx);
            } else {
                this.startXMax = getPointPos(xAxis, startXMax, dx);
            }
        } else if (selectType === 'y') {
            if (cpIndex === 0) {
                this.startYMin = getPointPos(yAxis, startYMin, dy);
            } else {
                this.startYMax = getPointPos(yAxis, startYMax, dy);
            }
        } else {
            this.startXMax = getPointPos(xAxis, startXMax, dx);
            this.startYMax = getPointPos(yAxis, startYMax, dy);
        }
    }

    if (redraw) {
        this.startXMin = getPointPos(xAxis, startXMin, offsetX);
        this.startXMax = getPointPos(xAxis, startXMax, offsetX);
        this.startYMin = getPointPos(yAxis, startYMin, offsetY);
        this.startYMax = getPointPos(yAxis, startYMax, offsetY);

        this.offsetX = 0;
        this.offsetY = 0;
    }

    this.options.typeOptions.point = {
        x: this.startXMin,
        y: this.startYMin
    };

    // We need to update userOptions as well as they are used in
    // the Annotation.update() method to initialize the annotation, #19121.
    this.userOptions.typeOptions.point = {
        x: this.startXMin,
        y: this.startYMin
    };
}

/* *
 *
 *  Class
 *
 * */

class Measure extends Annotation {

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Init annotation object.
     * @private
     */
    public init(
        annotationOrChart: (Annotation|AnnotationChart),
        userOptions: Measure.MeasureOptions,
        index?: number
    ): void {
        super.init(annotationOrChart, userOptions, index);

        this.offsetX = 0;
        this.offsetY = 0;
        this.resizeX = 0;
        this.resizeY = 0;

        init.call(this);
        this.addValues();
        this.addShapes();
    }

    /**
     * Overrides default setter to get axes from typeOptions.
     * @private
     */
    public setClipAxes(): void {
        this.clipXAxis = this.chart.xAxis[this.options.typeOptions.xAxis];
        this.clipYAxis = this.chart.yAxis[this.options.typeOptions.yAxis];
    }

    /**
     * Get measure points configuration objects.
     * @private
     */
    public pointsOptions(): Array<MockPointOptions> {
        return this.options.points as any;
    }

    /**
     * Get points configuration objects for shapes.
     * @private
     */
    public shapePointsOptions(): Array<MockPointOptions> {

        const options = this.options.typeOptions,
            xAxis = options.xAxis,
            yAxis = options.yAxis;

        return [
            {
                x: this.xAxisMin,
                y: this.yAxisMin,
                xAxis: xAxis,
                yAxis: yAxis
            },
            {
                x: this.xAxisMax,
                y: this.yAxisMin,
                xAxis: xAxis,
                yAxis: yAxis
            },
            {
                x: this.xAxisMax,
                y: this.yAxisMax,
                xAxis: xAxis,
                yAxis: yAxis
            },
            {
                x: this.xAxisMin,
                y: this.yAxisMax,
                xAxis: xAxis,
                yAxis: yAxis
            }
        ];
    }

    public addControlPoints(): void {
        const inverted = this.chart.inverted,
            options = this.options.controlPointOptions,
            selectType = this.options.typeOptions.selectType;

        if (!defined(
            this.userOptions.controlPointOptions &&
            this.userOptions.controlPointOptions.style.cursor
        )) {
            if (selectType === 'x') {
                options.style.cursor = inverted ? 'ns-resize' : 'ew-resize';
            } else if (selectType === 'y') {
                options.style.cursor = inverted ? 'ew-resize' : 'ns-resize';
            }
        }

        let controlPoint = new ControlPoint(
            this.chart,
            this as any,
            this.options.controlPointOptions,
            0
        );

        this.controlPoints.push(controlPoint);

        // add extra controlPoint for horizontal and vertical range
        if (selectType !== 'xy') {
            controlPoint = new ControlPoint(
                this.chart,
                this as any,
                this.options.controlPointOptions,
                1
            );

            this.controlPoints.push(controlPoint);
        }
    }

    /**
     * Add label with calculated values (min, max, average, bins).
     * @private
     * @param {boolean} [resize]
     * The flag for resize shape
     */
    public addValues(resize?: boolean): void {
        const typeOptions = this.options.typeOptions,
            formatter = typeOptions.label.formatter;

        // set xAxisMin, xAxisMax, yAxisMin, yAxisMax
        recalculate.call(this, resize);

        if (!typeOptions.label.enabled) {
            return;
        }

        if (this.labels.length > 0) {
            (this.labels[0] as any).text = (
                (formatter && formatter.call(this)) ||
                defaultFormatter.call(this)
            );

        } else {
            this.initLabel(extend<Partial<ControllableLabelOptions>>({
                shape: 'rect',
                backgroundColor: 'none',
                color: 'black',
                borderWidth: 0,
                dashStyle: 'Dash',
                overflow: 'allow',
                align: 'left',
                y: 0,
                x: 0,
                verticalAlign: 'top',
                crop: true,
                xAxis: 0,
                yAxis: 0,
                point: function (target: any): MockPointOptions {
                    const annotation: Measure = target.annotation,
                        options = target.options;

                    return {
                        x: annotation.xAxisMin,
                        y: annotation.yAxisMin,
                        xAxis: pick(typeOptions.xAxis, options.xAxis),
                        yAxis: pick(typeOptions.yAxis, options.yAxis)
                    };
                } as any,
                text: (
                    (formatter && formatter.call(this)) ||
                    defaultFormatter.call(this)
                )
            }, typeOptions.label as any), void 0 as any);
        }
    }

    /**
     * Crosshair, background (rect).
     * @private
     */
    public addShapes(): void {
        this.addCrosshairs();
        this.addBackground();
    }

    /**
     * Add background shape.
     * @private
     */
    public addBackground(): void {
        const shapePoints = this.shapePointsOptions();

        if (typeof shapePoints[0].x === 'undefined') {
            return;
        }

        this.initShape(
            extend<Partial<ControllableShapeOptions>>(
                {
                    type: 'path',
                    points: this.shapePointsOptions()
                },
                this.options.typeOptions.background
            ),
            2
        );
    }

    /**
     * Add internal crosshair shapes (on top and bottom).
     * @private
     */
    public addCrosshairs(): void {
        const chart = this.chart,
            options = this.options.typeOptions,
            point = this.options.typeOptions.point,
            xAxis = chart.xAxis[options.xAxis],
            yAxis = chart.yAxis[options.yAxis],
            inverted = chart.inverted,
            defaultOptions = {
                point: point,
                type: 'path'
            };

        let xAxisMin = xAxis.toPixels(this.xAxisMin),
            xAxisMax = xAxis.toPixels(this.xAxisMax),
            yAxisMin = yAxis.toPixels(this.yAxisMin),
            yAxisMax = yAxis.toPixels(this.yAxisMax),
            pathH: SVGPath = [],
            pathV: SVGPath = [],
            crosshairOptionsX,
            crosshairOptionsY,
            temp;

        if (inverted) {
            temp = xAxisMin;
            xAxisMin = yAxisMin;
            yAxisMin = temp;

            temp = xAxisMax;
            xAxisMax = yAxisMax;
            yAxisMax = temp;
        }
        // horizontal line
        if (options.crosshairX.enabled) {
            pathH = [[
                'M',
                xAxisMin,
                yAxisMin + ((yAxisMax - yAxisMin) / 2)
            ], [
                'L',
                xAxisMax,
                yAxisMin + ((yAxisMax - yAxisMin) / 2)
            ]];
        }

        // vertical line
        if (options.crosshairY.enabled) {
            pathV = [[
                'M',
                xAxisMin + ((xAxisMax - xAxisMin) / 2),
                yAxisMin
            ], [
                'L',
                xAxisMin + ((xAxisMax - xAxisMin) / 2),
                yAxisMax
            ]];
        }

        // Update existed crosshair
        if (this.shapes.length > 0) {

            this.shapes[0].options.d = pathH;
            this.shapes[1].options.d = pathV;

        } else {

            // Add new crosshairs
            crosshairOptionsX = merge(defaultOptions, options.crosshairX);
            crosshairOptionsY = merge(defaultOptions, options.crosshairY);

            this.initShape(
                extend<Partial<ControllableShapeOptions>>(
                    { d: pathH },
                    crosshairOptionsX
                ),
                0
            );

            this.initShape(
                extend<Partial<ControllableShapeOptions>>(
                    { d: pathV },
                    crosshairOptionsY
                ),
                1
            );

        }
    }

    public onDrag(e: AnnotationEventObject): void {
        const translation = this.mouseMoveToTranslation(e),
            selectType = this.options.typeOptions.selectType,
            x = selectType === 'y' ? 0 : translation.x,
            y = selectType === 'x' ? 0 : translation.y;

        this.translate(x, y);

        this.offsetX += x;
        this.offsetY += y;

        // animation, resize, setStartPoints
        this.redraw(false, false, true);
    }

    /**
     * Translate start or end ("left" or "right") side of the measure.
     * Update start points (startXMin, startXMax, startYMin, startYMax)
     * @private
     * @param {number} dx
     * the amount of x translation
     * @param {number} dy
     * the amount of y translation
     * @param {number} cpIndex
     * index of control point
     * @param {Highcharts.AnnotationDraggableValue} selectType
     * x / y / xy
     */
    public resize(
        dx: number,
        dy: number,
        cpIndex?: number,
        selectType?: AnnotationDraggableValue
    ): void {

        // background shape
        const bckShape = this.shapes[2];

        if (selectType === 'x') {
            if (cpIndex === 0) {
                bckShape.translatePoint(dx, 0, 0);
                bckShape.translatePoint(dx, dy, 3);
            } else {
                bckShape.translatePoint(dx, 0, 1);
                bckShape.translatePoint(dx, dy, 2);
            }
        } else if (selectType === 'y') {
            if (cpIndex === 0) {
                bckShape.translatePoint(0, dy, 0);
                bckShape.translatePoint(0, dy, 1);
            } else {
                bckShape.translatePoint(0, dy, 2);
                bckShape.translatePoint(0, dy, 3);
            }
        } else {
            bckShape.translatePoint(dx, 0, 1);
            bckShape.translatePoint(dx, dy, 2);
            bckShape.translatePoint(0, dy, 3);
        }

        updateStartPoints.call(this, false, true, cpIndex as any, dx, dy);

        this.options.typeOptions.background.height = Math.abs(
            this.startYMax - this.startYMin
        );

        this.options.typeOptions.background.width = Math.abs(
            this.startXMax - this.startXMin
        );
    }

    /**
     * Redraw event which render elements and update start points if needed.
     * @private
     * @param {boolean} animation
     * @param {boolean} [resize]
     * flag if resized
     * @param {boolean} [setStartPoints]
     * update position of start points
     */
    public redraw(
        animation: boolean,
        resize?: boolean,
        setStartPoints?: boolean
    ): void {

        this.linkPoints();

        if (!this.graphic) {
            this.render();
        }

        if (setStartPoints) {
            (updateStartPoints.call as any)(
                this,
                true,
                false as any
            );
        }

        // #11174 - clipBox was not recalculate during resize / redraw
        if (this.clipRect) {
            this.clipRect.animate(this.getClipBox() as any);
        }

        this.addValues(resize);
        this.addCrosshairs();
        this.redrawItems(this.shapes, animation);
        this.redrawItems(this.labels, animation);

        // redraw control point to run positioner
        this.controlPoints.forEach((controlPoint): void =>
            controlPoint.redraw()
        );
    }

    public translate(dx: number, dy: number): void {
        this.shapes.forEach((item): void =>
            item.translate(dx, dy)
        );
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Measure {
    average: (''|number);
    bins: (''|number);
    defaultOptions: Annotation['defaultOptions'];
    min: (''|number);
    max: (''|number);
    offsetX: number;
    offsetY: number;
    options: Measure.MeasureOptions;
    resizeX: number;
    resizeY: number;
    startXMax: number;
    startXMin: number;
    startYMax: number;
    startYMin: number;
    xAxisMin: number;
    xAxisMax: number;
    yAxisMin: number;
    yAxisMax: number;
}

Measure.prototype.defaultOptions = merge(
    Annotation.prototype.defaultOptions,
    /**
     * A measure annotation.
     *
     * @extends annotations.crookedLine
     * @excluding labels, labelOptions, shapes, shapeOptions
     * @sample highcharts/annotations-advanced/measure/
     *         Measure
     * @product highstock
     * @optionparent annotations.measure
     */
    {
        typeOptions: {
            /**
             * Decides in what dimensions the user can resize by dragging the
             * mouse. Can be one of x, y or xy.
             */
            selectType: 'xy',
            /**
             * This number defines which xAxis the point is connected to.
             * It refers to either the axis id or the index of the axis
             * in the xAxis array.
             */
            xAxis: 0,
            /**
             * This number defines which yAxis the point is connected to.
             * It refers to either the axis id or the index of the axis
             * in the yAxis array.
             */
            yAxis: 0,
            background: {
                /**
                 * The color of the rectangle.
                 */
                fill: 'rgba(130, 170, 255, 0.4)',
                /**
                 * The width of border.
                 */
                strokeWidth: 0,
                /**
                 * The color of border.
                 */
                stroke: void 0
            },
            /**
             * Configure a crosshair that is horizontally placed in middle of
             * rectangle.
             *
             */
            crosshairX: {
                /**
                 * Enable or disable the horizontal crosshair.
                 *
                 */
                enabled: true,
                /**
                 * The Z index of the crosshair in annotation.
                 */
                zIndex: 6,
                /**
                 * The dash or dot style of the crosshair's line. For possible
                 * values, see
                 * [this demonstration](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-dashstyle-all/).
                 *
                 * @type    {Highcharts.DashStyleValue}
                 * @default Dash
                 */
                dashStyle: 'Dash',
                /**
                 * The marker-end defines the arrowhead that will be drawn
                 * at the final vertex of the given crosshair's path.
                 *
                 * @type       {string}
                 * @default    arrow
                 */
                markerEnd: 'arrow'
            },
            /**
             * Configure a crosshair that is vertically placed in middle of
             * rectangle.
             */
            crosshairY: {
                /**
                 * Enable or disable the vertical crosshair.
                 *
                 */
                enabled: true,
                /**
                 * The Z index of the crosshair in annotation.
                 */
                zIndex: 6,
                /**
                 * The dash or dot style of the crosshair's line. For possible
                 * values, see
                 * [this demonstration](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-dashstyle-all/).
                 *
                 * @type      {Highcharts.DashStyleValue}
                 * @default   Dash
                 * @apioption annotations.measure.typeOptions.crosshairY.dashStyle
                 *
                 */
                dashStyle: 'Dash',
                /**
                 * The marker-end defines the arrowhead that will be drawn
                 * at the final vertex of the given crosshair's path.
                 *
                 * @type       {string}
                 * @default    arrow
                 * @validvalue ["none", "arrow"]
                 *
                 */
                markerEnd: 'arrow'
            },
            label: {
                /**
                 * Enable or disable the label text (min, max, average,
                 * bins values).
                 *
                 * Defaults to true.
                 */
                enabled: true,
                /**
                 * CSS styles for the measure label.
                 *
                 * @type    {Highcharts.CSSObject}
                 * @default {"color": "#666666", "fontSize": "11px"}
                 */
                style: {
                    fontSize: '0.7em',
                    color: Palette.neutralColor60
                },
                /**
                 * Formatter function for the label text.
                 *
                 * Available data are:
                 *
                 * <table>
                 *
                 * <tbody>
                 *
                 * <tr>
                 *
                 * <td>`this.min`</td>
                 *
                 * <td>The mininimum value of the points in the selected
                 * range.</td>
                 *
                 * </tr>
                 *
                 * <tr>
                 *
                 * <td>`this.max`</td>
                 *
                 * <td>The maximum value of the points in the selected
                 * range.</td>
                 *
                 * </tr>
                 *
                 * <tr>
                 *
                 * <td>`this.average`</td>
                 *
                 * <td>The average value of the points in the selected
                 * range.</td>
                 *
                 * </tr>
                 *
                 * <tr>
                 *
                 * <td>`this.bins`</td>
                 *
                 * <td>The amount of the points in the selected range.</td>
                 *
                 * </tr>
                 *
                 * </table>
                 *
                 * @type {Function}
                 *
                 */
                formatter: void 0
            }
        },
        controlPointOptions: {
            positioner: function (
                this: Controllable,
                target: Measure
            ): PositionObject {
                const cpIndex = this.index,
                    chart = target.chart,
                    options = target.options,
                    typeOptions = options.typeOptions,
                    selectType = typeOptions.selectType,
                    controlPointOptions = options.controlPointOptions,
                    inverted = chart.inverted,
                    xAxis = chart.xAxis[typeOptions.xAxis],
                    yAxis = chart.yAxis[typeOptions.yAxis],
                    ext = getExtremes(
                        target.xAxisMin,
                        target.xAxisMax,
                        target.yAxisMin,
                        target.yAxisMax
                    );

                let targetX = target.xAxisMax,
                    targetY = target.yAxisMax,
                    x, y;

                if (selectType === 'x') {
                    targetY = (ext.yAxisMax + ext.yAxisMin) / 2;

                    // first control point
                    if (cpIndex === 0) {
                        targetX = target.xAxisMin;
                    }
                }

                if (selectType === 'y') {
                    targetX = ext.xAxisMin +
                                        ((ext.xAxisMax - ext.xAxisMin) / 2);

                    // first control point
                    if (cpIndex === 0) {
                        targetY = target.yAxisMin;
                    }
                }

                if (inverted) {
                    x = yAxis.toPixels(targetY);
                    y = xAxis.toPixels(targetX);
                } else {
                    x = xAxis.toPixels(targetX);
                    y = yAxis.toPixels(targetY);
                }

                return {
                    x: x - (controlPointOptions.width / 2),
                    y: y - (controlPointOptions.height / 2)
                };
            },
            events: {
                drag: function (
                    this: Measure,
                    e: AnnotationEventObject,
                    target: Measure
                ): void {
                    const translation = this.mouseMoveToTranslation(e),
                        selectType = target.options.typeOptions.selectType,
                        index = this.index,
                        x = selectType === 'y' ? 0 : translation.x,
                        y = selectType === 'x' ? 0 : translation.y;

                    target.resize(
                        x,
                        y,
                        index,
                        selectType
                    );

                    target.resizeX += x;
                    target.resizeY += y;
                    (target.redraw as any)(false, true);
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

namespace Measure {
    export interface MeasureOptions extends AnnotationOptions {
        typeOptions: MeasureTypeOptions;
    }
    export interface MeasureTypeCrosshairOptions {
        dashStyle: DashStyleValue;
        enabled: boolean;
        markerEnd: string;
        zIndex: number;
    }
    export interface MeasureTypeLabelOptions {
        enabled: boolean;
        formatter?: Templating.FormatterCallback<Measure>;
        style: CSSObject;
    }
    export interface MeasureTypeOptions extends AnnotationTypeOptions {
        background: ControllableShapeOptions;
        crosshairX: MeasureTypeCrosshairOptions;
        crosshairY: MeasureTypeCrosshairOptions;
        label: MeasureTypeLabelOptions;
        selectType: AnnotationDraggableValue;
        xAxis: number;
        yAxis: number;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType'{
    interface AnnotationTypeRegistry {
        measure: typeof Measure;
    }
}

Annotation.types.measure = Measure as any;

/* *
 *
 *  Default Export
 *
 * */

export default Measure;
