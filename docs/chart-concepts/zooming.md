Zooming
=======

### Highcharts Core

Zooming in Highcharts can be enabled on the X axes or Y axes separately. The
[chart.zooming.type](https://api.highcharts.com/highcharts/chart.zooming.type)
option is set to either `"x"`, `"y"` or `"xy"`.

With a mouse pointer, the zooming is performed by dragging out a rectangle in
the chart. If the
[chart.panKey](https://api.highcharts.com/highcharts/chart.panKey)
is set, the user can press that key and drag the mouse in order to pan.
Otherwise, the user can't pan the zoomed area but has to zoom out then in again
on a new area.

When zooming, a button appears that lets the user zoom out. Programmatically,
the _Chart.zoomOut_ function can be used to the same effect.

On touch devices, the user can zoom by pinching in the chart area. On these
devices, the user may also move the zoomed area by panning with one finger
across the chart.

The Y axes do not scale to zoomed areas by default like X axes do. This
behavior will become active, when the axis options
[startOnTick](https://api.highcharts.com/highcharts/yAxis.startOnTick)
and
[endOnTick](https://api.highcharts.com/highcharts/yAxis.endOnTick)
are set to `false`.

Since v11.1, mouse wheel zooming is available through the [zooming.mouseWheel](https://api.highcharts.com/highcharts/chart.zooming.mouseWheel) option set. It requires a [separate module
file](https://code.highcharts.com/modules/mouse-wheel-zoom.js) for Highcharts Core,
but is bundled in Highcharts Stock.

Since Highcharts vX.X.X, zooming is available for non-cartesian series, such as
pie, treegraph, sankey amongst others. To enable zooming for non-cartesian
series, you need to include an [additional module file](https://code.highcharts.com/modules/non-cartesian-zoom.js).
The panning and zooming behavior for non-cartesian series mirrors that of
cartesian series, with support for mouse drag, touch gestures, and mouse wheel
zooming (when enabled). The zoom rectangle in non-cartesian zooming has a fixed
aspect ratio that matches the chart's width-to-height ratio, as this ensures
consistent and meaningful zoom behavior for these types of series.

### Highcharts Stock

In Highcharts Stock, we also have the Navigator, Range Selector, and Scrollbar to ease
navigation, so zooming is disabled by default. Instead, panning is enabled so
that moving the zoomed area is easier. 

On touch devices, both zooming and panning are enabled through the
[chart.zooming.pinchType](https://api.highcharts.com/highstock/chart.zooming.pinchType)
option, which defaults to `"x"`.

[Mouse wheel zooming](https://api.highcharts.com/highcharts/chart.zooming.mouseWheel)
is enabled in Highcharts Stock by default since v11.1.
