import type { BenchmarkContext, BenchmarkResult } from '../../benchmark';
import { performance } from 'node:perf_hooks';
import { generateOHLC } from '../../data-generators';
import { getHighchartsJSDOM } from '../../test-utils';


export const config = {
    sizes: [2500]
};

export function before(size: number) {

    return {
        fileName: `${size}-ohlc.json`,
        func: generateOHLC.bind(undefined, size)
  };
}

export default function benchmarkTest({
    size,
    CODE_PATH,
    data
}: BenchmarkContext): BenchmarkResult {
    const { Highcharts: hc, el } = getHighchartsJSDOM('highstock', [
        '/modules/annotations-advanced'
    ]);

    const chart = hc.stockChart(el, {
        chart: {
            height: 400,
            width: 800
        },
        accessibility: {
            enabled: false
        },
        annotations: [
            {
                type: 'fibonacci',
                typeOptions: {
                    points: [
                        {
                            x: data[0][0],
                            y: data[0][4]
                        },
                        {
                            x: data[100][0],
                            y: data[100][4]
                        }
                    ]
                }
            },
            {
                type: 'crookedLine',
                typeOptions: {
                    points: [
                        {
                            x: data[0][0],
                            y: data[0][4]
                        },
                        {
                            x: data[100][0],
                            y: data[100][4]
                        }
                    ]
                }
            }
        ],
        series: [
            {
                data: data,
                type: 'candlestick',
                dataGrouping: {
                    enabled: true
                }
            }
        ]
    });

    performance.mark('Start');

    for (let i = 0; i < 250; i++) {
        const visible = i % 2 === 0;

        chart.update({
            annotations: [{ visible }, { visible }]
        });
    }

    performance.mark('End');

    return performance.measure('Start to Now', 'Start', 'End').duration;
}
