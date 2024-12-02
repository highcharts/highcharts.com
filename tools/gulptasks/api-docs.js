/*
 * Copyright (C) Highsoft AS
 */

/* eslint-disable func-style, no-use-before-define, quotes */


/* *
 *
 *  Imports
 *
 * */


const Gulp = require('gulp');


/* *
 *
 *  Constants
 *
 * */


const INFO = `
npx gulp api-docs [OPTIONS]

OPTIONS:
  --info           This information.
  --debug          Includes source code of the related node.
  --source [PATH]  Only loads source files from the given path. (recursive)
`;


const OPTIONS_TREE = 'tree-v2.json';


const TARGET_DIRECTORY = 'build/api/';


/* *
 *
 *  Functions
 *
 * */


/**
 * Creates API docs.
 *
 * @return {Promise}
 * Promise to keep.
 */
async function apiDocs() {
    const ProcessLib = require('../libs/process');
    const Yargs = require('yargs');

    const args = Yargs.argv;

    if (args.info) {
        process.stdout.write(INFO);
        return;
    }

    const source = (args.source || 'ts');

    await ProcessLib.exec(
        'npx ts-node tools/api-docs/api-classes.ts' +
            ` --source "${source}"`
    );

    await ProcessLib.exec(
        'npx ts-node tools/api-docs/api-options.ts' +
            ` --source "${source}"`
    );

    await createApiDocumentation();

}


/**
 * Creates the Highcharts API
 *
 * @return {Promise<void>}
 *         Promise to keep
 */
function createApiDocumentation() {

    const apidocs = require('@highcharts/highcharts-documentation-generators')
            .ApiDocs,
        argv = require('yargs').argv,
        fs = require('fs'),
        log = require('../libs/log');

    return new Promise((resolve, reject) => {

        log.message('Generating', TARGET_DIRECTORY + '...');

        const sourceJSON = JSON.parse(fs.readFileSync(OPTIONS_TREE)),
            products = argv.products && argv.products.split(',');

        apidocs(sourceJSON, TARGET_DIRECTORY, products, error => {

            if (error) {
                log.failure(error);
                reject(error);
            } else {
                log.success('Created', TARGET_DIRECTORY);
                resolve();
            }
        });
    });
}


/* *
 *
 *  Tasks
 *
 * */

Gulp.task('api-docs', apiDocs);
