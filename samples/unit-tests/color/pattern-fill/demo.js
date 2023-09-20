/* Unit tests for pattern-fill module */

function getPointFillId(point) {
    const fill = point.graphic.element.getAttribute('fill');
    return fill.replace('url(#', '').replace(')', '');
}

const doc = Highcharts.win.document;

QUnit.test('SVGRenderer used directly', function (assert) {
    var renderer = new Highcharts.Renderer(
            doc.getElementById('container'),
            400,
            400
        ),
        circle = renderer
            .circle({
                fill: {
                    pattern: {
                        id: 'custom-id',
                        path: {
                            d: 'M 3 3 L 8 3 L 8 8 Z',
                            fill: '#00ff00'
                        },
                        width: 12,
                        height: 12,
                        color: '#ff0000',
                        opacity: 0.5,
                        backgroundColor: '#00ffff'
                    }
                },
                x: 40,
                y: 40,
                r: 10
            })
            .add(),
        pattern = doc.getElementById('custom-id');

    assert.ok(
        renderer.defs.element.contains(pattern),
        'Pattern should be in defs'
    );

    assert.strictEqual(
        pattern.getElementsByTagName('path')[0].getAttribute('stroke'),
        '#ff0000',
        'Pattern has path with correct stroke'
    );
    assert.strictEqual(
        pattern.getElementsByTagName('path')[0].getAttribute('fill'),
        '#00ff00',
        'Pattern has path with correct fill'
    );

    assert.strictEqual(
        pattern.getElementsByTagName('rect')[0].getAttribute('fill'),
        '#00ffff',
        'Pattern has background rect with correct fill'
    );

    assert.strictEqual(
        circle.element.getAttribute('fill'),
        'url(#custom-id)',
        'Circle has pattern ref as fill'
    );
});

QUnit.test('Pattern fill set on series', function (assert) {
    var chart = Highcharts.chart('container', {
            series: [
                {
                    type: 'column',
                    keys: ['y', 'color'],
                    color: {
                        pattern: {
                            id: 'custom-id',
                            path: {
                                d: 'M 3 3 L 8 3 L 8 8 Z'
                            },
                            width: 12,
                            height: 12,
                            color: '#ff0000',
                            opacity: 0.5,
                            backgroundColor: '#000000'
                        }
                    },
                    data: [[1, { patternIndex: 0 }], 2, 3]
                }
            ]
        }),
        points = chart.series[0].points,
        firstPatternId = getPointFillId(points[0]),
        firstPattern = doc.getElementById(firstPatternId),
        secondPattern = doc.getElementById('custom-id');

    assert.strictEqual(
        firstPattern.tagName.toLowerCase(),
        'pattern',
        'First pattern exists'
    );

    assert.strictEqual(
        secondPattern.tagName.toLowerCase(),
        'pattern',
        'Second pattern exists'
    );

    assert.strictEqual(
        firstPattern.firstChild.getAttribute('stroke'),
        Highcharts.getOptions().colors[0],
        'First pattern has same color as first color in colors array'
    );

    assert.strictEqual(
        points[1].graphic.element.getAttribute('fill'),
        'url(#custom-id)',
        'Second point has pattern link as color'
    );

    assert.strictEqual(
        secondPattern.getElementsByTagName('path')[0].getAttribute('stroke'),
        '#ff0000',
        'Second pattern has path with correct color'
    );

    assert.strictEqual(
        secondPattern.getElementsByTagName('rect')[0].getAttribute('fill'),
        '#000000',
        'Second pattern has rect with correct color'
    );

    assert.strictEqual(
        points[2].graphic.element.getAttribute('fill'),
        'url(#custom-id)',
        'Third point has pattern link as color'
    );
});

QUnit.test('Pattern fills set on points', function (assert) {
    var chart = Highcharts.chart('container', {
            series: [
                {
                    type: 'bubble',
                    keys: ['x', 'y', 'z', 'color'],
                    data: [
                        [1, 1, 1, { patternIndex: 0 }],
                        [
                            2,
                            1,
                            1,
                            {
                                pattern: {
                                    id: 'custom-1',
                                    path: 'M 3 3 L 8 3 L 8 8 Z',
                                    width: 12,
                                    height: 12,
                                    color: '#ff0000'
                                }
                            }
                        ],
                        [
                            3,
                            1,
                            1,
                            {
                                pattern: {
                                    id: 'custom-2',
                                    path: 'M 3 3 L 8 3 L 8 8 Z',
                                    width: 20,
                                    height: 15,
                                    color: '#0000ff'
                                }
                            }
                        ]
                    ]
                }
            ]
        }),
        points = chart.series[0].points,
        firstPatternId = getPointFillId(points[0]),
        firstPattern = doc.getElementById(firstPatternId),
        secondPattern = doc.getElementById('custom-1'),
        thirdPattern = doc.getElementById('custom-2');

    assert.strictEqual(
        firstPattern.tagName.toLowerCase(),
        'pattern',
        'First pattern exists'
    );

    assert.strictEqual(
        secondPattern.tagName.toLowerCase(),
        'pattern',
        'Second pattern exists'
    );

    assert.strictEqual(
        thirdPattern.tagName.toLowerCase(),
        'pattern',
        'Third pattern exists'
    );

    assert.strictEqual(
        points[1].graphic.element.getAttribute('fill'),
        'url(#custom-1)',
        'Second point has pattern link as color'
    );

    assert.strictEqual(
        points[2].graphic.element.getAttribute('fill'),
        'url(#custom-2)',
        'Third point has pattern link as color'
    );

    assert.strictEqual(
        secondPattern.getElementsByTagName('path')[0].getAttribute('stroke'),
        '#ff0000',
        'Second pattern has path with correct color'
    );

    assert.strictEqual(
        thirdPattern.getAttribute('width'),
        '20',
        'Third pattern has correct width'
    );
});

QUnit.test('Auto IDs and no duplicate elements', function (assert) {
    var chart = Highcharts.chart('container', {
            series: [
                {
                    type: 'pie',
                    colorByPoint: false,
                    keys: ['y', 'color'],
                    color: {
                        pattern: {
                            width: 5,
                            height: 5,
                            path: {
                                stroke: '#ff0000'
                            }
                        }
                    },
                    data: [
                        1,
                        [1, { patternIndex: 0 }],
                        [1, { patternIndex: 0 }],
                        [1, { pattern: { path: 'M 3 3 L 8 3 L 8 8 Z' } }],
                        [1, { pattern: { path: 'M 3 3 L 8 3 L 8 8 L 3 8 Z' } }],
                        [1, { pattern: { path: 'M 3 3 L 8 3 L 8 8 Z' } }],
                        [1, { pattern: { path: 'M 3 3 L 8 3 L 8 8 L 3 8 Z' } }],
                        [
                            1,
                            {
                                pattern: {
                                    path: 'M 3 3 L 8 3 L 8 8 Z',
                                    id: 'pattern-bob'
                                }
                            }
                        ]
                    ]
                }
            ]
        }),
        defs = chart.renderer.defs.element,
        patterns = defs.getElementsByTagName('pattern'),
        customPatternId = getPointFillId(chart.series[0].points[4]),
        customPattern = doc.getElementById(customPatternId);

    assert.strictEqual(
        patterns.length,
        4,
        'Number of pattern defs should be 1 used default + 3 unique'
    );

    var ids = [];
    for (const pattern of patterns) {
        var id = pattern.getAttribute('id');
        if (ids.indexOf(id) > -1) {
            assert.ok(
                false,
                'Expected unique ids for patterns. Duplicate: ' + id
            );
        }
        ids.push(id);
    }

    assert.strictEqual(
        customPattern.getAttribute('width'),
        '5',
        'Width of point pattern should be inherited from series.'
    );

    assert.strictEqual(
        customPattern.firstChild.getAttribute('stroke'),
        '#ff0000',
        'Color of point pattern should be inherited from series.'
    );
});

QUnit.test('Images (dummy images, not loaded)', function (assert) {
    const data = [
            [
                'no',
                1,
                {
                    pattern: {
                        image: 'base/test/test1x1b.png'
                    }
                }
            ],
            [
                'dk',
                1,
                {
                    pattern: {
                        image: 'base/test/test1x1b.png'
                    }
                }
            ],
            [
                'se',
                1,
                {
                    pattern: {
                        image: 'base/test/test1x1w.png'
                    }
                }
            ],
            [
                'fi',
                1,
                {
                    pattern: {
                        image: 'base/test/test1x1w.png',
                        width: 10,
                        height: null // Autocompute
                    }
                }
            ]
        ],
        chart = Highcharts.mapChart('container', {
            chart: {
                map: 'custom/europe'
            },
            series: [
                {
                    keys: ['hc-key', 'value', 'color'],
                    color: {
                        pattern: {
                            width: 100,
                            height: 100
                        }
                    },
                    data
                }
            ]
        }),
        finlandPoint = chart.series[0].points[3],
        defs = chart.renderer.defs.element,
        patterns = defs.getElementsByTagName('pattern'),
        ids = [];
    let customPattern;

    assert.strictEqual(
        finlandPoint.name,
        'Finland',
        'Finland point should be 4th point'
    );

    assert.strictEqual(
        patterns.length,
        3,
        'Number of pattern defs should be 3 unique (defaults patterns not added unless used)'
    );

    for (const pattern of patterns) {
        var id = pattern.getAttribute('id');
        if (id.indexOf('highcharts-pattern-') > -1) {
            customPattern = pattern;
        }
        if (ids.indexOf(id) > -1) {
            assert.ok(
                false,
                'Expected unique ids for patterns. Duplicate: ' + id
            );
        }
        ids.push(id);
    }

    assert.strictEqual(
        customPattern.getAttribute('width'),
        '10',
        'Width of point pattern should not be inherited from series.'
    );

    assert.strictEqual(
        customPattern.getAttribute('height'),
        '' + Math.ceil(finlandPoint.graphic.element.getBBox().height),
        'Height of point pattern should be autocomputed.'
    );

    assert.strictEqual(
        customPattern.firstChild.tagName.toLowerCase(),
        'image',
        'Pattern should have an image element.'
    );

    chart.series[0].setData(data);
    assert.ok(
        true,
        `There shouldn't be any error in the console, after using setData method
        (#19323).`
    );
});

QUnit.test('Image auto resize with aspect ratio - map', function (assert) {
    var chart = Highcharts.mapChart('container', {
            chart: {
                map: 'custom/europe',
                width: 600,
                height: 600
            },
            legend: {
                enabled: false
            },
            series: [
                {
                    keys: ['hc-key', 'value', 'color'],
                    color: {
                        pattern: {
                            aspectRatio: 3 / 2
                        }
                    },
                    allAreas: false,
                    data: [
                        [
                            'no',
                            1,
                            {
                                pattern: {
                                    image: 'base/test/test1x1b.png'
                                }
                            }
                        ],
                        [
                            'at',
                            1,
                            {
                                pattern: {
                                    image: 'base/test/test1x1w.png'
                                }
                            }
                        ]
                    ]
                }
            ]
        }),
        norwayPoint = chart.series[0].points[0],
        austriaPoint = chart.series[0].points[1],
        test = function () {
            var norwayPattern = doc.getElementById(
                    norwayPoint.graphic.element
                        .getAttribute('fill')
                        .replace('url(#', '')
                        .replace(')', '')
                ),
                austriaPattern = doc.getElementById(
                    austriaPoint.graphic.element
                        .getAttribute('fill')
                        .replace('url(#', '')
                        .replace(')', '')
                ),
                norwayBB = norwayPoint.graphic.getBBox(true),
                austriaBB = austriaPoint.graphic.getBBox(true);

            assert.strictEqual(
                '' + Math.ceil(norwayBB.height),
                norwayPattern.getAttribute('height'),
                'Norway pattern should have BBox height'
            );

            assert.strictEqual(
                '' + Math.ceil(austriaBB.width),
                austriaPattern.getAttribute('width'),
                'Austria pattern should have BBox width'
            );

            assert.strictEqual(
                '' + Math.ceil(norwayBB.height * 1.5),
                norwayPattern.getAttribute('width'),
                'Norway pattern should have ratio adjusted width'
            );

            assert.strictEqual(
                '' + Math.ceil(austriaBB.width / 1.5),
                austriaPattern.getAttribute('height'),
                'Austria pattern should have ratio adjusted height'
            );
        },
        patterns = [];

    test();
    chart.setSize(200, 200);
    test();

    assert.strictEqual(
        chart.renderer.defIds.filter(
            id => id.indexOf('highcharts-pattern-') > -1
        ).length,
        2,
        'Verify that old pattern IDs are free'
    );

    Highcharts.objectEach(chart.renderer.patternElements, function (el) {
        if (el.id.indexOf('highcharts-pattern-') === 0) {
            patterns.push(el);
        }
    });

    assert.strictEqual(
        patterns.length,
        2,
        'Verify that old patterns are gone after resize'
    );
});

QUnit.test('Image auto resize with aspect ratio - column', function (assert) {
    var chart = Highcharts.chart('container', {
            chart: {
                width: 600,
                height: 600,
                type: 'column'
            },
            legend: {
                enabled: false
            },
            series: [
                {
                    data: [
                        {
                            y: 1,
                            color: {
                                pattern: {
                                    aspectRatio: 3 / 2,
                                    image: 'base/test/test1x1b.png'
                                }
                            }
                        }
                    ]
                }
            ]
        }),
        point = chart.series[0].points[0],
        test = function () {
            var columnPattern = doc.getElementById(
                    point.graphic.element
                        .getAttribute('fill')
                        .replace('url(#', '')
                        .replace(')', '')
                ),
                bb = point.graphic.getBBox(true);

            assert.strictEqual(
                '' + Math.ceil(bb.height),
                columnPattern.getAttribute('height'),
                'Pattern should have BBox height'
            );

            assert.strictEqual(
                '' + Math.ceil(bb.height * 1.5),
                columnPattern.getAttribute('width'),
                'Pattern should have ratio adjusted width'
            );
        };

    test();
    chart.setSize(200, 200);
    test();
});

QUnit.test('Image animation opacity', function (assert) {
    var clock = TestUtilities.lolexInstall(),
        done = assert.async(),
        columnPattern;

    try {
        Highcharts.chart('container', {
            chart: {
                type: 'column',
                animation: {
                    enabled: true
                }
            },
            series: [
                {
                    animation: {
                        enabled: true
                    },
                    data: [
                        {
                            y: 1,
                            color: {
                                pattern: {
                                    id: 'test-pattern',
                                    image:
                                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
                                    opacity: 0.5,
                                    animation: {
                                        duration: 50,
                                        complete: function () {
                                            assert.strictEqual(
                                                columnPattern.firstChild
                                                    .getAttribute('opacity'),
                                                '0.5',
                                                'Pattern should end at 0.5 opacity'
                                            );
                                            done();
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        });

        columnPattern = doc.getElementById('test-pattern');

        assert.strictEqual(
            columnPattern.firstChild.getAttribute('opacity'),
            '0',
            'Pattern should start at 0 opacity'
        );

        TestUtilities.lolexRunAndUninstall(clock);
    } finally {
        TestUtilities.lolexUninstall(clock);
    }
});

QUnit.test('Destroy and recreate chart', function (assert) {
    const options = {
            series: [
                {
                    type: 'column',
                    keys: ['y', 'color'],
                    color: {
                        pattern: {
                            id: 'custom-id',
                            path: {
                                d: 'M 3 3 L 8 3 L 8 8 Z'
                            },
                            width: 12,
                            height: 12,
                            color: '#ff0000',
                            opacity: 0.5,
                            backgroundColor: '#000000'
                        }
                    },
                    data: [[1, { patternIndex: 2 }], 2, 3]
                }
            ]
        },
        firstChart = Highcharts.chart('container', options);

    function testChart(chart) {
        const points = chart.series[0].points,
            firstPointPatternId = getPointFillId(points[0]),
            secondPointPatternId = getPointFillId(points[1]),
            firstPattern = doc.getElementById(firstPointPatternId),
            secondPattern = doc.getElementById(secondPointPatternId);

        assert.strictEqual(
            firstPattern && firstPattern.tagName.toLowerCase(),
            'pattern',
            'First pattern exists'
        );

        assert.strictEqual(
            secondPattern && secondPattern.tagName.toLowerCase(),
            'pattern',
            'Second pattern exists'
        );

        assert.strictEqual(
            firstPattern && firstPattern.firstChild.getAttribute('stroke'),
            Highcharts.getOptions().colors[2],
            'First pattern has same color as third color in colors array'
        );

        assert.strictEqual(
            secondPattern &&
                secondPattern
                    .getElementsByTagName('path')[0]
                    .getAttribute('stroke'),
            '#ff0000',
            'Second pattern has path with correct color'
        );
    }

    testChart(firstChart);
    firstChart.destroy();
    const secondChart = Highcharts.chart('container', options);
    testChart(secondChart);
});

QUnit.test('#14765: Global patterns', assert => {
    assert.ok(Highcharts.patterns, 'Global patterns should be defined');
});