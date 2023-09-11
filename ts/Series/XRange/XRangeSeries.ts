/* *
 *
 *  X-range series module
 *
 *  (c) 2010-2021 Torstein Honsi, Lars A. V. Cabrera
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

import type Axis from '../../Core/Axis/Axis';
import type ColumnMetricsObject from '../Column/ColumnMetricsObject';
import type SeriesClass from '../../Core/Series/Series';
import type { SeriesStateHoverOptions } from '../../Core/Series/SeriesOptions';
import type {
    XRangePointOptions,
    XRangePointPartialFillOptions
} from './XRangePointOptions';
import type XRangeSeriesOptions from './XRangeSeriesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';

import H from '../../Core/Globals.js';
const { noop } = H;
import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: seriesProto
    },
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
const {
    clamp,
    pick,
    relativeLength
} = U;
import XRangeSeriesDefaults from './XRangeSeriesDefaults.js';
import XRangePoint from './XRangePoint.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find,
    pushUnique
} = AH;
const { isNumber, isObject } = TC;
const { defined, extend, merge } = OH;
const { addEvent } = EH;

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
 * Max x2 should be considered in xAxis extremes
 * @private
 */
function onAxisAfterGetSeriesExtremes(
    this: Axis
): void {
    let dataMax: (number|undefined),
        modMax: (boolean|undefined);

    if (this.isXAxis) {
        dataMax = pick(this.dataMax, -Number.MAX_VALUE);
        for (const series of this.series as Array<XRangeSeries>) {
            if (series.x2Data) {
                for (const val of series.x2Data) {
                    if (val && val > dataMax) {
                        dataMax = val;
                        modMax = true;
                    }
                }
            }
        }
        if (modMax) {
            this.dataMax = dataMax;
        }
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.xrange
 *
 * @augments Highcharts.Series
 */

class XRangeSeries extends ColumnSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: XRangeSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        XRangeSeriesDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        AxisClass: typeof Axis
    ): void {

        if (pushUnique(composedMembers, AxisClass)) {
            addEvent(
                AxisClass,
                'afterGetSeriesExtremes',
                onAxisAfterGetSeriesExtremes
            );
        }

    }

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<XRangePoint> = void 0 as any;
    public options: XRangeSeriesOptions = void 0 as any;
    public points: Array<XRangePoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public init(): void {
        super.init.apply(this, arguments);
        this.options.stacking = void 0; // #13161
    }

    /**
     * Borrow the column series metrics, but with swapped axes. This gives
     * free access to features like groupPadding, grouping, pointWidth etc.
     * @private
     */
    public getColumnMetrics(): ColumnMetricsObject {
        const swapAxes = (): void => {
            for (const series of this.chart.series) {
                const xAxis = series.xAxis;
                series.xAxis = series.yAxis;
                series.yAxis = xAxis;
            }
        };

        swapAxes();

        const metrics = super.getColumnMetrics();

        swapAxes();

        return metrics;
    }

    /**
     * Override cropData to show a point where x or x2 is outside visible range,
     * but one of them is inside.
     * @private
     */
    public cropData(
        xData: Array<number>,
        yData: Array<number>,
        min: number,
        max: number
    ): SeriesClass.CropDataObject {

        // Replace xData with x2Data to find the appropriate cropStart
        const crop = seriesProto.cropData.call(
            this,
            this.x2Data as any,
            yData,
            min,
            max
        );

        // Re-insert the cropped xData
        crop.xData = xData.slice(crop.start, crop.end);

        return crop;
    }

    /**
     * Finds the index of an existing point that matches the given point
     * options.
     *
     * @private
     *
     * @param {Highcharts.XRangePointOptions} options
     *        The options of the point.
     *
     * @return {number|undefined}
     *         Returns index of a matching point, or undefined if no match is
     *         found.
     */
    public findPointIndex(options: XRangePointOptions): (number|undefined) {
        const { cropStart, points } = this;
        const { id } = options;
        let pointIndex: (number|undefined);

        if (id) {
            const point = find(points, (point): boolean => point.id === id);
            pointIndex = point ? point.index : void 0;
        }

        if (typeof pointIndex === 'undefined') {
            const point = find(points, (point): boolean => (
                point.x === options.x &&
                point.x2 === options.x2 &&
                !point.touched
            ));
            pointIndex = point ? point.index : void 0;
        }

        // Reduce pointIndex if data is cropped
        if (
            this.cropped &&
            isNumber(pointIndex) &&
            isNumber(cropStart) &&
            pointIndex >= cropStart
        ) {
            pointIndex -= cropStart;
        }

        return pointIndex;
    }

    public alignDataLabel(point: XRangePoint): void {
        const oldPlotX = point.plotX;
        point.plotX = pick(point.dlBox && point.dlBox.centerX, point.plotX);
        super.alignDataLabel.apply(this, arguments);
        point.plotX = oldPlotX;
    }

    /**
     * @private
     */
    public translatePoint(point: XRangePoint): void {
        const xAxis = this.xAxis,
            yAxis = this.yAxis,
            metrics = this.columnMetrics,
            options = this.options,
            minPointLength = options.minPointLength || 0,
            oldColWidth = (point.shapeArgs && point.shapeArgs.width || 0) / 2,
            seriesXOffset = this.pointXOffset = metrics.offset,
            posX = pick(point.x2, (point.x as any) + (point.len || 0)),
            borderRadius = options.borderRadius,
            plotTop = this.chart.plotTop,
            plotLeft = this.chart.plotLeft;


        let plotX = point.plotX,
            plotX2 = xAxis.translate(
                posX,
                0 as any,
                0 as any,
                0 as any,
                1 as any
            );

        const length = Math.abs((plotX2 as any) - (plotX as any)),
            inverted = this.chart.inverted,
            borderWidth = pick(options.borderWidth, 1),
            crisper = borderWidth % 2 / 2;

        let widthDifference,
            partialFill: (
                XRangePointPartialFillOptions|
                undefined
            ),
            yOffset = metrics.offset,
            pointHeight = Math.round(metrics.width),
            dlLeft,
            dlRight,
            dlWidth,
            clipRectWidth;

        if (minPointLength) {
            widthDifference = minPointLength - length;
            if (widthDifference < 0) {
                widthDifference = 0;
            }
            (plotX as any) -= widthDifference / 2;
            (plotX2 as any) += widthDifference / 2;
        }

        plotX = Math.max((plotX as any), -10);
        plotX2 = clamp(plotX2 as any, -10, xAxis.len + 10);

        // Handle individual pointWidth
        if (defined(point.options.pointWidth)) {
            yOffset -= (
                (Math.ceil(point.options.pointWidth) - pointHeight) / 2
            );
            pointHeight = Math.ceil(point.options.pointWidth);
        }

        // Apply pointPlacement to the Y axis
        if (
            options.pointPlacement &&
            isNumber(point.plotY) &&
            yAxis.categories
        ) {
            point.plotY = yAxis.translate(
                (point.y as any),
                0 as any,
                1 as any,
                0 as any,
                1 as any,
                options.pointPlacement as any
            );
        }

        const x = Math.floor(Math.min(plotX, plotX2)) + crisper,
            x2 = Math.floor(Math.max(plotX, plotX2)) + crisper,
            width = x2 - x;

        const r = Math.min(
            relativeLength((
                typeof borderRadius === 'object' ?
                    borderRadius.radius :
                    borderRadius || 0
            ), pointHeight),
            Math.min(width, pointHeight) / 2
        );

        const shapeArgs = {
            x,
            y: Math.floor((point.plotY as any) + yOffset) + crisper,
            width,
            height: pointHeight,
            r
        };

        point.shapeArgs = shapeArgs;

        // Move tooltip to default position
        if (!inverted) {
            (point.tooltipPos as any)[0] -= oldColWidth +
            seriesXOffset -
            shapeArgs.width / 2;
        } else {
            (point.tooltipPos as any)[1] += seriesXOffset +
            oldColWidth;
        }


        // Align data labels inside the shape and inside the plot area
        dlLeft = shapeArgs.x;
        dlRight = dlLeft + shapeArgs.width;
        if (dlLeft < 0 || dlRight > xAxis.len) {
            dlLeft = clamp(dlLeft, 0, xAxis.len);
            dlRight = clamp(dlRight, 0, xAxis.len);
            dlWidth = dlRight - dlLeft;
            point.dlBox = merge(shapeArgs, {
                x: dlLeft,
                width: dlRight - dlLeft,
                centerX: dlWidth ? dlWidth / 2 : null
            }) as any;

        } else {
            point.dlBox = null as any;
        }

        // Tooltip position
        const tooltipPos: number[] = (point.tooltipPos as any);
        const xIndex = !inverted ? 0 : 1;
        const yIndex = !inverted ? 1 : 0;

        const tooltipYOffset = (
            this.columnMetrics ?
                this.columnMetrics.offset :
                -metrics.width / 2
        );

        // Centering tooltip position (#14147)
        if (inverted) {
            tooltipPos[xIndex] += shapeArgs.width / 2;
        } else {
            tooltipPos[xIndex] = clamp(
                tooltipPos[xIndex] +
                (xAxis.reversed ? -1 : 0) * shapeArgs.width,
                xAxis.left - plotLeft,
                xAxis.left + xAxis.len - plotLeft - 1
            );
        }
        tooltipPos[yIndex] = clamp(
            tooltipPos[yIndex] + (
                (inverted ? -1 : 1) * tooltipYOffset
            ),
            yAxis.top - plotTop,
            yAxis.top + yAxis.len - plotTop - 1
        );

        // Add a partShapeArgs to the point, based on the shapeArgs property
        partialFill = point.partialFill;
        if (partialFill) {
        // Get the partial fill amount
            if (isObject(partialFill)) {
                partialFill = partialFill.amount as any;
            }
            // If it was not a number, assume 0
            if (!isNumber(partialFill)) {
                partialFill = 0 as any;
            }

            point.partShapeArgs = merge(shapeArgs);

            clipRectWidth = Math.max(
                Math.round(
                    length * (partialFill as any) + (point.plotX as any) -
                    plotX
                ),
                0
            );
            point.clipRectArgs = {
                x: xAxis.reversed ? // #10717
                    shapeArgs.x + length - clipRectWidth :
                    shapeArgs.x,
                y: shapeArgs.y,
                width: clipRectWidth,
                height: shapeArgs.height
            };
        }
    }

    /**
     * @private
     */
    public translate(): void {
        super.translate.apply(this, arguments);

        for (const point of this.points) {
            this.translatePoint(point);
        }
    }

    /**
     * Draws a single point in the series. Needed for partial fill.
     *
     * This override turns point.graphic into a group containing the
     * original graphic and an overlay displaying the partial fill.
     *
     * @private
     *
     * @param {Highcharts.Point} point
     *        An instance of Point in the series.
     *
     * @param {"animate"|"attr"} verb
     *        'animate' (animates changes) or 'attr' (sets options)
     */
    public drawPoint(
        point: XRangePoint,
        verb: string
    ): void {
        const seriesOpts = this.options,
            renderer = this.chart.renderer,
            type = point.shapeType,
            shapeArgs = point.shapeArgs,
            partShapeArgs = point.partShapeArgs,
            clipRectArgs = point.clipRectArgs,
            cutOff = seriesOpts.stacking && !seriesOpts.borderRadius,
            pointState = point.state,
            stateOpts: SeriesStateHoverOptions = (
                (seriesOpts.states as any)[pointState || 'normal'] ||
                {}
            ),
            pointStateVerb = typeof pointState === 'undefined' ?
                'attr' : verb,
            pointAttr = this.pointAttribs(point, pointState),
            animation = pick(
                this.chart.options.chart.animation,
                stateOpts.animation
            );

        let graphic = point.graphic,
            pfOptions = point.partialFill;

        if (!point.isNull && point.visible !== false) {

            // Original graphic
            if (graphic) { // update
                graphic.rect[verb](shapeArgs);
            } else {
                point.graphic = graphic = renderer.g('point')
                    .addClass(point.getClassName())
                    .add(point.group || this.group);

                graphic.rect = (renderer as any)[type](merge(shapeArgs))
                    .addClass(point.getClassName())
                    .addClass('highcharts-partfill-original')
                    .add(graphic);
            }

            // Partial fill graphic
            if (partShapeArgs) {
                if (graphic.partRect) {
                    graphic.partRect[verb](
                        merge(partShapeArgs)
                    );
                    graphic.partialClipRect[verb](
                        merge(clipRectArgs)
                    );

                } else {

                    graphic.partialClipRect = renderer.clipRect(
                        (clipRectArgs as any).x,
                        (clipRectArgs as any).y,
                        (clipRectArgs as any).width,
                        (clipRectArgs as any).height
                    );

                    graphic.partRect =
                        (renderer as any)[type](partShapeArgs)
                            .addClass('highcharts-partfill-overlay')
                            .add(graphic)
                            .clip(graphic.partialClipRect);
                }
            }


            // Presentational
            if (!this.chart.styledMode) {
                graphic
                    .rect[verb](
                        pointAttr,
                        animation
                    )
                    .shadow(seriesOpts.shadow);

                if (partShapeArgs) {
                    // Ensure pfOptions is an object
                    if (!isObject(pfOptions)) {
                        pfOptions = {};
                    }
                    if (isObject(seriesOpts.partialFill)) {
                        pfOptions = merge(
                            seriesOpts.partialFill, pfOptions
                        );
                    }

                    const fill = (
                        pfOptions.fill ||
                        color(pointAttr.fill).brighten(-0.3).get() ||
                        color(point.color || this.color)
                            .brighten(-0.3).get()
                    );

                    pointAttr.fill = fill;
                    graphic
                        .partRect[pointStateVerb](
                            pointAttr,
                            animation
                        )
                        .shadow(seriesOpts.shadow);
                }
            }

        } else if (graphic) {
            point.graphic = graphic.destroy(); // #1269
        }
    }

    /**
     * @private
     */
    public drawPoints(): void {
        const verb = this.getAnimationVerb();

        // Draw the columns
        for (const point of this.points) {
            this.drawPoint(point, verb);
        }
    }

    /**
     * Returns "animate", or "attr" if the number of points is above the
     * animation limit.
     *
     * @private
     */
    public getAnimationVerb(): string {
        return (
            this.chart.pointCount < (this.options.animationLimit || 250) ?
                'animate' :
                'attr'
        );
    }

    /**
     * @private
     */
    public isPointInside(
        point: (XRangePoint|Record<string, number>)
    ): boolean {
        const shapeArgs = point.shapeArgs as SVGAttributes,
            plotX = point.plotX,
            plotY = point.plotY;

        if (!shapeArgs) {
            return super.isPointInside.apply(this, arguments);
        }

        const isInside =
            typeof plotX !== 'undefined' &&
            typeof plotY !== 'undefined' &&
            plotY >= 0 &&
            plotY <= this.yAxis.len &&
            (shapeArgs.x || 0) + (shapeArgs.width || 0) >= 0 &&
            plotX <= this.xAxis.len;

        return isInside;
    }

    /*
    // Override to remove stroke from points. For partial fill.
    pointAttribs: function () {
        let series = this,
            retVal = columnType.prototype.pointAttribs
                .apply(series, arguments);

        //retVal['stroke-width'] = 0;
        return retVal;
    }
    //*/

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 * Class Properties
 *
 * */

interface XRangeSeries {
    pointClass: typeof XRangePoint;
    columnMetrics: ColumnMetricsObject;
    cropShoulder: number;
    getExtremesFromAll: boolean;
    parallelArrays: Array<string>;
    requireSorting: boolean;
    type: string;
    x2Data: Array<(number|undefined)>;
    animate: typeof seriesProto.animate;
}

extend(XRangeSeries.prototype, {
    pointClass: XRangePoint,
    cropShoulder: 1,
    getExtremesFromAll: true,
    parallelArrays: ['x', 'x2', 'y'],
    requireSorting: false,
    type: 'xrange',
    animate: seriesProto.animate,
    autoIncrement: noop,
    buildKDTree: noop
});

/* *
 *
 * Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        xrange: typeof XRangeSeries;
    }
}

SeriesRegistry.registerSeriesType('xrange', XRangeSeries);

/* *
 *
 * Default Export
 *
 * */

export default XRangeSeries;
