const categoryLinks = {
    Foo: 'http://www.bing.com/search?q=foo',
    Bar: 'http://www.bing.com/search?q=foo+bar',
    Foobar: 'http://www.bing.com/serach?q=foobar'
};

// Decorate the tick item with the link
Highcharts.addEvent(Highcharts.Tick, 'init', e => {
    const axis = e.target.axis;
    if (axis.categories) {
        const category = axis.categories[e.target.pos];
        e.target.link = categoryLinks[category];
    }
});

Highcharts.chart('container', {

    title: {
        text: 'Click categories to search'
    },

    xAxis: {
        categories: ['Foo', 'Bar', 'Foobar'],

        labels: {
            format: '<a href="{tick.link}">{text}</a>'
        }
    },

    series: [{
        data: [29.9, 71.5, 106.4]
    }]
});