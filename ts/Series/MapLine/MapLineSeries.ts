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

import type MapLinePoint from './MapLinePoint.js';
import type MapLineSeriesOptions from './MapLineSeriesOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';

import MapLineSeriesDefaults from './MapLineSeriesDefaults.js';
import MapSeries from '../Map/MapSeries.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import U from '../../Core/Utilities.js';
const {
    extend,
    merge
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.mapline
 *
 * @augments Highcharts.Series
 */
class MapLineSeries extends MapSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: MapLineSeriesOptions = merge(
        MapSeries.defaultOptions,
        MapLineSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<MapLinePoint> = void 0 as any;

    public options: MapLineSeriesOptions = void 0 as any;

    public points: Array<MapLinePoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Get presentational attributes
     * @private
     * @function Highcharts.seriesTypes.mapline#pointAttribs
     */
    public pointAttribs(point: MapLinePoint): SVGAttributes {
        const attr = super.pointAttribs(point);

        // The difference from a map series is that the stroke takes the
        // point color
        attr.fill = this.options.fillColor;

        return attr;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface MapLineSeries {
    colorProp: 'stroke';
    pointClass: typeof MapLinePoint;
}
extend(MapLineSeries.prototype, {

    type: 'mapline',

    colorProp: 'stroke',

    pointAttrToOptions: {
        'stroke': 'color',
        'stroke-width': 'lineWidth'
    }

});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        mapline: typeof MapLineSeries;
    }
}
SeriesRegistry.registerSeriesType('mapline', MapLineSeries);

/* *
 *
 *  Default Export
 *
 * */

export default MapLineSeries;
