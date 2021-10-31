/* eslint func-style: 0, no-console: 0, max-len: 0 */
const gulp = require('gulp');

/**
 * Copies files given as a comma-separated list to the specified S3 bucket.
 * The destination path will be identical to the given file input path.
 * @return {Promise<*> | Promise | Promise} Promise to keep
 */
const fileUpload = () => {
    const colors = require('colors');
    const ProgressBar = require('../../progress-bar.js');
    const { uploadFiles } = require('../../upload.js');
    const argv = require('yargs').argv;
    const bucket = argv.bucket;
    const batchSize = argv.batchsize || 30000;
    const files = argv.files ? argv.files.split(',') : [];

    if (files.length <= 0) {
        throw new Error(
            'Please specify files using --files and a comma-separated list of the file paths.'
        );
    }

    if (!bucket) {
        throw new Error('Please specify destination --bucket');
    }

    const getUploadConfig = () => {
        const errors = [];
        const bar = new ProgressBar({
            error: '',
            total: files.length,
            message: '\n[:bar] - Uploading. Completed :count of :total.:error'
        });
        const doTick = () => {
            bar.tick();
        };
        const onError = (err) => {
            errors.push(`${err.message}. ${err.from} -> ${err.to}`);
            bar.tick({
                error: `\n${errors.length} file(s) errored:\n${errors.join(
                    '\n'
                )}`
            });
        };
        const params = {
            batchSize,
            bucket,
            profile: argv.profile,
            callback: doTick,
            onError
        };
        params.files = files.map((file) => ({ from: file, to: file }));
        return params;
    };

    console.log(`Started upload of ${files.length} files to ${bucket}`);
    const commands = [];
    return Promise.resolve(getUploadConfig())
        .then(uploadFiles)
        .then((result) => {
            const { errors } = result;
            if (errors.length) {
                const erroredFiles = errors.map((e) => e.from);
                console.log(`Files errored: ${erroredFiles.join(',')}`);
                commands.push(
                    `gulp upload-files --bucket ${bucket} --files ${erroredFiles.join(
                        ','
                    )}`
                );
            }
        })
        .then(() => {
            if (commands.length) {
                console.log(
                    [
                        '',
                        colors.red(
                            'Some of the uploads failed, please run the following command to retry:'
                        ),
                        commands.join(' && ')
                    ].join('\n')
                );
            }
        });
};
gulp.task('upload-files', fileUpload);
