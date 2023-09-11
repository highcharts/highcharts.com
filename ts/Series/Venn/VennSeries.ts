/* *
 *
 *  Experimental Highcharts module which enables visualization of a Venn
 *  diagram.
 *
 *  (c) 2016-2021 Highsoft AS
 *  Authors: Jon Arild Nygard
 *
 *  Layout algorithm by Ben Frederickson:
 *  https://www.benfrederickson.com/better-venn-diagrams/
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

import type CircleObject from '../../Core/Geometry/CircleObject';
import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type IntersectionObject from '../../Core/Geometry/IntersectionObject';
import type PolygonBoxObject from '../../Core/Renderer/PolygonBoxObject';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type { SeriesStatesOptions } from '../../Core/Series/SeriesOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type VennSeriesOptions from './VennSeriesOptions';

import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject } = A;
import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import CU from '../../Core/Geometry/CircleUtilities.js';
const {
    getAreaOfIntersectionBetweenCircles,
    getCirclesIntersectionPolygon,
    isCircle1CompletelyOverlappingCircle2,
    isPointInsideAllCircles,
    isPointOutsideAllCircles
} = CU;
import DPU from '../DrawPointUtilities.js';
import GU from '../../Core/Geometry/GeometryUtilities.js';
const { getCenterOfPoints } = GU;
import { Palette } from '../../Core/Color/Palettes.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        scatter: ScatterSeries
    }
} = SeriesRegistry;
import VennPoint from './VennPoint.js';
import VennUtils from './VennUtils.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject } = TC;
const { extend, merge } = OH;
const { addEvent } = EH;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface VennLabelPositionObject {
            point: PositionObject;
            margin: number;
        }
        interface VennLabelValuesObject {
            position: PositionObject;
            width: number;
        }
        interface VennLabelOverlapObject {
            coordinates: PositionObject;
            loss: number;
        }
        interface VennPropsObject {
            overlapping?: Record<string, number>;
            totalOverlap?: number;
        }
        interface VennRelationObject extends VennPropsObject {
            circle?: CircleObject;
            sets: Array<string>;
            value: number;
        }
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.venn
 *
 * @augments Highcharts.Series
 */
class VennSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static splitter = 'highcharts-split';

    /**
     * A Venn diagram displays all possible logical relations between a
     * collection of different sets. The sets are represented by circles, and
     * the relation between the sets are displayed by the overlap or lack of
     * overlap between them. The venn diagram is a special case of Euler
     * diagrams, which can also be displayed by this series type.
     *
     * @sample {highcharts} highcharts/demo/venn-diagram/
     *         Venn diagram
     * @sample {highcharts} highcharts/demo/euler-diagram/
     *         Euler diagram
     * @sample {highcharts} highcharts/series-venn/point-legend/
     *         Venn diagram with a legend
     *
     * @extends      plotOptions.scatter
     * @excluding    connectEnds, connectNulls, cropThreshold, dragDrop,
     *               findNearestPointBy, getExtremesFromAll, jitter, label,
     *               linecap, lineWidth, linkedTo, marker, negativeColor,
     *               pointInterval, pointIntervalUnit, pointPlacement,
     *               pointStart, softThreshold, stacking, steps, threshold,
     *               xAxis, yAxis, zoneAxis, zones, dataSorting, boostThreshold,
     *               boostBlending
     * @product      highcharts
     * @requires     modules/venn
     * @optionparent plotOptions.venn
     */
    public static defaultOptions: VennSeriesOptions = merge(ScatterSeries.defaultOptions, {
        borderColor: Palette.neutralColor20,
        borderDashStyle: 'solid' as any,
        borderWidth: 1,
        brighten: 0,
        clip: false,
        colorByPoint: true,
        dataLabels: {
            enabled: true,
            verticalAlign: 'middle',
            formatter: function (): (string|undefined) {
                return this.point.name;
            }
        },
        /**
         * @default   true
         * @extends   plotOptions.series.inactiveOtherPoints
         * @private
         */
        inactiveOtherPoints: true,
        /**
         * @ignore-option
         * @private
         */
        marker: false as any,
        opacity: 0.75,
        showInLegend: false,
        /**
         * @ignore-option
         *
         * @private
         */
        legendType: 'point',
        states: {
            /**
             * @excluding halo
             */
            hover: {
                opacity: 1,
                borderColor: Palette.neutralColor80
            },
            /**
             * @excluding halo
             */
            select: {
                color: Palette.neutralColor20,
                borderColor: Palette.neutralColor100,
                animation: false
            },
            inactive: {
                opacity: 0.075
            }
        },
        tooltip: {
            pointFormat: '{point.name}: {point.value}'
        },
        legendSymbol: 'rectangle'
    } as VennSeriesOptions);

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Finds the optimal label position by looking for a position that has a low
     * distance from the internal circles, and as large possible distane to the
     * external circles.
     * @private
     * @todo Optimize the intial position.
     * @todo Add unit tests.
     * @param {Array<Highcharts.CircleObject>} internal
     * Internal circles.
     * @param {Array<Highcharts.CircleObject>} external
     * External circles.
     * @return {Highcharts.PositionObject}
     * Returns the found position.
     */
    public static getLabelPosition(
        internal: Array<CircleObject>,
        external: Array<CircleObject>
    ): PositionObject {
        // Get the best label position within the internal circles.
        let best = internal.reduce(
            (best, circle): Highcharts.VennLabelPositionObject => {
                const d = circle.r / 2;

                // Give a set of points with the circle to evaluate as the best
                // label position.
                return [
                    { x: circle.x, y: circle.y },
                    { x: circle.x + d, y: circle.y },
                    { x: circle.x - d, y: circle.y },
                    { x: circle.x, y: circle.y + d },
                    { x: circle.x, y: circle.y - d }
                ]
                    // Iterate the given points and return the one with the
                    // largest margin.
                    .reduce((
                        best,
                        point
                    ): Highcharts.VennLabelPositionObject => {
                        const margin = VennUtils.getMarginFromCircles(
                            point,
                            internal,
                            external
                        );

                        // If the margin better than the current best, then
                        // update sbest.
                        if (best.margin < margin) {
                            best.point = point;
                            best.margin = margin;
                        }
                        return best;
                    }, best);
            }, {
                point: void 0 as any,
                margin: -Number.MAX_VALUE
            }
        ).point;

        // Use nelder mead to optimize the initial label position.
        const optimal = VennUtils.nelderMead(
            function (p: Array<number>): number {
                return -(
                    VennUtils.getMarginFromCircles(
                        { x: p[0], y: p[1] },
                        internal,
                        external
                    )
                );
            },
            [best.x, best.y] as any
        );

        // Update best to be the point which was found to have the best margin.
        best = {
            x: optimal[0],
            y: optimal[1]
        };

        if (!(
            isPointInsideAllCircles(best, internal) &&
            isPointOutsideAllCircles(best, external)
        )) {
            // If point was either outside one of the internal, or inside one of
            // the external, then it was invalid and should use a fallback.
            if (internal.length > 1) {
                best = getCenterOfPoints(
                    getCirclesIntersectionPolygon(internal)
                );
            } else {
                best = {
                    x: internal[0].x,
                    y: internal[0].y
                };
            }
        }

        // Return the best point.
        return best;
    }

    /**
     * Calulates data label values for a given relations object.
     *
     * @private
     * @todo add unit tests
     * @param {Highcharts.VennRelationObject} relation A relations object.
     * @param {Array<Highcharts.VennRelationObject>} setRelations The list of
     * relations that is a set.
     * @return {Highcharts.VennLabelValuesObject}
     * Returns an object containing position and width of the label.
     */
    public static getLabelValues(
        relation: Highcharts.VennRelationObject,
        setRelations: Array<Highcharts.VennRelationObject>
    ): Highcharts.VennLabelValuesObject {
        const sets = relation.sets;
        // Create a list of internal and external circles.
        const data = setRelations.reduce(
            (data, set): Record<string, Array<CircleObject>> => {
                // If the set exists in this relation, then it is internal,
                // otherwise it will be external.
                const isInternal = sets.indexOf(set.sets[0]) > -1;
                const property = isInternal ? 'internal' : 'external';

                // Add the circle to the list.
                if (set.circle) {
                    data[property].push(set.circle);
                }

                return data;
            }, {
                internal: [],
                external: []
            } as Record<string, Array<CircleObject>>
        );

        // Filter out external circles that are completely overlapping all
        // internal
        data.external = data.external.filter((externalCircle): boolean =>
            data.internal.some((internalCircle): boolean =>
                !isCircle1CompletelyOverlappingCircle2(
                    externalCircle, internalCircle
                )
            )
        );

        // Calulate the label position.
        const position = VennSeries.getLabelPosition(
            data.internal,
            data.external
        );
        // Calculate the label width
        const width = VennUtils.getLabelWidth(
            position,
            data.internal,
            data.external
        );

        return {
            position,
            width
        };
    }

    /**
     * Calculates the positions, and the label values of all the sets in the
     * venn diagram.
     *
     * @private
     * @todo Add support for constrained MDS.
     * @param {Array<Highchats.VennRelationObject>} relations
     * List of the overlap between two or more sets, or the size of a single
     * sset.
     * @return {Highcharts.Dictionary<*>}
     * List of circles and their calculated positions.
     */
    public static layout(
        relations: Array<Highcharts.VennRelationObject>
    ): ({
            mapOfIdToShape: Record<string, (CircleObject|IntersectionObject)>;
            mapOfIdToLabelValues: Record<string, (Highcharts.VennLabelValuesObject)>;
        }) {
        const mapOfIdToShape: Record<string, (CircleObject|IntersectionObject)> = {};
        const mapOfIdToLabelValues: Record<string, (Highcharts.VennLabelValuesObject)> = {};

        // Calculate best initial positions by using greedy layout.
        if (relations.length > 0) {
            const mapOfIdToCircles = VennUtils.layoutGreedyVenn(relations);
            const setRelations = relations.filter(VennUtils.isSet);

            relations.forEach(function (
                relation: Highcharts.VennRelationObject
            ): void {
                const sets = relation.sets;
                const id = sets.join();

                // Get shape from map of circles, or calculate intersection.
                const shape = VennUtils.isSet(relation) ?
                    mapOfIdToCircles[id] :
                    getAreaOfIntersectionBetweenCircles(
                        sets.map((set): CircleObject => mapOfIdToCircles[set])
                    );

                // Calculate label values if the set has a shape
                if (shape) {
                    mapOfIdToShape[id] = shape;
                    mapOfIdToLabelValues[id] = VennSeries.getLabelValues(
                        relation, setRelations
                    );
                }
            });
        }
        return { mapOfIdToShape, mapOfIdToLabelValues };
    }


    /**
     * Calculates the proper scale to fit the cloud inside the plotting area.
     * @private
     * @todo add unit test
     * @param {number} targetWidth
     * Width of target area.
     * @param {number} targetHeight
     * Height of target area.
     * @param {Highcharts.PolygonBoxObject} field
     * The playing field.
     * @return {Highcharts.Dictionary<number>}
     * Returns the value to scale the playing field up to the size of the target
     * area, and center of x and y.
     */
    public static getScale(
        targetWidth: number,
        targetHeight: number,
        field: PolygonBoxObject
    ): Record<string, number> {
        const height = field.bottom - field.top, // top is smaller than bottom
            width = field.right - field.left,
            scaleX = width > 0 ? 1 / width * targetWidth : 1,
            scaleY = height > 0 ? 1 / height * targetHeight : 1,
            adjustX = (field.right + field.left) / 2,
            adjustY = (field.top + field.bottom) / 2,
            scale = Math.min(scaleX, scaleY);

        return {
            scale: scale,
            centerX: targetWidth / 2 - adjustX * scale,
            centerY: targetHeight / 2 - adjustY * scale
        };
    }

    /**
     * If a circle is outside a give field, then the boundaries of the field is
     * adjusted accordingly. Modifies the field object which is passed as the
     * first parameter.
     * @private
     * @todo NOTE: Copied from wordcloud, can probably be unified.
     * @param {Highcharts.PolygonBoxObject} field
     * The bounding box of a playing field.
     * @param {Highcharts.CircleObject} circle
     * The bounding box for a placed point.
     * @return {Highcharts.PolygonBoxObject}
     * Returns a modified field object.
     */
    public static updateFieldBoundaries(
        field: PolygonBoxObject,
        circle: CircleObject
    ): PolygonBoxObject {
        const left = circle.x - circle.r,
            right = circle.x + circle.r,
            bottom = circle.y + circle.r,
            top = circle.y - circle.r;

        // TODO improve type checking.
        if (!isNumber(field.left) || field.left > left) {
            field.left = left;
        }
        if (!isNumber(field.right) || field.right < right) {
            field.right = right;
        }
        if (!isNumber(field.top) || field.top > top) {
            field.top = top;
        }
        if (!isNumber(field.bottom) || field.bottom < bottom) {
            field.bottom = bottom;
        }
        return field;
    }

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<VennPoint> = void 0 as any;

    public mapOfIdToRelation: Record<string, Highcharts.VennRelationObject> = void 0 as any;

    public options: VennSeriesOptions = void 0 as any;

    public points: Array<VennPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public animate(init?: boolean): void {
        if (!init) {
            const series = this,
                animOptions = animObject(series.options.animation);

            series.points.forEach(function (point): void {
                const args = point.shapeArgs;

                if (point.graphic && args) {
                    const attr: SVGAttributes = {},
                        animate: SVGAttributes = {};

                    if (args.d) {
                        // If shape is a path, then animate opacity.
                        attr.opacity = 0.001;
                    } else {
                        // If shape is a circle, then animate radius.
                        attr.r = 0;
                        animate.r = args.r;
                    }

                    point.graphic
                        .attr(attr)
                        .animate(animate, animOptions);

                    // If shape is path, then fade it in after the circles
                    // animation
                    if (args.d) {
                        setTimeout(function (): void {
                            if (point && point.graphic) {
                                point.graphic.animate({
                                    opacity: 1
                                });
                            }
                        }, animOptions.duration);
                    }
                }
            }, series);
        }
    }

    /**
     * Draw the graphics for each point.
     * @private
     */
    public drawPoints(): void {
        const series = this,
            // Series properties
            chart = series.chart,
            group: SVGElement = series.group as any,
            points = series.points || [],
            // Chart properties
            renderer = chart.renderer;

        // Iterate all points and calculate and draw their graphics.
        points.forEach(function (point: VennPoint): void {
            const attribs = {
                    zIndex: isArray(point.sets) ? point.sets.length : 0
                },
                shapeArgs: SVGAttributes = point.shapeArgs as any;

            // Add point attribs
            if (!chart.styledMode) {
                extend(attribs, series.pointAttribs(point, point.state));
            }
            // Draw the point graphic.
            DPU.draw(point, {
                isNew: !point.graphic,
                animatableAttribs: shapeArgs,
                attribs: attribs,
                group: group,
                renderer: renderer,
                shapeType: shapeArgs && shapeArgs.d ? 'path' : 'circle'
            });
        });

    }

    public init(): void {
        ScatterSeries.prototype.init.apply(this, arguments);

        // Venn's opacity is a different option from other series
        delete this.opacity;
    }

    /**
     * Calculates the style attributes for a point. The attributes can vary
     * depending on the state of the point.
     * @private
     * @param {Highcharts.Point} point
     * The point which will get the resulting attributes.
     * @param {string} [state]
     * The state of the point.
     * @return {Highcharts.SVGAttributes}
     * Returns the calculated attributes.
     */
    public pointAttribs(
        point: VennPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const series = this,
            seriesOptions = series.options || {},
            pointOptions = point && point.options || {},
            stateOptions =
                (state && (seriesOptions.states as any)[state as any]) || {},
            options = merge(
                seriesOptions,
                { color: point && point.color },
                pointOptions,
                stateOptions
            );

        // Return resulting values for the attributes.
        return {
            'fill': color(options.color)
                .brighten(options.brightness as any)
                .get(),
            // Set opacity directly to the SVG element, not to pattern #14372.
            opacity: options.opacity,
            'stroke': options.borderColor,
            'stroke-width': options.borderWidth,
            'dashstyle': options.borderDashStyle
        };
    }

    public translate(): void {

        const chart = this.chart;

        this.processedXData = this.xData as any;
        this.generatePoints();

        // Process the data before passing it into the layout function.
        const relations = VennUtils.processVennData(this.options.data as any,
            VennSeries.splitter);

        // Calculate the positions of each circle.
        const {
            mapOfIdToShape,
            mapOfIdToLabelValues
        } = VennSeries.layout(relations);

        // Calculate the scale, and center of the plot area.
        const field = Object.keys(mapOfIdToShape)
                .filter(function (key: string): boolean {
                    const shape = mapOfIdToShape[key];

                    return shape && isNumber((shape as any).r);
                })
                .reduce(function (
                    field: PolygonBoxObject,
                    key: string
                ): PolygonBoxObject {
                    return VennSeries.updateFieldBoundaries(
                        field,
                        mapOfIdToShape[key] as any
                    );
                }, { top: 0, bottom: 0, left: 0, right: 0 }),
            scaling = VennSeries.getScale(
                chart.plotWidth,
                chart.plotHeight,
                field
            ),
            scale = scaling.scale,
            centerX = scaling.centerX,
            centerY = scaling.centerY;

        // Iterate all points and calculate and draw their graphics.
        this.points.forEach(function (point: VennPoint): void {
            let sets: Array<string> = isArray(point.sets) ? point.sets : [],
                id = sets.join(),
                shape = mapOfIdToShape[id],
                shapeArgs: (SVGAttributes|undefined),
                dataLabelValues = mapOfIdToLabelValues[id] || {},
                dataLabelWidth = dataLabelValues.width,
                dataLabelPosition = dataLabelValues.position,
                dlOptions = point.options && point.options.dataLabels;

            if (shape) {
                if ((shape as any).r) {
                    shapeArgs = {
                        x: centerX + (shape as any).x * scale,
                        y: centerY + (shape as any).y * scale,
                        r: (shape as any).r * scale
                    };
                } else if ((shape as any).d) {

                    const d: SVGPath = (shape as any).d;
                    d.forEach((seg): void => {
                        if (seg[0] === 'M') {
                            seg[1] = centerX + seg[1] * scale;
                            seg[2] = centerY + seg[2] * scale;
                        } else if (seg[0] === 'A') {
                            seg[1] = seg[1] * scale;
                            seg[2] = seg[2] * scale;
                            seg[6] = centerX + seg[6] * scale;
                            seg[7] = centerY + seg[7] * scale;
                        }
                    });
                    shapeArgs = { d };
                }

                // Scale the position for the data label.
                if (dataLabelPosition) {
                    dataLabelPosition.x = centerX + dataLabelPosition.x * scale;
                    dataLabelPosition.y = centerY + dataLabelPosition.y * scale;
                } else {
                    dataLabelPosition = {} as any;
                }

                if (isNumber(dataLabelWidth)) {
                    dataLabelWidth = Math.round(dataLabelWidth * scale);
                }
            }

            point.shapeArgs = shapeArgs;

            // Placement for the data labels
            if (dataLabelPosition && shapeArgs) {
                point.plotX = dataLabelPosition.x;
                point.plotY = dataLabelPosition.y;
            }

            // Add width for the data label
            if (dataLabelWidth && shapeArgs) {
                point.dlOptions = merge(
                    true,
                    {
                        style: {
                            width: dataLabelWidth
                        }
                    } as DataLabelOptions,
                    isObject(dlOptions, true) ? dlOptions : void 0
                );
            }

            // Set name for usage in tooltip and in data label.
            point.name = point.options.name || sets.join('∩');
        });
    }

    /* eslint-enable valid-jsdoc */
}

/* *
 *
 *  Class Prototype
 *
 * */

interface VennSeries {
    axisTypes: Array<string>;
    directTouch: boolean;
    isCartesian: boolean;
    pointArrayMap: Array<string>;
    pointClass: typeof VennPoint;
    utils: typeof VennUtils;
}
extend(VennSeries.prototype, {
    axisTypes: [],
    directTouch: true,
    isCartesian: false,
    pointArrayMap: ['value'],
    pointClass: VennPoint,
    utils: VennUtils
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        venn: typeof VennSeries;
    }
}
SeriesRegistry.registerSeriesType('venn', VennSeries);

/* *
 *
 *  Default Export
 *
 * */

export default VennSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * A `venn` series. If the [type](#series.venn.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.venn
 * @excluding connectEnds, connectNulls, cropThreshold, dataParser, dataURL,
 *            findNearestPointBy, getExtremesFromAll, label, linecap, lineWidth,
 *            linkedTo, marker, negativeColor, pointInterval, pointIntervalUnit,
 *            pointPlacement, pointStart, softThreshold, stack, stacking, steps,
 *            threshold, xAxis, yAxis, zoneAxis, zones, dataSorting,
 *            boostThreshold, boostBlending
 * @product   highcharts
 * @requires  modules/venn
 * @apioption series.venn
 */

/**
 * @type      {Array<*>}
 * @extends   series.scatter.data
 * @excluding marker, x, y
 * @product   highcharts
 * @apioption series.venn.data
 */

/**
 * The name of the point. Used in data labels and tooltip. If name is not
 * defined then it will default to the joined values in
 * [sets](#series.venn.sets).
 *
 * @sample {highcharts} highcharts/demo/venn-diagram/
 *         Venn diagram
 * @sample {highcharts} highcharts/demo/euler-diagram/
 *         Euler diagram
 *
 * @type      {number}
 * @since     7.0.0
 * @product   highcharts
 * @apioption series.venn.data.name
 */

/**
 * The value of the point, resulting in a relative area of the circle, or area
 * of overlap between two sets in the venn or euler diagram.
 *
 * @sample {highcharts} highcharts/demo/venn-diagram/
 *         Venn diagram
 * @sample {highcharts} highcharts/demo/euler-diagram/
 *         Euler diagram
 *
 * @type      {number}
 * @since     7.0.0
 * @product   highcharts
 * @apioption series.venn.data.value
 */

/**
 * The set or sets the options will be applied to. If a single entry is defined,
 * then it will create a new set. If more than one entry is defined, then it
 * will define the overlap between the sets in the array.
 *
 * @sample {highcharts} highcharts/demo/venn-diagram/
 *         Venn diagram
 * @sample {highcharts} highcharts/demo/euler-diagram/
 *         Euler diagram
 *
 * @type      {Array<string>}
 * @since     7.0.0
 * @product   highcharts
 * @apioption series.venn.data.sets
 */

/**
 * @excluding halo
 * @apioption series.venn.states.hover
 */

/**
 * @excluding halo
 * @apioption series.venn.states.select
 */

''; // detach doclets above

/* eslint-disable no-invalid-this */

// Modify final series options.
addEvent(VennSeries, 'afterSetOptions', function (
    e: { options: VennSeriesOptions }
): void {
    const options = e.options,
        states: SeriesStatesOptions<VennSeries> = options.states as any;

    if (this.is('venn')) {
        // Explicitly disable all halo options.
        Object.keys(states).forEach(function (state: string): void {
            (states as any)[state].halo = false;
        });
    }
});
