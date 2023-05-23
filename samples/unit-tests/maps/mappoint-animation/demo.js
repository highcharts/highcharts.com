Highcharts.mapChart('container', {

    plotOptions: {
        mappoint: {
            animation: {
                duration: 50
            }
        }
    },

    mapNavigation: {
        enabled: true
    },

    series: [
        {
            mapData: Highcharts.maps['countries/gb/gb-all']
        },
        {
            // Specify cities using lat/lon
            type: 'mappoint',
            name: 'Cities',
            dataLabels: {
                format: '{point.id}'
            },
            data: [{
                id: 'London',
                lat: 51.507222,
                lon: -0.1275
            }, {
                id: 'Birmingham',
                lat: 52.483056,
                lon: -1.893611
            }, {
                id: 'Glasgow',
                lat: 55.858,
                lon: -4.259
            }, {
                id: 'Liverpool',
                lat: 53.4,
                lon: -3
            }, {
                id: 'Bristol',
                lat: 51.45,
                lon: -2.583333
            }, {
                id: 'Belfast',
                lat: 54.597,
                lon: -5.93
            }, {
                id: 'Lerwick',
                lat: 60.155,
                lon: -1.145
            }]
        }
    ]
}
// , function (chart) {
//     setTimeout(() => {
//         chart.mapView.zoomBy(
//             1,
//             void 0,
//             [550, 350], {
//             duration: 10e3
//         }
//         );
//         setTimeout(() => {
//             chart.mapView.zoomBy(
//                 0.7,
//                 void 0,
//                 [550, 350],
//                 false
//             );
//         }, 3e3);
//     }, 300);
// }
);
