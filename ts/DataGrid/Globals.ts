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


/* *
 *
 *  Namespace
 *
 * */

/**
 * Global DataGrid namespace.
 *
 * @namespace DataGrid
 */
namespace Globals {

    /* *
     *
     *  Declarations
     *
     * */

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
    /* *
     *
     *  Properties
     *
     * */
    export const classNamePrefix = 'highcharts-datagrid-';
    export const classNames = {
        gridContainer: classNamePrefix + 'container',
        outerContainer: classNamePrefix + 'outer-container',
        scrollContainer: classNamePrefix + 'scroll-container',
        innerContainer: classNamePrefix + 'inner-container',
        cell: classNamePrefix + 'cell',
        cellInput: classNamePrefix + 'cell-input',
        row: classNamePrefix + 'row',
        columnHeader: classNamePrefix + 'column-header'
    };
}

/* *
 *
 *  Default Export
 *
 * */

export default Globals;
