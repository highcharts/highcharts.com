/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');
const path = require('path');

/* *
 *
 *  Constants
 *
 * */

const CODE_DIRECTORY = 'code';

const CONFIGURATION_FILE = path.join('node_modules', '_gulptasks_scripts.json');

const CSS_DIRECTORY = 'css';

const GFX_DIRECTORY = 'gfx';

const JS_DIRECTORY = 'js';

const TS_DIRECTORY = 'ts';

/* *
 *
 *  Functions
 *
 * */

/**
 * Saves run.
 *
 * @return {void}
 */
function saveRun() {

    const fs = require('fs');
    const fslib = require('../libs/fs');
    const logLib = require('../libs/log');
    const stringlib = require('./lib/string');
    const argv = require('yargs').argv;

    const product = argv.product || 'Highcharts';

    let config;
    try {
        config = JSON.parse(fs.readFileSync(CONFIGURATION_FILE).toString());
    } catch {
        logLib.message('Cannot read scripts hashes config file. Loading empty config.');
        config = {};
    }

    const latestCodeHash = fslib.getDirectoryHash(
        CODE_DIRECTORY, true, stringlib.removeComments
    );
    const latestCSSHash = fslib.getDirectoryHash(
        CSS_DIRECTORY, true, stringlib.removeComments
    );
    const latestGFXHash = fslib.getDirectoryHash(GFX_DIRECTORY);
    const latestJSHash = fslib.getDirectoryHash(
        JS_DIRECTORY, true, stringlib.removeComments
    );
    const latestTSHash = fslib.getDirectoryHash(TS_DIRECTORY, true);

    config[product] = {
        latestCodeHash,
        latestCSSHash,
        latestGFXHash,
        latestJSHash,
        latestTSHash
    };

    fs.writeFileSync(CONFIGURATION_FILE, JSON.stringify(config));
}

/**
 * Tests whether code and js directory are in sync.
 *
 * @return {boolean}
 *         True, if code is out of sync.
 */
function shouldRun() {

    const fs = require('fs');
    const fslib = require('../libs/fs');
    const argv = require('yargs').argv;
    const log = require('../libs/log');
    const stringlib = require('./lib/string');

    const product = argv.product || 'Highcharts';

    let config = {};
    if (fs.existsSync(CONFIGURATION_FILE)) {
        config = JSON.parse(
            fs.readFileSync(CONFIGURATION_FILE).toString()
        );
    }

    config = config[product] || {};

    const latestCodeHash = fslib.getDirectoryHash(
        // TODO: Code directory should be dependent on the product
        CODE_DIRECTORY, true, stringlib.removeComments
    );
    const latestCSSHash = fslib.getDirectoryHash(
        CSS_DIRECTORY, true, stringlib.removeComments
    );
    const latestGFXHash = fslib.getDirectoryHash(GFX_DIRECTORY);
    const latestJSHash = fslib.getDirectoryHash(
        JS_DIRECTORY, true, stringlib.removeComments
    );
    const latestTSHash = fslib.getDirectoryHash(TS_DIRECTORY, true);

    if (latestCodeHash === config.latestCodeHash &&
        latestCSSHash === config.latestCSSHash &&
        latestGFXHash === config.latestGFXHash &&
        latestJSHash === config.latestJSHash &&
        latestTSHash === config.latestTSHash
    ) {

        log.success(
            '✓ Source code has not been modified' +
            ' since the last successful run.'
        );

        return false;
    }

    return true;
}

/* *
 *
 *  Tasks
 *
 * */

/**
 * The "gulp scripts" task.
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function task() {

    const argv = require('yargs').argv;
    const fsLib = require('../libs/fs');
    const logLib = require('../libs/log');
    const processLib = require('../libs/process');
    const utils = require('./utils');

    if (!utils.validateProduct(argv.product)) {
        return Promise.resolve();
    }

    if (processLib.isRunning('scripts-watch')) {
        logLib.warn('Running watch process detected. Skipping task...');
        if (argv.force) {
            processLib.isRunning('scripts-watch', false, true);
        } else {
            return Promise.resolve();
        }
    }

    if (argv.debug && !argv.force) {
        logLib.warn('Skipping task in debug mode...');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {

        if (
            argv.assembler ||
            argv.force ||
            shouldRun() ||
            processLib.isRunning('scripts_incomplete')
        ) {
            processLib.isRunning('scripts_incomplete', true, true);

            if (argv.clear) {
                fsLib.deleteDirectory('code', true);
            }

            gulp.series(...(
                argv.assembler ?
                    [
                        'scripts-css',
                        'scripts-ts',
                        'scripts-es5',
                        'scripts-js',
                        'scripts-code'
                    ] :
                    [
                        'scripts-css',
                        'scripts-ts',
                        'scripts-webpack',
                        'scripts-code'
                    ]
            ))(
                function (error) {

                    processLib.isRunning('scripts_incomplete', false, true);

                    saveRun();

                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
        } else {

            logLib.message(
                'Hint: Run the `scripts-watch` task to watch the js ' +
                'and ts directories.'
            );

            resolve();
        }
    });
}

gulp.task('scripts', task);
