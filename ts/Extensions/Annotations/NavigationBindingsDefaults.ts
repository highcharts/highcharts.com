/* *
 *
 *  (c) 2009-2021 Highsoft, Black Label
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

import type Annotation from './Annotation';
import type ControllableEllipse from './Controllables/ControllableEllipse';
import type {
    LangOptions,
    NavigationOptions
} from './NavigationBindingsOptions';
import type MockPointOptions from './MockPointOptions';
import type NavigationBindings from './NavigationBindings';
import type PointerEvent from '../../Core/PointerEvent';

import NBU from './NavigationBindingsUtilities.js';
const { getAssignedAxis } = NBU;
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
const { isNumber } = TC;
const { merge } = OH;

/* *
 *
 *  Constants
 *
 * */

/**
 * @optionparent lang
 */
const lang: LangOptions = {

    /**
     * Configure the Popup strings in the chart. Requires the
     * `annotations.js` or `annotations-advanced.src.js` module to be
     * loaded.
     * @since   7.0.0
     * @product highcharts highstock
     */
    navigation: {

        /**
         * Translations for all field names used in popup.
         *
         * @product highcharts highstock
         */
        popup: {
            simpleShapes: 'Simple shapes',
            lines: 'Lines',
            circle: 'Circle',
            ellipse: 'Ellipse',
            rectangle: 'Rectangle',
            label: 'Label',
            shapeOptions: 'Shape options',
            typeOptions: 'Details',
            fill: 'Fill',
            format: 'Text',
            strokeWidth: 'Line width',
            stroke: 'Line color',
            title: 'Title',
            name: 'Name',
            labelOptions: 'Label options',
            labels: 'Labels',
            backgroundColor: 'Background color',
            backgroundColors: 'Background colors',
            borderColor: 'Border color',
            borderRadius: 'Border radius',
            borderWidth: 'Border width',
            style: 'Style',
            padding: 'Padding',
            fontSize: 'Font size',
            color: 'Color',
            height: 'Height',
            shapes: 'Shape options'
        }

    }

};

/**
 * @optionparent navigation
 * @product      highcharts highstock
 */
const navigation: NavigationOptions = {
    /**
     * A CSS class name where all bindings will be attached to. Multiple
     * charts on the same page should have separate class names to prevent
     * duplicating events.
     *
     * Default value of versions < 7.0.4 `highcharts-bindings-wrapper`
     *
     * @since     7.0.0
     * @type      {string}
     */
    bindingsClassName: 'highcharts-bindings-container',
    /**
     * Bindings definitions for custom HTML buttons. Each binding implements
     * simple event-driven interface:
     *
     * - `className`: classname used to bind event to
     *
     * - `init`: initial event, fired on button click
     *
     * - `start`: fired on first click on a chart
     *
     * - `steps`: array of sequential events fired one after another on each
     *   of users clicks
     *
     * - `end`: last event to be called after last step event
     *
     * @type         {Highcharts.Dictionary<Highcharts.NavigationBindingsOptionsObject>|*}
     *
     * @sample {highstock} stock/stocktools/stocktools-thresholds
     *               Custom bindings
     * @sample {highcharts} highcharts/annotations/bindings/
     *               Simple binding
     * @sample {highcharts} highcharts/annotations/bindings-custom-annotation/
     *               Custom annotation binding
     *
     * @since        7.0.0
     * @requires     modules/annotations
     * @product      highcharts highstock
     */
    bindings: {
        /**
         * A circle annotation bindings. Includes `start` and one event in
         * `steps` array.
         *
         * @type    {Highcharts.NavigationBindingsOptionsObject}
         * @default {"className": "highcharts-circle-annotation", "start": function() {}, "steps": [function() {}], "annotationsOptions": {}}
         */
        circleAnnotation: {
            /** @ignore-option */
            className: 'highcharts-circle-annotation',
            /** @ignore-option */
            start: function (
                this: NavigationBindings,
                e: PointerEvent
            ): Annotation|void {
                const coords = this.chart.pointer.getCoordinates(e),
                    coordsX = getAssignedAxis(coords.xAxis),
                    coordsY = getAssignedAxis(coords.yAxis),
                    navigation = this.chart.options.navigation;

                // Exit if clicked out of axes area
                if (!coordsX || !coordsY) {
                    return;
                }

                return this.chart.addAnnotation(
                    merge(
                        {
                            langKey: 'circle',
                            type: 'basicAnnotation',
                            shapes: [{
                                type: 'circle',
                                point: {
                                    x: coordsX.value,
                                    y: coordsY.value,
                                    xAxis: coordsX.axis.index,
                                    yAxis: coordsY.axis.index
                                },
                                r: 5
                            }]
                        },
                        navigation.annotationsOptions,
                        (navigation.bindings as any).circleAnnotation
                            .annotationsOptions
                    )
                );
            },
            /** @ignore-option */
            steps: [
                function (
                    this: NavigationBindings,
                    e: PointerEvent,
                    annotation: Annotation
                ): void {
                    const shapes = annotation.options.shapes,
                        mockPointOpts = (
                            (shapes && shapes[0] && shapes[0].point) ||
                            {}
                        ) as MockPointOptions;

                    let distance: (number|undefined);

                    if (
                        isNumber(mockPointOpts.xAxis) &&
                        isNumber(mockPointOpts.yAxis)
                    ) {
                        const inverted = this.chart.inverted,
                            x = this.chart.xAxis[mockPointOpts.xAxis]
                                .toPixels(mockPointOpts.x),
                            y = this.chart.yAxis[mockPointOpts.yAxis]
                                .toPixels(mockPointOpts.y);

                        distance = Math.max(
                            Math.sqrt(
                                Math.pow(
                                    inverted ? y - e.chartX : x - e.chartX,
                                    2
                                ) +
                                Math.pow(
                                    inverted ? x - e.chartY : y - e.chartY,
                                    2
                                )
                            ),
                            5
                        );
                    }

                    annotation.update({
                        shapes: [{
                            r: distance
                        }]
                    });
                }
            ]
        },
        /**
         * A ellipse annotation bindings. Includes `start` and two events in
         * `steps` array. First updates the second point, responsible for a
         * rx width, and second updates the ry width.
         *
         * @type    {Highcharts.NavigationBindingsOptionsObject}
         * @default {"className": "highcharts-ellipse-annotation", "start": function() {}, "steps": [function() {}], "annotationsOptions": {}}
         */
        ellipseAnnotation: {
            className: 'highcharts-ellipse-annotation',
            start: function (
                this: NavigationBindings,
                e: PointerEvent
            ): Annotation|void {
                const coords = this.chart.pointer.getCoordinates(e),
                    coordsX = getAssignedAxis(coords.xAxis),
                    coordsY = getAssignedAxis(coords.yAxis),
                    navigation = this.chart.options.navigation;

                if (!coordsX || !coordsY) {
                    return;
                }

                return this.chart.addAnnotation(
                    merge(
                        {
                            langKey: 'ellipse',
                            type: 'basicAnnotation',
                            shapes: [
                                {
                                    type: 'ellipse',
                                    xAxis: coordsX.axis.index,
                                    yAxis: coordsY.axis.index,
                                    points: [{
                                        x: coordsX.value,
                                        y: coordsY.value
                                    }, {
                                        x: coordsX.value,
                                        y: coordsY.value
                                    }],
                                    ry: 1
                                }
                            ]
                        },
                        navigation.annotationsOptions,
                        (navigation.bindings as any).ellipseAnnotation
                            .annotationOptions
                    )
                );
            },
            steps: [
                function (
                    this: NavigationBindings,
                    e: PointerEvent,
                    annotation: Annotation
                ): void {
                    const target = (
                            annotation.shapes[0] as ControllableEllipse
                        ),
                        position = target.getAbsolutePosition(
                            target.points[1]
                        );

                    target.translatePoint(
                        e.chartX - position.x,
                        e.chartY - position.y,
                        1
                    );

                    target.redraw(false);
                },
                function (
                    this: NavigationBindings,
                    e: PointerEvent,
                    annotation: Annotation
                ): void {
                    const target =
                            annotation.shapes[0] as ControllableEllipse,
                        position =
                            target.getAbsolutePosition(target.points[0]),
                        position2 =
                            target.getAbsolutePosition(target.points[1]),
                        newR = target.getDistanceFromLine(
                            position,
                            position2,
                            e.chartX,
                            e.chartY
                        ),
                        yAxis = target.getYAxis(),
                        newRY = Math.abs(
                            yAxis.toValue(0) - yAxis.toValue(newR)
                        );

                    target.setYRadius(newRY);
                    target.redraw(false);
                }
            ]
        },
        /**
         * A rectangle annotation bindings. Includes `start` and one event
         * in `steps` array.
         *
         * @type    {Highcharts.NavigationBindingsOptionsObject}
         * @default {"className": "highcharts-rectangle-annotation", "start": function() {}, "steps": [function() {}], "annotationsOptions": {}}
         */
        rectangleAnnotation: {
            /** @ignore-option */
            className: 'highcharts-rectangle-annotation',
            /** @ignore-option */
            start: function (
                this: NavigationBindings,
                e: PointerEvent
            ): Annotation|void {
                const coords = this.chart.pointer.getCoordinates(e),
                    coordsX = getAssignedAxis(coords.xAxis),
                    coordsY = getAssignedAxis(coords.yAxis);

                // Exit if clicked out of axes area
                if (!coordsX || !coordsY) {
                    return;
                }

                const x = coordsX.value,
                    y = coordsY.value,
                    xAxis = coordsX.axis.index,
                    yAxis = coordsY.axis.index,
                    navigation = this.chart.options.navigation;

                return this.chart.addAnnotation(
                    merge(
                        {
                            langKey: 'rectangle',
                            type: 'basicAnnotation',
                            shapes: [{
                                type: 'path',
                                points: [
                                    { xAxis, yAxis, x, y },
                                    { xAxis, yAxis, x, y },
                                    { xAxis, yAxis, x, y },
                                    { xAxis, yAxis, x, y },
                                    { command: 'Z' }
                                ]
                            }]
                        },
                        navigation
                            .annotationsOptions,
                        (navigation
                            .bindings as any)
                            .rectangleAnnotation
                            .annotationsOptions
                    )
                );
            },
            /** @ignore-option */
            steps: [
                function (
                    this: NavigationBindings,
                    e: PointerEvent,
                    annotation: Annotation
                ): void {
                    const shapes = annotation.options.shapes,
                        points = (
                            (shapes && shapes[0] && shapes[0].points) ||
                            []
                        ) as Array<MockPointOptions>,
                        coords = this.chart.pointer.getCoordinates(e),
                        coordsX = getAssignedAxis(coords.xAxis),
                        coordsY = getAssignedAxis(coords.yAxis);

                    if (coordsX && coordsY) {
                        const x = coordsX.value,
                            y = coordsY.value;

                        // Top right point
                        points[1].x = x;
                        // Bottom right point (cursor position)
                        points[2].x = x;
                        points[2].y = y;
                        // Bottom left
                        points[3].y = y;

                        annotation.update({
                            shapes: [{
                                points: points
                            }]
                        });
                    }
                }
            ]
        },
        /**
         * A label annotation bindings. Includes `start` event only.
         *
         * @type    {Highcharts.NavigationBindingsOptionsObject}
         * @default {"className": "highcharts-label-annotation", "start": function() {}, "steps": [function() {}], "annotationsOptions": {}}
         */
        labelAnnotation: {
            /** @ignore-option */
            className: 'highcharts-label-annotation',
            /** @ignore-option */
            start: function (
                this: NavigationBindings,
                e: PointerEvent
            ): Annotation|void {
                const coords = this.chart.pointer.getCoordinates(e),
                    coordsX = getAssignedAxis(coords.xAxis),
                    coordsY = getAssignedAxis(coords.yAxis),
                    navigation = this.chart.options.navigation;

                // Exit if clicked out of axes area
                if (!coordsX || !coordsY) {
                    return;
                }

                return this.chart.addAnnotation(
                    merge(
                        {
                            langKey: 'label',
                            type: 'basicAnnotation',
                            labelOptions: {
                                format: '{y:.2f}',
                                overflow: 'none',
                                crop: true
                            },
                            labels: [{
                                point: {
                                    xAxis: coordsX.axis.index,
                                    yAxis: coordsY.axis.index,
                                    x: coordsX.value,
                                    y: coordsY.value
                                }
                            }]
                        },
                        navigation
                            .annotationsOptions,
                        (navigation
                            .bindings as any)
                            .labelAnnotation
                            .annotationsOptions
                    )
                );
            }
        } as any
    },

    /**
     * Path where Highcharts will look for icons. Change this to use icons
     * from a different server.
     *
     * @type      {string}
     * @default   https://code.highcharts.com/@product.version@/gfx/stock-icons/
     * @since     7.1.3
     * @apioption navigation.iconsURL
     */

    /**
     * A `showPopup` event. Fired when selecting for example an annotation.
     *
     * @type      {Function}
     * @apioption navigation.events.showPopup
     */

    /**
     * A `closePopup` event. Fired when Popup should be hidden, for example
     * when clicking on an annotation again.
     *
     * @type      {Function}
     * @apioption navigation.events.closePopup
     */

    /**
     * Event fired on a button click.
     *
     * @type      {Function}
     * @sample    highcharts/annotations/gui/
     *            Change icon in a dropddown on event
     * @sample    highcharts/annotations/gui-buttons/
     *            Change button class on event
     * @apioption navigation.events.selectButton
     */

    /**
     * Event fired when button state should change, for example after
     * adding an annotation.
     *
     * @type      {Function}
     * @sample    highcharts/annotations/gui/
     *            Change icon in a dropddown on event
     * @sample    highcharts/annotations/gui-buttons/
     *            Change button class on event
     * @apioption navigation.events.deselectButton
     */

    /**
     * Events to communicate between Stock Tools and custom GUI.
     *
     * @since        7.0.0
     * @product      highcharts highstock
     * @optionparent navigation.events
     */
    events: {},

    /**
     * Additional options to be merged into all annotations.
     *
     * @sample stock/stocktools/navigation-annotation-options
     *         Set red color of all line annotations
     *
     * @type      {Highcharts.AnnotationsOptions}
     * @extends   annotations
     * @exclude   crookedLine, elliottWave, fibonacci, infinityLine,
     *            measure, pitchfork, tunnel, verticalLine, basicAnnotation
     * @requires     modules/annotations
     * @apioption navigation.annotationsOptions
     */
    annotationsOptions: {
        animation: {
            defer: 0
        }
    }

};

/* *
 *
 *  Default Export
 *
 * */

const NavigationBindingDefaults = {
    lang,
    navigation
};

export default NavigationBindingDefaults;
