/*
 * Copyright (C) Highsoft AS
 */

/* eslint-disable func-style, no-use-before-define, quotes */


/* *
 *
 *  Imports
 *
 * */


const fs = require('fs');
const gulp = require('gulp');
const path = require('path');


/* *
 *
 *  Constants
 *
 * */


const HELP_MESSAGE = [
    'Uploads API documentation of "build/api" folder.',
    '',
    '--bucket  S3 bucket to upload to.',
    '--docs    Subfolders of "build/api" to upload. (optional)',
    '--dryrun  Test run with "tmp/s3" instead of uploading. (optional)',
    '--helpme  This help.',
    '--profile AWS profile to load from AWS credentials file. If no profile',
    '          is provided the default profile or standard AWS environment',
    '          variables for credentials will be used. (optional)',
    '--region  AWS region of S3 bucket. (optional)',
    '--speak   Says if task failed or succeeded. (optional)',
    '--sync    Synchronize the S3 bucket; deletes remote files that are not',
    '          found in the local folder. (optional)'
].join('\n');

const HTML_HEAD_STATIC = [
    [
        '',
        '<script',
        'id="Cookiebot"',
        'src="https://consent.cookiebot.com/uc.js"',
        'data-cbid="8be0770c-8b7f-4e2d-aeb5-2cfded81e177"',
        'data-blockingmode="auto"',
        'type="text/javascript"',
        '></script>'
    ].join('\n        '),
    [
        '',
        '<!-- Google Tag Manager -->',
        `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':`,
        `new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],`,
        `j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=`,
        `'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);`,
        `})(window,document,'script','dataLayer','GTM-5WLVCCK');</script>`,
        `<!-- End Google Tag Manager -->`
    ].join('\n        ')
].join('\n');

const MIME_TYPE = {
    '.css': 'text/css',
    '.eot': 'application/vnd.ms-fontobject',
    '.gif': 'image/gif',
    '.htm': 'text/html',
    '.html': 'text/html',
    '.php': 'text/plain',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ttf': 'application/font-sfnt',
    '.woff': 'application/font-woff',
    '.woff2': 'application/font-woff',
    '.zip': 'application/zip'
};

const SOURCE_ROOT = 'build/api';

const TEST_ROOT = 'build/api-test';


/* *
 *
 *  Functions
 *
 * */


/**
 * Updates some file content with additional HTML file content.
 *
 * @param {string} filePath
 * Local source path of the file.
 *
 * @param {Buffer} fileContent
 * File content to update.
 *
 * @return {Buffer}
 * Updated file content.
 */
function updateFileContent(filePath, fileContent) {
    const basename = path.basename(filePath);

    switch (path.extname(filePath)) {
        case '.htm':
        case '.html':
            if (
                !/^(?:(?:foot|head)(?:er)?|index)|-frame\.html?/.test(basename) &&
                !fileContent.includes('<frame') &&
                !fileContent.includes('<iframe')
            ) {
                fileContent = Buffer.from(
                    fileContent
                        .toString()
                        .replace(/^(.*\<\/head\>.*)$/m, HTML_HEAD_STATIC + '\n$1')
                );
            }
            break;
        default:
    }

    return fileContent;
}


async function uploadSourceItems(sourceItems) {
    const uploadS3 = require('./lib/uploadS3');
    const fsLib = require('../libs/fs');
    const {
        bucket,
        dryrun,
        profile,
        region,
        sync
    } = require('yargs').argv;

    const session = await uploadS3.startS3Session(
        bucket,
        profile,
        region,
        dryrun
    );

    for (const sourceItem of sourceItems) {
        if (fsLib.isFile(sourceItem)) {
            await uploadS3.uploadFile(
                sourceItem,
                path.relative(SOURCE_ROOT, sourceItem),
                session,
                updateFileContent
            );
        } else if (
            sync &&
                !sourceItem.endsWith('zips')
        ) {
            await uploadS3.synchronizeDirectory(
                sourceItem,
                path.relative(SOURCE_ROOT, sourceItem),
                session,
                updateFileContent
            );
        } else {
            await uploadS3.uploadDirectory(
                sourceItem,
                path.relative(SOURCE_ROOT, sourceItem),
                session,
                updateFileContent
            );
        }
    }


}

/* *
 *
 *  Task
 *
 * */


/**
 * Uploads API documentation.
 *
 * @return {Promise}
 * Promise to keep.
 */
async function apiUpload() {
    const fsLib = require('../libs/fs');
    const log = require('../libs/log');
    const {
        bucket,
        docs,
        dryrun,
        helpme,
        speak,
        sync
    } = require('yargs').argv;

    if (helpme) {
        // eslint-disable-next-line no-console
        console.log(HELP_MESSAGE);
        return Promise.resolve();
    }

    if (!bucket && !dryrun) {
        throw new Error('No --bucket specified.');
    }

    if (
        !fs.existsSync(SOURCE_ROOT) ||
        !fs.lstatSync(SOURCE_ROOT).isDirectory()
    ) {
        throw new Error(`Source directory "${SOURCE_ROOT}" not found.`);
    }

    const sourceItems = (
        typeof docs === 'string' ?
            docs.split(',').map(folder => path.join(SOURCE_ROOT, folder)) :
            fsLib.getDirectoryPaths(SOURCE_ROOT)
    );

    try {
        await uploadSourceItems(sourceItems);

        log.success('Done.');

        if (speak) {
            log.say(`${sync ? 'Synchronization' : 'Upload'} done.`);
        }
    } catch (error) {

        log.failure(error);

        if (speak) {
            log.say(`${sync ? 'Synchronization' : 'Upload'} failed!`);
        }
    }

    return void 0;
}


/* *
 *
 *  Tasks
 *
 * */


gulp.task('api-upload', apiUpload);

gulp.task('api-upload-zips', async () => {
    const glob = require('glob');
    const zips = glob.sync(`${SOURCE_ROOT}/zips/**/*.zip`);

    await uploadSourceItems(zips);
});
