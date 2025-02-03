Highcharts.chart('container', {
    tooltip: {
        nullFormat: `<span>
            <b>
                Null
            </b> value at position <b>
                {point.x}
            </b> in series <b>
                {series.index}
            </b>
        </span>`
    },
    series: [{
        dataLabels: {
            enabled: true
        },
        nullInteraction: true,
        data: [1, 2, 3, null, 5, 6, 7]
    }]
});
