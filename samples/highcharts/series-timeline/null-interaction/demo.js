Highcharts.chart('container', {
    series: [{
        type: 'timeline',
        nullInteraction: true,
        data: [
            1,
            null,
            2
        ]
    }]
});
