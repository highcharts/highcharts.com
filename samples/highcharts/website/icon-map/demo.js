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


const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let mapLoaded = false;
let pointRadius = 37;
let pointCenterRadius = 14;


const imgPath = 'https://www.highcharts.com/samples/graphics/homepage/';
const maps = {
    chart: {
        animation: {
            enabled: true,
            duration: 3000,
            easing: 'easeOutQuint'
        },
        accessibility: {
            enabled: false
        },
        styledMode:
        true,
        margin: 0,
        spacing: 0,
        plotBackgroundImage: 'bg.png',
        events: {
            load: function () {
                const chart = this;

                const mapPointPoint = document.querySelector(
                    '.map-point-point'
                );
                const mapPointTop = document.getElementsByClassName(
                    'map-point-top'
                )[1];
                const mapPointCenter = document.getElementsByClassName(
                    'map-point-center'
                )[1];
                const mapPointSeries = chart.series[14];
                const mapPointCenterSeries = chart.series[15];
                // const mapPointPointerSeries = chart.series[16];
                const leftSide =  document.querySelector('.left');
                const rightSide =  document.querySelector('.right');
                const top =  document.querySelector('.top');
                const bottom =  document.querySelector('.bottom');
                const background = document.getElementsByClassName(
                    'highcharts-plot-background'
                )[0];

                // if(chart.chartWidth >= 775) {
                //     pointRadius = 58;
                //     pointCenterRadius = 22;
                // }

                pointRadius = parseFloat(chart.chartWidth * 0.072);
                pointCenterRadius = parseFloat(chart.chartWidth * 0.03);

                mapPointSeries.update({
                    marker: {
                        enabled: true,
                        symbol: 'circle',
                        radius: pointRadius
                    }
                }, false);

                mapPointCenterSeries.update({
                    marker: {
                        enabled: true,
                        symbol: 'circle',
                        radius: pointCenterRadius
                    }
                }, false);

                chart.redraw();

                const finalHide = function () {
                    [].forEach.call(
                        document.getElementsByClassName('particle'),
                        p => p.classList.add('fade')
                    );
                    [].forEach.call(
                        document.getElementsByClassName('green'),
                        g => g.classList.add('fade')
                    );

                    leftSide.classList.add('fade');
                    rightSide.classList.add('fade');
                    bottom.classList.add('fade');
                    top.classList.add('fade');
                    leftSide.style.transition = 'all 1s';
                    rightSide.style.transition = 'all 1s';
                    mapPointPoint.classList.add('hide');
                    mapPointTop.classList.add('hide');
                    mapPointCenter.classList.add('hide');
                    background.style.fill = '#1f1836';
                };


                const updateData = function () {
                    chart.series[10].update({
                        data: [
                            { x: 4, y: 2 },
                            { x: 6, y: 7 },
                            { x: 10, y: 5 }
                        ]
                    });
                    chart.series[11].update({
                        data: [
                            { x: 4, y: 2 },
                            { x: 6, y: 7 },
                            { x: 10, y: 5 }
                        ]
                    });
                    chart.series[12].update({
                        data: [
                            { x: 4, y: 2 },
                            { x: 10, y: 5 },
                            { x: 16, y: 2 }
                        ]
                    });
                    chart.series[13].update({
                        data: [
                            { x: 6, y: 9 },
                            { x: 10, y: 11 },
                            { x: 14, y: 9 }
                        ]
                    });

                };

                const growEnvelope = function () {

                    leftSide.style.transition = 'none';
                    rightSide.style.transition = 'none';

                    chart.series[10].data[2].update({
                        x: 10, y: 5
                    });
                    chart.series[10].data[1].update({
                        x: 6
                    });
                    chart.series[11].data[2].update({
                        x: 10, y: 5
                    });
                    chart.series[11].data[1].update({
                        x: 6
                    });
                    chart.series[12].data[1].update({
                        x: 10, y: 5
                    });
                    chart.series[13].data[1].update({
                        x: 10, y: 11
                    });
                };

                // /if reduced motion, show the envelope right away
                if (reduced) {
                    updateData();
                }

                setTimeout(function () {
                    // /if not reduced motion, build the envelope
                    if (!reduced) {
                        growEnvelope();
                    }
                    // /grow the map marker
                    // mapPointPoint.classList.add('grow');
                    // mapPointTop.classList.add('grow');
                    // mapPointCenter.classList.add('grow');
                }, 1000);

                setTimeout(function () {
                    // animation is done
                    // hide everything
                    finalHide();
                }, 4000);

            }
        }
    },
    credits: {
        enabled: false
    },

    title: {
        text: ''
    },
    xAxis: [
        // 0 - bottom, top map area
        {
            min: 0,
            max: 20,
            gridLineColor: 'transparent',
            tickInterval: 1
        },
        // 1 - left map area
        {
            min: 0,
            max: 20,
            gridLineColor: 'transparent',
            tickInterval: 1
        },
        // /2 - right map area
        {
            min: 0,
            max: 20,
            gridLineColor: 'transparent',
            tickInterval: 1,
            reversed: true
        },

        // /3 - for particle group 2
        {
            min: 0,
            max: 20,
            gridLineColor: 'transparent',
            tickInterval: 1
        }],
    yAxis: [
        // 0
        {
            min: -2,
            max: 18,
            gridZIndex: 20,
            gridLineColor: 'transparent',
            tickInterval: 1,
            startOnTick: false,
            endOnTick: false
        },
        // /1 - for the top map area
        {
            min: -2,
            max: 18,
            gridZIndex: 20,
            gridLineColor: 'transparent',
            tickInterval: 1,
            startOnTick: false,
            endOnTick: false,
            reversed: true
        }],
    legend: {
        enabled: false
    },
    tooltip: {
        enabled: false
    },
    plotOptions: {
        series: {
            allowOverlap: true,
            opacity: 1,
            enableMouseTracking: false,
            dataLabels: {
                enabled: false
            },
            marker: {
                enabled: false,
                allowOverlap: true
            },
            states: {
                hover: {
                    enabled: false
                },
                inactive: {
                    enabled: false
                }
            }
        },
        pie: {
            animation: false
        },
        line: {
            animation: false
        }

    },
    series: [
        // 0 - bottom line
        {
            type: 'line',
            className: 'transparent',
            data: [
                { x: 0, y: -1 },
                { x: 20, y: -1 }
            ],
            zIndex: 10

        },
        // 1 - line
        {
            type: 'line',
            lineWidth: 1,
            className: 'transparent',
            data: [
                { x: 0, y: 0 },
                { x: 20, y: 0 }
            ],
            zIndex: 10
        },
        // 2 - line
        {
            type: 'line',
            lineWidth: 1,
            className: 'transparent',
            data: [
                { x: 0, y: 1 },
                { x: 20, y: 1 }
            ],
            zIndex: 10
        },
        // 3 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 2 },
                { x: 20, y: 2 }
            ],
            zIndex: 10

        },
        // 4 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 3 },
                { x: 20, y: 3 }
            ],
            zIndex: 10

        },
        // 5 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 4 },
                { x: 20, y: 4 }
            ],
            zIndex: 10
        },
        // 6 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 5 },
                { x: 20, y: 5 }
            ],
            zIndex: 10

        },
        // 7 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 6 },
                { x: 20, y: 6 }
            ],
            zIndex: 10
        },
        // 8 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 7 },
                { x: 20, y: 7 }
            ],
            zIndex: 10
        },
        // 9 area - foreground-water
        {
            type: 'arearange',
            name: 'foreground',
            className: 'foreground',
            animation: false,
            data: [{ x: 0, low: -2, high: 8 }, { x: 20, low: -2, high: 8 }],
            zIndex: 4,
            visible: true
        },
        // 10 - left map
        {
            type: 'area',
            name: 'left',
            animation: false,
            className: 'left',
            data: [
                { x: 4, y: 2 },
                { x: 4, y: 7 },
                { x: 4, y: 2 }

            ],
            xAxis: 1,
            zoneAxis: 'y',
            zones: [{
                value: 2,
                color: 'transparent'
            }],
            zIndex: 15,
            visible: true
        },
        // 11 - right map
        {
            type: 'area',
            name: 'right',
            animation: false,
            className: 'right',
            xAxis: 2,
            data: [
                { x: 4, y: 2 },
                { x: 4, y: 7 },
                { x: 4, y: 2 }

            ],
            zoneAxis: 'y',
            zones: [{
                value: 2,
                color: 'transparent'
            }],
            zIndex: 15,
            visible: true
        },
        // 12 - bottom map
        {
            type: 'area',
            name: 'bottom',
            animation: false,
            className: 'bottom',
            data: [
                { x: 4, y: 2 },
                { x: 10, y: 2 },
                { x: 16, y: 2 }

            ],
            zoneAxis: 'y',
            zones: [{
                value: 2,
                color: 'transparent'
            }],
            zIndex: 15,
            visible: true
        },
        // 13 - top map
        {
            type: 'area',
            name: 'top',
            animation: false,
            className: 'top',

            data: [
                { x: 6, y: 9 },
                { x: 10, y: 9 },
                { x: 14, y: 9 }

            ],
            yAxis: 1,
            zoneAxis: 'y',
            zones: [{
                value: 9,
                color: 'transparent'
            }],
            zIndex: 15,
            visible: true
        },

        // 14 - map point top
        {
            type: 'scatter',
            name: 'map point top',
            animation: false,
            className: 'map-point-top',
            data: [
                {
                    x: 10,
                    y: 8.4
                }
            ],
            zIndex: 15,
            xAxis: 1,
            visible: true
        },
        // 15 - map center
        {
            type: 'scatter',
            name: 'map point center',
            animation: false,
            className: 'map-point-center',
            data: [
                {
                    x: 10,
                    y: 8.44
                }
            ],
            zIndex: 19,
            xAxis: 1,
            visible: true
        },
        // 16 - map point point
        {
            type: 'area',
            name: 'map point',
            animation: false,
            className: 'map-point-point',
            data: [
                { x: 8.84, y: 8.48 },
                { x: 10, y: 10 },
                { x: 11.16, y: 8.52 }

            ],
            zoneAxis: 'y',
            zones: [{
                value: 7,
                color: 'transparent'
            }],
            zIndex: 18,
            marker: {
                enabled: false
            },
            yAxis: 1,
            visible: true
        },
        // 17 - particles
        {
            type: 'scatter',
            name: 'particles',
            animation: false,
            className: 'particle',
            data: [
                {
                    x: 6.5,
                    y: 12.7,
                    className: 'particle-1',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p1.svg)',
                        width: 25,
                        height: 35

                    }
                },
                {
                    x: 4.5,
                    y: 8.2,
                    className: 'particle-2',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p2.svg)',
                        width: 30,
                        height: 45

                    }
                },
                {
                    x: 3,
                    y: 1.5,
                    className: 'particle-6',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p6.svg)',
                        width: 45,
                        height: 45

                    }
                },
                {
                    x: 16.8,
                    y: 1.5,
                    className: 'particle-5',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p5.svg)',
                        width: 35,
                        height: 50

                    }
                }
            ],
            zIndex: 30,
            xAxis: 2,
            visible: true
        }
    ]
};

const finalMap = function () {
    (async () => {

        // Load the dataset
        const data = await fetch(
            'https://www.highcharts.com/samples/data/world-population-density.json'
        ).then(response => response.json());

        // Assign id's
        data.forEach(function (p) {
            p.id = p.code;
        });

        // Initialize the chart
        Highcharts.mapChart('maps', {
            chart: {
                styledMode: true,
                animation: {

                    duration: 1000

                },
                events: {
                    load: function () {
                        const mapSeries = document.querySelector(
                            '.highcharts-map-series'
                        );
                        const title = document.querySelector(
                            '.highcharts-title'
                        );
                        const subtitle = document.querySelector(
                            '.highcharts-subtitle'
                        );
                        mapSeries.style.opacity = 0;
                        setTimeout(function () {
                            mapSeries.style.opacity = 0;
                            title.classList.add('fade-in');
                            subtitle.classList.add('fade-in');
                        }, 200);

                        setTimeout(function () {
                            mapSeries.classList.add('fade-in');
                        }, 500);


                        setTimeout(function () {
                            mapLoaded  = true;
                        }, 2000);
                    },
                    redraw: function () {
                        const mapSeries = document.querySelector(
                            '.highcharts-map-series'
                        );
                        if (mapLoaded) {
                            mapSeries.classList.add('show');
                        }
                    }
                }
            },
            credits: {
                enabled: false
            },
            title: {
                text: 'World Population Density',
                style: {
                    fontFamily: 'IBM Plex Sans',
                    color: '#fff'
                }
            },
            exporting: {
                enabled: false
            },
            legend: {
                title: {
                    text: 'Population density per km²'
                },
                labelStyle: {
                    color: '#fff'

                },
                floating: true,
                y: 20
            },
            colorAxis: {
                min: 1,
                max: 1000,
                type: 'logarithmic',
                maxColor: '#4455f2'
            },
            mapNavigation: {
                enabled: true,
                buttonOptions: {
                    verticalAlign: 'bottom',
                    x: 5
                }
            },
            // mapView: {
            //     center: [4100, 8280], // In terms of pre-projected units
            //     zoom: 0.1
            // },
            tooltip: {
                useHTML: true,
                distance: -15,
                formatter: function () {
                    const htmlString =
                        `<div class="tip-grid">
                        <div class="tip-content">
                            <div class="dot"></div>${this.point.name}
                        </div>
                        <i class="fas fa-caret-down tip-point"></i>
                        </div>
                        `;
                    return htmlString;
                },
                valueSuffix: '/km²'
            },
            series: [{
                data: data,
                mapData: Highcharts.maps['custom/world-highres'],
                joinBy: ['iso-a2', 'code'],
                name: 'Population density',
                allowPointSelect: true,
                cursor: 'pointer',
                events: {
                    click: function (e) {
                        e.point.zoomTo();
                    }
                }

            }],
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 400
                    },
                    chartOptions: {
                        subtitle: {
                            text: ''
                        },
                        chart: {
                            margin: [40, 1, 65, 0]
                        }
                    }
                },
                {
                    condition: {
                        minWidth: 401
                    },
                    chartOptions: {
                        subtitle: {
                            text: 'Click a country to zoom to it.'
                        },
                        chart: {
                            margin: [60, 1, 65, 0]
                        }

                    }
                }]
            }
        });
    })();
};

document.addEventListener('DOMContentLoaded', function () {
    Highcharts.mapChart('maps', maps);
    let dtime = 5000;

    if (reduced) {
        dtime = 5500;
    }
    setTimeout(function () {
        finalMap();
    }, dtime);

});