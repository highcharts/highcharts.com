QUnit.test('Set basemap on chart object', function (assert) {
    let chart = new Highcharts.MapChart('container', {
        chart: {
            map: 'countries/ad/ad-all'
        },
        series: [{}]
    });

    assert.strictEqual(
        chart.series[0].mapData.length,
        Highcharts.maps['countries/ad/ad-all'].features.length,
        'Set map on chart object by string'
    );

    chart = new Highcharts.MapChart('container', {
        chart: {
            map: Highcharts.maps['countries/us/us-all']
        },
        series: [{}]
    });

    const series = chart.series[0],
        nullColor = Highcharts.Series.types.map.defaultOptions.nullColor;

    assert.strictEqual(
        series.mapData.length,
        // -1 because us map has 1 feature more (type: 'MultiLineString')
        Highcharts.maps['countries/us/us-all'].features.length - 1,
        'Set map on chart object by GeoJSON object'
    );

    series.update({
        mapData: Highcharts.maps['countries/bn/bn-all']
    });

    assert.strictEqual(
        series.mapData.length,
        Highcharts.maps['countries/bn/bn-all'].features.length,
        'Map on the series object should overrule chart-wide setting.'
    );

    series.update({
        data: [{ 'hc-key': 'ad-6407' }, { 'hc-key': 'ad-6406', value: null }],
        mapData: Highcharts.maps['countries/ad/ad-all']
    });

    assert.strictEqual(
        series.mapData.length,
        Highcharts.maps['countries/ad/ad-all'].features.length,
        `New mapData should be updated correctly
        (when updating with data), #11636.`
    );

    assert.strictEqual(
        series.points[0].graphic.attr('fill'),
        series.color,
        'undefined value is allowed, so the point should be colored, #17279.'
    );

    assert.strictEqual(
        series.points[1].graphic.attr('fill'),
        nullColor,
        'Data point with null value should not be colored, #17279.'
    );

    series.update({
        data: [],
        mapData: Highcharts.maps['countries/bn/bn-all']
    });

    assert.strictEqual(
        series.mapData.length,
        Highcharts.maps['countries/bn/bn-all'].features.length,
        `New mapData should be updated correctly
        (when updating with empty data), #11636.`
    );

    assert.strictEqual(
        series.points[0].graphic.attr('fill'),
        nullColor,
        `When updating mapData with empty data, the first point should have
        a null color, #11636.`
    );

    assert.strictEqual(
        chart.series[0].points[0].options.name,
        'Temburong',
        `The first point from a map source should be bn-te, its name should
        be taken from a map source.`
    );

    chart.series[0].update({
        dataLabels: {
            enabled: true,
            format: '{point.hc-key}'
        }
    });

    assert.strictEqual(
        chart.series[0].points[0].dataLabel.textStr,
        'bn-te',
        `The first point from a map source should be bn-te, its name should
        be taken from a map source.`
    );
    chart.series[0].setData(
        [{
            'hc-key': 'bn-be',
            value: 0
        }, {
            'hc-key': 'bn-te',
            value: 1
        }, {
            'hc-key': 'bn-bm',
            value: 2
        }, {
            'hc-key': 'bn-tu',
            value: 3
        }]
    );

    assert.strictEqual(
        chart.series[0].points[0].options.name,
        undefined,
        `After setData with unsorted data without a points' name, the points
        should be cleared and the first point should be matched correctly
        (by joinBy), #16782.`
    );

    assert.strictEqual(
        chart.series[0].points[0]['hc-key'],
        'bn-be',
        `After setData with unsorted data the first point should be matched
        correctly (by joinBy).`
    );

    assert.strictEqual(
        chart.series[0].points[0].dataLabel.textStr,
        'bn-be',
        `The first point from a map source should be bn-te, its name should
        be taken from a map source, #16782.`
    );

});
