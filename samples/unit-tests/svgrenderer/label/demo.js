QUnit.test('Reset visibility on HTML label (#3909)', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );

    var label = ren
        .label('Hello World', 100, 100, null, null, null, true)
        .attr({
            'stroke-width': 1,
            stroke: 'blue',
            padding: 10,
            r: 10
        })
        .add();

    label.hide();
    assert.strictEqual(
        label.div.style.visibility,
        'hidden',
        'Visibility is hidden'
    );

    label.show();
    assert.strictEqual(
        label.div.style.visibility,
        'inherit',
        'Visibility is inherit'
    );

    label.hide();
    assert.strictEqual(
        label.div.style.visibility,
        'hidden',
        'Visibility is hidden'
    );

    label.show(false);
    assert.strictEqual(
        label.div.style.visibility,
        'visible',
        'Visibility is visible'
    );
});

QUnit.test('Whitespace trimming', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );

    var label = ren
        .label('<br>Hello World', 100, 50)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        label.element.querySelector('tspan'),
        null,
        'Initial break should be left out'
    );

    label = ren.label('<span> </span><br>Hello World', 100, 50)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        label.element.querySelector('tspan'),
        null,
        'Initial empty break should be left out'
    );

    label = ren
        .label('Hello World<br>', 100, 50)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    // tspan.dy should be the same as the reference
    assert.strictEqual(
        label.element.querySelector('tspan').getAttribute('dy'),
        null,
        'Ending break should have no dy'
    );

    label = ren
        .label('<span>Hello</span> <span>World</span>', 100, 50)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        label.text.element.childNodes.length,
        3,
        '#15235: Whitespace between spans should not be removed'
    );

    let html = '<div><span>Space</span> <span>expected</span></div>';
    label = ren
        .text(html, 100, 50, true)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        label.element.innerHTML,
        html,
        '#15235: Nested whitespace between spans should not be removed'
    );

    html = '<div><span>Space</span><span> </span><span>expected</span></div>';
    label = ren
        .text(html, 100, 50, true)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        label.element.innerHTML,
        html,
        '#15235: Nested whitespace between spans should not be removed'
    );

});

QUnit.test('Image labels should have no fill (#4324)', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );

    var image = ren
        .label(
            '',
            100,
            100,
            'url(https://smartview.antaris-solutions.net//images/icons/view_alerts.png)'
        )
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        image.box.element.getAttribute('fill'),
        null,
        'No fill for image'
    );

    var circle = ren
        .label('', 150, 100, 'circle')
        .attr({
            'stroke-width': 2,
            stroke: 'blue'
        })
        .add();

    assert.strictEqual(
        circle.box.element.getAttribute('fill'),
        'none',
        'Fill none for circle'
    );
});

QUnit.test('New label with rect symbol (#5324)', function (assert) {
    var renderer = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    var label = renderer
        .label('Max observation', 270, 50, 'rect', 100, 100)
        .css({
            color: '#FFFFFF'
        })
        .attr({
            fill: 'rgba(0, 0, 0, 0.75)',
            padding: 8,
            r: 5,
            zIndex: 6
        })
        .add();

    assert.strictEqual(
        label.element.textContent,
        'Max observation',
        'Element exists'
    );
});

QUnit.test('New label with url symbol (#5635)', function (assert) {
    var renderer = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    var url =
        location.host.substr(0, 12) === 'localhost:98' ?
            'url(base/test/testimage.png)' : // karma
            'url(testimage.png)'; // utils

    var label = renderer
        .label('Max observation', 270, 50, url, 100, 100)
        .attr({
            padding: 8
        })
        .add();

    assert.strictEqual(
        label.box.element.tagName,
        'image',
        'Background image exists'
    );
});

QUnit.test('Box with nested ems (#5932)', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    var label = ren
        .label(
            'This is line 1<br><span style="font-size: 2em">This is line 2</span>',
            10,
            10
        )
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .css({
            fontSize: '32px'
        })
        .add();

    assert.ok(label.getBBox().height > 100, 'Nested em is included');
});

// Highcharts 3.0.10, Issue #2794
// Renderer.label with <br> tags
QUnit.test('buildText fontSize (#2794)', function (assert) {
    Highcharts.chart(
        'container',
        {
            series: [
                {
                    data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0]
                }
            ]
        },
        function (chart) {
            var renderer = chart.renderer,
                group = renderer.g().add(),
                catchedException;

            try {
                renderer.label('Regression caused').add(group);
                renderer.label('error in <br> wrapped text', 0, 20).add(group);
            } catch (exception) {
                catchedException = exception;
            }

            assert.ok(
                !catchedException,
                'There should be not exception, when adding labels to a group.'
            );
        }
    );
});

// Highcharts 4.0.4, Issue #3507
// The second line of text appeared inside the rectangle. Should appear inside.
QUnit.test('Tooltip overflow (#3507)', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );
    var lbl = ren
        .label('<span>Header</span><br>Body', 100, 100)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .css({
            width: '100px'
        })
        .add();
    var textHeight = lbl.element.childNodes[1].getBBox().height,
        boxHeight = lbl.element.childNodes[0].getBBox().height;

    assert.ok(
        boxHeight > textHeight,
        'The second line of text should appear inside the rectangle'
    );
});

// Highcharts 4.0.1, Issue #3132
// SVGRenderer with fixed width doesn't handle marked-up text
QUnit.test('SVG text wrap (#3132)', function (assert) {
    var renderer = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );
    renderer
        .label('Foo: barracuda', 100, 150)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .css({
            width: '260px'
        })
        .add();

    renderer
        .label('Foo: <b>barracuda</b>', 100, 100)
        .attr({
            'stroke-width': 1,
            stroke: 'blue'
        })
        .css({
            width: '260px'
        })
        .add();

    var labelWithMarkup = renderer.box.childNodes[3].childNodes[0].getBBox(),
        label = renderer.box.childNodes[2].childNodes[0].getBBox();

    assert.ok(
        labelWithMarkup.width > label.width,
        'The width of the label that contains markup should be the greatest'
    );
});

QUnit.test('Labels with nested or async styling (#9400)', function (assert) {
    document.getElementById('container').innerHTML = '';
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    var label1, label2, label3;

    label1 = ren
        .label(
            '<span style="font-size: 10px">I should be inside the box</span>',
            100,
            100
        )
        .attr({
            stroke: 'blue',
            'stroke-width': '1px'
        })
        .css({
            fontSize: '20px'
        })
        .add();

    label2 = ren
        .label(
            '<span style="font-size: 10px">I should be inside</span> the box',
            100,
            130
        )
        .attr({
            stroke: 'blue',
            'stroke-width': '1px'
        })
        .css({
            fontSize: '20px'
        })
        .add();

    label3 = ren
        .label('No inline span', 100, 160)
        .attr({
            stroke: 'blue',
            'stroke-width': '1px'
        })
        .css({
            fontSize: '20px'
        })
        .add();

    assert.strictEqual(
        document.getElementById('container').innerHTML.indexOf('NaN'),
        -1,
        'No NaN attribute values should be allowed'
    );

    assert.ok(
        label1.element.getBBox().height < label2.element.getBBox().height,
        'Label with inline style should be smaller'
    );

    assert.strictEqual(
        label2.element.getBBox().height,
        label3.element.getBBox().height,
        'Label with text outside inner span should be equal'
    );

    label1 = ren
        .label('I should be inside the box', 100, 200)
        .attr({
            stroke: 'red',
            'stroke-width': '1px'
        })
        .add()
        .css({
            fontSize: '30px'
        });

    assert.ok(
        label1.box.element.getBBox().height >
            label1.text.element.getBBox().height,
        'Border should be higher than text'
    );

    assert.ok(
        label1.box.element.getBBox().width >
            label1.text.element.getBBox().width,
        'Border should be wider than text'
    );

    label1 = ren
        .text('Testing text-anchor', 100, 300)
        .attr({
            align: ''
        })
        .add()
        .css({
            fontSize: '30px'
        });

    assert.strictEqual(
        label1.element.attributes['text-anchor'],
        undefined,
        'Label text-anchor with empty align attribute should not be set'
    );
});

QUnit.test('Labels with useHTML', assert => {
    document.getElementById('container').innerHTML = '';
    document.getElementById('container').style.position = 'relative';
    const ren = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    const lbl = ren
        .label(
            'This is a long text that requires the label to wrap into multiple lines',
            10,
            19,
            null,
            0,
            0,
            true
        )
        .attr({
            stroke: 'blue',
            'stroke-width': 2
        })
        .css({
            width: '200px'
        })
        .add();

    assert.strictEqual(
        lbl.text.element.style.width,
        '200px',
        'The span should have a fixed width'
    );

    lbl.attr({
        text: 'Short'
    });

    assert.notEqual(
        lbl.text.element.style.width,
        '200px',
        'The span width should adapt to shorter text (#10009)'
    );

    const g = ren.g('parent')
        .attr({
            visibility: 'hidden'
        })
        .add();
    ren.label('Foo', 0, 0, void 0, 0, 0, true).add(g);

    assert.strictEqual(
        g.div.style.visibility,
        'hidden',
        'Visibility should be set on parent group div'
    );
});

QUnit.test('Change of label alignment after add (#4652)', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );

    var lbl = ren
        .label('Hello World', 100, 100)
        .attr({
            // align: 'right',
            fill: 'silver'
        })
        .add();

    var g = ren.box.querySelector('g');

    assert.close(
        g.getBoundingClientRect().left,
        100 + document.getElementById('container').offsetLeft,
        1, // +/- 0.5px in Edge
        'Box is left aligned'
    );

    lbl.attr({ align: 'right' });

    assert.close(
        g.getBoundingClientRect().right,
        100 + document.getElementById('container').offsetLeft,
        1, // +/- 0.5px in Edge
        'Box is right aligned'
    );
});

QUnit.test('Labels and styled mode', assert => {
    var renderer;

    renderer = new Highcharts.Renderer(
        document.getElementById('container'),
        400,
        300,
        undefined,
        false,
        false,
        true // styled mode
    );

    var label = renderer.label('Hello world', 200, 100).attr();

    label.attr({
        text: 'Test'
    });

    label.add();

    assert.ok(
        true,
        `No errors should be thrown when updating
        labels text before adding to DOM (#11758)`
    );
});

QUnit.test('Label padding', assert => {
    const ren = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    const label = ren.label('Hello', 10, 30)
        .attr({ padding: 5 })
        .add();

    let width = label.getBBox().width;
    label.attr({ padding: 0 });

    assert.strictEqual(
        label.getBBox().width,
        width - 10,
        'Width should have updated'
    );

    width = label.getBBox().width;

    [
        [10],
        [0, 10, 10],
        [10, 10, 10]
    ].forEach(([padding, paddingLeft, paddingRight]) => {
        const label = ren.label('Hello', 10, 60)
            .attr({ padding, paddingLeft, paddingRight })
            .add();

        assert.strictEqual(
            label.getBBox().width,
            width + 20,
            'Padding should increase width by 20'
        );
    });
});

QUnit.test('Label callout tests', assert => {
    // eslint-disable-next-line max-len
    // #14858: Callout missing line when anchorX within width and no room for chevron
    const ren = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    [
        [1, 'left', 100],
        [1, 'right', 100],
        [1, 'left', 20],
        [1, 'right', 20],
        [2, 'left', 100],
        [2, 'right', 100],
        [2, 'left', 20],
        [2, 'right', 20]
    ].forEach(([strokeWidth, align, anchorY]) => {
        const label = ren
            .label('Some text', 100, 50, 'callout', 100, anchorY)
            .attr({
                align,
                'stroke-width': strokeWidth,
                stroke: 'black'
            })
            .add();

        assert.ok(
            label.box.pathArray.length > 9,
            'Anchor line should have rendered'
        );
    });

    // #19505: Label missed connector on certain positions, when chevron was not
    // rendered.

    const x = 250,
        y = 50;

    const customLabel = ren.label(
        'Label',
        x,
        y,
        'callout',
        x + 1, // leave at +1 for testing
        y + 100
    )
        .attr({
            fill: 'rgba(0, 0, 0, 0.25)',
            zIndex: 6,
            stroke: 'red'
        })
        .add();

    assert.strictEqual(
        customLabel.element.getBBox().height,
        100,
        'Callout label should always have a connector when chevron is not displayed, #19505.'
    );
});