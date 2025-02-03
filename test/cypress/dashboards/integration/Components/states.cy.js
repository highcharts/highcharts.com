describe('Component states', () => {
    beforeEach(() => {
        cy.visit('dashboards/component-options/states');
    });

    it('Active state should be applied to the component', () => {
        // Assert
        cy.get('#dashboard-col-0').should('have.class', 'highcharts-dashboards-cell-state-active');
        cy.board().then((board) => {
            const mountedComponents = board.mountedComponents;
            const component = mountedComponents[0].component;

            assert.strictEqual(
                component.isActive,
                true,
                'The component\'s isActive property should be true.'
            );
        });
    });

    it('Click event should change the active state', () => {
        // Act
        cy.get('#dashboard-col-1').click();

        // Assert
        cy.get('#dashboard-col-0').should('not.have.class', 'highcharts-dashboards-cell-state-active');
        cy.get('#dashboard-col-1').should('have.class', 'highcharts-dashboards-cell-state-active');

        cy.board().then((board) => {
            const mountedComponents = board.mountedComponents;

            assert.strictEqual(
                mountedComponents[0].component.isActive,
                false,
                'The first component\'s isActive property should be false.'
            );

            assert.strictEqual(
                mountedComponents[1].component.isActive,
                true,
                'The second component\'s isActive property should be true.'
            );
        });
    });

    it('Click event should not change the active state when in edit mode', () => {
        // Assert
        cy.get('#dashboard-col-0').should('have.class', 'highcharts-dashboards-cell-state-active');

        // Act
        cy.toggleEditMode();
        cy.get('#dashboard-col-1').click();

        // Assert
        cy.get('#dashboard-col-0').should('have.class', 'highcharts-dashboards-cell-state-active');
        cy.get('#dashboard-col-1').should('not.have.class', 'highcharts-dashboards-cell-state-active');
    });
});
