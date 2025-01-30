Grid.grid('container', {
    dataTable: {
        columns: {
            id: ['1', '2', '3', '4'],
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5]
        }
    },
    lang: {
        accessibility: {
            cellEditing: {
                editable: 'The cell can be edited.',
                announcements: {
                    started: 'Started editing the cell.',
                    edited: 'The cell has been updated.',
                    cancelled: 'Cell\'s editing is cancelled.'
                }
            },
            sorting: {
                announcements: {
                    ascending: 'The column is sorted in ascending order.',
                    descending: 'The column is sorted in descending order.',
                    none: 'Cleared sorting of the column.'
                }
            }
        }
    },
    columnDefaults: {
        cells: {
            editable: true
        }
    },
    header: [
        'id',
        {
            format: 'Product',
            accessibility: {
                description: 'The Product group consists of two columns: ' +
                    'product name and units'
            },
            columns: [{
                format: 'Product name',
                columnId: 'product'
            }, {
                format: 'Units',
                accessibility: {
                    description: 'The Units group consists of two columns: ' +
                        'weight and custom price'
                },
                columns: [{
                    columnId: 'weight'
                }, {
                    format: 'Custom price',
                    columnId: 'price'
                }]
            }]
        }
    ],
    columns: [{
        id: 'weight',
        header: {
            format: 'Weight'
        }
    }]
});
