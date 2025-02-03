(async () => {

    const data = await fetch(
        'https://demo-live-data.highcharts.com/aapl-ohlcv.json'
    ).then(response => response.json());

    // split the data set into ohlc and volume
    const ohlc = [],
        volume = [],
        dataLength = data.length,
        // set the allowed units for data grouping
        groupingUnits = [[
            'week',                         // unit name
            [1]                             // allowed multiples
        ], [
            'month',
            [1, 2, 3, 4, 6]
        ]];

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([
            data[i][0], // the date
            data[i][1], // open
            data[i][2], // high
            data[i][3], // low
            data[i][4] // close
        ]);

        volume.push([
            data[i][0], // the date
            data[i][5] // the volume
        ]);
    }

    // create the chart
    const chart = Highcharts.stockChart('container', {

        rangeSelector: {
            selected: 4
        },

        title: {
            text: 'AAPL Historical'
        },

        yAxis: [{
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'OHLC'
            },
            height: '60%',
            top: '0%',
            lineWidth: 2,
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'right',
                x: -3
            },
            title: {
                text: 'Volume'
            },
            top: '65%',
            height: '35%',
            offset: 0,
            lineWidth: 2
        }],

        tooltip: {
            split: true,
            position: {
                fixed: true
            }
        },

        series: [{
            type: 'candlestick',
            name: 'AAPL',
            data: ohlc,
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'line',
            name: 'Randomized',
            data: ohlc.map(
                p => [p[0], Math.round(p[1] + (Math.random() - 0.5) * 200)]
            ),
            dataGrouping: {
                units: groupingUnits
            }
        }, {
            type: 'column',
            name: 'Volume',
            data: volume,
            yAxis: 1,
            dataGrouping: {
                units: groupingUnits
            }
        }]
    });

    document.querySelector('#fixed').addEventListener('change', e => {
        chart.update({
            tooltip: {
                position: {
                    fixed: e.target.checked
                }
            }
        });
    });

    document.querySelectorAll('input[name="split-shared"]').forEach(input => {
        input.addEventListener('change', () => {
            chart.update({
                tooltip: {
                    split: document.getElementById('split').checked,
                    shared: document.getElementById('shared').checked
                }
            });
        });
    });

    document.querySelector('#relative-to').addEventListener('change', e => {
        chart.update({
            tooltip: {
                position: {
                    relativeTo: e.target.value
                }
            }
        });
    });

    document.querySelector('#outside').addEventListener('change', e => {
        chart.update({
            tooltip: {
                outside: e.target.checked
            }
        });
    });
})();
