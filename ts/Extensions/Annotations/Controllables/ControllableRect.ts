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
 * A controllable rect class.
 *
 * @requires modules/annotations
 *
 * @private
 * @class
 * @name Highcharts.AnnotationControllableRect
 *
 * @param {Highcharts.Annotation} annotation
 * An annotation instance.
 *
 * @param {Highcharts.AnnotationsShapeOptions} options
 * A rect's options.
 *
 * @param {number} index
 * Index of the rectangle
 */
class ControllableRect extends Controllable {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A map object which allows to map options attributes to element attributes
     *
     * @type {Annotation.ControllableRect.AttrsMap}
     */
    public static attrsMap = merge(ControllablePath.attrsMap, {
        width: 'width',
        height: 'height'
    });

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

    public type = 'rect';

    public translate = super.translateShape;

    /* *
     *
     *  Functions
     *
     * */

    public render(parent: SVGElement): void {
        const attrs = this.attrsFromOptions(this.options);

        this.graphic = this.annotation.chart.renderer
            .rect(0, -9e9, 0, 0)
            .attr(attrs)
            .add(parent);

        super.render();
    }

    public redraw(animation?: boolean): void {

        if (this.graphic) {
            const position = this.anchor(this.points[0]).absolutePosition;

            if (position) {
                this.graphic[animation ? 'animate' : 'attr']({
                    x: position.x,
                    y: position.y,
                    width: this.options.width,
                    height: this.options.height
                });
            } else {
                this.attr({
                    x: 0,
                    y: -9e9
                });
            }

            this.graphic.placed = Boolean(position);
        }

        super.redraw(animation);
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface ControllableRect {
    collections: 'shapes';
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
        rect: typeof ControllableRect;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ControllableRect;
