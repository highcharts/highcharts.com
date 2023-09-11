/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Create announcer to speak messages to screen readers and other AT.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Chart from '../../Core/Chart/Chart';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';

import AST from '../../Core/Renderer/HTML/AST.js';
import DOMElementProvider from './DOMElementProvider.js';
import H from '../../Core/Globals.js';
const { doc } = H;
import HU from './HTMLUtilities.js';
const {
    addClass,
    visuallyHideElement
} = HU;
import U from '../../Shared/Utilities.js';
const { attr } = U;

/* *
 *
 *  Declarations
 *
 * */

/**
 * Internal types.
 * @private
 */
declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        announcerContainer?: HTMLDOMElement;
    }
}

/* *
 *
 *  Class
 *
 * */

class Announcer {

    /* *
     *
     *  Properties
     *
     * */

    private domElementProvider: DOMElementProvider;
    private announceRegion: HTMLDOMElement;
    private clearAnnouncementRegionTimer?: number;

    /* *
     *
     *  Constructor
     *
     * */

    constructor(
        private chart: Chart,
        type: Announcer.Type
    ) {
        this.domElementProvider = new DOMElementProvider();
        this.announceRegion = this.addAnnounceRegion(type);
    }

    /* *
     *
     *  Functions
     *
     * */

    public destroy(): void {
        this.domElementProvider.destroyCreatedElements();
    }

    public announce(message: string): void {
        AST.setElementHTML(this.announceRegion, message);

        // Delete contents after a little while to avoid user finding the live
        // region in the DOM.
        if (this.clearAnnouncementRegionTimer) {
            clearTimeout(this.clearAnnouncementRegionTimer);
        }
        this.clearAnnouncementRegionTimer = setTimeout((): void => {
            this.announceRegion.innerHTML = AST.emptyHTML;
            delete this.clearAnnouncementRegionTimer;
        }, 1000);
    }

    private addAnnounceRegion(type: Announcer.Type): HTMLDOMElement {
        const chartContainer = (
                this.chart.announcerContainer || this.createAnnouncerContainer()
            ),
            div = this.domElementProvider.createElement('div');

        attr(div, {
            'aria-hidden': false,
            'aria-live': type,
            'aria-atomic': true
        });

        if (this.chart.styledMode) {
            addClass(div, 'highcharts-visually-hidden');
        } else {
            visuallyHideElement(div);
        }

        chartContainer.appendChild(div);
        return div;
    }

    private createAnnouncerContainer(): HTMLDOMElement {
        const chart = this.chart,
            container = doc.createElement('div');

        attr(container, {
            'aria-hidden': false,
            'class': 'highcharts-announcer-container'
        });
        container.style.position = 'relative';

        chart.renderTo.insertBefore(container, chart.renderTo.firstChild);
        chart.announcerContainer = container;
        return container;
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace Announcer {
    export type Type = ('assertive'|'polite');
}

/* *
 *
 *  Default Export
 *
 * */

export default Announcer;
