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

import BBoxObject from '../../Core/Renderer/BBoxObject';
import type DataExtremesObject from '../../Core/Series/DataExtremesObject';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type WaterfallSeriesOptions from './WaterfallSeriesOptions';

import Axis from '../../Core/Axis/Axis.js';
import Chart from '../../Core/Chart/Chart.js';
import { Palette } from '../../Core/Color/Palettes.js';
import Point from '../../Core/Series/Point.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: ColumnSeries,
        line: LineSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
const {
    correctFloat,
    pick
} = U;
import WaterfallAxis from '../../Core/Axis/WaterfallAxis.js';
import WaterfallPoint from './WaterfallPoint.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    arrayMin,
    arrayMax
} = AH;
const { isNumber } = TC;
const { extend, merge, objectEach } = OH;
const { addEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        showLine?: WaterfallSeries['showLine'];
    }
}

/**
 * Returns true if the key is a direct property of the object.
 * @private
 * @param {*} obj
 * Object with property to test
 * @param {string} key
 * Property key to test
 * @return {boolean}
 * Whether it is a direct property
 */
function ownProp(obj: unknown, key: string): boolean {
    return Object.hasOwnProperty.call(obj, key);
}

/* eslint-disable no-invalid-this, valid-jsdoc */

// eslint-disable-next-line valid-jsdoc

/**
 * Waterfall series type.
 *
 * @private
 */
class WaterfallSeries extends ColumnSeries {

    /* *
     *
     * Static properties
     *
     * */

    /**
     * A waterfall chart displays sequentially introduced positive or negative
     * values in cumulative columns.
     *
     * @sample highcharts/demo/waterfall/
     *         Waterfall chart
     * @sample highcharts/plotoptions/waterfall-inverted/
     *         Horizontal (inverted) waterfall
     * @sample highcharts/plotoptions/waterfall-stacked/
     *         Stacked waterfall chart
     *
     * @extends      plotOptions.column
     * @excluding    boostThreshold, boostBlending
     * @product      highcharts
     * @requires     highcharts-more
     * @optionparent plotOptions.waterfall
     */
    public static defaultOptions: WaterfallSeriesOptions = merge(ColumnSeries.defaultOptions, {
        /**
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @apioption plotOptions.waterfall.color
         */

        /**
         * The color used specifically for positive point columns. When not
         * specified, the general series color is used.
         *
         * In styled mode, the waterfall colors can be set with the
         * `.highcharts-point-negative`, `.highcharts-sum` and
         * `.highcharts-intermediate-sum` classes.
         *
         * @sample {highcharts} highcharts/demo/waterfall/
         *         Waterfall
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @product   highcharts
         * @apioption plotOptions.waterfall.upColor
         */

        dataLabels: {
            inside: true
        },

        /**
         * The width of the line connecting waterfall columns.
         *
         * @product highcharts
         */
        lineWidth: 1,

        /**
         * The color of the line that connects columns in a waterfall series.
         *
         * In styled mode, the stroke can be set with the `.highcharts-graph`
         * class.
         *
         * @type    {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since   3.0
         * @product highcharts
         */
        lineColor: Palette.neutralColor80,

        /**
         * A name for the dash style to use for the line connecting the columns
         * of the waterfall series. Possible values: Dash, DashDot, Dot,
         * LongDash, LongDashDot, LongDashDotDot, ShortDash, ShortDashDot,
         * ShortDashDotDot, ShortDot, Solid
         *
         * In styled mode, the stroke dash-array can be set with the
         * `.highcharts-graph` class.
         *
         * @type    {Highcharts.DashStyleValue}
         * @since   3.0
         * @product highcharts
         */
        dashStyle: 'Dot',

        /**
         * The color of the border of each waterfall column.
         *
         * In styled mode, the border stroke can be set with the
         * `.highcharts-point` class.
         *
         * @type    {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since   3.0
         * @product highcharts
         */
        borderColor: Palette.neutralColor80,

        states: {
            hover: {
                lineWidthPlus: 0 // #3126
            }
        }
    });

    /* *
     *
     * Properties
     *
     * */

    public chart: WaterfallSeries.WaterfallChart = void 0 as any;

    public data: Array<WaterfallPoint> = void 0 as any;

    public options: WaterfallSeriesOptions = void 0 as any;

    public points: Array<WaterfallPoint> = void 0 as any;

    public stackedYNeg: Array<number> = void 0 as any;

    public stackedYPos: Array<number> = void 0 as any;

    public stackKey: 'waterfall' = void 0 as any;

    public xData: Array<number> = void 0 as any;

    public yAxis: WaterfallAxis = void 0 as any;

    public yData: Array<any> = void 0 as any;

    /* *
     *
     * Functions
     *
     * */
    // After generating points, set y-values for all sums.
    public generatePoints(): void {

        // Parent call:
        ColumnSeries.prototype.generatePoints.apply(this);

        for (let i = 0, len = this.points.length; i < len; i++) {
            const point = this.points[i],
                y = this.processedYData[i];

            // Override point value for sums. #3710 Update point does not
            // propagate to sum
            if (isNumber(y) && (point.isIntermediateSum || point.isSum)) {
                point.y = correctFloat(y);
            }
        }
    }

    // Call default processData then override yData to reflect waterfall's
    // extremes on yAxis
    public processData(
        force?: boolean
    ): undefined {
        let series = this,
            options = series.options,
            yData = series.yData,
            // #3710 Update point does not propagate to sum
            points = options.data,
            point,
            dataLength = yData.length,
            threshold = options.threshold || 0,
            subSum,
            sum,
            dataMin,
            dataMax,
            y,
            i;

        sum = subSum = dataMin = dataMax = 0;

        for (i = 0; i < dataLength; i++) {
            y = yData[i];
            point = points && points[i] ? points[i] : {};

            if (y === 'sum' || (point as any).isSum) {
                yData[i] = correctFloat(sum);
            } else if (
                y === 'intermediateSum' ||
                (point as any).isIntermediateSum
            ) {
                yData[i] = correctFloat(subSum);
                subSum = 0;
            } else {
                sum += y;
                subSum += y;
            }
            dataMin = Math.min(sum, dataMin);
            dataMax = Math.max(sum, dataMax);
        }

        super.processData.call(this, force);

        // Record extremes only if stacking was not set:
        if (!options.stacking) {
            series.dataMin = dataMin + threshold;
            series.dataMax = dataMax;
        }

        return;
    }


    // Return y value or string if point is sum
    public toYData(pt: WaterfallPoint): any {
        if (pt.isSum) {
            return 'sum';
        }
        if (pt.isIntermediateSum) {
            return 'intermediateSum';
        }
        return pt.y;
    }

    public updateParallelArrays(
        point: Point,
        i: (number|string)
    ): void {
        super.updateParallelArrays.call(
            this,
            point,
            i
        );
        // Prevent initial sums from triggering an error (#3245, #7559)
        if (this.yData[0] === 'sum' || this.yData[0] === 'intermediateSum') {
            this.yData[0] = null;
        }
    }

    // Postprocess mapping between options and SVG attributes
    public pointAttribs(
        point: WaterfallPoint,
        state: StatesOptionsKey
    ): SVGAttributes {

        const upColor = this.options.upColor;

        // Set or reset up color (#3710, update to negative)
        if (upColor && !point.options.color && isNumber(point.y)) {
            point.color = point.y > 0 ? upColor : void 0;
        }

        const attr = ColumnSeries.prototype.pointAttribs.call(
            this,
            point,
            state
        );

        // The dashStyle option in waterfall applies to the graph, not
        // the points
        delete attr.dashstyle;

        return attr;
    }

    // Return an empty path initially, because we need to know the stroke-width
    // in order to set the final path.
    public getGraphPath(
        this: WaterfallSeries
    ): SVGPath {
        return [['M', 0, 0]];
    }

    // Draw columns' connector lines
    public getCrispPath(
        this: WaterfallSeries
    ): SVGPath {

        let data = this.data.filter((d): Boolean =>
                // Skip points where Y is not a number (#18636)
                isNumber(d.y)
            ),
            yAxis = this.yAxis,
            length = data.length,
            graphNormalizer =
                Math.round((this.graph as any).strokeWidth()) % 2 / 2,
            borderNormalizer = Math.round(this.borderWidth) % 2 / 2,
            reversedXAxis = this.xAxis.reversed,
            reversedYAxis = this.yAxis.reversed,
            stacking = this.options.stacking,
            path: SVGPath = [];

        for (let i = 1; i < length; i++) {
            if (!( // Skip lines that would pass over the null point (#18636)
                this.options.connectNulls ||
                isNumber(this.data[data[i].index - 1].y)
            )) {
                continue;
            }

            const box = data[i].box,
                prevPoint = data[i - 1],
                prevY = prevPoint.y || 0,
                prevBox = data[i - 1].box;

            if (!box || !prevBox) {
                continue;
            }

            const prevStack = yAxis.waterfall.stacks[this.stackKey],
                isPos = prevY > 0 ? -prevBox.height : 0;

            if (prevStack && prevBox && box) {
                const prevStackX = (prevStack as any)[i - 1];

                // y position of the connector is different when series are
                // stacked, yAxis is reversed and it also depends on point's
                // value
                let yPos: number;
                if (stacking) {
                    const connectorThreshold = prevStackX.connectorThreshold;

                    yPos = Math.round(
                        (yAxis.translate(
                            connectorThreshold,
                            false,
                            true,
                            false,
                            true
                        ) +
                        (reversedYAxis ? isPos : 0))
                    ) - graphNormalizer;
                } else {
                    yPos =
                        (prevBox as any).y + prevPoint.minPointLengthOffset +
                        borderNormalizer - graphNormalizer;
                }

                path.push([
                    'M',
                    (prevBox.x || 0) + (reversedXAxis ?
                        0 :
                        (prevBox.width || 0)
                    ),
                    yPos
                ], [
                    'L',
                    (box.x || 0) + (reversedXAxis ?
                        (box.width || 0) :
                        0
                    ),
                    yPos
                ]);
            }

            if (
                prevBox &&
                path.length &&
                (
                    (!stacking && prevY < 0 && !reversedYAxis) ||
                    (prevY > 0 && reversedYAxis)
                )
            ) {
                const nextLast = path[path.length - 2];
                if (nextLast && typeof nextLast[2] === 'number') {
                    nextLast[2] += prevBox.height || 0;
                }
                const last = path[path.length - 1];
                if (last && typeof last[2] === 'number') {
                    last[2] += prevBox.height || 0;
                }
            }

        }
        return path;
    }

    // The graph is initially drawn with an empty definition, then updated with
    // crisp rendering.
    public drawGraph(): void {
        LineSeries.prototype.drawGraph.call(this);
        if (this.graph) {
            this.graph.attr({
                d: this.getCrispPath()
            });
        }
    }

    // Waterfall has stacking along the x-values too.
    public setStackedPoints(): void {
        let series = this,
            options = series.options,
            waterfallStacks = series.yAxis.waterfall.stacks,
            seriesThreshold = options.threshold || 0,
            stackThreshold = seriesThreshold,
            interSum = stackThreshold,
            stackKey = series.stackKey,
            xData = series.xData,
            xLength = xData.length,
            actualStackX: (WaterfallAxis.StacksItemObject|undefined),
            totalYVal,
            actualSum,
            prevSum,
            statesLen: number,
            posTotal,
            negTotal,
            xPoint,
            yVal,
            x,
            alreadyChanged,
            changed;

        // Function responsible for calculating correct values for stackState
        // array of each stack item. The arguments are: firstS - the value for
        // the first state, nextS - the difference between the previous and the
        // newest state, sInx - counter used in the for that updates each state
        // when necessary, sOff - offset that must be added to each state when
        // they need to be updated (if point isn't a total sum)
        // eslint-disable-next-line require-jsdoc
        function calculateStackState(
            firstS: number,
            nextS: number,
            sInx: number,
            sOff: number
        ): void {
            if (actualStackX) {
                if (!statesLen) {
                    actualStackX.stackState[0] = firstS;
                    statesLen = actualStackX.stackState.length;
                } else {
                    for (sInx; sInx < statesLen; sInx++) {
                        actualStackX.stackState[sInx] += sOff;
                    }
                }

                actualStackX.stackState.push(
                    actualStackX.stackState[statesLen - 1] + nextS
                );
            }
        }

        series.yAxis.stacking.usePercentage = false;
        totalYVal = actualSum = prevSum = stackThreshold;

        // code responsible for creating stacks for waterfall series
        if (
            series.visible ||
            !series.chart.options.chart.ignoreHiddenSeries
        ) {
            changed = waterfallStacks.changed;
            alreadyChanged = waterfallStacks.alreadyChanged;

            // In case of a redraw, stack for each x value must be emptied (only
            // for the first series in a specific stack) and recalculated once
            // more
            if (alreadyChanged &&
                alreadyChanged.indexOf(stackKey) < 0) {
                changed = true;
            }

            if (!waterfallStacks[stackKey]) {
                waterfallStacks[stackKey] = {};
            }

            const actualStack = waterfallStacks[stackKey];
            if (actualStack) {
                for (let i = 0; i < xLength; i++) {
                    x = xData[i];
                    if (!actualStack[x] || changed) {
                        actualStack[x] = {
                            negTotal: 0,
                            posTotal: 0,
                            stackTotal: 0,
                            threshold: 0,
                            stateIndex: 0,
                            stackState: [],
                            label: (
                                (changed &&
                                actualStack[x]) ?
                                    actualStack[x].label :
                                    void 0
                            )
                        };
                    }

                    actualStackX = actualStack[x];
                    yVal = series.yData[i];

                    if (yVal >= 0) {
                        actualStackX.posTotal += yVal;
                    } else {
                        actualStackX.negTotal += yVal;
                    }

                    // points do not exist yet, so raw data is used
                    xPoint = (options.data as any)[i];

                    posTotal = actualStackX.absolutePos = actualStackX.posTotal;
                    negTotal = actualStackX.absoluteNeg = actualStackX.negTotal;
                    actualStackX.stackTotal = posTotal + negTotal;
                    statesLen = actualStackX.stackState.length;

                    if (xPoint && xPoint.isIntermediateSum) {
                        calculateStackState(
                            prevSum,
                            actualSum,
                            0,
                            prevSum
                        );

                        prevSum = actualSum;
                        actualSum = seriesThreshold;

                        // swapping values
                        stackThreshold ^= interSum;
                        interSum ^= stackThreshold;
                        stackThreshold ^= interSum;
                    } else if (xPoint && xPoint.isSum) {
                        calculateStackState(
                            seriesThreshold,
                            totalYVal,
                            statesLen,
                            0
                        );

                        stackThreshold = seriesThreshold;
                    } else {
                        calculateStackState(stackThreshold, yVal, 0, totalYVal);

                        if (xPoint) {
                            totalYVal += yVal;
                            actualSum += yVal;
                        }
                    }

                    actualStackX.stateIndex++;
                    actualStackX.threshold = stackThreshold;
                    stackThreshold += actualStackX.stackTotal;
                }
            }

            waterfallStacks.changed = false;
            if (!waterfallStacks.alreadyChanged) {
                waterfallStacks.alreadyChanged = [];
            }
            waterfallStacks.alreadyChanged.push(stackKey);
        }
    }

    // Extremes for a non-stacked series are recorded in processData.
    // In case of stacking, use Series.stackedYData to calculate extremes.
    public getExtremes(): DataExtremesObject {
        let stacking = this.options.stacking,
            yAxis,
            waterfallStacks,
            stackedYNeg,
            stackedYPos;

        if (stacking) {
            yAxis = this.yAxis;
            waterfallStacks = yAxis.waterfall.stacks;
            stackedYNeg = this.stackedYNeg = [];
            stackedYPos = this.stackedYPos = [];

            // the visible y range can be different when stacking is set to
            // overlap and different when it's set to normal
            if (stacking === 'overlap') {
                objectEach(waterfallStacks[this.stackKey], function (
                    stackX: WaterfallAxis.StacksItemObject
                ): void {
                    stackedYNeg.push(arrayMin(stackX.stackState));
                    stackedYPos.push(arrayMax(stackX.stackState));
                });
            } else {
                objectEach(waterfallStacks[this.stackKey], function (
                    stackX: WaterfallAxis.StacksItemObject
                ): void {
                    stackedYNeg.push(stackX.negTotal + stackX.threshold);
                    stackedYPos.push(stackX.posTotal + stackX.threshold);
                });
            }

            return {
                dataMin: arrayMin(stackedYNeg),
                dataMax: arrayMax(stackedYPos)
            };

        }

        // When not stacking, data extremes have already been computed in the
        // processData function.
        return {
            dataMin: this.dataMin,
            dataMax: this.dataMax
        };
    }

}

// Translate data points from raw values
addEvent(WaterfallSeries, 'afterColumnTranslate', function (
    this: WaterfallSeries
): void {
    const series = this,
        { options, points, yAxis } = series,
        minPointLength = pick(options.minPointLength, 5),
        halfMinPointLength = minPointLength / 2,
        threshold = options.threshold || 0,
        stacking = options.stacking,
        actualStack = yAxis.waterfall.stacks[series.stackKey];

    let previousIntermediate = threshold,
        previousY = threshold,
        y,
        total,
        yPos,
        hPos;

    for (let i = 0; i < points.length; i++) {
        const point = points[i],
            yValue = series.processedYData[i] as number,
            shapeArgs = point.shapeArgs,
            box: BBoxObject = extend({
                x: 0,
                y: 0,
                width: 0,
                height: 0
            }, shapeArgs || {});

        point.box = box;

        const range = [0, yValue],
            pointY = point.y || 0;

        // code responsible for correct positions of stacked points
        // starts here
        if (stacking) {
            if (actualStack) {
                const actualStackX = actualStack[i];

                if (stacking === 'overlap') {
                    total =
                        actualStackX.stackState[actualStackX.stateIndex--];

                    y = pointY >= 0 ? total : total - pointY;
                    if (ownProp(actualStackX, 'absolutePos')) {
                        delete actualStackX.absolutePos;
                    }

                    if (ownProp(actualStackX, 'absoluteNeg')) {
                        delete actualStackX.absoluteNeg;
                    }
                } else {
                    if (pointY >= 0) {
                        total = actualStackX.threshold +
                            actualStackX.posTotal;

                        actualStackX.posTotal -= pointY;
                        y = total;
                    } else {
                        total = actualStackX.threshold +
                            actualStackX.negTotal;

                        actualStackX.negTotal -= pointY;
                        y = total - pointY;
                    }

                    if (!actualStackX.posTotal) {
                        if (
                            isNumber(actualStackX.absolutePos) &&
                            ownProp(actualStackX, 'absolutePos')
                        ) {
                            actualStackX.posTotal =
                                actualStackX.absolutePos;
                            delete actualStackX.absolutePos;
                        }
                    }

                    if (!actualStackX.negTotal) {
                        if (
                            isNumber(actualStackX.absoluteNeg) &&
                            ownProp(actualStackX, 'absoluteNeg')
                        ) {
                            actualStackX.negTotal =
                                actualStackX.absoluteNeg;
                            delete actualStackX.absoluteNeg;
                        }
                    }
                }

                if (!point.isSum) {
                    // the connectorThreshold property is later used in
                    // getCrispPath function to draw a connector line in a
                    // correct place
                    actualStackX.connectorThreshold =
                        actualStackX.threshold + actualStackX.stackTotal;
                }

                if (yAxis.reversed) {
                    yPos = (pointY >= 0) ? (y - pointY) : (y + pointY);
                    hPos = y;
                } else {
                    yPos = y;
                    hPos = y - pointY;
                }

                point.below = yPos <= threshold;

                box.y = yAxis.translate(
                    yPos,
                    false,
                    true,
                    false,
                    true
                );
                box.height = Math.abs(
                    box.y -
                    yAxis.translate(
                        hPos,
                        false,
                        true,
                        false,
                        true
                    )
                );

                const dummyStackItem = yAxis.waterfall.dummyStackItem;
                if (dummyStackItem) {
                    dummyStackItem.x = i;
                    dummyStackItem.label = actualStack[i].label;
                    dummyStackItem.setOffset(
                        series.pointXOffset || 0,
                        series.barW || 0,
                        series.stackedYNeg[i],
                        series.stackedYPos[i],
                        void 0,
                        this.xAxis
                    );
                }
            }
        } else {
            // up points
            y = Math.max(
                previousY,
                previousY + pointY
            ) + range[0];
            box.y = yAxis.translate(y, false, true, false, true);

            // sum points
            if (point.isSum) {
                box.y = yAxis.translate(
                    range[1],
                    false,
                    true,
                    false,
                    true
                );
                box.height = Math.min(
                    yAxis.translate(
                        range[0],
                        false,
                        true,
                        false,
                        true
                    ),
                    yAxis.len
                ) - box.y; // #4256

                point.below = range[1] <= threshold;
            } else if (point.isIntermediateSum) {
                if (pointY >= 0) {
                    yPos = range[1] + previousIntermediate;
                    hPos = previousIntermediate;
                } else {
                    yPos = previousIntermediate;
                    hPos = range[1] + previousIntermediate;
                }

                if (yAxis.reversed) {
                    // swapping values
                    yPos ^= hPos;
                    hPos ^= yPos;
                    yPos ^= hPos;
                }

                box.y = yAxis.translate(
                    yPos,
                    false,
                    true,
                    false,
                    true
                );
                box.height = Math.abs(
                    box.y -
                    Math.min(
                        yAxis.translate(
                            hPos,
                            false,
                            true,
                            false,
                            true
                        ),
                        yAxis.len
                    )
                );

                previousIntermediate += range[1];
                point.below = yPos <= threshold;

            // If it's not the sum point, update previous stack end position
            // and get shape height (#3886)
            } else {
                box.height = yValue > 0 ?
                    yAxis.translate(
                        previousY,
                        false,
                        true,
                        false,
                        true
                    ) - box.y :
                    yAxis.translate(
                        previousY,
                        false,
                        true,
                        false,
                        true
                    ) - yAxis.translate(
                        previousY - yValue,
                        false,
                        true,
                        false,
                        true
                    );

                previousY += yValue;
                point.below = previousY < threshold;
            }

            // #3952 Negative sum or intermediate sum not rendered correctly
            if (box.height < 0) {
                box.y += box.height;
                box.height *= -1;
            }
        }

        point.plotY = box.y =
            Math.round(box.y || 0) - (series.borderWidth % 2) / 2;
        // #3151
        box.height =
            Math.max(Math.round(box.height || 0), 0.001);
        point.yBottom = box.y + box.height;

        if (box.height <= minPointLength && !point.isNull) {
            box.height = minPointLength;
            box.y -= halfMinPointLength;
            point.plotY = box.y;
            if (pointY < 0) {
                point.minPointLengthOffset = -halfMinPointLength;
            } else {
                point.minPointLengthOffset = halfMinPointLength;
            }
        } else {
            // #8024, empty gaps in the line for null data
            if (point.isNull) {
                box.width = 0;
            }
            point.minPointLengthOffset = 0;
        }

        // Correct tooltip placement (#3014)
        const tooltipY =
            point.plotY + (point.negative ? box.height : 0);

        if (point.below) { // #15334
            point.plotY += box.height;
        }

        if (point.tooltipPos) {
            if (series.chart.inverted) {
                point.tooltipPos[0] = yAxis.len - tooltipY;
            } else {
                point.tooltipPos[1] = tooltipY;
            }
        }

        // Check point position after recalculation (#16788)
        point.isInside = this.isPointInside(point);

        merge(true, point.shapeArgs, box);
    }
}, { order: 2 });

interface WaterfallSeries {
    getZonesGraphs: typeof LineSeries.prototype.getZonesGraphs;
    pointClass: typeof WaterfallPoint;
    pointValKey: string;
    showLine: boolean;
}

extend(WaterfallSeries.prototype, {
    getZonesGraphs: LineSeries.prototype.getZonesGraphs,
    pointValKey: 'y',
    // Property needed to prevent lines between the columns from disappearing
    // when negativeColor is used.
    showLine: true,
    pointClass: WaterfallPoint
});


/* *
 *
 * Class namespace
 *
 * */

namespace WaterfallSeries {
    export interface WaterfallChart extends Chart {
        axes: Array<WaterfallAxis>;
    }
}

/* *
 *
 * Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        waterfall: typeof WaterfallSeries;
    }
}
SeriesRegistry.registerSeriesType('waterfall', WaterfallSeries);
WaterfallAxis.compose(Axis, Chart);

/* *
 *
 * Export
 *
 * */
export default WaterfallSeries;

/**
 *
 * API Options
 *
 */

/**
 * A `waterfall` series. If the [type](#series.waterfall.type) option
 * is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.waterfall
 * @excluding dataParser, dataURL, boostThreshold, boostBlending
 * @product   highcharts
 * @requires  highcharts-more
 * @apioption series.waterfall
 */

/**
 * An array of data points for the series. For the `waterfall` series
 * type, points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. The `x` values will be automatically
 *    calculated, either starting at 0 and incremented by 1, or from
 *    `pointStart` and `pointInterval` given in the series options. If the axis
 *    has categories, these will be used. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of arrays with 2 values. In this case, the values correspond to
 *    `x,y`. If the first value is a string, it is applied as the name of the
 *    point, and the `x` value is inferred.
 *    ```js
 *    data: [
 *        [0, 7],
 *        [1, 8],
 *        [2, 3]
 *    ]
 *    ```
 *
 * 3. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.waterfall.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        x: 1,
 *        y: 8,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        x: 1,
 *        y: 8,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<number|Array<(number|string),(number|null)>|null|*>}
 * @extends   series.line.data
 * @excluding marker
 * @product   highcharts
 * @apioption series.waterfall.data
 */


/**
 * When this property is true, the points acts as a summary column for
 * the values added or substracted since the last intermediate sum,
 * or since the start of the series. The `y` value is ignored.
 *
 * @sample {highcharts} highcharts/demo/waterfall/
 *         Waterfall
 *
 * @type      {boolean}
 * @default   false
 * @product   highcharts
 * @apioption series.waterfall.data.isIntermediateSum
 */

/**
 * When this property is true, the point display the total sum across
 * the entire series. The `y` value is ignored.
 *
 * @sample {highcharts} highcharts/demo/waterfall/
 *         Waterfall
 *
 * @type      {boolean}
 * @default   false
 * @product   highcharts
 * @apioption series.waterfall.data.isSum
 */

''; // adds doclets above to transpiled file
