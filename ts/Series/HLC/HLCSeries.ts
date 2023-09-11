/* *
 *
 *  (c) 2010-2021 Pawel Lysy
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

import type HLCSeriesOptions from './HLCSeriesOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import HLCPoint from './HLCPoint.js';
import HLCSeriesDefaults from './HLCSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries
} = SeriesRegistry.seriesTypes;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * The hlc series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.hlc
 *
 * @augments Highcharts.Series
 */
class HLCSeries extends ColumnSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: HLCSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        HLCSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<HLCPoint> = void 0 as any;

    public options: HLCSeriesOptions = void 0 as any;

    public points: Array<HLCPoint> = void 0 as any;

    public yData: Array<Array<number>> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Extend the path if close is not between high and low.
     *
     * @param {SVGPath} path the path array of the point
     * @param {number} halfStrokeWidth
     * @param {number} value value of the point to which the stem should be extended
     */
    protected extendStem(
        path: SVGPath,
        halfStrokeWidth: number,
        value: number
    ): void {
        const start = path[0];
        const end = path[1];

        // We don't need to worry about crisp - close value
        // is already crisped and halfStrokeWidth should remove it.
        if (typeof start[2] === 'number') {
            start[2] = Math.max(
                value + halfStrokeWidth,
                start[2]
            );
        }
        if (typeof end[2] === 'number') {
            end[2] = Math.min(
                value - halfStrokeWidth,
                end[2]
            );
        }

    }

    /**
     * Function to create SVGPath of the point based on the
     * plot positions of this point.
     * @private
     */
    protected getPointPath(point: HLCPoint, graphic: SVGElement): SVGPath {
        // crisp vector coordinates
        const strokeWidth = graphic.strokeWidth(),
            series = point.series,
            crispCorr = (strokeWidth % 2) / 2,
            // #2596:
            crispX = Math.round(point.plotX as any) - crispCorr,
            halfWidth = Math.round((point.shapeArgs as any).width / 2);

        let plotClose = point.plotClose;

        // the vertical stem
        const path: SVGPath = [
            ['M', crispX, Math.round(point.yBottom as any)],
            ['L', crispX, Math.round(point.plotHigh as any)]
        ];

        // close
        if (point.close !== null) {
            plotClose = Math.round(point.plotClose) + crispCorr;
            path.push(
                ['M', crispX, plotClose],
                ['L', crispX + halfWidth, plotClose]
            );

            series.extendStem(path, strokeWidth / 2, plotClose);
        }
        return path;
    }


    /**
     * Draw single point
     * @private
     */
    public drawSinglePoint(point: HLCPoint): void {
        const series = point.series,
            chart = series.chart;

        let path: SVGPath,
            graphic = point.graphic;

        if (typeof point.plotY !== 'undefined') {

            // Create and/or update the graphic
            if (!graphic) {
                point.graphic = graphic = chart.renderer.path()
                    .add(series.group);
            }

            if (!chart.styledMode) {
                graphic.attr(
                    series.pointAttribs(
                        point,
                        (point.selected && 'select') as any
                    )
                ); // #3897
            }

            // crisp vector coordinates
            path = series.getPointPath(point, graphic);
            graphic[!graphic ? 'attr' : 'animate']({ d: path })
                .addClass(point.getClassName(), true);

        }
    }

    /**
     * Draw the data points
     * @private
     */
    public drawPoints(): void {
        this.points.forEach(this.drawSinglePoint);
    }

    /**
     * @private
     * @function Highcharts.seriesTypes.hlc#init
     */
    public init(): void {
        super.init.apply(this, arguments as any);

        this.options.stacking = void 0; // #8817
    }

    /**
     * Postprocess mapping between options and SVG attributes
     * @private
     */
    public pointAttribs(
        point: HLCPoint,
        state: StatesOptionsKey
    ): SVGAttributes {
        const attribs = super.pointAttribs.call(
            this,
            point,
            state
        );

        delete attribs.fill;

        return attribs;
    }

    public toYData(point: HLCPoint): Array<number> {
        // return a plain array for speedy calculation
        return [point.high, point.low, point.close];
    }

    /**
     * Translate data points from raw values x and y to plotX and plotY
     *
     * @private
     * @function Highcharts.seriesTypes.hlc#translate
     */
    public translate(): void {
        const series = this,
            yAxis = series.yAxis,
            names = (this.pointArrayMap && this.pointArrayMap.slice()) || [],
            translated = names.map(
                (name: string): string =>
                    `plot${name.charAt(0).toUpperCase() + name.slice(1)}`
            );
        translated.push('yBottom');
        names.push('low');
        super.translate.apply(series);

        // Do the translation
        series.points.forEach(function (point): void {
            names.forEach(
                function (name: string, i: number): void {
                    let value = (point as any)[name];
                    if (value !== null) {
                        if (series.dataModify) {
                            value = series.dataModify.modifyValue(value);
                        }
                        (point as any)[translated[i]] =
                            yAxis.toPixels(value, true);
                    }
                });

            // Align the tooltip to the high value to avoid covering the
            // point
            (point.tooltipPos as any)[1] =
                (point.plotHigh as any) + yAxis.pos - series.chart.plotTop;
        });
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface HLCSeries {
    pointClass: typeof HLCPoint;
    pointAttrToOptions: Record<string, string>;
}
extend(HLCSeries.prototype, {
    pointClass: HLCPoint,
    animate: null as any, // Disable animation
    directTouch: false,
    pointArrayMap: ['high', 'low', 'close'],
    pointAttrToOptions: {
        stroke: 'color',
        'stroke-width': 'lineWidth'
    },
    pointValKey: 'close'
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        hlc: typeof HLCSeries;
    }
}
SeriesRegistry.registerSeriesType('hlc', HLCSeries);

/* *
 *
 *  Default Export
 *
 * */

export default HLCSeries;
