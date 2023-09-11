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

import type { AlignObject } from '../../../Core/Renderer/AlignObject';
import type Annotation from '../Annotation';
import type AnnotationChart from '../AnnotationChart';
import type { AnnotationPointType } from '../AnnotationSeries';
import type BBoxObject from '../../../Core/Renderer/BBoxObject';
import type { ControllableLabelOptions } from './ControllableOptions';
import type ControlTarget from '../ControlTarget';
import type PositionObject from '../../../Core/Renderer/PositionObject';
import type SVGAttributes from '../../../Core/Renderer/SVG/SVGAttributes';
import type SVGElement from '../../../Core/Renderer/SVG/SVGElement';
import type SVGPath from '../../../Core/Renderer/SVG/SVGPath';
import type SVGRenderer from '../../../Core/Renderer/SVG/SVGRenderer';
import type SymbolOptions from '../../../Core/Renderer/SVG/SymbolOptions';

import Controllable from './Controllable.js';
import F from '../../../Core/Templating.js';
const { format } = F;
import MockPoint from '../MockPoint.js';
import U from '../../../Shared/Utilities.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import TC from '../../../Shared/Helpers/TypeChecker.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    pushUnique
} = AH;
const { isNumber } = TC;
const { extend } = OH;
const {
    pick
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../../Core/Renderer/SVG/SymbolType' {
    interface SymbolTypeRegistry {
        /** @requires Extensions/ControllableLabel */
        connector: SymbolFunction;
    }
}

interface ControllableAlignObject extends AlignObject {
    height?: number;
    width?: number;
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
 * General symbol definition for labels with connector
 * @private
 */
function symbolConnector(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: SymbolOptions
): SVGPath {
    const anchorX = options && options.anchorX,
        anchorY = options && options.anchorY;

    let path: (SVGPath|undefined),
        yOffset: number,
        lateral = w / 2;

    if (isNumber(anchorX) && isNumber(anchorY)) {

        path = [['M', anchorX, anchorY]];

        // Prefer 45 deg connectors
        yOffset = y - anchorY;
        if (yOffset < 0) {
            yOffset = -h - yOffset;
        }
        if (yOffset < w) {
            lateral = anchorX < x + (w / 2) ? yOffset : w - yOffset;
        }

        // Anchor below label
        if (anchorY > y + h) {
            path.push(['L', x + lateral, y + h]);

            // Anchor above label
        } else if (anchorY < y) {
            path.push(['L', x + lateral, y]);

            // Anchor left of label
        } else if (anchorX < x) {
            path.push(['L', x, y + h / 2]);

            // Anchor right of label
        } else if (anchorX > x + w) {
            path.push(['L', x + w, y + h / 2]);
        }
    }

    return path || [];
}

/* *
 *
 *  Class
 *
 * */

/**
 * A controllable label class.
 *
 * @requires modules/annotations
 *
 * @private
 * @class
 * @name Highcharts.AnnotationControllableLabel
 *
 * @param {Highcharts.Annotation} annotation
 * An annotation instance.
 * @param {Highcharts.AnnotationsLabelOptions} options
 * A label's options.
 * @param {number} index
 * Index of the label.
 */
class ControllableLabel extends Controllable {

    /* *
     *
     *  Static Properties
     *
     * */

    /**
     * A map object which allows to map options attributes to element attributes
     *
     * @type {Highcharts.Dictionary<string>}
     */
    public static attrsMap = {
        backgroundColor: 'fill',
        borderColor: 'stroke',
        borderWidth: 'stroke-width',
        zIndex: 'zIndex',
        borderRadius: 'r',
        padding: 'padding'
    };

    /**
     * Shapes which do not have background - the object is used for proper
     * setting of the contrast color.
     *
     * @type {Array<string>}
     */
    public static shapesWithoutBackground = ['connector'];

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * Returns new aligned position based alignment options and box to align to.
     * It is almost a one-to-one copy from SVGElement.prototype.align
     * except it does not use and mutate an element
     *
     * @param {Highcharts.AnnotationAlignObject} alignOptions
     *
     * @param {Highcharts.BBoxObject} box
     *
     * @return {Highcharts.PositionObject}
     * Aligned position.
     */
    public static alignedPosition(
        alignOptions: ControllableAlignObject,
        box: BBoxObject
    ): PositionObject {
        const align = alignOptions.align,
            vAlign = alignOptions.verticalAlign;

        let x = (box.x || 0) + (alignOptions.x || 0),
            y = (box.y || 0) + (alignOptions.y || 0),
            alignFactor,
            vAlignFactor;

        if (align === 'right') {
            alignFactor = 1;
        } else if (align === 'center') {
            alignFactor = 2;
        }
        if (alignFactor) {
            x += (box.width - (alignOptions.width || 0)) / alignFactor;
        }

        if (vAlign === 'bottom') {
            vAlignFactor = 1;
        } else if (vAlign === 'middle') {
            vAlignFactor = 2;
        }
        if (vAlignFactor) {
            y += (box.height - (alignOptions.height || 0)) / vAlignFactor;
        }

        return {
            x: Math.round(x),
            y: Math.round(y)
        };
    }

    public static compose(
        SVGRendererClass: typeof SVGRenderer
    ): void {

        if (pushUnique(composedMembers, SVGRendererClass)) {
            const svgRendererProto = SVGRendererClass.prototype;

            svgRendererProto.symbols.connector = symbolConnector;
        }

    }

    /**
     * Returns new alignment options for a label if the label is outside the
     * plot area. It is almost a one-to-one copy from
     * Series.prototype.justifyDataLabel except it does not mutate the label and
     * it works with absolute instead of relative position.
     */
    public static justifiedOptions(
        chart: AnnotationChart,
        label: SVGElement,
        alignOptions: ControllableAlignObject,
        alignAttr: SVGAttributes
    ): ControllableAlignObject {
        const align = alignOptions.align,
            verticalAlign = alignOptions.verticalAlign,
            padding = label.box ? 0 : (label.padding || 0),
            bBox = label.getBBox(),
            //
            options: ControllableAlignObject = {
                align: align,
                verticalAlign: verticalAlign,
                x: alignOptions.x,
                y: alignOptions.y,
                width: label.width,
                height: label.height
            },
            //
            x = (alignAttr.x || 0) - chart.plotLeft,
            y = (alignAttr.y || 0) - chart.plotTop;

        let off: number;

        // Off left
        off = x + padding;
        if (off < 0) {
            if (align === 'right') {
                options.align = 'left';
            } else {
                options.x = (options.x || 0) - off;
            }
        }

        // Off right
        off = x + bBox.width - padding;
        if (off > chart.plotWidth) {
            if (align === 'left') {
                options.align = 'right';
            } else {
                options.x = (options.x || 0) + chart.plotWidth - off;
            }
        }

        // Off top
        off = y + padding;
        if (off < 0) {
            if (verticalAlign === 'bottom') {
                options.verticalAlign = 'top';
            } else {
                options.y = (options.y || 0) - off;
            }
        }

        // Off bottom
        off = y + bBox.height - padding;
        if (off > chart.plotHeight) {
            if (verticalAlign === 'top') {
                options.verticalAlign = 'bottom';
            } else {
                options.y = (options.y || 0) + chart.plotHeight - off;
            }
        }

        return options;
    }

    /* *
     *
     *  Constructors
     *
     * */

    public constructor(
        annotation: Annotation,
        options: ControllableLabelOptions,
        index: number
    ) {
        super(annotation, options, index, 'label');
    }

    /* *
     *
     *  Properties
     *
     * */

    public text?: string;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Translate the point of the label by deltaX and deltaY translations.
     * The point is the label's anchor.
     *
     * @param {number} dx translation for x coordinate
     * @param {number} dy translation for y coordinate
     */
    public translatePoint(dx: number, dy: number): void {
        super.translatePoint(dx, dy, 0);
    }

    /**
     * Translate x and y position relative to the label's anchor.
     *
     * @param {number} dx translation for x coordinate
     * @param {number} dy translation for y coordinate
     */
    public translate(dx: number, dy: number): void {
        const chart = this.annotation.chart,
            // Annotation.options
            labelOptions: AnyRecord = this.annotation.userOptions,
            // Chart.options.annotations
            annotationIndex = chart.annotations.indexOf(this.annotation),
            chartAnnotations = chart.options.annotations,
            chartOptions: AnyRecord = chartAnnotations[annotationIndex];

        if (chart.inverted) {
            const temp = dx;
            dx = dy;
            dy = temp;
        }

        // Local options:
        this.options.x += dx;
        this.options.y += dy;

        // Options stored in chart:
        chartOptions[this.collection][this.index].x = this.options.x;
        chartOptions[this.collection][this.index].y = this.options.y;

        labelOptions[this.collection][this.index].x = this.options.x;
        labelOptions[this.collection][this.index].y = this.options.y;
    }

    public render(parent: SVGElement): void {
        const options = this.options,
            attrs = this.attrsFromOptions(options),
            style = options.style;

        this.graphic = this.annotation.chart.renderer
            .label(
                '',
                0,
                -9999, // #10055
                options.shape,
                null as any,
                null as any,
                options.useHTML,
                null as any,
                'annotation-label'
            )
            .attr(attrs)
            .add(parent);

        if (!this.annotation.chart.styledMode) {
            if (style.color === 'contrast') {
                style.color = this.annotation.chart.renderer.getContrast(
                    ControllableLabel.shapesWithoutBackground.indexOf(
                        options.shape
                    ) > -1 ? '#FFFFFF' : options.backgroundColor as any
                );
            }
            this.graphic
                .css(options.style)
                .shadow(options.shadow);
        }

        if (options.className) {
            this.graphic.addClass(options.className);
        }

        this.graphic.labelrank = (options as any).labelrank;

        super.render();
    }

    public redraw(animation?: boolean): void {
        const options = this.options,
            text = this.text || options.format || options.text,
            label = this.graphic,
            point = this.points[0];

        if (!label) {
            this.redraw(animation);
            return;
        }

        label.attr({
            text: text ?
                format(
                    String(text),
                    point.getLabelConfig(),
                    this.annotation.chart
                ) :
                (options.formatter as any).call(point, this)
        });

        const anchor = this.anchor(point);
        const attrs: (SVGAttributes|null|undefined) = this.position(anchor);

        if (attrs) {
            label.alignAttr = attrs;

            attrs.anchorX = anchor.absolutePosition.x;
            attrs.anchorY = anchor.absolutePosition.y;

            label[animation ? 'animate' : 'attr'](attrs);
        } else {
            label.attr({
                x: 0,
                y: -9999 // #10055
            });
        }

        label.placed = !!attrs;

        super.redraw(animation);
    }

    /**
     * All basic shapes don't support alignTo() method except label.
     * For a controllable label, we need to subtract translation from
     * options.
     */
    public anchor(
        _point: AnnotationPointType
    ): ControlTarget.Anchor {
        const anchor = super.anchor.apply(this, arguments),
            x = this.options.x || 0,
            y = this.options.y || 0;

        anchor.absolutePosition.x -= x;
        anchor.absolutePosition.y -= y;

        anchor.relativePosition.x -= x;
        anchor.relativePosition.y -= y;

        return anchor;
    }

    /**
     * Returns the label position relative to its anchor.
     */
    public position(
        anchor: ControlTarget.Anchor
    ): (PositionObject|null|undefined) {
        const item = this.graphic,
            chart = this.annotation.chart,
            tooltip = chart.tooltip,
            point = this.points[0],
            itemOptions = this.options,
            anchorAbsolutePosition = anchor.absolutePosition,
            anchorRelativePosition = anchor.relativePosition;

        let itemPosition: (PositionObject|undefined),
            alignTo,
            itemPosRelativeX,
            itemPosRelativeY,

            showItem =
                point.series.visible &&
                MockPoint.prototype.isInsidePlot.call(point);

        if (item && showItem) {
            const { width = 0, height = 0 } = item;

            if (itemOptions.distance && tooltip) {
                itemPosition = tooltip.getPosition.call(
                    {
                        chart,
                        distance: pick(itemOptions.distance, 16),
                        getPlayingField: tooltip.getPlayingField
                    },
                    width,
                    height,
                    {
                        plotX: anchorRelativePosition.x,
                        plotY: anchorRelativePosition.y,
                        negative: point.negative,
                        ttBelow: point.ttBelow,
                        h: (
                            anchorRelativePosition.height ||
                            anchorRelativePosition.width
                        )
                    } as any
                );
            } else if ((itemOptions as any).positioner) {
                itemPosition = (itemOptions as any).positioner.call(this);
            } else {
                alignTo = {
                    x: anchorAbsolutePosition.x,
                    y: anchorAbsolutePosition.y,
                    width: 0,
                    height: 0
                };

                itemPosition = ControllableLabel.alignedPosition(
                    extend<ControllableLabelOptions|BBoxObject>(
                        itemOptions, {
                            width,
                            height
                        }
                    ),
                    alignTo
                );

                if (this.options.overflow === 'justify') {
                    itemPosition = ControllableLabel.alignedPosition(
                        ControllableLabel.justifiedOptions(
                            chart,
                            item,
                            itemOptions,
                            itemPosition
                        ),
                        alignTo
                    );
                }
            }


            if (itemOptions.crop) {
                itemPosRelativeX = (itemPosition as any).x - chart.plotLeft;
                itemPosRelativeY = (itemPosition as any).y - chart.plotTop;

                showItem =
                    chart.isInsidePlot(
                        itemPosRelativeX,
                        itemPosRelativeY
                    ) &&
                    chart.isInsidePlot(
                        itemPosRelativeX + width,
                        itemPosRelativeY + height
                    );
            }
        }

        return showItem ? itemPosition : null;
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface ControllableLabel {
    collection: 'labels';
    itemType: 'label';
    options: ControllableLabelOptions;
}

/* *
 *
 *  Registry
 *
 * */

declare module './ControllableType' {
    interface ControllableLabelTypeRegistry {
        label: typeof ControllableLabel;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default ControllableLabel;
