QUnit.test('minRange with log axis', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            type: 'column'
        },
        yAxis: {
            type: 'logarithmic',
            minRange: 1000
        },
        series: [
            {
                data: [
                    7937,
                    9689,
                    9204,
                    9087,
                    12400,
                    11520,
                    8781,
                    11637,
                    10918,
                    8198,
                    10695,
                    11251
                ]
            }
        ]
    });

    assert.strictEqual(
        chart.yAxis[0].ticks['4'].label.element.textContent,
        '10k',
        'Axis label makes sense'
    );
});

QUnit.test('#14505: minRange NaN with single point series', assert => {
    [
        [
            {
                data: [1]
            },
            {
                data: [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
            },
            {
                data: [4, 8, 5, 8, 5, 7, 6, 4, 5, 3, 3, 2]
            }
        ],
        [
            {
                data: [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
            },
            {
                data: [4, 8, 5, 8, 5, 7, 6, 4, 5, 3, 3, 2]
            },
            {
                data: [1]
            }
        ],
        [
            {
                data: [1]
            }
        ]
    ].forEach(series => {
        const chart = Highcharts.chart('container', { series });

        assert.ok(
            Highcharts.isNumber(chart.xAxis[0].minRange),
            'minRange should be a finite number'
        );
    });
});

QUnit.test('adjustForMinRange', assert => {
    const chart = Highcharts.chart('container', {
        series: [{
            data: [
                { x: 0, y: 4 },
                { x: 1, y: 3 },
                { x: 2, y: 5 },
                { x: 3, y: 6 },
                { x: 4, y: 2 },
                { x: 5, y: 3 }
            ]
        }, {
            data: [
                { x: 6, y: 4 },
                { x: 7, y: 23 },
                { x: 8, y: 5 },
                { x: 9, y: 6 },
                { x: 10, y: 2 },
                { x: 11, y: 3 }
            ]
        }]
    });

    chart.xAxis[0].setExtremes(4, 7);
    const adjusted = [chart.xAxis[0].min, chart.xAxis[0].max];
    chart.series[0].hide();

    assert.deepEqual(
        [chart.xAxis[0].min, chart.xAxis[0].max],
        adjusted,
        '#15975: Zoomed extremes should not re-adjust after hiding series'
    );
});
