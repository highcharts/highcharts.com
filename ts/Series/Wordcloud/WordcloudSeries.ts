/* *
 *
 *  Experimental Highcharts module which enables visualization of a word cloud.
 *
 *  (c) 2016-2024 Highsoft AS
 *  Authors: Jon Arild Nygard
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type PolygonBoxObject from '../../Core/Renderer/PolygonBoxObject';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type SizeObject from '../../Core/Renderer/SizeObject';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type {
    WordcloudSeriesOptions,
    WordcloudSeriesRotationOptions
} from './WordcloudSeriesOptions';

import DPU from '../DrawPointUtilities.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import Series from '../../Core/Series/Series.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    extend,
    isArray,
    isNumber,
    isObject,
    merge
} = U;
import WordcloudPoint from './WordcloudPoint.js';
import WordcloudSeriesDefaults from './WordcloudSeriesDefaults.js';
import WU from './WordcloudUtils.js';
const {
    archimedeanSpiral,
    extendPlayingField,
    getBoundingBoxFromPolygon,
    getPlayingField,
    getPolygon,
    getRandomPosition,
    getRotation,
    getScale,
    getSpiral,
    intersectionTesting,
    isPolygonsColliding,
    rectangularSpiral,
    rotate2DToOrigin,
    rotate2DToPoint,
    squareSpiral,
    updateFieldBoundaries
} = WU;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.wordcloud
 *
 * @augments Highcharts.Series
 */
class WordcloudSeries extends ColumnSeries {

    /* *
     *
     *  Static properties
     *
     * */

    public static defaultOptions: WordcloudSeriesOptions = merge(
        ColumnSeries.defaultOptions,
        WordcloudSeriesDefaults
    );

    /* *
     *
     * Properties
     *
     * */
    public data!: Array<WordcloudPoint>;
    public defaultScale?: number;
    public field?: WordcloudSeries.WordcloudFieldObject;
    public options!: WordcloudSeriesOptions;
    public points!: Array<WordcloudPoint>;

    /**
     *
     * Functions
     *
     */

    public pointAttribs(
        point: WordcloudPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const attribs = H.seriesTypes.column.prototype
            .pointAttribs.call(this, point, state);

        delete attribs.stroke;
        delete attribs['stroke-width'];

        return attribs;
    }

    /**
     * Calculates the fontSize of a word based on its weight.
     *
     * @private
     * @function Highcharts.Series#deriveFontSize
     *
     * @param {number} [relativeWeight=0]
     * The weight of the word, on a scale 0-1.
     *
     * @param {number} [maxFontSize=1]
     * The maximum font size of a word.
     *
     * @param {number} [minFontSize=1]
     * The minimum font size of a word.
     *
     * @return {number}
     * Returns the resulting fontSize of a word. If minFontSize is larger then
     * maxFontSize the result will equal minFontSize.
     */
    public deriveFontSize(
        relativeWeight?: number,
        maxFontSize?: number,
        minFontSize?: number
    ): number {
        const weight = isNumber(relativeWeight) ? relativeWeight : 0,
            max = isNumber(maxFontSize) ? maxFontSize : 1,
            min = isNumber(minFontSize) ? minFontSize : 1;

        return Math.floor(Math.max(min, weight * max));
    }

    public drawPoints(): void {

        if ((this as any).zoomBox) {
            return;
        }
        const series = this,
            hasRendered = series.hasRendered,
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            chart = series.chart,
            group = series.group,
            options = series.options,
            animation = options.animation,
            allowExtendPlayingField = options.allowExtendPlayingField,
            renderer = chart.renderer,
            placed: Array<WordcloudPoint> = [],
            placementStrategy = series.placementStrategy[
                options.placementStrategy as any
            ],
            rotation: WordcloudSeriesRotationOptions =
                options.rotation as any,
            weights = series.points.map(function (
                p: WordcloudPoint
            ): number {
                return p.weight;
            }),
            maxWeight = Math.max.apply(null, weights),
            // `concat()` prevents from sorting the original array.
            points = series.points.concat().sort((a, b): number => (
                b.weight - a.weight // Sort descending
            ));

        let testElement: SVGElement = renderer.text().add(group),
            field: WordcloudSeries.WordcloudFieldObject;

        // Reset the scale before finding the dimensions (#11993).
        // SVGGRaphicsElement.getBBox() (used in SVGElement.getBBox(boolean))
        // returns slightly different values for the same element depending on
        // whether it is rendered in a group which has already defined scale
        // (e.g. 6) or in the group without a scale (scale = 1).
        series.group.attr({
            scaleX: 1,
            scaleY: 1
        });

        // Get the dimensions for each word.
        // Used in calculating the playing field.
        for (const point of points) {
            const relativeWeight = 1 / maxWeight * point.weight,
                fontSize = series.deriveFontSize(
                    relativeWeight,
                    options.maxFontSize,
                    options.minFontSize
                ),
                css = extend({
                    fontSize: fontSize + 'px'
                }, options.style as any);

            testElement.css(css).attr({
                x: 0,
                y: 0,
                text: point.name
            });

            const bBox = testElement.getBBox(true);

            point.dimensions = {
                height: bBox.height,
                width: bBox.width
            };
        }

        // Calculate the playing field.
        field = getPlayingField(xAxis.len, yAxis.len, points);
        const spiral = getSpiral(series.spirals[options.spiral as any], {
            field: field
        });

        // Draw all the points.
        for (const point of points) {
            const relativeWeight = 1 / maxWeight * point.weight,
                fontSize = series.deriveFontSize(
                    relativeWeight,
                    options.maxFontSize,
                    options.minFontSize
                ),
                css = extend({
                    fontSize: fontSize + 'px'
                }, options.style as any),
                placement = placementStrategy(point, {
                    data: points,
                    field: field,
                    placed: placed,
                    rotation: rotation
                }),
                attr = extend(
                    series.pointAttribs(
                        point,
                        (point.selected && 'select' as any
                        )
                    ),
                    {
                        align: 'center',
                        'alignment-baseline': 'middle',
                        'dominant-baseline': 'middle', // #15973: Firefox
                        x: placement.x,
                        y: placement.y,
                        text: point.name,
                        rotation: isNumber(placement.rotation) ?
                            placement.rotation :
                            void 0
                    }
                ),
                polygon = getPolygon(
                    placement.x,
                    placement.y,
                    point.dimensions.width,
                    point.dimensions.height,
                    placement.rotation as any
                ),
                rectangle = getBoundingBoxFromPolygon(polygon);

            let delta: PositionObject = intersectionTesting(point, {
                    rectangle: rectangle,
                    polygon: polygon,
                    field: field,
                    placed: placed,
                    spiral: spiral,
                    rotation: placement.rotation
                }) as any,
                animate: (SVGAttributes|undefined);

            // If there is no space for the word, extend the playing field.
            if (!delta && allowExtendPlayingField) {
                // Extend the playing field to fit the word.
                field = extendPlayingField(field, rectangle);

                // Run intersection testing one more time to place the word.
                delta = intersectionTesting(point, {
                    rectangle: rectangle,
                    polygon: polygon,
                    field: field,
                    placed: placed,
                    spiral: spiral,
                    rotation: placement.rotation
                }) as any;
            }
            // Check if point was placed, if so delete it, otherwise place it
            // on the correct positions.
            if (isObject(delta)) {
                attr.x = (attr.x || 0) + delta.x;
                attr.y = (attr.y || 0) + delta.y;
                rectangle.left += delta.x;
                rectangle.right += delta.x;
                rectangle.top += delta.y;
                rectangle.bottom += delta.y;
                field = updateFieldBoundaries(field, rectangle);
                placed.push(point);
                point.isNull = false;
                point.isInside = true; // #15447
            } else {
                point.isNull = true;
            }

            if (animation) {
                // Animate to new positions
                animate = {
                    x: attr.x,
                    y: attr.y
                };
                // Animate from center of chart
                if (!hasRendered) {
                    attr.x = 0;
                    attr.y = 0;
                // Or animate from previous position
                } else {
                    delete attr.x;
                    delete attr.y;
                }
            }

            DPU.draw(point, {
                animatableAttribs: animate as any,
                attribs: attr,
                css: css,
                group: group,
                renderer: renderer,
                shapeArgs: void 0,
                shapeType: 'text'
            });
        }

        // Destroy the element after use.
        testElement = testElement.destroy() as any;

        // Scale the series group to fit within the plotArea.
        series.defaultScale = getScale(xAxis.len, yAxis.len, field);

        series.field = field;

        series.group.attr({
            scaleX: series.defaultScale,
            scaleY: series.defaultScale
        });
    }

    public hasData(): boolean {
        const series = this;

        return (
            isObject(series) as any &&
            series.visible === true &&
            isArray(series.points) &&
            series.points.length > 0
        );
    }

    public getPlotBox(name?: string): Series.PlotBoxTransform {
        const series = this,
            { chart, group, zoomBox } = this,
            { plotSizeX = 0, plotSizeY = 0, inverted } = chart,
            // Swap axes for inverted (#2339)
            xAxis = series[(inverted ? 'yAxis' : 'xAxis')],
            yAxis = series[(inverted ? 'xAxis' : 'yAxis')],
            width = xAxis ? xAxis.len : chart.plotWidth,
            height = yAxis ? yAxis.len : chart.plotHeight,
            x = xAxis ? xAxis.left : chart.plotLeft,
            y = yAxis ? yAxis.top : chart.plotTop,
            field = series.field;

        let left = 0,
            top = 0,
            translateX = x + width / 2,
            translateY = y + height / 2,
            initLeft = translateX,
            initTop = translateY,
            scale = series.defaultScale || 1,
            seriesHeight = 0,
            seriesWidth = 0;

        if (field) {
            seriesHeight =
                Math.max(Math.abs(field.top), Math.abs(field.bottom)) * 2;
            seriesWidth =
                Math.max(Math.abs(field.left), Math.abs(field.right)) * 2;
        }

        if (inverted) {
            [seriesWidth, seriesHeight] = [seriesHeight, seriesWidth];
        }

        if (group && zoomBox) {
            scale += zoomBox.scale - 1;

            const newWidth = Math.max(seriesWidth * scale, width),
                newHeight = Math.max(seriesHeight * scale, height),
                newMiddleX = x + newWidth / 2,
                newMiddleY = y + newHeight / 2,
                scaleDiff = scale - (group.scaleX || 1);

            // Do not apply translation when zooming out
            if (scaleDiff > 0) {
                left += scaleDiff *
                    (plotSizeX * zoomBox.x - (x + (width / 2)));
                top += scaleDiff *
                    (plotSizeY * zoomBox.y - (y + (height / 2)));
            }

            left -= (name === 'series' ? zoomBox.panX : 0);
            top -= (name === 'series' ? zoomBox.panY : 0);


            if (name === 'series') {
                zoomBox.x += zoomBox.panX;
                left += zoomBox.panX * plotSizeX;
                zoomBox.panX = 0;
                zoomBox.y += zoomBox.panY;
                top += zoomBox.panY * plotSizeY;
                zoomBox.panY = 0;
            }

            if (isNumber(group.translateX) && isNumber(group.translateY)) {
                initLeft = group.translateX;
                initTop = group.translateY;
            }

            translateX = initLeft - left;
            translateY = initTop - top;

            // Do not allow to move outside the chart
            // Vertical lock
            if (translateY > newMiddleY) {
                translateY = newMiddleY;
            } else if (
                translateY < 2 * y + height - newMiddleY
            ) {
                translateY = 2 * y + height - newMiddleY;
            }
            // Horizontal lock
            if (translateX > newMiddleX) {
                translateX = newMiddleX;
            } else if (
                translateX < 2 * x + width - newMiddleX
            ) {
                translateX = 2 * x + width - newMiddleX;
            }
        }

        return {
            translateX: translateX,
            translateY: translateY,
            scaleX: scale,
            scaleY: scale
        };
    }
}

/* *
 *
 * Prototype properties
 *
 * */
interface WordcloudSeries {
    placementStrategy: Record<string, WordcloudSeries.WordcloudPlacementFunction>;
    pointArrayMap: Array<string>;
    pointClass: typeof WordcloudPoint;
    spirals: Record<string, WordcloudSeries.WordcloudSpiralFunction>;
    utils: typeof WU;
}

extend(WordcloudSeries.prototype, {
    animate: noop,
    animateDrilldown: noop,
    animateDrillupFrom: noop,
    isCartesian: false,
    pointClass: WordcloudPoint,
    setClip: noop,

    // Strategies used for deciding rotation and initial position of a word. To
    // implement a custom strategy, have a look at the function random for
    // example.
    placementStrategy: {
        random: function (
            point: WordcloudPoint,
            options: WordcloudSeries.WordcloudPlacementOptionsObject
        ): WordcloudSeries.WordcloudPlacementObject {
            const field = options.field,
                r = options.rotation;

            return {
                x: getRandomPosition(field.width) - (field.width / 2),
                y: getRandomPosition(field.height) - (field.height / 2),
                rotation: getRotation(r.orientations, point.index, r.from, r.to)
            };
        },
        center: function (
            point: WordcloudPoint,
            options: WordcloudSeries.WordcloudPlacementOptionsObject
        ): WordcloudSeries.WordcloudPlacementObject {
            const r = options.rotation;

            return {
                x: 0,
                y: 0,
                rotation: getRotation(r.orientations, point.index, r.from, r.to)
            };
        }
    },
    pointArrayMap: ['weight'],
    // Spirals used for placing a word after the initial position experienced a
    // collision with either another word or the borders. To implement a custom
    // spiral, look at the function archimedeanSpiral for example.
    spirals: {
        'archimedean': archimedeanSpiral,
        'rectangular': rectangularSpiral,
        'square': squareSpiral
    },
    utils: {
        extendPlayingField: extendPlayingField,
        getRotation: getRotation,
        isPolygonsColliding: isPolygonsColliding,
        rotate2DToOrigin: rotate2DToOrigin,
        rotate2DToPoint: rotate2DToPoint
    } as any
});

/* *
 *
 * Registry
 *
 * */
declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        wordcloud: typeof WordcloudSeries;
    }
}

SeriesRegistry.registerSeriesType('wordcloud', WordcloudSeries);

/* *
 *
 *  Class Namespace
 *
 * */

namespace WordcloudSeries {
    export interface WordcloudFieldObject extends PolygonBoxObject, SizeObject {
        ratioX: number;
        ratioY: number;
    }
    export interface WordcloudPlacementFunction {
        (
            point: WordcloudPoint,
            options: WordcloudPlacementOptionsObject
        ): WordcloudPlacementObject;
    }
    export interface WordcloudPlacementObject extends PositionObject {
        rotation: (boolean|number);
    }
    export interface WordcloudPlacementOptionsObject {
        data: WordcloudSeries['data'];
        field: WordcloudFieldObject;
        placed: Array<WordcloudPoint>;
        rotation: WordcloudSeriesRotationOptions;
    }
    export interface WordcloudSpiralFunction {
        (
            attempt: number,
            params?: WordcloudSpiralParamsObject
        ): (boolean|PositionObject);
    }
    export interface WordcloudSpiralParamsObject {
        field: WordcloudFieldObject;
    }
    export interface WordcloudTestOptionsObject {
        field: WordcloudFieldObject;
        placed: Array<WordcloudPoint>;
        polygon: WU.PolygonObject;
        rectangle: PolygonBoxObject;
        rotation: (boolean|number);
        spiral: WordcloudSpiralFunction;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default WordcloudSeries;
