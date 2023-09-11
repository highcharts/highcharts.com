/* *
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

import type AnnotationChart from '../AnnotationChart';
import type {
    AnnotationOptions,
    AnnotationTypeOptions
} from '../AnnotationOptions';
import type { AnnotationPointType } from '../AnnotationSeries';
import type Controllable from '../Controllables/Controllable';
import type {
    ControllableLabelOptions,
    ControllableShapeOptions
} from '../Controllables/ControllableOptions';
import type MockPointOptions from '../MockPointOptions';

import Annotation from '../Annotation.js';
import MockPoint from '../MockPoint.js';
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class VerticalLine extends Annotation {

    /* *
     *
     *  Static Functions
     *
     * */

    public static connectorFirstPoint(
        target: Controllable
    ): MockPointOptions {
        const annotation = target.annotation as VerticalLine,
            chart = annotation.chart,
            inverted = chart.inverted,
            point = annotation.points[0],
            left = pick(point.series.yAxis && point.series.yAxis.left, 0),
            top = pick(point.series.yAxis && point.series.yAxis.top, 0),
            offset = annotation.options.typeOptions.label.offset,
            y = MockPoint.pointToPixels(point, true)[inverted ? 'x' : 'y'];

        return {
            x: point.x as any,
            xAxis: point.series.xAxis,
            y: y + offset +
                (inverted ? (left - chart.plotLeft) : (top - chart.plotTop))
        };
    }

    public static connectorSecondPoint(
        target: Controllable
    ): MockPointOptions {
        const annotation = target.annotation as VerticalLine,
            chart = annotation.chart,
            inverted = chart.inverted,
            typeOptions = annotation.options.typeOptions,
            point = annotation.points[0],
            left = pick(point.series.yAxis && point.series.yAxis.left, 0),
            top = pick(point.series.yAxis && point.series.yAxis.top, 0),
            y = MockPoint.pointToPixels(point, true)[inverted ? 'x' : 'y'];

        let yOffset = typeOptions.yOffset;

        if (typeOptions.label.offset < 0) {
            yOffset *= -1;
        }

        return {
            x: point.x as any,
            xAxis: point.series.xAxis,
            y: y + yOffset +
                (inverted ? (left - chart.plotLeft) : (top - chart.plotTop))
        };
    }

    /* *
     *
     *  Functions
     *
     * */

    public getPointsOptions(): Array<MockPointOptions> {
        return [this.options.typeOptions.point];
    }

    public addShapes(): void {
        const typeOptions = this.options.typeOptions,
            connector = this.initShape(
                merge(typeOptions.connector, {
                    type: 'path',
                    points: [
                        VerticalLine.connectorFirstPoint,
                        VerticalLine.connectorSecondPoint
                    ]
                }),
                0
            );

        typeOptions.connector = connector.options;
        this.userOptions.typeOptions.point = typeOptions.point;
    }

    public addLabels(): void {
        const typeOptions = this.options.typeOptions,
            labelOptions = typeOptions.label;

        let x = 0,
            y = labelOptions.offset,
            verticalAlign = (labelOptions.offset as any) < 0 ? 'bottom' : 'top',
            align = 'center';

        if (this.chart.inverted) {
            x = labelOptions.offset as any;
            y = 0;
            verticalAlign = 'middle';
            align = (labelOptions.offset as any) < 0 ? 'right' : 'left';
        }

        const label = (this.initLabel as any)(
            merge(labelOptions, {
                verticalAlign: verticalAlign,
                align: align,
                x: x,
                y: y
            })
        );

        typeOptions.label = label.options;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface VerticalLine {
    defaultOptions: Annotation['defaultOptions'];
    options: VerticalLine.Options;
}

VerticalLine.prototype.defaultOptions = merge(
    Annotation.prototype.defaultOptions,
    /**
     * A vertical line annotation.
     *
     * @sample highcharts/annotations-advanced/vertical-line/
     *         Vertical line
     *
     * @extends      annotations.crookedLine
     * @excluding    labels, shapes, controlPointOptions
     * @product      highstock
     * @optionparent annotations.verticalLine
     */
    {
        typeOptions: {
            /**
             * @ignore
             */
            yOffset: 10,

            /**
             * Label options.
             *
             * @extends annotations.crookedLine.labelOptions
             */
            label: {
                offset: -40,
                point: function (
                    target: Controllable
                ): AnnotationPointType {
                    return target.annotation.points[0];
                } as any,
                allowOverlap: true,
                backgroundColor: 'none',
                borderWidth: 0,
                crop: true,
                overflow: 'none' as any,
                shape: 'rect',
                text: '{y:.2f}'
            },

            /**
             * Connector options.
             *
             * @extends   annotations.crookedLine.shapeOptions
             * @excluding height, r, type, width
             */
            connector: {
                strokeWidth: 1,
                markerEnd: 'arrow'
            }
        }
    }
);

/* *
 *
 *  Class Namespace
 *
 * */

namespace VerticalLine {
    export interface Options extends AnnotationOptions {
        typeOptions: TypeOptions;
    }
    export interface TypeLabelOptions extends ControllableLabelOptions {
        offset: number;
    }
    export interface TypeOptions extends AnnotationTypeOptions {
        connector: Partial<ControllableShapeOptions>;
        label: TypeLabelOptions;
        yOffset: number;
    }
}

/* *
 *
 *  Registry
 *
 * */

declare module './AnnotationType'{
    interface AnnotationTypeRegistry {
        verticalLine: typeof VerticalLine;
    }
}

Annotation.types.verticalLine = VerticalLine;

/* *
 *
 *  Default Export
 *
 * */

export default VerticalLine;
