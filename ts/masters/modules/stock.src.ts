/**
 * @license Highstock JS v@product.version@ (@product.date@)
 * @module highcharts/modules/stock
 * @requires highcharts
 *
 * Highcharts Stock as a plugin for Highcharts
 *
 * (c) 2010-2024 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */
'use strict';
import Highcharts from '../../Core/Globals.js';
import DataModifyComposition from '../../Series/DataModifyComposition.js';
import Navigator from '../../Stock/Navigator/Navigator.js';
import OrdinalAxis from '../../Core/Axis/OrdinalAxis.js';
import RangeSelector from '../../Stock/RangeSelector/RangeSelector.js';
import Scrollbar from '../../Stock/Scrollbar/Scrollbar.js';
import StockChart from '../../Core/Chart/StockChart.js';
import '../../Series/HLC/HLCSeries.js';
import OHLCSeries from '../../Series/OHLC/OHLCSeries.js';
import '../../Series/Candlestick/CandlestickSeries.js';
import FlagsSeries from '../../Series/Flags/FlagsSeries.js';
import './broken-axis.src.js';
import './datagrouping.src.js';
import './mouse-wheel-zoom.src.js';
const G: AnyRecord = Highcharts;
// Classes
G.Navigator = G.Navigator || Navigator;
G.OrdinalAxis = G.OrdinalAxis || OrdinalAxis;
G.RangeSelector = G.RangeSelector || RangeSelector;
G.Scrollbar = G.Scrollbar || Scrollbar;
// Functions
G.stockChart = StockChart.stockChart;
G.StockChart = G.StockChart || G.stockChart;
G.extend(G.StockChart, StockChart);
// Compositions
DataModifyComposition.compose(G.Series, G.Axis, G.Point);
FlagsSeries.compose(G.Renderer);
OHLCSeries.compose(G.Series);
G.Navigator.compose(G.Chart, G.Axis, G.Series);
G.OrdinalAxis.compose(G.Axis, G.Series, G.Chart);
G.RangeSelector.compose(G.Axis, G.Chart);
G.Scrollbar.compose(G.Axis);
G.StockChart.compose(G.Chart, G.Axis, G.Series, G.SVGRenderer);
export default Highcharts;
