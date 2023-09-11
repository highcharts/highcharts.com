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
import type AST from '../../../Core/Renderer/HTML/AST';
import type Chart from '../../../Core/Chart/Chart';
import type { ControllableShapeOptions } from './ControllableOptions';
import type SVGAttributes from '../../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../../../Core/Renderer/SVG/SVGRenderer';

import Controllable from './Controllable.js';
import ControllableDefaults from './ControllableDefaults.js';
const { defaultMarkers } = ControllableDefaults;
import H from '../../../Core/Globals.js';
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { defined, extend, merge } = OH;
const { addEvent } = EH;
const {
    uniqueKey
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './ControllableLike' {
    interface ControllableLike {
        markerEnd?: SVGElement;
        markerStart?: SVGElement;
    }
}
declare module '../../../Core/Options'{
    interface Options {
        defs?: Record<string, AST.Node>;
    }
}

declare module '../../../Core/Renderer/SVG/SVGRendererLike' {
    interface SVGRendererLike {
        addMarker(id: string, markerOptions: AST.Node): SVGElement;
    }
}

interface MarkerSetterFunction {
    (this: SVGElement, value: string): void;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

const markerEndSetter = createMarkerSetter('marker-end');

const markerStartSetter = createMarkerSetter('marker-start');

// See TRACKER_FILL in highcharts.src.js
const TRACKER_FILL = 'rgba(192,192,192,' + (H.svg ? 0.0001 : 0.002) + ')';

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function createMarkerSetter(
    markerType: string
): MarkerSetterFunction {
    return function (this: SVGElement, value: string): void {
        this.attr(markerType, 'url(#' + value + ')');
    };
}

/**
 * @private
 */
function onChartAfterGetContainer(
    this: Chart
): void {
    this.options.defs = merge(defaultMarkers, this.options.defs || {});

    // objectEach(this.options.defs, function (def): void {
    //     const attributes = def.attributes;
    //     if (
    //         def.tagName === 'marker' &&
    //         attributes &&
    //         attributes.id &&
    //         attributes.display !== 'none'
    //     ) {
    //         this.renderer.addMarker(attributes.id, def);
    //     }
    // }, this);
}

/**
 * @private
 */
function svgRendererAddMarker(
    this: SVGRenderer,
    id: string,
    markerOptions: AST.Node
): SVGElement {
    const options: AST.Node = { attributes: { id } };

    const attrs: SVGAttributes = {
        stroke: (markerOptions as any).color || 'none',
        fill: (markerOptions as any).color || 'rgba(0, 0, 0, 0.75)'
    };

    options.children = (
        markerOptions.children &&
        markerOptions.children.map(
            function (child: AST.Node): AST.Node {
                return merge(attrs, child);
            }
        )
    );

    const ast = merge(true, {
        attributes: {
            markerWidth: 20,
            markerHeight: 20,
            refX: 0,
            refY: 0,
            orient: 'auto'
        }
    }, markerOptions, options);

    const marker = this.definition(ast);

    marker.id = id;

    return marker;
}

/* *
 *
 *  Class
 *
 * */

/**
 * A controllable path class.
 *
 * @requires modules/annotations
 *
 * @private
 * @class
 * @name Highcharts.AnnotationControllablePath
 *
 * @param {Highcharts.Annotation}
 * Related annotation.
 *
 * @param {Highcharts.AnnotationsShapeOptions} options
 * A path's options object.
 *
 * @param {number} index
 * Index of the path.
 */
class ControllablePath extends Controllable {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A map object which allows to map options attributes to element attributes
     *
     * @name Highcharts.AnnotationControllablePath.attrsMap
     * @type {Highcharts.Dictionary<string>}
     */
    public static attrsMap = {
        dashStyle: 'dashstyle',
        strokeWidth: 'stroke-width',
        stroke: 'stroke',
        fill: 'fill',
        zIndex: 'zIndex'
    };

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        ChartClass: typeof Chart,
        SVGRendererClass: typeof SVGRenderer
    ): void {

        if (pushUnique(composedMembers, ChartClass)) {
            addEvent(ChartClass, 'afterGetContainer', onChartAfterGetContainer);
        }

        if (pushUnique(composedMembers, SVGRendererClass)) {
            const svgRendererProto = SVGRendererClass.prototype;

            svgRendererProto.addMarker = svgRendererAddMarker;
        }

    }

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

    public type = 'path';

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Map the controllable path to 'd' path attribute.
     *
     * @return {Highcharts.SVGPathArray|null}
     * A path's d attribute.
     */
    public toD(): (SVGPath|null) {
        const dOption = this.options.d;

        if (dOption) {
            return typeof dOption === 'function' ?
                dOption.call(this) :
                dOption;
        }

        const points = this.points,
            len = points.length,
            d: SVGPath = [];

        let showPath: boolean = len as any,
            point = points[0],
            position = showPath && this.anchor(point).absolutePosition,
            pointIndex = 0,
            command;

        if (position) {
            d.push(['M', position.x, position.y]);

            while (++pointIndex < len && showPath) {
                point = points[pointIndex];
                command = point.command || 'L';
                position = this.anchor(point).absolutePosition;

                if (command === 'M') {
                    d.push([command, position.x, position.y]);
                } else if (command === 'L') {
                    d.push([command, position.x, position.y]);
                } else if (command === 'Z') {
                    d.push([command]);
                }

                showPath = point.series.visible;
            }
        }

        return (
            showPath && this.graphic ?
                this.chart.renderer.crispLine(d, this.graphic.strokeWidth()) :
                null
        );
    }

    public shouldBeDrawn(): boolean {
        return super.shouldBeDrawn() || !!this.options.d;
    }

    public render(parent: SVGElement): void {
        const options = this.options,
            attrs = this.attrsFromOptions(options);

        this.graphic = this.annotation.chart.renderer
            .path([['M', 0, 0]])
            .attr(attrs)
            .add(parent);

        if (options.className) {
            this.graphic.addClass(options.className);
        }

        this.tracker = this.annotation.chart.renderer
            .path([['M', 0, 0]])
            .addClass('highcharts-tracker-line')
            .attr({
                zIndex: 2
            })
            .add(parent);

        if (!this.annotation.chart.styledMode) {
            this.tracker.attr({
                'stroke-linejoin': 'round', // #1225
                stroke: TRACKER_FILL,
                fill: TRACKER_FILL,
                'stroke-width': this.graphic.strokeWidth() +
                    (options.snap as any) * 2
            });
        }

        super.render();

        extend(this.graphic, { markerStartSetter, markerEndSetter });

        this.setMarkers(this);
    }

    public redraw(animation?: boolean): void {

        if (this.graphic) {
            const d = this.toD(),
                action = animation ? 'animate' : 'attr';

            if (d) {
                this.graphic[action]({ d: d });
                this.tracker[action]({ d: d });
            } else {
                this.graphic.attr({ d: 'M 0 ' + -9e9 });
                this.tracker.attr({ d: 'M 0 ' + -9e9 });
            }

            this.graphic.placed = this.tracker.placed = !!d;
        }

        super.redraw(animation);
    }

    /**
     * Set markers.
     * @private
     * @param {Highcharts.AnnotationControllablePath} item
     */
    public setMarkers(item: ControllablePath): void {
        const itemOptions = item.options,
            chart = item.chart,
            defs = chart.options.defs,
            fill = itemOptions.fill,
            color = defined(fill) && fill !== 'none' ?
                fill :
                itemOptions.stroke;

        const setMarker = function (
            markerType: ('markerEnd'|'markerStart')
        ): void {
            let markerId = itemOptions[markerType],
                def,
                predefinedMarker,
                key,
                marker;

            if (markerId) {
                for (key in defs) { // eslint-disable-line guard-for-in
                    def = defs[key];

                    if (
                        (
                            markerId === (
                                def.attributes && def.attributes.id
                            ) ||
                            // Legacy, for
                            // unit-tests/annotations/annotations-shapes
                            markerId === (def as any).id
                        ) &&
                        def.tagName === 'marker'
                    ) {
                        predefinedMarker = def;
                        break;
                    }
                }

                if (predefinedMarker) {
                    marker = item[markerType] = chart.renderer
                        .addMarker(
                            (itemOptions.id || uniqueKey()) + '-' + markerId,
                            merge(predefinedMarker, { color: color })
                        );

                    item.attr(markerType, marker.getAttribute('id'));
                }
            }
        };

        (['markerStart', 'markerEnd'] as Array<('markerEnd'|'markerStart')>)
            .forEach(setMarker);
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface ControllablePath {
    collections: 'shapes';
    itemType: 'shape';
    options: ControllableShapeOptions;
    tracker: SVGElement;
}

/* *
 *
 *  Registry
 *
 * */

declare module './ControllableType' {
    interface ControllableShapeTypeRegistry {
        path: typeof ControllablePath;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ControllablePath;
