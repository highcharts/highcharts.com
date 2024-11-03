import { StockChartTwo } from './StockChartTwo';
import data from '../assets/data';
import { Source } from '@storybook/addon-docs/blocks';


// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
export default {
  title: 'Stock/Understanding-StockTwo',
  component: StockChartTwo,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],

};


export const Basic = {
  args: {
    options: {
        title: {
            text: 'Basic stock chart'
        },
        series: [{
          data
        }],
        rangeSelector: {
          enabled: false
        },
        navigator: {
          enabled: false
        }
    }
  },
};

/**
 * The Navigator allows you to fine tune the range of the chart which is displayed.
 */
export const Navigator = {
  args: {
    options: {
        title: {
            text: 'Navigator'
        },
        series: [{
          data
        }],
        rangeSelector: {
          enabled: false
        },
        navigator: {
          enabled: true
        }
    }
  },
};

/**
 * The Range selector allows you to quickly select a range to be shown on the chart or specify the exact interval to be shown.
 */
export const RangeSelector = {
  args: {
    options: {
        title: {
            text: 'Range selector'
        },
        series: [{
          data
        }],
        rangeSelector: {
          enabled: true
        },
        navigator: {
          enabled: true
        }
    }
  },
};

/**
 * Highcharts Stock also supports candlestick and OHLC charts.
 */
export const ChangeSeries = {
  args: {
    options: {
        title: {
            text: 'Series Type'
        },
        series: [{
          type: 'candlestick',
          data
        }],
        rangeSelector: {
          enabled: true
        },
        navigator: {
          enabled: true
        }
    }
  },
};

