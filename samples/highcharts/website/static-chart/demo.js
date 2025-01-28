Math.easeInSine = function (pos) {
    return -Math.cos(pos * (Math.PI / 2)) + 1;
};

Math.easeOutQuint = function (pos) {
    return (Math.pow((pos - 1), 5) + 1);
};

Math.easeOutBounce = pos => {
    if ((pos) < (1 / 2.75)) {
        return (7.5625 * pos * pos);
    }
    if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
    }
    if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
    }
    return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
};

const countOffset = 2;
const  icebergLabels = [
    180, 160, 140, 120, 100, 80, 60, 40, 20,
    10, 0, 20, 40, 60, 80, 100, 120, 140, 160, 180
];

const iceberg = {
    chart: {
        animation: {
            enabled: true,
            duration: 3000,
            easing: 'easeOutQuint'
        },
        styledMode: true,
        margin: 0,
        spacing: 0,
        events: {
            load: function () {
                const chart = this;
                const cover = document.getElementsByClassName('cover')[0];
                const background = document.getElementsByClassName(
                    'highcharts-background'
                )[0];
                const plotBackground = document.getElementsByClassName(
                    'highcharts-plot-background'
                )[0];
                const title = document.getElementsByClassName(
                    'highcharts-title'
                )[0];

                console.log(chart.chartWidth);


                cover.style.fill =  '#30426B';
                background.style.fill = '#f0f0f0';
                plotBackground.style.transition = 'none';
                plotBackground.style.fill = '#f0f0f0';
                title.style.opacity = 1;

                // turn on tooltip
                chart.update({
                    tooltip: {
                        enabled: true
                    }
                });

                for (let hh = 2; hh <= 11; ++hh) {
                    if (hh % 2 === 0) {
                        chart.series[hh].update({
                            visible: true
                        });
                    }
                }

                [].forEach.call(
                    document.querySelectorAll('#charts .iceberg-types'),
                    function (elem) {
                        elem.style.color = '#000';
                    }
                );

                // /style the labels
                [].forEach.call(
                    document.querySelectorAll('#charts .berg-label'),
                    function (elem) {
                        elem.style.opacity = 1;
                    }
                );

                // /attach individual 'berg' classes to each berg
                [].forEach.call(
                    document.querySelectorAll('.berg-depth'),
                    function (b, i) {
                        b.classList.add('berg-depth-' + i + '');
                    }
                );

                // /icebergs' opacity
                [].forEach.call(
                    document.querySelectorAll('#charts .berg-depth'),
                    function (elem) {
                        elem.style.opacity = 1;
                        elem.style.visibility = 'visible';
                    }
                );

                [].forEach.call(
                    document.querySelectorAll('#charts .highcharts-grid-line'),
                    function (elem) {
                        elem.style.opacity = 0;
                    }
                );

                // /for use in redraw function
                // done = true;

            },
            redraw: function () {
                [].forEach.call(
                    document.querySelectorAll('.berg-depth'),
                    function (b, i) {
                        b.classList.add('berg-depth-' + i + '');
                    }
                );

            }
        }
    },
    credits: {
        enabled: false
    },
    lang: {
        accessibility: {
            chartContainerLabel: '',
            screenReaderSection: {
                beforeRegionLabel: '',
                endOfChartMarker: ''
            }
        }
    },
    accessibility: {
        screenReaderSection: {
            beforeChartFormat: '<h1>{chartTitle}</h1><p>Interactive chart ' +
                'displaying 5 different styles of icebergs, their ' +
                'approximate size, and how frequently they occur in Iceberg ' +
                'Alley.</p><p>The visualization has shapes of icebergs laid ' +
                'out next to each other on the X-axis, with the Y-axis ' +
                'showing size in meters, both above and below water.</p>'
        },
        landmarkVerbosity: 'disabled',
        series: {
            descriptionFormat: '{authorDescription}'
        },
        keyboardNavigation: {
            focusBorder: {
                enabled: false
            }
        }
    },
    title: {
        text: 'Distribution of Icebergs in Iceberg Alley ' +
            '<p style="text-align:center;margin:0px;font-weight:300;' +
            'font-size:0.8em">Newfoundland, Canada</p>',
        useHTML: true,
        y: 30

    },
    subtitle: {
        text: '<p class="iceberg-subtitle"></p>',
        useHTML: true
    },
    xAxis: [
        // 0 -
        {
            min: 0,
            max: 20,
            tickInterval: 1,
            visible: false,
            accessibility: {
                enabled: true,
                description: 'values from 0 to 20'
            }
        },
        // 1 -
        {
            min: 0,
            max: 20,
            tickInterval: 1,
            reversed: true,
            visible: false,
            accessibility: {
                enabled: false
            }
        },
        // /2 - for particle group 1
        {
            min: 0,
            max: 20,
            tickInterval: 1,
            visible: false,
            accessibility: {
                enabled: false
            }
        },
        // /3 - for particle group 2
        {
            min: 0,
            max: 20,
            tickInterval: 1,
            visible: false,
            accessibility: {
                enabled: false
            }
        }],
    yAxis: [
        {
            min: -2,
            max: 18,
            gridZIndex: 20,
            gridLineWidth: 0,
            title: {
                text: '',
                offset: -10,
                rotation: 0,
                y: -240
            },
            tickPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            zIndex: 1,
            offset: -15,
            opposite: true,
            tickInterval: 1,
            startOnTick: false,
            endOnTick: false,
            labels: {
                useHTML: true,
                align: 'right',
                formatter: function () {
                    const labelPos = this.pos;
                    const index = labelPos + countOffset;
                    const label = icebergLabels[index];
                    let color = '#fff';
                    if (labelPos > 8) {
                        color = '#000';
                    }
                    return `
                <p style="color:${color};white-space:nowrap;">${label} m</p>
              `;
                }
            },
            visible: true
        },
        {
            min: -2,
            max: 18,
            gridZIndex: 20,
            tickPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            gridLineColor: 'transparent',
            gridLineWidth: 0,
            tickInterval: 1,
            startOnTick: false,
            endOnTick: false,
            reversed: true
        }],
    legend: {
        enabled: false
    },
    tooltip: {
        enabled: false,
        hideDelay: 0,
        shared: true,
        useHTML: true,
        headerFormat: '',
        positioner: function () {
            // return { x: 130, y: 365 };
            return { x: 53, y: 1170 };
        }
    },
    plotOptions: {
        series: {
            borderWidth: 0,
            opacity: 1,
            dataLabels: {
                enabled: false,
                allowOverlap: true
            },
            marker: {
                enabled: false
            },
            states: {
                hover: {
                    enabled: false
                },
                inactive: {
                    enabled: false
                }
            },
            accessibility: {
                exposeAsGroupOnly: true,
                enabled: false
            }
        },
        pie: {
            animation: false
        },
        line: {
            animation: false,
            marker: {
                enabled: false,
                symbol: 'circle'

            },
            tooltip: {
                pointFormatter: function () {
                    return '';
                }
            }
        },
        arearange: {
            tooltip: {
                pointFormatter: function () {
                    return '';
                }
            }
        },
        scatter: {
            marker: {
                enabled: false
            },
            animation: false
        }
    },
    series: [

        // 0 - bottom area water
        {
            type: 'arearange',
            name: 'bottom',
            tooltip: {
                pointFormatter: function () {
                    return '';
                }
            },
            animation: false,
            className: 'cover',
            data: [
                { x: 0, low: -2, high: 8 },
                { x: 4, low: -2, high: 8 },
                { x: 20, low: -2, high: 8 }
            ],
            zIndex: 22,
            visible: true

        },
        // 1 iceberg types
        {
            type: 'scatter',
            className: 'iceberg-typesX',
            xAxis: 2,
            marker: {
                enabled: false,
                radius: 1
            },
            data: [
                {
                    x: 1,
                    y: 6
                },
                {
                    x: 5,
                    y: 12

                },
                {
                    x: 9.5,
                    y: 13

                },
                {
                    x: 13,
                    y: 13

                },
                {
                    x: 16,
                    y: 13

                }
            ],
            zIndex: 150,
            visible: false
        },
        // /2 berg 1 bottom
        {
            type: 'line',
            name: 'Pinnacle Icebergs',
            className: 'berg-depth',
            tooltip: {
                pointFormatter: function () {
                    return `<p class="berg-tip" aria-hidden="true">
                    <span>
                    Pinnacle icebergs</span> - a
                    large central spire or pyramid.</p>`;
                }
            },
            xAxis: 2,
            zIndex: 50,
            visible: true,
            marker: {
                enabled: false
            },
            accessibility: {
                enabled: true,
                description: 'Pinnacle icebergs have a large central spire ' +
                    'or pyramid and comprise 33% of icebergs found in ' +
                    'Iceberg Alley. They are the tallest style of iceberg, ' +
                    'reaching over 120m above and below water.'
            },
            data: [
                {
                    x: 0.24,
                    y: 8
                },
                {
                    x: 2.44,
                    y: 0.64,
                    accessibility: { enabled: false }
                },
                {
                    x: 2.45,
                    y: 8,
                    accessibility: { enabled: false }
                }
            ]
        },
        // /3 berg 1 top
        {
            type: 'line',
            name: 'Pinnacle Icebergs',
            className: 'berg-depth',
            yAxis: 1,
            xAxis: 2,
            zIndex: 50,
            visible: true,
            marker: {
                enabled: false
            },
            data: [
                {
                    x: 0.24,
                    y: 8
                },
                {
                    x: 2.44,
                    y: 0.64,
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        x: 40,
                        y: 50,
                        formatter: function () {
                            const htmlString =
                                `<div class="berg-label">
                                    <p class="label-title"
                                    style="font-weight:700;">Pinnacle</p>
                                    <p  class="label-percent">33%</p>
                                </div>`;
                            return htmlString;
                        }
                    }
                },
                {
                    x: 2.45,
                    y: 8
                }
            ]
        },
        // 4 berg-2 bottom
        {
            type: 'line',
            accessibility: {
                enabled: true,
                description: 'Tabular icebergs are horizontal and ' +
                    'flat-topped and comprise 23% of icebergs found in ' +
                    'Iceberg Alley. They are medium sized, and often reach ' +
                    '60m above and below water.'
            },
            name: 'Tabular Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            visible: false,
            marker: {
                enabled: false
            },
            tooltip: {
                pointFormatter: function () {
                    return `<p class="berg-tip" aria-hidden="true">
                            <span>Tabular icebergs</span> -
                            horizontal and flat-topped.</p>`;

                }
            },
            data: [
                {
                    x: 4,
                    y: 8
                },
                {
                    x: 4.3,
                    y: 4.32,
                    accessibility: { enabled: false }
                },
                {
                    x: 6,
                    y: 5.3,
                    accessibility: { enabled: false }
                },
                {
                    x: 6.72,
                    y: 8,
                    accessibility: { enabled: false }
                }
            ]
        },
        // /5 berg-2 top
        {
            type: 'line',
            name: 'Tabular Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            yAxis: 1,
            visible: true,
            marker: {
                enabled: false
            },
            data: [
                {
                    x: 4,
                    y: 8
                },
                {
                    x: 4.3,
                    y: 5.32,
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        x: 35,
                        y: 10,
                        formatter: function () {
                            const htmlString =
                                `<div class="berg-label">
                                    <p class="label-title"
                                    style="font-weight:700;">Tabular</p>
                                    <p  class="label-percent">23%</p>
                                </div>`;
                            return htmlString;
                        }
                    }
                },
                {
                    x: 6,
                    y: 6.3
                },
                {
                    x: 6.72,
                    y: 8
                }
            ]
        },
        // 6 - berg 3 bottom
        {
            type: 'line',
            name: 'Dry Dock Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            visible: false,
            marker: {
                enabled: false
            },
            tooltip: {
                pointFormatter: function () {
                    return `<p class="berg-tip" aria-hidden="true">
                    <span>Dry Dock icebergs</span> - eroded into a
                    U shape.</p>`;
                }
            },
            accessibility: {
                enabled: true,
                description: 'Dry Dock icebergs have eroded into a U shape ' +
                    'and comprise 19% of icebergs found in Iceberg Alley. ' +
                    'They are medium sized, and often reach 60m above and ' +
                    'below water.'
            },
            data: [
                {
                    x: 8.3,
                    y: 8
                },
                {
                    x: 8.4,
                    y: 4.4,
                    accessibility: { enabled: false }
                },
                {
                    x: 9.3,
                    y: 7,
                    accessibility: { enabled: false }
                },
                {
                    x: 10.5,
                    y: 5.8,
                    accessibility: { enabled: false }
                },
                {
                    x: 11.24,
                    y: 8,
                    accessibility: { enabled: false }
                }
            ]
        },
        // 7 - berg 3 top
        {
            type: 'line',
            name: 'Dry Dock Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            yAxis: 1,
            visible: true,
            marker: {
                enabled: false
            },
            data: [
                {
                    x: 8.3,
                    y: 8
                },
                {
                    x: 8.4,
                    y: 5.4,
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        x: 35,
                        y: 5,
                        formatter: function () {
                            const htmlString =
                                `<div class="berg-label">
                                    <p class="label-title"
                                    style="font-weight:700;">Dry Dock</p>
                                    <p  class="label-percent">19%</p>
                                </div>`;
                            return htmlString;
                        }
                    }
                },
                {
                    x: 9.3,
                    y: 7
                },
                {
                    x: 10.5,
                    y: 5.8
                },
                {
                    x: 11.24,
                    y: 8
                }
            ]
        },
        // 8 berg 4 bottom
        {
            type: 'line',
            name: 'Dome Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            visible: false,
            marker: {
                enabled: false
            },
            tooltip: {
                pointFormatter: function () {
                    return `<p class="berg-tip" aria-hidden="true">
                                <span>Dome icebergs</span> - large,
                                smooth, rounded tops.</p>`;
                }
            },
            accessibility: {
                enabled: true,
                description: 'Dome icebergs have smooth, rounded tops and ' +
                    'comprise 15% of icebergs found in Iceberg Alley. They ' +
                    'are medium sized, and often reach 60m above water, and ' +
                    '40m below.'
            },
            data: [{
                x: 12.5,
                y: 8
            },
            {
                x: 13.8,
                y: 5.3,
                accessibility: { enabled: false }
            },
            {
                x: 14,
                y: 5.2,
                accessibility: { enabled: false }
            },
            {
                x: 14.2,
                y: 5.3,
                accessibility: { enabled: false }
            },
            {
                x: 14.8,
                y: 8,
                accessibility: { enabled: false }
            }
            ]
        },
        // 9 berg 4 top
        {
            type: 'line',
            name: 'Dome Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            yAxis: 1,
            visible: true,
            marker: {
                enabled: false
            },
            data: [{
                x: 12.5,
                y: 8
            },
            {
                x: 13.8,
                y: 5.3,
                dataLabels: {
                    enabled: true,
                    useHTML: true,
                    x: 5,
                    y: -5,
                    formatter: function () {
                        const htmlString =
                            `<div class="berg-label">
                                <p class="label-title"
                                style="font-weight:700;">Dome</p>
                                <p  class="label-percent">15%</p>
                            </div>`;
                        return htmlString;
                    }
                }
            },
            {
                x: 14,
                y: 5.2
            },
            {
                x: 14.2,
                y: 5.3
            },
            {
                x: 14.8,
                y: 8
            }
            ]
        },
        { // 10 berg 5 bottom
            type: 'line',
            name: 'Wedge Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            visible: false,
            marker: {
                enabled: false
            },
            tooltip: {
                pointFormatter: function () {
                    return `<p class="berg-tip" aria-hidden="true">
                            <span>Wedge icebergs</span> - tabular
                            icebergs that have
                            tilted.</p>`;

                }
            },
            accessibility: {
                enabled: true,
                description: 'Wedge icebergs are tabular icebergs that have ' +
                    'tilted and comprise 10% of icebergs found in Iceberg ' +
                    'Alley. They are smaller sized than the others, reaching ' +
                    'just a few metres below water, and around 40m above.'
            },
            data: [{
                x: 16.12,
                y: 8
            },
            {
                x: 16.32,
                y: 7.5,
                accessibility: { enabled: false }
            },
            {
                x: 17.27,
                y: 8,
                accessibility: { enabled: false }
            }]
        },
        { // 11 berg 5 top
            type: 'line',
            name: 'Wedge Icebergs',
            className: 'berg-depth',
            zIndex: 50,
            xAxis: 2,
            yAxis: 1,
            visible: true,
            marker: {
                enabled: false
            },
            data: [{
                x: 16.12,
                y: 8
            },
            {
                x: 16.32,
                y: 6.5,
                dataLabels: {
                    enabled: true,
                    useHTML: true,
                    x: 5,
                    y: -5,
                    formatter: function () {
                        const htmlString =
                            `<div class="berg-label">
                                <p class="label-title"
                                style="font-weight:700;">Wedge</p>
                                <p  class="label-percent">10%</p>
                            </div>`;
                        return htmlString;
                    }
                }
            },
            {
                x: 17.27,
                y: 8
            }]
        }
    ],
    responsive: {
        rules: [{
            condition: {
                maxWidth: 250
            },
            chartOptions: {
                tooltip: {
                    positioner: function () {
                        // return { x: 130, y: 365 };
                        return { x: 50, y: 165 };
                    }
                },
                subtitle: {
                    y: 200,
                    x: 0
                }
            }
        },
        {
            condition: {
                minWidth: 251,
                maxWidth: 300 // /up to 300
            },
            chartOptions: {
                tooltip: {
                    positioner: function () {
                        return { x: 50, y: 200 };
                    }
                },
                subtitle: {
                    y: 240,
                    x: 0
                }
            }
        },
        {
            condition: {
                minWidth: 301,
                maxWidth: 499
            },
            chartOptions: {
                tooltip: {
                    positioner: function () {
                        // return { x: 130, y: 365 };
                        return { x: 70, y: 265 };
                    }
                },
                subtitle: {
                    y: 280,
                    x: 20
                }
            }
        },
        {
            condition: {
                minWidth: 500
            },
            chartOptions: {
                tooltip: {
                    positioner: function () {
                        return { x: 105, y: 360 };
                    }
                },
                subtitle: {
                    y: 360,
                    x: 10
                }
            }
        }
        ]
    }
};

Highcharts.chart('charts', iceberg);
