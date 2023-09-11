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

import type Legend from './Legend';
import type LegendItem from './LegendItem';
import type Point from '../Series/Point';
import type Series from '../Series/Series';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';
import type SymbolOptions from '../Renderer/SVG/SymbolOptions';

import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend,
    merge
} = OH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Axis/AxisLike' {
    interface AxisLike extends LegendItem {
        // nothing to add
    }
}

declare module '../Series/PointLike' {
    interface PointLike extends LegendItem {
        // nothing to add
    }
}

declare module '../Series/SeriesLike' {
    interface SeriesLike extends LegendItem {
        drawLegendSymbol: (
            legend: Legend,
            item: (Point|Series)
        ) => void;
    }
}

/* *
 *
 *  Namespace
 *
 * */

namespace LegendSymbol {
    /* *
    *
    *  Functions
    *
    * */

    /* eslint-disable valid-jsdoc */

    /**
     * Get the series' symbol in the legend.
     *
     * This method should be overridable to create custom symbols through
     * Highcharts.seriesTypes[type].prototype.drawLegendSymbol.
     *
     * @private
     * @function Highcharts.LegendSymbolMixin.lineMarker
     *
     * @param {Highcharts.Legend} legend
     * The legend object.
     */
    export function lineMarker(
        this: Series,
        legend: Legend,
        item?: LegendItem
    ): void {

        const legendItem = this.legendItem = this.legendItem || {},
            options = this.options,
            symbolWidth = legend.symbolWidth,
            symbolHeight = legend.symbolHeight,
            generalRadius = symbolHeight / 2,
            renderer = this.chart.renderer,
            legendItemGroup = legendItem.group,
            verticalCenter = (legend.baseline as any) -
                Math.round((legend.fontMetrics as any).b * 0.3);

        let attr: SVGAttributes = {},
            legendSymbol,
            markerOptions = options.marker,
            lineSizer = 0;

        // Draw the line
        if (!this.chart.styledMode) {
            attr = {
                'stroke-width': Math.min(options.lineWidth || 0, 24)
            };

            if (options.dashStyle) {
                attr.dashstyle = options.dashStyle;
            } else if (options.linecap !== 'square') {
                attr['stroke-linecap'] = 'round';
            }
        }

        legendItem.line = renderer
            .path()
            .addClass('highcharts-graph')
            .attr(attr)
            .add(legendItemGroup);

        if (attr['stroke-linecap']) {
            lineSizer = Math.min(
                legendItem.line.strokeWidth(),
                symbolWidth
            ) / 2;
        }

        if (symbolWidth) {
            legendItem.line
                .attr({
                    d: [
                        ['M', lineSizer, verticalCenter],
                        ['L', symbolWidth - lineSizer, verticalCenter]
                    ]
                });
        }

        // Draw the marker
        if (markerOptions && markerOptions.enabled !== false && symbolWidth) {

            // Do not allow the marker to be larger than the symbolHeight
            let radius = Math.min(
                pick(markerOptions.radius, generalRadius),
                generalRadius
            );

            // Restrict symbol markers size
            if ((this.symbol as any).indexOf('url') === 0) {
                markerOptions = merge(markerOptions, {
                    width: symbolHeight,
                    height: symbolHeight
                });
                radius = 0;
            }

            legendItem.symbol = legendSymbol = renderer
                .symbol(
                    this.symbol as any,
                    (symbolWidth / 2) - radius,
                    verticalCenter - radius,
                    2 * radius,
                    2 * radius,
                    extend<SymbolOptions>({ context: 'legend' }, markerOptions)
                )
                .addClass('highcharts-point')
                .add(legendItemGroup);
            legendSymbol.isMarker = true;
        }
    }

    /**
     * Get the series' symbol in the legend.
     *
     * This method should be overridable to create custom symbols through
     * Highcharts.seriesTypes[type].prototype.drawLegendSymbol.
     *
     * @private
     * @function Highcharts.LegendSymbolMixin.rectangle
     *
     * @param {Highcharts.Legend} legend
     * The legend object
     *
     * @param {Highcharts.Point|Highcharts.Series} item
     * The series (this) or point
     */
    export function rectangle(
        this: Series,
        legend: Legend,
        item: LegendItem
    ): void {
        const legendItem = item.legendItem || {},
            options = legend.options,
            symbolHeight = legend.symbolHeight,
            square = options.squareSymbol,
            symbolWidth = square ? symbolHeight : legend.symbolWidth;

        legendItem.symbol = this.chart.renderer
            .rect(
                square ? (legend.symbolWidth - symbolHeight) / 2 : 0,
                (legend.baseline as any) - symbolHeight + 1, // #3988
                symbolWidth,
                symbolHeight,
                pick(legend.options.symbolRadius, symbolHeight / 2)
            )
            .addClass('highcharts-point')
            .attr({
                zIndex: 3
            })
            .add(legendItem.group);

    }

}

/* *
 *
 *  Default Export
 *
 * */

export default LegendSymbol;
