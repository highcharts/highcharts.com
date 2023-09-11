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

import type PolygonPoint from './PolygonPoint';
import type PolygonSeriesOptions from './PolygonSeriesOptions';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import H from '../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: Series,
    seriesTypes: {
        area: AreaSeries,
        line: LineSeries,
        scatter: ScatterSeries
    }
} = SeriesRegistry;

import '../../Core/Legend/Legend.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

/* *
 *
 * Class
 *
 * */

class PolygonSeries extends ScatterSeries {

    /* *
     *
     * Static properties
     *
     * */

    /**
     * A polygon series can be used to draw any freeform shape in the cartesian
     * coordinate system. A fill is applied with the `color` option, and
     * stroke is applied through `lineWidth` and `lineColor` options.
     *
     * @sample {highcharts} highcharts/demo/polygon/
     *         Polygon
     * @sample {highstock} highcharts/demo/polygon/
     *         Polygon
     *
     * @extends      plotOptions.scatter
     * @since        4.1.0
     * @excluding    jitter, softThreshold, threshold, cluster, boostThreshold,
     *               boostBlending
     * @product      highcharts highstock
     * @requires     highcharts-more
     * @optionparent plotOptions.polygon
     */
    public static defaultOptions: PolygonSeriesOptions = merge(ScatterSeries.defaultOptions, {
        marker: {
            enabled: false,
            states: {
                hover: {
                    enabled: false
                }
            }
        },
        stickyTracking: false,
        tooltip: {
            followPointer: true,
            pointFormat: ''
        },
        trackByArea: true,
        legendSymbol: 'rectangle'
    }) as PolygonSeriesOptions;

    /* *
     *
     * Properties
     *
     * */
    public areaPath?: SVGPath;
    public data: Array<PolygonPoint> = void 0 as any;
    public options: PolygonSeriesOptions = void 0 as any;
    public points: Array<PolygonPoint> = void 0 as any;

    /* *
     *
     * Functions
     *
     * */
    public getGraphPath(): SVGPath {
        let graphPath: SVGPath = LineSeries.prototype.getGraphPath.call(this),
            i = graphPath.length + 1;

        // Close all segments
        while (i--) {
            if ((i === graphPath.length || graphPath[i][0] === 'M') && i > 0) {
                graphPath.splice(i, 0, ['Z']);
            }
        }
        this.areaPath = graphPath;
        return graphPath;
    }
    public drawGraph(): void {
        // Hack into the fill logic in area.drawGraph
        this.options.fillColor = this.color;
        AreaSeries.prototype.drawGraph.call(this);
    }
}

interface PolygonSeries {
    pointClass: typeof PolygonPoint;
    type: string;
}

extend(PolygonSeries.prototype, {
    type: 'polygon',
    drawTracker: Series.prototype.drawTracker,
    setStackedPoints: noop // No stacking points on polygons (#5310)
});

/* *
 *
 * Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        polygon: typeof PolygonSeries;
    }
}

SeriesRegistry.registerSeriesType('polygon', PolygonSeries);

/* *
 *
 * Export
 *
 * */
export default PolygonSeries;

/* *
 *
 * API Options
 *
 * */
/**
 * A `polygon` series. If the [type](#series.polygon.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.polygon
 * @excluding dataParser, dataURL, stack, boostThreshold, boostBlending
 * @product   highcharts highstock
 * @requires  highcharts-more
 * @apioption series.polygon
 */

/**
 * An array of data points for the series. For the `polygon` series
 * type, points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. The `x` values will be automatically
 *    calculated, either starting at 0 and incremented by 1, or from
 *    `pointStart` and `pointInterval` given in the series options. If the axis
 *    has categories, these will be used. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of arrays with 2 values. In this case, the values correspond to
 *    `x,y`. If the first value is a string, it is applied as the name of the
 *    point, and the `x` value is inferred.
 *    ```js
 *    data: [
 *        [0, 10],
 *        [1, 3],
 *        [2, 1]
 *    ]
 *    ```
 *
 * 3. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.polygon.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        x: 1,
 *        y: 1,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        x: 1,
 *        y: 8,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<number|Array<(number|string),(number|null)>|null|*>}
 * @extends   series.line.data
 * @product   highcharts highstock
 * @apioption series.polygon.data
 */

''; // adds doclets above to transpiled file
