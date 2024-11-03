import React from 'react';
import PropTypes from 'prop-types';
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import IndicatorsCore from 'highcharts/indicators/indicators';
import HeikinAshi from 'highcharts/modules/heikinashi';

// Initialize the modules
IndicatorsCore(Highcharts);
HeikinAshi(Highcharts);

/**
 * Highcharts Stock is based on Highcharts, meaning it has all the core functionality of 
 * Highcharts, plus some additional features.
 */
export const StockChartTwo = (props) => {

    return (
        <HighchartsReact
            highcharts={Highcharts}
            constructorType={'stockChart'}
            options={props.options}
        />
    );
};

StockChartTwo.propTypes = {
    /**
     * Chart options
     */
    options: PropTypes.object
};


