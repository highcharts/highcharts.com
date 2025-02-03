const colors = Highcharts.getOptions().colors;

const leafs = [
    'Bastarnisch', 'Brabantian', 'Burgundian', 'Crimean Gothic', 'Danish',
    'Dutch', 'English', 'Faroese', 'Flemish', 'Frisian', 'Gepidisch', 'Gothic',
    'Herulisch', '(High) German', 'Hollandic', 'Icelandic', 'Limburgish',
    'Low German', 'Norwegian', 'Rhinelandic', 'Rugisch', 'Skirisch', 'Swedish',
    'Vandalic', 'Yiddish'
].map(function (leaf) {
    return {
        id: leaf,
        color: colors[0]
    };
});

// Choose hanging nodes:
const hangingNodes = [
    {
        id: 'North Germanic',
        layout: 'hanging',
        // Push node a bit to the left.
        offsetHorizontal: -15
    },
    {
        id: 'West Germanic',
        layout: 'hanging'
    },
    {
        id: 'East Germanic',
        layout: 'hanging'
    }
];

const nodes = hangingNodes.concat(leafs);

Highcharts.chart('container', {

    chart: {
        height: 1200,
        inverted: true
    },

    title: {
        text: 'The Germanic Language Tree'
    },

    accessibility: {
        point: {
            descriptionFormat: '{add index 1}. {toNode.id}' +
                'comes from {fromNode.id}'
        }
    },

    tooltip: {
        outside: true
    },

    series: [{
        name: 'Germanic language tree',
        type: 'organization',
        keys: ['from', 'to'],
        nodeWidth: 40,
        nodePadding: 20,
        colorByPoint: false,
        hangingIndentTranslation: 'cumulative',
        // Crimp a bit to avoid nodes overlapping lines
        hangingIndent: 10,

        levels: [{
            level: 0,
            color: '#dedede'
        }, {
            level: 1,
            color: '#dedede'
        }, {
            level: 2,
            color: colors[3]
        }, {
            level: 3,
            color: colors[2]
        }, {
            level: 4,
            color: colors[8]
        }],
        nodes,
        /* eslint-disable indent */
        data: [
            // West Germanic branch
            ['Germanic', 'West Germanic'],
                ['West Germanic', 'Old English'],
                    ['Old English', 'Middle English'],
                        ['Middle English', 'English'],
                ['West Germanic', 'Old Frisian'],
                    ['Old Frisian', 'Frisian'],
                ['West Germanic', 'Old Dutch'],
                    ['Old Dutch', 'Middle Dutch'],
                        ['Middle Dutch', 'Hollandic'],
                        ['Middle Dutch', 'Flemish'],
                        ['Middle Dutch', 'Dutch'],
                        ['Middle Dutch', 'Limburgish'],
                        ['Middle Dutch', 'Brabantian'],
                        ['Middle Dutch', 'Rhinelandic'],
                ['West Germanic', 'Old Low German'],
                    ['Old Low German', 'Middle Low German'],
                        ['Middle Low German', 'Low German'],
                ['West Germanic', 'Old High German'],
                    ['Old High German', 'Middle High German'],
                        ['Middle High German', '(High) German'],
                        ['Middle High German', 'Yiddish'],

            // East Germanic branch
            ['Germanic', 'East Germanic'],
                ['East Germanic', 'Gothic'],
                ['East Germanic', 'Vandalic'],
                ['East Germanic', 'Burgundian'],
                ['East Germanic', 'Bastarnisch'],
                ['East Germanic', 'Gepidisch'],
                ['East Germanic', 'Herulisch'],
                ['East Germanic', 'Rugisch'],
                ['East Germanic', 'Skirisch'],
                ['East Germanic', 'Crimean Gothic'],

            // North Germanic branch
            ['Germanic', 'North Germanic'],
                ['North Germanic', 'Old Norse'],
                    ['Old Norse', 'Old Icelandic'],
                        ['Old Icelandic', 'Icelandic'],
                    ['Old Norse', 'Old Norwegian'],
                        ['Old Norwegian', 'Norwegian'],
                    ['Old Norse', 'Faroese'],
                ['North Germanic', 'Old Swedish'],
                    ['Old Swedish', 'Middle Swedish'],
                        ['Middle Swedish', 'Swedish'],
                ['North Germanic', 'Old Danish'],
                    ['Old Danish', 'Middle Danish'],
                        ['Middle Danish', 'Danish']
        ]
        /* eslint-enable indent */
    }]
});
