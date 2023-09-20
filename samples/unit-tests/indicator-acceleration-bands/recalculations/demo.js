QUnit.test('Test ABANDS-algorithm on data updates.', function (assert) {
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
            type: 'abands',
            linkedTo: 'main',
            params: {
                period: 3
            }
        }]
    });

    function arrToPrecision(arr) {
        return arr.map(function (point) {
            return point.map(function (p) {
                // Check precission 4 decimal places.
                return Math.round(p * 10000);
            });
        });
    }

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'Initial number of Acceleration Bands points is correct'
    );

    chart.series[0].addPoint([5, 45, 46, 43, 44]);

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'After addPoint number of Acceleration Bands points is correct'
    );

    chart.series[0].setData(
        [
            [1474896600000, 111.64, 113.39, 111.55, 112.88],
            [1474983000000, 113, 113.18, 112.34, 113.09],
            [1475069400000, 113.69, 114.64, 113.43, 113.95],
            [1475155800000, 113.16, 113.8, 111.8, 112.18],
            [1475242200000, 112.46, 113.37, 111.8, 113.05],
            [1475501400000, 112.71, 113.05, 112.28, 112.52],
            [1475587800000, 113.06, 114.31, 112.63, 113],
            [1475674200000, 113.4, 113.66, 112.69, 113.05],
            [1475760600000, 113.7, 114.34, 113.13, 113.89],
            [1475847000000, 114.31, 114.56, 113.51, 114.06],
            [1476106200000, 115.02, 116.75, 114.72, 116.05],
            [1476192600000, 117.7, 118.69, 116.2, 116.3],
            [1476279000000, 117.35, 117.98, 116.75, 117.34],
            [1476365400000, 116.79, 117.44, 115.72, 116.98],
            [1476451800000, 117.88, 118.17, 117.13, 117.63],
            [1476711000000, 117.33, 117.84, 116.78, 117.55],
            [1476797400000, 118.18, 118.21, 117.45, 117.47],
            [1476883800000, 117.25, 117.76, 116.91, 117.12],
            [1476970200000, 116.86, 117.38, 116.33, 117.06],
            [1477056600000, 116.81, 116.91, 116.28, 116.6],
            [1477315800000, 117.1, 117.74, 117, 117.65],
            [1477402200000, 117.95, 118.36, 117.31, 118.25],
            [1477488600000, 114.31, 115.7, 113.31, 115.59],
            [1477575000000, 115.39, 115.86, 114.1, 114.48],
            [1477661400000, 113.87, 115.21, 113.45, 113.72],
            [1477920600000, 113.65, 114.23, 113.2, 113.54],
            [1478007000000, 113.46, 113.77, 110.53, 111.49],
            [1478093400000, 111.4, 112.35, 111.23, 111.59],
            [1478179800000, 110.98, 111.46, 109.55, 109.83],
            [1478266200000, 108.53, 110.25, 108.11, 108.84]
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
            period: 20
        }
    });

    assert.deepEqual(
        arrToPrecision(chart.series[1].yData),
        [
            [1183883, 1150885, 1118883],
            [1184946, 1153270, 1122696],
            [1187747, 1155850, 1124972],
            [1189476, 1156670, 1123751],
            [1190262, 1157820, 1125137],
            [1191374, 1158155, 1125774],
            [1192226, 1158665, 1125976],
            [1193551, 1157910, 1123401],
            [1193047, 1157180, 1122522],
            [1192317, 1155150, 1120042],
            [1191268, 1152540, 1116268]
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
            [1183883, 1150885, 1118883],
            [1184946, 1153270, 1122696],
            [1187747, 1155850, 1124972],
            [1189476, 1156670, 1123751],
            [1190262, 1157820, 1125137],
            [1191374, 1158155, 1125774],
            [1192226, 1158665, 1125976],
            [1193551, 1157910, 1123401],
            [1193403, 1156300, 1120903],
            [1192302, 1153775, 1117477]
        ],
        'Correct values after point.remove()'
    );
});
