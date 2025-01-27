Highcharts.stockChart('container', {
    series: [{
        data: [
            [0, 1],
            [2, 4],
            [2, 3],
            [4, 5]
        ],
        type: 'bubble',
        pointIntervalUnit: 'year'
    }],
    accessibility: {
        enabled: true
    },
    exporting: {
        enabled: true
    }
});
