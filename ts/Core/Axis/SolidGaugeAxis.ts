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

import type SolidGaugePoint from '../../Series/SolidGauge/SolidGaugePoint';
import type ColorAxis from './Color/ColorAxis';
import type ColorType from '../../Core/Color/ColorType';
import type GradientColor from '../Color/GradientColor';
import type RadialAxis from './RadialAxis';
import Color from '../Color/Color.js';
const {
    parse: color
} = Color;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend,
    merge
} = OH;
/* eslint-disable valid-jsdoc */

/**
 * @private
 */
interface SolidGaugeAxis extends RadialAxis.AxisComposition {
    dataClasses: ColorAxis['dataClasses'];
    options: SolidGaugeAxis.Options;
    stops: ColorAxis['stops'];
    initDataClasses(userOptions: ColorAxis.Options): void;
    initStops(userOptions: ColorAxis.Options): void;
    toColor(
        value: number,
        point: SolidGaugePoint
    ): (ColorType|undefined);
}

/**
 * @private
 */
namespace SolidGaugeAxis {

    /* *
     *
     *  Interfaces
     *
     * */

    export interface Options extends ColorAxis.Options {
        dataClassColor?: ColorAxis.Options['dataClassColor'];
        dataClasses?: ColorAxis.Options['dataClasses'];
        maxColor?: ColorAxis.Options['maxColor'];
        minColor?: ColorAxis.Options['minColor'];
        stops?: ColorAxis.Options['stops'];
    }

    /* *
     *
     *  Constants
     *
     * */

    /**
     * These methods are defined in the ColorAxis object, and copied here.
     * @private
     *
     * @todo
     * If we implement an AMD system we should make ColorAxis a dependency.
     */
    const methods = {

        initDataClasses: function (
            this: SolidGaugeAxis,
            userOptions: ColorAxis.Options
        ): void {
            let chart = this.chart,
                dataClasses: Array<ColorAxis.DataClassesOptions>,
                colorCounter = 0,
                options = this.options;

            this.dataClasses = dataClasses = [];

            (userOptions.dataClasses as any).forEach(function (
                dataClass: ColorAxis.DataClassesOptions,
                i: number
            ): void {
                let colors: (Array<string>|undefined);

                dataClass = merge(dataClass);
                dataClasses.push(dataClass);
                if (!dataClass.color) {
                    if (options.dataClassColor === 'category') {
                        colors = chart.options.colors;
                        dataClass.color = (colors as any)[colorCounter++];
                        // loop back to zero
                        if (colorCounter === (colors as any).length) {
                            colorCounter = 0;
                        }
                    } else {
                        dataClass.color = color(options.minColor).tweenTo(
                            color(options.maxColor),
                            i / ((userOptions.dataClasses as any).length - 1)
                        );
                    }
                }
            });
        },

        initStops: function (
            this: SolidGaugeAxis,
            userOptions: ColorAxis.Options
        ): void {
            this.stops = userOptions.stops || [
                [0, this.options.minColor as any],
                [1, this.options.maxColor as any]
            ];
            this.stops.forEach(function (
                stop: GradientColor['stops'][0]
            ): void {
                stop.color = color(stop[1]);
            });
        },
        // Translate from a value to a color
        toColor: function (
            this: SolidGaugeAxis,
            value: number,
            point: SolidGaugePoint
        ): (ColorType|undefined) {
            let pos: number,
                stops = this.stops,
                from: (number|GradientColor['stops'][0]|undefined),
                to: (number|GradientColor['stops'][0]|undefined),
                color: (ColorType|undefined),
                dataClasses = this.dataClasses,
                dataClass: (ColorAxis.DataClassesOptions|undefined),
                i: (number|undefined);

            if (dataClasses) {
                i = dataClasses.length;
                while (i--) {
                    dataClass = dataClasses[i];
                    from = dataClass.from;
                    to = dataClass.to;
                    if (
                        (typeof from === 'undefined' || value >= from) &&
                        (typeof to === 'undefined' || value <= to)
                    ) {
                        color = dataClass.color;
                        if (point) {
                            point.dataClass = i;
                        }
                        break;
                    }
                }

            } else {

                if (this.logarithmic) {
                    value = this.val2lin(value);
                }
                pos = 1 - ((this.max - value) / (this.max - this.min));
                i = stops.length;
                while (i--) {
                    if (pos > stops[i][0]) {
                        break;
                    }
                }
                from = stops[i] || stops[i + 1];
                to = stops[i + 1] || from;

                // The position within the gradient
                pos = (1 - ((to as any)[0] - pos) / (((to as any)[0] -
                    (from as any)[0]) || 1));

                color = (from as any).color.tweenTo(
                    (to as any).color,
                    pos
                );
            }
            return color;
        }
    };

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    export function init(axis: RadialAxis.AxisComposition): void {
        extend<SolidGaugeAxis|RadialAxis.AxisComposition>(axis, methods);
    }

}

/* *
 *
 *  Default export
 *
 * */

export default SolidGaugeAxis;
