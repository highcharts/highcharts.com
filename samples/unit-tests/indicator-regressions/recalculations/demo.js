QUnit.test('Test algorithm on data updates.', function (assert) {
    var chart = Highcharts.stockChart('container', {
        series: [{
            id: 'main',
            data: [
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15,
                13,
                14,
                15
            ]
        }, {
            type: 'linearRegression',
            linkedTo: 'main'
        }]
    });

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'Initial number of linear regression points is correct'
    );

    chart.series[0].addPoint(13);

    assert.strictEqual(
        chart.series[0].points.length,
        chart.series[1].points.length +
            chart.series[1].options.params.period -
            1,
        'After addPoint number of linear regression points is correct'
    );

    chart.series[0].setData([11, 5, 13, 14, 18, 16, 17], false);
    chart.series[1].update({
        color: 'red',
        params: {
            period: 5
        }
    });

    assert.deepEqual(
        chart.series[1].yData,
        [16.799999999999997, 18.6, 17.6],
        'Correct values of regression indicator'
    );

    // Slope and intercept indicators can be checked without creating a new
    // series or updating the existing one.
    assert.deepEqual(
        chart.series[1].points.map(function (point) {
            return point.regressionLineParameters.slope;
        }),
        [2.3, 2.7, 1],
        'Correct values of regression slope indicator'
    );

    assert.deepEqual(
        chart.series[1].points.map(function (point) {
            return point.regressionLineParameters.intercept;
        }),
        [7.6, 7.799999999999999, 13.6],
        'Correct values of regression intecept indicator'
    );

    assert.strictEqual(
        chart.series[1].graph.attr('stroke'),
        'red',
        'Line color changed'
    );

    chart.series[0].points[6].remove();

    assert.deepEqual(
        chart.series[1].yData,
        [16.799999999999997, 18.6],
        'Correct values after point.remove()'
    );

    // Change the type of the indicator series to angle.
    chart.series[1].update({
        type: 'linearRegressionAngle'
    });

    assert.deepEqual(
        chart.series[1].yData,
        [66.5014343240479, 69.67686317033707],
        'Correct values of regression angle indicator'
    );
});
