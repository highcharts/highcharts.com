(async () => {

    const data = await fetch(
        'https://cdn.jsdelivr.net/gh/highcharts/highcharts@8a1f8f0eb4/samples/data/africa-export-2021.json'
    ).then(response => response.json());

    // Calculate different color if there is not enough colors in array
    if (Highcharts.getOptions().colors.length < 11) {
        const { colors } = Highcharts.getOptions();
        let j = 0,
            k = 0;
        for (let i = colors.length; i < 12; i++) {
            if (j === 0) {
                k++;
            }
            Highcharts.defaultOptions.colors.push(
                Highcharts.color(colors[j % colors.length])
                    .brighten(-0.2 * k).get()
            );
            j++;
        }
    }

    Highcharts.chart('container', {
        chart: {
            spacingBottom: 50
        },

        title: {
            text: 'Exports of goods from Africa in 2021',
            align: 'left'
        },
        subtitle: {
            text: 'Source: ' +
                '<a href="https://www.harvard.edu/" target="_blank">' +
                'Harvard.edu</a>',
            align: 'left'
        },

        tooltip: {
            animation: false,
            borderWidth: 0,
            borderRadius: 15,
            backgroundColor: '#474554',
            style: {
                color: '#fff'
            },
            shape: 'rect',
            formatter: function () {
                const point = this.point,
                    node = point.node,
                    value = point.value.toFixed(2);
                let prefix = `<span style='color: ${point.color}'>●</span> `;

                if (node.children.length > 0) {
                    prefix += '<b>All ' + this.point.node.name + ':</b>';
                } else {
                    let parentInfo = '';
                    if (point.parent !== undefined || point.node.isGroup) {
                        parentInfo = point.node.parentNode.name + ' > ';
                    }
                    prefix += parentInfo + ' <b>' + point.name + ':</b>';
                }

                return `${prefix} ${value}%`;

            },
            positioner: function () {
                return {
                    x: this.chart.plotLeft + (this.chart.plotWidth / 2) -
                        (this.label.bBox.width / 2),
                    y: this.chart.plotTop + this.chart.plotHeight + 5
                };
            }
        },

        series: [{
            name: 'Export',
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            animationLimit: 1500,
            allowTraversingTree: true,
            borderRadius: 6,
            borderColor: '#fff',
            colorKey: 'value',
            cluster: {
                enabled: true,
                pixelWidth: 15,
                pixelHeight: 30,
                reductionFactor: 10
            },
            dataLabels: {
                enabled: true,
                style: {
                    textOutline: false,
                    fontWeight: 400,
                    color: '#fff',
                    fontSize: '0.8em',
                    'pointer-events': 'none'
                }
            },
            levels: [{
                level: 1,
                borderWidth: 4,
                dataLabels: {
                    enabled: false
                },
                colorByPoint: true
            }, {
                level: 2,
                borderWidth: 1
            }],
            data
        }]
    });
})();
