/*
 * Copyright (C) Highsoft AS
 */

const Gulp = require('gulp');
const Path = require('path');

/* *
 *
 *  Constants
 *
 * */

const SOURCE_GLOBS = [
    'readme.md',
    'js/Accessibility/*.js',
    'js/Core/Animation/*.js',
    'js/Core/Axis/Axis.js',
    'js/Core/Axis/Color/ColorAxis.js',
    'js/Core/Axis/PlotLineOrBand/PlotLineOrBand.js',
    'js/Core/Axis/Tick.js',
    'js/Core/Axis/TreeGrid/TreeGridAxis.js',
    'js/Core/Axis/TreeGrid/TreeGridTick.js',
    'js/Core/Chart/Chart.js',
    'js/Core/Chart/GanttChart.js',
    'js/Core/Chart/MapChart.js',
    'js/Core/Chart/StockChart.js',
    'js/Core/Color/Color.js',
    'js/Core/Defaults.js',
    'js/Core/HttpUtilities.js',
    'js/Core/Legend/Legend.js',
    'js/Core/Renderer/HTML/AST.js',
    'js/Core/Renderer/SVG/SVGElement.js',
    'js/Core/Renderer/SVG/SVGRenderer.js',
    'js/Core/Series/DataLabel.js',
    'js/Core/Series/Point.js',
    'js/Core/Series/Series.js',
    'js/Core/Globals.js',
    'js/Core/Pointer.js',
    'js/Core/Time.js',
    'js/Core/Tooltip.js',
    'js/Shared/Utilities.js',
    'js/Extensions/Annotations/Controllables/Controllable.js',
    'js/Extensions/Annotations/Annotation.js',
    'js/Extensions/Annotations/AnnotationChart.js',
    'js/Extensions/Annotations/ControlPoint.js',
    'js/Extensions/Annotations/NavigationBindings.js',
    'js/Extensions/Sonification/*.js',
    'js/Extensions/BorderRadius.js',
    'js/Extensions/Breadcrumbs/Breadcrumbs.js',
    'js/Extensions/Data.js',
    'js/Extensions/DataGrouping/DataGrouping.js',
    'js/Extensions/DataGrouping/DataGroupingSeriesComposition.js',
    'js/Extensions/DraggablePoints.js',
    'js/Extensions/Drilldown.js',
    'js/Extensions/ExportData/ExportData.js',
    'js/Extensions/Exporting/Exporting.js',
    'js/Extensions/Exporting/Fullscreen.js',
    'js/Extensions/GeoJSON.js',
    'js/Extensions/MarkerClusters.js',
    'js/Extensions/OfflineExporting/OfflineExporting.js',
    'js/Extensions/PatternFill.js',
    'js/Extensions/SeriesLabel/SeriesLabel.js',
    'js/Maps/MapNavigation.js',
    'js/Maps/MapView.js',
    'js/Series/AreaRange/AreaRangeSeries.js',
    'js/Series/Column/ColumnSeries.js',
    'js/Series/Networkgraph/NetworkgraphSeries.js',
    'js/Series/Organization/OrganizationSeries.js',
    'js/Series/PackedBubble/PackedBubbleSeries.js',
    'js/Series/Sankey/SankeySeries.js',
    'js/Series/Timeline/TimelineSeries.js',
    'js/Series/GeoHeatmap/GeoHeatmapSeries.js'
];

const TARGET_DIRECTORY = Path.join('build', 'api', 'class-reference');

const TEMPLATE_DIRECTORY = Path.join(
    'node_modules', '@highcharts', 'highcharts-documentation-generators',
    'docstrap'
);

/* *
 *
 *  Tasks
 *
 * */

/**
 * Automated generation for internal Class reference.
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function jsDocClasses() {

    const gulpJSDoc = require('gulp-jsdoc3');
    const LogLib = require('./lib/log');

    return new Promise((resolve, reject) => {

        const jsDocConfig = {
            navOptions: {
                theme: 'highsoft'
            },
            opts: {
                destination: TARGET_DIRECTORY,
                private: false,
                template: Path.join(TEMPLATE_DIRECTORY, 'template')
            },
            plugins: [
                ['plugins', 'add-namespace'],
                ['plugins', 'markdown'],
                ['plugins', 'sampletag']
            ].map(
                filePath => Path.join(TEMPLATE_DIRECTORY, ...filePath)
            ),
            templates: {
                logoFile: Path.join('img', 'highcharts-logo.svg'),
                systemName: 'Highcharts',
                theme: 'highsoft'
            }
        };

        LogLib.message('Generating', TARGET_DIRECTORY + '...');

        Gulp
            .src(SOURCE_GLOBS, { read: false })
            .pipe(gulpJSDoc(jsDocConfig, function (error) {
                if (error) {
                    reject(error);
                } else {
                    LogLib.success('Created', TARGET_DIRECTORY);
                    resolve();
                }
            }));
    });
}

Gulp.task('jsdoc-classes', jsDocClasses);
