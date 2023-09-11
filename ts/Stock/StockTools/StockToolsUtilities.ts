/**
 *
 *  Events generator for Stock tools
 *
 *  (c) 2009-2021 Paweł Fus
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

import type Annotation from '../../Extensions/Annotations/Annotation';
import type { AxisPositions } from './StockTools';
import type AxisType from '../../Core/Axis/AxisType';
import type Chart from '../../Core/Chart/Chart';
import type FlagsPoint from '../../Series/Flags/FlagsPoint';
import type { FlagsShapeValue } from '../../Series/Flags/FlagsPointOptions';
import type FlagsSeriesOptions from '../../Series/Flags/FlagsSeriesOptions';
import type NavigationBindings from '../../Extensions/Annotations/NavigationBindings';
import type Point from '../../Core/Series/Point';
import type Pointer from '../../Core/Pointer';
import type PointerEvent from '../../Core/PointerEvent';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import D from '../../Core/Defaults.js';
const { getOptions } = D;
import NBU from '../../Extensions/Annotations/NavigationBindingsUtilities.js';
const {
    getAssignedAxis,
    getFieldType
} = NBU;
import Series from '../../Core/Series/Series.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined } = OH;
const { fireEvent } = EH;
const {
    uniqueKey
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface NavigationBindingsAttractionObject {
    x: number;
    y: number;
    below: boolean;
    series: Series;
    xAxis: number;
    yAxis: number;
}

interface StockToolsFieldsObject {
    [key: string]: any;
}

/* *
 *
 *  Constants
 *
 * */

/**
 * @private
 */
const indicatorsWithAxes = [
    'apo',
    'ad',
    'aroon',
    'aroonoscillator',
    'atr',
    'ao',
    'cci',
    'chaikin',
    'cmf',

    'cmo',
    'disparityindex',
    'dmi',
    'dpo',
    'linearRegressionAngle',
    'linearRegressionIntercept',
    'linearRegressionSlope',
    'klinger',
    'macd',
    'mfi',
    'momentum',

    'natr',
    'obv',
    'ppo',
    'roc',
    'rsi',
    'slowstochastic',
    'stochastic',
    'trix',
    'williamsr'
];

/**
 * @private
 */
const indicatorsWithVolume = [
    'ad',
    'cmf',
    'klinger',
    'mfi',
    'obv',
    'vbp',
    'vwap'
];

/* *
 *
 *  Functions
 *
 * */

/**
 * Generates function which will add a flag series using modal in GUI.
 * Method fires an event "showPopup" with config:
 * `{type, options, callback}`.
 *
 * Example: NavigationBindings.utils.addFlagFromForm('url(...)') - will
 * generate function that shows modal in GUI.
 *
 * @private
 * @function bindingsUtils.addFlagFromForm
 *
 * @param {Highcharts.FlagsShapeValue} type
 *        Type of flag series, e.g. "squarepin"
 *
 * @return {Function}
 *         Callback to be used in `start` callback
 */
function addFlagFromForm(
    type: FlagsShapeValue
): Function {
    return function (
        this: NavigationBindings,
        e: PointerEvent
    ): void {
        const navigation = this,
            chart = navigation.chart,
            toolbar = chart.stockTools,
            point = attractToPoint(e, chart);

        if (!point) {
            return;
        }

        const pointConfig = {
            x: point.x,
            y: point.y
        };

        const seriesOptions: FlagsSeriesOptions = {
            type: 'flags',
            onSeries: point.series.id,
            shape: type,
            data: [pointConfig],
            xAxis: point.xAxis,
            yAxis: point.yAxis,
            point: {
                events: {
                    click: function (this: FlagsPoint): void {
                        const point = this,
                            options = point.options;

                        fireEvent(
                            navigation,
                            'showPopup',
                            {
                                point: point,
                                formType: 'annotation-toolbar',
                                options: {
                                    langKey: 'flags',
                                    type: 'flags',
                                    title: [
                                        options.title,
                                        getFieldType(
                                            'title',
                                            options.title as any
                                        )
                                    ],
                                    name: [
                                        options.name,
                                        getFieldType(
                                            'name',
                                            options.name as any
                                        )
                                    ]
                                },
                                onSubmit: function (
                                    updated: StockToolsFieldsObject
                                ): void {
                                    if (updated.actionType === 'remove') {
                                        point.remove();
                                    } else {
                                        point.update(
                                            navigation.fieldsToOptions(
                                                updated.fields,
                                                {}
                                            )
                                        );
                                    }
                                }
                            }
                        );
                    } as any
                }
            }
        };

        if (!toolbar || !toolbar.guiEnabled) {
            chart.addSeries(seriesOptions);
        }

        fireEvent(
            navigation,
            'showPopup',
            {
                formType: 'flag',
                // Enabled options:
                options: {
                    langKey: 'flags',
                    type: 'flags',
                    title: ['A', getFieldType('label', 'A' as any)],
                    name: ['Flag A', getFieldType('label', 'Flag A' as any)]
                },
                // Callback on submit:
                onSubmit: function (
                    data: StockToolsFieldsObject
                ): void {
                    navigation.fieldsToOptions(
                        data.fields,
                        (seriesOptions.data as any)[0]
                    );
                    chart.addSeries(seriesOptions);
                }
            }
        );
    };
}

/**
 * @private
 * @todo
 * Consider using getHoverData(), but always kdTree (columns?)
 */
function attractToPoint(
    e: PointerEvent,
    chart: Chart
): NavigationBindingsAttractionObject | void {
    const coords = chart.pointer.getCoordinates(e);

    let coordsX: (Pointer.AxisCoordinateObject|undefined),
        coordsY: (Pointer.AxisCoordinateObject|undefined),
        distX = Number.MAX_VALUE,
        closestPoint: (Point|undefined);

    if (chart.navigationBindings) {
        coordsX = getAssignedAxis(coords.xAxis);
        coordsY = getAssignedAxis(coords.yAxis);
    }

    // Exit if clicked out of axes area.
    if (!coordsX || !coordsY) {
        return;
    }

    const x = coordsX.value;
    const y = coordsY.value;

    // Search by 'x' but only in yAxis' series.
    coordsY.axis.series.forEach((series): void => {
        if (series.points) {
            series.points.forEach((point): void => {
                if (point && distX > Math.abs((point.x as any) - x)) {
                    distX = Math.abs((point.x as any) - x);
                    closestPoint = point;
                }
            });
        }
    });

    if (closestPoint && closestPoint.x && closestPoint.y) {
        return {
            x: closestPoint.x,
            y: closestPoint.y,
            below: y < closestPoint.y,
            series: closestPoint.series,
            xAxis: closestPoint.series.xAxis.index || 0,
            yAxis: closestPoint.series.yAxis.index || 0
        };
    }
}

/**
 * Shorthand to check if given yAxis comes from navigator.
 *
 * @private
 * @function bindingsUtils.isNotNavigatorYAxis
 *
 * @param {Highcharts.Axis} axis
 * Axis to check.
 *
 * @return {boolean}
 * True, if axis comes from navigator.
 */
function isNotNavigatorYAxis(
    axis: AxisType
): boolean {
    return axis.userOptions.className !== 'highcharts-navigator-yaxis';
}

/**
 * Check if any of the price indicators are enabled.
 * @private
 * @function bindingsUtils.isLastPriceEnabled
 *
 * @param {Array} series
 *        Array of series.
 *
 * @return {boolean}
 *         Tells which indicator is enabled.
 */
function isPriceIndicatorEnabled(
    series: Series[]
): boolean {

    return series.some(
        (s): (SVGElement|undefined) => s.lastVisiblePrice || s.lastPrice
    );
}

/**
 * @private
 */
function manageIndicators(
    this: NavigationBindings,
    data: StockToolsFieldsObject
): void {
    const chart = this.chart,
        seriesConfig: StockToolsFieldsObject = {
            linkedTo: data.linkedTo,
            type: data.type
        };

    let yAxis,
        parentSeries,
        defaultOptions,
        series: Series;

    if (data.actionType === 'edit') {
        this.fieldsToOptions(data.fields, seriesConfig);
        series = chart.get(data.seriesId) as any;

        if (series) {
            series.update(seriesConfig, false);
        }
    } else if (data.actionType === 'remove') {
        series = chart.get(data.seriesId) as any;
        if (series) {
            yAxis = series.yAxis;

            if (series.linkedSeries) {
                series.linkedSeries.forEach((linkedSeries): void => {
                    linkedSeries.remove(false);
                });
            }

            series.remove(false);

            if (indicatorsWithAxes.indexOf(series.type) >= 0) {
                const removedYAxisProps = {
                    height: yAxis.options.height,
                    top: yAxis.options.top
                } as AxisPositions;
                yAxis.remove(false);
                this.resizeYAxes(removedYAxisProps);
            }
        }
    } else {
        seriesConfig.id = uniqueKey();
        this.fieldsToOptions(data.fields, seriesConfig);
        parentSeries = chart.get(seriesConfig.linkedTo);
        defaultOptions = getOptions().plotOptions as any;

        // Make sure that indicator uses the SUM approx if SUM approx is used
        // by parent series (#13950).
        if (
            typeof parentSeries !== 'undefined' &&
            parentSeries instanceof Series &&
            parentSeries.getDGApproximation() === 'sum' &&
            // If indicator has defined approx type, use it (e.g. "ranges")
            !defined(
                defaultOptions && defaultOptions[seriesConfig.type] &&
                defaultOptions.dataGrouping &&
                defaultOptions.dataGrouping.approximation
            )
        ) {
            seriesConfig.dataGrouping = {
                approximation: 'sum'
            };
        }

        if (indicatorsWithAxes.indexOf(data.type) >= 0) {
            yAxis = chart.addAxis({
                id: uniqueKey(),
                offset: 0,
                opposite: true,
                title: {
                    text: ''
                },
                tickPixelInterval: 40,
                showLastLabel: false,
                labels: {
                    align: 'left',
                    y: -2
                }
            }, false, false);
            seriesConfig.yAxis = yAxis.options.id;
            this.resizeYAxes();
        } else {
            seriesConfig.yAxis = (
                chart.get(data.linkedTo) as any
            ).options.yAxis;
        }

        if (indicatorsWithVolume.indexOf(data.type) >= 0) {
            seriesConfig.params.volumeSeriesID = chart.series.filter(
                function (series): boolean {
                    return series.options.type === 'column';
                }
            )[0].options.id;
        }

        chart.addSeries(seriesConfig, false);
    }

    fireEvent(
        this,
        'deselectButton',
        {
            button: this.selectedButtonElement
        }
    );

    chart.redraw();
}

/**
 * Update height for an annotation. Height is calculated as a difference
 * between last point in `typeOptions` and current position. It's a value,
 * not pixels height.
 *
 * @private
 * @function bindingsUtils.updateHeight
 *
 * @param {Highcharts.PointerEventObject} e
 *        normalized browser event
 *
 * @param {Highcharts.Annotation} annotation
 *        Annotation to be updated
 */
function updateHeight(
    this: NavigationBindings,
    e: PointerEvent,
    annotation: Annotation
): void {
    const options = annotation.options.typeOptions,
        yAxis = isNumber(options.yAxis) && this.chart.yAxis[options.yAxis];

    if (yAxis && options.points) {
        annotation.update({
            typeOptions: {
                height: yAxis.toValue(e[yAxis.horiz ? 'chartX' : 'chartY']) -
                    (options.points[1].y || 0)
            }
        });
    }
}

/**
 * Update each point after specified index, most of the annotations use
 * this. For example crooked line: logic behind updating each point is the
 * same, only index changes when adding an annotation.
 *
 * Example: NavigationBindings.utils.updateNthPoint(1) - will generate
 * function that updates all consecutive points except point with index=0.
 *
 * @private
 * @function bindingsUtils.updateNthPoint
 *
 * @param {number} startIndex
 *        Index from each point should udpated
 *
 * @return {Function}
 *         Callback to be used in steps array
 */
function updateNthPoint(
    startIndex: number
): typeof updateHeight {
    return function (
        this: NavigationBindings,
        e: PointerEvent,
        annotation: Annotation
    ): void {
        const options = annotation.options.typeOptions,
            xAxis = isNumber(options.xAxis) && this.chart.xAxis[options.xAxis],
            yAxis = isNumber(options.yAxis) && this.chart.yAxis[options.yAxis];


        if (xAxis && yAxis) {
            (options.points as any).forEach((
                point: Point,
                index: number
            ): void => {
                if (index >= startIndex) {
                    point.x = xAxis.toValue(
                        e[xAxis.horiz ? 'chartX' : 'chartY']
                    );
                    point.y = yAxis.toValue(
                        e[yAxis.horiz ? 'chartX' : 'chartY']
                    );
                }
            });
            annotation.update({
                typeOptions: {
                    points: options.points
                }
            });
        }
    };
}

/**
 * Update size of background (rect) in some annotations: Measure, Simple
 * Rect.
 *
 * @private
 * @function Highcharts.NavigationBindingsUtilsObject.updateRectSize
 *
 * @param {Highcharts.PointerEventObject} event
 * Normalized browser event
 *
 * @param {Highcharts.Annotation} annotation
 * Annotation to be updated
 */
function updateRectSize(
    event: PointerEvent,
    annotation: Annotation
): void {
    const chart = annotation.chart,
        options = annotation.options.typeOptions,
        xAxis = isNumber(options.xAxis) && chart.xAxis[options.xAxis],
        yAxis = isNumber(options.yAxis) && chart.yAxis[options.yAxis];

    if (xAxis && yAxis) {
        const x = xAxis.toValue(event[xAxis.horiz ? 'chartX' : 'chartY']),
            y = yAxis.toValue(event[yAxis.horiz ? 'chartX' : 'chartY']),
            width = x - options.point.x,
            height = options.point.y - y;

        annotation.update({
            typeOptions: {
                background: {
                    width: chart.inverted ? height : width,
                    height: chart.inverted ? width : height
                }
            }
        });
    }
}

/* *
 *
 *  Default Export
 *
 * */

const StockToolsUtilities = {
    indicatorsWithAxes,
    indicatorsWithVolume,
    addFlagFromForm,
    attractToPoint,
    getAssignedAxis,
    isNotNavigatorYAxis,
    isPriceIndicatorEnabled,
    manageIndicators,
    updateHeight,
    updateNthPoint,
    updateRectSize
};

export default StockToolsUtilities;
