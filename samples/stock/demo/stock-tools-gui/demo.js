const commonOptions = {
    api: {
        url: 'https://demo-live-data.highcharts.com',
        access: {
            url: 'https://demo-live-data.highcharts.com/token/oauth',
            token: 'token'
        }
    }
};

const NVIDIACorpId = '0P000003RE';

const NVIDIAPriceConnector =
    new HighchartsConnectors.Morningstar.TimeSeriesConnector({
        ...commonOptions,
        series: {
            type: 'OHLCV'
        },
        securities: [
            {
                id: NVIDIACorpId,
                idType: 'MSID'
            }
        ],
        currencyId: 'EUR'
    });

(async () => {
    await NVIDIAPriceConnector.load();

    const {
        [`${NVIDIACorpId}_Open`]: open,
        [`${NVIDIACorpId}_High`]: high,
        [`${NVIDIACorpId}_Low`]: low,
        [`${NVIDIACorpId}_Close`]: close,
        [`${NVIDIACorpId}_Volume`]: volume,
        Date: date
    } = NVIDIAPriceConnector.table.getColumns();

    const ohlc = [],
        volumeSeriesData = [],
        dataLength = date.length;

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([
            date[i],
            open[i],
            high[i],
            low[i],
            close[i]
        ]);

        volumeSeriesData.push([
            date[i],
            volume[i]
        ]);
    }

    Highcharts.stockChart('container', {
        yAxis: [{
            labels: {
                align: 'left'
            },
            height: '80%',
            resize: {
                enabled: true
            }
        }, {
            labels: {
                align: 'left'
            },
            top: '80%',
            height: '20%',
            offset: 0
        }],
        rangeSelector: {
            selected: 4
        },
        tooltip: {
            shape: 'square',
            headerShape: 'callout',
            borderWidth: 0,
            shadow: false,
            position: {
                fixed: true,
                relativeTo: 'pane'
            }
        },
        series: [{
            type: 'candlestick',
            id: 'nvidia-candlestick',
            name: 'NVIDIA Corp Stock Price',
            data: ohlc,
            dataGrouping: {
                groupPixelWidth: 20
            }
        }, {
            type: 'column',
            id: 'nvidia-volume',
            name: 'NVIDIA Volume',
            data: volumeSeriesData,
            yAxis: 1
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 800
                },
                chartOptions: {
                    rangeSelector: {
                        inputEnabled: false
                    }
                }
            }]
        }
    });
})();