Highcharts.chart('container', {

    title: {
        text: 'Rect annotation defined with one and two points'
    },

    series: [{
        keys: ['y', 'id'],
        data: [
            [29.9, '0'],
            [71.5, '1'],
            [106.4, '2'],
            [129.2, '3'],
            [144.0, '4'],
            [176.0, '5']
        ],
        type: 'column'
    }],

    tooltip: {
        enabled: false
    },

    annotations: [{
        shapes: [{
            type: 'rect',
            points: [{
                x: 0,
                y: 0,
                xAxis: 0,
                yAxis: 0
            }, {
                x: 4,
                y: 100,
                xAxis: 0,
                yAxis: 0
            }],
            stroke: '#00ff00',
            stokeWidth: 2
        }, {
            type: 'rect',
            point: '2',
            stroke: '#ffff00',
            stokeWidth: 2,
            width: 10,
            height: 10,
            x: -5,
            y: -5
        }]
    }]
});
