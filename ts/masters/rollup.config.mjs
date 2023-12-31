/*

Rollup bundles

Usage
npx rollup -c ts/masters/rollup.config.mjs

Use by
npx gulp scripts-rollup

*/

/* *
 *
 *  Imports
 *
 * */

import FSLib from '../../tools/gulptasks/lib/fs.js';
import Path from 'node:path';
import { fileURLToPath } from 'node:url';

/* *
 *
 *  Constants
 *
 * */

const __cwd = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const products = [
    'highcharts',
    'highcharts-gantt',
    'highmaps',
    'highstock'
];

const globals = {};
const externals = {
    'Core/Animation/AnimationUtilities.js': 'Highcharts', // Animation functions are set directly on Highcharts
    'Core/Animation/Fx.js': 'Highcharts.Fx',
    'Core/Axis/Axis.js': 'Highcharts.Axis',
    'Core/Axis/PlotLineOrBand/PlotLineOrBand.js': 'Highcharts.PlotLineOrBand',
    'Core/Axis/Stacking/StackItem.js': 'Highcharts.StackItem',
    'Core/Chart/Chart.js': 'Highcharts.Chart',
    'Core/Color/Color.js': 'Highcharts.Color',
    'Core/Defaults.js': 'Highcharts', // `defaultOptions` and `setOptions` are set on Highcharts
    'Core/Globals.js': 'Highcharts',
    'Core/Legend/Legend.js': 'Highcharts.Legend',
    'Core/Pointer.js': 'Highcharts.Pointer',
    'Core/Renderer/HTML/AST.js': 'Highcharts.AST',
    'Core/Renderer/RendererRegistry.js': 'Highcharts.RendererRegistry',
    'Core/Renderer/SVG/SVGElement.js': 'Highcharts.SVGElement',
    'Core/Renderer/SVG/SVGRenderer.js': 'Highcharts.SVGRenderer',
    'Core/Series/Point.js': 'Highcharts.Point',
    'Core/Series/Series.js': 'Highcharts.Series',
    'Core/Series/SeriesRegistry.js': 'Highcharts.SeriesRegistry',
    'Core/Templating.js': 'Highcharts.Templating', 
    'Core/Axis/Tick.js': 'Highcharts.Tick',
    'Core/Time.js': 'Highcharts.Time',
    'Core/Tooltip.js': 'Highcharts.Tooltip',
    'Core/Utilities.js': 'Highcharts' // Utility functions are set directly on Highcharts
};
for (const key of Object.keys(externals)) {
    globals[Path.resolve(
        __cwd, 'code', 'es-modules',
        ...key.split(Path.posix.sep)
    )] = externals[key];
}

/* *
 *
 *  Default Export
 *
 * */

const bundles = [];
const paths = FSLib.getFilePaths(Path.relative(__cwd, __dirname), true);
for (let path of paths) {
    path = Path.relative(__dirname, path);
    if (!Path.basename(path).endsWith('.ts')) {
        continue;
    }
    const name = path.replace(/\.src\.ts$/g, '')
    bundles.push({
        input: Path.join('code', 'es-modules', 'masters', `${name}.src.js`),
        external: (
            products.includes(name) ?
                [] :
                Object.keys(globals)
        ),
        output: {
            file: Path.join('code', `${name}.src.js`),
            format: 'umd',
            generatedCode: 'es2015',
            globals,
            name: (
                products.includes(name) ?
                    'Highcharts' :
                    `Highcharts._modules.${name}`
            ),
            sourcemap: true
        }
    });
}

export default bundles;
