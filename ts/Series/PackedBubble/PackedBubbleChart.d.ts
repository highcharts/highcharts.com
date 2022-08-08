/* *
 *
 *  (c) 2010-2021 Grzegorz Blachlinski, Sebastian Bochan
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

import type Chart from '../../Core/Chart/Chart';
import type LayoutType from '../Networkgraph/LayoutType';
import type PackedBubblePoint from './PackedBubblePoint';
import type PackedBubbleSeries from './PackedBubbleSeries';

/* *
 *
 *  Class
 *
 * */

declare class PackedBubbleChart extends Chart {
    allDataPoints: Array<PackedBubbleSeries.Data>;
    diffX: number;
    diffY: number;
    hoverPoint: PackedBubblePoint;
    maxRadius: number;
    minRadius: number;
    rawPositions: Array<Array<number>>;
    stages: Array<Array<(number|object|null)>>;
}

/* *
 *
 *  Class Prototype
 *
 * */

interface PackedBubbleChart extends Highcharts.NetworkgraphChart {
    graphLayoutsLookup: Array<LayoutType>;
}

/* *
 *
 *  Default Export
 *
 * */

export default PackedBubbleChart;
