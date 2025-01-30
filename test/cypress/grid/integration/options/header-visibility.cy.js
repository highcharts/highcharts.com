describe('DataGrid Header visibility.', () => {
    before(() => {
        cy.visit('grid/basic/header-visibility');
    });

    it('Visibility of the table header should be toggled.', () => {
        cy.get('#toggle-header').click();
        cy.get('.highcharts-datagrid-table thead').should('not.exist');
        cy.get('#toggle-header').click();
        cy.get('.highcharts-datagrid-table thead').should('exist');
    });
});
