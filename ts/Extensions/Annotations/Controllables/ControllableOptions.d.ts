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

import type {
    AlignValue,
    VerticalAlignValue
} from '../../../Core/Renderer/AlignObject';
import type {
    AnnotationControlPointOptionsObject
} from '../ControlPointOptions';
import type ColorType from '../../../Core/Color/ColorType';
import type CSSObject from '../../../Core/Renderer/CSSObject';
import type {
    DataLabelOverflowValue
} from '../../../Core/Series/DataLabelOptions';
import type FormatUtilities from '../../../Core/FormatUtilities';
import type MockPointOptions from '../MockPointOptions';
import type Point from '../../../Core/Series/Point';
import type {
    ShadowOptionsObject
} from '../../../Core/Renderer/ShadowOptionsObject';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';
import type { SymbolKey } from '../../../Core/Renderer/SVG/SymbolType';

/* *
 *
 *  Declarations
 *
 * */

export interface ControllableLabelOptions extends ControllableOptions {
    align: AlignValue;
    allowOverlap: boolean;
    backgroundColor: ColorType;
    crop: boolean;
    distance?: number;
    format?: string;
    formatter: FormatUtilities.FormatterCallback<Point>;
    includeInDataExport: boolean;
    overflow: DataLabelOverflowValue;
    shadow: (boolean|Partial<ShadowOptionsObject>);
    shape: SymbolKey;
    style: CSSObject;
    text?: string;
    useHTML: boolean;
    verticalAlign: VerticalAlignValue;
    x: number;
    y: number;
}

export interface ControllableOptions {
    className?: string;
    controlPointOptions?: AnnotationControlPointOptionsObject;
    controlPoints?: Array<AnnotationControlPointOptionsObject>;
    id?: (number|string);
    markerEnd?: string;
    markerStart?: string;
    point?: (string|MockPointOptions);
    points?: Array<(string|MockPointOptions)>;
    r?: number;
    rx?: number;
    ry?: number;
    type?: string;
    x?: number;
    y?: number;
}

export interface ControllableShapeOptions extends ControllableOptions {
    d?: SVGPath;
    r: number;
    type: string;
}

/* *
 *
 *  Imports
 *
 * */

export default ControllableOptions;
