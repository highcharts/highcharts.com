Installation with ES6 modules
=============================

Our product packages are available as ES6-compatible modules since
Highcharts v6.1. Core files can also be loaded directly as ES modules since
Highcharts v11.3. The latter allows you to make use of tree shaking to only
load or bundle what is needed and reduce download and package sizes.

**Note:** If you code with TypeScript, please take a look at our
[TypeScript article](../advanced-chart-features/highcharts-typescript-declarations)
for details about ESM bundling and type adjustments.


## Including a product package (ES6 module)

For debugging and development purposes you can load core files directly in your
browser page and make use of tree shaking. Please note that this results in a
decreased download size but in an increased delay caused by the amount of
(small) files to load. This approach is therefore not recommended for
production.

```html
    <script type="module">
        import Chart from 'https://code.highcharts.com/es-modules/Core/Chart/Chart.js';
        import LineSeries from 'https://code.highcharts.com/es-modules/Series/Line/LineSeries.js';

        // Example to create a simple line chart in a div#container:
        new Chart('container', { series: [{ data: [1, 2, 3]}] });
    </script>
```


## Creating a custom bundle (ES6 module)

The advantage of core files over packages is, that only the required features
are loaded. This reduces the total download size. We can create a bundle of all
files to improve the load size and load time further. Create a NodeJS project
and install Highcharts and Webpack as NPM packages.

For a line chart create the JavaScript files as shown below.

```js
// mychart.js
import Chart from 'highcharts/es-modules/Core/Chart/Chart.js';
import LineSeries from 'highcharts/es-modules/Series/Line/LineSeries.js';

// Example to create a simple line chart in a div#container:
const myChart = new Chart('container', {
    series: [{
        type: 'line',
        data: [1, 2, 3]
    }]
});
```

```js
// webpack.config.js
module.exports = {
  entry: './mychart.js',
  mode: 'production',
  output: {
    filename: 'mybundle.js',
    // automatically placed in the subfolder 'dist'
  },
};
```

Create the bundle by running `node webpack -c webpack.config.js` and load the
result in your web page.

```html
    <div id="container"></div>
    <script type="module" src="./dist/mybundle.js"></script>
```

For a column chart or pie chart, the code of `mychart.js` looks similar.

```js
// mychart.js
import Chart from 'highcharts/es-modules/Core/Chart/Chart.js';
import ColumnSeries from 'highcharts/es-modules/Series/Column/ColumnSeries.js';

// Example to create a simple column chart in a div#container:
const myChart = new Chart('container', { series: [{ type: 'column', data: [1, 2, 3]}] });
```

```js
// mychart.js
import Chart from 'highcharts/es-modules/Core/Chart/Chart.js';
import PieSeries from 'highcharts/es-modules/Series/Pie/PieSeries.js';

// Example to create a simple pie chart in a div#container:
const myChart = new Chart('container');
const mySeries = new PieSeries();
mySeries.init(myChart, { data: [1, 2, 3] });
```


## Optional functionality via compositions

Unlike packages the core files do not provide all functionality out of the box.
You can find details about optional functionality in the source code of product
packages.

Do as below to activate data labels for example.

```js
    import Chart from 'highcharts/es-modules/Core/Chart/Chart.js';
    import LineSeries from 'highcharts/es-modules/Series/Line/LineSeries.js';
    import DataLabel from 'highcharts/es-modules/Core/Series/DataLabel.js';

    DataLabel.compose(LineSeries);
```

```js
    import Chart from 'highcharts/es-modules/Core/Chart/Chart.js';
    import ColumnSeries from 'highcharts/es-modules/Series/Column/ColumnSeries.js';
    import ColumnDataLabel from 'highcharts/es-modules/Series/Column/ColumnDataLabel.js';

    ColumnDataLabel.compose(ColumnSeries);
```

```js
    import Chart from 'highcharts/es-modules/Core/Chart/Chart.js';
    import PieSeries from 'highcharts/es-modules/Series/Pie/PieSeries.js';
    import PieDataLabel from 'highcharts/es-modules/Series/Pie/PieDataLabel.js';

    PieDataLabel.compose(PieSeries);
```



## Advantage of tree shaking

Tree shaking, by loading core files directly, helps to reduce the size of files
to download and reduces the size of your project. It is especially useful when
only a specific chart type is needed. See the following comparison for our
examples.

| Bundle (compiled+gzipped) | Download Size | Saving |
|---------------------------|---------------|--------|
| highcharts.js             | 100,509 bytes |     0% |
| LineSeries.js             |  78,268 bytes |    22% |
| ColumnSeries.js           |  80,046 bytes |    20% |
| PieSeries.js              |  83,085 bytes |    17% |



## Troubleshooting

If your project fails because of missing Highcharts code, a compose call
might be necessary after loading one of the module files. Consult the source
code of our product packages in `highcharts/es-modules/masters` for details.



## Dynamic imports from CDN

Highcharts is available on our CDN as ECMAScript modules. You can [import ES modules directly in modern browsers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
without any bundling tools by using `<script type="module">` ([demo](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/esm/simple/)):
```html
<script type="module">
    import Highcharts from 'https://code.highcharts.com/es-modules/masters/highcharts.src.js';
    import 'https://code.highcharts.com/es-modules/masters/modules/accessibility.src.js';

    Highcharts.chart('container', {
        ...
    });
</script>
```
The following example shows dynamic import with lazy-loading:
```js
const loadHighchartsAndCreateChart = async () => {
    const { default: Highcharts } =
        await import('https://code.highcharts.com/es-modules/masters/highcharts.src.js');
    await import('https://code.highcharts.com/es-modules/masters/highcharts-more.src.js');
    await import('https://code.highcharts.com/es-modules/masters/modules/exporting.src.js');
    await import('https://code.highcharts.com/es-modules/masters/modules/export-data.src.js');

    Highcharts.chart('container', { /* options */ });
};
```
View it live on jsFiddle in our [async loading demo](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/esm/async-await/);



## Load Highcharts as a transpiled ES6/UMD module

Since Highcharts supports ES6 (ESM - ECMAScript modules) and UMD (AMD, CommonJS), it can be also loaded as a module with the use of transpilers. Two common transpilers are [Babel](https://babeljs.io/) and [TypeScript](https://www.typescriptlang.org/).
*The following examples assume you have used npm to install Highcharts; see [installation with npm](https://highcharts.com/docs/getting-started/install-from-npm) for more details.*


### Babel
```js
import Highcharts from 'highcharts';
// Alternatively, this is how to load Highstock. Highmaps and Highcharts Gantt are similar.
// import Highcharts from 'highcharts/highstock';

// Load the exporting module.
import Exporting from 'highcharts/modules/exporting';
// Initialize exporting module. (CommonJS only)
Exporting(Highcharts);

// Generate the chart
Highcharts.chart('container', {
  // options - see https://api.highcharts.com/highcharts
});
```


### TypeScript + UMD

```js
import Highcharts from 'highcharts';
// Alternatively, this is how to load Highstock. Highmaps and Highcharts Gantt are similar.
// import Highcharts from 'highcharts/highstock';

// Load the exporting module.
import Exporting from 'highcharts/modules/exporting';
// Initialize exporting module. (CommonJS only)
if(typeof Exporting === 'function') {
    Exporting(Highcharts);
}

// Generate the chart
Highcharts.chart('container', {
  // options - see https://api.highcharts.com/highcharts
});
```

```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "module": "umd",
    "moduleResolution": "node"
  }
}
```


### TypeScript + ESM from CDN
```js
// Load modules the ES6 way
import Highcharts from 'https://code.highcharts.com/es-modules/masters/highcharts.src.js';
import 'https://code.highcharts.com/es-modules/masters/modules/exporting.src.js';

// Generate the chart
Highcharts.chart('container', {
  // options - see https://api.highcharts.com/highcharts
});
```
```json
{
  "compilerOptions": {
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "baseUrl": "./",
    "module": "es6",
    "moduleResolution": "node",
    "target": "es6",
    "paths": {
      "https://code.highcharts.com/es-modules/masters/*.src.js": [
        "node_modules/highcharts/*.src"
      ]
    }
  }
}
```
