/* *
 *
 *  X-range series module
 *
 *  (c) 2010-2021 Torstein Honsi, Lars A. V. Cabrera
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

import type Point from '../../Core/Series/Point';
import type RectangleObject from '../../Core/Renderer/RectangleObject';
import type Series from '../../Core/Series/Series';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type {
    XRangePointOptions,
    XRangePointPartialFillOptions
} from './XRangePointOptions';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: {
            pointClass: {
                prototype: pointProto
            }
        }
    },
    seriesTypes: {
        column: {
            prototype: {
                pointClass: ColumnPoint
            }
        }
    }
} = SeriesRegistry;
import XRangeSeries from './XRangeSeries.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;

/* *
 *
 *  Declarations
 *
 * */

interface BBoxObjectWithCenter extends BBoxObject {
    centerX?: number;
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        tooltipDateKeys?: Array<string>;
    }
}

/* *
 *
 *  Class
 *
 * */

class XRangePoint extends ColumnPoint {

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Return color of a point based on its category.
     *
     * @private
     * @function getColorByCategory
     *
     * @param {object} series
     *        The series which the point belongs to.
     *
     * @param {object} point
     *        The point to calculate its color for.
     *
     * @return {object}
     *         Returns an object containing the properties color and colorIndex.
     */
    public static getColorByCategory(
        series: Series,
        point: Point
    ): AnyRecord {
        const colors = series.options.colors || series.chart.options.colors,
            colorCount = colors ?
                colors.length :
                series.chart.options.chart.colorCount as any,
            colorIndex = (point.y as any) % colorCount,
            color = colors && colors[colorIndex];

        return {
            colorIndex: colorIndex,
            color: color
        };
    }

    /* *
     *
     *  Properties
     *
     * */

    public options: XRangePointOptions = void 0 as any;
    public series: XRangeSeries = void 0 as any;
    public dlBox?: BBoxObjectWithCenter;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public resolveColor(): void {
        const series = this.series;

        if (series.options.colorByPoint && !this.options.color) {
            const colorByPoint = XRangePoint.getColorByCategory(series, this);

            if (!series.chart.styledMode) {
                this.color = colorByPoint.color;
            }

            if (!this.options.colorIndex) {
                this.colorIndex = colorByPoint.colorIndex;
            }
        } else if (!this.color) {
            this.color = series.color;
        }

    }
    /**
     * Extend init to have y default to 0.
     *
     * @private
     */
    public init(): XRangePoint {
        pointProto.init.apply(this, arguments as any);

        if (!this.y) {
            this.y = 0;
        }

        return this;
    }

    /**
     * @private
     */
    public setState(): void {
        pointProto.setState.apply(this, arguments as any);

        this.series.drawPoint(this, this.series.getAnimationVerb());
    }

    /**
     * Add x2 and yCategory to the available properties for tooltip formats.
     *
     * @private
     */
    public getLabelConfig(): XRangePoint.XRangePointLabelObject {
        const cfg = pointProto.getLabelConfig.call(this) as
                XRangePoint.XRangePointLabelObject,
            yCats = this.series.yAxis.categories;

        cfg.x2 = this.x2;
        cfg.yCategory = this.yCategory = yCats && yCats[this.y as any];

        // Use 'category' as 'key' to ensure tooltip datetime formatting.
        // Use 'name' only when 'category' is undefined.
        cfg.key = this.category || this.name;

        return cfg;
    }

    /**
     * @private
     */
    public isValid(): boolean {
        return typeof this.x === 'number' &&
        typeof this.x2 === 'number';
    }

}

/* *
 *
 * Class Prototype
 *
 * */

interface XRangePoint {
    clipRectArgs?: RectangleObject;
    len?: number;
    partialFill: XRangePointOptions['partialFill'];
    partShapeArgs?: XRangePointPartialFillOptions;
    shapeType: string;
    tooltipDateKeys: Array<string>;
    x2?: number;
    yCategory?: string;

}
extend(XRangePoint.prototype, {
    ttBelow: false,
    tooltipDateKeys: ['x', 'x2']
});

/* *
 *
 *  Class Namespace
 *
 * */

declare namespace XRangePoint {
    interface XRangePointLabelObject extends Point.PointLabelObject {
        x2?: XRangePoint['x2'];
        yCategory?: XRangePoint['yCategory'];
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default XRangePoint;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * The ending X value of the range point.
 * @name Highcharts.Point#x2
 * @type {number|undefined}
 * @requires modules/xrange
 */

/**
 * Extend applyOptions so that `colorByPoint` for x-range means that one
 * color is applied per Y axis category.
 *
 * @private
 * @function Highcharts.Point#applyOptions
 *
 * @return {Highcharts.Series}
 */

/**
 * @interface Highcharts.PointOptionsObject in parts/Point.ts
 *//**
 * The ending X value of the range point.
 * @name Highcharts.PointOptionsObject#x2
 * @type {number|undefined}
 * @requires modules/xrange
 */

(''); // keeps doclets above in JS file
