/* *
 *
 *  (c) 2010-2021 Sebastian Bochan, Rafal Sebestjanski
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

import type DumbbellSeries from './DumbbellSeries.js';
import type DumbbellPointOptions from './DumbbellPointOptions';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import AreaRangePoint from '../AreaRange/AreaRangePoint.js';
import U from '../../Core/Utilities.js';
const {
    extend,
    pick
} = U;

/* *
 *
 *  Class
 *
 * */

class DumbbellPoint extends AreaRangePoint {

    /* *
     *
     *  Properties
     *
     * */

    public series: DumbbellSeries = void 0 as any;
    public options: DumbbellPointOptions = void 0 as any;
    public connector?: SVGElement;
    public pointWidth: number = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Set the point's state extended by have influence on the connector
     * (between low and high value).
     *
     * @private
     * @param {Highcharts.Point} this The point to inspect.
     *
     */
    public setState(): void {
        const point = this,
            series = point.series,
            chart = series.chart,
            seriesLowColor = series.options.lowColor,
            seriesMarker = series.options.marker,
            seriesLowMarker = series.options.lowMarker,
            pointOptions = point.options,
            pointLowColor = pointOptions.lowColor,
            zoneColor = point.zone && point.zone.color,
            lowerGraphicColor = pick(
                pointLowColor,
                seriesLowMarker?.fillColor,
                seriesLowColor,
                pointOptions.color,
                zoneColor,
                point.color,
                series.color
            );
        let verb = 'attr',
            upperGraphicColor,
            origProps: Partial<DumbbellPoint>;

        this.pointSetState.apply(point, arguments);

        if (point.state === 'normal') {
            verb = 'animate';
            const [lowerGraphic, upperGraphic] = point.graphics || [];
            if (lowerGraphic && !chart.styledMode) {
                lowerGraphic.attr({
                    fill: lowerGraphicColor
                });
                if (upperGraphic) {
                    origProps = {
                        y: point.y,
                        zone: point.zone
                    };
                    point.y = point.high;
                    point.zone = point.zone ? point.getZone() : void 0;
                    upperGraphicColor = pick(
                        point.marker ? point.marker.fillColor : void 0,
                        seriesMarker ? seriesMarker.fillColor : void 0,
                        pointOptions.color,
                        point.zone ? point.zone.color : void 0,
                        point.color
                    );
                    upperGraphic.attr({
                        fill: upperGraphicColor
                    });
                    extend(point, origProps);
                }
            }
        }

        point.connector?.[verb](series.getConnectorAttribs(point));
    }

    public destroy(): void {
        const point = this;

        // #15560
        if (!point.graphic) {
            point.graphic = point.connector;
            point.connector = void 0 as any;
        }
        return super.destroy();
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface DumbbellPoint{
    pointSetState: typeof AreaRangePoint.prototype.setState;
}

extend(DumbbellPoint.prototype, {
    pointSetState: AreaRangePoint.prototype.setState
});

/* *
 *
 *  Default export
 *
 * */

export default DumbbellPoint;
