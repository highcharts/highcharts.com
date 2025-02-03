Data Layer
==========

The data layer provides functionality to load, process and convert data for
different use cases. Additionally, it provides the necessary structure to
synchronize data changes between different components and network nodes.

Sub-folders:

* Connectors - make data sources accessible via a managed table

* Converters - create a table from an input format, and an output format from a
  table

* Modifiers - modify table data into a second table, accessible via the
  `DataTable.modified` property.



DataTable - Managing Data
-------------------------

Tables are the central point in managing data. Data in tables is organized by
columns. This means that retrieving a column from a table comes at nearly no
cost.



### Creating A Table

A table can be created with predefined columns and a manual ID to differentiate
between table instances.

```TypeScript
const table = new DataTable({
    columns: {
        year: [1984, 1990],
        title: ['Gremlins', 'Gremlins 2: The New Batch']
    },
    id: 'gremlins_movies'
});
table.id === 'gremlins_movies';
table.autoId === false;
```

### Column References

For maximum performance you can retrieve columns from the table as a reference.
These arrays are the internal representation, and a change in the retrieved array
will change the table's column as well.

```TypeScript
const column = table.getColumn('year', true);
column[0] = 2004;
table.getRow(0)[0] === 2004;
table.setCell('year', 0, 1984);
column[0] === 1984
```



### Change Events

Changing data in the table with setter functions will trigger an event on the
table. If a change in the table is done indirectly via column reference, no
event will be emitted.

```TypeScript
table.on('afterSetRows', function (e) {
    e.rowCount === 1;
    this.getRowCount() === 3;
});
table.setRow([2023, 'Gremlins 3']);
table.deleteRows(table.getRowIndexBy('title', 'Gremlins 3'), 1);
```



### Table Modifier

Tables can provide automatic modification of data during their lifetime with the
help of modifiers. Each table can have only one modifier, but this modifier
might call additional modifiers.

Modifications usually do not change the table. Instead modifiers produce a
second table, accessible under `DataTable.modified`. Changes in the original
table will also result in changes in the second table, unless the modifier
explicitly dismisses incoming changes.

```TypeScript
table.setModifier(new RangeModifier({
    ranges: [{
        column: 'year',
        minValue: 1980,
        maxValue: 1989,
    }],
    strict: true
});
table.getRowCount() === 2;
table.modified.getRowCount() === 1;

table.setRows([
    [1983, 'Gremlins Teaser'],
    [2023, 'Gremlins 3']
]);
table.getRowCount() === 4;
table.modified.getRowCount() === 2;
```



### DataTable in Highcharts

If the series does support tables, you can use the 'setTable' to connect and
synchronize table and series. Otherwise, you use the data options to provide the
columns of interest. The most effective way is to retrieve the necessary data
from the table as two dimensional arrays like Highcharts expects it.

```TypeScript
const chart = new Highcharts.chart('container', {
    series: [{
        type: 'flags',
        data: table.getRows(0, void 0, ['year', 'title']);
    }]
});
```


### DataTable in DataGrid

DataGrid shows and optionally modifies cell content in a table. DataGrid can
also change the order of cells, but DataTable provides only limited information
about the original order of a source. Therefore, a DataConnector might be needed
to retrieve the original order.

```TypeScript
const dataGrid = DataGrid.dataGrid('container', {
    dataTable: new DataTable({
        columns: {
            Value: [ 12.34, 45.67, 78.90 ],
            Currency: [ 'EUR', 'DKK', 'NOK' ]
        }
    })
});
```

If a row reference is needed, an index column has to be part of the dataTable:

```TypeScript
const dataGrid = new DataGrid('container', {
    dataTable: new DataTable({
        columns: {
            '': [1, 2, 3],
            Value: [ 12.34, 45.67, 78.90 ],
            Currency: [ 'EUR', 'DKK', 'NOK' ]
        }
    }
});
dataGrid.dataTable.getRow(dataGrid.table.getRowIndexBy('', 2));
```



### DataTable in Dashboards

Some components in Dashboard use DataTable or DataConnector to show data. You
can use a single table or connector in multiple components and in that way
synchronize data.



DataConnector - Loading And Saving Data
-----------------------------------

Loading external data is usually done via a DataConnector. A DataConnector takes
either an URL or a local source.



### DataConnector Registry

DataConnector types can be directly loaded via import. In the case of bundles,
connectors can also be accessed via registry, as the registry gets updated with
each bundled type.

```TypeScript
import CSVConnector from 'dashboards/Data/Connectors/CSVConnector';
```

```TypeScript
const CSVConnector = Dashboards.DataConnector.types.CSVConnector;
```



### Data Converter

Every connector needs a specific converter to parse data from and to the source
format. You can provide your own custom converter or keep the default one.

```TypeScript
const converter = new CSVConverter({
    decimalPoint: ',',
    itemDelimiter: ';',
});
const connector = new CSVConnector({
    csv: 'a;b\n1,2;3,4\n5,6;7,8'
});
await connector.load();
connector.table.getRowCount() === 2;
```



### Creating A Connector And Loading Data

You can create a connector without loading any data. In that case you just get
an empty table, which you can fill up with data to save it later. Or you can
provide a table with existing data.

```TypeScript
const connector = new CSVConnector();
connector.table.getRowCount() === 0;
const table = new DataTable({ columns: { column: [1, 2, 3] } });
const connector2 = new CSVConnector(table);
connector.table.getRowCount() === 3;
```

Depending on the connector type you have to provide different mandatory options
to load data. Continuing with our example we can provide a URL to a CSV and then
wait for loading to fulfill.

```TypeScript
const connector = new CSVConnector({
    csvURL: 'https://domain.example/source.csv'
});
try {
    await connector.load();
}
catch (error) {
    console.error(error);
}
connector.table.getRowCount() > 0;
```



### Saving Data

How to save a table depends on the connector type and use case. In a strict
server-less situation, instead of the save function you usually use the
related converter.

```TypeScript
const connector = new CSVConnector({
    csv: 'column\n1\n2\n3\n'
});
connector.converter.export(connector) === 'column\n1\n2\n3\n';
```

If your connector is based on an external source on the internet or in the HTML
DOM, the save function can write data back. Please note that an error will be
thrown if this is not supported by the connector type, or if permissions do now
allow this.

```TypeScript
const connector = new HTMLTableConnector({
    tableElement: document.getElementById('the_table')
});
try {
    await connector.save();
}
catch (error) {
    console.error(error);
}
```



DataPool
--------

With DataPool one can "lazy" load connectors besides the initial phase. After
adding connector id, connector type and connector options to DataPool, one can
request (later on) the connector or table under their given name and the class
will give a promise that resolves to the connector or table as soon as it has
been loaded.

```TypeScript
const dataPool = new DataPool({
    connectors: [{
        id: 'my-google-spreadsheet',
        type: 'GoogleSheets',
        options: {
            googleAPIKey: 'XXXXX',
            googleSpreadsheetKey: 'XXXXX',
        }
    }]
});
dataPool.setConnectorOptions({
    name: 'my-csv',
    type: 'CSV',
    options: {
        csvURL: 'https://domain.example/data.csv'
    }
});
const googleConnector = await dataPool.getConnector('my-google-spreadsheet');
const csvTable = await dataPool.getConnectorTable('my-csv');
```

DataPool can be used to coordinate and share connectors and their
data between multiple modules. You can request the connector multiple times,
while the class will load each connector only once.

```TypeScript
const googleConnector1 = await dataPool.getConnector('my-google-spreadsheet');
const googleConnector2 = await dataPool.getConnector('my-google-spreadsheet');
const googleConnector3 = await dataPool.getConnector('my-google-spreadsheet');
```
