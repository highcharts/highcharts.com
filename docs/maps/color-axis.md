Color axis
===

The values on a [choropleth](/docs/chart-concepts/dataviz-glossary#choropleth-map) geo map or heat map are plotted against a color axis. The Highcharts Maps color axis is a special case of an axis that is drawn inside the legend, displaying a gradient or single items depending on whether the axis is scalar or has data classes. See detailed reference and live examples in the [API](https://api.highcharts.com/highmaps/colorAxis).

Scalar axis
-----------

A scalar color axis is represented by a gradient. The colors either range between the [minColor](https://api.highcharts.com/highmaps/colorAxis.minColor) and the [maxColor](https://api.highcharts.com/highmaps/colorAxis.maxColor), or for more fine grained control the colors can be defined in [stops](https://api.highcharts.com/highmaps/colorAxis.stops). Often times, the color axis needs to be adjusted to get the right color spread for the data. In addition to stops, consider using a logarithmic [axis type](https://api.highcharts.com/highmaps/colorAxis.type), or setting [min](https://api.highcharts.com/highmaps/colorAxis.min) and [max](https://api.highcharts.com/highmaps/colorAxis.max) to avoid the colors being determined by outliers.

Data classes
------------

When [dataClasses](https://api.highcharts.com/highmaps/colorAxis.dataClasses) are used, the ranges are subdivided into separate classes like categories based on their values. This can be used for ranges between two values, but also for a true category. However, when your data is categorized, it may be as convenient to add each category to a separate series.
