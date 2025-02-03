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

import type { AlignValue, VerticalAlignValue } from './Renderer/AlignObject';
import type AnimationOptions from './Animation/AnimationOptions';
import type ColorType from './Color/ColorType';
import type CSSObject from './Renderer/CSSObject';
import type F from './Templating';
import type Point from './Series/Point';
import type ShadowOptionsObject from './Renderer/ShadowOptionsObject';
import type Time from './Time';
import type Tooltip from './Tooltip';

/* *
 *
 *  Declarations
 *
 * */

declare module './Options' {
    interface Options {
        tooltip?: TooltipOptions;
    }
}

declare module './Series/SeriesOptions' {
    interface SeriesOptions {
        tooltip?: Partial<TooltipOptions>;
    }
}

export interface TooltipOptions {
    animation: boolean|Partial<AnimationOptions>;
    backgroundColor: ColorType;
    borderColor?: ColorType;
    borderRadius: number;
    borderWidth?: number;
    className?: string;
    changeDecimals?: number;
    /** @deprecated */
    crosshairs?: any;
    dateTimeLabelFormats: Time.DateTimeLabelFormatsOption;
    distance?: number;
    enabled: boolean;
    followPointer?: boolean;
    followTouchMove?: boolean;
    footerFormat: string;
    format?: string;
    formatter?: Tooltip.FormatterCallbackFunction;
    headerFormat: string;
    headerShape: Tooltip.ShapeValue;
    hideDelay: number;
    nullFormat?: string;
    nullFormatter?: Tooltip.FormatterCallbackFunction;
    outside?: boolean;
    padding: number;
    pointFormat: string;
    pointFormatter?: F.FormatterCallback<Point>;
    position?: TooltipPositionOptions;
    positioner?: Tooltip.PositionerCallbackFunction;
    shadow?: (boolean|Partial<ShadowOptionsObject>);
    shape?: Tooltip.ShapeValue;
    shared: boolean;
    snap: number;
    split?: boolean;
    stickOnContact: boolean;
    style: CSSObject;
    useHTML: boolean;
    /** @deprecated */
    userOptions?: TooltipOptions;
    valueDecimals?: number;
    valuePrefix?: string;
    valueSuffix?: string;
    xDateFormat?: Time.DateTimeFormat;
}

interface TooltipPositionOptions {
    align?: AlignValue;
    fixed?: boolean;
    relativeTo?: 'chart'|'pane'|'plotBox'|'spacingBox'
    verticalAlign?: VerticalAlignValue;
    x: number;
    y: number;
}

/* *
 *
 *  Default Export
 *
 * */

export default TooltipOptions;
