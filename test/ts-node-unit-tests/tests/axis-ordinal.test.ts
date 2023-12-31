import { deepStrictEqual, ok, strictEqual } from 'assert';
import { describe, loadHCWithModules } from '../test-utils';
import Highcharts from '../../../ts/masters//highcharts.src';
import OrdinalAxis from '../../../ts/Core/Axis/OrdinalAxis';

export async function testFindIndexOf() {
    describe('findIndexOf');

    const findIndexOf = OrdinalAxis.Additions.findIndexOf;
    const array = [0, 1, 3, 5, 10, 12, 13, 15];

    strictEqual(findIndexOf(array, 3), 2);
    strictEqual(findIndexOf(array, 0), 0);
    strictEqual(findIndexOf(array, 15), array.length - 1);
    strictEqual(findIndexOf(array, 14), -1);
    strictEqual(findIndexOf(array, 18), -1);
    strictEqual(findIndexOf(array, -18), -1);
    strictEqual(findIndexOf(array, 3, true), 2);
    strictEqual(findIndexOf(array, 0, true), 0);
    strictEqual(findIndexOf(array, -10, true), 0);
    strictEqual(findIndexOf(array, 1, true), 1);
    strictEqual(findIndexOf(array, 11, true), 4);
    strictEqual(findIndexOf(array, 18, true), 7);
    strictEqual(findIndexOf(array, 0.1, true), 0);
    strictEqual(findIndexOf(array, 6, true), 3);
}

export async function test() {
    describe('lin2val- unit test for values outside the plotArea.');

    const axis: Record<string, any> = {
        transA: 0.04,
        min: 3.24,
        max: 7,
        len: 500,
        translationSlope: 0.2,
        minPixelPadding: 0,
        ordinal: {
            extendedOrdinalPositions: [0, 0.5, 1.5, 3, 4.2, 4.8, 5, 7, 8, 9],
            positions: [3, 4.2, 4.8, 5, 7],
            slope: 500
        },
        series: [{
            points: [{
                x: 3,
                plotX: -20
            }, {
                x: 4.2,
                plotX: 80 // distance between points 100px
            }]
        }]
    };
    axis.ordinal.axis = axis;

    axis.ordinal.getExtendedPositions = function () {
        return axis.ordinal.extendedOrdinalPositions;
    };

    // On the chart there are 5 points equaly spaced.
    // The distance between them equals 100px.
    // Thare are some points that are out of the current range.
    // The last visible point is located at 380px.
    // EOP = extendedOrdinalPositions

    axis.ordinal.getIndexOfPoint = OrdinalAxis.Additions.prototype.getIndexOfPoint;
    axis.ordinal.findIndexOf = OrdinalAxis.Additions.findIndexOf;
    function lin2val(val) {
        return Highcharts.Axis.prototype.lin2val.call(axis, val);
    }

    strictEqual(
        lin2val(-20 / axis.transA + axis.min),
        3,
        `For the pixel value equal to the first point x position,
        the function should return the value for that point.`
    );
    strictEqual(
        lin2val(80 / axis.transA + axis.min),
        4.2,
        `For the pixel value equal to the second point x position,
        the function should return the value for that point.`
    );
    strictEqual(
        lin2val(30 / axis.transA + axis.min),
        3.6,
        `For the pixel value located between two visible points,
        the function should calculate the value between them.`
    );
    strictEqual(
        lin2val(-50 / axis.transA + axis.min),
        2.55,
        `For the pixel value smaller than the first visible point, the function
        should calculate value between that point and next using EOP array.`
    );
    strictEqual(
        lin2val(-520 / axis.transA + axis.min),
        -520 / axis.transA + axis.min, // #16784
        `For the pixel value lower than any point in EOP array, the function
        should return requested value.`
    );
    strictEqual(
        lin2val(380 / axis.transA + axis.min),
        7,
        `For the pixel value equal to last point,
        the function should return the value for that point.`
    );
    strictEqual(
        lin2val(420 / axis.transA + axis.min),
        7.4,
        `For the pixel value higher than the first visible point, the function
        should calculate value between that point and next using EOP array.`
    );
    strictEqual(
        lin2val(1000 / axis.transA + axis.min),
        1000 / axis.transA + axis.min, // #16784
        `For the pixel value higher than any point in extendedOrdinalPositions,
        array, the function should return requested value.`
    );
}
