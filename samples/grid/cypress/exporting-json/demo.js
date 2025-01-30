const jsonBtn = document.querySelector('#json'),
    result = document.querySelector('#result');

/**
 * Grid init
 */
const grid = Grid.grid('container', {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5],
            metaData: ['a', 'b', 'c', 'd']
        }
    },
    columnDefaults: {
        cells: {
            editable: true
        }
    },
    columns: [{
        id: 'metaData',
        enabled: false
    }]
});

/**
 * Grid init
 */
jsonBtn.addEventListener('click', () => {
    result.innerHTML = grid.getJSON();
});
