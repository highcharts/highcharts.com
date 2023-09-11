/* *
 *
 *  This module implements sunburst charts in Highcharts.
 *
 *  (c) 2016-2021 Highsoft AS
 *
 *  Authors: Jon Arild Nygard
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

import type { SunburstSeriesLevelOptions } from './SunburstSeriesOptions';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        treemap: TreemapSeries
    }
} = SeriesRegistry;
import type SunburstNode from './SunburstNode.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber, isObject } = TC;
const { merge } = OH;

/* *
 *
 *  Namespace
 *
 * */

namespace SunburstUtilities {

    /* *
     *
     *  Constants
     *
     * */

    export const recursive = TreemapSeries.prototype.utils.recursive;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     * @function calculateLevelSizes
     *
     * @param {Object} levelOptions
     * Map of level to its options.
     *
     * @param {Highcharts.Dictionary<number>} params
     * Object containing number parameters `innerRadius` and `outerRadius`.
     *
     * @return {Highcharts.SunburstSeriesLevelsOptions|undefined}
     * Returns the modified options, or undefined.
     */
    export function calculateLevelSizes(
        levelOptions: SunburstSeriesLevelOptions,
        params: Record<string, number>
    ): (SunburstSeriesLevelOptions|undefined) {
        let result: (SunburstSeriesLevelOptions|undefined),
            p = isObject(params) ? params : {},
            totalWeight = 0,
            diffRadius: number,
            levels: Array<number>,
            levelsNotIncluded,
            remainingSize: number,
            from,
            to;

        if (isObject(levelOptions)) {
            result = merge<SunburstSeriesLevelOptions>(
                {},
                levelOptions
            );
            from = isNumber(p.from) ? p.from : 0;
            to = isNumber(p.to) ? p.to : 0;
            levels = range(from, to);
            levelsNotIncluded = Object.keys(result).filter(function (
                k: string
            ): boolean {
                return levels.indexOf(+k) === -1;
            });
            diffRadius = remainingSize = isNumber(p.diffRadius) ?
                p.diffRadius : 0;

            // Convert percentage to pixels.
            // Calculate the remaining size to divide between "weight" levels.
            // Calculate total weight to use in convertion from weight to
            // pixels.
            levels.forEach(function (level: number): void {
                const options = (result as any)[level],
                    unit = options.levelSize.unit,
                    value = options.levelSize.value;

                if (unit === 'weight') {
                    totalWeight += value;
                } else if (unit === 'percentage') {
                    options.levelSize = {
                        unit: 'pixels',
                        value: (value / 100) * diffRadius
                    };
                    remainingSize -= options.levelSize.value;
                } else if (unit === 'pixels') {
                    remainingSize -= value;
                }
            });

            // Convert weight to pixels.
            levels.forEach(function (level: number): void {
                let options = (result as any)[level],
                    weight;

                if (options.levelSize.unit === 'weight') {
                    weight = options.levelSize.value;
                    (result as any)[level].levelSize = {
                        unit: 'pixels',
                        value: (weight / totalWeight) * remainingSize
                    };
                }
            });

            // Set all levels not included in interval [from,to] to have 0
            // pixels.
            levelsNotIncluded.forEach(function (level: string): void {
                (result as any)[level].levelSize = {
                    value: 0,
                    unit: 'pixels'
                };
            });
        }
        return result;
    }

    /**
     * @private
     */
    export function getLevelFromAndTo(
        { level, height }: SunburstNode
    ): { from: number; to: number } {
        //  Never displays level below 1
        const from = level > 0 ? level : 1;
        const to = level + height;
        return { from, to };
    }

    /**
     * TODO introduce step, which should default to 1.
     * @private
     */
    export function range(from: unknown, to: unknown): Array<number> {
        let result: Array<number> = [],
            i: number;

        if (isNumber(from) && isNumber(to) && from <= to) {
            for (i = from; i <= to; i++) {
                result.push(i);
            }
        }
        return result;
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Default Export
 *
 * */

export default SunburstUtilities;
