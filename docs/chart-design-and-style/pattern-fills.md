Pattern fills
=============

Since version 6.1.0, Highcharts supports pattern fills through the `pattern-fill.js` module. This module allows us to set colors in a chart as pattern fills, analogous to `linearGradient` and `radialGradient` in the [color options](https://www.highcharts.com/docs/chart-design-and-style/colors). Wherever there is a color option, a pattern fill can be used. Both custom defined SVG patterns and image patterns are supported.

<iframe style="width: 100%; height: 470px" src="https://www.highcharts.com/samples/embed/highcharts/series/pattern-fill-area/" frameborder="0"></iframe>

To enable this functionality, load the [pattern-fill.js](https://code.highcharts.com/modules/pattern-fill.js) module. Example loading the latest version from our CDN:

```html
<script src="https://code.highcharts.com/modules/pattern-fill.js"></script>
```

Then, to define a color as a pattern, we can do as follows with any color option:

```js
color: {
    pattern: {
        // Pattern options here
    }
}
```

See the [PatternObject reference](https://api.highcharts.com/class-reference/Highcharts.PatternObject) in the API for options details.

SVG Patterns
------------

By specifying the `patternIndex` option, you can load a pattern from the `Highcharts.patterns` global array. By default, Highcharts adds 10 pre-defined patterns to this array:

```js
color: {
    patternIndex: 0 // References the first default pattern
}
```

<iframe style="width: 100%; height: 470px" src="https://www.highcharts.com/samples/embed/highcharts/series/pattern-fill-pie/" frameborder="0"></iframe>

It is also possible to define your own custom SVG patterns. To do this, specify a `path` option for the pattern. The `path` can either be a SVG path data string or an object. Specifying it as an object allows us to add SVG attributes, including stroke and fill. Specifying a `color` option on the pattern will otherwise provide a default `stroke`. You can also add other options for the pattern, including `width`, `height`, `x` and `y` offsets. It is worth mentioning that patterns set on point color will inherit from series color, meaning that we can define an SVG pattern for the series, and still have individual stroke colors per point.

```js
series: [{
    color: {
        pattern: {
            path: 'M 0 0 L 10 10 M 9 - 1 L 11 1 M - 1 9 L 1 11',
            width: 10,
            height: 10
        }
    },
    keys: ['y', 'color.pattern.color'],
    data: [
        [1, '#f00'],
        [2, '#00ff00'],
        [3, 'blue']
    ]
}]
```

In the above example we define a pattern as the series color, and set the `pattern.color` option for each point color. Note the usage of the [series.keys](https://api.highcharts.com/highcharts/plotOptions.series.keys) option to avoid having to create an object structure for each of the points. For an example demo of creating custom SVG patterns, see the [pattern-fill area](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/series/pattern-fill-area/) demo.

Image patterns
--------------

The module supports image patterns as well, allowing you to use images as colors. To make an image pattern, supply the `pattern.image` option with a URL to an image. Note that if a `pattern.path` option is supplied, this will take precedence, and an SVG pattern will be created instead. Image patterns have intelligent sizing by default. If an image pattern is set on a point color, the image size is set by default to fill the point bounding box. The image will be stretched in both directions to fit. If stretching is not desirable, it is possible to set a fixed aspect ratio by setting the `pattern.aspectRatio` option. In this case, the image will be zoomed to fill the bounding box, while maintaining the aspect ratio. The image will in this case also be centered within the bounding box. As with SVG patterns, points inherit pattern settings of the series, so it is possible to set e.g. an overall aspect ratio for the series, with a different image URL for each point. The following is an example demo of creating image patterns:

<iframe style="width: 100%; height: 680px" src="https://www.highcharts.com/samples/maps/demo/pattern-fill-map/" frameborder="0"></iframe>

Pattern IDs
-----------

It is possible to set the ID of a pattern to promote reuse, and in some cases this might improve performance for large charts. Note, however, that intelligent sizing of image patterns is currently not available for patterns with user defined IDs. By default, Highcharts will automatically give all patterns an internal ID, and reuse all identical patterns.
