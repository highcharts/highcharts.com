/* *
 *
 *  (c) 2010-2021 Grzegorz Blachlinski, Sebastian Bochan
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
import type { BubblePointMarkerOptions } from '../Bubble/BubblePointOptions';
import type BubbleSeriesType from '../Bubble/BubbleSeries';
import type Chart from '../../Core/Chart/Chart';
import type { DragNodesPoint, DragNodesSeries } from '../DragNodesComposition';
import type Legend from '../../Core/Legend/Legend';
import type NetworkgraphSeries from '../Networkgraph/NetworkgraphSeries';
import type PackedBubbleChart from './PackedBubbleChart';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type PackedBubblePointOptions from './PackedBubblePointOptions';
import type PackedBubbleSeriesOptions from './PackedBubbleSeriesOptions';
import type SeriesType from '../../Core/Series/Series';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import Color from '../../Core/Color/Color.js';
const { parse: color } = Color;
import DragNodesComposition from '../DragNodesComposition.js';
import GraphLayout from '../GraphLayoutComposition.js';
import H from '../../Core/Globals.js';
const { noop } = H;
import PackedBubblePoint from './PackedBubblePoint.js';
import PackedBubbleSeriesDefaults from './PackedBubbleSeriesDefaults.js';
import PackedBubbleLayout from './PackedBubbleLayout.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    series: {
        prototype: seriesProto
    },
    seriesTypes: {
        bubble: BubbleSeries
    }
} = SeriesRegistry;
import D from '../SimulationSeriesUtilities.js';
const {
    initDataLabels,
    initDataLabelsDefer
} = D;
import U from '../../Shared/Utilities.js';
const {
    clamp,
    pick
} = U;
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { extend } = OH;
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber } = TC;
const { defined, merge } = OH;
const { addEvent, fireEvent } = EH;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 * @class
 * @name Highcharts.seriesTypes.packedbubble
 *
 * @extends Highcharts.Series
 */
class PackedBubbleSeries extends BubbleSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: PackedBubbleSeriesOptions = merge(
        BubbleSeries.defaultOptions,
        PackedBubbleSeriesDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        AxisClass: typeof Axis,
        ChartClass: typeof Chart,
        LegendClass: typeof Legend,
        SeriesClass: typeof SeriesType
    ): void {
        BubbleSeries.compose(AxisClass, ChartClass, LegendClass, SeriesClass);
        DragNodesComposition.compose(ChartClass);
        PackedBubbleLayout.compose(ChartClass);
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: PackedBubbleChart = void 0 as any;

    public data: Array<PackedBubblePoint> = void 0 as any;

    public hoverPoint?: PackedBubblePoint;

    public layout: PackedBubbleLayout = void 0 as any;

    public options: PackedBubbleSeriesOptions = void 0 as any;

    public parentNode?: PackedBubblePoint;

    public parentNodeLayout?: PackedBubbleLayout;

    public parentNodesGroup?: SVGElement;

    public parentNodeMass: number = 0;

    public parentNodeRadius?: number;

    public points: Array<PackedBubblePoint> = void 0 as any;

    public xData: Array<number> = void 0 as any;

    public deferDataLabels: boolean = true;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    /**
     * Create a single array of all points from all series
     * @private
     */
    public accumulateAllPoints(): Array<PackedBubbleSeries.Data> {
        const chart = this.chart,
            allDataPoints = [] as Array<PackedBubbleSeries.Data>;

        let yData: SeriesType['yData'];

        for (const series of chart.series) {
            if (
                series.is('packedbubble') && // #13574
                series.visible ||
                !chart.options.chart.ignoreHiddenSeries
            ) {
                yData = series.yData || [];

                // add data to array only if series is visible
                for (let j = 0; j < yData.length; j++) {
                    allDataPoints.push([
                        null, null,
                        yData[j] as (number|null),
                        series.index,
                        j,
                        {
                            id: j as any,
                            marker: {
                                radius: 0
                            }
                        }
                    ]);
                }
            }
        }

        return allDataPoints;
    }

    /**
     * Adding the basic layout to series points.
     * @private
     */
    public addLayout(): void {
        const layoutOptions = this.options.layoutAlgorithm =
                this.options.layoutAlgorithm || {},
            layoutType = layoutOptions.type || 'packedbubble',
            chartOptions = this.chart.options.chart;

        let graphLayoutsStorage = this.chart.graphLayoutsStorage,
            graphLayoutsLookup = this.chart.graphLayoutsLookup,
            layout: PackedBubbleLayout;

        if (!graphLayoutsStorage) {
            this.chart.graphLayoutsStorage = graphLayoutsStorage = {};
            this.chart.graphLayoutsLookup = graphLayoutsLookup = [];
        }

        layout = graphLayoutsStorage[layoutType] as PackedBubbleLayout;

        if (!layout) {
            layoutOptions.enableSimulation =
                !defined(chartOptions.forExport) ?
                    layoutOptions.enableSimulation :
                    !chartOptions.forExport;

            graphLayoutsStorage[layoutType] = layout =
                new GraphLayout.layouts[layoutType]() as PackedBubbleLayout;

            layout.init(layoutOptions);
            graphLayoutsLookup.splice(layout.index, 0, layout);

        }

        this.layout = layout;

        this.points.forEach((node): void => {
            node.mass = 2;
            node.degree = 1;
            node.collisionNmb = 1;
        });

        layout.setArea(0, 0, this.chart.plotWidth, this.chart.plotHeight);
        layout.addElementsToCollection([this], layout.series);
        layout.addElementsToCollection(this.points, layout.nodes);
    }

    /**
     * Function responsible for adding series layout, used for parent nodes.
     * @private
     */
    public addSeriesLayout(): void {
        const layoutOptions = this.options.layoutAlgorithm =
                this.options.layoutAlgorithm || {},
            layoutType = (layoutOptions.type || 'packedbubble'),
            graphLayoutsStorage = this.chart.graphLayoutsStorage,
            graphLayoutsLookup = this.chart.graphLayoutsLookup,
            parentNodeOptions = merge(
                layoutOptions,
                (layoutOptions as any).parentNodeOptions,
                {
                    enableSimulation: this.layout.options.enableSimulation
                }
            );

        let seriesLayout =
            graphLayoutsStorage[layoutType + '-series'] as PackedBubbleLayout;

        if (!seriesLayout) {

            graphLayoutsStorage[layoutType + '-series'] = seriesLayout =
                new GraphLayout.layouts[layoutType]() as PackedBubbleLayout;

            seriesLayout.init(parentNodeOptions);

            graphLayoutsLookup.splice(
                seriesLayout.index, 0, seriesLayout
            );
        }
        this.parentNodeLayout = seriesLayout;
        this.createParentNodes();
    }

    /**
     * The function responsible for calculating the parent node radius
     * based on the total surface of iniside-bubbles and the group BBox
     * @private
     */
    public calculateParentRadius(): void {
        const bBox = this.seriesBox(),
            parentPadding = 20,
            minParentRadius = 20;

        this.parentNodeRadius = clamp(
            Math.sqrt(
                2 * (this.parentNodeMass as any) / Math.PI
            ) + parentPadding,
            minParentRadius,
            bBox ?
                Math.max(
                    Math.sqrt(
                        Math.pow((bBox as any).width, 2) +
                        Math.pow((bBox as any).height, 2)
                    ) / 2 + parentPadding,
                    minParentRadius
                ) :
                Math.sqrt(
                    2 * (this.parentNodeMass as any) / Math.PI
                ) + parentPadding
        );

        if (this.parentNode) {
            (this.parentNode as any).marker.radius =
                this.parentNode.radius = this.parentNodeRadius;
        }
    }

    /**
     * Calculate min and max bubble value for radius calculation.
     * @private
     */
    public calculateZExtremes(): Array<number> {
        const chart = this.chart,
            allSeries = chart.series as Array<PackedBubbleSeries>;

        let zMin = this.options.zMin,
            zMax = this.options.zMax,
            valMin = Infinity,
            valMax = -Infinity;

        if (zMin && zMax) {
            return [zMin, zMax];
        }
        // it is needed to deal with null
        // and undefined values
        allSeries.forEach((series): void => {
            series.yData.forEach((y): void => {
                if (defined(y)) {
                    if (y > valMax) {
                        valMax = y;
                    }
                    if (y < valMin) {
                        valMin = y;
                    }
                }
            });
        });

        zMin = pick(zMin, valMin);
        zMax = pick(zMax, valMax);

        return [zMin, zMax];
    }

    /**
     * Check if two bubbles overlaps.
     * @private
     */
    public checkOverlap(
        bubble1: Array<number>,
        bubble2: Array<number>
    ): boolean {
        const diffX = bubble1[0] - bubble2[0], // diff of X center values
            diffY = bubble1[1] - bubble2[1], // diff of Y center values
            sumRad = bubble1[2] + bubble2[2]; // sum of bubble radius

        return (
            Math.sqrt(diffX * diffX + diffY * diffY) -
            Math.abs(sumRad)
        ) < -0.001;
    }

    /**
     * Creating parent nodes for split series, in which all the bubbles
     * are rendered.
     * @private
     */
    public createParentNodes(): void {
        const PackedBubblePoint = this.pointClass,
            chart = this.chart,
            parentNodeLayout: PackedBubbleLayout = (
                this.parentNodeLayout as any
            ),
            layoutOptions = this.layout.options;

        let nodeAdded,
            parentNode = this.parentNode,
            parentMarkerOptions: BubblePointMarkerOptions = {
                radius: this.parentNodeRadius,
                lineColor: this.color,
                fillColor: color(this.color).brighten(0.4).get()
            };

        if (layoutOptions.parentNodeOptions) {
            parentMarkerOptions = merge(
                layoutOptions.parentNodeOptions.marker || {},
                parentMarkerOptions
            );
        }
        this.parentNodeMass = 0;

        this.points.forEach((p): void => {
            (this.parentNodeMass as any) +=
                Math.PI * Math.pow((p.marker as any).radius, 2);
        });

        this.calculateParentRadius();
        parentNodeLayout.nodes.forEach((node): void => {
            if (node.seriesIndex === this.index) {
                nodeAdded = true;
            }
        });
        parentNodeLayout.setArea(0, 0, chart.plotWidth, chart.plotHeight);
        if (!nodeAdded) {
            if (!parentNode) {
                parentNode = (
                    new PackedBubblePoint()
                ).init(
                    this,
                    {
                        mass: (this.parentNodeRadius as any) / 2,
                        marker: parentMarkerOptions,
                        dataLabels: {
                            inside: false
                        },
                        states: {
                            normal: {
                                marker: parentMarkerOptions
                            },
                            hover: {
                                marker: parentMarkerOptions
                            }
                        },
                        dataLabelOnNull: true,
                        degree: this.parentNodeRadius,
                        isParentNode: true,
                        seriesIndex: this.index
                    } as any
                ) as any;
            }
            if (this.parentNode) {
                (parentNode as any).plotX = this.parentNode.plotX;
                (parentNode as any).plotY = this.parentNode.plotY;
            }
            this.parentNode = parentNode;
            parentNodeLayout.addElementsToCollection(
                [this], parentNodeLayout.series
            );
            parentNodeLayout.addElementsToCollection(
                [parentNode as any], parentNodeLayout.nodes
            );
        }
    }

    /**
     * Function responsible for adding all the layouts to the chart.
     * @private
     */
    public deferLayout(): void {
        // TODO split layouts to independent methods
        const layoutOptions = this.options.layoutAlgorithm;

        if (!this.visible) {
            return;
        }
        // layout is using nodes for position calculation
        this.addLayout();

        if ((layoutOptions as any).splitSeries) {
            this.addSeriesLayout();
        }
    }

    public destroy(): void {
        // Remove the series from all layouts series collections #11469
        if (this.chart.graphLayoutsLookup) {
            this.chart.graphLayoutsLookup.forEach((layout): void => {
                layout.removeElementFromCollection(this, layout.series as any);
            }, this);
        }

        if (
            this.parentNode &&
            this.parentNodeLayout
        ) {
            this.parentNodeLayout.removeElementFromCollection(
                this.parentNode, this.parentNodeLayout.nodes
            );
            if (this.parentNode.dataLabel) {
                this.parentNode.dataLabel =
                    this.parentNode.dataLabel.destroy();
            }
        }
        seriesProto.destroy.apply(this, arguments as any);
    }

    /**
     * Packedbubble has two separate collecions of nodes if split, render
     * dataLabels for both sets:
     * @private
     */
    public drawDataLabels(): void {
        // We defer drawing the dataLabels
        // until dataLabels.animation.defer time passes
        if (this.deferDataLabels) {
            return;
        }

        seriesProto.drawDataLabels.call(this, this.points);

        // Render parentNode labels:
        if (this.parentNode) {
            this.parentNode.formatPrefix = 'parentNode';
            seriesProto.drawDataLabels.call(this, [this.parentNode]);
        }
    }

    /**
     * Create Background/Parent Nodes for split series.
     * @private
     */
    public drawGraph(): void {

        // if the series is not using layout, don't add parent nodes
        if (!this.layout || !this.layout.options.splitSeries) {
            return;
        }

        const chart = this.chart,
            nodeMarker: BubblePointMarkerOptions =
                (this.layout.options.parentNodeOptions as any).marker,
            parentOptions: SVGAttributes = {
                fill: (
                    nodeMarker.fillColor ||
                    color(this.color).brighten(0.4).get()
                ),
                opacity: nodeMarker.fillOpacity,
                stroke: nodeMarker.lineColor || this.color,
                'stroke-width': pick(
                    nodeMarker.lineWidth,
                    this.options.lineWidth
                )
            };

        let parentAttribs: SVGAttributes = {};

        // Create the group for parent Nodes if doesn't exist
        // If exists it will only be adjusted to the updated plot size (#12063)
        this.parentNodesGroup = this.plotGroup(
            'parentNodesGroup',
            'parentNode',
            this.visible ? 'inherit' : 'hidden',
            0.1, chart.seriesGroup
        );
        this.group?.attr({
            zIndex: 2
        });

        this.calculateParentRadius();
        if (
            this.parentNode &&
            defined(this.parentNode.plotX) &&
            defined(this.parentNode.plotY) &&
            defined(this.parentNodeRadius)
        ) {
            parentAttribs = merge({
                x: this.parentNode.plotX -
                    this.parentNodeRadius,
                y: this.parentNode.plotY -
                    this.parentNodeRadius,
                width: this.parentNodeRadius * 2,
                height: this.parentNodeRadius * 2
            }, parentOptions);
            if (!this.parentNode.graphic) {
                this.graph = this.parentNode.graphic =
                    chart.renderer.symbol((parentOptions as any).symbol)
                        .add(this.parentNodesGroup);
            }
            this.parentNode.graphic.attr(parentAttribs);
        }
    }

    public drawTracker(): void {
        const parentNode = this.parentNode;
        // chart = series.chart,
        // pointer = chart.pointer,
        // onMouseOver = function (e: PointerEvent): void {
        //     const point = pointer.getPointFromEvent(e);
        //     // undefined on graph in scatterchart
        //     if (typeof point !== 'undefined') {
        //         pointer.isDirectTouch = true;
        //         point.onMouseOver(e);
        //     }
        // };

        let dataLabels;

        super.drawTracker();
        // Add reference to the point
        if (parentNode) {
            dataLabels = (
                isArray(parentNode.dataLabels) ?
                    parentNode.dataLabels :
                    (parentNode.dataLabel ? [parentNode.dataLabel] : [])
            );

            if (parentNode.graphic) {
                (parentNode.graphic.element as any).point = parentNode;
            }

            dataLabels.forEach((dataLabel): void => {
                if (dataLabel.div) {
                    dataLabel.div.point = parentNode;
                } else {
                    (dataLabel.element as any).point = parentNode;
                }
            });
        }
    }

    /**
     * Calculate radius of bubbles in series.
     * @private
     */
    public getPointRadius(): void {
        const chart = this.chart,
            plotWidth = chart.plotWidth,
            plotHeight = chart.plotHeight,
            seriesOptions = this.options,
            useSimulation = seriesOptions.useSimulation,
            smallestSize = Math.min(plotWidth, plotHeight),
            extremes = {} as Record<string, number>,
            radii = [] as Array<(number|null)>,
            allDataPoints = chart.allDataPoints || [],
            allDataPointsLength = allDataPoints.length;

        let minSize: number,
            maxSize: number,
            value: (number|null),
            radius: (number|null);

        ['minSize', 'maxSize'].forEach((prop: string): void => {
            const length = parseInt((seriesOptions as any)[prop], 10),
                isPercent = /%$/.test((seriesOptions as any)[prop]);

            extremes[prop] = isPercent ?
                smallestSize * length / 100 :
                length * Math.sqrt(allDataPointsLength);
        });

        chart.minRadius = minSize = extremes.minSize /
            Math.sqrt(allDataPointsLength);
        chart.maxRadius = maxSize = extremes.maxSize /
            Math.sqrt(allDataPointsLength);

        const zExtremes = useSimulation ?
            this.calculateZExtremes() :
            [minSize, maxSize];

        allDataPoints.forEach((point, i): void => {

            value = useSimulation ?
                clamp(
                    point[2] as any,
                    zExtremes[0],
                    zExtremes[1]
                ) :
                (point[2] as any);

            radius = this.getRadius(
                zExtremes[0],
                zExtremes[1],
                minSize,
                maxSize,
                value
            );
            if (radius === 0) {
                radius = null;
            }
            allDataPoints[i][2] = radius;
            radii.push(radius);
        });

        this.radii = radii;
    }

    public init(): PackedBubbleSeries {
        seriesProto.init.apply(this, arguments);
        initDataLabelsDefer.call(this);

        /* eslint-disable no-invalid-this */

        // When one series is modified, the others need to be recomputed
        this.eventsToUnbind.push(addEvent(this, 'updatedData', function (
            this: PackedBubbleSeries
        ): void {
            this.chart.series.forEach((s): void => {
                if (s.type === this.type) {
                    s.isDirty = true;
                }
            }, this);
        }));

        /* eslint-enable no-invalid-this */

        return this;
    }

    /**
     * Mouse up action, finalizing drag&drop.
     * @private
     * @param {Highcharts.Point} point The point that event occured.
     */
    public onMouseUp(
        dnPoint: DragNodesPoint
    ): void {
        const point = dnPoint as PackedBubblePoint;

        if (point.fixedPosition && !point.removed) {
            const layout = this.layout,
                parentNodeLayout = this.parentNodeLayout;

            let distanceXY,
                distanceR;

            if (parentNodeLayout && layout.options.dragBetweenSeries) {
                parentNodeLayout.nodes.forEach((node): void => {
                    if (
                        point && point.marker &&
                        node !== point.series.parentNode
                    ) {
                        distanceXY = layout.getDistXY(point, node);
                        distanceR = (
                            layout.vectorLength(distanceXY) -
                            (node.marker as any).radius -
                            (point.marker as any).radius
                        );
                        if (distanceR < 0) {
                            node.series.addPoint(merge(point.options, {
                                plotX: point.plotX,
                                plotY: point.plotY
                            }), false);
                            layout.removeElementFromCollection(
                                point, layout.nodes
                            );
                            point.remove();
                        }
                    }
                });
            }
            DragNodesComposition.onMouseUp.apply(this, arguments as any);
        }
    }

    /**
     * This is the main function responsible
     * for positioning all of the bubbles
     * allDataPoints - bubble array, in format [pixel x value,
     * pixel y value, radius,
     * related series index, related point index]
     * @private
     * @param {Array<Highcharts.PackedBubbleData>} allDataPoints All points from all series
     * @return {Array<Highcharts.PackedBubbleData>} Positions of all bubbles
     */
    public placeBubbles(
        allDataPoints: Array<PackedBubbleSeries.Data>
    ): Array<PackedBubbleSeries.Data> {
        const checkOverlap = this.checkOverlap,
            positionBubble = this.positionBubble,
            bubblePos = [] as Array<Array<Array<number>>>;

        let stage = 1,
            j = 0,
            k = 0,
            calculatedBubble,
            arr = [] as Array<PackedBubbleSeries.Data>,
            i: number;

        // sort all points
        const sortedArr = allDataPoints.sort((a, b): number =>
            (b[2] as any) - (a[2] as any)
        );

        if (sortedArr.length) {
            // create first bubble in the middle of the chart
            bubblePos.push([
                [
                    0, // starting in 0,0 coordinates
                    0,
                    sortedArr[0][2] as any, // radius
                    sortedArr[0][3], // series index
                    sortedArr[0][4]
                ] // point index
            ]); // 0 level bubble
            if (sortedArr.length > 1) {

                bubblePos.push([
                    [
                        0,
                        (
                            0 - (sortedArr[1][2] as any) -
                            (sortedArr[0][2] as any)
                        ),
                        // move bubble above first one
                        sortedArr[1][2] as any,
                        sortedArr[1][3],
                        sortedArr[1][4]
                    ]
                ]); // 1 level 1st bubble

                // first two already positioned so starting from 2
                for (i = 2; i < sortedArr.length; i++) {
                    sortedArr[i][2] = sortedArr[i][2] || 1;
                    // in case if radius is calculated as 0.
                    calculatedBubble = positionBubble(
                        bubblePos[stage][j] as any,
                        bubblePos[stage - 1][k] as any,
                        sortedArr[i] as any
                    ); // calculate initial bubble position

                    if (
                        checkOverlap(
                            calculatedBubble,
                            bubblePos[stage][0] as any
                        )
                    ) {
                        /* if new bubble is overlapping with first bubble
                            * in current level (stage)
                            */

                        bubblePos.push([]);
                        k = 0;
                        /* reset index of bubble, used for
                            * positioning the bubbles around it,
                            * we are starting from first bubble in next
                            * stage because we are changing level to higher
                            */
                        bubblePos[stage + 1].push(
                            positionBubble(
                                bubblePos[stage][j] as any,
                                bubblePos[stage][0] as any,
                                sortedArr[i] as any
                            )
                        );
                        // (last bubble, 1. from curr stage, new bubble)
                        stage++; // the new level is created, above current
                        j = 0; // set the index of bubble in curr level to 0
                    } else if (
                        stage > 1 &&
                        bubblePos[stage - 1][k + 1] &&
                        checkOverlap(
                            calculatedBubble,
                            bubblePos[stage - 1][k + 1] as any
                        )
                    ) {
                        /* if new bubble is overlapping with one of the prev
                            * stage bubbles, it means that - bubble, used for
                            * positioning the bubbles around it has changed
                            * so we need to recalculate it
                            */
                        k++;
                        bubblePos[stage].push(
                            positionBubble(
                                bubblePos[stage][j] as any,
                                bubblePos[stage - 1][k] as any,
                                sortedArr[i] as any
                            )
                        );
                        // (last bubble, prev stage bubble, new bubble)
                        j++;
                    } else { // simply add calculated bubble
                        j++;
                        bubblePos[stage].push(calculatedBubble);
                    }
                }
            }
            this.chart.stages = bubblePos;
            // it may not be necessary but adding it just in case -
            // it is containing all of the bubble levels

            this.chart.rawPositions =
                ([] as Array<Array<number>>)
                    .concat.apply([], bubblePos);
            // bubble positions merged into one array

            this.resizeRadius();
            arr = this.chart.rawPositions as any;
        }
        return arr;
    }

    /**
     * Function that checks for a parentMarker and sets the correct opacity.
     * @private
     * @param {Highcharts.Pack} point
     * Candidate point for opacity correction.
     * @param {string} [state]
     * The point state, can be either `hover`, `select` or 'normal'. If
     * undefined, normal state is assumed.
     *
     * @return {Highcharts.SVGAttributes}
     * The presentational attributes to be set on the point.
     */
    public pointAttribs(
        point?: PackedBubblePoint,
        state?: StatesOptionsKey
    ): SVGAttributes {
        const options = this.options,
            hasParentMarker = point && point.isParentNode;

        let markerOptions = options.marker;

        if (
            hasParentMarker &&
            options.layoutAlgorithm &&
            options.layoutAlgorithm.parentNodeOptions
        ) {
            markerOptions = options.layoutAlgorithm.parentNodeOptions.marker;
        }

        const fillOpacity =
                (markerOptions as BubblePointMarkerOptions).fillOpacity,
            attr = seriesProto.pointAttribs.call(this, point, state);

        if (fillOpacity !== 1) {
            attr['fill-opacity'] = fillOpacity;
        }

        return attr;
    }

    /**
     * Function that is adding one bubble based on positions and sizes of
     * two other bubbles, lastBubble is the last added bubble, newOrigin is
     * the bubble for positioning new bubbles. nextBubble is the curently
     * added bubble for which we are calculating positions
     * @private
     * @param {Array<number>} lastBubble The closest last bubble
     * @param {Array<number>} newOrigin New bubble
     * @param {Array<number>} nextBubble The closest next bubble
     * @return {Array<number>} Bubble with correct positions
     */
    public positionBubble(
        lastBubble: Array<number>,
        newOrigin: Array<number>,
        nextBubble: Array<number>
    ): Array<number> {
        const sqrt = Math.sqrt,
            asin = Math.asin,
            acos = Math.acos,
            pow = Math.pow,
            abs = Math.abs,
            distance = sqrt( // dist between lastBubble and newOrigin
                pow((lastBubble[0] - newOrigin[0]), 2) +
                pow((lastBubble[1] - newOrigin[1]), 2)
            ),
            alfa = acos(
                // from cosinus theorem: alfa is an angle used for
                // calculating correct position
                (
                    pow(distance, 2) +
                    pow(nextBubble[2] + newOrigin[2], 2) -
                    pow(nextBubble[2] + lastBubble[2], 2)
                ) / (2 * (nextBubble[2] + newOrigin[2]) * distance)
            ),

            beta = asin( // from sinus theorem.
                abs(lastBubble[0] - newOrigin[0]) /
                distance
            ),
            // providing helping variables, related to angle between
            // lastBubble and newOrigin
            gamma = (lastBubble[1] - newOrigin[1]) < 0 ? 0 : Math.PI,
            // if new origin y is smaller than last bubble y value
            // (2 and 3 quarter),
            // add Math.PI to final angle

            delta = (lastBubble[0] - newOrigin[0]) *
            (lastBubble[1] - newOrigin[1]) < 0 ?
                1 : -1, // (1st and 3rd quarter)
            finalAngle = gamma + alfa + beta * delta,
            cosA = Math.cos(finalAngle),
            sinA = Math.sin(finalAngle),
            posX = newOrigin[0] + (newOrigin[2] + nextBubble[2]) * sinA,
            // center of new origin + (radius1 + radius2) * sinus A
            posY = newOrigin[1] - (newOrigin[2] + nextBubble[2]) * cosA;
        return [
            posX,
            posY,
            nextBubble[2],
            nextBubble[3],
            nextBubble[4]
        ]; // the same as described before
    }

    public render(): void {
        const dataLabels = [] as Array<SVGElement>;
        seriesProto.render.apply(this, arguments);
        // #10823 - dataLabels should stay visible
        // when enabled allowOverlap.
        if (!(this.options.dataLabels as any).allowOverlap) {
            this.data.forEach((point): void => {
                if (isArray(point.dataLabels)) {
                    point.dataLabels.forEach((dataLabel): void => {
                        dataLabels.push(dataLabel);
                    });
                }
            });

            // Only hide overlapping dataLabels for layouts that
            // use simulation. Spiral packedbubble don't need
            // additional dataLabel hiding on every simulation step
            if (this.options.useSimulation) {
                this.chart.hideOverlappingLabels(dataLabels);
            }
        }
    }

    /**
     * The function responsible for resizing the bubble radius.
     * In shortcut: it is taking the initially
     * calculated positions of bubbles. Then it is calculating the min max
     * of both dimensions, creating something in shape of bBox.
     * The comparison of bBox and the size of plotArea
     * (later it may be also the size set by customer) is giving the
     * value how to recalculate the radius so it will match the size
     * @private
     */
    public resizeRadius(): void {
        const chart = this.chart,
            positions = chart.rawPositions,
            min = Math.min,
            max = Math.max,
            plotLeft = chart.plotLeft,
            plotTop = chart.plotTop,
            chartHeight = chart.plotHeight,
            chartWidth = chart.plotWidth;

        let minX, maxX, minY, maxY,
            radius: number;

        minX = minY = Number.POSITIVE_INFINITY; // set initial values
        maxX = maxY = Number.NEGATIVE_INFINITY;

        for (const position of positions) {
            radius = position[2];
            minX = min(minX, position[0] - radius);
            // (x center-radius) is the min x value used by specific bubble
            maxX = max(maxX, position[0] + radius);
            minY = min(minY, position[1] - radius);
            maxY = max(maxY, position[1] + radius);
        }

        const bBox = [maxX - minX, maxY - minY],
            spaceRatio = [
                (chartWidth - plotLeft) / bBox[0],
                (chartHeight - plotTop) / bBox[1]
            ],
            smallerDimension = min.apply([], spaceRatio);

        if (Math.abs(smallerDimension - 1) > 1e-10) {
            // if bBox is considered not the same width as possible size
            for (const position of positions) {
                (position[2] as any) *= smallerDimension;
            }
            this.placeBubbles(positions as any);
        } else {
            /** if no radius recalculation is needed, we need to position
             * the whole bubbles in center of chart plotarea
             * for this, we are adding two parameters,
             * diffY and diffX, that are related to differences
             * between the initial center and the bounding box
             */
            chart.diffY = chartHeight / 2 +
                plotTop - minY - (maxY - minY) / 2;
            chart.diffX = chartWidth / 2 +
                plotLeft - minX - (maxX - minX) / 2;
        }
    }

    /**
     * The function responsible for calculating series bubble' s bBox.
     * Needed because of exporting failure when useSimulation
     * is set to false
     * @private
     */
    public seriesBox(): (Array<number>|null) {
        const chart = this.chart,
            data = this.data,
            max = Math.max,
            min = Math.min,
            // bBox = [xMin, xMax, yMin, yMax]
            bBox = [
                chart.plotLeft,
                chart.plotLeft + chart.plotWidth,
                chart.plotTop,
                chart.plotTop + chart.plotHeight
            ];

        let radius: number;

        data.forEach((p): void => {
            if (
                defined(p.plotX) &&
                defined(p.plotY) &&
                (p.marker as any).radius
            ) {
                radius = (p.marker as any).radius;
                bBox[0] = min(bBox[0], p.plotX - radius);
                bBox[1] = max(bBox[1], p.plotX + radius);
                bBox[2] = min(bBox[2], p.plotY - radius);
                bBox[3] = max(bBox[3], p.plotY + radius);
            }
        });
        return isNumber((bBox as any).width / (bBox as any).height) ?
            bBox :
            null;
    }

    /**
     * Needed because of z-indexing issue if point is added in series.group
     * @private
     */
    public setVisible(): void {
        const series = this;

        seriesProto.setVisible.apply(series, arguments);

        if (series.parentNodeLayout && series.graph) {
            if (series.visible) {
                series.graph.show();
                if ((series.parentNode as any).dataLabel) {
                    (series.parentNode as any).dataLabel.show();
                }
            } else {
                series.graph.hide();
                series.parentNodeLayout
                    .removeElementFromCollection(
                        series.parentNode, series.parentNodeLayout.nodes
                    );
                if ((series.parentNode as any).dataLabel) {
                    (series.parentNode as any).dataLabel.hide();
                }
            }
        } else if (series.layout) {
            if (series.visible) {
                series.layout.addElementsToCollection(
                    series.points, series.layout.nodes
                );
            } else {
                series.points.forEach((node): void => {
                    series.layout.removeElementFromCollection(
                        node, series.layout.nodes
                    );
                });
            }
        }
    }

    /**
     * Extend the base translate method to handle bubble size,
     * and correct positioning them.
     * @private
     */
    public translate(): void {
        const chart = this.chart,
            data = this.data,
            index = this.index,
            useSimulation = this.options.useSimulation;

        let point,
            radius: number|undefined,
            positions;

        this.processedXData = this.xData;
        this.generatePoints();

        // merged data is an array with all of the data from all series
        if (!defined(chart.allDataPoints)) {
            chart.allDataPoints = this.accumulateAllPoints();
            // calculate radius for all added data
            this.getPointRadius();
        }

        // after getting initial radius, calculate bubble positions

        if (useSimulation) {
            positions = chart.allDataPoints;
        } else {
            positions = this.placeBubbles(chart.allDataPoints);
            this.options.draggable = false;
        }

        // Set the shape and arguments to be picked up in drawPoints
        for (const position of positions) {

            if (position[3] === index) {

                // update the series points with the val from positions
                // array
                point = data[position[4] as any];
                radius = pick(position[2], void 0);

                if (!useSimulation) {
                    point.plotX = (
                        (position[0] as any) - chart.plotLeft +
                        chart.diffX
                    );
                    point.plotY = (
                        (position[1] as any) - chart.plotTop +
                        chart.diffY
                    );
                }
                if (isNumber(radius)) {
                    point.marker = extend(point.marker, {
                        radius,
                        width: 2 * radius,
                        height: 2 * radius
                    });
                    point.radius = radius;
                }
            }
        }

        if (useSimulation) {
            this.deferLayout();
        }

        fireEvent(this, 'afterTranslate');
    }

    /* eslint-enable valid-jsdoc */

}

/* *
 *
 *  Class Prototype
 *
 * */

interface PackedBubbleSeries extends DragNodesSeries, NetworkgraphSeries {
    pointClass: typeof PackedBubblePoint;
    bubblePadding: BubbleSeriesType['bubblePadding'];
    /**
     * Array of internal forces. Each force should be later defined in
     * integrations.js.
     * @private
     */
    forces: Array<string>;
    /**
     * An internal option used for allowing nodes dragging.
     * @private
     */
    hasDraggableNodes: boolean;
    isBubble: BubbleSeriesType['isBubble'];
    isCartesian: boolean;
    maxPxSize: BubbleSeriesType['maxPxSize'];
    minPxSize: BubbleSeriesType['minPxSize'];
    nodes: NetworkgraphSeries['nodes'];
    noSharedTooltip: boolean;
    pointArrayMap: Array<string>;
    pointValKey: string;
    radii: BubbleSeriesType['radii'];
    specialGroup: BubbleSeriesType['specialGroup'];
    trackerGroups: Array<string>;
    yData: BubbleSeriesType['yData'];
    zData: BubbleSeriesType['zData'];
    zoneAxis: BubbleSeriesType['zoneAxis'];
    getPointsCollection(): Array<PackedBubblePoint>;
    indexateNodes: NetworkgraphSeries['indexateNodes'];
    markerAttribs: BubbleSeriesType['markerAttribs'];
    onMouseDown: typeof DragNodesComposition.onMouseDown;
    onMouseMove: typeof DragNodesComposition.onMouseMove;
    redrawHalo: typeof DragNodesComposition.redrawHalo;
    setState: BubbleSeriesType['setState'];
}
extend(PackedBubbleSeries.prototype, {
    pointClass: PackedBubblePoint,
    axisTypes: [],
    directTouch: true,
    forces: ['barycenter', 'repulsive'],
    hasDraggableNodes: true,
    isCartesian: false,
    noSharedTooltip: true,
    pointArrayMap: ['value'],
    pointValKey: 'value',
    requireSorting: false,
    trackerGroups: ['group', 'dataLabelsGroup', 'parentNodesGroup'],
    initDataLabels: initDataLabels,
    alignDataLabel: seriesProto.alignDataLabel,
    indexateNodes: noop as NetworkgraphSeries['indexateNodes'],
    onMouseDown: DragNodesComposition.onMouseDown,
    onMouseMove: DragNodesComposition.onMouseMove,
    redrawHalo: DragNodesComposition.redrawHalo,
    searchPoint: noop as NetworkgraphSeries['searchPoint'] // solving #12287
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace PackedBubbleSeries {

    export type Data = [
        (number|null),
        (number|null),
        (number|null),
        number,
        number,
        PackedBubblePointOptions
    ];

}

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        packedbubble: typeof PackedBubbleSeries;
    }
}
SeriesRegistry.registerSeriesType('packedbubble', PackedBubbleSeries);

/* *
 *
 *  Default Export
 *
 * */

export default PackedBubbleSeries;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Formatter callback function.
 *
 * @callback Highcharts.SeriesPackedBubbleDataLabelsFormatterCallbackFunction
 *
 * @param {Highcharts.SeriesPackedBubbleDataLabelsFormatterContextObject} this
 *        Data label context to format
 *
 * @return {string}
 *         Formatted data label text
 */

/**
 * Context for the formatter function.
 *
 * @interface Highcharts.SeriesPackedBubbleDataLabelsFormatterContextObject
 * @extends Highcharts.PointLabelObject
 * @since 7.0.0
 *//**
 * The color of the node.
 * @name Highcharts.SeriesPackedBubbleDataLabelsFormatterContextObject#color
 * @type {Highcharts.ColorString}
 * @since 7.0.0
 *//**
 * The point (node) object. The node name, if defined, is available through
 * `this.point.name`. Arrays: `this.point.linksFrom` and `this.point.linksTo`
 * contains all nodes connected to this point.
 * @name Highcharts.SeriesPackedBubbleDataLabelsFormatterContextObject#point
 * @type {Highcharts.Point}
 * @since 7.0.0
 *//**
 * The ID of the node.
 * @name Highcharts.SeriesPackedBubbleDataLabelsFormatterContextObject#key
 * @type {string}
 * @since 7.0.0
 */

''; // detach doclets above
