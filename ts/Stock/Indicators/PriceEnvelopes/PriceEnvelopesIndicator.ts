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

import type IndicatorValuesObject from '../IndicatorValuesObject';
import type LineSeries from '../../../Series/Line/LineSeries';
import type {
    PriceEnvelopesOptions,
    PriceEnvelopesParamsOptions
} from './PriceEnvelopesOptions';
import type PriceEnvelopesPoint from './PriceEnvelopesPoint';

import MultipleLinesComposition from '../MultipleLinesComposition.js';
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { sma: SMAIndicator } = SeriesRegistry.seriesTypes;
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray } = TC;
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * The Price Envelopes series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.priceenvelopes
 *
 * @augments Highcharts.Series
 */
class PriceEnvelopesIndicator extends SMAIndicator {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * Price envelopes indicator based on [SMA](#plotOptions.sma) calculations.
     * This series requires the `linkedTo` option to be set and should be loaded
     * after the `stock/indicators/indicators.js` file.
     *
     * @sample stock/indicators/price-envelopes
     *         Price envelopes
     *
     * @extends      plotOptions.sma
     * @since        6.0.0
     * @product      highstock
     * @requires     stock/indicators/indicators
     * @requires     stock/indicators/price-envelopes
     * @optionparent plotOptions.priceenvelopes
     */
    public static defaultOptions: PriceEnvelopesOptions = merge(SMAIndicator.defaultOptions, {
        marker: {
            enabled: false
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b><br/>Top: {point.top}<br/>Middle: {point.middle}<br/>Bottom: {point.bottom}<br/>'
        },
        params: {
            period: 20,
            /**
             * Percentage above the moving average that should be displayed.
             * 0.1 means 110%. Relative to the calculated value.
             */
            topBand: 0.1,
            /**
             * Percentage below the moving average that should be displayed.
             * 0.1 means 90%. Relative to the calculated value.
             */
            bottomBand: 0.1
        },
        /**
         * Bottom line options.
         */
        bottomLine: {
            styles: {
                /**
                 * Pixel width of the line.
                 */
                lineWidth: 1,
                /**
                 * Color of the line. If not set, it's inherited from
                 * [plotOptions.priceenvelopes.color](
                 * #plotOptions.priceenvelopes.color).
                 *
                 * @type {Highcharts.ColorString}
                 */
                lineColor: void 0
            }
        },
        /**
         * Top line options.
         *
         * @extends plotOptions.priceenvelopes.bottomLine
         */
        topLine: {
            styles: {
                lineWidth: 1
            }
        },
        dataGrouping: {
            approximation: 'averages'
        }
        /**
         * Option for fill color between lines in Price Envelopes Indicator.
         *
         * @sample {highstock} stock/indicators/indicator-area-fill
         *      Background fill between lines.
         *
         * @type      {Highcharts.Color}
         * @since 11.0.0
         * @apioption plotOptions.priceenvelopes.fillColor
         *
         */
    } as PriceEnvelopesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<PriceEnvelopesPoint> = void 0 as any;
    public options: PriceEnvelopesOptions = void 0 as any;
    public points: Array<PriceEnvelopesPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        super.init.apply(this, arguments);

        // Set default color for lines:
        this.options = merge({
            topLine: {
                styles: {
                    lineColor: this.color
                }
            },
            bottomLine: {
                styles: {
                    lineColor: this.color
                }
            }
        }, this.options);
    }

    public getValues <TLinkedSeries extends LineSeries>(
        series: TLinkedSeries,
        params: PriceEnvelopesParamsOptions
    ): (IndicatorValuesObject<TLinkedSeries>|undefined) {
        const period = params.period,
            topPercent = params.topBand,
            botPercent = params.bottomBand,
            xVal: Array<number> = (series.xData as any),
            yVal: Array<Array<number>> = (series.yData as any),
            yValLen: number = yVal ? yVal.length : 0,
            // 0- date, 1-top line, 2-middle line, 3-bottom line
            PE: Array<Array<number>> = [],
            // middle line, top line and bottom line
            xData: Array<number> = [],
            yData: Array<Array<number>> = [];

        let ML: number,
            TL: number,
            BL: number,
            date: number,
            slicedX: Array<number>,
            slicedY: Array<Array<number>>,
            point: IndicatorValuesObject<TLinkedSeries>,
            i: number;

        // Price envelopes requires close value
        if (
            xVal.length < period ||
            !isArray(yVal[0]) ||
            yVal[0].length !== 4
        ) {
            return;
        }

        for (i = period; i <= yValLen; i++) {
            slicedX = xVal.slice(i - period, i);
            slicedY = yVal.slice(i - period, i);

            point = super.getValues(
                {
                    xData: slicedX,
                    yData: slicedY
                } as any,
                params
            ) as any;

            date = (point as any).xData[0];
            ML = (point as any).yData[0];
            TL = ML * (1 + topPercent);
            BL = ML * (1 - botPercent);
            PE.push([date, TL, ML, BL]);
            xData.push(date);
            yData.push([TL, ML, BL]);
        }

        return {
            values: PE,
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

interface PriceEnvelopesIndicator extends MultipleLinesComposition.IndicatorComposition {
    linesApiNames: Array<string>;
    nameComponents: Array<string>;
    nameBase: string;
    parallelArrays: Array<string>;
    pointArrayMap: Array<keyof PriceEnvelopesPoint>;
    pointClass: typeof PriceEnvelopesPoint;
    pointValKey: string;
}

extend(PriceEnvelopesIndicator.prototype, {
    areaLinesNames: ['top', 'bottom'],
    linesApiNames: ['topLine', 'bottomLine'],
    nameComponents: ['period', 'topBand', 'bottomBand'],
    nameBase: 'Price envelopes',
    pointArrayMap: ['top', 'middle', 'bottom'],
    parallelArrays: ['x', 'y', 'top', 'bottom'],
    pointValKey: 'middle'
});

MultipleLinesComposition.compose(PriceEnvelopesIndicator);

/* *
 *
 *  Class Namespace
 *
 * */

namespace PriceEnvelopesIndicator {
    export interface GappedExtensionObject {
        options?: GappedExtensionOptions;
    }
    export interface GappedExtensionOptions {
        gapSize?: number;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        priceenvelopes: typeof PriceEnvelopesIndicator;
    }
}

SeriesRegistry.registerSeriesType('priceenvelopes', PriceEnvelopesIndicator);

/* *
 *
 *  Default Export
 *
 * */

export default PriceEnvelopesIndicator;

/* *
 *
 *  API Options
 *
 * */

/**
 * A price envelopes indicator. If the [type](#series.priceenvelopes.type)
 * option is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.priceenvelopes
 * @since     6.0.0
 * @excluding dataParser, dataURL
 * @product   highstock
 * @requires  stock/indicators/indicators
 * @requires  stock/indicators/price-envelopes
 * @apioption series.priceenvelopes
 */

''; // to include the above in the js output
