const numberOfRows = 10000;

Grid.grid('container', {
    dataTable: {
        columns: {
            a: Array.from({ length: numberOfRows }, (_, i) => `A${i}`),
            b: Array.from({ length: numberOfRows }, (_, i) => `B${i}`),
            c: Array.from({ length: numberOfRows }, (_, i) => `C${i}`),
            d: Array.from({ length: numberOfRows }, () =>
                Array.from({ length: 10 }, () =>  Math.random() * 100)
            )
        }
    },
    rendering: {
        rows: {
            strictHeights: true
        }
    },

    events: {
        cell: {
            afterSetValue: function () {
                if (this.column.id !== 'd') {
                    return;
                }
                const rowIndex = this.row.index;

                Highcharts.chart(this.htmlElement, {
                    chart: {
                        height: 40,
                        animation: false,
                        margin: [0, 0, 0, 0],
                        events: {
                            load: function () {
                                console.log('I am loaded', rowIndex);
                            }
                        }
                    },
                    title: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        visible: false
                    },
                    yAxis: {
                        visible: false
                    },
                    legend: {
                        enabled: false
                    },
                    plotOptions: {
                        series: {
                            marker: {
                                enabled: false
                            },
                            animation: false
                        }
                    },
                    series: [
                        {
                            type: 'spline',
                            data: this.value
                        }
                    ]
                });
            }
        }
    }
});
