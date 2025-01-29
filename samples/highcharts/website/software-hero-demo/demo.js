const colors = [
    '#F0682E', '#A541C3', '#089FDA',
    '#10B981', '#8791FF',  '#F59E0B', '#3B82F6',
    '#F87171', '#A7F3D0', '#818CF8', '#F472B6'
];

let chart;
let chartNum = 1;
let controlNum = 0;
let alpha, alphaSlider, beta, betaSlider, depth, depthSlider;
let endAngle, endAngleSlider, innerSize,
    innerSizeSlider, markerRadius, markerRadiusSlider;
let borderRadius, borderRadiusSlider, innerSizePie,
    innerSizePieSlider, slices, slicesSlider;
let width, widthSlider, borderWidth, borderWidthSlider,
    borderRadiusCol, borderRadiusColSlider;

// for pie
const data = [
    { y: 10 },
    { y: 20 },
    { y: 40 },
    { y: 5 },
    { y: 10 },
    { y: 15 },
    { y: 40 },
    { y: 5 },
    { y: 10 },
    { y: 15 },
    { y: 10 },
    { y: 20 },
    { y: 40 },
    { y: 5 },
    { y: 10 },
    { y: 15 },
    { y: 40 },
    { y: 5 },
    { y: 10 },
    { y: 15 }
];
let tempData = [];

// for item
let centerX;
let modeNum = 0;
// deskptop, mobile x centers
// (not x and y, but x and x)
const centers = [
    ['50%', '50%'], // < 11
    ['49%', '47%'], // 11 - 20
    ['48%', '43%'] // 21 - 30
];

const area = {
    chart: {
        type: 'area',
        backgroundColor: 'black',
        options3d: {
            enabled: true,
            alpha: 15,
            beta: 30,
            depth: 200,
            viewDistance: 25
        }
    },
    exporting: {
        enabled: false
    },
    credits: {
        enabled: false
    },
    title: {
        text: ''
    },
    accessibility: {
        description: 'The chart is showing the shapes of three mountain ' +
            'ranges as three area line series laid out in 3D behind each ' +
            'other.',
        keyboardNavigation: {
            seriesNavigation: {
                mode: 'serialize'
            }
        }
    },
    lang: {
        accessibility: {
            axis: {
                xAxisDescriptionPlural: 'The chart has 3 unlabelled X axes, ' +
                    'one for each series.'
            }
        }
    },
    legend: {
        enabled: false
    },
    yAxis: {
        title: {
            // text: 'Height Above Sea Level',
            text: '',
            x: -40
        },
        labels: {
            format: '{value:,.0f} MAMSL',
            style: {
                color: '#ACABBA'
            }
        },
        gridLineDashStyle: 'Dash'
    },
    xAxis: [{
        visible: false
    }, {
        visible: false
    }, {
        visible: false
    }],
    plotOptions: {
        area: {
            depth: 100,
            lineWidth: 3,
            marker: {
                enabled: false
            },
            states: {
                inactive: {
                    enabled: false
                }
            }
        }
    },
    tooltip: {
        valueSuffix: ' MAMSL'
    },
    series: [{
        name: 'Tatra Mountains visible from Rusinowa polana',
        lineColor: 'rgb(240, 104, 26)',
        color: 'rgb(240, 104, 26)',
        fillColor: 'rgba(240, 104, 26, 0.8)',
        data: [
            ['Murań', 1890],
            ['Nowy Wierch', 2009],
            ['Hawrań', 2152],
            ['Płaczliwa Skała', 2142],
            ['Szalony Wierch', 2061],
            ['Karczmarski Wierch', 1438],
            ['Jagnięcy Szczyt', 2230],
            ['Czerwona Turnia', 2284],
            ['Kołowy Szczyt', 2418],
            ['Czarny Szczyt', 2429],
            ['Baranie Rogi', 2526],
            ['Śnieżny Szczyt', 2465],
            ['Lodowy Szczyt', 2627],
            ['Lodowa Kopa', 2602],
            ['Szeroka Jaworzyńska', 2210],
            ['Horwacki Wierch', 1902],
            ['Spismichałowa Czuba', 2012],
            ['Zielona Czuba', 2130],
            ['Wielicki Szczyt', 2318],
            ['Gerlach', 2655],
            ['Batyżowiecki Szczyt', 2448],
            ['Kaczy Szczyt', 2395],
            ['Zmarzły Szczyt', 2390],
            ['Kończysta', 2538],
            ['Młynarz', 2170],
            ['Ganek', 2462],
            ['Wysoka', 2547],
            ['Ciężki Szczyt', 2520],
            ['Rysy', 2503],
            ['Żabi Mnich', 2146],
            ['Żabi Koń', 2291],
            ['Żabia Turnia Mięguszowiecka', 2335],
            ['Wołowa Turnia', 2373]
        ]
    }, {
        xAxis: 1,
        lineColor: 'rgb(165, 65, 195)',
        color: 'rgb(165, 65, 195)',
        fillColor: 'rgba(165, 65, 195, 0.8)',
        name: 'Dachstein panorama seen from Krippenstein',
        data: [
            ['Kufstein', 2049],
            ['Hohe Wildstelle', 2746],
            ['Kleiner Miesberg', 2173],
            ['Großer Miesberg', 2202],
            ['Hochstein', 2543],
            ['Lackner Miesberg', 2232],
            ['Wasenspitze', 2257],
            ['Sinabell', 2349],
            ['Feister Scharte', 2198],
            ['Eselstein', 2556],
            ['Landfriedstein', 2536],
            ['Scheichenspitz', 2667],
            ['Schmiedstock', 2634],
            ['Gamsfeldspitze', 2611],
            ['Edelgriess', 2305],
            ['Koppenkarstein', 2863],
            ['Niederer Gjaidstein', 2483],
            ['Hoher Gjaidstein', 2794],
            ['Hoher Dachstein', 2995],
            ['Niederer Dachstein', 2934],
            ['Hohes Kreuz', 2837],
            ['Hoher Ochsenkogel', 2513]
        ]
    }, {
        xAxis: 2,
        lineColor: 'rgb(8, 159, 218)',
        color: 'rgb(8, 159, 218)',
        fillColor: 'rgba(8, 159, 218)',
        name: 'Panorama from Col Des Mines',
        data: [
            ['Combin de la Tsessette', 4141],
            ['Grand Combin de Grafeneire', 4314],
            ['Combin de Corbassière', 3716],
            ['Petit Combin', 3672],
            ['Pointe de Boveire', 3212],
            ['Grand Aget', 3133],
            ['Mont Rogneux', 3084],
            ['Dents du Grand Lé', 2884],
            ['Monts Telliers', 2951],
            ['Grand Golliat', 3238],
            ['Mont Grande Rochère', 3326],
            ['Mont de la Fouly', 2871],
            ['Tête de la Payanne', 2452],
            ['Pointe Allobrogia', 3172],
            ['Six Blanc', 2334],
            ['Mont Dolent', 3820],
            ['Aiguille de Triolet', 3870],
            ['Le Tour Noir', 3836],
            ['Aiguille de l\'A Neuve', 3753],
            ['Aiguille d\'Argentière', 3900],
            ['Aiguille du Chardonnet', 3824],
            ['Aiguille du Tour', 3540],
            ['Aiguille du Pissoir', 3440],
            ['Le Catogne', 2598],
            ['Pointe de Prosom', 2762],
            ['Pointe Ronde', 2700],
            ['Mont Buet', 3096],
            ['Le Cheval Blanc', 2831],
            ['Pointe de la Finive', 2838],
            ['Pic de Tenneverge', 2985],
            ['Pointe d\'Aboillon', 2819],
            ['Tour Sallière', 3220],
            ['Le Dôme', 3138],
            ['Haute Cime', 3257],
            ['Pierre Avoi', 2473],
            ['Cime de l\'Est', 3178]
        ]
    }],
    responsive: {
        rules: [{
            condition: {
                maxWidth: 408
            },
            chartOptions: {
                chart: {
                    height: '100%'
                }
            }
        },
        {
            condition: {
                minWidth: 409
            },
            chartOptions: {
                chart: {
                    height: '50%'
                }
            }
        }]
    }
};

const item = {
    chart: {
        margin: 0,
        spacing: 0,
        backgroundColor: 'transparent',
        events: {
            load: function () {
                const chart = this;
                if (chart.chartWidth < 550) {
                    modeNum = 1;
                }

            }
        }
    },
    credits: {
        enabled: false
    },
    exporting: {
        enabled: false
    },
    title: {
        text: ''
    },
    legend: {
        enabled: false
    },
    plotOptions: {
        item: {
            // colorByPoint: true,
            color: 'transparent',
            borderWidth: 2,
            marker: {
                radius: 6
            },
            startAngle: -90,
            endAngle: 270,
            innerSize: '70%',
            center: ['50%', '35%'],
            size: '70%',
            dataLabels: {
                enabled: false
            }
        }
    },
    series: [
        {
            type: 'item',
            data: [
                {
                    y: 150,
                    color: 'transparent',
                    borderColor: colors[0]

                },
                {
                    y: 150,
                    color: 'transparent',
                    borderColor: colors[1]

                },
                {
                    y: 150,
                    color: 'transparent',
                    borderColor: colors[2]

                }
            ]
        }
    ]
};


const pie = {
    chart: {
        margin: 0,
        spacing: 0,
        backgroundColor: 'transparent'
    },
    credits: {
        enabled: false
    },
    colors: colors,
    exporting: {
        enabled: false
    },
    title: {
        text: ''
    },
    legend: {
        enabled: false
    },
    plotOptions: {
        pie: {
            borderRadius: 10,
            startAngle: 0,
            borderColor: 'transparent',
            innerSize: '0%',
            center: ['50%', '40%'],
            size: '75%',
            dataLabels: {
                enabled: false,
                distance: 10
            }
        }
    },
    series: [
        {
            type: 'pie',
            data: [
                { y: 10 },
                { y: 20 },
                { y: 40 }
                // { y: 5 },
                // { y: 10 },
                // { y: 15 }
            ]
        }
    ]
};

const column = {
    chart: {
        backgroundColor: 'transparent',
        events: {
            load: function () {
                const chart = this;
                if (chart.chartWidth <= 600) {
                    chart.update({
                        plotOptions: {
                            column: {
                                pointWidth: 45
                            }
                        }
                    });
                }
            }
        }
    },
    credits: {
        enabled: false
    },
    exporting: {
        enabled: false
    },
    title: {
        text: ''
    },
    colors: colors,
    legend: {
        enabled: false
    },
    yAxis: [{
        labels: {
            enabled: false
        },
        title: '',
        visible: true,
        gridLineDashStyle: 'dash',
        gridLineColor: '#ACABBA',
        height: '80%',
        plotLines: [],
        min: 0,
        max: 50
    }],
    plotOptions: {
        column: {
            colorByPoint: true,
            pointWidth: 90,
            borderRadius: 5,
            borderWidth: 0
        }
    },
    series: [
        {
            type: 'column',
            animation: {
                defer: 500
            },
            data: [
                {
                    y: 10,
                    borderColor: Highcharts.color(
                        colors[0]
                    ).brighten(0.2).get()
                },
                {
                    y: 20,
                    borderColor: Highcharts.color(
                        colors[1]
                    ).brighten(0.2).get()
                },
                {
                    y: 40,
                    borderColor: Highcharts.color(
                        colors[2]
                    ).brighten(0.2).get()
                },
                {
                    y: 5,
                    borderColor: Highcharts.color(
                        colors[3]
                    ).brighten(0.2).get()
                },
                {
                    y: 10,
                    borderColor: Highcharts.color(
                        colors[4]
                    ).brighten(0.2).get()
                },
                {
                    y: 15,
                    borderColor: Highcharts.color(
                        colors[5]
                    ).brighten(0.2).get()
                }
            ],
            zones: [],
            zoneAxis: 'y'
        }
    ]
};

const charts = [
    {
        chart: area,
        controls: ['alpha angle', 'beta angle', 'depth'],
        suffixes: [
            ['°', 'degrees'],
            ['°', 'degrees'],
            ['', '']
        ],
        title: '3D Area Chart',
        description: `<p>3D Area Chart</p><div>A purely decorative 
        3D area chart showing the shapes of three mountain 
        ranges as three area line series laid out in 3D behind each.</div>`
    },
    {
        chart: item,
        controls: ['end angle', 'inner size', 'marker radius'],
        suffixes: [
            ['°', 'degrees'],
            ['%', 'percent'],
            ['', 'pixels']
        ],
        title: 'Item Chart',
        description: `<p>Item Chart</p> <div>A purely decorative 
        item chart showcasing various item chart options. </div>`
    },
    {
        chart: pie,
        title: 'Pie Chart',
        controls: ['border radius', 'inner size', 'slices'],
        suffixes: [
            ['', 'pixels'],
            ['%', 'percent'],
            ['', 'slices']
        ],
        description: `<p>Pie Chart</p>
        <div>A purely decorative 
        pie chart showcasing various pie chart options.</div>`
    },
    {
        chart: column,
        title: 'Column Chart',
        controls: ['width', 'border width', 'border radius'],
        suffixes: [
            ['', 'pixels'],
            ['', 'pixels'],
            ['', 'pixels']
        ],
        description: `<p>Bar Chart Race</p>
         <div>A purely decorative 
        column chart showcasing various column chart options.</div>`
    }
];
// updates the values in the chart
function updateChart(textID, sliderID, value) {
    value = parseFloat(value);
    const suffix = charts[chartNum].suffixes[controlNum][0];

    switch (textID) {
    // 3d area
    case 'alpha':
        chart.update({
            chart: {
                options3d: {
                    alpha: parseFloat(value)
                }
            }
        }, false);
        break;
    case 'beta':
        chart.update({
            chart: {
                options3d: {
                    beta: parseFloat(value)
                }
            }
        }, false);
        break;
    case 'depth':
        chart.update({
            chart: {
                options3d: {
                    depth: parseFloat(value)
                }
            }
        }, false);
        break;
    // item
    case 'endAngle':
        chart.update({
            plotOptions: {
                item: {
                    endAngle: value
                }
            }
        }, false);
        break;
    case 'innerSize':
        chart.update({
            plotOptions: {
                item: {
                    innerSize: value + '%'
                }
            }
        }, false);
        break;
    case 'markerRadius':
        if (value < 11) {
            centerX = centers[0][modeNum];
        } else if (value >= 11 && value < 21) {
            centerX = centers[1][modeNum];
        } else if (value >= 21 && value < 31) {
            centerX = centers[2][modeNum];
        } else if (value >= 31 && value < 41) {
            centerX = centers[3][modeNum];
        } else if (value >= 41 && value < 49) {
            centerX = centers[4][modeNum];
        } else {
            centerX = centers[5][modeNum];
        }

        chart.update({
            plotOptions: {
                item: {
                    marker: {
                        radius: value
                    },
                    center: [centerX, '35%']
                }
            }
        }, false);
        break;
    // pie
    case 'borderRadius':
        chart.update({
            plotOptions: {
                pie: {
                    borderRadius: value
                }
            }
        }, false);
        break;
    case 'innerSizePie':
        chart.update({
            plotOptions: {
                pie: {
                    innerSize: value + '%'
                }
            }
        }, false);
        break;
    case 'slices':
        tempData = data.slice(0, value);
        chart.series[0].update({
            data: tempData
        });
        break;
    // column
    case 'width':
        chart.update({
            plotOptions: {
                column: {
                    pointWidth: value
                }
            }
        });
        break;
    case 'borderWidth':
        chart.update({
            plotOptions: {
                column: {
                    borderWidth: value
                }
            }
        });
        break;
    case 'borderRadiusCol':
        chart.update({
            plotOptions: {
                column: {
                    borderRadius: value
                }
            }
        }, false);
        break;
    default:
        break;
    }

    // update the display value
    document.getElementById(
        textID
    ).value = value + suffix;
    // update the slider value
    document.getElementById(
        sliderID
    ).value = value;

}

// shows the values on the controls
function showValues(control) {
    switch (control) {
    // 3d area
    case 'area':
        alpha.value = chart.options.chart.options3d.alpha + '°';
        alphaSlider.value = chart.options.chart.options3d.alpha;
        alphaSlider.setAttribute(
            'aria-valuetext', alphaSlider.value +
            ' degrees'
        );
        beta.value = chart.options.chart.options3d.beta + '°';
        betaSlider.value = chart.options.chart.options3d.beta;
        betaSlider.setAttribute(
            'aria-valuetext', betaSlider.value +
            ' degrees'
        );
        depth.value = chart.options.chart.options3d.depth;
        depthSlider.value = chart.options.chart.options3d.depth;
        depthSlider.setAttribute(
            'aria-valuetext', depthSlider.value
        );
        break;
    // item
    case 'item':
        endAngle.value = chart.options.plotOptions.item.endAngle + '°';
        endAngleSlider.value = chart.options.plotOptions.item.endAngle;
        endAngleSlider.setAttribute(
            'aria-valuetext', endAngleSlider.value +
            ' degrees'
        );
        innerSize.value = chart.options.plotOptions.item.innerSize;
        innerSizeSlider.value = chart.options.plotOptions.item.innerSize;
        innerSizeSlider.setAttribute(
            'aria-valuetext', innerSizeSlider.value +
            ' percent'
        );
        markerRadius.value = chart.options.plotOptions.item.marker.radius;
        markerRadiusSlider.value = chart.options.plotOptions.item.marker.radius;
        markerRadiusSlider.setAttribute(
            'aria-valuetext', markerRadiusSlider.value +
            ' pixels'
        );
        break;
    // pie
    case 'pie':
        borderRadius.value = chart.options.plotOptions.pie.borderRadius;
        borderRadiusSlider.value = chart.options.plotOptions.pie.borderRadius;
        borderRadiusSlider.setAttribute(
            'aria-valuetext', borderRadiusSlider.value +
            ' pixels'
        );
        innerSizePie.value = chart.options.plotOptions.pie.innerSize;
        innerSizePieSlider.value = chart.options.plotOptions.pie.innerSize;
        innerSizePieSlider.setAttribute(
            'aria-valuetext', innerSizePieSlider.value +
            ' percent'
        );
        slices.value = 3;
        slicesSlider.value = 3;
        slicesSlider.setAttribute(
            'aria-valuetext', slicesSlider.value +
            ' slices'
        );
        break;
    // column
    case 'column':
        width.value = chart.options.plotOptions.column.pointWidth;
        widthSlider.value = chart.options.plotOptions.column.pointWidth;
        widthSlider.setAttribute(
            'aria-valuetext', widthSlider.value +
            ' pixels'
        );
        borderWidth.value = chart.options.plotOptions.column.borderWidth;
        borderWidthSlider.value = chart.options.plotOptions.column.borderWidth;
        borderWidthSlider.setAttribute(
            'aria-valuetext', borderWidthSlider.value +
            ' pixels'
        );
        borderRadiusCol.value = chart.options.plotOptions.column.borderRadius;
        borderRadiusColSlider.value =
            chart.options.plotOptions.column.borderRadius;
        borderRadiusColSlider.setAttribute(
            'aria-valuetext', borderRadiusColSlider.value +
            ' pixels'
        );
        break;
    default:
        break;
    }
    chart.redraw(false);
}

function createChart(chartType) {
    chart = Highcharts.chart('container', chartType);
    getChartDescription(chartNum);
    announce(chartNum);
}

function getChartDescription(num) {

    const outerContainer = document.getElementById('outer-container');

    if (document.getElementById('chart-description') !== null) {
        document.getElementById('chart-description').remove();
    }

    const description = document.createElement('div');
    description.setAttribute('aria-hidden', 'false');
    description.setAttribute('id', 'chart-description');
    description.innerHTML = charts[num].description;

    // Append the new div to the container
    outerContainer.prepend(description);
    outerContainer.setAttribute('aria-describedby', 'chart-description');

}

function announce(type, value) {
    const announce = document.getElementById('announce');
    announce.textContent = '';
    let thingToAnnounce;
    const newElem = document.createElement('span');

    if (type === 'chart') {
        thingToAnnounce = 'new Chart: ' + charts[chartNum].title;

    } else if (type === 'data') {
        const suffix = charts[chartNum].suffixes[controlNum][1];
        thingToAnnounce = charts[chartNum].controls[controlNum] +
            ' new value: ' + value + ' ' + suffix;
    }
    newElem.textContent = thingToAnnounce;
    announce.appendChild(newElem);
}

// sliders
document.querySelectorAll(
    '.controls .control .input-display input[type="range"]'
).forEach(input => input.addEventListener('input', e => {
    const activeSliderID = e.target.id;
    const sliderValue = e.target.value;
    const itemToChange = activeSliderID.replace('Slider', '');
    controlNum = e.target.dataset.control;

    updateChart(itemToChange, activeSliderID, sliderValue);
    chart.redraw(false);
}));

document.querySelectorAll(
    '.controls .control .input-display input[type="range"]'
).forEach(input => input.addEventListener('change', e => {
    announce('data', e.target.value);
}));

// text inputs
let currentValue;
document.querySelectorAll(
    '.controls .control .input-display input[type="text"]'
).forEach(input => input.addEventListener('click', e => {
    currentValue = e.target.value;
}));

document.querySelectorAll(
    '.controls .control .input-display input[type="text"]'
).forEach(input => input.addEventListener('change', e => {
    const targetID = e.target.id;
    const targetValue = parseInt(e.target.value, 10);
    const min = document.getElementById(targetID + 'Slider').min;
    const max = document.getElementById(targetID + 'Slider').max;
    controlNum = e.target.dataset.control;

    if (!isNaN(targetValue) && targetValue >= min && targetValue <= max) {
        updateChart(targetID, targetID + 'Slider', targetValue);
    } else {

        e.target.value = currentValue;
    }

    announce('data', targetValue);

    chart.redraw(false);
}));


// tabs
document.querySelectorAll(
    '.tab a'
).forEach(tab => tab.addEventListener('click', e => {
    e.preventDefault();
    const id = e.target.parentElement.id;
    chartNum = e.target.parentElement.dataset.chart;
    // remove the active class from all tabs
    document.querySelectorAll(
        '.tab'
    ).forEach(tab => tab.classList.remove('active'));
    // add the active class to the clicked tab
    document.getElementById(id).classList.add('active');
    // remove the active class from all controls
    document.querySelectorAll(
        '.controls'
    ).forEach(control => control.classList.remove('active'));
    document.getElementById(
        'controls-' + id
    ).classList.add('active');
    createChart(charts[chartNum].chart);
    showValues(id);
}));

document.addEventListener('DOMContentLoaded', function () {
    // 3d area
    alpha = document.getElementById('alpha');
    alphaSlider = document.getElementById('alphaSlider');
    beta = document.getElementById('beta');
    betaSlider = document.getElementById('betaSlider');
    depth = document.getElementById('depth');
    depthSlider = document.getElementById('depthSlider');
    // item
    endAngle = document.getElementById('endAngle');
    endAngleSlider = document.getElementById('endAngleSlider');
    innerSize = document.getElementById('innerSize');
    innerSizeSlider = document.getElementById('innerSizeSlider');
    markerRadius = document.getElementById('markerRadius');
    markerRadiusSlider = document.getElementById('markerRadiusSlider');
    // pie
    borderRadius = document.getElementById('borderRadius');
    borderRadiusSlider = document.getElementById('borderRadiusSlider');
    innerSizePie = document.getElementById('innerSizePie');
    innerSizePieSlider = document.getElementById('innerSizePieSlider');
    slices = document.getElementById('slices');
    slicesSlider = document.getElementById('slicesSlider');
    // column
    width = document.getElementById('width');
    widthSlider = document.getElementById('widthSlider');
    borderWidth = document.getElementById('borderWidth');
    borderWidthSlider = document.getElementById('borderWidthSlider');
    borderRadiusCol = document.getElementById('borderRadiusCol');
    borderRadiusColSlider = document.getElementById('borderRadiusColSlider');

    // create first chart
    createChart(charts[chartNum].chart);
    // populate initial values
    showValues('item');

});
