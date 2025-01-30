describe('Exporting to JSON.', () => {
    before(() => {
        cy.visit('grid/cypress/exporting-json');
    });

    it('DataGrid should be exported to JSON.', () => {
        cy.get('#json').click();
        cy.get('#result').should('contain', '{"product":["Apples","Pears","Plums","Bananas"],"weight":[100,40,0.5,200],"price":[1.5,2.53,5,4.5]}');
    });
});
