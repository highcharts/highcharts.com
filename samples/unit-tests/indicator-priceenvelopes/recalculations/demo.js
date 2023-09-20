QUnit.test(
    'Test Price envelopes calculations on data updates.',
    function (assert) {
        var chart = Highcharts.stockChart('container', {
            series: [
                {
                    id: 'main',
                    type: 'candlestick',
                    data: [
                        [0, 5, 6, 3, 4],
                        [1, 5, 6, 3, 4],
                        [2, 5, 6, 3, 4],
                        [3, 5, 6, 3, 4]
                    ]
                },
                {
                    type: 'priceenvelopes',
                    linkedTo: 'main',
                    params: {
                        period: 3,
                        standardDeviation: 3
                    }
                }
            ]
        });

        function arrToPrecision(arr) {
            return arr.map(function (point) {
                return point.map(Math.round);
            });
        }

        assert.strictEqual(
            chart.series[0].points.length,
            chart.series[1].points.length +
                chart.series[1].options.params.period -
                1,
            'Initial number of price envelopes points is correct'
        );

        chart.series[0].addPoint([4, 17, 18, 10, 17]);

        assert.strictEqual(
            chart.series[0].points.length,
            chart.series[1].points.length +
                chart.series[1].options.params.period -
                1,
            'After addPoint number of price envelopes points is correct'
        );

        chart.series[0].setData(
            [
                [11000, 12000, 10000, 11000],
                [12000, 13000, 10000, 12000],
                [13000, 14000, 10000, 13000],
                [14000, 15000, 10000, 14000],
                [15000, 16000, 10000, 15000],
                [16000, 17000, 10000, 16000],
                [17000, 18000, 10000, 17000]
            ],
            false
        );
        chart.series[1].update({
            topLine: {
                styles: {
                    lineColor: 'red'
                }
            },
            bottomLine: {
                styles: {
                    lineColor: 'blue'
                }
            },
            params: {
                period: 5,
                topBand: 0.2,
                bottomBand: 0.3
            }
        });

        assert.deepEqual(
            arrToPrecision(chart.series[1].yData),
            arrToPrecision([
                [13000 * 1.2, 13000, 13000 * 0.7],
                [14000 * 1.2, 14000, 14000 * 0.7],
                [15000 * 1.2, 15000, 15000 * 0.7]
            ]),
            'Correct values'
        );

        assert.strictEqual(
            chart.series[1].graphtopLine.attr('stroke'),
            'red',
            'Line color changed'
        );

        assert.strictEqual(
            chart.series[1].graphbottomLine.attr('stroke'),
            'blue',
            'Line color changed'
        );

        chart.series[0].points[6].remove();

        assert.deepEqual(
            arrToPrecision(chart.series[1].yData),
            arrToPrecision([
                [13000 * 1.2, 13000, 13000 * 0.7],
                [14000 * 1.2, 14000, 14000 * 0.7]
            ]),
            'Correct values after point.remove()'
        );
    }
);
