(function (H) {
    const animateSVGPath = (svgElem, animation, callback = void 0) => {
        if (!svgElem) return;

        const length = svgElem.element.getTotalLength();
        svgElem.attr({
            'stroke-dasharray': length,
            'stroke-dashoffset': length,
            opacity: 1
        });
        svgElem.animate({
            'stroke-dashoffset': 0
        }, animation, callback);
    };

    H.seriesTypes.line.prototype.animate = function (init) {
        const series = this,
            animation = H.animObject(series.options.animation);
        if (!init) {
            animateSVGPath(series.graph, animation);
        }
    };

    H.addEvent(H.Axis, 'afterRender', function () {
        const axis = this,
            chart = axis.chart,
            animation = H.animObject(chart.renderer.globalAnimation);

        axis.axisGroup
            // Init
            .attr({
                opacity: 0,
                rotation: -3,
                scaleY: 0.9
            })

            // Animate
            .animate({
                opacity: 1,
                rotation: 0,
                scaleY: 1
            }, animation);
        if (axis.horiz) {
            axis.labelGroup
                // Init
                .attr({
                    opacity: 0,
                    rotation: 3,
                    scaleY: 0.5
                })

                // Animate
                .animate({
                    opacity: 1,
                    rotation: 0,
                    scaleY: 1
                }, animation);
        } else {
            axis.labelGroup
                // Init
                .attr({
                    opacity: 0,
                    rotation: 3,
                    scaleX: -0.5
                })

                // Animate
                .animate({
                    opacity: 1,
                    rotation: 0,
                    scaleX: 1
                }, animation);
        }

        if (axis.plotLinesAndBands) {
            axis.plotLinesAndBands.forEach(plotLine => {
                const animation = H.animObject(plotLine.options.animation);

                // Init
                plotLine.label.attr({
                    opacity: 0
                });

                // Animate
                animateSVGPath(
                    plotLine.svgElem,
                    animation,
                    function () {
                        plotLine.label.animate({
                            opacity: 1
                        });
                    }
                );
            });
        }
    });
}(Highcharts));

const commonOptions = {
    api: {
        url: 'https://demo-live-data.highcharts.com',
        access: {
            url: 'https://demo-live-data.highcharts.com/token/oauth',
            token: 'your-access-token'
        }
    }
};

const ISINMap = {
    Meta: 'US30303M1027',
    Amazon: 'US0231351067',
    Netflix: 'US64110L1061',
    GoogleClassA: 'US02079K3059'
};

// eslint-disable-next-line no-undef
const FANGPriceConnector = new Connectors.Morningstar.TimeSeriesConnector({
    ...commonOptions,
    series: {
        type: 'Price'
    },
    securities: [
        {
            id: ISINMap.Meta,
            idType: 'ISIN'
        },
        {
            id: ISINMap.Amazon,
            idType: 'ISIN'
        },
        {
            id: ISINMap.Netflix,
            idType: 'ISIN'
        },
        {
            id: ISINMap.GoogleClassA,
            idType: 'ISIN'
        }
    ],
    startDate: '2017-01-01',
    endDate: '2024-01-01',
    currencyId: 'EUR'
});

Promise.all([FANGPriceConnector.load()]).then(() => {
    const { Date: dates, ...companies } = FANGPriceConnector.table.getColumns();
console.log(companies);
    const processedData = Object.fromEntries(
        Object.entries(companies).map(([key, values]) => [
            key,
            values.map((value, i) => [dates[i], value])
        ])
    );

    console.log(processedData);

    Highcharts.chart('container', {
        chart: {
            type: 'spline'
        },

        title: {
            text: 'FANG Stock Prices',
            align: 'left'
        },

        subtitle: {
            text: 'Source: Morningstar',
            align: 'left'
        },

        xAxis: {
            type: 'datetime'
        },

        yAxis: [{
            labels: {
                format: '€{text}'
            },
            title: {
                text: 'Facebook'
            }
        }, {
            labels: {
                format: '€{text}'
            },
            title: {
                text: 'Amazon'
            }
        }, {
            opposite: true,
            labels: {
                format: '€{text}'
            },
            title: {
                text: 'Netflix'
            }
        }, {
            opposite: true,
            labels: {
                format: '€{text}'
            },
            title: {
                text: 'Google'
            }
        }],

        plotOptions: {
            series: {
                animation: {
                    duration: 1000
                },
                marker: {
                    enabled: false
                },
                lineWidth: 2
            }
        },

        tooltip: {
            valueDecimals: 2,
            valuePrefix: '€'
        },

        series: [{
            name: 'Facebook',
            data: processedData['0P0000W3KZ'],
            yAxis: 0
        }, {
            name: 'Amazon',
            data: processedData['0P000000B7'],
            yAxis: 1,
            animation: {
                defer: 1000
            }
        }, {
            name: 'Netflix',
            data: processedData['0P000002HD'],
            yAxis: 2,
            animation: {
                defer: 2000
            }
        }, {
            name: 'Google',
            data: processedData['0P000003UP'],
            yAxis: 3,
            animation: {
                defer: 3000
            }
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 500
                },
                chartOptions: {
                    yAxis: [{
                        tickAmount: 2,
                        title: {
                            x: 15,
                            reserveSpace: false
                        }
                    }, {
                        tickAmount: 2,
                        title: {
                            x: 20,
                            reserveSpace: false
                        }
                    }, {
                        tickAmount: 2,
                        title: {
                            x: -20,
                            reserveSpace: false
                        }
                    }, {
                        tickAmount: 2,
                        title: {
                            x: -20,
                            reserveSpace: false
                        }
                    }]
                }
            }]
        }
    });
});
