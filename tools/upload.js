/* eslint-env node, es6 */
/* eslint-disable */

'use strict';

const isString = (x) => typeof x === 'string';
const isFunction = (x) => typeof x === 'function';
const isArray = (x) => Array.isArray(x);

const fs = require('fs');

const asyncForeach = (arr, fn) => {
    const length = arr.length;
    const generator = (j) => {
        let promise;
        if (j < length) {
            promise = fn(arr[j], j, arr).then(() => generator(j + 1));
        }
        return promise;
    };
    return generator(0);
};

const asyncBatchForeach = (batchSize, arr, fn) => {
    const length = arr.length;
    const generator = (from, to) => {
        let result;
        if (from < length) {
            const batch = arr.slice(from, to);
            const promises = batch.map((el, i) => fn(el, from + i, arr));
            const next = () => generator(to, to + batchSize);
            result = Promise.all(promises).then(next);
        }
        return result;
    };
    return generator(0, batchSize);
};

const uploadFiles = (params) => {
    const aws = require('aws-sdk');
    const mimeType = {
        css: 'text/css',
        eot: 'application/vnd.ms-fontobject',
        gif: 'image/gif',
        html: 'text/html',
        htm: 'text/html',
        php: 'text/plain',
        ico: 'image/x-icon',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        js: 'text/javascript',
        json: 'application/json',
        png: 'image/png',
        svg: 'image/svg+xml',
        ttf: 'application/font-sfnt',
        woff: 'application/font-woff',
        woff2: 'application/font-woff',
        zip: 'application/zip'
    };
    const {
        batchSize,
        bucket,
        profile,
        callback,
        contentCallback,
        onError = Promise.reject,
        files,
        s3Params = {}
    } = params;
    const errors = [];
    let result;
    if (isString(bucket) && isArray(files)) {
        if (profile) {
            aws.config.credentials = new aws.SharedIniFileCredentials({
                profile
            });
            if (!aws.config.credentials.accessKeyId) {
                return Promise.reject(
                    new Error('No accessKeyId found for profile ' + profile)
                );
            }
        }
        const s3 = new aws.S3();
        const s3Put = (filename, data, mime, s3Params = {}) => {
            return new Promise((resolve, reject) => {
                s3.putObject(
                    {
                        Bucket: bucket,
                        Key: filename,
                        Body: data,
                        ContentType: mime,
                        ACL: 'public-read',
                        ...s3Params
                    },
                    (err, data) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(data);
                    }
                );
            });
        };

        const uploadFile = (file) => {
            const { from, to } = file;
            let filePromise;
            if (isString(from) && isString(to)) {
                // empty encoding -> read as binary buffer
                let content;
                try {
                    content = fs.readFileSync(from, '');
                    if (contentCallback) {
                        content = contentCallback(from, content);
                    }
                } catch (err) {
                    errors.push(err);
                }

                const fileType = from.split('.').pop();
                const fileMime = mimeType[fileType];
                if (content && content.length > 0) {
                    filePromise = s3Put(to, content, fileMime, s3Params)
                        .then(
                            () =>
                                isFunction(callback) &&
                                callback(from, to, fileMime)
                        )
                        .catch((err) => {
                            const error = {
                                message: `S3: ${
                                    (err.pri && err.pri.message) ||
                                    (err.internal && err.internal.message)
                                }`,
                                from,
                                to
                            };
                            errors.push(error);
                            return onError(error);
                        });
                } else {
                    const error = {
                        message: 'Path is not a file',
                        from,
                        to
                    };
                    errors.push(error);
                    filePromise = onError(error);
                }
            } else {
                const error = {
                    message: 'Invalid file information!',
                    from,
                    to
                };
                errors.push(error);
                filePromise = onError(error);
            }
            return filePromise;
        };
        result = asyncBatchForeach(batchSize, files, uploadFile).then(() => ({
            errors
        }));
    } else {
        result = Promise.reject(new Error());
    }
    return result;
};

module.exports = {
    asyncForeach,
    uploadFiles
};
