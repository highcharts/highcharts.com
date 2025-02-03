const csvData = document.getElementById('csv').innerText;

Dashboards.board('container', {
    dataPool: {
        connectors: [{
            id: 'Vitamin',
            type: 'CSV',
            options: {
                csv: csvData,
                firstRowAsNames: true
            }
        }]
    },
    editMode: {
        enabled: true,
        contextMenu: {
            enabled: true
        }
    },
    gui: {
        layouts: [{
            id: 'layout-1',
            rowClassName: 'custom-row',
            cellClassName: 'custom-cell',
            rows: [{
                cells: [{
                    id: 'dashboard-col-0'
                }, {
                    id: 'dashboard-col-1'
                }]
            }]
        }]
    },
    components: [{
        renderTo: 'dashboard-col-0',
        connector: {
            id: 'Vitamin'
        },
        type: 'Highcharts',
        chartOptions: {
            chart: {
                type: 'pie'
            }
        },
        states: {
            active: {
                enabled: true,
                isActive: true
            }
        }
    }, {
        renderTo: 'dashboard-col-1',
        connector: {
            id: 'Vitamin'
        },
        type: 'Highcharts',
        chartOptions: {
            xAxis: {
                type: 'category'
            },
            chart: {
                animation: false,
                type: 'column'
            }
        },
        states: {
            active: {
                enabled: true
            }
        }
    }]
}, true);