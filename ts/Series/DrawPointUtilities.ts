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

import type CSSObject from '../Core/Renderer/CSSObject';
import type Point from '../Core/Series/Point';
import type ShadowOptionsObject from '../Core/Renderer/ShadowOptionsObject';
import type SVGAttributes from '../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';
import type SVGRenderer from '../Core/Renderer/SVG/SVGRenderer';

/* *
 *
 *  Declarations
 *
 * */

export interface DrawPointParams {
    animatableAttribs: SVGAttributes;
    attribs: SVGAttributes;
    css?: CSSObject;
    group: SVGElement;
    onComplete?: Function;
    imageUrl?: string;
    isNew?: boolean;
    renderer: SVGRenderer;
    shadow?: (boolean|Partial<ShadowOptionsObject>);
    shapeArgs?: SVGAttributes;
    shapeType: 'arc'|'circle'|'image'|'path'|'rect'|'text';
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Handles the drawing of a component.
 * Can be used for any type of component that reserves the graphic property,
 * and provides a shouldDraw on its context.
 *
 * @private
 *
 * @todo add type checking.
 * @todo export this function to enable usage
 */
function draw(
    point: Point,
    params: DrawPointParams
): void {
    const {
        animatableAttribs,
        onComplete,
        css,
        renderer
    } = params;

    const animation = (point.series && point.series.chart.hasRendered) ?
        // Chart-level animation on updates
        void 0 :
        // Series-level animation on new points
        (
            point.series &&
            point.series.options.animation
        );

    let graphic = point.graphic;

    params.attribs = {
        ...params.attribs,
        'class': point.getClassName()
    } || {};

    if ((point.shouldDraw())) {
        if (!graphic) {
            if (params.shapeType === 'text') {
                graphic = renderer.text();
            } else if (params.shapeType === 'image') {
                graphic = renderer.image(params.imageUrl || '')
                    .attr(params.shapeArgs || {});
            } else {
                graphic = renderer[params.shapeType](params.shapeArgs || {});
            }
            point.graphic = graphic;
            graphic.add(params.group);
        }
        if (css) {
            graphic.css(css);
        }
        graphic
            .attr(params.attribs)
            .animate(
                animatableAttribs,
                params.isNew ? false : animation,
                onComplete
            );
    } else if (graphic) {
        const destroy = (): void => {
            point.graphic = graphic = (graphic && graphic.destroy());
            if (typeof onComplete === 'function') {
                onComplete();
            }
        };

        // animate only runs complete callback if something was animated.
        if (Object.keys(animatableAttribs).length) {
            graphic.animate(
                animatableAttribs,
                void 0,
                (): void => destroy()
            );
        } else {
            destroy();
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

const DrawPointUtilities = {
    draw
};

export default DrawPointUtilities;
