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
import '../Extensions/ScrollablePlotArea.js';
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
import '../Extensions/OverlappingDataLabels.js';
import '../Extensions/BorderRadius.js';
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
G.Series = Series;
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
G.addEvent = Utilities.addEvent;
G.arrayMax = Utilities.arrayMax;
G.arrayMin = Utilities.arrayMin;
G.attr = Utilities.attr;
G.clearTimeout = Utilities.clearTimeout;
G.correctFloat = Utilities.correctFloat;
G.createElement = Utilities.createElement;
G.css = Utilities.css;
G.defined = Utilities.defined;
G.destroyObjectProperties = Utilities.destroyObjectProperties;
G.discardElement = Utilities.discardElement;
G.distribute = RendererUtilities.distribute;
G.erase = Utilities.erase;
G.error = Utilities.error;
G.extend = Utilities.extend;
G.extendClass = Utilities.extendClass;
G.find = Utilities.find;
G.fireEvent = Utilities.fireEvent;
G.getMagnitude = Utilities.getMagnitude;
G.getStyle = Utilities.getStyle;
G.isArray = Utilities.isArray;
G.isClass = Utilities.isClass;
G.isDOMElement = Utilities.isDOMElement;
G.isFunction = Utilities.isFunction;
G.isNumber = Utilities.isNumber;
G.isObject = Utilities.isObject;
G.isString = Utilities.isString;
G.keys = Object.keys;
G.merge = Utilities.merge;
G.normalizeTickInterval = Utilities.normalizeTickInterval;
G.objectEach = Utilities.objectEach;
G.offset = Utilities.offset;
G.pad = Utilities.pad;
G.pick = Utilities.pick;
G.pInt = Utilities.pInt;
G.relativeLength = Utilities.relativeLength;
G.removeEvent = Utilities.removeEvent;
G.seriesType = SeriesRegistry.seriesType;
G.splat = Utilities.splat;
G.stableSort = Utilities.stableSort;
G.syncTimeout = Utilities.syncTimeout;
G.timeUnits = Utilities.timeUnits;
G.uniqueKey = Utilities.uniqueKey;
G.useSerialIds = Utilities.useSerialIds;
G.wrap = Utilities.wrap;
// Compositions
ColumnDataLabel.compose(ColumnSeries);
DataLabel.compose(Series);
DateTimeAxis.compose(Axis);
LogarithmicAxis.compose(Axis);
PieDataLabel.compose(PieSeries);
PlotLineOrBand.compose(Axis);
Responsive.compose(Chart);
StackingAxis.compose(Axis, Chart, Series);
Tooltip.compose(Pointer);
// Default Export
export default G;
