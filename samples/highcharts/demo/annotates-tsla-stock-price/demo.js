const commonOptions = {
    api: {
        url: 'https://demo-live-data.highcharts.com',
        access: {
            url: 'https://demo-live-data.highcharts.com/token/oauth',
            token: 'token'
        }
    }
};

const TeslaISIN = 'US88160R1014';

// eslint-disable-next-line no-undef
const connector = new HighchartsConnectors.Morningstar.TimeSeriesConnector({
    ...commonOptions,
    series: {
        type: 'Price'
    },
    securities: [
        {
            id: TeslaISIN,
            idType: 'ISIN'
        }
    ],
    startDate: '2017-01-01',
    endDate: '2024-01-01',
    currencyId: 'EUR'
});

(async () => {
    await connector.load();

    const cols = connector.table.getColumns();

    const name = Array.from(Object.keys(cols).filter(k => k !== 'Date'))[0];
    const data = cols[name].map((value, i) => [cols.Date[i], value]);

    Highcharts.chart('container', {
        chart: {
            type: 'area',
            zooming: {
                type: 'x'
            },
            panning: true,
            panKey: 'shift',
            scrollablePlotArea: {
                minWidth: 600
            }
        },

        caption: {
            text: `This chart uses the Highcharts Annotations feature to place
                labels at various points of interest. The labels are responsive
                and will be hidden to avoid overlap on small screens.`
        },

        title: {
            text: 'TSLA Stock price 2020 - 2024',
            align: 'left'
        },

        accessibility: {
            landmarkVerbosity: 'one'
        },

        credits: {
            enabled: false
        },

        annotations: [
            {
                draggable: '',
                labelOptions: {
                    shape: 'connector'
                },
                labels: [
                    {
                        allowOverlap: true,
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2020, 7, 20),
                            y: 111.55
                        },
                        x: -100,
                        y: 10,
                        text: '5 for 1 Stock split announcement'
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2020, 11, 21),
                            y: 179.13
                        },
                        text: 'Inclusion to S&P 500 Index',
                        x: -70,
                        y: -20
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2021, 3, 1),
                            y: 192
                        },
                        text: 'Record earnings in Q1 2021',
                        y: -50,
                        x: -20
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2021, 10, 1),
                            y: 336
                        },
                        x: -100,
                        text: 'Stock Sale by Elon Musk'
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2022, 2, 0),
                            y: 258.47
                        },
                        text: 'Berlin\'s giga factory opening',
                        x: -5,
                        y: 100
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2022, 3, 12),
                            y: 306.37
                        },
                        text: 'Musk\'s Twitter aquisition',
                        x: 90
                    }
                ]
            },
            {
                draggable: '',
                labels: [
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2019, 2, 14),
                            y: 17.07
                        },
                        x: -60,
                        text: 'Tesla Model Y announced'
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2019, 10, 21),
                            y: 21.57
                        },
                        text: 'Tesla CyberTruck announced',
                        x: -80,
                        y: -40
                    },
                    {
                        point: {
                            xAxis: 0,
                            yAxis: 0,
                            x: Date.UTC(2020, 8, 22),
                            y: 120.02
                        },
                        x: 100,
                        y: 50,
                        text: 'Tesla Model S and X Plaid announced'
                    }
                ]
            }
        ],

        xAxis: {
            type: 'datetime'
        },

        yAxis: {
            startOnTick: true,
            endOnTick: false,
            title: {
                text: null
            },
            labels: {
                format: '{value} EUR'
            },
            accessibility: {
                description: 'Price',
                rangeDescription: 'Range from 0 to 125 EUR'
            }
        },

        tooltip: {
            pointFormat: '{point.y:.2f} EUR',
            shared: true
        },

        legend: {
            enabled: false
        },

        series: [
            {
                data,
                lineColor: '#cc0000',
                color: '#cc0000',
                fillColor: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [
                        [0, '#818181'],
                        [1, '#fafafa']
                    ]
                },
                fillOpacity: 0.5,
                name: 'TSLA Stock Price',
                marker: {
                    enabled: false
                },
                threshold: null
            }
        ]
    });
})();
