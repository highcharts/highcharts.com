import "@cypress-audit/lighthouse/commands";

const compareSnapshotCommand = require('cypress-visual-regression/dist/command');

compareSnapshotCommand();

Cypress.Commands.add('zoom', chartElement => {
    return cy.get(chartElement)
        .trigger('mouseenter')
        .trigger('mousedown', 50)
        .trigger('mousemove', 50, 50)
        .trigger('mouseup')
})

Cypress.Commands.add('pan', chartElement => {
    return cy.get(chartElement)
        .trigger('mouseenter')
        .trigger('mousedown', { shiftKey: true })
        .trigger('mousemove', { x: 50, y: 50, shiftKey: true })
        .trigger('mouseup')
})

Cypress.Commands.add('board', () =>
    cy.window().its('Dashboards.boards').should('have.length.gte', 1).then(boards => {
        const [board] = boards;
        return board;
    })
);

Cypress.Commands.add('boardRendered', () =>
    cy.board().then(async board => {
        await Cypress.Promise.all(
            board.mountedComponents.map(async ({ component }) => {
                return new Cypress.Promise((resolve, reject) => {
                    let attempts = 0;

                    setInterval(() => {
                        // If highcharts component, wait for chart to be rendered
                        if (component.type === 'Highcharts') {
                            const allSeriesRendered = component.chart.series.every(
                                series => series.hasRendered && series.finishedAnimating
                            );

                            if (allSeriesRendered) {
                                resolve(component)
                            }

                        } else if (component) {
                            resolve(component)
                        }

                        attempts++;

                        if (attempts > 10) {
                            reject('Took more than 10 attempts')
                        }

                    }, 400)

                })
            }
            )
        )
    })
);

Cypress.Commands.add('hideSidebar', () =>
    cy.get('.highcharts-dashboards-edit-popup-close:visible').click()
);

Cypress.Commands.add('openCellEditSidebar', (cellId) => {
    cy.get(cellId).click();
    cy.get('.highcharts-dashboards-edit-menu-item > div')
        .each(($el) => {
            const backgroundImage = $el.css('background-image');
            if (backgroundImage.includes('/code/dashboards/gfx/dashboards-icons/settings.svg')) {
                cy.wrap($el).click();
            }
        });
});

Cypress.Commands.add('chart', () =>
    cy.window().then(win => new Cypress.Promise((resolve, reject) => {
        const H = win.Highcharts;
        if (H) {
            if (H.charts[0]) {
                window.setTimeout(() => resolve(H.charts[0]), 100);
            } else {
                const unbind = H.addEvent(H.Chart, 'load', function() {
                    unbind();
                    resolve(this);
                });
            }
        } else {
            reject(new Error('Global Highcharts namespace is missing.'));
        }
    }))
);

Cypress.Commands.add('openIndicators', () =>
    cy.get('.highcharts-indicators .highcharts-menu-item-btn')
        .click()
);

Cypress.Commands.add('addIndicator', () =>
    cy.get('.highcharts-popup-rhs-col')
        .children('.highcharts-popup button')
        .eq(0)
        .click()
);

Cypress.Commands.add(
    'dragTo',
    {
        prevSubject: true
    },
    (subject, toSelector, x, y, options) => {
        cy.wrap(subject).trigger(
            'mousedown',
            // Pass the trigger options object to mousedown as well for things
            // like shiftKey
            [
                x, y, options
            ].find(arg => typeof arg === 'object')
        );
        cy.get(toSelector)
            .trigger('mousemove', x, y, options)
            .trigger('mouseup', x, y, options)
            .trigger('click', x, y, options);

        // Keep the dragged element as the subject
        cy.wrap(subject);
    }
);

Cypress.Commands.add('selectIndicator', (indicator) =>
    cy.get('.highcharts-indicator-list')
        .contains(indicator)
        .click()
);

Cypress.Commands.add('selectAnnotation', (annotationClassName, parentClassName) => {

    if (parentClassName) {
        cy.get(`.${parentClassName}`).children().eq(1).click();
        cy.wait(100); // wait a bit for the DOM to settle 
    }
    cy.get(`.${annotationClassName}`).click();
})

Cypress.Commands.add('selectRange', (range) =>
    cy.get('.highcharts-range-selector-group')
        .contains(range)
        .click()
);

Cypress.Commands.add('toggleEditMode', () => {
    cy.get('.highcharts-dashboards-edit-context-menu-btn').click();
    cy.get('.highcharts-dashboards-edit-toggle-slider').first().click();
});

Cypress.Commands.add('submitEditing', () => {
    cy.get('.highcharts-dashboards-edit-confirmation-popup-confirm-btn').click();
});

Cypress.Commands.add('cancelEditing', () => {
    cy.get('.highcharts-dashboards-edit-confirmation-popup-cancel-btn').click();
    cy.get('.highcharts-dashboards-edit-confirmation-popup .highcharts-dashboards-edit-confirmation-popup-confirm-btn').click();
});

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false
})

Cypress.Commands.add('grabComponent', (name) => {
    cy.get('.highcharts-dashboards-edit-tools-btn').contains('Add').click({ force: true});
    cy.get('.highcharts-dashboards-edit-grid-items')
        .children()
        .contains(name)
        .trigger('mousedown', { force: true });
});

Cypress.Commands.add('dropComponent', (elementName) => {
    cy.get(elementName).first().trigger('mouseenter', {force: true});
    cy.get(elementName).first().trigger('mousemove', 'right', {force: true});
    cy.get(elementName).first().trigger('mouseup', 'right', {force: true});
});

Cypress.Commands.add('grid', () =>
    cy.window().its('Grid.grids').should('have.length.gte', 1).then(grids => {
        const [grid] = grids;
        return grid;
    })
);
