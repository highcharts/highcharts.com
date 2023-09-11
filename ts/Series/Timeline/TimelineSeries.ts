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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type RangeSelector from '../../Stock/RangeSelector/RangeSelector';
import type TimelineDataLabelOptions from './TimelineDataLabelOptions';
import type TimelinePointOptions from './TimelinePointOptions';
import type TimelineSeriesOptions from './TimelineSeriesOptions';
import type {
    PointMarkerOptions,
    PointStatesOptions
} from '../../Core/Series/PointOptions';
import type { SeriesStatesOptions } from '../../Core/Series/SeriesOptions';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: ColumnSeries,
        line: LineSeries
    }
} = SeriesRegistry;
import SVGElement from '../../Core/Renderer/SVG/SVGElement.js';
import TimelinePoint from './TimelinePoint.js';
import TimelineSeriesDefaults from './TimelineSeriesDefaults.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    arrayMin,
    arrayMax
} = AH;
const { defined, extend, merge } = OH;
const { addEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * The timeline series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.timeline
 *
 * @augments Highcharts.Series
 */
class TimelineSeries extends LineSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: TimelineSeriesOptions = merge(
        LineSeries.defaultOptions,
        TimelineSeriesDefaults
    );

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<TimelinePoint> = void 0 as any;

    public options: TimelineSeriesOptions = void 0 as any;

    public points: Array<TimelinePoint> = void 0 as any;

    public userOptions: TimelineSeriesOptions = void 0 as any;

    public visibilityMap: Array<(boolean|TimelinePoint|TimelinePointOptions)> = void 0 as any;

    public visiblePointsCount?: number;

    public yData?: Array<number>;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public alignDataLabel(
        point: TimelinePoint,
        dataLabel: SVGLabel,
        _options: TimelineDataLabelOptions,
        _alignTo: BBoxObject
    ): void {
        let series = this,
            isInverted = series.chart.inverted,
            visiblePoints = series.visibilityMap.filter(function (
                point
            ): boolean {
                return point as any;
            }),
            visiblePointsCount: number = series.visiblePointsCount as any,
            pointIndex = visiblePoints.indexOf(point),
            isFirstOrLast = (
                !pointIndex || pointIndex === visiblePointsCount - 1
            ),
            dataLabelsOptions: TimelineDataLabelOptions = (
                series.options.dataLabels as any
            ),
            userDLOptions = point.userDLOptions || {},
            // Define multiplier which is used to calculate data label
            // width. If data labels are alternate, they have two times more
            // space to adapt (excepting first and last ones, which has only
            // one and half), than in case of placing all data labels side
            // by side.
            multiplier = dataLabelsOptions.alternate ?
                (isFirstOrLast ? 1.5 : 2) :
                1,
            distance,
            availableSpace = Math.floor(
                series.xAxis.len / visiblePointsCount
            ),
            pad = dataLabel.padding,
            targetDLWidth,
            styles;

        // Adjust data label width to the currently available space.
        if (point.visible) {
            distance = Math.abs(
                userDLOptions.x || (point.options.dataLabels as any).x
            );
            if (isInverted) {
                targetDLWidth = (
                    (distance - pad) * 2 - ((point.itemHeight as any) / 2)
                );
                styles = {
                    width: targetDLWidth + 'px',
                    // Apply ellipsis when data label height is exceeded.
                    textOverflow: dataLabel.width / targetDLWidth *
                        dataLabel.height / 2 > availableSpace * multiplier ?
                        'ellipsis' : 'none'
                };
            } else {
                styles = {
                    width: (
                        userDLOptions.width ||
                        dataLabelsOptions.width ||
                        availableSpace * multiplier - (pad * 2)
                    ) + 'px'
                };
            }
            dataLabel.css(styles);

            if (!series.chart.styledMode) {
                dataLabel.shadow(dataLabelsOptions.shadow);
            }
        }
        super.alignDataLabel.apply(series, arguments);
    }

    public bindAxes(): void {
        const series = this;

        super.bindAxes.call(series);

        ['xAxis', 'yAxis'].forEach(function (axis): void {
            // Initially set the linked xAxis type to category.
            if (axis === 'xAxis' && !series[axis].userOptions.type) {
                series[axis].categories = series[axis].hasNames = true as any;
            }
        });
    }

    public distributeDL(): void {
        const series = this,
            dataLabelsOptions = series.options.dataLabels;
        let visibilityIndex = 1;

        if (dataLabelsOptions) {
            const distance = dataLabelsOptions.distance || 0;

            series.points.forEach((point): void => {
                point.options.dataLabels = merge({
                    [series.chart.inverted ? 'x' : 'y']:
                        dataLabelsOptions.alternate && visibilityIndex % 2 ?
                            -distance : distance
                }, point.userDLOptions);
                visibilityIndex++;
            });
        }
    }

    public generatePoints(): void {
        const series = this;

        super.generatePoints.apply(series);
        series.points.forEach(function (point, i): void {
            point.applyOptions({
                x: (series.xData as any)[i]
            }, (series.xData as any)[i]);
        });
    }

    public getVisibilityMap(): Array<(boolean|TimelinePoint|TimelinePointOptions)> {
        const series = this,
            map = (series.data.length ?
                series.data : (series.userOptions.data as any)
            ).map(function (
                point: (TimelinePoint|TimelinePointOptions)
            ): (boolean|TimelinePoint|TimelinePointOptions) {
                return (
                    point &&
                    point.visible !== false &&
                    !point.isNull
                ) ? point : false;
            });
        return map;
    }

    public getXExtremes(xData: Array<number>): RangeSelector.RangeObject {
        const series = this,
            filteredData = xData.filter(function (
                x: number,
                i: number
            ): boolean {
                return series.points[i].isValid() &&
                    series.points[i].visible;
            });

        return {
            min: arrayMin(filteredData),
            max: arrayMax(filteredData)
        };
    }

    public init(): void {
        const series = this;

        super.init.apply(series, arguments);

        series.eventsToUnbind.push(addEvent(
            series,
            'afterTranslate',
            function (): void {
                let lastPlotX: (number|undefined),
                    closestPointRangePx = Number.MAX_VALUE;

                series.points.forEach(function (point): void {
                    // Set the isInside parameter basing also on the real point
                    // visibility, in order to avoid showing hidden points
                    // in drawPoints method.
                    point.isInside = point.isInside && point.visible;

                    // New way of calculating closestPointRangePx value, which
                    // respects the real point visibility is needed.
                    if (point.visible && !point.isNull) {
                        if (defined(lastPlotX)) {
                            closestPointRangePx = Math.min(
                                closestPointRangePx,
                                Math.abs((point.plotX as any) - lastPlotX)
                            );
                        }
                        lastPlotX = point.plotX;
                    }
                });
                series.closestPointRangePx = closestPointRangePx;
            }
        ));

        // Distribute data labels before rendering them. Distribution is
        // based on the 'dataLabels.distance' and 'dataLabels.alternate'
        // property.
        series.eventsToUnbind.push(addEvent(
            series,
            'drawDataLabels',
            function (): void {
                // Distribute data labels basing on defined algorithm.
                series.distributeDL(); // @todo use this scope for series
            }
        ));

        series.eventsToUnbind.push(addEvent(
            series,
            'afterDrawDataLabels',
            function (): void {
                let dataLabel; // @todo use this scope for series

                // Draw or align connector for each point.
                series.points.forEach(function (point): void {
                    dataLabel = point.dataLabel;

                    if (dataLabel) {
                        // Within this wrap method is necessary to save the
                        // current animation params, because the data label
                        // target position (after animation) is needed to align
                        // connectors.
                        dataLabel.animate = function (
                            this: SVGLabel,
                            params: SVGAttributes
                        ): SVGLabel {
                            if (this.targetPosition) {
                                this.targetPosition = params;
                            }
                            return SVGElement.prototype.animate.apply(
                                this,
                                arguments
                            ) as SVGLabel;
                        };

                        // Initialize the targetPosition field within data label
                        // object. It's necessary because there is need to know
                        // expected position of specific data label, when
                        // aligning connectors. This field is overrided inside
                        // of SVGElement.animate() wrapped  method.
                        if (!dataLabel.targetPosition) {
                            dataLabel.targetPosition = {};
                        }

                        return point.drawConnector();
                    }
                });
            }
        ));

        series.eventsToUnbind.push(addEvent(
            series.chart,
            'afterHideOverlappingLabel',
            function (): void {
                series.points.forEach((p): void => {
                    if (
                        p.dataLabel &&
                        p.dataLabel.connector &&
                        p.dataLabel.oldOpacity !== p.dataLabel.newOpacity
                    ) {
                        p.alignConnector();
                    }
                });
            }
        ));
    }

    public markerAttribs(
        point: TimelinePoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        let series = this,
            seriesMarkerOptions: PointMarkerOptions = (
                series.options.marker as any
            ),
            seriesStateOptions: SeriesStatesOptions<TimelineSeries>,
            pointMarkerOptions = point.marker || {},
            symbol = (
                pointMarkerOptions.symbol || seriesMarkerOptions.symbol
            ),
            pointStateOptions: PointStatesOptions<TimelinePoint>,
            width = pick<number|undefined, number|undefined, number>(
                pointMarkerOptions.width,
                seriesMarkerOptions.width,
                series.closestPointRangePx as any
            ),
            height = pick<number|undefined, number>(
                pointMarkerOptions.height,
                seriesMarkerOptions.height as any
            ),
            radius = 0,
            attribs: (SVGAttributes|undefined);

        // Call default markerAttribs method, when the xAxis type
        // is set to datetime.
        if (series.xAxis.dateTime) {
            return super.markerAttribs.call(this, point, state);
        }

        // Handle hover and select states
        if (state) {
            seriesStateOptions =
                (seriesMarkerOptions.states as any)[state] || {};
            pointStateOptions = pointMarkerOptions.states &&
                (pointMarkerOptions.states as any)[state] || {};

            radius = pick(
                (pointStateOptions as any).radius,
                (seriesStateOptions as any).radius,
                radius + ((seriesStateOptions as any).radiusPlus as any || 0)
            );
        }

        point.hasImage = (symbol && symbol.indexOf('url') === 0) as any;

        attribs = {
            x: Math.floor(point.plotX as any) - (width / 2) - (radius / 2),
            y: (point.plotY as any) - (height / 2) - (radius / 2),
            width: width + radius,
            height: height + radius
        };

        return (series.chart.inverted) ? {
            y: (attribs.x && attribs.width) &&
                series.xAxis.len - attribs.x - attribs.width,
            x: attribs.y && attribs.y,
            width: attribs.height,
            height: attribs.width
        } : attribs;

    }

    public processData(): undefined {
        let series = this,
            visiblePoints = 0,
            i: (number|undefined);

        series.visibilityMap = series.getVisibilityMap();

        // Calculate currently visible points.
        series.visibilityMap.forEach(function (point): void {
            if (point) {
                visiblePoints++;
            }
        });

        series.visiblePointsCount = visiblePoints;

        for (i = 0; i < (series.xData as any).length; i++) {
            (series.yData as any)[i] = 1;
        }

        super.processData.call(this, arguments as any);

        return;
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface TimelineSeries {
    pointClass: typeof TimelinePoint;
    trackerGroups: Array<string>;
}
extend(TimelineSeries.prototype, {
    // Use a group of trackers from TrackerMixin
    drawTracker: ColumnSeries.prototype.drawTracker,
    pointClass: TimelinePoint,
    trackerGroups: ['markerGroup', 'dataLabelsGroup']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        timeline: typeof TimelineSeries;
    }
}
SeriesRegistry.registerSeriesType('timeline', TimelineSeries);

/* *
 *
 *  Default Export
 *
 * */

export default TimelineSeries;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Callback JavaScript function to format the data label as a string. Note that
 * if a `format` is defined, the format takes precedence and the formatter is
 * ignored.
 *
 * @callback Highcharts.TimelineDataLabelsFormatterCallbackFunction
 *
 * @param {Highcharts.PointLabelObject|Highcharts.TimelineDataLabelsFormatterContextObject} this
 *        Data label context to format
 *
 * @return {number|string|null|undefined}
 *         Formatted data label text
 */

/**
 * @interface Highcharts.TimelineDataLabelsFormatterContextObject
 * @extends Highcharts.PointLabelObject
 *//**
 * @name Highcharts.TimelineDataLabelsFormatterContextObject#key
 * @type {string|undefined}
 *//**
 * @name Highcharts.TimelineDataLabelsFormatterContextObject#point
 * @type {Highcharts.Point}
 *//**
 * @name Highcharts.TimelineDataLabelsFormatterContextObject#series
 * @type {Highcharts.Series}
 */

''; // dettach doclets above
