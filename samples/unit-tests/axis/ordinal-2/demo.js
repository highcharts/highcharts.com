Highcharts.isTouchDevice = true;
// create the chart
Highcharts.getJSON('https://demo-live-data.highcharts.com/aapl-ohlcv.json', function (data) {

    // create the chart
    const chart = Highcharts.stockChart('container', {
        yAxis: {
            height: '50%'
        },
        rangeSelector: {
            buttons: [{
                type: 'hour',
                count: 1,
                text: '1h'
            }, {
                type: 'week',
                count: 10,
                text: '1D'
            }, {
                type: 'all',
                count: 1,
                text: 'All'
            }],
            selected: 1,
            inputEnabled: false
        },

        series: [{
            name: 'AAPL',
            type: 'candlestick',
            data: data,
            tooltip: {
                valueDecimals: 2
            },
            dataGrouping: {
                forced: true,
                units: [[
                    'week',
                    [1]
                ]]
            }
        }]
    });

    TestController.prototype.pinch2 = function (from, to, debug) {

        const startPoint1 = [from.x1, from.y1];
        const startPoint2 = [from.x2, from.y2];
        const endPoint1 = [to.x1, to.y1];
        const endPoint2 = [to.x2, to.y2];
        const movePoints1 = TestController.getPointsBetween(startPoint1, endPoint1, 1);
        const movePoints2 = TestController.getPointsBetween(startPoint2, endPoint2, 1);
        const target = this.elementFromPoint(from.x1, from.y1);
        let extra, movePoint1, movePoint2;
        const chartX = from.x1;
        const chartY = (from.y1 + from.y2) / 2;

        const ie = Math.max(movePoints1.length, movePoints2.length);
        const getProgressiveIndex = (length, progress) => Math.floor(length * progress);
        for (var i = 0; i < ie; ++i) {
            const progress = i / ie;
            movePoint1 = movePoints1[getProgressiveIndex(movePoints1.length, progress)];
            movePoint2 = movePoints2[getProgressiveIndex(movePoints2.length, progress)];
            extra = {
                relatedTarget: target,
                touches: TestController.createTouchList([
                    { pageX: movePoint1[0], pageY: movePoint1[1] },
                    { pageX: movePoint2[0], pageY: movePoint2[1] }
                ])
            };
            if (i === 0) {
                this.touchStart(chartX, chartY, true, extra, debug);
            }

            this.touchMove(movePoint2[0], movePoint1[1], true, extra, debug);
            if (i === ie) {
                this.touchEnd(movePoint2[0], movePoint1[1], true, extra, debug);
            }
        }
    };

    const testController = new TestController(chart);
    const { min, max } = chart.xAxis[0];
    const from = {
        x1: chart.plotLeft + chart.plotWidth,
        y1: chart.plotTop + chart.plotHeight / 2,
        x2: chart.plotLeft + chart.plotWidth / 2,
        y2: chart.plotTop + chart.plotHeight / 2
    };

    const to = {
        x1: chart.plotLeft + chart.plotWidth,
        y1: chart.plotTop + chart.plotHeight / 2,
        x2: chart.plotLeft + chart.plotWidth - 10,
        y2: chart.plotTop + chart.plotHeight / 2
    };

    testController.pinch2(
        from,
        to,
        true
    );

    console.log({ min: new Date(min), max: new Date(max) });
});
