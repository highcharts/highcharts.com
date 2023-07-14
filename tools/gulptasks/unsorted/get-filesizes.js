/* eslint func-style: 0 */
const gulp = require('gulp');
/**
 * Usage: npx gulp get-filesizes --out old.json
 *
 * Options:
 *   --file     Specify which files to get filesizes of. If not specified it
 *              will default to all distributed files.
 *   --out      Specify where to store the result. Defaults "./filesizes.json"
 */
gulp.task('get-filesizes', () => {
    const {
        getFilesInFolder
    } = require('@highcharts/highcharts-assembler/src/build.js');
    const {
        getFileSizes
    } = require('./compare-filesizes.js');
    const {
        argv
    } = require('yargs');
    const isSourceFile = path => (
        path.endsWith('.src.js') && !path.includes('es-modules')
    );
    const jsFolder = './js/masters/';
    const out = argv.out || './filesizes.json';
    const files = argv.file ?
        argv.file.split(',') :
        getFilesInFolder(jsFolder, true, '').filter(isSourceFile);

    return getFileSizes(files, out);
});
