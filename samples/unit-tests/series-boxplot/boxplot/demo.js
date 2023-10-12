QUnit.test(
    'Whiskers set by number and by percentage (string)(#2801)',
    function (assert) {
        $('#container').highcharts({
            chart: {
                type: 'boxplot',
                width: 405
            },
            plotOptions: {
                series: {
                    grouping: false
                }
            },
            series: [
                {
                    whiskerLength: '50%',
                    pointWidth: 50,
                    data: [
                        [760, 801, 848, 895, 965],
                        [760, 801, 848, 895, 965]
                    ]
                },
                {
                    whiskerLength: 42,
                    data: [[2, 760, 801, 848, 895, 965]]
                }
            ]
        });

        var chart = $('#container').highcharts();

        assert.strictEqual(
            chart.series[0].points[0].whiskers.getBBox(true).width,
            25,
            'whiskerLength set by percent'
        );
        assert.strictEqual(
            chart.series[1].points[0].whiskers.getBBox(true).width,
            42,
            'whiskerLength set by number'
        );
    }
);

QUnit.test('Individual fill color (#5770)', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            type: 'boxplot'
        },

        plotOptions: {
            boxplot: {
                fillColor: 'blue'
            }
        },

        series: [
            {
                name: 'Observations',
                data: [
                    {
                        low: 760,
                        q1: 801,
                        median: 848,
                        q3: 895,
                        high: 965,
                        fillColor: 'red'
                    },
                    [733, 853, 939, 980, 1080]
                ]
            }
        ]
    });

    assert.strictEqual(
        chart.series[0].points[0].boxUpperShape.element.getAttribute('fill'),
        'red',
        'Individual fill'
    );
    assert.strictEqual(
        chart.series[0].points[0].boxLowerShape.element.getAttribute('fill'),
        'red',
        'Individual fill'
    );
    assert.strictEqual(
        chart.series[0].points[1].boxUpperShape.element.getAttribute('fill'),
        'blue',
        'Generic fill'
    );
    assert.strictEqual(
        chart.series[0].points[1].boxLowerShape.element.getAttribute('fill'),
        'blue',
        'Generic fill'
    );
});

QUnit.test('Individual fill color (#6796)', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            type: 'boxplot'
        },

        plotOptions: {
            boxplot: {
                fillUpperColor: 'red',
                fillLowerColor: 'blue'
            }
        },

        series: [
            {
                name: 'Observations',
                data: [
                    {
                        low: 760,
                        q1: 801,
                        median: 848,
                        q3: 895,
                        high: 965,
                        fillUpperColor: 'green',
                        fillLowerColor: 'yellow'
                    },
                    [733, 853, 939, 980, 1080]
                ]
            }
        ]
    });

    assert.strictEqual(
        chart.series[0].points[0].boxUpperShape.element.getAttribute('fill'),
        'green',
        'Individual fill'
    );
    assert.strictEqual(
        chart.series[0].points[0].boxLowerShape.element.getAttribute('fill'),
        'yellow',
        'Individual fill'
    );
    assert.strictEqual(
        chart.series[0].points[1].boxUpperShape.element.getAttribute('fill'),
        'red',
        'Generic fill'
    );
    assert.strictEqual(
        chart.series[0].points[1].boxLowerShape.element.getAttribute('fill'),
        'blue',
        'Generic fill'
    );
});



QUnit.test('Individual options and Point.update', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            type: 'boxplot'
        },

        series: [
            {
                data: [[760, 801, 848, 895, 965]]
            }
        ]
    });

    var point = chart.series[0].points[0];
    point.update(
        {
            color: 'red',
            fillColor: '#F0F0E0',
            medianColor: '#0C5DA5',
            medianWidth: 3,
            stemColor: '#A63400',
            stemDashStyle: 'dot',
            stemWidth: 1,
            whiskerColor: '#3D9200',
            whiskerWidth: 3
        },
        true,
        false
    );

    assert.strictEqual(point.boxUpperShape.attr('stroke'), 'red', 'color');
    assert.strictEqual(point.boxLowerShape.attr('stroke'), 'red', 'color');
    assert.strictEqual(
        point.boxUpperShape.attr('fill').toUpperCase(),
        '#F0F0E0',
        'fillColor'
    );
    assert.strictEqual(
        point.boxLowerShape.attr('fill').toUpperCase(),
        '#F0F0E0',
        'fillColor'
    );
    assert.strictEqual(
        point.medianShape.attr('stroke'),
        '#0C5DA5',
        'medianColor'
    );
    assert.strictEqual(
        point.medianShape.attr('stroke-width'),
        3,
        'medianWidth'
    );

    assert.strictEqual(point.stem.attr('stroke'), '#A63400', 'stemColor');

    assert.strictEqual(
        point.stem.attr('stroke-dasharray').replace(/[ px]/g, ''),
        '1,3',
        'stemDashStyle'
    );
    assert.strictEqual(point.stem.attr('stroke-width'), 1, 'stemWidth');
    assert.strictEqual(
        point.whiskers.attr('stroke'),
        '#3D9200',
        'whiskerColor'
    );
    assert.strictEqual(point.whiskers.attr('stroke-width'), 3, 'whiskerWidth');
});

QUnit.test(
    'All-null data point should not affect Y axis scale (#7380)',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                type: 'boxplot'
            },
            series: [
                {
                    name: 'Observations',
                    data: [
                        [], // comment this out to get a plot to show up
                        {
                            x: 1,
                            low: 714,
                            q1: 762,
                            median: 817,
                            q3: 870,
                            high: 918
                        }
                    ]
                }
            ],
            yAxis: {
                endOnTick: false,
                maxPadding: 0
            }
        });

        assert.strictEqual(
            chart.yAxis[0].max,
            918,
            'Y axis max should consider the one valid point'
        );
    }
);

QUnit.test(
    'Individual dash styles for box, median, stem and whisker lines (#13065)',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                type: 'boxplot'
            },

            series: [
                {
                    dashStyle: 'DashDot',
                    medianDashStyle: 'ShortDash',
                    whiskerDashStyle: 'dot',
                    data: [
                        {
                            low: 760,
                            q1: 801,
                            median: 848,
                            q3: 895,
                            high: 965,
                            boxDashStyle: 'dot',
                            medianDashStyle: 'dot',
                            stemDashStyle: 'dot',
                            whiskerDashStyle: 'dot',
                            whiskerWidth: 1,
                            medianWidth: 1
                        },
                        {
                            low: 733,
                            q1: 853,
                            median: 939,
                            q3: 980,
                            high: 1080
                        }
                    ]
                }
            ]
        });

        var series = chart.series[0],
            firstPoint = series.points[0],
            secondPoint = series.points[1];

        ['boxUpperShape', 'boxLowerShape', 'medianShape', 'stem', 'whiskers'].forEach(function (elem) {
            assert.strictEqual(
                firstPoint[elem].attr('stroke-dasharray'),
                '1,3',
                'Dot dashStyle should be applied to the first point\'s ' +
                    elem +
                    '.'
            );
        });

        assert.strictEqual(
            secondPoint.medianShape.attr('stroke-dasharray'),
            '6,2',
            'ShortDash dashStyle should be applied to the second point\'s median.'
        );

        assert.strictEqual(
            secondPoint.whiskers.attr('stroke-dasharray'),
            '2,6',
            'Dot dashStyle should be applied to the second point\'s whiskers.'
        );

        assert.strictEqual(
            secondPoint.boxUpperShape.attr('stroke-dasharray'),
            '4,3,1,3',
            "DashDot dashStyle should be applied to the second point's box."
        );
        assert.strictEqual(
            secondPoint.boxLowerShape.attr('stroke-dasharray'),
            '4,3,1,3',
            'DashDot dashStyle should be applied to the second point\'s box.'
        );

        assert.strictEqual(
            secondPoint.stem.attr('stroke-dasharray'),
            '4,3,1,3',
            'DashDot dashStyle should be applied to the second point\'s stem.'
        );
    }
);

QUnit.test('All values should be draggable (#13576)', function (assert) {
    const chart = Highcharts.chart('container', {
        chart: {
            type: 'boxplot'
        },
        series: [
            {
                dragDrop: {
                    draggableY: true,
                    draggableQ1: true,
                    draggableQ3: true,
                    draggableLow: true,
                    draggableHigh: true
                },
                data: [
                    [700, 750, 848, 905, 965],
                    [650, 700, 939, 1080, 1180]
                ]
            }
        ]
    });

    const point = chart.series[0].points[0];
    let result;

    point.showDragHandles();

    const highHandleY = chart.dragHandles.draggableHigh.translateY,
        lowHandleY = chart.dragHandles.draggableLow.translateY,
        Q1HandleY = chart.dragHandles.draggableQ1.translateY,
        Q3HandleY = chart.dragHandles.draggableQ3.translateY;

    if (
        Math.abs(highHandleY - point.highPlot) <= 1 &&
        Math.abs(lowHandleY - point.lowPlot) <= 1 &&
        Math.abs(Q1HandleY - point.q1Plot) <= 1 &&
        Math.abs(Q3HandleY - point.q3Plot) <= 1
    ) {
        result = true;
    }

    assert.ok(result, 'Drag handles are rendered in correct positions.');
});
