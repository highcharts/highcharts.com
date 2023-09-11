import HTMLTableConnector from '/base/code/es-modules/Data/Connectors/HTMLTableConnector.js'
import HTMLTableConverter from '/base/code/es-modules/Data/Converters/HTMLTableConverter.js'
import U from '/base/code/es-modules/Shared/Utilities.js';
import { registerConnectorEvents, testExportedDataTable } from './utils.js'
import CSVConnector from '/base/code/es-modules/Data/Connectors/CSVConnector.js';
const { test, only } = QUnit;
const { createElement } = U;

const tableHTML = `<table id="data">
<tr>
    <th>Index</th>
    <th>State</th>
    <th>Score</th>
</tr>
<tr>
    <td>1</td>
    <td>HAWAII</td>
    <td>2.0</td>
</tr>
<tr>
    <td>2</td>
    <td>NEW HAMPSHIRE</td>
    <td>2.6</td>
</tr>
<tr>
    <td>2</td>
    <td>NORTH DAKOTA</td>
    <td>2.6</td>
</tr>
<tr>
    <td>4</td>
    <td>NEBRASKA</td>
    <td>2.7</td>
</tr>
<tr>
    <td>5</td>
    <td>IOWA</td>
    <td>2.8</td>
</tr>
<tr>
    <td>5</td>
    <td>VERMONT</td>
    <td>2.8</td>
</tr>
<tr>
    <td>7</td>
    <td>IDAHO</td>
    <td>2.9</td>
</tr>
<tr>
    <td>8</td>
    <td>MAINE</td>
    <td>3.0</td>
</tr>
<tr>
    <td>8</td>
    <td>WISCONSIN</td>
    <td>3.0</td>
</tr>
<tr>
    <td>10</td>
    <td>COLORADO</td>
    <td>3.1</td>
</tr>
<tr>
    <td>10</td>
    <td>MINNESOTA</td>
    <td>3.1</td>
</tr>
<tr>
    <td>10</td>
    <td>UTAH</td>
    <td>3.1</td>
</tr>
<tr>
    <td>13</td>
    <td>TENNESSEE</td>
    <td>3.2</td>
</tr>
<tr>
    <td>14</td>
    <td>INDIANA</td>
    <td>3.4</td>
</tr>
<tr>
    <td>14</td>
    <td>KANSAS</td>
    <td>3.4</td>
</tr>
<tr>
    <td>16</td>
    <td>ALABAMA</td>
    <td>3.5</td>
</tr>
<tr>
    <td>16</td>
    <td>MASSACHUSETTS</td>
    <td>3.5</td>
</tr>
<tr>
    <td>16</td>
    <td>MISSOURI</td>
    <td>3.5</td>
</tr>
<tr>
    <td>16</td>
    <td>SOUTH DAKOTA</td>
    <td>3.5</td>
</tr>
<tr>
    <td>20</td>
    <td>ARKANSAS</td>
    <td>3.7</td>
</tr>
<tr>
    <td>20</td>
    <td>FLORIDA</td>
    <td>3.7</td>
</tr>
<tr>
    <td>20</td>
    <td>VIRGINIA</td>
    <td>3.7</td>
</tr>
<tr>
    <td>23</td>
    <td>TEXAS</td>
    <td>3.9</td>
</tr>
<tr>
    <td>24</td>
    <td>MARYLAND</td>
    <td>4.0</td>
</tr>
<tr>
    <td>25</td>
    <td>MONTANA</td>
    <td>4.1</td>
</tr>
<tr>
    <td>25</td>
    <td>OKLAHOMA</td>
    <td>4.1</td>
</tr>
<tr>
    <td>25</td>
    <td>OREGON</td>
    <td>4.1</td>
</tr>
<tr>
    <td>25</td>
    <td>SOUTH CAROLINA</td>
    <td>4.1</td>
</tr>
<tr>
    <td>29</td>
    <td>WYOMING</td>
    <td>4.2</td>
</tr>
<tr>
    <td>30</td>
    <td>CALIFORNIA</td>
    <td>4.3</td>
</tr>
<tr>
    <td>31</td>
    <td>GEORGIA</td>
    <td>4.4</td>
</tr>
<tr>
    <td>31</td>
    <td>KENTUCKY</td>
    <td>4.4</td>
</tr>
<tr>
    <td>31</td>
    <td>RHODE ISLAND</td>
    <td>4.4</td>
</tr>
<tr>
    <td>34</td>
    <td>ARIZONA</td>
    <td>4.5</td>
</tr>
<tr>
    <td>34</td>
    <td>NORTH CAROLINA</td>
    <td>4.5</td>
</tr>
<tr>
    <td>34</td>
    <td>WASHINGTON</td>
    <td>4.5</td>
</tr>
<tr>
    <td>37</td>
    <td>CONNECTICUT</td>
    <td>4.6</td>
</tr>
<tr>
    <td>37</td>
    <td>DELAWARE</td>
    <td>4.6</td>
</tr>
<tr>
    <td>37</td>
    <td>LOUISIANA</td>
    <td>4.6</td>
</tr>
<tr>
    <td>37</td>
    <td>MISSISSIPPI</td>
    <td>4.6</td>
</tr>
<tr>
    <td>37</td>
    <td>NEW YORK</td>
    <td>4.6</td>
</tr>
<tr>
    <td>42</td>
    <td>MICHIGAN</td>
    <td>4.7</td>
</tr>
<tr>
    <td>42</td>
    <td>OHIO</td>
    <td>4.7</td>
</tr>
<tr>
    <td>42</td>
    <td>PENNSYLVANIA</td>
    <td>4.7</td>
</tr>
<tr>
    <td>45</td>
    <td>ILLINOIS</td>
    <td>4.8</td>
</tr>
<tr>
    <td>46</td>
    <td>NEVADA</td>
    <td>5.0</td>
</tr>
<tr>
    <td>46</td>
    <td>NEW JERSEY</td>
    <td>5.0</td>
</tr>
<tr>
    <td>48</td>
    <td>WEST VIRGINIA</td>
    <td>5.5</td>
</tr>
<tr>
    <td>49</td>
    <td>DISTRICT OF COLUMBIA</td>
    <td>6.0</td>
</tr>
<tr>
    <td>49</td>
    <td>NEW MEXICO</td>
    <td>6.0</td>
</tr>
<tr>
    <td>51</td>
    <td>ALASKA</td>
    <td>7.3</td>
</tr>
</table>`;

test('HTMLTableConnector from HTML element', function (assert) {
    const registeredEvents = [];

    const tableElement = createElement('div');
    tableElement.innerHTML = tableHTML;

    const connector = new HTMLTableConnector({ table: tableElement });

    const doneLoading = assert.async();

    registerConnectorEvents(connector, registeredEvents, assert);

    connector.on('afterLoad', (e) => {
        assert.deepEqual(
            registeredEvents,
            ['load', 'afterLoad'],
            'Events are fired in the correct order'
        )
        assert.strictEqual(
            e.table.getRowCount(),
            tableElement.querySelectorAll('tr').length - 1,
            'Connector loaded from HTML element has same amount of rows minus the column names'
        )

        // const connectorFromJSON = HTMLTableConnector.fromJSON(connector.toJSON());
        // connectorFromJSON.load();

        // testExportedDataTable(e.table, connectorFromJSON.table, assert);

        doneLoading();
    });

    connector.load();
});

test('HTMLTableConverter', function (assert) {
    const tableElement = createElement('div');

    tableElement.setAttribute('id', 'myDivider');
    tableElement.innerHTML = tableHTML;

    const dataconverter = new HTMLTableConverter({ tableElement })
    const done = assert.async();

    dataconverter.on('afterParse', e => {
        assert.strictEqual(
            dataconverter.tableElementID,
            tableElement.id,
            'Exported converter should have correct `tableElementID`.'
        );
        done();
    });
    dataconverter.parse();
});

test('Export as HTML', async (assert) => {
    const csv = `identifier,Range (low),Range (mid),Range (high),something else,Range (ultra)
1,2,5,10,"Blue",22`;

    // Load the table from the CSV
    const csvconnector = new CSVConnector({ csv });

    await csvconnector.load();

    const connector = new HTMLTableConnector({
            dataTable: {
                columns: csvconnector.table.getColumns()
            }
        }),
        converter = connector.converter;

    // Export with default settings (multiline and rowspan should be enabled)
    let htmlExport = converter.export(connector);

    const tableElement = createElement('div');
    tableElement.innerHTML = htmlExport;

    assert.strictEqual(
        tableElement.querySelectorAll('thead tr').length,
        2,
        'Table head should have two rows'
    );

    // To be revisited
    // assert.strictEqual(
    //     HTMLElement.querySelectorAll('th[colspan="3"]').length,
    //     1,
    //     'Exported table should have one header with colspan 3'
    // );
    // assert.strictEqual(
    //     HTMLElement.querySelectorAll('th[rowspan="2"]').length,
    //     2,
    //     'Exported table should have 2 headers with rowspan 2'
    // );

    // Multilevel headers disabled
    htmlExport = converter.export(connector, {
        useMultiLevelHeaders: false
    });
    tableElement.innerHTML = htmlExport;

    assert.strictEqual(
        tableElement.querySelectorAll('thead tr').length,
        1,
        'Table head should have a single row'
    );
    assert.strictEqual(
        tableElement.querySelectorAll('th[colspan]').length,
        0,
        'Exported table should have no headers with colspan'
    );
    assert.strictEqual(
        tableElement.querySelectorAll('th[rowspan]').length,
        0,
        'Exported table should have no headers with rowspan'
    );

    // table caption
    htmlExport = converter.export(connector, {
        useMultiLevelHeaders: false,
        tableCaption: 'My Data Table'
    });

    tableElement.innerHTML = htmlExport;
    const captionSearch = tableElement.querySelectorAll('caption');

    assert.strictEqual(
        captionSearch.length,
        1,
        'The table should have a single caption'
    );
    assert.strictEqual(
        captionSearch[0].innerText,
        'My Data Table'
    );

    // Make sure the exported table is parseable, and returns the same result
    const connectorWithExport = new HTMLTableConnector({ table: tableElement });
    const done = assert.async();

    connectorWithExport.on('afterLoad', e => {
        assert.strictEqual(
            converter.export(connectorWithExport),
            converter.export(connector),
            'Connector from parsed table should produce same result as original connector'
        );
        done();
    });
    connectorWithExport.on('loadError', () => {
        assert.ok(
            false,
            'The load failed'
        )
        done();
    });

    await connectorWithExport.load();

});
