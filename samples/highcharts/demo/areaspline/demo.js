const commonOptions = {
    api: {
        url: 'https://demo-live-data.highcharts.com',
        access: {
            url: 'https://demo-live-data.highcharts.com/token/oauth',
            username: 'username',
            password: 'password'
        }
    }
};

// eslint-disable-next-line no-undef
const connector = new Connectors.Morningstar.TimeSeriesConnector({
    ...commonOptions,
    series: {
        type: 'Price'
    },
    securities: [
        {
            id: 'US64110L1061',
            idType: 'ISIN'
        }
    ],
    currencyId: 'EUR'
});

Promise.all([
    connector.load()
]).then(() => {

    Highcharts.chart('container', {
        chart: {
            type: 'areaspline'
        },
        title: {
            text: 'Netflix, Inc.',
            align: 'left'
        },
        subtitle: {
            text: 'Source: <a href="https://www.morningstar.com/stocks/xnas/nflx/quote" target="_blank">Morningstar</a>',
            align: 'left'
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 120,
            y: 70,
            floating: true,
            borderWidth: 1,
            backgroundColor:
                    Highcharts.defaultOptions.legend.backgroundColor ||
                    '#FFFFFF'
        },
        xAxis: {
            type: 'datetime',
            plotBands: [{
                from: new Date('2020-07-05').valueOf(),
                to: new Date('2020-07-22').valueOf(),
                color: 'rgba(68, 170, 213, .4)'
            }]
        },
        yAxis: {
            title: {
                text: 'EUR'
            }
        },
        tooltip: {
            valueDecimals: 2,
            valuePrefix: '€'
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.5
            }
        },
        series: [{
            name: 'NFLX',
            data: connector.table.getRows(0, undefined)
        }]
    });
});
