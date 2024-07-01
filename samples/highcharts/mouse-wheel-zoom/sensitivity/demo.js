Highcharts.chart('container', {

    chart: {
        zooming: {
            mouseWheel: {
                type: 'y',
                sensitivity: 1.03,
                showResetZoomButton: true
            }
        }
    },

    tooltip: {
        enabled: false
    },

    title: {
        text: 'Use mouse wheel to zoom'
    },

    series: [{
        data: [
            29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4,
            194.1, 95.6, 54.4, 29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6,
            148.5, 216.4, 194.1, 95.6, 54.4
        ],
        type: 'line',
        color: '#9913fc'
    }]
});
