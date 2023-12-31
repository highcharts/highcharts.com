import type { BenchmarkContext, BenchmarkResult } from '../../benchmark';
import { performance } from 'node:perf_hooks';
import { join } from 'node:path';
import { generateOHLC } from '../../data-generators';
import { setupDOM } from '../../test-utils';


export const config = {
    sizes: [1000, 10_000, 100_000, 1_000_000]
};

export function before(size: number) {

    return {
        fileName: `${size}-ohlc.json`,
        func: generateOHLC.bind(undefined, size)
  };
}

export default async function benchmarkTest(
    {
        size,
        CODE_PATH,
        data
    }: BenchmarkContext
): Promise<BenchmarkResult> {
  const { doc, el, win } = setupDOM();
  const hc = require(join(CODE_PATH, '/highstock.src.js'));
  hc.doc = doc;
  hc.win = win;

  performance.mark('Start');
  hc.stockChart(el, {
    chart: {
        height: 400,
        width: 800
    },
    accessibility: {
      enabled: false
    },
    plotOptions: {
        series: {
            animation: false,
            dataLabels: {
                defer: false
            }
        }
    },
    series: [{
      data: data,
      type: 'candlestick',
    }]
  });
  performance.mark('End');

  return performance.measure('Start to Now', 'Start', 'End').duration;
}
