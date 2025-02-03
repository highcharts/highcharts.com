async function setupDashboard() {
    const gpxTestUrl = 'https://cdn.jsdelivr.net/gh/highcharts/highcharts@a3a4f1d2f1/samples/data/dashboards/activity.gpx';
    const gpxDataUrl = 'https://www.highcharts.com/samples/data/dashboards/activity.gpx';

    // Load GPX data from server
    const gpxData = await loadGpxData(gpxTestUrl);
    if (!gpxData) {
        return;
    }

    // Create the dashboard
    Dashboards.board('container', {
        dataPool: {
            connectors: [{
                id: 'trackpoints-connector',
                type: 'JSON',
                options: {
                    firstRowAsNames: false,
                    columnNames: [
                        'time', 'elevation', 'hr', 'latitude',
                        'longitude', 'speed', 'distance'
                    ],
                    data: gpxData.all
                }
            },
            {
                id: 'summary-connector',
                type: 'JSON',
                options: {
                    firstRowAsNames: false,
                    columnNames: ['distance', 'speed', 'elevation', 'hr'],
                    data: gpxData.summary
                }
            }]
        },
        gui: {
            layouts: [{
                id: 'layout-1',
                rows: [{
                    cells: [{
                        responsive: {
                            small: {
                                width: '100%'
                            },
                            medium: {
                                width: '50%'
                            },
                            large: {
                                width: '50%'
                            }
                        },
                        id: 'activity-map' // Map
                    },
                    {
                        responsive: {
                            small: {
                                width: '100%'
                            },
                            medium: {
                                width: '50%'
                            },
                            large: {
                                width: '50%'
                            }
                        },
                        id: 'activity-datagrid'
                    }]
                }, {
                    cells: [{
                        id: 'activity-chart' // Line and area chart
                    }]
                }]
            }]
        },
        components: [
            {
                renderTo: 'activity-map',
                type: 'Highcharts',
                chartConstructor: 'mapChart',
                connector: 'trackpoints-connector',
                chartOptions: {
                    title: {
                        text: ''
                    },
                    styleMode: {
                        enabled: false
                    },
                    animation: false,
                    navigation: {
                        buttonOptions: {
                            align: 'left',
                            theme: {
                                stroke: '#e6e6e6'
                            }
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    mapNavigation: {
                        enabled: true,
                        buttonOptions: {
                            alignTo: 'spacingBox'
                        }
                    },
                    mapView: {
                        center: gpxData.mapCenter,
                        zoom: 12.5
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        format: '{series.name}'
                    },
                    series: [
                        // Base layer map
                        {
                            type: 'tiledwebmap',
                            name: 'Map',
                            provider: {
                                type: 'OpenStreetMap',
                                theme: 'OpenTopoMap'
                            },
                            showInLegend: false
                        },
                        // Trail map on top of base layer
                        {
                            name: 'Trail Activity',
                            type: 'mapline',
                            data: [{
                                geometry: {
                                    type: 'LineString',
                                    coordinates: gpxData.mapPoints
                                }
                            }],
                            showInLegend: false
                        }
                    ]
                }
            },
            {
                renderTo: 'activity-datagrid',
                type: 'DataGrid',
                title: {
                    text: 'Summary',
                    style: {
                        textAlign: 'center'
                    }
                },
                connector: {
                    id: 'summary-connector'
                },
                dataGridOptions: {
                    editable: false,
                    columns: {
                        distance: {
                            headerFormat: 'Distance (km)',
                            dataIndex: 'distance'
                        },
                        speed: {
                            headerFormat: 'Speed (km/h)',
                            dataIndex: 'speed'
                        },
                        elevation: {
                            headerFormat: 'Elevation (m)',
                            dataIndex: 'elevation'
                        },
                        hr: {
                            headerFormat: 'Heart Rate (bpm)',
                            dataIndex: 'hr'
                        }
                    }
                }
            },
            {
                renderTo: 'activity-chart',
                type: 'Highcharts',

                connector: {
                    id: 'trackpoints-connector',
                    columnAssignment: [{
                        seriesId: 'elevation-series',
                        data: ['distance', 'elevation']
                    },
                    {
                        seriesId: 'speed-series',
                        data: ['distance', 'speed']
                    },
                    {
                        seriesId: 'heartrate-series',
                        data: ['distance', 'hr']
                    }]
                },
                chartOptions: {
                    title: {
                        text: ''
                    },
                    xAxis: [{
                        title: {
                            text: 'Distance (km)'
                        }
                    }],
                    yAxis: [{
                        title: {
                            text: 'Elevation (m)'
                        },
                        opposite: false,
                        labels: {
                            enabled: true,
                            format: '{value} m'
                        }
                    },
                    {
                        // Heart rate
                        visible: false
                    },
                    {
                        // Speed
                        visible: false
                    }],
                    tooltip: {
                        shared: true,
                        formatter: function () {
                            let tooltip = '<b>Distance:</b> ' +
                                this.x.toFixed(2) + ' km<br/>';

                            this.points.forEach(function (point) {
                                tooltip += '<b>' + point.series.name +
                                    '</b>: ' + point.y + ' ' +
                                    point.series.options.tooltipValueSuffix +
                                    '<br/>';
                            });
                            return tooltip;
                        }
                    },
                    series: [{
                        name: 'Elevation',
                        id: 'elevation-series',
                        yAxis: 0,
                        type: 'area',
                        tooltipValueSuffix: 'm'
                    },
                    {
                        name: 'Heart Rate',
                        id: 'heartrate-series',
                        yAxis: 1,
                        tooltipValueSuffix: 'bpm'
                    },
                    {
                        name: 'Speed',
                        id: 'speed-series',
                        yAxis: 2,
                        tooltipValueSuffix: 'km/h'
                    }]
                }
            }
        ]
    }, true);

    // Get the CPX data from the server
    async function loadGpxData(url) {
        // Get the GPX data
        let response;
        try {
            response = await fetch(url);
        } catch (err) {
            console.error(err);
            return;
        }

        if (response.ok) {
            const xmlData = await response.text();

            return parseGpxData(xmlData);
        }
        console.error('Failed to parse GPX data');
    }

    // Parse GPX data
    function parseGpxData(xmlData) {
        function getNodeText(node, name) {
            const el = node.getElementsByTagName(name);

            return el[0].textContent;
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlData, 'application/xml');

        // All recorded points
        const trackPoints = doc.getElementsByTagName('trkpt');

        let metersSum = 0;
        let prevTime = 0;
        let prevLat;
        let prevLon;
        let prevWholeKm = 0;
        let speedSum = 0;
        let cnt = 0;

        // All points in the track (for chart)
        const allPoints = [];

        // Kilometer boundary points (for DataGrid)
        const kmPoints = [];

        // Map points
        const mapPoints = [];

        for (const point of trackPoints) {
            // Location
            const lat = Number(point.getAttribute('lat'));
            const lon = Number(point.getAttribute('lon'));

            // Timestamp
            const tsIso = getNodeText(point, 'time');
            const time = new Date(tsIso).getTime();

            // Elevation
            const elevation = Number(getNodeText(point, 'ele'));

            // Heart rate
            const heartRate = Number(getNodeText(point, 'gpxtpx:hr'));

            // Create point
            const distance = prevLat > 0 ?
                calculateDistance(lat, lon, prevLat, prevLon) : 0; // meters
            const speed = calculateSpeed(distance, time - prevTime);

            // Points for complete trail (chart)
            const averageSpeed =
                Math.round((speedSum / cnt) * 100) / 100;
            metersSum += distance;

            allPoints.push(
                [
                    time, elevation, heartRate, lat, lon,
                    averageSpeed,
                    metersSum / 1000
                ]);

            // Map points
            mapPoints.push([lon, lat]);

            // Datagrid points (one per km)
            const currentWholeKm = Math.trunc(metersSum / 1000);
            if (currentWholeKm > prevWholeKm) {
                prevWholeKm = currentWholeKm;
                kmPoints.push(
                    [currentWholeKm, averageSpeed, elevation, heartRate]
                );
            }

            // Update previous values
            prevTime = time;
            prevLat = lat;
            prevLon = lon;

            // Next point
            speedSum += speed;
            cnt++;
        }

        return {
            all: allPoints,
            summary: kmPoints,
            mapPoints: mapPoints,
            mapCenter: [prevLon, prevLat]
        };
    }

    // Calculate distance between two points using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Calculate speed in km/h
    function calculateSpeed(distance, timeDifference) {
        const timeHours = timeDifference / (1000 * 3600);

        return (distance / 1000) / timeHours;
    }
}

// Launch the application
setupDashboard();
