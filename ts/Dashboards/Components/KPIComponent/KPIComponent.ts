/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Sebastian Bochan
 *  - Wojciech Chmiel
 *  - Gøran Slettemark
 *  - Sophie Bremer
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */

import type Board from '../../Board';
import type Cell from '../../Layout/Cell';
import type {
    Chart,
    Options as ChartOptions,
    Highcharts as H
} from '../../Plugins/HighchartsTypes';
import type Options from './KPIComponentOptions';
import type SidebarPopup from '../../EditMode/SidebarPopup';
import type Types from '../../../Shared/Types';

import AST from '../../../Core/Renderer/HTML/AST.js';
import Component from '../Component.js';
import KPISyncs from './KPISyncs/KPISyncs.js';
import KPIComponentDefaults from './KPIComponentDefaults.js';
import Templating from '../../../Core/Templating.js';
const {
    format
} = Templating;
import U from '../../../Core/Utilities.js';
const {
    createElement,
    css,
    defined,
    diffObjects,
    isArray,
    isNumber,
    merge,
    isFunction
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 *
 * Class that represents a KPI component.
 *
 */
class KPIComponent extends Component {

    /* *
     *
     *  Static functions
     *
     * */

    /**
     * Creates component from JSON.
     *
     * @param json
     * Set of component options, used for creating the KPI component.
     *
     * @param cell
     * Instance of cell, where component is attached.
     *
     * @returns
     * KPI component based on config from JSON.
     *
     * @internal
     */
    public static fromJSON(
        json: KPIComponent.ClassJSON,
        cell: Cell
    ): KPIComponent {
        const options = json.options;
        const chartOptions =
            options.chartOptions && JSON.parse(options.chartOptions);
        const subtitle = JSON.parse(options.subtitle || '{}');
        const title = options.title && JSON.parse(options.title);

        return new KPIComponent(
            cell,
            merge(options as any, {
                chartOptions,
                title,
                subtitle
            })
        );
    }

    /* *
     *
     *  Static properties
     *
     * */

    /** @internal */
    public static charter?: H;

    /**
     * Default options of the KPI component.
     */
    public static defaultOptions = merge(
        Component.defaultOptions,
        KPIComponentDefaults
    );

    /**
     * Predefined sync config for the KPI component.
     */
    public static predefinedSyncConfig = KPISyncs;

    /**
     * Default options of the KPI component.
     *
     * @default {
        chart: {
            type: 'spline',
            zooming: {
                mouseWheel: {
                    enabled: false
                }
            }
        },
        title: {
            text: void 0
        },
        xAxis: {
            visible: false
        },
        yAxis: {
            visible: false,
            title: {
                text: null
            }
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        tooltip: {
            outside: true
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                }
            }
        }
    }
     */
    public static defaultChartOptions: Types.DeepPartial<ChartOptions> = {
        chart: {
            type: 'spline',
            zooming: {
                mouseWheel: {
                    enabled: false
                }
            }
        },
        title: {
            text: void 0
        },
        xAxis: {
            visible: false
        } as Types.DeepPartial<ChartOptions['xAxis']>,
        yAxis: {
            visible: false,
            title: {
                text: null
            }
        } as Types.DeepPartial<ChartOptions['yAxis']>,
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        tooltip: {
            outside: true
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                }
            }
        }
    };

    /* *
     *
     *  Properties
     *
     * */

    /**
     * KPI component's options.
     */
    public options: Options;

    /**
     * HTML element where the value is created.
     *
     * @internal
     */
    public value: HTMLElement;

    /**
     * The HTML element where the subtitle is created.
     */
    public subtitle: HTMLElement;

    /**
     * HTML element where the chart is created.
     */
    public chartContainer?: HTMLElement;

    /**
     * Reference to the chart.
     */
    public chart?: Chart;

    /**
     * Previous value of KPI.
     *
     * @internal
     */
    private prevValue?: number;

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Creates a KPI component in the cell.
     *
     * @param cell
     * Instance of cell, where component is attached.
     *
     * @param options
     * The options for the component.
     */
    constructor(
        cell: Cell,
        options: Partial<Options>,
        board?: Board
    ) {
        options = merge(
            KPIComponent.defaultOptions,
            options
        );
        super(cell, options, board);

        this.options = options as Options;

        this.type = 'KPI';

        this.value = createElement(
            'span',
            {
                className: `${options.className}-value`
            },
            {},
            this.contentElement
        );
        this.subtitle = createElement(
            'span',
            {
                className: this.getSubtitleClassName()
            },
            {},
            this.contentElement
        );
    }

    /* *
     *
     *  Functions
     *
     * */

    /** @internal */
    public async load(): Promise<this> {
        await super.load();

        this.linkValueToChart();

        return this;
    }

    public resize(
        width?: number | string | null,
        height?: number | string | null
    ): this {
        super.resize(width, height);

        // Animate
        if (this.chart && this.chart.container) {
            this.chart.reflow();
        }

        return this;
    }


    public render(): this {
        super.render();
        this.updateElements();

        const charter = KPIComponent.charter?.Chart;

        if (
            charter &&
            this.options.chartOptions &&
            !this.chart
        ) {
            if (!this.chartContainer) {
                this.chartContainer = createElement(
                    'div',
                    {
                        className: `${this.options.className}-chart-container`
                    }, {
                        // Fix inner height, when using flex box
                        padding: '0.1px'
                    },
                    this.contentElement
                );
            }

            this.chart = charter.chart(
                this.chartContainer,
                merge(
                    KPIComponent.defaultChartOptions,
                    this.options.chartOptions
                ) as Partial<ChartOptions>
            );
        } else if (
            this.chart &&
            !this.options.chartOptions &&
            'chartOptions' in this.options
        ) {
            this.chart.destroy();
            this.chart = void 0;
        }

        this.sync.start();
        this.emit({ type: 'afterRender' });
        return this;
    }

    /**
     * Handles updating via options.
     *
     * @param options
     * The options to apply.
     */
    public async update(
        options: Partial<Options>,
        shouldRerender: boolean = true
    ): Promise<void> {
        await super.update(options);

        if (options.chartOptions && this.chart) {
            this.chart.update(options.chartOptions);
        }

        shouldRerender && this.render();
    }

    /**
     * @internal
     */
    public onTableChanged(): void {
        this.setValue();
    }

    /**
     * Destroys the highcharts component.
     */
    public destroy(): void {
        // Cleanup references in the global Highcharts scope
        this.chart?.destroy();
        super.destroy();
    }

    /**
     * Calculates value sum based on the provided values.
     *
     * @param values
     * All particular column values.
     *
     * @returns
     * The calculated sum value.
     *
     * @internal
     */
    private calculateSumValue(values: number[]): number {
        let calculatedValue = 0;

        for (let i = 0; i < values.length; i++) {
            const value = values[i];

            if (isNumber(value)) {
                calculatedValue += value;
            }
        }

        return calculatedValue;
    }

    /**
     * Calculates value average based on the provided values.
     *
     * @param values
     * All particular column values.
     *
     * @returns
     * The calculated average value.
     *
     * @internal
     */
    private calculateAverageValue(values: number[]): number {
        const valueSum = this.calculateSumValue(values);
        return valueSum / values.length;
    }

    /**
     * Calculates value median based on the provided values.
     *
     * @param values
     * All particular column values.
     *
     * @returns
     * The calculated median value.
     *
     * @internal
     */
    private calculateMedianValue(values: number[]): number {
        const sortedValues = Array.from(values).sort((a, b): number => a - b);
        const middleValue = Math.floor(sortedValues.length / 2);
        const middleSortedValue = sortedValues[middleValue];

        return sortedValues.length % 2 === 0 ?
            (sortedValues[middleValue - 1] + middleSortedValue) / 2 :
            middleSortedValue;
    }

    /**
     * Gets the proper calculation value, according to the provided
     * calculateValueAs option.
     *
     * @returns
     * The calculated value or 0 if can't perform the calculation. Can be a 
     * number internally, or a string from the callback function.
     *
     * @internal
     */
    private getCalculatedValue(): string|number {
        const calculateValueAs = this.options.calculateValueAs;

        const connector = this.getFirstConnector();
        const table = connector?.table.modified;
        const column = table?.getColumn(this.options.columnName);
        
        // Parse into numerical values to perform calculations.
        const parsedColumnValues =
            column?.map((value): number => Number(value));

        let calculatedValue: string|number = 0;

        // Provide external calculations without a strict type checking.
        if (defined(parsedColumnValues) && isFunction(calculateValueAs)) {
            calculatedValue = calculateValueAs.call(this, parsedColumnValues);

        // Make sure all values are numbers to perform accurate calculations.
        } else if (parsedColumnValues?.every(isNumber)) {
            if (calculateValueAs === 'sum') {
                calculatedValue = this.calculateSumValue(parsedColumnValues);

            } else if (calculateValueAs === 'average') {
                calculatedValue =
                    this.calculateAverageValue(parsedColumnValues);

            } else if (calculateValueAs === 'median') {
                calculatedValue = this.calculateMedianValue(parsedColumnValues);

            } else {
                console.warn('Invalid calculate option value provided.'); // eslint-disable-line no-console
            }
        } else {
            console.warn('All column values should be numerical to calculate.'); // eslint-disable-line no-console
        }

        return calculatedValue;
    }

    /**
     * Gets the default value that should be displayed in the KPI.
     *
     * @returns
     * The value that should be displayed in the KPI.
     */
    private getValue(): string|number|undefined {
        if (defined(this.options.value)) {
            return this.options.value;
        }

        const connector = this.getFirstConnector();

        if (connector && this.options.columnName) {
            if (defined(this.options.calculateValueAs)) {
                return this.getCalculatedValue();
            }
            
            const table = connector.table.modified,
                column = table.getColumn(this.options.columnName),
                length = column?.length || 0;

            return table.getCellAsString(this.options.columnName, length - 1);
        }
    }

    /**
     * Sets the value that should be displayed in the KPI.
     *
     * @param value
     * The value to display in the KPI.
     */
    public setValue(value: number|string|undefined = this.getValue()): void {
        const {
            valueFormat,
            valueFormatter
        } = this.options;

        if (defined(value)) {
            let prevValue: number | undefined;
            if (isNumber(+value)) {
                prevValue = +value;
            }

            if (valueFormatter) {
                value = valueFormatter.call(this, value);
            } else if (valueFormat) {
                value = format(valueFormat, { value });
            } else if (isNumber(value)) {
                value = value.toLocaleString();
            }

            AST.setElementHTML(this.value, '' + value);
            this.linkValueToChart(prevValue);

            this.prevValue = prevValue;
        }
    }

    /**
     * Handles updating chart point value.
     *
     * @internal
     */
    public linkValueToChart(
        value: number|string|undefined = this.getValue()
    ): void {
        const chart = this.chart;
        const linkedValueTo = this.options.linkedValueTo;

        if (
            !chart || !linkedValueTo.enabled ||
            !defined(value) || !isNumber(+value)
        ) {
            return;
        }

        value = +value;

        const targetSeries = chart.series[linkedValueTo.seriesIndex ?? 0],
            targetPoint = targetSeries?.points[linkedValueTo.pointIndex ?? 0];

        if (targetSeries) {
            if (targetPoint) {
                targetPoint.update({
                    y: value
                });
                return;
            }

            targetSeries.addPoint({
                y: value
            });
            return;
        }

        chart.addSeries({
            data: [{
                y: value
            }]
        });
    }

    /**
     * Handles updating elements via options
     *
     * @internal
     */
    private updateElements(): void {
        const {
            style,
            subtitle
        } = this.options;

        this.setValue();

        AST.setElementHTML(this.subtitle, this.getSubtitle());
        if (style) {
            css(this.element, style);
        }
        if (typeof subtitle === 'object') {
            if (subtitle.style) {
                css(this.subtitle, subtitle.style);
            }
            this.subtitle.className = this.getSubtitleClassName();
        }

        if (this.chartContainer) {
            this.chartContainer.style.flex =
                this.options.chartOptions ? '1' : '0';
        }

        if (this.chart) {
            this.chart.reflow();
        }

        this.value.style.color = this.getValueColor();
    }

    /**
     * Gets KPI subtitle text.
     *
     * @returns
     * The subtitle's text.
     *
     * @internal
     */
    private getSubtitle(): string {
        const {
            subtitle,
            value
        } = this.options;

        if (typeof subtitle === 'string') {
            return subtitle;
        }

        if (subtitle) {
            if (isNumber(this.prevValue) && isNumber(value)) {
                const diff = value - this.prevValue;
                let prefix = '';

                if (diff > 0) {
                    prefix = '<span style="color:green">&#9650;</span> +';
                } else if (diff < 0) {
                    prefix = '<span style="color:red">&#9660;</span> ';
                } else {
                    return this.subtitle.innerHTML;
                }

                if (subtitle.type === 'diff') {
                    return prefix + diff.toLocaleString();
                }
                if (subtitle.type === 'diffpercent') {
                    return prefix + format('{v:,.2f}%', {
                        v: diff / this.prevValue * 100
                    });
                }
            }
            return subtitle.text || '';
        }
        return '';
    }

    /**
     * Gets CSS class name of the KPI subtitle.
     *
     * @returns
     * The name of class.
     *
     * @internal
     */
    private getSubtitleClassName(): string {
        const { subtitle } = this.options;
        return `${Component.defaultOptions.className}-subtitle` +
            ((typeof subtitle === 'object' && subtitle.className) || '');
    }

    /**
     * Applies title's color according to the threshold.
     *
     * @returns
     * Hex of color.
     *
     * @internal
     */
    private getValueColor(): string {
        const {
            threshold,
            thresholdColors,
            value
        } = this.options;

        if (thresholdColors && threshold && isNumber(value)) {
            if (isArray(threshold)) {
                for (let i = threshold.length - 1; i >= 0; i--) {
                    if (value >= threshold[i]) {
                        if (i + 1 < thresholdColors.length) {
                            return thresholdColors[i + 1];
                        }
                        return thresholdColors[thresholdColors.length - 1];
                    }
                }
            } else if (value >= threshold) {
                return thresholdColors[1];
            }
            return thresholdColors[0];
        }
        return '';
    }

    public getOptionsOnDrop(sidebar: SidebarPopup): Partial<Options> {
        const connectorsIds =
            sidebar.editMode.board.dataPool.getConnectorIds();
        let options: Partial<Options> = {
            cell: '',
            type: 'KPI'
        };

        if (connectorsIds.length) {
            options = {
                ...options,
                connector: {
                    id: connectorsIds[0]
                }
            };
        }

        return options;
    }

    /**
     * Converts the class instance to a class JSON.
     *
     * @returns
     * Class JSON of this Component instance.
     *
     * @internal
     */
    public toJSON(): KPIComponent.ClassJSON {
        const base = super.toJSON();
        const json: KPIComponent.ClassJSON = {
            ...base,
            type: 'KPI',
            options: {
                ...base.options,
                type: 'KPI',
                value: this.options.value,
                subtitle: JSON.stringify(this.options.subtitle),
                title: JSON.stringify(this.options.title),
                threshold: this.options.threshold,
                thresholdColors: this.options.thresholdColors,
                chartOptions: JSON.stringify(this.options.chartOptions),
                valueFormat: this.options.valueFormat
            }
        };

        this.emit({ type: 'toJSON', json: base });

        return json;
    }

    /**
     * Get the KPI component's options.
     * @returns
     * The JSON of KPI component's options.
     *
     * @internal
     *
     */
    public getOptions(): Partial<Options> {
        return {
            ...diffObjects(this.options, KPIComponent.defaultOptions),
            type: 'KPI'
        };
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace KPIComponent {

    /* *
    *
    *  Declarations
    *
    * */

    /** @internal */
    export type ComponentType = KPIComponent;

    /** @internal */
    export interface ClassJSON extends Component.JSON {
        options: ComponentJSONOptions;
    }

    /** @internal */
    export interface ComponentJSONOptions extends Component.ComponentOptionsJSON {
        title?: string;
        chartOptions?: string;
        threshold?: number|Array<number>;
        thresholdColors?: Array<string>;
        type: 'KPI';
        value?: number|string;
        subtitle?: string;
        valueFormat?: string;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default KPIComponent;
