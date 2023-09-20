QUnit.test('Test BB-algorithm on data updates.', function (assert) {
    var chart = Highcharts.stockChart('container', {
        series: [{
            id: 'main',
            type: 'candlestick',
            data: [
                [0, 5, 6, 3, 4],
                [1, 15, 16, 13, 14],
                [2, 25, 26, 23, 24],
                [3, 35, 36, 33, 34],
                [4, 45, 46, 43, 44]
            ]
        }, {
            type: 'bb',
            linkedTo: 'main',
            params: {
                period: 3,
                standardDeviation: 3
            }
        }]
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
        'Initial number of Bollinger Bands points is correct'
    );

    chart.series[0].addPoint([5, 45, 46, 43, 44]);

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'After addPoint number of Bollinger Bands points is correct'
    );

    chart.series[0].setData(
        [
            [0, 10000, 20000, 10000, 14970],
            [1, 10000, 20000, 10000, 15021],
            [2, 10000, 20000, 10000, 15099],
            [3, 10000, 20000, 10000, 15029],
            [4, 10000, 20000, 10000, 15133],
            [5, 10000, 20000, 10000, 15038],
            [6, 10000, 20000, 10000, 15011],
            [7, 10000, 20000, 10000, 14963],
            [8, 10000, 20000, 10000, 15063],
            [9, 10000, 20000, 10000, 15203],
            [10, 10000, 20000, 10000, 15045],
            [11, 10000, 20000, 10000, 15234],
            [12, 10000, 20000, 10000, 15312],
            [13, 10000, 20000, 10000, 15247],
            [14, 10000, 20000, 10000, 15013],
            [15, 10000, 20000, 10000, 15107],
            [16, 10000, 20000, 10000, 15020],
            [17, 10000, 20000, 10000, 14895],
            [18, 10000, 20000, 10000, 14846],
            [19, 10000, 20000, 10000, 14898],
            [20, 10000, 20000, 10000, 14988],
            [21, 10000, 20000, 10000, 15083],
            [22, 10000, 20000, 10000, 15193],
            [23, 10000, 20000, 10000, 15292],
            [24, 10000, 20000, 10000, 15199],
            [25, 10000, 20000, 10000, 15280],
            [26, 10000, 20000, 10000, 15236],
            [27, 10000, 20000, 10000, 15218]
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
            period: 20,
            standardDeviation: 2
        }
    });

    assert.deepEqual(
        arrToPrecision(chart.series[1].yData),
        [
            [15302, 15057, 14813],
            [15302, 15058, 14815],
            [15304, 15061, 14818],
            [15316, 15066, 14816],
            [15348, 15079, 14811],
            [15355, 15083, 14810],
            [15380, 15095, 14809],
            [15395, 15106, 14816],
            [15404, 15119, 14833]
        ],
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

    chart.series[0].points[27].remove();

    assert.deepEqual(
        arrToPrecision(chart.series[1].yData),
        [
            [15302, 15057, 14813],
            [15302, 15058, 14815],
            [15304, 15061, 14818],
            [15316, 15066, 14816],
            [15348, 15079, 14811],
            [15355, 15083, 14810],
            [15380, 15095, 14809],
            [15395, 15106, 14816]
        ],
        'Correct values after point.remove()'
    );

    chart.addSeries(
        {
            type: 'area',
            id: 'area-main',
            data: [15302, 15316, 15395, 15395]
        },
        false
    );

    chart.addSeries({
        type: 'bb',
        linkedTo: 'area-main',
        params: {
            period: 3
        }
    });

    assert.strictEqual(
        chart.series[1].data.length > 0,
        true,
        'BB compatible with one dimensional data (#7648).'
    );
});
