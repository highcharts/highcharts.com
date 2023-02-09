/**
 * This is an advanced demo of setting up Highcharts with the flags feature borrowed from Highcharts Stock.
 * It also shows custom graphics drawn in the chart area on chart load.
 */

/**
 * Fires on chart load, called from the chart.events.load option.
 */

function onChartLoad() {
    var centerX = 120,
        centerY = 200,
        path = [],
        angle,
        radius,
        badgeColor = Highcharts.color(Highcharts.getOptions().colors[0])
            .brighten(-0.2)
            .get(),
        spike,
        empImage,
        big5,
        littleYears,
        label,
        left,
        right,
        years,
        renderer;

    if (this.chartWidth < 530) {
        return;
    }

    // Draw the spiked disc
    // for (angle = 0; angle < 2 * Math.PI; angle += Math.PI / 24) {
    //     radius = spike ? 70 : 60;
    //     path.push(
    //         'L',
    //         centerX + radius * Math.cos(angle),
    //         centerY + radius * Math.sin(angle)
    //     );
    //     spike = !spike;
    // }
    // path[0] = 'M';
    // path.push('z');
    // this.renderer.path(path)
    //     .attr({
    //         fill: badgeColor,
    //         zIndex: 6
    //     })
    //     .add();

    // Employee image overlay
    empImage = this.renderer
        .path(path)
        .attr({
            zIndex: 7,
            opacity: 0,
            stroke: badgeColor,
            'stroke-width': 1
        })
        .add();

    // Big 5
    // big5 = this.renderer.text('5')
    //     .attr({
    //         zIndex: 6
    //     })
    //     .css({
    //         color: 'white',
    //         fontSize: '60px',
    //         fontStyle: 'none',
    //         fontWeight: 'bold',
    //         fontFamily: '\'Arial\', sans-serif'
    //     })
    //     .add();
    // big5.attr({
    //     x: centerX - big5.getBBox().width / 2,
    //     y: centerY - 5
    // });

    // little year
    // littleYears = this.renderer.text('years')
    //     .attr({
    //         zIndex: 6
    //     })
    //     .css({
    //         color: 'white',
    //         fontSize: '22px',
    //         fontStyle: 'none',
    //         fontWeight: 'normal',
    //         fontFamily: '\'Brush Script MT\', sans-serif'
    //     })
    //     .add();
    // littleYears.attr({
    //     x: centerX - littleYears.getBBox().width / 2,
    //     y: centerY + 10
    // });

    // Draw the label
    // label = this.renderer.text('Highcharts')
    //     .attr({
    //         zIndex: 6
    //     })
    //     .css({
    //         color: '#FFFFFF'
    //     })
    //     .add();

    // left = centerX - label.getBBox().width / 2;
    // right = centerX + label.getBBox().width / 2;

    // label.attr({
    //     x: left,
    //     y: centerY + 28
    // });

    // The band
    // left = centerX - 90;
    // right = centerX + 90;
    // this.renderer
    //     .path([
    //         'M', left, centerY + 30,
    //         'L', right, centerY + 30,
    //         right, centerY + 50,
    //         left, centerY + 50,
    //         'z',
    //         'M', left, centerY + 40,
    //         'L', left - 20, centerY + 40,
    //         left - 10, centerY + 50,
    //         left - 20, centerY + 60,
    //         left + 10, centerY + 60,
    //         left, centerY + 50,
    //         left + 10, centerY + 60,
    //         left + 10, centerY + 50,
    //         left, centerY + 50,
    //         'z',
    //         'M', right, centerY + 40,
    //         'L', right + 20, centerY + 40,
    //         right + 10, centerY + 50,
    //         right + 20, centerY + 60,
    //         right - 10, centerY + 60,
    //         right, centerY + 50,
    //         right - 10, centerY + 60,
    //         right - 10, centerY + 50,
    //         right, centerY + 50,
    //         'z'
    //     ])
    //     .attr({
    //         fill: badgeColor,
    //         stroke: '#FFFFFF',
    //         'stroke-width': 1,
    //         zIndex: 5
    //     })
    //     .add();

    // 2009-2014
    // years = this.renderer.text('2009-2014')
    //     .attr({
    //         zIndex: 6
    //     })
    //     .css({
    //         color: '#FFFFFF',
    //         fontStyle: 'italic',
    //         fontSize: '10px'
    //     })
    //     .add();
    // years.attr({
    //     x: centerX - years.getBBox().width / 2,
    //     y: centerY + 42
    // });

    // Prepare mouseover
    renderer = this.renderer;
    if (renderer.defs) {
        // is SVG
        this.get('employees').points.forEach(point => {
            let pattern;
            if (point.image) {
                pattern = renderer
                    .createElement('pattern')
                    .attr({
                        id: 'pattern-' + point.image,
                        patternUnits: 'userSpaceOnUse',
                        width: 400,
                        height: 400
                    })
                    .add(renderer.defs);
                renderer
                    .image(
                        'https://www.highcharts.com/images/employees2014/' +
                            point.image +
                            '.jpg',
                        centerX - 80,
                        centerY - 80,
                        160,
                        213
                    )
                    .add(pattern);

                Highcharts.addEvent(point, 'mouseOver', function () {
                    empImage
                        .attr({
                            fill: 'url(#pattern-' + point.image + ')'
                        })
                        .animate({ opacity: 1 }, { duration: 500 });
                });
                Highcharts.addEvent(point, 'mouseOut', function () {
                    empImage.animate({ opacity: 0 }, { duration: 500 });
                });
            }
        });
    }
}

// Get the turnover. Read the table from the HTML, sort by the joined/left
// events and keep track of the number of employees.
function getTurnover() {
    let employees = 0;
    return [].reduce
        .call(
            document.getElementById('turnover').querySelectorAll('tr'),
            (turnover, tr) => {
                const dateJoined = Date.parse(tr.children[1].textContent);
                if (!isNaN(dateJoined)) {
                    turnover.push({
                        x: dateJoined,
                        name: `${tr.children[0].textContent} joined`,
                        accumulate: 1,
                        image: tr.children[3].textContent || null
                    });
                }

                const dateLeft = Date.parse(tr.children[2].textContent);
                if (!isNaN(dateLeft)) {
                    turnover.push({
                        x: dateLeft,
                        name: `${tr.children[0].textContent} left`,
                        accumulate: -1,
                        image: tr.children[3].textContent || null
                    });
                }

                return turnover;
            },
            []
        )
        .sort((a, b) => a.x - b.x)
        .map(event =>
            Object.assign(event, {
                y: (employees += event.accumulate)
            })
        );
}

const moreEmployees = [
    {
        x: Date.UTC(2019, 8, 30),
        y: 31,
        name: '2 Employees left',
        accumulate: -2,
        image: null
    },
    {
        x: Date.UTC(2020, 0, 11),
        y: 29,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2020, 1, 21),
        y: 28,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2020, 5, 11),
        y: 27,
        name: '1 Employees left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2020, 6, 31),
        y: 26,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2020, 8, 21),
        y: 28,
        name: '2 Employees joined',
        accumulate: 2,
        image: null
    },
    {
        x: Date.UTC(2020, 9, 31),
        y: 29,
        name: '1 Employees joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2020, 10, 11),
        y: 30,
        name: '1 Employees joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2021, 0, 1),
        y: 34,
        name: '4 Employees joined',
        accumulate: 4,
        image: null
    },
    {
        x: Date.UTC(2021, 1, 11),
        y: 35,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2021, 2, 30),
        y: 34,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2021, 4, 30),
        y: 35,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2021, 5, 3),
        y: 37,
        name: '2 Employees joined',
        accumulate: -2,
        image: null
    },
    {
        x: Date.UTC(2021, 6, 30),
        y: 36,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2021, 7, 10),
        y: 39,
        name: '3 Employees joined',
        accumulate: 3,
        image: null
    },
    {
        x: Date.UTC(2021, 8, 30),
        y: 38,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2021, 9, 13),
        y: 39,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2022, 0, 30),
        y: 31,
        name: '8 Employees left',
        accumulate: -8,
        image: null
    },
    {
        x: Date.UTC(2022, 1, 10),
        y: 32,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2022, 2, 30),
        y: 33,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2022, 3, 3),
        y: 34,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2022, 5, 30),
        y: 35,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2022, 6, 10),
        y: 34,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2022, 8, 30),
        y: 33,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2022, 9, 3),
        y: 32,
        name: '1 Employee left',
        accumulate: -1,
        image: null
    },
    {
        x: Date.UTC(2022, 10, 30),
        y: 33,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    },
    {
        x: Date.UTC(2022, 11, 10),
        y: 34,
        name: '1 Employee joined',
        accumulate: 1,
        image: null
    }
];

const imgPath =
    'https://cdn.rawgit.com/highcharts/highcharts/0b81a74ecd2fbd2e9b24489bf476f8baecc218e1/samples/graphics/homepage/';

const options = {
    chart: {
        events: {
            load: onChartLoad
        },
        scrollablePlotArea: {
            minWidth: 700,
            scrollPositionX: 0
        }
    },
    colors: ['#46465c', '#6699a1', '#5749ad'],
    xAxis: {
        type: 'datetime',
        minTickInterval: 365 * 24 * 36e5,
        labels: {
            align: 'left'
        },
        plotBands: [
            {
                from: Date.UTC(2009, 10, 27),
                to: Date.UTC(2010, 11, 1),
                className: 'time-1',
                label: {
                    text: '<em>Offices:</em><br> Torstein\'s basement',
                    style: {
                        color: '#46465c'
                    },
                    y: 30
                }
            },
            {
                from: Date.UTC(2010, 11, 1),
                to: Date.UTC(2013, 9, 1),
                className: 'time-2',
                label: {
                    text: '<em>Offices:</em><br> Tomtebu',
                    style: {
                        color: '#46465c'
                    },
                    y: 30
                }
            },
            {
                from: Date.UTC(2013, 9, 1),
                to: Date.UTC(2022, 11, 31),
                className: 'time-3',
                label: {
                    text: '<em>Offices:</em><br> VikØrsta',
                    style: {
                        color: '#46465c'
                    },
                    y: 30
                }
            }
        ]
    },
    title: {
        text: 'Highcharts and Highsoft timeline'
    },
    caption: {
        text: 'An advanced demo showing a combination of various Highcharts features, including flags and plot bands. The chart shows how Highcharts and Highsoft has evolved over time, with number of employees, revenue, search popularity, office locations, and various events of interest.'
    },
    credits: {
        enabled: false
    },
    tooltip: {
        style: {
            width: '250px',
            color: '#f0f0f0'
        }
    },
    yAxis: [
        {
            max: 100,
            labels: {
                enabled: false
            },
            title: {
                text: ''
            },
            gridLineColor: 'rgba(0, 0, 0, 0.07)'
        },
        {
            allowDecimals: false,
            labels: {
                style: {
                    color: Highcharts.getOptions().colors[2]
                }
            },
            title: {
                text: 'Employees',
                style: {
                    color: Highcharts.getOptions().colors[2]
                }
            },
            opposite: true,
            gridLineWidth: 0
        }
    ],
    plotOptions: {
        series: {
            marker: {
                enabled: false,
                symbol: 'circle',
                radius: 2
            },
            fillOpacity: 0.2
        },
        flags: {
            tooltip: {
                xDateFormat: '%B %e, %Y'
            },
            lineWidth: 2,
            allowOverlapX: true,
            accessibility: {
                point: {
                    valueDescriptionFormat:
                        '{xDescription}. {point.title}: {point.text}.'
                }
            }
        }
    },
    annotations: [
        {
            draggable: '',
            onSeries: 'revenue',
            labels: [
                {
                    point: {
                        x: Date.UTC(2012, 10, 1),
                        y: 30,
                        xAxis: 0,
                        yAxis: 0
                    },
                    text: 'Award',
                    x: -10
                },
                {
                    point: {
                        x: Date.UTC(2012, 11, 25),
                        y: 40,
                        xAxis: 0,
                        yAxis: 0
                    },
                    text: 'First Book',
                    x: -10
                },
                {
                    point: {
                        x: Date.UTC(2013, 4, 25),
                        y: 50,
                        xAxis: 0,
                        yAxis: 0
                    },
                    text: 'Award',
                    x: -10
                },
                {
                    point: {
                        x: Date.UTC(2014, 4, 25),
                        y: 55,
                        xAxis: 0,
                        yAxis: 0
                    },
                    text: 'Award',
                    x: -10
                },
                {
                    point: {
                        x: Date.UTC(2018, 11, 13),
                        y: 90,
                        xAxis: 0,
                        yAxis: 0
                    },
                    text: 'Award',
                    x: -10
                },
                {
                    point: {
                        x: Date.UTC(2017, 9, 20),
                        y: 80,
                        xAxis: 0,
                        yAxis: 0
                    },
                    text: 'Award',
                    x: -10
                }
            ],
            labelOptions: {
                verticalAlign: 'top',
                y: 15,
                color: 'white',
                backgroundColor: 'rgb(87, 73, 173)',
                borderColor: 'rgb(87, 73, 173)',
                style: {
                    color: 'white'
                }
            }
        }
    ],
    series: [
        {
            name: 'Revenue',
            id: 'revenue',
            type: 'areaspline',
            data: [
                [1259622000000, 20],
                [1262300400000, 18],
                [1264978800000, 15],
                [1267398000000, 19],
                [1270072800000, 16],
                [1272664800000, 16],
                [1275343200000, 18],
                [1277935200000, 16],
                [1280613600000, 17],
                [1283292000000, 20],
                [1285884000000, 24],
                [1288566000000, 19],
                [1291158000000, 22],
                [1293836400000, 20],
                [1296514800000, 17],
                [1298934000000, 21],
                [1301608800000, 17],
                [1304200800000, 17],
                [1306879200000, 20],
                [1309471200000, 18],
                [1312149600000, 19],
                [1314828000000, 22],
                [1317420000000, 26],
                [1320102000000, 21],
                [1322694000000, 24],
                [1325372400000, 23],
                [1328050800000, 19],
                [1330556400000, 23],
                [1333231200000, 19],
                [1335823200000, 19],
                [1338501600000, 22],
                [1341093600000, 19],
                [1343772000000, 21],
                [1346450400000, 24],
                [1349042400000, 29],
                [1351724400000, 24],
                [1354316400000, 27],
                [1356994800000, 25],
                [1359673200000, 23],
                [1362092400000, 22],
                [1364767200000, 28],
                [1367359200000, 29],
                [1370037600000, 30],
                [1372629600000, 33],
                [1375308000000, 36],
                [1377986400000, 34],
                [1380578400000, 37],
                [1383260400000, 36],
                [1385852400000, 33],
                [1388530800000, 31],
                [1391209200000, 35],
                [1393628400000, 29],
                [1396303200000, 38],
                [1398895200000, 31],
                [1401573600000, 38],
                [1404165600000, 33],
                [1406844000000, 35],
                [1409522400000, 35],
                [1412114400000, 48],
                [1414796400000, 54],
                [1417388400000, 46],
                [1420066800000, 65],
                [1422745200000, 48],
                [1425164400000, 47],
                [1427839200000, 70],
                [1430431200000, 53],
                [1433109600000, 43],
                [1435701600000, 60],
                [1438380000000, 58],
                [1441058400000, 53],
                [1443650400000, 67],
                [1446332400000, 81],
                [1448924400000, 63],
                [1451602800000, 65],
                [1454281200000, 56],
                [1456786800000, 58],
                [1459461600000, 71],
                [1462053600000, 57],
                [1464732000000, 59],
                [1467324000000, 59],
                [1470002400000, 60],
                [1472680800000, 72],
                [1475272800000, 63],
                [1477954800000, 69],
                [1480546800000, 70],
                [1483225200000, 68],
                [1485903600000, 43],
                [1488322800000, 51],
                [1490997600000, 70],
                [1493589600000, 56],
                [1496268000000, 53],
                [1498860000000, 65],
                [1501538400000, 48],
                [1504216800000, 80],
                [1506808800000, 44],
                [1509490800000, 70],
                [1512082800000, 62],
                [1514761200000, 72],
                [1517439600000, 56],
                [1519858800000, 46],
                [1522533600000, 77],
                [1525125600000, 61],
                [1527804000000, 72],
                [1530396000000, 65],
                [1533074400000, 48],
                [1535752800000, 51],
                [1538344800000, 59],
                [1541026800000, 71],
                [1543618800000, 77],
                [1546297200000, 64],
                [1548975600000, 67],
                [1551394800000, 62],
                [1554069600000, 78],
                [1556661600000, 63],
                [1559340000000, 82],
                [1561932000000, 62],
                [1564610400000, 77],
                [1567288800000, 67],
                [1569880800000, 56],
                [1572480000000, 78],
                [1575072000000, 72],
                [1577750400000, 68],
                [1580428800000, 69],
                [1582848000000, 65],
                [1585612800000, 59],
                [1588204800000, 84],
                [1590883200000, 68],
                [1593475200000, 58],
                [1596153600000, 72],
                [1598832000000, 55],
                [1601424000000, 72],
                [1604102400000, 77],
                [1606694400000, 55],
                [1609372800000, 60],
                [1612051200000, 63],
                [1614470400000, 55],
                [1617148800000, 76],
                [1619740800000, 53],
                [1622419200000, 71],
                [1625011200000, 62],
                [1627689600000, 72],
                [1630368000000, 56],
                [1632960000000, 66],
                [1635638400000, 72],
                [1638230400000, 61],
                [1640908800000, 60],
                [1643587200000, 100],
                [1646006400000, 64],
                [1648684800000, 91],
                [1651276800000, 47],
                [1653955200000, 66],
                [1656547200000, 79],
                [1659225600000, 70],
                [1661904000000, 61],
                [1664496000000, 55],
                [1667174400000, 73],
                [1669766400000, 74],
                [1672444800000, null]
            ],
            tooltip: {
                xDateFormat: '%B %Y',
                valueSuffix: ' % of best month'
            }
        },
        {
            yAxis: 1,
            name: 'Highsoft employees',
            id: 'employees',
            type: 'area',
            step: 'left',
            tooltip: {
                headerFormat:
                    '<span style="font-size: 11px;color:#666">{point.x:%B %e, %Y}</span><br>',
                pointFormat: '{point.name}<br><b>{point.y}</b>',
                valueSuffix: ' employees'
            },
            data: getTurnover().concat(moreEmployees)
        }
    ]
};

// Add flags for important milestones. This requires Highcharts Stock.
if (Highcharts.Series.types.flags) {
    options.series.push(
        {
            type: 'flags',
            name: 'Highmaps',
            className: 'maps',
            fillColor: '#2a2a2a',
            lineColor: '#2a2a2a',
            shape: 'squarepin',
            y: -80,
            data: [
                {
                    x: Date.UTC(2014, 5, 13),
                    text: 'Highmaps version 1.0 released',
                    title: 'Maps'
                }
            ],
            showInLegend: false
        },
        {
            type: 'flags',
            name: 'Highstock',
            className: 'stock',
            fillColor: '#2a2a2a',
            lineColor: '#2a2a2a',
            shape: 'squarepin',
            y: -66,
            data: [
                {
                    x: Date.UTC(2011, 9, 18),
                    text: 'Highcharts Stock version 1.0 released',
                    title: 'Stock'
                }
            ],
            showInLegend: false
        },
        {
            type: 'flags',
            name: 'Cloud',
            fillColor: '#46465c',
            lineColor: '#46465c',
            shape: 'squarepin',
            className: 'cloud',
            y: -55,
            data: [
                {
                    x: Date.UTC(2014, 4, 1),
                    text: 'Highcharts Cloud Beta',
                    title: 'Cloud'
                },
                {
                    x: Date.UTC(2017, 10, 24),
                    text: 'Highcharts Cloud v2',
                    title: 'Cloud v2'
                },
                {
                    x: Date.UTC(2018, 11, 6),
                    text: 'Highcharts Cloud v2',
                    title: 'Cloud v3'
                }
            ],
            showInLegend: false
        },

        {
            type: 'flags',
            name: 'Highcharts',
            className: 'product',
            fillColor: '#7a7a92',
            lineColor: '#7a7a92',
            shape: 'squarepin',
            y: -30,
            data: [
                {
                    x: Date.UTC(2009, 10, 27),
                    text: 'Highcharts version 1.0 released',
                    title: '1.0'
                },
                {
                    x: Date.UTC(2010, 6, 13),
                    text: 'Ported from canvas to SVG rendering',
                    title: '2.0'
                },
                {
                    x: Date.UTC(2010, 10, 23),
                    text: 'Dynamically resize and scale to text labels',
                    title: '2.1'
                },
                {
                    x: Date.UTC(2012, 7, 24),
                    text: 'Gauges, polar charts and range series',
                    title: '2.3'
                },
                {
                    x: Date.UTC(2013, 2, 22),
                    text: 'Multitouch support, more series types',
                    title: '3.0'
                },
                {
                    x: Date.UTC(2014, 3, 22),
                    text: '3D charts, heatmaps',
                    title: '4.0'
                },
                {
                    x: Date.UTC(2016, 8, 29),
                    text: 'Styled mode, responsive options, accessibility, chart.update',
                    title: '5.0'
                },
                {
                    x: Date.UTC(2017, 9, 4),
                    text: 'Annotations, Boost, Series labels, new series types',
                    title: '6.0'
                },
                {
                    x: Date.UTC(2018, 11, 11),
                    text: 'Sonification, TypeScript (beta), new series types',
                    title: '7.0'
                },
                {
                    x: Date.UTC(2019, 11, 10),
                    text: 'Accessibility, data sorting, marker clusters',
                    title: '8.0'
                },
                {
                    x: Date.UTC(2021, 1, 2),
                    text: 'Improved security, accessibility options, zoom by single touch',
                    title: '9.0'
                },
                {
                    x: Date.UTC(2022, 2, 7),
                    text: 'Bread crumbs, improved Boost pixel ratio, threshold alignment in charts with multiple axes',
                    title: '10.0'
                }
            ],
            showInLegend: false
        }
        /*

        {
            type: 'flags',
            name: 'Events',
            className: 'award',
            shape: 'url(' + imgPath + 'award.png)',
            data: [
                {
                    x: Date.UTC(2012, 10, 1),
                    text: 'Highsoft won "Entrepeneur of the Year" in Sogn og Fjordane, Norway',
                    title: 'Award'
                },
                {
                    x: Date.UTC(2012, 11, 25),
                    text: 'Packt Publishing published <em>Learning Highcharts by Example</em>. Since then, many other books are written about Highcharts.',
                    title: 'First book'
                },
                {
                    x: Date.UTC(2013, 4, 25),
                    text: "Highsoft nominated Norway's Startup of the Year",
                    title: 'Award'
                },
                {
                    x: Date.UTC(2014, 4, 25),
                    text: 'Highsoft nominated Best Startup in Nordic Startup Awards',
                    title: 'Award'
                },

                {
                    x: Date.UTC(2017, 9, 20),
                    text: 'Torstein awarded EY Entrepeneur of the Year, Vestlandet',
                    title: 'Award'
                },
                {
                    x: Date.UTC(2018, 11, 13),
                    text: 'Grethe awarded NCE Ambassador',
                    title: 'Award'
                }
            ],

            onSeries: 'revenue',
            showInLegend: false
        }
        */
    );
}
Highcharts.chart('container', options);
