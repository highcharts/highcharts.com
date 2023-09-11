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

import type AxisLike from './AxisLike';
import type AxisOptions from './AxisOptions';
import type Chart from '../Chart/Chart.js';

import Axis from './Axis.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    splat,
    pushUnique
} = AH;
const { merge } = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisType' {
    interface AxisTypeRegistry {
        ZAxis: ZAxis;
    }
}

declare module '../Chart/ChartLike'{
    interface ChartLike {
        zAxis?: Array<ZAxis>;
        addZAxis(options: AxisOptions): Axis;
    }
}

declare module '../Options' {
    interface Options {
        zAxis?: (
            DeepPartial<AxisOptions>|
            Array<DeepPartial<AxisOptions>>
        );
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function chartAddZAxis(
    this: Chart,
    options: AxisOptions
): Axis {
    return new ZAxis(this, options);
}

/**
 * Get the Z axis in addition to the default X and Y.
 * @private
 */
function onChartAfterGetAxes(this: Chart): void {
    const zAxisOptions = this.options.zAxis = splat(this.options.zAxis || {});

    if (!this.is3d()) {
        return;
    }

    this.zAxis = [];

    zAxisOptions.forEach((axisOptions, i): void => {
        this.addZAxis(axisOptions).setScale();
    });
}

/* *
 *
 *  Class
 *
 * */

/**
 * 3D axis for z coordinates.
 */
class ZAxis extends Axis implements AxisLike {

    /* *
     *
     *  Static Properties
     *
     * */

    public static compose(
        ChartClass: typeof Chart
    ): void {

        if (pushUnique(composedMembers, ChartClass)) {
            addEvent(ChartClass, 'afterGetAxes', onChartAfterGetAxes);

            const chartProto = ChartClass.prototype;

            chartProto.addZAxis = chartAddZAxis;
            chartProto.collectionsWithInit.zAxis = [chartProto.addZAxis];
            chartProto.collectionsWithUpdate.push('zAxis');
        }

    }

    /* *
     *
     *  Constructor
     *
     * */

    public init(
        chart: Chart,
        userOptions: AxisOptions
    ):void {
        // #14793, this used to be set on the prototype
        this.isZAxis = true;

        super.init(chart, userOptions, 'zAxis');

    }

    /* *
     *
     *  Properties
     *
     * */

    public ignoreMaxPadding?: boolean;
    public ignoreMinPadding?: boolean;
    public isZAxis: true = true;

    /* *
     *
     *  Functions
     *
     * */

    public getSeriesExtremes(): void {
        const chart = this.chart;

        this.hasVisibleSeries = false;

        // Reset properties in case we're redrawing (#3353)
        this.dataMin = this.dataMax = this.ignoreMinPadding = (
            this.ignoreMaxPadding = void 0
        );

        if (this.stacking) {
            this.stacking.buildStacks();
        }

        // loop through this axis' series
        this.series.forEach((series): void => {

            if (
                series.visible ||
                !chart.options.chart.ignoreHiddenSeries
            ) {

                let threshold = series.options.threshold;

                this.hasVisibleSeries = true;

                // Validate threshold in logarithmic axes
                if (this.positiveValuesOnly && (threshold as any) <= 0) {
                    threshold = void 0;
                }

                const zData: Array<(number|null|undefined)> = series.zData as any;

                if (zData.length) {
                    this.dataMin = Math.min(
                        pick(this.dataMin, zData[0] as any),
                        Math.min.apply(null, zData as any)
                    );
                    this.dataMax = Math.max(
                        pick(this.dataMax, zData[0] as any),
                        Math.max.apply(null, zData as any)
                    );
                }
            }
        });
    }

    /**
     * @private
     */
    public setAxisSize(): void {
        const chart = this.chart;

        super.setAxisSize();

        this.width = this.len = (
            chart.options.chart.options3d &&
            chart.options.chart.options3d.depth
        ) || 0;
        this.right = chart.chartWidth - this.width - this.left;
    }

    /**
     * @private
     */
    public setOptions(userOptions: DeepPartial<AxisOptions>): void {

        userOptions = merge<DeepPartial<AxisOptions>>({
            offset: 0,
            lineWidth: 0
        }, userOptions);


        super.setOptions(userOptions);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ZAxis;
