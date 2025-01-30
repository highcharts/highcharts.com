describe('DataGrid events.', () => {
    before(() => {
        cy.visit('grid/cypress/sorting-options');
    });

    it('DataGrid should be sorted initially by price in ascending order.', () => {
        cy.get('#select-column').should('have.value', 'price');
        cy.get('#select-order').should('have.value', 'asc');

        cy.window().its('dataGrid').then(dataGrid => {
            expect(
                dataGrid.presentationTable.columns.price,
                'Price column should be sorted.',
            ).to.deep.equal([1.5, 2.53, 4.5, 5]);
        })

        cy.get('th[data-column-id="price"]').should('have.class', 'highcharts-datagrid-column-sorted-asc');
    });

    it('Should be able to turn off sorting.', () => {
        cy.get('#select-order').select('');
        cy.get('#apply-btn').click();

        cy.window().its('dataGrid').then(dataGrid => {
            expect(
                dataGrid.presentationTable.columns.price,
                'Weight column should be sorted.',
            ).to.deep.equal([1.5, 2.53, 5, 4.5]);
        })

        cy.get('th[data-column-id="price"]').should('have.not.class', 'highcharts-datagrid-column-sorted-asc');
    });

    it('Clicking on the `icon` column header should do nothing.', () => {
        cy.get('th[data-column-id="icon"]').click();

        cy.window().its('dataGrid').then(dataGrid => {
            expect(
                dataGrid.presentationTable.columns.price,
                'Weight column should be sorted.',
            ).to.deep.equal([1.5, 2.53, 5, 4.5]);
        })
    });

    it('Clicking two times on the `weight` column header should sort the table in descending order.', () => {
        cy.get('th[data-column-id="weight"]').click();
        cy.get('th[data-column-id="weight"]').click();

        cy.window().its('dataGrid').then(dataGrid => {
            expect(
                dataGrid.presentationTable.columns.weight,
                'Weight column should be sorted.',
            ).to.deep.equal([200, 100, 40, 0.5]);
        })

        cy.get('th[data-column-id="weight"]').should('have.class', 'highcharts-datagrid-column-sorted-desc');
    });

    it('Sorting the `icon` column should be possible by the code.', () => {
        cy.get('#select-column').select('icon');
        cy.get('#select-order').select('asc');
        cy.get('#apply-btn').click();

        cy.window().its('dataGrid').then(dataGrid => {
            expect(
                dataGrid.presentationTable.columns.metaData,
                'Icon column should be sorted.',
            ).to.deep.equal(['a', 'd', 'b', 'c']);
        })

        cy.get('th[data-column-id="icon"]').should('have.class', 'highcharts-datagrid-column-sorted-asc');
    });

    it ('Editing a cell in sorted column should resort the table.', () => {
        cy.get('th[data-column-id="weight"]').click();
        cy.get('tr[data-row-index="1"] td[data-column-id="weight"]')
            .dblclick()
            .find('input')
            .type('000{enter}');

        cy.window().its('dataGrid').then(dataGrid => {
            const { rows } = dataGrid.viewport;
            const lastRow = rows[rows.length - 1];

            expect(
                lastRow.cells[0].value,
                'Last rendered row should be `Pears`.',
            ).to.equal('Pears');

            expect(
                dataGrid.presentationTable.columns.weight,
                'Weight column should be sorted.',
            ).to.deep.equal([0.5, 100, 200, 40000]);
        });
    })
});
