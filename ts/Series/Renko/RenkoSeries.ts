/* *
 *
 *  (c) 2010-2024 Pawel Lysy
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

import type RenkoSeriesOptions from './RenkoSeriesOptions';
import type ColorType from '../../Core/Color/ColorType';
import type Series from '../../Core/Series/Series';
import type PointOptions from '../../Core/Series/PointOptions';
import type { PointShortOptions } from '../../Core/Series/PointOptions';

import RenkoPoint from './RenkoPoint.js';
import RenkoSeriesDefaults from './RenkoSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import ColumnSeries from '../Column/ColumnSeries.js';
import U from '../../Core/Utilities.js';
import type AnimationOptions from '../../Core/Animation/AnimationOptions';
const { extend, merge, relativeLength, isNumber } = U;

interface RenkoData {
    x: number;
    low: number;
    y: number;
    color?: ColorType;
    upTrend?: boolean;
}
/* *
 *
 *  Class
 *
 * */

/**
 * The renko series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.renko
 *
 * @augments Highcharts.seriesTypes.column
 */
class RenkoSeries extends ColumnSeries {
    /**
     * Renko data created from linear data
     */
    public renkoData?: RenkoData[];
    public hasDerivedData = true;
    public allowDG = false;

    public init(): void {
        super.init.apply(this, arguments);
        this.renkoData = [];
    }

    public setData(
        data: (PointOptions | PointShortOptions)[],
        redraw?: boolean,
        animation?: boolean | Partial<AnimationOptions> | undefined
    ): void {
        this.renkoData = [];
        super.setData(data, redraw, animation, false);
    }

    public getXExtremes(xData: number[]): { min: number; max: number } {
        this.processData();

        xData = this.getColumn('x', true);
        return {
            min: xData[0],
            max: xData[xData.length - 1]
        };
    }

    public getProcessedData(): Series.ProcessedDataObject {
        const modified = this.dataTable.modified;
        const processedXData: number[] = [];
        const processedYData: number[] = [];
        const processedLowData: number[] = [];
        const processedColorData: (ColorType|undefined)[] = [];
        const processedUpTrendData: (boolean|undefined)[] = [];
        const xData = this.getColumn('x', true);
        const yData = this.getColumn('y', true);
        if (!this.renkoData || this.renkoData.length > 0) {
            return {
                modified,
                closestPointRange: 1,
                cropped: false,
                cropStart: 0
            };
        }

        const boxSize = this.options.boxSize;
        const change =
            isNumber(boxSize) ? boxSize : relativeLength(boxSize, yData[0]);
        const renkoData: RenkoData[] = [],
            length = xData.length;
        let prevTrend = 0;
        let prevPrice = yData[0];

        for (let i = 1; i < length; i++) {
            const currentChange = yData[i] - yData[i - 1];
            if (currentChange > change) {
                // Uptrend
                if (prevTrend === 2) {
                    prevPrice += change;
                }

                for (let j = 0; j < currentChange / change; j++) {
                    renkoData.push({
                        x: xData[i] + j,
                        low: prevPrice,
                        y: prevPrice + change,
                        color: this.options.color,
                        upTrend: true
                    });
                    prevPrice += change;
                }
                prevTrend = 1;
            } else if (Math.abs(currentChange) > change) {
                if (prevTrend === 1) {
                    prevPrice -= change;
                }
                // Downtrend
                for (let j = 0; j < Math.abs(currentChange) / change; j++) {
                    renkoData.push({
                        x: xData[i] + j,
                        low: prevPrice - change,
                        y: prevPrice,
                        color: this.options.downColor,
                        upTrend: false
                    });
                    prevPrice -= change;
                }
                prevTrend = 2;
            }
        }

        this.renkoData = renkoData;

        for (const point of renkoData) {
            processedXData.push(point.x);
            processedYData.push(point.y);
            processedLowData.push(point.low);
            processedColorData.push(point.color);
            processedUpTrendData.push(point.upTrend);
        }

        modified.setColumn('x', processedXData);
        modified.setColumn('y', processedYData);
        modified.setColumn('low', processedLowData);
        modified.setColumn('color', processedColorData as any);
        modified.setColumn('upTrend', processedUpTrendData);

        return {
            modified,
            cropped: false,
            cropStart: 0,
            closestPointRange: 1
        };
    }

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: RenkoSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        RenkoSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data!: Array<RenkoPoint>;

    public options!: RenkoSeriesOptions;

    public points!: Array<RenkoPoint>;

    /* *
     *
     *  Functions
     *
     * */
}

interface RenkoSeries {
    pointClass: typeof RenkoPoint;
}

extend(RenkoSeries.prototype, {
    pointClass: RenkoPoint
});
/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        renko: typeof RenkoSeries;
    }
}

SeriesRegistry.registerSeriesType('renko', RenkoSeries);

/* *
 *
 *  Default Export
 *
 * */

export default RenkoSeries;
