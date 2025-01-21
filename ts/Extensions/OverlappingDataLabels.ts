/* *
 *
 *  Highcharts module to hide overlapping data labels.
 *  This module is included in Highcharts.
 *
 *  (c) 2009-2024 Torstein Honsi
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

import type BBoxObject from '../Core/Renderer/BBoxObject';
import type Point from '../Core/Series/Point';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';

import Chart from '../Core/Chart/Chart.js';
import GeometryUtilities from '../Core/Geometry/GeometryUtilities.js';
const { pointInPolygon } = GeometryUtilities;
import U from '../Core/Utilities.js';

const {
    addEvent,
    fireEvent,
    objectEach,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Core/Chart/ChartLike' {
    interface ChartLike {
        hideOverlappingLabels(labels: Array<SVGElement>): void;
    }
}

declare module '../Core/Renderer/SVG/SVGElementLike' {
    interface SVGElementLike {
        /** @requires modules/overlapping-datalabels */
        absoluteBox?: BBoxObject;
    }
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Hide overlapping labels. Labels are moved and faded in and out on zoom to
 * provide a smooth visual impression.
 *
 * @requires modules/overlapping-datalabels
 *
 * @private
 * @function Highcharts.Chart#hideOverlappingLabels
 * @param {Array<Highcharts.SVGElement>} labels
 *        Rendered data labels
 */
function chartHideOverlappingLabels(
    this: Chart,
    labels: Array<SVGElement>
): void {
    const chart = this,
        len = labels.length,
        isIntersectRect = (
            box1: BBoxObject,
            box2: BBoxObject
        ): boolean => !(
            box2.x >= box1.x + box1.width ||
            box2.x + box2.width <= box1.x ||
            box2.y >= box1.y + box1.height ||
            box2.y + box2.height <= box1.y
        ),
        isPolygonOverlap = (
            box1Poly: [number, number][],
            box2Poly: [number, number][]
        ): boolean => {
            for (const p of box1Poly) {
                if (pointInPolygon({ x: p[0], y: p[1] }, box2Poly)) {
                    return true;
                }
            }
            return false;
        };

    /**
     * Get the box with its position inside the chart, as opposed to getBBox
     * that only reports the position relative to the parent.
     */
    function getAbsoluteBox(label: SVGElement): (BBoxObject|undefined) {
        if (label && (!label.alignAttr || label.placed)) {
            const padding = label.box ? 0 : (label.padding || 0),
                pos = label.alignAttr || {
                    x: label.attr('x'),
                    y: label.attr('y')
                },
                bBox = label.getBBox();

            label.width = bBox.width;
            label.height = bBox.height;

            return {
                x: pos.x + (
                    label.parentGroup?.translateX || 0
                ) + padding,
                y: pos.y + (
                    label.parentGroup?.translateY || 0
                ) + padding,
                width: (label.width || 0) - 2 * padding,
                height: (label.height || 0) - 2 * padding,
                polygon: bBox?.polygon
            };
        }
    }

    let label: SVGElement,
        label1: SVGElement,
        label2: SVGElement,
        box1,
        box2,
        isLabelAffected = false;

    for (let i = 0; i < len; i++) {
        label = labels[i];
        if (label) {

            // Mark with initial opacity
            label.oldOpacity = label.opacity;
            label.newOpacity = 1;
            label.absoluteBox = getAbsoluteBox(label);
        }
    }

    // Prevent a situation in a gradually rising slope, that each label will
    // hide the previous one because the previous one always has lower rank.
    labels.sort((a, b): number => (b.labelrank || 0) - (a.labelrank || 0));

    // Detect overlapping labels
    for (let i = 0; i < len; ++i) {
        label1 = labels[i];
        box1 = label1 && label1.absoluteBox;

        const box1Poly = box1?.polygon;

        for (let j = i + 1; j < len; ++j) {
            label2 = labels[j];
            box2 = label2 && label2.absoluteBox;

            let toHide = false;

            if (
                box1 &&
                box2 &&
                label1 !== label2 && // #6465, polar chart with connectEnds
                label1.newOpacity !== 0 &&
                label2.newOpacity !== 0 &&
                // #15863 dataLabels are no longer hidden by translation
                label1.visibility !== 'hidden' &&
                label2.visibility !== 'hidden'
            ) {
                const box2Poly = box2.polygon;

                // If labels have polygons, only evaluate
                // based on polygons
                if (
                    box1Poly &&
                    box2Poly &&
                    box1Poly !== box2Poly
                ) {
                    if (isPolygonOverlap(box1Poly, box2Poly)) {
                        toHide = true;
                    }
                // If there are no polygons, evaluate rectangles coliding
                } else if (isIntersectRect(box1, box2)) {
                    toHide = true;
                }

                if (toHide) {
                    const overlappingLabel = (
                            label1.labelrank < label2.labelrank ?
                                label1 :
                                label2
                        ),
                        labelText = overlappingLabel.text;

                    overlappingLabel.newOpacity = 0;

                    if (labelText?.element.querySelector('textPath')) {
                        labelText.hide();
                    }
                }
            }
        }
    }

    // Hide or show
    for (const label of labels) {
        if (hideOrShow(label, chart)) {
            isLabelAffected = true;
        }
    }

    if (isLabelAffected) {
        fireEvent(chart, 'afterHideAllOverlappingLabels');
    }
}

/** @private */
function compose(
    ChartClass: typeof Chart
): void {
    const chartProto = ChartClass.prototype;

    if (!chartProto.hideOverlappingLabels) {
        chartProto.hideOverlappingLabels = chartHideOverlappingLabels;

        addEvent(ChartClass, 'render', onChartRender);
    }

}

/**
 * Hide or show labels based on opacity.
 *
 * @private
 * @function hideOrShow
 * @param {Highcharts.SVGElement} label
 * The label.
 * @param {Highcharts.Chart} chart
 * The chart that contains the label.
 * @return {boolean}
 * Whether label is affected
 */
function hideOrShow(label: SVGElement, chart: Chart): boolean {
    let complete: (Function|undefined),
        newOpacity: number,
        isLabelAffected = false;

    if (label) {
        newOpacity = label.newOpacity;

        if (label.oldOpacity !== newOpacity) {

            // Toggle data labels
            if (label.hasClass('highcharts-data-label')) {

                // Make sure the label is completely hidden to avoid catching
                // clicks (#4362)
                label[
                    newOpacity ? 'removeClass' : 'addClass'
                ]('highcharts-data-label-hidden');
                complete = function (): void {
                    if (!chart.styledMode) {
                        label.css({
                            pointerEvents: newOpacity ? 'auto' : 'none'
                        });
                    }
                };

                isLabelAffected = true;

                // Animate or set the opacity
                label[label.isOld ? 'animate' : 'attr'](
                    { opacity: newOpacity },
                    void 0,
                    complete
                );
                fireEvent(chart, 'afterHideOverlappingLabel');

            // Toggle other labels, tick labels
            } else {
                label.attr({
                    opacity: newOpacity
                });
            }

        }
        label.isOld = true;
    }

    return isLabelAffected;
}

/**
 * Collect potential overlapping data labels. Stack labels probably don't need
 * to be considered because they are usually accompanied by data labels that lie
 * inside the columns.
 * @private
 */
function onChartRender(
    this: Chart
): void {
    const chart = this;

    let labels: Array<SVGElement|undefined> = [];

    // Consider external label collectors
    for (const collector of (chart.labelCollectors || [])) {
        labels = labels.concat(collector());
    }

    for (const yAxis of (chart.yAxis || [])) {
        if (
            yAxis.stacking &&
            yAxis.options.stackLabels &&
            !yAxis.options.stackLabels.allowOverlap
        ) {
            objectEach(yAxis.stacking.stacks, (stack): void => {
                objectEach(stack, (stackItem): void => {
                    if (stackItem.label) {
                        labels.push(stackItem.label);
                    }
                });
            });
        }
    }

    for (const series of (chart.series || [])) {
        if (series.visible && series.hasDataLabels?.()) { // #3866
            const push = (points: Point[]): void => {
                for (const point of points) {
                    if (point.visible) {
                        (point.dataLabels || []).forEach((label): void => {
                            const options = label.options || {};

                            label.labelrank = pick(
                                options.labelrank,
                                (point as any).labelrank,
                                point.shapeArgs?.height
                            ); // #4118

                            // Allow overlap if the option is explicitly true
                            if (
                                // #13449
                                options.allowOverlap ??

                                // Pie labels outside have a separate placement
                                // logic, skip the overlap logic
                                (
                                    series.is('pie') &&
                                    Number(options.distance) > 0
                                )
                            ) {
                                label.oldOpacity = label.opacity;
                                label.newOpacity = 1;
                                hideOrShow(label, chart);

                            // Do not allow overlap
                            } else {
                                labels.push(label);
                            }
                        });
                    }
                }
            };

            push(series.nodes || []);
            push(series.points);
        }
    }

    this.hideOverlappingLabels(labels as any);
}

/* *
 *
 *  Default Export
 *
 * */

const OverlappingDataLabels = {
    compose
};

export default OverlappingDataLabels;
