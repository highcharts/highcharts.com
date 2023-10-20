// Prepare demo data
// Data is joined to map using value of 'hc-key' property by default.
// See API docs for 'joinBy' for more info on linking data and map.
const data = [
    ['us-ma', 0],
    ['us-wa', 1],
    ['us-ca', 2],
    ['us-or', 3],
    ['us-wi', 4],
    ['us-me', 5],
    ['us-mi', 6],
    ['us-nv', 7],
    ['us-nm', 8],
    ['us-co', 9],
    ['us-wy', 10],
    ['us-ks', 11],
    ['us-ne', 12],
    ['us-ok', 13],
    ['us-mo', 14],
    ['us-il', 15],
    ['us-in', 16],
    ['us-vt', 17],
    ['us-ar', 18],
    ['us-tx', 20],
    ['us-ri', 20],
    ['us-al', 21],
    ['us-ms', 22],
    ['us-nc', 23],
    ['us-va', 24],
    ['us-ia', 25],
    ['us-md', 26],
    ['us-de', 27],
    ['us-pa', 28],
    ['us-nj', 29],
    ['us-ny', 30],
    ['us-id', 31],
    ['us-sd', 32],
    ['us-ct', 33],
    ['us-nh', 34],
    ['us-ky', 35],
    ['us-oh', 36],
    ['us-tn', 37],
    ['us-wv', 38],
    ['us-dc', 39],
    ['us-la', 40],
    ['us-fl', 41],
    ['us-ga', 42],
    ['us-sc', 43],
    ['us-mn', 44],
    ['us-mt', 20],
    ['us-nd', 46],
    ['us-az', 20],
    ['us-ut', 48],
    ['us-hi', 49],
    ['us-ak', 50],
    ['undefined', 51]
];

// Create the chart
Highcharts.mapChart('container', {
    chart: {
        map: 'countries/us/us-all'
    },

    title: {
        text: null
    },

    subtitle: {
        text: null
    },

    mapNavigation: {
        enabled: true,
        enableButtons: false
    },

    colorAxis: {
        min: 0
    },

    tooltip: {
        formatter: function () {
            return this.key + '<br/>' + this.point['hc-key'];
        }
    },

    series: [{
        data: data,
        name: 'Random data',
        dataLabels: {
            enabled: true,
            format: '{point.name}'
        }
    }, {
        name: 'Separators',
        type: 'mapline',
        data: Highcharts.geojson(Highcharts.maps['countries/us/us-all'], 'mapline'),
        color: 'silver',
        showInLegend: false,
        enableMouseTracking: false
    }]
});
