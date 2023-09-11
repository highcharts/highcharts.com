/* *
 *
 *  (c) 2009-2021 Øystein Moseng
 *
 *  Class that can keep track of events added, and clean them up on destroy.
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

import type EventCallback from '../../Core/EventCallback';

import H from '../../Core/Globals.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
const { addEvent } = EH;

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 */
class EventProvider {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor() {
        this.eventRemovers = [];
    }

    /* *
     *
     *  Properties
     *
     * */

    public eventRemovers: Array<Function>;

    /* *
     *
     *  Functions
     *
     * */

    /* eslint-disable valid-jsdoc */

    public addEvent<T>(
        el: (Class<T>|T),
        type: string,
        fn: (EventCallback<T>|Function),
        options?: U.EventOptions
    ): Function;
    /**
     * Add an event to an element and keep track of it for later removal.
     * Same args as Highcharts.addEvent.
     * @private
     */
    public addEvent(): Function {
        const remover = addEvent.apply(H, arguments);
        this.eventRemovers.push(remover);
        return remover;
    }

    /**
     * Remove all added events.
     * @private
     */
    public removeAddedEvents(): void {
        this.eventRemovers.forEach((remover): void => remover());
        this.eventRemovers = [];
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default EventProvider;
