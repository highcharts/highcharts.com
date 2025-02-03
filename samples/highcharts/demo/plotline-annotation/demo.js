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

(async () => {
    const TeslaPriceConnector =
        new HighchartsConnectors.Morningstar.TimeSeriesConnector({
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
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            currencyId: 'EUR'
        });

    await TeslaPriceConnector.load();

    Highcharts.stockChart('container', {
        title: {
            text: 'Tesla Quarterly EPS vs Stock Price Movement (2023)'
        },
        annotations: [
            {
                draggable: '',
                shapes: [
                    {
                        type: 'path',
                        points: [
                            function (annotation) {
                                return {
                                    x: Date.UTC(2023, 2, 31),
                                    xAxis: 0,
                                    y: annotation.chart.yAxis[0].min,
                                    yAxis: 0
                                };
                            },
                            function (annotation) {
                                return {
                                    x: Date.UTC(2023, 2, 31),
                                    xAxis: 0,
                                    y: annotation.chart.yAxis[0].max,
                                    yAxis: 0
                                };
                            }
                        ]
                    }
                ],
                labels: [
                    {
                        point: function (annotation) {
                            return {
                                x: Date.UTC(2023, 2, 31),
                                xAxis: 0,
                                y: annotation.chart.yAxis[0].max,
                                yAxis: 0
                            };
                        },
                        y: 0,
                        format: 'Q1 EPS: $0.73'
                    }
                ]
            }, {
                draggable: '',
                shapes: [
                    {
                        type: 'path',
                        points: [
                            function (annotation) {
                                return {
                                    x: Date.UTC(2023, 5, 30),
                                    xAxis: 0,
                                    y: annotation.chart.yAxis[0].min,
                                    yAxis: 0
                                };
                            },
                            function (annotation) {
                                return {
                                    x: Date.UTC(2023, 5, 30),
                                    xAxis: 0,
                                    y: annotation.chart.yAxis[0].max,
                                    yAxis: 0
                                };
                            }
                        ]
                    }
                ],
                labels: [
                    {
                        point: function (annotation) {
                            return {
                                x: Date.UTC(2023, 5, 30),
                                xAxis: 0,
                                y: annotation.chart.yAxis[0].max,
                                yAxis: 0
                            };
                        },
                        y: 0,
                        format: 'Q2 EPS: $0.78'
                    }
                ]
            }, {
                draggable: '',
                shapes: [
                    {
                        type: 'path',
                        points: [
                            function (annotation) {
                                return {
                                    x: Date.UTC(2023, 8, 30),
                                    xAxis: 0,
                                    y: annotation.chart.yAxis[0].min,
                                    yAxis: 0
                                };
                            },
                            function (annotation) {
                                return {
                                    x: Date.UTC(2023, 8, 30),
                                    xAxis: 0,
                                    y: annotation.chart.yAxis[0].max,
                                    yAxis: 0
                                };
                            }
                        ]
                    }
                ],
                labels: [
                    {
                        point: function (annotation) {
                            return {
                                x: Date.UTC(2023, 8, 30),
                                xAxis: 0,
                                y: annotation.chart.yAxis[0].max,
                                yAxis: 0
                            };
                        },
                        y: 0,
                        format: 'Q3 EPS: $0.53'
                    }
                ]
            }
        ],
        series: [
            {
                type: 'line',
                name: 'Tesla Stock Price',
                data: TeslaPriceConnector.table.getRows(0)
            }
        ]
    });
})();
