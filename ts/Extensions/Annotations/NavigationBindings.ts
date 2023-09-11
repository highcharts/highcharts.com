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
import type AnnotationChart from './AnnotationChart';
import type Chart from '../../Core/Chart/Chart';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';
import type NavigationBindingsLike from './NavigationBindingsLike';
import type NavigationBindingsOptions from './NavigationBindingsOptions';
import type NavigationOptions from '../Exporting/NavigationOptions';
import type PointerEvent from '../../Core/PointerEvent';
import type {
    default as Popup,
    PopupFieldsObject,
    PopupFieldsTree
} from './Popup/Popup';

import ChartNavigationComposition from '../../Core/Chart/ChartNavigationComposition.js';
import D from '../../Core/Defaults.js';
const { setOptions } = D;
import F from '../../Core/Templating.js';
const { format } = F;
import H from '../../Core/Globals.js';
const {
    doc,
    win
} = H;
import NavigationBindingDefaults from './NavigationBindingsDefaults.js';
import NBU from './NavigationBindingsUtilities.js';
const { getFieldType } = NBU;
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import TC from '../../Shared/Helpers/TypeChecker.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { isArray, isFunction, isNumber, isObject } = TC;
const { defined, merge, objectEach } = OH;
const { addEvent, fireEvent } = EH;
const {
    attr,
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        navigationBindings?: NavigationBindings;
        /** @requires modules/annotations */
        initNavigationBindings(): void;
    }
}

declare module '../../Core/PointerEvent' {
    interface PointerEvent {
        activeAnnotation?: boolean;
    }
}

interface NavigationBindingsButtonEventsObject {
    button: HTMLDOMElement;
    events: NavigationBindingsOptions;
}

/* *
 *
 *  Constants
 *
 * */

const composedMembers: Array<unknown> = [];

/* *
 *
 *  Functions
 *
 * */

/**
 * IE 9-11 polyfill for Element.closest():
 * @private
 */
function closestPolyfill(el: Element, s: string): (Element|null) {
    const ElementProto = win.Element.prototype,
        elementMatches =
            ElementProto.matches ||
            ElementProto.msMatchesSelector ||
            ElementProto.webkitMatchesSelector;

    let ret: (Element|null) = null;

    if (ElementProto.closest) {
        ret = ElementProto.closest.call(el, s);
    } else {
        do {
            if (elementMatches.call(el, s)) {
                return el;
            }
            el = el.parentElement || el.parentNode as any;

        } while (el !== null && el.nodeType === 1);
    }

    return ret;
}

/**
 * @private
 */
function onAnnotationRemove(
    this: Annotation
): void {
    if (this.chart.navigationBindings) {
        this.chart.navigationBindings.deselectAnnotation();
    }
}

/**
 * @private
 */
function onChartDestroy(
    this: Chart
): void {
    if (this.navigationBindings) {
        this.navigationBindings.destroy();
    }
}

/**
 * @private
 */
function onChartLoad(
    this: Chart
): void {
    const options = this.options;

    if (options && options.navigation && options.navigation.bindings) {
        this.navigationBindings = new NavigationBindings(
            this as AnnotationChart,
            options.navigation
        );
        this.navigationBindings.initEvents();
        this.navigationBindings.initUpdate();
    }
}

/**
 * @private
 */
function onChartRender(
    this: Chart
): void {
    const navigationBindings = this.navigationBindings,
        disabledClassName = 'highcharts-disabled-btn';

    if (this && navigationBindings) {
        // Check if the buttons should be enabled/disabled based on
        // visible series.

        let buttonsEnabled = false;
        this.series.forEach((series): void => {
            if (!series.options.isInternal && series.visible) {
                buttonsEnabled = true;
            }
        });

        if (
            this.navigationBindings &&
            this.navigationBindings.container &&
            this.navigationBindings.container[0]
        ) {
            const container = this.navigationBindings.container[0];

            objectEach(navigationBindings.boundClassNames, (
                value,
                key
            ): void => {

                // Get the HTML element coresponding to the className taken
                // from StockToolsBindings.
                const buttonNode = container.querySelectorAll('.' + key);

                if (buttonNode) {
                    for (let i = 0; i < buttonNode.length; i++) {
                        const button = buttonNode[i],
                            cls = button.className;
                        if (value.noDataState === 'normal') {
                            // If button has noDataState: 'normal', and has
                            // disabledClassName, remove this className.
                            if (cls.indexOf(disabledClassName) !== -1) {
                                button.classList.remove(disabledClassName);
                            }
                        } else if (!buttonsEnabled) {
                            if (cls.indexOf(disabledClassName) === -1) {
                                button.className += ' ' + disabledClassName;
                            }
                        } else {
                            // Enable all buttons by deleting the className.
                            if (cls.indexOf(disabledClassName) !== -1) {
                                button.classList.remove(disabledClassName);
                            }
                        }
                    }
                }
            });
        }
    }
}

/**
 * @private
 */
function onNavigationBindingsClosePopup(this: NavigationBindings): void {
    this.deselectAnnotation();
}

/**
 * @private
 */
function onNavigationBindingsDeselectButton(
    this: NavigationBindings
): void {
    this.selectedButtonElement = null;
}

/**
 * Show edit-annotation form:
 * @private
 */
function selectableAnnotation(annotationType: typeof Annotation): void {
    const originalClick = annotationType.prototype.defaultOptions.events &&
            annotationType.prototype.defaultOptions.events.click;

    /**
     * Select and show popup
     * @private
     */
    function selectAndShowPopup(
        this: Annotation,
        eventArguments: AnyRecord
    ): void {
        const annotation = this,
            navigation = annotation.chart.navigationBindings,
            prevAnnotation = navigation.activeAnnotation;

        if (originalClick) {
            originalClick.call(annotation, eventArguments);
        }

        if (prevAnnotation !== annotation) {
            // Select current:
            navigation.deselectAnnotation();

            navigation.activeAnnotation = annotation;
            annotation.setControlPointsVisibility(true);

            fireEvent(
                navigation,
                'showPopup',
                {
                    annotation: annotation,
                    formType: 'annotation-toolbar',
                    options: navigation.annotationToFields(annotation),
                    onSubmit: function (
                        data: PopupFieldsObject
                    ): void {
                        if (data.actionType === 'remove') {
                            navigation.activeAnnotation = false;
                            navigation.chart.removeAnnotation(annotation);
                        } else {
                            const config: PopupFieldsTree = {};

                            navigation.fieldsToOptions(
                                data.fields as Record<string, string>,
                                config
                            );
                            navigation.deselectAnnotation();

                            const typeOptions = config.typeOptions;

                            if (annotation.options.type === 'measure') {
                                // Manually disable crooshars according to
                                // stroke width of the shape:
                                (typeOptions as any).crosshairY.enabled = (
                                    (typeOptions as any).crosshairY
                                        .strokeWidth !== 0
                                );
                                (typeOptions as any).crosshairX.enabled = (
                                    (typeOptions as any).crosshairX
                                        .strokeWidth !== 0
                                );
                            }

                            annotation.update(config);
                        }
                    }
                }
            );
        } else {
            // Deselect current:
            fireEvent(navigation, 'closePopup');
        }
        // Let bubble event to chart.click:
        eventArguments.activeAnnotation = true;
    }

    // #18276, show popup on touchend, but not on touchmove
    let touchStartX: number,
        touchStartY: number;

    function saveCoords(this: Annotation, e: AnyRecord): void {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function checkForTouchmove(this: Annotation, e: AnyRecord): void {
        const hasMoved = touchStartX ? Math.sqrt(
            Math.pow(touchStartX - e.changedTouches[0].clientX, 2) +
            Math.pow(touchStartY - e.changedTouches[0].clientY, 2)
        ) >= 4 : false;

        if (!hasMoved) {
            selectAndShowPopup.call(this, e);
        }
    }

    merge(
        true,
        annotationType.prototype.defaultOptions.events,
        {
            click: selectAndShowPopup,
            touchstart: saveCoords,
            touchend: checkForTouchmove
        }
    );
}

/* *
 *
 *  Class
 *
 * */

/**
 * @private
 */
class NavigationBindings {

    /* *
     *
     *  Static Properties
     *
     * */

    // Define which options from annotations should show up in edit box:
    public static annotationsEditable = {
        // `typeOptions` are always available
        // Nested and shared options:
        nestedOptions: {
            labelOptions: ['style', 'format', 'backgroundColor'],
            labels: ['style'],
            label: ['style'],
            style: ['fontSize', 'color'],
            background: ['fill', 'strokeWidth', 'stroke'],
            innerBackground: ['fill', 'strokeWidth', 'stroke'],
            outerBackground: ['fill', 'strokeWidth', 'stroke'],
            shapeOptions: ['fill', 'strokeWidth', 'stroke'],
            shapes: ['fill', 'strokeWidth', 'stroke'],
            line: ['strokeWidth', 'stroke'],
            backgroundColors: [true as any],
            connector: ['fill', 'strokeWidth', 'stroke'],
            crosshairX: ['strokeWidth', 'stroke'],
            crosshairY: ['strokeWidth', 'stroke']
        } as Record<string, Array<string>>,
        // Simple shapes:
        circle: ['shapes'],
        ellipse: ['shapes'],
        verticalLine: [],
        label: ['labelOptions'],
        // Measure
        measure: ['background', 'crosshairY', 'crosshairX'],
        // Others:
        fibonacci: [],
        tunnel: ['background', 'line', 'height'],
        pitchfork: ['innerBackground', 'outerBackground'],
        rect: ['shapes'],
        // Crooked lines, elliots, arrows etc:
        crookedLine: [],
        basicAnnotation: ['shapes', 'labelOptions']
    };

    // Define non editable fields per annotation, for example Rectangle inherits
    // options from Measure, but crosshairs are not available
    public static annotationsNonEditable = {
        rectangle: ['crosshairX', 'crosshairY', 'labelOptions'],
        ellipse: ['labelOptions'],
        circle: ['labelOptions']
    };

    /* *
     *
     *  Static Functions
     *
     * */

    public static compose(
        AnnotationClass: typeof Annotation,
        ChartClass: typeof Chart
    ): void {

        if (pushUnique(composedMembers, AnnotationClass)) {
            addEvent(AnnotationClass, 'remove', onAnnotationRemove);

            // Basic shapes:
            selectableAnnotation(AnnotationClass);

            // Advanced annotations:
            objectEach(AnnotationClass.types, (
                annotationType
            ): void => {
                selectableAnnotation(annotationType);
            });
        }

        if (pushUnique(composedMembers, ChartClass)) {
            addEvent(ChartClass, 'destroy', onChartDestroy);
            addEvent(ChartClass, 'load', onChartLoad);
            addEvent(ChartClass, 'render', onChartRender);
        }

        if (pushUnique(composedMembers, NavigationBindings)) {
            addEvent(
                NavigationBindings,
                'closePopup',
                onNavigationBindingsClosePopup
            );
            addEvent(
                NavigationBindings,
                'deselectButton',
                onNavigationBindingsDeselectButton
            );
        }

        if (pushUnique(composedMembers, setOptions)) {
            setOptions(NavigationBindingDefaults);
        }

    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(
        chart: AnnotationChart,
        options: NavigationOptions
    ) {
        this.chart = chart;
        this.options = options;
        this.eventsToUnbind = [];
        this.container =
            this.chart.container.getElementsByClassName(
                this.options.bindingsClassName || ''
            ) as HTMLCollectionOf<HTMLElement>;

        if (!this.container.length) {
            this.container = doc.getElementsByClassName(
                this.options.bindingsClassName || ''
            ) as HTMLCollectionOf<HTMLElement>;
        }
    }

    /* *
     *
     *  Properties
     *
     * */

    public activeAnnotation?: (false|Annotation);
    public boundClassNames: Record<string, NavigationBindingsOptions> =
        void 0 as any;
    public chart: AnnotationChart;
    public container: HTMLCollectionOf<HTMLDOMElement>;
    public currentUserDetails?: Annotation;
    public eventsToUnbind: Array<Function>;
    public mouseMoveEvent?: (false|Function);
    public nextEvent?: (false|Function);
    public options: NavigationOptions;
    public popup?: Popup;
    public selectedButtonElement?: (HTMLDOMElement|null);
    public selectedButton: (NavigationBindingsOptions|null) = void 0 as any;
    public stepIndex?: number;
    public steps?: boolean;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Initi all events conencted to NavigationBindings.
     *
     * @private
     * @function Highcharts.NavigationBindings#initEvents
     */
    public initEvents(): void {
        const navigation = this,
            chart = navigation.chart,
            bindingsContainer = navigation.container,
            options = navigation.options;

        // Shorthand object for getting events for buttons:
        navigation.boundClassNames = {};

        objectEach((options.bindings || {}), (value): void => {
            navigation.boundClassNames[value.className] = value;
        });

        // Handle multiple containers with the same class names:
        ([] as Array<HTMLDOMElement>).forEach.call(
            bindingsContainer,
            (subContainer): void => {
                navigation.eventsToUnbind.push(addEvent(
                    subContainer,
                    'click',
                    (event: PointerEvent): void => {
                        const bindings = navigation.getButtonEvents(
                            subContainer,
                            event
                        );

                        if (
                            bindings &&
                            (!bindings.button.classList
                                .contains('highcharts-disabled-btn'))
                        ) {
                            navigation.bindingsButtonClick(
                                bindings.button,
                                bindings.events,
                                event
                            );
                        }
                    }
                ));
            }
        );

        objectEach((options.events || {}), (callback, eventName): void => {
            if (isFunction(callback)) {
                navigation.eventsToUnbind.push(
                    addEvent(
                        navigation,
                        eventName,
                        callback,
                        { passive: false }
                    )
                );
            }
        });

        navigation.eventsToUnbind.push(
            addEvent(chart.container, 'click', function (
                e: PointerEvent
            ): void {
                if (
                    !chart.cancelClick &&
                    chart.isInsidePlot(
                        e.chartX - chart.plotLeft,
                        e.chartY - chart.plotTop,
                        {
                            visiblePlotOnly: true
                        }
                    )
                ) {
                    navigation.bindingsChartClick(this as any, e);
                }
            })
        );
        navigation.eventsToUnbind.push(
            addEvent(
                chart.container,
                H.isTouchDevice ? 'touchmove' : 'mousemove',
                function (e: PointerEvent): void {
                    navigation.bindingsContainerMouseMove(this, e);
                },
                H.isTouchDevice ? { passive: false } : void 0
            )
        );
    }

    /**
     * Common chart.update() delegation, shared between bindings and exporting.
     *
     * @private
     * @function Highcharts.NavigationBindings#initUpdate
     */
    public initUpdate(): void {
        const navigation = this;
        ChartNavigationComposition
            .compose(this.chart).navigation
            .addUpdate((options: NavigationOptions): void => {
                navigation.update(options);
            });
    }

    /**
     * Hook for click on a button, method selcts/unselects buttons,
     * then calls `bindings.init` callback.
     *
     * @private
     * @function Highcharts.NavigationBindings#bindingsButtonClick
     *
     * @param {Highcharts.HTMLDOMElement} [button]
     *        Clicked button
     *
     * @param {Object} events
     *        Events passed down from bindings (`init`, `start`, `step`, `end`)
     *
     * @param {Highcharts.PointerEventObject} clickEvent
     *        Browser's click event
     */
    public bindingsButtonClick(
        button: HTMLDOMElement,
        events: NavigationBindingsOptions,
        clickEvent: PointerEvent
    ): void {
        const navigation = this,
            chart = navigation.chart,
            svgContainer = chart.renderer.boxWrapper;
        let shouldEventBeFired = true;

        if (navigation.selectedButtonElement) {
            if (
                navigation.selectedButtonElement.classList === button.classList
            ) {
                shouldEventBeFired = false;
            }

            fireEvent(
                navigation,
                'deselectButton',
                { button: navigation.selectedButtonElement }
            );

            if (navigation.nextEvent) {
                // Remove in-progress annotations adders:
                if (
                    navigation.currentUserDetails &&
                    navigation.currentUserDetails.coll === 'annotations'
                ) {
                    chart.removeAnnotation(navigation.currentUserDetails);
                }
                navigation.mouseMoveEvent = navigation.nextEvent = false;
            }
        }

        if (shouldEventBeFired) {
            navigation.selectedButton = events;
            navigation.selectedButtonElement = button;

            fireEvent(navigation, 'selectButton', { button: button });
            // Call "init" event, for example to open modal window
            if (events.init) {
                events.init.call(navigation, button, clickEvent);
            }

            if (events.start || events.steps) {
                chart.renderer.boxWrapper.addClass('highcharts-draw-mode');
            }
        } else {
            chart.stockTools &&
                chart.stockTools.toggleButtonActiveClass(button);
            svgContainer.removeClass('highcharts-draw-mode');
            navigation.nextEvent = false;
            navigation.mouseMoveEvent = false;
            navigation.selectedButton = null;
        }
    }

    /**
     * Hook for click on a chart, first click on a chart calls `start` event,
     * then on all subsequent clicks iterate over `steps` array.
     * When finished, calls `end` event.
     *
     * @private
     * @function Highcharts.NavigationBindings#bindingsChartClick
     *
     * @param {Highcharts.Chart} chart
     *        Chart that click was performed on.
     *
     * @param {Highcharts.PointerEventObject} clickEvent
     *        Browser's click event.
     */
    public bindingsChartClick(
        chart: AnnotationChart,
        clickEvent: PointerEvent
    ): void {
        chart = this.chart;

        const navigation = this,
            activeAnnotation = navigation.activeAnnotation,
            selectedButton = navigation.selectedButton,
            svgContainer = chart.renderer.boxWrapper;

        if (activeAnnotation) {
            // Click outside popups, should close them and deselect the
            // annotation
            if (
                !activeAnnotation.cancelClick && // #15729
                !clickEvent.activeAnnotation &&
                // Element could be removed in the child action, e.g. button
                (clickEvent.target as any).parentNode &&
                // TO DO: Polyfill for IE11?
                !closestPolyfill(
                    clickEvent.target as any, '.highcharts-popup'
                )
            ) {
                fireEvent(navigation, 'closePopup');
            } else if (activeAnnotation.cancelClick) {
                // Reset cancelClick after the other event handlers have run
                setTimeout((): void => {
                    activeAnnotation.cancelClick = false;
                }, 0);
            }
        }

        if (!selectedButton || !selectedButton.start) {
            return;
        }


        if (!navigation.nextEvent) {
            // Call init method:
            navigation.currentUserDetails = selectedButton.start.call(
                navigation,
                clickEvent
            );

            // If steps exists (e.g. Annotations), bind them:
            if (navigation.currentUserDetails && selectedButton.steps) {
                navigation.stepIndex = 0;
                navigation.steps = true;
                navigation.mouseMoveEvent = navigation.nextEvent =
                    selectedButton.steps[navigation.stepIndex];
            } else {

                fireEvent(
                    navigation,
                    'deselectButton',
                    { button: navigation.selectedButtonElement }
                );
                svgContainer.removeClass('highcharts-draw-mode');
                navigation.steps = false;
                navigation.selectedButton = null;
                // First click is also the last one:
                if (selectedButton.end) {
                    selectedButton.end.call(
                        navigation,
                        clickEvent,
                        navigation.currentUserDetails
                    );

                }
            }
        } else {

            navigation.nextEvent(
                clickEvent,
                navigation.currentUserDetails
            );

            if (navigation.steps) {

                (navigation.stepIndex as any)++;

                if (
                    (selectedButton.steps as any)[navigation.stepIndex as any]
                ) {
                    // If we have more steps, bind them one by one:
                    navigation.mouseMoveEvent = navigation.nextEvent = (
                        selectedButton.steps as any
                    )[navigation.stepIndex as any];
                } else {
                    fireEvent(
                        navigation,
                        'deselectButton',
                        { button: navigation.selectedButtonElement }
                    );
                    svgContainer.removeClass('highcharts-draw-mode');
                    // That was the last step, call end():
                    if (selectedButton.end) {
                        selectedButton.end.call(
                            navigation,
                            clickEvent,
                            navigation.currentUserDetails
                        );
                    }
                    navigation.nextEvent = false;
                    navigation.mouseMoveEvent = false;
                    navigation.selectedButton = null;
                }
            }
        }
    }

    /**
     * Hook for mouse move on a chart's container. It calls current step.
     *
     * @private
     * @function Highcharts.NavigationBindings#bindingsContainerMouseMove
     *
     * @param {Highcharts.HTMLDOMElement} container
     *        Chart's container.
     *
     * @param {global.Event} moveEvent
     *        Browser's move event.
     */
    public bindingsContainerMouseMove(
        _container: HTMLDOMElement,
        moveEvent: Event
    ): void {
        if (this.mouseMoveEvent) {
            this.mouseMoveEvent(
                moveEvent,
                this.currentUserDetails
            );
        }
    }

    /**
     * Translate fields (e.g. `params.period` or `marker.styles.color`) to
     * Highcharts options object (e.g. `{ params: { period } }`).
     *
     * @private
     * @function Highcharts.NavigationBindings#fieldsToOptions<T>
     *
     * @param {Highcharts.Dictionary<string>} fields
     *        Fields from popup form.
     *
     * @param {T} config
     *        Default config to be modified.
     *
     * @return {T}
     *         Modified config
     */
    public fieldsToOptions<T>(
        fields: Record<string, string>,
        config: T
    ): T {
        objectEach(fields, (value, field): void => {
            const parsedValue = parseFloat(value),
                path = field.split('.'),
                pathLength = path.length - 1;

            // If it's a number (not "format" options), parse it:
            if (
                isNumber(parsedValue) &&
                !value.match(/px|em/g) &&
                !field.match(/format/g)
            ) {
                value = parsedValue as any;
            }

            // Remove values like 0
            if (value !== 'undefined') {
                let parent = config;

                path.forEach((name, index): void => {
                    const nextName = pick(path[index + 1], '');

                    if (pathLength === index) {
                        // Last index, put value:
                        (parent as any)[name] = value;
                    } else if (!(parent as any)[name]) {
                        // Create middle property:
                        (parent as any)[name] = nextName.match(/\d/g) ? [] : {};
                        parent = (parent as any)[name];
                    } else {
                        // Jump into next property
                        parent = (parent as any)[name];
                    }
                });
            }
        });
        return config;
    }

    /**
     * Shorthand method to deselect an annotation.
     *
     * @function Highcharts.NavigationBindings#deselectAnnotation
     */
    public deselectAnnotation(): void {
        if (this.activeAnnotation) {
            this.activeAnnotation.setControlPointsVisibility(false);
            this.activeAnnotation = false;
        }
    }
    /**
     * Generates API config for popup in the same format as options for
     * Annotation object.
     *
     * @function Highcharts.NavigationBindings#annotationToFields
     *
     * @param {Highcharts.Annotation} annotation
     *        Annotations object
     *
     * @return {Highcharts.Dictionary<string>}
     *         Annotation options to be displayed in popup box
     */
    public annotationToFields(
        annotation: Annotation
    ): Record<string, string> {
        const options = annotation.options,
            editables = NavigationBindings.annotationsEditable,
            nestedEditables = editables.nestedOptions,
            type = pick(
                options.type,
                options.shapes && options.shapes[0] &&
                    options.shapes[0].type,
                options.labels && options.labels[0] &&
                    options.labels[0].type,
                'label'
            ),
            nonEditables = (
                NavigationBindings.annotationsNonEditable as any
            )[
                options.langKey as any
            ] || [],
            visualOptions = {
                langKey: options.langKey,
                type: type
            } as any;

        /**
         * Nested options traversing. Method goes down to the options and copies
         * allowed options (with values) to new object, which is last parameter:
         * "parent".
         *
         * @private
         *
         * @param {*} option
         *        Atomic type or object/array
         *
         * @param {string} key
         *        Option name, for example "visible" or "x", "y"
         *
         * @param {Object} parentEditables
         *        Editables from NavigationBindings.annotationsEditable
         *
         * @param {Object} parent
         *        Where new options will be assigned
         */
        function traverse(
            option: any,
            key: (0|string),
            parentEditables: any,
            parent: any,
            parentKey: (0|string)
        ): void {
            let nextParent: any;

            if (
                parentEditables &&
                defined(option) &&
                nonEditables.indexOf(key) === -1 &&
                (
                    (
                        parentEditables.indexOf &&
                        parentEditables.indexOf(key)
                    ) >= 0 ||
                    parentEditables[key] || // nested array
                    parentEditables === true // simple array
                )
            ) {
                // Roots:
                if (isArray(option)) {
                    parent[key] = [];

                    option.forEach((arrayOption, i): void => {
                        if (!isObject(arrayOption)) {
                            // Simple arrays, e.g. [String, Number, Boolean]
                            traverse(
                                arrayOption,
                                0,
                                nestedEditables[key],
                                parent[key],
                                key
                            );
                        } else {
                            // Advanced arrays, e.g. [Object, Object]
                            parent[key][i] = {};
                            objectEach(
                                arrayOption,
                                (nestedOption, nestedKey): void => {
                                    traverse(
                                        nestedOption,
                                        nestedKey,
                                        nestedEditables[key],
                                        parent[key][i],
                                        key
                                    );
                                }
                            );
                        }
                    });
                } else if (isObject(option)) {
                    nextParent = {};
                    if (isArray(parent)) {
                        parent.push(nextParent);
                        nextParent[key] = {};
                        nextParent = nextParent[key];
                    } else {
                        parent[key] = nextParent;
                    }
                    objectEach(
                        option,
                        (nestedOption, nestedKey): void => {
                            traverse(
                                nestedOption,
                                nestedKey,
                                key === 0 ?
                                    parentEditables :
                                    nestedEditables[key],
                                nextParent,
                                key
                            );
                        }
                    );
                } else {
                    // Leaf:
                    if (key === 'format') {
                        parent[key] = [
                            format(
                                option,
                                annotation.labels[0].points[0]
                            ).toString(),
                            'text'
                        ];
                    } else if (isArray(parent)) {
                        parent.push([option, getFieldType(parentKey, option)]);
                    } else {
                        parent[key] = [option, getFieldType(key, option)];
                    }
                }
            }
        }

        objectEach(options, (option, key): void => {
            if (key === 'typeOptions') {
                visualOptions[key] = {};
                objectEach(
                    options[key],
                    (typeOption, typeKey): void => {
                        (traverse as any)(
                            typeOption,
                            typeKey,
                            nestedEditables,
                            visualOptions[key],
                            typeKey
                        );
                    }
                );
            } else {
                traverse(
                    option,
                    key,
                    (editables as any)[type],
                    visualOptions,
                    key
                );
            }
        });

        return visualOptions;
    }

    /**
     * Get all class names for all parents in the element. Iterates until finds
     * main container.
     *
     * @private
     * @function Highcharts.NavigationBindings#getClickedClassNames
     *
     * @param {Highcharts.HTMLDOMElement} container
     * Container that event is bound to.
     *
     * @param {global.Event} event
     * Browser's event.
     *
     * @return {Array<Array<string, Highcharts.HTMLDOMElement>>}
     * Array of class names with corresponding elements
     */
    public getClickedClassNames(
        container: HTMLDOMElement,
        event: Event
    ): Array<[string, HTMLDOMElement]> {
        let element: HTMLDOMElement = event.target as any,
            classNames: Array<[string, HTMLDOMElement]> = [],
            elemClassName: (string|null|undefined);

        while (element && element.tagName) {
            elemClassName = attr(element, 'class');
            if (elemClassName) {
                classNames = classNames.concat(
                    elemClassName
                        .split(' ')
                        // eslint-disable-next-line no-loop-func
                        .map((name): [string, HTMLDOMElement] => (
                            [name, element]
                        ))
                );
            }
            element = element.parentNode as any;

            if (element === container) {
                return classNames;
            }
        }

        return classNames;

    }

    /**
     * Get events bound to a button. It's a custom event delegation to find all
     * events connected to the element.
     *
     * @private
     * @function Highcharts.NavigationBindings#getButtonEvents
     *
     * @param {Highcharts.HTMLDOMElement} container
     *        Container that event is bound to.
     *
     * @param {global.Event} event
     *        Browser's event.
     *
     * @return {Object}
     *         Object with events (init, start, steps, and end)
     */
    public getButtonEvents(
        container: HTMLDOMElement,
        event: Event
    ): (NavigationBindingsButtonEventsObject|undefined) {
        const navigation = this,
            classNames = this.getClickedClassNames(container, event);

        let bindings: (NavigationBindingsButtonEventsObject|undefined);

        classNames.forEach((className): void => {
            if (navigation.boundClassNames[className[0]] && !bindings) {
                bindings = {
                    events: navigation.boundClassNames[className[0]],
                    button: className[1]
                };
            }
        });

        return bindings;
    }

    /**
     * Bindings are just events, so the whole update process is simply
     * removing old events and adding new ones.
     *
     * @private
     * @function Highcharts.NavigationBindings#update
     */
    public update(options?: NavigationOptions): void {
        this.options = merge(true, this.options, options);
        this.removeEvents();
        this.initEvents();
    }

    /**
     * Remove all events created in the navigation.
     *
     * @private
     * @function Highcharts.NavigationBindings#removeEvents
     */
    public removeEvents(): void {
        this.eventsToUnbind.forEach((unbinder: Function): void => unbinder());
    }

    /**
     * @private
     * @function Highcharts.NavigationBindings#destroy
     */
    public destroy(): void {
        this.removeEvents();
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface NavigationBindings extends NavigationBindingsLike {
}


/* *
 *
 *  Default Export
 *
 * */

export default NavigationBindings;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * A config object for navigation bindings in annotations.
 *
 * @interface Highcharts.NavigationBindingsOptionsObject
 *//**
 * ClassName of the element for a binding.
 * @name Highcharts.NavigationBindingsOptionsObject#className
 * @type {string|undefined}
 *//**
 * Last event to be fired after last step event.
 * @name Highcharts.NavigationBindingsOptionsObject#end
 * @type {Function|undefined}
 *//**
 * Initial event, fired on a button click.
 * @name Highcharts.NavigationBindingsOptionsObject#init
 * @type {Function|undefined}
 *//**
 * Event fired on first click on a chart.
 * @name Highcharts.NavigationBindingsOptionsObject#start
 * @type {Function|undefined}
 *//**
 * Last event to be fired after last step event. Array of step events to be
 * called sequentially after each user click.
 * @name Highcharts.NavigationBindingsOptionsObject#steps
 * @type {Array<Function>|undefined}
 */

(''); // keeps doclets above in JS file
