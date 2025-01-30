Grid.grid('container', {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 120, 4.5]
        }
    },
    rendering: {
        table: {
            className: 'custom-table-class-name abc'
        }
    },
    columnDefaults: {
        cells: {
            className: '{#if (gt value 100)}greater-than-100 second-class{/if}',
            editable: true
        },
        header: {
            className: 'header-cell-custom-class-{column.id}'
        }
    },
    columns: [{
        id: 'weight',
        className: 'custom-column-class-name'
    }]
});
