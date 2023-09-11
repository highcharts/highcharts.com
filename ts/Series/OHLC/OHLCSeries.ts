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

import type LineSeriesOptions from '../Line/LineSeriesOptions';
import type OHLCSeriesOptions from './OHLCSeriesOptions';
import type Series from '../../Core/Series/Series';
import type { StatesOptionsKey } from '../../Core/Series/StatesOptions';
import type SVGAttributes from '../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';

import OHLCPoint from './OHLCPoint.js';
import OHLCSeriesDefaults from './OHLCSeriesDefaults.js';
import SeriesRegistry from '../../Core/Series/SeriesRegistry.js';
const {
    seriesTypes: {
        hlc: HLCSeries
    }
} = SeriesRegistry;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { extend, merge } = OH;
const { addEvent } = EH;

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<{}> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * @private
 */
function onSeriesAfterSetOptions(
    this: Series,
    e: { options: LineSeriesOptions }
): void {
    const options = e.options,
        dataGrouping = options.dataGrouping;

    if (
        dataGrouping &&
        options.useOhlcData &&
        options.id !== 'highcharts-navigator-series'
    ) {
        dataGrouping.approximation = 'ohlc';
    }
}

/**
 * Add useOhlcData option
 * @private
 */
function onSeriesInit(
    this: Series,
    eventOptions: { options: OHLCSeriesOptions }
): void {
    // eslint-disable-next-line no-invalid-this
    const series = this,
        options = eventOptions.options;

    if (
        options.useOhlcData &&
        options.id !== 'highcharts-navigator-series'
    ) {
        extend(series, {
            pointValKey: OHLCSeries.prototype.pointValKey,
            // keys: ohlcProto.keys, // @todo potentially nonsense
            pointArrayMap: OHLCSeries.prototype.pointArrayMap,
            toYData: OHLCSeries.prototype.toYData
        });
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * The ohlc series type.
 *
 * @private
 * @class
 * @name Highcharts.seriesTypes.ohlc
 *
 * @augments Highcharts.Series
 */
class OHLCSeries extends HLCSeries {

    /* *
     *
     *  Static Properties
     *
     * */

    public static defaultOptions: OHLCSeriesOptions = merge(
        HLCSeries.defaultOptions,
        OHLCSeriesDefaults
    );

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        SeriesClass: typeof Series,
        ..._args: Array<never>
    ): void {

        if (pushUnique(composedMembers, SeriesClass)) {
            addEvent(SeriesClass, 'afterSetOptions', onSeriesAfterSetOptions);
            addEvent(SeriesClass, 'init', onSeriesInit);
        }

    }

    /* *
     *
     *  Properties
     *
     * */

    public data: Array<OHLCPoint> = void 0 as any;

    public options: OHLCSeriesOptions = void 0 as any;

    public points: Array<OHLCPoint> = void 0 as any;

    /* *
     *
     *  Functions
     *
     * */

    public getPointPath(point: OHLCPoint, graphic: SVGElement): SVGPath {
        const path = super.getPointPath(point, graphic),
            strokeWidth = graphic.strokeWidth(),
            crispCorr = (strokeWidth % 2) / 2,
            crispX = Math.round(point.plotX as any) - crispCorr,
            halfWidth = Math.round((point.shapeArgs as any).width / 2);

        let plotOpen = point.plotOpen;
        // crisp vector coordinates

        if (point.open !== null) {
            plotOpen = Math.round(point.plotOpen) + crispCorr;
            path.push(
                ['M', crispX, plotOpen],
                ['L', crispX - halfWidth, plotOpen]
            );

            super.extendStem(path, strokeWidth / 2, plotOpen);
        }
        return path;
    }

    /**
     * Postprocess mapping between options and SVG attributes
     * @private
     */
    public pointAttribs(
        point: OHLCPoint,
        state: StatesOptionsKey
    ): SVGAttributes {
        const attribs = super.pointAttribs.call(this, point, state),
            options = this.options;

        delete attribs.fill;

        if (
            !point.options.color &&
            options.upColor &&
            point.open < point.close
        ) {
            attribs.stroke = options.upColor;
        }

        return attribs;
    }

    public toYData(point: OHLCPoint): Array<number> {
        // return a plain array for speedy calculation
        return [point.open, point.high, point.low, point.close];
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface OHLCSeries {
    pointClass: typeof OHLCPoint;
    pointAttrToOptions: Record<string, string>;
    toYData(point: OHLCPoint): Array<number>;
}
extend(OHLCSeries.prototype, {
    pointClass: OHLCPoint,
    pointArrayMap: ['open', 'high', 'low', 'close']
});

/* *
 *
 *  Registry
 *
 * */

declare module '../../Core/Series/SeriesType' {
    interface SeriesTypeRegistry {
        ohlc: typeof OHLCSeries;
    }
}
SeriesRegistry.registerSeriesType('ohlc', OHLCSeries);

/* *
 *
 *  Default Export
 *
 * */

export default OHLCSeries;
