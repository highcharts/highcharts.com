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

import type ChartOptions from './ChartOptions';

import { Palette } from '../Color/Palettes.js';

/* *
 *
 *  API Options
 *
 * */

/**
 * General options for the chart.
 *
 * @optionparent chart
 */
const ChartDefaults: ChartOptions = {

    /**
     * Default `mapData` for all series, in terms of a GeoJSON or TopoJSON
     * object. If set to a string, it functions as an index into the
     * `Highcharts.maps` array.
     *
     * For picking out individual shapes and geometries to use for each series
     * of the map, see [series.mapData](#series.map.mapData).
     *
     * @sample    maps/demo/geojson
     *            Loading GeoJSON data
     * @sample    maps/chart/topojson
     *            Loading TopoJSON data
     *
     * @type      {string|Array<*>|Highcharts.GeoJSON|Highcharts.TopoJSON}
     * @since     5.0.0
     * @product   highmaps
     * @apioption chart.map
     */

    /**
     * Set lat/lon transformation definitions for the chart. If not defined,
     * these are extracted from the map data.
     *
     * @type      {*}
     * @since     5.0.0
     * @product   highmaps
     * @apioption chart.mapTransforms
     */

    /**
     * When using multiple axes, the ticks of two or more opposite axes
     * will automatically be aligned by adding ticks to the axis or axes
     * with the least ticks, as if `tickAmount` were specified.
     *
     * This can be prevented by setting `alignTicks` to false. If the grid
     * lines look messy, it's a good idea to hide them for the secondary
     * axis by setting `gridLineWidth` to 0.
     *
     * If `startOnTick` or `endOnTick` in the axis options are set to false,
     * then the `alignTicks ` will be disabled for the axis.
     *
     * Disabled for logarithmic axes.
     *
     * @sample {highcharts} highcharts/chart/alignticks-true/
     *         True by default
     * @sample {highcharts} highcharts/chart/alignticks-false/
     *         False
     * @sample {highstock} stock/chart/alignticks-true/
     *         True by default
     * @sample {highstock} stock/chart/alignticks-false/
     *         False
     *
     * @type      {boolean}
     * @default   true
     * @product   highcharts highstock gantt
     * @apioption chart.alignTicks
     */

    /**
     * When using multiple axes, align the thresholds. When this is true, other
     * ticks will also be aligned.
     *
     * Note that for line series and some other series types, the `threshold`
     * option is set to `null` by default. This will in turn cause their y-axis
     * to not have a threshold. In order to avoid that, set the series
     * `threshold` to 0 or another number.
     *
     * If `startOnTick` or `endOnTick` in the axis options are set to false, or
     * if the axis is logarithmic, the threshold will not be aligned.
     *
     * @sample {highcharts} highcharts/chart/alignthresholds/ Set to true
     *
     * @since 10.0.0
     * @product   highcharts highstock gantt
     * @apioption chart.alignThresholds
     */
    alignThresholds: false,

    /**
     * Set the overall animation for all chart updating. Animation can be
     * disabled throughout the chart by setting it to false here. It can
     * be overridden for each individual API method as a function parameter.
     * The only animation not affected by this option is the initial series
     * animation, see [plotOptions.series.animation](
     * #plotOptions.series.animation).
     *
     * The animation can either be set as a boolean or a configuration
     * object. If `true`, it will use the 'swing' jQuery easing and a
     * duration of 500 ms. If used as a configuration object, the following
     * properties are supported:
     *
     * - `defer`: The animation delay time in milliseconds.
     *
     * - `duration`: The duration of the animation in milliseconds.
     *
     * - `easing`: A string reference to an easing function set on the
     *   `Math` object. See
     *   [the easing demo](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-animation-easing/).
     *
     * When zooming on a series with less than 100 points, the chart redraw
     * will be done with animation, but in case of more data points, it is
     * necessary to set this option to ensure animation on zoom.
     *
     * @sample {highcharts} highcharts/chart/animation-none/
     *         Updating with no animation
     * @sample {highcharts} highcharts/chart/animation-duration/
     *         With a longer duration
     * @sample {highcharts} highcharts/chart/animation-easing/
     *         With a jQuery UI easing
     * @sample {highmaps} maps/chart/animation-none/
     *         Updating with no animation
     * @sample {highmaps} maps/chart/animation-duration/
     *         With a longer duration
     *
     * @type      {boolean|Partial<Highcharts.AnimationOptionsObject>}
     * @default   true
     * @apioption chart.animation
     */

    /**
     * A CSS class name to apply to the charts container `div`, allowing
     * unique CSS styling for each chart.
     *
     * @type      {string}
     * @apioption chart.className
     */

    /**
     * Event listeners for the chart.
     *
     * @apioption chart.events
     */

    /**
     * Fires when a series is added to the chart after load time, using the
     * `addSeries` method. One parameter, `event`, is passed to the
     * function, containing common event information. Through
     * `event.options` you can access the series options that were passed to
     * the `addSeries` method. Returning false prevents the series from
     * being added.
     *
     * @sample {highcharts} highcharts/chart/events-addseries/
     *         Alert on add series
     * @sample {highstock} stock/chart/events-addseries/
     *         Alert on add series
     *
     * @type      {Highcharts.ChartAddSeriesCallbackFunction}
     * @since     1.2.0
     * @context   Highcharts.Chart
     * @apioption chart.events.addSeries
     */

    /**
     * Fires when clicking on the plot background. One parameter, `event`,
     * is passed to the function, containing common event information.
     *
     * Information on the clicked spot can be found through `event.xAxis`
     * and `event.yAxis`, which are arrays containing the axes of each
     * dimension and each axis' value at the clicked spot. The primary axes
     * are `event.xAxis[0]` and `event.yAxis[0]`. Remember the unit of a
     * datetime axis is milliseconds since 1970-01-01 00:00:00.
     *
     * ```js
     * click: function(e) {
     *     console.log(
     *         Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', e.xAxis[0].value),
     *         e.yAxis[0].value
     *     )
     * }
     * ```
     *
     * @sample {highcharts} highcharts/chart/events-click/
     *         Alert coordinates on click
     * @sample {highcharts} highcharts/chart/events-container/
     *         Alternatively, attach event to container
     * @sample {highstock} stock/chart/events-click/
     *         Alert coordinates on click
     * @sample {highstock} highcharts/chart/events-container/
     *         Alternatively, attach event to container
     * @sample {highmaps} maps/chart/events-click/
     *         Record coordinates on click
     * @sample {highmaps} highcharts/chart/events-container/
     *         Alternatively, attach event to container
     *
     * @type      {Highcharts.ChartClickCallbackFunction}
     * @since     1.2.0
     * @context   Highcharts.Chart
     * @apioption chart.events.click
     */


    /**
     * Fires when the chart is finished loading. Since v4.2.2, it also waits
     * for images to be loaded, for example from point markers. One
     * parameter, `event`, is passed to the function, containing common
     * event information.
     *
     * There is also a second parameter to the chart constructor where a
     * callback function can be passed to be executed on chart.load.
     *
     * @sample {highcharts} highcharts/chart/events-load/
     *         Alert on chart load
     * @sample {highcharts} highcharts/chart/events-render/
     *         Load vs Redraw vs Render
     * @sample {highstock} stock/chart/events-load/
     *         Alert on chart load
     * @sample {highmaps} maps/chart/events-load/
     *         Add series on chart load
     *
     * @type      {Highcharts.ChartLoadCallbackFunction}
     * @context   Highcharts.Chart
     * @apioption chart.events.load
     */

    /**
     * Fires when the chart is redrawn, either after a call to
     * `chart.redraw()` or after an axis, series or point is modified with
     * the `redraw` option set to `true`. One parameter, `event`, is passed
     * to the function, containing common event information.
     *
     * @sample {highcharts} highcharts/chart/events-redraw/
     *         Alert on chart redraw
     * @sample {highcharts} highcharts/chart/events-render/
     *         Load vs Redraw vs Render
     * @sample {highstock} stock/chart/events-redraw/
     *         Alert on chart redraw when adding a series or moving the
     *         zoomed range
     * @sample {highmaps} maps/chart/events-redraw/
     *         Set subtitle on chart redraw
     *
     * @type      {Highcharts.ChartRedrawCallbackFunction}
     * @since     1.2.0
     * @context   Highcharts.Chart
     * @apioption chart.events.redraw
     */

    /**
     * Fires after initial load of the chart (directly after the `load`
     * event), and after each redraw (directly after the `redraw` event).
     *
     * @sample {highcharts} highcharts/chart/events-render/
     *         Load vs Redraw vs Render
     *
     * @type      {Highcharts.ChartRenderCallbackFunction}
     * @since     5.0.7
     * @context   Highcharts.Chart
     * @apioption chart.events.render
     */

    /**
     * Fires when an area of the chart has been selected. Selection is
     * enabled by setting the chart's zoomType. One parameter, `event`, is
     * passed to the function, containing common event information. The
     * default action for the selection event is to zoom the chart to the
     * selected area. It can be prevented by calling
     * `event.preventDefault()` or return false.
     *
     * Information on the selected area can be found through `event.xAxis`
     * and `event.yAxis`, which are arrays containing the axes of each
     * dimension and each axis' min and max values. The primary axes are
     * `event.xAxis[0]` and `event.yAxis[0]`. Remember the unit of a
     * datetime axis is milliseconds since 1970-01-01 00:00:00.
     *
     * ```js
     * selection: function(event) {
     *     // log the min and max of the primary, datetime x-axis
     *     console.log(
     *         Highcharts.dateFormat(
     *             '%Y-%m-%d %H:%M:%S',
     *             event.xAxis[0].min
     *         ),
     *         Highcharts.dateFormat(
     *             '%Y-%m-%d %H:%M:%S',
     *             event.xAxis[0].max
     *         )
     *     );
     *     // log the min and max of the y axis
     *     console.log(event.yAxis[0].min, event.yAxis[0].max);
     * }
     * ```
     *
     * @sample {highcharts} highcharts/chart/events-selection/
     *         Report on selection and reset
     * @sample {highcharts} highcharts/chart/events-selection-points/
     *         Select a range of points through a drag selection
     * @sample {highstock} stock/chart/events-selection/
     *         Report on selection and reset
     * @sample {highstock} highcharts/chart/events-selection-points/
     *         Select a range of points through a drag selection
     *         (Highcharts)
     *
     * @type      {Highcharts.ChartSelectionCallbackFunction}
     * @apioption chart.events.selection
     */

    /**
     * The margin between the outer edge of the chart and the plot area.
     * The numbers in the array designate top, right, bottom and left
     * respectively. Use the options `marginTop`, `marginRight`,
     * `marginBottom` and `marginLeft` for shorthand setting of one option.
     *
     * By default there is no margin. The actual space is dynamically
     * calculated from the offset of axis labels, axis title, title,
     * subtitle and legend in addition to the `spacingTop`, `spacingRight`,
     * `spacingBottom` and `spacingLeft` options.
     *
     * @sample {highcharts} highcharts/chart/margins-zero/
     *         Zero margins
     * @sample {highstock} stock/chart/margin-zero/
     *         Zero margins
     *
     * @type      {number|Array<number>}
     * @apioption chart.margin
     */

    /**
     * The margin between the bottom outer edge of the chart and the plot
     * area. Use this to set a fixed pixel value for the margin as opposed
     * to the default dynamic margin. See also `spacingBottom`.
     *
     * @sample {highcharts} highcharts/chart/marginbottom/
     *         100px bottom margin
     * @sample {highstock} stock/chart/marginbottom/
     *         100px bottom margin
     * @sample {highmaps} maps/chart/margin/
     *         100px margins
     *
     * @type      {number}
     * @since     2.0
     * @apioption chart.marginBottom
     */

    /**
     * The margin between the left outer edge of the chart and the plot
     * area. Use this to set a fixed pixel value for the margin as opposed
     * to the default dynamic margin. See also `spacingLeft`.
     *
     * @sample {highcharts} highcharts/chart/marginleft/
     *         150px left margin
     * @sample {highstock} stock/chart/marginleft/
     *         150px left margin
     * @sample {highmaps} maps/chart/margin/
     *         100px margins
     *
     * @type      {number}
     * @since     2.0
     * @apioption chart.marginLeft
     */

    /**
     * The margin between the right outer edge of the chart and the plot
     * area. Use this to set a fixed pixel value for the margin as opposed
     * to the default dynamic margin. See also `spacingRight`.
     *
     * @sample {highcharts} highcharts/chart/marginright/
     *         100px right margin
     * @sample {highstock} stock/chart/marginright/
     *         100px right margin
     * @sample {highmaps} maps/chart/margin/
     *         100px margins
     *
     * @type      {number}
     * @since     2.0
     * @apioption chart.marginRight
     */

    /**
     * The margin between the top outer edge of the chart and the plot area.
     * Use this to set a fixed pixel value for the margin as opposed to
     * the default dynamic margin. See also `spacingTop`.
     *
     * @sample {highcharts} highcharts/chart/margintop/ 100px top margin
     * @sample {highstock} stock/chart/margintop/
     *         100px top margin
     * @sample {highmaps} maps/chart/margin/
     *         100px margins
     *
     * @type      {number}
     * @since     2.0
     * @apioption chart.marginTop
     */

    /**
     * Callback function to override the default function that formats all
     * the numbers in the chart. Returns a string with the formatted number.
     *
     * @sample highcharts/members/highcharts-numberformat
     *      Arabic digits in Highcharts
     * @type {Highcharts.NumberFormatterCallbackFunction}
     * @since 8.0.0
     * @apioption chart.numberFormatter
     */

    /**
     * When a chart with an x and a y-axis is rendered, we first pre-render the
     * labels of both in order to measure them. Then, if either of the axis
     * labels take up so much space that it significantly affects the length of
     * the other axis, we repeat the process.
     *
     * By default we stop at two axis layout runs, but it may be that the second
     * run also alter the space required by either axis, for example if it
     * causes the labels to rotate. In this situation, a subsequent redraw of
     * the chart may cause the tick and label placement to change for apparently
     * no reason.
     *
     * Use the `axisLayoutRuns` option to set the maximum allowed number of
     * repetitions. But keep in mind that the default value of 2 is set because
     * every run costs performance time.
     *
     * **Note:** Changing that option to higher than the default might decrease
     * performance significantly, especially with bigger sets of data.
     *
     * @type      {number}
     * @default   2
     * @since     11.3.0
     * @apioption chart.axisLayoutRuns
     */

    /**
     * Allows setting a key to switch between zooming and panning. Can be
     * one of `alt`, `ctrl`, `meta` (the command key on Mac and Windows
     * key on Windows) or `shift`. The keys are mapped directly to the key
     * properties of the click event argument (`event.altKey`,
     * `event.ctrlKey`, `event.metaKey` and `event.shiftKey`).
     *
     * @type       {string}
     * @since      4.0.3
     * @product    highcharts gantt
     * @validvalue ["alt", "ctrl", "meta", "shift"]
     * @apioption  chart.panKey
     */

    /**
     * Allow panning in a chart. Best used with [panKey](#chart.panKey)
     * to combine zooming and panning.
     *
     * On touch devices, when the [tooltip.followTouchMove](
     * #tooltip.followTouchMove) option is `true` (default), panning
     * requires two fingers. To allow panning with one finger, set
     * `followTouchMove` to `false`.
     *
     * @sample  {highcharts} highcharts/chart/pankey/ Zooming and panning
     * @sample  {highstock} stock/chart/panning/ Zooming and xy panning
     */
    panning: {
        /**
         * Enable or disable chart panning.
         *
         * @type      {boolean}
         * @default   {highcharts} false
         * @default   {highstock|highmaps} true
         */
        enabled: false,

        /**
         * Decides in what dimensions the user can pan the chart. Can be
         * one of `x`, `y`, or `xy`.
         *
         * During panning, all axes will behave as if
         * [`startOnTick`](#yAxis.startOnTick) and
         * [`endOnTick`](#yAxis.endOnTick) were set to `false`. After the
         * panning action is finished, the axes will adjust to their actual
         * settings.
         *
         * **Note:** For non-cartesian series, the only supported panning type
         * is `xy`, as zooming in a single direction is not applicable due to
         * the radial nature of the coordinate system.
         *
         * @sample {highcharts} highcharts/chart/panning-type
         *         Zooming and xy panning
         *
         * @declare    Highcharts.OptionsChartPanningTypeValue
         * @type       {string}
         * @validvalue ["x", "y", "xy"]
         * @product    highcharts highstock gantt
         */
        type: 'x'
    },

    /**
     * Equivalent to [zoomType](#chart.zoomType), but for multitouch
     * gestures only. By default, the `pinchType` is the same as the
     * `zoomType` setting. However, pinching can be enabled separately in
     * some cases, for example in stock charts where a mouse drag pans the
     * chart, while pinching is enabled. When [tooltip.followTouchMove](
     * #tooltip.followTouchMove) is true, pinchType only applies to
     * two-finger touches.
     *
     * @type       {string}
     * @default    {highcharts} undefined
     * @default    {highstock} undefined
     * @since      3.0
     * @product    highcharts highstock gantt
     * @deprecated
     * @validvalue ["x", "y", "xy"]
     * @apioption  chart.pinchType
     */


    /**
     * Whether to apply styled mode. When in styled mode, no presentational
     * attributes or CSS are applied to the chart SVG. Instead, CSS rules
     * are required to style the chart. The default style sheet is
     * available from `https://code.highcharts.com/css/highcharts.css`.
     *
     * [Read more in the docs](https://www.highcharts.com/docs/chart-design-and-style/style-by-css)
     * on what classes and variables are available.
     *
     * @sample highcharts/css/colors
     *         Color theming with CSS
     * @sample highcharts/css/prefers-color-scheme
     *         Dynamic theme based on system settings
     * @type       {boolean}
     * @default    false
     * @since      7.0
     * @apioption  chart.styledMode
     */
    styledMode: false,

    /**
     * The corner radius of the outer chart border.
     *
     * @sample {highcharts} highcharts/chart/borderradius/
     *         20px radius
     * @sample {highstock} stock/chart/border/
     *         10px radius
     * @sample {highmaps} maps/chart/border/
     *         Border options
     *
     */
    borderRadius: 0,

    /**
     * In styled mode, this sets how many colors the class names
     * should rotate between. With ten colors, series (or points) are
     * given class names like `highcharts-color-0`, `highcharts-color-1`
     * [...] `highcharts-color-9`. The equivalent in non-styled mode
     * is to set colors using the [colors](#colors) setting.
     *
     * @since      5.0.0
     */
    colorCount: 10,

    /**
     * By default, (because of memory and performance reasons) the chart does
     * not copy the data but keeps it as a reference. In some cases, this might
     * result in mutating the original data source. In order to prevent that,
     * set that property to false. Please note that changing that might decrease
     * performance, especially with bigger sets of data.
     *
     * @type       {boolean}
     * @since 10.1.0
     */
    allowMutatingData: true,

    /**
     * If true, the axes will scale to the remaining visible series once
     * one series is hidden. If false, hiding and showing a series will
     * not affect the axes or the other series. For stacks, once one series
     * within the stack is hidden, the rest of the stack will close in
     * around it even if the axis is not affected.
     *
     * @sample {highcharts} highcharts/chart/ignorehiddenseries-true/
     *         True by default
     * @sample {highcharts} highcharts/chart/ignorehiddenseries-false/
     *         False
     * @sample {highcharts} highcharts/chart/ignorehiddenseries-true-stacked/
     *         True with stack
     * @sample {highstock} stock/chart/ignorehiddenseries-true/
     *         True by default
     * @sample {highstock} stock/chart/ignorehiddenseries-false/
     *         False
     *
     * @since   1.2.0
     * @product highcharts highstock gantt
     */
    ignoreHiddenSeries: true,


    /**
     * Whether to invert the axes so that the x axis is vertical and y axis
     * is horizontal. When `true`, the x axis is [reversed](#xAxis.reversed)
     * by default.
     *
     * @productdesc {highcharts}
     * If a bar series is present in the chart, it will be inverted
     * automatically. Inverting the chart doesn't have an effect if there
     * are no cartesian series in the chart.
     *
     * @sample {highcharts} highcharts/chart/inverted/
     *         Inverted line
     * @sample {highstock} stock/navigator/inverted/
     *         Inverted stock chart
     *
     * @type      {boolean}
     * @default   false
     * @product   highcharts highstock gantt
     * @apioption chart.inverted
     */

    /**
     * The distance between the outer edge of the chart and the content,
     * like title or legend, or axis title and labels if present. The
     * numbers in the array designate top, right, bottom and left
     * respectively. Use the options spacingTop, spacingRight, spacingBottom
     * and spacingLeft options for shorthand setting of one option.
     *
     * @type    {Array<number>}
     * @see     [chart.margin](#chart.margin)
     * @default [10, 10, 15, 10]
     * @since   3.0.6
     */
    spacing: [10, 10, 15, 10],

    /**
     * The button that appears after a selection zoom, allowing the user
     * to reset zoom. This option is deprecated in favor of
     * [zooming](#chart.zooming).
     *
     * @since      2.2
     * @deprecated 10.2.1
     */
    resetZoomButton: {

        /**
         * What frame the button placement should be related to. Can be
         * either `plotBox` or `spacingBox`.
         *
         * @sample {highcharts} highcharts/chart/resetzoombutton-relativeto/
         *         Relative to the chart
         * @sample {highstock} highcharts/chart/resetzoombutton-relativeto/
         *         Relative to the chart
         *
         * @type      {Highcharts.ButtonRelativeToValue}
         * @apioption chart.resetZoomButton.relativeTo
         */

        /**
         * A collection of attributes for the button. The object takes SVG
         * attributes like `fill`, `stroke`, `stroke-width` or `r`, the
         * border radius. The theme also supports `style`, a collection of
         * CSS properties for the text. Equivalent attributes for the hover
         * state are given in `theme.states.hover`.
         *
         * @sample {highcharts} highcharts/chart/resetzoombutton-theme/
         *         Theming the button
         * @sample {highstock} highcharts/chart/resetzoombutton-theme/
         *         Theming the button
         *
         * @type {Highcharts.SVGAttributes}
         */
        theme: {
            /**
             * The z-index of the button.
             *
             * @type {number}
             * @apioption chart.resetZoomButton.theme.zIndex
             */
        },

        /**
         * The position of the button.
         *
         * @sample {highcharts} highcharts/chart/resetzoombutton-position/
         *         Above the plot area
         * @sample {highstock} highcharts/chart/resetzoombutton-position/
         *         Above the plot area
         * @sample {highmaps} highcharts/chart/resetzoombutton-position/
         *         Above the plot area
         *
         * @type {Highcharts.AlignObject}
         */
        position: {
            /**
             * The horizontal alignment of the button.
             *
             * @type {number}
             * @apioption chart.resetZoomButton.position.align
             */

            /**
             * The horizontal offset of the button.
             *
             * @type {number}
             * @apioption chart.resetZoomButton.position.x
             */

            /**
             * The vertical alignment of the button.
             *
             * @type      {Highcharts.VerticalAlignValue}
             * @apioption chart.resetZoomButton.position.verticalAlign
             */

            /**
             * The vertical offset of the button.
             *
             * @type {number}
             * @apioption chart.resetZoomButton.position.y
             */
        }
    },

    /**
     * The pixel width of the plot area border.
     *
     * @sample {highcharts} highcharts/chart/plotborderwidth/
     *         1px border
     * @sample {highstock} stock/chart/plotborder/
     *         2px border
     * @sample {highmaps} maps/chart/plotborder/
     *         Plot border options
     *
     * @type      {number}
     * @default   0
     * @apioption chart.plotBorderWidth
     */

    /**
     * Whether to apply a drop shadow to the plot area. Requires that
     * plotBackgroundColor be set. The shadow can be an object configuration
     * containing `color`, `offsetX`, `offsetY`, `opacity` and `width`.
     *
     * @sample {highcharts} highcharts/chart/plotshadow/
     *         Plot shadow
     * @sample {highstock} stock/chart/plotshadow/
     *         Plot shadow
     * @sample {highmaps} maps/chart/plotborder/
     *         Plot border options
     *
     * @type      {boolean|Highcharts.ShadowOptionsObject}
     * @default   false
     * @apioption chart.plotShadow
     */

    /**
     * When true, cartesian charts like line, spline, area and column are
     * transformed into the polar coordinate system. This produces _polar
     * charts_, also known as _radar charts_.
     *
     * @sample {highcharts} highcharts/demo/polar/
     *         Polar chart
     * @sample {highcharts} highcharts/demo/polar-wind-rose/
     *         Wind rose, stacked polar column chart
     * @sample {highcharts} highcharts/demo/polar-spider/
     *         Spider web chart
     * @sample {highcharts} highcharts/parallel-coordinates/polar/
     *         Star plot, multivariate data in a polar chart
     *
     * @type      {boolean}
     * @default   false
     * @since     2.3.0
     * @product   highcharts
     * @requires  highcharts-more
     * @apioption chart.polar
     */

    /**
     * Whether to reflow the chart to fit the width of the container div
     * on resizing the window.
     *
     * @sample {highcharts} highcharts/chart/reflow-true/
     *         True by default
     * @sample {highcharts} highcharts/chart/reflow-false/
     *         False
     * @sample {highstock} stock/chart/reflow-true/
     *         True by default
     * @sample {highstock} stock/chart/reflow-false/
     *         False
     * @sample {highmaps} maps/chart/reflow-true/
     *         True by default
     * @sample {highmaps} maps/chart/reflow-false/
     *         False
     *
     * @since     2.1
     */
    reflow: true,

    /**
     * The HTML element where the chart will be rendered. If it is a string,
     * the element by that id is used. The HTML element can also be passed
     * by direct reference, or as the first argument of the chart
     * constructor, in which case the option is not needed.
     *
     * @sample {highcharts} highcharts/chart/reflow-true/
     *         String
     * @sample {highcharts} highcharts/chart/renderto-object/
     *         Object reference
     * @sample {highstock} stock/chart/renderto-string/
     *         String
     * @sample {highstock} stock/chart/renderto-object/
     *         Object reference
     *
     * @type      {string|Highcharts.HTMLDOMElement}
     * @apioption chart.renderTo
     */

    /**
     * The background color of the marker square when selecting (zooming
     * in on) an area of the chart.
     *
     * @see In styled mode, the selection marker fill is set with the
     *      `.highcharts-selection-marker` class.
     *
     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @default   rgba(51,92,173,0.25)
     * @since     2.1.7
     * @apioption chart.selectionMarkerFill
     */

    /**
     * Whether to apply a drop shadow to the global series group. This causes
     * all the series to have the same shadow. Contrary to the `series.shadow`
     * option, this prevents items from casting shadows on each other, like for
     * others series in a stack. The shadow can be an object configuration
     * containing `color`, `offsetX`, `offsetY`, `opacity` and `width`.
     *
     * @sample highcharts/chart/seriesgroupshadow/ Shadow
     *
     * @type      {boolean|Highcharts.ShadowOptionsObject}
     * @default   false
     * @apioption chart.shadow
     */

    /**
     * Whether to apply a drop shadow to the outer chart area. Requires
     * that backgroundColor be set. The shadow can be an object
     * configuration containing `color`, `offsetX`, `offsetY`, `opacity` and
     * `width`.
     *
     * @sample {highcharts} highcharts/chart/shadow/
     *         Shadow
     * @sample {highstock} stock/chart/shadow/
     *         Shadow
     * @sample {highmaps} maps/chart/border/
     *         Chart border and shadow
     *
     * @type      {boolean|Highcharts.ShadowOptionsObject}
     * @default   false
     * @apioption chart.shadow
     */

    /**
     * Whether to show the axes initially. This only applies to empty charts
     * where series are added dynamically, as axes are automatically added
     * to cartesian series.
     *
     * @sample {highcharts} highcharts/chart/showaxes-false/
     *         False by default
     * @sample {highcharts} highcharts/chart/showaxes-true/
     *         True
     *
     * @type      {boolean}
     * @since     1.2.5
     * @product   highcharts gantt
     * @apioption chart.showAxes
     */

    /**
     * The space between the bottom edge of the chart and the content (plot
     * area, axis title and labels, title, subtitle or legend in top
     * position).
     *
     * @sample {highcharts} highcharts/chart/spacingbottom/
     *         Spacing bottom set to 100
     * @sample {highstock} stock/chart/spacingbottom/
     *         Spacing bottom set to 100
     * @sample {highmaps} maps/chart/spacing/
     *         Spacing 100 all around
     *
     * @type      {number}
     * @default   15
     * @since     2.1
     * @apioption chart.spacingBottom
     */

    /**
     * The space between the left edge of the chart and the content (plot
     * area, axis title and labels, title, subtitle or legend in top
     * position).
     *
     * @sample {highcharts} highcharts/chart/spacingleft/
     *         Spacing left set to 100
     * @sample {highstock} stock/chart/spacingleft/
     *         Spacing left set to 100
     * @sample {highmaps} maps/chart/spacing/
     *         Spacing 100 all around
     *
     * @type      {number}
     * @default   10
     * @since     2.1
     * @apioption chart.spacingLeft
     */

    /**
     * The space between the right edge of the chart and the content (plot
     * area, axis title and labels, title, subtitle or legend in top
     * position).
     *
     * @sample {highcharts} highcharts/chart/spacingright-100/
     *         Spacing set to 100
     * @sample {highcharts} highcharts/chart/spacingright-legend/
     *         Legend in right position with default spacing
     * @sample {highstock} stock/chart/spacingright/
     *         Spacing set to 100
     * @sample {highmaps} maps/chart/spacing/
     *         Spacing 100 all around
     *
     * @type      {number}
     * @default   10
     * @since     2.1
     * @apioption chart.spacingRight
     */

    /**
     * The space between the top edge of the chart and the content (plot
     * area, axis title and labels, title, subtitle or legend in top
     * position).
     *
     * @sample {highcharts} highcharts/chart/spacingtop-100/
     *         A top spacing of 100
     * @sample {highcharts} highcharts/chart/spacingtop-10/
     *         Floating chart title makes the plot area align to the default
     *         spacingTop of 10.
     * @sample {highstock} stock/chart/spacingtop/
     *         A top spacing of 100
     * @sample {highmaps} maps/chart/spacing/
     *         Spacing 100 all around
     *
     * @type      {number}
     * @default   10
     * @since     2.1
     * @apioption chart.spacingTop
     */

    /**
     * Additional CSS styles to apply inline to the container `div` and the root
     * SVG.
     *
     * According to the CSS syntax documentation, it is recommended to quote
     * font family names that contain white space, digits, or punctuation
     * characters other than hyphens. In such cases, wrap the fontFamily
     * name as follows: `fontFamily: '"Font name"'`.
     *
     * Since v11, the root font size is 1rem by default, and all child element
     * are given a relative `em` font size by default. This allows implementers
     * to control all the chart's font sizes by only setting the root level.
     *
     * @see    In styled mode, general chart styles can be set with the
     *         `.highcharts-root` class.
     * @sample {highcharts} highcharts/chart/style-serif-font/
     *         Using a serif type font
     * @sample {highcharts} highcharts/chart/style-special-font/
     *         Using a font with special character in name
     * @sample {highcharts} highcharts/members/relative-font-size/
     *         Relative font sizes
     * @sample {highcharts} highcharts/css/em/
     *         Styled mode with relative font sizes
     * @sample {highstock} stock/chart/style/
     *         Using a serif type font
     * @sample {highmaps} maps/chart/style-serif-font/
     *         Using a serif type font
     *
     * @type      {Highcharts.CSSObject}
     * @default   {"fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif", "fontSize":"1rem"}
     * @apioption chart.style
     */

    /**
     * The default series type for the chart. Can be any of the chart types
     * listed under [plotOptions](#plotOptions) and [series](#series) or can
     * be a series provided by an additional module.
     *
     * In TypeScript this option has no effect in sense of typing and
     * instead the `type` option must always be set in the series.
     *
     * @sample {highcharts} highcharts/chart/type-bar/
     *         Bar
     * @sample {highstock} stock/chart/type/
     *         Areaspline
     * @sample {highmaps} maps/chart/type-mapline/
     *         Mapline
     *
     * @type       {string}
     * @default    {highcharts} line
     * @default    {highstock} line
     * @default    {highmaps} map
     * @since      2.1.0
     * @apioption  chart.type
     */
    type: 'line',

    /**
     * Decides in what dimensions the user can zoom by dragging the mouse.
     * Can be one of `x`, `y` or `xy`.
     *
     * @see [panKey](#chart.panKey)
     *
     * @sample {highcharts} highcharts/chart/zoomtype-none/
     *         None by default
     * @sample {highcharts} highcharts/chart/zoomtype-x/
     *         X
     * @sample {highcharts} highcharts/chart/zoomtype-y/
     *         Y
     * @sample {highcharts} highcharts/chart/zoomtype-xy/
     *         Xy
     * @sample {highcharts} highcharts/chart/zoomtype-polar/
     *         Zoom on polar chart
     * @sample {highstock} stock/demo/basic-line/
     *         None by default
     * @sample {highstock} stock/chart/zoomtype-x/
     *         X
     * @sample {highstock} stock/chart/zoomtype-y/
     *         Y
     * @sample {highstock} stock/chart/zoomtype-xy/
     *         Xy
     * @sample {highmaps} maps/chart/zoomtype-xy/
     *         Map with selection zoom
     *
     * @type       {string}
     * @validvalue ["x", "y", "xy"]
     * @deprecated
     * @apioption  chart.zoomType
     */

    /**
     * Enables zooming by a single touch, in combination with
     * [chart.zoomType](#chart.zoomType). When enabled, two-finger pinch
     * will still work as set up by [chart.pinchType](#chart.pinchType).
     * However, `zoomBySingleTouch` will interfere with touch-dragging the
     * chart to read the tooltip. And especially when vertical zooming is
     * enabled, it will make it hard to scroll vertically on the page.
     * @since      9.0.0
     * @sample     highcharts/chart/zoombysingletouch
     *             Zoom by single touch enabled, with buttons to toggle
     * @product    highcharts highstock gantt
     * @deprecated
     */

    /**
     * Chart zooming options.
     * @since 10.2.1
     *
     * @sample     highcharts/plotoptions/sankey-inverted
     *             Zooming in sankey series
     * @sample     highcharts/series-treegraph/link-types
     *             Zooming in treegraph series
     */
    zooming: {
        /**
         * Equivalent to [type](#chart.zooming.type), but for multitouch
         * gestures only. By default, the `pinchType` is the same as the
         * `type` setting. However, pinching can be enabled separately in
         * some cases, for example in stock charts where a mouse drag pans the
         * chart, while pinching is enabled. When [tooltip.followTouchMove](
         * #tooltip.followTouchMove) is true, pinchType only applies to
         * two-finger touches.
         *
         * @type       {string}
         * @default    {highcharts} undefined
         * @default    {highstock} x
         * @product    highcharts highstock gantt
         * @validvalue ["x", "y", "xy"]
         * @apioption  chart.zooming.pinchType
         */

        /**
         * Decides in what dimensions the user can zoom by dragging the mouse.
         * Can be one of `x`, `y` or `xy`.
         *
         * **Note:** For non-cartesian series, the only supported zooming type
         * is `xy`, as zooming in a single direction is not applicable due to
         * the radial nature of the coordinate system.
         *
         * @declare    Highcharts.OptionsChartZoomingTypeValue
         * @type       {string}
         * @default    {highcharts} undefined
         * @product    highcharts highstock gantt
         * @validvalue ["x", "y", "xy"]
         * @apioption  chart.zooming.type
         */

        /**
         * Set a key to hold when dragging to zoom the chart. This is useful to
         * avoid zooming while moving points. Should be set different than
         * [chart.panKey](#chart.panKey).
         *
         * @type       {string}
         * @default    {highcharts} undefined
         * @validvalue ["alt", "ctrl", "meta", "shift"]
         * @requires   modules/draggable-points
         * @apioption  chart.zooming.key
         */

        /**
         * Enables zooming by a single touch, in combination with
         * [chart.zooming.type](#chart.zooming.type). When enabled, two-finger
         * pinch will still work as set up by [chart.zooming.pinchType]
         * (#chart.zooming.pinchType). However, `singleTouch` will interfere
         * with touch-dragging the chart to read the tooltip. And especially
         * when vertical zooming is enabled, it will make it hard to scroll
         * vertically on the page.
         *
         * @sample  highcharts/chart/zoombysingletouch
         *          Zoom by single touch enabled, with buttons to toggle
         *
         * @product highcharts highstock gantt
         */
        singleTouch: false,

        /**
         * The button that appears after a selection zoom, allowing the user
         * to reset zoom.
         */
        resetButton: {

            /**
             * What frame the button placement should be related to. Can be
             * either `plotBox` or `spacingBox`.
             *
             * @sample {highcharts} highcharts/chart/resetzoombutton-relativeto/
             *         Relative to the chart
             * @sample {highstock} highcharts/chart/resetzoombutton-relativeto/
             *         Relative to the chart
             *
             * @type      {Highcharts.ButtonRelativeToValue}
             * @default   plot
             * @apioption chart.zooming.resetButton.relativeTo
             */

            /**
             * A collection of attributes for the button. The object takes SVG
             * attributes like `fill`, `stroke`, `stroke-width` or `r`, the
             * border radius. The theme also supports `style`, a collection of
             * CSS properties for the text. Equivalent attributes for the hover
             * state are given in `theme.states.hover`.
             *
             * @sample {highcharts} highcharts/chart/resetzoombutton-theme/
             *         Theming the button
             * @sample {highstock} highcharts/chart/resetzoombutton-theme/
             *         Theming the button
             *
             * @type  {Highcharts.SVGAttributes}
             * @since 10.2.1
             */
            theme: {
                /** @internal */
                zIndex: 6
            },

            /**
             * The position of the button.
             *
             * Note: Adjusting position values might cause overlap with chart
             * elements. Ensure coordinates do not obstruct other components or
             * data visibility.
             *
             * @sample {highcharts} highcharts/chart/resetzoombutton-position/
             *         Above the plot area
             * @sample {highstock} highcharts/chart/resetzoombutton-position/
             *         Above the plot area
             * @sample {highmaps} highcharts/chart/resetzoombutton-position/
             *         Above the plot area
             *
             * @type  {Highcharts.AlignObject}
             * @since 10.2.1
             */
            position: {

                /**
                 * The horizontal alignment of the button.
                 */
                align: 'right',

                /**
                 * The horizontal offset of the button.
                 */
                x: -10,

                /**
                 * The vertical alignment of the button.
                 *
                 * @type       {Highcharts.VerticalAlignValue}
                 * @default    top
                 * @apioption  chart.zooming.resetButton.position.verticalAlign
                 */

                /**
                 * The vertical offset of the button.
                 */
                y: 10
            }
        }

    },
    /**
     * An explicit width for the chart. By default (when `null`) the width
     * is calculated from the offset width of the containing element.
     *
     * @sample {highcharts} highcharts/chart/width/
     *         800px wide
     * @sample {highstock} stock/chart/width/
     *         800px wide
     * @sample {highmaps} maps/chart/size/
     *         Chart with explicit size
     *
     * @type {null|number|string}
     */
    width: null,

    /**
     * An explicit height for the chart. If a _number_, the height is
     * given in pixels. If given a _percentage string_ (for example
     * `'56%'`), the height is given as the percentage of the actual chart
     * width. This allows for preserving the aspect ratio across responsive
     * sizes.
     *
     * By default (when `null`) the height is calculated from the offset
     * height of the containing element, or 400 pixels if the containing
     * element's height is 0.
     *
     * @sample {highcharts} highcharts/chart/height/
     *         Forced 200px height
     * @sample {highstock} stock/chart/height/
     *         300px height
     * @sample {highmaps} maps/chart/size/
     *         Chart with explicit size
     * @sample highcharts/chart/height-percent/
     *         Highcharts with percentage height
     * @sample highcharts/chart/height-inherited/
     *         Chart with inherited height
     *
     * @type {null|number|string}
     */
    height: null,

    /**
     * The color of the outer chart border.
     *
     * @see In styled mode, the stroke is set with the
     *      `.highcharts-background` class.
     *
     * @sample {highcharts} highcharts/chart/bordercolor/
     *         Brown border
     * @sample {highstock} stock/chart/border/
     *         Brown border
     * @sample {highmaps} maps/chart/border/
     *         Border options
     *
     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     */
    borderColor: Palette.highlightColor80,

    /**
     * The pixel width of the outer chart border.
     *
     * @see In styled mode, the stroke is set with the
     *      `.highcharts-background` class.
     *
     * @sample {highcharts} highcharts/chart/borderwidth/
     *         5px border
     * @sample {highstock} stock/chart/border/
     *         2px border
     * @sample {highmaps} maps/chart/border/
     *         Border options
     *
     * @type      {number}
     * @default   0
     * @apioption chart.borderWidth
     */

    /**
     * The background color or gradient for the outer chart area.
     *
     * @see In styled mode, the background is set with the
     *      `.highcharts-background` class.
     *
     * @sample {highcharts} highcharts/chart/backgroundcolor-color/
     *         Color
     * @sample {highcharts} highcharts/chart/backgroundcolor-gradient/
     *         Gradient
     * @sample {highstock} stock/chart/backgroundcolor-color/
     *         Color
     * @sample {highstock} stock/chart/backgroundcolor-gradient/
     *         Gradient
     * @sample {highmaps} maps/chart/backgroundcolor-color/
     *         Color
     * @sample {highmaps} maps/chart/backgroundcolor-gradient/
     *         Gradient
     *
     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     */
    backgroundColor: Palette.backgroundColor,

    /**
     * The background color or gradient for the plot area.
     *
     * @see In styled mode, the plot background is set with the
     *      `.highcharts-plot-background` class.
     *
     * @sample {highcharts} highcharts/chart/plotbackgroundcolor-color/
     *         Color
     * @sample {highcharts} highcharts/chart/plotbackgroundcolor-gradient/
     *         Gradient
     * @sample {highstock} stock/chart/plotbackgroundcolor-color/
     *         Color
     * @sample {highstock} stock/chart/plotbackgroundcolor-gradient/
     *         Gradient
     * @sample {highmaps} maps/chart/plotbackgroundcolor-color/
     *         Color
     * @sample {highmaps} maps/chart/plotbackgroundcolor-gradient/
     *         Gradient
     *
     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @apioption chart.plotBackgroundColor
     */

    /**
     * The URL for an image to use as the plot background. To set an image
     * as the background for the entire chart, set a CSS background image
     * to the container element. Note that for the image to be applied to
     * exported charts, its URL needs to be accessible by the export server.
     *
     * @see In styled mode, a plot background image can be set with the
     *      `.highcharts-plot-background` class and a [custom pattern](
     *      https://www.highcharts.com/docs/chart-design-and-style/gradients-shadows-and-patterns).
     *
     * @sample {highcharts} highcharts/chart/plotbackgroundimage/
     *         Skies
     * @sample {highstock} stock/chart/plotbackgroundimage/
     *         Skies
     *
     * @type      {string}
     * @apioption chart.plotBackgroundImage
     */

    /**
     * The color of the inner chart or plot area border.
     *
     * @see In styled mode, a plot border stroke can be set with the
     *      `.highcharts-plot-border` class.
     *
     * @sample {highcharts} highcharts/chart/plotbordercolor/
     *         Blue border
     * @sample {highstock} stock/chart/plotborder/
     *         Blue border
     * @sample {highmaps} maps/chart/plotborder/
     *         Plot border options
     *
     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     */
    plotBorderColor: Palette.neutralColor20

};

/* *
 *
 *  Default Export
 *
 * */

export default ChartDefaults;
