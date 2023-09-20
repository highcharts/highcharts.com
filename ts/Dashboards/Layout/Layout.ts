/* *
 *
 *  (c) 2009 - 2023 Highsoft AS
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

import type CSSJSONObject from '../CSSJSONObject';
import type Board from '../Board.js';
import type JSON from '../JSON';
import type Serializable from '../Serializable';

import DU from '../Utilities.js';
const { uniqueKey } = DU;
import U from '../Utilities.js';
const {
    pick,
    defined
} = U;

import Cell from './Cell.js';
import Row from './Row.js';
import GUIElement from './GUIElement.js';
import Globals from '../Globals.js';

/**
 * @internal
 **/
class Layout extends GUIElement {
    /* *
    *
    *  Static Properties
    *
    * */

    /** @internal */
    public static fromJSON(
        json: Layout.JSON,
        board: Board,
        parentCell?: Cell
    ): Layout|undefined {
        const options = json.options,
            // Check if layout container exists.
            container = document.getElementById(json.options.containerId),
            layout = new Layout(
                board,
                {
                    id: options.containerId,
                    copyId: container ? uniqueKey() : '',
                    parentContainerId:
                        options.parentContainerId || board.container.id,
                    rowsJSON: options.rows,
                    style: options.style
                },
                parentCell
            );

        // Save layout in the dashboard.
        if (layout && !parentCell) {
            board.layouts.push(layout);
        }

        return layout;
    }

    /** @internal */
    public static importLocal(
        id: string,
        board: Board
    ): Layout|undefined {
        const layoutOptions = localStorage.getItem(
            Globals.classNamePrefix + id
        );

        let layout;

        if (layoutOptions) {
            layout = Layout.fromJSON(JSON.parse(layoutOptions), board);
        }

        return layout;
    }

    /* *
    *
    *  Constructor
    *
    * */

    /**
     * Constructs an instance of the Layout class.
     *
     * @param {Dashboard} board
     * Reference to the dashboard instance.
     *
     * @param {Layout.Options} options
     * Options for the layout.
     */
    public constructor(
        board: Board,
        options: Layout.Options,
        parentCell?: Cell
    ) {
        super();

        this.board = board;
        this.rows = [];
        this.options = options;
        this.isVisible = true;

        // Get parent container
        const parentContainer = parentCell ? parentCell.container :
            document.getElementById(
                options.parentContainerId || ''
            ) || board.layoutsWrapper;

        // Set layout level.
        if (parentCell) {
            this.parentCell = parentCell;
            this.level = parentCell.row.layout.level + 1;
        } else {
            this.level = 0;
        }

        // GUI structure
        if (options.copyId) {
            this.copyId = options.copyId;
        }

        const layoutOptions = (this.options || {}),
            layoutClassName = layoutOptions.rowClassName || '';

        this.container = this.getElementContainer({
            render: board.guiEnabled,
            parentContainer: parentContainer,
            attribs: {
                id: options.id + (this.copyId ? '_' + this.copyId : ''),
                className: Globals.classNames.layout + ' ' +
                    layoutClassName
            },
            elementId: options.id,
            style: this.options.style
        });

        // Init rows from options.
        if (this.options.rows) {
            this.setRows();
        }

        // Init rows from JSON.
        if (options.rowsJSON && !this.rows.length) {
            this.setRowsFromJSON(options.rowsJSON);
        }
    }

    /* *
    *
    *  Properties
    *
    * */

    /**
     * Reference to the dashboard instance.
     */
    public board: Board;

    /**
     * Array of the layout rows.
     */
    public rows: Array<Row>;

    /**
     * The type of GUI element.
     */
    public readonly type = Globals.guiElementType.layout;
    /**
     * The layout options.
     */
    public options: Layout.Options;

    public copyId?: string;

    public level: number;

    public parentCell?: Cell;

    /**
     * HTML container of a GUIElement.
     */
    public container: HTMLElement;

    /* *
    *
    *  Functions
    *
    * */

    /**
     * Set the layout rows using rows options or rowClassName.
     */
    public setRows(): void {
        const layout = this,
            rowsElements = pick(
                layout.options.rows,
                layout.container && layout.container.getElementsByClassName(
                    layout.options.rowClassName || ''
                )
            ) || [];

        let rowElement,
            i, iEnd;

        for (i = 0, iEnd = rowsElements.length; i < iEnd; ++i) {
            rowElement = rowsElements[i];
            layout.addRow(
                layout.board.guiEnabled ? rowElement : {},
                rowElement instanceof HTMLElement ? rowElement : void 0
            );
        }
    }

    /** @internal */
    public setRowsFromJSON(
        json: Array<Row.JSON>
    ): void {
        const layout = this;

        let row;

        for (let i = 0, iEnd = json.length; i < iEnd; ++i) {
            row = Row.fromJSON(json[i], layout);

            if (row) {
                layout.rows.push(row);
            }
        }
    }

    /**
     * Add a new Row instance to the layout rows array.
     *
     * @param {Row.Options} options
     * Options of a row.
     *
     * @param {HTMLElement} rowElement
     * The container for a new row HTML element.
     *
     * @return {Row}
     * Returns the Row object.
     */
    public addRow(
        options: Row.Options,
        rowElement?: HTMLElement,
        index?: number
    ): Row {
        const layout = this,
            row = new Row(layout, options, rowElement);

        if (!defined(index)) {
            layout.rows.push(row);
        } else {
            layout.mountRow(row, index);
        }

        // Set editMode events.
        if (layout.board.editMode) {
            layout.board.editMode.setRowEvents(row);
        }

        return row;
    }

    /**
     * Destroy the element, its container, event hooks
     * and inner rows.
     */
    public destroy(): void {
        const layout = this;

        for (let i = layout.board.layouts.length - 1; i >= 0; i--) {
            if (layout.board.layouts[i] === layout) {
                layout.board.layouts.splice(i, 1);
            }
        }

        // Destroy rows.
        for (let i = layout.rows.length - 1; i >= 0; i--) {
            layout.rows[i].destroy();
        }

        if (layout.parentCell) {
            layout.parentCell.destroy();
        }

        super.destroy();
    }

    /**
     * Export layout's options and save in the local storage
     * @internal
     */
    public exportLocal(): void {
        localStorage.setItem(
            Globals.classNamePrefix + this.options.id,
            JSON.stringify(this.toJSON())
        );
    }

    // Get row index from the layout.rows array.
    public getRowIndex(
        row: Row
    ): number | undefined {
        for (let i = 0, iEnd = this.rows.length; i < iEnd; ++i) {
            if (this.rows[i] === row) {
                return i;
            }
        }
    }

    // Add cell to the layout.rows array and move row container.
    public mountRow(
        row: Row,
        index: number
    ): void {
        const nextRow = this.rows[index],
            prevRow = this.rows[index - 1];

        if (row.container) {
            if (nextRow && nextRow.container) {
                nextRow.container.parentNode.insertBefore(
                    row.container,
                    nextRow.container
                );
            } else if (prevRow && prevRow.container) {
                prevRow.container.parentNode.insertBefore(
                    row.container,
                    prevRow.container.nextSibling
                );
            }

            this.rows.splice(index, 0, row);
            row.layout = this;
        }
    }

    // Remove row from the layout.rows array.
    public unmountRow(
        row: Row
    ): void {
        const rowIndex = this.getRowIndex(row);

        if (defined(rowIndex)) {
            this.rows.splice(rowIndex, 1);
        }
    }

    public getVisibleRows(): Array<Row> {
        const rows = [];

        for (let i = 0, iEnd = this.rows.length; i < iEnd; ++i) {
            if (this.rows[i].isVisible) {
                rows.push(this.rows[i]);
            }
        }

        return rows;
    }

    protected changeVisibility(
        setVisible: boolean = true
    ): void {
        const layout = this;

        super.changeVisibility(setVisible);

        // Change parentCell visibility.
        if (layout.parentCell) {
            if (layout.isVisible && !layout.parentCell.isVisible) {
                layout.parentCell.show();
            } else if (!layout.isVisible && layout.parentCell.isVisible) {
                layout.parentCell.hide();
            }
        }
    }

    /**
     * Converts the class instance to a class JSON.
     * @internal
     *
     * @return {Layout.JSON}
     * Class JSON of this Layout instance.
     */
    public toJSON(): Layout.JSON {
        const layout = this,
            dashboardContainerId = (layout.board.container || {}).id || '',
            rows = [];

        // Get rows JSON.
        for (let i = 0, iEnd = layout.rows.length; i < iEnd; ++i) {
            rows.push(layout.rows[i].toJSON());
        }

        return {
            $class: 'Dashboards.Layout',
            options: {
                containerId: (layout.container as HTMLElement).id,
                parentContainerId: dashboardContainerId,
                rows: rows,
                style: layout.options.style
            }
        };
    }

    /**
     * Get the layout's options.
     * @returns
     * The JSON of layout's options.
     *
     * @internal
     *
     */
    public getOptions(): Globals.DeepPartial<Layout.Options> {
        const layout = this,
            rows = [];

        // Get rows JSON.
        for (let i = 0, iEnd = layout.rows.length; i < iEnd; ++i) {
            rows.push(layout.rows[i].getOptions());
        }

        return {
            id: this.options.id,
            layoutClassName: this.options.layoutClassName,
            rowClassName: this.options.rowClassName,
            cellClassName: this.options.cellClassName,
            style: this.options.style,
            rows
        };
    }
}

interface Layout {
    options: Layout.Options;
}


namespace Layout {
    /**
     * @internal
     **/
    export interface JSON extends Serializable.JSON<'Dashboards.Layout'> {
        options: OptionsJSON;
    }

    /**
     * Each layout's options.
     **/
    export interface Options {
        /**
         * Unique id of the layout.
         **/
        id?: string;
        /**
         * Id of the parent container.
         * @internal
         **/
        parentContainerId?: string;
        /**
         * @internal
         **/
        copyId?: string;
        /**
         * The class name of the layout container.
         **/
        layoutClassName?: string;
        /**
         * The class name applied to each row that is in that exact layout.
         * Note that the layout container is also treated as a row thus this
         * class is also being applied to the layout container.
         **/
        rowClassName?: string;
        /**
         * The class name applied to each cell that is in that exact layout.
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/gui/cell-class-name/ | Set cell class names}
         **/
        cellClassName?: string;
        /**
         * An array of rows. Each row can contain an array of cells.
         **/
        rows?: Array<Row.Options>;
        /**
         * CSS styles of the layout.
         **/
        style?: CSSJSONObject;
        /**
         * @internal
         **/
        rowsJSON?: Array<Row.JSON>;
    }

    /**
     * @internal
     **/
    export interface OptionsJSON extends JSON.Object {
        containerId: string;
        parentContainerId: string;
        rows: Array<Row.JSON>;
        style?: CSSJSONObject;
    }
}

export default Layout;
