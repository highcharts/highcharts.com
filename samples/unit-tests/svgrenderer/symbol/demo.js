// Purposefully not using lolex for this, as we are loading images.
QUnit.test('Symbol tests', function (assert) {
    var w = 400,
        h = 400,
        done = assert.async(),
        total = 0,
        count = 0,
        symbol1,
        symbol2,
        symbol3,
        circleFloatError,
        halfCircleSymbol,
        label,
        url =
            location.host.substr(0, 12) === 'localhost:98' ?
                'url(base/test/testimage.png)' : // karma
                'url(testimage.png)'; // utils

    function ifDone() {
        count++;
        if (count === total) {
            done();
        }
    }

    // Add chart to get the onload event after images are loaded.
    Highcharts.chart('container', {
        chart: {
            width: w,
            height: h,
            backgroundColor: 'none',
            events: {
                // set up images related elements
                beforeRender: function () {
                    var ren = this.renderer;

                    // Add a grid so we can see where they symbols are
                    for (var x = 99.5; x < w - 1; x += 100) {
                        ren.path(['M', x, 0, 'L', x, 400])
                            .attr({
                                stroke: 'silver',
                                'stroke-width': 1
                            })
                            .add();
                    }

                    for (var y = 99.5; y < h - 1; y += 100) {
                        ren.path(['M', 0, y, 'L', 400, y])
                            .attr({
                                stroke: 'silver',
                                'stroke-width': 1
                            })
                            .add();
                    }

                    // Basic symbol
                    symbol1 = ren.symbol(url, 100, 100).add();
                    total++;

                    // With explicit size
                    symbol2 = ren
                        .symbol(
                            url.replace(')', '?' + Date.now() + ')'),
                            200,
                            100,
                            null,
                            null,
                            {
                                width: 20,
                                height: 20
                            }
                        )
                        .add();
                    total++;

                    // Label with background
                    label = ren
                        .label('Hello Label', 300, 100, url)
                        .attr({
                            padding: 0,
                            width: 100,
                            height: 30
                        })
                        .add();
                    total++;

                    // Symbol with wrong name #6627
                    symbol3 = ren
                        .symbol('krakow', 100, 200, 10, 10)
                        .attr({
                            fill: 'red'
                        })
                        .add();
                    total++;

                    // Circle drawn at large coordinate leading to floating
                    // point error when SVGRenderer draws with absolute
                    // coordinates. (#21701)
                    circleFloatError = ren
                        .symbol('circle', 5000.5, 100, 6, 6)
                        .attr({
                            fill: 'blue'
                        })
                        .add();
                    total++;

                    halfCircleSymbol = ren
                        .symbol('arc', 300, 300, 10, 10, {
                            start: Math.PI * 0.5,
                            end: 1.5 * Math.PI,
                            open: false
                        })
                        .attr({
                            fill: 'green'
                        })
                        .add();
                    total++;
                },
                // images are loaded
                load: function () {
                    // Basic symbol
                    assert.strictEqual(
                        symbol1.element.getAttribute('width'),
                        '30',
                        'Width ok'
                    );
                    assert.strictEqual(
                        symbol1.element.getAttribute('transform') &&
                            symbol1.element
                                .getAttribute('transform')
                                .replace(' ', ','), // MSIE
                        'translate(-15,-15)',
                        'Translate ok'
                    );
                    ifDone();

                    // With explicit size
                    assert.strictEqual(
                        symbol2.element.getAttribute('width'),
                        '20',
                        'Width ok'
                    );
                    assert.strictEqual(
                        symbol2.element.getAttribute('transform') &&
                            symbol2.element
                                .getAttribute('transform')
                                .replace(' ', ','), // MSIE
                        'translate(-10,-10)',
                        'Translate ok'
                    );
                    ifDone();

                    // Label with background
                    assert.strictEqual(
                        label.box.element.getAttribute('width'),
                        '30',
                        'Label box width ok'
                    );
                    assert.strictEqual(
                        label.box.element.getAttribute('transform') &&
                            label.box.element
                                .getAttribute('transform')
                                .replace('(35)', '(35,0)'), // MSIE
                        'translate(35,0)',
                        'Label box translate ok, centered in label'
                    );
                    ifDone();

                    // Symbol with wrong name #6627
                    assert.strictEqual(
                        symbol3.symbolName,
                        'circle',
                        'Wrong symbol name defualts to "circle" (#6627)'
                    );
                    ifDone();

                    assert.strictEqual(
                        Math.round(
                            symbol3.attr('d').split(' ')[10] // y-end
                        ),
                        210,
                        'Circle should not draw with relative coordinates'
                    );

                    assert.strictEqual(
                        Math.round(circleFloatError.element.getBBox().width),
                        6,
                        'Circles at large positions should be visible (#21701)'
                    );

                    assert.strictEqual(
                        Math.round(
                            circleFloatError.attr('d').split(' ')[10] * 10e6
                        ),
                        667,
                        'Circle should draw with relative coordinates (#21701)'
                    );
                    ifDone();

                    assert.strictEqual(
                        +halfCircleSymbol.attr('d').split(' ')[10],
                        290,
                        'Arcs should draw with absolute coordinates (#21701)'
                    );
                    ifDone();
                }
            }
        }
    });
});

QUnit.test('Arc', assert => {
    const path = Highcharts.SVGRenderer.prototype.symbols.arc(0, 0, 10, 10, {
        r: 0
    });

    assert.strictEqual(
        path[1][1],
        0,
        '#15382: X radius should be 0'
    );
    assert.strictEqual(
        path[1][2],
        0,
        '#15382: Y radius should be 0'
    );
});

QUnit.test('Square/rect', assert => {
    ['square', 'rect'].forEach(shape => {
        const fn = Highcharts.SVGRenderer.prototype.symbols[shape];

        let path = fn(0, 0, 10, 10);
        assert.strictEqual(
            path.length,
            5,
            `${shape}, no options: Path should have no curves`
        );

        path = fn(0, 0, 10, 10, { r: 0 });
        assert.strictEqual(
            path.length,
            5,
            `${shape}, r=0: Path should have no curves`
        );

        path = fn(0, 0, 10, 10, { r: 5 });
        assert.ok(
            path.length > 5,
            `${shape}, r=5: Path should have curves`
        );
    });
});

QUnit.test('Image', assert => {
    const renderer = new Highcharts.Renderer(
            document.getElementById('container'),
            400,
            300
        ),
        // eslint-disable-next-line max-len
        symbol = 'url(data:image/svg+xml;base64,PHN2ZyBpZD0ibWFsZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTkyIDUxMiI+PHBhdGggZD0iTTk2IDBjMzUuMzQ2IDAgNjQgMjguNjU0IDY0IDY0cy0yOC42NTQgNjQtNjQgNjQtNjQtMjguNjU0LTY0LTY0UzYwLjY1NCAwIDk2IDBtNDggMTQ0aC0xMS4zNmMtMjIuNzExIDEwLjQ0My00OS41OSAxMC44OTQtNzMuMjggMEg0OGMtMjYuNTEgMC00OCAyMS40OS00OCA0OHYxMzZjMCAxMy4yNTUgMTAuNzQ1IDI0IDI0IDI0aDE2djEzNmMwIDEzLjI1NSAxMC43NDUgMjQgMjQgMjRoNjRjMTMuMjU1IDAgMjQtMTAuNzQ1IDI0LTI0VjM1MmgxNmMxMy4yNTUgMCAyNC0xMC43NDUgMjQtMjRWMTkyYzAtMjYuNTEtMjEuNDktNDgtNDgtNDh6IiBmaWxsPSIjMkQ1RkYzIi8+PC9zdmc+)';

    renderer.image(
        'https://www.highcharts.com/samples/graphics/sun.png',
        100,
        null,
        ''
    ).add();

    assert.ok(
        true,
        'No errors after adding an image without optional parameters, #11756.'
    );


    const clock = TestUtilities.lolexInstall();

    const symbol1 = renderer.symbol(
        symbol,
        50,
        50,
        void 0,
        void 0, {
            backgroundSize: 'within'
        }
    ).attr({
        width: 50,
        height: 50
    }).add();

    try {
        setTimeout(() => {
            const symbol2 = renderer.symbol(
                symbol,
                200,
                50,
                void 0,
                void 0, {
                    backgroundSize: 'within'
                }
            ).attr({
                height: 50,
                width: 50
            })
                .add();

            const {
                    width: width1,
                    height: height1
                } = symbol1.element.getBBox(),
                {
                    width: width2,
                    height: height2
                } = symbol2.element.getBBox();

            assert.equal(
                width1,
                width2,
                'Width of image-symbol should not be changed after redraw, ' +
                '#17315.'
            );

            assert.equal(
                height1,
                height2,
                'Height of image-symbol should not be changed after redraw, ' +
                '#17315.'
            );
        }, 100);

        TestUtilities.lolexRunAndUninstall(clock);
    } catch (error) {
        TestUtilities.lolexUninstall(clock);
        throw error;
    }

    symbol1.imgwidth = 56;
    symbol1.imgheight = 150;
    symbol1.attr({
        width: 0,
        height: 0
    });

    assert.equal(
        symbol1.translateX,
        -symbol1.imgwidth / 2,
        'Symbol should be correctly centered in X (#18790)'
    );

    assert.equal(
        symbol1.translateY,
        -symbol1.imgheight / 2,
        'Symbol should be correctly centered in Y (#18790)'
    );
});
