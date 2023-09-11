/**
 *
 *  Events generator for Stock tools
 *
 *  (c) 2009-2021 Paweł Fus
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

import type AxisType from '../../Core/Axis/AxisType';

import D from '../../Core/Defaults.js';
const { setOptions } = D;
import NavigationBindings from '../../Extensions/Annotations/NavigationBindings.js';
import NBU from '../../Extensions/Annotations/NavigationBindingsUtilities.js';
const { getAssignedAxis } = NBU;
import Series from '../../Core/Series/Series.js';
import StockToolsBindings from './StockToolsBindings.js';
import StockToolsDefaults from './StockToolsDefaults.js';
import STU from './StockToolsUtilities.js';
const {
    isNotNavigatorYAxis,
    isPriceIndicatorEnabled
} = STU;
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { isNumber } = TC;
const { defined } = OH;
const {
    correctFloat,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Extensions/Annotations/NavigationBindingsLike' {
    interface NavigationBindingsLike {
        /** @requires modules/stock-tools */
        utils: Partial<typeof STU>;
        /** @requires modules/stock-tools */
        getYAxisPositions(
            yAxes: Array<AxisType>,
            plotHeight: number,
            defaultHeight: number,
            removedYAxisProps?: AxisPositions
        ): YAxisPositions;
        /** @requires modules/stock-tools */
        getYAxisResizers(
            yAxes: Array<AxisType>
        ): Array<NavigationBindingsResizerObject>;
        /** @requires modules/stock-tools */
        recalculateYAxisPositions(
            positions: Array<Record<string, number>>,
            changedSpace: number,
            modifyHeight?: boolean,
            adder?: number
        ): Array<Record<string, number>>;
        /** @requires modules/stock-tools */
        resizeYAxes(
            removedYAxisProps?: AxisPositions
        ): void;
    }
}

export interface AxisPositions {
    top: string;
    height: string;
}

export interface NavigationBindingsResizerObject {
    controlledAxis?: Record<string, Array<string|number>>;
    enabled: boolean;
}

export interface YAxisPositions {
    positions: Array<Record<string, number>>;
    allAxesHeight: number;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose(
    NavigationBindingsClass: typeof NavigationBindings
): void {

    if (pushUnique(composedMembers, NavigationBindingsClass)) {
        const navigationProto = NavigationBindingsClass.prototype;

        // Extends NavigationBindings to support indicators and resizers:
        navigationProto.getYAxisPositions = navigationGetYAxisPositions;
        navigationProto.getYAxisResizers = navigationGetYAxisResizers;
        navigationProto.recalculateYAxisPositions =
            navigationRecalculateYAxisPositions;
        navigationProto.resizeYAxes = navigationResizeYAxes;
        navigationProto.utils = {
            indicatorsWithAxes: STU.indicatorsWithAxes,
            indicatorsWithVolume: STU.indicatorsWithVolume,
            getAssignedAxis,
            isPriceIndicatorEnabled,
            manageIndicators: STU.manageIndicators
        };
    }

    if (pushUnique(composedMembers, setOptions)) {
        setOptions(StockToolsDefaults);
        setOptions({
            navigation: {
                bindings: StockToolsBindings
            }
        });
    }
}

/**
 * Get current positions for all yAxes. If new axis does not have position,
 * returned is default height and last available top place.
 *
 * @private
 * @function Highcharts.NavigationBindings#getYAxisPositions
 *
 * @param {Array<Highcharts.Axis>} yAxes
 *        Array of yAxes available in the chart.
 *
 * @param {number} plotHeight
 *        Available height in the chart.
 *
 * @param {number} defaultHeight
 *        Default height in percents.
 *
 * @param {Highcharts.AxisPositions} removedYAxisProps
 *        Height and top value of the removed yAxis in percents.
 *
 * @return {Highcharts.YAxisPositions}
 *         An object containing an array of calculated positions
 *         in percentages. Format: `{top: Number, height: Number}`
 *         and maximum value of top + height of axes.
 */
function navigationGetYAxisPositions(
    yAxes: Array<AxisType>,
    plotHeight: number,
    defaultHeight: number,
    removedYAxisProps?: AxisPositions
): YAxisPositions {
    let allAxesHeight = 0,
        previousAxisHeight: number,
        removedHeight: number,
        removedTop: number;
    /** @private */
    function isPercentage(prop: number | string | undefined): boolean {
        return defined(prop) && !isNumber(prop) && (prop.match('%') as any);
    }

    if (removedYAxisProps) {
        removedTop = correctFloat(
            (parseFloat(removedYAxisProps.top) / 100)
        );
        removedHeight = correctFloat(
            (parseFloat(removedYAxisProps.height) / 100)
        );
    }

    const positions = yAxes.map((yAxis, index): Record<string, number> => {
        let height = correctFloat(isPercentage(yAxis.options.height) ?
                parseFloat(yAxis.options.height as any) / 100 :
                yAxis.height / plotHeight),
            top = correctFloat(isPercentage(yAxis.options.top) ?
                parseFloat(yAxis.options.top as any) / 100 :
                (yAxis.top - yAxis.chart.plotTop) / plotHeight);

        if (!removedHeight) {
            // New axis' height is NaN so we can check if
            // the axis is newly created this way
            if (!isNumber(height)) {
                // Check if the previous axis is the
                // indicator axis (every indicator inherits from sma)
                height = yAxes[index - 1].series
                    .every((s: Series): boolean => s.is('sma')) ?
                    previousAxisHeight : defaultHeight / 100;
            }

            if (!isNumber(top)) {
                top = allAxesHeight;
            }

            previousAxisHeight = height;

            allAxesHeight = correctFloat(Math.max(
                allAxesHeight,
                (top || 0) + (height || 0)
            ));
        } else {
            // Move all axes which were below the removed axis up.
            if (
                top > removedTop
            ) {
                top -= removedHeight;
            }

            allAxesHeight = Math.max(
                allAxesHeight,
                (top || 0) + (height || 0)
            );
        }

        return {
            height: height * 100,
            top: top * 100
        };
    });

    return { positions, allAxesHeight };
}

/**
 * Get current resize options for each yAxis. Note that each resize is
 * linked to the next axis, except the last one which shouldn't affect
 * axes in the navigator. Because indicator can be removed with it's yAxis
 * in the middle of yAxis array, we need to bind closest yAxes back.
 *
 * @private
 * @function Highcharts.NavigationBindings#getYAxisResizers
 *
 * @param {Array<Highcharts.Axis>} yAxes
 *        Array of yAxes available in the chart
 *
 * @return {Array<object>}
 *         An array of resizer options.
 *         Format: `{enabled: Boolean, controlledAxis: { next: [String]}}`
 */
function navigationGetYAxisResizers(
    yAxes: Array<AxisType>
): Array<NavigationBindingsResizerObject> {
    const resizers: Array<NavigationBindingsResizerObject> = [];

    yAxes.forEach(function (_yAxis: AxisType, index: number): void {
        const nextYAxis = yAxes[index + 1];

        // We have next axis, bind them:
        if (nextYAxis) {
            resizers[index] = {
                enabled: true,
                controlledAxis: {
                    next: [
                        pick(
                            nextYAxis.options.id,
                            nextYAxis.index
                        )
                    ]
                }
            };
        } else {
            // Remove binding:
            resizers[index] = {
                enabled: false
            };
        }
    });

    return resizers;
}

/**
 * Utility to modify calculated positions according to the remaining/needed
 * space. Later, these positions are used in `yAxis.update({ top, height })`
 *
 * @private
 * @function Highcharts.NavigationBindings#recalculateYAxisPositions
 * @param {Array<Highcharts.Dictionary<number>>} positions
 * Default positions of all yAxes.
 * @param {number} changedSpace
 * How much space should be added or removed.
 * @param {boolean} modifyHeight
 * Update only `top` or both `top` and `height`.
 * @param {number} adder
 * `-1` or `1`, to determine whether we should add or remove space.
 *
 * @return {Array<object>}
 *         Modified positions,
 */
function navigationRecalculateYAxisPositions(
    positions: Array<Record<string, number>>,
    changedSpace: number,
    modifyHeight?: boolean,
    adder?: number
): Array<Record<string, number>> {
    positions.forEach(function (
        position: Record<string, number>,
        index: number
    ): void {
        const prevPosition = positions[index - 1];

        position.top = !prevPosition ? 0 :
            correctFloat(prevPosition.height + prevPosition.top);

        if (modifyHeight) {
            position.height = correctFloat(
                position.height + (adder as any) * changedSpace
            );
        }
    });

    return positions;
}

/**
 * Resize all yAxes (except navigator) to fit the plotting height. Method
 * checks if new axis is added, if the new axis will fit under previous
 * axes it is placed there. If not, current plot area is scaled
 * to make room for new axis.
 *
 * If axis is removed, the current plot area streaches to fit into 100%
 * of the plot area.
 *
 * @private
 */
function navigationResizeYAxes(
    this: NavigationBindings,
    removedYAxisProps?: AxisPositions
): void {
    // The height of the new axis before rescalling. In %, but as a number.
    const defaultHeight = 20;
    const chart = this.chart,
        // Only non-navigator axes
        yAxes = chart.yAxis.filter(isNotNavigatorYAxis),
        plotHeight = chart.plotHeight,
        // Gather current heights (in %)
        { positions, allAxesHeight } = this.getYAxisPositions(
            yAxes,
            plotHeight,
            defaultHeight,
            removedYAxisProps
        ),
        resizers = this.getYAxisResizers(yAxes);

    // check if the axis is being either added or removed and
    // if the new indicator axis will fit under existing axes.
    // if so, there is no need to scale them.
    if (
        !removedYAxisProps &&
        allAxesHeight <= correctFloat(0.8 + defaultHeight / 100)
    ) {
        positions[positions.length - 1] = {
            height: defaultHeight,
            top: correctFloat(allAxesHeight * 100 - defaultHeight)
        };
    } else {
        positions.forEach(function (
            position: Record<string, number>
        ): void {
            position.height = (
                position.height / (allAxesHeight * 100)
            ) * 100;
            position.top = (position.top / (allAxesHeight * 100)) * 100;
        });
    }

    positions.forEach(function (
        position: Record<string, number>, index: number
    ): void {
        yAxes[index].update({
            height: position.height + '%',
            top: position.top + '%',
            resize: resizers[index],
            offset: 0
        }, false);
    });
}

/* *
 *
 *  Default Export
 *
 * */

const StockTools = {
    compose
};

export default StockTools;
