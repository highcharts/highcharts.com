(async () => {

    const PERIOD_CAP = 31.97,
        PERIOD_BUFFER = 6.5;

    const data = await fetch(
        'https://cdn.jsdelivr.net/gh/highcharts/highcharts@25f540deda/samples/data/etfs.json'
    ).then(response => response.json());

    Highcharts.stockChart('container', {
        rangeSelector: {
            enabled: false
        },

        navigator: {
            enabled: false
        },

        legend: {
            enabled: true,
            verticalAlign: 'top',
            align: 'left'
        },

        yAxis: {
            labels: {
                format: '{#if (gt value 0)}+{/if}{value}%'
            },
            opposite: false,
            plotLines: [{
                value: PERIOD_CAP,
                width: 2,
                color: 'rgba(152, 251, 152, 0.4)',
                dashStyle: 'Dash',
                label: {
                    align: 'right',
                    text: `OUTCOME PERIOD CAP: ${PERIOD_CAP}%`,
                    x: -3,
                    style: {
                        color: '#006666',
                        fontWeight: 'bold'
                    }
                }
            }, {
                value: -PERIOD_BUFFER,
                width: 2,
                color: 'rgba(175, 238, 238, 0.6)',
                dashStyle: 'Dash',
                label: {
                    align: 'right',
                    verticalAlign: 'bottom',
                    text: `OUTCOME PERIOD BUFFER: ${PERIOD_BUFFER}%`,
                    x: -3,
                    y: 13,
                    style: {
                        color: '#008B8B',
                        fontWeight: 'bold'
                    }
                }
            }, {
                value: 0,
                width: 2,
                dashStyle: 'ShortDot'
            }],
            plotBands: [{
                from: 0,
                to: PERIOD_CAP,
                color: 'rgba(152, 251, 152, 0.4)'
            }, {
                from: 0,
                to: -PERIOD_BUFFER,
                color: 'rgba(175, 238, 238, 0.6)'
            }]
        },

        plotOptions: {
            series: {
                compare: 'percent',
                showInNavigator: true
            }
        },

        tooltip: {
            pointFormat: '<span style="color:{series.color}">' +
                        '{series.name}</span>: <b>{point.y} EUR</b> ' +
                        '({point.change}%)<br/>',
            valueDecimals: 2,
            split: true
        },

        series: [{
            name: 'iShares Core S&P 500 UCITS ETF',
            data: data.CSPX
        }, {
            name: 'Example Buffer ETF',
            data: data.Other
        }]
    });

})();