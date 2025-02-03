Highcharts.chart('container', {
    chart: {
        type: 'arearange'
    },
    title: {
        text: 'Area range chart with step'
    },
    series: [{
        step: {
            type: 'left',
            risers: false
        },
        data: [
            [1, 2],
            [3, 5],
            [2, 3],
            [1, 2],
            [6, 8]
        ],
        fillOpacity: 0.2,
        lineWidth: 3
    }]
});
