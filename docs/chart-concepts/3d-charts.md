Getting started with Highcharts 3D support
===

Highcharts 3D is a Highcharts module providing limited 3D support to charts. It currently allows to create 3D Column charts, 3D Pie charts and 3D Scatter charts.

### Load the required files.

To be able to use Highcharts 3D you first have to load Highcharts as usual and load the additional [3D plugin module](https:/code.highcharts.com/highcharts-3d.js):

```html
<script src="https://code.highcharts.com/highcharts-3d.js"></script>
````

(This should be included after highcharts.js)

### Configuring the 3D options for a chart.

Loading the 3D module will not alter existing charts unless they are specifically set up to be 3D, this allows you to have both 3D Charts and regular charts on one page. The configuration for the 3D chart in general is done the _chart_ section of the options, while some specific settings for different chart type can be found under _plotOptions_; here you see the fully extended 3D options with the type of value it expects:


    chart: {
        ....
        options3d: {
            enabled: 'boolean value',
            alpha: 'numeric value',
            beta: 'numeric value',
            depth: 'numeric value',
            viewDistance: 'numeric value',
            frame: {
                bottom: {
                    size: 'numeric value',
                    color: 'color value'
                },
                side: {
                    size: 'numeric value',
                    color: 'color value'
                },
                back: {
                    size: 'numeric value',
                    color: 'color value'
                }
           }
       },
       ...
    }
    ...
    plotOptions: {
        ...
        column: {
            ...
            depth: 'numeric value',
            groupZPadding: 'numeric value',
            ...
        },
        ...
        pie: {
            depth: 'numeric value'
        },
        ...
    }

General
-------

For all 3D charts the following options are the most important (part of _chart.options3d_):

*   enabled                   This indicates whether the chart has to have 3D or not, set this to true.
*   depth                        The total depth of the chart, defaults to 100.
*   viewDistance          This defines how far a viewer is from the chart.
*   alpha & beta           The angles to rotate the view of the chart.

**Beware that setting a low _viewDistance_ can result in twisted effects in the perspective because the view point is too close to the chart.**

In _chart.options3d_ there is also the possibility to construct three panes around the chart called the _frame_, by default these panes are invisible but they can each be configured separately in _chart.options.3d.frame_:


    bottom|side|back: {
        size:   The thickness of the pane (defaults to 0)
        color:  The color of the pane (default to transparent)
    }

3D Columns
----------

A 3D chart of type [columns](https://highcharts.com/docs/chart-and-series-types/column-chart) will draw each column as a cuboid and thus create a 3D effect. By default the depth of this column is set to 25. To define another depth you have to go into the _plotOptions_ and define one for the columns:


    plotOptions.column.depth: The depth of each individual column.

<iframe style="width: 100%; height: 550px;" src=https://www.highcharts.com/samples/embed/highcharts/demo/3d-column-interactive allow="fullscreen"></iframe>

### Displaying multiple columns

Just like in normal column charts, the Highcharts 3D plugin does allow to display a series of charts and to order these as desired using techniques like _grouping_ and _stacking_.

By default, _grouping_ is **true** in Highcharts, displaying the columns next to each other, in Highcharts 3D this is still the same: the columns will be standing next to each other on the front row of your chart. By setting _grouping_ to **false**, the columns will be placed behind each other in order of appearance. The default behaviour is to place the columns without any spacing against each other, this can be modified by setting the _groupZPadding_ option


    plotOptions.column.groupZPadding: Spacing between columns on the z-axis.


**Make sure the depth of the chart is sufficient to display all your columns. You will need at least the following depth: number of columns * (depth of column + z-padding)**

A regular Highcharts column chart also offers the possibility to stack columns together, this is of course still available in 3D charts and works in exactly the same way by setting _stacking_ to **true** and defining a stack number for each series.

<iframe style="width: 100%; height: 475px;" src=https://www.highcharts.com/samples/embed/highcharts/demo/3d-column-stacking-grouping allow="fullscreen"></iframe>

3D Pie
------

For a [pie chart](https://highcharts.com/docs/chart-and-series-types/pie-chart) the depth of the total chart is not important and setting the frame does not do anything (the frame is linked to the axis line and pies do not have these in the same way the other charts have). For pie charts it is important to set the depth property in _plotOptions_.


    plotOptions.pie.depth: Defines the 'thickness' of the pie.

<iframe style="width: 100%; height: 475px;" src=https://www.highcharts.com/samples/embed/highcharts/demo/3d-pie allow="fullscreen"></iframe>

3D Scatter
----------

In addition to x & y coordinates like in a regular [scatter chart](https://highcharts.com/docs/chart-and-series-types/scatter-chart), the 3D plugin adds an extra z coordinate to each point to place in 3 dimensions. Similar to the normal chart these coordinates can be sent either literally or using an array:


    {x: 1, y: 1, z: 1} is the same point as [1,1,1]

<iframe style="width: 100%; height: 475px;" src=https://www.highcharts.com/samples/embed/highcharts/3d/scatter allow="fullscreen"></iframe>

3D Area
----------

A 3D chart of type [area](https://highcharts.com/docs/chart-and-series-types/area-chart) is working similar to the column series. It will draw each area series as a 3D plane. By default the depth of an area series is set to 25.

### Displaying multiple areas

Just like in normal area charts, the Highcharts 3D plugin does allow to display multiple area series and to order these as desired with _grouping_ and _stacking_.

**Make sure the depth of the chart is sufficient to display all your area series. You will need at least the following depth: (number of area series - 1) * (depth of single area series)**

Stacking is still available in 3D charts and works in exactly the same way by setting _stacking_ to **true**.

<iframe style="width: 100%; height: 475px;" src=https://www.highcharts.com/samples/embed/highcharts/demo/3d-area-multiple allow="fullscreen"></iframe>
