/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type { AlignObject } from '../Renderer/AlignObject';
import type { ButtonRelativeToValue } from '../../Maps/MapNavigationOptions';
import type AnimationOptions from '../../Core/Animation/AnimationOptions';
import type Axis from '../Axis/Axis';
import type Chart from './Chart';
import type ColorType from '../../Core/Color/ColorType';
import type CSSObject from '../Renderer/CSSObject';
import type { HTMLDOMElement } from '../Renderer/DOMElementType';
import type O from '../DefaultOptions';
import type { SeriesTypeOptions } from '../Series/SeriesType';
import type ShadowOptionsObject from '../Renderer/ShadowOptionsObject';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';

/* *
 *
 *  Declarations
 *
 * */

declare module './Chart/ChartLike'{
    interface ChartLike {
        marginRight: ChartOptions['marginRight'];
        polar: ChartOptions['polar'];
    }
}

declare module '../OptionsLike' {
    interface OptionsLike {
        chart: ChartOptions;
    }
}

export interface ChartOptions {
    alignTicks?: boolean;
    animation?: (boolean|Partial<AnimationOptions>);
    backgroundColor?: ColorType;
    borderColor?: ColorType;
    borderRadius?: number;
    borderWidth?: number;
    className?: string;
    colorCount?: number;
    events?: ChartEventsOptions;
    height?: (null|number|string);
    ignoreHiddenSeries?: boolean;
    inverted?: boolean;
    map?: string|Array<any>|Highcharts.GeoJSON;
    mapTransforms?: any;
    margin?: (number|Array<number>);
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    numberFormatter?: O.NumberFormatterCallbackFunction;
    panKey?: string;
    panning?: ChartPanningOptions;
    pinchType?: string;
    plotBackgroundColor?: ColorType;
    plotBackgroundImage?: string;
    plotBorderColor?: ColorType;
    plotBorderWidth?: number;
    plotShadow?: (boolean|Partial<ShadowOptionsObject>);
    polar?: boolean;
    reflow?: boolean;
    renderTo?: (string|HTMLDOMElement);
    resetZoomButton?: ChartResetZoomButtonOptions;
    shadow?: (boolean|Partial<ShadowOptionsObject>);
    selectionMarkerFill?: ColorType;
    showAxes?: boolean;
    spacing?: Array<number>;
    spacingBottom?: number;
    spacingLeft?: number;
    spacingRight?: number;
    spacingTop?: number;
    style?: CSSObject;
    styledMode?: boolean;
    type?: string;
    width?: (null|number);
    zoomBySingleTouch?: boolean;
    zoomType?: ('x'|'xy'|'y');
}

export interface ChartAddSeriesCallbackFunction {
    (this: Chart, event: ChartAddSeriesEventObject): void;
}

export interface ChartAddSeriesEventObject {
    options: SeriesTypeOptions;
    preventDefault: Function;
    target: Chart;
    type: 'addSeries';
}
export interface ChartClickCallbackFunction {
    (this: Chart, event: PointerEvent): void;
}
export interface ChartClickEventAxisObject {
    axis: Axis;
    value: number;
}
export interface ChartClickEventObject {
    xAxis: Array<ChartClickEventAxisObject>;
    yAxis: Array<ChartClickEventAxisObject>;
    zAxis?: Array<ChartClickEventAxisObject>;
}
export interface ChartLoadCallbackFunction {
    (this: Chart, event: Event): void;
}
export interface ChartPanningOptions {
    type: ('x'|'y'|'xy');
    enabled: boolean;
}
export interface ChartRedrawCallbackFunction {
    (this: Chart, event: Event): void;
}
export interface ChartRenderCallbackFunction {
    (this: Chart, event: Event): void;
}
export interface ChartResetZoomButtonOptions {
    position?: AlignObject;
    relativeTo?: ButtonRelativeToValue;
    theme?: SVGAttributes;
}
export interface ChartSelectionCallbackFunction {
    (
        this: Chart,
        event: ChartSelectionContextObject
    ): (boolean|undefined);
}

export interface ChartSelectionContextObject {
    xAxis: Array<ChartSelectionAxisContextObject>;
    yAxis: Array<ChartSelectionAxisContextObject>;
}

export interface ChartSelectionAxisContextObject {
    axis: Axis;
    max: number;
    min: number;
}

export interface ChartEventsOptions {
    addSeries?: ChartAddSeriesCallbackFunction;
    click?: ChartClickCallbackFunction;
    load?: ChartLoadCallbackFunction;
    redraw?: ChartRedrawCallbackFunction;
    render?: ChartRenderCallbackFunction;
    selection?: ChartSelectionCallbackFunction;
}

/* *
 *
 *  Default Export
 *
 * */

export default ChartOptions;
