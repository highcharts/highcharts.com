const dg = Grid.grid('container', {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5],
            metaData: ['a', 'b', 'c', 'd'],
            icon: ['Apples URL', 'Pears URL', 'Plums URL', 'Bananas URL']
        }
    }
});

document.getElementById('toggle-header').addEventListener('click', () => {
    dg.update({
        rendering: {
            header: {
                enabled: !dg.options.rendering.header.enabled
            }
        }
    });
});
