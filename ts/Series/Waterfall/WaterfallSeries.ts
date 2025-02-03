/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type DataExtremesObject from '../../Core/Series/DataExtremesObject';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type WaterfallSeriesOptions from './WaterfallSeriesOptions';

import Axis from '../../Core/Axis/Axis.js';
import Chart from '../../Core/Chart/Chart.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    line: LineSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    arrayMax,
    arrayMin,
    correctFloat,
    crisp,
    extend,
    isNumber,
    isObject,
    merge,
    objectEach,
    pick
} = U;
import WaterfallAxis from '../../Core/Axis/WaterfallAxis.js';
import WaterfallPoint from './WaterfallPoint.js';
import WaterfallSeriesDefaults from './WaterfallSeriesDefaults.js';

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

/* *
 *
 *  Functions
 *
 * */

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

/* *
 *
 *  Class
 *
 * */

/**
 * Waterfall series type.
 *
 * @private
 */
class WaterfallSeries extends ColumnSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: WaterfallSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        WaterfallSeriesDefaults
    );

    public static compose = WaterfallAxis.compose;

    /* *
     *
     *  Properties
     *
     * */

    public chart!: WaterfallSeries.WaterfallChart;

    public data!: Array<WaterfallPoint>;

    public options!: WaterfallSeriesOptions;

    public points!: Array<WaterfallPoint>;

    public stackedYNeg!: Array<number>;

    public stackedYPos!: Array<number>;

    public stackKey!: 'waterfall';

    public xData!: Array<number>;

    public yAxis!: WaterfallAxis;

    public yData!: Array<any>;

    /* *
     *
     *  Functions
     *
     * */

    // After generating points, set y-values for all sums.
    public generatePoints(): void {

        // Parent call:
        ColumnSeries.prototype.generatePoints.apply(this);

        const processedYData = this.getColumn('y', true);

        for (let i = 0, len = this.points.length; i < len; i++) {
            const point = this.points[i],
                y = processedYData[i];

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
        const series = this,
            options = series.options,
            yData = series.getColumn('y') as
                Array<number|'intermediateSum'|'sum'>,
            isSumData = series.getColumn('isSum'),
            isIntermediateSumData = series.getColumn('isIntermediateSum'),
            // #3710 Update point does not propagate to sum
            dataLength = yData.length,
            threshold = options.threshold || 0;

        let subSum,
            sum,
            dataMin,
            dataMax,
            y;

        sum = subSum = dataMin = dataMax = 0;

        for (let i = 0; i < dataLength; i++) {
            y = yData[i];

            if (y === 'sum' || isSumData[i]) {
                yData[i] = correctFloat(sum);
            } else if (
                y === 'intermediateSum' ||
                isIntermediateSumData[i]
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
        const // Skip points where Y is not a number (#18636)
            data = this.data.filter((d): boolean => isNumber(d.y)),
            yAxis = this.yAxis,
            length = data.length,
            graphLineWidth = this.graph?.strokeWidth() || 0,
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

                // Y position of the connector is different when series are
                // stacked, yAxis is reversed and it also depends on point's
                // value
                let yPos: number;
                if (stacking) {
                    const connectorThreshold = prevStackX.connectorThreshold;

                    yPos = crisp(
                        yAxis.translate(
                            connectorThreshold,
                            false,
                            true,
                            false,
                            true
                        ) +
                        (reversedYAxis ? isPos : 0),
                        graphLineWidth
                    );
                } else {
                    yPos = crisp(
                        prevBox.y + (prevPoint.minPointLengthOffset || 0),
                        graphLineWidth
                    );
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
    public setStackedPoints(axis: Axis): void {
        const series = this,
            options = series.options,
            waterfallStacks = axis.waterfall?.stacks,
            seriesThreshold = options.threshold || 0,
            stackKey = series.stackKey,
            xData = series.getColumn('x'),
            yData = series.getColumn('y'),
            xLength = xData.length;

        let stackThreshold = seriesThreshold,
            interSum = stackThreshold,
            actualStackX: (WaterfallAxis.StacksItemObject|undefined),
            totalYVal = 0,
            actualSum = 0,
            prevSum = 0,
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
        const calculateStackState = (
            firstS: number,
            nextS: number,
            sInx: number,
            sOff: number
        ): void => {
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
        };

        if (axis.stacking && waterfallStacks) {

            // Code responsible for creating stacks for waterfall series
            if (series.reserveSpace()) {
                changed = waterfallStacks.changed;
                alreadyChanged = waterfallStacks.alreadyChanged;

                // In case of a redraw, stack for each x value must be emptied
                // (only for the first series in a specific stack) and
                // recalculated once more
                if (
                    alreadyChanged &&
                    alreadyChanged.indexOf(stackKey) < 0
                ) {
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
                        yVal = yData[i];

                        if (yVal >= 0) {
                            actualStackX.posTotal += yVal;
                        } else {
                            actualStackX.negTotal += yVal;
                        }

                        // Points do not exist yet, so raw data is used
                        xPoint = options.data?.[i];

                        posTotal = actualStackX.absolutePos =
                            actualStackX.posTotal;
                        negTotal = actualStackX.absoluteNeg =
                            actualStackX.negTotal;
                        actualStackX.stackTotal = posTotal + negTotal;
                        statesLen = actualStackX.stackState.length;

                        if (
                            isObject(xPoint, true) &&
                            xPoint.isIntermediateSum
                        ) {
                            calculateStackState(
                                prevSum,
                                actualSum,
                                0,
                                prevSum
                            );

                            prevSum = actualSum;
                            actualSum = seriesThreshold;

                            // Swapping values
                            stackThreshold ^= interSum;
                            interSum ^= stackThreshold;
                            stackThreshold ^= interSum;
                        } else if (isObject(xPoint, true) && xPoint.isSum) {
                            calculateStackState(
                                seriesThreshold,
                                totalYVal,
                                statesLen,
                                0
                            );

                            stackThreshold = seriesThreshold;
                        } else {
                            calculateStackState(
                                stackThreshold,
                                yVal,
                                0,
                                totalYVal
                            );

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
    }

    // Extremes for a non-stacked series are recorded in processData.
    // In case of stacking, use Series.stackedYData to calculate extremes.
    public getExtremes(): DataExtremesObject {
        const stacking = this.options.stacking;

        let yAxis,
            waterfallStacks,
            stackedYNeg,
            stackedYPos;

        if (stacking) {
            yAxis = this.yAxis;
            waterfallStacks = yAxis.waterfall.stacks;
            stackedYNeg = this.stackedYNeg = [];
            stackedYPos = this.stackedYPos = [];

            // The visible y range can be different when stacking is set to
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

/* *
 *
 *  Class Prototype
 *
 * */

interface WaterfallSeries {
    pointClass: typeof WaterfallPoint;
    pointValKey: string;
    showLine: boolean;
}

extend(WaterfallSeries.prototype, {
    pointValKey: 'y',
    // Property needed to prevent lines between the columns from disappearing
    // when negativeColor is used.
    showLine: true,
    pointClass: WaterfallPoint
});

// Translate data points from raw values
addEvent(WaterfallSeries, 'afterColumnTranslate', function (): void {
    const series = this,
        { options, points, yAxis } = series,
        minPointLength = pick(options.minPointLength, 5),
        halfMinPointLength = minPointLength / 2,
        threshold = options.threshold || 0,
        stacking = options.stacking,
        actualStack = yAxis.waterfall.stacks[series.stackKey],
        processedYData = series.getColumn('y', true);

    let previousIntermediate = threshold,
        previousY = threshold,
        y,
        total,
        yPos,
        hPos;

    for (let i = 0; i < points.length; i++) {
        const point = points[i],
            yValue = processedYData[i],
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

        // Code responsible for correct positions of stacked points
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
                    // The connectorThreshold property is later used in
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
            // Up points
            y = Math.max(
                previousY,
                previousY + pointY
            ) + range[0];
            box.y = yAxis.translate(y, false, true, false, true);

            // Sum points
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
                    // Swapping values
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

        point.plotY = box.y;
        point.yBottom = box.y + box.height;

        if (box.height <= minPointLength && !point.isNull) {
            box.height = minPointLength;
            box.y -= halfMinPointLength;
            point.yBottom = box.y + box.height;
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
        const tooltipY = point.plotY + (point.negative ? box.height : 0);

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

        // Crisp vector coordinates
        const crispBottom = crisp(point.yBottom, series.borderWidth);
        box.y = crisp(box.y, series.borderWidth);
        box.height = crispBottom - box.y;

        merge(true, point.shapeArgs, box);
    }
}, { order: 2 });

/* *
 *
 *  Class Namespace
 *
 * */

namespace WaterfallSeries {
    export interface WaterfallChart extends Chart {
        axes: Array<WaterfallAxis>;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        waterfall: typeof WaterfallSeries;
    }
}

SeriesRegistry.registerSeriesType('waterfall', WaterfallSeries);

/* *
 *
 * Export
 *
 * */

export default WaterfallSeries;
