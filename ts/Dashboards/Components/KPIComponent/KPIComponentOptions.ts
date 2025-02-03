/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sophie Bremer
 *
 * */

'use strict';


/* *
 *
 *  Imports
 *
 * */


import type Component from '../Component';
import type CSSObject from '../../../Core/Renderer/CSSObject';
import type TextOptions from '../TextOptions';
import type KPIComponent from './KPIComponent';

import type { Options as HighchartsOptions } from '../../Plugins/HighchartsTypes';
import Sync from '../Sync/Sync';


/* *
 *
 *  Declarations
 *
 * */

export interface Options extends Component.Options {
    columnName: string;

    /**
     * Connector options
     */
    connector?: Component.ConnectorOptions;

    /**
     * A full set of chart options applied into KPI chart that is displayed
     * below the value.
     *
     * Some of the chart options are already set, you can find them in {@link KPIComponent.defaultChartOptions}
     *
     * [Highcharts API](https://api.highcharts.com/highcharts/)
     */
    chartOptions?: HighchartsOptions;

    style?: CSSObject;
    /**
     * The threshold declares the value when color is applied
     * (according to the `thresholdColors`).
     *
     * Try it:
     *
     * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/kpi-component/threshold/ | Set a threshold}
     *
     */
    threshold?: number|Array<number>;

    /**
     * Array of two colors strings that are applied when threshold is
     * achieved.
     *
     * Try it:
     *
     * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/kpi-component/threshold/ | Threshold colors}
     *
     */
    thresholdColors?: Array<string>;

    type: 'KPI';

    /**
     * The value that is displayed in KPI component.
     */
    value?: number|string;

    /**
     * The minimal value of the font size, that KPI component should have.
     */
    minFontSize: number;

    /**
     * The KPI's component subtitle. This can be used both to display
     * a subtitle below the main title.
     */
    subtitle?: string|SubtitleOptions;

    /**
     * Sync options for the component.
     */
    syncHandlers?: Sync.OptionsRecord;

    /**
     * A format string for the value text.
     *
     * Try it:
     *
     * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/kpi-component/value-format/ | Add a value format}
     *
     */
    valueFormat?: string;

    /**
     * Callback function to format the text of the value from scratch.
     */
    valueFormatter?: ValueFormatterCallbackFunction;

    /**
     * This option allows user to toggle the KPI value connection with the
     * chart and set the specific point for the connection.
     *
     * Linking is enabled by default for the first point of the first
     * series.
     *
     * Try it:
     *
     * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/kpi-component/linked-value-to | Linking KPI value to a specific point}
     *
     * @example
     * ```js
     * linkedValueTo: {
     *     seriesIndex: 1,
     *     pointIndex: 2
     * }
     * ```
     */
    linkedValueTo: LinkedValueToOptions;

    /**
     * Defines which elements should be synced.
     * ```
     * Example:
     * {
     *     extremes: true
     * }
     * ```
     * Try it:
     *
     * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/demo/sync-extremes/ | Extremes Sync }
     *
     */
    sync?: SyncOptions;

    /**
     * The calculated value that is displayed in KPI component, according to the
     * provided option. Allows to provide the callback function that updates the
     * internal KPI component value.
     */
    calculateValueAs?: 'sum'|'average'|'median'|CalculateValueAsCallbackFunction;
}
/**
 * Options for linking KPI value to the chart point.
 *
 * Try it:
 *
 * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/kpi-component/linked-value-to | Linking KPI value to a specific point}
 */
export interface LinkedValueToOptions {
    /**
     * Enable or disable linking KPI value to a point on the chart.
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * Index of the point that is to receiving the KPI value as its Y.
     *
     * @default 0
     */
    pointIndex?: number;
    /**
     * Index of the series with the point receiving the KPI value.
     *
     * @default 0
     */
    seriesIndex?: number;
}

/** @internal */
export interface SubtitleOptions extends TextOptions {
    type?: SubtitleType;
}

/** @internal */
export type SubtitleType = 'text' | 'diff' | 'diffpercent';

/** @internal */
export interface ValueFormatterCallbackFunction {
    (
        this: KPIComponent,
        value: (number|string)
    ): string;
}

/** @internal */
export interface CalculateValueAsCallbackFunction {
    (
        this: KPIComponent,
        values: number[]
    ): (string|number);
}

/**
 * Sync options available for the KPI component.
 *
 * Example:
 * ```
 * {
 *     extremes: true
 * }
 * ```
 */
export interface SyncOptions extends Sync.RawOptionsRecord {
    /**
     * Extremes sync is available for Highcharts, KPI, DataGrid and
     * Navigator components. Sets a common range of displayed data. For the
     * KPI Component sets the last value.
     *
     * Try it:
     *
     * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/demo/sync-extremes/ | Extremes Sync }
     *
     * @default false
     */
    extremes?: boolean|Sync.OptionsEntry;
}

/* *
 *
 *  Default Export
 *
 * */

export default Options;
