describe('DataGrid events.', () => {
    before(() => {
        cy.visit('grid/cypress/grouped-headers');
    });

    it('Renders multilevel header.', () => {
        cy.get('table thead tr').should('have.length', 3);
    });

    it('Hidden columns.', () => {
        cy.get('table thead tr:nth-child(3) th').should('have.length', 2);
        cy.window().then((win) => {
            win.dataGrid.update({
                columns: [{
                    id: 'icon',
                    enabled: false
                }]
            });

            // Hidden column
            cy.get('table thead tr:nth-child(3) th').should('have.length', 1);
            cy.get('th').contains('price').should('not.exist');
            cy.get('th').contains('url').should('not.exist');
        });
    });

    it('All hidden columns in group, hide group header.', () => {
        cy.window().then((win) => {
            win.dataGrid.update({
                columns: [{
                    id: 'url',
                    enabled: false
                }]
            });

            // If all columns in group are hidden, hide the group.
            cy.get('table thead tr:nth-child(1) th').should('have.length', 2);
            cy.get('table thead tr:nth-child(2) th').should('have.length', 2);
            cy.get('table thead tr:nth-child(3) th').should('have.length', 1);
        });
    });

    it('Grouped headers should be not sortable.', () => {
        // Click header that has direct reference to column
        cy.get('th[data-column-id="id"]')
            .click()
            .should('have.class', 'highcharts-datagrid-column-sortable');

        // Click header that group columns
        cy.get('th')
            .contains('Product')
            .click()
            .should('not.have.class', 'highcharts-datagrid-column-sortable');
    });
});
