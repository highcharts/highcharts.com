Highcharts.chart('container', {

    title: {
        text: 'Data labels contrast background'
    },

    plotOptions: {
        series: {
            dataLabels: {
                enabled: true,
                backgroundColor: 'contrast',
                borderRadius: 3,
                distance: '-30%',
                style: {
                    textOutline: 'none'
                }
            }
        }
    },

    series: [{
        type: 'pie',
        data: [
            ['John', 29.9],
            ['Emily', 71.5],
            ['David', 106.4],
            ['Sophia', 129.2],
            ['Michael', 144.0],
            ['Olivia', 178.0],
            ['Benjamin', 135.6]
        ]
    }]

});