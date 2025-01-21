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

import type PieSeries from './PieSeries';
import type { PlotOptionsOf } from '../../Core/Series/SeriesOptions';
import type Point from '../../Core/Series/Point';

import { Palette } from '../../Core/Color/Palettes.js';

/* *
 *
 *  API Options
 *
 * */

/**
 * A pie chart is a circular graphic which is divided into slices to
 * illustrate numerical proportion.
 *
 * @sample highcharts/demo/pie-chart/
 *         Pie chart
 *
 * @extends      plotOptions.line
 * @excluding    animationLimit, boostThreshold, connectEnds, connectNulls,
 *               cropThreshold, dashStyle, dataSorting, dragDrop,
 *               findNearestPointBy, getExtremesFromAll, label, lineWidth,
 *               linkedTo, marker, negativeColor, pointInterval,
 *               pointIntervalUnit, pointPlacement, pointStart,
 *               softThreshold, stacking, step, threshold, turboThreshold,
 *               zoneAxis, zones, dataSorting, boostBlending
 * @product      highcharts highmaps
 * @optionparent plotOptions.pie
 *
 * @private
 */
const PieSeriesDefaults: PlotOptionsOf<PieSeries> = {

    /**
     * The corner radius of the border surrounding each slice. A number
     * signifies pixels. A percentage string, like for example `50%`, signifies
     * a size relative to the radius and the inner radius.
     *
     * @sample  highcharts/plotoptions/series-border-radius
     *          Column and pie with rounded border
     *
     * @since   11.0.0
     *
     * @type      {number|string|Highcharts.BorderRadiusOptionsObject}
     */
    borderRadius: 3,

    /**
     * @excluding legendItemClick
     * @apioption plotOptions.pie.events
     */

    /**
     * Fires when the checkbox next to the point name in the legend is
     * clicked. One parameter, event, is passed to the function. The state
     * of the checkbox is found by event.checked. The checked item is found
     * by event.item. Return false to prevent the default action which is to
     * toggle the select state of the series.
     *
     * @sample {highcharts} highcharts/plotoptions/series-events-checkboxclick/
     *         Alert checkbox status
     *
     * @type      {Function}
     * @since     1.2.0
     * @product   highcharts highmaps
     * @context   Highcharts.Point
     * @apioption plotOptions.pie.events.checkboxClick
     */

    /**
     * Fires when the legend item belonging to the pie point (slice) is
     * clicked. The `this` keyword refers to the point itself. One
     * parameter, `event`, is passed to the function, containing common
     * event information. The default action is to toggle the visibility of
     * the point. This can be prevented by calling `event.preventDefault()`.
     *
     *  **Note:** This option is deprecated in favor of
     * [legend.events.itemClick](#legend.events.itemClick).
     *
     * @deprecated 11.4.4
     * @type       {Highcharts.PointLegendItemClickCallbackFunction}
     * @since      1.2.0
     * @product    highcharts highmaps
     * @apioption  plotOptions.pie.point.events.legendItemClick
     */

    /**
     * The center of the pie chart relative to the plot area. Can be
     * percentages or pixel values. The default behaviour (as of 3.0) is to
     * center the pie so that all slices and data labels are within the plot
     * area. As a consequence, the pie may actually jump around in a chart
     * with dynamic values, as the data labels move. In that case, the
     * center should be explicitly set, for example to `["50%", "50%"]`.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-center/
     *         Centered at 100, 100
     *
     * @type    {Array<(number|string|null),(number|string|null)>}
     * @default [null, null]
     * @product highcharts highmaps
     *
     * @private
     */
    center: [null, null],

    /**
     * The color of the pie series. A pie series is represented as an empty
     * circle if the total sum of its values is 0. Use this property to
     * define the color of its border.
     *
     * In styled mode, the color can be defined by the
     * [colorIndex](#plotOptions.series.colorIndex) option. Also, the series
     * color can be set with the `.highcharts-series`,
     * `.highcharts-color-{n}`, `.highcharts-{type}-series` or
     * `.highcharts-series-{n}` class, or individual classes given by the
     * `className` option.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-emptyseries/
     *         Empty pie series
     *
     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @default   ${palette.neutralColor20}
     * @apioption plotOptions.pie.color
     */

    /**
     * @product highcharts
     *
     * @private
     */
    clip: false,

    /**
     * @ignore-option
     *
     * @private
     */
    colorByPoint: true, // Always true for pies

    /**
     * A series specific or series type specific color set to use instead
     * of the global [colors](#colors).
     *
     * @sample {highcharts} highcharts/demo/pie-monochrome/
     *         Set default colors for all pies
     *
     * @type      {Array<Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject>}
     * @since     3.0
     * @product   highcharts highmaps
     * @apioption plotOptions.pie.colors
     */

    /**
     * @declare   Highcharts.SeriesPieDataLabelsOptionsObject
     * @extends   plotOptions.series.dataLabels
     * @excluding align, allowOverlap, inside, staggerLines, step
     * @private
     */
    dataLabels: {

        padding: 5,

        /**
         * Alignment method for data labels. Possible values are:
         *
         * - `plotEdges`: Each label touches the nearest vertical edge of
         *   the plot area.
         *
         * - `connectors`: Connectors have the same x position and the
         *   widest label of each half (left & right) touches the nearest
         *   vertical edge of the plot area.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-alignto-connectors/
         *         alignTo: connectors
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-alignto-plotedges/
         *         alignTo: plotEdges
         *
         * @type      {string}
         * @since     7.0.0
         * @product   highcharts highmaps
         * @apioption plotOptions.pie.dataLabels.alignTo
         */

        /**
         * The color of the line connecting the data label to the pie slice.
         * The default color is the same as the point's color.
         *
         * In styled mode, the connector stroke is given in the
         * `.highcharts-data-label-connector` class.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-connectorcolor/
         *         Blue connectors
         * @sample {highcharts} highcharts/css/pie-point/
         *         Styled connectors
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since     2.1
         * @product   highcharts highmaps
         * @apioption plotOptions.pie.dataLabels.connectorColor
         */

        /**
         * The distance from the data label to the connector. Note that
         * data labels also have a default `padding`, so in order for the
         * connector to touch the text, the `padding` must also be 0.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-connectorpadding/
         *         No padding
         *
         * @since   2.1
         * @product highcharts highmaps
         */
        connectorPadding: 5,

        /**
         * Specifies the method that is used to generate the connector path.
         * Highcharts provides 3 built-in connector shapes: `'crookedLine'`
         * (default since v11), `'fixedOffset'` and `'straight'`.
         *
         * Users can provide their own method by passing a function instead of a
         * string. Three arguments are passed to the callback:
         *
         * - An object that holds the information about the coordinates of the
         *   label (`x` & `y` properties) and how the label is located in
         *   relation to the pie (`alignment` property). `alignment` can by one
         *   of the following: `'left'` (pie on the left side of the data
         *   label), `'right'` (pie on the right side of the data label) or
         *   `'center'` (data label overlaps the pie).
         *
         * - An object that holds the information about the position of the
         *   connector. Its `touchingSliceAt`  porperty tells the position of
         *   the place where the connector touches the slice.
         *
         * - Data label options
         *
         * The function has to return an SVG path definition in array form (see
         * the example).
         *
         * @sample {highcharts}
         *         highcharts/plotoptions/pie-datalabels-connectorshape-string/
         *         connectorShape is a String
         * @sample {highcharts}
         *         highcharts/plotoptions/pie-datalabels-connectorshape-function/
         *         connectorShape is a function
         *
         * @type    {string|Function}
         * @since   7.0.0
         * @product highcharts highmaps
         */
        connectorShape: 'crookedLine',

        /**
         * The width of the line connecting the data label to the pie slice.
         *
         * In styled mode, the connector stroke width is given in the
         * `.highcharts-data-label-connector` class.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-connectorwidth-disabled/
         *         Disable the connector
         * @sample {highcharts} highcharts/css/pie-point/
         *         Styled connectors
         *
         * @type      {number}
         * @default   1
         * @since     2.1
         * @product   highcharts highmaps
         * @apioption plotOptions.pie.dataLabels.connectorWidth
         */

        /**
         * Works only if `connectorShape` is `'crookedLine'`. It defines how
         * far from the vertical plot edge the coonnector path should be
         * crooked. With the default, `undefined`, the crook is placed so that
         * the horizontal line from the label intersects with the radial line
         * extending through the center of the pie slice.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-crookdistance/
         *         crookDistance set to 90%
         *
         * @since   7.0.0
         * @product highcharts highmaps
         */
        crookDistance: void 0,

        /**
         * The distance of the data label from the pie's edge. Negative
         * numbers put the data label on top of the pie slices. Can also be
         * defined as a percentage of pie's radius. Connectors are only
         * shown for data labels outside the pie.
         *
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-distance/
         *         Data labels on top of the pie
         *
         * @type    {number|string}
         * @since   2.1
         * @product highcharts highmaps
         */
        distance: 30,

        enabled: true,

        /**
         * A
         * [format string](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting)
         * for the data label. Available variables are the same as for
         * `formatter`.
         *
         * @sample {highcharts} highcharts/plotoptions/series-datalabels-format/
         *         Add a unit
         *
         * @type      {string}
         * @default   undefined
         * @since     3.0
         * @apioption plotOptions.pie.dataLabels.format
         */

        // eslint-disable-next-line valid-jsdoc
        /**
         * Callback JavaScript function to format the data label. Note that
         * if a `format` is defined, the format takes precedence and the
         * formatter is ignored.
         *
         * @type {Highcharts.DataLabelsFormatterCallbackFunction}
         * @default function () { return this.point.isNull ? void 0 : this.point.name; }
         */
        formatter: function (
            this: Point
        ): (string|undefined) { // #2945
            return this.isNull ? void 0 : this.name;
        },

        /**
         * Whether to render the connector as a soft arc or a line with a sharp
         * break. Works only if `connectorShape` equals to `fixedOffset`.
         *
         * @sample {highcharts}
         *         highcharts/plotoptions/pie-datalabels-softconnector-true/
         *         Soft
         * @sample {highcharts}
         *         highcharts/plotoptions/pie-datalabels-softconnector-false/
         *         Non soft
         *
         * @since   2.1.7
         * @product highcharts highmaps
         */
        softConnector: true,

        /**
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-overflow
         *         Long labels truncated with an ellipsis
         * @sample {highcharts} highcharts/plotoptions/pie-datalabels-overflow-wrap
         *         Long labels are wrapped
         *
         * @type      {Highcharts.CSSObject}
         * @apioption plotOptions.pie.dataLabels.style
         */

        x: 0

    },

    /**
     * If the total sum of the pie's values is 0, the series is represented
     * as an empty circle . The `fillColor` option defines the color of that
     * circle. Use [pie.borderWidth](#plotOptions.pie.borderWidth) to set
     * the border thickness.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-emptyseries/
     *         Empty pie series
     *
     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @private
     */
    fillColor: void 0,

    /**
     * The end angle of the pie in degrees where 0 is top and 90 is right.
     * Defaults to `startAngle` plus 360.
     *
     * @sample {highcharts} highcharts/demo/pie-semi-circle/
     *         Semi-circle donut
     *
     * @type      {number}
     * @since     1.3.6
     * @product   highcharts highmaps
     * @apioption plotOptions.pie.endAngle
     */

    /**
     * Thickness describing the ring size for a donut type chart,
     * overriding [innerSize](#plotOptions.pie.innerSize).
     *
     * @type      {number}
     * @default   undefined
     * @product   highcharts
     * @since 10.1.0
     * @apioption plotOptions.pie.thickness
     * @private
     */

    /**
     * Equivalent to [chart.ignoreHiddenSeries](#chart.ignoreHiddenSeries),
     * this option tells whether the series shall be redrawn as if the
     * hidden point were `null`.
     *
     * The default value changed from `false` to `true` with Highcharts
     * 3.0.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-ignorehiddenpoint/
     *         True, the hiddden point is ignored
     *
     * @since   2.3.0
     * @product highcharts highmaps
     *
     * @private
     */
    ignoreHiddenPoint: true,

    /**
     * @default   true
     * @extends   plotOptions.series.inactiveOtherPoints
     * @private
     */
    inactiveOtherPoints: true,

    /**
     * The size of the inner diameter for the pie. A size greater than 0
     * renders a donut chart. Can be a percentage or pixel value.
     * Percentages are relative to the pie size. Pixel values are given as
     * integers. Setting overridden by thickness.
     *
     *
     * Note: in Highcharts < 4.1.2, the percentage was relative to the plot
     * area, not the pie size.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-innersize-80px/
     *         80px inner size
     * @sample {highcharts} highcharts/plotoptions/pie-innersize-50percent/
     *         50% of the plot area
     * @sample {highcharts} highcharts/demo/3d-pie-donut/
     *         3D donut
     *
     * @type      {number|string}
     * @default   0
     * @since     2.0
     * @product   highcharts highmaps
     * @apioption plotOptions.pie.innerSize
     */

    /**
     * @ignore-option
     *
     * @private
     */
    legendType: 'point',

    /**
     * @ignore-option
     *
     * @private
     */
    marker: null as any, // Point options are specified in the base options

    /**
     * The minimum size for a pie in response to auto margins. The pie will
     * try to shrink to make room for data labels in side the plot area,
     *  but only to this size.
     *
     * @type      {number|string}
     * @default   80
     * @since     3.0
     * @product   highcharts highmaps
     * @apioption plotOptions.pie.minSize
     */

    /**
     * The diameter of the pie relative to the plot area. Can be a
     * percentage or pixel value. Pixel values are given as integers. The
     * default behaviour (as of 3.0) is to scale to the plot area and give
     * room for data labels within the plot area.
     * [slicedOffset](#plotOptions.pie.slicedOffset) is also included in the
     * default size calculation. As a consequence, the size of the pie may
     * vary when points are updated and data labels more around. In that
     * case it is best to set a fixed value, for example `"75%"`.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-size/
     *         Smaller pie
     *
     * @type    {number|string|null}
     * @product highcharts highmaps
     *
     * @private
     */
    size: null as any,

    /**
     * Whether to display this particular series or series type in the
     * legend. Since 2.1, pies are not shown in the legend by default.
     *
     * @sample {highcharts} highcharts/plotoptions/series-showinlegend/
     *         One series in the legend, one hidden
     *
     * @product highcharts highmaps
     *
     * @private
     */
    showInLegend: false,

    /**
     * If a point is sliced, moved out from the center, how many pixels
     * should it be moved?.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-slicedoffset-20/
     *         20px offset
     *
     * @product highcharts highmaps
     *
     * @private
     */
    slicedOffset: 10,

    /**
     * The start angle of the pie slices in degrees where 0 is top and 90
     * right.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-startangle-90/
     *         Start from right
     *
     * @type      {number}
     * @default   0
     * @since     2.3.4
     * @product   highcharts highmaps
     * @apioption plotOptions.pie.startAngle
     */

    /**
     * Sticky tracking of mouse events. When true, the `mouseOut` event
     * on a series isn't triggered until the mouse moves over another
     * series, or out of the plot area. When false, the `mouseOut` event on
     * a series is triggered when the mouse leaves the area around the
     * series'  graph or markers. This also implies the tooltip. When
     * `stickyTracking` is false and `tooltip.shared` is false, the tooltip
     * will be hidden when moving the mouse between series.
     *
     * @product highcharts highmaps
     *
     * @private
     */
    stickyTracking: false,

    tooltip: {
        followPointer: true
    },

    /**
     * The color of the border surrounding each slice. When `null`, the
     * border takes the same color as the slice fill. This can be used
     * together with a `borderWidth` to fill drawing gaps created by
     * antialiazing artefacts in borderless pies.
     *
     * In styled mode, the border stroke is given in the `.highcharts-point`
     * class.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-bordercolor-black/
     *         Black border
     *
     * @type    {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @default #ffffff
     * @product highcharts highmaps
     *
     * @private
     */
    borderColor: Palette.backgroundColor,

    /**
     * The width of the border surrounding each slice.
     *
     * When setting the border width to 0, there may be small gaps between
     * the slices due to SVG antialiasing artefacts. To work around this,
     * keep the border width at 0.5 or 1, but set the `borderColor` to
     * `null` instead.
     *
     * In styled mode, the border stroke width is given in the
     * `.highcharts-point` class.
     *
     * @sample {highcharts} highcharts/plotoptions/pie-borderwidth/
     *         3px border
     *
     * @product highcharts highmaps
     *
     * @private
     */
    borderWidth: 1,

    /**
     * @ignore-option
     * @private
     */
    lineWidth: void 0, // #12222

    states: {

        /**
         * @extends   plotOptions.series.states.hover
         * @excluding marker, lineWidth, lineWidthPlus
         * @product   highcharts highmaps
         */
        hover: {

            /**
             * How much to brighten the point on interaction. Requires the
             * main color to be defined in hex or rgb(a) format.
             *
             * In styled mode, the hover brightness is by default replaced
             * by a fill-opacity given in the `.highcharts-point-hover`
             * class.
             *
             * @sample {highcharts} highcharts/plotoptions/pie-states-hover-brightness/
             *         Brightened by 0.5
             *
             * @product highcharts highmaps
             */
            brightness: 0.1
        }
    }
};

/**
 * A `pie` series. If the [type](#series.pie.type) option is not specified,
 * it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.pie
 * @excluding cropThreshold, dataParser, dataURL, linkedTo, stack, xAxis, yAxis,
 *            dataSorting, step, boostThreshold, boostBlending
 * @product   highcharts highmaps
 * @apioption series.pie
 */

/**
 * An array of data points for the series. For the `pie` series type,
 * points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.pie.turboThreshold),
 *    this option is not available.
 *    ```js
 *    data: [{
 *        y: 1,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        y: 7,
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
 * @type      {Array<number|Array<string,(number|null)>|null|*>}
 * @extends   series.line.data
 * @excluding marker, x
 * @product   highcharts highmaps
 * @apioption series.pie.data
 */

/**
 * @type      {Highcharts.SeriesPieDataLabelsOptionsObject}
 * @product   highcharts highmaps
 * @apioption series.pie.data.dataLabels
 */

/**
 * The sequential index of the data point in the legend.
 *
 * @type      {number}
 * @product   highcharts highmaps
 * @apioption series.pie.data.legendIndex
 */

/**
 * Whether to display a slice offset from the center.
 *
 * @sample {highcharts} highcharts/point/sliced/
 *         One sliced point
 *
 * @type      {boolean}
 * @product   highcharts highmaps
 * @apioption series.pie.data.sliced
 */

/**
 * @extends plotOptions.pie.dataLabels
 * @excluding align, allowOverlap, inside, staggerLines, step
 * @product   highcharts highmaps
 * @apioption series.pie.dataLabels
 */

/**
 * @excluding legendItemClick
 * @product   highcharts highmaps
 * @apioption series.pie.events
 */

''; // Placeholder for transpiled doclets above

/* *
 *
 *  Default Export
 *
 * */

export default PieSeriesDefaults;
