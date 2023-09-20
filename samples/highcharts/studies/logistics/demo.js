/**
 * An advanced example of how to use a gantt chart to plan and visualize
 * resources in logistics, in this case shipping.
 * The chart displays a set of vessels and its scheduled journeys.
 * The journeys can consist of one or more laps, which in itself contains
 * loading, voyage, and unloading, these can be moved or resized.
 * The chart also includes custom indicators like the Heat Indicator which
 * displays when the vessels idle time goes above a threshold, and the
 * Earliest Possible Return Indicator which displays when the vessel can return
 * if it travels by maximum speed.
 */

/**
 * --- Logistics module start
 * This module adds heat indicators, idle time, and earliest possible return
 * indicators.
 */
(function (Highcharts) {
    const draw = (function () {
        const isFn = function (x) {
            return typeof x === 'function';
        };

        /**
         * draw - Handles the drawing of a point.
         * TODO: add type checking.
         *
         * @param  {Object} params Parameters.
         * @return {undefined} Returns undefined.
         */
        const draw = function draw(params) {
            const point = this;

            let graphic = point.graphic;

            const animate = params.animate,
                attr = params.attr,
                onComplete = params.onComplete,
                css = params.css || {},
                group = params.group,
                renderer = params.renderer,
                shape = params.shapeArgs,
                type = params.shapeType;

            if (point.shouldDraw()) {
                if (!graphic) {
                    point.graphic = graphic = renderer[type](shape).add(group);
                }
                graphic.css(css).attr(attr)
                    .animate(animate, undefined, onComplete);
            } else if (graphic) {
                graphic.animate(animate, undefined, function () {
                    point.graphic = graphic = graphic.destroy();
                    if (isFn(onComplete)) {
                        onComplete();
                    }
                });
            }
            if (graphic) {
                graphic.addClass(point.getClassName(), true);
            }
        };
        return draw;
    }());

    const renderHeatIndicators = (function (Highcharts, draw) {

        const extend = Highcharts.extend,
            isFunction = function (x) {
                return typeof x === 'function';
            },
            isNumber = Highcharts.isNumber,
            merge = Highcharts.merge,
            objectEach = Highcharts.objectEach;

        const defaultOptions = {
            color: {
                linearGradient: {
                    x1: 0,
                    x2: 1,
                    y1: 0,
                    y2: 0
                },
                stops: [
                    [0, 'rgb(255, 255, 255)'],
                    [0.8, 'rgb(255, 0, 0)']
                ]
            }
        };

        const HeatIndicator = function (params) {
            const indicator = this;
            indicator.init(params);
            return indicator;
        };

        HeatIndicator.prototype = {
            destroy: function () {
                const indicator = this;

                if (indicator.graphic) {
                    indicator.graphic = indicator.graphic.destroy();
                }

                objectEach(indicator, function (val, key) {
                    indicator[key] = null;
                    delete indicator[key];
                });

                return undefined;
            },
            draw: draw,
            getClassName: function () {
                return 'highcharts-heat-indicator';
            },
            init: function (params) {
                const indicator = this;

                // Set properties on the indicator.
                extend(indicator, {
                    group: params.group,
                    metrics: params.metrics,
                    renderer: params.renderer,
                    xAxis: params.xAxis,
                    yAxis: params.yAxis
                });

                indicator.options = merge(defaultOptions, params.options);

                // Return a reference to the indicator.
                return indicator;
            },
            render: function () {
                const indicator = this,
                    metrics = indicator.metrics,
                    xAxis = indicator.xAxis,
                    yAxis = indicator.yAxis,
                    options = indicator.options,
                    start = isNumber(indicator.start) ?
                        indicator.start : xAxis.min,
                    end = isNumber(indicator.end) ?
                        indicator.end : xAxis.max,
                    x1 = xAxis.translate(start < end ? start : end, 0, 0, 0, 1),
                    x2 = xAxis.translate(start < end ? end : start, 0, 0, 0, 1),
                    plotY = yAxis.translate(indicator.y, 0, 1, 0, 1),
                    y1 = plotY,
                    y2 = plotY + metrics.width / 2,
                    animate = {},
                    attr = {
                        fill: options.color
                    };

                // Animate only the width if the graphic is new.
                if (!indicator.graphic) {
                    extend(attr, {
                        x: x1,
                        y: y1,
                        width: 0,
                        height: y2 - y1
                    });
                    animate.width = x2 - x1;
                } else {
                    extend(animate, {
                        x: x1,
                        y: y1,
                        width: x2 - x1,
                        height: y2 - y1
                    });
                }

                // Draw or destroy the graphic
                indicator.draw({
                    animate: animate,
                    attr: attr,
                    css: undefined,
                    group: indicator.group,
                    renderer: indicator.renderer,
                    shapeArgs: undefined,
                    shapeType: 'rect'
                });
            },
            shouldDraw: function () {
                const indicator = this,
                    options = indicator.options || {},
                    filter = options.filter,
                    start = indicator.start,
                    end = indicator.end,
                    y = indicator.y;

                return (
                    options.enabled === true &&
                    isNumber(start) &&
                    isNumber(end) &&
                    isNumber(y) &&
                    start < end &&
                    (isFunction(filter) ? filter(indicator) : true)
                );
            },
            update: function (params) {
                const indicator = this;
                extend(indicator, params);
                this.render();
            }
        };

        const calculateSeriesIdleTime = function (series) {
            const points = series.points
                    .slice() // Make a copy before sorting.
                    .sort(function (a, b) {
                        return b.start - a.start;
                    }),
                xAxis = series.xAxis,
                min = xAxis.min,
                firstPoint = points[points.length - 1].start,
                max = xAxis.max;
            let totalIdle = firstPoint > min ? firstPoint - min : 0;

            points.reduce((next, current) => {
                const start = current.end,
                    end = next ? next.start : max,
                    idle = (start < end) ? end - start : 0;
                let visibleIdle = Math.min(end, max) - Math.max(start, min);
                visibleIdle = visibleIdle > 0 ? visibleIdle : 0;
                current.idle = idle;
                totalIdle += visibleIdle;
                return current;
            }, undefined);
            series.idle = totalIdle;
        };

        const renderHeatIndicators = function (series) {
            const options = series.options &&
                 series.options.heatIndicator || {};

            // TODO Several modules are dependent upon this, it should be added
            // as a dependency somehow.
            calculateSeriesIdleTime(series);

            series.points.forEach(point => {
                // Get existing indicator from point, or create a new one.
                const heatIndicator = point.heatIndicator || new HeatIndicator({
                    group: series.group,
                    metrics: series.columnMetrics,
                    xAxis: series.xAxis,
                    yAxis: series.yAxis,
                    options: options,
                    renderer: series.chart.renderer
                });

                // Update the indicator. Rerenders the graphic with new values.
                heatIndicator.update({
                    y: point.y,
                    start: point.end,
                    end: point.end + point.idle
                });

                // Set the resulting indicator on the point.
                point.heatIndicator = heatIndicator;
            });
        };

        return renderHeatIndicators;
    }(Highcharts, draw));

    const renderEPRIndicators = (function (Highcharts, draw) {

        const objectEach = Highcharts.objectEach,
            extend = Highcharts.extend,
            isNumber = Highcharts.isNumber,
            merge = Highcharts.merge;

        const defaultOptions = {
            color: 'rgb(255, 0, 0)',
            lineWidth: 1,
            dashstyle: 'dash'
        };

        const EPRIndicator = function (params) {
            const indicator = this;
            indicator.init(params);
            return indicator;
        };

        EPRIndicator.prototype = {
            destroy: function () {
                const indicator = this;

                if (indicator.graphic) {
                    indicator.graphic = indicator.graphic.destroy();
                }

                objectEach(indicator, function (val, key) {
                    indicator[key] = null;
                    delete indicator[key];
                });

                return undefined;
            },
            draw: draw,
            getClassName: function () {
                return 'highcharts-eap-indicator';
            },
            init: function (params) {
                const indicator = this;

                // Set properties on the indicator.
                extend(indicator, {
                    group: params.group,
                    metrics: params.metrics,
                    renderer: params.renderer,
                    xAxis: params.xAxis,
                    yAxis: params.yAxis
                });

                indicator.options = merge(defaultOptions, params.options);

                // Return a reference to the indicator.
                return indicator;
            },
            render: function () {
                const indicator = this,
                    renderer = indicator.renderer,
                    metrics = indicator.metrics,
                    options = indicator.options,
                    lineWidth = options.lineWidth,
                    plotX = indicator.xAxis.translate(indicator.x, 0, 0, 0, 1),
                    plotY = indicator.yAxis.translate(indicator.y, 0, 1, 0, 1),
                    x1 = plotX,
                    x2 = plotX,
                    y1 = plotY - metrics.width / 2,
                    y2 = plotY + metrics.width / 2,
                    path = renderer.crispLine(
                        [['M', x1, y1], ['L', x2, y2]], lineWidth
                    ),
                    attr = {
                        stroke: options.color,
                        'stroke-width': lineWidth,
                        dashstyle: options.dashstyle
                    },
                    animate = {};

                // Animate if the graphic is not new.
                if (!indicator.graphic) {
                    attr.d = path;
                } else {
                    animate.d = path;
                }

                // Draw or destroy the graphic
                indicator.draw({
                    animate: animate,
                    attr: attr,
                    css: undefined,
                    group: indicator.group,
                    renderer: indicator.renderer,
                    shapeArgs: undefined,
                    shapeType: 'path'
                });
            },
            shouldDraw: function () {
                const indicator = this,
                    x = indicator.x,
                    y = indicator.y;

                return (
                    indicator.enabled === true && isNumber(x) && isNumber(y)
                );
            },
            update: function (params) {
                const indicator = this;
                extend(indicator, params);
                this.render();
            }
        };

        const renderEPRIndicators = function (series) {
            series.points.forEach(point => {
                const options = point.options && point.options.indicator || {},
                    // point.options.indicator is copied to point.indicator, so
                    // we use point.indicatorObj instead.
                    indicator = point.indicatorObj || new EPRIndicator({
                        group: series.group,
                        metrics: series.columnMetrics,
                        xAxis: series.xAxis,
                        yAxis: series.yAxis,
                        renderer: series.chart.renderer
                    });
                indicator.update({
                    enabled: options.enabled,
                    x: options.x ? point.start + options.x : point.start,
                    y: point.y
                });

                point.indicatorObj = indicator;
            });
        };

        return renderEPRIndicators;
    }(Highcharts, draw));

    (function (Highcharts, renderHeatIndicators, renderEPRIndicators) {
        const Series = Highcharts.Series;
        // Add heat indicator functionality to Highcharts Series.
        Highcharts.addEvent(Series, 'afterRender', function () {
            const series = this;
            renderEPRIndicators(series);
            renderHeatIndicators(series);
        });
    }(Highcharts, renderHeatIndicators, renderEPRIndicators));

}(Highcharts));

/**
 * --- Logistics module end
 */

/**
 * Variables
 */
const today = +Date.now(),
    minutes = 60 * 1000,
    hours = 60 * minutes,
    days = 24 * hours,
    dateFormat = function (date) {
        const format = '%e. %b';
        return Highcharts.dateFormat(format, date);
    },
    find = Highcharts.find,
    xAxisMin = today - (10 * days),
    xAxisMax = xAxisMin + 90 * days;

/**
 * The data used in this visualization.
 */
const data = {
    // The different events in a lap of a journey.
    events: {
        loading: {
            color: '#395627',
            tooltipFormatter: function (point) {
                return [
                    '<b>Loading</b><br/>',
                    'Start: ' + dateFormat(point.start) + '<br/>',
                    'End: ' + dateFormat(point.end) + '<br/>'
                ].join('');
            }
        },
        voyage: {
            color: '#558139',
            tooltipFormatter: function (point) {
                const indicator = point.indicator;
                return [
                    '<b>Voyage</b><br/>',
                    'Start: (' + point.startLocation + ') ' +
                        dateFormat(point.start) + '<br/>',
                    'End: (' + point.endLocation + ') ' +
                        dateFormat(point.end) + '<br/>',
                    indicator ? 'EPR: ' + dateFormat(indicator.x) : ''
                ].join('');
            }
        },
        unloading: {
            color: '#aad091',
            tooltipFormatter: function (point) {
                return [
                    '<b>Unloading</b><br/>',
                    'Start: ' + dateFormat(point.start) + '<br/>',
                    'End: ' + dateFormat(point.end) + '<br/>'
                ].join('');
            }
        }
    },
    // All the vessels and its sceduled journeys
    vessels: [{
        name: 'Vessel 1',
        journeys: [{
            name: 'Contract 1',
            start: today + days,
            laps: [{
                duration: 21 * days,
                startLocation: 'USGLS',
                endLocation: 'BEZEE',
                loadDuration: 1 * days + 2 * hours + 45 * minutes,
                unloadDuration: 1 * days + 2 * hours + 45 * minutes
            }, {
                duration: 11 * days,
                startLocation: 'BEZEE',
                endLocation: 'USCP6',
                loadDuration: 0,
                unloadDuration: 0,
                color: '#c6dfb6'
            }]
        }, {
            name: 'Contract 5',
            start: today + 50 * days,
            laps: [{
                duration: 7 * days,
                startLocation: 'USGLS',
                endLocation: 'BEZEE',
                loadDuration: 2 * days + 2 * hours + 45 * minutes,
                unloadDuration: 1 * days + 2 * hours + 45 * minutes
            }, {
                duration: 7 * days,
                startLocation: 'BEZEE',
                endLocation: 'USCP6',
                loadDuration: 0,
                unloadDuration: 1 * days + 4 * hours,
                color: '#c6dfb6'
            }, {
                duration: 19 * days,
                startLocation: 'USCP6',
                endLocation: 'NOVIS',
                loadDuration: 0,
                unloadDuration: 0
            }]
        }]
    }, {
        name: 'Vessel 2',
        journeys: [{
            name: 'Contract 2',
            start: today - 5 * days,
            laps: [{
                duration: 13 * days,
                startLocation: 'USGLS',
                endLocation: 'BEZEE',
                loadDuration: 2 * days + 2 * hours + 45 * minutes,
                unloadDuration: 2 * days + 2 * hours + 45 * minutes
            }, {
                duration: 8 * days,
                startLocation: 'BEZEE',
                endLocation: 'USCP6',
                loadDuration: 0,
                unloadDuration: 0,
                color: '#c6dfb6'
            }],
            earliestPossibleReturn: (today - 5 * days) + 20 * days
        }, {
            name: 'Contract 3',
            start: today + 23 * days,
            laps: [{
                duration: 5 * days,
                startLocation: 'USGLS',
                endLocation: 'BEZEE',
                loadDuration: 2 * days + 2 * hours + 45 * minutes,
                unloadDuration: 2 * days + 2 * hours + 45 * minutes
            }, {
                duration: 14 * days,
                startLocation: 'BEZEE',
                endLocation: 'USCP6',
                loadDuration: 0,
                unloadDuration: 0,
                color: '#c6dfb6'
            }]
        }, {
            name: 'Contract 4',
            start: today + 60 * days,
            laps: [{
                duration: 11 * days,
                startLocation: 'USGLS',
                endLocation: 'BEZEE',
                loadDuration: 2 * days + 2 * hours + 45 * minutes,
                unloadDuration: 2 * days + 2 * hours + 45 * minutes
            }, {
                duration: 6 * days,
                startLocation: 'BEZEE',
                endLocation: 'USCP6',
                loadDuration: 0,
                unloadDuration: 0,
                color: '#c6dfb6'
            }]
        }]
    }]
};

/**
 * Creates a point in a lap.
 */
const getPoint = function (params) {
    const start = params.start,
        tripName = params.tripName,
        type = params.type,
        vessel = params.vessel,
        duration = params.duration,
        voyage = params.voyage,
        earliestPossibleReturn = params.epr,
        end = start + duration;

    const indicator = (
        (
            Highcharts.isNumber(earliestPossibleReturn) &&
            start < earliestPossibleReturn &&
            earliestPossibleReturn < end
        ) ?
            {
                enabled: true,
                x: earliestPossibleReturn - start
            } :
            undefined
    );

    return {
        start: start,
        end: end,
        color: voyage && voyage.color || data.events[type].color,
        vessel: vessel.name,
        indicator: indicator,
        y: params.y,
        type: type,
        startLocation: voyage && voyage.startLocation,
        endLocation: voyage && voyage.endLocation,
        name: tripName,
        trip: tripName,
        dragDrop: {
            draggableStart: type === 'voyage',
            draggableEnd: type === 'voyage'
        }
    };
};

/**
 * Creates a set of points based on a lap. These points are grouped together.
 */
const getGroupFromTrip = function (trip, vessel, y) {
    return trip.laps.reduce(function (group, voyage) {
        const points = [];

        if (voyage.loadDuration) {
            points.push(getPoint({
                start: group.end,
                duration: voyage.loadDuration,
                tripName: trip.name,
                type: 'loading',
                vessel: vessel,
                y: y
            }));
            group.end += voyage.loadDuration;
        }

        points.push(getPoint({
            start: group.end,
            duration: voyage.duration,
            voyage: voyage,
            epr: trip.earliestPossibleReturn,
            tripName: trip.name,
            type: 'voyage',
            vessel: vessel,
            y: y
        }));
        group.end += voyage.duration;

        if (voyage.unloadDuration) {
            points.push(getPoint({
                start: group.end,
                duration: voyage.unloadDuration,
                tripName: trip.name,
                type: 'unloading',
                vessel: vessel,
                y: y
            }));
            group.end += voyage.unloadDuration;
        }

        // Add the points
        group.points = group.points.concat(points);
        return group;
    }, {
        end: trip.start, // Previous point end
        points: []
    });
};

/**
 * Parses the data and creates all the series of the chart.
 */
const getSeriesFromInformation = function (info) {
    const vessels = info.vessels;
    return vessels.map(function (vessel, i) {
        const data = vessel.journeys.reduce(function (result, trip) {
            const group = getGroupFromTrip(trip, vessel, i);
            return result.concat(group.points);
        }, []);

        // One series per vessel
        return {
            name: vessel.name,
            data: data,
            id: i
        };
    });
};

/**
 * Modify event to handle modifying other points in group when resizing
 */
const customResize = function (e, chart) {
    const newPoints = e.newPoints,
        defined = Highcharts.defined,
        objectEach = Highcharts.objectEach;

    let start,
        end,
        diff,
        resizePoint;

    if (e.newPoint && defined(e.newPoint.start) !== defined(e.newPoint.end)) {
        start = e.newPoint.start;
        end = e.newPoint.end;
        resizePoint = chart.get(e.newPointId);

        diff = defined(start) && start - resizePoint.options.start ||
                defined(end) && end - resizePoint.options.end;

        objectEach(e.origin.points, function (pointOrigin) {
            const point = pointOrigin.point;
            if (
                point.id !== e.newPointId && (
                    defined(start) && point.end <= resizePoint.options.start ||
                    defined(end) && point.start >= resizePoint.options.end
                )
            ) {
                newPoints[point.id] = {
                    point: point,
                    newValues: {
                        start: point.start + diff,
                        end: point.end + diff
                    }
                };
            }
        });
    }
};

/**
 * Check if new points collide with existing ones
 */
const newPointsColliding = function (newPoints, chart) {
    let y,
        collidePoint;

    const pick = Highcharts.pick,
        groupedPoints = chart.dragDropData && chart.dragDropData.groupedPoints,
        minX = Object.keys(newPoints).reduce((acc, id) => {
            y = pick(newPoints[id].newValues.y, newPoints[id].point.y);
            return Math.min(
                acc, pick(
                    newPoints[id].newValues.start, newPoints[id].point.start
                )
            );
        }, Infinity),
        maxX = Object.keys(newPoints).reduce(function (acc, id) {
            return Math.max(
                acc, pick(newPoints[id].newValues.end, newPoints[id].point.end)
            );
        }, -Infinity),
        newSeries = chart.get(y),
        pointOverlaps = function (point) {
            return point.end >= minX && point.start <= minX ||
                point.start <= maxX && point.end >= maxX ||
                point.start <= minX && point.end >= maxX ||
                point.start >= minX && point.end <= maxX;
        };

    if (newSeries) {
        let i = newSeries.points ? newSeries.points.length : 0;
        while (i--) {
            collidePoint = newSeries.points[i];
            if (
                groupedPoints.indexOf(collidePoint) < 0 &&
                pointOverlaps(collidePoint)
            ) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Add collision detection on move/resize
 */
const customDrag = function (e) {
    const series = this.series,
        chart = series.chart;

    // Handle the resize
    customResize(e, chart);

    // Check collision
    if (newPointsColliding(e.newPoints, chart)) {
        chart.dragDropData.isColliding = true;
        chart.setGuideBoxState('collide', series.options.dragDrop.guideBox);
    } else if (chart.dragDropData) {
        delete chart.dragDropData.isColliding;
        chart.setGuideBoxState('default', series.options.dragDrop.guideBox);
    }
};

/**
 * Implement custom drop. Do normal update, but move points between series when
 * changing their y value.
 */
const customDrop = function (e) {
    const newPoints = e.newPoints,
        chart = this.series.chart,
        defined = Highcharts.defined,
        objectEach = Highcharts.objectEach;

    // Just return if we are colliding.
    if (chart.dragDropData.isColliding) {
        return false;
    }

    // Stop further dragdrops while we update
    chart.isDragDropAnimating = true;

    // Update the points
    objectEach(newPoints, function (update) {
        let newValues = update.newValues,
            oldPoint = update.point;
        const newSeries = defined(newValues.y) ?
            chart.get(newValues.y) : oldPoint.series;

        // Destroy any old heat indicator objects
        if (oldPoint.heatIndicator) {
            oldPoint.heatIndicator =
                oldPoint.heatIndicator.destroy();
        }
        if (oldPoint.indicatorObj) {
            oldPoint.indicatorObj =
                oldPoint.indicatorObj.destroy();
        }

        // Update the point
        if (newSeries !== oldPoint.series) {
            newValues = Highcharts.merge(
                oldPoint.options, newValues
            );
            update.point = oldPoint = oldPoint.remove(false);
            newSeries.addPoint(newValues, false);
        } else {
            oldPoint.update(newValues, false);
        }
    });

    // Redraw with specific animation
    chart.redraw({
        duration: 400
    });
    setTimeout(function () {
        delete chart.isDragDropAnimating;
        if (chart.hoverPoint && !chart.dragHandles) {
            chart.hoverPoint.showDragHandles();
        }
    }, 400);

    // Don't do the default drop
    return false;
};

/**
 * Custom formatter for data labels which are left aligned.
 */
const leftLabelFormatter = function () {
    if (this.point.type === 'voyage') {
        return this.point.startLocation;
    }
};

/**
 * Custom formatter for data labels which are center aligned.
 */
const centerLabelFormatter = function () {
    if (this.point.type === 'voyage') {
        return ' ' + this.point.name + ' ';
    }
};

/**
 * Custom formatter for data labels which are right aligned.
 */
const rightLabelFormatter = function () {
    if (this.point.type === 'voyage') {
        return this.point.endLocation;
    }
};

/**
 * Custom formatter for axis labels displaying the series name.
 */
const gridColumnFormatterSeriesName = function () {
    const chart = this.chart,
        series = chart.get(this.value);
    return series.name;
};

/**
 * Creates a category label and formats it based on the value.
 */
const getCategoryFromIdleTime = function (utilized, idle) {
    const thresholds = {
            25: 'bad',
            50: 'ok',
            75: 'good',
            100: 'great'
        },
        threshold = find(Object.keys(thresholds), function (threshold) {
            return utilized < +threshold;
        }),
        className = thresholds[threshold];
    return [
        '<span class="info-span ' + className + '">',
        '    <span class="utilized">' + utilized + '%</span><br/>',
        '    <span>t: ' + idle + ' days</span>',
        '</span>'
    ].join('\n');
};

/**
 * Custom formatter for axis labels displaying the vessels number of idle days,
 * and its percentage of utilized time.
 */
const gridColumnFormatterSeriesIdle = function () {
    const chart = this.chart,
        series = chart.get(this.value),
        xAxis = series.xAxis,
        total = xAxis.max - xAxis.min,
        idle = series.idle || 0,
        used = total - idle,
        percentage = Math.round((100 / total) * used),
        idleDays = Math.round(idle / days);
    return getCategoryFromIdleTime(percentage, idleDays);
};

/**
 * Custom formatter for the tooltip.
 */
const tooltipFormatter = function () {
    const point = this.point,
        trip = point.trip,
        series = point.series,
        formatter = data.events[point.type].tooltipFormatter;
    return '<b>' + trip + ' - ' + series.name + '</b><br/>' + formatter(point);
};

/**
 * Set the options and create the gantt chart.
 */
Highcharts.ganttChart('container', {
    plotOptions: {
        series: {
            dragDrop: {
                draggableX: true,
                draggableY: true,
                dragMinY: 0,
                dragMaxY: data.vessels.length - 1,
                liveRedraw: false,
                groupBy: 'trip',
                guideBox: {
                    collide: {
                        color: 'rgba(200, 0, 0, 0.4)'
                    }
                }
            },
            heatIndicator: {
                enabled: true,
                filter: function (indicator) {
                    const start = indicator.start,
                        end = indicator.end,
                        idleTime = end - start;
                    return idleTime > (10 * days);
                }
            },
            stickyTracking: true,
            cursor: 'move',
            borderRadius: 0,
            borderWidth: 0,
            pointPadding: 0,
            dataLabels: [{
                enabled: true,
                labelrank: 1,
                formatter: leftLabelFormatter,
                align: 'left',
                style: {
                    fontSize: '8px'
                }
            }, {
                enabled: true,
                labelrank: 2,
                formatter: centerLabelFormatter,
                align: 'center',
                borderWidth: 1,
                padding: 3,
                style: {
                    fontSize: '10px'
                }
            }, {
                enabled: true,
                labelrank: 1,
                formatter: rightLabelFormatter,
                align: 'right',
                style: {
                    fontSize: '8px'
                }
            }],
            point: {
                events: {
                    drag: customDrag,
                    drop: customDrop
                }
            }
        }
    },
    legend: {
        enabled: false
    },
    rangeSelector: {
        enabled: true,
        selected: 1
    },
    scrollbar: {
        enabled: true
    },
    series: getSeriesFromInformation(data),
    tooltip: {
        formatter: tooltipFormatter
    },
    xAxis: [{
        type: 'datetime',
        currentDateIndicator: true,
        grid: false,
        labels: {
            format: undefined
        },
        min: xAxisMin,
        max: xAxisMax,
        tickInterval: undefined
    }],
    yAxis: [{
        type: 'category',
        reversed: true,
        maxPadding: 0,
        staticScale: 100,
        labels: {
            useHTML: true
        },
        grid: {
            enabled: true,
            columns: [{
                labels: {
                    formatter: gridColumnFormatterSeriesName
                }
            }, {
                labels: {
                    formatter: gridColumnFormatterSeriesIdle
                }
            }]
        }
    }]
});