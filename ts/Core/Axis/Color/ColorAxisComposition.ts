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

import type Axis from '../Axis';
import type Chart from '../../Chart/Chart';
import type ColorAxis from './ColorAxis';
import type ColorType from '../../Color/ColorType';
import type Fx from '../../Animation/Fx';
import type Legend from '../../Legend/Legend';
import type Point from '../../Series/Point';
import type Series from '../../Series/Series';
import type SeriesOptions from '../../Series/SeriesOptions';
import type TreemapSeries from '../../../Series/Treemap/TreemapSeries';

import Color from '../../Color/Color.js';
const { parse: color } = Color;
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    splat,
    pushUnique
} = AH;
const {
    extend,
    merge
} = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Series/PointLike' {
    interface PointLike {
        /** @requires ColorSeriesMixin */
        setVisible(vis?: boolean): void;
    }
}

declare module '../../Series/SeriesLike' {
    interface SeriesLike {
        /** @requires ColorSeriesMixin */
        translateColors(): void;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace ColorAxisComposition {

    /* *
     *
     *  Declarations
     *
     * */

    export interface PointComposition extends Point {
        series: SeriesComposition;
        value?: (number|null);
        setVisible(vis?: boolean): void;
    }

    export interface SeriesComposition extends Series {
        colorAxis: ColorAxis;
        data: Array<PointComposition>;
        points: Array<PointComposition>;
        options: SeriesCompositionOptions;
        optionalAxis?: string;
        translateColors(): void;
    }

    export interface SeriesCompositionOptions extends SeriesOptions {
        nullColor?: ColorType;
    }

    /* *
     *
     *  Constants
     *
     * */

    const composedMembers: Array<unknown> = [];

    /* *
     *
     *  Variables
     *
     * */

    let ColorAxisClass: typeof ColorAxis;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    export function compose(
        ColorAxisType: typeof ColorAxis,
        ChartClass: typeof Chart,
        FxClass: typeof Fx,
        LegendClass: typeof Legend,
        SeriesClass: typeof Series
    ): void {

        if (!ColorAxisClass) {
            ColorAxisClass = ColorAxisType;
        }

        if (pushUnique(composedMembers, ChartClass)) {
            const chartProto = ChartClass.prototype;

            chartProto.collectionsWithUpdate.push('colorAxis');
            chartProto.collectionsWithInit.colorAxis = [
                chartProto.addColorAxis
            ];

            addEvent(ChartClass, 'afterGetAxes', onChartAfterGetAxes);

            wrapChartCreateAxis(ChartClass);
        }

        if (pushUnique(composedMembers, FxClass)) {
            const fxProto = FxClass.prototype;

            fxProto.fillSetter = wrapFxFillSetter;
            fxProto.strokeSetter = wrapFxStrokeSetter;
        }

        if (pushUnique(composedMembers, LegendClass)) {
            addEvent(LegendClass, 'afterGetAllItems', onLegendAfterGetAllItems);
            addEvent(
                LegendClass,
                'afterColorizeItem',
                onLegendAfterColorizeItem
            );
            addEvent(LegendClass, 'afterUpdate', onLegendAfterUpdate);
        }

        if (pushUnique(composedMembers, SeriesClass)) {
            extend(
                SeriesClass.prototype,
                {
                    optionalAxis: 'colorAxis',
                    translateColors: seriesTranslateColors
                }
            );
            extend(
                SeriesClass.prototype.pointClass.prototype,
                {
                    setVisible: pointSetVisible
                }
            );

            addEvent(
                SeriesClass,
                'afterTranslate',
                onSeriesAfterTranslate,
                { order: 1 }
            );
            addEvent(SeriesClass, 'bindAxes', onSeriesBindAxes);
        }

    }

    /**
     * Extend the chart getAxes method to also get the color axis.
     * @private
     */
    function onChartAfterGetAxes(
        this: Chart
    ): void {
        const options = this.options;

        this.colorAxis = [];

        if (options.colorAxis) {
            options.colorAxis = splat(options.colorAxis);
            options.colorAxis.forEach((axisOptions): void => {
                new ColorAxisClass(this, axisOptions); // eslint-disable-line no-new
            });
        }
    }

    /**
     * Add the color axis. This also removes the axis' own series to prevent
     * them from showing up individually.
     * @private
     */
    function onLegendAfterGetAllItems(
        this: Legend,
        e: {
            allItems: Array<(Series|Point|ColorAxis|ColorAxis.LegendItemObject)>;
        }
    ): void {
        const colorAxes = this.chart.colorAxis || [],
            destroyItem = (item: (Series|Point)): void => {
                const i = e.allItems.indexOf(item);
                if (i !== -1) {
                    // #15436
                    this.destroyItem(e.allItems[i]);
                    e.allItems.splice(i, 1);
                }
            };

        let colorAxisItems = [] as Array<(ColorAxis|ColorAxis.LegendItemObject)>,
            options: ColorAxis.Options,
            i;

        colorAxes.forEach(function (colorAxis: ColorAxis): void {
            options = colorAxis.options;

            if (options && options.showInLegend) {
                // Data classes
                if (options.dataClasses && options.visible) {
                    colorAxisItems = colorAxisItems.concat(
                        colorAxis.getDataClassLegendSymbols()
                    );
                    // Gradient legend
                } else if (options.visible) {
                    // Add this axis on top
                    colorAxisItems.push(colorAxis);
                }
                // If dataClasses are defined or showInLegend option is not set
                // to true, do not add color axis' series to legend.
                colorAxis.series.forEach(function (series): void {
                    if (!series.options.showInLegend || options.dataClasses) {
                        if (series.options.legendType === 'point') {
                            series.points.forEach(function (
                                point: Point
                            ): void {
                                destroyItem(point);
                            });

                        } else {
                            destroyItem(series);
                        }
                    }
                });
            }
        });

        i = colorAxisItems.length;
        while (i--) {
            e.allItems.unshift(colorAxisItems[i]);
        }
    }

    /**
     * @private
     */
    function onLegendAfterColorizeItem(
        this: Legend,
        e: {
            item: ColorAxis;
            visible: boolean;
        }
    ): void {
        if (e.visible && e.item.legendColor) {
            (e.item.legendItem as any).symbol.attr({
                fill: e.item.legendColor
            });
        }
    }

    /**
     * Updates in the legend need to be reflected in the color axis. (#6888)
     * @private
     */
    function onLegendAfterUpdate(this: Legend): void {
        const colorAxes = this.chart.colorAxis;

        if (colorAxes) {
            colorAxes.forEach(function (colorAxis): void {
                colorAxis.update({}, arguments[2]);
            });
        }
    }

    /**
     * Calculate and set colors for points.
     * @private
     */
    function onSeriesAfterTranslate(
        this: Series
    ): void {
        if (
            this.chart.colorAxis &&
            this.chart.colorAxis.length ||
            (this as TreemapSeries).colorAttribs
        ) {
            this.translateColors();
        }
    }

    /**
     * Add colorAxis to series axisTypes.
     * @private
     */
    function onSeriesBindAxes(
        this: Series
    ): void {
        const axisTypes = this.axisTypes;

        if (!axisTypes) {
            this.axisTypes = ['colorAxis'];

        } else if (axisTypes.indexOf('colorAxis') === -1) {
            axisTypes.push('colorAxis');
        }
    }

    /**
     * Set the visibility of a single point
     * @private
     * @function Highcharts.colorPointMixin.setVisible
     * @param {boolean} visible
     */
    export function pointSetVisible(
        this: PointComposition,
        vis?: boolean
    ): void {
        const point = this,
            method = vis ? 'show' : 'hide';

        point.visible = point.options.visible = Boolean(vis);

        // Show and hide associated elements
        ['graphic', 'dataLabel'].forEach(function (key: string): void {
            if ((point as any)[key]) {
                (point as any)[key][method]();
            }
        });
        this.series.buildKDTree(); // rebuild kdtree #13195
    }

    /**
     * In choropleth maps, the color is a result of the value, so this needs
     * translation too
     * @private
     * @function Highcharts.colorSeriesMixin.translateColors
     */
    function seriesTranslateColors(this: SeriesComposition): void {
        const series = this,
            points = this.data.length ? this.data : this.points,
            nullColor = this.options.nullColor,
            colorAxis = this.colorAxis,
            colorKey = this.colorKey;

        points.forEach((point): void => {
            const value = point.getNestedProperty(colorKey) as number,
                color = point.options.color || (
                    point.isNull || point.value === null ?
                        nullColor :
                        (colorAxis && typeof value !== 'undefined') ?
                            colorAxis.toColor(value, point) :
                            point.color || series.color
                );

            if (color && point.color !== color) {
                point.color = color;

                if (
                    series.options.legendType === 'point' &&
                    point.legendItem &&
                    point.legendItem.label
                ) {
                    series.chart.legend.colorizeItem(point, point.visible);
                }
            }
        });
    }

    /**
     * @private
     */
    function wrapChartCreateAxis(
        ChartClass: typeof Chart
    ): void {
        const superCreateAxis = ChartClass.prototype.createAxis;

        ChartClass.prototype.createAxis = function (
            type: string,
            options: Chart.CreateAxisOptionsObject
        ): (Axis|ColorAxis) {
            if (type !== 'colorAxis') {
                return superCreateAxis.apply(this, arguments);
            }

            const axis = new ColorAxisClass(this, merge(options.axis, {
                index: (this as AnyRecord)[type].length,
                isX: false
            }));

            this.isDirtyLegend = true;

            // Clear before 'bindAxes' (#11924)
            this.axes.forEach(function (axis): void {
                axis.series = [];
            });

            this.series.forEach(function (series): void {
                series.bindAxes();
                series.isDirtyData = true;
            });

            if (pick(options.redraw, true)) {
                this.redraw(options.animation);
            }

            return axis;
        };
    }

    /**
     * Handle animation of the color attributes directly.
     * @private
     */
    function wrapFxFillSetter(
        this: Fx
    ): void {
        this.elem.attr(
            'fill',
            color(this.start as any).tweenTo(
                color(this.end as any),
                this.pos
            ),
            void 0,
            true
        );
    }

    /**
     * Handle animation of the color attributes directly.
     * @private
     */
    function wrapFxStrokeSetter(
        this: Fx
    ): void {
        this.elem.attr(
            'stroke',
            color(this.start as any).tweenTo(
                color(this.end as any),
                this.pos
            ),
            void 0,
            true
        );
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ColorAxisComposition;
