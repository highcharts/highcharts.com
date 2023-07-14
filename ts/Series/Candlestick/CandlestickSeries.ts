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

import type CandlestickPoint from './CandlestickPoint';
import type CandlestickSeriesOptions from './CandlestickSeriesOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import CandlestickSeriesDefaults from './CandlestickSeriesDefaults.js';
import D from '../../Core/Defaults.js';
const { defaultOptions } = D;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    ohlc: OHLCSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const { merge } = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The candlestick series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.candlestick
 *
 * @augments Highcharts.seriesTypes.ohlc
 */
class CandlestickSeries extends OHLCSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: CandlestickSeriesOptions = merge(
        OHLCSeries.defaultOptions,
        defaultOptions.plotOptions,
        { tooltip: OHLCSeries.defaultOptions.tooltip },
        CandlestickSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<CandlestickPoint> = void 0 as any;

    public options: CandlestickSeriesOptions = void 0 as any;

    public points: Array<CandlestickPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Postprocess mapping between options and SVG attributes
     *
     * @private
     * @function Highcharts.seriesTypes.candlestick#pointAttribs
     */
    public pointAttribs(
        point: CandlestickPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const attribs = ColumnSeries.prototype.pointAttribs.call(
                this,
                point,
                state
            ),
            options = this.options,
            isUp = point.open < point.close,
            stroke = options.lineColor || this.color,
            color = point.color || this.color; // (#14826)

        attribs['stroke-width'] = options.lineWidth;

        attribs.fill = point.options.color ||
            (isUp ? (options.upColor || color) : color);
        attribs.stroke = point.options.lineColor ||
            (isUp ? (options.upLineColor || stroke) : stroke);

        // Select or hover states
        if (state) {
            const stateOptions = (options.states as any)[state];
            attribs.fill = stateOptions.color || attribs.fill;
            attribs.stroke = stateOptions.lineColor || attribs.stroke;
            attribs['stroke-width'] =
                stateOptions.lineWidth || attribs['stroke-width'];
        }

        return attribs;
    }

    /**
     * Draw the data points.
     *
     * @private
     * @function Highcharts.seriesTypes.candlestick#drawPoints
     */
    public drawPoints(): void {
        const series = this,
            points = series.points,
            chart = series.chart,
            reversedYAxis = series.yAxis.reversed;

        for (const point of points) {
            let graphic = point.graphic,
                plotOpen,
                plotClose,
                topBox,
                bottomBox,
                hasTopWhisker,
                hasBottomWhisker,
                crispCorr,
                crispX,
                path: SVGPath,
                halfWidth;

            const isNew = !graphic;

            if (typeof point.plotY !== 'undefined') {

                if (!graphic) {
                    point.graphic = graphic = chart.renderer.path()
                        .add(series.group);
                }

                if (!series.chart.styledMode) {
                    graphic
                        .attr(
                            series.pointAttribs(
                                point,
                                (point.selected && 'select') as any
                            )
                        ) // #3897
                        .shadow(series.options.shadow);
                }

                // Crisp vector coordinates
                crispCorr = (graphic.strokeWidth() % 2) / 2;
                // #2596:
                crispX = Math.round(point.plotX as any) - crispCorr;
                plotOpen = point.plotOpen;
                plotClose = point.plotClose;
                topBox = Math.min(plotOpen, plotClose);
                bottomBox = Math.max(plotOpen, plotClose);
                halfWidth = Math.round((point.shapeArgs as any).width / 2);
                hasTopWhisker = reversedYAxis ?
                    bottomBox !== point.yBottom :
                    Math.round(topBox) !==
                    Math.round(point.plotHigh as any);
                hasBottomWhisker = reversedYAxis ?
                    Math.round(topBox) !==
                    Math.round(point.plotHigh as any) :
                    bottomBox !== point.yBottom;
                topBox = Math.round(topBox) + crispCorr;
                bottomBox = Math.round(bottomBox) + crispCorr;

                // Create the path. Due to a bug in Chrome 49, the path is
                // first instanciated with no values, then the values
                // pushed. For unknown reasons, instanciating the path array
                // with all the values would lead to a crash when updating
                // frequently (#5193).
                path = [];
                path.push(
                    ['M', crispX - halfWidth, bottomBox],
                    ['L', crispX - halfWidth, topBox],
                    ['L', crispX + halfWidth, topBox],
                    ['L', crispX + halfWidth, bottomBox],
                    ['Z'], // Ensure a nice rectangle #2602
                    ['M', crispX, topBox],
                    [
                        'L',
                        // #460, #2094
                        crispX,
                        hasTopWhisker ?
                            Math.round(
                                reversedYAxis ?
                                    point.yBottom :
                                    (point.plotHigh as any)
                            ) :
                            topBox
                    ],
                    ['M', crispX, bottomBox],
                    [
                        'L',
                        // #460, #2094
                        crispX,
                        hasBottomWhisker ?
                            Math.round(
                                reversedYAxis ?
                                    (point.plotHigh as any) :
                                    point.yBottom
                            ) :
                            bottomBox
                    ]
                );

                graphic[isNew ? 'attr' : 'animate']({ d: path })
                    .addClass(point.getClassName(), true);

            }
        }
    }

}

interface CandlestickSeries{
    pointClass: typeof CandlestickPoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType'{
    interface SeriesTypeRegistry {
        candlestick: typeof CandlestickSeries;
    }
}

SeriesRegistry.registerSeriesType('candlestick', CandlestickSeries);

/* *
 *
 *  Default Export
 *
 * */

export default CandlestickSeries;
