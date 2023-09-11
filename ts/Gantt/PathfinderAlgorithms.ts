/* *
 *
 *  (c) 2016 Highsoft AS
 *  Author: Øystein Moseng
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type Point from '../Core/Series/Point';
import type PositionObject from '../Core/Renderer/PositionObject';
import type SVGPath from '../Core/Renderer/SVG/SVGPath';

import PathUtilities from '../Series/PathUtilities.js';
import U from '../Shared/Utilities.js';
const {
    pick
} = U;

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface PathfinderAlgorithmFunction {
            (...args: Array<any>): PathfinderAlgorithmResultObject;
            requiresObstacles?: boolean;
        }
        interface PathfinderAlgorithmResultObject {
            obstacles: Array<any>;
            path: SVGPath;
        }
    }
}

const {
    min,
    max,
    abs
} = Math;

/**
 * Get index of last obstacle before xMin. Employs a type of binary search, and
 * thus requires that obstacles are sorted by xMin value.
 *
 * @private
 * @function findLastObstacleBefore
 *
 * @param {Array<object>} obstacles
 *        Array of obstacles to search in.
 *
 * @param {number} xMin
 *        The xMin threshold.
 *
 * @param {number} [startIx]
 *        Starting index to search from. Must be within array range.
 *
 * @return {number}
 *         The index of the last obstacle element before xMin.
 */
function findLastObstacleBefore(
    obstacles: Array<any>,
    xMin: number,
    startIx?: number
): number {
    let left = startIx || 0, // left limit
        right = obstacles.length - 1, // right limit
        min = xMin - 0.0000001, // Make sure we include all obstacles at xMin
        cursor,
        cmp;

    while (left <= right) {
        cursor = (right + left) >> 1;
        cmp = min - obstacles[cursor].xMin;
        if (cmp > 0) {
            left = cursor + 1;
        } else if (cmp < 0) {
            right = cursor - 1;
        } else {
            return cursor;
        }
    }
    return left > 0 ? left - 1 : 0;
}

/**
 * Test if a point lays within an obstacle.
 *
 * @private
 * @function pointWithinObstacle
 *
 * @param {Object} obstacle
 *        Obstacle to test.
 *
 * @param {Highcharts.Point} point
 *        Point with x/y props.
 *
 * @return {boolean}
 *         Whether point is within the obstacle or not.
 */
function pointWithinObstacle(obstacle: any, point: Point): boolean {
    return (
        (point.x as any) <= obstacle.xMax &&
        (point.x as any) >= obstacle.xMin &&
        (point.y as any) <= obstacle.yMax &&
        (point.y as any) >= obstacle.yMin
    );
}

/**
 * Find the index of an obstacle that wraps around a point.
 * Returns -1 if not found.
 *
 * @private
 * @function findObstacleFromPoint
 *
 * @param {Array<object>} obstacles
 *        Obstacles to test.
 *
 * @param {Highcharts.Point} point
 *        Point with x/y props.
 *
 * @return {number}
 *         Ix of the obstacle in the array, or -1 if not found.
 */
function findObstacleFromPoint(obstacles: Array<any>, point: any): number {
    let i = findLastObstacleBefore(obstacles, point.x + 1) + 1;

    while (i--) {
        if (
            obstacles[i].xMax >= point.x &&
            // optimization using lazy evaluation
            pointWithinObstacle(obstacles[i], point)
        ) {
            return i;
        }
    }
    return -1;
}

/**
 * Get SVG path array from array of line segments.
 *
 * @private
 * @function pathFromSegments
 *
 * @param {Array<object>} segments
 *        The segments to build the path from.
 *
 * @return {Highcharts.SVGPathArray}
 *         SVG path array as accepted by the SVG Renderer.
 */
function pathFromSegments(segments: Array<any>): SVGPath {
    const path: SVGPath = [];

    if (segments.length) {
        path.push(['M', segments[0].start.x, segments[0].start.y]);
        for (let i = 0; i < segments.length; ++i) {
            path.push(['L', segments[i].end.x, segments[i].end.y]);
        }
    }
    return path;
}

/**
 * Limits obstacle max/mins in all directions to bounds. Modifies input
 * obstacle.
 *
 * @private
 * @function limitObstacleToBounds
 *
 * @param {Object} obstacle
 *        Obstacle to limit.
 *
 * @param {Object} bounds
 *        Bounds to use as limit.
 *
 * @return {void}
 */
function limitObstacleToBounds(obstacle: any, bounds: any): void {
    obstacle.yMin = max(obstacle.yMin, bounds.yMin);
    obstacle.yMax = min(obstacle.yMax, bounds.yMax);
    obstacle.xMin = max(obstacle.xMin, bounds.xMin);
    obstacle.xMax = min(obstacle.xMax, bounds.xMax);
}

/**
 * Get an SVG path from a starting coordinate to an ending coordinate.
 * Draws a straight line.
 *
 * @function Highcharts.Pathfinder.algorithms.straight
 *
 * @param {Highcharts.PositionObject} start
 *        Starting coordinate, object with x/y props.
 *
 * @param {Highcharts.PositionObject} end
 *        Ending coordinate, object with x/y props.
 *
 * @return {Object}
 *         An object with the SVG path in Array form as accepted by the SVG
 *         renderer, as well as an array of new obstacles making up this
 *         path.
 */
function straight(
    start: PositionObject,
    end: PositionObject
): Highcharts.PathfinderAlgorithmResultObject {
    return {
        path: [
            ['M', start.x, start.y],
            ['L', end.x, end.y]
        ],
        obstacles: [{ start: start, end: end }]
    };
}

/**
 * Find a path from a starting coordinate to an ending coordinate, using
 * right angles only, and taking only starting/ending obstacle into
 * consideration.
 *
 * @function Highcharts.Pathfinder.algorithms.simpleConnect
 *
 * @param {Highcharts.PositionObject} start
 *        Starting coordinate, object with x/y props.
 *
 * @param {Highcharts.PositionObject} end
 *        Ending coordinate, object with x/y props.
 *
 * @param {Object} options
 *        Options for the algorithm:
 *        - chartObstacles: Array of chart obstacles to avoid
 *        - startDirectionX: Optional. True if starting in the X direction.
 *          If not provided, the algorithm starts in the direction that is
 *          the furthest between start/end.
 *
 * @return {Object}
 *         An object with the SVG path in Array form as accepted by the SVG
 *         renderer, as well as an array of new obstacles making up this
 *         path.
 */
const simpleConnect = function (
    start: PositionObject,
    end: PositionObject,
    options: any
): Highcharts.PathfinderAlgorithmResultObject {
    let segments = [],
        endSegment,
        dir = pick(
            options.startDirectionX,
            abs(end.x - start.x) > abs(end.y - start.y)
        ) ? 'x' : 'y',
        chartObstacles = options.chartObstacles,
        startObstacleIx = findObstacleFromPoint(chartObstacles, start),
        endObstacleIx = findObstacleFromPoint(chartObstacles, end),
        startObstacle,
        endObstacle,
        prevWaypoint,
        waypoint,
        waypoint2,
        useMax,
        endPoint;

    // eslint-disable-next-line valid-jsdoc
    /**
     * Return a clone of a point with a property set from a target object,
     * optionally with an offset
     * @private
     */
    function copyFromPoint(
        from: any,
        fromKey: string,
        to: any,
        toKey?: string,
        offset?: number
    ): Record<string, number> {
        const point: Record<string, number> = {
            x: from.x as any,
            y: from.y as any
        };

        point[fromKey] = to[toKey || fromKey] + (offset || 0);
        return point;
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Return waypoint outside obstacle.
     * @private
     */
    function getMeOut(
        obstacle: any,
        point: any,
        direction: string
    ): Record<string, number> {
        const useMax = abs(point[direction] - obstacle[direction + 'Min']) >
                    abs(point[direction] - obstacle[direction + 'Max']);

        return copyFromPoint(
            point,
            direction,
            obstacle,
            direction + (useMax ? 'Max' : 'Min'),
            useMax ? 1 : -1
        );
    }

    // Pull out end point
    if (endObstacleIx > -1) {
        endObstacle = chartObstacles[endObstacleIx];
        waypoint = getMeOut(endObstacle, end, dir);
        endSegment = {
            start: waypoint,
            end: end
        };
        endPoint = waypoint;
    } else {
        endPoint = end;
    }

    // If an obstacle envelops the start point, add a segment to get out,
    // and around it.
    if (startObstacleIx > -1) {
        startObstacle = chartObstacles[startObstacleIx];
        waypoint = getMeOut(startObstacle, start, dir);
        segments.push({
            start: start,
            end: waypoint
        });

        // If we are going back again, switch direction to get around start
        // obstacle.
        if (
            // Going towards max from start:
            waypoint[dir] >= (start as any)[dir] ===
            // Going towards min to end:
            waypoint[dir] >= (endPoint as any)[dir]
        ) {
            dir = dir === 'y' ? 'x' : 'y';
            useMax = (start as any)[dir] < (end as any)[dir];
            segments.push({
                start: waypoint,
                end: copyFromPoint(
                    waypoint,
                    dir,
                    startObstacle,
                    dir + (useMax ? 'Max' : 'Min'),
                    useMax ? 1 : -1
                )
            });

            // Switch direction again
            dir = dir === 'y' ? 'x' : 'y';
        }
    }

    // We are around the start obstacle. Go towards the end in one
    // direction.
    prevWaypoint = segments.length ?
        segments[segments.length - 1].end :
        start;
    waypoint = copyFromPoint(prevWaypoint, dir, endPoint);
    segments.push({
        start: prevWaypoint,
        end: waypoint
    });

    // Final run to end point in the other direction
    dir = dir === 'y' ? 'x' : 'y';
    waypoint2 = copyFromPoint(waypoint, dir, endPoint);
    segments.push({
        start: waypoint,
        end: waypoint2
    });

    // Finally add the endSegment
    segments.push(endSegment);

    const path = PathUtilities.applyRadius(
        pathFromSegments(segments),
        options.radius
    );

    return {
        path,
        obstacles: segments
    };
};
simpleConnect.requiresObstacles = true;

/**
 * Find a path from a starting coordinate to an ending coordinate, taking
 * obstacles into consideration. Might not always find the optimal path,
 * but is fast, and usually good enough.
 *
 * @function Highcharts.Pathfinder.algorithms.fastAvoid
 *
 * @param {Highcharts.PositionObject} start
 *        Starting coordinate, object with x/y props.
 *
 * @param {Highcharts.PositionObject} end
 *        Ending coordinate, object with x/y props.
 *
 * @param {Object} options
 *        Options for the algorithm.
 *        - chartObstacles:  Array of chart obstacles to avoid
 *        - lineObstacles:   Array of line obstacles to jump over
 *        - obstacleMetrics: Object with metrics of chartObstacles cached
 *        - hardBounds:      Hard boundaries to not cross
 *        - obstacleOptions: Options for the obstacles, including margin
 *        - startDirectionX: Optional. True if starting in the X direction.
 *                           If not provided, the algorithm starts in the
 *                           direction that is the furthest between
 *                           start/end.
 *
 * @return {Object}
 *         An object with the SVG path in Array form as accepted by the SVG
 *         renderer, as well as an array of new obstacles making up this
 *         path.
 */
const fastAvoid = function (
    start: PositionObject,
    end: PositionObject,
    options: any
): Highcharts.PathfinderAlgorithmResultObject {
    /*
        Algorithm rules/description
        - Find initial direction
        - Determine soft/hard max for each direction.
        - Move along initial direction until obstacle.
        - Change direction.
        - If hitting obstacle, first try to change length of previous line
            before changing direction again.

        Soft min/max x = start/destination x +/- widest obstacle + margin
        Soft min/max y = start/destination y +/- tallest obstacle + margin

        @todo:
            - Make retrospective, try changing prev segment to reduce
                corners
            - Fix logic for breaking out of end-points - not always picking
                the best direction currently
            - When going around the end obstacle we should not always go the
                shortest route, rather pick the one closer to the end point
    */
    let dirIsX = pick(
            options.startDirectionX,
            abs(end.x - start.x) > abs(end.y - start.y)
        ),
        dir = dirIsX ? 'x' : 'y',
        segments: any,
        useMax: boolean,
        extractedEndPoint: any,
        endSegments = [],
        forceObstacleBreak = false, // Used in clearPathTo to keep track of
        // when to force break through an obstacle.

        // Boundaries to stay within. If beyond soft boundary, prefer to
        // change direction ASAP. If at hard max, always change immediately.
        metrics = options.obstacleMetrics,
        softMinX = min(start.x, end.x) - metrics.maxWidth - 10,
        softMaxX = max(start.x, end.x) + metrics.maxWidth + 10,
        softMinY = min(start.y, end.y) - metrics.maxHeight - 10,
        softMaxY = max(start.y, end.y) + metrics.maxHeight + 10,

        // Obstacles
        chartObstacles = options.chartObstacles,
        startObstacleIx = findLastObstacleBefore(chartObstacles, softMinX),
        endObstacleIx = findLastObstacleBefore(chartObstacles, softMaxX);

    // eslint-disable-next-line valid-jsdoc
    /**
     * How far can you go between two points before hitting an obstacle?
     * Does not work for diagonal lines (because it doesn't have to).
     * @private
     */
    function pivotPoint(
        fromPoint: any,
        toPoint: any,
        directionIsX?: boolean
    ): any {
        let firstPoint,
            lastPoint,
            highestPoint,
            lowestPoint,
            i,
            searchDirection = fromPoint.x < toPoint.x ? 1 : -1;

        if (fromPoint.x < toPoint.x) {
            firstPoint = fromPoint;
            lastPoint = toPoint;
        } else {
            firstPoint = toPoint;
            lastPoint = fromPoint;
        }

        if (fromPoint.y < toPoint.y) {
            lowestPoint = fromPoint;
            highestPoint = toPoint;
        } else {
            lowestPoint = toPoint;
            highestPoint = fromPoint;
        }

        // Go through obstacle range in reverse if toPoint is before
        // fromPoint in the X-dimension.
        i = searchDirection < 0 ?
            // Searching backwards, start at last obstacle before last point
            min(findLastObstacleBefore(chartObstacles, lastPoint.x),
                chartObstacles.length - 1) :
            // Forwards. Since we're not sorted by xMax, we have to look
            // at all obstacles.
            0;

        // Go through obstacles in this X range
        while (chartObstacles[i] && (
            searchDirection > 0 && chartObstacles[i].xMin <= lastPoint.x ||
            searchDirection < 0 && chartObstacles[i].xMax >= firstPoint.x
        )) {
            // If this obstacle is between from and to points in a straight
            // line, pivot at the intersection.
            if (
                chartObstacles[i].xMin <= lastPoint.x &&
                chartObstacles[i].xMax >= firstPoint.x &&
                chartObstacles[i].yMin <= highestPoint.y &&
                chartObstacles[i].yMax >= lowestPoint.y
            ) {
                if (directionIsX) {
                    return {
                        y: fromPoint.y,
                        x: fromPoint.x < toPoint.x ?
                            chartObstacles[i].xMin - 1 :
                            chartObstacles[i].xMax + 1,
                        obstacle: chartObstacles[i]
                    };
                }
                // else ...
                return {
                    x: fromPoint.x,
                    y: fromPoint.y < toPoint.y ?
                        chartObstacles[i].yMin - 1 :
                        chartObstacles[i].yMax + 1,
                    obstacle: chartObstacles[i]
                };
            }

            i += searchDirection;
        }

        return toPoint;
    }

    /**
     * Decide in which direction to dodge or get out of an obstacle.
     * Considers desired direction, which way is shortest, soft and hard
     * bounds.
     *
     * (? Returns a string, either xMin, xMax, yMin or yMax.)
     *
     * @private
     * @function
     *
     * @param {Object} obstacle
     *        Obstacle to dodge/escape.
     *
     * @param {Object} fromPoint
     *        Point with x/y props that's dodging/escaping.
     *
     * @param {Object} toPoint
     *        Goal point.
     *
     * @param {boolean} dirIsX
     *        Dodge in X dimension.
     *
     * @param {Object} bounds
     *        Hard and soft boundaries.
     *
     * @return {boolean}
     *         Use max or not.
     */
    function getDodgeDirection(
        obstacle: any,
        fromPoint: any,
        toPoint: any,
        dirIsX: boolean,
        bounds: any
    ): boolean {
        let softBounds = bounds.soft,
            hardBounds = bounds.hard,
            dir = dirIsX ? 'x' : 'y',
            toPointMax: Record<string, number> =
                { x: fromPoint.x, y: fromPoint.y },
            toPointMin: Record<string, number> =
                { x: fromPoint.x, y: fromPoint.y },
            minPivot,
            maxPivot,
            maxOutOfSoftBounds = obstacle[dir + 'Max'] >=
                                softBounds[dir + 'Max'],
            minOutOfSoftBounds = obstacle[dir + 'Min'] <=
                                softBounds[dir + 'Min'],
            maxOutOfHardBounds = obstacle[dir + 'Max'] >=
                                hardBounds[dir + 'Max'],
            minOutOfHardBounds = obstacle[dir + 'Min'] <=
                                hardBounds[dir + 'Min'],
            // Find out if we should prefer one direction over the other if
            // we can choose freely
            minDistance = abs(obstacle[dir + 'Min'] - fromPoint[dir]),
            maxDistance = abs(obstacle[dir + 'Max'] - fromPoint[dir]),
            // If it's a small difference, pick the one leading towards dest
            // point. Otherwise pick the shortest distance
            useMax = abs(minDistance - maxDistance) < 10 ?
                fromPoint[dir] < toPoint[dir] :
                maxDistance < minDistance;

        // Check if we hit any obstacles trying to go around in either
        // direction.
        toPointMin[dir] = obstacle[dir + 'Min'];
        toPointMax[dir] = obstacle[dir + 'Max'];
        minPivot = pivotPoint(fromPoint, toPointMin, dirIsX)[dir] !==
                    toPointMin[dir];
        maxPivot = pivotPoint(fromPoint, toPointMax, dirIsX)[dir] !==
                    toPointMax[dir];
        useMax = minPivot ?
            (maxPivot ? useMax : true) :
            (maxPivot ? false : useMax);

        // useMax now contains our preferred choice, bounds not taken into
        // account. If both or neither direction is out of bounds we want to
        // use this.

        // Deal with soft bounds
        useMax = minOutOfSoftBounds ?
            (maxOutOfSoftBounds ? useMax : true) : // Out on min
            (maxOutOfSoftBounds ? false : useMax); // Not out on min

        // Deal with hard bounds
        useMax = minOutOfHardBounds ?
            (maxOutOfHardBounds ? useMax : true) : // Out on min
            (maxOutOfHardBounds ? false : useMax); // Not out on min

        return useMax;
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Find a clear path between point.
     * @private
     */
    function clearPathTo(
        fromPoint: any,
        toPoint: any,
        dirIsX: boolean
    ): Array<any> {
        // Don't waste time if we've hit goal
        if (fromPoint.x === toPoint.x && fromPoint.y === toPoint.y) {
            return [];
        }

        let dir = dirIsX ? 'x' : 'y',
            pivot,
            segments: Array<any>,
            waypoint,
            waypointUseMax,
            envelopingObstacle,
            secondEnvelopingObstacle,
            envelopWaypoint: Record<string, number>,
            obstacleMargin = options.obstacleOptions.margin,
            bounds = {
                soft: {
                    xMin: softMinX,
                    xMax: softMaxX,
                    yMin: softMinY,
                    yMax: softMaxY
                },
                hard: options.hardBounds
            };

        // If fromPoint is inside an obstacle we have a problem. Break out
        // by just going to the outside of this obstacle. We prefer to go to
        // the nearest edge in the chosen direction.
        envelopingObstacle =
            findObstacleFromPoint(chartObstacles, fromPoint);
        if (envelopingObstacle > -1) {
            envelopingObstacle = chartObstacles[envelopingObstacle];
            waypointUseMax = getDodgeDirection(
                envelopingObstacle, fromPoint, toPoint, dirIsX, bounds
            );

            // Cut obstacle to hard bounds to make sure we stay within
            limitObstacleToBounds(envelopingObstacle, options.hardBounds);

            envelopWaypoint = dirIsX ? {
                y: fromPoint.y,
                x: envelopingObstacle[waypointUseMax ? 'xMax' : 'xMin'] +
                    (waypointUseMax ? 1 : -1)
            } : {
                x: fromPoint.x,
                y: envelopingObstacle[waypointUseMax ? 'yMax' : 'yMin'] +
                    (waypointUseMax ? 1 : -1)
            };

            // If we crashed into another obstacle doing this, we put the
            // waypoint between them instead
            secondEnvelopingObstacle = findObstacleFromPoint(
                chartObstacles, envelopWaypoint
            );
            if (secondEnvelopingObstacle > -1) {
                secondEnvelopingObstacle = chartObstacles[
                    secondEnvelopingObstacle
                ];

                // Cut obstacle to hard bounds
                limitObstacleToBounds(
                    secondEnvelopingObstacle,
                    options.hardBounds
                );

                // Modify waypoint to lay between obstacles
                envelopWaypoint[dir] = waypointUseMax ? max(
                    envelopingObstacle[dir + 'Max'] - obstacleMargin + 1,
                    (
                        secondEnvelopingObstacle[dir + 'Min'] +
                        envelopingObstacle[dir + 'Max']
                    ) / 2
                ) :
                    min((
                        envelopingObstacle[dir + 'Min'] + obstacleMargin - 1
                    ), (
                        (
                            secondEnvelopingObstacle[dir + 'Max'] +
                            envelopingObstacle[dir + 'Min']
                        ) / 2
                    ));

                // We are not going anywhere. If this happens for the first
                // time, do nothing. Otherwise, try to go to the extreme of
                // the obstacle pair in the current direction.
                if (fromPoint.x === envelopWaypoint.x &&
                    fromPoint.y === envelopWaypoint.y) {
                    if (forceObstacleBreak) {
                        envelopWaypoint[dir] = waypointUseMax ?
                            max(
                                envelopingObstacle[dir + 'Max'],
                                secondEnvelopingObstacle[dir + 'Max']
                            ) + 1 :
                            min(
                                envelopingObstacle[dir + 'Min'],
                                secondEnvelopingObstacle[dir + 'Min']
                            ) - 1;
                    }
                    // Toggle on if off, and the opposite
                    forceObstacleBreak = !forceObstacleBreak;
                } else {
                    // This point is not identical to previous.
                    // Clear break trigger.
                    forceObstacleBreak = false;
                }
            }

            segments = [{
                start: fromPoint,
                end: envelopWaypoint
            }];

        } else { // If not enveloping, use standard pivot calculation

            pivot = pivotPoint(fromPoint, {
                x: dirIsX ? toPoint.x : fromPoint.x,
                y: dirIsX ? fromPoint.y : toPoint.y
            }, dirIsX);

            segments = [{
                start: fromPoint,
                end: {
                    x: pivot.x,
                    y: pivot.y
                }
            }];

            // Pivot before goal, use a waypoint to dodge obstacle
            if (pivot[dirIsX ? 'x' : 'y'] !== toPoint[dirIsX ? 'x' : 'y']) {
                // Find direction of waypoint
                waypointUseMax = getDodgeDirection(
                    pivot.obstacle, pivot, toPoint, !dirIsX, bounds
                );

                // Cut waypoint to hard bounds
                limitObstacleToBounds(pivot.obstacle, options.hardBounds);

                waypoint = {
                    x: dirIsX ?
                        pivot.x :
                        pivot.obstacle[waypointUseMax ? 'xMax' : 'xMin'] +
                            (waypointUseMax ? 1 : -1),
                    y: dirIsX ?
                        pivot.obstacle[waypointUseMax ? 'yMax' : 'yMin'] +
                            (waypointUseMax ? 1 : -1) :
                        pivot.y
                };

                // We're changing direction here, store that to make sure we
                // also change direction when adding the last segment array
                // after handling waypoint.
                dirIsX = !dirIsX;

                segments = segments.concat(clearPathTo({
                    x: pivot.x,
                    y: pivot.y
                }, waypoint, dirIsX));
            }
        }

        // Get segments for the other direction too
        // Recursion is our friend
        segments = segments.concat(clearPathTo(
            segments[segments.length - 1].end, toPoint, !dirIsX
        ));

        return segments;
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Extract point to outside of obstacle in whichever direction is
     * closest. Returns new point outside obstacle.
     * @private
     */
    function extractFromObstacle(
        obstacle: any,
        point: any,
        goalPoint: any
    ): any {
        const dirIsX = min(obstacle.xMax - point.x, point.x - obstacle.xMin) <
                    min(obstacle.yMax - point.y, point.y - obstacle.yMin),
            bounds = {
                soft: options.hardBounds,
                hard: options.hardBounds
            },
            useMax = getDodgeDirection(
                obstacle, point, goalPoint, dirIsX, bounds
            );

        return dirIsX ? {
            y: point.y,
            x: obstacle[useMax ? 'xMax' : 'xMin'] + (useMax ? 1 : -1)
        } : {
            x: point.x,
            y: obstacle[useMax ? 'yMax' : 'yMin'] + (useMax ? 1 : -1)
        };
    }

    // Cut the obstacle array to soft bounds for optimization in large
    // datasets.
    chartObstacles =
        chartObstacles.slice(startObstacleIx, endObstacleIx + 1);

    // If an obstacle envelops the end point, move it out of there and add
    // a little segment to where it was.
    if ((endObstacleIx = findObstacleFromPoint(chartObstacles, end)) > -1) {
        extractedEndPoint = extractFromObstacle(
            chartObstacles[endObstacleIx],
            end,
            start
        );
        endSegments.push({
            end: end,
            start: extractedEndPoint
        });
        end = extractedEndPoint;
    }
    // If it's still inside one or more obstacles, get out of there by
    // force-moving towards the start point.
    while (
        (endObstacleIx = findObstacleFromPoint(chartObstacles, end)) > -1
    ) {
        useMax = (end as any)[dir] - (start as any)[dir] < 0;
        extractedEndPoint = {
            x: end.x,
            y: end.y
        };
        extractedEndPoint[dir] = chartObstacles[endObstacleIx][
            useMax ? dir + 'Max' : dir + 'Min'
        ] + (useMax ? 1 : -1);
        endSegments.push({
            end: end,
            start: extractedEndPoint
        });
        end = extractedEndPoint;
    }

    // Find the path
    segments = clearPathTo(start, end, dirIsX);

    // Add the end-point segments
    segments = segments.concat(endSegments.reverse());

    return {
        path: pathFromSegments(segments),
        obstacles: segments
    };
};
fastAvoid.requiresObstacles = true;

// Define the available pathfinding algorithms.
// Algorithms take up to 3 arguments: starting point, ending point, and an
// options object.
const algorithms = {
    fastAvoid,
    straight,
    simpleConnect
};

export default algorithms;
