QUnit.test('Missing plotband when range is small (#4964)', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: {
            min: 1452666442250,
            max: 1453899392750,
            type: 'datetime',
            plotBands: [
                {
                    color: '#BDBDBD',
                    from: 1453101708000,
                    id: 'plotband-1',
                    to: 1453109508000
                },
                {
                    color: 'red',
                    from: 1453726531000,
                    to: 1453728606000
                }
            ]
        },
        series: [{}]
    });

    assert.strictEqual(
        chart.xAxis[0].plotLinesAndBands[1].svgElem.d.split(' ')[1] !==
            chart.xAxis[0].plotLinesAndBands[1].svgElem.d.split(' ')[6],
        true,
        'Second plotband is visible'
    );

    // #15639
    chart.xAxis[0].destroy();
    chart.xAxis[0].removePlotBand('plotband-1');

});

QUnit.test(
    'Plot bands on added axis should be exported (#5082)',
    function (assert) {
        var chart = Highcharts.chart('container', {
            chart: {
                height: 300
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

            yAxis: {
                title: {
                    text: 'Temperature'
                },
                lineWidth: 2,
                lineColor: '#F33',
                id: 'temperature-axis'
            },

            series: [
                {
                    name: 'Temperature',
                    data: [
                        7.0,
                        6.9,
                        9.5,
                        14.5,
                        18.2,
                        21.5,
                        25.2,
                        26.5,
                        23.3,
                        18.3,
                        13.9,
                        9.6
                    ],
                    color: '#F33'
                }
            ]
        });

        assert.strictEqual(chart.yAxis.length, 1, 'Chart has one Y axis');

        // Add secondary yAxis
        chart.addAxis({
            id: 'rainfall-axis',
            title: {
                text: 'Rainfall'
            },
            lineWidth: 2,
            lineColor: '#08F',
            opposite: true
        });

        // Add a plot band to it
        chart.yAxis[1].addPlotBand({
            color: '#abcdef',
            from: 12,
            to: 25
        });

        // ... and a series
        chart.addSeries({
            name: 'Rainfall',
            type: 'column',
            color: '#08F',
            yAxis: 'rainfall-axis',
            data: [
                49.9,
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
        });

        // Export it
        $('#output').html(chart.getSVG());

        assert.strictEqual(
            $('#output path[fill="#abcdef"]').length,
            1,
            'Correctly filled path is present in the export'
        );
    }
);

QUnit.test('Defaults', assert => {
    const chart = Highcharts.chart('container', {
        title: {
            text: 'Sensible defaults'
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

            plotLines: [
                {
                    value: 5.5
                }
            ]
        },

        yAxis: {
            plotBands: [
                {
                    from: 100,
                    to: 120
                }
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
                ]
            }
        ]
    });

    assert.strictEqual(
        chart.xAxis[0].plotLinesAndBands[0].svgElem.element.getAttribute(
            'stroke-width'
        ),
        '1',
        'A default stroke width should be applied to the plot line'
    );
    assert.ok(
        /^#[0-9a-f]{6}$/.test(
            chart.xAxis[0].plotLinesAndBands[0].svgElem.element.getAttribute(
                'stroke'
            )
        ),
        'A default stroke color should be applied to the plot line'
    );

    assert.ok(
        /^#[0-9a-f]{6}$/.test(
            chart.yAxis[0].plotLinesAndBands[0].svgElem.element.getAttribute(
                'fill'
            )
        ),
        'A default fill color should be applied to the plot band'
    );
});

QUnit.test('General tests', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            width: 600,
            marginRight: 50
        },
        xAxis: {
            type: 'datetime',
            plotBands: [
                {
                    color: '#FCFFC5',
                    from: '2024-02-01',
                    to: '2024-04-01',
                    zIndex: 10,
                    borderWidth: 3,
                    borderColor: 'black'
                }
            ],
            plotLines: [
                {
                    color: 'red',
                    value: '2024-05-01',
                    width: 3
                }
            ]
        },

        yAxis: {
            plotLines: [
                {
                    value: 12500,
                    className: 'my-custom-class',
                    width: 2,
                    color: 'red',
                    label: {
                        align: 'right',
                        textAlign: 'left',
                        text: 'label'
                    }
                }, {
                    value: 15000,
                    color: 'red',
                    label: {
                        align: 'right',
                        clip: true,
                        textAlign: 'left',
                        text: 'label'
                    }
                }
            ]
        },
        series: [
            {
                data: [
                    2900.9,
                    701.5,
                    10006.4,
                    12009.2,
                    1404.0,
                    1076.0,
                    135.6,
                    148.5,
                    21006.4
                ],
                pointStart: '2024-01-01',
                pointIntervalUnit: 'month'
            }
        ]
    });

    assert.ok(
        chart.yAxis[0].plotLinesAndBands[0].svgElem.element
            .classList
            .contains('my-custom-class'),
        'Class name should be applied to plot lines (#8415, #20586)'
    );

    var plPath = chart.xAxis[0].plotLinesAndBands[0].svgElem.d.split(' '),
        pbPath = chart.xAxis[0].plotLinesAndBands[1].svgElem.d.split(' ');

    assert.strictEqual(
        pbPath[pbPath.length - 1],
        'Z',
        'A border should be rendered around the shape (#5909)'
    );

    assert.close(
        plPath[1],
        chart.xAxis[0].toPixels(Date.UTC(2024, 4, 1)),
        1,
        'Datetime input for plot line should be converted to pixels'
    );

    assert.close(
        pbPath[1],
        chart.xAxis[0].toPixels(Date.UTC(2024, 1, 1)),
        1,
        'Datetime input for plot band should be converted to pixels'
    );

    assert.ok(
        chart.yAxis[0].plotLinesAndBands[0].label.actualWidth > 0,
        'Plot line label should be able to render outside plot area #17888.'
    );

    assert.strictEqual(
        chart.yAxis[0].plotLinesAndBands[1].label.actualWidth,
        0,
        `Plot label with clip: true should not be able to render outside plot
        area #15777.`
    );


    // Radial Axes plot lines
    var plotLineValue = 27,
        innerRadiusPx = 50,
        axis,
        plotLine,
        bBox,
        center,
        end,
        start,
        plotLineLength;

    chart = Highcharts.chart('container', {
        chart: {
            type: 'solidgauge'
        },
        title: null,
        pane: {
            center: ['50%', '50%'],
            size: '100%',
            startAngle: -90,
            endAngle: 90,
            background: {
                innerRadius: '43%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },
        yAxis: {
            min: 0,
            max: 200,
            lineWidth: 0,
            minorTickInterval: null,
            plotLines: [
                {
                    color: '#268FDD',
                    width: 2,
                    value: plotLineValue,
                    zIndex: 5
                }
            ]
        },
        series: [
            {
                innerRadius: '43%',
                data: [80]
            }
        ]
    });

    axis = chart.yAxis[0];
    plotLine = axis.plotLinesAndBands[0];
    bBox = plotLine.svgElem.getBBox();
    center = chart.pane[0].center;
    end = axis.getPosition(plotLineValue);
    start = {
        x: center[0] + chart.plotLeft,
        y: center[1] + chart.plotTop
    };
    plotLineLength = Math.sqrt(
        Math.pow(bBox.width, 2) + Math.pow(bBox.height, 2)
    );

    assert.equal(
        (
            0.57 *
            Math.sqrt(
                Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            )
        ).toFixed(3),
        plotLineLength.toFixed(3),
        'RadialAxis plotLine should be plotted ' +
            'from inner to outer radius (percentage radius).'
    );

    chart.update({
        pane: {
            background: {
                innerRadius: innerRadiusPx
            }
        }
    });

    plotLine = chart.yAxis[0].plotLinesAndBands[0];
    bBox = plotLine.svgElem.getBBox();
    plotLineLength = Math.sqrt(
        Math.pow(bBox.width, 2) + Math.pow(bBox.height, 2)
    );

    assert.equal(
        (
            Math.sqrt(
                Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            ) - innerRadiusPx
        ).toFixed(3),
        plotLineLength.toFixed(3),
        'RadialAxis plotLine should be plotted from ' +
            'inner to outer radius (pixel radius).'
    );
});

QUnit.test(
    '#6433 - axis.update leaves empty plotbands\' groups',
    function (assert) {
        var chart = new Highcharts.Chart('container', {
            chart: {
                width: 600
            },
            xAxis: {
                plotBands: [
                    {
                        from: 0.5,
                        to: 1,
                        color: 'red'
                    }
                ]
            },
            series: [
                {
                    data: [10, 20]
                }
            ]
        });

        chart.xAxis[0].update({});
        chart.xAxis[0].update({});

        assert.strictEqual(
            chart.container.getElementsByClassName('highcharts-plot-bands-0')
                .length,
            1,
            'Just one plotband group'
        );
    }
);

QUnit.test('#7709 - From and to infinity', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: {
            plotBands: [
                {
                    color: '#FCFFC5',
                    from: -Infinity,
                    to: Date.UTC(2010, 0, 3)
                },
                {
                    color: '#FCFFC5',
                    from: Date.UTC(2010, 0, 7),
                    to: Infinity
                }
            ],
            tickInterval: 24 * 3600 * 1000, // one day
            type: 'datetime'
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
                    216.4
                ],
                pointStart: Date.UTC(2010, 0, 1),
                pointInterval: 24 * 3600 * 1000
            }
        ]
    });

    assert.strictEqual(
        chart.container.querySelectorAll('.highcharts-plot-band').length,
        2,
        'Two plot bands should be created'
    );
});

QUnit.test('#6521 - missing labels for narrow bands', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            animation: false,
            width: 600
        },
        xAxis: {
            showEmpty: true,
            min: Date.UTC(2016, 0, 13),
            max: Date.UTC(2016, 0, 27),
            type: 'datetime',
            plotBands: [
                {
                    color: '#BDBDBD',
                    from: Date.UTC(2016, 0, 18, 4),
                    to: Date.UTC(2016, 0, 18, 4, 20),
                    label: {
                        rotation: 90,
                        text: 'Wide Enough',
                        inside: false
                    }
                },
                {
                    color: 'red',
                    from: Date.UTC(2016, 0, 25, 8),
                    to: Date.UTC(2016, 0, 25, 8),
                    label: {
                        rotation: 90,
                        text: 'Too Narrow',
                        inside: false
                    }
                }
            ]
        },
        series: [{}]
    });

    assert.strictEqual(
        chart.xAxis[0].plotLinesAndBands[0].label.element.textContent,
        'Wide Enough',
        'First label set'
    );
    assert.strictEqual(
        chart.xAxis[0].plotLinesAndBands[1].label.element.textContent,
        'Too Narrow',
        'Second label set'
    );

    chart.xAxis[0].setExtremes(null, Date.UTC(2016, 0, 20));
    assert.strictEqual(
        chart.xAxis[0].plotLinesAndBands[1].label.attr('visibility'),
        'hidden',
        'Outside range, label hidden'
    );

    chart.xAxis[0].setExtremes(null, Date.UTC(2016, 0, 30));
    assert.notEqual(
        chart.xAxis[0].plotLinesAndBands[1].label.attr('visibility'),
        'hidden',
        'Inside range, label shown'
    );
});

// Highcharts 4.0.4, Issue #2361
// X axis plot bands disappear when zooming in
QUnit.test('Plotbands clip (#2361)', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: {
            minRange: 1,
            plotBands: [
                {
                    color: '#FCFFC5',
                    from: 1,
                    to: 3,
                    label: {
                        text:
                            'I will dissapear if you zoom in <br/>so ' +
                            'the start of the band isn\'t visible'
                    }
                }
            ]
        },
        yAxis: {
            gridLineWidth: 0
        },

        series: [
            {
                type: 'column',
                data: [1, 2, 3, 4, 5, 6],
                pointPlacement: 'between'
            }
        ]
    });
    assert.notEqual(
        chart.xAxis[0].plotLinesAndBands[0].label,
        null,
        'Plotbands should be visible after zooming '
    );
    $('#container').highcharts().xAxis[0].setExtremes(2, 5);

    assert.notEqual(
        chart.xAxis[0].plotLinesAndBands[0].label,
        null,
        'Plotbands should be visible after zooming'
    );
    $('#container').highcharts().xAxis[0].setExtremes(4, 5);
    assert.equal(
        chart.xAxis[0].plotLinesAndBands[0].label.visibility,
        'hidden',
        'Plotbands should be hidden after zooming'
    );
});

QUnit.test(
    '#8356: support for plot lines & bands labels formatter.',
    function (assert) {
        var plotLine,
            plotBand,
            formatterCallback = function () {
                return 'Label is visible.';
            },
            chart = Highcharts.chart('container', {
                xAxis: {
                    plotLines: [
                        {
                            value: 1,
                            color: '#f00',
                            width: 1,
                            label: {
                                formatter: formatterCallback
                            }
                        }
                    ],
                    plotBands: [
                        {
                            from: 2,
                            to: 5,
                            color: 'rgba(255, 255, 0, 0.2)',
                            width: 1,
                            label: {
                                formatter: formatterCallback
                            }
                        }
                    ]
                },
                series: [
                    {
                        data: [1, 2, 6, 1, 2, 4, 9]
                    }
                ]
            });

        plotLine = chart.xAxis[0].plotLinesAndBands[0];
        plotBand = chart.xAxis[0].plotLinesAndBands[1];

        assert.ok(
            plotLine.label &&
                plotLine.label.element.textContent.indexOf(
                    formatterCallback()
                ) > -1,
            'Plot line label is visible.'
        );

        assert.ok(
            plotBand.label &&
                plotBand.label.element.textContent.indexOf(
                    formatterCallback()
                ) > -1,
            'Plot band label is visible.'
        );
    }
);

QUnit.test(
    '#13375: Click event on dynamically added plotBands.',
    function (assert) {
        var plotBandClicked,
            chart = Highcharts.chart('container', {
                series: []
            });

        chart.xAxis[0].addPlotBand({
            from: 0,
            to: 3,
            id: 'plotband',
            events: {
                click: function () {
                    plotBandClicked = true;
                }
            }
        });

        chart.addSeries({
            data: [1, 2, 3, 4]
        });

        const controller = new TestController(chart);
        controller.triggerEvent(
            'mouseover',
            chart.series[0].data[2].plotX + chart.plotLeft - 20,
            chart.series[0].data[2].plotY + chart.plotTop - 20,
            {},
            false
        );
        controller.click(
            chart.series[0].data[2].plotX + chart.plotLeft - 20,
            chart.series[0].data[2].plotY + chart.plotTop - 20,
            {},
            false
        );

        assert.ok(
            plotBandClicked,
            'Plot band click event was correctly triggered.'
        );
    }
);

QUnit.test('Dynamically added plotbands', function (assert) {
    const chart = Highcharts.chart('container', {
        chart: {
            zoomType: 'xy'
        },
        xAxis: {
            tickInterval: 24 * 3600 * 1000,
            type: 'datetime',
            visible: false
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
                    100,
                    110,
                    120,
                    101,
                    115,
                    128,
                    99,
                    80,
                    132
                ],
                pointStart: Date.UTC(2010, 0, 1),
                pointInterval: 24 * 3600 * 1000
            }
        ]
    });

    chart.xAxis[0].addPlotBand({
        color: '#FCFFC5',
        from: Date.UTC(2010, 0, 2),
        to: Date.UTC(2010, 0, 4)
    });

    assert.ok(
        !chart.xAxis[0].plotLinesAndBands[0].svgElem,
        '#14310: plotBand should not render when axis is not visible'
    );

    chart.update({
        xAxis: {
            visible: true
        }
    });

    assert.ok(
        !!chart.xAxis[0].plotLinesAndBands[0].svgElem,
        '#14310: plotBand should render when axis visibility gets ' +
        'dynamically updated'
    );

    chart.xAxis[0].update({}, false);
    chart.xAxis[0].addPlotBand({
        color: '#FCFFC5',
        from: Date.UTC(2010, 0, 4),
        to: Date.UTC(2010, 0, 5)
    });
    chart.redraw();

    assert.strictEqual(
        chart.xAxis[0].plotLinesAndBands.length,
        2,
        '#14053: plotBands from before update with redraw=false should also ' +
        'be added'
    );

    chart.series[0].hide();

    assert.ok(
        chart.xAxis[0].plotLinesAndBands[0].svgElem.pathArray.isFlat,
        '#15434: plotBand should be hidden series is hidden'
    );
});

QUnit.test('#14254: plotBands.acrossPanes', function (assert) {
    var chart = Highcharts.stockChart('container', {
        series: [
            {
                data: [1, 2, 3, 4]
            },
            {
                data: [1, 2, 3, 4],
                yAxis: 1
            }
        ],
        yAxis: [
            {
                height: '50%'
            },
            {
                height: '50%',
                top: '50%'
            }
        ],
        xAxis: [
            {
                plotBands: [
                    {
                        from: 2,
                        to: 3,
                        acrossPanes: false
                    },
                    {
                        from: 2,
                        to: 3,
                        acrossPanes: true
                    }
                ],
                height: '50%'
            }
        ]
    });

    var bands = [
        chart.xAxis[0].plotLinesAndBands[0].svgElem.getBBox(),
        chart.xAxis[0].plotLinesAndBands[1].svgElem.getBBox()
    ];

    assert.ok(
        bands[1].height > bands[0].height,
        'plotBand with acrossPanes = true has greater height'
    );
});

QUnit.test(
    '#21521: Hiding overlapping plotBand/plotLine labels ',
    function (assert) {
        const chart = Highcharts.chart('container', {
                xAxis: {
                    plotBands: [{
                        from: 0,
                        to: 1,
                        label: {
                            text: '0000000000000000'
                        }
                    },
                    {
                        from: 0,
                        to: 1,
                        label: {
                            text: '================'
                        }
                    },
                    {
                        from: 0,
                        to: 1,
                        label: {
                            text: '%%%%%%%%%%%%%%%%'
                        }
                    }]
                },

                series: [{
                    data: [1, 2, 3]
                }]
            }),
            xAxis = chart.series[0].xAxis,
            opacityTester = vals => {
                const plotLinesAndBands = xAxis.plotLinesAndBands;

                for (let i = 0; i < 3; i++) {
                    assert.strictEqual(
                        plotLinesAndBands[i].label.opacity,
                        vals[i],
                        `Opacity of label number ${i} should be ${vals[i]}`
                    );
                }
            };

        opacityTester([1, 0, 0]);

        chart.series[0].xAxis.update({
            plotBands: [{
                from: 0,
                to: 1,
                label: {
                    text: '0000000000000000',
                    allowOverlap: true
                }
            },
            {
                from: 0,
                to: 1,
                label: {
                    text: '================',
                    allowOverlap: true
                }
            },
            {
                from: 0,
                to: 1,
                label: {
                    text: '%%%%%%%%%%%%%%%%'
                }
            }]
        });

        opacityTester([1, 1, 1]);
    }
);
