QUnit.module('MapView', () => {

    const MapView = Highcharts.MapView;

    [
        {},
        { zoom: 5, center: [50, 50] }
    ].forEach(options => {
        QUnit.test('options: ' + JSON.stringify(options), assert => {

            const mapView = new MapView({
                options: {
                    chart: {}
                },
                plotBox: {
                    x: 0,
                    y: 0,
                    width: 1000,
                    height: 100
                }
            }, options);

            [
                { x: 0, y: 0 },
                { x: 0, y: -100 },
                { x: 100, y: 0 },
                { x: 0, y: 100 },
                { x: -100, y: 0 }
            ].forEach(point => {
                const projected = mapView.pixelsToProjectedUnits(point),
                    result = mapView.projectedUnitsToPixels(projected);
                assert.close(
                    result.x,
                    point.x,
                    0.0000001,
                    `Roundtrip conversion of [${point.x}, ${point.y}] ` +
                        'should result in the same x value'
                );
                assert.close(
                    result.y,
                    point.y,
                    0.0000001,
                    `Roundtrip conversion of [${point.x}, ${point.y}] ` +
                        'should result in the same y value'
                );
            });
        });

    });
});