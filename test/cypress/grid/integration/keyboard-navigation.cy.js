describe('Keyboard navigation in DataGrid.', () => {
    before(() => {
        cy.visit('/grid/basic/overview');
    });

    it('The first visible cell is focusable.', () => {
        cy.get('td').first().focus();
        cy.focused().should('have.attr', 'data-value', 'Apples');
    });

    it('Arrow key navigation should work for table cells.', () => {
        cy.focused().type('{downarrow}');
        cy.focused().should('have.attr', 'data-value', 'Pears');
        cy.focused().type('{rightarrow}');
        cy.focused().should('have.attr', 'data-value', '40');
        cy.focused().type('{uparrow}');
        cy.focused().should('have.attr', 'data-value', '100');
        cy.focused().type('{leftarrow}');
        cy.focused().should('have.attr', 'data-value', 'Apples');
    });

    it('Arrow key navigation should work for table headers.', () => {
        cy.focused()
            .type('{uparrow}')
            .should('have.attr', 'data-column-id', 'product');
    });

    it('Sorting by pressing Enter key on a header cell should be possible.', () => {
        cy.focused().type('{rightarrow}{enter}');
    });

    it('Editing by pressing Enter key on a table cell should be possible.', () => {
        cy.focused().type('{downarrow}{downarrow}{enter}0{enter}');
        cy.focused().parent().should('have.attr', 'data-row-index', '9');
    });
});
