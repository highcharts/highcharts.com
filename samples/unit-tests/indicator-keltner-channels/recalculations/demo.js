QUnit.test('Test Keltner Channels indicator.', function (assert) {
    var chart = Highcharts.stockChart('container', {
        series: [
            {
                id: 'main',
                type: 'candlestick',
                data: [
                    [1534512600000, 213.44, 217.95, 213.16, 217.58],
                    [1534771800000, 218.1, 219.18, 215.11, 215.46],
                    [1534858200000, 216.8, 217.19, 214.03, 215.04],
                    [1534944600000, 214.1, 216.36, 213.84, 215.05],
                    [1535031000000, 214.65, 217.05, 214.6, 215.49],
                    [1535117400000, 216.6, 216.9, 215.11, 216.16],
                    [1535376600000, 217.15, 218.74, 216.33, 217.94],
                    [1535463000000, 219.01, 220.54, 218.92, 219.7],
                    [1535549400000, 220.15, 223.49, 219.41, 222.98],
                    [1535635800000, 223.25, 228.26, 222.4, 225.03],
                    [1535722200000, 226.51, 228.87, 226, 227.63],
                    [1536067800000, 228.41, 229.18, 226.63, 228.36],
                    [1536154200000, 228.99, 229.67, 225.1, 226.87],
                    [1536240600000, 226.23, 227.35, 221.3, 223.1],
                    [1536327000000, 221.85, 225.37, 220.71, 221.3],
                    [1536586200000, 220.95, 221.85, 216.47, 218.33],
                    [1536672600000, 218.01, 224.3, 216.56, 223.85],
                    [1536759000000, 224.94, 225, 219.84, 221.07],
                    [1536845400000, 223.52, 228.35, 222.57, 226.41],
                    [1536931800000, 225.75, 226.84, 222.52, 223.84],
                    [1537191000000, 222.15, 222.95, 217.27, 217.88],
                    [1537277400000, 217.79, 221.85, 217.12, 218.24],
                    [1537363800000, 218.5, 219.62, 215.3, 218.37],
                    [1537450200000, 220.24, 222.28, 219.15, 220.03],
                    [1537536600000, 220.78, 221.36, 217.29, 217.66],
                    [1537795800000, 216.82, 221.26, 216.63, 220.79],
                    [1537882200000, 219.75, 222.82, 219.7, 222.19],
                    [1537968600000, 221, 223.75, 219.76, 220.42],
                    [1538055000000, 223.82, 226.44, 223.54, 224.95],
                    [1538147902000, 224.79, 225.83, 224.02, 225.32]
                ]
            },
            {
                type: 'keltnerchannels',
                linkedTo: 'main'
            }
        ]
    });

    function arrToPrecision(arr) {
        return arr.map(function (point) {
            return point.map(function (p) {
                // Check precission 4 decimal places.
                return Math.round(p * 100) / 100;
            });
        });
    }

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'Initial number of Keltner Channels points is correct'
    );
    chart.series[0].addPoint([1538147988400, 218.17, 219.18, 215.11, 215.46]);

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'After addPoint number of Keltner Channels points is correct'
    );

    chart.series[1].update({
        color: 'green'
    });

    assert.deepEqual(
        arrToPrecision(chart.series[1].yData),
        [
            [230.09, 220.92, 211.76],
            [230.6, 221.04, 211.48],
            [230.28, 220.73, 211.18],
            [229.98, 220.52, 211.06],
            [229.79, 220.49, 211.19],
            [229.7, 220.52, 211.34],
            [229.35, 220.17, 210.98],
            [229.02, 220.13, 211.23],
            [229.01, 220.21, 211.41],
            [229.68, 220.55, 211.43],
            [229.53, 220.96, 212.38],
            [230.45, 220.69, 210.93]
        ],
        'Correct values'
    );
    assert.strictEqual(
        chart.series[1].graph.attr('stroke'),
        'green',
        'Middle line color changed'
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
        }
    });

    assert.strictEqual(
        chart.series[1].graphtopLine.attr('stroke'),
        'red',
        'Top line color changed'
    );

    assert.strictEqual(
        chart.series[1].graphbottomLine.attr('stroke'),
        'blue',
        'Bottom line color changed'
    );
    chart.series[0].points[30].remove();

    assert.deepEqual(
        arrToPrecision(chart.series[1].yData),
        [
            [230.09, 220.92, 211.76],
            [230.6, 221.04, 211.48],
            [230.28, 220.73, 211.18],
            [229.98, 220.52, 211.06],
            [229.79, 220.49, 211.19],
            [229.7, 220.52, 211.34],
            [229.35, 220.17, 210.98],
            [229.02, 220.13, 211.23],
            [229.01, 220.21, 211.41],
            [229.68, 220.55, 211.43],
            [229.53, 220.96, 212.38]
        ],
        'Correct values after point.remove()'
    );
});
