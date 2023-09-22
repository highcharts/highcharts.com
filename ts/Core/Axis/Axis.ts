/* *
 *
 *  (c) 2010-2021 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type { AlignValue } from '../Renderer/AlignObject';
import type AnimationOptions from '../Animation/AnimationOptions';
import type AxisComposition from './AxisComposition';
import type {
    AxisCollectionKey,
    AxisCrosshairOptions,
    AxisLabelFormatterCallback,
    AxisLabelFormatterContextObject,
    AxisOptions,
    AxisTitleOptions,
    XAxisOptions,
    YAxisOptions
} from './AxisOptions';
import type AxisLike from './AxisLike';
import type { AxisType, AxisTypeOptions } from './AxisType';
import type Chart from '../Chart/Chart';
import type CSSObject from '../Renderer/CSSObject';
import type { EventCallback } from '../Callback';
import type FontMetricsObject from '../Renderer/FontMetricsObject';
import type PlotLineOptions from './PlotLineOrBand/PlotLineOptions';
import type PlotLineOrBand from './PlotLineOrBand/PlotLineOrBand';
import type Point from '../Series/Point';
import type PointerEvent from '../PointerEvent';
import type PositionObject from '../Renderer/PositionObject';
import type Series from '../Series/Series';
import type SizeObject from '../Renderer/SizeObject';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type TickPositionsArray from './TickPositionsArray';

import A from '../Animation/AnimationUtilities.js';
const { animObject } = A;
import AxisDefaults from './AxisDefaults.js';
import Color from '../Color/Color.js';
import D from '../Defaults.js';
const { defaultOptions } = D;
import F from '../Foundation.js';
const { registerEventOptions } = F;
import H from '../Globals.js';
const { deg2rad } = H;
import { Palette } from '../Color/Palettes.js';
import Tick from './Tick.js';
import U from '../Utilities.js';
const {
    arrayMax,
    arrayMin,
    clamp,
    correctFloat,
    defined,
    destroyObjectProperties,
    erase,
    error,
    extend,
    fireEvent,
    getClosestDistance,
    insertItem,
    isArray,
    isNumber,
    isString,
    merge,
    normalizeTickInterval,
    objectEach,
    pick,
    relativeLength,
    removeEvent,
    splat,
    syncTimeout
} = U;

const getNormalizedTickInterval = (
    axis: Axis,
    tickInterval: number
): number => normalizeTickInterval(
    tickInterval,
    void 0,
    void 0,
    pick(
        axis.options.allowDecimals,
        // If the tick interval is greather than 0.5, avoid decimals, as
        // linear axes are often used to render discrete values (#3363). If
        // a tick amount is set, allow decimals by default, as it increases
        // the chances for a good fit.
        tickInterval < 0.5 || axis.tickAmount !== void 0
    ),
    !!axis.tickAmount
);

/* *
 *
 *  Declarations
 *
 * */

declare module '../Series/SeriesOptions' {
    interface SeriesOptions {
        softThreshold?: boolean;
        startFromThreshold?: boolean;
        threshold?: number|null;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * Create a new axis object. Called internally when instanciating a new chart or
 * adding axes by {@link Highcharts.Chart#addAxis}.
 *
 * A chart can have from 0 axes (pie chart) to multiples. In a normal, single
 * series cartesian chart, there is one X axis and one Y axis.
 *
 * The X axis or axes are referenced by {@link Highcharts.Chart.xAxis}, which is
 * an array of Axis objects. If there is only one axis, it can be referenced
 * through `chart.xAxis[0]`, and multiple axes have increasing indices. The same
 * pattern goes for Y axes.
 *
 * If you need to get the axes from a series object, use the `series.xAxis` and
 * `series.yAxis` properties. These are not arrays, as one series can only be
 * associated to one X and one Y axis.
 *
 * A third way to reference the axis programmatically is by `id`. Add an `id` in
 * the axis configuration options, and get the axis by
 * {@link Highcharts.Chart#get}.
 *
 * Configuration options for the axes are given in options.xAxis and
 * options.yAxis.
 *
 * @class
 * @name Highcharts.Axis
 *
 * @param {Highcharts.Chart} chart
 * The Chart instance to apply the axis on.
 *
 * @param {Highcharts.AxisOptions} userOptions
 * Axis options
 */
class Axis {

    /* *
     *
     *  Static Properties
     *
     * */

    public static readonly defaultOptions = AxisDefaults.defaultXAxisOptions;

    // Properties to survive after destroy, needed for Axis.update (#4317,
    // #5773, #5881).
    public static keepProps = [
        'coll',
        'extKey',
        'hcEvents',
        'names',
        'series',
        'userMax',
        'userMin'
    ];

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        chart: Chart,
        userOptions: DeepPartial<AxisOptions>,
        coll?: AxisCollectionKey
    ) {
        this.init(chart, userOptions, coll);
    }

    /* *
     *
     *  Properties
     *
     * */

    public _addedPlotLB?: boolean;
    public allowZoomOutside?: boolean;
    public alternateBands: Record<string, PlotLineOrBand> = void 0 as any;
    public autoRotation?: Array<number>;
    public axisGroup?: SVGElement;
    public axisLine?: SVGElement;
    public axisParent?: SVGElement;
    public axisPointRange?: number;
    public axisTitle?: SVGElement;
    public axisTitleMargin?: number;
    public bottom: number = void 0 as any;
    public categories?: Array<string>;
    public chart: Chart = void 0 as any;
    public closestPointRange: number = void 0 as any;
    public coll: AxisCollectionKey = void 0 as any;
    public cross?: SVGElement;
    public crosshair?: AxisCrosshairOptions;
    public dataMax?: (null|number);
    public dataMin?: (null|number);
    public displayBtn?: boolean;
    public eventArgs?: any;
    public eventOptions: Record<string, EventCallback<Series, Event>> = void 0 as any;
    public finalTickAmt?: number;
    public forceRedraw?: boolean;
    public gridGroup?: SVGElement;
    public hasNames: boolean = void 0 as any;
    public hasVisibleSeries: boolean = void 0 as any;
    public height: number = void 0 as any;
    public horiz?: boolean;
    public index: number = void 0 as any;
    public isDirty?: boolean;
    public isLinked: boolean = void 0 as any;
    public isOrdinal?: boolean;
    public isRadial?: boolean;
    public isXAxis?: boolean;
    public isZAxis?: boolean;
    public keepProps?: Array<string>;
    public labelAlign?: AlignValue;
    public labelEdge: Array<null> = void 0 as any; // @todo
    public labelFormatter: AxisLabelFormatterCallback = void 0 as any;
    public labelGroup?: SVGElement;
    public labelOffset?: number;
    public labelRotation?: number;
    public left: number = void 0 as any;
    public len: number = void 0 as any;
    public linkedParent?: Axis;
    public max: (null|number) = void 0 as any;
    public maxLabelDimensions?: SizeObject;
    public maxLabelLength: number = void 0 as any;
    public min: (null|number) = void 0 as any;
    public minorTickInterval: number = void 0 as any;
    public minorTicks: Record<string, Tick> = void 0 as any;
    public minPixelPadding: number = void 0 as any;
    public minPointOffset?: number;
    public minRange?: (null|number);
    public names: Array<string> = void 0 as any;
    public offset: number = void 0 as any;
    public old?: { // @todo create a type
        len: number;
        max: number|null;
        min: number|null;
        transA: number;
        userMax?: number;
        userMin?: number;
    };
    public opposite?: boolean;
    public options: (AxisOptions|XAxisOptions|YAxisOptions) = void 0 as any;
    public ordinal?: AxisComposition['ordinal'];
    public overlap: boolean = void 0 as any;
    public paddedTicks: Array<number> = void 0 as any;
    public panningState?: Axis.PanningState;
    public plotLinesAndBands: Array<PlotLineOrBand> = void 0 as any;
    public plotLinesAndBandsGroups: Record<string, SVGElement> = void 0 as any;
    public pointRange: number = void 0 as any;
    public pointRangePadding: number = void 0 as any;
    public pos: number = void 0 as any;
    public positiveValuesOnly: boolean = void 0 as any;
    public reserveSpaceDefault?: boolean;
    public reversed?: boolean;
    public right: number = void 0 as any;
    public sector?: number;
    public series: Array<Series> = void 0 as any;
    public showAxis?: boolean;
    public side: number = void 0 as any;
    public single?: boolean;
    public softThreshold?: boolean;
    public staggerLines?: number;
    public staticScale?: number;
    public threshold?: number;
    public thresholdAlignment?: number;
    public tickAmount: number = void 0 as any;
    public tickInterval: number = void 0 as any;
    public tickmarkOffset: number = void 0 as any;
    public tickPositions: TickPositionsArray = void 0 as any;
    public tickRotCorr: PositionObject = void 0 as any;
    public ticks: Record<string, Tick> = void 0 as any;
    public titleOffset?: number;
    public top: number = void 0 as any;
    public transA: number = void 0 as any;
    public transB: number = void 0 as any;
    public translationSlope: number = void 0 as any;
    public userMax?: number;
    public userMin?: number;
    public userMinRange?: number;
    public userOptions: DeepPartial<AxisOptions> = void 0 as any;
    public visible: boolean = void 0 as any;
    public width: number = void 0 as any;
    public zoomEnabled: boolean = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Overrideable function to initialize the axis.
     *
     * @see {@link Axis}
     *
     * @function Highcharts.Axis#init
     *
     * @param {Highcharts.Chart} chart
     * The Chart instance to apply the axis on.
     *
     * @param {AxisOptions} userOptions
     * Axis options.
     *
     * @emits Highcharts.Axis#event:afterInit
     * @emits Highcharts.Axis#event:init
     */
    public init(
        chart: Chart,
        userOptions: DeepPartial<AxisOptions>,
        coll: AxisCollectionKey = this.coll
    ): void {
        const isXAxis = coll === 'xAxis',
            axis = this;

        /**
         * The Chart that the axis belongs to.
         *
         * @name Highcharts.Axis#chart
         * @type {Highcharts.Chart}
         */
        axis.chart = chart;

        /**
         * Whether the axis is horizontal.
         *
         * @name Highcharts.Axis#horiz
         * @type {boolean|undefined}
         */
        axis.horiz = axis.isZAxis || (chart.inverted ? !isXAxis : isXAxis);

        /**
         * Whether the axis is the x-axis.
         *
         * @name Highcharts.Axis#isXAxis
         * @type {boolean|undefined}
         */
        axis.isXAxis = isXAxis;

        /**
         * The collection where the axis belongs, for example `xAxis`, `yAxis`
         * or `colorAxis`. Corresponds to properties on Chart, for example
         * {@link Chart.xAxis}.
         *
         * @name Highcharts.Axis#coll
         * @type {string}
         */
        axis.coll = coll;

        fireEvent(this, 'init', { userOptions: userOptions });

        // Needed in setOptions
        axis.opposite = pick(userOptions.opposite, axis.opposite);

        /**
         * The side on which the axis is rendered. 0 is top, 1 is right, 2
         * is bottom and 3 is left.
         *
         * @name Highcharts.Axis#side
         * @type {number}
         */
        axis.side = pick(
            userOptions.side,
            axis.side,
            (axis.horiz ?
                (axis.opposite ? 0 : 2) : // top : bottom
                (axis.opposite ? 1 : 3)) // right : left
        );

        /**
         * Current options for the axis after merge of defaults and user's
         * options.
         *
         * @name Highcharts.Axis#options
         * @type {Highcharts.AxisOptions}
         */
        axis.setOptions(userOptions);


        const options = this.options,
            labelsOptions = options.labels,
            type = options.type;

        /**
         * User's options for this axis without defaults.
         *
         * @name Highcharts.Axis#userOptions
         * @type {Highcharts.AxisOptions}
         */
        axis.userOptions = userOptions;

        axis.minPixelPadding = 0;


        /**
         * Whether the axis is reversed. Based on the `axis.reversed`,
         * option, but inverted charts have reversed xAxis by default.
         *
         * @name Highcharts.Axis#reversed
         * @type {boolean}
         */
        axis.reversed = pick(options.reversed, axis.reversed);
        axis.visible = options.visible;
        axis.zoomEnabled = options.zoomEnabled;

        // Initial categories
        axis.hasNames =
            type === 'category' || (options.categories as any) === true;

        /**
         * If categories are present for the axis, names are used instead of
         * numbers for that axis.
         *
         * Since Highcharts 3.0, categories can also be extracted by giving each
         * point a name and setting axis type to `category`. However, if you
         * have multiple series, best practice remains defining the `categories`
         * array.
         *
         * @see [xAxis.categories](/highcharts/xAxis.categories)
         *
         * @name Highcharts.Axis#categories
         * @type {Array<string>}
         * @readonly
         */
        axis.categories = options.categories || (axis.hasNames ? [] : void 0);
        if (!axis.names) { // Preserve on update (#3830)
            axis.names = [];
            (axis.names as any).keys = {};
        }


        // Placeholder for plotlines and plotbands groups
        axis.plotLinesAndBandsGroups = {};

        // Shorthand types
        axis.positiveValuesOnly = !!axis.logarithmic;

        // Flag, if axis is linked to another axis
        axis.isLinked = defined(options.linkedTo);

        /**
         * List of major ticks mapped by postition on axis.
         *
         * @see {@link Highcharts.Tick}
         *
         * @name Highcharts.Axis#ticks
         * @type {Highcharts.Dictionary<Highcharts.Tick>}
         */
        axis.ticks = {};
        axis.labelEdge = [];
        /**
         * List of minor ticks mapped by position on the axis.
         *
         * @see {@link Highcharts.Tick}
         *
         * @name Highcharts.Axis#minorTicks
         * @type {Highcharts.Dictionary<Highcharts.Tick>}
         */
        axis.minorTicks = {};

        // List of plotLines/Bands
        axis.plotLinesAndBands = [];

        // Alternate bands
        axis.alternateBands = {};

        // Axis metrics
        axis.len = 0;
        axis.minRange = axis.userMinRange = options.minRange || options.maxZoom;
        axis.range = options.range;
        axis.offset = options.offset || 0;


        /**
         * The maximum value of the axis. In a logarithmic axis, this is the
         * logarithm of the real value, and the real value can be obtained from
         * {@link Axis#getExtremes}.
         *
         * @name Highcharts.Axis#max
         * @type {number|null}
         */
        axis.max = null;

        /**
         * The minimum value of the axis. In a logarithmic axis, this is the
         * logarithm of the real value, and the real value can be obtained from
         * {@link Axis#getExtremes}.
         *
         * @name Highcharts.Axis#min
         * @type {number|null}
         */
        axis.min = null;

        /**
         * The processed crosshair options.
         *
         * @name Highcharts.Axis#crosshair
         * @type {boolean|Highcharts.AxisCrosshairOptions}
         */
        const crosshair = pick(
            options.crosshair,
            splat((chart.options.tooltip as any).crosshairs)[isXAxis ? 0 : 1]
        );
        axis.crosshair = crosshair === true ? {} : crosshair;

        // Register. Don't add it again on Axis.update().
        if (chart.axes.indexOf(axis) === -1) { //
            if (isXAxis) { // #2713
                chart.axes.splice(chart.xAxis.length, 0, axis);
            } else {
                chart.axes.push(axis);
            }

            insertItem(this, chart[this.coll] as Array<AxisType>);

        }
        chart.orderItems(axis.coll);

        /**
         * All series associated to the axis.
         *
         * @name Highcharts.Axis#series
         * @type {Array<Highcharts.Series>}
         */
        axis.series = axis.series || []; // populated by Series

        // Reversed axis
        if (
            chart.inverted &&
            !axis.isZAxis &&
            isXAxis &&
            typeof axis.reversed === 'undefined'
        ) {
            axis.reversed = true;
        }

        axis.labelRotation = isNumber(labelsOptions.rotation) ?
            labelsOptions.rotation :
            void 0;

        // Register event listeners
        registerEventOptions(axis, options);

        fireEvent(this, 'afterInit');
    }

    /**
     * Merge and set options.
     *
     * @private
     * @function Highcharts.Axis#setOptions
     *
     * @param {Highcharts.AxisOptions} userOptions
     * Axis options.
     *
     * @emits Highcharts.Axis#event:afterSetOptions
     */
    public setOptions(userOptions: DeepPartial<AxisOptions>): void {
        this.options = merge(
            AxisDefaults.defaultXAxisOptions,
            (this.coll === 'yAxis') && AxisDefaults.defaultYAxisOptions,
            [
                AxisDefaults.defaultTopAxisOptions,
                AxisDefaults.defaultRightAxisOptions,
                AxisDefaults.defaultBottomAxisOptions,
                AxisDefaults.defaultLeftAxisOptions
            ][this.side],
            merge(
                // if set in setOptions (#1053):
                defaultOptions[this.coll],
                userOptions
            )
        );

        fireEvent(this, 'afterSetOptions', { userOptions: userOptions });
    }

    /**
     * The default label formatter. The context is a special config object for
     * the label. In apps, use the
     * [labels.formatter](https://api.highcharts.com/highcharts/xAxis.labels.formatter)
     * instead, except when a modification is needed.
     *
     * @function Highcharts.Axis#defaultLabelFormatter
     *
     * @param {Highcharts.AxisLabelsFormatterContextObject} this
     * Formatter context of axis label.
     *
     * @param {Highcharts.AxisLabelsFormatterContextObject} [ctx]
     * Formatter context of axis label.
     *
     * @return {string}
     * The formatted label content.
     */
    public defaultLabelFormatter(
        this: AxisLabelFormatterContextObject,
        ctx?: AxisLabelFormatterContextObject
    ): string {
        const axis = this.axis,
            chart = this.chart,
            { numberFormatter } = chart,
            value = isNumber(this.value) ? this.value : NaN,
            time = axis.chart.time,
            categories = axis.categories,
            dateTimeLabelFormat = this.dateTimeLabelFormat,
            lang = defaultOptions.lang,
            numericSymbols = lang.numericSymbols,
            numSymMagnitude = lang.numericSymbolMagnitude || 1000,
            // make sure the same symbol is added for all labels on a linear
            // axis
            numericSymbolDetector = axis.logarithmic ?
                Math.abs(value) :
                axis.tickInterval;

        let i = numericSymbols && numericSymbols.length,
            multi,
            ret: (string|undefined);

        if (categories) {
            ret = `${this.value}`;

        } else if (dateTimeLabelFormat) { // datetime axis
            ret = time.dateFormat(dateTimeLabelFormat, value);

        } else if (i && numericSymbolDetector >= 1000) {
            // Decide whether we should add a numeric symbol like k (thousands)
            // or M (millions). If we are to enable this in tooltip or other
            // places as well, we can move this logic to the numberFormatter and
            // enable it by a parameter.
            while (i-- && typeof ret === 'undefined') {
                multi = Math.pow(numSymMagnitude, i + 1);
                if (
                    // Only accept a numeric symbol when the distance is more
                    // than a full unit. So for example if the symbol is k, we
                    // don't accept numbers like 0.5k.
                    numericSymbolDetector >= multi &&
                    // Accept one decimal before the symbol. Accepts 0.5k but
                    // not 0.25k. How does this work with the previous?
                    (value * 10) % multi === 0 &&
                    numericSymbols[i] !== null &&
                    value !== 0
                ) { // #5480
                    ret = numberFormatter(
                        value / multi, -1
                    ) + numericSymbols[i];
                }
            }
        }

        if (typeof ret === 'undefined') {
            if (Math.abs(value) >= 10000) { // add thousands separators
                ret = numberFormatter(value, -1);
            } else { // small numbers
                ret = numberFormatter(value, -1, void 0, ''); // #2466
            }
        }

        return ret;
    }

    /**
     * Get the minimum and maximum for the series of each axis. The function
     * analyzes the axis series and updates `this.dataMin` and `this.dataMax`.
     *
     * @private
     * @function Highcharts.Axis#getSeriesExtremes
     *
     * @emits Highcharts.Axis#event:afterGetSeriesExtremes
     * @emits Highcharts.Axis#event:getSeriesExtremes
     */
    public getSeriesExtremes(): void {
        const axis = this,
            chart = axis.chart;

        let xExtremes;

        fireEvent(this, 'getSeriesExtremes', null as any, function (): void {

            axis.hasVisibleSeries = false;

            // Reset properties in case we're redrawing (#3353)
            axis.dataMin = axis.dataMax = axis.threshold = null as any;
            axis.softThreshold = !axis.isXAxis;

            // Loop through this axis' series
            axis.series.forEach(function (series): void {

                if (
                    series.visible ||
                    !chart.options.chart.ignoreHiddenSeries
                ) {

                    const seriesOptions = series.options;

                    let xData,
                        threshold = seriesOptions.threshold,
                        seriesDataMin: number,
                        seriesDataMax: number;

                    axis.hasVisibleSeries = true;

                    // Validate threshold in logarithmic axes
                    if (axis.positiveValuesOnly && (threshold as any) <= 0) {
                        threshold = null as any;
                    }

                    // Get dataMin and dataMax for X axes
                    if (axis.isXAxis) {
                        xData = series.xData;
                        if (xData && xData.length) {
                            xData = axis.logarithmic ?
                                xData.filter((x): boolean => x > 0) :
                                xData;

                            xExtremes = series.getXExtremes(xData);
                            // If xData contains values which is not numbers,
                            // then filter them out. To prevent performance hit,
                            // we only do this after we have already found
                            // seriesDataMin because in most cases all data is
                            // valid. #5234.
                            seriesDataMin = xExtremes.min;
                            seriesDataMax = xExtremes.max;

                            if (
                                !isNumber(seriesDataMin) &&
                                // #5010:
                                !((seriesDataMin as any) instanceof Date)
                            ) {
                                xData = xData.filter(isNumber);
                                xExtremes = series.getXExtremes(xData);
                                // Do it again with valid data
                                seriesDataMin = xExtremes.min;
                                seriesDataMax = xExtremes.max;
                            }

                            if (xData.length) {
                                axis.dataMin = Math.min(
                                    pick(axis.dataMin, seriesDataMin),
                                    seriesDataMin
                                );
                                axis.dataMax = Math.max(
                                    pick(axis.dataMax, seriesDataMax),
                                    seriesDataMax
                                );
                            }
                        }

                    // Get dataMin and dataMax for Y axes, as well as handle
                    // stacking and processed data
                    } else {

                        // Get this particular series extremes
                        const dataExtremes = series.applyExtremes();

                        // Get the dataMin and dataMax so far. If percentage is
                        // used, the min and max are always 0 and 100. If
                        // seriesDataMin and seriesDataMax is null, then series
                        // doesn't have active y data, we continue with nulls
                        if (isNumber(dataExtremes.dataMin)) {
                            seriesDataMin = dataExtremes.dataMin;
                            axis.dataMin = Math.min(
                                pick(axis.dataMin, seriesDataMin),
                                seriesDataMin
                            );
                        }
                        if (isNumber(dataExtremes.dataMax)) {
                            seriesDataMax = dataExtremes.dataMax;
                            axis.dataMax = Math.max(
                                pick(axis.dataMax, seriesDataMax),
                                seriesDataMax
                            );
                        }

                        // Adjust to threshold
                        if (defined(threshold)) {
                            axis.threshold = threshold;
                        }
                        // If any series has a hard threshold, it takes
                        // precedence
                        if (
                            !seriesOptions.softThreshold ||
                            axis.positiveValuesOnly
                        ) {
                            axis.softThreshold = false;
                        }
                    }
                }
            });
        });
        fireEvent(this, 'afterGetSeriesExtremes');
    }

    /**
     * Translate from axis value to pixel position on the chart, or back. Use
     * the `toPixels` and `toValue` functions in applications.
     *
     * @private
     * @function Highcharts.Axis#translate
     */
    public translate(
        val: number,
        backwards?: boolean,
        cvsCoord?: boolean,
        old?: boolean,
        handleLog?: boolean,
        pointPlacement?: number
    ): number {
        const axis = (this.linkedParent || this), // #1417
            localMin = (old && axis.old ? axis.old.min : axis.min);

        if (!isNumber(localMin)) {
            return NaN;
        }

        const minPixelPadding = axis.minPixelPadding,
            doPostTranslate = (
                axis.isOrdinal ||
                axis.brokenAxis && axis.brokenAxis.hasBreaks ||
                (axis.logarithmic && handleLog)
            ) && axis.lin2val;

        let sign = 1,
            cvsOffset = 0,
            localA = old && axis.old ? axis.old.transA : axis.transA,
            returnValue = 0;

        if (!localA) {
            localA = axis.transA;
        }

        // In vertical axes, the canvas coordinates start from 0 at the top like
        // in SVG.
        if (cvsCoord) {
            sign *= -1; // canvas coordinates inverts the value
            cvsOffset = axis.len;
        }

        // Handle reversed axis
        if (axis.reversed) {
            sign *= -1;
            cvsOffset -= sign * (axis.sector || axis.len);
        }

        // From pixels to value
        if (backwards) { // reverse translation

            val = val * sign + cvsOffset;
            val -= minPixelPadding;
            // from chart pixel to value:
            returnValue = val / localA + localMin;
            if (doPostTranslate) { // log, ordinal and broken axis
                returnValue = axis.lin2val(returnValue);
            }

        // From value to pixels
        } else {
            if (doPostTranslate) { // log, ordinal and broken axis
                val = axis.val2lin(val);
            }
            const value = sign * (val - localMin) * localA;

            returnValue = (!axis.isRadial ? correctFloat(value) : value) +
                cvsOffset +
                (sign * minPixelPadding) +
                (isNumber(pointPlacement) ? localA * pointPlacement : 0);
        }

        return returnValue;
    }

    /**
     * Translate a value in terms of axis units into pixels within the chart.
     *
     * @function Highcharts.Axis#toPixels
     *
     * @param {number} value
     * A value in terms of axis units.
     *
     * @param {boolean} paneCoordinates
     * Whether to return the pixel coordinate relative to the chart or just the
     * axis/pane itself.
     *
     * @return {number}
     * Pixel position of the value on the chart or axis.
     */
    public toPixels(
        value: number,
        paneCoordinates?: boolean
    ): number {
        return this.translate(value, false, !this.horiz, void 0, true) +
            (paneCoordinates ? 0 : this.pos);
    }

    /**
     * Translate a pixel position along the axis to a value in terms of axis
     * units.
     *
     * @function Highcharts.Axis#toValue
     *
     * @param {number} pixel
     * The pixel value coordinate.
     *
     * @param {boolean} [paneCoordinates=false]
     * Whether the input pixel is relative to the chart or just the axis/pane
     * itself.
     *
     * @return {number}
     * The axis value.
     */
    public toValue(
        pixel: number,
        paneCoordinates?: boolean
    ): number {
        return this.translate(
            pixel - (paneCoordinates ? 0 : this.pos as any),
            true,
            !this.horiz,
            void 0,
            true
        );
    }

    /**
     * Create the path for a plot line that goes from the given value on
     * this axis, across the plot to the opposite side. Also used internally for
     * grid lines and crosshairs.
     *
     * @function Highcharts.Axis#getPlotLinePath
     *
     * @param {Highcharts.AxisPlotLinePathOptionsObject} options
     * Options for the path.
     *
     * @return {Highcharts.SVGPathArray|null}
     * The SVG path definition for the plot line.
     */
    public getPlotLinePath(options: Axis.PlotLinePathOptions): (SVGPath|null) {
        const axis = this,
            chart = axis.chart,
            axisLeft = axis.left,
            axisTop = axis.top,
            old = options.old,
            value = options.value,
            lineWidth = options.lineWidth,
            cHeight = (old && chart.oldChartHeight) || chart.chartHeight,
            cWidth = (old && chart.oldChartWidth) || chart.chartWidth,
            transB = axis.transB;

        let translatedValue = options.translatedValue,
            force = options.force,
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            skip: boolean;

        // eslint-disable-next-line valid-jsdoc
        /**
         * Check if x is between a and b. If not, either move to a/b
         * or skip, depending on the force parameter.
         * @private
         */
        function between(x: number, a: number, b: number): number {
            if (force !== 'pass' && (x < a || x > b)) {
                if (force) {
                    x = clamp(x, a, b);
                } else {
                    skip = true;
                }
            }
            return x;
        }

        const evt: Partial<Axis.PlotLinePathOptions> = {
            value: value,
            lineWidth: lineWidth,
            old: old,
            force: force,
            acrossPanes: options.acrossPanes,
            translatedValue: translatedValue
        };
        fireEvent(this, 'getPlotLinePath', evt, function (
            e:(Axis.PlotLinePathOptions)
        ): void {

            translatedValue = pick(
                translatedValue,
                axis.translate(value as number, void 0, void 0, old)
            );
            // Keep the translated value within sane bounds, and avoid Infinity
            // to fail the isNumber test (#7709).
            translatedValue = clamp(translatedValue, -1e5, 1e5);


            x1 = x2 = Math.round(translatedValue + transB);
            y1 = y2 = Math.round(cHeight - translatedValue - transB);
            if (!isNumber(translatedValue)) { // no min or max
                skip = true;
                force = false; // #7175, don't force it when path is invalid
            } else if (axis.horiz) {
                y1 = axisTop;
                y2 = cHeight - axis.bottom;

                x1 = x2 = between(x1, axisLeft, axisLeft + axis.width);

            } else {
                x1 = axisLeft;
                x2 = cWidth - axis.right;

                y1 = y2 = between(y1, axisTop, axisTop + axis.height);
            }
            (e as any).path = skip && !force ?
                null :
                chart.renderer.crispLine(
                    [['M', x1, y1], ['L', x2, y2]],
                    lineWidth || 1
                );
        });

        return (evt as any).path;
    }

    /**
     * Internal function to get the tick positions of a linear axis to round
     * values like whole tens or every five.
     *
     * @function Highcharts.Axis#getLinearTickPositions
     *
     * @param {number} tickInterval
     * The normalized tick interval.
     *
     * @param {number} min
     * Axis minimum.
     *
     * @param {number} max
     * Axis maximum.
     *
     * @return {Array<number>}
     * An array of axis values where ticks should be placed.
     */
    public getLinearTickPositions(
        tickInterval: number,
        min: number,
        max: number
    ): Array<number> {
        const roundedMin = correctFloat(
                Math.floor(min / tickInterval) * tickInterval
            ),
            roundedMax = correctFloat(
                Math.ceil(max / tickInterval) * tickInterval
            ),
            tickPositions = [];

        let pos,
            lastPos,
            precision;

        // When the precision is higher than what we filter out in
        // correctFloat, skip it (#6183).
        if (correctFloat(roundedMin + tickInterval) === roundedMin) {
            precision = 20;
        }

        // For single points, add a tick regardless of the relative position
        // (#2662, #6274)
        if (this.single) {
            return [min];
        }

        // Populate the intermediate values
        pos = roundedMin;
        while (pos <= roundedMax) {

            // Place the tick on the rounded value
            tickPositions.push(pos);

            // Always add the raw tickInterval, not the corrected one.
            pos = correctFloat(
                pos + tickInterval,
                precision
            );

            // If the interval is not big enough in the current min - max range
            // to actually increase the loop variable, we need to break out to
            // prevent endless loop. Issue #619
            if (pos === lastPos) {
                break;
            }

            // Record the last value
            lastPos = pos;
        }
        return tickPositions;
    }

    /**
     * Resolve the new minorTicks/minorTickInterval options into the legacy
     * loosely typed minorTickInterval option.
     *
     * @function Highcharts.Axis#getMinorTickInterval
     *
     * @return {number|"auto"|null}
     * Legacy option
     */
    public getMinorTickInterval(): ('auto'|null|number) {
        const options = this.options;

        if (options.minorTicks === true) {
            return pick(options.minorTickInterval, 'auto');
        }
        if (options.minorTicks === false) {
            return null;
        }
        return options.minorTickInterval as any;
    }

    /**
     * Internal function to return the minor tick positions. For logarithmic
     * axes, the same logic as for major ticks is reused.
     *
     * @function Highcharts.Axis#getMinorTickPositions
     *
     * @return {Array<number>}
     * An array of axis values where ticks should be placed.
     */
    public getMinorTickPositions(): Array<number> {
        const axis = this,
            options = axis.options,
            tickPositions = axis.tickPositions,
            minorTickInterval = axis.minorTickInterval,
            pointRangePadding = axis.pointRangePadding || 0,
            min = (axis.min as any) - pointRangePadding, // #1498
            max = (axis.max as any) + pointRangePadding, // #1498
            range = max - min;

        let minorTickPositions = [] as Array<number>,
            pos: number;

        // If minor ticks get too dense, they are hard to read, and may cause
        // long running script. So we don't draw them.
        if (range && range / minorTickInterval < axis.len / 3) { // #3875

            const logarithmic = axis.logarithmic;
            if (logarithmic) {
                // For each interval in the major ticks, compute the minor ticks
                // separately.
                this.paddedTicks.forEach(function (
                    _pos: number,
                    i: number,
                    paddedTicks: Array<number>
                ): void {
                    if (i) {
                        minorTickPositions.push.apply(
                            minorTickPositions,
                            logarithmic.getLogTickPositions(
                                minorTickInterval,
                                paddedTicks[i - 1],
                                paddedTicks[i],
                                true
                            )
                        );
                    }
                });

            } else if (
                axis.dateTime &&
                this.getMinorTickInterval() === 'auto'
            ) { // #1314
                minorTickPositions = minorTickPositions.concat(
                    axis.getTimeTicks(
                        axis.dateTime.normalizeTimeTickInterval(
                            minorTickInterval
                        ),
                        min,
                        max,
                        options.startOfWeek
                    )
                );
            } else {
                for (
                    pos = min + (tickPositions[0] - min) % minorTickInterval;
                    pos <= max;
                    pos += minorTickInterval
                ) {
                    // Very, very, tight grid lines (#5771)
                    if (pos === minorTickPositions[0]) {
                        break;
                    }
                    minorTickPositions.push(pos);
                }
            }
        }

        if (minorTickPositions.length !== 0) {
            axis.trimTicks(minorTickPositions); // #3652 #3743 #1498 #6330
        }
        return minorTickPositions;
    }

    /**
     * Adjust the min and max for the minimum range. Keep in mind that the
     * series data is not yet processed, so we don't have information on data
     * cropping and grouping, or updated `axis.pointRange` or
     * `series.pointRange`. The data can't be processed until we have finally
     * established min and max.
     *
     * @private
     * @function Highcharts.Axis#adjustForMinRange
     */
    public adjustForMinRange(): void {
        const axis = this,
            options = axis.options,
            logarithmic = axis.logarithmic;

        let min = axis.min,
            max = axis.max,
            zoomOffset,
            spaceAvailable: boolean,
            closestDataRange: number,
            minArgs: Array<(number|null|undefined)>,
            maxArgs: Array<(number|null|undefined)>,
            minRange;

        // Set the automatic minimum range based on the closest point distance
        if (
            axis.isXAxis &&
            typeof axis.minRange === 'undefined' &&
            !logarithmic
        ) {

            if (
                defined(options.min) ||
                defined(options.max) ||
                defined(options.floor) ||
                defined(options.ceiling)
            ) {
                axis.minRange = null; // don't do this again

            } else {

                // Find the closest distance between raw data points, as opposed
                // to closestPointRange that applies to processed points
                // (cropped and grouped)
                closestDataRange = getClosestDistance(
                    axis.series.map((s): number[] =>
                        // If xIncrement, we only need to measure the two first
                        // points to get the distance. Saves processing time.
                        (s.xIncrement ? s.xData?.slice(0, 2) : s.xData) || []
                    )
                ) || 0;

                axis.minRange = Math.min(
                    closestDataRange * 5,
                    (axis.dataMax as any) - (axis.dataMin as any)
                );
            }
        }

        // if minRange is exceeded, adjust
        if ((max as any) - (min as any) < (axis.minRange as any)) {

            spaceAvailable =
                (axis.dataMax as any) - (axis.dataMin as any) >=
                (axis.minRange as any);
            minRange = axis.minRange;
            zoomOffset = ((minRange as any) - (max as any) + (min as any)) / 2;

            // if min and max options have been set, don't go beyond it
            minArgs = [
                (min as any) - zoomOffset,
                pick(options.min, (min as any) - zoomOffset)
            ];
            // If space is available, stay within the data range
            if (spaceAvailable) {
                minArgs[2] = logarithmic ?
                    logarithmic.log2lin(axis.dataMin as any) :
                    axis.dataMin;
            }
            min = arrayMax(minArgs);

            maxArgs = [
                min + (minRange as any),
                pick(options.max, min + (minRange as any))
            ];
            // If space is availabe, stay within the data range
            if (spaceAvailable) {
                maxArgs[2] = logarithmic ?
                    logarithmic.log2lin(axis.dataMax as any) :
                    axis.dataMax;
            }

            max = arrayMin(maxArgs);

            // now if the max is adjusted, adjust the min back
            if (max - min < (minRange as any)) {
                minArgs[0] = max - (minRange as any);
                minArgs[1] = pick(options.min, max - (minRange as any));
                min = arrayMax(minArgs);
            }

            // Record modified extremes
            axis.min = min;
            axis.max = max;

            // #15975: Adjust user extremes as well to avoid re-adjusting when
            // the range between user extremes is smaller than minRange but the
            // extremes have already been adjusted
            if (isNumber(axis.userMin) && isNumber(axis.userMax)) {
                axis.userMin = min;
                axis.userMax = max;
            }
        }
    }

    /**
     * Find the closestPointRange across all series, including the single data
     * series.
     *
     * @private
     * @function Highcharts.Axis#getClosest
     */
    public getClosest(): number | undefined {
        let closestSingleDistance: number | undefined,
            closestDistance: number | undefined;

        if (this.categories) {
            closestDistance = 1;
        } else {
            const singleXs: number[] = [];
            this.series.forEach(function (series): void {
                const seriesClosest = series.closestPointRange,
                    visible = series.visible ||
                        !series.chart.options.chart.ignoreHiddenSeries;

                if (series.xData?.length === 1) {
                    singleXs.push(series.xData[0]);
                } else if (
                    !series.noSharedTooltip &&
                    defined(seriesClosest) &&
                    visible
                ) {
                    closestDistance = defined(closestDistance) ?
                        Math.min(closestDistance, seriesClosest) :
                        seriesClosest;
                }
            });
            if (singleXs.length) {
                singleXs.sort((a, b): number => a - b);
                closestSingleDistance = getClosestDistance([singleXs]);
            }
        }

        if (closestSingleDistance && closestDistance) {
            return Math.min(closestSingleDistance, closestDistance);
        }
        return closestSingleDistance || closestDistance;
    }

    /**
     * When a point name is given and no x, search for the name in the existing
     * categories, or if categories aren't provided, search names or create a
     * new category (#2522).
     *
     * @private
     * @function Highcharts.Axis#nameToX
     *
     * @param {Highcharts.Point} point
     * The point to inspect.
     *
     * @return {number}
     * The X value that the point is given.
     */
    public nameToX(point: Point): number {
        const explicitCategories = isArray(this.options.categories),
            names = explicitCategories ? this.categories : this.names;

        let nameX = point.options.x,
            x: (number|undefined);

        point.series.requireSorting = false;

        if (!defined(nameX)) {
            nameX = this.options.uniqueNames && names ?
                (
                    explicitCategories ?
                        names.indexOf(point.name) :
                        pick((names as any).keys[point.name], -1)

                ) :
                point.series.autoIncrement();
        }
        if (nameX === -1) { // Not found in currenct categories
            if (!explicitCategories && names) {
                x = names.length;
            }
        } else {
            x = nameX;
        }

        // Write the last point's name to the names array
        if (typeof x !== 'undefined') {
            this.names[x] = point.name as any;
            // Backwards mapping is much faster than array searching (#7725)
            (this.names as any).keys[point.name as any] = x;
        } else if (point.x) {
            x = point.x; // #17438
        }

        return x as any;
    }

    /**
     * When changes have been done to series data, update the axis.names.
     *
     * @private
     * @function Highcharts.Axis#updateNames
     */
    public updateNames(): void {
        const axis = this,
            names = this.names,
            i = names.length;

        if (i > 0) {
            Object.keys((names as any).keys).forEach(function (
                key: string
            ): void {
                delete ((names as any).keys)[key];
            });
            names.length = 0;

            this.minRange = this.userMinRange; // Reset
            (this.series || []).forEach(function (series): void {

                // Reset incrementer (#5928)
                series.xIncrement = null;

                // When adding a series, points are not yet generated
                if (!series.points || series.isDirtyData) {
                    // When we're updating the series with data that is longer
                    // than it was, and cropThreshold is passed, we need to make
                    // sure that the axis.max is increased _before_ running the
                    // premature processData. Otherwise this early iteration of
                    // processData will crop the points to axis.max, and the
                    // names array will be too short (#5857).
                    axis.max = Math.max(
                        (axis.max as any), (series.xData as any).length - 1
                    );

                    series.processData();
                    series.generatePoints();
                }

                series.data.forEach(function (
                    point: Point,
                    i: number
                ): void { // #9487
                    let x;

                    if (
                        point &&
                        point.options &&
                        typeof point.name !== 'undefined' // #9562
                    ) {
                        x = axis.nameToX(point);
                        if (typeof x !== 'undefined' && x !== point.x) {
                            point.x = x;
                            (series.xData as any)[i] = x;
                        }
                    }
                });
            });
        }
    }

    /**
     * Update translation information.
     *
     * @private
     * @function Highcharts.Axis#setAxisTranslation
     *
     * @emits Highcharts.Axis#event:afterSetAxisTranslation
     */
    public setAxisTranslation(): void {
        const axis = this,
            range = (axis.max as any) - (axis.min as any),
            linkedParent = axis.linkedParent,
            hasCategories = !!axis.categories,
            isXAxis = axis.isXAxis;

        let pointRange = axis.axisPointRange || 0,
            closestPointRange: number | undefined,
            minPointOffset = 0,
            pointRangePadding = 0,
            ordinalCorrection,
            transA = axis.transA;

        // Adjust translation for padding. Y axis with categories need to go
        // through the same (#1784).
        if (isXAxis || hasCategories || pointRange) {

            // Get the closest points
            closestPointRange = axis.getClosest();

            if (linkedParent) {
                minPointOffset = linkedParent.minPointOffset as any;
                pointRangePadding = linkedParent.pointRangePadding;
            } else {
                axis.series.forEach(function (series): void {
                    const seriesPointRange = hasCategories ?
                            1 :
                            (
                                isXAxis ?
                                    pick(
                                        series.options.pointRange,
                                        closestPointRange,
                                        0
                                    ) :
                                    (axis.axisPointRange || 0)
                            ), // #2806
                        pointPlacement = series.options.pointPlacement;

                    pointRange = Math.max(pointRange, seriesPointRange);

                    if (!axis.single || hasCategories) {
                        // TODO: series should internally set x- and y-
                        // pointPlacement to simplify this logic.
                        const isPointPlacementAxis = series.is('xrange') ?
                            !isXAxis :
                            isXAxis;

                        // minPointOffset is the value padding to the left of
                        // the axis in order to make room for points with a
                        // pointRange, typically columns. When the
                        // pointPlacement option is 'between' or 'on', this
                        // padding does not apply.
                        minPointOffset = Math.max(
                            minPointOffset,
                            isPointPlacementAxis && isString(pointPlacement) ?
                                0 :
                                seriesPointRange / 2
                        );

                        // Determine the total padding needed to the length of
                        // the axis to make room for the pointRange. If the
                        // series' pointPlacement is 'on', no padding is added.
                        pointRangePadding = Math.max(
                            pointRangePadding,
                            isPointPlacementAxis && pointPlacement === 'on' ?
                                0 :
                                seriesPointRange
                        );
                    }
                });
            }

            // Record minPointOffset and pointRangePadding
            ordinalCorrection = (
                axis.ordinal && axis.ordinal.slope && closestPointRange
            ) ?
                axis.ordinal.slope / closestPointRange :
                1; // #988, #1853
            axis.minPointOffset = minPointOffset =
                minPointOffset * ordinalCorrection;
            axis.pointRangePadding =
                pointRangePadding = pointRangePadding * ordinalCorrection;

            // pointRange means the width reserved for each point, like in a
            // column chart
            axis.pointRange = Math.min(
                pointRange,
                axis.single && hasCategories ? 1 : range
            );

            // closestPointRange means the closest distance between points. In
            // columns it is mostly equal to pointRange, but in lines pointRange
            // is 0 while closestPointRange is some other value
            if (isXAxis && closestPointRange) {
                axis.closestPointRange = closestPointRange;
            }
        }

        // Secondary values
        axis.translationSlope = axis.transA = transA =
            axis.staticScale ||
            axis.len / ((range + pointRangePadding) || 1);

        // Translation addend
        axis.transB = axis.horiz ? axis.left : axis.bottom;
        axis.minPixelPadding = transA * minPointOffset;

        fireEvent(this, 'afterSetAxisTranslation');
    }

    /**
     * @private
     * @function Highcharts.Axis#minFromRange
     */
    public minFromRange(): (number|undefined) {
        const axis = this;
        return (axis.max as any) - (axis.range as any);
    }

    /**
     * Set the tick positions to round values and optionally extend the extremes
     * to the nearest tick.
     *
     * @private
     * @function Highcharts.Axis#setTickInterval
     *
     * @param {boolean} secondPass
     * TO-DO: parameter description
     *
     * @emits Highcharts.Axis#event:foundExtremes
     */
    public setTickInterval(secondPass?: boolean): void {
        const axis = this,
            chart = axis.chart,
            log = axis.logarithmic,
            options = axis.options,
            isXAxis = axis.isXAxis,
            isLinked = axis.isLinked,
            tickPixelIntervalOption = options.tickPixelInterval,
            categories = axis.categories,
            softThreshold = axis.softThreshold;

        let maxPadding = options.maxPadding,
            minPadding = options.minPadding,
            length,
            linkedParentExtremes,
            // Only non-negative tickInterval is valid, #12961
            tickIntervalOption =
                isNumber(options.tickInterval) && options.tickInterval >= 0 ?
                    options.tickInterval : void 0,
            threshold = isNumber(axis.threshold) ? axis.threshold : null,
            thresholdMin,
            thresholdMax,
            hardMin,
            hardMax;

        if (!axis.dateTime && !categories && !isLinked) {
            this.getTickAmount();
        }

        // Min or max set either by zooming/setExtremes or initial options
        hardMin = pick(axis.userMin, options.min);
        hardMax = pick(axis.userMax, options.max);

        // Linked axis gets the extremes from the parent axis
        if (isLinked) {
            axis.linkedParent = (chart as any)[axis.coll][
                options.linkedTo as any
            ];
            linkedParentExtremes = (axis.linkedParent as any).getExtremes();
            axis.min = pick(
                linkedParentExtremes.min,
                linkedParentExtremes.dataMin
            );
            axis.max = pick(
                linkedParentExtremes.max,
                linkedParentExtremes.dataMax
            );
            if (options.type !== (axis.linkedParent as any).options.type) {
                // Can't link axes of different type
                error(11, 1 as any, chart);
            }

        // Initial min and max from the extreme data values
        } else {

            // Adjust to hard threshold
            if (softThreshold && defined(threshold)) {
                if ((axis.dataMin as any) >= (threshold as any)) {
                    thresholdMin = threshold;
                    minPadding = 0;
                } else if ((axis.dataMax as any) <= (threshold as any)) {
                    thresholdMax = threshold;
                    maxPadding = 0;
                }
            }

            axis.min = pick(hardMin, thresholdMin, axis.dataMin as any);
            axis.max = pick(hardMax, thresholdMax, axis.dataMax as any);

        }

        if (log) {
            if (
                axis.positiveValuesOnly &&
                !secondPass &&
                Math.min(
                    axis.min as any, pick(axis.dataMin, axis.min as any)
                ) <= 0
            ) { // #978
                // Can't plot negative values on log axis
                error(10, 1 as any, chart);
            }
            // The correctFloat cures #934, float errors on full tens. But it
            // was too aggressive for #4360 because of conversion back to lin,
            // therefore use precision 15.
            axis.min = correctFloat(log.log2lin(axis.min as any), 16);
            axis.max = correctFloat(log.log2lin(axis.max as any), 16);
        }

        // handle zoomed range
        if (axis.range && defined(axis.max)) {
            // #618, #6773:
            axis.userMin = axis.min = hardMin =
                Math.max(axis.dataMin as any, axis.minFromRange() as any);
            axis.userMax = hardMax = axis.max as any;

            axis.range = null; // don't use it when running setExtremes
        }

        // Hook for Highcharts Stock Scroller.
        // Consider combining with beforePadding.
        fireEvent(axis, 'foundExtremes');

        // Hook for adjusting this.min and this.max. Used by bubble series.
        if (axis.beforePadding) {
            axis.beforePadding();
        }

        // Adjust min and max for the minimum range
        axis.adjustForMinRange();

        // Handle options for floor, ceiling, softMin and softMax (#6359)
        if (!isNumber(axis.userMin)) {
            if (
                isNumber(options.softMin) && options.softMin < (axis.min as any)
            ) {
                axis.min = hardMin = options.softMin; // #6894
            }
        }
        if (!isNumber(axis.userMax)) {
            if (
                isNumber(options.softMax) && options.softMax > (axis.max as any)
            ) {
                axis.max = hardMax = options.softMax; // #6894
            }
        }

        // Pad the values to get clear of the chart's edges. To avoid
        // tickInterval taking the padding into account, we do this after
        // computing tick interval (#1337).
        if (
            !categories &&
            !axis.axisPointRange &&
            !(axis.stacking && axis.stacking.usePercentage) &&
            !isLinked &&
            defined(axis.min) &&
            defined(axis.max)
        ) {
            length = axis.max - axis.min;
            if (length) {
                if (!defined(hardMin) && minPadding) {
                    axis.min -= length * minPadding;
                }
                if (!defined(hardMax) && maxPadding) {
                    axis.max += length * maxPadding;
                }
            }
        }

        if (!isNumber(axis.userMin) && isNumber(options.floor)) {
            axis.min = Math.max(axis.min as any, options.floor);
        }
        if (!isNumber(axis.userMax) && isNumber(options.ceiling)) {
            axis.max = Math.min(axis.max as any, options.ceiling);
        }

        // When the threshold is soft, adjust the extreme value only if the data
        // extreme and the padded extreme land on either side of the threshold.
        // For example, a series of [0, 1, 2, 3] would make the yAxis add a tick
        // for -1 because of the default minPadding and startOnTick options.
        // This is prevented by the softThreshold option.
        if (softThreshold && defined(axis.dataMin)) {
            threshold = threshold || (0 as any);
            if (
                !defined(hardMin) &&
                (axis.min as any) < (threshold as any) &&
                (axis.dataMin as any) >= (threshold as any)
            ) {
                axis.min = axis.options.minRange ?
                    Math.min(threshold as any, (axis.max as any) -
                    (axis.minRange as any)) :
                    (threshold as any);

            } else if (
                !defined(hardMax) &&
                (axis.max as any) > (threshold as any) &&
                (axis.dataMax as any) <= (threshold as any)
            ) {
                axis.max = axis.options.minRange ?
                    Math.max(threshold as any, (axis.min as any) +
                    (axis.minRange as any)) :
                    (threshold as any);
            }
        }

        // If min is bigger than highest, or if max less than lowest value, the
        // chart should not render points. (#14417)
        if (
            isNumber(axis.min) &&
            isNumber(axis.max) &&
            !this.chart.polar &&
            (axis.min > axis.max)
        ) {
            if (defined(axis.options.min)) {
                axis.max = axis.min;
            } else if (defined(axis.options.max)) {
                axis.min = axis.max;
            }
        }

        // get tickInterval
        if (
            axis.min === axis.max ||
            typeof axis.min === 'undefined' ||
            typeof axis.max === 'undefined'
        ) {
            axis.tickInterval = 1;

        } else if (
            isLinked &&
            axis.linkedParent &&
            !tickIntervalOption &&
            tickPixelIntervalOption ===
                axis.linkedParent.options.tickPixelInterval
        ) {
            axis.tickInterval = tickIntervalOption =
                axis.linkedParent.tickInterval;

        } else {
            axis.tickInterval = pick(
                tickIntervalOption,
                this.tickAmount ?
                    (((axis.max as any) - (axis.min as any)) /
                    Math.max(this.tickAmount - 1, 1)) :
                    void 0,
                // For categoried axis, 1 is default, for linear axis use
                // tickPix
                categories ?
                    1 :
                    // don't let it be more than the data range
                    ((axis.max as any) - (axis.min as any)) *
                    tickPixelIntervalOption /
                    Math.max(axis.len, tickPixelIntervalOption)
            );
        }

        // Now we're finished detecting min and max, crop and group series data.
        // This is in turn needed in order to find tick positions in ordinal
        // axes.
        if (isXAxis && !secondPass) {
            const hasExtremesChanged = axis.min !==
                (axis.old && axis.old.min) ||
                axis.max !== (axis.old && axis.old.max);

            // First process all series assigned to that axis.
            axis.series.forEach(function (series): void {
                // Allows filtering out points outside the plot area.
                series.forceCrop = (
                    series.forceCropping &&
                    series.forceCropping()
                );
                series.processData(hasExtremesChanged);
            });

            // Then apply grouping if needed. The hasExtremesChanged helps to
            // decide if the data grouping should be skipped in the further
            // calculations #16319.
            fireEvent(this, 'postProcessData', { hasExtremesChanged });
        }

        // set the translation factor used in translate function
        axis.setAxisTranslation();

        // hook for ordinal axes and radial axes
        fireEvent(this, 'initialAxisTranslation');

        // In column-like charts, don't cramp in more ticks than there are
        // points (#1943, #4184)
        if (axis.pointRange && !tickIntervalOption) {
            axis.tickInterval = Math.max(axis.pointRange, axis.tickInterval);
        }

        // Before normalizing the tick interval, handle minimum tick interval.
        // This applies only if tickInterval is not defined.
        const minTickInterval = pick(
            options.minTickInterval,
            // In datetime axes, don't go below the data interval, except when
            // there are scatter-like series involved (#13369).
            axis.dateTime &&
            !axis.series.some((s): boolean|undefined => s.noSharedTooltip) ?
                axis.closestPointRange : 0
        );
        if (!tickIntervalOption && axis.tickInterval < minTickInterval) {
            axis.tickInterval = minTickInterval;
        }

        // For linear axes, normalize the interval
        if (!axis.dateTime && !axis.logarithmic && !tickIntervalOption) {
            axis.tickInterval = getNormalizedTickInterval(
                axis,
                axis.tickInterval
            );
        }

        // Prevent ticks from getting so close that we can't draw the labels
        if (!this.tickAmount) {
            axis.tickInterval = axis.unsquish();
        }

        this.setTickPositions();
    }

    /**
     * Now we have computed the normalized tickInterval, get the tick positions.
     *
     * @private
     * @function Highcharts.Axis#setTickPositions
     *
     * @emits Highcharts.Axis#event:afterSetTickPositions
     */
    public setTickPositions(): void {
        const axis = this,
            options = this.options,
            tickPositionsOption = options.tickPositions,
            tickPositioner = options.tickPositioner,
            minorTickIntervalOption = this.getMinorTickInterval(),
            hasVerticalPanning = this.hasVerticalPanning(),
            isColorAxis = this.coll === 'colorAxis',
            startOnTick = (
                (isColorAxis || !hasVerticalPanning) && options.startOnTick
            ),
            endOnTick = (
                (isColorAxis || !hasVerticalPanning) && options.endOnTick
            );

        let tickPositions: TickPositionsArray = [],
            tickPositionerResult: TickPositionsArray|undefined;

        // Set the tickmarkOffset
        this.tickmarkOffset = (
            this.categories &&
            options.tickmarkPlacement === 'between' &&
            this.tickInterval === 1
        ) ? 0.5 : 0; // #3202


        // get minorTickInterval
        this.minorTickInterval =
            minorTickIntervalOption === 'auto' &&
            this.tickInterval ?
                this.tickInterval / options.minorTicksPerMajor :
                (minorTickIntervalOption as any);

        // When there is only one point, or all points have the same value on
        // this axis, then min and max are equal and tickPositions.length is 0
        // or 1. In this case, add some padding in order to center the point,
        // but leave it with one tick. #1337.
        this.single =
            this.min === this.max &&
            defined(this.min) &&
            !this.tickAmount &&
            (
                // Data is on integer (#6563)
                parseInt(this.min as any, 10) === this.min ||

                // Between integers and decimals are not allowed (#6274)
                options.allowDecimals !== false
            );

        /**
         * Contains the current positions that are laid out on the axis. The
         * positions are numbers in terms of axis values. In a category axis
         * they are integers, in a datetime axis they are also integers, but
         * designating milliseconds.
         *
         * This property is read only - for modifying the tick positions, use
         * the `tickPositioner` callback or [axis.tickPositions(
         * https://api.highcharts.com/highcharts/xAxis.tickPositions) option
         * instead.
         *
         * @name Highcharts.Axis#tickPositions
         * @type {Highcharts.AxisTickPositionsArray|undefined}
         */

        if (tickPositionsOption) {
            // Find the tick positions. Work on a copy (#1565)
            tickPositions = tickPositionsOption.slice();

        } else if (isNumber(this.min) && isNumber(this.max)) {

            // Too many ticks (#6405). Create a friendly warning and provide two
            // ticks so at least we can show the data series.
            if (
                (!axis.ordinal || !axis.ordinal.positions) &&
                (
                    (this.max - this.min) /
                    this.tickInterval >
                    Math.max(2 * this.len, 200)
                )
            ) {
                tickPositions = [this.min, this.max];
                error(19, false, this.chart);

            } else if (axis.dateTime) {
                tickPositions = axis.getTimeTicks(
                    axis.dateTime.normalizeTimeTickInterval(
                        this.tickInterval,
                        options.units
                    ),
                    this.min,
                    this.max,
                    options.startOfWeek,
                    axis.ordinal && axis.ordinal.positions,
                    this.closestPointRange,
                    true
                );
            } else if (axis.logarithmic) {
                tickPositions = axis.logarithmic.getLogTickPositions(
                    this.tickInterval,
                    this.min,
                    this.max
                );
            } else {
                const startingTickInterval = this.tickInterval;
                let adjustedTickInterval = startingTickInterval;
                while (adjustedTickInterval <= startingTickInterval * 2) {
                    tickPositions = this.getLinearTickPositions(
                        this.tickInterval,
                        this.min,
                        this.max
                    );

                    // If there are more tick positions than the set tickAmount,
                    // increase the tickInterval and continue until it fits.
                    // (#17100)
                    if (
                        this.tickAmount &&
                        tickPositions.length > this.tickAmount
                    ) {
                        this.tickInterval = getNormalizedTickInterval(
                            this,
                            adjustedTickInterval *= 1.1
                        );
                    } else {
                        break;
                    }
                }
            }

            // Too dense ticks, keep only the first and last (#4477)
            if (tickPositions.length > this.len) {
                tickPositions = [
                    tickPositions[0],
                    tickPositions[tickPositions.length - 1]
                ];
                // Reduce doubled value (#7339)
                if (tickPositions[0] === tickPositions[1]) {
                    tickPositions.length = 1;
                }
            }

            // Run the tick positioner callback, that allows modifying auto tick
            // positions.
            if (tickPositioner) {
                // Make it available to the positioner
                this.tickPositions = tickPositions;
                tickPositionerResult = tickPositioner.apply(
                    axis,
                    [this.min, this.max]
                );
                if (tickPositionerResult) {
                    tickPositions = tickPositionerResult;
                }
            }

        }
        this.tickPositions = tickPositions;


        // Reset min/max or remove extremes based on start/end on tick
        this.paddedTicks = tickPositions.slice(0); // Used for logarithmic minor
        this.trimTicks(tickPositions, startOnTick, endOnTick);
        if (!this.isLinked && isNumber(this.min) && isNumber(this.max)) {

            // Substract half a unit (#2619, #2846, #2515, #3390), but not in
            // case of multiple ticks (#6897)
            if (
                this.single &&
                tickPositions.length < 2 &&
                !this.categories &&
                !this.series.some((s): boolean =>
                    (s.is('heatmap') && s.options.pointPlacement === 'between')
                )
            ) {
                this.min -= 0.5;
                this.max += 0.5;
            }
            if (!tickPositionsOption && !tickPositionerResult) {
                this.adjustTickAmount();
            }
        }

        fireEvent(this, 'afterSetTickPositions');
    }

    /**
     * Handle startOnTick and endOnTick by either adapting to padding min/max or
     * rounded min/max. Also handle single data points.
     *
     * @private
     * @function Highcharts.Axis#trimTicks
     *
     * @param {Array<number>} tickPositions
     * TO-DO: parameter description
     *
     * @param {boolean} [startOnTick]
     * TO-DO: parameter description
     *
     * @param {boolean} [endOnTick]
     * TO-DO: parameter description
     */
    public trimTicks(
        tickPositions: Array<number>,
        startOnTick?: boolean,
        endOnTick?: boolean
    ): void {
        const roundedMin = tickPositions[0],
            roundedMax = tickPositions[tickPositions.length - 1],
            minPointOffset =
                (!this.isOrdinal && this.minPointOffset) || 0; // (#12716)

        fireEvent(this, 'trimTicks');

        if (!this.isLinked) {
            if (startOnTick && roundedMin !== -Infinity) { // #6502
                this.min = roundedMin;
            } else {
                while ((this.min as any) - minPointOffset > tickPositions[0]) {
                    tickPositions.shift();
                }
            }

            if (endOnTick) {
                this.max = roundedMax;
            } else {
                while ((this.max as any) + minPointOffset <
                        tickPositions[tickPositions.length - 1]) {
                    tickPositions.pop();
                }
            }

            // If no tick are left, set one tick in the middle (#3195)
            if (
                tickPositions.length === 0 &&
                defined(roundedMin) &&
                !this.options.tickPositions
            ) {
                tickPositions.push((roundedMax + roundedMin) / 2);
            }
        }
    }

    /**
     * Check if there are multiple axes in the same pane.
     *
     * @private
     * @function Highcharts.Axis#alignToOthers
     *
     * @return {boolean|undefined}
     * True if there are other axes.
     */
    public alignToOthers(): (boolean|undefined) {
        const axis = this,
            alignedAxes: Axis[] = [this],
            options = axis.options,
            alignThresholds = (
                this.coll === 'yAxis' &&
                this.chart.options.chart.alignThresholds
            ),
            thresholdAlignments: number[] = [];

        let hasOther: (boolean|undefined);
        axis.thresholdAlignment = void 0;
        if (
            (
                // Only if alignTicks or alignThresholds is true
                (
                    this.chart.options.chart.alignTicks !== false &&
                    options.alignTicks
                ) || (
                    alignThresholds
                )
            ) &&

            // Disabled when startOnTick or endOnTick are false (#7604)
            options.startOnTick !== false &&
            options.endOnTick !== false &&

            // Don't try to align ticks on a log axis, they are not evenly
            // spaced (#6021)
            !axis.logarithmic
        ) {

            // Get a key identifying which pane the axis belongs to
            const getKey = (axis: Axis): string => {
                const { horiz, options } = axis;
                return [
                    horiz ? options.left : options.top,
                    options.width,
                    options.height,
                    options.pane
                ].join(',');
            };

            const thisKey = getKey(this);
            this.chart[this.coll as 'xAxis'|'yAxis'].forEach(function (
                otherAxis: Axis
            ): void {
                const { series } = otherAxis;
                if (
                    // #4442
                    series.length &&
                    series.some((s): boolean => s.visible) &&
                    otherAxis !== axis &&
                    getKey(otherAxis) === thisKey
                ) {
                    hasOther = true; // #4201
                    alignedAxes.push(otherAxis);
                }
            });
        }

        if (hasOther && alignThresholds) {

            // Handle alignThresholds. The `thresholdAlignments` array keeps
            // records of where each axis in the group wants its threshold, from
            // 0 which is on `axis.min`, to 1 which is on `axis.max`.
            alignedAxes.forEach((otherAxis): void => {
                const threshAlign = otherAxis.getThresholdAlignment(axis);
                if (isNumber(threshAlign)) {
                    thresholdAlignments.push(threshAlign);
                }
            });

            // For each of the axes in the group, record the average
            // `thresholdAlignment`.
            const thresholdAlignment = thresholdAlignments.length > 1 ?
                thresholdAlignments.reduce(
                    (sum: number, n): number => (sum += n),
                    0
                ) / thresholdAlignments.length :
                void 0;

            alignedAxes.forEach((axis): void => {
                axis.thresholdAlignment = thresholdAlignment;
            });
        }

        return hasOther;
    }

    /**
     * Where the axis wants its threshold, from 0 which is on `axis.min`, to 1 which
     * is on `axis.max`.
     *
     * @private
     * @function Highcharts.Axis#getThresholdAlignment
     */
    public getThresholdAlignment(callerAxis: Axis): number|undefined {
        if (
            !isNumber(this.dataMin) ||
            (
                this !== callerAxis &&
                this.series.some((s): boolean|undefined => (
                    s.isDirty || s.isDirtyData
                ))
            )
        ) {
            this.getSeriesExtremes();
        }
        if (isNumber(this.threshold)) {
            let thresholdAlignment = clamp(
                (
                    (this.threshold - (this.dataMin || 0)) /
                    ((this.dataMax || 0) - (this.dataMin || 0))
                ),
                0,
                1
            );
            if (this.options.reversed) {
                thresholdAlignment = 1 - thresholdAlignment;
            }
            return thresholdAlignment;
        }
    }

    /**
     * Find the max ticks of either the x and y axis collection, and record it
     * in `this.tickAmount`.
     *
     * @private
     * @function Highcharts.Axis#getTickAmount
     */
    public getTickAmount(): void {
        const axis = this,
            options = this.options,
            tickPixelInterval = options.tickPixelInterval as any;

        let tickAmount = options.tickAmount;

        if (
            !defined(options.tickInterval) &&
            !tickAmount &&
            this.len < tickPixelInterval &&
            !this.isRadial &&
            !axis.logarithmic &&
            options.startOnTick &&
            options.endOnTick
        ) {
            tickAmount = 2;
        }

        if (!tickAmount && this.alignToOthers()) {
            // Add 1 because 4 tick intervals require 5 ticks (including first
            // and last)
            tickAmount = Math.ceil(this.len / (tickPixelInterval as any)) + 1;
        }

        // For tick amounts of 2 and 3, compute five ticks and remove the
        // intermediate ones. This prevents the axis from adding ticks that are
        // too far away from the data extremes.
        if ((tickAmount as any) < 4) {
            this.finalTickAmt = tickAmount;
            tickAmount = 5;
        }

        this.tickAmount = (tickAmount as any);
    }

    /**
     * When using multiple axes, adjust the number of ticks to match the highest
     * number of ticks in that group.
     *
     * @private
     * @function Highcharts.Axis#adjustTickAmount
     */
    public adjustTickAmount(): void {
        const axis = this,
            {
                finalTickAmt,
                max,
                min,
                options,
                tickPositions,
                tickAmount,
                thresholdAlignment
            } = axis,
            currentTickAmount = tickPositions && tickPositions.length,
            threshold = pick(axis.threshold, axis.softThreshold ? 0 : null);

        let len,
            i,
            tickInterval = axis.tickInterval,
            thresholdTickIndex: number|undefined;

        const
            // Extend the tickPositions by appending a position
            append = (): number => tickPositions.push(correctFloat(
                tickPositions[tickPositions.length - 1] +
                tickInterval
            )),

            // Extend the tickPositions by prepending a position
            prepend = (): number => tickPositions.unshift(correctFloat(
                tickPositions[0] - tickInterval
            ));

        // If `thresholdAlignment` is a number, it means the `alignThresholds`
        // option is true. The `thresholdAlignment` is a scalar value between 0
        // and 1 for where the threshold should be relative to `axis.min` and
        // `axis.max`. Now that we know the tick amount, convert this to the
        // tick index. Unless `thresholdAlignment` is exactly 0 or 1, avoid the
        // first or last tick because that would lead to series being clipped.
        if (isNumber(thresholdAlignment)) {
            thresholdTickIndex = thresholdAlignment < 0.5 ?
                Math.ceil(thresholdAlignment * (tickAmount - 1)) :
                Math.floor(thresholdAlignment * (tickAmount - 1));

            if (options.reversed) {
                thresholdTickIndex = tickAmount - 1 - thresholdTickIndex;
            }
        }

        if (axis.hasData() && isNumber(min) && isNumber(max)) { // #14769

            // Adjust extremes and translation to the modified tick positions
            const adjustExtremes = (): void => {
                axis.transA *= (currentTickAmount - 1) / (tickAmount - 1);

                // Do not crop when ticks are not extremes (#9841)
                axis.min = options.startOnTick ?
                    tickPositions[0] :
                    Math.min(min, tickPositions[0]);
                axis.max = options.endOnTick ?
                    tickPositions[tickPositions.length - 1] :
                    Math.max(
                        max,
                        tickPositions[tickPositions.length - 1]
                    );
            };

            // When the axis is subject to the alignThresholds option. Use
            // axis.threshold because the local threshold includes the
            // `softThreshold`.
            if (isNumber(thresholdTickIndex) && isNumber(axis.threshold)) {

                // Throw away the previously computed tickPositions and start
                // from scratch with only the threshold itself, then add ticks
                // below the threshold first, then fill up above the threshold.
                // If we are not able to fill up to axis.max, double the
                // tickInterval and run again.
                while (
                    tickPositions[thresholdTickIndex] !== threshold ||
                    tickPositions.length !== tickAmount ||
                    tickPositions[0] > min ||
                    tickPositions[tickPositions.length - 1] < max
                ) {
                    tickPositions.length = 0;
                    tickPositions.push(axis.threshold);

                    while (tickPositions.length < tickAmount) {

                        if (
                            // Start by prepending positions until the threshold
                            // is at the required index...
                            tickPositions[thresholdTickIndex] === void 0 ||
                            tickPositions[thresholdTickIndex] > axis.threshold
                        ) {
                            prepend();

                        } else {
                            // ... then append positions until we have the
                            // required length
                            append();

                        }
                    }

                    // Safety vent
                    if (tickInterval > axis.tickInterval * 8) {
                        break;
                    }

                    tickInterval *= 2;
                }

                adjustExtremes();

            } else if (currentTickAmount < tickAmount) {
                while (tickPositions.length < tickAmount) {

                    // Extend evenly for both sides unless we're on the
                    // threshold (#3965)
                    if (tickPositions.length % 2 || min === threshold) {
                        append();
                    } else {
                        prepend();
                    }
                }

                adjustExtremes();

            }

            // The finalTickAmt property is set in getTickAmount
            if (defined(finalTickAmt)) {
                i = len = tickPositions.length;
                while (i--) {
                    if (
                        // Remove every other tick
                        (finalTickAmt === 3 && i % 2 === 1) ||
                        // Remove all but first and last
                        ((finalTickAmt as any) <= 2 && i > 0 && i < len - 1)
                    ) {
                        tickPositions.splice(i, 1);
                    }
                }
                axis.finalTickAmt = void 0;
            }
        }
    }

    /**
     * Set the scale based on data min and max, user set min and max or options.
     *
     * @private
     * @function Highcharts.Axis#setScale
     *
     * @emits Highcharts.Axis#event:afterSetScale
     */
    public setScale(): void {
        const axis = this;

        let isDirtyData: (boolean|undefined) = false,
            isXAxisDirty = false;

        axis.series.forEach(function (series): void {
            isDirtyData = isDirtyData || series.isDirtyData || series.isDirty;

            // When x axis is dirty, we need new data extremes for y as
            // well:
            isXAxisDirty = (
                isXAxisDirty ||
                (series.xAxis && series.xAxis.isDirty) ||
                false
            );
        });

        // set the new axisLength
        axis.setAxisSize();
        const isDirtyAxisLength = axis.len !== (axis.old && axis.old.len);

        // do we really need to go through all this?
        if (
            isDirtyAxisLength ||
            isDirtyData ||
            isXAxisDirty ||
            axis.isLinked ||
            axis.forceRedraw ||
            axis.userMin !== (axis.old && axis.old.userMin) ||
            axis.userMax !== (axis.old && axis.old.userMax) ||
            axis.alignToOthers()
        ) {

            if (axis.stacking) {
                axis.stacking.resetStacks();
                axis.stacking.buildStacks();
            }

            axis.forceRedraw = false;

            // #18066 delete minRange property to ensure that it will be
            // calculated again after dirty data in series
            if (!axis.userMinRange) {
                axis.minRange = void 0;
            }

            // get data extremes if needed
            axis.getSeriesExtremes();

            // get fixed positions based on tickInterval
            axis.setTickInterval();

            // Mark as dirty if it is not already set to dirty and extremes have
            // changed. #595.
            if (!axis.isDirty) {
                axis.isDirty =
                    isDirtyAxisLength ||
                    axis.min !== (axis.old && axis.old.min) ||
                    axis.max !== (axis.old && axis.old.max);
            }
        } else if (axis.stacking) {
            axis.stacking.cleanStacks();
        }

        // Recalculate panning state object, when the data
        // has changed. It is required when vertical panning is enabled.
        if (isDirtyData && axis.panningState) {
            axis.panningState.isDirty = true;
        }

        fireEvent(this, 'afterSetScale');
    }

    /**
     * Set the minimum and maximum of the axes after render time. If the
     * `startOnTick` and `endOnTick` options are true, the minimum and maximum
     * values are rounded off to the nearest tick. To prevent this, these
     * options can be set to false before calling setExtremes. Also, setExtremes
     * will not allow a range lower than the `minRange` option, which by default
     * is the range of five points.
     *
     * @sample highcharts/members/axis-setextremes/
     *         Set extremes from a button
     * @sample highcharts/members/axis-setextremes-datetime/
     *         Set extremes on a datetime axis
     * @sample highcharts/members/axis-setextremes-off-ticks/
     *         Set extremes off ticks
     * @sample stock/members/axis-setextremes/
     *         Set extremes in Highcharts Stock
     *
     * @function Highcharts.Axis#setExtremes
     *
     * @param {number} [newMin]
     * The new minimum value.
     *
     * @param {number} [newMax]
     * The new maximum value.
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart or wait for an explicit call to
     * {@link Highcharts.Chart#redraw}
     *
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation=true]
     * Enable or modify animations.
     *
     * @param {*} [eventArguments]
     * Arguments to be accessed in event handler.
     *
     * @emits Highcharts.Axis#event:setExtremes
     */
    public setExtremes(
        newMin?: number,
        newMax?: number,
        redraw?: boolean,
        animation?: (boolean|Partial<AnimationOptions>),
        eventArguments?: any
    ): void {
        const axis = this,
            chart = axis.chart;

        redraw = pick(redraw, true); // defaults to true

        axis.series.forEach(function (serie): void {
            delete serie.kdTree;
        });

        // Extend the arguments with min and max
        eventArguments = extend(eventArguments, {
            min: newMin,
            max: newMax
        });

        // Fire the event
        fireEvent(axis, 'setExtremes', eventArguments, function (): void {

            axis.userMin = newMin;
            axis.userMax = newMax;
            axis.eventArgs = eventArguments;

            if (redraw) {
                chart.redraw(animation);
            }
        });
    }

    /**
     * Overridable method for zooming chart. Pulled out in a separate method to
     * allow overriding in stock charts.
     *
     * @private
     * @function Highcharts.Axis#zoom
     */
    public zoom(newMin: number, newMax: number): void {
        const axis = this,
            dataMin = this.dataMin,
            dataMax = this.dataMax,
            options = this.options,
            min = Math.min(dataMin as any, pick(options.min, dataMin as any)),
            max = Math.max(dataMax as any, pick(options.max, dataMax as any)),
            evt = {
                newMin: newMin,
                newMax: newMax
            } as AnyRecord;

        fireEvent(this, 'zoom', evt, function (e: AnyRecord): void {

            // Use e.newMin and e.newMax - event handlers may have altered them
            let newMin = e.newMin,
                newMax = e.newMax;

            if (newMin !== axis.min || newMax !== axis.max) { // #5790

                // Prevent pinch zooming out of range. Check for defined is for
                // #1946. #1734.
                if (!axis.allowZoomOutside) {
                    // #6014, sometimes newMax will be smaller than min (or
                    // newMin will be larger than max).
                    if (defined(dataMin)) {
                        if (newMin < min) {
                            newMin = min;
                        }
                        if (newMin > max) {
                            newMin = max;
                        }
                    }
                    if (defined(dataMax)) {
                        if (newMax < min) {
                            newMax = min;
                        }
                        if (newMax > max) {
                            newMax = max;
                        }
                    }
                }

                // In full view, displaying the reset zoom button is not
                // required
                axis.displayBtn = (
                    typeof newMin !== 'undefined' ||
                    typeof newMax !== 'undefined'
                );

                // Do it
                axis.setExtremes(
                    newMin,
                    newMax,
                    false,
                    void 0,
                    { trigger: 'zoom' }
                );
            }
            e.zoomed = true;
        });

        return evt.zoomed;
    }

    /**
     * Update the axis metrics.
     *
     * @private
     * @function Highcharts.Axis#setAxisSize
     */
    public setAxisSize(): void {
        const chart = this.chart,
            options = this.options,
            // [top, right, bottom, left]
            offsets = options.offsets || [0, 0, 0, 0],
            horiz = this.horiz,

            // Check for percentage based input values. Rounding fixes problems
            // with column overflow and plot line filtering (#4898, #4899)
            width = this.width = Math.round(relativeLength(
                pick(
                    options.width,
                    chart.plotWidth - offsets[3] + offsets[1]
                ),
                chart.plotWidth
            )),
            height = this.height = Math.round(relativeLength(
                pick(
                    options.height,
                    chart.plotHeight - offsets[0] + offsets[2]
                ),
                chart.plotHeight
            )),
            top = this.top = Math.round(relativeLength(
                pick(options.top, chart.plotTop + offsets[0]),
                chart.plotHeight,
                chart.plotTop
            )),
            left = this.left = Math.round(relativeLength(
                pick(options.left, chart.plotLeft + offsets[3]),
                chart.plotWidth,
                chart.plotLeft
            ));

        // Expose basic values to use in Series object and navigator
        this.bottom = (chart.chartHeight as any) - height - top;
        this.right = (chart.chartWidth as any) - width - left;

        // Direction agnostic properties
        this.len = Math.max(horiz ? width : height, 0); // Math.max fixes #905
        this.pos = horiz ? left : top; // distance from SVG origin
    }

    /**
     * Get the current extremes for the axis.
     *
     * @sample highcharts/members/axis-getextremes/
     *         Report extremes by click on a button
     *
     * @function Highcharts.Axis#getExtremes
     *
     * @return {Highcharts.ExtremesObject}
     * An object containing extremes information.
     */
    public getExtremes(): Axis.ExtremesObject {
        const axis = this,
            log = axis.logarithmic;

        return {
            min: log ?
                correctFloat(log.lin2log(axis.min as any)) :
                axis.min as any,
            max: log ?
                correctFloat(log.lin2log(axis.max as any)) :
                axis.max as any,
            dataMin: axis.dataMin as any,
            dataMax: axis.dataMax as any,
            userMin: axis.userMin,
            userMax: axis.userMax
        };
    }

    /**
     * Get the zero plane either based on zero or on the min or max value.
     * Used in bar and area plots.
     *
     * @function Highcharts.Axis#getThreshold
     *
     * @param {number} threshold
     * The threshold in axis values.
     *
     * @return {number}
     * The translated threshold position in terms of pixels, and corrected to
     * stay within the axis bounds.
     */
    public getThreshold(threshold: number): number {
        const axis = this,
            log = axis.logarithmic,
            realMin = log ? log.lin2log(axis.min as any) : axis.min as any,
            realMax = log ? log.lin2log(axis.max as any) : axis.max as any;

        if (threshold === null || threshold === -Infinity) {
            threshold = realMin;
        } else if (threshold === Infinity) {
            threshold = realMax;
        } else if (realMin > threshold) {
            threshold = realMin;
        } else if (realMax < threshold) {
            threshold = realMax;
        }

        return axis.translate(
            threshold, 0 as any, 1 as any, 0 as any, 1 as any
        );
    }

    /**
     * Compute auto alignment for the axis label based on which side the axis is
     * on and the given rotation for the label.
     *
     * @private
     * @function Highcharts.Axis#autoLabelAlign
     *
     * @param {number} rotation
     * The rotation in degrees as set by either the `rotation` or `autoRotation`
     * options.
     *
     * @return {Highcharts.AlignValue}
     * Can be `"center"`, `"left"` or `"right"`.
     */
    public autoLabelAlign(rotation: number): AlignValue {
        const angle = (pick(rotation, 0) - (this.side * 90) + 720) % 360,
            evt = { align: 'center' as AlignValue };

        fireEvent(this, 'autoLabelAlign', evt, function (
            e: AnyRecord
        ): void {

            if (angle > 15 && angle < 165) {
                e.align = 'right';
            } else if (angle > 195 && angle < 345) {
                e.align = 'left';
            }
        });

        return evt.align;
    }

    /**
     * Get the tick length and width for the axis based on axis options.
     *
     * @private
     * @function Highcharts.Axis#tickSize
     *
     * @param {string} [prefix]
     * 'tick' or 'minorTick'
     *
     * @return {Array<number,number>|undefined}
     * An array of tickLength and tickWidth
     */
    public tickSize(prefix?: string): [number, number]|undefined {
        const options = this.options,
            tickWidth = pick(
                options[prefix === 'tick' ? 'tickWidth' : 'minorTickWidth'],
                // Default to 1 on linear and datetime X axes
                prefix === 'tick' && this.isXAxis && !this.categories ? 1 : 0
            );

        let tickLength = options[
                prefix === 'tick' ? 'tickLength' : 'minorTickLength'
            ],
            tickSize: ([number, number]|undefined);

        if (tickWidth && tickLength) {
            // Negate the length
            if ((options as any)[prefix + 'Position'] === 'inside') {
                tickLength = -tickLength;
            }
            tickSize = [tickLength, tickWidth];
        }

        const e = { tickSize };
        fireEvent(this, 'afterTickSize', e);

        return e.tickSize;

    }

    /**
     * Return the size of the labels.
     *
     * @private
     * @function Highcharts.Axis#labelMetrics
     */
    public labelMetrics(): FontMetricsObject {
        const renderer = this.chart.renderer,
            ticks = this.ticks,
            tick = ticks[Object.keys(ticks)[0]] || {};

        return this.chart.renderer.fontMetrics(
            tick.label ||
            tick.movedLabel ||
            renderer.box
        );
    }

    /**
     * Prevent the ticks from getting so close we can't draw the labels. On a
     * horizontal axis, this is handled by rotating the labels, removing ticks
     * and adding ellipsis. On a vertical axis remove ticks and add ellipsis.
     *
     * @private
     * @function Highcharts.Axis#unsquish
     */
    public unsquish(): number {
        const labelOptions = this.options.labels,
            horiz = this.horiz,
            tickInterval = this.tickInterval,
            slotSize = this.len / (
                (
                    (this.categories ? 1 : 0) +
                    (this.max as any) -
                    (this.min as any)
                ) /
                tickInterval
            ),
            rotationOption = labelOptions.rotation,
            // We don't know the actual rendered line height at this point, but
            // it defaults to 0.75em
            lineHeight = this.labelMetrics().h * 0.75,
            range = Math.max((this.max as any) - (this.min as any), 0),
            // Return the multiple of tickInterval that is needed to avoid
            // collision
            getStep = function (spaceNeeded: number): number {
                let step = spaceNeeded / (slotSize || 1);

                step = step > 1 ? Math.ceil(step) : 1;

                // Guard for very small or negative angles (#9835)
                if (
                    step * tickInterval > range &&
                    spaceNeeded !== Infinity &&
                    slotSize !== Infinity &&
                    range
                ) {
                    step = Math.ceil(range / tickInterval);
                }

                return correctFloat(step * tickInterval);
            };

        let newTickInterval = tickInterval,
            rotation: (number|undefined),
            bestScore = Number.MAX_VALUE,
            autoRotation: (Array<number>|undefined);

        if (horiz) {
            if (!labelOptions.staggerLines) {
                if (isNumber(rotationOption)) {
                    autoRotation = [rotationOption];
                } else if (slotSize < labelOptions.autoRotationLimit) {
                    autoRotation = labelOptions.autoRotation;
                }
            }

            if (autoRotation) {
                let step,
                    score;


                // Loop over the given autoRotation options, and determine which
                // gives the best score. The best score is that with the lowest
                // number of steps and a rotation closest to horizontal.
                for (const rot of autoRotation) {
                    if (
                        rot === rotationOption ||
                        (rot && rot >= -90 && rot <= 90)
                    ) { // #3891

                        step = getStep(
                            Math.abs(lineHeight / Math.sin(deg2rad * rot))
                        );

                        score = step + Math.abs(rot / 360);

                        if (score < bestScore) {
                            bestScore = score;
                            rotation = rot;
                            newTickInterval = step;
                        }
                    }
                }
            }

        } else { // #4411
            newTickInterval = getStep(lineHeight);
        }

        this.autoRotation = autoRotation;
        this.labelRotation = pick(
            rotation,
            isNumber(rotationOption) ? rotationOption : 0
        );

        return labelOptions.step ? tickInterval : newTickInterval;
    }

    /**
     * Get the general slot width for labels/categories on this axis. This may
     * change between the pre-render (from Axis.getOffset) and the final tick
     * rendering and placement.
     *
     * @private
     * @function Highcharts.Axis#getSlotWidth
     *
     * @param {Highcharts.Tick} [tick] Optionally, calculate the slot width
     * basing on tick label. It is used in highcharts-3d module, where the slots
     * has different widths depending on perspective angles.
     *
     * @return {number}
     * The pixel width allocated to each axis label.
     */
    public getSlotWidth(tick?: Tick): number {
        // #5086, #1580, #1931
        const chart = this.chart,
            horiz = this.horiz,
            labelOptions = this.options.labels,
            slotCount = Math.max(
                this.tickPositions.length - (this.categories ? 0 : 1),
                1
            ),
            marginLeft = chart.margin[3];

        // Used by grid axis
        if (tick && isNumber(tick.slotWidth)) { // #13221, can be 0
            return tick.slotWidth;
        }

        if (horiz && labelOptions.step < 2) {
            if (labelOptions.rotation) { // #4415
                return 0;
            }
            return ((this.staggerLines || 1) * this.len) / slotCount;
        }

        if (!horiz) {
            // #7028
            const cssWidth = labelOptions.style.width;
            if (cssWidth !== void 0) {
                return parseInt(String(cssWidth), 10);
            }

            if (marginLeft) {
                return marginLeft - chart.spacing[3];
            }
        }

        // Last resort, a fraction of the available size
        return chart.chartWidth * 0.33;

    }

    /**
     * Render the axis labels and determine whether ellipsis or rotation need to
     * be applied.
     *
     * @private
     * @function Highcharts.Axis#renderUnsquish
     */
    public renderUnsquish(): void {
        const chart = this.chart,
            renderer = chart.renderer,
            tickPositions = this.tickPositions,
            ticks = this.ticks,
            labelOptions = this.options.labels,
            labelStyleOptions = labelOptions.style,
            horiz = this.horiz,
            slotWidth = this.getSlotWidth(),
            innerWidth = Math.max(
                1,
                Math.round(slotWidth - 2 * labelOptions.padding)
            ),
            attr: SVGAttributes = {},
            labelMetrics = this.labelMetrics(),
            textOverflowOption = labelStyleOptions.textOverflow;

        let commonWidth: number,
            commonTextOverflow: string,
            maxLabelLength = 0,
            label,
            i,
            pos;

        // Set rotation option unless it is "auto", like in gauges
        if (!isString(labelOptions.rotation)) {
            // #4443
            attr.rotation = labelOptions.rotation || 0;
        }

        // Get the longest label length
        tickPositions.forEach(function (tickPosition): void {
            const tick = ticks[tickPosition];

            // Replace label - sorting animation
            if (tick.movedLabel) {
                tick.replaceMovedLabel();
            }

            if (
                tick &&
                tick.label &&
                tick.label.textPxLength > maxLabelLength
            ) {
                maxLabelLength = tick.label.textPxLength;
            }
        });
        this.maxLabelLength = maxLabelLength;


        // Handle auto rotation on horizontal axis
        if (this.autoRotation) {

            // Apply rotation only if the label is too wide for the slot, and
            // the label is wider than its height.
            if (
                maxLabelLength > innerWidth &&
                maxLabelLength > labelMetrics.h
            ) {
                attr.rotation = this.labelRotation;
            } else {
                this.labelRotation = 0;
            }

        // Handle word-wrap or ellipsis on vertical axis
        } else if (slotWidth) {
            // For word-wrap or ellipsis
            commonWidth = innerWidth;

            if (!textOverflowOption) {
                commonTextOverflow = 'clip';

                // On vertical axis, only allow word wrap if there is room
                // for more lines.
                i = tickPositions.length;
                while (!horiz && i--) {
                    pos = tickPositions[i];
                    label = ticks[pos].label;
                    if (label) {
                        // Reset ellipsis in order to get the correct
                        // bounding box (#4070)
                        if (
                            label.styles &&
                            label.styles.textOverflow === 'ellipsis'
                        ) {
                            label.css({ textOverflow: 'clip' });

                        // Set the correct width in order to read
                        // the bounding box height (#4678, #5034)
                        } else if (label.textPxLength > slotWidth) {
                            label.css({ width: slotWidth + 'px' });
                        }

                        if (
                            label.getBBox().height > (
                                this.len / tickPositions.length -
                                (labelMetrics.h - labelMetrics.f)
                            )
                        ) {
                            label.specificTextOverflow = 'ellipsis';
                        }
                    }
                }
            }
        }


        // Add ellipsis if the label length is significantly longer than ideal
        if (attr.rotation) {
            commonWidth = (
                maxLabelLength > (chart.chartHeight as any) * 0.5 ?
                    (chart.chartHeight as any) * 0.33 :
                    maxLabelLength
            );
            if (!textOverflowOption) {
                commonTextOverflow = 'ellipsis';
            }
        }

        // Set the explicit or automatic label alignment
        this.labelAlign = labelOptions.align ||
            this.autoLabelAlign(this.labelRotation as any);
        if (this.labelAlign) {
            attr.align = this.labelAlign;
        }

        // Apply general and specific CSS
        tickPositions.forEach(function (pos: number): void {
            const tick = ticks[pos],
                label = tick && tick.label,
                widthOption = labelStyleOptions.width,
                css: CSSObject = {};

            if (label) {
                // This needs to go before the CSS in old IE (#4502)
                label.attr(attr);

                if (tick.shortenLabel) {
                    tick.shortenLabel();
                } else if (
                    commonWidth &&
                    !widthOption &&
                    // Setting width in this case messes with the bounding box
                    // (#7975)
                    labelStyleOptions.whiteSpace !== 'nowrap' &&
                    (
                        // Speed optimizing, #7656
                        commonWidth < label.textPxLength ||
                        // Resetting CSS, #4928
                        label.element.tagName === 'SPAN'
                    )
                ) {
                    css.width = commonWidth + 'px';
                    if (!textOverflowOption) {
                        css.textOverflow = (
                            label.specificTextOverflow ||
                            commonTextOverflow
                        );
                    }
                    label.css(css);

                // Reset previously shortened label (#8210)
                } else if (
                    label.styles &&
                    label.styles.width &&
                    !css.width &&
                    !widthOption
                ) {
                    label.css({ width: null as any });
                }

                delete label.specificTextOverflow;
                tick.rotation = attr.rotation;
            }
        }, this);

        // Note: Why is this not part of getLabelPosition?
        this.tickRotCorr = renderer.rotCorr(
            labelMetrics.b,
            this.labelRotation || 0,
            this.side !== 0
        );
    }

    /**
     * Return true if the axis has associated data.
     *
     * @function Highcharts.Axis#hasData
     *
     * @return {boolean}
     * True if the axis has associated visible series and those series have
     * either valid data points or explicit `min` and `max` settings.
     */
    public hasData(): boolean {
        return this.series.some(function (s): boolean {
            return s.hasData();
        }) ||
        (
            this.options.showEmpty &&
            defined(this.min) &&
            defined(this.max)
        );
    }

    /**
     * Adds the title defined in axis.options.title.
     *
     * @function Highcharts.Axis#addTitle
     *
     * @param {boolean} [display]
     * Whether or not to display the title.
     */
    public addTitle(display?: boolean): void {
        const axis = this,
            renderer = axis.chart.renderer,
            horiz = axis.horiz,
            opposite = axis.opposite,
            options = axis.options,
            axisTitleOptions = options.title,
            styledMode = axis.chart.styledMode;

        let textAlign: (AlignValue|undefined);

        if (!axis.axisTitle) {
            textAlign = axisTitleOptions.textAlign;
            if (!textAlign) {
                textAlign = ((horiz ? {
                    low: 'left',
                    middle: 'center',
                    high: 'right'
                } : {
                    low: opposite ? 'right' : 'left',
                    middle: 'center',
                    high: opposite ? 'left' : 'right'
                }) as Record<string, AlignValue>)[
                    axisTitleOptions.align as any
                ];
            }
            axis.axisTitle = renderer
                .text(
                    axisTitleOptions.text || '',
                    0,
                    0,
                    axisTitleOptions.useHTML
                )
                .attr({
                    zIndex: 7,
                    rotation: axisTitleOptions.rotation,
                    align: textAlign
                })
                .addClass('highcharts-axis-title');

            // #7814, don't mutate style option
            if (!styledMode) {
                axis.axisTitle.css(merge(axisTitleOptions.style));
            }

            axis.axisTitle.add(axis.axisGroup);
            axis.axisTitle.isNew = true;
        }

        // Max width defaults to the length of the axis
        if (!styledMode &&
            !axisTitleOptions.style.width &&
            !axis.isRadial
        ) {
            axis.axisTitle.css({
                width: axis.len + 'px'
            });
        }

        // hide or show the title depending on whether showEmpty is set
        axis.axisTitle[display ? 'show' : 'hide'](display);
    }

    /**
     * Generates a tick for initial positioning.
     *
     * @private
     * @function Highcharts.Axis#generateTick
     *
     * @param {number} pos
     * The tick position in axis values.
     *
     * @param {number} [i]
     * The index of the tick in {@link Axis.tickPositions}.
     */
    public generateTick(pos: number): void {
        const axis = this,
            ticks = axis.ticks;

        if (!ticks[pos]) {
            ticks[pos] = new Tick(axis, pos);
        } else {
            ticks[pos].addLabel(); // update labels depending on tick interval
        }
    }

    /**
     * Render the tick labels to a preliminary position to get their sizes
     *
     * @private
     * @function Highcharts.Axis#getOffset
     *
     * @emits Highcharts.Axis#event:afterGetOffset
     */
    public getOffset(): void {
        const axis = this,
            {
                chart,
                horiz,
                options,
                side,
                ticks,
                tickPositions,
                coll,
                axisParent // Used in color axis
            } = axis,
            renderer = chart.renderer,
            invertedSide = (
                chart.inverted && !axis.isZAxis ?
                    [1, 0, 3, 2][side] :
                    side
            ),
            hasData = axis.hasData(),
            axisTitleOptions = options.title,
            labelOptions = options.labels,
            hasCrossing = isNumber(options.crossing),
            axisOffset = chart.axisOffset,
            clipOffset = chart.clipOffset,
            directionFactor = [-1, 1, 1, -1][side],
            className = options.className;

        let showAxis,
            titleOffset = 0,
            titleOffsetOption,
            titleMargin = 0,
            labelOffset = 0, // reset
            labelOffsetPadded,
            lineHeightCorrection;

        // For reuse in Axis.render
        axis.showAxis = showAxis = hasData || options.showEmpty;

        // Set/reset staggerLines
        axis.staggerLines = (axis.horiz && labelOptions.staggerLines) || void 0;

        // Create the axisGroup and gridGroup elements on first iteration
        if (!axis.axisGroup) {
            const createGroup = (
                name: string,
                suffix: string,
                zIndex: number
            ): SVGElement => renderer.g(name)
                .attr({ zIndex })
                .addClass(
                    `highcharts-${coll.toLowerCase()}${suffix} ` +
                    (this.isRadial ? `highcharts-radial-axis${suffix} ` : '') +
                    (className || '')
                )
                .add(axisParent);

            axis.gridGroup = createGroup(
                'grid',
                '-grid',
                options.gridZIndex
            );
            axis.axisGroup = createGroup(
                'axis',
                '',
                options.zIndex
            );
            axis.labelGroup = createGroup(
                'axis-labels',
                '-labels',
                labelOptions.zIndex
            );
        }

        if (hasData || axis.isLinked) {

            // Generate ticks
            tickPositions.forEach(function (pos: number): void {
                // i is not used here, but may be used in overrides
                axis.generateTick(pos);
            });

            axis.renderUnsquish();


            // Left side must be align: right and right side must
            // have align: left for labels
            axis.reserveSpaceDefault = (
                side === 0 ||
                side === 2 ||
                ({ 1: 'left', 3: 'right' } as any)[side] === axis.labelAlign
            );
            if (pick(
                labelOptions.reserveSpace,
                hasCrossing ? false : null,
                axis.labelAlign === 'center' ? true : null,
                axis.reserveSpaceDefault
            )) {
                tickPositions.forEach(function (pos: number): void {
                    // get the highest offset
                    labelOffset = Math.max(
                        ticks[pos].getLabelSize(),
                        labelOffset
                    );
                });

            }

            if (axis.staggerLines) {
                labelOffset *= axis.staggerLines;
            }
            axis.labelOffset = labelOffset * (axis.opposite ? -1 : 1);

        } else { // doesn't have data
            objectEach(ticks, function (tick, n): void {
                tick.destroy();
                delete ticks[n];
            });
        }

        if (
            axisTitleOptions &&
            axisTitleOptions.text &&
            axisTitleOptions.enabled !== false
        ) {
            axis.addTitle(showAxis);

            if (
                showAxis &&
                !hasCrossing &&
                axisTitleOptions.reserveSpace !== false
            ) {
                axis.titleOffset = titleOffset =
                    (axis.axisTitle as any).getBBox()[
                        horiz ? 'height' : 'width'
                    ];
                titleOffsetOption = axisTitleOptions.offset;
                titleMargin = defined(titleOffsetOption) ?
                    0 :
                    pick(axisTitleOptions.margin, horiz ? 5 : 10);
            }
        }

        // Render the axis line
        axis.renderLine();

        // handle automatic or user set offset
        axis.offset = directionFactor * pick(
            options.offset,
            axisOffset[side] ? axisOffset[side] + (options.margin || 0) : 0
        );

        axis.tickRotCorr = axis.tickRotCorr || { x: 0, y: 0 }; // polar
        if (side === 0) {
            lineHeightCorrection = -axis.labelMetrics().h;
        } else if (side === 2) {
            lineHeightCorrection = axis.tickRotCorr.y;
        } else {
            lineHeightCorrection = 0;
        }

        // Find the padded label offset
        labelOffsetPadded = Math.abs(labelOffset) + titleMargin;
        if (labelOffset) {
            labelOffsetPadded -= lineHeightCorrection;
            labelOffsetPadded += directionFactor * (
                horiz ?
                    pick(
                        labelOptions.y,
                        axis.tickRotCorr.y +
                            directionFactor * labelOptions.distance
                    ) :
                    pick(
                        labelOptions.x,
                        directionFactor * labelOptions.distance
                    )
            );
        }

        axis.axisTitleMargin = pick(titleOffsetOption, labelOffsetPadded);

        if (axis.getMaxLabelDimensions) {
            axis.maxLabelDimensions = axis.getMaxLabelDimensions(
                ticks,
                tickPositions
            );
        }

        // Due to GridAxis.tickSize, tickSize should be calculated after ticks
        // has rendered.
        if (coll !== 'colorAxis') {
            const tickSize = this.tickSize('tick');

            axisOffset[side] = Math.max(
                axisOffset[side],
                (axis.axisTitleMargin || 0) + titleOffset +
                directionFactor * axis.offset,
                labelOffsetPadded, // #3027
                tickPositions && tickPositions.length && tickSize ?
                    tickSize[0] + directionFactor * axis.offset :
                    0 // #4866
            );

            // Decide the clipping needed to keep the graph inside
            // the plot area and axis lines
            const clip = !axis.axisLine || options.offset ?
                0 :
                // #4308, #4371:
                Math.floor(axis.axisLine.strokeWidth() / 2) * 2;
            (clipOffset as any)[invertedSide] =
                Math.max((clipOffset as any)[invertedSide], clip);
        }

        fireEvent(this, 'afterGetOffset');
    }

    /**
     * Internal function to get the path for the axis line. Extended for polar
     * charts.
     *
     * @function Highcharts.Axis#getLinePath
     *
     * @param {number} lineWidth
     * The line width in pixels.
     *
     * @return {Highcharts.SVGPathArray}
     * The SVG path definition in array form.
     */
    public getLinePath(lineWidth: number): SVGPath {
        const chart = this.chart,
            opposite = this.opposite,
            offset = this.offset,
            horiz = this.horiz,
            lineLeft = this.left + (opposite ? this.width : 0) + offset,
            lineTop = (chart.chartHeight as any) - this.bottom -
                (opposite ? this.height : 0) + offset;

        if (opposite) {
            lineWidth *= -1; // crispify the other way - #1480, #1687
        }

        return chart.renderer
            .crispLine([
                [
                    'M',
                    horiz ?
                        this.left :
                        lineLeft,
                    horiz ?
                        lineTop :
                        this.top
                ],
                [
                    'L',
                    horiz ?
                        (chart.chartWidth as any) - this.right :
                        lineLeft,
                    horiz ?
                        lineTop :
                        (chart.chartHeight as any) - this.bottom
                ]
            ], lineWidth);
    }

    /**
     * Render the axis line. Called internally when rendering and redrawing the
     * axis.
     *
     * @function Highcharts.Axis#renderLine
     */
    public renderLine(): void {
        if (!this.axisLine) {
            this.axisLine = this.chart.renderer.path()
                .addClass('highcharts-axis-line')
                .add(this.axisGroup);

            if (!this.chart.styledMode) {
                this.axisLine.attr({
                    stroke: this.options.lineColor,
                    'stroke-width': this.options.lineWidth,
                    zIndex: 7
                });
            }
        }
    }

    /**
     * Position the axis title.
     *
     * @private
     * @function Highcharts.Axis#getTitlePosition
     *
     * @return {Highcharts.PositionObject}
     * X and Y positions for the title.
     */
    public getTitlePosition(axisTitle: SVGElement): PositionObject {
        // compute anchor points for each of the title align options
        const horiz = this.horiz,
            axisLeft = this.left,
            axisTop = this.top,
            axisLength = this.len,
            axisTitleOptions = this.options.title,
            margin = horiz ? axisLeft : axisTop,
            opposite = this.opposite,
            offset = this.offset,
            xOption = axisTitleOptions.x,
            yOption = axisTitleOptions.y,
            fontMetrics = this.chart.renderer.fontMetrics(axisTitle),
            // The part of a multiline text that is below the baseline of the
            // first line. Subtract 1 to preserve pixel-perfectness from the
            // old behaviour (v5.0.12), where only one line was allowed.
            textHeightOvershoot = axisTitle ? Math.max(
                axisTitle.getBBox(false, 0).height - fontMetrics.h - 1,
                0
            ) : 0,

            // the position in the length direction of the axis
            alongAxis = ({
                low: margin + (horiz ? 0 : axisLength),
                middle: margin + axisLength / 2,
                high: margin + (horiz ? axisLength : 0)
            })[axisTitleOptions.align],

            // the position in the perpendicular direction of the axis
            offAxis = (horiz ? axisTop + this.height : axisLeft) +
                (horiz ? 1 : -1) * // horizontal axis reverses the margin
                (opposite ? -1 : 1) * // so does opposite axes
                (this.axisTitleMargin || 0) +
                [
                    -textHeightOvershoot, // top
                    textHeightOvershoot, // right
                    fontMetrics.f, // bottom
                    -textHeightOvershoot // left
                ][this.side],
            titlePosition = {
                x: horiz ?
                    alongAxis + xOption :
                    offAxis + (opposite ? this.width : 0) + offset + xOption,
                y: horiz ?
                    offAxis + yOption - (opposite ? this.height : 0) + offset :
                    alongAxis + yOption
            };

        fireEvent(
            this,
            'afterGetTitlePosition',
            { titlePosition: titlePosition }
        );

        return titlePosition;
    }

    /**
     * Render a minor tick into the given position. If a minor tick already
     * exists in this position, move it.
     *
     * @function Highcharts.Axis#renderMinorTick
     *
     * @param {number} pos
     * The position in axis values.
     *
     * @param {boolean} slideIn
     * Whether the tick should animate in from last computed position
     */
    public renderMinorTick(pos: number, slideIn?: boolean): void {
        const axis = this;
        const minorTicks = axis.minorTicks;

        if (!minorTicks[pos]) {
            minorTicks[pos] = new Tick(axis, pos, 'minor');
        }

        // Render new ticks in old position
        if (slideIn && minorTicks[pos].isNew) {
            minorTicks[pos].render(null as any, true);
        }

        minorTicks[pos].render(null as any, false, 1);
    }

    /**
     * Render a major tick into the given position. If a tick already exists
     * in this position, move it.
     *
     * @function Highcharts.Axis#renderTick
     *
     * @param {number} pos
     * The position in axis values.
     *
     * @param {number} i
     * The tick index.
     *
     * @param {boolean} slideIn
     * Whether the tick should animate in from last computed position
     */
    public renderTick(pos: number, i: number, slideIn?: boolean): void {
        const axis = this,
            isLinked = axis.isLinked,
            ticks = axis.ticks;

        // Linked axes need an extra check to find out if
        if (
            !isLinked ||
            (pos >= (axis.min as any) && pos <= (axis.max as any)) ||
            (axis.grid && axis.grid.isColumn)
        ) {

            if (!ticks[pos]) {
                ticks[pos] = new Tick(axis, pos);
            }
            // NOTE this seems like overkill. Could be handled in tick.render by
            // setting old position in attr, then set new position in animate.
            // render new ticks in old position
            if (slideIn && ticks[pos].isNew) {
                // Start with negative opacity so that it is visible from
                // halfway into the animation
                ticks[pos].render(i, true, -1);
            }

            ticks[pos].render(i);
        }
    }

    /**
     * Render the axis.
     *
     * @private
     * @function Highcharts.Axis#render
     *
     * @emits Highcharts.Axis#event:afterRender
     */
    public render(): void {
        const axis = this,
            chart = axis.chart,
            log = axis.logarithmic,
            renderer = chart.renderer,
            options = axis.options,
            isLinked = axis.isLinked,
            tickPositions = axis.tickPositions,
            axisTitle = axis.axisTitle,
            ticks = axis.ticks,
            minorTicks = axis.minorTicks,
            alternateBands = axis.alternateBands,
            stackLabelOptions = options.stackLabels,
            alternateGridColor = options.alternateGridColor,
            crossing = options.crossing,
            tickmarkOffset = axis.tickmarkOffset,
            axisLine = axis.axisLine,
            showAxis = axis.showAxis,
            animation = animObject(renderer.globalAnimation);

        let from: number,
            to: number;

        // Reset
        axis.labelEdge.length = 0;
        axis.overlap = false;

        // Mark all elements inActive before we go over and mark the active ones
        [ticks, minorTicks, alternateBands].forEach(function (
            coll: (Record<string, PlotLineOrBand>|Record<string, Tick>)
        ): void {
            objectEach(coll, function (tick): void {
                tick.isActive = false;
            });
        });

        // Crossing
        if (isNumber(crossing)) {
            const otherAxis = this.isXAxis ? chart.yAxis[0] : chart.xAxis[0],
                directionFactor = [1, -1, -1, 1][this.side];
            if (otherAxis) {
                let px = otherAxis.toPixels(crossing, true);
                if (axis.horiz) {
                    px = otherAxis.len - px;
                }
                axis.offset = directionFactor * px;
            }
        }

        // If the series has data draw the ticks. Else only the line and title
        if (axis.hasData() || isLinked) {

            const slideInTicks = axis.chart.hasRendered &&
                axis.old && isNumber(axis.old.min);

            // minor ticks
            if (axis.minorTickInterval && !axis.categories) {
                axis.getMinorTickPositions().forEach(function (
                    pos: number
                ): void {
                    axis.renderMinorTick(pos, slideInTicks);
                });
            }

            // Major ticks. Pull out the first item and render it last so that
            // we can get the position of the neighbour label. #808.
            if (tickPositions.length) { // #1300
                tickPositions.forEach(function (pos: number, i: number): void {
                    axis.renderTick(pos, i, slideInTicks);
                });
                // In a categorized axis, the tick marks are displayed
                // between labels. So we need to add a tick mark and
                // grid line at the left edge of the X axis.
                if (tickmarkOffset && (axis.min === 0 || axis.single)) {
                    if (!ticks[-1]) {
                        ticks[-1] = new Tick(axis, -1, null as any, true);
                    }
                    ticks[-1].render(-1);
                }

            }

            // alternate grid color
            if (alternateGridColor) {
                tickPositions.forEach(function (pos: number, i: number): void {
                    to = typeof tickPositions[i + 1] !== 'undefined' ?
                        tickPositions[i + 1] + tickmarkOffset :
                        (axis.max as any) - tickmarkOffset;

                    if (
                        i % 2 === 0 &&
                        pos < (axis.max as any) &&
                        to <= (axis.max as any) + (
                            chart.polar ?
                                -tickmarkOffset :
                                tickmarkOffset
                        )
                    ) { // #2248, #4660
                        if (!alternateBands[pos]) {
                            // Should be imported from PlotLineOrBand.js, but
                            // the dependency cycle with axis is a problem
                            alternateBands[pos] = new (H as any).PlotLineOrBand(
                                axis
                            );
                        }
                        from = pos + tickmarkOffset; // #949
                        alternateBands[pos].options = {
                            from: log ? log.lin2log(from) : from,
                            to: log ? log.lin2log(to) : to,
                            color: alternateGridColor,
                            className: 'highcharts-alternate-grid'
                        };
                        alternateBands[pos].render();
                        alternateBands[pos].isActive = true;
                    }
                });
            }

            // custom plot lines and bands
            if (!axis._addedPlotLB) { // only first time
                axis._addedPlotLB = true;
                (options.plotLines || [])
                    .concat((options.plotBands as any) || [])
                    .forEach(
                        function (plotLineOptions: any): void {
                            (axis as unknown as PlotLineOrBand.Axis)
                                .addPlotBandOrLine(plotLineOptions);
                        }
                    );
            }

        } // end if hasData

        // Remove inactive ticks
        [ticks, minorTicks, alternateBands].forEach(function (
            coll: (Record<string, PlotLineOrBand>|Record<string, Tick>)
        ): void {
            const forDestruction: Array<number> = [],
                delay = animation.duration,
                destroyInactiveItems = function (): void {
                    let i = forDestruction.length;
                    while (i--) {
                        // When resizing rapidly, the same items
                        // may be destroyed in different timeouts,
                        // or the may be reactivated
                        if (
                            coll[forDestruction[i]] &&
                            !coll[forDestruction[i]].isActive
                        ) {
                            coll[forDestruction[i]].destroy();
                            delete coll[forDestruction[i]];
                        }
                    }

                };

            objectEach(coll, function (tick, pos): void {
                if (!tick.isActive) {
                    // Render to zero opacity
                    tick.render(pos as any, false, 0);
                    tick.isActive = false;
                    forDestruction.push(pos as any);
                }
            });

            // When the objects are finished fading out, destroy them
            syncTimeout(
                destroyInactiveItems,
                coll === alternateBands ||
                    !chart.hasRendered ||
                    !delay ?
                    0 :
                    delay
            );
        });

        // Set the axis line path
        if (axisLine) {
            axisLine[axisLine.isPlaced ? 'animate' : 'attr']({
                d: this.getLinePath(axisLine.strokeWidth())
            });
            axisLine.isPlaced = true;

            // Show or hide the line depending on options.showEmpty
            axisLine[showAxis ? 'show' : 'hide'](showAxis);
        }

        if (axisTitle && showAxis) {
            axisTitle[axisTitle.isNew ? 'attr' : 'animate'](
                axis.getTitlePosition(axisTitle)
            );
            axisTitle.isNew = false;
        }


        // Stacked totals:
        if (stackLabelOptions && stackLabelOptions.enabled && axis.stacking) {
            axis.stacking.renderStackTotals();
        }
        // End stacked totals

        // Record old scaling for updating/animation
        axis.old = {
            len: axis.len,
            max: axis.max,
            min: axis.min,
            transA: axis.transA,
            userMax: axis.userMax,
            userMin: axis.userMin
        };
        axis.isDirty = false;

        fireEvent(this, 'afterRender');
    }

    /**
     * Redraw the axis to reflect changes in the data or axis extremes. Called
     * internally from Highcharts.Chart#redraw.
     *
     * @private
     * @function Highcharts.Axis#redraw
     */
    public redraw(): void {

        if (this.visible) {
            // render the axis
            this.render();

            // move plot lines and bands
            this.plotLinesAndBands.forEach(function (plotLine): void {
                plotLine.render();
            });
        }

        // mark associated series as dirty and ready for redraw
        this.series.forEach(function (series): void {
            series.isDirty = true;
        });

    }

    /**
     * Returns an array of axis properties, that should be untouched during
     * reinitialization.
     *
     * @private
     * @function Highcharts.Axis#getKeepProps
     */
    public getKeepProps(): Array<string> {
        return (this.keepProps || Axis.keepProps);
    }

    /**
     * Destroys an Axis instance. See {@link Axis#remove} for the API endpoint
     * to fully remove the axis.
     *
     * @private
     * @function Highcharts.Axis#destroy
     *
     * @param {boolean} [keepEvents]
     * Whether to preserve events, used internally in Axis.update.
     */
    public destroy(keepEvents?: boolean): void {
        const axis = this,
            plotLinesAndBands = axis.plotLinesAndBands,
            eventOptions = this.eventOptions;

        fireEvent(this, 'destroy', { keepEvents: keepEvents });

        // Remove the events
        if (!keepEvents) {
            removeEvent(axis);
        }

        // Destroy collections
        [axis.ticks, axis.minorTicks, axis.alternateBands].forEach(
            function (
                coll: (
                    Record<string, PlotLineOrBand>|
                    Record<string, Tick>
                )
            ): void {
                destroyObjectProperties(coll);
            }
        );
        if (plotLinesAndBands) {
            let i = plotLinesAndBands.length;
            while (i--) { // #1975
                plotLinesAndBands[i].destroy();
            }
        }

        // Destroy elements
        ['axisLine', 'axisTitle', 'axisGroup',
            'gridGroup', 'labelGroup', 'cross', 'scrollbar'].forEach(
            function (prop: string): void {
                if ((axis as any)[prop]) {
                    (axis as any)[prop] = (axis as any)[prop].destroy();
                }
            }
        );

        // Destroy each generated group for plotlines and plotbands
        for (const plotGroup in axis.plotLinesAndBandsGroups) { // eslint-disable-line guard-for-in
            axis.plotLinesAndBandsGroups[plotGroup] =
                axis.plotLinesAndBandsGroups[plotGroup].destroy() as any;
        }

        // Delete all properties and fall back to the prototype.
        objectEach(axis, function (val: any, key: string): void {
            if (axis.getKeepProps().indexOf(key) === -1) {
                delete (axis as any)[key];
            }
        });
        this.eventOptions = eventOptions;
    }

    /**
     * Internal function to draw a crosshair.
     *
     * @function Highcharts.Axis#drawCrosshair
     *
     * @param {Highcharts.PointerEventObject} [e]
     * The event arguments from the modified pointer event, extended with
     * `chartX` and `chartY`
     *
     * @param {Highcharts.Point} [point]
     * The Point object if the crosshair snaps to points.
     *
     * @emits Highcharts.Axis#event:afterDrawCrosshair
     * @emits Highcharts.Axis#event:drawCrosshair
     */
    public drawCrosshair(e?: PointerEvent, point?: Point): void {

        const options = this.crosshair,
            snap = pick(options && options.snap, true),
            chart = this.chart;

        let path,
            pos,
            categorized,
            graphic = this.cross,
            crossOptions: PlotLineOptions;

        fireEvent(this, 'drawCrosshair', { e: e, point: point });

        // Use last available event when updating non-snapped crosshairs without
        // mouse interaction (#5287)
        if (!e) {
            e = this.cross && this.cross.e;
        }

        if (
            // Disabled in options
            !options ||
            // Snap
            ((defined(point) || !snap) === false)
        ) {
            this.hideCrosshair();
        } else {

            // Get the path
            if (!snap) {
                pos = e &&
                    (
                        this.horiz ?
                            e.chartX - (this.pos as any) :
                            this.len - e.chartY + (this.pos as any)
                    );
            } else if (defined(point)) {
                // #3834
                pos = pick(
                    this.coll !== 'colorAxis' ?
                        (point as any).crosshairPos : // 3D axis extension
                        null,
                    this.isXAxis ?
                        (point as any).plotX :
                        this.len - (point as any).plotY
                );
            }

            if (defined(pos)) {
                crossOptions = {
                    // value, only used on radial
                    value: point && (this.isXAxis ?
                        point.x :
                        pick(point.stackY, point.y)) as any,
                    translatedValue: pos
                };

                if (chart.polar) {
                    // Additional information required for crosshairs in
                    // polar chart
                    extend(crossOptions, {
                        isCrosshair: true,
                        chartX: e && e.chartX,
                        chartY: e && e.chartY,
                        point: point
                    });
                }

                path = this.getPlotLinePath(crossOptions) ||
                    null; // #3189
            }

            if (!defined(path)) {
                this.hideCrosshair();
                return;
            }

            categorized = this.categories && !this.isRadial;

            // Draw the cross
            if (!graphic) {
                this.cross = graphic = chart.renderer
                    .path()
                    .addClass(
                        'highcharts-crosshair highcharts-crosshair-' +
                        (categorized ? 'category ' : 'thin ') +
                        (options.className || '')
                    )
                    .attr({
                        zIndex: pick(options.zIndex, 2)
                    })
                    .add();

                // Presentational attributes
                if (!chart.styledMode) {
                    graphic.attr({
                        stroke: options.color ||
                            (
                                categorized ?
                                    Color
                                        .parse(Palette.highlightColor20)
                                        .setOpacity(0.25)
                                        .get() :
                                    Palette.neutralColor20
                            ),
                        'stroke-width': pick(options.width, 1)
                    }).css({
                        'pointer-events': 'none'
                    });
                    if (options.dashStyle) {
                        graphic.attr({
                            dashstyle: options.dashStyle
                        });
                    }
                }
            }

            graphic.show().attr({
                d: path
            });

            if (categorized && !(options as any).width) {
                graphic.attr({
                    'stroke-width': this.transA
                });
            }
            (this.cross as any).e = e;
        }

        fireEvent(this, 'afterDrawCrosshair', { e: e, point: point });
    }

    /**
     * Hide the crosshair if visible.
     *
     * @function Highcharts.Axis#hideCrosshair
     */
    public hideCrosshair(): void {
        if (this.cross) {
            this.cross.hide();
        }
        fireEvent(this, 'afterHideCrosshair');
    }

    /**
     * Check whether the chart has vertical panning ('y' or 'xy' type).
     *
     * @private
     * @function Highcharts.Axis#hasVerticalPanning
     */
    public hasVerticalPanning(): boolean {
        const panningOptions = this.chart.options.chart.panning;
        return Boolean(
            panningOptions &&
            panningOptions.enabled && // #14624
            /y/.test(panningOptions.type)
        );
    }

    /**
     * Update an axis object with a new set of options. The options are merged
     * with the existing options, so only new or altered options need to be
     * specified.
     *
     * @sample highcharts/members/axis-update/
     *         Axis update demo
     *
     * @function Highcharts.Axis#update
     *
     * @param {Highcharts.AxisOptions} options
     * The new options that will be merged in with existing options on the axis.
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart after the axis is altered. If doing more
     * operations on the chart, it is a good idea to set redraw to false and
     * call {@link Chart#redraw} after.
     */
    public update(
        options: DeepPartial<AxisTypeOptions>,
        redraw?: boolean
    ): void {
        const chart = this.chart;

        options = merge(this.userOptions, options);

        this.destroy(true);
        this.init(chart, options);

        chart.isDirtyBox = true;
        if (pick(redraw, true)) {
            chart.redraw();
        }
    }

    /**
     * Remove the axis from the chart.
     *
     * @sample highcharts/members/chart-addaxis/
     *         Add and remove axes
     *
     * @function Highcharts.Axis#remove
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart following the remove.
     */
    public remove(redraw?: boolean): void {
        const chart = this.chart,
            coll = this.coll,
            axisSeries = this.series;

        let i = axisSeries.length;

        // Remove associated series (#2687)
        while (i--) {
            if (axisSeries[i]) {
                axisSeries[i].remove(false);
            }
        }

        // Remove the axis
        erase(chart.axes, this);
        erase(chart[coll] || [], this);

        chart.orderItems(coll);
        this.destroy();
        chart.isDirtyBox = true;

        if (pick(redraw, true)) {
            chart.redraw();
        }
    }

    /**
     * Update the axis title by options after render time.
     *
     * @sample highcharts/members/axis-settitle/
     *         Set a new Y axis title
     *
     * @function Highcharts.Axis#setTitle
     *
     * @param {Highcharts.AxisTitleOptions} titleOptions
     * The additional title options.
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart after setting the title.
     */
    public setTitle(
        titleOptions: AxisTitleOptions,
        redraw?: boolean
    ): void {
        this.update({ title: titleOptions }, redraw);
    }

    /**
     * Set new axis categories and optionally redraw.
     *
     * @sample highcharts/members/axis-setcategories/
     *         Set categories by click on a button
     *
     * @function Highcharts.Axis#setCategories
     *
     * @param {Array<string>} categories
     * The new categories.
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart.
     */
    public setCategories(
        categories: Array<string>,
        redraw?: boolean
    ): void {
        this.update({ categories: categories }, redraw);
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Axis extends AxisComposition, AxisLike {
    // nothing here yet
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace Axis {
    export interface ExtremesObject {
        dataMax: number;
        dataMin: number;
        max: number;
        min: number;
        userMax?: number;
        userMin?: number;
    }
    export interface PanningState {
        startMin: number;
        startMax: number;
        isDirty?: boolean;
    }
    export interface PlotLinePathOptions {
        acrossPanes?: boolean;
        force?: (boolean|string);
        lineWidth?: number;
        old?: boolean;
        reverse?: boolean;
        translatedValue?: number;
        value?: number;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default Axis;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Options for the path on the Axis to be calculated.
 * @interface Highcharts.AxisPlotLinePathOptionsObject
 *//**
 * Axis value.
 * @name Highcharts.AxisPlotLinePathOptionsObject#value
 * @type {number|undefined}
 *//**
 * Line width used for calculation crisp line coordinates. Defaults to 1.
 * @name Highcharts.AxisPlotLinePathOptionsObject#lineWidth
 * @type {number|undefined}
 *//**
 * If `false`, the function will return null when it falls outside the axis
 * bounds. If `true`, the function will return a path aligned to the plot area
 * sides if it falls outside. If `pass`, it will return a path outside.
 * @name Highcharts.AxisPlotLinePathOptionsObject#force
 * @type {string|boolean|undefined}
 *//**
 * Used in Highcharts Stock. When `true`, plot paths
 * (crosshair, plotLines, gridLines)
 * will be rendered on all axes when defined on the first axis.
 * @name Highcharts.AxisPlotLinePathOptionsObject#acrossPanes
 * @type {boolean|undefined}
 *//**
 * Use old coordinates (for resizing and rescaling).
 * If not set, defaults to `false`.
 * @name Highcharts.AxisPlotLinePathOptionsObject#old
 * @type {boolean|undefined}
 *//**
 * If given, return the plot line path of a pixel position on the axis.
 * @name Highcharts.AxisPlotLinePathOptionsObject#translatedValue
 * @type {number|undefined}
 *//**
 * Used in Polar axes. Reverse the positions for concatenation of polygonal
 * plot bands
 * @name Highcharts.AxisPlotLinePathOptionsObject#reverse
 * @type {boolean|undefined}
 */

/**
 * Options for crosshairs on axes.
 *
 * @product highstock
 *
 * @typedef {Highcharts.XAxisCrosshairOptions|Highcharts.YAxisCrosshairOptions} Highcharts.AxisCrosshairOptions
 */

/**
 * @typedef {"navigator"|"pan"|"rangeSelectorButton"|"rangeSelectorInput"|"scrollbar"|"traverseUpButton"|"zoom"} Highcharts.AxisExtremesTriggerValue
 */

/**
 * @callback Highcharts.AxisEventCallbackFunction
 *
 * @param {Highcharts.Axis} this
 */

/**
 * @callback Highcharts.AxisLabelsFormatterCallbackFunction
 *
 * @param {Highcharts.AxisLabelsFormatterContextObject} this
 *
 * @param {Highcharts.AxisLabelsFormatterContextObject} ctx
 *
 * @return {string}
 */

/**
 * @interface Highcharts.AxisLabelsFormatterContextObject
 *//**
 * The axis item of the label
 * @name Highcharts.AxisLabelsFormatterContextObject#axis
 * @type {Highcharts.Axis}
 *//**
 * The chart instance.
 * @name Highcharts.AxisLabelsFormatterContextObject#chart
 * @type {Highcharts.Chart}
 *//**
 * Default formatting of date/time labels.
 * @name Highcharts.AxisLabelsFormatterContextObject#dateTimeLabelFormat
 * @type {string|undefined}
 *//**
 * Whether the label belongs to the first tick on the axis.
 * @name Highcharts.AxisLabelsFormatterContextObject#isFirst
 * @type {boolean}
 *//**
 * Whether the label belongs to the last tick on the axis.
 * @name Highcharts.AxisLabelsFormatterContextObject#isLast
 * @type {boolean}
 *//**
 * The position on the axis in terms of axis values. For category axes, a
 * zero-based index. For datetime axes, the JavaScript time in milliseconds
 * since 1970.
 * @name Highcharts.AxisLabelsFormatterContextObject#pos
 * @type {number}
 *//**
 * The preformatted text as the result of the default formatting. For example
 * dates will be formatted as strings, and numbers with language-specific comma
 * separators, thousands separators and numeric symbols like `k` or `M`.
 * @name Highcharts.AxisLabelsFormatterContextObject#text
 * @type {string|undefined}
 *//**
 * The Tick instance.
 * @name Highcharts.AxisLabelsFormatterContextObject#tick
 * @type {Highcharts.Tick}
 *//**
 * This can be either a numeric value or a category string.
 * @name Highcharts.AxisLabelsFormatterContextObject#value
 * @type {number|string}
 */

/**
 * Options for axes.
 *
 * @typedef {Highcharts.XAxisOptions|Highcharts.YAxisOptions|Highcharts.ZAxisOptions} Highcharts.AxisOptions
 */

/**
 * @callback Highcharts.AxisPointBreakEventCallbackFunction
 *
 * @param {Highcharts.Axis} this
 *
 * @param {Highcharts.AxisPointBreakEventObject} evt
 */

/**
 * @interface Highcharts.AxisPointBreakEventObject
 *//**
 * @name Highcharts.AxisPointBreakEventObject#brk
 * @type {Highcharts.Dictionary<number>}
 *//**
 * @name Highcharts.AxisPointBreakEventObject#point
 * @type {Highcharts.Point}
 *//**
 * @name Highcharts.AxisPointBreakEventObject#preventDefault
 * @type {Function}
 *//**
 * @name Highcharts.AxisPointBreakEventObject#target
 * @type {Highcharts.SVGElement}
 *//**
 * @name Highcharts.AxisPointBreakEventObject#type
 * @type {"pointBreak"|"pointInBreak"}
 */

/**
 * @callback Highcharts.AxisSetExtremesEventCallbackFunction
 *
 * @param {Highcharts.Axis} this
 *
 * @param {Highcharts.AxisSetExtremesEventObject} evt
 */

/**
 * @interface Highcharts.AxisSetExtremesEventObject
 * @extends Highcharts.ExtremesObject
 *//**
 * @name Highcharts.AxisSetExtremesEventObject#preventDefault
 * @type {Function}
 *//**
 * @name Highcharts.AxisSetExtremesEventObject#target
 * @type {Highcharts.SVGElement}
 *//**
 * @name Highcharts.AxisSetExtremesEventObject#trigger
 * @type {Highcharts.AxisExtremesTriggerValue|string}
 *//**
 * @name Highcharts.AxisSetExtremesEventObject#type
 * @type {"setExtremes"}
 */

/**
 * @callback Highcharts.AxisTickPositionerCallbackFunction
 *
 * @param {Highcharts.Axis} this
 *
 * @return {Highcharts.AxisTickPositionsArray}
 */

/**
 * @interface Highcharts.AxisTickPositionsArray
 * @augments Array<number>
 */

/**
 * @typedef {"high"|"low"|"middle"} Highcharts.AxisTitleAlignValue
 */

/**
 * @typedef {Highcharts.XAxisTitleOptions|Highcharts.YAxisTitleOptions|Highcharts.ZAxisTitleOptions} Highcharts.AxisTitleOptions
 */

/**
 * @typedef {"linear"|"logarithmic"|"datetime"|"category"|"treegrid"} Highcharts.AxisTypeValue
 */

/**
 * The returned object literal from the {@link Highcharts.Axis#getExtremes}
 * function.
 *
 * @interface Highcharts.ExtremesObject
 *//**
 * The maximum value of the axis' associated series.
 * @name Highcharts.ExtremesObject#dataMax
 * @type {number}
 *//**
 * The minimum value of the axis' associated series.
 * @name Highcharts.ExtremesObject#dataMin
 * @type {number}
 *//**
 * The maximum axis value, either automatic or set manually. If the `max` option
 * is not set, `maxPadding` is 0 and `endOnTick` is false, this value will be
 * the same as `dataMax`.
 * @name Highcharts.ExtremesObject#max
 * @type {number}
 *//**
 * The minimum axis value, either automatic or set manually. If the `min` option
 * is not set, `minPadding` is 0 and `startOnTick` is false, this value will be
 * the same as `dataMin`.
 * @name Highcharts.ExtremesObject#min
 * @type {number}
 *//**
 * The user defined maximum, either from the `max` option or from a zoom or
 * `setExtremes` action.
 * @name Highcharts.ExtremesObject#userMax
 * @type {number|undefined}
 *//**
 * The user defined minimum, either from the `min` option or from a zoom or
 * `setExtremes` action.
 * @name Highcharts.ExtremesObject#userMin
 * @type {number|undefined}
 */

/**
 * Formatter function for the text of a crosshair label.
 *
 * @callback Highcharts.XAxisCrosshairLabelFormatterCallbackFunction
 *
 * @param {Highcharts.Axis} this
 * Axis context
 *
 * @param {number} value
 * Y value of the data point
 *
 * @return {string}
 */


''; // keeps doclets above in JS file
