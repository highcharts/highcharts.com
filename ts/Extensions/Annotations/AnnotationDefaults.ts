/* *
 *
 *  Imports
 *
 * */

import type AnnotationOptions from './AnnotationOptions';
import type { AnnotationPoint } from './AnnotationSeries';
import type ControlPointOptions from './ControlPointOptions';

import { Palette } from '../../Core/Color/Palettes.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { defined } = OH;

/* *
 *
 *  API Options
 *
 * */

/**
 * A basic type of an annotation. It allows to add custom labels
 * or shapes. The items  can be tied to points, axis coordinates
 * or chart pixel coordinates.
 *
 * @sample highcharts/annotations/basic/
 *         Basic annotations
 * @sample highcharts/demo/annotations/
 *         Advanced annotations
 * @sample highcharts/css/annotations
 *         Styled mode
 * @sample highcharts/annotations-advanced/controllable
 *         Controllable items
 * @sample {highstock} stock/annotations/fibonacci-retracements
 *         Custom annotation, Fibonacci retracement
 *
 * @type         {Array<*>}
 * @since        6.0.0
 * @requires     modules/annotations
 * @optionparent annotations
 */

const AnnotationDefaults: AnnotationOptions = {

    /**
     * Sets an ID for an annotation. Can be user later when
     * removing an annotation in [Chart#removeAnnotation(id)](
     * /class-reference/Highcharts.Chart#removeAnnotation) method.
     *
     * @type      {number|string}
     * @apioption annotations.id
     */

    /**
     * Whether the annotation is visible.
     *
     * @sample highcharts/annotations/visible/
     *         Set annotation visibility
     */
    visible: true,

    /**
     * Enable or disable the initial animation when a series is
     * displayed for the `annotation`. The animation can also be set
     * as a configuration object. Please note that this option only
     * applies to the initial animation.
     * For other animations, see [chart.animation](#chart.animation)
     * and the animation parameter under the API methods.
     * The following properties are supported:
     *
     * - `defer`: The animation delay time in milliseconds.
     *
     * @sample {highcharts} highcharts/annotations/defer/
     *          Animation defer settings
     * @type {boolean|Partial<Highcharts.AnimationOptionsObject>}
     * @since 8.2.0
     */
    animation: {},

    /**
     * Whether to hide the part of the annotation
     * that is outside the plot area.
     *
     * @sample highcharts/annotations/label-crop-overflow/
     *         Crop line annotation
     * @type  {boolean}
     * @since 9.3.0
     */
    crop: true,

    /**
     * The animation delay time in milliseconds.
     * Set to `0` renders annotation immediately.
     * As `undefined` inherits defer time from the [series.animation.defer](#plotOptions.series.animation.defer).
     *
     * @type      {number}
     * @since 8.2.0
     * @apioption annotations.animation.defer
     */

    /**
     * Allow an annotation to be draggable by a user. Possible
     * values are `'x'`, `'xy'`, `'y'` and `''` (disabled).
     *
     * @sample highcharts/annotations/draggable/
     *         Annotations draggable: 'xy'
     *
     * @type {Highcharts.AnnotationDraggableValue}
     */
    draggable: 'xy',

    /**
     * Options for annotation's labels. Each label inherits options
     * from the labelOptions object. An option from the labelOptions
     * can be overwritten by config for a specific label.
     *
     * @requires modules/annotations
     */
    labelOptions: {

        /**
         * The alignment of the annotation's label. If right,
         * the right side of the label should be touching the point.
         *
         * @sample highcharts/annotations/label-position/
         *         Set labels position
         *
         * @type {Highcharts.AlignValue}
         */
        align: 'center',

        /**
         * Whether to allow the annotation's labels to overlap.
         * To make the labels less sensitive for overlapping,
         * the can be set to 0.
         *
         * @sample highcharts/annotations/tooltip-like/
         *         Hide overlapping labels
         */
        allowOverlap: false,

        /**
         * The background color or gradient for the annotation's
         * label.
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         *
         * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         */
        backgroundColor: 'rgba(0, 0, 0, 0.75)',

        /**
         * The border color for the annotation's label.
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         *
         * @type {Highcharts.ColorString}
         */
        borderColor: Palette.neutralColor100,

        /**
         * The border radius in pixels for the annotaiton's label.
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         */
        borderRadius: 3,

        /**
         * The border width in pixels for the annotation's label
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         */
        borderWidth: 1,

        /**
         * A class name for styling by CSS.
         *
         * @sample highcharts/css/annotations
         *         Styled mode annotations
         *
         * @since 6.0.5
         */
        className: 'highcharts-no-tooltip',

        /**
         * Whether to hide the annotation's label
         * that is outside the plot area.
         *
         * @sample highcharts/annotations/label-crop-overflow/
         *         Crop or justify labels
         */
        crop: false,

        /**
         * The label's pixel distance from the point.
         *
         * @sample highcharts/annotations/label-position/
         *         Set labels position
         *
         * @type      {number}
         * @apioption annotations.labelOptions.distance
         */

        /**
         * A
         * [format](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting)
         * string for the data label.
         *
         * @see [plotOptions.series.dataLabels.format](plotOptions.series.dataLabels.format.html)
         *
         * @sample highcharts/annotations/label-text/
         *         Set labels text
         *
         * @type      {string}
         * @apioption annotations.labelOptions.format
         */

        /**
         * Alias for the format option.
         *
         * @see [format](annotations.labelOptions.format.html)
         *
         * @sample highcharts/annotations/label-text/
         *         Set labels text
         *
         * @type      {string}
         * @apioption annotations.labelOptions.text
         */

        /**
         * Callback JavaScript function to format the annotation's
         * label. Note that if a `format` or `text` are defined,
         * the format or text take precedence and the formatter is
         * ignored. `This` refers to a point object.
         *
         * @sample highcharts/annotations/label-text/
         *         Set labels text
         *
         * @type    {Highcharts.FormatterCallbackFunction<Highcharts.Point>}
         * @default function () { return defined(this.y) ? this.y : 'Annotation label'; }
         */
        formatter: function (
            this: AnnotationPoint
        ): string {
            return defined(this.y) ? '' + this.y : 'Annotation label';
        },

        /**
         * Whether the annotation is visible in the exported data
         * table.
         *
         * @sample highcharts/annotations/include-in-data-export/
         *         Do not include in the data export
         *
         * @since 8.2.0
         * @requires modules/export-data
         */
        includeInDataExport: true,

        /**
         * How to handle the annotation's label that flow outside
         * the plot area. The justify option aligns the label inside
         * the plot area.
         *
         * @sample highcharts/annotations/label-crop-overflow/
         *         Crop or justify labels
         *
         * @validvalue ["allow", "justify"]
         */
        overflow: 'justify',

        /**
         * When either the borderWidth or the backgroundColor is
         * set, this is the padding within the box.
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         */
        padding: 5,

        /**
         * The shadow of the box. The shadow can be an object
         * configuration containing `color`, `offsetX`, `offsetY`,
         * `opacity` and `width`.
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         *
         * @type {boolean|Highcharts.ShadowOptionsObject}
         */
        shadow: false,

        /**
         * The name of a symbol to use for the border around the
         * label. Symbols are predefined functions on the Renderer
         * object.
         *
         * @sample highcharts/annotations/shapes/
         *         Available shapes for labels
         */
        shape: 'callout',

        /**
         * Styles for the annotation's label.
         *
         * @see [plotOptions.series.dataLabels.style](plotOptions.series.dataLabels.style.html)
         *
         * @sample highcharts/annotations/label-presentation/
         *         Set labels graphic options
         *
         * @type {Highcharts.CSSObject}
         */
        style: {
            /** @ignore */
            fontSize: '0.7em',
            /** @ignore */
            fontWeight: 'normal',
            /** @ignore */
            color: 'contrast'
        },

        /**
         * Whether to [use HTML](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting#html)
         * to render the annotation's label.
         */
        useHTML: false,

        /**
         * The vertical alignment of the annotation's label.
         *
         * @sample highcharts/annotations/label-position/
         *         Set labels position
         *
         * @type {Highcharts.VerticalAlignValue}
         */
        verticalAlign: 'bottom',

        /**
         * The x position offset of the label relative to the point.
         * Note that if a `distance` is defined, the distance takes
         * precedence over `x` and `y` options.
         *
         * @sample highcharts/annotations/label-position/
         *         Set labels position
         */
        x: 0,

        /**
         * The y position offset of the label relative to the point.
         * Note that if a `distance` is defined, the distance takes
         * precedence over `x` and `y` options.
         *
         * @sample highcharts/annotations/label-position/
         *         Set labels position
         */
        y: -16
    },

    /**
     * An array of labels for the annotation. For options that apply
     * to multiple labels, they can be added to the
     * [labelOptions](annotations.labelOptions.html).
     *
     * @type      {Array<*>}
     * @extends   annotations.labelOptions
     * @apioption annotations.labels
     */

    /**
     * This option defines the point to which the label will be
     * connected. It can be either the point which exists in the
     * series - it is referenced by the point's id - or a new point
     * with defined x, y properties and optionally axes.
     *
     * @sample highcharts/annotations/mock-point/
     *         Attach annotation to a mock point
     * @sample highcharts/annotations/mock-points/
     *         Attach annotation to a mock point with different ways
     *
     * @declare   Highcharts.AnnotationMockPointOptionsObject
     * @type      {
     *               string|
     *               Highcharts.AnnotationMockPointOptionsObject|
     *               Highcharts.AnnotationMockPointFunction
     *            }
     * @requires  modules/annotations
     * @apioption annotations.labels.point
     */

    /**
     * An array of shapes for the annotation. For options that apply
     * to multiple shapes, then can be added to the
     * [shapeOptions](annotations.shapeOptions.html).
     *
     * @type      {Array<*>}
     * @extends   annotations.shapeOptions
     * @apioption annotations.shapes
     */

    /**
     * This option defines the point to which the shape will be
     * connected. It can be either the point which exists in the
     * series - it is referenced by the point's id - or a new point
     * with defined x, y properties and optionally axes.
     *
     * @sample highcharts/annotations/mock-points/
     *         Attach annotation to a mock point with different ways
     *
     * @declare   Highcharts.AnnotationMockPointOptionsObject
     * @type      {
     *               string|
     *               Highcharts.AnnotationMockPointOptionsObject|
     *               Highcharts.AnnotationMockPointFunction
     *            }
     * @extends   annotations.labels.point
     * @requires  modules/annotations
     * @apioption annotations.shapes.point
     */

    /**
     * An array of points for the shape
     * or a callback function that returns that shape point.
     *
     * This option is available
     * for shapes which can use multiple points such as path. A
     * point can be either a point object or a point's id.
     *
     * @see [annotations.shapes.point](annotations.shapes.point.html)
     *
     * @type      {Array<Highcharts.AnnotationShapePointOptions>}
     * @extends   annotations.labels.point
     * @apioption annotations.shapes.points
     */

    /**
     * The URL for an image to use as the annotation shape. Note,
     * type has to be set to `'image'`.
     *
     * @see [annotations.shapes.type](annotations.shapes.type)
     * @sample highcharts/annotations/shape-src/
     *         Define a marker image url for annotations
     *
     * @type      {string}
     * @apioption annotations.shapes.src
     */

    /**
     * Id of the marker which will be drawn at the final vertex of
     * the path. Custom markers can be defined in defs property.
     *
     * @see [defs.markers](defs.markers.html)
     *
     * @sample highcharts/annotations/custom-markers/
     *         Define a custom marker for annotations
     *
     * @type      {string}
     * @apioption annotations.shapes.markerEnd
     */

    /**
     * Id of the marker which will be drawn at the first vertex of
     * the path. Custom markers can be defined in defs property.
     *
     * @see [defs.markers](defs.markers.html)
     *
     * @sample {highcharts} highcharts/annotations/custom-markers/
     *         Define a custom marker for annotations
     *
     * @type      {string}
     * @apioption annotations.shapes.markerStart
     */


    /**
     * Options for annotation's shapes. Each shape inherits options
     * from the shapeOptions object. An option from the shapeOptions
     * can be overwritten by config for a specific shape.
     *
     * @requires  modules/annotations
     */
    shapeOptions: {

        /**
         *
         * The radius of the shape in y direction.
         * Used for the ellipse.
         *
         * @sample highcharts/annotations/ellipse/
         *         Ellipse annotation
         *
         * @type      {number}
         * @apioption annotations.shapeOptions.ry
         **/

        /**
         *
         * The xAxis index to which the points should be attached.
         * Used for the ellipse.
         *
         * @type      {number}
         * @apioption annotations.shapeOptions.xAxis
         **/

        /**
         * The yAxis index to which the points should be attached.
         * Used for the ellipse.
         *
         * @type      {number}
         * @apioption annotations.shapeOptions.yAxis
         **/


        /**
         * The width of the shape.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         *
         * @type      {number}
         * @apioption annotations.shapeOptions.width
         **/

        /**
         * The height of the shape.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         *
         * @type      {number}
         * @apioption annotations.shapeOptions.height
         */

        /**
         * The type of the shape.
         * Avaliable options are circle, rect and ellipse.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         *
         * @sample highcharts/annotations/ellipse/
         *         Ellipse annotation
         *
         * @type      {string}
         * @default   rect
         * @apioption annotations.shapeOptions.type
         */

        /**
         * The URL for an image to use as the annotation shape.
         * Note, type has to be set to `'image'`.
         *
         * @see [annotations.shapeOptions.type](annotations.shapeOptions.type)
         * @sample highcharts/annotations/shape-src/
         *         Define a marker image url for annotations
         *
         * @type      {string}
         * @apioption annotations.shapeOptions.src
         */

        /**
         * Name of the dash style to use for the shape's stroke.
         *
         * @sample {highcharts} highcharts/plotoptions/series-dashstyle-all/
         *         Possible values demonstrated
         *
         * @type      {Highcharts.DashStyleValue}
         * @apioption annotations.shapeOptions.dashStyle
         */

        /**
         * The color of the shape's stroke.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         *
         * @type {Highcharts.ColorString}
         */
        stroke: 'rgba(0, 0, 0, 0.75)',

        /**
         * The pixel stroke width of the shape.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         */
        strokeWidth: 1,

        /**
         * The color of the shape's fill.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         *
         * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         */
        fill: 'rgba(0, 0, 0, 0.75)',

        /**
         * The radius of the shape.
         *
         * @sample highcharts/annotations/shape/
         *         Basic shape annotation
         */
        r: 0,

        /**
         * Defines additional snapping area around an annotation
         * making this annotation to focus. Defined in pixels.
         */
        snap: 2
    },

    /**
     * Options for annotation's control points. Each control point
     * inherits options from controlPointOptions object.
     * Options from the controlPointOptions can be overwritten
     * by options in a specific control point.
     *
     * @declare  Highcharts.AnnotationControlPointOptionsObject
     * @requires modules/annotations
     */
    controlPointOptions: {

        /**
         * @type      {Highcharts.AnnotationControlPointPositionerFunction}
         * @apioption annotations.controlPointOptions.positioner
         */

        /**
         * @type {Highcharts.Dictionary<Function>}
         */
        events: {},

        /**
         * @type {Highcharts.SVGAttributes}
         */
        style: {
            cursor: 'pointer',
            fill: Palette.backgroundColor,
            stroke: Palette.neutralColor100,
            'stroke-width': 2
        },

        height: 10,

        symbol: 'circle',

        visible: false,

        width: 10

    } as ControlPointOptions,

    /**
     * Event callback when annotation is added to the chart.
     *
     * @type      {Highcharts.EventCallbackFunction<Highcharts.Annotation>}
     * @since     7.1.0
     * @apioption annotations.events.add
     */

    /**
     * Event callback when annotation is updated (e.g. drag and
     * droppped or resized by control points).
     *
     * @type      {Highcharts.EventCallbackFunction<Highcharts.Annotation>}
     * @since     7.1.0
     * @apioption annotations.events.afterUpdate
     */

    /**
     * Fires when the annotation is clicked.
     *
     * @type      {Highcharts.EventCallbackFunction<Highcharts.Annotation>}
     * @since     7.1.0
     * @apioption annotations.events.click
     */

    /**
     * Event callback when annotation is removed from the chart.
     *
     * @type      {Highcharts.EventCallbackFunction<Highcharts.Annotation>}
     * @since     7.1.0
     * @apioption annotations.events.remove
     */

    /**
     * Events available in annotations.
     *
     * @requires modules/annotations
     */
    events: {},

    /**
     * The Z index of the annotation.
     */
    zIndex: 6

} as AnnotationOptions; // typeOptions are expected but not set

/* *
 *
 *  Default Export
 *
 * */

export default AnnotationDefaults;
