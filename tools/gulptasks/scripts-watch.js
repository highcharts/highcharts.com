/*
 * Copyright (C) Highsoft AS
 */

const argv = require('yargs').argv;
const gulp = require('gulp');

/* *
 *
 *  Functions
 *
 * */

/**
 * Logs modified status depending on file path.
 *
 * @param {string} filePath
 * File path to consider.
 */
function logFileStatus(filePath) {
    const logLib = require('../libs/log');

    if (!filePath.includes('masters')) {
        logLib.warn('Modified', filePath);
    }
}

/* *
 *
 *  Tasks
 *
 * */

/**
 * Continuesly watching sources to restart the `scripts-js` task.
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
async function task() {

    const fsLib = require('../libs/fs');
    const logLib = require('../libs/log');
    const processLib = require('../libs/process');

    if (processLib.isRunning('scripts-watch')) {
        logLib.warn('Running watch process detected.');
        if (!argv.force) {
            logLib.warn('Skipping task...');
            return Promise.resolve();
        }
    }

    const watchGlobs = [
        argv.assembler ? 'js/**/*.js' : 'code/es-modules/**/*.js',
        'css/**/*.css'
    ];

    let codeHash;
    let cssHash;

    gulp
        .watch(watchGlobs, { queue: true }, async () => {

            const buildTasks = [];
            const newCodeHash = (
                argv.assembler ?
                    fsLib.getDirectoryHash('js', true) :
                    fsLib.getDirectoryHash('code/es-modules', true)
            );

            if (newCodeHash !== codeHash || argv.force || argv.dts) {
                codeHash = newCodeHash;
                if (argv.assembler) {
                    buildTasks.push('scripts-js');
                    buildTasks.push('scripts-code');
                }
                if (argv.dts) {
                    buildTasks.task('jsdoc-dts')();
                }

                if (argv.product === 'Grid') {
                    buildTasks.push('scripts-ts', 'scripts-webpack');
                }
            }

            const newCssHash = fsLib.getDirectoryHash('css', true);

            if (newCssHash !== cssHash || argv.force) {
                cssHash = newCssHash;
                buildTasks.push('scripts-css');
            }

            if (buildTasks.length === 0) {
                logLib.success('No significant changes found.');
                return;
            }

            await gulp.series(...buildTasks)();

        })
        .on('add', logFileStatus)
        .on('change', logFileStatus)
        .on('unlink', logFileStatus)
        .on('error', logLib.failure);

    logLib.warn('Watching [', watchGlobs.join(', '), '] ...');

    processLib.isRunning('scripts-watch', true);

    if (argv.dts) {
        await gulp.task('jsdoc-dts')();
    }

    if (!argv.assembler) {
        processLib.exec(
            'npx webpack watch -c tools/webpacks/highcharts.webpack.mjs',
            {
                silent: 2
            }
        );
    }

    return processLib
        .exec(
            argv.assembler ?
                'npx tsc --build ts --watch --outDir js/' :
                'npx tsc --build ts --watch'
        )
        .then(() => void 0);
}

require('./scripts-css.js');
require('./scripts-js.js');
require('./scripts-ts.js');

gulp.task(
    'scripts-watch',
    argv.assembler ?
        gulp.series('scripts-ts', 'scripts-css', 'scripts-js', 'scripts-code', task) :
        gulp.series('scripts-ts', 'scripts-css', 'scripts-code', task)
);
