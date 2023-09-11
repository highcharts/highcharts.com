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

import type ScatterPoint from './ScatterPoint';
import type ScatterSeriesOptions from './ScatterSeriesOptions';

import ScatterSeriesDefaults from './ScatterSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    line: LineSeries
} = SeriesRegistry.seriesTypes;
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;
const { addEvent } = EH;

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

    public data: Array<ScatterPoint> = void 0 as any;

    public options: ScatterSeriesOptions = void 0 as any;

    public points: Array<ScatterPoint> = void 0 as any;

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
                ['x', 'y'].forEach(function (dim, j): void {
                    let axis,
                        plotProp = 'plot' + dim.toUpperCase(),
                        min,
                        max,
                        translatedJitter;
                    if ((jitter as any)[dim] && !point.isNull) {
                        axis = (series as any)[dim + 'Axis'];
                        translatedJitter =
                            (jitter as any)[dim] * axis.transA;
                        if (axis && !axis.isLog) {

                            // Identify the outer bounds of the jitter range
                            min = Math.max(
                                0,
                                (point as any)[plotProp] - translatedJitter
                            );
                            max = Math.min(
                                axis.len,
                                (point as any)[plotProp] + translatedJitter
                            );

                            // Find a random position within this range
                            (point as any)[plotProp] = min +
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
    takeOrdinalPosition: boolean;
}
extend(ScatterSeries.prototype, {
    drawTracker: ColumnSeries.prototype.drawTracker,
    sorted: false,
    requireSorting: false,
    noSharedTooltip: true,
    trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
    takeOrdinalPosition: false // #2342

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
