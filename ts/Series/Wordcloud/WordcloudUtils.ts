/* *
 *
 *  Experimental Highcharts module which enables visualization of a word cloud.
 *
 *  (c) 2016-2021 Highsoft AS
 *  Authors: Jon Arild Nygard
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type PolygonBoxObject from '../../Core/Renderer/PolygonBoxObject';
import type PositionObject from '../../Core/Renderer/PositionObject';
import type RangeSelector from '../../Stock/RangeSelector/RangeSelector';
import type WordcloudPoint from './WordcloudPoint';
import type WordcloudSeries from './WordcloudSeries';

import H from '../../Core/Globals.js';
const { deg2rad } = H;
import U from '../../Core/Utilities.js';
const {
    extend,
    find,
    isNumber,
    isObject,
    merge
} = U;

/* *
 *
 * Functions
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Detects if there is a collision between two rectangles.
 *
 * @private
 * @function isRectanglesIntersecting
 *
 * @param {Highcharts.PolygonBoxObject} r1
 * First rectangle.
 *
 * @param {Highcharts.PolygonBoxObject} r2
 * Second rectangle.
 *
 * @return {boolean}
 * Returns true if the rectangles overlap.
 */
function isRectanglesIntersecting(
    r1: PolygonBoxObject,
    r2: PolygonBoxObject
): boolean {
    return !(
        r2.left > r1.right ||
        r2.right < r1.left ||
        r2.top > r1.bottom ||
        r2.bottom < r1.top
    );
}

/**
 * Calculates the normals to a line between two points.
 *
 * @private
 * @function getNormals
 * @param {Highcharts.PolygonPointObject} p1
 *        Start point for the line. Array of x and y value.
 * @param {Highcharts.PolygonPointObject} p2
 *        End point for the line. Array of x and y value.
 * @return {Highcharts.PolygonObject}
 *         Returns the two normals in an array.
 */
function getNormals(
    p1: WordcloudUtils.PolygonPointObject,
    p2: WordcloudUtils.PolygonPointObject
): WordcloudUtils.PolygonObject {
    const dx = p2[0] - p1[0], // x2 - x1
        dy = p2[1] - p1[1]; // y2 - y1

    return [
        [-dy, dx],
        [dy, -dx]
    ];
}

/**
 * @private
 */
function getAxesFromPolygon(
    polygon: WordcloudUtils.PolygonObject
): Array<WordcloudUtils.PolygonPointObject> {
    let points,
        axes = polygon.axes || [];

    if (!axes.length) {
        axes = [];
        points = points = polygon.concat([polygon[0]]);
        points.reduce(
            function findAxis(
                p1: WordcloudUtils.PolygonPointObject,
                p2: WordcloudUtils.PolygonPointObject
            ): WordcloudUtils.PolygonPointObject {
                const normals = getNormals(p1, p2),
                    axis = normals[0]; // Use the left normal as axis.

                // Check that the axis is unique.
                if (!find(axes, (
                    existing
                ): boolean =>
                    existing[0] === axis[0] &&
                    existing[1] === axis[1])) {
                    axes.push(axis);
                }

                // Return p2 to be used as p1 in next iteration.
                return p2;
            }
        );
        polygon.axes = axes;
    }
    return axes;
}

/**
 * Projects a polygon onto a coordinate.
 *
 * @private
 * @function project
 * @param {Highcharts.PolygonObject} polygon
 * Array of points in a polygon.
 * @param {Highcharts.PolygonPointObject} target
 * The coordinate of pr
 */
function project(
    this: unknown,
    polygon: WordcloudUtils.PolygonObject,
    target: WordcloudUtils.PolygonPointObject
): RangeSelector.RangeObject {
    const products = polygon.map((point): number => {
        const ax = point[0],
            ay = point[1],
            bx = target[0],
            by = target[1];

        return ax * bx + ay * by;
    });

    return {
        min: Math.min.apply(this, products),
        max: Math.max.apply(this, products)
    };
}

/**
 * @private
 */
function isPolygonsOverlappingOnAxis(
    axis: WordcloudUtils.PolygonPointObject,
    polygon1: WordcloudUtils.PolygonObject,
    polygon2: WordcloudUtils.PolygonObject
): boolean {
    const projection1 = project(polygon1, axis),
        projection2 = project(polygon2, axis),
        isOverlapping = !(
            projection2.min > projection1.max ||
            projection2.max < projection1.min
        );

    return !isOverlapping;
}

/**
 * Checks whether two convex polygons are colliding by using the Separating
 * Axis Theorem.
 *
 * @private
 * @function isPolygonsColliding
 * @param {Highcharts.PolygonObject} polygon1
 *        First polygon.
 *
 * @param {Highcharts.PolygonObject} polygon2
 *        Second polygon.
 *
 * @return {boolean}
 *         Returns true if they are colliding, otherwise false.
 */
function isPolygonsColliding(
    polygon1: WordcloudUtils.PolygonObject,
    polygon2: WordcloudUtils.PolygonObject
): boolean {
    // Get the axis from both polygons.
    const axes1 = getAxesFromPolygon(polygon1),
        axes2 = getAxesFromPolygon(polygon2),
        axes = axes1.concat(axes2),
        overlappingOnAllAxes = !find(
            axes,
            (axis): boolean => isPolygonsOverlappingOnAxis(
                axis,
                polygon1,
                polygon2
            )
        );

    return overlappingOnAllAxes;
}

/**
 * Detects if a word collides with any previously placed words.
 *
 * @private
 * @function intersectsAnyWord
 *
 * @param {Highcharts.Point} point
 * Point which the word is connected to.
 *
 * @param {Array<Highcharts.Point>} points
 * Previously placed points to check against.
 *
 * @return {boolean}
 * Returns true if there is collision.
 */
function intersectsAnyWord(
    point: WordcloudPoint,
    points: Array<WordcloudPoint>
): boolean {
    let intersects = false,
        rect: PolygonBoxObject = point.rect as any,
        polygon: WordcloudUtils.PolygonObject = point.polygon as any,
        lastCollidedWith = point.lastCollidedWith,
        isIntersecting = function (p: WordcloudPoint): boolean {
            let result = isRectanglesIntersecting(rect, p.rect as any);

            if (result &&
                ((point.rotation as any) % 90 || (p.rotation as any) % 90)
            ) {
                result = isPolygonsColliding(
                    polygon,
                    p.polygon as any
                );
            }
            return result;
        };

    // If the point has already intersected a different point, chances are
    // they are still intersecting. So as an enhancement we check this
    // first.
    if (lastCollidedWith) {
        intersects = isIntersecting(lastCollidedWith);
        // If they no longer intersects, remove the cache from the point.
        if (!intersects) {
            delete point.lastCollidedWith;
        }
    }

    // If not already found, then check if we can find a point that is
    // intersecting.
    if (!intersects) {
        intersects = !!find(points, function (
            p: WordcloudPoint
        ): boolean {
            const result = isIntersecting(p);

            if (result) {
                point.lastCollidedWith = p;
            }
            return result;
        });
    }
    return intersects;
}

/**
 * Gives a set of cordinates for an Archimedian Spiral.
 *
 * @private
 * @function archimedeanSpiral
 *
 * @param {number} attempt
 * How far along the spiral we have traversed.
 *
 * @param {Highcharts.WordcloudSpiralParamsObject} [params]
 * Additional parameters.
 *
 * @return {boolean|Highcharts.PositionObject}
 * Resulting coordinates, x and y. False if the word should be dropped from
 * the visualization.
 */
function archimedeanSpiral(
    attempt: number,
    params?: WordcloudSeries.WordcloudSpiralParamsObject
): (boolean|PositionObject) {
    let field: WordcloudSeries.WordcloudFieldObject = (params as any).field,
        result: (boolean|PositionObject) = false,
        maxDelta = (field.width * field.width) + (field.height * field.height),
        t = attempt * 0.8; // 0.2 * 4 = 0.8. Enlarging the spiral.

    // Emergency brake. TODO make spiralling logic more foolproof.
    if (attempt <= 10000) {
        result = {
            x: t * Math.cos(t),
            y: t * Math.sin(t)
        };
        if (!(Math.min(Math.abs(result.x), Math.abs(result.y)) < maxDelta)) {
            result = false;
        }
    }
    return result;
}

/**
 * Gives a set of cordinates for an rectangular spiral.
 *
 * @private
 * @function squareSpiral
 *
 * @param {number} attempt
 * How far along the spiral we have traversed.
 *
 * @param {Highcharts.WordcloudSpiralParamsObject} [params]
 * Additional parameters.
 *
 * @return {boolean|Highcharts.PositionObject}
 * Resulting coordinates, x and y. False if the word should be dropped from
 * the visualization.
 */
function squareSpiral(
    attempt: number,
    params?: WordcloudSeries.WordcloudSpiralParamsObject
): (boolean|PositionObject) {
    let a = attempt * 4,
        k = Math.ceil((Math.sqrt(a) - 1) / 2),
        t = 2 * k + 1,
        m = Math.pow(t, 2),
        isBoolean = function (x: unknown): x is boolean {
            return typeof x === 'boolean';
        },
        result: (boolean|PositionObject) = false;

    t -= 1;
    if (attempt <= 10000) {
        if (isBoolean(result) && a >= m - t) {
            result = {
                x: k - (m - a),
                y: -k
            };
        }
        m -= t;
        if (isBoolean(result) && a >= m - t) {
            result = {
                x: -k,
                y: -k + (m - a)
            };
        }

        m -= t;
        if (isBoolean(result)) {
            if (a >= m - t) {
                result = {
                    x: -k + (m - a),
                    y: k
                };
            } else {
                result = {
                    x: k,
                    y: k - (m - a - t)
                };
            }
        }
        result.x *= 5;
        result.y *= 5;
    }
    return result;
}

/**
 * Gives a set of cordinates for an rectangular spiral.
 *
 * @private
 * @function rectangularSpiral
 *
 * @param {number} attempt
 * How far along the spiral we have traversed.
 *
 * @param {Highcharts.WordcloudSpiralParamsObject} [params]
 * Additional parameters.
 *
 * @return {boolean|Higcharts.PositionObject}
 * Resulting coordinates, x and y. False if the word should be dropped from
 * the visualization.
 */
function rectangularSpiral(
    attempt: number,
    params?: WordcloudSeries.WordcloudSpiralParamsObject
): (boolean|PositionObject) {
    const result: PositionObject = squareSpiral(attempt, params) as any,
        field: WordcloudSeries.WordcloudFieldObject = (params as any).field;

    if (result) {
        result.x *= field.ratioX;
        result.y *= field.ratioY;
    }
    return result;
}

/**
 * @private
 * @function getRandomPosition
 *
 * @param {number} size
 * Random factor.
 *
 * @return {number}
 * Random position.
 */
function getRandomPosition(size: number): number {
    return Math.round((size * (Math.random() + 0.5)) / 2);
}

/**
 * Calculates the proper scale to fit the cloud inside the plotting area.
 *
 * @private
 * @function getScale
 *
 * @param {number} targetWidth
 * Width of target area.
 *
 * @param {number} targetHeight
 * Height of target area.
 *
 * @param {Object} field
 * The playing field.
 *
 * @param {Highcharts.Series} series
 * Series object.
 *
 * @return {number}
 * Returns the value to scale the playing field up to the size of the target
 * area.
 */
function getScale(
    targetWidth: number,
    targetHeight: number,
    field: PolygonBoxObject
): number {
    const height = Math.max(Math.abs(field.top), Math.abs(field.bottom)) * 2,
        width = Math.max(Math.abs(field.left), Math.abs(field.right)) * 2,
        scaleX = width > 0 ? 1 / width * targetWidth : 1,
        scaleY = height > 0 ? 1 / height * targetHeight : 1;

    return Math.min(scaleX, scaleY);
}

/**
 * Calculates what is called the playing field. The field is the area which
 * all the words are allowed to be positioned within. The area is
 * proportioned to match the target aspect ratio.
 *
 * @private
 * @function getPlayingField
 *
 * @param {number} targetWidth
 * Width of the target area.
 *
 * @param {number} targetHeight
 * Height of the target area.
 *
 * @param {Array<Highcharts.Point>} data
 * Array of points.
 *
 * @param {Object} data.dimensions
 * The height and width of the word.
 *
 * @return {Object}
 * The width and height of the playing field.
 */
function getPlayingField(
    targetWidth: number,
    targetHeight: number,
    data: Array<WordcloudPoint>
): WordcloudSeries.WordcloudFieldObject {
    const info: Record<string, number> = data.reduce(function (
            obj: Record<string, number>,
            point: WordcloudPoint
        ): Record<string, number> {
            const dimensions = point.dimensions,
                x = Math.max(dimensions.width, dimensions.height);

            // Find largest height.
            obj.maxHeight = Math.max(obj.maxHeight, dimensions.height);
            // Find largest width.
            obj.maxWidth = Math.max(obj.maxWidth, dimensions.width);
            // Sum up the total maximum area of all the words.
            obj.area += x * x;
            return obj;
        }, {
            maxHeight: 0,
            maxWidth: 0,
            area: 0
        }),
        /**
         * Use largest width, largest height, or root of total area to give
         * size to the playing field.
         */
        x = Math.max(
            info.maxHeight, // Have enough space for the tallest word
            info.maxWidth, // Have enough space for the broadest word
            // Adjust 15% to account for close packing of words
            Math.sqrt(info.area) * 0.85
        ),
        ratioX = targetWidth > targetHeight ? targetWidth / targetHeight : 1,
        ratioY = targetHeight > targetWidth ? targetHeight / targetWidth : 1;

    return {
        width: x * ratioX,
        height: x * ratioY,
        ratioX: ratioX,
        ratioY: ratioY
    } as any;
}


/**
 * Calculates a number of degrees to rotate, based upon a number of
 * orientations within a range from-to.
 *
 * @private
 * @function getRotation
 *
 * @param {number} [orientations]
 * Number of orientations.
 *
 * @param {number} [index]
 * Index of point, used to decide orientation.
 *
 * @param {number} [from]
 * The smallest degree of rotation.
 *
 * @param {number} [to]
 * The largest degree of rotation.
 *
 * @return {boolean|number}
 * Returns the resulting rotation for the word. Returns false if invalid
 * input parameters.
 */
function getRotation(
    orientations?: number,
    index?: number,
    from?: number,
    to?: number
): (boolean|number) {
    let result: (boolean|number) = false, // Default to false
        range: number,
        intervals: number,
        orientation: number;

    // Check if we have valid input parameters.
    if (
        isNumber(orientations) &&
        isNumber(index) &&
        isNumber(from) &&
        isNumber(to) &&
        orientations > 0 &&
        index > -1 &&
        to > from
    ) {
        range = to - from;
        intervals = range / (orientations - 1 || 1);
        orientation = index % orientations;
        result = from + (orientation * intervals);
    }
    return result;
}

/**
 * Calculates the spiral positions and store them in scope for quick access.
 *
 * @private
 * @function getSpiral
 *
 * @param {Function} fn
 * The spiral function.
 *
 * @param {Object} params
 * Additional parameters for the spiral.
 *
 * @return {Function}
 * Function with access to spiral positions.
 */
function getSpiral(
    fn: WordcloudSeries.WordcloudSpiralFunction,
    params: WordcloudSeries.WordcloudSpiralParamsObject
): WordcloudSeries.WordcloudSpiralFunction {
    let length = 10000,
        i: number,
        arr: Array<ReturnType<WordcloudSeries.WordcloudSpiralFunction>> = [];

    for (i = 1; i < length; i++) {
        // @todo unnecessary amount of precaclulation
        arr.push(fn(i, params));
    }

    return function (
        attempt: number
    ): ReturnType<WordcloudSeries.WordcloudSpiralFunction> {
        return attempt <= length ? arr[attempt - 1] : false;
    };
}

/**
 * Detects if a word is placed outside the playing field.
 *
 * @private
 * @function outsidePlayingField
 *
 * @param {Highcharts.PolygonBoxObject} rect
 * The word box.
 *
 * @param {Highcharts.WordcloudFieldObject} field
 * The width and height of the playing field.
 *
 * @return {boolean}
 * Returns true if the word is placed outside the field.
 */
function outsidePlayingField(
    rect: PolygonBoxObject,
    field: WordcloudSeries.WordcloudFieldObject
): boolean {
    const playingField = {
        left: -(field.width / 2),
        right: field.width / 2,
        top: -(field.height / 2),
        bottom: field.height / 2
    };

    return !(
        playingField.left < rect.left &&
        playingField.right > rect.right &&
        playingField.top < rect.top &&
        playingField.bottom > rect.bottom
    );
}

/**
 * @private
 */
function movePolygon(
    deltaX: number,
    deltaY: number,
    polygon: WordcloudUtils.PolygonObject
): WordcloudUtils.PolygonObject {
    return polygon.map(function (
        point: WordcloudUtils.PolygonPointObject
    ): WordcloudUtils.PolygonPointObject {
        return [
            point[0] + deltaX,
            point[1] + deltaY
        ];
    });
}

/**
 * Check if a point intersects with previously placed words, or if it goes
 * outside the field boundaries. If a collision, then try to adjusts the
 * position.
 *
 * @private
 * @function intersectionTesting
 *
 * @param {Highcharts.Point} point
 * Point to test for intersections.
 *
 * @param {Highcharts.WordcloudTestOptionsObject} options
 * Options object.
 *
 * @return {boolean|Highcharts.PositionObject}
 * Returns an object with how much to correct the positions. Returns false
 * if the word should not be placed at all.
 */
function intersectionTesting(
    point: WordcloudPoint,
    options: WordcloudSeries.WordcloudTestOptionsObject
): (boolean|PositionObject) {
    let placed = options.placed,
        field = options.field,
        rectangle = options.rectangle,
        polygon = options.polygon,
        spiral = options.spiral,
        attempt = 1,
        delta: PositionObject = {
            x: 0,
            y: 0
        },
        // Make a copy to update values during intersection testing.
        rect = point.rect = extend<PolygonBoxObject>(
            {} as any,
            rectangle
        );

    point.polygon = polygon;
    point.rotation = options.rotation;

    /* while w intersects any previously placed words:
        do {
        move w a little bit along a spiral path
        } while any part of w is outside the playing field and
                the spiral radius is still smallish */
    while (
        (delta as any) !== false &&
        (
            intersectsAnyWord(point, placed) ||
            outsidePlayingField(rect, field)
        )
    ) {
        delta = spiral(attempt) as any;
        if (isObject(delta)) {
            // Update the DOMRect with new positions.
            rect.left = rectangle.left + delta.x;
            rect.right = rectangle.right + delta.x;
            rect.top = rectangle.top + delta.y;
            rect.bottom = rectangle.bottom + delta.y;
            point.polygon = movePolygon(delta.x, delta.y, polygon);
        }
        attempt++;
    }
    return delta;
}

/**
 * Extends the playing field to have enough space to fit a given word.
 *
 * @private
 * @function extendPlayingField
 *
 * @param {Highcharts.WordcloudFieldObject} field
 * The width, height and ratios of a playing field.
 *
 * @param {Highcharts.PolygonBoxObject} rectangle
 * The bounding box of the word to add space for.
 *
 * @return {Highcharts.WordcloudFieldObject}
 * Returns the extended playing field with updated height and width.
 */
function extendPlayingField(
    field: WordcloudSeries.WordcloudFieldObject,
    rectangle: PolygonBoxObject
): WordcloudSeries.WordcloudFieldObject {
    let height: number,
        width: number,
        ratioX: number,
        ratioY: number,
        x: number,
        extendWidth: number,
        extendHeight: number,
        result: WordcloudSeries.WordcloudFieldObject;

    if (isObject(field) && isObject(rectangle)) {
        height = (rectangle.bottom - rectangle.top);
        width = (rectangle.right - rectangle.left);
        ratioX = field.ratioX;
        ratioY = field.ratioY;

        // Use the same variable to extend both the height and width.
        x = ((width * ratioX) > (height * ratioY)) ? width : height;

        // Multiply variable with ratios to preserve aspect ratio.
        extendWidth = x * ratioX;
        extendHeight = x * ratioY;

        // Calculate the size of the new field after adding
        // space for the word.
        result = merge(field, {
            // Add space on the left and right.
            width: field.width + (extendWidth * 2),
            // Add space on the top and bottom.
            height: field.height + (extendHeight * 2)
        });
    } else {
        result = field;
    }

    // Return the new extended field.
    return result;
}

/**
 * If a rectangle is outside a give field, then the boundaries of the field
 * is adjusted accordingly. Modifies the field object which is passed as the
 * first parameter.
 *
 * @private
 * @function updateFieldBoundaries
 *
 * @param {Highcharts.WordcloudFieldObject} field
 * The bounding box of a playing field.
 *
 * @param {Highcharts.PolygonBoxObject} rectangle
 * The bounding box for a placed point.
 *
 * @return {Highcharts.WordcloudFieldObject}
 * Returns a modified field object.
 */
function updateFieldBoundaries(
    field: WordcloudSeries.WordcloudFieldObject,
    rectangle: PolygonBoxObject
): WordcloudSeries.WordcloudFieldObject {
    // @todo improve type checking.
    if (!isNumber(field.left) || field.left > rectangle.left) {
        field.left = rectangle.left;
    }
    if (!isNumber(field.right) || field.right < rectangle.right) {
        field.right = rectangle.right;
    }
    if (!isNumber(field.top) || field.top > rectangle.top) {
        field.top = rectangle.top;
    }
    if (!isNumber(field.bottom) || field.bottom < rectangle.bottom) {
        field.bottom = rectangle.bottom;
    }
    return field;
}

/**
 * Alternative solution to correctFloat.
 * E.g Highcharts.correctFloat(123, 2) returns 120, when it should be 123.
 *
 * @private
 * @function correctFloat
 */
function correctFloat(number: number, precision?: number): number {
    const p = isNumber(precision) ? precision : 14,
        magnitude = Math.pow(10, p);

    return Math.round(number * magnitude) / magnitude;
}

/**
 * @private
 */
function getBoundingBoxFromPolygon(
    points: WordcloudUtils.PolygonObject
): PolygonBoxObject {
    return points.reduce(function (
        obj: PolygonBoxObject,
        point: WordcloudUtils.PolygonPointObject
    ): PolygonBoxObject {
        const x = point[0],
            y = point[1];

        obj.left = Math.min(x, obj.left);
        obj.right = Math.max(x, obj.right);
        obj.bottom = Math.max(y, obj.bottom);
        obj.top = Math.min(y, obj.top);
        return obj;
    }, {
        left: Number.MAX_VALUE,
        right: -Number.MAX_VALUE,
        bottom: -Number.MAX_VALUE,
        top: Number.MAX_VALUE
    });
}

/**
 * @private
 */
function getPolygon(
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
): WordcloudUtils.PolygonObject {
    const origin: WordcloudUtils.PolygonPointObject = [x, y],
        left = x - (width / 2),
        right = x + (width / 2),
        top = y - (height / 2),
        bottom = y + (height / 2),
        polygon: WordcloudUtils.PolygonObject = [
            [left, top],
            [right, top],
            [right, bottom],
            [left, bottom]
        ];

    return polygon.map(function (
        point: WordcloudUtils.PolygonPointObject
    ): WordcloudUtils.PolygonPointObject {
        return rotate2DToPoint(point, origin, -rotation);
    });
}

/**
 * Rotates a point clockwise around the origin.
 *
 * @private
 * @function rotate2DToOrigin
 * @param {Highcharts.PolygonPointObject} point
 *        The x and y coordinates for the point.
 * @param {number} angle
 *        The angle of rotation.
 * @return {Highcharts.PolygonPointObject}
 *         The x and y coordinate for the rotated point.
 */
function rotate2DToOrigin(
    point: WordcloudUtils.PolygonPointObject,
    angle: number
): WordcloudUtils.PolygonPointObject {
    const x = point[0],
        y = point[1],
        rad = deg2rad * -angle,
        cosAngle = Math.cos(rad),
        sinAngle = Math.sin(rad);

    return [
        correctFloat(x * cosAngle - y * sinAngle),
        correctFloat(x * sinAngle + y * cosAngle)
    ];
}

/**
 * Rotate a point clockwise around another point.
 *
 * @private
 * @function rotate2DToPoint
 * @param {Highcharts.PolygonPointObject} point
 *        The x and y coordinates for the point.
 * @param {Highcharts.PolygonPointObject} origin
 *        The point to rotate around.
 * @param {number} angle
 *        The angle of rotation.
 * @return {Highcharts.PolygonPointObject}
 *         The x and y coordinate for the rotated point.
 */
function rotate2DToPoint(
    point: WordcloudUtils.PolygonPointObject,
    origin: WordcloudUtils.PolygonPointObject,
    angle: number
): WordcloudUtils.PolygonPointObject {
    const x = point[0] - origin[0],
        y = point[1] - origin[1],
        rotated = rotate2DToOrigin([x, y], angle);

    return [
        rotated[0] + origin[0],
        rotated[1] + origin[1]
    ];
}

/* *
 *
 *  Namespace
 *
 * */

namespace WordcloudUtils {

    /* *
     *
     *  Declarations
     *
     * */

    export interface PolygonPointObject extends Array<number> {
        0: number;
        1: number;
    }

    export interface PolygonObject extends Array<PolygonPointObject> {
        axes?: Array<PolygonPointObject>;
    }

}

/* *
 *
 * Default export
 *
 * */

const WordcloudUtils = {
    archimedeanSpiral,
    extendPlayingField,
    getBoundingBoxFromPolygon,
    getPlayingField,
    getPolygon,
    getRandomPosition,
    getRotation,
    getScale,
    getSpiral,
    intersectionTesting,
    isPolygonsColliding,
    isRectanglesIntersecting,
    rectangularSpiral,
    rotate2DToOrigin,
    rotate2DToPoint,
    squareSpiral,
    updateFieldBoundaries
};

export default WordcloudUtils;
