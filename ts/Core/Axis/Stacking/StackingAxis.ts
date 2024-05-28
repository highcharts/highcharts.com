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

import type Chart from '../../Chart/Chart';
import type Series from '../../Series/Series';
import type { StackOverflowValue } from './StackingOptions';
import type SVGElement from '../../Renderer/SVG/SVGElement';
import type { YAxisOptions } from '../AxisOptions';

import { getDeferredAnimation } from '../../Animation/AnimationUtilities.js';
import Axis from '../Axis.js';
import SeriesRegistry from '../../Series/SeriesRegistry.js';
const { series: { prototype: seriesProto } } = SeriesRegistry;
import StackItem from './StackItem.js';
import U from '../../Utilities.js';
const {
    addEvent,
    correctFloat,
    defined,
    destroyObjectProperties,
    fireEvent,
    isArray,
    isNumber,
    objectEach,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../AxisComposition' {
    interface AxisComposition {
        stacking?: AxisAdditions;
    }
}

declare module '../../Chart/ChartLike'{
    interface ChartLike {
        getStacks(): void;
    }
}

declare module '../../Series/PointLike' {
    interface PointLike {
        leftCliff?: number;
        rightCliff?: number;
    }
}

declare module '../../Series/SeriesLike' {
    interface SeriesLike {
        isRadialBar?: boolean;
        negStacks?: boolean;
        singleStacks?: false;
        stack?: StackOverflowValue;
        stackedYData?: (Array<number>|Array<Array<number>>);
        stackKey?: string;
        getStackIndicator(
            stackIndicator: (StackItemIndicatorObject|undefined),
            x: number,
            index: number,
            key?: string
        ): StackItemIndicatorObject;
        modifyStacks(): void;
        percentStacker(
            pointExtremes: Array<number>,
            stack: StackItem,
            i: number
        ): void;
        setGroupedPoints(
            axis: StackingAxis
        ): void;
        setStackedPoints(
            axis: StackingAxis,
            stackingParam?: string
        ): void;
    }
}

interface StackerFunction {
    (
        this: Series,
        pointExtremes: Array<number>,
        stack: StackItem,
        i: number
    ): void;
}

export interface StackItemIndicatorObject {
    index: number;
    key?: string;
    stackKey?: string;
    x: number;
}

declare class StackingAxis extends Axis {
    stacking: AxisAdditions;
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Generate stacks for each series and calculate stacks total values
 *
 * @private
 * @function Highcharts.Chart#getStacks
 */
function chartGetStacks(
    this: Chart
): void {
    const chart = this,
        inverted = chart.inverted;

    // Reset stacks for each axis
    chart.axes.forEach((axis): void => {
        if (axis.stacking && axis.stacking.stacks && axis.hasVisibleSeries) {
            axis.stacking.oldStacks = axis.stacking.stacks;
        }
    });

    chart.series.forEach((series): void => {
        const xAxisOptions = series.xAxis && series.xAxis.options || {};

        if (series.options.stacking && series.reserveSpace()) {
            series.stackKey = [
                series.type,
                pick(series.options.stack, ''),
                inverted ? xAxisOptions.top : xAxisOptions.left,
                inverted ? xAxisOptions.height : xAxisOptions.width
            ].join(',');
        }
    });
}

/**
 * @private
 */
function onAxisDestroy(this: Axis): void {
    const stacking = this.stacking;

    if (stacking) {
        const stacks = stacking.stacks;

        // Destroy each stack total
        objectEach(stacks, (
            stack: Record<string, StackItem>,
            stackKey: string
        ): void => {
            destroyObjectProperties(stack);
            delete stacks[stackKey];
        });

        stacking.stackTotalGroup?.destroy();
    }

}

/**
 * @private
 */
function onAxisInit(this: Axis): void {
    if (!this.stacking) {
        this.stacking = new AxisAdditions(this as StackingAxis);
    }
}

/**
 * Get stack indicator, according to it's x-value, to determine points with the
 * same x-value
 *
 * @private
 * @function Highcharts.Series#getStackIndicator
 */
function seriesGetStackIndicator(
    stackIndicator: (StackItemIndicatorObject|undefined),
    x: number,
    index: number,
    key?: string
): StackItemIndicatorObject {
    // Update stack indicator, when:
    // first point in a stack || x changed || stack type (negative vs positive)
    // changed:
    if (
        !defined(stackIndicator) ||
        stackIndicator.x !== x ||
        (key && stackIndicator.stackKey !== key)
    ) {
        stackIndicator = {
            x: x,
            index: 0,
            key,
            stackKey: key
        };
    } else {
        stackIndicator.index++;
    }

    stackIndicator.key = [index, x, stackIndicator.index].join(',');

    return stackIndicator;
}

/**
 * Iterate over all stacks and compute the absolute values to percent
 *
 * @private
 * @function Highcharts.Series#modifyStacks
 */
function seriesModifyStacks(
    this: Series
): void {
    const series = this,
        yAxis = series.yAxis as StackingAxis,
        stackKey = series.stackKey || '',
        stacks = yAxis.stacking.stacks,
        processedXData = series.processedXData,
        stacking = series.options.stacking,
        stacker: (StackerFunction|undefined) =
            (series as AnyRecord)[stacking + 'Stacker'];

    let stackIndicator: StackItemIndicatorObject;

    if (stacker) { // Modifier function exists (Series.percentStacker etc.)
        [stackKey, '-' + stackKey].forEach((key): void => {
            let i = processedXData.length,
                x,
                stackItem: StackItem|undefined,
                pointExtremes;

            while (i--) {
                x = processedXData[i];
                stackIndicator = series.getStackIndicator(
                    stackIndicator,
                    x,
                    series.index,
                    key
                );
                stackItem = stacks[key]?.[x];
                pointExtremes = stackItem?.points[stackIndicator.key || ''];
                if (pointExtremes) {
                    stacker.call(series, pointExtremes, stackItem, i);
                }
            }
        });
    }
}

/**
 * Modifier function for percent stacks. Blows up the stack to 100%.
 *
 * @private
 * @function Highcharts.Series#percentStacker
 */
function seriesPercentStacker(
    this: Series,
    pointExtremes: Array<number>,
    stack: StackItem,
    i: number
): void {
    const totalFactor = stack.total ? 100 / stack.total : 0;

    // Y bottom value
    pointExtremes[0] = correctFloat(pointExtremes[0] * totalFactor);
    // Y value
    pointExtremes[1] = correctFloat(pointExtremes[1] * totalFactor);
    (this.stackedYData as any)[i] = pointExtremes[1];
}

/**
 * Set grouped points in a stack-like object. When `centerInCategory` is true,
 * and `stacking` is not enabled, we need a pseudo (horizontal) stack in order
 * to handle grouping of points within the same category.
 *
 * @private
 * @function Highcharts.Series#setGroupedPoints
 * @return {void}
 */
function seriesSetGroupedPoints(
    this: Series,
    axis: StackingAxis
): void {

    // Only series types supporting centerInCategory need to do this. That also
    // applies to resetting (#20221).
    if (this.is('column') || this.is('columnrange')) {
        if (
            this.options.centerInCategory &&
            // With stacking enabled, we already have stacks that we can compute
            // from
            !this.options.stacking &&
            // With only one series, we don't need to consider centerInCategory
            this.chart.series.length > 1
        ) {
            seriesProto.setStackedPoints.call(this, axis, 'group');

        // After updating, if we now have proper stacks, we must delete the
        // group pseudo stacks (#14980)
        } else {
            axis.stacking.resetStacks();
        }
    }
}

/**
 * Adds series' points value to corresponding stack
 *
 * @private
 * @function Highcharts.Series#setStackedPoints
 */
function seriesSetStackedPoints(
    this: Series,
    axis: StackingAxis,
    stackingParam?: string
): void {

    const type = stackingParam || this.options.stacking;

    if (
        !type ||
        !this.reserveSpace() ||
        // Group stacks (centerInCategory) belong on the x-axis, other stacks on
        // the y-axis.
        ({ group: 'xAxis' }[type] || 'yAxis') !== axis.coll
    ) {
        return;
    }

    const series = this,
        xData = series.processedXData,
        yData = series.processedYData,
        stackedYData = [],
        yDataLength = yData.length,
        seriesOptions = series.options,
        threshold = seriesOptions.threshold || 0,
        stackThreshold = seriesOptions.startFromThreshold ? threshold : 0,
        stackOption = seriesOptions.stack,
        stackKey = stackingParam ?
            `${series.type},${type}` : (series.stackKey || ''),
        negKey = '-' + stackKey,
        negStacks = series.negStacks,
        stacking = axis.stacking,
        stacks = stacking.stacks,
        oldStacks = stacking.oldStacks;

    let stackIndicator: (StackItemIndicatorObject|undefined),
        isNegative,
        stack,
        other,
        key: string,
        pointKey: string,
        i,
        x,
        y;


    stacking.stacksTouched += 1;

    // Loop over the non-null y values and read them into a local array
    for (i = 0; i < yDataLength; i++) {
        x = (xData as any)[i];
        y = (yData as any)[i];
        stackIndicator = series.getStackIndicator(
            stackIndicator,
            x,
            series.index
        );
        pointKey = stackIndicator.key || '';
        // Read stacked values into a stack based on the x value,
        // the sign of y and the stack key. Stacking is also handled for null
        // values (#739)
        isNegative = negStacks && y < (stackThreshold ? 0 : threshold);
        key = isNegative ? negKey : stackKey;

        // Create empty object for this stack if it doesn't exist yet
        if (!stacks[key]) {
            stacks[key] = {};
        }

        // Initialize StackItem for this x
        if (!stacks[key][x]) {
            if (oldStacks[key]?.[x]) {
                stacks[key][x] = oldStacks[key][x];
                stacks[key][x].total = null;
            } else {
                stacks[key][x] = new StackItem(
                    axis,
                    (axis.options as YAxisOptions).stackLabels as any,
                    !!isNegative,
                    x,
                    stackOption
                );
            }
        }

        // If the StackItem doesn't exist, create it first
        stack = stacks[key][x];
        if (y !== null) {
            stack.points[pointKey] = stack.points[series.index] = [
                pick(stack.cumulative, stackThreshold)
            ];

            // Record the base of the stack
            if (!defined(stack.cumulative)) {
                stack.base = pointKey;
            }
            stack.touched = stacking.stacksTouched;

            // In area charts, if there are multiple points on the same X value,
            // let the area fill the full span of those points
            if (stackIndicator.index > 0 && series.singleStacks === false) {
                stack.points[pointKey][0] = stack.points[
                    series.index + ',' + x + ',0'
                ][0];
            }

        // When updating to null, reset the point stack (#7493)
        } else {
            delete stack.points[pointKey];
            delete stack.points[series.index];
        }

        // Add value to the stack total
        let total = stack.total || 0;
        if (type === 'percent') {

            // Percent stacked column, totals are the same for the positive and
            // negative stacks
            other = isNegative ? stackKey : negKey;
            if (negStacks && stacks[other]?.[x]) {
                other = stacks[other][x];
                total = other.total =
                    Math.max(other.total || 0, total) +
                    Math.abs(y) || 0;

            // Percent stacked areas
            } else {
                total = correctFloat(total + (Math.abs(y) || 0));
            }

        } else if (type === 'group') {
            if (isArray(y)) {
                y = y[0];
            }

            // In this stack, the total is the number of valid points
            if (y !== null) {
                total++;
            }

        } else {
            total = correctFloat(total + (y || 0));
        }

        if (type === 'group') {
            // This point's index within the stack, pushed to stack.points[1]
            stack.cumulative = (total || 1) - 1;
        } else {
            stack.cumulative = correctFloat(
                pick(stack.cumulative, stackThreshold) +
                (y || 0)
            );
        }
        stack.total = total;

        if (y !== null) {
            stack.points[pointKey].push(stack.cumulative);
            stackedYData[i] = stack.cumulative;
            stack.hasValidPoints = true;
        }
    }

    if (type === 'percent') {
        stacking.usePercentage = true;
    }

    if (type !== 'group') {
        this.stackedYData = stackedYData; // To be used in getExtremes
    }

    // Reset old stacks
    stacking.oldStacks = {};
}

/* *
 *
 *  Classes
 *
 * */

/**
 * Adds stacking support to axes.
 * @private
 * @class
 */
class AxisAdditions {

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(axis: StackingAxis) {
        this.axis = axis;
    }

    /* *
     *
     *  Properties
     *
     * */

    axis: StackingAxis;
    oldStacks: Record<string, Record<string, StackItem>> = {};
    stacks: Record<string, Record<string, StackItem>> = {};
    stacksTouched: number = 0;
    stackTotalGroup?: SVGElement;
    usePercentage?: boolean;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Build the stacks from top down
     * @private
     */
    public buildStacks(): void {
        const stacking = this,
            axis = stacking.axis,
            axisSeries = axis.series,
            isXAxis = axis.coll === 'xAxis',
            reversedStacks = axis.options.reversedStacks,
            len = axisSeries.length;

        let actualSeries: Series,
            i: number;

        this.resetStacks();

        stacking.usePercentage = false;
        i = len;
        while (i--) {
            actualSeries = axisSeries[reversedStacks ? i : len - i - 1];
            if (isXAxis) {
                actualSeries.setGroupedPoints(axis);
            }
            actualSeries.setStackedPoints(axis);
        }

        // Loop up again to compute percent and stream stack
        if (!isXAxis) {
            for (i = 0; i < len; i++) {
                axisSeries[i].modifyStacks();
            }
        }
        fireEvent(axis, 'afterBuildStacks');
    }

    /**
     * @private
     */
    public cleanStacks(): void {
        if (this.oldStacks) {
            this.stacks = this.oldStacks;

            // Reset stacks
            objectEach(this.stacks, (type): void => {
                objectEach(type, (stack): void => {
                    stack.cumulative = stack.total;
                });
            });
        }

    }

    /**
     * Set all the stacks to initial states and destroy unused ones.
     * @private
     */
    public resetStacks(): void {
        objectEach(this.stacks, (type): void => {
            objectEach(type, (stack, x): void => {
                // Clean up memory after point deletion (#1044, #4320)
                if (
                    isNumber(stack.touched) &&
                    stack.touched < this.stacksTouched
                ) {
                    stack.destroy();
                    delete type[x];

                // Reset stacks
                } else {
                    stack.total = null;
                    stack.cumulative = null;
                }
            });
        });
    }

    /**
     * @private
     */
    public renderStackTotals(): void {
        const stacking = this,
            axis = stacking.axis,
            chart = axis.chart,
            renderer = chart.renderer,
            stacks = stacking.stacks,
            stackLabelsAnim = axis.options.stackLabels?.animation,
            animationConfig = getDeferredAnimation(
                chart,
                stackLabelsAnim || false
            ),
            stackTotalGroup = stacking.stackTotalGroup = (
                stacking.stackTotalGroup ||
                renderer
                    .g('stack-labels')
                    .attr({
                        zIndex: 6,
                        opacity: 0
                    })
                    .add()
            );

        // The plotLeft/Top will change when y axis gets wider so we need to
        // translate the stackTotalGroup at every render call. See bug #506
        // and #516
        stackTotalGroup.translate(chart.plotLeft, chart.plotTop);

        // Render each stack total
        objectEach(stacks, (type): void => {
            objectEach(type, (stack): void => {
                stack.render(stackTotalGroup);
            });
        });
        stackTotalGroup.animate({
            opacity: 1
        }, animationConfig);
    }
}


/* *
 *
 *  Composition
 *
 * */

namespace StackingAxis {

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Extends axis with stacking support.
     * @private
     */
    export function compose(
        AxisClass: typeof Axis,
        ChartClass: typeof Chart,
        SeriesClass: typeof Series
    ): void {
        const chartProto = ChartClass.prototype,
            seriesProto = SeriesClass.prototype;


        if (!chartProto.getStacks) {
            addEvent(AxisClass, 'init', onAxisInit);
            addEvent(AxisClass, 'destroy', onAxisDestroy);

            chartProto.getStacks = chartGetStacks;

            seriesProto.getStackIndicator = seriesGetStackIndicator;
            seriesProto.modifyStacks = seriesModifyStacks;
            seriesProto.percentStacker = seriesPercentStacker;
            seriesProto.setGroupedPoints = seriesSetGroupedPoints;
            seriesProto.setStackedPoints = seriesSetStackedPoints;
        }

    }

}

/* *
 *
 *  Registry
 *
 * */

declare module '../AxisType' {
    interface AxisTypeRegistry {
        StackingAxis: StackingAxis;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default StackingAxis;
