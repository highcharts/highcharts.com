QUnit.test('Redraw with dirty box', function (assert) {
    var chart = Highcharts.chart('container', {
        chart: {
            plotBorderWidth: 1,
            type: 'pie',
            animation: false
        },
        title: {
            text: 'Old title'
        },
        series: [
            {
                data: [2, 1],
                animation: false,
                dataLabels: {
                    enabled: false
                },
                slicedOffset: 0,
                allowPointSelect: true,
                states: {
                    select: {
                        enabled: false,
                        color: 'red'
                    }
                }
            }
        ]
    });

    var oldPlotHeight = chart.plotHeight;

    assert.strictEqual(
        chart.series[0].center[2], // The best I could find to test. Change the test if the logic is changed.
        chart.plotHeight,
        'Pie fills plot'
    );

    // Select one point before resizing
    chart.series[0].points[0].select(true);

    chart.setTitle({ text: null });
    assert.ok(chart.plotHeight > oldPlotHeight, 'Plot height is increased');
    assert.strictEqual(
        chart.series[0].center[2], // The best I could find to test. Change the test if the logic is changed.
        chart.plotHeight,
        'Pie fills plot'
    );

    // Check if the styles from series.states.select were applied
    assert.notStrictEqual(
        chart.series[0].points[0].graphic.attr('fill'),
        'red',
        'Styles from a disabled series state should not be applied, #19402.'
    );
});
