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
 *  Import
 *
 * */

import type ColorType from '../../../Core/Color/ColorType';
import type {
    IKHDrawSenkouSpanObject,
    IKHGapExtensionObject,
    IKHOptions,
    IKHParamsOptions,
    IKHSenkouSpanOptions
} from './IKHOptions';
import type IKHPoint from './IKHPoint';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LinePoint from '../../../Series/Line/LinePoint';
import type LineSeries from '../../../Series/Line/LineSeries';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';

import ApproximationRegistry from '../../../Extensions/DataGrouping/ApproximationRegistry.js';
import Axis from '../../../Core/Axis/Axis.js';
import Color from '../../../Core/Color/Color.js';
const { parse: color } = Color;
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    getClosestDistance
} = AH;
const { isArray, isNumber } = TC;
const { defined, merge, objectEach, extend } = OH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../../Core/Series/SeriesLike' {
    interface SeriesLike {
        fillGraph?: boolean;
    }
}

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function maxHigh(arr: Array<Array<number>>): number {
    return arr.reduce(function (max: number, res: Array<number>): number {
        return Math.max(max, res[1]);
    }, -Infinity);
}

/**
 * @private
 */
function minLow(arr: Array<Array<number>>): number {
    return arr.reduce(function (min: number, res: Array<number>): number {
        return Math.min(min, res[2]);
    }, Infinity);
}

/**
 * @private
 */
function highlowLevel(
    arr: Array<Array<number>>
): Record<string, number> {
    return {
        high: maxHigh(arr),
        low: minLow(arr)
    };
}

/**
 * Check two lines intersection (line a1-a2 and b1-b2)
 * Source: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
 * @private
 */
function checkLineIntersection(
    a1: IKHPoint | undefined,
    a2: IKHPoint | undefined,
    b1: IKHPoint | undefined,
    b2: IKHPoint | undefined
): (Record<string, number>|undefined) {
    if (a1 && a2 && b1 && b2) {
        const saX: number = a2.plotX - a1.plotX, // Auxiliary section a2-a1 X
            saY: number = a2.plotY - a1.plotY, // Auxiliary section a2-a1 Y
            sbX: number = b2.plotX - b1.plotX, // Auxiliary section b2-b1 X
            sbY: number = b2.plotY - b1.plotY, // Auxiliary section b2-b1 Y
            sabX: number = a1.plotX - b1.plotX, // Auxiliary section a1-b1 X
            sabY: number = a1.plotY - b1.plotY, // Auxiliary section a1-b1 Y
            // First degree Bézier parameters
            u = (-saY * sabX + saX * sabY) / (-sbX * saY + saX * sbY),
            t = (sbX * sabY - sbY * sabX) / (-sbX * saY + saX * sbY);

        if (u >= 0 && u <= 1 && t >= 0 && t <= 1) {
            return {
                plotX: a1.plotX + t * saX,
                plotY: a1.plotY + t * saY
            };
        }
    }
}

/**
 * Parameter opt (indicator options object) include indicator, points,
 * nextPoints, color, options, gappedExtend and graph properties
 * @private
 */
function drawSenkouSpan(
    opt: IKHDrawSenkouSpanObject
): void {
    const indicator = opt.indicator;

    indicator.points = opt.points;
    indicator.nextPoints = opt.nextPoints;
    indicator.color = opt.color;
    indicator.options = merge(
        (opt.options.senkouSpan as any).styles,
        opt.gap
    );
    indicator.graph = opt.graph;
    indicator.fillGraph = true;
    SeriesRegistry.seriesTypes.sma.prototype.drawGraph.call(indicator);
}

/**
 * Data integrity in Ichimoku is different than default 'averages':
 * Point: [undefined, value, value, ...] is correct
 * Point: [undefined, undefined, undefined, ...] is incorrect
 * @private
 */
function ichimokuAverages(): Array<(number|null|undefined)> | undefined {
    const ret: Array<(number|null|undefined)> = [];

    let isEmptyRange: (boolean|undefined);

    [].forEach.call(arguments, function (arr, i): void {
        ret.push(ApproximationRegistry.average(arr));
        isEmptyRange = !isEmptyRange && typeof ret[i] === 'undefined';
    });

    // Return undefined when first elem. is undefined and let
    // sum method handle null (#7377)
    return isEmptyRange ? void 0 : ret;
}

/* *
 *
 *  Class
 *
 * */

/**
 * The IKH series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.ikh
 *
 * @augments Highcharts.Series
 */
class IKHIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Ichimoku Kinko Hyo (IKH). This series requires `linkedTo` option to be
     * set.
     *
     * @sample stock/indicators/ichimoku-kinko-hyo
     *         Ichimoku Kinko Hyo indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @excluding    allAreas, colorAxis, compare, compareBase, joinBy, keys,
     *               navigatorOptions, pointInterval, pointIntervalUnit,
     *               pointPlacement, pointRange, pointStart, showInNavigator,
     *               stacking
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/ichimoku-kinko-hyo
     * @optionparent plotOptions.ikh
     */

    public static defaultOptions: IKHOptions = merge(
        SMAIndicator.defaultOptions,
        {
            /**
             * @excluding index
             */
            params: {
                index: void 0, // unused index, do not inherit (#15362)
                period: 26,
                /**
                 * The base period for Tenkan calculations.
                 */
                periodTenkan: 9,
                /**
                 * The base period for Senkou Span B calculations
                 */
                periodSenkouSpanB: 52
            },
            marker: {
                enabled: false
            },
            tooltip: {
                pointFormat:
                    '<span style="color:{point.color}">\u25CF</span> <b> {series.name}</b><br/>' +
                    'TENKAN SEN: {point.tenkanSen:.3f}<br/>' +
                    'KIJUN SEN: {point.kijunSen:.3f}<br/>' +
                    'CHIKOU SPAN: {point.chikouSpan:.3f}<br/>' +
                    'SENKOU SPAN A: {point.senkouSpanA:.3f}<br/>' +
                    'SENKOU SPAN B: {point.senkouSpanB:.3f}<br/>'
            },
            /**
             * The styles for Tenkan line
             */
            tenkanLine: {
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
                    lineColor: void 0
                }
            },
            /**
             * The styles for Kijun line
             */
            kijunLine: {
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
                    lineColor: void 0
                }
            },
            /**
             * The styles for Chikou line
             */
            chikouLine: {
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
                    lineColor: void 0
                }
            },
            /**
             * The styles for Senkou Span A line
             */
            senkouSpanA: {
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
                    lineColor: void 0
                }
            },
            /**
             * The styles for Senkou Span B line
             */
            senkouSpanB: {
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
                    lineColor: void 0
                }
            },
            /**
             * The styles for area between Senkou Span A and B.
             */
            senkouSpan: {
                /**
                 * Color of the area between Senkou Span A and B,
                 * when Senkou Span A is above Senkou Span B. Note that if
                 * a `style.fill` is defined, the `color` takes precedence and
                 * the `style.fill` is ignored.
                 *
                 * @see [senkouSpan.styles.fill](#series.ikh.senkouSpan.styles.fill)
                 *
                 * @sample stock/indicators/ichimoku-kinko-hyo
                 *         Ichimoku Kinko Hyo color
                 *
                 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                 * @since     7.0.0
                 * @apioption plotOptions.ikh.senkouSpan.color
                 */

                /**
                 * Color of the area between Senkou Span A and B,
                 * when Senkou Span A is under Senkou Span B.
                 *
                 * @sample stock/indicators/ikh-negative-color
                 *         Ichimoku Kinko Hyo negativeColor
                 *
                 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                 * @since     7.0.0
                 * @apioption plotOptions.ikh.senkouSpan.negativeColor
                 */

                styles: {
                    /**
                     * Color of the area between Senkou Span A and B.
                     *
                     * @deprecated
                     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
                     */
                    fill: 'rgba(255, 0, 0, 0.5)'
                }
            },
            dataGrouping: {
                approximation: 'ichimoku-averages'
            }
        } as IKHOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<IKHPoint> = [];
    public options: IKHOptions = {};
    public points: Array<IKHPoint> = [];
    public graphCollection: Array<string> = [];
    public graphsenkouSpan?: SVGElement;
    public ikhMap?: Record<string, Array<IKHPoint>>;
    public nextPoints?: Array<IKHPoint>;

    /* *
     *
     * Functions
     *
     * */

    public init(): void {
        super.init.apply(this, arguments);

        // Set default color for lines:
        this.options = merge(
            {
                tenkanLine: {
                    styles: {
                        lineColor: this.color
                    }
                },
                kijunLine: {
                    styles: {
                        lineColor: this.color
                    }
                },
                chikouLine: {
                    styles: {
                        lineColor: this.color
                    }
                },
                senkouSpanA: {
                    styles: {
                        lineColor: this.color,
                        fill: color(this.color).setOpacity(0.5).get()
                    }
                },
                senkouSpanB: {
                    styles: {
                        lineColor: this.color,
                        fill: color(this.color).setOpacity(0.5).get()
                    }
                },
                senkouSpan: {
                    styles: {
                        fill: color(this.color).setOpacity(0.2).get()
                    }
                }
            },
            this.options
        );
    }

    public toYData(point: IKHPoint): Array<number> {
        return [
            point.tenkanSen,
            point.kijunSen,
            point.chikouSpan,
            point.senkouSpanA,
            point.senkouSpanB
        ];
    }

    public translate(): void {
        const indicator = this;

        SeriesRegistry.seriesTypes.sma.prototype.translate.apply(indicator);

        for (const point of indicator.points) {
            for (const key of indicator.pointArrayMap) {
                const pointValue = point[key];
                if (isNumber(pointValue)) {
                    (point as any)['plot' + key] = indicator.yAxis.toPixels(
                        pointValue,
                        true
                    );

                    // Add extra parameters for support tooltip in moved
                    // lines
                    point.plotY = (point as any)['plot' + key];
                    point.tooltipPos = [
                        point.plotX,
                        (point as any)['plot' + key]
                    ];
                    point.isNull = false;
                }
            }
        }
    }

    public drawGraph(): void {
        const indicator = this,
            mainLinePoints: Array<IKHPoint> =
                indicator.points,
            mainLineOptions: IKHOptions = indicator.options,
            mainLinePath = indicator.graph,
            mainColor = indicator.color,
            gappedExtend: IKHGapExtensionObject = {
                options: {
                    gapSize: mainLineOptions.gapSize
                }
            },
            pointArrayMapLength: number = indicator.pointArrayMap.length,
            allIchimokuPoints: Array<Array<IKHPoint>> = [
                [],
                [],
                [],
                [],
                [],
                []
            ],
            ikhMap: Record<string,
            Array<IKHPoint>
            > = {
                tenkanLine: allIchimokuPoints[0],
                kijunLine: allIchimokuPoints[1],
                chikouLine: allIchimokuPoints[2],
                senkouSpanA: allIchimokuPoints[3],
                senkouSpanB: allIchimokuPoints[4],
                senkouSpan: allIchimokuPoints[5]
            },
            intersectIndexColl: Array<number> = [],
            senkouSpanOptions: IKHSenkouSpanOptions = indicator
                .options.senkouSpan as any,
            color: ColorType =
                senkouSpanOptions.color ||
                (senkouSpanOptions.styles as any).fill,
            negativeColor: ColorType | undefined =
                senkouSpanOptions.negativeColor,
            // Points to create color and negativeColor senkouSpan
            points: Array<Array<IKHPoint>> = [
                [], // Points color
                [] // Points negative color
            ],
            // For span, we need an access to the next points, used in
            // getGraphPath()
            nextPoints: Array<Array<IKHPoint>> = [
                [], // NextPoints color
                [] // NextPoints negative color
            ];

        let pointsLength: number = mainLinePoints.length,
            lineIndex = 0,
            position: keyof IKHPoint,
            point: IKHPoint,
            i: number,
            startIntersect: number,
            endIntersect: number,
            sectionPoints: Array<IKHPoint>,
            sectionNextPoints: Array<IKHPoint>,
            pointsPlotYSum: number,
            nextPointsPlotYSum: number,
            senkouSpanTempColor,
            concatArrIndex: number,
            j: number,
            k: number;

        indicator.ikhMap = ikhMap;

        // Generate points for all lines and spans lines:
        while (pointsLength--) {
            point = mainLinePoints[pointsLength];
            for (i = 0; i < pointArrayMapLength; i++) {
                position = indicator.pointArrayMap[i];

                if (defined(point[position])) {
                    allIchimokuPoints[i].push({
                        plotX: point.plotX,
                        plotY: (point as any)['plot' + position],
                        isNull: false
                    } as any);
                }
            }

            if (negativeColor && pointsLength !== mainLinePoints.length - 1) {
                // Check if lines intersect
                const index = ikhMap.senkouSpanB.length - 1,
                    intersect = checkLineIntersection(
                        ikhMap.senkouSpanA[index - 1],
                        ikhMap.senkouSpanA[index],
                        ikhMap.senkouSpanB[index - 1],
                        ikhMap.senkouSpanB[index]
                    );

                if (intersect) {
                    const intersectPointObj = {
                        plotX: intersect.plotX,
                        plotY: intersect.plotY,
                        isNull: false,
                        intersectPoint: true
                    };

                    // Add intersect point to ichimoku points collection
                    // Create senkouSpan sections
                    ikhMap.senkouSpanA.splice(
                        index,
                        0,
                        intersectPointObj as any
                    );
                    ikhMap.senkouSpanB.splice(
                        index,
                        0,
                        intersectPointObj as any
                    );
                    intersectIndexColl.push(index);
                }
            }
        }

        // Modify options and generate lines:
        objectEach(
            ikhMap,
            (values, lineName): void => {
                if (
                    (mainLineOptions as any)[lineName] &&
                    lineName !== 'senkouSpan'
                ) {
                    // First line is rendered by default option
                    indicator.points = allIchimokuPoints[lineIndex];
                    indicator.options = merge(
                        (mainLineOptions as any)[lineName].styles,
                        gappedExtend
                    );
                    indicator.graph = (indicator as any)['graph' + lineName];

                    indicator.fillGraph = false;
                    indicator.color = mainColor;
                    SeriesRegistry.seriesTypes.sma.prototype.drawGraph.call(
                        indicator
                    );

                    // Now save line
                    (indicator as any)['graph' + lineName] = indicator.graph;
                }

                lineIndex++;
            }
        );

        // Generate senkouSpan area:

        // If graphCollection exist then remove svg
        // element and indicator property
        if (indicator.graphCollection) {
            for (const graphName of indicator.graphCollection) {
                (indicator as any)[graphName].destroy();
                delete (indicator as any)[graphName];
            }
        }

        // Clean graphCollection or initialize it
        indicator.graphCollection = [];

        // When user set negativeColor property
        if (negativeColor && ikhMap.senkouSpanA[0] && ikhMap.senkouSpanB[0]) {
            // Add first and last point to senkouSpan area sections
            intersectIndexColl.unshift(0);
            intersectIndexColl.push(ikhMap.senkouSpanA.length - 1);

            // Populate points and nextPoints arrays
            for (j = 0; j < intersectIndexColl.length - 1; j++) {
                startIntersect = intersectIndexColl[j];
                endIntersect = intersectIndexColl[j + 1];

                sectionPoints = ikhMap.senkouSpanB.slice(
                    startIntersect,
                    endIntersect + 1
                );

                sectionNextPoints = ikhMap.senkouSpanA.slice(
                    startIntersect,
                    endIntersect + 1
                );

                // Add points to color or negativeColor arrays
                // Check the middle point (if exist)
                if (Math.floor(sectionPoints.length / 2) >= 1) {
                    const x = Math.floor(sectionPoints.length / 2);

                    // When middle points has equal values
                    // Compare all points plotY value sum
                    if (sectionPoints[x].plotY === sectionNextPoints[x].plotY) {
                        pointsPlotYSum = 0;
                        nextPointsPlotYSum = 0;

                        for (k = 0; k < sectionPoints.length; k++) {
                            pointsPlotYSum += sectionPoints[k].plotY;
                            nextPointsPlotYSum += sectionNextPoints[k].plotY;
                        }

                        concatArrIndex =
                            pointsPlotYSum > nextPointsPlotYSum ? 0 : 1;

                        points[concatArrIndex] = points[concatArrIndex].concat(
                            sectionPoints
                        );

                        nextPoints[concatArrIndex] = nextPoints[
                            concatArrIndex
                        ].concat(sectionNextPoints);
                    } else {
                        // Compare middle point of the section
                        concatArrIndex = (
                            sectionPoints[x].plotY > sectionNextPoints[x].plotY
                        ) ? 0 : 1;

                        points[concatArrIndex] = points[concatArrIndex].concat(
                            sectionPoints
                        );

                        nextPoints[concatArrIndex] = nextPoints[
                            concatArrIndex
                        ].concat(sectionNextPoints);
                    }
                } else {
                    // Compare first point of the section
                    concatArrIndex = (
                        sectionPoints[0].plotY > sectionNextPoints[0].plotY
                    ) ? 0 : 1;

                    points[concatArrIndex] = points[concatArrIndex].concat(
                        sectionPoints
                    );

                    nextPoints[concatArrIndex] = nextPoints[
                        concatArrIndex
                    ].concat(sectionNextPoints);
                }
            }

            // Render color and negativeColor paths
            ['graphsenkouSpanColor', 'graphsenkouSpanNegativeColor'].forEach(
                function (areaName: string, i: number): void {
                    if (points[i].length && nextPoints[i].length) {
                        senkouSpanTempColor = i === 0 ? color : negativeColor;

                        drawSenkouSpan({
                            indicator: indicator,
                            points: points[i],
                            nextPoints: nextPoints[i],
                            color: senkouSpanTempColor,
                            options: mainLineOptions,
                            gap: gappedExtend,
                            graph: (indicator as any)[areaName]
                        });

                        // Now save line
                        (indicator as any)[areaName] = indicator.graph;
                        indicator.graphCollection.push(areaName);
                    }
                }
            );
        } else {
            // When user set only senkouSpan style.fill property
            drawSenkouSpan({
                indicator: indicator,
                points: ikhMap.senkouSpanB,
                nextPoints: ikhMap.senkouSpanA,
                color: color,
                options: mainLineOptions,
                gap: gappedExtend,
                graph: indicator.graphsenkouSpan
            });

            // Now save line
            indicator.graphsenkouSpan = indicator.graph;
        }

        // Clean temporary properties:
        delete indicator.nextPoints;
        delete indicator.fillGraph;

        // Restore options and draw the Tenkan line:
        indicator.points = mainLinePoints;
        indicator.options = mainLineOptions;
        indicator.graph = mainLinePath;
        indicator.color = mainColor;
    }

    public getGraphPath(points: Array<LinePoint>): SVGPath {
        const indicator = this;

        let path: SVGPath = [],
            spanA: SVGPath,
            spanAarr: SVGPath = [];

        points = points || this.points;

        // Render Senkou Span
        if (indicator.fillGraph && indicator.nextPoints) {
            spanA = SeriesRegistry.seriesTypes.sma.prototype.getGraphPath.call(
                indicator,
                // Reverse points, so Senkou Span A will start from the end:
                indicator.nextPoints
            );

            if (spanA && spanA.length) {
                spanA[0][0] = 'L';

                path = SeriesRegistry.seriesTypes.sma.prototype.getGraphPath
                    .call(indicator, points);

                spanAarr = spanA.slice(0, path.length);

                for (let i = spanAarr.length - 1; i >= 0; i--) {
                    path.push(spanAarr[i]);
                }
            }
        } else {
            path = SeriesRegistry.seriesTypes.sma.prototype.getGraphPath
                .apply(indicator, arguments);
        }

        return path;
    }

    public getValues <TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: IKHParamsOptions
    ): IndicatorValuesObject<TLinkedSeries> | undefined {
        const period: number = params.period as any,
            periodTenkan: number = params.periodTenkan as any,
            periodSenkouSpanB: number = params.periodSenkouSpanB as any,
            xVal: Array<number> = series.xData as any,
            yVal: Array<Array<number>> = series.yData as any,
            xAxis: Axis = series.xAxis,
            yValLen: number = (yVal && yVal.length) || 0,
            closestPointRange: number = getClosestDistance(
                xAxis.series.map((s): number[] => s.xData || [])
            ) as any,
            IKH: Array<Array<number | undefined>> = [],
            xData: Array<number> = [];

        let date: number | undefined,
            slicedTSY: Array<Array<number>>,
            slicedKSY: Array<Array<number>>,
            slicedSSBY: Array<Array<number>>,
            pointTS: Record<string, number>,
            pointKS: Record<string, number>,
            pointSSB: Record<string, number>,
            i: number,
            TS: number | undefined,
            KS: number | undefined,
            CS: number | undefined,
            SSA: number | undefined,
            SSB: number | undefined;

        // Ikh requires close value
        if (
            xVal.length <= period ||
            !isArray(yVal[0]) ||
            yVal[0].length !== 4
        ) {
            return;
        }

        // Add timestamps at the beginning
        const dateStart = xVal[0] - period * closestPointRange;

        for (i = 0; i < period; i++) {
            xData.push(dateStart + i * closestPointRange);
        }

        for (i = 0; i < yValLen; i++) {
            // Tenkan Sen
            if (i >= periodTenkan) {
                slicedTSY = yVal.slice(i - periodTenkan, i);

                pointTS = highlowLevel(slicedTSY);

                TS = (pointTS.high + pointTS.low) / 2;
            }

            if (i >= period) {
                slicedKSY = yVal.slice(i - period, i);

                pointKS = highlowLevel(slicedKSY);

                KS = (pointKS.high + pointKS.low) / 2;

                SSA = ((TS as any) + KS) / 2;
            }

            if (i >= periodSenkouSpanB) {
                slicedSSBY = yVal.slice(i - periodSenkouSpanB, i);

                pointSSB = highlowLevel(slicedSSBY);

                SSB = (pointSSB.high + pointSSB.low) / 2;
            }

            CS = yVal[i][3];

            date = xVal[i];

            if (typeof IKH[i] === 'undefined') {
                IKH[i] = [];
            }

            if (typeof IKH[i + period - 1] === 'undefined') {
                IKH[i + period - 1] = [];
            }

            IKH[i + period - 1][0] = TS;
            IKH[i + period - 1][1] = KS;
            IKH[i + period - 1][2] = void 0;

            if (typeof IKH[i + 1] === 'undefined') {
                IKH[i + 1] = [];
            }

            IKH[i + 1][2] = CS;

            if (i <= period) {
                IKH[i + period - 1][3] = void 0;
                IKH[i + period - 1][4] = void 0;
            }

            if (typeof IKH[i + 2 * period - 2] === 'undefined') {
                IKH[i + 2 * period - 2] = [];
            }

            IKH[i + 2 * period - 2][3] = SSA;
            IKH[i + 2 * period - 2][4] = SSB;

            xData.push(date);
        }

        // Add timestamps for further points
        for (i = 1; i <= period; i++) {
            xData.push((date as any) + i * closestPointRange);
        }

        return {
            values: IKH,
            xData: xData,
            yData: IKH
        } as IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface IKHIndicator {
    pointClass: typeof IKHPoint;
    nameComponents: Array<string>;
    pointValKey: string;
    pointArrayMap: Array<keyof IKHPoint>;
}

extend(IKHIndicator.prototype, {
    pointArrayMap: [
        'tenkanSen',
        'kijunSen',
        'chikouSpan',
        'senkouSpanA',
        'senkouSpanB'
    ],
    pointValKey: 'tenkanSen',
    nameComponents: ['periodSenkouSpanB', 'period', 'periodTenkan']
});

/* *
 *
 *  Registry
 *
 * */

ApproximationRegistry['ichimoku-averages'] = ichimokuAverages;

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        ikh: typeof IKHIndicator;
    }
}
SeriesRegistry.registerSeriesType('ikh', IKHIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default IKHIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `IKH` series. If the [type](#series.ikh.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.ikh
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/ichimoku-kinko-hyo
 * @apioption series.ikh
 */

(''); // add doclet above to transpiled file
