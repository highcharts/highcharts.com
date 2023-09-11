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

import type AnimationOptions from '../../Core/Animation/AnimationOptions';
import type { AnnotationPointType } from './AnnotationSeries';
import type AnnotationOptions from './AnnotationOptions';
import type { AnnotationTypeRegistry } from './Types/AnnotationType';
import type AxisType from '../../Core/Axis/AxisType';
import type BBoxObject from '../../Core/Renderer/BBoxObject';
import type Chart from '../../Core/Chart/Chart';
import type {
    ControllableLabelType,
    ControllableShapeType,
    ControllableType
} from './Controllables/ControllableType';
import type {
    ControllableLabelOptions,
    ControllableShapeOptions
} from './Controllables/ControllableOptions';
import type MockPointOptions from './MockPointOptions';
import type SVGElement from '../../Core/Renderer/SVG/SVGElement';
import type SVGRenderer from '../../Core/Renderer/SVG/SVGRenderer';

import A from '../../Core/Animation/AnimationUtilities.js';
const { getDeferredAnimation } = A;
import AnnotationChart from './AnnotationChart.js';
import AnnotationDefaults from './AnnotationDefaults.js';
import ControllableRect from './Controllables/ControllableRect.js';
import ControllableCircle from './Controllables/ControllableCircle.js';
import ControllableEllipse from './Controllables/ControllableEllipse.js';
import ControllablePath from './Controllables/ControllablePath.js';
import ControllableImage from './Controllables/ControllableImage.js';
import ControllableLabel from './Controllables/ControllableLabel.js';
import ControlPoint from './ControlPoint.js';
import ControlTarget from './ControlTarget.js';
import EventEmitter from './EventEmitter.js';
import MockPoint from './MockPoint.js';
import NavigationBindings from './NavigationBindings.js';
import Pointer from '../../Core/Pointer.js';
import PopupComposition from './Popup/PopupComposition.js';
import U from '../../Shared/Utilities.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
import AH from '../../Shared/Helpers/ArrayHelper.js';
const {
    erase,
    splat
} = AH;
const { destroyObjectProperties, merge } = OH;
const { fireEvent } = EH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Options'{
    interface Options {
        annotations?: (AnnotationOptions|Array<AnnotationOptions>);
    }
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Hide or show annotaiton attached to points.
 * @private
 */
function adjustVisibility(
    item: ControllableType
): void { // #9481
    const label = item.graphic,
        hasVisiblePoints = item.points.some((point): boolean => (
            point.series.visible !== false &&
            point.visible !== false
        ));

    if (label) {
        if (!hasVisiblePoints) {
            label.hide();

        } else if (label.visibility === 'hidden') {
            label.show();
        }
    }
}

/**
 * @private
 */
function getLabelsAndShapesOptions(
    baseOptions: AnnotationOptions,
    newOptions: DeepPartial<AnnotationOptions>
): AnnotationOptions {
    const mergedOptions = {} as AnnotationOptions;

    (['labels', 'shapes'] as Array<('labels'|'shapes')>).forEach((
        name
    ): void => {
        const someBaseOptions = baseOptions[name];

        if (someBaseOptions) {
            if (newOptions[name]) {
                mergedOptions[name] = splat(newOptions[name]).map(
                    function (
                        basicOptions: (
                            ControllableLabelOptions|
                            ControllableShapeOptions
                        ),
                        i: number
                    ): (
                        ControllableLabelOptions|
                        ControllableShapeOptions
                        ) {
                        return merge(someBaseOptions[i], basicOptions);
                    }
                ) as any;
            } else {
                mergedOptions[name] = baseOptions[name] as any;
            }
        }
    });

    return mergedOptions;
}

/* *
 *
 *  Class
 *
 * */

/**
 * An annotation class which serves as a container for items like labels or
 * shapes. Created items are positioned on the chart either by linking them to
 * existing points or created mock points
 *
 * @class
 * @name Highcharts.Annotation
 *
 * @param {Highcharts.Chart} chart
 *        A chart instance
 * @param {Highcharts.AnnotationsOptions} userOptions
 *        The annotation options
 */
class Annotation extends EventEmitter implements ControlTarget {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * @private
     */
    public static readonly ControlPoint = ControlPoint;

    /**
     * @private
     */
    public static readonly MockPoint = MockPoint;

    /**
     * An object uses for mapping between a shape type and a constructor.
     * To add a new shape type extend this object with type name as a key
     * and a constructor as its value.
     */
    public static readonly shapesMap: Record<string, Function> = {
        'rect': ControllableRect,
        'circle': ControllableCircle,
        'ellipse': ControllableEllipse,
        'path': ControllablePath,
        'image': ControllableImage
    };

    /**
     * @private
     */
    public static readonly types = {} as AnnotationTypeRegistry;

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * @private
     */
    public static compose(
        ChartClass: typeof Chart,
        PointerClass: typeof Pointer,
        SVGRendererClass: typeof SVGRenderer
    ): void {
        AnnotationChart.compose(Annotation, ChartClass, PointerClass);
        ControllableLabel.compose(SVGRendererClass);
        ControllablePath.compose(ChartClass, SVGRendererClass);
        NavigationBindings.compose(Annotation, ChartClass);
        PopupComposition.compose(NavigationBindings, PointerClass);
    }

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        chart: AnnotationChart,
        userOptions: AnnotationOptions
    ) {
        super();

        /**
         * The chart that the annotation belongs to.
         *
         * @name Highcharts.Annotation#chart
         * @type {Highcharts.Chart}
         */
        this.chart = chart;

        /**
         * The array of points which defines the annotation.
         * @private
         * @name Highcharts.Annotation#points
         * @type {Array<Highcharts.Point>}
         */
        this.points = [];

        /**
         * The array of control points.
         * @private
         * @name Highcharts.Annotation#controlPoints
         * @type {Array<Annotation.ControlPoint>}
         */
        this.controlPoints = [];

        this.coll = 'annotations';

        this.index = -1;

        /**
         * The array of labels which belong to the annotation.
         * @private
         * @name Highcharts.Annotation#labels
         * @type {Array<Highcharts.AnnotationLabelType>}
         */
        this.labels = [];

        /**
         * The array of shapes which belong to the annotation.
         * @private
         * @name Highcharts.Annotation#shapes
         * @type {Array<Highcharts.AnnotationShapeType>}
         */
        this.shapes = [];

        /**
         * The options for the annotations.
         *
         * @name Highcharts.Annotation#options
         * @type {Highcharts.AnnotationsOptions}
         */
        this.options = merge(this.defaultOptions, userOptions);

        /**
         * The user options for the annotations.
         *
         * @name Highcharts.Annotation#userOptions
         * @type {Highcharts.AnnotationsOptions}
         */
        this.userOptions = userOptions;

        // Handle labels and shapes - those are arrays
        // Merging does not work with arrays (stores reference)
        const labelsAndShapes = getLabelsAndShapesOptions(
            this.options,
            userOptions
        );
        this.options.labels = labelsAndShapes.labels;
        this.options.shapes = labelsAndShapes.shapes;

        /**
         * The callback that reports to the overlapping-labels module which
         * labels it should account for.
         * @private
         * @name Highcharts.Annotation#labelCollector
         * @type {Function}
         */

        /**
         * The group svg element.
         *
         * @name Highcharts.Annotation#group
         * @type {Highcharts.SVGElement}
         */

        /**
         * The group svg element of the annotation's shapes.
         *
         * @name Highcharts.Annotation#shapesGroup
         * @type {Highcharts.SVGElement}
         */

        /**
         * The group svg element of the annotation's labels.
         *
         * @name Highcharts.Annotation#labelsGroup
         * @type {Highcharts.SVGElement}
         */

        this.init(chart, this.options);
    }

    /* *
     *
     *  Properties
     *
     * */

    public chart: AnnotationChart;
    public clipRect?: SVGElement;
    public clipXAxis?: AxisType;
    public clipYAxis?: AxisType;
    public coll: 'annotations' = 'annotations';
    public animationConfig: Partial<AnimationOptions> = void 0 as any;
    public graphic: SVGElement = void 0 as any;
    public group: SVGElement = void 0 as any;
    public index: number;
    public isUpdating?: boolean;
    public labelCollector: Chart.LabelCollectorFunction = void 0 as any;
    public labels: Array<ControllableLabelType>;
    public labelsGroup: SVGElement = void 0 as any;
    public options: AnnotationOptions;
    public shapes: Array<ControllableShapeType>;
    public shapesGroup: SVGElement = void 0 as any;
    public userOptions: AnnotationOptions;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * @private
     */
    public addClipPaths(): void {
        this.setClipAxes();

        if (
            this.clipXAxis &&
            this.clipYAxis &&
            this.options.crop // #15399
        ) {
            this.clipRect = this.chart.renderer.clipRect(
                this.getClipBox() as any
            );
        }
    }

    /**
     * @private
     */
    public addLabels(): void {
        const labelsOptions = (this.options.labels || []);

        labelsOptions.forEach((labelOptions, i): void => {
            const label = this.initLabel(labelOptions, i);

            merge(true, labelsOptions[i], label.options);
        });
    }

    /**
     * @private
     */
    public addShapes(): void {
        const shapes = this.options.shapes || [];
        shapes.forEach((shapeOptions, i): void => {
            const shape = this.initShape(shapeOptions, i);

            merge(true, shapes[i], shape.options);
        });
    }

    /**
     * Destroy the annotation. This function does not touch the chart
     * that the annotation belongs to (all annotations are kept in
     * the chart.annotations array) - it is recommended to use
     * {@link Highcharts.Chart#removeAnnotation} instead.
     * @private
     */
    public destroy(): void {
        const chart = this.chart,
            destroyItem = function (
                item: ControllableType
            ): void {
                item.destroy();
            };

        this.labels.forEach(destroyItem);
        this.shapes.forEach(destroyItem);

        this.clipXAxis = null as any;
        this.clipYAxis = null as any;

        erase(chart.labelCollectors, this.labelCollector);

        super.destroy();
        this.destroyControlTarget();

        destroyObjectProperties(this, chart);
    }

    /**
     * Destroy a single item.
     * @private
     */
    public destroyItem(
        item: ControllableType
    ): void {
        // erase from shapes or labels array
        erase((this as any)[item.itemType + 's'], item);
        item.destroy();
    }

    /**
     * @private
     */
    public getClipBox(): (BBoxObject|void) {
        if (this.clipXAxis && this.clipYAxis) {
            return {
                x: this.clipXAxis.left,
                y: this.clipYAxis.top,
                width: this.clipXAxis.width,
                height: this.clipYAxis.height
            };
        }
    }

    /**
     * Initialize the annotation properties.
     * @private
     */
    public initProperties(
        chart: AnnotationChart,
        userOptions: AnnotationOptions
    ): void {
        this.setOptions(userOptions);

        const labelsAndShapes = getLabelsAndShapesOptions(
            this.options,
            userOptions
        );
        this.options.labels = labelsAndShapes.labels;
        this.options.shapes = labelsAndShapes.shapes;

        this.chart = chart;
        this.points = [];
        this.controlPoints = [];
        this.coll = 'annotations';
        this.userOptions = userOptions;
        this.labels = [];
        this.shapes = [];
    }

    /**
     * Initialize the annotation.
     * @private
     */
    public init(
        _annotationOrChart: (Annotation|AnnotationChart),
        _userOptions: AnnotationOptions,
        index: number = this.index
    ): void {
        const chart = this.chart,
            animOptions = this.options.animation;

        this.index = index;
        this.linkPoints();
        this.addControlPoints();
        this.addShapes();
        this.addLabels();
        this.setLabelCollector();
        this.animationConfig = getDeferredAnimation(chart, animOptions);
    }

    /**
     * Initialisation of a single label
     * @private
     */
    public initLabel(
        labelOptions: Partial<ControllableLabelOptions>,
        index: number
    ): ControllableLabelType {
        const options = merge<ControllableLabelOptions>(
                this.options.labelOptions,
                {
                    controlPointOptions: this.options.controlPointOptions
                },
                labelOptions
            ),
            label = new ControllableLabel(
                this,
                options,
                index
            );

        label.itemType = 'label';

        this.labels.push(label);

        return label;
    }

    /**
     * Initialisation of a single shape
     * @private
     * @param {Object} shapeOptions
     * a confg object for a single shape
     * @param {number} index
     * annotation may have many shapes, this is the shape's index saved in
     * shapes.index.
     */
    public initShape(
        shapeOptions: Partial<ControllableShapeOptions>,
        index: number
    ): ControllableShapeType {
        const options = merge(
                this.options.shapeOptions,
                {
                    controlPointOptions: this.options.controlPointOptions
                },
                shapeOptions
            ),
            shape = new ((Annotation as any).shapesMap[options.type as any])(
                this,
                options,
                index
            );

        shape.itemType = 'shape';

        this.shapes.push(shape);

        return shape;
    }

    /**
     * @private
     */
    public redraw(
        animation?: boolean
    ): void {
        this.linkPoints();

        if (!this.graphic) {
            this.render();
        }

        if (this.clipRect) {
            this.clipRect.animate(this.getClipBox() as any);
        }

        this.redrawItems(this.shapes, animation);
        this.redrawItems(this.labels, animation);

        this.redrawControlPoints(animation);
    }

    /**
     * Redraw a single item.
     * @private
     */
    public redrawItem(
        item: ControllableType,
        animation?: boolean
    ): void {
        item.linkPoints();

        if (!item.shouldBeDrawn()) {
            this.destroyItem(item);
        } else {
            if (!item.graphic) {
                this.renderItem(item);
            }

            item.redraw(
                pick(animation, true) && item.graphic.placed
            );

            if (item.points.length) {
                adjustVisibility(item);
            }
        }
    }

    /**
     * @private
     */
    public redrawItems(
        items: Array<ControllableType>,
        animation?: boolean
    ): void {
        let i = items.length;

        // needs a backward loop
        // labels/shapes array might be modified
        // due to destruction of the item
        while (i--) {
            this.redrawItem(items[i], animation);
        }
    }

    /**
     * See {@link Highcharts.Chart#removeAnnotation}.
     * @private
     */
    public remove(): void {
        // Let chart.update() remove annoations on demand
        return this.chart.removeAnnotation(this);
    }

    /**
     * @private
     */
    public render(): void {
        const renderer = this.chart.renderer;

        this.graphic = renderer
            .g('annotation')
            .attr({
                opacity: 0,
                zIndex: this.options.zIndex,
                visibility: this.options.visible ?
                    'inherit' :
                    'hidden'
            })
            .add();

        this.shapesGroup = renderer
            .g('annotation-shapes')
            .add(this.graphic);

        if (this.options.crop) { // #15399
            this.shapesGroup.clip(this.chart.plotBoxClip);
        }

        this.labelsGroup = renderer
            .g('annotation-labels')
            .attr({
                // hideOverlappingLabels requires translation
                translateX: 0,
                translateY: 0
            })
            .add(this.graphic);

        this.addClipPaths();

        if (this.clipRect) {
            this.graphic.clip(this.clipRect);
        }

        // Render shapes and labels before adding events (#13070).
        this.renderItems(this.shapes);
        this.renderItems(this.labels);

        this.addEvents();

        this.renderControlPoints();
    }

    /**
     * @private
     */
    public renderItem(item: ControllableType): void {
        item.render(
            item.itemType === 'label' ?
                this.labelsGroup :
                this.shapesGroup
        );
    }

    /**
     * @private
     */
    public renderItems(
        items: Array<ControllableType>
    ): void {
        let i = items.length;

        while (i--) {
            this.renderItem(items[i]);
        }
    }

    /**
     * @private
     */
    public setClipAxes(): void {
        const xAxes = this.chart.xAxis,
            yAxes = this.chart.yAxis,
            linkedAxes: Array<AxisType> = ((
                this.options.labels || []
            ) as Array<(ControllableLabelOptions|ControllableShapeOptions)>)
                .concat(this.options.shapes || [])
                .reduce((
                    axes: Array<AxisType>,
                    labelOrShape
                ): Array<AxisType> => {
                    const point = labelOrShape &&
                        (
                            labelOrShape.point ||
                            (labelOrShape.points && labelOrShape.points[0])
                        );

                    return [
                        xAxes[point && (point as any).xAxis] || axes[0],
                        yAxes[point && (point as any).yAxis] || axes[1]
                    ];
                }, []);

        this.clipXAxis = linkedAxes[0];
        this.clipYAxis = linkedAxes[1];
    }

    /**
     * @private
     */
    public setControlPointsVisibility(visible: boolean): void {
        const setItemControlPointsVisibility = function (
            item: ControllableType
        ): void {
            item.setControlPointsVisibility(visible);
        };

        this.controlPoints.forEach((controlPoint): void => {
            controlPoint.setVisibility(visible);
        });

        this.shapes.forEach(setItemControlPointsVisibility);
        this.labels.forEach(setItemControlPointsVisibility);
    }

    /**
     * @private
     */
    public setLabelCollector(): void {
        const annotation = this;

        annotation.labelCollector = function (): Array<SVGElement> {
            return annotation.labels.reduce(
                function (
                    labels: Array<SVGElement>,
                    label: ControllableLabelType
                ): Array<SVGElement> {
                    if (!label.options.allowOverlap) {
                        labels.push(label.graphic);
                    }

                    return labels;
                },
                []
            );
        };

        annotation.chart.labelCollectors.push(
            annotation.labelCollector
        );
    }

    /**
     * Set an annotation options.
     * @private
     * @param {Highcharts.AnnotationsOptions} userOptions
     *        User options for an annotation
     */
    public setOptions(userOptions: AnnotationOptions): void {
        this.options = merge(this.defaultOptions, userOptions);
    }

    /**
     * Set the annotation's visibility.
     * @private
     * @param {boolean} [visible]
     * Whether to show or hide an annotation. If the param is omitted, the
     * annotation's visibility is toggled.
     */
    public setVisibility(
        visible?: boolean
    ): void {
        const options = this.options,
            navigation = this.chart.navigationBindings,
            visibility = pick(visible, !options.visible);

        this.graphic.attr(
            'visibility',
            visibility ? 'inherit' : 'hidden'
        );

        if (!visibility) {
            const setItemControlPointsVisibility = function (
                item: ControllableType
            ): void {
                item.setControlPointsVisibility(visibility);
            };

            this.shapes.forEach(setItemControlPointsVisibility);
            this.labels.forEach(setItemControlPointsVisibility);

            if (
                navigation.activeAnnotation === this &&
                navigation.popup &&
                navigation.popup.type === 'annotation-toolbar'
            ) {
                fireEvent(navigation, 'closePopup');
            }
        }

        options.visible = visibility;
    }

    /**
     * Updates an annotation.
     *
     * @function Highcharts.Annotation#update
     *
     * @param {Partial<Highcharts.AnnotationsOptions>} userOptions
     *        New user options for the annotation.
     *
     */
    public update(
        userOptions: DeepPartial<AnnotationOptions>,
        redraw? : boolean
    ): void {
        const chart = this.chart,
            labelsAndShapes = getLabelsAndShapesOptions(
                this.userOptions,
                userOptions
            ),
            userOptionsIndex = chart.annotations.indexOf(this),
            options = merge(true, this.userOptions, userOptions);

        options.labels = labelsAndShapes.labels;
        options.shapes = labelsAndShapes.shapes;

        this.destroy();
        this.initProperties(chart, options);
        this.init(chart, options);
        // Update options in chart options, used in exporting (#9767):
        chart.options.annotations[userOptionsIndex] = options;

        this.isUpdating = true;
        if (pick(redraw, true)) {
            chart.redraw();
        }

        fireEvent(this, 'afterUpdate');
        this.isUpdating = false;
    }

}

/* *
 *
 *  Class Prototype
 *
 * */

interface Annotation extends ControlTarget {
    defaultOptions: AnnotationOptions;
    nonDOMEvents: Array<string>;
    getPointsOptions(): Array<MockPointOptions>;
    linkPoints(): (Array<AnnotationPointType>|undefined);
}

Annotation.prototype.defaultOptions = AnnotationDefaults;

/**
 * List of events for `annotation.options.events` that should not be
 * added to `annotation.graphic` but to the `annotation`.
 *
 * @private
 * @type {Array<string>}
 */
Annotation.prototype.nonDOMEvents = ['add', 'afterUpdate', 'drag', 'remove'];

ControlTarget.compose(Annotation);

/* *
 *
 *  Default Export
 *
 * */

export default Annotation;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Possible directions for draggable annotations. An empty string (`''`)
 * makes the annotation undraggable.
 *
 * @typedef {''|'x'|'xy'|'y'} Highcharts.AnnotationDraggableValue
 * @requires modules/annotations
 */

/**
 * @private
 * @typedef {
 *          Highcharts.AnnotationControllableCircle|
 *          Highcharts.AnnotationControllableImage|
 *          Highcharts.AnnotationControllablePath|
 *          Highcharts.AnnotationControllableRect
 *     } Highcharts.AnnotationShapeType
 * @requires modules/annotations
 */

/**
 * @private
 * @typedef {
 *          Highcharts.AnnotationControllableLabel
 *     } Highcharts.AnnotationLabelType
 * @requires modules/annotations
 */

/**
 * A point-like object, a mock point or a point used in series.
 * @private
 * @typedef {
 *          Highcharts.AnnotationMockPoint|
 *          Highcharts.Point
 *     } Highcharts.AnnotationPointType
 * @requires modules/annotations
 */
/**
 * Shape point as string, object or function.
 *
 * @typedef {
 *          string|
 *          Highcharts.AnnotationMockPointOptionsObject|
 *          Highcharts.AnnotationMockPointFunction
 *     } Highcharts.AnnotationShapePointOptions
 */

(''); // keeps doclets above in JS file
