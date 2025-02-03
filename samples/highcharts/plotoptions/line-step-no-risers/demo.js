Highcharts.chart('container', {
    title: {
        text: 'Step line with no risers'
    },
    xAxis: {
        categories: [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]
    },
    series: [{
        data: [5, 6, 7, 8, 6, 10, 11, 10, 13, 2, 4, 3, 2, 5],
        step: {
            type: 'center',
            risers: false
        }
    }]

});