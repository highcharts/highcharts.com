/*
 * Copyright (C) Highsoft AS
 */

/* eslint-disable func-style, no-use-before-define, quotes */


/* *
 *
 *  Imports
 *
 * */


import * as FS from 'node:fs';

import Path from 'node:path';


/* *
 *
 *  Constants
 *
 * */


const INFO = `
npx gulp api-tree [OPTIONS]

OPTIONS:
  --info           This information.
  --debug          Includes source code of the related node.
  --source [path]  Only loads source files from the given path. (recursive)
`;


/* *
 *
 *  Functions
 *
 * */


function log(...messages: Array<string>) {
    const time = new Date().toISOString().substring(11, 19);
    process.stdout.write(`[${time}] ${messages.join(' ')}\n`, 'utf8');
}


/* *
 *
 *  Task
 *
 * */


/**
 * Creates an API tree.
 *
 * @todo filter out private members and options
 *
 * @return {Promise}
 * Promise to keep.
 */
export async function apiTree() {
    const TSLib = await import('../libs/TS');
    const argv = await (await import('yargs')).default(process.argv).argv;

    if (argv.info) {
        process.stdout.write(INFO);
        return;
    }

    let singleFile = false;
    let moduleSource = Path.join('ts', 'Core');
    let optionSource = 'ts';

    if (typeof argv.source === 'string') {
        singleFile = FS.lstatSync(argv.source).isFile();
        moduleSource = argv.source;
        optionSource = argv.source;
    }

    const moduleFiles = (
        singleFile ?
            [moduleSource] :
            FS
                .readdirSync(
                    moduleSource,
                    {
                        encoding: 'utf8',
                        recursive: true
                    }
                )
                .map(path => Path.join(moduleSource, path))
                .filter(path => (
                    path.endsWith('.ts') &&
                    !(
                        path.endsWith('.src.ts') ||
                        path.endsWith('Options.d.ts') ||
                        path.endsWith('Options.ts')
                    )
                ))
    );
    const optionFiles = (
        singleFile ?
            [optionSource] :
            FS
                .readdirSync(
                    moduleSource,
                    {
                        encoding: 'utf8',
                        recursive: true
                    }
                )
                .map(path => Path.join(moduleSource, path))
                .filter(path => (
                    path.endsWith('Options.d.ts') ||
                    path.endsWith('Options.ts')
                ))
    );

    log(`Parsing ${moduleFiles.length} module files ...`);

    const moduleTree: Record<string, object> = {
        _meta: {
            version: JSON
                .parse(FS.readFileSync('package.json', 'utf8'))
                .version
        }
    };

    for (const file of moduleFiles) {
        moduleTree[file] = TSLib
            .getSourceInfo(file, FS.readFileSync(file, 'utf8'), !!argv.debug);
    }

    log('Done.');

    log(`Writing tree-modules.json ...`);

    FS.writeFileSync('tree-modules.json', JSON.stringify(moduleTree), 'utf8');

    log('Done.');

    log(`Parsing ${optionFiles.length} option files ...`);

    const optionTree: Record<string, object> = {
        _meta: {
            version: JSON
                .parse(FS.readFileSync('package.json', 'utf8'))
                .version
        }
    };

    for (const file of optionFiles) {
        optionTree[file] = TSLib
            .getSourceInfo(file, FS.readFileSync(file, 'utf8'), !!argv.debug);
    }

    log('Done.');

    log(`Writing tree-options.json ...`);

    FS.writeFileSync('tree-options.json', JSON.stringify(optionTree), 'utf8');

    log('Done.');

}
