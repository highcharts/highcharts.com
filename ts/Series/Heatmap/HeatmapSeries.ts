/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type AnimationOptions from '../../Core/Animation/AnimationOptions';
import type ColorAxis from '../../Core/Axis/Color/ColorAxis';
import type DataExtremesObject from '../../Core/Series/DataExtremesObject';
import type HeatmapSeriesOptions from './HeatmapSeriesOptions';
import type Point from '../../Core/Series/Point.js';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import Color from '../../Core/Color/Color.js';
import ColorMapComposition from '../ColorMapComposition.js';
import H from '../../Core/Globals.js';
const {
    doc
} = H;
import HeatmapPoint from './HeatmapPoint.js';
import { Palette } from '../../Core/Color/Palettes.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: Series,
    seriesTypes: {
        column: ColumnSeries,
        scatter: ScatterSeries
    }
} = SeriesRegistry;
import SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer.js';
const { prototype: { symbols } } = SVGRenderer;
import U from '../../Shared/Utilities.js';

const {
    clamp,
    pick
} = U;

import IU from '../InterpolationUtilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { extend, merge } = OH;
const { addEvent, fireEvent } = EH;

const {
    colorFromPoint,
    getContext
} = IU;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Renderer/SVG/SymbolType' {
    interface SymbolTypeRegistry {
        /** @requires Series/Heatmap/HeatmapSeries */
        ellipse: SymbolTypeRegistry['circle'];
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        valueMax?: number;
        valueMin?: number;
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
 * @name Highcharts.seriesTypes.heatmap
 *
 * @augments Highcharts.Series
 */
class HeatmapSeries extends ScatterSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A heatmap is a graphical representation of data where the individual
     * values contained in a matrix are represented as colors.
     *
     * @productdesc {highcharts}
     * Requires `modules/heatmap`.
     *
     * @sample highcharts/demo/heatmap/
     *         Simple heatmap
     * @sample highcharts/demo/heatmap-canvas/
     *         Heavy heatmap
     *
     * @extends      plotOptions.scatter
     * @excluding    animationLimit, connectEnds, connectNulls, cropThreshold,
     *               dashStyle, findNearestPointBy, getExtremesFromAll, jitter,
     *               linecap, lineWidth, pointInterval, pointIntervalUnit,
     *               pointRange, pointStart, shadow, softThreshold, stacking,
     *               step, threshold, cluster, dragDrop
     * @product      highcharts highmaps
     * @optionparent plotOptions.heatmap
     */
    public static defaultOptions: HeatmapSeriesOptions = merge(ScatterSeries.defaultOptions, {

        /**
         * Animation is disabled by default on the heatmap series.
         */
        animation: false,

        /**
         * The border radius for each heatmap item. The border's color and
         * width can be set in marker options.
         *
         * @see [lineColor](#plotOptions.heatmap.marker.lineColor)
         * @see [lineWidth](#plotOptions.heatmap.marker.lineWidth)
         */
        borderRadius: 0,

        /**
         * The border width for each heatmap item.
         */
        borderWidth: 0,

        /**
         * Padding between the points in the heatmap.
         *
         * @type      {number}
         * @default   0
         * @since     6.0
         * @apioption plotOptions.heatmap.pointPadding
         */

        /**
         * @default   value
         * @apioption plotOptions.heatmap.colorKey
         */

        /**
         * The main color of the series. In heat maps this color is rarely used,
         * as we mostly use the color to denote the value of each point. Unless
         * options are set in the [colorAxis](#colorAxis), the default value
         * is pulled from the [options.colors](#colors) array.
         *
         * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         * @since     4.0
         * @product   highcharts
         * @apioption plotOptions.heatmap.color
         */

        /**
         * The column size - how many X axis units each column in the heatmap
         * should span.
         *
         * @sample {highcharts} maps/demo/heatmap/
         *         One day
         * @sample {highmaps} maps/demo/heatmap/
         *         One day
         *
         * @type      {number}
         * @default   1
         * @since     4.0
         * @product   highcharts highmaps
         * @apioption plotOptions.heatmap.colsize
         */

        /**
         * The row size - how many Y axis units each heatmap row should span.
         *
         * @sample {highcharts} maps/demo/heatmap/
         *         1 by default
         * @sample {highmaps} maps/demo/heatmap/
         *         1 by default
         *
         * @type      {number}
         * @default   1
         * @since     4.0
         * @product   highcharts highmaps
         * @apioption plotOptions.heatmap.rowsize
         */

        /**
         * Make the heatmap render its data points as an interpolated image.
         *
         * @sample highcharts/demo/heatmap-interpolation
         *   Interpolated heatmap image displaying user activity on a website
         * @sample highcharts/series-heatmap/interpolation
         *   Interpolated heatmap toggle
         *
         */
        interpolation: false,

        /**
         * The color applied to null points. In styled mode, a general CSS class
         * is applied instead.
         *
         * @type {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
         */
        nullColor: Palette.neutralColor3,

        dataLabels: {
            formatter: function (): string { // #2945
                const { numberFormatter } = this.series.chart;
                const { value } = this.point as HeatmapPoint;

                return isNumber(value) ? numberFormatter(value, -1) : '';
            },
            inside: true,
            verticalAlign: 'middle',
            crop: false,
            /**
             * @ignore-option
             */
            overflow: 'allow',
            padding: 0 // #3837
        },
        /**
         * @excluding radius, enabledThreshold
         * @since     8.1
         */
        marker: {
            /**
             * A predefined shape or symbol for the marker. When undefined, the
             * symbol is pulled from options.symbols. Other possible values are
             * `'circle'`, `'square'`,`'diamond'`, `'triangle'`,
             * `'triangle-down'`, `'rect'`, and `'ellipse'`.
             *
             * Additionally, the URL to a graphic can be given on this form:
             * `'url(graphic.png)'`. Note that for the image to be applied to
             * exported charts, its URL needs to be accessible by the export
             * server.
             *
             * Custom callbacks for symbol path generation can also be added to
             * `Highcharts.SVGRenderer.prototype.symbols`. The callback is then
             * used by its method name, as shown in the demo.
             *
             * @sample {highcharts} highcharts/plotoptions/series-marker-symbol/
             *         Predefined, graphic and custom markers
             * @sample {highstock} highcharts/plotoptions/series-marker-symbol/
             *         Predefined, graphic and custom markers
             */
            symbol: 'rect',
            /** @ignore-option */
            radius: 0,
            lineColor: void 0,
            states: {
                /**
                 * @excluding radius, radiusPlus
                 */
                hover: {
                    /**
                     * Set the marker's fixed width on hover state.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
                     *         70px fixed marker's width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.hover.width
                     */

                    /**
                     * Set the marker's fixed height on hover state.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
                     *         70px fixed marker's width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.hover.height
                     */

                    /**
                     * The number of pixels to increase the width of the
                     * selected point.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
                     *         20px greater width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.hover.widthPlus
                     */

                    /**
                     * The number of pixels to increase the height of the
                     * selected point.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
                    *          20px greater width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.hover.heightPlus
                     */

                    /**
                     * The additional line width for a hovered point.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-linewidthplus
                     *         5 pixels wider lineWidth on hover
                     * @sample {highmaps} maps/plotoptions/heatmap-marker-states-hover-linewidthplus
                     *         5 pixels wider lineWidth on hover
                     */
                    lineWidthPlus: 0
                },
                /**
                 * @excluding radius
                 */
                select: {
                    /**
                     * Set the marker's fixed width on select state.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
                     *         70px fixed marker's width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.select.width
                     */

                    /**
                     * Set the marker's fixed height on select state.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
                     *         70px fixed marker's width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.select.height
                     */

                    /**
                     * The number of pixels to increase the width of the
                     * selected point.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
                     *         20px greater width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.select.widthPlus
                     */

                    /**
                     * The number of pixels to increase the height of the
                     * selected point.
                     *
                     * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
                     *         20px greater width and height on hover
                     *
                     * @type      {number|undefined}
                     * @default   undefined
                     * @product   highcharts highmaps
                     * @apioption plotOptions.heatmap.marker.states.select.heightPlus
                     */
                }
            }
        },

        clip: true,

        /** @ignore-option */
        pointRange: null, // dynamically set to colsize by default

        tooltip: {
            pointFormat: '{point.x}, {point.y}: {point.value}<br/>'
        },

        states: {

            hover: {

                /** @ignore-option */
                halo: false, // #3406, halo is disabled on heatmaps by default

                /**
                 * How much to brighten the point on interaction. Requires the
                 * main color to be defined in hex or rgb(a) format.
                 *
                 * In styled mode, the hover brightening is by default replaced
                 * with a fill-opacity set in the `.highcharts-point:hover`
                 * rule.
                 */
                brightness: 0.2
            }
        },

        legendSymbol: 'rectangle'

    } as HeatmapSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */
    public canvas?: HTMLCanvasElement = void 0 as any;

    public colorAxis: ColorAxis = void 0 as any;

    public context?: CanvasRenderingContext2D = void 0 as any;

    public data: Array<HeatmapPoint> = void 0 as any;

    public options: HeatmapSeriesOptions = void 0 as any;

    public points: Array<HeatmapPoint> = void 0 as any;

    public valueData?: Array<number>;

    public valueMax: number = NaN;

    public valueMin: number = NaN;

    public isDirtyCanvas: boolean = true;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    public drawPoints(): void {
        const
            series = this,
            seriesOptions = series.options,
            interpolation = seriesOptions.interpolation,
            seriesMarkerOptions = seriesOptions.marker || {};

        if (interpolation) {
            const
                { image, chart, xAxis, yAxis } = series,
                { reversed: xRev = false, len: width } = xAxis,
                { reversed: yRev = false, len: height } = yAxis,
                dimensions = { width, height };

            if (!image || series.isDirtyData || series.isDirtyCanvas) {
                const
                    ctx = getContext(series),
                    {
                        canvas,
                        options: { colsize = 1, rowsize = 1 },
                        points,
                        points: { length }
                    } = series,
                    pointsLen = length - 1,
                    colorAxis = (chart.colorAxis && chart.colorAxis[0]);

                if (canvas && ctx && colorAxis) {
                    const
                        { min: xMin, max: xMax } = xAxis.getExtremes(),
                        { min: yMin, max: yMax } = yAxis.getExtremes(),
                        xDelta = xMax - xMin,
                        yDelta = yMax - yMin,
                        imgMultiple = 8.0,
                        lastX = Math.round(
                            imgMultiple * ((xDelta / colsize) / imgMultiple)
                        ),
                        lastY = Math.round(
                            imgMultiple * ((yDelta / rowsize) / imgMultiple)
                        ),
                        [
                            transformX,
                            transformY
                        ] = [
                            [lastX, lastX / xDelta, xRev, 'ceil'],
                            [lastY, lastY / yDelta, !yRev, 'floor']
                        ].map(([last, scale, rev, rounding]): Function => (
                            rev ?
                                (v: number): number => (
                                    Math[rounding as 'floor' | 'ceil'](
                                        (last as number) -
                                        (scale as number * (v))
                                    )
                                ) :
                                (v: number): number => (
                                    Math[rounding as 'floor' | 'ceil'](
                                        (scale as number) * v
                                    )
                                )
                        )),
                        canvasWidth = canvas.width = lastX + 1,
                        canvasHeight = canvas.height = lastY + 1,
                        canvasArea = canvasWidth * canvasHeight,
                        pixelToPointScale = pointsLen / canvasArea,
                        pixelData = new Uint8ClampedArray(canvasArea * 4),

                        pointInPixels = (x: number, y: number): number => (
                            Math.ceil(
                                (canvasWidth * transformY(y - yMin)) +
                                transformX(x - xMin)
                            ) * 4
                        );

                    series.buildKDTree();

                    for (let i = 0; i < canvasArea; i++) {
                        const
                            point = points[
                                Math.ceil(pixelToPointScale * i)
                            ],
                            { x, y } = point;

                        pixelData.set(
                            colorFromPoint(point.value, point),
                            pointInPixels(x, y)
                        );
                    }

                    ctx.putImageData(
                        new ImageData(pixelData, canvasWidth), 0, 0
                    );

                    if (image) {
                        image.attr({
                            ...dimensions,
                            href: canvas.toDataURL('image/png', 1)
                        });
                    } else {
                        series.directTouch = false;
                        series.image = chart.renderer.image(
                            canvas.toDataURL('image/png', 1)
                        )
                            .attr(dimensions)
                            .add(series.group);
                    }
                }
                series.isDirtyCanvas = false;
            } else if (
                image.width !== width || image.height !== height
            ) {
                image.attr(dimensions);
            }
        } else if (seriesMarkerOptions.enabled || series._hasPointMarkers) {
            Series.prototype.drawPoints.call(series);

            series.points.forEach((point): void => {
                if (point.graphic) {

                    // In styled mode, use CSS, otherwise the fill used in
                    // the style sheet will take precedence over
                    // the fill attribute.
                    (point.graphic as any)[
                        series.chart.styledMode ? 'css' : 'animate'
                    ](series.colorAttribs(point));

                    if (point.value === null) { // #15708
                        point.graphic.addClass('highcharts-null-point');
                    }
                }
            });
        }
    }

    /**
     * @private
     */
    getExtremes(): DataExtremesObject {
        // Get the extremes from the value data
        const { dataMin, dataMax } = Series.prototype.getExtremes
            .call(this, this.valueData);

        if (isNumber(dataMin)) {
            this.valueMin = dataMin;
        }
        if (isNumber(dataMax)) {
            this.valueMax = dataMax;
        }

        // Get the extremes from the y data
        return Series.prototype.getExtremes.call(this);
    }

    /**
     * Override to also allow null points, used when building the k-d-tree for
     * tooltips in boost mode.
     * @private
     */
    getValidPoints(
        points?: Array<HeatmapPoint>,
        insideOnly?: boolean
    ): Array<Point> {
        return Series.prototype.getValidPoints.call(
            this,
            points,
            insideOnly,
            true
        );
    }

    /**
     * Define hasData function for non-cartesian series. Returns true if the
     * series has points at all.
     * @private
     */
    public hasData(): boolean {
        return !!this.processedXData.length; // != 0
    }

    /**
     * Override the init method to add point ranges on both axes.
     * @private
     */
    public init(): void {
        super.init.apply(this, arguments);

        const options = this.options;

        // #3758, prevent resetting in setData
        options.pointRange = pick(options.pointRange, options.colsize || 1);
        // general point range
        this.yAxis.axisPointRange = options.rowsize || 1;

        // Bind new symbol names
        symbols.ellipse = symbols.circle;

        // @todo
        //
        // Setting the border radius here is a workaround. It should be set in
        // the shapeArgs or returned from `markerAttribs`. However,
        // Series.drawPoints does not pick up markerAttribs to be passed over to
        // `renderer.symbol`. Also, image symbols are not positioned by their
        // top left corner like other symbols are. This should be refactored,
        // then we could save ourselves some tests for .hasImage etc. And the
        // evaluation of borderRadius would be moved to `markerAttribs`.
        if (options.marker && isNumber(options.borderRadius)) {
            options.marker.r = options.borderRadius;
        }
    }

    /**
     * @private
     */
    public markerAttribs(
        point: HeatmapPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const shapeArgs = point.shapeArgs || {};

        if (point.hasImage) {
            return {
                x: point.plotX,
                y: point.plotY
            };
        }

        // Setting width and height attributes on image does not affect on its
        // dimensions.
        if (state && state !== 'normal') {
            const pointMarkerOptions = point.options.marker || {},
                seriesMarkerOptions = this.options.marker || {},
                seriesStateOptions = (
                    seriesMarkerOptions.states &&
                    seriesMarkerOptions.states[state]
                ) || {},
                pointStateOptions = (
                    pointMarkerOptions.states &&
                    pointMarkerOptions.states[state]
                ) || {};

            // Set new width and height basing on state options.
            const width = (
                pointStateOptions.width ||
                seriesStateOptions.width ||
                shapeArgs.width ||
                0
            ) + (
                pointStateOptions.widthPlus ||
                seriesStateOptions.widthPlus ||
                0
            );

            const height = (
                pointStateOptions.height ||
                seriesStateOptions.height ||
                shapeArgs.height ||
                0
            ) + (
                pointStateOptions.heightPlus ||
                seriesStateOptions.heightPlus ||
                0
            );

            // Align marker by the new size.
            const x = (shapeArgs.x || 0) + ((shapeArgs.width || 0) - width) / 2,
                y = (shapeArgs.y || 0) + ((shapeArgs.height || 0) - height) / 2;

            return { x, y, width, height };
        }

        return shapeArgs;
    }

    /**
     * @private
     */
    public pointAttribs(
        point?: HeatmapPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const series = this,
            attr = Series.prototype.pointAttribs.call(series, point, state),
            seriesOptions = series.options || {},
            plotOptions = series.chart.options.plotOptions || {},
            seriesPlotOptions = plotOptions.series || {},
            heatmapPlotOptions = plotOptions.heatmap || {},
            // Get old properties in order to keep backward compatibility
            borderColor =
                (point && point.options.borderColor) ||
                seriesOptions.borderColor ||
                heatmapPlotOptions.borderColor ||
                seriesPlotOptions.borderColor,
            borderWidth =
                (point && point.options.borderWidth) ||
                seriesOptions.borderWidth ||
                heatmapPlotOptions.borderWidth ||
                seriesPlotOptions.borderWidth ||
                attr['stroke-width'];

        // Apply lineColor, or set it to default series color.
        attr.stroke = (
            (point && point.marker && point.marker.lineColor) ||
            (seriesOptions.marker && seriesOptions.marker.lineColor) ||
            borderColor ||
            this.color
        );
        // Apply old borderWidth property if exists.
        attr['stroke-width'] = borderWidth;

        if (state && state !== 'normal') {
            const stateOptions = merge(
                (
                    seriesOptions.states &&
                    seriesOptions.states[state]
                ),
                (
                    seriesOptions.marker &&
                    seriesOptions.marker.states &&
                    seriesOptions.marker.states[state]
                ),
                (
                    point &&
                    point.options.states &&
                    point.options.states[state] || {}
                )
            );

            attr.fill =
                stateOptions.color ||
                Color.parse(attr.fill).brighten(
                    stateOptions.brightness || 0
                ).get();

            (attr as any).stroke = (
                stateOptions.lineColor || attr.stroke
            ); // #17896
        }

        return attr;
    }

    /**
     * @private
     */
    public translate(): void {
        const series = this,
            options = series.options,
            { borderRadius, marker } = options,
            symbol = marker && marker.symbol || 'rect',
            shape = symbols[symbol] ? symbol : 'rect',
            hasRegularShape = ['circle', 'square'].indexOf(shape) !== -1;

        series.generatePoints();
        series.points.forEach(function (point): void {
            const cellAttr = point.getCellAttributes();

            let x = Math.min(cellAttr.x1, cellAttr.x2),
                y = Math.min(cellAttr.y1, cellAttr.y2),
                width = Math.max(Math.abs(cellAttr.x2 - cellAttr.x1), 0),
                height = Math.max(Math.abs(cellAttr.y2 - cellAttr.y1), 0);

            point.hasImage = (
                point.marker && point.marker.symbol || symbol || ''
            ).indexOf('url') === 0;

            // If marker shape is regular (square), find the shorter cell's
            // side.
            if (hasRegularShape) {
                const sizeDiff = Math.abs(width - height);
                x = Math.min(cellAttr.x1, cellAttr.x2) +
                    (width < height ? 0 : sizeDiff / 2);
                y = Math.min(cellAttr.y1, cellAttr.y2) +
                    (width < height ? sizeDiff / 2 : 0);
                width = height = Math.min(width, height);
            }


            if (point.hasImage) {
                point.marker = { width, height };
            }

            point.plotX = point.clientX = (cellAttr.x1 + cellAttr.x2) / 2;
            point.plotY = (cellAttr.y1 + cellAttr.y2) / 2;

            point.shapeType = 'path';
            point.shapeArgs = merge<SVGAttributes>(
                true,
                { x, y, width, height },
                {
                    d: symbols[shape](
                        x,
                        y,
                        width,
                        height,
                        { r: isNumber(borderRadius) ? borderRadius : 0 }
                    )
                }
            );

        });

        fireEvent(series, 'afterTranslate');
    }

    /* eslint-enable valid-jsdoc */

}

addEvent(HeatmapSeries, 'afterDataClassLegendClick', function (): void {
    this.isDirtyCanvas = true;
    this.drawPoints();
});

/* *
 *
 *  Class Prototype
 *
 * */

interface HeatmapSeries extends ColorMapComposition.SeriesComposition {
    pointArrayMap: Array<string>;
    pointClass: typeof HeatmapPoint;
    trackerGroups: ColorMapComposition.SeriesComposition['trackerGroups'];
    getSymbol: typeof Series.prototype.getSymbol;
    image?: SVGElement;
}
extend(HeatmapSeries.prototype, {

    axisTypes: ColorMapComposition.seriesMembers.axisTypes,

    colorKey: ColorMapComposition.seriesMembers.colorKey,

    directTouch: true,

    getExtremesFromAll: true,

    parallelArrays: ColorMapComposition.seriesMembers.parallelArrays,

    pointArrayMap: ['y', 'value'],

    pointClass: HeatmapPoint,

    specialGroup: 'group',

    trackerGroups: ColorMapComposition.seriesMembers.trackerGroups,

    /**
     * @private
     */
    alignDataLabel: ColumnSeries.prototype.alignDataLabel,

    colorAttribs: ColorMapComposition.seriesMembers.colorAttribs,

    getSymbol: Series.prototype.getSymbol

});
ColorMapComposition.compose(HeatmapSeries);

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        heatmap: typeof HeatmapSeries;
    }
}
SeriesRegistry.registerSeriesType('heatmap', HeatmapSeries);

/* *
 *
 *  Default Export
 *
 * */

export default HeatmapSeries;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Heatmap series only. Padding between the points in the heatmap.
 * @name Highcharts.Point#pointPadding
 * @type {number|undefined}
 */

/**
 * Heatmap series only. The value of the point, resulting in a color
 * controled by options as set in the colorAxis configuration.
 * @name Highcharts.Point#value
 * @type {number|null|undefined}
 */

/* *
 * @interface Highcharts.PointOptionsObject in parts/Point.ts
 *//**
 * Heatmap series only. Point padding for a single point.
 * @name Highcharts.PointOptionsObject#pointPadding
 * @type {number|undefined}
 *//**
 * Heatmap series only. The value of the point, resulting in a color controled
 * by options as set in the colorAxis configuration.
 * @name Highcharts.PointOptionsObject#value
 * @type {number|null|undefined}
 */

''; // detach doclets above

/* *
 *
 *  API Options
 *
 * */

/**
 * A `heatmap` series. If the [type](#series.heatmap.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @productdesc {highcharts}
 * Requires `modules/heatmap`.
 *
 * @extends   series,plotOptions.heatmap
 * @excluding cropThreshold, dataParser, dataURL, dragDrop ,pointRange, stack,
 * @product   highcharts highmaps
 * @apioption series.heatmap
 */

/**
 * An array of data points for the series. For the `heatmap` series
 * type, points can be given in the following ways:
 *
 * 1.  An array of arrays with 3 or 2 values. In this case, the values
 * correspond to `x,y,value`. If the first value is a string, it is
 * applied as the name of the point, and the `x` value is inferred.
 * The `x` value can also be omitted, in which case the inner arrays
 * should be of length 2\. Then the `x` value is automatically calculated,
 * either starting at 0 and incremented by 1, or from `pointStart`
 * and `pointInterval` given in the series options.
 *
 *  ```js
 *     data: [
 *         [0, 9, 7],
 *         [1, 10, 4],
 *         [2, 6, 3]
 *     ]
 *  ```
 *
 * 2.  An array of objects with named values. The following snippet shows only a
 * few settings, see the complete options set below. If the total number of data
 * points exceeds the series' [turboThreshold](#series.heatmap.turboThreshold),
 * this option is not available.
 *
 *  ```js
 *     data: [{
 *         x: 1,
 *         y: 3,
 *         value: 10,
 *         name: "Point2",
 *         color: "#00FF00"
 *     }, {
 *         x: 1,
 *         y: 7,
 *         value: 10,
 *         name: "Point1",
 *         color: "#FF00FF"
 *     }]
 *  ```
 *
 * @sample {highcharts} highcharts/chart/reflow-true/
 *         Numerical values
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<Array<number>|*>}
 * @extends   series.line.data
 * @product   highcharts highmaps
 * @apioption series.heatmap.data
 */

/**
 * The color of the point. In heat maps the point color is rarely set
 * explicitly, as we use the color to denote the `value`. Options for
 * this are set in the [colorAxis](#colorAxis) configuration.
 *
 * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.color
 */

/**
 * The value of the point, resulting in a color controled by options
 * as set in the [colorAxis](#colorAxis) configuration.
 *
 * @type      {number}
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.value
 */

/**
 * The x value of the point. For datetime axes,
 * the X value is the timestamp in milliseconds since 1970.
 *
 * @type      {number}
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.x
 */

/**
 * The y value of the point.
 *
 * @type      {number}
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.y
 */

/**
 * Point padding for a single point.
 *
 * @sample maps/plotoptions/tilemap-pointpadding
 *         Point padding on tiles
 *
 * @type      {number}
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.pointPadding
 */

/**
 * @excluding radius, enabledThreshold
 * @product   highcharts highmaps
 * @since     8.1
 * @apioption series.heatmap.data.marker
 */

/**
 * @excluding radius, enabledThreshold
 * @product   highcharts highmaps
 * @since     8.1
 * @apioption series.heatmap.marker
 */

/**
 * @excluding radius, radiusPlus
 * @product   highcharts highmaps
 * @apioption series.heatmap.marker.states.hover
 */

/**
 * @excluding radius
 * @product   highcharts highmaps
 * @apioption series.heatmap.marker.states.select
 */

/**
 * @excluding radius, radiusPlus
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.marker.states.hover
 */

/**
 * @excluding radius
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.marker.states.select
 */

/**
* Set the marker's fixed width on hover state.
*
* @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-linewidthplus
*         5 pixels wider lineWidth on hover
*
* @type      {number|undefined}
* @default   0
* @product   highcharts highmaps
* @apioption series.heatmap.marker.states.hover.lineWidthPlus
*/

/**
* Set the marker's fixed width on hover state.
*
* @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
*         70px fixed marker's width and height on hover
*
* @type      {number|undefined}
* @default   undefined
* @product   highcharts highmaps
* @apioption series.heatmap.marker.states.hover.width
*/

/**
 * Set the marker's fixed height on hover state.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
 *         70px fixed marker's width and height on hover
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.marker.states.hover.height
 */

/**
* The number of pixels to increase the width of the
* hovered point.
*
* @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
*         One day
*
* @type      {number|undefined}
* @default   undefined
* @product   highcharts highmaps
* @apioption series.heatmap.marker.states.hover.widthPlus
*/

/**
 * The number of pixels to increase the height of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.marker.states.hover.heightPlus
 */

/**
 * The number of pixels to increase the width of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.marker.states.select.widthPlus
 */

/**
 * The number of pixels to increase the height of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.marker.states.select.heightPlus
 */

/**
* Set the marker's fixed width on hover state.
*
* @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-linewidthplus
*         5 pixels wider lineWidth on hover
*
* @type      {number|undefined}
* @default   0
* @product   highcharts highmaps
* @apioption series.heatmap.data.marker.states.hover.lineWidthPlus
*/

/**
 * Set the marker's fixed width on hover state.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
 *         70px fixed marker's width and height on hover
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.marker.states.hover.width
 */

/**
 * Set the marker's fixed height on hover state.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
 *         70px fixed marker's width and height on hover
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.marker.states.hover.height
 */

/**
 * The number of pixels to increase the width of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highstock
 * @apioption series.heatmap.data.marker.states.hover.widthPlus
 */

/**
 * The number of pixels to increase the height of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highstock
 * @apioption series.heatmap.data.marker.states.hover.heightPlus
 */

/**
* Set the marker's fixed width on select state.
*
* @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
*         70px fixed marker's width and height on hover
*
* @type      {number|undefined}
* @default   undefined
* @product   highcharts highmaps
* @apioption series.heatmap.data.marker.states.select.width
*/

/**
 * Set the marker's fixed height on select state.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-width
 *         70px fixed marker's width and height on hover
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highmaps
 * @apioption series.heatmap.data.marker.states.select.height
 */

/**
 * The number of pixels to increase the width of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highstock
 * @apioption series.heatmap.data.marker.states.select.widthPlus
 */

/**
 * The number of pixels to increase the height of the
 * hovered point.
 *
 * @sample {highcharts} maps/plotoptions/heatmap-marker-states-hover-widthplus
 *         One day
 *
 * @type      {number|undefined}
 * @default   undefined
 * @product   highcharts highstock
 * @apioption series.heatmap.data.marker.states.select.heightPlus
 */

''; // adds doclets above to transpiled file
