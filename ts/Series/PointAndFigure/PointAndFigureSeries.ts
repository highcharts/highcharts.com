/* *
 *
 *  (c) 2010-2024 Kamil Musialowski
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *  Imports
 *
 * */

import PointAndFigurePoint from './PointAndFigurePoint.js';
import PointAndFigureSeriesDefaults from './PointAndFigureSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import PointAndFigureSymbols from './PointAndFigureSymbols.js';

import type Point from '../../Core/Series/Point.js';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes.js';
import type PointAndFigureSeriesOptions from './PointAndFigureSeriesOptions';
import type SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer.js';

import H from '../../Core/Globals.js';
import U from '../../Core/Utilities.js';
import Series from '../../Core/Series/Series.js';
const { composed } = H;
const {
    scatter: ScatterSeries,
    column: {
        prototype: columnProto
    }
} = SeriesRegistry.seriesTypes;
const {
    extend,
    merge,
    pushUnique,
    isNumber,
    relativeLength
} = U;


/* *
 *
 *  Declarations
 *
 * */


/* *
 *
 *  Functions
 *
 * */


/* *
 *
 *  Class
 *
 * */

/**
 * The series type
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.pointandfigure
 *
 * @augments Highcharts.Series
 */
class PointAndFigureSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
    * */

    public static defaultOptions: PointAndFigureSeriesOptions = merge(
        ScatterSeries.defaultOptions,
        PointAndFigureSeriesDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        SVGRendererClass: typeof SVGRenderer
    ): void {
        if (pushUnique(composed, 'pointandfigure')) {
            PointAndFigureSymbols.compose(SVGRendererClass);
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public options!: PointAndFigureSeriesOptions;

    public points!: Array<PointAndFigurePoint>;

    public xData!: Array<number>;

    public yData!: Array<number>;

    public allowDG = false;

    /* *
     *
     *  Functions
     *
     * */

    public init(): void {
        super.init.apply(this, arguments);

        this.pnfDataGroups = [];
    }

    public getProcessedData(): Series.ProcessedDataObject {
        if (!this.pnfDataGroups) {
            return {
                modified: this.dataTable.modified,
                cropped: false,
                cropStart: 0,
                closestPointRange: 1
            };
        }

        const series = this,
            modified = this.dataTable.modified,
            options = series.options,
            xData = series.getColumn('x', true),
            yData = series.getColumn('y', true),
            boxSize = options.boxSize,
            calculatedBoxSize = isNumber(boxSize) ?
                boxSize : relativeLength(boxSize, yData[0]),
            pnfDataGroups = series.pnfDataGroups,
            reversal = calculatedBoxSize * options.reversalAmount;

        series.calculatedBoxSize = calculatedBoxSize;

        let upTrend: boolean;

        /**
         * Get the Y value of last data point, from the last PNF group.
         * @private
         * @function Highcharts.seriesTypes.pointandfigure#getLastPoint
         */
        function getLastPoint(pnfDataGroups: Array<PointAndFigureGroup>): number {
            const y = pnfDataGroups[pnfDataGroups.length - 1].y;
            return y[y.length - 1];
        }

        /**
         * Push new data point to the last PNF group.
         * @private
         * @function Highcharts.seriesTypes.pointandfigure#pushNewPoint
         */
        function pushNewPoint(
            y: number,
            upTrend: boolean,
            lastPoint: number
        ): void {
            const currPointGroup = pnfDataGroups[pnfDataGroups.length - 1],
                flipFactor = upTrend ? 1 : -1,
                times = Math.floor(
                    flipFactor * (y - lastPoint) / calculatedBoxSize
                );

            for (let i = 1; i <= times; i++) {
                const newPoint =
                    lastPoint + flipFactor * (calculatedBoxSize * i);
                currPointGroup.y.push(newPoint);
            }
        }

        if (this.isDirtyData || pnfDataGroups.length === 0) {

            this.pnfDataGroups.length = 0;

            // Get first point and determine its symbol and trend
            for (let i = 0; i < yData.length; i++) {
                const x = xData[i],
                    close = yData[i],
                    firstPoint = yData[0];

                if (close - firstPoint >= calculatedBoxSize) {
                    upTrend = true;
                    pnfDataGroups.push({ x, y: [close], upTrend });
                    break;
                }
                if (firstPoint - close >= calculatedBoxSize) {
                    upTrend = false;
                    pnfDataGroups.push({ x, y: [close], upTrend });
                    break;
                }
            }

            yData.forEach((close, i): void => {
                const x = xData[i],
                    lastPoint = getLastPoint(pnfDataGroups);

                if (upTrend) {
                    // Add point going UP
                    if (close - lastPoint >= calculatedBoxSize) {
                        pushNewPoint(close, upTrend, lastPoint);
                    }

                    if (lastPoint - close >= reversal) { // Handle reversal
                        upTrend = false;

                        pnfDataGroups.push({ x, y: [], upTrend });
                        pushNewPoint(close, upTrend, lastPoint);
                    }
                }

                if (!upTrend) {
                    // Add point going DOWN
                    if (lastPoint - close >= calculatedBoxSize) {
                        pushNewPoint(close, upTrend, lastPoint);
                    }

                    if (close - lastPoint >= reversal) { // Handle reversal
                        upTrend = true;

                        pnfDataGroups.push({ x, y: [], upTrend });
                        pushNewPoint(close, upTrend, lastPoint);
                    }
                }
            });
        }

        // Process the pnfDataGroups to HC series format
        const finalData: {x: number, y: number, upTrend: boolean}[] = [];

        const processedXData: number[] = [];
        const processedYData: number[] = [];
        const processedUpTrendData: boolean[] = [];

        pnfDataGroups.forEach((point): void => {
            const x = point.x,
                upTrend = point.upTrend;

            point.y.forEach((y): void => {
                processedXData.push(x);
                processedYData.push(y);
                processedUpTrendData.push(upTrend);
                finalData.push({
                    x,
                    y,
                    upTrend
                });
            });
        });
        modified.setColumn('x', processedXData);
        modified.setColumn('y', processedYData);
        modified.setColumn('upTrend', processedUpTrendData);
        series.pnfDataGroups = pnfDataGroups;

        return {
            modified,
            cropped: false,
            cropStart: 0,
            closestPointRange: 1
        };
    }

    public markerAttribs(
        point: Point
    ): SVGAttributes {
        const series = this,
            options = series.options,
            attribs: SVGAttributes = {},
            pos = point.pos();

        attribs.width = series.markerWidth;
        attribs.height = series.markerHeight;
        if (pos && attribs.width && attribs.height) {
            attribs.x = pos[0] - Math.round(attribs.width) / 2;
            attribs.y = pos[1] - Math.round(attribs.height) / 2;
        }
        if (options.crisp && attribs.x) {
        // Math.floor for #1843:
            attribs.x = Math.floor(attribs.x);
        }

        return attribs;
    }

    public translate(): void {
        const metrics = this.getColumnMetrics(),
            calculatedBoxSize = this.calculatedBoxSize;

        this.markerWidth = metrics.width + metrics.paddedWidth + metrics.offset;
        this.markerHeight =
            this.yAxis.toPixels(0) - this.yAxis.toPixels(calculatedBoxSize);

        super.translate();
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface PointAndFigureGroup {
    x: number;
    y: Array<number>;
    upTrend: boolean;
}

interface PointAndFigureSeries {
    takeOrdinalPosition: boolean;
    pnfDataGroups: Array<PointAndFigureGroup>;
    getColumnMetrics: typeof columnProto.getColumnMetrics;
    markerWidth: number;
    markerHeight: number;
    calculatedBoxSize: number;
}

extend(PointAndFigureSeries.prototype, {
    takeOrdinalPosition: true,
    pnfDataGroups: [],
    getColumnMetrics: columnProto.getColumnMetrics,
    pointClass: PointAndFigurePoint,
    sorted: true
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        pointandfigure: typeof PointAndFigureSeries;
    }
}

SeriesRegistry.registerSeriesType('pointandfigure', PointAndFigureSeries);

/* *
 *
 *  Default Export
 *
 * */

export default PointAndFigureSeries;
