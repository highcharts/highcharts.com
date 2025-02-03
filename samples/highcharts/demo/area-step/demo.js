Highcharts.chart('container', {
    chart: {
        type: 'area'
    },
    title: {
        text: 'United States Fed Funds Interest Rate',
        align: 'left'
    },
    xAxis: {
        type: 'datetime'
    },
    yAxis: {
        title: {
            text: undefined
        },
        labels: {
            format: '{value}%'
        }
    },
    tooltip: {
        valueDecimals: 2,
        valueSuffix: '%'
    },
    series: [{
        name: 'Interest Rate',
        showInLegend: false,
        step: {
            type: 'left',
            risers: false
        },
        fillOpacity: 0.25,
        linecap: 'butt',
        lineWidth: 3,
        data: [
            [
                Date.UTC(2014, 9, 29),
                0.25
            ],
            [
                Date.UTC(2014, 10, 30),
                0.25
            ],
            [
                Date.UTC(2014, 11, 17),
                0.25
            ],
            [
                Date.UTC(2015, 0, 28),
                0.25
            ],
            [
                Date.UTC(2015, 1, 28),
                0.25
            ],
            [
                Date.UTC(2015, 2, 18),
                0.25
            ],
            [
                Date.UTC(2015, 3, 29),
                0.25
            ],
            [
                Date.UTC(2015, 4, 31),
                0.25
            ],
            [
                Date.UTC(2015, 5, 17),
                0.25
            ],
            [
                Date.UTC(2015, 6, 29),
                0.25
            ],
            [
                Date.UTC(2015, 7, 31),
                0.25
            ],
            [
                Date.UTC(2015, 8, 17),
                0.25
            ],
            [
                Date.UTC(2015, 9, 28),
                0.25
            ],
            [
                Date.UTC(2015, 10, 30),
                0.25
            ],
            [
                Date.UTC(2015, 11, 16),
                0.5
            ],
            [
                Date.UTC(2016, 0, 27),
                0.5
            ],
            [
                Date.UTC(2016, 1, 29),
                0.5
            ],
            [
                Date.UTC(2016, 2, 16),
                0.5
            ],
            [
                Date.UTC(2016, 3, 27),
                0.5
            ],
            [
                Date.UTC(2016, 4, 31),
                0.5
            ],
            [
                Date.UTC(2016, 5, 15),
                0.5
            ],
            [
                Date.UTC(2016, 6, 27),
                0.5
            ],
            [
                Date.UTC(2016, 7, 31),
                0.5
            ],
            [
                Date.UTC(2016, 8, 21),
                0.5
            ],
            [
                Date.UTC(2016, 9, 31),
                0.5
            ],
            [
                Date.UTC(2016, 10, 2),
                0.5
            ],
            [
                Date.UTC(2016, 11, 14),
                0.75
            ],
            [
                Date.UTC(2017, 0, 31),
                0.75
            ],
            [
                Date.UTC(2017, 1, 1),
                0.75
            ],
            [
                Date.UTC(2017, 2, 15),
                1
            ],
            [
                Date.UTC(2017, 3, 30),
                1
            ],
            [
                Date.UTC(2017, 4, 3),
                1
            ],
            [
                Date.UTC(2017, 5, 14),
                1.25
            ],
            [
                Date.UTC(2017, 6, 26),
                1.25
            ],
            [
                Date.UTC(2017, 7, 31),
                1.25
            ],
            [
                Date.UTC(2017, 8, 20),
                1.25
            ],
            [
                Date.UTC(2017, 9, 31),
                1.25
            ],
            [
                Date.UTC(2017, 10, 1),
                1.25
            ],
            [
                Date.UTC(2017, 11, 13),
                1.5
            ],
            [
                Date.UTC(2018, 0, 31),
                1.5
            ],
            [
                Date.UTC(2018, 1, 28),
                1.5
            ],
            [
                Date.UTC(2018, 2, 21),
                1.75
            ],
            [
                Date.UTC(2018, 3, 30),
                1.75
            ],
            [
                Date.UTC(2018, 4, 2),
                1.75
            ],
            [
                Date.UTC(2018, 5, 13),
                2
            ],
            [
                Date.UTC(2018, 6, 31),
                2
            ],
            [
                Date.UTC(2018, 7, 1),
                2
            ],
            [
                Date.UTC(2018, 8, 26),
                2.25
            ],
            [
                Date.UTC(2018, 9, 31),
                2.25
            ],
            [
                Date.UTC(2018, 10, 8),
                2.25
            ],
            [
                Date.UTC(2018, 11, 19),
                2.5
            ],
            [
                Date.UTC(2019, 0, 30),
                2.5
            ],
            [
                Date.UTC(2019, 1, 28),
                2.5
            ],
            [
                Date.UTC(2019, 2, 20),
                2.5
            ],
            [
                Date.UTC(2019, 3, 30),
                2.5
            ],
            [
                Date.UTC(2019, 4, 1),
                2.5
            ],
            [
                Date.UTC(2019, 5, 19),
                2.5
            ],
            [
                Date.UTC(2019, 6, 31),
                2.25
            ],
            [
                Date.UTC(2019, 7, 31),
                2.25
            ],
            [
                Date.UTC(2019, 8, 18),
                2
            ],
            [
                Date.UTC(2019, 9, 30),
                1.75
            ],
            [
                Date.UTC(2019, 10, 30),
                1.75
            ],
            [
                Date.UTC(2019, 11, 11),
                1.75
            ],
            [
                Date.UTC(2020, 0, 29),
                1.75
            ],
            [
                Date.UTC(2020, 1, 29),
                1.75
            ],
            [
                Date.UTC(2020, 2, 3),
                1.25
            ],
            [
                Date.UTC(2020, 2, 15),
                0.25
            ],
            [
                Date.UTC(2020, 3, 29),
                0.25
            ],
            [
                Date.UTC(2020, 4, 31),
                0.25
            ],
            [
                Date.UTC(2020, 5, 10),
                0.25
            ],
            [
                Date.UTC(2020, 6, 29),
                0.25
            ],
            [
                Date.UTC(2020, 7, 31),
                0.25
            ],
            [
                Date.UTC(2020, 8, 16),
                0.25
            ],
            [
                Date.UTC(2020, 9, 31),
                0.25
            ],
            [
                Date.UTC(2020, 10, 5),
                0.25
            ],
            [
                Date.UTC(2020, 11, 16),
                0.25
            ],
            [
                Date.UTC(2021, 0, 27),
                0.25
            ],
            [
                Date.UTC(2021, 1, 28),
                0.25
            ],
            [
                Date.UTC(2021, 2, 17),
                0.25
            ],
            [
                Date.UTC(2021, 3, 28),
                0.25
            ],
            [
                Date.UTC(2021, 4, 31),
                0.25
            ],
            [
                Date.UTC(2021, 5, 16),
                0.25
            ],
            [
                Date.UTC(2021, 6, 28),
                0.25
            ],
            [
                Date.UTC(2021, 7, 31),
                0.25
            ],
            [
                Date.UTC(2021, 8, 22),
                0.25
            ],
            [
                Date.UTC(2021, 9, 31),
                0.25
            ],
            [
                Date.UTC(2021, 10, 3),
                0.25
            ],
            [
                Date.UTC(2021, 11, 15),
                0.25
            ],
            [
                Date.UTC(2022, 0, 26),
                0.25
            ],
            [
                Date.UTC(2022, 1, 28),
                0.25
            ],
            [
                Date.UTC(2022, 2, 16),
                0.5
            ],
            [
                Date.UTC(2022, 3, 30),
                0.5
            ],
            [
                Date.UTC(2022, 4, 4),
                1
            ],
            [
                Date.UTC(2022, 5, 15),
                1.75
            ],
            [
                Date.UTC(2022, 6, 27),
                2.5
            ],
            [
                Date.UTC(2022, 7, 31),
                2.5
            ],
            [
                Date.UTC(2022, 8, 21),
                3.25
            ],
            [
                Date.UTC(2022, 9, 31),
                3.25
            ],
            [
                Date.UTC(2022, 10, 2),
                4
            ],
            [
                Date.UTC(2022, 11, 14),
                4.5
            ],
            [
                Date.UTC(2023, 0, 31),
                4.5
            ],
            [
                Date.UTC(2023, 1, 1),
                4.75
            ],
            [
                Date.UTC(2023, 2, 22),
                5
            ],
            [
                Date.UTC(2023, 3, 30),
                5
            ],
            [
                Date.UTC(2023, 4, 3),
                5.25
            ],
            [
                Date.UTC(2023, 5, 14),
                5.25
            ],
            [
                Date.UTC(2023, 6, 26),
                5.5
            ],
            [
                Date.UTC(2023, 7, 31),
                5.5
            ],
            [
                Date.UTC(2023, 8, 20),
                5.5
            ],
            [
                Date.UTC(2023, 9, 31),
                5.5
            ],
            [
                Date.UTC(2023, 10, 1),
                5.5
            ],
            [
                Date.UTC(2023, 11, 13),
                5.5
            ],
            [
                Date.UTC(2024, 0, 31),
                5.5
            ],
            [
                Date.UTC(2024, 1, 29),
                5.5
            ],
            [
                Date.UTC(2024, 2, 20),
                5.5
            ],
            [
                Date.UTC(2024, 4, 1),
                5.5
            ],
            [
                Date.UTC(2024, 5, 12),
                5.5
            ],
            [
                Date.UTC(2024, 6, 31),
                5.5
            ],
            [
                Date.UTC(2024, 7, 31),
                5.5
            ],
            [
                Date.UTC(2024, 8, 18),
                5
            ],
            [
                Date.UTC(2024, 9, 6),
                null
            ]
        ]
    }]
});
