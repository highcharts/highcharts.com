/* *
 *
 *  (c) 2010-2021 Highsoft AS
 *
 *  Author: Paweł Potaczek
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

import type { AlignValue } from '../../Core/Renderer/AlignObject';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type BubbleSeries from './BubbleSeries';
import type { BubbleSizeByValue } from './BubbleSeriesOptions';
import type ColorType from '../../Core/Color/ColorType';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type Templating from '../../Core/Templating';
import type {
    LegendItemObject,
    LegendItem
} from '../../Core/Legend/LegendItem';
import type Point from '../../Core/Series/Point';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import Chart from '../../Core/Chart/Chart.js';
import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import F from '../../Core/Templating.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import Legend from '../../Core/Legend/Legend.js';
import Series from '../../Core/Series/Series.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    arrayMax,
    arrayMin,
    stableSort
} = AH;
const { isNumber } = TC;
const { merge } = OH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Legend/LegendLike' {
    interface LegendLike {
        bubbleLegend?: BubbleLegendItem;
    }
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        isBubble?: boolean;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        ignoreSeries?: boolean;
        isBubble?: boolean;
    }
}

declare module '../../Core/Legend/LegendOptions'{
    interface LegendOptions {
        bubbleLegend?: BubbleLegendItem.Options;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * BubbleLegend class.
 *
 * @private
 * @class
 * @name Highcharts.BubbleLegend
 * @param {Highcharts.LegendBubbleLegendOptions} options
 * Options of BubbleLegendItem.
 *
 * @param {Highcharts.Legend} legend
 * Legend of item.
 */
class BubbleLegendItem {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        options: BubbleLegendItem.Options,
        legend: Legend
    ) {
        this.init(options, legend);
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: Chart = void 0 as any;
    public legend: Legend = void 0 as any;
    public maxLabel: BBoxObject = void 0 as any;
    public movementX: number = void 0 as any;
    public ranges: Array<BubbleLegendItem.RangesOptions> = void 0 as any;
    public selected: undefined = void 0 as any;
    public visible: boolean = void 0 as any;
    public symbols: Record<string, Array<SVGElement>> = void 0 as any;
    public options: BubbleLegendItem.Options = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Create basic bubbleLegend properties similar to item in legend.
     * @private
     */
    public init(
        options: BubbleLegendItem.Options,
        legend: Legend
    ): void {
        this.options = options;
        this.visible = true;
        this.chart = legend.chart;
        this.legend = legend;
    }

    public setState = noop;

    /**
     * Depending on the position option, add bubbleLegend to legend items.
     *
     * @private
     *
     * @param {Array<(Highcharts.Point|Highcharts.Series)>} items
     *        All legend items
     */
    public addToLegend(items: Array<(Series|Point)>): void {
        // Insert bubbleLegend into legend items
        items.splice(this.options.legendIndex as any, 0, this as any);
    }

    /**
     * Calculate ranges, sizes and call the next steps of bubbleLegend
     * creation.
     *
     * @private
     *
     * @param {Highcharts.Legend} legend
     *        Legend instance
     */
    public drawLegendSymbol(legend: Legend): void {
        const chart = this.chart,
            itemDistance = pick(legend.options.itemDistance, 20),
            legendItem = this.legendItem || {},
            options = this.options,
            ranges =
                options.ranges as Array<BubbleLegendItem.RangesOptions>,
            connectorDistance = options.connectorDistance;

        let connectorSpace;

        // Do not create bubbleLegend now if ranges or ranges valeus are not
        // specified or if are empty array.
        if (!ranges || !ranges.length || !isNumber(ranges[0].value)) {
            (legend.options.bubbleLegend as any).autoRanges = true;
            return;
        }

        // Sort ranges to right render order
        stableSort(ranges, function (
            a: BubbleLegendItem.RangesOptions,
            b: BubbleLegendItem.RangesOptions
        ): number {
            return b.value - a.value;
        });

        this.ranges = ranges;

        this.setOptions();
        this.render();

        // Get max label size
        const maxLabel = this.getMaxLabelSize(),
            radius = this.ranges[0].radius,
            size = (radius as any) * 2;

        // Space for connectors and labels.
        connectorSpace =
            (connectorDistance as any) - (radius as any) + maxLabel.width;
        connectorSpace = connectorSpace > 0 ? connectorSpace : 0;

        this.maxLabel = maxLabel;
        this.movementX = (options.labels as any).align === 'left' ?
            connectorSpace : 0;

        legendItem.labelWidth = size + connectorSpace + itemDistance;
        legendItem.labelHeight = size + maxLabel.height / 2;
    }

    /**
     * Set style options for each bubbleLegend range.
     * @private
     */
    public setOptions(): void {
        const ranges = this.ranges,
            options = this.options,
            series = this.chart.series[options.seriesIndex as any],
            baseline = this.legend.baseline,
            bubbleAttribs: SVGAttributes = {
                zIndex: options.zIndex,
                'stroke-width': options.borderWidth
            },
            connectorAttribs: SVGAttributes = {
                zIndex: options.zIndex,
                'stroke-width': options.connectorWidth
            },
            labelAttribs: SVGAttributes = {
                align: (
                    this.legend.options.rtl ||
                    (options.labels as any).align === 'left'
                ) ? 'right' : 'left',
                zIndex: options.zIndex
            },
            fillOpacity = (series.options.marker as any).fillOpacity,
            styledMode = this.chart.styledMode;

        // Allow to parts of styles be used individually for range
        ranges.forEach(function (
            range: BubbleLegendItem.RangesOptions,
            i: number
        ): void {
            if (!styledMode) {
                bubbleAttribs.stroke = pick(
                    range.borderColor,
                    options.borderColor,
                    series.color
                );
                bubbleAttribs.fill = pick(
                    range.color,
                    options.color,
                    fillOpacity !== 1 ?
                        color(series.color).setOpacity(fillOpacity)
                            .get('rgba') :
                        series.color
                );
                connectorAttribs.stroke = pick(
                    range.connectorColor,
                    options.connectorColor,
                    series.color
                );
            }

            // Set options needed for rendering each range
            ranges[i].radius = this.getRangeRadius(range.value);
            ranges[i] = merge(ranges[i], {
                center: (
                    (ranges[0].radius as any) - (ranges[i].radius as any) +
                    (baseline as any)
                )
            });

            if (!styledMode) {
                merge(true, ranges[i], {
                    bubbleAttribs: merge(bubbleAttribs),
                    connectorAttribs: merge(connectorAttribs),
                    labelAttribs: labelAttribs
                });
            }
        }, this);
    }

    /**
     * Calculate radius for each bubble range,
     * used code from BubbleSeries.js 'getRadius' method.
     *
     * @private
     *
     * @param {number} value
     *        Range value
     *
     * @return {number|null}
     *         Radius for one range
     */
    public getRangeRadius(value: number): (number|null) {
        const options = this.options,
            seriesIndex = this.options.seriesIndex,
            bubbleSeries: BubbleSeries = this.chart.series[
                seriesIndex as any
            ] as any,
            zMax = (options.ranges as any)[0].value,
            zMin = (options.ranges as any)[
                (options.ranges as any).length - 1
            ].value,
            minSize = options.minSize,
            maxSize = options.maxSize;

        return bubbleSeries.getRadius.call(
            this,
            zMin,
            zMax,
            minSize as any,
            maxSize as any,
            value
        );
    }

    /**
     * Render the legendItem group.
     * @private
     */
    public render(): void {
        const legendItem = this.legendItem || {},
            renderer = this.chart.renderer,
            zThreshold = this.options.zThreshold;


        if (!this.symbols) {
            this.symbols = {
                connectors: [],
                bubbleItems: [],
                labels: []
            };
        }
        // Nesting SVG groups to enable handleOverflow
        legendItem.symbol = renderer.g('bubble-legend');
        legendItem.label = renderer.g('bubble-legend-item')
            .css(this.legend.itemStyle || {});

        // To enable default 'hideOverlappingLabels' method
        legendItem.symbol.translateX = 0;
        legendItem.symbol.translateY = 0;

        // To use handleOverflow method
        legendItem.symbol.add(legendItem.label);
        legendItem.label.add(legendItem.group);

        for (const range of this.ranges) {
            if (range.value >= (zThreshold as any)) {
                this.renderRange(range);
            }
        }

        this.hideOverlappingLabels();
    }

    /**
     * Render one range, consisting of bubble symbol, connector and label.
     *
     * @private
     *
     * @param {Highcharts.LegendBubbleLegendRangesOptions} range
     *        Range options
     */
    public renderRange(range: BubbleLegendItem.RangesOptions): void {
        const mainRange = this.ranges[0],
            legend = this.legend,
            options = this.options,
            labelsOptions = options.labels as any,
            chart = this.chart,
            bubbleSeries: BubbleSeries = chart.series[
                options.seriesIndex as any
            ] as any,
            renderer = chart.renderer,
            symbols = this.symbols,
            labels = symbols.labels,
            elementCenter = range.center,
            absoluteRadius = Math.abs(range.radius as any),
            connectorDistance = options.connectorDistance || 0,
            labelsAlign = (labelsOptions as any).align,
            rtl = legend.options.rtl,
            borderWidth = options.borderWidth,
            connectorWidth = options.connectorWidth,
            posX = mainRange.radius || 0,
            posY = (elementCenter as any) - absoluteRadius -
                (borderWidth as any) / 2 + (connectorWidth as any) / 2,
            crispMovement = (posY % 1 ? 1 : 0.5) -
                ((connectorWidth as any) % 2 ? 0 : 0.5),
            styledMode = renderer.styledMode;
        let connectorLength = rtl || labelsAlign === 'left' ?
            -connectorDistance : connectorDistance;

        // Set options for centered labels
        if (labelsAlign === 'center') {
            connectorLength = 0; // do not use connector
            options.connectorDistance = 0;
            (range.labelAttribs as any).align = 'center';
        }

        // Render bubble symbol
        symbols.bubbleItems.push(
            renderer
                .circle(
                    posX,
                    (elementCenter as any) + crispMovement,
                    absoluteRadius
                )
                .attr(
                    styledMode ? {} : range.bubbleAttribs
                )
                .addClass(
                    (
                        styledMode ?
                            'highcharts-color-' +
                                bubbleSeries.colorIndex + ' ' :
                            ''
                    ) +
                    'highcharts-bubble-legend-symbol ' +
                    (options.className || '')
                ).add(
                    this.legendItem.symbol
                )
        );

        // Render connector
        symbols.connectors.push(
            renderer
                .path(renderer.crispLine(
                    [
                        ['M', posX, posY],
                        ['L', posX + connectorLength, posY]
                    ],
                    options.connectorWidth as any
                ))
                .attr(
                    (styledMode ? {} : range.connectorAttribs)
                )
                .addClass(
                    (
                        styledMode ?
                            'highcharts-color-' +
                                this.options.seriesIndex + ' ' : ''
                    ) +
                    'highcharts-bubble-legend-connectors ' +
                    (options.connectorClassName || '')
                ).add(
                    this.legendItem.symbol
                )
        );

        // Render label
        const label = renderer
            .text(this.formatLabel(range))
            .attr(
                (styledMode ? {} : range.labelAttribs)
            )
            .css(styledMode ? {} : (labelsOptions as any).style)
            .addClass(
                'highcharts-bubble-legend-labels ' +
                ((options.labels as any).className || '')
            ).add(
                this.legendItem.symbol
            );

        // Now that the label is added we can read the bounding box and
        // vertically align
        const position = {
            x: posX + connectorLength + (options.labels as any).x,
            y: posY + (options.labels as any).y + label.getBBox().height * 0.4
        };

        label.attr(position);

        labels.push(label);
        // To enable default 'hideOverlappingLabels' method
        label.placed = true;
        label.alignAttr = position;
    }

    /**
     * Get the label which takes up the most space.
     * @private
     */
    public getMaxLabelSize(): BBoxObject {
        const labels = this.symbols.labels;
        let maxLabel: (BBoxObject|undefined),
            labelSize: BBoxObject;

        labels.forEach(function (label: SVGElement): void {
            labelSize = label.getBBox(true);

            if (maxLabel) {
                maxLabel = labelSize.width > maxLabel.width ?
                    labelSize : maxLabel;

            } else {
                maxLabel = labelSize;
            }
        });
        return maxLabel || ({} as any);
    }

    /**
     * Get formatted label for range.
     *
     * @private
     *
     * @param {Highcharts.LegendBubbleLegendRangesOptions} range
     *        Range options
     *
     * @return {string}
     *         Range label text
     */
    public formatLabel(range: BubbleLegendItem.RangesOptions): string {
        const options = this.options,
            formatter = (options.labels as any).formatter,
            format = (options.labels as any).format;
        const { numberFormatter } = this.chart;

        return format ? F.format(format, range) :
            formatter ? formatter.call(range) :
                numberFormatter(range.value, 1);
    }

    /**
     * By using default chart 'hideOverlappingLabels' method, hide or show
     * labels and connectors.
     * @private
     */
    public hideOverlappingLabels(): void {
        const chart = this.chart,
            allowOverlap = (this.options.labels as any).allowOverlap,
            symbols = this.symbols;

        if (!allowOverlap && symbols) {
            chart.hideOverlappingLabels(symbols.labels);

            // Hide or show connectors
            symbols.labels.forEach(function (
                label: SVGElement,
                index: number
            ): void {
                if (!label.newOpacity) {
                    symbols.connectors[index].hide();
                } else if (label.newOpacity !== label.oldOpacity) {
                    symbols.connectors[index].show();
                }
            });
        }
    }

    /**
     * Calculate ranges from created series.
     *
     * @private
     *
     * @return {Array<Highcharts.LegendBubbleLegendRangesOptions>}
     *         Array of range objects
     */
    public getRanges(): Array<BubbleLegendItem.RangesOptions> {
        const bubbleLegend = this.legend.bubbleLegend,
            series = (bubbleLegend as any).chart.series,
            rangesOptions = (bubbleLegend as any).options.ranges;
        let ranges: Array<BubbleLegendItem.RangesOptions>,
            zData,
            minZ = Number.MAX_VALUE,
            maxZ = -Number.MAX_VALUE;

        series.forEach(function (s: BubbleSeries): void {
            // Find the min and max Z, like in bubble series
            if (s.isBubble && !s.ignoreSeries) {
                zData = s.zData.filter(isNumber);

                if (zData.length) {
                    minZ = pick(s.options.zMin, Math.min(
                        minZ,
                        Math.max(
                            arrayMin(zData),
                            s.options.displayNegative === false ?
                                (s.options.zThreshold as any) :
                                -Number.MAX_VALUE
                        )
                    ));
                    maxZ = pick(
                        s.options.zMax,
                        Math.max(maxZ, arrayMax(zData))
                    );
                }
            }
        });

        // Set values for ranges
        if (minZ === maxZ) {
            // Only one range if min and max values are the same.
            ranges = [{ value: maxZ }];
        } else {
            ranges = [
                { value: minZ },
                { value: (minZ + maxZ) / 2 },
                { value: maxZ, autoRanges: true }
            ];
        }
        // Prevent reverse order of ranges after redraw
        if (rangesOptions.length && rangesOptions[0].radius) {
            ranges.reverse();
        }

        // Merge ranges values with user options
        ranges.forEach(function (
            range: BubbleLegendItem.RangesOptions,
            i: number
        ): void {
            if (rangesOptions && rangesOptions[i]) {
                ranges[i] = merge(rangesOptions[i], range);
            }
        });

        return ranges;
    }

    /**
     * Calculate bubble legend sizes from rendered series.
     *
     * @private
     *
     * @return {Array<number,number>}
     *         Calculated min and max bubble sizes
     */
    public predictBubbleSizes(): [number, number] {
        const chart = this.chart,
            legendOptions = chart.legend.options,
            floating = legendOptions.floating,
            horizontal = legendOptions.layout === 'horizontal',
            lastLineHeight = horizontal ? chart.legend.lastLineHeight : 0,
            plotSizeX = chart.plotSizeX,
            plotSizeY = chart.plotSizeY,
            bubbleSeries: BubbleSeries = chart.series[
                this.options.seriesIndex as any
            ] as any,
            pxSizes = bubbleSeries.getPxExtremes(),
            minSize = Math.ceil(pxSizes.minPxSize),
            maxPxSize = Math.ceil(pxSizes.maxPxSize),
            plotSize = Math.min(plotSizeY as any, plotSizeX as any);
        let calculatedSize,
            maxSize = bubbleSeries.options.maxSize;

        // Calculate prediceted max size of bubble
        if (floating || !(/%$/.test(maxSize as any))) {
            calculatedSize = maxPxSize;

        } else {
            maxSize = parseFloat(maxSize as any);

            calculatedSize = ((plotSize + lastLineHeight) * maxSize / 100) /
                (maxSize / 100 + 1);

            // Get maxPxSize from bubble series if calculated bubble legend
            // size will not affect to bubbles series.
            if (
                (horizontal && (plotSizeY as any) - calculatedSize >=
               (plotSizeX as any)) || (!horizontal && (plotSizeX as any) -
               calculatedSize >= (plotSizeY as any))
            ) {
                calculatedSize = maxPxSize;
            }
        }

        return [minSize, Math.ceil(calculatedSize)];
    }

    /**
     * Correct ranges with calculated sizes.
     * @private
     */
    public updateRanges(min: number, max: number): void {
        const bubbleLegendOptions = this.legend.options.bubbleLegend;

        (bubbleLegendOptions as any).minSize = min;
        (bubbleLegendOptions as any).maxSize = max;
        (bubbleLegendOptions as any).ranges = this.getRanges();
    }

    /**
     * Because of the possibility of creating another legend line, predicted
     * bubble legend sizes may differ by a few pixels, so it is necessary to
     * correct them.
     * @private
     */
    public correctSizes(): void {
        const legend = this.legend,
            chart = this.chart,
            bubbleSeries: BubbleSeries = chart.series[
                this.options.seriesIndex as any
            ] as any,
            pxSizes = bubbleSeries.getPxExtremes(),
            bubbleSeriesSize = pxSizes.maxPxSize,
            bubbleLegendSize = this.options.maxSize;

        if (Math.abs(Math.ceil(bubbleSeriesSize) - (bubbleLegendSize as any)) >
            1
        ) {
            this.updateRanges(
                this.options.minSize as any,
                pxSizes.maxPxSize
            );
            legend.render();
        }
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface BubbleLegendItem extends LegendItem {
    legendItem: LegendItemObject;
}

/* *
 *
 * Class Namespace
 *
 * */

namespace BubbleLegendItem {
    export interface FormatterContextObject {
        center: number;
        radius: (number|null);
        value: number;
    }
    export interface LabelsOptions {
        align?: AlignValue;
        allowOverlap?: boolean;
        className?: string;
        format?: string;
        formatter?: Templating.FormatterCallback<FormatterContextObject>;
        style?: CSSObject;
        x?: number;
        y?: number;
    }
    export interface Options {
        borderColor?: ColorType;
        borderWidth?: number;
        className?: string;
        color?: ColorType;
        connectorClassName?: string;
        connectorColor?: ColorType;
        connectorDistance?: number;
        connectorWidth?: number;
        enabled?: boolean;
        labels?: LabelsOptions;
        legendIndex?: number;
        maxSize?: number;
        minSize?: number;
        placed?: boolean;
        ranges?: Array<RangesOptions>;
        seriesIndex?: number;
        sizeBy?: BubbleSizeByValue;
        sizeByAbsoluteValue?: boolean;
        zIndex?: number;
        zThreshold?: number;
    }
    export interface RangesOptions extends Partial<FormatterContextObject> {
        autoRanges?: boolean;
        borderColor?: ColorType;
        color?: ColorType;
        connectorColor?: ColorType;
        bubbleAttribs?: SVGAttributes;
        connectorAttribs?: SVGAttributes;
        labelAttribs?: SVGAttributes;
        value?: any;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default BubbleLegendItem;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * @interface Highcharts.BubbleLegendFormatterContextObject
 *//**
 * The center y position of the range.
 * @name Highcharts.BubbleLegendFormatterContextObject#center
 * @type {number}
 *//**
 * The radius of the bubble range.
 * @name Highcharts.BubbleLegendFormatterContextObject#radius
 * @type {number}
 *//**
 * The bubble value.
 * @name Highcharts.BubbleLegendFormatterContextObject#value
 * @type {number}
 */

''; // detach doclets above
