const months = [{
    name: 'March',
    id: 'mar'
}, {
    name: 'April',
    id: 'apr'
}, {
    name: 'May',
    id: 'may'
}, {
    name: 'June',
    id: 'jun'
}, {
    name: 'July',
    id: 'jul'
}, {
    name: 'August',
    id: 'aug'
}];

const columns = {
    employee: [
        'Name1', 'Name2', 'Name', 'Name4', 'Name5', 'Name6',
        'Name7', 'Name8', 'Name9', 'Name10'
    ]
};

months.forEach(m => {
    columns[m.id + '24a'] = [0, 8, 5, 3, 7, 3, 4, 0, 7, 3];
    columns[m.id + '24b'] = [0, 8, 5, 3, 7, 3, 4, 0, 7, 3];
    columns[m.id + '24c'] = [0, 8, 5, 3, 7, 3, 4, 0, 7, 3];
    columns[m.id + '24d'] = [0, 8, 5, 3, 7, 3, 4, 0, 7, 3];
});

Grid.grid('container', {
    dataTable: {
        columns
    },
    header: [{
        columnId: 'employee',
        format: 'Employee'
    }, {
        format: '2024',
        columns: months.map(({ name, id }) => ({
            format: name,
            columns: [{
                columnId: id + '24a',
                format: 'A'
            }, {
                columnId: id + '24b',
                format: 'B'
            }, {
                columnId: id + '24c',
                format: 'C'
            }, {
                columnId: id + '24d',
                format: 'D'
            }]
        }))
    }],
    rendering: {
        columns: {
            distribution: 'fixed'
        },
        rows: {
            strictHeights: true
        }
    },
    columns: [{
        id: 'employee'
    }]
});
