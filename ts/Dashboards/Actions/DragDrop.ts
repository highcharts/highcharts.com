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
import type { HTMLDOMElement } from '../../Core/Renderer/DOMElementType.js';
import U from '../Utilities.js';
import type Row from '../Layout/Row.js';
import type Cell from '../Layout/Cell.js';
import Globals from '../Globals.js';
import EditGlobals from '../EditMode/EditGlobals.js';
import EditMode from '../EditMode/EditMode.js';
import GUIElement from '../Layout/GUIElement.js';
import ContextDetection from './ContextDetection.js';

const {
    addEvent,
    merge,
    css,
    fireEvent,
    createElement
} = U;

/**
 * Class providing a drag and drop functionality.
 * @internal
 */
class DragDrop {

    /* *
     *
     *  Static Properties
     *
     * */

    protected static readonly defaultOptions: DragDrop.Options = {
        enabled: true,
        rowDropOffset: 30,
        cellDropOffset: 30,
        dropPointerSize: 16
    };

    /* *
     *
     *  Constructors
     *
     * */

    /**
     * Constructor for the DragDrop class.
     * @internal
     *
     * @param {EditMode} editMode
     * The parent editMode reference.
     *
     * @param {DragDrop.Options} options
     * Options for the DragDrop.
     */
    constructor(
        editMode: EditMode,
        options?: DragDrop.Options
    ) {
        this.editMode = editMode;
        this.options = merge(DragDrop.defaultOptions, options);

        this.mockElement = createElement(
            'div',
            { className: EditGlobals.classNames.dragMock },
            {},
            editMode.board.container
        );

        this.dropPointer = {
            isVisible: false,
            align: '',
            element: createElement(
                'div',
                { className: EditGlobals.classNames.dropPointer },
                {},
                editMode.board.container
            )
        };

        this.isActive = false;
        this.initEvents();
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
     * DragDrop options.
     */
    public options: DragDrop.Options;

    /**
     * Dragged element reference.
     */
    public context?: Cell|Row;

    /**
     * Pending drag flag.
     */
    public isActive?: boolean;

    /**
     * Reference to the Cell that is under the dragging mock element.
     */
    public mouseCellContext?: Cell;

    /**
     * Reference to the Row that is under the dragging mock element.
     */
    public mouseRowContext?: Row;

    /**
     * Reference to the element that is used on drop to mount dragged element.
     * In most cases the context is the same as mouseContext. Could be different
     * in nested layout when elements overlap.
     */
    public dropContext?: Cell|Row;

    /**
     * Dragged element mock.
     */
    public mockElement: HTMLDOMElement;

    /**
     * Element to visualize a drop spot.
     */
    public dropPointer: DragDrop.DropPointer;

    /**
     * Function to call when drag ends (when no context).
     */
    public dragEndCallback?: Function;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Method for showing and positioning drop pointer.
     *
     * @param {number} left
     * Drop pointer left position.
     *
     * @param {number} top
     * Drop pointer top position.
     *
     * @param {number} width
     * Drop pointer width.
     *
     * @param {number} height
     * Drop pointer height.
     */
    private showDropPointer(
        left: number,
        top: number,
        width: number,
        height: number
    ): void {
        this.dropPointer.isVisible = true;
        css(this.dropPointer.element, {
            display: 'block',
            left: left + 'px',
            top: top + 'px',
            height: height + 'px',
            width: width + 'px'
        });
    }

    /**
     * Method for hiding drop pointer.
     */
    private hideDropPointer(): void {
        if (this.dropPointer.isVisible) {
            this.dropPointer.isVisible = false;
            this.dropPointer.align = '';
            this.dropPointer.element.style.display = 'none';
        }
    }

    /**
     * Method for positioning drag mock element.
     *
     * @param {PointerEvent} mouseEvent
     * Mouse event.
     */
    public setMockElementPosition(
        mouseEvent: PointerEvent
    ): void {
        const dragDrop = this,
            dashBoundingRect =
                dragDrop.editMode.board.container.getBoundingClientRect(),
            offset = dragDrop.mockElement.clientWidth / 2,
            x = mouseEvent.clientX - dashBoundingRect.left - offset,
            y = mouseEvent.clientY - dashBoundingRect.top - offset;

        css(this.mockElement, { left: x + 'px', top: y + 'px' });
    }

    /**
     * Method for initializing drag drop events.
     */
    public initEvents(): void {
        const dragDrop = this;

        // DragDrop events.
        addEvent(document, 'mousemove', dragDrop.onDrag.bind(dragDrop));
        addEvent(document, 'mouseup', dragDrop.onDragEnd.bind(dragDrop));
    }

    /**
     * General method used on drag start.
     *
     * @param {PointerEvent} e
     * Mouse event.
     *
     * @param {Cell|Row} context
     * Reference to the dragged context.
     *
     * @param {Function} dragEndCallback
     * Callback invoked on drag end.
     */
    public onDragStart(
        e: PointerEvent,
        context?: Cell|Row,
        dragEndCallback?: Function
    ): void {
        this.isActive = true;
        this.editMode.hideToolbars(['cell', 'row']);
        if (this.editMode.resizer) {
            this.editMode.resizer.disableResizer();
        }
        this.setMockElementPosition(e);

        if (context) {
            this.context = context;
            context.hide();

            if (context.getType() === Globals.guiElementType.cell) {
                const draggedCell = context as Cell;

                // Call cellResize board event.
                fireEvent(
                    this.editMode.board,
                    'cellResize',
                    { cell: context }
                );
                fireEvent(
                    draggedCell.row,
                    'cellChange',
                    { cell: context, row: draggedCell.row }
                );
            }
        } else if (dragEndCallback) {
            this.dragEndCallback = dragEndCallback;
        }

        css(this.mockElement, {
            cursor: 'grabbing',
            display: 'block'
        });
    }

    /**
     * General method used while dragging.
     *
     * @param {PointerEvent} e
     * Mouse event.
     */
    public onDrag(e: PointerEvent): void {
        const dragDrop = this;

        if (dragDrop.isActive) {
            e.preventDefault();
            dragDrop.setMockElementPosition(e);

            if (dragDrop.context) {
                if (
                    dragDrop.context.getType() ===
                        Globals.guiElementType.cell
                ) {
                    dragDrop.onCellDrag(e);
                } else if (
                    dragDrop.context.getType() ===
                        Globals.guiElementType.row
                ) {
                    dragDrop.onRowDrag(e);
                }
            } else if (dragDrop.dragEndCallback) {
                dragDrop.onCellDrag(e);
            }
        }
    }

    /**
     * General method used when drag finish.
     */
    public onDragEnd(): void {
        const dragDrop = this;

        if (dragDrop.isActive) {
            dragDrop.isActive = false;
            css(dragDrop.mockElement, {
                cursor: 'grab',
                display: 'none'
            });

            if (dragDrop.context) {
                if (
                    dragDrop.context.getType() ===
                        Globals.guiElementType.cell
                ) {
                    dragDrop.onCellDragEnd();
                } else if (
                    dragDrop.context.getType() ===
                        Globals.guiElementType.row
                ) {
                    dragDrop.onRowDragEnd();
                }

                dragDrop.context = void 0;

                // Show toolbars and snaps.
                if (dragDrop.editMode.editCellContext) {
                    dragDrop.editMode.showToolbars(
                        ['row', 'cell'],
                        dragDrop.editMode.editCellContext
                    );

                    if (dragDrop.editMode.resizer) {
                        dragDrop.editMode.resizer.setSnapPositions(
                            dragDrop.editMode.editCellContext
                        );
                    }
                }
            } else if (dragDrop.dragEndCallback) {
                dragDrop.dragEndCallback(dragDrop.dropContext);
                dragDrop.dragEndCallback = void 0;
                dragDrop.hideDropPointer();
            }
        }
    }

    /**
     * Sets appropriate drop context and refresh drop pointer position when
     * row is dragged or cell is dragged as a row.
     *
     * @param {PointerEvent} e
     * Mouse event.
     *
     * @param {ContextDetection.ContextDetails} contextDetails
     * Context details (cell, side)
     */
    public onRowDrag(
        e: PointerEvent,
        contextDetails?: ContextDetection.ContextDetails
    ): void {
        const dragDrop = this,
            mouseCellContext = dragDrop.mouseCellContext,
            dropPointerSize = dragDrop.options.dropPointerSize,
            offset = dragDrop.options.rowDropOffset;

        let updateDropPointer = false;

        if (mouseCellContext) {
            const context = (
                contextDetails ||
                ContextDetection.getContext(mouseCellContext, e, offset)
            );
            const align = context.side;

            if (
                dragDrop.dropPointer.align !== align ||
                dragDrop.dropContext !== context.cell.row
            ) {
                updateDropPointer = true;
                dragDrop.dropPointer.align = align;
                dragDrop.dropContext = context.cell.row;
            }

            if (align) {
                const dropContextRowOffsets = GUIElement.getOffsets(
                    dragDrop.dropContext,
                    dragDrop.editMode.board.container
                );
                const { width, height } = GUIElement
                    .getDimFromOffsets(dropContextRowOffsets);

                // Update or show drop pointer.
                if (!dragDrop.dropPointer.isVisible || updateDropPointer) {
                    dragDrop.showDropPointer(
                        dropContextRowOffsets.left,
                        dropContextRowOffsets.top + (
                            dragDrop.dropPointer.align === 'bottom' ?
                                height :
                                0
                        ) - dropPointerSize / 2,
                        width,
                        dropPointerSize
                    );
                }
            } else {
                dragDrop.dropContext = void 0;
                dragDrop.hideDropPointer();
            }
        }
    }

    /**
     * Unmounts dropped row and mounts it in a new position.
     */
    public onRowDragEnd(): void {
        const dragDrop = this,
            draggedRow = dragDrop.context as Row,
            dropContext = dragDrop.dropContext as Row;

        if (dragDrop.dropPointer.align) {
            draggedRow.layout.unmountRow(draggedRow);

            // Destroy layout when empty.
            if (draggedRow.layout.rows.length === 0) {
                draggedRow.layout.destroy();
            }

            dropContext.layout.mountRow(
                draggedRow,
                (dropContext.layout.getRowIndex(dropContext) || 0) +
                    (dragDrop.dropPointer.align === 'bottom' ? 1 : 0)
            );

            // Call cellResize board event.
            if (draggedRow.cells[0]) {
                fireEvent(
                    dragDrop.editMode.board,
                    'cellResize',
                    { cell: draggedRow.cells[0] }
                );
                fireEvent(
                    draggedRow,
                    'cellChange',
                    { cell: draggedRow.cells[0], row: draggedRow }
                );
            }
        }

        dragDrop.hideDropPointer();
        draggedRow.show();
    }

    /**
     * Method used as middleware when cell is dragged.
     * Decides where to pass an event depending on the mouse context.
     *
     * @param {PointerEvent} e
     * Mouse event.
     *
     * @param {ContextDetection.ContextDetails} contextDetails
     * Context details (cell, side)
     */
    public onCellDrag(
        e: PointerEvent,
        contextDetails?: ContextDetection.ContextDetails
    ): void {
        const dragDrop = this,
            mouseCellContext = dragDrop.mouseCellContext as Cell,
            offset = dragDrop.options.cellDropOffset;

        if (mouseCellContext || contextDetails) {
            dragDrop.onCellDragCellCtx(
                e,
                contextDetails ||
                ContextDetection.getContext(mouseCellContext, e, offset)
            );
        } else if (dragDrop.mouseRowContext) {
            dragDrop.onCellDragRowCtx(e, dragDrop.mouseRowContext);
        }
    }

    /**
     * Sets appropriate drop context and refreshes the drop pointer
     * position when a cell is dragged and a cell context is detected.
     *
     * @param {PointerEvent} e
     * Mouse event.
     *
     * @param {ContextDetection.ContextDetails} context
     * Context details (cell, side)
     */
    public onCellDragCellCtx(
        e: PointerEvent,
        context: ContextDetection.ContextDetails
    ): void {
        const dragDrop = this,
            dropPointerSize = dragDrop.options.dropPointerSize,
            align = context.side;

        let updateDropPointer = false;

        if (
            dragDrop.dropPointer.align !== align ||
            dragDrop.dropContext !== context.cell
        ) {
            updateDropPointer = true;
            dragDrop.dropPointer.align = align;
            dragDrop.dropContext = context.cell;
        }

        if (align === 'right' || align === 'left') {
            const dropContextOffsets = GUIElement.getOffsets(
                dragDrop.dropContext, dragDrop.editMode.board.container);
            const { width, height } =
                GUIElement.getDimFromOffsets(dropContextOffsets);

            // Update or show drop pointer.
            if (!dragDrop.dropPointer.isVisible || updateDropPointer) {
                const rowLevelInfo =
                        dragDrop.dropContext.row.getRowLevelInfo(e.clientY),
                    pointerHeight = (
                        rowLevelInfo ?
                            (rowLevelInfo.rowLevel.bottom -
                                rowLevelInfo.rowLevel.top) :
                            height
                    );

                dragDrop.showDropPointer(
                    dropContextOffsets.left + (align === 'right' ? width : 0) -
                        dropPointerSize / 2,
                    dropContextOffsets.top,
                    dropPointerSize,
                    pointerHeight
                );
            }
        } else if (align === 'top' || align === 'bottom') {
            const dropContextOffsets =
                    GUIElement.getOffsets(dragDrop.dropContext),
                rowLevelInfo = dragDrop.dropContext.row
                    .getRowLevelInfo(dropContextOffsets.top);

            if (
                rowLevelInfo &&
                (
                    (rowLevelInfo.index === 0 && align === 'top') ||
                    (
                        rowLevelInfo.index ===
                            rowLevelInfo.rowLevels.length - 1 &&
                        align === 'bottom'
                    )
                )
            ) {
                // Checks if a cell is dragged as a row
                // (only when a cell edge is on a row edge)
                dragDrop.onRowDrag(e, context);
            }
        } else {
            dragDrop.dropContext = void 0;
            dragDrop.hideDropPointer();
        }
    }

    /**
     * Sets appropriate drop context and refreshes the drop pointer
     * position when a cell is dragged and a row context is detected.
     *
     * @param {PointerEvent} e
     * Mouse event.
     *
     * @param {Row} mouseRowContext
     * Row context.
     */
    public onCellDragRowCtx(
        e: PointerEvent,
        mouseRowContext: Row
    ): void {
        const dragDrop = this,
            dropPointerSize = dragDrop.options.dropPointerSize,
            rowOffsets = GUIElement.getOffsets(mouseRowContext),
            rowLevelInfo = mouseRowContext.getRowLevelInfo(e.clientY);

        let cell, cellOffsets;

        if (rowLevelInfo) {
            for (
                let i = 0,
                    iEnd = rowLevelInfo.rowLevel.cells.length;
                i < iEnd;
                ++i
            ) {
                cell = rowLevelInfo.rowLevel.cells[i];
                cellOffsets = GUIElement.getOffsets(cell);

                const { width, height } = GUIElement
                        .getDimFromOffsets(cellOffsets),
                    dashOffsets = dragDrop.editMode.board.container
                        .getBoundingClientRect(),
                    levelHeight = (
                        rowLevelInfo.rowLevel.bottom -
                        rowLevelInfo.rowLevel.top
                    );

                if (cell.isVisible) {
                    if (
                        height < 0.8 * levelHeight &&
                        cellOffsets.left <= e.clientX &&
                        cellOffsets.right >= e.clientX
                    ) {
                        if (cellOffsets.top > e.clientY) {
                            // @ToDo - Mouse above the cell.
                        } else if (cellOffsets.bottom < e.clientY) {
                            // Mouse below the cell.
                            dragDrop.showDropPointer(
                                cellOffsets.left - dashOffsets.left,
                                cellOffsets.top - dashOffsets.top + height,
                                width,
                                levelHeight - height
                            );

                            dragDrop.dropPointer.align = 'nestedBottom';
                            dragDrop.dropContext = cell;
                        }

                        i = iEnd; // Stop the loop
                    } else if (
                        (i === 0 && cellOffsets.left > e.clientX) ||
                        (i === iEnd - 1 && cellOffsets.right < e.clientX)
                    ) {
                        if (cellOffsets.left > e.clientX) {
                            // @ToDo - Mouse on the cell left side.
                        } else if (cellOffsets.right < e.clientX) {
                            // Mouse on the cell right side.
                            const pointerWidth =
                                rowOffsets.right - cellOffsets.right;

                            dragDrop.showDropPointer(
                                cellOffsets.left + (
                                    (i === 0 && cellOffsets.left > e.clientX) ?
                                        0 :
                                        width
                                ) - dropPointerSize / 2 - dashOffsets.left,
                                cellOffsets.top - dashOffsets.top,
                                pointerWidth > dropPointerSize ?
                                    pointerWidth :
                                    dropPointerSize,
                                levelHeight || height
                            );

                            dragDrop.dropPointer.align = 'right';
                            dragDrop.dropContext = cell;
                        }

                        i = iEnd; // Stop the loop
                    }
                } else if (!cell.isVisible && cell === dragDrop.context) {
                    // Element is not visible.
                    dragDrop.dropContext = void 0;
                    dragDrop.hideDropPointer();
                }
            }
        }
    }

    /**
     * Unmounts dropped cell and mounts it in a new position.
     * When cell is dragged as a row also creates a new row
     * and mounts cell there.
     *
     * @param {Cell} contextCell
     * Cell used as a dragDrop context.
     */
    public onCellDragEnd(
        contextCell?: Cell
    ): void {
        const dragDrop = this,
            draggedCell = contextCell || dragDrop.context as Cell;

        let dropContext = dragDrop.dropContext;

        if (dragDrop.dropPointer.align && dropContext && draggedCell) {
            draggedCell.row.unmountCell(draggedCell);

            // Destroy row when empty.
            if (draggedCell.row.cells.length === 0) {
                draggedCell.row.destroy();
            }

            if (
                (dragDrop.dropPointer.align === 'top' ||
                dragDrop.dropPointer.align === 'bottom') &&
                dropContext.getType() === Globals.guiElementType.row
            ) {
                dropContext = dropContext as Row;
                const newRow = dropContext.layout.addRow(
                    {},
                    void 0,
                    (dropContext.layout.getRowIndex(dropContext) || 0) +
                        (dragDrop.dropPointer.align === 'bottom' ? 1 : 0)
                );

                newRow.mountCell(draggedCell, 0);
            } else if (
                dragDrop.dropPointer.align === 'nestedBottom' &&
                dropContext.getType() === Globals.guiElementType.cell
            ) {
                // Create nesting.
                const dropContextCell = dropContext as Cell;
                const row = dropContextCell.row;
                const dropContextCellIndex = row.getCellIndex(dropContextCell);
                row.unmountCell(dropContextCell);

                const newCell = row.addCell({
                    id: GUIElement.createElementId('col-nested-'),
                    layout: {
                        rows: [{}, {}]
                    }
                }, void 0, dropContextCellIndex);

                if (newCell.nestedLayout) {

                    newCell.nestedLayout.rows[0].mountCell(dropContextCell);
                    newCell.nestedLayout.rows[1].mountCell(draggedCell);
                }
            } else if (dropContext.getType() === Globals.guiElementType.cell) {
                dropContext = dropContext as Cell;
                dropContext.row.mountCell(
                    draggedCell,
                    (dropContext.row.getCellIndex(dropContext) || 0) +
                        (dragDrop.dropPointer.align === 'right' ? 1 : 0)
                );
            }
        }

        // Call cellResize board event.
        fireEvent(
            dragDrop.editMode.board,
            'cellResize',
            { cell: draggedCell }
        );
        fireEvent(
            draggedCell.row,
            'cellChange',
            { cell: draggedCell, row: draggedCell.row }
        );

        dragDrop.hideDropPointer();
        draggedCell.show();
    }
}

/* *
 *
 *  Class Namespace
 *
 * */

namespace DragDrop {

    /* *
     *
     *  Declarations
     *
     * */

    /**
     * Options for Drag and Drop
     */
    export interface Options {
        /**
         * Offset how far from the cell edge the context (dragged element)
         * should be detectable.
         */
        cellDropOffset: number;
        /**
         * Size of the drop pointer in pixels.
         */
        dropPointerSize: number;
        /**
         * Whether the drag and drop is enabled.
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/edit-mode/dragdrop-disabled/ | Drag drop disabled}
         */
        enabled: boolean;
        /**
         * Offset how far from the row edge the context (dragged element) should
         * be detectable.
         */
        rowDropOffset: number;
    }

    /**
     * @internal
     */
    export interface DropPointer {
        isVisible: boolean;
        element: HTMLDOMElement;
        align: string;
        nested?: boolean;
    }

}

/* *
 *
 *  Default Export
 *
 * */

export default DragDrop;
