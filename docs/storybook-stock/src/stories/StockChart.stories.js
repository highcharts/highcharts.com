import { StockChart } from './StockChart';
import { Source } from '@storybook/addon-docs/blocks';


// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Stock/Understanding-Stock',
  component: StockChart,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],

};

/**
 * The Navigator allows you to fine tune the range of the chart which is displayed.
 */
export const Navigator = {
  args: {
    navigator: true,
    rangeSelector: false,
    title: 'Navigator',
    type: 'line'
  },
};

/**
 * The Range selector allows you to quickly select a range to be shown on the chart or specify the exact interval to be shown.
 */
export const RangeSelector = {
  args: {
    navigator: true,
    rangeSelector: true,
    title: 'Range selector',
    type: 'line',
  },
  parameters: {
    docs: {
      source: {
        code: `const options = {
          title: {
              text: title
          },
  
          navigator: {
              enabled: navigator
          },
  
          rangeSelector: {
              enabled: props.rangeSelector
          },
  
          series: [{
              type,
              color,
              data: data
          }]
      }`, // Custom code to be displayed
      },
    },
  }
};

/**
 * Highcharts Stock also supports candlestick and OHLC charts.
 */
export const ChangingTheSeries = {
  args: {
    navigator: true,
    rangeSelector: true,
    title: 'Candle stick',
    type: 'candlestick',
  }
};
