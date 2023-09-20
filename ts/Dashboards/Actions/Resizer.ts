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
import type {
    HTMLDOMElement
} from '../../Core/Renderer/DOMElementType';
import type JSON from '../JSON';
import type Cell from '../Layout/Cell.js';
import type Serializable from '../Serializable';
import EditGlobals from '../EditMode/EditGlobals.js';
import GUIElement from '../Layout/GUIElement.js';

import U from '../Utilities.js';

const {
    merge,
    addEvent,
    createElement,
    fireEvent,
    removeEvent,
    pick
} = U;

import EditMode from '../EditMode/EditMode';

/**
 * Class providing a resizing functionality.
 */
class Resizer {
    /* *
    *
    *  Static Properties
    *
    * */

    /**
     * Creates a new instance of the Resizer class based on JSON.
     * @internal
     */
    public static fromJSON(
        editMode: EditMode,
        json: Resizer.JSON
    ): Resizer|undefined {
        return new Resizer(editMode, json.options);
    }

    protected static readonly defaultOptions: Resizer.Options = {
        enabled: true,
        styles: {
            minWidth: 20,
            minHeight: 50
        },
        type: 'xy',
        snap: {
            width: 9,
            height: 17
        }
    };

    /* *
    *
    *  Constructors
    *
    * */

    /**
     * Constructor for the Resizer class.
     *
     * @param {EditMode} editMode
     * The parent editMode reference.
     *
     * @param {Resizer.Options} options
     * Options for the Resizer.
     */
    public constructor(editMode: EditMode, options?: Resizer.Options) {
        this.editMode = editMode;
        this.options = merge(
            {},
            Resizer.defaultOptions,
            editMode.options.resize,
            options
        );

        this.currentCell = void 0;
        this.isX = this.options.type.indexOf('x') > -1;
        this.isY = this.options.type.indexOf('y') > -1;
        this.isActive = false;
        this.startX = 0;
        this.tempSiblingsWidth = [];

        this.addSnaps();
    }

    /* *
    *
    *  Properties
    *
    * */

    /**
     * The editMode reference.
     */
    public editMode: EditMode;

    /**
     * Resizer options.
     */
    public options: Resizer.Options;

    /**
     * Resized element reference.
     */
    public currentCell: Cell|undefined;

    /**
     * Dimension of current resizing (x or y).
     */
    public currentDimension: string|undefined;

    /**
     * Type of resizing.
     */
    public isX: boolean;

    /**
     * Type of resizing.
     */
    public isY: boolean;

    /**
     * Reference to right handler
     */
    public snapRight: HTMLDOMElement|undefined;

    /**
     * Reference to bottom handler
     */
    public snapBottom: HTMLDOMElement|undefined;

    /**
     * Pending resizer flag
     */
    public isActive: boolean;

    /**
     * Reference to start position of resizer
     */
    public startX: number;

    /**
     * Array of siblings which have auto-flex width and we need to apply static
     * width for resizing event. After resizing cells revert widths to auto.
     */
    public tempSiblingsWidth: Array<Cell>;

    /**
     * Reference to ResizeObserver, which allows running 'unobserve'.
     * @internal
     */
    private resizeObserver?: ResizeObserver;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Add Snap - create snaps and add events.
     *
     */
    public addSnaps(): void {
        const iconsURLPrefix = this.editMode.iconsURLPrefix;
        const snapWidth = this.options.snap.width || 0;
        const snapHeight = this.options.snap.height || 0;
        const dashboardContainer = this.editMode.board.container;

        // Right snap
        this.snapRight = createElement(
            'img',
            {
                className: EditGlobals.classNames.resizeSnap + ' ' +
                    EditGlobals.classNames.resizeSnapX,
                src: iconsURLPrefix + 'resize-handle.svg'
            },
            {
                width: snapWidth + 'px',
                height: snapHeight + 'px',
                left: -9999 + 'px'
            },
            dashboardContainer
        );

        // Bottom snap
        this.snapBottom = createElement(
            'img',
            {
                className: EditGlobals.classNames.resizeSnap + ' ' +
                    EditGlobals.classNames.resizeSnapY,
                src: iconsURLPrefix + 'resize-handle.svg'
            },
            {
                width: snapWidth + 'px',
                height: snapHeight + 'px',
                top: -9999 + 'px',
                left: '0px'
            },
            dashboardContainer
        );

        this.addResizeEvents();

    }

    /**
     * Hide snaps
     *
     */
    public disableResizer(): void {

        this.isActive = false;
        this.currentDimension = void 0;
        this.currentCell = void 0;

        if (this.snapRight) {
            this.snapRight.style.left = '-9999px';
        }

        if (this.snapBottom) {
            this.snapBottom.style.left = '-9999px';
        }
    }
    /**
     * Update snap position.
     *
     * @param cell
     * Cell reference
     */
    public setSnapPositions(cell: Cell): void {
        // Set current cell
        this.currentCell = cell;

        // Set position of snaps
        const cellOffsets = GUIElement.getOffsets(
            cell,
            this.editMode.board.container
        );
        const left = cellOffsets.left || 0;
        const top = cellOffsets.top || 0;
        const { width, height } = GUIElement.getDimFromOffsets(cellOffsets);
        const snapWidth = (this.options.snap.width || 0);
        const snapHeight = (this.options.snap.height || 0);

        if (this.snapRight) {
            this.snapRight.style.left = (left + width - snapWidth) + 'px';
            this.snapRight.style.top = top + (
                height / 2
            ) - (snapHeight / 2) + 'px';
        }

        if (this.snapBottom) {
            this.snapBottom.style.top = (top + height - snapHeight) + 'px';
            this.snapBottom.style.left = (
                left + (
                    width / 2
                ) - (snapWidth / 2)
            ) + 'px';
        }
    }

    /**
     * Method detects siblings and auto-width applied by flex. The resizer
     * requires static widths for correct calculations, so we need to apply
     * temporary width on siblings.
     */
    public setTempWidthSiblings(): void {
        const currentCell = this.currentCell;

        if (currentCell) {
            const currentRwdMode = this.editMode.rwdMode,
                cellOffsets = GUIElement.getOffsets(currentCell),
                rowLevelInfo = currentCell.row.getRowLevelInfo(cellOffsets.top),
                rowLevelCells =
                    (rowLevelInfo && rowLevelInfo.rowLevel.cells) || [];

            let cellContainer, cell, optionsWidth;

            for (let i = 0, iEnd = rowLevelCells.length; i < iEnd; ++i) {
                cell = rowLevelCells[i];
                cellContainer = cell.container;
                optionsWidth = pick(
                    ((cell.options.responsive || {})[currentRwdMode] || {})
                        .width,
                    cell.options.width
                );

                // Do not convert width on the current cell and next siblings.
                if (cell === currentCell) {
                    break;
                }

                if (
                    cellContainer &&
                    (!optionsWidth || optionsWidth === 'auto')
                ) {
                    cellContainer.style.flex =
                        '0 0 ' + cellContainer.offsetWidth + 'px';
                    this.tempSiblingsWidth.push(cell);
                }
            }
        }

    }

    /**
     * Revert widths to auto.
     */
    public revertSiblingsAutoWidth(): void {
        const tempSiblingsWidth = this.tempSiblingsWidth;
        let cellContainer, cellResize;

        for (let i = 0, iEnd = tempSiblingsWidth.length; i < iEnd; ++i) {
            cellContainer = tempSiblingsWidth[i].container;

            if (cellContainer) {
                cellContainer.style.flex = '1 1 0%';
                cellResize = tempSiblingsWidth[i];
            }
        }

        this.tempSiblingsWidth = [];

        // Call cellResize dashboard event.
        if (cellResize) {
            fireEvent(this.editMode.board, 'cellResize', {
                cell: cellResize
            });
            fireEvent(cellResize.row, 'cellChange', {
                cell: cellResize,
                row: cellResize.row
            });
        }
    }

    /**
     * Add mouse events to snaps
     *
     */
    public addResizeEvents(): void {
        const resizer = this;
        let mouseDownSnapX,
            mouseDownSnapY,
            mouseMoveSnap,
            mouseUpSnap;

        resizer.mouseDownSnapX = mouseDownSnapX = function (
            e: PointerEvent
        ): void {
            resizer.isActive = true;
            resizer.currentDimension = 'x';
            resizer.editMode.hideToolbars(['row', 'cell']);

            resizer.setTempWidthSiblings();

            resizer.startX = e.clientX;
        };

        resizer.mouseDownSnapY = mouseDownSnapY = function (
            e: PointerEvent
        ): void {
            resizer.isActive = true;
            resizer.currentDimension = 'y';
            resizer.editMode.hideToolbars(['row', 'cell']);
        };

        resizer.mouseMoveSnap = mouseMoveSnap = function (
            e: PointerEvent
        ): void {
            if (resizer.isActive) {
                resizer.onMouseMove(
                    e as PointerEvent
                );
            }
        };

        resizer.mouseUpSnap = mouseUpSnap = function (
            e: PointerEvent
        ): void {
            if (resizer.isActive) {
                resizer.isActive = false;
                resizer.currentDimension = void 0;
                resizer.revertSiblingsAutoWidth();
                resizer.editMode.showToolbars(
                    ['row', 'cell'],
                    resizer.currentCell
                );
                if (resizer.currentCell) {
                    resizer.setSnapPositions(resizer.currentCell);
                }
            }
        };

        // Add mouse events
        addEvent(this.snapRight, 'mousedown', mouseDownSnapX);
        addEvent(this.snapBottom, 'mousedown', mouseDownSnapY);

        addEvent(document, 'mousemove', mouseMoveSnap);
        addEvent(document, 'mouseup', mouseUpSnap);

        // Touch events
        // if (hasTouch) {
        //     addEvent(snapX, 'touchstart', mouseDownSnapX);
        //     addEvent(snapY, 'touchstart', mouseDownSnapY);

        //     if (!rowContainer.hcEvents.mousemove) {
        //         addEvent(rowContainer, 'touchmove', mouseMoveSnap);
        //         addEvent(rowContainer, 'touchend', mouseUpSnap);
        //     }
        // }

        const runReflow = (): void => {
            if (resizer.currentCell) {
                resizer.setSnapPositions(resizer.currentCell);
            }
        };

        if (typeof ResizeObserver === 'function') {
            this.resizeObserver = new ResizeObserver(runReflow);
            this.resizeObserver.observe(resizer.editMode.board.container);
        } else {
            const unbind = addEvent(window, 'resize', runReflow);
            addEvent(this, 'destroy', unbind);
        }
    }
    /**
     * General method used on resizing.
     *
     * @param {global.Event} e
     * A mouse event.
     *
     */
    public onMouseMove(e: PointerEvent): void {
        const currentCell = this.currentCell as Resizer.ResizedCell;
        const cellContainer = currentCell && currentCell.container;
        const currentDimension = this.currentDimension;
        const sidebar = this.editMode.sidebar;
        const currentRwdMode = sidebar && sidebar.editMode.rwdMode;

        if (
            currentCell &&
            cellContainer &&
            !((currentCell.row.layout.board.editMode || {}).dragDrop || {})
                .isActive
        ) {
            const cellOffsets = GUIElement.getOffsets(currentCell);
            const { width: parentRowWidth } = GUIElement.getDimFromOffsets(
                GUIElement.getOffsets(currentCell.row)
            );
            // Resize width
            if (currentDimension === 'x') {
                const newWidth =
                    (Math.min(e.clientX - cellOffsets.left, parentRowWidth) /
                        parentRowWidth) *
                        100 +
                    '%';

                currentCell.setSize(newWidth);
                currentCell.updateSize(newWidth, currentRwdMode);
                this.startX = e.clientX;
            }

            // Resize height
            if (currentDimension === 'y') {
                currentCell.setSize(void 0, e.clientY - cellOffsets.top);
            }
            // Call cellResize dashboard event.
            fireEvent(this.editMode.board, 'cellResize', {
                cell: currentCell
            });
            fireEvent(currentCell.row, 'cellChange', {
                cell: currentCell,
                row: currentCell.row
            });

            this.setSnapPositions(currentCell);
        }
    }

    /**
     * Destroy resizer
     */
    public destroy(): void {
        const snaps = ['snapRight', 'snapBottom'];
        let snap;

        // Unbind events
        removeEvent(document, 'mousemove');
        removeEvent(document, 'mouseup');

        this.resizeObserver?.unobserve(this.editMode.board.container);

        for (let i = 0, iEnd = snaps.length; i < iEnd; ++i) {
            snap = (this as any)[snaps[i]];

            // Unbind event
            removeEvent(snap, 'mousedown');

            // Destroy snap
            snap.remove();
        }
    }
    /**
     * Converts the class instance to a class JSON.
     * @internal
     *
     * @return {Resizer.JSON}
     * Class JSON of this Resizer instance.
     */
    public toJSON(): Resizer.JSON {
        const options = this.options;

        return {
            $class: 'Dashboards.Action.Resizer',
            options: {
                enabled: options.enabled,
                styles: {
                    minWidth: options.styles.minWidth,
                    minHeight: options.styles.minHeight
                },
                type: options.type,
                snap: {
                    width: options.snap.width,
                    height: options.snap.height
                }
            }
        };
    }
}
interface Resizer {
    mouseDownSnapX?: Function;
    mouseDownSnapY?: Function;
    mouseMoveSnap?: Function;
    mouseUpSnap?: Function;
}
namespace Resizer {
    /**
     * Resizer options
     */
    export interface Options {
        /**
         * Weather the resizer is enabled or not.
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/edit-mode/resize-disabled/ | Resize disabled}
         */
        enabled: boolean;
        /**
         * Resizer type.
         */
        type: 'x'|'y'|'xy';
        /**
         * Options for the snap mechanism.
         */
        snap: SnapOptions;
        /**
         * Style of the snap element.
         */
        styles: ElementStyles
    }
    export interface ResizedCell extends Cell {
        resizer?: Snap;
    }


    /**
     * Style of the snap element.
     */
    export interface ElementStyles {
        /**
         * Width of the border on the left side of the element in pixels.
         */
        borderLeft?: number;
        /**
         * Width of the border on the right side of the element in pixels.
         */
        borderRight?: number;
        /**
         * Width of the border on the top side of the element in pixels.
         */
        borderTop?: number;
        /**
         * Width of the border on the bottom side of the element in pixels.
         */
        borderBottom?: number;
        /**
         * Minimum width of the element in pixels.
         */
        minWidth?: number;
        /**
         * Minimum height of the element in pixels.
         */
        minHeight?: number;
    }
    export interface Snap {
        snapX?: HTMLDOMElement|undefined;
        snapY?: HTMLDOMElement|undefined;
    }

    /**
     * Options for the snap mechanism.
     */
    export interface SnapOptions {

        /**
         * Width of the element in pixels.
         */
        width?: number;
        /**
         * Height of the element in pixels.
         */
        height?: number;
    }

    /** @internal */
    export interface HTMLDOMElementEvents extends HTMLDOMElement {
        hcEvents: Record<string, Array<Function>>;
    }

    export interface JSON extends Serializable.JSON<'Dashboards.Action.Resizer'> {
        options: JSONOptions;
    }

    export interface JSONOptions extends JSON.Object {
        enabled: boolean;
        styles: ElementStylesJSON;
        type: 'x'|'y'|'xy';
        snap: SnapJSON;
    }
    export interface SnapJSON extends JSON.Object {
        width?: number;
        height?: number;
    }
    export interface ElementStylesJSON extends JSON.Object {
        borderLeft?: number;
        borderRight?: number;
        borderTop?: number;
        borderBottom?: number;
        minWidth?: number;
        minHeight?: number;
    }

    export interface ResizePointer {
        isVisible: boolean;
        element: HTMLDOMElement;
    }

    export interface CellSiblings {
        prev: Array<Cell>;
        next: Array<Cell>;
    }
}

export default Resizer;
