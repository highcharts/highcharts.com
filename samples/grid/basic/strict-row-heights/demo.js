Grid.grid('container', {
    dataTable: {
        columns: {
            a: Array.from({ length: 100 }, (_, i) => `A${i} quite a long text`),
            b: Array.from({ length: 100 }, (_, i) => `B${i} Lorem ipsum dolor sit amet, consectetur adipiscing elit.`), // eslint-disable-line
            c: Array.from({ length: 100 }, (_, i) => `C${i}`),
            d: Array.from({ length: 100 }, (_, i) => `D${i}`),
            'lorem ipsum': Array.from({ length: 100 }, (_, i) => `E${i}`), // eslint-disable-line
            f: Array.from({ length: 100 }, (_, i) => `F${i}`)
        }
    },
    rendering: {
        rows: {
            strictHeights: true
        }
    }
});
