/* *
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

import type AnnotationChart from './AnnotationChart';
import type Annotation from './Annotation';
import type Controllable from './Controllables/Controllable';
import type ControlPointOptions from './ControlPointOptions';
import type ControlTarget from './ControlTarget';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';

import EventEmitter from './EventEmitter.js';
import U from '../../Shared/Utilities.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './MockPointOptions' {
    interface MockPointOptions {
        controlPoint?: ControlPointOptions;
    }
}

/* *
 *
 *  Class
 *
 * */

/**
 * A control point class which is a connection between controllable
 * transform methods and a user actions.
 *
 * @requires modules/annotations
 *
 * @class
 * @name Highcharts.AnnotationControlPoint
 *
 * @hideconstructor
 *
 * @param {Highcharts.Chart} chart
 * A chart instance.
 *
 * @param {Highcharts.AnnotationControllable} target
 * A controllable instance which is a target for a control point.
 *
 * @param {Highcharts.AnnotationControlPointOptionsObject} options
 * An options object.
 *
 * @param {number} [index]
 * Point index.
 */
class ControlPoint extends EventEmitter {

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: AnnotationChart,
        target: ControlTarget,
        options: ControlPointOptions,
        index?: number
    ) {
        super();

        this.chart = chart;
        this.target = target;
        this.options = options;
        this.index = pick((options as any).index, index);
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: AnnotationChart;

    public graphic: SVGElement = void 0 as any;

    public index: number;

    /**
     * List of events for `anntation.options.events` that should not be
     * added to `annotation.graphic` but to the `annotation`.
     * @private
     * @name Highcharts.AnnotationControlPoint#nonDOMEvents
     * @type {Array<string>}
     */
    public nonDOMEvents = ['drag'];

    public options: ControlPointOptions;

    public target: ControlTarget;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Destroy the control point.
     * @private
     */
    public destroy(): void {
        super.destroy();

        if (this.graphic) {
            this.graphic = this.graphic.destroy() as any;
        }

        this.chart = null as any;
        this.target = null as any;
        this.options = null as any;
    }

    /**
     * Redraw the control point.
     * @private
     * @param {boolean} [animation]
     */
    public redraw(animation?: boolean): void {
        this.graphic[animation ? 'animate' : 'attr'](
            this.options.positioner.call(this, this.target)
        );
    }

    /**
     * Render the control point.
     * @private
     */
    public render(): void {
        const chart = this.chart,
            options = this.options;

        this.graphic = chart.renderer
            .symbol(
                options.symbol,
                0,
                0,
                options.width,
                options.height
            )
            .add(chart.controlPointsGroup)
            .css(options.style);

        this.setVisibility(options.visible);
        // npm test -- --tests "highcharts/annotations-advanced/*"
        this.addEvents();
    }

    /**
     * Set the visibility of the control point.
     *
     * @function Highcharts.AnnotationControlPoint#setVisibility
     *
     * @param {boolean} visible
     * Visibility of the control point.
     *
     */
    public setVisibility(visible: boolean): void {
        this.graphic[visible ? 'show' : 'hide']();
        this.options.visible = visible as any;
    }

    /**
     * Update the control point.
     *
     * @function Highcharts.AnnotationControlPoint#update
     *
     * @param {Partial<Highcharts.AnnotationControlPointOptionsObject>} userOptions
     * New options for the control point.
     */
    public update(
        userOptions: Partial<ControlPointOptions>
    ): void {
        const chart = this.chart,
            target = this.target,
            index = this.index,
            options = merge(true, this.options, userOptions);

        this.destroy();
        this.constructor(chart, target, options, index);
        (this.render as any)(chart.controlPointsGroup);
        this.redraw();
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default ControlPoint;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Callback to modify annotation's possitioner controls.
 *
 * @callback Highcharts.AnnotationControlPointPositionerFunction
 * @param {Highcharts.AnnotationControlPoint} this
 * @param {Highcharts.AnnotationControllable} target
 * @return {Highcharts.PositionObject}
 */

(''); // keeps doclets above in JS file
