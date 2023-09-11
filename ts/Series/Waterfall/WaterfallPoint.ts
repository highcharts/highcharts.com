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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type WaterfallPointOptions from './WaterfallPointOptions';
import type WaterfallSeries from './WaterfallSeries';

import ColumnSeries from '../Column/ColumnSeries.js';
import Point from '../../Core/Series/Point.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;


/* *
 *
 * Class
 *
 * */
class WaterfallPoint extends ColumnSeries.prototype.pointClass {

    /* *
     *
     * Properties
     *
     * */
    public below?: boolean;

    public box?: BBoxObject;

    public isIntermediateSum?: boolean;

    public isSum?: boolean;

    public minPointLengthOffset?: number;

    public options: WaterfallPointOptions = void 0 as any;

    public series: WaterfallSeries = void 0 as any;

    /* *
     *
     * Functions
     *
     * */
    public getClassName(): string {
        let className = Point.prototype.getClassName.call(this);

        if (this.isSum) {
            className += ' highcharts-sum';
        } else if (this.isIntermediateSum) {
            className += ' highcharts-intermediate-sum';
        }
        return className;
    }
    // Pass the null test in ColumnSeries.translate.
    public isValid(): boolean {
        return (
            isNumber(this.y) ||
            this.isSum ||
            Boolean(this.isIntermediateSum)
        );
    }
}

/* *
 *
 * Export
 *
 * */
export default WaterfallPoint;
