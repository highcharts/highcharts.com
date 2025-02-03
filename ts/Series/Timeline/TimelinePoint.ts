/* *
 *
 *  Timeline Series.
 *
 *  (c) 2010-2024 Highsoft AS
 *
 *  Author: Daniel Studencki
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

import type { PointShortOptions, PointOptions } from '../../Core/Series/PointOptions';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type TimelineDataLabelOptions from './TimelineDataLabelOptions';
import type TimelinePointOptions from './TimelinePointOptions';
import type TimelineSeries from './TimelineSeries';

import Point from '../../Core/Series/Point.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    line: { prototype: { pointClass: LinePoint } },
    pie: { prototype: { pointClass: PiePoint } }
} = SeriesRegistry.seriesTypes;
import SVGElement from '../../Core/Renderer/SVG/SVGElement.js';
import U from '../../Core/Utilities.js';
const {
    defined,
    isNumber,
    merge,
    objectEach,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class TimelinePoint extends LinePoint {

    /* *
     *
     *  Properties
     *
     * */

    public label?: string;

    public options!: TimelinePointOptions;

    public series!: TimelineSeries;

    public userDLOptions?: TimelineDataLabelOptions;

    /* *
     *
     *  Functions
     *
     * */

    public alignConnector(): void {
        const point = this,
            series = point.series,
            dataLabel: SVGElement = point.dataLabel as any,
            connector: SVGElement = dataLabel.connector as any,
            dlOptions = (dataLabel.options || {}) as TimelineDataLabelOptions,
            connectorWidth = dlOptions.connectorWidth || 0,
            chart = point.series.chart,
            bBox = connector.getBBox(),
            plotPos = {
                x: bBox.x + (dataLabel.translateX || 0),
                y: bBox.y + (dataLabel.translateY || 0)
            };

        // Include a half of connector width in order to run animation,
        // when connectors are aligned to the plot area edge.
        if (chart.inverted) {
            plotPos.y -= connectorWidth / 2;
        } else {
            plotPos.x += connectorWidth / 2;
        }

        const isVisible = chart.isInsidePlot(
            plotPos.x, plotPos.y
        );

        connector[isVisible ? 'animate' : 'attr']({
            d: point.getConnectorPath()
        });

        connector.addClass('highcharts-color-' + point.colorIndex);

        if (!series.chart.styledMode) {
            connector.attr({
                stroke: dlOptions.connectorColor || point.color,
                'stroke-width': dlOptions.connectorWidth,
                opacity: dataLabel[
                    defined(dataLabel.newOpacity) ? 'newOpacity' : 'opacity'
                ]
            });
        }
    }

    public drawConnector(): void {
        const point = this,
            { dataLabel, series } = point;

        if (dataLabel) {
            if (!dataLabel.connector) {
                dataLabel.connector = series.chart.renderer
                    .path(point.getConnectorPath())
                    .attr({
                        zIndex: -1
                    })
                    .add(dataLabel);
            }

            if (point.series.chart.isInsidePlot( // #10507
                dataLabel.x || 0, dataLabel.y || 0
            )) {
                point.alignConnector();
            }
        }
    }

    public getConnectorPath(): SVGPath {
        const {
                plotX = 0,
                plotY = 0,
                series,
                dataLabel
            } = this,
            chart = series.chart,
            xAxisLen = series.xAxis.len,
            inverted = chart.inverted,
            direction: 'x2'|'y2' = inverted ? 'x2' : 'y2';

        if (dataLabel) {
            const targetDLPos = dataLabel.targetPosition,
                negativeDistance = (
                    (dataLabel.alignAttr || dataLabel)[direction[0]] <
                        series.yAxis.len / 2
                );

            let coords: Record<'x1'|'y1'|'x2'|'y2', (number)> = {
                x1: plotX,
                y1: plotY,
                x2: plotX,
                y2: isNumber(targetDLPos.y) ? targetDLPos.y : dataLabel.y
            };

            // Recalculate coords when the chart is inverted.
            if (inverted) {
                coords = {
                    x1: plotY,
                    y1: xAxisLen - plotX,
                    x2: targetDLPos.x || dataLabel.x,
                    y2: xAxisLen - plotX
                };
            }

            // Subtract data label width or height from expected coordinate so
            // that the connector would start from the appropriate edge.
            if (negativeDistance) {
                coords[direction] += dataLabel[
                    inverted ? 'width' : 'height'
                ] || 0;
            }

            // Change coordinates so that they will be relative to data label.
            objectEach(coords, (_coord, i): void => {
                coords[i] -= (dataLabel.alignAttr || dataLabel)[i[0]];
            });

            return chart.renderer.crispLine(
                [
                    ['M', coords.x1, coords.y1],
                    ['L', coords.x2, coords.y2]
                ],
                (
                    dataLabel.options as TimelineDataLabelOptions
                )?.connectorWidth || 0
            );
        }

        return [];
    }

    public constructor(series: TimelineSeries, options: TimelinePointOptions) {
        super(series, options);

        this.name ??= (
            // If options is null, we are dealing with a null point
            (
                (options && options.y !== null) ||
                !series.options.nullInteraction) &&
                    'Event' ||
                    'Null'
        );

        this.y = 1;
    }

    public isValid(): boolean {
        return (
            this.options.y !== null ||
            this.series.options.nullInteraction ||
            true
        );
    }

    public setState(): void {
        const proceed = super.setState;

        // Prevent triggering the setState method on null points.
        if (!this.isNull || this.series.options.nullInteraction) {
            proceed.apply(this, arguments);
        }
    }

    public setVisible(
        visible: boolean,
        redraw?: boolean
    ): void {
        const point = this,
            series = point.series;

        redraw = pick(redraw, series.options.ignoreHiddenPoint);

        PiePoint.prototype.setVisible.call(point, visible, false);
        // Process new data
        series.processData();

        if (redraw) {
            series.chart.redraw();
        }
    }

    public applyOptions(
        options: (PointOptions|PointShortOptions),
        x?: number
    ): Point {
        const isNull = (
                this.isNull ||
                options === null ||
                (options as PointOptions).y === null
            ),
            series = this.series;

        if (!x && !(options as any)?.x) {
            if (isNumber(this.x)) {
                x = this.x;
            } else if (isNumber(series?.xIncrement) || NaN) {
                x = series.xIncrement || 0;
                series.autoIncrement();
            }
        }

        options = Point.prototype.optionsToObject.call(
            this,
            options ?? (
                (series.options.nullInteraction && { y: 0 }) ||
                    null
            )
        );

        const p = super.applyOptions(options, x);

        this.userDLOptions = merge(this.userDLOptions, options.dataLabels);
        p.isNull = isNull;

        return p;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default TimelinePoint;
