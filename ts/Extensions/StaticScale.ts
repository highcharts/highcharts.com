/* *
 *
 *  (c) 2016-2021 Torstein Honsi, Lars Cabrera
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

import type Series from '../Core/Series/Series';

import Axis from '../Core/Axis/Axis.js';
import Chart from '../Core/Chart/Chart.js';
import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import TC from '../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined } = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Axis/AxisOptions' {
    interface AxisOptions {
        staticScale?: number;
    }
}

declare module '../Core/Chart/ChartLike'{
    interface ChartLike {
        redrawTrigger?: string;
        initiatedScale?: boolean;
        /** @requires modules/static-scale */
        adjustHeight(): void;
    }
}

/* eslint-disable no-invalid-this */

/**
 * For vertical axes only. Setting the static scale ensures that each tick unit
 * is translated into a fixed pixel height. For example, setting the static
 * scale to 24 results in each Y axis category taking up 24 pixels, and the
 * height of the chart adjusts. Adding or removing items will make the chart
 * resize.
 *
 * @sample gantt/xrange-series/demo/
 *         X-range series with static scale
 *
 * @type      {number}
 * @default   50
 * @since     6.2.0
 * @product   gantt
 * @apioption yAxis.staticScale
 */

addEvent(Axis, 'afterSetOptions', function (): void {
    const chartOptions = this.chart.options.chart;
    if (
        !this.horiz &&
        isNumber(this.options.staticScale) &&
        (
            !(chartOptions as any).height ||
            (
                (chartOptions as any).scrollablePlotArea &&
                (chartOptions as any).scrollablePlotArea.minHeight
            )
        )
    ) {
        this.staticScale = this.options.staticScale;
    }
});

Chart.prototype.adjustHeight = function (): void {
    if (this.redrawTrigger !== 'adjustHeight') {
        (this.axes || []).forEach(function (axis): void {
            let chart = axis.chart,
                animate =
                    !!chart.initiatedScale &&
                    (chart.options as any).animation,
                staticScale = axis.options.staticScale,
                height,
                diff;

            if (axis.staticScale && defined(axis.min)) {
                height = pick(
                    axis.brokenAxis && axis.brokenAxis.unitLength,
                    (axis.max as any) + axis.tickInterval - axis.min
                ) * (staticScale as any);


                // Minimum height is 1 x staticScale.
                height = Math.max(height, staticScale as any);

                diff = height - chart.plotHeight;

                if (!chart.scrollablePixelsY && Math.abs(diff) >= 1) {
                    chart.plotHeight = height;
                    chart.redrawTrigger = 'adjustHeight';
                    chart.setSize(void 0, chart.chartHeight + diff, animate);
                }

                // Make sure clip rects have the right height before initial
                // animation.
                axis.series.forEach(function (series: Series): void {
                    const clipRect = series.sharedClipKey &&
                        chart.sharedClips[series.sharedClipKey];

                    if (clipRect) {
                        clipRect.attr(chart.inverted ? {
                            width: chart.plotHeight
                        } : {
                            height: chart.plotHeight
                        });
                    }
                });
            }

        });
        this.initiatedScale = true;
    }
    this.redrawTrigger = null as any;
};
addEvent(Chart, 'render', Chart.prototype.adjustHeight);
