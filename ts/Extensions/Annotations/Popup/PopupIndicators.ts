/* *
 *
 *  Popup generator for Stock tools
 *
 *  (c) 2009-2021 Sebastian Bochan
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

import type AnnotationChart from '../AnnotationChart';
import type AnnotationOptions from '../AnnotationOptions';
import type Chart from '../../../Core/Chart/Chart';
import type { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType';
import type {
    default as Popup,
    PopupFieldsTree
} from './Popup';
import type Series from '../../../Core/Series/Series';
import type SMAIndicator from '../../../Stock/Indicators/SMA/SMAIndicator';

import AST from '../../../Core/Renderer/HTML/AST.js';
import H from '../../../Core/Globals.js';
const { doc } = H;
import NU from '../NavigationBindingsUtilities.js';
const { annotationsFieldsTypes } = NU;
import SeriesRegistry from '../../../Core/Series/SeriesRegistry.js';
const { seriesTypes } = SeriesRegistry;
import U from '../../../Shared/Utilities.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
import AH from '../../../Shared/Helpers/ArrayHelper.js';
const {
    stableSort
} = AH;
import TC from '../../../Shared/Helpers/TypeChecker.js';
const { isArray, isObject } = TC;
const { defined, objectEach } = OH;
const { addEvent } = EH;
const {
    createElement
} = U;

/* *
 *
 *  Declarations
 *
 * */

interface FilteredSeries {
    indicatorFullName: string;
    indicatorType: string;
    series: SMAIndicator;
}

interface IndicatorNameCouple {
    indicatorFullName: string;
    indicatorType: string;
}

/* *
 *
 *  Enums
 *
 * */

/**
 * Enum for properties which should have dropdown list.
 * @private
 */
enum DropdownProperties {
    'params.algorithm',
    'params.average'
}

/**
 * List of available algorithms for the specific indicator.
 * @private
 */
const dropdownParameters: Record<string, Array<string>> = {
    'algorithm-pivotpoints': ['standard', 'fibonacci', 'camarilla'],
    'average-disparityindex': ['sma', 'ema', 'dema', 'tema', 'wma']
};

/* *
 *
 *  Functions
 *
 * */

/**
 * Create two columns (divs) in HTML.
 * @private
 * @param {Highcharts.HTMLDOMElement} container
 * Container of columns
 * @return {Highcharts.Dictionary<Highcharts.HTMLDOMElement>}
 * Reference to two HTML columns (lhsCol, rhsCol)
 */
function addColsContainer(
    container: HTMLDOMElement
): Record<string, HTMLDOMElement> {

    // left column
    const lhsCol = createElement(
        'div',
        {
            className: 'highcharts-popup-lhs-col'
        },
        void 0,
        container
    );

    // right column
    const rhsCol = createElement(
        'div',
        {
            className: 'highcharts-popup-rhs-col'
        },
        void 0,
        container
    );

    // wrapper content
    createElement(
        'div',
        {
            className: 'highcharts-popup-rhs-col-wrapper'
        },
        void 0,
        rhsCol
    );

    return {
        lhsCol: lhsCol,
        rhsCol: rhsCol
    };
}

/**
 * Create indicator's form. It contains two tabs (ADD and EDIT) with
 * content.
 * @private
 */
function addForm(
    this: Popup,
    chart: AnnotationChart,
    _options: AnnotationOptions,
    callback: Function
): void {
    const lang = this.lang;

    let buttonParentDiv: HTMLDOMElement;

    if (!chart) {
        return;
    }

    // add tabs
    this.tabs.init.call(this, chart);

    // get all tabs content divs
    const tabsContainers = this.container
        .querySelectorAll('.highcharts-tab-item-content');

    // ADD tab
    addColsContainer(tabsContainers[0] as HTMLDOMElement);
    addSearchBox.call(
        this,
        chart,
        tabsContainers[0] as HTMLDOMElement
    );
    addIndicatorList.call(
        this,
        chart,
        tabsContainers[0] as HTMLDOMElement,
        'add'
    );

    buttonParentDiv = tabsContainers[0]
        .querySelectorAll('.highcharts-popup-rhs-col')[0] as HTMLDOMElement;

    this.addButton(
        buttonParentDiv,
        lang.addButton || 'add',
        'add',
        buttonParentDiv,
        callback
    );

    // EDIT tab
    addColsContainer(tabsContainers[1] as HTMLDOMElement);
    addIndicatorList.call(
        this,
        chart,
        tabsContainers[1] as HTMLDOMElement,
        'edit'
    );

    buttonParentDiv = tabsContainers[1]
        .querySelectorAll('.highcharts-popup-rhs-col')[0] as HTMLDOMElement;

    this.addButton(
        buttonParentDiv,
        lang.saveButton || 'save',
        'edit',
        buttonParentDiv,
        callback
    );
    this.addButton(
        buttonParentDiv,
        lang.removeButton || 'remove',
        'remove',
        buttonParentDiv,
        callback
    );
}

/**
 * Create typical inputs for chosen indicator. Fields are extracted from
 * defaultOptions (ADD mode) or current indicator (ADD mode). Two extra
 * fields are added:
 * - hidden input - contains indicator type (required for callback)
 * - select - list of series which can be linked with indicator
 * @private
 * @param {Highcharts.Chart} chart
 * Chart
 * @param {Highcharts.Series} series
 * Indicator
 * @param {string} seriesType
 * Indicator type like: sma, ema, etc.
 * @param {Highcharts.HTMLDOMElement} rhsColWrapper
 * Element where created HTML list is added
 */
function addFormFields(
    this: Popup,
    chart: AnnotationChart,
    series: SMAIndicator,
    seriesType: string,
    rhsColWrapper: HTMLDOMElement
): void {
    const fields = (series as any).params || series.options.params;

    // reset current content
    rhsColWrapper.innerHTML = AST.emptyHTML;

    // create title (indicator name in the right column)
    createElement(
        'h3',
        {
            className: 'highcharts-indicator-title'
        },
        void 0,
        rhsColWrapper
    ).appendChild(
        doc.createTextNode(
            getNameType(series, seriesType).indicatorFullName
        )
    );

    // input type
    createElement(
        'input',
        {
            type: 'hidden',
            name: 'highcharts-type-' + seriesType,
            value: seriesType
        },
        void 0,
        rhsColWrapper
    );

    // list all series with id
    listAllSeries.call(
        this,
        seriesType,
        'series',
        chart,
        rhsColWrapper,
        series,
        series.linkedParent && series.linkedParent.options.id
    );

    if (fields.volumeSeriesID) {
        listAllSeries.call(
            this,
            seriesType,
            'volume',
            chart,
            rhsColWrapper,
            series,
            series.linkedParent && fields.volumeSeriesID
        );
    }

    // add param fields
    addParamInputs.call(
        this,
        chart,
        'params',
        fields,
        seriesType,
        rhsColWrapper
    );
}

/**
 * Create HTML list of all indicators (ADD mode) or added indicators
 * (EDIT mode).
 *
 * @private
 *
 * @param {Highcharts.AnnotationChart} chart
 *        The chart object.
 *
 * @param {string} [optionName]
 *        Name of the option into which selection is being added.
 *
 * @param {HTMLDOMElement} [parentDiv]
 *        HTML parent element.
 *
 * @param {string} listType
 *        Type of list depending on the selected bookmark.
 *        Might be 'add' or 'edit'.
 *
 * @param {string|undefined} filter
 *        Applied filter string from the input.
 *        For the first iteration, it's an empty string.
 */
function addIndicatorList(
    this: Popup,
    chart: AnnotationChart,
    parentDiv: HTMLDOMElement,
    listType: string,
    filter?: string
): void {
    const popup = this,
        lang = popup.lang,
        lhsCol = parentDiv.querySelectorAll(
            '.highcharts-popup-lhs-col'
        )[0] as HTMLDOMElement,
        rhsCol = parentDiv.querySelectorAll(
            '.highcharts-popup-rhs-col'
        )[0] as HTMLDOMElement,
        isEdit = listType === 'edit',
        series = (
            isEdit ?
                chart.series : // EDIT mode
                chart.options.plotOptions || {} // ADD mode
        );

    if (!chart && series) {
        return;
    }

    let item: HTMLDOMElement,
        filteredSeriesArray: Array<FilteredSeries> = [];

    // Filter and sort the series.
    if (!isEdit && !isArray(series)) {
        // Apply filters only for the 'add' indicator list.
        filteredSeriesArray = filterSeries.call(
            this,
            series as any,
            filter
        );
    } else if (isArray(series)) {
        filteredSeriesArray = filterSeriesArray.call(
            this,
            series
        );
    }

    // Sort indicators alphabeticaly.
    stableSort(filteredSeriesArray, (a, b): number => {
        const seriesAName = a.indicatorFullName.toLowerCase(),
            seriesBName = b.indicatorFullName.toLowerCase();

        return (seriesAName < seriesBName) ?
            -1 : (seriesAName > seriesBName) ? 1 : 0;
    });

    // If the list exists remove it from the DOM
    // in order to create a new one with different filters.
    if (lhsCol.children[1]) {
        lhsCol.children[1].remove();
    }

    // Create wrapper for list.
    const indicatorList = createElement(
        'ul',
        {
            className: 'highcharts-indicator-list'
        },
        void 0,
        lhsCol
    );

    const rhsColWrapper = rhsCol.querySelectorAll(
        '.highcharts-popup-rhs-col-wrapper'
    )[0] as HTMLDOMElement;

    filteredSeriesArray.forEach((seriesSet): void => {
        const { indicatorFullName, indicatorType, series } = seriesSet;

        item = createElement(
            'li',
            {
                className: 'highcharts-indicator-list'
            },
            void 0,
            indicatorList
        );
        item.appendChild(doc.createTextNode(
            indicatorFullName
        ));

        ['click', 'touchstart'].forEach((
            eventName: string
        ): void => {
            addEvent(item, eventName, function (): void {
                const button = rhsColWrapper.parentNode
                    .children[1] as HTMLDOMElement;

                addFormFields.call(
                    popup,
                    chart,
                    series,
                    indicatorType,
                    rhsColWrapper
                );
                if (button) {
                    button.style.display = 'block';
                }


                // add hidden input with series.id
                if (isEdit && series.options) {
                    createElement(
                        'input',
                        {
                            type: 'hidden',
                            name: 'highcharts-id-' + indicatorType,
                            value: series.options.id
                        },
                        void 0,
                        rhsColWrapper
                    ).setAttribute(
                        'highcharts-data-series-id',
                        (series as any).options.id
                    );
                }
            });
        });
    });

    // select first item from the list
    if (indicatorList.childNodes.length > 0) {
        (indicatorList.childNodes[0] as HTMLDOMElement).click();
    } else if (!isEdit) {
        AST.setElementHTML(
            rhsColWrapper.parentNode.children[0],
            lang.noFilterMatch || ''
        );
        (rhsColWrapper.parentNode.children[1] as HTMLDOMElement)
            .style.display = 'none';
    }
}

/**
 * Recurent function which lists all fields, from params object and
 * create them as inputs. Each input has unique `data-name` attribute,
 * which keeps chain of fields i.e params.styles.fontSize.
 * @private
 * @param {Highcharts.Chart} chart
 * Chart
 * @param {string} parentNode
 * Name of parent to create chain of names
 * @param {Highcharts.PopupFieldsDictionary<string>} fields
 * Params which are based for input create
 * @param {string} type
 * Indicator type like: sma, ema, etc.
 * @param {Highcharts.HTMLDOMElement} parentDiv
 * Element where created HTML list is added
 */
function addParamInputs(
    this: Popup,
    chart: AnnotationChart,
    parentNode: string,
    fields: PopupFieldsTree,
    type: string,
    parentDiv: HTMLDOMElement
): void {
    if (!chart) {
        return;
    }

    const addInput = this.addInput;

    objectEach(fields, (value, fieldName): void => {
        const predefinedType = annotationsFieldsTypes[fieldName];
        let fieldType = type;

        if (predefinedType) {
            fieldType = predefinedType;
        }

        // create name like params.styles.fontSize
        const parentFullName = parentNode + '.' + fieldName;

        if (
            defined(value) && // skip if field is unnecessary, #15362
            parentFullName
        ) {
            if (isObject(value)) {
                // (15733) 'Periods' has an arrayed value. Label must be
                // created here.
                addInput.call(
                    this,
                    parentFullName,
                    type,
                    parentDiv,
                    {}
                );
                addParamInputs.call(
                    this,
                    chart,
                    parentFullName,
                    value as any,
                    type,
                    parentDiv
                );
            }

            // If the option is listed in dropdown enum,
            // add the selection box for it.
            if (parentFullName in DropdownProperties) {
                // Add selection boxes.
                const selectBox = addSelection.call(
                    this,
                    type,
                    parentFullName,
                    parentDiv
                );

                // Add possible dropdown options.
                addSelectionOptions.call(
                    this,
                    chart,
                    parentNode,
                    selectBox,
                    type,
                    fieldName,
                    value as any
                );
            } else if (
                // Skip volume field which is created by addFormFields.
                parentFullName !== 'params.volumeSeriesID' &&
                !isArray(value) // Skip params declared in array.
            ) {
                addInput.call(
                    this,
                    parentFullName,
                    type,
                    parentDiv,
                    {
                        value: value as any,
                        type: 'number'
                    } // all inputs are text type
                );
            }
        }
    });
}

/**
 * Add searchbox HTML element and its' label.
 *
 * @private
 *
 * @param {Highcharts.AnnotationChart} chart
 *        The chart object.
 *
 * @param {HTMLDOMElement} parentDiv
 *        HTML parent element.
 */
function addSearchBox(
    this: Popup,
    chart: AnnotationChart,
    parentDiv: HTMLDOMElement
): void {
    const popup = this,
        lhsCol = parentDiv.querySelectorAll(
            '.highcharts-popup-lhs-col'
        )[0] as HTMLDOMElement,
        options = 'searchIndicators',
        inputAttributes = {
            value: '',
            type: 'text',
            htmlFor: 'search-indicators',
            labelClassName: 'highcharts-input-search-indicators-label'
        },
        clearFilterText = this.lang.clearFilter,
        inputWrapper = createElement(
            'div',
            {
                className: 'highcharts-input-wrapper'
            },
            void 0,
            lhsCol
        );

    const handleInputChange = function (inputText: string): void {
        // Apply some filters.
        addIndicatorList.call(
            popup,
            chart,
            popup.container,
            'add',
            inputText
        );
    };

    // Add input field with the label and button.
    const input = this.addInput(
            options,
            'input',
            inputWrapper,
            inputAttributes
        ) as HTMLInputElement,
        button = createElement(
            'a',
            {
                textContent: clearFilterText
            },
            void 0,
            inputWrapper
        );

    input.classList.add('highcharts-input-search-indicators');
    button.classList.add('clear-filter-button');

    // Add input change events.
    addEvent(input, 'input', function (e): void {
        handleInputChange(this.value);

        // Show clear filter button.
        if (this.value.length) {
            button.style.display = 'inline-block';
        } else {
            button.style.display = 'none';
        }
    });

    // Add clear filter click event.
    ['click', 'touchstart'].forEach((eventName: string): void => {
        addEvent(button, eventName, function (): void {

            // Clear the input.
            input.value = '';
            handleInputChange('');

            // Hide clear filter button- no longer nececary.
            button.style.display = 'none';
        });
    });
}

/**
 * Add selection HTML element and its' label.
 *
 * @private
 *
 * @param {string} indicatorType
 * Type of the indicator i.e. sma, ema...
 *
 * @param {string} [optionName]
 * Name of the option into which selection is being added.
 *
 * @param {HTMLDOMElement} [parentDiv]
 * HTML parent element.
 */
function addSelection(
    this: Popup,
    indicatorType: string,
    optionName: string,
    parentDiv: HTMLDOMElement
): HTMLSelectElement {
    const optionParamList = optionName.split('.'),
        labelText = optionParamList[optionParamList.length - 1],
        selectName = 'highcharts-' + optionName + '-type-' + indicatorType,
        lang = this.lang;

    // Add a label for the selection box.
    createElement(
        'label', {
            htmlFor: selectName
        },
        null as any,
        parentDiv
    ).appendChild(doc.createTextNode(
        lang[labelText] || optionName
    ));

    // Create a selection box.
    const selectBox = createElement(
        'select',
        {
            name: selectName,
            className: 'highcharts-popup-field',
            id: 'highcharts-select-' + optionName
        },
        null as any,
        parentDiv
    ) as HTMLSelectElement;

    selectBox.setAttribute('id', 'highcharts-select-' + optionName);

    return selectBox;
}

/**
 * Get and add selection options.
 *
 * @private
 *
 * @param {Highcharts.AnnotationChart} chart
 *        The chart object.
 *
 * @param {string} [optionName]
 *        Name of the option into which selection is being added.
 *
 * @param {HTMLSelectElement} [selectBox]
 *        HTML select box element to which the options are being added.
 *
 * @param {string|undefined} indicatorType
 *        Type of the indicator i.e. sma, ema...
 *
 * @param {string|undefined} parameterName
 *        Name of the parameter which should be applied.
 *
 * @param {string|undefined} selectedOption
 *        Default value in dropdown.
 */
function addSelectionOptions(
    this: Popup,
    chart: AnnotationChart,
    optionName: string,
    selectBox: HTMLSelectElement,
    indicatorType?: string,
    parameterName?: string,
    selectedOption?: string,
    currentSeries?: SMAIndicator
): void {

    // Get and apply selection options for the possible series.
    if (optionName === 'series' || optionName === 'volume') {
        // List all series which have id - mandatory for indicator.
        chart.series.forEach((series): void => {
            const seriesOptions = series.options,
                seriesName = seriesOptions.name ||
                (seriesOptions as any).params ?
                    series.name :
                    seriesOptions.id || '';

            if (
                seriesOptions.id !== 'highcharts-navigator-series' &&
                seriesOptions.id !== (
                    currentSeries &&
                    currentSeries.options &&
                    currentSeries.options.id
                )
            ) {
                if (
                    !defined(selectedOption) &&
                    optionName === 'volume' &&
                    series.type === 'column'
                ) {
                    selectedOption = seriesOptions.id;
                }

                createElement(
                    'option',
                    {
                        value: seriesOptions.id
                    },
                    void 0,
                    selectBox
                ).appendChild(doc.createTextNode(seriesName));
            }
        });
    } else if (indicatorType && parameterName) {
        // Get and apply options for the possible parameters.
        const dropdownKey = parameterName + '-' + indicatorType,
            parameterOption = dropdownParameters[dropdownKey];

        parameterOption.forEach((element): void => {
            createElement(
                'option',
                {
                    value: element
                },
                void 0,
                selectBox
            ).appendChild(doc.createTextNode(element));
        });
    }

    // Add the default dropdown value if defined.
    if (defined(selectedOption)) {
        selectBox.value = selectedOption;
    }
}

/**
 * Filter object of series which are not indicators.
 * If the filter string exists, check against it.
 *
 * @private
 *
 * @param {Highcharts.FilteredSeries} series
 *        All series are available in the plotOptions.
 *
 * @param {string|undefined} filter
 *        Applied filter string from the input.
 *        For the first iteration, it's an empty string.
 *
 * @return {Array<Highcharts.FilteredSeries>} filteredSeriesArray
 *         Returns array of filtered series based on filter string.
 */
function filterSeries(
    this: Popup,
    series: Record<string, Series>,
    filter?: string
): Array<FilteredSeries> {
    const popup = this,
        indicators = popup.indicators,
        lang = popup.chart && popup.chart.options.lang,
        indicatorAliases = lang &&
            lang.navigation &&
            lang.navigation.popup &&
            lang.navigation.popup.indicatorAliases,
        filteredSeriesArray: Array<FilteredSeries> = [];

    let filteredSeries: FilteredSeries;

    objectEach(series, (series, value): void => {
        const seriesOptions = series && series.options;
        // Allow only indicators.
        if (
            (series as any).params || seriesOptions &&
            (seriesOptions as any).params
        ) {
            const { indicatorFullName, indicatorType } =
                getNameType(series as any, value);

            if (filter) {
                // Replace invalid characters.
                const validFilter = filter.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

                const regex = new RegExp(validFilter, 'i'),
                    alias = indicatorAliases &&
                        indicatorAliases[indicatorType] &&
                        indicatorAliases[indicatorType].join(' ') || '';

                if (
                    indicatorFullName.match(regex) ||
                    alias.match(regex)
                ) {
                    filteredSeries = {
                        indicatorFullName,
                        indicatorType,
                        series: series as any
                    };

                    filteredSeriesArray.push(filteredSeries);
                }
            } else {
                filteredSeries = {
                    indicatorFullName,
                    indicatorType,
                    series: series as any
                };

                filteredSeriesArray.push(filteredSeries);
            }
        }
    });

    return filteredSeriesArray;
}

/**
 * Filter an array of series and map its names and types.
 *
 * @private
 *
 * @param {Highcharts.FilteredSeries} series
 *        All series that are available in the plotOptions.
 *
 * @return {Array<Highcharts.FilteredSeries>} filteredSeriesArray
 *         Returns array of filtered series based on filter string.
 */
function filterSeriesArray(
    this: Popup,
    series: Array<Series>
): Array<FilteredSeries> {
    const filteredSeriesArray: Array<FilteredSeries> = [];

    // Allow only indicators.
    series.forEach((series): void => {
        if (series.is('sma')) {
            filteredSeriesArray.push({
                indicatorFullName: series.name,
                indicatorType: series.type,
                series: series as SMAIndicator
            });
        }
    });

    return filteredSeriesArray;
}

/**
 * Get amount of indicators added to chart.
 * @private
 * @return {number} - Amount of indicators
 */
function getAmount(this: Chart): number {
    let counter = 0;

    this.series.forEach((serie): void => {
        if (
            (serie as any).params ||
            (serie.options as any).params
        ) {
            counter++;
        }
    });

    return counter;
}

/**
 * Extract full name and type of requested indicator.
 *
 * @private
 *
 * @param {Highcharts.Series} series
 * Series which name is needed(EDITmode - defaultOptions.series,
 * ADDmode - indicator series).
 *
 * @param {string} [indicatorType]
 * Type of the indicator i.e. sma, ema...
 *
 * @return {Highcharts.Dictionary<string>}
 * Full name and series type.
 */
function getNameType(
    series: SMAIndicator,
    indicatorType: string
): IndicatorNameCouple {
    const options = series.options;
    // add mode
    let seriesName = (seriesTypes[indicatorType] &&
            (
                seriesTypes[indicatorType].prototype as SMAIndicator
            ).nameBase) ||
            indicatorType.toUpperCase(),
        seriesType = indicatorType;

    // edit
    if (options && options.type) {
        seriesType = series.options.type as any;
        seriesName = series.name;
    }

    return {
        indicatorFullName: seriesName,
        indicatorType: seriesType
    };
}

/**
 * Create the selection box for the series,
 * add options and apply the default one.
 *
 * @private
 *
 * @param {string} indicatorType
 *        Type of the indicator i.e. sma, ema...
 *
 * @param {string} [optionName]
 *        Name of the option into which selection is being added.
 *
 * @param {Highcharts.AnnotationChart} chart
 *        The chart object.
 *
 * @param {HTMLDOMElement} [parentDiv]
 *        HTML parent element.
 *
 * @param {string|undefined} selectedOption
 *        Default value in dropdown.
 */
function listAllSeries(
    this: Popup,
    indicatorType: string,
    optionName: string,
    chart: AnnotationChart,
    parentDiv: HTMLDOMElement,
    currentSeries: SMAIndicator,
    selectedOption?: string
): void {
    const popup = this,
        indicators = popup.indicators;

    // Won't work without the chart.
    if (!chart) {
        return;
    }

    // Add selection boxes.
    const selectBox = addSelection.call(
        popup,
        indicatorType,
        optionName,
        parentDiv
    );

    // Add possible dropdown options.
    addSelectionOptions.call(
        popup,
        chart,
        optionName,
        selectBox,
        void 0,
        void 0,
        void 0,
        currentSeries
    );

    // Add the default dropdown value if defined.
    if (defined(selectedOption)) {
        selectBox.value = selectedOption;
    }
}

/* *
 *
 *  Default Export
 *
 * */

const PopupIndicators = {
    addForm,
    getAmount
};

export default PopupIndicators;
