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

import EditGlobals from './EditGlobals.js';
import MenuItem from './Menu/MenuItem.js';
import Menu from './Menu/Menu.js';
import EditMode from './EditMode.js';
import { HTMLDOMElement } from '../../Core/Renderer/DOMElementType.js';
import EH from '../../Shared/Helpers/EventHelper.js';
import OH from '../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;
const { addEvent } = EH;


/**
 * Class to create context menu.
 * @internal
 */
class EditContextMenu extends Menu {
    /* *
    *
    *  Static Properties
    *
    * */
    protected static readonly defaultOptions: EditContextMenu.Options = {
        enabled: true,
        width: 150,
        className: EditGlobals.classNames.contextMenu,
        itemsClassName: EditGlobals.classNames.contextMenuItem,
        items: ['editMode']
    };

    /**
     * Default Context menu items.
     */
    public static items = merge(Menu.items, {
        editMode: {
            id: 'editMode',
            type: 'toggle',
            getValue: function (item: MenuItem): boolean {
                return item.menu.editMode.isActive();
            },
            langKey: 'editMode',
            events: {
                click: function (this: MenuItem): void {
                    (this.menu as EditContextMenu).editMode.onEditModeToggle();
                }
            }
        }
    });

    /* *
     *
     *  Constructor
     *
     * */
    constructor(
        parentElement: HTMLElement,
        options: EditContextMenu.Options,
        editMode: EditMode,
        parent?: HTMLElement
    ) {
        super(
            editMode.board.container,
            merge(EditContextMenu.defaultOptions, options || {}),
            editMode
        );

        this.editMode = editMode;
        this.options = merge(EditContextMenu.defaultOptions, options || {});

        // Set the context menu container width.
        this.container.style.width = this.options.width + 'px';
        super.initItems(EditContextMenu.items);

        if (this.options.items) {
            const items: Array<string> = [];

            for (let i = 0, iEnd = this.options.items.length; i < iEnd; ++i) {
                if (typeof this.options.items[i] === 'string') {
                    items.push(this.options.items[i] as string);
                } else if ((this.options.items[i] as MenuItem.Options).id) {
                    items.push((this.options.items[i] as MenuItem.Options).id);
                }
            }

            this.setActiveItems(items);
        }

        this.initEvents();
    }

    /* *
    *
    *  Properties
    *
    * */
    public editMode: EditMode;
    public options: EditContextMenu.Options;

    /* *
    *
    *  Functions
    *
    * */

    public initEvents(): void {
        const contextMenu = this;

        // Click on document close the context menu
        // TODO refactor
        addEvent(document, 'click', (event): void => {
            if (
                event.target !== this.container &&
                event.target !==
                    contextMenu.editMode.tools.contextButtonElement &&
                !event.target.classList
                    .contains(EditGlobals.classNames.toggleSlider) &&
                event.target.tagName !== 'INPUT' &&
                this.isVisible
            ) {
                this.setVisible(false);
            }
        });
    }

    public setVisible(visible: boolean): void {
        const contextMenu = this;

        if (
            contextMenu.container
        ) {
            if (visible) {
                contextMenu.container.style.display = 'block';
                contextMenu.isVisible = true;
            } else {
                contextMenu.container.style.display = 'none';
                contextMenu.isVisible = false;
            }
        }
    }

    public updatePosition(
        ctxButton?: HTMLDOMElement,
        x?: number,
        y?: number
    ): void {
        const contextMenu = this,
            width = contextMenu.options.width || 0,
            left = (
                ctxButton ?
                    ctxButton.offsetLeft - width + ctxButton.offsetWidth :
                    x
            ),
            top = ctxButton ? ctxButton.offsetTop + ctxButton.offsetHeight : y;

        if (left && top) {
            contextMenu.container.style.left = left + 'px';
            contextMenu.container.style.top = top + 'px';
        }
    }
}

namespace EditContextMenu {
    /**
     * Options for the context menu.
     */
    export interface Options extends Menu.Options {
        /**
         * The icon name.
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/edit-mode/change-ctx-icon/ | Change icon}
         */
        icon?: string;
        /**
         * Width of the context menu.
         *
         * Try it:
         *
         * {@link https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/dashboards/edit-mode/ctx-menu-width/ | Change width}
         */
        width?: number;
    }
}

export default EditContextMenu;
