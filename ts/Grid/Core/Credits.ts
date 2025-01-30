/* *
 *
 *  Grid Credits class
 *
 *  (c) 2020-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type { CreditsOptions } from './Options';
import type Grid from './Grid';

import Globals from './Globals.js';
import GridUtils from './GridUtils.js';

const { makeHTMLElement } = GridUtils;

/* *
 *
 *  Class
 *
 * */

/**
 * Represents a credits in the data grid.
 */
class Credits {

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The Grid instance which the credits belong to.
     */
    public grid: Grid;

    /**
     * The credits container HTML element.
     */
    public containerElement: HTMLElement;

    /**
     * The credits content HTML element.
     */
    public textElement: HTMLElement;

    /**
     * The options for the credits.
     */
    public options: CreditsOptions;


    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Construct the credits.
     *
     * @param grid
     * The Grid instance which the credits belong to.
     */
    constructor(grid: Grid) {
        this.grid = grid;
        this.options = grid.options?.credits ?? {};

        this.containerElement = makeHTMLElement('div', {
            className: Globals.getClassName('creditsContainer')
        });

        this.textElement = makeHTMLElement<HTMLAnchorElement>('a', {
            className: Globals.getClassName('creditsText')
        }, this.containerElement);
        this.textElement.setAttribute('target', '_top');

        this.render();
    }


    /* *
    *
    *  Methods
    *
    * */

    /**
     * Set the content of the credits.
     */
    private setContent(): void {
        const { text, href } = this.options;

        this.textElement.innerText = text || '';
        this.textElement.setAttribute('href', href || '');
    }

    /**
     * Append the credits to the container. The position of the credits is
     * determined by the `position` option.
     */
    private appendToContainer(): void {
        const { position } = this.options;

        if (position === 'top') {
            // Append the credits to the top of the table.
            this.grid.contentWrapper?.prepend(this.containerElement);
            return;
        }

        // Append the credits to the bottom of the table.
        this.grid.contentWrapper?.appendChild(this.containerElement);
    }

    /**
     * Update the credits with new options.
     *
     * @param options
     * The new options for the credits.
     *
     * @param render
     * Whether to render the credits after the update.
     */
    public update(
        options: Partial<CreditsOptions> | undefined,
        render = true
    ): void {
        if (options) {
            this.grid.update({
                credits: options
            }, false);

            this.options = this.grid.options?.credits ?? {};
        }

        if (render) {
            this.render();
        }
    }

    /**
     * Render the credits. If the credits are disabled, they will be removed
     * from the container. If also reflows the viewport dimensions.
     */
    public render(): void {
        const enabled = this.options.enabled ?? false;

        this.containerElement.remove();

        if (enabled) {
            this.setContent();
            this.appendToContainer();
        } else {
            this.destroy();
        }

        this.grid.viewport?.reflow();
    }

    /**
     * Get the height of the credits container.
     */
    public getHeight(): number {
        return this.containerElement.offsetHeight;
    }

    /**
     * Destroy the credits. The credits will be removed from the container and
     * the reference to the credits will be deleted from the Grid instance
     * it belongs to.
     */
    public destroy(): void {
        this.containerElement.remove();
        delete this.grid.credits;
    }
}


/* *
 *
 *  Class Namespace
 *
 * */

namespace Credits {

}


/* *
 *
 *  Default Export
 *
 * */

export default Credits;
