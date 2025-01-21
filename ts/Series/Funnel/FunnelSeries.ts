/* *
 *
 *  Highcharts funnel module
 *
 *  (c) 2010-2024 Torstein Honsi
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
import type ColorType from '../../Core/Color/ColorType';
import type DataLabel from '../../Core/Series/DataLabel';
import type FunnelDataLabelOptions from './FunnelDataLabelOptions';
import type FunnelPoint from './FunnelPoint';
import type FunnelSeriesOptions from './FunnelSeriesOptions';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import Chart from '../../Core/Chart/Chart.js';
import FunnelSeriesDefaults from './FunnelSeriesDefaults.js';
import H from '../../Core/Globals.js';
const {
    composed,
    noop
} = H;
import BorderRadius from '../../Extensions/BorderRadius.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    column: ColumnSeries,
    pie: PieSeries
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    correctFloat,
    extend,
    fireEvent,
    isArray,
    merge,
    pick,
    pushUnique,
    relativeLength,
    splat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesStateHoverOptions {
        borderColor?: ColorType;
        color?: ColorType;
    }
}

/* *
 *
 *  Constants
 *
 * */

const baseAlignDataLabel = SeriesRegistry.series.prototype.alignDataLabel;

/* *
 *
 *  Functions
 *
 * */

/**
 * Get positions - either an integer or a percentage string must be
 * given.
 * @private
 * @param {number|string|undefined} length
 *        Length
 * @param {number} relativeTo
 *        Relative factor
 * @return {number}
 *         Relative position
 */
function getLength(
    length: (number|string|undefined),
    relativeTo: number
): number {
    return (/%$/).test(length as any) ?
        relativeTo * parseInt(length as any, 10) / 100 :
        parseInt(length as any, 10);
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.funnel
 *
 * @augments Highcharts.Series
 */
class FunnelSeries extends PieSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: FunnelSeriesOptions = merge(
        PieSeries.defaultOptions,
        FunnelSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public centerX?: number;

    public data!: Array<FunnelPoint>;

    public options!: FunnelSeriesOptions;

    public points!: Array<FunnelPoint>;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * @private
     */
    public alignDataLabel(
        point: FunnelPoint,
        dataLabel: SVGLabel,
        options: FunnelDataLabelOptions,
        alignTo: BBoxObject,
        isNew?: boolean
    ): void {
        const series = point.series,
            reversed = series.options.reversed,
            dlBox = point.dlBox || point.shapeArgs,
            { align, verticalAlign } = options,
            padding = splat(options.padding || 0),
            inside =
                ((series.options || {}).dataLabels || {}).inside,
            centerY = series.center[1],
            plotY = point.plotY || 0,
            pointPlotY = (
                reversed ?
                    2 * centerY - plotY :
                    plotY
            ),
            // #16176: Only SVGLabel has height set
            dataLabelHeight = dataLabel.height ?? dataLabel.getBBox().height,
            widthAtLabel = series.getWidthAt(
                pointPlotY - dlBox.height / 2 +
                dataLabelHeight
            ),
            offset = verticalAlign === 'middle' ?
                (dlBox.topWidth - dlBox.bottomWidth) / 4 :
                (widthAtLabel - dlBox.bottomWidth) / 2;

        let y = dlBox.y,
            x = dlBox.x;

        if (verticalAlign === 'middle') {
            y = dlBox.y - dlBox.height / 2 + dataLabelHeight / 2;
        } else if (verticalAlign === 'top') {
            y = dlBox.y - dlBox.height + dataLabelHeight +
                padding[0];
        }

        if (
            verticalAlign === 'top' && !reversed ||
            verticalAlign === 'bottom' && reversed ||
            verticalAlign === 'middle'
        ) {
            if (align === 'right') {
                x = dlBox.x - padding[1 % padding.length] + offset;
            } else if (align === 'left') {
                x = dlBox.x + padding[3 % padding.length] - offset;
            }
        }

        alignTo = {
            x: x,
            y: reversed ? y - dlBox.height : y,
            width: dlBox.bottomWidth,
            height: dlBox.height
        };

        options.verticalAlign = 'bottom';
        if (inside) {
            // If the distance were positive (as default), the overlapping
            // labels logic would skip these labels and they would be allowed
            // to overlap.
            options.distance = void 0;
        }

        // Call the parent method
        if (inside && point.visible) {
            baseAlignDataLabel.call(
                series,
                point,
                dataLabel,
                options,
                alignTo,
                isNew
            );
        }

        if (inside) {
            if (!point.visible && point.dataLabel) {
                // Avoid animation from top
                point.dataLabel.placed = false;
            }

            // If label is inside and we have contrast, set it:
            if (point.contrastColor) {
                dataLabel.css({
                    color: point.contrastColor
                });
            }
        }
    }


    /**
     * Extend the data label method.
     * @private
     */
    public drawDataLabels(): void {
        (
            splat(this.options.dataLabels || {})[0].inside ?
                ColumnSeries :
                PieSeries
        ).prototype.drawDataLabels.call(this);
    }

    /** @private */
    public getDataLabelPosition(
        point: FunnelPoint,
        distance: number
    ): DataLabel.LabelPositionObject {
        const y = point.plotY || 0,
            sign = point.half ? 1 : -1,
            x = this.getX(y, !!point.half, point);

        return {
            distance,
            // Initial position of the data label - it's utilized for finding
            // the final position for the label
            natural: {
                x: 0,
                y
            },
            computed: {
                // Used for generating connector path - initialized later in
                // drawDataLabels function x: undefined, y: undefined
            },
            // Left - funnel on the left side of the data label
            // Right - funnel on the right side of the data label
            alignment: point.half ? 'right' : 'left',
            connectorPosition: {
                breakAt: { // Used in connectorShapes.fixedOffset
                    x: x + (distance - 5) * sign,
                    y
                },
                touchingSliceAt: {
                    x: x + distance * sign,
                    y
                }
            }
        };
    }

    /**
     * Overrides the pie translate method.
     * @private
     */
    public translate(): void {
        const series = this,
            chart = series.chart,
            options = series.options,
            reversed = options.reversed,
            ignoreHiddenPoint = options.ignoreHiddenPoint,
            borderRadiusObject = BorderRadius.optionsToObject(
                options.borderRadius
            ),
            plotWidth = chart.plotWidth,
            plotHeight = chart.plotHeight,
            center: Array<(number|string)> = options.center as any,
            centerX = getLength(center[0], plotWidth),
            centerY = getLength(center[1], plotHeight),
            width = getLength(options.width, plotWidth),
            height = getLength(options.height, plotHeight),
            neckWidth = getLength(options.neckWidth, plotWidth),
            neckHeight = getLength(options.neckHeight, plotHeight),
            neckY = (centerY - height / 2) + height - neckHeight,
            points = series.points,
            borderRadius = relativeLength(
                borderRadiusObject.radius,
                width
            ),
            radiusScope = borderRadiusObject.scope,
            half = (
                (options.dataLabels as any).position === 'left' ?
                    1 :
                    0
            ),
            roundingFactors = (
                angle: number
            ): Record<string, Array<number>> => {
                const tan = Math.tan(angle / 2),
                    cosA = Math.cos(alpha),
                    sinA = Math.sin(alpha);
                let r = borderRadius,
                    t = r / tan,
                    k = Math.tan((Math.PI - angle) / 3.2104);

                if (t > maxT) {
                    t = maxT;
                    r = t * tan;
                }
                k *= r;

                return {
                    dx: [t * cosA, (t - k) * cosA, t - k, t],
                    dy: [t * sinA, (t - k) * sinA, t - k, t]
                        .map((i): number => (reversed ? -i : i))
                };
            };

        let sum = 0,
            cumulative = 0, // Start at top
            tempWidth,
            path: SVGPath,
            fraction,
            alpha: number, // The angle between top and left point's edges
            maxT: number,
            x1: number,
            y1: number,
            x2: number,
            x3: number,
            y3: number,
            x4: number,
            y5: (number|null);

        series.getWidthAt = function (
            this: FunnelSeries,
            y: number
        ): number {
            const top = (centerY - height / 2);

            return (y > neckY || height === neckHeight) ?
                neckWidth :
                neckWidth + (width - neckWidth) *
                    (1 - (y - top) / (height - neckHeight));
        };

        series.getX = function (
            this: FunnelSeries,
            y: number,
            half: boolean,
            point: FunnelPoint
        ): number {
            return centerX + (half ? -1 : 1) *
                ((series.getWidthAt(reversed ? 2 * centerY - y : y) / 2) +
                (
                    point.dataLabel?.dataLabelPosition?.distance ??
                    relativeLength(
                        this.options.dataLabels?.distance || 0,
                        width
                    )
                ));
        };

        // Expose
        series.center = [centerX, centerY, height];
        series.centerX = centerX;

        /*
        Individual point coordinate naming:

        x1,y1 _________________ x2,y1
        \                         /
         \                       /
          \                     /
           \                   /
            \                 /
           x3,y3 _________ x4,y3

        Additional for the base of the neck:

             |               |
             |               |
             |               |
           x3,y5 _________ x4,y5

        */

        // get the total sum
        for (const point of points) {
            if (
                point.y && point.isValid() &&
                (!ignoreHiddenPoint || point.visible !== false)
            ) {
                sum += point.y;
            }
        }

        for (const point of points) {
            // Set start and end positions
            y5 = null;
            fraction = sum ? (point.y as any) / sum : 0;
            y1 = centerY - height / 2 + cumulative * height;
            y3 = y1 + fraction * height;
            tempWidth = series.getWidthAt(y1);
            x1 = centerX - tempWidth / 2;
            x2 = x1 + tempWidth;
            tempWidth = series.getWidthAt(y3);
            x3 = centerX - tempWidth / 2;
            x4 = x3 + tempWidth;

            // The entire point is within the neck
            if (correctFloat(y1) >= neckY) {
                x1 = x3 = centerX - neckWidth / 2;
                x2 = x4 = centerX + neckWidth / 2;

            // The base of the neck
            } else if (y3 > neckY) {
                y5 = y3;

                tempWidth = series.getWidthAt(neckY);
                x3 = centerX - tempWidth / 2;
                x4 = x3 + tempWidth;

                y3 = neckY;
            }

            if (reversed) {
                y1 = 2 * centerY - y1;
                y3 = 2 * centerY - y3;
                if (y5 !== null) {
                    y5 = 2 * centerY - y5;
                }
            }

            if (borderRadius && (
                radiusScope === 'point' ||
                point.index === 0 ||
                point.index === points.length - 1 ||
                y5 !== null
            )) {
                // Creating the path of funnel points with rounded corners
                // (#18839)
                const h = Math.abs(y3 - y1),
                    xSide = x2 - x4,
                    lBase = x4 - x3,
                    lSide = Math.sqrt(xSide * xSide + h * h);

                // If xSide equals zero, return Infinity to avoid dividing
                // by zero (#20319)
                alpha = Math.atan(xSide !== 0 ? h / xSide : Infinity);
                maxT = lSide / 2;
                if (y5 !== null) {
                    maxT = Math.min(maxT, Math.abs(y5 - y3) / 2);
                }
                if (lBase >= 1) {
                    maxT = Math.min(maxT, lBase / 2);
                }

                // Creating a point base
                let f = roundingFactors(alpha);
                if (radiusScope === 'stack' && point.index !== 0) {
                    path = [
                        ['M', x1, y1],
                        ['L', x2, y1]
                    ];
                } else {
                    path = [
                        ['M', x1 + f.dx[0], y1 + f.dy[0]],
                        [
                            'C',
                            x1 + f.dx[1], y1 + f.dy[1],
                            x1 + f.dx[2], y1,
                            x1 + f.dx[3], y1
                        ],
                        ['L', x2 - f.dx[3], y1],
                        [
                            'C',
                            x2 - f.dx[2], y1,
                            x2 - f.dx[1], y1 + f.dy[1],
                            x2 - f.dx[0], y1 + f.dy[0]
                        ]
                    ];
                }

                if (y5 !== null) {
                    // Closure of point with extension
                    const fr = roundingFactors(Math.PI / 2);
                    f = roundingFactors(Math.PI / 2 + alpha);
                    path.push(
                        ['L', x4 + f.dx[0], y3 - f.dy[0]],
                        [
                            'C',
                            x4 + f.dx[1], y3 - f.dy[1],
                            x4, y3 + f.dy[2],
                            x4, y3 + f.dy[3]
                        ]
                    );

                    if (
                        radiusScope === 'stack' &&
                        point.index !== points.length - 1
                    ) {
                        path.push(['L', x4, y5], ['L', x3, y5]);
                    } else {
                        path.push(
                            ['L', x4, y5 - fr.dy[3]],
                            [
                                'C',
                                x4, y5 - fr.dy[2],
                                x4 - fr.dx[2], y5,
                                x4 - fr.dx[3], y5
                            ],
                            ['L', x3 + fr.dx[3], y5],
                            [
                                'C',
                                x3 + fr.dx[2], y5,
                                x3, y5 - fr.dy[2],
                                x3, y5 - fr.dy[3]
                            ]
                        );
                    }

                    path.push(
                        ['L', x3, y3 + f.dy[3]],
                        [
                            'C',
                            x3, y3 + f.dy[2],
                            x3 - f.dx[1], y3 - f.dy[1],
                            x3 - f.dx[0], y3 - f.dy[0]
                        ]
                    );
                } else if (lBase >= 1) {
                    // Closure of point without extension
                    f = roundingFactors(Math.PI - alpha);
                    if (radiusScope === 'stack' && point.index === 0) {
                        path.push(['L', x4, y3], ['L', x3, y3]);
                    } else {
                        path.push(
                            ['L', x4 + f.dx[0], y3 - f.dy[0]],
                            [
                                'C',
                                x4 + f.dx[1], y3 - f.dy[1],
                                x4 - f.dx[2], y3,
                                x4 - f.dx[3], y3
                            ],
                            ['L', x3 + f.dx[3], y3],
                            [
                                'C',
                                x3 + f.dx[2], y3,
                                x3 - f.dx[1], y3 - f.dy[1],
                                x3 - f.dx[0], y3 - f.dy[0]
                            ]
                        );
                    }
                } else {
                    // Creating a rounded tip of the "pyramid"
                    f = roundingFactors(Math.PI - alpha * 2);
                    path.push(
                        ['L', x3 + f.dx[0], y3 - f.dy[0]],
                        [
                            'C',
                            x3 + f.dx[1], y3 - f.dy[1],
                            x3 - f.dx[1], y3 - f.dy[1],
                            x3 - f.dx[0], y3 - f.dy[0]
                        ]
                    );
                }
            } else {
                // Creating the path of funnel points without rounded corners
                path = [
                    ['M', x1, y1],
                    ['L', x2, y1],
                    ['L', x4, y3]
                ];
                if (y5 !== null) {
                    path.push(['L', x4, y5], ['L', x3, y5]);
                }
                path.push(['L', x3, y3]);
            }
            path.push(
                ['Z']
            );


            // Prepare for using shared dr
            point.shapeType = 'path';
            point.shapeArgs = { d: path };


            // For tooltips and data labels
            point.percentage = fraction * 100;
            point.plotX = centerX;
            point.plotY = (y1 + (y5 || y3)) / 2;

            // Placement of tooltips and data labels
            point.tooltipPos = [
                centerX,
                point.plotY
            ];

            point.dlBox = {
                x: x3,
                y: y1,
                topWidth: x2 - x1,
                bottomWidth: x4 - x3,
                height: Math.abs(pick(y5, y3) - y1),
                width: NaN
            };

            // Slice is a noop on funnel points
            point.slice = noop;

            // Mimicking pie data label placement logic
            point.half = half;

            if (
                point.isValid() &&
                (!ignoreHiddenPoint || point.visible !== false)
            ) {
                cumulative += fraction;
            }
        }

        fireEvent(series, 'afterTranslate');
    }

    /**
     * Funnel items don't have angles (#2289).
     * @private
     */
    public sortByAngle(points: Array<FunnelPoint>): void {
        points.sort((a, b): number => ((a.plotY as any) - (b.plotY as any)));
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface FunnelSeries {
    pointClass: typeof FunnelPoint;
    getWidthAt(y: number): number; // Added during translate
    getX(
        y: number,
        half: boolean,
        point: FunnelPoint
    ): number; // Added during translate
}
extend(FunnelSeries.prototype, {
    animate: noop
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace FunnelSeries {

    /* *
     *
     *  Functions
     *
     * */

    /** @private */
    export function compose(
        ChartClass: typeof Chart
    ): void {

        if (pushUnique(composed, 'FunnelSeries')) {
            addEvent(
                ChartClass,
                'afterHideAllOverlappingLabels',
                onChartAfterHideAllOverlappingLabels
            );
        }

    }

    /** @private */
    function onChartAfterHideAllOverlappingLabels(
        this: Chart
    ): void {
        for (const series of this.series) {
            let dataLabelsOptions = series.options && series.options.dataLabels;

            if (isArray(dataLabelsOptions)) {
                dataLabelsOptions = dataLabelsOptions[0];
            }

            if (
                series.is('pie') &&
                series.placeDataLabels &&
                dataLabelsOptions &&
                !dataLabelsOptions.inside
            ) {
                series.placeDataLabels();
            }
        }
    }

}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        funnel: typeof FunnelSeries;
    }
}

SeriesRegistry.registerSeriesType('funnel', FunnelSeries);

/* *
 *
 *  Default Export
 *
 * */

export default FunnelSeries;
