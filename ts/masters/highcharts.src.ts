/**
 * @license Highcharts JS v@product.version@ (@product.date@)
 * @module highcharts/highcharts
 *
 * (c) 2009-2021 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */
'use strict';
import Highcharts from '../Core/Globals.js';
import Utilities from '../Core/Utilities.js';
import Defaults from '../Core/Defaults.js';
import Fx from '../Core/Animation/Fx.js';
import Animation from '../Core/Animation/AnimationUtilities.js';
import AST from '../Core/Renderer/HTML/AST.js';
import Templating from '../Core/Templating.js';
import RendererRegistry from '../Core/Renderer/RendererRegistry.js';
import RendererUtilities from '../Core/Renderer/RendererUtilities.js';
import SVGElement from '../Core/Renderer/SVG/SVGElement.js';
import SVGRenderer from '../Core/Renderer/SVG/SVGRenderer.js';
import HTMLElement from '../Core/Renderer/HTML/HTMLElement.js';
import HTMLRenderer from '../Core/Renderer/HTML/HTMLRenderer.js';
import Axis from '../Core/Axis/Axis.js';
import DateTimeAxis from '../Core/Axis/DateTimeAxis.js';
import LogarithmicAxis from '../Core/Axis/LogarithmicAxis.js';
import PlotLineOrBand from '../Core/Axis/PlotLineOrBand/PlotLineOrBand.js';
import Tick from '../Core/Axis/Tick.js';
import Tooltip from '../Core/Tooltip.js';
import Point from '../Core/Series/Point.js';
import Pointer from '../Core/Pointer.js';
import Legend from '../Core/Legend/Legend.js';
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
import ColumnSeries from '../Series/Column/ColumnSeries.js';
import ColumnDataLabel from '../Series/Column/ColumnDataLabel.js';
import '../Series/Bar/BarSeries.js';
import '../Series/Scatter/ScatterSeries.js';
import PieSeries from '../Series/Pie/PieSeries.js';
import PieDataLabel from '../Series/Pie/PieDataLabel.js';
import DataLabel from '../Core/Series/DataLabel.js';
import OverlappingDataLabels from '../Extensions/OverlappingDataLabels.js';
import BorderRadius from '../Extensions/BorderRadius.js';
import Responsive from '../Core/Responsive.js';
import Color from '../Core/Color/Color.js';
import Time from '../Core/Time.js';
const G: AnyRecord = Highcharts;
// Animation
G.animate = Animation.animate;
G.animObject = Animation.animObject;
G.getDeferredAnimation = Animation.getDeferredAnimation;
G.setAnimation = Animation.setAnimation;
G.stop = Animation.stop;
G.timers = Fx.timers;
// Classes
G.AST = AST;
G.Axis = Axis;
G.Chart = Chart;
G.chart = Chart.chart;
G.Fx = Fx;
G.Legend = Legend;
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
// Color
G.Color = Color;
G.color = Color.parse;
// Compositions
HTMLRenderer.compose(SVGRenderer);
HTMLElement.compose(SVGElement);
Pointer.compose(Chart);
Legend.compose(Chart);
// DefaultOptions
G.defaultOptions = Defaults.defaultOptions;
G.getOptions = Defaults.getOptions;
G.time = Defaults.defaultTime;
G.setOptions = Defaults.setOptions;
// Format Utilities
G.dateFormat = Templating.dateFormat;
G.format = Templating.format;
G.numberFormat = Templating.numberFormat;
// Utilities
Utilities.extend(G, Utilities);
G.distribute = RendererUtilities.distribute;
G.seriesType = SeriesRegistry.seriesType;
// Compositions
ColumnDataLabel.compose(ColumnSeries);
BorderRadius.compose(Series, PieSeries, SVGElement, SVGRenderer);
DataLabel.compose(Series);
DateTimeAxis.compose(Axis);
LogarithmicAxis.compose(Axis);
OverlappingDataLabels.compose(Chart);
PieDataLabel.compose(PieSeries);
PlotLineOrBand.compose(Axis);
Responsive.compose(Chart);
ScrollablePlotArea.compose(Axis, Chart, Series);
StackingAxis.compose(Axis, Chart, Series);
Tooltip.compose(Pointer);
// Default Export
export default G;
