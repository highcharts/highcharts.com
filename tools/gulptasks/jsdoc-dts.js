/*
 * Copyright (C) Highsoft AS
 */

const gulp = require('gulp');
const path = require('node:path');

/* *
 *
 *  Constants
 *
 * */


const ESM_FOLDERS = [
    path.join('es-modules', 'masters'),
    'esm'
];


const PRODUCT_BUNDLES = [
    'custom',
    'highcharts',
    'highcharts-gantt',
    'highmaps',
    'highstock'
];

/* *
 *
 *  Tasks
 *
 * */

/**
 * Creates small DTS references to classic DTS.
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function jsDocESMDTS() {

    const fs = require('fs');
    const fsLib = require('../libs/fs');
    const dtsFiles = fsLib
        .getFilePaths('code', true)
        .filter(file => (
            file.endsWith('.src.d.ts') &&
            !file.endsWith('globals.src.d.ts') &&
            !file.includes('dashboards') &&
            !file.includes('datagrid') &&
            !file.includes('es-modules')
        ));
    const argv = require('yargs').argv;
    const promises = [];

    for (const folder of ESM_FOLDERS) {
        for (const dtsFile of dtsFiles) {
            const target = path.join(
                'code',
                folder,
                path.relative('code', dtsFile)
            );
            const source = path.relative(
                path.dirname(target),
                dtsFile.substring(0, dtsFile.length - 5)
            );

            fsLib.makePath(path.dirname(target));

            promises.push(fs.promises.writeFile(
                target,
                (
                    !argv.assembler ||
                    PRODUCT_BUNDLES.some(
                        product => dtsFile.endsWith(`${product}.src.d.ts`)
                    ) ?
                        [
                            `import * as Highcharts from '${fsLib.path(source, true)}';`,
                            'export default Highcharts;',
                            ''
                        ].join('\n') :
                        [
                            `import '${fsLib.path(source, true)}';`,
                            ''
                        ].join('\n')
                )
            ));
        }
    }

    return Promise.all(promises);

}

/**
 * Add TypeScript declarations to the code folder using tree.json and
 * tree-namespace.json.
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function jsDocDTS() {

    const argv = require('yargs').argv;
    const gulpLib = require('./lib/gulp');
    const highchartsDeclarationsGenerator = require(
        '@highcharts/highcharts-declarations-generator'
    );

    return new Promise((resolve, reject) => {

        if (argv.custom) {
            highchartsDeclarationsGenerator.config
                .mainModule = 'code/custom';
        }

        gulpLib
            .requires([], ['jsdoc-namespace', 'jsdoc-options'])
            .then(() => highchartsDeclarationsGenerator.task())
            .then(resolve)
            .catch(reject);

    });
}

gulp.task('jsdoc-dts', gulp.series(jsDocDTS, jsDocESMDTS));
