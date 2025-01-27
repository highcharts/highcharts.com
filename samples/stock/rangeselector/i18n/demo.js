(async () => {
    // Load the dataset
    const data = await fetch(
        'https://cdn.jsdelivr.net/gh/highcharts/highcharts@master/samples/data/ohlcv.json'
    ).then(response => response.json());

    Highcharts.stockChart('container', {
        chart: {
            type: 'candlestick'
        },
        rangeSelector: {
            selected: 2,
            buttonTheme: {
                width: 60
            }
        },
        series: [{
            data: data
        }]
    });

})();
