(async () => {

    const topology = await fetch(
        'https://code.highcharts.com/mapdata/countries/us/us-all.topo.json'
    ).then(response => response.json());

    const data = await fetch(
        'https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/us-population-density.json'
    ).then(response => response.json());

    // Make it joinable
    data.forEach(function (p) {
        p.hasc = 'US.' + p.code.toUpperCase();
    });

    // Instanciate the map
    Highcharts.mapChart('container', {
        chart: {
            borderWidth: 1
        },

        title: {
            text: 'Data label box options'
        },

        legend: {
            title: {
                text: 'US population density per km²'
            }
        },

        mapNavigation: {
            enabled: true
        },

        colorAxis: {
            min: 1,
            type: 'logarithmic',
            minColor: '#EEEEFF',
            maxColor: '#000022',
            stops: [
                [0, '#EFEFFF'],
                [0.67, '#4444FF'],
                [1, '#000022']
            ]
        },

        series: [{
            data: data,
            mapData: topology,
            joinBy: 'hasc',
            dataLabels: {
                enabled: true,
                backgroundColor: 'contrast',
                borderRadius: 2,
                format: '{point.code}',
                style: {
                    textOutline: 'none',
                    textTransform: 'uppercase'
                }
            },
            name: 'Population density',
            tooltip: {
                pointFormat: '{point.code}: {point.value}/km²'
            }
        }]
    });
})();