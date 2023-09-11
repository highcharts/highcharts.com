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

import type CSSJSONObject from '../../CSSJSONObject';
import type EditMode from '../EditMode';

import { HTMLDOMElement } from '../../../Core/Renderer/DOMElementType.js';
import EditGlobals from '../EditGlobals.js';
import U from '../../../Shared/Utilities.js';
import MenuItem from './MenuItem.js';
import MenuItemBindings from './MenuItemBindings.js';
import OH from '../../../Shared/Helpers/ObjectHelper.js';
const { merge } = OH;

const {
    createElement
} = U;

class Menu {
    /* *
    *
    *  Static Properties
    *
    * */

    public static items = MenuItemBindings;

    /* *
    *
    *  Constructor
    *
    * */
    constructor(
        parentElement: HTMLDOMElement,
        options: Menu.Options,
        editMode: EditMode,
        parent?: any
    ) {
        this.parentElement = parentElement;
        this.isVisible = false;
        this.activeItems = [];
        this.options = options;
        this.items = {};
        this.editMode = editMode;

        if (parent) {
            this.parent = parent;
        }

        this.container = this.setContainer();
    }

    /* *
    *
    *  Properties
    *
    * */
    public parentElement: HTMLDOMElement;
    public editMode: EditMode;
    public options: Menu.Options;
    public container: HTMLDOMElement;
    public isVisible: boolean;
    public items: Record<string, MenuItem>;
    public activeItems: Array<MenuItem>;
    public parent: any;
    public currentElementId?: string;

    /* *
    *
    *  Functions
    *
    * */
    private setContainer(): HTMLDOMElement {
        return createElement(
            'div', {
                className: EditGlobals.classNames.menu +
                    ' ' + (this.options.className || '')
            },
            {},
            this.parentElement
        );
    }

    // ItemsSchemas - default items definitions.
    public initItems(
        itemsSchemas: Record<string, MenuItem.Options>,
        activeItems?: boolean
    ): void {
        const menu = this,
            optionsItems = menu.options.items || [];

        let itemSchema,
            itemConfig,
            item,
            options;

        for (let i = 0, iEnd = optionsItems.length; i < iEnd; ++i) {
            itemConfig = optionsItems[i];
            itemSchema =
                typeof itemConfig === 'string' ? itemsSchemas[itemConfig] :
                    itemConfig.id ? itemsSchemas[itemConfig.id] :
                        {};

            options = typeof itemConfig === 'string' ?
                merge(itemSchema, { id: itemConfig }) :
                merge(itemSchema, itemConfig);

            if (options.id) {
                item = new MenuItem(menu, options as MenuItem.Options);

                // Save initialized item.
                menu.items[item.options.id] = item;

                if (activeItems) {
                    item.activate();
                    menu.activeItems.push(item);
                }
            } else {
                // Error - defined item needs an id.
            }
        }
    }

    public setActiveItems(
        items: Array<string>
    ): void {
        const menu = this;

        let item;

        // Deactivate items.
        for (let i = 0, iEnd = menu.activeItems.length; i < iEnd; ++i) {
            if (items.indexOf(menu.activeItems[i].options.id) === -1) {
                menu.activeItems[i].deactivate();
            }
        }
        menu.activeItems.length = 0;

        for (let j = 0, jEnd = items.length; j < jEnd; ++j) {
            item = menu.items[items[j]];

            if (item) {
                // Activate item.
                if (!item.isActive) {
                    item.activate();
                } else {
                    item.update();
                }

                menu.activeItems.push(item);
            }
        }
    }

    public deactivateActiveItems(): void {
        const menu = this;

        for (let i = 0, iEnd = menu.activeItems.length; i < iEnd; ++i) {
            menu.activeItems[i].deactivate();
        }
    }

    public updateActiveItems(): void {
        const activeItems = this.activeItems;

        for (let i = 0, iEnd = activeItems.length; i < iEnd; ++i) {
            activeItems[i].update();
        }
    }

    public destroy(): void {
        this.activeItems.length = 0;
        this.container.remove();
        this.items = {};
        this.options = {};
    }
}

namespace Menu {
    export interface Options {
        /**
         * The class name of the menu's container.
         */
        className?: string;
        /**
         * The list of items in the context menu.
         * @default ['editMode']
         */
        items?: Array<MenuItem.Options|string>;
        /**
         * The class name of the menu's items.
         * Applied to each item in the context menu.
         */
        itemsClassName?: string;
        /**
         * Whether to enable the context menu.
         */
        enabled?: boolean;
    }
}

export default Menu;
