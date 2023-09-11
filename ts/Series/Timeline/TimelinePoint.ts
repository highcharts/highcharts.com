/* *
 *
 *  Timeline Series.
 *
 *  (c) 2010-2021 Highsoft AS
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
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type TimelineDataLabelOptions from './TimelineDataLabelOptions';
import type TimelinePointOptions from './TimelinePointOptions';
import type TimelineSeries from './TimelineSeries';

import Point from '../../Core/Series/Point.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: Series,
    seriesTypes: {
        pie: {
            prototype: {
                pointClass: PiePoint
            }
        }
    }
} = SeriesRegistry;
import SVGElement from '../../Core/Renderer/SVG/SVGElement.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined, merge, objectEach } = OH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class TimelinePoint extends Series.prototype.pointClass {

    /* *
     *
     *  Properties
     *
     * */

    public label?: string;

    public options: TimelinePointOptions = void 0 as any;

    public series: TimelineSeries = void 0 as any;

    public userDLOptions?: TimelineDataLabelOptions;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public alignConnector(): void {
        let point = this,
            series = point.series,
            dataLabel: SVGElement = point.dataLabel as any,
            connector: SVGElement = dataLabel.connector as any,
            dlOptions = (dataLabel.options || {}) as TimelineDataLabelOptions,
            connectorWidth = dlOptions.connectorWidth || 0,
            chart = point.series.chart,
            bBox = connector.getBBox(),
            plotPos = {
                x: bBox.x + dataLabel.translateX,
                y: bBox.y + dataLabel.translateY
            },
            isVisible;

        // Include a half of connector width in order to run animation,
        // when connectors are aligned to the plot area edge.
        if (chart.inverted) {
            plotPos.y -= connectorWidth / 2;
        } else {
            plotPos.x += connectorWidth / 2;
        }

        isVisible = chart.isInsidePlot(
            plotPos.x, plotPos.y
        );

        connector[isVisible ? 'animate' : 'attr']({
            d: point.getConnectorPath()
        });

        connector.addClass(`highcharts-color-${point.colorIndex}`);

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
        let point = this,
            chart = point.series.chart,
            xAxisLen = point.series.xAxis.len,
            inverted = chart.inverted,
            direction = inverted ? 'x2' : 'y2',
            dl: SVGLabel = point.dataLabel as any,
            targetDLPos = dl.targetPosition,
            coords: Record<string, (number|string)> = {
                x1: point.plotX as any,
                y1: point.plotY as any,
                x2: point.plotX as any,
                y2: isNumber(targetDLPos.y) ? targetDLPos.y : dl.y
            },
            negativeDistance = (
                (dl.alignAttr || dl)[direction[0]] <
                    point.series.yAxis.len / 2
            ),
            path: SVGPath;

        // Recalculate coords when the chart is inverted.
        if (inverted) {
            coords = {
                x1: point.plotY as any,
                y1: xAxisLen - (point.plotX as any),
                x2: targetDLPos.x || dl.x,
                y2: xAxisLen - (point.plotX as any)
            };
        }

        // Subtract data label width or height from expected coordinate so
        // that the connector would start from the appropriate edge.
        if (negativeDistance) {
            coords[direction] += dl[inverted ? 'width' : 'height'];
        }

        // Change coordinates so that they will be relative to data label.
        objectEach(coords, function (
            _coord: (number|string),
            i: string
        ): void {
            (coords[i] as any) -= (dl.alignAttr || dl)[i[0]];
        });

        path = chart.renderer.crispLine(
            [
                ['M', coords.x1, coords.y1],
                ['L', coords.x2, coords.y2]
            ] as SVGPath,
            (dl.options as TimelineDataLabelOptions)?.connectorWidth || 0
        );

        return path;
    }

    public init(): TimelinePoint {
        const point: TimelinePoint = super.init.apply(this, arguments) as any;

        point.name = pick(point.name, 'Event');
        point.y = 1;

        return point;
    }

    public isValid(): boolean {
        return this.options.y !== null;
    }

    public setState(): void {
        const proceed = super.setState;

        // Prevent triggering the setState method on null points.
        if (!this.isNull) {
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
        options = Point.prototype.optionsToObject.call(this, options);
        this.userDLOptions = merge(this.userDLOptions, options.dataLabels);
        return super.applyOptions(options, x);
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Default Export
 *
 * */

export default TimelinePoint;
