/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');

/* *
 *
 *  Functions
 *
 * */

async function replaceVariables(
    target
) {
    const fs = require('node:fs/promises');
    const fsLib = require('./lib/fs');
    const package = require('../../package.json');

    for (const file of fsLib.getFilePaths(target)) {
        await fs.writeFile(
            file,
            (await fs.readFile(file, 'utf8'))
                .replace(/@product\.version@/gu, package.version)
        );
    }
}

/* *
 *
 *  Tasks
 *
 * */

/**
 * Gulp task to run the building process for distribution bundles. Usage:
 * `npx gulp scripts-rollup`.
 *
 * @return {Promise}
 * Promise to keep
 */
async function scriptsRollup() {
    const fsLib = require('./lib/fs');
    const logLib = require('./lib/log');
    const processLib = require('./lib/process');

    logLib.starting('rollup');

    await processLib.exec(
        `rollup -c ${fsLib.path('ts/masters/rollup.config.mjs')}`,
        { env: { ...process.env, TERM: 'dumb' } }
    );

    // Replace variables
    await replaceVariables('code');
}

gulp.task('scripts-rollup', scriptsRollup);

module.exports = scriptsRollup;
