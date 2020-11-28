QUnit.test('Ticks were drawn in break(#4485)', function (assert) {

    $('#container').highcharts({
        title: {
            text: 'Sample of a simple break'
        },
        subtitle: {
            text: 'Line should be interrupted between 5 and 10'
        },
        xAxis: {
            type: 'datetime',
            tickInterval: 1,
            breaks: [{
                from: 5,
                to: 10,
                breakSize: 1
            }],
            labels: {
                format: '{value}{value}{value}'
            }

        },
        series: [{
            gapSize: 1,
            data: (function () {
                var data = [],
                    i;
                for (i = 0; i < 20; i = i + 1) {
                    data.push(i);
                }
                return data;
            }())

        }]
    });

    var chart = $('#container').highcharts();

    assert.strictEqual(
        chart.xAxis[0].tickPositions.join(','),
        '0,1,2,3,4,5,10,11,12,13,14,15,16,17,18,19',
        'Skip ticks in break'
    );

});

QUnit.test(
    'alignTicks should consider only axes with series.(#4442)',
    function (assert) {
        var chart = $('#container').highcharts({
            yAxis: [{
                endOnTick: false,
                maxPadding: 0.0
            }, {
                endOnTick: false,
                maxPadding: 0.0
            }],
            series: [{
                data: [991, 455],
                yAxis: 1
            }]
        }).highcharts();

        assert.strictEqual(
            chart.series[0].data[0].plotY,
            0,
            'Without extra padding'
        );
    }
);

QUnit.test(
    "tickInterval option should take precedence over data range(#4184)",
    function (assert) {
        var chart = $("#container").highcharts({
            xAxis: {
                min: 0,
                max: 12,
                tickInterval: 1
            },
            series: [{
                type: 'column',
                //pointRange: 1,
                data: [
                    [7, 7],
                    [10, 8]
                ]
            }]
        }).highcharts();

        assert.strictEqual(
            chart.xAxis[0].tickInterval,
            1,
            'Actual tick interval is as option'
        );
    }
);
QUnit.test('Prevent dense ticks(#4477)', function (assert) {


    $('#container').highcharts({
        chart: {
            type: "bar"
        },
        title: {
            text: 'Only first and last axis label should be kept'
        },
        yAxis: [{
            labels: {
                staggerLines: 1
            },
            tickInterval: 1
        }],
        series: [{
            data: [100000],
            type: "column"
        }]
    });

    var chart = $('#container').highcharts();

    assert.strictEqual(
        chart.yAxis[0].tickPositions.length < chart.yAxis[0].len,
        true,
        'Not too many tick positions'
    );
});

QUnit.test(
    'Clip tickPositions when axis extremes are set(#4086)',
    function (assert) {
        var chart = Highcharts.chart('container', {
            xAxis: {
                minRange: 8,
                tickPositions: [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
                ],
                min: 5,
                max: 15
            },

            series: [{
                data: [
                    29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6,
                    148.5, 216.4, 194.1, 95.6, 54.4, 29.9, 71.5, 106.4, 129.2,
                    144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4
                ]
            }]
        });

        assert.strictEqual(
            chart.xAxis[0].tickPositions.join(','),
            '5,6,7,8,9,10,11,12,13,14,15',
            'Tick positions are trimmed'
        );
    }
);
QUnit.test('Step=1 should preserve ticks(#4411)', function (assert) {
    var data = [
        107, 31, 635, 203, 2, 107, 31, 635, 203, 2, 107, 31, 635, 203,
        2, 107, 31, 635, 203, 2, 107, 31, 635, 203, 2, 107, 31, 635, 203, 2
    ];
    var chart = $('#container').highcharts({
        chart: {
            type: 'bar'
        },
        xAxis: {
            labels: {
                step: 1
            },
            categories: [
                'Africa', 'America', 'Asia', 'Europe', 'Oceania',
                'Africa', 'America', 'Asia', 'Europe', 'Oceania',
                'Africa', 'America', 'Asia', 'Europe', 'Oceania',
                'Africa', 'America', 'Asia', 'Europe', 'Oceania',
                'Africa', 'America', 'Asia', 'Europe', 'Oceania',
                'Africa', 'America', 'Asia', 'Europe', 'Oceania'
            ]
        },
        series: [{
            name: 'Year 1800',
            data: data
        }]
    }).highcharts();


    assert.strictEqual(
        chart.xAxis[0].tickPositions.length,
        data.length,
        'Tick amount'
    );

});

QUnit.test('Ticks for a single point.', function (assert) {
    var chart = Highcharts.chart('container', {
        yAxis: {
            tickPositioner: function () {
                return [0, 0.2, 0.4, 0.6, 0.8];
            }
        },
        series: [{
            data: [0.2]
        }]
    });

    assert.strictEqual(
        chart.yAxis[0].min,
        0,
        'multiple ticks from tickPositioner for a single point (#6897)'
    );

    chart.yAxis[0].update({
        tickPositioner: function () {}
    });

    assert.strictEqual(
        chart.yAxis[0].min,
        -0.3,
        'single tick and increased extremes for a single point'
    );

    chart.yAxis[0].update({
        tickAmount: 10
    });
    assert.strictEqual(
        chart.yAxis[0].min,
        0,
        'When softThreshold is true (by default), tick amount should not ' +
        'extend the ticks below 0'
    );


    chart.series[0].points[0].update(10);
    assert.strictEqual(
        chart.yAxis[0].min < 7 && chart.yAxis[0].max > 14,
        true,
        'ticks added via tickAmount increase both min and max (#3965)'
    );

    // Must be on init - redraw was fixing the issue
    chart = Highcharts.chart('container', {
        series: [{
            type: 'bar',
            data: [10]
        }],
        chart: {
            height: 30,
            inverted: true,
            spacing: [6, 10, 6, 10]
        },
        legend: {
            enabled: false
        },
        title: {
            text: ''
        },
        yAxis: [{
            visible: false
        }],
        xAxis: [{
            visible: false
        }]
    });

    assert.strictEqual(
        chart.xAxis[0].tickPositions.length,
        1,
        'no doulbed tick for a small plot height (#7339)'
    );
});

QUnit.test('The tickAmount option', assert => {
    const chart = Highcharts.chart('container', {
        series: [{
            data: [1, 2]
        }],
        xAxis: {
            tickAmount: 5
        }
    });

    assert.ok(
        chart.xAxis[0].max > 1,
        'The axis extreme should be greater than the max value (#9841)'
    );
});

QUnit.test('The tickPositions option', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            zoomType: 'x'
        },

        xAxis: [{
            tickmarkPlacement: 'on',
            startOnTick: false,
            categories: ['Jan 2011', 'Feb 2011', 'Mar 2011', 'Apr 2011',
                'May 2011', 'Jun 2011', 'Jul 2011', 'Aug 2011', 'Sep 2011',
                'Oct 2011', 'Nov 2011', 'Dec 2011', 'Jan 2012', 'Feb 2012',
                'Mar 2012', 'Apr 2012', 'May 2012', 'Jun 2012', 'Jul 2012',
                'Aug 2012', 'Sep 2012', 'Oct 2012', 'Nov 2012', 'Dec 2012',
                'Jan 2013'],
            tickPositions: [0, 7, 15, 24]

        }],

        series: [{
            data: [134002, 135188, 135647, 136552, 166109, 166769, 141139,
                141879, 140443, 141188, 178745, 179790, 141385, 142161, 143365,
                144679, 175150, 141385, 142161, 143365, 144679, 175150, 144679,
                175150, 175150]
        }]
    });

    assert.strictEqual(
        chart.xAxis[0].tickPositions.toString(),
        '0,7,15,24',
        'Rendered positions should respect the given option'
    );

    // Zoom between two ticks
    chart.xAxis[0].setExtremes(8, 14);

    assert.strictEqual(
        chart.xAxis[0].tickPositions.length,
        0,
        'No extra ticks should be inserted when zooming between explicit ' +
        'ticks (#7463)'
    );

});

QUnit.test(
    'Tick positions with small magnitude intervals (#6183)',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                width: 500,
                height: 400
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                endOnTick: false,
                startOnTick: false
            },
            series: [{
                data: [700540999999.9757, 700541000000]
            }]

        });

        assert.ok(
            chart.yAxis[0].tickPositions.length >= 3,
            'Multiple ticks'
        );
    }
);

QUnit.test(
    'Ticks should be visible, when xAxis is reversed (#4175)',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
            xAxis: {
                reversed: true
            },
            rangeSelector: {
                selected: 1
            },
            navigator: {
                enabled: false
            },
            series: [{
                data: [
                    [Date.UTC(2007, 7, 29), 0.7311],
                    [Date.UTC(2007, 7, 30), 0.7331],
                    [Date.UTC(2007, 7, 31), 0.7337],
                    [Date.UTC(2007, 8, 3), 0.7342],
                    [Date.UTC(2007, 8, 4), 0.7349],
                    [Date.UTC(2007, 8, 5), 0.7326],
                    [Date.UTC(2007, 8, 6), 0.7306],
                    [Date.UTC(2007, 8, 7), 0.7263],
                    [Date.UTC(2007, 8, 10), 0.7247],
                    [Date.UTC(2007, 8, 11), 0.7227],
                    [Date.UTC(2007, 8, 12), 0.7191],
                    [Date.UTC(2007, 8, 13), 0.7209],
                    [Date.UTC(2007, 8, 14), 0.7207],
                    [Date.UTC(2007, 8, 17), 0.7211],
                    [Date.UTC(2007, 8, 18), 0.7153],
                    [Date.UTC(2007, 8, 19), 0.7165],
                    [Date.UTC(2007, 8, 20), 0.7107],
                    [Date.UTC(2007, 8, 21), 0.7097],
                    [Date.UTC(2007, 8, 24), 0.7098],
                    [Date.UTC(2007, 8, 25), 0.7069],
                    [Date.UTC(2007, 8, 26), 0.7078],
                    [Date.UTC(2007, 8, 27), 0.7066],
                    [Date.UTC(2007, 8, 28), 0.7006],
                    [Date.UTC(2007, 9, 1), 0.7027],
                    [Date.UTC(2007, 9, 2), 0.7067],
                    [Date.UTC(2007, 9, 3), 0.7097],
                    [Date.UTC(2007, 9, 4), 0.7074],
                    [Date.UTC(2007, 9, 5), 0.7075],
                    [Date.UTC(2007, 9, 8), 0.7114]
                ]
            }]
        });

        assert.strictEqual(
            chart.xAxis[0].tickPositions.length > 2,
            true,
            'Ticks exist'
        );

    }
);

QUnit.test(
    'tickPixelInterval option',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                height: 300
            },
            subtitle: {
                text: 'test'
            },
            yAxis: {
                tickPixelInterval: 1
            },
            series: [{
                data: [6, -8.4, 6.5, 4]
            }]
        });

        assert.ok(
            chart.yAxis[0].tickPositions.indexOf(0) !== -1,
            '0-tick on yAxis exists (#8129)'
        );
    }
);

// Highcharts 4.0.4, Issue #3500
// Monthly X axis ticks are wrong with timezoneOffset
QUnit.test('Monthly ticks (#3500)', function (assert) {

    var resetTo = {
        global: {
            timezoneOffset: Highcharts.defaultOptions.timezoneOffset
        }
    };

    Highcharts.setOptions({
        global: {
            timezoneOffset: 240
        }
    });
    var chart = Highcharts.chart('container', {
        chart: {
            width: 600,
            marginRight: 100
        },

        title: {
            text: 'Monthly ticks'
        },

        xAxis: {
            type: 'datetime',
            labels: {
                format: '{value:%Y-%m-%d<br>%H:%M}'
            },
            startOnTick: true,
            endOnTick: true,
            tickPixelInterval: 180
        },

        series: [{
            data: [{
                x: Date.UTC(2014, 0, 1),
                y: 3
            }, {
                x: Date.UTC(2014, 1, 1),
                y: 5
            }, {
                x: Date.UTC(2014, 2, 1),
                y: 7
            }, {
                x: Date.UTC(2014, 3, 1),
                y: 2
            }, {
                x: Date.UTC(2014, 4, 1),
                y: 5
            }],
            pointStart: Date.UTC(2014, 0, 1),
            pointInterval: 24 * 36e5
        }]
    });

    var expectedTicksText = [
            '2013-11-01',
            '2014-01-01',
            '2014-03-01',
            '2014-05-01',
            '2014-07-01'],
        ticksText = [],
        tickPositions = chart.xAxis[0].tickPositions;

    for (var i = 0; i < tickPositions.length; i++) {
        ticksText.push(
            chart.xAxis[0].ticks[tickPositions[i]]
                .label.element.childNodes[0].textContent
        );
    }

    assert.deepEqual(
        expectedTicksText,
        ticksText,
        "Monthly X axis ticks is not correct"
    );
    // Reset
    Highcharts.setOptions(resetTo);
});
// Highcharts v4.0.3, Issue #3202
// tickInterval for categorized axis
QUnit.test('Tickinterval categories (#3202)', function (assert) {

    TestTemplate.test('highcharts/line', {
        xAxis: {
            categories: Highcharts.getOptions().lang.months,
            tickInterval: 2,
            tickWidth: 1
        }
    }, function (template) {

        var chart = template.chart,
            series = chart.series[0],
            xAxis = chart.xAxis[0],
            points = series.points,
            point1 = Highcharts.offset(points[0].graphic.element),
            point1Box = points[0].graphic.getBBox(),
            point2 = Highcharts.offset(points[2].graphic.element),
            point2Box = points[0].graphic.getBBox(),
            ticks = xAxis.ticks,
            tick1 = Highcharts.offset(ticks[0].mark.element),
            tick1Box = ticks[0].mark.getBBox(),
            tick2 = Highcharts.offset(ticks[2].mark.element),
            tick2Box = ticks[2].mark.getBBox();

        assert.close(
            (tick1.left + (tick1Box.width / 2)),
            (point1.left + (point1Box.width / 2)),
            {
                Chrome: 0.51,
                Edge: 0.01,
                Firefox: 3,
                MSIE: 0.01,
                Safari: 1.51
            }[TestUtilities.browser],
            'Tick marks should be on tick when tickInterval != 1'
        );

        assert.close(
            (tick2.left + (tick2Box.width / 2)),
            (point2.left + (point2Box.width / 2)),
            {
                Chrome: 0.51,
                Edge: 0.01,
                Firefox: 3,
                MSIE: 0.01,
                Safari: 0.51
            }[TestUtilities.browser],
            'Tick marks should be on tick when tickInterval != 1'
        );
    });
});

// Highcharts v4.0.3, Issue #3363
// Don't show decimals on yearly X axis
QUnit.test('Yearly values (#3363)', function (assert) {
    var chart = Highcharts.chart('container', {
        series: [{
            data: [
                [1998, 1],
                [1999, 2],
                [2000, 3],
                [2001, 4],
                [2002, 5],
                [2003, 6],
                [2004, 7],
                [2005, 8],
                [2006, 9],
                [2007, 10],
                [2008, 11],
                [2009, 12],
                [2010, 13]
            ]
        }]
    });

    function checkIfArrayContainDecimalNumbers(tickLabels) {
        for (var i = 0; i < tickLabels.length; i++) {
            if (tickLabels[i] % 1 !== 0) {
                return false;
            }
        }
        return true;
    }

    var xAxesTickLabels = chart.xAxis[0].tickPositions;
    assert.ok(
        checkIfArrayContainDecimalNumbers(xAxesTickLabels),
        "The yearly X axis should contain a number with a decimal"
    );
    xAxesTickLabels.push(2011.5);
    assert.notOk(
        checkIfArrayContainDecimalNumbers(xAxesTickLabels),
        "The yearly X axis should contain a number with a decimal"
    );
});

// Highcharts v4.0.1, Issue #3195
// No ticks on a short axis with startOnTick and endOnTick = false
QUnit.test('No ticks on short axis (#3195)', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            height: 180
        },
        yAxis: {
            minorTickInterval: 'auto',
            endOnTick: false,
            startOnTick: false,
            title: {
                text: ''
            }
        },
        series: [{
            data: [
                380884, 380894, 380894.19, 381027.93, 386350.57, 381027.93,
                343328.53, 343560.03, 343364.04, 343364.04, 343364.04, 343364.04
            ]
        }, {
            data: [
                370207, 367742, 367309, 370140, 374598, 369605, 332312,
                330942.6462461687, 331200, 333260, 332632, 329863
            ]
        }, {
            data: [
                217020, 217020, 217020, 217020, 217020, 217020,
                217020, 217020.83795782478, 217020, 217020, 217020, 217020
            ]
        }]
    });

    var yAxis = chart.yAxis[0],
        yAxisTick = yAxis.ticks,
        tickText = yAxis.labelGroup.element.childNodes[0].textContent,
        listOfGridNodes = yAxis.gridGroup.element.childNodes;

    assert.notStrictEqual(
        yAxisTick,
        undefined,
        "No tick is showing"
    );
    assert.strictEqual(
        tickText,
        "300k",
        "The content of the tick should be 300k"
    );
    assert.ok(
        listOfGridNodes.length > 0,
        "Grid lines is not visible"
    );
});

QUnit.test(
    'The ticks should be visible when specified' +
    ' tick amount and chart height <200px',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                height: 170
            },
            yAxis: {
                tickAmount: 5
            },
            series: [{
                data: [3, 5, 6, 7, 9, 5]
            }]
        });

        var yAxis = chart.yAxis[0],
            tickAmount = yAxis.tickPositions.length;

        assert.strictEqual(
            tickAmount,
            5,
            "The amount of tick should be 5."
        );
    }
);

QUnit.test('Ticks and setSize', assert => {
    const clock = TestUtilities.lolexInstall();
    const done = assert.async(2);

    try {
        const chart = Highcharts.chart('container', {

            chart: {
                width: 400,
                height: 300,
                animation: {
                    duration: 100
                }
            },

            series: [{
                data: [30, 220]
            }]
        });

        const pos100 = chart.yAxis[0].ticks[100].label.attr('y');
        const pos200 = chart.yAxis[0].ticks[200].label.attr('y');

        assert.strictEqual(
            chart.yAxis[0].ticks[150],
            undefined,
            'There should be no tick on 150 initially with the current tick ' +
            'position settings as of v8.1'
        );
        chart.setSize(undefined, 350);

        setTimeout(() => {
            const pos150 = chart.yAxis[0].ticks[150].label.attr('y');

            assert.close(
                pos150,
                (pos100 + pos200) / 2,
                1,
                'The new tick should appear centered between the two ' +
                'existing ticks (#13507)'
            );
            done();
        }, 1);

        setTimeout(() => {
            chart.xAxis[0].update(undefined, false);
            chart.setSize(500);

            assert.strictEqual(
                chart.xAxis[0].ticks[0].label.attr('opacity'),
                1,
                'The label should remain visible after the update ' +
                'sequence (#12137)'
            );
            done();
        }, 2);


        TestUtilities.lolexRunAndUninstall(clock);
    } finally {
        TestUtilities.lolexUninstall(clock);
    }

});

QUnit.test('The tick interval after updating series visibility should stay ' +
    'the same (#13369)', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: {
            type: 'datetime'
        },
        series: [{
            type: 'scatter',
            data: [{
                x: Date.UTC(2020, 1, 1),
                y: 8
            }, {
                x: Date.UTC(2020, 1, 2),
                y: 5
            }, {
                x: Date.UTC(2020, 1, 3),
                y: 4
            }]
        }, {
            type: 'line',
            visible: false,
            data: [{
                x: Date.UTC(2020, 1, 1),
                y: 7.0
            }, {
                x: Date.UTC(2020, 1, 3),
                y: 7.0
            }]
        }]
    });

    var initialTickInterval = chart.xAxis[0].tickPositions;

    chart.series[1].setVisible(true);

    assert.deepEqual(
        initialTickInterval,
        chart.xAxis[0].tickPositions,
        'Using the scatter and line series the ' +
        'tick interval should stay the same.'
    );

    chart.addSeries({
        type: 'column',
        visible: true,
        data: [{
            x: Date.UTC(2020, 1, 1),
            y: 7.0
        }, {
            x: Date.UTC(2020, 1, 3),
            y: 7.0
        }]
    });

    assert.deepEqual(
        chart.xAxis[0].tickPositions,
        [1580515200000, 1580688000000],
        'After adding columns series the tick interval ' +
        'should change to make a place for columns.'
    );
});

QUnit.test('In trimTicks, Min and max must be checked when ' +
    'start/endOntick are false (#14417).', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: {
            categories: ['Jan', 'Feb']
        },

        yAxis: {
            startOnTick: false,
            endOnTick: false,
            min: 220  // Exceeds 216.4
        },

        series: [{
            data: [29.9, 216.4]
        }]
    });

    assert.ok(
        chart.yAxis[0].max >= 220,
        'Max must be 220 to prevent showing parts of chart'
    );

    chart.yAxis[0].update({
        startOnTick: false,
        endOnTick: false,
        min: null,
        max: 22   // Now max is less than 29.9
    });

    assert.ok(
        chart.yAxis[0].min <= 22,
        'Min must be 22 to prevent showing parts of chart'
    );
});

QUnit.test('#14555: Big values', assert => {
    [
        [0, 1.7e+308],
        [0, -1.7e+308]
    ].forEach(data => {
        const chart = Highcharts.chart('container', {
            series: [{ data }]
        });

        const axis = chart.yAxis[0];

        assert.ok(
            axis.tickInterval < Infinity,
            'tickInterval should be finite'
        );
        assert.ok(
            axis.tickPositions.length > 0,
            'There should be more than 0 ticks'
        );
    });
});