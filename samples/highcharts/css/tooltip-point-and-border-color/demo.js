Highcharts.chart('container', {
    chart: {
        styledMode: true
    },
    title: {
        text: 'Tooltip styled by custom CSS'
    },
    yAxis: {
        title: {
            text: null
        }
    },
    series: [{
        type: 'line',
        //name: 'Apples',
        //className: 'apples',
        data: [
            0,
            -1,
            3,
            1,
            0]
    }, {
        type: 'line',
        name: 'Oranges',
        className: 'oranges',
        data: [
            1,
            3,
            {
                className: 'blood-orange',
                y: 4
            },
            6,
            7]
    }]
});