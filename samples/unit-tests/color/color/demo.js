QUnit.test('Compatibility', function (assert) {
    assert.strictEqual(
        Highcharts.color('#ff0000').get('rgba'),
        'rgba(255,0,0,1)',
        'Backwards compatibility - the Color class should work without the ' +
        '"new" keyword'
    );
});

QUnit.test('Interpolate colors', function (assert) {
    // Cache names from Boost module
    var colorNames = Highcharts.Color.names;
    Highcharts.Color.names = {};

    var color = Highcharts.color;

    assert.equal(
        color('#FF0000').tweenTo(color('#0000FF'), 0.5),
        'rgb(128,0,128)',
        'Hex colors'
    );

    assert.equal(
        color('rgb(255, 0, 0)').tweenTo(color('rgb(0, 0, 255)'), 0.5),
        'rgb(128,0,128)',
        'RGB colors'
    );

    assert.equal(
        color('rgba(255, 0, 0, 1)').tweenTo(color('rgba(0, 0, 255, 0.5)'), 0.5),
        'rgba(128,0,128,0.75)',
        'RGBA colors'
    );

    assert.equal(
        color('red').tweenTo(color('blue'), 0.5),
        'color-mix(in srgb,red,blue 50%)',
        'Named colors'
    );

    assert.equal(
        color('red').tweenTo(color('#FFFFFF'), 0.5),
        'color-mix(in srgb,red,#FFFFFF 50%)',
        'Named color to hex'
    );

    assert.equal(
        color('#FFFFFF').tweenTo(color('red'), 0.5),
        'color-mix(in srgb,#FFFFFF,red 50%)',
        'Hex to named color'
    );

    assert.equal(
        JSON.stringify(
            color({
                radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
                stops: [
                    [0, '#FF0000'],
                    [1, '#00FF00']
                ]
            }).tweenTo(
                color({
                    radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
                    stops: [
                        [0, '#FFFF00'],
                        [1, '#00FFFF']
                    ]
                }),
                0.5
            )
        ),
        '{"radialGradient":{"cx":0.5,"cy":0.3,"r":0.7},"stops":[[0,' +
        '"#FFFF00"],[1,"#00FFFF"]]}',
        'Gradients'
    );
    assert.equal(color().tweenTo(color(), 0.5), 'none', 'Undefined colors');

    Highcharts.Color.names = colorNames;
});
