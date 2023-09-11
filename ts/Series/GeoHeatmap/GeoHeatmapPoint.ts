/* *
 *
 *  (c) 2010-2023 Highsoft AS
 *
 *  Authors: Magdalena Gut, Piotr Madej
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

import GeoHeatmapPointOptions from '../GeoHeatmap/GeoHeatmapPointOptions.js';
import GeoHeatmapSeries from '../GeoHeatmap/GeoHeatmapSeries.js';
import { PointShortOptions } from '../../Core/Series/PointOptions.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;

const {
    map: {
        prototype: {
            pointClass: MapPoint
        }
    }
} = SeriesRegistry.seriesTypes;


/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/KDPointSearchObjectLike' {
    interface KDPointSearchObjectLike {
        lat?: number;
        lon?: number;
    }
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        lat?: number;
        lon?: number;
    }
}

/* *
 *
 *  Class
 *
 * */

class GeoHeatmapPoint extends MapPoint {

    /* *
     *
     *  Properties
     *
     * */

    public lat: number = void 0 as any;

    public lon: number = void 0 as any;

    public options: GeoHeatmapPointOptions = void 0 as any;

    public series: GeoHeatmapSeries = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    public applyOptions(
        options: (GeoHeatmapPointOptions | PointShortOptions),
        x?: number
    ): GeoHeatmapPoint {
        const point = super.applyOptions.call(
                this, options, x
            ) as GeoHeatmapPoint,
            { lat, lon } = point.options;


        if (isNumber(lon) && isNumber(lat)) {
            const { colsize = 1, rowsize = 1 } = this.series.options,
                x1 = lon - colsize / 2,
                y1 = lat - rowsize / 2;

            point.geometry = point.options.geometry = {
                type: 'Polygon',
                // A rectangle centered in lon/lat
                coordinates: [
                    [
                        [x1, y1],
                        [x1 + colsize, y1],
                        [x1 + colsize, y1 + rowsize],
                        [x1, y1 + rowsize],
                        [x1, y1]
                    ]
                ]
            };
        }

        return point;

        /* eslint-enable valid-jsdoc */

    }
}

/* *
 *
 *  Default Export
 *
 * */

export default GeoHeatmapPoint;
