/* *
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

import type ScatterPoint from './ScatterPoint';
import type ScatterSeriesOptions from './ScatterSeriesOptions';

// ScatterSeries depends on ColumnSeries and LineSeries, so we must ensure they are loaded
import '../Column/ColumnSeries.js';
import '../Line/LineSeries.js';

import ScatterSeriesDefaults from './ScatterSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    line: LineSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    extend,
    merge
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Scatter series type.
 *
 * @private
 */
class ScatterSeries extends LineSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions = merge(
        LineSeries.defaultOptions,
        ScatterSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data!: Array<ScatterPoint>;

    public options!: ScatterSeriesOptions;

    public points!: Array<ScatterPoint>;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Optionally add the jitter effect.
     * @private
     */
    public applyJitter(): void {
        const series = this,
            jitter = this.options.jitter,
            len = this.points.length;

        /**
         * Return a repeatable, pseudo-random number based on an integer
         * seed.
         * @private
         */
        function unrandom(seed: number): number {
            const rand = Math.sin(seed) * 10000;
            return rand - Math.floor(rand);
        }

        if (jitter) {
            this.points.forEach(function (point, i): void {
                (['x', 'y'] as ['x', 'y']).forEach(function (dim, j): void {
                    if (jitter[dim] && !point.isNull) {
                        const plotProp: 'plotX'|'plotY' =
                                `plot${dim.toUpperCase() as 'X'|'Y'}`,
                            axis = series[`${dim}Axis`],
                            translatedJitter = (jitter as any)[dim] *
                                axis.transA;
                        if (axis && !axis.logarithmic) {

                            // Identify the outer bounds of the jitter range
                            const min = Math.max(
                                    0,
                                    (point[plotProp] || 0) - translatedJitter
                                ),
                                max = Math.min(
                                    axis.len,
                                    (point[plotProp] || 0) + translatedJitter
                                );

                            // Find a random position within this range
                            point[plotProp] = min +
                                (max - min) * unrandom(i + j * len);

                            // Update clientX for the tooltip k-d-tree
                            if (dim === 'x') {
                                point.clientX = point.plotX;
                            }
                        }
                    }
                });
            });
        }
    }

    /**
     * @private
     */
    public drawGraph(): void {
        if (this.options.lineWidth) {
            super.drawGraph();
        } else if (this.graph) {
            this.graph = this.graph.destroy();
        }
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface ScatterSeries {
    pointClass: typeof ScatterPoint;
}
extend(ScatterSeries.prototype, {
    drawTracker: ColumnSeries.prototype.drawTracker,
    sorted: false,
    requireSorting: false,
    noSharedTooltip: true,
    trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup']
});

/* *
 *
 *  Events
 *
 * */

/* eslint-disable no-invalid-this */

addEvent(ScatterSeries, 'afterTranslate', function (): void {
    this.applyJitter();
});

/* eslint-enable no-invalid-this */

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        scatter: typeof ScatterSeries;
    }
}
SeriesRegistry.registerSeriesType('scatter', ScatterSeries);

/* *
 *
 *  Default Export
 *
 * */

export default ScatterSeries;
