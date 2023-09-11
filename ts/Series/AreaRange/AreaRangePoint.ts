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

import type AreaRangePointOptions from './AreaRangePointOptions';
import type AreaRangeSeries from './AreaRangeSeries';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    area: {
        prototype: {
            pointClass: AreaPoint,
            pointClass: {
                prototype: areaProto
            }
        }
    }
} = SeriesRegistry.seriesTypes;
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined } = OH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        plotHigh?: AreaRangePoint['plotHigh'];
        plotLow?: AreaRangePoint['plotLow'];
    }
}

/* *
 *
 *  Class
 *
 * */

class AreaRangePoint extends AreaPoint {

    /* *
     *
     *  Properties
     *
     * */

    public _plotY?: number;

    public below?: boolean;

    public dataLabelUpper?: SVGElement|SVGLabel;

    public isInside?: boolean;

    public isTopInside?: boolean;

    /**
     * Range series only. The high or maximum value for each data point.
     * @name Highcharts.Point#high
     * @type {number|undefined}
     */
    public high: number = void 0 as any;

    /**
     * Range series only. The low or minimum value for each data point.
     * @name Highcharts.Point#low
     * @type {number|undefined}
     */
    public low: number = void 0 as any;

    public options: AreaRangePointOptions = void 0 as any;

    public origProps?: Partial<AreaRangePoint>;

    public plotHigh?: number;

    public plotLow?: number;

    public plotHighX?: number;

    public plotLowX?: number;

    public plotX: number = void 0 as any;

    public series: AreaRangeSeries = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public setState(): void {
        const prevState = this.state,
            series = this.series,
            isPolar = series.chart.polar;


        if (!defined(this.plotHigh)) {
            // Boost doesn't calculate plotHigh
            this.plotHigh = series.yAxis.toPixels(this.high, true);
        }

        if (!defined(this.plotLow)) {
            // Boost doesn't calculate plotLow
            this.plotLow = this.plotY = series.yAxis.toPixels(this.low, true);
        }

        if (series.stateMarkerGraphic) {
            series.lowerStateMarkerGraphic = series.stateMarkerGraphic;
            series.stateMarkerGraphic = series.upperStateMarkerGraphic;
        }

        // Change state also for the top marker
        this.graphic = this.graphics && this.graphics[1];
        this.plotY = this.plotHigh;

        if (isPolar && isNumber(this.plotHighX)) {
            this.plotX = this.plotHighX;
        }

        // Top state:
        areaProto.setState.apply(this, arguments as any);

        this.state = prevState;

        // Now restore defaults
        this.plotY = this.plotLow;
        this.graphic = this.graphics && this.graphics[0];

        if (isPolar && isNumber(this.plotLowX)) {
            this.plotX = this.plotLowX;
        }

        if (series.stateMarkerGraphic) {
            series.upperStateMarkerGraphic = series.stateMarkerGraphic;
            series.stateMarkerGraphic = series.lowerStateMarkerGraphic;
            // Lower marker is stored at stateMarkerGraphic
            // to avoid reference duplication (#7021)
            series.lowerStateMarkerGraphic = void 0;
        }

        areaProto.setState.apply(this, arguments as any);
    }

    public haloPath(): SVGPath {
        const isPolar = this.series.chart.polar;

        let path: SVGPath = [];

        // Bottom halo
        this.plotY = this.plotLow;
        if (isPolar && isNumber(this.plotLowX)) {
            this.plotX = this.plotLowX;
        }

        if (this.isInside) {
            path = areaProto.haloPath.apply(this, arguments);
        }

        // Top halo
        this.plotY = this.plotHigh;
        if (isPolar && isNumber(this.plotHighX)) {
            this.plotX = this.plotHighX;
        }
        if (this.isTopInside) {
            path = path.concat(
                areaProto.haloPath.apply(this, arguments)
            );
        }

        return path;
    }

    public isValid(): boolean {
        return isNumber(this.low) && isNumber(this.high);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default AreaRangePoint;
