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

import type Component from '../Components/Component';
import type CSSJSONObject from '../CSSJSONObject';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type JSON from '../JSON';
import type LayoutType from './Layout';
import type Row from './Row';
import type Serializable from '../Serializable';

import Bindings from '../Actions/Bindings.js';
const { componentFromJSON } = Bindings;
import EditGlobals from '../EditMode/EditGlobals.js';
import Globals from '../Globals.js';
import GUIElement from './GUIElement.js';
import U from '../../Core/Utilities.js';
const {
    merge,
    fireEvent
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * @internal
 **/
class Cell extends GUIElement {

    /* *
     *
     *  Static Properties
     *
     * */

    /** @internal */
    public static fromJSON(
        json: Cell.JSON,
        row?: Row
    ): (Cell|undefined) {
        if (row) {
            const options = json.options;

            let id = options.containerId;

            if (row.layout.copyId) {
                id = id + '_' + row.layout.copyId;
            }

            return new Cell(
                row,
                {
                    id: id,
                    parentContainerId: (row.container && row.container.id) ||
                        options.parentContainerId,
                    mountedComponentJSON: options.mountedComponentJSON,
                    style: options.style,
                    layoutJSON: options.layoutJSON,
                    width: options.width,
                    height: options.height
                }
            );
        }

        return void 0;
    }

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructs an instance of the Cell class.
     *
     * @param {Row} row
     * Reference to the row instance.
     *
     * @param {Cell.Options} options
     * Options for the cell.
     *
     * @param {HTMLElement} cellElement
     * The container of the cell HTML element.
     */
    public constructor(
        row: Row,
        options: Cell.Options,
        cellElement?: HTMLElement
    ) {
        super();

        this.id = options.id;
        this.options = options;
        this.row = row;
        this.isVisible = true;

        // Get parent container
        const parentContainer =
            document.getElementById(options.parentContainerId || '') ||
            row.container;

        const layoutOptions = row.layout.options || {},
            rowOptions = row.options || {},
            cellClassName = layoutOptions.cellClassName || '';

        let cellHeight;

        if (options.height) {
            if (typeof options.height === 'number') {
                cellHeight = options.height + 'px';
            } else {
                cellHeight = options.height;
            }
        }

        this.container = this.getElementContainer({
            render: row.layout.board.guiEnabled,
            parentContainer: parentContainer,
            attribs: {
                id: options.id,
                className: Globals.classNames.cell + ' ' +
                    cellClassName
            },
            element: cellElement,
            elementId: options.id,
            style: merge(
                layoutOptions.style,
                rowOptions.style,
                options.style,
                {
                    height: cellHeight
                }
            )
        });

        // Mount component from JSON.
        if (this.options.mountedComponentJSON) {
            this.mountComponentFromJSON(this.options.mountedComponentJSON);
        }

        // Nested layout
        if (this.options.layout) {
            this.setNestedLayout();
        }
        if (this.options.layoutJSON) {
            const layout = this.row.layout,
                board = layout.board,
                layoutFromJSON = (
                    layout.constructor as typeof LayoutType
                ).fromJSON;

            this.nestedLayout = layoutFromJSON(
                merge(this.options.layoutJSON, {
                    parentContainerId: this.options.id
                }),
                board,
                this
            );
        }
    }

    /* *
    *
    *  Properties
    *
    * */

    /**
     * Cell id.
     */
    public id: string;

    /**
     * The type of GUI element.
     */
    public readonly type? = Globals.guiElementType.cell;

    /**
     * Reference to the row instance.
     */
    public row: Row;

    /**
     * The cell options.
     */
    public options: Cell.Options;

    /**
     * Component mounted in the cell.
     */
    public mountedComponent?: Component;

    /**
     * Layout nested in the cell.
     */
    public nestedLayout?: LayoutType;

    /**
     * Cell highlight flag.
     */
    public isHighlighted?: boolean;

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
     * Create a nested layout in the cell and assign it to the nestedCell
     * property.
     * @internal
     */
    public setNestedLayout(): void {
        const board = this.row.layout.board,
            Layout = (this.row.layout.constructor as typeof LayoutType);
        const optionsGui = board.options.gui;

        this.nestedLayout = new Layout(
            board,
            merge(
                {},
                optionsGui && optionsGui.layoutOptions,
                this.options.layout,
                {
                    parentContainerId: this.options.id
                }
            ),
            this
        );
    }
    /**
     * Mount component from JSON.
     * @internal
     *
     * @param {Component.JSON} [json]
     * Component JSON.
     *
     * @return {boolean}
     * Returns true, if the component created from JSON is mounted,
     * otherwise false.
     */
    public mountComponentFromJSON(
        json: Component.JSON
    ): boolean {
        const cell = this;

        if (cell.id !== json.options.parentElement) {
            json.options.parentElement = cell.id;
        }

        const component = componentFromJSON(json);

        if (component) {
            cell.mountedComponent = component;
            return true;
        }

        return false;
    }

    /**
     * Destroy the element, its container, event hooks
     * and mounted component.
     */
    public destroy(): void {
        const cell = this;
        const { row } = cell;

        // Destroy mounted component.
        cell.mountedComponent?.destroy();

        // If layout exists in the cell - destroy it
        cell.nestedLayout?.destroy();

        row.unmountCell(cell);
        const destroyRow = row.cells?.length === 0;

        super.destroy();

        if (destroyRow) {
            row.destroy();
        }
    }

    /**
     * Converts the class instance to a class JSON.
     * @internal
     *
     * @return {Cell.JSON}
     * Class JSON of this Cell instance.
     */
    public toJSON(): Cell.JSON {
        const cell = this,
            rowContainerId = (cell.row.container || {}).id || '';

        return {
            $class: 'Dashboards.Layout.Cell',
            options: {
                containerId: (cell.container as HTMLElement).id,
                parentContainerId: rowContainerId,
                width: cell.options.width,
                height: cell.options.height,
                mountedComponentJSON:
                    cell.mountedComponent && cell.mountedComponent.toJSON(),
                style: cell.options.style,
                layoutJSON: cell.nestedLayout && cell.nestedLayout.toJSON()
            }
        };
    }

    /**
     * Get the cell's options.
     * @returns
     * The JSON of cell's options.
     *
     * @internal
     *
     */
    public getOptions(): Globals.DeepPartial<Cell.Options> {
        return this.options;
    }

    protected changeVisibility(
        setVisible: boolean = true
    ): void {
        super.changeVisibility(setVisible);

        const cell = this,
            row = cell.row;

        // Change row visibility if needed.
        if (!cell.row.getVisibleCells().length) {
            cell.row.hide();
        } else if (cell.isVisible && !row.isVisible) {
            cell.row.show();
        }

        setTimeout(():void => {
            fireEvent(row, 'cellChange', { row, cell });
        }, 0);
    }

    public getParentCell(
        level: number
    ): (Cell|undefined) {
        const cell = this;

        let parentCell;

        if (level <= cell.row.layout.level) {
            if (cell.row.layout.level === level) {
                return cell;
            }

            if (cell.row.layout.level - 1 >= 0) {
                parentCell = cell.row.layout.parentCell;

                if (parentCell) {
                    return parentCell.getParentCell(level);
                }
            }
        }
    }

    // Method to get array of overlapping levels.
    public getOverlappingLevels(
        align: 'left' | 'right' |'top' |'bottom',
        levelMaxGap: number, // Max distance between levels
        offset?: number // Analyzed cell offset
    ): Array<number> {
        const cell = this,
            parentCell = cell.row.layout.parentCell;

        let levels = [cell.row.layout.level];

        if (parentCell) {
            const cellOffset = offset || GUIElement.getOffsets(cell)[align];
            const parentCellOffset = GUIElement.getOffsets(parentCell)[align];

            if (Math.abs(cellOffset - parentCellOffset) < levelMaxGap) {
                levels = [
                    ...levels,
                    ...parentCell.getOverlappingLevels(
                        align,
                        levelMaxGap,
                        parentCellOffset
                    )
                ];
            }
        }

        return levels;
    }

    /**
     * Set cell size.
     *
     * @param width
     * % value or 'auto' or px
     *
     * @param height
     * value in px
     */
    public setSize(
        width?: (string|number),
        height?: (string|number)
    ): void {
        const cell = this,
            editMode = cell.row.layout.board.editMode;

        if (cell.container) {
            if (width) {
                if (
                    width === 'auto' &&
                    cell.container.style.flex !== '1 1 0%'
                ) {
                    cell.container.style.flex = '1 1 0%';
                } else {
                    const cellWidth = cell.convertWidthToValue(width);

                    if (
                        cellWidth &&
                        cell.container.style.flex !== '0 0 ' + cellWidth
                    ) {
                        cell.container.style.flex = '0 0 ' + cellWidth;
                    }

                    cell.options.width = cellWidth;
                }
            }

            if (height) {
                cell.options.height = cell.container.style.height =
                    height + 'px';
            }

            if (editMode) {
                editMode.hideContextPointer();

                if (
                    editMode.cellToolbar &&
                    editMode.cellToolbar.isVisible
                ) {
                    if (editMode.cellToolbar.cell === cell) {
                        editMode.cellToolbar.showToolbar(cell);
                    } else {
                        editMode.cellToolbar.hide();
                    }
                }
            }

            // Call cellResize board event.
            fireEvent(cell.row.layout.board, 'cellResize', { cell: cell });
            fireEvent(cell.row, 'cellChange', { cell: cell, row: cell.row });
        }
    }

    public setHighlight(remove?: boolean): void {
        const cell = this,
            editMode = cell.row.layout.board.editMode;

        if (cell.container && editMode) {
            const cnt = cell.container,
                isSet = cnt.classList.contains(
                    EditGlobals.classNames.cellEditHighlight
                );

            if (!remove && !isSet) {
                cnt.classList.add(EditGlobals.classNames.cellEditHighlight);
                cell.row.layout.board.container.classList.add(
                    EditGlobals.classNames.dashboardCellEditHighlightActive
                );

                cell.isHighlighted = true;
            } else if (remove && isSet) {
                cnt.classList.remove(EditGlobals.classNames.cellEditHighlight);
                cell.row.layout.board.container.classList.remove(
                    EditGlobals.classNames.dashboardCellEditHighlightActive
                );

                cell.isHighlighted = false;
            }
        }
    }

    /**
     * Sets the active state of the cell and resets the state of other cells.
     */
    public setActiveState(): void {
        const cell = this;

        // Reset other boxes
        cell.row.layout.board.mountedComponents.forEach(
            (mountedComponent): void => {
                if (mountedComponent.cell.container) {
                    // Remove active class
                    mountedComponent.cell.container.classList.remove(
                        Globals.classNames.cellActive
                    );

                    // Remove ARIA attributes for non-active components
                    mountedComponent.cell.container.removeAttribute('tabindex');
                    mountedComponent.cell.container.removeAttribute('role');
                    mountedComponent.cell.container.removeAttribute(
                        'aria-label'
                    );
                    mountedComponent.cell.container.removeAttribute(
                        'aria-current'
                    );
                }
                mountedComponent.component.isActive = false;
            }
        );

        // Apply class and set ARIA attributes
        if (cell.container) {
            cell.container.classList.add(Globals.classNames.cellActive);
            cell.container.setAttribute('tabindex', '0');
            cell.container.setAttribute('role', 'group');
            cell.container.setAttribute('aria-label', 'Selected cell');
            cell.container.setAttribute('aria-current', 'true');
        }
    }

    /**
     * Enables or disables the loading indicator in the cell.
     *
     * @internal
     */
    public setLoadingState(enabled: boolean = true): void {
        this.container?.classList?.toggle(
            Globals.classNames.cellLoading,
            enabled
        );
    }

    private convertWidthToValue(
        width: (number|string)
    ): string {
        if (typeof width === 'number') {
            return width + 'px';
        }
        if (/px/.test(width)) {
            return width;
        }
        return GUIElement.getPercentageWidth(width) || '';
    }

}

/* *
 *
 *  Namespace
 *
 * */

namespace Cell {
    /**
     * Checks if a valid cell instance.
     */
    export function isCell(cell: unknown): cell is Cell {
        return cell instanceof Cell;
    }

    /**
     * Responsive options of the cell.
     *
     * @deprecated
     */
    export interface CellResponsiveOptions {
        /**
         * The width, that should the cell have in the given responsive mode.
         *
         * @deprecated
         *
         */
        width: (string|number);
    }

    /**
     * @internal
     **/
    export interface JSON extends Serializable.JSON<'Dashboards.Layout.Cell'> {
        options: OptionsJSON;
    }

    /**
     * Options for each cell.
     **/
    export interface Options {
        /**
         * Unique cell id.
         **/
        id: string;

        /**
         * Options controlling the edit mode for the cell.
         **/
        editMode?: {
            /**
             * Individual options for the toolbar items.
             **/
            toolbarItems?: {
                /**
                 * Options for the `destroy` toolbar item.
                 */
                destroy: {
                    enabled?: boolean;
                };
                /**
                 * Options for the `settings` toolbar item.
                 */
                drag: {
                    enabled?: boolean;
                };
                /**
                 * Options for the `settings` toolbar item.
                 */
                settings: {
                    enabled?: boolean;
                };
            }
        }
        /**
         * Width of the cell. Can be a percentage value, pixels or a fraction.
         *
         * The fraction converts value into percents like in CSS grid is.
         * For example `1/3` means `33.333%`.
         *
         * @deprecated
         *
         **/
        width?: (string|number);
        /**
         * Height of the cell.
         *
         * @deprecated
         *
         * **/
        height?: (string|number);
        /**
         * CSS styles for cell container.
         **/
        style?: CSSJSONObject;
        /**
         * Id of the container that holds the cell.
         **/
        parentContainerId?: string;
        /**
         * @internal
         **/
        mountedComponentJSON?: Component.JSON;
        /**
         * To create a nested layout, add a layout object to a cell.
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/gui/nested-layout/ | Nested layout}
         **/
        layout?: LayoutType.Options;
        /**
         * To create nested layout from JSON config.
         */
        layoutJSON?: LayoutType.JSON;
        /**
         * Options for responsive design.
         *
         * @deprecated
         **/
        responsive?: Record<string, CellResponsiveOptions>;
    }

    /**
     * @internal
     **/
    export interface OptionsJSON extends JSON.Object {
        width?: (string|number);
        height?: (string|number);
        containerId: string;
        parentContainerId: string;
        mountedComponentJSON?: Component.JSON;
        style?: CSSJSONObject;
        layoutJSON?: LayoutType.JSON;
    }
}

/* *
 *
 *  Default Export
 *
 * */

export default Cell;
