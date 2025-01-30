describe('DataGrid events.', () => {
    before(() => {
        cy.visit('grid/cypress/column-cell-events');
    });

    it('Cell mouseOver / mouseOut event.', () => {
        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="product"]')
            .trigger('mouseover');
        cy.get('#cellMouseOver').should('have.value', 'cellMouseOver');

        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="product"]')
            .click()
            .trigger('mouseout');
        cy.get('#cellMouseOut').should('have.value', 'cellMouseOut');
    });

    it('Cell click event', () => {
        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="product"]')
            .click({force: true});
        cy.get('#cellClick').should('have.value', 'cellClick');
    });

    it('Cell dblClick event', () => {
        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="product"]')
            .dblclick({force: true});
        cy.get('#cellDblClick').should('have.value', 'cellDblClick');
    });

    it('Cell afterEdit event', () => {
        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="product"]')
            .dblclick({force: true})
            .find('input')
            .clear()
            .type('Strawberries');

        cy.get('#cellAfterEdit').should('have.value', 'cellAfterEdit');
    });

    it('AfterSetValue event.', () => {
        cy.get('#cellAfterSetValue').should('have.value', '1');
        cy.get('.highcharts-datagrid-row[data-row-index="1"] > td[data-column-id="weight"]')
            .dblclick({force: true})
            .find('input')
            .type('1{enter}');
        cy.get('#cellAfterSetValue').should('have.value', '2');
    });

    it('AfterSorting column event.', () => {
        cy.get('th[data-column-id="product"]').click();
        cy.get('#columnSorting').should('have.value', 'afterSorting');
        cy.get('#headerClick').should('have.value', 'headerClick');
    });

    it('Resize column event.', () => {
        cy.get('th[data-column-id="product"] > .highcharts-datagrid-column-resizer')
            .trigger('mousedown')
            .trigger('mousemove', { clientX: 300, clientY: 300 })
            .trigger('mouseup');
        cy.get('#columnResizing').should('have.value', 'columnResizing');
    });
});
