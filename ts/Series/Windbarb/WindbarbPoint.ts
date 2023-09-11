/* *
 *
 *  Wind barb series module
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
  * Import
  *
  * */
import type WindbarbPointOptions from './WindbarbPointOptions';
import WindbarbSeries from './WindbarbSeries.js';
import ColumnSeries from '../Column/ColumnSeries.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;

/* *
 *
 * Class
 *
 * */

class WindbarbPoint extends ColumnSeries.prototype.pointClass {

    /* *
     *
     * Properties
     *
     * */
    public beaufort: string = void 0 as any;
    public beaufortLevel: number = void 0 as any;
    public direction: number = void 0 as any;
    public options: WindbarbPointOptions = void 0 as any;
    public series: WindbarbSeries = void 0 as any;

    /* *
     *
     * Functions
     *
     * */
    public isValid(): boolean {
        return isNumber(this.value) && this.value >= 0;
    }
}

interface WindbarbPoint {
    value: number;
}

/* *
 *
 * Default export
 *
 * */
export default WindbarbPoint;
