QUnit.test('Bubble positions', function (assert) {
    var data,
        series,
        round = Math.round,
        chart = Highcharts.chart('container', {
            chart: {
                type: 'packedbubble',
                width: 500,
                height: 500,

                // Hard coded plot area for browser consistency
                marginTop: 46,
                marginBottom: 53
            },
            plotOptions: {
                packedbubble: {
                    useSimulation: false
                }
            },
            series: [
                {
                    data: [50, 80, 50]
                }
            ]
        });
    series = chart.series[0];
    data = series.data;
    assert.deepEqual(
        series
            .placeBubbles([
                [null, null, 35, 0, 0],
                [null, null, 50, 0, 1],
                [null, null, 35, 0, 2]
            ])
            .map(function (p) {
                return [
                    round(p[0]),
                    round(p[1]),
                    round(p[2]),
                    round(p[3]),
                    round(p[4])
                ];
            }),
        [
            [0, 0, 104, 0, 1],
            [0, -177, 73, 0, 0],
            [133, -117, 73, 0, 2]
        ],
        'Positions are correct'
    );
    assert.strictEqual(
        data[0].marker.radius >= 73 &&
            data[0].marker.radius <= 78 &&
            data[1].marker.radius >= 98 &&
            data[1].marker.radius <= 102 &&
            data[2].marker.radius >= 73 &&
            data[2].marker.radius <= 78,
        true,
        'Radius are correct'
    );
    chart.update({
        plotOptions: {
            packedbubble: {
                useSimulation: true,
                layoutAlgorithm: {
                    enableSimulation: false
                },
                minSize: '1%',
                maxSize: '1%',
                dataLabels: {
                    allowOverlap: true,
                    enabled: true,
                    formatter: function () {
                        return 'Custom Label';
                    }
                }
            }
        },
        series: [
            {
                data: [
                    {
                        x: 1,
                        y: 1,
                        value: 1
                    },
                    {
                        x: 1,
                        y: 1,
                        value: 1
                    }
                ]
            }
        ]
    });
    series = chart.series[0];
    data = series.data;

    assert.notEqual(
        data[1].dataLabels[0].visibility,
        'hidden',
        'dataLabels are visible with allowOverlap set to true'
    );

    chart.update({
        plotOptions: {
            packedbubble: {
                dataLabels: {
                    enabled: true
                },
                useSimulation: false
            }
        },
        legend: {
            align: 'right'
        },
        series: [{
            data: [500, 600, 700, 300, 200]
        }]
    });

    assert.strictEqual(
        chart.series[0].group.translateX,
        chart.series[0].dataLabelsGroup.translateX,
        `Series group and data labels group should have the same translated
        position (#20120).`
    );

    chart.update({
        legend: {
            align: 'left'
        }
    });

    assert.strictEqual(
        chart.series[0].group.translateX,
        chart.series[0].dataLabelsGroup.translateX,
        `Series group and data labels group should have the same translated
        position after changing the legend position (#20120).`
    );
});

QUnit.test('PackedBubble layout simulation', function (assert) {

    var chart = Highcharts.chart('container', {
        chart: {
            type: 'packedbubble',
            height: 600,
            width: 600,
            marginTop: 46,
            marginBottom: 53
        },
        plotOptions: {
            packedbubble: {
                useSimulation: true,
                minSize: '30%',
                layoutAlgorithm: {
                    enableSimulation: false
                }
            }
        },
        series: [{
            data: [{
                value: 7
            }, {
                value: 7
            }]
        }]
    });

    assert.strictEqual(
        chart.series[0].data[0].temperature > 0,
        true,
        'Bubbles should not get stuck during simulation (#14439).'
    );
});

QUnit.test('PackedBubble hover and dehover (#12537)', function (assert) {
    const chart = Highcharts.chart('container', {
        chart: {
            type: 'packedbubble'
        },
        plotOptions: {
            packedbubble: {
                minSize: '20%',
                maxSize: '100%',
                zMin: 0,
                zMax: 1000,
                lineWidth: 10,
                layoutAlgorithm: {
                    splitSeries: true,
                    enableSimulation: false
                }
            }
        },
        series: [{
            value: 1

        }, {
            value: 2
        }]
    });

    const bubbleOne = chart.series[0].parentNode,
        bubbleTwo = chart.series[1].parentNode;

    bubbleOne.onMouseOver();
    bubbleTwo.onMouseOver();

    const lineWidth = bubbleOne.graphic['stroke-width'];
    assert.strictEqual(
        lineWidth,
        10,
        'Linewidth should go back to 10 after de-hovering.'
    );
});
