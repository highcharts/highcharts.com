Grid.grid('container', {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5],
            metaData: ['a', 'b', 'c', 'd'],
            icon: ['Apples URL', 'Pears URL', 'Plums URL', 'Bananas URL']
        }
    },
    columnDefaults: {
        cells: {
            editable: true
        }
    },
    columns: [{
        id: 'weight',
        className: 'custom-column-class-name',
        cells: {
            formatter: function () {
                return 'V: ' + this.value;
            }
        }
    }, {
        id: 'metaData',
        enabled: false
    }]
});
