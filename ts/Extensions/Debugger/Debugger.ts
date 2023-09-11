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

import type Chart from '../../Core/Chart/Chart';
import type GlobalsLike from '../../Core/GlobalsLike';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import ErrorMessages from './ErrorMessages.js';
import H from '../../Core/Globals.js';
import D from '../../Core/Defaults.js';
const { setOptions } = D;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    find,
    pushUnique
} = AH;
const { isNumber } = TC;
const { addEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        errorElements?: Array<SVGElement>;
    }
}

declare module '../../Core/Chart/ChartOptions'{
    interface ChartOptions {
        displayErrors?: boolean;
    }
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

const defaultOptions = {
    /**
     * @optionparent chart
     */
    chart: {
        /**
         * Whether to display errors on the chart. When `false`, the errors will
         * be shown only in the console.
         *
         * @sample highcharts/chart/display-errors/
         *         Show errors on chart
         *
         * @since    7.0.0
         * @requires modules/debugger
         */
        displayErrors: true
    }
};

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart
): void {

    if (pushUnique(composedMembers, ChartClass)) {
        addEvent(ChartClass, 'beforeRedraw', onChartBeforeRedraw);
    }

    if (pushUnique(composedMembers, H)) {
        addEvent(H, 'displayError', onHighchartsDisplayError);
    }

    if (pushUnique(composedMembers, setOptions)) {
        setOptions(defaultOptions);
    }

}

/**
 * @private
 */
function onChartBeforeRedraw(
    this: Chart
): void {
    const errorElements = this.errorElements;

    if (errorElements && errorElements.length) {
        for (const el of errorElements) {
            el.destroy();
        }
    }

    delete this.errorElements;
}

/**
 * @private
 */
function onHighchartsDisplayError(
    this: GlobalsLike,
    e: U.ErrorMessageEventObject
): void {
    // Display error on the chart causing the error or the last created chart.
    const chart = (
        e.chart ||
        find(this.charts.slice().reverse(), (c?: Chart): boolean => !!c)
    );

    if (!chart) {
        return;
    }

    const code = e.code,
        options = chart.options.chart,
        renderer = chart.renderer;

    let msg,
        chartWidth,
        chartHeight;

    if (chart.errorElements) {
        for (const el of chart.errorElements) {
            if (el) {
                el.destroy();
            }
        }
    }

    if (options && options.displayErrors && renderer) {
        chart.errorElements = [];
        msg = isNumber(code) ?
            (
                'Highcharts error #' + code + ': ' +
                ErrorMessages[code].text
            ) :
            code;
        chartWidth = chart.chartWidth;
        chartHeight = chart.chartHeight;

        // Format msg so SVGRenderer can handle it
        msg = msg
            .replace(
                /<h1>(.*)<\/h1>/g,
                '<br><span style="font-size: 2em">$1</span><br>'
            )
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '<br>');

        // Render red chart frame.
        chart.errorElements[0] = renderer.rect(
            2,
            2,
            chartWidth - 4,
            chartHeight - 4
        ).attr({
            'stroke-width': 4,
            stroke: '#ff0000',
            zIndex: 3
        }).add();

        // Render error message
        chart.errorElements[1] = renderer.label(
            msg,
            0,
            0,
            'rect',
            void 0,
            void 0,
            void 0,
            void 0,
            'debugger'
        ).css({
            color: '#ffffff',
            fontSize: '0.8em',
            width: (chartWidth - 16) + 'px',
            padding: 0
        }).attr({
            fill: 'rgba(255, 0, 0, 0.9)',
            width: chartWidth,
            padding: 8,
            zIndex: 10
        }).add();

        chart.errorElements[1].attr({
            y: chartHeight - chart.errorElements[1].getBBox().height
        });
    }
}

/* *
 *
 *  Default Export
 *
 * */

const Debugger = {
    compose
};

export default Debugger;
