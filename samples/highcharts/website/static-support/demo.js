Math.easeInSine = function (pos) {
    return -Math.cos(pos * (Math.PI / 2)) + 1;
};

Math.easeOutQuint = function (pos) {
    return (Math.pow((pos - 1), 5) + 1);
};
// Math.easeInQuint = function (pos) {
//     return Math.pow(pos, 5);
// },

Math.easeOutBounce = pos => {
    if ((pos) < (1 / 2.75)) {
        return (7.5625 * pos * pos);
    }
    if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
    }
    if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
    }
    return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
};
const tipText = [
    'How to extend the x axis beyond the last column with Live data',
    'Local Export Server Connection Issues',
    'Multiple Series (lines) within One Color Palette',
    'Need to show last value of graph at end of line',
    'Formatter for tick interval',
    'Need to show tooltip for y-axis title',
    'How to add font awesome icons on x-axis in highcharts',
    'Using dropdown filter to dynamic update Highchart',
    'set space between candlestick dynamically according to the zoom',
    'live-data example',
    'Export chart using custom buttons',
    'Wind rose chart data from table to data from series',
    'set Navigator width dynamically',
    'Export charts with custom images',
    'Rotation of annotation Labels',
    'How to bind JSON data to NetworkGraph',
    'call external API from menuItemDefinitions in network graph + angular',
    'Implementing Sonification chart in ReactJs',
    'date and time on xAxis',
    'Highchart bar & Line chart interactions',
    'alignment of labels of plot lines',
    'CSV parsing - plotting one line for each row',
    'How to have multiple legends in Line high chart',
    'x-axis label spacing',
    'Need to show tooltip for y-axis title',
    'windbarbs when changing dataseries type in angular',
    'How to add cursor style for crosshair: barchart',
    'Render Delete icon to each word of wordcloud',
    'Different tickPositions value for drilldown graph',
    'Heatmap data grouping',
    'use mouseOver or legendItemClick events to save information about series',
    'Responsive organization chart: You can do it using point.events.click',
    'What type of json format should I pass to the chart inside series prop?',
    'Dynamic fontSize of dataLabels in treemap chart',
    'Radial Gradient in Gauge Charts',
    'Bottom border of columns appear on top of xAxis',
    'Exporting multiple charts locally in different layouts',
    'Stacked waterfall chart using time series on the xAxis',
    'how to set Tooltip horizontally for each series',
    'HighChart export as jpg/png on local server',
    'You can add a color or e.g Text formatting as in the standard HTML format',
    'set only one yAxis crosshair globally',
    'How to add plotline to areachart for first series',
    'How to Synchronize Charts without Highcharts.Point?',
    'To change the Date format use xAxis.label.format or xAxis.label.formatter',
    'AngularJS and the Highchart Windrose',
    'set node export server and send requests from .NET.'
];

const text = 'Highcharts Sonification dynamic organization chart ' +
    'NetworkGraph candlestick dynamic zoom Highcharts .NET wordcloud local ' +
    'export server  labels live-data example columns xAxis candlestick  ' +
    'x-axis Windrose table data series  tooltip y-axis  Synchronize ' +
    'Highcharts.Point Barchart Text Navigator width dynamically windbarbs  ' +
    'dataseries type angular tooltip horizontally series  HighChart Heatmap. ' +
    ' Export   Export  JSON  value candlestick yAxis  yAxis crosshair  ' +
    'tickPositions  drilldown graph Highcharts legendItemClick  line chart ' +
    'color Stacked waterfall chart time series xAxis. Highcharts server ' +
    'Radial Gradient Gauge Exporting  Date format xAxis Stairs lines ' +
    'Gradient plotline  crosshair barchart areachart  treemap',
    lines = text.split(/[,\. ]+/u),
    data = lines.reduce((arr, word) => {
        let obj = Highcharts.find(arr, obj => obj.name === word);
        if (obj) {
            obj.weight += 1;
        } else {
            obj = {
                name: word,
                weight: 1
            };
            arr.push(obj);
        }
        return arr;
    }, []);

const words = {
    chart: {
        animation: {
            enabled: true,
            duration: 1000,
            easing: 'easeOutQuint'
        },
        backgroundColor: '#2f2b38',
        events: {
            load: function () {
                const chart = this;
                chart.series[0].data[0].update({
                    opacity: 1,
                    color: 'transparent'
                });

            }
        },
        styledMode: false,
        margin: 0
    },
    colors: ['#8087E8', '#A3EDBA', '#87B4E7'],
    title: {
        text: `<div class="title-container">
                  <p>popular words from the</p>
                    <h1>Highcharts forum</h1>
                   
                </div>`,
        useHTML: true,
        verticalAlign: 'middle',
        y: 20
    },
    legend: {
        enabled: false
    },
    credits: {
        enabled: false
    },
    tooltip: {
        borderWidth: 0,
        backgroundColor: '#f0f0f0',
        shadow: true,
        useHTML: true,
        formatter: function () {
            const term = this.key; // 'radial'

            for (let ii = 0; ii < tipText.length; ++ii) {
                const tempText = tipText[ii];
                const termPosition = tempText.indexOf(term);
                const termLength = term.length;
                let sub1, sub2;
                if (termPosition !== -1) {
                    sub1 = tempText.substring(0, termPosition);
                    sub2 = tempText.substring(termPosition + termLength);

                    const html = `<div >
                    ${sub1} <span class="tip">${term}</span> ${sub2}</div>`;
                    return html;
                }
            }
        }
    },
    plotOptions: {
        series: {
            borderWidth: 0,
            opacity: 1,
            fillOpacity: 1,
            dataLabels: {
                enabled: true,
                crop: false
            },
            marker: {
                enabled: false,
                allowOverlap: true
            },

            lineColor: 'transparent'
        }
    },
    series: [
        {
            type: 'wordcloud',
            maxFontSize: 33,
            opacity: 0.8,
            minFontSize: 9,
            data,
            name: 'Occurrences'
        }
    ]

};

Highcharts.chart('support', words);
