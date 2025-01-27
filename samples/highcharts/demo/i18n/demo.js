function renderChart() {
    Highcharts.chart('container', {
        chart: {
            type: 'column',
            zooming: {
                type: 'x'
            },
            events: {
                render: function () {
                    setTimeout(() => this.hideLoading(), 1000);
                }

            }
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                month: '%[BY]'
            }
        },
        series: [
            {
                data: [
                    ['2025-01-01', 1],
                    ['2025-02-01', 2],
                    ['2025-03-01', 3],
                    ['2025-04-01', 4],
                    ['2025-05-01', 5],
                    ['2025-06-01', 6],
                    ['2025-07-01', 7],
                    ['2025-08-01', 8],
                    ['2025-09-01', 9],
                    ['2025-10-01', 10],
                    ['2025-11-01', 11],
                    ['2025-12-01', 12]
                ]
            },
            {
                data: [
                    ['2025-01-01', 2],
                    ['2025-02-01', 1],
                    ['2025-03-01', 4],
                    ['2025-04-01', 5],
                    ['2025-05-01', 2],
                    ['2025-06-01', 1],
                    ['2025-07-01', 2],
                    ['2025-08-01', 5],
                    ['2025-09-01', 6],
                    ['2025-10-01', 7],
                    ['2025-11-01', 1],
                    ['2025-12-01', 2]
                ]
            }
        ]
    },
    function () {
        this.showLoading();
    });
}

renderChart();

document.querySelector('select#lang-select')
    .addEventListener('change', async function (e) {
        const lang = e.target.value === 'default' ? 'lang' : e.target.value;
        const src = `https://code.highcharts.com/i18n/${lang}.json`;

        const langOptions = await fetch(src)
            .then(response => response.json());

        Highcharts.setOptions({
            lang: langOptions
        });

        document.querySelector('#container').setAttribute('lang', lang);

        // As the lang object is global we need to fully re-render the chart
        renderChart();
    });
