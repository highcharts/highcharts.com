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
import type Chart3D from '../../Core/Chart/Chart3D';
import type ColorString from '../../Core/Color/ColorString';
import type ColumnPoint from '../Column/ColumnPoint';
import type ColumnSeriesOptions from '../Column/ColumnSeriesOptions';
import type DataLabelOptions from '../../Core/Series/DataLabelOptions';
import type Position3DObject from '../../Core/Renderer/Position3DObject';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import ColumnSeries from '../Column/ColumnSeries.js';
const { prototype: columnProto } = ColumnSeries;
import Series from '../../Core/Series/Series.js';
import Math3D from '../../Core/Math3D.js';
const { perspective } = Math3D;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import StackItem, { StackBoxProps } from '../../Core/Axis/Stacking/StackItem.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;
const { addEvent } = EH;
const {
    pick,
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike' {
    interface ChartLike {
        columnGroup: SVGElement;
    }
}

declare module '../../Core/Series/DataLabelOptions' {
    interface DataLabelOptions {
        outside3dPlot?: (boolean|null);
    }
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        height?: number;
        outside3dPlot?: (boolean|null);
        shapey?: number;
        plot3d?: Position3DObject;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        z: number;
        /** @requires Series/Column3DSeries */
        translate3dShapes(): void;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        depth?: number;
        edgeColor?: ColorString;
        edgeWidth?: number;
        groupZPadding?: number;
        inactiveOtherPoints?: boolean;
    }
}

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable no-invalid-this */

/**
 * @private
 * @param {Highcharts.Chart} chart
 * Chart with stacks
 * @param {string} stacking
 * Stacking option
 */
function retrieveStacks(
    chart: Chart,
    stacking?: string
): Chart3D.Stack3DDictionary {
    const series = chart.series as Array<Series>,
        stacks: Chart3D.Stack3DDictionary = { totalStacks: 0 };

    let stackNumber: number,
        i = 1;

    series.forEach(function (s): void {
        stackNumber = pick(
            s.options.stack as any,
            (stacking ? 0 : series.length - 1 - (s.index as any))
        ); // #3841, #4532
        if (!stacks[stackNumber]) {
            stacks[stackNumber] = { series: [s], position: i };
            i++;
        } else {
            stacks[stackNumber].series.push(s);
        }
    });

    stacks.totalStacks = i + 1;
    return stacks;
}

wrap(columnProto, 'translate', function (
    this: ColumnSeries,
    proceed: Function
): void {
    proceed.apply(this, [].slice.call(arguments, 1));

    // Do not do this if the chart is not 3D
    if (this.chart.is3d()) {
        this.translate3dShapes();
    }
});

// Don't use justifyDataLabel when point is outsidePlot
wrap(Series.prototype, 'justifyDataLabel', function (
    this: ColumnSeries,
    proceed: Function
): void {
    return !(arguments[2].outside3dPlot) ?
        proceed.apply(this, [].slice.call(arguments, 1)) :
        false;
});
columnProto.translate3dPoints = function (): void {};
columnProto.translate3dShapes = function (): void {

    let series: ColumnSeries = this,
        chart = series.chart,
        seriesOptions = series.options,
        depth = (seriesOptions as any).depth,
        stack = seriesOptions.stacking ?
            (seriesOptions.stack || 0) :
            series.index, // #4743
        z = (stack as any) * (depth + (seriesOptions.groupZPadding || 1)),
        borderCrisp = series.borderWidth % 2 ? 0.5 : 0,
        point2dPos; // Position of point in 2D, used for 3D position calculation

    if (chart.inverted && !series.yAxis.reversed) {
        borderCrisp *= -1;
    }

    if (seriesOptions.grouping !== false) {
        z = 0;
    }

    z += (seriesOptions.groupZPadding || 1);
    series.data.forEach(function (point): void {
        // #7103 Reset outside3dPlot flag
        point.outside3dPlot = null;
        if (point.y !== null) {
            const shapeArgs: BBoxObject = extend(
                    { x: 0, y: 0, width: 0, height: 0 },
                    point.shapeArgs || {}
                ),
                // Array for final shapeArgs calculation.
                // We are checking two dimensions (x and y).
                dimensions: (['x', 'width']|['y', 'height'])[] =
                    [['x', 'width'], ['y', 'height']],
                tooltipPos = point.tooltipPos;

            let borderlessBase; // Crisped rects can have +/- 0.5 pixels offset.

            // #3131 We need to check if column is inside plotArea.
            dimensions.forEach((d): void => {
                borderlessBase = shapeArgs[d[0]] - borderCrisp;
                if (borderlessBase < 0) {
                    // If borderLessBase is smaller than 0, it is needed to set
                    // its value to 0 or 0.5 depending on borderWidth
                    // borderWidth may be even or odd.
                    shapeArgs[d[1]] += shapeArgs[d[0]] + borderCrisp;
                    shapeArgs[d[0]] = -borderCrisp;
                    borderlessBase = 0;
                }
                if (
                    (
                        borderlessBase + shapeArgs[d[1]] >
                        (series as any)[d[0] + 'Axis'].len
                    ) &&
                    // Do not change height/width of column if 0 (#6708)
                    shapeArgs[d[1]] !== 0
                ) {
                    shapeArgs[d[1]] =
                        (series as any)[d[0] + 'Axis'].len -
                        shapeArgs[d[0]];
                }
                if (
                    // Do not remove columns with zero height/width.
                    shapeArgs[d[1]] !== 0 &&
                    (
                        shapeArgs[d[0]] >= (series as any)[d[0] + 'Axis'].len ||
                        shapeArgs[d[0]] + shapeArgs[d[1]] <= borderCrisp
                    )
                ) {
                    // Set args to 0 if column is outside the chart.
                    for (const key in shapeArgs) { // eslint-disable-line guard-for-in
                        // #13840
                        (shapeArgs as any)[key] = key === 'y' ? -9999 : 0;
                    }
                    // #7103 outside3dPlot flag is set on Points which are
                    // currently outside of plot.
                    point.outside3dPlot = true;
                }
            });

            // Change from 2d to 3d
            if (point.shapeType === 'roundedRect') {
                point.shapeType = 'cuboid';
            }
            point.shapeArgs = extend<SVGAttributes>(
                shapeArgs, {
                    z,
                    depth,
                    insidePlotArea: true
                } as any
            );

            // Point's position in 2D
            point2dPos = {
                x: shapeArgs.x + shapeArgs.width / 2,
                y: shapeArgs.y,
                z: z + depth / 2 // The center of column in Z dimension
            };

            // Recalculate point positions for inverted graphs
            if (chart.inverted) {
                point2dPos.x = shapeArgs.height;
                point2dPos.y = point.clientX || 0;
            }

            // Calculate and store point's position in 3D,
            // using perspective method.
            point.plot3d = perspective([point2dPos], chart, true, false)[0];

            // Translate the tooltip position in 3d space
            if (tooltipPos) {
                const translatedTTPos = perspective(
                    [{
                        x: tooltipPos[0],
                        y: tooltipPos[1],
                        z: z + depth / 2 // The center of column in Z dimension
                    }],
                    chart,
                    true,
                    false
                )[0];
                point.tooltipPos = [translatedTTPos.x, translatedTTPos.y];
            }
        }
    });
    // store for later use #4067
    series.z = z;
};

wrap(columnProto, 'animate', function (
    this: ColumnSeries,
    proceed: Function
): void {
    if (!this.chart.is3d()) {
        proceed.apply(this, [].slice.call(arguments, 1));
    } else {
        const args = arguments,
            init = args[1],
            yAxis = this.yAxis,
            series = this,
            reversed = this.yAxis.reversed;


        if (init) {
            series.data.forEach(function (point): void {
                if (point.y !== null) {
                    point.height = (point.shapeArgs as any).height;
                    point.shapey = (point.shapeArgs as any).y; // #2968
                    (point.shapeArgs as any).height = 1;
                    if (!reversed) {
                        if (point.stackY) {
                            (point.shapeArgs as any).y =
                                (point.plotY as any) +
                                yAxis.translate(point.stackY);
                        } else {
                            (point.shapeArgs as any).y =
                                (point.plotY as any) +
                                (
                                    point.negative ?
                                        -(point.height as any) :
                                        (point.height as any)
                                );
                        }
                    }
                }
            });

        } else { // run the animation
            series.data.forEach(function (point): void {
                if (point.y !== null) {
                    (point.shapeArgs as any).height = point.height;
                    (point.shapeArgs as any).y = point.shapey; // #2968
                    // null value do not have a graphic
                    if (point.graphic) {
                        point.graphic[
                            point.outside3dPlot ?
                                'attr' :
                                'animate'
                        ](
                            point.shapeArgs as any,
                            series.options.animation
                        );
                    }
                }
            });

            // redraw datalabels to the correct position
            this.drawDataLabels();
        }

    }
});

// In case of 3d columns there is no sense to add this columns to a specific
// series group - if series is added to a group all columns will have the same
// zIndex in comparison with different series.
wrap(
    columnProto,
    'plotGroup',
    function (
        this: ColumnSeries,
        proceed: Function,
        prop: string,
        _name: string,
        _visibility?: boolean,
        _zIndex?: number,
        parent?: SVGElement
    ): void {
        if (prop !== 'dataLabelsGroup' && prop !== 'markerGroup') {
            if (this.chart.is3d()) {
                if ((this as any)[prop]) {
                    delete (this as any)[prop];
                }
                if (parent) {
                    if (!this.chart.columnGroup) {
                        this.chart.columnGroup =
                            this.chart.renderer.g('columnGroup').add(parent);
                    }
                    (this as any)[prop] = this.chart.columnGroup;
                    this.chart.columnGroup.attr(this.getPlotBox());
                    (this as any)[prop].survive = true;
                    if (prop === 'group') {
                        arguments[3] = 'visible';
                        // For 3D column group and markerGroup should be visible
                    }
                }
            }
        }
        return proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    }
);

// When series is not added to group it is needed to change setVisible method to
// allow correct Legend funcionality. This wrap is basing on pie chart series.
wrap(
    columnProto,
    'setVisible',
    function (
        this: ColumnSeries,
        proceed: Function,
        vis?: boolean
    ): void {
        const series = this;

        if (series.chart.is3d()) {
            series.data.forEach(function (point): void {
                point.visible = point.options.visible = vis =
                    typeof vis === 'undefined' ?
                        !pick(series.visible, point.visible) : vis;
                (series.options.data as any)[series.data.indexOf(point)] =
                    point.options;
                if (point.graphic) {
                    point.graphic.attr({
                        visibility: vis ? 'visible' : 'hidden'
                    });
                }
            });
        }
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    }
);

addEvent(ColumnSeries, 'afterInit', function (): void {
    if (this.chart.is3d()) {
        let series = this as ColumnSeries,
            seriesOptions: ColumnSeriesOptions = this.options,
            grouping = seriesOptions.grouping,
            stacking = seriesOptions.stacking,
            reversedStacks = this.yAxis.options.reversedStacks,
            z = 0;

        // @todo grouping === true ?
        if (!(typeof grouping !== 'undefined' && !grouping)) {
            let stacks = retrieveStacks(this.chart, stacking),
                stack: number = (seriesOptions.stack as any) || 0,
                i; // position within the stack

            for (i = 0; i < stacks[stack].series.length; i++) {
                if (stacks[stack].series[i] === this) {
                    break;
                }
            }
            z = (10 * (stacks.totalStacks - stacks[stack].position)) +
                (reversedStacks ? i : -i); // #4369

            // In case when axis is reversed, columns are also reversed inside
            // the group (#3737)
            if (!this.xAxis.reversed) {
                z = (stacks.totalStacks * 10) - z;
            }
        }
        seriesOptions.depth = seriesOptions.depth || 25;
        series.z = series.z || 0;
        seriesOptions.zIndex = z;
    }
});

// eslint-disable-next-line valid-jsdoc
/**
 * @private
 */
function pointAttribs(
    this: ColumnSeries,
    proceed: Function
): SVGAttributes {
    const attr = proceed.apply(this, [].slice.call(arguments, 1));

    if (this.chart.is3d && this.chart.is3d()) {
        // Set the fill color to the fill color to provide a smooth edge
        attr.stroke = this.options.edgeColor || attr.fill;
        attr['stroke-width'] = pick(this.options.edgeWidth, 1); // #4055
    }

    return attr;
}

// eslint-disable-next-line valid-jsdoc
/**
 * In 3D mode, all column-series are rendered in one main group. Because of that
 * we need to apply inactive state on all points.
 * @private
 */
function setState(
    this: ColumnSeries,
    proceed: Function,
    state: unknown,
    inherit: unknown
): void {
    const is3d = this.chart.is3d && this.chart.is3d();

    if (is3d) {
        this.options.inactiveOtherPoints = true;
    }

    proceed.call(this, state, inherit);

    if (is3d) {
        this.options.inactiveOtherPoints = false;
    }
}

// eslint-disable-next-line valid-jsdoc
/**
 * In 3D mode, simple checking for a new shape to animate is not enough.
 * Additionally check if graphic is a group of elements
 * @private
 */
function hasNewShapeType(
    this: ColumnPoint,
    proceed: ColumnPoint['hasNewShapeType'],
    ...args: []
): boolean|undefined {
    return this.series.chart.is3d() ?
        this.graphic && this.graphic.element.nodeName !== 'g' :
        proceed.apply(this, args);
}

wrap(columnProto, 'pointAttribs', pointAttribs);
wrap(columnProto, 'setState', setState);
wrap(columnProto.pointClass.prototype,
    'hasNewShapeType',
    hasNewShapeType
);

if (SeriesRegistry.seriesTypes.columnRange) {
    const columnRangeProto = SeriesRegistry.seriesTypes.columnrange.prototype;
    wrap(columnRangeProto, 'pointAttribs', pointAttribs);
    wrap(columnRangeProto, 'setState', setState);
    wrap(
        columnRangeProto.pointClass.prototype,
        'hasNewShapeType',
        hasNewShapeType
    );
    columnRangeProto.plotGroup = columnProto.plotGroup;
    columnRangeProto.setVisible = columnProto.setVisible;
}

wrap(Series.prototype, 'alignDataLabel', function (
    this: Series,
    proceed: Function,
    point: ColumnPoint,
    dataLabel: SVGElement,
    options: DataLabelOptions,
    alignTo: BBoxObject
): void {
    const chart = this.chart;

    // In 3D we need to pass point.outsidePlot option to the justifyDataLabel
    // method for disabling justifying dataLabels in columns outside plot
    options.outside3dPlot = point.outside3dPlot;

    // Only do this for 3D columns and it's derived series
    if (
        chart.is3d() &&
        this.is('column')
    ) {
        const series = this as ColumnSeries,
            seriesOptions: ColumnSeriesOptions = series.options,
            inside = pick(options.inside, !!series.options.stacking),
            options3d = chart.options.chart.options3d as any,
            xOffset = point.pointWidth / 2 || 0;

        let dLPosition = {
            x: alignTo.x + xOffset,
            y: alignTo.y,
            z: series.z + (seriesOptions as any).depth / 2
        };
        if (chart.inverted) {
            // Inside dataLabels are positioned according to above
            // logic and there is no need to position them using
            // non-3D algorighm (that use alignTo.width)
            if (inside) {
                alignTo.width = 0;
                dLPosition.x += (point.shapeArgs as any).height / 2;
            }
            // When chart is upside down
            // (alpha angle between 180 and 360 degrees)
            // it is needed to add column width to calculated value.
            if (options3d.alpha >= 90 && options3d.alpha <= 270) {
                dLPosition.y += (point.shapeArgs as any).width;
            }
        }
        // dLPosition is recalculated for 3D graphs
        dLPosition = perspective([dLPosition], chart, true, false)[0];

        alignTo.x = dLPosition.x - xOffset;
        // #7103 If point is outside of plotArea, hide data label.
        alignTo.y = point.outside3dPlot ? -9e9 : dLPosition.y;
    }

    proceed.apply(this, [].slice.call(arguments, 1));
});

// Added stackLabels position calculation for 3D charts.
wrap(StackItem.prototype, 'getStackBox', function (
    this: StackItem,
    proceed: Function,
    stackBoxProps: StackBoxProps
): void { // #3946
    const stackBox = proceed.apply(this, [].slice.call(arguments, 1));
    // Only do this for 3D graph
    const stackItem = this,
        chart = this.axis.chart,
        { width: xWidth } = stackBoxProps;

    if (chart.is3d() && stackItem.base) {
        // First element of stackItem.base is an index of base series.
        const baseSeriesInd = +(stackItem.base).split(',')[0];
        const columnSeries = chart.series[baseSeriesInd];
        const options3d = chart.options.chart.options3d as any;


        // Only do this if base series is a column or inherited type,
        // use its barW, z and depth parameters
        // for correct stackLabels position calculation
        if (
            columnSeries &&
            columnSeries instanceof SeriesRegistry.seriesTypes.column
        ) {
            let dLPosition = {
                x: stackBox.x + (chart.inverted ? stackBox.height : xWidth / 2),
                y: stackBox.y,
                z: (columnSeries.options as any).depth / 2
            };

            if (chart.inverted) {
                // Do not use default offset calculation logic
                // for 3D inverted stackLabels.
                stackBox.width = 0;
                // When chart is upside down
                // (alpha angle between 180 and 360 degrees)
                // it is needed to add column width to calculated value.
                if (options3d.alpha >= 90 && options3d.alpha <= 270) {
                    dLPosition.y += xWidth;
                }
            }

            dLPosition = perspective([dLPosition], chart, true, false)[0];
            stackBox.x = dLPosition.x - xWidth / 2;
            stackBox.y = dLPosition.y;
        }
    }

    return stackBox;
});

/*
    @merge v6.2
    @todo
    EXTENSION FOR 3D CYLINDRICAL COLUMNS
    Not supported
*/
/*
let defaultOptions = H.getOptions();
defaultOptions.plotOptions.cylinder =
    merge(defaultOptions.plotOptions.column);
let CylinderSeries = extendClass(seriesTypes.column, {
    type: 'cylinder'
});
seriesTypes.cylinder = CylinderSeries;

wrap(seriesTypes.cylinder.prototype, 'translate', function (proceed) {
    proceed.apply(this, [].slice.call(arguments, 1));

    // Do not do this if the chart is not 3D
    if (!this.chart.is3d()) {
        return;
    }

    let series = this,
        chart = series.chart,
        options = chart.options,
        cylOptions = options.plotOptions.cylinder,
        options3d = options.chart.options3d,
        depth = cylOptions.depth || 0,
        alpha = chart.alpha3d;

    let z = cylOptions.stacking ?
        (this.options.stack || 0) * depth :
        series._i * depth;
    z += depth / 2;

    if (cylOptions.grouping !== false) { z = 0; }

    each(series.data, function (point) {
        let shapeArgs = point.shapeArgs,
            deg2rad = H.deg2rad;
        point.shapeType = 'arc3d';
        shapeArgs.x += depth / 2;
        shapeArgs.z = z;
        shapeArgs.start = 0;
        shapeArgs.end = 2 * PI;
        shapeArgs.r = depth * 0.95;
        shapeArgs.innerR = 0;
        shapeArgs.depth =
            shapeArgs.height * (1 / sin((90 - alpha) * deg2rad)) - z;
        shapeArgs.alpha = 90 - alpha;
        shapeArgs.beta = 0;
    });
});
*/

/* *
 *
 *  Default Export
 *
 * */

export default ColumnSeries;

/* *
 *
 *  API Options
 *
 * */

/**
 * Depth of the columns in a 3D column chart.
 *
 * @type      {number}
 * @default   25
 * @since     4.0
 * @product   highcharts
 * @requires  highcharts-3d
 * @apioption plotOptions.column.depth
 */

/**
 * 3D columns only. The color of the edges. Similar to `borderColor`, except it
 * defaults to the same color as the column.
 *
 * @type      {Highcharts.ColorString}
 * @product   highcharts
 * @requires  highcharts-3d
 * @apioption plotOptions.column.edgeColor
 */

/**
 * 3D columns only. The width of the colored edges.
 *
 * @type      {number}
 * @default   1
 * @product   highcharts
 * @requires  highcharts-3d
 * @apioption plotOptions.column.edgeWidth
 */

/**
 * The spacing between columns on the Z Axis in a 3D chart.
 *
 * @type      {number}
 * @default   1
 * @since     4.0
 * @product   highcharts
 * @requires  highcharts-3d
 * @apioption plotOptions.column.groupZPadding
 */

''; // keeps doclets above in transpiled file
