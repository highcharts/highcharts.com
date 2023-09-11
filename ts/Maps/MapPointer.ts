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

import type Chart from '../Core/Chart/Chart';
import type MapPoint from '../Series/Map/MapPoint';
import type PointerEvent from '../Core/PointerEvent';

import Pointer from '../Core/Pointer.js';
import U from '../Shared/Utilities.js';
import OH from '../Shared/Helpers/ObjectHelper.js';
const { defined, extend } = OH;
const {
    pick,
    wrap
} = U;

declare module '../Core/PointerEvent' {
    interface PointerEvent {
        deltaY?: number;
        /** @deprecated */
        wheelDelta: number;
    }
}

/**
 * Internal types
 * @private
 */
declare global {
    namespace Highcharts {
        interface MapPointer extends Pointer {
            chart: MapPointerChart;
            mapNavigation: MapNavigation;
            onContainerDblClick(e: PointerEvent): void;
            onContainerMouseWheel(e: PointerEvent): void;
        }
        interface MapPointerChart extends Chart {
            hoverPoint: MapPoint;
            mapZoom: MapNavigationChart['mapZoom'];
        }
    }
}

/* eslint-disable no-invalid-this */

const normalize = Pointer.prototype.normalize;
let totalWheelDelta = 0;
let totalWheelDeltaTimer: number;

// Extend the Pointer
extend<Pointer|Highcharts.MapPointer>(Pointer.prototype, {

    // Add lon and lat information to pointer events
    normalize: function <T extends PointerEvent> (
        e: (T|MouseEvent|PointerEvent|TouchEvent),
        chartPosition?: Pointer.ChartPositionObject
    ): T {
        const chart = this.chart;

        e = normalize.call(this, e, chartPosition);

        if (chart && chart.mapView) {
            const lonLat = chart.mapView.pixelsToLonLat({
                x: (e as any).chartX - chart.plotLeft,
                y: (e as any).chartY - chart.plotTop
            });
            if (lonLat) {
                extend(e, lonLat);
            }
        }

        return e as any;

    },

    // The event handler for the doubleclick event
    onContainerDblClick: function (
        this: Highcharts.MapPointer,
        e: PointerEvent
    ): void {
        const chart = this.chart;

        e = this.normalize(e);

        if ((chart.options.mapNavigation as any).enableDoubleClickZoomTo) {
            if (
                chart.pointer.inClass(e.target as any, 'highcharts-tracker') &&
                chart.hoverPoint
            ) {
                chart.hoverPoint.zoomTo();
            }
        } else if (
            chart.isInsidePlot(
                e.chartX - chart.plotLeft,
                e.chartY - chart.plotTop
            )
        ) {
            chart.mapZoom(
                0.5,
                void 0,
                void 0,
                e.chartX,
                e.chartY
            );
        }
    },

    // The event handler for the mouse scroll event
    onContainerMouseWheel: function (
        this: Highcharts.MapPointer,
        e: PointerEvent
    ): void {
        const chart = this.chart;

        e = this.normalize(e);

        // Firefox uses e.deltaY or e.detail, WebKit and IE uses wheelDelta
        // try wheelDelta first #15656
        const delta = (defined(e.wheelDelta) && -(e.wheelDelta as any) / 120) ||
            e.deltaY || e.detail;

        // Wheel zooming on trackpads have different behaviours in Firefox vs
        // WebKit. In Firefox the delta increments in steps by 1, so it is not
        // distinguishable from true mouse wheel. Therefore we use this timer
        // to avoid trackpad zooming going too fast and out of control. In
        // WebKit however, the delta is < 1, so we simply disable animation in
        // the `chart.mapZoom` call below.
        if (Math.abs(delta) >= 1) {
            totalWheelDelta += Math.abs(delta);
            if (totalWheelDeltaTimer) {
                clearTimeout(totalWheelDeltaTimer);
            }
            totalWheelDeltaTimer = setTimeout((): void => {
                totalWheelDelta = 0;
            }, 50);
        }

        if (totalWheelDelta < 10 && chart.isInsidePlot(
            e.chartX - chart.plotLeft,
            e.chartY - chart.plotTop
        ) && chart.mapView) {
            chart.mapView.zoomBy(
                (
                    (chart.options.mapNavigation as any).mouseWheelSensitivity -
                    1
                ) * -delta,
                void 0,
                [e.chartX, e.chartY],
                // Delta less than 1 indicates stepless/trackpad zooming, avoid
                // animation delaying the zoom
                Math.abs(delta) < 1 ? false : void 0
            );
        }
    }
});

// The pinchType is inferred from mapNavigation options.
wrap(Pointer.prototype, 'zoomOption', function (
    this: Pointer,
    proceed: Function
): void {


    const mapNavigation = this.chart.options.mapNavigation;

    // Pinch status
    if (pick(
        (mapNavigation as any).enableTouchZoom,
        (mapNavigation as any).enabled)
    ) {
        this.chart.zooming.pinchType = 'xy';
    }

    proceed.apply(this, [].slice.call(arguments, 1));

});

// Extend the pinchTranslate method to preserve fixed ratio when zooming
wrap(
    Pointer.prototype,
    'pinchTranslate',
    function (
        this: Pointer,
        proceed: Function,
        pinchDown: Array<any>,
        touches: Array<any>,
        transform: any,
        selectionMarker: any,
        clip: any,
        lastValidTouch: any
    ): void {
        let xBigger;

        proceed.call(
            this,
            pinchDown,
            touches,
            transform,
            selectionMarker,
            clip,
            lastValidTouch
        );

        // Keep ratio
        if (this.chart.options.chart.type === 'map' && this.hasZoom) {
            xBigger = transform.scaleX > transform.scaleY;
            this.pinchTranslateDirection(
                !xBigger,
                pinchDown,
                touches,
                transform,
                selectionMarker,
                clip,
                lastValidTouch,
                xBigger ? transform.scaleX : transform.scaleY
            );
        }
    }
);
