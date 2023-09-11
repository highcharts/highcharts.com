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
import type PieDataLabelOptions from './PieDataLabelOptions';
import type PiePoint from './PiePoint';
import type PieSeries from './PieSeries';
import type Point from '../../Core/Series/Point';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import DataLabel from '../../Core/Series/DataLabel.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import { Palette } from '../../Core/Color/Palettes.js';
import R from '../../Core/Renderer/RendererUtilities.js';
const { distribute } = R;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const { series: Series } = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    arrayMax,
    splat,
    pushUnique
} = AH;
const { defined } = OH;
const {
    clamp,
    pick,
    relativeLength
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Renderer/SVG/SVGElementLike' {
    interface SVGElementLike {
        connector?: SVGElement;
        dataLabelPosition?: DataLabel.LabelPositionObject;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace ColumnDataLabel {

    /* *
     *
     *  Constants
     *
     * */

    const composedMembers: Array<unknown> = [];

    const dataLabelPositioners = {

        // Based on the value computed in Highcharts' distribute algorithm.
        radialDistributionY: function (
            point: PiePoint,
            dataLabel: SVGElement
        ): number {
            return (dataLabel.dataLabelPosition?.top || 0) +
                (point.distributeBox as any).pos;
        },

        // Get the x - use the natural x position for labels near the top and
        // bottom, to prevent the top and botton slice connectors from touching
        // each other on either side. Based on the value computed in Highcharts'
        // distribute algorithm.
        radialDistributionX: function (
            series: PieSeries,
            point: PiePoint,
            y: number,
            naturalY: number,
            dataLabel: SVGElement
        ): number {
            const pos = dataLabel.dataLabelPosition;
            return series.getX(
                y < (pos?.top || 0) + 2 || y > (pos?.bottom || 0) - 2 ?
                    naturalY :
                    y,
                point.half as any,
                point,
                dataLabel
            );
        },

        // The dataLabels.distance determines the x position of the label
        justify: function (
            point: PiePoint,
            dataLabel: SVGElement,
            radius: number,
            seriesCenter: Array<number>
        ): number {
            return seriesCenter[0] + (point.half ? -1 : 1) *
            (radius + (dataLabel.dataLabelPosition?.distance || 0));
        },

        // Left edges of the left-half labels touch the left edge of the plot
        // area. Right edges of the right-half labels touch the right edge of
        // the plot area.
        alignToPlotEdges: function (
            dataLabel: SVGElement,
            half: boolean,
            plotWidth: number,
            plotLeft: number
        ): number {
            const dataLabelWidth = dataLabel.getBBox().width;

            return half ? dataLabelWidth + plotLeft :
                plotWidth - dataLabelWidth - plotLeft;
        },

        // Connectors of each side end in the same x position. Labels are
        // aligned to them. Left edge of the widest left-half label touches the
        // left edge of the plot area. Right edge of the widest right-half label
        // touches the right edge of the plot area.
        alignToConnectors: function (
            points: Array<PiePoint>,
            half: boolean,
            plotWidth: number,
            plotLeft: number
        ): number {
            let maxDataLabelWidth = 0,
                dataLabelWidth;

            // find widest data label
            points.forEach(function (point): void {
                dataLabelWidth = (point.dataLabel as any).getBBox().width;
                if (dataLabelWidth > maxDataLabelWidth) {
                    maxDataLabelWidth = dataLabelWidth;
                }
            });
            return half ? maxDataLabelWidth + plotLeft :
                plotWidth - maxDataLabelWidth - plotLeft;
        }
    };

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /** @private */
    export function compose(PieSeriesClass: typeof PieSeries): void {

        DataLabel.compose(Series);

        if (pushUnique(composedMembers, PieSeriesClass)) {
            const pieProto = PieSeriesClass.prototype;

            pieProto.dataLabelPositioners = dataLabelPositioners;
            pieProto.alignDataLabel = noop;
            pieProto.drawDataLabels = drawDataLabels;
            pieProto.getDataLabelPosition = getDataLabelPosition;
            pieProto.placeDataLabels = placeDataLabels;
            pieProto.verifyDataLabelOverflow = verifyDataLabelOverflow;
        }

    }

    /** @private */
    function getDataLabelPosition(
        this: PieSeries,
        point: PiePoint,
        distance: number
    ): DataLabel.LabelPositionObject {
        const { center, options } = this,
            r = center[2] / 2,
            angle = point.angle || 0,
            cosAngle = Math.cos(angle),
            sinAngle = Math.sin(angle),
            x = center[0] + cosAngle * r,
            y = center[1] + sinAngle * r,
            finalConnectorOffset = Math.min(
                (options.slicedOffset || 0) + (options.borderWidth || 0),
                distance / 5
            ); // #1678
        return {
            natural: {
                // Initial position of the data label - it's utilized for
                // finding the final position for the label
                x: x + cosAngle * distance,
                y: y + sinAngle * distance
            },
            computed: {
                // Used for generating connector path - initialized later in
                // drawDataLabels function x: undefined, y: undefined
            },
            // Left - pie on the left side of the data label
            // Right - pie on the right side of the data label
            // Center - data label overlaps the pie
            alignment: distance < 0 ? 'center' : point.half ? 'right' : 'left',
            connectorPosition: {
                breakAt: { // Used in connectorShapes.fixedOffset
                    x: x + cosAngle * finalConnectorOffset,
                    y: y + sinAngle * finalConnectorOffset
                },
                touchingSliceAt: { // Middle of the arc
                    x,
                    y
                }
            },
            distance
        };
    }

    /**
     * Override the base drawDataLabels method by pie specific functionality
     * @private
     */
    function drawDataLabels(
        this: PieSeries
    ): void {
        const series = this,
            points = series.points,
            chart = series.chart,
            plotWidth = chart.plotWidth,
            plotHeight = chart.plotHeight,
            plotLeft = chart.plotLeft,
            maxWidth = Math.round(chart.chartWidth / 3),
            seriesCenter = series.center,
            radius = seriesCenter[2] / 2,
            centerY = seriesCenter[1],
            halves = [
                [], // Right
                [] // Left
            ] as [Array<PiePoint>, Array<PiePoint>],
            overflow = [0, 0, 0, 0], // Top, right, bottom, left
            dataLabelPositioners = series.dataLabelPositioners;

        let connector,
            dataLabelWidth,
            labelHeight: number,
            maxLabelDistance = 0;

        // Get out if not enabled
        if (!series.visible || !series.hasDataLabels?.()) {
            return;
        }

        // Reset all labels that have been shortened
        points.forEach((point): void => {
            (point.dataLabels || []).forEach((dataLabel): void => {
                if (dataLabel.shortened) {
                    dataLabel
                        .attr({
                            width: 'auto'
                        } as unknown as SVGAttributes).css({
                            width: 'auto',
                            textOverflow: 'clip'
                        });
                    dataLabel.shortened = false;
                }
            });
        });


        // Run parent method
        Series.prototype.drawDataLabels.apply(series);

        points.forEach((point): void => {
            (point.dataLabels || []).forEach((dataLabel, i): void => {

                const r = seriesCenter[2] / 2,
                    dataLabelOptions = dataLabel.options,
                    distance = relativeLength(
                        dataLabelOptions?.distance || 0,
                        r
                    );

                // Arrange points for collision detection
                if (i === 0) {
                    halves[point.half].push(point);
                }

                // Avoid long labels squeezing the pie size too far down
                if (!defined(dataLabelOptions?.style?.width)) {
                    if (dataLabel.getBBox().width > maxWidth) {
                        dataLabel.css({
                            // Use a fraction of the maxWidth to avoid wrapping
                            // close to the end of the string.
                            width: Math.round(maxWidth * 0.7) + 'px'
                        });
                        dataLabel.shortened = true;
                    }
                }

                dataLabel.dataLabelPosition = this.getDataLabelPosition(
                    point,
                    distance
                );
                maxLabelDistance = Math.max(maxLabelDistance, distance);
            });
        });

        /* Loop over the points in each half, starting from the top and bottom
         * of the pie to detect overlapping labels.
         */
        halves.forEach((points, halfIdx): void => {
            const length = points.length,
                positions: Array<R.BoxObject> = [];

            let top,
                bottom,
                size = 0,
                distributionLength;

            if (!length) {
                return;
            }

            // Sort by angle
            series.sortByAngle(points, halfIdx - 0.5);
            // Only do anti-collision when we have dataLabels outside the pie
            // and have connectors. (#856)
            if (maxLabelDistance > 0) {
                top = Math.max(
                    0,
                    centerY - radius - maxLabelDistance
                );
                bottom = Math.min(
                    centerY + radius + maxLabelDistance,
                    chart.plotHeight
                );
                points.forEach((point): void => {
                    // Check if specific points' label is outside the pie
                    (point.dataLabels || []).forEach((dataLabel, i): void => {
                        const labelPosition = dataLabel.dataLabelPosition;
                        if (
                            labelPosition &&
                            labelPosition.distance > 0
                        ) {
                            // The point.top depends on point.labelDistance
                            // value. Used for calculation of y value in getX
                            // method
                            labelPosition.top = Math.max(
                                0,
                                centerY - radius - labelPosition.distance
                            );
                            labelPosition.bottom = Math.min(
                                centerY + radius + labelPosition.distance,
                                chart.plotHeight
                            );
                            size = dataLabel.getBBox().height || 21;

                            point.distributeBox = {
                                target: (
                                    (
                                        dataLabel.dataLabelPosition
                                            ?.natural.y || 0
                                    ) -
                                    labelPosition.top +
                                    size / 2
                                ),
                                size,
                                rank: point.y
                            };

                            positions.push(point.distributeBox);
                        }
                    });
                });
                distributionLength = bottom + size - top;
                distribute(
                    positions,
                    distributionLength,
                    distributionLength / 5
                );
            }

            // Now the used slots are sorted, fill them up sequentially
            points.forEach((point): void => {
                (point.dataLabels || []).forEach((dataLabel): void => {

                    const dataLabelOptions = (
                            dataLabel.options || {}
                        ) as PieDataLabelOptions,
                        distributeBox = point.distributeBox,
                        labelPosition = dataLabel.dataLabelPosition,
                        naturalY = labelPosition?.natural.y || 0,
                        connectorPadding = dataLabelOptions
                            .connectorPadding || 0;

                    let x = 0,
                        y = naturalY,
                        visibility: 'hidden'|'inherit' = 'inherit';


                    if (labelPosition) {
                        if (
                            positions &&
                            defined(distributeBox) &&
                            labelPosition.distance > 0
                        ) {
                            if (typeof distributeBox.pos === 'undefined') {
                                visibility = 'hidden';
                            } else {
                                labelHeight = distributeBox.size;
                                // Find label's y position
                                y = (dataLabelPositioners as any)
                                    .radialDistributionY(point, dataLabel);

                            }
                        }

                        // Find label's x position. The justify option is
                        // undocumented in the API - preserve support for it
                        if ((dataLabelOptions as any).justify) {
                            x = (dataLabelPositioners as any).justify(
                                point,
                                dataLabel,
                                radius,
                                seriesCenter
                            );
                        } else {
                            switch (dataLabelOptions.alignTo) {
                                case 'connectors':
                                    x = (
                                        dataLabelPositioners as any
                                    ).alignToConnectors(
                                        points,
                                        halfIdx as any,
                                        plotWidth,
                                        plotLeft
                                    );
                                    break;
                                case 'plotEdges':
                                    x = (
                                        dataLabelPositioners as any
                                    ).alignToPlotEdges(
                                        dataLabel as any,
                                        halfIdx as any,
                                        plotWidth,
                                        plotLeft
                                    );
                                    break;
                                default:
                                    x = (
                                        dataLabelPositioners as any
                                    ).radialDistributionX(
                                        series,
                                        point,
                                        y,
                                        naturalY,
                                        dataLabel
                                    );
                            }
                        }

                        // Record the placement and visibility
                        labelPosition.attribs = {
                            visibility,
                            align: labelPosition.alignment
                        };

                        labelPosition.posAttribs = {
                            x: x +
                                (dataLabelOptions.x || 0) + // (#12985)
                                (({
                                    left: connectorPadding,
                                    right: -connectorPadding
                                } as any)[labelPosition.alignment] || 0),

                            y: y +
                                (dataLabelOptions.y || 0) - // (#12985)
                                // Vertically center
                                dataLabel.getBBox().height / 2
                        };

                        labelPosition.computed.x = x;
                        labelPosition.computed.y = y;

                        // Detect overflowing data labels
                        if (pick(dataLabelOptions.crop, true)) {
                            dataLabelWidth = dataLabel.getBBox().width;

                            let sideOverflow: number|undefined;

                            // Overflow left
                            if (
                                x - dataLabelWidth < connectorPadding &&
                                halfIdx === 1 // Left half
                            ) {
                                sideOverflow = Math.round(
                                    dataLabelWidth - x + connectorPadding
                                );
                                overflow[3] = Math.max(
                                    sideOverflow,
                                    overflow[3]
                                );

                            // Overflow right
                            } else if (
                                x + dataLabelWidth >
                                    plotWidth - connectorPadding &&
                                halfIdx === 0 // Right half
                            ) {
                                sideOverflow = Math.round(
                                    x +
                                    dataLabelWidth -
                                    plotWidth +
                                    connectorPadding
                                );
                                overflow[1] = Math.max(
                                    sideOverflow,
                                    overflow[1]
                                );
                            }

                            // Overflow top
                            if (y - labelHeight / 2 < 0) {
                                overflow[0] = Math.max(
                                    Math.round(-y + labelHeight / 2),
                                    overflow[0]
                                );

                            // Overflow left
                            } else if (y + labelHeight / 2 > plotHeight) {
                                overflow[2] = Math.max(
                                    Math.round(
                                        y + labelHeight / 2 - plotHeight
                                    ),
                                    overflow[2]
                                );
                            }
                            labelPosition.sideOverflow = sideOverflow;
                        }
                    }
                }); // For each data label of the point
            }); // For each point
        }); // For each half

        // Do not apply the final placement and draw the connectors until we
        // have verified that labels are not spilling over.
        if (arrayMax(overflow) === 0 ||
            (this.verifyDataLabelOverflow as any)(overflow)
        ) {

            // Place the labels in the final position
            (this.placeDataLabels as any)();


            this.points.forEach((point): void => {
                (point.dataLabels || []).forEach((dataLabel): void => {
                    // #8864: every connector can have individual options
                    const {
                            connectorColor,
                            connectorWidth = 1
                        } = (dataLabel.options || {}) as PieDataLabelOptions,
                        labelPosition = dataLabel.dataLabelPosition;

                    // Draw the connector
                    if (connectorWidth) {
                        let isNew;

                        connector = dataLabel.connector;

                        if (labelPosition && labelPosition.distance > 0) {
                            isNew = !connector;

                            if (!connector) {
                                dataLabel.connector = connector = chart.renderer
                                    .path()
                                    .addClass(
                                        'highcharts-data-label-connector ' +
                                        ' highcharts-color-' +
                                        point.colorIndex +
                                        (
                                            point.className ?
                                                ' ' + point.className :
                                                ''
                                        )
                                    )
                                    .add(series.dataLabelsGroup);
                            }

                            if (!chart.styledMode) {
                                connector.attr({
                                    'stroke-width': connectorWidth,
                                    'stroke': (
                                        connectorColor ||
                                        point.color ||
                                        Palette.neutralColor60
                                    )
                                });
                            }

                            connector[isNew ? 'attr' : 'animate']({
                                d: point.getConnectorPath(dataLabel)
                            });
                            connector.attr({
                                visibility: labelPosition.attribs?.visibility
                            });

                        } else if (connector) {
                            dataLabel.connector = connector.destroy();
                        }
                    }
                });
            });
        }
    }

    /**
     * Perform the final placement of the data labels after we have verified
     * that they fall within the plot area.
     * @private
     */
    function placeDataLabels(
        this: PieSeries
    ): void {
        this.points.forEach((point: Point): void => {
            (point.dataLabels || []).forEach((dataLabel): void => {
                const labelPosition = dataLabel.dataLabelPosition;
                if (labelPosition) {

                    // Shorten data labels with ellipsis if they still overflow
                    // after the pie has reached minSize (#223).
                    if (labelPosition.sideOverflow) {
                        dataLabel.css({
                            width: (
                                Math.max(
                                    dataLabel.getBBox().width -
                                        labelPosition.sideOverflow,
                                    0
                                )
                            ) + 'px',
                            textOverflow: (
                                (dataLabel.options?.style || {})
                                    .textOverflow ||
                                'ellipsis'
                            )
                        });
                        dataLabel.shortened = true;
                    }

                    dataLabel.attr(labelPosition.attribs);
                    (dataLabel as any)[
                        dataLabel.moved ? 'animate' : 'attr'
                    ](labelPosition.posAttribs);
                    dataLabel.moved = true;
                } else if (dataLabel) {
                    dataLabel.attr({ y: -9999 });
                }
            });
            // Clear for update
            delete point.distributeBox;
        }, this);
    }

    /**
     * Verify whether the data labels are allowed to draw, or we should run more
     * translation and data label positioning to keep them inside the plot area.
     * Returns true when data labels are ready to draw.
     * @private
     */
    function verifyDataLabelOverflow(
        this: PieSeries,
        overflow: Array<number>
    ): boolean {

        let center = this.center,
            options = this.options,
            centerOption = options.center,
            minSize = options.minSize || 80,
            newSize = minSize,
            // If a size is set, return true and don't try to shrink the pie
            // to fit the labels.
            ret = options.size !== null;

        if (!ret) {
            // Handle horizontal size and center
            if ((centerOption as any)[0] !== null) { // Fixed center
                newSize = Math.max(center[2] -
                    Math.max(overflow[1], overflow[3]), minSize as any);

            } else { // Auto center
                newSize = Math.max(
                    // horizontal overflow
                    center[2] - overflow[1] - overflow[3],
                    minSize as any
                );
                // horizontal center
                center[0] += (overflow[3] - overflow[1]) / 2;
            }

            // Handle vertical size and center
            if ((centerOption as any)[1] !== null) { // Fixed center
                newSize = clamp(
                    newSize,
                    minSize as any,
                    center[2] - Math.max(overflow[0], overflow[2])
                );
            } else { // Auto center
                newSize = clamp(
                    newSize,
                    minSize as any,
                    // vertical overflow
                    center[2] - overflow[0] - overflow[2]
                );
                // vertical center
                center[1] += (overflow[0] - overflow[2]) / 2;
            }

            // If the size must be decreased, we need to run translate and
            // drawDataLabels again
            if (newSize < center[2]) {
                center[2] = newSize;
                center[3] = Math.min( // #3632
                    options.thickness ?
                        Math.max(0, newSize - options.thickness * 2) :
                        Math.max(
                            0, relativeLength(options.innerSize || 0, newSize)
                        ), newSize
                ); // #6647
                this.translate(center);

                if (this.drawDataLabels) {
                    this.drawDataLabels();
                }
            // Else, return true to indicate that the pie and its labels is
            // within the plot area
            } else {
                ret = true;
            }
        }
        return ret;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ColumnDataLabel;
