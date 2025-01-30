/* *
 *
 *  Grid Accessibility options
 *
 *  (c) 2020-2024 Highsoft AS
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


/* *
 *
 *  Declarations
 *
 * */


/**
 * Accessibility options for the Grid.
 */
export interface A11yOptions {
    /**
     * Enable accessibility features for the Grid.
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * The default option is auto, which applies the high contrast theme the
     * user's system has a high contrast theme active.
     */
    highContrastMode?: boolean | 'auto';

    /**
     * VoiceOver announcer options for Grid actions.
     */
    announcements?: A11yAnnouncementsOptions
}

/**
 * VoiceOver announcer options for Grid actions.
 */
export interface A11yAnnouncementsOptions {
    /**
     * Enable accessibility announcements for the sorting.
     *
     * @default true
     */
    sorting?: boolean;
}

/**
 * Accessibility language options for the Grid.
 */
export interface LangAccessibilityOptions {
    /**
     * Language options for the accessibility descriptions in sorting.
     */
    sorting?: SortingLangA11yOptions;
}

/**
 * Accessibility options for the Grid sorting functionality.
 */
export interface SortingLangA11yOptions {

    /**
     * An additional hint (a visually hidden span) read by the voice over
     * after the column name.
     *
     * @default 'Sortable.'
     */
    sortable?: string;

    /**
     * Accessibility lang options for the sorting announcements.
     */
    announcements?: {

        /**
         * The message when the column was sorted in ascending order.
         *
         * @default 'Sorted ascending.'
         */
        ascending?: string;

        /**
         * The message when the column was sorted in descending order.
         *
         * @default 'Sorted descending.'
         */
        descending?: string;

        /**
         * The message when the column was unsorted.
         *
         * @default 'Not sorted.'
         */
        none?: string;
    }
}

/**
 * Accessibility options for the Grid header cell.
 */
export interface HeaderCellA11yOptions {
    /**
     * The aria description of the header cell.
     */
    description?: string;
}
