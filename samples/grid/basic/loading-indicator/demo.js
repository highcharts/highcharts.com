const grid = Grid.grid('container', {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [],
            price: []
        }
    }
});

let isLoading = false;
document.getElementById('load').addEventListener('click', () => {
    if (isLoading) {
        return;
    }
    isLoading = true;

    // Show the loading indicator
    grid.showLoading('Loading data...');

    // Simulate a get request
    setTimeout(() => {
        grid.update({
            dataTable: {
                columns: {
                    product: ['Apples', 'Pears', 'Plums', 'Bananas'],
                    weight: Array.from({ length: 4 }, () =>
                        Math.round(Math.random() * 100)
                    ),
                    price: Array.from({ length: 4 }, () =>
                        Math.round(Math.random() * 10)
                    )
                }
            }
        });
        grid.hideLoading();
        isLoading = false;
    }, 2000);
});
