/* *
 *
 *  (c) 2009-2021 Highsoft, Black Label
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

import type {
    AnnotationOptions,
    ChartOptions
} from './AnnotationOptions';
import type AnnotationSeries from './AnnotationSeries';
import type Chart from '../../Core/Chart/Chart';
import type NavigationBindings from './NavigationBindings';
import type Pointer from '../../Core/Pointer';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import Annotation from './Annotation.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    erase,
    find,
    pushUnique
} = AH;
const { addEvent, fireEvent } = EH;
const {
    pick,
    wrap
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare class AnnotationChart extends Chart {
    annotations: Array<Annotation>;
    controlPointsGroup: SVGElement;
    navigationBindings: NavigationBindings;
    options: ChartOptions;
    plotBoxClip: SVGElement;
    series: Array<AnnotationSeries>;
    addAnnotation(
        userOptions: AnnotationOptions,
        redraw?: boolean
    ): Annotation;
    drawAnnotations(): void;
    initAnnotation(userOptions: AnnotationOptions): Annotation;
    removeAnnotation(idOrAnnotation: (number|string|Annotation)): void;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * Add an annotation to the chart after render time.
 *
 * @sample highcharts/annotations/add-annotation/
 *         Add annotation
 *
 * @function Highcharts.Chart#addAnnotation
 *
 * @param  {Highcharts.AnnotationsOptions} options
 *         The annotation options for the new, detailed annotation.
 *
 * @param {boolean} [redraw]
 *
 * @return {Highcharts.Annotation}
 *         The newly generated annotation.
 */
function chartAddAnnotation(
    this: AnnotationChart,
    userOptions: AnnotationOptions,
    redraw?: boolean
): Annotation {
    const annotation = this.initAnnotation(userOptions);

    this.options.annotations.push(annotation.options);

    if (pick(redraw, true)) {
        annotation.redraw();
        annotation.graphic.attr({
            opacity: 1
        });
    }

    return annotation;
}

/**
 * @private
 */
function chartCallback(
    this: Chart
): void {
    const chart = this as AnnotationChart;

    chart.plotBoxClip = this.renderer.clipRect(this.plotBox);

    chart.controlPointsGroup = chart.renderer
        .g('control-points')
        .attr({ zIndex: 99 })
        .clip(chart.plotBoxClip)
        .add();

    chart.options.annotations.forEach((annotationOptions, i): void => {
        if (
            // Verify that it has not been previously added in a responsive rule
            !chart.annotations.some((annotation): boolean =>
                annotation.options === annotationOptions
            )
        ) {
            const annotation = chart.initAnnotation(annotationOptions);

            chart.options.annotations[i] = annotation.options;
        }
    });

    chart.drawAnnotations();
    addEvent(chart, 'redraw', chart.drawAnnotations);
    addEvent(chart, 'destroy', function (): void {
        chart.plotBoxClip.destroy();
        chart.controlPointsGroup.destroy();
    });
    addEvent(chart, 'exportData', function (this, event: any): void {
        const annotations = chart.annotations,
            csvColumnHeaderFormatter = ((
                this.options.exporting &&
                this.options.exporting.csv) ||
                {}).columnHeaderFormatter,
            // If second row doesn't have xValues
            // then it is a title row thus multiple level header is in use.
            multiLevelHeaders = !event.dataRows[1].xValues,
            annotationHeader = (
                chart.options.lang &&
                chart.options.lang.exportData &&
                chart.options.lang.exportData.annotationHeader
            ),
            columnHeaderFormatter = function (index: any): any {
                let s;
                if (csvColumnHeaderFormatter) {
                    s = csvColumnHeaderFormatter(index);
                    if (s !== false) {
                        return s;
                    }
                }

                s = annotationHeader + ' ' + index;

                if (multiLevelHeaders) {
                    return {
                        columnTitle: s,
                        topLevelColumnTitle: s
                    };
                }

                return s;
            },
            startRowLength = event.dataRows[0].length,
            annotationSeparator = (
                chart.options.exporting &&
                chart.options.exporting.csv &&
                chart.options.exporting.csv.annotations &&
                chart.options.exporting.csv.annotations.itemDelimiter
            ),
            joinAnnotations = (
                chart.options.exporting &&
                chart.options.exporting.csv &&
                chart.options.exporting.csv.annotations &&
                chart.options.exporting.csv.annotations.join
            );

        annotations.forEach((annotation): void => {

            if (
                annotation.options.labelOptions &&
                annotation.options.labelOptions.includeInDataExport
            ) {

                annotation.labels.forEach((label): void => {
                    if (label.options.text) {
                        const annotationText = label.options.text;

                        label.points.forEach((points): void => {
                            const annotationX = points.x,
                                xAxisIndex = points.series.xAxis ?
                                    points.series.xAxis.index :
                                    -1;
                            let wasAdded = false;

                            // Annotation not connected to any xAxis -
                            // add new row.
                            if (xAxisIndex === -1) {
                                const n = event.dataRows[0].length,
                                    newRow: any = new Array(n);

                                for (let i = 0; i < n; ++i) {
                                    newRow[i] = '';
                                }
                                newRow.push(annotationText);
                                newRow.xValues = [];
                                newRow.xValues[xAxisIndex] = annotationX;
                                event.dataRows.push(newRow);
                                wasAdded = true;
                            }

                            // Annotation placed on a exported data point
                            // - add new column
                            if (!wasAdded) {
                                event.dataRows.forEach((row: any): void => {
                                    if (
                                        !wasAdded &&
                                        row.xValues &&
                                        xAxisIndex !== void 0 &&
                                        annotationX === row.xValues[xAxisIndex]
                                    ) {
                                        if (
                                            joinAnnotations &&
                                            row.length > startRowLength
                                        ) {
                                            row[row.length - 1] += (
                                                annotationSeparator +
                                                annotationText
                                            );
                                        } else {
                                            row.push(annotationText);
                                        }
                                        wasAdded = true;
                                    }
                                });
                            }

                            // Annotation not placed on any exported data point,
                            // but connected to the xAxis - add new row
                            if (!wasAdded) {
                                const n = event.dataRows[0].length,
                                    newRow: any = new Array(n);

                                for (let i = 0; i < n; ++i) {
                                    newRow[i] = '';
                                }
                                newRow[0] = annotationX;
                                newRow.push(annotationText);
                                newRow.xValues = [];

                                if (xAxisIndex !== void 0) {
                                    newRow.xValues[xAxisIndex] = annotationX;
                                }
                                event.dataRows.push(newRow);
                            }
                        });
                    }
                });
            }
        });

        let maxRowLen = 0;

        event.dataRows.forEach((row: any): void => {
            maxRowLen = Math.max(maxRowLen, row.length);
        });

        const newRows = maxRowLen - event.dataRows[0].length;

        for (let i = 0; i < newRows; i++) {
            const header = columnHeaderFormatter(i + 1);

            if (multiLevelHeaders) {
                event.dataRows[0].push(header.topLevelColumnTitle);
                event.dataRows[1].push(header.columnTitle);
            } else {
                event.dataRows[0].push(header);
            }
        }
    });
}

/**
 * @private
 */
function chartDrawAnnotations(
    this: AnnotationChart
): void {
    this.plotBoxClip.attr(this.plotBox);

    this.annotations.forEach((annotation): void => {
        annotation.redraw();
        annotation.graphic.animate({
            opacity: 1
        }, annotation.animationConfig);
    });
}

/**
 * Remove an annotation from the chart.
 *
 * @function Highcharts.Chart#removeAnnotation
 *
 * @param {number|string|Highcharts.Annotation} idOrAnnotation
 *        The annotation's id or direct annotation object.
 */
function chartRemoveAnnotation(
    this: AnnotationChart,
    idOrAnnotation: (number|string|Annotation)
): void {
    const annotations = this.annotations,
        annotation: Annotation = (
            (idOrAnnotation as any).coll === 'annotations'
        ) ?
            idOrAnnotation :
            find(
                annotations,
                function (annotation: Annotation): boolean {
                    return annotation.options.id === idOrAnnotation;
                }
            ) as any;

    if (annotation) {
        fireEvent(annotation, 'remove');
        erase(this.options.annotations, annotation.options);
        erase(annotations, annotation);
        annotation.destroy();
    }
}

/**
 * Create lookups initially
 * @private
 */
function onChartAfterInit(
    this: Chart
): void {
    const chart = this as AnnotationChart;

    chart.annotations = [];

    if (!this.options.annotations) {
        this.options.annotations = [];
    }

}

/**
 * @private
 */
function wrapPointerOnContainerMouseDown(
    this: Annotation,
    proceed: Function
): void {
    if (!this.chart.hasDraggedAnnotation) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    }
}

/* *
 *
 *  Composition
 *
 * */

/**
 * @private
 */
namespace AnnotationChart {

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    export function compose(
        AnnotationClass: typeof Annotation,
        ChartClass: typeof Chart,
        PointerClass: typeof Pointer
    ): void {

        if (pushUnique(composedMembers, ChartClass)) {
            addEvent(ChartClass, 'afterInit', onChartAfterInit);

            const chartProto = ChartClass.prototype as AnnotationChart;

            chartProto.addAnnotation = chartAddAnnotation;
            chartProto.callbacks.push(chartCallback);
            chartProto.collectionsWithInit.annotations = [chartAddAnnotation];
            chartProto.collectionsWithUpdate.push('annotations');
            chartProto.drawAnnotations = chartDrawAnnotations;
            chartProto.removeAnnotation = chartRemoveAnnotation;

            chartProto.initAnnotation = function chartInitAnnotation(
                this: AnnotationChart,
                userOptions: AnnotationOptions
            ): Annotation {
                const Constructor = (
                        AnnotationClass.types[userOptions.type as any] ||
                        AnnotationClass
                    ),
                    annotation = new Constructor(this, userOptions);

                this.annotations.push(annotation);

                return annotation;
            };
        }

        if (pushUnique(composedMembers, PointerClass)) {
            const pointerProto = PointerClass.prototype;

            wrap(
                pointerProto,
                'onContainerMouseDown',
                wrapPointerOnContainerMouseDown
            );
        }

    }

}

/* *
 *
 *  Default Export
 *
 * */

export default AnnotationChart;
