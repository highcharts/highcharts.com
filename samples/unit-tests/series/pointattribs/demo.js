QUnit.test('Series.pointAttribs().fill when state is hover', function (assert) {
    /**
     * The ranking of fill options when state is hover
     * 1. point.options.marker.states.hover.fillColor
     * 2. series.options.marker.states.hover.fillColor
     * 3. point.options.marker.fillColor
     * 4. series.options.marker.fillColor
     * 5. point.options.color
     * 6. series.zones[].color
     * 7. point.color
     * 8. series.color
     */
    var pointAttribs = Highcharts.Series.prototype.pointAttribs,
        series = {
            color: '#000008',
            options: {
                marker: {
                    fillColor: '#000004',
                    states: {
                        hover: {
                            fillColor: '#000002'
                        }
                    }
                }
            }
        },
        point = {
            state: 'hover',
            color: '#000007',
            options: {
                color: '#000005',
                marker: {
                    fillColor: '#000003',
                    states: {
                        hover: {
                            fillColor: '#000001'
                        }
                    }
                }
            },
            zone: {
                color: '#000006'
            }
        };

    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000001',
        'point.options.marker.states.hover.fillColor ranks as #1'
    );

    point.options.marker.states.hover.fillColor = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000002',
        'series.options.marker.states.hover.fillColor ranks as #2'
    );

    series.options.marker.states.hover.fillColor = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000003',
        'point.options.marker.fillColor ranks as #3'
    );

    point.options.marker.fillColor = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000004',
        'series.options.marker.fillColor ranks as #4'
    );

    series.options.marker.fillColor = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000005',
        'point.options.color ranks as #5'
    );

    point.options.color = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000006',
        'series.zones[].color ranks as #6'
    );

    point.zone = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000007',
        'point.color ranks as #7'
    );

    point.color = undefined;
    assert.strictEqual(
        pointAttribs.call(series, point).fill,
        '#000008',
        'series.color ranks as #8'
    );
});

QUnit.test(
    'Series.pointAttribs().stroke when state is hover',
    function (assert) {
        /**
         * The ranking of stroke options when state is hover
         * 1. point.options.marker.states.hover.lineColor
         * 2. series.options.marker.states.hover.lineColor
         * 3. point.options.marker.lineColor
         * 4. series.options.marker.lineColor
         * 5. point.options.color
         * 6. series.zones[].color
         * 7. point.color
         * 8. series.color
         */
        var pointAttribs = Highcharts.Series.prototype.pointAttribs,
            series = {
                color: '#000008',
                options: {
                    marker: {
                        lineColor: '#000004',
                        states: {
                            hover: {
                                lineColor: '#000002'
                            }
                        }
                    }
                }
            },
            point = {
                state: 'hover',
                color: '#000007',
                options: {
                    color: '#000005',
                    marker: {
                        lineColor: '#000003',
                        states: {
                            hover: {
                                lineColor: '#000001'
                            }
                        }
                    }
                },
                zone: {
                    color: '#000006'
                }
            };

        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000001',
            'point.options.marker.states.hover.lineColor ranks as #1'
        );

        point.options.marker.states.hover.lineColor = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000002',
            'series.options.marker.states.hover.lineColor ranks as #2'
        );

        series.options.marker.states.hover.lineColor = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000003',
            'point.options.marker.lineColor ranks as #3'
        );

        point.options.marker.lineColor = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000004',
            'series.options.marker.lineColor ranks as #4'
        );

        series.options.marker.lineColor = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000005',
            'point.options.color ranks as #5'
        );

        point.options.color = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000006',
            'series.zones[].color ranks as #6'
        );

        point.zone = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000007',
            'point.color ranks as #7'
        );

        point.color = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point).stroke,
            '#000008',
            'series.color ranks as #8'
        );
    }
);

QUnit.test(
    'Series.pointAttribs().stroke-width when state is hover',
    function (assert) {
        /**
         * The ranking of stroke-width options when state is hover
         *  1. point.options.marker.states.hover.lineWidth
         *  2. series.options.marker.states.hover.lineWidth
         *  4. strokeWidth + point.options.marker.states.hover.lineWidthPlus
         *  5. strokeWidth + series.options.marker.states.hover.lineWidthPlus
         *  5. point.options.marker.lineWidth
         *  6. series.options.marker.lineWidth
         */
        var pointAttribs = Highcharts.Series.prototype.pointAttribs,
            series = {
                options: {
                    marker: {
                        lineWidth: 6,
                        states: {
                            hover: {
                                lineWidthPlus: -1,
                                lineWidth: 2
                            }
                        }
                    }
                },
                zones: []
            },
            point = {
                state: 'hover',
                color: '#000007',
                options: {
                    color: '#000005',
                    marker: {
                        lineWidth: 5,
                        states: {
                            hover: {
                                lineWidth: 1,
                                lineWidthPlus: -2
                            }
                        }
                    }
                },
                getZone: function () {
                    return series.zones[0];
                }
            },
            state = 'hover';

        assert.strictEqual(
            pointAttribs.call(series, point)['stroke-width'],
            1,
            'point.options.marker.states.hover.lineWidth ranks as #1'
        );

        point.options.marker.states.hover.lineWidth = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point)['stroke-width'],
            2,
            'series.options.marker.states.hover.lineWidth ranks as #2'
        );

        series.options.marker.states.hover.lineWidth = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point)['stroke-width'],
            3,
            'strokeWidth + point.options.marker.states.hover.lineWidthPlus ranks as #3'
        );

        point.options.marker.states.hover.lineWidthPlus = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point)['stroke-width'],
            4,
            'strokeWidth + series.options.marker.states.hover.lineWidthPlus ranks as #4'
        );

        series.options.marker.states.hover.lineWidthPlus = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point)['stroke-width'],
            5,
            'point.options.marker.lineWidth ranks as #5'
        );

        point.options.marker.lineWidth = undefined;
        assert.strictEqual(
            pointAttribs.call(series, point)['stroke-width'],
            6,
            'series.options.marker.lineWidth ranks as #6'
        );
    }
);
