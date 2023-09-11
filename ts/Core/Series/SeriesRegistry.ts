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

import type Series from './Series.js';
import type { SeriesTypeRegistry } from './SeriesType';

import H from '../Globals.js';
import D from '../Defaults.js';
const { defaultOptions } = D;
import Point from './Point.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    extendClass
} = U;

/* *
 *
 *  Namespace
 *
 * */

namespace SeriesRegistry {

    /* *
     *
     *  Properties
     *
     * */

    /** @internal */
    export let series: typeof Series;

    /**
     * @internal
     * @todo Move `Globals.seriesTypes` code to her.
     */
    export const seriesTypes = H.seriesTypes;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Registers class pattern of a series.
     *
     * @private
     */
    export function registerSeriesType(
        seriesType: string,
        SeriesClass: typeof Series
    ): void {
        const defaultPlotOptions = defaultOptions.plotOptions || {},
            seriesOptions = SeriesClass.defaultOptions,
            seriesProto = SeriesClass.prototype;

        seriesProto.type = seriesType;

        if (!seriesProto.pointClass) {
            seriesProto.pointClass = Point;
        }

        if (seriesOptions) {
            defaultPlotOptions[seriesType] = seriesOptions;
        }

        seriesTypes[seriesType] = SeriesClass;
    }

    /**
     * Old factory to create new series prototypes.
     *
     * @deprecated
     * @function Highcharts.seriesType
     *
     * @param {string} type
     * The series type name.
     *
     * @param {string} parent
     * The parent series type name. Use `line` to inherit from the basic
     * {@link Series} object.
     *
     * @param {Highcharts.SeriesOptionsType|Highcharts.Dictionary<*>} options
     * The additional default options that are merged with the parent's options.
     *
     * @param {Highcharts.Dictionary<*>} [props]
     * The properties (functions and primitives) to set on the new prototype.
     *
     * @param {Highcharts.Dictionary<*>} [pointProps]
     * Members for a series-specific extension of the {@link Point} prototype if
     * needed.
     *
     * @return {Highcharts.Series}
     * The newly created prototype as extended from {@link Series} or its
     * derivatives.
     */
    export function seriesType<T extends typeof Series>(
        type: keyof SeriesTypeRegistry,
        parent: (keyof SeriesTypeRegistry|undefined),
        options: T['prototype']['options'],
        seriesProto?: DeepPartial<T['prototype']>,
        pointProto?: DeepPartial<T['prototype']['pointClass']['prototype']>
    ): T {
        const defaultPlotOptions = defaultOptions.plotOptions || {};

        parent = parent || '';

        // Merge the options
        defaultPlotOptions[type] = merge(
            defaultPlotOptions[parent],
            options
        );

        // Create the class
        registerSeriesType(type, extendClass(
            seriesTypes[parent] as any || function (): void {},
            seriesProto
        ) as any);
        seriesTypes[type].prototype.type = type;

        // Create the point class if needed
        if (pointProto) {
            seriesTypes[type].prototype.pointClass = extendClass(
                Point,
                pointProto
            ) as any;
        }

        return seriesTypes[type] as unknown as T;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default SeriesRegistry;
