/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type Axis from '../../Core/Axis/Axis';
import type Series from '../../Core/Series/Series';

import Chart from '../../Core/Chart/Chart.js';
import D from '../../Core/Defaults.js';
const { setOptions, defaultOptions } = D;
import H from '../../Core/Globals.js';
const {
    composed
} = H;
import NavigatorAxisAdditions from '../../Core/Axis/NavigatorAxisComposition.js';
import NavigatorDefaults from './NavigatorDefaults.js';
import NavigatorSymbols from './NavigatorSymbols.js';
import RendererRegistry from '../../Core/Renderer/RendererRegistry.js';
const { getRendererType } = RendererRegistry;
import StockUtilities from '../../Stock/Utilities/StockUtilities.js';
const { setFixedRange } = StockUtilities;
import U from '../../Core/Utilities.js';
const {
    addEvent,
    extend,
    pushUnique
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Renderer/SVG/SymbolType' {
    interface SymbolTypeRegistry {
        'navigator-handle': SymbolFunction;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        baseSeries?: Series;
        navigatorSeries?: Series;
    }
}

/* *
 *
 *  Variables
 *
 * */


/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function compose(
    ChartClass: typeof Chart,
    AxisClass: typeof Axis,
    SeriesClass: typeof Series
): void {
    NavigatorAxisAdditions.compose(AxisClass);

    if (pushUnique(composed, 'Navigator')) {
        ChartClass.prototype.setFixedRange = setFixedRange;

        extend(getRendererType().prototype.symbols, NavigatorSymbols);
        extend(defaultOptions, { navigator: NavigatorDefaults });

        addEvent(SeriesClass, 'afterUpdate', onSeriesAfterUpdate);

        setOptions({ navigator: NavigatorDefaults });
    }

}

/**
 * Handle updating series
 * @private
 */
function onSeriesAfterUpdate(
    this: Series
): void {
    if (this.chart.navigator && !this.options.isInternal) {
        this.chart.navigator.setBaseSeries(null as any, false);
    }
}

/* *
 *
 *  Default Export
 *
 * */

const NavigatorComposition = {
    compose
};

export default NavigatorComposition;
