QUnit.test('Ordinal general tests.', function (assert) {
    var chart = Highcharts.stockChart('container', {
            chart: {
                width: 500
            },
            yAxis: {
                opposite: false
            },
            xAxis: {
                min: 1458054620689
            },
            series: [{
                type: 'column',
                data: [
                    [1451577600000, 305899579],
                    [1454256000000, 303016703],
                    [1456761600000, 308008429],
                    [1459440000000, 328699625],
                    [1462032000000, 350010305],
                    [1464710400000, 365809905],
                    [1467302400000, 364839585],
                    [1469980800000, 386193804],
                    [1472659200000, 387630083],
                    [1475251200000, 405138911]
                ]
            },
            {
                data: [1, 2, 3, 4, [420, 44]],
                dataGrouping: {
                    forced: true,
                    units: [['millisecond', [1, 42]]]
                }
            },
            {
                type: 'column',
                data: [1, 2, 3],
                visible: false
            }]
        }),
        tickPositions = chart.xAxis[0].tickPositions,
        controller = new TestController(chart);

    assert.ok(
        tickPositions[0] >= chart.xAxis[0].min,
        'First tick should be greater than axis min when ' +
            'ordinal is enabled (#12716).'
    );

    assert.close(
        chart.xAxis[0].toValue(
            chart.series[0].data[chart.series[0].data.length - 1].plotX,
            true
        ),
        0.001,
        chart.series[0].xData[chart.series[0].xData.length - 1],
        'Column: toValue should return a correct value for ordinal axes, #18863'
    );

    chart.series.forEach(series => {
        series.update({
            type: 'line'
        });
    });

    assert.close(
        chart.xAxis[0].toValue(
            chart.xAxis[0].len,
            true
        ),
        0.001,
        chart.series[0].xData[chart.series[0].xData.length - 1],
        'Line: toValue should return a correct value for ordinal axes, #18863'
    );

    chart.series.forEach(series => {
        series.update({
            type: 'column'
        });
    });

    chart.update({
        xAxis: {
            min: 1451577600000,
            max: 1472316189645.8,
            reversed: true
        },
        yAxis: {
            reversed: true
        }
    });

    tickPositions = chart.xAxis[0].tickPositions;

    assert.ok(
        tickPositions[tickPositions.length - 1] <= chart.xAxis[0].max,
        'Last tick should be smaller than axis max when ' +
            'ordinal is enabled (#12716).'
    );

    chart.xAxis[0].setExtremes(0, 5);
    chart.xAxis[0].setExtremes(0, 500);

    controller.click(100, 100);

    assert.ok(true, 'Click should not throw #16255');
});

QUnit.test(
    '#1011 - Artifacts in top left corner when usign ' +
        'ordinal axis and ignoreHiddenSeries.',
    function (assert) {
        var chart = new Highcharts.StockChart({
                chart: {
                    renderTo: 'container',
                    ignoreHiddenSeries: false
                },
                rangeSelector: {
                    selected: 1
                },
                legend: {
                    enabled: true
                },
                series: [
                    {
                        data: [1, 2, 3, 4]
                    },
                    {
                        data: [4, 3, 4, 5]
                    }
                ]
            }),
            initialTicks = chart.xAxis[0].tickPositions.slice(),
            hiddenTicks;

        chart.series[0].hide();
        chart.series[1].hide();

        hiddenTicks = chart.xAxis[0].tickPositions;

        assert.deepEqual(initialTicks, hiddenTicks, 'The same tick positions.');
    }
);

QUnit.test('Ordinal axis and lazy loading', function (assert) {
    var chart = Highcharts.stockChart('container', {
        chart: {
            width: 600
        },
        xAxis: {
            events: {
                afterSetExtremes: function () {
                    this.chart.series[0].setData([
                        [883612800000, 3.41],
                        [886291200000, 4.62],
                        [1314835200000, 385.03],
                        [1317427200000, 379.96]
                    ]);
                }
            },
            minRange: 3600 * 1000 // one hour
        },
        navigator: {
            adaptToUpdatedData: false,
            series: {
                data: [
                    [883612800000, 0],
                    [1317427200000, 1]
                ]
            }
        },
        series: [
            {
                type: 'area',
                data: [
                    [1318618860000, 421.37],
                    [1318618980000, 421.45],
                    [1318619040000, 421.45],
                    [1318619100000, 421.31],
                    [1318619160000, 421.32],
                    [1318622040000, 421.88],
                    [1318622100000, 421.95],
                    [1318622160000, 421.98],
                    [1318622220000, 421.95],
                    [1318622340000, 422]
                ]
            }
        ]
    });

    chart.rangeSelector.clickButton(5, true);

    Highcharts.objectEach(chart.xAxis[0].ticks, tick => {
        assert.strictEqual(
            tick.isNew,
            false,
            'Tick ' + tick.label.textStr + ' rendered (#10290)'
        );
    });
});


QUnit.test('Panning ordinal axis on mobile devices- lin2val calculation, #13238', function (assert) {
    const data = [
            [1585594800000, 1137.26],
            [1585594860000, 1139.22],
            [1585594920000, 1140.09],
            [1585594980000, 1139.08],
            [1585595040000, 1139.92],
            [1585595100000, 1139.23],
            [1585595160000, 1139.34],
            [1585595220000, 1137.27],
            [1585595280000, 1138.01],
            [1585595340000, 1139.13],
            [1585595400000, 1140.52],
            [1585595460000, 1141.56],
            [1585595520000, 1142.36],
            [1585595580000, 1141.86],
            [1585595640000, 1142.11],
            [1585595700000, 1140.96],
            [1585595760000, 1141.22],
            [1585595820000, 1139.62],
            [1585595880000, 1139.66],
            [1585595940000, 1141.1],
            [1585596000000, 1141.99],
            [1585596060000, 1142.02],
            [1585596120000, 1141.65],
            [1585596180000, 1140.78],
            [1585596240000, 1138.25],
            [1585596300000, 1136.84],
            [1585596360000, 1139.32],
            [1585596420000, 1135.75],
            [1585596480000, 1137.34],
            [1585596540000, 1137.14],
            [1585596600000, 1138.5],
            [1585596660000, 1138.17],
            [1585596720000, 1138.18],
            [1585596780000, 1138.58],
            [1585596840000, 1140.13],
            [1585596900000, 1140.42],
            [1585596960000, 1143.71],
            [1585597020000, 1143.35],
            [1585597080000, 1146.68],
            [1585597140000, 1147.99],
            [1585597200000, 1147.79],
            [1585597260000, 1146.26],
            [1585597320000, 1145.26],
            [1585597380000, 1143.22],
            [1585597440000, 1145.41],
            [1585597500000, 1146.13],
            [1585597560000, 1143.72],
            [1585597620000, 1144.19],
            [1585597680000, 1144.27],
            [1585597740000, 1141.3],
            [1585597800000, 1142.95],
            [1585597860000, 1142.01],
            [1585597920000, 1142.31],
            [1585597980000, 1139.55],
            [1585598040000, 1148.34],
            [1585598100000, 1148.68],
            [1585598160000, 1149.42],
            [1585665060000, 1166.27],
            [1585665120000, 1166.62],
            [1585665180000, 1164.2],
            [1585665240000, 1162.72],
            [1585665300000, 1164.65],
            [1585665360000, 1167.25],
            [1585665420000, 1167.98],
            [1585665480000, 1170.69],
            [1585665540000, 1170.62],
            [1585665600000, 1172.5],
            [1585665660000, 1171.71],
            [1585665720000, 1168.99],
            [1585665780000, 1169.2],
            [1585665840000, 1168.31],
            [1585665900000, 1167.06],
            [1585665960000, 1167.42],
            [1585666020000, 1169.32],
            [1585666080000, 1168.55],
            [1585666140000, 1168.49],
            [1585666200000, 1170.46],
            [1585666260000, 1171.11]
        ],
        chart = Highcharts.stockChart('container', {
            chart: {
                width: 500
            },
            xAxis: {
                min: 1585595880000
            },
            series: [{
                data: data
            }]
        }),
        axis = chart.xAxis[0];

    function emulatePanning() {
        const newMin = axis.toValue(-20),
            newMax = axis.toValue(400);

        chart.xAxis[0].setExtremes(newMin, newMax);
    }

    emulatePanning();

    assert.ok(
        axis.min > chart.series[0].points[0].x,
        `After panning 20px, the axis extremes should not be reset
        but changed respectively.`
    );

    const extendedOrdinalPositionsLength =
        chart.xAxis[0].ordinal.getExtendedPositions();
    chart.series[0].addPoint([1585666260000 + 36e7, 1171.11]);

    assert.notStrictEqual(
        extendedOrdinalPositionsLength,
        chart.xAxis[0].ordinal.getExtendedPositions(),
        `After adding the point, the extendedOrdinalPositions array
        should be recalculated, #16055.`
    );
    // #16068
    chart.xAxis[0].setExtremes(1585665128355, 1586026260000);
    const controller = new TestController(chart),
        visiblePoints = chart.series[0].points.filter(p => p.isInside);

    controller.pan([20, 100], [chart.xAxis[0].len, 100]);

    assert.strictEqual(
        visiblePoints.length,
        chart.series[0].points.filter(p => p.isInside).length,
        'Amount of visible points should remain the same while panning, #16068.'
    );
});

QUnit.test('val2lin- unit tests', function (assert) {
    const axis = {
        ordinal: {
            extendedOrdinalPositions: [
                0, 0.5, 1.5, 3, 4.2, 4.8, 5, 7, 8, 9, 10
            ],
            positions: [3, 4.2, 4.8, 5, 7]
        }
    };
    axis.ordinal.axis = axis;

    function val2lin(val, toIndex) {
        return Highcharts.Axis.prototype.val2lin.call(axis, val, toIndex);
    }

    axis.ordinal.getExtendedPositions = function () {
        return axis.ordinal.extendedOrdinalPositions;
    };

    assert.equal(
        val2lin(5, true),
        3,
        `If the value we are looking for is inside the ordinal positions array
        and fits the exact value, the method should return the index of that
        value in this array as a total number.`
    );
    assert.equal(
        val2lin(7, true),
        4,
        `If the value we are looking for is inside the ordinal positions array
        and fits the exact value, the method should return the index of that
        value in this array as a total number.`
    );
    assert.equal(
        val2lin(3, true),
        0,
        `If the value we are looking for is inside the ordinal positions array
        and fits the exact value, the method should return the index of that
        value in this array as a total number.`
    );
    assert.equal(
        val2lin(6, true),
        3.5,
        `If the value we are looking for is inside the ordinal positions array
        and doesn't fit the exact value, the method should return the index
        between higher and lower value.`
    );
    assert.equal(
        val2lin(3.6, true),
        0.5,
        `If the value we are looking for is inside the ordinal positions array
        and doesn't fit the exact value, the method should return the index
        between higher and lower value.`
    );
    assert.equal(
        val2lin(0, true),
        -3,
        `If the value we are looking for is inside the extended ordinal
        positions array and fits the exact value, the method should return
        the index of that value in this array as a total number.`
    );
    assert.equal(
        val2lin(9, true),
        6,
        `If the value we are looking for is inside the extended ordinal
        positions array and fits the exact value, the method should return
        the index of that value in this array as a total number.`
    );
    assert.equal(
        val2lin(2.25, true),
        -0.5,
        `If the value we are looking for is inside the extended ordinal
        positions array and doesn't fit the exact value, the method should
        return the index between higher and lower value.`
    );
    assert.equal(
        val2lin(8.5, true),
        5.5,
        `If the value we are looking for is inside the extended ordinal
        positions array and doesn't fit the exact value, the method should
        return the index between higher and lower value.`
    );
    assert.equal(
        val2lin(-10, true),
        -14,
        `If the value we are looking for is outside the extended ordinal
        positions array, the method should return the approximate index
        extrapolated from the slope of the array`
    );
    assert.equal(
        val2lin(20, true),
        19,
        `If the value we are looking for is outside the extended ordinal
        positions array, the method should return the approximate index
        extrapolated from the slope of the array`
    );
});

QUnit.test('Ordinal axis, data grouping and boost module, #14055.', assert => {
    const chart = Highcharts.stockChart('container', {
        series: [{
            data: [
                [1, 1],
                [2, 2],
                [3, 3],
                [10, 4],
                [11, 1],
                [12, 2],
                [14, 3]
            ]
        }]
    });

    assert.ok(
        chart.xAxis[0].ordinal.positions.length,
        `When the boost module is present and the chart is initiated with
        the default options, the ordinal positions should be calculated.`
    );
    assert.notOk(
        chart.series[0].currentDataGrouping,
        `When the boost module is present and the chart is initiated with
        the default options, the data should not be grouped.`
    );
    assert.notOk(
        chart.series[0].boost &&
        chart.series[0].boost.clipRect,
        `When the boost module is present and the chart is initiated with
        the default options, the chart should not be boosted.`
    );

    chart.series[0].update({
        boostThreshold: 1
    });
    assert.ok(
        chart.xAxis[0].ordinal.positions.length,
        `After updating the boostThreshold,
        ordinal positions should be still calculated.`
    );
    assert.notOk(
        chart.series[0].boost &&
        chart.series[0].boost.clipRect &&
        chart.series[0].currentDataGrouping,
        `After updating the boostThreshold,
        the chart should not be boosted nor grouped.`
    );

    chart.series[0].update({
        dataGrouping: {
            forced: true,
            units: [
                ['millisecond', [2]]
            ]
        }
    });
    assert.ok(
        chart.xAxis[0].ordinal.positions.length &&
            chart.series[0].currentDataGrouping,
        `When data grouping is enabled (forced) for the chart,
        series should be boosted and grouped.`
    );
    assert.notOk(
        (
            (chart.series[0].boost && chart.series[0].boost.clipRect) ||
            (chart.boost && chart.boost.clipRect)
        ) &&
        chart.series[0].currentDataGrouping,
        'When data grouping is enabled (forced), chart should not be boosted.'
    );

    chart.series[0].update({
        dataGrouping: {
            enabled: false
        }
    });
    assert.ok(
        chart.xAxis[0].ordinal.positions.length &&
        (
            chart.series[0].boost.clipRect ||
            chart.boost.clipRect
        ),
        `Only after explicitly disabling the data grouping
        chart should be boosted.`
    );
});

QUnit.test('Circular translation, #17128.', assert => {
    const data = [{
        type: 'line',
        data: [
            [548935806499, 95.82],
            [1548936121889, 95.84],
            [1548936895949, 95.75],
            [1548937941785, 95.48],
            [1548938881593, 95.6],
            [1548939834796, 95.37],
            [1548940821273, 95.16],
            [1548941760541, 95.15],
            [1548942617180, 94.9],
            [1548943265472, 95.04],
            [1548943953574, 94.93],
            [1548944604420, 94.94],
            [1548945157396, 95.19],
            [1548945448867, 94.92],
            [1548946059662, 94.98],
            [1548946666809, 95.17],
            [1548947190658, 95.38]
        ],
        showInNavigator: true
    }, {
        type: 'scatter',
        data: [
            [1548936121889, 90],
            [1548938881593, 95]
        ],
        showInNavigator: false
    }];

    const chart = Highcharts.stockChart('container', {
            series: data,
            boost: {
                enabled: false
            },
            legend: {
                enabled: true
            }
        }),
        x = Date.UTC(2019, 0, 31, 14, 30);


    assert.strictEqual(
        x,
        Math.round(chart.xAxis[0].toValue(chart.xAxis[0].toPixels(x))),
        `When two series (line and scatter) are visible, circular translation of
        the date should return the same value.`
    );

    chart.xAxis[0].setExtremes(
        Date.UTC(2019, 0, 31, 14),
        Date.UTC(2019, 0, 31, 15)
    );

    assert.strictEqual(
        x,
        Math.round(chart.xAxis[0].toValue(chart.xAxis[0].toPixels(x))),
        `After zooming, when the scatterer series is not visible, a circular
        translation of the date should return the same value.`
    );

    // Reverse the order of the series
    chart.xAxis[0].setExtremes();
    chart.update({ series: data.reverse() });

    // Perform the exact same tests as above
    assert.strictEqual(
        x,
        Math.round(chart.xAxis[0].toValue(chart.xAxis[0].toPixels(x))),
        `When two series (scatter and line) are visible, circular translation of
        the date should return the same value.`
    );

    chart.xAxis[0].setExtremes(
        Date.UTC(2019, 0, 31, 14),
        Date.UTC(2019, 0, 31, 15)
    );

    assert.strictEqual(
        x,
        Math.round(chart.xAxis[0].toValue(chart.xAxis[0].toPixels(x))),
        `After zooming, when the scatter series is not visible, a circular
        translation of the date should return the same value.`
    );
});

QUnit.test('Moving annotations on ordinal axis.', assert => {
    const data = [
        [
            1622640600000,
            124.28,
            125.24,
            124.05,
            125.06
        ],
        [
            1622727000000,
            124.68,
            124.85,
            123.13,
            123.54
        ],
        [
            1622813400000,
            124.07,
            126.16,
            123.85,
            125.89
        ],
        [
            1623072600000,
            126.17,
            126.32,
            124.83,
            125.9
        ],
        [
            1623159000000,
            126.6,
            128.46,
            126.21,
            126.74
        ],
        [
            1623245400000,
            127.21,
            127.75,
            126.52,
            127.13
        ]
    ];

    const chart = Highcharts.stockChart('container', {
        series: [{
            type: 'ohlc',
            data: data
        }, {
            type: 'sma',
            linkedTo: ':previous',
            params: {
                period: 2
            }
        }]
    });

    chart.xAxis[0].setExtremes(1622727000000, 1622813400000);

    const circle = chart.addAnnotation({
        shapes: [{
            type: 'circle',
            point: {
                x: 1623072600000,
                y: 125,
                xAxis: 0,
                yAxis: 0
            },
            r: 20
        }]
    });

    const controller = new TestController(chart),
        { x: pointX, y: pointY } = circle.userOptions.shapes[0].point,
        x = chart.xAxis[0].toPixels(pointX),
        y = chart.yAxis[0].toPixels(pointY);

    controller.pan([x, y], [x - 50, y]);

    assert.close(
        x - 50,
        chart.xAxis[0].toPixels(circle.userOptions.shapes[0].point.x),
        0.1,
        'Annotation dragged on ordinal axis charts should follow mouse pointer, #18459.'
    );

    chart.xAxis[0].setExtremes(1622813400000, 1623245400000);
    chart.series[0].update({
        dataGrouping: {
            forced: true
        }
    });

    const val = chart.xAxis[0].toValue(-150, true);
    const pixels = chart.xAxis[0].toPixels(val, true);

    assert.close(
        pixels,
        -150,
        0.0001,
        'toValue <-> toPixels translation should return the same initial value, #16784. '
    );
});

QUnit.test('Selection zoom with ordinal and multiple series.', assert => {
    const dataA = [
            [1629217713911, 2],
            [1629395999999, 0],
            [1629745199999, 0],
            [1630085544305, 4],
            [1631033631154, 5],
            [1632261599999, 0],
            [1632448799999, 0],
            [1633456799999, 0],
            [1633538040243, 3],
            [1633640399999, 0],
            [1633719599999, 0],
            [1634057840935, 3],
            [1634248799999, 0],
            [1635265719388, 3],
            [1635436264494, 5],
            [1635793199999, 0],
            [1635796179634, 4],
            [1636129081500, 4],
            [1636489836639, 3],
            [1637093668072, 2],
            [1637179046931, 1],
            [1637611106201, 4],
            [1637695799999, 0],
            [1638208900320, 0],
            [1638221559650, 2],
            [1638304199999, 0],
            [1638385199999, 0],
            [1638816361148, 2],
            [1639511914482, 5],
            [1639684799999, 0],
            [1641427199999, 0],
            [1641599999999, 0],
            [1641607199999, 0],
            [1642710599999, 0],
            [1643234399999, 0],
            [1643313599999, 0],
            [1643416199999, 0],
            [1643677465639, 0],
            [1643763599999, 0],
            [1644616799999, 0],
            [1645149599999, 0],
            [1645225199999, 0],
            [1646071199999, 0],
            [1646085599999, 0],
            [1646440232576, 0],
            [1646875799999, 0],
            [1647051539999, 0],
            [1647305999999, 0],
            [1647366579909, 3],
            [1647382863051, 0],
            [1647385199999, 0],
            [1647625496314, 1],
            [1647703799999, 0],
            [1647890204992, 0],
            [1647971999999, 0],
            [1648231199999, 0],
            [1648645199999, 0],
            [1648648799999, 0],
            [1648738799999, 0],
            [1648753199999, 0],
            [1648767599999, 0],
            [1648839599999, 0],
            [1649087999999, 0],
            [1649095199999, 0],
            [1649300399999, 0],
            [1649338199999, 0],
            [1649800799999, 0],
            [1650383099999, 0],
            [1650392999999, 0],
            [1650661166312, 22],
            [1651267799999, 0],
            [1651269599999, 0],
            [1651595399999, 0],
            [1651701599999, 0],
            [1651711035165, 5],
            [1652369971503, 0],
            [1652459230061, 2],
            [1652824799999, 0],
            [1653058799999, 0],
            [1653330599999, 0],
            [1653490799999, 0],
            [1653839399999, 0],
            [1653839520000, 0],
            [1653841259999, 0],
            [1653938519999, 0],
            [1654520399999, 0],
            [1654540199999, 0],
            [1654865999999, 0],
            [1655224199999, 0],
            [1655314588311, 5],
            [1655839799999, 0],
            [1655924399999, 0],
            [1656442799999, 0],
            [1656457199999, 0],
            [1656701999999, 0],
            [1657138287579, 0],
            [1657562189723, 0],
            [1657902599999, 0],
            [1659378599999, 0],
            [1659560399999, 0],
            [1660152347475, 5],
            [1660159799999, 0],
            [1660920289427, 0],
            [1661363999999, 0],
            [1661540399999, 0],
            [1661959759051, 0],
            [1661968799999, 0],
            [1663354799999, 0],
            [1663786799999, 0],
            [1663948799999, 0],
            [1664470799999, 0],
            [1664481599999, 0],
            [1664998730658, 0],
            [1665595799999, 0],
            [1665769678364, 1],
            [1666206610847, 2],
            [1666303199999, 0],
            [1666814399999, 0],
            [1667012399999, 0],
            [1668113999999, 0],
            [1668198599999, 0],
            [1668624253855, 0],
            [1669237199999, 0],
            [1669834799999, 0],
            [1669854599999, 0],
            [1670005799999, 0],
            [1670522399999, 0],
            [1670603399999, 0],
            [1671049799999, 0],
            [1672766999999, 0],
            [1672863599999, 0],
            [1673026199999, 0],
            [1673036999999, 0],
            [1673470799999, 0],
            [1674235799999, 0],
            [1674575999999, 0],
            [1674583199999, 0],
            [1674667799999, 0],
            [1674671399999, 0],
            [1675264368554, 3],
            [1675449147737, 0],
            [1675459799999, 0],
            [1675781999999, 0],
            [1675880999999, 0],
            [1676485799999, 0],
            [1676611799999, 0],
            [1676658169410, 0],
            [1676919599999, 0],
            [1677187799999, 0],
            [1677527099999, 0],
            [1677818088232, 5],
            [1677818147318, 1],
            [1677818869924, 1],
            [1677859199999, 0],
            [1677864599999, 0],
            [1677868199999, 0],
            [1678210199999, 0],
            [1678229099999, 0],
            [1678496519693, 3],
            [1678735799999, 0],
            [1678811399999, 0],
            [1678897799999, 0],
            [1678993109208, 0],
            [1679070104316, 0],
            [1679416199999, 0],
            [1679421599999, 0],
            [1679516854463, 3],
            [1679591999999, 0],
            [1679594511558, 0],
            [1679603399999, 0],
            [1679678999999, 0],
            [1679929743760, 0],
            [1680029999999, 0],
            [1680036299999, 0],
            [1680193799999, 0],
            [1680197399999, 0],
            [1680202799999, 0],
            [1680283799999, 0],
            [1680533999999, 0],
            [1680712199999, 0],
            [1681151399999, 0],
            [1681324199999, 0],
            [1681406999999, 0],
            [1681412399999, 0],
            [1681489441965, 0],
            [1681493399999, 0],
            [1681828199999, 0],
            [1681833599999, 0],
            [1681840799999, 0],
            [1681932119999, 0],
            [1682360553556, 0],
            [1682369219999, 0],
            [1682463599999, 0],
            [1682525762537, 0],
            [1682530199999, 0],
            [1682702999999, 0],
            [1682791272551, 0],
            [1682967599999, 0],
            [1683044999999, 0],
            [1683052418691, 0],
            [1683082799999, 0],
            [1683136799999, 0],
            [1683235799999, 0],
            [1683298799999, 0],
            [1683305999999, 0],
            [1683557999999, 0],
            [1683640439999, 0],
            [1683644399999, 0],
            [1683653324226, 2],
            [1683741855015, 0],
            [1683747119999, 0],
            [1683850259999, 0],
            [1683857339999, 0],
            [1683865079999, 0],
            [1683907980000, 0],
            [1683917999999, 0],
            [1683919799999, 0],
            [1684180799999, 0],
            [1684261799999, 0],
            [1684263599999, 0],
            [1684439579999, 0],
            [1684519919999, 0],
            [1684537199999, 0],
            [1684767599999, 0],
            [1684787208861, 0],
            [1684853159999, 0],
            [1684860208061, 0],
            [1684868399999, 0],
            [1684948688782, 0],
            [1685122083588, 0],
            [1685122379999, 0],
            [1685207459999, 0],
            [1685567939999, 0],
            [1685629862026, 12],
            [1685642399999, 0],
            [1685660399999, 0],
            [1685746799999, 0],
            [1685989799999, 0],
            [1686158999999, 0],
            [1686271401043, 12],
            [1686529259999, 0],
            [1686604499999, 0],
            [1686676728726, 0],
            [1686850199999, 0],
            [1686866997813, 0],
            [1687368599999, 0],
            [1687458620230, 0],
            [1687477199999, 0],
            [1687541215163, 0],
            [1687793399999, 0],
            [1687807799999, 0],
            [1687822979999, 0],
            [1687877816471, 2],
            [1687967999999, 0],
            [1688063519999, 0],
            [1688078219999, 0],
            [1688479199999, 0],
            [1688578199999, 0],
            [1688667664969, 2],
            [1689173999999, 0],
            [1689182550694, 12],
            [1689281999999, 0],
            [1689621094589, 2],
            [1689689538390, 2],
            [1689793761601, 4],
            [1690306199999, 0],
            [1690311599999, 0],
            [1690391609361, 12],
            [1690401599999, 0],
            [1690469534525, 23],
            [1690480144583, 23],
            [1690484399999, 0],
            [1690556399999, 0],
            [1690996449253, 3],
            [1691087282457, 0],
            [1691162999999, 0],
            [1691508599999, 0],
            [1691519399999, 0],
            [1691594999999, 0],
            [1691603999999, 0],
            [1692037799999, 0],
            [1692108750038, 23],
            [1692118851663, 0],
            [1692122399999, 0],
            [1692228599999, 0],
            [1692372082460, 34],
            [1692730859999, 0],
            [1692736739999, 0],
            [1693330199999, 0],
            [1693512482119, 0],
            [1693592999999, 0],
            [1693947599999, 0],
            [1694034179999, 0],
            [1694449799999, 0],
            [1694622646634, 0],
            [1694631599999, 0],
            [1694644199999, 0],
            [1695230999999, 0],
            [1695305904607, 0],
            [1695306177724, 2],
            [1695313091003, 2]
        ],
        dataB = [
            [1678464000000, 1],
            [1680726300000, 2],
            [1690399800000, 3]
        ];

    const chart = Highcharts.stockChart('container', {
        rangeSelector: {
            enabled: true,
            selected: 0
        },
        chart: {
            zoomType: 'x'
        },
        xAxis: [{
            type: 'datetime'
        }],
        series: [{
            data: dataA
        }, {
            data: dataB
        }],
        plotOptions: {
            series: {
                dataGrouping: {
                    enabled: false
                }
            }
        }
    });

    const testController = new TestController(chart),
        start = [chart.plotLeft, chart.plotTop + 40],
        end = [chart.plotLeft + chart.xAxis[0].len / 10, chart.plotTop + 40];

    testController.pan(start, end);

    const actualMin = chart.series[0].xAxis.min;

    assert.close(actualMin, 1692634691003, 1,
        'The xAxis should be zoomed correctly to selection.');
});

QUnit.test('Ordinal axis + Scatter series #19243', function (assert) {
    const linePoints = [10, 14, 20, 25],
        scatterPoints = [10, 14, 20, 25, 10, 10],
        scatterPointInterval = 15,
        chart = Highcharts.stockChart('container', {
            boost: {
                enabled: false
            },
            series: [{
                type: 'line',
                data: linePoints,
                pointInverval: 10
            }, {
                type: 'scatter',
                data: scatterPoints,
                pointInterval: scatterPointInterval
            }]
        });

    assert.strictEqual(
        chart.xAxis[0].getExtremes().max,
        (scatterPoints.length - 1) * scatterPointInterval,
        'Max extreme should be equal to the last point in scatter series.'
    );

});
