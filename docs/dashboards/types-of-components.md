# Types of Dashboards components

Components are the building blocks of **Dashboards** layout. Several types of components are provided and can be used out of the box. The KPI, Highcharts, and DataGrid components come pre-configured with default configurations, whereas the HTML component can be customized to fit specific needs. It is also possible to create and register Custom components. 

## Overview
This is an overview of the most critical parameters of a component:
* `id` - The unique identifier of the component, which is later used to identify it by dashboard and/or used to set CSS styles.
* `renderTo` - id of the cell to which the component should be rendered
* `className` - CSS class that is applied to the component's container
* `type` - the type of the component. It can be [`HTML`](#html-component), [`KPI`](#kpi-component), [`Highcharts`](#highcharts-component),
[`DataGrid`](#datagrid-component) or [custom defined](https://www.highcharts.com/docs/dashboards/custom-component).
* `events` - an object containing a pair of names for the event and a callback function that should be called on a given event. The list of events can be found in the API Reference, but the most common is `mount`.
* `sync` - list of events that should be synchronized between components.

## HTML Component
The most basic and generic component type allows you to add everything that could be defined as HTML, as well as some custom events.

The HTML component can be defined in two ways:  
### 1. Abstract Syntax Tree (AST) style  
Defines the HTML code as a nested [tree structure](/docs/chart-concepts/dataviz-glossary#tree-data-structure).

Code snippet:
```js
{
    type: 'HTML',
    renderTo: 'dashboard-1',
    elements: [{
        tagName: 'img',
        attributes: {
            src: 'https://www.highcharts.com/samples/graphics/stock-dark.svg'
        }
    }]
}
```
### 2. HTML string
Defines the HTML code as a standard HTML string.

Code snippet:
```js
{
    type: 'HTML',
    renderTo: 'dashboard-1',
    html: '<img src="https://www.highcharts.com/samples/graphics/stock-dark.svg">'
}
```

This [example](https://www.highcharts.com/samples/embed/dashboards/components/component-html) exhibits both approaches to defining HTML components.

Custom HTML components are explained in the [Custom Component](https://www.highcharts.com/docs/dashboards/custom-component) section below.

See the [HTML Component](https://www.highcharts.com/docs/dashboards/html-component) page for detailed information.

### Highcharts Component
Dashboards support the use of `Highcharts` charts or maps out of the box.

The `highcharts` module must be imported *before* the `dashboards` module, as shown here:
```html
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/dashboards/dashboards.js"></script>
```

The `Highcharts`CSS file must be included for the correct chart rendering.
```css
@import url("https://code.highcharts.com/css/highcharts.css");
@import url("https://code.highcharts.com/dashboards/css/dashboards.css");
```

For a chart to be displayed, the type `Highcharts` must be specified, the `renderTo` option set must be set, and data must be provided as part of the `chartOptions`.
In addition, the `chartOptions` object allows you to configure anything that can be configured in a stand-alone Highcharts chart.

Data may be provided directly in the chart option, but in a **Dashboards** application, one often wants to share data between components. In this case, the [Data Pool](https://www.highcharts.com/docs/dashboards/data-handling) mechanism offers a convenient solution.

Code snippet with data embedded in the chart options, no data connector used:
```js
{
    renderTo: 'dashboard-1',
    type: 'Highcharts',
    chartOptions: {
        series: [{
            data: [1, 2, 3, 4]
        }]
    }
}
```
The above code snippet is part of a [Highcharts Component example](https://www.highcharts.com/samples/embed/dashboards/components/component-highcharts) that uses embedded data.

Code snippet using the Data Connector mechanism.
```js
dataPool: {
    connectors: [{
        id: 'micro-element',
        type: 'JSON',
        options: {
            firstRowAsNames: false,
            columnNames: ['Food', 'Vitamin A',  'Iron'],
            data: [
                ['Beef Liver', 6421, 6.5],
                ['Lamb Liver', 2122, 6.5],
                ['Cod Liver Oil', 1350, 0.9],
                ['Mackerel', 388, 1],
                ['Tuna', 214, 0.6]
            ]
        }
    }]
},
components: [
{
    renderTo: 'dashboard-col-0',
    type: 'Highcharts',
    connector: {
        id: 'micro-element',
        columnAssignment: [{
            seriesId: 'Vitamin A',
            data: ['Food', 'Vitamin A']
        }]
    }
}]
```
The above code snippet is part of a [Highcharts Component example](https://www.highcharts.com/samples/dashboards/demo/minimal-html) that uses data shared via a `DataConnector`.

When using a Data Connector, the data is parsed and organized in rows, with `columnNames` either given explicitly or used as column names in the first row.

The chart then uses the [columnAssignment](https://api.highcharts.com/dashboards/#interfaces/Dashboards_Components_HighchartsComponent_HighchartsComponentOptions.ConnectorOptions#columnAssignment) option to map the values of a specific column to the chart's series.
Here is an [example](https://www.highcharts.com/samples/embed/dashboards/demo/minimal) that uses column assignment.

You can load the Highcharts `drag-drop` module if the data connector is connected.
This allows the user to change the value and sync the changes of this value with other 
components. If a `mathModifier` is applied to the data from the connector,
chart editing is disabled. See the `dataPool` section for more details.

See the [HighchartsComponent](https://www.highcharts.com/docs/dashboards/highcharts-component) page for detailed information.

### DataGrid Component
To visualize data in a row-column layout, you can use the DataGrid component. The `DataGrid` module *must* be imported before the **Dashboards** module as shown here:
```html
<script src="https://code.highcharts.com/dashboards/datagrid.js"></script>
<script src="https://code.highcharts.com/dashboards/dashboards.js"></script>
```

The `DataGrid` module has its own style set, so the CSS file must be imported for correct rendering.
```css
@import url("https://code.highcharts.com/dashboards/css/datagrid.css");
@import url("https://code.highcharts.com/dashboards/css/dashboards.css");
```

For a chart to be displayed, the type `DataGrid` must be specified, the `renderTo` option set, and data must be provided as an embedded `dataTable` object or via a `DataConnector`. In addition, the `dataGridOptions` object allows you to configure `DataGrid` specific parameters like cell formatting, column assignment, etc.

The **DataGrid** may have the series data directly embedded as part of the `dataGridOptions`. However, a more common usage is the **Dashboards**' data pool mechanism, which shares data between the dashboard components. In this case, the `id` of the `DataConnector` must be included in the data grid's configuration.

Code snippet with data embedded in the `DataGrid` data table; no data connector used.
```js
{
    renderTo: 'dashboard-1',
    type: 'DataGrid',
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5]
        }
    }
}
```
The above code snippet is part of a [DataGrid example](https://www.highcharts.com/samples/embed/data-grid/demo/your-first-datagrid) that uses embedded data.

Code snippet using a data connector.
```js
dataPool: {
    connectors: [{
        id: 'data',
        type: 'JSON',
        options: {
            data: [
                ['Product Name', 'Quantity', 'Revenue', 'Category'],
                ['Laptop', 100, 2000, 'Electronics'],
                ['Smartphone', 150, 3300, 'Electronics'],
                ['Desk Chair', 120, 2160, 'Furniture'],
                ['Coffee Maker', 90, 1890, 'Appliances'],
                ['Headphones', 200, 3200, 'Electronics'],
                ['Dining Table', 130, 2470, 'Furniture'],
                ['Refrigerator', 170, 2890, 'Appliances']
            ]
        }
    }]
},
{
    type: 'DataGrid',
    renderTo: 'cell-id-2',
    connector: {
        id: 'data'
    }
}
```
The above code snippet is part of a [DataGrid example](https://www.highcharts.com/samples/embed/dashboards/components/component-datagrid) that uses data shared via a `DataConnector`.

When using the data connector, the `DataGrid` is automatically populated. If other components are using the same data connector, they will be automatically updated when the user edits a data grid cell. [Here is the example](https://www.highcharts.com/demo/dashboards/datagrid-sync).

NB! If the data was created by the [mathModifier](https://www.highcharts.com/docs/dashboards/data-handling#datamodifier), cell editing is disabled by default.

See the [DataGrid Component](https://www.highcharts.com/docs/dashboards/datagrid-component) page for more information.

### KPI Component
The `KPI component` (Key Performance Indicator) facilitates the visualization of one single value in a data set. It is a simple component that displays a title and a value but can also include a Highcharts component to visualize the value, typically a gauge. Additionally, the component can be configured with threshold values, which can adapt its style according to its current value.

This component type is bundled with the Highcharts plugin, and you need to connect the Highcharts with the dashboard plugin to use it (similar to the Highcharts component).

Code snippet:
```js
{
    renderTo: 'kpi-00',
    type: 'KPI',
    title: 'Average revenue',
    value: 888,
    threshold: [200, 800],
    thresholdColors: ['#f45b5b', '#f7a35c', '#90ed7d']
},
```
The above code snippet is part of a [KPI component example](https://www.highcharts.com/samples/embed/dashboards/components/component-kpi).

See the [KPI Component](https://www.highcharts.com/docs/dashboards/kpi-component) page for more information.
