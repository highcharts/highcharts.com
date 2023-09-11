/* *
 *
 *  (c) 2019-2021 Torstein Honsi
 *
 *  Item series type for Highcharts
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

import type CoreGeometryObject from '../../Core/Geometry/GeometryObject';
import type { ItemPointMarkerOptions } from './ItemPointOptions';
import type ItemSeriesOptions from './ItemSeriesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type { SymbolKey } from '../../Core/Renderer/SVG/SymbolType';

import H from '../../Core/Globals.js';
import ItemPoint from './ItemPoint.js';
import D from '../../Core/Defaults.js';
const { defaultOptions } = D;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        pie: PieSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined, extend, merge } = OH;
const { fireEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

// Inherits pie as the most tested non-cartesian series with individual point
// legend, tooltips etc. Only downside is we need to re-enable marker options.
/**
 * The item series type.
 *
 * @requires module:modules/item-series
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.item
 *
 * @augments Highcharts.seriesTypes.pie
 */
class ItemSeries extends PieSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * An item chart is an infographic chart where a number of items are laid
     * out in either a rectangular or circular pattern. It can be used to
     * visualize counts within a group, or for the circular pattern, typically
     * a parliament.
     *
     * The circular layout has much in common with a pie chart. Many of the item
     * series options, like `center`, `size` and data label positioning, are
     * inherited from the pie series and don't apply for rectangular layouts.
     *
     * @sample       highcharts/demo/parliament-chart
     *               Parliament chart (circular item chart)
     * @sample       highcharts/series-item/rectangular
     *               Rectangular item chart
     * @sample       highcharts/series-item/symbols
     *               Infographic with symbols
     *
     * @extends      plotOptions.pie
     * @since        7.1.0
     * @product      highcharts
     * @excluding    borderColor, borderWidth, depth, linecap, shadow,
     *               slicedOffset
     * @requires     modules/item-series
     * @optionparent plotOptions.item
     */
    public static defaultOptions: ItemSeriesOptions = merge(PieSeries.defaultOptions, {
        /**
         * In circular view, the end angle of the item layout, in degrees where
         * 0 is up.
         *
         * @sample highcharts/demo/parliament-chart
         *         Parliament chart
         * @type {undefined|number}
         */
        endAngle: void 0,
        /**
         * In circular view, the size of the inner diameter of the circle. Can
         * be a percentage or pixel value. Percentages are relative to the outer
         * perimeter. Pixel values are given as integers.
         *
         * If the `rows` option is set, it overrides the `innerSize` setting.
         *
         * @sample highcharts/demo/parliament-chart
         *         Parliament chart
         * @type {string|number}
         */
        innerSize: '40%',
        /**
         * The padding between the items, given in relative size where the size
         * of the item is 1.
         * @type {number}
         */
        itemPadding: 0.1,
        /**
         * The layout of the items in rectangular view. Can be either
         * `horizontal` or `vertical`.
         * @sample highcharts/series-item/symbols
         *         Horizontal layout
         * @type {string}
         */
        layout: 'vertical',
        /**
         * @extends plotOptions.series.marker
         */
        marker: merge(
            (defaultOptions.plotOptions as any).line.marker,
            {
                radius: null
            }
        ),
        /**
         * The number of rows to display in the rectangular or circular view. If
         * the `innerSize` is set, it will be overridden by the `rows` setting.
         *
         * @sample highcharts/series-item/rows-columns
         *         Fixed row count
         * @type {number}
         */
        rows: void 0,
        crisp: false,
        showInLegend: true,
        /**
         * In circular view, the start angle of the item layout, in degrees
         * where 0 is up.
         *
         * @sample highcharts/demo/parliament-chart
         *         Parliament chart
         * @type {undefined|number}
         */
        startAngle: void 0
    } as ItemSeriesOptions);

    /* *
     *
     *  Properties
     *
     * */

    public borderWidth?: number;

    public data: Array<ItemPoint> = void 0 as any;

    public itemSize?: number;

    public options: ItemSeriesOptions = void 0 as any;

    public points: Array<ItemPoint> = void 0 as any;

    public slots?: Array<ItemSeries.GeometryObject>;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Fade in the whole chart.
     * @private
     */
    public animate(init?: boolean): void {
        if (init) {
            (this.group as any).attr({
                opacity: 0
            });
        } else {
            (this.group as any).animate({
                opacity: 1
            }, this.options.animation);
        }
    }

    public drawDataLabels(): void {
        if (this.center && this.slots) {
            H.seriesTypes.pie.prototype.drawDataLabels.call(this);

        // else, it's just a dot chart with no natural place to put the
        // data labels
        } else {
            this.points.forEach(function (point): void {
                point.destroyElements({ dataLabel: 1 });
            });
        }
    }

    public drawPoints(): void {
        let series = this,
            options = this.options,
            renderer = series.chart.renderer,
            seriesMarkerOptions: ItemPointMarkerOptions = options.marker as any,
            borderWidth: number = this.borderWidth as any,
            crisp = borderWidth % 2 ? 0.5 : 1,
            i = 0,
            rows = this.getRows(),
            cols = Math.ceil((this.total as any) / rows),
            cellWidth = this.chart.plotWidth / cols,
            cellHeight = this.chart.plotHeight / rows,
            itemSize = this.itemSize || Math.min(cellWidth, cellHeight);

        /* @todo: remove if not needed
        this.slots.forEach(slot => {
            this.chart.renderer.circle(slot.x, slot.y, 6)
                .attr({
                    fill: 'silver'
                })
                .add(this.group);
        });
        //*/

        this.points.forEach(function (point): void {
            let attr: SVGAttributes,
                graphics: Array<SVGElement|undefined>,
                pointAttr: (SVGAttributes|undefined),
                pointMarkerOptions = point.marker || {},
                symbol: SymbolKey = (
                    pointMarkerOptions.symbol ||
                    (seriesMarkerOptions.symbol as any)
                ),
                r = pick(
                    pointMarkerOptions.radius,
                    seriesMarkerOptions.radius
                ),
                size = defined(r) ? 2 * r : itemSize,
                padding = size * (options.itemPadding as any),
                x: number,
                y: number,
                width: number,
                height: number;

            point.graphics = graphics = point.graphics || [];

            if (!series.chart.styledMode) {
                pointAttr = series.pointAttribs(
                    point,
                    (point.selected as any) && 'select'
                );
            }

            if (!point.isNull && point.visible) {

                if (!point.graphic) {
                    point.graphic = renderer.g('point')
                        .add(series.group);
                }

                for (let val = 0; val < (point.y || 0); val++) {

                    // Semi-circle
                    if (series.center && series.slots) {

                        // Fill up the slots from left to right
                        const slot: ItemSeries.GeometryObject =
                            series.slots.shift() as any;
                        x = slot.x - itemSize / 2;
                        y = slot.y - itemSize / 2;

                    } else if (options.layout === 'horizontal') {
                        x = cellWidth * (i % cols);
                        y = cellHeight * Math.floor(i / cols);
                    } else {
                        x = cellWidth * Math.floor(i / rows);
                        y = cellHeight * (i % rows);
                    }

                    x += padding;
                    y += padding;
                    width = Math.round(size - 2 * padding);
                    height = width;
                    if (series.options.crisp) {
                        x = Math.round(x) - crisp;
                        y = Math.round(y) + crisp;
                    }
                    attr = {
                        x: x,
                        y: y,
                        width: width,
                        height: height
                    };
                    if (typeof r !== 'undefined') {
                        attr.r = r;
                    }
                    // Circles attributes update (#17257)
                    if (pointAttr) {
                        extend(attr, pointAttr);
                    }

                    let graphic = graphics[val];

                    if (graphic) {
                        graphic.animate(attr);
                    } else {
                        graphic = renderer
                            .symbol(
                                symbol,
                                void 0,
                                void 0,
                                void 0,
                                void 0,
                                {
                                    backgroundSize: 'within'
                                }
                            )
                            .attr(attr)
                            .add(point.graphic);
                    }
                    graphic.isActive = true;
                    graphics[val] = graphic;
                    i++;
                }
            }

            for (let j = 0; j < graphics.length; j++) {
                const graphic = graphics[j];
                if (!graphic) {
                    return;
                }

                if (!graphic.isActive) {
                    graphic.destroy();
                    graphics.splice(j, 1);
                    j--; // Need to substract 1 after splice, #19053
                } else {
                    graphic.isActive = false;
                }
            }
        });
    }

    public getRows(): number {
        let rows = this.options.rows,
            cols: number,
            ratio: number;

        // Get the row count that gives the most square cells
        if (!rows) {
            ratio = this.chart.plotWidth / this.chart.plotHeight;
            rows = Math.sqrt(this.total as any);

            if (ratio > 1) {
                rows = Math.ceil(rows);
                while (rows > 0) {
                    cols = (this.total as any) / rows;
                    if (cols / rows > ratio) {
                        break;
                    }
                    rows--;
                }
            } else {
                rows = Math.floor(rows);
                while (rows < (this.total as any)) {
                    cols = (this.total as any) / rows;
                    if (cols / rows < ratio) {
                        break;
                    }
                    rows++;
                }
            }
        }
        return rows;
    }

    /**
     * Get the semi-circular slots.
     * @private
     */
    public getSlots(): (Array<ItemSeries.GeometryObject>|undefined) {
        let center = this.center,
            diameter = center[2],
            innerSize = center[3],
            row: number,
            slots = this.slots,
            x: number,
            y: number,
            rowRadius: number,
            rowLength: number,
            colCount: number,
            increment: number,
            angle: number,
            col: number,
            itemSize = 0,
            rowCount: number,
            fullAngle = (
                (this.endAngleRad as any) - (this.startAngleRad as any)
            ),
            itemCount = Number.MAX_VALUE,
            finalItemCount: (number|undefined),
            rows: (Array<ItemSeries.RowObject>|undefined),
            testRows: (Array<ItemSeries.RowObject>|undefined),
            rowsOption = this.options.rows,
            // How many rows (arcs) should be used
            rowFraction = (diameter - innerSize) / diameter,
            isCircle: boolean = fullAngle % (2 * Math.PI) === 0,
            total = this.total || 0;

        // Increase the itemSize until we find the best fit
        while (itemCount > total + (rows && isCircle ? rows.length : 0)) {

            finalItemCount = itemCount;

            // Reset
            (slots as any).length = 0;
            itemCount = 0;

            // Now rows is the last successful run
            rows = testRows;
            testRows = [];

            itemSize++;

            // Total number of rows (arcs) from the center to the
            // perimeter
            rowCount = diameter / itemSize / 2;

            if (rowsOption) {
                innerSize = ((rowCount - rowsOption) / rowCount) * diameter;

                if (innerSize >= 0) {
                    rowCount = rowsOption;

                // If innerSize is negative, we are trying to set too
                // many rows in the rows option, so fall back to
                // treating it as innerSize 0
                } else {
                    innerSize = 0;
                    rowFraction = 1;
                }


            } else {
                rowCount = Math.floor(rowCount * rowFraction);
            }

            for (row = rowCount; row > 0; row--) {
                rowRadius = (innerSize + (row / rowCount) *
                    (diameter - innerSize - itemSize)) / 2;
                rowLength = fullAngle * rowRadius;
                colCount = Math.ceil(rowLength / itemSize);
                testRows.push({
                    rowRadius: rowRadius,
                    rowLength: rowLength,
                    colCount: colCount
                });

                itemCount += colCount + 1;
            }
        }

        if (!rows) {
            return;
        }

        // We now have more slots than we have total items. Loop over
        // the rows and remove the last slot until the count is correct.
        // For each iteration we sort the last slot by the angle, and
        // remove those with the highest angles.
        let overshoot = (finalItemCount as any) - (this.total as any) -
            (isCircle ? rows.length : 0);
        /**
         * @private
         * @param {Highcharts.ItemRowContainerObject} item
         * Wrapped object with angle and row
             */
        function cutOffRow(item: ItemSeries.RowContainerObject): void {
            if (overshoot > 0) {
                item.row.colCount--;
                overshoot--;
            }
        }
        while (overshoot > 0) {
            rows
                // Return a simplified representation of the angle of
                // the last slot within each row.
                .map(function (row): ItemSeries.RowContainerObject {
                    return {
                        angle: row.colCount / row.rowLength,
                        row: row
                    };
                })
                // Sort by the angles...
                .sort(function (a, b): number {
                    return b.angle - a.angle;
                })
                // ...so that we can ignore the items with the lowest
                // angles...
                .slice(
                    0,
                    Math.min(overshoot, Math.ceil(rows.length / 2))
                )
                // ...and remove the ones with the highest angles
                .forEach(cutOffRow);
        }

        rows.forEach(function (row): void {
            const rowRadius = row.rowRadius,
                colCount = row.colCount;
            increment = colCount ? fullAngle / colCount : 0;
            for (col = 0; col <= colCount; col += 1) {
                angle = (this.startAngleRad as any) + col * increment;
                x = center[0] + Math.cos(angle) * rowRadius;
                y = center[1] + Math.sin(angle) * rowRadius;
                (slots as any).push({ x: x, y: y, angle: angle });
            }
        }, this);

        // Sort by angle
        (slots as any).sort(function (
            a: ItemSeries.GeometryObject,
            b: ItemSeries.GeometryObject
        ): number {
            return a.angle - b.angle;
        });

        this.itemSize = itemSize;
        return slots;

    }

    public translate(_positions?: Array<number>): void {

        // Initialize chart without setting data, #13379.
        if (
            this.total === 0 && // check if that is a (semi-)circle
            isNumber(this.options.startAngle) &&
            isNumber(this.options.endAngle)
        ) {
            this.center = this.getCenter();
        }
        if (!this.slots) {
            this.slots = [];
        }
        if (
            isNumber(this.options.startAngle) &&
            isNumber(this.options.endAngle)
        ) {
            H.seriesTypes.pie.prototype.translate.apply(this, arguments);
            this.slots = this.getSlots();
        } else {
            this.generatePoints();
            fireEvent(this, 'afterTranslate');
        }
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface ItemSeries {
    pointClass: typeof ItemPoint;
}
extend(ItemSeries.prototype, {
    markerAttribs: void 0
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace ItemSeries {
    export interface GeometryObject extends CoreGeometryObject {
        angle: number;
    }
    export interface RowContainerObject {
        angle: number;
        row: RowObject;
    }
    export interface RowObject {
        colCount: number;
        rowLength: number;
        rowRadius: number;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        item: typeof ItemSeries;
    }
}
ItemSeries.prototype.pointClass = ItemPoint;
SeriesRegistry.registerSeriesType('item', ItemSeries);

/* *
 *
 *  Default Export
 *
 * */

export default ItemSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * An `item` series. If the [type](#series.item.type) option is not specified,
 * it is inherited from [chart.type](#chart.type).
 *
 * @extends   series,plotOptions.item
 * @excluding dataParser, dataURL, stack, xAxis, yAxis, dataSorting,
 *            boostThreshold, boostBlending
 * @product   highcharts
 * @requires  modules/item-series
 * @apioption series.item
 */

/**
 * An array of data points for the series. For the `item` series type,
 * points can be given in the following ways:
 *
 * 1. An array of numerical values. In this case, the numerical values will be
 *    interpreted as `y` options. Example:
 *    ```js
 *    data: [0, 5, 3, 5]
 *    ```
 *
 * 2. An array of objects with named values. The following snippet shows only a
 *    few settings, see the complete options set below. If the total number of
 *    data points exceeds the series'
 *    [turboThreshold](#series.item.turboThreshold),
 *    this option is not available.
 *    ```js
 *    data: [{
 *        y: 1,
 *        name: "Point2",
 *        color: "#00FF00"
 *    }, {
 *        y: 7,
 *        name: "Point1",
 *        color: "#FF00FF"
 *    }]
 *    ```
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
 * @type      {Array<number|Array<string,(number|null)>|null|*>}
 * @extends   series.pie.data
 * @exclude   sliced
 * @product   highcharts
 * @apioption series.item.data
 */

/**
 * The sequential index of the data point in the legend.
 *
 * @type      {number}
 * @product   highcharts
 * @apioption series.pie.data.legendIndex
 */

/**
 * @excluding legendItemClick
 * @apioption series.item.events
 */

''; // adds the doclets above to the transpiled file
