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

import type Templating from '../../Templating';
import type {
    PlotBandLabelOptions,
    PlotBandOptions
} from './PlotBandOptions';
import type {
    PlotLineLabelOptions,
    PlotLineOptions
} from './PlotLineOptions';
import type SVGAttributes from '../../Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Renderer/SVG/SVGElement';
import type SVGPath from '../../Renderer/SVG/SVGPath';

import Axis from '../Axis.js';
import { Palette } from '../../Color/Palettes.js';
import PlotLineOrBandAxis from './PlotLineOrBandAxis.js';
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    arrayMax,
    arrayMin,
    erase
} = AH;
const {
    defined,
    objectEach,
    destroyObjectProperties,
    merge
} = OH;
const { fireEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The object wrapper for plot lines and plot bands
 *
 * @class
 * @name Highcharts.PlotLineOrBand
 *
 * @param {Highcharts.Axis} axis
 * Related axis.
 *
 * @param {Highcharts.AxisPlotLinesOptions|Highcharts.AxisPlotBandsOptions} [options]
 * Options to use.
 */
class PlotLineOrBand {

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose<T extends typeof Axis>(
        AxisClass: T
    ): ReturnType<typeof PlotLineOrBandAxis.compose> {
        return PlotLineOrBandAxis.compose(PlotLineOrBand, AxisClass);
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        axis: PlotLineOrBandAxis.Composition,
        options?: (PlotBandOptions|PlotLineOptions)
    ) {
        this.axis = axis;
        if (options) {
            this.options = options;
            this.id = options.id;
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public axis: PlotLineOrBandAxis.Composition;
    public id?: string;
    public isActive?: boolean;
    public eventsAdded?: boolean;
    public label?: SVGElement;
    public options?: (PlotBandOptions|PlotLineOptions);
    public svgElem?: SVGElement;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable no-invalid-this, valid-jsdoc */

    /**
     * Render the plot line or plot band. If it is already existing,
     * move it.
     * @private
     * @function Highcharts.PlotLineOrBand#render
     */
    public render(): (PlotLineOrBand|undefined) {
        fireEvent(this, 'render');

        const plotLine = this,
            axis = plotLine.axis,
            horiz = axis.horiz,
            log = axis.logarithmic,
            options = plotLine.options as (PlotBandOptions|PlotLineOptions),
            color = options.color,
            zIndex = pick(options.zIndex, 0),
            events = options.events,
            groupAttribs: SVGAttributes = {},
            renderer = axis.chart.renderer;

        let optionsLabel = options.label,
            label = plotLine.label,
            to = (options as any).to,
            from = (options as any).from,
            value = (options as any).value,
            svgElem = plotLine.svgElem,
            path = [] as SVGPath,
            group;

        const isBand = defined(from) && defined(to),
            isLine = defined(value),
            isNew = !svgElem,
            attribs: SVGAttributes = {
                'class': 'highcharts-plot-' + (isBand ? 'band ' : 'line ') +
                    (options.className || '')
            };

        let groupName = isBand ? 'bands' : 'lines';

        // logarithmic conversion
        if (log) {
            from = log.log2lin(from);
            to = log.log2lin(to);
            value = log.log2lin(value);
        }

        // Set the presentational attributes
        if (!axis.chart.styledMode) {
            if (isLine) {
                attribs.stroke = color || Palette.neutralColor40;
                attribs['stroke-width'] = pick(
                    (options as PlotLineOptions).width,
                    1
                );
                if ((options as PlotLineOptions).dashStyle) {
                    attribs.dashstyle =
                        (options as PlotLineOptions).dashStyle;
                }

            } else if (isBand) { // plot band
                attribs.fill = color || Palette.highlightColor10;
                if ((options as PlotBandOptions).borderWidth) {
                    attribs.stroke = (
                        options as PlotBandOptions
                    ).borderColor;
                    attribs['stroke-width'] = (
                        options as PlotBandOptions
                    ).borderWidth;
                }
            }
        }

        // Grouping and zIndex
        groupAttribs.zIndex = zIndex;
        groupName += '-' + zIndex;

        group = axis.plotLinesAndBandsGroups[groupName];
        if (!group) {
            axis.plotLinesAndBandsGroups[groupName] = group =
                renderer.g('plot-' + groupName)
                    .attr(groupAttribs).add();
        }

        // Create the path
        if (isNew) {
            /**
             * SVG element of the plot line or band.
             *
             * @name Highcharts.PlotLineOrBand#svgElem
             * @type {Highcharts.SVGElement}
             */
            plotLine.svgElem = svgElem = renderer
                .path()
                .attr(attribs)
                .add(group);
        }


        // Set the path or return
        if (isLine) {
            path = axis.getPlotLinePath({
                value: value,
                lineWidth: (svgElem as any).strokeWidth(),
                acrossPanes: options.acrossPanes
            }) as any;
        } else if (isBand) { // plot band
            path = axis.getPlotBandPath(from, to, options);
        } else {
            return;
        }


        // common for lines and bands
        // Add events only if they were not added before.
        if (!plotLine.eventsAdded && events) {
            objectEach(events, function (event, eventType): void {
                (svgElem as any).on(eventType, function (e: any): void {
                    events[eventType].apply(plotLine, [e]);
                });
            });
            plotLine.eventsAdded = true;
        }
        if ((isNew || !(svgElem as any).d) && path && path.length) {
            (svgElem as any).attr({ d: path });
        } else if (svgElem) {
            if (path) {
                svgElem.show();
                svgElem.animate({ d: path });
            } else if (svgElem.d) {
                svgElem.hide();
                if (label) {
                    plotLine.label = label = label.destroy();
                }
            }
        }

        // the plot band/line label
        if (
            optionsLabel &&
            (defined(optionsLabel.text) || defined(optionsLabel.formatter)) &&
            path &&
            path.length &&
            axis.width > 0 &&
            axis.height > 0 &&
            !(path as any).isFlat
        ) {
            // apply defaults
            optionsLabel = merge({
                align: horiz && isBand && 'center',
                x: horiz ? !isBand && 4 : 10,
                verticalAlign: !horiz && isBand && 'middle',
                y: horiz ? isBand ? 16 : 10 : isBand ? 6 : -4,
                rotation: horiz && !isBand && 90
            } as PlotLineLabelOptions, optionsLabel);

            this.renderLabel(optionsLabel, path, isBand, zIndex);

        } else if (label) { // move out of sight
            label.hide();
        }

        // chainable
        return plotLine as any;
    }

    /**
     * Render and align label for plot line or band.
     * @private
     * @function Highcharts.PlotLineOrBand#renderLabel
     */
    public renderLabel(
        optionsLabel: (PlotBandLabelOptions|PlotLineLabelOptions),
        path: SVGPath,
        isBand?: boolean,
        zIndex?: number
    ): void {
        const plotLine = this,
            axis = plotLine.axis,
            renderer = axis.chart.renderer;

        let label = plotLine.label;

        // Add the SVG element
        if (!label) {
            /**
             * SVG element of the label.
             *
             * @name Highcharts.PlotLineOrBand#label
             * @type {Highcharts.SVGElement}
             */
            plotLine.label = label = renderer
                .text(
                    this.getLabelText(optionsLabel),
                    0,
                    0,
                    optionsLabel.useHTML
                )
                .attr({
                    align: optionsLabel.textAlign || optionsLabel.align,
                    rotation: optionsLabel.rotation,
                    'class': 'highcharts-plot-' + (isBand ? 'band' : 'line') +
                        '-label ' + ((optionsLabel as any).className || ''),
                    zIndex
                });

            if (!axis.chart.styledMode) {
                label.css(merge({
                    fontSize: '0.8em',
                    textOverflow: 'ellipsis'
                }, optionsLabel.style));
            }

            label.add();
        }

        // Get the bounding box and align the label
        // #3000 changed to better handle choice between plotband or plotline
        const xBounds = (path as any).xBounds ||
            [path[0][1], path[1][1], (isBand ? path[2][1] : path[0][1])];
        const yBounds = (path as any).yBounds ||
            [path[0][2], path[1][2], (isBand ? path[2][2] : path[0][2])];

        const x = arrayMin(xBounds);
        const y = arrayMin(yBounds);

        label.align(optionsLabel, false, {
            x,
            y,
            width: arrayMax(xBounds) - x,
            height: arrayMax(yBounds) - y
        });
        if (!label.alignValue || label.alignValue === 'left') {
            const width = optionsLabel.clip ?
                axis.width : axis.chart.chartWidth;

            label.css({
                width: (
                    label.rotation === 90 ?
                        axis.height - (label.alignAttr.y - axis.top) :
                        width - (label.alignAttr.x - axis.left)
                ) + 'px'
            });
        }

        label.show(true);
    }

    /**
     * Get label's text content.
     * @private
     * @function Highcharts.PlotLineOrBand#getLabelText
     */
    public getLabelText(
        optionsLabel: (PlotBandLabelOptions|PlotLineLabelOptions)
    ): string | undefined {
        return defined(optionsLabel.formatter) ?
            (optionsLabel.formatter as
              Templating.FormatterCallback<PlotLineOrBand>)
                .call(this as any) :
            optionsLabel.text;
    }

    /**
     * Remove the plot line or band.
     *
     * @function Highcharts.PlotLineOrBand#destroy
     */
    public destroy(): void {
        // remove it from the lookup
        erase(this.axis.plotLinesAndBands, this);

        delete (this as Partial<this>).axis;
        destroyObjectProperties(this);
    }

    /* eslint-enable no-invalid-this, valid-jsdoc */

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace PlotLineOrBand {

    /* *
     *
     *  Declarations
     *
     * */

    export type Axis = PlotLineOrBandAxis.Composition;

}

/* *
 *
 *  Default Export
 *
 * */

export default PlotLineOrBand;

/* *
 *
 *  API Options
 *
 * */

/**
 * Options for plot bands on axes.
 *
 * @typedef {Highcharts.XAxisPlotBandsOptions|Highcharts.YAxisPlotBandsOptions|Highcharts.ZAxisPlotBandsOptions} Highcharts.AxisPlotBandsOptions
 */

/**
 * Options for plot band labels on axes.
 *
 * @typedef {Highcharts.XAxisPlotBandsLabelOptions|Highcharts.YAxisPlotBandsLabelOptions|Highcharts.ZAxisPlotBandsLabelOptions} Highcharts.AxisPlotBandsLabelOptions
 */

/**
 * Options for plot lines on axes.
 *
 * @typedef {Highcharts.XAxisPlotLinesOptions|Highcharts.YAxisPlotLinesOptions|Highcharts.ZAxisPlotLinesOptions} Highcharts.AxisPlotLinesOptions
 */

/**
 * Options for plot line labels on axes.
 *
 * @typedef {Highcharts.XAxisPlotLinesLabelOptions|Highcharts.YAxisPlotLinesLabelOptions|Highcharts.ZAxisPlotLinesLabelOptions} Highcharts.AxisPlotLinesLabelOptions
 */

('');

/* *
 *
 *  API Options
 *
 * */

/**
 * An array of colored bands stretching across the plot area marking an
 * interval on the axis.
 *
 * In styled mode, the plot bands are styled by the `.highcharts-plot-band`
 * class in addition to the `className` option.
 *
 * @productdesc {highcharts}
 * In a gauge, a plot band on the Y axis (value axis) will stretch along the
 * perimeter of the gauge.
 *
 * @type      {Array<*>}
 * @product   highcharts highstock gantt
 * @apioption xAxis.plotBands
 */

/**
 * Flag to decide if plotBand should be rendered across all panes.
 *
 * @since     7.1.2
 * @product   highstock
 * @type      {boolean}
 * @default   true
 * @apioption xAxis.plotBands.acrossPanes
 */

/**
 * Border color for the plot band. Also requires `borderWidth` to be set.
 *
 * @type      {Highcharts.ColorString}
 * @apioption xAxis.plotBands.borderColor
 */

/**
 * Border width for the plot band. Also requires `borderColor` to be set.
 *
 * @type      {number}
 * @default   0
 * @apioption xAxis.plotBands.borderWidth
 */

/**
 * A custom class name, in addition to the default `highcharts-plot-band`,
 * to apply to each individual band.
 *
 * @type      {string}
 * @since     5.0.0
 * @apioption xAxis.plotBands.className
 */

/**
 * The color of the plot band.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-color/
 *         Color band
 * @sample {highstock} stock/xaxis/plotbands/
 *         Plot band on Y axis
 *
 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
 * @default   ${palette.highlightColor10}
 * @apioption xAxis.plotBands.color
 */

/**
 * An object defining mouse events for the plot band. Supported properties
 * are `click`, `mouseover`, `mouseout`, `mousemove`.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-events/
 *         Mouse events demonstrated
 *
 * @since     1.2
 * @apioption xAxis.plotBands.events
 */

/**
 * Click event on a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotBands.events.click
 */

/**
 * Mouse move event on a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotBands.events.mousemove
 */

/**
 * Mouse out event on the corner of a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotBands.events.mouseout
 */

/**
 * Mouse over event on a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotBands.events.mouseover
 */

/**
 * The start position of the plot band in axis units.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-color/
 *         Datetime axis
 * @sample {highcharts} highcharts/xaxis/plotbands-from/
 *         Categorized axis
 * @sample {highstock} stock/xaxis/plotbands/
 *         Plot band on Y axis
 *
 * @type      {number}
 * @apioption xAxis.plotBands.from
 */

/**
 * An id used for identifying the plot band in Axis.removePlotBand.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-id/
 *         Remove plot band by id
 * @sample {highstock} highcharts/xaxis/plotbands-id/
 *         Remove plot band by id
 *
 * @type      {string}
 * @apioption xAxis.plotBands.id
 */

/**
 * The end position of the plot band in axis units.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-color/
 *         Datetime axis
 * @sample {highcharts} highcharts/xaxis/plotbands-from/
 *         Categorized axis
 * @sample {highstock} stock/xaxis/plotbands/
 *         Plot band on Y axis
 *
 * @type      {number}
 * @apioption xAxis.plotBands.to
 */

/**
 * The z index of the plot band within the chart, relative to other
 * elements. Using the same z index as another element may give
 * unpredictable results, as the last rendered element will be on top.
 * Values from 0 to 20 make sense.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-color/
 *         Behind plot lines by default
 * @sample {highcharts} highcharts/xaxis/plotbands-zindex/
 *         Above plot lines
 * @sample {highcharts} highcharts/xaxis/plotbands-zindex-above-series/
 *         Above plot lines and series
 *
 * @type      {number}
 * @since     1.2
 * @apioption xAxis.plotBands.zIndex
 */

/**
 * Text labels for the plot bands
 *
 * @product   highcharts highstock gantt
 * @apioption xAxis.plotBands.label
 */

/**
 * Horizontal alignment of the label. Can be one of "left", "center" or
 * "right".
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-align/
 *         Aligned to the right
 * @sample {highstock} stock/xaxis/plotbands-label/
 *         Plot band with labels
 *
 * @type      {Highcharts.AlignValue}
 * @default   center
 * @since     2.1
 * @apioption xAxis.plotBands.label.align
 */

/**
 * Rotation of the text label in degrees .
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-rotation/
 *         Vertical text
 *
 * @type      {number}
 * @default   0
 * @since     2.1
 * @apioption xAxis.plotBands.label.rotation
 */

/**
 * CSS styles for the text label.
 *
 * In styled mode, the labels are styled by the
 * `.highcharts-plot-band-label` class.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-style/
 *         Blue and bold label
 *
 * @type      {Highcharts.CSSObject}
 * @since     2.1
 * @apioption xAxis.plotBands.label.style
 */

/**
 * The string text itself. A subset of HTML is supported.
 *
 * @type      {string}
 * @since     2.1
 * @apioption xAxis.plotBands.label.text
 */

/**
 * The text alignment for the label. While `align` determines where the
 * texts anchor point is placed within the plot band, `textAlign` determines
 * how the text is aligned against its anchor point. Possible values are
 * "left", "center" and "right". Defaults to the same as the `align` option.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-rotation/
 *         Vertical text in center position but text-aligned left
 *
 * @type       {Highcharts.AlignValue}
 * @since      2.1
 * @apioption  xAxis.plotBands.label.textAlign
 */

/**
 * Whether to [use HTML](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting#html)
 * to render the labels.
 *
 * @type      {boolean}
 * @default   false
 * @since     3.0.3
 * @apioption xAxis.plotBands.label.useHTML
 */

/**
 * Vertical alignment of the label relative to the plot band. Can be one of
 * "top", "middle" or "bottom".
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-verticalalign/
 *         Vertically centered label
 * @sample {highstock} stock/xaxis/plotbands-label/
 *         Plot band with labels
 *
 * @type       {Highcharts.VerticalAlignValue}
 * @default    top
 * @since      2.1
 * @apioption  xAxis.plotBands.label.verticalAlign
 */

/**
 * Horizontal position relative the alignment. Default varies by
 * orientation.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-align/
 *         Aligned 10px from the right edge
 * @sample {highstock} stock/xaxis/plotbands-label/
 *         Plot band with labels
 *
 * @type      {number}
 * @since     2.1
 * @apioption xAxis.plotBands.label.x
 */

/**
 * Vertical position of the text baseline relative to the alignment. Default
 * varies by orientation.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-label-y/
 *         Label on x axis
 * @sample {highstock} stock/xaxis/plotbands-label/
 *         Plot band with labels
 *
 * @type      {number}
 * @since     2.1
 * @apioption xAxis.plotBands.label.y
 */

/**
 * An array of lines stretching across the plot area, marking a specific
 * value on one of the axes.
 *
 * In styled mode, the plot lines are styled by the
 * `.highcharts-plot-line` class in addition to the `className` option.
 *
 * @type      {Array<*>}
 * @product   highcharts highstock gantt
 * @sample {highcharts} highcharts/xaxis/plotlines-color/
 *         Basic plot line
 * @sample {highcharts} highcharts/series-solidgauge/labels-auto-aligned/
 *         Solid gauge plot line
 * @apioption xAxis.plotLines
 */

/**
 * Flag to decide if plotLine should be rendered across all panes.
 *
 * @sample {highstock} stock/xaxis/plotlines-acrosspanes/
 *         Plot lines on different panes
 *
 * @since     7.1.2
 * @product   highstock
 * @type      {boolean}
 * @default   true
 * @apioption xAxis.plotLines.acrossPanes
 */

/**
 * A custom class name, in addition to the default `highcharts-plot-line`,
 * to apply to each individual line.
 *
 * @type      {string}
 * @since     5.0.0
 * @apioption xAxis.plotLines.className
 */

/**
 * The color of the line.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-color/
 *         A red line from X axis
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type      {Highcharts.ColorString}
 * @default   ${palette.neutralColor40}
 * @apioption xAxis.plotLines.color
 */

/**
 * The dashing or dot style for the plot line. For possible values see
 * [this overview](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-dashstyle-all/).
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-dashstyle/
 *         Dash and dot pattern
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type      {Highcharts.DashStyleValue}
 * @default   Solid
 * @since     1.2
 * @apioption xAxis.plotLines.dashStyle
 */

/**
 * An object defining mouse events for the plot line. Supported
 * properties are `click`, `mouseover`, `mouseout`, `mousemove`.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-events/
 *         Mouse events demonstrated
 *
 * @since     1.2
 * @apioption xAxis.plotLines.events
 */

/**
 * Click event on a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotLines.events.click
 */

/**
 * Mouse move event on a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotLines.events.mousemove
 */

/**
 * Mouse out event on the corner of a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotLines.events.mouseout
 */

/**
 * Mouse over event on a plot band.
 *
 * @type      {Highcharts.EventCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotLines.events.mouseover
 */

/**
 * An id used for identifying the plot line in Axis.removePlotLine.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-id/
 *         Remove plot line by id
 *
 * @type      {string}
 * @apioption xAxis.plotLines.id
 */

/**
 * The position of the line in axis units.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-color/
 *         Between two categories on X axis
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type      {number}
 * @apioption xAxis.plotLines.value
 */

/**
 * The width or thickness of the plot line.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-color/
 *         2px wide line from X axis
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type      {number}
 * @default   2
 * @apioption xAxis.plotLines.width
 */

/**
 * The z index of the plot line within the chart.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-zindex-behind/
 *         Behind plot lines by default
 * @sample {highcharts} highcharts/xaxis/plotlines-zindex-above/
 *         Above plot lines
 * @sample {highcharts} highcharts/xaxis/plotlines-zindex-above-all/
 *         Above plot lines and series
 *
 * @type      {number}
 * @since     1.2
 * @apioption xAxis.plotLines.zIndex
 */

/**
 * Text labels for the plot bands
 *
 * @apioption xAxis.plotLines.label
 */

/**
 * Horizontal alignment of the label. Can be one of "left", "center" or
 * "right".
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-align-right/
 *         Aligned to the right
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type       {Highcharts.AlignValue}
 * @default    left
 * @since      2.1
 * @apioption  xAxis.plotLines.label.align
 */

/**
 * Whether to hide labels that are outside the plot area.
 *
 * @type      {boolean}
 * @default   false
 * @since 10.3.3
 * @apioption xAxis.plotLines.labels.clip
 */

/**
 * Callback JavaScript function to format the label. Useful properties like
 * the value of plot line or the range of plot band (`from` & `to`
 * properties) can be found in `this.options` object.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-plotbands-label-formatter
 *         Label formatters for plot line and plot band.
 * @type      {Highcharts.FormatterCallbackFunction<Highcharts.PlotLineOrBand>}
 * @apioption xAxis.plotLines.label.formatter
 */

/**
 * Rotation of the text label in degrees. Defaults to 0 for horizontal plot
 * lines and 90 for vertical lines.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-verticalalign-middle/
 *         Slanted text
 *
 * @type      {number}
 * @since     2.1
 * @apioption xAxis.plotLines.label.rotation
 */

/**
 * CSS styles for the text label.
 *
 * In styled mode, the labels are styled by the
 * `.highcharts-plot-line-label` class.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-style/
 *         Blue and bold label
 *
 * @type      {Highcharts.CSSObject}
 * @since     2.1
 * @apioption xAxis.plotLines.label.style
 */

/**
 * The text itself. A subset of HTML is supported.
 *
 * @type      {string}
 * @since     2.1
 * @apioption xAxis.plotLines.label.text
 */

/**
 * The text alignment for the label. While `align` determines where the
 * texts anchor point is placed within the plot band, `textAlign` determines
 * how the text is aligned against its anchor point. Possible values are
 * "left", "center" and "right". Defaults to the same as the `align` option.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-textalign/
 *         Text label in bottom position
 *
 * @type      {Highcharts.AlignValue}
 * @since     2.1
 * @apioption xAxis.plotLines.label.textAlign
 */

/**
 * Whether to [use HTML](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting#html)
 * to render the labels.
 *
 * @type      {boolean}
 * @default   false
 * @since     3.0.3
 * @apioption xAxis.plotLines.label.useHTML
 */

/**
 * Vertical alignment of the label relative to the plot line. Can be
 * one of "top", "middle" or "bottom".
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-verticalalign-middle/
 *         Vertically centered label
 *
 * @type       {Highcharts.VerticalAlignValue}
 * @default    {highcharts} top
 * @default    {highstock} top
 * @since      2.1
 * @apioption  xAxis.plotLines.label.verticalAlign
 */

/**
 * Horizontal position relative the alignment. Default varies by
 * orientation.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-align-right/
 *         Aligned 10px from the right edge
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type      {number}
 * @since     2.1
 * @apioption xAxis.plotLines.label.x
 */

/**
 * Vertical position of the text baseline relative to the alignment. Default
 * varies by orientation.
 *
 * @sample {highcharts} highcharts/xaxis/plotlines-label-y/
 *         Label below the plot line
 * @sample {highstock} stock/xaxis/plotlines/
 *         Plot line on Y axis
 *
 * @type      {number}
 * @since     2.1
 * @apioption xAxis.plotLines.label.y
 */

/**
 * @type      {Array<*>}
 * @extends   xAxis.plotBands
 * @apioption yAxis.plotBands
 */

/**
 * In a gauge chart, this option determines the inner radius of the
 * plot band that stretches along the perimeter. It can be given as
 * a percentage string, like `"100%"`, or as a pixel number, like `100`.
 * By default, the inner radius is controlled by the [thickness](
 * #yAxis.plotBands.thickness) option.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-gauge
 *         Gauge plot band
 *
 * @type      {number|string}
 * @since     2.3
 * @product   highcharts
 * @apioption yAxis.plotBands.innerRadius
 */

/**
 * In a gauge chart, this option determines the outer radius of the
 * plot band that stretches along the perimeter. It can be given as
 * a percentage string, like `"100%"`, or as a pixel number, like `100`.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-gauge
 *         Gauge plot band
 *
 * @type      {number|string}
 * @default   100%
 * @since     2.3
 * @product   highcharts
 * @apioption yAxis.plotBands.outerRadius
 */

/**
 * In a gauge chart, this option sets the width of the plot band
 * stretching along the perimeter. It can be given as a percentage
 * string, like `"10%"`, or as a pixel number, like `10`. The default
 * value 10 is the same as the default [tickLength](#yAxis.tickLength),
 * thus making the plot band act as a background for the tick markers.
 *
 * @sample {highcharts} highcharts/xaxis/plotbands-gauge
 *         Gauge plot band
 *
 * @type      {number|string}
 * @default   10
 * @since     2.3
 * @product   highcharts
 * @apioption yAxis.plotBands.thickness
 */

/**
 * @type      {Array<*>}
 * @extends   xAxis.plotLines
 * @apioption yAxis.plotLines
 */

(''); // keeps doclets above in JS file
