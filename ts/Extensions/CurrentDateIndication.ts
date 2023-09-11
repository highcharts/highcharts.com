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
    AlignValue,
    VerticalAlignValue
} from '../Core/Renderer/AlignObject';
import type ColorString from '../Core/Color/ColorString';
import type CSSObject from '../Core/Renderer/CSSObject';
import type DashStyleValue from '../Core/Renderer/DashStyleValue';
import type Templating from '../Core/Templating';
import type { PlotBandLabelOptions } from '../Core/Axis/PlotLineOrBand/PlotBandOptions';
import type {
    PlotLineLabelOptions,
    PlotLineOptions
} from '../Core/Axis/PlotLineOrBand/PlotLineOptions';

import Axis from '../Core/Axis/Axis.js';
import { Palette } from '../Core/Color/Palettes.js';
import PlotLineOrBand from '../Core/Axis/PlotLineOrBand/PlotLineOrBand.js';
import U from '../Shared/Utilities.js';
import EH from '../Shared/Helpers/EventHelper.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
import AH from '../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { merge } = OH;
const { addEvent } = EH;
const {
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Axis/AxisOptions' {
    interface AxisOptions {
        currentDateIndicator?: (boolean|CurrentDateIndicatorOptions);
    }
}

interface CurrentDateIndicatorLabelFormatterCallbackFunction {
    (value: number, format: string): string;
}
interface CurrentDateIndicatorLabelOptions {
    align?: AlignValue;
    format?: string;
    formatter?: Templating.FormatterCallback<PlotLineOrBand>;
    rotation?: number;
    style?: CSSObject;
    text?: string;
    textAlign?: AlignValue;
    useHTML?: boolean;
    verticalAlign?: VerticalAlignValue;
    x?: number;
    y?: number;
}
interface CurrentDateIndicatorOptions {
    acrossPanes?: boolean;
    className?: string;
    color?: ColorString;
    dashStyle?: DashStyleValue;
    events?: any;
    id?: string;
    label?: CurrentDateIndicatorLabelOptions;
    width?: number;
    zIndex?: number;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/**
 * Show an indicator on the axis for the current date and time. Can be a
 * boolean or a configuration object similar to
 * [xAxis.plotLines](#xAxis.plotLines).
 *
 * @sample gantt/current-date-indicator/demo
 *         Current date indicator enabled
 * @sample gantt/current-date-indicator/object-config
 *         Current date indicator with custom options
 *
 * @declare   Highcharts.CurrentDateIndicatorOptions
 * @type      {boolean|CurrentDateIndicatorOptions}
 * @default   true
 * @extends   xAxis.plotLines
 * @excluding value
 * @product   gantt
 * @apioption xAxis.currentDateIndicator
 */
const defaultOptions: CurrentDateIndicatorOptions = {
    color: Palette.highlightColor20,
    width: 2,
    /**
     * @declare Highcharts.AxisCurrentDateIndicatorLabelOptions
     */
    label: {
        /**
         * Format of the label. This options is passed as the fist argument to
         * [dateFormat](/class-reference/Highcharts.Time#dateFormat) function.
         *
         * @type      {string}
         * @default   %a, %b %d %Y, %H:%M
         * @product   gantt
         * @apioption xAxis.currentDateIndicator.label.format
         */
        format: '%a, %b %d %Y, %H:%M',
        formatter: function (
            this: PlotLineOrBand,
            value?: number,
            format?: string
        ): string {
            return this.axis.chart.time.dateFormat(format || '', value);
        },
        rotation: 0,
        /**
         * @type {Highcharts.CSSObject}
         */
        style: {
            /** @internal */
            fontSize: '0.7em'
        }
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
    AxisClass: typeof Axis,
    PlotLineOrBandClass: typeof PlotLineOrBand
): void {

    if (pushUnique(composedMembers, AxisClass)) {
        addEvent(AxisClass, 'afterSetOptions', onAxisAfterSetOptions);
    }

    if (pushUnique(composedMembers, PlotLineOrBandClass)) {
        addEvent(PlotLineOrBandClass, 'render', onPlotLineOrBandRender);

        wrap(
            PlotLineOrBandClass.prototype,
            'getLabelText',
            wrapPlotLineOrBandGetLabelText
        );
    }

}

/**
 * @private
 */
function onAxisAfterSetOptions(this: Axis): void {
    const options = this.options,
        cdiOptions = options.currentDateIndicator;


    if (cdiOptions) {
        const plotLineOptions: PlotLineOptions =
            typeof cdiOptions === 'object' ?
                merge(defaultOptions, cdiOptions) :
                merge(defaultOptions);

        plotLineOptions.value = Date.now();
        plotLineOptions.className = 'highcharts-current-date-indicator';

        if (!options.plotLines) {
            options.plotLines = [];
        }

        options.plotLines.push(plotLineOptions);
    }
}

/**
 * @private
 */
function onPlotLineOrBandRender(this: PlotLineOrBand): void {
    // If the label already exists, update its text
    if (this.label) {
        this.label.attr({
            text: this.getLabelText((this.options as any).label)
        });
    }
}

/**
 * @private
 */
function wrapPlotLineOrBandGetLabelText(
    this: PlotLineOrBand,
    defaultMethod: Function,
    defaultLabelOptions: (PlotBandLabelOptions|PlotLineLabelOptions)
): string {
    const options = this.options;

    if (
        options &&
        options.className &&
        options.className.indexOf('highcharts-current-date-indicator') !== -1 &&
        options.label &&
        typeof options.label.formatter === 'function'
    ) {

        (options as any).value = Date.now();
        return (options as any).label.formatter
            .call(this, (options as any).value, (options as any).label.format);
    }
    return defaultMethod.call(this, defaultLabelOptions);
}

/* *
 *
 *  Default Export
 *
 * */

const CurrentDateIndication = {
    compose
};

export default CurrentDateIndication;
