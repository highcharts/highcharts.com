const doc = document;

DataGrid.dataGrid('container', {
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
    events: {
        cell: {
            click: function () {
                doc.getElementById('cellClick').value = 'cellClick';
            },
            dblClick: function () {
                doc.getElementById('cellDblClick').value = 'cellDblClick';
            },
            mouseOver: function () {
                doc.getElementById('cellMouseOver').value = 'cellMouseOver';
            },
            mouseOut: function () {
                doc.getElementById('cellMouseOut').value = 'cellMouseOut';
            },
            afterEdit: function () {
                doc.getElementById('cellAfterEdit').value = 'cellAfterEdit';
            },
            afterSetValue: function () {
                if (this.row.index !== 1 || this.column.id !== 'weight') {
                    return;
                }
                const el = doc.getElementById('cellAfterSetValue');
                console.log(this.row.index, this.column.id);
                const counter = +el.value;
                el.value = counter + 1;
            }
        },
        column: {
            afterSorting: function () {
                doc.getElementById('columnSorting').value = 'afterSorting';
            },
            afterResize: function () {
                doc.getElementById('columnResizing').value = 'columnResizing';
            }
        },
        header: {
            click: function () {
                doc.getElementById('headerClick').value = 'headerClick';
            }
        }
    }
});
