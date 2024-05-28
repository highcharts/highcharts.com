/* *
 *
 *  Vector plot series module
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

import type VectorPoint from './VectorPoint';
import type VectorSeriesOptions from './VectorSeriesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import { animObject } from '../../Core/Animation/AnimationUtilities.js';
import H from '../../Core/Globals.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: Series,
    seriesTypes: {
        scatter: ScatterSeries
    }
} = SeriesRegistry;
import U from '../../Core/Utilities.js';
const {
    arrayMax,
    extend,
    merge,
    pick
} = U;
import VectorSeriesDefaults from './VectorSeriesDefaults.js';

/* *
 *
 *  Class
 *
 * */

/**
 * The vector series class.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.vector
 *
 * @augments Highcharts.seriesTypes.scatter
 */
class VectorSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: VectorSeriesOptions = merge(
        ScatterSeries.defaultOptions,
        VectorSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data!: Array<VectorPoint>;

    public lengthData?: Array<number>;

    public lengthMax!: number;

    public options!: VectorSeriesOptions;

    public points!: Array<VectorPoint>;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Fade in the arrows on initializing series.
     * @private
     */
    public animate(init?: boolean): void {
        if (init) {
            (this.markerGroup as any).attr({
                opacity: 0.01
            });
        } else {
            (this.markerGroup as any).animate({
                opacity: 1
            }, animObject(this.options.animation));
        }
    }

    /**
     * Create a single arrow. It is later rotated around the zero
     * centerpoint.
     * @private
     */
    public arrow(point: VectorPoint): SVGPath {
        const fraction: number = (point.length as any) / this.lengthMax,
            u: number = fraction * (this.options.vectorLength as any) / 20,
            o: number = ({
                start: 10 * u,
                center: 0,
                end: -10 * u
            } as Record<string, number>)[
                this.options.rotationOrigin as any
            ] || 0,
            // The stem and the arrow head. Draw the arrow first with rotation
            // 0, which is the arrow pointing down (vector from north to south).
            path: SVGPath = [
                ['M', 0, 7 * u + o], // Base of arrow
                ['L', -1.5 * u, 7 * u + o],
                ['L', 0, 10 * u + o],
                ['L', 1.5 * u, 7 * u + o],
                ['L', 0, 7 * u + o],
                ['L', 0, -10 * u + o] // Top
            ];

        return path;
    }

    /*
    DrawLegendSymbol: function (legend, item) {
        let options = legend.options,
            symbolHeight = legend.symbolHeight,
            square = options.squareSymbol,
            symbolWidth = square ? symbolHeight : legend.symbolWidth,
            path = this.arrow.call({
                lengthMax: 1,
                options: {
                    vectorLength: symbolWidth
                }
            }, {
                length: 1
            });
        legendItem.line = this.chart.renderer.path(path)
        .addClass('highcharts-point')
        .attr({
            zIndex: 3,
            translateY: symbolWidth / 2,
            rotation: 270,
            'stroke-width': 1,
            'stroke': 'black'
        }).add(item.legendItem.group);
    },
    */

    /**
     * @private
     */
    public drawPoints(): void {
        const chart = this.chart;

        for (const point of this.points) {
            const plotX = point.plotX,
                plotY = point.plotY;

            if (
                this.options.clip === false ||
                chart.isInsidePlot(
                    plotX as any,
                    plotY as any,
                    { inverted: chart.inverted }
                )
            ) {

                if (!point.graphic) {
                    point.graphic = this.chart.renderer
                        .path()
                        .add(this.markerGroup)
                        .addClass(
                            'highcharts-point ' +
                            'highcharts-color-' +
                            pick(point.colorIndex, point.series.colorIndex)
                        );
                }
                point.graphic
                    .attr({
                        d: this.arrow(point),
                        translateX: plotX,
                        translateY: plotY,
                        rotation: point.direction
                    });

                if (!this.chart.styledMode) {
                    point.graphic
                        .attr(this.pointAttribs(point));
                }

            } else if (point.graphic) {
                point.graphic = point.graphic.destroy();
            }

        }
    }

    /**
     * Get presentational attributes.
     * @private
     */
    public pointAttribs(
        point?: VectorPoint,
        state?: string
    ): SVGAttributes {
        const options = this.options;

        let stroke = point?.color || this.color,
            strokeWidth = this.options.lineWidth;

        if (state) {
            stroke = (options.states as any)[state].color || stroke;
            strokeWidth =
            ((options.states as any)[state].lineWidth || strokeWidth) +
            ((options.states as any)[state].lineWidthPlus || 0);
        }

        return {
            'stroke': stroke,
            'stroke-width': strokeWidth
        };
    }

    /**
     * @private
     */
    public translate(): void {
        Series.prototype.translate.call(this);

        this.lengthMax = arrayMax(this.lengthData as any);
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface VectorSeries {
    parallelArrays: Array<string>;
    pointArrayMap: Array<string>;
    pointClass: typeof VectorPoint;
}

extend(VectorSeries.prototype, {

    /**
     * @ignore
     * @deprecated
     */
    drawGraph: H.noop,

    /**
     * @ignore
     * @deprecated
     */
    getSymbol: H.noop,

    /**
     * @ignore
     * @deprecated
     */
    markerAttribs: H.noop as any,

    parallelArrays: ['x', 'y', 'length', 'direction'],

    pointArrayMap: ['y', 'length', 'direction']

});


/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        vector: typeof VectorSeries;
    }
}

SeriesRegistry.registerSeriesType('vector', VectorSeries);

/* *
 *
 *  Default Export
 *
 * */

export default VectorSeries;
