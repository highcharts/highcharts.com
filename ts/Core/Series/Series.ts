/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type AnimationOptions from '../Animation/AnimationOptions';
import type Axis from '../Axis/Axis';
import type AxisType from '../Axis/AxisType';
import type BBoxObject from '../Renderer/BBoxObject';
import type Chart from '../Chart/Chart';
import type ColorType from '../Color/ColorType';
import type DataExtremesObject from './DataExtremesObject';
import type DataTable from '../../Data/DataTable';
import type DataTableOptions from '../../Data/DataTableOptions';
import type { EventCallback } from '../Callback';
import type KDPointSearchObjectLike from './KDPointSearchObjectLike';
import type Legend from '../Legend/Legend';
import type LineSeries from '../../Series/Line/LineSeries';
import type PointerEvent from '../PointerEvent';
import type {
    PointOptions,
    PointShortOptions,
    PointStateHoverOptions
} from './PointOptions';
import type RangeSelector from '../../Stock/RangeSelector/RangeSelector';
import type SeriesLike from './SeriesLike';
import type {
    NonPlotOptions,
    SeriesDataSortingOptions,
    SeriesOptions,
    SeriesStateHoverOptions,
    SeriesZonesOptions,
    TypedArray
} from './SeriesOptions';
import type {
    SeriesTypeOptions,
    SeriesTypePlotOptions
} from './SeriesType';
import type StackItem from '../Axis/Stacking/StackItem';
import type { StatesOptionsKey } from './StatesOptions';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';
import type SVGPath from '../Renderer/SVG/SVGPath';
import type { SymbolKey } from '../Renderer/SVG/SymbolType';
import type TooltipOptions from '../TooltipOptions';

import A from '../Animation/AnimationUtilities.js';
const {
    animObject,
    setAnimation
} = A;
import DataTableCore from '../../Data/DataTableCore.js';
import D from '../Defaults.js';
const { defaultOptions } = D;
import F from '../Foundation.js';
const { registerEventOptions } = F;
import H from '../Globals.js';
const {
    svg,
    win
} = H;
import LegendSymbol from '../Legend/LegendSymbol.js';
import { Palette } from '../Color/Palettes.js';
import Point from './Point.js';
import SeriesDefaults from './SeriesDefaults.js';
import SeriesRegistry from './SeriesRegistry.js';
const { seriesTypes } = SeriesRegistry;
import SVGElement from '../Renderer/SVG/SVGElement.js';
import U from '../Utilities.js';
const {
    addEvent,
    arrayMax,
    arrayMin,
    clamp,
    correctFloat,
    crisp,
    defined,
    destroyObjectProperties,
    diffObjects,
    erase,
    error,
    extend,
    find,
    fireEvent,
    getClosestDistance,
    getNestedProperty,
    insertItem,
    isArray,
    isNumber,
    isString,
    merge,
    objectEach,
    pick,
    pushUnique,
    removeEvent,
    syncTimeout
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../Chart/ChartLike'{
    interface ChartLike {
        runTrackerClick?: boolean;
    }
}

declare module '../Renderer/SVG/SVGElementLike' {
    interface SVGElementLike {
        survive?: boolean;
    }
}

declare module './PointLike' {
    interface PointLike {
        plotX?: number;
        plotY?: number;
    }
}

declare module './SeriesLike' {
    interface SeriesLike {
        _hasPointMarkers?: boolean;
        keysAffectYAxis?: Array<string>;
        pointArrayMap?: Array<string>;
        pointValKey?: string;
        toYData?(point: Point): Array<number>;
    }
}

interface KDNode {
    [side: string]: (KDNode|Point|undefined);
    left?: KDNode;
    point: Point;
    right?: KDNode;
}

interface KDPointSearchObject extends KDPointSearchObjectLike {
}

/* *
 *
 *  Class
 *
 * */

/**
 * This is the base series prototype that all other series types inherit from.
 * A new series is initialized either through the
 * [series](https://api.highcharts.com/highcharts/series)
 * option structure, or after the chart is initialized, through
 * {@link Highcharts.Chart#addSeries}.
 *
 * The object can be accessed in a number of ways. All series and point event
 * handlers give a reference to the `series` object. The chart object has a
 * {@link Highcharts.Chart#series|series} property that is a collection of all
 * the chart's series. The point objects and axis objects also have the same
 * reference.
 *
 * Another way to reference the series programmatically is by `id`. Add an id
 * in the series configuration options, and get the series object by
 * {@link Highcharts.Chart#get}.
 *
 * Configuration options for the series are given in three levels. Options for
 * all series in a chart are given in the
 * [plotOptions.series](https://api.highcharts.com/highcharts/plotOptions.series)
 * object. Then options for all series of a specific type
 * are given in the plotOptions of that type, for example `plotOptions.line`.
 * Next, options for one single series are given in the series array, or as
 * arguments to `chart.addSeries`.
 *
 * The data in the series is stored in various arrays.
 *
 * - First, `series.options.data` contains all the original config options for
 *   each point whether added by options or methods like `series.addPoint`.
 *
 * - The `series.dataTable` refers to an instance of [DataTableCore](https://api.highcharts.com/class-reference/Highcharts.Data)
 *   or `DataTable` that contains the data in a tabular format. Individual
 *   columns can be read from `series.getColumn()`.
 *
 * - Next, `series.data` contains those values converted to points, but in case
 *   the series data length exceeds the `cropThreshold`, or if the data is
 *   grouped, `series.data` doesn't contain all the points. It only contains the
 *   points that have been created on demand.
 *
 * - Then there's `series.points` that contains all currently visible point
 *   objects. In case of cropping, the cropped-away points are not part of this
 *   array. The `series.points` array starts at `series.cropStart` compared to
 *   `series.data` and `series.options.data`. If however the series data is
 *   grouped, these can't be correlated one to one.
 *
 * @class
 * @name Highcharts.Series
 *
 * @param {Highcharts.Chart} chart
 * The chart instance.
 *
 * @param {Highcharts.SeriesOptionsType|object} options
 * The series options.
 */
class Series {

    /* *
     *
     *  Static Properties
     *
     * */

    public static readonly defaultOptions = SeriesDefaults;

    /**
     * Registry of all available series types.
     *
     * @name Highcharts.Series.types
     * @type {Highcharts.Dictionary<typeof_Highcharts.Series>}
     */
    public static readonly types = SeriesRegistry.seriesTypes;

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Registers a series class to be accessible via `Series.types`.
     *
     * @function Highcharts.Series.registerType
     *
     * @param {string} seriesType
     * The series type as an identifier string in lower case.
     *
     * @param {Function} SeriesClass
     * The series class as a class pattern or a constructor function with
     * prototype.
     */
    public static readonly registerType = SeriesRegistry.registerSeriesType;

    /* *
     *
     *  Properties
     *
     * */

    public _hasTracking?: boolean;

    public _i!: number;

    public animationTimeout?: number;

    public area?: SVGElement;

    public basePointRange?: number;

    public buildingKdTree?: boolean;

    public chart!: Chart;

    public closestPointRange?: number;

    public closestPointRangePx?: number;

    public color?: (ColorType);

    public colorIndex?: number;

    public cropped?: boolean;

    public data!: Array<Point>;

    public dataColumnKeys?: Array<string>;

    public dataMax?: number;

    public dataMin?: number;

    public enabledDataSorting?: boolean;

    public fillColor?: ColorType;

    public finishedAnimating?: boolean;

    public getExtremesFromAll?: boolean;

    public graph?: SVGElement;

    public graphPath?: SVGPath;

    public group?: SVGElement;

    public eventOptions!: Record<string, EventCallback<Series, Event>>;

    public eventsToUnbind!: Array<Function>;

    public halo?: SVGElement;

    public hasCartesianSeries?: Chart['hasCartesianSeries'];

    public hasRendered?: boolean;

    public id?: string;

    public index!: number;

    public initialType?: string;

    public isDirty?: boolean;

    public isDirtyData?: boolean;

    public isRadialSeries?: boolean;

    public kdTree?: KDNode;

    public linkedParent?: Series;

    public linkedSeries!: Array<Series>;

    public options!: SeriesOptions;

    public markerGroup?: SVGElement;

    public opacity?: number;

    public optionalAxis?: string;

    public pointInterval?: number;

    public points!: Array<Point>;

    public pointValKey?: string;

    public selected?: boolean;

    public sharedClipKey?: string;

    public stateMarkerGraphic?: SVGElement;

    public stickyTracking?: boolean;

    public symbol?: SymbolKey;

    public symbolIndex?: number;

    public dataTable!: DataTableCore;

    public tooltipOptions!: TooltipOptions;

    public tracker?: SVGElement;

    public trackerGroups?: Array<string>;

    public useDataTable = false;

    public userOptions!: DeepPartial<SeriesTypeOptions>;

    public xAxis!: AxisType;

    public xIncrement?: (number|null);

    public yAxis!: AxisType;

    public zoneAxis: 'x'|'y'|'z' = 'y';

    public zones!: Array<Series.ZoneObject>;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public init(
        chart: Chart,
        userOptions: DeepPartial<SeriesTypeOptions>
    ): void {

        fireEvent(this, 'init', { options: userOptions });

        const series = this,
            chartSeries = chart.series;

        // The 'eventsToUnbind' property moved from prototype into the
        // Series init to avoid reference to the same array between
        // the different series and charts. #12959, #13937
        this.eventsToUnbind = [];

        /**
         * Read only. The chart that the series belongs to.
         *
         * @name Highcharts.Series#chart
         * @type {Highcharts.Chart}
         */
        series.chart = chart;

        /**
         * Read only. The series' type, like "line", "area", "column" etc.
         * The type in the series options anc can be altered using
         * {@link Series#update}.
         *
         * @name Highcharts.Series#type
         * @type {string}
         */

        /**
         * Read only. The series' current options. To update, use
         * {@link Series#update}.
         *
         * @name Highcharts.Series#options
         * @type {Highcharts.SeriesOptionsType}
         */
        series.options = series.setOptions(userOptions);
        const options = series.options,
            visible = options.visible !== false;

        // Create the data table
        this.dataTable ??= options.dataTable instanceof DataTableCore ?
            options.dataTable : new DataTableCore(options.dataTable);

        /**
         * All child series that are linked to the current series through the
         * [linkedTo](https://api.highcharts.com/highcharts/series.line.linkedTo)
         * option.
         *
         * @name Highcharts.Series#linkedSeries
         * @type {Array<Highcharts.Series>}
         * @readonly
         */
        series.linkedSeries = [];
        // Bind the axes
        series.bindAxes();

        extend<Series>(series, {
            /**
             * The series name as given in the options. Defaults to
             * "Series {n}".
             *
             * @name Highcharts.Series#name
             * @type {string}
             */
            name: options.name,
            state: '',
            /**
             * Read only. The series' visibility state as set by {@link
             * Series#show}, {@link Series#hide}, or in the initial
             * configuration.
             *
             * @name Highcharts.Series#visible
             * @type {boolean}
             */
            visible, // True by default
            /**
             * Read only. The series' selected state as set by {@link
             * Highcharts.Series#select}.
             *
             * @name Highcharts.Series#selected
             * @type {boolean}
             */
            selected: options.selected === true // False by default
        });

        registerEventOptions(this, options);

        const events = options.events;
        if (
            events?.click ||
            options.point?.events?.click ||
            options.allowPointSelect
        ) {
            chart.runTrackerClick = true;
        }

        series.getColor();
        series.getSymbol();

        // Mark cartesian
        if (series.isCartesian) {
            chart.hasCartesianSeries = true;
        }

        // Get the index and register the series in the chart. The index is
        // one more than the current latest series index (#5960).
        let lastSeries: Series|undefined;
        if (chartSeries.length) {
            lastSeries = chartSeries[chartSeries.length - 1];
        }
        series._i = pick(lastSeries?._i, -1) + 1;
        series.opacity = series.options.opacity;

        // Insert the series and re-order all series above the insertion
        // point.
        chart.orderItems('series', insertItem(this, chartSeries));

        // Set options for series with sorting and set data later.
        if (options.dataSorting?.enabled) {
            series.setDataSortingOptions();

        } else if (!series.points && !series.data) {
            series.setData(
                options.dataTable || options.data,
                false
            );
        }

        fireEvent(this, 'afterInit');
    }

    /**
     * Check whether the series item is itself or inherits from a certain
     * series type.
     *
     * @function Highcharts.Series#is
     * @param {string} type The type of series to check for, can be either
     *        featured or custom series types. For example `column`, `pie`,
     *        `ohlc` etc.
     *
     * @return {boolean}
     *        True if this item is or inherits from the given type.
     */
    public is(type: string): boolean {
        return seriesTypes[type] && this instanceof seriesTypes[type];
    }

    /**
     * Set the xAxis and yAxis properties of cartesian series, and register
     * the series in the `axis.series` array.
     *
     * @private
     * @function Highcharts.Series#bindAxes
     */
    public bindAxes(): void {
        const series = this,
            seriesOptions = series.options,
            chart = series.chart;
        let axisOptions;

        fireEvent(this, 'bindAxes', null as any, function (): void {

            // Repeat for xAxis and yAxis
            (series.axisTypes || []).forEach(function (coll): void {
                // Loop through the chart's axis objects
                (chart[coll] || []).forEach(function (axis: Axis): void {
                    axisOptions = axis.options;

                    // Apply if the series xAxis or yAxis option matches
                    // the number of the axis, or if undefined, use the
                    // first axis
                    if (
                        pick((seriesOptions as any)[coll], 0) === axis.index ||
                        (
                            typeof (seriesOptions as any)[coll] !==
                            'undefined' &&
                            (seriesOptions as any)[coll] === axisOptions.id
                        )
                    ) {

                        // Register this series in the axis.series lookup
                        insertItem(series, axis.series);

                        // Set this series.xAxis or series.yAxis reference
                        /**
                         * Read only. The unique xAxis object associated
                         * with the series.
                         *
                         * @name Highcharts.Series#xAxis
                         * @type {Highcharts.Axis}
                         */
                        /**
                         * Read only. The unique yAxis object associated
                         * with the series.
                         *
                         * @name Highcharts.Series#yAxis
                         * @type {Highcharts.Axis}
                         */
                        (series as any)[coll] = axis;

                        // Mark dirty for redraw
                        axis.isDirty = true;
                    }
                });

                // The series needs an X and an Y axis
                if (
                    !(series as any)[coll] &&
                    series.optionalAxis !== coll
                ) {
                    error(18, true, chart);
                }

            });
        });

        fireEvent(this, 'afterBindAxes');
    }

    /**
     * Define hasData functions for series. These return true if there
     * are data points on this series within the plot area.
     *
     * @private
     * @function Highcharts.Series#hasData
     */
    public hasData(): boolean {
        return ((
            this.visible &&
            typeof this.dataMax !== 'undefined' &&
            typeof this.dataMin !== 'undefined'
        ) || ( // #3703
            this.visible &&
            this.dataTable.rowCount > 0 // #9758
        ));
    }

    /**
     * Determine whether the marker in a series has changed.
     *
     * @private
     * @function Highcharts.Series#hasMarkerChanged
     */
    public hasMarkerChanged(
        options: DeepPartial<SeriesOptions>,
        oldOptions: DeepPartial<SeriesOptions>
    ): boolean | undefined {
        const marker = options.marker,
            oldMarker = oldOptions.marker || {};

        return marker && (
            (oldMarker.enabled && !marker.enabled) ||
            oldMarker.symbol !== marker.symbol || // #10870, #15946
            oldMarker.height !== marker.height || // #16274
            oldMarker.width !== marker.width // #16274
        );
    }

    /**
     * Return an auto incremented x value based on the pointStart and
     * pointInterval options. This is only used if an x value is not given
     * for the point that calls autoIncrement.
     *
     * @private
     * @function Highcharts.Series#autoIncrement
     */
    public autoIncrement(x?: number): number {

        const options = this.options,
            {
                pointIntervalUnit,
                relativeXValue
            } = this.options,
            time = this.chart.time,
            xIncrement = this.xIncrement ??
                time.parse(options.pointStart) ??
                0;

        let pointInterval: number;

        this.pointInterval = pointInterval = pick(
            this.pointInterval,
            options.pointInterval,
            1
        );

        if (relativeXValue && isNumber(x)) {
            pointInterval *= x;
        }

        // Added code for pointInterval strings
        if (pointIntervalUnit) {
            const d = time.toParts(xIncrement);

            if (pointIntervalUnit === 'day') {
                d[2] += pointInterval;
            } else if (pointIntervalUnit === 'month') {
                d[1] += pointInterval;
            } else if (pointIntervalUnit === 'year') {
                d[0] += pointInterval;
            }

            pointInterval = time.makeTime.apply(
                time,
                d as [number, number, number, number, number, number]
            ) - xIncrement;

        }

        if (relativeXValue && isNumber(x)) {
            return xIncrement + pointInterval;
        }
        this.xIncrement = xIncrement + pointInterval;
        return xIncrement;
    }

    /**
     * Internal function to set properties for series if data sorting is
     * enabled.
     *
     * @private
     * @function Highcharts.Series#setDataSortingOptions
     */
    public setDataSortingOptions(): void {
        const options = this.options;

        extend<Series>(this, {
            requireSorting: false,
            sorted: false,
            enabledDataSorting: true,
            allowDG: false
        });

        // To allow unsorted data for column series.
        if (!defined(options.pointRange)) {
            options.pointRange = 1;
        }
    }

    /**
     * Set the series options by merging from the options tree. Called
     * internally on initializing and updating series. This function will
     * not redraw the series. For API usage, use {@link Series#update}.
     * @private
     * @function Highcharts.Series#setOptions
     * @param {Highcharts.SeriesOptionsType} itemOptions
     * The series options.
     * @emits Highcharts.Series#event:afterSetOptions
     */
    public setOptions(itemOptions: DeepPartial<SeriesTypeOptions>): this['options'] {
        const chart = this.chart,
            chartOptions = chart.options,
            plotOptions = chartOptions.plotOptions,
            userOptions = chart.userOptions || {},
            seriesUserOptions = merge(itemOptions),
            styledMode = chart.styledMode,
            e = {
                plotOptions: plotOptions,
                userOptions: seriesUserOptions
            };
        let zone;

        fireEvent(this, 'setOptions', e);

        // These may be modified by the event
        const typeOptions = (e.plotOptions as any)[this.type],
            userPlotOptions = (
                userOptions.plotOptions || {} as SeriesTypePlotOptions
            ),
            userPlotOptionsSeries = userPlotOptions.series || {},
            defaultPlotOptionsType = (
                defaultOptions.plotOptions[this.type] || {}
            ),
            userPlotOptionsType = userPlotOptions[this.type] || {};

        // Merge in multiple data label options from the plot option. (#21928)
        typeOptions.dataLabels = this.mergeArrays(
            defaultPlotOptionsType.dataLabels,
            typeOptions.dataLabels
        );

        // Use copy to prevent undetected changes (#9762)
        /**
         * Contains series options by the user without defaults.
         * @name Highcharts.Series#userOptions
         * @type {Highcharts.SeriesOptionsType}
         */
        this.userOptions = e.userOptions;

        const options: SeriesTypeOptions = merge(
            typeOptions,
            plotOptions.series,
            // #3881, chart instance plotOptions[type] should trump
            // plotOptions.series
            userPlotOptionsType,
            seriesUserOptions
        );

        // The tooltip options are merged between global and series specific
        // options. Importance order asscendingly:
        // globals: (1)tooltip, (2)plotOptions.series,
        // (3)plotOptions[this.type]
        // init userOptions with possible later updates: 4-6 like 1-3 and
        // (7)this series options
        this.tooltipOptions = merge(
            defaultOptions.tooltip, // 1
            defaultOptions.plotOptions.series?.tooltip, // 2
            defaultPlotOptionsType?.tooltip, // 3
            chart.userOptions.tooltip, // 4
            userPlotOptions.series?.tooltip, // 5
            userPlotOptionsType.tooltip, // 6
            seriesUserOptions.tooltip // 7
        );

        // When shared tooltip, stickyTracking is true by default,
        // unless user says otherwise.
        this.stickyTracking = pick(
            seriesUserOptions.stickyTracking,
            userPlotOptionsType.stickyTracking,
            userPlotOptionsSeries.stickyTracking,
            (
                this.tooltipOptions.shared && !this.noSharedTooltip ?
                    true :
                    options.stickyTracking
            )
        );

        // Delete marker object if not allowed (#1125)
        if (typeOptions.marker === null) {
            delete options.marker;
        }

        // Handle color zones
        this.zoneAxis = options.zoneAxis || 'y';
        const zones = this.zones = // #20440, create deep copy of zones options
            (options.zones || []).map((z): SeriesZonesOptions => ({ ...z }));
        if (
            (options.negativeColor || options.negativeFillColor) &&
            !options.zones
        ) {
            zone = {
                value:
                    (options as any)[this.zoneAxis + 'Threshold'] ||
                    options.threshold ||
                    0,
                className: 'highcharts-negative'
            } as SeriesZonesOptions;
            if (!styledMode) {
                zone.color = options.negativeColor;
                zone.fillColor = options.negativeFillColor;
            }
            zones.push(zone);
        }
        // Push one extra zone for the rest
        if (zones.length && defined(zones[zones.length - 1].value)) {
            zones.push(styledMode ? {} : {
                color: this.color,
                fillColor: this.fillColor
            });
        }

        fireEvent(this, 'afterSetOptions', { options: options });

        return options;
    }

    /**
     * Return series name in "Series {Number}" format or the one defined by
     * a user. This method can be simply overridden as series name format
     * can vary (e.g. technical indicators).
     *
     * @function Highcharts.Series#getName
     *
     * @return {string}
     * The series name.
     */
    public getName(): string {
        // #4119
        return pick(
            this.options.name,
            'Series ' + ((this.index as any) + 1)
        );
    }

    /**
     * @private
     * @function Highcharts.Series#getCyclic
     */
    public getCyclic(
        prop: 'color'|'symbol',
        value?: any,
        defaults?: AnyRecord
    ): void {
        const chart = this.chart,
            indexName: 'colorIndex'|'symbolIndex' = `${prop}Index`,
            counterName: 'colorCounter'|'symbolCounter' = `${prop}Counter`,
            len = (
                // Symbol count
                defaults?.length ||
                // Color count
                chart.options.chart.colorCount
            );
        let i: number|undefined,
            setting: number|undefined;

        if (!value) {
            // Pick up either the colorIndex option, or the series.colorIndex
            // after Series.update()
            setting = pick(
                prop === 'color' ? this.options.colorIndex : void 0,
                this[indexName]
            );
            if (defined(setting)) { // After Series.update()
                i = setting;
            } else {
                // #6138
                if (!chart.series.length) {
                    chart[counterName] = 0;
                }
                i = chart[counterName] % len;
                chart[counterName] += 1;
            }
            if (defaults) {
                value = defaults[i];
            }
        }
        // Set the colorIndex
        if (typeof i !== 'undefined') {
            this[indexName] = i;
        }
        this[prop] = value;
    }

    /**
     * Get the series' color based on either the options or pulled from
     * global options.
     *
     * @private
     * @function Highcharts.Series#getColor
     */
    public getColor(): void {
        if (this.chart.styledMode) {
            this.getCyclic('color');

        } else if (this.options.colorByPoint) {
            this.color = Palette.neutralColor20;

        } else {
            this.getCyclic(
                'color',
                this.options.color ||
                (defaultOptions.plotOptions as any)[this.type].color,
                this.chart.options.colors
            );
        }
    }

    /**
     * Get all points' instances created for this series.
     *
     * @private
     * @function Highcharts.Series#getPointsCollection
     */
    public getPointsCollection(): Array<Point> {
        return (this.hasGroupedData ? this.points : this.data) || [];
    }

    /**
     * Get the series' symbol based on either the options or pulled from
     * global options.
     *
     * @private
     * @function Highcharts.Series#getSymbol
     */
    public getSymbol(): void {
        const seriesMarkerOption = this.options.marker;

        this.getCyclic(
            'symbol',
            (seriesMarkerOption as any).symbol,
            this.chart.options.symbols
        );
    }

    /**
     * Shorthand to get one of the series' data columns from `Series.dataTable`.
     *
     * @private
     * @function Highcharts.Series#getColumn
     */
    public getColumn(
        columnName: string,
        modified?: boolean
    ): Array<number> {
        return (
            (modified ? this.dataTable.modified : this.dataTable)
                .getColumn(columnName, true) as Array<number>
        ) || [];
    }

    /**
     * Finds the index of an existing point that matches the given point
     * options.
     *
     * @private
     * @function Highcharts.Series#findPointIndex
     * @param {Highcharts.PointOptionsObject} optionsObject
     * The options of the point.
     * @param {number} fromIndex
     * The index to start searching from, used for optimizing series with
     * required sorting.
     * @return {number|undefined}
     * Returns the index of a matching point, or undefined if no match is found.
     */
    public findPointIndex(
        optionsObject: PointOptions,
        fromIndex: number
    ): (number|undefined) {
        const { id, x } = optionsObject,
            oldData = this.points,
            dataSorting = this.options.dataSorting,
            cropStart = this.cropStart || 0;

        let matchingPoint: Point|undefined,
            matchedById: boolean|undefined,
            pointIndex: number|undefined;

        if (id) {
            const item = this.chart.get(id);
            if (item instanceof Point) {
                matchingPoint = item;
            }

        } else if (
            this.linkedParent ||
            this.enabledDataSorting ||
            this.options.relativeXValue
        ) {

            let matcher = (oldPoint: Point): boolean => !oldPoint.touched &&
                oldPoint.index === optionsObject.index;

            if (dataSorting?.matchByName) {
                matcher = (oldPoint: Point): boolean => !oldPoint.touched &&
                    oldPoint.name === optionsObject.name;

            } else if (this.options.relativeXValue) {
                matcher = (oldPoint: Point): boolean => !oldPoint.touched &&
                    oldPoint.options.x === optionsObject.x;
            }

            matchingPoint = find(oldData, matcher);

            // Add unmatched point as a new point
            if (!matchingPoint) {
                return void 0;
            }
        }

        if (matchingPoint) {
            pointIndex = matchingPoint?.index;
            if (typeof pointIndex !== 'undefined') {
                matchedById = true;
            }
        }

        // Search for the same X in the existing data set
        if (typeof pointIndex === 'undefined' && isNumber(x)) {
            pointIndex = this.getColumn('x').indexOf(x as any, fromIndex);
        }

        // Reduce pointIndex if data is cropped
        if (
            pointIndex !== -1 &&
            typeof pointIndex !== 'undefined' &&
            this.cropped
        ) {
            pointIndex = pointIndex >= cropStart ?
                pointIndex - cropStart : pointIndex;
        }

        if (
            !matchedById &&
            isNumber(pointIndex) &&
            oldData[pointIndex]?.touched
        ) {
            pointIndex = void 0;
        }
        return pointIndex;
    }

    /**
     * Internal function called from setData. If the point count is the same
     * as it was, or if there are overlapping X values, just run
     * Point.update which is cheaper, allows animation, and keeps references
     * to points. This also allows adding or removing points if the X-es
     * don't match.
     *
     * @private
     * @function Highcharts.Series#updateData
     */
    public updateData(
        data: Array<(PointOptions|PointShortOptions)>,
        animation?: (boolean|Partial<AnimationOptions>)
    ): boolean {
        const { options, requireSorting } = this,
            dataSorting = options.dataSorting,
            oldData = this.points,
            pointsToAdd = [] as Array<(PointOptions|PointShortOptions)>,
            equalLength = data.length === oldData.length;
        let hasUpdatedByKey,
            i,
            point,
            lastIndex: number,
            succeeded = true;

        this.xIncrement = null;

        // Iterate the new data
        data.forEach((pointOptions, i): void => {
            const optionsObject = (
                    defined(pointOptions) &&
                        this.pointClass.prototype.optionsToObject.call(
                            { series: this },
                            pointOptions
                        )
                ) || {},
                { id, x } = optionsObject;

            let pointIndex;

            if (id || isNumber(x)) {
                pointIndex = this.findPointIndex(
                    optionsObject,
                    lastIndex
                );

                // Matching X not found or used already due to non-unique x
                // values (#8995), add point (but later)
                if (
                    pointIndex === -1 ||
                    typeof pointIndex === 'undefined'
                ) {
                    pointsToAdd.push(pointOptions);

                // Matching X found, update
                } else if (
                    oldData[pointIndex] &&
                    pointOptions !== options.data?.[pointIndex]
                ) {
                    oldData[pointIndex].update(
                        pointOptions,
                        false,
                        void 0,
                        false
                    );

                    // Mark it touched, below we will remove all points that
                    // are not touched.
                    oldData[pointIndex].touched = true;

                    // Speed optimize by only searching after last known
                    // index. Performs ~20% bettor on large data sets.
                    if (requireSorting) {
                        lastIndex = pointIndex + 1;
                    }
                // Point exists, no changes, don't remove it
                } else if (oldData[pointIndex]) {
                    oldData[pointIndex].touched = true;
                }

                // If the length is equal and some of the nodes had a
                // match in the same position, we don't want to remove
                // non-matches.
                if (
                    !equalLength ||
                    i !== pointIndex ||
                    dataSorting?.enabled ||
                    this.hasDerivedData
                ) {
                    hasUpdatedByKey = true;
                }
            } else {
                // Gather all points that are not matched
                pointsToAdd.push(pointOptions);
            }
        }, this);

        // Remove points that don't exist in the updated data set
        if (hasUpdatedByKey) {
            i = oldData.length;
            while (i--) {
                point = oldData[i];
                if (point && !point.touched) {
                    point.remove?.(false, animation);
                }
            }

        // If we did not find keys (ids or x-values), and the length is the
        // same, update one-to-one
        } else if (equalLength && !dataSorting?.enabled) {
            data.forEach((point, i): void => {
                // .update doesn't exist on a linked, hidden series (#3709)
                // (#10187)
                if (point !== oldData[i].y && !oldData[i].destroyed) {
                    oldData[i].update(point, false, void 0, false);
                }
            });
            // Don't add new points since those configs are used above
            pointsToAdd.length = 0;

        // Did not succeed in updating data
        } else {
            succeeded = false;
        }

        oldData.forEach((point): void => {
            if (point) {
                point.touched = false;
            }
        });

        if (!succeeded) {
            return false;
        }

        // Add new points
        pointsToAdd.forEach((point): void => {
            this.addPoint(point, false, void 0, void 0, false);
        }, this);

        const xData = this.getColumn('x');
        if (
            this.xIncrement === null &&
            xData.length
        ) {
            this.xIncrement = arrayMax(xData);
            this.autoIncrement();
        }

        return true;
    }

    public getDataColumnKeys(): Array<string> {
        return this.dataColumnKeys || ['x', ...(this.pointArrayMap || ['y'])];
    }

    /**
     * Apply a new set of data to the series and optionally redraw it. The
     * new data array is passed by reference (except in case of
     * `updatePoints`), and may later be mutated when updating the chart
     * data.
     *
     * Note the difference in behaviour when setting the same amount of
     * points, or a different amount of points, as handled by the
     * `updatePoints` parameter.
     *
     * @sample highcharts/members/series-setdata/
     *         Set new data from a button
     * @sample highcharts/members/series-setdata-pie/
     *         Set data in a pie
     * @sample stock/members/series-setdata/
     *         Set new data in Highcharts Stock
     * @sample maps/members/series-setdata/
     *         Set new data in Highmaps
     *
     * @function Highcharts.Series#setData
     *
     * @param {Array<Highcharts.PointOptionsType>} data
     *        Takes an array of data in the same format as described under
     *        `series.{type}.data` for the given series type, for example a
     *        line series would take data in the form described under
     *        [series.line.data](https://api.highcharts.com/highcharts/series.line.data).
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart after the series is altered. If
     *        doing more operations on the chart, it is a good idea to set
     *        redraw to false and call {@link Chart#redraw} after.
     *
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        When the updated data is the same length as the existing data,
     *        points will be updated by default, and animation visualizes
     *        how the points are changed. Set false to disable animation, or
     *        a configuration object to set duration or easing.
     *
     * @param {boolean} [updatePoints=true]
     *        When this is true, points will be updated instead of replaced
     *        whenever possible. This occurs a) when the updated data is the
     *        same length as the existing data, b) when points are matched
     *        by their id's, or c) when points can be matched by X values.
     *        This allows updating with animation and performs better. In
     *        this case, the original array is not passed by reference. Set
     *        `false` to prevent.
     */
    public setData(
        data: (
            Array<PointOptions|PointShortOptions>|
            DataTableOptions|
            DataTableCore|
            undefined
        ),
        redraw: boolean = true,
        animation?: (boolean|Partial<AnimationOptions>),
        updatePoints?: boolean
    ): void {
        const series = this,
            oldData = series.points,
            oldDataLength = oldData?.length || 0,
            options = series.options,
            chart = series.chart,
            dataSorting = options.dataSorting,
            xAxis = series.xAxis,
            turboThreshold = options.turboThreshold,
            table = this.dataTable,
            dataColumnKeys = this.getDataColumnKeys(),
            pointValKey = series.pointValKey || 'y',
            pointArrayMap = series.pointArrayMap || [],
            valueCount = pointArrayMap.length,
            keys = options.keys;

        let i,
            updatedData,
            indexOfX = 0,
            indexOfY = 1,
            copiedData;

        if (!chart.options.chart.allowMutatingData) { // #4259
            // Remove old reference
            if (options.data) {
                delete series.options.data;
            }
            if (series.userOptions.data) {
                delete series.userOptions.data;
            }
            copiedData = merge(true, data);

        }
        data = copiedData || data;


        const dataLength = isArray(data) && data.length || 0;

        if (dataSorting?.enabled && isArray(data)) {
            data = this.sortData(data);
        }

        // First try to run Point.update which is cheaper, allows animation, and
        // keeps references to points.
        if (
            chart.options.chart.allowMutatingData &&
            updatePoints !== false &&
            dataLength &&
            oldDataLength &&
            !series.cropped &&
            !series.hasGroupedData &&
            series.visible &&
            // Soft updating has no benefit in boost, and causes JS error
            // (#8355)
            !series.boosted &&
            isArray(data)
        ) {
            updatedData = this.updateData(data, animation);
        }

        if (!updatedData) {

            // Reset properties
            series.xIncrement = null;

            series.colorCounter = 0; // For series with colorByPoint (#1547)

            if (isArray(data)) {
                // In turbo mode, look for one- or twodimensional arrays of
                // numbers. The first and the last valid value are tested, and
                // we assume that all the rest are defined the same way.
                // Although the 'for' loops are similar, they are repeated
                // inside each if-else conditional for max performance.
                let runTurbo = turboThreshold && dataLength > turboThreshold;
                if (runTurbo) {

                    const firstPoint = series.getFirstValidPoint(data),
                        lastPoint = series.getFirstValidPoint(
                            data, dataLength - 1, -1
                        ),
                        isShortArray = (a: unknown): a is Array<unknown> =>
                            Boolean(isArray(a) && (keys || isNumber(a[0])));

                    // Assume all points are numbers
                    if (isNumber(firstPoint) && isNumber(lastPoint)) {
                        const x: Array<number> = [],
                            valueData: Array<number|null> = [];
                        for (const value of data) {
                            x.push(this.autoIncrement());
                            valueData.push(value as number|null);
                        }
                        table.setColumns({
                            x,
                            [pointValKey]: valueData
                        });

                    // Assume all points are arrays when first point is
                    } else if (
                        isShortArray(firstPoint) &&
                        isShortArray(lastPoint)
                    ) {
                        if (valueCount) { // [x, low, high] or [x, o, h, l, c]

                            // When autoX is 1, the x is skipped: [low, high].
                            // When autoX is 0, the x is included: [x, low,
                            // high]
                            const autoX = firstPoint.length === valueCount ?
                                    1 : 0,
                                colArray = new Array(dataColumnKeys.length)
                                    .fill(0).map((): Array<number> => []);
                            for (const pt of data as number[][]) {
                                if (autoX) {
                                    colArray[0].push(this.autoIncrement());
                                }
                                for (let j = autoX; j <= valueCount; j++) {
                                    colArray[j]?.push(pt[j - autoX]);
                                }
                            }

                            table.setColumns(dataColumnKeys.reduce(
                                (columns, columnName, i):
                                DataTable.ColumnCollection => {
                                    columns[columnName] = colArray[i];
                                    return columns;
                                }, {} as DataTable.ColumnCollection));

                        } else { // [x, y]
                            if (keys) {
                                indexOfX = keys.indexOf('x');
                                indexOfY = keys.indexOf('y');

                                indexOfX = indexOfX >= 0 ? indexOfX : 0;
                                indexOfY = indexOfY >= 0 ? indexOfY : 1;
                            }

                            if (firstPoint.length === 1) {
                                indexOfY = 0;
                            }

                            const xData: Array<number> = [],
                                valueData: Array<number|null> = [];

                            if (indexOfX === indexOfY) {
                                for (const pt of data) {
                                    xData.push(this.autoIncrement());
                                    valueData.push((pt as any)[indexOfY]);
                                }
                            } else {
                                for (const pt of data) {
                                    xData.push((pt as any)[indexOfX]);
                                    valueData.push((pt as any)[indexOfY]);
                                }
                            }
                            table.setColumns({
                                x: xData,
                                [pointValKey]: valueData
                            });
                        }
                    } else {
                        // Highcharts expects configs to be numbers or arrays in
                        // turbo mode
                        runTurbo = false;
                    }
                }

                if (!runTurbo) {
                    const columns = {
                        x: []
                    } as DataTable.ColumnCollection;
                    for (i = 0; i < dataLength; i++) {
                        const pt = series.pointClass.prototype.applyOptions
                            .apply({ series }, [data[i]]);
                        columns.x[i] = pt.x;
                        for (const key of Object.keys(pt.options)) {
                            if (key !== 'x') {
                                columns[key] ||= new Array(dataLength);
                                columns[key][i] = (pt as any).options[key];
                            }
                        }
                        // Needed for 3d scatter because x is not part of
                        // options, but appended in the `applyOptions` call
                        // itself. z in pt is for scatter, indexOf is for
                        // bubbles. Find a better solution for this.
                        if ('z' in pt || dataColumnKeys.indexOf('z') !== -1) {
                            columns.z ||= new Array(dataLength);
                            columns.z[i] = pt.z;
                        }
                    }

                    table.setColumns(columns);
                }

            // Data table passed as option
            } else {
                const dataTable = data || chart.dataTable,
                    columnAssignment = options.columnAssignment,
                    keys = dataColumnKeys.slice();

                // Extend the data column keys with the keys from the column
                // assignment
                if (columnAssignment) {
                    columnAssignment?.forEach((assignment): void => {
                        pushUnique(keys, assignment.key);
                    });
                    this.dataColumnKeys = keys;
                }

                // Resolve column assignment
                const getTableSpecificColumns = (
                    dataTable?: DataTableCore|DataTableOptions
                ): DataTableCore.ColumnCollection => keys
                    .reduce((acc, key): DataTableCore.ColumnCollection => {
                        const assignment = columnAssignment?.find(
                            (assignment): boolean => assignment.key === key
                        );
                        acc[key] = dataTable?.columns?.[
                            assignment?.columnName || key
                        ] || [];
                        return acc;
                    }, {} as DataTableCore.ColumnCollection);

                // If a DataTable is passed and no column assignment is set,
                // use it directly
                if (columnAssignment || !options.dataTable) {
                    // Set the columns
                    const columns = getTableSpecificColumns(dataTable);
                    table.setColumns(columns);
                }

                // If a DataTable is passed directly by reference, bind events
                // to keep the series updated
                if (dataTable instanceof DataTableCore) {

                    const queueRedraw = (): void => {
                        clearTimeout(chart.redrawTimeout);
                        chart.redrawTimeout = setTimeout(
                            (): void => chart.redraw(),
                            0
                        );
                    };

                    addEvent(
                        dataTable,
                        'afterSetRows',
                        (e: DataTableCore.RowEvent): void => {
                            const row = dataTable.getRow.call({
                                    columns: getTableSpecificColumns(dataTable)
                                }, e.rowIndex),
                                point = this.points[e.rowIndex];

                            if (row) {
                                if (point) {
                                    point.update(
                                        row as unknown as PointOptions,
                                        false
                                    );
                                } else {
                                    this.addPoint(
                                        row as unknown as PointOptions,
                                        false
                                    );
                                }

                                queueRedraw();
                            }
                        }
                    );

                    addEvent(
                        dataTable,
                        'afterDeleteRows',
                        (e: DataTableCore.RowEvent): void => {
                            const { rowCount, rowIndex } = e;

                            for (
                                let i = rowIndex + rowCount - 1;
                                i >= rowIndex;
                                i--
                            ) {
                                this.removePoint(i, false);
                            }

                            queueRedraw();
                        }
                    );
                }
            }

            // Test for DataTable-based data handling
            if (this.useDataTable) {
                /* eslint-disable-next-line no-console */
                console.group(`@setData: ${series.name}, ${table.rowCount} rows`);
                table.log(10);
                /* eslint-disable-next-line no-console */
                console.groupEnd();
                data = void 0;
            }

            // Forgetting to cast strings to numbers is a common caveat when
            // handling CSV or JSON
            if (isString(this.getColumn('y')[0])) {
                error(14, true, chart);
            }

            series.data = [];
            if (isArray(data)) {
                series.options.data = series.userOptions.data = data;
            }

            // Destroy old points
            i = oldDataLength;
            while (i--) {
                oldData[i]?.destroy();
            }

            // Reset minRange (#878)
            if (xAxis) {
                xAxis.minRange = xAxis.userMinRange;
            }

            // Redraw
            series.isDirty = chart.isDirtyBox = true;
            series.isDirtyData = !!oldData;
            animation = false;
        }

        // Typically for pie series, points need to be processed and
        // generated prior to rendering the legend
        if (options.legendType === 'point') {
            this.processData();
            this.generatePoints();
        }

        if (redraw) {
            chart.redraw(animation);
        }
    }

    /**
     * Internal function to sort series data
     *
     * @private
     * @function Highcharts.Series#sortData
     * @param {Array<Highcharts.PointOptionsType>} data
     * Force data grouping.
     */
    public sortData(
        data: Array<(PointOptions|PointShortOptions)>
    ): Array<PointOptions> {
        const series = this,
            options = series.options,
            dataSorting: SeriesDataSortingOptions = options.dataSorting as any,
            sortKey = dataSorting.sortKey || 'y',
            getPointOptionsObject = function (
                series: Series,
                pointOptions: (PointOptions|PointShortOptions)
            ): PointOptions {
                return (defined(pointOptions) &&
                    series.pointClass.prototype.optionsToObject.call({
                        series: series
                    }, pointOptions)) || {};
            };

        data.forEach(function (pointOptions, i): void {
            data[i] = getPointOptionsObject(series, pointOptions);
            (data[i] as any).index = i;
        }, this);

        // Sorting
        const sortedData: Array<Point> = data.concat().sort((a, b): number => {
            const aValue = getNestedProperty(
                sortKey,
                a
            ) as (boolean|number|string);
            const bValue = getNestedProperty(
                sortKey,
                b
            ) as (boolean|number|string);
            return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
        }) as Array<Point>;
        // Set x value depending on the position in the array
        sortedData.forEach(function (point, i): void {
            point.x = i;
        }, this);

        // Set the same x for linked series points if they don't have their
        // own sorting
        if (series.linkedSeries) {
            series.linkedSeries.forEach(function (linkedSeries): void {
                const options = linkedSeries.options,
                    seriesData = options.data as Array<PointOptions>;

                if (
                    !options.dataSorting?.enabled &&
                    seriesData
                ) {
                    seriesData.forEach(function (pointOptions, i): void {
                        seriesData[i] = getPointOptionsObject(
                            linkedSeries,
                            pointOptions
                        );

                        if (data[i]) {
                            seriesData[i].x = (data[i] as any).x;
                            seriesData[i].index = i;
                        }
                    });

                    linkedSeries.setData(seriesData, false);
                }
            });
        }

        return data as any;
    }

    /**
     * Internal function to process the data by cropping away unused data
     * points if the series is longer than the crop threshold. This saves
     * computing time for large series.
     *
     * @private
     * @function Highcharts.Series#getProcessedData
     * @param {boolean} [forceExtremesFromAll]
     * Force getting extremes of a total series data range.
     */
    public getProcessedData(
        forceExtremesFromAll?: boolean
    ): Series.ProcessedDataObject {
        const series = this,
            { dataTable: table, isCartesian, options, xAxis } = series,
            cropThreshold = options.cropThreshold,
            getExtremesFromAll =
                forceExtremesFromAll ||
                // X-range series etc, #21003
                series.getExtremesFromAll,
            logarithmic = xAxis?.logarithmic,
            dataLength = table.rowCount;

        let croppedData: Series.CropDataObject,
            cropped,
            cropStart = 0,
            xExtremes,
            min,
            max,
            xData: Array<number>|TypedArray = series.getColumn('x'),
            modified = table,
            updatingNames = false;

        if (xAxis) {
            // Corrected for log axis (#3053)
            xExtremes = xAxis.getExtremes();
            min = xExtremes.min;
            max = xExtremes.max;
            updatingNames = !!(xAxis.categories && !xAxis.names.length);

            // Optionally filter out points outside the plot area
            if (
                isCartesian &&
                series.sorted &&
                !getExtremesFromAll &&
                (
                    !cropThreshold ||
                    dataLength > cropThreshold ||
                    series.forceCrop
                )
            ) {

                // It's outside current extremes
                if (
                    xData[dataLength - 1] < min ||
                    xData[0] > max
                ) {
                    modified = new DataTableCore();

                // Only crop if it's actually spilling out
                } else if (
                    // Don't understand why this condition is needed
                    series.getColumn(series.pointValKey || 'y').length && (
                        xData[0] < min ||
                        xData[dataLength - 1] > max
                    )
                ) {
                    croppedData = this.cropData(table, min, max);

                    modified = croppedData.modified;
                    cropStart = croppedData.start;
                    cropped = true;
                }
            }
        }

        // Find the closest distance between processed points
        xData = modified.getColumn('x') as Array<number> || [];
        const closestPointRange = getClosestDistance(
            [
                logarithmic ?
                    xData.map(logarithmic.log2lin) :
                    xData
            ],

            // Unsorted data is not supported by the line tooltip, as well as
            // data grouping and navigation in Stock charts (#725) and width
            // calculation of columns (#1900). Avoid warning during the
            // premature processing pass in updateNames (#16104).
            (): false|void => (
                series.requireSorting &&
                !updatingNames &&
                error(15, false, series.chart)
            )
        );

        return {
            modified,
            cropped,
            cropStart,
            closestPointRange
        };
    }

    /**
     * Internal function to apply processed data.
     * In Highcharts Stock, this function is extended to provide data grouping.
     *
     * @private
     * @function Highcharts.Series#processData
     * @param {boolean} [force]
     * Force data grouping.
     */
    public processData(force?: boolean): (boolean|undefined) {
        const series = this,
            xAxis = series.xAxis,
            table = series.dataTable;

        // If the series data or axes haven't changed, don't go through
        // this. Return false to pass the message on to override methods
        // like in data grouping.
        if (
            series.isCartesian &&
            !series.isDirty &&
            !xAxis.isDirty &&
            !series.yAxis.isDirty &&
            !force
        ) {
            return false;
        }

        const processedData = series.getProcessedData();

        // Record the properties
        table.modified = processedData.modified;
        series.cropped = processedData.cropped; // Undefined or true
        series.cropStart = processedData.cropStart;
        series.closestPointRange = (
            series.basePointRange = processedData.closestPointRange
        );

        fireEvent(series, 'afterProcessData');
    }

    /**
     * Iterate over xData and crop values between min and max. Returns
     * object containing crop start/end cropped xData with corresponding
     * part of yData, dataMin and dataMax within the cropped range.
     *
     * @private
     * @function Highcharts.Series#cropData
     */
    public cropData(
        table: DataTableCore,
        min: number,
        max: number
    ): Series.CropDataObject {
        const xData = table.getColumn('x', true) as Array<number> || [],
            dataLength = xData.length,
            columns: DataTable.ColumnCollection = {};

        let i,
            j,
            start = 0,
            end = dataLength;

        // Iterate up to find slice start
        for (i = 0; i < dataLength; i++) {
            if (xData[i] >= min) {
                start = Math.max(0, i - 1);
                break;
            }
        }

        // Proceed to find slice end
        for (j = i; j < dataLength; j++) {
            if (xData[j] > max) {
                end = j + 1;
                break;
            }
        }

        for (const key of this.getDataColumnKeys()) {
            const column = table.getColumn(key, true);
            if (column) {
                columns[key] = column.slice(start, end);
            }
        }
        return {
            modified: new DataTableCore({ columns }),
            start,
            end
        };
    }

    /**
     * Generate the data point after the data has been processed by cropping
     * away unused points and optionally grouped in Highcharts Stock.
     *
     * @private
     * @function Highcharts.Series#generatePoints
     */
    public generatePoints(): void {
        const series = this,
            options = series.options,
            dataOptions = series.processedData || options.data,
            table = series.dataTable.modified,
            xData = series.getColumn('x', true),
            PointClass = series.pointClass,
            processedDataLength = table.rowCount,
            cropStart = series.cropStart || 0,
            hasGroupedData = series.hasGroupedData,
            keys = options.keys,
            points = [],
            groupCropStartIndex: number = (
                options.dataGrouping?.groupAll ?
                    cropStart :
                    0
            ),
            categories = series.xAxis?.categories,
            // Create a configuration object out of a data row
            dataColumnKeys = this.getDataColumnKeys();
        let dataLength,
            cursor,
            point,
            i: number,
            data = series.data,
            pOptions: PointShortOptions|PointOptions;

        if (!data && !hasGroupedData) {
            const arr = [] as Array<Point>;

            arr.length = dataOptions?.length || 0;
            data = series.data = arr;
        }

        if (keys && hasGroupedData) {
            // Grouped data has already applied keys (#6590)
            series.options.keys = false as any;
        }

        for (i = 0; i < processedDataLength; i++) {
            cursor = cropStart + i;
            if (!hasGroupedData) {
                point = data[cursor];
                if (!this.useDataTable) {
                    pOptions = dataOptions ?
                        dataOptions[cursor] :
                        table.getRowObject(
                            i,
                            dataColumnKeys
                        ) as unknown as PointOptions;
                } else {
                    pOptions = table.getRowObject(i) as unknown as PointOptions;
                }

                // #970:
                if (
                    !point &&
                    pOptions !== void 0
                ) {
                    data[cursor] = point = new PointClass(
                        series,
                        pOptions,
                        xData[i]
                    );
                }
            } else {
                // Splat the y data in case of ohlc data array
                point = new PointClass(
                    series,
                    table.getRowObject(
                        i,
                        dataColumnKeys
                    ) as unknown as PointOptions
                );

                point.dataGroup = (series.groupMap as any)[
                    groupCropStartIndex + i
                ];
                if (point.dataGroup?.options) {
                    point.options = (point.dataGroup as any).options;
                    extend(point, (point.dataGroup as any).options);
                    // Collision of props and options (#9770)
                    delete point.dataLabels;
                }
            }
            if (point) { // #6279
                /**
                 * Contains the point's index in the `Series.points` array.
                 *
                 * @name Highcharts.Point#index
                 * @type {number}
                 * @readonly
                 */
                // For faster access in Point.update
                point.index = hasGroupedData ?
                    (groupCropStartIndex + i) : cursor;
                points[i] = point;

                // Set point properties for convenient access in tooltip and
                // data labels
                point.category = categories?.[point.x] ?? point.x;
                point.key = point.name ?? point.category;

            }
        }

        // Restore keys options (#6590)
        series.options.keys = keys;

        // Hide cropped-away points - this only runs when the number of
        // points is above cropThreshold, or when switching view from
        // non-grouped data to grouped data (#637)
        if (
            data &&
            (
                processedDataLength !== (dataLength = data.length) ||
                hasGroupedData
            )
        ) {
            for (i = 0; i < dataLength; i++) {
                // When has grouped data, clear all points
                if (i === cropStart && !hasGroupedData) {
                    i += processedDataLength;
                }
                if (data[i]) {
                    data[i].destroyElements();
                    data[i].plotX = void 0; // #1003
                }
            }
        }

        /**
         * Read only. An array containing those values converted to points.
         * In case the series data length exceeds the `cropThreshold`, or if
         * the data is grouped, `series.data` doesn't contain all the
         * points. Also, in case a series is hidden, the `data` array may be
         * empty. In case of cropping, the `data` array may contain `undefined`
         * values, instead of points. To access raw values,
         * `series.options.data` will always be up to date. `Series.data` only
         * contains the points that have been created on demand. To modify the
         * data, use
         * {@link Highcharts.Series#setData} or
         * {@link Highcharts.Point#update}.
         *
         * @see Series.points
         *
         * @name Highcharts.Series#data
         * @type {Array<Highcharts.Point>}
         */
        series.data = data;

        /**
         * An array containing all currently visible point objects. In case
         * of cropping, the cropped-away points are not part of this array.
         * The `series.points` array starts at `series.cropStart` compared
         * to `series.data` and `series.options.data`. If however the series
         * data is grouped, these can't be correlated one to one. To modify
         * the data, use {@link Highcharts.Series#setData} or
         * {@link Highcharts.Point#update}.
         *
         * @name Highcharts.Series#points
         * @type {Array<Highcharts.Point>}
         */
        series.points = points;

        fireEvent(this, 'afterGeneratePoints');
    }

    /**
     * Get current X extremes for the visible data.
     *
     * @private
     * @function Highcharts.Series#getXExtremes
     * @param {Array<number>} xData
     * The data to inspect. Defaults to the current data within the visible
     * range.
     */
    public getXExtremes(xData: Array<number>|TypedArray): RangeSelector.RangeObject {
        return {
            min: arrayMin(xData),
            max: arrayMax(xData)
        };
    }

    /**
     * Calculate Y extremes for the visible data. The result is returned
     * as an object with `dataMin` and `dataMax` properties.
     *
     * @private
     * @function Highcharts.Series#getExtremes
     * @param {Array<number>} [yData]
     * The data to inspect. Defaults to the current data within the visible
     * range.
     * @param {boolean} [forceExtremesFromAll]
     * Force getting extremes of a total series data range.
     */
    public getExtremes(
        yData?: (
            Array<(number|null)>|
            Array<Array<(number|null)>>|
            TypedArray
        ),
        forceExtremesFromAll?: boolean
    ): DataExtremesObject {
        const { xAxis, yAxis } = this,
            getExtremesFromAll =
                forceExtremesFromAll ||
                this.getExtremesFromAll ||
                this.options.getExtremesFromAll, // #4599, #21003
            table = getExtremesFromAll && this.cropped ?
                this.dataTable :
                this.dataTable.modified,
            rowCount = table.rowCount,
            customData = yData || this.stackedYData,
            yAxisData = customData ?
                [customData] :
                (this.keysAffectYAxis || this.pointArrayMap || ['y'])?.map(
                    (key): DataTable.Column => table.getColumn(key, true) || []
                ) || [],
            xData = this.getColumn('x', true),
            activeYData: number[] = [],
            // Handle X outside the viewed area. This does not work with
            // non-sorted data like scatter (#7639).
            shoulder = this.requireSorting && !this.is('column') ?
                1 : 0,
            // #2117, need to compensate for log X axis
            positiveValuesOnly = yAxis ? yAxis.positiveValuesOnly : false,
            doAll = getExtremesFromAll ||
                this.cropped ||
                !xAxis; // For colorAxis support

        let xExtremes,
            x,
            i,
            xMin = 0,
            xMax = 0;

        if (xAxis) {
            xExtremes = xAxis.getExtremes();
            xMin = xExtremes.min;
            xMax = xExtremes.max;
        }

        for (i = 0; i < rowCount; i++) {

            x = xData[i];

            // Check if it is within the selected x axis range
            if (
                doAll ||
                (
                    (xData[i + shoulder] || x) >= xMin &&
                    (xData[i - shoulder] || x) <= xMax
                )
            ) {
                for (const values of yAxisData) {
                    const val = values[i];

                    // For points within the visible range, including the
                    // first point outside the visible range (#7061),
                    // consider y extremes.
                    if (
                        isNumber(val) &&
                        (val > 0 || !positiveValuesOnly)
                    ) {
                        activeYData.push(val);
                    }
                }
            }
        }

        const dataExtremes = {
            activeYData, // Needed for Stock Cumulative Sum
            dataMin: arrayMin(activeYData),
            dataMax: arrayMax(activeYData)
        };

        fireEvent(this, 'afterGetExtremes', { dataExtremes });

        return dataExtremes;
    }

    /**
     * Set the current data extremes as `dataMin` and `dataMax` on the
     * Series item. Use this only when the series properties should be
     * updated.
     *
     * @private
     * @function Highcharts.Series#applyExtremes
     */
    public applyExtremes(): DataExtremesObject {
        const dataExtremes = this.getExtremes();

        /**
         * Contains the minimum value of the series' data point. Some series
         * types like `networkgraph` do not support this property as they
         * lack a `y`-value.
         * @name Highcharts.Series#dataMin
         * @type {number|undefined}
         * @readonly
         */
        this.dataMin = dataExtremes.dataMin;

        /**
         * Contains the maximum value of the series' data point. Some series
         * types like `networkgraph` do not support this property as they
         * lack a `y`-value.
         * @name Highcharts.Series#dataMax
         * @type {number|undefined}
         * @readonly
         */
        this.dataMax = dataExtremes.dataMax;

        return dataExtremes;
    }

    /**
     * Find and return the first non nullish point in the data
     *
     * @private
     * @function Highcharts.Series.getFirstValidPoint
     * @param {Array<Highcharts.PointOptionsType>} data
     *        Array of options for points
     * @param {number} [start=0]
     *        Index to start searching from
     * @param {number} [increment=1]
     *        Index increment, set -1 to search backwards
     */
    public getFirstValidPoint(
        data: Array<(PointOptions|PointShortOptions)>,
        start = 0,
        increment = 1
    ): (PointOptions|PointShortOptions|undefined) {
        const dataLength = data.length;
        let i = start;

        while (i >= 0 && i < dataLength) {
            if (defined(data[i])) {
                return data[i];
            }
            i += increment;
        }
    }

    /**
     * Translate data points from raw data values to chart specific
     * positioning data needed later in the `drawPoints` and `drawGraph`
     * functions. This function can be overridden in plugins and custom
     * series type implementations.
     *
     * @function Highcharts.Series#translate
     *
     * @emits Highcharts.Series#events:translate
     */
    public translate(): void {

        this.generatePoints();

        const series = this,
            options = series.options,
            stacking = options.stacking,
            xAxis = series.xAxis,
            enabledDataSorting = series.enabledDataSorting,
            yAxis = series.yAxis,
            points = series.points,
            dataLength = points.length,
            pointPlacement = series.pointPlacementToXValue(), // #7860
            dynamicallyPlaced = Boolean(pointPlacement),
            threshold = options.threshold,
            stackThreshold = options.startFromThreshold ? threshold : 0;
        let i,
            plotX,
            lastPlotX,
            stackIndicator,
            closestPointRangePx = Number.MAX_VALUE;

        /**
         * Plotted coordinates need to be within a limited range. Drawing
         * too far outside the viewport causes various rendering issues
         * (#3201, #3923, #7555).
         * @private
         */
        function limitedRange(val: number): number {
            return clamp(val, -1e9, 1e9);
        }

        // Translate each point
        for (i = 0; i < dataLength; i++) {
            const point = points[i],
                xValue = point.x;
            let stackItem: StackItem|undefined,
                stackValues: (Array<number>|undefined),
                yValue = point.y,
                lowValue = point.low;
            const stacks = stacking && yAxis.stacking?.stacks[(
                series.negStacks &&
                (yValue as any) <
                (stackThreshold ? 0 : (threshold as any)) ?
                    '-' :
                    ''
            ) + series.stackKey];

            plotX = xAxis.translate( // #3923
                xValue, false, false, false, true, pointPlacement
            );
            /**
             * The translated X value for the point in terms of pixels. Relative
             * to the X axis position if the series has one, otherwise relative
             * to the plot area. Depending on the series type this value might
             * not be defined.
             *
             * In an inverted chart the x-axis is going from the bottom to the
             * top so the `plotX` value is the number of pixels from the bottom
             * of the axis.
             *
             * @see Highcharts.Point#pos
             * @name Highcharts.Point#plotX
             * @type {number|undefined}
             */
            point.plotX = isNumber(plotX) ? correctFloat( // #5236
                limitedRange(plotX) // #3923
            ) : void 0;

            // Calculate the bottom y value for stacked series
            if (
                stacking &&
                series.visible &&
                stacks &&
                stacks[xValue]
            ) {
                stackIndicator = series.getStackIndicator(
                    stackIndicator,
                    xValue,
                    series.index
                );

                if (!point.isNull && stackIndicator.key) {
                    stackItem = stacks[xValue];
                    stackValues = stackItem.points[stackIndicator.key];
                }

                if (stackItem && isArray(stackValues)) {
                    lowValue = stackValues[0];
                    yValue = stackValues[1];

                    if (
                        lowValue === stackThreshold &&
                        stackIndicator.key === stacks[xValue].base
                    ) {
                        lowValue = pick(
                            isNumber(threshold) ? threshold : yAxis.min
                        );
                    }

                    // #1200, #1232
                    if (
                        yAxis.positiveValuesOnly &&
                        defined(lowValue) &&
                        lowValue <= 0
                    ) {
                        lowValue = void 0;
                    }

                    point.total = point.stackTotal = pick(stackItem.total);
                    point.percentage = defined(point.y) && stackItem.total ?
                        (point.y / stackItem.total * 100) : void 0;
                    point.stackY = yValue;

                    // In case of variwide series (where widths of points are
                    // different in most cases), stack labels are positioned
                    // wrongly, so the call of the setOffset is omitted here and
                    // labels are correctly positioned later, at the end of the
                    // variwide's translate function (#10962)
                    if (!(series as any).irregularWidths) {
                        stackItem.setOffset(
                            series.pointXOffset || 0,
                            series.barW || 0,
                            void 0,
                            void 0,
                            void 0,
                            series.xAxis
                        );
                    }

                }
            }

            // Set translated yBottom or remove it
            point.yBottom = defined(lowValue) ?
                limitedRange(
                    yAxis.translate(lowValue, false, true, false, true)
                ) :
                void 0;

            // General hook, used for Highcharts Stock compare and cumulative
            if (series.dataModify) {
                yValue = series.dataModify.modifyValue(yValue, i);
            }

            // Set the plotY value, reset it for redraws #3201, #18422
            let plotY: number|undefined;
            if (isNumber(yValue) && point.plotX !== void 0) {
                plotY = yAxis.translate(yValue, false, true, false, true);
                plotY = isNumber(plotY) ? limitedRange(plotY) : void 0;
            }
            /**
             * The translated Y value for the point in terms of pixels. Relative
             * to the Y axis position if the series has one, otherwise relative
             * to the plot area. Depending on the series type this value might
             * not be defined.
             *
             * In an inverted chart the y-axis is going from right to left
             * so the `plotY` value is the number of pixels from the right
             * of the `yAxis`.
             *
             * @see Highcharts.Point#pos
             * @name Highcharts.Point#plotY
             * @type {number|undefined}
             */
            point.plotY = plotY;

            point.isInside = this.isPointInside(point);

            // Set client related positions for mouse tracking
            point.clientX = dynamicallyPlaced ?
                correctFloat(xAxis.translate(
                    xValue,
                    false,
                    false,
                    false,
                    true,
                    pointPlacement
                )) :
                plotX; // #1514, #5383, #5518

            // Negative points #19028
            point.negative = (point.y || 0) < (threshold || 0);

            // Determine auto enabling of markers (#3635, #5099)
            if (!point.isNull && point.visible !== false) {
                if (typeof lastPlotX !== 'undefined') {
                    closestPointRangePx = Math.min(
                        closestPointRangePx,
                        Math.abs(plotX - lastPlotX)
                    );
                }
                lastPlotX = plotX;
            }

            // Find point zone
            point.zone = this.zones.length ? point.getZone() : void 0;

            // Animate new points with data sorting
            if (!point.graphic && series.group && enabledDataSorting) {
                point.isNew = true;
            }
        }
        series.closestPointRangePx = closestPointRangePx;

        fireEvent(this, 'afterTranslate');
    }

    /**
     * Return the series points with null points filtered out.
     *
     * @function Highcharts.Series#getValidPoints
     *
     * @param {Array<Highcharts.Point>} [points]
     * The points to inspect, defaults to {@link Series.points}.
     *
     * @param {boolean} [insideOnly=false]
     * Whether to inspect only the points that are inside the visible view.
     *
     * @param {boolean} [allowNull=false]
     * Whether to allow null points to pass as valid points.
     *
     * @return {Array<Highcharts.Point>}
     * The valid points.
     */
    public getValidPoints(
        points?: Array<Point>,
        insideOnly?: boolean,
        allowNull?: boolean
    ): Array<Point> {
        const chart = this.chart;

        // #3916, #5029, #5085
        return (points || this.points || []).filter(
            function (point: Point): boolean {
                const { plotX, plotY } = point,
                    // Undefined plotY is treated as null when negative values
                    // in log axis (#18422)
                    asNull = !allowNull && (point.isNull || !isNumber(plotY));
                if (
                    asNull || (
                        insideOnly && !chart.isInsidePlot(
                            plotX as any,
                            plotY as any,
                            { inverted: chart.inverted }
                        )
                    )
                ) {
                    return false;
                }
                return point.visible !== false;
            }
        );
    }

    /**
     * Get the clipping for the series. Could be called for a series to
     * initiate animating the clip or to set the final clip (only width
     * and x).
     *
     * @private
     * @function Highcharts.Series#getClip
     */
    public getClipBox(): BBoxObject {
        const { chart, xAxis, yAxis } = this;

        // If no axes on the series, use global clipBox
        let { x, y, width, height } = merge(chart.clipBox);

        // Otherwise, use clipBox.width which is corrected for plotBorderWidth
        // and clipOffset
        if (xAxis && xAxis.len !== chart.plotSizeX) {
            width = xAxis.len;
        }

        if (yAxis && yAxis.len !== chart.plotSizeY) {
            height = yAxis.len;
        }

        // If the chart is inverted and the series is not invertible, the chart
        // clip box should be inverted, but not the series clip box (#20264)
        if (chart.inverted && !this.invertible) {
            [width, height] = [height, width];
        }

        return { x, y, width, height };
    }

    /**
     * Get the shared clip key, creating it if it doesn't exist.
     *
     * @private
     * @function Highcharts.Series#getSharedClipKey
     */
    public getSharedClipKey(): string {
        this.sharedClipKey = (this.options.xAxis || 0) + ',' +
            (this.options.yAxis || 0);

        return this.sharedClipKey;
    }

    /**
     * Set the clipping for the series. For animated series the clip is later
     * modified.
     *
     * @private
     * @function Highcharts.Series#setClip
     */
    public setClip(): void {
        const { chart, group, markerGroup } = this,
            sharedClips = chart.sharedClips,
            renderer = chart.renderer,
            clipBox = this.getClipBox(),
            sharedClipKey = this.getSharedClipKey(); // #4526

        let clipRect = sharedClips[sharedClipKey];

        // If a clipping rectangle for the same set of axes does not exist,
        // create it
        if (!clipRect) {
            sharedClips[sharedClipKey] = clipRect = renderer.clipRect(clipBox);

        // When setting chart size, or when the series is rendered again before
        // starting animating, in compliance to a responsive rule
        } else {
            clipRect.animate(clipBox);
        }

        if (group) {
            // When clip is false, reset to no clip after animation
            group.clip(this.options.clip === false ? void 0 : clipRect);
        }

        // Unclip temporary animation clip
        if (markerGroup) {
            markerGroup.clip();
        }
    }

    /**
     * Animate in the series. Called internally twice. First with the `init`
     * parameter set to true, which sets up the initial state of the
     * animation. Then when ready, it is called with the `init` parameter
     * undefined, in order to perform the actual animation.
     *
     * @function Highcharts.Series#animate
     *
     * @param {boolean} [init]
     * Initialize the animation.
     */
    public animate(init?: boolean): void {
        const { chart, group, markerGroup } = this,
            inverted = chart.inverted,
            animation = animObject(this.options.animation),
            // The key for temporary animation clips
            animationClipKey = [
                this.getSharedClipKey(),
                animation.duration,
                animation.easing,
                animation.defer
            ].join(',');

        let animationClipRect = chart.sharedClips[animationClipKey],
            markerAnimationClipRect = chart.sharedClips[animationClipKey + 'm'];

        // Initialize the animation. Set up the clipping rectangle.
        if (init && group) {
            const clipBox = this.getClipBox();

            // Create temporary animation clips
            if (!animationClipRect) {
                clipBox.width = 0;
                if (inverted) {
                    clipBox.x = chart.plotHeight;
                }
                animationClipRect = chart.renderer.clipRect(clipBox);
                chart.sharedClips[animationClipKey] = animationClipRect;

                // The marker clip box. The number 99 is a safe margin to avoid
                // markers being clipped during animation.
                const markerClipBox = {
                    x: inverted ? -99 : -99,
                    y: inverted ? -99 : -99,
                    width: inverted ? chart.plotWidth + 199 : 99,
                    height: inverted ? 99 : chart.plotHeight + 199
                };

                markerAnimationClipRect = chart.renderer.clipRect(
                    markerClipBox
                );
                chart.sharedClips[
                    animationClipKey + 'm'
                ] = markerAnimationClipRect;
            } else {
                // When height changes during animation, typically due to
                // responsive settings
                animationClipRect.attr('height', clipBox.height);
            }

            group.clip(animationClipRect);
            markerGroup?.clip(markerAnimationClipRect);


        // Run the animation
        } else if (
            animationClipRect &&
            // Only first series in this pane
            !animationClipRect.hasClass('highcharts-animating')
        ) {
            const finalBox = this.getClipBox(),
                step = animation.step;

            // Only do this when there are actually markers, or we have multiple
            // series (#20473)
            if (
                markerGroup?.element.childNodes.length ||
                chart.series.length > 1
            ) {

                // To provide as smooth animation as possible, update the marker
                // group clipping in steps of the main group animation
                animation.step = function (val, fx): void {
                    if (step) {
                        step.apply(fx, arguments);
                    }
                    if (
                        fx.prop === 'width' &&
                        markerAnimationClipRect?.element
                    ) {
                        markerAnimationClipRect.attr(
                            inverted ? 'height' : 'width',
                            val + 99
                        );
                    }
                };
            }
            animationClipRect
                .addClass('highcharts-animating')
                .animate(finalBox, animation);
        }
    }

    /**
     * This runs after animation to land on the final plot clipping.
     *
     * @private
     * @function Highcharts.Series#afterAnimate
     *
     * @emits Highcharts.Series#event:afterAnimate
     */
    public afterAnimate(): void {
        this.setClip();

        // Destroy temporary clip rectangles that are no longer in use
        objectEach(this.chart.sharedClips, (clip, key, sharedClips): void => {
            if (clip && !this.chart.container.querySelector(
                `[clip-path="url(#${clip.id})"]`
            )) {
                clip.destroy();
                delete sharedClips[key];
            }
        });

        this.finishedAnimating = true;
        fireEvent(this, 'afterAnimate');
    }

    /**
     * Draw the markers for line-like series types, and columns or other
     * graphical representation for {@link Point} objects for other series
     * types. The resulting element is typically stored as
     * {@link Point.graphic}, and is created on the first call and updated
     * and moved on subsequent calls.
     *
     * @function Highcharts.Series#drawPoints
     */
    public drawPoints(points: Array<Point> = this.points): void {
        const series = this,
            chart = series.chart,
            styledMode = chart.styledMode,
            { colorAxis, options } = series,
            seriesMarkerOptions = options.marker,
            markerGroup = series[series.specialGroup || 'markerGroup'],
            xAxis = series.xAxis,
            globallyEnabled = pick(
                (seriesMarkerOptions as any).enabled,
                !xAxis || xAxis.isRadial ? true : null,
                // Use larger or equal as radius is null in bubbles (#6321)
                (series.closestPointRangePx as any) >= (
                    (seriesMarkerOptions as any).enabledThreshold *
                    (seriesMarkerOptions as any).radius
                )
            );
        let i,
            point,
            graphic,
            verb,
            pointMarkerOptions,
            hasPointMarker,
            markerAttribs;

        if (
            (seriesMarkerOptions as any).enabled !== false ||
            series._hasPointMarkers
        ) {

            for (i = 0; i < points.length; i++) {
                point = points[i];
                graphic = point.graphic;
                verb = graphic ? 'animate' : 'attr';
                pointMarkerOptions = point.marker || {};
                hasPointMarker = !!point.marker;
                const shouldDrawMarker = (
                    (
                        globallyEnabled &&
                        typeof pointMarkerOptions.enabled === 'undefined'
                    ) || pointMarkerOptions.enabled
                ) && !point.isNull && point.visible !== false;

                // Only draw the point if y is defined
                if (shouldDrawMarker) {
                    // Shortcuts
                    const symbol = pick(
                        pointMarkerOptions.symbol,
                        series.symbol,
                        'rect' as SymbolKey
                    );

                    markerAttribs = series.markerAttribs(
                        point,
                        (point.selected && 'select') as any
                    );

                    // Set starting position for point sliding animation.
                    if (series.enabledDataSorting) {
                        point.startXPos = xAxis.reversed ?
                            -(markerAttribs.width || 0) :
                            xAxis.width;
                    }

                    const isInside = point.isInside !== false;
                    if (
                        !graphic &&
                        isInside &&
                        ((markerAttribs.width || 0) > 0 || point.hasImage)
                    ) {

                        /**
                         * SVG graphic representing the point in the chart. In
                         * some cases it may be a hidden graphic to improve
                         * accessibility.
                         *
                         * Typically this is a simple shape, like a `rect`
                         * for column charts or `path` for line markers, but
                         * for some complex series types like boxplot or 3D
                         * charts, the graphic may be a `g` element
                         * containing other shapes. The graphic is generated
                         * the first time {@link Series#drawPoints} runs,
                         * and updated and moved on subsequent runs.
                         *
                         * @see Highcharts.Point#graphics
                         *
                         * @name Highcharts.Point#graphic
                         * @type {Highcharts.SVGElement|undefined}
                         */
                        point.graphic = graphic = chart.renderer
                            .symbol(
                                symbol,
                                markerAttribs.x,
                                markerAttribs.y,
                                markerAttribs.width,
                                markerAttribs.height,
                                hasPointMarker ?
                                    pointMarkerOptions :
                                    seriesMarkerOptions
                            )
                            .add(markerGroup);
                        // Sliding animation for new points
                        if (
                            series.enabledDataSorting &&
                            chart.hasRendered
                        ) {
                            graphic.attr({
                                x: point.startXPos
                            });
                            verb = 'animate';
                        }
                    }

                    if (graphic && verb === 'animate') { // Update
                        // Since the marker group isn't clipped, each
                        // individual marker must be toggled
                        graphic[isInside ? 'show' : 'hide'](isInside)
                            .animate(markerAttribs);

                    }

                    // Presentational attributes
                    if (graphic) {
                        const pointAttr = series.pointAttribs(
                            point,
                            (
                                (styledMode || !point.selected) ?
                                    void 0 :
                                    'select'
                            )
                        );

                        if (!styledMode) {
                            graphic[verb](pointAttr);
                        } else if (colorAxis) { // #14114
                            graphic['css']({
                                fill: pointAttr.fill
                            });
                        }
                    }

                    if (graphic) {
                        graphic.addClass(point.getClassName(), true);
                    }

                } else if (graphic) {
                    point.graphic = graphic.destroy(); // #1269
                }
            }
        }
    }

    /**
     * Get non-presentational attributes for a point. Used internally for
     * both styled mode and classic. Can be overridden for different series
     * types.
     *
     * @see Series#pointAttribs
     *
     * @function Highcharts.Series#markerAttribs
     *
     * @param {Highcharts.Point} point
     * The Point to inspect.
     *
     * @param {string} [state]
     * The state, can be either `hover`, `select` or undefined.
     *
     * @return {Highcharts.SVGAttributes}
     * A hash containing those attributes that are not settable from CSS.
     */
    public markerAttribs(
        point: Point,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const seriesOptions = this.options,
            seriesMarkerOptions = seriesOptions.marker,
            pointMarkerOptions = point.marker || {},
            symbol = (
                pointMarkerOptions.symbol ||
                (seriesMarkerOptions as any).symbol
            ),
            attribs: SVGAttributes = {};

        let seriesStateOptions: SeriesStateHoverOptions,
            pointStateOptions: PointStateHoverOptions,
            radius: number|undefined = pick(
                pointMarkerOptions.radius,
                seriesMarkerOptions?.radius
            );

        // Handle hover and select states
        if (state) {
            seriesStateOptions = (seriesMarkerOptions as any).states[state];
            pointStateOptions = pointMarkerOptions.states &&
                (pointMarkerOptions.states as any)[state];

            radius = pick(
                pointStateOptions?.radius,
                seriesStateOptions?.radius,
                radius && radius + (
                    seriesStateOptions?.radiusPlus ||
                    0
                )
            );
        }

        point.hasImage = symbol && symbol.indexOf('url') === 0;

        if (point.hasImage) {
            radius = 0; // And subsequently width and height is not set
        }

        const pos = point.pos();
        if (isNumber(radius) && pos) {
            if (seriesOptions.crisp) {
                pos[0] = crisp(
                    pos[0],
                    point.hasImage ?
                        0 :
                        symbol === 'rect' ?
                            // Rectangle symbols need crisp edges, others don't
                            seriesMarkerOptions?.lineWidth || 0 :
                            1
                );
            }
            attribs.x = pos[0] - radius;
            attribs.y = pos[1] - radius;
        }

        if (radius) {
            attribs.width = attribs.height = 2 * radius;
        }

        return attribs;
    }

    /**
     * Internal function to get presentational attributes for each point.
     * Unlike {@link Series#markerAttribs}, this function should return
     * those attributes that can also be set in CSS. In styled mode,
     * `pointAttribs` won't be called.
     *
     * @private
     * @function Highcharts.Series#pointAttribs
     *
     * @param {Highcharts.Point} [point]
     * The point instance to inspect.
     *
     * @param {string} [state]
     * The point state, can be either `hover`, `select` or 'normal'. If
     * undefined, normal state is assumed.
     *
     * @return {Highcharts.SVGAttributes}
     * The presentational attributes to be set on the point.
     */
    public pointAttribs(
        point?: Point,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const seriesMarkerOptions = this.options.marker,
            pointOptions = point?.options,
            pointMarkerOptions = pointOptions?.marker || {},
            pointColorOption = pointOptions?.color,
            pointColor = point?.color,
            zoneColor = point?.zone?.color;
        let seriesStateOptions,
            pointStateOptions,
            color: (ColorType|undefined) = this.color,
            fill,
            stroke,
            strokeWidth = pick(
                pointMarkerOptions.lineWidth,
                (seriesMarkerOptions as any).lineWidth
            ),
            opacity = 1;

        color = (
            pointColorOption ||
            zoneColor ||
            pointColor ||
            color
        );

        fill = (
            pointMarkerOptions.fillColor ||
            (seriesMarkerOptions as any).fillColor ||
            color
        );
        stroke = (
            pointMarkerOptions.lineColor ||
            (seriesMarkerOptions as any).lineColor ||
            color
        );

        // Handle hover and select states
        state = state || 'normal';
        if (state) {
            seriesStateOptions = (
                (seriesMarkerOptions as any).states[state] || {}
            );
            pointStateOptions = (
                pointMarkerOptions.states &&
                (pointMarkerOptions.states as any)[state]
            ) || {};
            strokeWidth = pick(
                pointStateOptions.lineWidth,
                seriesStateOptions.lineWidth,
                strokeWidth + pick(
                    pointStateOptions.lineWidthPlus,
                    seriesStateOptions.lineWidthPlus,
                    0
                )
            );
            fill = (
                pointStateOptions.fillColor ||
                seriesStateOptions.fillColor ||
                fill
            );
            stroke = (
                pointStateOptions.lineColor ||
                seriesStateOptions.lineColor ||
                stroke
            );

            opacity = pick(
                pointStateOptions.opacity,
                seriesStateOptions.opacity,
                opacity
            );
        }

        return {
            'stroke': stroke,
            'stroke-width': strokeWidth,
            'fill': fill,
            'opacity': opacity
        };
    }

    /**
     * Clear DOM objects and free up memory.
     *
     * @private
     * @function Highcharts.Series#destroy
     *
     * @emits Highcharts.Series#event:destroy
     */
    public destroy(keepEventsForUpdate?: boolean): void {

        const series = this,
            chart = series.chart,
            issue134 = /AppleWebKit\/533/.test(win.navigator.userAgent),
            data = series.data || [];
        let destroy: ('hide'|'destroy'),
            i,
            axis;

        // Add event hook
        fireEvent(series, 'destroy', { keepEventsForUpdate });

        // Remove events
        this.removeEvents(keepEventsForUpdate);

        // Erase from axes
        (series.axisTypes || []).forEach(function (AXIS: string): void {
            axis = (series as any)[AXIS];
            if (axis?.series) {
                erase(axis.series, series);
                axis.isDirty = axis.forceRedraw = true;
            }
        });

        // Remove legend items
        if (series.legendItem) {
            series.chart.legend.destroyItem(series);
        }

        // Destroy all points with their elements
        i = data.length;
        while (i--) {
            data[i]?.destroy?.();
        }

        for (const zone of series.zones) {
            // Destroy SVGElement's but preserve primitive props (#20426)
            destroyObjectProperties(zone, void 0, true);
        }

        // Clear the animation timeout if we are destroying the series
        // during initial animation
        U.clearTimeout(series.animationTimeout as any);

        // Destroy all SVGElements associated to the series
        objectEach(series, function (val: any, prop: string): void {
            // Survive provides a hook for not destroying
            if (val instanceof SVGElement && !val.survive) {

                // Issue 134 workaround
                destroy = issue134 && prop === 'group' ?
                    'hide' :
                    'destroy';

                val[destroy]();
            }
        });

        // Remove from hoverSeries
        if (chart.hoverSeries === series) {
            chart.hoverSeries = void 0;
        }
        erase(chart.series, series);
        chart.orderItems('series');

        // Clear all members
        objectEach(series, function (val: any, prop: string): void {
            if (!keepEventsForUpdate || prop !== 'hcEvents') {
                delete (series as any)[prop];
            }
        });
    }

    /**
     * Clip the graphs into zones for colors and styling.
     *
     * @private
     * @function Highcharts.Series#applyZones
     */
    public applyZones(): void {
        const series = this,
            {
                area,
                chart,
                graph,
                zones,
                points,
                xAxis,
                yAxis,
                zoneAxis
            } = series,
            { inverted, renderer } = chart,
            axis = this[`${zoneAxis}Axis`],
            { isXAxis, len = 0, minPointOffset = 0 } = axis || {},
            halfWidth = (graph?.strokeWidth() || 0) / 2 + 1,

            // Avoid points that are so close to the threshold that the graph
            // line would be split
            avoidClose = (
                zone: Series.ZoneObject,
                plotX: number = 0,
                plotY: number = 0
            ): void => {
                if (inverted) {
                    plotY = len - plotY;
                }
                const { translated = 0, lineClip } = zone,
                    distance = plotY - translated;

                lineClip?.push([
                    'L',
                    plotX,
                    Math.abs(distance) < halfWidth ?
                        plotY - halfWidth * (distance <= 0 ? -1 : 1) :
                        translated
                ]);
            };

        if (
            zones.length &&
            (graph || area) &&
            axis &&
            isNumber(axis.min)
        ) {

            const axisMax = axis.getExtremes().max + minPointOffset,
                // Invert the x and y coordinates of inverted charts
                invertPath = (path: SVGPath): void => {
                    path.forEach((segment, i): void => {
                        if (segment[0] === 'M' || segment[0] === 'L') {
                            path[i] = [
                                segment[0],
                                isXAxis ? len - segment[1] : segment[1],
                                isXAxis ? segment[2] : len - segment[2]
                            ];
                        }
                    });
                };

            // Reset
            zones.forEach((zone): void => {
                zone.lineClip = [];
                zone.translated = clamp(
                    axis.toPixels(
                        pick(zone.value, axisMax),
                        true
                    ) || 0,
                    0,
                    len
                );
            });

            // The use of the Color Threshold assumes there are no gaps so it is
            // safe to hide the original graph and area unless it is not
            // waterfall series, then use showLine property to set lines between
            // columns to be visible (#7862)
            if (graph && !this.showLine) {
                graph.hide();
            }
            if (area) {
                area.hide();
            }

            // Prepare for adaptive clips, avoiding segments close to the
            // threshold (#19709)
            if (
                zoneAxis === 'y' &&
                // Overheat protection
                points.length < xAxis.len
            ) {
                for (const point of points) {
                    const { plotX, plotY, zone } = point,
                        zoneBelow = zone && zones[zones.indexOf(zone) - 1];

                    // Close to upper boundary
                    if (zone) {
                        avoidClose(zone, plotX, plotY);
                    }

                    // Close to lower boundary
                    if (zoneBelow) {
                        avoidClose(zoneBelow, plotX, plotY);
                    }
                }
            }

            // Compute and apply the clips
            let lastLineClip: SVGPath = [],
                // Starting point of the first zone. Offset for category axis
                // (#22188).
                lastTranslated = axis.toPixels(
                    axis.getExtremes().min - minPointOffset,
                    true
                );

            zones.forEach((zone): void => {
                const lineClip = zone.lineClip || [],
                    translated = Math.round(zone.translated || 0);

                if (xAxis.reversed) {
                    lineClip.reverse();
                }

                let { clip, simpleClip } = zone,
                    x1 = 0,
                    y1 = 0,
                    x2 = xAxis.len,
                    y2 = yAxis.len;

                if (isXAxis) {
                    x1 = translated;
                    x2 = lastTranslated;
                } else {
                    y1 = translated;
                    y2 = lastTranslated;
                }

                // Adaptive clips
                const simplePath: SVGPath = [
                        ['M', x1, y1],
                        ['L', x2, y1],
                        ['L', x2, y2],
                        ['L', x1, y2],
                        ['Z']
                    ],
                    adaptivePath: SVGPath = [
                        simplePath[0],
                        ...lineClip,
                        simplePath[1],
                        simplePath[2],
                        ...lastLineClip,
                        simplePath[3],
                        simplePath[4]
                    ];

                lastLineClip = lineClip.reverse();
                lastTranslated = translated;

                if (inverted) {
                    invertPath(adaptivePath);
                    if (area) {
                        invertPath(simplePath);
                    }
                }

                /* Debug clip paths
                zone.path?.destroy();
                zone.path = chart.renderer.path(adaptivePath)
                    .attr({
                        stroke: zone.color || this.color || 'gray',
                        'stroke-width': 1,
                        'dashstyle': 'Dash'
                    })
                    .add(series.group);
                // */

                if (clip) {
                    clip.animate({ d: adaptivePath });
                    simpleClip?.animate({ d: simplePath });
                } else {
                    clip = zone.clip = renderer.path(adaptivePath);
                    if (area) {
                        simpleClip = zone.simpleClip = renderer.path(
                            simplePath
                        );
                    }
                }

                // When no data, graph zone is not applied and after setData
                // clip was ignored. As a result, it should be applied each
                // time.
                if (graph) {
                    zone.graph?.clip(clip);
                }

                if (area) {
                    zone.area?.clip(simpleClip);
                }
            });
        } else if (series.visible) {
            // If zones were removed, restore graph and area
            if (graph) {
                graph.show();
            }
            if (area) {
                area.show();
            }
        }
    }

    /**
     * General abstraction for creating plot groups like series.group,
     * series.dataLabelsGroup and series.markerGroup. On subsequent calls,
     * the group will only be adjusted to the updated plot size.
     *
     * @private
     * @function Highcharts.Series#plotGroup
     */
    public plotGroup(
        prop: 'group'|'markerGroup'|'dataLabelsGroup',
        name: string,
        visibility: 'hidden'|'inherit'|'visible',
        zIndex?: number,
        parent?: SVGElement
    ): SVGElement {
        let group = this[prop];

        const isNew = !group,
            attrs: SVGAttributes = {
                visibility,
                zIndex: zIndex || 0.1 // Pointer logic uses this
            };

        // Avoid setting undefined opacity, or in styled mode
        if (
            defined(this.opacity) &&
            !this.chart.styledMode && this.state !== 'inactive' // #13719
        ) {
            attrs.opacity = this.opacity;
        }

        // Generate it on first call
        if (!group) {

            this[prop] = group = this.chart.renderer
                .g()
                .add(parent);

        }

        // Add the class names, and replace existing ones as response to
        // Series.update (#6660)
        group.addClass(
            (
                'highcharts-' + name +
                ' highcharts-series-' + this.index +
                ' highcharts-' + this.type + '-series ' +
                (
                    defined(this.colorIndex) ?
                        'highcharts-color-' + this.colorIndex + ' ' :
                        ''
                ) +
                (this.options.className || '') +
                (
                    group.hasClass('highcharts-tracker') ?
                        ' highcharts-tracker' :
                        ''
                )
            ),
            true
        );

        // Place it on first and subsequent (redraw) calls
        group.attr(attrs)[isNew ? 'attr' : 'animate'](
            this.getPlotBox(name)
        );

        return group;
    }

    /**
     * Get the translation and scale for the plot area of this series.
     *
     * @function Highcharts.Series#getPlotBox
     */
    public getPlotBox(name?: string): Series.PlotBoxTransform {
        let horAxis = this.xAxis,
            vertAxis = this.yAxis;

        const chart = this.chart,
            inverted = (
                chart.inverted &&
                !chart.polar &&
                horAxis &&
                this.invertible &&
                name === 'series'
            );

        // Swap axes for inverted (#2339)
        if (chart.inverted) {
            horAxis = vertAxis;
            vertAxis = this.xAxis;
        }

        return {
            translateX: horAxis ? horAxis.left : chart.plotLeft,
            translateY: vertAxis ? vertAxis.top : chart.plotTop,
            rotation: inverted ? 90 : 0,
            rotationOriginX: inverted ?
                (horAxis.len - vertAxis.len) / 2 :
                0,
            rotationOriginY: inverted ?
                (horAxis.len + vertAxis.len) / 2 :
                0,
            scaleX: inverted ? -1 : 1, // #1623
            scaleY: 1
        };
    }

    /**
     * Removes the event handlers attached previously with addEvents.
     * @private
     * @function Highcharts.Series#removeEvents
     */
    public removeEvents(keepEventsForUpdate?: boolean): void {
        const { eventsToUnbind } = this;

        if (!keepEventsForUpdate) {
            // Remove all events
            removeEvent(this);
        }

        if (eventsToUnbind.length) {
            // Remove only internal events for proper update. #12355 solves
            // problem with multiple destroy events
            eventsToUnbind.forEach((
                unbind: Function
            ): void => {
                unbind();
            });
            eventsToUnbind.length = 0;
        }
    }

    /**
     * Render the graph and markers. Called internally when first rendering
     * and later when redrawing the chart. This function can be extended in
     * plugins, but normally shouldn't be called directly.
     *
     * @function Highcharts.Series#render
     *
     * @emits Highcharts.Series#event:afterRender
     */
    public render(): void {
        const series = this,
            { chart, options, hasRendered } = series,
            animOptions = animObject(options.animation),
            visibility: 'hidden'|'inherit'|'visible' = series.visible ?
                'inherit' : 'hidden', // #2597
            zIndex = options.zIndex,
            chartSeriesGroup = chart.seriesGroup;

        let animDuration = series.finishedAnimating ?
            0 : animOptions.duration;

        fireEvent(this, 'render');

        // The group
        series.plotGroup(
            'group',
            'series',
            visibility,
            zIndex,
            chartSeriesGroup
        );

        series.markerGroup = series.plotGroup(
            'markerGroup',
            'markers',
            visibility,
            zIndex,
            chartSeriesGroup
        );

        // Initial clipping, applies to columns etc. (#3839).
        if (options.clip !== false) {
            series.setClip();
        }

        // Initialize the animation
        if (animDuration) {
            series.animate?.(true);
        }

        // Draw the graph if any
        if ((series as unknown as LineSeries).drawGraph) {
            (series as unknown as LineSeries).drawGraph();
            series.applyZones();
        }

        // Draw the points
        if (series.visible) {
            series.drawPoints();
        }

        // Draw the data labels
        series.drawDataLabels?.();

        // In pie charts, slices are added to the DOM, but actual rendering
        // is postponed until labels reserved their space
        series.redrawPoints?.();

        // Draw the mouse tracking area
        if (options.enableMouseTracking) {
            series.drawTracker?.();
        }

        // Run the animation
        if (animDuration) {
            series.animate?.();
        }

        // Call the afterAnimate function on animation complete (but don't
        // overwrite the animation.complete option which should be available
        // to the user).
        if (!hasRendered) {
            // Additional time if defer is defined before afterAnimate
            // will be triggered
            if (animDuration && animOptions.defer) {
                animDuration += animOptions.defer;
            }
            series.animationTimeout = syncTimeout((): void => {
                series.afterAnimate();
            }, animDuration || 0);
        }

        // Means data is in accordance with what you see
        series.isDirty = false;

        // (See #322) series.isDirty = series.isDirtyData = false; // means
        // data is in accordance with what you see
        series.hasRendered = true;

        fireEvent(series, 'afterRender');
    }

    /**
     * Redraw the series. This function is called internally from
     * `chart.redraw` and normally shouldn't be called directly.
     * @private
     * @function Highcharts.Series#redraw
     */
    public redraw(): void {
        // Cache it here as it is set to false in render, but used after
        const wasDirty = this.isDirty || this.isDirtyData;

        this.translate();
        this.render();
        if (wasDirty) { // #3868, #3945
            delete this.kdTree;
        }
    }

    /**
     * Whether to reserve space for the series, either because it is visible or
     * because the `chart.ignoreHiddenSeries` option is false.
     *
     * @private
     */
    public reserveSpace(): boolean {
        return this.visible || !this.chart.options.chart.ignoreHiddenSeries;
    }

    /**
     * Find the nearest point from a pointer event. This applies to series that
     * use k-d-trees to get the nearest point. Native pointer events must be
     * normalized using `Pointer.normalize`, that adds `chartX` and `chartY`
     * properties.
     *
     * @sample highcharts/demo/synchronized-charts
     *         Synchronized charts with tooltips
     *
     * @function Highcharts.Series#searchPoint
     *
     * @param {Highcharts.PointerEvent} e
     *        The normalized pointer event
     * @param {boolean} [compareX=false]
     *        Search only by the X value, not Y
     *
     * @return {Point|undefined}
     *        The closest point to the pointer event
     */
    public searchPoint(
        e: PointerEvent,
        compareX?: boolean
    ): (Point|undefined) {
        const { xAxis, yAxis } = this,
            inverted = this.chart.inverted;

        return this.searchKDTree({
            clientX: inverted ?
                xAxis.len - e.chartY + xAxis.pos :
                e.chartX - xAxis.pos,
            plotY: inverted ?
                yAxis.len - e.chartX + yAxis.pos :
                e.chartY - yAxis.pos
        }, compareX, e);
    }

    /**
     * Build the k-d-tree that is used by mouse and touch interaction to get
     * the closest point. Line-like series typically have a one-dimensional
     * tree where points are searched along the X axis, while scatter-like
     * series typically search in two dimensions, X and Y.
     *
     * @private
     * @function Highcharts.Series#buildKDTree
     */
    public buildKDTree(e?: PointerEvent): void {

        // Prevent multiple k-d-trees from being built simultaneously
        // (#6235)
        this.buildingKdTree = true;

        const series = this,
            dimensions = (series.options.findNearestPointBy as any)
                .indexOf('y') > -1 ? 2 : 1;

        /**
         * Internal function
         * @private
         */
        function kdtree(
            points: Array<Point>,
            depth: number,
            dimensions: number
        ): (KDNode|undefined) {
            const length = points?.length;
            let axis: keyof KDPointSearchObject,
                median;

            if (length) {

                // Alternate between the axis
                axis = series.kdAxisArray[depth % dimensions];

                // Sort point array
                points.sort(
                    (a, b): number => (a[axis] || 0) - (b[axis] || 0)
                );

                median = Math.floor(length / 2);

                // Build and return node
                return {
                    point: points[median],
                    left: kdtree(
                        points.slice(0, median), depth + 1, dimensions
                    ),
                    right: kdtree(
                        points.slice(median + 1), depth + 1, dimensions
                    )
                };

            }
        }

        /**
         * Start the recursive build process with a clone of the points
         * array and null points filtered out. (#3873)
         * @private
         */
        function startRecursive(): void {
            series.kdTree = kdtree(
                series.getValidPoints(
                    void 0,
                    // For line-type series restrict to plot area, but
                    // column-type series not (#3916, #4511)
                    !series.directTouch
                ),
                dimensions,
                dimensions
            );
            series.buildingKdTree = false;
        }
        delete series.kdTree;

        // For testing tooltips, don't build async. Also if touchstart, we may
        // be dealing with click events on mobile, so don't delay (#6817).
        syncTimeout(
            startRecursive,
            series.options.kdNow || e?.type === 'touchstart' ? 0 : 1
        );
    }

    /**
     * @private
     * @function Highcharts.Series#searchKDTree
     */
    public searchKDTree(
        point: KDPointSearchObject,
        compareX?: boolean,
        e?: PointerEvent,
        suppliedPointEvaluator?: Function,
        suppliedBSideCheckEvaluator?: Function
    ): (Point|undefined) {
        const series = this,
            [kdX, kdY] = this.kdAxisArray,
            kdComparer = compareX ? 'distX' : 'dist',
            kdDimensions = (series.options.findNearestPointBy || '')
                .indexOf('y') > -1 ? 2 : 1,
            useRadius = !!series.isBubble,
            pointEvaluator = suppliedPointEvaluator || ((
                p1: Point,
                p2: Point,
                comparisonProp: 'distX' | 'dist'
            ): [Point, boolean] => [
                (p1[comparisonProp] || 0) < (p2[comparisonProp] || 0) ?
                    p1 :
                    p2,
                false
            ]),
            bSideCheckEvaluator = suppliedBSideCheckEvaluator || ((
                a: number,
                b: number
            ): boolean => a < b);

        /**
         * Set the one and two dimensional distance on the point object.
         * @private
         */
        function setDistance(
            p1: KDPointSearchObject,
            p2: Point
        ): void {
            const p1kdX = p1[kdX],
                p2kdX = p2[kdX],
                x = (defined(p1kdX) && defined(p2kdX)) ? p1kdX - p2kdX : null,
                p1kdY = p1[kdY],
                p2kdY = p2[kdY],
                y = (defined(p1kdY) && defined(p2kdY)) ? p1kdY - p2kdY : 0,
                radius = useRadius ? (p2.marker?.radius || 0) : 0;

            p2.dist = Math.sqrt(((x && x * x) || 0) + y * y) - radius;
            p2.distX = defined(x) ? (Math.abs(x) - radius) : Number.MAX_VALUE;
        }

        /**
         * @private
         */
        function doSearch(
            search: KDPointSearchObject,
            tree: KDNode,
            depth: number,
            dimensions: number
        ): Point {
            const point = tree.point,
                axis = series.kdAxisArray[depth % dimensions];
            let ret = point,
                flip = false;

            setDistance(search, point);

            // Pick side based on distance to splitting point
            const tdist = (search[axis] || 0) - (point[axis] || 0) +
                    (useRadius ? (point.marker?.radius || 0) : 0),
                sideA = tdist < 0 ? 'left' : 'right',
                sideB = tdist < 0 ? 'right' : 'left';

            // End of tree
            if (tree[sideA]) {

                [ret, flip] = pointEvaluator(
                    point,
                    doSearch(
                        search,
                        tree[sideA] as any,
                        depth + 1,
                        dimensions
                    ),
                    kdComparer
                );

            }
            if (tree[sideB]) {

                const sqrtTDist = Math.sqrt(tdist * tdist),
                    retDist = (ret as any)[kdComparer];

                // Compare distance to current best to splitting point to decide
                // whether to check side B or no
                if (bSideCheckEvaluator(sqrtTDist, retDist, flip)) {
                    ret = pointEvaluator(
                        ret,
                        doSearch(
                            search,
                            tree[sideB] as any,
                            depth + 1,
                            dimensions
                        ),
                        kdComparer
                    )[0];
                }
            }

            return ret;
        }

        if (!this.kdTree && !this.buildingKdTree) {
            this.buildKDTree(e);
        }

        if (this.kdTree) {
            return doSearch(point, this.kdTree, kdDimensions, kdDimensions);
        }
    }

    /**
     * @private
     * @function Highcharts.Series#pointPlacementToXValue
     */
    public pointPlacementToXValue(): number {
        const { options, xAxis } = this;

        let factor = options.pointPlacement;
        // Point placement is relative to each series pointRange (#5889)
        if (factor === 'between') {
            factor = xAxis.reversed ? -0.5 : 0.5; // #11955
        }

        return isNumber(factor) ?
            factor * (options.pointRange || xAxis.pointRange) :
            0;
    }

    /**
     * @private
     * @function Highcharts.Series#isPointInside
     */
    public isPointInside(point: (Record<string, number>|Point)): boolean {
        const { chart, xAxis, yAxis } = this,
            { plotX = -1, plotY = -1 } = point,
            isInside = (
                plotY >= 0 &&
                plotY <= (yAxis ? yAxis.len : chart.plotHeight) &&
                plotX >= 0 &&
                plotX <= (xAxis ? xAxis.len : chart.plotWidth)
            );

        return isInside;
    }

    /**
     * Draw the tracker object that sits above all data labels and markers to
     * track mouse events on the graph or points. For the line type charts
     * the tracker uses the same graphPath, but with a greater stroke width
     * for better control.
     * @private
     */
    public drawTracker(): void {
        const series = this,
            options = series.options,
            trackByArea = options.trackByArea,
            trackerPath = ([] as SVGPath).concat(
                (trackByArea ? series.areaPath : series.graphPath) || []
            ),
            chart = series.chart,
            pointer = chart.pointer,
            renderer = chart.renderer,
            snap = chart.options.tooltip?.snap || 0,
            onMouseOver = (): void => {
                if (
                    options.enableMouseTracking &&
                    chart.hoverSeries !== series
                ) {
                    series.onMouseOver();
                }
            },
            /*
             * Empirical lowest possible opacities for TRACKER_FILL for an
             * element to stay invisible but clickable
             * IE9: 0.00000000001 (unlimited)
             * IE10: 0.0001 (exporting only)
             * FF: 0.00000000001 (unlimited)
             * Chrome: 0.000001
             * Safari: 0.000001
             * Opera: 0.00000000001 (unlimited)
             */
            TRACKER_FILL = 'rgba(192,192,192,' + (svg ? 0.0001 : 0.002) + ')';

        let tracker = series.tracker;

        // Draw the tracker
        if (tracker) {
            tracker.attr({ d: trackerPath });
        } else if (series.graph) { // Create

            series.tracker = tracker = renderer.path(trackerPath)
                .attr({
                    visibility: series.visible ? 'inherit' : 'hidden',
                    zIndex: 2
                })
                .addClass(
                    trackByArea ?
                        'highcharts-tracker-area' :
                        'highcharts-tracker-line'
                )
                .add(series.group);

            if (!chart.styledMode) {
                tracker.attr({
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round', // #1225
                    stroke: TRACKER_FILL,
                    fill: trackByArea ? TRACKER_FILL : 'none',
                    'stroke-width': series.graph.strokeWidth() +
                        (trackByArea ? 0 : 2 * snap)
                });
            }

            // The tracker is added to the series group, which is clipped, but
            // is covered by the marker group. So the marker group also needs to
            // capture events.
            [
                series.tracker,
                series.markerGroup,
                series.dataLabelsGroup
            ].forEach((tracker?: SVGElement): void => {
                if (tracker) {
                    tracker.addClass('highcharts-tracker')
                        .on('mouseover', onMouseOver)
                        .on('mouseout', (e: PointerEvent): void => {
                            pointer?.onTrackerMouseOut(e);
                        });

                    if (options.cursor && !chart.styledMode) {
                        tracker.css({ cursor: options.cursor });
                    }

                    tracker.on('touchstart', onMouseOver);
                }
            });
        }
        fireEvent(this, 'afterDrawTracker');
    }

    /**
     * Add a point to the series after render time. The point can be added at
     * the end, or by giving it an X value, to the start or in the middle of the
     * series.
     *
     * @sample highcharts/members/series-addpoint-append/
     *         Append point
     * @sample highcharts/members/series-addpoint-append-and-shift/
     *         Append and shift
     * @sample highcharts/members/series-addpoint-x-and-y/
     *         Both X and Y values given
     * @sample highcharts/members/series-addpoint-pie/
     *         Append pie slice
     * @sample stock/members/series-addpoint/
     *         Append 100 points in Highcharts Stock
     * @sample stock/members/series-addpoint-shift/
     *         Append and shift in Highcharts Stock
     * @sample maps/members/series-addpoint/
     *         Add a point in Highmaps
     *
     * @function Highcharts.Series#addPoint
     *
     * @param {Highcharts.PointOptionsType} options
     *        The point options. If options is a single number, a point with
     *        that y value is appended to the series. If it is an array, it will
     *        be interpreted as x and y values respectively. If it is an
     *        object, advanced options as outlined under `series.data` are
     *        applied.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart after the point is added. When adding
     *        more than one point, it is highly recommended that the redraw
     *        option be set to false, and instead {@link Chart#redraw} is
     *        explicitly called after the adding of points is finished.
     *        Otherwise, the chart will redraw after adding each point.
     *
     * @param {boolean} [shift=false]
     *        If true, a point is shifted off the start of the series as one is
     *        appended to the end.
     *
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        Whether to apply animation, and optionally animation
     *        configuration.
     *
     * @param {boolean} [withEvent=true]
     *        Used internally, whether to fire the series `addPoint` event.
     *
     * @emits Highcharts.Series#event:addPoint
     */
    public addPoint(
        options: (PointOptions|PointShortOptions),
        redraw?: boolean,
        shift?: boolean,
        animation?: (boolean|Partial<AnimationOptions>),
        withEvent?: boolean
    ): void {
        const series = this,
            seriesOptions = series.options,
            { chart, data, dataTable: table, xAxis } = series,
            names = xAxis?.hasNames && xAxis.names,
            dataOptions = seriesOptions.data,
            xData = series.getColumn('x');
        let isInTheMiddle,
            i: number;

        // Optional redraw, defaults to true
        redraw = pick(redraw, true);

        // Get options and push the point to xData, yData and series.options. In
        // series.generatePoints the Point instance will be created on demand
        // and pushed to the series.data array.
        const point = { series: series } as any;
        series.pointClass.prototype.applyOptions.apply(point, [options]);
        const x: (number|null) = point.x;

        // Get the insertion point
        i = xData.length;
        if (series.requireSorting && (x as any) < xData[i - 1]) {
            isInTheMiddle = true;
            while (i && xData[i - 1] > (x as any)) {
                i--;
            }
        }

        // Insert the row at the given index
        table.setRow(point, i, true, { addColumns: false });

        if (names && point.name) {
            names[x as any] = point.name;
        }
        dataOptions?.splice(i, 0, options);

        if (
            isInTheMiddle ||
            // When processedData is present we need to splice an empty slot
            // into series.data, otherwise generatePoints won't pick it up.
            series.processedData
        ) {
            series.data.splice(i, 0, null as any);
            series.processData();
        }

        // Generate points to be added to the legend (#1329)
        if (seriesOptions.legendType === 'point') {
            series.generatePoints();
        }

        // Shift the first point off the parallel arrays
        if (shift) {
            if (data[0] && !!data[0].remove) {
                data[0].remove(false);
            } else {
                [
                    data,
                    dataOptions,
                    ...Object.values(table.getColumns())
                ].filter(defined).forEach((coll): void => {
                    coll.shift();
                });
                table.rowCount -= 1;
                fireEvent(table, 'afterDeleteRows');
            }
        }

        // Fire event
        if (withEvent !== false) {
            fireEvent(series, 'addPoint', { point: point });
        }

        // Redraw
        series.isDirty = true;
        series.isDirtyData = true;

        if (redraw) {
            chart.redraw(animation); // Animation is set anyway on redraw, #5665
        }
    }

    /**
     * Remove a point from the series. Unlike the
     * {@link Highcharts.Point#remove} method, this can also be done on a point
     * that is not instantiated because it is outside the view or subject to
     * Highcharts Stock data grouping.
     *
     * @sample highcharts/members/series-removepoint/
     *         Remove cropped point
     *
     * @function Highcharts.Series#removePoint
     *
     * @param {number} i
     *        The index of the point in the {@link Highcharts.Series.data|data}
     *        array.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart after the point is added. When
     *        removing more than one point, it is highly recommended that the
     *        `redraw` option be set to `false`, and instead {@link
     *        Highcharts.Chart#redraw} is explicitly called after the adding of
     *        points is finished.
     *
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        Whether and optionally how the series should be animated.
     *
     * @emits Highcharts.Point#event:remove
     */
    public removePoint(
        i: number,
        redraw?: boolean,
        animation?: (boolean|Partial<AnimationOptions>)
    ): void {

        const series = this,
            { chart, data, points, dataTable: table } = series,
            point = data[i],
            remove = function (): void {
                // Splice out the point's data from all parallel arrays
                [
                    // #4935
                    points?.length === data.length ? points : void 0,
                    data,
                    series.options.data
                ].filter(defined).forEach((coll): void => {
                    coll.splice(i, 1);
                });

                table.deleteRows(i);

                point?.destroy();

                // Redraw
                series.isDirty = true;
                series.isDirtyData = true;
                if (redraw) {
                    chart.redraw();
                }
            };

        setAnimation(animation, chart);
        redraw = pick(redraw, true);

        // Fire the event with a default handler of removing the point
        if (point) {
            point.firePointEvent('remove', null as any, remove);
        } else {
            remove();
        }
    }

    /**
     * Remove a series and optionally redraw the chart.
     *
     * @sample highcharts/members/series-remove/
     *         Remove first series from a button
     *
     * @function Highcharts.Series#remove
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart or wait for an explicit call to
     *        {@link Highcharts.Chart#redraw}.
     *
     * @param {boolean|Partial<Highcharts.AnimationOptionsObject>} [animation]
     *        Whether to apply animation, and optionally animation
     *        configuration.
     *
     * @param {boolean} [withEvent=true]
     *        Used internally, whether to fire the series `remove` event.
     *
     * @emits Highcharts.Series#event:remove
     */
    public remove(
        redraw?: boolean,
        animation?: (boolean|Partial<AnimationOptions>),
        withEvent?: boolean,
        keepEvents?: boolean
    ): void {
        const series = this,
            chart = series.chart;

        /**
         * @private
         */
        function remove(): void {

            // Destroy elements
            series.destroy(keepEvents);

            // Redraw
            chart.isDirtyLegend = chart.isDirtyBox = true;
            chart.linkSeries(keepEvents);

            if (pick(redraw, true)) {
                chart.redraw(animation);
            }
        }

        // Fire the event with a default handler of removing the point
        if (withEvent !== false) {
            fireEvent(series, 'remove', null as any, remove);
        } else {
            remove();
        }
    }

    /**
     * Update the series with a new set of options. For a clean and precise
     * handling of new options, all methods and elements from the series are
     * removed, and it is initialized from scratch. Therefore, this method is
     * more performance expensive than some other utility methods like {@link
     * Series#setData} or {@link Series#setVisible}.
     *
     * Note that `Series.update` may mutate the passed `data` options.
     *
     * @sample highcharts/members/series-update/
     *         Updating series options
     * @sample maps/members/series-update/
     *         Update series options in Highmaps
     *
     * @function Highcharts.Series#update
     *
     * @param {Highcharts.SeriesOptionsType} options
     *        New options that will be merged with the series' existing options.
     *
     * @param {boolean} [redraw=true]
     *        Whether to redraw the chart after the series is altered. If doing
     *        more operations on the chart, it is a good idea to set redraw to
     *        false and call {@link Chart#redraw} after.
     *
     * @emits Highcharts.Series#event:update
     * @emits Highcharts.Series#event:afterUpdate
     */
    public update(
        options: DeepPartial<SeriesTypeOptions>,
        redraw?: boolean
    ): void {

        options = diffObjects(options, this.userOptions);
        fireEvent(this, 'update', { options: options });

        const series = this,
            chart = series.chart,
            // Must use user options when changing type because series.options
            // is merged in with type specific plotOptions
            oldOptions = series.userOptions,
            initialType = series.initialType || series.type,
            plotOptions = chart.options.plotOptions,
            initialSeriesProto = seriesTypes[initialType].prototype,
            groups = [
                'group',
                'markerGroup',
                'dataLabelsGroup',
                'transformGroup'
            ],
            optionsToCheck = [
                'dataGrouping',
                'pointStart',
                'pointInterval',
                'pointIntervalUnit',
                'keys'
            ],
            // Animation must be enabled when calling update before the initial
            // animation has first run. This happens when calling update
            // directly after chart initialization, or when applying responsive
            // rules (#6912).
            animation = series.finishedAnimating && { animation: false },
            kinds = {} as Record<string, number>;
        let seriesOptions: SeriesOptions,
            n,
            preserve = [
                'colorIndex',
                'eventOptions',
                'navigatorSeries',
                'symbolIndex',
                'baseSeries'
            ],
            newType = (
                options.type ||
                oldOptions.type ||
                chart.options.chart.type
            );
        const keepPoints = !(
            // Indicators, histograms etc recalculate the data. It should be
            // possible to omit this.
            this.hasDerivedData ||
            // New type requires new point classes
            (newType && newType !== this.type) ||
            // New options affecting how the data points are built
            typeof options.keys !== 'undefined' ||
            typeof options.pointStart !== 'undefined' ||
            typeof options.pointInterval !== 'undefined' ||
            typeof options.relativeXValue !== 'undefined' ||

            options.joinBy ||
            options.mapData || // #11636
            // Changes to data grouping requires new points in new group
            optionsToCheck.some(
                (option): boolean => series.hasOptionChanged(option)
            )
        );

        newType = newType || initialType;

        if (keepPoints) {
            preserve.push(
                'data',
                'isDirtyData',
                // GeoHeatMap interpolation
                'isDirtyCanvas',
                'points',
                'dataTable',

                'processedData', // #17057

                'xIncrement',
                'cropped',
                '_hasPointMarkers',
                'hasDataLabels',

                // Networkgraph (#14397)
                'nodes',
                'layout',

                // Treemap
                'level',

                // Map specific, consider moving it to series-specific preserve-
                // properties (#10617)
                'mapMap',
                'mapData',
                'minY',
                'maxY',
                'minX',
                'maxX',
                'transformGroups' // #18857
            );
            if (options.visible !== false) {
                preserve.push('area', 'graph');
            }
            series.parallelArrays.forEach(function (key: string): void {
                preserve.push(key + 'Data');
            });

            if (options.data) {
                // `setData` uses `dataSorting` options so we need to update
                // them earlier
                if (options.dataSorting) {
                    extend(series.options.dataSorting, options.dataSorting);
                }
                this.setData(options.data as any, false);
            }
        } else {
            this.dataTable.modified = this.dataTable;
        }

        // Do the merge, with some forced options
        options = merge(
            oldOptions,
            {
                // When oldOptions.index is null it should't be cleared.
                // Otherwise navigator series will have wrong indexes (#10193).
                index: oldOptions.index === void 0 ?
                    series.index : oldOptions.index,
                pointStart:
                    // When updating from blank (#7933)
                    plotOptions?.series?.pointStart ??
                    oldOptions.pointStart ??
                    // When updating after addPoint
                    series.getColumn('x')[0]
            },
            !keepPoints && { data: series.options.data },
            options,
            animation
        );

        // Merge does not merge arrays, but replaces them. Since points were
        // updated, `series.options.data` has correct merged options, use it:
        if (keepPoints && options.data) {
            options.data = series.options.data;
        }

        // Make sure preserved properties are not destroyed (#3094)
        preserve = groups.concat(preserve);
        preserve.forEach(function (prop: string): void {
            (preserve as any)[prop] = (series as any)[prop];
            delete (series as any)[prop];
        });

        let casting = false;

        if (seriesTypes[newType]) {

            casting = newType !== series.type;

            // Destroy the series and delete all properties, it will be
            // reinserted within the `init` call below
            series.remove(false, false, false, true);

            if (casting) {
                // #20264: Re-detect a certain chart properties from new series
                chart.propFromSeries();

                // Modern browsers including IE11
                if (Object.setPrototypeOf) {
                    Object.setPrototypeOf(
                        series,
                        seriesTypes[newType].prototype
                    );

                // Legacy (IE < 11)
                } else {

                    const ownEvents = Object.hasOwnProperty.call(
                        series,
                        'hcEvents'
                    ) && series.hcEvents;
                    for (n in initialSeriesProto) { // eslint-disable-line guard-for-in
                        (series as any)[n] = void 0;
                    }

                    // Reinsert all methods and properties from the new type
                    // prototype (#2270, #3719).
                    extend<Series>(
                        series,
                        seriesTypes[newType].prototype
                    );

                    // The events are tied to the prototype chain, don't copy if
                    // they're not the series' own
                    if (ownEvents) {
                        series.hcEvents = ownEvents;
                    } else {
                        delete series.hcEvents;
                    }
                }
            }
        } else {
            error(
                17,
                true,
                chart,
                { missingModuleFor: newType }
            );
        }

        // Re-register groups (#3094) and other preserved properties
        preserve.forEach(function (prop: string): void {
            (series as any)[prop] = (preserve as any)[prop];
        });

        series.init(chart, options);

        // Remove particular elements of the points. Check `series.options`
        // because we need to consider the options being set on plotOptions as
        // well.
        if (keepPoints && this.points) {
            seriesOptions = series.options;
            // What kind of elements to destroy
            if (seriesOptions.visible === false) {
                kinds.graphic = 1;
                kinds.dataLabel = 1;
            } else {

                // If the marker got disabled or changed its symbol, width or
                // height - destroy
                if (this.hasMarkerChanged(seriesOptions, oldOptions)) {
                    kinds.graphic = 1;
                }

                if (!series.hasDataLabels?.()) {
                    kinds.dataLabel = 1;
                }
            }
            for (const point of this.points) {
                if (point?.series) {
                    point.resolveColor();
                    // Destroy elements in order to recreate based on updated
                    // series options.
                    if (Object.keys(kinds).length) {
                        point.destroyElements(kinds);
                    }
                    if (
                        seriesOptions.showInLegend === false &&
                        point.legendItem
                    ) {
                        chart.legend.destroyItem(point);
                    }
                }
            }
        }

        series.initialType = initialType;
        chart.linkSeries(); // Links are lost in series.remove (#3028)
        // Set data for series with sorting enabled if it isn't set yet (#19715)
        chart.setSortedData();

        // #15383: Fire updatedData if the type has changed to keep linked
        // series such as indicators updated
        if (casting && series.linkedSeries.length) {
            series.isDirtyData = true;
        }

        fireEvent(this, 'afterUpdate');

        if (pick(redraw, true)) {
            chart.redraw(keepPoints ? void 0 : false);
        }
    }

    /**
     * Used from within series.update
     * @private
     */
    public setName(name: string): void {
        this.name = this.options.name = this.userOptions.name = name;
        this.chart.isDirtyLegend = true;
    }

    /**
     * Check if the option has changed.
     * @private
     */
    public hasOptionChanged(optionName: string): boolean {
        const chart = this.chart,
            option = this.options[optionName as keyof SeriesOptions],
            plotOptions = chart.options.plotOptions,
            oldOption = this.userOptions[
                optionName as keyof DeepPartial<SeriesOptions>
            ],
            plotOptionsOption = pick(
                plotOptions?.[this.type]?.[
                    optionName as keyof Omit<SeriesOptions, NonPlotOptions>
                ],
                plotOptions?.series?.[
                    optionName as keyof Omit<SeriesOptions, NonPlotOptions>
                ]
            );

        // Check if `plotOptions` are defined already, #19203
        if (oldOption && !defined(plotOptionsOption)) {
            return option !== oldOption;
        }

        return option !== pick(plotOptionsOption, option);
    }

    /**
     * Runs on mouse over the series graphical items.
     *
     * @function Highcharts.Series#onMouseOver
     * @emits Highcharts.Series#event:mouseOver
     */
    public onMouseOver(): void {
        const series = this,
            chart = series.chart,
            hoverSeries = chart.hoverSeries,
            pointer = chart.pointer;

        pointer?.setHoverChartIndex();

        // Set normal state to previous series
        if (hoverSeries && hoverSeries !== series) {
            hoverSeries.onMouseOut();
        }

        // Trigger the event, but to save processing time,
        // only if defined
        if ((series.options.events as any).mouseOver) {
            fireEvent(series, 'mouseOver');
        }

        // Hover this
        series.setState('hover');

        /**
         * Contains the original hovered series.
         *
         * @name Highcharts.Chart#hoverSeries
         * @type {Highcharts.Series|null}
         */
        chart.hoverSeries = series;
    }

    /**
     * Runs on mouse out of the series graphical items.
     *
     * @function Highcharts.Series#onMouseOut
     *
     * @emits Highcharts.Series#event:mouseOut
     */
    public onMouseOut(): void {
        // Trigger the event only if listeners exist
        const series = this,
            options = series.options,
            chart = series.chart,
            tooltip = chart.tooltip,
            hoverPoint = chart.hoverPoint;

        // #182, set to null before the mouseOut event fires
        chart.hoverSeries = null as any;

        // Trigger mouse out on the point, which must be in this series
        if (hoverPoint) {
            hoverPoint.onMouseOut();
        }

        // Fire the mouse out event
        if (series && (options.events as any).mouseOut) {
            fireEvent(series, 'mouseOut');
        }


        // Hide the tooltip
        if (
            tooltip &&
            !series.stickyTracking &&
            (!tooltip.shared || series.noSharedTooltip)
        ) {
            tooltip.hide();
        }

        // Reset all inactive states
        chart.series.forEach(function (s): void {
            s.setState('', true);
        });

    }

    /**
     * Set the state of the series. Called internally on mouse interaction
     * operations, but it can also be called directly to visually
     * highlight a series.
     *
     * @function Highcharts.Series#setState
     *
     * @param {Highcharts.SeriesStateValue|""} [state]
     *        The new state, can be either `'hover'`, `'inactive'`, `'select'`,
     *        or `''` (an empty string), `'normal'` or `undefined` to set to
     *        normal state.
     * @param {boolean} [inherit]
     *        Determines if state should be inherited by points too.
     */
    public setState(
        state?: (StatesOptionsKey|''),
        inherit?: boolean
    ): void {
        const series = this,
            options = series.options,
            graph = series.graph,
            inactiveOtherPoints = options.inactiveOtherPoints,
            stateOptions = options.states,
            // By default a quick animation to hover/inactive,
            // slower to un-hover
            stateAnimation = pick(
                (
                    (stateOptions as any)[state || 'normal'] &&
                    (stateOptions as any)[state || 'normal'].animation
                ),
                series.chart.options.chart.animation
            );
        let lineWidth = options.lineWidth,
            opacity = options.opacity;

        state = state || '';

        if (series.state !== state) {

            // Toggle class names
            [
                series.group,
                series.markerGroup,
                series.dataLabelsGroup
            ].forEach(function (
                group: (SVGElement|undefined)
            ): void {
                if (group) {
                    // Old state
                    if (series.state) {
                        group.removeClass('highcharts-series-' + series.state);
                    }
                    // New state
                    if (state) {
                        group.addClass('highcharts-series-' + state);
                    }
                }
            });

            series.state = state;

            if (!series.chart.styledMode) {

                if (
                    (stateOptions as any)[state] &&
                    (stateOptions as any)[state].enabled === false
                ) {
                    return;
                }

                if (state) {
                    lineWidth = (
                        (stateOptions as any)[state].lineWidth ||
                        lineWidth + (
                            (stateOptions as any)[state].lineWidthPlus || 0
                        )
                    ); // #4035

                    opacity = pick(
                        (stateOptions as any)[state].opacity,
                        opacity
                    );
                }

                if (graph && !graph.dashstyle && isNumber(lineWidth)) {
                    // Animate the graph stroke-width
                    for (
                        const graphElement of [
                            graph,
                            ...this.zones.map(
                                (zone): undefined|SVGElement => zone.graph
                            )
                        ]
                    ) {
                        graphElement?.animate({
                            'stroke-width': lineWidth
                        }, stateAnimation);
                    }
                }

                // For some types (pie, networkgraph, sankey) opacity is
                // resolved on a point level
                if (!inactiveOtherPoints) {
                    [
                        series.group,
                        series.markerGroup,
                        series.dataLabelsGroup,
                        series.labelBySeries
                    ].forEach(function (
                        group: (SVGElement|undefined)
                    ): void {
                        if (group) {
                            group.animate(
                                {
                                    opacity: opacity
                                },
                                stateAnimation
                            );
                        }
                    });
                }
            }
        }

        // Don't loop over points on a series that doesn't apply inactive state
        // to siblings markers (e.g. line, column)
        if (inherit && inactiveOtherPoints && series.points) {
            series.setAllPointsToState(state || void 0);
        }
    }

    /**
     * Set the state for all points in the series.
     *
     * @function Highcharts.Series#setAllPointsToState
     *
     * @private
     *
     * @param {string} [state]
     *        Can be either `hover` or undefined to set to normal state.
     */
    public setAllPointsToState(state?: StatesOptionsKey): void {
        this.points.forEach(function (point): void {
            if (point.setState) {
                point.setState(state);
            }
        });
    }

    /**
     * Show or hide the series.
     *
     * @function Highcharts.Series#setVisible
     *
     * @param {boolean} [visible]
     * True to show the series, false to hide. If undefined, the visibility is
     * toggled.
     *
     * @param {boolean} [redraw=true]
     * Whether to redraw the chart after the series is altered. If doing more
     * operations on the chart, it is a good idea to set redraw to false and
     * call {@link Chart#redraw|chart.redraw()} after.
     *
     * @emits Highcharts.Series#event:hide
     * @emits Highcharts.Series#event:show
     */
    public setVisible(
        vis?: boolean,
        redraw?: boolean
    ): void {
        const series = this,
            chart = series.chart,
            ignoreHiddenSeries = chart.options.chart.ignoreHiddenSeries,
            oldVisibility = series.visible;

        // If called without an argument, toggle visibility
        series.visible =
            vis =
            series.options.visible =
            series.userOptions.visible =
            typeof vis === 'undefined' ? !oldVisibility : vis; // #5618

        const showOrHide = vis ? 'show' : 'hide';

        // Show or hide elements
        (
            [
                'group',
                'dataLabelsGroup',
                'markerGroup',
                'tracker',
                'tt'
            ] as ('group'|'dataLabelsGroup'|'markerGroup'|'tracker'|'tt')[]
        ).forEach((key): void => {
            series[key]?.[showOrHide]();
        });


        // Hide tooltip (#1361)
        if (
            chart.hoverSeries === series ||
            chart.hoverPoint?.series === series
        ) {
            series.onMouseOut();
        }


        if (series.legendItem) {
            chart.legend.colorizeItem(series, vis);
        }

        // Rescale or adapt to resized chart
        series.isDirty = true;

        // In a stack, all other series are affected
        if (series.options.stacking) {
            chart.series.forEach((otherSeries): void => {
                if (otherSeries.options.stacking && otherSeries.visible) {
                    otherSeries.isDirty = true;
                }
            });
        }

        // Show or hide linked series
        series.linkedSeries.forEach((otherSeries): void => {
            otherSeries.setVisible(vis, false);
        });

        if (ignoreHiddenSeries) {
            chart.isDirtyBox = true;
        }

        fireEvent(series, showOrHide);

        if (redraw !== false) {
            chart.redraw();
        }
    }

    /**
     * Show the series if hidden.
     *
     * @sample highcharts/members/series-hide/
     *         Toggle visibility from a button
     *
     * @function Highcharts.Series#show
     * @emits Highcharts.Series#event:show
     */
    public show(): void {
        this.setVisible(true);
    }

    /**
     * Hide the series if visible. If the
     * [chart.ignoreHiddenSeries](https://api.highcharts.com/highcharts/chart.ignoreHiddenSeries)
     * option is true, the chart is redrawn without this series.
     *
     * @sample highcharts/members/series-hide/
     *         Toggle visibility from a button
     *
     * @function Highcharts.Series#hide
     * @emits Highcharts.Series#event:hide
     */
    public hide(): void {
        this.setVisible(false);
    }


    /**
     * Select or unselect the series. This means its
     * {@link Highcharts.Series.selected|selected}
     * property is set, the checkbox in the legend is toggled and when selected,
     * the series is returned by the {@link Highcharts.Chart#getSelectedSeries}
     * function.
     *
     * @sample highcharts/members/series-select/
     *         Select a series from a button
     *
     * @function Highcharts.Series#select
     *
     * @param {boolean} [selected]
     * True to select the series, false to unselect. If undefined, the selection
     * state is toggled.
     *
     * @emits Highcharts.Series#event:select
     * @emits Highcharts.Series#event:unselect
     */
    public select(selected?: boolean): void {
        const series = this;

        series.selected =
        selected =
        this.options.selected = (
            typeof selected === 'undefined' ?
                !series.selected :
                selected
        );

        if (series.checkbox) {
            series.checkbox.checked = selected;
        }

        fireEvent(series, selected ? 'select' : 'unselect');
    }

    /**
     * Checks if a tooltip should be shown for a given point.
     *
     * @private
     */
    public shouldShowTooltip(
        plotX: number,
        plotY: number,
        options: Chart.IsInsideOptionsObject = {}
    ): boolean {
        options.series = this;
        options.visiblePlotOnly = true;
        return this.chart.isInsidePlot(plotX, plotY, options);
    }

    /**
     * Draws the legend symbol based on the legendSymbol user option.
     *
     * @private
     */
    public drawLegendSymbol(legend: Legend, item: Legend.Item): void {
        LegendSymbol[this.options.legendSymbol || 'rectangle']
            ?.call(this, legend, item);
    }

    // eslint-enable valid-jsdoc

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Series extends SeriesLike {
    axisTypes: Array<'xAxis'|'yAxis'|'colorAxis'|'zAxis'>;
    coll: 'series';
    colorCounter: number;
    directTouch: boolean;
    hcEvents?: Record<string, Array<U.EventWrapperObject<Series>>>;
    invertible: boolean;
    isCartesian: boolean;
    kdAxisArray: Array<keyof KDPointSearchObject>;
    parallelArrays: Array<string>;
    pointClass: typeof Point;
    requireSorting: boolean;
    sorted: boolean;
}

extend(Series.prototype, {
    axisTypes: ['xAxis', 'yAxis'],
    coll: 'series',
    colorCounter: 0,
    directTouch: false,
    invertible: true,
    isCartesian: true,
    kdAxisArray: ['clientX', 'plotY'],
    // Each point's x and y values are stored in this.xData and this.yData:
    parallelArrays: ['x', 'y'],
    pointClass: Point,
    requireSorting: true,
    // Requires the data to be sorted:
    sorted: true
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace Series {

    /* *
     *
     *  Declarations
     *
     * */

    export interface CropDataObject {
        end: number;
        modified: DataTableCore;
        start: number;
    }

    export interface PlotBoxTransform extends SVGAttributes {
        scaleX: number;
        scaleY: number;
        translateX: number;
        translateY: number;
    }

    export interface ProcessedDataObject {
        cropped: (boolean|undefined);
        cropStart: number;
        closestPointRange: (number|undefined);
        modified: DataTableCore
    }

    export interface ZoneObject extends SeriesZonesOptions {
        area?: SVGElement;
        clip?: SVGElement;
        graph?: SVGElement;
        lineClip?: SVGPath;
        simpleClip?: SVGElement;
        translated?: number;
    }

}

/* *
 *
 *  Registry
 *
 * */

SeriesRegistry.series = Series;

/* *
 *
 *  Default Export
 *
 * */

export default Series;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * This is a placeholder type of the possible series options for
 * [Highcharts](../highcharts/series), [Highcharts Stock](../highstock/series),
 * [Highmaps](../highmaps/series), and [Gantt](../gantt/series).
 *
 * In TypeScript is this dynamically generated to reference all possible types
 * of series options.
 *
 * @ignore-declaration
 * @typedef {Highcharts.SeriesOptions|Highcharts.Dictionary<*>} Highcharts.SeriesOptionsType
 */

/**
 * Options for `dataSorting`.
 *
 * @interface Highcharts.DataSortingOptionsObject
 * @since 8.0.0
 *//**
 * Enable or disable data sorting for the series.
 * @name Highcharts.DataSortingOptionsObject#enabled
 * @type {boolean|undefined}
 *//**
 * Whether to allow matching points by name in an update.
 * @name Highcharts.DataSortingOptionsObject#matchByName
 * @type {boolean|undefined}
 *//**
 * Determines what data value should be used to sort by.
 * @name Highcharts.DataSortingOptionsObject#sortKey
 * @type {string|undefined}
 */

/**
 * Function callback when a series has been animated.
 *
 * @callback Highcharts.SeriesAfterAnimateCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        The series where the event occurred.
 *
 * @param {Highcharts.SeriesAfterAnimateEventObject} event
 *        Event arguments.
 */

/**
 * Event information regarding completed animation of a series.
 *
 * @interface Highcharts.SeriesAfterAnimateEventObject
 *//**
 * Animated series.
 * @name Highcharts.SeriesAfterAnimateEventObject#target
 * @type {Highcharts.Series}
 *//**
 * Event type.
 * @name Highcharts.SeriesAfterAnimateEventObject#type
 * @type {"afterAnimate"}
 */

/**
 * Function callback when the checkbox next to the series' name in the legend is
 * clicked.
 *
 * @callback Highcharts.SeriesCheckboxClickCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        The series where the event occurred.
 *
 * @param {Highcharts.SeriesCheckboxClickEventObject} event
 *        Event arguments.
 */

/**
 * Event information regarding check of a series box.
 *
 * @interface Highcharts.SeriesCheckboxClickEventObject
 *//**
 * Whether the box has been checked.
 * @name Highcharts.SeriesCheckboxClickEventObject#checked
 * @type {boolean}
 *//**
 * Related series.
 * @name Highcharts.SeriesCheckboxClickEventObject#item
 * @type {Highcharts.Series}
 *//**
 * Related series.
 * @name Highcharts.SeriesCheckboxClickEventObject#target
 * @type {Highcharts.Series}
 *//**
 * Event type.
 * @name Highcharts.SeriesCheckboxClickEventObject#type
 * @type {"checkboxClick"}
 */

/**
 * Function callback when a series is clicked. Return false to cancel toogle
 * actions.
 *
 * @callback Highcharts.SeriesClickCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        The series where the event occurred.
 *
 * @param {Highcharts.SeriesClickEventObject} event
 *        Event arguments.
 */

/**
 * Common information for a click event on a series.
 *
 * @interface Highcharts.SeriesClickEventObject
 * @extends global.Event
 *//**
 * Nearest point on the graph.
 * @name Highcharts.SeriesClickEventObject#point
 * @type {Highcharts.Point}
 */

/**
 * Gets fired when the series is hidden after chart generation time, either by
 * clicking the legend item or by calling `.hide()`.
 *
 * @callback Highcharts.SeriesHideCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        The series where the event occurred.
 *
 * @param {global.Event} event
 *        The event that occurred.
 */

/**
 * The SVG value used for the `stroke-linecap` and `stroke-linejoin` of a line
 * graph.
 *
 * @typedef {"butt"|"round"|"square"|string} Highcharts.SeriesLinecapValue
 */

/**
 * Gets fired when the legend item belonging to the series is clicked. The
 * default action is to toggle the visibility of the series. This can be
 * prevented by returning `false` or calling `event.preventDefault()`.
 *
 * **Note:** This option is deprecated in favor of
 * Highcharts.LegendItemClickCallbackFunction.
 *
 * @deprecated 11.4.4
 * @callback Highcharts.SeriesLegendItemClickCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        The series where the event occurred.
 *
 * @param {Highcharts.SeriesLegendItemClickEventObject} event
 *        The event that occurred.
 */

/**
 * Information about the event.
 *
 * **Note:** This option is deprecated in favor of
 * Highcharts.LegendItemClickEventObject.
 *
 * @deprecated 11.4.4
 * @interface Highcharts.SeriesLegendItemClickEventObject
 *//**
 * Related browser event.
 * @name Highcharts.SeriesLegendItemClickEventObject#browserEvent
 * @type {global.PointerEvent}
 *//**
 * Prevent the default action of toggle the visibility of the series.
 * @name Highcharts.SeriesLegendItemClickEventObject#preventDefault
 * @type {Function}
 *//**
 * Related series.
 * @name Highcharts.SeriesCheckboxClickEventObject#target
 * @type {Highcharts.Series}
 *//**
 * Event type.
 * @name Highcharts.SeriesCheckboxClickEventObject#type
 * @type {"checkboxClick"}
 */

/**
 * Gets fired when the mouse leaves the graph.
 *
 * @callback Highcharts.SeriesMouseOutCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        Series where the event occurred.
 *
 * @param {global.PointerEvent} event
 *        Event that occurred.
 */

/**
 * Gets fired when the mouse enters the graph.
 *
 * @callback Highcharts.SeriesMouseOverCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        Series where the event occurred.
 *
 * @param {global.PointerEvent} event
 *        Event that occurred.
 */

/**
 * Translation and scale for the plot area of a series.
 *
 * @interface Highcharts.SeriesPlotBoxObject
 *//**
 * @name Highcharts.SeriesPlotBoxObject#scaleX
 * @type {number}
 *//**
 * @name Highcharts.SeriesPlotBoxObject#scaleY
 * @type {number}
 *//**
 * @name Highcharts.SeriesPlotBoxObject#translateX
 * @type {number}
 *//**
 * @name Highcharts.SeriesPlotBoxObject#translateY
 * @type {number}
 */

/**
 * Gets fired when the series is shown after chart generation time, either by
 * clicking the legend item or by calling `.show()`.
 *
 * @callback Highcharts.SeriesShowCallbackFunction
 *
 * @param {Highcharts.Series} this
 *        Series where the event occurred.
 *
 * @param {global.Event} event
 *        Event that occurred.
 */

/**
 * Possible key values for the series state options.
 *
 * @typedef {"hover"|"inactive"|"normal"|"select"} Highcharts.SeriesStateValue
 */

''; // Detach doclets above

/* *
 *
 *  API Options
 *
 * */

/**
 * Series options for specific data and the data itself. In TypeScript you
 * have to cast the series options to specific series types, to get all
 * possible options for a series.
 *
 * @example
 * // TypeScript example
 * Highcharts.chart('container', {
 *     series: [{
 *         color: '#06C',
 *         data: [[0, 1], [2, 3]]
 *     } as Highcharts.SeriesLineOptions ]
 * });
 *
 * @type      {Array<*>}
 * @apioption series
 */

/**
 * An id for the series. This can be used after render time to get a pointer
 * to the series object through `chart.get()`.
 *
 * @sample {highcharts} highcharts/plotoptions/series-id/
 *         Get series by id
 *
 * @type      {string}
 * @since     1.2.0
 * @apioption series.id
 */

/**
 * The index of the series in the chart, affecting the internal index in the
 * `chart.series` array, the visible Z index as well as the order in the
 * legend.
 *
 * @type      {number}
 * @since     2.3.0
 * @apioption series.index
 */

/**
 * The sequential index of the series in the legend.
 *
 * @see [legend.reversed](#legend.reversed),
 *      [yAxis.reversedStacks](#yAxis.reversedStacks)
 *
 * @sample {highcharts|highstock} highcharts/series/legendindex/
 *         Legend in opposite order
 *
 * @type      {number}
 * @apioption series.legendIndex
 */
/**
 * The name of the series as shown in the legend, tooltip etc.
 *
 * @sample {highcharts} highcharts/series/name/
 *         Series name
 * @sample {highmaps} maps/demo/category-map/
 *         Series name
 *
 * @type      {string}
 * @apioption series.name
 */

/**
 * This option allows grouping series in a stacked chart. The stack option
 * can be a string or anything else, as long as the grouped series' stack
 * options match each other after conversion into a string.
 *
 * @sample {highcharts} highcharts/series/stack/
 *         Stacked and grouped columns
 * @sample {highcharts} highcharts/series/stack-centerincategory/
 *         Stacked and grouped, centered in category
 *
 * @type      {number|string}
 * @since     2.1
 * @product   highcharts highstock
 * @apioption series.stack
 */

/**
 * The type of series, for example `line` or `column`. By default, the
 * series type is inherited from [chart.type](#chart.type), so unless the
 * chart is a combination of series types, there is no need to set it on the
 * series level.
 *
 * @sample {highcharts} highcharts/series/type/
 *         Line and column in the same chart
 * @sample highcharts/series/type-dynamic/
 *         Dynamic types with button selector
 * @sample {highmaps} maps/demo/mapline-mappoint/
 *         Multiple types in the same map
 *
 * @type      {string}
 * @apioption series.type
 */

/**
 * When using dual or multiple x axes, this number defines which xAxis the
 * particular series is connected to. It refers to either the
 * {@link #xAxis.id|axis id}
 * or the index of the axis in the xAxis array, with 0 being the first.
 *
 * @type      {number|string}
 * @default   0
 * @product   highcharts highstock
 * @apioption series.xAxis
 */

/**
 * When using dual or multiple y axes, this number defines which yAxis the
 * particular series is connected to. It refers to either the
 * {@link #yAxis.id|axis id}
 * or the index of the axis in the yAxis array, with 0 being the first.
 *
 * @sample {highcharts} highcharts/series/yaxis/
 *         Apply the column series to the secondary Y axis
 *
 * @type      {number|string}
 * @default   0
 * @product   highcharts highstock
 * @apioption series.yAxis
 */

/**
 * Define the visual z index of the series.
 *
 * @sample {highcharts} highcharts/plotoptions/series-zindex-default/
 *         With no z index, the series defined last are on top
 * @sample {highcharts} highcharts/plotoptions/series-zindex/
 *         With a z index, the series with the highest z index is on top
 * @sample {highstock} highcharts/plotoptions/series-zindex-default/
 *         With no z index, the series defined last are on top
 * @sample {highstock} highcharts/plotoptions/series-zindex/
 *         With a z index, the series with the highest z index is on top
 *
 * @type      {number}
 * @product   highcharts highstock
 * @apioption series.zIndex
 */

''; // Include precedent doclets in transpiled
