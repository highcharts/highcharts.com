/* *
 *
 *  Imports
 *
 * */

import type {
    PackedBubbleDataLabelFormatterObject
} from './PackedBubbleDataLabelOptions';
import type PackedBubblePoint from './PackedBubblePoint';
import type PackedBubbleSeriesOptions from './PackedBubbleSeriesOptions';
import type Point from '../../Core/Series/Point';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;

/* *
 *
 *  Constants
 *
 * */


/**
 * A packed bubble series is a two dimensional series type, where each point
 * renders a value in X, Y position. Each point is drawn as a bubble
 * where the bubbles don't overlap with each other and the radius
 * of the bubble relates to the value.
 *
 * @sample highcharts/demo/packed-bubble/
 *         Packed bubble chart
 * @sample highcharts/demo/packed-bubble-split/
 *         Split packed bubble chart
 *
 * @extends      plotOptions.bubble
 * @excluding    connectEnds, connectNulls, cropThreshold, dragDrop, jitter,
 *               keys, pointPlacement, sizeByAbsoluteValue, step, xAxis,
 *               yAxis, zMax, zMin, dataSorting, boostThreshold,
 *               boostBlending
 * @product      highcharts
 * @since        7.0.0
 * @requires     highcharts-more
 * @optionparent plotOptions.packedbubble
 *
 * @private
 */
const PackedBubbleSeriesDefaults: PackedBubbleSeriesOptions = {
    /**
     * Minimum bubble size. Bubbles will automatically size between the
     * `minSize` and `maxSize` to reflect the value of each bubble.
     * Can be either pixels (when no unit is given), or a percentage of
     * the smallest one of the plot width and height, divided by the square
     * root of total number of points.
     *
     * @sample highcharts/plotoptions/bubble-size/
     *         Bubble size
     *
     * @type {number|string}
     *
     * @private
     */
    minSize: '10%',
    /**
     * Maximum bubble size. Bubbles will automatically size between the
     * `minSize` and `maxSize` to reflect the value of each bubble.
     * Can be either pixels (when no unit is given), or a percentage of
     * the smallest one of the plot width and height, divided by the square
     * root of total number of points.
     *
     * @sample highcharts/plotoptions/bubble-size/
     *         Bubble size
     *
     * @type {number|string}
     *
     * @private
     */
    maxSize: '50%',
    sizeBy: 'area',
    zoneAxis: 'y',
    crisp: false,
    tooltip: {
        pointFormat: 'Value: {point.value}'
    },
    /**
     * Flag to determine if nodes are draggable or not. Available for
     * graph with useSimulation set to true only.
     *
     * @since 7.1.0
     *
     * @private
     */
    draggable: true,
    /**
     * An option is giving a possibility to choose between using simulation
     * for calculating bubble positions. These reflects in both animation
     * and final position of bubbles. Simulation is also adding options to
     * the series graph based on used layout. In case of big data sets, with
     * any performance issues, it is possible to disable animation and pack
     * bubble in a simple circular way.
     *
     * @sample highcharts/series-packedbubble/spiral/
     *         useSimulation set to false
     *
     * @since 7.1.0
     *
     * @private
     */
    useSimulation: true,
    /**
     * Series options for parent nodes.
     *
     * @since 8.1.1
     *
     * @private
     */
    parentNode: {
        /**
         * Allow this series' parent nodes to be selected
         * by clicking on the graph.
         *
         * @since 8.1.1
         */
        allowPointSelect: false
    },
    /**
    /**
     *
     * @declare Highcharts.SeriesPackedBubbleDataLabelsOptionsObject
     *
     * @private
     */
    dataLabels: {

        /**
         * The
         * [format string](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting)
         * specifying what to show for _node_ in the networkgraph. In v7.0
         * defaults to `{key}`, since v7.1 defaults to `undefined` and
         * `formatter` is used instead.
         *
         * @type      {string}
         * @since     7.0.0
         * @apioption plotOptions.packedbubble.dataLabels.format
         */

        // eslint-disable-next-line valid-jsdoc
        /**
         * Callback JavaScript function to format the data label for a node.
         * Note that if a `format` is defined, the format takes precedence
         * and the formatter is ignored.
         *
         * @type  {Highcharts.SeriesPackedBubbleDataLabelsFormatterCallbackFunction}
         * @since 7.0.0
         */
        formatter: function (
            this: (
                Point.PointLabelObject|
                PackedBubbleDataLabelFormatterObject
            )
        ): string {
            const { numberFormatter } = this.series.chart;
            const { value } = this.point as PackedBubblePoint;

            return isNumber(value) ? numberFormatter(value, -1) : '';
        },

        /**
         * @type      {string}
         * @since     7.1.0
         * @apioption plotOptions.packedbubble.dataLabels.parentNodeFormat
         */

        // eslint-disable-next-line valid-jsdoc
        /**
         * @type  {Highcharts.SeriesPackedBubbleDataLabelsFormatterCallbackFunction}
         * @since 7.1.0
         */
        parentNodeFormatter: function (
            this: (
                Point.PointLabelObject|
                PackedBubbleDataLabelFormatterObject
            )
        ): string {
            return (this as any).name;
        },

        /**
         * @sample {highcharts} highcharts/series-packedbubble/packed-dashboard
         *         Dashboard with dataLabels on parentNodes
         *
         * @declare Highcharts.SeriesPackedBubbleDataLabelsTextPathOptionsObject
         * @since   7.1.0
         */
        parentNodeTextPath: {

            /**
             * Presentation attributes for the text path.
             *
             * @type      {Highcharts.SVGAttributes}
             * @since     7.1.0
             * @apioption plotOptions.packedbubble.dataLabels.attributes
             */

            /**
             * Enable or disable `textPath` option for link's or marker's
             * data labels.
             *
             * @since 7.1.0
             */
            enabled: true

        },

        /**
         * Options for a _node_ label text which should follow marker's
         * shape.
         *
         * **Note:** Only SVG-based renderer supports this option.
         *
         * @extends   plotOptions.series.dataLabels.textPath
         * @apioption plotOptions.packedbubble.dataLabels.textPath
         */

        padding: 0,
        style: {
            transition: 'opacity 2000ms'
        }

    },
    /**
     * Options for layout algorithm when simulation is enabled. Inside there
     * are options to change the speed, padding, initial bubbles positions
     * and more.
     *
     * @extends   plotOptions.networkgraph.layoutAlgorithm
     * @excluding approximation, attractiveForce, repulsiveForce, theta
     * @since     7.1.0
     *
     * @private
     */
    layoutAlgorithm: {
        /**
         * Initial layout algorithm for positioning nodes. Can be one of
         * the built-in options ("circle", "random") or a function where
         * positions should be set on each node (`this.nodes`) as
         * `node.plotX` and `node.plotY`.
         *
         * @sample highcharts/series-networkgraph/initial-positions/
         *         Initial positions with callback
         *
         * @type {"circle"|"random"|Function}
         */
        initialPositions: 'circle',
        /**
         * @sample highcharts/series-packedbubble/initial-radius/
         *         Initial radius set to 200
         *
         * @extends   plotOptions.networkgraph.layoutAlgorithm.initialPositionRadius
         * @excluding states
         */
        initialPositionRadius: 20,
        /**
         * The distance between two bubbles, when the algorithm starts to
         * treat two bubbles as overlapping. The `bubblePadding` is also the
         * expected distance between all the bubbles on simulation end.
         */
        bubblePadding: 5,
        /**
         * Whether bubbles should interact with their parentNode to keep
         * them inside.
         */
        parentNodeLimit: false,
        /**
         * Whether series should interact with each other or not. When
         * `parentNodeLimit` is set to true, thi option should be set to
         * false to avoid sticking points in wrong series parentNode.
         */
        seriesInteraction: true,
        /**
         * In case of split series, this option allows user to drag and
         * drop points between series, for changing point related series.
         *
         * @sample highcharts/series-packedbubble/packed-dashboard/
         *         Example of drag'n drop bubbles for bubble kanban
         */
        dragBetweenSeries: false,
        /**
         * Layout algorithm options for parent nodes.
         *
         * @extends   plotOptions.networkgraph.layoutAlgorithm
         * @excluding approximation, attractiveForce, enableSimulation,
         *            repulsiveForce, theta
         */
        parentNodeOptions: {
            maxIterations: 400,
            gravitationalConstant: 0.03,
            maxSpeed: 50,
            initialPositionRadius: 100,
            seriesInteraction: true,
            /**
             * Styling options for parentNodes markers. Similar to
             * line.marker options.
             *
             * @sample highcharts/series-packedbubble/parentnode-style/
             *         Bubble size
             *
             * @extends   plotOptions.series.marker
             * @excluding states
             */
            marker: {
                fillColor: null as any,
                fillOpacity: 1,
                lineWidth: null as any,
                lineColor: null as any,
                symbol: 'circle'
            }
        },
        enableSimulation: true,
        /**
         * Type of the algorithm used when positioning bubbles.
         * @ignore-option
         */
        type: 'packedbubble',
        /**
         * Integration type. Integration determines how forces are applied
         * on particles. The `packedbubble` integration is based on
         * the networkgraph `verlet` integration, where the new position
         * is based on a previous position without velocity:
         * `newPosition += previousPosition - newPosition`.
         *
         * @sample highcharts/series-networkgraph/forces/
         *
         * @ignore-option
         */
        integration: 'packedbubble',
        maxIterations: 1000,
        /**
         * Whether to split series into individual groups or to mix all
         * series together.
         *
         * @since   7.1.0
         * @default false
         */
        splitSeries: false,
        /**
         * Max speed that node can get in one iteration. In terms of
         * simulation, it's a maximum translation (in pixels) that a node
         * can move (in both, x and y, dimensions). While `friction` is
         * applied on all nodes, max speed is applied only for nodes that
         * move very fast, for example small or disconnected ones.
         *
         * @see [layoutAlgorithm.integration](#series.networkgraph.layoutAlgorithm.integration)
         *
         * @see [layoutAlgorithm.friction](#series.networkgraph.layoutAlgorithm.friction)
         */
        maxSpeed: 5,
        gravitationalConstant: 0.01,
        friction: -0.981
    }
};

/* *
 *
 *  Default Export
 *
 * */

export default PackedBubbleSeriesDefaults;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `packedbubble` series. If the [type](#series.packedbubble.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @type      {Object}
 * @extends   series,plotOptions.packedbubble
 * @excluding cropThreshold, dataParser, dataSorting, dataURL, dragDrop, stack,
 *            boostThreshold, boostBlending
 * @product   highcharts
 * @requires  highcharts-more
 * @apioption series.packedbubble
 */

/**
 * An array of data points for the series. For the `packedbubble` series type,
 * points can be given in the following ways:
 *
 * 1.  An array of `values`.
 *
 *  ```js
 *     data: [5, 1, 20]
 *  ```
 *
 * 2.  An array of objects with named values. The objects are point
 * configuration objects as seen below. If the total number of data points
 * exceeds the series' [turboThreshold](#series.packedbubble.turboThreshold),
 * this option is not available.
 *
 *  ```js
 *     data: [{
 *         value: 1,
 *         name: "Point2",
 *         color: "#00FF00"
 *     }, {
 *         value: 5,
 *         name: "Point1",
 *         color: "#FF00FF"
 *     }]
 *  ```
 *
 * @type      {Array<Object|Array>}
 * @extends   series.line.data
 * @excluding marker, x, y
 * @sample    {highcharts} highcharts/series/data-array-of-objects/
 *            Config objects
 * @product   highcharts
 * @apioption series.packedbubble.data
 */

/**
 * @type      {Highcharts.SeriesPackedBubbleDataLabelsOptionsObject|Array<Highcharts.SeriesPackedBubbleDataLabelsOptionsObject>}
 * @product   highcharts
 * @apioption series.packedbubble.data.dataLabels
 */

/**
 * @excluding enabled,enabledThreshold,height,radius,width
 * @product   highcharts
 * @apioption series.packedbubble.marker
 */

''; // adds doclets above to transpiled file
