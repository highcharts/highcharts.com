/* *
 *
 *  Copyright (c) 2019-2021 Highsoft AS
 *
 *  Boost module: stripped-down renderer for higher performance
 *
 *  License: highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type DataExtremesObject from '../../Core/Series/DataExtremesObject';
import type {
    PointOptions,
    PointShortOptions
} from '../../Core/Series/PointOptions';
import type { SeriesTypePlotOptions } from '../../Core/Series/SeriesType';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import Chart from '../../Core/Chart/Chart.js';
import D from '../../Core/DefaultOptions.js';
const { getOptions } = D;
import Point from '../../Core/Series/Point.js';
import Series from '../../Core/Series/Series.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const { seriesTypes } = SeriesRegistry;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    error,
    isArray,
    isNumber,
    pick,
    wrap
} = U;

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        /** @requires modules/boost */
        getBoostClipRect(target: Highcharts.BoostTargetObject): BBoxObject;
        /** @requires modules/boost */
        isChartSeriesBoosting(): boolean;
    }
}

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        i?: number;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        alteredByBoost?: Array<Highcharts.BoostAlteredObject>;
        fillOpacity?: boolean;
        isSeriesBoosting?: boolean;
        /** @requires modules/boost */
        destroyGraphics(): void;
        /** @requires modules/boost */
        enterBoost(): void;
        /** @requires modules/boost */
        exitBoost(): void;
        /** @requires modules/boost */
        hasExtremes(checkX?: boolean): boolean;
        /** @requires modules/boost */
        getPoint(boostPoint: (Record<string, number>|Point)): Point;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        boostData?: Array<unknown>;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface BoostAlteredObject {
            own: boolean;
            prop: string;
            val: unknown;
            value: unknown;
        }
    }
}

import '../../Core/DefaultOptions.js';

import butils from './BoostUtils.js';
import boostable from './Boostables.js';
import boostableMap from './BoostableMap.js';

const boostEnabled = butils.boostEnabled,
    shouldForceChartSeriesBoosting = butils.shouldForceChartSeriesBoosting,
    plotOptions = getOptions().plotOptions as SeriesTypePlotOptions;

/**
 * Returns true if the chart is in series boost mode.
 *
 * @function Highcharts.Chart#isChartSeriesBoosting
 *
 * @param {Highcharts.Chart} chart
 *        the chart to check
 *
 * @return {boolean}
 *         true if the chart is in series boost mode
 */
Chart.prototype.isChartSeriesBoosting = function (): boolean {
    let isSeriesBoosting: boolean,
        threshold = pick(
            this.options.boost && this.options.boost.seriesThreshold,
            50
        );

    isSeriesBoosting = threshold <= this.series.length ||
        shouldForceChartSeriesBoosting(this);

    return isSeriesBoosting;
};

/* eslint-disable valid-jsdoc */

/**
 * Get the clip rectangle for a target, either a series or the chart. For the
 * chart, we need to consider the maximum extent of its Y axes, in case of
 * Highcharts Stock panes and navigator.
 *
 * @private
 * @function Highcharts.Chart#getBoostClipRect
 */
Chart.prototype.getBoostClipRect = function (target: Chart): BBoxObject {
    const clipBox = {
        x: this.plotLeft,
        y: this.plotTop,
        width: this.plotWidth,
        height: this.plotHeight
    };

    if (target === this) {
        const verticalAxes = this.inverted ? this.xAxis : this.yAxis; // #14444
        if (verticalAxes.length <= 1) {
            clipBox.y = Math.min(verticalAxes[0].pos, clipBox.y);
            clipBox.height = (
                verticalAxes[0].pos -
                this.plotTop +
                verticalAxes[0].len
            );
        } else {
            clipBox.height = this.plotHeight;
        }
    }

    return clipBox;
};

/**
 * Return a full Point object based on the index.
 * The boost module uses stripped point objects for performance reasons.
 *
 * @function Highcharts.Series#getPoint
 *
 * @param {object|Highcharts.Point} boostPoint
 *        A stripped-down point object
 *
 * @return {Highcharts.Point}
 *         A Point object as per https://api.highcharts.com/highcharts#Point
 */
Series.prototype.getPoint = function (
    boostPoint: (Record<string, number>|Point)
): Point {
    let point: Point = boostPoint as any,
        xData = (
            this.xData || (this.options as any).xData || this.processedXData ||
            false
        );

    if (boostPoint && !(boostPoint instanceof this.pointClass)) {
        point = (new this.pointClass()).init( // eslint-disable-line new-cap
            this,
            (this.options.data as any)[boostPoint.i as any],
            xData ? xData[boostPoint.i as any] : void 0
        );

        point.category = pick(
            this.xAxis.categories ?
                (this.xAxis.categories as any)[point.x as any] :
                point.x, // @todo simplify
            point.x
        );

        point.dist = boostPoint.dist;
        point.distX = boostPoint.distX;
        point.plotX = boostPoint.plotX;
        point.plotY = boostPoint.plotY;
        point.index = boostPoint.i;
        point.isInside = this.isPointInside(boostPoint);
    }

    return point;
};

/* eslint-disable no-invalid-this */

// Return a point instance from the k-d-tree
wrap(Series.prototype, 'searchPoint', function (
    this: Series,
    proceed: Function
): (Point|undefined) {
    return this.getPoint(
        proceed.apply(this, [].slice.call(arguments, 1))
    );
});

// For inverted series, we need to swap X-Y values before running base methods
wrap(Point.prototype, 'haloPath', function (
    this: Point,
    proceed: Function
): SVGPath {
    let halo,
        point = this,
        series = point.series,
        chart = series.chart,
        plotX: number = point.plotX as any,
        plotY: number = point.plotY as any,
        inverted = chart.inverted;

    if (series.isSeriesBoosting && inverted) {
        point.plotX = series.yAxis.len - plotY;
        point.plotY = series.xAxis.len - plotX;
    }

    halo = proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    if (series.isSeriesBoosting && inverted) {
        point.plotX = plotX;
        point.plotY = plotY;
    }

    return halo;
});

wrap(Series.prototype, 'markerAttribs', function (
    this: Series,
    proceed: Function,
    point: Point
): SVGAttributes {
    let attribs: SVGAttributes,
        series = this,
        chart = series.chart,
        plotX: number = point.plotX as any,
        plotY: number = point.plotY as any,
        inverted = chart.inverted;

    if (series.isSeriesBoosting && inverted) {
        point.plotX = series.yAxis.len - plotY;
        point.plotY = series.xAxis.len - plotX;
    }

    attribs = proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    if (series.isSeriesBoosting && inverted) {
        point.plotX = plotX;
        point.plotY = plotY;
    }

    return attribs;
});

/*
 * Extend series.destroy to also remove the fake k-d-tree points (#5137).
 * Normally this is handled by Series.destroy that calls Point.destroy,
 * but the fake search points are not registered like that.
 */
addEvent(Series, 'destroy', function (): void {
    const series = this,
        chart = series.chart;

    if (chart.markerGroup === series.markerGroup) {
        series.markerGroup = null as any;
    }

    if (chart.hoverPoints) {
        chart.hoverPoints = chart.hoverPoints.filter(function (
            point: Point
        ): boolean {
            return point.series === series;
        });
    }

    if (chart.hoverPoint && chart.hoverPoint.series === series) {
        chart.hoverPoint = null as any;
    }
});

/*
 * Do not compute extremes when min and max are set.
 * If we use this in the core, we can add the hook
 * to hasExtremes to the methods directly.
 */
wrap(Series.prototype, 'getExtremes', function (
    this: Series,
    proceed: Function
): DataExtremesObject {
    if (!this.isSeriesBoosting || (!this.hasExtremes || !this.hasExtremes())) {
        return proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    }
    return {};
});

/*
 * Override a bunch of methods the same way. If the number of points is
 * below the threshold, run the original method. If not, check for a
 * canvas version or do nothing.
 *
 * Note that we're not overriding any of these for heatmaps.
 */
[
    'translate',
    'generatePoints',
    'drawTracker',
    'drawPoints',
    'render'
].forEach(function (method: string): void {
    /**
     * @private
     */
    function branch(
        this: Series,
        proceed: Function
    ): void {
        const letItPass = (this.options.stacking || this.type === 'networkgraph') &&
            (method === 'translate' || method === 'generatePoints');

        if (
            !this.isSeriesBoosting ||
            letItPass ||
            !boostEnabled(this.chart) ||
            this.type === 'heatmap' ||
            this.type === 'treemap' ||
            !boostableMap[this.type] ||
            this.options.boostThreshold === 0
        ) {

            proceed.call(this);

        // If a canvas version of the method exists, like renderCanvas(), run
        } else if ((this as any)[method + 'Canvas']) {
            (this as any)[method + 'Canvas']();
        }
    }

    wrap(Series.prototype, method, branch);

    // A special case for some types - their translate method is already wrapped
    if (method === 'translate') {
        [
            'column',
            'bar',
            'arearange',
            'columnrange',
            'heatmap',
            'treemap',
            'networkgraph'
        ].forEach(function (type: string): void {
            if (seriesTypes[type]) {
                wrap(seriesTypes[type].prototype, method, branch);
            }
        });
    }
});

// If the series is a heatmap or treemap, or if the series is not boosting
// do the default behaviour. Otherwise, process if the series has no extremes.
wrap(Series.prototype, 'processData', function (
    this: Series,
    proceed: Function
): void {
    const series = this;

    let dataToMeasure = this.options.data;

    /**
     * Used twice in this function, first on this.options.data, the second
     * time it runs the check again after processedXData is built.
     * If the data is going to be grouped, the series shouldn't be boosted.
     * @private
     */
    function getSeriesBoosting(
        data?: Array<(PointOptions|PointShortOptions)>
    ): boolean {
        // Check if will be grouped.
        if (series.forceCrop) {
            return false;
        }
        return series.chart.isChartSeriesBoosting() || (
            (data ? data.length : 0) >=
            (series.options.boostThreshold || Number.MAX_VALUE)
        );
    }

    if (boostEnabled(this.chart) && boostableMap[this.type]) {

        // If there are no extremes given in the options, we also need to
        // process the data to read the data extremes. If this is a heatmap, do
        // default behaviour.
        if (
            !getSeriesBoosting(dataToMeasure) || // First pass with options.data
            this.type === 'heatmap' ||
            this.type === 'treemap' ||
            this.options.stacking || // processedYData for the stack (#7481)
            !this.hasExtremes ||
            !this.hasExtremes(true)
        ) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            dataToMeasure = this.processedXData;
        }

        // Set the isBoosting flag, second pass with processedXData to see if we
        // have zoomed.
        this.isSeriesBoosting = getSeriesBoosting(dataToMeasure);

        // Enter or exit boost mode
        if (this.isSeriesBoosting) {
            // Force turbo-mode:
            let firstPoint;
            if (this.options.data && this.options.data.length) {
                firstPoint = this.getFirstValidPoint(this.options.data);
                if (!isNumber(firstPoint) && !isArray(firstPoint)) {
                    error(12, false, this.chart);
                }
            }
            this.enterBoost();
        } else if (this.exitBoost) {
            this.exitBoost();
        }

    // The series type is not boostable
    } else {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
    }
});

addEvent(Series, 'hide', function (): void {
    if (this.canvas && this.renderTarget) {
        if (this.ogl) {
            this.ogl.clear();
        }
        this.boostClear();
    }

});

/**
 * Enter boost mode and apply boost-specific properties.
 *
 * @function Highcharts.Series#enterBoost
 */
Series.prototype.enterBoost = function (): void {

    this.alteredByBoost = [];

    // Save the original values, including whether it was an own property or
    // inherited from the prototype.
    ['allowDG', 'directTouch', 'stickyTracking'].forEach(function (
        this: Series,
        prop: string
    ): void {
        (this.alteredByBoost as any).push({
            prop: prop,
            val: (this as any)[prop],
            own: Object.hasOwnProperty.call(this, prop)
        });
    }, this);

    this.allowDG = false;
    this.directTouch = false;
    this.stickyTracking = true;

    // Prevent animation when zooming in on boosted series(#13421).
    this.finishedAnimating = true;

    // Hide series label if any
    if (this.labelBySeries) {
        this.labelBySeries = this.labelBySeries.destroy();
    }
};

/**
 * Exit from boost mode and restore non-boost properties.
 *
 * @function Highcharts.Series#exitBoost
 */
Series.prototype.exitBoost = function (): void {
    // Reset instance properties and/or delete instance properties and go back
    // to prototype
    (this.alteredByBoost || []).forEach(function (
        this: Series,
        setting: Highcharts.BoostAlteredObject
    ): void {
        if (setting.own) {
            (this as any)[setting.prop] = setting.val;
        } else {
            // Revert to prototype
            delete (this as any)[setting.prop];
        }
    }, this);

    // Clear previous run
    if (this.boostClear) {
        this.boostClear();
    }

};

/**
 * @private
 * @function Highcharts.Series#hasExtremes
 */
Series.prototype.hasExtremes = function (checkX?: boolean): boolean {
    const options = this.options,
        data: Array<(PointOptions|PointShortOptions)> = options.data as any,
        xAxis = this.xAxis && this.xAxis.options,
        yAxis = this.yAxis && this.yAxis.options,
        colorAxis = this.colorAxis && this.colorAxis.options;

    return data.length > (options.boostThreshold || Number.MAX_VALUE) &&
            // Defined yAxis extremes
            isNumber(yAxis.min) &&
            isNumber(yAxis.max) &&
            // Defined (and required) xAxis extremes
            (!checkX ||
                (isNumber(xAxis.min) && isNumber(xAxis.max))
            ) &&
            // Defined (e.g. heatmap) colorAxis extremes
            (!colorAxis ||
                (isNumber(colorAxis.min) && isNumber(colorAxis.max))
            );
};

/**
 * If implemented in the core, parts of this can probably be
 * shared with other similar methods in Highcharts.
 *
 * @function Highcharts.Series#destroyGraphics
 */
Series.prototype.destroyGraphics = function (): void {
    let series = this,
        points = this.points,
        point: Point,
        i: number;

    if (points) {
        for (i = 0; i < points.length; i = i + 1) {
            point = points[i];
            if (point && point.destroyElements) {
                if (series.is('networkgraph') && point.dataLabel) {
                    (point as any).dataLabelStr = point.dataLabel.textStr;
                }
                point.destroyElements(); // #7557
            }
        }
    }

    ['graph', 'area', 'tracker'].forEach(function (prop: string): void {
        if ((series as any)[prop]) {
            (series as any)[prop] = (series as any)[prop].destroy();
        }
    });

    if ((this as any).getZonesGraphs) {
        const props: string[][] = (this as any).getZonesGraphs(
            [['graph', 'highcharts-graph']]
        );
        props.forEach((prop): void => {
            const zoneGraph: SVGElement = (this as any)[prop[0]];
            if (zoneGraph) {
                (this as any)[prop[0]] = zoneGraph.destroy();
            }
        });
    }
};

// Set default options
boostable.forEach(
    function (type: string): void {
        if (plotOptions[type]) {
            (plotOptions[type] as any).boostThreshold = 5000;
            (plotOptions[type] as any).boostData = [];
            seriesTypes[type].prototype.fillOpacity = true;
        }
    }
);
