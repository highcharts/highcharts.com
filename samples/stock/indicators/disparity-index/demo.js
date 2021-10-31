Highcharts.getJSON(
    'https://demo-live-data.highcharts.com/aapl-ohlc.json',
    function (data) {
        Highcharts.stockChart('container', {
            legend: {
                enabled: true
            },

            plotOptions: {
                series: {
                    showInLegend: true
                }
            },

            rangeSelector: {
                selected: 1
            },

            title: {
                text: 'AAPL Stock Price'
            },

            yAxis: [
                {
                    height: '60%'
                },
                {
                    height: '40%',
                    top: '60%'
                }
            ],

            series: [
                {
                    type: 'candlestick',
                    id: 'aapl',
                    name: 'AAPL Stock Price',
                    data: data
                },
                {
                    type: 'disparityindex',
                    linkedTo: 'aapl',
                    yAxis: 1,
                    params: {
                        period: 9
                    }
                }
            ]
        });
    }
);
