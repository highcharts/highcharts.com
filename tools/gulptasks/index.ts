/*
 * Copyright (C) Highsoft AS
 */

/* eslint quote-props: 0 */

'use strict';


/* *
 *
 *  Gulp 4+ Tasks
 *
 * */


export { apiTree } from './apiTree';


/* *
 *
 *  Default Task
 *
 * */


export default async function () {
    process.stdout.write('Hint: npm run gulp-ts -- [task]\n');
}
