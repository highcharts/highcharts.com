/* *
 *
 *  Highcharts Drilldown module
 *
 *  Author: Torstein Honsi
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

import type ColumnSeries from '../../Series/Column/ColumnSeries';
import type {
    CSSObject,
    CursorValue
} from '../../Core/Renderer/CSSObject';
import type Drilldown from './Drilldown';
import type MapSeries from '../../Series/Map/MapSeries';
import type Options from '../../Core/Options';
import type PieSeries from '../../Series/Pie/PieSeries';
import type Point from '../../Core/Series/Point';
import type Series from '../../Core/Series/Series';
import type SeriesOptions from '../../Core/Series/SeriesOptions';
import type {
    SeriesTypeOptions,
    SeriesTypeRegistry
} from '../../Core/Series/SeriesType';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import { animObject } from '../../Core/Animation/AnimationUtilities.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    extend,
    fireEvent,
    merge,
    pick,
    syncTimeout
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        drilldown?: string;
        doDrilldown(): void;
        runDrilldown(
            holdRedraw?: boolean,
            category?: number,
            originalEvent?: Event
        ): void;
        unbindDrilldownClick?: Function;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        drilldownLevel?: Drilldown.LevelObject;
        isDrilling?: boolean;
        purgedOptions?: SeriesTypeOptions;
        /** @requires Extensions/Drilldown */
        animateDrilldown(init?: boolean): void;
        /** @requires Extensions/Drilldown */
        animateDrillupFrom(level: Drilldown.LevelObject): void;
        /** @requires Extensions/Drilldown */
        animateDrillupTo(init?: boolean): void;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        _ddSeriesId?: number;
        _levelNumber?: number;
        drilldown?: string;
    }
}

/* *
 *
 *  Functions
 *
 * */

/** @private */
function applyCursorCSS(
    element: SVGElement,
    cursor: CursorValue,
    addClass?: boolean,
    styledMode?: boolean
): void {
    element[addClass ? 'addClass' : 'removeClass'](
        'highcharts-drilldown-point'
    );

    if (!styledMode) {
        element.css({ cursor: cursor });
    }
}

/** @private */
function columnAnimateDrilldown(
    this: ColumnSeries,
    init?: boolean
): void {
    const series = this,
        chart = series.chart as Drilldown.ChartComposition,
        drilldownLevels = chart.drilldownLevels,
        animationOptions =
            animObject((chart.options.drilldown || {}).animation),
        xAxis = this.xAxis,
        styledMode = chart.styledMode;

    if (!init) {
        let animateFrom: (SVGAttributes|undefined);

        (drilldownLevels || []).forEach((
            level: Drilldown.LevelObject
        ): void => {
            if (
                series.options._ddSeriesId ===
                    level.lowerSeriesOptions._ddSeriesId
            ) {
                animateFrom = level.shapeArgs;
                if (!styledMode && animateFrom) {
                    // Add the point colors to animate from
                    animateFrom.fill = level.color;
                }
            }
        });

        (animateFrom as any).x += pick(xAxis.oldPos, xAxis.pos) - xAxis.pos;

        series.points.forEach((point: Point): void => {
            const animateTo = point.shapeArgs;

            if (!styledMode) {
                // Add the point colors to animate to
                (animateTo as any).fill = point.color;
            }

            if (point.graphic) {
                point.graphic
                    .attr(animateFrom)
                    .animate(
                        extend(
                            point.shapeArgs,
                            { fill: point.color || series.color }
                        ),
                        animationOptions
                    );
            }
        });

        if (chart.drilldown) {
            chart.drilldown.fadeInGroup(this.dataLabelsGroup);
        }

        // Reset to prototype
        delete (this as AnyRecord).animate;
    }

}

/**
 * When drilling up, pull out the individual point graphics from the lower
 * series and animate them into the origin point in the upper series.
 *
 * @private
 * @function Highcharts.ColumnSeries#animateDrillupFrom
 * @param {Highcharts.DrilldownLevelObject} level
 *        Level container
 * @return {void}
 */
function columnAnimateDrillupFrom(
    this: ColumnSeries,
    level: Drilldown.LevelObject
): void {
    const series = this,
        animationOptions =
            animObject((series.chart.options.drilldown || {}).animation);

    // Cancel mouse events on the series group (#2787)
    (series.trackerGroups || []).forEach((key: string): void => {
        // We don't always have dataLabelsGroup
        if ((series as AnyRecord)[key]) {
            (series as AnyRecord)[key].on('mouseover');
        }
    });

    let group: (SVGElement|undefined) = series.group;

    // For 3d column series all columns are added to one group
    // so we should not delete the whole group. #5297
    const removeGroup = group !== series.chart.columnGroup;

    if (removeGroup) {
        delete (series as any).group;
    }

    this.points.forEach((point: Point): void => {
        const graphic = point.graphic,
            animateTo = level.shapeArgs;

        if (graphic && animateTo) {
            const complete = (): void => {
                graphic.destroy();
                if (group && removeGroup) {
                    group = group.destroy();
                }
            };

            delete point.graphic;

            if (!series.chart.styledMode) {
                animateTo.fill = level.color;
            }

            if (animationOptions.duration) {
                graphic.animate(
                    animateTo,
                    merge(animationOptions, { complete: complete })
                );
            } else {
                graphic.attr(animateTo);
                complete();
            }
        }
    });
}

/**
 * When drilling up, keep the upper series invisible until the lower series has
 * moved into place.
 *
 * @private
 * @function Highcharts.ColumnSeries#animateDrillupTo
 * @param {boolean} [init=false]
 * Whether to initialize animation
 */
function columnAnimateDrillupTo(
    this: ColumnSeries,
    init?: boolean
): void {
    const series = this,
        level = series.drilldownLevel;

    if (!init) {

        // First hide all items before animating in again
        series.points.forEach((point): void => {
            const dataLabel = point.dataLabel;

            if (point.graphic) { // #3407
                point.graphic.hide();
            }

            if (dataLabel) {
                // The data label is initially hidden, make sure it is not faded
                // in (#6127)
                dataLabel.hidden = dataLabel.attr('visibility') === 'hidden';

                if (!dataLabel.hidden) {
                    dataLabel.hide();
                    dataLabel.connector?.hide();
                }
            }
        });


        // Do dummy animation on first point to get to complete
        syncTimeout((): void => {
            if (series.points) { // May be destroyed in the meantime, #3389
                // Unable to drillup with nodes, #13711
                let pointsWithNodes: Array<Point> = [];
                series.data.forEach((el): void => {
                    pointsWithNodes.push(el);
                });
                if (series.nodes) {
                    pointsWithNodes = pointsWithNodes.concat(series.nodes);
                }
                pointsWithNodes.forEach((point, i): void => {
                    // Fade in other points
                    const verb =
                        i === (level && level.pointIndex) ? 'show' : 'fadeIn',
                        inherit = verb === 'show' ? true : void 0,
                        dataLabel = point.dataLabel;


                    if (
                        point.graphic && // #3407
                        point.visible // Don't show if invisible (#18303)
                    ) {
                        point.graphic[verb](inherit);
                    }

                    if (dataLabel && !dataLabel.hidden) { // #6127
                        dataLabel.fadeIn(); // #7384
                        dataLabel.connector?.fadeIn();
                    }
                });
            }
        }, Math.max(
            (series.chart.options.drilldown as any).animation.duration - 50, 0
        ));

        // Reset to prototype
        delete (this as AnyRecord).animate;
    }

}

/** @private */
function compose(
    SeriesClass: typeof Series,
    seriesTypes: SeriesTypeRegistry
): void {
    const PointClass = SeriesClass.prototype.pointClass,
        pointProto = PointClass.prototype;

    if (!pointProto.doDrilldown) {
        const {
            column: ColumnSeriesClass,
            map: MapSeriesClass,
            pie: PieSeriesClass
        } = seriesTypes;

        addEvent(PointClass, 'afterInit', onPointAfterInit);
        addEvent(PointClass, 'afterSetState', onPointAfterSetState);
        addEvent(PointClass, 'update', onPointUpdate);

        pointProto.doDrilldown = pointDoDrilldown;
        pointProto.runDrilldown = pointRunDrilldown;

        addEvent(
            SeriesClass,
            'afterDrawDataLabels',
            onSeriesAfterDrawDataLabels
        );
        addEvent(SeriesClass, 'afterDrawTracker', onSeriesAfterDrawTracker);

        if (ColumnSeriesClass) {
            const columnProto = ColumnSeriesClass.prototype;

            columnProto.animateDrilldown = columnAnimateDrilldown;
            columnProto.animateDrillupFrom = columnAnimateDrillupFrom;
            columnProto.animateDrillupTo = columnAnimateDrillupTo;
        }

        if (MapSeriesClass) {
            const mapProto = MapSeriesClass.prototype;

            mapProto.animateDrilldown = mapAnimateDrilldown;
            mapProto.animateDrillupFrom = mapAnimateDrillupFrom;
            mapProto.animateDrillupTo = mapAnimateDrillupTo;
        }

        if (PieSeriesClass) {
            const pieProto = PieSeriesClass.prototype;

            pieProto.animateDrilldown = pieAnimateDrilldown;
            pieProto.animateDrillupFrom = columnAnimateDrillupFrom;
            pieProto.animateDrillupTo = columnAnimateDrillupTo;
        }
    }

}

/**
 * Animate in the new series.
 * @private
 */
function mapAnimateDrilldown(
    this: MapSeries,
    init?: boolean
): void {
    const series = this,
        chart = series.chart as Drilldown.ChartComposition,
        group = series.group;

    if (
        chart &&
        group &&
        series.options &&
        chart.options.drilldown &&
        chart.options.drilldown.animation
    ) {
        // Initialize the animation
        if (init && chart.mapView) {
            group.attr({
                opacity: 0.01
            });
            chart.mapView.allowTransformAnimation = false;
            // Stop duplicating and overriding animations
            series.options.inactiveOtherPoints = true;
            series.options.enableMouseTracking = false;

        // Run the animation
        } else {
            group.animate({
                opacity: 1
            },
            chart.options.drilldown.animation,
            (): void => {
                if (series.options) {
                    series.options.inactiveOtherPoints = false;
                    series.options.enableMouseTracking =
                        pick(
                            (
                                series.userOptions &&
                                series.userOptions.enableMouseTracking
                            ),
                            true
                        );
                    series.isDirty = true;
                    chart.redraw();
                }
            });

            if (chart.drilldown) {
                chart.drilldown.fadeInGroup(this.dataLabelsGroup);
            }
        }
    }
}

/**
 * When drilling up, pull out the individual point graphics from the
 * lower series and animate them into the origin point in the upper
 * series.
 * @private
 */
function mapAnimateDrillupFrom(
    this: MapSeries
): void {
    const series = this,
        chart = series.chart as Drilldown.ChartComposition;

    if (chart && chart.mapView) {
        chart.mapView.allowTransformAnimation = false;
    }
    // Stop duplicating and overriding animations
    if (series.options) {
        series.options.inactiveOtherPoints = true;
    }
}

/**
 * When drilling up, keep the upper series invisible until the lower
 * series has moved into place.
 * @private
 */
function mapAnimateDrillupTo(
    this: MapSeries,
    init?: boolean
): void {
    const series = this,
        chart = series.chart as Drilldown.ChartComposition,
        group = series.group;

    if (chart && group) {

        // Initialize the animation
        if (init) {
            group.attr({
                opacity: 0.01
            });
            // Stop duplicating and overriding animations
            if (series.options) {
                series.options.inactiveOtherPoints = true;
            }
        // Run the animation
        } else {
            group.animate(
                { opacity: 1 },
                (chart.options.drilldown || {}).animation
            );

            if (chart.drilldown) {
                chart.drilldown.fadeInGroup(series.dataLabelsGroup);
            }
        }
    }
}

/**
 * On initialization of each point, identify its label and make it clickable.
 * Also, provide a list of points associated to that label.
 * @private
 */
function onPointAfterInit(
    this: Point
): Point {
    const point = this;

    if (point.drilldown && !point.unbindDrilldownClick) {
        // Add the click event to the point
        point.unbindDrilldownClick = addEvent(point, 'click', onPointClick);
    }

    return point;
}

/** @private */
function onPointAfterSetState(
    this: Point
): void {
    const point = this,
        series = point.series,
        styledMode = series.chart.styledMode;

    if (point.drilldown && series.halo && point.state === 'hover') {
        applyCursorCSS(series.halo, 'pointer', true, styledMode);
    } else if (series.halo) {
        applyCursorCSS(series.halo, 'auto', false, styledMode);
    }
}

/** @private */
function onPointClick(
    this: Point,
    e: MouseEvent
): void {
    const point = this,
        series = point.series;

    if (
        series.xAxis &&
        (series.chart.options.drilldown || {}).allowPointDrilldown ===
        false
    ) {
        // #5822, x changed
        series.xAxis.drilldownCategory(point.x as any, e);
    } else {
        point.runDrilldown(void 0, void 0, e);
    }
}

/** @private */
function onPointUpdate(
    this: Point,
    e: { options: Options }
): void {
    const point = this,
        options = e.options || {};

    if (options.drilldown && !point.unbindDrilldownClick) {
        // Add the click event to the point
        point.unbindDrilldownClick = addEvent(point, 'click', onPointClick);
    } else if (
        !options.drilldown &&
        options.drilldown !== void 0 &&
        point.unbindDrilldownClick
    ) {
        point.unbindDrilldownClick = point.unbindDrilldownClick();
    }
}

/** @private */
function onSeriesAfterDrawDataLabels(
    this: Series
): void {
    const series = this,
        chart = series.chart,
        css = (chart.options.drilldown as any).activeDataLabelStyle,
        renderer = chart.renderer,
        styledMode = chart.styledMode;

    for (const point of series.points) {
        const dataLabelsOptions = point.options.dataLabels,
            pointCSS = pick(
                point.dlOptions,
                dataLabelsOptions && (dataLabelsOptions as any).style,
                {}
            ) as CSSObject;

        if (point.drilldown && point.dataLabel) {

            if (css.color === 'contrast' && !styledMode) {
                pointCSS.color = renderer.getContrast(
                    (point.color as any) || (series.color as any)
                );
            }

            if (dataLabelsOptions && (dataLabelsOptions as any).color) {
                pointCSS.color = (dataLabelsOptions as any).color;
            }
            point.dataLabel
                .addClass('highcharts-drilldown-data-label');

            if (!styledMode) {
                point.dataLabel
                    .css(css)
                    .css(pointCSS);
            }
        }
    }
}

/**
 * Mark the trackers with a pointer.
 * @private
 */
function onSeriesAfterDrawTracker(
    this: Series
): void {
    const series = this,
        styledMode = series.chart.styledMode;

    for (const point of series.points) {
        if (point.drilldown && point.graphic) {
            applyCursorCSS(point.graphic, 'pointer', true, styledMode);
        }
    }
}

/** @private */
function pieAnimateDrilldown(
    this: PieSeries,
    init?: boolean
): void {
    const series = this,
        chart = series.chart as Drilldown.ChartComposition,
        points = series.points,
        level: Drilldown.LevelObject =
            (chart.drilldownLevels as any)[
                (chart.drilldownLevels as any).length - 1
            ],
        animationOptions =
            (chart.options.drilldown as any).animation;

    if (series.is('item')) {
        animationOptions.duration = 0;
    }
    // Unable to drill down in the horizontal item series #13372
    if (series.center) {
        const animateFrom = level.shapeArgs,
            start = (animateFrom as any).start,
            angle = (animateFrom as any).end - start,
            startAngle = angle / series.points.length,
            styledMode = chart.styledMode;

        if (!init) {
            let animateTo: (SVGAttributes|undefined),
                point: Point;

            for (let i = 0, iEnd = points.length; i < iEnd; ++i) {
                point = points[i];
                animateTo = point.shapeArgs;

                if (!styledMode) {
                    (animateFrom as any).fill = level.color;
                    (animateTo as any).fill = point.color;
                }

                if (point.graphic) {
                    point.graphic.attr(merge(animateFrom, {
                        start: start + i * startAngle,
                        end: start + (i + 1) * startAngle
                    }))[animationOptions ? 'animate' : 'attr'](
                        (
                            animateTo as any),
                        animationOptions
                    );
                }
            }

            if (chart.drilldown) {
                chart.drilldown.fadeInGroup(series.dataLabelsGroup);
            }

            // Reset to prototype
            delete (series as Partial<typeof series>).animate;
        }
    }
}


/**
 * Perform drilldown on a point instance. The [drilldown](https://api.highcharts.com/highcharts/series.line.data.drilldown)
 * property must be set on the point options.
 *
 * To drill down multiple points in the same category, use
 * `Axis.drilldownCategory` instead.
 *
 * @requires  modules/drilldown
 *
 * @function Highcharts.Point#doDrilldown
 *
 * @sample {highcharts} highcharts/drilldown/programmatic
 *         Programmatic drilldown
 */
function pointDoDrilldown(
    this: Point
): void {
    this.runDrilldown();
}

/** @private */
function pointRunDrilldown(
    this: Point,
    holdRedraw: (boolean|undefined),
    category: (number|undefined),
    originalEvent: Event|undefined
): void {
    const point = this,
        series = point.series,
        chart = series.chart,
        drilldown = chart.options.drilldown || {};

    let i: number = (drilldown.series || []).length,
        seriesOptions: (SeriesOptions|undefined);

    if (!chart.ddDupes) {
        chart.ddDupes = [];
    }

    // Reset the color and symbol counters after every drilldown. (#19134)
    chart.colorCounter = chart.symbolCounter = 0;

    while (i-- && !seriesOptions) {
        if (
            drilldown.series &&
            drilldown.series[i].id === point.drilldown &&
            point.drilldown &&
            chart.ddDupes.indexOf(point.drilldown) === -1
        ) {
            seriesOptions = drilldown.series[i];
            chart.ddDupes.push(point.drilldown);
        }
    }

    // Fire the event. If seriesOptions is undefined, the implementer can check
    // for seriesOptions, and call addSeriesAsDrilldown async if necessary.
    fireEvent(chart, 'drilldown', {
        point,
        seriesOptions: seriesOptions,
        category: category,
        originalEvent: originalEvent,
        points: (
            typeof category !== 'undefined' &&
            series.xAxis.getDDPoints(category).slice(0)
        )
    } as Drilldown.EventObject, (e: Drilldown.EventObject): void => {
        const chart = e.point.series && e.point.series.chart,
            seriesOptions = e.seriesOptions;

        if (chart && seriesOptions) {
            if (holdRedraw) {
                chart.addSingleSeriesAsDrilldown(e.point, seriesOptions);
            } else {
                chart.addSeriesAsDrilldown(e.point, seriesOptions);
            }
        }
    });
}

/* *
 *
 *  Default Export
 *
 * */

const DrilldownSeries = {
    compose
};

export default DrilldownSeries;
