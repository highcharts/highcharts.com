/* eslint func-style:0, object-curly-spacing: 0 */
(function () {
    var dateFormat = Highcharts.dateFormat,
        extend = Highcharts.extend,
        numberFormat = Highcharts.numberFormat,
        pInt = Highcharts.pInt,
        splat = Highcharts.splat;

    /**
     * Wrapper because of fast migration from earlier system
     */
    function assertEquals(assert, message, actual, expected) {
        assert.equal(expected, actual, message);
    }

    function countMembers(obj) {
        var count = 0;
        for (var member in obj) {
            if (Object.hasOwnProperty.call(obj, member)) {
                count++;
            }
        }

        return count;
    }

    QUnit.test('diffObjects', assert => {

        // eslint-disable-next-line no-underscore-dangle
        const diffObjects = Highcharts._modules[
            'Shared/Helpers/ObjectHelper.js'
        ].diffObjects;

        let result;

        //---
        result = diffObjects({
            type: 'apples'
        }, {
            type: 'oranges'
        });
        assert.deepEqual(
            result,
            { type: 'apples' },
            'New prop should be returned by default'
        );

        //---
        result = diffObjects(
            {
                type: 'apples'
            }, {
                type: 'oranges'
            },
            true
        );
        assert.deepEqual(
            result,
            { type: 'oranges' },
            'Older prop should be returned by option'
        );


        //---
        result = diffObjects({
            type: undefined
        }, {
            type: 'apples'
        });
        assert.deepEqual(
            result,
            { type: undefined },
            'New, undefined properties should be _in_ the result, but ' +
            'undefined (#10525)'
        );

        //---
        result = diffObjects({
            node: document.getElementById('container')
        }, {
        });
        assert.strictEqual(
            result.node.getAttribute('id'),
            document.getElementById('container').getAttribute('id'),
            'DOM nodes should be copied by reference, not deep copied'
        );

        //---
        result = diffObjects({
            chart: {
                style: {
                    fontSize: '8px'
                }
            }
        }, {
            chart: {
                style: {
                    fontSize: '8px'
                }
            }
        });
        assert.deepEqual(
            result,
            {},
            'Equal nested objects should be removed'
        );

    });

    QUnit.test('Extend', function (assert) {
        var empty = {};
        var extra = { key1: 'k1', key2: 'k2' };
        var extra2 = { key3: 'k3', key4: 'k4' };
        var result;

        // test extend of undefined
        result = extend(undefined, extra);
        assertEquals(assert, 'Extended undefined', 2, countMembers(result));

        // test extend of null
        result = extend(null, extra);
        assertEquals(assert, 'Extended null', 2, countMembers(result));

        // test extend of empty
        result = extend(empty, extra);
        assertEquals(assert, 'Extended empty object', 2, countMembers(result));

        // test extend of same object
        result = extend(extra, extra);
        assertEquals(
            assert,
            'Extended object with object',
            2,
            countMembers(result)
        );

        // test extend of another object
        result = extend(extra, extra2);
        assertEquals(
            assert,
            'Extended object with object2',
            4,
            countMembers(result)
        );
    });

    QUnit.test('Merge', assert => {

        // test filtering of __proto__
        const objProto = JSON.parse(`{
            "__proto__": {
                "pollutedByProto": true
            }
        }`);
        Highcharts.merge({}, objProto);
        assert.strictEqual(
            typeof pollutedByProto, // eslint-disable-line no-undef
            'undefined',
            'The prototype (and window) should not be polluted through merge'
        );

        // test filtering of constructor
        const objConstructor = JSON.parse(`{
            "constructor": {
                "prototype": {
                    "pollutedByConstructor": true
                }
            }
        }`);
        Highcharts.merge({}, objConstructor);
        assert.strictEqual(
            typeof {}.pollutedByConstructor, // eslint-disable-line no-undef
            'undefined',
            'The prototype (and window) should not be polluted through merge'
        );

    });

    QUnit.test('PInt', function (assert) {
        // test without a base defined
        assertEquals(assert, 'base not defined', 15, pInt('15'));

        // test with base 10
        assertEquals(assert, 'base 10', 15, pInt('15', 10));

        // test with base 16
        assertEquals(assert, 'base 16', 15, pInt('F', 16));
    });

    /*
    QUnit.test('IsString', function (assert) {
        // test with undefined
        assertEquals(assert, "IsString undefined", false, isString(undefined));

        // test with null
        assertEquals(assert, "IsString null", false, isString(null));

        // test with empty object
        assertEquals(assert, "IsString {}", false, isString({}));

        // test with number
        assertEquals(assert, "IsString number", false, isString(15));

        // test with empty string
        assertEquals(assert, "IsString empty", true, isString(""));

        // test with string
        assertEquals(assert, "IsString string", true,
            isString("this is a string"));
    });
    */

    QUnit.test('IsObject', function (assert) {
        var isObject = Highcharts.isObject;

        // test with undefined
        assert.notOk(isObject(undefined), 'IsObject undefined');

        // test with null, surprise!!
        assert.notOk(isObject(null), 'IsObject null');

        // test with number
        assertEquals(assert, 'IsObject number', false, isObject(15));

        // test with string
        assertEquals(
            assert,
            'IsObject string',
            false,
            isObject('this is a string')
        );

        // test with object
        assertEquals(assert, 'IsObject object', true, isObject({}));

        // test with object and strict
        assertEquals(
            assert,
            'IsObject strict object',
            true,
            isObject({}, true)
        );

        // test with array
        assertEquals(assert, 'IsObject array', true, isObject([]));

        // test with array and strict
        assertEquals(
            assert,
            'IsObject strict array',
            false,
            isObject([], true)
        );
    });

    /*
    QUnit.test('IsArray', function (assert) {
        // test with undefined
        assertEquals(assert, "isArray undefined", false, isArray(undefined));

        // test with null
        assertEquals(assert, "isArray null", false, isArray(null));

        // test with number
        assertEquals(assert, "isArray number", false, isArray(15));

        // test with string
        assertEquals(assert, "isArray string", false,
            isArray("this is a string"));

        // test with object
        assertEquals(assert, "isArray object", false, isArray({}));

        // test with array
        assertEquals(assert, "isArray array", true, isArray([]));

    });
    */
    QUnit.test('Splat', function (assert) {
        // test with undefined
        assertEquals(assert, 'splat undefined', 1, splat(undefined).length);

        // test with null
        assertEquals(assert, 'splat null', 1, splat(null).length);

        // test with false
        assertEquals(assert, 'splat false', 1, splat(false).length);

        // test with 0
        assertEquals(assert, 'splat 0', 1, splat(0).length);

        // test with ""
        assertEquals(assert, 'splat 0', 1, splat('').length);

        // test with object
        assertEquals(assert, 'splat object', 1, splat({}).length);

        // test with array
        assertEquals(assert, 'splat array', 3, splat([1, 2, 3]).length);
    });

    /*
    QUnit.test('StableSort', function (assert) {
        // Initialize the array, it needs to be a certain size to trigger the
        // unstable quicksort algorithm.
        // These 11 items fails in Chrome due to its unstable sort.
        var arr = [
                {a: 1, b: 'F'},
                {a: 2, b: 'H'},
                {a: 1, b: 'G'},
                {a: 0, b: 'A'},
                {a: 0, b: 'B'},
                {a: 3, b: 'J'},
                {a: 0, b: 'C'},
                {a: 0, b: 'D'},
                {a: 0, b: 'E'},
                {a: 2, b: 'I'},
                {a: 3, b: 'K'}
            ],
            result = [];

        // Do the sort
        stableSort(arr, function (a, b) {
            return a.a - b.a;
        });

        // Collect the result
        for (var i = 0; i < arr.length; i++) {
            result.push(arr[i].b);
        }

        assertEquals(assert, 'Stable sort in action', 'ABCDEFGHIJK',
            result.join(''));
        assertUndefined(assert, 'Stable sort index should not be there',
            arr[0].ss_i);
    });
    */

    /**
     * Tests that destroyObjectProperties calls the destroy method on properties
     * before delete.
     * /
    QUnit.test('DestroyObjectProperties', function (assert) {
        var testObject = {}, // Test object with the properties to destroy
            destroyCount = 0; // Number of destroy calls made

        function DummyWithDestroy() {}

        DummyWithDestroy.prototype.destroy = function () {
            destroyCount++;
            return null;
        };

        // Setup three properties with destroy methods
        testObject.rect = new DummyWithDestroy();
        testObject.line = new DummyWithDestroy();
        testObject.label = new DummyWithDestroy();

        // And one without
        testObject.noDestroy = {};

        // Destroy them all
        destroyObjectProperties(testObject);

        assertEquals(assert, 'Number of destroyed elements', 3, destroyCount);
        assertUndefined(assert, 'Property should be undefined',
            testObject.rect);
        assertUndefined(assert, 'Property should be undefined',
            testObject.line);
        assertUndefined(assert, 'Property should be undefined',
            testObject.label);
        assertUndefined(assert, 'Property should be undefined',
            testObject.noDestroy);
    });*/

    /**
     * Test number formatting
     */
    QUnit.test('NumberFormat', function (assert) {
        var i;

        assertEquals(
            assert,
            'Integer with decimals',
            '1.00',
            numberFormat(1, 2)
        );
        assertEquals(
            assert,
            'Integer with decimal point',
            '1,0',
            numberFormat(1, 1, ',')
        );
        assertEquals(
            assert,
            'Integer with thousands sep',
            '1 000',
            numberFormat(1000, null, null, ' ')
        );

        // auto decimals
        assertEquals(assert, 'Auto decimals', '1.234', numberFormat(1.234, -1));
        assertEquals(
            assert,
            'Auto decimals on string',
            '0',
            numberFormat('String', -1)
        );
        assertEquals(
            assert,
            'Auto decimals on integer',
            '10',
            numberFormat(10, -1)
        );
        assertEquals(
            assert,
            'Auto decimals on undefined',
            '0',
            numberFormat(undefined, -1)
        );
        assertEquals(
            assert,
            'Auto decimals on null',
            '0',
            numberFormat(null, -1)
        );

        // issues
        assertEquals(assert, 'Rounding', '29.12', numberFormat(29.115, 2));
        assertEquals(assert, 'Rounding', '29.1150', numberFormat(29.115, 4));
        assertEquals(
            assert,
            'Rounding negative (#4573)',
            '-342 000.00',
            numberFormat(-342000, 2)
        );
        assertEquals(
            assert,
            'String decimal count',
            '2 016',
            numberFormat(2016, '0')
        );
        assertEquals(assert, 'Rounding', '2.0', numberFormat(1.96, 1));
        assertEquals(assert, 'Rounding', '1.00', numberFormat(0.995, 2));
        assertEquals(assert, 'Rounding', '-1.00', numberFormat(-0.995, 2));

        assertEquals(
            assert,
            'Exponential',
            '3.00e+22',
            numberFormat(30000000000000000000000)
        );
        assertEquals(
            assert,
            'Exponential',
            '3.20e+22',
            numberFormat(32000000000000000000000)
        );
        assertEquals(
            assert,
            'Exponential',
            '3,20e+22',
            numberFormat(32000000000000000000000, 2, ',')
        );
        assertEquals(
            assert,
            'Exponential',
            '3e+22',
            numberFormat(30000000000000000000000, 0)
        );
        assertEquals(
            assert,
            'Exponential',
            '1.5e+36',
            numberFormat(1.5e36, -1)
        );

        assertEquals(
            assert,
            'Decimals limit with exponential (#7042)',
            '0.00',
            numberFormat(1.5e-9, 2)
        );

        // small numbers with set decimals (#7405)
        for (i = 7; i < 11; i++) {
            assertEquals(
                assert,
                'Decimals = ' + i + ' - precision to ' + i + 'th digit after .',
                ['0.0000000', '0.00000000', '2e-9', '1.9e-9'][i - 7],
                numberFormat(1.9e-9, i)
            );
        }

        for (i = 6; i < 10; i++) {
            assertEquals(
                assert,
                'Decimals = ' + i + ' - precision to ' + i + 'th digit after .',
                ['0.000001', '6e-7', '6.3e-7', '6.26e-7'][i - 6],
                numberFormat(6.26e-7, i)
            );
        }
        assert.strictEqual(
            '0',
            Highcharts.numberFormat(4.9e-7, 0),
            'For small numbers and when decimals argument declared as zero, ' +
            'the formatter should return zero, #14023.'
        );
    });

    /**
     * Test date formatting
     */
    QUnit.test('DateFormat', function (assert) {
        // Issue #953
        assertEquals(
            assert,
            'Two occurences of a pattern',
            '2012-01-01, 00:00 - 00:59',
            dateFormat('%Y-%m-%d, %H:00 - %H:59', Date.UTC(2012, 0, 1, 0, 0, 0))
        );

        assertEquals(
            assert,
            'Hours in 24 hours format',
            '5:55',
            dateFormat('%k:%M', Date.UTC(2015, 0, 1, 5, 55, 0))
        );

        // Issue #5060
        assertEquals(
            assert,
            'Issue #5060, %e padding',
            'Jan,  1',
            dateFormat('%b, %e', Date.UTC(2015, 0, 1))
        );

        // Issue #5302
        assertEquals(
            assert,
            'Issue #5302, Date argument',
            '2016-05-07',
            dateFormat(
                '%Y-%m-%d',
                new Date(
                    'Sat May 07 2016 20:45:00 GMT+0200 (W. Europe Daylight Time)'
                )
            )
        );

        // Issue #8150
        assertEquals(
            assert,
            'Issue #8150, month without leading zero',
            '10/4 2018',
            dateFormat('%e/%o %Y', Date.UTC(2018, 3, 10))
        );
    });

    QUnit.test('isDOMElement', function (assert) {
        var isDOMElement = Highcharts.isDOMElement,
            // Mock an ES6 class
            classes = {
                constructor: function TestClass() {}
            };

        assert.strictEqual(
            isDOMElement('a'),
            false,
            'String is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(1),
            false,
            'Number is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(true),
            false,
            'Boolean is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(null),
            false,
            'null is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(undefined),
            false,
            'undefined is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement([1]),
            false,
            'Array is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement({ a: 1 }),
            false,
            'Object is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(classes),
            false,
            'Object classes is not a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(document.createElement('div')),
            true,
            'HTMLElement is a HTML Element'
        );
        assert.strictEqual(
            isDOMElement(function Test() {}),
            false,
            'Function is not a HTML Element'
        );
    });

    QUnit.test('isClass', function (assert) {
        var isClass = Highcharts.isClass,
            // Mock an ES6 class
            classes = {
                constructor: function TestClass() {}
            };

        assert.strictEqual(isClass('a'), false, 'String is not a class');
        assert.strictEqual(isClass(1), false, 'Number is not a class');
        assert.strictEqual(isClass(true), false, 'Boolean is not a class');
        assert.strictEqual(isClass(null), false, 'null is not a class');
        assert.strictEqual(
            isClass(undefined),
            false,
            'undefined is not a class'
        );
        assert.strictEqual(isClass([1]), false, 'Array is not a class');
        assert.strictEqual(isClass({ a: 1 }), false, 'Object is not a class');

        if (function myFunc() {}.name === 'myFunc') {
            // IE11 doesn't support function name
            assert.strictEqual(
                isClass(classes),
                true,
                'Object classes is a class'
            );
        }
        // Some legacy browsers do not have named functions
        classes.constructor = function () {};
        assert.strictEqual(
            isClass(classes),
            false,
            'Object with unnamed constructor is not a class'
        );
        assert.strictEqual(
            isClass(document.createElement('div')),
            false,
            'HTMLElement is not a class'
        );
        assert.strictEqual(
            isClass(function Test() {}),
            false,
            'Function is not a class'
        );
    });

    QUnit.test('isNumber', function (assert) {
        var isNumber = Highcharts.isNumber;
        assert.strictEqual(isNumber(NaN), false, 'NaN returns false');
        assert.strictEqual(
            isNumber(undefined),
            false,
            'undefined returns false'
        );
        assert.strictEqual(isNumber(null), false, 'null returns false');
        assert.strictEqual(isNumber({}), false, 'object returns false');
        assert.strictEqual(
            isNumber('0'),
            false,
            'single quoted number (\'0\') returns false'
        );
        assert.strictEqual(
            isNumber('0'),
            false,
            'double quoted number ("0") returns false'
        );
        assert.strictEqual(
            isNumber([1]),
            false,
            'array with number [1] returns false'
        );
        assert.strictEqual(isNumber(0), true, '0 returns true');
        assert.strictEqual(
            isNumber(0.12),
            true,
            'number with decimals (0.12) returns true'
        );
        assert.strictEqual(
            isNumber(0.12),
            true,
            'number with only decimals (.12) returns true'
        );
        assert.strictEqual(
            isNumber(-1),
            true,
            'negative number (-1) returns true'
        );
        assert.strictEqual(
            isNumber(-1.123),
            true,
            'negative number with decimals (-1.123) returns true'
        );
        assert.strictEqual(
            isNumber(Infinity),
            false,
            'Infinity is not a finite number'
        );
        assert.strictEqual(
            isNumber(-Infinity),
            false,
            '-Infinity is not a finite number'
        );
    });

    QUnit.test('wrap', function (assert) {
        var Person = function (name) {
            this.name = name;
        };
        Person.prototype.setName = function (name) {
            this.name = name;
        };

        var person = new Person('Torstein');
        assert.strictEqual(person.name, 'Torstein', 'Initial value');

        person.setName('Torstein Honsi');
        assert.strictEqual(person.name, 'Torstein Honsi', 'Initial value');

        Highcharts.wrap(Person.prototype, 'setName', function (proceed) {
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            this.name += ' Extended';
        });
        person.setName('Torstein');

        assert.strictEqual(person.name, 'Torstein Extended', 'Wrapped');

        Person.prototype.setAge = function (age) {
            this.age = age;
        };
        person.setAge(42);
        assert.strictEqual(person.age, 42, 'Initial age');

        Highcharts.wrap(Person.prototype, 'setAge', function (proceed) {
            proceed();
            this.age += 1;
        });
        person.setAge(43);
        assert.strictEqual(person.age, 44, 'Wrapped age');

        Person.prototype.setHeight = function (height) {
            this.height = height;
        };
        person.setHeight(188);
        assert.strictEqual(person.height, 188, 'Initial height');

        Highcharts.wrap(
            Person.prototype,
            'setHeight',
            function (proceed, height) {
                proceed(height + 1);
            }
        );
        person.setHeight(189);
        assert.strictEqual(person.height, 190, 'Wrapped height');
    });

    QUnit.test('find', function (assert) {
        assert.strictEqual(
            Highcharts.find([1, 2, 3, 4, 5], function (item) {
                return item >= 3;
            }),
            3,
            'Returns first item'
        );

        assert.deepEqual(
            Highcharts.find([1, 2, { id: 'findMe' }, 4, 5], function (item) {
                return item && item.id === 'findMe';
            }),
            { id: 'findMe' },
            'Returns first item'
        );
    });

    QUnit.test('objectEach', function (assert) {
        var objectEach = Highcharts.objectEach,
            obj1 = {
                1: 1,
                2: '2',
                3: '3'
            },
            obj1Expected = {
                1: 1,
                2: '2',
                3: '3'
            },
            obj1Actual = {},
            testFunction = function () {
                return 2;
            },
            TestObj = function () {
                this.one = 1;
                this.two = testFunction;
            },
            obj2,
            obj2Expected = {
                one: 1,
                two: testFunction
            },
            obj2Actual = {},
            arr1 = ['1', '2', '3'],
            arr1Expected = {
                0: '1',
                1: '2',
                2: '3'
            },
            arr1Actual = {},
            obj3 = {
                one: 'one'
            },
            obj3This = {
                ctx: 'ctx'
            };

        TestObj.prototype.three = 3;
        TestObj.prototype.four = function () {
            return 4;
        };
        obj2 = new TestObj();

        objectEach(obj1, function (val, key) {
            obj1Actual[key] = val;
        });

        assert.deepEqual(
            obj1Actual,
            obj1Expected,
            'Order of callback params is [val, key]'
        );

        objectEach(obj2, function (val, key) {
            obj2Actual[key] = val;
        });

        assert.deepEqual(
            obj2Actual,
            obj2Expected,
            'Prototype properties are not included'
        );

        objectEach(arr1, function (val, key) {
            arr1Actual[key] = val;
        });

        assert.deepEqual(arr1Actual, arr1Expected, 'Supports arrays');

        objectEach(
            obj3,
            function (val, key, ctx) {
                assert.equal(
                    this,
                    obj3This,
                    '3rd param injects context to use with `this`'
                );

                assert.equal(
                    ctx,
                    obj3,
                    '3rd param in callback is the object being iterated over'
                );
            },
            obj3This
        );
    });

    QUnit.test('pad', function (assert) {
        assert.strictEqual(
            Highcharts.pad(-1000, 3),
            '-1000',
            'The same number, no error (#5308)'
        );
    });

    QUnit.test('getStyle', function (assert) {
        var div = document.createElement('div');
        document.body.appendChild(div);
        div.style.padding = '10px';
        div.style.display = 'none';

        assert.strictEqual(
            Highcharts.getStyle(div, 'width'),
            0,
            'Width should not be negative (#8377)'
        );

        document.body.removeChild(div);
    });

    QUnit.test('reduce', function (assert) {
        var reduce = Highcharts.reduce,
            arr = [0, 1, 2, 3],
            accumulations = [],
            values = [],
            result;

        // Call reduce without an initialValue.
        result = reduce(arr, function (accumulation, value) {
            accumulations.push(accumulation);
            values.push(value);
            return accumulation + value;
        });

        assert.strictEqual(
            result,
            6,
            'No initialValue - should return sum of values in array.'
        );

        assert.deepEqual(
            accumulations,
            [0, 1, 3],
            'No initialValue - should use first value as initialValue.'
        );

        assert.deepEqual(
            values,
            [1, 2, 3],
            'No initialValue - should iterate from second value in array.'
        );

        // Empty arrays before next test.
        accumulations = [];
        values = [];

        // Call reduce with an initialValue.
        result = reduce(
            arr,
            function (accumulation, value) {
                accumulations.push(accumulation);
                values.push(value);
                return accumulation + value;
            },
            1
        );

        assert.strictEqual(
            result,
            7,
            'initialValue = 1 - should return sum of values in array plus intialValue.'
        );

        assert.deepEqual(
            accumulations,
            [1, 1, 2, 4],
            'initialValue = 1 - should use initialValue.'
        );

        assert.deepEqual(
            values,
            [0, 1, 2, 3],
            'initialValue = 1 - should iterate from first value in array.'
        );
    });

    QUnit.test('keys', assert => {
        assert.deepEqual(
            Highcharts.keys({ foo: 'bar' }),
            Object.keys({ foo: 'bar' })
        );
    });
}());
