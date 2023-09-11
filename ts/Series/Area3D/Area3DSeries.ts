/* *
 *
 *  (c) 2010-2021 Grzegorz Blachliński
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import type AreaSeries from '../Area/AreaSeries';
import type AreaPoint from '../Area/AreaPoint';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import Math3D from '../../Core/Math3D.js';
const { perspective } = Math3D;
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        line: {
            prototype: lineProto
        }
    }
} = SeriesRegistry;
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
import U from '../../Shared/Utilities.js';
const {
    wrap
} = U;

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

function compose(
    AreaSeriesClass: typeof AreaSeries
): void {

    if (pushUnique(composedMembers, AreaSeriesClass)) {
        wrap(
            AreaSeriesClass.prototype,
            'getGraphPath',
            wrapAreaSeriesGetGraphPath
        );
    }

}

function wrapAreaSeriesGetGraphPath(
    this: AreaSeries,
    proceed: Function
): SVGPath {

    const series = this,
        svgPath = proceed.apply(series, [].slice.call(arguments, 1));

    // Do not do this if the chart is not 3D
    if (!series.chart.is3d()) {
        return svgPath;
    }

    const getGraphPath = lineProto.getGraphPath,
        options = series.options,
        translatedThreshold = Math.round( // #10909
            series.yAxis.getThreshold(options.threshold as any)
        );

    let bottomPoints: Array<AreaPoint> = [];

    if (series.rawPointsX) {
        for (let i = 0; i < series.points.length; i++) {
            bottomPoints.push({
                x: series.rawPointsX[i],
                y: options.stacking ?
                    series.points[i].yBottom : translatedThreshold,
                z: series.zPadding
            } as any);
        }
    }

    const options3d = series.chart.options.chart.options3d;
    bottomPoints = perspective(
        bottomPoints as any, series.chart, true
    ).map((point): AreaPoint => (
        { plotX: point.x, plotY: point.y, plotZ: point.z } as any
    ));
    if (series.group && options3d && options3d.depth && options3d.beta) {
        // Markers should take the global zIndex of series group.
        if (series.markerGroup) {
            series.markerGroup.add(series.group);
            series.markerGroup.attr({
                translateX: 0,
                translateY: 0
            });
        }
        series.group.attr({
            zIndex: Math.max(
                1,
                (options3d.beta > 270 || options3d.beta < 90) ?
                    options3d.depth - Math.round(series.zPadding || 0) :
                    Math.round(series.zPadding || 0)
            )
        });
    }

    (bottomPoints as any).reversed = true;
    const bottomPath = getGraphPath.call(series, bottomPoints, true, true);

    if (bottomPath[0] && bottomPath[0][0] === 'M') {
        bottomPath[0] = ['L', bottomPath[0][1], bottomPath[0][2]];
    }

    if (series.areaPath) {
        // Remove previously used bottomPath and add the new one.
        const areaPath: SVGPath = series.areaPath.splice(
            0,
            series.areaPath.length / 2
        ).concat(bottomPath);
        // Use old xMap in the new areaPath
        areaPath.xMap = series.areaPath.xMap;
        series.areaPath = areaPath;
    }

    return svgPath;
}

/* *
 *
 *  Default Export
 *
 * */

const Area3DSeries = {
    compose
};

export default Area3DSeries;
