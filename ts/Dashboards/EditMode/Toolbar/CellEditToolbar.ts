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

import EditMode from '../EditMode.js';
import Cell from '../../Layout/Cell.js';
import EditGlobals from '../EditGlobals.js';
import MenuItem from '../Menu/MenuItem.js';
import EditToolbar from './EditToolbar.js';
import GUIElement from '../../Layout/GUIElement.js';
import EH from '../../../Shared/Helpers/EventHelper.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge, objectEach } = OH;
const { fireEvent } = EH;

/**
 * @internal
 */
class CellEditToolbar extends EditToolbar {
    /* *
     *
     *  Static Properties
     *
     * */
    protected static readonly defaultOptions: CellEditToolbar.Options = {
        enabled: true,
        className: EditGlobals.classNames.editToolbar,
        outline: false,
        outlineClassName: EditGlobals.classNames.editToolbarCellOutline,
        menu: {
            className: EditGlobals.classNames.editToolbarCell,
            itemsClassName: EditGlobals.classNames.editToolbarItem,
            items: []
        }
    };

    public static getItemsConfig(
        options: EditMode.Options,
        iconURLPrefix: string
    ): MenuItem.Options[] {
        const dragOptions = options.dragDrop?.enabled ?
            [{
                id: 'drag',
                type: 'icon' as const,
                icon: iconURLPrefix + 'drag.svg',
                events: {
                    onmousedown: function (this: MenuItem, e: any): void {
                        const cellEditToolbar = this.menu
                            .parent as CellEditToolbar;
                        const dragDrop = cellEditToolbar.editMode.dragDrop;

                        if (dragDrop && cellEditToolbar.cell) {
                            dragDrop.onDragStart(e, cellEditToolbar.cell);
                        }
                    }
                }
            }] :
            [];

        return [
            ...dragOptions,
            {
                id: 'settings',
                type: 'icon',
                icon: iconURLPrefix + 'settings.svg',
                events: {
                    click: function (this: MenuItem, e: any): void {
                        this.menu.parent.editMode.setEditOverlay();

                        (this.menu.parent as CellEditToolbar).onCellOptions();
                    }
                }
            },
            {
                id: 'destroy',
                type: 'icon',
                className: EditGlobals.classNames.menuDestroy,
                icon: iconURLPrefix + 'destroy.svg',
                events: {
                    click: function (this: MenuItem, e: any): void {
                        const parentNode = this.menu.parent as CellEditToolbar,
                            editMode = this.menu.parent.editMode,
                            popup = editMode.confirmationPopup;

                        popup.show({
                            confirmButton: {
                                value: editMode.lang.confirmButton,
                                callback: parentNode.onCellDestroy,
                                context: parentNode
                            },
                            cancelButton: {
                                value: editMode.lang.cancelButton,
                                callback: (): void => {
                                    popup.closePopup();
                                }
                            },
                            text: editMode.lang.confirmDestroyCell
                        });
                    }
                }
            }
        ];
    }

    /* *
     *
     *  Constructor
     *
     * */

    constructor(editMode: EditMode) {
        super(
            editMode,
            merge(
                CellEditToolbar.defaultOptions,
                (editMode.options.toolbars || {}).cell,
                {
                    menu: {
                        items: CellEditToolbar.getItemsConfig(
                            editMode.options,
                            editMode.iconsURLPrefix
                        )
                    }
                }
            )
        );

        this.menu.initItems({});
    }

    /* *
     *
     *  Properties
     *
     * */
    public cell?: Cell;
    public editedCell?: Cell;

    /* *
     *
     *  Functions
     *
     * */

    public showToolbar(cell: Cell): void {
        const toolbar = this,
            cellCnt = cell.container,
            toolbarWidth = 30,
            toolbarMargin = 10;

        let x, y;

        if (
            cellCnt &&
            toolbar.editMode.isActive() &&
            !(toolbar.editMode.dragDrop || {}).isActive
        ) {
            const cellOffsets = GUIElement.getOffsets(
                cell,
                toolbar.editMode.board.container
            );

            x = cellOffsets.right - toolbarWidth - toolbarMargin;
            y = cellOffsets.top + toolbarMargin;

            // Temp - activate all items.
            objectEach(toolbar.menu.items, (item): void => {
                item.activate();
            });

            toolbar.setPosition(x, y);
            toolbar.cell = cell;
            toolbar.refreshOutline();
        } else if (toolbar.isVisible) {
            toolbar.hide();
        }
    }

    public refreshOutline(): void {
        const toolbar = this,
            offsetWidth = -1;

        if (toolbar.cell && toolbar.cell.container && toolbar.outline) {
            super.refreshOutline(
                -toolbar.cell.container.offsetWidth,
                0,
                this.cell,
                offsetWidth
            );
        }
    }

    public onCellOptions(): void {
        const toolbar = this;

        if (toolbar.editMode.sidebar) {
            toolbar.editMode.sidebar.show(toolbar.cell);

            if (this.cell) {
                this.cell.setHighlight();
            }
        }
    }

    public onCellDestroy(): void {
        const toolbar = this;

        if (toolbar.cell) {
            const row = toolbar.cell.row;

            toolbar.resetEditedCell();
            toolbar.cell.destroy();
            toolbar.cell = void 0;

            // Hide row and cell toolbars.
            toolbar.editMode.hideToolbars(['cell', 'row']);

            // Call cellResize dashboard event.
            if (row && row.cells && row.cells.length) {
                fireEvent(toolbar.editMode.board, 'cellResize', {
                    cell: row.cells[0]
                });
                fireEvent(row, 'cellChange', { cell: row.cells[0], row });
            }
        }
    }

    public resetEditedCell(): void {
        this.editedCell = void 0;
    }
}

namespace CellEditToolbar {
    export interface Options extends EditToolbar.Options {}
}

export default CellEditToolbar;
