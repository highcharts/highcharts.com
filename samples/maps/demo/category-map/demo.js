(async () => {

    const topology = await fetch(
        'https://code.highcharts.com/mapdata/custom/europe.topo.json'
    ).then(response => response.json());

    // Instantiate the map
    Highcharts.mapChart('container', {
        chart: {
            map: topology,
            spacingBottom: 20
        },

        title: {
            text: 'Europe time zones'
        },

        accessibility: {
            series: {
                descriptionFormat: 'Timezone {series.name} with ' +
                    '{series.points.length} countries.'
            },
            point: {
                valueDescriptionFormat: '{point.name}.'
            }
        },

        legend: {
            enabled: true
        },

        plotOptions: {
            map: {
                allAreas: false,
                joinBy: ['iso-a2', 'code'],
                dataLabels: {
                    enabled: true,
                    // color: '#FFFFFF',
                    backgroundColor: 'contrast',
                    borderRadius: 3,
                    style: {
                        fontWeight: 'bold',
                        textOutline: 'none'
                    },
                    // Only show dataLabels for areas with high label rank
                    format: '{#if (lt point.properties.labelrank 5)}' +
                        '{point.properties.iso-a2}' +
                        '{/if}'
                },
                tooltip: {
                    headerFormat: '',
                    pointFormat: '{point.name}: <b>{series.name}</b>'
                }
            }
        },

        series: [{
            name: 'UTC',
            data: ['IE', 'IS', 'GB', 'PT'].map(code => ({ code }))
        }, {
            name: 'UTC + 1',
            data: [
                'NO', 'SE', 'DK', 'DE', 'NL', 'BE', 'LU', 'ES', 'FR', 'PL',
                'CZ', 'AT', 'CH', 'LI', 'SK', 'HU', 'SI', 'IT', 'SM', 'HR',
                'BA', 'YF', 'ME', 'AL', 'MK'
            ].map(code => ({ code }))
        }, {
            name: 'UTC + 2',
            data: [
                'FI', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'RO', 'BG', 'GR',
                'TR', 'CY'
            ].map(code => ({ code }))
        }, {
            name: 'UTC + 3',
            data: [{
                code: 'RU'
            }]
        }]
    });

})();