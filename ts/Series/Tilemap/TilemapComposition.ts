/* *
 *
 *  Tilemaps module
 *
 *  (c) 2010-2021 Highsoft AS
 *  Author: Øystein Moseng
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

import Axis from '../../Core/Axis/Axis.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
const { addEvent } = EH;

/* *
 *
 *  Composition
 *
 * */

/* eslint-disable no-invalid-this */

// Extension to add pixel padding for series. Uses getSeriesPixelPadding on each
// series and adds the largest padding required. If no series has this function
// defined, we add nothing.
addEvent(Axis, 'afterSetAxisTranslation', function (): void {

    if (this.recomputingForTilemap || this.coll === 'colorAxis') {
        return;
    }

    const axis = this,
        // Find which series' padding to use
        seriesPadding = axis.series
            .map(function (series): Record<string, number>|undefined {
                return series.getSeriesPixelPadding &&
                    series.getSeriesPixelPadding(axis);
            })
            .reduce(function (a, b): Record<string, number>|undefined {
                return (a && (a.padding as any)) > (b && (b.padding as any)) ?
                    a :
                    b;
            }, void 0) ||
            {
                padding: 0,
                axisLengthFactor: 1
            },
        lengthPadding = Math.round(
            seriesPadding.padding * seriesPadding.axisLengthFactor
        );

    // Don't waste time on this if we're not adding extra padding
    if (seriesPadding.padding) {
        // Recompute translation with new axis length now (minus padding)
        axis.len -= lengthPadding;
        axis.recomputingForTilemap = true;
        axis.setAxisTranslation();
        delete axis.recomputingForTilemap;
        axis.minPixelPadding += seriesPadding.padding;
        axis.len += lengthPadding;
    }
});
