const columnSelectEl = document.getElementById('select-column');
const orderSelectEl = document.getElementById('select-order');
const applyBtnEl = document.getElementById('apply-btn');

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
        id: 'icon',
        sorting: {
            sortable: false
        }
    }, {
        id: 'price',
        sorting: {
            order: 'asc'
        }
    }],
    events: {
        column: {
            afterSorting: function () {
                const { sorting } = this.viewport.grid.querying;

                columnSelectEl.value = this.id;
                orderSelectEl.value = sorting.currentSorting.order || '';
            }
        }
    }
}, true).then(dg => {
    window.grid = dg;

    const currentSorting = dg.querying.sorting.currentSorting;

    dg.enabledColumns.forEach(columnId => {
        let selected = '';

        if (currentSorting.columnId === columnId) {
            selected = 'selected';
        }

        columnSelectEl.innerHTML += `
            <option value="${columnId}" ${selected}>${columnId}</option>
        `;
    });

    if (currentSorting.order) {
        orderSelectEl.value = currentSorting.order;
    }

    applyBtnEl.addEventListener('click', () => {
        dg.viewport.getColumn(columnSelectEl.value).sorting.setOrder(
            orderSelectEl.value
        );
    });
});
