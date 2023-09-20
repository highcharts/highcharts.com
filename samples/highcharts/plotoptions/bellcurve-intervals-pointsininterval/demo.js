const data = [3.5, 3, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4, 3, 3, 4,
    4.4, 3.9, 3.5, 3.8, 3.8, 3.4, 3.7, 3.6, 3.3, 3.4, 3, 3.4, 3.5, 3.4, 3.2,
    3.1, 3.4, 4.1, 4.2, 3.1, 3.2, 3.5, 3.6, 3, 3.4, 3.5, 2.3, 3.2, 3.5, 3.8, 3,
    3.8, 3.2, 3.7, 3.3, 3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2, 3,
    2.2, 2.9, 2.9, 3.1, 3, 2.7, 2.2, 2.5, 3.2, 2.8, 2.5, 2.8, 2.9, 3, 2.8, 3,
    2.9, 2.6, 2.4, 2.4, 2.7, 2.7, 3, 3.4, 3.1, 2.3, 3, 2.5, 2.6, 3, 2.6, 2.3,
    2.7, 3, 2.9, 2.9, 2.5, 2.8, 3.3, 2.7, 3, 2.9, 3, 3, 2.5, 2.9, 2.5, 3.6,
    3.2, 2.7, 3, 2.5, 2.8, 3.2, 3, 3.8, 2.6, 2.2, 3.2, 2.8, 2.8, 2.7, 3.3, 3.2,
    2.8, 3, 2.8, 3, 2.8, 3.8, 2.8, 2.8, 2.6, 3, 3.4, 3.1, 3, 3.1, 3.1, 3.1, 2.7,
    3.2, 3.3, 3, 2.5, 3, 3.4, 3
];

const pointsInInterval = 5;

Highcharts.chart('container', {
    chart: {
        margin: [50, 0, 50, 50],
        events: {
            load: function () {
                this.series[0].data.forEach(function (point, i) {
                    const labels = ['4σ', '3σ', '2σ', 'σ', 'μ', 'σ', '2σ', '3σ', '4σ'];
                    if (i % pointsInInterval === 0) {
                        point.update({
                            color: 'black',
                            dataLabels: {
                                enabled: true,
                                format: labels[
                                    Math.floor(i / pointsInInterval)],
                                overflow: 'none',
                                crop: false,
                                y: -2,
                                style: {
                                    fontSize: '13px'
                                }
                            }
                        });
                    }
                });
            }
        }
    },

    title: {
        text: null
    },

    legend: {
        enabled: false
    },

    xAxis: [{
        title: {
            text: 'Data'
        },
        visible: false
    }, {
        title: {
            text: 'Bell curve'
        },
        opposite: true,
        visible: false
    }],

    yAxis: [{
        title: {
            text: 'Data'
        },
        visible: false
    }, {
        title: {
            text: 'Bell curve'
        },
        opposite: true,
        visible: false
    }],

    series: [{
        name: 'Bell curve',
        type: 'bellcurve',
        xAxis: 1,
        yAxis: 1,
        pointsInInterval: pointsInInterval,
        intervals: 4,
        baseSeries: 1,
        zIndex: -1,
        marker: {
            enabled: true
        }
    }, {
        name: 'Data',
        type: 'scatter',
        data: data,
        visible: false,
        marker: {
            radius: 1.5
        }
    }]
});
