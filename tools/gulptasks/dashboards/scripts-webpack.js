/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');
const webpack = require('webpack');
const webpackConfig = require('../../webpacks/dashboards.webpack');

/* *
 *
 *  Tasks
 *
 * */

/**
 * Webpack task
 *
 * @return {Promise<void>}
 * Promise to keep
 */
async function scriptsWebpack() {
    const logLib = require('../../libs/log');

    logLib.message('Packing Dashboards and DataGrid code...');

    logLib.message('Webpack entry path:', webpackConfig.entry);

    return new Promise((resolve, reject) => {
        webpack(webpackConfig, (err, stats) => {
            if (err || stats.hasErrors()) {
                console.error('Webpack compilation failed:', err || stats.toJson().errors);
                reject(err || new Error('Webpack compilation errors'));
            } else {
                console.log('Webpack compilation completed successfully.');
                console.log(stats.toString({
                    chunks: false,
                    colors: true
                }));
                resolve();
            }
        });
    });
}

gulp.task('dashboards/scripts-webpack', scriptsWebpack);
