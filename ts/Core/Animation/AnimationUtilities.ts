/* *
 *
 *  (c) 2010-2021 Torstein Honsi
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

import type AnimationOptions from './AnimationOptions';
import type Chart from '../Chart/Chart';
import type CSSObject from '../Renderer/CSSObject';
import type { HTMLDOMElement } from '../Renderer/DOMElementType';
import type Series from '../Series/Series';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';
import type SVGElement from '../Renderer/SVG/SVGElement';

import Fx from './Fx.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isArray, isNumber, isObject } = TC;
const {
    merge,
    defined,
    objectEach
} = OH;
const {
    getStyle,
    pick
} = U;

/* *
 *
 *  Functions
 *
 * */

/**
 * Set the global animation to either a given value, or fall back to the given
 * chart's animation option.
 *
 * @function Highcharts.setAnimation
 *
 * @param {boolean|Partial<Highcharts.AnimationOptionsObject>|undefined} animation
 *        The animation object.
 *
 * @param {Highcharts.Chart} chart
 *        The chart instance.
 *
 * @todo
 * This function always relates to a chart, and sets a property on the renderer,
 * so it should be moved to the SVGRenderer.
 */
function setAnimation(
    animation: (boolean|Partial<AnimationOptions>|undefined),
    chart: Chart
): void {
    chart.renderer.globalAnimation = pick(
        animation,
        chart.options.chart.animation,
        true
    );
}

/**
 * Get the animation in object form, where a disabled animation is always
 * returned as `{ duration: 0 }`.
 *
 * @function Highcharts.animObject
 *
 * @param {boolean|Highcharts.AnimationOptionsObject} [animation=0]
 *        An animation setting. Can be an object with duration, complete and
 *        easing properties, or a boolean to enable or disable.
 *
 * @return {Highcharts.AnimationOptionsObject}
 *         An object with at least a duration property.
 */
function animObject(
    animation?: (boolean|DeepPartial<AnimationOptions>)
): AnimationOptions {
    return isObject(animation) ?
        merge(
            { duration: 500, defer: 0 },
            animation as AnimationOptions
        ) as any :
        { duration: animation as boolean ? 500 : 0, defer: 0 };
}

/**
 * Get the defer as a number value from series animation options.
 *
 * @function Highcharts.getDeferredAnimation
 *
 * @param {Highcharts.Chart} chart
 *        The chart instance.
 *
 * @param {boolean|Highcharts.AnimationOptionsObject} animation
 *        An animation setting. Can be an object with duration, complete and
 *        easing properties, or a boolean to enable or disable.
 *
 * @param {Highcharts.Series} [series]
 *        Series to defer animation.
 *
 * @return {number}
 *        The numeric value.
 */
function getDeferredAnimation(
    chart: Chart,
    animation: (false|Partial<AnimationOptions>),
    series?: Series
): Partial<AnimationOptions> {
    const labelAnimation = animObject(animation),
        s = series ? [series] : chart.series;
    let defer = 0,
        duration = 0;

    s.forEach((series): void => {
        const seriesAnim = animObject(series.options.animation);

        defer = animation && defined(animation.defer) ?
            labelAnimation.defer :
            Math.max(
                defer,
                seriesAnim.duration + seriesAnim.defer
            );
        duration = Math.min(labelAnimation.duration, seriesAnim.duration);
    });
    // Disable defer for exporting
    if (chart.renderer.forExport) {
        defer = 0;
    }

    const anim = {
        defer: Math.max(0, defer - duration),
        duration: Math.min(defer, duration)
    };

    return anim;
}

/**
 * The global animate method, which uses Fx to create individual animators.
 *
 * @function Highcharts.animate
 *
 * @param {Highcharts.HTMLDOMElement|Highcharts.SVGElement} el
 *        The element to animate.
 *
 * @param {Highcharts.CSSObject|Highcharts.SVGAttributes} params
 *        An object containing key-value pairs of the properties to animate.
 *        Supports numeric as pixel-based CSS properties for HTML objects and
 *        attributes for SVGElements.
 *
 * @param {Partial<Highcharts.AnimationOptionsObject>} [opt]
 *        Animation options.
 *
 * @return {void}
 */
function animate(
    el: (HTMLDOMElement|SVGElement),
    params: (CSSObject|SVGAttributes),
    opt?: boolean|Partial<AnimationOptions>
): void {
    let start,
        unit = '',
        end,
        fx,
        args;

    if (!isObject(opt)) { // Number or undefined/null
        args = arguments;
        opt = {
            duration: args[2],
            easing: args[3],
            complete: args[4]
        };
    }
    if (!isNumber(opt.duration)) {
        opt.duration = 400;
    }
    opt.easing = typeof opt.easing === 'function' ?
        opt.easing :
        (Math[opt.easing as keyof Math] || Math.easeInOutSine) as any;
    opt.curAnim = merge(params) as any;

    objectEach(params, function (val, prop): void {
        // Stop current running animation of this property
        stop(el as any, prop);

        fx = new Fx(el as any, opt as any, prop);
        end = void 0;

        if ((prop as any) === 'd' && isArray((params as any).d)) {
            fx.paths = fx.initPath(
                el as any,
                (el as any).pathArray,
                (params as any).d
            );
            fx.toD = (params as any).d;
            start = 0;
            end = 1;
        } else if ((el as any).attr) {
            start = (el as any).attr(prop);
        } else {
            start = parseFloat(getStyle(el as any, prop) as any) || 0;
            if (prop !== 'opacity') {
                unit = 'px';
            }
        }

        if (!end) {
            end = val;
        }
        if (typeof end === 'string' && end.match('px')) {
            end = end.replace(/px/g, ''); // #4351
        }
        fx.run(start as any, end as any, unit);
    });
}

/**
 * Stop running animation.
 *
 * @function Highcharts.stop
 *
 * @param {Highcharts.SVGElement} el
 *        The SVGElement to stop animation on.
 *
 * @param {string} [prop]
 *        The property to stop animating. If given, the stop method will stop a
 *        single property from animating, while others continue.
 *
 * @return {void}
 *
 * @todo
 * A possible extension to this would be to stop a single property, when
 * we want to continue animating others. Then assign the prop to the timer
 * in the Fx.run method, and check for the prop here. This would be an
 * improvement in all cases where we stop the animation from .attr. Instead of
 * stopping everything, we can just stop the actual attributes we're setting.
 */
function stop(el: SVGElement, prop?: string): void {
    let i = Fx.timers.length;

    // Remove timers related to this element (#4519)
    while (i--) {
        if (Fx.timers[i].elem === el && (!prop || prop === Fx.timers[i].prop)) {
            Fx.timers[i].stopped = true; // #4667
        }
    }
}

const animationExports = {
    animate,
    animObject,
    getDeferredAnimation,
    setAnimation,
    stop
};

/* *
 *
 *  Default Export
 *
 * */

export default animationExports;
