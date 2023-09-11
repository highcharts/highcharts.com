/* *
 *
 *  (c) 2009-2021 Highsoft, Black Label
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

import type Pointer from '../../Core/Pointer';

import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { defined } = OH;
const {
    pick
} = U;

/* *
 *
 *  Constants
 *
 * */

/**
 * Define types for editable fields per annotation. There is no need to define
 * numbers, because they won't change their type to string.
 * @private
 */
const annotationsFieldsTypes: Record<string, string> = {
    backgroundColor: 'string',
    borderColor: 'string',
    borderRadius: 'string',
    color: 'string',
    fill: 'string',
    fontSize: 'string',
    labels: 'string',
    name: 'string',
    stroke: 'string',
    title: 'string'
};

/* *
 *
 *  Functions
 *
 * */

/**
 * Returns the first xAxis or yAxis that was clicked with its value.
 *
 * @private
 *
 * @param {Array<Highcharts.PointerAxisCoordinateObject>} coords
 *        All the chart's x or y axes with a current pointer's axis value.
 *
 * @return {Highcharts.PointerAxisCoordinateObject}
 *         Object with a first found axis and its value that pointer
 *         is currently pointing.
 */
function getAssignedAxis(
    coords: Array<Pointer.AxisCoordinateObject>
): Pointer.AxisCoordinateObject {
    return coords.filter((coord): boolean => {
        const extremes = coord.axis.getExtremes(),
            axisMin = extremes.min,
            axisMax = extremes.max,
            // Correct axis edges when axis has series
            // with pointRange (like column)
            minPointOffset = pick(coord.axis.minPointOffset, 0);

        return isNumber(axisMin) && isNumber(axisMax) &&
            coord.value >= (axisMin - minPointOffset) &&
            coord.value <= (axisMax + minPointOffset) &&
            // don't count navigator axis
            !coord.axis.options.isInternal;
    })[0]; // If the axes overlap, return the first axis that was found.
}

/**
 * Get field type according to value
 *
 * @private
 *
 * @param {'boolean'|'number'|'string'} value
 * Atomic type (one of: string, number, boolean)
 *
 * @return {'checkbox'|'number'|'text'}
 * Field type (one of: text, number, checkbox)
 */
function getFieldType(
    key: (0|string),
    value: ('boolean'|'number'|'string')
): ('checkbox'|'number'|'text') {
    const predefinedType = annotationsFieldsTypes[key];
    let fieldType: string = typeof value;

    if (defined(predefinedType)) {
        fieldType = predefinedType;
    }

    return ({
        'string': 'text',
        'number': 'number',
        'boolean': 'checkbox'
    } as Record<string, ('checkbox'|'number'|'text')>)[
        fieldType
    ];
}

/* *
 *
 *  Default Export
 *
 * */

const NavigationBindingUtilities = {
    annotationsFieldsTypes,
    getAssignedAxis,
    getFieldType
};

export default NavigationBindingUtilities;
