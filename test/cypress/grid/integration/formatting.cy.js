describe('Formatting cells.', () => {
    before(() => {
        cy.visit('grid/basic/cell-formatting');
    });

    it('Head should be formatted.', () => {
        cy.get('th').eq(0).should('contain', 'Date of purchase');
        cy.get('th').eq(1).should('contain', 'product name');
    });

    it('Cells should be formatted.', () => {
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(0).should('contain', 'Jan 01, 2022');
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(2).should('contain', '100.0 kg');
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(3).should('contain', '$ 1.50');
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(4).within(() => {
            cy.get('a').should('contain', 'Apples URL');
        });

        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(2).should('have.attr', 'data-value', '100');
    });

    it('Cells without formatter should not be formatted.', () => {
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(1).should('contain', 'Apples');
    });

    it('CSS class and style should be applied.', () => {
        cy.get('.highcharts-datagrid-row').eq(0).find('td.custom-column-class-name')
            .should('have.css', 'color', 'rgb(255, 0, 0)');
    });

    it('The cell containing text should lose format when editing and gain back when not.', () => {
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(2).dblclick();
        cy.get('.highcharts-datagrid-edited-cell input').as('inputField');
        cy.get('@inputField').should('have.value', '100');
        cy.get('@inputField').clear().type('300');
        cy.get('body').click();
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(2).should('contain', '300.0 kg');
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(2).should('have.attr', 'data-value', '300');
    });

    it('The cell containing dates should lose format when editing and gain back when not.', () => {
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(0).dblclick();
        cy.get('.highcharts-datagrid-edited-cell input').as('inputField');
        cy.get('@inputField').should('have.value', '1640995200000');
        cy.get('@inputField').clear().type('1641081600000');
        cy.get('body').click();
        cy.get('.highcharts-datagrid-row').eq(0).find('td').eq(0).should('contain', 'Jan 02, 2022');
    });

    it('The grid should adjust its width dynamically to the container width.', () => {
        let initialWidth,
            finalWidth;

        cy.get('.highcharts-datagrid-table').should('exist').then(($el) => {
            initialWidth = $el.width();
        });

        cy.get('#container').then(($el) => {
            $el.css('width', '200px');

            cy.get('.highcharts-datagrid-table').should('exist').then(($el) => {
                finalWidth = $el.width();

                assert.notStrictEqual(
                    initialWidth,
                    finalWidth,
                    'The width should change when resizing the container.'
                );

                assert.closeTo(
                    finalWidth,
                    200,
                    10,
                    'The width should be close to 200px.'
                )
            });
        });
    });
});
