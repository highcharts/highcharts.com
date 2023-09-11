/* *
 *
 *  Plugin for displaying a message when there is no data visible in chart.
 *
 *  (c) 2010-2021 Highsoft AS
 *
 *  Author: Oystein Moseng
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

import type AlignObject from '../Core/Renderer/AlignObject';
import type CSSObject from '../Core/Renderer/CSSObject';
import type SVGAttributes from '../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';

import AST from '../Core/Renderer/HTML/AST.js';
import Chart from '../Core/Chart/Chart.js';
import D from '../Core/Defaults.js';
const { getOptions } = D;
import { Palette } from '../Core/Color/Palettes.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;
const { addEvent } = EH;

declare module '../Core/Chart/ChartLike' {
    interface ChartLike {
        noDataLabel?: SVGElement;
        /** @requires modules/no-data-to-display */
        showNoData(str?: string): void;
        /** @requires modules/no-data-to-display */
        hideNoData(): void;
        /** @requires modules/no-data-to-display */
        hasData(): (boolean|undefined);
    }
}

declare module '../Core/Options'{
    interface LangOptions {
        noData?: string;
    }
    interface Options {
        noData?: Highcharts.NoDataOptions;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface NoDataOptions {
            attr?: SVGAttributes;
            useHTML?: boolean;
            position?: AlignObject;
            style?: CSSObject;
        }
    }
}

const chartPrototype = Chart.prototype,
    defaultOptions = getOptions();

// Add language option
extend(
    defaultOptions.lang,
    /**
     * @optionparent lang
     */
    {
        /**
         * The text to display when the chart contains no data.
         *
         * @see [noData](#noData)
         *
         * @sample highcharts/no-data-to-display/no-data-line
         *         No-data text
         *
         * @since    3.0.8
         * @product  highcharts highstock
         * @requires modules/no-data-to-display
         */
        noData: 'No data to display'
    }
);

// Add default display options for message

/**
 * Options for displaying a message like "No data to display".
 * This feature requires the file no-data-to-display.js to be loaded in the
 * page. The actual text to display is set in the lang.noData option.
 *
 * @sample highcharts/no-data-to-display/no-data-line
 *         Line chart with no-data module
 * @sample highcharts/no-data-to-display/no-data-pie
 *         Pie chart with no-data module
 *
 * @product      highcharts highstock gantt
 * @requires     modules/no-data-to-display
 * @optionparent noData
 */
defaultOptions.noData = {

    /**
     * An object of additional SVG attributes for the no-data label.
     *
     * @type      {Highcharts.SVGAttributes}
     * @since     3.0.8
     * @product   highcharts highstock gantt
     * @apioption noData.attr
     */
    attr: {
        zIndex: 1
    },

    /**
     * Whether to insert the label as HTML, or as pseudo-HTML rendered with
     * SVG.
     *
     * @type      {boolean}
     * @default   false
     * @since     4.1.10
     * @product   highcharts highstock gantt
     * @apioption noData.useHTML
     */

    /**
     * The position of the no-data label, relative to the plot area.
     *
     * @type  {Highcharts.AlignObject}
     * @since 3.0.8
     */
    position: {

        /**
         * Horizontal offset of the label, in pixels.
         */
        x: 0,

        /**
         * Vertical offset of the label, in pixels.
         */
        y: 0,

        /**
         * Horizontal alignment of the label.
         *
         * @type {Highcharts.AlignValue}
         */
        align: 'center',

        /**
         * Vertical alignment of the label.
         *
         * @type {Highcharts.VerticalAlignValue}
         */
        verticalAlign: 'middle'
    },

    /**
     * CSS styles for the no-data label.
     *
     * @sample highcharts/no-data-to-display/no-data-line
     *         Styled no-data text
     *
     * @type {Highcharts.CSSObject}
     */
    style: {
        /** @ignore */
        fontWeight: 'bold',
        /** @ignore */
        fontSize: '0.8em',
        /** @ignore */
        color: Palette.neutralColor60
    }

};

/**
 * Display a no-data message.
 * @private
 * @function Highcharts.Chart#showNoData
 * @param {string} [str]
 * An optional message to show in place of the default one
 * @return {void}
 * @requires modules/no-data-to-display
 */
chartPrototype.showNoData = function (str?: string): void {
    const chart = this,
        options = chart.options,
        text = str || (options && options.lang.noData) || '',
        noDataOptions: Highcharts.NoDataOptions =
            options && (options.noData || {});

    if (chart.renderer) { // Meaning chart is not destroyed

        if (!chart.noDataLabel) {
            chart.noDataLabel = chart.renderer
                .label(
                    text,
                    0,
                    0,
                    void 0,
                    void 0,
                    void 0,
                    noDataOptions.useHTML,
                    void 0,
                    'no-data'
                )
                .add();
        }

        if (!chart.styledMode) {
            chart.noDataLabel
                .attr(AST.filterUserAttributes(noDataOptions.attr || {}))
                .css(noDataOptions.style || {});
        }

        chart.noDataLabel.align(
            extend(chart.noDataLabel.getBBox(), noDataOptions.position || {}),
            false,
            'plotBox'
        );
    }
};


/**
 * Hide no-data message.
 *
 * @private
 * @function Highcharts.Chart#hideNoData
 * @return {void}
 * @requires modules/no-data-to-display
 */
chartPrototype.hideNoData = function (): void {
    const chart = this;

    if (chart.noDataLabel) {
        chart.noDataLabel = chart.noDataLabel.destroy();
    }
};

/**
 * Returns true if there are data points within the plot area now.
 *
 * @private
 * @function Highcharts.Chart#hasData
 * @return {boolean|undefined}
 * True, if there are data points.
 * @requires modules/no-data-to-display
 */
chartPrototype.hasData = function (): (boolean|undefined) {
    let chart = this,
        series = chart.series || [],
        i = series.length;

    while (i--) {
        if (series[i].hasData() && !series[i].options.isInternal) {
            return true;
        }
    }

    return chart.loadingShown; // #4588
};

/* eslint-disable no-invalid-this */

// Add event listener to handle automatic show or hide no-data message.
addEvent(Chart, 'render', function handleNoData(): void {
    if (this.hasData()) {
        this.hideNoData();
    } else {
        this.showNoData();
    }
});
