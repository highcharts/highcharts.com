/* *
 *
 *  (c) 2014-2024 Highsoft AS
 *
 *  Authors: Jon Arild Nygard / Oystein Moseng
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type {
    AlignValue,
    VerticalAlignValue
} from '../../Core/Renderer/AlignObject';
import type BreadcrumbsOptions from '../../Extensions/Breadcrumbs/BreadcrumbsOptions';
import type ButtonThemeObject from '../../Core/Renderer/SVG/ButtonThemeObject';
import type ColorString from '../../Core/Color/ColorString';
import type ColorType from '../../Core/Color/ColorType';
import type GradientColor from '../../Core/Color/GradientColor';
import { PatternObject } from '../../Extensions/PatternFill';
import type DashStyleValue from '../../Core/Renderer/DashStyleValue';
import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type { PointMarkerOptions } from '../../Core/Series/PointOptions';
import type ScatterSeriesOptions from '../Scatter/ScatterSeriesOptions';
import type {
    SeriesOptions,
    SeriesStatesOptions,
    LegendSymbolType
} from '../../Core/Series/SeriesOptions';
import type TooltipOptions from '../../Core/TooltipOptions';
import type TreemapPointOptions from './TreemapPointOptions';
import type TreemapSeries from './TreemapSeries';
import MarkerClusterOptions from '../../Extensions/MarkerClusters/MarkerClusterOptions';

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        cropThreshold?: number;
    }
}

export type TreemapSeriesLayoutAlgorithmValue = (
    'sliceAndDice'|'stripes'|'squarified'|'strip'
);

export type TreemapSeriesLayoutStartingDirectionValue = (
    'vertical'|'horizontal'
);


/**
 * A configuration object to define how the color of a child varies from
 * the parent's color. The variation is distributed among the children
 * of node. For example when setting brightness, the brightness change
 * will range from the parent's original brightness on the first child,
 * to the amount set in the `to` setting on the last node. This allows a
 * gradient-like color scheme that sets children out from each other
 * while highlighting the grouping on treemaps and sectors on sunburst
 * charts.
 *
 * @sample highcharts/demo/sunburst/
 *         Sunburst with color variation
 *
 * @sample highcharts/series-treegraph/color-variation
 *         Treegraph nodes with color variation
 *
 * @since 6.0.0
 *
 * @product highcharts
 */
export interface TreemapSeriesLevelColorVariationOptions {

    /**
     * The key of a color variation. Currently supports `brightness` only.
     *
     * @type {string}
     *
     * @since 6.0.0
     *
     * @product highcharts
     *
     * @validvalue ["brightness"]
     */
    key?: string;

    /**
     * The ending value of a color variation. The last sibling will receive
     * this value.
     *
     * @type {number}
     *
     * @since 6.0.0
     *
     * @product highcharts
     */
    to?: number;
}

export interface TreemapSeriesClusterOptions extends MarkerClusterOptions {
    /**
     * An additional, individual class name for the grouped point's graphic
     * representation.
     *
     * @type      string
     * @product   highcharts
     */
    className?: string;

    /**
     * Individual color for the grouped point. By default the color is pulled
     * from the parent color.
     *
     * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     * @product   highcharts
     */
    color?: ColorString|GradientColor|PatternObject;

    /**
     * Enable or disable Treemap grouping.
     *
     * @type {boolean}
     * @since 12.1.0
     * @product highcharts
     */
    enabled: boolean;

    /**
     * The pixel threshold width of area, which is used in Treemap grouping.
     *
     * @type {number}
     * @since 12.1.0
     * @product highcharts
     */
    pixelWidth?: number;

    /**
     * The pixel threshold height of area, which is used in Treemap grouping.
     *
     * @type {number}
     * @since 12.1.0
     * @product highcharts
     */
    pixelHeight?: number;

    /**
     * The name of the point of grouped nodes shown in the tooltip, dataLabels,
     * etc. By default it is set to '+ n', where n is number of grouped points.
     *
     * @type {string}
     * @since 12.1.0
     * @product highcharts
     */
    name?: string;

    /**
     * A configuration property that specifies the factor by which the value
     * and size of a grouped node are reduced. This can be particularly useful
     * when a grouped node occupies a disproportionately large portion of the
     * graph, ensuring better visual balance and readability.
     *
     * @type {number}
     * @since 12.1.0
     * @product highcharts
     */
    reductionFactor?: number;

    /**
     * Defines the minimum number of child nodes required to create a group of
     * small nodes.
     *
     * @type {number}
     * @since 12.1.0
     * @product highcharts
     */
    minimumClusterSize?: number;
}


/**
 * Set options on specific levels. Takes precedence over series options,
 * but not point options.
 *
 * @sample {highcharts} highcharts/plotoptions/treemap-levels/
 *         Styling dataLabels and borders
 *
 * @sample {highcharts} highcharts/demo/treemap-with-levels/
 *         Different layoutAlgorithm
 *
 * @since 4.1.0
 *
 * @product highcharts
 *
 * @optionparent plotOptions.treemap.levels
 */
export interface TreemapSeriesLevelOptions extends Omit<SeriesOptions, ('data'|'levels')> {

    /**
     * Can set a `borderColor` on all points which lies on the same level.
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    borderColor?: ColorString;

    /**
     * Set the dash style of the border of all the point which lies on the
     * level. See
     * [plotOptions.scatter.dashStyle](#plotoptions.scatter.dashstyle)
     * for possible options.
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    borderDashStyle?: DashStyleValue;

    borderRadius?: number;

    /**
     * Can set the borderWidth on all points which lies on the same level.
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    borderWidth?: number;

    /**
     * Can set a color on all points which lies on the same level.
     *
     * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    color?: ColorType;

    /**
     * A configuration object to define how the color of a child varies from
     * the parent's color. The variation is distributed among the children
     * of node. For example when setting brightness, the brightness change
     * will range from the parent's original brightness on the first child,
     * to the amount set in the `to` setting on the last node. This allows a
     * gradient-like color scheme that sets children out from each other
     * while highlighting the grouping on treemaps and sectors on sunburst
     * charts.
     *
     * @sample highcharts/demo/sunburst/
     *         Sunburst with color variation
     *
     * @sample highcharts/series-treegraph/color-variation
     *         Treegraph nodes with color variation
     *
     * @since 6.0.0
     *
     * @product highcharts
     */
    colorVariation?: TreemapSeriesLevelColorVariationOptions;

    /**
     * Can set the options of dataLabels on each point which lies on the
     * level.
     * [plotOptions.treemap.dataLabels](#plotOptions.treemap.dataLabels) for
     * possible values.
     *
     * @extends plotOptions.treemap.dataLabels
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    dataLabels?: Partial<DataLabelOptions>;

    /**
     * Can set the layoutAlgorithm option on a specific level.
     *
     * @since 4.1.0
     *
     * @product highcharts
     *
     * @validvalue ["sliceAndDice", "stripes", "squarified", "strip"]
     */
    layoutAlgorithm?: TreemapSeriesLayoutAlgorithmValue;

    /**
     * Can set the layoutStartingDirection option on a specific level.
     *
     * @since 4.1.0
     *
     * @product highcharts
     *
     * @validvalue ["vertical", "horizontal"]
     */
    layoutStartingDirection?: TreemapSeriesLayoutStartingDirectionValue;

    /**
     * Decides which level takes effect from the options set in the levels
     * object.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-levels/
     *         Styling of both levels
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    level?: number;

}


/**
 * A treemap displays hierarchical data using nested rectangles. The data
 * can be laid out in varying ways depending on options.
 *
 * A `treemap` series. If the [type](#series.treemap.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @sample highcharts/demo/treemap-large-dataset/
 *         Treemap
 *
 * @extends plotOptions.scatter
 *
 * @extends series,plotOptions.treemap
 *
 * @excluding connectEnds, connectNulls, dataSorting, dragDrop,
 *  jitter, marker
 *
 * @excluding dataParser, dataURL, stack, dataSorting
 *
 * @product highcharts
 *
 * @requires modules/treemap
 */
export interface TreemapSeriesOptions extends ScatterSeriesOptions {

    /**
     * When enabled the user can click on a point which is a parent and
     * zoom in on its children. Deprecated and replaced by
     * [allowTraversingTree](#plotOptions.treemap.allowTraversingTree).
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-allowdrilltonode/
     *         Enabled
     *
     * @deprecated
     *
     * @type {boolean}
     *
     * @default false
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    allowDrillToNode?: boolean;

    /**
     * When enabled the user can click on a point which is a parent and
     * zoom in on its children.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-allowtraversingtree/
     *         Enabled
     *
     * @since 7.0.3
     *
     * @product highcharts
     */
    allowTraversingTree?: boolean;

    /**
     * Enabling this option will make the treemap alternate the drawing
     * direction between vertical and horizontal. The next levels starting
     * direction will always be the opposite of the previous.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-alternatestartingdirection-true/
     *         Enabled
     *
     * @since 4.1.0
     */
    alternateStartingDirection?: boolean;

    /**
     * The color of the border surrounding each tree map item.
     */
    borderColor?: ColorString;

    borderDashStyle?: DashStyleValue;

    /**
     * The border radius for each treemap item.
     */
    borderRadius?: number;

    /**
     * The width of the border surrounding each tree map item.
     */
    borderWidth?: number;

    /**
     * Options for the breadcrumbs, the navigation at the top leading the
     * way up through the traversed levels.
     *
     * @since 10.0.0
     *
     * @product highcharts
     *
     * @extends navigation.breadcrumbs
     */
    breadcrumbs?: BreadcrumbsOptions;

    brightness?: number;

    /**
     * When using automatic point colors pulled from the `options.colors`
     * collection, this option determines whether the chart should receive
     * one color per series or one color per point.
     *
     * @see [series colors](#plotOptions.treemap.colors)
     *
     * @since 2.0
     *
     * @product highcharts
     */
    colorByPoint?: boolean;

    colorKey?: string;

    /**
     * A series specific or series type specific color set to apply instead
     * of the global [colors](#colors) when
     * [colorByPoint](#plotOptions.treemap.colorByPoint) is true.
     *
     * @type {Array<Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject>}
     *
     * @since 3.0
     *
     * @product highcharts
     */
    colors?: Array<ColorType>;

    /**
     * When the series contains less points than the crop threshold, all
     * points are drawn, event if the points fall outside the visible plot
     * area at the current zoom. The advantage of drawing all points
     * (including markers and columns), is that animation is performed on
     * updates. On the other hand, when the series contains more points than
     * the crop threshold, the series data is cropped to only contain points
     * that fall within the plot area. The advantage of cropping away
     * invisible points is to increase performance on large series.
     *
     * @default 300
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    cropThreshold?: number;

    /**
     * An array of data points for the series. For the `treemap` series
     * type, points can be given in the following ways:
     *
     * 1. An array of numerical values. In this case, the numerical values will
     *  be
     *    interpreted as `value` options. Example:
     *    ```js
     *    data: [0, 5, 3, 5]
     *    ```
     *
     * 2. An array of objects with named values. The following snippet shows
     *  only a
     *    few settings, see the complete options set below. If the total number
     *  of
     *    data points exceeds the series'
     *    [turboThreshold](#series.treemap.turboThreshold),
     *    this option is not available.
     *    ```js
     *      data: [{
     *        value: 9,
     *        name: "Point2",
     *        color: "#00FF00"
     *      }, {
     *        value: 6,
     *        name: "Point1",
     *        color: "#FF00FF"
     *      }]
     *    ```
     *
     * @sample {highcharts} highcharts/chart/reflow-true/
     *         Numerical values
     *
     * @sample {highcharts} highcharts/series/data-array-of-objects/
     *         Config objects
     *
     * @type {Array<number|null|*>}
     *
     * @extends series.heatmap.data
     *
     * @excluding x, y, pointPadding
     *
     * @product highcharts
     */
    data?: Array<(number|null|TreemapPointOptions)>;

    /**
     * @since 4.1.0
     */
    dataLabels?: (DataLabelOptions|Array<DataLabelOptions>);

    drillUpButton?: TreemapSeriesUpButtonOptions;

    /**
     * An option to optimize treemap series rendering by grouping smaller leaf
     * nodes below a certain square area threshold in pixels. If the square area
     * of a point becomes smaller than the specified threshold, determined by
     * the `pixelWidth` and/or `pixelHeight` options, then this point is moved
     * into group point per series.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-grouping-simple
     *         Simple demo of Treemap grouping
     * @sample {highcharts} highcharts/plotoptions/treemap-grouping-multiple-parents
     *         Treemap grouping with multiple parents
     * @sample {highcharts} highcharts/plotoptions/treemap-grouping-advanced
     *         Advanced demo of Treemap grouping
     *
     * @since 12.1.0
     *
     * @excluding allowOverlap, animation, dataLabels, drillToCluster, events,
     * layoutAlgorithm, marker, states, zones
     *
     * @product highcharts
     */
    cluster?: TreemapSeriesClusterOptions;

    /**
     * Whether to ignore hidden points when the layout algorithm runs.
     * If `false`, hidden points will leave open spaces.
     *
     * @since 5.0.8
     */
    ignoreHiddenPoint?: boolean;

    /**
     * This option decides if the user can interact with the parent nodes
     * or just the leaf nodes. When this option is undefined, it will be
     * true by default. However when allowTraversingTree is true, then it
     * will be false by default.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-interactbyleaf-false/
     *         False
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-interactbyleaf-true-and-allowtraversingtree/
     *         InteractByLeaf and allowTraversingTree is true
     *
     * @since 4.1.2
     *
     * @product highcharts
     */
    interactByLeaf?: boolean;

    /**
     * This option decides which algorithm is used for setting position
     * and dimensions of the points.
     *
     * @see [How to write your own algorithm](https://www.highcharts.com/docs/chart-and-series-types/treemap)
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-layoutalgorithm-sliceanddice/
     *         SliceAndDice by default
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-layoutalgorithm-stripes/
     *         Stripes
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-layoutalgorithm-squarified/
     *         Squarified
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-layoutalgorithm-strip/
     *         Strip
     *
     * @since 4.1.0
     *
     * @validvalue ["sliceAndDice", "stripes", "squarified", "strip"]
     */
    layoutAlgorithm?: TreemapSeriesLayoutAlgorithmValue;

    /**
     * Defines which direction the layout algorithm will start drawing.
     *
     * @since 4.1.0
     *
     * @validvalue ["vertical", "horizontal"]
     */
    layoutStartingDirection?: TreemapSeriesLayoutStartingDirectionValue;

    legendSymbol?: LegendSymbolType;

    /**
     * Used together with the levels and allowTraversingTree options. When
     * set to false the first level visible to be level one, which is
     * dynamic when traversing the tree. Otherwise the level will be the
     * same as the tree structure.
     *
     * @since 4.1.0
     */
    levelIsConstant?: boolean;

    /**
     * Set options on specific levels. Takes precedence over series options,
     * but not point options.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-levels/
     *         Styling dataLabels and borders
     *
     * @sample {highcharts} highcharts/demo/treemap-with-levels/
     *         Different layoutAlgorithm
     *
     * @since 4.1.0
     *
     * @product highcharts
     */
    levels?: Array<TreemapSeriesLevelOptions>;

    marker?: PointMarkerOptions;

    /**
     * The opacity of a point in treemap. When a point has children, the
     * visibility of the children is determined by the opacity.
     *
     * @since 4.2.4
     */
    opacity?: number;

    /**
     * Fires on a request for change of root node for the tree, before the
     * update is made. An event object is passed to the function, containing
     * additional properties `newRootId`, `previousRootId`, `redraw` and
     * `trigger`.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-events-setrootnode/
     *         Alert update information on setRootNode event.
     *
     * @default undefined
     *
     * @since 7.0.3
     *
     * @product highcharts
     */
    setRootNode?: Function;

    /**
     * Experimental. How to set the size of child nodes when a header or padding
     * is present.
     */
    sizeBy?: 'parent'|'leaf';

    /**
     * Whether to display this series type or specific series item in the
     * legend.
     */
    showInLegend?: boolean;

    /**
     * The sort index of the point inside the treemap level.
     *
     * @sample {highcharts} highcharts/plotoptions/treemap-sortindex/
     *         Sort by years
     *
     * @since 4.1.10
     *
     * @product highcharts
     */
    sortIndex?: number;

    /**
     * A wrapper object for all the series options in specific states.
     *
     * @extends plotOptions.heatmap.states
     */
    states?: SeriesStatesOptions<TreemapSeries>;

    /**
     * Options for the hovered series
     *
     * @extends plotOptions.heatmap.states.hover
     *
     * @excluding halo
     *
     * @apioption series.treemap.states.hover
     */

    tooltip?:Partial<TooltipOptions>;

    /**
     * The HTML of the grouped nodes point's in the tooltip. Works only for
     * Treemap series grouping and analogously to
     * [pointFormat](#tooltip.pointFormat).
     *
     * The grouped nodes point tooltip can be also formatted using
     * `tooltip.formatter` callback function and `point.isGroupNode` flag.
     *
     * @type      {string}
     * @default   '+ {point.groupedPointsAmount} more...'
     * @apioption tooltip.clusterFormat
     */

    /**
     * Options for the button appearing when traversing down in a treemap.
     *
     * Since v9.3.3 the `traverseUpButton` is replaced by `breadcrumbs`.
     */
    traverseUpButton?: TreemapSeriesUpButtonOptions;

    traverseToLeaf?: boolean;
}

/**
 * @optionparent series.treemap.traverseUpButton
 */
export interface TreemapSeriesUpButtonOptions {

    /**
     * The position of the button.
     */
    position?: TreemapSeriesUpButtonPositionOptions;

    relativeTo?: string;

    text?: string;

    theme?: ButtonThemeObject;

}

export interface TreemapSeriesUpButtonPositionOptions {
    align?: AlignValue;
    verticalAlign?: VerticalAlignValue;
    x?: number;
    y?: number;
}

/* *
 *
 *  Default Export
 *
 * */

export default TreemapSeriesOptions;
