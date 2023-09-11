/* *
 *
 *  (c) 2014-2021 Highsoft AS
 *
 *  Authors: Jon Arild Nygard / Oystein Moseng
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

import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const { series: Series } = SeriesRegistry;
import TreemapUtilities from './TreemapUtilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;
const { addEvent } = EH;

/* *
 *
 *  Composition
 *
 * */

let treemapAxisDefaultValues = false;

addEvent(Series, 'afterBindAxes', function (): void {
    // eslint-disable-next-line no-invalid-this
    let series = this,
        xAxis = series.xAxis,
        yAxis = series.yAxis,
        treeAxis;

    if (xAxis && yAxis) {
        if (series.is('treemap')) {
            treeAxis = {
                endOnTick: false,
                gridLineWidth: 0,
                lineWidth: 0,
                min: 0,
                // dataMin: 0,
                minPadding: 0,
                max: TreemapUtilities.AXIS_MAX,
                // dataMax: TreemapUtilities.AXIS_MAX,
                maxPadding: 0,
                startOnTick: false,
                title: void 0,
                tickPositions: []
            };

            extend(yAxis.options, treeAxis);
            extend(xAxis.options, treeAxis);
            treemapAxisDefaultValues = true;

        } else if (treemapAxisDefaultValues) {
            yAxis.setOptions(yAxis.userOptions);
            xAxis.setOptions(xAxis.userOptions);
            treemapAxisDefaultValues = false;
        }
    }
});
