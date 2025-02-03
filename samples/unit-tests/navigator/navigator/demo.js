QUnit.test(
    'Navigator handles general tests',
    function (assert) {
        const chart = Highcharts.StockChart('container', {
            navigator: {
                height: 20,
                xAxis: {
                    id: 'test'
                }
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
                }
            ]
        });

        assert.ok(
            chart.scroller.handles[0].zIndex >=
                chart.scroller.xAxis.labelGroup.zIndex,
            'Handles should not be overlapped by xAxis labels (#2908)'
        );

        assert.ok(
            chart.get('test') !== undefined,
            'Navigator xAxis should be accessed by custom id.'
        );

        assert.ok(
            chart.get('navigator-y-axis') !== undefined,
            'Navigator yAxis should be accessed by the default id.'
        );

        chart.update({
            navigator: {
                handles: {
                    symbols: [
                        'url(https://www.highcharts.com/samples/graphics/sun.png)',
                        'url(https://www.highcharts.com/samples/graphics/sun.png)'
                    ]
                }
            }
        });

        assert.strictEqual(
            chart.navigator.handles[0].element.tagName,
            'image',
            'Navigator handles should be updated to images. (#21660)'
        );
    }
);

QUnit.test('Navigator in Highcharts.setOptions', function (assert) {
    Highcharts.setOptions({
        navigator: {
            enabled: false
        }
    });

    const chart = Highcharts.stockChart('container', {
        series: [{
            data: [1, 2, 3, 4, 5]
        }]
    });

    assert.strictEqual(
        chart.navigator.navigatorGroup,
        undefined,
        'Navigator should not be rendered when disabled in setOptions (#21217).'
    );
});

// Enabled navigator again for further tests
Highcharts.setOptions({
    navigator: {
        enabled: true
    }
});

QUnit.test('Navigator (#4053)', function (assert) {
    var chart = new Highcharts.StockChart({
        chart: {
            renderTo: 'container',
            width: 400,
            height: 300
        },
        navigator: {
            xAxis: {
                type: 'datetime',
                ordinal: false,
                min: Date.UTC(2015, 0, 28),
                max: Date.UTC(2015, 1, 26)
            },
            series: {
                data: [
                    [Date.UTC(2015, 0, 21), 0.1],
                    [Date.UTC(2015, 0, 30), 2.84],
                    [Date.UTC(2015, 1, 2), 2.79],
                    [Date.UTC(2015, 1, 3), 2.79],
                    [Date.UTC(2015, 1, 4), 3.04],
                    [Date.UTC(2015, 1, 5), 3.04],
                    [Date.UTC(2015, 1, 10), 1.7],
                    [Date.UTC(2015, 1, 11), 1.67]
                ]
            }
        },
        xAxis: {
            type: 'datetime',
            ordinal: false,
            min: Date.UTC(2015, 0, 28),
            max: Date.UTC(2015, 1, 26)
        },
        series: [
            {
                name: 'Serie1',
                data: [
                    [Date.UTC(2015, 0, 21), 0.1],
                    [Date.UTC(2015, 0, 30), 2.84],
                    [Date.UTC(2015, 1, 2), 2.79],
                    [Date.UTC(2015, 1, 3), 2.79],
                    [Date.UTC(2015, 1, 4), 3.04],
                    [Date.UTC(2015, 1, 5), 3.04],
                    [Date.UTC(2015, 1, 10), 1.7],
                    [Date.UTC(2015, 1, 11), 1.67]
                ]
            }
        ]
    });

    // Assert that the first series' points are not destroyed
    assert.equal(
        chart.scroller.xAxis.min,
        Date.UTC(2015, 0, 28),
        'Navigator min'
    );
});

QUnit.test('General Navigator tests', function (assert) {
    let left = 0;

    var chart = Highcharts.stockChart('container', {
            chart: {
                events: {
                    afterSetChartSize() {
                        left = this.navigator && this.navigator.left;
                    }
                }
            },
            legend: {
                enabled: true
            },
            yAxis: {
                labels: {
                    align: 'left'
                }
            },
            navigator: {
                height: 100,
                xAxis: {
                    left: 200
                }
            },
            series: [
                {
                    data: [1, 2, 3],
                    id: '1'
                }
            ]
        }),
        controller,
        navBBox,
        firstShadeBBox,
        secondShadeBBox,
        secondShadeXBeforeTranslate,
        x,
        y;

    assert.strictEqual(
        left,
        200,
        '#15803: navigator.left should be correct after afterSetChartSize'
    );

    const eventCount = el => {
        let count = 0;
        // eslint-disable-next-line
        for (const t in el.hcEvents) {
            count += el.hcEvents[t].length;
        }
        return count;
    };

    const before = eventCount(chart.series[0]);
    const beforeAxis = eventCount(chart.xAxis[0]);

    chart.series[0].update();

    assert.strictEqual(
        eventCount(chart.series[0]),
        before,
        '#10296: Navigator should not leak events into series on Series.update'
    );
    assert.strictEqual(
        eventCount(chart.xAxis[0]),
        beforeAxis,
        '#10296: Navigator should not leak events into xAxis on Series.update'
    );

    chart.series[0].hide();

    assert.deepEqual(
        chart.scroller.size,
        chart.scroller.xAxis.len,
        'Correct width (#6022)'
    );

    assert.strictEqual(
        chart.sharedClips[chart.series[1].getSharedClipKey()].attr('height'),
        100,
        'Navigator series has correct clipping rect height (#5904)'
    );

    chart.series[1].remove(false);
    chart.series[0].remove();

    assert.strictEqual(
        chart.series.length,
        0,
        'All series, including navSeries, removed without errors (#5581)'
    );

    chart = Highcharts.stockChart('container', {
        chart: {
            animation: false,
            width: 700,
            plotBorderColor: '#cccccc',
            plotBorderWidth: 1,
            borderColor: 'red',
            borderWidth: 1
        },
        scrollbar: {
            enabled: false
        },
        rangeSelector: {
            enabled: false
        },
        yAxis: {
            opposite: false,
            labels: {
                align: 'right',
                formatter: function () {
                    if (
                        this.axis.min === 4999999999999.5 &&
                        this.axis.max === 5000000000000.5
                    ) {
                        return '5000000000000';
                    }

                    return 'a';
                }
            }
        },
        xAxis: {
            min: 1512743400000,
            max: 1513089000000
        },
        series: [
            {
                data: [
                    [1512657000000, 5],
                    [1512743400000, 5],
                    [1513002600000, 5],
                    [1513089000000, 5],
                    [1513175400000, 5],
                    [1513261800000, 5],
                    [1513348200000, 5],
                    [1513607400000, 5],
                    [1513693800000, 5000000000000],
                    [1513780200000, 5000000000000],
                    [1513866600000, 5000000000000],
                    [1513953000000, 5000000000000],
                    [1514298600000, 5000000000000],
                    [1514385000000, 5000000000000],
                    [1514471400000, 5000000000000],
                    [1514557800000, 5000000000000]
                ]
            }
        ]
    });

    navBBox = chart.navigator.shades[1].getBBox();
    x = navBBox.x + navBBox.width / 2;
    y = navBBox.y + navBBox.height / 2;
    controller = new TestController(chart);

    controller.triggerEvent('mousedown', x, y);
    controller.triggerEvent('mousemove', x + 380, y);
    controller.triggerEvent('mouseup', x + 380, y);

    secondShadeXBeforeTranslate = x + 380 - navBBox.width / 2;
    firstShadeBBox = chart.navigator.shades[0].getBBox();
    secondShadeBBox = chart.navigator.shades[1].getBBox();

    assert.notEqual(
        secondShadeXBeforeTranslate,
        secondShadeBBox.x,
        'Second shade should not be in the same position as after ' +
            'mousemove (#12573).'
    );

    assert.deepEqual(
        [
            chart.navigator.shades[1].getBBox().x,
            chart.navigator.outline.getBBox().x,
            chart.navigator.handles[0].translateX,
            chart.navigator.handles[1].translateX
        ],
        [
            chart.plotLeft + firstShadeBBox.width,
            chart.plotLeft,
            chart.plotLeft + firstShadeBBox.width,
            chart.plotLeft + firstShadeBBox.width + secondShadeBBox.width
        ],
        'Navigator shades, outline and handles should be properly ' +
            'translated after yAxis label reserve more space (#12573).'
    );

    chart = Highcharts.stockChart('container', {
        navigator: {
            series: {
                data: []
            }
        },
        plotOptions: {
            series: {
                showInNavigator: false
            }
        },
        scrollbar: {
            enabled: false
        },
        series: [
            {
                data: [
                    [1539264600000, 214.45],
                    [1539351000000, 222.11],
                    [1539610200000, 217.36],
                    [1539696600000, 222.15],
                    [1539783000000, 221.19],
                    [1539869400000, 216.02],
                    [1539955800000, 219.31],
                    [1540215000000, 220.65],
                    [1540301400000, 222.73],
                    [1540387800000, 215.09]
                ]
            }
        ]
    });

    chart.setSize(400, 500);
    assert.close(
        chart.navigator.xAxis.top,
        chart.navigator.navigatorGroup.getBBox().y,
        1, // Crisping
        'Navigator position should be updated when scrollbar ' +
            'disabled and navigator.baseSeries not set (#13114).'
    );

    chart.xAxis[0].setExtremes(0, 5);

    const outlinePathArray = chart.navigator.outline.pathArray;

    assert.equal(
        outlinePathArray[0][2], // Upper left of navigator outline
        outlinePathArray[5][2], // Upper right of navigator outline
        'Upper part of navigator outline should be a straight line.'
    );

    chart = Highcharts.stockChart('container', {
        xAxis: {
            ordinal: false,
            minPadding: 0.05,
            maxPadding: 0.05
        },
        series: [
            {
                data: [1, 2, 3]
            }
        ]
    });

    assert.strictEqual(
        chart.navigator.xAxis.options.minPadding,
        chart.xAxis[0].options.minPadding,
        'Navigator should inherit the minPadding property from the main axis.'
    );

    assert.strictEqual(
        chart.navigator.xAxis.options.maxPadding,
        chart.xAxis[0].options.maxPadding,
        'Navigator should inherit the maxPadding property from the main axis.'
    );

    // #21584
    const start = +new Date();

    const lineSeries = {
        type: 'line',
        showInNavigator: true,
        data: Array.from({ length: 10 }, (_, i) => [start + 60000 * i, i])
    };
    const lineSeries2 = {
        type: 'line',
        showInNavigator: true,
        data: Array.from({ length: 10 }, (_, i) => [start + 60000 * i, 2 * i])
    };

    const options = {
        navigator: {
            enabled: true
        },
        series: [lineSeries, lineSeries2]
    };

    chart = Highcharts.stockChart('container', options);

    // Update the chart
    options.series = [lineSeries];
    options.navigator.enabled = false;
    chart.update(options, true, true, false);
    assert.ok(
        true,
        `Updating the chart with oneToOne should not throw an error in the
        navigator, #21584.`);
});

QUnit.test('Reversed xAxis with navigator', function (assert) {
    var chart = new Highcharts.StockChart({
            chart: {
                renderTo: 'container'
            },
            series: [
                {
                    data: [
                        [10, 20],
                        [15, 22]
                    ]
                }
            ],
            rangeSelector: {
                buttons: [
                    {
                        count: 5,
                        type: 'millisecond',
                        text: '5ms'
                    }
                ],
                inputEnabled: false,
                selected: 0
            },
            navigator: {
                xAxis: {
                    reversed: true
                }
            },
            xAxis: {
                reversed: true,
                minRange: 1
            }
        }),
        offset = $('#container').offset(),
        navigator = chart.scroller,
        done = assert.async();

    chart.series[0].addPoint([20, 23]);

    assert.strictEqual(
        chart.xAxis[0].max,
        20,
        'Correct extremes after addPoint() (#7713).'
    );

    navigator.handlesMousedown(
        {
            pageX: offset.left + 578,
            pageY: offset.top + 400 - 30
        },
        0
    );

    navigator.mouseMoveHandler({
        pageX: offset.left + 309,
        pageY: offset.top + 400 - 30,
        DOMType: 'mousemove'
    });

    // No lolex should be needed for this
    setTimeout(function () {
        navigator.hasDragged = true;
        navigator.mouseUpHandler({
            pageX: offset.left + 308,
            pageY: offset.top + 400 - 30,
            DOMType: 'mouseup'
        });
        assert.strictEqual(
            chart.series[0].points !== null,
            true,
            'Zooming works fine (#4114).'
        );
        done();
    }, 0);
});

QUnit.test('Scrollbar without navigator (#5709).', function (assert) {
    var chart = Highcharts.stockChart('container', {
        chart: {
            zoomType: 'xy'
        },
        navigator: {
            enabled: false
        },
        scrollbar: {
            enabled: true,
            showFull: true
        }
    });
    chart.addSeries({
        data: [1, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 2, 3, 1]
    });
    assert.strictEqual(
        chart.scroller.scrollbar.group.translateY >= 0,
        true,
        'Correct position for a scrollbar'
    );
});

QUnit.test('Missing points using navigator (#5699, #17212)', function (assert) {
    const data = new Array(3000).fill(1).map((item, i) => [
        Date.UTC(2010, 0, 1) + i * 24 * 36e5,
        Math.random()
    ]);
    var container = $('#container'),
        chart = container
            .highcharts('StockChart', {
                chart: {
                    width: 600,
                    height: 400
                }
            })
            .highcharts(),
        offset = container.offset(),
        navigator = chart.scroller,
        done = assert.async();

    chart.addSeries({
        type: 'column',
        data
    });

    assert.strictEqual(
        chart.series[0].getColumn('x', true)[0],
        chart.series[1].getColumn('x', true)[0],
        'Navigator by default should start at the parent series starting ' +
            'point, #17212.'
    );

    navigator.handlesMousedown(
        {
            pageX: offset.left + 578,
            pageY: offset.top + 400 - 30
        },
        0
    );

    navigator.mouseMoveHandler({
        pageX: offset.left + 309,
        pageY: offset.top + 400 - 30,
        DOMType: 'mousemove'
    });

    // No lolex should be needed for this
    setTimeout(function () {
        navigator.hasDragged = true;
        navigator.mouseUpHandler({
            pageX: offset.left + 308,
            pageY: offset.top + 400 - 30,
            DOMType: 'mouseup'
        });
        assert.strictEqual(
            chart.series[0].points !== null,
            true,
            'Points exist.'
        );
        done();
    }, 0);
});

QUnit.test(
    '#3961 - Zone zAxis shouldn\'t cause errors in Navigator series.',
    function (assert) {
        var chart = $('#container')
            .highcharts('StockChart', {
                series: [
                    {
                        type: 'bubble',
                        data: [
                            [0, 10, 20],
                            [1, 10, 20]
                        ]
                    }
                ]
            })
            .highcharts();

        assert.notStrictEqual(
            // handles are not rendered when we get error in zones
            chart.scroller.handles.length,
            0,
            'No errors in zones for bubble series.'
        );
    }
);

QUnit.test(
    'Extremes in navigator with empty series initalized (#5390)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
                series: []
            }),
            series = [
                {
                    data: [
                        {
                            x: 1465102500000,
                            y: 0.0057043973610007015
                        },
                        {
                            x: 1465251900000,
                            y: 0.020374603343000786
                        }
                    ]
                },
                {
                    data: [
                        {
                            x: 1465102800000,
                            y: 23
                        },
                        {
                            x: 1465252200000,
                            y: 77
                        }
                    ]
                },
                {
                    data: [
                        {
                            x: 1465102800000,
                            y: 1.2800000000000011
                        },
                        {
                            x: 1465252200000,
                            y: 1.3199999999999932
                        }
                    ]
                }
            ],
            points = [
                {
                    data: [
                        {
                            x: 1464951300000,
                            y: 0.04950855198299564
                        },
                        {
                            x: 1465100700000,
                            y: 0.007108723524993366
                        }
                    ]
                },
                {
                    data: [
                        {
                            x: 1464951600000,
                            y: 101
                        },
                        {
                            x: 1465101000000,
                            y: 18
                        }
                    ]
                },
                {
                    data: [
                        {
                            x: 1464951600000,
                            y: 1.5
                        },
                        {
                            x: 1465101000000,
                            y: 1.2399999999999949
                        }
                    ]
                }
            ];

        series.forEach(s => {
            chart.addSeries(s, false);
        });
        chart.xAxis[0].setExtremes();

        points.forEach((s, index) => {
            if (
                chart.series[index].options.id !== 'highcharts-navigator-series'
            ) {
                s.data.forEach(p => {
                    chart.series[index].addPoint(p, false);
                });
            }
        });
        chart.xAxis[0].setExtremes();

        assert.strictEqual(
            chart.xAxis[1].getExtremes().max,
            1465251900000,
            'Correct extremes in navigator'
        );
    }
);

QUnit.test('Add point and disabled navigator (#3452)', function (assert) {
    var chart,
        x = 0;

    function add() {
        // set up the updating of the chart each second
        var series = chart.series[0];
        series.addPoint([x++, x % 10], true, true);
    }
    // Create the chart
    chart = Highcharts.stockChart('container', {
        rangeSelector: {
            buttons: [
                {
                    count: 100,
                    type: 'millisecond',
                    text: '100ms'
                },
                {
                    count: 1,
                    type: 'second',
                    text: '1s'
                },
                {
                    type: 'all',
                    text: 'All'
                }
            ],
            inputEnabled: false,
            selected: 0
        },

        title: {
            text: 'Live random data'
        },

        exporting: {
            enabled: false
        },

        scrollbar: {
            buttonsEnabled: true
        },

        series: [
            {
                name: 'Random data',
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        i;

                    for (i = -1000; i <= 0; i += 1) {
                        data.push([x++, x % 10]);
                    }
                    return data;
                }())
            }
        ],

        navigator: {
            enabled: false
        }
    });

    assert.strictEqual(chart.xAxis[0].min, 900, 'Initial min');
    assert.strictEqual(chart.xAxis[0].max, 1000, 'Initial max');

    // Add one point, the zoomed range should now move
    add();

    assert.strictEqual(chart.xAxis[0].min, 901, 'Adapted min');
    assert.strictEqual(chart.xAxis[0].max, 1001, 'Adapted max');
});

QUnit.test('Empty scroller with Axis min set (#5172)', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: {
            min: 0
        },
        series: [
            {
                id: 'navigator',
                name: null,
                data: []
            },
            {
                id: 'my_data',
                name: null,
                data: []
            }
        ],
        navigator: {
            enabled: true,
            series: {
                id: 'navigator'
            },
            xAxis: {
                min: 0
            }
        }
    });

    assert.strictEqual(
        chart.navigator.navigatorGroup.attr('visibility'),
        'hidden',
        'Navigator hidden due to missing data'
    );
});

QUnit.test(
    'Update navigator series on series update (#4923)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
            series: [
                {
                    animation: false,
                    data: [
                        { x: 0, y: 0 },
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                        { x: 3, y: 3 },
                        { x: 4, y: 4 },
                        { x: 5, y: 5 },
                        { x: 6, y: 6 },
                        { x: 7, y: 7 },
                        { x: 8, y: 8 },
                        { x: 9, y: 9 }
                    ],
                    dataGrouping: {
                        enabled: false
                    }
                }
            ]
        });

        var pathWidth = chart.series[1].graph.getBBox().width;

        assert.strictEqual(typeof pathWidth, 'number', 'Path width is set');
        assert.ok(pathWidth > 500, 'Path is more than 500px wide');

        chart.series[0].addPoint([10, 10]);
        assert.strictEqual(
            chart.series[1].graph.getBBox().width,
            pathWidth,
            'Path width is updated'
        );
    }
);

QUnit.test(
    'Moving navigator with no series should not break axis (#7411)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
                chart: {
                    animation: false
                },
                navigator: {
                    series: {
                        visible: false
                    }
                },
                rangeSelector: {
                    selected: 4
                },
                series: [
                    {
                        animation: false,
                        data: [
                            { x: 1000000, y: 0 },
                            { x: 100000001, y: 1 },
                            { x: 1000000002, y: 2 },
                            { x: 10000000004, y: 4 },
                            { x: 100000000005, y: 5 },
                            { x: 1000000000007, y: 7 }
                        ]
                    }
                ]
            }),
            controller = new TestController(chart),
            rightHandle = chart.navigator.handles[1],
            isNum = Highcharts.isNumber;

        assert.ok(
            isNum(chart.xAxis[0].userMax),
            'Axis should have proper extremes before messing with navigator.'
        );

        // Make the nav do its rendering by simulating mouse click and drag on
        // right handle.
        function navRender() {
            var x =
                    rightHandle.x +
                    rightHandle.translateX +
                    rightHandle.width / 2,
                y =
                    rightHandle.y +
                    rightHandle.translateY +
                    rightHandle.height / 2;
            controller.triggerEvent('mousedown', x, y);
            controller.triggerEvent('mousemove', x, y);
            controller.triggerEvent('mouseup', x, y);
        }

        navRender();
        chart.series[0].hide();
        navRender();

        assert.ok(
            isNum(chart.xAxis[0].userMax),
            'Axis should have proper extremes after messing with navigator.'
        );
    }
);

QUnit.test('Highcharts events tests', function (assert) {
    var chart = Highcharts.stockChart('container', {
            series: [
                {
                    data: [1, 2, 3]
                }
            ],
            navigator: {
                adaptToUpdatedData: true
            }
        }),
        getMarginsLength = chart.hcEvents.getMargins.length;

    chart.update({
        navigator: {
            adaptToUpdatedData: false
        }
    });

    assert.ok(
        !chart.series[0].hcEvents ||
            !chart.series[0].hcEvents.updatedData ||
            chart.series[0].hcEvents.updatedData.length === 0,
        'Update of adaptToUpdatedData should remove all events (#8038)'
    );

    assert.strictEqual(
        chart.hcEvents.getMargins.length,
        getMarginsLength,
        'Update of navigator should not add extra events getMargins (#8595)'
    );
});

// Highcharts 6.0.0, Issue #7067
// Chart.update() doesn't enable the navigator under certain conditions
QUnit.test('Chart update enables navigator (#7067)', function (assert) {
    var chart = Highcharts.stockChart('container', {
        navigator: {
            enabled: false
        },
        scrollbar: {
            enabled: false
        },
        series: [
            {
                data: [1, 2, 3]
            }
        ]
    });

    assert.deepEqual(
        [typeof chart.navigator, typeof chart.scroller],
        ['undefined', 'undefined'],
        'Chart should have no navigator.'
    );

    chart.update({
        navigator: {
            enabled: true
        }
    });

    assert.notDeepEqual(
        [typeof chart.navigator, typeof chart.scroller],
        ['undefined', 'undefined'],
        'Chart should have a navigator instance.'
    );

    assert.ok(
        chart.navigator && chart.navigator.navigatorEnabled,
        'Navigator should be enabled.'
    );
});
QUnit.test(
    'Navigator series visibility should be in sync with master series (#8374)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
                legend: {
                    enabled: true
                },
                series: [
                    {
                        data: [1, 2, 3],
                        visible: false
                    },
                    {
                        showInNavigator: true,
                        data: [30, 22, 10]
                    }
                ]
            }),
            series0 = chart.series[0],
            series1 = chart.series[1];

        assert.strictEqual(
            // This returns false, when series is hidden:
            series0.navigatorSeries.visible === true,
            // Directly visibile = false
            series0.visible,
            'Both series[0] and series[0].navigator should be hidden.'
        );

        assert.strictEqual(
            series1.navigatorSeries.visible === true,
            series1.visible,
            'Both series[1] and series[1].navigator should be visible.'
        );

        series0.update({
            visible: true
        });

        assert.strictEqual(
            series0.navigatorSeries.visible === true,
            series0.visible,
            'Both series[0] and series[0].navigator should be visible.'
        );

        series1.update({
            visible: false
        });

        assert.strictEqual(
            series1.navigatorSeries.visible === true,
            series1.visible,
            'Both series[1] and series[1].navigator should be hidden.'
        );

        // Order of the events:
        // - first execute callback for series.hide(), to show navigator series
        // - then redraw the chart, including navigator series
        series1.setVisible();

        assert.strictEqual(
            Highcharts.defined(series1.navigatorSeries.graph) &&
                series1.navigatorSeries.group.visibility !== 'hidden',
            true,
            'Navigator series should be visible.'
        );
    }
);

QUnit.test('stickToMin and stickToMax', function (assert) {
    var chart = new Highcharts.stockChart('container', {
            xAxis: {
                min: 5,
                minRange: 1
            },
            plotOptions: {
                series: {
                    showInNavigator: true
                }
            },
            rangeSelector: {
                buttons: [
                    {
                        count: 2,
                        type: 'millisecond',
                        text: '2ms'
                    }
                ]
            },
            series: [
                {
                    pointStart: 0,
                    data: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
                },
                {
                    pointStart: 5,
                    data: [3, 2, 1, 1, 2]
                }
            ]
        }),
        extremes;

    chart.series[0].addPoint(5, false, false);
    chart.series[1].addPoint(5, false, false);
    chart.redraw();

    extremes = chart.xAxis[0].getExtremes();

    assert.strictEqual(
        extremes.min,
        5,
        'stickToMin, multiple series with different ranges: ' +
            'Correct extremes after adding points(#9075)'
    );

    chart.series[0].update({
        pointStart: extremes.max,
        data: [4]
    });

    chart.rangeSelector.clickButton(0, true);
    chart.series[0].addPoint(5);
    chart.series[1].addPoint(5);
    extremes = chart.xAxis[0].getExtremes();

    assert.strictEqual(
        extremes.min,
        extremes.max - chart.fixedRange,
        'stickToMax, multiple series with different ranges: ' +
            'Correct extremes after rangeSelector use and adding points(#9075)'
    );

    chart.series[0].addPoint(100);

    const { max: initialMax } = chart.xAxis[0].getExtremes();

    assert.strictEqual(
        extremes.max + 1,
        initialMax,
        'By default, navigator should stick to max after adding point(#17539).'
    );

    chart.update({
        navigator: {
            stickToMax: false
        }
    });

    chart.series[0].addPoint(0);

    const { max: updatedMax } = chart.xAxis[0].getExtremes();

    assert.strictEqual(
        initialMax,
        updatedMax,
        `Max value of the navigator xAxis extremes did not change after
        adding points.`
    );
});

QUnit.test(
    'Update an unrelated dynamically added chart series (#8430)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
            series: [],
            navigator: {
                adaptToUpdatedData: false,
                series: {
                    id: 'navigator',
                    data: []
                }
            }
        });

        chart.addSeries({
            id: 'series1'
        });

        chart.get('navigator').setData([
            { x: 0, y: 1 },
            { x: 1, y: 10 }
        ]);

        chart.get('series1').update({});

        assert.strictEqual(
            chart.navigator.series[0].points.length,
            2,
            'Correct number of points in navigator series (#8430).'
        );
    }
);

QUnit.test('Add a navigator by chart update (#7067)', function (assert) {
    var chart = Highcharts.stockChart('container', {
        series: [
            {
                data: [1, 2, 3]
            }
        ],
        navigator: {
            enabled: false
        },
        scrollbar: {
            enabled: false
        }
    });

    chart.update({
        navigator: {
            enabled: true
        }
    });

    assert.ok(chart.navigator.size, 'Navigator correctly added (#7067).');
});

QUnit.test('Navigator overlaps chart (#13392).', function (assert) {
    var chart = Highcharts.stockChart('container', {
        legend: {
            enabled: true,
            layout: 'proximate',
            align: 'right'
        },
        series: [
            {
                data: [2, 20]
            },
            {
                data: [1, 3]
            }
        ]
    });

    assert.ok(
        chart.navigator.top > 330,
        'Navigator should not overlap the chart (#13392).'
    );
});

QUnit.test('Navigator with adding series on chart load.', function (assert) {
    Highcharts.stockChart('container', {
        chart: {
            events: {
                load: function (event) {
                    this.navigator.onMouseUp(event);
                    const xStr = this.navigator.shades[1].element.getAttribute(
                        'x'
                    );
                    assert.notEqual(
                        /^[\-0-9\.]+$/.test(xStr) || xStr === null,
                        false,
                        'Navigator rects have correctly defined x attribute.'
                    );
                }
            }
        },
        series: [
            {
                data: []
            }
        ]
    });
});

QUnit.test(
    'yAxis in navigator does not match the one in the chart, #14060.',
    function (assert) {
        const chart = Highcharts.stockChart('container', {
            yAxis: {
                reversed: true
            },
            series: [
                {
                    data: [1, 2, 3]
                }
            ]
        });

        assert.ok(
            chart.navigator.yAxis.reversed,
            'Navigator should inherit the reversed property from the main axis.'
        );
        chart.update({
            navigator: {
                yAxis: {
                    reversed: false
                }
            }
        });
        assert.notOk(
            chart.navigator.yAxis.reversed,
            'Navigator options should have higher priority and the axis ' +
                'should not be reversed anymore.'
        );
    }
);

QUnit.test('Navigator dafault dataLabels enabled, #13847.', function (assert) {
    const chart = Highcharts.stockChart('container', {
        series: [{
            data: [1, 2, 3],
            dataLabels: [{
                enabled: true,
                format: 'T2'
            }]
        }]
    });

    assert.equal(
        chart.navigator.series[0].options.dataLabels[0].enabled,
        false,
        'DataLabels in Navigator should be disabled in default.'
    );
    // The problem was connected with merge Utils function,
    // that doesn't handle merging objects with different structures.
    chart.update({
        navigator: {
            series: {
                dataLabels: {
                    enabled: true
                }
            }
        }
    });

    assert.equal(
        chart.navigator.series[0].options.dataLabels[0].enabled,
        true,
        'DataLabels in Navigator should be enabled, if specified in options.'
    );

    chart.update({
        navigator: {
            series: {
                dataLabels: [{
                    enabled: false
                }]
            }
        }
    });

    assert.equal(
        chart.navigator.series[0].options.dataLabels[0].enabled,
        false,
        'DataLabels in Navigator should be enabled, if specified in options ' +
        '(wrapped with array).'
    );
});

QUnit.test('Scrolling when the range is set, #14742.', function (assert) {
    let cursor = 8;
    const chunk = 3,
        originalData = [7, 6, 9, 14, 8, 8, 5, 6, 4, 1, 3, 9, 4, 6, 7, 4],
        chart = Highcharts.stockChart('container', {
            xAxis: {
                range: 15
            },
            series: [{
                // 16 points -> range is 15
                data: originalData
            }]
        });

    function addPoints() {
        const data = originalData.slice(cursor, cursor + chunk);
        cursor += chunk;
        for (let i = 0; i < data.length; i++) {
            chart.series[0].addPoint(data[i], false, true);
        }

        chart.redraw();
    }

    assert.strictEqual(
        chart.xAxis[0].min,
        0,
        `Initially, for that number of points,
        the navigator should be placed on the left.`
    );

    chart.series[0].addPoint(3);
    assert.strictEqual(
        chart.xAxis[0].min,
        1,
        `After adding the point, the number of sections between ticks
        is greater than the range so the extremes should have changed.`
    );

    chart.series[0].addPoint(5);
    assert.strictEqual(
        chart.xAxis[0].min,
        2,
        'Adding another point should result in changing the extremes.'
    );

    chart.rangeSelector.clickButton(5); // all
    assert.strictEqual(
        chart.xAxis[0].min,
        0,
        'After selecting all, extremes should return to the initial one.'
    );

    chart.series[0].addPoint(5);
    assert.strictEqual(
        chart.xAxis[0].min,
        0,
        'When all button enabled, adding point should not change the extremes.'
    );

    chart.xAxis[0].setExtremes(2, 5);
    addPoints();

    assert.strictEqual(
        chart.xAxis[0].min,
        chart.series[0].data[0].x,
        `After changing the extremes and adding shifted points,
        min should stay at the begging of the data.`
    );
    assert.ok(
        chart.xAxis[0].max > chart.xAxis[0].min,
        `After changing the extremes and adding shifted points,
        the range should not equal zero.`
    );
});


QUnit.test(
    'Initiation chart without data but with set range, #15864.',
    function (assert) {
        const chart = Highcharts.stockChart('container', {
            rangeSelector: {
                selected: 1
            },
            series: [{
                pointInterval: 36e7
            }]
        });
        assert.notStrictEqual(
            chart.xAxis[0].max,
            0,
            `After adding series to the chart that has set the range,
        the navigator shouldn't stick to min.`
        );
    });


// Skipped due to impractical mock objects. Make integration test instead.
QUnit.skip('Navigator, testing method: getBaseSeriesMin', function (assert) {
    const method = Highcharts.Navigator.prototype.getBaseSeriesMin;

    const mocks = [
        // Regular case, simple series
        {
            baseSeries: [
                { xData: [-5, 0, 5] }
            ]
        },
        // Two series, one without xData
        {
            baseSeries: [
                { xData: [-5, 0, 5] },
                { }
            ]
        },
        // Two series, one without empty xData
        {
            baseSeries: [
                { xData: [-5, 0, 5] },
                { xData: [] }
            ]
        },
        // One series, undefiend in xData
        {
            baseSeries: [
                { xData: [-5, undefined, 5] }
            ]
        }
    ];

    mocks.forEach(mock => {
        const result = method.call(mock, 0);

        assert.strictEqual(
            result,
            -5,
            `With config: ${JSON.stringify(mock)}, the min should not be a NaN`
        );
    });
});