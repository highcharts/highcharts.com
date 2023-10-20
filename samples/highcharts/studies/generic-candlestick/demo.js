(function () {

    // create shortcuts
    const HC = Highcharts,
        defaultOptions = HC.getOptions(),
        defaultPlotOptions = defaultOptions.plotOptions,
        seriesTypes = HC.seriesTypes,
        merge = HC.merge,
        extendClass = HC.extendClass,
        Point = HC.Point,
        ColumnSeries = seriesTypes.column,
        mathRound = Math.round;

    let UNDEFINED;

    // 1 - Set default options
    defaultPlotOptions.genericcandlestick = merge(defaultPlotOptions.column, {
        lineColor: 'black',
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 2
            }
        },
        threshold: null,
        upColor: 'white'
    });

    // 2- Create the GenericCandlestickPoint object
    const GenericCandlestickPoint = extendClass(Point, {
        /**
         * Apply the options containing the x and multiple y-values.
         * This is called on point init or from point.update. Extends base Point by adding
         * multiple y-values.
         *
         * @param {Object} options
         */
        applyOptions: function (options) {
            const point = this,
                series = point.series;

            let i = 0;

            if (typeof options === 'object' && typeof options.length !== 'number') {
                // TODO implement object input support?
                throw new Error('Object input not yet supported');
            } else if (options.length) { // array
                // with leading x value
                if (options.length % 2 === 1) {
                    if (typeof options[0] === 'string') {
                        point.name = options[0];
                    } else if (typeof options[0] === 'number') {
                        point.x = options[0];
                    }
                    i++;
                }

                const yValues = [];
                while (i < options.length) {
                    yValues.push(options[i]);
                    i++;
                }
                // It is appropriate to sort the y-values as each value-pair is a subset of a larger value-pair in candlestick charts
                yValues.sort(function (a, b) {
                    return a - b;
                });
                point.yValues = yValues;

                // Treats high/low as the value-pair with the largest value range, open/close with the second largest value range
                // TODO open/high/low/close should be removed, but all kinds of functionality depend on these fields
                // These fields are being used somewhere in Highcharts to achieve data grouping and in calucation of yBottom
                point.open = yValues[yValues.length - 2];
                point.high = yValues[yValues.length - 1];
                point.low = yValues[0];
                point.close = yValues[1];
            }

            /*
             * If no x is set by now, get auto incremented value. All points must have an
             * x value, however the y value can be null to create a gap in the series
             */
            point.y = point.yValues[point.yValues.length - 1];
            if (point.x === UNDEFINED && series) {
                point.x = series.autoIncrement();
            }
            point.options = options;
            return point;
        },

        /**
         * A generic tooltip formatter for multiple Y-values per point
         */
        tooltipFormatter: function () {
            const point = this,
                series = point.series,
                yValueLabels = series.options.yValueLabels,
                yValues = point.yValues;

            let tooltipHtml = '<span style="color:' + series.color + ';font-weight:bold">' + (point.name || series.name) + '</span><br/>';

            for (let i = 0; i < yValueLabels.length; i++) {
                tooltipHtml += yValueLabels[i] + ': ' + yValues[i] + '<br />';
            }

            return tooltipHtml;
        },

        /**
         * Return a plain array for speedy calculation
         */
        toYData: function () {
            return this.yValues;
        }

    });

    // 3 - Create the GenericCandlestickSeries object
    const GenericCandlestickSeries = extendClass(ColumnSeries, {
        type: 'genericcandlestick',
        pointClass: GenericCandlestickPoint,

        /**
         * One-to-one mapping from options to SVG attributes
         */
        pointAttrToOptions: { // mapping between SVG attributes and the corresponding options
            fill: 'color',
            stroke: 'lineColor',
            'stroke-width': 'lineWidth'
        },

        toYData: function (point) { // return a plain array for speedy calculation
            return [point.open, point.high, point.low, point.close];
        },


        /**
         * Translate data points from raw values x and y to plotX and plotY
         */
        translate: function () {
            const series = this,
                yAxis = series.yAxis;

            seriesTypes.column.prototype.translate.apply(series);

            // do the translation
            series.points.forEach(function (point) {
                const plotYValues = [];
                for (let i = 0; i < point.yValues.length; i++) {
                    plotYValues.push(
                        yAxis.translate(point.yValues[i], 0, 1, 0, 1)
                    );
                }
                point.plotYValues = plotYValues;
            });
        },

        /**
         * Draw the data points
         */
        drawPoints: function () {
            const series = this,
                points = series.points,
                chart = series.chart;

            let pointAttr,
                topBox,
                bottomBox,
                crispCorr,
                crispX,
                graphic,
                path,
                halfWidth;

            points.forEach(function (point) {
                let boxpath,
                    numberOfBoxes,
                    boxes;
                graphic = point.graphic;
                if (point.plotY !== UNDEFINED) {

                    pointAttr = point.pointAttr ?
                        point.pointAttr[point.selected ? 'select' : ''] :
                        series.pointAttribs(point);

                    // crisp vector coordinates
                    crispCorr = (pointAttr['stroke-width'] % 2) / 2;
                    crispX = mathRound(point.plotX) + crispCorr;

                    // create path for boxes
                    numberOfBoxes = point.plotYValues.length / 2 - 1;
                    boxes = [];
                    for (let i = 0; i < numberOfBoxes; i++) {
                        bottomBox = mathRound(point.plotYValues[i + 1]) +
                            crispCorr;
                        topBox = mathRound(
                            point.plotYValues[
                                point.plotYValues.length - 2 - i
                            ]
                        ) + crispCorr;
                        halfWidth = mathRound(
                            point.shapeArgs.width / 8 * (i * 2 + 1)
                        );

                        // halfWidth = mathRound(point.barW / 2);

                        boxpath = [
                            'M',
                            crispX - halfWidth, bottomBox,
                            'L',
                            crispX - halfWidth, topBox,
                            'L',
                            crispX + halfWidth, topBox,
                            'L',
                            crispX + halfWidth, bottomBox,
                            'L',
                            crispX - halfWidth, bottomBox,
                            'Z'
                        ];
                        boxes.push(boxpath);
                    }

                    // create path for line
                    path = [
                        'M',
                        crispX, mathRound(point.plotYValues[1]) + crispCorr,
                        'L',
                        crispX, mathRound(point.yBottom),
                        'M',
                        crispX, mathRound(
                            point.plotYValues[point.plotYValues.length - 2]
                        ) + crispCorr,
                        'L',
                        crispX, mathRound(point.plotY),
                        'Z'
                    ];

                    if (graphic) {
                        graphic.path.animate({
                            d: path
                        });
                        for (let i = 0; i < boxes.length; i++) {
                            graphic['path' + i].animate({
                                d: boxes[i]
                            });
                        }

                    } else {
                        graphic = chart.renderer.g().add();
                        graphic.path = chart.renderer.path(path)
                            .attr(pointAttr)
                            .add(graphic);
                        for (let i = 0; i < boxes.length; i++) {
                            graphic['path' + i] = chart.renderer.path(boxes[i])
                                .attr(pointAttr)
                                .add(graphic);
                        }
                        graphic.attr(pointAttr).add(series.group);
                        point.graphic = graphic;
                    }

                }
            });

        }


    });
    seriesTypes.genericcandlestick = GenericCandlestickSeries;
}());

// --- create the chart
window.chart = new Highcharts.StockChart({
    chart: {
        ignoreHiddenSeries: false,
        width: null,
        renderTo: 'container',
        plotBorderWidth: 2,
        plotBorderColor: '#E4E4E4',
        spacingTop: 20,
        style: {
            overflow: 'visible'
        }
    },
    yAxis: [{
        tickLength: 5,
        gridLineColor: '#EFEFEF',
        title: {
            align: 'high',
            rotation: 0,
            text: 'm',
            offset: 30,
            y: 30,
            x: 22,
            style: {
                color: '#000000',
                fontWeight: 'bold'
            },
            enabled: true
        },
        endOnTick: true,
        showEmpty: false,
        floor: 0,
        ceiling: null,
        max: 6.7,
        min: 0,
        labels: {
            y: 0,
            x: -8,
            enabled: true,
            style: {
                fontSize: '12px',
                fontFamily: 'Arial, Verdana, Helvetica, sans-serif',
                color: '#000000'
            },
            overflow: 'justify'
        },
        opposite: false,
        index: 0
    }],
    tooltip: {
        formatter: function () {
            return 'test';
        }
    },
    series: [{
        id: 'ge_swh_0pct',
        name: 'ge_swh_0pct',
        data: [
            [1432663200000, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6],
            [1432684800000, 1.4, 1.5, 1.5, 1.5, 1.6, 1.6],
            [1432706400000, 1.4, 1.5, 1.5, 1.6, 1.6, 1.7],
            [1432728000000, 1.5, 1.6, 1.6, 1.7, 1.7, 1.8],
            [1432749600000, 1.7, 1.7, 1.7, 1.8, 1.8, 2],
            [1432771200000, 1.7, 1.7, 1.8, 1.9, 1.9, 2.1],
            [1432792800000, 1.7, 1.7, 1.8, 1.9, 2, 2.1],
            [1432814400000, 1.5, 1.6, 1.6, 1.7, 1.8, 1.9],
            [1432836000000, 1.5, 1.5, 1.6, 1.7, 1.9, 2.2],
            [1432857600000, 1.5, 1.5, 1.5, 1.9, 2, 2.3],
            [1432879200000, 1.4, 1.5, 1.5, 1.8, 1.9, 2.1],
            [1432900800000, 1.3, 1.5, 1.5, 1.7, 1.8, 2],
            [1432922400000, 1.3, 1.4, 1.4, 1.7, 1.8, 1.9],
            [1432944000000, 1.2, 1.3, 1.3, 1.6, 1.7, 2],
            [1432965600000, 1.1, 1.2, 1.3, 1.5, 1.7, 1.9],
            [1432987200000, 1, 1.1, 1.2, 1.5, 1.6, 2.1],
            [1433008800000, 1, 1.1, 1.1, 1.4, 1.7, 2.5],
            [1433030400000, 0.9, 1, 1, 1.4, 1.6, 2.1],
            [1433052000000, 0.8, 0.9, 0.9, 1.4, 1.7, 3.1],
            [1433073600000, 0.8, 0.8, 0.9, 1.5, 1.9, 2.9],
            [1433095200000, 0.7, 0.8, 0.9, 1.4, 2, 2.7],
            [1433116800000, 0.8, 0.9, 0.9, 1.3, 1.8, 2.8],
            [1433138400000, 0.8, 0.9, 1.1, 1.6, 2.2, 3],
            [1433160000000, 1, 1.1, 1.3, 1.8, 2.9, 4],
            [1433181600000, 1.1, 1.3, 1.5, 2.3, 2.8, 4.5],
            [1433203200000, 1, 1.5, 1.7, 2.4, 2.7, 3.9],
            [1433224800000, 1, 1.7, 1.8, 2.3, 2.4, 3.2],
            [1433246400000, 1, 1.6, 1.7, 2.4, 2.7, 3.2],
            [1433268000000, 1, 1.5, 1.6, 2.3, 2.7, 4.2],
            [1433289600000, 1, 1.4, 1.6, 2.2, 2.9, 5.5],
            [1433311200000, 1, 1.3, 1.5, 2.3, 3.2, 5.3],
            [1433332800000, 0.9, 1.2, 1.5, 2.6, 3.7, 6.2],
            [1433354400000, 1, 1.2, 1.4, 3.1, 4.4, 6.7],
            [1433376000000, 0.9, 1.2, 1.4, 3.3, 4, 5.9],
            [1433397600000, 0.9, 1.2, 1.7, 3.4, 4.3, 5.1],
            [1433419200000, 0.9, 1.3, 1.9, 3.3, 3.8, 5.4],
            [1433440800000, 1, 1.4, 1.9, 3.3, 3.7, 5.8],
            [1433462400000, 1.1, 1.2, 1.9, 2.9, 3.4, 4.7],
            [1433484000000, 1, 1.4, 1.7, 2.7, 3.2, 4.9],
            [1433505600000, 1, 1.3, 1.6, 2.5, 3.1, 4.1],
            [1433527200000, 1, 1.3, 1.5, 2.3, 2.9, 3.6]
        ],
        color: '#2F7ED8',
        fillColor: null,
        marker: {
            enabled: false
        },
        type: 'genericcandlestick',
        dashStyle: 'Solid',
        zIndex: 0,
        yAxis: 0,
        visible: true,
        lineWidth: 2,
        fillOpacity: 1,
        enableMouseTracking: true,
        showToolTip: true,
        linkedTo: null,
        dataLabels: {
            enabled: false
        }
    }, {
        id: 'ge_swh_50pct',
        name: 'ge_swh_50pct',
        data: [
            [1432663200000, 1.6],
            [1432684800000, 1.5],
            [1432706400000, 1.5],
            [1432728000000, 1.6],
            [1432749600000, 1.8],
            [1432771200000, 1.8],
            [1432792800000, 1.8],
            [1432814400000, 1.7],
            [1432836000000, 1.6],
            [1432857600000, 1.7],
            [1432879200000, 1.7],
            [1432900800000, 1.6],
            [1432922400000, 1.5],
            [1432944000000, 1.4],
            [1432965600000, 1.3],
            [1432987200000, 1.3],
            [1433008800000, 1.2],
            [1433030400000, 1.1],
            [1433052000000, 1.1],
            [1433073600000, 1.1],
            [1433095200000, 1.1],
            [1433116800000, 1.2],
            [1433138400000, 1.3],
            [1433160000000, 1.6],
            [1433181600000, 1.7],
            [1433203200000, 1.9],
            [1433224800000, 2.1],
            [1433246400000, 2],
            [1433268000000, 1.9],
            [1433289600000, 1.9],
            [1433311200000, 1.8],
            [1433332800000, 1.8],
            [1433354400000, 2],
            [1433376000000, 2.3],
            [1433397600000, 2.4],
            [1433419200000, 2.7],
            [1433440800000, 2.5],
            [1433462400000, 2.4],
            [1433484000000, 2.2],
            [1433505600000, 1.9],
            [1433527200000, 1.9]
        ],
        color: '#000000',
        fillColor: null,
        marker: {
            enabled: false
        },
        type: 'spline',
        dashStyle: 'Solid',
        zIndex: 5,
        yAxis: 0,
        visible: true,
        lineWidth: 2,
        fillOpacity: 1,
        enableMouseTracking: true,
        showToolTip: true,
        linkedTo: null,
        dataLabels: {
            enabled: false
        },
        _symbolIndex: 0
    }, {
        id: 'waveheigth',
        name: 'waveheigth',
        data: [{
            x: 1432663200000,
            y: 1.7,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432684800000,
            y: 1.6,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432706400000,
            y: 1.5,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432728000000,
            y: 1.7,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432749600000,
            y: 2,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432771200000,
            y: 2.11,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432792800000,
            y: 2.15,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432814400000,
            y: 1.88,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432836000000,
            y: 1.62,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432857600000,
            y: 1.74,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432879200000,
            y: 1.69,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432900800000,
            y: 1.66,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432922400000,
            y: 1.69,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432944000000,
            y: 1.64,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432965600000,
            y: 1.54,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1432987200000,
            y: 1.32,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433008800000,
            y: 1.18,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433030400000,
            y: 1.12,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433052000000,
            y: 1.05,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433073600000,
            y: 1,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433095200000,
            y: 0.9,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433116800000,
            y: 1.02,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433138400000,
            y: 1.45,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433160000000,
            y: 1.75,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433181600000,
            y: 2.05,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433203200000,
            y: 2.2,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433224800000,
            y: 2.53,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433246400000,
            y: 2.17,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }, {
            x: 1433268000000,
            y: 1.85,
            marker: {
                fillColor: null,
                lineWidth: null,
                lineColor: null
            }
        }],
        color: '#00c2e8',
        fillColor: null,
        marker: {
            enabled: false
        },
        type: 'spline',
        dashStyle: 'Solid',
        zIndex: 5,
        yAxis: 0,
        visible: true,
        lineWidth: 2,
        fillOpacity: 1,
        enableMouseTracking: true,
        showToolTip: true,
        linkedTo: null,
        dataLabels: {
            enabled: false
        },
        _symbolIndex: 1
    }]
});
