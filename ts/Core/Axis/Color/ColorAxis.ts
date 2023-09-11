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

import type AnimationOptions from '../../Animation/AnimationOptions';
import type AxisLike from '../AxisLike';
import type AxisOptions from '../AxisOptions';
import type Chart from '../../Chart/Chart.js';
import type ColorString from '../../Color/ColorString';
import type ColorType from '../../Color/ColorType';
import type Fx from '../../Animation/Fx';
import type GradientColor from '../../Color/GradientColor';
import type Legend from '../../Legend/Legend';
import type { LegendItemObject } from '../../Legend/LegendItem';
import type LegendOptions from '../../Legend/LegendOptions';
import type Point from '../../Series/Point.js';
import type PointerEvent from '../../PointerEvent';
import type { StatesOptionsKey } from '../../Series/StatesOptions';
import type SVGPath from '../../Renderer/SVG/SVGPath';

import Axis from '../Axis.js';
import Color from '../../Color/Color.js';
const { parse: color } = Color;
import ColorAxisComposition from './ColorAxisComposition.js';
import ColorAxisDefaults from './ColorAxisDefaults.js';
import LegendSymbol from '../../Legend/LegendSymbol.js';
import SeriesRegistry from '../../Series/SeriesRegistry.js';
import SeriesClass from '../../Series/Series';
const { series: Series } = SeriesRegistry;
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber } = TC;
const {
    merge,
    extend
} = OH;
const { fireEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Axis/AxisLike' {
    interface AxisLike {
        labelLeft?: number;
        labelRight?: number;
    }
}

declare module '../../Chart/ChartLike' {
    interface ChartLike {
        colorAxis?: Array<ColorAxis>;
    }
}

declare module '../../../Core/Options'{
    interface Options {
        colorAxis?: (
            DeepPartial<ColorAxis.Options>|
            Array<DeepPartial<ColorAxis.Options>>
        );
    }
}

declare module '../../Series/PointLike' {
    interface PointLike {
        dataClass?: number;
    }
}

declare module '../../Series/SeriesLike' {
    interface SeriesLike {
        axisTypes?: Array<string>;
        colorAxis?: ColorAxis;
        colorKey?: string;
        minColorValue?: number;
        maxColorValue?: number;
    }
}

declare module '../../Series/SeriesOptions' {
    interface SeriesOptions {
        colorKey?: string;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The ColorAxis object for inclusion in gradient legends.
 *
 * @class
 * @name Highcharts.ColorAxis
 * @augments Highcharts.Axis
 *
 * @param {Highcharts.Chart} chart
 * The related chart of the color axis.
 *
 * @param {Highcharts.ColorAxisOptions} userOptions
 * The color axis options for initialization.
 */
class ColorAxis extends Axis implements AxisLike {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultColorAxisOptions = ColorAxisDefaults;

    public static defaultLegendLength: number = 200;

    /**
     * @private
     */
    public static keepProps: Array<string> = [
        'legendItem'
    ];

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        ChartClass: typeof Chart,
        FxClass: typeof Fx,
        LegendClass: typeof Legend,
        SeriesClass: typeof Series
    ): void {
        ColorAxisComposition.compose(
            ColorAxis,
            ChartClass,
            FxClass,
            LegendClass,
            SeriesClass
        );
    }

    /* *
     *
     *  Constructors
     *
     * */

    /**
     * @private
     */
    public constructor(
        chart: Chart,
        userOptions: DeepPartial<ColorAxis.Options>
    ) {
        super(chart, userOptions);
        this.init(chart, userOptions);
    }

    /* *
     *
     *  Properties
     *
     * */

    public added?: boolean;
    // Prevents unnecessary padding with `hc-more`
    public beforePadding = false as any;
    public chart: Chart = void 0 as any;
    public coll = 'colorAxis' as const;
    public dataClasses: Array<ColorAxis.DataClassesOptions> = void 0 as any;
    public legendColor?: GradientColor;
    public legendItem?: LegendItemObject;
    public name?: string;
    public options: ColorAxis.Options = void 0 as any;
    public stops: GradientColor['stops'] = void 0 as any;
    public visible: boolean = true;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initializes the color axis.
     *
     * @function Highcharts.ColorAxis#init
     *
     * @param {Highcharts.Chart} chart
     * The related chart of the color axis.
     *
     * @param {Highcharts.ColorAxisOptions} userOptions
     * The color axis options for initialization.
     */
    public init(
        chart: Chart,
        userOptions: DeepPartial<ColorAxis.Options>
    ): void {
        const axis = this;
        const legend = chart.options.legend || {},
            horiz = userOptions.layout ?
                userOptions.layout !== 'vertical' :
                legend.layout !== 'vertical',
            visible = userOptions.visible;

        const options = merge(
            ColorAxis.defaultColorAxisOptions,
            userOptions,
            {
                showEmpty: false,
                title: null,
                visible: legend.enabled && visible !== false
            }
        );

        axis.side = userOptions.side || horiz ? 2 : 1;
        axis.reversed = userOptions.reversed || !horiz;
        axis.opposite = !horiz;

        super.init(chart, options, 'colorAxis');

        // Super.init saves the extended user options, now replace it with the
        // originals
        this.userOptions = userOptions;
        if (isArray(chart.userOptions.colorAxis)) {
            chart.userOptions.colorAxis[this.index] = userOptions;
        }

        // Prepare data classes
        if (userOptions.dataClasses) {
            axis.initDataClasses(userOptions);
        }
        axis.initStops();

        // Override original axis properties
        axis.horiz = horiz;
        axis.zoomEnabled = false;
    }

    /**
     * @private
     */
    public initDataClasses(userOptions: DeepPartial<ColorAxis.Options>): void {
        const axis = this,
            chart = axis.chart,
            legendItem = axis.legendItem = axis.legendItem || {},
            len = (userOptions.dataClasses as any).length,
            options = axis.options;

        let dataClasses,
            colorCounter = 0,
            colorCount = chart.options.chart.colorCount;

        axis.dataClasses = dataClasses = [] as Array<ColorAxis.DataClassesOptions>;
        legendItem.labels = [] as Array<ColorAxis.LegendItemObject>;

        (userOptions.dataClasses || []).forEach(function (dataClass, i): void {
            let colors: any;

            dataClass = merge(dataClass);
            dataClasses.push(dataClass);

            if (!chart.styledMode && dataClass.color) {
                return;
            }

            if (options.dataClassColor === 'category') {
                if (!chart.styledMode) {
                    colors = chart.options.colors;
                    colorCount = colors.length;
                    dataClass.color = colors[colorCounter];
                }

                dataClass.colorIndex = colorCounter;

                // increase and loop back to zero
                colorCounter++;
                if (colorCounter === colorCount) {
                    colorCounter = 0;
                }
            } else {
                dataClass.color = color(options.minColor).tweenTo(
                    color(options.maxColor),
                    len < 2 ? 0.5 : i / (len - 1) // #3219
                );
            }
        });
    }

    /**
     * Returns true if the series has points at all.
     *
     * @function Highcharts.ColorAxis#hasData
     *
     * @return {boolean}
     * True, if the series has points, otherwise false.
     */
    public hasData(): boolean {
        return !!(this.tickPositions || []).length;
    }

    /**
     * Override so that ticks are not added in data class axes (#6914)
     * @private
     */
    public setTickPositions(): void {
        if (!this.dataClasses) {
            return super.setTickPositions();
        }
    }

    /**
     * @private
     */
    public initStops(): void {
        const axis = this;

        axis.stops = axis.options.stops || [
            [0, axis.options.minColor as any],
            [1, axis.options.maxColor as any]
        ];
        axis.stops.forEach(function (
            stop: GradientColor['stops'][0]
        ): void {
            stop.color = color(stop[1]);
        });
    }

    /**
     * Extend the setOptions method to process extreme colors and color stops.
     * @private
     */
    public setOptions(userOptions: DeepPartial<ColorAxis.Options>): void {
        const axis = this;

        super.setOptions(userOptions);

        axis.options.crosshair = axis.options.marker;
    }

    /**
     * @private
     */
    public setAxisSize(): void {
        const axis = this;
        const symbol = axis.legendItem && axis.legendItem.symbol;
        const chart = axis.chart;
        const legendOptions = chart.options.legend || {};

        let x,
            y,
            width,
            height;

        if (symbol) {
            this.left = x = symbol.attr('x') as any;
            this.top = y = symbol.attr('y') as any;
            this.width = width = symbol.attr('width') as any;
            this.height = height = symbol.attr('height') as any;
            this.right = chart.chartWidth - x - width;
            this.bottom = chart.chartHeight - y - height;

            this.len = this.horiz ? width : height;
            this.pos = this.horiz ? x : y;
        } else {
            // Fake length for disabled legend to avoid tick issues
            // and such (#5205)
            this.len = (
                this.horiz ?
                    legendOptions.symbolWidth :
                    legendOptions.symbolHeight
            ) || ColorAxis.defaultLegendLength;
        }
    }

    /**
     * @private
     */
    public normalizedValue(value: number): number {
        const axis = this;

        if (axis.logarithmic) {
            value = axis.logarithmic.log2lin(value);
        }

        return 1 - (
            ((axis.max as any) - value) /
            (((axis.max as any) - (axis.min as any)) || 1)
        );
    }

    /**
     * Translate from a value to a color.
     * @private
     */
    public toColor(value: number, point: Point): (ColorType|undefined) {
        const axis = this;
        const dataClasses = axis.dataClasses;
        const stops = axis.stops;

        let pos,
            from,
            to,
            color: (ColorString|undefined),
            dataClass,
            i;

        if (dataClasses) {
            i = dataClasses.length;
            while (i--) {
                dataClass = dataClasses[i];
                from = dataClass.from;
                to = dataClass.to;
                if ((typeof from === 'undefined' || value >= from) &&
                    (typeof to === 'undefined' || value <= to)
                ) {

                    color = dataClass.color as any;

                    if (point) {
                        point.dataClass = i;
                        point.colorIndex = dataClass.colorIndex as any;
                    }
                    break;
                }
            }

        } else {

            pos = axis.normalizedValue(value);
            i = stops.length;
            while (i--) {
                if (pos > stops[i][0]) {
                    break;
                }
            }
            from = stops[i] || stops[i + 1];
            to = stops[i + 1] || from;

            // The position within the gradient
            pos = 1 - (to[0] - pos) / ((to[0] - from[0]) || 1);

            color = (from.color as any).tweenTo(
                to.color,
                pos
            );
        }

        return color;
    }

    /**
     * Override the getOffset method to add the whole axis groups inside the
     * legend.
     * @private
     */
    public getOffset(): void {
        const axis = this;
        const group = axis.legendItem && axis.legendItem.group;
        const sideOffset = axis.chart.axisOffset[axis.side];

        if (group) {

            // Hook for the getOffset method to add groups to this parent
            // group
            axis.axisParent = group;

            // Call the base
            super.getOffset();

            const legend = this.chart.legend;

            // Adds `maxLabelLength` needed for label padding corrections done
            // by `render()` and `getMargins()` (#15551).
            legend.allItems.forEach(function (item): void {
                if (item instanceof ColorAxis) {
                    item.drawLegendSymbol(legend, item);
                }
            });

            legend.render();
            this.chart.getMargins(true);

            // First time only
            if (!axis.added) {

                axis.added = true;

                axis.labelLeft = 0;
                axis.labelRight = axis.width;
            }
            // Reset it to avoid color axis reserving space
            axis.chart.axisOffset[axis.side] = sideOffset;
        }
    }

    /**
     * Create the color gradient.
     * @private
     */
    public setLegendColor(): void {
        const axis = this;
        const horiz = axis.horiz;
        const reversed = axis.reversed;
        const one = reversed ? 1 : 0;
        const zero = reversed ? 0 : 1;

        const grad = horiz ? [one, 0, zero, 0] : [0, zero, 0, one]; // #3190
        axis.legendColor = {
            linearGradient: {
                x1: grad[0],
                y1: grad[1],
                x2: grad[2],
                y2: grad[3]
            },
            stops: axis.stops
        };
    }

    /**
     * The color axis appears inside the legend and has its own legend symbol.
     * @private
     */
    public drawLegendSymbol(
        legend: Legend,
        item: ColorAxis
    ): void {
        const axis = this,
            legendItem = item.legendItem || {},
            padding = legend.padding,
            legendOptions = legend.options,
            labelOptions = axis.options.labels,
            itemDistance = pick(legendOptions.itemDistance, 10),
            horiz = axis.horiz,
            width = pick(
                legendOptions.symbolWidth,
                horiz ? ColorAxis.defaultLegendLength : 12
            ),
            height = pick(
                legendOptions.symbolHeight,
                horiz ? 12 : ColorAxis.defaultLegendLength
            ),
            labelPadding = pick(
                // @todo: This option is not documented, nor implemented when
                // vertical
                (legendOptions as any).labelPadding,
                horiz ? 16 : 30
            );

        this.setLegendColor();

        // Create the gradient
        if (!legendItem.symbol) {
            legendItem.symbol = this.chart.renderer.symbol(
                'roundedRect',
                0,
                (legend.baseline as any) - 11,
                width,
                height,
                { r: legendOptions.symbolRadius ?? 3 }
            ).attr({
                zIndex: 1
            }).add(legendItem.group);
        }

        // Set how much space this legend item takes up
        legendItem.labelWidth = (
            width +
            padding +
            (
                horiz ?
                    itemDistance :
                    pick(labelOptions.x, labelOptions.distance) +
                        this.maxLabelLength
            )
        );
        legendItem.labelHeight = height + padding + (horiz ? labelPadding : 0);
    }

    /**
     * Fool the legend.
     * @private
     */
    public setState(state?: StatesOptionsKey): void {
        this.series.forEach(function (series): void {
            series.setState(state);
        });
    }

    /**
     * @private
     */
    public setVisible(): void {
    }

    /**
     * @private
     */
    public getSeriesExtremes(): void {
        const axis = this;
        const series = axis.series;

        let colorValArray,
            colorKey,
            colorValIndex: any,
            pointArrayMap,
            calculatedExtremes,
            cSeries,
            i = series.length,
            yData,
            j;

        this.dataMin = Infinity;
        this.dataMax = -Infinity;

        while (i--) { // x, y, value, other
            cSeries = series[i];
            colorKey = cSeries.colorKey = pick(
                cSeries.options.colorKey,
                cSeries.colorKey,
                cSeries.pointValKey,
                cSeries.zoneAxis,
                'y'
            );

            pointArrayMap = cSeries.pointArrayMap;
            calculatedExtremes = (cSeries as any)[colorKey + 'Min'] &&
                (cSeries as any)[colorKey + 'Max'];

            if ((cSeries as any)[colorKey + 'Data']) {
                colorValArray = (cSeries as any)[colorKey + 'Data'];

            } else {
                if (!pointArrayMap) {
                    colorValArray = cSeries.yData;

                } else {
                    colorValArray = [];
                    colorValIndex = pointArrayMap.indexOf(colorKey);
                    yData = cSeries.yData;

                    if (colorValIndex >= 0 && yData) {
                        for (j = 0; j < yData.length; j++) {
                            colorValArray.push(
                                pick(
                                    (yData[j] as any)[colorValIndex],
                                    yData[j]
                                )
                            );
                        }
                    }
                }
            }
            // If color key extremes are already calculated, use them.
            if (calculatedExtremes) {
                cSeries.minColorValue = (cSeries as any)[colorKey + 'Min'];
                cSeries.maxColorValue = (cSeries as any)[colorKey + 'Max'];

            } else {
                const cExtremes = Series.prototype.getExtremes.call(
                    cSeries,
                    colorValArray
                );

                cSeries.minColorValue = cExtremes.dataMin;
                cSeries.maxColorValue = cExtremes.dataMax;
            }

            if (typeof cSeries.minColorValue !== 'undefined') {
                this.dataMin =
                    Math.min(this.dataMin, cSeries.minColorValue as any);
                this.dataMax =
                    Math.max(this.dataMax, cSeries.maxColorValue as any);
            }

            if (!calculatedExtremes) {
                Series.prototype.applyExtremes.call(cSeries);
            }
        }
    }

    /**
     * Internal function to draw a crosshair.
     *
     * @function Highcharts.ColorAxis#drawCrosshair
     *
     * @param {Highcharts.PointerEventObject} [e]
     *        The event arguments from the modified pointer event, extended with
     *        `chartX` and `chartY`
     *
     * @param {Highcharts.Point} [point]
     *        The Point object if the crosshair snaps to points.
     *
     * @emits Highcharts.ColorAxis#event:afterDrawCrosshair
     * @emits Highcharts.ColorAxis#event:drawCrosshair
     */
    public drawCrosshair(
        e?: PointerEvent,
        point?: ColorAxisComposition.PointComposition
    ): void {
        const axis = this,
            legendItem = axis.legendItem || {},
            plotX = point && point.plotX,
            plotY = point && point.plotY,
            axisPos = axis.pos,
            axisLen = axis.len;

        let crossPos;

        if (point) {
            crossPos = axis.toPixels(point.getNestedProperty(
                point.series.colorKey
            ) as number);
            if (crossPos < (axisPos as any)) {
                crossPos = (axisPos as any) - 2;
            } else if (crossPos > (axisPos as any) + axisLen) {
                crossPos = (axisPos as any) + axisLen + 2;
            }

            point.plotX = crossPos;
            point.plotY = axis.len - crossPos;

            super.drawCrosshair(e, point);

            point.plotX = plotX;
            point.plotY = plotY;

            if (
                axis.cross &&
                !axis.cross.addedToColorAxis &&
                legendItem.group
            ) {
                axis.cross
                    .addClass('highcharts-coloraxis-marker')
                    .add(legendItem.group);

                axis.cross.addedToColorAxis = true;

                if (
                    !axis.chart.styledMode &&
                    typeof axis.crosshair === 'object'
                ) {
                    axis.cross.attr({
                        fill: axis.crosshair.color
                    });
                }

            }
        }
    }

    /**
     * @private
     */
    public getPlotLinePath(options: Axis.PlotLinePathOptions): (SVGPath|null) {
        const axis = this,
            left = axis.left,
            pos = options.translatedValue,
            top = axis.top;

        // crosshairs only
        return isNumber(pos) ? // pos can be 0 (#3969)
            (
                axis.horiz ? [
                    ['M', pos - 4, top - 6],
                    ['L', pos + 4, top - 6],
                    ['L', pos, top],
                    ['Z']
                ] : [
                    ['M', left, pos],
                    ['L', left - 6, pos + 6],
                    ['L', left - 6, pos - 6],
                    ['Z']
                ]
            ) :
            super.getPlotLinePath(options);
    }

    /**
     * Updates a color axis instance with a new set of options. The options are
     * merged with the existing options, so only new or altered options need to
     * be specified.
     *
     * @function Highcharts.ColorAxis#update
     *
     * @param {Highcharts.ColorAxisOptions} newOptions
     * The new options that will be merged in with existing options on the color
     * axis.
     *
     * @param {boolean} [redraw]
     * Whether to redraw the chart after the color axis is altered. If doing
     * more operations on the chart, it is a good idea to set redraw to `false`
     * and call {@link Highcharts.Chart#redraw} after.
     */
    public update(
        newOptions: DeepPartial<ColorAxis.Options>,
        redraw?: boolean
    ): void {
        const axis = this,
            chart = axis.chart,
            legend = chart.legend;

        this.series.forEach((series): void => {
            // Needed for Axis.update when choropleth colors change
            series.isDirtyData = true;
        });

        // When updating data classes, destroy old items and make sure new
        // ones are created (#3207)
        if (newOptions.dataClasses && legend.allItems || axis.dataClasses) {
            axis.destroyItems();
        }

        super.update(newOptions, redraw);

        if (axis.legendItem && axis.legendItem.label) {
            axis.setLegendColor();
            legend.colorizeItem(this as any, true);
        }
    }

    /**
     * Destroy color axis legend items.
     * @private
     */
    public destroyItems(): void {
        const axis = this,
            chart = axis.chart,
            legendItem = axis.legendItem || {};

        if (legendItem.label) {
            chart.legend.destroyItem(axis);

        } else if (legendItem.labels) {
            for (const item of legendItem.labels) {
                chart.legend.destroyItem(item as any);
            }
        }

        chart.isDirtyLegend = true;
    }

    //   Removing the whole axis (#14283)
    public destroy(): void {
        this.chart.isDirtyLegend = true;

        this.destroyItems();
        super.destroy(...[].slice.call(arguments));
    }

    /**
     * Removes the color axis and the related legend item.
     *
     * @function Highcharts.ColorAxis#remove
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart following the remove.
     */
    public remove(redraw?: boolean): void {
        this.destroyItems();
        super.remove(redraw);
    }

    /**
     * Get the legend item symbols for data classes.
     * @private
     */
    public getDataClassLegendSymbols(): Array<ColorAxis.LegendItemObject> {
        const axis = this,
            chart = axis.chart,
            legendItems = (
                axis.legendItem &&
                axis.legendItem.labels as Array<ColorAxis.LegendItemObject> ||
                []
            ),
            legendOptions = chart.options.legend,
            valueDecimals = pick(legendOptions.valueDecimals, -1),
            valueSuffix = pick(legendOptions.valueSuffix, '');

        const getPointsInDataClass = (i: number): Array<Point> =>
            axis.series.reduce((points, s): Point[] => {
                points.push(...s.points.filter((point): boolean =>
                    point.dataClass === i
                ));
                return points;
            }, [] as Point[]);

        let name;

        if (!legendItems.length) {
            axis.dataClasses.forEach((dataClass, i): void => {
                const from = dataClass.from,
                    to = dataClass.to,
                    { numberFormatter } = chart;

                let vis = true;

                // Assemble the default name. This can be overridden
                // by legend.options.labelFormatter
                name = '';
                if (typeof from === 'undefined') {
                    name = '< ';
                } else if (typeof to === 'undefined') {
                    name = '> ';
                }
                if (typeof from !== 'undefined') {
                    name += numberFormatter(from, valueDecimals) + valueSuffix;
                }
                if (typeof from !== 'undefined' && typeof to !== 'undefined') {
                    name += ' - ';
                }
                if (typeof to !== 'undefined') {
                    name += numberFormatter(to, valueDecimals) + valueSuffix;
                }
                // Add a mock object to the legend items
                legendItems.push(extend<ColorAxis.LegendItemObject>(
                    {
                        chart,
                        name,
                        options: {},
                        drawLegendSymbol: LegendSymbol.rectangle,
                        visible: true,
                        isDataClass: true,

                        // Override setState to set either normal or inactive
                        // state to all points in this data class
                        setState: (state?: (StatesOptionsKey|'')): void => {
                            for (const point of getPointsInDataClass(i)) {
                                point.setState(state);
                            }
                        },

                        // Override setState to show or hide all points in this
                        // data class
                        setVisible: function (
                            this: ColorAxis.LegendItemObject
                        ): void {
                            this.visible = vis = axis.visible = !vis;
                            const affectedSeries: SeriesClass[] = [];
                            for (const point of getPointsInDataClass(i)) {
                                point.setVisible(vis);
                                if (
                                    affectedSeries.indexOf(point.series) === -1
                                ) {
                                    affectedSeries.push(point.series);
                                }
                            }
                            chart.legend.colorizeItem(this as any, vis);
                            affectedSeries.forEach((series): void => {
                                fireEvent(series, 'afterDataClassLegendClick');
                            });
                        }
                    },
                    dataClass
                ));
            });
        }
        return legendItems;
    }

}

/* *
 *
 *  Class Namespace
 *
 * */

namespace ColorAxis {

    /* *
     *
     *  Declarations
     *
     * */

    export interface DataClassesOptions {
        color?: ColorType;
        colorIndex?: number;
        from?: number;
        name?: string;
        to?: number;
    }

    export interface LegendItemObject extends DataClassesOptions {
        [key: string]: any;
        chart: Chart;
        name: string;
        options: object;
        drawLegendSymbol: typeof LegendSymbol['rectangle'];
        visible: boolean;
        setState: Point['setState'];
        isDataClass: true;
        setVisible: Function;
    }

    export interface MarkerOptions {
        animation?: (boolean|Partial<AnimationOptions>);
        color?: ColorType;
        width?: number;
    }

    export interface Options extends AxisOptions {
        dataClassColor?: string;
        dataClasses?: Array<DataClassesOptions>;
        layout?: string;
        legend?: LegendOptions;
        marker?: MarkerOptions;
        maxColor?: ColorType;
        minColor?: ColorType;
        showInLegend?: boolean;
        stops?: GradientColor['stops'];
    }

}

/* *
 *
 *  Registry
 *
 * */

// Properties to preserve after destroy, for Axis.update (#5881, #6025).
Array.prototype.push.apply(Axis.keepProps, ColorAxis.keepProps);

/* *
 *
 *  Default Export
 *
 * */

export default ColorAxis;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Color axis types
 *
 * @typedef {"linear"|"logarithmic"} Highcharts.ColorAxisTypeValue
 */

''; // detach doclet above
