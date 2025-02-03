/* *
 *
 *  (c) 2009-2024 Highsoft AS
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 *  Authors:
 *  Pawel Lysy
 *
 * */

'use strict';

/* *
 *
 *  Imports
 *
 * */
import type ComponentType from '../Components/ComponentType';
import type EditMode from './EditMode';
import type Row from '../Layout/Row';

import AST from '../../Core/Renderer/HTML/AST.js';
import CellHTML from '../Layout/CellHTML.js';
import AccordionMenu from './AccordionMenu.js';
import BaseForm from '../../Shared/BaseForm.js';
import Bindings from '../Actions/Bindings.js';
import Cell from '../Layout/Cell.js';
import EditGlobals from './EditGlobals.js';
import EditRenderer from './EditRenderer.js';
import GUIElement from '../Layout/GUIElement.js';
import Layout from '../Layout/Layout.js';
import U from '../../Core/Utilities.js';
const {
    addEvent,
    createElement,
    fireEvent,
    merge
} = U;

/* *
 *
 *  Class
 *
 * */

/**
 * Class which creates the sidebar and handles its behavior.
 *
 * @internal
 */
class SidebarPopup extends BaseForm {

    public static readonly addRow = {
        text: EditGlobals.lang.sidebar.row,
        onDrop: function (
            sidebar: SidebarPopup,
            dropContext: Cell|Row
        ): Cell|void {

            if (!dropContext) {
                return;
            }

            const row = (
                    dropContext.getType() === 'cell' ?
                        (dropContext as Cell).row :
                        (dropContext as Row)
                ),
                board = row.layout.board,
                newLayoutId = GUIElement.getElementId('layout'),
                cellId = GUIElement.getElementId('cell'),
                layout = new Layout(board, {
                    id: newLayoutId,
                    copyId: '',
                    parentContainerId: board.container.id,
                    rows: [{
                        cells: [{
                            id: cellId
                        }]
                    }],
                    style: {}
                });

            if (layout) {
                board.layouts.push(layout);

                fireEvent(
                    board.editMode,
                    'layoutChanged',
                    {
                        type: 'newLayout',
                        target: layout,
                        board
                    }
                );
            }

            void Bindings.addComponent({
                type: 'HTML',
                cell: cellId,
                className: 'highcharts-dashboards-component-placeholder',
                html: `
                    <h2> Placeholder </h2>
                    <span> This placeholder can be deleted when you add extra
                        components to this row.
                    </span>
                    `
            }, board);

        }
    };

    /* *
     *
     *  Constructor
     *
     * */

    /**
     * Constructor of the SidebarPopup class.
     *
     * @param parentDiv
     * Element to which the sidebar will be appended.
     *
     * @param iconsURL
     * URL to the icons.
     *
     * @param editMode
     * Instance of EditMode.
     */
    constructor(
        parentDiv: HTMLElement,
        iconsURL: string,
        editMode: EditMode
    ) {
        super(parentDiv, iconsURL);

        this.editMode = editMode;

        this.options = merge(
            this.options,
            editMode.options.toolbars?.sidebar || {}
        );

        this.componentsList = this.getComponentsList(
            this.options.components || []
        );

        this.accordionMenu = new AccordionMenu(
            this.iconsURL,
            this.hide.bind(this)
        );
    }

    /* *
     *
     *  Properties
     *
     * */

    /**
     * Reference to the AccordionMenu.
     */
    public accordionMenu: AccordionMenu;

    /**
     * Instance of EditMode.
     */
    public editMode: EditMode;

    /**
     * Options used in the sidebar.
     */
    public options: SidebarPopup.Options = {
        components: ['HTML', 'row', 'Highcharts', 'DataGrid', 'KPI']
    };

    /**
     * Whether the sidebar is visible.
     */
    public isVisible = false;

    /**
     * List of components that can be added to the board.
     */
    private componentsList: Array<SidebarPopup.AddComponentDetails> = [];

    /**
     * Content wrapper for sticking.
     */
    private sidebarWrapper?: HTMLElement;

    /**
     * Content wrapper for the header.
     */
    private headerWrapper?: HTMLElement;

    /* *
     *
     *  Functions
     *
     * */

    /**
     * Function to detect on which side of the screen should the sidebar be.
     *
     * @param context
     * The cell or row which is the context of the sidebar.
     *
     * @returns
     * Whether the sidebar should be on the right side of the screen.
     */
    private detectRightSidebar(context: Cell | CellHTML | Row): boolean {
        const editMode = this.editMode;
        const layoutWrapper = editMode.customHTMLMode ?
            editMode.board.container : editMode.board.layoutsWrapper;

        if (!layoutWrapper) {
            return false;
        }

        return GUIElement.getOffsets(
            context as Cell,
            layoutWrapper
        ).left < ((layoutWrapper.offsetWidth / 2) - 10); // 10 = snap

    }

    /**
     * Function to remove the class names from the sidebar.
     */
    private removeClassNames(): void {
        const classNames = EditGlobals.classNames,
            classList = this.container.classList;

        classList.remove(classNames.editSidebarShow);
        classList.remove(classNames.editSidebarRightShow);
    }

    /**
     * Function to add the class names to the sidebar depending on the position
     * of the sidebar.
     *
     * @param isRightSidebar
     * Whether the sidebar should be on the right side of the screen.
     */
    private addClassNames(isRightSidebar: boolean): void {
        const classList = this.container.classList;

        if (isRightSidebar) {
            classList.add(
                EditGlobals.classNames.editSidebarRight
            );
        } else {
            classList.remove(
                EditGlobals.classNames.editSidebarRight
            );
        }

        setTimeout(():void => {
            classList.add(EditGlobals.classNames[
                isRightSidebar ? 'editSidebarRightShow' : 'editSidebarShow'
            ]
            );
        });
    }

    /**
     * Function to show the sidebar.
     *
     * @param context
     * The cell or row which is the context of the sidebar.
     */
    public show(context?: Cell | CellHTML | Row): void {
        const editMode = this.editMode,
            isRightSidebar = !!(context && this.detectRightSidebar(context));

        this.showPopup(EditGlobals.classNames.editSidebarShow);
        this.addClassNames(isRightSidebar);

        if (editMode.resizer) {
            editMode.resizer.disableResizer();
        }

        // Remove highlight from the row.
        if (
            Cell.isCell(editMode.editCellContext) &&
            editMode.editCellContext.row
        ) {
            editMode.editCellContext.row.setHighlight();
        }

        editMode.hideToolbars(['cell', 'row']);
        editMode.stopContextDetection();

        this.isVisible = true;

        this.generateContent(context);
    }

    public generateContent(context?: Cell | Row | CellHTML): void {
        // Reset
        this.container.innerHTML = AST.emptyHTML;

        // Title
        this.renderHeader(
            context ?
                this.editMode.lang.settings :
                this.editMode.lang.addComponent,
            ''
        );

        // Render content wrapper
        this.sidebarWrapper = createElement(
            'div',
            {
                className: EditGlobals.classNames.editSidebarWrapper
            },
            void 0,
            this.container
        );

        if (!context) {
            this.renderAddComponentsList();
            return;
        }

        this.type = context.getType();

        if (this.type === 'cell-html' || this.type === 'cell') {
            const component = (context as Cell|CellHTML).mountedComponent;
            if (!component) {
                return;
            }
            this.accordionMenu.renderContent(
                this.sidebarWrapper,
                component,
                this.container
            );
        }
    }

    public renderAddComponentsList(): void {
        const sidebar = this;
        const components = this.componentsList;
        let gridElement;

        const gridWrapper = createElement('div', {
            className: EditGlobals.classNames.editGridItems
        }, {}, sidebar.sidebarWrapper);

        for (let i = 0, iEnd = components.length; i < iEnd; ++i) {
            gridElement = createElement(
                'div',
                {},
                {},
                gridWrapper
            );

            // Drag drop new component.
            gridElement.addEventListener('mousedown', (e: Event): void => {
                e.preventDefault();

                const dragDrop = sidebar.editMode.dragDrop;

                if (dragDrop) {

                    // Workaround for Firefox, where mouseleave is not triggered
                    // correctly when dragging.
                    const onMouseMove = (event: MouseEvent): void => {
                        const rect = sidebar.container.getBoundingClientRect();
                        if (
                            event.clientX < rect.left ||
                            event.clientX > rect.right ||
                            event.clientY < rect.top ||
                            event.clientY > rect.bottom
                        ) {
                            sidebar.hide();
                            document.removeEventListener(
                                'mousemove',
                                onMouseMove
                            );
                        }
                    };

                    // Clean up event listeners
                    const onMouseUp = (): void => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };

                    // Add event listeners
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);

                    dragDrop.onDragStart(
                        e as PointerEvent,
                        void 0,
                        (dropContext: Cell|Row): void => {
                            // Add component if there is no layout yet.
                            if (this.editMode.board.layouts.length === 0) {
                                const board = this.editMode.board,
                                    newLayoutId =
                                        GUIElement.getElementId('layout'),
                                    layout = new Layout(board, {
                                        id: newLayoutId,
                                        copyId: '',
                                        parentContainerId: board.container.id,
                                        rows: [{}],
                                        style: {}
                                    });
                                if (layout) {
                                    board.layouts.push(layout);
                                }

                                dropContext = layout.rows[0];
                            }

                            if (!dropContext) {
                                const layouts = sidebar.editMode.board.layouts;
                                dragDrop.dropContext = dropContext =
                                    layouts[layouts.length - 1].addRow(
                                        {},
                                        void 0
                                    );
                            }

                            const newCell =
                                components[i].onDrop(sidebar, dropContext);

                            const unbindLayoutChanged = addEvent(
                                this.editMode,
                                'layoutChanged',
                                (e): void => {
                                    if (newCell && e.type === 'newComponent') {

                                        if (newCell.mountedComponent.chart) {
                                            const unbind = addEvent(
                                                newCell.mountedComponent.chart,
                                                'render',
                                                (): void => {
                                                    sidebar.editMode
                                                        .setEditCellContext(
                                                            newCell
                                                        );
                                                    sidebar.show(newCell);
                                                    newCell.setHighlight();

                                                    unbind();
                                                    unbindLayoutChanged();
                                                }
                                            );
                                        } else {
                                            sidebar.editMode.setEditCellContext(
                                                newCell
                                            );
                                            sidebar.show(newCell);
                                            newCell.setHighlight();
                                        }

                                    }
                                }
                            );

                            // Clean up event listener after drop is complete
                            document.removeEventListener(
                                'mousemove',
                                onMouseMove
                            );
                        }
                    );
                }
            });
            gridElement.innerHTML = components[i].text;
        }
        return;
    }

    public onDropNewComponent(
        dropContext: Cell|Row,
        componentOptions: Partial<ComponentType['options']>
    ): Cell | void {
        const sidebar = this,
            dragDrop = sidebar.editMode.dragDrop;

        if (!dragDrop) {
            return;
        }
        const row = (
                dropContext.getType() === 'cell' ?
                    (dropContext as Cell).row :
                    (dropContext as Row)
            ),
            newCell = row.addCell({
                id: GUIElement.getElementId('col')
            });

        dragDrop.onCellDragEnd(newCell);
        const options = merge(componentOptions, {
            cell: newCell.id
        });

        const componentPromise =
            Bindings.addComponent(options, sidebar.editMode.board, newCell);
        sidebar.editMode.setEditOverlay();

        void (async (): Promise<void> => {
            const component = await componentPromise;
            if (!component) {
                return;
            }

            fireEvent(
                this.editMode,
                'layoutChanged',
                {
                    type: 'newComponent',
                    target: component
                }
            );
        })();

        return newCell;
    }

    /**
     * Function to hide the sidebar.
     */
    public hide(): void {
        const editMode = this.editMode;
        const editCellContext = editMode.editCellContext;

        this.removeClassNames();
        this.container.style.display = 'none';

        // Remove edit overlay if active.
        if (editMode.isEditOverlayActive) {
            editMode.setEditOverlay(true);
        }

        if (Cell.isCell(editCellContext) && editCellContext.row) {
            editMode.showToolbars(['cell', 'row'], editCellContext);
            editCellContext.row.setHighlight();
            editCellContext.setHighlight(true);
        } else if (
            CellHTML.isCellHTML(editCellContext) && editMode.cellToolbar
        ) {
            editMode.cellToolbar.showToolbar(editCellContext);
            editCellContext.setHighlight();
        }

        editMode.isContextDetectionActive = true;
        this.isVisible = false;
    }

    /**
     * Function called when the close button is pressed.
     *
     * @override BaseForm.closeButtonEvents
     */
    public closeButtonEvents(): void {
        if (this.type === 'cell' || this.type === 'cell-html') {
            this.accordionMenu.cancelChanges();
        } else {
            this.hide();
        }
    }

    public renderHeader(title: string, iconURL: string): void {
        if (!this.container) {
            return;
        }

        const headerWrapper = createElement(
            'div',
            {
                className: EditGlobals.classNames.editSidebarHeader
            },
            {},
            this.container
        );
        this.container.appendChild(headerWrapper);

        this.headerWrapper = headerWrapper;

        const icon = EditRenderer.renderIcon(this.headerWrapper, {
            icon: iconURL,
            className: EditGlobals.classNames.editSidebarTitle
        });

        if (icon) {
            icon.textContent = title;
        }

        this.headerWrapper?.appendChild(this.closeButton);
    }

    /**
     * Based on the provided components list, it returns the list of components
     * with its names and functions that are called when the component is
     * dropped.
     *
     * @param components
     * List of components that can be added to the board.
     */
    private getComponentsList(
        components: Array<string>
    ): Array<SidebarPopup.AddComponentDetails> {
        const sidebar = this,
            editMode = sidebar.editMode,
            componentTypes = editMode.board.componentTypes,
            componentList: Array<SidebarPopup.AddComponentDetails> = [];

        components.forEach((componentName: string): void => {
            const component = componentTypes[
                componentName as keyof typeof componentTypes
            ];

            if (component) {
                componentList.push({
                    text: editMode.lang?.sidebar[componentName] ||
                        component.name,
                    onDrop: function (
                        sidebar: SidebarPopup,
                        dropContext: Cell|Row
                    ): Cell|void {
                        const options =
                            component.prototype.getOptionsOnDrop(sidebar);

                        if (options) {
                            return sidebar.onDropNewComponent(
                                dropContext,
                                options
                            );
                        }
                    }
                });
            } else if (componentName === 'row') {
                componentList.push(SidebarPopup.addRow);
            }
        });

        return componentList;
    }

    /**
     * Function to create and add the close button to the sidebar.
     *
     * @param className
     * Class name of the close button.
     * @returns Close button element
     */
    protected addCloseButton(
        className: string = EditGlobals.classNames.popupCloseButton
    ): HTMLElement {
        // Close popup when click outside the popup
        addEvent(document, 'click', (event): void => {
            event.stopPropagation();
            if (
                this.container.style.display === 'block' &&
                !this.container.contains(event.target) &&
                this.container.classList.value.includes('show')
            ) {
                if (this.type === 'cell' || this.type === 'cell-html') {
                    this.accordionMenu.cancelChanges();
                } else {
                    this.hide();
                }
            }
        });

        return super.addCloseButton.call(this, className);
    }

    /**
     * Function that creates the container of the sidebar.
     *
     * @param parentDiv
     * The parent div to which the sidebar will be appended.
     * @param className
     * Class name of the sidebar.
     * @returns The container of the sidebar.
     */
    protected createPopupContainer(
        parentDiv: HTMLElement,
        className = EditGlobals.classNames.editSidebar
    ): HTMLElement {
        return super.createPopupContainer.call(this, parentDiv, className);
    }
}

/* *
 *
 *  Namespace
 *
 * */
namespace SidebarPopup {

    /**
     * Options used to configure the sidebar.
     */
    export interface Options {
        components?: Array<string>;
    }

    /**
     * Contains the name of the component and the function that is called when
     * the component is dropped.
     */
    export interface AddComponentDetails {
        text: string;
        onDrop: Function;
    }
}
/* *
 *
 *  Default Export
 *
 * */

export default SidebarPopup;
