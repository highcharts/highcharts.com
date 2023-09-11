/* *
 *
 *  Copyright (c) 2019-2021 Highsoft AS
 *
 *  Boost module: stripped-down renderer for higher performance
 *
 *  License: highcharts.com/license
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

import type Chart from '../../Core/Chart/Chart';
import type Color from '../../Core/Color/Color';
import type Series from '../../Core/Series/Series';
import type SeriesRegistry from '../../Core/Series/SeriesRegistry';

import BoostChart from './BoostChart.js';
import BoostSeries from './BoostSeries.js';
import H from '../../Core/Globals.js';
const {
    win,
    doc
} = H;
import initCanvasBoost from '../../Extensions/BoostCanvas.js';
import NamedColors from './NamedColors.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
import error from '../../Shared/Helpers/Error.js';
const {
    pushUnique
} = AH;

/* *
 *
 *  Constants
 *
 * */

const composedClasses: Array<Function> = [];

const contexts = [
    'webgl',
    'experimental-webgl',
    'moz-webgl',
    'webkit-3d'
];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart,
    SeriesClass: typeof Series,
    seriesTypes: typeof SeriesRegistry.seriesTypes,
    ColorClass?: typeof Color
): void {
    const wglMode = hasWebGLSupport();

    if (!wglMode) {
        if (typeof initCanvasBoost !== 'undefined') {
            // Fallback to canvas boost
            initCanvasBoost();
        } else {
            error(26);
        }
    }

    if (ColorClass && pushUnique(composedClasses, ColorClass)) {
        ColorClass.names = {
            ...ColorClass.names,
            ...NamedColors.defaultHTMLColorMap
        };
    }

    // WebGL support is alright, and we're good to go.

    BoostChart.compose(ChartClass, wglMode);
    BoostSeries.compose(SeriesClass, seriesTypes, wglMode);
}

/**
 * Returns true if the current browser supports WebGL.
 *
 * @requires module:modules/boost
 *
 * @function Highcharts.hasWebGLSupport
 *
 * @return {boolean}
 * `true` if the browser supports WebGL.
 */
function hasWebGLSupport(): boolean {
    let canvas,
        gl: (false|RenderingContext|null) = false;

    if (typeof win.WebGLRenderingContext !== 'undefined') {
        canvas = doc.createElement('canvas');

        for (let i = 0; i < contexts.length; ++i) {
            try {
                gl = canvas.getContext(contexts[i]);
                if (typeof gl !== 'undefined' && gl !== null) {
                    return true;
                }
            } catch (e) {
                // silent error
            }
        }
    }

    return false;
}

/* *
 *
 *  Default Export
 *
 * */

const Boost = {
    compose,
    hasWebGLSupport
};

export default Boost;

/* *
 *
 *  API Options
 *
 * */

/**
 * Options for the Boost module. The Boost module allows certain series types
 * to be rendered by WebGL instead of the default SVG. This allows hundreds of
 * thousands of data points to be rendered in milliseconds. In addition to the
 * WebGL rendering it saves time by skipping processing and inspection of the
 * data wherever possible. This introduces some limitations to what features are
 * available in boost mode. See [the docs](
 * https://www.highcharts.com/docs/advanced-chart-features/boost-module) for
 * details.
 *
 * In addition to the global `boost` option, each series has a
 * [boostThreshold](#plotOptions.series.boostThreshold) that defines when the
 * boost should kick in.
 *
 * Requires the `modules/boost.js` module.
 *
 * @sample {highstock} highcharts/boost/line-series-heavy-stock
 *         Stock chart
 * @sample {highstock} highcharts/boost/line-series-heavy-dynamic
 *         Dynamic stock chart
 * @sample highcharts/boost/line
 *         Line chart
 * @sample highcharts/boost/line-series-heavy
 *         Line chart with hundreds of series
 * @sample highcharts/boost/scatter
 *         Scatter chart
 * @sample highcharts/boost/area
 *         Area chart
 * @sample highcharts/boost/arearange
 *         Area range chart
 * @sample highcharts/boost/column
 *         Column chart
 * @sample highcharts/boost/columnrange
 *         Column range chart
 * @sample highcharts/boost/bubble
 *         Bubble chart
 * @sample highcharts/boost/heatmap
 *         Heat map
 * @sample highcharts/boost/treemap
 *         Tree map
 *
 * @product   highcharts highstock
 * @requires  modules/boost
 * @apioption boost
 */

/**
 * The chart will be boosted, if one of the series crosses its threshold and all
 * the series in the chart can be boosted.
 *
 * @type      {boolean}
 * @default   true
 * @apioption boost.allowForce
 */

/**
 * Enable or disable boost on a chart.
 *
 * @type      {boolean}
 * @default   true
 * @apioption boost.enabled
 */

/**
 * Debugging options for boost.
 * Useful for benchmarking, and general timing.
 *
 * @apioption boost.debug
 */

/**
 * Time the series rendering.
 *
 * This outputs the time spent on actual rendering in the console when
 * set to true.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.debug.timeRendering
 */

/**
 * Time the series processing.
 *
 * This outputs the time spent on transforming the series data to
 * vertex buffers when set to true.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.debug.timeSeriesProcessing
 */

/**
 * Time the the WebGL setup.
 *
 * This outputs the time spent on setting up the WebGL context,
 * creating shaders, and textures.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.debug.timeSetup
 */

/**
 * Time the building of the k-d tree.
 *
 * This outputs the time spent building the k-d tree used for
 * markers etc.
 *
 * Note that the k-d tree is built async, and runs post-rendering.
 * Following, it does not affect the performance of the rendering itself.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.debug.timeKDTree
 */

/**
 * Show the number of points skipped through culling.
 *
 * When set to true, the number of points skipped in series processing
 * is outputted. Points are skipped if they are closer than 1 pixel from
 * each other.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.debug.showSkipSummary
 */

/**
 * Time the WebGL to SVG buffer copy
 *
 * After rendering, the result is copied to an image which is injected
 * into the SVG.
 *
 * If this property is set to true, the time it takes for the buffer copy
 * to complete is outputted.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.debug.timeBufferCopy
 */

/**
 * The pixel ratio for the WebGL content. If 0, the `window.devicePixelRatio` is
 * used. This ensures sharp graphics on high DPI displays like Apple's Retina,
 * as well as when a page is zoomed.
 *
 * The default is left at 1 for now, as this is a new feature that has the
 * potential to break existing setups. Over time, when it has been battle
 * tested, the intention is to set it to 0 by default.
 *
 * Another use case for this option is to set it to 2 in order to make exported
 * and upscaled charts render sharp.
 *
 * One limitation when using the `pixelRatio` is that the line width of graphs
 * is scaled down. Since the Boost module currently can only render 1px line
 * widths, it is scaled down to a thin 0.5 pixels on a Retina display.
 *
 * @sample    highcharts/boost/line-devicepixelratio
 *            Enable the `devicePixelRatio`
 * @sample    highcharts/boost/line-export-pixelratio
 *            Sharper graphics in export
 *
 * @type      {number}
 * @since 10.0.0
 * @default   1
 * @apioption boost.pixelRatio
 */

/**
 * Set the series threshold for when the boost should kick in globally.
 *
 * Setting to e.g. 20 will cause the whole chart to enter boost mode
 * if there are 20 or more series active. When the chart is in boost mode,
 * every series in it will be rendered to a common canvas. This offers
 * a significant speed improvment in charts with a very high
 * amount of series.
 *
 * @type      {number}
 * @default   50
 * @apioption boost.seriesThreshold
 */

/**
 * Enable or disable GPU translations. GPU translations are faster than doing
 * the translation in JavaScript.
 *
 * This option may cause rendering issues with certain datasets.
 * Namely, if your dataset has large numbers with small increments (such as
 * timestamps), it won't work correctly. This is due to floating point
 * precission.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.useGPUTranslations
 */

/**
 * Enable or disable pre-allocation of vertex buffers.
 *
 * Enabling this will make it so that the binary data arrays required for
 * storing the series data will be allocated prior to transforming the data
 * to a WebGL-compatible format.
 *
 * This saves a copy operation on the order of O(n) and so is significantly more
 * performant. However, this is currently an experimental option, and may cause
 * visual artifacts with some datasets.
 *
 * As such, care should be taken when using this setting to make sure that
 * it doesn't cause any rendering glitches with the given use-case.
 *
 * @type      {boolean}
 * @default   false
 * @apioption boost.usePreallocated
 */

/**
 * Set the point threshold for when a series should enter boost mode.
 *
 * Setting it to e.g. 2000 will cause the series to enter boost mode when there
 * are 2000 or more points in the series.
 *
 * To disable boosting on the series, set the `boostThreshold` to 0. Setting it
 * to 1 will force boosting.
 *
 * Note that the [cropThreshold](plotOptions.series.cropThreshold) also affects
 * this setting. When zooming in on a series that has fewer points than the
 * `cropThreshold`, all points are rendered although outside the visible plot
 * area, and the `boostThreshold` won't take effect.
 *
 * @type      {number}
 * @default   5000
 * @requires  modules/boost
 * @apioption plotOptions.series.boostThreshold
 */

/**
 * Sets the color blending in the boost module.
 *
 * @type       {string}
 * @default    undefined
 * @validvalue ["add", "multiply", "darken"]
 * @requires   modules/boost
 * @apioption  plotOptions.series.boostBlending
 */

''; // adds doclets above to transpiled file
