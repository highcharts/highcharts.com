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

import type ColorString from '../../../Core/Color/ColorString';
import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';
import type {
    MACDOptions,
    MACDGappedExtensionObject,
    MACDZonesOptions,
    MACDParamsOptions
} from './MACDOptions';
import type MACDPoint from './MACDPoint';
import type {
    SeriesZonesOptions
} from '../../../Core/Series/SeriesOptions';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';

import H from '../../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    sma: SMAIndicator
} = SeriesRegistry.seriesTypes;
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { defined, extend, merge } = OH;
const {
    correctFloat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../../Core/Series/SeriesLike' {
    interface SeriesLike {
        resetZones?: boolean;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The MACD series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.macd
 *
 * @augments Highcharts.Series
 */
class MACDIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Moving Average Convergence Divergence (MACD). This series requires
     * `linkedTo` option to be set and should be loaded after the
     * `stock/indicators/indicators.js`.
     *
     * @sample stock/indicators/macd
     *         MACD indicator
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/macd
     * @optionparent plotOptions.macd
     */
    public static defaultOptions: MACDOptions = merge(SMAIndicator.defaultOptions, {
        params: {
            /**
             * The short period for indicator calculations.
             */
            shortPeriod: 12,
            /**
             * The long period for indicator calculations.
             */
            longPeriod: 26,
            /**
             * The base period for signal calculations.
             */
            signalPeriod: 9,
            period: 26
        },
        /**
         * The styles for signal line
         */
        signalLine: {
            /**
             * @sample stock/indicators/macd-zones
             *         Zones in MACD
             *
             * @extends plotOptions.macd.zones
             */
            zones: [],
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line.
                 *
                 * @type  {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        /**
         * The styles for macd line
         */
        macdLine: {
            /**
             * @sample stock/indicators/macd-zones
             *         Zones in MACD
             *
             * @extends plotOptions.macd.zones
             */
            zones: [],
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line.
                 *
                 * @type  {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        /**
         * @type {number|null}
         */
        threshold: 0,
        groupPadding: 0.1,
        pointPadding: 0.1,
        crisp: false,
        states: {
            hover: {
                halo: {
                    size: 0
                }
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {series.name}</b><br/>' +
                'Value: {point.MACD}<br/>' +
                'Signal: {point.signal}<br/>' +
                'Histogram: {point.y}<br/>'
        },
        dataGrouping: {
            approximation: 'averages'
        },
        minPointLength: 0
    } as MACDOptions);

    /* *
     *
     *  Properties
     *
     * */

    public currentLineZone?: string;
    public data: Array<MACDPoint> = void 0 as any;
    public graphmacd?: SVGElement;
    public graphsignal?: SVGElement;
    public macdZones: MACDZonesOptions = void 0 as any;
    public options: MACDOptions = void 0 as any;
    public points: Array<MACDPoint> = void 0 as any;
    public signalZones: MACDZonesOptions = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        SeriesRegistry.seriesTypes.sma.prototype.init.apply(this, arguments);

        const originalColor = this.color;

        // Check whether series is initialized. It may be not initialized,
        // when any of required indicators is missing.
        if (this.options) {
            // If the default colour doesn't set, get the next available from
            // the array and apply it #15608.
            if (defined(this.colorIndex)) {
                if (
                    this.options.signalLine &&
                    this.options.signalLine.styles &&
                    !this.options.signalLine.styles.lineColor
                ) {
                    this.options.colorIndex = this.colorIndex + 1;
                    this.getCyclic('color', void 0, this.chart.options.colors);
                    this.options.signalLine.styles.lineColor =
                        this.color as ColorString;
                }

                if (
                    this.options.macdLine &&
                    this.options.macdLine.styles &&
                    !this.options.macdLine.styles.lineColor
                ) {
                    this.options.colorIndex = this.colorIndex + 1;
                    this.getCyclic('color', void 0, this.chart.options.colors);
                    this.options.macdLine.styles.lineColor =
                        this.color as ColorString;
                }
            }


            // Zones have indexes automatically calculated, we need to
            // translate them to support multiple lines within one indicator
            this.macdZones = {
                zones: (this.options.macdLine as any).zones,
                startIndex: 0
            };
            this.signalZones = {
                zones: (this.macdZones.zones as any).concat(
                    (this.options.signalLine as any).zones
                ),
                startIndex: (this.macdZones.zones as any).length
            };
            this.resetZones = true;
        }

        // Reset color and index #15608.
        this.color = originalColor;
    }

    public toYData(
        point: MACDPoint
    ): Array<number> {
        return [point.y, point.signal, point.MACD];
    }

    public translate(): void {
        const indicator = this,
            plotNames: Array<string> = ['plotSignal', 'plotMACD'];

        H.seriesTypes.column.prototype.translate.apply(indicator);

        indicator.points.forEach(
            function (point: MACDPoint): void {
                [point.signal, point.MACD].forEach(
                    function (value: number, i: number): void {
                        if (value !== null) {
                            (point as any)[plotNames[i]] =
                            indicator.yAxis.toPixels(
                                value,
                                true
                            );
                        }
                    }
                );
            }
        );
    }

    public destroy(): void {
        // this.graph is null due to removing two times the same SVG element
        this.graph = (null as any);
        this.graphmacd = this.graphmacd && this.graphmacd.destroy();
        this.graphsignal = this.graphsignal && this.graphsignal.destroy();

        SeriesRegistry.seriesTypes.sma.prototype.destroy.apply(this, arguments);
    }

    public drawGraph(): void {
        const indicator = this,
            mainLinePoints: Array<(
                MACDPoint
            )> = indicator.points,
            mainLineOptions: MACDOptions =
            indicator.options,
            histogramZones: Array<(SeriesZonesOptions)> = indicator.zones,
            gappedExtend: MACDGappedExtensionObject = {
                options: {
                    gapSize: mainLineOptions.gapSize
                }
            },
            otherSignals: Array<(
                Array<MACDPoint>
            )> = [[], []];
        let point: MACDPoint,
            pointsLength: number = mainLinePoints.length;

        // Generate points for top and bottom lines:
        while (pointsLength--) {
            point = mainLinePoints[pointsLength];
            if (defined(point.plotMACD)) {
                otherSignals[0].push(({
                    plotX: point.plotX,
                    plotY: point.plotMACD,
                    isNull: !defined(point.plotMACD)
                } as any));
            }
            if (defined(point.plotSignal)) {
                otherSignals[1].push(({
                    plotX: point.plotX,
                    plotY: point.plotSignal,
                    isNull: !defined(point.plotMACD)
                } as any));
            }
        }

        // Modify options and generate smoothing line:
        ['macd', 'signal'].forEach(
            function (lineName: string, i: number): void {
                indicator.points = otherSignals[i];
                indicator.options = merge(
                    (mainLineOptions as any)[lineName + 'Line'].styles,
                    gappedExtend
                );
                indicator.graph = (indicator as any)['graph' + lineName];

                // Zones extension:
                indicator.currentLineZone = lineName + 'Zones';
                indicator.zones =
                (indicator as any)[indicator.currentLineZone].zones;

                SeriesRegistry.seriesTypes.sma.prototype.drawGraph.call(
                    indicator
                );
                (indicator as any)['graph' + lineName] = indicator.graph;
            }
        );

        // Restore options:
        indicator.points = mainLinePoints;
        indicator.options = mainLineOptions;
        indicator.zones = histogramZones;
        indicator.currentLineZone = void 0;
        // indicator.graph = null;
    }

    public getZonesGraphs(
        props: Array<Array<string>>
    ): Array<Array<string>> {
        const allZones: Array<Array<string>> =
        super.getZonesGraphs(props);
        let currentZones: Array<Array<string>> = allZones;

        if (this.currentLineZone) {
            currentZones = allZones.splice(
                (this as any)[this.currentLineZone].startIndex + 1
            );

            if (!currentZones.length) {
                // Line has no zones, return basic graph "zone"
                currentZones = [props[0]];
            } else {
                // Add back basic prop:
                currentZones.splice(0, 0, props[0]);
            }
        }

        return currentZones;
    }

    public applyZones(): void {
        // Histogram zones are handled by drawPoints method
        // Here we need to apply zones for all lines
        const histogramZones = this.zones;

        // signalZones.zones contains all zones:
        this.zones = (this.signalZones.zones as any);
        SeriesRegistry.seriesTypes.sma.prototype.applyZones.call(this);

        // applyZones hides only main series.graph, hide macd line manually
        if (this.graphmacd && (this.options.macdLine as any).zones.length) {
            (this.graphmacd as any).hide();
        }

        this.zones = histogramZones;
    }

    public getValues<TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: MACDParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const indexToShift: number = (
                (params.longPeriod as any) - (params.shortPeriod as any)
            ), // #14197
            MACD: Array<Array<(number|null)>> = [],
            xMACD: Array<(number|null)> = [],
            yMACD: Array<Array<(number|null)>> = [];
        let shortEMA: Array<Array<number>>,
            longEMA: Array<Array<number>>,
            i,
            j = 0,
            signalLine: Array<Array<number>> = [];

        if ((series.xData as any).length <
            (params.longPeriod as any) + params.signalPeriod
        ) {
            return;
        }

        // Calculating the short and long EMA used when calculating the MACD
        shortEMA = (SeriesRegistry.seriesTypes.ema.prototype.getValues(
            series,
            {
                period: params.shortPeriod,
                index: params.index
            }
        ) as any);

        longEMA = (SeriesRegistry.seriesTypes.ema.prototype.getValues(
            series,
            {
                period: params.longPeriod,
                index: params.index
            }
        ) as any);

        shortEMA = (shortEMA as any).values;
        longEMA = (longEMA as any).values;


        // Subtract each Y value from the EMA's and create the new dataset
        // (MACD)
        for (i = 0; i <= shortEMA.length; i++) {
            if (
                defined(longEMA[i]) &&
                defined(longEMA[i][1]) &&
                defined(shortEMA[i + indexToShift]) &&
                defined(shortEMA[i + indexToShift][0])
            ) {
                MACD.push([
                    shortEMA[i + indexToShift][0],
                    0,
                    null,
                    shortEMA[i + indexToShift][1] -
                        longEMA[i][1]
                ]);
            }
        }

        // Set the Y and X data of the MACD. This is used in calculating the
        // signal line.
        for (i = 0; i < MACD.length; i++) {
            xMACD.push(MACD[i][0]);
            yMACD.push([0, null, MACD[i][3]]);
        }

        // Setting the signalline (Signal Line: X-day EMA of MACD line).
        signalLine = (SeriesRegistry.seriesTypes.ema.prototype.getValues(
            ({
                xData: xMACD,
                yData: yMACD
            } as any),
            {
                period: params.signalPeriod,
                index: 2
            }
        ) as any);

        signalLine = (signalLine as any).values;

        // Setting the MACD Histogram. In comparison to the loop with pure
        // MACD this loop uses MACD x value not xData.
        for (i = 0; i < MACD.length; i++) {
            // detect the first point
            if ((MACD[i] as any)[0] >= signalLine[0][0]) {

                MACD[i][2] = signalLine[j][1];
                yMACD[i] = [0, signalLine[j][1], MACD[i][3]];

                if (MACD[i][3] === null) {
                    MACD[i][1] = 0;
                    yMACD[i][0] = 0;
                } else {
                    MACD[i][1] = correctFloat((MACD[i] as any)[3] -
                    signalLine[j][1]);
                    yMACD[i][0] = correctFloat((MACD[i] as any)[3] -
                    signalLine[j][1]);
                }

                j++;
            }
        }

        return {
            values: MACD,
            xData: xMACD,
            yData: yMACD
        } as IndicatorValuesObject<TLinkedSeries>;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface MACDIndicator {
    crispCol: typeof ColumnSeries.prototype.crispCol;
    getColumnMetrics: typeof ColumnSeries.prototype.getColumnMetrics;
    nameComponents: Array<string>;
    parallelArrays: Array<string>;
    pointArrayMap: Array<string>;
    pointClass: typeof MACDPoint;
    pointValKey: string;
}

extend(MACDIndicator.prototype, {
    nameComponents: ['longPeriod', 'shortPeriod', 'signalPeriod'],
    // "y" value is treated as Histogram data
    pointArrayMap: ['y', 'signal', 'MACD'],
    parallelArrays: ['x', 'y', 'signal', 'MACD'],
    pointValKey: 'y',
    // Columns support:
    markerAttribs: noop as any,
    getColumnMetrics: H.seriesTypes.column.prototype.getColumnMetrics,
    crispCol: H.seriesTypes.column.prototype.crispCol,
    drawPoints: H.seriesTypes.column.prototype.drawPoints
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        macd: typeof MACDIndicator;
    }
}

SeriesRegistry.registerSeriesType('macd', MACDIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default MACDIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `MACD` series. If the [type](#series.macd.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.macd
 * @since     6.0.0
 * @product   highstock
 * @excluding dataParser, dataURL
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/macd
 * @apioption series.macd
 */

''; // to include the above in the js output
