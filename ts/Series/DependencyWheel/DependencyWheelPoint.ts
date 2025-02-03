/* *
 *
 *  Dependency wheel module
 *
 *  (c) 2018-2024 Torstein Honsi
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

import type DependencyWheelPointOptions from './DependencyWheelPointOptions';
import type DependencyWheelSeries from './DependencyWheelSeries';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    sankey: { prototype: { pointClass: SankeyPoint } }
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    isNumber,
    wrap
} = U;

/* *
 *
 *  Class
 *
 * */

class DependencyWheelPoint extends SankeyPoint {

    /* *
     *
     *  Properties
     *
     * */

    public angle!: number;

    public fromNode!: DependencyWheelPoint;

    public index!: number;

    public linksFrom!: Array<DependencyWheelPoint>;

    public linksTo!: Array<DependencyWheelPoint>;

    public options!: DependencyWheelPointOptions;

    public series!: DependencyWheelSeries;

    public shapeArgs!: SVGAttributes;

    public toNode!: DependencyWheelPoint;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Return a text path that the data label uses.
     * @private
     */
    public getDataLabelPath(label: SVGLabel): SVGElement {
        const point = this,
            renderer = point.series.chart.renderer,
            shapeArgs = point.shapeArgs,
            angle = point.angle,
            upperHalf = angle < 0 || angle > Math.PI,
            start = shapeArgs.start || 0,
            end = shapeArgs.end || 0,
            r = shapeArgs.r || 0,
            distanceOption = label.options?.distance,
            distance = isNumber(distanceOption) ? distanceOption : 0;

        // First time
        if (!point.dataLabelPath) {
            // Destroy the path with the label
            wrap(label, 'destroy', function (
                this: SVGLabel,
                proceed
            ): undefined {
                if (point.dataLabelPath) {
                    point.dataLabelPath = point.dataLabelPath.destroy();
                }
                return proceed.call(this);
            });

        // Subsequent times
        } else {
            point.dataLabelPath = point.dataLabelPath.destroy();
            delete point.dataLabelPath;
        }

        const measuredWidth = label.add(point.series.dataLabelsGroup)
            .getBBox()
            .width;

        if (
            measuredWidth <
            ((shapeArgs.r || 0) + distance) * (end - start)
        ) {
            // Wide slice, go for circular
            point.dataLabelPath = renderer
                .arc({
                    open: true,
                    longArc: Math.abs(
                        Math.abs(start) - Math.abs(end)
                    ) < Math.PI ? 0 : 1
                })
                .attr({
                    x: shapeArgs.x,
                    y: shapeArgs.y,
                    r: r + distance,
                    start: (upperHalf ? start : end),
                    end: (upperHalf ? end : start),
                    clockwise: +upperHalf
                })
                .add(renderer.defs);
        } else {
            // Slice too narrow for the text, go for radial
            const x = (r + distance / 2) * Math.cos(angle) + (shapeArgs.x || 0),
                y = (r + distance / 2) * Math.sin(angle) + (shapeArgs.y || 0),
                p1 = [Math.round(x), Math.round(y)],
                p2 = [
                    Math.round(x + Math.cos(angle) * measuredWidth),
                    Math.round(y + Math.sin(angle) * measuredWidth)
                ],
                leftHalf = -Math.PI / 2 > angle || angle > Math.PI / 2;

            point.dataLabelPath = renderer.path({
                d: leftHalf ? [
                    ['M', p2[0], p2[1]],
                    ['L', p1[0], p1[1]]
                ] : [
                    ['M', p1[0], p1[1]],
                    ['L', p2[0], p2[1]]
                ]
            }).add(label);
        }

        return point.dataLabelPath;
    }

    public isValid(): boolean {
        // No null points here
        return true;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DependencyWheelPoint;
