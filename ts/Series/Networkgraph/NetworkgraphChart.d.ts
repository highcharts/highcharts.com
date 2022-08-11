/* *
 *
 *  Networkgraph series
 *
 *  (c) 2010-2021 Paweł Fus
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

import type ReingoldFruchtermanLayout from './ReingoldFruchtermanLayout.js';

/* *
 *
 *  Declarations
 *
 * */

export interface NetworkgraphChart extends Highcharts.DragNodesChart {
    graphLayoutsLookup: Array<ReingoldFruchtermanLayout>;
    graphLayoutsStorage: Record<string, ReingoldFruchtermanLayout>;
}

/* *
 *
 *  Default Export
 *
 * */

export default NetworkgraphChart;
