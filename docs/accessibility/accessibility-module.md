Accessibility module
===

The accessibility of Highcharts is critical to us. Accessibility should be fundamental to any software project, not an afterthought. Every Highcharts license includes our Accessibility module, which helps ensure your charts are as accessible as possible. We use the WCAG 2.1 standard as our guideline for this, as well as involving users with disabilities in our testing and feature development.

We recommend to always include the accessibility module, unless there is an explicit reason not to do so. Including this module will make your charts compatible with assistive technologies used by people with disabilities, and also improve the usability of your charts, helping you reach a broader audience. Including the Accessibility module will also help with SEO by making your charts more visible to web crawlers.

Visit our [accessibility portal](https://www.highcharts.com/accessibility/) to learn more about Highcharts' accessibility features.

Getting started with accessibility
----------------------------------
*Read more about [installation of Highcharts](https://www.highcharts.com/docs/getting-started/installation) and [setting up your first chart](https://www.highcharts.com/docs/getting-started/your-first-chart).*

To include the accessibility module, simply include the following file after including any of the Highcharts JS files:

```html
<script src="https://code.highcharts.com/modules/accessibility.js"></script>
```

We also recommend including the exporting and export-data modules. This lets users download the chart for use with e.g. tactile printers, as well as viewing the chart as a data table. These modules should be loaded before the Accessibility module.

```html
<script src="https://code.highcharts.com/modules/exporting.js"></script>
<script src="https://code.highcharts.com/modules/export-data.js"></script>
<script src="https://code.highcharts.com/modules/accessibility.js"></script>
```

Example of a line chart with the accessibility module:
<iframe style="width: 100%; height: 470px; border: none;" src='https://www.highcharts.com/samples/embed/highcharts/accessibility/accessible-line' allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/accessibility/accessible-line)

Basic configuration
-------------------

The accessibility module is highly configurable, but the most important option we will always recommend you provide is a text description of your chart. This is essential for SEO, accessibility for users with disabilities, and to help ensure your readers understand what the chart is about. The description should concisely explain what can be learned from the chart. For screen reader users, this enables fast access to the main takeaway of the chart, and also helps them decide if they should invest more time in exploring the chart further. The text description is usually best placed in visible text around the chart, so that all users can benefit from knowing what the chart should convey.

If you place the description next to the chart with the `highcharts-description` class set on the description element, Highcharts will automatically link this description to the chart and make it available to screen reader users.

### Linked description:

This behavior can be configured with the [`accessibility.linkedDescription`](https://api.highcharts.com/highcharts/accessibility.linkedDescription) option. It is possible to link the chart to any element on the page using this option. The use of the `<figure>` element in the example above is optional, but can help convey to screen reader users that they are navigating a diagram. Note that use of the `<figcaption>` element should be avoided in this context, as it will interfere with the accessibility features of Highcharts.

```js
<figure>
    <div id="chart-container"></div>
    <p class="highcharts-description">The following chart demonstrates some accessibility features  of Highcharts, including use of the <code>linkedDescription</code> option.</p>
</figure>
```
<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/accessibility/accessible-avg-temp allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/accessibility/accessible-avg-tmp)

### Caption:

It is possible to add the text description directly on the chart SVG as well, using the [`caption`](https://api.highcharts.com/highcharts/caption) option. If this option is used, the caption will automatically be made available to screen reader users. The caption renders at the bottom of the chart, and is included if the chart is exported.

```js
Highcharts.chart('container', {
    caption: {
        text: '<b>The caption renders at the bottom of the chart, and is included if the chart is exported.</b>'
    },
    // ...
});

```
<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/caption/text allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/caption/text)

### Description:

If making the text visible is not desirable, or you prefer to add a separate description for screen reader users, you can set the [`accessibility.description`](https://api.highcharts.com/highcharts/accessibility.description) option. Setting this option will expose the description to screen reader users, but keep it visually hidden. This is not generally recommended, since making the description visible will also improve cognitive accessibility, and make it easier for all users to understand the message of the chart. Hidden descriptions are also prone to be forgotten if the chart is updated in the future.

Example with [`series.bar.data.description`](https://api.highcharts.com/highcharts/series.bar.data.description)
```js
Highcharts.chart('container', {
    series: [{
        name: 'Percentage usage',
        data: [{
            name: 'JAWS',
            y: 30.2,
            accessibility: {
                description: 'This is the most used desktop screen reader'
            }
        },
        // ...
    }]
    // ...
});
```

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/accessibility/accessible-bar allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/accessibility/accessible-bar)


Other accessible features
-------------------------
The Accessibility module adds several layers of functionality for making your charts compatible with assistive technologies, improving the usability of your charts, and helping you reach a broader audience.
- [Keyboard navigation](https://www.highcharts.com/docs/accessibility/accessibility-features/keyboard-navigation)
- [Screen readers](https://www.highcharts.com/docs/accessibility/accessibility-features/screen-readers)
- [Low vision features](https://www.highcharts.com/docs/accessibility/accessibility-features/low-vision)
- [Voice input](https://www.highcharts.com/docs/accessibility/accessibility-features/voice-input)
- [Tactile export](https://www.highcharts.com/docs/accessibility/accessibility-features/tactile-export)
- [Sonification](https://www.highcharts.com/docs/accessibility/accessibility-features/sonification)
- [Cognitive accessibility](https://www.highcharts.com/docs/accessibility/accessibility-features/cognitive-accessibility)
- [Internationalization](https://www.highcharts.com/docs/accessibility/accessibility-features/internationalization)


See [demos using the Accessibility module](https://www.highcharts.com/demo#accessible-charts).

Read more about [advanced configuring of the Accessibility module](https://www.highcharts.com/docs/accessibility/configure-the-accessibility-module).

[Read more about our accessibility work](https://www.elsevier.com/connect/making-charts-accessible-for-people-with-visual-impairments).
