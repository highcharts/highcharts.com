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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type Chart from '../../Core/Chart/Chart';
import type ColumnMetricsObject from './ColumnMetricsObject';
import type ColumnPoint from './ColumnPoint';
import type ColumnSeriesOptions from './ColumnSeriesOptions';
import type DashStyleValue from '../../Core/Renderer/DashStyleValue';
import type PointerEvent from '../../Core/PointerEvent';
import type { SeriesStateHoverOptions } from '../../Core/Series/SeriesOptions';
import type StackItem from '../../Core/Axis/Stacking/StackItem';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import A from '../../Core/Animation/AnimationUtilities.js';
const { animObject } = A;
import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import ColumnSeriesDefaults from './ColumnSeriesDefaults.js';
import H from '../../Core/Globals.js';
const {
    hasTouch,
    noop
} = H;
import Series from '../../Core/Series/Series.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge, extend, defined, objectEach } = OH;
import EH from '../../Shared/Helpers/EventHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber } = TC;
const { fireEvent } = EH;
const {
    clamp,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        barW?: number;
        pointXOffset?: number;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The column series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.column
 *
 * @augments Highcharts.Series
 */
class ColumnSeries extends Series {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions = merge(
        Series.defaultOptions,
        ColumnSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public borderWidth: number = void 0 as any;

    public columnIndex?: number;

    public columnMetrics?: ColumnMetricsObject;

    public cropShould?: number;

    public dashStyle?: DashStyleValue;

    public data: Array<ColumnPoint> = void 0 as any;

    public dense?: boolean;

    public group: SVGElement = void 0 as any;

    public options: ColumnSeriesOptions = void 0 as any;

    public points: Array<ColumnPoint> = void 0 as any;

    public pointXOffset?: number;

    public translatedThreshold?: number;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Animate the column heights one by one from zero.
     *
     * @private
     * @function Highcharts.seriesTypes.column#animate
     *
     * @param {boolean} init
     *        Whether to initialize the animation or run it
     */
    public animate(init: boolean): void {
        const series = this,
            yAxis = this.yAxis,
            yAxisPos = yAxis.pos,
            options = series.options,
            inverted = this.chart.inverted,
            attr: SVGAttributes = {},
            translateProp: 'translateX'|'translateY' = inverted ?
                'translateX' :
                'translateY';
        let translateStart: number,
            translatedThreshold;

        if (init) {
            attr.scaleY = 0.001;
            translatedThreshold = clamp(
                yAxis.toPixels(options.threshold as any),
                yAxisPos,
                yAxisPos + yAxis.len
            );
            if (inverted) {
                attr.translateX = translatedThreshold - yAxis.len;
            } else {
                attr.translateY = translatedThreshold;
            }

            // apply finnal clipping (used in Highcharts Stock) (#7083)
            // animation is done by scaleY, so cliping is for panes
            if (series.clipBox) {
                series.setClip();
            }

            series.group.attr(attr);

        } else { // run the animation
            translateStart = Number(series.group.attr(translateProp));
            series.group.animate(
                { scaleY: 1 },
                extend(animObject(series.options.animation), {
                    // Do the scale synchronously to ensure smooth
                    // updating (#5030, #7228)
                    step: function (val: any, fx: any): void {
                        if (series.group) {
                            attr[translateProp] = translateStart +
                                fx.pos * (yAxisPos - translateStart);
                            series.group.attr(attr);
                        }
                    }
                })
            );
        }
    }

    /**
     * Initialize the series. Extends the basic Series.init method by
     * marking other series of the same type as dirty.
     *
     * @private
     * @function Highcharts.seriesTypes.column#init
     */
    public init(chart: Chart, options: ColumnSeriesOptions): void {
        super.init.apply(this, arguments as any);

        const series = this;

        chart = series.chart;

        // if the series is added dynamically, force redraw of other
        // series affected by a new column
        if (chart.hasRendered) {
            chart.series.forEach(function (otherSeries): void {
                if (otherSeries.type === series.type) {
                    otherSeries.isDirty = true;
                }
            });
        }
    }

    /**
     * Return the width and x offset of the columns adjusted for grouping,
     * groupPadding, pointPadding, pointWidth etc.
     *
     * @private
     * @function Highcharts.seriesTypes.column#getColumnMetrics
     */
    public getColumnMetrics(): ColumnMetricsObject {
        const series = this,
            options = series.options,
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            reversedStacks = xAxis.options.reversedStacks,
            // Keep backward compatibility: reversed xAxis had reversed
            // stacks
            reverseStacks = (xAxis.reversed && !reversedStacks) ||
            (!xAxis.reversed && reversedStacks),
            stackGroups: Record<string, number> = {};
        let stackKey,
            columnCount = 0;

        // Get the total number of column type series. This is called on
        // every series. Consider moving this logic to a chart.orderStacks()
        // function and call it on init, addSeries and removeSeries
        if (options.grouping === false) {
            columnCount = 1;
        } else {
            series.chart.series.forEach(function (otherSeries): void {
                const otherYAxis = otherSeries.yAxis,
                    otherOptions = otherSeries.options;
                let columnIndex;

                if (otherSeries.type === series.type &&
                    (
                        otherSeries.visible ||
                        !series.chart.options.chart.ignoreHiddenSeries
                    ) &&
                    yAxis.len === otherYAxis.len &&
                    yAxis.pos === otherYAxis.pos
                ) { // #642, #2086
                    if (
                        otherOptions.stacking &&
                        otherOptions.stacking !== 'group'
                    ) {
                        stackKey = otherSeries.stackKey;
                        if (
                            typeof stackGroups[stackKey as any] ===
                            'undefined'
                        ) {
                            stackGroups[stackKey as any] = columnCount++;
                        }
                        columnIndex = stackGroups[stackKey as any];
                    } else if (otherOptions.grouping !== false) { // #1162
                        columnIndex = columnCount++;
                    }
                    (otherSeries as any).columnIndex = columnIndex;
                }
            });
        }

        const categoryWidth = Math.min(
                Math.abs(xAxis.transA) * (
                    (xAxis.ordinal && xAxis.ordinal.slope) ||
                options.pointRange ||
                xAxis.closestPointRange ||
                xAxis.tickInterval ||
                1
                ), // #2610
                xAxis.len // #1535
            ),
            groupPadding = categoryWidth * (options.groupPadding as any),
            groupWidth = categoryWidth - 2 * groupPadding,
            pointOffsetWidth = groupWidth / (columnCount || 1),
            pointWidth = Math.min(
                options.maxPointWidth || xAxis.len,
                pick(
                    options.pointWidth,
                    pointOffsetWidth * (
                        1 - 2 * (options.pointPadding as any)
                    )
                )
            ),
            pointPadding = (pointOffsetWidth - pointWidth) / 2,
            // #1251, #3737
            colIndex = (series.columnIndex || 0) + (reverseStacks ? 1 : 0),
            pointXOffset =
            pointPadding +
            (
                groupPadding +
                colIndex * pointOffsetWidth -
                (categoryWidth / 2)
            ) * (reverseStacks ? -1 : 1);

        // Save it for reading in linked series (Error bars particularly)
        series.columnMetrics = {
            width: pointWidth,
            offset: pointXOffset,
            paddedWidth: pointOffsetWidth,
            columnCount
        };
        return series.columnMetrics;
    }

    /**
     * Make the columns crisp. The edges are rounded to the nearest full
     * pixel.
     *
     * @private
     * @function Highcharts.seriesTypes.column#crispCol
     */
    public crispCol(
        x: number,
        y: number,
        w: number,
        h: number
    ): BBoxObject {
        const chart = this.chart,
            borderWidth = this.borderWidth,
            xCrisp = -((borderWidth as any) % 2 ? 0.5 : 0);
        let right,
            yCrisp = (borderWidth as any) % 2 ? 0.5 : 1;

        // Horizontal. We need to first compute the exact right edge, then
        // round it and compute the width from there.
        if (this.options.crisp) {
            right = Math.round(x + w) + xCrisp;
            x = Math.round(x) + xCrisp;
            w = right - x;
        }

        // Vertical
        const bottom = Math.round(y + h) + yCrisp,
            fromTop = Math.abs(y) <= 0.5 && bottom > 0.5; // #4504, #4656
        y = Math.round(y) + yCrisp;
        h = bottom - y;

        // Top edges are exceptions
        if (fromTop && h) { // #5146
            y -= 1;
            h += 1;
        }

        return {
            x: x,
            y: y,
            width: w,
            height: h
        };
    }

    /**
     * Adjust for missing columns, according to the `centerInCategory`
     * option. Missing columns are either single points or stacks where the
     * point or points are either missing or null.
     *
     * @private
     * @function Highcharts.seriesTypes.column#adjustForMissingColumns
     * @param {number} x
     * The x coordinate of the column, left side
     *
     * @param {number} pointWidth
     * The pointWidth, already computed upstream
     *
     * @param {Highcharts.ColumnPoint} point
     * The point instance
     *
     * @param {Highcharts.ColumnMetricsObject} metrics
     * The series-wide column metrics
     *
     * @return {number}
     * The adjusted x position, or the original if not adjusted
     */
    public adjustForMissingColumns(
        x: number,
        pointWidth: number,
        point: ColumnPoint,
        metrics: ColumnMetricsObject
    ): number {
        const stacking = this.options.stacking;
        if (!point.isNull && metrics.columnCount > 1) {
            const reversedStacks = this.yAxis.options.reversedStacks;
            let indexInCategory = 0,
                totalInCategory = reversedStacks ? 0 : -metrics.columnCount;

            // Loop over all the stacks on the Y axis. When stacking is enabled,
            // these are real point stacks. When stacking is not enabled, but
            // `centerInCategory` is true, there is one stack handling the
            // grouping of points in each category. This is done in the
            // `setGroupedPoints` function.
            objectEach(
                this.yAxis.stacking && this.yAxis.stacking.stacks,
                (stack: Record<string, StackItem>): void => {
                    if (typeof point.x === 'number') {
                        const stackItem = stack[point.x.toString()];

                        if (stackItem) {
                            const pointValues = stackItem.points[this.index];

                            // If true `stacking` is enabled, count the total
                            // number of non-null stacks in the category, and
                            // note which index this point is within those
                            // stacks.
                            if (stacking) {
                                if (pointValues) {
                                    indexInCategory = totalInCategory;
                                }
                                if (stackItem.hasValidPoints) {
                                    reversedStacks ? // #16169
                                        totalInCategory++ : totalInCategory--;
                                }

                            // If `stacking` is not enabled, look for the index
                            } else if (isArray(pointValues)) {
                                // If there are multiple points with the same X
                                // then gather all series in category, and
                                // assign index
                                let seriesIndexes = Object
                                    .keys(stackItem.points)
                                    .filter((pointKey): boolean =>
                                        // Filter out duplicate X's
                                        !pointKey.match(',') &&
                                        // Filter out null points
                                        stackItem.points[pointKey] &&
                                        stackItem.points[pointKey].length > 1
                                    )
                                    .map(parseFloat)
                                    .sort((a, b): number => b - a);

                                indexInCategory = seriesIndexes.indexOf(
                                    this.index
                                );
                                totalInCategory = seriesIndexes.length;
                            }
                        }
                    }
                }
            );

            // Compute the adjusted x position
            const boxWidth = (totalInCategory - 1) * metrics.paddedWidth +
                pointWidth;
            x = (point.plotX || 0) + boxWidth / 2 - pointWidth -
                indexInCategory * metrics.paddedWidth;

        }
        return x;
    }

    /**
     * Translate each point to the plot area coordinate system and find
     * shape positions
     *
     * @private
     * @function Highcharts.seriesTypes.column#translate
     */
    public translate(): void {
        const series = this,
            chart = series.chart,
            options = series.options,
            dense = series.dense =
                (series.closestPointRange as any) * series.xAxis.transA < 2,
            borderWidth = series.borderWidth = pick(
                options.borderWidth,
                dense ? 0 : 1 // #3635
            ),
            xAxis = series.xAxis,
            yAxis = series.yAxis,
            threshold = options.threshold,
            minPointLength = pick(options.minPointLength, 5),
            metrics = series.getColumnMetrics(),
            seriesPointWidth = metrics.width,
            seriesXOffset = series.pointXOffset = metrics.offset,
            dataMin = series.dataMin,
            dataMax = series.dataMax;
        // postprocessed for border width
        let seriesBarW = series.barW =
                Math.max(seriesPointWidth, 1 + 2 * borderWidth),
            translatedThreshold = series.translatedThreshold =
                yAxis.getThreshold(threshold as any);

        if (chart.inverted) {
            translatedThreshold -= 0.5; // #3355
        }

        // When the pointPadding is 0, we want the columns to be packed
        // tightly, so we allow individual columns to have individual sizes.
        // When pointPadding is greater, we strive for equal-width columns
        // (#2694).
        if (options.pointPadding) {
            seriesBarW = Math.ceil(seriesBarW);
        }

        Series.prototype.translate.apply(series);

        // Record the new values
        series.points.forEach(function (point): void {
            const yBottom = pick(point.yBottom, translatedThreshold as any),
                safeDistance = 999 + Math.abs(yBottom),
                plotX = point.plotX || 0,
                // Don't draw too far outside plot area (#1303, #2241,
                // #4264)
                plotY = clamp(
                    point.plotY as any,
                    -safeDistance,
                    yAxis.len + safeDistance
                ),
                stackBox = point.stackBox;
            let up,
                barY = Math.min(plotY, yBottom),
                barH = Math.max(plotY, yBottom) - barY,
                pointWidth = seriesPointWidth,
                barX = plotX + seriesXOffset,
                barW = seriesBarW;

            // Handle options.minPointLength
            if (minPointLength && Math.abs(barH) < minPointLength) {
                barH = minPointLength;
                up = (!yAxis.reversed && !point.negative) ||
                (yAxis.reversed && point.negative);

                // Reverse zeros if there's no positive value in the series
                // in visible range (#7046)
                if (
                    isNumber(threshold) &&
                    isNumber(dataMax) &&
                    point.y === threshold &&
                    dataMax <= threshold &&
                    // and if there's room for it (#7311)
                    (yAxis.min || 0) < threshold &&
                    // if all points are the same value (i.e zero) not draw
                    // as negative points (#10646), but only if there's room
                    // for it (#14876)
                    (dataMin !== dataMax || (yAxis.max || 0) <= threshold)
                ) {
                    up = !up;
                    point.negative = !point.negative;
                }

                // If stacked...
                barY = (
                    Math.abs(
                        barY - (translatedThreshold as any)
                    ) > minPointLength ?
                        // ...keep position
                        yBottom - minPointLength :
                        // #1485, #4051
                        (translatedThreshold as any) -
                        (up ? minPointLength : 0)
                );
            }

            // Handle point.options.pointWidth
            // @todo Handle grouping/stacking too. Calculate offset properly
            if (defined(point.options.pointWidth)) {
                pointWidth = barW =
                    Math.ceil(point.options.pointWidth as any);
                barX -= Math.round((pointWidth - seriesPointWidth) / 2);
            }

            // Adjust for null or missing points
            if (options.centerInCategory) {
                barX = series.adjustForMissingColumns(
                    barX,
                    pointWidth,
                    point,
                    metrics
                );
            }

            // Cache for access in polar
            point.barX = barX;
            point.pointWidth = pointWidth;

            // Fix the tooltip on center of grouped columns (#1216, #424,
            // #3648)
            point.tooltipPos = chart.inverted ?
                [
                    clamp(
                        yAxis.len + yAxis.pos - chart.plotLeft - plotY,
                        yAxis.pos - chart.plotLeft,
                        yAxis.len + yAxis.pos - chart.plotLeft
                    ),
                    xAxis.len + xAxis.pos - chart.plotTop - barX - barW / 2,
                    barH
                ] :
                [
                    xAxis.left - chart.plotLeft + barX + barW / 2,
                    clamp(
                        plotY + (yAxis.pos as any) -
                        chart.plotTop,
                        yAxis.pos - chart.plotTop,
                        yAxis.len + yAxis.pos - chart.plotTop
                    ),
                    barH
                ];

            // Register shape type and arguments to be used in drawPoints. Allow
            // `shapeType` defined on `pointClass` level.
            point.shapeType = series.pointClass.prototype.shapeType ||
                'roundedRect';
            point.shapeArgs = series.crispCol(
                barX,
                // #3169, drilldown from null must have a position to work from.
                // #6585, dataLabel should be placed on xAxis, not floating in
                // the middle of the chart.
                point.isNull ? translatedThreshold : barY,
                barW,
                point.isNull ? 0 : barH
            );
        });

        // Fire a specific event after column translate. We could instead apply
        // all the column logic in an `afterTranslate` event handler, but there
        // are so many other series types that use the column translation, that
        // it is more convenient to have a specific event for it.
        fireEvent(this, 'afterColumnTranslate');
    }

    /**
     * Columns have no graph
     *
     * @private
     * @function Highcharts.seriesTypes.column#drawGraph
     */
    public drawGraph(): void {
        this.group[
            this.dense ? 'addClass' : 'removeClass'
        ]('highcharts-dense-data');
    }

    /**
     * Get presentational attributes
     *
     * @private
     * @function Highcharts.seriesTypes.column#pointAttribs
     */
    public pointAttribs(
        point?: ColumnPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const options = this.options,
            p2o = (this as any).pointAttrToOptions || {},
            strokeOption = p2o.stroke || 'borderColor',
            strokeWidthOption = p2o['stroke-width'] || 'borderWidth';
        let stateOptions: SeriesStateHoverOptions,
            zone,
            brightness,
            fill = (point && point.color) || this.color,
            // set to fill when borderColor null:
            stroke = (
                (point && (point as any)[strokeOption]) ||
                (options as any)[strokeOption] ||
                fill
            ),
            dashstyle =
                (point && point.options.dashStyle) || options.dashStyle,
            strokeWidth = (point && (point as any)[strokeWidthOption]) ||
                (options as any)[strokeWidthOption] ||
                (this as any)[strokeWidthOption] || 0,
            opacity = pick(point && point.opacity, options.opacity, 1);

        // Handle zone colors
        if (point && this.zones.length) {
            zone = point.getZone();
            // When zones are present, don't use point.color (#4267).
            // Changed order (#6527), added support for colorAxis (#10670)
            fill = (
                point.options.color ||
                (zone && (zone.color || point.nonZonedColor)) ||
                this.color
            );

            if (zone) {
                stroke = zone.borderColor || stroke;
                dashstyle = zone.dashStyle || dashstyle;
                strokeWidth = zone.borderWidth || strokeWidth;
            }
        }

        // Select or hover states
        if (state && point) {
            stateOptions = merge(
                (options.states as any)[state],
                // #6401
                point.options.states &&
                (point.options.states as any)[state] ||
                {}
            );
            brightness = stateOptions.brightness;
            fill =
                stateOptions.color || (
                    typeof brightness !== 'undefined' &&
                    color(fill as any)
                        .brighten(stateOptions.brightness as any)
                        .get()
                ) || fill;
            stroke = (stateOptions as any)[strokeOption] || stroke;
            strokeWidth =
                (stateOptions as any)[strokeWidthOption] || strokeWidth;
            dashstyle = stateOptions.dashStyle || dashstyle;
            opacity = pick(stateOptions.opacity, opacity);
        }

        const ret: SVGAttributes = {
            fill: fill as any,
            stroke: stroke,
            'stroke-width': strokeWidth,
            opacity: opacity
        };

        if (dashstyle) {
            ret.dashstyle = dashstyle;
        }

        return ret;
    }

    /**
     * Draw the columns. For bars, the series.group is rotated, so the same
     * coordinates apply for columns and bars. This method is inherited by
     * scatter series.
     *
     * @private
     * @function Highcharts.seriesTypes.column#drawPoints
     */
    public drawPoints(points: Array<ColumnPoint> = this.points): void {
        const series = this,
            chart = this.chart,
            options = series.options,
            renderer = chart.renderer,
            animationLimit = options.animationLimit || 250;
        let shapeArgs;

        // draw the columns
        points.forEach(function (point): void {
            const plotY = point.plotY;
            let graphic = point.graphic,
                hasGraphic = !!graphic,
                verb = graphic && chart.pointCount < animationLimit ?
                    'animate' : 'attr';

            if (isNumber(plotY) && point.y !== null) {
                shapeArgs = point.shapeArgs;

                // When updating a series between 2d and 3d or cartesian and
                // polar, the shape type changes.
                if (graphic && point.hasNewShapeType()) {
                    graphic = graphic.destroy();
                }

                // Set starting position for point sliding animation.
                if (series.enabledDataSorting) {
                    point.startXPos = series.xAxis.reversed ?
                        -(shapeArgs ? (shapeArgs.width || 0) : 0) :
                        series.xAxis.width;
                }

                if (!graphic) {
                    point.graphic = graphic =
                        (renderer as any)[point.shapeType as any](shapeArgs)
                            .add(point.group || series.group);

                    if (
                        graphic &&
                        series.enabledDataSorting &&
                        chart.hasRendered &&
                        chart.pointCount < animationLimit
                    ) {
                        graphic.attr({
                            x: point.startXPos
                        });

                        hasGraphic = true;
                        verb = 'animate';
                    }
                }

                if (graphic && hasGraphic) { // update
                    graphic[verb](
                        merge(shapeArgs)
                    );
                }

                // Presentational
                if (!chart.styledMode) {
                    (graphic as any)[verb](series.pointAttribs(
                        point,
                        (point.selected && 'select') as any
                    ))
                        .shadow(
                            point.allowShadow !== false && options.shadow
                        );
                }

                if (graphic) {
                    graphic.addClass(point.getClassName(), true);

                    graphic.attr({
                        visibility: point.visible ? 'inherit' : 'hidden'
                    });
                }

            } else if (graphic) {
                point.graphic = graphic.destroy(); // #1269
            }
        });
    }

    /**
     * Draw the tracker for a point.
     * @private
     */
    public drawTracker(points: Array<ColumnPoint> = this.points): void {
        const series = this,
            chart = series.chart,
            pointer = chart.pointer,
            onMouseOver = function (e: PointerEvent): void {
                const point = pointer.getPointFromEvent(e);

                // undefined on graph in scatterchart
                if (
                    typeof point !== 'undefined' &&
                    series.options.enableMouseTracking
                ) {
                    pointer.isDirectTouch = true;
                    point.onMouseOver(e);
                }
            };
        let dataLabels;

        // Add reference to the point
        points.forEach(function (point): void {
            dataLabels = (
                isArray(point.dataLabels) ?
                    point.dataLabels :
                    (point.dataLabel ? [point.dataLabel] : [])
            );

            if (point.graphic) {
                (point.graphic.element as any).point = point;
            }
            (dataLabels as any).forEach(function (
                dataLabel: SVGElement
            ): void {
                if (dataLabel.div) {
                    dataLabel.div.point = point;
                } else {
                    (dataLabel.element as any).point = point;
                }
            });
        });

        // Add the event listeners, we need to do this only once
        if (!series._hasTracking) {
            (series.trackerGroups as any).forEach(function (key: string): void {
                if ((series as any)[key]) {
                    // we don't always have dataLabelsGroup
                    (series as any)[key]
                        .addClass('highcharts-tracker')
                        .on('mouseover', onMouseOver)
                        .on('mouseout', function (e: PointerEvent): void {
                            pointer.onTrackerMouseOut(e);
                        });
                    if (hasTouch) {
                        (series as any)[key].on('touchstart', onMouseOver);
                    }

                    if (!chart.styledMode && series.options.cursor) {
                        (series as any)[key]
                            .css({ cursor: series.options.cursor });
                    }
                }
            });
            series._hasTracking = true;
        }

        fireEvent(this, 'afterDrawTracker');
    }

    /**
     * Remove this series from the chart
     *
     * @private
     * @function Highcharts.seriesTypes.column#remove
     */
    public remove(): void {
        const series = this,
            chart = series.chart;

        // column and bar series affects other series of the same type
        // as they are either stacked or grouped
        if (chart.hasRendered) {
            chart.series.forEach(function (otherSeries): void {
                if (otherSeries.type === series.type) {
                    otherSeries.isDirty = true;
                }
            });
        }

        Series.prototype.remove.apply(series, arguments as any);
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface ColumnSeries {
    pointClass: typeof ColumnPoint;
}
extend(ColumnSeries.prototype, {
    cropShoulder: 0,

    // When tooltip is not shared, this series (and derivatives) requires
    // direct touch/hover. KD-tree does not apply.
    directTouch: true,
    getSymbol: noop,

    // use separate negative stacks, unlike area stacks where a negative
    // point is substracted from previous (#1910)
    negStacks: true,

    trackerGroups: ['group', 'dataLabelsGroup']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        column: typeof ColumnSeries;
    }
}
SeriesRegistry.registerSeriesType('column', ColumnSeries);

/* *
 *
 *  Default Export
 *
 * */

export default ColumnSeries;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Adjusted width and x offset of the columns for grouping.
 *
 * @private
 * @interface Highcharts.ColumnMetricsObject
 *//**
 * Width of the columns.
 * @name Highcharts.ColumnMetricsObject#width
 * @type {number}
 *//**
 * Offset of the columns.
 * @name Highcharts.ColumnMetricsObject#offset
 * @type {number}
 */

''; // detach doclets above
