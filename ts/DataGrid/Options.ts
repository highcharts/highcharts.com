/* *
 *
 *  DataGrid options
 *
 *  (c) 2020-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  - Dawid Dragula
 *  - Sebastian Bochan
 *
 * */

/* *
 *
 *  Imports
 *
 * */

import type A11yOptions from './Accessibility/A11yOptions';
import type DataTable from '../Data/DataTable';
import type DataTableOptions from '../Data/DataTableOptions';
import type Cell from './Table/Cell';
import type Column from './Table/Column';
import type Validator from './Table/ColumnTypes/Validator';


/* *
 *
 *  Declarations
 *
 * */

/**
 * The distribution of the columns in the grid structure.
 */
export type ColumnDistribution = 'full' | 'fixed';

/**
 * Callback function to be called when a cell event is triggered.
 */
export type CellEventCallback = (this: Cell) => void;

/**
 * Callback function to be called when a column event is triggered.
 */
export type ColumnEventCallback = (this: Column) => void;

/**
 * Callback function to be called when a header event is triggered. Returns a
 * formatted cell's string.
 */
export type CellFormatterCallback = (this: Cell) => string;

/**
 * Column sorting order type.
 */
export type ColumnSortingOrder = 'asc' | 'desc' | null;

/**
 * Data types of the column cells.
 */
export type ColumnDataType = 'string' | 'number' | 'bool' | 'date';


/**
 * Options to control the content and the user experience of a grid structure.
 */
export interface Options {

    /**
     * Accessibility options for the datagrid.
     */
    accessibility?: A11yOptions.GeneralA11yOptions;

    /**
     * Options for the table caption.
     */
    caption?: CaptionOptions;

    /**
     * Default options for all the columns in the datagrid. Can be overridden
     * by individual column options.
     */
    columnDefaults?: ColumnOptions;

    /**
     * Options for individual columns.
     */
    columns?: Array<IndividualColumnOptions>;

    /**
     * Options for the credits label.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/credits | Credits options}
     */
    credits?: CreditsOptions;

    /**
     * Data table with the data to display in the grid structure.
     */
    dataTable?: DataTable | DataTableOptions;

    /**
     * Options for the description of the datagrid.
     */
    description?: DescriptionOptions;

    /**
     * Events options triggered by the datagrid elements.
     */
    events?: DataGridEvents;

    /**
     * Defines the structure of levels in header. Used for grouping columns
     * headers.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/grouped-headers | Grouped headers}
     */
    header?: Array<GroupedHeaderOptions|string>;

    /**
     * The unique id of the datagrid. It is generated automatically, if not set.
     */
    id?: string;

    /**
     * Language options for the datagrid.
     */
    lang?: LangOptions;

    /**
     * Options to control the way datagrid is rendered.
     */
    rendering?: RenderingSettings;
}

/**
 * Options to control the way datagrid is rendered.
 */
export interface RenderingSettings {
    /**
     * Options to control the columns rendering.
     */
    columns?: ColumnsSettings;

    /**
     * Options to control the rows rendering.
     */
    rows?: RowsSettings;

    /**
     * Options to control the header rendering.
     */
    header?: HeaderSettings;

    /**
     * Options to control the table rendering.
     */
    table?: TableSettings;

    /**
     * The theme of the DataGrid. It will set the class name on the container.
     * Can be set to the empty string to disable the theme.
     *
     * @default 'hcdg-theme-default'
     */
    theme?: string;
}

export interface ColumnsSettings {
    /**
     * The distribution of the columns. If `full`, the columns will be
     * distributed so that the first and the last column are at the edges of
     * the grid. If `fixed`, the columns will have a fixed width in pixels.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/fixed-distribution | Fixed distribution}
     *
     * @default 'full'
     */
    distribution?: ColumnDistribution;

    /**
     * Columns included in the grid structure- contains the columns IDs.
     * If not set, all columns will be included. Useful when many columns needs
     * to be excluded from the grid.
     *
     * Individual column options `enabled` options can be set to `false` to
     * disable a column.
     *
     * @private
     */
    included?: Array<string>;
}

export interface RowsSettings {
    /**
     * Buffer of rows to render outside the visible area from the top and from
     * the bottom while scrolling. The bigger the buffer, the less flicker will
     * be seen while scrolling, but the more rows will have to be rendered.
     *
     * Cannot be lower than 0.
     *
     * @default 10
     */
    bufferSize?: number;

    /**
     * Defines the minimum height of the table body (`tbody`) based on the
     * number of rows that should be visible in the viewport.
     *
     * If set to `null`, the minimum height will not be enforced.
     *
     * It's ignored when height of the container is set or the `min-height`
     * style is set on the `tbody` by the user.
     *
     * @default 2
     */
    minVisibleRows?: number | null;

    /**
     * Whether the height of the rows should be calculated automatically based
     * on the content of the cells. If `true`, the ellipsis will be used to
     * indicate that the content is too long to fit in the cell.
     *
     * When there is no need to have different row heights, it is recommended
     * to set this option to `true` for the performance reasons, to avoid the
     * unnecessary calculations.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/strict-row-heights | Strict row heights}
     *
     * @default false
     */
    strictHeights?: boolean;

    /**
     * Rows virtualization option render rows that are visible in the viewport
     * only. In case of large data set, the enabled option improve performance
     * and saves memory.
     *
     * @default true
     */
    virtualization?: boolean;
}

/**
 * Options to control the header rendering.
 */
export interface HeaderSettings {
    /**
     * Whether the header should be rendered.
     *
     * @default true
     */
    enabled?: boolean;
}

/**
 * Options to control the table rendering.
 */
export interface TableSettings {
    /**
     * The custom CSS class name for the table.
     */
    className?: string;
}

/**
 * Column options that can be shared between columns but can be set for each
 * column individually.
 */
export interface ColumnOptions {

    /**
     * Options for all cells in the column.
     */
    cells?: ColumnCellOptions;

    /**
     * Options for all the header cells in the column.
     */
    header?: ColumnHeaderOptions;

    /**
     * Column sorting options.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/sorting-options | Sorting options}
     */
    sorting?: ColumnSortingOptions;

    /**
     * Whether the columns should be resizable. It does not affect individual
     * column settings.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/column-resizing-disabled | Column resize disabled}
     *
     * @default true
     */
    resizing?: boolean;

    /**
     * The data type of the column. Can be one of `string`, `number`, `boolean`
     * or `date`.
     *
     * TODO: Add default (?)
     * If not set, the data type is inferred from the first cell in the column.
     * If the cell is empty, the default type is `string`.
     */
    dataType?: ColumnDataType;

    /**
     * Validation options for the column.
     *
     * If not set, the validation rules are applied according to the data type.
     */
    validationRules?: (Validator.RuleKey|Validator.RuleDefinition)[];
}

/**
 * Options for all cells in the column.
 */
export interface ColumnCellOptions {

    /**
     * Allows to define an additional class name to all table cells in the
     * column. Applied only to cell that are in the table, not in the column
     * header. It is updated with every cell's value change.
     *
     * It uses templating, where context is the table cell instance.
     *
     * @default undefined
     */
    className?: string;

    /**
     * Whether to make the column cells editable `true`, or read-only `false`.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/overview | Editable columns disabled}
     *
     * @default true
     */
    editable?: boolean;

    /**
     * The format of the cell content within the given column of the datagrid.
     * Applied only to cell that are in the table, not in the column header.
     *
     * When not set, the default format `'{value}'` is used.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-formatting/ | Cell formatting}
     *
     * @default undefined
     */
    format?: string;

    /**
     * Callback function for formatting cells within the given column of the
     * datagrid. Applied only to cell that are in the table not the column
     * header.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-formatting/ | Cell formatting}
     *
     * @return
     * A string to be set as a table cell's content.
     */
    formatter?: CellFormatterCallback;
}

/**
 * Options for the header cells in the columns.
 */
export interface ColumnHeaderOptions {

    /**
     * Allows user to define an additional class name only to the column header.
     *
     * It uses templating, where context is the header cell instance.
     *
     * @default undefined
     */
    className?: string;

    /**
     * The format of the column header. Use `{id}` to display the column id.
     */
    format?: string;

    /**
     * Callback function for formatting the column header. It is called for each
     * column header cell.
     *
     * @return
     * A string to be set as a header cell's content.
     */
    formatter?: CellFormatterCallback;
}

/**
 * Column sorting options avalable for applying to all columns at once.
 */
export interface ColumnSortingOptions {
    /**
     * Whether to allow users to sort values in column. When it is enabled,
     * the column header will be clickable.
     *
     * When sorting is disabled `false`, this column cannot be sorted by the
     * user interface. However, the order of rows in this column may still
     * change when other columns are sorted.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/sorting-options | Sorting options}
     *
     * @default true
     */
    sortable?: boolean;
}

/**
 * Column sorting options that can be set for each column individually.
 */
export interface IndividualColumnSortingOptions extends ColumnSortingOptions {
    /**
     * The initial sorting order of the column. Can be either `asc` for
     * ascending, `desc` for descending, or `null` for disabled.
     *
     * @default null
     */
    order?: ColumnSortingOrder;
}

/**
 * Column options that can be set for each column individually.
 */
export interface IndividualColumnOptions extends ColumnOptions {
    /**
     * The custom CSS class name for the column. Applied also to cells that are
     * in the table and also to the column header cells.
     *
     * It does not use templating.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/demo/datagrid-custom-class | Custom class}
     *
     * @default undefined
     */
    className?: string;

    /**
     * Whether the column is enabled and should be displayed. If `false`, the
     * column will not be rendered.
     *
     * Shorter way to disable multiple columns at once is to use the `included`
     * array in the `columns` settings.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/overview | Disabled meta column}
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * The id of the column in the data table for which the options are applied.
     */
    id: string;

    sorting?: IndividualColumnSortingOptions;

    /**
     * @internal
     * @private
     */
    resizing?: boolean;
}

export interface CaptionOptions {
    /**
     * The custom CSS class name for the table caption.
     */
    className?: string;

    /**
     * The caption of the datagrid.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/overview | Caption}
     */
    text?: string;
}

export interface DescriptionOptions {
    /**
     * The custom CSS class name for the description.
     */
    className?: string;

    /**
     * The description of the datagrid.
     */
    text?: string;
}

/**
 * Events options.
 */
export interface DataGridEvents {
    /**
     * Events related to the cells.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-events/ | Datagrid events}
     */
    cell?: CellEvents;

    /**
     * Events related to the column.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-events/ | Datagrid events}
     */
    column?: ColumnEvents

    /**
     * Events related to the header.
     *
     * Try it: {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/data-grid/basic/cell-events/ | Datagrid events}
     */
    header?: HeaderEvents
}

/**
 * Events related to the cells.
 */
export interface CellEvents {
    /**
     * Callback function to be called when the cell is clicked.
     */
    click?: CellEventCallback;

    /**
     * Callback function to be called when the cell is double clicked.
     */
    dblClick?: CellEventCallback;

    /**
     * Callback function to be called when the cell is hovered.
     */
    mouseOver?: CellEventCallback;

    /**
     * Callback function to be called when the cell is no longer hovered.
     */
    mouseOut?: CellEventCallback;

    /**
     * Callback function to be called after editing of cell value.
     */
    afterEdit?: CellEventCallback;

    /**
     * Callback function to be called after the cell value is set (on init or
     * after editing).
     */
    afterSetValue?: CellEventCallback;
}

/**
 * Event callbacks option group related to the column.
 */
export interface ColumnEvents {
    /**
     * Callback function to be called when the column is sorted for instance,
     * after clicking on header.
     */
    afterSorting?: ColumnEventCallback;

    /**
     * Callback function to be called when the column is resized.
     */
    afterResize?: ColumnEventCallback;
}

export interface HeaderEvents {
    /**
     * Callback function to be called when the header is clicked.
     */
    click?: ColumnEventCallback;
}

/**
 * Options to control the structure of table header.
 */
export interface GroupedHeaderOptions {

    /**
     * Accessibility options for one of the column header cells.
     */
    accessibility?: A11yOptions.HeaderCellA11yOptions;

    /**
     * The format of the column header. Use `{id}` to display the column id.
     */
    format?: string;

    /**
     * The custom CSS class name for the header.
     */
    className?: string;

    /**
     * The id of column with data.
     */
    columnId?: string;

    /**
     * Current level of header in the whole header tree.
     * @internal
     * @private
     */
    level?: number;

    /**
     * Columns that are displayed below the header.
     */
    columns?: GroupedHeaderOptions[];
}

/**
 * Options for the credits label.
 */
export interface CreditsOptions {
    /**
     * Whether to show the credits.
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * The URL that will be opened when the credits label is clicked.
     *
     * @default 'https://www.highcharts.com?credits'
     */
    href?: string;

    /**
     * The text for the credits label.
     *
     * @default 'Highcharts.com'
     */
    text?: string;

    /**
     * The position of the credits label.
     *
     * @default 'bottom'
     */
    position?: 'bottom' | 'top';
}

/**
 * Language options for the datagrid.
 */
export interface LangOptions {

    /**
     * Configure the accessibility strings in the chart.
     */
    accessibility?: A11yOptions.LangAccessibilityOptions;

    /**
     * The text to display when there is no data to show.
     *
     * @default 'No data to display'
     */
    noData?: string;
}


/* *
 *
 *  Default Export
 *
 * */

export default Options;
