const grid = new Grid.grid('container', {
    dataTable: {
        columns: {
            a: Array.from({ length: 1000 }, (_, i) => `A${i} lorem ipsum`),
            b: Array.from({ length: 1000 }, (_, i) =>
                `B${i} long text test lorem ipsum dolor sit amet, consectetur`
            ),
            c: Array.from({ length: 1000 }, (_, i) => `C${i}`),
            d: Array.from({ length: 1000 }, (_, i) => `D${i}`),
            'lorem ipsum': Array.from({ length: 1000 }, (_, i) => `E${i}`),
            f: Array.from({ length: 1000 }, (_, i) => `F${i}`)
        }
    },
    rendering: {
        rows: {
            bufferSize: 5
        }
    },
    caption: {
        text: 'Title of the new Grid with a custom CSS class.',
        className: 'custom-caption-class'
    },
    columnDefaults: {
        header: {
            format: 'Col-{id}'
        },
        cells: {
            format: 'V: {value}'
        }
    },
    columns: [{
        id: 'd',
        header: {
            format: 'Col D'
        },
        cells: {
            format: '{row.index}%'
        }
    }]
});

document.getElementById('scroll').addEventListener('submit', e => {
    e.preventDefault();
    const value = +e.target.elements['row-to-scroll'].value;
    if (!isNaN(value)) {
        grid.viewport.scrollToRow(value);
    }
});

console.log(grid);
