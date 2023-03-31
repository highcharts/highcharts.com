Patterns and contrast
===

The default palette of Highcharts is designed with accessibility in mind, so that any two neighbor colors are tested for different types of color blindness. In addition to that, there are a few ways to increase contrast, both for the visually impaired or for grayscale prints, but also for the charts to be more readable in general.

*   Consider using [monochrome color palettes](https://www.highcharts.com/demo/pie-monochrome).
  <iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/demo/pie-monochrome allow="fullscreen"></iframe>

  [View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/pie-monochrome)

*   Consider using a [high contrast theme](https://www.highcharts.com/docs/chart-design-and-style/themes).
<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/accessibility/accessible-switch-theme-one allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/accessibility/accessible-switch-theme-one)

*   Consider applying [dash styles](https://api.highcharts.com/highcharts/plotOptions.line.dashStyle) to line series. This will make lines distinguishable even on poor black/white prints. See the [live demo of dash styles](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-dashstyle/).
  <iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/plotoptions/series-dashstyle allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/plotoptions/series-dashstyle)

*   Consider applying a pattern fill to areas, columns or plot bands. This can be accomplished through the pattern fill module. Pattern fills can be very useful for distinguishing series visually, if correctly used. For more information, see our [documentation on pattern fills](https://www.highcharts.com/docs/chart-design-and-style/pattern-fills).

```html
<script src="https://code.highcharts.com/modules/pattern-fill.js"></script>
```
  <iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/series/pattern-fill-pie allow="fullscreen"></iframe>

  [View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/series/pattern-fill-pie)



Keep in mind that pattern fills and dash styles could make your charts visually confusing and less accessible to some users, and that not all charts will be improved by adding these features. Subtle patterns are often preferred.

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/accessibility/accessible-pattern-fills/ allow="fullscreen"></iframe>

Read more about [themes](https://www.highcharts.com/docs/chart-design-and-style/themes) or [pattern fills](https://www.highcharts.com/docs/chart-design-and-style/pattern-fills).
