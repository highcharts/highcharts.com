Math.easeInSine = function (pos) {
    return -Math.cos(pos * (Math.PI / 2)) + 1;
};

Math.easeOutQuint = function (pos) {
    return (Math.pow((pos - 1), 5) + 1);
};
// Math.easeInQuint = function (pos) {
//     return Math.pow(pos, 5);
// },

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

const big = window.matchMedia('(min-width: 500px)').matches;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const imgPath = 'https://www.highcharts.com/samples/graphics/';

Highcharts.theme = {
    colors: [
        '#8087E8', '#A3EDBA', '#F19E53', '#6699A1',
        '#E1D369', '#87B4E7', '#DA6D85', '#BBBAC5'
    ],
    chart: {
        style: {
            fontFamily: 'IBM Plex Sans, sans-serif'
        }
    },
    title: {
        style: {
            fontSize: '22px',
            fontWeight: '500',
            color: '#2F2B38'
        }
    },
    subtitle: {
        style: {
            fontSize: '16px',
            fontWeight: '400',
            color: '#2F2B38'
        }
    },
    tooltip: {
        borderWidth: 0,
        backgroundColor: '#46465C',
        style: {
            color: '#f0f0f0'
        },
        shadow: true
    },
    legend: {
        backgroundColor: '#f0f0f0',
        borderColor: '#BBBAC5',
        borderWidth: 1,
        borderRadius: 2,
        itemStyle: {
            fontWeight: '400',
            fontSize: '12px',
            color: '#2F2B38'
        },
        itemHoverStyle: {
            fontWeight: '700',
            color: '#46465C'
        }
    },
    plotOptions: {
        series: {
            borderWidth: 1,
            borderColor: '#BBBAC5',
            dataLabels: {
                color: '#46465C',
                style: {
                    fontSize: '13px'
                }
            },
            marker: {
                lineColor: '#46465C'
            }
        }
    }
};

Highcharts.setOptions(Highcharts.theme);

const support = {
    chart: {
        // width: 500,
        animation: {
            enabled: true,
            duration: 5000,
            easing: 'easeOutQuint'
        },
        styledMode: true,
        margin: 0,
        spacing: 0,
        events: {
            load: function () {
                const head = document.querySelector('.head');
                const face = document.querySelector('.highcharts-markers.face');
                const p1 = document.querySelector('.particle-1');
                const p3 = document.querySelector('.particle-3');
                const p5 = document.querySelector('.particle-5');
                const p6 = document.querySelector('.particle-6');

                setTimeout(function () {
                    if (big) {
                        head.style.transform = 'rotate(15deg) ';
                        face.style.transform = 'rotate(15deg)';
                        p1.style.transform = 'translate(0px,0px) ' +
                            'rotate(360deg)';
                        p6.style.transform = 'translate(20px,4px) ' +
                            'rotate(-45deg)';
                        p5.style.transform = 'translate(0px,0px) rotate(0deg)';
                        p3.style.transform = 'translate(0px,0px) rotate(8deg)';

                    } else {

                        head.style.transform = 'rotate(15deg)';
                        face.style.transform = 'rotate(15deg) scale(.5)';
                        p1.style.transform = 'translate(-30px,10px) ' +
                            'rotate(360deg) scale(.5)';
                        p6.style.transform = 'translate(20px,15px) ' +
                            'rotate(-45deg) scale(.5)';
                        p5.style.transform = 'translate(-65px,0px) ' +
                            'rotate(0deg) scale(.5)';
                        p3.style.transform = 'translate(65px,0px) ' +
                            'rotate(8deg) scale(.5)';
                    }
                }, 1000);

                setTimeout(function () {

                    head.style.transform = 'rotate(-5deg)';
                    head.style.transition = 'all 2s';

                    face.style.transform = 'rotate(-5deg)';
                    face.style.transition = 'all 2s';

                    if (!big) {
                        head.style.transform = 'rotate(-5deg)';
                        face.style.transform = 'rotate(-5deg) scale(.5)';
                    }

                }, 3000);

                if (!reduced) {

                    setTimeout(function () {

                        head.style.transition = 'all 3s';
                        face.style.transition = 'all 3s';

                        if (big) {

                            head.style.transform = 'rotate(360deg)';
                            face.style.transform = 'rotate(360deg)';
                            p1.style.transform = 'translate(-20px,4px) ' +
                                'rotate(320deg)';
                            p6.style.transform = 'translate(40px,4px) ' +
                                'rotate(0deg)';
                            p5.style.transform = 'translate(0px,0px) ' +
                                'rotate(-30deg)';
                            p3.style.transform = 'translate(0px,0px) ' +
                                'rotate(50deg)';

                        } else {

                            head.style.transform = 'rotate(360deg)';
                            face.style.transform = 'rotate(360deg) scale(.5)';
                            p1.style.transform = 'translate(-20px,32px) ' +
                                'rotate(320deg) scale(.5)';
                            p6.style.transform = 'translate(20px,26px) ' +
                                'rotate(0deg) scale(.5)';
                            p5.style.transform = 'translate(-55px,30px) ' +
                                'rotate(-30deg) scale(.5)';
                            p3.style.transform = 'translate(55px,20px) ' +
                                'rotate(50deg) scale(.5)';

                        }
                    }, 5000);
                }


            }
        }
    },
    accessibility: {
        enabled: false
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
            borderWidth: 0,
            animation: false,
            opacity: 0,
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
            },
            lineColor: 'transparent',
            dragDrop: {
                draggableX: true,
                draggableY: true,
                dragMaxX: 20,
                dragMinX: 0,
                dragMaxY: 18,
                dragMinY: 0
            }
        },
        pie: {
            animation: false
        },
        line: {
            animation: false

        },
        scatter: {
            opacity: 1

        }

    },
    series: [
        // 0 - bottom line
        {
            type: 'line',
            className: 'green',
            data: [
                { x: 0, y: -1 },
                { x: 20, y: -1 }
            ],
            zIndex: 21

        },
        // 1 - line
        {
            type: 'line',
            lineWidth: 1,
            className: 'green',
            data: [
                { x: 0, y: 0 },
                { x: 20, y: 0 }
            ],
            zIndex: 21
        },
        // 2 - line
        {
            type: 'line',
            lineWidth: 1,
            className: 'green',
            data: [
                { x: 0, y: 1 },
                { x: 20, y: 1 }
            ],
            zIndex: 21
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
            zIndex: 21

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
            zIndex: 21

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
            zIndex: 11
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
            zIndex: 11

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
            zIndex: 11
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
            zIndex: 11
        },

        // 9 - line
        {
            type: 'line',
            className: 'green',
            lineWidth: 1,
            data: [
                { x: 0, y: 8 },
                { x: 20, y: 8 }
            ],
            zIndex: 11
        },

        // 10 area - mid-ground
        {
            type: 'arearange',
            name: 'midground',
            className: 'midground',
            animation: false,
            data: [{ x: 0, low: -2, high: 4 }, { x: 20, low: -2, high: 4 }],
            zIndex: 20,
            visible: true
        },
        // 11 - pie head bg
        {
            type: 'pie',
            name: 'headbg',
            className: 'headbg',
            visible: true,
            animation: false,
            borderWidth: 0,
            data: [
                {
                    y: 100
                }
            ],
            startAngle: 0,
            zIndex: 15,
            size: '70.5%',
            center: ['50%', '50%']
        },
        // 12 - pie head
        {
            type: 'pie',
            name: 'head',
            className: 'head',
            visible: true,
            borderColor: 'transparent',
            animation: false,
            slicedOffset: 30,
            data: [
                {
                    y: 25,
                    sliced: true,
                    selected: true
                },
                {
                    sliced: true,
                    selected: true,
                    y: 25
                },
                {
                    y: 25,
                    sliced: true,
                    selected: true
                },
                {
                    y: 25,
                    sliced: true,
                    selected: true
                }
            ],
            startAngle: 0,
            zIndex: 16,
            size: '70%',
            center: ['50%', '50%']
        },
        // 13 - pie face
        {
            type: 'scatter',
            name: 'face',
            className: 'face',
            animation: false,
            data: [{ x: 10, y: 8 }],
            marker: {
                enabled: true,
                symbol: 'url(' + imgPath + 'face.svg)',
                width: 75
            },
            zIndex: 17,
            visible: true
        },
        // 14 area - foreground-water
        {
            type: 'arearange',
            name: 'foreground',
            className: 'foreground',
            animation: false,
            data: [{ x: 0, low: 4, high: 9 }, { x: 20, low: 4, high: 9 }],
            zIndex: 10,
            visible: true
        },
        // 15 particles
        {
            type: 'scatter',
            name: 'particles',
            animation: false,
            className: 'particles',
            data: [
                {
                    x: 16.44,
                    y: 8.58,
                    className: 'particle-3',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p3.svg)',
                        width: 23,
                        height: 34
                    }
                },

                {
                    x: 2.18,
                    y: 8,
                    className: 'particle-5',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p5.svg)',
                        width: 35,
                        height: 50
                    }
                }
            ],
            zIndex: 19,
            visible: true
        },
        // 16 - particles
        {
            type: 'scatter',
            name: 'particles',
            animation: false,
            className: 'particles',
            data: [

                {
                    x: 9,
                    y: 4,
                    className: 'particle-6',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p6.svg)',
                        width: 45,
                        height: 45
                    }
                },

                {
                    x: 5.86,
                    y: 5.4,
                    className: 'particle-1',
                    marker: {
                        enabled: true,
                        symbol: 'url(' + imgPath + 'p1.svg)',
                        width: 40,
                        height: 52
                    }
                }
            ],
            zIndex: 40,
            visible: true
        }


    ]
};

Highcharts.chart('support', support);