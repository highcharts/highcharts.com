const defaultOptions = {
        chart: {
            zooming: {
                type: 'xy'
            },
            panning: {
                enabled: true,
                type: 'xy'
            },
            panKey: 'shift'
        }
    },
    defaultData = [1, 2, 3],
    nonCartesianSeries = [{
        type: 'pie'
    }, {
        type: 'packedbubble'
    }, {
        type: 'item'
    }, {
        type: 'funnel'
    }, {
        type: 'pyramid'
    }, {
        type: 'networkgraph',
        data: [['A', 'B'], ['A', 'C']]
    }, {
        type: 'sankey',
        data: [{
            from: 'Category1',
            to: 'Category2',
            weight: 2
        }, {
            from: 'Category1',
            to: 'Category3',
            weight: 5
        }]
    }, {
        type: 'arcdiagram',
        data: [{
            from: 'Category1',
            to: 'Category2',
            weight: 2
        }, {
            from: 'Category1',
            to: 'Category3',
            weight: 5
        }]
    }, {
        type: 'dependencywheel',
        data: [{
            from: 'Category1',
            to: 'Category2',
            weight: 2
        }, {
            from: 'Category1',
            to: 'Category3',
            weight: 5
        }]
    }, {
        type: 'sunburst'
    }, {
        type: 'variablepie'
    }, {
        type: 'venn',
        data: [{
            sets: ['Core'],
            value: 10,
            name: 'Highcharts Core'
        }]
    }, {
        type: 'wordcloud',
        data: [['Lorem', 1]]
    }, {
        type: 'organization',
        data: [{
            from: 'Category1',
            to: 'Category2',
            weight: 2
        }, {
            from: 'Category1',
            to: 'Category3',
            weight: 5
        }]
    }, {
        type: 'treegraph',
        data: [{
            id: 'A'
        }, {
            id: 'B',
            parent: 'A'
        }]
    }],
    wrapper = document.getElementById('wrapper');

nonCartesianSeries.forEach(series => {
    const newContainer = document.createElement('div');
    newContainer.setAttribute('id', series.type);
    newContainer.setAttribute('class', 'container');
    wrapper.appendChild(newContainer);

    Highcharts.chart(series.type, Highcharts.merge(defaultOptions, {
        title: {
            text: `Zooming in ${series.type} series`
        },
        series: [{
            type: series.type,
            data: series.data || defaultData
        }]
    }));
});
