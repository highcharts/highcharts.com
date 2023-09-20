/*
This file contains the contents of https://cloud.highcharts.com/inject/ogivyz, wrapped
in a DOMContentLoaded handler.
 */

window.addEventListener('DOMContentLoaded', function () {

    (function () {
        var script = document.getElementById('highcharts-script');

        function addChart() {
            function parseData(completeHandler, chartOptions) {
                try {
                    var dataOptions = {
                        "seriesMapping": [
                            {
                                "x": 0
                            }
                        ],
                        "columnTypes": [
                            "string",
                            "float"
                        ],
                        "csv": ",Users\nJava (general),19.054\ndotNET,9.91\nAngularJS,8.333\nOther,6.604\nDjango,5.45\nJSF,4.099\nCodeIgniter,3.559\nCakePHP,2.838\nJersey,1.622\nJoomla,1.261\nDrupal,0.946\nDotNetNuke,0.946\nMeteorJS,0.856\nGWT,0.856\nKoaJS,0.766\nLaravel,0.315\nGrails,0.315\nDropwizard,0.315\nClojure,0.315\nMeanJS,0.27\nExpressJS,0.225\nMagento,0.18\nPHP (general),0.114"
                    };
                    dataOptions.sort = true;
                    dataOptions.complete = completeHandler;
                    Highcharts.data(dataOptions, chartOptions);
                } catch (error) {
                    console.log(error);
                    completeHandler(undefined);
                }
            }
            var shareUrl = 'http://cloud.highcharts.com/show/ogivyz';
            var encodedUrl = encodeURIComponent(shareUrl);

            var template = {
                chart: {
                    renderTo: 'highcharts-ogivyz'
                },
                navigation: {
                    menuItemStyle: {
                        fontFamily: Highcharts.SVGRenderer.prototype.getStyle().fontFamily,
                        padding: '2px 10px'
                    }
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                text: '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '" target="_blank">' +
                                'Share on Facebook</a>'
                            }, {
                                text: '<a href="https://plus.google.com/share?url=' + encodedUrl + '" target="_blank">' +
                                'Share on Google+</a>'
                            }, {
                                text: '<a href="https://twitter.com/share?url=' + encodedUrl + '&text=' + document.title + '" target="_blank">' +
                                'Share on Twitter</a>'
                            }, {
                                text: '<a href="http://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '" target="_blank">' +
                                'Share on LinkedIn</a>'
                            }, {
                                separator: true
                            }]
                        .concat(Highcharts.getOptions().exporting.buttons.contextButton.menuItems)
                        .concat([{
                            separator: true
                        }, {
                            text: '<a href="' + shareUrl.replace('/show/', '/charts/') + '" target="_blank">Edit chart</a>'
                        }, {
                            text: '<a href="/charts" target="_blank">Create chart</a>'
                        }])
                        }
                    }
                }
            };
            var chartOptions = {
                "plotOptions": {
                    "series": {
                        "colorByPoint": true
                    }
                },
                "yAxis": {
                    "title": {
                        "text": "Users"
                    },
                    "labels": {
                        "format": "{value}%"
                    }
                },
                "legend": {
                    "enabled": false
                },
                "series": [
                    {
                        "tooltip": {
                            "valuePrefix": null,
                            "valueSuffix": "%"
                        },
                        "index": 1
                    }
                ],
                "tooltip": {
                    "valueDecimals": 1
                },
                "title": {
                    "style": {
                        "fontWeight": "normal"
                    },
                    "text": "Frameworks"
                },
                "chart": {
                    "backgroundColor": "#ffffff",
                    "style": {
                        "fontFamily": "Courier"
                    },
                    "type": "column"
                }
            };
            parseData(function (dataOptions) {
                // Merge series configs
                if (chartOptions.series && dataOptions) {
                    chartOptions.series.forEach(function (series, i) {
                        chartOptions.series[i] = Highcharts.merge(series, dataOptions.series[i]);
                    });
                }
                var options = Highcharts.merge(dataOptions, chartOptions, template);
                Highcharts.chart(options.chart.renderTo, options);
            }, chartOptions);

        }

    // Load the Highcharts script if undefined, and add the chart
        if (typeof Highcharts !== 'undefined') {
            addChart();
        } else if (script) {
            script.deferredCharts.push(addChart);
        } else {
            script = document.createElement('script');
            script.id = 'highcharts-script';
            script.src = '//cloud.highcharts.com/resources/js/highstock-cloud-4.1.8.js';
            script.type = 'text/javascript';
            script.deferredCharts = [addChart];
            script.onload = function () {
            // Prevent double firing of event in IE9/IE10
                if (!script.chartsAdded) {
                    script.chartsAdded = true;
                    while (script.deferredCharts.length) {
                        script.deferredCharts.shift()();
                    }
                }
            };
            script.onreadystatechange = function () {
                if (this.readyState === 'complete' || this.readyState === 'loaded') {
                    script.onload();
                }
            };
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    }());

});