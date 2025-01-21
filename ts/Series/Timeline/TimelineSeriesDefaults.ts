/* *
 *
 *  Timeline Series.
 *
 *  (c) 2010-2024 Highsoft AS
 *
 *  Author: Daniel Studencki
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

import type Point from '../../Core/Series/Point';
import type TimelinePoint from './TimelinePoint';
import type TimelineSeriesOptions from './TimelineSeriesOptions';

import { Palette } from '../../Core/Color/Palettes.js';

/* *
 *
 *  API Options
 *
 * */

/**
 * The timeline series presents given events along a drawn line.
 *
 * @sample highcharts/series-timeline/alternate-labels
 *         Timeline series
 * @sample highcharts/series-timeline/inverted
 *         Inverted timeline
 * @sample highcharts/series-timeline/datetime-axis
 *         With true datetime axis
 *
 * @extends      plotOptions.line
 * @excluding    animationLimit, boostThreshold, connectEnds, connectNulls,
 *               cropThreshold, dashStyle, findNearestPointBy,
 *               getExtremesFromAll, negativeColor, pointInterval,
 *               pointIntervalUnit, pointPlacement, pointStart,
 *               softThreshold, stacking, step, threshold, turboThreshold,
 *               zoneAxis, zones, dataSorting, boostBlending
 * @product      highcharts
 * @since        7.0.0
 * @requires     modules/timeline
 * @optionparent plotOptions.timeline
 */
const TimelineSeriesDefaults: TimelineSeriesOptions = {

    colorByPoint: true,

    stickyTracking: false,

    ignoreHiddenPoint: true,

    /**
     * @ignore
     */
    legendType: 'point',

    /**
     * Pixel width of the graph line.
     */
    lineWidth: 4,

    tooltip: {
        headerFormat: '<span style="color:{point.color}">\u25CF</span> ' +
            '<span style="font-size: 0.8em"> {point.key}</span><br/>',
        pointFormat: '{point.description}'
    },
    states: {
        hover: {
            lineWidthPlus: 0
        }
    },
    /**
     * @declare Highcharts.TimelineDataLabelsOptionsObject
     */
    dataLabels: {

        enabled: true,

        allowOverlap: true,

        /**
         * Whether to position data labels alternately. For example, if
         * [distance](#plotOptions.timeline.dataLabels.distance)
         * is set equal to `100`, then data labels will be positioned
         * alternately (on both sides of the point) at a distance of 100px.
         *
         * @sample {highcharts} highcharts/series-timeline/alternate-disabled
         *         Alternate disabled
         */
        alternate: true,

        backgroundColor: Palette.backgroundColor,

        borderWidth: 1,

        borderColor: Palette.neutralColor40,

        borderRadius: 3,

        color: Palette.neutralColor80,

        /**
         * The color of the line connecting the data label to the point.
         * The default color is the same as the point's color.
         *
         * In styled mode, the connector stroke is given in the
         * `.highcharts-data-label-connector` class.
         *
         * @sample {highcharts} highcharts/series-timeline/connector-styles
         *         Custom connector width and color
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @apioption plotOptions.timeline.dataLabels.connectorColor
         */

        /**
         * The width of the line connecting the data label to the point.
         *
         * In styled mode, the connector stroke width is given in the
         * `.highcharts-data-label-connector` class.
         *
         * @sample {highcharts} highcharts/series-timeline/connector-styles
         *         Custom connector width and color
         */
        connectorWidth: 1,

        /**
         * A pixel value defining the distance between the data label and
         * the point. Negative numbers puts the label on top of the point in a
         * non-inverted chart. Defaults to 100 for horizontal and 20 for
         * vertical timeline (`chart.inverted: true`).
         */
        distance: void 0,

        // eslint-disable-next-line jsdoc/require-description
        /**
         * @default function () {
         *   let format;
         *
         *   if (!this.series.chart.styledMode) {
         *       format = '<span style="color:' + this.point.color +
         *           '">● </span>';
         *   } else {
         *       format = '<span class="highcharts-color-' +
         *          this.point.colorIndex + '">● </span>';
         *   }
         *   format += '<span>' + (this.key || '') + '</span><br/>' +
         *       (this.point.label || '');
         *   return format;
         * }
         */
        formatter: function (
            this: (Point|TimelinePoint)
        ): string {
            let format;

            if (!this.series.chart.styledMode) {
                format = '<span style="color:' + this.point.color +
                    '">● </span>';
            } else {
                format = '<span class="highcharts-color-' +
                    this.point.colorIndex + '">● </span>';
            }
            format += '<span class="highcharts-strong">' +
                (this.key || '') + '</span><br/>' +
                ((this as TimelinePoint).label || '');
            return format;
        },

        padding: 5,

        style: {
            /** @internal */
            textOutline: 'none',
            /** @internal */
            fontWeight: 'normal',
            /** @internal */
            fontSize: '0.8em',
            /** @internal */
            textAlign: 'left'
        },

        /**
         * Shadow options for the data label.
         *
         * @type {boolean|Highcharts.CSSObject}
         */
        shadow: false,

        /**
         * @type      {number}
         * @apioption plotOptions.timeline.dataLabels.width
         */

        verticalAlign: 'middle'

    },
    marker: {
        enabledThreshold: 0,
        symbol: 'square',
        radius: 6,
        lineWidth: 2,
        height: 15
    },
    showInLegend: false,
    colorKey: 'x',
    legendSymbol: 'rectangle'
};

/**
 * The `timeline` series. If the [type](#series.timeline.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.timeline
 * @excluding animationLimit, boostThreshold, connectEnds, connectNulls,
 *            cropThreshold, dashStyle, dataParser, dataURL, findNearestPointBy,
 *            getExtremesFromAll, negativeColor, pointInterval,
 *            pointIntervalUnit, pointPlacement, pointStart, softThreshold,
 *            stacking, stack, step, threshold, turboThreshold, zoneAxis, zones,
 *            dataSorting, boostBlending
 * @product   highcharts
 * @requires  modules/timeline
 * @apioption series.timeline
 */

/**
 * An array of data points for the series. For the `timeline` series type,
 * points can be given with three general parameters, `name`, `label`,
 * and `description`:
 *
 * Example:
 *
 * ```js
 * series: [{
 *    type: 'timeline',
 *    data: [{
 *        name: 'Jan 2018',
 *        label: 'Some event label',
 *        description: 'Description to show in tooltip'
 *    }]
 * }]
 * ```
 * If all points additionally have the `x` values, and xAxis type is set to
 * `datetime`, then events are laid out on a true time axis, where their
 * placement reflects the actual time between them.
 *
 * @sample {highcharts} highcharts/series-timeline/alternate-labels
 *         Alternate labels
 * @sample {highcharts} highcharts/series-timeline/datetime-axis
 *         Real time intervals
 *
 * @type      {Array<*>}
 * @extends   series.line.data
 * @excluding marker, y
 * @product   highcharts
 * @apioption series.timeline.data
 */

/**
 * The name of event.
 *
 * @type      {string}
 * @product   highcharts
 * @apioption series.timeline.data.name
 */

/**
 * The label of event.
 *
 * @type      {string}
 * @product   highcharts
 * @apioption series.timeline.data.label
 */

/**
 * The description of event. This description will be shown in tooltip.
 *
 * @type      {string}
 * @product   highcharts
 * @apioption series.timeline.data.description
 */

''; // Adds doclets above to transpiled file

/* *
 *
 *  Default Export
 *
 * */

export default TimelineSeriesDefaults;
