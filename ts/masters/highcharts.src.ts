/**
 * @license Highcharts JS v@product.version@ (@product.date@)
 * @module highcharts/highcharts
 *
 * (c) 2009-2024 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */
'use strict';
import Highcharts from '../Core/Globals.js';
import Utilities from '../Core/Utilities.js';
import Defaults from '../Core/Defaults.js';
import Fx from '../Core/Animation/Fx.js';
import {
    animate,
    animObject,
    getDeferredAnimation,
    setAnimation,
    stop
} from '../Core/Animation/AnimationUtilities.js';
import AST from '../Core/Renderer/HTML/AST.js';
import Templating from '../Core/Templating.js';
import RendererRegistry from '../Core/Renderer/RendererRegistry.js';
import RendererUtilities from '../Core/Renderer/RendererUtilities.js';
import SVGElement from '../Core/Renderer/SVG/SVGElement.js';
import SVGRenderer from '../Core/Renderer/SVG/SVGRenderer.js';
import HTMLElement from '../Core/Renderer/HTML/HTMLElement.js';
import Axis from '../Core/Axis/Axis.js';
import DateTimeAxis from '../Core/Axis/DateTimeAxis.js';
import LogarithmicAxis from '../Core/Axis/LogarithmicAxis.js';
import PlotLineOrBand from '../Core/Axis/PlotLineOrBand/PlotLineOrBand.js';
import Tick from '../Core/Axis/Tick.js';
import Tooltip from '../Core/Tooltip.js';
import Point from '../Core/Series/Point.js';
import Pointer from '../Core/Pointer.js';
import Legend from '../Core/Legend/Legend.js';
import LegendSymbol from '../Core/Legend/LegendSymbol.js';
import Chart from '../Core/Chart/Chart.js';
import ScrollablePlotArea from '../Extensions/ScrollablePlotArea.js';
import StackingAxis from '../Core/Axis/Stacking/StackingAxis.js';
import StackItem from '../Core/Axis/Stacking/StackItem.js';
import Series from '../Core/Series/Series.js';
import SeriesRegistry from '../Core/Series/SeriesRegistry.js';
import '../Series/Line/LineSeries.js';
import '../Series/Area/AreaSeries.js';
import '../Series/Spline/SplineSeries.js';
import '../Series/AreaSpline/AreaSplineSeries.js';
import '../Series/Column/ColumnSeries.js';
import ColumnDataLabel from '../Series/Column/ColumnDataLabel.js';
import '../Series/Bar/BarSeries.js';
import '../Series/Scatter/ScatterSeries.js';
import '../Series/Pie/PieSeries.js';
import PieDataLabel from '../Series/Pie/PieDataLabel.js';
import DataLabel from '../Core/Series/DataLabel.js';
import OverlappingDataLabels from '../Extensions/OverlappingDataLabels.js';
import BorderRadius from '../Extensions/BorderRadius.js';
import Responsive from '../Core/Responsive.js';
import Color from '../Core/Color/Color.js';
import Time from '../Core/Time.js';
const G: AnyRecord = Highcharts;
// Classes
G.AST = AST;
G.Axis = Axis;
G.Chart = Chart;
G.Color = Color;
G.DataLabel = DataLabel;
G.Fx = Fx;
G.HTMLElement = HTMLElement;
G.Legend = Legend;
G.LegendSymbol = LegendSymbol;
G.OverlappingDataLabels = G.OverlappingDataLabels || OverlappingDataLabels;
G.PlotLineOrBand = PlotLineOrBand;
G.Point = Point;
G.Pointer = Pointer;
G.RendererRegistry = RendererRegistry;
G.Series = Series;
G.SeriesRegistry = SeriesRegistry;
G.StackItem = StackItem;
G.SVGElement = SVGElement;
G.SVGRenderer = SVGRenderer;
G.Templating = Templating;
G.Tick = Tick;
G.Time = Time;
G.Tooltip = Tooltip;
// Utilities
G.animate = animate;
G.animObject = animObject;
G.chart = Chart.chart;
G.color = Color.parse;
G.dateFormat = Templating.dateFormat;
G.defaultOptions = Defaults.defaultOptions;
G.distribute = RendererUtilities.distribute;
G.format = Templating.format;
G.getDeferredAnimation = getDeferredAnimation;
G.getOptions = Defaults.getOptions;
G.numberFormat = Templating.numberFormat;
G.seriesType = SeriesRegistry.seriesType;
G.setAnimation = setAnimation;
G.setOptions = Defaults.setOptions;
G.stop = stop;
G.time = Defaults.defaultTime;
G.timers = Fx.timers;
// Compositions
BorderRadius.compose(G.Series, G.SVGElement, G.SVGRenderer);
ColumnDataLabel.compose(G.Series.types.column);
DataLabel.compose(G.Series);
DateTimeAxis.compose(G.Axis);
HTMLElement.compose(G.SVGRenderer);
Legend.compose(G.Chart);
LogarithmicAxis.compose(G.Axis);
OverlappingDataLabels.compose(G.Chart);
PieDataLabel.compose(G.Series.types.pie);
PlotLineOrBand.compose(G.Axis);
Pointer.compose(G.Chart);
Responsive.compose(G.Chart);
ScrollablePlotArea.compose(G.Axis, G.Chart, G.Series);
StackingAxis.compose(G.Axis, G.Chart, G.Series);
Tooltip.compose(G.Pointer);
Utilities.extend(G, Utilities);
// Default Export
export default G;
