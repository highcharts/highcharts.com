Treemap
===

<iframe width="320" height="410" style="border: 0; width: 100%; height: 420px;" src=https://www.highcharts.com/samples/embed/highcharts/demo/treemap-with-levels allow="fullscreen"></iframe>

### Requirements

The treemap chart requires the file`modules/treemap.js`.
For use with [colorAxis](https://api.highcharts.com/highmaps/colorAxis), the `modules/heatmap.js` must be included as well.

### Data structure

The data is structured as a [Tree](https://en.wikipedia.org/wiki/Tree_(data_structure)), where each point represents a node. Each node can have its own children.

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


### Algorithms

Algorithms decide the positioning and sizing of the points. Which algorithm you use will therefore have a major part in defining the look of your chart. Highcharts Treemap comes with four algorithms ready to use.

##### Slice And Dice

Simple and fast algorithm which is great for structuring the points. The drawback with the Slice And Dice is that nodes can get really bad aspect ratio, and thus become hard to compare. This occurs often with larger datasets.

See an [example](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/treemap-layoutalgorithm-sliceanddice/) of Slice And Dice.

##### Stripes

Also a simple algorithm which is quite similar to Slice And Dice. Instead of alternating the direction between each node, it draws all nodes in same direction, creating a set of columns.

See an [example](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/treemap-layoutalgorithm-stripes/) of Stripes.

##### Squarified

An algorithm which aims to give each point a low aspect ratio. It adds the points one by one to a strip until it finds the best aspect ratio available. Then it alternates the direction and does the same with a new strip. The process continues in the same pattern until all points are placed in the chart.

See an [example](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/treemap-layoutalgorithm-squarified/) of Squarified.

##### Strip

Not to be mistaken as the Stripes algorithm, it has some clear differences in behavior. The Strip algorithm has the same objective as the Squarified algorithm, to get low aspect ratios. The process is quite similar, but instead of alternating the direction, the strips are drawn side by side as columns.

See an [example](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/treemap-layoutalgorithm-strip/) of Strip.

##### Add your own algorithm

Are you looking to use another algorithm, or maybe a more advanced version of the above? Adding a new algorithm to Highcharts treemaps is a fairly simple task. The process is the following:

Start by creating the function containing the algorithm. Two arguments are passed to the function. First argument is an object containing details of the parent. Second argument is an array of objects, where each object contains details about one child.

The parent object which is passed along has the following variables:

*   **Number x** // The x position of the parent
*   **Number y** // The y position of the parent
*   **Number width** // The width of the parent
*   **Number height** // The height of the parent
*   **String direction** // The starting direction, either vertical or horizontal, which the children should be drawn
*   **Number val** // The sum of all the children values

The each child which is passed along has the following variables:

*   **Number val** // The point value
*   **Number level** // The level which the point node is in the tree

A starting point for the function could be the following


    function myFunction(parent, children) {
        childrenAreas = [];
        children.forEach(function(child) {
            // Do some calculations

            // These return values are required for each child
            childrenAreas.push({
                x: someXValue,
                y: someYValue,
                width: someWidth,
                height: someHeight
            });
        });
        return childrenAreas;
    };


After the algorithm function is finished, then we have to add it by extending the treemap prototype with the function


    Highcharts.seriesTypes.treemap.prototype.myCustomAlgorithm = myFunction;


Afterwards when you declare the chart options, then specify that the series.layoutAlgorithm should be your new custom algorithm.


    var chart = new Highcharts.Chart({
        ...
        series: [{
           layoutAlgorithm: "myCustomAlgorithm",
           ...
        }],
        ...
    });


### Work with levels

The levels option gives the ability to set options on a specific level. This comes in handy whenever all points which lies on a certain level in the data tree, should stand out and differ from the rest of the points in the series.

Below is an example where the first level will use the Slice And Dice algorithm, and the rest will use the Squarified algorithm. Also all points on the second level will be colored blue, while the rest will be in the color red.


    var chart = new Highcharts.Chart({
        ...
        series: [{
           layoutAlgorithm: 'squarified',
           color: 'red',
           levels: [{
               level: 1,
               layoutAlgorithm: 'sliceAndDice'
           }, {
               level: 2,
               color: 'blue'
           }],
           ...
        }],
        ...
    });


##### Level Is Constant:

levelIsConstant is an option used together with the levels and allowDrillToNode options. By default it is set to true. When set to false the first level visible when drilling is considered to be level one. Otherwise the level will be the same as in the tree structure.

An [example](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/treemap-large-dataset) where levelIsConstant is set to false.

##### Traversing through levels

When the `allowTraversingTree` option is true, clicking on a point will set that point as the rendered root node. To help navigate through levels, breadcrumbs are rendered, showing a single button to the previous level or the full path back to the root node.

Read more about the breadcrumbs [here](https://www.highcharts.com/docs/advanced-chart-features/breadcrumbs).

### Use with ColorAxis

<iframe style="border: 0; width: 100%; height: 420px;" src=https://www.highcharts.com/samples/embed/highcharts/demo/treemap-coloraxis allow="fullscreen"></iframe>

For use with colorAxis, then the `modules/heatmap.js`must be included as well.

After the module is included in your project, a colorAxis object can be defined in the chart options. Read the [API](https://api.highcharts.com/highmaps/colorAxis) for details about its options.


    var chart = new Highcharts.Chart({
        ...
        colorAxis: {
            minColor: '#FFFFFF',
            maxColor: Highcharts.getOptions().colors[0]
        },
        ...
    });


And each point needs its own colorValue.


    var chart = new Highcharts.Chart({
        ...
        colorAxis: {
            ...
        },
        series: [{
            ...
            data: [{
                name: "Point 1",
                value: 1,
                colorValue: 5 // This value decides which color on the scale that the point gets.
            }],
            ...
        }],
        ...
    });


[Full example is found here](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/treemap-coloraxis)

### Options

For an overview over the options for the treemap, see the [API](https://api.highcharts.com/highcharts/plotOptions.treemap).

### Mode demos

*   [Treemap with colorAxis](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/treemap-coloraxis)
*   [Treemap displaying the global mortality rate and causes](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/treemap-large-dataset)
*   [Treemap using level specific options](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/treemap-with-levels)
