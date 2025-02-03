const dataTable = new Highcharts.DataTableCore({
    columns: {
        year: [2020, 2021, 2022, 2023],
        cost: [11, 13, 12, 14],
        revenue: [12, 15, 14, 18]
    }
});

const previewTable = () => {
    let html = '<tr>' + Object.keys(dataTable.columns).reduce((html, key) => {
        html += `<th>${key}</th>`;
        return html;
    }, '') + '</tr>';
    html += new Array(dataTable.rowCount)
        .fill(1)
        .reduce((html, _, rowNo) => {
            const row = dataTable.getRow(rowNo);
            html += '<tr>';
            Object.keys(row).forEach(key => {
                html += `<td>${row[key]}</td>`;
            });
            html += '</tr>';
            return html;
        }, '');
    document.getElementById('data-table').innerHTML = html;
};

previewTable();

Highcharts.chart('container', {
    dataTable,
    chart: {
        type: 'column'
    },
    title: {
        text: 'Common data table'
    },
    series: [{
        name: 'Cost',
        columnAssignment: [{
            key: 'x',
            columnName: 'year'
        }, {
            key: 'y',
            columnName: 'cost'
        }]
    }, {
        name: 'Revenue',
        columnAssignment: [{
            key: 'x',
            columnName: 'year'
        }, {
            key: 'y',
            columnName: 'revenue'
        }]
    }]
});


document.getElementById('addrow').addEventListener('click', e => {
    dataTable.setRow({
        year: 2024,
        cost: 15,
        revenue: 20
    });
    previewTable();
    e.target.disabled = true;
});

// @todo: Support for setColumn too. Fails to update the point because in
// generatePoints, before the `new PointClass` call, the point already exists.
// Probably need to refactor the `updateData` method to a true data-matching
// method between old table and updated table, instead of working on options.
// This could run either at the end of setData, or possibly within
// generatePoints.
document.getElementById('updaterow').addEventListener('click', e => {
    dataTable.setRow({
        cost: Math.round(15 * Math.random()),
        revenue: Math.round(10 * Math.random())
    }, 1);
    previewTable();
});

document.getElementById('deleterow').addEventListener('click', e => {
    dataTable.deleteRows(0);
    e.target.disabled = true;
    previewTable();
});
