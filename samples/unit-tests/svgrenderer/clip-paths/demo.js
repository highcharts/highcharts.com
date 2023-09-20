QUnit.test(
    'Verify that references to unused clip paths are removed after animation',
    function (assert) {
        // Get list of unique clip path references
        function getClipPathSet(chart) {
            var clipPathList = [];
            chart.container.querySelectorAll('[clip-path],[CLIP-PATH]').forEach(
                function (clipPath) {
                    var p = clipPath.getAttribute('clip-path');
                    if (p !== 'none' && clipPathList.indexOf(p) < 0) {
                        clipPathList.push(p);
                    }
                }
            );
            return clipPathList;
        }

        // Hijack animation
        var clock = TestUtilities.lolexInstall();

        try {
            var done = assert.async(2);

            var chart = Highcharts.chart('container', {
                chart: {
                    events: {
                        load: function () {
                            assert.strictEqual(
                                getClipPathSet(this).length,
                                3,
                                'There are references to three (one additional from annotations module) different clipPaths'
                            );
                            done();
                        }
                    }
                },
                plotOptions: {
                    series: {
                        animation: {
                            duration: 1
                        }
                    }
                },
                series: [
                    {
                        data: [1, 2, 3, 4]
                    },
                    {
                        data: [4, 3, 2, 1]
                    }
                ]
            });

            setTimeout(function () {
                assert.strictEqual(
                    getClipPathSet(chart).length,
                    2,
                    'There are only references to two (one additional from annotations module) clipPath after animation'
                );
                done();
            }, 20);

            // Reset animation
            TestUtilities.lolexRunAndUninstall(clock);
        } finally {
            TestUtilities.lolexUninstall(clock);
        }
    }
);
