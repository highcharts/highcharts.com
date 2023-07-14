/* *
 *
 *  (c) 2010-2021 Sebastian Bochan, Rafal Sebestjanski
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *

 *  Imports
 *
 * */

import type DumbbellSeriesOptions from './DumbbellSeriesOptions';
import type ColorString from '../../Core/Color/ColorString';
import type ColorType from '../../Core/Color/ColorType';
import type ColumnMetricsObject from '../Column/ColumnMetricsObject';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';

import ColumnSeries from '../Column/ColumnSeries.js';
const { prototype: colProto } = ColumnSeries;
import DumbbellPoint from './DumbbellPoint.js';
import LollipopPoint from '../Lollipop/LollipopPoint';
import H from '../../Core/Globals.js';
const { noop } = H;
import { Palette } from '../../Core/Color/Palettes.js';
import Series from '../../Core/Series/Series.js';
const { prototype: seriesProto } = Series;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        arearange: AreaRangeSeries,
        columnrange: {
            prototype: columnRangeProto
        }
    }
} = SeriesRegistry;
const { prototype: areaRangeProto } = AreaRangeSeries;
import SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer.js';
import U from '../../Core/Utilities.js';
const {
    extend,
    merge,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesStateHoverOptions {
        connectorWidthPlus?: number;
    }
}

/**
 * The dumbbell series type
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.dumbbell
 *
 * @augments Highcharts.Series
 */
class DumbbellSeries extends AreaRangeSeries {

    /* *
     *
     * Static properties
     *
     * */

    /**
     * The dumbbell series is a cartesian series with higher and lower values
     * for each point along an X axis, connected with a line between the
     * values.
     *
     * Requires `highcharts-more.js` and `modules/dumbbell.js`.
     *
     * @sample {highcharts} highcharts/demo/dumbbell/
     *         Dumbbell chart
     * @sample {highcharts} highcharts/series-dumbbell/styled-mode-dumbbell/
     *         Styled mode
     *
     * @extends      plotOptions.arearange
     * @product      highcharts highstock
     * @excluding    fillColor, fillOpacity, lineWidth, stack, stacking,
     *               stickyTracking, trackByArea, boostThreshold, boostBlending
     * @since 8.0.0
     * @optionparent plotOptions.dumbbell
     */
    public static defaultOptions: DumbbellSeriesOptions = merge(
        AreaRangeSeries.defaultOptions,
        {
            /** @ignore-option */
            trackByArea: false,
            /** @ignore-option */
            fillColor: 'none',
            /** @ignore-option */
            lineWidth: 0,
            pointRange: 1,
            /**
             * Pixel width of the line that connects the dumbbell point's
             * values.
             *
             * @since 8.0.0
             * @product   highcharts highstock
             */
            connectorWidth: 1,
            /** @ignore-option */
            stickyTracking: false,
            groupPadding: 0.2,
            crisp: false,
            pointPadding: 0.1,
            /**
             * Color of the start markers in a dumbbell graph.
             *
             * @type      {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
             * @since 8.0.0
             * @product   highcharts highstock
             */
            lowColor: Palette.neutralColor80,
            /**
             * Color of the line that connects the dumbbell point's values.
             * By default it is the series' color.
             *
             * @type      {string}
             * @product   highcharts highstock
             * @since 8.0.0
             * @apioption plotOptions.dumbbell.connectorColor
             */
            states: {
                hover: {
                    /** @ignore-option */
                    lineWidthPlus: 0,
                    /**
                     * The additional connector line width for a hovered point.
                     *
                     * @since 8.0.0
                     * @product   highcharts highstock
                     */
                    connectorWidthPlus: 1,
                    /** @ignore-option */
                    halo: false
                }
            }
        } as DumbbellSeriesOptions
    );

    /* *
     *
     * Properties
     *
     * */

    public data: Array<DumbbellPoint> = void 0 as any;
    public options: DumbbellSeriesOptions = void 0 as any;
    public points: Array<DumbbellPoint> = void 0 as any;
    public columnMetrics: ColumnMetricsObject = void 0 as any;
    public lowColor?: ColorType;


    /**
     *
     *  Functions
     *
     */

    /**
     * Get connector line path and styles that connects dumbbell point's low and
     * high values.
     * @private
     *
     * @param {Highcharts.Point} point The point to inspect.
     *
     * @return {Highcharts.SVGAttributes} attribs The path and styles.
     */
    public getConnectorAttribs(
        point: DumbbellPoint | LollipopPoint
    ): SVGAttributes {
        let series = this,
            chart = series.chart,
            pointOptions = point.options,
            seriesOptions = series.options,
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            connectorWidth = pick<number|undefined, number>(
                pointOptions.connectorWidth,
                seriesOptions.connectorWidth as any
            ),
            connectorColor = pick<
            ColorType|undefined,
            ColorString|undefined,
            ColorType|undefined,
            ColorType|undefined,
            ColorType
            >(
                pointOptions.connectorColor,
                seriesOptions.connectorColor,
                pointOptions.color,
                point.zone ? point.zone.color : void 0,
                point.color as any
            ),
            connectorWidthPlus = pick(
                seriesOptions.states &&
                seriesOptions.states.hover &&
                seriesOptions.states.hover.connectorWidthPlus,
                1
            ),
            dashStyle = pick(pointOptions.dashStyle, seriesOptions.dashStyle),
            pointTop = pick(point.plotLow, point.plotY),
            pxThreshold = yAxis.toPixels(seriesOptions.threshold || 0, true),
            pointHeight = chart.inverted ?
                yAxis.len - pxThreshold : pxThreshold,
            pointBottom = pick(point.plotHigh, pointHeight),
            attribs: SVGAttributes,
            origProps;

        if (typeof pointTop !== 'number') {
            return {};
        }

        if (point.state) {
            connectorWidth = connectorWidth + connectorWidthPlus;
        }

        if (pointTop < 0) {
            pointTop = 0;
        } else if (pointTop >= yAxis.len) {
            pointTop = yAxis.len;
        }

        if (pointBottom < 0) {
            pointBottom = 0;
        } else if (pointBottom >= yAxis.len) {
            pointBottom = yAxis.len;
        }

        if (point.plotX < 0 || point.plotX > xAxis.len) {
            connectorWidth = 0;
        }

        // Connector should reflect upper marker's zone color
        if (point.graphics && point.graphics[1]) {
            origProps = {
                y: point.y,
                zone: point.zone
            };
            point.y = (point as DumbbellPoint).high;
            point.zone = point.zone ? point.getZone() : void 0;
            connectorColor = pick<
            ColorType|undefined,
            ColorString|undefined,
            ColorType|undefined,
            ColorType|undefined,
            ColorType
            >(
                pointOptions.connectorColor,
                seriesOptions.connectorColor,
                pointOptions.color,
                point.zone ? point.zone.color : void 0,
                point.color as any
            );
            extend(point, origProps);
        }

        attribs = {
            d: SVGRenderer.prototype.crispLine([[
                'M',
                point.plotX,
                pointTop
            ], [
                'L',
                point.plotX,
                pointBottom
            ]], connectorWidth, 'ceil')
        };

        if (!chart.styledMode) {
            attribs.stroke = connectorColor;
            attribs['stroke-width'] = connectorWidth;
            if (dashStyle) {
                attribs.dashstyle = dashStyle;
            }
        }

        return attribs;
    }

    /**
     * Draw connector line that connects dumbbell point's low and high values.
     * @private
     *
     * @param {Highcharts.Point} point The point to inspect.
     *
     */
    public drawConnector(point: DumbbellPoint | LollipopPoint): void {
        const series = this,
            animationLimit = pick(series.options.animationLimit, 250),
            verb = point.connector && series.chart.pointCount < animationLimit ?
                'animate' : 'attr';

        if (!point.connector) {
            point.connector = series.chart.renderer.path()
                .addClass('highcharts-lollipop-stem')
                .attr({
                    zIndex: -1
                })
                .add(series.group);
        }

        point.connector[verb](this.getConnectorAttribs(point));
    }
    /**
     * Return the width and x offset of the dumbbell adjusted for grouping,
     * groupPadding, pointPadding, pointWidth etc.
     *
     * @private
     *
     * @function Highcharts.seriesTypes.column#getColumnMetrics
     *
     * @param {Highcharts.Series} this The series of points.
     *
     * @return {Highcharts.ColumnMetricsObject} metrics shapeArgs
     *
     */
    public getColumnMetrics(): ColumnMetricsObject {
        const metrics = colProto.getColumnMetrics.apply(this, arguments as any);

        metrics.offset += metrics.width / 2;

        return metrics;
    }

    /**
     * Translate each point to the plot area coordinate system and find
     * shape positions
     *
     * @private
     *
     * @function Highcharts.seriesTypes.dumbbell#translate
     *
     * @param {Highcharts.Series} this The series of points.
     *
     */
    public translate(): void {

        const inverted = this.chart.inverted;

        // Calculate shapeargs
        this.setShapeArgs.apply(this);

        // Calculate point low / high values
        this.translatePoint.apply(this, arguments as any);

        // Correct x position
        this.points.forEach((point): void => {
            const { pointWidth, shapeArgs = {}, tooltipPos } = point;

            point.plotX = shapeArgs.x || 0;
            shapeArgs.x = point.plotX - pointWidth / 2;

            if (tooltipPos) {
                if (inverted) {
                    tooltipPos[1] = this.xAxis.len - point.plotX;
                } else {
                    tooltipPos[0] = point.plotX;
                }
            }
        });

        this.columnMetrics.offset -= this.columnMetrics.width / 2;
    }

    /**
     * Extend the arearange series' drawPoints method by applying a connector
     * and coloring markers.
     * @private
     *
     * @function Highcharts.Series#drawPoints
     *
     * @param {Highcharts.Series} this The series of points.
     *
     */
    public drawPoints(): void {
        let series = this,
            chart = series.chart,
            pointLength = series.points.length,
            seriesLowColor = series.lowColor = series.options.lowColor,
            i = 0,
            lowerGraphicColor,
            point,
            zoneColor;

        this.seriesDrawPoints.apply(series, arguments as any);

        // Draw connectors and color upper markers
        while (i < pointLength) {
            point = series.points[i];
            const [lowerGraphic, upperGraphic] = point.graphics || [];

            series.drawConnector(point);

            if (upperGraphic) {
                (upperGraphic.element as any).point = point;
                upperGraphic.addClass('highcharts-lollipop-high');
            }
            (point.connector.element as any).point = point;

            if (lowerGraphic) {
                zoneColor = point.zone && point.zone.color;
                lowerGraphicColor = pick(
                    point.options.lowColor,
                    seriesLowColor,
                    point.options.color,
                    zoneColor,
                    point.color,
                    series.color
                );
                if (!chart.styledMode) {
                    lowerGraphic.attr({
                        fill: lowerGraphicColor
                    });
                }
                lowerGraphic.addClass('highcharts-lollipop-low');
            }
            i++;
        }
    }

    /**
     * Get non-presentational attributes for a point. Used internally for
     * both styled mode and classic. Set correct position in link with connector
     * line.
     *
     * @see Series#pointAttribs
     *
     * @function Highcharts.Series#markerAttribs
     *
     * @param {Highcharts.Series} this The series of points.
     *
     * @return {Highcharts.SVGAttributes}
     *         A hash containing those attributes that are not settable from
     *         CSS.
     */
    public markerAttribs(): SVGAttributes {
        const ret = areaRangeProto.markerAttribs.apply(this, arguments as any);

        ret.x = Math.floor(ret.x || 0);
        ret.y = Math.floor(ret.y || 0);

        return ret;
    }

    /**
     * Get presentational attributes
     *
     * @private
     * @function Highcharts.seriesTypes.column#pointAttribs
     *
     * @param {Highcharts.Point} point The point to inspect.
     * @param {string} state current state of point (normal, hover, select)
     *
     * @return {Highcharts.SVGAttributes} pointAttribs SVGAttributes
     */
    public pointAttribs(
        point: DumbbellPoint,
        state?: string
    ): SVGAttributes {
        let pointAttribs;

        pointAttribs = seriesProto.pointAttribs.apply(this, arguments as any);
        if (state === 'hover') {
            delete pointAttribs.fill;
        }

        return pointAttribs;
    }

    /**
     * Set the shape arguments for dummbells.
     * @private
     */
    public setShapeArgs(): void {
        colProto.translate.apply(this);
        columnRangeProto.afterColumnTranslate.apply(this);
    }

}

/* *
 *
 *  Prototype properties
 *
 * */

interface DumbbellSeries {
    pointClass: typeof DumbbellPoint;
    crispCol: typeof colProto.crispCol;
    trackerGroups: Array<string>;
    translatePoint: typeof AreaRangeSeries.prototype['translate'];
    seriesDrawPoints: typeof AreaRangeSeries.prototype['drawPoints'];
}
extend(DumbbellSeries.prototype, {
    crispCol: colProto.crispCol,
    drawGraph: noop,
    drawTracker: ColumnSeries.prototype.drawTracker,
    pointClass: DumbbellPoint,
    seriesDrawPoints: areaRangeProto.drawPoints,
    trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
    translatePoint: areaRangeProto.translate
});

/* *
 *
 *  Registry
 *
 * */
declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        dumbbell: typeof DumbbellSeries;
    }
}

SeriesRegistry.registerSeriesType('dumbbell', DumbbellSeries);

/* *
 *
 *  Default export
 *
 * */

export default DumbbellSeries;

/* *
 *
 *  API options
 *
 * */

/**
 * The `dumbbell` series. If the [type](#series.dumbbell.type) option is
 * not specified, it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.dumbbell
 * @excluding boostThreshold, boostBlending
 * @product   highcharts highstock
 * @requires  highcharts-more
 * @requires  modules/dumbbell
 * @apioption series.dumbbell
 */
/**
 * An array of data points for the series. For the `dumbbell` series
 * type, points can be given in the following ways:
 *
 * 1. An array of arrays with 3 or 2 values. In this case, the values correspond
 *    to `x,low,high`. If the first value is a string, it is applied as the name
 *    of the point, and the `x` value is inferred. The `x` value can also be
 *    omitted, in which case the inner arrays should be of length 2\. Then the
 *    `x` value is automatically calculated, either starting at 0 and
 *    incremented by 1, or from `pointStart` and `pointInterval` given in the
 *    series options.
 *    ```js
 *    data: [
 *        [0, 4, 2],
 *        [1, 2, 1],
 *        [2, 9, 10]
 *    ]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.dumbbell.turboThreshold), this option is not
 *    available.
 *    ```js
 *    data: [{
 *        x: 1,
 *        low: 0,
 *        high: 4,
 *        name: "Point2",
 *        color: "#00FF00",
 *        lowColor: "#00FFFF",
 *        connectorWidth: 3,
 *        connectorColor: "#FF00FF"
 *    }, {
 *        x: 1,
 *        low: 5,
 *        high: 3,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
 *
 * @sample {highcharts} highcharts/series/data-array-of-arrays/
 *         Arrays of numeric x and y
 * @sample {highcharts} highcharts/series/data-array-of-arrays-datetime/
 *         Arrays of datetime x and y
 * @sample {highcharts} highcharts/series/data-array-of-name-value/
 *         Arrays of point.name and y
 * @sample {highcharts} highcharts/series/data-array-of-objects/
 *         Config objects
 *
 * @type      {Array<Array<(number|string),number>|Array<(number|string),number,number>|*>}
 * @extends   series.arearange.data
 * @product   highcharts highstock
 * @apioption series.dumbbell.data
 */
/**
 * Color of the line that connects the dumbbell point's values.
 * By default it is the series' color.
 *
 * @type        {string}
 * @since       8.0.0
 * @product     highcharts highstock
 * @apioption   series.dumbbell.data.connectorColor
 */
/**
 * Pixel width of the line that connects the dumbbell point's values.
 *
 * @type        {number}
 * @since       8.0.0
 * @default     1
 * @product     highcharts highstock
 * @apioption   series.dumbbell.data.connectorWidth
 */
/**
 * Color of the start markers in a dumbbell graph.
 *
 * @type        {Highcharts.ColorString|Highcharts.GradientColorObject|Highcharts.PatternObject}
 * @since       8.0.0
 * @default     ${palette.neutralColor80}
 * @product     highcharts highstock
 * @apioption   series.dumbbell.data.lowColor
 */
''; // adds doclets above to transpiled file
