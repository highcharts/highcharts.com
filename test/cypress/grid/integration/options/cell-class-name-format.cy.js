describe('Cell class name formats.', () => {
    before(() => {
        cy.visit('grid/cypress/datagrid-custom-class');
    });

    it('Table should have custom class name.', () => {
        cy.get('.highcharts-datagrid-table').should('have.class', 'custom-table-class-name');
        cy.get('.highcharts-datagrid-table').should('have.class', 'abc');
    });

    it('Custom class name should be refreshed on setValue.', () => {
        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="weight"]').as('cellA');
        cy.get('.highcharts-datagrid-row[data-row-index="3"] > td[data-column-id="weight"]').as('cellB');

        cy.get('@cellA').should('not.have.class', 'greater-than-100');
        cy.get('@cellB').should('have.class', 'greater-than-100');
        cy.get('@cellB').should('have.class', 'second-class');

        cy.get('@cellA').dblclick({force: true}).find('input').type('0{enter}');
        cy.get('@cellA').should('have.class', 'greater-than-100');

        cy.get('@cellB').dblclick({force: true}).find('input').clear().type('10{enter}');
        cy.get('@cellB').should('not.have.class', 'greater-than-100');
        cy.get('@cellB').should('not.have.class', 'second-class');
    });

    it('Custom class name should be assigned to the header cells.', () => {
        cy.get('.header-cell-custom-class-price').should('exist');
    });
});
