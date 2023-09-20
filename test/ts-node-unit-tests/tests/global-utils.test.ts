import { ok } from 'assert';
import { describe } from '../test-utils';

export function testGlobalUtilities() {
    describe('Testing global utilities ...');
    const Highcharts = require('../../../code/highcharts.src.js')();
    const keys = [
        'addEvent',
        'arrayMax',
        'arrayMin',
        'attr',
        'correctFloat',
        'createElement',
        'css',
        'defined',
        'destroyObjectProperties',
        'discardElement',
        'erase',
        'error',
        'extend',
        'extendClass',
        'find',
        'fireEvent',
        'format',
        'getMagnitude',
        'getOptions',
        'getStyle',
        'isArray',
        'isClass',
        'isDOMElement',
        'isFunction',
        'isNumber',
        'isObject',
        'isString',
        'keys',
        'merge',
        'normalizeTickInterval',
        'numberFormat',
        'objectEach',
        'offset',
        'pad',
        'pick',
        'pInt',
        'relativeLength',
        'removeEvent',
        'setOptions',
        'splat',
        'stableSort',
        'syncTimeout',
        'timeUnits',
        'uniqueKey',
        'useSerialIds',
        'wrap'
    ]

    keys.forEach(key => {
        const prop = Highcharts[key];
        ok(prop, `The ${key} property is defined on the Highcharts object`);
        if (!['function', 'object'].includes(typeof prop)) {
            throw new Error(`${prop} should be either a function or an object/array`);
        }
    });
}