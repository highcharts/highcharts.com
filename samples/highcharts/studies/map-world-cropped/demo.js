/*
 * To do
 * - Create the TopoJSON map and put in in the map collection
 * - Use it in samples where it makes sense
 */


const getBBox = geometry => {
    let lonMin = Number.MAX_VALUE,
        lonMax = -Number.MAX_VALUE,
        latMin = Number.MAX_VALUE,
        latMax = -Number.MAX_VALUE;

    if (geometry.type === 'Polygon') {
        for (const polygon of geometry.coordinates) {
            for (const point of polygon) {
                lonMin = Math.min(lonMin, point[0]);
                lonMax = Math.max(lonMax, point[0]);
                latMin = Math.min(latMin, point[1]);
                latMax = Math.max(latMax, point[1]);
            }
        }

        const pad = 0.1;
        return {
            type: 'Polygon',
            coordinates: [
                [
                    [lonMax + pad, latMin - pad],
                    [lonMin - pad, latMin - pad],
                    [lonMin - pad, latMax + pad],
                    [lonMax + pad, latMax + pad]
                ]
            ]
        };
    }
};

(async () => {

    const topology = await fetch(
        'https://code.highcharts.com/mapdata/custom/world.topo.json'
    ).then(response => response.json());

    // Move these shapes towards center
    const toBeMoved = [
        'AS', 'FJ', 'FM', 'KI', 'MH', 'NR', 'SB', 'TO', 'TV', 'UM', 'VU', 'WS'
    ];

    /* eslint-disable-next-line no-underscore-dangle */
    const topo2geo = Highcharts.topo2geo;


    // Remove minor parts of some countries
    // Hawaii, USA
    topology.objects.default.geometries.find(g => g.id === 'US').arcs
        .splice(36, 1);
    topology.objects.default.geometries.find(g => g.id === 'US').arcs
        .splice(31, 2);

    // Aleutes, USA
    topology.objects.default.geometries.find(g => g.id === 'US').arcs
        .splice(23, 1);

    // New Caledonia, France
    topology.objects.default.geometries.find(g => g.id === 'FR').arcs
        .splice(2, 1);

    // Centers
    const cn = topology.objects.default.geometries.find(g => g.id === 'CN');
    cn.properties['hc-middle-x'] = 0.65;

    const fr = topology.objects.default.geometries.find(g => g.id === 'FR');
    fr.properties['hc-middle-x'] = 0.53;

    const ind = topology.objects.default.geometries.find(g => g.id === 'IN');
    ind.properties['hc-middle-y'] = 0.6;

    const uk = topology.objects.default.geometries.find(g => g.id === 'GB');
    uk.properties['hc-middle-x'] = 0.71;
    uk.properties['hc-middle-y'] = 0.055;

    const ru = topology.objects.default.geometries.find(g => g.id === 'RU');
    ru.properties['hc-middle-x'] = 0.65;
    ru.properties['hc-middle-y'] = 0.4;

    const geoJSON = topo2geo(topology);

    const insets = [];

    toBeMoved.forEach(code => {
        const p = geoJSON.features.find(p => p.properties['iso-a2'] === code);

        if (p) {
            const geoBounds = getBBox(p.geometry);

            // Approximately retain the latitude
            const lat = p.geometry.coordinates[0][0][1],
                y = -lat * 50 / 75 + 55;

            const lon = p.geometry.coordinates[0][0][0],
                x = lon > 0 ? 99 + (lon - 180) / 20 : (lon + 180) / 5;

            const box = geoBounds.coordinates[0],
                width = (box[0][0] - box[1][0]) / 360 * 100,
                height = (box[2][1] - box[1][1]) / 180 * 100;

            insets.push({
                borderWidth: 0,
                padding: 0,
                id: code,
                field: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [x, y],
                            [x + width, y],
                            [x + width, y + height],
                            [x, y + height]
                        ]
                    ]
                },
                geoBounds
            });

            const g = topology.objects.default.geometries
                .find(g => g.id === code);
            if (g) {
                delete g.properties['hc-middle-x'];
                delete g.properties['hc-middle-y'];
                // g.properties.lon = lon;
                // g.properties.lat = lat;
            }
        }


    });

    const data = await fetch(
        'https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/world-population.json'
    ).then(response => response.json());

    /*
    toBeMoved.forEach(code => {
        const p = data.find(p => p.code === code);
        if (p) {
            p.color = 'orange';
        }
    });
    */

    Highcharts.mapChart('container', {
        chart: {
            plotBorderWidth: 1,
            map: topology,
            height: '65%'
        },

        title: {
            text: 'Cropped map',
            align: 'left'
        },

        subtitle: {
            text: 'Study for a separate map (world-cropped.topo.json) where Pacific islands are inset to allow a better fit for the continents',
            align: 'left'
        },

        accessibility: {
            description: 'We see how China and India by far are the countries with the largest population.'
        },

        legend: {
            enabled: false
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },

        mapView: {
            insets
        },

        colorAxis: {
            min: 1,
            max: 1000,
            type: 'logarithmic'
        },

        series: [
            /*
            {
                data: data,
                mapData: topology,
                joinBy: ['iso-a2', 'code'],
                name: 'Population density',
                tooltip: {
                    valueSuffix: '/km²'
                }
            }
            */
            {
                name: 'Countries',
                color: '#E0E0E0',
                enableMouseTracking: false
            }, {
                type: 'mapbubble',
                name: 'Population 2016',
                joinBy: ['iso-a3', 'code3'],
                data: data,
                minSize: 4,
                maxSize: '12%',
                tooltip: {
                    pointFormat: '{point.properties.name} ({point.properties.hc-a2}): {point.z} thousands'
                }
            }
        ]
    });
})();