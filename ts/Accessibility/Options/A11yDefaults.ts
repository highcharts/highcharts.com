/* *
 *
 *  (c) 2009-2024 Øystein Moseng
 *
 *  Default options for accessibility.
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

import type A11yOptions from './A11yOptions';

import { Palette } from '../../Core/Color/Palettes.js';

/* *
 *
 *  API Options
 *
 * */

/**
 * Formatter callback for the accessibility announcement.
 *
 * @callback Highcharts.AccessibilityAnnouncementFormatter
 *
 * @param {Array<Highcharts.Series>} updatedSeries
 * Array of all series that received updates. If an announcement is already
 * queued, the series that received updates for that announcement are also
 * included in this array.
 *
 * @param {Highcharts.Series} [addedSeries]
 * This is provided if {@link Highcharts.Chart#addSeries} was called, and there
 * is a new series. In that case, this argument is a reference to the new
 * series.
 *
 * @param {Highcharts.Point} [addedPoint]
 * This is provided if {@link Highcharts.Series#addPoint} was called, and there
 * is a new point. In that case, this argument is a reference to the new point.
 *
 * @return {false|string}
 * The function should return a string with the text to announce to the user.
 * Return empty string to not announce anything. Return `false` to use the
 * default announcement format.
 */

/**
 * @interface Highcharts.PointAccessibilityOptionsObject
 *//**
 * Provide a description of the data point, announced to screen readers.
 * @name Highcharts.PointAccessibilityOptionsObject#description
 * @type {string|undefined}
 * @requires modules/accessibility
 * @since 7.1.0
 *//**
 * Enable or disable exposing the point to assistive technology
 * @name Highcharts.PointAccessibilityOptionsObject#enabled
 * @type {boolean|undefined}
 * @requires modules/accessibility
 * @since 9.0.1
 */

/* *
 * @interface Highcharts.PointOptionsObject in parts/Point.ts
 *//**
 * @name Highcharts.PointOptionsObject#accessibility
 * @type {Highcharts.PointAccessibilityOptionsObject|undefined}
 * @requires modules/accessibility
 * @since 7.1.0
 */

/**
 * @callback Highcharts.ScreenReaderClickCallbackFunction
 *
 * @param {global.MouseEvent} evt
 *        Mouse click event
 *
 * @return {void}
 */

/**
 * Creates a formatted string for the screen reader module.
 *
 * @callback Highcharts.ScreenReaderFormatterCallbackFunction<T>
 *
 * @param {T} context
 *        Context to format
 *
 * @return {string}
 *         Formatted string for the screen reader module.
 */

const Options: DeepPartial<A11yOptions> = {

    /**
     * Options for configuring accessibility for the chart. Requires the
     * [accessibility module](https://code.highcharts.com/modules/accessibility.js)
     * to be loaded. For a description of the module and information
     * on its features, see
     * [Highcharts Accessibility](https://www.highcharts.com/docs/accessibility/accessibility-module).
     *
     * @since        5.0.0
     * @requires     modules/accessibility
     * @optionparent accessibility
     */
    accessibility: {
        /**
         * Enable accessibility functionality for the chart. For more
         * information on how to include these features, and why this is
         * recommended, see [Highcharts Accessibility](https://www.highcharts.com/docs/accessibility/accessibility-module).
         *
         * Highcharts will by default emit a warning to the console if
         * the [accessibility module](https://code.highcharts.com/modules/accessibility.js)
         * is not loaded. Setting this option to `false` will override
         * and silence the warning.
         *
         * Once the module is loaded, setting this option to `false`
         * will disable the module for this chart.
         *
         * @since 5.0.0
         */
        enabled: true,

        /**
         * Accessibility options for the screen reader information sections
         * added before and after the chart.
         *
         * @since 8.0.0
         */
        screenReaderSection: {
            /**
             * Function to run upon clicking the "View as Data Table" link in
             * the screen reader region.
             *
             * By default Highcharts will insert and set focus to a data table
             * representation of the chart.
             *
             * @type      {Highcharts.ScreenReaderClickCallbackFunction}
             * @since 8.0.0
             * @apioption accessibility.screenReaderSection.onViewDataTableClick
             */

            /**
             * Function to run upon clicking the "Play as sound" button in
             * the screen reader region.
             *
             * By default Highcharts will call the `chart.sonify` function.
             *
             * @type      {Highcharts.ScreenReaderClickCallbackFunction}
             * @since 8.0.1
             * @apioption accessibility.screenReaderSection.onPlayAsSoundClick
             */

            /**
             * A formatter function to create the HTML contents of the hidden
             * screen reader information region before the chart. Receives one
             * argument, `chart`, referring to the chart object. Should return a
             * string with the HTML content of the region. By default this
             * returns an automatic description of the chart based on
             * [beforeChartFormat](#accessibility.screenReaderSection.beforeChartFormat).
             *
             * @type      {Highcharts.ScreenReaderFormatterCallbackFunction<Highcharts.Chart>}
             * @since 8.0.0
             * @apioption accessibility.screenReaderSection.beforeChartFormatter
             */

            /**
             * Format for the screen reader information region before the chart.
             * Supported HTML tags are `<h1-6>`, `<p>`, `<div>`, `<a>`, `<ul>`,
             * `<ol>`, `<li>`, and `<button>`. Attributes are not supported,
             * except for id on `<div>`, `<a>`, and `<button>`. Id is required
             * on `<a>` and `<button>` in the format `<tag id="abcd">`. Numbers,
             * lower- and uppercase letters, "-" and "#" are valid characters in
             * IDs.
             *
             * The headingTagName is an auto-detected heading (h1-h6) that
             * corresponds to the heading level below the previous heading in
             * the DOM.
             *
             * Set to empty string to remove the region altogether.
             *
             * @since 8.0.0
             */
            beforeChartFormat:
                '<{headingTagName}>{chartTitle}</{headingTagName}>' +
                '<div>{typeDescription}</div>' +
                '<div>{chartSubtitle}</div>' +
                '<div>{chartLongdesc}</div>' +
                '<div>{playAsSoundButton}</div>' +
                '<div>{viewTableButton}</div>' +
                '<div>{xAxisDescription}</div>' +
                '<div>{yAxisDescription}</div>' +
                '<div>{annotationsTitle}{annotationsList}</div>',

            /**
             * A formatter function to create the HTML contents of the hidden
             * screen reader information region after the chart. Analogous to
             * [beforeChartFormatter](#accessibility.screenReaderSection.beforeChartFormatter).
             *
             * @type      {Highcharts.ScreenReaderFormatterCallbackFunction<Highcharts.Chart>}
             * @since 8.0.0
             * @apioption accessibility.screenReaderSection.afterChartFormatter
             */

            /**
             * Format for the screen reader information region after the chart.
             * Analogous to [beforeChartFormat](#accessibility.screenReaderSection.beforeChartFormat).
             *
             * @since 8.0.0
             */
            afterChartFormat: '{endOfChartMarker}',

            /**
             * Date format to use to describe range of datetime axes.
             *
             * For an overview of the replacement codes, see
             * [dateFormat](/class-reference/Highcharts.Time#dateFormat).
             *
             * @see [point.dateFormat](#accessibility.point.dateFormat)
             *
             * @since 8.0.0
             */
            axisRangeDateFormat: '%Y-%m-%d %H:%M:%S'
        },

        /**
         * Accessibility options global to all data series. Individual series
         * can also have specific [accessibility options](#plotOptions.series.accessibility)
         * set.
         *
         * @since 8.0.0
         */
        series: {
            /**
             * Formatter function to use instead of the default for series
             * descriptions. Receives one argument, `series`, referring to the
             * series to describe. Should return a string with the description
             * of the series for a screen reader user. If `false` is returned,
             * the default formatter will be used for that series.
             *
             * @see [series.descriptionFormat](#accessibility.series.descriptionFormat)
             * @see [series.description](#plotOptions.series.description)
             *
             * @type      {Highcharts.ScreenReaderFormatterCallbackFunction<Highcharts.Series>}
             * @since 8.0.0
             * @apioption accessibility.series.descriptionFormatter
             */

            /**
             * Format to use for describing the data series group to assistive
             * technology - including screen readers.
             *
             * The series context and its subproperties are available under the
             * variable `{series}`, for example `{series.name}` for the series
             * name, and `{series.points.length}` for the number of data points.
             *
             * The chart context and its subproperties are available under the
             * variable `{chart}`, for example `{chart.series.length}` for the
             * number of series in the chart.
             *
             * `{seriesDescription}` refers to the automatic description of the
             * series type and number of points added by Highcharts by default.
             * `{authorDescription}` refers to the description added in
             * [series.description](#plotOptions.series.description) if one is
             * present. `{axisDescription}` refers to the description added if
             * the chart has multiple X or Y axes.
             *
             * Note that if [series.descriptionFormatter](#accessibility.series.descriptionFormatter)
             * is declared it will take precedence, and this option will be
             * overridden.
             *
             * @sample highcharts/accessibility/advanced-accessible
             *  Accessible low-medium-high chart
             *
             * @type      {string}
             * @since 10.1.0
             */
            descriptionFormat:
                '{seriesDescription}{authorDescription}{axisDescription}',

            /**
             * Whether or not to add series descriptions to charts with a single
             * series.
             *
             * @since 8.0.0
             */
            describeSingleSeries: false,

            /**
             * When a series contains more points than this, we no longer expose
             * information about individual points to screen readers.
             * Note that the keyboard navigation remains functional, but points
             * won't have accessible descriptions unless handled separately.
             *
             * Set to `false` to disable.
             *
             * @type  {boolean|number}
             * @since 8.0.0
             */
            pointDescriptionEnabledThreshold: 200
        },

        /**
         * Options for descriptions of individual data points.
         *
         * @since 8.0.0
         */
        point: {
            /**
             * Date format to use for points on datetime axes when describing
             * them to screen reader users.
             *
             * Defaults to the same format as in tooltip.
             *
             * For an overview of the replacement codes, see
             * [dateFormat](/class-reference/Highcharts.Time#dateFormat).
             *
             * @see [dateFormatter](#accessibility.point.dateFormatter)
             *
             * @type      {string}
             * @since 8.0.0
             * @apioption accessibility.point.dateFormat
             */

            /**
             * Formatter function to determine the date/time format used with
             * points on datetime axes when describing them to screen reader
             * users. Receives one argument, `point`, referring to the point
             * to describe. Should return a date format string compatible with
             * [dateFormat](/class-reference/Highcharts.Time#dateFormat).
             *
             * @see [dateFormat](#accessibility.point.dateFormat)
             *
             * @type      {Highcharts.ScreenReaderFormatterCallbackFunction<Highcharts.Point>}
             * @since 8.0.0
             * @apioption accessibility.point.dateFormatter
             */

            /**
             * Prefix to add to the values in the point descriptions. Uses
             * [tooltip.valuePrefix](#tooltip.valuePrefix) if not defined.
             *
             * @type        {string}
             * @since 8.0.0
             * @apioption   accessibility.point.valuePrefix
             */

            /**
             * Suffix to add to the values in the point descriptions. Uses
             * [tooltip.valueSuffix](#tooltip.valueSuffix) if not defined.
             *
             * @type        {string}
             * @since 8.0.0
             * @apioption   accessibility.point.valueSuffix
             */

            /**
             * Decimals to use for the values in the point descriptions. Uses
             * [tooltip.valueDecimals](#tooltip.valueDecimals) if not defined.
             *
             * @type        {number}
             * @since 8.0.0
             * @apioption   accessibility.point.valueDecimals
             */

            /**
             * A [format string](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting)
             * to use instead of the default for point descriptions.
             *
             * The context of the format string is the point instance.
             *
             * As opposed to [accessibility.point.valueDescriptionFormat](#accessibility.point.valueDescriptionFormat),
             * this option replaces the whole description.
             *
             * @type      {string}
             * @since 11.1.0
             * @sample highcharts/demo/advanced-accessible
             *      Description format
             * @apioption accessibility.point.descriptionFormat
             */

            /**
             * Formatter function to use instead of the default for point
             * descriptions.
             *
             * Receives one argument, `point`, referring to the point to
             * describe. Should return a string with the description of the
             * point for a screen reader user. If `false` is returned, the
             * default formatter will be used for that point.
             *
             * Note: Prefer using [accessibility.point.valueDescriptionFormat](#accessibility.point.valueDescriptionFormat)
             * instead if possible, as default functionality such as describing
             * annotations will be preserved.
             *
             * @see [accessibility.point.valueDescriptionFormat](#accessibility.point.valueDescriptionFormat)
             * @see [point.accessibility.description](#series.line.data.accessibility.description)
             *
             * @type      {Highcharts.ScreenReaderFormatterCallbackFunction<Highcharts.Point>}
             * @since 8.0.0
             * @apioption accessibility.point.descriptionFormatter
             */

            /**
             * Format to use for describing the values of data points
             * to assistive technology - including screen readers.
             * The point context is available as `{point}`.
             *
             * Other available context variables include `{index}`, `{value}`, and `{xDescription}`.
             *
             * Additionally, the series name, annotation info, and
             * description added in `point.accessibility.description`
             * is added by default if relevant. To override this, use the
             * [accessibility.point.descriptionFormatter](#accessibility.point.descriptionFormatter)
             * option.
             *
             * @see [point.accessibility.description](#series.line.data.accessibility.description)
             * @see [accessibility.point.descriptionFormatter](#accessibility.point.descriptionFormatter)
             *
             * @type      {string}
             * @since 8.0.1
             */
            valueDescriptionFormat: '{xDescription}{separator}{value}.',

            /**
             * Whether or not to describe points with the value `null` to
             * assistive technology, such as screen readers.
             *
             * @sample {highmaps} maps/demo/all-areas-as-null
             *         Accessible map with null points
             *
             * @type      {boolean}
             * @since 10.1.0
             */
            describeNull: true
        },

        /**
         * Amount of landmarks/regions to create for screen reader users. More
         * landmarks can make navigation with screen readers easier, but can
         * be distracting if there are lots of charts on the page. Three modes
         * are available:
         *  - `all`: Adds regions for all series, legend, information
         *      region.
         *  - `one`: Adds a single landmark per chart.
         *  - `disabled`: No landmarks are added.
         *
         * @since 7.1.0
         * @validvalue ["all", "one", "disabled"]
         */
        landmarkVerbosity: 'all',

        /**
         * Link the chart to an HTML element describing the contents of the
         * chart.
         *
         * It is always recommended to describe charts using visible text, to
         * improve SEO as well as accessibility for users with disabilities.
         * This option lets an HTML element with a description be linked to the
         * chart, so that screen reader users can connect the two.
         *
         * By setting this option to a string, Highcharts runs the string as an
         * HTML selector query on the entire document. If there is only a single
         * match, this element is linked to the chart. The content of the linked
         * element will be included in the chart description for screen reader
         * users.
         *
         * By default, the chart looks for an adjacent sibling element with the
         * `highcharts-description` class.
         *
         * The feature can be disabled by setting the option to an empty string,
         * or overridden by providing the
         * [accessibility.description](#accessibility.description) option.
         * Alternatively, the HTML element to link can be passed in directly as
         * an HTML node.
         *
         * If you need the description to be part of the exported image,
         * consider using the [caption](#caption) feature.
         *
         * If you need the description to be hidden visually, use the
         * [accessibility.description](#accessibility.description) option.
         *
         * @see [caption](#caption)
         * @see [description](#accessibility.description)
         * @see [typeDescription](#accessibility.typeDescription)
         *
         * @sample highcharts/accessibility/accessible-line
         *         Accessible line chart
         *
         * @type  {string|Highcharts.HTMLDOMElement}
         * @since 8.0.0
         */
        linkedDescription: '*[data-highcharts-chart="{index}"] + .highcharts-description', // eslint-disable-line

        /**
         * A hook for adding custom components to the accessibility module.
         * Should be an object mapping component names to instances of classes
         * inheriting from the Highcharts.AccessibilityComponent base class.
         * Remember to add the component to the
         * [keyboardNavigation.order](#accessibility.keyboardNavigation.order)
         * for the keyboard navigation to be usable.
         *
         * @sample highcharts/accessibility/custom-component
         *         Custom accessibility component
         *
         * @type      {*}
         * @since     7.1.0
         * @apioption accessibility.customComponents
         */

        /**
         * Theme to apply to the chart when Windows High Contrast Mode is
         * detected. By default, a high contrast theme matching the high
         * contrast system colors is used.
         *
         * @type      {*}
         * @since     7.1.3
         * @apioption accessibility.highContrastTheme
         */

        /**
         * Controls how [highContrastTheme](#accessibility.highContrastTheme)
         * is applied.
         *
         * The default option is `auto`, which applies the high contrast theme
         * the user's system has a high contrast theme active.
         *
         * @since 11.4.0
         */
        highContrastMode: 'auto',

        /**
         * A text description of the chart.
         *
         * **Note: Prefer using [linkedDescription](#accessibility.linkedDescription)
         * or [caption](#caption.text) instead.**
         *
         * If the Accessibility module is loaded, this option is included by
         * default as a long description of the chart in the hidden screen
         * reader information region.
         *
         * Note: Since Highcharts now supports captions and linked descriptions,
         * it is preferred to define the description using those methods, as a
         * visible caption/description benefits all users. If the
         * `accessibility.description` option is defined, the linked description
         * is ignored, and the caption is hidden from screen reader users.
         *
         * @see [linkedDescription](#accessibility.linkedDescription)
         * @see [caption](#caption)
         * @see [typeDescription](#accessibility.typeDescription)
         *
         * @type      {string}
         * @since     5.0.0
         * @apioption accessibility.description
         */

        /**
         * A text description of the chart type.
         *
         * If the Accessibility module is loaded, this will be included in the
         * description of the chart in the screen reader information region.
         *
         * Highcharts will by default attempt to guess the chart type, but for
         * more complex charts it is recommended to specify this property for
         * clarity.
         *
         * @type      {string}
         * @since     5.0.0
         * @apioption accessibility.typeDescription
         */

        /**
         * Options for keyboard navigation.
         *
         * @declare Highcharts.KeyboardNavigationOptionsObject
         * @since   5.0.0
         */
        keyboardNavigation: {

            /**
             * Enable keyboard navigation for the chart.
             *
             * @since 5.0.0
             */
            enabled: true,

            /**
             * Options for the focus border drawn around elements while
             * navigating through them.
             *
             * @sample highcharts/accessibility/custom-focus
             *         Custom focus ring
             *
             * @declare Highcharts.KeyboardNavigationFocusBorderOptionsObject
             * @since   6.0.3
             */
            focusBorder: {

                /**
                 * Enable/disable focus border for chart.
                 *
                 * @since 6.0.3
                 */
                enabled: true,

                /**
                 * Hide the browser's default focus indicator.
                 *
                 * @since 6.0.4
                 */
                hideBrowserFocusOutline: true,

                /**
                 * Style options for the focus border drawn around elements
                 * while navigating through them. Note that some browsers in
                 * addition draw their own borders for focused elements. These
                 * automatic borders cannot be styled by Highcharts.
                 *
                 * In styled mode, the border is given the
                 * `.highcharts-focus-border` class.
                 *
                 * @type    {Highcharts.CSSObject}
                 * @since   6.0.3
                 */
                style: {
                    /** @internal */
                    color: Palette.highlightColor80,
                    /** @internal */
                    lineWidth: 2,
                    /** @internal */
                    borderRadius: 3
                },

                /**
                 * Focus border margin around the elements.
                 *
                 * @since 6.0.3
                 */
                margin: 2

            },

            /**
             * Order of tab navigation in the chart. Determines which elements
             * are tabbed to first. Available elements are: `series`, `zoom`,
             * `rangeSelector`, `navigator`, `chartMenu`, `legend` and `container`.
             * In addition, any custom components can be added here. Adding
             * `container` first in order will make the keyboard focus stop on
             * the chart container first, requiring the user to tab again to
             * enter the chart.
             *
             * @type  {Array<string>}
             * @since 7.1.0
             */
            order: [
                'series', 'zoom', 'rangeSelector',
                'navigator', 'legend', 'chartMenu',
                'stockTools'
            ],

            /**
             * Whether or not to wrap around when reaching the end of arrow-key
             * navigation for an element in the chart.
             * @since 7.1.0
             */
            wrapAround: true,

            /**
             * Options for the keyboard navigation of data points and series.
             *
             * @declare Highcharts.KeyboardNavigationSeriesNavigationOptionsObject
             * @since 8.0.0
             */
            seriesNavigation: {
                /**
                 * Set the keyboard navigation mode for the chart. Can be
                 * "normal" or "serialize". In normal mode, left/right arrow
                 * keys move between points in a series, while up/down arrow
                 * keys move between series. Up/down navigation acts
                 * intelligently to figure out which series makes sense to move
                 * to from any given point.
                 *
                 * In "serialize" mode, points are instead navigated as a single
                 * list. Left/right behaves as in "normal" mode. Up/down arrow
                 * keys will behave like left/right. This can be useful for
                 * unifying navigation behavior with/without screen readers
                 * enabled.
                 *
                 * @type       {string}
                 * @default    normal
                 * @since 8.0.0
                 * @validvalue ["normal", "serialize"]
                 * @apioption  accessibility.keyboardNavigation.seriesNavigation.mode
                 */

                /**
                 * Skip null points when navigating through points with the
                 * keyboard.
                 *
                 * @since 8.0.0
                 */
                skipNullPoints: true,

                /**
                 * When a series contains more points than this, we no longer
                 * allow keyboard navigation for it.
                 *
                 * Set to `false` to disable.
                 *
                 * @type  {boolean|number}
                 * @since 8.0.0
                 */
                pointNavigationEnabledThreshold: false,

                /**
                 * Remember which point was focused even after navigating away
                 * from the series, so that when navigating back to the series
                 * you start at the last focused point.
                 *
                 * @type  {boolean}
                 * @since 10.1.0
                 */
                rememberPointFocus: false
            }
        },

        /**
         * Options for announcing new data to screen reader users. Useful
         * for dynamic data applications and drilldown.
         *
         * Keep in mind that frequent announcements will not be useful to
         * users, as they won't have time to explore the new data. For these
         * applications, consider making snapshots of the data accessible, and
         * do the announcements in batches.
         *
         * @declare Highcharts.AccessibilityAnnounceNewDataOptionsObject
         * @since   7.1.0
         */
        announceNewData: {
            /**
             * Optional formatter callback for the announcement. Receives
             * up to three arguments. The first argument is always an array
             * of all series that received updates. If an announcement is
             * already queued, the series that received updates for that
             * announcement are also included in this array. The second
             * argument is provided if `chart.addSeries` was called, and
             * there is a new series. In that case, this argument is a
             * reference to the new series. The third argument, similarly,
             * is provided if `series.addPoint` was called, and there is a
             * new point. In that case, this argument is a reference to the
             * new point.
             *
             * The function should return a string with the text to announce
             * to the user. Return empty string to not announce anything.
             * Return `false` to use the default announcement format.
             *
             * @sample highcharts/accessibility/custom-dynamic
             *         High priority live alerts
             *
             * @type      {Highcharts.AccessibilityAnnouncementFormatter}
             * @apioption accessibility.announceNewData.announcementFormatter
             */

            /**
             * Enable announcing new data to screen reader users
             * @sample highcharts/accessibility/accessible-dynamic
             *         Dynamic data accessible
             */
            enabled: false,

            /**
             * Minimum interval between announcements in milliseconds. If
             * new data arrives before this amount of time has passed, it is
             * queued for announcement. If another new data event happens
             * while an announcement is queued, the queued announcement is
             * dropped, and the latest announcement is queued instead. Set
             * to 0 to allow all announcements, but be warned that frequent
             * announcements are disturbing to users.
             */
            minAnnounceInterval: 5000,

            /**
             * Choose whether or not the announcements should interrupt the
             * screen reader. If not enabled, the user will be notified once
             * idle. It is recommended not to enable this setting unless
             * there is a specific reason to do so.
             */
            interruptUser: false
        }
    },

    /**
     * Accessibility options for a data point.
     *
     * @declare   Highcharts.PointAccessibilityOptionsObject
     * @since     7.1.0
     * @apioption series.line.data.accessibility
     */

    /**
     * Provide a description of the data point, announced to screen readers.
     *
     * @type      {string}
     * @since     7.1.0
     * @apioption series.line.data.accessibility.description
     */

    /**
     * Set to false to disable accessibility functionality for a specific point.
     * The point will not be included in keyboard navigation, and will not be
     * exposed to assistive technology.
     *
     * @type      {boolean}
     * @since 9.0.1
     * @apioption series.line.data.accessibility.enabled
     */

    /**
     * Accessibility options for a series.
     *
     * @declare    Highcharts.SeriesAccessibilityOptionsObject
     * @since      7.1.0
     * @requires   modules/accessibility
     * @apioption  plotOptions.series.accessibility
     */

    /**
     * Enable/disable accessibility functionality for a specific series.
     *
     * @type       {boolean}
     * @since      7.1.0
     * @apioption  plotOptions.series.accessibility.enabled
     */

    /**
     * Provide a description of the series, announced to screen readers.
     *
     * @type       {string}
     * @since      7.1.0
     * @apioption  plotOptions.series.accessibility.description
     */

    /**
     * Format to use for describing the data series group to assistive
     * technology - including screen readers.
     *
     * @see [series.descriptionFormat](#accessibility.series.descriptionFormat)
     * @type       {string}
     * @since 11.0.0
     * @apioption  plotOptions.series.accessibility.descriptionFormat
     */

    /**
     * Expose only the series element to screen readers, not its points.
     *
     * @type       {boolean}
     * @since      7.1.0
     * @apioption  plotOptions.series.accessibility.exposeAsGroupOnly
     */

    /**
     * Point accessibility options for a series.
     *
     * @extends    accessibility.point
     * @since 9.3.0
     * @requires   modules/accessibility
     * @apioption  plotOptions.series.accessibility.point
     */

    /**
     * Formatter function to use instead of the default for point
     * descriptions. Same as `accessibility.point.descriptionFormatter`, but
     * applies to a series instead of the whole chart.
     *
     * Note: Prefer using [accessibility.point.valueDescriptionFormat](#plotOptions.series.accessibility.point.valueDescriptionFormat)
     * instead if possible, as default functionality such as describing
     * annotations will be preserved.
     *
     * @see [accessibility.point.valueDescriptionFormat](#plotOptions.series.accessibility.point.valueDescriptionFormat)
     * @see [point.accessibility.description](#series.line.data.accessibility.description)
     * @see [accessibility.point.descriptionFormatter](#accessibility.point.descriptionFormatter)
     *
     * @type      {Highcharts.ScreenReaderFormatterCallbackFunction<Highcharts.Point>}
     * @since 9.3.0
     * @apioption plotOptions.series.accessibility.point.descriptionFormatter
     */

    /**
     * Keyboard navigation for a series
     *
     * @declare    Highcharts.SeriesAccessibilityKeyboardNavigationOptionsObject
     * @since      7.1.0
     * @apioption  plotOptions.series.accessibility.keyboardNavigation
     */

    /**
     * Enable/disable keyboard navigation support for a specific series.
     *
     * @type       {boolean}
     * @since      7.1.0
     * @apioption  plotOptions.series.accessibility.keyboardNavigation.enabled
     */

    /**
     * Accessibility options for an annotation label.
     *
     * @declare    Highcharts.AnnotationLabelAccessibilityOptionsObject
     * @since 8.0.1
     * @requires   modules/accessibility
     * @apioption  annotations.labelOptions.accessibility
     */

    /**
     * Description of an annotation label for screen readers and other assistive
     * technology.
     *
     * @type       {string}
     * @since 8.0.1
     * @apioption  annotations.labelOptions.accessibility.description
     */

    /**
     * Accessibility options for an axis. Requires the accessibility module.
     *
     * @declare    Highcharts.AxisAccessibilityOptionsObject
     * @since      7.1.0
     * @requires   modules/accessibility
     * @apioption  xAxis.accessibility
     */

    /**
     * Enable axis accessibility features, including axis information in the
     * screen reader information region. If this is disabled on the xAxis, the
     * x values are not exposed to screen readers for the individual data points
     * by default.
     *
     * @type       {boolean}
     * @since      7.1.0
     * @apioption  xAxis.accessibility.enabled
     */

    /**
     * Description for an axis to expose to screen reader users.
     *
     * @type       {string}
     * @since      7.1.0
     * @apioption  xAxis.accessibility.description
     */

    /**
     * Range description for an axis. Overrides the default range description.
     * Set to empty to disable range description for this axis.
     *
     * @type       {string}
     * @since      7.1.0
     * @apioption  xAxis.accessibility.rangeDescription
     */

    /**
     * @optionparent legend
     */
    legend: {
        /**
         * Accessibility options for the legend. Requires the Accessibility
         * module.
         *
         * @since     7.1.0
         * @requires  modules/accessibility
         */
        accessibility: {

            /**
             * Enable accessibility support for the legend.
             *
             * @since  7.1.0
             */
            enabled: true,

            /**
             * Options for keyboard navigation for the legend.
             *
             * @since     7.1.0
             * @requires  modules/accessibility
             */
            keyboardNavigation: {
                /**
                 * Enable keyboard navigation for the legend.
                 *
                 * @see [accessibility.keyboardNavigation](#accessibility.keyboardNavigation.enabled)
                 *
                 * @since  7.1.0
                 */
                enabled: true
            }
        }
    },

    /**
     * @optionparent exporting
     */
    exporting: {
        /**
         * Accessibility options for the exporting menu. Requires the
         * Accessibility module.
         *
         * @since    7.1.0
         * @requires modules/accessibility
         */
        accessibility: {
            /**
             * Enable accessibility support for the export menu.
             *
             * @since 7.1.0
             */
            enabled: true
        }
    },

    /**
     * @optionparent navigator
     */
    navigator: {
        /**
         * Accessibility options for the navigator. Requires the
         * Accessibility module.
         *
         * @since 11.2.0
         * @requires modules/accessibility
         */
        accessibility: {
            /**
             * Enable accessibility support for the navigator.
             *
             * @since 11.2.0
             */
            enabled: true
        }
    }
};

export default Options;
