Sunburst
===

A Sunburst displays hierarchical data, where a level in the hierarchy is represented by a circle. The center represents the root node of the [tree](/docs/chart-concepts/dataviz-glossary#tree-data-structure). The visualization bear a resemblance to both treemap and pie charts.

<iframe style="width: 100%; height: 850px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/demo/sunburst allow="fullscreen"></iframe>

Requirements
------------

The sunburst chart requires the following module `modules/sunburst.js`.

Options
-------

Click [here](https://api.highcharts.com/highcharts/plotOptions.sunburst) to get an overview of all options available for the sunburst series.

Data structure
--------------

The data is structured as a [tree](/docs/chart-concepts/dataviz-glossary#tree-data-structure), where each point represents a node. Each node can have its own children.

The tree automatically has one node at the top representing the root node. If a point has an undefined parent, or the parent is not matching any id, the parent will be automatically set to the root node.

The following is an example of how the tree is built in Highcharts:


    data: [{
        name: 'I have children',
        id: 'id-1'
    }, {
        name: 'I am a child',
        parent: 'id-1',
        value: 2
    }, {
        name: 'I am a smaller child',
        parent: 'id-1',
        value: 1
    }]


Work with levels
----------------

The levels option gives the ability to set options on a specific level. This comes in handy whenever all points which lies on a certain level in the data tree, should stand out and differ from the rest of the points in the series.

Below is an example where the first level will use have `colorByPoint: true`, and the rest will default to `colorByPoint: false` and thereby inherit its color from the parent.


    var chart = new Highcharts.Chart({
        ...
        series: [{
           levels: [{
               level: 1,
               colorByPoint: true
           }],
           ...
        }],
        ...
    });

### Static or dynamic levels

`levelIsConstant` is an option used together with the `levels` and `allowDrillToNode` options. By default it is set to true. When set to false the first level visible when drilling is considered to be level one. Otherwise the level will be the same as in the tree structure.

### Traversing through levels

When the `allowTraversingTree` option is true, clicking on a point will set that point as the rendered root node. To help navigate through levels, breadcrumbs are rendered, showing a single button to the previous level or the full path back to the root node.

Read more about the breadcrumbs [here](/docs/advanced-chart-features/breadcrumbs).

