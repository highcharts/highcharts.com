// Data
const global = [
        73, 73, 74, 75, 76, 78, 79, 80, 82, 83, 83, 84, 84, 84, 85, 85,
        85, 85, 85, 86, 82, 80
    ],
    africa = [
        54, 55, 59, 61, 62, 65, 66, 69, 71, 74, 72, 70, 71, 70, 71, 72,
        73, 73, 73, 74, 71, 70
    ],
    europe = [
        94, 94, 93, 92, 95, 95, 95, 96, 96, 95, 95, 95, 95, 96, 94, 94,
        94, 93, 94, 95, 94, 94
    ],
    seAsia = [
        64, 65, 65, 66, 66, 71, 72, 73, 75, 78, 80, 82, 83, 85, 87, 88,
        87, 90, 91, 90, 85, 82
    ];

// Highcharts plugin that synchronizes axes and tooltips between charts
// Updated 2024-06-18
(() => {

    const shouldAxesSync = (axis1, axis2) => (
        axis1.options.custom &&
        axis1.options.custom.syncGroup &&
        axis1.options.custom.syncGroup === (
            axis2.options.custom &&
            axis2.options.custom.syncGroup
        )
    );

    // When zoomed out, make sure all chart axes' extremes are set to the union
    // of aligned axes.
    const alignToUnionDataExtremes = function (e) {
        const extremes = Highcharts.charts.reduce((extremes, chart) => {

            if (this.xAxis && shouldAxesSync(chart.xAxis[0], this.xAxis[0])) {
                extremes.xMin = Math.min(
                    extremes.xMin,
                    chart.xAxis[0].dataMin
                );
                extremes.xMax = Math.max(
                    extremes.xMax,
                    chart.xAxis[0].dataMax
                );
            }

            if (this.yAxis && shouldAxesSync(chart.yAxis[0], this.yAxis[0])) {
                extremes.yMin = Math.min(
                    extremes.yMin,
                    chart.yAxis[0].dataMin
                );
                extremes.yMax = Math.max(
                    extremes.yMax,
                    chart.yAxis[0].dataMax
                );
            }

            return extremes;

        }, {
            xMin: Infinity,
            xMax: -Infinity,
            yMin: Infinity,
            yMax: -Infinity
        });

        Highcharts.charts.forEach(chart => {
            if (this.xAxis && shouldAxesSync(chart.xAxis[0], this.xAxis[0])) {
                chart.xAxis[0].setExtremes(extremes.xMin, extremes.xMax);
            }
            if (this.yAxis && shouldAxesSync(chart.yAxis[0], this.yAxis[0])) {
                chart.yAxis[0].setExtremes(extremes.yMin, extremes.yMax);
            }
        });
    };

    // On loading the last chart, find the union extremes of all charts and
    // update each
    Highcharts.addEvent(Highcharts.Chart, 'load', alignToUnionDataExtremes);

    // When the extremes of either axis is are changed, cascade to the
    // corresponding axis of the other charts.
    Highcharts.addEvent(Highcharts.Axis, 'afterSetExtremes', e => {
        const axis = e.target;
        if (e.trigger === 'zoom') {
            Highcharts.charts.forEach(chart => {
                if (chart !== axis.chart) {
                    const otherAxis = chart[e.target.coll][0];
                    if (shouldAxesSync(axis, otherAxis)) {
                        otherAxis.setExtremes(e.min, e.max);
                    }
                }
            });
        }
    });

    // Use a common reset-zoom button
    Highcharts.addEvent(Highcharts.Chart, 'beforeShowResetZoom', () => {
        const btn = document.getElementById('reset-zoom');
        btn.classList.add('visible');
        if (!btn.classList.contains('initialized')) {
            btn.addEventListener('click', () => {
                Highcharts.charts.forEach(chart => chart.zoomOut());
                alignToUnionDataExtremes.call(Highcharts.charts.at(-1));
                btn.classList.remove('visible');
            });
        }
        btn.classList.add('initialized');

        return false;
    });


    // Use a common tooltip
    let triggerPoint;
    Highcharts.addEvent(Highcharts.Tooltip, 'refresh', e => {
        if (!triggerPoint) {
            const triggerChart = e.target.chart;
            triggerPoint = triggerChart.hoverPoint;
            Highcharts.charts
                .filter(chart => chart !== triggerChart)
                .forEach(chart => {
                    const matchingPoint = chart.series[0].points.find(p =>
                        p.x === triggerPoint.x
                    );
                    if (matchingPoint) {
                        matchingPoint.onMouseOver();
                    }
                });
            triggerPoint = undefined;
        }
    });

})();

Highcharts.setOptions({
    chart: {
        marginLeft: 50, // Keep all charts left aligned
        spacingTop: 20,
        spacingBottom: 20,
        type: 'area',
        zoomType: 'xy'
    },
    yAxis: {
        title: {
            text: null
        },
        tickAmount: 4
    },
    xAxis: {
        type: 'datetime'
    },
    legend: {
        enabled: false
    },
    colors: ['#37D5D6'],
    plotOptions: {
        area: {
            pointStart: Date.UTC(2000, 0, 1),
            pointIntervalUnit: 'year',
            fillColor: {
                linearGradient: {
                    x1: 0,
                    x2: 0,
                    y1: 0,
                    y2: 1
                },
                stops: [
                    [0, '#37D5D6'],
                    [1, '#37D5D600']
                ]
            }
        }
    }
});

Highcharts.chart('container-world', {
    chart: {
        otherChartsFollowAxes: true,
        zooming: {
            type: 'xy'
        }
    },
    title: {
        text: 'Polio (Pol3) immunization coverage among 1-year-olds (%) '
    },
    subtitle: {
        text: 'Source: https://apps.who.int/gho/data/'
    },
    xAxis: {
        custom: {
            syncGroup: 'x-wide'
        }
    },
    series: [{
        data: global,
        name: 'Global'
    }]
});

Highcharts.chart('container-south-east-asia', {
    chart: {
        zoomType: 'x'
    },
    title: {
        text: 'South-East Asia'
    },
    xAxis: {
        custom: {
            syncGroup: 'x-wide'
        }
    },
    series: [{
        data: seAsia,
        name: 'South-East Asia'
    }]
});

Highcharts.chart('container-africa', {
    chart: {
        zoomType: 'y'
    },
    yAxis: {
        custom: {
            syncGroup: 'y'
        }
    },
    title: {
        text: 'Africa'
    },
    series: [{
        data: africa,
        name: 'Africa',
        pointStart: Date.UTC(2010, 0, 1)
    }]
});

Highcharts.chart('container-europe', {
    chart: {
        zoomType: 'y'
    },
    yAxis: {
        custom: {
            syncGroup: 'y'
        }
    },
    title: {
        text: 'Europe'
    },
    series: [{
        data: europe,
        name: 'Europe'
    }]
});
