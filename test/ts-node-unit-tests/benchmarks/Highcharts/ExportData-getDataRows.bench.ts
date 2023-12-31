import type { BenchmarkContext, BenchmarkResult } from '../../benchmark';
import { performance } from 'node:perf_hooks';
import { join } from 'node:path';
import { setupDOM } from '../../test-utils';
import { generateColumnData } from '../../data-generators';

export const config = {
    sizes: [10_000, 100_000, 500_000, 1000_000]
};

export function before(size: number) {

    return {
        fileName: `${size}-rows.json`,
        func: () => generateColumnData(size, 1)
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

  const hc = require(join(CODE_PATH, '/highcharts.src.js'));
  hc.doc = doc;
  hc.win = win;
  global.window = win;
  require(join(CODE_PATH, '/modules/export-data.src.js'))(hc);

  const chart = hc.chart(el, {
      accessibility:  {
        enabled: false
      },
      series: [{
          data: data,
      }]
  });

  performance.mark('Start');

  chart.getDataRows();

  performance.mark('End');

  return performance.measure('Start to Now', 'Start', 'End').duration;
}
