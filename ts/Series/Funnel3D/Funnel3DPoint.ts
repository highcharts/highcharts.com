/* *
 *
 *  Highcharts funnel3d series module
 *
 *  (c) 2010-2021 Highsoft AS
 *
 *  Author: Kacper Madej
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Funnel3DPointOptions from './Funnel3DPointOptions';
import type Funnel3DSeries from './Funnel3DSeries';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: ColumnSeries
    }
} = SeriesRegistry;
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend
} = OH;

/* *
 *
 *  Class
 *
 * */

class Funnel3DPoint extends ColumnSeries.prototype.pointClass {

    /* *
     *
     *  Properties
     *
     * */

    public dlBoxRaw: Record<string, number> = void 0 as any;

    public options: Funnel3DPointOptions = void 0 as any;

    public series: Funnel3DSeries = void 0 as any;

    public y: number = void 0 as any;

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Funnel3DPoint {
    shapeType: string;
}
extend(Funnel3DPoint.prototype, {
    shapeType: 'funnel3d'
});

/* *
 *
 *  Default Export
 *
 * */

export default Funnel3DPoint;
