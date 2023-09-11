/* *
 *
 *  Experimental Highcharts module which enables visualization of a Venn
 *  diagram.
 *
 *  (c) 2016-2021 Highsoft AS
 *  Authors: Jon Arild Nygard
 *
 *  Layout algorithm by Ben Frederickson:
 *  https://www.benfrederickson.com/better-venn-diagrams/
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

import type CircleObject from '../../Core/Geometry/CircleObject';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type VennPointOptions from './VennPointOptions';

import CU from '../../Core/Geometry/CircleUtilities.js';
const {
    getAreaOfCircle,
    getCircleCircleIntersection,
    getOverlapBetweenCircles: getOverlapBetweenCirclesByDistance,
    isPointInsideAllCircles,
    isPointInsideCircle,
    isPointOutsideAllCircles
} = CU;
import GU from '../../Core/Geometry/GeometryUtilities.js';
const { getDistanceBetweenPoints } = GU;
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject, isString } = TC;
const { extend } = OH;

/* *
 *
 *  Declarations
 *
 * */

interface NelderMeadCentroidObject {
    i: number;
    sum: number;
}

interface NelderMeadPointArray extends Array<number> {
    fx: number;
}

interface NelderMeadTestFunction {
    (point: NelderMeadPointArray): number;
}

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Takes an array of relations and adds the properties `totalOverlap` and
 * `overlapping` to each set. The property `totalOverlap` is the sum of
 * value for each relation where this set is included. The property
 * `overlapping` is a map of how much this set is overlapping another set.
 * NOTE: This algorithm ignores relations consisting of more than 2 sets.
 * @private
 * @param {Array<Highcharts.VennRelationObject>} relations
 * The list of relations that should be sorted.
 * @return {Array<Highcharts.VennRelationObject>}
 * Returns the modified input relations with added properties `totalOverlap`
 * and `overlapping`.
 */
function addOverlapToSets(
    relations: Array<Highcharts.VennRelationObject>
): Array<Highcharts.VennRelationObject> {
    // Calculate the amount of overlap per set.
    const mapOfIdToProps: Record<string, Highcharts.VennPropsObject> = {};

    relations
        // Filter out relations consisting of 2 sets.
        .filter((relation): boolean => (relation.sets.length === 2))
        // Sum up the amount of overlap for each set.
        .forEach((relation): void => {
            relation.sets.forEach((set, i, arr): void => {
                if (!isObject(mapOfIdToProps[set])) {
                    mapOfIdToProps[set] = {
                        totalOverlap: 0,
                        overlapping: {}
                    };
                }

                mapOfIdToProps[set] = {
                    totalOverlap: (mapOfIdToProps[set].totalOverlap || 0) +
                        relation.value,
                    overlapping: {
                        ...(mapOfIdToProps[set].overlapping || {}),
                        [arr[1 - i]]: relation.value
                    }
                };
            });
        });

    relations
        // Filter out single sets
        .filter(isSet)
        // Extend the set with the calculated properties.
        .forEach((set): void => {
            const properties = mapOfIdToProps[set.sets[0]];

            extend(set, properties);
        });

    // Returns the modified relations.
    return relations;
}

/**
 * Finds the root of a given function. The root is the input value needed
 * for a function to return 0.
 *
 * See https://en.wikipedia.org/wiki/Bisection_method#Algorithm
 *
 * TODO: Add unit tests.
 *
 * @param {Function} f
 * The function to find the root of.
 * @param {number} a
 * The lowest number in the search range.
 * @param {number} b
 * The highest number in the search range.
 * @param {number} [tolerance=1e-10]
 * The allowed difference between the returned value and root.
 * @param {number} [maxIterations=100]
 * The maximum iterations allowed.
 * @return {number}
 * Root number.
 */
function bisect(
    f: Function,
    a: number,
    b: number,
    tolerance?: number,
    maxIterations?: number
): number {
    let fA = f(a),
        fB = f(b),
        nMax = maxIterations || 100,
        tol = tolerance || 1e-10,
        delta = b - a,
        n = 1,
        x: (number|undefined),
        fX: (number|undefined);

    if (a >= b) {
        throw new Error('a must be smaller than b.');
    } else if (fA * fB > 0) {
        throw new Error('f(a) and f(b) must have opposite signs.');
    }

    if (fA === 0) {
        x = a;
    } else if (fB === 0) {
        x = b;
    } else {
        while (n++ <= nMax && fX !== 0 && delta > tol) {
            delta = (b - a) / 2;
            x = a + delta;
            fX = f(x);

            // Update low and high for next search interval.
            if (fA * (fX as any) > 0) {
                a = x;
            } else {
                b = x;
            }
        }
    }

    return x as any;
}

/**
 * @private
 */
function getCentroid(
    simplex: Array<NelderMeadPointArray>
): Array<number> {
    const arr = simplex.slice(0, -1),
        length = arr.length,
        result = [] as Array<number>,
        sum = function (
            data: NelderMeadCentroidObject,
            point: Array<number>
        ): NelderMeadCentroidObject {
            data.sum += point[data.i];
            return data;
        };

    for (let i = 0; i < length; i++) {
        result[i] = arr.reduce(sum, { sum: 0, i: i }).sum / length;
    }
    return result;
}

/**
 * Uses the bisection method to make a best guess of the ideal distance
 * between two circles too get the desired overlap.
 * Currently there is no known formula to calculate the distance from the
 * area of overlap, which makes the bisection method preferred.
 * @private
 * @param {number} r1
 * Radius of the first circle.
 * @param {number} r2
 * Radiues of the second circle.
 * @param {number} overlap
 * The wanted overlap between the two circles.
 * @return {number}
 * Returns the distance needed to get the wanted overlap between the two
 * circles.
 */
function getDistanceBetweenCirclesByOverlap(
    r1: number,
    r2: number,
    overlap: number
): number {
    let maxDistance = r1 + r2,
        distance;

    if (overlap <= 0) {
        // If overlap is below or equal to zero, then there is no overlap.
        distance = maxDistance;
    } else if (getAreaOfCircle(r1 < r2 ? r1 : r2) <= overlap) {
        // When area of overlap is larger than the area of the smallest
        // circle, then it is completely overlapping.
        distance = 0;
    } else {
        distance = bisect((x: number): number => {
            const actualOverlap = getOverlapBetweenCirclesByDistance(r1, r2, x);

            // Return the differance between wanted and actual overlap.
            return overlap - actualOverlap;
        }, 0, maxDistance);
    }
    return distance;
}

/**
 * Finds the available width for a label, by taking the label position and
 * finding the largest distance, which is inside all internal circles, and
 * outside all external circles.
 *
 * @private
 * @param {Highcharts.PositionObject} pos
 * The x and y coordinate of the label.
 * @param {Array<Highcharts.CircleObject>} internal
 * Internal circles.
 * @param {Array<Highcharts.CircleObject>} external
 * External circles.
 * @return {number}
 * Returns available width for the label.
 */
function getLabelWidth(
    pos: PositionObject,
    internal: Array<CircleObject>,
    external: Array<CircleObject>
): number {
    const radius = internal.reduce(
            (min, circle): number => Math.min(circle.r, min),
            Infinity
        ),
        // Filter out external circles that are completely overlapping.
        filteredExternals = external.filter(
            function (circle): boolean {
                return !isPointInsideCircle(pos, circle);
            }
        );

    const findDistance = function (
        maxDistance: number,
        direction: number
    ): number {
        return bisect(function (x: number): number {
            const testPos = {
                    x: pos.x + (direction * x),
                    y: pos.y
                },
                isValid = (
                    isPointInsideAllCircles(testPos, internal) &&
                    isPointOutsideAllCircles(testPos, filteredExternals)
                );

            // If the position is valid, then we want to move towards the
            // max distance. If not, then we want to  away from the max
            // distance.
            return -(maxDistance - x) + (isValid ? 0 : Number.MAX_VALUE);
        }, 0, maxDistance);
    };

    // Find the smallest distance of left and right.
    return Math.min(findDistance(radius, -1), findDistance(radius, 1)) * 2;
}

/**
 * Calculates a margin for a point based on the iternal and external
 * circles. The margin describes if the point is well placed within the
 * internal circles, and away from the external.
 * @private
 * @todo add unit tests.
 * @param {Highcharts.PositionObject} point
 * The point to evaluate.
 * @param {Array<Highcharts.CircleObject>} internal
 * The internal circles.
 * @param {Array<Highcharts.CircleObject>} external
 * The external circles.
 * @return {number}
 * Returns the margin.
 */
function getMarginFromCircles(
    point: PositionObject,
    internal: Array<CircleObject>,
    external: Array<CircleObject>
): number {
    let margin = internal.reduce(function (margin, circle): number {
        const m = circle.r - getDistanceBetweenPoints(point, circle);

        return (m <= margin) ? m : margin;
    }, Number.MAX_VALUE);

    margin = external.reduce(function (margin, circle): number {
        const m = getDistanceBetweenPoints(point, circle) - circle.r;

        return (m <= margin) ? m : margin;
    }, margin);

    return margin;
}

/**
 * Calculates the area of overlap between a list of circles.
 * @private
 * @todo add support for calculating overlap between more than 2 circles.
 * @param {Array<Highcharts.CircleObject>} circles
 * List of circles with their given positions.
 * @return {number}
 * Returns the area of overlap between all the circles.
 */
function getOverlapBetweenCircles(
    circles: Array<CircleObject>
): number {
    let overlap = 0;

    // When there is only two circles we can find the overlap by using their
    // radiuses and the distance between them.
    if (circles.length === 2) {
        const circle1 = circles[0];
        const circle2 = circles[1];

        overlap = getOverlapBetweenCirclesByDistance(
            circle1.r,
            circle2.r,
            getDistanceBetweenPoints(circle1, circle2)
        );
    }

    return overlap;
}

// eslint-disable-next-line require-jsdoc
function isSet(
    x: (VennPointOptions|Highcharts.VennRelationObject)
): boolean {
    return isArray(x.sets) && x.sets.length === 1;
}

// eslint-disable-next-line require-jsdoc
function isValidRelation(
    x: (VennPointOptions|Highcharts.VennRelationObject)
): boolean {
    const map: Record<string, boolean> = {};

    return (
        isObject(x) &&
        (isNumber(x.value) && x.value > -1) &&
        (isArray(x.sets) && x.sets.length > 0) &&
        !x.sets.some(function (set: string): boolean {
            let invalid = false;

            if (!map[set] && isString(set)) {
                map[set] = true;
            } else {
                invalid = true;
            }
            return invalid;
        })
    );
}

// eslint-disable-next-line require-jsdoc
function isValidSet(
    x: (VennPointOptions|Highcharts.VennRelationObject)
): boolean {
    return (isValidRelation(x) && isSet(x) && (x.value as any) > 0);
}

/**
 * Uses a greedy approach to position all the sets. Works well with a small
 * number of sets, and are in these cases a good choice aesthetically.
 * @private
 * @param {Array<object>} relations List of the overlap between two or more
 * sets, or the size of a single set.
 * @return {Array<object>} List of circles and their calculated positions.
 */
function layoutGreedyVenn(
    relations: Array<Highcharts.VennRelationObject>
): Record<string, CircleObject> {
    const positionedSets: Array<Highcharts.VennRelationObject> = [],
        mapOfIdToCircles: Record<string, CircleObject> = {};

    // Define a circle for each set.
    relations
        .filter(function (relation: Highcharts.VennRelationObject): boolean {
            return relation.sets.length === 1;
        }).forEach(function (relation: Highcharts.VennRelationObject): void {
            mapOfIdToCircles[relation.sets[0]] = relation.circle = {
                x: Number.MAX_VALUE,
                y: Number.MAX_VALUE,
                r: Math.sqrt(relation.value / Math.PI)
            };
        });

    /**
     * Takes a set and updates the position, and add the set to the list of
     * positioned sets.
     * @private
     * @param {Object} set
     * The set to add to its final position.
     * @param {Object} coordinates
     * The coordinates to position the set at.
     */
    const positionSet = function positionSet(
        set: Highcharts.VennRelationObject,
        coordinates: PositionObject
    ): void {
        const circle = set.circle;

        if (circle) {
            circle.x = coordinates.x;
            circle.y = coordinates.y;
        }

        positionedSets.push(set);
    };

    // Find overlap between sets. Ignore relations with more then 2 sets.
    addOverlapToSets(relations);

    // Sort sets by the sum of their size from large to small.
    const sortedByOverlap = relations
        .filter(isSet)
        .sort(sortByTotalOverlap);

    // Position the most overlapped set at 0,0.
    positionSet(sortedByOverlap.shift() as any, { x: 0, y: 0 });

    const relationsWithTwoSets = relations.filter(
        function (x: Highcharts.VennRelationObject): boolean {
            return x.sets.length === 2;
        }
    );

    // Iterate and position the remaining sets.
    sortedByOverlap.forEach(function (
        set: Highcharts.VennRelationObject
    ): void {
        const circle = set.circle;
        if (!circle) {
            return;
        }

        const radius = circle.r,
            overlapping = set.overlapping;

        const bestPosition = positionedSets.reduce(
            (best, positionedSet, i): Highcharts.VennLabelOverlapObject => {
                const positionedCircle = positionedSet.circle;

                if (!positionedCircle || !overlapping) {
                    return best;
                }

                const overlap = overlapping[positionedSet.sets[0]];

                // Calculate the distance between the sets to get the
                // correct overlap
                const distance = getDistanceBetweenCirclesByOverlap(
                    radius,
                    positionedCircle.r,
                    overlap
                );

                // Create a list of possible coordinates calculated from
                // distance.
                let possibleCoordinates: Array<PositionObject> = [
                    { x: positionedCircle.x + distance, y: positionedCircle.y },
                    { x: positionedCircle.x - distance, y: positionedCircle.y },
                    { x: positionedCircle.x, y: positionedCircle.y + distance },
                    { x: positionedCircle.x, y: positionedCircle.y - distance }
                ];

                // If there are more circles overlapping, then add the
                // intersection points as possible positions.
                positionedSets.slice(i + 1).forEach(function (
                    positionedSet2: Highcharts.VennRelationObject
                ): void {
                    const positionedCircle2 = positionedSet2.circle,
                        overlap2 = overlapping[positionedSet2.sets[0]];

                    if (!positionedCircle2) {
                        return;
                    }

                    const distance2 = getDistanceBetweenCirclesByOverlap(
                        radius,
                        positionedCircle2.r,
                        overlap2
                    );

                    // Add intersections to list of coordinates.
                    possibleCoordinates = possibleCoordinates.concat(
                        getCircleCircleIntersection({
                            x: positionedCircle.x,
                            y: positionedCircle.y,
                            r: distance
                        }, {
                            x: positionedCircle2.x,
                            y: positionedCircle2.y,
                            r: distance2
                        })
                    );
                });

                // Iterate all suggested coordinates and find the best one.
                possibleCoordinates.forEach(function (coordinates): void {
                    circle.x = coordinates.x;
                    circle.y = coordinates.y;

                    // Calculate loss for the suggested coordinates.
                    const currentLoss = loss(
                        mapOfIdToCircles, relationsWithTwoSets
                    );

                    // If the loss is better, then use these new coordinates
                    if (currentLoss < best.loss) {
                        best.loss = currentLoss;
                        best.coordinates = coordinates;
                    }
                });

                // Return resulting coordinates.
                return best;
            }, {
                loss: Number.MAX_VALUE,
                coordinates: void 0 as any
            }
        );

        // Add the set to its final position.
        positionSet(set, bestPosition.coordinates);
    });

    // Return the positions of each set.
    return mapOfIdToCircles;
}

/**
 * Calculates the difference between the desired overlap and the actual
 * overlap between two circles.
 * @private
 * @param {Dictionary<Highcharts.CircleObject>} mapOfIdToCircle
 * Map from id to circle.
 * @param {Array<Highcharts.VennRelationObject>} relations
 * List of relations to calculate the loss of.
 * @return {number}
 * Returns the loss between positions of the circles for the given
 * relations.
 */
function loss(
    mapOfIdToCircle: Record<string, CircleObject>,
    relations: Array<Highcharts.VennRelationObject>
): number {
    const precision = 10e10;

    // Iterate all the relations and calculate their individual loss.
    return relations.reduce(function (
        totalLoss: number,
        relation: Highcharts.VennRelationObject
    ): number {
        let loss = 0;

        if (relation.sets.length > 1) {
            const wantedOverlap = relation.value;
            // Calculate the actual overlap between the sets.
            const actualOverlap = getOverlapBetweenCircles(
                // Get the circles for the given sets.
                relation.sets.map(function (set): CircleObject {
                    return mapOfIdToCircle[set];
                })
            );

            const diff = wantedOverlap - actualOverlap;

            loss = Math.round((diff * diff) * precision) / precision;
        }

        // Add calculated loss to the sum.
        return totalLoss + loss;
    }, 0);
}


/**
 * Finds an optimal position for a given point.
 * @todo add unit tests.
 * @todo add constraints to optimize the algorithm.
 * @private
 * @param {Highcharts.NelderMeadTestFunction} fn
 *        The function to test a point.
 * @param {Highcharts.NelderMeadPointArray} initial
 *        The initial point to optimize.
 * @return {Highcharts.NelderMeadPointArray}
 *         Returns the opimized position of a point.
 */
function nelderMead(
    fn: NelderMeadTestFunction,
    initial: NelderMeadPointArray
): NelderMeadPointArray {
    const maxIterations = 100,
        sortByFx = function (
            a: NelderMeadPointArray,
            b: NelderMeadPointArray
        ): number {
            return a.fx - b.fx;
        },
        pRef = 1, // Reflection parameter
        pExp = 2, // Expansion parameter
        pCon = -0.5, // Contraction parameter
        pOCon = pCon * pRef, // Outwards contraction parameter
        pShrink = 0.5; // Shrink parameter

    /**
     * @private
     */
    const weightedSum = (
        weight1: number,
        v1: Array<number>,
        weight2: number,
        v2: Array<number>
    ): Array<number> => v1.map(
        (x: number, i: number): number => weight1 * x + weight2 * v2[i]
    );

    /**
     * @private
     */
    const getSimplex = (
        initial: NelderMeadPointArray
    ): Array<NelderMeadPointArray> => {
        const n = initial.length,
            simplex: Array<NelderMeadPointArray> = new Array(n + 1);

        // Initial point to the simplex.
        simplex[0] = initial;
        simplex[0].fx = fn(initial);

        // Create a set of extra points based on the initial.
        for (let i = 0; i < n; ++i) {
            const point = initial.slice() as NelderMeadPointArray;

            point[i] = point[i] ? point[i] * 1.05 : 0.001;
            point.fx = fn(point);
            simplex[i + 1] = point;
        }
        return simplex;
    };

    const updateSimplex = (
        simplex: Array<NelderMeadPointArray>,
        point: NelderMeadPointArray
    ): Array<NelderMeadPointArray> => {
        point.fx = fn(point);
        simplex[simplex.length - 1] = point;
        return simplex;
    };

    const shrinkSimplex = (
        simplex: Array<NelderMeadPointArray>
    ): Array<NelderMeadPointArray> => {
        const best = simplex[0];

        return simplex.map((
            point: NelderMeadPointArray
        ): NelderMeadPointArray => {
            const p = weightedSum(
                1 - pShrink,
                best,
                pShrink,
                point
            ) as NelderMeadPointArray;

            p.fx = fn(p);
            return p;
        });
    };

    const getPoint = (
        centroid: Array<number>,
        worst: Array<number>,
        a: number,
        b: number
    ): NelderMeadPointArray => {
        const point = weightedSum(
            a,
            centroid,
            b,
            worst
        ) as NelderMeadPointArray;

        point.fx = fn(point);
        return point;
    };

    // Create a simplex
    let simplex = getSimplex(initial);

    // Iterate from 0 to max iterations
    for (let i = 0; i < maxIterations; i++) {
        // Sort the simplex
        simplex.sort(sortByFx);

        // Create a centroid from the simplex
        const worst = simplex[simplex.length - 1];
        const centroid = getCentroid(simplex);

        // Calculate the reflected point.
        const reflected = getPoint(centroid, worst, 1 + pRef, -pRef);

        if (reflected.fx < simplex[0].fx) {
            // If reflected point is the best, then possibly expand.
            const expanded = getPoint(centroid, worst, 1 + pExp, -pExp);

            simplex = updateSimplex(
                simplex,
                (expanded.fx < reflected.fx) ? expanded : reflected
            );
        } else if (reflected.fx >= simplex[simplex.length - 2].fx) {
            // If the reflected point is worse than the second worse, then
            // contract.
            let contracted;

            if (reflected.fx > worst.fx) {
                // If the reflected is worse than the worst point, do a
                // contraction
                contracted = getPoint(centroid, worst, 1 + pCon, -pCon);
                if (contracted.fx < worst.fx) {
                    simplex = updateSimplex(simplex, contracted);
                } else {
                    simplex = shrinkSimplex(simplex);
                }
            } else {
                // Otherwise do an outwards contraction
                contracted = getPoint(centroid, worst, 1 - pOCon, pOCon);
                if (contracted.fx < reflected.fx) {
                    simplex = updateSimplex(simplex, contracted);
                } else {
                    simplex = shrinkSimplex(simplex);
                }
            }
        } else {
            simplex = updateSimplex(simplex, reflected);
        }
    }

    return simplex[0];
}

/**
 * Prepares the venn data so that it is usable for the layout function.
 * Filter out sets, or intersections that includes sets, that are missing in
 * the data or has (value < 1). Adds missing relations between sets in the
 * data as value = 0.
 * @private
 * @param {Array<object>} data The raw input data.
 * @return {Array<object>} Returns an array of valid venn data.
 */
function processVennData(
    data: Array<VennPointOptions>,
    splitter: string
): Array<Highcharts.VennRelationObject> {
    const d = isArray(data) ? data : [];

    const validSets = d
        .reduce(function (
            arr: Array<string>,
            x: VennPointOptions
        ): Array<string> {
            // Check if x is a valid set, and that it is not an duplicate.
            if (x.sets && isValidSet(x) && arr.indexOf(x.sets[0]) === -1) {
                arr.push(x.sets[0]);
            }
            return arr;
        }, [])
        .sort();

    const mapOfIdToRelation = d.reduce(function (
        mapOfIdToRelation: Record<string, Highcharts.VennRelationObject>,
        relation: VennPointOptions
    ): Record<string, Highcharts.VennRelationObject> {
        if (
            relation.sets &&
            isValidRelation(relation) &&
            !relation.sets.some(function (set: string): boolean {
                return validSets.indexOf(set) === -1;
            })
        ) {
            mapOfIdToRelation[
                relation.sets.sort().join(splitter)
            ] = {
                sets: relation.sets,
                value: relation.value || 0
            };
        }
        return mapOfIdToRelation;
    }, {});

    validSets.reduce(function (
        combinations: Array<string>,
        set: string,
        i: number,
        arr: Array<string>
    ): Array<string> {
        const remaining = arr.slice(i + 1);

        remaining.forEach(function (set2: string): void {
            combinations.push(set + splitter + set2);
        });
        return combinations;
    }, []).forEach(function (combination: string): void {
        if (!mapOfIdToRelation[combination]) {
            const obj: Highcharts.VennRelationObject = {
                sets: combination.split(splitter),
                value: 0
            };

            mapOfIdToRelation[combination] = obj;
        }
    });

    // Transform map into array.
    return Object
        .keys(mapOfIdToRelation)
        .map(function (id): Highcharts.VennRelationObject {
            return mapOfIdToRelation[id];
        });
}

/**
 * Takes two sets and finds the one with the largest total overlap.
 * @private
 * @param {Object} a
 * The first set to compare.
 * @param {Object} b
 * The second set to compare.
 * @return {number}
 * Returns 0 if a and b are equal, <0 if a is greater, >0 if b is greater.
 */
function sortByTotalOverlap(
    a: Highcharts.VennRelationObject,
    b: Highcharts.VennRelationObject
): number {
    if (typeof b.totalOverlap !== 'undefined' &&
        typeof a.totalOverlap !== 'undefined') {
        return b.totalOverlap - a.totalOverlap;
    }
    return NaN;
}

/* *
 *
 *  Default Export
 *
 * */

const VennUtils = {
    geometry: GU,
    geometryCircles: CU,
    addOverlapToSets,
    getCentroid,
    getDistanceBetweenCirclesByOverlap,
    getLabelWidth,
    getMarginFromCircles,
    isSet,
    layoutGreedyVenn,
    loss,
    nelderMead,
    processVennData,
    sortByTotalOverlap
};

export default VennUtils;
