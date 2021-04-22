var populationHistory = {
    // 1984, 1989, 1994, 1999, 2004, 2009, 2014, 2019
    se: [
        8336605, 8492964, 8780745, 8857874, 8993531, 9298515, 9696110, 10285453
    ],
    dk: [
        5111619, 5131594, 5206180, 5321799, 5404523, 5523095, 5643475, 5818553
    ],
    fi: [
        4881803, 4964371, 5088333, 5165474, 5228172, 5338871, 5461512, 5520314
    ],
    no: [
        4140099, 4226901, 4336613, 4461913, 4591910, 4828726, 5137232, 5347896
    ],
    is: [
        239511, 252852, 266021, 277381, 292074, 318499, 327386, 361313
    ],
    gl: [
        52700, 55300, 55500, 56100, 56911, 56323, 56295, 56225
    ],
    fo: [
        44891, 47166, 45856, 46436, 47600, 47808, 47960, 48678
    ]
};
var areaData = {
    se: 450295,
    no: 385207,
    dk: 42933,
    fi: 338440,
    is: 103000,
    fo: 1399,
    gl: 2166000
};
var topCities = {
    se: [
        ['Göteborg', 599011],
        ['Stockholm', 1515017],
        ['Malmö', 316588]
    ],
    no: [
        ['Bergen', 420000],
        ['Oslo', 1000467],
        ['Stavanger', 222697]
    ],
    fi: [
        ['Tampere', 341696],
        ['Helsinki', 1305893],
        ['Turku', 277677]
    ],
    dk: [
        ['Aarhus', 280534],
        ['Copenhagen', 1330993],
        ['Odense', 180302]
    ],
    is: [
        ['Kópavogur', 35966],
        ['Reykjavík', 124847],
        ['Hafnarfjörður', 29409]
    ],
    fo: [
        ['Klaksvík', 4681],
        ['Tórshavn', 12582],
        ['Hoyvík', 2951]
    ],
    gl: [
        ['Sisimiut', 5582],
        ['Nuuk', 18326],
        ['Ilulissat', 4670]
    ]
};

function getCurrentPopulation(country) {
    var len = populationHistory[country].length;
    return populationHistory[country][len - 1];
}

function getPopulationIncrease(country) {
    var initial = populationHistory[country][0];
    var current = getCurrentPopulation(country);
    return Math.round((current - initial) / initial * 1000) / 10;
}

function getCountryPopulationDensity(country) {
    return Math.round(
        getCurrentPopulation(country) / areaData[country] * 100
    ) / 100;
}

function getTopCities(country) {
    return topCities[country].map(function (cityData, i) {
        return {
            name: cityData[0],
            x: i,
            y: 1,
            z: cityData[1]
        };
    });
}

Highcharts.setOptions({
    title: {
        style: {
            fontFamily: 'Roboto, sans-serif'
        }
    },
    tooltip: {
        stickOnContact: true
    },
    accessibility: {
        landmarkVerbosity: 'one'
    },
    lang: {
        accessibility: {
            screenReaderSection: {
                beforeRegionLabel: ''
            }
        }
    }
});
var detailsOptions = {
    exporting: {
        enabled: false
    },
    credits: {
        enabled: false
    },
    legend: {
        enabled: false
    },
    yAxis: {
        visible: false,
        gridLineWidth: 0
    },
    xAxis: {
        lineColor: '#f0f0f0'
    },
    accessibility: {
        screenReaderSection: {
            beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{typeDescription}</div><div>{playAsSoundButton}</div><div>{xAxisDescription}</div><div>{yAxisDescription}</div>'
        }
    }
};
var miniOptions = Highcharts.merge(detailsOptions, {
    title: {
        style: {
            fontSize: '14px'
        }
    },
    accessibility: {
        keyboardNavigation: {
            enabled: false
        },
        screenReaderSection: {
            beforeChartFormat: '',
            afterChartFormat: ''
        },
        point: {
            valueDescriptionFormat: '{point.name} {value}.'
        }
    },
    colors: ['#FF7F79'],
    chart: {
        width: 150,
        type: 'solidgauge'
    },
    pane: {
        startAngle: 0,
        endAngle: 360,
        background: [{
            outerRadius: '115%',
            innerRadius: '95%',
            backgroundColor: Highcharts.color('#FDD089')
                .setOpacity(0.3)
                .get(),
            borderWidth: 0
        }]
    },
    plotOptions: {
        solidgauge: {
            linecap: 'round',
            stickyTracking: false,
            rounded: true,
            borderColor: '#FF5A52',
            borderWidth: 1,
            dataLabels: {
                borderWidth: 0,
                verticalAlign: 'middle',
                align: 'center',
                style: {
                    color: '#444444'
                }
            }
        }
    },
    tooltip: {
        enabled: false
    },
    yAxis: {
        min: 0
    }
});

var historyChart = Highcharts.chart('history-container', Highcharts.merge(detailsOptions, {
    accessibility: {
        announceNewData: {
            enabled: true,
            announcementFormatter: function (updatedSeries) {
                var country = updatedSeries[0].activeCountryName;
                return 'Showing details for ' + country + '.';
            }
        }
    },
    sonification: {
        enabled: true,
        masterVolume: 0.3,
        duration: 1700,
        defaultInstrumentOptions: {
            duration: 100
        }
    },
    title: {
        text: 'Population history'
    },
    chart: {
        type: 'spline'
    },
    series: [{
        color: '#EC5D55',
        name: 'Population',
        data: populationHistory.se.slice(0)
    }],
    xAxis: {
        categories: ['1984', '1989', '1994', '1999', '2004', '2009', '2014', '2019'],
        accessibility: {
            description: 'Time',
            rangeDescription: 'Range: 1984 to 2019'
        }
    },
    yAxis: {
        accessibility: {
            description: 'Population'
        }
    }
}));

var increaseChart = Highcharts.chart('increase-container', Highcharts.merge(miniOptions, {
    accessibility: {
        point: {
            valueSuffix: '%'
        }
    },
    title: {
        text: 'Population increase'
    },
    yAxis: {
        max: 60
    },
    series: [{
        dataLabels: {
            format: '{point.y}%',
            style: {
                fontSize: '15px'
            }
        },
        data: [{
            y: getPopulationIncrease('se'),
            radius: '115%',
            innerRadius: '95%',
            name: 'Population increase'
        }]
    }]
}));

var densityChart = Highcharts.chart('density-container', Highcharts.merge(miniOptions, {
    accessibility: {
        point: {
            valueSuffix: ' people per square kilometer'
        }
    },
    title: {
        text: 'Population density'
    },
    yAxis: {
        max: 150
    },
    series: [{
        dataLabels: {
            useHTML: true,
            format: '{point.y}<br>pop./km<sup>2</sup>',
            style: {
                textAlign: 'center',
                fontSize: '13px'
            }
        },
        data: [{
            y: getCountryPopulationDensity('se'),
            radius: '115%',
            innerRadius: '95%',
            name: 'Population density'
        }]
    }]
}));

var citiesChart = Highcharts.chart('cities-container', Highcharts.merge(detailsOptions, {
    title: {
        text: 'Most populated cities'
    },
    accessibility: {
        screenReaderSection: {
            beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{typeDescription}</div>'
        },
        typeDescription: 'Chart showing three circles representing cities, with the circle size representing population size.',
        point: {
            descriptionFormatter: function (point) {
                // Use different thousands sep from default to avoid screen reader
                // interpreting the numbers as separate.
                var formattedZ = Highcharts.numberFormat(point.z, 0, '.', ',');
                return point.name + ', ' + formattedZ + ' population.';
            }
        }
    },
    chart: {
        type: 'bubble'
    },
    xAxis: {
        visible: false,
        minPadding: 0.05,
        maxPadding: 0.05
    },
    colorAxis: {
        min: 0,
        minColor: '#F6815A',
        maxColor: '#DC4D45'
    },
    tooltip: {
        headerFormat: '',
        pointFormat: '<span style="color:{point.color}">●</span> <span style="font-size: 10px"> {point.name}</span><br/>Population: {point.z}',
        backgroundColor: 'rgba(255, 255, 255, 0.95)'
    },
    series: [{
        maxSize: 90,
        minSize: 20,
        dataLabels: {
            enabled: true,
            inside: false,
            verticalAlign: 'bottom',
            format: '{point.name}',
            style: {
                fontWeight: 'normal',
                fontSize: '12px'
            }
        },
        data: getTopCities('se')
    }]
}));


function updateDetails(countryCode, countryName) {
    historyChart.series[0].setData(
        populationHistory[countryCode].slice(0), false
    );
    historyChart.series[0].activeCountryName = countryName;
    historyChart.update({
        title: {
            text: 'Population history: ' + countryName
        }
    });
    increaseChart.series[0].points[0].update({
        y: getPopulationIncrease(countryCode)
    });
    densityChart.series[0].points[0].update({
        y: getCountryPopulationDensity(countryCode)
    });
    citiesChart.series[0].setData(getTopCities(countryCode));
}

function clickOnPoint(point) {
    var curSelected = point.series.currentSelectedPoint;
    if (curSelected) {
        curSelected.selectedStatus = '';
        curSelected.update({
            color: void 0
        });
    }
    point.series.currentSelectedPoint = point;
    point.selectedStatus = 'Selected.';
    point.update({
        color: {
            pattern: {
                path: 'M 0 1.5 L 5 1.5 M 0 4 L 5 4',
                backgroundColor: '#FDD089',
                color: '#FF8F99',
                width: 5,
                height: 5
            }
        }
    });

    updateDetails(point['hc-key'], point.name);
    document.getElementById('selected-country').value = point['hc-key'];
}

Highcharts.addEvent(Highcharts.Chart.prototype, 'afterViewData', function (table) {
    var formatCell = function (content) {
        return Highcharts.numberFormat(parseFloat(content), 0, '.', ' ');
    };

    var numberCells = table.getElementsByClassName('number');
    for (var i = 0; i < numberCells.length; ++i) {
        numberCells[i].textContent = formatCell(
            numberCells[i].textContent
        );
    }
});

var mapChart = Highcharts.mapChart('map-container', {
    title: {
        text: 'Population of 7 Nordic Countries'
    },
    subtitle: {
        text: 'Click on a country in the map to view population details in the dashboard.'
    },
    chart: {
        map: 'custom/nordic-countries'
    },
    accessibility: {
        keyboardNavigation: {
            seriesNavigation: {
                mode: 'serialize'
            }
        },
        screenReaderSection: {
            beforeChartFormat: '<{headingTagName}>{chartTitle}</{headingTagName}><div>{typeDescription}</div><div>{chartSubtitle}</div><div>{chartLongdesc}</div>'
        },
        point: {
            valueDescriptionFormat: '{xDescription}, {value} population. {point.selectedStatus}'
        }
    },
    xAxis: {
        title: {
            text: 'Country' // Visible in data table only
        },
        minRange: 4000
    },
    mapNavigation: {
        enabled: true,
        buttonOptions: {
            padding: 5,
            x: 1
        },
        enableDoubleClickZoom: false
    },
    colorAxis: {
        min: 0,
        max: 15000000,
        minColor: '#EDF1F8',
        maxColor: '#001E89'
    },
    exporting: {
        showTable: true,
        buttons: {
            contextButton: {
                align: 'left',
                text: 'Menu',
                symbolY: 12,
                y: 15
            }
        }
    },
    credits: {
        position: {
            align: 'left',
            x: 10,
            y: -20
        }
    },
    responsive: {
        rules: [{
            condition: {
                maxWidth: 650
            },
            chartOptions: {
                subtitle: {
                    text: ''
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            y: 5
                        }
                    }
                },
                credits: {
                    position: {
                        y: -5
                    }
                }
            }
        }, {
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                exporting: {
                    buttons: {
                        contextButton: {
                            text: ''
                        }
                    }
                }
            }
        }]
    },
    series: [{
        name: 'Population',
        cursor: 'pointer',
        borderColor: '#5A7597',
        point: {
            events: {
                click: function () {
                    clickOnPoint(this);
                }
            }
        },
        data: [
            ['se', getCurrentPopulation('se')],
            ['dk', getCurrentPopulation('dk')],
            ['fi', getCurrentPopulation('fi')],
            ['no', getCurrentPopulation('no')],
            ['is', getCurrentPopulation('is')],
            ['gl', getCurrentPopulation('gl')],
            ['fo', getCurrentPopulation('fo')]
        ],
        dataLabels: {
            enabled: true,
            color: '#FFFFFF',
            format: '{point.name}'
        }
    }]
});

document.getElementById('selected-country').onchange = function (e) {
    var countryCode = e.target.value;
    var point = mapChart.series[0].points.find(function (p) {
        return p['hc-key'] === countryCode;
    });
    clickOnPoint(point);
};

clickOnPoint(mapChart.series[0].points[0]);
