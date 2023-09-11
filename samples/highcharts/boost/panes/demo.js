function getData(n) {
    var arr = [],
        i;
    for (i = 0; i < n; i = i + 1) {
        arr.push([
            i,
            10 * Math.sin(i / 50)
        ]);
    }
    return arr;
}
var n = 500,
    data = getData(n);

Highcharts.chart('container', {

    boost: {
        enabled: true
    },

    title: {
        text: 'Test for clipping to panes in Boost'
    },

    series: [{
        data: data,
        yAxis: 0,
        color: 'red',
        boostThreshold: 1,
        name: 'boost A'
    }, {
        data: data,
        yAxis: 1,
        color: 'blue',
        boostThreshold: 1,
        name: 'boost B'
    }, {
        data: data,
        yAxis: 2,
        color: 'maroon',
        boostThreshold: 0, // disabled
        name: 'non-boost A'
    }, {
        data: data,
        yAxis: 3,
        color: 'navy',
        boostThreshold: 0, // disabled
        name: 'non-boost B'
    }],

    yAxis: [{
        height: '20%',
        min: 0,
        max: 3,
        offset: 0
    },
    {
        height: '20%',
        top: '25%',
        min: 0,
        max: 3,
        offset: 0
    },
    {
        height: '20%',
        top: '55%',
        min: 0,
        max: 3,
        offset: 0
    },
    {
        height: '20%',
        top: '80%',
        min: 0,
        max: 3,
        offset: 0
    }]

});
