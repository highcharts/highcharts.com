# Data Pool & Connectors

The data pool provides central data and data management access in a
dashboard. It manages connectors and their tables on demand, so a dashboard component only loads data when requested.

Data connectors manage the transaction and preparation of data. Loading data
from a source is an asynchronous process as the source is usually a web server.

## DataPool

Each dashboard has one `DataPool` instance for all components. It is available
via the `Board.dataPool` class property and can be configured with the
`BoardOptions.dataPool` option. Usually, one or more connectors get defined,
including the ID, the data source, and whether the data needs 
additional modification. The ID is used to retrieve a connector, which is an
asynchronous process.

### DataPool Example

``` JavaScript
async function run() {
  const board = await Dashboards.board('container', {
    // ...
    dataPool: {
      connectors: [{
        type: 'JSON',
        id: 'My Series Data',
        enablePolling: true,
        jsonURL: 'https://'
      }, {
        type: 'CSV',
        id: 'My Currency Data',
        csvURL: 'https://'
        dataModifier: {
            type: 'Math',
            columnFormulas: [{
                column: 'My Fixed Rate',
                formula: 'A1*7.8'
            }]
        }
      }]
    }
    // ...
  }, true);
  // A component usually performs access to the data pool.
  const table = await board.dataPool.getConnectorTable('My Currency Data');
  const modifiedTable = table.modified;
}
run();
```

## DataConnector

The `DataConnector` is the base class for all connectors; as a stand-alone, it can not load or save data.
It includes common functionality like events, server polling, and managing meta information like the column order.

Additionally, the `DataConnector` contains the registry of all available
connectors. You can access the registry via `DataConnector.types`.

## CSVConnector

The `CSVConnector` allows the loading of structured text data, where a comma or semicolon separates each table
cell, while a line break separates each row. You can provide data via a URL or directly with a CSV string. Details
of all available options can be found in the
[API documentation](https://api.highcharts.com/dashboards/#interfaces/Data_Connectors_CSVConnectorOptions.CSVConnectorOptions-1).

### CSVConnector Example

``` JavaScript
async function run() {
    const connector = new DataConnector.types.CSV({
        csvURL: 'https://demo-live-data.highcharts.com/updating-set.csv'
    });
    await connector.load();
}
run();
```



## GoogleSheetsConnector

With the `GoogleSheetsConnector`, is it possible to load table data from a Google
Docs spreadsheet. The connector needs the API key related to a Google account
and the document ID. See the
[API documentation](https://api.highcharts.com/dashboards/#interfaces/Data_Connectors_GoogleSheetsConnectorOptions.GoogleSheetsConnectorOptions-1)
for all options.

Please note that the Google account needs read access to the document. Usually
the Google account should not be the owner of the document, as this decreases the
possibilities of limiting access.

### GoogleSheetsConnector Example

``` JavaScript
async function run() {
    const connector = new DataConnector.types.GoogleSheets({
        googleAPIKey: 'Aa...zz',
        googleSpreadsheetKey: 'Bb...wW'
    });
    await connector.load();
}
run();
```

### GoogleSheetsConnector Tutorial

Google Sheets is a spreadsheet application included in Google's free, web-based Google Docs Editors suite.

With the `GoogleSheetsConnector` in Highcharts Dashboards, you can load tables from a Google spreadsheet into one of your dashboard 
components, whether a DataGrid, KPI, or chart. Like with other connectors, DataModifiers may be applied during parsing.
Alternatively, the data may be filtered or modified before it is parsed in the `beforeParse` callback.

The connector requires two API keys: one for the Google Spreadsheets API and one for the document itself. In addition, the Google account owner must grant read access to the document. See the [GoogleSheetsConnector API](https://api.highcharts.com/dashboards/typedoc/interfaces/Data_Connectors_GoogleSheetsConnectorOptions.GoogleSheetsConnectorOptions-1.html) for further details.

### Google API key

> Prerequisite
>
> The document owner must have a [Google Cloud Project](https://developers.google.com/workspace/guides/get-started) where the API/Service with [Google Sheets API](https://developers.google.com/sheets/api/guides/concepts) is enabled and an API key exists.

Providing the Google Sheet API exists, the `API key` can be extracted from the [Credentials Panel](https://console.cloud.google.com/apis/credentials).

### Spreadsheet Key
The `spreadsheet key` can be extracted directly from the URL of the document as illustrated below:

```
https://docs.google.com/spreadsheets/d/1U17c4GljMWpgk1bcTvUzIuWT8vdOnlCBHTm5S8Jh8tw/edit
```

Spreadsheet key: **1U17c4GljMWpgk1bcTvUzIuWT8vdOnlCBHTm5S8Jh8tw**

### Basic demo

<iframe style="width: 100%; height: 450px; border: none;" src="https://www.highcharts.com/samples/embed/dashboards/data/googlesheets-tutorial" allow="fullscreen"></iframe>


## HTMLTableConnector

The `HTMLTableConnector` allows the import and export of an HTML table as a
`DataTable`. It is the only connector not supporting loading from a
remote source. Instead, one provides an element reference from the current web
page. Details are listed in the
[API documentation](https://api.highcharts.com/dashboards/#interfaces/Data_Connectors_HTMLTableConnectorOptions.HTMLTableConnectorOptions-1).

### HTMLTableConnector Example

``` JavaScript
async function run() {
    const connector = new DataConnector.types.HTMLTable({
        dataTable: document.querySelector('#table');
    });
    await connector.load();
}
run();
```

## JSONConnector

The `JSONConnector` supports loading data in a row-oriented structure, as found
in Highcharts series types. The connector options can also control how columns
and rows are structured in the JSON array to support other structures. See the
[API documentation](https://api.highcharts.com/dashboards/#interfaces/Data_Connectors_JSONConnectorOptions.JSONConnectorOptions-1)
for all possible combinations.

### JSONConnector Example

``` JavaScript
async function run() {
    const connector = new DataConnector.types.JSON({
        data: [
            ['row 1', 1, 2, 3],
            ['row 2', 2, 3, 4],
            ['row 3', 0, 1, 2]
        ]
    });
    await connector.load();
}
run();
```

## Custom Data Connectors

It is possible to create additional DataConnectors based on the `DataConnector`
base class. An implementation usually has three steps to fulfil:

* Load the data from the source and react to possible transaction errors.
* Create a `DataTable` and add the data to it.
* Make the table available, and in case of related options, update the table with
   incoming changes from the source.

You can see a typical implementation of this in the
[GoogleSheetsConnector](https://github.com/highcharts/highcharts/blob/master/ts/Data/Connectors/GoogleSheetsConnector.ts).
Please note that the included connectors use a separate converter instance for the second step, which involves adding the data to the `DataTable`.


## Custom Data Connector Tutorial (MQTT)

This tutorial shows how to implement a `Custom Data Connector` for the 
**MQTT protocol** and how to deploy it in a simple **Highcharts Dashboards** application. The connector is implemented as a **JavaScript** class and is independent of the application.

### About MQTT
[MQTT](https://en.wikipedia.org/wiki/MQTT) is the de facto standard protocol for low-resource, low-power devices and is widely used in [IoT](https://en.wikipedia.org/wiki/Internet_of_things) applications across a wide range of industries: mobile internet, Smart Hardware, the Internet of Vehicles, Smart Cities, Telemedicine, Power, Oil, Energy, and other fields.

The hub of the **MQTT** network infrastructure is the so-called broker, a server to which applications can send messages and where clients (e.g., a web application) can subscribe to a topic. MQTT is a protocol on top of **TCP/IP** and for web clients available as [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) or TCP.

### MQTT data
The **MQTT** data packet consists of a `topic` that uniquely defines a data set for a specific connection and a text payload. The payload is typically a **JSON** object, and the `MQTT custom connector` described in this tutorial supports JSON only.

### MQTT connect
Establishing a data link to an MQTT broker typically consists of these steps:
* Connect to the `broker` with a given host name and port number, with optional authentication (user, password).
* Wait for a successful connection.
* Subscribe to one or more `topics`.
* Wait for confirmation of the subscription.
* Packets now arrive at a rate determined by the data provider (often a wireless sensor application).
* Process the incoming packets.

The MQTT client may also send packets to a broker, but this feature is not implemented in the custom `DataConnector` we use for this tutorial.

### MQTT Custom Connector

The base class for the `MQTTConnector` is the `DataConnector`, where the constructor and the `load` methods are re-implemented. The `load` method differs from that of the CSV and JSON connectors in that data is not waiting for arrival (due to the nature of the MQTT protocol, no data may be available immediately). However, it establishes the connection and subscribes to the subject defined in the connector `options`, providing that the `autoConnect` and `autoSubscribe` options are set (the default behavior).

The `MQTT Connector` uses the `JSONConverter` for parsing, thus providing the application with a `beforeParse` callback invoked on every packet reception. This callback is crucial to implementing an application because the payload of the incoming packet is typically a hierarchical JSON object whereas the dashboard implementation requires a single-level data structure.

In addition, the `MQTTConnector` provides these custom methods:
* connect
* subscribe
* unsubscribe
* disconnect

In a typical application, these are unnecessary as the whole connect/subscribe sequence is executed by default using the `load` method.

The `MQTT` connector supports the following optional callbacks:

* beforeParse - fired before an incoming packet is parsed
* connectEvent - handles both connect/disconnect
* subscribeEvent - handles subscribe/unsubscribe
* packetEvent - fired on an incoming packet
* errorEvent - reports errors from the MQTT client or the connector

The standard `DataConnector` events `load`, `afterLoad` and `loadError` are not used, but stub callbacks are provided for reference.

Although the `JSONConnector` and the `MQTTConnector` have much in common, there are some important differences:

* The MQTT Connector does not use polling
* The `load` method does not return any data
* The `orientation` option is fixed to `columns`
* The options `dataUrl`, `dataModifier` and `firstRowAsNames` are not supported
* The MQTT connector has some additional options:
    * `autoConnect` - automatically connect after load
    * `autoSubscribe` - automatically subscribe on connect
    * `autoReset` - clear data table on subscribe
    * `maxRows` - maximum number of rows in the data table

### MQTT client options

The `MQTTConnector` uses the [PAHO client library](https://eclipse.dev/paho/index.php?page=clients/js/index.php) (version 1.1.0) for access control and communication with the MQTT Broker. This library supports MQTT versions 3.1 and 3.1.1.

The client options are the following:

* host - the name of the MQTT broker (e.g. mqtt.mosquitto.org or broker.hivemq.com)
* port - **WebSocket** port (depends on the broker). See [HiveMQ](https://www.hivemq.com/mqtt/public-mqtt-broker/) for an example.
* user - empty for anonymous clients
* password - empty for anonymous clients
* useSSL - true for a secure connection
* topic - MQTT topic
* timeout - connection timeout, value in seconds
* qOs - quality of service

### The sample application

The `MQTTConnector` is implemented in a sample application that displays incoming data from two connectors, one for each MQTT topic.

Each connector provides data for a `spline` chart and a `DataGrids` component. In addition, timestamped events and the raw data are displayed as unformatted text in a message log that resides outside the **Dashboards** container. The user may clear the log.

The sample application relies on data being published to the two MQTT topics (*highcharts/topic1* and *highcharts/topic2*). The payload of the MQTT packet must be in a specific format to work correctly (see the example below).

The data is generated by an MQTT client hosted by Highcharts. It uses the [HiveMQ Websocket Client](https://www.hivemq.com/demos/websocket-client/), publishing to the topics *highcharts/topic1* and *highcharts/topic2*.

NB! Clicking the *Connect* button connects the application to the MQTT broker and subscribes to the two mentioned topics. Data should immediately appear in the charts and data grids.

Example data:
```
highcharts/topic1
```
Message
```javascript
 {
    "name": "North Sea",
    "value": 35.69,
    "timestamp": "2024-09-12T08:12:01.028Z"
 }
```

### Reuse

The `MQTTConnector` can be reused for other applications by copying the entire class from the demo's Javascript file. The implementation is found at the bottom of the file. It is also important to copy the `MQTTConnector.defaultOptions` and the code line that registers the connector as a **Dashboards** component.

```javascript
// Register the connector
MQTTConnector.registerType('MQTT', MQTTConnector);
```

<iframe style="width: 100%; height: 450px; border: none;" src="https://www.highcharts.com/samples/embed/dashboards/data/mqtt-connector" allow="fullscreen"></iframe>
