QUnit.test('Histogram', function (assert) {
    var chart = Highcharts.chart('container', {
        series: [
            {
                type: 'histogram',
                baseSeries: 1,
                binWidth: 10
            },
            {
                data: [
                    36,
                    { y: 25, id: 'p1' },
                    38,
                    46,
                    55,
                    68,
                    72,
                    55,
                    36,
                    38,
                    67,
                    45,
                    22,
                    48,
                    91,
                    46,
                    52,
                    61,
                    58,
                    55
                ]
            },
            {
                data: [1, 1, 1, 1, 2, 2, 2, 3],
                id: 's2'
            },
            {
                data: [
                    0.4131376140169578,
                    0.4131376140169578,
                    0.4131376140169578,
                    0.4131376140169578,
                    0.4131376140169578
                ],
                id: 's3'
            },
            {
                data: [
                    261,
                    99,
                    102,
                    86,
                    32,
                    37,
                    115,
                    116,
                    55,
                    60,
                    99,
                    200,
                    115,
                    76,
                    259,
                    234,
                    85,
                    82,
                    113,
                    143,
                    289,
                    57,
                    179,
                    256,
                    191,
                    369,
                    220,
                    82,
                    115,
                    71,
                    105,
                    46,
                    147,
                    69,
                    229,
                    254,
                    118,
                    186,
                    164,
                    103,
                    113,
                    191,
                    107,
                    127,
                    144,
                    147,
                    402,
                    288,
                    52,
                    75,
                    57,
                    38,
                    105,
                    74,
                    44,
                    42,
                    303,
                    69,
                    32,
                    194,
                    194,
                    194,
                    558,
                    566,
                    63,
                    73,
                    95,
                    44,
                    43,
                    107,
                    72,
                    66,
                    55,
                    139,
                    75,
                    73,
                    91,
                    72,
                    83,
                    86,
                    184,
                    64,
                    214,
                    59,
                    167,
                    73,
                    122,
                    60,
                    73,
                    79,
                    36,
                    80,
                    64,
                    140,
                    168,
                    112,
                    131,
                    87,
                    133,
                    95,
                    94,
                    31,
                    48,
                    84,
                    141,
                    44,
                    52,
                    92,
                    60,
                    24,
                    174,
                    88,
                    101,
                    371,
                    71,
                    86,
                    107,
                    84,
                    26,
                    83,
                    105,
                    63,
                    78,
                    64,
                    134,
                    76,
                    148,
                    121,
                    67,
                    135,
                    129,
                    68,
                    67,
                    56,
                    74,
                    188,
                    87,
                    132,
                    71,
                    82,
                    51,
                    142,
                    111,
                    334,
                    31,
                    126,
                    97,
                    305,
                    106,
                    173,
                    148,
                    204,
                    91,
                    71,
                    69,
                    74,
                    80,
                    77,
                    85,
                    94,
                    63,
                    169,
                    62,
                    66,
                    50,
                    82,
                    76,
                    82,
                    153,
                    104,
                    123,
                    114,
                    72,
                    47,
                    198,
                    88,
                    111,
                    102,
                    95,
                    91,
                    172,
                    113,
                    127,
                    94,
                    56,
                    87,
                    107,
                    111,
                    149,
                    99,
                    66,
                    73,
                    78,
                    77,
                    130,
                    79,
                    64,
                    110,
                    79,
                    62,
                    58,
                    171,
                    175,
                    76,
                    82,
                    84,
                    109,
                    94,
                    128,
                    128,
                    257,
                    71,
                    200,
                    92,
                    95,
                    65,
                    137,
                    73,
                    70,
                    52,
                    79,
                    67,
                    137,
                    159,
                    35,
                    100,
                    87,
                    133,
                    54,
                    141,
                    125,
                    61,
                    93,
                    97,
                    100,
                    72,
                    86,
                    76,
                    62,
                    36,
                    109,
                    41,
                    77,
                    27,
                    68,
                    160,
                    213,
                    921,
                    172,
                    25,
                    53,
                    38,
                    140,
                    140,
                    171,
                    171,
                    140,
                    140,
                    171,
                    171,
                    140,
                    171,
                    69,
                    141,
                    80,
                    64,
                    103,
                    38,
                    169,
                    141,
                    137,
                    78,
                    337,
                    53,
                    92,
                    176,
                    108,
                    84,
                    208,
                    80,
                    53,
                    44,
                    131,
                    67,
                    121,
                    70,
                    129,
                    98,
                    57,
                    39,
                    129,
                    54,
                    171,
                    42,
                    74,
                    81,
                    106,
                    111,
                    181,
                    155,
                    99,
                    89,
                    110,
                    57,
                    102,
                    50,
                    37,
                    114,
                    40,
                    71,
                    31,
                    100,
                    150,
                    114,
                    157,
                    113,
                    151,
                    196,
                    278,
                    45,
                    45,
                    167,
                    92,
                    52,
                    82,
                    92,
                    92,
                    44,
                    346,
                    68,
                    92,
                    92,
                    91,
                    37,
                    111,
                    72,
                    35,
                    63,
                    90,
                    48,
                    64,
                    48,
                    69,
                    83,
                    122,
                    141,
                    168,
                    90,
                    57,
                    69,
                    60,
                    175,
                    82,
                    89,
                    87,
                    124,
                    80,
                    54,
                    73,
                    304,
                    92,
                    20,
                    75,
                    49,
                    61,
                    115,
                    110,
                    70,
                    51,
                    75,
                    56,
                    50,
                    56,
                    56,
                    177,
                    303,
                    108,
                    204,
                    145,
                    61,
                    60,
                    49,
                    79,
                    110,
                    64,
                    77,
                    78,
                    113,
                    55,
                    82,
                    51,
                    67,
                    55,
                    51,
                    48,
                    56,
                    190,
                    49,
                    100,
                    59
                ],
                id: 's4'
            }
        ]
    });

    var histogram = chart.series[0];
    var baseSeries = chart.series[1];

    assert.ok(histogram, 'Histogram series initialised');
    assert.ok(
        histogram.baseSeries === baseSeries,
        'Histogram\'s base series is set correctly'
    );

    assert.deepEqual(
        histogram.xData,
        [22, 32, 42, 52, 62, 72, 82],
        'Bins ranges are calculated correctly'
    );

    assert.deepEqual(
        histogram.yData,
        [2, 4, 4, 6, 2, 1, 1],
        'Bins frequencies are calculated correctly'
    );

    histogram.update({
        binWidth: 5
    });

    assert.deepEqual(
        histogram.xData,
        [22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 87],
        'After updating histogram\'s bin width bin ranges are calculated correctly'
    );

    assert.deepEqual(
        histogram.yData,
        [2, 0, 2, 2, 3, 1, 4, 2, 0, 2, 1, 0, 0, 1],
        'After updating histogram\'s bin width bin frequencies are calculated correctly'
    );

    baseSeries.addPoint(20);
    assert.deepEqual(
        histogram.yData,
        [2, 1, 0, 4, 0, 4, 1, 4, 1, 2, 1, 0, 0, 0, 1],
        'After adding a new point to the base series bin frequencies are calculated correctly'
    );

    chart.get('p1').update({ y: 20 });
    assert.deepEqual(
        histogram.yData,
        [3, 0, 0, 4, 0, 4, 1, 4, 1, 2, 1, 0, 0, 0, 1],
        'After updating a point in the base series bin frequencies are calculated correctly'
    );

    chart.get('p1').remove();
    assert.deepEqual(
        histogram.yData,
        [2, 0, 0, 4, 0, 4, 1, 4, 1, 2, 1, 0, 0, 0, 1],
        'After removing a point in the base series bin frequencies are calculated correctly'
    );

    chart.addSeries({
        type: 'histogram',
        id: 'h-binsNumber-as-function',
        baseSeries: 's2',
        binsNumber: function () {
            return 2;
        }
    });
    assert.ok(
        true,
        'Not crashing when function used for binsNumber (#7457)'
        // when number of bins is correct change this test to check len of yData
    );

    var addedHistogram = chart.addSeries({
        type: 'histogram',
        id: 'h2',
        baseSeries: 's2',
        binWidth: 1
    });

    assert.deepEqual(
        addedHistogram && addedHistogram.yData,
        [4, 4],
        'Added histogram dynamically is calculated correctly'
    );

    var h3 = chart.addSeries({
        type: 'histogram',
        id: 'h3',
        baseSeries: 's3'
    });

    assert.ok(
        h3 &&
            h3.points.length === 1 &&
            h3.points[0].x === Highcharts.correctFloat(0.4131376140169578) &&
            h3.points[0].y === 5,
        'The base series for the histogram has equaled values, #7825'
    );

    var h4 = chart.addSeries({
        type: 'histogram',
        id: 'h4',
        baseSeries: 's4'
    });

    assert.deepEqual(
        h4 &&
            h4.points.map(function (point) {
                return point.x;
            }),
        [
            20,
            65.05,
            110.1,
            155.15,
            200.2,
            245.25,
            290.3,
            335.35,
            380.4,
            425.45,
            470.5,
            515.55,
            560.6,
            605.65,
            650.7,
            695.75,
            740.8,
            785.85,
            830.9,
            875.95
        ],
        'Histogram produces correct bins, #7976'
    );

    assert.deepEqual(
        h4 &&
            h4.points.map(function (point) {
                return point.y;
            }),
        [100, 160, 71, 40, 8, 8, 5, 4, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
        'Histogram does not produce points with NaN y values, #7976'
    );

    chart.addSeries({
        id: 'floatData',
        data: [
            33.16760851774859,
            30.021835456328144,
            32.44462948560892,
            32.05988301568796,
            30.867648930865755,
            32.19147683815367,
            32.66328232655957,
            29.711692262612182,
            29.521720801728208,
            30.664639033433204,
            31.968056265142028,
            32.10721235022374,
            29.79755475194929,
            31.406572728550902,
            32.88348881596304,
            31.506079222840953,
            31.506079222840953,
            31.506079222840953,
            33.12216452433281,
            29.990519216283296,
            32.974232283904655,
            31.064286659033176,
            31.12067983726177,
            31.392519037070734,
            28.97179396681863,
            28.699234545713068,
            31.44281128068294,
            28.81435219638538,
            33.01179075584821,
            31.28194091945461,
            31.606757143282852,
            29.819697680843685,
            29.819697680843685,
            30.53378932780897,
            29.951550386910295,
            31.47763812568406,
            28.392696528424878,
            28.392696528424878,
            28.392696528424878,
            30.53378932780897,
            32.305029082782085,
            32.305029082782085,
            28.095141068806992,
            32.305029082782085
        ]
    });

    var h5 = chart.addSeries({
        baseSeries: 'floatData',
        type: 'histogram'
    });

    assert.deepEqual(
        h5 &&
            h5.points.map(function (point) {
                return point.y;
            }),
        [6, 2, 7, 4, 11, 7, 7],
        'Histogram does not produce points with NaN y values, when baseSeries data has float values'
    );

    baseSeries.remove();
    assert.ok(
        chart.series.indexOf(histogram) !== -1,
        'Histogram is not removed after the base series is removed'
    );

    histogram.remove();
    assert.ok(
        chart.series.indexOf(histogram) === -1,
        'Histogram is removed after histogram.remove()'
    );

    chart.update(
        {
            series: [
                {
                    id: 's1',
                    data: [1, 1.2, 1.4, 1.6, 1.8]
                },
                {
                    id: 's2',
                    data: [2, 2.3, 2.6, 2.9, 3.2]
                },
                {
                    baseSeries: 's1',
                    id: 'histo-s1',
                    type: 'histogram'
                },
                {
                    baseSeries: 's2',
                    id: 'histo-s2',
                    type: 'histogram'
                }
            ]
        },
        true,
        true
    );

    assert.strictEqual(
        // Rounding is applied in order to crisp column edges
        Math.round(chart.get('histo-s2').barW),
        Math.round(chart.get('histo-s2').closestPointRangePx),
        'Histogram has appropriate pointRange value, when multiple series on the same axis, #9128, #10025'
    );

    chart.update(
        {
            series: [
                {
                    id: 'baseSeries',
                    data: [132.8, 137, 139, 142, 145, 148, 151, 151.4]
                },
                {
                    baseSeries: 'baseSeries',
                    id: 'histo-pisto',
                    type: 'histogram',
                    binsNumber: 7
                }
            ]
        },
        true,
        true
    );

    assert.strictEqual(
        chart.get('histo-pisto').data.length,
        chart.get('histo-pisto').options.binsNumber,
        'Histogram produces correct number of bins set by user.'
    );

    chart.update(
        {
            series: [
                {
                    name: 'Data',
                    type: 'scatter',
                    data: [
                        -12,
                        -21,
                        -27,
                        -10,
                        -10,
                        -50,
                        -17,
                        -36,
                        -34,
                        -55,
                        -38,
                        -39,
                        -37,
                        -43,
                        -50,
                        -29,
                        -67,
                        -59,
                        -68,
                        -63,
                        -53,
                        -46,
                        -70,
                        -57,
                        -56,
                        -41,
                        -76,
                        -104
                    ],
                    id: 's1'
                },
                {
                    type: 'histogram',
                    baseSeries: 's1',
                    id: 'histo-s1',
                    zIndex: -1,
                    binsNumber: void 0
                }
            ]
        },
        true,
        true
    );

    assert.strictEqual(
        chart.get('histo-s1').data.length,
        chart.get('histo-s1').binsNumber(),
        'Histogram produces correctnumber of bins on negative point values.'
    );
});

QUnit.test('#12077 - Histogram long digits.', function (assert) {
    var chart = Highcharts.chart('container', {
        xAxis: [
            {},
            {
                opposite: true
            }
        ],
        yAxis: [
            {},
            {
                opposite: true
            }
        ],
        series: [
            {
                type: 'histogram',
                xAxis: 1,
                yAxis: 1,
                baseSeries: 's1'
            },
            {
                type: 'scatter',
                data: Array.from(
                    {
                        length: 10000
                    },
                    () => 6.6429209090989899214
                ),
                id: 's1'
            }
        ]
    });

    assert.ok(
        chart.series[0].data.length,
        'Histogram should be draw when long digits.'
    );
});

QUnit.test('#14289: Infinite loop', assert => {
    [
        [0.508304338907063],
        [0.50830433890706, 0.508304338907063],
        [0.508304338907063, 0.50830433890706]
    ].forEach(data =>
        Highcharts.chart('container', {
            series: [
                {
                    type: 'histogram',
                    baseSeries: 's1'
                },
                {
                    type: 'scatter',
                    data: data.map(value => ({
                        y: value
                    })),
                    id: 's1'
                }
            ]
        })
    );

    assert.ok(true, 'Histogram should not enter infinite loop');
});

QUnit.test('#14425: Last bin x2 inaccuracy', assert => {
    const chart = Highcharts.chart('container', {
        xAxis: [{}, {}],
        yAxis: [{}, {}],
        series: [
            {
                type: 'histogram',
                xAxis: 1,
                yAxis: 1,
                baseSeries: 's1'
            },
            {
                type: 'scatter',
                data: [
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    20,
                    21,
                    21,
                    21,
                    21
                ],
                id: 's1'
            }
        ]
    });

    const points = chart.series[0].points;
    assert.strictEqual(
        points[points.length - 1].x2,
        21,
        'Last bin x2 should equal data max'
    );
});
