(async () => {

    // Load the dataset
    const data = await fetch(
        'https://www.highcharts.com/samples/data/aapl-ohlc.json'
    ).then(response => response.json());

    // It builds the options for the fibonacc retracements annotation
    // which starts from (x1, y1) and stops on (x2, y2)
    function fibonacciRetracements(x1, y1, x2, y2) {
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const colors = [
            'rgba(130, 170, 255, 0.4)',
            'rgba(139, 191, 216, 0.4)',
            'rgba(150, 216, 192, 0.4)',
            'rgba(156, 229, 161, 0.4)',
            'rgba(162, 241, 130, 0.4)',
            'rgba(169, 255, 101, 0.4)'
        ];

        const point = function (x, y) {
            return {
                x: x,
                y: y,
                xAxis: 0,
                yAxis: 0
            };
        };

        const diff = y2 - y1;

        const lines = [];
        const backgrounds = [];
        const labels = [];

        // building options for the annotation
        levels.forEach(function (level, i) {
            const retracement = y2 - diff * level;
            const p1 = point(x1, retracement);
            const p2 = point(x2, retracement);

            // defining horizontal lines
            lines.push({
                type: 'path',
                points: [p1, p2],
                stroke: 'grey'
            });

            // defining labels for horizontal lines
            labels.push({
                point: p1,
                text: level.toString()
            });

            if (i > 0) {
            // defining colored backgrounds
                backgrounds.push({
                    type: 'path',
                    points: [
                        lines[i - 1].points[0],
                        lines[i - 1].points[1],
                        lines[i].points[1],
                        lines[i].points[0]
                    ],
                    strokeWidth: 0,
                    fill: colors[i - 1]
                });
            }
        });

        // defining the trend line
        const trendLine = [{
            type: 'path',
            dashStyle: 'Dash',
            points: [point(x1, y1), point(x2, y2)],
            stroke: 'black'
        }];


        // Putting pieces together into an annotation
        return {
            labels: labels,
            shapes: lines.concat(backgrounds, trendLine),
            zIndex: 2,
            labelOptions: {
                allowOverlap: true,
                align: 'right',
                y: 0,
                backgroundColor: 'none',
                verticalAlign: 'middle',
                shape: 'rect',
                borderWidth: 0,
                style: {
                    color: 'grey'
                }
            }
        };
    }


    // create the chart
    Highcharts.stockChart('container', {

        rangeSelector: {
            selected: 4
        },

        title: {
            text: 'Highcharts Stock Annotations'
        },

        subtitle: {
            text: 'Fibonacci Retracements'
        },

        yAxis: {
            labels: {
                enabled: false
            }
        },

        annotations: [
            fibonacciRetracements(
                Date.UTC(2016, 10, 14),
                105,
                Date.UTC(2017, 8, 4), 170
            )
        ],

        series: [{
            type: 'candlestick',
            name: 'AAPL Stock Price',
            data: data,
            dataGrouping: {
                units: [[
                    'week', // unit name
                    [1] // allowed multiples
                ], [
                    'month',
                    [1, 2, 3, 4, 6]
                ]]
            }
        }]
    });
})();