/* *
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

import type ColorType from '../../../Core/Color/ColorType';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';
import type {
    SupertrendOptions,
    SupertrendParamsOptions,
    SupertrendLinkedParentPointObject,
    SupertrendLinkedParentObject,
    SupertrendGappedExtensionObject,
    SupertrendGroupedPointsObject,
    SupertrendLineObject
} from './SupertrendOptions';
import type SupertrendPoint from './SupertrendPoint';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';

import { Palette } from '../../../Core/Color/Palettes.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    atr: ATRIndicator,
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Core/Utilities.js';
import StockChart from '../../../Core/Chart/StockChart.js';
const {
    addEvent,
    correctFloat,
    isArray,
    extend,
    merge,
    objectEach
} = U;

/* *
 *
 *  Functions
 *
 * */

// Utils:
/**
 * @private
 */
function createPointObj(
    mainSeries: SupertrendLinkedParentObject,
    index: number,
    close: number
): SupertrendLinkedParentPointObject {
    return {
        index: index,
        close: mainSeries.yData[index][close],
        x: mainSeries.xData[index]
    } as any;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Supertrend series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.supertrend
 *
 * @augments Highcharts.Series
 */
class SupertrendIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Supertrend indicator. This series requires the `linkedTo` option to be
     * set and should be loaded after the `stock/indicators/indicators.js` and
     * `stock/indicators/sma.js`.
     *
     * @sample {highstock} stock/indicators/supertrend
     *         Supertrend indicator
     *
     * @extends      plotOptions.sma
     * @since        7.0.0
     * @product      highstock
     * @excluding    allAreas, cropThreshold, negativeColor, colorAxis, joinBy,
     *               keys, navigatorOptions, pointInterval, pointIntervalUnit,
     *               pointPlacement, pointRange, pointStart, showInNavigator,
     *               stacking, threshold
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/supertrend
     * @optionparent plotOptions.supertrend
     */
    public static defaultOptions: SupertrendOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * Paramters used in calculation of Supertrend indicator series points.
         *
         * @excluding index
         */
        params: {
            index: void 0, // unchangeable index, do not inherit (#15362)
            /**
             * Multiplier for Supertrend Indicator.
             */
            multiplier: 3,
            /**
             * The base period for indicator Supertrend Indicator calculations.
             * This is the number of data points which are taken into account
             * for the indicator calculations.
             */
            period: 10
        },
        /**
         * Color of the Supertrend series line that is beneath the main series.
         *
         * @sample {highstock} stock/indicators/supertrend/
         *         Example with risingTrendColor
         *
         * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         */
        risingTrendColor: Palette.positiveColor,
        /**
         * Color of the Supertrend series line that is above the main series.
         *
         * @sample {highstock} stock/indicators/supertrend/
         *         Example with fallingTrendColor
         *
         * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         */
        fallingTrendColor: Palette.negativeColor,
        /**
         * The styles for the Supertrend line that intersect main series.
         *
         * @sample {highstock} stock/indicators/supertrend/
         *         Example with changeTrendLine
         */
        changeTrendLine: {
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,

                /**
                 * Color of the line.
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: Palette.neutralColor80,

                /**
                 * The dash or dot style of the grid lines. For possible
                 * values, see
                 * [this demonstration](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-dashstyle-all/).
                 *
                 * @sample {highcharts} highcharts/yaxis/gridlinedashstyle/
                 *         Long dashes
                 * @sample {highstock} stock/xaxis/gridlinedashstyle/
                 *         Long dashes
                 *
                 * @type  {Highcharts.DashStyleValue}
                 * @since 7.0.0
                 */
                dashStyle: 'LongDash'
            }
        }
    } as SupertrendOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<SupertrendPoint> = void 0 as any;

    public linkedParent: SupertrendLinkedParentObject = void 0 as any;

    public options: SupertrendOptions = void 0 as any;

    public points: Array<SupertrendPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        const indicator = this;

        super.init.apply(indicator, arguments);

        // Only after series are linked add some additional logic/properties.
        const unbinder = addEvent(
            StockChart,
            'afterLinkSeries',
            (): void => {
                // Protection for a case where the indicator is being updated,
                // for a brief moment the indicator is deleted.
                if (indicator.options) {
                    const options = indicator.options,
                        parentOptions = indicator.linkedParent.options;

                    // Indicator cropThreshold has to be equal linked series one
                    // reduced by period due to points comparison in drawGraph
                    // (#9787)
                    options.cropThreshold = (
                        (parentOptions.cropThreshold as any) -
                        ((options.params as any).period - 1)
                    );
                }
                unbinder();
            }, {
                order: 1
            }
        );
    }

    public drawGraph(): void {
        const indicator = this,
            indicOptions: SupertrendOptions = indicator.options,

            // Series that indicator is linked to
            mainSeries = indicator.linkedParent,
            mainLinePoints: Array<(SupertrendLinkedParentPointObject)> =
                (mainSeries ? mainSeries.points : []),
            indicPoints: Array<SupertrendPoint> = indicator.points,
            indicPath: (SVGElement|undefined) = indicator.graph,

            // Points offset between lines
            tempOffset: number = mainLinePoints.length - indicPoints.length,
            offset: number = tempOffset > 0 ? tempOffset : 0,
            // @todo: fix when ichi-moku indicator is merged to master.
            gappedExtend: SupertrendGappedExtensionObject = {
                options: {
                    gapSize: indicOptions.gapSize
                }
            },

            // Sorted supertrend points array
            groupedPoitns: SupertrendGroupedPointsObject = {
                top: [], // Rising trend line points
                bottom: [], // Falling trend line points
                intersect: [] // Change trend line points
            },

            // Options for trend lines
            supertrendLineOptions: SupertrendLineObject = {
                top: {
                    styles: {
                        lineWidth: indicOptions.lineWidth,
                        lineColor: (
                            indicOptions.fallingTrendColor ||
                            indicOptions.color
                        ),
                        dashStyle: indicOptions.dashStyle
                    }
                },
                bottom: {
                    styles: {
                        lineWidth: indicOptions.lineWidth,
                        lineColor: (
                            indicOptions.risingTrendColor ||
                            indicOptions.color
                        ),
                        dashStyle: indicOptions.dashStyle
                    }
                },
                intersect: indicOptions.changeTrendLine
            },
            close = 3;

        let // Supertrend line point
            point: SupertrendPoint,

            // Supertrend line next point (has smaller x pos than point)
            nextPoint: SupertrendPoint,

            // Main series points
            mainPoint: SupertrendLinkedParentPointObject,
            nextMainPoint: SupertrendLinkedParentPointObject,

            // Used when supertrend and main points are shifted
            // relative to each other
            prevMainPoint: SupertrendLinkedParentPointObject,
            prevPrevMainPoint: SupertrendLinkedParentPointObject,

            // Used when particular point color is set
            pointColor: ColorType,

            // Temporary points that fill groupedPoitns array
            newPoint: SupertrendPoint,
            newNextPoint: SupertrendPoint,

            indicPointsLen: number = indicPoints.length;

        // Loop which sort supertrend points
        while (indicPointsLen--) {
            point = indicPoints[indicPointsLen];
            nextPoint = indicPoints[indicPointsLen - 1];
            mainPoint = mainLinePoints[indicPointsLen - 1 + offset];
            nextMainPoint = mainLinePoints[indicPointsLen - 2 + offset];
            prevMainPoint = mainLinePoints[indicPointsLen + offset];
            prevPrevMainPoint = mainLinePoints[indicPointsLen + offset + 1];
            pointColor = (point.options.color as any);
            newPoint = {
                x: point.x,
                plotX: point.plotX,
                plotY: point.plotY,
                isNull: false
            } as SupertrendPoint;

            // When mainPoint is the last one (left plot area edge)
            // but supertrend has additional one
            if (
                !nextMainPoint &&
                mainPoint && mainSeries.yData[mainPoint.index - 1]
            ) {
                nextMainPoint = createPointObj(
                    mainSeries, mainPoint.index - 1, close
                );
            }

            // When prevMainPoint is the last one (right plot area edge)
            // but supertrend has additional one (and points are shifted)
            if (
                !prevPrevMainPoint &&
                prevMainPoint && mainSeries.yData[prevMainPoint.index + 1]
            ) {
                prevPrevMainPoint = createPointObj(
                    mainSeries, prevMainPoint.index + 1, close
                );
            }

            // When points are shifted (right or left plot area edge)
            if (
                !mainPoint &&
                nextMainPoint && mainSeries.yData[nextMainPoint.index + 1]
            ) {
                mainPoint = createPointObj(
                    mainSeries, nextMainPoint.index + 1, close
                );
            } else if (
                !mainPoint &&
                prevMainPoint && mainSeries.yData[prevMainPoint.index - 1]
            ) {
                mainPoint = createPointObj(
                    mainSeries, prevMainPoint.index - 1, close
                );
            }

            // Check if points are shifted relative to each other
            if (
                point &&
                mainPoint &&
                prevMainPoint &&
                nextMainPoint &&
                point.x !== mainPoint.x
            ) {
                if (point.x === prevMainPoint.x) {
                    nextMainPoint = mainPoint;
                    mainPoint = prevMainPoint;
                } else if (point.x === nextMainPoint.x) {
                    mainPoint = nextMainPoint;
                    nextMainPoint = ({
                        close: mainSeries.yData[mainPoint.index - 1][close],
                        x: mainSeries.xData[mainPoint.index - 1]
                    } as any);
                } else if (
                    prevPrevMainPoint && point.x === prevPrevMainPoint.x
                ) {
                    mainPoint = prevPrevMainPoint;
                    nextMainPoint = prevMainPoint;
                }
            }

            if (nextPoint && nextMainPoint && mainPoint) {

                newNextPoint = {
                    x: nextPoint.x,
                    plotX: nextPoint.plotX,
                    plotY: nextPoint.plotY,
                    isNull: false
                } as SupertrendPoint;

                if (
                    point.y >= mainPoint.close &&
                    nextPoint.y >= nextMainPoint.close
                ) {
                    point.color = (
                        pointColor || indicOptions.fallingTrendColor ||
                        indicOptions.color
                    );
                    groupedPoitns.top.push(newPoint);

                } else if (
                    point.y < mainPoint.close &&
                    nextPoint.y < nextMainPoint.close
                ) {
                    point.color = (
                        pointColor || indicOptions.risingTrendColor ||
                        indicOptions.color
                    );
                    groupedPoitns.bottom.push(newPoint);

                } else {
                    groupedPoitns.intersect.push(newPoint);
                    groupedPoitns.intersect.push(newNextPoint);

                    // Additional null point to make a gap in line
                    groupedPoitns.intersect.push(merge(newNextPoint, {
                        isNull: true
                    }));

                    if (
                        point.y >= mainPoint.close &&
                        nextPoint.y < nextMainPoint.close
                    ) {
                        point.color = (
                            pointColor || indicOptions.fallingTrendColor ||
                            indicOptions.color
                        );
                        nextPoint.color = (
                            pointColor || indicOptions.risingTrendColor ||
                            indicOptions.color
                        );
                        groupedPoitns.top.push(newPoint);
                        groupedPoitns.top.push(merge(newNextPoint, {
                            isNull: true
                        }));
                    } else if (
                        point.y < mainPoint.close &&
                        nextPoint.y >= nextMainPoint.close
                    ) {
                        point.color = (
                            pointColor || indicOptions.risingTrendColor ||
                            indicOptions.color
                        );
                        nextPoint.color = (
                            pointColor || indicOptions.fallingTrendColor ||
                            indicOptions.color
                        );
                        groupedPoitns.bottom.push(newPoint);
                        groupedPoitns.bottom.push(merge(newNextPoint, {
                            isNull: true
                        }));
                    }
                }
            } else if (mainPoint) {
                if (point.y >= mainPoint.close) {
                    point.color = (
                        pointColor || indicOptions.fallingTrendColor ||
                        indicOptions.color
                    );
                    groupedPoitns.top.push(newPoint);
                } else {
                    point.color = (
                        pointColor || indicOptions.risingTrendColor ||
                        indicOptions.color
                    );
                    groupedPoitns.bottom.push(newPoint);
                }
            }
        }

        // Generate lines:
        objectEach(groupedPoitns,
            function (values, lineName): void {
                indicator.points = values;
                indicator.options = merge(
                    (supertrendLineOptions as any)[lineName].styles,
                    gappedExtend
                );
                indicator.graph = (indicator as any)[
                    'graph' + lineName + 'Line'
                ];
                SMAIndicator.prototype.drawGraph.call(indicator);

                // Now save line
                (indicator as any)[
                    'graph' + lineName + 'Line'
                ] = indicator.graph;
            });

        // Restore options:
        indicator.points = indicPoints;
        indicator.options = indicOptions;
        indicator.graph = indicPath;
    }

    // Supertrend (Multiplier, Period) Formula:

    // BASIC UPPERBAND = (HIGH + LOW) / 2 + Multiplier * ATR(Period)
    // BASIC LOWERBAND = (HIGH + LOW) / 2 - Multiplier * ATR(Period)

    // FINAL UPPERBAND =
    //     IF(
    //      Current BASICUPPERBAND  < Previous FINAL UPPERBAND AND
    //      Previous Close > Previous FINAL UPPERBAND
    //     ) THEN (Current BASIC UPPERBAND)
    //     ELSE (Previous FINALUPPERBAND)

    // FINAL LOWERBAND =
    //     IF(
    //      Current BASIC LOWERBAND  > Previous FINAL LOWERBAND AND
    //      Previous Close < Previous FINAL LOWERBAND
    //     ) THEN (Current BASIC LOWERBAND)
    //     ELSE (Previous FINAL LOWERBAND)

    // SUPERTREND =
    //     IF(
    //      Previous Supertrend == Previous FINAL UPPERBAND AND
    //      Current Close < Current FINAL UPPERBAND
    //     ) THAN Current FINAL UPPERBAND
    //     ELSE IF(
    //      Previous Supertrend == Previous FINAL LOWERBAND AND
    //      Current Close < Current FINAL LOWERBAND
    //     ) THAN Current FINAL UPPERBAND
    //     ELSE IF(
    //      Previous Supertrend == Previous FINAL UPPERBAND AND
    //      Current Close > Current FINAL UPPERBAND
    //     ) THAN Current FINAL LOWERBAND
    //     ELSE IF(
    //      Previous Supertrend == Previous FINAL LOWERBAND AND
    //      Current Close > Current FINAL LOWERBAND
    //     ) THAN Current FINAL LOWERBAND

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: SupertrendParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period: number = (params.period as any),
            multiplier: number = (params.multiplier as any),
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            // 0- date, 1- Supertrend indicator
            st: Array<Array<(number|undefined)>> = [],
            xData: Array<number> = [],
            yData: Array<(number|undefined)> = [],
            close = 3,
            low = 2,
            high = 1,
            periodsOffset = (period === 0) ? 0 : period - 1,
            finalUp: Array<number> = [],
            finalDown: Array<number> = [];

        let atrData: Array<number> = [],
            basicUp: number,
            basicDown: number,
            supertrend: (number|undefined),
            prevFinalUp: number,
            prevFinalDown: number,
            prevST: (number|undefined), // previous Supertrend
            prevY: Array<number>,
            y: Array<number>,
            i: number;

        if (
            (xVal.length <= period) || !isArray(yVal[0]) ||
            yVal[0].length !== 4 || period < 0
        ) {
            return;
        }

        atrData = (ATRIndicator.prototype.getValues.call(this, series, {
            period: period
        }) as any).yData;

        for (i = 0; i < atrData.length; i++) {
            y = yVal[periodsOffset + i];
            prevY = yVal[periodsOffset + i - 1] || [];
            prevFinalUp = finalUp[i - 1];
            prevFinalDown = finalDown[i - 1];
            prevST = yData[i - 1];

            if (i === 0) {
                prevFinalUp = prevFinalDown = prevST = 0;
            }

            basicUp = correctFloat(
                (y[high] + y[low]) / 2 + multiplier * atrData[i]
            );
            basicDown = correctFloat(
                (y[high] + y[low]) / 2 - multiplier * atrData[i]
            );

            if (
                (basicUp < prevFinalUp) ||
                (prevY[close] > prevFinalUp)
            ) {
                finalUp[i] = basicUp;
            } else {
                finalUp[i] = prevFinalUp;
            }

            if (
                (basicDown > prevFinalDown) ||
                (prevY[close] < prevFinalDown)
            ) {
                finalDown[i] = basicDown;
            } else {
                finalDown[i] = prevFinalDown;
            }

            if (prevST === prevFinalUp && y[close] < finalUp[i] ||
                prevST === prevFinalDown && y[close] < finalDown[i]
            ) {
                supertrend = finalUp[i];
            } else if (
                prevST === prevFinalUp && y[close] > finalUp[i] ||
                prevST === prevFinalDown && y[close] > finalDown[i]
            ) {
                supertrend = finalDown[i];
            }

            st.push([xVal[periodsOffset + i], supertrend]);
            xData.push(xVal[periodsOffset + i]);
            yData.push(supertrend);
        }

        return {
            values: st,
            xData: xData,
            yData: yData
        } as IndicatorValuesObject<TLinkedSeries>;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface SupertrendIndicator {
    nameBase: string;
    nameComponents: Array<string>;
    pointClass: typeof SupertrendPoint;
}

extend(SupertrendIndicator.prototype, {
    nameBase: 'Supertrend',
    nameComponents: ['multiplier', 'period']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        supertrend: typeof SupertrendIndicator;
    }
}

SeriesRegistry.registerSeriesType('supertrend', SupertrendIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default SupertrendIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `Supertrend indicator` series. If the [type](#series.supertrend.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.supertrend
 * @since     7.0.0
 * @product   highstock
 * @excluding allAreas, colorAxis, cropThreshold, data, dataParser, dataURL,
 *            joinBy, keys, navigatorOptions, negativeColor, pointInterval,
 *            pointIntervalUnit, pointPlacement, pointRange, pointStart,
 *            showInNavigator, stacking, threshold
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/supertrend
 * @apioption series.supertrend
 */

''; // to include the above in the js output
