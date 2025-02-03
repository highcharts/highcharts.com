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

import type {
    AxisOptions,
    YAxisOptions
} from '../../Core/Axis/AxisOptions';
import type ColorType from '../../Core/Color/ColorType';
import type RangeSelector from '../RangeSelector/RangeSelector';
import type { SymbolTypeRegistry } from '../../Core/Renderer/SVG/SymbolType';
import type { SeriesTypeOptions } from '../../Core/Series/SeriesType';
import type Utilities from '../../Core/Utilities';
import type ChartOptions from '../../Core/Chart/ChartOptions';

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Axis/AxisOptions' {
    interface AxisOptions {
        maxRange?: number;
        toFixedRange?: (
            pxMin: number,
            pxMax: number,
            fixedMin: number,
            fixedMax: number
        ) => RangeSelector.RangeObject;
    }
}

declare module '../../Core/Options'{
    interface Options {
        navigator?: NavigatorOptions;
    }
}

declare module '../../Core/Series/SeriesOptions' {
    interface SeriesOptions {
        fillOpacity?: number;
        navigatorOptions?: SeriesOptions;
        showInNavigator?: boolean;
    }
}

export interface NavigatorHandlesOptions {
    backgroundColor?: ColorType;
    borderColor?: ColorType;
    borderRadius?: Utilities.RelativeSize;
    enabled?: boolean;
    height?: number;
    inverted?: boolean;
    lineWidth?: number;
    symbols?: Array<keyof SymbolTypeRegistry>;
    width?: number;
}

export interface BaseNavigatorOptions {
    maskFill?: ColorType;
    maskInside?: boolean;
    handles?: NavigatorHandlesOptions;
    height?: number;
    outlineColor?: ColorType;
    outlineWidth?: number;
    series?: SeriesTypeOptions;
    xAxis?: DeepPartial<AxisOptions>;
    yAxis?: DeepPartial<YAxisOptions>;
}

export interface NavigatorOptions extends BaseNavigatorOptions {
    adaptToUpdatedData?: boolean;
    baseSeries?: (number|string);
    enabled?: boolean;
    isInternal?: boolean;
    margin?: number;
    opposite?: boolean;
    stickToMax?: boolean;
    top?: number;
}

export interface StandaloneNavigatorOptions extends BaseNavigatorOptions {
    chart: ChartOptions;
}

/* *
 *
 *  Default Export
 *
 * */

export default NavigatorOptions;
