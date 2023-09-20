// THE CHART
Highcharts.chart('container', {
    chart: {
        type: 'scatter',
        marginLeft: 150,
        marginRight: 150
    },
    title: {
        text: 'Highcharts TreeGrid'
    },
    xAxis: [{
        type: 'datetime'
    }],
    yAxis: [{
        title: '',
        type: 'treegrid',
        labels: {
            align: 'left'
        }
    }],
    series: [{
        name: 'Project 1',
        data: [{
            id: '1',
            name: 'Node 1',
            x: Date.UTC(2014, 10, 18)
        }, {
            id: '2',
            parent: '1',
            name: 'Node 2',
            x: Date.UTC(2014, 10, 20)
        }, {
            id: '3',
            parent: '2',
            name: 'Node 3',
            x: Date.UTC(2014, 10, 26)
        }]
    }]
}, function (chart) {
    const treeGrid = chart.yAxis[0],
        ticks = treeGrid.ticks,
        // Nodes to collapse.
        ticksToCollapse = ['Node 1', 'Node 2'];
    Highcharts.objectEach(ticks, function (tick) {
        const textStr = tick.label && tick.label.textStr,
            doCollapse = (ticksToCollapse.indexOf(textStr) > -1);
        if (doCollapse) {
            // Pass in false to avoid a redraw.
            tick.collapse(false);
        }
    });
    // Redraw the chart in the end.
    chart.redraw(false);
});
