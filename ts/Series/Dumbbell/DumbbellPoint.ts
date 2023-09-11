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
import OH from '../../Shared/Helpers/ObjectHelper.js';
const {
    extend
} = OH;
import U from '../../Shared/Utilities.js';
const {
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
    setState(): void {
        let point = this,
            series = point.series,
            chart = series.chart,
            seriesLowColor = series.options.lowColor,
            seriesMarker = series.options.marker,
            pointOptions = point.options,
            pointLowColor = pointOptions.lowColor,
            zoneColor = point.zone && point.zone.color,
            lowerGraphicColor = pick(
                pointLowColor,
                seriesLowColor,
                pointOptions.color,
                zoneColor,
                point.color,
                series.color
            ),
            verb = 'attr',
            upperGraphicColor,
            origProps: Partial<DumbbellPoint>;

        this.pointSetState.apply(this, arguments);

        if (!point.state) {
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
        // #15560
        if (!this.graphic) {
            this.graphic = this.connector;
            this.connector = void 0 as any;
        }
        return super.destroy();
    }
}

/* *
 *
 *  Prototype properties
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
