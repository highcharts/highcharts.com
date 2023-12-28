describe("Highlight sync options", () => {
    before(() => {
        cy.visit('/dashboards/sync/sync-highlight-options');
    });

    it('All highlight sync options are disabled', () => {
        cy.boardRendered();

        cy.get('#showTooltip').click();
        cy.get('#showMarker').click();
        cy.get('#showCrosshair').click();

        cy.get('.highcharts-datagrid-cell').eq(0).trigger('mouseover');

        cy.chart().then(chart => {
            assert.ok(
                chart.tooltip.isHidden,
                'When hovering over DataGrid, chart should not have tooltip.'
            );

            assert.notOk(
                chart.series[0].points[0].state === 'hover',
                'When hovering over DataGrid, chart should not have marker.'
            );

            assert.notOk(
                chart.xAxis[0].cross && chart.yAxis[0].cross.opacity === 1,
                'When hovering over DataGrid, chart should not have crosshair.'
            )
        });
    });

    it('Highlight showTooltip option is enabled', () => {
        cy.get('#showTooltip').click();

        cy.get('.highcharts-datagrid-cell').eq(2).trigger('mouseover');

        cy.chart().then(chart => {
            assert.notOk(
                chart.tooltip.isHidden,
                'When hovering over DataGrid, chart should have tooltip.'
            )
        });
    });

    it('Highlight showMarker option is enabled', () => {
        cy.get('#showMarker').click();

        cy.get('.highcharts-datagrid-cell').eq(4).trigger('mouseover');

        cy.chart().then(chart => {
            assert.ok(
                chart.series[0].points[2].state === 'hover',
                'When hovering over DataGrid, chart should have marker hovered.'
            )
        });
    });

    it('Highlight showCrosshair option is enabled', () => {
        cy.get('#showCrosshair').click();

        cy.get('.highcharts-datagrid-cell').eq(6).trigger('mouseover');

        cy.chart().then(chart => {
            assert.ok(
                chart.xAxis[0].cross && chart.yAxis[0].cross.opacity === 1,
                'When hovering over DataGrid, chart should have crosshair.'
            )
        });
    });

    it('Highlight sync is disabled', () => {
        cy.get('#enabled').click();

        cy.get('.highcharts-datagrid-cell').eq(8).trigger('mouseover');

        cy.chart().then(chart => {
            assert.notOk(
                chart.series[0].points[0].state === 'hover',
                'When hovering over DataGrid, recently hovered point should not be hovered.'
            );

            assert.notOk(
                chart.series[0].points[4].state === 'hover',
                'When hovering over DataGrid, currently hovered point should not be hovered.'
            );

            assert.notOk(
                chart.xAxis[0].cross && chart.yAxis[0].cross.opacity === 1,
                'When hovering over DataGrid, chart should not have crosshair.'
            )
        });
    });
});
