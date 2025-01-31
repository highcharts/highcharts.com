QUnit.test('Packed Bubble layouts operations', function (assert) {
    const chart = Highcharts.chart('container', {
        chart: {
            type: 'packedbubble',
            height: '100%'
        },
        title: false,
        plotOptions: {
            packedbubble: {
                layoutAlgorithm: {
                    enableSimulation: false,
                    splitSeries: true
                },
                dataLabels: {
                    enabled: false
                }
            }
        },
        series: [
            {
                parentNode: {
                    allowPointSelect: true
                },
                data: []
            },
            {
                parentNode: {
                    allowPointSelect: true
                },
                data: []
            },
            {
                data: []
            },
            {
                data: []
            }
        ]
    });
    chart.series[2].remove();
    function compareCollections(collections, collection) {
        var equal = true;
        collections.forEach(function (c) {
            if (equal) {
                equal = c.series.length === collection.length;
            }
        });
        return equal;
    }
    assert.strictEqual(
        compareCollections(chart.graphLayoutsLookup, chart.series),
        true,
        'Series is removed from layout.series collection.'
    );
    const controller = new TestController(chart);
    controller.triggerEvent(
        'mouseover',
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.click(
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    assert.ok(
        chart.series[0].parentNode.selected,
        'It should be possible to select a parent node that has enabled ' +
        'parentNode.allowPointSelect property'
    );
    controller.triggerEvent(
        'mouseover',
        chart.series[2].parentNode.plotX + chart.plotLeft,
        chart.series[2].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.click(
        chart.series[2].parentNode.plotX + chart.plotLeft,
        chart.series[2].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    assert.notOk(
        chart.series[2].parentNode.selected,
        'It shouldn\'t be possible to select a parent that has not enabled ' +
        'parentNode.allowPointSelect property.'
    );
    controller.triggerEvent(
        'mouseover',
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.click(
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.triggerEvent(
        'mouseover',
        chart.series[1].parentNode.plotX + chart.plotLeft,
        chart.series[1].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.click(
        chart.series[1].parentNode.plotX + chart.plotLeft,
        chart.series[1].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    assert.strictEqual(
        chart.getSelectedParentNodes().length,
        1,
        'It shouldn\'t be possible to select more than one parent node ' +
        'without using key modifier.'
    );
    controller.triggerEvent(
        'mouseover',
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.click(
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: true },
        false
    );
    assert.strictEqual(
        chart.getSelectedParentNodes().length,
        2,
        'It should be possible to select more than one parent node using key ' +
        'modifier.'
    );
    controller.triggerEvent(
        'mouseover',
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    controller.click(
        chart.series[0].parentNode.plotX + chart.plotLeft,
        chart.series[0].parentNode.plotY + chart.plotTop,
        { shiftKey: false },
        false
    );
    assert.strictEqual(
        chart.getSelectedParentNodes().length,
        0,
        'After clicking on the selected parent, all selected parents should ' +
        'be deselected.'
    );

    chart.update({
        plotOptions: {
            packedBubble: {
                layoutAlgorithm: {
                    gravitationalConstant: 0.05,
                    seriesInteraction: true,
                    dragBetweenSeries: true,
                    parentNodeLimit: false,
                    splitSeries: true,
                    enableSimulation: false
                },
                dataLabels: {
                    enabled: true,
                    format: '{point.name}',
                    style: {
                        color: 'black',
                        textOutline: 'none',
                        fontWeight: 'normal'
                    }
                }
            }
        },
        series: [
            {
                data: [5, 9, 2, 7, 4],
                layoutAlgorithm: {
                    splitSeries: true
                }
            },
            {
                data: [3, 12, 3, 5, 7, 8],
                layoutAlgorithm: {
                    splitSeries: false
                }
            }
        ]
    });

    assert.deepEqual(
        chart.series[0].parentNode !== undefined,
        true,
        'Series should have parentNode'
    );

    assert.deepEqual(
        chart.series[1].parentNode === undefined,
        true,
        'Series should lack parentNode'
    );
});
