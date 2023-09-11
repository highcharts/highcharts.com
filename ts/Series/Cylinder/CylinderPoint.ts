/* *
 *
 *  Highcharts cylinder - a 3D series
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

import type CylinderPointOptions from './CylinderPointOptions';
import type CylinderSeries from './CylinderSeries';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        column: {
            prototype: {
                pointClass: ColumnPoint
            }
        }
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

class CylinderPoint extends ColumnPoint {

    /* *
     *
     *  Properties
     *
     * */

    public options: CylinderPointOptions = void 0 as any;

    public series: CylinderSeries = void 0 as any;

}

/* *
 *
 *  Class Prototype
 *
 * */

interface CylinderPoint {
    shapeType: string;
}
extend(CylinderPoint.prototype, {
    shapeType: 'cylinder'
});

/* *
 *
 *  Default Export
 *
 * */

export default CylinderPoint;
