const btn = document.getElementById('play-pause-button'),
    input = document.getElementById('play-range'),
    startYear = 1973,
    endYear = 2023;

// General helper functions
const arrToAssociative = arr => {
    const tmp = {};
    arr.forEach(item => {
        tmp[item[0]] = item[1];
    });

    return tmp;
};

function getSubtitle() {
    return `<span style='font-size: 60px'>${input.value}</span>`;
}

const formatRevenue = [];

const chart = Highcharts.chart('container', {
    chart: {
        events: {
            // Some annotation labels need to be rotated to make room
            load: function () {
                const labels = this.annotations[0].labels;
                labels
                    .find(a => a.options.id === 'vinyl-label')
                    .graphic.attr({
                        rotation: -20
                    });
                labels
                    .find(a => a.options.id === 'cassettes-label')
                    .graphic.attr({
                        rotation: 20
                    });
            }
        },
        type: 'area',
        marginTop: 100,
        animation: {
            duration: 700,
            easing: t => t
        }
    },
    title: {
        text: 'Music revenue race chart'
    },
    subtitle: {
        text: getSubtitle(),
        floating: true,
        align: 'right',
        verticalAlign: 'middle',
        x: -100,
        y: -110
    },
    data: {
        csv: document.getElementById('csv').innerHTML,
        itemDelimiter: ';',
        complete: function (options) {
            for (let i = 0; i < options.series.length; i++) {
                formatRevenue[i] = arrToAssociative(options.series[i].data);
                options.series[i].data = null;
            }
        }
    },
    xAxis: {
        allowDecimals: false,
        min: startYear,
        max: endYear
    },
    yAxis: {
        reversedStacks: false,
        title: {
            text: 'Revenue in the U.S.'
        },
        labels: {
            format: '${text} B'
        }
    },
    tooltip: {
        split: true,
        headerFormat: '<span style="font-size: 1.2em">{point.x}</span>',
        pointFormat:
            '{series.name}: <b>${point.y:,.1f} B</b> ({point.percentage:.1f}%)',
        crosshairs: true
    },
    plotOptions: {
        area: {
            stacking: 'normal',
            pointStart: startYear,
            marker: {
                enabled: false
            }
        }
    },
    annotations: [
        {
            labelOptions: {
                borderWidth: 0,
                backgroundColor: undefined,
                verticalAlign: 'middle',
                allowOverlap: true,
                style: {
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 500ms'
                }
            },
            labels: [
                {
                    text: 'Vinyl',
                    verticalAlign: 'top',
                    point: {
                        x: 1975,
                        xAxis: 0,
                        y: 1.45,
                        yAxis: 0
                    },
                    style: {
                        fontSize: '0.8em',
                        color: '#000'
                    },
                    id: 'vinyl-label'
                },
                {
                    text: 'LP-EP',
                    point: {
                        x: 1980,
                        xAxis: 0,
                        y: 0.2,
                        yAxis: 0
                    },
                    style: {
                        fontSize: '1.4em',
                        color: '#ffffff'
                    },
                    id: 'lpep-label'
                },
                {
                    text: 'Cass',
                    point: {
                        x: 1987,
                        xAxis: 0,
                        y: 2.6,
                        yAxis: 0
                    },
                    style: {
                        fontSize: '1.5em',
                        color: '#ffffff'
                    },
                    id: 'cassettes-label'
                },
                {
                    text: 'CD',
                    point: {
                        x: 1999,
                        xAxis: 0,
                        y: 6,
                        yAxis: 0
                    },
                    style: {
                        fontSize: '4em',
                        color: '#ffffff'
                    },
                    id: 'cd-label'
                },
                {
                    text: 'DL',
                    point: {
                        x: 2011,
                        xAxis: 0,
                        y: 4,
                        yAxis: 0
                    },
                    style: {
                        fontSize: '1.2em',
                        color: '#ffffff'
                    },
                    id: 'dl-label'
                },
                {
                    text: 'Strm',
                    point: {
                        x: 2018,
                        xAxis: 0,
                        y: 5,
                        yAxis: 0
                    },
                    style: {
                        fontSize: '1.5em',
                        color: '#ffffff'
                    },
                    id: 'streams-label'
                }
            ]
        }
    ],

    responsive: {
        rules: [
            {
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    title: {
                        align: 'left'
                    },
                    subtitle: {
                        y: -150,
                        x: -20
                    },
                    yAxis: {
                        labels: {
                            align: 'left',
                            x: 0,
                            y: -3
                        },
                        tickLength: 0,
                        title: {
                            align: 'high',
                            reserveSpace: false,
                            rotation: 0,
                            textAlign: 'left',
                            y: -20
                        }
                    }
                }
            }
        ]
    }
});

function pause(button) {
    button.title = 'play';
    button.className = 'fa fa-play';
    clearTimeout(chart.sequenceTimer);
    chart.sequenceTimer = undefined;
}

function update() {
    chart.update(
        {
            subtitle: {
                text: getSubtitle()
            }
        },
        false,
        false,
        false
    );

    const series = chart.series,
        labels = chart.annotations[0].labels,
        yearIndex = input.value - startYear,
        dataLength = series[0].options.data.length;

    // If slider moved back in time
    if (yearIndex < dataLength - 1) {
        for (let i = 0; i < series.length; i++) {
            const seriesData = series[i].yData.slice(0, yearIndex);
            series[i].setData(seriesData, false);
        }
    }

    // If slider moved forward in time
    if (yearIndex > dataLength - 1) {
        const remainingYears = yearIndex - dataLength;
        for (let i = 0; i < series.length; i++) {
            for (let j = input.value - remainingYears; j < input.value; j++) {
                series[i].addPoint([formatRevenue[i][j]], false);
            }
        }
    }

    // Add current year
    for (let i = 0; i < series.length; i++) {
        const newY = formatRevenue[i][input.value];
        series[i].addPoint([newY], false);
    }

    labels.forEach(label => {
        label
            .graphic
            .css({
                opacity: input.value >= label.options.point.x | 0
            });
    });

    chart.redraw();

    input.value = parseInt(input.value, 10) + 1;

    if (input.value > endYear) {
        // Auto-pause
        pause(btn);
    }
}

function play(button) {
    // Reset slider at the end
    if (input.value > endYear) {
        input.value = startYear;
    }
    button.title = 'pause';
    button.className = 'fa fa-pause';
    chart.sequenceTimer = setInterval(function () {
        update();
    }, 700);
}

btn.addEventListener('click', function () {
    if (chart.sequenceTimer) {
        pause(this);
    } else {
        play(this);
    }
});

play(btn);

// Trigger the update on the range bar click.
input.addEventListener('input', update);
