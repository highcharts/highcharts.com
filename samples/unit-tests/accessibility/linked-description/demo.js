const html = `
<div>
    <div id="containerSibling"></div>
    <p class="highcharts-description">Sibling</p>
</div>

<div>
    <div>
        <div id="containerParent"></div>
    </div>
    <p class="highcharts-description">Parent</p>
</div>

<div>
    <div id="containerChild"></div>
    <div> 
        <p class="highcharts-description">Child</p>
    </div>
</div>

<div>
    <div id="containerAmbiguous"></div>
    <div>
        <div id="containerDecoy"></div>
        <p class="highcharts-description">Decoy</p>
    </div>
</div>

<div>
    <p class="highcharts-description">First</p>
    <div id="containerMultiple"></div>
    <p class="highcharts-description">Second</p>
    <p class="highcharts-description">Third</p>
</div>

<div>
    <div id="containerMultiple2A"></div>
    <div id="containerMultiple2B"></div>
    <p class="highcharts-description">Multiple</p>
</div>

<div>
    <p id="explicitDescriptionId">Explicit1</p>
    <p class="uniqueClassName">Explicit2</p>
</div>

<div>
    <div id="containerExplicit1"></div>
    <div id="containerExplicit2"></div>
    <div id="containerExplicit3"></div>
</div>
`;

// Create a chart, optionally with a linkedDescriptionOption, and test its
// longdesc against an expected value.
function createChartAndAssertLongDesc(
    assert,
    container,
    expectedDesc,
    linkedDescriptionOption
) {
    const options = {
        chart: {
            height: 100,
            width: 250
        },
        title: {
            text: container
        },
        accessibility: {}
    };

    if (linkedDescriptionOption) {
        options.accessibility.linkedDescription = linkedDescriptionOption;
    }

    const chart = Highcharts.chart(container, options);

    assert.strictEqual(
        chart.accessibility.components.infoRegions.getLongdescText(),
        expectedDesc
    );
}

QUnit.module('linked-description', function (hooks) {
    // Dynamically set HTML content because of Karma HTML template
    const container = document.getElementById('container');
    hooks.before(() => (container.innerHTML = html));
    hooks.after(() => (container.innerHTML = ''));

    QUnit.test(
        'Charts should have descriptions from next sibling with class name.',
        function (assert) {
            const expectedDescs = [
                ['containerSibling', 'Sibling'],
                ['containerParent', ''],
                ['containerChild', ''],
                ['containerAmbiguous', ''],
                ['containerDecoy', 'Decoy'],
                ['containerMultiple', ''],
                ['containerMultiple2A', 'Multiple'],
                ['containerMultiple2B', 'Multiple']
            ];

            expectedDescs.forEach(([container, expectedDesc]) => {
                createChartAndAssertLongDesc(assert, container, expectedDesc);
            });
        }
    );

    QUnit.test(
        'Charts should have descriptions from element defined by option',
        function (assert) {
            const descNode = document.getElementById('explicitDescriptionId'),
                chartsWithExpectedDescriptions = [
                    [
                        'containerExplicit1',
                        '#explicitDescriptionId',
                        'Explicit1'
                    ],
                    ['containerExplicit2', '.uniqueClassName', 'Explicit2'],
                    ['containerExplicit3', descNode, 'Explicit1']
                ];

            chartsWithExpectedDescriptions.forEach(
                ([container, linkedDescOpt, expectedDesc]) => {
                    createChartAndAssertLongDesc(
                        assert,
                        container,
                        expectedDesc,
                        linkedDescOpt
                    );
                }
            );
        }
    );
});
