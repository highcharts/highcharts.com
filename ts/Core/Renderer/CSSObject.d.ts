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

import type { AlignValue } from './AlignObject';
import type ColorString from '../Color/ColorString';
import ColorType from '../Color/ColorType';

/* *
 *
 *  Declarations
 *
 * */

export type CursorValue = (
    'alias'|'all-scroll'|'auto'|'cell'|'col-resize'|'context-menu'|
    'copy'|'crosshair'|'default'|'e-resize'|'ew-resize'|'grab'|
    'grabbing'|'help'|'move'|'n-resize'|'ne-resize'|'nesw-resize'|
    'no-drop'|'none'|'not-allowed'|'ns-resize'|'nw-resize'|
    'nwse-resize'|'pointer'|'progress'|'row-resize'|'s-resize'|
    'se-resize'|'sw-resize'|'text'|'vertical-text'|'w-resize'|'wait'|
    'zoom-in'|'zoom-out'
);

export interface CSSObject {
    // [key: string]: (boolean|number|string|undefined);
    align?: string;
    'align-items'?: string;
    '-ms-filter'?: string;
    '-ms-touch-action'?: string;
    '-ms-transform'?: string;
    '-o-transform'?: string;
    '-webkit-transform'?: string;
    background?: string;
    backgroundColor?: ColorString;
    borderRadius?: number|string;
    borderWidth?: number;
    border?: string|0;
    'border-radius'?: string;
    bottom?: string;
    boxShadow?: string;
    clip?: string;
    clipPath?: string;
    color?: ('contrast'|ColorString);
    cursor?: CursorValue;
    direction?: string;
    display?: string;
    fill?: ColorType;
    filter?: string;
    flip?: string;
    'flex-direction'?: string;
    font?: string;
    fontFamily?: string;
    fontSize?: (number|string);
    fontStyle?: string;
    fontWeight?: string;
    height?: string|0;
    'justify-content'?: AlignValue;
    left?: string|0;
    lineHeight?: string|0;
    lineWidth?: (number|string); // @todo: Check this. It's not CSS...
    listStyle?: string;
    margin?: string|0;
    marginLeft?: string|0;
    marginTop?: string|0;
    'max-height'?: string;
    'max-width'?: string;
    mixedBlendMode?: string;
    MozBoxShadow?: string;
    MozTransform?: string;
    opacity?: number;
    overflow?: string;
    overflowX?: string;
    overflowY?: string;
    outline?: string;
    padding?: number|string;
    'pointer-events'?: string;
    pointerEvents?: CSSObject['pointer-events'];
    position?: 'absolute'|'fixed'|'relative';
    right?: string;
    rotation?: number;
    stroke?: ColorType;
    'stroke-width'?: (number|string);
    strokeWidth?: CSSObject['stroke-width'];
    'text-align'?: AlignValue;
    textAlign?: CSSObject['text-align'];
    textDecoration?: string;
    textOverflow?: string;
    textOutline?: string;
    textTransform?: string;
    top?: string|0;
    'touch-action'?: string;
    transform?: string;
    transformOrigin?: string;
    transition?: string;
    userSelect?: string;
    visibility?: 'hidden'|'inherit'|'visible';
    'white-space'?: string;
    whiteSpace?: CSSObject['white-space'];
    width?: string|0;
    WebkitBoxShadow?: string;
    WebkitOverflowScrolling?: string;
    '-webkit-tap-highlight-color'?: string;
    zIndex?: number;
    'z-index'?: number;
}

/* *
 *
 *  Default Export
 *
 * */

export default CSSObject;
