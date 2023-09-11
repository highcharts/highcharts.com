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

import type Axis from '../Axis';
import type PlotBandOptions from './PlotBandOptions';
import type PlotLineOptions from './PlotLineOptions';
import type PlotLineOrBand from './PlotLineOrBand';
import type SVGPath from '../../Renderer/SVG/SVGPath';

import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    erase,
    pushUnique
} = AH;
const { isNumber } = TC;
const {
    extend
} = OH;
/* *
 *
 *  Declarations
 *
 * */

declare module '../AxisOptions' {
    interface AxisOptions {
        plotBands?: Array<PlotBandOptions>;
        plotLines?: Array<PlotLineOptions>;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace PlotLineOrBandAxis {

    /* *
     *
     *  Declarations
     *
     * */

    export declare class Composition extends Axis {
        addPlotBand(
            options: PlotBandOptions
        ): (PlotLineOrBand|undefined);
        addPlotBandOrLine(
            options: PlotBandOptions,
            coll?: 'plotBands'
        ): (PlotLineOrBand|undefined);
        addPlotBandOrLine(
            options: PlotLineOptions,
            coll?: 'plotLines'
        ): (PlotLineOrBand|undefined);
        addPlotLine(
            options: PlotLineOptions
        ): (PlotLineOrBand|undefined);
        getPlotBandPath(
            from: number,
            to: number,
            options?: (PlotBandOptions|PlotLineOptions)
        ): SVGPath;
        removePlotBand(id: string): void;
        removePlotBandOrLine(id: string): void;
        removePlotLine(id: string): void;
    }

    /* *
     *
     *  Constants
     *
     * */

    const composedMembers: Array<unknown> = [];

    /* *
     *
     *  Variables
     *
     * */

    let PlotLineOrBandClass: typeof PlotLineOrBand;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Add a plot band after render time.
     *
     * @sample highcharts/members/axis-addplotband/
     *         Toggle the plot band from a button
     *
     * @function Highcharts.Axis#addPlotBand
     *
     * @param {Highcharts.AxisPlotBandsOptions} options
     * A configuration object for the plot band, as defined in
     * [xAxis.plotBands](https://api.highcharts.com/highcharts/xAxis.plotBands).
     *
     * @return {Highcharts.PlotLineOrBand|undefined}
     * The added plot band.
     */
    function addPlotBand(
        this: Composition,
        options: PlotBandOptions
    ): (PlotLineOrBand|undefined) {
        return this.addPlotBandOrLine(options, 'plotBands');
    }

    /**
     * Add a plot band or plot line after render time. Called from
     * addPlotBand and addPlotLine internally.
     *
     * @private
     * @function Highcharts.Axis#addPlotBandOrLine
     * @param {Highcharts.AxisPlotBandsOptions|Highcharts.AxisPlotLinesOptions} options
     * The plotBand or plotLine configuration object.
     */
    function addPlotBandOrLine<T extends PlotBandOptions|PlotLineOptions>(
        this: Composition,
        options: T,
        coll?: (
            T extends PlotBandOptions ?
                'plotBands' :
                'plotLines'
        )
    ): (PlotLineOrBand|undefined) {
        const userOptions = this.userOptions;

        let obj: (PlotLineOrBand|undefined) = new PlotLineOrBandClass(
            this,
            options
        );

        if (this.visible) {
            obj = obj.render();
        }

        if (obj) { // #2189
            if (!this._addedPlotLB) {
                this._addedPlotLB = true;
                (userOptions.plotLines || [])
                    .concat((userOptions.plotBands as any) || [])
                    .forEach(
                        (plotLineOptions: any): void => {
                            this.addPlotBandOrLine(plotLineOptions);
                        }
                    );
            }

            // Add it to the user options for exporting and Axis.update
            if (coll) {
                // Workaround Microsoft/TypeScript issue #32693
                const updatedOptions = (userOptions[coll] || []) as Array<T>;
                updatedOptions.push(options);
                userOptions[coll] = updatedOptions;
            }
            this.plotLinesAndBands.push(obj);
        }

        return obj;
    }

    /**
     * Add a plot line after render time.
     *
     * @sample highcharts/members/axis-addplotline/
     *         Toggle the plot line from a button
     *
     * @function Highcharts.Axis#addPlotLine
     *
     * @param {Highcharts.AxisPlotLinesOptions} options
     * A configuration object for the plot line, as defined in
     * [xAxis.plotLines](https://api.highcharts.com/highcharts/xAxis.plotLines).
     *
     * @return {Highcharts.PlotLineOrBand|undefined}
     * The added plot line.
     */
    function addPlotLine(
        this: Composition,
        options: PlotLineOptions
    ): (PlotLineOrBand|undefined) {
        return this.addPlotBandOrLine(options, 'plotLines');
    }

    /**
     * @private
     */
    export function compose<T extends typeof Axis>(
        PlotLineOrBandType: typeof PlotLineOrBand,
        AxisClass: T
    ): (T&typeof Composition) {

        if (!PlotLineOrBandClass) {
            PlotLineOrBandClass = PlotLineOrBandType;
        }

        if (pushUnique(composedMembers, AxisClass)) {
            extend(
                AxisClass.prototype as Composition,
                {
                    addPlotBand,
                    addPlotLine,
                    addPlotBandOrLine,
                    getPlotBandPath,
                    removePlotBand,
                    removePlotLine,
                    removePlotBandOrLine
                }
            );
        }

        return AxisClass as (T&typeof Composition);
    }

    /**
     * Internal function to create the SVG path definition for a plot band.
     *
     * @function Highcharts.Axis#getPlotBandPath
     *
     * @param {number} from
     * The axis value to start from.
     *
     * @param {number} to
     * The axis value to end on.
     *
     * @param {Highcharts.AxisPlotBandsOptions|Highcharts.AxisPlotLinesOptions} options
     * The plotBand or plotLine configuration object.
     *
     * @return {Highcharts.SVGPathArray}
     * The SVG path definition in array form.
     */
    function getPlotBandPath(
        this: Composition,
        from: number,
        to: number,
        options: (PlotBandOptions|PlotLineOptions) = this.options
    ): SVGPath {
        const toPath = this.getPlotLinePath({
                value: to,
                force: true,
                acrossPanes: options.acrossPanes
            }),
            result = [] as SVGPath,
            horiz = this.horiz,
            outside =
                !isNumber(this.min) ||
                !isNumber(this.max) ||
                (from < this.min && to < this.min) ||
                (from > this.max && to > this.max);

        let path = this.getPlotLinePath({
                value: from,
                force: true,
                acrossPanes: options.acrossPanes
            }),
            i,
            // #4964 check if chart is inverted or plotband is on yAxis
            plus = 1,
            isFlat: (boolean|undefined);

        if (path && toPath) {

            // Flat paths don't need labels (#3836)
            if (outside) {
                isFlat = path.toString() === toPath.toString();
                plus = 0;
            }

            // Go over each subpath - for panes in Highcharts Stock
            for (i = 0; i < path.length; i += 2) {
                const pathStart = path[i],
                    pathEnd = path[i + 1],
                    toPathStart = toPath[i],
                    toPathEnd = toPath[i + 1];

                // Type checking all affected path segments. Consider
                // something smarter.
                if (
                    (pathStart[0] === 'M' || pathStart[0] === 'L') &&
                    (pathEnd[0] === 'M' || pathEnd[0] === 'L') &&
                    (toPathStart[0] === 'M' || toPathStart[0] === 'L') &&
                    (toPathEnd[0] === 'M' || toPathEnd[0] === 'L')
                ) {
                    // Add 1 pixel when coordinates are the same
                    if (horiz && toPathStart[1] === pathStart[1]) {
                        toPathStart[1] += plus;
                        toPathEnd[1] += plus;
                    } else if (!horiz && toPathStart[2] === pathStart[2]) {
                        toPathStart[2] += plus;
                        toPathEnd[2] += plus;
                    }

                    result.push(
                        ['M', pathStart[1], pathStart[2]],
                        ['L', pathEnd[1], pathEnd[2]],
                        ['L', toPathEnd[1], toPathEnd[2]],
                        ['L', toPathStart[1], toPathStart[2]],
                        ['Z']
                    );
                }
                (result as any).isFlat = isFlat;
            }

        } else { // outside the axis area
            path = null;
        }

        return result;
    }

    /**
     * Remove a plot band by its id.
     *
     * @sample highcharts/members/axis-removeplotband/
     *         Remove plot band by id
     * @sample highcharts/members/axis-addplotband/
     *         Toggle the plot band from a button
     *
     * @function Highcharts.Axis#removePlotBand
     *
     * @param {string} id
     *        The plot band's `id` as given in the original configuration
     *        object or in the `addPlotBand` option.
     */
    function removePlotBand(
        this: Composition,
        id: string
    ): void {
        this.removePlotBandOrLine(id);
    }

    /**
     * Remove a plot band or plot line from the chart by id. Called
     * internally from `removePlotBand` and `removePlotLine`.
     * @private
     * @function Highcharts.Axis#removePlotBandOrLine
     */
    function removePlotBandOrLine(
        this: Composition,
        id: string
    ): void {
        const plotLinesAndBands = this.plotLinesAndBands,
            options = this.options,
            userOptions = this.userOptions;

        if (plotLinesAndBands) { // #15639
            let i = plotLinesAndBands.length;
            while (i--) {
                if (plotLinesAndBands[i].id === id) {
                    plotLinesAndBands[i].destroy();
                }
            }
            ([
                options.plotLines || [],
                userOptions.plotLines || [],
                options.plotBands || [],
                userOptions.plotBands || []
            ]).forEach(function (arr): void {
                i = arr.length;
                while (i--) {
                    if ((arr[i] || {}).id === id) {
                        erase(arr, arr[i]);
                    }
                }
            });
        }
    }

    /**
     * Remove a plot line by its id.
     *
     * @sample highcharts/xaxis/plotlines-id/
     *         Remove plot line by id
     * @sample highcharts/members/axis-addplotline/
     *         Toggle the plot line from a button
     *
     * @function Highcharts.Axis#removePlotLine
     *
     * @param {string} id
     *        The plot line's `id` as given in the original configuration
     *        object or in the `addPlotLine` option.
     */
    function removePlotLine(
        this: Composition,
        id: string
    ): void {
        this.removePlotBandOrLine(id);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default PlotLineOrBandAxis;
