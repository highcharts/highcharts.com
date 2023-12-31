import { ok, strictEqual } from 'assert';
import { describe, setupDOM } from '../test-utils';

export function testGlobalUtilities() {
    describe('Testing global utilities ...');
    const { doc, win } = setupDOM();
    const Highcharts = require('../../../code/highcharts.src.js');
    Highcharts.doc = doc;
    Highcharts.win = win;
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
        'inArray',
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

export function testTime() {
    const { doc, win } = setupDOM();
    const Highcharts = require('../../../code/highcharts.src.js');
    Highcharts.doc = doc;
    Highcharts.win = win;
    const time = new Highcharts.Time();
    strictEqual(
        time.dateFormat('%A, %e %b, %H:%M:%S', Date.UTC(1893, 0, 1, 0, 0, 0, 0)),
        'Sunday,  1 Jan, 00:00:00'
    );
}
