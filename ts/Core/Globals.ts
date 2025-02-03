/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type ButtonThemeObject from './Renderer/SVG/ButtonThemeObject';
import type { HTMLDOMElement } from './Renderer/DOMElementType';
import type GlobalsLike from './GlobalsLike';

/* *
 *
 *  Declarations
 *
 * */

declare global {

    type AnyRecord = Record<string, any>;

    type ArrowFunction = (...args: any) => any;

    type DeepPartial<T> = {
        [K in keyof T]?: (T[K]|DeepPartial<T[K]>);
    };

    type ExtractArrayType<T> = T extends (infer U)[] ? U : never;

    type FunctionNamesOf<T> = keyof FunctionsOf<T>;

    type FunctionsOf<T> = {
        [K in keyof T as T[K] extends Function ? K : never]: T[K];
    };

    interface Array<T> {
        forEach<TScope = any>(
            callbackfn: ArrayForEachCallbackFunction<T, TScope>,
            thisArg?: TScope
        ): void;
    }

    interface ArrayForEachCallbackFunction<T, TScope = any> {
        (this: TScope, value: T, index: number, array: Array<T>): void;
    }

    interface CallableFunction {
        apply<TScope, TArguments extends Array<unknown>, TReturn>(
            this: (this: TScope, ...args: TArguments) => TReturn,
            thisArg: TScope,
            args?: (TArguments|IArguments)
        ): TReturn;
    }

    interface Class<T = any> extends Function {
        new(...args: Array<any>): T;
    }

    interface Document {
        /** @deprecated */
        exitFullscreen: () => Promise<void>;
        /** @deprecated */
        mozCancelFullScreen: Function;
        /** @deprecated */
        msExitFullscreen: Function;
        /** @deprecated */
        msHidden: boolean;
        /** @deprecated */
        webkitExitFullscreen: Function;
        /** @deprecated */
        webkitHidden: boolean;
    }

    interface Element {
        /**
         * @private
         * @requires Core/Renderer/SVG/SVGElement
         */
        gradient?: string;
        /**
         * @private
         * @requires Core/Renderer/SVG/SVGElement
         */
        radialReference?: Array<number>;
        setAttribute(
            qualifiedName: string,
            value: (boolean|number|string)
        ): void;

        /** @deprecated */
        currentStyle?: ElementCSSInlineStyle;
        /** @deprecated */
        mozRequestFullScreen: Function;
        /** @deprecated */
        msMatchesSelector: Element['matches'];
        /** @deprecated */
        msRequestFullscreen: Function;
        /** @deprecated */
        webkitMatchesSelector: Element['matches'];
        /** @deprecated */
        webkitRequestFullScreen: Function;
    }

    interface HTMLElement {
        parentNode: HTMLElement;
    }

    interface Math {
        easeInOutSine(pos: number): number;
    }

    interface SVGElement {
        /**
         * @private
         * @requires Core/Renderer/SVG/SVGElement
         */
        cutHeight?: number;
        parentNode: SVGElement;
    }

    interface TouchList {
        changedTouches: Array<Touch>;
    }

    interface Window {
        chrome?: unknown;
        /** @deprecated */
        opera?: unknown;
        /** @deprecated */
        webkitAudioContext?: typeof AudioContext;
        /** @deprecated */
        webkitURL?: typeof URL;
    }

    interface GlobalOptions {
        buttonTheme: ButtonThemeObject;
        /** @deprecated */
        canvasToolsURL?: string;
        /** @deprecated */
        Date?: Function;
        /** @deprecated */
        getTimezoneOffset?: Function;
        /** @deprecated */
        timezone?: string;
        /** @deprecated */
        timezoneOffset?: number;
        /** @deprecated */
        useUTC?: boolean;
    }

    namespace Intl {

        interface DateTimeFormat {
            formatRange(
                startDate: Date,
                endDate: Date
            ): string;
        }

    }
}

/* *
 *
 *  Namespace
 *
 * */

/**
 * Shared Highcharts properties.
 * @private
 */
namespace Globals {

    /* *
     *
     *  Constants
     *
     * */

    export const SVG_NS = 'http://www.w3.org/2000/svg',
        product = 'Highcharts',
        version = '@product.version@',
        win = (
            typeof window !== 'undefined' ?
                window :
                {}
        ) as (Window&typeof globalThis), // eslint-disable-line node/no-unsupported-features/es-builtins
        doc = win.document as (Document|undefined),
        svg = !!(
            doc?.createElementNS?.(SVG_NS, 'svg') as SVGSVGElement|undefined
        )?.createSVGRect,
        pageLang = (
            doc?.documentElement?.closest('[lang]') as HTMLDOMElement|null
        )?.lang,
        userAgent = win.navigator?.userAgent || '',
        isChrome = win.chrome,
        isFirefox = userAgent.indexOf('Firefox') !== -1,
        isMS = /(edge|msie|trident)/i.test(userAgent) && !win.opera,
        isSafari = !isChrome && userAgent.indexOf('Safari') !== -1,
        isTouchDevice = /(Mobile|Android|Windows Phone)/.test(userAgent),
        isWebKit = userAgent.indexOf('AppleWebKit') !== -1,
        deg2rad = Math.PI * 2 / 360,
        marginNames: GlobalsLike['marginNames'] = [
            'plotTop',
            'marginRight',
            'marginBottom',
            'plotLeft'
        ],
        noop = function (): void {},
        supportsPassiveEvents = (function (): boolean {
            // Checks whether the browser supports passive events, (#11353).
            let supportsPassive = false;

            // Object.defineProperty doesn't work on IE as well as passive
            // events - instead of using polyfill, we can exclude IE totally.
            if (!isMS) {
                const opts = Object.defineProperty({}, 'passive', {
                    get: function (): void {
                        supportsPassive = true;
                    }
                });

                if (win.addEventListener && win.removeEventListener) {
                    win.addEventListener('testPassive', noop, opts);
                    win.removeEventListener('testPassive', noop, opts);
                }
            }

            return supportsPassive;
        }());

    /**
     * An array containing the current chart objects in the page. A chart's
     * position in the array is preserved throughout the page's lifetime. When
     * a chart is destroyed, the array item becomes `undefined`.
     *
     * @name Highcharts.charts
     * @type {Array<Highcharts.Chart|undefined>}
     */
    export const charts: GlobalsLike['charts'] = [];

    /**
     * A shared registry between all bundles to keep track of applied
     * compositions.
     * @private
     */
    export const composed: Array<string> = [];

    /**
     * A hook for defining additional date format specifiers. New
     * specifiers are defined as key-value pairs by using the
     * specifier as key, and a function which takes the timestamp as
     * value. This function returns the formatted portion of the
     * date.
     *
     * Using `dateFormats` is also a convenient way to define new keys for
     * complex locale-aware date formats compatible with the
     * [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
     * browser API, whenever the built-in formats are not sufficient.
     *
     * @sample highcharts/global/dateformats/
     *         Adding support for week number
     * @sample highcharts/global/dateformats-object/
     *         A locale-aware date format using `Intl.DateTimeFormat`
     *
     * @name Highcharts.dateFormats
     * @type {Record<string, Highcharts.TimeFormatCallbackFunction>}
     */
    export const dateFormats: GlobalsLike['dateFormats'] = {};

    /**
     * @private
     * @deprecated
     * @todo Use only `Core/Series/SeriesRegistry.seriesTypes`
     */
    export const seriesTypes = {} as GlobalsLike['seriesTypes'];

    /**
     * @private
     */
    export const symbolSizes: GlobalsLike['symbolSizes'] = {};

    /* *
     *
     *  Properties
     *
     * */

    // eslint-disable-next-line prefer-const
    export let chartCount = 0;

}

/* *
 *
 *  Default Export
 *
 * */

export default Globals as unknown as GlobalsLike;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Theme options that should get applied to the chart. In module mode it
 * might not be possible to change this property because of read-only
 * restrictions, instead use {@link Highcharts.setOptions}.
 *
 * @deprecated
 * @name Highcharts.theme
 * @type {Highcharts.Options}
 */

(''); // Keeps doclets above in JS file
