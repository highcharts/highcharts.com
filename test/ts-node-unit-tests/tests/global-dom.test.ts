import { describe, setupDOM } from '../test-utils';
import { strictEqual } from 'assert';

export function testDOMDependencies() {
    describe('Testing DOM dependencies...');
    const Highcharts = require('../../../code/highcharts.src.js');
    const { doc, win } = setupDOM(
        `<!doctype html>
        <html>
            <body>
                <div id="container"></div>
            </body>
        </html>`
    );
    Highcharts.doc = doc;
    Highcharts.win = win;
    Highcharts.chart('container', {
        series: [{
            data: [1, 2, 3],
            dataLabels: {
                enabled: true
            }
        }]
    }, (chart) => {
        strictEqual(
            chart.series.length,
            1,
            'Chart should have a series without "Node is not defined" error.'
        );
    });
}
