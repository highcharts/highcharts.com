/* *
 *
 *   (c) 2010-2021 Highsoft AS
 *
 *  Author: Nancy Dillon
 *
 *  License: www.highcharts.com/license
 *
 *  Light theme based on Highcharts brand system
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Options from '../../Core/Options';

import D from '../../Core/Defaults.js';
const { setOptions } = D;
import U from '../../Shared/Utilities.js';
const { createElement } = U;

/* *
 *
 *  Theme
 *
 * */

namespace BrandLightTheme {

    /* *
     *
     *  Constants
     *
     * */

    export const options: DeepPartial<Options> = {
        colors: ['#8087E8', '#A3EDBA', '#F19E53', '#6699A1',
            '#E1D369', '#87B4E7', '#DA6D85', '#BBBAC5'],
        chart: {
            backgroundColor: '#f0f0f0',
            style: {
                fontFamily: 'IBM Plex Sans, sans-serif'
            }
        },
        title: {
            style: {
                fontSize: '22px',
                fontWeight: '500',
                color: '#2F2B38'
            }
        },
        subtitle: {
            style: {
                fontSize: '16px',
                fontWeight: '400',
                color: '#2F2B38'
            }
        },
        tooltip: {
            borderWidth: 0,
            backgroundColor: '#46465C',
            style: {
                color: '#f0f0f0'
            },
            shadow: true
        },
        legend: {
            backgroundColor: '#f0f0f0',
            borderColor: '#BBBAC5',
            borderWidth: 1,
            borderRadius: 2,
            itemStyle: {
                fontWeight: '400',
                fontSize: '12px',
                color: '#2F2B38'
            },
            itemHoverStyle: {
                fontWeight: '700',
                color: '#46465C'
            }
        },
        navigation: {
            buttonOptions: {
                symbolStroke: '#2F2B38',
                theme: {
                    fill: '#fff',
                    states: {
                        hover: {
                            stroke: '#46465C',
                            fill: '#fff'
                        },
                        select: {
                            stroke: '#46465C',
                            fill: '#fff'
                        }
                    }
                }
            }
        },
        credits: {
            style: {
                color: '#46465C'
            }
        },
        drilldown: {
            activeAxisLabelStyle: {
                color: '#2F2B38'
            },
            activeDataLabelStyle: {
                color: '#2F2B38'
            },
            drillUpButton: {
                theme: {
                    fill: '#2F2B38',
                    style: {
                        color: '#fff'
                    }
                }
            }
        },
        xAxis: {
            gridLineColor: '#ccc',
            labels: {
                style: {
                    color: '#46465C',
                    fontSize: '12px'
                }
            },
            lineColor: '#ccc',
            minorGridLineColor: '#ebebeb',
            tickColor: '#ccc',
            title: {
                style: {
                    color: '#2F2B38'
                }
            }
        },
        yAxis: {
            gridLineColor: '#ccc',
            labels: {
                style: {
                    color: '#46465C',
                    fontSize: '12px'
                }
            },
            lineColor: '#ccc',
            minorGridLineColor: '#ebebeb',
            tickColor: '#ccc',
            tickWidth: 1,
            title: {
                style: {
                    color: '#2F2B38',
                    fontWeight: '300'
                }
            }
        },
        // scroll charts
        rangeSelector: {
            buttonTheme: {
                fill: '#fff',
                style: {
                    color: '#46465C',
                    stroke: 'transparent'
                },
                states: {
                    hover: {
                        fill: '#fff',
                        style: {
                            color: '#46465C'
                        },
                        'stroke-width': 1,
                        stroke: '#46465C'
                    },
                    select: {
                        fill: '#fff',
                        style: {
                            color: '#46465C'
                        },
                        'stroke-width': 1,
                        stroke: '#46465C'
                    }
                }
            },
            inputBoxBorderColor: '#BBBAC5',
            inputStyle: {
                backgroundColor: '#fff',
                color: '#46465C'
            },
            labelStyle: {
                color: '#46465C'
            }
        },
        scrollbar: {
            barBackgroundColor: '#BBBAC5',
            barBorderColor: '#808083',
            buttonArrowColor: '#fff',
            buttonBackgroundColor: '#BBBAC5',
            buttonBorderColor: '#46465C',
            rifleColor: '#FFF',
            trackBackgroundColor: '#dedede',
            trackBorderColor: '#BBBAC5'
        },
        plotOptions: {
            series: {
                borderWidth: 1,
                borderColor: '#BBBAC5',
                dataLabels: {
                    color: '#46465C',
                    style: {
                        fontSize: '13px'
                    }
                },
                marker: {
                    lineColor: '#46465C'
                }
            },
            boxplot: {
                fillColor: '#505053'
            },
            candlestick: {
                lineColor: null as any,
                upColor: '#DA6D85',
                upLineColor: '#DA6D85'
            },
            errorbar: {
                color: 'white'
            },
            map: {
                borderColor: 'rgba(200, 200, 200, 0.3)',
                nullColor: 'rgba(200, 200, 200, 0.3)'

            }
        }
    };

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Apply the theme.
     */
    export function apply(): void {
        // Load the fonts
        createElement('link', {
            href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:200,300,400,600,700',
            rel: 'stylesheet',
            type: 'text/css'
        }, null as any, document.getElementsByTagName('head')[0]);

        // Apply the theme
        setOptions(options);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default BrandLightTheme;
