/*
 * Copyright (C) Highsoft AS
 */


const FSP = require('node:fs/promises');
const Gulp = require('gulp');
const Path = require('node:path');

/* *
 *
 *  Tasks
 *
 * */

/**
 * Webpack task.
 *
 * @return {Promise<void>}
 * Promise to keep.
 */
async function scriptsWebpack() {

    const LogLib = require('../libs/log');
    const ProcessLib = require('../libs/process');

    const argv = require('yargs').argv;

    LogLib.message('Packing code...');

    let configs;
    if (argv.product === 'Grid') {
        configs = {
            Grid: 'grid.webpack.mjs'
        };
    } else {
        configs = {
            Highcharts: 'highcharts.webpack.mjs',
            HighchartsES5: 'highcharts-es5.webpack.mjs'
        };
    }

    let config;
    let log = '';

    for (const productName of Object.keys(configs)) {
        config = Path.join('tools', 'webpacks', configs[productName]);

        if (argv.verbose) {
            LogLib.warn(config);
        }

        log += await ProcessLib.exec(
            `npx webpack -c ${config}`,
            {
                silent: argv.verbose ? 1 : 2,
                timeout: 60000
            }
        );

    }

    await FSP.writeFile('webpack.log', log);

    LogLib.success('Finished packing.');

}

Gulp.task('scripts-webpack', scriptsWebpack);
