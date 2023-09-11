/* *
 *
 *  Organization chart module
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

import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type OrganizationDataLabelOptions from './OrganizationDataLabelOptions';
import type {
    OrganizationSeriesLevelOptions,
    OrganizationSeriesOptions
} from './OrganizationSeriesOptions';
import type SankeyColumnComposition from '../Sankey/SankeyColumnComposition.js';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGLabel from '../../Core/Renderer/SVG/SVGLabel';

import OrganizationPoint from './OrganizationPoint.js';
import OrganizationSeriesDefaults from './OrganizationSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
import PathUtilities from '../PathUtilities.js';
const {
    seriesTypes: {
        sankey: SankeySeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { extend, merge } = OH;
const {
    css,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.organization
 *
 * @augments Highcharts.seriesTypes.sankey
 */
class OrganizationSeries extends SankeySeries {

    /* *
     *
     *  Static Properties
     *
     * */


    public static defaultOptions = merge(
        SankeySeries.defaultOptions,
        OrganizationSeriesDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<OrganizationPoint> = void 0 as any;

    public options: OrganizationSeriesOptions = void 0 as any;

    public points: Array<OrganizationPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public alignDataLabel(
        point: OrganizationPoint,
        dataLabel: SVGLabel,
        options: OrganizationDataLabelOptions
    ): void {
        // Align the data label to the point graphic
        const shapeArgs = point.shapeArgs;
        if (options.useHTML && shapeArgs) {
            let width = shapeArgs.width || 0,
                height = shapeArgs.height || 0,
                padjust = (
                    (this.options.borderWidth as any) +
                    2 * (this.options.dataLabels as any).padding
                );

            if (this.chart.inverted) {
                width = height;
                height = shapeArgs.width || 0;
            }

            height -= padjust;
            width -= padjust;

            // Set the size of the surrounding div emulating `g`
            const text = dataLabel.text;
            if (text) {
                css(text.element.parentNode, {
                    width: width + 'px',
                    height: height + 'px'
                });

                // Set properties for the span emulating `text`
                css(text.element, {
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                });
            }

            // The getBBox function is used in `alignDataLabel` to align
            // inside the box
            dataLabel.getBBox = (): BBoxObject => (
                { width, height, x: 0, y: 0 }
            );

            // Overwrite dataLabel dimensions (#13100).
            dataLabel.width = width;
            dataLabel.height = height;
        }

        super.alignDataLabel.apply(this, arguments);
    }

    public createNode(id: string): OrganizationPoint {
        const node: OrganizationPoint = super.createNode.call(this, id) as any;

        // All nodes in an org chart are equal width
        node.getSum = (): number => 1;

        return node;

    }

    public pointAttribs(
        point: OrganizationPoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const series = this,
            attribs = SankeySeries.prototype.pointAttribs.call(
                series,
                point,
                state
            ),
            level = point.isNode ? point.level : point.fromNode.level,
            levelOptions: OrganizationSeriesLevelOptions =
                (series.mapOptionsToLevel as any)[level || 0] || {},
            options = point.options,
            stateOptions: OrganizationSeriesOptions =
                (levelOptions.states &&
                    (levelOptions.states as any)[state as any]) ||
                {},
            borderRadius = pick(
                stateOptions.borderRadius,
                options.borderRadius,
                levelOptions.borderRadius,
                series.options.borderRadius
            ),

            linkColor = pick(
                stateOptions.linkColor,
                options.linkColor,
                levelOptions.linkColor,
                series.options.linkColor,
                stateOptions.link && stateOptions.link.color,
                options.link && options.link.color,
                levelOptions.link && levelOptions.link.color,
                series.options.link && series.options.link.color
            ),

            linkLineWidth = pick(
                stateOptions.linkLineWidth,
                options.linkLineWidth,
                levelOptions.linkLineWidth,
                series.options.linkLineWidth,
                stateOptions.link && stateOptions.link.lineWidth,
                options.link && options.link.lineWidth,
                levelOptions.link && levelOptions.link.lineWidth,
                series.options.link && series.options.link.lineWidth
            ),

            linkOpacity = pick(
                stateOptions.linkOpacity,
                options.linkOpacity,
                levelOptions.linkOpacity,
                series.options.linkOpacity,
                stateOptions.link && stateOptions.link.linkOpacity,
                options.link && options.link.linkOpacity,
                levelOptions.link && levelOptions.link.linkOpacity,
                series.options.link && series.options.link.linkOpacity
            );

        if (!point.isNode) {
            attribs.stroke = linkColor;
            attribs['stroke-width'] = linkLineWidth;
            attribs.opacity = linkOpacity;

            delete attribs.fill;
        } else {
            if (isNumber(borderRadius)) {
                attribs.r = borderRadius;
            }
        }
        return attribs;
    }

    public translateLink(point: OrganizationPoint): void {
        let fromNode = point.fromNode,
            toNode = point.toNode,
            linkWidth = pick(
                this.options.linkLineWidth,
                this.options.link.lineWidth
            ),
            crisp = (Math.round(linkWidth) % 2) / 2,
            factor = pick((this as any).options.link.offset, 0.5),
            type = pick(
                point.options.link && point.options.link.type,
                this.options.link.type
            );
        if (fromNode.shapeArgs && toNode.shapeArgs) {

            let x1 = Math.floor(
                    (fromNode.shapeArgs.x || 0) +
                    (fromNode.shapeArgs.width || 0)
                ) + crisp,
                y1 = Math.floor(
                    (fromNode.shapeArgs.y || 0) +
                    (fromNode.shapeArgs.height || 0) / 2
                ) + crisp,
                x2 = Math.floor(toNode.shapeArgs.x || 0) + crisp,
                y2 = Math.floor(
                    (toNode.shapeArgs.y || 0) +
                    (toNode.shapeArgs.height || 0) / 2
                ) + crisp,
                xMiddle,
                hangingIndent: number = this.options.hangingIndent as any,
                toOffset = toNode.options.offset,
                percentOffset =
                    /%$/.test(toOffset as any) && parseInt(toOffset as any, 10),
                inverted = this.chart.inverted;

            if (inverted) {
                x1 -= (fromNode.shapeArgs.width || 0);
                x2 += (toNode.shapeArgs.width || 0);
            }
            xMiddle = this.colDistance ?
                Math.floor(
                    x2 +
                        ((inverted ? 1 : -1) *
                            (this.colDistance - this.nodeWidth)) /
                            2
                ) + crisp :
                Math.floor((x2 + x1) / 2) + crisp;

            // Put the link on the side of the node when an offset is given. HR
            // node in the main demo.
            if (
                percentOffset &&
                (percentOffset >= 50 || percentOffset <= -50)
            ) {
                xMiddle = x2 = Math.floor(
                    x2 + (inverted ? -0.5 : 0.5) *
                    (toNode.shapeArgs.width || 0)
                ) + crisp;
                y2 = toNode.shapeArgs.y || 0;
                if (percentOffset > 0) {
                    y2 += toNode.shapeArgs.height || 0;
                }
            }

            if (toNode.hangsFrom === fromNode) {
                if (this.chart.inverted) {
                    y1 = Math.floor(
                        (fromNode.shapeArgs.y || 0) +
                        (fromNode.shapeArgs.height || 0) -
                        hangingIndent / 2
                    ) + crisp;
                    y2 = (
                        (toNode.shapeArgs.y || 0) +
                        (toNode.shapeArgs.height || 0)
                    );
                } else {
                    y1 = Math.floor(
                        (fromNode.shapeArgs.y || 0) +
                        hangingIndent / 2
                    ) + crisp;

                }
                xMiddle = x2 = Math.floor(
                    (toNode.shapeArgs.x || 0) +
                    (toNode.shapeArgs.width || 0) / 2
                ) + crisp;
            }

            point.plotX = xMiddle;
            point.plotY = (y1 + y2) / 2;
            point.shapeType = 'path';
            if (type === 'straight') {
                point.shapeArgs = {
                    d: [
                        ['M', x1, y1],
                        ['L', x2, y2]
                    ]
                };
            } else if (type === 'curved') {
                const offset = Math.abs(x2 - x1) * factor * (inverted ? -1 : 1);
                point.shapeArgs = {
                    d: [
                        ['M', x1, y1],
                        ['C', x1 + offset, y1, x2 - offset, y2, x2, y2]
                    ]
                };
            } else {
                point.shapeArgs = {
                    d: PathUtilities.applyRadius(
                        [
                            ['M', x1, y1],
                            ['L', xMiddle, y1],
                            ['L', xMiddle, y2],
                            ['L', x2, y2]
                        ],
                        pick(this.options.linkRadius, this.options.link.radius)
                    )
                };
            }

            point.dlBox = {
                x: (x1 + x2) / 2,
                y: (y1 + y2) / 2,
                height: linkWidth,
                width: 0
            };

        }
    }

    public translateNode(
        node: OrganizationPoint,
        column: SankeyColumnComposition.ArrayComposition<OrganizationPoint>
    ): void {
        SankeySeries.prototype.translateNode.call(this, node, column);
        let parentNode = node.hangsFrom,
            indent = this.options.hangingIndent || 0,
            sign = this.chart.inverted ? -1 : 1,
            shapeArgs = (node.shapeArgs as any),
            indentLogic = this.options.hangingIndentTranslation,
            minLength = this.options.minNodeLength || 10;

        if (parentNode) {
            if (indentLogic === 'cumulative') {
                // Move to the right:
                shapeArgs.height -= indent;
                shapeArgs.y -= sign * indent;
                while (parentNode) {
                    shapeArgs.y += sign * indent;
                    parentNode = parentNode.hangsFrom;
                }
            } else if (indentLogic === 'shrink') {
                // Resize the node:
                while (
                    parentNode &&
                    shapeArgs.height > indent + minLength
                ) {
                    shapeArgs.height -= indent;
                    parentNode = parentNode.hangsFrom;
                }
            } else {
                // indentLogic === "inherit"
                // Do nothing (v9.3.2 and prev versions):
                shapeArgs.height -= indent;
                if (!this.chart.inverted) {
                    shapeArgs.y += indent;
                }
            }
        }
        node.nodeHeight = this.chart.inverted ?
            shapeArgs.width :
            shapeArgs.height;
    }

    public drawDataLabels(): void {
        const dlOptions = this.options.dataLabels;

        if (dlOptions.linkTextPath && dlOptions.linkTextPath.enabled) {
            for (const link of this.points) {
                link.options.dataLabels = merge(link.options.dataLabels,
                    { useHTML: false });
            }
        }

        super.drawDataLabels();
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface OrganizationSeries {
    pointClass: typeof OrganizationPoint;
}
extend(OrganizationSeries.prototype, {
    pointClass: OrganizationPoint
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        organization: typeof OrganizationSeries;
    }
}
SeriesRegistry.registerSeriesType('organization', OrganizationSeries);

/* *
 *
 *  Default Export
 *
 * */

export default OrganizationSeries;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Layout value for the child nodes in an organization chart. If `hanging`, this
 * node's children will hang below their parent, allowing a tighter packing of
 * nodes in the diagram.
 *
 * @typedef {"normal"|"hanging"} Highcharts.SeriesOrganizationNodesLayoutValue
 */

/**
 * Indent translation value for the child nodes in an organization chart, when
 * parent has `hanging` layout. Option can shrink nodes (for tight charts),
 * translate children to the left, or render nodes directly under the parent.
 *
 * @typedef {"inherit"|"cumulative"|"shrink"} Highcharts.OrganizationHangingIndentTranslationValue
 */

''; // detach doclets above
