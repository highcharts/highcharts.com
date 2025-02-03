/* *
 *
 *  (c) 2010-2024 Pawel Lysy
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

import type TreemapSeries from './TreemapSeries';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type TreemapPoint from './TreemapPoint';

/* *
 *
 *  Class
 *
 * */

class TreemapNode {

    /* *
     *
     *  Properties
     *
     * */

    childrenTotal = 0;
    ignore?: boolean;
    isLeaf?: boolean;
    isGroup?: boolean;
    levelDynamic?: number;
    name?: string;
    parent?: string;
    parentNode?: TreemapNode;
    pointValues?: TreemapNode.NodeValuesObject;
    sortIndex?: number;
    values?: TreemapNode.NodeValuesObject;
    visible = false;
    zIndex?: number;


    /* *
     *
     *  Functions
     *
     * */

    public init(
        id: string,
        i: number,
        children: Array<TreemapNode>,
        height: number,
        level: number,
        series: TreemapSeries,
        parent?: string
    ): TreemapNode {
        this.id = id;
        this.i = i;
        this.children = children;
        this.height = height;
        this.level = level;
        this.series = series;
        this.parent = parent;

        return this;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface TreemapNode {
    areaCorrection?: number;
    height: number;
    i: number;
    id: string;
    children: Array<TreemapNode>;
    level: number;
    series: TreemapSeries;
    val: number;
    point: TreemapPoint;
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace TreemapNode {

    /* *
     *
     *  Declarations
     *
     * */

    export interface NodeValuesObject extends BBoxObject {
        direction: number;
        val: number;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default TreemapNode;
