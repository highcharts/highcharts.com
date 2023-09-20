// Tests that the generated data table has the right structure
QUnit.test('Accessible data table', function (assert) {
    var head,
        body,
        chart = Highcharts.chart('container', {
            plotOptions: {
                series: {
                    keys: ['y', 'name']
                }
            },
            series: [
                {
                    data: [
                        [1, 'bob'],
                        [2, 'bob'],
                        [3, 'bob']
                    ]
                },
                {
                    data: [
                        [4, '1'],
                        [5, '1'],
                        [6, '1']
                    ]
                },
                {
                    data: [
                        [7, 'john'],
                        [8, 'john'],
                        [9, 'extra']
                    ]
                }
            ]
        });

    chart.viewData();

    assert.ok(chart.dataTableDiv, 'Data table created');

    head = chart.dataTableDiv.getElementsByTagName('thead')[0];
    body = chart.dataTableDiv.getElementsByTagName('tbody')[0];

    assert.ok(head, 'Data table has head');
    assert.strictEqual(head.children.length, 2, 'Data table head has two rows');

    for (const row of head.children) {
        for (const cell of row.children) {
            if (cell.innerHTML) {
                assert.strictEqual(
                    cell.getAttribute('scope'),
                    'col',
                    'Header cell has col scope'
                );
                assert.strictEqual(cell.tagName, 'TH', 'Header cell is th');
            }
        }
    }

    assert.ok(body, 'Data table has body');
    assert.strictEqual(
        body.children.length,
        3,
        'Data table body has three rows'
    );

    for (const row of body.children) {
        assert.strictEqual(
            row.firstChild.tagName,
            'TH',
            'First cell is heading'
        );
        assert.strictEqual(
            row.firstChild.getAttribute('scope'),
            'row',
            'First cell has scope'
        );
    }
});
