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

'use strict';

import type NetworkgraphSeries from './Networkgraph';
import type PackedBubbleChart from '../PackedBubble/PackedBubbleChart';
import type Point from '../../Core/Series/Point';
import Chart from '../../Core/Chart/Chart.js';
import A from '../../Core/Animation/AnimationUtilities.js';
const { setAnimation } = A;
import H from '../../Core/Globals.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    clamp,
    defined,
    extend,
    isFunction,
    pick
} = U;

declare module '../../Core/Series/PointLike' {
    interface PointLike {
        dispX?: number;
        dispY?: number;
        fromNode?: Point;
        linksFrom?: Array<Point>;
        linksTo?: Array<Point>;
        mass?: number;
        prevX?: number;
        prevY?: number;
        toNode?: Point;
    }
}

declare module '../../Core/Series/SeriesLike' {
    interface SeriesLike {
        forces?: Array<string>;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface NetworkgraphLayoutAlgorithmOptions {
            approximation?: string;
            attractiveForce?: Function;
            enableSimulation?: boolean;
            friction?: number;
            gravitationalConstant?: number;
            initialPositionRadius?: number;
            initialPositions?: (string|Function);
            integration?: string;
            linkLength?: number;
            maxIterations?: number;
            maxSpeed?: number;
            repulsiveForce?: Function;
            theta?: number;
            type?: string;
        }
        interface NetworkgraphPoint {
            dispX?: number;
            dispY?: number;
            prevX?: number;
            prevY?: number;
        }
        interface NetworkgraphSeriesOptions {
            layoutAlgorithm?: NetworkgraphLayoutAlgorithmOptions;
        }
        class NetworkgraphLayout {
            public constructor();
            public approximation?: string;
            public attractiveForce: Function;
            public barycenter?: Record<string, number>;
            public box: Record<string, number>;
            public currentStep?: number;
            public diffTemperature?: number;
            public enableSimulation?: boolean;
            public forcedStop?: boolean;
            public forces?: Array<string>;
            public chart?: Chart;
            public initialRendering: boolean;
            public integration: NetworkgraphIntegrationObject;
            public k?: number;
            public links: Array<Point>;
            public maxIterations?: number;
            public nodes: Array<Point>;
            public options: NetworkgraphLayoutAlgorithmOptions;
            public prevSystemTemperature?: number;
            public prototype: NetworkgraphLayout;
            public quadTree: QuadTree;
            public repulsiveForce: Function;
            public series: Array<NetworkgraphSeries>;
            public simulation: (boolean|number);
            public startTemperature?: number;
            public startTime?: number;
            public systemTemperature?: number;
            public temperature?: number;
            public addElementsToCollection<T, C extends T>(
                elements: Array<C>,
                collection: Array<T>
            ): void;
            public applyLimitBox(node: Point, box: Record<string, number>): void;
            public applyLimits(): void;
            public attractiveForces(): void;
            public barnesHutApproximation(
                node: Point,
                quadNode: QuadTreeNode
            ): (boolean|undefined);
            public barycenterForces(): void;
            public clear(): void;
            public coolDown(
                temperature: number,
                temperatureStep: number,
                currentStep: number
            ): number;
            public createQuadTree(): void;
            public force(name: string, ...args: Array<unknown>): void;
            public getBarycenter(): Record<string, number>;
            public getDistR(
                nodeA: NetworkgraphPoint,
                nodeB: (NetworkgraphPoint|QuadTreeNode)
            ): number;
            public getDistXY(
                nodeA: Point,
                nodeB: (Point|QuadTreeNode)
            ): Record<string, number>;
            public getSystemTemperature(): number;
            public init(options: NetworkgraphLayoutAlgorithmOptions): void;
            public initPositions(): void;
            public isStable(): boolean;
            public updateSimulation(enable?: boolean): void;
            public removeElementFromCollection<T>(
                element: T, collection: Array<T>
            ): void;
            public repulsiveForces(): void;
            public resetSimulation(): void;
            public restartSimulation(): void;
            public setArea(x: number, y: number, w: number, h: number): void;
            public setCircularPositions(): void;
            public setDiffTemperature(): void;
            public setInitialRendering(enable: boolean): void;
            public setK(): void;
            public setMaxIterations(maxIterations?: number): void;
            public setRandomPositions(): void;
            public start(): void;
            public step(): void;
            public stop(): void;
            public setTemperature(): void;
            public vectorLength(vector: Record<string, number>): number;
        }
        let layouts: Record<string, (typeof NetworkgraphLayout)>;
    }
}

import './Integrations.js';
import './QuadTree.js';

/* eslint-disable no-invalid-this, valid-jsdoc */

H.layouts = {
    'reingold-fruchterman': function (): void {
    }
} as any;

extend(
    /**
     * Reingold-Fruchterman algorithm from
     * "Graph Drawing by Force-directed Placement" paper.
     * @private
     */
    H.layouts['reingold-fruchterman'].prototype,
    {
        init: function (
            this: Highcharts.NetworkgraphLayout,
            options: Highcharts.NetworkgraphLayoutAlgorithmOptions
        ): void {
            this.options = options;
            this.nodes = [];
            this.links = [];
            this.series = [];

            this.box = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };

            this.setInitialRendering(true);

            this.integration =
                H.networkgraphIntegrations[options.integration as any];

            this.enableSimulation = options.enableSimulation;

            this.attractiveForce = pick(
                options.attractiveForce,
                this.integration.attractiveForceFunction
            );

            this.repulsiveForce = pick(
                options.repulsiveForce,
                this.integration.repulsiveForceFunction
            );

            this.approximation = options.approximation;
        },
        updateSimulation: function (
            this: Highcharts.NetworkgraphLayout,
            enable?: boolean
        ): void {
            this.enableSimulation = pick(enable, this.options.enableSimulation);
        },
        start: function (this: Highcharts.NetworkgraphLayout): void {
            const layout = this,
                series = this.series,
                options = this.options;

            // Store starting time of simulation for Defer option
            layout.startTime = Date.now();
            layout.currentStep = 0;
            layout.forces = series[0] && series[0].forces || [];
            layout.chart = series[0] && series[0].chart;

            if (layout.initialRendering) {
                layout.initPositions();

                // Render elements in initial positions:
                series.forEach(function (s): void {
                    s.finishedAnimating = true; // #13169
                    s.render();
                });
            }

            layout.setK();
            (layout.resetSimulation as any)(options);

            if (layout.enableSimulation) {
                layout.step();
            }
        },
        step: function (this: Highcharts.NetworkgraphLayout): void {
            const layout = this,
                series = this.series,
                options = this.options;

            // Algorithm:
            (layout.currentStep as any)++;

            if (layout.approximation === 'barnes-hut') {
                layout.createQuadTree();
                layout.quadTree.calculateMassAndCenter();
            }

            (layout.forces as any).forEach(function (forceName: string): void {
                (layout as any)[forceName + 'Forces'](layout.temperature);
            });

            // Limit to the plotting area and cool down:
            (layout.applyLimits as any)(layout.temperature);

            // Cool down the system:
            layout.temperature = layout.coolDown(
                layout.startTemperature as any,
                layout.diffTemperature as any,
                layout.currentStep as any
            );

            layout.prevSystemTemperature = layout.systemTemperature;
            layout.systemTemperature = layout.getSystemTemperature();

            if (layout.enableSimulation) {
                series.forEach(function (s): void {
                    // Chart could be destroyed during the simulation
                    if (s.chart) {
                        s.render();
                    }
                });
                if (
                    (layout.maxIterations as any)-- &&
                    isFinite(layout.temperature) &&
                    !layout.isStable()
                ) {
                    if (layout.simulation) {
                        H.win.cancelAnimationFrame(layout.simulation as any);
                    }

                    layout.simulation = H.win.requestAnimationFrame(
                        function (): void {
                            layout.step();
                        }
                    );
                } else {
                    layout.simulation = false;
                }
            }
        },
        stop: function (this: Highcharts.NetworkgraphLayout): void {
            if (this.simulation) {
                H.win.cancelAnimationFrame(this.simulation as any);
            }
        },
        setArea: function (
            this: Highcharts.NetworkgraphLayout,
            x: number,
            y: number,
            w: number,
            h: number
        ): void {
            this.box = {
                left: x,
                top: y,
                width: w,
                height: h
            };
        },
        setK: function (this: Highcharts.NetworkgraphLayout): void {
            // Optimal distance between nodes,
            // available space around the node:
            this.k = this.options.linkLength || this.integration.getK(this);
        },
        addElementsToCollection: function<T, C extends T> (
            this: Highcharts.NetworkgraphLayout,
            elements: Array<C>,
            collection: Array<T>
        ): void {
            elements.forEach(function (elem): void {
                if (collection.indexOf(elem) === -1) {
                    collection.push(elem);
                }
            });
        },
        removeElementFromCollection: function<T> (
            this: Highcharts.NetworkgraphLayout,
            element: T,
            collection: Array<T>
        ): void {
            const index = collection.indexOf(element);

            if (index !== -1) {
                collection.splice(index, 1);
            }
        },
        clear: function (this: Highcharts.NetworkgraphLayout): void {
            this.nodes.length = 0;
            this.links.length = 0;
            this.series.length = 0;
            this.resetSimulation();
        },

        resetSimulation: function (this: Highcharts.NetworkgraphLayout): void {
            this.forcedStop = false;
            this.systemTemperature = 0;
            this.setMaxIterations();
            this.setTemperature();
            this.setDiffTemperature();
        },

        restartSimulation: function (
            this: Highcharts.NetworkgraphLayout
        ): void {

            if (!this.simulation) {
                // When dragging nodes, we don't need to calculate
                // initial positions and rendering nodes:
                this.setInitialRendering(false);
                // Start new simulation:
                if (!this.enableSimulation) {
                    // Run only one iteration to speed things up:
                    this.setMaxIterations(1);
                } else {
                    this.start();
                }
                if (this.chart) {
                    this.chart.redraw();
                }
                // Restore defaults:
                this.setInitialRendering(true);
            } else {
                // Extend current simulation:
                this.resetSimulation();
            }
        },

        setMaxIterations: function (
            this: Highcharts.NetworkgraphLayout,
            maxIterations?: number
        ): void {
            this.maxIterations = pick(
                maxIterations,
                this.options.maxIterations
            );
        },

        setTemperature: function (this: Highcharts.NetworkgraphLayout): void {
            this.temperature = this.startTemperature =
                Math.sqrt(this.nodes.length);
        },

        setDiffTemperature: function (
            this: Highcharts.NetworkgraphLayout
        ): void {
            this.diffTemperature = (this.startTemperature as any) /
                ((this.options.maxIterations as any) + 1);
        },
        setInitialRendering: function (
            this: Highcharts.NetworkgraphLayout,
            enable: boolean
        ): void {
            this.initialRendering = enable;
        },
        createQuadTree: function (
            this: Highcharts.NetworkgraphLayout
        ): void {
            this.quadTree = new H.QuadTree(
                this.box.left,
                this.box.top,
                this.box.width,
                this.box.height
            );

            this.quadTree.insertNodes(this.nodes);
        },
        initPositions: function (
            this: Highcharts.NetworkgraphLayout
        ): void {
            const initialPositions = this.options.initialPositions;

            if (isFunction(initialPositions)) {
                initialPositions.call(this);
                this.nodes.forEach(function (node: Point): void {
                    if (!defined(node.prevX)) {
                        node.prevX = node.plotX;
                    }
                    if (!defined(node.prevY)) {
                        node.prevY = node.plotY;
                    }

                    node.dispX = 0;
                    node.dispY = 0;
                });

            } else if (initialPositions === 'circle') {
                this.setCircularPositions();
            } else {
                this.setRandomPositions();
            }
        },
        setCircularPositions: function (
            this: Highcharts.NetworkgraphLayout
        ): void {
            let box = this.box,
                nodes = this.nodes,
                nodesLength = nodes.length + 1,
                angle = 2 * Math.PI / nodesLength,
                rootNodes = nodes.filter(function (node: Point): boolean {
                    return (node.linksTo as any).length === 0;
                }),
                sortedNodes = [] as Array<Point>,
                visitedNodes = {} as Record<string, boolean>,
                radius = this.options.initialPositionRadius;

            /**
             * @private
             */
            function addToNodes(node: Point): void {
                (node.linksFrom as any).forEach(function (link: Point): void {
                    if (!visitedNodes[(link.toNode as any).id]) {
                        visitedNodes[(link.toNode as any).id] = true;
                        sortedNodes.push(link.toNode as any);
                        addToNodes(link.toNode as any);
                    }
                });
            }

            // Start with identified root nodes an sort the nodes by their
            // hierarchy. In trees, this ensures that branches don't cross
            // eachother.
            rootNodes.forEach(function (rootNode: Point): void {
                sortedNodes.push(rootNode);
                addToNodes(rootNode);
            });

            // Cyclic tree, no root node found
            if (!sortedNodes.length) {
                sortedNodes = nodes;

            // Dangling, cyclic trees
            } else {
                nodes.forEach(function (node: Point): void {
                    if (sortedNodes.indexOf(node) === -1) {
                        sortedNodes.push(node);
                    }
                });
            }

            // Initial positions are laid out along a small circle, appearing
            // as a cluster in the middle
            sortedNodes.forEach(function (
                node: Point,
                index: number
            ): void {
                node.plotX = node.prevX = pick(
                    node.plotX,
                    box.width / 2 + (radius as any) * Math.cos(index * angle)
                );
                node.plotY = node.prevY = pick(
                    node.plotY,
                    box.height / 2 + (radius as any) * Math.sin(index * angle)
                );

                node.dispX = 0;
                node.dispY = 0;
            });
        },
        setRandomPositions: function (
            this: Highcharts.NetworkgraphLayout
        ): void {
            const box = this.box,
                nodes = this.nodes,
                nodesLength = nodes.length + 1;

            /**
             * Return a repeatable, quasi-random number based on an integer
             * input. For the initial positions
             * @private
             */
            function unrandom(n: number): number {
                let rand = n * n / Math.PI;

                rand = rand - Math.floor(rand);
                return rand;
            }

            // Initial positions:
            nodes.forEach(
                function (
                    node: Point,
                    index: number
                ): void {
                    node.plotX = node.prevX = pick(
                        node.plotX,
                        box.width * unrandom(index)
                    );
                    node.plotY = node.prevY = pick(
                        node.plotY,
                        box.height * unrandom(nodesLength + index)
                    );

                    node.dispX = 0;
                    node.dispY = 0;
                }
            );
        },
        force: function (
            this: Highcharts.NetworkgraphLayout,
            name: string
        ): void {
            this.integration[name].apply(
                this,
                Array.prototype.slice.call(arguments, 1)
            );
        },
        barycenterForces: function (this: Highcharts.NetworkgraphLayout): void {
            this.getBarycenter();
            this.force('barycenter');
        },
        getBarycenter: function (
            this: Highcharts.NetworkgraphLayout
        ): Record<string, number> {
            let systemMass = 0,
                cx = 0,
                cy = 0;

            this.nodes.forEach(function (node: Point): void {
                cx += (node.plotX as any) * (node.mass as any);
                cy += (node.plotY as any) * (node.mass as any);

                systemMass += (node.mass as any);
            });

            this.barycenter = {
                x: cx,
                y: cy,
                xFactor: cx / systemMass,
                yFactor: cy / systemMass
            };

            return this.barycenter;
        },
        barnesHutApproximation: function (
            this: Highcharts.NetworkgraphLayout,
            node: Point,
            quadNode: Highcharts.QuadTreeNode
        ): (boolean|undefined) {
            let layout = this,
                distanceXY = layout.getDistXY(node, quadNode),
                distanceR = layout.vectorLength(distanceXY),
                goDeeper,
                force;

            if ((node as any) !== quadNode && distanceR !== 0) {
                if (quadNode.isInternal) {
                    // Internal node:
                    if (
                        quadNode.boxSize / distanceR <
                        (layout.options.theta as any) &&
                        distanceR !== 0
                    ) {
                        // Treat as an external node:
                        force = layout.repulsiveForce(distanceR, layout.k);

                        layout.force(
                            'repulsive',
                            node,
                            force * (quadNode.mass as any),
                            distanceXY,
                            distanceR
                        );
                        goDeeper = false;
                    } else {
                        // Go deeper:
                        goDeeper = true;
                    }
                } else {
                    // External node, direct force:
                    force = layout.repulsiveForce(distanceR, layout.k);

                    layout.force(
                        'repulsive',
                        node,
                        force * (quadNode.mass as any),
                        distanceXY,
                        distanceR
                    );
                }
            }

            return goDeeper;
        },
        repulsiveForces: function (this: Highcharts.NetworkgraphLayout): void {
            const layout = this;

            if (layout.approximation === 'barnes-hut') {
                layout.nodes.forEach(function (node: Point): void {
                    layout.quadTree.visitNodeRecursive(
                        null,
                        function (
                            quadNode: Highcharts.QuadTreeNode
                        ): (boolean|undefined) {
                            return layout.barnesHutApproximation(
                                node,
                                quadNode
                            );
                        }
                    );
                });
            } else {
                layout.nodes.forEach(function (node: Point): void {
                    layout.nodes.forEach(function (repNode: Point): void {
                        let force,
                            distanceR,
                            distanceXY;

                        if (
                            // Node can not repulse itself:
                            node !== repNode &&
                            // Only close nodes affect each other:
                            // layout.getDistR(node, repNode) < 2 * k &&
                            // Not dragged:
                            !(node as any).fixedPosition
                        ) {
                            distanceXY = layout.getDistXY(node, repNode);
                            distanceR = layout.vectorLength(distanceXY);
                            if (distanceR !== 0) {
                                force = layout.repulsiveForce(
                                    distanceR,
                                    layout.k
                                );

                                layout.force(
                                    'repulsive',
                                    node,
                                    force * (repNode.mass as any),
                                    distanceXY,
                                    distanceR
                                );
                            }
                        }
                    });
                });
            }
        },
        attractiveForces: function (this: Highcharts.NetworkgraphLayout): void {
            let layout = this,
                distanceXY,
                distanceR,
                force;

            layout.links.forEach(function (link: Point): void {
                if (link.fromNode && link.toNode) {
                    distanceXY = layout.getDistXY(
                        link.fromNode,
                        link.toNode
                    );
                    distanceR = layout.vectorLength(distanceXY);

                    if (distanceR !== 0) {
                        force = layout.attractiveForce(distanceR, layout.k);

                        layout.force(
                            'attractive',
                            link,
                            force,
                            distanceXY,
                            distanceR
                        );
                    }
                }
            });
        },
        applyLimits: function (this: Highcharts.NetworkgraphLayout): void {
            const layout = this,
                nodes = layout.nodes;

            nodes.forEach(function (node: Point): void {
                if ((node as any).fixedPosition) {
                    return;
                }

                layout.integration.integrate(layout, node);

                layout.applyLimitBox(node, layout.box);

                // Reset displacement:
                node.dispX = 0;
                node.dispY = 0;
            });
        },
        /**
         * External box that nodes should fall. When hitting an edge, node
         * should stop or bounce.
         * @private
         */
        applyLimitBox: function (
            this: Highcharts.NetworkgraphLayout,
            node: Highcharts.NetworkgraphPoint,
            box: Record<string, number>
        ): void {
            const radius = node.radius;
            /*
            TO DO: Consider elastic collision instead of stopping.
            o' means end position when hitting plotting area edge:

            - "inelastic":
            o
             \
            ______
            |  o'
            |   \
            |    \

            - "elastic"/"bounced":
            o
             \
            ______
            |  ^
            | / \
            |o'  \

            Euler sample:
            if (plotX < 0) {
                plotX = 0;
                dispX *= -1;
            }

            if (plotX > box.width) {
                plotX = box.width;
                dispX *= -1;
            }

            */
            // Limit X-coordinates:
            node.plotX = clamp(
                node.plotX as any, box.left + radius, box.width - radius
            );

            // Limit Y-coordinates:
            node.plotY = clamp(
                node.plotY as any, box.top + radius, box.height - radius
            );
        },
        /**
         * From "A comparison of simulated annealing cooling strategies" by
         * Nourani and Andresen work.
         * @private
         */
        coolDown: function (
            this: Highcharts.NetworkgraphLayout,
            temperature: number,
            temperatureStep: number,
            currentStep: number
        ): number {
            // Logarithmic:
            /*
            return Math.sqrt(this.nodes.length) -
                Math.log(
                    currentStep * layout.diffTemperature
                );
            */

            // Exponential:
            /*
            let alpha = 0.1;
            layout.temperature = Math.sqrt(layout.nodes.length) *
                Math.pow(alpha, layout.diffTemperature);
            */
            // Linear:
            return temperature - temperatureStep * currentStep;
        },
        isStable: function (this: Highcharts.NetworkgraphLayout): boolean {
            return Math.abs(
                (this.systemTemperature as any) -
                (this.prevSystemTemperature as any)
            ) < 0.00001 || (this.temperature as any) <= 0;
        },
        getSystemTemperature: function (
            this: Highcharts.NetworkgraphLayout
        ): number {
            return this.nodes.reduce(function (
                value: number,
                node: Point
            ): number {
                return value + (node as any).temperature;
            }, 0);
        },
        vectorLength: function (
            this: Highcharts.NetworkgraphLayout,
            vector: Record<string, number>
        ): number {
            return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        },
        getDistR: function (
            this: Highcharts.NetworkgraphLayout,
            nodeA: Highcharts.NetworkgraphPoint,
            nodeB: (Highcharts.NetworkgraphPoint|Highcharts.QuadTreeNode)
        ): number {
            const distance = this.getDistXY(nodeA, nodeB);

            return this.vectorLength(distance);
        },
        getDistXY: function (
            this: Highcharts.NetworkgraphLayout,
            nodeA: Point,
            nodeB: (Point|Highcharts.QuadTreeNode)
        ): Record<string, number> {
            const xDist = (nodeA.plotX as any) - (nodeB.plotX as any),
                yDist = (nodeA.plotY as any) - (nodeB.plotY as any);

            return {
                x: xDist,
                y: yDist,
                absX: Math.abs(xDist),
                absY: Math.abs(yDist)
            };
        }
    }
);

/* ************************************************************************** *
 * Multiple series support:
 * ************************************************************************** */
// Clear previous layouts
addEvent(Chart as any, 'predraw', function (
    this: Highcharts.NetworkgraphChart
): void {
    if (this.graphLayoutsLookup) {
        this.graphLayoutsLookup.forEach(
            function (layout: Highcharts.NetworkgraphLayout): void {
                layout.stop();
            }
        );
    }
});
addEvent(Chart as any, 'render', function (
    this: Highcharts.NetworkgraphChart
): void {
    let systemsStable,
        afterRender = false;

    /**
     * @private
     */
    function layoutStep(layout: Highcharts.NetworkgraphLayout): void {
        if (
            (layout.maxIterations as any)-- &&
            isFinite(layout.temperature as any) &&
            !layout.isStable() &&
            !layout.enableSimulation
        ) {
            // Hook similar to build-in addEvent, but instead of
            // creating whole events logic, use just a function.
            // It's faster which is important for rAF code.
            // Used e.g. in packed-bubble series for bubble radius
            // calculations
            if (layout.beforeStep) {
                layout.beforeStep();
            }

            layout.step();
            systemsStable = false;
            afterRender = true;
        }
    }

    if (this.graphLayoutsLookup) {
        setAnimation(false, this);
        // Start simulation
        this.graphLayoutsLookup.forEach(
            function (layout: Highcharts.NetworkgraphLayout): void {
                layout.start();
            }
        );

        // Just one sync step, to run different layouts similar to
        // async mode.
        while (!systemsStable) {
            systemsStable = true;
            this.graphLayoutsLookup.forEach(layoutStep);
        }

        if (afterRender) {
            this.series.forEach(function (s): void {
                if (s && s.layout) {
                    s.render();
                }
            });
        }
    }
});

// disable simulation before print if enabled
addEvent(Chart as any, 'beforePrint', function (
    this: PackedBubbleChart
): void {
    if (this.graphLayoutsLookup) {
        this.graphLayoutsLookup.forEach(function (layout): void {
            layout.updateSimulation(false);
        });
        this.redraw();
    }
});

// re-enable simulation after print
addEvent(Chart as any, 'afterPrint', function (
    this: PackedBubbleChart
): void {
    if (this.graphLayoutsLookup) {
        this.graphLayoutsLookup.forEach(function (layout): void {
            // return to default simulation
            layout.updateSimulation();
        });
    }
    this.redraw();
});
