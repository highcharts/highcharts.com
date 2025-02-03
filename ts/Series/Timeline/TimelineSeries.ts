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

/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

/* *
 *
 *  Imports
 *
 * */

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type CSSObject from '../../Core/Renderer/CSSObject';
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
    column: ColumnSeries,
    line: LineSeries
} = SeriesRegistry.seriesTypes;
import TimelinePoint from './TimelinePoint.js';
import TimelineSeriesDefaults from './TimelineSeriesDefaults.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    arrayMax,
    arrayMin,
    defined,
    extend,
    merge,
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

    public data!: Array<TimelinePoint>;

    public options!: TimelineSeriesOptions;

    public points!: Array<TimelinePoint>;

    public userOptions!: TimelineSeriesOptions;

    public visibilityMap!: Array<(boolean|TimelinePoint|TimelinePointOptions)>;

    public visiblePointsCount?: number;

    /* *
     *
     *  Functions
     *
     * */

    public alignDataLabel(
        point: TimelinePoint,
        dataLabel: SVGLabel,
        _options: TimelineDataLabelOptions,
        _alignTo: BBoxObject
    ): void {
        const series = this,
            isInverted = series.chart.inverted,
            visiblePoints = series.visibilityMap.filter(
                (point?): boolean => !!point
            ),
            visiblePointsCount = series.visiblePointsCount || 0,
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
            availableSpace = Math.floor(
                series.xAxis.len / visiblePointsCount
            ),
            pad = dataLabel.padding;

        let distance: number,
            targetDLWidth: number,
            styles: CSSObject;

        // Adjust data label width to the currently available space.
        if (point.visible) {
            distance = Math.abs(
                userDLOptions.x || (point.options.dataLabels as any).x
            );
            if (isInverted) {

                targetDLWidth = (
                    (distance - pad) * 2 - ((point.itemHeight || 0) / 2)
                );
                styles = {
                    width: pick(
                        dataLabelsOptions.style?.width,
                        `${series.yAxis.len * 0.4}px`
                    ),
                    // Apply ellipsis when data label height is exceeded.
                    textOverflow: (dataLabel.width || 0) / targetDLWidth *
                        (dataLabel.height || 0) / 2 > availableSpace *
                        multiplier ?
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

        super.bindAxes();

        // Initially set the linked xAxis type to category.
        if (!series.xAxis.userOptions.type) {
            series.xAxis.categories = series.xAxis.hasNames = true as any;
        }
    }

    public distributeDL(): void {
        const series = this,
            dataLabelsOptions = series.options.dataLabels,
            inverted = series.chart.inverted;
        let visibilityIndex = 1;

        if (dataLabelsOptions) {
            const distance = pick(
                dataLabelsOptions.distance,
                inverted ? 20 : 100
            );

            for (const point of series.points) {
                const defaults: TimelineDataLabelOptions = {
                    [inverted ? 'x' : 'y']:
                        dataLabelsOptions.alternate && visibilityIndex % 2 ?
                            -distance : distance
                };
                if (inverted) {
                    defaults.align = (
                        dataLabelsOptions.alternate && visibilityIndex % 2
                    ) ? 'right' : 'left';
                }
                point.options.dataLabels = merge(defaults, point.userDLOptions);
                visibilityIndex++;
            }
        }
    }

    public generatePoints(): void {
        super.generatePoints();

        const series = this,
            points = series.points,
            pointsLen = points.length,
            xData = series.getColumn('x');

        for (let i = 0, iEnd = pointsLen; i < iEnd; ++i) {
            const x = xData[i];
            points[i].applyOptions({ x: x }, x);
        }
    }

    public getVisibilityMap(): Array<(boolean|TimelinePoint|TimelinePointOptions)> {
        const series = this,
            nullInteraction = series.options.nullInteraction,
            map = (
                (series.data.length ? series.data : series.options.data) || []
            ).map((
                point: (TimelinePoint|TimelinePointOptions)
            ): (boolean|TimelinePoint|TimelinePointOptions) => (
                point &&
                point.visible !== false &&
                (!point.isNull || nullInteraction) ?
                    point :
                    false
            ));

        return map;
    }

    public getXExtremes(xData: Array<number>): RangeSelector.RangeObject {
        const series = this,
            filteredData = xData.filter((_x, i): boolean => (
                series.points[i].isValid() &&
                series.points[i].visible
            ));

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

                for (const point of series.points) {
                    // Set the isInside parameter basing also on the real point
                    // visibility, in order to avoid showing hidden points
                    // in drawPoints method.
                    point.isInside = point.isInside && point.visible;

                    // New way of calculating closestPointRangePx value, which
                    // respects the real point visibility is needed.
                    if (
                        point.visible && (
                            !point.isNull ||
                            series.options.nullInteraction
                        )
                    ) {
                        if (defined(lastPlotX)) {
                            closestPointRangePx = Math.min(
                                closestPointRangePx,
                                Math.abs((point.plotX as any) - lastPlotX)
                            );
                        }
                        lastPlotX = point.plotX;
                    }
                }
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
                for (const point of series.points) {
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
                            return this.renderer.Element.prototype
                                .animate.apply(this, arguments) as SVGLabel;
                        };

                        // Initialize the targetPosition field within data label
                        // object. It's necessary because there is need to know
                        // expected position of specific data label, when
                        // aligning connectors. This field is overridden inside
                        // of SVGElement.animate() wrapped method.
                        if (!dataLabel.targetPosition) {
                            dataLabel.targetPosition = {};
                        }

                        point.drawConnector();
                    }
                }
            }
        ));

        series.eventsToUnbind.push(addEvent(
            series.chart,
            'afterHideOverlappingLabel',
            function (): void {
                for (const p of series.points) {
                    if (
                        p.dataLabel &&
                        p.dataLabel.connector &&
                        p.dataLabel.oldOpacity !== p.dataLabel.newOpacity
                    ) {
                        p.alignConnector();
                    }
                }
            }
        ));
    }

    public markerAttribs(
        point: TimelinePoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const series = this,
            seriesMarkerOptions: PointMarkerOptions = (
                series.options.marker as any
            ),
            pointMarkerOptions = point.marker || {},
            symbol = (
                pointMarkerOptions.symbol || seriesMarkerOptions.symbol
            ),
            width = pick<number|undefined, number|undefined, number>(
                pointMarkerOptions.width,
                seriesMarkerOptions.width,
                series.closestPointRangePx as any
            ),
            height = pick<number|undefined, number>(
                pointMarkerOptions.height,
                seriesMarkerOptions.height as any
            );

        let seriesStateOptions: SeriesStatesOptions<TimelineSeries>,
            pointStateOptions: PointStatesOptions<TimelinePoint>,
            radius = 0;

        // Call default markerAttribs method, when the xAxis type
        // is set to datetime.
        if (series.xAxis.dateTime) {
            return super.markerAttribs(point, state);
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

        const attribs = {
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

}

// Add series-specific properties after data is already processed, #17890
addEvent(TimelineSeries, 'afterProcessData', function (): void {
    const series = this,
        xData = series.getColumn('x');

    let visiblePoints = 0;

    series.visibilityMap = series.getVisibilityMap();

    // Calculate currently visible points.
    for (const point of series.visibilityMap) {
        if (point) {
            visiblePoints++;
        }
    }

    series.visiblePointsCount = visiblePoints;

    this.dataTable.setColumn('y', new Array(xData.length).fill(1));

});

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
