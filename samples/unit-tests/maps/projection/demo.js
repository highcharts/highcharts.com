QUnit.module('Projection', function () {

    const Projection = Highcharts.Projection;

    const testPoints = (assert, projection) => {
        [
            [0, 0],
            [0, -45],
            [45, 0],
            [0, 45],
            [-45, 0]
        ].forEach(coordinates => {
            const result = projection.inverse(projection.forward(coordinates));
            assert.close(
                result[0],
                coordinates[0],
                0.0001,
                `Roundtrip projection of ${coordinates} should result in the ` +
                    'same longitude'
            );
            assert.close(
                result[1],
                coordinates[1],
                0.0001,
                `Roundtrip projection of ${coordinates} should result in the ` +
                    'same latitude'
            );
        });
    };

    // Test the scale near the center of the projection to make sure all
    // projections have comparable zoom levels
    const testScale = (assert, projection) => {
        const x1 = projection.forward([-1, 0]),
            x2 = projection.forward([1, 0]);

        assert.close(
            x2[0] - x1[0],
            2.226389815865471, // precision lost: 2.2263898158654713
            0.0001,
            'X scale should be similar to that of the WebMercator projection'
        );
    };

    Object.keys(Projection.registry).forEach(name => {
        QUnit.test(name, function (assert) {
            const basicProjection = new Projection({ name });
            testPoints(assert, basicProjection);
            testScale(assert, basicProjection);
            testPoints(
                assert,
                new Projection({ name, rotation: [30, 30] })
            );
        });
    });

});