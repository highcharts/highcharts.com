const commonOptions = {
    api: {
        url: 'https://demo-live-data.highcharts.com',
        access: {
            url: 'https://demo-live-data.highcharts.com/token/oauth',
            token: 'token'
        }
    }
};

const AMDISIN = 'US0079031078';

const AMDPriceConnector =
    new HighchartsConnectors.Morningstar.TimeSeriesConnector({
        ...commonOptions,
        series: {
            type: 'Price'
        },
        securities: [
            {
                id: AMDISIN,
                idType: 'ISIN'
            }
        ],
        currencyId: 'EUR'
    });

(async () => {
    await AMDPriceConnector.load();

    const cols = AMDPriceConnector.table.getColumns();

    const name = Array.from(Object.keys(cols).filter(k => k !== 'Date'))[0];
    const price = cols[name].map((value, i) => [cols.Date[i], value]);

    const firstNav = Highcharts.navigator('navigator-container', {
        series: [{
            data: price,
            color: '#0F0F0F'
        }]
    });

    const secondNav = Highcharts.navigator('second-navigator-container', {
        series: [{
            data: price,
            color: '#0F0F0F'
        }]
    });

    const priceChart = Highcharts.stockChart('price-chart', {
        navigator: {
            enabled: false
        },
        rangeSelector: {
            enabled: false
        },
        scrollbar: {
            enabled: false
        },
        title: {
            text: 'AMD Stock Price'
        },
        series: [{
            name: 'AMD',
            data: price
        }]
    });

    // Adjust second navigator range based on the first navigator
    Highcharts.addEvent(firstNav.navigator, 'setRange', function (e) {
        secondNav.navigator.xAxis.update({ min: e.min, max: e.max });

        const { min, max } = secondNav.navigator.chart.xAxis[0].getExtremes();
        const oneYear = 24 * 3600 * 1000 * 365; // 1 year

        let newMin = Math.max(min, e.min);
        let newMax = Math.min(max, e.max);

        // Ensure the minimal range
        if (newMax - newMin < oneYear) {
            if (newMax < max) {
                newMin = newMax - oneYear;
            } else {
                newMax = newMin + oneYear;
            }
        }

        e.min = newMin;
        e.max = newMax;

        Highcharts.fireEvent(secondNav.navigator, 'setRange', e);
    });

    // Add plot band on first navigator to indicate the range of the chart and
    // second navigator
    Highcharts.addEvent(secondNav.navigator, 'setRange', function (e) {
        firstNav.navigator.xAxis.update({
            plotBands: [{
                from: e.min,
                to: e.max,
                color: '#9E66FF'
            }]
        });
    });

    // Set minimal range for the first navigator
    firstNav.navigator.chart.update({
        xAxis: {
            minRange: 24 * 3600 * 1000 * 365 // 1 year
        }
    });

    // Bind chart
    secondNav.bind(priceChart);

    // Set initial ranges
    firstNav.setRange(
        Date.UTC(2014),
        firstNav.navigator.xAxis.max
    );

    secondNav.setRange(
        Date.UTC(2022),
        secondNav.navigator.xAxis.max
    );
})();
