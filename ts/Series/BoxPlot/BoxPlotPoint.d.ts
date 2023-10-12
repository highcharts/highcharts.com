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
import type BoxPlotPointOptions from './BoxPlotPointOptions';
import type BoxPlotSeries from './BoxPlotSeries';
import type ColumnPoint from '../Column/ColumnPoint';
import type ColorString from '../../Core/Color/ColorString';
import type ColorType from '../../Core/Color/ColorType';
import type GradientColor from '../../Core/Color/GradientColor';
import type DashStyleValue from '../../Core/Renderer/DashStyleValue';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

/* *
 *
 *  Class
 *
 * */
declare class BoxPlotPoint extends ColumnPoint {
    public boxDashStyle: DashStyleValue;
    public boxLowerLineShape: SVGElement;
    public boxUpperLineShape: SVGElement;
    public boxLowerPath: SVGElement;
    public boxUpperPath: SVGElement;
    public boxLowerShape: SVGElement;
    public boxUpperShape: SVGElement;
    public fillColor: ColorType;
    public fillUpperColor: ColorType;
    public fillLowerColor: ColorType;
    public high: number;
    public highPlot: number;
    public lineDashStyle: DashStyleValue;
    public low: number;
    public lowPlot: number;
    public lowerLineColor: ColorType;
    public lowerLineWidth: number;
    public median: number;
    public medianColor: (ColorString|GradientColor);
    public medianDashStyle: DashStyleValue;
    public medianPlot: number;
    public medianShape: SVGElement;
    public medianWidth: number;
    public options: BoxPlotPointOptions;
    public q1: number;
    public q1Plot: number;
    public q3: number;
    public q3Plot: number;
    public series: BoxPlotSeries;
    public shapeArgs: BBoxObject;
    public stem: SVGElement;
    public stemColor: ColorType;
    public stemDashStyle: DashStyleValue;
    public stemWidth: number;
    public upperLineColor: ColorType;
    public upperLineWidth: number;
    public whiskerColor: ColorType;
    public whiskerDashStyle: DashStyleValue;
    public whiskers: SVGElement;
    public whiskerLength: (number|string);
    public whiskerWidth: number;
}

/* *
 *
 *  Export Default
 *
 * */

export default BoxPlotPoint;
