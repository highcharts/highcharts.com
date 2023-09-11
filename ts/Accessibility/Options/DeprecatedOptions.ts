/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Default options for accessibility.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

/* eslint-disable max-len */
/*
 *  List of deprecated options:
 *
 *  chart.description -> accessibility.description
 *  chart.typeDescription -> accessibility.typeDescription
 *  series.description -> series.accessibility.description
 *  series.exposeElementToA11y -> series.accessibility.exposeAsGroupOnly
 *  series.pointDescriptionFormatter ->
 *      series.accessibility.pointDescriptionFormatter
 *  series.accessibility.pointDescriptionFormatter ->
 *      series.accessibility.point.descriptionFormatter
 *  series.skipKeyboardNavigation ->
 *      series.accessibility.keyboardNavigation.enabled
 *  point.description -> point.accessibility.description !!!! WARNING: No longer deprecated and handled, removed for HC8.
 *  axis.description -> axis.accessibility.description
 *
 *  accessibility.pointDateFormat -> accessibility.point.dateFormat
 *  accessibility.addTableShortcut -> Handled by screenReaderSection.beforeChartFormat
 *  accessibility.pointDateFormatter -> accessibility.point.dateFormatter
 *  accessibility.pointDescriptionFormatter -> accessibility.point.descriptionFormatter
 *  accessibility.pointDescriptionThreshold -> accessibility.series.pointDescriptionEnabledThreshold
 *  accessibility.pointNavigationThreshold -> accessibility.keyboardNavigation.seriesNavigation.pointNavigationEnabledThreshold
 *  accessibility.pointValueDecimals -> accessibility.point.valueDecimals
 *  accessibility.pointValuePrefix -> accessibility.point.valuePrefix
 *  accessibility.pointValueSuffix -> accessibility.point.valueSuffix
 *  accessibility.screenReaderSectionFormatter -> accessibility.screenReaderSection.beforeChartFormatter
 *  accessibility.describeSingleSeries -> accessibility.series.describeSingleSeries
 *  accessibility.seriesDescriptionFormatter -> accessibility.series.descriptionFormatter
 *  accessibility.onTableAnchorClick -> accessibility.screenReaderSection.onViewDataTableClick
 *  accessibility.axisRangeDateFormat -> accessibility.screenReaderSection.axisRangeDateFormat
 *  accessibility.keyboardNavigation.skipNullPoints -> accessibility.keyboardNavigation.seriesNavigation.skipNullPoints
 *  accessibility.keyboardNavigation.mode -> accessibility.keyboardNavigation.seriesNavigation.mode
 *
 *  lang.accessibility.chartHeading -> no longer used, remove
 *  lang.accessibility.legendItem -> lang.accessibility.legend.legendItem
 *  lang.accessibility.legendLabel -> lang.accessibility.legend.legendLabel
 *  lang.accessibility.mapZoomIn -> lang.accessibility.zoom.mapZoomIn
 *  lang.accessibility.mapZoomOut -> lang.accessibility.zoom.mapZoomOut
 *  lang.accessibility.resetZoomButton -> lang.accessibility.zoom.resetZoomButton
 *  lang.accessibility.screenReaderRegionLabel -> lang.accessibility.screenReaderSection.beforeRegionLabel
 *  lang.accessibility.rangeSelectorButton -> lang.accessibility.rangeSelector.buttonText
 *  lang.accessibility.rangeSelectorMaxInput -> lang.accessibility.rangeSelector.maxInputLabel
 *  lang.accessibility.rangeSelectorMinInput -> lang.accessibility.rangeSelector.minInputLabel
 *  lang.accessibility.svgContainerEnd -> lang.accessibility.screenReaderSection.endOfChartMarker
 *  lang.accessibility.viewAsDataTable -> lang.accessibility.table.viewAsDataTableButtonText
 *  lang.accessibility.tableSummary -> lang.accessibility.table.tableSummary
 *
 */
/* eslint-enable max-len */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type {
    AxisAccessibilityOptions,
    SeriesAccessibilityOptions
} from './A11yOptions';
import type Options from '../../Core/Options';
import type Series from '../../Core/Series/Series';

import Axis from '../../Core/Axis/Axis.js';
import Chart from '../../Core/Chart/Chart.js';
import U from '../../Shared/Utilities.js';
import error from '../../Shared/Helpers/Error.js';
const {
    pick
} = U;

/* *
 *
 * Declarations
 *
 * */

declare module '../../Core/Axis/AxisOptions' {
    interface AxisOptions {
        /** @deprecated */
        description?: AxisAccessibilityOptions['description'];
    }
}

declare module '../../Core/Options'{
    interface Options {
        /** @deprecated */
        exposeElementToA11y?: SeriesAccessibilityOptions['exposeAsGroupOnly'];
    }
}

/* *
 *
 *  Functions
 *
 * */

/* eslint-disable valid-jsdoc */

/**
 * Set a new option on a root prop, where the option is defined as an array of
 * suboptions.
 * @private
 * @param root
 * @param {Array<string>} optionAsArray
 * @param {*} val
 * @return {void}
 */
function traverseSetOption<T>(
    root: Record<string, T>,
    optionAsArray: Array<string>,
    val: T
): void {
    let opt = root,
        prop,
        i = 0;
    for (;i < optionAsArray.length - 1; ++i) {
        prop = optionAsArray[i];
        opt = opt[prop] = pick(opt[prop], {}) as any;
    }
    opt[optionAsArray[optionAsArray.length - 1]] = val;
}

/**
 * If we have a clear root option node for old and new options and a mapping
 * between, we can use this generic function for the copy and warn logic.
 */
function deprecateFromOptionsMap(
    chart: Chart,
    rootOldAsArray: Array<string>,
    rootNewAsArray: Array<string>,
    mapToNewOptions: Record<string, Array<string>>
): void {
    /**
     * @private
     */
    function getChildProp(
        root: Options,
        propAsArray: Array<string>
    ): Record<string, unknown> {
        return propAsArray.reduce(function (
            acc: Record<string, unknown>,
            cur: string
        ): Record<string, unknown> {
            return acc[cur] as any;
        }, root as any);
    }

    const rootOld = getChildProp(chart.options, rootOldAsArray),
        rootNew = getChildProp(chart.options, rootNewAsArray);

    Object.keys(mapToNewOptions).forEach(function (oldOptionKey: string): void {
        const val = rootOld[oldOptionKey];
        if (typeof val !== 'undefined') {
            traverseSetOption(
                rootNew,
                mapToNewOptions[oldOptionKey],
                val
            );
            error(
                32,
                false,
                chart,
                {
                    [rootOldAsArray.join('.') + '.' + oldOptionKey]: (
                        rootNewAsArray.join('.') + '.' +
                        mapToNewOptions[oldOptionKey].join('.')
                    )
                }
            );
        }
    });
}

/**
 * @private
 */
function copyDeprecatedChartOptions(chart: Chart): void {
    const chartOptions = chart.options.chart,
        a11yOptions = chart.options.accessibility || {};
    ['description', 'typeDescription'].forEach(function (
        prop: string
    ): void {
        if ((chartOptions as any)[prop]) {
            (a11yOptions as any)[prop] = (chartOptions as any)[prop];
            error(
                32,
                false,
                chart,
                { [`chart.${prop}`]: `use accessibility.${prop}` }
            );
        }
    });
}

/**
 * @private
 */
function copyDeprecatedAxisOptions(chart: Chart): void {
    chart.axes.forEach(function (axis: Axis): void {
        const opts = axis.options;
        if (opts && opts.description) {
            opts.accessibility = opts.accessibility || {};
            opts.accessibility.description = opts.description;
            error(32, false, chart, {
                'axis.description': 'use axis.accessibility.description'
            });
        }
    });
}

/**
 * @private
 */
function copyDeprecatedSeriesOptions(chart: Chart): void {
    // Map of deprecated series options. New options are defined as
    // arrays of paths under series.options.
    const oldToNewSeriesOptions = {
        description: ['accessibility', 'description'],
        exposeElementToA11y: ['accessibility', 'exposeAsGroupOnly'],
        pointDescriptionFormatter: [
            'accessibility', 'point', 'descriptionFormatter'
        ],
        skipKeyboardNavigation: [
            'accessibility', 'keyboardNavigation', 'enabled'
        ],
        'accessibility.pointDescriptionFormatter': [
            'accessibility', 'point', 'descriptionFormatter'
        ]
    };
    chart.series.forEach(function (series: Series): void {
        // Handle series wide options
        Object.keys(oldToNewSeriesOptions).forEach(function (
            oldOption: string
        ): void {
            let optionVal = (series.options as any)[oldOption];

            // Special case
            if (oldOption === 'accessibility.pointDescriptionFormatter') {
                optionVal = (
                    series.options.accessibility &&
                    (series.options.accessibility as any)
                        .pointDescriptionFormatter
                );
            }

            if (typeof optionVal !== 'undefined') {
                // Set the new option
                traverseSetOption(
                    series.options,
                    (oldToNewSeriesOptions as any)[oldOption],
                    // Note that skipKeyboardNavigation has inverted option
                    // value, since we set enabled rather than disabled
                    oldOption === 'skipKeyboardNavigation' ?
                        !optionVal : optionVal
                );
                error(
                    32,
                    false,
                    chart,
                    {
                        [`series.${oldOption}`]: (
                            'series.' +
                            (oldToNewSeriesOptions as any)[oldOption].join('.')
                        )
                    }
                );
            }
        });
    });
}

/**
 * @private
 */
function copyDeprecatedTopLevelAccessibilityOptions(
    chart: Chart
): void {
    deprecateFromOptionsMap(
        chart,
        ['accessibility'],
        ['accessibility'],
        {
            pointDateFormat: ['point', 'dateFormat'],
            pointDateFormatter: ['point', 'dateFormatter'],
            pointDescriptionFormatter: ['point', 'descriptionFormatter'],
            pointDescriptionThreshold: ['series',
                'pointDescriptionEnabledThreshold'],
            pointNavigationThreshold: ['keyboardNavigation', 'seriesNavigation',
                'pointNavigationEnabledThreshold'],
            pointValueDecimals: ['point', 'valueDecimals'],
            pointValuePrefix: ['point', 'valuePrefix'],
            pointValueSuffix: ['point', 'valueSuffix'],
            screenReaderSectionFormatter: ['screenReaderSection',
                'beforeChartFormatter'],
            describeSingleSeries: ['series', 'describeSingleSeries'],
            seriesDescriptionFormatter: ['series', 'descriptionFormatter'],
            onTableAnchorClick: ['screenReaderSection', 'onViewDataTableClick'],
            axisRangeDateFormat: ['screenReaderSection', 'axisRangeDateFormat']
        }
    );
}

/**
 * @private
 */
function copyDeprecatedKeyboardNavigationOptions(
    chart: Chart
): void {
    deprecateFromOptionsMap(
        chart,
        ['accessibility', 'keyboardNavigation'],
        ['accessibility', 'keyboardNavigation', 'seriesNavigation'],
        {
            skipNullPoints: ['skipNullPoints'],
            mode: ['mode']
        }
    );
}

/**
 * @private
 */
function copyDeprecatedLangOptions(chart: Chart): void {
    deprecateFromOptionsMap(
        chart,
        ['lang', 'accessibility'],
        ['lang', 'accessibility'],
        {
            legendItem: ['legend', 'legendItem'],
            legendLabel: ['legend', 'legendLabel'],
            mapZoomIn: ['zoom', 'mapZoomIn'],
            mapZoomOut: ['zoom', 'mapZoomOut'],
            resetZoomButton: ['zoom', 'resetZoomButton'],
            screenReaderRegionLabel: ['screenReaderSection',
                'beforeRegionLabel'],
            rangeSelectorButton: ['rangeSelector', 'buttonText'],
            rangeSelectorMaxInput: ['rangeSelector', 'maxInputLabel'],
            rangeSelectorMinInput: ['rangeSelector', 'minInputLabel'],
            svgContainerEnd: ['screenReaderSection', 'endOfChartMarker'],
            viewAsDataTable: ['table', 'viewAsDataTableButtonText'],
            tableSummary: ['table', 'tableSummary']
        }
    );
}


/**
 * Copy options that are deprecated over to new options. Logs warnings to
 * console if deprecated options are used.
 *
 * @private
 */
function copyDeprecatedOptions(chart: Chart): void {
    copyDeprecatedChartOptions(chart);
    copyDeprecatedAxisOptions(chart);
    if (chart.series) {
        copyDeprecatedSeriesOptions(chart);
    }
    copyDeprecatedTopLevelAccessibilityOptions(chart);
    copyDeprecatedKeyboardNavigationOptions(chart);
    copyDeprecatedLangOptions(chart);
}

/* *
 *
 *  Default Export
 *
 * */

export default copyDeprecatedOptions;
