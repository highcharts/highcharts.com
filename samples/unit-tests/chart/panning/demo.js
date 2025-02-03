QUnit.test('Panning inverted chart(#4077)', function (assert) {
    var chart = Highcharts.chart('container', {
            chart: {
                type: 'bar',
                zoomType: 'x',
                panning: true,
                panKey: 'shift',
                width: 600,
                height: 400,
                animation: false
            },

            title: {
                text: 'Zooming and panning'
            },

            subtitle: {
                text: 'Click and drag to zoom in. Hold down shift key to pan.'
            },
            yAxis: {
                min: 0, max: 250

            },
            xAxis: {
                categories: [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec'
                ]
            },

            series: [
                {
                    data: [
                        29.9,
                        71.5,
                        106.4,
                        129.2,
                        144.0,
                        176.0,
                        135.6,
                        148.5,
                        216.4,
                        194.1,
                        95.6,
                        54.4
                    ],
                    animation: false
                }
            ]
        }),
        firstZoom = {};


    assert.strictEqual(chart.xAxis[0].min, 0, 'Initial min');
    assert.strictEqual(chart.xAxis[0].max, 11, 'Initial max');
    const controller = new TestController(chart);
    controller.mouseDown(
        200,
        150
    );
    // Zoom
    controller.mouseMove(
        200,
        200
    );
    controller.mouseUp();
    // Zoom

    assert.strictEqual(chart.xAxis[0].min > 0, true, 'Zoomed min');
    assert.strictEqual(chart.xAxis[0].max < 11, true, 'Zoomed max');

    firstZoom = chart.xAxis[0].getExtremes();

    // // Pan
    controller.mouseDown(
        200,
        150, { shiftKey: true }
    );
    // Zoom
    controller.mouseMove(
        200,
        50, { shiftKey: true }
    );
    controller.mouseUp();
    assert.strictEqual(chart.xAxis[0].min > firstZoom.min, true, 'Has panned');
    assert.strictEqual(
        (chart.xAxis[0].max - chart.xAxis[0].min).toFixed(2),
        (firstZoom.max - firstZoom.min).toFixed(2),
        'Has preserved range'
    );

});

QUnit.test('Zoom and pan key', function (assert) {
    var chart = Highcharts.chart('container', {
            chart: {
                type: 'line',
                zoomType: 'xy',
                panning: {
                    enabled: true,
                    type: 'xy'
                },
                panKey: 'shift'
            },

            title: {
                text: 'Zooming and panning'
            },

            subtitle: {
                text: 'Click and drag to zoom in. Hold down shift key to pan.'
            },

            xAxis: {
                categories: [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec'
                ],
                reversed: true // #7857
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false
            },

            series: [
                {
                    data: [
                        29.9,
                        71.5,
                        106.4,
                        129.2,
                        144.0,
                        176.0,
                        135.6,
                        148.5,
                        216.4,
                        194.1,
                        95.6,
                        54.4
                    ]
                }, {
                    data: [20, 300]
                }
            ]
        }),
        controller = new TestController(chart);

    chart.setSize(600, 300);

    assert.strictEqual(chart.xAxis[0].min, 0, 'Initial min');
    assert.strictEqual(chart.xAxis[0].max, 11, 'Initial max');

    // Zoom
    controller.pan([200, 150], [250, 150]);

    assert.strictEqual(chart.xAxis[0].min > 0, true, 'Zoomed min');
    assert.strictEqual(chart.xAxis[0].max < 11, true, 'Zoomed max');

    var xExtremes = chart.xAxis[0].getExtremes();
    var yExtremes = chart.yAxis[0].getExtremes();

    // Pan
    controller.pan([200, 100], [150, 50], { shiftKey: true });
    assert.strictEqual(
        chart.xAxis[0].min < xExtremes.min,
        true,
        'Has panned horizontally'
    );
    assert.strictEqual(
        chart.yAxis[0].min < yExtremes.min,
        true,
        'Has panned vertically'
    );
    assert.close(
        chart.xAxis[0].max - chart.xAxis[0].min,
        xExtremes.max - xExtremes.min,
        0.00001, // Roundoff error in Firefox
        'Has preserved range'
    );

    // Pan
    // delete cache, QUnit header is moving chart
    delete chart.pointer.chartPosition;
    controller.mouseDown(100, 200, { shiftKey: true });
    for (var x = 110; x < 400; x += 10) {
        controller.mouseMove(x, 100, { shiftKey: true });
    }
    controller.mouseUp();

    assert.strictEqual(
        chart.xAxis[0].max,
        11,
        'Chart should not pan out of data bounds (#7451)'
    );
    assert.close(
        chart.xAxis[0].max - chart.xAxis[0].min,
        xExtremes.max - xExtremes.min,
        0.00001, // Roundoff error in Firefox
        'Has preserved range'
    );

    assert.strictEqual(
        chart.yAxis[0].allExtremes.dataMin,
        20,
        '#15022: allExtremes should have the correct dataMin'
    );
    assert.strictEqual(
        chart.yAxis[0].allExtremes.dataMax,
        300,
        '#15022: allExtremes should have the correct dataMax'
    );
});

QUnit.test('Stock panning (#6276, #21319)', function (assert) {
    var chart = Highcharts.stockChart('container', {
        chart: {
            width: 600
        },
        title: {
            text: 'AAPL stock price by minute'
        },
        rangeSelector: {
            buttons: [
                {
                    type: 'day',
                    count: 7,
                    text: '7D'
                },
                {
                    type: 'month',
                    count: 1,
                    text: '1M'
                },
                {
                    type: 'all',
                    count: 1,
                    text: 'All'
                }
            ],
            selected: 1,
            inputEnabled: false
        },
        series: [
            {
                data: (function () {
                    var arr = [];
                    var y = 1;
                    for (
                        var x = Date.UTC(2017, 0, 1);
                        x < Date.UTC(2017, 11, 31);
                        x += 24 * 36e5
                    ) {
                        if (y % 7 !== 0) {
                            arr.push([x, y]);
                        }
                        y++;
                    }
                    return arr;
                }())
            }
        ]
    });

    var controller = new TestController(chart);

    var initialMin = chart.xAxis[0].min,
        initialRange = chart.xAxis[0].max - chart.xAxis[0].min;

    assert.strictEqual(initialMin, 1511913600000, 'Initial min');
    assert.strictEqual(chart.xAxis[0].max, 1514505600000, 'Initial max');

    // Pan
    controller.mouseDown(100, 200, { shiftKey: true });
    controller.mouseMove(300, 200, { shiftKey: true });
    controller.mouseUp();

    assert.ok(chart.xAxis[0].min < initialMin, 'Has panned');

    assert.strictEqual(
        chart.xAxis[0].max - chart.xAxis[0].min,
        initialRange,
        'Has preserved range'
    );

    chart.series[0].update({
        dataGrouping: {
            forced: true
        },
        data: [
            [1648215000000, 173.88],
            [1648474200000, 172.17],
            [1648560600000, 176.69],
            [1648647000000, 178.55],
            [1648733400000, 177.84],
            [1648819800000, 174.03],
            [1649079000000, 174.57],
            [1649165400000, 177.5],
            [1649251800000, 172.36],
            [1649338200000, 171.16],
            [1649424600000, 171.78],
            [1649683800000, 168.71],
            [1649770200000, 168.02],
            [1649856600000, 167.39],
            [1649943000000, 170.62],
            [1650288600000, 163.92],
            [1650375000000, 165.02],
            [1650461400000, 168.76],
            [1650547800000, 168.91],
            [1650634200000, 166.46],
            [1650893400000, 161.12]
        ]
    });
    chart.xAxis[0].setExtremes(null, 1649424600000);
    const oldExtremes = chart.xAxis[0].getExtremes();
    controller.pan([100, 200], [300, 200]);
    assert.deepEqual(
        oldExtremes,
        chart.xAxis[0].getExtremes(),
        '#20809, panning outside chart extremes should not do anything.'
    );

    // #21319
    chart.update({
        xAxis: {
            ordinal: false
        }
    });
    controller.pan([300, 200], [100, 200]);
    assert.strictEqual(
        chart.resetZoomButton,
        undefined,
        `resetZoomButton should not be rendered while panning on non-ordinal
        axes. (#21319)`
    );
});

QUnit.test(
    'Ordinal axis panning.',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
            xAxis: {
                min: 6,
                max: 9
            },
            series: [
                {
                    data: [
                        {
                            x: 1,
                            y: 10
                        },
                        {
                            x: 2,
                            y: 11
                        },
                        {
                            x: 3,
                            y: 12
                        },
                        {
                            x: 4,
                            y: 14
                        },
                        {
                            x: 5,
                            y: 15
                        },
                        {
                            x: 6,
                            y: 16
                        },
                        {
                            x: 7,
                            y: 14
                        },
                        {
                            x: 8,
                            y: 15
                        },
                        {
                            x: 9,
                            y: 16
                        }
                    ]
                }
            ]
        });

        var controller = new TestController(chart),
            initialMin = chart.xAxis[0].min;

        controller.pan([100, 200], [200, 200]);

        assert.notEqual(
            initialMin,
            chart.xAxis[0].min,
            'Chart should pan horizontally, when data is equally spaced #13334.'
        );

        const data = [];

        for (let i = 0; i < 100000; i++) {
            data.push([400 + i, 1]);
        }

        chart.series[0].update({
            data,
            type: 'column',
            dataGrouping: {
                forced: true,
                units: [[
                    'second',
                    [1]
                ]]
            }
        });

        chart.xAxis[0].setExtremes(2000, 45000);

        controller.pan([100, 200], [200, 200]);

        assert.equal(
            chart.xAxis[0].min,
            0,
            `It should be possible to pan to the axis minimum in a data grouped
            ordinal column chart, #21524.`
        );

        chart.update({
            xAxis: [{
                overscroll: 5
            }]
        });

        const min = chart.xAxis[0].min,
            max = chart.xAxis[0].max;

        controller.pan([100, 100], [100, 200]);
        assert.equal(
            min,
            chart.xAxis[0].min,
            'xAxis extremes should not change with vertical panning'
        );

        assert.equal(
            max,
            chart.xAxis[0].max,
            'xAxis extremes should not change with vertical panning'
        );

        chart.xAxis[0].setExtremes(1, 4);
        controller.pan([100, 200], [200, 200]);
        assert.equal(
            1,
            chart.xAxis[0].min,
            'xAxis extremes should not change when panning below the minimum'
        );

        assert.equal(
            4,
            chart.xAxis[0].max,
            'xAxis extremes should not change when panning below the minimum'
        );
    }
);

QUnit.test('Pan all the way to extremes (#5863)', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            type: 'area',
            panning: true,
            width: 600
        },
        plotOptions: {
            area: {
                pointStart: 1940,
                marker: {
                    enabled: false
                }
            }
        },
        xAxis: {
            min: 1945,
            tickInterval: 5
        },
        series: [
            {
                name: 'USA',
                data: [
                    235,
                    369,
                    640,
                    1005,
                    1436,
                    2063,
                    3057,
                    4618,
                    6444,
                    9822,
                    15468,
                    20434,
                    24126,
                    27387,
                    29459,
                    31056,
                    31982,
                    32040,
                    31233,
                    29224,
                    27342,
                    26662,
                    26956,
                    27912,
                    28999,
                    28965,
                    27826,
                    25579,
                    25722,
                    24826,
                    24605,
                    24304,
                    23464,
                    23708,
                    24099,
                    24357,
                    24237,
                    24401,
                    24344,
                    23586,
                    22380,
                    21004,
                    17287,
                    14747,
                    13076,
                    12555,
                    12144,
                    11009,
                    10950,
                    10871,
                    10824,
                    10577,
                    10527,
                    10475,
                    10421,
                    10358
                ]
            },
            {
                name: 'USSR/Russia',
                data: [
                    5,
                    25,
                    50,
                    120,
                    150,
                    200,
                    426,
                    660,
                    869,
                    1060,
                    1605,
                    2471,
                    3322,
                    4238,
                    5221,
                    6129,
                    7089,
                    8339,
                    9399,
                    10538,
                    11643,
                    13092,
                    14478,
                    15915,
                    17385,
                    19055,
                    21205,
                    23044,
                    25393,
                    27935,
                    30062,
                    32049,
                    33952,
                    35804,
                    37431,
                    39197,
                    45000,
                    43000,
                    41000,
                    39000,
                    37000,
                    35000,
                    33000,
                    31000,
                    29000,
                    27000,
                    25000,
                    24000,
                    23000,
                    22000,
                    21000,
                    20000,
                    19000,
                    18000,
                    18000,
                    17000
                ]
            }
        ]
    });

    var controller = new TestController(chart);

    assert.strictEqual(
        chart.xAxis[0].tickPositions.toString(),
        '1945,1950,1955,1960,1965,1970,1975,1980,1985,1990,1995',
        'Right ticks'
    );

    // Pan
    controller.pan([100, 200], [200, 200]);
    assert.strictEqual(
        chart.xAxis[0].tickPositions.toString(),
        '1940,1945,1950,1955,1960,1965,1970,1975,1980,1985,1990',
        'Panned all the way to the left of the axis, first category should show'
    );

    // Pan
    controller.pan([300, 200], [200, 200]);
    assert.strictEqual(
        chart.xAxis[0].tickPositions.toString(),
        '1950,1955,1960,1965,1970,1975,1980,1985,1990,1995',
        'Panned all the way to the right of the axis, last category should show'
    );
});

QUnit.test(
    'Pan in vertical direction, and both directions. (Highcharts Stock only)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
            chart: {
                width: 600,
                panning: {
                    type: 'y'
                }
            },
            yAxis: {
                startOnTick: false,
                endOnTick: false
            },
            title: {
                text: 'AAPL stock price by minute'
            },
            rangeSelector: {
                selected: 1,
                inputEnabled: false
            },
            series: [
                {
                    data: (function () {
                        var arr = [];
                        var y = 1;
                        for (
                            var x = Date.UTC(2017, 0, 1);
                            x < Date.UTC(2017, 11, 31);
                            x += 24 * 36e5
                        ) {
                            if (y % 7 !== 0) {
                                arr.push([x, y]);
                            }
                            y++;
                        }
                        return arr;
                    }())
                }
            ]
        });

        var controller = new TestController(chart);

        var initialMin = chart.yAxis[0].min,
            initialRange = chart.yAxis[0].max - chart.yAxis[0].min;

        // Pan in vertical direction
        controller.pan([100, 200], [100, 100]);

        assert.ok(
            chart.yAxis[0].min < initialMin,
            'Has panned in Y direction.'
        );

        assert.strictEqual(
            Highcharts.correctFloat(chart.yAxis[0].max - chart.yAxis[0].min),
            Highcharts.correctFloat(initialRange),
            'Has preserved range.'
        );

        chart.update({
            chart: {
                panning: {
                    type: 'xy'
                }
            }
        });

        var initialXMin = chart.xAxis[0].min,
            initialYMin = chart.yAxis[0].min,
            initialXRange = chart.xAxis[0].max - chart.xAxis[0].min,
            initialYRange = Highcharts.correctFloat(
                chart.yAxis[0].max - chart.yAxis[0].min
            );

        // Pan in both directions
        controller.pan([100, 100], [150, 150]);

        assert.ok(
            chart.xAxis[0].min < initialXMin &&
                chart.yAxis[0].min > initialYMin,
            'Has panned in both directions.'
        );

        assert.ok(
            chart.xAxis[0].max - chart.xAxis[0].min === initialXRange &&
                Highcharts.correctFloat(
                    chart.yAxis[0].max - chart.yAxis[0].min
                ) === initialYRange,
            'Has preserved range.'
        );
    }
);

QUnit.test(
    'Panning should be disabled when type is set but not enabled (#14624)',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                panning: {
                    type: 'xy',
                    enabled: false
                },
                height: 480
            },
            yAxis: [
                {
                    index: 0
                },
                {
                    title: {
                        text: 'Value (B)'
                    }
                }
            ],
            series: [
                {
                    data: [
                        [1605898200426, -49.985682],
                        [1605902399496, 52.004364]
                    ]
                },
                {
                    data: [
                        [1605898200426, -0.081397],
                        [1605902399496, -0.013002]
                    ]
                }
            ]
        });

        var actualMin = chart.yAxis[0].getExtremes().min;
        assert.strictEqual(actualMin, -75, 'Min must be -75; not panning');
    }
);
