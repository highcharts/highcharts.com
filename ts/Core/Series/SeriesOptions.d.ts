/* *
 *
 *  (c) 2010-2024 Torstein Honsi
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type AnimationOptions from '../Animation/AnimationOptions';
import type { EventCallback } from '../Callback';
import type ColorType from '../Color/ColorType';
import type { CursorValue } from '../Renderer/CSSObject';
import type DashStyleValue from '../Renderer/DashStyleValue';
import type Point from './Point';
import type {
    PointEventsOptions,
    PointMarkerOptions,
    PointOptions,
    PointShortOptions
} from './PointOptions';
import type Series from './Series';
import type ShadowOptionsObject from '../Renderer/ShadowOptionsObject';
import type {
    StateGenericOptions,
    StateHoverOptions,
    StateInactiveOptions,
    StateNormalOptions,
    StateSelectOptions,
    StatesOptions
} from './StatesOptions';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';

/* *
 *
 *  Declarations
 *
 * */

export type NonPlotOptions = (
    'data'|'id'|'index'|'legendIndex'|'mapData'|'name'|'stack'|'treemap'|'type'|
    'xAxis'|'yAxis'|'zIndex'
);

export type PlotOptionsOf<T extends Series = Series> = (
    Omit<T['options'], NonPlotOptions>
);

export interface SeriesAfterAnimateEvent {
    target: Series;
    type: 'afterAnimate';
}

export interface SeriesClickEvent {
    point: Point;
}

export interface SeriesDataSortingOptions {
    enabled?: boolean;
    matchByName?: boolean;
    sortKey?: string;
}

/**
 * Helper interface for series types to add options to all series events
 * options.
 *
 * Use the `declare module` pattern to overload the interface in this definition
 * file.
 */
export interface SeriesEventsOptions {
    afterAnimate?: EventCallback<Series, SeriesAfterAnimateEvent>;
    click?: EventCallback<Series, SeriesClickEvent>;
    hide?: EventCallback<Series, Event>;
    mouseOut?: EventCallback<Series, PointerEvent>;
    mouseOver?: EventCallback<Series, PointerEvent>;
    show?: EventCallback<Series, Event>;
}

export type SeriesFindNearestPointByValue = ('x'|'xy');

export type SeriesLinecapValue = ('butt'|'round'|'square');

export type LegendSymbolType = ('areaMarker' | 'lineMarker' | 'rectangle');

/**
 * Helper interface for series types to add options to all series options.
 *
 * Use the `declare module` pattern to overload the interface in this definition
 * file.
 */
export interface SeriesOptions {
    allowPointSelect?: boolean;
    animation?: (boolean|DeepPartial<AnimationOptions>);
    className?: string;
    clip?: boolean;
    color?: ColorType;
    colorByPoint?: boolean;
    colorIndex?: number;
    colors?: Array<ColorType>;
    connectNulls?: boolean;
    crisp?: boolean;
    cursor?: CursorValue;
    dashStyle?: DashStyleValue;
    data?: Array<(PointOptions|PointShortOptions)>;
    dataSorting?: SeriesDataSortingOptions;
    enableMouseTracking?: boolean;
    events?: SeriesEventsOptions;
    findNearestPointBy?: SeriesFindNearestPointByValue;
    getExtremesFromAll?: boolean;
    id?: string;
    index?: number;
    inactiveOtherPoints?: boolean;
    /** @private */
    isInternal?: boolean;
    joinBy?: (string|Array<string>);
    kdNow?: boolean;
    keys?: Array<string>;
    linecap?: SeriesLinecapValue;
    lineColor?: ColorType;
    lineWidth?: number;
    linkedTo?: string;
    marker?: PointMarkerOptions;
    name?: string;
    negativeColor?: ColorType;
    opacity?: number;
    point?: SeriesPointOptions;
    pointPlacement?: (number|string);
    pointStart?: number;
    relativeXValue?: boolean;
    pointValKey?: string;
    selected?: boolean;
    shadow?: (boolean|Partial<ShadowOptionsObject>);
    states?: SeriesStatesOptions<Series>;
    step?: SeriesStepValue;
    stickyTracking?: boolean;
    turboThreshold?: number;
    type?: string;
    visible?: boolean;
    xAxis?: (number|string);
    yAxis?: (number|string);
    zIndex?: number;
    zoneAxis?: 'x'|'y'|'z';
    zones?: Array<SeriesZonesOptions>;
    legendSymbol?: LegendSymbolType;
    legendSymbolColor?: ColorType;
}

export interface SeriesPointOptions {
    events?: PointEventsOptions;
}

export interface SeriesStateHoverHaloOptions {
    attributes?: SVGAttributes;
    brightness?: number;
    opacity?: number;
    size?: number;
}

export interface SeriesStateHoverOptions extends StateHoverOptions {
    animation?: (boolean|DeepPartial<AnimationOptions>);
    brightness?: number;
    enabled?: boolean;
    halo?: (boolean|SeriesStateHoverHaloOptions);
    lineWidth?: number;
    lineWidthPlus?: number;
    radius?: number;
    radiusPlus?: number;
    opacity?: number;
}

export interface SeriesStateInactiveOptions extends StateInactiveOptions {
    enabled?: boolean;
}

export interface SeriesStateNormalOptions extends StateNormalOptions {
    // Nothing here yet
}

export interface SeriesStateSelectOptions extends StateSelectOptions {
    // Nothing here yet
}

export interface SeriesStatesOptions<T extends { options: AnyRecord }> extends StatesOptions {
    hover?: SeriesStateHoverOptions&StateGenericOptions<T>;
    inactive?: SeriesStateInactiveOptions&StateGenericOptions<T>;
    normal?: SeriesStateNormalOptions&StateGenericOptions<T>;
    select?: SeriesStateSelectOptions&StateGenericOptions<T>;
}

export type SeriesStepValue = ('center'|'left'|'right');

/**
 * An array defining zones within a series. Zones can be applied to the
 * X axis, Y axis or Z axis for bubbles, according to the `zoneAxis`
 * option. The zone definitions have to be in ascending order regarding
 * to the value.
 */
export interface SeriesZonesOptions {
    className?: string;
    color?: ColorType;
    dashStyle?: DashStyleValue;
    fillColor?: ColorType;
    value?: number;
}

/* *
 *
 *  Default Export
 *
 * */

export default SeriesOptions;
