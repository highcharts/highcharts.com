/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  Extensions to the SVGRenderer class to enable 3D shapes
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

import type AnimationOptions from '../../Animation/AnimationOptions';
import type ColorType from '../../Color/ColorType';
import type SVGArc3D from './SVGArc3D';
import type SVGAttributes from './SVGAttributes';
import type SVGCuboid from './SVGCuboid';
import type {
    SVGElement3DLike,
    SVGElement3DLikeBase,
    SVGElement3DLikeCuboid
} from './SVGElement3DLike';
import type SVGPath from './SVGPath';

import Color from '../../Color/Color.js';
const { parse: color } = Color;
import SVGElement from './SVGElement.js';
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { defined, merge, objectEach } = OH;
const {
    pick
} = U;

/* *
 *
 *  Constants
 *
 * */

const SVGElement3D = {} as SVGElement3DLike;

SVGElement3D.base = {
    /* eslint-disable valid-jsdoc */

    /**
     * The init is used by base - renderer.Element
     * @private
     */
    initArgs: function (
        this: SVGElement,
        args: SVGAttributes
    ): void {
        const elem3d = this,
            renderer = elem3d.renderer,
            paths: (SVGArc3D|SVGCuboid) =
                (renderer as any)[elem3d.pathType + 'Path'](args),
            zIndexes = (paths as any).zIndexes;

        // build parts
        (elem3d.parts as any).forEach(function (part: string): void {
            const attribs: SVGAttributes = {
                'class': 'highcharts-3d-' + part,
                zIndex: zIndexes[part] || 0
            };
            if (renderer.styledMode) {
                if (part === 'top') {
                    attribs.filter = 'url(#highcharts-brighter)';
                } else if (part === 'side') {
                    attribs.filter = 'url(#highcharts-darker)';
                }
            }
            elem3d[part] = renderer.path((paths as any)[part])
                .attr(attribs)
                .add(elem3d);
        });

        elem3d.attr({
            'stroke-linejoin': 'round',
            zIndex: zIndexes.group
        });

        // store original destroy
        elem3d.originalDestroy = elem3d.destroy;
        elem3d.destroy = elem3d.destroyParts;
        // Store information if any side of element was rendered by force.
        elem3d.forcedSides = (paths as any).forcedSides;

    },

    /**
     * Single property setter that applies options to each part
     * @private
     */
    singleSetterForParts: function (
        this: SVGElement,
        prop: string,
        val: any,
        values?: AnyRecord,
        verb?: string,
        duration?: any,
        complete?: any
    ): SVGElement {
        const elem3d = this,
            newAttr = {} as AnyRecord,
            optionsToApply = [null, null, (verb || 'attr'), duration, complete],
            hasZIndexes = values && values.zIndexes;

        if (!values) {
            newAttr[prop] = val;
            optionsToApply[0] = newAttr;
        } else {
            // It is needed to deal with the whole group zIndexing
            // in case of graph rotation
            if (hasZIndexes && hasZIndexes.group) {
                this.attr({
                    zIndex: hasZIndexes.group
                });
            }
            objectEach(values, function (partVal: any, part: string): void {
                newAttr[part] = {};
                newAttr[part][prop] = partVal;

                // include zIndexes if provided
                if (hasZIndexes) {
                    newAttr[part].zIndex = values.zIndexes[part] || 0;
                }
            });
            optionsToApply[1] = newAttr;
        }

        return elem3d.processParts.apply(elem3d, optionsToApply);
    },

    /**
     * Calls function for each part. Used for attr, animate and destroy.
     * @private
     */
    processParts: function (
        this: SVGElement,
        props: any,
        partsProps: AnyRecord,
        verb: string,
        duration?: any,
        complete?: any
    ): SVGElement {
        const elem3d = this;

        (elem3d.parts as any).forEach(function (part: string): void {
            // if different props for different parts
            if (partsProps) {
                props = pick(partsProps[part], false);
            }

            // only if something to set, but allow undefined
            if (props !== false) {
                elem3d[part][verb](props, duration, complete);
            }
        });
        return elem3d;
    },

    /**
     * Destroy all parts
     * @private
     */
    destroyParts: function (this: SVGElement): void {
        this.processParts(null, null, 'destroy');
        return this.originalDestroy();
    }

    /* eslint-enable valid-jsdoc */
} as SVGElement3DLikeBase;

SVGElement3D.cuboid = merge(SVGElement3D.base, {
    parts: ['front', 'top', 'side'],
    pathType: 'cuboid',

    attr: function (
        this: SVGElement,
        args: (string|SVGAttributes),
        val?: (number|string|SVGPath),
        complete?: Function,
        continueAnimation?: boolean
    ): SVGElement {
        // Resolve setting attributes by string name
        if (typeof args === 'string' && typeof val !== 'undefined') {
            const key = args;

            args = {} as SVGAttributes;
            (args as any)[key] = val;
        }

        if ((args as any).shapeArgs || defined((args as any).x)) {
            return this.singleSetterForParts(
                'd',
                null,
                (this.renderer as any)[this.pathType + 'Path'](
                    (args as any).shapeArgs || args
                )
            );
        }

        return SVGElement.prototype.attr.call(
            this, args as any, void 0, complete, continueAnimation
        );
    },
    animate: function (
        this: SVGElement,
        args: SVGAttributes,
        duration?: (boolean|Partial<AnimationOptions>),
        complete?: Function
    ): SVGElement {
        if (defined(args.x) && defined(args.y)) {
            const paths = (this.renderer as any)[this.pathType + 'Path'](args),
                forcedSides = paths.forcedSides;
            this.singleSetterForParts(
                'd', null, paths, 'animate', duration, complete
            );

            this.attr({
                zIndex: paths.zIndexes.group
            });

            // If sides that are forced to render changed, recalculate colors.
            if (forcedSides !== this.forcedSides) {
                this.forcedSides = forcedSides;
                if (!this.renderer.styledMode) {
                    SVGElement3D.cuboid.fillSetter.call(this, this.fill);
                }
            }
        } else {
            SVGElement.prototype.animate.call(this, args, duration, complete);
        }
        return this;
    },
    fillSetter: function (
        this: SVGElement,
        fill: ColorType
    ): SVGElement {
        const elem3d = this;
        elem3d.forcedSides = elem3d.forcedSides || [];
        elem3d.singleSetterForParts('fill', null, {
            front: fill,
            // Do not change color if side was forced to render.
            top: color(fill).brighten(
                elem3d.forcedSides.indexOf('top') >= 0 ? 0 : 0.1
            ).get(),
            side: color(fill).brighten(
                elem3d.forcedSides.indexOf('side') >= 0 ? 0 : -0.1
            ).get()
        });

        // fill for animation getter (#6776)
        elem3d.color = elem3d.fill = fill;

        return elem3d;
    }
} as SVGElement3DLikeCuboid);

/* *
 *
 *  Default Export
 *
 * */

export default SVGElement3D;
