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

import type DataExtremesObject from '../Core/Series/DataExtremesObject';

import Axis from '../Core/Axis/Axis.js';
import Point from '../Core/Series/Point.js';
import Series from '../Core/Series/Series.js';

const {
    prototype: {
        tooltipFormatter: pointTooltipFormatter
    }
} = Point;

import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    arrayMax,
    arrayMin,
    pushUnique
} = AH;
const { isArray, isNumber, isString } = TC;
const { defined } = OH;
const { addEvent } = EH;
const {
    correctFloat,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Axis/AxisLike' {
    interface AxisLike {
        setCompare(compare?: 'percent'|'value'|null, redraw?: boolean): void;
        setCumulative(cumulative?: boolean|null, redraw?: boolean): void;
        setModifier(
            mode: 'compare'|'cumulative',
            modeState?: boolean|null|'percent'|'value',
            redraw?: boolean
        ): void;
    }
}

declare module '../Core/Series/PointLike' {
    interface PointLike {
        change?: number;
        cumulativeSum?: number;
    }
}

declare module '../Core/Series/SeriesLike' {
    interface SeriesLike {
        dataModify?: DataModifyComposition.Additions;
        setCompare(compare?: 'percent'|'value'|null, redraw?: boolean): void;
        setCumulative(cumulative?: boolean|null, redraw?: boolean): void;
    }
}

declare module '../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        compare?: 'percent'|'value'|null;
        compareBase?: (0|100);
        compareStart?: boolean;
        cumulative?: boolean;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace DataModifyComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class AxisComposition extends Axis {
        setCompare(
            this: Axis,
            compare?: 'percent'|'value'|null,
            redraw?: boolean
        ): void;
        setCumulative(
            this: Axis,
            cumulative?: boolean|null,
            redraw?: boolean
        ): void;
        setModifier(
            this: Axis,
            mode: 'compare'|'cumulative',
            modeState?: boolean|null|'percent'|'value',
            redraw?: boolean
        ): void;
    }

    export declare class PointComposition extends Point {
        tooltipFormatter(pointFormat: string): string;
    }

    export declare class SeriesComposition extends Series {
        dataModify: Additions;
        setCompare(
            this: Series,
            compare?: 'percent'|'value'|null,
            redraw?: boolean
        ): void;
        setCumulative(
            this: Series,
            cumulative?: boolean|null,
            redraw?: boolean
        ): void;
    }

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

    /* eslint-disable valid-jsdoc */

    /**
     * Extends the series, axis and point classes with
     * compare and cumulative support.
     *
     * @private
     *
     * @param SeriesClass
     * Series class to use.
     *
     * @param AxisClass
     * Axis class to extend.
     *
     * @param PointClass
     * Point class to use.
     */
    export function compose<T extends typeof Series>(
        SeriesClass: T,
        AxisClass: typeof Axis,
        PointClass: typeof Point
    ): (typeof SeriesComposition&T) {

        if (pushUnique(composedMembers, SeriesClass)) {
            const seriesProto = SeriesClass.prototype as SeriesComposition;

            seriesProto.setCompare = seriesSetCompare;
            seriesProto.setCumulative = seriesSetCumulative;

            addEvent(SeriesClass, 'afterInit', afterInit);
            addEvent(SeriesClass, 'afterGetExtremes', afterGetExtremes);
            addEvent(SeriesClass, 'afterProcessData', afterProcessData);
        }

        if (pushUnique(composedMembers, AxisClass)) {
            const axisProto = AxisClass.prototype as AxisComposition;

            axisProto.setCompare = axisSetCompare;
            axisProto.setModifier = setModifier;
            axisProto.setCumulative = axisSetCumulative;
        }

        if (pushUnique(composedMembers, PointClass)) {
            const pointProto = PointClass.prototype as PointComposition;

            pointProto.tooltipFormatter = tooltipFormatter;
        }

        return SeriesClass as (typeof SeriesComposition&T);
    }

    /* ********************************************************************** *
     *  Start shared compare and cumulative logic                             *
     * ********************************************************************** */

    /**
     * Shared code for the axis.setCompare() and the axis.setCumulative()
     * methods. Inits the 'compare' or the 'cumulative' mode.
     * @private
     */
    function setModifier(
        this: Axis,
        mode: 'compare'|'cumulative',
        modeState?: boolean|null|'percent'|'value',
        redraw?: boolean
    ): void {
        if (!this.isXAxis) {
            this.series.forEach(function (series): void {
                if (
                    mode === 'compare' &&
                    typeof modeState !== 'boolean'
                ) {
                    series.setCompare(modeState, false);
                } else if (
                    mode === 'cumulative' &&
                    !isString(modeState)
                ) {
                    series.setCumulative(modeState, false);
                }
            });

            if (pick(redraw, true)) {
                this.chart.redraw();
            }
        }
    }

    /**
     * Extend the tooltip formatter by adding support for the point.change
     * variable as well as the changeDecimals option.
     *
     * @ignore
     * @function Highcharts.Point#tooltipFormatter
     *
     * @param {string} pointFormat
     */
    function tooltipFormatter(this: Point, pointFormat: string): string {
        const point: any = this,
            { numberFormatter } = point.series.chart,
            replace = function (value: string): void {
                pointFormat = pointFormat.replace(
                    '{point.' + value + '}',
                    (point[value] > 0 && value === 'change' ? '+' : '') +
                        numberFormatter(
                            point[value],
                            pick(point.series.tooltipOptions.changeDecimals, 2)
                        )
                );
            };

        if (defined(point.change)) {
            replace('change');
        }

        if (defined(point.cumulativeSum)) {
            replace('cumulativeSum');
        }

        return pointTooltipFormatter.apply(this, [pointFormat]);
    }

    /**
     * Extend series.init by adding a methods to modify the y values used
     * for plotting on the y axis. For compare mode, this method is called both
     * from the axis when finding dataMin and dataMax,
     * and from the series.translate method.
     *
     * @ignore
     * @function Highcharts.Series#init
     */
    function afterInit(this: Series): void {
        const compare = this.options.compare;
        let dataModify: Additions|undefined;

        if (
            compare === 'percent' ||
            compare === 'value' ||
            this.options.cumulative
        ) {
            dataModify = new Additions(this as SeriesComposition);
            if (compare === 'percent' || compare === 'value') {
                // Set comparison mode
                dataModify.initCompare(compare);
            } else {
                // Set Cumulative Sum mode
                dataModify.initCumulative();
            }
        }

        this.dataModify = dataModify;
    }

    /**
     * Adjust the extremes (compare and cumulative modify the data).
     * @private
     */
    function afterGetExtremes(this: Series, e: AnyRecord|Event): void {
        const dataExtremes: DataExtremesObject = (e as any).dataExtremes,
            activeYData = dataExtremes.activeYData;

        if (this.dataModify && dataExtremes) {
            let extremes;

            if (this.options.compare) {
                extremes = [
                    this.dataModify.modifyValue(dataExtremes.dataMin),
                    this.dataModify.modifyValue(dataExtremes.dataMax)
                ];
            } else if (
                this.options.cumulative &&
                isArray(activeYData) &&
                // If only one y visible, sum doesn't change
                // so no need to change extremes
                activeYData.length >= 2
            ) {
                extremes = Additions.getCumulativeExtremes(activeYData);
            }

            if (extremes) {
                dataExtremes.dataMin = arrayMin(extremes);
                dataExtremes.dataMax = arrayMax(extremes);
            }
        }
    }

    /* ********************************************************************** *
     *  End shared compare and cumulative logic                               *
     * ********************************************************************** */

    /* ********************************************************************** *
     *  Start value compare logic                                             *
     * ********************************************************************** */

    /**
     * Highcharts Stock only. Set the
     * [compare](https://api.highcharts.com/highstock/plotOptions.series.compare)
     * mode of the series after render time.
     * In most cases it is more useful running
     * {@link Axis#setCompare} on the X axis to update all its series.
     *
     * @function Highcharts.Series#setCompare
     *
     * @param {string|null} [compare]
     *        Can be one of `undefined` (default), `null`, `"percent"`
     *        or `"value"`.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart or to wait for a later call to
     *        {@link Chart#redraw}.
     */
    function seriesSetCompare(
        this: Series,
        compare?: 'percent'|'value'|null,
        redraw?: boolean
    ): void {
        // Survive to export, #5485 (and for options generally)
        this.options.compare = this.userOptions.compare = compare;

        // Fire series.init() that will set or delete series.dataModify
        this.update({}, pick(redraw, true));

        if (this.dataModify && (compare === 'value' || compare === 'percent')) {
            this.dataModify.initCompare(compare);
        } else {
            // When disabling, clear the points
            this.points.forEach((point): void => {
                delete point.change;
            });
        }
    }

    /**
     * Extend series.processData by finding the first y value in the plot area,
     * used for comparing the following values
     *
     * @ignore
     * @function Highcharts.Series#processData
     */
    function afterProcessData(this: Series): void {
        const series = this;

        if (
            series.xAxis && // not pies
            series.processedYData &&
            series.dataModify
        ) {
            const processedXData = series.processedXData,
                processedYData = series.processedYData,
                length = processedYData.length,
                compareStart = series.options.compareStart === true ? 0 : 1;
            let keyIndex = -1,
                i;

            // For series with more than one value (range, OHLC etc), compare
            // against close or the pointValKey (#4922, #3112, #9854)
            if (series.pointArrayMap) {
                keyIndex = series.pointArrayMap.indexOf(
                    series.options.pointValKey || series.pointValKey || 'y'
                );
            }

            // find the first value for comparison
            for (i = 0; i < length - compareStart; i++) {
                const compareValue = processedYData[i] && keyIndex > -1 ?
                    (processedYData[i] as any)[keyIndex] : processedYData[i];

                if (
                    isNumber(compareValue) &&
                    compareValue !== 0 &&
                    processedXData[i + compareStart] >= (series.xAxis.min || 0)
                ) {
                    series.dataModify.compareValue = compareValue;
                    break;
                }
            }
        }
    }

    /**
     * Highcharts Stock only. Set the compare mode on all series
     * belonging to a Y axis.
     *
     * @see [plotOptions.series.compare](https://api.highcharts.com/highstock/plotOptions.series.compare)
     *
     * @sample stock/members/axis-setcompare/
     *         Set compare
     *
     * @function Highcharts.Axis#setCompare
     *
     * @param {string|null} [compare]
     *        The compare mode. Can be one of `undefined` (default), `null`,
     *        `"value"` or `"percent"`.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart or to wait for a later call to
     *        {@link Chart#redraw}.
     */
    function axisSetCompare(
        this: Axis,
        compare?: 'percent'|'value'|null,
        redraw?: boolean
    ): void {
        this.setModifier('compare', compare, redraw);
    }

    /* ********************************************************************** *
     *  End value compare logic                                               *
     * ********************************************************************** */

    /* ********************************************************************** *
     *  Start Cumulative Sum logic, author: Rafal Sebestjanski                *
     * ********************************************************************** */

    /**
     * Highcharts Stock only. Set the
     * [cumulative](https://api.highcharts.com/highstock/plotOptions.series.cumulative)
     * mode of the series after render time.
     * In most cases it is more useful running
     * {@link Axis#setCumulative} on the Y axis to update all its series.
     *
     * @function Highcharts.Series#setCumulative
     *
     * @param {boolean} [cumulative=false]
     *        Either enable or disable Cumulative Sum mode.
     *        Can be one of `false` (default) or `true`.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart or to wait for a later call to
     *        {@link Chart#redraw}.
     */
    function seriesSetCumulative(
        this: Series,
        cumulative?: boolean|null,
        redraw?: boolean
    ): void {
        // Set default value to false
        cumulative = pick(cumulative, false);

        // Survive to export, #5485 (and for options generally)
        this.options.cumulative = this.userOptions.cumulative = cumulative;

        // Fire series.init() that will set or delete series.dataModify
        this.update({}, pick(redraw, true));

        // If should, turn on the Cumulative Sum mode
        if (this.dataModify) {
            this.dataModify.initCumulative();
        } else {
            // When disabling, clear the points
            this.points.forEach((point): void => {
                delete point.cumulativeSum;
            });
        }
    }

    /**
     * Highcharts Stock only. Set the cumulative mode on all series
     * belonging to a Y axis.
     *
     * @see [plotOptions.series.cumulative](https://api.highcharts.com/highstock/plotOptions.series.cumulative)
     *
     * @sample stock/members/axis-setcumulative/
     *         Set cumulative
     *
     * @function Highcharts.Axis#setCumulative
     *
     * @param {boolean} [cumulative]
     *        Whether to disable or enable the cumulative mode.
     *        Can be one of `undefined` (default, treated as `false`),
     *        `false` or `true`.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart or to wait for a later call to
     *        {@link Chart#redraw}.
     */
    function axisSetCumulative(
        this: Axis,
        cumulative?: boolean|null,
        redraw?: boolean
    ): void {
        this.setModifier('cumulative', cumulative, redraw);
    }

    /* *
     *
     *  Classes
     *
     * */

    /**
     * @private
     */
    export class Additions {

        /* *
         *
         *  Constructors
         *
         * */

        /**
         * @private
         */
        public constructor(series: SeriesComposition) {
            this.series = series;
        }

        /* *
         *
         *  Properties
         *
         * */

        public series: SeriesComposition;
        public compare?: 'percent'|'value'|null;
        public compareValue?: number;

        public modifyValue(
            value?: number|null,
            index?: number
        ): number;

        /* *
        *
        *  Functions
        *
        * */

        /**
         * @private
         */
        public modifyValue(): number {
            return 0;
        }

        /**
         * @ignore
         * @function Highcharts.Series#getCumulativeExtremes
         *
         * @param {Array} [activeYData]
         *        An array cointaining all the points' y values
         *        in a visible range.
         */
        static getCumulativeExtremes(
            activeYData: Array<number>
        ): [number, number] {
            let cumulativeDataMin = Infinity,
                cumulativeDataMax = -Infinity;

            activeYData.reduce((prev, cur): number => {
                const sum = prev + cur;

                cumulativeDataMin = Math.min(cumulativeDataMin, sum, prev);
                cumulativeDataMax = Math.max(cumulativeDataMax, sum, prev);

                return sum;
            });

            return [cumulativeDataMin, cumulativeDataMax];
        }

        /**
         * @ignore
         * @function Highcharts.Series#initCompare
         *
         * @param {string} [compare]
         *        Can be one of `"percent"` or `"value"`.
         */
        public initCompare(compare: 'percent'|'value'): void {
            // Set the modifyValue method
            this.modifyValue = function (
                value?: number|null,
                index?: number
            ): number {
                if (value === null) {
                    value = 0;
                }

                const compareValue = this.compareValue;

                if (
                    typeof value !== 'undefined' &&
                    typeof compareValue !== 'undefined'
                ) { // #2601, #5814

                    // Get the modified value
                    if (compare === 'value') {
                        value -= compareValue;
                    // Compare percent
                    } else {
                        const compareBase = this.series.options.compareBase;

                        value = 100 * (value / compareValue) -
                            (compareBase === 100 ? 0 : 100);
                    }

                    // record for tooltip etc.
                    if (typeof index !== 'undefined') {
                        const point = this.series.points[index];

                        if (point) {
                            point.change = value;
                        }
                    }

                    return value;
                }
                return 0;
            };
        }

        /**
         * @ignore
         * @function Highcharts.Series#initCumulative
         */
        public initCumulative(): void {
            // Set the modifyValue method
            this.modifyValue = function (
                value?: number|null,
                index?: number
            ): number {
                if (value === null) {
                    value = 0;
                }

                if (value !== void 0 && index !== void 0) {
                    const prevPoint = index > 0 ?
                        this.series.points[index - 1] : null;

                    // Get the modified value
                    if (prevPoint && prevPoint.cumulativeSum) {
                        value = correctFloat(prevPoint.cumulativeSum + value);
                    }

                    // Record for tooltip etc.
                    const point = this.series.points[index];

                    if (point) {
                        point.cumulativeSum = value;
                    }

                    return value;
                }

                return 0;
            };
        }
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataModifyComposition;

/* *
 *
 *  API Options
 *
 * */

/**
 * Compare the values of the series against the first non-null, non-
 * zero value in the visible range. The y axis will show percentage
 * or absolute change depending on whether `compare` is set to `"percent"`
 * or `"value"`. When this is applied to multiple series, it allows
 * comparing the development of the series against each other. Adds
 * a `change` field to every point object.
 *
 * @see [compareBase](#plotOptions.series.compareBase)
 * @see [Axis.setCompare()](/class-reference/Highcharts.Axis#setCompare)
 * @see [Series.setCompare()](/class-reference/Highcharts.Series#setCompare)
 *
 * @sample {highstock} stock/plotoptions/series-compare-percent/
 *         Percent
 * @sample {highstock} stock/plotoptions/series-compare-value/
 *         Value
 *
 * @type      {string}
 * @since     1.0.1
 * @product   highstock
 * @validvalue ["percent", "value"]
 * @apioption plotOptions.series.compare
 */

/**
 * Defines if comparison should start from the first point within the visible
 * range or should start from the first point **before** the range.
 *
 * In other words, this flag determines if first point within the visible range
 * will have 0% (`compareStart=true`) or should have been already calculated
 * according to the previous point (`compareStart=false`).
 *
 * @sample {highstock} stock/plotoptions/series-comparestart/
 *         Calculate compare within visible range
 *
 * @type      {boolean}
 * @default   false
 * @since     6.0.0
 * @product   highstock
 * @apioption plotOptions.series.compareStart
 */

/**
 * When [compare](#plotOptions.series.compare) is `percent`, this option
 * dictates whether to use 0 or 100 as the base of comparison.
 *
 * @sample {highstock} stock/plotoptions/series-comparebase/
 *         Compare base is 100
 *
 * @type       {number}
 * @default    0
 * @since      5.0.6
 * @product    highstock
 * @validvalue [0, 100]
 * @apioption  plotOptions.series.compareBase
 */

/**
 * Cumulative Sum feature replaces points' values with the following formula:
 * `sum of all previous points' values + current point's value`.
 * Works only for points in a visible range.
 * Adds the `cumulativeSum` field to each point object that can be accessed
 * e.g. in the [tooltip.pointFormat](https://api.highcharts.com/highstock/tooltip.pointFormat).
 *
 * With `dataGrouping` enabled, default grouping approximation is set to `sum`.
 *
 * @see [Axis.setCumulative()](/class-reference/Highcharts.Axis#setCumulative)
 * @see [Series.setCumulative()](/class-reference/Highcharts.Series#setCumulative)
 *
 * @sample {highstock} stock/plotoptions/series-cumulative-sum/
 *         Cumulative Sum
 *
 * @type      {boolean}
 * @default   false
 * @since 9.3.0
 * @product   highstock
 * @apioption plotOptions.series.cumulative
 */

''; // keeps doclets above in transpiled file
