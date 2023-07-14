/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');

/* *
 *
 *  Constants
 *
 * */

const DEFAULT_GLOBS = [
    'samples/*/*/*/demo.js',
    'samples/*/*/*/test.js',
    'samples/*/*/*/unit-tests.js'
];

const IGNORE_GLOBS = [
    'samples/highcharts/common-js/*/demo.js',
    'samples/cloud/*/*/demo.js'
];

/* *
 *
 *  Tasks
 *
 * */

/**
 * Gulp task to execute ESLint on samples.
 *
 * Command line arguments:
 *
 * - `--fix`: Fix eslint failures
 *
 * - `-p`/`--path`: Change glob pattern. e.g. `npx gulp lint -p './samples/**'`
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function task() {

    const argv = require('yargs').argv;
    const eslint = require('eslint');
    const log = require('./lib/log');

    return new Promise(resolve => {

        const cli = new eslint.CLIEngine({
            fix: argv.fix,
            ignorePattern: IGNORE_GLOBS
        });
        const globs = (
            (argv.p || argv.path) ?
                (argv.p || argv.path).split(',') :
                DEFAULT_GLOBS
        );

        log.message('Linting [', globs.join(', '), ']...');

        const report = cli.executeOnFiles(globs);

        if (argv.fix) {
            eslint.CLIEngine.outputFixes(report);
        }

        log.message(
            'Finished linting...\n',
            cli.getFormatter()(report.results)
        );

        resolve();
    });
}

gulp.task('lint-samples', task);
