/* *
 *
 *  (c) 2010-2021 Paweł Dalek
 *
 *  Volume By Price (VBP) indicator for Highcharts Stock
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

import type AxisType from '../../../Core/Axis/AxisType';
import type Chart from '../../../Core/Chart/Chart';
import type ColumnSeries from '../../../Series/Column/ColumnSeries';
import type CSSObject from '../../../Core/Renderer/CSSObject';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';
import type SVGAttributes from '../../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';
import type {
    VBPOptions,
    VBPParamsOptions
} from './VBPOptions';
import VBPPoint from './VBPPoint.js';

import A from '../../../Core/Animation/AnimationUtilities.js';
const { animObject } = A;
import H from '../../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    column: {
        prototype: columnProto
    },
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Core/Utilities.js';
import StockChart from '../../../Core/Chart/StockChart.js';
const {
    addEvent,
    arrayMax,
    arrayMin,
    correctFloat,
    defined,
    error,
    extend,
    isArray,
    merge
} = U;

/* *
 *
 *  Constants
 *
 * */

const abs = Math.abs;

/* *
 *
 *  Functions
 *
 * */

// Utils
/**
 * @private
 */
function arrayExtremesOHLC(
    data: Array<Array<number>>
): Record<string, number> {
    const dataLength: number = data.length;

    let min: number = data[0][3],
        max: number = min,
        i = 1,
        currentPoint: number;

    for (; i < dataLength; i++) {
        currentPoint = data[i][3];
        if (currentPoint < min) {
            min = currentPoint;
        }

        if (currentPoint > max) {
            max = currentPoint;
        }
    }

    return {
        min: min,
        max: max
    };
}

/* *
 *
 *  Class
 *
 * */

/**
 * The Volume By Price (VBP) series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.vbp
 *
 * @augments Highcharts.Series
 */
class VBPIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Volume By Price indicator.
     *
     * This series requires `linkedTo` option to be set.
     *
     * @sample stock/indicators/volume-by-price
     *         Volume By Price indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/volume-by-price
     * @optionparent plotOptions.vbp
     */
    public static defaultOptions: VBPOptions = merge(SMAIndicator.defaultOptions, {
        /**
         * @excluding index, period
         */
        params: {
            // Index and period are unchangeable, do not inherit (#15362)
            index: void 0,
            period: void 0,
            /**
             * The number of price zones.
             */
            ranges: 12,
            /**
             * The id of volume series which is mandatory. For example using
             * OHLC data, volumeSeriesID='volume' means the indicator will be
             * calculated using OHLC and volume values.
             */
            volumeSeriesID: 'volume'
        },
        /**
         * The styles for lines which determine price zones.
         */
        zoneLines: {
            /**
             * Enable/disable zone lines.
             */
            enabled: true,
            /**
             * Specify the style of zone lines.
             *
             * @type    {Highcharts.CSSObject}
             * @default {"color": "#0A9AC9", "dashStyle": "LongDash", "lineWidth": 1}
             */
            styles: {
                /** @ignore-option */
                color: '#0A9AC9',
                /** @ignore-option */
                dashStyle: 'LongDash',
                /** @ignore-option */
                lineWidth: 1
            }
        },
        /**
         * The styles for bars when volume is divided into positive/negative.
         */
        volumeDivision: {
            /**
             * Option to control if volume is divided.
             */
            enabled: true,
            styles: {
                /**
                 * Color of positive volume bars.
                 *
                 * @type {Highcharts.ColorString}
                 */
                positiveColor: 'rgba(144, 237, 125, 0.8)',
                /**
                 * Color of negative volume bars.
                 *
                 * @type {Highcharts.ColorString}
                 */
                negativeColor: 'rgba(244, 91, 91, 0.8)'
            }
        },
        // To enable series animation; must be animationLimit > pointCount
        animationLimit: 1000,
        enableMouseTracking: false,
        pointPadding: 0,
        zIndex: -1,
        crisp: true,
        dataGrouping: {
            enabled: false
        },
        dataLabels: {
            allowOverlap: true,
            enabled: true,
            format: 'P: {point.volumePos:.2f} | N: {point.volumeNeg:.2f}',
            padding: 0,
            style: {
                /** @internal */
                fontSize: '0.5em'
            },
            verticalAlign: 'top'
        }
    } as VBPOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<VBPPoint> = void 0 as any;
    public negWidths: Array<number> = void 0 as any;
    public options: VBPOptions = void 0 as any;
    public points: Array<VBPPoint> = void 0 as any;
    public posWidths: Array<number> = void 0 as any;
    public priceZones: Array<VBPIndicator.VBPIndicatorPriceZoneObject> = void 0 as any;
    public rangeStep: number = void 0 as any;
    public volumeDataArray: Array<number> = void 0 as any;
    public zoneStarts: Array<number> = void 0 as any;
    public zoneLinesSVG?: SVGElement = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(
        chart: Chart,
        options: VBPOptions
    ): VBPIndicator {
        const indicator = this;

        // series.update() sends data that is not necessary
        // as everything is calculated in getValues(), #17007
        delete options.data;

        super.init.apply(indicator, arguments);

        // Only after series are linked add some additional logic/properties.
        const unbinder = addEvent(
            StockChart,
            'afterLinkSeries',
            function (): void {
                // Protection for a case where the indicator is being updated,
                // for a brief moment the indicator is deleted.
                if (indicator.options) {
                    const params: VBPParamsOptions =
                            (indicator.options.params as any),
                        baseSeries: LineSeries = indicator.linkedParent,
                        volumeSeries: LineSeries = (
                            chart.get((params.volumeSeriesID as any)) as any
                        );

                    indicator.addCustomEvents(baseSeries, volumeSeries);

                }
                unbinder();
            }, {
                order: 1
            }
        );

        return indicator;
    }

    // Adds events related with removing series
    public addCustomEvents(
        baseSeries: LineSeries,
        volumeSeries: LineSeries
    ): VBPIndicator {
        const indicator = this,
            toEmptyIndicator = (): void => {
                indicator.chart.redraw();

                indicator.setData([]);
                indicator.zoneStarts = [];

                if (indicator.zoneLinesSVG) {
                    indicator.zoneLinesSVG = indicator.zoneLinesSVG.destroy();
                }
            };

        // If base series is deleted, indicator series data is filled with
        // an empty array
        indicator.dataEventsToUnbind.push(
            addEvent(baseSeries, 'remove', function (): void {
                toEmptyIndicator();
            })
        );

        // If volume series is deleted, indicator series data is filled with
        // an empty array
        if (volumeSeries) {
            indicator.dataEventsToUnbind.push(
                addEvent(volumeSeries, 'remove', function (): void {
                    toEmptyIndicator();
                })
            );
        }

        return indicator;
    }

    // Initial animation
    public animate(
        init: boolean
    ): void {
        const series = this,
            inverted = series.chart.inverted,
            group = series.group,
            attr: SVGAttributes = {};

        if (!init && group) {
            const position = inverted ? series.yAxis.top : series.xAxis.left;

            if (inverted) {
                group['forceAnimate:translateY'] = true;
                attr.translateY = position;
            } else {
                group['forceAnimate:translateX'] = true;
                attr.translateX = position;
            }

            group.animate(
                attr,
                extend(animObject(series.options.animation), {
                    step: function (val: any, fx: any): void {
                        (series.group as any).attr({
                            scaleX: Math.max(0.001, fx.pos)
                        });
                    }
                })
            );
        }
    }

    public drawPoints(): void {
        const indicator = this;

        if ((indicator.options.volumeDivision as any).enabled) {
            indicator.posNegVolume(true, true);
            columnProto.drawPoints.apply(indicator, arguments);
            indicator.posNegVolume(false, false);
        }

        columnProto.drawPoints.apply(indicator, arguments);
    }

    // Function responsible for dividing volume into positive and negative
    public posNegVolume(
        initVol: boolean,
        pos: boolean
    ): void {
        const indicator = this,
            signOrder: Array<string> = pos ?
                ['positive', 'negative'] :
                ['negative', 'positive'],
            volumeDivision: VBPIndicator.VBPIndicatorStyleOptions = (
                indicator.options.volumeDivision as any
            ),
            pointLength: number = indicator.points.length;

        let posWidths: Array<number> = [],
            negWidths: Array<number> = [],
            i = 0,
            pointWidth: number,
            priceZone: VBPIndicator.VBPIndicatorPriceZoneObject,
            wholeVol: number,
            point: VBPPoint;

        if (initVol) {
            indicator.posWidths = posWidths;
            indicator.negWidths = negWidths;
        } else {
            posWidths = indicator.posWidths;
            negWidths = indicator.negWidths;
        }

        for (; i < pointLength; i++) {
            point = indicator.points[i];
            (point as any)[signOrder[0] + 'Graphic'] = point.graphic;
            point.graphic = (point as any)[signOrder[1] + 'Graphic'];

            if (initVol) {
                pointWidth = (point.shapeArgs as any).width;
                priceZone = indicator.priceZones[i];
                wholeVol = priceZone.wholeVolumeData;

                if (wholeVol) {
                    posWidths.push(
                        pointWidth / wholeVol * priceZone.positiveVolumeData
                    );
                    negWidths.push(
                        pointWidth / wholeVol * priceZone.negativeVolumeData
                    );
                } else {
                    posWidths.push(0);
                    negWidths.push(0);
                }
            }

            point.color = pos ?
                (volumeDivision.styles as any).positiveColor :
                (volumeDivision.styles as any).negativeColor;
            (point.shapeArgs as any).width = pos ?
                indicator.posWidths[i] :
                indicator.negWidths[i];
            (point.shapeArgs as any).x = pos ?
                (point.shapeArgs as any).x :
                indicator.posWidths[i];
        }
    }

    public translate(): void {
        const indicator = this,
            options: VBPOptions = indicator.options,
            chart: Chart = indicator.chart,
            yAxis: AxisType = indicator.yAxis,
            yAxisMin: number = (yAxis.min as any),
            zoneLinesOptions: VBPIndicator.VBPIndicatorStyleOptions = (
                indicator.options.zoneLines as any
            ),
            priceZones: Array<VBPIndicator.VBPIndicatorPriceZoneObject> = (
                indicator.priceZones
            );

        let yBarOffset = 0,
            volumeDataArray: Array<number>,
            maxVolume: number,
            primalBarWidth: number,
            barHeight: number,
            barHeightP: number,
            oldBarHeight: number,
            barWidth: number,
            pointPadding: number,
            chartPlotTop: number,
            barX: number,
            barY: number;

        columnProto.translate.apply(indicator);

        const indicatorPoints = indicator.points;

        // Do translate operation when points exist
        if (indicatorPoints.length) {
            pointPadding = (options.pointPadding as any) < 0.5 ?
                (options.pointPadding as any) :
                0.1;
            volumeDataArray = indicator.volumeDataArray;
            maxVolume = arrayMax(volumeDataArray);
            primalBarWidth = chart.plotWidth / 2;
            chartPlotTop = chart.plotTop;
            barHeight = abs(yAxis.toPixels(yAxisMin) -
                yAxis.toPixels(yAxisMin + indicator.rangeStep));
            oldBarHeight = abs(yAxis.toPixels(yAxisMin) -
                yAxis.toPixels(yAxisMin + indicator.rangeStep));

            if (pointPadding) {
                barHeightP = abs(barHeight * (1 - 2 * pointPadding));
                yBarOffset = abs((barHeight - barHeightP) / 2);
                barHeight = abs(barHeightP);
            }

            indicatorPoints.forEach(
                function (
                    point: VBPPoint,
                    index: number
                ): void {
                    barX = point.barX = point.plotX = 0;
                    barY = point.plotY = (
                        yAxis.toPixels(priceZones[index].start) -
                        chartPlotTop -
                        (
                            yAxis.reversed ?
                                (barHeight - oldBarHeight) :
                                barHeight
                        ) -
                        yBarOffset
                    );
                    barWidth = correctFloat(
                        primalBarWidth *
                        priceZones[index].wholeVolumeData / maxVolume
                    );
                    point.pointWidth = barWidth;

                    point.shapeArgs = indicator.crispCol.apply( // eslint-disable-line no-useless-call
                        indicator,
                        [barX, barY, barWidth, barHeight]
                    );

                    point.volumeNeg = priceZones[index].negativeVolumeData;
                    point.volumePos = priceZones[index].positiveVolumeData;
                    point.volumeAll = priceZones[index].wholeVolumeData;
                }
            );

            if (zoneLinesOptions.enabled) {
                indicator.drawZones(
                    chart,
                    yAxis,
                    indicator.zoneStarts,
                    (zoneLinesOptions.styles as any)
                );
            }
        }
    }

    public getValues <TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: VBPParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const indicator = this,
            xValues: Array<number> = series.processedXData,
            yValues: Array<Array<number>> = (series.processedYData as any),
            chart = indicator.chart,
            ranges: number = (params.ranges as any),
            VBP: Array<Array<number>> = [],
            xData: Array<number> = [],
            yData: Array<number> = [],
            volumeSeries: LineSeries = (
                chart.get(params.volumeSeriesID) as LineSeries
            );

        // Checks if base series exists
        if (!series.chart) {
            error(
                'Base series not found! In case it has been removed, add ' +
                'a new one.',
                true,
                chart
            );
            return;
        }

        // Checks if volume series exists and if it has data
        if (
            !volumeSeries ||
            !volumeSeries.processedXData.length
        ) {
            const errorMessage =
                volumeSeries && !volumeSeries.processedXData.length ?
                    ' does not contain any data.' :
                    ' not found! Check `volumeSeriesID`.';

            error(
                'Series ' +
                params.volumeSeriesID + errorMessage,
                true,
                chart
            );
            return;
        }

        // Checks if series data fits the OHLC format
        const isOHLC = isArray(yValues[0]);

        if (isOHLC && yValues[0].length !== 4) {
            error(
                'Type of ' +
                series.name +
                ' series is different than line, OHLC or candlestick.',
                true,
                chart
            );
            return;
        }

        // Price zones contains all the information about the zones (index,
        // start, end, volumes, etc.)
        const priceZones = indicator.priceZones = indicator.specifyZones(
            isOHLC,
            xValues,
            yValues,
            ranges,
            volumeSeries
        );

        priceZones.forEach(
            function (
                zone: VBPIndicator.VBPIndicatorPriceZoneObject,
                index: number
            ): void {
                VBP.push([zone.x, zone.end]);
                xData.push(VBP[index][0]);
                yData.push(VBP[index][1]);
            }
        );

        return {
            values: VBP,
            xData: xData,
            yData: yData
        } as IndicatorValuesObject<TLinkedSeries>;
    }

    // Specifing where each zone should start ans end
    public specifyZones(
        isOHLC: boolean,
        xValues: Array<number>,
        yValues: Array<Array<number>>,
        ranges: number,
        volumeSeries: LineSeries
    ): Array<VBPIndicator.VBPIndicatorPriceZoneObject> {
        const indicator = this,
            rangeExtremes: (boolean|Record<string, number>) = (
                isOHLC ? arrayExtremesOHLC(yValues) : false
            ),
            zoneStarts: Array<number> = indicator.zoneStarts = [],
            priceZones: Array<VBPIndicator.VBPIndicatorPriceZoneObject> = [];

        let lowRange: number = rangeExtremes ?
                rangeExtremes.min :
                arrayMin(yValues),
            highRange: number = rangeExtremes ?
                rangeExtremes.max :
                arrayMax(yValues),
            i = 0,
            j = 1;

        // If the compare mode is set on the main series, change the VBP
        // zones to fit new extremes, #16277.
        const mainSeries = indicator.linkedParent;
        if (
            !indicator.options.compareToMain &&
            mainSeries.dataModify
        ) {
            lowRange = mainSeries.dataModify.modifyValue(lowRange);
            highRange = mainSeries.dataModify.modifyValue(highRange);
        }

        if (!defined(lowRange) || !defined(highRange)) {
            if (this.points.length) {
                this.setData([]);
                this.zoneStarts = [];
                if (this.zoneLinesSVG) {
                    this.zoneLinesSVG = this.zoneLinesSVG.destroy();
                }
            }
            return [];
        }

        const rangeStep = indicator.rangeStep =
            correctFloat(highRange - lowRange) / ranges;
        zoneStarts.push(lowRange);

        for (; i < ranges - 1; i++) {
            zoneStarts.push(correctFloat(zoneStarts[i] + rangeStep));
        }

        zoneStarts.push(highRange);

        const zoneStartsLength = zoneStarts.length;

        //    Creating zones
        for (; j < zoneStartsLength; j++) {
            priceZones.push({
                index: j - 1,
                x: xValues[0],
                start: zoneStarts[j - 1],
                end: zoneStarts[j]
            } as any);
        }

        return indicator.volumePerZone(
            isOHLC,
            priceZones,
            volumeSeries,
            xValues,
            yValues
        );
    }

    // Calculating sum of volume values for a specific zone
    public volumePerZone(
        isOHLC: boolean,
        priceZones: Array<VBPIndicator.VBPIndicatorPriceZoneObject>,
        volumeSeries: LineSeries,
        xValues: Array<number>,
        yValues: Array<Array<number>>
    ): Array<VBPIndicator.VBPIndicatorPriceZoneObject> {
        const indicator = this,
            volumeXData: Array<number> = volumeSeries.processedXData,
            volumeYData: Array<number> = (
                volumeSeries.processedYData as any
            ),
            lastZoneIndex: number = priceZones.length - 1,
            baseSeriesLength: number = yValues.length,
            volumeSeriesLength: number = volumeYData.length;

        let previousValue: number,
            startFlag: boolean,
            endFlag: boolean,
            value: number,
            i: number;

        // Checks if each point has a corresponding volume value
        if (abs(baseSeriesLength - volumeSeriesLength)) {
            // If the first point don't have volume, add 0 value at the
            // beggining of the volume array
            if (xValues[0] !== volumeXData[0]) {
                volumeYData.unshift(0);
            }

            // If the last point don't have volume, add 0 value at the end
            // of the volume array
            if (
                xValues[baseSeriesLength - 1] !==
                volumeXData[volumeSeriesLength - 1]
            ) {
                volumeYData.push(0);
            }
        }

        indicator.volumeDataArray = [];

        priceZones.forEach(
            function (zone: VBPIndicator.VBPIndicatorPriceZoneObject): void {
                zone.wholeVolumeData = 0;
                zone.positiveVolumeData = 0;
                zone.negativeVolumeData = 0;

                for (i = 0; i < baseSeriesLength; i++) {
                    startFlag = false;
                    endFlag = false;
                    value = isOHLC ? yValues[i][3] : (yValues[i] as any);
                    previousValue = i ?
                        (
                            isOHLC ?
                                yValues[i - 1][3] :
                                (yValues[i - 1] as any)
                        ) :
                        value;

                    // If the compare mode is set on the main series,
                    // change the VBP zones to fit new extremes, #16277.
                    const mainSeries = indicator.linkedParent;
                    if (
                        !indicator.options.compareToMain &&
                        mainSeries.dataModify
                    ) {
                        value = mainSeries.dataModify.modifyValue(value);
                        previousValue = mainSeries.dataModify
                            .modifyValue(previousValue);
                    }

                    // Checks if this is the point with the
                    // lowest close value and if so, adds it calculations
                    if (value <= zone.start && zone.index === 0) {
                        startFlag = true;
                    }

                    // Checks if this is the point with the highest
                    // close value and if so, adds it calculations
                    if (value >= zone.end && zone.index === lastZoneIndex) {
                        endFlag = true;
                    }

                    if (
                        (value > zone.start || startFlag) &&
                        (value < zone.end || endFlag)
                    ) {
                        zone.wholeVolumeData += volumeYData[i];

                        if (previousValue > value) {
                            zone.negativeVolumeData += volumeYData[i];
                        } else {
                            zone.positiveVolumeData += volumeYData[i];
                        }
                    }
                }
                indicator.volumeDataArray.push(zone.wholeVolumeData);
            }
        );

        return priceZones;
    }

    // Function responsoble for drawing additional lines indicating zones
    public drawZones(
        chart: Chart,
        yAxis: AxisType,
        zonesValues: Array<number>,
        zonesStyles: CSSObject
    ): void {
        const indicator = this,
            renderer = chart.renderer,
            leftLinePos = 0,
            rightLinePos: number = chart.plotWidth,
            verticalOffset: number = chart.plotTop;

        let zoneLinesSVG = indicator.zoneLinesSVG,
            zoneLinesPath: SVGPath = [],
            verticalLinePos: number;

        zonesValues.forEach(function (value: number): void {
            verticalLinePos = yAxis.toPixels(value) - verticalOffset;
            zoneLinesPath = zoneLinesPath.concat(chart.renderer.crispLine([[
                'M',
                leftLinePos,
                verticalLinePos
            ], [
                'L',
                rightLinePos,
                verticalLinePos
            ]], (zonesStyles.lineWidth as any)));
        });

        // Create zone lines one path or update it while animating
        if (zoneLinesSVG) {
            zoneLinesSVG.animate({
                d: zoneLinesPath
            });
        } else {
            zoneLinesSVG = indicator.zoneLinesSVG =
                renderer
                    .path(zoneLinesPath)
                    .attr({
                        'stroke-width': (zonesStyles as any).lineWidth,
                        'stroke': zonesStyles.color,
                        'dashstyle': (zonesStyles as any).dashStyle,
                        'zIndex': (indicator.group as any).zIndex + 0.1
                    })
                    .add(indicator.group);
        }
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface VBPIndicator {
    nameBase: string;
    nameComponents: Array<string>;
    pointClass: typeof VBPPoint;

    crispCol: ColumnSeries['crispCol'];
    getColumnMetrics: ColumnSeries['getColumnMetrics'];
}

extend(VBPIndicator.prototype, {
    nameBase: 'Volume by Price',
    nameComponents: ['ranges'],
    calculateOn: {
        chart: 'render',
        xAxis: 'afterSetExtremes'
    },
    pointClass: VBPPoint,
    markerAttribs: noop as any,
    drawGraph: noop,
    getColumnMetrics: columnProto.getColumnMetrics,
    crispCol: columnProto.crispCol
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace VBPIndicator {

    export interface VBPIndicatorPriceZoneObject {
        end: number;
        index: number;
        negativeVolumeData: number;
        positiveVolumeData: number;
        start: number;
        wholeVolumeData: number;
        x: number;
    }

    export interface VBPIndicatorStyleOptions {
        enabled?: boolean;
        styles?: CSSObject;
    }

}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        vbp: typeof VBPIndicator;
    }
}

SeriesRegistry.registerSeriesType('vbp', VBPIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default VBPIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `Volume By Price (VBP)` series. If the [type](#series.vbp.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.vbp
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL, compare, compareBase, compareStart
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/volume-by-price
 * @apioption series.vbp
 */

''; // to include the above in the js output
