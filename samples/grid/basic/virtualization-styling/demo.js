function generateRandomData(rows) {
    const names = ['John', 'Jane', 'Alex', 'Chris', 'Katie', 'Michael'];
    const departments = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance'];
    const positions = [
        'Manager',
        'Software Developer',
        'Sales Executive',
        'Marketing Specialist',
        'Financial Analyst'
    ];
    const columns = {
        ID: [],
        Name: [],
        Department: [],
        Position: [],
        Email: []
    };

    for (let i = 0; i < rows; i++) {
        const nameIndex = Math.floor(Math.random() * names.length);
        const departmentIndex = Math.floor(Math.random() * departments.length);
        const positionIndex = Math.floor(Math.random() * positions.length);
        const id = i + 1;
        const email = `${names[nameIndex].toLowerCase()}${id}@example.com`;

        columns.ID.push(id);
        columns.Name.push(names[nameIndex]);
        columns.Department.push(departments[departmentIndex]);
        columns.Position.push(positions[positionIndex]);
        columns.Email.push(email);
    }

    return columns;
}

const dataColumns = generateRandomData(100);

const staticDatagrid = Grid.grid('container', {
    dataTable: {
        columns: dataColumns
    }
});

const autoDataGrid = Grid.grid('container-noheight', {
    dataTable: {
        columns: dataColumns
    }
});

const dashboardDataGrid = Dashboards.board('dashboard-container', {
    gui: {
        layouts: [{
            id: 'layout-1',
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
        type: 'Highcharts',
        chartOptions: {
            series: [{
                data: [1, 2, 3, 4]
            }]
        }
    }, {
        renderTo: 'dashboard-col-1',
        type: 'DataGrid',
        dataGridOptions: {
            dataTable: {
                columns: dataColumns
            }
        }
    }]
});

const radioButtons = document.querySelectorAll('input[name="virtualized"]');

radioButtons.forEach(el => {
    el.addEventListener('change', e => {
        const isVirtualized = e.target.value === 'yes';

        staticDatagrid.update({
            rendering: {
                rows: {
                    virtualization: isVirtualized
                }
            }
        });

        autoDataGrid.update({
            rendering: {
                rows: {
                    virtualization: isVirtualized
                }
            }
        });

        dashboardDataGrid.mountedComponents[1].component.update({
            dataGridOptions: {
                rendering: {
                    rows: {
                        virtualization: isVirtualized
                    }
                }
            }
        });
    });
});
