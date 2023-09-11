/* *
 *
 *  Arc diagram module
 *
 *  (c) 2018-2021 Torstein Honsi
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

import type ArcDiagramPointOptions from './ArcDiagramPointOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import ArcDiagramSeries from './ArcDiagramSeries';
import NodesComposition from '../NodesComposition.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        sankey: {
            prototype: {
                pointClass: SankeyPoint
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

class ArcDiagramPoint extends SankeyPoint {

    /* *
     *
     *  Properties
     *
     * */

    public fromNode: ArcDiagramPoint = void 0 as any;

    public index: number = void 0 as any;

    public linksFrom: Array<ArcDiagramPoint> = void 0 as any;

    public linksTo: Array<ArcDiagramPoint> = void 0 as any;

    public options: ArcDiagramPointOptions = void 0 as any;

    public series: ArcDiagramSeries = void 0 as any;

    public scale: number = void 0 as any;

    public shapeArgs: SVGAttributes = void 0 as any;

    public toNode: ArcDiagramPoint = void 0 as any;


    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public isValid(): boolean {
        // No null points here
        return true;
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Prototype Properties
 *
 * */

interface ArcDiagramPoint {
    setState: typeof NodesComposition['setNodeState'];
}
extend(ArcDiagramPoint.prototype, {
    setState: NodesComposition.setNodeState
});

/* *
 *
 *  Default Export
 *
 * */

export default ArcDiagramPoint;
