/* *
 *
 *  (c) 2016 Highsoft AS
 *  Authors: Lars A. V. Cabrera
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

import type {
    AxisLabelFormatterContextObject,
    AxisOptions
} from './AxisOptions';
import type { AxisTypeOptions } from './AxisType';
import type ChartOptions from '../Chart/ChartOptions';
import type ColorType from '../Color/ColorType';
import type Point from '../Series/Point';
import type PositionObject from '../Renderer/PositionObject';
import type SizeObject from '../Renderer/SizeObject';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type TickPositionsArray from './TickPositionsArray';
import type Time from '../Time';

import Axis from './Axis.js';
import Chart from '../Chart/Chart.js';
import H from '../Globals.js';
const { dateFormats } = H;
import Tick from './Tick.js';
import U from '../Utilities.js';
const {
    addEvent,
    defined,
    erase,
    find,
    isArray,
    isNumber,
    merge,
    pick,
    timeUnits,
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisComposition' {
    interface AxisComposition {
        grid?: GridAxisComposition['grid'];
    }
}

declare module './AxisLike' {
    interface AxisLike {
        axisBorder?: SVGElement;
        hiddenLabels: Array<SVGElement>;
        hiddenMarks: Array<SVGElement>;
        rightWall?: SVGElement;
        getMaxLabelDimensions(
            ticks: Record<string, Tick>,
            tickPositions: Array<(number|string)>
        ): SizeObject;
        addExtraBorder(
            path: SVGPath,
        ): SizeObject;
    }
}

declare module './AxisOptions' {
    interface AxisLabelFormatterContextObject {
        point?: Point;
    }
    interface AxisOptions {
        grid?: GridAxisOptions;
        isInternal?: boolean;
    }
}

declare module '../Chart/ChartLike'{
    interface ChartLike {
        marginRight: ChartOptions['marginRight'];
    }
}

declare module './TickLike' {
    interface TickLike {
        slotWidth?: number;
    }
}

declare module './AxisType' {
    interface AxisTypeRegistry {
        GridAxis: GridAxisComposition;
    }
}

export interface GridAxisComposition extends Axis {
    grid: GridAxisAdditions;
    linkedParent?: GridAxisComposition;
}

export interface GridAxisOptions {
    borderColor?: ColorType;
    borderWidth?: number;
    cellHeight?: number;
    columns?: Array<AxisOptions>;
    enabled?: boolean;
}

/* *
 *
 *  Enums
 *
 * */

/**
 * Enum for which side the axis is on. Maps to axis.side.
 * @private
 */
enum GridAxisSide {
    top = 0,
    right = 1,
    bottom = 2,
    left = 3
}

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function argsToArray(args: IArguments): Array<any> {
    return Array.prototype.slice.call(args, 1);
}

/**
 * @private
 */
function isObject(x: unknown): x is object {
    // Always use strict mode
    return U.isObject(x, true);
}

/**
 * @private
 */
function applyGridOptions(axis: Axis): void {
    const options = axis.options;

    // Center-align by default
    /*
    if (!options.labels) {
        options.labels = {};
    }
    */
    options.labels.align = pick(options.labels.align, 'center');

    // @todo: Check against tickLabelPlacement between/on etc

    /* Prevents adding the last tick label if the axis is not a category
       axis.
       Since numeric labels are normally placed at starts and ends of a
       range of value, and this module makes the label point at the value,
       an "extra" label would appear. */
    if (!axis.categories) {
        options.showLastLabel = false;
    }

    // Prevents rotation of labels when squished, as rotating them would not
    // help.
    axis.labelRotation = 0;
    options.labels.rotation = 0;

    // Allow putting ticks closer than their data points.
    options.minTickInterval = 1;
}

/**
 * Extends axis class with grid support.
 * @private
 */
function compose<T extends typeof Axis>(
    AxisClass: T,
    ChartClass: typeof Chart,
    TickClass: typeof Tick
): (T&typeof GridAxis) {

    if (!AxisClass.keepProps.includes('grid')) {
        AxisClass.keepProps.push('grid');

        AxisClass.prototype.getMaxLabelDimensions = getMaxLabelDimensions;

        wrap(AxisClass.prototype, 'unsquish', wrapUnsquish);
        wrap(AxisClass.prototype, 'getOffset', wrapGetOffset);

        // Add event handlers
        addEvent(AxisClass, 'init', onInit);
        addEvent(
            AxisClass,
            'afterGetTitlePosition',
            onAfterGetTitlePosition
        );
        addEvent(AxisClass, 'afterInit', onAfterInit);
        addEvent(AxisClass, 'afterRender', onAfterRender);
        addEvent(
            AxisClass,
            'afterSetAxisTranslation',
            onAfterSetAxisTranslation
        );
        addEvent(AxisClass, 'afterSetOptions', onAfterSetOptions);
        addEvent(AxisClass, 'afterSetOptions', onAfterSetOptions2);
        addEvent(AxisClass, 'afterSetScale', onAfterSetScale);
        addEvent(AxisClass, 'afterTickSize', onAfterTickSize);
        addEvent(AxisClass, 'trimTicks', onTrimTicks);
        addEvent(AxisClass, 'destroy', onDestroy);

        addEvent(ChartClass, 'afterSetChartSize', onChartAfterSetChartSize);

        addEvent(
            TickClass,
            'afterGetLabelPosition',
            onTickAfterGetLabelPosition
        );
        addEvent(TickClass, 'labelFormat', onTickLabelFormat);
    }

    return AxisClass as (T&typeof GridAxis);
}


/**
 * Get the largest label width and height.
 *
 * @private
 * @function Highcharts.Axis#getMaxLabelDimensions
 *
 * @param {Highcharts.Dictionary<Highcharts.Tick>} ticks
 * All the ticks on one axis.
 *
 * @param {Array<number|string>} tickPositions
 * All the tick positions on one axis.
 *
 * @return {Highcharts.SizeObject}
 * Object containing the properties height and width.
 *
 * @todo Move this to the generic axis implementation, as it is used there.
 */
function getMaxLabelDimensions(
    this: Axis,
    ticks: Record<string, Tick>,
    tickPositions: Array<(number|string)>
): SizeObject {
    const dimensions: SizeObject = {
        width: 0,
        height: 0
    };

    tickPositions.forEach(function (pos: (number|string)): void {
        const tick = ticks[pos];

        let labelHeight = 0,
            labelWidth = 0,
            label: SVGElement;

        if (isObject(tick)) {
            label = isObject(tick.label) ? tick.label : ({} as any);

            // Find width and height of label
            labelHeight = label.getBBox ? label.getBBox().height : 0;
            if (label.textStr && !isNumber(label.textPxLength)) {
                label.textPxLength = label.getBBox().width;
            }
            labelWidth = isNumber(label.textPxLength) ?
                // Math.round ensures crisp lines
                Math.round(label.textPxLength) :
                0;

            if (label.textStr) {
                // Set the tickWidth same as the label width after ellipsis
                // applied #10281
                labelWidth = Math.round(label.getBBox().width);
            }
            // Update the result if width and/or height are larger
            dimensions.height = Math.max(labelHeight, dimensions.height);
            dimensions.width = Math.max(labelWidth, dimensions.width);
        }
    });

    // For tree grid, add indentation
    if (
        this.type === 'treegrid' &&
        this.treeGrid &&
        this.treeGrid.mapOfPosToGridNode
    ) {
        const treeDepth = this.treeGrid.mapOfPosToGridNode[-1].height || 0;
        dimensions.width += (
            this.options.labels.indentation *
            (treeDepth - 1)
        );
    }

    return dimensions;
}

/**
 * Handle columns and getOffset.
 * @private
 */
function wrapGetOffset(this: Axis, proceed: Function): void {
    const {
            grid
        } = this,
        // On the left side we handle the columns first because the offset is
        // calculated from the plot area and out
        columnsFirst = this.side === 3;

    if (!columnsFirst) {
        proceed.apply(this);
    }

    if (!grid?.isColumn) {
        let columns = grid?.columns || [];

        if (columnsFirst) {
            columns = columns.slice().reverse();
        }
        columns
            .forEach((column): void => {
                column.getOffset();
            });
    }

    if (columnsFirst) {
        proceed.apply(this);
    }

}

/**
 * @private
 */
function onAfterGetTitlePosition(
    this: Axis,
    e: { titlePosition: PositionObject }
): void {
    const axis = this;
    const options = axis.options;
    const gridOptions = options.grid || {};

    if (gridOptions.enabled === true) {
        // Compute anchor points for each of the title align options
        const {
            axisTitle,
            height: axisHeight,
            horiz,
            left: axisLeft,
            offset,
            opposite,
            options,
            top: axisTop,
            width: axisWidth
        } = axis;
        const tickSize = axis.tickSize();
        const titleWidth = axisTitle?.getBBox().width;
        const xOption = options.title.x;
        const yOption = options.title.y;
        const titleMargin = pick(options.title.margin, horiz ? 5 : 10);
        const titleFontSize = axisTitle ? axis.chart.renderer.fontMetrics(
            axisTitle
        ).f : 0;
        const crispCorr = tickSize ? tickSize[0] / 2 : 0;

        // TODO account for alignment
        // the position in the perpendicular direction of the axis
        const offAxis = (
            (horiz ? axisTop + axisHeight : axisLeft) +
            (horiz ? 1 : -1) * // Horizontal axis reverses the margin
            (opposite ? -1 : 1) * // So does opposite axes
            crispCorr +
            (axis.side === GridAxisSide.bottom ? titleFontSize : 0)
        );

        e.titlePosition.x = horiz ?
            axisLeft - (titleWidth || 0) / 2 - titleMargin + xOption :
            offAxis + (opposite ? axisWidth : 0) + offset + xOption;
        e.titlePosition.y = horiz ?
            (
                offAxis -
                (opposite ? axisHeight : 0) +
                (opposite ? titleFontSize : -titleFontSize) / 2 +
                offset +
                yOption
            ) :
            axisTop - titleMargin + yOption;
    }
}

/**
 * @private
 */
function onAfterInit(this: Axis): void {
    const axis = this as GridAxisComposition;
    const {
        chart,
        options: {
            grid: gridOptions = {}
        },
        userOptions
    } = axis;

    if (gridOptions.enabled) {
        applyGridOptions(axis);
    }

    if (gridOptions.columns) {
        const columns = axis.grid.columns = [] as Array<GridAxisComposition>;

        let columnIndex = axis.grid.columnIndex = 0;

        // Handle columns, each column is a grid axis
        while (++columnIndex < gridOptions.columns.length) {
            const columnOptions = merge(
                userOptions,
                gridOptions.columns[columnIndex],
                {
                    isInternal: true,
                    linkedTo: 0,
                    // Disable by default the scrollbar on the grid axis
                    scrollbar: {
                        enabled: false
                    }
                },
                // Avoid recursion
                {
                    grid: {
                        columns: void 0
                    }
                }
            );

            const column = new Axis(
                axis.chart,
                columnOptions,
                'yAxis'
            ) as GridAxisComposition;
            column.grid.isColumn = true;
            column.grid.columnIndex = columnIndex;

            // Remove column axis from chart axes array, and place it
            // in the columns array.
            erase(chart.axes, column);
            erase(chart[axis.coll] || [], column);
            columns.push(column);
        }
    }
}

/**
 * Draw an extra line on the far side of the outermost axis,
 * creating floor/roof/wall of a grid. And some padding.
 * ```
 * Make this:
 *             (axis.min) __________________________ (axis.max)
 *                           |    |    |    |    |
 * Into this:
 *             (axis.min) __________________________ (axis.max)
 *                        ___|____|____|____|____|__
 * ```
 * @private
 */
function onAfterRender(this: Axis): void {
    const axis = this,
        { axisTitle, grid, options } = axis,
        gridOptions = options.grid || {};

    if (gridOptions.enabled === true) {
        const min = axis.min || 0,
            max = axis.max || 0,
            firstTick = axis.ticks[axis.tickPositions[0]];

        // Adjust the title max width to the column width (#19657)
        if (
            axisTitle &&
            !axis.chart.styledMode &&
            firstTick?.slotWidth &&
            !axis.options.title.style.width
        ) {
            axisTitle.css({ width: `${firstTick.slotWidth}px` });
        }

        // @todo actual label padding (top, bottom, left, right)
        axis.maxLabelDimensions = axis.getMaxLabelDimensions(
            axis.ticks,
            axis.tickPositions
        );

        // Remove right wall before rendering if updating
        if (axis.rightWall) {
            axis.rightWall.destroy();
        }

        /*
        Draw an extra axis line on outer axes
                    >
        Make this:    |______|______|______|___

                    > _________________________
        Into this:    |______|______|______|__|
                                                */

        if (axis.grid?.isOuterAxis() && axis.axisLine) {

            const lineWidth = options.lineWidth;
            if (lineWidth) {
                const linePath = axis.getLinePath(lineWidth),
                    startPoint = linePath[0],
                    endPoint = linePath[1],
                    // Negate distance if top or left axis
                    // Subtract 1px to draw the line at the end of the tick
                    tickLength = (axis.tickSize('tick') || [1])[0],
                    distance = tickLength * ((
                        axis.side === GridAxisSide.top ||
                        axis.side === GridAxisSide.left
                    ) ? -1 : 1);

                // If axis is horizontal, reposition line path vertically
                if (startPoint[0] === 'M' && endPoint[0] === 'L') {
                    if (axis.horiz) {
                        startPoint[2] += distance;
                        endPoint[2] += distance;
                    } else {
                        startPoint[1] += distance;
                        endPoint[1] += distance;
                    }
                }

                // If it doesn't exist, add an upper and lower border
                // for the vertical grid axis.
                if (!axis.horiz && axis.chart.marginRight) {
                    const upperBorderStartPoint = startPoint,
                        upperBorderEndPoint: SVGPath.Segment = [
                            'L',
                            axis.left,
                            startPoint[2] || 0
                        ],
                        upperBorderPath = [
                            upperBorderStartPoint,
                            upperBorderEndPoint
                        ],
                        lowerBorderEndPoint: SVGPath.Segment = [
                            'L',
                            axis.chart.chartWidth - axis.chart.marginRight,
                            axis.toPixels(max + axis.tickmarkOffset)
                        ],
                        lowerBorderStartPoint: SVGPath.Segment = [
                            'M',
                            endPoint[1] || 0,
                            axis.toPixels(max + axis.tickmarkOffset)
                        ],
                        lowerBorderPath = [
                            lowerBorderStartPoint,
                            lowerBorderEndPoint
                        ];

                    if (!axis.grid.upperBorder && min % 1 !== 0) {
                        axis.grid.upperBorder = axis.grid.renderBorder(
                            upperBorderPath
                        );
                    }
                    if (axis.grid.upperBorder) {
                        axis.grid.upperBorder.attr({
                            stroke: options.lineColor,
                            'stroke-width': options.lineWidth
                        });
                        axis.grid.upperBorder.animate({
                            d: upperBorderPath
                        });
                    }

                    if (!axis.grid.lowerBorder && max % 1 !== 0) {
                        axis.grid.lowerBorder = axis.grid.renderBorder(
                            lowerBorderPath
                        );
                    }
                    if (axis.grid.lowerBorder) {
                        axis.grid.lowerBorder.attr({
                            stroke: options.lineColor,
                            'stroke-width': options.lineWidth
                        });
                        axis.grid.lowerBorder.animate({
                            d: lowerBorderPath
                        });
                    }
                }

                // Render an extra line parallel to the existing axes, to
                // close the grid.
                if (!axis.grid.axisLineExtra) {
                    axis.grid.axisLineExtra = axis.grid.renderBorder(
                        linePath
                    );
                } else {
                    axis.grid.axisLineExtra.attr({
                        stroke: options.lineColor,
                        'stroke-width': options.lineWidth
                    });
                    axis.grid.axisLineExtra.animate({
                        d: linePath
                    });
                }

                // Show or hide the line depending on options.showEmpty
                axis.axisLine[axis.showAxis ? 'show' : 'hide']();
            }
        }

        (grid?.columns || []).forEach((column): void => column.render());

        // Manipulate the tick mark visibility
        // based on the axis.max- allows smooth scrolling.
        if (
            !axis.horiz &&
            axis.chart.hasRendered &&
            (axis.scrollbar || axis.linkedParent?.scrollbar) &&
            axis.tickPositions.length
        ) {
            const tickmarkOffset = axis.tickmarkOffset,
                lastTick = axis.tickPositions[
                    axis.tickPositions.length - 1
                ],
                firstTick = axis.tickPositions[0];

            let label: SVGElement|undefined,
                tickMark: SVGElement|undefined;

            while ((label = axis.hiddenLabels.pop()) && label.element) {
                label.show(); // #15453
            }
            while (
                (tickMark = axis.hiddenMarks.pop()) &&
                tickMark.element
            ) {
                tickMark.show(); // #16439
            }

            // Hide/show first tick label.
            label = axis.ticks[firstTick].label;
            if (label) {
                if (min - firstTick > tickmarkOffset) {
                    axis.hiddenLabels.push(label.hide());
                } else {
                    label.show();
                }
            }

            // Hide/show last tick mark/label.
            label = axis.ticks[lastTick].label;
            if (label) {
                if (lastTick - max > tickmarkOffset) {
                    axis.hiddenLabels.push(label.hide());
                } else {
                    label.show();
                }
            }

            const mark = axis.ticks[lastTick].mark;
            if (
                mark &&
                lastTick - max < tickmarkOffset &&
                lastTick - max > 0 && axis.ticks[lastTick].isLast
            ) {
                axis.hiddenMarks.push(mark.hide());
            }
        }
    }
}

/**
 * @private
 */
function onAfterSetAxisTranslation(this: Axis): void {
    const axis = this;
    const tickInfo = axis.tickPositions?.info;
    const options = axis.options;
    const gridOptions = options.grid || {};
    const userLabels = axis.userOptions.labels || {};

    // Fire this only for the Gantt type chart, #14868.
    if (gridOptions.enabled) {
        if (axis.horiz) {
            axis.series.forEach((series): void => {
                series.options.pointRange = 0;
            });

            // Lower level time ticks, like hours or minutes, represent
            // points in time and not ranges. These should be aligned
            // left in the grid cell by default. The same applies to
            // years of higher order.
            if (
                tickInfo &&
                options.dateTimeLabelFormats &&
                options.labels &&
                !defined(userLabels.align) &&
                (
                    (options.dateTimeLabelFormats[tickInfo.unitName] as any)
                        .range === false ||
                    tickInfo.count > 1 // Years
                )
            ) {
                options.labels.align = 'left';

                if (!defined(userLabels.x)) {
                    options.labels.x = 3;
                }
            }
        } else {
            // Don't trim ticks which not in min/max range but
            // they are still in the min/max plus tickInterval.
            if (
                this.type !== 'treegrid' &&
                axis.grid &&
                axis.grid.columns
            ) {
                this.minPointOffset = this.tickInterval;
            }
        }
    }
}

/**
 * Creates a left and right wall on horizontal axes:
 * - Places leftmost tick at the start of the axis, to create a left
 *   wall
 * - Ensures that the rightmost tick is at the end of the axis, to
 *   create a right wall.
 * @private
 */
function onAfterSetOptions(
    this: Axis,
    e: { userOptions: DeepPartial<AxisOptions> }
): void {
    const options = this.options,
        userOptions = e.userOptions,
        gridOptions: GridAxisOptions = (
            (options && isObject(options.grid)) ? (options.grid as any) : {}
        );

    let gridAxisOptions: DeepPartial<AxisTypeOptions>;

    if (gridOptions.enabled === true) {

        // Merge the user options into default grid axis options so
        // that when a user option is set, it takes precedence.
        gridAxisOptions = merge<DeepPartial<AxisTypeOptions>>(true, {

            className: (
                'highcharts-grid-axis ' + (userOptions.className || '')
            ),

            dateTimeLabelFormats: {
                hour: {
                    list: ['%[HM]', '%[H]']
                },
                day: {
                    list: ['%[AeB]', '%[aeb]', '%[E]']
                },
                week: {
                    list: ['Week %W', 'W%W']
                },
                month: {
                    list: ['%[B]', '%[b]', '%o']
                }
            },

            grid: {
                borderWidth: 1
            },

            labels: {
                padding: 2,
                style: {
                    fontSize: '0.9em'
                }
            },

            margin: 0,

            title: {
                text: null,
                reserveSpace: false,
                rotation: 0,
                style: {
                    textOverflow: 'ellipsis'
                }
            },

            // In a grid axis, only allow one unit of certain types,
            // for example we shouldn't have one grid cell spanning
            // two days.
            units: [[
                'millisecond', // Unit name
                [1, 10, 100]
            ], [
                'second',
                [1, 10]
            ], [
                'minute',
                [1, 5, 15]
            ], [
                'hour',
                [1, 6]
            ], [
                'day',
                [1]
            ], [
                'week',
                [1]
            ], [
                'month',
                [1]
            ], [
                'year',
                null
            ]]
        }, userOptions);

        // X-axis specific options
        if (this.coll === 'xAxis') {

            // For linked axes, tickPixelInterval is used only if
            // the tickPositioner below doesn't run or returns
            // undefined (like multiple years)
            if (
                defined(userOptions.linkedTo) &&
                !defined(userOptions.tickPixelInterval)
            ) {
                gridAxisOptions.tickPixelInterval = 350;
            }

            // For the secondary grid axis, use the primary axis'
            // tick intervals and return ticks one level higher.
            if (
                // Check for tick pixel interval in options
                !defined(userOptions.tickPixelInterval) &&

                // Only for linked axes
                defined(userOptions.linkedTo) &&

                !defined(userOptions.tickPositioner) &&
                !defined(userOptions.tickInterval) &&
                !defined(userOptions.units)
            ) {
                gridAxisOptions.tickPositioner = function (
                    min: number,
                    max: number
                ): (TickPositionsArray|undefined) {

                    const parentInfo = this.linkedParent?.tickPositions?.info;

                    if (parentInfo) {
                        const units = (gridAxisOptions.units || []);

                        let unitIdx: (number|undefined),
                            count = 1,
                            unitName:
                            Time.TimeNormalizedObject['unitName'] = 'year';

                        for (let i = 0; i < units.length; i++) {
                            const unit = units[i];
                            if (unit && unit[0] === parentInfo.unitName) {
                                unitIdx = i;
                                break;
                            }
                        }

                        // Get the first allowed count on the next unit.
                        const unit = (
                            isNumber(unitIdx) && units[unitIdx + 1]
                        );
                        if (unit) {
                            unitName = unit[0] || 'year';
                            const counts = unit[1];
                            count = counts?.[0] || 1;

                        // In case the base X axis shows years, make the
                        // secondary axis show ten times the years (#11427)
                        } else if (parentInfo.unitName === 'year') {
                            // `unitName` is 'year'
                            count = parentInfo.count * 10;
                        }

                        const unitRange = timeUnits[unitName];
                        this.tickInterval = unitRange * count;

                        return this.chart.time.getTimeTicks(
                            { unitRange, count, unitName },
                            min,
                            max,
                            this.options.startOfWeek
                        );
                    }
                };
            }

        }

        // Now merge the combined options into the axis options
        merge(true, this.options, gridAxisOptions);

        if (this.horiz) {
            /*               _________________________
            Make this:    ___|_____|_____|_____|__|
                            ^                     ^
                            _________________________
            Into this:    |_____|_____|_____|_____|
                                ^                 ^    */
            options.minPadding = pick(userOptions.minPadding, 0);
            options.maxPadding = pick(userOptions.maxPadding, 0);
        }

        // If borderWidth is set, then use its value for tick and
        // line width.
        if (isNumber((options.grid as any).borderWidth)) {
            options.tickWidth = options.lineWidth =
                gridOptions.borderWidth as any;
        }

    }
}

/**
 * @private
 */
function onAfterSetOptions2(
    this: Axis,
    e: { userOptions?: AxisOptions }
): void {
    const axis = this;
    const userOptions = e.userOptions;
    const gridOptions = userOptions?.grid || {};
    const columns = gridOptions.columns;

    // Add column options to the parent axis. Children has their column options
    // set on init in onGridAxisAfterInit.
    if (gridOptions.enabled && columns) {
        merge(true, axis.options, columns[0]);
    }
}

/**
 * Handle columns and setScale.
 * @private
 */
function onAfterSetScale(this: Axis): void {
    const axis = this as GridAxisComposition;

    (axis.grid.columns || []).forEach((column): void => column.setScale());
}

/**
 * Draw vertical axis ticks extra long to create cell floors and roofs.
 * Overrides the tickLength for vertical axes.
 * @private
 */
function onAfterTickSize(
    this: Axis,
    e: { tickSize?: [number, number] }
): void {
    const {
        horiz,
        maxLabelDimensions,
        options: {
            grid: gridOptions = {}
        }
    } = this;
    if (gridOptions.enabled && maxLabelDimensions) {
        const labelPadding = this.options.labels.distance * 2;
        const distance = horiz ?
            (
                gridOptions.cellHeight ||
                labelPadding + maxLabelDimensions.height
            ) :
            labelPadding + maxLabelDimensions.width;
        if (isArray(e.tickSize)) {
            e.tickSize[0] = distance;
        } else {
            e.tickSize = [distance, 0];
        }
    }
}

/**
 * @private
 */
function onChartAfterSetChartSize(this: Chart): void {
    this.axes.forEach((axis): void => {
        (axis.grid?.columns || []).forEach((column): void => {
            column.setAxisSize();
            column.setAxisTranslation();
        });
    });
}

/**
 * @private
 */
function onDestroy(
    this: Axis,
    e: { keepEvents: boolean }
): void {
    const {
        grid
    } = this as GridAxisComposition;

    (grid.columns || []).forEach(
        (column): void => column.destroy(e.keepEvents)
    );
    grid.columns = void 0;
}

/**
 * Wraps axis init to draw cell walls on vertical axes.
 * @private
 */
function onInit(
    this: Axis,
    e: { userOptions?: DeepPartial<AxisOptions> }
): void {
    const axis = this;
    const userOptions = e.userOptions || {};
    const gridOptions = userOptions.grid || {};

    if (gridOptions.enabled && defined(gridOptions.borderColor)) {
        userOptions.tickColor = userOptions.lineColor = (
            gridOptions.borderColor
        );
    }

    if (!axis.grid) {
        axis.grid = new GridAxisAdditions(axis as GridAxisComposition);
    }

    axis.hiddenLabels = [];
    axis.hiddenMarks = [];
}

/**
 * Center tick labels in cells.
 * @private
 */
function onTickAfterGetLabelPosition(
    this: Tick,
    e: {
        pos: PositionObject;
        tickmarkOffset: number;
        index: number;
    }
): void {
    const tick = this,
        label = tick.label,
        axis = tick.axis,
        reversed = axis.reversed,
        chart = axis.chart,
        options = axis.options,
        gridOptions = options.grid || {},
        labelOpts = axis.options.labels,
        align = labelOpts.align,
        // `verticalAlign` is currently not supported for axis.labels.
        verticalAlign: string = 'middle', // LabelOpts.verticalAlign,
        side = GridAxisSide[axis.side],
        tickmarkOffset = e.tickmarkOffset,
        tickPositions = axis.tickPositions,
        tickPos = tick.pos - tickmarkOffset,
        nextTickPos = (
            isNumber(tickPositions[e.index + 1]) ?
                tickPositions[e.index + 1] - tickmarkOffset :
                (axis.max || 0) + tickmarkOffset
        ),
        tickSize = axis.tickSize('tick'),
        tickWidth = tickSize ? tickSize[0] : 0,
        crispCorr = tickSize ? tickSize[1] / 2 : 0;

    // Only center tick labels in grid axes
    if (gridOptions.enabled === true) {
        let bottom: number,
            top: number,
            left: number,
            right: number;

        // Calculate top and bottom positions of the cell.
        if (side === 'top') {
            bottom = axis.top + axis.offset;
            top = bottom - tickWidth;
        } else if (side === 'bottom') {
            top = chart.chartHeight - axis.bottom + axis.offset;
            bottom = top + tickWidth;
        } else {
            bottom = axis.top + axis.len - (axis.translate(
                reversed ? nextTickPos : tickPos
            ) || 0);
            top = axis.top + axis.len - (axis.translate(
                reversed ? tickPos : nextTickPos
            ) || 0);
        }

        // Calculate left and right positions of the cell.
        if (side === 'right') {
            left = chart.chartWidth - axis.right + axis.offset;
            right = left + tickWidth;
        } else if (side === 'left') {
            right = axis.left + axis.offset;
            left = right - tickWidth;
        } else {
            left = Math.round(axis.left + (axis.translate(
                reversed ? nextTickPos : tickPos
            ) || 0)) - crispCorr;
            right = Math.min( // #15742
                Math.round(axis.left + (axis.translate(
                    reversed ? tickPos : nextTickPos
                ) || 0)) - crispCorr,
                axis.left + axis.len
            );
        }

        tick.slotWidth = right - left;

        // Calculate the positioning of the label based on
        // alignment.
        e.pos.x = (
            align === 'left' ?
                left :
                align === 'right' ?
                    right :
                    left + ((right - left) / 2) // Default to center
        );
        e.pos.y = (
            verticalAlign === 'top' ?
                top :
                verticalAlign === 'bottom' ?
                    bottom :
                    top + ((bottom - top) / 2) // Default to middle
        );

        if (label) {
            const lblMetrics = chart.renderer.fontMetrics(label),
                labelHeight = label.getBBox().height;

            // Adjustment to y position to align the label correctly.
            // Would be better to have a setter or similar for this.
            if (!labelOpts.useHTML) {
                const lines = Math.round(labelHeight / lblMetrics.h);
                e.pos.y += (
                    // Center the label
                    // TODO: why does this actually center the label?
                    ((lblMetrics.b - (lblMetrics.h - lblMetrics.f)) / 2) +
                    // Adjust for height of additional lines.
                    -(((lines - 1) * lblMetrics.h) / 2)
                );
            } else {
                e.pos.y += (
                    // Readjust yCorr in htmlUpdateTransform
                    lblMetrics.b +
                    // Adjust for height of html label
                    -(labelHeight / 2)
                );
            }
        }

        e.pos.x += (axis.horiz && labelOpts.x) || 0;
    }
}

/**
 * @private
 */
function onTickLabelFormat(ctx: AxisLabelFormatterContextObject): void {
    const {
        axis,
        value
    } = ctx;
    if (axis.options.grid?.enabled) {
        const tickPos = axis.tickPositions;
        const series = (
            axis.linkedParent || axis
        ).series[0];
        const isFirst = value === tickPos[0];
        const isLast = value === tickPos[tickPos.length - 1];
        const point: (Point|undefined) =
            series && find((series.options.data || [] as any), function (
                p: Point
            ): boolean {
                return p[axis.isXAxis ? 'x' : 'y'] === value;
            });
        let pointCopy;

        if (point && series.is('gantt')) {
            // For the Gantt set point aliases to the pointCopy
            // to do not change the original point
            pointCopy = merge(point);
            H.seriesTypes.gantt.prototype.pointClass
                .setGanttPointAliases(pointCopy as any, axis.chart);
        }
        // Make additional properties available for the
        // formatter
        ctx.isFirst = isFirst;
        ctx.isLast = isLast;
        ctx.point = pointCopy;
    }
}

/**
 * Makes tick labels which are usually ignored in a linked axis
 * displayed if they are within range of linkedParent.min.
 * ```
 *                        _____________________________
 *                        |   |       |       |       |
 * Make this:             |   |   2   |   3   |   4   |
 *                        |___|_______|_______|_______|
 *                          ^
 *                        _____________________________
 *                        |   |       |       |       |
 * Into this:             | 1 |   2   |   3   |   4   |
 *                        |___|_______|_______|_______|
 *                          ^
 * ```
 * @private
 * @todo Does this function do what the drawing says? Seems to affect
 *       ticks and not the labels directly?
 */
function onTrimTicks(this: Axis): void {
    const axis = this,
        options = axis.options,
        gridOptions = options.grid || {},
        categoryAxis = axis.categories,
        tickPositions = axis.tickPositions,
        firstPos = tickPositions[0],
        secondPos = tickPositions[1],
        lastPos = tickPositions[tickPositions.length - 1],
        beforeLastPos = tickPositions[tickPositions.length - 2],
        linkedMin = axis.linkedParent?.min,
        linkedMax = axis.linkedParent?.max,
        min = linkedMin || axis.min,
        max = linkedMax || axis.max,
        tickInterval = axis.tickInterval,
        startLessThanMin = ( // #19845
            isNumber(min) &&
            min >= firstPos + tickInterval &&
            min < secondPos
        ),
        endMoreThanMin = (
            isNumber(min) &&
            firstPos < min &&
            firstPos + tickInterval > min
        ),
        startLessThanMax = (
            isNumber(max) &&
            lastPos > max &&
            lastPos - tickInterval < max
        ),
        endMoreThanMax = (
            isNumber(max) &&
            max <= lastPos - tickInterval &&
            max > beforeLastPos
        );

    if (
        gridOptions.enabled === true &&
        !categoryAxis &&
        (axis.isXAxis || axis.isLinked)
    ) {
        if (
            (endMoreThanMin || startLessThanMin) && !options.startOnTick
        ) {
            tickPositions[0] = min;
        }

        if ((startLessThanMax || endMoreThanMax) && !options.endOnTick) {
            tickPositions[tickPositions.length - 1] = max;
        }
    }
}

/**
 * Avoid altering tickInterval when reserving space.
 * @private
 */
function wrapUnsquish(
    this: Axis,
    proceed: Function
): number {
    const axis = this;
    const {
        options: {
            grid: gridOptions = {}
        }
    } = axis;

    if (gridOptions.enabled === true && axis.categories) {
        return axis.tickInterval;
    }

    return proceed.apply(axis, argsToArray(arguments));
}

/* *
 *
 *  Class
 *
 * */

/**
 * Additions for grid axes.
 * @private
 * @class
 */
class GridAxisAdditions {

    /* *
    *
    *  Constructors
    *
    * */

    constructor(axis: GridAxisComposition) {
        this.axis = axis;
    }

    /* *
    *
    *  Properties
    *
    * */

    axis: GridAxisComposition;
    axisLineExtra?: SVGElement;
    upperBorder?: SVGElement;
    lowerBorder?: SVGElement;
    columnIndex?: number;
    columns?: Array<GridAxisComposition>;
    isColumn?: boolean;

    /* *
    *
    *  Functions
    *
    * */

    /**
     * Checks if an axis is the outer axis in its dimension. Since
     * axes are placed outwards in order, the axis with the highest
     * index is the outermost axis.
     *
     * Example: If there are multiple x-axes at the top of the chart,
     * this function returns true if the axis supplied is the last
     * of the x-axes.
     *
     * @private
     *
     * @return {boolean}
     * True if the axis is the outermost axis in its dimension; false if
     * not.
     */
    public isOuterAxis(): boolean {
        const axis = this.axis;
        const chart = axis.chart;
        const columnIndex = axis.grid.columnIndex;
        const columns = (
            axis.linkedParent?.grid.columns ||
            axis.grid.columns ||
            []
        );
        const parentAxis = columnIndex ? axis.linkedParent : axis;

        let thisIndex = -1,
            lastIndex = 0;

        // On the left side, when we have columns (not only multiple axes), the
        // main axis is to the left
        if (axis.side === 3 && !chart.inverted && columns.length) {
            return !axis.linkedParent;
        }

        (
            (chart[axis.coll] || []) as Array<Axis>
        ).forEach((otherAxis, index): void => {
            if (
                otherAxis.side === axis.side &&
                !otherAxis.options.isInternal
            ) {
                lastIndex = index;
                if (otherAxis === parentAxis) {
                    // Get the index of the axis in question
                    thisIndex = index;
                }
            }
        });

        return (
            lastIndex === thisIndex &&
            (
                isNumber(columnIndex) ?
                    columns.length === columnIndex :
                    true
            )
        );
    }

    /**
     * Add extra border based on the provided path.
     * @private
     * @param {SVGPath} path
     * The path of the border.
     * @return {Highcharts.SVGElement}
     * Border
     */
    public renderBorder(path: SVGPath): SVGElement {
        const axis = this.axis,
            renderer = axis.chart.renderer,
            options = axis.options,
            extraBorderLine = renderer.path(path)
                .addClass('highcharts-axis-line')
                .add(axis.axisGroup);

        if (!renderer.styledMode) {
            extraBorderLine.attr({
                stroke: options.lineColor,
                'stroke-width': options.lineWidth,
                zIndex: 7
            });
        }
        return extraBorderLine;
    }
}

/* *
 *
 *  Registry
 *
 * */

// First letter of the day of the week, e.g. 'M' for 'Monday'.
dateFormats.E = function (this: Time, timestamp: number): string {
    return this.dateFormat('%a', timestamp, true).charAt(0);
};

// Adds week date format
dateFormats.W = function (this: Time, timestamp: number): string {
    const d = this.toParts(timestamp),
        firstDay = (d[7] + 6) % 7,
        thursday = d.slice(0);

    thursday[2] = d[2] - firstDay + 3;

    const firstThursday = this.toParts(this.makeTime(thursday[0], 0, 1));

    if (firstThursday[7] !== 4) {
        d[1] = 0; // Set month to January
        d[2] = 1 + (11 - firstThursday[7]) % 7;
    }

    const thursdayTS = this.makeTime(thursday[0], thursday[1], thursday[2]),
        firstThursdayTS = this.makeTime(
            firstThursday[0],
            firstThursday[1],
            firstThursday[2]
        );

    return (
        1 +
        Math.floor((thursdayTS - firstThursdayTS) / 604800000)
    ).toString();
};

/* *
 *
 *  Default Export
 *
 * */

const GridAxis = {
    compose
};

export default GridAxis;

/* *
 *
 *  API Options
 *
 * */

/**
 * @productdesc {gantt}
 * For grid axes (like in Gantt charts),
 * it is possible to declare as a list to provide different
 * formats depending on available space.
 *
 * Defaults to:
 * ```js
 * {
 *     hour: { list: ['%H:%M', '%H'] },
 *     day: { list: ['%A, %e. %B', '%a, %e. %b', '%E'] },
 *     week: { list: ['Week %W', 'W%W'] },
 *     month: { list: ['%B', '%b', '%o'] }
 * }
 * ```
 *
 * @sample {gantt} gantt/grid-axis/date-time-label-formats
 *         Gantt chart with custom axis date format.
 *
 * @apioption xAxis.dateTimeLabelFormats
 */

/**
 * Set grid options for the axis labels. Requires Highcharts Gantt.
 *
 * @since     6.2.0
 * @product   gantt
 * @apioption xAxis.grid
 */

/**
 * Enable grid on the axis labels. Defaults to true for Gantt charts.
 *
 * @type      {boolean}
 * @default   true
 * @since     6.2.0
 * @product   gantt
 * @apioption xAxis.grid.enabled
 */

/**
 * Set specific options for each column (or row for horizontal axes) in the
 * grid. Each extra column/row is its own axis, and the axis options can be set
 * here.
 *
 * @sample gantt/demo/left-axis-table
 *         Left axis as a table
 * @sample gantt/demo/treegrid-columns
 *         Collapsible tree grid with columns
 *
 * @type      {Array<Highcharts.XAxisOptions>}
 * @apioption xAxis.grid.columns
 */

/**
 * Set border color for the label grid lines.
 *
 * @type      {Highcharts.ColorString}
 * @default   #e6e6e6
 * @apioption xAxis.grid.borderColor
 */

/**
 * Set border width of the label grid lines.
 *
 * @type      {number}
 * @default   1
 * @apioption xAxis.grid.borderWidth
 */

/**
 * Set cell height for grid axis labels. By default this is calculated from font
 * size. This option only applies to horizontal axes. For vertical axes, check
 * the [#yAxis.staticScale](yAxis.staticScale) option.
 *
 * @sample gantt/grid-axis/cellheight
 *         Gant chart with custom cell height
 * @type      {number}
 * @apioption xAxis.grid.cellHeight
 */

''; // Keeps doclets above in JS file
