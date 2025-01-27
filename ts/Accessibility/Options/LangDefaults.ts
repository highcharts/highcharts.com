/* *
 *
 *  (c) 2009-2024 Øystein Moseng
 *
 *  Default lang/i18n options for accessibility.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 * Import
 *
 * */

import type LangOptions from './LangOptions';

/* *
 *
 *  API Options
 *
 * */

const langOptions: DeepPartial<LangOptions> = {
    /**
     * Configure the accessibility strings in the chart. Requires the
     * [accessibility module](https://code.highcharts.com/modules/accessibility.js)
     * to be loaded. For a description of the module and information on its
     * features, see
     * [Highcharts Accessibility](https://www.highcharts.com/docs/chart-concepts/accessibility).
     *
     * The lang options use [Format Strings](https://www.highcharts.com/docs/chart-concepts/labels-and-string-formatting#format-strings)
     * with variables that are replaced at run time. These variables should be
     * used when available, to avoid duplicating text that is defined elsewhere.
     *
     * For more dynamic control over the accessibility functionality, see
     * [accessibility.point.descriptionFormatter](#accessibility.point.descriptionFormatter),
     * [accessibility.series.descriptionFormatter](#accessibility.series.descriptionFormatter),
     * and
     * [accessibility.screenReaderSection.beforeChartFormatter](#accessibility.screenReaderSection.beforeChartFormatter).
     *
     * @since        6.0.6
     * @optionparent lang.accessibility
     */
    accessibility: {

        /**
         * @deprecated 10.2.1
         * @type       {string}
         * @apioption  lang.accessibility.resetZoomButton
         */

        /**
         * Default title of the chart for assistive technology, for charts
         * without a chart title.
         */
        defaultChartTitle: 'Chart',

        /**
         * Accessible label for the chart container HTML element.
         * `{title}` refers to the chart title.
         */
        chartContainerLabel: '{title}. Highcharts interactive chart.',

        /**
         * Accessible label for the chart SVG element.
         * `{chartTitle}` refers to the chart title.
         */
        svgContainerLabel: 'Interactive chart',

        /**
         * Accessible label for the drill-up button.
         * `{buttonText}` refers to the visual text on the button.
         */
        drillUpButton: '{buttonText}',

        /**
         * Accessible label for the chart credits.
         * `{creditsStr}` refers to the visual text in the credits.
         */
        credits: 'Chart credits: {creditsStr}',

        /**
         * Thousands separator to use when formatting numbers for screen
         * readers. Note that many screen readers will not handle space as a
         * thousands separator, and will consider "11 700" as two numbers.
         *
         * Set to `null` to use the separator defined in
         * [lang.thousandsSep](lang.thousandsSep).
         *
         * @since 7.1.0
         */
        thousandsSep: ',',

        /**
         * Title element text for the chart SVG element. Leave this
         * empty to disable adding the title element. Browsers will display
         * this content when hovering over elements in the chart. Assistive
         * technology may use this element to label the chart.
         *
         * @since 6.0.8
         */
        svgContainerTitle: '',

        /**
         * Set a label on the container wrapping the SVG.
         *
         * @see [chartContainerLabel](#lang.accessibility.chartContainerLabel)
         *
         * @since 8.0.0
         */
        graphicContainerLabel: '',

        /**
         * Language options for the screen reader information sections added
         * before and after the charts.
         *
         * @since 8.0.0
         */
        screenReaderSection: {
            beforeRegionLabel: '',
            afterRegionLabel: '',

            /**
             * Language options for annotation descriptions.
             *
             * @since 8.0.1
             */
            annotations: {
                heading: 'Chart annotations summary',
                descriptionSinglePoint: (
                    '{annotationText}. Related to {annotationPoint}'
                ),
                descriptionMultiplePoints: (
                    '{annotationText}. Related to {annotationPoint}' +
                    '{#each additionalAnnotationPoints}' +
                    ', also related to {this}' +
                    '{/each}'
                ),
                descriptionNoPoints: '{annotationText}'
            },

            /**
             * Label for the end of the chart. Announced by screen readers.
             *
             * @since 8.0.0
             */
            endOfChartMarker: 'End of interactive chart.'
        },

        /**
         * Language options for sonification.
         *
         * @since 8.0.1
         */
        sonification: {
            playAsSoundButtonText: 'Play as sound, {chartTitle}',
            playAsSoundClickAnnouncement: 'Play'
        },

        /**
         * Language options for accessibility of the legend.
         *
         * @since 8.0.0
         */
        legend: {
            /**
             * Accessible label for the legend, for charts where there is no
             * legend title defined.
             */
            legendLabelNoTitle: 'Toggle series visibility, {chartTitle}',

            /**
             * Accessible label for the legend, for charts where there is a
             * legend title defined. `{legendTitle}` refers to the visual text
             * in the legend title.
             */
            legendLabel: 'Chart legend: {legendTitle}',

            /**
             * Accessible label for individual legend items. `{itemName}` refers
             * to the visual text in the legend for that item.
             */
            legendItem: 'Show {itemName}'
        },

        /**
         * Chart and map zoom accessibility language options.
         *
         * @since 8.0.0
         */
        zoom: {
            mapZoomIn: 'Zoom chart',
            mapZoomOut: 'Zoom out chart',
            resetZoomButton: 'Reset zoom'
        },

        /**
         * Range selector language options for accessibility.
         *
         * @since 8.0.0
         */
        rangeSelector: {
            dropdownLabel: '{rangeTitle}',
            minInputLabel: 'Select start date.',
            maxInputLabel: 'Select end date.',
            clickButtonAnnouncement: 'Viewing {axisRangeDescription}'
        },

        /**
         * Navigator language options for accessibility.
         *
         * @since 11.2.0
         */
        navigator: {
            /**
             * Label for the navigator handles.
             *
             * Receives `handleIx` and `chart` as context.
             * `handleIx` refers to the index of the navigator handle.
             */
            handleLabel:
                '{#eq handleIx 0}Start, percent{else}End, percent{/eq}',

            /**
             * Label for the navigator region.
             *
             * Receives `chart` as context.
             */
            groupLabel: 'Axis zoom',

            /**
             * Announcement for assistive technology when navigator values
             * are changed.
             *
             * Receives `axisRangeDescription` and `chart` as context.
             * `axisRangeDescription` corresponds to the range description
             * defined in [lang.accessibility.axis](#lang.accessibility.axis)
             */
            changeAnnouncement: '{axisRangeDescription}'
        },

        /**
         * Accessibility language options for the data table.
         *
         * @since 8.0.0
         */
        table: {
            viewAsDataTableButtonText: 'View as data table, {chartTitle}',
            tableSummary: 'Table representation of chart.'
        },

        /**
         * Default announcement for new data in charts. If addPoint or
         * addSeries is used, and only one series/point is added, the
         * `newPointAnnounce` and `newSeriesAnnounce` strings are used.
         * The `...Single` versions will be used if there is only one chart
         * on the page, and the `...Multiple` versions will be used if there
         * are multiple charts on the page. For all other new data events,
         * the `newDataAnnounce` string will be used.
         *
         * @since 7.1.0
         */
        announceNewData: {
            newDataAnnounce: 'Updated data for chart {chartTitle}',
            newSeriesAnnounceSingle: 'New data series: {seriesDesc}',
            newPointAnnounceSingle: 'New data point: {pointDesc}',
            newSeriesAnnounceMultiple:
                'New data series in chart {chartTitle}: {seriesDesc}',
            newPointAnnounceMultiple:
                'New data point in chart {chartTitle}: {pointDesc}'
        },

        /**
         * Descriptions of lesser known series types. The relevant
         * description is added to the screen reader information region
         * when these series types are used.
         *
         * @since 6.0.6
         */
        seriesTypeDescriptions: {
            boxplot: 'Box plot charts are typically used to display ' +
            'groups of statistical data. Each data point in the ' +
            'chart can have up to 5 values: minimum, lower quartile, ' +
            'median, upper quartile, and maximum.',
            arearange: 'Arearange charts are line charts displaying a ' +
            'range between a lower and higher value for each point.',
            areasplinerange: 'These charts are line charts displaying a ' +
            'range between a lower and higher value for each point.',
            bubble: 'Bubble charts are scatter charts where each data ' +
            'point also has a size value.',
            columnrange: 'Columnrange charts are column charts ' +
            'displaying a range between a lower and higher value for ' +
            'each point.',
            errorbar: 'Errorbar series are used to display the ' +
            'variability of the data.',
            funnel: 'Funnel charts are used to display reduction of data ' +
            'in stages.',
            pyramid: 'Pyramid charts consist of a single pyramid with ' +
            'item heights corresponding to each point value.',
            waterfall: 'A waterfall chart is a column chart where each ' +
            'column contributes towards a total end value.'
        },

        /**
         * Chart type description strings. This is added to the chart
         * information region.
         *
         * If there is only a single series type used in the chart, we use
         * the format string for the series type, or default if missing.
         * There is one format string for cases where there is only a single
         * series in the chart, and one for multiple series of the same
         * type.
         *
         * @since 6.0.6
         */
        chartTypes: {
            /* eslint-disable max-len */
            emptyChart: 'Empty chart',
            mapTypeDescription: 'Map of {mapTitle} with {numSeries} data series.',
            unknownMap: 'Map of unspecified region with {numSeries} data series.',
            combinationChart: 'Combination chart with {numSeries} data series.',
            defaultSingle: 'Chart with {numPoints} data ' +
                '{#eq numPoints 1}point{else}points{/eq}.',
            defaultMultiple: 'Chart with {numSeries} data series.',
            splineSingle: 'Line chart with {numPoints} data ' +
                '{#eq numPoints 1}point{else}points{/eq}.',
            splineMultiple: 'Line chart with {numSeries} lines.',
            lineSingle: 'Line chart with {numPoints} data ' +
                '{#eq numPoints 1}point{else}points{/eq}.',
            lineMultiple: 'Line chart with {numSeries} lines.',
            columnSingle: 'Bar chart with {numPoints} ' +
                '{#eq numPoints 1}bar{else}bars{/eq}.',
            columnMultiple: 'Bar chart with {numSeries} data series.',
            barSingle: 'Bar chart with {numPoints} ' +
                '{#eq numPoints 1}bar{else}bars{/eq}.',
            barMultiple: 'Bar chart with {numSeries} data series.',
            pieSingle: 'Pie chart with {numPoints} ' +
                '{#eq numPoints 1}slice{else}slices{/eq}.',
            pieMultiple: 'Pie chart with {numSeries} pies.',
            scatterSingle: 'Scatter chart with {numPoints} ' +
                '{#eq numPoints 1}point{else}points{/eq}.',
            scatterMultiple: 'Scatter chart with {numSeries} data series.',
            boxplotSingle: 'Boxplot with {numPoints} ' +
                '{#eq numPoints 1}box{else}boxes{/eq}.',
            boxplotMultiple: 'Boxplot with {numSeries} data series.',
            bubbleSingle: 'Bubble chart with {numPoints} ' +
                '{#eq numPoints 1}bubbles{else}bubble{/eq}.',
            bubbleMultiple: 'Bubble chart with {numSeries} data series.'
        }, /* eslint-enable max-len */

        /**
         * Axis description format strings.
         *
         * @since 6.0.6
         */
        axis: {
        /* eslint-disable max-len */
            xAxisDescriptionSingular: 'The chart has 1 X axis displaying {names[0]}. {ranges[0]}',
            xAxisDescriptionPlural: 'The chart has {numAxes} X axes displaying {#each names}{#unless @first},{/unless}{#if @last} and{/if} {this}{/each}.',
            yAxisDescriptionSingular: 'The chart has 1 Y axis displaying {names[0]}. {ranges[0]}',
            yAxisDescriptionPlural: 'The chart has {numAxes} Y axes displaying {#each names}{#unless @first},{/unless}{#if @last} and{/if} {this}{/each}.',
            timeRangeDays: 'Data range: {range} days.',
            timeRangeHours: 'Data range: {range} hours.',
            timeRangeMinutes: 'Data range: {range} minutes.',
            timeRangeSeconds: 'Data range: {range} seconds.',
            rangeFromTo: 'Data ranges from {rangeFrom} to {rangeTo}.',
            rangeCategories: 'Data range: {numCategories} categories.'
        }, /* eslint-enable max-len */

        /**
         * Exporting menu format strings for accessibility module.
         *
         * @since 6.0.6
         */
        exporting: {
            chartMenuLabel: 'Chart menu',
            menuButtonLabel: 'View chart menu, {chartTitle}'
        },

        /**
         * Lang configuration for different series types. For more dynamic
         * control over the series element descriptions, see
         * [accessibility.seriesDescriptionFormatter](#accessibility.seriesDescriptionFormatter).
         *
         * @since 6.0.6
         */
        series: {
            /**
             * Lang configuration for the series main summary. Each series
             * type has two modes:
             *
             * 1. This series type is the only series type used in the
             *    chart
             *
             * 2. This is a combination chart with multiple series types
             *
             * If a definition does not exist for the specific series type
             * and mode, the 'default' lang definitions are used.
             *
             * Chart and its subproperties can be accessed with the `{chart}` variable.
             * The series and its subproperties can be accessed with the `{series}` variable.
             *
             * The series index (starting from 1) can be accessed with the `{seriesNumber}` variable.
             *
             * @since 6.0.6
             */
            summary: {
                /* eslint-disable max-len */
                'default': '{series.name}, series {seriesNumber} of {chart.series.length} with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                defaultCombination: '{series.name}, series {seriesNumber} of {chart.series.length} with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                line: '{series.name}, line {seriesNumber} of {chart.series.length} with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                lineCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Line with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                spline: '{series.name}, line {seriesNumber} of {chart.series.length} with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                splineCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Line with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                column: '{series.name}, bar series {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}bar{else}bars{/eq}.',
                columnCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Bar series with {series.points.length} {#eq series.points.length 1}bar{else}bars{/eq}.',
                bar: '{series.name}, bar series {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}bar{else}bars{/eq}.',
                barCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Bar series with {series.points.length} {#eq series.points.length 1}bar{else}bars{/eq}.',
                pie: '{series.name}, pie {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}slice{else}slices{/eq}.',
                pieCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Pie with {series.points.length} {#eq series.points.length 1}slice{else}slices{/eq}.',
                scatter: '{series.name}, scatter plot {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}point{else}points{/eq}.',
                scatterCombination: '{series.name}, series {seriesNumber} of {chart.series.length}, scatter plot with {series.points.length} {#eq series.points.length 1}point{else}points{/eq}.',
                boxplot: '{series.name}, boxplot {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}box{else}boxes{/eq}.',
                boxplotCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Boxplot with {series.points.length} {#eq series.points.length 1}box{else}boxes{/eq}.',
                bubble: '{series.name}, bubble series {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}bubble{else}bubbles{/eq}.',
                bubbleCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Bubble series with {series.points.length} {#eq series.points.length 1}bubble{else}bubbles{/eq}.',
                map: '{series.name}, map {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}area{else}areas{/eq}.',
                mapCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Map with {series.points.length} {#eq series.points.length 1}area{else}areas{/eq}.',
                mapline: '{series.name}, line {seriesNumber} of {chart.series.length} with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                maplineCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Line with {series.points.length} data {#eq series.points.length 1}point{else}points{/eq}.',
                mapbubble: '{series.name}, bubble series {seriesNumber} of {chart.series.length} with {series.points.length} {#eq series.points.length 1}bubble{else}bubbles{/eq}.',
                mapbubbleCombination: '{series.name}, series {seriesNumber} of {chart.series.length}. Bubble series with {series.points.length} {#eq series.points.length 1}bubble{else}bubbles{/eq}.'
            }, /* eslint-enable max-len */

            /**
             * User supplied description text. This is added in the point
             * comment description by default if present.
             *
             * `{description}` refers to the value given in
             * [point.accessibility.description](#series.line.data.accessibility.description).
             *
             * @since 6.0.6
             */
            description: '{description}',

            /**
             * X-axis description for series if there are multiple xAxes in
             * the chart.
             *
             * @since 6.0.6
             */
            xAxisDescription: 'X axis, {name}',

            /**
             * Y-axis description for series if there are multiple yAxes in
             * the chart.
             *
             * @since 6.0.6
             */
            yAxisDescription: 'Y axis, {name}',

            /**
             * Description for the value of null points.
             *
             * @since 8.0.0
             */
            nullPointValue: 'No value',

            /**
             * Description for annotations on a point, as it is made available
             * to assistive technology.
             *
             * @since 8.0.1
             */
            pointAnnotationsDescription: '{#each annotations}' +
                'Annotation: {this}{/each}'
        }
    }
};

/* *
 *
 *  Default Export
 *
 * */

export default langOptions;
