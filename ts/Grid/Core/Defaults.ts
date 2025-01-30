/* *
 *
 *  Grid default options
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
*  Authors:
 *  - Dawid Dragula
 *  - Sebastian Bochan
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Options from './Options';
import type Globals from './Globals';

import Utils from '../../Core/Utilities.js';

const { merge } = Utils;


/**
 * Namespace for default options.
 */
namespace Defaults {

    /**
     * Default options for the Grid.
     */
    export const defaultOptions: Globals.DeepPartial<Options> = {
        accessibility: {
            enabled: true,
            highContrastMode: 'auto',
            announcements: {
                sorting: true
            }
        },
        lang: {
            accessibility: {
                sorting: {
                    sortable: 'Sortable.',
                    announcements: {
                        ascending: 'Sorted ascending.',
                        descending: 'Sorted descending.',
                        none: 'Not sorted.'
                    }
                }
            },
            loading: 'Loading...',
            noData: 'No data to display'
        },
        time: {
            timezone: 'UTC'
        },
        rendering: {
            columns: {
                distribution: 'full'
            },
            rows: {
                bufferSize: 10,
                minVisibleRows: 2,
                strictHeights: false,
                virtualization: true
            },
            header: {
                enabled: true
            },
            theme: 'hcdg-theme-default'
        },
        credits: {
            enabled: true,
            text: 'Highcharts.com',
            href: 'https://www.highcharts.com?credits',
            position: 'bottom'
        },
        columnDefaults: {
            sorting: {
                sortable: true
            },
            resizing: true
        }
    };

    /**
     * Merge the default options with custom options. Commonly used for defining
     * reusable templates.
     *
     * @param options
     * The new custom chart options.
     */
    export function setOptions(
        options: Globals.DeepPartial<Options>
    ): void {
        merge(true, Defaults.defaultOptions, options);
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default Defaults;
