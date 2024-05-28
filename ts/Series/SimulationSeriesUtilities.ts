/* *
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
import type NetworkgraphSeries from './Networkgraph/NetworkgraphSeries';
import type PackedBubbleSeries from './PackedBubble/PackedBubbleSeries';
import type SVGElement from '../Core/Renderer/SVG/SVGElement';

import U from '../Core/Utilities.js';
const {
    merge,
    syncTimeout
} = U;

import { animObject } from '../Core/Animation/AnimationUtilities.js';

type SimulationSeries = (NetworkgraphSeries | PackedBubbleSeries);

/**
 * Create a setTimeout for the first drawDataLabels()
 * based on the dataLabels.animation.defer value
 * for series which have enabled simulation.
 * @private
 */
function initDataLabelsDefer(this: SimulationSeries): void {
    const dlOptions = this.options.dataLabels;

    // Method drawDataLabels() fires for the first time after
    // dataLabels.animation.defer time unless
    // the dataLabels.animation = false or dataLabels.defer = false
    // or if the simulation is disabled
    if (
        !dlOptions?.defer ||
        !this.options.layoutAlgorithm?.enableSimulation
    ) {
        this.deferDataLabels = false;
    } else {
        syncTimeout((): void => {
            this.deferDataLabels = false;
        }, dlOptions ? animObject(dlOptions.animation).defer : 0);
    }
}

/**
 * Initialize the SVG group for the DataLabels with correct opacities
 * and correct styles so that the animation for the series that have
 * simulation enabled works fine.
 * @private
 */
function initDataLabels(this: SimulationSeries): SVGElement {
    const series = this,
        dlOptions = series.options.dataLabels;

    if (!series.dataLabelsGroup) {
        const dataLabelsGroup = this.initDataLabelsGroup();

        // Apply the dataLabels.style not only to the
        // individual dataLabels but also to the entire group
        if (!series.chart.styledMode && dlOptions?.style) {
            dataLabelsGroup.css(dlOptions.style);
        }

        // Initialize the opacity of the group to 0 (start of animation)
        dataLabelsGroup.attr({ opacity: 0 });

        if (series.visible) { // #2597, #3023, #3024
            dataLabelsGroup.show();
        }

        return dataLabelsGroup;
    }

    // Place it on first and subsequent (redraw) calls
    series.dataLabelsGroup.attr(
        merge(
            { opacity: 1 },
            this.getPlotBox('data-labels')
        )
    );
    return series.dataLabelsGroup;
}

const DataLabelsDeferUtils = {
    initDataLabels,
    initDataLabelsDefer
};

export default DataLabelsDeferUtils;
