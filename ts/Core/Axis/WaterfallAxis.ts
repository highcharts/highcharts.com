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

import type Axis from './Axis';
import type Chart from '../Chart/Chart.js';
import type StackingAxis from './Stacking/StackingAxis';
import type SVGLabel from '../Renderer/SVG/SVGLabel';

import StackItem from './Stacking/StackItem.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    objectEach
} = OH;
const { addEvent } = EH;

/* *
 *
 *  Declarations
 *
 * */

declare module './AxisComposition' {
    interface AxisComposition {
        waterfall?: WaterfallAxis['waterfall'];
    }
}

declare module '../../Core/Axis/AxisType' {
    interface AxisTypeRegistry {
        WaterfallAxis: WaterfallAxis;
    }
}

/**
 * @private
 */
interface WaterfallAxis extends StackingAxis {
    waterfall: WaterfallAxis.Composition;
}

/**
 * @private
 */
namespace WaterfallAxis {

    /* *
     *
     *  Interfaces
     *
     * */

    interface StacksObject {
        changed: boolean;
        alreadyChanged?: Array<string>;
        waterfall?: Record<string, StacksItemObject>;
    }

    export interface StacksItemObject {
        absoluteNeg?: number;
        absolutePos?: number;
        connectorThreshold?: number;
        label?: SVGLabel;
        negTotal: number;
        posTotal: number;
        stackState: Array<number>;
        stackTotal: number;
        stateIndex: number;
        threshold: number;
    }

    /* *
     *
     *  Classes
     *
     * */

    /**
     * @private
     */
    export class Composition {

        /* eslint-disable no-invalid-this, valid-jsdoc */

        /* *
         *
         *  Constructors
         *
         * */

        /**
         * @private
         */
        public constructor(axis: WaterfallAxis) {
            this.axis = axis;
            this.stacks = {
                changed: false
            };
        }

        /* *
         *
         *  Properties
         *
         * */

        public axis: WaterfallAxis;
        public dummyStackItem?: StackItem;
        public stacks: StacksObject;

        /* *
         *
         *  Functions
         *
         * */

        /**
         * Calls StackItem.prototype.render function that creates and renders
         * stack total label for each waterfall stack item.
         *
         * @private
         * @function Highcharts.Axis#renderWaterfallStackTotals
         */
        public renderStackTotals(): void {
            const yAxis = this.axis,
                waterfallStacks = yAxis.waterfall.stacks,
                stackTotalGroup = (
                    yAxis.stacking && yAxis.stacking.stackTotalGroup
                ),
                dummyStackItem = new StackItem(
                    yAxis,
                    yAxis.options.stackLabels || {},
                    false,
                    0,
                    void 0
                );

            this.dummyStackItem = dummyStackItem;

            // Render each waterfall stack total
            if (stackTotalGroup) {
                objectEach(waterfallStacks, function (type): void {
                    objectEach(type, function (
                        stackItem: StacksItemObject,
                        key: string
                    ): void {
                        dummyStackItem.total = stackItem.stackTotal;
                        dummyStackItem.x = +key;
                        if (stackItem.label) {
                            dummyStackItem.label = stackItem.label;
                        }

                        StackItem.prototype.render.call(
                            dummyStackItem,
                            stackTotalGroup
                        );
                        stackItem.label = dummyStackItem.label;
                        delete dummyStackItem.label;
                    });
                });
            }
            dummyStackItem.total = null;
        }

    }

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable no-invalid-this, valid-jsdoc */
    /**
     * @private
     */
    export function compose(
        AxisClass: typeof Axis,
        ChartClass: typeof Chart
    ): void {

        addEvent(AxisClass, 'init', onInit);
        addEvent(AxisClass, 'afterBuildStacks', onAfterBuildStacks);
        addEvent(AxisClass, 'afterRender', onAfterRender);
        addEvent(ChartClass, 'beforeRedraw', onBeforeRedraw);

    }
    /**
     * @private
     */
    function onAfterBuildStacks(this: Axis): void {
        const axis = this as WaterfallAxis;
        const stacks = axis.waterfall.stacks;

        if (stacks) {
            stacks.changed = false;
            delete stacks.alreadyChanged;
        }
    }

    /**
     * @private
     */
    function onAfterRender(this: Axis): void {
        const axis = this as WaterfallAxis;
        const stackLabelOptions = axis.options.stackLabels;

        if (stackLabelOptions && stackLabelOptions.enabled &&
            axis.waterfall.stacks) {
            axis.waterfall.renderStackTotals();
        }
    }


    /**
     * @private
     */
    function onBeforeRedraw(this: Chart): void {
        let axes = this.axes as Array<WaterfallAxis>,
            series = this.series,
            i = series.length;

        while (i--) {
            if (series[i].options.stacking) {
                axes.forEach(function (axis: WaterfallAxis): void {
                    if (!axis.isXAxis) {
                        axis.waterfall.stacks.changed = true;
                    }
                });
                i = 0;
            }
        }
    }

    /**
     * @private
     */
    function onInit(this: Axis): void {
        const axis = this;

        if (!axis.waterfall) {
            axis.waterfall = new Composition(axis as WaterfallAxis);
        }
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default WaterfallAxis;
