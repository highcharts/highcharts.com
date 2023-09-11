/* *
 *
 *  Solid angular gauge module
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

import type SolidGaugePoint from './SolidGaugePoint';
import type SolidGaugeSeriesOptions from './SolidGaugeSeriesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import BorderRadius from '../../Extensions/BorderRadius.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        gauge: GaugeSeries,
        pie: {
            prototype: pieProto
        }
    }
} = SeriesRegistry;
import SolidGaugeAxis from '../../Core/Axis/SolidGaugeAxis.js';
import SolidGaugeSeriesDefaults from './SolidGaugeSeriesDefaults.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { extend, merge } = OH;
const {
    clamp,
    pick,
    pInt
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * SolidGauge series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.solidgauge
 *
 * @augments Highcarts.Series
 */
class SolidGaugeSeries extends GaugeSeries {

    /* *
     *
     *  Static properties
     *
     * */

    public static defaultOptions: SolidGaugeSeriesOptions = merge(
        GaugeSeries.defaultOptions,
        SolidGaugeSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<SolidGaugePoint> = void 0 as any;
    public points: Array<SolidGaugePoint> = void 0 as any;
    public options: SolidGaugeSeriesOptions = void 0 as any;

    public axis: SolidGaugeAxis = void 0 as any;
    public yAxis: SolidGaugeAxis = void 0 as any;
    public startAngleRad: SolidGaugeSeries['thresholdAngleRad'] = void 0 as any;
    public thresholdAngleRad: number = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    // Extend the translate function to extend the Y axis with the necessary
    // decoration (#5895).
    public translate(): void {
        const axis = this.yAxis;

        SolidGaugeAxis.init(axis);

        // Prepare data classes
        if (!axis.dataClasses && axis.options.dataClasses) {
            axis.initDataClasses(axis.options);
        }
        axis.initStops(axis.options);

        // Generate points and inherit data label position
        GaugeSeries.prototype.translate.call(this);
    }

    // Draw the points where each point is one needle.
    public drawPoints(): void {
        const series = this,
            yAxis = series.yAxis,
            center = yAxis.center,
            options = series.options,
            renderer = series.chart.renderer,
            overshoot = options.overshoot,
            rounded = options.rounded && options.borderRadius === void 0,
            overshootVal = isNumber(overshoot) ?
                overshoot / 180 * Math.PI :
                0;

        let thresholdAngleRad: (number | undefined);

        // Handle the threshold option
        if (isNumber(options.threshold)) {
            thresholdAngleRad = yAxis.startAngleRad + yAxis.translate(
                options.threshold,
                void 0,
                void 0,
                void 0,
                true
            );
        }
        this.thresholdAngleRad = pick(
            thresholdAngleRad, yAxis.startAngleRad
        );

        for (const point of series.points) {
            // #10630 null point should not be draw
            if (!point.isNull) { // condition like in pie chart
                const radius = ((
                        pInt(
                            pick(
                                point.options.radius,
                                options.radius,
                                100 // %
                            )
                        ) * center[2]
                    ) / 200),
                    innerRadius = ((
                        pInt(
                            pick(
                                point.options.innerRadius,
                                options.innerRadius,
                                60 // %
                            )
                        ) * center[2]
                    ) / 200),
                    axisMinAngle = Math.min(
                        yAxis.startAngleRad,
                        yAxis.endAngleRad
                    ),
                    axisMaxAngle = Math.max(
                        yAxis.startAngleRad,
                        yAxis.endAngleRad
                    );

                let graphic = point.graphic,
                    rotation = (yAxis.startAngleRad +
                        yAxis.translate(
                            point.y as any,
                            void 0,
                            void 0,
                            void 0,
                            true
                        )),
                    shapeArgs: (SVGAttributes | undefined),
                    d: (string | SVGPath | undefined),
                    toColor = yAxis.toColor(point.y as any, point);

                if (toColor === 'none') { // #3708
                    toColor = point.color || series.color || 'none';
                }
                if (toColor !== 'none') {
                    point.color = toColor;
                }

                // Handle overshoot and clipping to axis max/min
                rotation = clamp(
                    rotation,
                    axisMinAngle - overshootVal,
                    axisMaxAngle + overshootVal
                );

                // Handle the wrap option
                if (options.wrap === false) {
                    rotation = clamp(rotation, axisMinAngle, axisMaxAngle);
                }

                const angleOfRounding = rounded ?
                        ((radius - innerRadius) / 2) / radius :
                        0,
                    start = Math.min(rotation, series.thresholdAngleRad) -
                        angleOfRounding;
                let end = Math.max(rotation, series.thresholdAngleRad) +
                    angleOfRounding;

                if (end - start > 2 * Math.PI) {
                    end = start + 2 * Math.PI;
                }

                let borderRadius = rounded ? '50%' : 0;
                if (options.borderRadius) {
                    borderRadius = BorderRadius.optionsToObject(
                        options.borderRadius
                    ).radius;
                }

                point.shapeArgs = shapeArgs = {
                    x: center[0],
                    y: center[1],
                    r: radius,
                    innerR: innerRadius,
                    start,
                    end,
                    borderRadius
                };
                point.startR = radius; // For PieSeries.animate

                if (graphic) {
                    d = shapeArgs.d;
                    graphic.animate(extend({ fill: toColor }, shapeArgs));
                    if (d) {
                        shapeArgs.d = d; // animate alters it
                    }
                } else {
                    point.graphic = graphic = renderer.arc(shapeArgs)
                        .attr({
                            fill: toColor,
                            'sweep-flag': 0
                        })
                        .add(series.group);
                }

                if (!series.chart.styledMode) {
                    if (options.linecap !== 'square') {
                        graphic.attr({
                            'stroke-linecap': 'round',
                            'stroke-linejoin': 'round'
                        });
                    }
                    graphic.attr({
                        stroke: options.borderColor || 'none',
                        'stroke-width': options.borderWidth || 0
                    });
                }

                if (graphic) {
                    graphic.addClass(point.getClassName(), true);
                }
            }
        }
    }

    // Extend the pie slice animation by animating from start angle and up.
    public animate(init?: boolean): void {
        if (!init) {
            this.startAngleRad = this.thresholdAngleRad;
            pieProto.animate.call(this, init);
        }
    }
}

/* *
 *
 *  Prototype properties
 *
 * */

interface SolidGaugeSeries {
    pointClass: typeof SolidGaugePoint;
}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        solidgauge: typeof SolidGaugeSeries;
    }
}

SeriesRegistry.registerSeriesType('solidgauge', SolidGaugeSeries);

/* *
 *
 *  Default Export
 *
 * */

export default SolidGaugeSeries;
