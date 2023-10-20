QUnit.test('Center the halo on the point(#4689)', function (assert) {
    var chart,
        options = {
            chart: {
                width: 500,
                height: 300
            },
            series: [
                {
                    data: [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]
                }
            ],
            plotOptions: {
                line: {
                    marker: {
                        symbol: 'circle',
                        states: {
                            hover: {
                                fillColor: 'white',
                                radius: 2
                            }
                        }
                    },
                    states: {
                        hover: {
                            halo: {
                                size: 5,
                                opacity: 1,
                                attributes: {
                                    fill: 'black'
                                }
                            },
                            lineWidthPlus: 0
                        }
                    }
                }
            }
        };

    function getCenter(box) {
        return [
            (box.x + box.width / 2).toFixed(0),
            (box.y + box.height / 2).toFixed(0)
        ].join(',');
    }

    // Non-inverted chart
    chart = $('#container').highcharts(options).highcharts();

    for (var i = 0; i < chart.series[0].points.length; i++) {
        chart.series[0].points[i].onMouseOver();
        assert.strictEqual(
            getCenter(chart.series[0].points[i].graphic.getBBox()),
            getCenter(chart.series[0].halo.getBBox()),
            'Point ' + i + ' and halo has the same center'
        );
    }
});

QUnit.test('Point inactive state - basics', function (assert) {
    var chart = Highcharts.chart('container', {
            plotOptions: {
                series: {
                    states: {
                        inactive: {
                            opacity: 0.1,
                            animation: false
                        }
                    },
                    marker: {
                        states: {
                            inactive: {
                                opacity: 0.1
                            }
                        }
                    }
                }
            },
            series: [
                {
                    data: [5, 10, 15]
                },
                {
                    data: [15, 15, 13]
                }
            ]
        }),
        controller = new TestController(chart);

    controller.mouseMove(
        chart.series[0].points[1].plotX + chart.plotLeft + 15,
        chart.series[0].points[1].plotY + chart.plotTop
    );

    assert.strictEqual(
        Highcharts.attr(chart.series[1].group.element, 'opacity'),
        '0.1',
        'Correct opacity for inactive series.'
    );
});

QUnit.test(
    'Point inactive state - series mix, shared tooltip, legend',
    function (assert) {
        var chart = Highcharts.chart('container', {
                plotOptions: {
                    series: {
                        states: {
                            inactive: {
                                opacity: 0.1,
                                animation: false
                            }
                        },
                        marker: {
                            states: {
                                inactive: {
                                    opacity: 0.1,
                                    animation: false
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    shared: true
                },
                series: [
                    {
                        data: [5, 10, 15]
                    },
                    {
                        type: 'column',
                        data: [15, 15, 13, 16],
                        allowPointSelect: true
                    }
                ]
            }),
            legend = chart.legend,
            controller = new TestController(chart);

        controller.mouseMove(
            chart.series[0].points[2].plotX + chart.plotLeft,
            chart.series[0].points[2].plotY + chart.plotTop
        );

        assert.ok(
            Highcharts.attr(chart.series[0].group.element, 'opacity') !== '0.1',
            'Shared tooltip: no change in opacity when Series 1' +
                ' has hovered points'
        );

        assert.ok(
            Highcharts.attr(chart.series[1].group.element, 'opacity') !== '0.1',
            'Shared tooltip: no change in opacity when Series 2' +
                ' has hovered points'
        );

        controller.mouseMove(
            chart.series[1].points[3].plotX + chart.plotLeft + 5,
            chart.series[1].points[3].plotY + chart.plotTop - 15
        );

        assert.strictEqual(
            Highcharts.attr(chart.series[0].group.element, 'opacity'),
            '0.1',
            'Shared tooltip: Series 1 has no point for shared tooltip,' +
                ' opacity changed'
        );

        assert.ok(
            Highcharts.attr(chart.series[1].group.element, 'opacity') !== '0.1',
            'Shared tooltip: no change in opacity when Series 1' +
                ' has hovered points'
        );

        controller.mouseOver(
            legend.group.translateX + legend.maxItemWidth * 1.5,
            legend.group.translateY + legend.itemHeight
        );

        assert.strictEqual(
            Highcharts.attr(chart.series[0].group.element, 'opacity'),
            '0.1',
            'Legend hover: correct inactive series opacity'
        );

        assert.ok(
            Highcharts.attr(chart.series[1].group.element, 'opacity') !== '0.1',
            'Legend hover: correct hovered series opacity'
        );

        controller.click(
            chart.plotLeft + chart.series[1].points[3].plotX,
            chart.plotTop + chart.series[1].points[3].plotY + 5
        );

        controller.mouseOver(
            chart.plotLeft + chart.series[1].points[0].plotX,
            chart.plotTop + chart.series[1].points[0].plotY + 5
        );

        controller.click(
            chart.plotLeft + chart.series[1].points[0].plotX,
            chart.plotTop + chart.series[1].points[0].plotY + 5
        );

        assert.strictEqual(
            chart.series[1].points[3].state,
            'normal',
            'Correct state for column after deselection (#10504)'
        );
    }
);

QUnit.test(
    'Point inactive state - series with inactive points within',
    function (assert) {
        var chart = Highcharts.chart('container', {
                plotOptions: {
                    series: {
                        states: {
                            inactive: {
                                opacity: 0.1,
                                animation: false
                            }
                        },
                        marker: {
                            states: {
                                inactive: {
                                    opacity: 0.1,
                                    animation: false
                                }
                            }
                        }
                    }
                },
                series: [
                    {
                        type: 'networkgraph',
                        layoutAlgorithm: {
                            integration: 'verlet'
                        },
                        keys: ['from', 'to'],
                        data: [
                            ['A', 'B'],
                            ['B', 'C']
                        ]
                    },
                    {
                        type: 'pie',
                        showInLegend: true,
                        data: [5, 10]
                    }
                ]
            }),
            legend = chart.legend,
            controller = new TestController(chart);

        controller.mouseOver(
            chart.series[0].nodes[0].plotX + chart.plotLeft,
            chart.series[0].nodes[0].plotY + chart.plotTop
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[0].nodes[0].graphic.element,
                'opacity'
            ),
            '1',
            'Networkgraph series: hover states applied on the first point'
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[0].nodes[1].graphic.element,
                'opacity'
            ),
            '1',
            'Networkgraph series: hover state applied on the second point'
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[0].nodes[2].graphic.element,
                'opacity'
            ),
            '0.1',
            'Networkgraph series: inactive state applied on the third point'
        );

        controller.mouseOver(
            chart.series[1].points[0].shapeArgs.x + chart.plotLeft + 15,
            chart.series[1].points[0].shapeArgs.y + chart.plotTop - 15
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[1].points[0].graphic.element,
                'opacity'
            ),
            '1',
            'Pie series: hover state applied on the first point'
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[1].points[1].graphic.element,
                'opacity'
            ),
            '0.1',
            'Pie series: inactive state applied on the second point'
        );

        controller.mouseOver(
            legend.group.translateX + legend.maxItemWidth * 1.5,
            legend.group.translateY + legend.itemHeight
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[0].points[0].graphic.element,
                'opacity'
            ),
            '0.3',
            'Legend hover: correct inactive series point opacity'
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[1].points[0].graphic.element,
                'opacity'
            ),
            '0.1',
            'Legend hover: correct hovered series point opacity -other point'
        );

        assert.strictEqual(
            Highcharts.attr(
                chart.series[1].points[1].graphic.element,
                'opacity'
            ),
            '1',
            'Legend hover: correct hovered series point opacity -current point'
        );
    }
);

QUnit.test('Dynamic point states', function (assert) {
    var chart = new Highcharts.Chart('container', {
            chart: {
                zoomType: 'xy'
            },
            tooltip: {
                shared: true
            },
            series: [
                {
                    type: 'line',
                    data: [
                        1,
                        2,
                        1,
                        2,
                        1,
                        3,
                        3,
                        5,
                        6,
                        6,
                        54,
                        4,
                        3,
                        3,
                        2,
                        2,
                        2,
                        3,
                        4,
                        4,
                        5,
                        56,
                        7,
                        7
                    ],
                    marker: {
                        enabled: false
                    }
                },
                {
                    type: 'line',
                    data: [
                        1,
                        2,
                        1,
                        2,
                        1,
                        3,
                        3,
                        5,
                        6,
                        6,
                        54,
                        4,
                        3,
                        3,
                        2,
                        2,
                        2,
                        3,
                        4,
                        4,
                        5,
                        56,
                        7,
                        7
                    ].reverse(),
                    marker: {
                        enabled: false
                    }
                }
            ]
        }),
        topX = chart.xAxis[0].toPixels(8.9, true),
        topY = chart.yAxis[0].toPixels(0),
        bottomX = chart.xAxis[0].toPixels(9.1, true),
        bottomY = chart.yAxis[0].toPixels(10),
        haloBox;

    var test = new TestController(chart);

    // Zoom in
    test.pan([topX, topY], [bottomX, bottomY]);

    chart.hoverPoints.forEach((point, index) => {
        haloBox = point.series.halo.getBBox(true);

        assert.close(
            haloBox.x + haloBox.width / 2,
            point.plotX,
            1,
            'Point index: ' +
                index +
                ' - correct x-position for halo after zoom (#8284).'
        );

        assert.close(
            haloBox.y + haloBox.height / 2,
            point.plotY,
            1,
            'Point index: ' +
                index +
                ' - correct y-position for halo after zoom (#8284).'
        );
    });
});

QUnit.test('Custom point.group option (#5681)', function (assert) {
    assert.expect(0);
    Highcharts.chart('container', {
        chart: {
            type: 'column'
        },

        series: [
            {
                data: [
                    {
                        y: 95,
                        group: 'test'
                    },
                    {
                        y: 102.9
                    }
                ]
            }
        ]
    });
});

QUnit.test(
    'Update className after initially selected (#5777)',
    function (assert) {
        ['line', 'column', 'pie'].forEach(function (type) {
            var chart = Highcharts.chart('container', {
                chart: {
                    type: type,
                    animation: false
                },

                series: [
                    {
                        data: [
                            {
                                y: 1,
                                selected: true,
                                sliced: true
                            },
                            {
                                y: 2
                            },
                            {
                                y: 3
                            }
                        ],
                        allowPointSelect: true,
                        animation: false
                    }
                ]
            });

            assert.strictEqual(
                chart.series[0].points[0].graphic.hasClass(
                    'highcharts-point-select'
                ),
                true,
                'Class is there initially (' + type + ')'
            );

            // Select the second point, first point should toggle back to
            // unselected
            chart.series[0].points[1].select();
            assert.strictEqual(
                chart.series[0].points[0].graphic.hasClass(
                    'highcharts-point-select'
                ),
                false,
                'Selected class is removed (' + type + ')'
            );
        });
    }
);

QUnit.test('Update className with Point.update (#6454)', function (assert) {
    ['line', 'column', 'pie'].forEach(function (type) {
        var chart = Highcharts.chart('container', {
            chart: {
                type: type,
                animation: false
            },

            series: [
                {
                    data: [10, 20, 30],
                    animation: false
                }
            ]
        });

        assert.strictEqual(
            chart.series[0].points[0].graphic.hasClass('updated'),
            false,
            'Ready...'
        );

        chart.series[0].points[0].update({
            className: 'updated'
        });
        assert.strictEqual(
            chart.series[0].points[0].graphic.hasClass('updated'),
            true,
            'Point.update successfully applied class name (' + type + ')'
        );
    });
});

QUnit.test(
    'Point with negative color has only one highcharts-negative class',
    function (assert) {
        var chart = Highcharts.chart('container', {
            series: [
                {
                    data: [-10, -7, 5, 16],
                    negativeColor: '#123456'
                }
            ]
        });
        assert.strictEqual(
            Highcharts.attr(
                chart.series[0].points[0].graphic.element,
                'class'
            ).match(/highcharts-negative/g).length,
            1,
            'One occurrence of class name'
        );
    }
);

QUnit.test('Point with state options (#6401)', function (assert) {
    // Boost module adds hex aliases
    var names = Highcharts.Color.names;
    Highcharts.Color.names = {};

    var color = 'red',
        chart = Highcharts.chart('container', {
            chart: {
                type: 'column'
            },
            plotOptions: {
                column: {
                    states: {
                        hover: {
                            color: 'blue'
                        }
                    }
                }
            },
            series: [
                {
                    data: [
                        {
                            y: 20,
                            states: {
                                hover: {
                                    color: color
                                }
                            }
                        }
                    ]
                }
            ]
        });

    chart.series[0].points[0].setState('hover');

    assert.strictEqual(
        Highcharts.attr(chart.series[0].points[0].graphic.element, 'fill'),
        color,
        'Correct fill color on hover'
    );

    Highcharts.Color.names = names;
});

QUnit.test('Select and unselect', function (assert) {
    var chart = Highcharts.chart('container', {
            xAxis: [
                {
                    min: 0,
                    max: 10
                }
            ],
            series: [
                {
                    cropThreshold: 5,
                    type: 'column',
                    allowPointSelect: true,
                    data: (function (i) {
                        var tab = [];
                        while (i--) {
                            tab.push(i + 1);
                        }
                        return tab;
                    }(200))
                }
            ]
        }),
        series = chart.series[0],
        axis = chart.xAxis[0];

    // select 1st visible point
    series.points[0].select();
    // scroll over points - more than cropThreshold
    axis.setExtremes(190, 200);
    // select last visible point
    series.points[series.points.length - 1].select();
    // scroll back
    axis.setExtremes(0, 10);

    assert.strictEqual(
        series.points[0].selected,
        false,
        'Unselected point out of range (#6445)'
    );
});

QUnit.test('Point className on other elements', function (assert) {
    var chart = Highcharts.chart('container', {
        series: [
            {
                data: [
                    {
                        y: 1
                    },
                    {
                        y: 2,
                        className: 'my-class'
                    },
                    {
                        y: 3
                    }
                ],
                type: 'pie'
            }
        ]
    });

    assert.notEqual(
        chart.series[0].points[1].dataLabel.connector.element
            .getAttribute('class')
            .indexOf('my-class'),
        -1,
        'The connector should have the point className'
    );

    chart.series[0].points[1].onMouseOver();
    assert.notEqual(
        chart.series[0].halo.element.getAttribute('class').indexOf('my-class'),
        -1,
        'The halo should have the point className'
    );

    chart.series[0].points[0].onMouseOver();
    assert.strictEqual(
        chart.series[0].halo.element.getAttribute('class').indexOf('my-class'),
        -1,
        'The halo for other points should not have the point className'
    );
});

QUnit.test('Deselecting points', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            type: 'column'
        },
        plotOptions: {
            series: {
                allowPointSelect: true
            }
        },
        series: [
            {
                data: [1, 2, 3]
            },
            {
                data: [1, 2, 3]
            }
        ]
    });

    chart.series[0].points[1].select(true, true);
    chart.series[0].points[2].select(true, true);

    chart.series[1].points[1].select(true, false);

    assert.strictEqual(
        chart.series[0].options.data['-1'],
        undefined,
        'No fake points in series.options.data after deselecting other points.'
    );
});

QUnit.test('#14623: colorIndex Series.update()', assert => {
    const chart = Highcharts.chart('container', {
        series: [
            {
                data: [
                    29.9,
                    {
                        colorIndex: 4,
                        y: 71.5
                    },
                    106.4,
                    129.2,
                    144.0,
                    176.0
                ],
                colorIndex: 1
            }
        ]
    });

    chart.series[0].update({
        colorIndex: 2
    });

    assert.strictEqual(
        chart.series[0].points[0].colorIndex,
        2,
        'Point.colorIndex should be updated'
    );

    chart.series[0].points[0].update({
        colorIndex: 3
    });

    assert.strictEqual(
        chart.series[0].points[0].colorIndex,
        3,
        'Point.colorIndex should be updated'
    );

    assert.strictEqual(
        chart.series[0].points[1].colorIndex,
        4,
        'Point.colorIndex should be correct'
    );
});

QUnit.test('NaN x value (#19148).', assert => {
    const chart = Highcharts.chart('container', {
        series: [
            {
                type: 'area',
                data: [1, 2, [NaN, 3], 4, 5]
            }
        ]
    });

    chart.series[0].points.forEach(point => {
        if (Number.isInteger(point.x)) {
            assert.strictEqual(
                typeof point.graphic,
                'object',
                'The graphic should be created.'
            );
        }
    });
});
