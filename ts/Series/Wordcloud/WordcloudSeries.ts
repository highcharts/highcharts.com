/* *
 *
 *  Experimental Highcharts module which enables visualization of a word cloud.
 *
 *  (c) 2016-2021 Highsoft AS
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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
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
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;
import WordcloudPoint from './WordcloudPoint.js';
import WordcloudUtils from './WordcloudUtils.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject } = TC;
const { extend, merge } = OH;
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
} = WordcloudUtils;

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
     * Static properties
     *
     * */

    /**
     * A word cloud is a visualization of a set of words, where the size and
     * placement of a word is determined by how it is weighted.
     *
     * @sample highcharts/demo/wordcloud Word Cloud chart
     *
     * @extends      plotOptions.column
     * @excluding    allAreas, boostThreshold, clip, colorAxis, compare,
     *               compareBase, crisp, cropThreshold, dataGrouping,
     *               dataLabels, depth, dragDrop, edgeColor, findNearestPointBy,
     *               getExtremesFromAll, grouping, groupPadding, groupZPadding,
     *               joinBy, maxPointWidth, minPointLength, navigatorOptions,
     *               negativeColor, pointInterval, pointIntervalUnit,
     *               pointPadding, pointPlacement, pointRange, pointStart,
     *               pointWidth, pointStart, pointWidth, shadow, showCheckbox,
     *               showInNavigator, softThreshold, stacking, threshold,
     *               zoneAxis, zones, dataSorting, boostBlending
     * @product      highcharts
     * @since        6.0.0
     * @requires     modules/wordcloud
     * @optionparent plotOptions.wordcloud
     */
    public static defaultOptions: WordcloudSeriesOptions = merge(ColumnSeries.defaultOptions, {
        /**
         * If there is no space for a word on the playing field, then this
         * option will allow the playing field to be extended to fit the word.
         * If false then the word will be dropped from the visualization.
         *
         * NB! This option is currently not decided to be published in the API,
         * and is therefore marked as private.
         *
         * @ignore-option
         */
        allowExtendPlayingField: true,
        animation: {
            /** @internal */
            duration: 500
        },
        borderWidth: 0,
        /**
         * @ignore-option
         */
        clip: false, // Something goes wrong with clip. // @todo fix this
        colorByPoint: true,
        cropThreshold: Infinity,
        /**
         * A threshold determining the minimum font size that can be applied to
         * a word.
         */
        minFontSize: 1,
        /**
         * The word with the largest weight will have a font size equal to this
         * value. The font size of a word is the ratio between its weight and
         * the largest occuring weight, multiplied with the value of
         * maxFontSize.
         */
        maxFontSize: 25,
        /**
         * This option decides which algorithm is used for placement, and
         * rotation of a word. The choice of algorith is therefore a crucial
         * part of the resulting layout of the wordcloud. It is possible for
         * users to add their own custom placement strategies for use in word
         * cloud. Read more about it in our
         * [documentation](https://www.highcharts.com/docs/chart-and-series-types/word-cloud-series#custom-placement-strategies)
         *
         * @validvalue ["center", "random"]
         */
        placementStrategy: 'center',
        /**
         * Rotation options for the words in the wordcloud.
         *
         * @sample highcharts/plotoptions/wordcloud-rotation
         *         Word cloud with rotation
         */
        rotation: {
            /**
             * The smallest degree of rotation for a word.
             */
            from: 0,
            /**
             * The number of possible orientations for a word, within the range
             * of `rotation.from` and `rotation.to`. Must be a number larger
             * than 0.
             */
            orientations: 2,
            /**
             * The largest degree of rotation for a word.
             */
            to: 90
        },
        showInLegend: false,
        /**
         * Spiral used for placing a word after the initial position
         * experienced a collision with either another word or the borders.
         * It is possible for users to add their own custom spiralling
         * algorithms for use in word cloud. Read more about it in our
         * [documentation](https://www.highcharts.com/docs/chart-and-series-types/word-cloud-series#custom-spiralling-algorithm)
         *
         * @validvalue ["archimedean", "rectangular", "square"]
         */
        spiral: 'rectangular',
        /**
         * CSS styles for the words.
         *
         * @type    {Highcharts.CSSObject}
         * @default {"fontFamily":"sans-serif", "fontWeight": "900"}
         */
        style: {
            /** @ignore-option */
            fontFamily: 'sans-serif',
            /** @ignore-option */
            fontWeight: '900',
            /** @ignore-option */
            whiteSpace: 'nowrap'
        },
        tooltip: {
            followPointer: true,
            pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.weight}</b><br/>'
        }
    } as WordcloudSeriesOptions);

    /* *
     *
     * Properties
     *
     * */
    public data: Array<WordcloudPoint> = void 0 as any;
    public options: WordcloudSeriesOptions = void 0 as any;
    public points: Array<WordcloudPoint> = void 0 as any;

    /**
     *
     * Functions
     *
     */
    public bindAxes(): void {
        const wordcloudAxis = {
            endOnTick: false,
            gridLineWidth: 0,
            lineWidth: 0,
            maxPadding: 0,
            startOnTick: false,
            title: void 0,
            tickPositions: []
        };

        Series.prototype.bindAxes.call(this);
        extend(this.yAxis.options, wordcloudAxis);
        extend(this.xAxis.options, wordcloudAxis);
    }

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
        let series = this,
            hasRendered = series.hasRendered,
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            chart = series.chart,
            group = series.group,
            options = series.options,
            animation = options.animation,
            allowExtendPlayingField = options.allowExtendPlayingField,
            renderer = chart.renderer,
            testElement: SVGElement = renderer.text().add(group),
            placed: Array<WordcloudPoint> = [],
            placementStrategy = series.placementStrategy[
                options.placementStrategy as any
            ],
            spiral: WordcloudSeries.WordcloudSpiralFunction,
            rotation: WordcloudSeriesRotationOptions =
                options.rotation as any,
            scale,
            weights = series.points.map(function (
                p: WordcloudPoint
            ): number {
                return p.weight;
            }),
            maxWeight = Math.max.apply(null, weights),
            // concat() prevents from sorting the original array.
            data = series.points.concat().sort(function (
                a: WordcloudPoint,
                b: WordcloudPoint
            ): number {
                return b.weight - a.weight; // Sort descending
            }),
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
        data.forEach(function (point: WordcloudPoint): void {
            let relativeWeight = 1 / maxWeight * point.weight,
                fontSize = series.deriveFontSize(
                    relativeWeight,
                    options.maxFontSize,
                    options.minFontSize
                ),
                css = extend({
                    fontSize: fontSize + 'px'
                }, options.style as any),
                bBox: BBoxObject;

            testElement.css(css).attr({
                x: 0,
                y: 0,
                text: point.name
            });
            bBox = testElement.getBBox(true);
            point.dimensions = {
                height: bBox.height,
                width: bBox.width
            };
        });

        // Calculate the playing field.
        field = getPlayingField(xAxis.len, yAxis.len, data);
        spiral = getSpiral(series.spirals[options.spiral as any], {
            field: field
        });
        // Draw all the points.
        data.forEach(function (point: WordcloudPoint): void {
            let relativeWeight = 1 / maxWeight * point.weight,
                fontSize = series.deriveFontSize(
                    relativeWeight,
                    options.maxFontSize,
                    options.minFontSize
                ),
                css = extend({
                    fontSize: fontSize + 'px'
                }, options.style as any),
                placement = placementStrategy(point, {
                    data: data,
                    field: field,
                    placed: placed,
                    rotation: rotation
                }),
                attr = extend(
                    series.pointAttribs(
                        point,
                        (point.selected && 'select' as any)
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
                rectangle = getBoundingBoxFromPolygon(polygon),
                delta: PositionObject = intersectionTesting(point, {
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
                // or animate from previous position
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
        });

        // Destroy the element after use.
        testElement = testElement.destroy() as any;

        // Scale the series group to fit within the plotArea.
        scale = getScale(xAxis.len, yAxis.len, field);
        series.group.attr({
            scaleX: scale,
            scaleY: scale
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

    public getPlotBox(): Series.PlotBoxTransform {
        const series = this,
            chart = series.chart,
            inverted = chart.inverted,
            // Swap axes for inverted (#2339)
            xAxis = series[(inverted ? 'yAxis' : 'xAxis')],
            yAxis = series[(inverted ? 'xAxis' : 'yAxis')],
            width = xAxis ? xAxis.len : chart.plotWidth,
            height = yAxis ? yAxis.len : chart.plotHeight,
            x = xAxis ? xAxis.left : chart.plotLeft,
            y = yAxis ? yAxis.top : chart.plotTop;

        return {
            translateX: x + (width / 2),
            translateY: y + (height / 2),
            scaleX: 1, // #1623
            scaleY: 1
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
    utils: typeof WordcloudUtils;
}

extend(WordcloudSeries.prototype, {
    animate: noop,
    animateDrilldown: noop,
    animateDrillupFrom: noop,
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
        polygon: WordcloudUtils.PolygonObject;
        rectangle: PolygonBoxObject;
        rotation: (boolean|number);
        spiral: WordcloudSpiralFunction;
    }
}

/* *
 *
 * Export Default
 *
 * */
export default WordcloudSeries;

/* *
 *
 * API Options
 *
 * */
/**
 * A `wordcloud` series. If the [type](#series.wordcloud.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.wordcloud
 * @exclude   dataSorting, boostThreshold, boostBlending
 * @product   highcharts
 * @requires  modules/wordcloud
 * @apioption series.wordcloud
 */

/**
 * An array of data points for the series. For the `wordcloud` series type,
 * points can be given in the following ways:
 *
 * 1. An array of arrays with 2 values. In this case, the values correspond to
 *    `name,weight`.
 *    ```js
 *    data: [
 *        ['Lorem', 4],
 *        ['Ipsum', 1]
 *    ]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.arearange.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        name: "Lorem",
 *        weight: 4
 *    }, {
 *        name: "Ipsum",
 *        weight: 1
 *    }]
 *    ```
 *
 * @type      {Array<Array<string,number>|*>}
 * @extends   series.line.data
 * @excluding drilldown, marker, x, y
 * @product   highcharts
 * @apioption series.wordcloud.data
 */

/**
 * The name decides the text for a word.
 *
 * @type      {string}
 * @since     6.0.0
 * @product   highcharts
 * @apioption series.wordcloud.data.name
 */

/**
 * The weighting of a word. The weight decides the relative size of a word
 * compared to the rest of the collection.
 *
 * @type      {number}
 * @since     6.0.0
 * @product   highcharts
 * @apioption series.wordcloud.data.weight
 */

''; // detach doclets above
