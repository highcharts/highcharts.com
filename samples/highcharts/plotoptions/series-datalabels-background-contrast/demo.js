Highcharts.chart('container', {

    chart: {
        type: 'column'
    },

    title: {
        text: 'Data labels contrast background'
    },

    xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    },

    plotOptions: {
        column: {
            dataLabels: {
                enabled: true,
                backgroundColor: 'contrast',
                inside: true,
                style: {
                    textOutline: 'none'
                }
            },
            stacking: 'normal'
        }
    },

    series: [{
        data: [29.9, 71.5, 106.4, 129.2, 144.0, 178.0]
    }, {
        data: [135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
    }]

});