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
import type { ControllableShapeOptions } from './ControllableOptions';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';

import Controllable from './Controllable.js';
import ControllablePath from './ControllablePath.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

/* *
 *
 *  Class
 *
 * */

/**
 * A controllable circle class.
 *
 * @requires modules/annotations
 *
 * @private
 * @class
 * @name Highcharts.AnnotationControllableCircle
 *
 * @param {Highcharts.Annotation} annotation an annotation instance
 * @param {Highcharts.AnnotationsShapeOptions} options a shape's options
 * @param {number} index of the circle
 */
class ControllableCircle extends Controllable {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A map object which allows to map options attributes to element
     * attributes.
     *
     * @name Highcharts.AnnotationControllableCircle.attrsMap
     * @type {Highcharts.Dictionary<string>}
     */
    public static attrsMap = merge(ControllablePath.attrsMap, { r: 'r' });

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        annotation: Annotation,
        options: ControllableShapeOptions,
        index: number
    ) {
        super(annotation, options, index, 'shape');
    }

    /* *
     *
     *  Properties
     *
     * */

    public type = 'circle';

    public translate = super.translateShape;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public redraw(animation?: boolean): void {

        if (this.graphic) {
            const position = this.anchor(this.points[0]).absolutePosition;

            if (position) {
                this.graphic[animation ? 'animate' : 'attr']({
                    x: position.x,
                    y: position.y,
                    r: this.options.r
                });
            } else {
                this.graphic.attr({
                    x: 0,
                    y: -9e9
                });
            }

            this.graphic.placed = !!position;
        }

        super.redraw.call(this, animation);
    }

    /**
     * @private
     */
    public render(parent: SVGElement): void {
        const attrs = this.attrsFromOptions(this.options);

        this.graphic = this.annotation.chart.renderer
            .circle(0, -9e9, 0)
            .attr(attrs)
            .add(parent);

        super.render();
    }

    /**
     * Set the radius.
     * @private
     * @param {number} r
     *        A radius to be set
     */
    public setRadius(r: number): void {
        this.options.r = r;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface ControllableCircle {
    collection: 'shapes';
    itemType: 'shape';
    options: ControllableShapeOptions;
}

/* *
 *
 *  Registry
 *
 * */

declare module './ControllableType' {
    interface ControllableShapeTypeRegistry {
        circle: typeof ControllableCircle;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ControllableCircle;
