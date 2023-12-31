/*
 * Copyright (C) Highsoft AS
 */

/* eslint-disable no-use-before-define, node/no-unsupported-features/node-builtins */

/* *
 *
 *  Imports
 *
 * */

const gulp = require('gulp');
const path = require('path');

/* *
 *
 *  Tasks
 *
 * */

/**
 * Builds files of `/ts` folder into `/js` folder.
 *
 * @return {Promise}
 * Promise to keep.
 */
async function scriptsTS() {
    const fsLib = require('./lib/fs'),
        processLib = require('./lib/process');

    try {
        processLib.isRunning('scripts-ts', true);

        const target = path.join('code', 'es-modules');

        fsLib.deleteDirectory(target, true);

        fsLib.copyAllFiles(
            'ts', target, true,
            sourcePath => sourcePath.endsWith('.d.ts')
        );

        await processLib.exec('npx tsc --build ts');

        // Remove Dashboards
        fsLib.deleteDirectory(path.join(target, 'Dashboards'), true);
        fsLib.deleteDirectory(path.join(target, 'DataGrid'), true);

        processLib.isRunning('scripts-ts', false);
    } finally {
        processLib.isRunning('scripts-ts', false);
    }
}

gulp.task('scripts-ts', gulp.series('scripts-messages', scriptsTS));
