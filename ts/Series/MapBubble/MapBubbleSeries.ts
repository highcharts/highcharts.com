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

import type MapBubbleSeriesOptions from './MapBubbleSeriesOptions';
import type Point from '../../Core/Series/Point';
import type PointerEvent from '../../Core/PointerEvent';

import BubbleSeries from '../Bubble/BubbleSeries.js';
import MapBubblePoint from './MapBubblePoint.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        map: {
            prototype: mapProto
        },
        mappoint: {
            prototype: mapPointProto
        }
    }
} = SeriesRegistry;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend, merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.mapbubble
 *
 * @augments Highcharts.Series
 *
 * @requires BubbleSeries
 * @requires MapPointSeries
 */
class MapBubbleSeries extends BubbleSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A map bubble series is a bubble series laid out on top of a map
     * series, where each bubble is tied to a specific map area.
     *
     * @sample maps/demo/map-bubble/
     *         Map bubble chart
     *
     * @extends      plotOptions.bubble
     * @product      highmaps
     * @optionparent plotOptions.mapbubble
     */
    public static defaultOptions: MapBubbleSeriesOptions = merge(BubbleSeries.defaultOptions, {

        /**
         * The main color of the series. This color affects both the fill
         * and the stroke of the bubble. For enhanced control, use `marker`
         * options.
         *
         * @sample {highmaps} maps/plotoptions/mapbubble-color/
         *         Pink bubbles
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @apioption plotOptions.mapbubble.color
         */

        /**
         * Whether to display negative sized bubbles. The threshold is
         * given by the [zThreshold](#plotOptions.mapbubble.zThreshold)
         * option, and negative bubbles can be visualized by setting
         * [negativeColor](#plotOptions.bubble.negativeColor).
         *
         * @type      {boolean}
         * @default   true
         * @apioption plotOptions.mapbubble.displayNegative
         */

        /**
         * Color of the line connecting bubbles. The default value is the same
         * as series' color.
         *
         * In styled mode, the color can be defined by the
         * [colorIndex](#plotOptions.series.colorIndex) option. Also, the series
         * color can be set with the `.highcharts-series`,
         * `.highcharts-color-{n}`, `.highcharts-{type}-series` or
         * `.highcharts-series-{n}` class, or individual classes given by the
         * `className` option.
         *
         *
         * @sample {highmaps} maps/demo/spider-map/
         *         Spider map
         * @sample {highmaps} maps/plotoptions/spider-map-line-color/
         *         Different line color
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @apioption plotOptions.mapbubble.lineColor
         */

        /**
         * Pixel width of the line connecting bubbles.
         *
         * @sample {highmaps} maps/demo/spider-map/
         *         Spider map
         *
         * @product   highmaps
         * @apioption plotOptions.mapbubble.lineWidth
         */
        lineWidth: 0,

        /**
         * Maximum bubble size. Bubbles will automatically size between the
         * `minSize` and `maxSize` to reflect the `z` value of each bubble.
         * Can be either pixels (when no unit is given), or a percentage of
         * the smallest one of the plot width and height.
         *
         * @sample {highmaps} highcharts/plotoptions/bubble-size/
         *         Bubble size
         * @sample {highmaps} maps/demo/spider-map/
         *         Spider map
         *
         * @product   highmaps
         * @apioption plotOptions.mapbubble.maxSize
         */

        /**
         * Minimum bubble size. Bubbles will automatically size between the
         * `minSize` and `maxSize` to reflect the `z` value of each bubble.
         * Can be either pixels (when no unit is given), or a percentage of
         * the smallest one of the plot width and height.
         *
         * @sample {highmaps} maps/demo/map-bubble/
         *         Bubble size
         * @sample {highmaps} maps/demo/spider-map/
         *         Spider map
         *
         * @product   highmaps
         * @apioption plotOptions.mapbubble.minSize
         */

        /**
         * When a point's Z value is below the
         * [zThreshold](#plotOptions.mapbubble.zThreshold) setting, this
         * color is used.
         *
         * @sample {highmaps} maps/plotoptions/mapbubble-negativecolor/
         *         Negative color below a threshold
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @apioption plotOptions.mapbubble.negativeColor
         */

        /**
         * Whether the bubble's value should be represented by the area or
         * the width of the bubble. The default, `area`, corresponds best to
         * the human perception of the size of each bubble.
         *
         * @type       {Highcharts.BubbleSizeByValue}
         * @default    area
         * @apioption  plotOptions.mapbubble.sizeBy
         */

        /**
         * When this is true, the absolute value of z determines the size
         * of the bubble. This means that with the default `zThreshold` of
         * 0, a bubble of value -1 will have the same size as a bubble of
         * value 1, while a bubble of value 0 will have a smaller size
         * according to `minSize`.
         *
         * @sample {highmaps} highcharts/plotoptions/bubble-sizebyabsolutevalue/
         *         Size by absolute value, various thresholds
         *
         * @type      {boolean}
         * @default   false
         * @since     1.1.9
         * @apioption plotOptions.mapbubble.sizeByAbsoluteValue
         */

        /**
         * The minimum for the Z value range. Defaults to the highest Z
         * value in the data.
         *
         * @see [zMax](#plotOptions.mapbubble.zMin)
         *
         * @sample {highmaps} highcharts/plotoptions/bubble-zmin-zmax/
         *         Z has a possible range of 0-100
         *
         * @type      {number}
         * @since     1.0.3
         * @apioption plotOptions.mapbubble.zMax
         */

        /**
         * The minimum for the Z value range. Defaults to the lowest Z value
         * in the data.
         *
         * @see [zMax](#plotOptions.mapbubble.zMax)
         *
         * @sample {highmaps} highcharts/plotoptions/bubble-zmin-zmax/
         *         Z has a possible range of 0-100
         *
         * @type      {number}
         * @since     1.0.3
         * @apioption plotOptions.mapbubble.zMin
         */

        /**
         * When [displayNegative](#plotOptions.mapbubble.displayNegative)
         * is `false`, bubbles with lower Z values are skipped. When
         * `displayNegative` is `true` and a
         * [negativeColor](#plotOptions.mapbubble.negativeColor) is given,
         * points with lower Z is colored.
         *
         * @sample {highmaps} maps/plotoptions/mapbubble-negativecolor/
         *         Negative color below a threshold
         *
         * @type      {number}
         * @default   0
         * @apioption plotOptions.mapbubble.zThreshold
         */

        /**
         * @default 500
         */
        animationLimit: 500,

        /**
         * @type {string|Array<string>}
         */
        joinBy: 'hc-key',
        tooltip: {
            pointFormat: '{point.name}: {point.z}'
        }
    } as MapBubbleSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<MapBubblePoint> = void 0 as any;

    public options: MapBubbleSeriesOptions = void 0 as any;

    public points: Array<MapBubblePoint> = void 0 as any;

    public clearBounds = mapProto.clearBounds;

    public searchPoint(
        e: PointerEvent,
        compareX?: boolean
    ): (Point|undefined) {
        return this.searchKDTree({
            clientX: e.chartX - this.chart.plotLeft,
            plotY: e.chartY - this.chart.plotTop
        }, compareX, e);
    }

    translate(): void {
        mapPointProto.translate.call(this);
        this.getRadii();
        this.translateBubble();
    }

    updateParallelArrays(
        point: Point,
        i: (number|string),
        iArgs?: Array<any>
    ): void {
        super.updateParallelArrays.call(
            this,
            point,
            i,
            iArgs
        );

        let processedXData = this.processedXData,
            xData = this.xData;

        if (processedXData && xData) {
            processedXData.length = xData.length;
        }
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface MapBubbleSeries {
    type: string;
    getProjectedBounds: typeof mapProto.getProjectedBounds;
    pointArrayMap: Array<string>;
    pointClass: typeof MapBubblePoint;
    setData: typeof mapProto.setData;
    processData: typeof mapProto.processData;
    projectPoint: typeof mapPointProto.projectPoint;
    setOptions: typeof mapProto.setOptions;
    updateData: typeof mapProto.updateData;
    xyFromShape: boolean;
}
extend(MapBubbleSeries.prototype, {
    type: 'mapbubble',

    axisTypes: ['colorAxis'],

    getProjectedBounds: mapProto.getProjectedBounds,

    isCartesian: false,

    // If one single value is passed, it is interpreted as z
    pointArrayMap: ['z'],

    pointClass: MapBubblePoint,

    processData: mapProto.processData,

    projectPoint: mapPointProto.projectPoint,

    setData: mapProto.setData,

    setOptions: mapProto.setOptions,

    updateData: mapProto.updateData,

    useMapGeometry: true,

    xyFromShape: true
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        mapbubble: typeof MapBubbleSeries;
    }
}
SeriesRegistry.registerSeriesType('mapbubble', MapBubbleSeries);

/* *
 *
 *  Default Export
 *
 * */

export default MapBubbleSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `mapbubble` series. If the [type](#series.mapbubble.type) option
 * is not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.mapbubble
 * @excluding dataParser, dataURL
 * @product   highmaps
 * @apioption series.mapbubble
 */

/**
 * An array of data points for the series. For the `mapbubble` series
 * type, points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values
 *    will be interpreted as `z` options. Example:
 *
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.mapbubble.turboThreshold),
 *    this option is not available.
 *
 *    ```js
 *        data: [{
 *            z: 9,
 *            name: "Point2",
 *            color: "#00FF00"
 *        }, {
 *            z: 10,
 *            name: "Point1",
 *            color: "#FF00FF"
 *        }]
 *    ```
 *
 * @type      {Array<number|null|*>}
 * @extends   series.mappoint.data
 * @excluding labelrank, middleX, middleY, path, value, x, y, lat, lon
 * @product   highmaps
 * @apioption series.mapbubble.data
 */

/**
 * While the `x` and `y` values of the bubble are determined by the
 * underlying map, the `z` indicates the actual value that gives the
 * size of the bubble.
 *
 * @sample {highmaps} maps/demo/map-bubble/
 *         Bubble
 *
 * @type      {number|null}
 * @product   highmaps
 * @apioption series.mapbubble.data.z
 */

/**
 * @excluding enabled, enabledThreshold, height, radius, width
 * @sample {highmaps} maps/plotoptions/mapbubble-symbol
 *         Map bubble with mapmarker symbol
 * @apioption series.mapbubble.marker
 */

''; // adds doclets above to transpiled file
