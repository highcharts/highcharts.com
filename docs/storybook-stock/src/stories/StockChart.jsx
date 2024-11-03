import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import data from '../assets/data';
import IndicatorsCore from 'highcharts/indicators/indicators';
import HeikinAshi from 'highcharts/modules/heikinashi';

// Initialize the modules
IndicatorsCore(Highcharts);
HeikinAshi(Highcharts);

/**
 * Highcharts Stock is based on Highcharts, meaning it has all the core functionality of 
 * Highcharts, plus some additional features.
 */
export const StockChart = ({ navigator, type, size, title, color, ...props }) => {
    const options = {
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
    }

    return (
        <HighchartsReact
            highcharts={Highcharts}
            constructorType={'stockChart'}
            options={options}
        />
    );
};

StockChart.propTypes = {
    /**
     * Enable the navigator?
     */
    navigator: PropTypes.bool,
    /**
     * Enable the rangeselector?
     */
    rangeSelector: PropTypes.bool,
    /**
     * The color of the series
     */
    color: PropTypes.string,
    /**
     * The series type of the chart
     */
    type: PropTypes.oneOf(['candlestick', 'line', 'heikinashi']),
    /**
     *  Title of the chart
     */
    title: PropTypes.string.isRequired
};

StockChart.defaultProps = {
    color: null,
    navigator: false
};
