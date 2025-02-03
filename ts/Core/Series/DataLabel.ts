/* *
 *
 *  (c) 2010-2024 Torstein Honsi
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

import type { AlignObject, AlignValue } from '../Renderer/AlignObject';
import type BBoxObject from '../Renderer/BBoxObject';
import type ColorString from '../Color/ColorString';
import type ColumnPoint from '../../Series/Column/ColumnPoint';
import type CorePositionObject from '../../Core/Renderer/PositionObject';
import type DataLabelOptions from './DataLabelOptions';
import type PiePoint from '../../Series/Pie/PiePoint';
import type Point from './Point';
import type Series from './Series';
import type SVGAttributes from '../Renderer/SVG/SVGAttributes';
import type SVGElement from '../Renderer/SVG/SVGElement';
import type SVGLabel from '../Renderer/SVG/SVGLabel';
import type SVGPath from '../../Core/Renderer/SVG/SVGPath';
import type AnimationOptions from '../Animation/AnimationOptions';

import A from '../Animation/AnimationUtilities.js';
const { getDeferredAnimation } = A;
import F from '../Templating.js';
const { format } = F;
import { Palette } from '../Color/Palettes.js';
import R from '../Renderer/RendererUtilities.js';
import U from '../Utilities.js';
const {
    defined,
    extend,
    fireEvent,
    getAlignFactor,
    isArray,
    isString,
    merge,
    objectEach,
    pick,
    pInt,
    splat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module './PointLike' {
    interface PointLike {
        bottom?: number;
        contrastColor?: ColorString;
        dataLabel?: SVGElement|SVGLabel;
        dataLabelOnHidden?: boolean;
        dataLabelOnNull?: boolean;
        dataLabelPath?: SVGElement;
        dataLabels?: Array<SVGElement>;
        distributeBox?: R.BoxObject;
        dlBox?: BBoxObject;
        dlOptions?: DataLabelOptions;
        top?: number;
        getDataLabelPath(dataLabel: SVGElement): SVGElement;
    }
}

declare module './PointOptions' {
    interface PointOptions {
        dataLabels?: (DataLabelOptions|Array<DataLabelOptions>);
        labelrank?: number;
    }
}

declare module './SeriesLike' {
    interface SeriesLike {
        dataLabelPositioners?: DataLabel.PositionersObject;
        dataLabelsGroup?: SVGElement;
        hasDataLabels?(): boolean;
        initDataLabelsGroup(): SVGElement;
        initDataLabels(
            animationConfig?: Partial<AnimationOptions>
        ): SVGElement;
        alignDataLabel(
            point: Point,
            dataLabel: SVGElement,
            options: DataLabelOptions,
            alignTo: BBoxObject|undefined,
            isNew?: boolean
        ): void;
        drawDataLabels(points?:Array<Point>): void;
        getDataLabelPosition(
            point: PiePoint,
            distance: number
        ): DataLabel.LabelPositionObject;
        justifyDataLabel(
            dataLabel: SVGElement,
            options: DataLabelOptions,
            alignAttr: SVGAttributes,
            bBox: BBoxObject,
            alignTo?: BBoxObject,
            isNew?: boolean
        ): (boolean|undefined);
        mergeArrays(
            one: (DataLabelOptions|Array<DataLabelOptions>|undefined),
            two: (DataLabelOptions|Array<DataLabelOptions>|undefined)
        ): (DataLabelOptions|Array<DataLabelOptions>);
        placeDataLabels?(): void;
        setDataLabelStartPos(
            point: ColumnPoint,
            dataLabel: SVGElement,
            isNew: boolean|undefined,
            isInside: boolean,
            alignOptions: AlignObject
        ): void;
        verifyDataLabelOverflow?(overflow: Array<number>): boolean;
    }
}

declare module './SeriesOptions' {
    interface SeriesOptions {
        dataLabels?: (DataLabelOptions|Array<DataLabelOptions>);
    }
}

declare module '../../Core/Renderer/SVG/SVGElementLike' {
    interface SVGElementLike {
        options?: DataLabelOptions;
    }
}

/* *
 *
 *  Composition
 *
 * */

namespace DataLabel {

    /* *
     *
     *  Declarations
     *
     * */

    export interface PositionersObject {
        alignToConnectors(
            points: Array<Point>,
            half: boolean,
            plotWidth: number,
            plotLeft: number
        ): number;
        alignToPlotEdges(
            dataLabel: SVGElement,
            half: boolean,
            plotWidth: number,
            plotLeft: number
        ): number;
        justify(
            point: Point,
            dataLabel: SVGElement,
            radius: number,
            seriesCenter: Array<number>
        ): number;
        radialDistributionX(
            series: Series,
            point: Point,
            y: number,
            naturalY: number,
            dataLabel: SVGElement
        ): number;
        radialDistributionY(
            point: Point,
            dataLabel: SVGElement
        ): number;
    }

    export interface ConnectorShapeFunction {
        (...args: Array<any>): SVGPath;
    }

    export interface LabelConnectorPositionObject {
        angle?: number;
        breakAt: CorePositionObject;
        touchingSliceAt: CorePositionObject;
    }

    export interface LabelPositionObject {
        alignment: AlignValue;
        attribs?: SVGAttributes;
        bottom?: number;
        connectorPosition: LabelConnectorPositionObject;
        computed: Record<string, undefined|number>;
        distance: number;
        natural: CorePositionObject;
        posAttribs?: SVGAttributes;
        sideOverflow?: number;
        top?: number;
    }

    export interface PositionObject extends CorePositionObject {
        alignment: AlignValue;
    }

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Check if this series has data labels, either a series-level setting, or
     * individual. In case of individual point labels, this method is overridden
     * to always return true.
     * @private
     */
    function hasDataLabels(this: Series): boolean {
        return mergedDataLabelOptions(this)
            .some((o: DataLabelOptions|undefined): boolean|undefined =>
                o?.enabled
            );
    }

    /**
     * Align each individual data label.
     * @private
     */
    function alignDataLabel(
        this: Series,
        point: Point,
        dataLabel: SVGLabel,
        options: DataLabelOptions,
        alignTo: BBoxObject|undefined,
        isNew?: boolean
    ): void {
        const series = this,
            { chart, enabledDataSorting } = this,
            inverted = this.isCartesian && chart.inverted,
            plotX = point.plotX,
            plotY = point.plotY,
            rotation = options.rotation || 0,
            isInsidePlot = defined(plotX) &&
                defined(plotY) &&
                chart.isInsidePlot(
                    plotX,
                    Math.round(plotY),
                    {
                        inverted,
                        paneCoordinates: true,
                        series
                    }
                ),
            setStartPos = (alignOptions: AlignObject): void => {
                if (enabledDataSorting && series.xAxis && !justify) {
                    series.setDataLabelStartPos(
                        point as ColumnPoint,
                        dataLabel,
                        isNew,
                        isInsidePlot,
                        alignOptions
                    );
                }
            },
            justify = rotation === 0 ? pick(
                options.overflow,
                (enabledDataSorting ? 'none' : 'justify'
                )
            ) === 'justify' : false;

        // Math.round for rounding errors (#2683), alignTo to allow column
        // labels (#2700)
        let visible =
            this.visible &&
            point.visible !== false &&
            defined(plotX) &&
            (
                point.series.forceDL ||
                (enabledDataSorting && !justify) ||
                isInsidePlot ||
                (
                    // If the data label is inside the align box, it is enough
                    // that parts of the align box is inside the plot area
                    // (#12370). When stacking, it is always inside regardless
                    // of the option (#15148).
                    pick(options.inside, !!this.options.stacking) &&
                    alignTo &&
                    chart.isInsidePlot(
                        plotX,
                        inverted ?
                            alignTo.x + 1 :
                            alignTo.y + alignTo.height - 1,
                        {
                            inverted,
                            paneCoordinates: true,
                            series
                        }
                    )
                )
            );

        const pos = point.pos();
        if (visible && pos) {
            const bBox = dataLabel.getBBox(),
                unrotatedbBox = dataLabel.getBBox(void 0, 0);

            // The alignment box is a singular point
            alignTo = extend({
                x: pos[0],
                y: Math.round(pos[1]),
                width: 0,
                height: 0
            }, alignTo || {});

            // Align to plot edges
            if (options.alignTo === 'plotEdges' && series.isCartesian) {
                alignTo[inverted ? 'x' : 'y'] = 0;
                alignTo[inverted ? 'width' : 'height'] = this.yAxis?.len || 0;
            }

            // Add the text size for alignment calculation
            extend<DataLabelOptions|BBoxObject>(options, {
                width: bBox.width,
                height: bBox.height
            });

            setStartPos(alignTo); // Data sorting

            // Align the label to the adjusted box with for unrotated bBox due
            // to rotationOrigin, which is based on unrotated label
            dataLabel.align(merge(
                options, {
                    width: unrotatedbBox.width,
                    height: unrotatedbBox.height
                }
            ), false, alignTo, false);

            dataLabel.alignAttr.x += getAlignFactor(options.align) *
                (unrotatedbBox.width - bBox.width);
            dataLabel.alignAttr.y += getAlignFactor(options.verticalAlign) *
                (unrotatedbBox.height - bBox.height);

            dataLabel[dataLabel.placed ? 'animate' : 'attr']({
                'text-align': dataLabel.alignAttr['text-align'] || 'center',
                x: dataLabel.alignAttr.x +
                    (bBox.width - unrotatedbBox.width) / 2,
                y: dataLabel.alignAttr.y +
                    (bBox.height - unrotatedbBox.height) / 2,
                rotationOriginX: (dataLabel.width || 0) / 2,
                rotationOriginY: (dataLabel.height || 0) / 2
            });

            // Uncomment this block to visualize the bounding boxes used for
            // determining visibility
            // chart.renderer.rect(
            //     (dataLabel.alignAttr.x || 0) + chart.plotLeft,
            //     (dataLabel.alignAttr.y || 0) + chart.plotTop,
            //     bBox.width,
            //     bBox.height
            // ).attr({
            //     stroke: 'rgba(0, 0, 0, 0.3)',
            //     'stroke-width': 1,
            //     zIndex: 20
            // }).add();
            // chart.renderer.circle(
            //     chart.plotLeft + pick(dataLabel.alignAttr.x, 0),
            //     chart.plotTop + pick(dataLabel.alignAttr.y, 0),
            //     2
            // ).attr({
            //     fill: 'red',
            //     zIndex: 20
            // }).add();

            if (justify && alignTo.height >= 0) { // #8830
                this.justifyDataLabel(
                    dataLabel,
                    options,
                    dataLabel.alignAttr,
                    bBox,
                    alignTo,
                    isNew
                );
            } else if (pick(options.crop, true)) {
                const { x, y } = dataLabel.alignAttr,
                    correction = 1;

                // Check if the dataLabel should be visible.
                visible =
                    chart.isInsidePlot(
                        x,
                        y,
                        {
                            paneCoordinates: true,
                            series
                        }
                    ) &&
                    chart.isInsidePlot(
                        x + bBox.width - correction,
                        y + bBox.height - correction,
                        {
                            paneCoordinates: true,
                            series
                        }
                    );
            }

            // When we're using a shape, make it possible with a connector or an
            // arrow pointing to this point
            if (options.shape && !rotation) {
                dataLabel[isNew ? 'attr' : 'animate']({
                    anchorX: pos[0],
                    anchorY: pos[1]
                });
            }
        }
        // To use alignAttr property in hideOverlappingLabels
        if (isNew && enabledDataSorting) {
            dataLabel.placed = false;
        }
        // Show or hide based on the final aligned position
        if (!visible && (!enabledDataSorting || justify)) {
            dataLabel.hide();
            dataLabel.placed = false; // Don't animate back in
        } else {
            dataLabel.show();
            dataLabel.placed = true; // Flag for overlapping logic
        }
    }

    /**
     * Handle the dataLabels.filter option.
     * @private
     */
    function applyFilter(
        point: Point,
        options: DataLabelOptions
    ): boolean {
        const filter = options.filter;

        if (filter) {
            const op = filter.operator,
                prop = (point as any)[filter.property],
                val = filter.value;
            if (
                (op === '>' && prop > (val as any)) ||
                (op === '<' && prop < (val as any)) ||
                (op === '>=' && prop >= (val as any)) ||
                (op === '<=' && prop <= (val as any)) ||
                (op === '==' && prop == val) || // eslint-disable-line eqeqeq
                (op === '===' && prop === val) ||
                (op === '!=' && prop != val) || // eslint-disable-line eqeqeq
                (op === '!==' && prop !== val)
            ) {
                return true;
            }
            return false;
        }
        return true;
    }

    /**
     * @private
     */
    export function compose(
        SeriesClass: typeof Series
    ): void {
        const seriesProto = SeriesClass.prototype;

        if (!seriesProto.initDataLabels) {
            seriesProto.initDataLabels = initDataLabels;
            seriesProto.initDataLabelsGroup = initDataLabelsGroup;
            seriesProto.alignDataLabel = alignDataLabel;
            seriesProto.drawDataLabels = drawDataLabels;
            seriesProto.justifyDataLabel = justifyDataLabel;
            seriesProto.mergeArrays = mergeArrays;
            seriesProto.setDataLabelStartPos = setDataLabelStartPos;
            seriesProto.hasDataLabels = hasDataLabels;
        }

    }

    /**
     * Create the SVGElement group for dataLabels
     * @private
     */
    function initDataLabelsGroup(this: Series): SVGElement {
        return this.plotGroup(
            'dataLabelsGroup',
            'data-labels',
            this.hasRendered ? 'inherit' : 'hidden', // #5133, #10220
            (this.options.dataLabels as any).zIndex || 6,
            this.chart.dataLabelsGroup
        );
    }

    /**
     * Init the data labels with the correct animation
     * @private
     */
    function initDataLabels(
        this: Series,
        animationConfig: Partial<AnimationOptions>
    ): SVGElement {
        const series = this,
            hasRendered = series.hasRendered || 0;

        // Create a separate group for the data labels to avoid rotation
        const dataLabelsGroup = this.initDataLabelsGroup()
            .attr({ opacity: +hasRendered }); // #3300

        if (!hasRendered && dataLabelsGroup) {
            if (series.visible) { // #2597, #3023, #3024
                dataLabelsGroup.show();
            }
            if (series.options.animation) {
                dataLabelsGroup.animate({ opacity: 1 }, animationConfig);
            } else {
                dataLabelsGroup.attr({ opacity: 1 });
            }
        }

        return dataLabelsGroup;
    }

    /**
     * Draw the data labels
     * @private
     */
    function drawDataLabels(
        this: Series,
        points?: Array<Point>
    ): void {
        points = points || this.points;
        const series = this,
            chart = series.chart,
            seriesOptions = series.options,
            renderer = chart.renderer,
            { backgroundColor, plotBackgroundColor } = chart.options.chart,
            contrastColor = renderer.getContrast(
                (isString(plotBackgroundColor) && plotBackgroundColor) ||
                (isString(backgroundColor) && backgroundColor) ||
                Palette.neutralColor100
            ),
            seriesDlOptions = mergedDataLabelOptions(series);

        let pointOptions: Array<DataLabelOptions>,
            dataLabelsGroup: SVGElement;

        // Resolve the animation
        const { animation, defer } = seriesDlOptions[0],
            animationConfig = defer ?
                getDeferredAnimation(chart, animation, series) :
                { defer: 0, duration: 0 };


        fireEvent(this, 'drawDataLabels');

        if (series.hasDataLabels?.()) {
            dataLabelsGroup = this.initDataLabels(animationConfig);

            // Make the labels for each point
            points.forEach((point): void => {

                const dataLabels = point.dataLabels || [];

                // Merge in series options for the point.
                // @note dataLabelAttribs (like pointAttribs) would eradicate
                // the need for dlOptions, and simplify the section below.
                pointOptions = splat(
                    mergeArrays(
                        seriesDlOptions,
                        // The dlOptions prop is used in treemaps
                        point.dlOptions || point.options?.dataLabels
                    )
                );

                // Handle each individual data label for this point
                pointOptions.forEach((labelOptions, i): void => {
                    // Options for one datalabel
                    const labelEnabled = (
                            labelOptions.enabled &&
                            (point.visible || point.dataLabelOnHidden) &&
                            // #2282, #4641, #7112, #10049
                            (!point.isNull || point.dataLabelOnNull) &&
                            applyFilter(point, labelOptions)
                        ),
                        {
                            backgroundColor,
                            borderColor,
                            distance,
                            style = {}
                        } = labelOptions;

                    let formatString,
                        labelText,
                        rotation,
                        attr: SVGAttributes = {},
                        dataLabel: SVGElement|undefined =
                            dataLabels[i],
                        isNew = !dataLabel,
                        labelBgColor;

                    if (labelEnabled) {
                        // Create individual options structure that can be
                        // extended without affecting others
                        formatString = pick(
                            (labelOptions as any)[
                                point.formatPrefix + 'Format'
                            ],
                            labelOptions.format
                        );

                        labelText = defined(formatString) ?
                            format(formatString, point, chart) :
                            (
                                (labelOptions as any)[
                                    point.formatPrefix + 'Formatter'
                                ] ||
                                labelOptions.formatter
                            ).call(point, labelOptions);

                        rotation = labelOptions.rotation;

                        if (!chart.styledMode) {
                            // Determine the color
                            style.color = pick(
                                labelOptions.color,
                                style.color,
                                isString(series.color) ? series.color : void 0,
                                Palette.neutralColor100
                            );
                            // Get automated contrast color
                            if (style.color === 'contrast') {
                                if (backgroundColor !== 'none') {
                                    labelBgColor = backgroundColor;
                                }

                                point.contrastColor = renderer.getContrast(
                                    labelBgColor !== 'auto' && labelBgColor ||
                                    (point.color || series.color) as any
                                );

                                style.color = (
                                    labelBgColor || // #20007
                                    (
                                        !defined(distance) &&
                                        labelOptions.inside
                                    ) ||
                                    pInt(distance || 0) < 0 ||
                                    seriesOptions.stacking
                                ) ?
                                    point.contrastColor :
                                    contrastColor;
                            } else {
                                delete point.contrastColor;
                            }
                            if (seriesOptions.cursor) {
                                style.cursor = seriesOptions.cursor;
                            }
                        }

                        attr = {
                            r: labelOptions.borderRadius || 0,
                            rotation,
                            padding: labelOptions.padding,
                            zIndex: 1
                        };

                        if (!chart.styledMode) {
                            attr.fill = backgroundColor === 'auto' ?
                                point.color :
                                backgroundColor;
                            attr.stroke = borderColor === 'auto' ?
                                point.color :
                                borderColor;
                            attr['stroke-width'] = labelOptions.borderWidth;
                        }

                        // Remove unused attributes (#947)
                        objectEach(attr, (val, name): void => {
                            if (typeof val === 'undefined') {
                                delete attr[name];
                            }
                        });
                    }

                    // If the point is outside the plot area, or the label
                    // changes properties that we cannot change, destroy it and
                    // build a new one below. #678, #820.
                    if (
                        dataLabel && (
                            !labelEnabled ||
                            !defined(labelText) ||
                            !!dataLabel.div !== !!labelOptions.useHTML ||
                            (
                                // Change from no rotation to rotation and
                                // vice versa. Don't use defined() because
                                // rotation = 0 means also rotation = undefined
                                (
                                    !dataLabel.rotation ||
                                    !labelOptions.rotation
                                ) &&
                                dataLabel.rotation !== labelOptions.rotation
                            )
                        )
                    ) {
                        dataLabel = void 0;
                        isNew = true;
                    }

                    // Individual labels are disabled if the are explicitly
                    // disabled in the point options, or if they fall outside
                    // the plot area.
                    if (labelEnabled && defined(labelText)) {

                        if (!dataLabel) {
                            // Create new label element
                            dataLabel = renderer.label(
                                labelText,
                                0,
                                0,
                                labelOptions.shape,
                                void 0,
                                void 0,
                                labelOptions.useHTML,
                                void 0,
                                'data-label'
                            );

                            dataLabel.addClass(
                                ' highcharts-data-label-color-' +
                                point.colorIndex +
                                ' ' + (labelOptions.className || '') +
                                ( // #3398
                                    labelOptions.useHTML ?
                                        ' highcharts-tracker' :
                                        ''
                                )
                            );
                        } else {
                            // Use old element and just update text
                            attr.text = labelText;
                        }

                        // Store data label options for later access
                        if (dataLabel) {
                            dataLabel.options = labelOptions;
                            dataLabel.attr(attr);

                            if (!chart.styledMode) {
                                // Styles must be applied before add in order to
                                // read text bounding box
                                dataLabel.css(style).shadow(
                                    labelOptions.shadow
                                );
                            } else if (style.width) {
                                // In styled mode with a width property set,
                                // the width should be applied to the
                                // dataLabel. (#20499). These properties affect
                                // layout and must be applied also in styled
                                // mode.
                                dataLabel.css({
                                    width: style.width,
                                    textOverflow: style.textOverflow,
                                    whiteSpace: style.whiteSpace
                                });
                            }

                            fireEvent(
                                dataLabel,
                                'beforeAddingDataLabel',
                                { labelOptions, point }
                            );

                            if (!dataLabel.added) {
                                dataLabel.add(dataLabelsGroup);
                            }

                            // Now the data label is created and placed at 0,0,
                            // so we need to align it
                            series.alignDataLabel(
                                point,
                                dataLabel,
                                labelOptions,
                                void 0,
                                isNew
                            );

                            dataLabel.isActive = true;
                            if (dataLabels[i] && dataLabels[i] !== dataLabel) {
                                dataLabels[i].destroy();
                            }
                            dataLabels[i] = dataLabel;
                        }
                    }
                });


                // Destroy and remove the inactive ones
                let j = dataLabels.length;
                while (j--) {
                    // The item can be undefined if a disabled data label is
                    // succeeded by an enabled one (#19457)
                    if (!dataLabels[j]?.isActive) {
                        dataLabels[j]?.destroy();
                        dataLabels.splice(j, 1);
                    } else {
                        dataLabels[j].isActive = false;
                    }
                }

                // Write back
                point.dataLabel = dataLabels[0];
                point.dataLabels = dataLabels;
            });
        }

        fireEvent(this, 'afterDrawDataLabels');
    }

    /**
     * If data labels fall partly outside the plot area, align them back in, in
     * a way that doesn't hide the point.
     * @private
     */
    function justifyDataLabel(
        this: Series,
        dataLabel: SVGElement,
        options: DataLabelOptions,
        alignAttr: SVGAttributes,
        bBox: BBoxObject,
        alignTo?: BBoxObject,
        isNew?: boolean
    ): (boolean|undefined) {
        const chart = this.chart,
            align = options.align,
            verticalAlign = options.verticalAlign,
            padding = dataLabel.box ? 0 : (dataLabel.padding || 0),
            horizontalAxis = chart.inverted ? this.yAxis : this.xAxis,
            horizontalAxisShift = horizontalAxis ?
                horizontalAxis.left - chart.plotLeft : 0,
            verticalAxis = chart.inverted ? this.xAxis : this.yAxis,
            verticalAxisShift = verticalAxis ?
                verticalAxis.top - chart.plotTop : 0;

        let { x = 0, y = 0 } = options,
            off,
            justified;

        // Off left
        off = (alignAttr.x || 0) + padding + horizontalAxisShift;
        if (off < 0) {
            if (align === 'right' && x >= 0) {
                options.align = 'left';
                options.inside = true;
            } else {
                x -= off;
            }
            justified = true;
        }

        // Off right
        off = (alignAttr.x || 0) + bBox.width - padding + horizontalAxisShift;
        if (off > chart.plotWidth) {
            if (align === 'left' && x <= 0) {
                options.align = 'right';
                options.inside = true;
            } else {
                x += chart.plotWidth - off;
            }
            justified = true;
        }

        // Off top
        off = alignAttr.y + padding + verticalAxisShift;
        if (off < 0) {
            if (verticalAlign === 'bottom' && y >= 0) {
                options.verticalAlign = 'top';
                options.inside = true;
            } else {
                y -= off;
            }
            justified = true;
        }

        // Off bottom
        off = (alignAttr.y || 0) + bBox.height - padding + verticalAxisShift;
        if (off > chart.plotHeight) {
            if (verticalAlign === 'top' && y <= 0) {
                options.verticalAlign = 'bottom';
                options.inside = true;
            } else {
                y += chart.plotHeight - off;
            }
            justified = true;
        }

        if (justified) {
            options.x = x;
            options.y = y;
            dataLabel.placed = !isNew;
            dataLabel.align(options, void 0, alignTo);
        }

        return justified;
    }

    /**
     * Merge two objects that can be arrays. If one of them is an array, the
     * other is merged into each element. If both are arrays, each element is
     * merged by index. If neither are arrays, we use normal merge.
     * @private
     */
    function mergeArrays(
        one: (DataLabelOptions|Array<DataLabelOptions>|undefined),
        two: (DataLabelOptions|Array<DataLabelOptions>|undefined)
    ): (DataLabelOptions|Array<DataLabelOptions>) {
        let res: (DataLabelOptions|Array<DataLabelOptions>) = [],
            i: number;

        if (isArray(one) && !isArray(two)) {
            res = one.map(
                function (el: DataLabelOptions): DataLabelOptions {
                    return merge(el, two);
                }
            );
        } else if (isArray(two) && !isArray(one)) {
            res = two.map(
                function (el: DataLabelOptions): DataLabelOptions {
                    return merge(one, el);
                }
            );
        } else if (!isArray(one) && !isArray(two)) {
            res = merge(one, two);

        } else if (isArray(one) && isArray(two)) {
            i = Math.max(one.length, two.length);
            while (i--) {
                res[i] = merge(one[i], two[i]);
            }
        }
        return res;
    }

    /**
     * Merge plotOptions and series options for dataLabels.
     * @private
     */
    function mergedDataLabelOptions(
        series: Series
    ): Array<DataLabelOptions> {
        const plotOptions = series.chart.options.plotOptions;

        return splat(
            mergeArrays(
                mergeArrays(
                    plotOptions?.series?.dataLabels,
                    plotOptions?.[series.type]?.dataLabels
                ),
                series.options.dataLabels
            )
        );
    }

    /**
     * Set starting position for data label sorting animation.
     * @private
     */
    function setDataLabelStartPos(
        this: Series,
        point: ColumnPoint,
        dataLabel: SVGElement,
        isNew: boolean,
        isInside: boolean,
        alignOptions: AlignObject
    ): void {
        const chart = this.chart,
            inverted = chart.inverted,
            xAxis = this.xAxis,
            reversed = xAxis.reversed,
            labelCenter = (
                (inverted ? dataLabel.height : dataLabel.width) || 0
            ) / 2,
            pointWidth = point.pointWidth,
            halfWidth = pointWidth ? pointWidth / 2 : 0;

        dataLabel.startXPos = inverted ?
            alignOptions.x :
            (reversed ?
                -labelCenter - halfWidth :
                xAxis.width - labelCenter + halfWidth
            );
        dataLabel.startYPos = inverted ?
            (reversed ?
                this.yAxis.height - labelCenter + halfWidth :
                -labelCenter - halfWidth
            ) : alignOptions.y;

        // We need to handle visibility in case of sorting point outside plot
        // area
        if (!isInside) {
            dataLabel
                .attr({ opacity: 1 })
                .animate(
                    { opacity: 0 },
                    void 0,
                    dataLabel.hide
                );

        } else if (dataLabel.visibility === 'hidden') {
            dataLabel.show();
            dataLabel
                .attr({ opacity: 0 })
                .animate({ opacity: 1 });
        }
        // Save start position on first render, but do not change position
        if (!chart.hasRendered) {
            return;
        }
        // Set start position
        if (isNew) {
            dataLabel.attr({ x: dataLabel.startXPos, y: dataLabel.startYPos });
        }

        dataLabel.placed = true;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DataLabel;

/* *
 *
 *  API Declarations
 *
 * */

/**
 * Callback JavaScript function to format the data label as a string. Note that
 * if a `format` is defined, the format takes precedence and the formatter is
 * ignored.
 *
 * @callback Highcharts.DataLabelsFormatterCallbackFunction
 *
 * @param {Highcharts.Point} this
 * Data label context to format
 *
 * @param {Highcharts.DataLabelsOptions} options
 * [API options](/highcharts/plotOptions.series.dataLabels) of the data label
 *
 * @return {number|string|null|undefined}
 * Formatted data label text
 */

/**
 * Values for handling data labels that flow outside the plot area.
 *
 * @typedef {"allow"|"justify"} Highcharts.DataLabelsOverflowValue
 */

''; // Keeps doclets above in JS file
