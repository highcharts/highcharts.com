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

import type ColorMapComposition from '../ColorMapComposition';
import type { DrawPointParams } from '../DrawPointUtilities';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type TreemapNode from './TreemapNode';
import type TreemapPointOptions from './TreemapPointOptions';
import type TreemapSeries from './TreemapSeries';

import DPU from '../DrawPointUtilities.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    pie: { prototype: { pointClass: PiePoint } },
    scatter: { prototype: { pointClass: ScatterPoint } }
} = SeriesRegistry.seriesTypes;
import U from '../../Core/Utilities.js';
const {
    extend,
    isNumber,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class TreemapPoint extends ScatterPoint {

    /* *
     *
     *  Properties
     *
     * */

    public drillId?: (boolean|string);

    public imageUrl?: string;

    public name: string = void 0 as any;

    public node: TreemapNode = void 0 as any;

    public options: TreemapPointOptions = void 0 as any;

    public parent?: string;

    public series: TreemapSeries = void 0 as any;

    public shapeType: 'arc'|'circle'|'image'|'path'|'rect'|'text' = 'rect';

    public sortIndex?: number;

    public value: (number|null) = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public draw(
        params: DrawPointParams
    ): void {
        DPU.draw(this, params);
    }

    public getClassName(): string {
        const series = this.series,
            options = series.options;

        let className = super.getClassName();

        // Above the current level
        if (this.node.level <= series.nodeMap[series.rootNode].level) {
            className += ' highcharts-above-level';

        } else if (
            !this.node.isLeaf &&
        !pick(options.interactByLeaf, !options.allowTraversingTree)
        ) {
            className += ' highcharts-internal-node-interactive';

        } else if (!this.node.isLeaf) {
            className += ' highcharts-internal-node';
        }

        return className;
    }

    /**
     * A tree point is valid if it has han id too, assume it may be a parent
     * item.
     *
     * @private
     * @function Highcharts.Point#isValid
     */
    public isValid(): boolean {
        return Boolean(this.id || isNumber(this.value));
    }

    public setState(state?: StatesOptionsKey): void {
        super.setState.apply(this, arguments);

        // Graphic does not exist when point is not visible.
        if (this.graphic) {
            this.graphic.attr({
                zIndex: state === 'hover' ? 1 : 0
            });
        }
    }

    public shouldDraw(): boolean {
        return isNumber(this.plotY) && this.y !== null;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface TreemapPoint extends ColorMapComposition.PointComposition {
    setVisible: typeof PiePoint.prototype.setVisible;
}

extend(TreemapPoint.prototype, {
    setVisible: PiePoint.prototype.setVisible
});

/* *
 *
 *  Default Export
 *
 * */

export default TreemapPoint;
