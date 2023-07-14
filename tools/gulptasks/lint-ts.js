/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');

/* *
 *
 *  Constants
 *
 * */

const SOURCE_GLOB = './**/*.ts';

/* *
 *
 *  Tasks
 *
 * */

/**
 * Lint test of TypeScript code.
 *
 * @return {Promise<string>}
 *         Promise to keep with console output
 */
function task() {

    const argv = require('yargs').argv;
    const logLib = require('./lib/log');
    const processLib = require('./lib/process');

    return new Promise((resolve, reject) => {
        const esArgs = [];
        const sourceGlob = argv.p || SOURCE_GLOB;

        logLib.message('Linting [', sourceGlob, ']...');

        if (argv.fix) {
            esArgs.push('--config esfix.json');
            esArgs.push('--fix');
        }

        esArgs.push('--quiet');
        esArgs.push(`"${sourceGlob}"`);

        processLib
            .exec(`cd ts && npx eslint ${esArgs.join(' ')}`)
            .then(() => logLib.success('Finished linting'))
            .then(resolve)
            .catch(reject);
    });
}

gulp.task('lint-ts', task);
