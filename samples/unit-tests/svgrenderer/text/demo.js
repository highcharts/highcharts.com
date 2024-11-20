QUnit.test('Hide label with useHTML (#4938)', function (assert) {
    var chart = Highcharts.chart('container', {}),
        renderer = chart.renderer,
        g = renderer.g().add(),
        text = renderer.text('Label', 140, 140, true).add(g);
    assert.strictEqual(text.attr('visibility'), 0, 'Text element is visible');
    assert.strictEqual(g.attr('visibility'), 0, 'Group element is visible');
    text.hide();
    assert.strictEqual(
        text.attr('visibility'),
        'hidden',
        'Text element is hidden'
    );
    g.hide();
    assert.strictEqual(
        g.attr('visibility'),
        'hidden',
        'Group element is hidden'
    );
});

QUnit.test('Legend rtl and useHTML(#4449)', function (assert) {
    var ren = new Highcharts.Renderer(
        document.getElementById('container'),
        500,
        300
    );

    // Reference point
    ren.circle(100, 100, 3)
        .attr({
            fill: 'red'
        })
        .add();

    // Add an empty text with useHTML, align it to the right
    var text = ren
        .text('', 100, 100, true)
        .attr({
            align: 'right'
        })
        .add();

    // Update the text
    text.attr({
        text: 'Hello World'
    });

    assert.strictEqual(
        text.element.offsetLeft + text.element.offsetWidth,
        100,
        'Text is right aligned'
    );
});
// Highcharts 4.0.1, Issue #3158
// Pie chart - item width issue
QUnit.test('Text word wrap with a long word (#3158)', function (assert) {
    var renderer = new Highcharts.Renderer(
        document.getElementById('container'),
        400,
        300
    );
    var width = 100;

    renderer
        .rect(100, 80, width, 100)
        .attr({
            stroke: 'silver',
            'stroke-width': 1
        })
        .add();

    var text = renderer
        .text(
            '<b>TheQuickBrownFox</b><br>jumps over the lazy dog, the issue' +
                ' caused the second line to be only one word',
            100,
            100
        )
        .css({
            fontSize: '12px',
            width: width + 'px'
        })
        .add();

    var breaks = text.element.querySelectorAll('tspan[x="100"]');

    assert.strictEqual(
        breaks.length,
        5,
        'Five breaks should be applied'
    );

    assert.strictEqual(
        text.element.childNodes[2].textContent.indexOf(' ') > 0,
        true,
        'There should be more than one word in the second text line. #3158'
    );
});

QUnit.test('Text word wrap with markup', function (assert) {
    var renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            400,
            300
        ),
        width = 100;
    renderer
        .rect(100, 20, width, 100)
        .attr({
            stroke: 'silver',
            'stroke-width': 1
        })
        .add();

    var text = renderer
        .text(
            'The quick <span style="color:brown">brown</span> fox jumps <em>' +
            'over</em> the lazy dog',
            100,
            40
        )
        .css({
            fontSize: '12px',
            width: width + 'px'
        })
        .add();

    assert.strictEqual(
        text.element.querySelectorAll('tspan[x="100"]').length,
        2,
        'Two line breaks should be applied'
    );

    // For some reason Edge gets the BBox width wrong, but the text looks
    // correct
    if (
        navigator.userAgent.indexOf('Edge') === -1 &&
        navigator.userAgent.indexOf('Trident') === -1
    ) {
        assert.ok(
            text.getBBox().width <= 100,
            'The text node width should be less than 100'
        );
    }

    text.attr({
        text: '<a href="https://www.highcharts.com">The quick brown fox jumps over the lazy dog</a>'
    });

    assert.ok(
        text.getBBox().width <= 100,
        'Text directly inside anchor should be wrapped (#16173)'
    );
});

QUnit.module('whiteSpace: "nowrap"', hooks => {
    const { Renderer } = Highcharts;
    const renderer = new Renderer(
        document.getElementById('container'),
        400,
        300
    );
    const text = renderer
        .text('test', 100, 40)
        .css({
            whiteSpace: 'nowrap'
        })
        .add();

    // Cleanup
    hooks.after(() => {
        renderer.destroy();
        text.destroy();
    });

    QUnit.test('Skip tspans', assert => {
        text.attr({ text: 'single_word' });
        assert.strictEqual(
            text.element.innerHTML,
            'single_word',
            'should not use tspan when whiteSpace equals "nowrap", and text ' +
            'equals "single_word".'
        );

        text.attr({ text: 'two words' });
        assert.strictEqual(
            text.element.innerHTML,
            'two words',
            'should not use tspan when whiteSpace equals "nowrap", and text ' +
            'equals "two words".'
        );
    });

    // TODO: move rest of nowrap tests into this module.
});

QUnit.test('Text word wrap with nowrap and break (#5689)', function (assert) {
    var renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            400,
            300
        ),
        width = 100;
    renderer
        .rect(100, 20, width, 100)
        .attr({
            stroke: 'silver',
            'stroke-width': 1
        })
        .add();

    var text = renderer
        .text(
            'Line1.1 line1.2 line1.3 line1.4 line1.5 line1.6 <br> ' +
                'Line2.1 line2.2 line 2.3 <br> ' +
                'Line3.1 line3.2 line 3.3 line3.4',
            100,
            40
        )
        .css({
            width: width + 'px',
            whiteSpace: 'nowrap'
        })
        .add();

    assert.strictEqual(
        text.element.querySelectorAll('tspan.highcharts-br').length,
        2,
        'The text should be wrapped into 3 lines'
    );
    assert.strictEqual(
        text.element.getElementsByTagName('tspan').length,
        2,
        'No additional soft breaks should be applied'
    );

});

QUnit.test('titleSetter', function (assert) {
    var chart = Highcharts.chart('container', {}),
        str = 'The quick brown fox<br> jumps over the lazy dog',
        newTitle = 'Quick brown fox',
        text = chart.renderer
            .text(str, 100, 100)
            .css({ width: 100, textOverflow: 'ellipsis' })
            .add();

    assert.strictEqual(
        text.element.getElementsByTagName(
            'title'
        )[0].textContent, // Ideally there should be a
        // titleGetter. text.attr('title')
        str.replace('<br>', ''),
        'Text element has a correct title. #5211'
    );

    // Update the title tag with a shorter text
    text.attr('title', newTitle);
    assert.strictEqual(
        text.element.getElementsByTagName(
            'title'
        )[0].textContent, // Ideally there should be a
        // titleGetter. text.attr('title')
        newTitle,
        'Text element title has been updated. #5211'
    );
});

QUnit.test('getBBox with useHTML (#5899)', function (assert) {
    var renderer;

    try {
        renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            600,
            400
        );

        var text = renderer
            .text('<div style="width: 500px">Styled div</div>', 20, 20, true)
            .add();

        assert.strictEqual(text.getBBox().width, 500, 'Initial bounding box');

        text.attr({
            text: '<div style="width: 400px">Styled div</div>'
        });

        assert.strictEqual(text.getBBox().width, 400, 'Updated bounding box');

        text.attr({
            text: null
        });

        assert.strictEqual(
            text.getBBox().width,
            0,
            'Null text works fine (#7316)'
        );
    } finally {
        renderer.destroy();
    }
});

QUnit.test('textOverflow: ellipsis.', function (assert) {
    var ren = new Highcharts.Renderer(
            document.getElementById('container'),
            600,
            400
        ),
        width = 50,
        style = {
            textOverflow: 'ellipsis',
            width: width + 'px'
        },
        text1 = ren.text('01234567', 0, 100).css(style).add(),
        text2 = ren.text('012345678', 0, 120).css(style).add(),
        getTextContent = text => {
            const childNodes = text.element.childNodes;
            let textContent = '';
            for (let i = 0; i < childNodes.length; i++) {
                if (childNodes[i].nodeName !== 'title') {
                    textContent += childNodes[i].textContent;
                }
            }
            return textContent;
        },
        text1Content = getTextContent(text1);

    assert.strictEqual(
        text1.getBBox().width < width + 2,
        true,
        'Width of text is lower than style.width'
    );

    assert.strictEqual(
        text1Content.slice(-1),
        '\u2026',
        'Ellipsis was added to text node.'
    );
    assert.strictEqual(
        text1Content,
        getTextContent(text2),
        'Consistent result between different strings. #6258'
    );
    // TODO 0px does not work, because ellipsis and breaks are not applied
    // when width is considered falsy.
    style.width = '1px';
    text1.destroy();
    text1 = ren.text('01234567', 0, 100).css(style).add();
    assert.strictEqual(
        getTextContent(text1),
        '',
        'With 1px box width and ellipsis, it should be truncated.'
    );

    /**
     * Rotation. Width determines the length of a rotated text
     */
    text1.destroy();
    text2.destroy();
    style.width = '50px';
    text1 = ren
        .text('01234567', 0, 100)
        .attr({
            rotation: 90
        })
        .css(style)
        .add();
    assert.strictEqual(
        getTextContent(text1).slice(-1),
        '\u2026',
        'Ellipsis was added to text node which has rotation.'
    );
    assert.strictEqual(
        text1.getBBox().height < width + 2,
        true,
        'Height of text is lower than style.width'
    );

    text1.destroy();
    text1 = ren
        .text('The quick brown fox jumps over the lazy dog', 30, 30)
        .css({
            width: '100px'
        })
        .add();
    assert.strictEqual(
        text1.element.getElementsByTagName('title').length,
        0,
        'Wrapped text should not have a title tag (#8444)'
    );

    text1.destroy();
    text1 = ren
        .text('The quick brown fox jumps over the lazy dog', 30, 30)
        .css({
            width: '100px',
            textOverflow: 'ellipsis'
        })
        .add();
    assert.strictEqual(
        text1.element.getElementsByTagName('title').length,
        1,
        'Ellipsis text should have a title tag'
    );
});

QUnit.test('BBox for mulitiple lines', function (assert) {
    var renderer;

    try {
        renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            200,
            200
        );

        var lab = renderer
            .label('<span></span><br/>line<br/>line', 20, 20)
            .css({
                color: '#f00'
            })
            .attr({
                fill: 'rgba(0, 100, 0, 0.75)',
                padding: 0
            })
            .add();

        assert.strictEqual(
            lab.element.getAttribute('dy'),
            null,
            'First line shouldn\'t have dy (#6144) - visually the red text ' +
            'fits in the green box.'
        );

        const txt = renderer
            .text(
                '<span><span>FirstLine</span><br/>SecondLine</span><br/>' +
                'ThirdLine',
                20,
                100
            )
            .add();

        assert.strictEqual(
            txt.element.querySelectorAll('tspan').length,
            4,
            'A fake tspan should be inserted'
        );
        assert.strictEqual(
            txt.element.querySelectorAll('tspan[dy]').length,
            2,
            'The content should be rendered across three lines'
        );


    } finally {
        renderer.destroy();
    }
});

QUnit.test('HTML', function (assert) {
    var renderer;

    try {
        renderer = new Highcharts.SVGRenderer(
            document.getElementById('container'),
            500,
            500
        );

        var text = renderer.text('Hello &amp; &lt;tag&gt;', 10, 30).add();

        assert.strictEqual(
            text.element.textContent,
            'Hello & <tag>',
            'HTML entities decoded correctly'
        );

        text = renderer.text('a < b and c > d', 10, 60).add();
        assert.strictEqual(
            text.element.textContent,
            'a < b and c > d',
            'Tags don\'t start with spaces (#7126)'
        );

        var html = renderer.text('useHTML', 100, 100, true).add();
        assert.close(
            html.element.offsetLeft,
            100,
            1,
            'Left offset should reflect initial position'
        );
        assert.close(
            html.element.offsetHeight + html.element.offsetTop,
            100,
            10,
            'Top offset should reflect initial position'
        );

        text = renderer
            .text('The quick brown fox jumped over the lazy dog', 10, 30, true)
            .css({
                textOverflow: 'ellipsis',
                width: '100px'
            })
            .add();

        assert.strictEqual(
            text.element.style.width,
            '100px',
            'The style width should should now 100px'
        );
        text.css({
            fontWeight: 'bold'
        });
        assert.strictEqual(
            text.element.style.width,
            '100px',
            'The style width should be preserved after running .css with ' +
            'unrelated props (#8994)'
        );

        text.css({
            width: null
        });
        assert.strictEqual(
            text.element.style.width,
            '',
            'The style width should be removed when setting to null'
        );

        text.css({
            width: '120px'
        });
        assert.strictEqual(
            text.element.style.width,
            '120px',
            'The style width should be reset to 120px'
        );

        text.css({
            width: undefined
        });
        assert.strictEqual(
            text.element.style.width,
            '',
            'The style width should be removed when setting to undefined'
        );

        document.getElementById('container').style.position = 'relative';
        text = renderer
            .text(
                'LooooooooooooooooooooooooooooooooooooongText',
                0,
                10,
                true
            )
            .css({
                width: '50px',
                textOverflow: 'ellipsis'
            })
            .add();
        assert.ok(
            text.getBBox().width <= 50,
            'When potentially overflowing, the box should be restrained'
        );

        text.css({ width: '600px' });
        assert.ok(
            text.getBBox().width < 500,
            'When not overflowing, the bounding box should not extend to the ' +
            'CSS width (#16261)'
        );


        renderer = new Highcharts.SVGRenderer(
            document.getElementById('container'),
            500,
            500,
            void 0,
            true
        );

        text = renderer.text('Line<br>break', 0, 10, true)
            .add()
            .attr({
                x: 10
            });

        assert.strictEqual(
            text.element.querySelector('tspan').getAttribute('x'),
            '10',
            '#16062: tspan breaks should have correct x when exporting ' +
            'useHTML=true text with allowHTML=false'
        );
    } finally {
        renderer.destroy();
    }
});

QUnit.test('Dir rtl (#3482)', function (assert) {
    var renderer;

    try {
        document.getElementById('container').setAttribute('dir', 'rtl');

        renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            600,
            400
        );

        var label = renderer
            .label('Hello', 100, 100)
            .attr({
                stroke: 'blue',
                'stroke-width': 1,
                padding: 0
            })
            .add();

        assert.close(
            label.text.element.getBBox().x,
            0,
            2,
            'Label sits nicely inside box'
        );

        document.getElementById('container').removeAttribute('dir');
    } finally {
        renderer.destroy();
    }
});

QUnit.test('Attributes', function (assert) {
    var renderer;

    try {
        renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            600,
            400
        );

        var text = renderer
            .text(
                'The quick brown fox jumps <span class="red">over</span> the ' +
                'lazy dog',
                20,
                20
            )
            .add();

        assert.strictEqual(
            text.element.childNodes[1].getAttribute('class'),
            'red',
            'Double quotes, red span should be picked up'
        );

        text = renderer
            .text(
                'The quick brown fox jumps <span class=\'red\'>over</span>' +
                ' the lazy dog',
                20,
                20
            )
            .add();

        assert.strictEqual(
            text.element.childNodes[1].getAttribute('class'),
            'red',
            'Single quotes, red span should be picked up'
        );
    } finally {
        renderer.destroy();
    }
});

QUnit.test('Text height', function (assert) {
    const renderer = new Highcharts.Renderer(
        document.getElementById('container'),
        400,
        400
    );
    let fontSize;

    try {
        const label = renderer.text('em').add();

        fontSize = '2vw';
        label.css({
            fontSize: fontSize
        });

        assert.strictEqual(
            renderer.fontMetrics(label.element).f,
            parseInt(window.innerWidth / 50, 10),
            'Font size in vw'
        );

        fontSize = '2em';
        label.css({
            fontSize: fontSize
        });
        assert.strictEqual(
            renderer.fontMetrics(label.element).f,
            32,
            'Font size in em'
        );

        fontSize = '2rem';
        label.css({
            fontSize: fontSize
        });
        assert.strictEqual(
            renderer.fontMetrics(label.element).f,
            32,
            'Font size in rem'
        );

        fontSize = '200%';
        label.css({
            fontSize: fontSize
        });
        assert.strictEqual(
            renderer.fontMetrics(label.element).f,
            32,
            'Font size in percent'
        );

        const textLabel = renderer.text('Firefox/IE clean', 10, 30).add();

        const textLabelWithShadow = renderer
            .text('Firefox/IE shadow', 10, 60)
            .css({
                textOutline: '6px silver'
            })
            .add();

        // Highcharts 4.1.1, Issue #3842:
        // Bar dataLabels positions in 4.1.x - Firefox, Internet Explorer
        assert.equal(
            textLabelWithShadow.getBBox().height,
            textLabel.getBBox().height,
            'Shadow text (#3842)'
        );
    } finally {
        renderer.destroy();
    }
});

// Highcharts 4.0.4, Issue #3501
// After adding a new style the text width is not respected
QUnit.test('Adding new text style (#3501)', function (assert) {
    var renderer;
    try {
        renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            500,
            300
        );

        var rect = renderer
            .rect(100, 100, 100, 100)
            .attr({
                'stroke-width': 1,
                stroke: 'blue',
                fill: 'none'
            })
            .add();

        var txt = renderer
            .text('Initial text adapts to box width', 100, 120)
            .css({
                width: '100px'
            })
            .add();

        txt.css({ fill: 'red' });

        txt.attr({
            text:
                'After running .css once, the new text does not respect box ' +
                'width'
        });

        var rectWidth = rect.element.getBBox().width,
            textWidth = txt.element.getBBox().width;

        assert.ok(
            Math.floor(textWidth) <= Math.floor(rectWidth),
            'The text should not be greater than the rect ' +
                `(text: ${textWidth}, rect: ${rectWidth})`
        );
    } finally {
        renderer.destroy();
    }
});

QUnit.test('RTL characters with outline (#10162)', function (assert) {
    var renderer;
    try {
        renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            500,
            300
        );

        /*
        var arabicChars = renderer
            .text('عربي', 100, 50)
            .css({ textOutline: '1px contrast' })
            .add();

        var hebrewChars = renderer
            .text('עברית', 100, 100)
            .css({ textOutline: '1px contrast' })
            .add();
        */

        var japanChars = renderer
            .text('中文', 100, 150)
            .css({ textOutline: '1px contrast' })
            .add();

        var latinChars = renderer
            .text('Edge', 100, 200)
            .css({ textOutline: '1px contrast' })
            .add();

        /*
        // In Firefox the placement is reversed.
        const expectedClass = Highcharts.isFirefox ?
            null :
            'highcharts-text-outline';
        assert.notOk(
            ~[].indexOf.apply(arabicChars.element.children[0].classList, [
                expectedClass
            ]),
            'Arabic characters are not covered with the outline'
        );
        assert.notOk(
            ~[].indexOf.apply(hebrewChars.element.children[0].classList, [
                expectedClass
            ]),
            'Hebrew characters are not covered with the outline'
        );
        */

        assert.ok(
            ~[].indexOf.apply(japanChars.element.children[0].classList, [
                'highcharts-text-outline'
            ]),
            'Japan characters are not covered with the outline'
        );
        assert.ok(
            ~[].indexOf.apply(latinChars.element.children[0].classList, [
                'highcharts-text-outline'
            ]),
            'Latin characters are not covered with the outline'
        );
    } finally {
        renderer.destroy();
    }
});


QUnit.test('textPath', assert => {
    const ren = new Highcharts.Renderer(
        document.getElementById('container'),
        600,
        400
    );

    const path = ren
        .path([
            ['M', 50, 50],
            ['L', 550, 350]
        ])
        .attr({
            stroke: 'blue',
            'stroke-width': 2
        })
        .add();

    const text = ren
        .text('Hello path', 20, 20)
        .add()
        .setTextPath(path, {});

    const textPathHref = text.element.querySelector('textPath')
        .getAttribute('href');

    assert.ok(
        textPathHref,
        'A `textPath` element should be present'
    );

    text.attr({
        text: 'Hello updated path'
    });

    assert.strictEqual(
        text.element.querySelector('textPath').getAttribute('href'),
        textPathHref,
        'The textPath should be preserved after modifying the text'
    );

    text.setTextPath(undefined, { attributes: { dy: 20 } });

    assert.strictEqual(
        text.element.querySelector('textPath').getAttribute('href'),
        textPathHref,
        'The textPath should be preserved after modifying options'
    );
    assert.strictEqual(
        text.element.getAttribute('dy'),
        '20',
        'The text path options should be updated'
    );

    text.css({
        width: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    });
    assert.ok(
        text.element.textContent.indexOf('\u2026') !== -1,
        'Width set, the text should have an ellipsis'
    );

    text.css({
        width: 'auto',
        overflow: 'auto',
        textOverflow: 'none'
    });
    assert.ok(
        text.element.textContent.indexOf('\u2026') === -1,
        'Width unset, the text should not have an ellipsis'
    );

    ren.destroy();
});
