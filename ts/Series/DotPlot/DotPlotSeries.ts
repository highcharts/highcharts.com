/* *
 *
 *  (c) 2009-2021 Torstein Honsi
 *
 *  Dot plot series type for Highcharts
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/**
 * @private
 * @todo
 * - Check update, remove etc.
 * - Custom icons like persons, carts etc. Either as images, font icons or
 *   Highcharts symbols.
 */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type DotPlotPoint from './DotPlotPoint';
import type DotPlotSeriesOptions from './DotPlotSeriesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import DotPlotSeriesDefaults from './DotPlotSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    extend,
    merge,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.dotplot
 *
 * @augments Highcharts.Series
 */
class DotPlotSeries extends ColumnSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: DotPlotSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        DotPlotSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<DotPlotPoint> = void 0 as any;

    public options: DotPlotSeriesOptions = void 0 as any;

    public points: Array<DotPlotPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public drawPoints(): void {
        const series = this,
            options = series.options,
            renderer = series.chart.renderer,
            seriesMarkerOptions = options.marker,
            itemPaddingTranslated = series.yAxis.transA *
                (options.itemPadding as any),
            borderWidth = series.borderWidth,
            crisp = borderWidth % 2 ? 0.5 : 1;

        for (const point of series.points) {
            const pointMarkerOptions = point.marker || {},
                symbol = (
                    pointMarkerOptions.symbol ||
                    (seriesMarkerOptions as any).symbol
                ),
                radius = pick(
                    pointMarkerOptions.radius,
                    (seriesMarkerOptions as any).radius
                ),
                isSquare = symbol !== 'rect';

            let yPos: number,
                attr: SVGAttributes,
                graphics: Array<SVGElement|undefined>,
                size: number,
                yTop: number,
                x: number,
                y: number;

            point.graphics = graphics = point.graphics || [];
            const pointAttr = point.pointAttr ?
                (
                    (point.pointAttr as any)[
                        point.selected ? 'selected' : ''
                    ] ||
                    (series.pointAttr as any)['']
                ) :
                series.pointAttribs(point);
            delete pointAttr.r;

            if (series.chart.styledMode) {
                delete pointAttr.stroke;
                delete pointAttr['stroke-width'];
            }

            if (point.y !== null) {

                if (!point.graphic) {
                    point.graphic = renderer.g('point').add(series.group);
                }

                yTop = pick(point.stackY, point.y as any);
                size = Math.min(
                    point.pointWidth,
                    series.yAxis.transA - itemPaddingTranslated
                );
                let i = Math.floor(yTop);
                for (yPos = yTop; yPos > yTop - (point.y as any); yPos--, i--) {

                    x = point.barX + (
                        isSquare ?
                            point.pointWidth / 2 - size / 2 :
                            0
                    );
                    y = series.yAxis.toPixels(yPos, true) +
                        itemPaddingTranslated / 2;

                    if (series.options.crisp) {
                        x = Math.round(x) - crisp;
                        y = Math.round(y) + crisp;
                    }
                    attr = {
                        x: x,
                        y: y,
                        width: Math.round(isSquare ? size : point.pointWidth),
                        height: Math.round(size),
                        r: radius
                    };

                    let graphic = graphics[i];

                    if (graphic) {
                        graphic.animate(attr);
                    } else {
                        graphic = renderer.symbol(symbol)
                            .attr(extend(attr, pointAttr))
                            .add(point.graphic);
                    }
                    graphic.isActive = true;
                    graphics[i] = graphic;
                }
            }

            let i = -1;

            for (const graphic of graphics) {
                ++i;
                if (graphic) {
                    if (!graphic.isActive) {
                        graphic.destroy();
                        graphics.splice(i, 1);
                    } else {
                        graphic.isActive = false;
                    }
                }
            }
        }
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface DotPlotSeries {
    pointAttr?: SVGAttributes;
    pointClass: typeof DotPlotPoint;
}

extend(DotPlotSeries.prototype, {
    markerAttribs: void 0
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        dotplot: typeof DotPlotSeries;
    }
}

SeriesRegistry.registerSeriesType('dotplot', DotPlotSeries);

/* *
 *
 *  Default Export
 *
 * */

export default DotPlotSeries;
