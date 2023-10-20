QUnit.test(
    'Heatmap point size shouldn\'t overflow plot area(#4530)',
    function (assert) {
        const chart = new Highcharts.Chart({
            chart: {
                type: 'heatmap',
                renderTo: 'container',
                width: 400,
                height: 400
            },

            series: [
                {
                    data: [
                        [
                            Date.UTC(2012, 12, 2),
                            0,
                            93
                        ]
                    ],
                    colsize: 24 * 3600 * 1000,
                    rowsize: 24 * 3600 * 1000
                }
            ]
        });

        assert.strictEqual(
            parseInt(chart.series[0].points[0].graphic.attr('width'), 10) <
                1200,
            true,
            'Element width is acceptable'
        );

        assert.strictEqual(
            parseInt(chart.series[0].points[0].graphic.attr('height'), 10) <
                1200,
            true,
            'Element height is acceptable'
        );

        chart.update({
            chart: {
                inverted: true
            }
        });

        assert.strictEqual(
            parseInt(chart.series[0].points[0].graphic.attr('width'), 10) <
                1200,
            true,
            'Element width is acceptable'
        );

        assert.strictEqual(
            parseInt(chart.series[0].points[0].graphic.attr('height'), 10) <
                1200,
            true,
            'Element height is acceptable'
        );

        chart.xAxis[0].update({
            minRange: 1
        });

        assert.strictEqual(
            parseInt(chart.series[0].points[0].graphic.attr('width'), 10) <
                1200,
            true,
            'With minRange: Element width is acceptable'
        );

        assert.strictEqual(
            parseInt(chart.series[0].points[0].graphic.attr('height'), 10) <
                1200,
            true,
            'With minRange: Element height is acceptable'
        );

        chart.series[0].setData([
            [0, 0, 1],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ], false);

        chart.series[0].update({
            colsize: void 0,
            rowsize: void 0
        });

        const shapeArgsBefore = chart.series[0].points[0].shapeArgs,
            pointPaddingValue = 10;

        chart.series[0].update({
            colsize: void 0,
            rowsize: void 0,
            pointPadding: pointPaddingValue
        }, false);

        chart.yAxis[0].update({
            reversed: true,
            categories: ['A', 'B']
        });

        assert.strictEqual(
            shapeArgsBefore.width - (2 * pointPaddingValue),
            chart.series[0].points[0].shapeArgs.width,
            'Point padding should work with reversed yAxis, #18502.'
        );

        assert.close(
            shapeArgsBefore.height - (2 * pointPaddingValue),
            chart.series[0].points[0].shapeArgs.height,
            1.1,
            'Point padding should work with reversed yAxis, #18502.'
        );

        chart.xAxis[0].update({
            reversed: true
        }, true);

        assert.strictEqual(
            shapeArgsBefore.width - (2 * pointPaddingValue),
            chart.series[0].points[0].shapeArgs.width,
            'Point padding should work with reversed xAxis, #18502.'
        );

        assert.close(
            shapeArgsBefore.height - (2 * pointPaddingValue),
            chart.series[0].points[0].shapeArgs.height,
            1,
            'Point padding should work with reversed xAxis, #18502.'
        );
    }
);

QUnit.test('Point range after setData(#3758)', function (assert) {
    var chart, initialPointRange;

    // Create the chart
    $('#container').highcharts({
        chart: {
            type: 'heatmap'
        },

        colorAxis: {
            min: 0,
            minColor: '#FFFFFF',
            maxColor: '#000000'
        },

        series: [
            {
                data: [
                    [1, 0, 92],
                    [2, 0, 35],
                    [3, 0, 72],
                    [4, 0, 38],
                    [5, 0, 88],
                    [6, 0, 13],
                    [7, 0, 31],
                    [8, 0, 85],
                    [9, 0, 47]
                ]
            }
        ]
    });

    chart = $('#container').highcharts();
    initialPointRange = chart.series[0].pointRange;

    // Run setData
    chart.series[0].setData([
        [1, 0, 92],
        [2, 0, 35],
        [3, 0, 72],
        [4, 0, 38],
        [5, 0, 88],
        [6, 0, 13],
        [7, 0, 31],
        [8, 0, 85],
        [9, 0, 47],
        [10, 0, 47],
        [11, 0, 47],
        [12, 0, 47]
    ]);

    assert.equal(
        chart.series[0].pointRange,
        initialPointRange,
        'Point range should not change'
    );
});

QUnit.test('seriesTypes.heatmap.pointClass.setState', function (assert) {
    const chart = new Highcharts.Chart('container', {
            chart: {
                type: 'heatmap'
            },

            series: [{
                data: [[0, 0, 1]],
                borderRadius: 39
            }]
        }),
        point = chart.series[0].points[0],
        setState = Highcharts.Series.types.heatmap.prototype
            .pointClass.prototype.setState;

    setState.call(point);
    assert.strictEqual(
        point.graphic.zIndex,
        0,
        'When state:normal zIndex is 0'
    );
    assert.strictEqual(
        point.graphic.d.split(' ')[1] - point.graphic.getBBox().x,
        point.series.options.borderRadius,
        `The point's border radius should be correct (value set in options)
        when the point is in a 'normal' state, #16165.`
    );

    setState.call(point, 'hover');
    assert.strictEqual(point.graphic.zIndex, 1, 'When state:hover zIndex is 1');
    assert.strictEqual(
        point.graphic.d.split(' ')[1] - point.graphic.getBBox().x,
        point.series.options.borderRadius,
        `The point's border radius should be correct (value set in options)
        when the point is in a 'hover' state, #16165.`
    );

    setState.call(point, 'select');
    assert.strictEqual(
        point.graphic.zIndex,
        0,
        'When state:select zIndex is 0'
    );

    setState.call(point, '');
    assert.strictEqual(
        point.graphic.d.split(' ')[1] - point.graphic.getBBox().x,
        point.series.options.borderRadius,
        `The point's border radius should be correct (value set in options)
        when the point is in a 'normal' state, #16165.`
    );

    chart.series[0].update({
        borderRadius: 0,
        marker: {
            lineWidth: 40
        }
    });

    setState.call(point, 'hover');
    assert.strictEqual(
        point.graphic.attr('stroke'),
        chart.series[0].color,
        'Point\'s stroke should be set on hover, #17856.'
    );
});

QUnit.test(
    'Animation tests',
    assert => {
        const chart = new Highcharts.Chart('container', {
                chart: {
                    type: 'heatmap'
                },

                series: [{
                    data: [
                        [0, 0, 1],
                        [0, 1, 1],
                        [0, 2, 1],
                        [1, 0, 1],
                        [1, 1, 1],
                        [1, 2, 1]
                    ],
                    borderRadius: 39
                }]
            }),
            point0 = chart.series[0].points[0],
            point1 = chart.series[0].points[1],
            done = assert.async();

        let clock = null;

        try {
            clock = TestUtilities.lolexInstall();

            chart.yAxis[0].setExtremes(0, 1, true, { duration: 50 });

            setTimeout(function () {
                point0.setState('hover');
                point0.setState('');
                assert.close(
                    Math.round(point0.graphic.getBBox().height),
                    Math.round(point1.graphic.getBBox().height),
                    2,
                    'Hovering points should not change the cell size (#16921)'
                );

                done();
            }, 200);

            TestUtilities.lolexRunAndUninstall(clock);
        } finally {
            TestUtilities.lolexUninstall(clock);
        }
    }
);