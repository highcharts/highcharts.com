describe('Add components through UI', () => {
    beforeEach(() => {
        cy.visit('/dashboards/cypress/add-layout');
        cy.viewport(1200, 1000);
        cy.toggleEditMode();

        Cypress.on('uncaught:exception', () => {
            cy.log('Uncaught exception. Check the console for more details.');
            return false;
        })
    });

    it('should close the add component sidebar, clicking outside', function() {
        cy.get('.highcharts-dashboards-edit-tools-btn').contains('Add').click({force: true});
        cy.board().then((board) => {
            cy.get('.highcharts-dashboards-edit-sidebar').should('exist');
            cy.get('.highcharts-dashboards-edit-overlay-active').should('exist');

            cy.get('#dashboard-col-1').first().trigger('click', {force: true});

            cy.get('.highcharts-dashboards-edit-sidebar').should('not.have.class', 'highcharts-dashboards-edit-sidebar-show');
        });
    });

    it('should be able to add a layout', function() {
        cy.grabComponent('Row');
        cy.dropComponent('#dashboard-col-0');
        cy.board().then((board) => {
            assert.equal(
                board.layouts.length,
                2,
                'New layout should be added.'
            );
        });
    });

    it('should be able to add a HTML component', function() {

        // drop next to datagrid
        cy.grabComponent('HTML');
        cy.dropComponent('#dashboard-col-2');
        cy.hideSidebar(); // Hide sidebar to avoid interference with the next test.

        // drop between two top cells
        cy.grabComponent('HTML');
        cy.dropComponent('#dashboard-col-1');

        cy.hideSidebar(); // Hide sidebar to avoid interference with the next test.
        cy.board().then((board) => {
            assert.equal(
                board.layouts[0].rows[0].cells.length,
                3,
                'New cell should be added in the first row.'
            );

            assert.equal(
                board.layouts[0].rows[0].cells.length,
                3,
                'New cell should be added in the second row.'
            );

            const m = board.mountedComponents;
            assert.equal(
                m[m.length - 1].component.type,
                'HTML',
                `New component's type should be 'HTML'`
            );

            // HTML next to datagrid
            const rowHeight = m[m.length - 2].cell.row.container.getBoundingClientRect().height;
            const cellContentHeight = m[m.length - 2].component.contentElement.getBoundingClientRect().height;

            assert.ok(
                rowHeight > cellContentHeight,
                'The HTML Component has the same height as DataGrid'
            );

            // HTML Component next to containers
            const firstCellHeight = m[0].component.contentElement.getBoundingClientRect().height;
            const secondCellHeight = m[m.length - 1].component.contentElement.getBoundingClientRect().height;

            assert.strictEqual(
                Math.floor(firstCellHeight),
                Math.floor(secondCellHeight),
                'The HTML Component has the same height as siblings'
            );
        });
        cy.get('#dashboard-col-0').children().click()
        cy.get('.highcharts-dashboards-edit-menu.highcharts-dashboards-edit-toolbar-cell').children().should('be.visible')
    });

    it('should be able to add a chart component and resize it', function() {
        // Act
        cy.grabComponent('chart');
        cy.dropComponent('#dashboard-col-0')

        // Assert
        cy.get('.highcharts-dashboards-edit-accordion')
            .contains('Chart options')
            .click();
        // Legend toggle
        cy.get('.highcharts-dashboards-edit-toggle-container')
            .eq(1)
            .find('input[type="checkbox"]')
            .should('be.checked');
        // Data labels toggle
        cy.get('.highcharts-dashboards-edit-toggle-container')
            .eq(4)
            .find('input[type="checkbox"]')
            .should('not.be.checked');

        // Assert
        cy.hideSidebar(); // Hide sidebar to avoid interference with the next test.
        cy.board().then((board) => {
            assert.equal(
                board.layouts[0].rows[0].cells.length,
                3,
                'New cell should be added.'
            );

            const m = board.mountedComponents,
                component =  m[m.length - 1].component;
            assert.equal(
                component.type,
                'Highcharts',
                `New component's type should be 'Highcharts'.`
            );

            // check values connector
            assert.equal(
                component.chart.series.length > 0,
                true,
                `Highcharts should display values from CSV data table.`
            );
        });
    });

    it('DataGrid component should be added.', function() {
        cy.grabComponent('DataGrid');
        cy.dropComponent('#dashboard-col-0')
        cy.hideSidebar(); // Hide sidebar to avoid interference with the next test.
        cy.board().then((board) => {
            assert.equal(
                board.layouts[0].rows[0].cells.length,
                3,
                'New cell should be added.'
            );
            const m = board.mountedComponents,
                component = m[m.length - 1].component;
            assert.equal(
                component.type,
                'DataGrid',
                `New component's type should be 'DataGrid'.`
            );

            // check values connector
            assert.deepEqual(
                m[m.length - 2].component.dataGrid.columnNames,
                component.dataGrid.columnNames,
                `DataGrid should display values from CSV data table.`
            );
        });
    });

    it('KPI component is added.', function() {
        cy.grabComponent('KPI');
        cy.dropComponent('#dashboard-col-0')
        cy.hideSidebar(); // Hide sidebar to avoid interference with the next test.
        cy.board().then((board) => {
            assert.equal(
                board.layouts[0].rows[0].cells.length,
                3,
                'New cell should be added.'
            );
            const m = board.mountedComponents,
                component = m[m.length - 1].component;
            assert.equal(
                component.type,
                'KPI',
                `New component's type should be 'KPI'.`
            );
        });
    });

    it('The component is added to empty dashboard.', function() {

        cy.get('#dashboard-col-0').click({ force: true });
        cy.get('.highcharts-dashboards-edit-menu-destroy').first().click();
        cy.get('.highcharts-dashboards-edit-confirmation-popup-confirm-btn').click({ force: true });

        cy.get('#dashboard-col-2').click({ force: true });
        cy.get('.highcharts-dashboards-edit-menu-destroy').first().click({ force: true });
        cy.get('.highcharts-dashboards-edit-confirmation-popup-confirm-btn').click({ force: true });

        cy.grabComponent('chart');
        cy.dropComponent('.highcharts-dashboards-wrapper');
        cy.hideSidebar(); // Hide sidebar to avoid interference with the next test.
        cy.board().then((board) => {
            assert.equal(
                board.layouts[0].rows[0].cells.length,
                1,
                'New cell should be added.'
            );
            const m = board.mountedComponents,
                component = m[m.length - 1].component;

            assert.equal(
                component.type,
                'Highcharts',
                `New component's type should be 'Highcharts'.`
            );
        });
    });
});

describe('Edit mode with toolbars disabled', () => {
    before(() => {
        cy.visit('/dashboards/edit-mode/toolbars-disabled');
        cy.toggleEditMode();
    });

    it('Add component button should not exist.', () => {
        cy.get('.highcharts-dashboards-edit-tools-btn').should('not.exist');
    });
});

describe('Edit mode with add component button disabled', () => {
    before(() => {
        cy.visit('/dashboards/edit-mode/add-component-button-disabled');
        cy.toggleEditMode();
    });

    it('Add component button should not exist.', () => {
        cy.get('.highcharts-dashboards-edit-tools-btn').should('not.exist');
    });
});
