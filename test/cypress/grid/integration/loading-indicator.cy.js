describe('Loading indicator', () => {
    before(() => {
        cy.visit('/grid/cypress/datagrid-custom-class');
    });

    it('Loading indicator should be visible.', () => {
        cy.grid().then((grid) => {
            grid.showLoading('Loading test...');

            cy.get('.highcharts-datagrid-loading-wrapper').should('be.visible');
            cy.get('.highcharts-datagrid-loading-message').should('contain', 'Loading test...');
        });
    });

    it('Loading indicator should be hidden.', () => {
        cy.grid().then((grid) => {
            grid.hideLoading();

            cy.get('.highcharts-datagrid-loading-wrapper').should('not.exist');
        });
    });

    it('Only one indicator should be visible at a time.', () => {
        cy.grid().then((grid) => {
            grid.showLoading('Loading 1');
            grid.showLoading('Loading 2');

            cy.get('.highcharts-datagrid-loading-wrapper').should('be.visible');
            cy.get('.highcharts-datagrid-loading-message').should('contain', 'Loading 1');
            cy.get('.highcharts-datagrid-loading-wrapper').should('have.length', 1);
        });
    });
});
