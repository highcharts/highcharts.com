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
 *
 *  Imports
 *
 * */

import type DumbbellSeriesOptions from './DumbbellSeriesOptions';
import type ColorString from '../../Core/Color/ColorString';
import type ColorType from '../../Core/Color/ColorType';
import type ColumnMetricsObject from '../Column/ColumnMetricsObject';
import type LollipopPoint from '../Lollipop/LollipopPoint';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';

import DumbbellPoint from './DumbbellPoint.js';
import DumbbellSeriesDefaults from './DumbbellSeriesDefaults.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    arearange: AreaRangeSeries,
    column: ColumnSeries,
    columnrange: ColumnRangeSeries
} = SeriesRegistry.seriesTypes;
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

/* *
 *
 *  Class
 *
 * */

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
     *  Static Properties
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
        DumbbellSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<DumbbellPoint> = void 0 as any;
    public options: DumbbellSeriesOptions = void 0 as any;
    public points: Array<DumbbellPoint> = void 0 as any;
    public columnMetrics: ColumnMetricsObject = void 0 as any;
    public lowColor?: ColorType;


    /* *
     *
     *  Functions
     *
     * */

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
        const series = this,
            chart = series.chart,
            pointOptions = point.options,
            seriesOptions = series.options,
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            connectorWidthPlus = pick(
                seriesOptions.states &&
                seriesOptions.states.hover &&
                seriesOptions.states.hover.connectorWidthPlus,
                1
            ),
            dashStyle = pick(pointOptions.dashStyle, seriesOptions.dashStyle),
            pxThreshold = yAxis.toPixels(seriesOptions.threshold || 0, true),
            pointHeight = chart.inverted ?
                yAxis.len - pxThreshold : pxThreshold;

        let connectorWidth = pick<number|undefined, number>(
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
            pointTop = pick(point.plotLow, point.plotY),
            pointBottom = pick(point.plotHigh, pointHeight),
            origProps;

        if (typeof pointTop !== 'number') {
            return {};
        }

        if (point.state && point.state !== 'normal') {
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

        const attribs: SVGAttributes = {
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
     * @param {Highcharts.Point} point
     *        The point to inspect.
     */
    public drawConnector(point: (DumbbellPoint|LollipopPoint)): void {
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
     * @private
     */
    public getColumnMetrics(): ColumnMetricsObject {
        const metrics = ColumnSeries.prototype
            .getColumnMetrics.apply(this, arguments as any);

        metrics.offset += metrics.width / 2;

        return metrics;
    }

    /**
     * Translate each point to the plot area coordinate system and find
     * shape positions
     * @private
     */
    public translate(): void {
        const series = this,
            inverted = series.chart.inverted;

        // Calculate shapeargs
        this.setShapeArgs.apply(series);

        // Calculate point low / high values
        this.translatePoint.apply(series, arguments as any);

        // Correct x position
        for (const point of series.points) {
            const { pointWidth, shapeArgs = {}, tooltipPos } = point;

            point.plotX = shapeArgs.x || 0;
            shapeArgs.x = point.plotX - pointWidth / 2;

            if (tooltipPos) {
                if (inverted) {
                    tooltipPos[1] = series.xAxis.len - point.plotX;
                } else {
                    tooltipPos[0] = point.plotX;
                }
            }
        }

        series.columnMetrics.offset -= series.columnMetrics.width / 2;
    }

    /**
     * Extend the arearange series' drawPoints method by applying a connector
     * and coloring markers.
     * @private
     */
    public drawPoints(): void {
        const series = this,
            chart = series.chart,
            pointLength = series.points.length,
            seriesLowColor = series.lowColor = series.options.lowColor,
            seriesLowMarker = series.options.lowMarker;

        let i = 0,
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
            (point.connector?.element as any).point = point;

            if (lowerGraphic) {
                zoneColor = point.zone && point.zone.color;
                lowerGraphicColor = pick(
                    point.options.lowColor,
                    seriesLowMarker?.fillColor,
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
     * @return {Highcharts.SVGAttributes}
     *         A hash containing those attributes that are not settable from
     *         CSS.
     */
    public markerAttribs(): SVGAttributes {
        const ret = super.markerAttribs.apply(this, arguments as any);

        ret.x = Math.floor(ret.x || 0);
        ret.y = Math.floor(ret.y || 0);

        return ret;
    }

    /**
     * Get presentational attributes.
     *
     * @private
     * @function Highcharts.seriesTypes.column#pointAttribs
     *
     * @param {Highcharts.Point} point
     *        The point to inspect.
     *
     * @param {string} state
     *        Current state of point (normal, hover, select).
     *
     * @return {Highcharts.SVGAttributes}
     *         Presentational attributes.
     */
    public pointAttribs(point: DumbbellPoint): SVGAttributes {
        const state = point.state,
            pointAttribs = super.pointAttribs.call(this, point);

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
        ColumnSeries.prototype.translate.apply(this);
        ColumnRangeSeries.prototype.afterColumnTranslate.apply(this);
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface DumbbellSeries {
    pointClass: typeof DumbbellPoint;
    crispCol: typeof ColumnSeries.prototype.crispCol;
    trackerGroups: Array<string>;
    translatePoint: typeof AreaRangeSeries.prototype['translate'];
    seriesDrawPoints: typeof AreaRangeSeries.prototype['drawPoints'];
}

extend(DumbbellSeries.prototype, {
    crispCol: ColumnSeries.prototype.crispCol,
    drawGraph: noop,
    drawTracker: ColumnSeries.prototype.drawTracker,
    pointClass: DumbbellPoint,
    seriesDrawPoints: AreaRangeSeries.prototype.drawPoints,
    trackerGroups: ['group', 'markerGroup', 'dataLabelsGroup'],
    translatePoint: AreaRangeSeries.prototype.translate
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
 *  Default Export
 *
 * */

export default DumbbellSeries;
