/* *
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

import type Annotation from '../Annotation';
import type AnnotationChart from '../AnnotationChart';
import type ControllableLike from './ControllableLike';
import type ControllableOptions from './ControllableOptions';
import type SVGAttributes from '../../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';

import ControlTarget from '../ControlTarget.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Declarations
 *
 * */

export type AttrsMapObject = Record<keyof ControllableOptions, keyof SVGAttributes>;

/* *
 *
 *  Class
 *
 * */

/**
 * It provides methods for handling points, control points
 * and points transformations.
 * @private
 */
abstract class Controllable implements ControlTarget {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        annotation: Annotation,
        options: ControllableOptions,
        index: number,
        itemType: ('label'|'shape')
    ) {
        this.annotation = annotation;
        this.chart = annotation.chart;
        this.collection = (itemType === 'label' ? 'labels' : 'shapes');
        this.controlPoints = [];
        this.options = options;
        this.points = [];
        this.index = index;
        this.itemType = itemType;
        this.init(annotation, options, index);
    }

    /* *
     *
     *  Properties
     *
     * */

    public annotation: Annotation;
    public chart: AnnotationChart;
    public collection: ('labels'|'shapes');
    public graphic: SVGElement = void 0 as any;
    public index: number;
    public itemType: ('label'|'shape');
    public options: ControllableOptions;
    public tracker?: SVGElement;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Redirect attr usage on the controllable graphic element.
     * @private
     */
    public attr<T>(..._args: Array<T>): void {
        this.graphic.attr.apply(this.graphic, arguments);
    }

    /**
     * Utility function for mapping item's options
     * to element's attribute
     * @private
     * @param {Highcharts.AnnotationsLabelsOptions|Highcharts.AnnotationsShapesOptions} options
     * @return {Highcharts.SVGAttributes}
     *         Mapped options.
     */
    public attrsFromOptions(
        options: ControllableOptions
    ): SVGAttributes {
        const map = (this.constructor as AnyRecord).attrsMap as AttrsMapObject,
            attrs: SVGAttributes = {},
            styledMode = this.chart.styledMode;

        let key: keyof ControllableOptions,
            mappedKey: keyof SVGAttributes;

        for (key in options) { // eslint-disable-line guard-for-in
            mappedKey = map[key];

            if (
                typeof map[key] !== 'undefined' &&
                (
                    !styledMode ||
                    ['fill', 'stroke', 'stroke-width']
                        .indexOf(mappedKey) === -1
                )
            ) {
                attrs[mappedKey] = options[key] as undefined;
            }
        }

        return attrs;
    }

    /**
     * Destroy a controllable.
     * @private
     */
    public destroy(): void {

        if (this.graphic) {
            this.graphic = this.graphic.destroy() as any;
        }

        if (this.tracker) {
            this.tracker = this.tracker.destroy();
        }

        this.destroyControlTarget();
    }

    /**
     * Init the controllable
     * @private
     */
    public init(
        annotation: Annotation,
        options: ControllableOptions,
        index: number
    ): void {
        this.annotation = annotation;
        this.chart = annotation.chart;
        this.options = options;
        this.points = [];
        this.controlPoints = [];
        this.index = index;

        this.linkPoints();
        this.addControlPoints();
    }

    /**
     * Redraw a controllable.
     * @private
     */
    public redraw(
        animation?: boolean
    ): void {
        this.redrawControlPoints(animation);
    }

    /**
     * Render a controllable.
     * @private
     */
    public render(
        _parentGroup?: SVGElement
    ): void {
        this.renderControlPoints();
    }

    /**
     * Rotate a controllable.
     * @private
     * @param {number} cx
     *        Origin x rotation
     * @param {number} cy
     *        Origin y rotation
     * @param {number} radians
     **/
    public rotate(
        cx: number,
        cy: number,
        radians: number
    ): void {
        this.transform('rotate', cx, cy, radians);
    }

    /**
     * Scale a controllable.
     * @private
     * @param {number} cx
     *        Origin x rotation
     * @param {number} cy
     *        Origin y rotation
     * @param {number} sx
     *        Scale factor x
     * @param {number} sy
     *        Scale factor y
     */
    public scale(
        cx: number,
        cy: number,
        sx: number,
        sy: number
    ): void {
        this.transform('scale', cx, cy, sx, sy);
    }

    /**
     * Set control points' visibility.
     * @private
     */
    public setControlPointsVisibility(
        visible: boolean
    ): void {
        this.controlPoints.forEach((controlPoint): void => {
            controlPoint.setVisibility(visible);
        });
    }

    /**
     * Check if a controllable should be rendered/redrawn.
     * @private
     * @return {boolean}
     *         Whether a controllable should be drawn.
     */
    public shouldBeDrawn(): boolean {
        return !!this.points.length;
    }

    /**
     * Translate shape within controllable item.
     * Replaces `controllable.translate` method.
     * @private
     * @param {number} dx
     *        Translation for x coordinate
     * @param {number} dy
     *        Translation for y coordinate
     * @param {boolean|undefined} translateSecondPoint
     *        If the shape has two points attached to it, this option allows you
     *        to translate also the second point.
     */
    public translateShape(
        dx: number,
        dy: number,
        translateSecondPoint?: boolean
    ): void {
        const chart = this.annotation.chart,
            // Annotation.options
            shapeOptions = this.annotation.userOptions,
            // Chart.options.annotations
            annotationIndex = chart.annotations.indexOf(this.annotation),
            chartOptions = chart.options.annotations[annotationIndex];

        this.translatePoint(dx, dy, 0);

        if (translateSecondPoint) {
            this.translatePoint(dx, dy, 1);
        }

        // Options stored in:
        // - chart (for exporting)
        // - current config (for redraws)
        (chartOptions as any)[this.collection][this.index]
            .point = this.options.point;
        (shapeOptions as any)[this.collection][this.index]
            .point = this.options.point;
    }

    /**
     * Update a controllable.
     * @private
     */
    public update(
        newOptions: DeepPartial<ControllableOptions>
    ): void {
        const annotation = this.annotation,
            options = merge(true, this.options, newOptions),
            parentGroup = this.graphic.parentGroup,
            Constructor: any = this.constructor;

        this.destroy();
        const newControllable = new Constructor(
            annotation,
            options,
            this.index,
            this.itemType
        );
        merge(true, this as any, newControllable);

        this.render(parentGroup);
        this.redraw();
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Controllable extends ControllableLike, ControlTarget {
    // placeholder for additional class members
}

ControlTarget.compose(Controllable);

/* *
 *
 *  Default Export
 *
 * */

export default Controllable;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * An object which denots a controllable's anchor positions - relative and
 * absolute.
 *
 * @private
 * @interface Highcharts.AnnotationAnchorObject
 *//**
 * Relative to the plot area position
 * @name Highcharts.AnnotationAnchorObject#relativePosition
 * @type {Highcharts.BBoxObject}
 *//**
 * Absolute position
 * @name Highcharts.AnnotationAnchorObject#absolutePosition
 * @type {Highcharts.BBoxObject}
 */

/**
 * @interface Highcharts.AnnotationControllable
 *//**
 * @name Highcharts.AnnotationControllable#annotation
 * @type {Highcharts.Annotation}
 *//**
 * @name Highcharts.AnnotationControllable#chart
 * @type {Highcharts.Chart}
 *//**
 * @name Highcharts.AnnotationControllable#collection
 * @type {string}
 *//**
 * @private
 * @name Highcharts.AnnotationControllable#controlPoints
 * @type {Array<Highcharts.AnnotationControlPoint>}
 *//**
 * @name Highcharts.AnnotationControllable#points
 * @type {Array<Highcharts.Point>}
 */

(''); // keeps doclets above in JS file
