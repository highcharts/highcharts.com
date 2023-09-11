/* *
 *
 *  (c) 2016-2021 Highsoft AS
 *
 *  Author: Lars A. V. Cabrera
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

import type {
    AxisOptions,
    YAxisOptions
} from '../Axis/AxisOptions';
import type { HTMLDOMElement } from '../Renderer/DOMElementType';
import type Options from '../Options';

import Chart from './Chart.js';
import D from '../Defaults.js';
const { getOptions } = D;

import '../../Series/Gantt/GanttSeries.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    splat
} = AH;
const { isArray } = TC;
const {
    merge
} = OH;

/* *
 *
 * Declarations
 *
 * */

declare module '../Options' {
    interface Options {
        isGantt?: boolean;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * Gantt-optimized chart. Use {@link Highcharts.Chart|Chart} for common charts.
 *
 * @requires modules/gantt
 *
 * @class
 * @name Highcharts.GanttChart
 * @extends Highcharts.Chart
 */
class GanttChart extends Chart {
    /**
     * Initializes the chart. The constructor's arguments are passed on
     * directly.
     *
     * @function Highcharts.GanttChart#init
     *
     * @param {Highcharts.Options} userOptions
     *        Custom options.
     *
     * @param {Function} [callback]
     *        Function to run when the chart has loaded and and all external
     *        images are loaded.
     *
     *
     * @emits Highcharts.GanttChart#event:init
     * @emits Highcharts.GanttChart#event:afterInit
     */
    public init(
        userOptions: Partial<Options>,
        callback?: Chart.CallbackFunction
    ): void {
        const defaultOptions = getOptions(),
            xAxisOptions = userOptions.xAxis,
            yAxisOptions = userOptions.yAxis;

        let defaultLinkedTo: number;

        // Avoid doing these twice
        userOptions.xAxis = userOptions.yAxis = void 0;

        const options = merge(
            true,
            {
                chart: {
                    type: 'gantt'
                },
                title: {
                    text: null as any
                },
                legend: {
                    enabled: false
                },
                navigator: {
                    series: { type: 'gantt' },
                    // Bars were clipped, #14060.
                    yAxis: {
                        type: 'category'
                    }
                }
            } as Options,

            userOptions, // user's options

            // forced options
            {
                isGantt: true
            } as Options
        );

        userOptions.xAxis = xAxisOptions;
        userOptions.yAxis = yAxisOptions;

        // apply X axis options to both single and multi x axes
        // If user hasn't defined axes as array, make it into an array and add a
        // second axis by default.
        options.xAxis = (
            !isArray(userOptions.xAxis) ?
                [userOptions.xAxis || {}, {}] :
                userOptions.xAxis
        ).map(function (
            xAxisOptions,
            i
        ): DeepPartial<AxisOptions> {
            if (i === 1) { // Second xAxis
                defaultLinkedTo = 0;
            }
            return merge(
                defaultOptions.xAxis,
                { // defaults
                    grid: {
                        enabled: true
                    },
                    opposite: true,
                    linkedTo: defaultLinkedTo
                },
                xAxisOptions, // user options
                { // forced options
                    type: 'datetime'
                }
            );
        });

        // apply Y axis options to both single and multi y axes
        options.yAxis = (splat(userOptions.yAxis || {})).map(function (
            yAxisOptions: YAxisOptions
        ): YAxisOptions {
            return merge(
                defaultOptions.yAxis, // #3802
                { // defaults
                    grid: {
                        enabled: true
                    },

                    staticScale: 50,

                    reversed: true,

                    // Set default type treegrid, but only if 'categories' is
                    // undefined
                    type: yAxisOptions.categories ?
                        yAxisOptions.type : 'treegrid'
                } as YAxisOptions,
                yAxisOptions // user options
            );
        });
        super.init(options, callback);
    }
}

/* eslint-disable valid-jsdoc */

namespace GanttChart {
    /**
     * The factory function for creating new gantt charts. Creates a new {@link
     * Highcharts.GanttChart|GanttChart} object with different default options
     * than the basic Chart.
     *
     * @example
     * // Render a chart in to div#container
     * let chart = Highcharts.ganttChart('container', {
     *     title: {
     *         text: 'My chart'
     *     },
     *     series: [{
     *         data: ...
     *     }]
     * });
     *
     * @function Highcharts.ganttChart
     *
     * @param {string|Highcharts.HTMLDOMElement} renderTo
     *        The DOM element to render to, or its id.
     *
     * @param {Highcharts.Options} options
     *        The chart options structure.
     *
     * @param {Highcharts.ChartCallbackFunction} [callback]
     *        Function to run when the chart has loaded and and all external
     *        images are loaded. Defining a
     *        [chart.events.load](https://api.highcharts.com/highcharts/chart.events.load)
     *        handler is equivalent.
     *
     * @return {Highcharts.GanttChart}
     *         Returns the Chart object.
     */
    export function ganttChart(
        a: (string|HTMLDOMElement|Options),
        b?: (Chart.CallbackFunction|Options),
        c?: Chart.CallbackFunction
    ): GanttChart {
        return new GanttChart(a as any, b as any, c);
    }
}

export default GanttChart;
