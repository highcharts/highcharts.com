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

import type {
    AxisOptions,
    AxisSetExtremesEventObject
} from '../../Core/Axis/AxisOptions';
import type CSSObject from '../../Core/Renderer/CSSObject';
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType';
import type {
    RangeSelectorButtonOptions,
    RangeSelectorOptions,
    RangeSelectorPositionOptions
} from './RangeSelectorOptions';
import type Time from '../../Core/Time';
import type { ButtonThemeStatesObject } from '../../Core/Renderer/SVG/ButtonThemeObject';

import Axis from '../../Core/Axis/Axis.js';
import Chart from '../../Core/Chart/Chart.js';
import D from '../../Core/Defaults.js';
const { defaultOptions } = D;
import H from '../../Core/Globals.js';
import { Palette } from '../../Core/Color/Palettes.js';
import RangeSelectorComposition from './RangeSelectorComposition.js';
import SVGElement from '../../Core/Renderer/SVG/SVGElement.js';
import T from '../../Core/Templating.js';
const { format } = T;
import U from '../../Core/Utilities.js';
import OrdinalAxis from '../../Core/Axis/OrdinalAxis.js';
const {
    addEvent,
    createElement,
    css,
    defined,
    destroyObjectProperties,
    diffObjects,
    discardElement,
    extend,
    fireEvent,
    isNumber,
    isString,
    merge,
    objectEach,
    pick,
    splat
} = U;

/* *
 *
 *  Declarations
 *
 * */

declare module '../../Core/Axis/AxisLike' {
    interface AxisLike {
        newMax?: number;
        range?: (number|RangeSelectorButtonOptions);
    }
}

declare module '../../Core/Chart/ChartLike'{
    interface ChartLike {
        extraBottomMargin?: boolean;
        extraTopMargin?: boolean;
        fixedRange?: number;
        rangeSelector?: RangeSelector;
    }
}

declare module './RangeSelectorOptions' {
    export interface RangeSelectorButtonOptions {
        _offsetMax?: number;
        _offsetMin?: number;
        _range?: number;
    }
}

/* *
 *
 *  Functions
 *
 * */

/**
 * Get the preferred input type based on a date format string.
 *
 * @private
 * @function preferredInputType
 */
function preferredInputType(format: Time.DateTimeFormat): string {
    const hasTimeKey = (char: string): boolean =>
        new RegExp(`%[[a-zA-Z]*${char}`).test(format as string);
    const ms = isString(format) ?
        format.indexOf('%L') !== -1 :
        // Implemented but not typed as of 2024
        format.fractionalSecondDigits;

    if (ms) {
        return 'text';
    }

    const date = isString(format) ?
        ['a', 'A', 'd', 'e', 'w', 'b', 'B', 'm', 'o', 'y', 'Y']
            .some(hasTimeKey) :
        format.dateStyle || format.day || format.month || format.year;

    const time = isString(format) ?
        ['H', 'k', 'I', 'l', 'M', 'S'].some(hasTimeKey) :
        format.timeStyle || format.hour || format.minute || format.second;

    if (date && time) {
        return 'datetime-local';
    }
    if (date) {
        return 'date';
    }
    if (time) {
        return 'time';
    }
    return 'text';
}

/* *
 *
 *  Class
 *
 * */

/**
 * The range selector.
 *
 * @private
 * @class
 * @name Highcharts.RangeSelector
 * @param {Highcharts.Chart} chart
 */
class RangeSelector {
    public isDirty: boolean = false;

    /* *
     *
     *  Static Functions
     *
     * */

    /**
     * @private
     */
    public static compose(
        AxisClass: typeof Axis,
        ChartClass: typeof Chart
    ): void {
        RangeSelectorComposition.compose(AxisClass, ChartClass, RangeSelector);
    }

    /* *
     *
     *  Constructor
     *
     * */

    public constructor(chart: Chart) {
        this.init(chart);
    }

    /* *
     *
     *  Properties
     *
     * */


    public buttons!: Array<SVGElement>;
    public isCollapsed?: boolean;
    public buttonGroup?: SVGElement;
    public buttonOptions: Array<RangeSelectorButtonOptions> =
        RangeSelector.prototype.defaultButtons;
    public chart!: Chart;
    public deferredYTDClick?: number;
    public div?: HTMLDOMElement;
    public dropdown?: HTMLSelectElement;
    public dropdownLabel!: SVGElement;
    public eventsToUnbind?: Array<Function>;
    public forcedDataGrouping?: boolean;
    public frozenStates?: boolean;
    public group?: SVGElement;
    public hasVisibleDropdown?: boolean;
    public initialButtonGroupWidth = 0;
    public inputGroup?: SVGElement;
    public isActive?: boolean;
    public maxDateBox?: SVGElement;
    public maxInput?: HTMLInputElement;
    public maxLabel?: SVGElement;
    public minDateBox?: SVGElement;
    public minInput?: HTMLInputElement;
    public minLabel?: SVGElement;
    public options!: RangeSelectorOptions;
    public rendered?: boolean;
    public selected?: number;
    public zoomText!: SVGElement;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * The method to run when one of the buttons in the range selectors is
     * clicked
     *
     * @private
     * @function Highcharts.RangeSelector#clickButton
     * @param {number} i
     *        The index of the button
     * @param {boolean} [redraw]
     */
    public clickButton(
        i: number,
        redraw?: boolean
    ): void {
        const rangeSelector = this,
            chart = rangeSelector.chart,
            rangeOptions = rangeSelector.buttonOptions[i],
            baseAxis = chart.xAxis[0],
            unionExtremes = (
                chart.scroller && chart.scroller.getUnionExtremes()
            ) || baseAxis || {},
            type = rangeOptions.type,
            dataGrouping = rangeOptions.dataGrouping;

        let dataMin = unionExtremes.dataMin,
            dataMax = unionExtremes.dataMax,
            newMin,
            newMax = isNumber(baseAxis?.max) ? Math.round(
                Math.min(baseAxis.max, dataMax ?? baseAxis.max)
            ) : void 0, // #1568
            baseXAxisOptions: DeepPartial<AxisOptions>,
            range = rangeOptions._range,
            rangeMin: (number|undefined),
            ctx: Axis,
            ytdExtremes,
            addOffsetMin = true;

        // Chart has no data, base series is removed
        if (dataMin === null || dataMax === null) {
            return;
        }

        rangeSelector.setSelected(i);

        // Apply dataGrouping associated to button
        if (dataGrouping) {
            this.forcedDataGrouping = true;
            Axis.prototype.setDataGrouping.call(
                baseAxis || { chart: this.chart },
                dataGrouping,
                false
            );

            this.frozenStates = rangeOptions.preserveDataGrouping;
        }

        // Apply range
        if (type === 'month' || type === 'year') {
            if (!baseAxis) {
                // This is set to the user options and picked up later when the
                // axis is instantiated so that we know the min and max.
                range = rangeOptions as any;
            } else {
                ctx = {
                    range: rangeOptions,
                    max: newMax,
                    chart: chart,
                    dataMin: dataMin,
                    dataMax: dataMax
                } as any;
                newMin = baseAxis.minFromRange.call(ctx);
                if (isNumber(ctx.newMax)) {
                    newMax = ctx.newMax;
                }
                // #15799: offsetMin is added in minFromRange so that it works
                // with pre-selected buttons as well
                addOffsetMin = false;
            }

        // Fixed times like minutes, hours, days
        } else if (range) {
            if (isNumber(newMax)) {
                newMin = Math.max(newMax - range, dataMin as any);
                newMax = Math.min(newMin + range, dataMax as any);
                addOffsetMin = false;
            }

        } else if (type === 'ytd') {

            // On user clicks on the buttons, or a delayed action running from
            // the beforeRender event (below), the baseAxis is defined.
            if (baseAxis) {
                // When "ytd" is the pre-selected button for the initial view,
                // its calculation is delayed and rerun in the beforeRender
                // event (below). When the series are initialized, but before
                // the chart is rendered, we have access to the xData array
                // (#942).
                if (
                    baseAxis.hasData() && (
                        !isNumber(dataMax) ||
                        !isNumber(dataMin)
                    )
                ) {
                    dataMin = Number.MAX_VALUE;
                    dataMax = -Number.MAX_VALUE;
                    chart.series.forEach((series): void => {
                        // Reassign it to the last item
                        const xData = series.getColumn('x');
                        if (xData.length) {
                            dataMin = Math.min(xData[0], dataMin as any);
                            dataMax = Math.max(
                                xData[xData.length - 1],
                                dataMax as any
                            );
                        }
                    });
                    redraw = false;
                }

                if (isNumber(dataMax) && isNumber(dataMin)) {
                    ytdExtremes = rangeSelector.getYTDExtremes(
                        dataMax,
                        dataMin
                    );
                    newMin = rangeMin = ytdExtremes.min;
                    newMax = ytdExtremes.max;
                }
            // "ytd" is pre-selected. We don't yet have access to processed
            // point and extremes data (things like pointStart and pointInterval
            // are missing), so we delay the process (#942)
            } else {
                rangeSelector.deferredYTDClick = i;
                return;
            }
        } else if (type === 'all' && baseAxis) {
            // If the navigator exist and the axis range is declared reset that
            // range and from now on only use the range set by a user, #14742.
            if (chart.navigator && chart.navigator.baseSeries[0]) {
                chart.navigator.baseSeries[0].xAxis.options.range = void 0;
            }

            newMin = dataMin;
            newMax = dataMax as any;
        }

        if (addOffsetMin && rangeOptions._offsetMin && defined(newMin)) {
            newMin += rangeOptions._offsetMin;
        }
        if (rangeOptions._offsetMax && defined(newMax)) {
            newMax += rangeOptions._offsetMax;
        }

        if (this.dropdown) {
            this.dropdown.selectedIndex = i + 1;
        }

        // Update the chart
        if (!baseAxis) {
            // Axis not yet instantiated. Temporarily set min and range
            // options and axes once defined and remove them on
            // chart load (#4317 & #20529).
            baseXAxisOptions = splat(chart.options.xAxis || {})[0];
            const axisRangeUpdateEvent = addEvent(
                chart,
                'afterCreateAxes',
                function (): void {
                    const xAxis = chart.xAxis[0];
                    xAxis.range = xAxis.options.range = range;
                    xAxis.min = xAxis.options.min = rangeMin;
                }
            );
            addEvent(chart, 'load', function resetMinAndRange(): void {
                const xAxis = chart.xAxis[0];
                chart.setFixedRange(rangeOptions._range);
                xAxis.options.range = baseXAxisOptions.range;
                xAxis.options.min = baseXAxisOptions.min;
                axisRangeUpdateEvent(); // Remove event
            });
        } else if (isNumber(newMin) && isNumber(newMax)) {
            // Existing axis object. Set extremes after render time.
            baseAxis.setExtremes(
                newMin,
                newMax,
                pick(redraw, true),
                void 0, // Auto animation
                {
                    trigger: 'rangeSelectorButton',
                    rangeSelectorButton: rangeOptions
                }
            );
            chart.setFixedRange(rangeOptions._range);
        }

        fireEvent(this, 'afterBtnClick');
    }

    /**
     * Set the selected option. This method only sets the internal flag, it
     * doesn't update the buttons or the actual zoomed range.
     *
     * @private
     * @function Highcharts.RangeSelector#setSelected
     * @param {number} [selected]
     */
    public setSelected(
        selected?: number
    ): void {
        this.selected = this.options.selected = selected;
    }

    /**
     * Initialize the range selector
     *
     * @private
     * @function Highcharts.RangeSelector#init
     * @param {Highcharts.Chart} chart
     */
    public init(
        chart: Chart
    ): void {
        const rangeSelector = this,
            options = (
                chart.options.rangeSelector as RangeSelectorOptions
            ),
            langOptions = chart.options.lang,
            buttonOptions = (
                options.buttons || this.defaultButtons.map(
                    // Deep copy to avoid modifying the class property
                    (opt): RangeSelectorButtonOptions => ({ ...opt })
                )
            ),
            selectedOption = options.selected,
            blurInputs = function (): void {
                const minInput = rangeSelector.minInput,
                    maxInput = rangeSelector.maxInput;
                // #3274 in some case blur is not defined
                if (minInput && !!minInput.blur) {
                    fireEvent(minInput, 'blur');
                }
                if (maxInput && !!maxInput.blur) {
                    fireEvent(maxInput, 'blur');
                }
            };

        rangeSelector.chart = chart;
        rangeSelector.options = options;
        rangeSelector.buttons = [];

        rangeSelector.buttonOptions = buttonOptions
            .map((opt): RangeSelectorButtonOptions => {
                if (opt.type && langOptions.rangeSelector) {
                    opt.text ??= langOptions.rangeSelector[`${opt.type}Text`];
                    opt.title ??= langOptions.rangeSelector[`${opt.type}Title`];
                }

                opt.text = format(opt.text, {
                    count: opt.count || 1
                });
                opt.title = format(opt.title, {
                    count: opt.count || 1
                });

                return opt;
            });

        this.eventsToUnbind = [];
        this.eventsToUnbind.push(addEvent(
            chart.container,
            'mousedown',
            blurInputs
        ));
        this.eventsToUnbind.push(addEvent(chart, 'resize', blurInputs));

        // Extend the buttonOptions with actual range
        buttonOptions.forEach(rangeSelector.computeButtonRange);

        // Zoomed range based on a pre-selected button index
        if (
            typeof selectedOption !== 'undefined' &&
            buttonOptions[selectedOption]
        ) {
            this.clickButton(selectedOption, false);
        }

        this.eventsToUnbind.push(addEvent(chart, 'load', function (): void {
            // If a data grouping is applied to the current button, release it
            // when extremes change
            if (chart.xAxis && chart.xAxis[0]) {
                addEvent(
                    chart.xAxis[0],
                    'setExtremes',
                    function (e: AxisSetExtremesEventObject): void {
                        if (
                            isNumber(this.max) &&
                            isNumber(this.min) &&
                            this.max - this.min !== chart.fixedRange &&
                            e.trigger !== 'rangeSelectorButton' &&
                            e.trigger !== 'updatedData' &&
                            rangeSelector.forcedDataGrouping &&
                            !rangeSelector.frozenStates
                        ) {
                            this.setDataGrouping(false, false);
                        }
                    }
                );
            }
        }));
        this.createElements();
    }

    /**
     * Dynamically update the range selector buttons after a new range has been
     * set
     *
     * @private
     * @function Highcharts.RangeSelector#updateButtonStates
     */
    public updateButtonStates(): void {
        const rangeSelector = this,
            chart = this.chart,
            dropdown = this.dropdown,
            dropdownLabel = this.dropdownLabel,
            baseAxis = chart.xAxis[0],
            actualRange = Math.round(
                (baseAxis.max as any) - (baseAxis.min as any)
            ),
            hasNoData = !baseAxis.hasVisibleSeries,
            day = 24 * 36e5, // A single day in milliseconds
            unionExtremes = (
                chart.scroller &&
                chart.scroller.getUnionExtremes()
            ) || baseAxis,
            dataMin = unionExtremes.dataMin,
            dataMax = unionExtremes.dataMax,
            ytdExtremes = rangeSelector.getYTDExtremes(
                dataMax as any,
                dataMin as any
            ),
            ytdMin = ytdExtremes.min,
            ytdMax = ytdExtremes.max,
            selected = rangeSelector.selected,
            allButtonsEnabled = rangeSelector.options.allButtonsEnabled,
            buttonStates = new Array(rangeSelector.buttonOptions.length)
                .fill(0),
            selectedExists = isNumber(selected),
            buttons = rangeSelector.buttons;

        let isSelectedTooGreat = false,
            selectedIndex = null;
        rangeSelector.buttonOptions.forEach((
            rangeOptions: RangeSelectorButtonOptions,
            i: number
        ): void => {
            const range = rangeOptions._range,
                type = rangeOptions.type,
                count = rangeOptions.count || 1,
                offsetRange =
                    (rangeOptions._offsetMax as any) -
                    (rangeOptions._offsetMin as any),
                isSelected = i === selected,
                // Disable buttons where the range exceeds what is allowed i;
                // the current view
                isTooGreatRange = (range as any) >
                    (dataMax as any) - (dataMin as any),
                // Disable buttons where the range is smaller than the minimum
                // range
                isTooSmallRange = (range as any) < (baseAxis.minRange as any);

            // Do not select the YTD button if not explicitly told so
            let isYTDButNotSelected = false,
                // Disable the All button if we're already showing all
                isSameRange = range === actualRange;

            if (isSelected && isTooGreatRange) {
                isSelectedTooGreat = true;
            }

            if (
                baseAxis.isOrdinal &&
                baseAxis.ordinal?.positions &&
                range &&
                actualRange < range
            ) {
                // Handle ordinal ranges
                const positions = baseAxis.ordinal.positions,
                    prevOrdinalPosition =
                        OrdinalAxis.Additions.findIndexOf(
                            positions,
                            baseAxis.min as number,
                            true
                        ),
                    nextOrdinalPosition =
                        Math.min(
                            OrdinalAxis.Additions.findIndexOf(
                                positions,
                                baseAxis.max as number,
                                true
                            ) + 1, positions.length - 1);

                if (
                    positions[nextOrdinalPosition] -
                        positions[prevOrdinalPosition] > range
                ) {
                    isSameRange = true;
                }
            } else if (
                // Months and years have variable range so we check the extremes
                (type === 'month' || type === 'year') &&
                (
                    actualRange + 36e5 >=
                    { month: 28, year: 365 }[type] * day * count - offsetRange
                ) &&
                (
                    actualRange - 36e5 <=
                    { month: 31, year: 366 }[type] * day * count + offsetRange
                )
            ) {
                isSameRange = true;
            } else if (type === 'ytd') {
                isSameRange = (ytdMax - ytdMin + offsetRange) === actualRange;
                isYTDButNotSelected = !isSelected;
            } else if (type === 'all') {
                isSameRange = (
                    (baseAxis.max as any) - (baseAxis.min as any) >=
                    (dataMax as any) - (dataMin as any)
                );
            }

            // The new zoom area happens to match the range for a button - mark
            // it selected. This happens when scrolling across an ordinal gap.
            // It can be seen in the intraday demos when selecting 1h and scroll
            // across the night gap.
            const disable = (
                !allButtonsEnabled &&
                !(isSelectedTooGreat && type === 'all') &&
                (
                    isTooGreatRange ||
                    isTooSmallRange ||
                    hasNoData
                )
            );

            const select = (
                (isSelectedTooGreat && type === 'all') ||
                (isYTDButNotSelected ? false : isSameRange) ||
                (isSelected && rangeSelector.frozenStates)
            );


            if (disable) {
                buttonStates[i] = 3;
            } else if (select) {
                if (!selectedExists || i === selected) {
                    selectedIndex = i;
                }
            }

        });

        if (selectedIndex !== null) {
            buttonStates[selectedIndex] = 2;
            rangeSelector.setSelected(selectedIndex);
            if (this.dropdown) {
                this.dropdown.selectedIndex = selectedIndex + 1;
            }
        } else {
            rangeSelector.setSelected();

            if (this.dropdown) {
                this.dropdown.selectedIndex = -1;
            }
            if (dropdownLabel) {
                dropdownLabel.setState(0);
                dropdownLabel.attr({
                    text: (defaultOptions.lang.rangeSelectorZoom || '') + ' ▾'
                });

            }
        }

        for (let i = 0; i < buttonStates.length; i++) {
            const state = buttonStates[i];
            const button = buttons[i];

            if (button.state !== state) {
                button.setState(state);

                if (dropdown) {
                    dropdown.options[i + 1].disabled = (state === 3);

                    if (state === 2) {

                        if (dropdownLabel) {
                            dropdownLabel.setState(2);
                            dropdownLabel.attr({
                                text: rangeSelector.buttonOptions[i].text + ' ▾'
                            });
                        }
                        dropdown.selectedIndex = i + 1;
                    }
                    const bbox = dropdownLabel.getBBox();
                    css(dropdown, {
                        width: `${bbox.width}px`,
                        height: `${bbox.height}px`
                    });
                }
            }
        }
    }

    /**
     * Compute and cache the range for an individual button
     *
     * @private
     * @function Highcharts.RangeSelector#computeButtonRange
     * @param {Highcharts.RangeSelectorButtonsOptions} rangeOptions
     */
    public computeButtonRange(
        rangeOptions: RangeSelectorButtonOptions
    ): void {
        const type = rangeOptions.type as string,
            count = rangeOptions.count || 1,

            // These time intervals have a fixed number of milliseconds, as
            // opposed to month, ytd and year
            fixedTimes = ({
                millisecond: 1,
                second: 1000,
                minute: 60 * 1000,
                hour: 3600 * 1000,
                day: 24 * 3600 * 1000,
                week: 7 * 24 * 3600 * 1000
            } as Record<string, number>);

        // Store the range on the button object
        if (fixedTimes[type]) {
            rangeOptions._range = fixedTimes[type] * count;
        } else if (type === 'month' || type === 'year') {
            rangeOptions._range = ({
                month: 30,
                year: 365
            } as Record<string, number>)[type] * 24 * 36e5 * count;
        }

        rangeOptions._offsetMin = pick(rangeOptions.offsetMin, 0);
        rangeOptions._offsetMax = pick(rangeOptions.offsetMax, 0);
        (rangeOptions._range as any) +=
            (rangeOptions._offsetMax as any) - (rangeOptions._offsetMin as any);
    }

    /**
     * Get the unix timestamp of a HTML input for the dates
     *
     * @private
     * @function Highcharts.RangeSelector#getInputValue
     */
    public getInputValue(name: string): number {
        const input = name === 'min' ? this.minInput : this.maxInput;
        const options = this.chart.options
            .rangeSelector as RangeSelectorOptions;
        const time = this.chart.time;

        if (input) {
            return (
                (input.type === 'text' && options.inputDateParser) ||
                this.defaultInputDateParser
            )(input.value, time.timezone === 'UTC', time);
        }
        return 0;
    }

    /**
     * Set the internal and displayed value of a HTML input for the dates
     *
     * @private
     * @function Highcharts.RangeSelector#setInputValue
     */
    public setInputValue(
        name: string,
        inputTime?: number
    ): void {
        const options = this.options,
            time = this.chart.time,
            input = name === 'min' ? this.minInput : this.maxInput,
            dateBox = name === 'min' ? this.minDateBox : this.maxDateBox;

        if (input) {
            input.setAttribute(
                'type',
                preferredInputType(options.inputDateFormat || '%e %b %Y')
            );
            const hcTimeAttr = input.getAttribute('data-hc-time');
            let updatedTime = defined(hcTimeAttr) ? Number(hcTimeAttr) : void 0;

            if (defined(inputTime)) {
                const previousTime = updatedTime;
                if (defined(previousTime)) {
                    input.setAttribute('data-hc-time-previous', previousTime);
                }
                input.setAttribute('data-hc-time', inputTime);
                updatedTime = inputTime;
            }

            input.value = time.dateFormat(
                (
                    this.inputTypeFormats[input.type] ||
                    options.inputEditDateFormat
                ),
                updatedTime
            );
            if (dateBox) {
                dateBox.attr({
                    text: time.dateFormat(
                        options.inputDateFormat,
                        updatedTime
                    )
                });
            }
        }
    }

    /**
     * Set the min and max value of a HTML input for the dates
     *
     * @private
     * @function Highcharts.RangeSelector#setInputExtremes
     */
    public setInputExtremes(
        name: string,
        min: number,
        max: number
    ): void {
        const input = name === 'min' ? this.minInput : this.maxInput;
        if (input) {
            const format = this.inputTypeFormats[input.type];
            const time = this.chart.time;

            if (format) {
                const newMin = time.dateFormat(format, min);
                if (input.min !== newMin) {
                    input.min = newMin;
                }
                const newMax = time.dateFormat(format, max);
                if (input.max !== newMax) {
                    input.max = newMax;
                }
            }
        }
    }

    /**
     * @private
     * @function Highcharts.RangeSelector#showInput
     * @param {string} name
     */
    public showInput(name: ('min'|'max')): void {
        const dateBox = name === 'min' ? this.minDateBox : this.maxDateBox,
            input = name === 'min' ? this.minInput : this.maxInput;

        if (input && dateBox && this.inputGroup) {
            const isTextInput = input.type === 'text',
                { translateX = 0, translateY = 0 } = this.inputGroup,
                { x = 0, width = 0, height = 0 } = dateBox,
                { inputBoxWidth } = this.options;

            css(input, {
                width: isTextInput ?
                    ((width + (inputBoxWidth ? -2 : 20)) + 'px') :
                    'auto',
                height: (height - 2) + 'px',
                border: '2px solid silver'
            });

            if (isTextInput && inputBoxWidth) {
                css(input, {
                    left: (translateX + x) + 'px',
                    top: translateY + 'px'
                });

            // Inputs of types date, time or datetime-local should be centered
            // on top of the dateBox
            } else {
                css(input, {
                    left: Math.min(
                        Math.round(
                            x +
                            translateX -
                            (input.offsetWidth - width) / 2
                        ),
                        this.chart.chartWidth - input.offsetWidth
                    ) + 'px',
                    top: (
                        translateY - (input.offsetHeight - height) / 2
                    ) + 'px'
                });
            }
        }
    }

    /**
     * @private
     * @function Highcharts.RangeSelector#hideInput
     * @param {string} name
     */
    public hideInput(name: ('min'|'max')): void {
        const input = name === 'min' ? this.minInput : this.maxInput;
        if (input) {
            css(input, {
                top: '-9999em',
                border: 0,
                width: '1px',
                height: '1px'
            });
        }
    }

    /**
     * @private
     * @function Highcharts.RangeSelector#defaultInputDateParser
     */
    public defaultInputDateParser(
        inputDate: string,
        useUTC: boolean,
        time?: Time
    ): number {
        return time?.parse(inputDate) || 0;
    }

    /**
     * Draw either the 'from' or the 'to' HTML input box of the range selector
     *
     * @private
     * @function Highcharts.RangeSelector#drawInput
     */
    public drawInput(
        name: ('min'|'max')
    ): RangeSelector.InputElements {
        const {
            chart,
            div,
            inputGroup
        } = this;

        const rangeSelector = this,
            chartStyle = chart.renderer.style || {},
            renderer = chart.renderer,
            options =
               chart.options.rangeSelector as RangeSelectorOptions,
            lang = defaultOptions.lang,
            isMin = name === 'min';

        /**
         * @private
         */
        function updateExtremes(name: 'min'| 'max'): void {
            const { maxInput, minInput } = rangeSelector,
                chartAxis = chart.xAxis[0],
                unionExtremes = chart.scroller?.getUnionExtremes() || chartAxis,
                dataMin = unionExtremes.dataMin,
                dataMax = unionExtremes.dataMax,
                currentExtreme = chart.xAxis[0].getExtremes()[name];

            let value: number | undefined = rangeSelector.getInputValue(name);

            if (isNumber(value) && value !== currentExtreme) {

                // Validate the extremes. If it goes beyond the data min or
                // max, use the actual data extreme (#2438).
                if (isMin && maxInput && isNumber(dataMin)) {
                    if (value > Number(maxInput.getAttribute('data-hc-time'))) {
                        value = void 0;
                    } else if (value < dataMin) {
                        value = dataMin;
                    }
                } else if (minInput && isNumber(dataMax)) {
                    if (value < Number(minInput.getAttribute('data-hc-time'))) {
                        value = void 0;
                    } else if (value > dataMax) {
                        value = dataMax;
                    }
                }

                // Set the extremes
                if (typeof value !== 'undefined') { // @todo typeof undefined
                    chartAxis.setExtremes(
                        isMin ? value : chartAxis.min,
                        isMin ? chartAxis.max : value,
                        void 0,
                        void 0,
                        { trigger: 'rangeSelectorInput' }
                    );
                }
            }
        }

        // Create the text label
        const text = lang[
            isMin ? 'rangeSelectorFrom' : 'rangeSelectorTo'
        ] || '';
        const label = renderer
            .label(text, 0)
            .addClass('highcharts-range-label')
            .attr({
                padding: text ? 2 : 0,
                height: text ? options.inputBoxHeight : 0
            })
            .add(inputGroup);

        // Create an SVG label that shows updated date ranges and records click
        // events that bring in the HTML input.
        const dateBox = renderer
            .label('', 0)
            .addClass('highcharts-range-input')
            .attr({
                padding: 2,
                width: options.inputBoxWidth,
                height: options.inputBoxHeight,
                'text-align': 'center'
            })
            .on('click', function (): void {
                // If it is already focused, the onfocus event doesn't fire
                // (#3713)
                rangeSelector.showInput(name);
                (rangeSelector as any)[name + 'Input'].focus();
            });

        if (!chart.styledMode) {
            dateBox.attr({
                stroke: options.inputBoxBorderColor,
                'stroke-width': 1
            });
        }

        dateBox.add(inputGroup);


        // Create the HTML input element. This is rendered as 1x1 pixel then set
        // to the right size when focused.
        const input = createElement('input', {
            name: name,
            className: 'highcharts-range-selector'
        }, void 0, div) as HTMLInputElement;

        // #14788: Setting input.type to an unsupported type throws in IE, so
        // we need to use setAttribute instead
        input.setAttribute(
            'type',
            preferredInputType(options.inputDateFormat || '%e %b %Y')
        );

        if (!chart.styledMode) {
            // Styles
            label.css(merge(chartStyle, options.labelStyle));

            dateBox.css(merge({
                color: Palette.neutralColor80
            }, chartStyle, options.inputStyle));

            css(input, extend<CSSObject>({
                position: 'absolute',
                border: 0,
                boxShadow: '0 0 15px rgba(0,0,0,0.3)',
                width: '1px', // Chrome needs a pixel to see it
                height: '1px',
                padding: 0,
                textAlign: 'center',
                fontSize: chartStyle.fontSize,
                fontFamily: chartStyle.fontFamily,
                top: '-9999em' // #4798
            }, options.inputStyle));
        }

        // Blow up the input box
        input.onfocus = (): void => {
            rangeSelector.showInput(name);
        };

        // Hide away the input box
        input.onblur = (): void => {
            // Update extremes only when inputs are active
            if (input === H.doc.activeElement) { // Only when focused
                // Update also when no `change` event is triggered, like when
                // clicking inside the SVG (#4710)
                updateExtremes(name);
            }
            // #10404 - move hide and blur outside focus
            rangeSelector.hideInput(name);
            rangeSelector.setInputValue(name);
            input.blur(); // #4606
        };

        let keyDown = false;

        // Handle changes in the input boxes
        input.onchange = (): void => {
            // Update extremes and blur input when clicking date input calendar
            if (!keyDown) {
                updateExtremes(name);
                rangeSelector.hideInput(name);
                input.blur();
            }
        };

        input.onkeypress = (event: KeyboardEvent): void => {
            // IE does not fire onchange on enter
            if (event.keyCode === 13) {
                updateExtremes(name);
            }
        };

        input.onkeydown = (event: KeyboardEvent): void => {
            keyDown = true;

            // Arrow keys
            if (
                event.key === 'ArrowUp' ||
                event.key === 'ArrowDown' ||
                event.key === 'Tab'
            ) {
                updateExtremes(name);
            }
        };

        input.onkeyup = (): void => {
            keyDown = false;
        };

        return { dateBox, input, label };
    }

    /**
     * Get the position of the range selector buttons and inputs. This can be
     * overridden from outside for custom positioning.
     *
     * @private
     * @function Highcharts.RangeSelector#getPosition
     */
    public getPosition(): Record<string, number> {
        const chart = this.chart,
            options =
                chart.options.rangeSelector as RangeSelectorOptions,
            top = options.verticalAlign === 'top' ?
                chart.plotTop - chart.axisOffset[0] :
                0; // Set offset only for verticalAlign top

        return {
            buttonTop: top + options.buttonPosition.y,
            inputTop: top + options.inputPosition.y - 10
        };
    }
    /**
     * Get the extremes of YTD. Will choose dataMax if its value is lower than
     * the current timestamp. Will choose dataMin if its value is higher than
     * the timestamp for the start of current year.
     *
     * @private
     * @function Highcharts.RangeSelector#getYTDExtremes
     * @return {*}
     * Returns min and max for the YTD
     */
    public getYTDExtremes(
        dataMax: number,
        dataMin: number
    ): RangeSelector.RangeObject {
        const time = this.chart.time,
            year = time.toParts(dataMax)[0],
            startOfYear = time.makeTime(year, 0);

        return {
            max: dataMax,
            min: Math.max(dataMin, startOfYear)
        };
    }

    public createElements(): void {
        const chart = this.chart,
            renderer = chart.renderer,
            container = chart.container,
            chartOptions = chart.options,
            options =
                chartOptions.rangeSelector as RangeSelectorOptions,
            inputEnabled = options.inputEnabled,
            inputsZIndex = pick(chartOptions.chart.style?.zIndex, 0) + 1;

        if (options.enabled === false) {
            return;
        }

        this.group = renderer.g('range-selector-group')
            .attr({
                zIndex: 7
            })
            .add();

        this.div = createElement('div', void 0, {
            position: 'relative',
            height: 0,
            zIndex: inputsZIndex
        });

        if (this.buttonOptions.length) {
            this.renderButtons();
        }

        // First create a wrapper outside the container in order to make
        // the inputs work and make export correct
        if (container.parentNode) {
            container.parentNode.insertBefore(this.div, container);
        }
        if (inputEnabled) {
            this.createInputs();
        }

    }

    /**
     * Create the input elements and its group.
     *
     */
    public createInputs(): void {
        this.inputGroup = this.chart.renderer.g('input-group').add(this.group);

        const minElems = this.drawInput('min');
        this.minDateBox = minElems.dateBox;
        this.minLabel = minElems.label;
        this.minInput = minElems.input;

        const maxElems = this.drawInput('max');
        this.maxDateBox = maxElems.dateBox;
        this.maxLabel = maxElems.label;
        this.maxInput = maxElems.input;

    }
    /**
     * Render the range selector including the buttons and the inputs. The first
     * time render is called, the elements are created and positioned. On
     * subsequent calls, they are moved and updated.
     *
     * @private
     * @function Highcharts.RangeSelector#render
     * @param {number} [min]
     *        X axis minimum
     * @param {number} [max]
     *        X axis maximum
     */
    public render(
        min?: number,
        max?: number
    ): void {

        if (this.options.enabled === false) {
            return;
        }

        const chart = this.chart,
            chartOptions = chart.options,
            options = chartOptions.rangeSelector as RangeSelectorOptions,
            // Place inputs above the container
            inputEnabled = options.inputEnabled;

        if (inputEnabled) {
            if (!this.inputGroup) {

                this.createInputs();
            }
            // Set or reset the input values
            this.setInputValue('min', min);
            this.setInputValue('max', max);

            if (!this.chart.styledMode) {
                this.maxLabel?.css(options.labelStyle);
                this.minLabel?.css(options.labelStyle);
            }
            const unionExtremes = (
                chart.scroller && chart.scroller.getUnionExtremes()
            ) || chart.xAxis[0] || {};

            if (
                defined(unionExtremes.dataMin) &&
                defined(unionExtremes.dataMax)
            ) {
                const minRange = chart.xAxis[0].minRange || 0;

                this.setInputExtremes(
                    'min',
                    unionExtremes.dataMin,
                    Math.min(
                        unionExtremes.dataMax,
                        this.getInputValue('max')
                    ) - minRange
                );
                this.setInputExtremes(
                    'max',
                    Math.max(
                        unionExtremes.dataMin,
                        this.getInputValue('min')
                    ) + minRange,
                    unionExtremes.dataMax
                );
            }

            // Reflow
            if (this.inputGroup) {
                let x = 0;
                [
                    this.minLabel,
                    this.minDateBox,
                    this.maxLabel,
                    this.maxDateBox
                ].forEach((label): void => {
                    if (label) {
                        const { width } = label.getBBox();
                        if (width) {
                            label.attr({ x });
                            x += width + options.inputSpacing;
                        }
                    }
                });
            }
        } else {
            if (this.inputGroup) {
                this.inputGroup.destroy();
                delete this.inputGroup;
            }
        }

        if (!this.chart.styledMode) {
            if (this.zoomText) {
                this.zoomText.css(options.labelStyle);
            }
        }

        this.alignElements();
        this.updateButtonStates();
    }

    /**
     * Render the range buttons. This only runs the first time, later the
     * positioning is laid out in alignElements.
     *
     * @private
     * @function Highcharts.RangeSelector#renderButtons
     */
    public renderButtons(): void {
        const {
            chart,
            options
        } = this;
        const lang = defaultOptions.lang;
        const renderer = chart.renderer;

        const buttonTheme = merge(options.buttonTheme);
        const states = buttonTheme && buttonTheme.states;

        // Prevent the button from resetting the width when the button state
        // changes since we need more control over the width when collapsing
        // the buttons
        delete buttonTheme.width;
        delete buttonTheme.states;

        this.buttonGroup = renderer.g('range-selector-buttons').add(this.group);

        const dropdown = this.dropdown = createElement('select', void 0, {
            position: 'absolute',
            padding: 0,
            border: 0,
            cursor: 'pointer',
            opacity: 0.0001
        }, this.div) as HTMLSelectElement;

        // Create a label for dropdown select element
        const userButtonTheme = chart.userOptions.rangeSelector?.buttonTheme;
        this.dropdownLabel = renderer.button(
            '',
            0,
            0,
            (): void => {},
            merge(buttonTheme, {
                'stroke-width': pick(buttonTheme['stroke-width'], 0),
                width: 'auto',
                paddingLeft: pick(
                    options.buttonTheme.paddingLeft,
                    userButtonTheme?.padding,
                    8
                ),
                paddingRight: pick(
                    options.buttonTheme.paddingRight,
                    userButtonTheme?.padding,
                    8
                )
            }),
            states && states.hover,
            states && states.select,
            states && states.disabled
        )
            .hide()
            .add(this.group);

        // Prevent page zoom on iPhone
        addEvent(dropdown, 'touchstart', (): void => {
            dropdown.style.fontSize = '16px';
        });

        // Forward events from select to button
        const mouseOver = H.isMS ? 'mouseover' : 'mouseenter',
            mouseOut = H.isMS ? 'mouseout' : 'mouseleave';
        addEvent(dropdown, mouseOver, (): void => {
            fireEvent(this.dropdownLabel.element, mouseOver);
        });
        addEvent(dropdown, mouseOut, (): void => {
            fireEvent(this.dropdownLabel.element, mouseOut);
        });
        addEvent(dropdown, 'change', (): void => {
            const button = this.buttons[dropdown.selectedIndex - 1];
            fireEvent(button.element, 'click');
        });

        this.zoomText = renderer
            .label(lang.rangeSelectorZoom || '', 0)
            .attr({
                padding: options.buttonTheme.padding,
                height: options.buttonTheme.height,
                paddingLeft: 0,
                paddingRight: 0
            })
            .add(this.buttonGroup);

        if (!this.chart.styledMode) {
            this.zoomText.css(options.labelStyle);
            options.buttonTheme['stroke-width'] ??= 0;
        }


        createElement('option', {
            textContent: this.zoomText.textStr,
            disabled: true
        }, void 0, dropdown);

        this.createButtons();
    }

    private createButtons(): void {
        const { options } = this;
        const buttonTheme = merge(options.buttonTheme);
        const states = buttonTheme && buttonTheme.states;

        // Prevent the button from resetting the width when the button state
        // changes since we need more control over the width when collapsing
        // the buttons
        const width = buttonTheme.width || 28;
        delete buttonTheme.width;
        delete buttonTheme.states;

        const langOptions = this.chart.options.lang;

        this.buttonOptions.forEach((
            rangeOptions: RangeSelectorButtonOptions,
            i: number
        ): void => {
            if (rangeOptions.type && langOptions.rangeSelector) {
                rangeOptions.text ??= langOptions.rangeSelector[`${rangeOptions.type}Text`];
                rangeOptions.title ??= langOptions.rangeSelector[`${rangeOptions.type}Title`];
            }

            rangeOptions.text = format(rangeOptions.text, {
                count: rangeOptions.count || 1
            });

            rangeOptions.title = format(rangeOptions.title, {
                count: rangeOptions.count || 1
            });

            this.createButton(rangeOptions, i, width, states);
        });
    }

    private createButton(
        rangeOptions: RangeSelectorButtonOptions,
        i: number,
        width: number,
        states?: ButtonThemeStatesObject
    ): void {
        const { dropdown, buttons, chart, options } = this;
        const renderer = chart.renderer;
        const buttonTheme = merge(options.buttonTheme);
        dropdown?.add(
            createElement('option', {
                textContent: rangeOptions.title || rangeOptions.text
            }) as HTMLOptionElement,
            i + 2
        );

        buttons[i] = renderer
            .button(
                rangeOptions.text ?? '',
                0,
                0,
                (e: (Event | AnyRecord)): void => {

                    // Extract events from button object and call
                    const buttonEvents = (
                        rangeOptions.events && rangeOptions.events.click
                    );

                    let callDefaultEvent;

                    if (buttonEvents) {
                        callDefaultEvent =
                            buttonEvents.call(rangeOptions, e as any);
                    }

                    if (callDefaultEvent !== false) {
                        this.clickButton(i);
                    }

                    this.isActive = true;
                },
                buttonTheme,
                states && states.hover,
                states && states.select,
                states && states.disabled
            )
            .attr({
                'text-align': 'center',
                width
            })
            .add(this.buttonGroup);

        if (rangeOptions.title) {
            buttons[i].attr('title', rangeOptions.title);
        }
    }

    /**
     * Align the elements horizontally and vertically.
     *
     * @private
     * @function Highcharts.RangeSelector#alignElements
     */
    public alignElements(): void {
        const {
            buttonGroup,
            buttons,
            chart,
            group,
            inputGroup,
            options,
            zoomText
        } = this;
        const chartOptions = chart.options;
        const navButtonOptions = (
            chartOptions.exporting &&
            chartOptions.exporting.enabled !== false &&
            chartOptions.navigation &&
            chartOptions.navigation.buttonOptions
        );
        const {
            buttonPosition,
            inputPosition,
            verticalAlign
        } = options;

        // Get the X offset required to avoid overlapping with the exporting
        // button. This is used both by the buttonGroup and the inputGroup.
        const getXOffsetForExportButton = (
            group: SVGElement,
            position: RangeSelectorPositionOptions,
            rightAligned?: boolean
        ): number => {
            if (
                navButtonOptions &&
                this.titleCollision(chart) &&
                verticalAlign === 'top' &&
                rightAligned && (
                    (
                        position.y -
                        group.getBBox().height - 12
                    ) <
                    (
                        (navButtonOptions.y || 0) +
                        (navButtonOptions.height || 0) +
                        chart.spacing[0]
                    )
                )
            ) {
                return -40;
            }
            return 0;
        };

        let plotLeft = chart.plotLeft;

        if (group && buttonPosition && inputPosition) {

            let translateX = buttonPosition.x - chart.spacing[3];

            if (buttonGroup) {
                this.positionButtons();

                if (!this.initialButtonGroupWidth) {
                    let width = 0;

                    if (zoomText) {
                        width += zoomText.getBBox().width + 5;
                    }

                    buttons.forEach((
                        button: SVGElement,
                        i: number
                    ): void => {
                        width += button.width || 0;
                        if (i !== buttons.length - 1) {
                            width += options.buttonSpacing;
                        }
                    });

                    this.initialButtonGroupWidth = width;
                }

                plotLeft -= chart.spacing[3];

                // Detect collision between button group and exporting
                const xOffsetForExportButton = getXOffsetForExportButton(
                    buttonGroup,
                    buttonPosition,
                    buttonPosition.align === 'right' ||
                    inputPosition.align === 'right'
                );

                this.alignButtonGroup(xOffsetForExportButton);
                if (this.buttonGroup?.translateY) {
                    this.dropdownLabel
                        .attr({ y: this.buttonGroup.translateY });
                }

                // Skip animation
                group.placed = buttonGroup.placed = chart.hasLoaded;
            }

            let xOffsetForExportButton = 0;

            if (options.inputEnabled && inputGroup) {
                // Detect collision between the input group and exporting button
                xOffsetForExportButton = getXOffsetForExportButton(
                    inputGroup,
                    inputPosition,
                    buttonPosition.align === 'right' ||
                    inputPosition.align === 'right'
                );

                if (inputPosition.align === 'left') {
                    translateX = plotLeft;
                } else if (inputPosition.align === 'right') {
                    translateX = -Math.max(
                        chart.axisOffset[1],
                        -xOffsetForExportButton
                    );
                }

                // Update the alignment to the updated spacing box
                inputGroup.align({
                    y: inputPosition.y,
                    width: inputGroup.getBBox().width,
                    align: inputPosition.align,
                    // Fix wrong getBBox() value on right align
                    x: inputPosition.x + translateX - 2
                }, true, chart.spacingBox);

                // Skip animation
                inputGroup.placed = chart.hasLoaded;
            }
            this.handleCollision(xOffsetForExportButton);

            // Vertical align
            group.align({
                verticalAlign
            }, true, chart.spacingBox);

            const alignTranslateY = group.alignAttr.translateY;

            // Set position
            let groupHeight = group.getBBox().height + 20; // # 20 padding
            let translateY = 0;

            // Calculate bottom position
            if (verticalAlign === 'bottom') {
                const legendOptions = chart.legend && chart.legend.options;
                const legendHeight = (
                    legendOptions &&
                    legendOptions.verticalAlign === 'bottom' &&
                    legendOptions.enabled &&
                    !legendOptions.floating ?
                        (
                            chart.legend.legendHeight +
                            pick(legendOptions.margin, 10)
                        ) :
                        0
                );

                groupHeight = groupHeight + legendHeight - 20;
                translateY = (
                    alignTranslateY -
                    groupHeight -
                    (options.floating ? 0 : options.y) -
                    (chart.titleOffset ? chart.titleOffset[2] : 0) -
                    10 // 10 spacing
                );
            }

            if (verticalAlign === 'top') {
                if (options.floating) {
                    translateY = 0;
                }

                if (chart.titleOffset && chart.titleOffset[0]) {
                    translateY = chart.titleOffset[0];
                }

                translateY += ((chart.margin[0] - chart.spacing[0]) || 0);

            } else if (verticalAlign === 'middle') {
                if (inputPosition.y === buttonPosition.y) {
                    translateY = alignTranslateY;
                } else if (inputPosition.y || buttonPosition.y) {
                    if (
                        inputPosition.y < 0 ||
                        buttonPosition.y < 0
                    ) {
                        translateY -= Math.min(
                            inputPosition.y,
                            buttonPosition.y
                        );
                    } else {
                        translateY = alignTranslateY - groupHeight;
                    }
                }
            }

            group.translate(
                options.x,
                options.y + Math.floor(translateY)
            );

            // Translate HTML inputs
            const { minInput, maxInput, dropdown } = this;
            if (options.inputEnabled && minInput && maxInput) {
                minInput.style.marginTop = group.translateY + 'px';
                maxInput.style.marginTop = group.translateY + 'px';
            }
            if (dropdown) {
                dropdown.style.marginTop = group.translateY + 'px';
            }
        }
    }

    /**
     * @private
     */
    public redrawElements(): void {
        const chart = this.chart,
            { inputBoxHeight, inputBoxBorderColor } = this.options;

        this.maxDateBox?.attr({
            height: inputBoxHeight
        });

        this.minDateBox?.attr({
            height: inputBoxHeight
        });

        if (!chart.styledMode) {
            this.maxDateBox?.attr({
                stroke: inputBoxBorderColor
            });

            this.minDateBox?.attr({
                stroke: inputBoxBorderColor
            });
        }

        if (this.isDirty) {

            this.isDirty = false;
            // Reset this prop to force redrawing collapse of buttons
            this.isCollapsed = void 0;
            const newButtonsOptions = this.options.buttons ?? [];
            const btnLength = Math.min(
                newButtonsOptions.length,
                this.buttonOptions.length
            );
            const { dropdown, options } = this;
            const buttonTheme = merge(options.buttonTheme);
            const states = buttonTheme && buttonTheme.states;

            // Prevent the button from resetting the width when the button state
            // changes since we need more control over the width when collapsing
            // the buttons
            const width = buttonTheme.width || 28;


            // Destroy additional buttons
            if (newButtonsOptions.length < this.buttonOptions.length) {
                for (
                    let i = this.buttonOptions.length - 1;
                    i >= newButtonsOptions.length;
                    i--
                ) {
                    const btn = this.buttons.pop();
                    btn?.destroy();
                    this.dropdown?.options.remove(i + 1);
                }
            }

            // Update current buttons
            for (let i = btnLength - 1; i >= 0; i--) {
                const diff = diffObjects(
                    newButtonsOptions[i],
                    this.buttonOptions[i]
                );

                if (Object.keys(diff).length !== 0) {
                    const rangeOptions = newButtonsOptions[i];
                    this.buttons[i].destroy();
                    dropdown?.options.remove(i + 1);
                    this.createButton(rangeOptions, i, width, states);
                    this.computeButtonRange(rangeOptions);

                }
            }

            // Create missing buttons
            if (newButtonsOptions.length > this.buttonOptions.length) {
                for (
                    let i = this.buttonOptions.length;
                    i < newButtonsOptions.length;
                    i++
                ) {
                    this.createButton(newButtonsOptions[i], i, width, states);
                    this.computeButtonRange(newButtonsOptions[i]);
                }
            }
            this.buttonOptions = this.options.buttons ?? [];

            if (defined(this.options.selected) && this.buttons.length) {
                this.clickButton(this.options.selected, false);
            }

        }
    }

    /**
     * Align the button group horizontally and vertically.
     *
     * @private
     * @function Highcharts.RangeSelector#alignButtonGroup
     * @param {number} xOffsetForExportButton
     * @param {number} [width]
     */
    public alignButtonGroup(
        xOffsetForExportButton: number,
        width?: number
    ): void {
        const { chart, options, buttonGroup, dropdown, dropdownLabel } = this;
        const { buttonPosition } = options;
        const plotLeft = chart.plotLeft - chart.spacing[3];
        let translateX = buttonPosition.x - chart.spacing[3];
        let dropdownTranslateX = chart.plotLeft;

        if (buttonPosition.align === 'right') {
            translateX += xOffsetForExportButton - plotLeft; // #13014

            if (this.hasVisibleDropdown) {
                dropdownTranslateX = chart.chartWidth +
                    xOffsetForExportButton -
                    this.maxButtonWidth() - 20;
            }
        } else if (buttonPosition.align === 'center') {
            translateX -= plotLeft / 2;

            if (this.hasVisibleDropdown) {
                dropdownTranslateX = chart.chartWidth / 2 -
                this.maxButtonWidth();
            }
        }

        if (dropdown) {
            css(dropdown, {
                left: dropdownTranslateX + 'px',
                top: buttonGroup?.translateY + 'px'
            });
        }

        dropdownLabel?.attr({
            x: dropdownTranslateX
        });

        if (buttonGroup) {
            // Align button group
            buttonGroup.align({
                y: buttonPosition.y,
                width: pick(width, this.initialButtonGroupWidth),
                align: buttonPosition.align,
                x: translateX
            }, true, chart.spacingBox);
        }
    }

    /**
     * @private
     * @function Highcharts.RangeSelector#positionButtons
     */
    public positionButtons(): void {
        const {
            buttons,
            chart,
            options,
            zoomText
        } = this;
        const verb = chart.hasLoaded ? 'animate' : 'attr';
        const { buttonPosition } = options;

        const plotLeft = chart.plotLeft;
        let buttonLeft = plotLeft;

        if (zoomText && zoomText.visibility !== 'hidden') {
            // #8769, allow dynamically updating margins
            zoomText[verb]({
                x: pick(plotLeft + buttonPosition.x, plotLeft)
            });

            // Button start position
            buttonLeft += buttonPosition.x +
                zoomText.getBBox().width + 5;
        }

        for (let i = 0, iEnd = this.buttonOptions.length; i < iEnd; ++i) {
            if (buttons[i].visibility !== 'hidden') {
                buttons[i][verb]({ x: buttonLeft });

                // Increase the button position for the next button
                buttonLeft += (buttons[i].width || 0) + options.buttonSpacing;
            } else {
                buttons[i][verb]({ x: plotLeft });
            }
        }
    }

    public maxButtonWidth = (): number => {
        let buttonWidth = 0;

        this.buttons.forEach((button): void => {
            const bBox = button.getBBox();
            if (bBox.width > buttonWidth) {
                buttonWidth = bBox.width;
            }
        });

        return buttonWidth;
    };

    /**
     * Handle collision between the button group and the input group
     *
     * @private
     * @function Highcharts.RangeSelector#handleCollision
     *
     * @param  {number} xOffsetForExportButton
     *                  The X offset of the group required to make room for the
     *                  exporting button
     */
    public handleCollision(xOffsetForExportButton: number): void {
        const {
            chart,
            buttonGroup,
            inputGroup,
            initialButtonGroupWidth
        } = this;

        const {
            buttonPosition,
            dropdown,
            inputPosition
        } = this.options;

        const moveInputsDown = (): void => {
            if (inputGroup && buttonGroup) {
                inputGroup.attr({
                    translateX: inputGroup.alignAttr.translateX + (
                        chart.axisOffset[1] >= -xOffsetForExportButton ?
                            0 :
                            -xOffsetForExportButton
                    ),
                    translateY: inputGroup.alignAttr.translateY +
                        buttonGroup.getBBox().height + 10
                });
            }
        };

        // Detect collision
        if (inputGroup && buttonGroup) {
            if (inputPosition.align === buttonPosition.align) {
                moveInputsDown();

                if (
                    initialButtonGroupWidth >
                    chart.plotWidth + xOffsetForExportButton - 20
                ) {
                    this.collapseButtons();
                } else {
                    this.expandButtons();
                }
            } else if (
                initialButtonGroupWidth -
                xOffsetForExportButton +
                inputGroup.getBBox().width >
                chart.plotWidth
            ) {
                if (dropdown === 'responsive') {
                    this.collapseButtons();
                } else {
                    moveInputsDown();
                }
            } else {
                this.expandButtons();
            }
        } else if (buttonGroup && dropdown === 'responsive') {
            if (initialButtonGroupWidth > chart.plotWidth) {
                this.collapseButtons();
            } else {
                this.expandButtons();
            }
        }

        // Forced states
        if (buttonGroup) {
            if (dropdown === 'always') {
                this.collapseButtons();
            }
            if (dropdown === 'never') {
                this.expandButtons();
            }
        }

        this.alignButtonGroup(xOffsetForExportButton);
    }

    /**
     * Collapse the buttons and show the select element.
     *
     * @private
     * @function Highcharts.RangeSelector#collapseButtons
     * @param {number} xOffsetForExportButton
     */
    public collapseButtons(): void {
        const {
            buttons,
            zoomText
        } = this;

        if (this.isCollapsed === true) {
            return;
        }

        this.isCollapsed = true;

        zoomText.hide();
        buttons.forEach((button): void => void button.hide());
        this.showDropdown();
    }

    /**
     * Show all the buttons and hide the select element.
     *
     * @private
     * @function Highcharts.RangeSelector#expandButtons
     */
    public expandButtons(): void {
        const {
            buttons,
            zoomText
        } = this;

        if (this.isCollapsed === false) {
            return;
        }

        this.isCollapsed = false;

        this.hideDropdown();
        zoomText.show();
        buttons.forEach((button): void => void button.show());
        this.positionButtons();
    }

    /**
     * Position the select element on top of the button.
     *
     * @private
     * @function Highcharts.RangeSelector#showDropdown
     */
    public showDropdown(): void {
        const {
            buttonGroup,
            dropdownLabel,
            dropdown
        } = this;
        if (buttonGroup && dropdown) {
            dropdownLabel.show();

            css(dropdown, { visibility: 'inherit' });
            this.hasVisibleDropdown = true;
        }
    }

    /**
     * @private
     * @function Highcharts.RangeSelector#hideDropdown
     */
    public hideDropdown(): void {
        const { dropdown } = this;

        if (dropdown) {
            this.dropdownLabel.hide();
            css(dropdown, {
                visibility: 'hidden',
                width: '1px',
                height: '1px'
            });
            this.hasVisibleDropdown = false;
        }
    }

    /**
     * Extracts height of range selector
     *
     * @private
     * @function Highcharts.RangeSelector#getHeight
     * @return {number}
     * Returns rangeSelector height
     */
    public getHeight(): number {
        const rangeSelector = this,
            options = rangeSelector.options,
            rangeSelectorGroup = rangeSelector.group,
            inputPosition = options.inputPosition,
            buttonPosition = options.buttonPosition,
            yPosition = options.y,
            buttonPositionY = buttonPosition.y,
            inputPositionY = inputPosition.y;

        let rangeSelectorHeight = 0;

        if (options.height) {
            return options.height;
        }

        // Align the elements before we read the height in case we're switching
        // between wrapped and non-wrapped layout
        this.alignElements();


        rangeSelectorHeight = rangeSelectorGroup ?
            // 13px to keep back compatibility
            (rangeSelectorGroup.getBBox(true).height) + 13 +
                yPosition :
            0;

        const minPosition = Math.min(inputPositionY, buttonPositionY);

        if (
            (inputPositionY < 0 && buttonPositionY < 0) ||
            (inputPositionY > 0 && buttonPositionY > 0)
        ) {
            rangeSelectorHeight += Math.abs(minPosition);
        }

        return rangeSelectorHeight;
    }

    /**
     * Detect collision with title or subtitle
     *
     * @private
     * @function Highcharts.RangeSelector#titleCollision
     * @return {boolean}
     * Returns collision status
     */
    public titleCollision(
        chart: Chart
    ): boolean {
        return !(
            (chart.options.title as any).text ||
            (chart.options.subtitle as any).text
        );
    }

    /**
     * Update the range selector with new options
     *
     * @private
     * @function Highcharts.RangeSelector#update
     * @param {Highcharts.RangeSelectorOptions} options
     */
    public update(
        options: RangeSelectorOptions,
        redraw: boolean = true
    ): void {
        const chart = this.chart;
        merge(true, this.options, options);
        if (
            this.options.selected &&
            this.options.selected >= this.options.buttons!.length
        ) {
            this.options.selected = void 0;
            chart.options.rangeSelector!.selected = void 0;
        }
        if (defined(options.enabled)) {
            this.destroy();
            return this.init(chart);
        }

        this.isDirty = !!options.buttons;

        if (redraw) {
            this.render();
        }
    }

    /**
     * Destroys allocated elements.
     *
     * @private
     * @function Highcharts.RangeSelector#destroy
     */
    public destroy(): void {
        const rSelector: RangeSelector = this,
            minInput = rSelector.minInput,
            maxInput = rSelector.maxInput;

        if (rSelector.eventsToUnbind) {
            rSelector.eventsToUnbind.forEach((
                unbind: Function
            ): void => unbind());
            rSelector.eventsToUnbind = void 0;
        }

        // Destroy elements in collections
        destroyObjectProperties(rSelector.buttons);

        // Clear input element events
        if (minInput) {
            minInput.onfocus = minInput.onblur = minInput.onchange = null;
        }
        if (maxInput) {
            maxInput.onfocus = maxInput.onblur = maxInput.onchange = null;
        }

        // Destroy HTML and SVG elements
        objectEach(rSelector, function (val, key): void {
            if (val && key !== 'chart') {
                if (val instanceof SVGElement) {
                    // SVGElement
                    val.destroy();

                } else if (
                    val instanceof window.HTMLElement
                ) {
                    // HTML element
                    discardElement(val);
                }
                delete rSelector[key];
            }
            if (val !== RangeSelector.prototype[key]) {
                (rSelector as any)[key] = null;
            }
        }, this);

        this.buttons = [];
    }
}

/* *
 *
 *  Class Prototype
 *
 * */

interface RangeSelector {
    defaultButtons: Array<RangeSelectorButtonOptions>;
    inputTypeFormats: Record<string, string>;
}

extend(RangeSelector.prototype, {
    /**
     * The date formats to use when setting min, max and value on date inputs.
     * @private
     */
    inputTypeFormats: {
        'datetime-local': '%Y-%m-%dT%H:%M:%S',
        'date': '%Y-%m-%d',
        'time': '%H:%M:%S'
    }
});

/* *
 *
 *  Class Namespace
 *
 * */

namespace RangeSelector {
    export interface InputElements {
        dateBox: SVGElement;
        input: HTMLInputElement;
        label: SVGElement;
    }
    export interface RangeObject {
        max: number;
        min: number;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default RangeSelector;

/* *
 *
 *  API Options
 *
 * */

/**
 * Define the time span for the button
 *
 * @typedef {"all"|"day"|"hour"|"millisecond"|"minute"|"month"|"second"|"week"|"year"|"ytd"} Highcharts.RangeSelectorButtonTypeValue
 */

/**
 * Callback function to react on button clicks.
 *
 * @callback Highcharts.RangeSelectorClickCallbackFunction
 *
 * @param {global.Event} e
 *        Event arguments.
 *
 * @param {boolean|undefined}
 *        Return false to cancel the default button event.
 */

/**
 * Callback function to parse values entered in the input boxes and return a
 * valid JavaScript time as milliseconds since 1970.
 *
 * @callback Highcharts.RangeSelectorParseCallbackFunction
 *
 * @param {string} value
 *        Input value to parse.
 *
 * @return {number}
 *         Parsed JavaScript time value.
 */

(''); // Keeps doclets above in JS file
