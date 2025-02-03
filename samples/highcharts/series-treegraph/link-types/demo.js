Highcharts.chart('container', {
    chart: {
        zooming: {
            type: 'xy'
        },
        panning: {
            enabled: true,
            type: 'xy'
        },
        panKey: 'shift'
    },
    title: {
        text: 'Treegraph: Different type of links'
    },
    series: [
        {
            marker: {
                radius: 30
            },
            link: {
                type: 'straight'
            },
            type: 'treegraph',
            keys: ['id', 'parent', 'link.type'],
            data: [
                ['A'],
                ['B', 'A', 'curved'],
                ['C', 'B', 'default'],
                ['E', 'B'],
                ['D', 'A']
            ],
            dataLabels: {
                format: '{point.id}'
            }
        }
    ]
});
