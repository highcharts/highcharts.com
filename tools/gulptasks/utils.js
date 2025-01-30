/*
 * Copyright (C) Highsoft AS
 */

/* *
 *
 *  Constants
 *
 * */
const PRODUCTS = ['Highcharts', 'Grid'];

/**
 * The validation of product name.
 * @param {string} name
 *         Name of product
 * @return {Promise<void>}
 *    Promise to keep
 */
function validateProduct(name) {
    const logLib = require('../libs/log');

    if (PRODUCTS.indexOf(name || 'Highcharts') < 0) {
        logLib.warn('Cannot find a product: ' + name + '.');
        return false;
    }

    return true;
}

/* *
 *
 *  Exports
 *
 * */


module.exports = {
    validateProduct
};
