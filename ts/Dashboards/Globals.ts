/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *  - Sophie Bremer
 *  - Pawel Lysy
 *  - Karol Kolodziej
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type GUIElement from './Layout/GUIElement';
import type Board from './Board';

/* *
 *
 *  Namespace
 *
 * */

/**
 * Global Dashboards namespace in classic `<scripts>`-based implementations.
 *
 * @namespace Dashboards
 */
namespace Globals {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Any type for objects with mixed property types.
     *
     * **Note:** This is not type safe and should be used only for property
     *           loops.
     */
    export type AnyRecord = Record<string, any>;

    /**
     * Utility type to mark recursively all properties and sub-properties
     * optional.
     */
    export type DeepPartial<T> = {
        [K in keyof T]?: (T[K]|DeepPartial<T[K]>);
    };

    /* *
     *
     *  Constants
     *
     * */

    /**
     * Prefix of a GUIElement HTML class name.
     */
    export const classNamePrefix = 'highcharts-dashboards-';

    /** @internal */
    export const classNames = {
        layout: classNamePrefix + 'layout',
        cell: classNamePrefix + 'cell',
        cellHover: classNamePrefix + 'cell-state-hover',
        cellActive: classNamePrefix + 'cell-state-active',
        cellLoading: classNamePrefix + 'cell-state-loading',
        row: classNamePrefix + 'row',
        layoutsWrapper: classNamePrefix + 'layouts-wrapper',
        boardContainer: classNamePrefix + 'wrapper'
    };

    /** @internal */
    export const guiElementType: Record<string, GUIElement.GUIElementType> = {
        row: 'row',
        cell: 'cell',
        layout: 'layout'
    };

    /** @internal */
    export const responsiveBreakpoints: Record<string, string> = {
        small: 'small',
        medium: 'medium',
        large: 'large'
    };

    /**
     * Contains all Board instances of this window.
     */
    export const boards: Array<Board|undefined> = [];

    /**
     * Reference to the window used by Dashboards.
     */
    export const SVG_NS = 'http://www.w3.org/2000/svg',
        product = 'Highcharts',
        version = '@product.version@',
        win = (
            typeof window !== 'undefined' ?
                window :
                {}
        ) as (Window&typeof globalThis), // eslint-disable-line node/no-unsupported-features/es-builtins
        doc = win.document,
        svg = (
            doc &&
            doc.createElementNS &&
            !!(
                doc.createElementNS(SVG_NS, 'svg') as SVGSVGElement
            ).createSVGRect
        ),
        userAgent = (win.navigator && win.navigator.userAgent) || '',
        isChrome = userAgent.indexOf('Chrome') !== -1,
        isFirefox = userAgent.indexOf('Firefox') !== -1,
        isMS = /(edge|msie|trident)/i.test(userAgent) && !win.opera,
        isSafari = !isChrome && userAgent.indexOf('Safari') !== -1,
        isTouchDevice = /(Mobile|Android|Windows Phone)/.test(userAgent),
        isWebKit = userAgent.indexOf('AppleWebKit') !== -1,
        deg2rad = Math.PI * 2 / 360,
        hasBidiBug = (
            isFirefox &&
            parseInt(userAgent.split('Firefox/')[1], 10) < 4 // issue #38
        ),
        hasTouch = !!win.TouchEvent,
        noop = function (): void {};
}

/* *
 *
 *  Default Export
 *
 * */

export default Globals;
