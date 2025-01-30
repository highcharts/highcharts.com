describe('Remove the dashboard.', () => {
    before(() => {
        cy.visit('/dashboards/cypress/datagrid-hidden');
    });

    it('Rows should be visible when datagrid is switched from hidden.', () => {
        // Act
        cy.get('#show').trigger('click');

        // Assert
        cy.get('tr').should('have.length', 5);
    });

    it('Rows should have even and odd classes.', () => {
        cy.get('tbody tr').eq(0).should('have.class', 'highcharts-datagrid-row-odd');
        cy.get('tbody tr').eq(1).should('have.class', 'highcharts-datagrid-row-even');
    });
});
