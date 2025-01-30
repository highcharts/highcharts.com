const options = {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5],
            metaData: ['a', 'b', 'c', 'd'],
            icon: ['Apples URL', 'Pears URL', 'Plums URL', 'Bananas URL']
        }
    }
};
let dg = Grid.grid('container', options);

document.getElementById('destroy-btn').addEventListener('click', () => {
    dg.destroy();
    console.log('destroyed:', dg);
});

document.getElementById('load-btn').addEventListener('click', () => {
    dg.destroy();
    dg = new Grid.grid('container', options);
    console.log('created:', dg);
});
